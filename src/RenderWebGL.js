const EventEmitter = require('events');

const hull = require('hull.js');
const twgl = require('twgl.js');

const Drawable = require('./Drawable');
const Rectangle = require('./Rectangle');
const ShaderManager = require('./ShaderManager');
const RenderConstants = require('./RenderConstants');
const SVGSkin = require('./SVGSkin');
const log = require('./util/log');

const __candidatesBounds = new Rectangle();
const __touchingColor = new Uint8ClampedArray(4);
const __blendColor = new Uint8ClampedArray(4);

// More pixels than this and we give up to the GPU and take the cost of readPixels
// Width * Height * Number of drawables at location
const __cpuTouchingColorPixelCount = 4e4;

/**
 * @callback RenderWebGL#idFilterFunc
 * @param {int} drawableID The ID to filter.
 * @return {bool} True if the ID passes the filter, otherwise false.
 */

/**
 * Maximum touch size for a picking check.
 * @todo Figure out a reasonable max size. Maybe this should be configurable?
 * @type {Array<int>}
 * @memberof RenderWebGL
 */
const MAX_TOUCH_SIZE = [3, 3];

/**
 * Passed to the uniforms for mask in touching color
 */
const MASK_TOUCHING_COLOR_TOLERANCE = 2;

/**
 * Determines if the mask color is "close enough" (only test the 6 top bits for
 * each color).  These bit masks are what scratch 2 used to use, so we do the same.
 * @param {Uint8Array} a A color3b or color4b value.
 * @param {Uint8Array} b A color3b or color4b value.
 * @returns {boolean} If the colors match within the parameters.
 */
const maskMatches = (a, b) => (
    // has some non-alpha component to test against
    a[3] > 0 &&
    (a[0] & 0b11111100) === (b[0] & 0b11111100) &&
    (a[1] & 0b11111100) === (b[1] & 0b11111100) &&
    (a[2] & 0b11111100) === (b[2] & 0b11111100)
);

/**
 * Determines if the given color is "close enough" (only test the 5 top bits for
 * red and green, 4 bits for blue).  These bit masks are what scratch 2 used to use,
 * so we do the same.
 * @param {Uint8Array} a A color3b or color4b value.
 * @param {Uint8Array} b A color3b or color4b value / or a larger array when used with offsets
 * @param {number} offset An offset into the `b` array, which lets you use a larger array to test
 *                  multiple values at the same time.
 * @returns {boolean} If the colors match within the parameters.
 */
const colorMatches = (a, b, offset) => (
    (a[0] & 0b11111000) === (b[offset + 0] & 0b11111000) &&
    (a[1] & 0b11111000) === (b[offset + 1] & 0b11111000) &&
    (a[2] & 0b11110000) === (b[offset + 2] & 0b11110000)
);

/**
 * Sprite Fencing - The number of pixels a sprite is required to leave remaining
 * onscreen around the edge of the staging area.
 * @type {number}
 */
const FENCE_WIDTH = 15;


class RenderWebGL extends EventEmitter {
    /**
     * Check if this environment appears to support this renderer before attempting to create an instance.
     * Catching an exception from the constructor is also a valid way to test for (lack of) support.
     * @param {canvas} [optCanvas] - An optional canvas to use for the test. Otherwise a temporary canvas will be used.
     * @returns {boolean} - True if this environment appears to support this renderer, false otherwise.
     */
    static isSupported (optCanvas) {
        try {
            // Create the context the same way that the constructor will: attributes may make the difference.
            return !!RenderWebGL._getContext(optCanvas || document.createElement('canvas'));
        } catch (e) {
            return false;
        }
    }

    /**
     * Ask TWGL to create a rendering context with the attributes used by this renderer.
     * @param {canvas} canvas - attach the context to this canvas.
     * @returns {WebGLRenderingContext} - a TWGL rendering context (backed by either WebGL 1.0 or 2.0).
     * @private
     */
    static _getContext (canvas) {
        return twgl.getWebGLContext(canvas, {alpha: false, stencil: true});
    }

    /**
     * Create a renderer for drawing Scratch sprites to a canvas using WebGL.
     * Coordinates will default to Scratch 2.0 values if unspecified.
     * The stage's "native" size will be calculated from the these coordinates.
     * For example, the defaults result in a native size of 480x360.
     * Queries such as "touching color?" will always execute at the native size.
     * @see RenderWebGL#setStageSize
     * @see RenderWebGL#resize
     * @param {canvas} canvas The canvas to draw onto.
     * @param {int} [xLeft=-240] The x-coordinate of the left edge.
     * @param {int} [xRight=240] The x-coordinate of the right edge.
     * @param {int} [yBottom=-180] The y-coordinate of the bottom edge.
     * @param {int} [yTop=180] The y-coordinate of the top edge.
     * @constructor
     * @listens RenderWebGL#event:NativeSizeChanged
     */
    constructor (canvas, xLeft, xRight, yBottom, yTop) {
        super();

        /** @type {WebGLRenderingContext} */
        const gl = this._gl = RenderWebGL._getContext(canvas);
        if (!gl) {
            throw new Error('Could not get WebGL context: this browser or environment may not support WebGL.');
        }

        /** @type {RenderWebGL.UseGpuModes} */
        this._useGpuMode = RenderWebGL.UseGpuModes.Automatic;

        /** @type {Drawable[]} */
        this._allDrawables = [];

        /** @type {Skin[]} */
        this._allSkins = [];

        /** @type {Array<int>} */
        this._drawList = [];

        // A list of layer group names in the order they should appear
        // from furthest back to furthest in front.
        /** @type {Array<String>} */
        this._groupOrdering = [];

        /**
         * @typedef LayerGroup
         * @property {int} groupIndex The relative position of this layer group in the group ordering
         * @property {int} drawListOffset The absolute position of this layer group in the draw list
         * This number gets updated as drawables get added to or deleted from the draw list.
         */

        // Map of group name to layer group
        /** @type {Object.<string, LayerGroup>} */
        this._layerGroups = {};

        /** @type {int} */
        this._nextDrawableId = RenderConstants.ID_NONE + 1;

        /** @type {int} */
        this._nextSkinId = RenderConstants.ID_NONE + 1;

        /** @type {ShaderManager} */
        this._shaderManager = new ShaderManager(gl);

        /** @type {module:twgl/m4.Mat4} */
        this._projection = twgl.m4.identity();

        /** @type {HTMLCanvasElement} */
        this._tempCanvas = document.createElement('canvas');

        /** @type {any} */
        this._regionId = null;

        /** @type {function} */
        this._exitRegion = null;

        /** @type {Array.<snapshotCallback>} */
        this._snapshotCallbacks = [];

        this._createGeometry();

        this.on(RenderConstants.Events.NativeSizeChanged, this.onNativeSizeChanged);

        this.setBackgroundColor(1, 1, 1);
        this.setStageSize(xLeft || -240, xRight || 240, yBottom || -180, yTop || 180);
        this.resize(this._nativeSize[0], this._nativeSize[1]);

        gl.disable(gl.DEPTH_TEST);
        /** @todo disable when no partial transparency? */
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    }

    /**
     * @returns {WebGLRenderingContext} the WebGL rendering context associated with this renderer.
     */
    get gl () {
        return this._gl;
    }

    /**
     * @returns {HTMLCanvasElement} the canvas of the WebGL rendering context associated with this renderer.
     */
    get canvas () {
        return this._gl && this._gl.canvas;
    }

    /**
     * Set the physical size of the stage in device-independent pixels.
     * This will be multiplied by the device's pixel ratio on high-DPI displays.
     * @param {int} pixelsWide The desired width in device-independent pixels.
     * @param {int} pixelsTall The desired height in device-independent pixels.
     */
    resize (pixelsWide, pixelsTall) {
        const pixelRatio = window.devicePixelRatio || 1;
        this._gl.canvas.width = pixelsWide * pixelRatio;
        this._gl.canvas.height = pixelsTall * pixelRatio;
    }

    /**
     * Set the background color for the stage. The stage will be cleared with this
     * color each frame.
     * @param {number} red The red component for the background.
     * @param {number} green The green component for the background.
     * @param {number} blue The blue component for the background.
     */
    setBackgroundColor (red, green, blue) {
        this._backgroundColor = [red, green, blue, 1];
    }

    /**
     * Tell the renderer to draw various debug information to the provided canvas
     * during certain operations.
     * @param {canvas} canvas The canvas to use for debug output.
     */
    setDebugCanvas (canvas) {
        this._debugCanvas = canvas;
    }

    /**
     * Control the use of the GPU or CPU paths in `isTouchingColor`.
     * @param {RenderWebGL.UseGpuModes} useGpuMode - automatically decide, force CPU, or force GPU.
     */
    setUseGpuMode (useGpuMode) {
        this._useGpuMode = useGpuMode;
    }

    /**
     * Set logical size of the stage in Scratch units.
     * @param {int} xLeft The left edge's x-coordinate. Scratch 2 uses -240.
     * @param {int} xRight The right edge's x-coordinate. Scratch 2 uses 240.
     * @param {int} yBottom The bottom edge's y-coordinate. Scratch 2 uses -180.
     * @param {int} yTop The top edge's y-coordinate. Scratch 2 uses 180.
     */
    setStageSize (xLeft, xRight, yBottom, yTop) {
        this._xLeft = xLeft;
        this._xRight = xRight;
        this._yBottom = yBottom;
        this._yTop = yTop;

        // swap yBottom & yTop to fit Scratch convention of +y=up
        this._projection = twgl.m4.ortho(xLeft, xRight, yBottom, yTop, -1, 1);

        this._setNativeSize(Math.abs(xRight - xLeft), Math.abs(yBottom - yTop));
    }

    /**
     * @return {Array<int>} the "native" size of the stage, which is used for pen, query renders, etc.
     */
    getNativeSize () {
        return [this._nativeSize[0], this._nativeSize[1]];
    }

    /**
     * Set the "native" size of the stage, which is used for pen, query renders, etc.
     * @param {int} width - the new width to set.
     * @param {int} height - the new height to set.
     * @private
     * @fires RenderWebGL#event:NativeSizeChanged
     */
    _setNativeSize (width, height) {
        this._nativeSize = [width, height];
        this.emit(RenderConstants.Events.NativeSizeChanged, {newSize: this._nativeSize});
    }

    /**
     * Create a new SVG skin.
     * @param {!string} svgData - new SVG to use.
     * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
     * skin will be used
     * @returns {!int} the ID for the new skin.
     */
    createSVGSkin (svgData, rotationCenter) {
        const skinId = this._nextSkinId++;
        const newSkin = new SVGSkin(skinId, this);
        newSkin.setSVG(svgData, rotationCenter);
        this._allSkins[skinId] = newSkin;
        return skinId;
    }

    /**
     * Update an existing SVG skin, or create an SVG skin if the previous skin was not SVG.
     * @param {!int} skinId the ID for the skin to change.
     * @param {!string} svgData - new SVG to use.
     * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
     * skin will be used
     */
    updateSVGSkin (skinId, svgData, rotationCenter) {
        if (this._allSkins[skinId] instanceof SVGSkin) {
            this._allSkins[skinId].setSVG(svgData, rotationCenter);
            return;
        }

        const newSkin = new SVGSkin(skinId, this);
        newSkin.setSVG(svgData, rotationCenter);
        this._reskin(skinId, newSkin);
    }

    _reskin (skinId, newSkin) {
        const oldSkin = this._allSkins[skinId];
        this._allSkins[skinId] = newSkin;

        // Tell drawables to update
        for (const drawable of this._allDrawables) {
            if (drawable && drawable.skin === oldSkin) {
                drawable.skin = newSkin;
                drawable.setConvexHullDirty();
                drawable.setTransformDirty();
            }
        }
        oldSkin.dispose();
    }

    /**
     * Destroy an existing skin. Do not use the skin or its ID after calling this.
     * @param {!int} skinId - The ID of the skin to destroy.
     */
    destroySkin (skinId) {
        const oldSkin = this._allSkins[skinId];
        oldSkin.dispose();
        delete this._allSkins[skinId];
    }

    /**
     * Create a new Drawable and add it to the scene.
     * @param {string} group Layer group to add the drawable to
     * @returns {int} The ID of the new Drawable.
     */
    createDrawable (group) {
        if (!group || !this._layerGroups.hasOwnProperty(group)) {
            log.warn('Cannot create a drawable without a known layer group');
            return;
        }
        const drawableID = this._nextDrawableId++;
        const drawable = new Drawable(drawableID);
        this._allDrawables[drawableID] = drawable;
        this._addToDrawList(drawableID, group);

        drawable.skin = null;

        return drawableID;
    }

    /**
     * Set the layer group ordering for the renderer.
     * @param {Array<string>} groupOrdering The ordered array of layer group
     * names
     */
    setLayerGroupOrdering (groupOrdering) {
        this._groupOrdering = groupOrdering;
        for (let i = 0; i < this._groupOrdering.length; i++) {
            this._layerGroups[this._groupOrdering[i]] = {
                groupIndex: i,
                drawListOffset: 0
            };
        }
    }

    _addToDrawList (drawableID, group) {
        const currentLayerGroup = this._layerGroups[group];
        const currentGroupOrderingIndex = currentLayerGroup.groupIndex;

        const drawListOffset = this._endIndexForKnownLayerGroup(currentLayerGroup);
        this._drawList.splice(drawListOffset, 0, drawableID);

        this._updateOffsets('add', currentGroupOrderingIndex);
    }

    _updateOffsets (updateType, currentGroupOrderingIndex) {
        for (let i = currentGroupOrderingIndex + 1; i < this._groupOrdering.length; i++) {
            const laterGroupName = this._groupOrdering[i];
            if (updateType === 'add') {
                this._layerGroups[laterGroupName].drawListOffset++;
            } else if (updateType === 'delete'){
                this._layerGroups[laterGroupName].drawListOffset--;
            }
        }
    }

    get _visibleDrawList () {
        return this._drawList.filter(id => this._allDrawables[id]._visible);
    }

    // Given a layer group, return the index where it ends (non-inclusive),
    // e.g. the returned index does not have a drawable from this layer group in it)
    _endIndexForKnownLayerGroup (layerGroup) {
        const groupIndex = layerGroup.groupIndex;
        if (groupIndex === this._groupOrdering.length - 1) {
            return this._drawList.length;
        }
        return this._layerGroups[this._groupOrdering[groupIndex + 1]].drawListOffset;
    }

    /**
     * Destroy a Drawable, removing it from the scene.
     * @param {int} drawableID The ID of the Drawable to remove.
     * @param {string} group Group name that the drawable belongs to
     */
    destroyDrawable (drawableID, group) {
        if (!group || !this._layerGroups.hasOwnProperty(group)) {
            log.warn('Cannot destroy drawable without known layer group.');
            return;
        }
        const drawable = this._allDrawables[drawableID];
        drawable.dispose();
        delete this._allDrawables[drawableID];

        const currentLayerGroup = this._layerGroups[group];
        const endIndex = this._endIndexForKnownLayerGroup(currentLayerGroup);

        let index = currentLayerGroup.drawListOffset;
        while (index < endIndex) {
            if (this._drawList[index] === drawableID) {
                break;
            }
            index++;
        }
        if (index < endIndex) {
            this._drawList.splice(index, 1);
            this._updateOffsets('delete', currentLayerGroup.groupIndex);
        } else {
            log.warn('Could not destroy drawable that could not be found in layer group.');
            return;
        }
    }

    /**
     * Returns the position of the given drawableID in the draw list. This is
     * the absolute position irrespective of layer group.
     * @param {number} drawableID The drawable ID to find.
     * @return {number} The postion of the given drawable ID.
     */
    getDrawableOrder (drawableID) {
        return this._drawList.indexOf(drawableID);
    }

    /**
     * Set a drawable's order in the drawable list (effectively, z/layer).
     * Can be used to move drawables to absolute positions in the list,
     * or relative to their current positions.
     * "go back N layers": setDrawableOrder(id, -N, true, 1); (assuming stage at 0).
     * "go to back": setDrawableOrder(id, 1); (assuming stage at 0).
     * "go to front": setDrawableOrder(id, Infinity);
     * @param {int} drawableID ID of Drawable to reorder.
     * @param {number} order New absolute order or relative order adjusment.
     * @param {string=} group Name of layer group drawable belongs to.
     * Reordering will not take place if drawable cannot be found within the bounds
     * of the layer group.
     * @param {boolean=} optIsRelative If set, `order` refers to a relative change.
     * @param {number=} optMin If set, order constrained to be at least `optMin`.
     * @return {?number} New order if changed, or null.
     */
    setDrawableOrder (drawableID, order, group, optIsRelative, optMin) {
        if (!group || !this._layerGroups.hasOwnProperty(group)) {
            log.warn('Cannot set the order of a drawable without a known layer group.');
            return;
        }

        const currentLayerGroup = this._layerGroups[group];
        const startIndex = currentLayerGroup.drawListOffset;
        const endIndex = this._endIndexForKnownLayerGroup(currentLayerGroup);

        let oldIndex = startIndex;
        while (oldIndex < endIndex) {
            if (this._drawList[oldIndex] === drawableID) {
                break;
            }
            oldIndex++;
        }

        if (oldIndex < endIndex) {
            // Remove drawable from the list.
            if (order === 0) {
                return oldIndex;
            }

            const _ = this._drawList.splice(oldIndex, 1)[0];
            // Determine new index.
            let newIndex = order;
            if (optIsRelative) {
                newIndex += oldIndex;
            }

            const possibleMin = (optMin || 0) + startIndex;
            const min = (possibleMin >= startIndex && possibleMin < endIndex) ? possibleMin : startIndex;
            newIndex = Math.max(newIndex, min);

            newIndex = Math.min(newIndex, endIndex);

            // Insert at new index.
            this._drawList.splice(newIndex, 0, drawableID);
            return newIndex;
        }

        return null;
    }

    /**
     * Draw all current drawables and present the frame on the canvas.
     */
    draw () {
        this._doExitDrawRegion();

        const gl = this._gl;

        twgl.bindFramebufferInfo(gl, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor.apply(gl, this._backgroundColor);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this._drawThese(this._drawList, ShaderManager.DRAW_MODE.default, this._projection);
        if (this._snapshotCallbacks.length > 0) {
            const snapshot = gl.canvas.toDataURL();
            this._snapshotCallbacks.forEach(cb => cb(snapshot));
            this._snapshotCallbacks = [];
        }
    }

    /**
     * Get the precise bounds for a Drawable.
     * @param {int} drawableID ID of Drawable to get bounds for.
     * @return {object} Bounds for a tight box around the Drawable.
     */
    getBounds (drawableID) {
        const drawable = this._allDrawables[drawableID];
        // Tell the Drawable about its updated convex hull, if necessary.
        if (drawable.needsConvexHullPoints()) {
            const points = this._getConvexHullPointsForDrawable(drawableID);
            drawable.setConvexHullPoints(points);
        }
        const bounds = drawable.getFastBounds();
        // In debug mode, draw the bounds.
        if (this._debugCanvas) {
            const gl = this._gl;
            this._debugCanvas.width = gl.canvas.width;
            this._debugCanvas.height = gl.canvas.height;
            const context = this._debugCanvas.getContext('2d');
            context.drawImage(gl.canvas, 0, 0);
            context.strokeStyle = '#FF0000';
            const pr = window.devicePixelRatio;
            context.strokeRect(
                pr * (bounds.left + (this._nativeSize[0] / 2)),
                pr * (-bounds.top + (this._nativeSize[1] / 2)),
                pr * (bounds.right - bounds.left),
                pr * (-bounds.bottom + bounds.top)
            );
        }
        return bounds;
    }

    /**
     * Get the precise bounds for a Drawable around the top slice.
     * Used for positioning speech bubbles more closely to the sprite.
     * @param {int} drawableID ID of Drawable to get bubble bounds for.
     * @return {object} Bounds for a tight box around the Drawable top slice.
     */
    getBoundsForBubble (drawableID) {
        const drawable = this._allDrawables[drawableID];
        // Tell the Drawable about its updated convex hull, if necessary.
        if (drawable.needsConvexHullPoints()) {
            const points = this._getConvexHullPointsForDrawable(drawableID);
            drawable.setConvexHullPoints(points);
        }
        const bounds = drawable.getBoundsForBubble();
        // In debug mode, draw the bounds.
        if (this._debugCanvas) {
            const gl = this._gl;
            this._debugCanvas.width = gl.canvas.width;
            this._debugCanvas.height = gl.canvas.height;
            const context = this._debugCanvas.getContext('2d');
            context.drawImage(gl.canvas, 0, 0);
            context.strokeStyle = '#FF0000';
            const pr = window.devicePixelRatio;
            context.strokeRect(
                pr * (bounds.left + (this._nativeSize[0] / 2)),
                pr * (-bounds.top + (this._nativeSize[1] / 2)),
                pr * (bounds.right - bounds.left),
                pr * (-bounds.bottom + bounds.top)
            );
        }
        return bounds;
    }

    /**
     * Get the current skin (costume) size of a Drawable.
     * @param {int} drawableID The ID of the Drawable to measure.
     * @return {Array<number>} Skin size, width and height.
     */
    getCurrentSkinSize (drawableID) {
        const drawable = this._allDrawables[drawableID];
        return this.getSkinSize(drawable.skin.id);
    }

    /**
     * Get the size of a skin by ID.
     * @param {int} skinID The ID of the Skin to measure.
     * @return {Array<number>} Skin size, width and height.
     */
    getSkinSize (skinID) {
        const skin = this._allSkins[skinID];
        return skin.size;
    }

    /**
     * Get the rotation center of a skin by ID.
     * @param {int} skinID The ID of the Skin
     * @return {Array<number>} The rotationCenterX and rotationCenterY
     */
    getSkinRotationCenter (skinID) {
        const skin = this._allSkins[skinID];
        return skin.calculateRotationCenter();
    }

    _getMaxPixelsForCPU () {
        switch (this._useGpuMode) {
        case RenderWebGL.UseGpuModes.ForceCPU:
            return Infinity;
        case RenderWebGL.UseGpuModes.ForceGPU:
            return 0;
        case RenderWebGL.UseGpuModes.Automatic:
        default:
            return __cpuTouchingColorPixelCount;
        }
    }

    /**
     * Convert a client based x/y position on the canvas to a Scratch 3 world space
     * Rectangle.  This creates recangles with a radius to cover selecting multiple
     * scratch pixels with touch / small render areas.
     *
     * @param {int} centerX The client x coordinate of the picking location.
     * @param {int} centerY The client y coordinate of the picking location.
     * @param {int} [width] The client width of the touch event (optional).
     * @param {int} [height] The client width of the touch event (optional).
     * @returns {Rectangle} Scratch world space rectangle, iterate bottom <= top,
     *                      left <= right.
     */
    clientSpaceToScratchBounds (centerX, centerY, width = 1, height = 1) {
        const gl = this._gl;

        const clientToScratchX = this._nativeSize[0] / gl.canvas.clientWidth;
        const clientToScratchY = this._nativeSize[1] / gl.canvas.clientHeight;

        width *= clientToScratchX;
        height *= clientToScratchY;

        width = Math.max(1, Math.min(Math.round(width), MAX_TOUCH_SIZE[0]));
        height = Math.max(1, Math.min(Math.round(height), MAX_TOUCH_SIZE[1]));
        const x = (centerX * clientToScratchX) - ((width - 1) / 2);
        // + because scratch y is inverted
        const y = (centerY * clientToScratchY) + ((height - 1) / 2);

        const xOfs = (width % 2) ? 0 : -0.5;
        // y is offset +0.5
        const yOfs = (height % 2) ? 0 : -0.5;

        const bounds = new Rectangle();
        bounds.initFromBounds(Math.floor(this._xLeft + x + xOfs), Math.floor(this._xLeft + x + xOfs + width - 1),
            Math.ceil(this._yTop - y + yOfs), Math.ceil(this._yTop - y + yOfs + height - 1));
        return bounds;
    }

    /**
     * @typedef DrawableExtraction
     * @property {Uint8Array} data Raw pixel data for the drawable
     * @property {int} width Drawable bounding box width
     * @property {int} height Drawable bounding box height
     * @property {Array<number>} scratchOffset [x, y] offset in Scratch coordinates
     * from the drawable position to the client x, y coordinate
     * @property {int} x The x coordinate relative to drawable bounding box
     * @property {int} y The y coordinate relative to drawable bounding box
     */

    /**
     * Return drawable pixel data and picking coordinates relative to the drawable bounds
     * @param {int} drawableID The ID of the drawable to get pixel data for
     * @param {int} x The client x coordinate of the picking location.
     * @param {int} y The client y coordinate of the picking location.
     * @return {?DrawableExtraction} Data about the picked drawable
     */
    extractDrawable (drawableID, x, y) {
        this._doExitDrawRegion();

        const drawable = this._allDrawables[drawableID];
        if (!drawable) return null;

        // Convert client coordinates into absolute scratch units
        const scratchX = this._nativeSize[0] * ((x / this._gl.canvas.clientWidth) - 0.5);
        const scratchY = this._nativeSize[1] * ((y / this._gl.canvas.clientHeight) - 0.5);

        const gl = this._gl;

        const bounds = drawable.getFastBounds();
        bounds.snapToInt();

        // Set a reasonable max limit width and height for the bufferInfo bounds
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const clampedWidth = Math.min(2048, bounds.width, maxTextureSize);
        const clampedHeight = Math.min(2048, bounds.height, maxTextureSize);

        // Make a new bufferInfo since this._queryBufferInfo is limited to 480x360
        const attachments = [
            {format: gl.RGBA},
            {format: gl.DEPTH_STENCIL}
        ];
        const bufferInfo = twgl.createFramebufferInfo(gl, attachments, clampedWidth, clampedHeight);

        // If the new bufferInfo is invalid, fall back to using the smaller _queryBufferInfo
        twgl.bindFramebufferInfo(gl, bufferInfo);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            twgl.bindFramebufferInfo(gl, this._queryBufferInfo);
        }

        // Translate to scratch units relative to the drawable
        const pickX = scratchX - bounds.left;
        const pickY = scratchY + bounds.top;

        // Limit size of viewport to the bounds around the target Drawable,
        // and create the projection matrix for the draw.
        gl.viewport(0, 0, bounds.width, bounds.height);
        const projection = twgl.m4.ortho(bounds.left, bounds.right, bounds.top, bounds.bottom, -1, 1);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        try {
            gl.disable(gl.BLEND);
            this._drawThese([drawableID], ShaderManager.DRAW_MODE.default, projection,
                {effectMask: ~ShaderManager.EFFECT_INFO.ghost.mask});
        } finally {
            gl.enable(gl.BLEND);
        }

        const data = new Uint8Array(Math.floor(bounds.width * bounds.height * 4));
        gl.readPixels(0, 0, bounds.width, bounds.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

        if (this._debugCanvas) {
            this._debugCanvas.width = bounds.width;
            this._debugCanvas.height = bounds.height;
            const ctx = this._debugCanvas.getContext('2d');
            const imageData = ctx.createImageData(bounds.width, bounds.height);
            imageData.data.set(data);
            ctx.putImageData(imageData, 0, 0);
            ctx.beginPath();
            ctx.arc(pickX, pickY, 3, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.stroke();
        }

        return {
            data: data,
            width: bounds.width,
            height: bounds.height,
            scratchOffset: [
                -scratchX + drawable._position[0],
                -scratchY - drawable._position[1]
            ],
            x: pickX,
            y: pickY
        };
    }

    /**
     * @typedef ColorExtraction
     * @property {Uint8Array} data Raw pixel data for the drawable
     * @property {int} width Drawable bounding box width
     * @property {int} height Drawable bounding box height
     * @property {object} color Color object with RGBA properties at picked location
     */

    /**
     * Return drawable pixel data and color at a given position
     * @param {int} x The client x coordinate of the picking location.
     * @param {int} y The client y coordinate of the picking location.
     * @param {int} radius The client radius to extract pixels with.
     * @return {?ColorExtraction} Data about the picked color
     */
    extractColor (x, y, radius) {
        this._doExitDrawRegion();

        const scratchX = Math.round(this._nativeSize[0] * ((x / this._gl.canvas.clientWidth) - 0.5));
        const scratchY = Math.round(-this._nativeSize[1] * ((y / this._gl.canvas.clientHeight) - 0.5));

        const gl = this._gl;
        twgl.bindFramebufferInfo(gl, this._queryBufferInfo);

        const bounds = new Rectangle();
        bounds.initFromBounds(scratchX - radius, scratchX + radius, scratchY - radius, scratchY + radius);

        const pickX = scratchX - bounds.left;
        const pickY = bounds.top - scratchY;

        gl.viewport(0, 0, bounds.width, bounds.height);
        const projection = twgl.m4.ortho(bounds.left, bounds.right, bounds.top, bounds.bottom, -1, 1);

        gl.clearColor.apply(gl, this._backgroundColor);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this._drawThese(this._drawList, ShaderManager.DRAW_MODE.default, projection);

        const data = new Uint8Array(Math.floor(bounds.width * bounds.height * 4));
        gl.readPixels(0, 0, bounds.width, bounds.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

        const pixelBase = Math.floor(4 * ((pickY * bounds.width) + pickX));
        const color = {
            r: data[pixelBase],
            g: data[pixelBase + 1],
            b: data[pixelBase + 2],
            a: data[pixelBase + 3]
        };

        if (this._debugCanvas) {
            this._debugCanvas.width = bounds.width;
            this._debugCanvas.height = bounds.height;
            const ctx = this._debugCanvas.getContext('2d');
            const imageData = ctx.createImageData(bounds.width, bounds.height);
            imageData.data.set(data);
            ctx.putImageData(imageData, 0, 0);
            ctx.strokeStyle = 'black';
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
            ctx.rect(pickX - 4, pickY - 4, 8, 8);
            ctx.fill();
            ctx.stroke();
        }

        return {
            data: data,
            width: bounds.width,
            height: bounds.height,
            color: color
        };
    }

    /**
     * Helper to get the union bounds from a set of candidates returned from the above method
     * @private
     * @param {Array<object>} candidates info from _candidatesTouching
     * @return {Rectangle} the outer bounding box union
     */
    _candidatesBounds (candidates) {
        return candidates.reduce((memo, {intersection}) => {
            if (!memo) {
                return intersection;
            }
            // store the union of the two rectangles in our static rectangle instance
            return Rectangle.union(memo, intersection, __candidatesBounds);
        }, null);
    }


    /**
     * Update the position, direction, scale, or effect properties of this Drawable.
     * @param {int} drawableID The ID of the Drawable to update.
     * @param {object.<string,*>} properties The new property values to set.
     */
    updateDrawableProperties (drawableID, properties) {
        const drawable = this._allDrawables[drawableID];
        if (!drawable) {
            /**
             * @todo fix whatever's wrong in the VM which causes this, then add a warning or throw here.
             * Right now this happens so much on some projects that a warning or exception here can hang the browser.
             */
            return;
        }
        if ('skinId' in properties) {
            drawable.skin = this._allSkins[properties.skinId];
        }
        if ('rotationCenter' in properties) {
            const newRotationCenter = properties.rotationCenter;
            drawable.skin.setRotationCenter(newRotationCenter[0], newRotationCenter[1]);
        }
        drawable.updateProperties(properties);
    }

    /**
     * Update the position object's x & y members to keep the drawable fenced in view.
     * @param {int} drawableID - The ID of the Drawable to update.
     * @param {Array.<number, number>} position to be fenced - An array of type [x, y]
     * @return {Array.<number, number>} The fenced position as an array [x, y]
     */
    getFencedPositionOfDrawable (drawableID, position) {
        let x = position[0];
        let y = position[1];

        const drawable = this._allDrawables[drawableID];
        if (!drawable) {
            // TODO: fix whatever's wrong in the VM which causes this, then add a warning or throw here.
            // Right now this happens so much on some projects that a warning or exception here can hang the browser.
            return [x, y];
        }

        const dx = x - drawable._position[0];
        const dy = y - drawable._position[1];
        const aabb = drawable._skin.getFenceBounds(drawable);
        const inset = Math.floor(Math.min(aabb.width, aabb.height) / 2);

        const sx = this._xRight - Math.min(FENCE_WIDTH, inset);
        if (aabb.right + dx < -sx) {
            x = Math.ceil(drawable._position[0] - (sx + aabb.right));
        } else if (aabb.left + dx > sx) {
            x = Math.floor(drawable._position[0] + (sx - aabb.left));
        }
        const sy = this._yTop - Math.min(FENCE_WIDTH, inset);
        if (aabb.top + dy < -sy) {
            y = Math.ceil(drawable._position[1] - (sy + aabb.top));
        } else if (aabb.bottom + dy > sy) {
            y = Math.floor(drawable._position[1] + (sy - aabb.bottom));
        }
        return [x, y];
    }

    /* ******
     * Truly internal functions: these support the functions above.
     ********/

    /**
     * Build geometry (vertex and index) buffers.
     * @private
     */
    _createGeometry () {
        const quad = {
            a_position: {
                numComponents: 2,
                data: [
                    -0.5, -0.5,
                    0.5, -0.5,
                    -0.5, 0.5,
                    -0.5, 0.5,
                    0.5, -0.5,
                    0.5, 0.5
                ]
            },
            a_texCoord: {
                numComponents: 2,
                data: [
                    1, 0,
                    0, 0,
                    1, 1,
                    1, 1,
                    0, 0,
                    0, 1
                ]
            }
        };
        this._bufferInfo = twgl.createBufferInfoFromArrays(this._gl, quad);
    }

    /**
     * Respond to a change in the "native" rendering size. The native size is used by buffers which are fixed in size
     * regardless of the size of the main render target. This includes the buffers used for queries such as picking and
     * color-touching. The fixed size allows (more) consistent behavior across devices and presentation modes.
     * @param {object} event - The change event.
     * @private
     */
    onNativeSizeChanged (event) {
        const [width, height] = event.newSize;

        const gl = this._gl;
        const attachments = [
            {format: gl.RGBA},
            {format: gl.DEPTH_STENCIL}
        ];

        if (!this._pickBufferInfo) {
            this._pickBufferInfo = twgl.createFramebufferInfo(gl, attachments, MAX_TOUCH_SIZE[0], MAX_TOUCH_SIZE[1]);
        }

        /** @todo should we create this on demand to save memory? */
        // A 480x360 32-bpp buffer is 675 KiB.
        if (this._queryBufferInfo) {
            twgl.resizeFramebufferInfo(gl, this._queryBufferInfo, attachments, width, height);
        } else {
            this._queryBufferInfo = twgl.createFramebufferInfo(gl, attachments, width, height);
        }
    }

    /**
     * Enter a draw region.
     *
     * A draw region is where multiple draw operations are performed with the
     * same GL state. WebGL performs poorly when it changes state like blend
     * mode. Marking a collection of state values as a "region" the renderer
     * can skip superfluous extra state calls when it is already in that
     * region. Since one region may be entered from within another a exit
     * handle can also be registered that is called when a new region is about
     * to be entered to restore a common inbetween state.
     *
     * @param {any} regionId - id of the region to enter
     * @param {function} enter - handle to call when first entering a region
     * @param {function} exit - handle to call when leaving a region
     */
    enterDrawRegion (regionId, enter = regionId.enter, exit = regionId.exit) {
        if (this._regionId !== regionId) {
            this._doExitDrawRegion();
            this._regionId = regionId;
            enter();
            this._exitRegion = exit;
        }
    }

    /**
     * Forcefully exit the current region returning to a common inbetween GL
     * state.
     */
    _doExitDrawRegion () {
        if (this._exitRegion !== null) {
            this._exitRegion();
        }
        this._exitRegion = null;
    }

    /**
     * Draw a set of Drawables, by drawable ID
     * @param {Array<int>} drawables The Drawable IDs to draw, possibly this._drawList.
     * @param {module:twgl/m4.Mat4} projection The projection matrix to use.
     * @param {object} [opts] Options for drawing
     * @param {idFilterFunc} opts.filter An optional filter function.
     * @param {object.<string,*>} opts.extraUniforms Extra uniforms for the shaders.
     * @param {int} opts.effectMask Bitmask for effects to allow
     * @param {boolean} opts.ignoreVisibility Draw all, despite visibility (e.g. stamping, touching color)
     * @private
     */
    _drawThese (drawables, drawMode, projection, opts = {}) {

        const gl = this._gl;
        let currentShader = null;

        const numDrawables = drawables.length;
        for (let drawableIndex = 0; drawableIndex < numDrawables; ++drawableIndex) {
            const drawableID = drawables[drawableIndex];

            // If we have a filter, check whether the ID fails
            if (opts.filter && !opts.filter(drawableID)) continue;

            const drawable = this._allDrawables[drawableID];
            /** @todo check if drawable is inside the viewport before anything else */

            // Hidden drawables (e.g., by a "hide" block) are not drawn unless
            // the ignoreVisibility flag is used (e.g. for stamping or touchingColor).
            if (!drawable.getVisible() && !opts.ignoreVisibility) continue;

            // Combine drawable scale with the native vs. backing pixel ratio
            const drawableScale = [
                drawable.scale[0] * this._gl.canvas.width / this._nativeSize[0],
                drawable.scale[1] * this._gl.canvas.height / this._nativeSize[1]
            ];

            // If the skin or texture isn't ready yet, skip it.
            if (!drawable.skin || !drawable.skin.getTexture(drawableScale)) continue;

            const uniforms = {};

            let effectBits = drawable.getEnabledEffects();
            effectBits &= opts.hasOwnProperty('effectMask') ? opts.effectMask : effectBits;
            const newShader = this._shaderManager.getShader(drawMode, effectBits);

            // Manually perform region check. Do not create functions inside a
            // loop.
            if (this._regionId !== newShader) {
                this._doExitDrawRegion();
                this._regionId = newShader;

                currentShader = newShader;
                gl.useProgram(currentShader.program);
                twgl.setBuffersAndAttributes(gl, currentShader, this._bufferInfo);
                Object.assign(uniforms, {
                    u_projectionMatrix: projection,
                    u_fudge: window.fudge || 0
                });
            }

            Object.assign(uniforms,
                drawable.skin.getUniforms(drawableScale),
                drawable.getUniforms());

            // Apply extra uniforms after the Drawable's, to allow overwriting.
            if (opts.extraUniforms) {
                Object.assign(uniforms, opts.extraUniforms);
            }

            if (uniforms.u_skin) {
                twgl.setTextureParameters(
                    gl, uniforms.u_skin, {minMag: drawable.useNearest ? gl.NEAREST : gl.LINEAR}
                );
            }

            twgl.setUniforms(currentShader, uniforms);
            
            /* adjust blend function for this skin */
            if (drawable.skin.hasPremultipliedAlpha){
                gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            } else {
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            }
            
            twgl.drawBufferInfo(gl, this._bufferInfo, gl.TRIANGLES);
        }

        this._regionId = null;
    }

    /**
     * Sample a "final" color from an array of drawables at a given scratch space.
     * Will blend any alpha values with the drawables "below" it.
     * @param {twgl.v3} vec Scratch Vector Space to sample
     * @param {Array<Drawables>} drawables A list of drawables with the "top most"
     *              drawable at index 0
     * @param {Uint8ClampedArray} dst The color3b space to store the answer in.
     * @return {Uint8ClampedArray} The dst vector with everything blended down.
     */
    static sampleColor3b (vec, drawables, dst) {
        dst = dst || new Uint8ClampedArray(3);
        dst.fill(0);
        let blendAlpha = 1;
        for (let index = 0; blendAlpha !== 0 && index < drawables.length; index++) {
            /*
            if (left > vec[0] || right < vec[0] ||
                bottom > vec[1] || top < vec[0]) {
                continue;
            }
            */
            Drawable.sampleColor4b(vec, drawables[index].drawable, __blendColor);
            // if we are fully transparent, go to the next one "down"
            const sampleAlpha = __blendColor[3] / 255;
            // premultiply alpha
            dst[0] += __blendColor[0] * blendAlpha * sampleAlpha;
            dst[1] += __blendColor[1] * blendAlpha * sampleAlpha;
            dst[2] += __blendColor[2] * blendAlpha * sampleAlpha;
            blendAlpha *= (1 - sampleAlpha);
        }
        // Backdrop could be transparent, so we need to go to the "clear color" of the
        // draw scene (white) as a fallback if everything was alpha
        dst[0] += blendAlpha * 255;
        dst[1] += blendAlpha * 255;
        dst[2] += blendAlpha * 255;
        return dst;
    }

    /**
     * @callback RenderWebGL#snapshotCallback
     * @param {string} dataURI Data URI of the snapshot of the renderer
     */

    /**
     * @param {snapshotCallback} callback Function called in the next frame with the snapshot data
     */
    requestSnapshot (callback) {
        this._snapshotCallbacks.push(callback);
    }
}

// :3
RenderWebGL.prototype.canHazPixels = RenderWebGL.prototype.extractDrawable;

/**
 * Values for setUseGPU()
 * @enum {string}
 */
RenderWebGL.UseGpuModes = {
    /**
     * Heuristically decide whether to use the GPU path, the CPU path, or a dynamic mixture of the two.
     */
    Automatic: 'Automatic',

    /**
     * Always use the GPU path.
     */
    ForceGPU: 'ForceGPU',

    /**
     * Always use the CPU path.
     */
    ForceCPU: 'ForceCPU'
};

module.exports = RenderWebGL;
