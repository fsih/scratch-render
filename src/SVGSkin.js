const twgl = require('twgl.js');
const EventEmitter = require('events');
const SvgRenderer = require('scratch-svg-renderer').SVGRenderer;

class SVGSkin extends EventEmitter {
    /**
     * Create a new SVG skin.
     * @param {!int} id - The ID for this Skin.
     * @param {!RenderWebGL} renderer - The renderer which will use this skin.
     * @constructor
     * @extends Skin
     */
    constructor (id, renderer) {
        super();

        /** @type {int} */
        this._id = id;

        /** @type {Vec3} */
        this._rotationCenter = twgl.v3.create(0, 0);

        /**
         * The uniforms to be used by the vertex and pixel shaders.
         * Some of these are used by other parts of the renderer as well.
         * @type {Object.<string,*>}
         * @private
         */
        this._uniforms = {
            /**
             * The nominal (not necessarily current) size of the current skin.
             * @type {Array<number>}
             */
            u_skinSize: [0, 0],

            /**
             * The actual WebGL texture object for the skin.
             * @type {WebGLTexture}
             */
            u_skin: null
        };

        /** @type {RenderWebGL} */
        this._renderer = renderer;

        /** @type {SvgRenderer} */
        this._svgRenderer = new SvgRenderer();

        /** @type {WebGLTexture} */
        this._texture = null;
    }

    /**
     * @return {Array<number>} the natural size, in Scratch units, of this skin.
     */
    get size () {
        return this._svgRenderer.size;
    }

    /**
     * @param {Array<number>} scale - The scaling factors to be used, each in the [0,100] range.
     * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given scale.
     */
    // eslint-disable-next-line no-unused-vars
    getTexture () {
        return this._texture;
    }

    /**
     * @returns {Vec3} the origin, in object space, about which this Skin should rotate.
     */
    get rotationCenter () {
        return this._rotationCenter;
    }

    /**
     * Update and returns the uniforms for this skin.
     * @param {Array<number>} scale - The scaling factors to be used.
     * @returns {object.<string, *>} the shader uniforms to be used when rendering with this Skin.
     */
    getUniforms (scale) {
        this._uniforms.u_skin = this.getTexture(scale);
        this._uniforms.u_skinSize = this.size;
        return this._uniforms;
    }

    /**
     * Set the origin, in object space, about which this Skin should rotate.
     */
    setRotationCenter () {
        this._rotationCenter[0] = this.size[0] / 2;
        this._rotationCenter[1] = this.size[1] / 2;
    }

    /**
     * Set the contents of this skin to a snapshot of the provided SVG data.
     * @param {string} svgData - new SVG to use.
     * calculated from the bounding box
\     */
    setSVG (svgData) {
        this._svgRenderer.fromString(svgData, 1, () => {
            const gl = this._renderer.gl;

            // Pull out the ImageData from the canvas. ImageData speeds up
            // updating Silhouette and is better handled by more browsers in
            // regards to memory.
            const canvas = this._svgRenderer.canvas;
            const context = canvas.getContext('2d');
            const textureData = context.getImageData(0, 0, canvas.width, canvas.height);
            const textureOptions = {
                auto: true,
                wrap: gl.CLAMP_TO_EDGE,
                src: textureData
            };

            this._texture = twgl.createTexture(gl, textureOptions);
            this.setRotationCenter();
        });
    }

}

module.exports = SVGSkin;
