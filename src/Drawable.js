const twgl = require('twgl.js');
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
            u_modelMatrix: twgl.m4.identity()
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
        this._calculateTransform();
        return this._uniforms;
    }
    
    /**
     * Calculate the transform to use when rendering this Drawable.
     * @private
     */
    _calculateTransform () {
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

        // Commented assignments show what the values are when the matrix was
        // instantiated. Those values will never change so they do not need to
        // be reassigned.
        modelMatrix[0] = scale0 * rotation00;
        modelMatrix[1] = scale0 * rotation01;
        // modelMatrix[2] = 0;
        // modelMatrix[3] = 0;
        modelMatrix[4] = scale1 * rotation10;
        modelMatrix[5] = scale1 * rotation11;
    }
}

module.exports = Drawable;
