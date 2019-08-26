const twgl = require('twgl.js');


class ShaderManager {
    /**
     * @param {WebGLRenderingContext} gl WebGL rendering context to create shaders for
     * @constructor
     */
    constructor (gl) {
        this._gl = gl;
    }

    /**
     * Fetch the shader for a particular set of active effects.
     * Build the shader if necessary.
     * @returns {ProgramInfo} The shader's program info.
     */
    getShader () {
        return this._buildShader();
    }

    /**
     * Build the shader for a particular set of active effects.
     * @param {ShaderManager.DRAW_MODE} drawMode Draw normally, silhouette, etc.
     * @param {int} effectBits Bitmask representing the enabled effects.
     * @returns {ProgramInfo} The new shader's program info.
     * @private
     */
    _buildShader () {
        const defines = [
            `#define DRAW_MODE_default`
        ];

        const definesText = `${defines.join('\n')}\n`;

        /* eslint-disable global-require */
        const vsFullText = definesText + require('raw-loader!./shaders/sprite.vert');
        const fsFullText = definesText + require('raw-loader!./shaders/sprite.frag');
        /* eslint-enable global-require */

        return twgl.createProgramInfo(this._gl, [vsFullText, fsFullText]);
    }
}

module.exports = ShaderManager;
