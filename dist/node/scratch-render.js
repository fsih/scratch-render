module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/raw-loader/index.js!./src/shaders/sprite.frag":
/*!***********************************************************!*\
  !*** ./node_modules/raw-loader!./src/shaders/sprite.frag ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "precision mediump float;\n\nuniform float u_fudge;\n\n#ifdef DRAW_MODE_silhouette\nuniform vec4 u_silhouetteColor;\n#else // DRAW_MODE_silhouette\n# ifdef ENABLE_color\nuniform float u_color;\n# endif // ENABLE_color\n# ifdef ENABLE_brightness\nuniform float u_brightness;\n# endif // ENABLE_brightness\n#endif // DRAW_MODE_silhouette\n\n#ifdef DRAW_MODE_colorMask\nuniform vec3 u_colorMask;\nuniform float u_colorMaskTolerance;\n#endif // DRAW_MODE_colorMask\n\n#ifdef ENABLE_fisheye\nuniform float u_fisheye;\n#endif // ENABLE_fisheye\n#ifdef ENABLE_whirl\nuniform float u_whirl;\n#endif // ENABLE_whirl\n#ifdef ENABLE_pixelate\nuniform float u_pixelate;\nuniform vec2 u_skinSize;\n#endif // ENABLE_pixelate\n#ifdef ENABLE_mosaic\nuniform float u_mosaic;\n#endif // ENABLE_mosaic\n#ifdef ENABLE_ghost\nuniform float u_ghost;\n#endif // ENABLE_ghost\n\n#ifdef DRAW_MODE_lineSample\nuniform vec4 u_lineColor;\nuniform float u_capScale;\nuniform float u_aliasAmount;\n#endif // DRAW_MODE_lineSample\n\nuniform sampler2D u_skin;\n\nvarying vec2 v_texCoord;\n\n#if !defined(DRAW_MODE_silhouette) && (defined(ENABLE_color))\n// Branchless color conversions based on code from:\n// http://www.chilliant.com/rgb2hsv.html by Ian Taylor\n// Based in part on work by Sam Hocevar and Emil Persson\n// See also: https://en.wikipedia.org/wiki/HSL_and_HSV#Formal_derivation\n\n// Smaller values can cause problems on some mobile devices\nconst float epsilon = 1e-3;\n\n// Convert an RGB color to Hue, Saturation, and Value.\n// All components of input and output are expected to be in the [0,1] range.\nvec3 convertRGB2HSV(vec3 rgb)\n{\n\t// Hue calculation has 3 cases, depending on which RGB component is largest, and one of those cases involves a \"mod\"\n\t// operation. In order to avoid that \"mod\" we split the M==R case in two: one for G<B and one for B>G. The B>G case\n\t// will be calculated in the negative and fed through abs() in the hue calculation at the end.\n\t// See also: https://en.wikipedia.org/wiki/HSL_and_HSV#Hue_and_chroma\n\tconst vec4 hueOffsets = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n\n\t// temp1.xy = sort B & G (largest first)\n\t// temp1.z = the hue offset we'll use if it turns out that R is the largest component (M==R)\n\t// temp1.w = the hue offset we'll use if it turns out that R is not the largest component (M==G or M==B)\n\tvec4 temp1 = rgb.b > rgb.g ? vec4(rgb.bg, hueOffsets.wz) : vec4(rgb.gb, hueOffsets.xy);\n\n\t// temp2.x = the largest component of RGB (\"M\" / \"Max\")\n\t// temp2.yw = the smaller components of RGB, ordered for the hue calculation (not necessarily sorted by magnitude!)\n\t// temp2.z = the hue offset we'll use in the hue calculation\n\tvec4 temp2 = rgb.r > temp1.x ? vec4(rgb.r, temp1.yzx) : vec4(temp1.xyw, rgb.r);\n\n\t// m = the smallest component of RGB (\"min\")\n\tfloat m = min(temp2.y, temp2.w);\n\n\t// Chroma = M - m\n\tfloat C = temp2.x - m;\n\n\t// Value = M\n\tfloat V = temp2.x;\n\n\treturn vec3(\n\t\tabs(temp2.z + (temp2.w - temp2.y) / (6.0 * C + epsilon)), // Hue\n\t\tC / (temp2.x + epsilon), // Saturation\n\t\tV); // Value\n}\n\nvec3 convertHue2RGB(float hue)\n{\n\tfloat r = abs(hue * 6.0 - 3.0) - 1.0;\n\tfloat g = 2.0 - abs(hue * 6.0 - 2.0);\n\tfloat b = 2.0 - abs(hue * 6.0 - 4.0);\n\treturn clamp(vec3(r, g, b), 0.0, 1.0);\n}\n\nvec3 convertHSV2RGB(vec3 hsv)\n{\n\tvec3 rgb = convertHue2RGB(hsv.x);\n\tfloat c = hsv.z * hsv.y;\n\treturn rgb * c + hsv.z - c;\n}\n#endif // !defined(DRAW_MODE_silhouette) && (defined(ENABLE_color))\n\nconst vec2 kCenter = vec2(0.5, 0.5);\n\nvoid main()\n{\n\t#ifndef DRAW_MODE_lineSample\n\tvec2 texcoord0 = v_texCoord;\n\n\t#ifdef ENABLE_mosaic\n\ttexcoord0 = fract(u_mosaic * texcoord0);\n\t#endif // ENABLE_mosaic\n\n\t#ifdef ENABLE_pixelate\n\t{\n\t\t// TODO: clean up \"pixel\" edges\n\t\tvec2 pixelTexelSize = u_skinSize / u_pixelate;\n\t\ttexcoord0 = (floor(texcoord0 * pixelTexelSize) + kCenter) / pixelTexelSize;\n\t}\n\t#endif // ENABLE_pixelate\n\n\t#ifdef ENABLE_whirl\n\t{\n\t\tconst float kRadius = 0.5;\n\t\tvec2 offset = texcoord0 - kCenter;\n\t\tfloat offsetMagnitude = length(offset);\n\t\tfloat whirlFactor = max(1.0 - (offsetMagnitude / kRadius), 0.0);\n\t\tfloat whirlActual = u_whirl * whirlFactor * whirlFactor;\n\t\tfloat sinWhirl = sin(whirlActual);\n\t\tfloat cosWhirl = cos(whirlActual);\n\t\tmat2 rotationMatrix = mat2(\n\t\t\tcosWhirl, -sinWhirl,\n\t\t\tsinWhirl, cosWhirl\n\t\t);\n\n\t\ttexcoord0 = rotationMatrix * offset + kCenter;\n\t}\n\t#endif // ENABLE_whirl\n\n\t#ifdef ENABLE_fisheye\n\t{\n\t\tvec2 vec = (texcoord0 - kCenter) / kCenter;\n\t\tfloat vecLength = length(vec);\n\t\tfloat r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);\n\t\tvec2 unit = vec / vecLength;\n\n\t\ttexcoord0 = kCenter + r * unit * kCenter;\n\t}\n\t#endif // ENABLE_fisheye\n\n\tgl_FragColor = texture2D(u_skin, texcoord0);\n\n    #ifdef ENABLE_ghost\n    gl_FragColor.a *= u_ghost;\n    #endif // ENABLE_ghost\n\n\t#ifdef DRAW_MODE_silhouette\n\t// switch to u_silhouetteColor only AFTER the alpha test\n\tgl_FragColor = u_silhouetteColor;\n\t#else // DRAW_MODE_silhouette\n\n\t#if defined(ENABLE_color)\n\t{\n\t\tvec3 hsv = convertRGB2HSV(gl_FragColor.xyz);\n\n\t\t// this code forces grayscale values to be slightly saturated\n\t\t// so that some slight change of hue will be visible\n\t\tconst float minLightness = 0.11 / 2.0;\n\t\tconst float minSaturation = 0.09;\n\t\tif (hsv.z < minLightness) hsv = vec3(0.0, 1.0, minLightness);\n\t\telse if (hsv.y < minSaturation) hsv = vec3(0.0, minSaturation, hsv.z);\n\n\t\thsv.x = mod(hsv.x + u_color, 1.0);\n\t\tif (hsv.x < 0.0) hsv.x += 1.0;\n\n\t\tgl_FragColor.rgb = convertHSV2RGB(hsv);\n\t}\n\t#endif // defined(ENABLE_color)\n\n\t#if defined(ENABLE_brightness)\n\tgl_FragColor.rgb = clamp(gl_FragColor.rgb + vec3(u_brightness), vec3(0), vec3(1));\n\t#endif // defined(ENABLE_brightness)\n\n\t#ifdef DRAW_MODE_colorMask\n\tvec3 maskDistance = abs(gl_FragColor.rgb - u_colorMask);\n\tvec3 colorMaskTolerance = vec3(u_colorMaskTolerance, u_colorMaskTolerance, u_colorMaskTolerance);\n\tif (any(greaterThan(maskDistance, colorMaskTolerance)))\n\t{\n\t\tdiscard;\n\t}\n\t#endif // DRAW_MODE_colorMask\n\t#endif // DRAW_MODE_silhouette\n\n\t#else // DRAW_MODE_lineSample\n\tgl_FragColor = u_lineColor;\n\tgl_FragColor.a *= clamp(\n\t\t// Scale the capScale a little to have an aliased region.\n\t\t(u_capScale + u_aliasAmount -\n\t\t\tu_capScale * 2.0 * distance(v_texCoord, vec2(0.5, 0.5))\n\t\t) / (u_aliasAmount + 1.0),\n\t\t0.0,\n\t\t1.0\n\t);\n\t#endif // DRAW_MODE_lineSample\n}\n"

/***/ }),

/***/ "./node_modules/raw-loader/index.js!./src/shaders/sprite.vert":
/*!***********************************************************!*\
  !*** ./node_modules/raw-loader!./src/shaders/sprite.vert ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = "uniform mat4 u_projectionMatrix;\nuniform mat4 u_modelMatrix;\n\nattribute vec2 a_position;\nattribute vec2 a_texCoord;\n\nvarying vec2 v_texCoord;\n\n#ifdef DRAW_MODE_lineSample\nuniform float u_positionScalar;\n#endif\n\nvoid main() {\n    #ifdef DRAW_MODE_lineSample\n    vec2 position = a_position;\n    position.y = clamp(position.y * u_positionScalar, -0.5, 0.5);\n    gl_Position = u_projectionMatrix * u_modelMatrix * vec4(position, 0, 1);\n    #else\n    gl_Position = u_projectionMatrix * u_modelMatrix * vec4(a_position, 0, 1);\n    #endif\n    v_texCoord = a_texCoord;\n}\n"

/***/ }),

/***/ "./src/Drawable.js":
/*!*************************!*\
  !*** ./src/Drawable.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var twgl = __webpack_require__(/*! twgl.js */ "twgl.js");

var Rectangle = __webpack_require__(/*! ./Rectangle */ "./src/Rectangle.js");
var RenderConstants = __webpack_require__(/*! ./RenderConstants */ "./src/RenderConstants.js");
var Skin = __webpack_require__(/*! ./Skin */ "./src/Skin.js");

var Drawable = function () {
    /**
     * An object which can be drawn by the renderer.
     * @todo double-buffer all rendering state (position, skin, effects, etc.)
     * @param {!int} id - This Drawable's unique ID.
     * @constructor
     */
    function Drawable(id) {
        _classCallCheck(this, Drawable);

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


    _createClass(Drawable, [{
        key: 'getUniforms',


        /**
         * @returns {object.<string, *>} the shader uniforms to be used when rendering this Drawable.
         */
        value: function getUniforms() {
            if (this._transformDirty) {
                this._calculateTransform();
            }
            return this._uniforms;
        }

        /**
         * @returns {boolean} whether this Drawable is visible.
         */

    }, {
        key: 'getVisible',
        value: function getVisible() {
            return this._visible;
        }

        /**
         * Update the position, direction, scale, or effect properties of this Drawable.
         * @param {object.<string,*>} properties The new property values to set.
         */

    }, {
        key: 'updateProperties',
        value: function updateProperties(properties) {
            if ('position' in properties && (this._position[0] !== properties.position[0] || this._position[1] !== properties.position[1])) {
                this._position[0] = Math.round(properties.position[0]);
                this._position[1] = Math.round(properties.position[1]);
            }
            if ('direction' in properties && this._direction !== properties.direction) {
                this._direction = properties.direction;
                this._rotationTransformDirty = true;
            }
            if ('scale' in properties && (this._scale[0] !== properties.scale[0] || this._scale[1] !== properties.scale[1])) {
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

    }, {
        key: '_calculateTransform',
        value: function _calculateTransform() {
            if (this._rotationTransformDirty) {
                var rotation = (270 - this._direction) * Math.PI / 180;

                // Calling rotationZ sets the destination matrix to a rotation
                // around the Z axis setting matrix components 0, 1, 4 and 5 with
                // cosine and sine values of the rotation.
                // twgl.m4.rotationZ(rotation, this._rotationMatrix);

                // twgl assumes the last value set to the matrix was anything.
                // Drawable knows, it was another rotationZ matrix, so we can skip
                // assigning the values that will never change.
                var c = Math.cos(rotation);
                var s = Math.sin(rotation);
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
                var rotationCenter = this.skin.rotationCenter;
                var skinSize = this.skin.size;
                var center0 = rotationCenter[0];
                var center1 = rotationCenter[1];
                var skinSize0 = skinSize[0];
                var skinSize1 = skinSize[1];
                var _scale = this._scale[0];
                var _scale2 = this._scale[1];

                var rotationAdjusted = this._rotationAdjusted;
                rotationAdjusted[0] = (center0 - skinSize0 / 2) * _scale / 100;
                rotationAdjusted[1] = (center1 - skinSize1 / 2) * _scale2 / 100 * -1;
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
                var _skinSize = this.skin.size;
                var scaledSize = this._skinScale;
                scaledSize[0] = _skinSize[0] * this._scale[0] / 100;
                scaledSize[1] = _skinSize[1] * this._scale[1] / 100;
                // scaledSize[2] = 0;

                this._skinScaleDirty = false;
            }

            var modelMatrix = this._uniforms.u_modelMatrix;

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

            var scale0 = this._skinScale[0];
            var scale1 = this._skinScale[1];
            var rotation00 = this._rotationMatrix[0];
            var rotation01 = this._rotationMatrix[1];
            var rotation10 = this._rotationMatrix[4];
            var rotation11 = this._rotationMatrix[5];
            var adjusted0 = this._rotationAdjusted[0];
            var adjusted1 = this._rotationAdjusted[1];
            var position0 = this._position[0];
            var position1 = this._position[1];

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
            modelMatrix[12] = rotation00 * adjusted0 + rotation10 * adjusted1 + position0;
            modelMatrix[13] = rotation01 * adjusted0 + rotation11 * adjusted1 + position1;
            // modelMatrix[14] = 0;
            // modelMatrix[15] = 1;

            this._transformDirty = false;
        }

        /**
         * Set the convex hull to be dirty.
         * Do this whenever the Drawable's shape has possibly changed.
         */

    }, {
        key: 'setConvexHullDirty',
        value: function setConvexHullDirty() {
            this._convexHullDirty = true;
        }

        /**
         * Should the drawable use NEAREST NEIGHBOR or LINEAR INTERPOLATION mode
         */

    }, {
        key: 'id',
        get: function get() {
            return this._id;
        }

        /**
         * @returns {Skin} the current skin for this Drawable.
         */

    }, {
        key: 'skin',
        get: function get() {
            return this._skin;
        }

        /**
         * @param {Skin} newSkin - A new Skin for this Drawable.
         */
        ,
        set: function set(newSkin) {
            this._skin = newSkin;
        }

        /**
         * @returns {Array<number>} the current scaling percentages applied to this Drawable. [100,100] is normal size.
         */

    }, {
        key: 'scale',
        get: function get() {
            return [this._scale[0], this._scale[1]];
        }
    }, {
        key: 'useNearest',
        get: function get() {
            // We can't use nearest neighbor unless we are a multiple of 90 rotation
            if (this._direction % 90 !== 0) {
                return false;
            }

            // If the scale of the skin is very close to 100 (0.99999 variance is okay I guess)
            if (Math.abs(this.scale[0]) > 99 && Math.abs(this.scale[0]) < 101 && Math.abs(this.scale[1]) > 99 && Math.abs(this.scale[1]) < 101) {
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

    }], [{
        key: 'color4fFromID',
        value: function color4fFromID(id) {
            id -= RenderConstants.ID_NONE;
            var r = (id >> 0 & 255) / 255.0;
            var g = (id >> 8 & 255) / 255.0;
            var b = (id >> 16 & 255) / 255.0;
            return [r, g, b, 1.0];
        }
    }]);

    return Drawable;
}();

module.exports = Drawable;

/***/ }),

/***/ "./src/Rectangle.js":
/*!**************************!*\
  !*** ./src/Rectangle.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rectangle = function () {
    /**
     * A utility for creating and comparing axis-aligned rectangles.
     * Rectangles are always initialized to the "largest possible rectangle";
     * use one of the init* methods below to set up a particular rectangle.
     * @constructor
     */
    function Rectangle() {
        _classCallCheck(this, Rectangle);

        this.left = -Infinity;
        this.right = Infinity;
        this.bottom = -Infinity;
        this.top = Infinity;
    }

    /**
     * Initialize a Rectangle from given Scratch-coordinate bounds.
     * @param {number} left Left bound of the rectangle.
     * @param {number} right Right bound of the rectangle.
     * @param {number} bottom Bottom bound of the rectangle.
     * @param {number} top Top bound of the rectangle.
     */


    _createClass(Rectangle, [{
        key: "initFromBounds",
        value: function initFromBounds(left, right, bottom, top) {
            this.left = left;
            this.right = right;
            this.bottom = bottom;
            this.top = top;
        }

        /**
         * Initialize a Rectangle to the minimum AABB around a set of points.
         * @param {Array<Array<number>>} points Array of [x, y] points.
         */

    }, {
        key: "initFromPointsAABB",
        value: function initFromPointsAABB(points) {
            this.left = Infinity;
            this.right = -Infinity;
            this.top = -Infinity;
            this.bottom = Infinity;

            for (var i = 0; i < points.length; i++) {
                var x = points[i][0];
                var y = points[i][1];
                if (x < this.left) {
                    this.left = x;
                }
                if (x > this.right) {
                    this.right = x;
                }
                if (y > this.top) {
                    this.top = y;
                }
                if (y < this.bottom) {
                    this.bottom = y;
                }
            }
        }

        /**
         * Determine if this Rectangle intersects some other.
         * Note that this is a comparison assuming the Rectangle was
         * initialized with Scratch-space bounds or points.
         * @param {!Rectangle} other Rectangle to check if intersecting.
         * @return {boolean} True if this Rectangle intersects other.
         */

    }, {
        key: "intersects",
        value: function intersects(other) {
            return this.left <= other.right && other.left <= this.right && this.top >= other.bottom && other.top >= this.bottom;
        }

        /**
         * Determine if this Rectangle fully contains some other.
         * Note that this is a comparison assuming the Rectangle was
         * initialized with Scratch-space bounds or points.
         * @param {!Rectangle} other Rectangle to check if fully contained.
         * @return {boolean} True if this Rectangle fully contains other.
         */

    }, {
        key: "contains",
        value: function contains(other) {
            return other.left > this.left && other.right < this.right && other.top < this.top && other.bottom > this.bottom;
        }

        /**
         * Clamp a Rectangle to bounds.
         * @param {number} left Left clamp.
         * @param {number} right Right clamp.
         * @param {number} bottom Bottom clamp.
         * @param {number} top Top clamp.
         */

    }, {
        key: "clamp",
        value: function clamp(left, right, bottom, top) {
            this.left = Math.max(this.left, left);
            this.right = Math.min(this.right, right);
            this.bottom = Math.max(this.bottom, bottom);
            this.top = Math.min(this.top, top);
            // Ensure rectangle coordinates in order.
            this.left = Math.min(this.left, this.right);
            this.right = Math.max(this.right, this.left);
            this.bottom = Math.min(this.bottom, this.top);
            this.top = Math.max(this.top, this.bottom);
        }

        /**
         * Push out the Rectangle to integer bounds.
         */

    }, {
        key: "snapToInt",
        value: function snapToInt() {
            this.left = Math.floor(this.left);
            this.right = Math.ceil(this.right);
            this.bottom = Math.floor(this.bottom);
            this.top = Math.ceil(this.top);
        }

        /**
         * Compute the intersection of two bounding Rectangles.
         * Could be an impossible box if they don't intersect.
         * @param {Rectangle} a One rectangle
         * @param {Rectangle} b Other rectangle
         * @param {?Rectangle} result A resulting storage rectangle  (safe to pass
         *                            a or b if you want to overwrite one)
         * @returns {Rectangle} resulting rectangle
         */

    }, {
        key: "width",


        /**
         * Width of the Rectangle.
         * @return {number} Width of rectangle.
         */
        get: function get() {
            return Math.abs(this.left - this.right);
        }

        /**
         * Height of the Rectangle.
         * @return {number} Height of rectangle.
         */

    }, {
        key: "height",
        get: function get() {
            return Math.abs(this.top - this.bottom);
        }
    }], [{
        key: "intersect",
        value: function intersect(a, b) {
            var result = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Rectangle();

            result.left = Math.max(a.left, b.left);
            result.right = Math.min(a.right, b.right);
            result.top = Math.min(a.top, b.top);
            result.bottom = Math.max(a.bottom, b.bottom);

            return result;
        }

        /**
         * Compute the union of two bounding Rectangles.
         * @param {Rectangle} a One rectangle
         * @param {Rectangle} b Other rectangle
         * @param {?Rectangle} result A resulting storage rectangle  (safe to pass
         *                            a or b if you want to overwrite one)
         * @returns {Rectangle} resulting rectangle
         */

    }, {
        key: "union",
        value: function union(a, b) {
            var result = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Rectangle();

            result.left = Math.min(a.left, b.left);
            result.right = Math.max(a.right, b.right);
            // Scratch Space - +y is up
            result.top = Math.max(a.top, b.top);
            result.bottom = Math.min(a.bottom, b.bottom);
            return result;
        }
    }]);

    return Rectangle;
}();

module.exports = Rectangle;

/***/ }),

/***/ "./src/RenderConstants.js":
/*!********************************!*\
  !*** ./src/RenderConstants.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/** @module RenderConstants */

/**
 * Various constants meant for use throughout the renderer.
 * @enum
 */
module.exports = {
  /**
   * The ID value to use for "no item" or when an object has been disposed.
   * @const {int}
   */
  ID_NONE: -1,

  /**
   * Optimize for fewer than this number of Drawables sharing the same Skin.
   * Going above this may cause middleware warnings or a performance penalty but should otherwise behave correctly.
   * @const {int}
   */
  SKIN_SHARE_SOFT_LIMIT: 301,

  /**
   * @enum {string}
   */
  Events: {
    /**
     * NativeSizeChanged event
     *
     * @event RenderWebGL#event:NativeSizeChanged
     * @type {object}
     * @property {Array<int>} newSize - the new size of the renderer
     */
    NativeSizeChanged: 'NativeSizeChanged'
  }
};

/***/ }),

/***/ "./src/RenderWebGL.js":
/*!****************************!*\
  !*** ./src/RenderWebGL.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = __webpack_require__(/*! events */ "events");

var hull = __webpack_require__(/*! hull.js */ "hull.js");
var twgl = __webpack_require__(/*! twgl.js */ "twgl.js");

var Drawable = __webpack_require__(/*! ./Drawable */ "./src/Drawable.js");
var Rectangle = __webpack_require__(/*! ./Rectangle */ "./src/Rectangle.js");
var ShaderManager = __webpack_require__(/*! ./ShaderManager */ "./src/ShaderManager.js");
var RenderConstants = __webpack_require__(/*! ./RenderConstants */ "./src/RenderConstants.js");
var SVGSkin = __webpack_require__(/*! ./SVGSkin */ "./src/SVGSkin.js");

var __candidatesBounds = new Rectangle();
var __touchingColor = new Uint8ClampedArray(4);
var __blendColor = new Uint8ClampedArray(4);

/**
 * Maximum touch size for a picking check.
 * @todo Figure out a reasonable max size. Maybe this should be configurable?
 * @type {Array<int>}
 * @memberof RenderWebGL
 */
var MAX_TOUCH_SIZE = [3, 3];

var RenderWebGL = function (_EventEmitter) {
    _inherits(RenderWebGL, _EventEmitter);

    _createClass(RenderWebGL, null, [{
        key: '_getContext',

        /**
         * Ask TWGL to create a rendering context with the attributes used by this renderer.
         * @param {canvas} canvas - attach the context to this canvas.
         * @returns {WebGLRenderingContext} - a TWGL rendering context (backed by either WebGL 1.0 or 2.0).
         * @private
         */
        value: function _getContext(canvas) {
            return twgl.getWebGLContext(canvas, { alpha: false, stencil: true });
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

    }]);

    function RenderWebGL(canvas, xLeft, xRight, yBottom, yTop) {
        _classCallCheck(this, RenderWebGL);

        /** @type {WebGLRenderingContext} */
        var _this = _possibleConstructorReturn(this, (RenderWebGL.__proto__ || Object.getPrototypeOf(RenderWebGL)).call(this));

        var gl = _this._gl = RenderWebGL._getContext(canvas);
        if (!gl) {
            throw new Error('Could not get WebGL context: this browser or environment may not support WebGL.');
        }
        /** @type {Drawable[]} */
        _this._allDrawables = [];

        /** @type {Skin[]} */
        _this._allSkins = [];

        /** @type {Array<int>} */
        _this._drawList = [];

        // A list of layer group names in the order they should appear
        // from furthest back to furthest in front.
        /** @type {Array<String>} */
        _this._groupOrdering = [];

        /**
         * @typedef LayerGroup
         * @property {int} groupIndex The relative position of this layer group in the group ordering
         * @property {int} drawListOffset The absolute position of this layer group in the draw list
         * This number gets updated as drawables get added to or deleted from the draw list.
         */

        // Map of group name to layer group
        /** @type {Object.<string, LayerGroup>} */
        _this._layerGroups = {};

        /** @type {int} */
        _this._nextDrawableId = RenderConstants.ID_NONE + 1;

        /** @type {int} */
        _this._nextSkinId = RenderConstants.ID_NONE + 1;

        /** @type {ShaderManager} */
        _this._shaderManager = new ShaderManager(gl);

        /** @type {module:twgl/m4.Mat4} */
        _this._projection = twgl.m4.identity();

        /** @type {HTMLCanvasElement} */
        _this._tempCanvas = document.createElement('canvas');

        /** @type {any} */
        _this._regionId = null;

        /** @type {function} */
        _this._exitRegion = null;

        /** @type {Array.<snapshotCallback>} */
        _this._snapshotCallbacks = [];

        _this._createGeometry();

        _this.on(RenderConstants.Events.NativeSizeChanged, _this.onNativeSizeChanged);

        _this.setBackgroundColor(1, 1, 1);
        _this.setStageSize(xLeft || -240, xRight || 240, yBottom || -180, yTop || 180);
        _this.resize(_this._nativeSize[0], _this._nativeSize[1]);

        gl.disable(gl.DEPTH_TEST);
        /** @todo disable when no partial transparency? */
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        return _this;
    }

    /**
     * @returns {WebGLRenderingContext} the WebGL rendering context associated with this renderer.
     */


    _createClass(RenderWebGL, [{
        key: 'resize',


        /**
         * Set the physical size of the stage in device-independent pixels.
         * This will be multiplied by the device's pixel ratio on high-DPI displays.
         * @param {int} pixelsWide The desired width in device-independent pixels.
         * @param {int} pixelsTall The desired height in device-independent pixels.
         */
        value: function resize(pixelsWide, pixelsTall) {
            var pixelRatio = window.devicePixelRatio || 1;
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

    }, {
        key: 'setBackgroundColor',
        value: function setBackgroundColor(red, green, blue) {
            this._backgroundColor = [red, green, blue, 1];
        }

        /**
         * Set logical size of the stage in Scratch units.
         * @param {int} xLeft The left edge's x-coordinate. Scratch 2 uses -240.
         * @param {int} xRight The right edge's x-coordinate. Scratch 2 uses 240.
         * @param {int} yBottom The bottom edge's y-coordinate. Scratch 2 uses -180.
         * @param {int} yTop The top edge's y-coordinate. Scratch 2 uses 180.
         */

    }, {
        key: 'setStageSize',
        value: function setStageSize(xLeft, xRight, yBottom, yTop) {
            this._xLeft = xLeft;
            this._xRight = xRight;
            this._yBottom = yBottom;
            this._yTop = yTop;

            // swap yBottom & yTop to fit Scratch convention of +y=up
            this._projection = twgl.m4.ortho(xLeft, xRight, yBottom, yTop, -1, 1);

            this._setNativeSize(Math.abs(xRight - xLeft), Math.abs(yBottom - yTop));
        }

        /**
         * Set the "native" size of the stage, which is used for pen, query renders, etc.
         * @param {int} width - the new width to set.
         * @param {int} height - the new height to set.
         * @private
         * @fires RenderWebGL#event:NativeSizeChanged
         */

    }, {
        key: '_setNativeSize',
        value: function _setNativeSize(width, height) {
            this._nativeSize = [width, height];
            this.emit(RenderConstants.Events.NativeSizeChanged, { newSize: this._nativeSize });
        }

        /**
         * Create a new SVG skin.
         * @param {!string} svgData - new SVG to use.
         * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
         * skin will be used
         * @returns {!int} the ID for the new skin.
         */

    }, {
        key: 'createSVGSkin',
        value: function createSVGSkin(svgData, rotationCenter) {
            var skinId = this._nextSkinId++;
            var newSkin = new SVGSkin(skinId, this);
            newSkin.setSVG(svgData, rotationCenter);
            this._allSkins[skinId] = newSkin;
            return skinId;
        }

        /**
         * Create a new Drawable and add it to the scene.
         * @param {string} group Layer group to add the drawable to
         * @returns {int} The ID of the new Drawable.
         */

    }, {
        key: 'createDrawable',
        value: function createDrawable(group) {
            if (!group || !this._layerGroups.hasOwnProperty(group)) {
                return;
            }
            var drawableID = this._nextDrawableId++;
            var drawable = new Drawable(drawableID);
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

    }, {
        key: 'setLayerGroupOrdering',
        value: function setLayerGroupOrdering(groupOrdering) {
            this._groupOrdering = groupOrdering;
            for (var i = 0; i < this._groupOrdering.length; i++) {
                this._layerGroups[this._groupOrdering[i]] = {
                    groupIndex: i,
                    drawListOffset: 0
                };
            }
        }
    }, {
        key: '_addToDrawList',
        value: function _addToDrawList(drawableID, group) {
            var currentLayerGroup = this._layerGroups[group];
            var currentGroupOrderingIndex = currentLayerGroup.groupIndex;

            var drawListOffset = this._endIndexForKnownLayerGroup(currentLayerGroup);
            this._drawList.splice(drawListOffset, 0, drawableID);

            this._updateOffsets('add', currentGroupOrderingIndex);
        }
    }, {
        key: '_updateOffsets',
        value: function _updateOffsets(updateType, currentGroupOrderingIndex) {
            for (var i = currentGroupOrderingIndex + 1; i < this._groupOrdering.length; i++) {
                var laterGroupName = this._groupOrdering[i];
                if (updateType === 'add') {
                    this._layerGroups[laterGroupName].drawListOffset++;
                } else if (updateType === 'delete') {
                    this._layerGroups[laterGroupName].drawListOffset--;
                }
            }
        }
    }, {
        key: '_endIndexForKnownLayerGroup',


        // Given a layer group, return the index where it ends (non-inclusive),
        // e.g. the returned index does not have a drawable from this layer group in it)
        value: function _endIndexForKnownLayerGroup(layerGroup) {
            var groupIndex = layerGroup.groupIndex;
            if (groupIndex === this._groupOrdering.length - 1) {
                return this._drawList.length;
            }
            return this._layerGroups[this._groupOrdering[groupIndex + 1]].drawListOffset;
        }

        /**
         * Draw all current drawables and present the frame on the canvas.
         */

    }, {
        key: 'draw',
        value: function draw() {
            this._doExitDrawRegion();

            var gl = this._gl;

            twgl.bindFramebufferInfo(gl, null);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor.apply(gl, this._backgroundColor);
            gl.clear(gl.COLOR_BUFFER_BIT);

            this._drawThese(this._drawList, ShaderManager.DRAW_MODE.default, this._projection);
            if (this._snapshotCallbacks.length > 0) {
                var snapshot = gl.canvas.toDataURL();
                this._snapshotCallbacks.forEach(function (cb) {
                    return cb(snapshot);
                });
                this._snapshotCallbacks = [];
            }
        }

        /**
         * Update the position, direction, scale, or effect properties of this Drawable.
         * @param {int} drawableID The ID of the Drawable to update.
         * @param {object.<string,*>} properties The new property values to set.
         */

    }, {
        key: 'updateDrawableProperties',
        value: function updateDrawableProperties(drawableID, properties) {
            var drawable = this._allDrawables[drawableID];
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
                var newRotationCenter = properties.rotationCenter;
                drawable.skin.setRotationCenter(newRotationCenter[0], newRotationCenter[1]);
            }
            drawable.updateProperties(properties);
        }

        /* ******
         * Truly internal functions: these support the functions above.
         ********/

        /**
         * Build geometry (vertex and index) buffers.
         * @private
         */

    }, {
        key: '_createGeometry',
        value: function _createGeometry() {
            var quad = {
                a_position: {
                    numComponents: 2,
                    data: [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]
                },
                a_texCoord: {
                    numComponents: 2,
                    data: [1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1]
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

    }, {
        key: 'onNativeSizeChanged',
        value: function onNativeSizeChanged(event) {
            var _event$newSize = _slicedToArray(event.newSize, 2),
                width = _event$newSize[0],
                height = _event$newSize[1];

            var gl = this._gl;
            var attachments = [{ format: gl.RGBA }, { format: gl.DEPTH_STENCIL }];

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
         * Forcefully exit the current region returning to a common inbetween GL
         * state.
         */

    }, {
        key: '_doExitDrawRegion',
        value: function _doExitDrawRegion() {
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

    }, {
        key: '_drawThese',
        value: function _drawThese(drawables, drawMode, projection) {
            var opts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};


            var gl = this._gl;
            var currentShader = null;

            var numDrawables = drawables.length;
            for (var drawableIndex = 0; drawableIndex < numDrawables; ++drawableIndex) {
                var drawableID = drawables[drawableIndex];

                // If we have a filter, check whether the ID fails
                if (opts.filter && !opts.filter(drawableID)) continue;

                var drawable = this._allDrawables[drawableID];
                /** @todo check if drawable is inside the viewport before anything else */

                // Hidden drawables (e.g., by a "hide" block) are not drawn unless
                // the ignoreVisibility flag is used (e.g. for stamping or touchingColor).
                if (!drawable.getVisible() && !opts.ignoreVisibility) continue;

                // Combine drawable scale with the native vs. backing pixel ratio
                var drawableScale = [drawable.scale[0] * this._gl.canvas.width / this._nativeSize[0], drawable.scale[1] * this._gl.canvas.height / this._nativeSize[1]];

                // If the skin or texture isn't ready yet, skip it.
                if (!drawable.skin || !drawable.skin.getTexture(drawableScale)) continue;

                var uniforms = {};

                var newShader = this._shaderManager.getShader(drawMode, 0);

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

                Object.assign(uniforms, drawable.skin.getUniforms(drawableScale), drawable.getUniforms());

                // Apply extra uniforms after the Drawable's, to allow overwriting.
                if (opts.extraUniforms) {
                    Object.assign(uniforms, opts.extraUniforms);
                }

                if (uniforms.u_skin) {
                    twgl.setTextureParameters(gl, uniforms.u_skin, { minMag: drawable.useNearest ? gl.NEAREST : gl.LINEAR });
                }

                twgl.setUniforms(currentShader, uniforms);

                /* adjust blend function for this skin */
                if (drawable.skin.hasPremultipliedAlpha) {
                    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                } else {
                    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                }

                twgl.drawBufferInfo(gl, this._bufferInfo, gl.TRIANGLES);
            }

            this._regionId = null;
        }
    }, {
        key: 'gl',
        get: function get() {
            return this._gl;
        }

        /**
         * @returns {HTMLCanvasElement} the canvas of the WebGL rendering context associated with this renderer.
         */

    }, {
        key: 'canvas',
        get: function get() {
            return this._gl && this._gl.canvas;
        }
    }, {
        key: '_visibleDrawList',
        get: function get() {
            var _this2 = this;

            return this._drawList.filter(function (id) {
                return _this2._allDrawables[id]._visible;
            });
        }
    }]);

    return RenderWebGL;
}(EventEmitter);

module.exports = RenderWebGL;

/***/ }),

/***/ "./src/SVGSkin.js":
/*!************************!*\
  !*** ./src/SVGSkin.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var twgl = __webpack_require__(/*! twgl.js */ "twgl.js");

var Skin = __webpack_require__(/*! ./Skin */ "./src/Skin.js");
var SvgRenderer = __webpack_require__(/*! scratch-svg-renderer */ "scratch-svg-renderer").SVGRenderer;

var MAX_TEXTURE_DIMENSION = 2048;

var SVGSkin = function (_Skin) {
    _inherits(SVGSkin, _Skin);

    /**
     * Create a new SVG skin.
     * @param {!int} id - The ID for this Skin.
     * @param {!RenderWebGL} renderer - The renderer which will use this skin.
     * @constructor
     * @extends Skin
     */
    function SVGSkin(id, renderer) {
        _classCallCheck(this, SVGSkin);

        /** @type {RenderWebGL} */
        var _this = _possibleConstructorReturn(this, (SVGSkin.__proto__ || Object.getPrototypeOf(SVGSkin)).call(this, id));

        _this._renderer = renderer;

        /** @type {SvgRenderer} */
        _this._svgRenderer = new SvgRenderer();

        /** @type {WebGLTexture} */
        _this._texture = null;

        /** @type {number} */
        _this._textureScale = 1;

        /** @type {Number} */
        _this._maxTextureScale = 0;
        return _this;
    }

    /**
     * Dispose of this object. Do not use it after calling this method.
     */


    _createClass(SVGSkin, [{
        key: 'dispose',
        value: function dispose() {
            if (this._texture) {
                this._renderer.gl.deleteTexture(this._texture);
                this._texture = null;
            }
            _get(SVGSkin.prototype.__proto__ || Object.getPrototypeOf(SVGSkin.prototype), 'dispose', this).call(this);
        }

        /**
         * @return {Array<number>} the natural size, in Scratch units, of this skin.
         */

    }, {
        key: 'setRotationCenter',


        /**
         * Set the origin, in object space, about which this Skin should rotate.
         * @param {number} x - The x coordinate of the new rotation center.
         * @param {number} y - The y coordinate of the new rotation center.
         */
        value: function setRotationCenter(x, y) {
            var viewOffset = this._svgRenderer.viewOffset;
            _get(SVGSkin.prototype.__proto__ || Object.getPrototypeOf(SVGSkin.prototype), 'setRotationCenter', this).call(this, x - viewOffset[0], y - viewOffset[1]);
        }

        /**
         * @param {Array<number>} scale - The scaling factors to be used, each in the [0,100] range.
         * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given scale.
         */
        // eslint-disable-next-line no-unused-vars

    }, {
        key: 'getTexture',
        value: function getTexture(scale) {
            var _this2 = this;

            // The texture only ever gets uniform scale. Take the larger of the two axes.
            var scaleMax = scale ? Math.max(Math.abs(scale[0]), Math.abs(scale[1])) : 100;
            var requestedScale = Math.min(scaleMax / 100, this._maxTextureScale);
            var newScale = this._textureScale;
            while (newScale < this._maxTextureScale && requestedScale >= 1.5 * newScale) {
                newScale *= 2;
            }
            if (this._textureScale !== newScale) {
                this._textureScale = newScale;
                this._svgRenderer._draw(this._textureScale, function () {
                    if (_this2._textureScale === newScale) {
                        var canvas = _this2._svgRenderer.canvas;
                        var context = canvas.getContext('2d');
                        var textureData = context.getImageData(0, 0, canvas.width, canvas.height);

                        var gl = _this2._renderer.gl;
                        gl.bindTexture(gl.TEXTURE_2D, _this2._texture);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
                        _this2._silhouette.update(textureData);
                    }
                });
            }

            return this._texture;
        }

        /**
         * Set the contents of this skin to a snapshot of the provided SVG data.
         * @param {string} svgData - new SVG to use.
         * @param {Array<number>} [rotationCenter] - Optional rotation center for the SVG. If not supplied, it will be
         * calculated from the bounding box
         * @fires Skin.event:WasAltered
         */

    }, {
        key: 'setSVG',
        value: function setSVG(svgData, rotationCenter) {
            var _this3 = this;

            this._svgRenderer.fromString(svgData, 1, function () {
                var gl = _this3._renderer.gl;
                _this3._textureScale = _this3._maxTextureScale = 1;

                // Pull out the ImageData from the canvas. ImageData speeds up
                // updating Silhouette and is better handled by more browsers in
                // regards to memory.
                var canvas = _this3._svgRenderer.canvas;
                var context = canvas.getContext('2d');
                var textureData = context.getImageData(0, 0, canvas.width, canvas.height);

                if (_this3._texture) {
                    gl.bindTexture(gl.TEXTURE_2D, _this3._texture);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
                    _this3._silhouette.update(textureData);
                } else {
                    // TODO: mipmaps?
                    var textureOptions = {
                        auto: true,
                        wrap: gl.CLAMP_TO_EDGE,
                        src: textureData
                    };

                    _this3._texture = twgl.createTexture(gl, textureOptions);
                    _this3._silhouette.update(textureData);
                }

                var maxDimension = Math.max(_this3._svgRenderer.canvas.width, _this3._svgRenderer.canvas.height);
                var testScale = 2;
                for (testScale; maxDimension * testScale <= MAX_TEXTURE_DIMENSION; testScale *= 2) {
                    _this3._maxTextureScale = testScale;
                }

                if (typeof rotationCenter === 'undefined') rotationCenter = _this3.calculateRotationCenter();
                _this3.setRotationCenter.apply(_this3, rotationCenter);
                _this3.emit(Skin.Events.WasAltered);
            });
        }
    }, {
        key: 'size',
        get: function get() {
            return this._svgRenderer.size;
        }
    }]);

    return SVGSkin;
}(Skin);

module.exports = SVGSkin;

/***/ }),

/***/ "./src/ShaderManager.js":
/*!******************************!*\
  !*** ./src/ShaderManager.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var twgl = __webpack_require__(/*! twgl.js */ "twgl.js");

var ShaderManager = function () {
    /**
     * @param {WebGLRenderingContext} gl WebGL rendering context to create shaders for
     * @constructor
     */
    function ShaderManager(gl) {
        _classCallCheck(this, ShaderManager);

        this._gl = gl;

        /**
         * The cache of all shaders compiled so far, filled on demand.
         * @type {Object<ShaderManager.DRAW_MODE, Array<ProgramInfo>>}
         * @private
         */
        this._shaderCache = {};
        for (var modeName in ShaderManager.DRAW_MODE) {
            if (ShaderManager.DRAW_MODE.hasOwnProperty(modeName)) {
                this._shaderCache[modeName] = [];
            }
        }
    }

    /**
     * Fetch the shader for a particular set of active effects.
     * Build the shader if necessary.
     * @param {ShaderManager.DRAW_MODE} drawMode Draw normally, silhouette, etc.
     * @param {int} effectBits Bitmask representing the enabled effects.
     * @returns {ProgramInfo} The shader's program info.
     */


    _createClass(ShaderManager, [{
        key: 'getShader',
        value: function getShader(drawMode, effectBits) {
            var cache = this._shaderCache[drawMode];
            if (drawMode === ShaderManager.DRAW_MODE.silhouette) {
                // Silhouette mode isn't affected by these effects.
                effectBits &= ~(ShaderManager.EFFECT_INFO.color.mask | ShaderManager.EFFECT_INFO.brightness.mask);
            }
            var shader = cache[effectBits];
            if (!shader) {
                shader = cache[effectBits] = this._buildShader(drawMode, effectBits);
            }
            return shader;
        }

        /**
         * Build the shader for a particular set of active effects.
         * @param {ShaderManager.DRAW_MODE} drawMode Draw normally, silhouette, etc.
         * @param {int} effectBits Bitmask representing the enabled effects.
         * @returns {ProgramInfo} The new shader's program info.
         * @private
         */

    }, {
        key: '_buildShader',
        value: function _buildShader(drawMode, effectBits) {
            var numEffects = ShaderManager.EFFECTS.length;

            var defines = ['#define DRAW_MODE_' + drawMode];
            for (var index = 0; index < numEffects; ++index) {
                if ((effectBits & 1 << index) !== 0) {
                    defines.push('#define ENABLE_' + ShaderManager.EFFECTS[index]);
                }
            }

            var definesText = defines.join('\n') + '\n';

            /* eslint-disable global-require */
            var vsFullText = definesText + __webpack_require__(/*! raw-loader!./shaders/sprite.vert */ "./node_modules/raw-loader/index.js!./src/shaders/sprite.vert");
            var fsFullText = definesText + __webpack_require__(/*! raw-loader!./shaders/sprite.frag */ "./node_modules/raw-loader/index.js!./src/shaders/sprite.frag");
            /* eslint-enable global-require */

            return twgl.createProgramInfo(this._gl, [vsFullText, fsFullText]);
        }
    }]);

    return ShaderManager;
}();

/**
 * @typedef {object} ShaderManager.Effect
 * @prop {int} mask - The bit in 'effectBits' representing the effect.
 * @prop {function} converter - A conversion function which takes a Scratch value (generally in the range
 *   0..100 or -100..100) and maps it to a value useful to the shader. This
 *   mapping may not be reversible.
 * @prop {boolean} shapeChanges - Whether the effect could change the drawn shape.
 */

/**
 * Mapping of each effect name to info about that effect.
 * @enum {ShaderManager.Effect}
 */


ShaderManager.EFFECT_INFO = {
    /** Color effect */
    color: {
        uniformName: 'u_color',
        mask: 1 << 0,
        converter: function converter(x) {
            return x / 200 % 1;
        },
        shapeChanges: false
    },
    /** Fisheye effect */
    fisheye: {
        uniformName: 'u_fisheye',
        mask: 1 << 1,
        converter: function converter(x) {
            return Math.max(0, (x + 100) / 100);
        },
        shapeChanges: true
    },
    /** Whirl effect */
    whirl: {
        uniformName: 'u_whirl',
        mask: 1 << 2,
        converter: function converter(x) {
            return -x * Math.PI / 180;
        },
        shapeChanges: true
    },
    /** Pixelate effect */
    pixelate: {
        uniformName: 'u_pixelate',
        mask: 1 << 3,
        converter: function converter(x) {
            return Math.abs(x) / 10;
        },
        shapeChanges: true
    },
    /** Mosaic effect */
    mosaic: {
        uniformName: 'u_mosaic',
        mask: 1 << 4,
        converter: function converter(x) {
            x = Math.round((Math.abs(x) + 10) / 10);
            /** @todo cap by Math.min(srcWidth, srcHeight) */
            return Math.max(1, Math.min(x, 512));
        },
        shapeChanges: true
    },
    /** Brightness effect */
    brightness: {
        uniformName: 'u_brightness',
        mask: 1 << 5,
        converter: function converter(x) {
            return Math.max(-100, Math.min(x, 100)) / 100;
        },
        shapeChanges: false
    },
    /** Ghost effect */
    ghost: {
        uniformName: 'u_ghost',
        mask: 1 << 6,
        converter: function converter(x) {
            return 1 - Math.max(0, Math.min(x, 100)) / 100;
        },
        shapeChanges: false
    }
};

/**
 * The name of each supported effect.
 * @type {Array}
 */
ShaderManager.EFFECTS = Object.keys(ShaderManager.EFFECT_INFO);

/**
 * The available draw modes.
 * @readonly
 * @enum {string}
 */
ShaderManager.DRAW_MODE = {
    /**
     * Draw normally.
     */
    default: 'default',

    /**
     * Draw a silhouette using a solid color.
     */
    silhouette: 'silhouette',

    /**
     * Draw only the parts of the drawable which match a particular color.
     */
    colorMask: 'colorMask',

    /**
     * Sample a "texture" to draw a line with caps.
     */
    lineSample: 'lineSample',

    /**
     * Draw normally except for pre-multiplied alpha
     */
    stamp: 'stamp'
};

module.exports = ShaderManager;

/***/ }),

/***/ "./src/Silhouette.js":
/*!***************************!*\
  !*** ./src/Silhouette.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @fileoverview
 * A representation of a Skin's silhouette that can test if a point on the skin
 * renders a pixel where it is drawn.
 */

/**
 * <canvas> element used to update Silhouette data from skin bitmap data.
 * @type {CanvasElement}
 */
var __SilhouetteUpdateCanvas = void 0;

/**
 * Internal helper function (in hopes that compiler can inline).  Get a pixel
 * from silhouette data, or 0 if outside it's bounds.
 * @private
 * @param {Silhouette} silhouette - has data width and height
 * @param {number} x - x
 * @param {number} y - y
 * @return {number} Alpha value for x/y position
 */
var getPoint = function getPoint(_ref, x, y) {
    var width = _ref._width,
        height = _ref._height,
        data = _ref._colorData;

    // 0 if outside bouds, otherwise read from data.
    if (x >= width || y >= height || x < 0 || y < 0) {
        return 0;
    }
    return data[(y * width + x) * 4 + 3];
};

/**
 * Memory buffers for doing 4 corner sampling for linear interpolation
 */
var __cornerWork = [new Uint8ClampedArray(4), new Uint8ClampedArray(4), new Uint8ClampedArray(4), new Uint8ClampedArray(4)];

/**
 * Get the color from a given silhouette at an x/y local texture position.
 * @param {Silhouette} The silhouette to sample.
 * @param {number} x X position of texture (0-1).
 * @param {number} y Y position of texture (0-1).
 * @param {Uint8ClampedArray} dst A color 4b space.
 * @return {Uint8ClampedArray} The dst vector.
 */
var getColor4b = function getColor4b(_ref2, x, y, dst) {
    var width = _ref2._width,
        height = _ref2._height,
        data = _ref2._colorData;

    // 0 if outside bouds, otherwise read from data.
    if (x >= width || y >= height || x < 0 || y < 0) {
        return dst.fill(0);
    }
    var offset = (y * width + x) * 4;
    dst[0] = data[offset];
    dst[1] = data[offset + 1];
    dst[2] = data[offset + 2];
    dst[3] = data[offset + 3];
    return dst;
};

var Silhouette = function () {
    function Silhouette() {
        _classCallCheck(this, Silhouette);

        /**
         * The width of the data representing the current skin data.
         * @type {number}
         */
        this._width = 0;

        /**
         * The height of the data representing the current skin date.
         * @type {number}
         */
        this._height = 0;

        /**
         * The data representing a skin's silhouette shape.
         * @type {Uint8ClampedArray}
         */
        this._colorData = null;

        this.colorAtNearest = this.colorAtLinear = function (_, dst) {
            return dst.fill(0);
        };
    }

    /**
     * Update this silhouette with the bitmapData for a skin.
     * @param {*} bitmapData An image, canvas or other element that the skin
     * rendering can be queried from.
     */


    _createClass(Silhouette, [{
        key: 'update',
        value: function update(bitmapData) {
            var imageData = void 0;
            if (bitmapData instanceof ImageData) {
                // If handed ImageData directly, use it directly.
                imageData = bitmapData;
                this._width = bitmapData.width;
                this._height = bitmapData.height;
            } else {
                // Draw about anything else to our update canvas and poll image data
                // from that.
                var canvas = Silhouette._updateCanvas();
                var width = this._width = canvas.width = bitmapData.width;
                var height = this._height = canvas.height = bitmapData.height;
                var ctx = canvas.getContext('2d');

                if (!(width && height)) {
                    return;
                }
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(bitmapData, 0, 0, width, height);
                imageData = ctx.getImageData(0, 0, width, height);
            }

            this._colorData = imageData.data;
            // delete our custom overriden "uninitalized" color functions
            // let the prototype work for itself
            delete this.colorAtNearest;
            delete this.colorAtLinear;
        }

        /**
         * Sample a color from the silhouette at a given local position using
         * "nearest neighbor"
         * @param {twgl.v3} vec [x,y] texture space (0-1)
         * @param {Uint8ClampedArray} dst The memory buffer to store the value in. (4 bytes)
         * @returns {Uint8ClampedArray} dst
         */

    }, {
        key: 'colorAtNearest',
        value: function colorAtNearest(vec, dst) {
            return getColor4b(this, Math.floor(vec[0] * (this._width - 1)), Math.floor(vec[1] * (this._height - 1)), dst);
        }

        /**
         * Sample a color from the silhouette at a given local position using
         * "linear interpolation"
         * @param {twgl.v3} vec [x,y] texture space (0-1)
         * @param {Uint8ClampedArray} dst The memory buffer to store the value in. (4 bytes)
         * @returns {Uint8ClampedArray} dst
         */

    }, {
        key: 'colorAtLinear',
        value: function colorAtLinear(vec, dst) {
            var x = vec[0] * (this._width - 1);
            var y = vec[1] * (this._height - 1);

            var x1D = x % 1;
            var y1D = y % 1;
            var x0D = 1 - x1D;
            var y0D = 1 - y1D;

            var xFloor = Math.floor(x);
            var yFloor = Math.floor(y);

            var x0y0 = getColor4b(this, xFloor, yFloor, __cornerWork[0]);
            var x1y0 = getColor4b(this, xFloor + 1, yFloor, __cornerWork[1]);
            var x0y1 = getColor4b(this, xFloor, yFloor + 1, __cornerWork[2]);
            var x1y1 = getColor4b(this, xFloor + 1, yFloor + 1, __cornerWork[3]);

            dst[0] = x0y0[0] * x0D * y0D + x0y1[0] * x0D * y1D + x1y0[0] * x1D * y0D + x1y1[0] * x1D * y1D;
            dst[1] = x0y0[1] * x0D * y0D + x0y1[1] * x0D * y1D + x1y0[1] * x1D * y0D + x1y1[1] * x1D * y1D;
            dst[2] = x0y0[2] * x0D * y0D + x0y1[2] * x0D * y1D + x1y0[2] * x1D * y0D + x1y1[2] * x1D * y1D;
            dst[3] = x0y0[3] * x0D * y0D + x0y1[3] * x0D * y1D + x1y0[3] * x1D * y0D + x1y1[3] * x1D * y1D;

            return dst;
        }

        /**
         * Get the canvas element reused by Silhouettes to update their data with.
         * @private
         * @return {CanvasElement} A canvas to draw bitmap data to.
         */

    }], [{
        key: '_updateCanvas',
        value: function _updateCanvas() {
            if (typeof __SilhouetteUpdateCanvas === 'undefined') {
                __SilhouetteUpdateCanvas = document.createElement('canvas');
            }
            return __SilhouetteUpdateCanvas;
        }
    }]);

    return Silhouette;
}();

module.exports = Silhouette;

/***/ }),

/***/ "./src/Skin.js":
/*!*********************!*\
  !*** ./src/Skin.js ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = __webpack_require__(/*! events */ "events");

var twgl = __webpack_require__(/*! twgl.js */ "twgl.js");

var RenderConstants = __webpack_require__(/*! ./RenderConstants */ "./src/RenderConstants.js");
var Silhouette = __webpack_require__(/*! ./Silhouette */ "./src/Silhouette.js");

/**
 * Truncate a number into what could be stored in a 32 bit floating point value.
 * @param {number} num Number to truncate.
 * @return {number} Truncated value.
 */
var toFloat32 = function () {
  var memory = new Float32Array(1);
  return function (num) {
    memory[0] = num;
    return memory[0];
  };
}();

var Skin = function (_EventEmitter) {
  _inherits(Skin, _EventEmitter);

  /**
   * Create a Skin, which stores and/or generates textures for use in rendering.
   * @param {int} id - The unique ID for this Skin.
   * @constructor
   */
  function Skin(id) {
    _classCallCheck(this, Skin);

    /** @type {int} */
    var _this = _possibleConstructorReturn(this, (Skin.__proto__ || Object.getPrototypeOf(Skin)).call(this));

    _this._id = id;

    /** @type {Vec3} */
    _this._rotationCenter = twgl.v3.create(0, 0);

    /**
     * The uniforms to be used by the vertex and pixel shaders.
     * Some of these are used by other parts of the renderer as well.
     * @type {Object.<string,*>}
     * @private
     */
    _this._uniforms = {
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

    /**
     * A silhouette to store touching data, skins are responsible for keeping it up to date.
     * @private
     */
    _this._silhouette = new Silhouette();

    _this.setMaxListeners(RenderConstants.SKIN_SHARE_SOFT_LIMIT);
    return _this;
  }

  /**
   * Dispose of this object. Do not use it after calling this method.
   */


  _createClass(Skin, [{
    key: 'dispose',
    value: function dispose() {
      this._id = RenderConstants.ID_NONE;
    }

    /**
     * @returns {boolean} true if alpha is premultiplied, false otherwise
     */

  }, {
    key: 'setRotationCenter',


    /**
     * Set the origin, in object space, about which this Skin should rotate.
     * @param {number} x - The x coordinate of the new rotation center.
     * @param {number} y - The y coordinate of the new rotation center.
     * @fires Skin.event:WasAltered
     */
    value: function setRotationCenter(x, y) {
      var emptySkin = this.size[0] === 0 && this.size[1] === 0;
      // Compare a 32 bit x and y value against the stored 32 bit center
      // values.
      var changed = toFloat32(x) !== this._rotationCenter[0] || toFloat32(y) !== this._rotationCenter[1];
      if (!emptySkin && changed) {
        this._rotationCenter[0] = x;
        this._rotationCenter[1] = y;
        this.emit(Skin.Events.WasAltered);
      }
    }

    /**
     * Get the center of the current bounding box
     * @return {Array<number>} the center of the current bounding box
     */

  }, {
    key: 'calculateRotationCenter',
    value: function calculateRotationCenter() {
      return [this.size[0] / 2, this.size[1] / 2];
    }

    /**
     * @abstract
     * @param {Array<number>} scale - The scaling factors to be used.
     * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given size.
     */
    // eslint-disable-next-line no-unused-vars

  }, {
    key: 'getTexture',
    value: function getTexture(scale) {
      return null;
    }

    /**
     * Update and returns the uniforms for this skin.
     * @param {Array<number>} scale - The scaling factors to be used.
     * @returns {object.<string, *>} the shader uniforms to be used when rendering with this Skin.
     */

  }, {
    key: 'getUniforms',
    value: function getUniforms(scale) {
      this._uniforms.u_skin = this.getTexture(scale);
      this._uniforms.u_skinSize = this.size;
      return this._uniforms;
    }

    /**
     * If the skin defers silhouette operations until the last possible minute,
     * this will be called before isTouching uses the silhouette.
     * @abstract
     */

  }, {
    key: 'updateSilhouette',
    value: function updateSilhouette() {}
  }, {
    key: 'hasPremultipliedAlpha',
    get: function get() {
      return false;
    }

    /**
     * @return {int} the unique ID for this Skin.
     */

  }, {
    key: 'id',
    get: function get() {
      return this._id;
    }

    /**
     * @returns {Vec3} the origin, in object space, about which this Skin should rotate.
     */

  }, {
    key: 'rotationCenter',
    get: function get() {
      return this._rotationCenter;
    }

    /**
     * @abstract
     * @return {Array<number>} the "native" size, in texels, of this skin.
     */

  }, {
    key: 'size',
    get: function get() {
      return [0, 0];
    }
  }]);

  return Skin;
}(EventEmitter);

/**
 * These are the events which can be emitted by instances of this class.
 * @enum {string}
 */


Skin.Events = {
  /**
   * Emitted when anything about the Skin has been altered, such as the appearance or rotation center.
   * @event Skin.event:WasAltered
   */
  WasAltered: 'WasAltered'
};

module.exports = Skin;

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var RenderWebGL = __webpack_require__(/*! ./RenderWebGL */ "./src/RenderWebGL.js");

/**
 * Export for NPM & Node.js
 * @type {RenderWebGL}
 */
module.exports = RenderWebGL;

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),

/***/ "hull.js":
/*!**************************!*\
  !*** external "hull.js" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("hull.js");

/***/ }),

/***/ "scratch-svg-renderer":
/*!***************************************!*\
  !*** external "scratch-svg-renderer" ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("scratch-svg-renderer");

/***/ }),

/***/ "twgl.js":
/*!**************************!*\
  !*** external "twgl.js" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("twgl.js");

/***/ })

/******/ });
//# sourceMappingURL=scratch-render.js.map