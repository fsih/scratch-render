const twgl = require('twgl.js');

const Rectangle = require('./Rectangle');
const RenderConstants = require('./RenderConstants');
const SVGSkin = require('./SVGSkin');

class Drawable {
    /**
     * An object which can be drawn by the renderer.
     * @todo double-buffer all rendering state (position, skin, effects, etc.)
     * @param {!int} id - This Drawable's unique ID.
     * @constructor
     */
    constructor (id) {
        /** @type {!int} */
        this._id = id;

        /**
         * The uniforms to be used by the vertex and pixel shaders.
         * Some of these are used by other parts of the renderer as well.
         * @type {Object.<string,*>}
         * @private
         */
        this._uniforms = {
            /**
             * The model matrix, to concat with projection at draw time.
             * @type {module:twgl/m4.Mat4}
             */
            u_modelMatrix: twgl.m4.identity(),

            /**
             * The color to use in the silhouette draw mode.
             * @type {Array<number>}
             */
            u_silhouetteColor: Drawable.color4fFromID(this._id)
        };

        this._position = twgl.v3.create(0, 0);
        this._scale = twgl.v3.create(100, 100);
        this._direction = 90;
        this._transformDirty = true;
        this._rotationMatrix = twgl.m4.identity();
        this._rotationTransformDirty = true;
        this._rotationAdjusted = twgl.v3.create();
        this._rotationCenterDirty = true;
        this._skinScale = twgl.v3.create(0, 0, 0);
        this._skinScaleDirty = true;
        this._inverseMatrix = twgl.m4.identity();
        this._inverseTransformDirty = true;
        this._visible = true;

        /** @todo move convex hull functionality, maybe bounds functionality overall, to Skin classes */
        this._convexHullPoints = null;
    }

    /**
     * @returns {number} The ID for this Drawable.
     */
    get id () {
        return this._id;
    }

    /**
     * @returns {SVGSkin} the current skin for this Drawable.
     */
    get skin () {
        return this._skin;
    }

    /**
     * @param {SVGSkin} newSkin - A new Skin for this Drawable.
     */
    set skin (newSkin) {
        this._skin = newSkin;
    }

    /**
     * @returns {Array<number>} the current scaling percentages applied to this Drawable. [100,100] is normal size.
     */
    get scale () {
        return [this._scale[0], this._scale[1]];
    }

    /**
     * @returns {object.<string, *>} the shader uniforms to be used when rendering this Drawable.
     */
    getUniforms () {
        if (this._transformDirty) {
            this._calculateTransform();
        }
        return this._uniforms;
    }

    /**
     * @returns {boolean} whether this Drawable is visible.
     */
    getVisible () {
        return this._visible;
    }

    /**
     * Update the position, direction, scale, or effect properties of this Drawable.
     * @param {object.<string,*>} properties The new property values to set.
     */
    updateProperties (properties) {
        if ('position' in properties && (
            this._position[0] !== properties.position[0] ||
            this._position[1] !== properties.position[1])) {
            this._position[0] = Math.round(properties.position[0]);
            this._position[1] = Math.round(properties.position[1]);
        }
        if ('direction' in properties && this._direction !== properties.direction) {
            this._direction = properties.direction;
            this._rotationTransformDirty = true;
        }
        if ('scale' in properties && (
            this._scale[0] !== properties.scale[0] ||
            this._scale[1] !== properties.scale[1])) {
            this._scale[0] = properties.scale[0];
            this._scale[1] = properties.scale[1];
            this._rotationCenterDirty = true;
            this._skinScaleDirty = true;
        }
        if ('visible' in properties) {
            this._visible = properties.visible;
            this.setConvexHullDirty();
        }
    }

    /**
     * Calculate the transform to use when rendering this Drawable.
     * @private
     */
    _calculateTransform () {
        if (this._rotationTransformDirty) {
            const rotation = (270 - this._direction) * Math.PI / 180;

            // Calling rotationZ sets the destination matrix to a rotation
            // around the Z axis setting matrix components 0, 1, 4 and 5 with
            // cosine and sine values of the rotation.
            // twgl.m4.rotationZ(rotation, this._rotationMatrix);

            // twgl assumes the last value set to the matrix was anything.
            // Drawable knows, it was another rotationZ matrix, so we can skip
            // assigning the values that will never change.
            const c = Math.cos(rotation);
            const s = Math.sin(rotation);
            this._rotationMatrix[0] = c;
            this._rotationMatrix[1] = s;
            // this._rotationMatrix[2] = 0;
            // this._rotationMatrix[3] = 0;
            this._rotationMatrix[4] = -s;
            this._rotationMatrix[5] = c;
            // this._rotationMatrix[6] = 0;
            // this._rotationMatrix[7] = 0;
            // this._rotationMatrix[8] = 0;
            // this._rotationMatrix[9] = 0;
            // this._rotationMatrix[10] = 1;
            // this._rotationMatrix[11] = 0;
            // this._rotationMatrix[12] = 0;
            // this._rotationMatrix[13] = 0;
            // this._rotationMatrix[14] = 0;
            // this._rotationMatrix[15] = 1;

            this._rotationTransformDirty = false;
        }

        // Adjust rotation center relative to the skin.
        if (this._rotationCenterDirty && this.skin !== null) {
            // twgl version of the following in function work.
            // let rotationAdjusted = twgl.v3.subtract(
            //     this.skin.rotationCenter,
            //     twgl.v3.divScalar(this.skin.size, 2, this._rotationAdjusted),
            //     this._rotationAdjusted
            // );
            // rotationAdjusted = twgl.v3.multiply(
            //     rotationAdjusted, this._scale, rotationAdjusted
            // );
            // rotationAdjusted = twgl.v3.divScalar(
            //     rotationAdjusted, 100, rotationAdjusted
            // );
            // rotationAdjusted[1] *= -1; // Y flipped to Scratch coordinate.
            // rotationAdjusted[2] = 0; // Z coordinate is 0.

            // Locally assign rotationCenter and skinSize to keep from having
            // the Skin getter properties called twice while locally assigning
            // their components for readability.
            const rotationCenter = this.skin.rotationCenter;
            const skinSize = this.skin.size;
            const center0 = rotationCenter[0];
            const center1 = rotationCenter[1];
            const skinSize0 = skinSize[0];
            const skinSize1 = skinSize[1];
            const scale0 = this._scale[0];
            const scale1 = this._scale[1];

            const rotationAdjusted = this._rotationAdjusted;
            rotationAdjusted[0] = (center0 - (skinSize0 / 2)) * scale0 / 100;
            rotationAdjusted[1] = ((center1 - (skinSize1 / 2)) * scale1 / 100) * -1;
            // rotationAdjusted[2] = 0;

            this._rotationCenterDirty = false;
        }

        if (this._skinScaleDirty && this.skin !== null) {
            // twgl version of the following in function work.
            // const scaledSize = twgl.v3.divScalar(
            //     twgl.v3.multiply(this.skin.size, this._scale),
            //     100
            // );
            // // was NaN because the vectors have only 2 components.
            // scaledSize[2] = 0;

            // Locally assign skinSize to keep from having the Skin getter
            // properties called twice.
            const skinSize = this.skin.size;
            const scaledSize = this._skinScale;
            scaledSize[0] = skinSize[0] * this._scale[0] / 100;
            scaledSize[1] = skinSize[1] * this._scale[1] / 100;
            // scaledSize[2] = 0;

            this._skinScaleDirty = false;
        }

        const modelMatrix = this._uniforms.u_modelMatrix;

        // twgl version of the following in function work.
        // twgl.m4.identity(modelMatrix);
        // twgl.m4.translate(modelMatrix, this._position, modelMatrix);
        // twgl.m4.multiply(modelMatrix, this._rotationMatrix, modelMatrix);
        // twgl.m4.translate(modelMatrix, this._rotationAdjusted, modelMatrix);
        // twgl.m4.scale(modelMatrix, scaledSize, modelMatrix);

        // Drawable configures a 3D matrix for drawing in WebGL, but most values
        // will never be set because the inputs are on the X and Y position axis
        // and the Z rotation axis. Drawable can bring the work inside
        // _calculateTransform and greatly reduce the ammount of math and array
        // assignments needed.

        const scale0 = this._skinScale[0];
        const scale1 = this._skinScale[1];
        const rotation00 = this._rotationMatrix[0];
        const rotation01 = this._rotationMatrix[1];
        const rotation10 = this._rotationMatrix[4];
        const rotation11 = this._rotationMatrix[5];
        const adjusted0 = this._rotationAdjusted[0];
        const adjusted1 = this._rotationAdjusted[1];
        const position0 = this._position[0];
        const position1 = this._position[1];

        // Commented assignments show what the values are when the matrix was
        // instantiated. Those values will never change so they do not need to
        // be reassigned.
        modelMatrix[0] = scale0 * rotation00;
        modelMatrix[1] = scale0 * rotation01;
        // modelMatrix[2] = 0;
        // modelMatrix[3] = 0;
        modelMatrix[4] = scale1 * rotation10;
        modelMatrix[5] = scale1 * rotation11;
        // modelMatrix[6] = 0;
        // modelMatrix[7] = 0;
        // modelMatrix[8] = 0;
        // modelMatrix[9] = 0;
        // modelMatrix[10] = 1;
        // modelMatrix[11] = 0;
        modelMatrix[12] = (rotation00 * adjusted0) + (rotation10 * adjusted1) + position0;
        modelMatrix[13] = (rotation01 * adjusted0) + (rotation11 * adjusted1) + position1;
        // modelMatrix[14] = 0;
        // modelMatrix[15] = 1;

        this._transformDirty = false;
    }

    /**
     * Set the convex hull to be dirty.
     * Do this whenever the Drawable's shape has possibly changed.
     */
    setConvexHullDirty () {
        this._convexHullDirty = true;
    }

    /**
     * Should the drawable use NEAREST NEIGHBOR or LINEAR INTERPOLATION mode
     */
    get useNearest () {
        // We can't use nearest neighbor unless we are a multiple of 90 rotation
        if (this._direction % 90 !== 0) {
            return false;
        }

        // If the scale of the skin is very close to 100 (0.99999 variance is okay I guess)
        if (Math.abs(this.scale[0]) > 99 && Math.abs(this.scale[0]) < 101 &&
            Math.abs(this.scale[1]) > 99 && Math.abs(this.scale[1]) < 101) {
            return true;
        }
        return false;
    }

    /**
     * Calculate a color to represent the given ID number. At least one component of
     * the resulting color will be non-zero if the ID is not RenderConstants.ID_NONE.
     * @param {int} id The ID to convert.
     * @returns {Array<number>} An array of [r,g,b,a], each component in the range [0,1].
     */
    static color4fFromID (id) {
        id -= RenderConstants.ID_NONE;
        const r = ((id >> 0) & 255) / 255.0;
        const g = ((id >> 8) & 255) / 255.0;
        const b = ((id >> 16) & 255) / 255.0;
        return [r, g, b, 1.0];
    }
}

module.exports = Drawable;
