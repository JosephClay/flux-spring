!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.flux=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }return target;
};

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}

var _loop = require('./loop');

var _loop2 = _interopRequireDefault(_loop);

var _prop = require('./prop');

var _prop2 = _interopRequireDefault(_prop);

var _animation = require('./animation');

var _animation2 = _interopRequireDefault(_animation);

var _transform = require('./transform');

var _transform2 = _interopRequireDefault(_transform);

var plugins = {};

exports['default'] = _extends(function (obj) {
    return _extends((0, _animation2['default'])(obj), plugins);
}, {
    prop: _prop2['default'],
    transform: _transform2['default'],
    update: _loop2['default'].update,
    tick: _loop2['default'].update,
    plugin: function plugin(name, fn) {
        plugins[name] = function () {
            fn.apply(this, arguments);
            return this;
        };
        return this;
    }
});
module.exports = exports['default'];

},{"./animation":2,"./loop":3,"./prop":10,"./transform":12}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }return target;
};

exports['default'] = animation;

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}

var _loop = require('./loop');

var _loop2 = _interopRequireDefault(_loop);

var _transformer = require('./transformer');

var _transformer2 = _interopRequireDefault(_transformer);

var _spring = require('./spring');

var _spring2 = _interopRequireDefault(_spring);

function animation(obj) {
    var api = {};
    var matrix = (0, _transformer2['default'])(obj);
    var playing = false;
    var startTime = 0;
    var delayTime = 0;
    var events = {};
    var spring = (0, _spring2['default'])();

    var _start = function _start() {
        spring.registerCallbacks({
            onUpdate: function onUpdate(perc) {
                matrix.update(perc);
                api.trigger('update', matrix.value(), obj);
            },
            onReverse: function onReverse() {
                matrix.reverse();
            },
            onComplete: function onComplete() {
                api.stop().trigger('complete');
            }
        });

        matrix.start();
        _loop2['default'].add(spring);
    };

    return _extends(api, {
        from: function from(_from) {
            matrix.from(_from);
            return api;
        },

        to: function to(_to) {
            matrix.to(_to);
            return api;
        },

        set: function set(tension, friction, velocity) {
            // It's an object
            if (+tension !== tension) {
                var temp = tension;
                velocity = temp.velocity;
                friction = temp.friction;
                tension = temp.tension;
            }

            spring.set(tension, friction, velocity);
            return api;
        },

        tension: function tension(_tension) {
            spring.tension(+_tension);
            return api;
        },

        friction: function friction(_friction) {
            spring.friction(+_friction);
            return api;
        },

        velocity: function velocity(_velocity) {
            spring.velocity(+_velocity);
            return api;
        },

        on: function on(name, fn) {
            var arr = events[name] || (events[name] = []);
            arr.push(fn);
            return api;
        },

        off: function off(name, fn) {
            var arr = events[name];
            if (!arr || !arr.length) {
                return api;
            }

            var idx = arr.indexOf(fn);
            if (idx !== -1) {
                arr.splice(idx, 1);
            }

            return api;
        },

        trigger: function trigger(name, a, b) {
            var arr = events[name];
            if (!arr || !arr.length) {
                return api;
            }

            for (var idx = 0; idx < arr.length; idx++) {
                arr[idx](a, b);
            }

            return api;
        },

        delay: function delay(amount) {
            delayTime = amount;
            return api;
        },

        repeat: function repeat(_repeat) {
            spring.repeat(_repeat);
            return api;
        },

        yoyo: function yoyo(_yoyo) {
            if (!arguments.length) {
                _yoyo = true;
            }
            matrix.yoyo(!!_yoyo);
            return api;
        },

        start: function start(time) {
            startTime = time || _loop2['default'].now;
            _loop2['default'].await(function (time) {
                if (time < startTime + delayTime) {
                    return true; // should continue to wait
                }
                playing = true;
                api.trigger('start');
                _start(time);
                return false; // should continue to wait
            });

            return api;
        },

        pause: function pause(time) {
            time = time || _loop2['default'].now;
            spring.pause(time);
            return api;
        },

        resume: function resume(time) {
            time = time || _loop2['default'].now;
            spring.resume(time);
            return api;
        },

        stop: function stop() {
            if (!playing) {
                return api;
            }
            playing = false;
            _loop2['default'].remove(spring);
            spring.stop();
            api.trigger('stop');
            return api;
        }
    });
}

module.exports = exports['default'];

},{"./loop":3,"./spring":11,"./transformer":15}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var waiting = [];
var animations = [];

exports["default"] = {
    now: Date.now(),

    await: function await(fn) {
        waiting.push(fn);
    },

    add: function add(fn) {
        animations.push(fn);
    },

    remove: function remove(fn) {
        var idx = animations.indexOf(fn);
        if (idx !== -1) {
            animations.splice(idx, 1);
        }
    },

    update: function update() {
        var time = this.now = Date.now();

        if (waiting.length === 0 && animations.length === 0) {
            return;
        }

        var idx = 0;
        while (idx < waiting.length) {
            if (waiting[idx](time)) {
                idx++;
            } else {
                waiting.splice(idx, 1);
            }
        }

        idx = 0;
        while (idx < animations.length) {
            animations[idx].step(time);
            idx++;
        }
    }
};
module.exports = exports["default"];

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}

var _vector = require('./vector');

var _vector2 = _interopRequireDefault(_vector);

/**
 * A 4 dimensional vector
 * @constructor
 */
function Vector4(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    this.checkValues();
}

Vector4.prototype = {
    constructor: Vector4,

    /**
     * Ensure that values are not undefined
     * @returns null
     */
    checkValues: function checkValues() {
        this.x = this.x || 0;
        this.y = this.y || 0;
        this.z = this.z || 0;
        this.w = this.w || 0;
    },

    /**
     * Get the length of the vector
     * @returns {float}
     */
    length: function length() {
        this.checkValues();
        return _vector2['default'].length(this);
    },

    /**
     * Get a normalised representation of the vector
     * @returns {Vector4}
     */
    normalize: function normalize() {
        return _vector2['default'].normalize(this);
    },

    /**
     * Vector Dot-Product
     * @param {Vector4} v The second vector to apply the product to
     * @returns {float} The Dot-Product of this and v.
     */
    dot: function dot(v) {
        return _vector2['default'].dot(this, v);
    },

    /**
     * Vector Cross-Product
     * @param {Vector4} v The second vector to apply the product to
     * @returns {Vector4} The Cross-Product of this and v.
     */
    cross: function cross(v) {
        return _vector2['default'].cross(this, v);
    },

    /**
     * Helper function required for matrix decomposition
     * A Javascript implementation of pseudo code available from http://www.w3.org/TR/css3-2d-transforms/#matrix-decomposition
     * @param {Vector4} aPoint A 3D point
     * @param {float} ascl
     * @param {float} bscl
     * @returns {Vector4}
     */
    combine: function combine(bPoint, ascl, bscl) {
        return _vector2['default'].combine(this, bPoint, ascl, bscl);
    },

    multiplyByMatrix: function multiplyByMatrix(matrix) {
        return _vector2['default'].multiplyByMatrix(this, matrix);
    }
};

exports['default'] = Vector4;
module.exports = exports['default'];

},{"./vector":9}],5:[function(require,module,exports){
/**
 *  Converts angles in degrees, which are used by the external API, to angles
 *  in radians used in internal calculations.
 *  @param {number} angle - An angle in degrees.
 *  @returns {number} radians
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = deg2rad;

function deg2rad(angle) {
  return angle * Math.PI / 180;
}

module.exports = exports["default"];

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}

var _deg2rad = require('./deg2rad');

var _deg2rad2 = _interopRequireDefault(_deg2rad);

var _matrix = require('./matrix');

var _matrix2 = _interopRequireDefault(_matrix);

var _transp = require('./transp');

var _transp2 = _interopRequireDefault(_transp);

var indexToKey2d = function indexToKey2d(index) {
    return String.fromCharCode(index + 97); // ASCII char 97 == 'a'
};

var indexToKey3d = function indexToKey3d(index) {
    return 'm' + (Math.floor(index / 4) + 1) + (index % 4 + 1);
};

var points2d = ['m11', // a
'm12', // b
'm21', // c
'm22', // d
'm41', // e
'm42' // f
];

var points3d = ['m11', 'm12', 'm13', 'm14', 'm21', 'm22', 'm23', 'm24', 'm31', 'm32', 'm33', 'm34', 'm41', 'm42', 'm43', 'm44'];

var lookupToFixed = function lookupToFixed(p) {
    return this[p].toFixed(6);
};

/**
 *  Given a CSS transform string (like `rotate(3rad)`, or
 *    `matrix(1, 0, 0, 0, 1, 0)`), return an instance compatible with
 *    [`WebKitCSSMatrix`](http://developer.apple.com/library/safari/documentation/AudioVideo/Reference/WebKitCSSMatrixClassReference/WebKitCSSMatrix/WebKitCSSMatrix.html)
 *  @constructor
 *  @param {string} domstr - a string representation of a 2D or 3D transform matrix
 *    in the form given by the CSS transform property, i.e. just like the
 *    output from [[@link#toString]].
 *  @returns {XCSSMatrix} matrix
 */
function XCSSMatrix(str) {
    this.m11 = this.m22 = this.m33 = this.m44 = 1;

    this.m12 = this.m13 = this.m14 = this.m21 = this.m23 = this.m24 = this.m31 = this.m32 = this.m34 = this.m41 = this.m42 = this.m43 = 0;

    this.setMatrixValue(str);
}

XCSSMatrix.prototype = {
    constructor: XCSSMatrix,

    /**
     *  Multiply one matrix by another
     *  @param {XCSSMatrix} otherMatrix - The matrix to multiply this one by.
     */
    multiply: function multiply(otherMatrix) {
        return _matrix2['default'].multiply(this, otherMatrix);
    },

    /**
     *  If the matrix is invertible, returns its inverse, otherwise returns null.
     *  @returns {XCSSMatrix|null}
     */
    inverse: function inverse() {
        return _matrix2['default'].inverse(this);
    },

    /**
     *  Returns the result of rotating the matrix by a given vector.
     *
     *  If only the first argument is provided, the matrix is only rotated about
     *  the z axis.
     *  @param {number} rotX - The rotation around the x axis.
     *  @param {number} rotY - The rotation around the y axis. If undefined, the x component is used.
     *  @param {number} rotZ - The rotation around the z axis. If undefined, the x component is used.
     *  @returns XCSSMatrix
     */
    rotate: function rotate(rx, ry, rz) {
        if (rx === undefined) {
            rx = 0;
        }

        if (ry === undefined && rz === undefined) {
            rz = rx;
            rx = 0;
            ry = 0;
        }

        if (ry === undefined) {
            ry = 0;
        }
        if (rz === undefined) {
            rz = 0;
        }

        rx = (0, _deg2rad2['default'])(rx);
        ry = (0, _deg2rad2['default'])(ry);
        rz = (0, _deg2rad2['default'])(rz);

        var tx = new XCSSMatrix(),
            ty = new XCSSMatrix(),
            tz = new XCSSMatrix(),
            sinA,
            cosA,
            sq;

        rz /= 2;
        sinA = Math.sin(rz);
        cosA = Math.cos(rz);
        sq = sinA * sinA;

        // Matrices are identity outside the assigned values
        tz.m11 = tz.m22 = 1 - 2 * sq;
        tz.m12 = tz.m21 = 2 * sinA * cosA;
        tz.m21 *= -1;

        ry /= 2;
        sinA = Math.sin(ry);
        cosA = Math.cos(ry);
        sq = sinA * sinA;

        ty.m11 = ty.m33 = 1 - 2 * sq;
        ty.m13 = ty.m31 = 2 * sinA * cosA;
        ty.m13 *= -1;

        rx /= 2;
        sinA = Math.sin(rx);
        cosA = Math.cos(rx);
        sq = sinA * sinA;

        tx.m22 = tx.m33 = 1 - 2 * sq;
        tx.m23 = tx.m32 = 2 * sinA * cosA;
        tx.m32 *= -1;

        var identityMatrix = new XCSSMatrix(); // returns identity matrix by default
        var isIdentity = this.toString() === identityMatrix.toString();
        var rotatedMatrix = isIdentity ? tz.multiply(ty).multiply(tx) : this.multiply(tx).multiply(ty).multiply(tz);

        return rotatedMatrix;
    },

    /**
     *  Returns the result of scaling the matrix by a given vector.
     *  @param {number} scaleX - the scaling factor in the x axis.
     *  @param {number} scaleY - the scaling factor in the y axis. If undefined, the x component is used.
     *  @param {number} scaleZ - the scaling factor in the z axis. If undefined, 1 is used.
     *  @returns XCSSMatrix
     */
    scale: function scale(scaleX, scaleY, scaleZ) {
        var transform = new XCSSMatrix();

        if (scaleX === undefined) {
            scaleX = 1;
        }
        if (scaleY === undefined) {
            scaleY = scaleX;
        }
        if (!scaleZ) {
            scaleZ = 1;
        }

        transform.m11 = scaleX;
        transform.m22 = scaleY;
        transform.m33 = scaleZ;

        return this.multiply(transform);
    },

    /**
     *  Returns the result of skewing the matrix by a given vector.
     *  @param {number} skewX - The scaling factor in the x axis.
     *  @returns XCSSMatrix
     */
    skewX: function skewX(degrees) {
        var radians = (0, _deg2rad2['default'])(degrees);
        var transform = new XCSSMatrix();

        transform.c = Math.tan(radians);

        return this.multiply(transform);
    },

    /**
     *  Returns the result of skewing the matrix by a given vector.
     *  @param {number} skewY - the scaling factor in the x axis.
     *  @returns XCSSMatrix
     */
    skewY: function skewY(degrees) {
        var radians = (0, _deg2rad2['default'])(degrees);
        var transform = new XCSSMatrix();

        transform.b = Math.tan(radians);

        return this.multiply(transform);
    },

    /**
     *  Returns the result of translating the matrix by a given vector.
     *  @param {number} x - The x component of the vector.
     *  @param {number} y - The y component of the vector.
     *  @param {number} z - The z component of the vector. If undefined, 0 is used.
     *  @returns XCSSMatrix
     */
    translate: function translate(x, y, z) {
        var t = new XCSSMatrix();

        if (x === undefined) {
            x = 0;
        }
        if (y === undefined) {
            y = 0;
        }
        if (z === undefined) {
            z = 0;
        }

        t.m41 = x;
        t.m42 = y;
        t.m43 = z;

        return this.multiply(t);
    },

    /**
     *  Sets the matrix values using a string representation, such as that produced
     *  by the [[XCSSMatrix#toString]] method.
     *  @params {string} domstr - A string representation of a 2D or 3D transform matrix
     *    in the form given by the CSS transform property, i.e. just like the
     *    output from [[XCSSMatrix#toString]].
     *  @returns undefined
     */
    setMatrixValue: function setMatrixValue(domstr) {
        if (!domstr) {
            return;
        }

        var matrixObject = (0, _transp2['default'])(domstr);
        if (!matrixObject) {
            return;
        }

        var is3d = matrixObject.key === 'matrix3d';
        var keygen = is3d ? indexToKey3d : indexToKey2d;
        var values = matrixObject.value;
        var count = values.length;

        if (is3d && count !== 16 || !(is3d || count === 6)) {
            return;
        }

        values.forEach(function (obj, idx) {
            var key = keygen(idx);
            this[key] = obj.value;
        }, this);
    },

    decompose: function decompose() {
        return _matrix2['default'].decompose(this);
    },

    compose: function compose(_ref) {
        var x = _ref.x;
        var y = _ref.y;
        var z = _ref.z;
        var rotateX = _ref.rotateX;
        var rotateY = _ref.rotateY;
        var rotateZ = _ref.rotateZ;
        var scaleX = _ref.scaleX;
        var scaleY = _ref.scaleY;
        var scaleZ = _ref.scaleZ;
        var skewX = _ref.skewX;
        var skewY = _ref.skewY;

        var m = this;
        m = m.translate(x, y, z);
        m = m.rotate(rotateX, rotateY, rotateZ);
        m = m.scale(scaleX, scaleY, scaleZ);
        if (skewX !== undefined) {
            m = m.skewX(skewX);
        }
        if (skewY !== undefined) {
            m = m.skewY(skewY);
        }

        return m;
    },

    /**
     *  Returns a string representation of the matrix.
     *  @returns {string} matrixString - a string like `matrix(1.000000, 0.000000, 0.000000, 1.000000, 0.000000, 0.000000)`
     *
     **/
    toString: function toString() {
        var points = undefined,
            prefix = undefined;

        if (_matrix2['default'].isAffine(this)) {
            prefix = 'matrix';
            points = points2d;
        } else {
            prefix = 'matrix3d';
            points = points3d;
        }

        return prefix + '(' + points.map(lookupToFixed, this).join(', ') + ')';
    }
};

exports['default'] = XCSSMatrix;
module.exports = exports['default'];

},{"./deg2rad":5,"./matrix":7,"./transp":8}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}

var _Vector4 = require('./Vector4');

var _Vector42 = _interopRequireDefault(_Vector4);

/**
 *  Calculates the determinant of a 2x2 matrix.
 *  @param {number} a - Top-left value of the matrix.
 *  @param {number} b - Top-right value of the matrix.
 *  @param {number} c - Bottom-left value of the matrix.
 *  @param {number} d - Bottom-right value of the matrix.
 *  @returns {number}
 */
var determinant2x2 = function determinant2x2(a, b, c, d) {
    return a * d - b * c;
};

/**
 *  Calculates the determinant of a 3x3 matrix.
 *  @param {number} a1 - Matrix value in position [1, 1].
 *  @param {number} a2 - Matrix value in position [1, 2].
 *  @param {number} a3 - Matrix value in position [1, 3].
 *  @param {number} b1 - Matrix value in position [2, 1].
 *  @param {number} b2 - Matrix value in position [2, 2].
 *  @param {number} b3 - Matrix value in position [2, 3].
 *  @param {number} c1 - Matrix value in position [3, 1].
 *  @param {number} c2 - Matrix value in position [3, 2].
 *  @param {number} c3 - Matrix value in position [3, 3].
 *  @returns {number}
 */
var determinant3x3 = function determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3) {
    return a1 * determinant2x2(b2, b3, c2, c3) - b1 * determinant2x2(a2, a3, c2, c3) + c1 * determinant2x2(a2, a3, b2, b3);
};

/**
 *  Calculates the determinant of a 4x4 matrix.
 *  @param {XCSSMatrix} matrix - The matrix to calculate the determinant of.
 *  @returns {number}
 */
var determinant4x4 = function determinant4x4(matrix) {
    var m = matrix,

    // Assign to individual variable names to aid selecting correct elements
    a1 = m.m11,
        b1 = m.m21,
        c1 = m.m31,
        d1 = m.m41,
        a2 = m.m12,
        b2 = m.m22,
        c2 = m.m32,
        d2 = m.m42,
        a3 = m.m13,
        b3 = m.m23,
        c3 = m.m33,
        d3 = m.m43,
        a4 = m.m14,
        b4 = m.m24,
        c4 = m.m34,
        d4 = m.m44;

    return a1 * determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4) - b1 * determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4) + c1 * determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4) - d1 * determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
};

/**
 *  Determines whether the matrix is affine.
 *  @returns {boolean}
 */
var isAffine = function isAffine(m) {
    return m.m13 === 0 && m.m14 === 0 && m.m23 === 0 && m.m24 === 0 && m.m31 === 0 && m.m32 === 0 && m.m33 === 1 && m.m34 === 0 && m.m43 === 0 && m.m44 === 1;
};

/**
 *  Returns whether the matrix is the identity matrix or a translation matrix.
 *  @return {boolean}
 */
var isIdentityOrTranslation = function isIdentityOrTranslation(m) {
    return m.m11 === 1 && m.m12 === 0 && m.m13 === 0 && m.m14 === 0 && m.m21 === 0 && m.m22 === 1 && m.m23 === 0 && m.m24 === 0 && m.m31 === 0 && m.m31 === 0 && m.m33 === 1 && m.m34 === 0 &&
    // m41, m42 and m43 are the translation points
    m.m44 === 1;
};

/**
 *  Returns the adjoint matrix.
 *  @return {XCSSMatrix}
 */
var adjoint = function adjoint(m) {
    // make `result` the same type as the given metric
    var result = new m.constructor(),
        a1 = m.m11,
        b1 = m.m12,
        c1 = m.m13,
        d1 = m.m14,
        a2 = m.m21,
        b2 = m.m22,
        c2 = m.m23,
        d2 = m.m24,
        a3 = m.m31,
        b3 = m.m32,
        c3 = m.m33,
        d3 = m.m34,
        a4 = m.m41,
        b4 = m.m42,
        c4 = m.m43,
        d4 = m.m44;

    // Row column labeling reversed since we transpose rows & columns
    result.m11 = determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
    result.m21 = -determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
    result.m31 = determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
    result.m41 = -determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);

    result.m12 = -determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
    result.m22 = determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
    result.m32 = -determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
    result.m42 = determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);

    result.m13 = determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
    result.m23 = -determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
    result.m33 = determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
    result.m43 = -determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);

    result.m14 = -determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
    result.m24 = determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
    result.m34 = -determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
    result.m44 = determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);

    return result;
};

var inverse = function inverse(matrix) {
    var inv = undefined;

    if (isIdentityOrTranslation(matrix)) {
        inv = new matrix.constructor();

        if (!(matrix.m41 === 0 && matrix.m42 === 0 && matrix.m43 === 0)) {
            inv.m41 = -matrix.m41;
            inv.m42 = -matrix.m42;
            inv.m43 = -matrix.m43;
        }

        return inv;
    }

    // Calculate the adjoint matrix
    var result = adjoint(matrix);

    // Calculate the 4x4 determinant
    var det = determinant4x4(matrix);

    // If the determinant is zero, then the inverse matrix is not unique
    if (Math.abs(det) < 1e-8) {
        return null;
    }

    // Scale the adjoint matrix to get the inverse
    for (var idx = 1; idx < 5; idx++) {
        for (var i = 1; i < 5; i++) {
            result['m' + idx + i] /= det;
        }
    }

    return result;
};

var multiply = function multiply(matrix, otherMatrix) {
    if (!otherMatrix) {
        return null;
    }

    var a = otherMatrix,
        b = matrix,
        c = new matrix.constructor();

    c.m11 = a.m11 * b.m11 + a.m12 * b.m21 + a.m13 * b.m31 + a.m14 * b.m41;
    c.m12 = a.m11 * b.m12 + a.m12 * b.m22 + a.m13 * b.m32 + a.m14 * b.m42;
    c.m13 = a.m11 * b.m13 + a.m12 * b.m23 + a.m13 * b.m33 + a.m14 * b.m43;
    c.m14 = a.m11 * b.m14 + a.m12 * b.m24 + a.m13 * b.m34 + a.m14 * b.m44;

    c.m21 = a.m21 * b.m11 + a.m22 * b.m21 + a.m23 * b.m31 + a.m24 * b.m41;
    c.m22 = a.m21 * b.m12 + a.m22 * b.m22 + a.m23 * b.m32 + a.m24 * b.m42;
    c.m23 = a.m21 * b.m13 + a.m22 * b.m23 + a.m23 * b.m33 + a.m24 * b.m43;
    c.m24 = a.m21 * b.m14 + a.m22 * b.m24 + a.m23 * b.m34 + a.m24 * b.m44;

    c.m31 = a.m31 * b.m11 + a.m32 * b.m21 + a.m33 * b.m31 + a.m34 * b.m41;
    c.m32 = a.m31 * b.m12 + a.m32 * b.m22 + a.m33 * b.m32 + a.m34 * b.m42;
    c.m33 = a.m31 * b.m13 + a.m32 * b.m23 + a.m33 * b.m33 + a.m34 * b.m43;
    c.m34 = a.m31 * b.m14 + a.m32 * b.m24 + a.m33 * b.m34 + a.m34 * b.m44;

    c.m41 = a.m41 * b.m11 + a.m42 * b.m21 + a.m43 * b.m31 + a.m44 * b.m41;
    c.m42 = a.m41 * b.m12 + a.m42 * b.m22 + a.m43 * b.m32 + a.m44 * b.m42;
    c.m43 = a.m41 * b.m13 + a.m42 * b.m23 + a.m43 * b.m33 + a.m44 * b.m43;
    c.m44 = a.m41 * b.m14 + a.m42 * b.m24 + a.m43 * b.m34 + a.m44 * b.m44;

    return c;
};

function transpose(matrix) {
    var result = new matrix.constructor();
    var rows = 4,
        cols = 4;
    var i = cols,
        j;
    while (i) {
        j = rows;
        while (j) {
            result['m' + i + j] = matrix['m' + j + i];
            j--;
        }
        i--;
    }
    return result;
}

/**
 *  Input:  matrix      ; a 4x4 matrix
 *  Output: translation ; a 3 component vector
 *          scale       ; a 3 component vector
 *          skew        ; skew factors XY,XZ,YZ represented as a 3 component vector
 *          perspective ; a 4 component vector
 *          rotate  ; a 4 component vector
 *  Returns false if the matrix cannot be decomposed, true if it can
 */
function decompose(matrix) {
    var perspectiveMatrix, rightHandSide, inversePerspectiveMatrix, transposedInversePerspectiveMatrix, perspective, translate, row, i, len, scale, skew, pdum3, rotate;

    // Normalize the matrix.
    if (matrix.m33 === 0) {
        return false;
    }

    for (var _i = 1; _i <= 4; _i++) {
        for (var j = 1; j < 4; j++) {
            matrix['m' + _i + j] /= matrix.m44;
        }
    }

    // perspectiveMatrix is used to solve for perspective, but it also provides
    // an easy way to test for singularity of the upper 3x3 component.
    perspectiveMatrix = matrix;
    perspectiveMatrix.m14 = 0;
    perspectiveMatrix.m24 = 0;
    perspectiveMatrix.m34 = 0;
    perspectiveMatrix.m44 = 1;

    if (determinant4x4(perspectiveMatrix) === 0) {
        return false;
    }

    // First, isolate perspective.
    if (matrix.m14 !== 0 || matrix.m24 !== 0 || matrix.m34 !== 0) {
        // rightHandSide is the right hand side of the equation.
        rightHandSide = new _Vector42['default'](matrix.m14, matrix.m24, matrix.m34, matrix.m44);

        // Solve the equation by inverting perspectiveMatrix and multiplying
        // rightHandSide by the inverse.
        inversePerspectiveMatrix = inverse(perspectiveMatrix);
        transposedInversePerspectiveMatrix = transpose(inversePerspectiveMatrix);
        perspective = rightHandSide.multiplyByMatrix(transposedInversePerspectiveMatrix);
    } else {
        // No perspective.
        perspective = new _Vector42['default'](0, 0, 0, 1);
    }

    // Next take care of translation
    translate = new _Vector42['default'](matrix.m41, matrix.m42, matrix.m43);

    // Now get scale and shear. 'row' is a 3 element array of 3 component vectors
    row = [new _Vector42['default'](), new _Vector42['default'](), new _Vector42['default']()];
    for (i = 1, len = row.length; i < len; i++) {
        row[i - 1].x = matrix['m' + i + '1'];
        row[i - 1].y = matrix['m' + i + '2'];
        row[i - 1].z = matrix['m' + i + '3'];
    }

    // Compute X scale factor and normalize first row.
    scale = new _Vector42['default']();
    skew = new _Vector42['default']();

    scale.x = row[0].length();
    row[0] = row[0].normalize();

    // Compute XY shear factor and make 2nd row orthogonal to 1st.
    skew.x = row[0].dot(row[1]);
    row[1] = row[1].combine(row[0], 1.0, -skew.x);

    // Now, compute Y scale and normalize 2nd row.
    scale.y = row[1].length();
    row[1] = row[1].normalize();
    skew.x /= scale.y;

    // Compute XZ and YZ shears, orthogonalize 3rd row
    skew.y = row[0].dot(row[2]);
    row[2] = row[2].combine(row[0], 1.0, -skew.y);
    skew.z = row[1].dot(row[2]);
    row[2] = row[2].combine(row[1], 1.0, -skew.z);

    // Next, get Z scale and normalize 3rd row.
    scale.z = row[2].length();
    row[2] = row[2].normalize();
    skew.y = skew.y / scale.z || 0;
    skew.z = skew.z / scale.z || 0;

    // At this point, the matrix (in rows) is orthonormal.
    // Check for a coordinate system flip.  If the determinant
    // is -1, then negate the matrix and the scaling factors.
    pdum3 = row[1].cross(row[2]);
    if (row[0].dot(pdum3) < 0) {
        for (var _i2 = 0; _i2 < 3; _i2++) {
            scale.x *= -1;
            row[_i2].x *= -1;
            row[_i2].y *= -1;
            row[_i2].z *= -1;
        }
    }

    // Now, get the rotations out
    // FROM W3C
    rotate = new _Vector42['default']();
    rotate.x = 0.5 * Math.sqrt(Math.max(1 + row[0].x - row[1].y - row[2].z, 0));
    rotate.y = 0.5 * Math.sqrt(Math.max(1 - row[0].x + row[1].y - row[2].z, 0));
    rotate.z = 0.5 * Math.sqrt(Math.max(1 - row[0].x - row[1].y + row[2].z, 0));
    rotate.w = 0.5 * Math.sqrt(Math.max(1 + row[0].x + row[1].y + row[2].z, 0));

    // if (row[2].y > row[1].z) rotate[0] = -rotate[0];
    // if (row[0].z > row[2].x) rotate[1] = -rotate[1];
    // if (row[1].x > row[0].y) rotate[2] = -rotate[2];

    // FROM MORF.JS
    rotate.y = Math.asin(-row[0].z);
    if (Math.cos(rotate.y) !== 0) {
        rotate.x = Math.atan2(row[1].z, row[2].z);
        rotate.z = Math.atan2(row[0].y, row[0].x);
    } else {
        rotate.x = Math.atan2(-row[2].x, row[1].y);
        rotate.z = 0;
    }

    // FROM http://blog.bwhiting.co.uk/?p=26
    // scale.x2 = Math.sqrt(matrix.m11*matrix.m11 + matrix.m21*matrix.m21 + matrix.m31*matrix.m31);
    // scale.y2 = Math.sqrt(matrix.m12*matrix.m12 + matrix.m22*matrix.m22 + matrix.m32*matrix.m32);
    // scale.z2 = Math.sqrt(matrix.m13*matrix.m13 + matrix.m23*matrix.m23 + matrix.m33*matrix.m33);

    // rotate.x2 = Math.atan2(matrix.m23/scale.z2, matrix.m33/scale.z2);
    // rotate.y2 = -Math.asin(matrix.m13/scale.z2);
    // rotate.z2 = Math.atan2(matrix.m12/scale.y2, matrix.m11/scale.x2);

    return {
        perspective: perspective,
        translate: translate,
        skew: skew,
        scale: scale,
        rotate: rotate
    };
}

exports['default'] = {
    decompose: decompose,
    isAffine: isAffine,
    inverse: inverse,
    multiply: multiply
};
module.exports = exports['default'];

},{"./Vector4":4}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = statementToObject;
var valueToObject = function valueToObject(value) {
    var units = /([\-\+]?[0-9]+[\.0-9]*)(deg|rad|grad|px|%)*/;
    var parts = value.match(units) || [];

    return {
        value: parseFloat(parts[1]),
        units: parts[2],
        unparsed: value
    };
};

function statementToObject(statement, skipValues) {
    var nameAndArgs = /(\w+)\(([^\)]+)\)/i;
    var statementParts = statement.toString().match(nameAndArgs).slice(1);
    var functionName = statementParts[0];
    var stringValues = statementParts[1].split(/, ?/);
    var parsedValues = !skipValues && stringValues.map(valueToObject);

    return {
        key: functionName,
        value: parsedValues || stringValues,
        unparsed: statement
    };
}

module.exports = exports["default"];

},{}],9:[function(require,module,exports){
/**
 * Get the length of the vector
 * @returns {float}
 */
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
function length(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

/**
 * Get a normalized representation of the vector
 * @returns {Vector4}
 */
function normalize(vector) {
    var len = length(vector),
        v = new vector.constructor(vector.x / len, vector.y / len, vector.z / len);

    return v;
}

/**
 * Vector Dot-Product
 * @param {Vector4} v The second vector to apply the product to
 * @returns {float} The Dot-Product of a and b.
 */
function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

/**
 * Vector Cross-Product
 * @param {Vector4} v The second vector to apply the product to
 * @returns {Vector4} The Cross-Product of a and b.
 */
function cross(a, b) {
    return new a.constructor(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
}

/**
 * Helper function required for matrix decomposition
 * A Javascript implementation of pseudo code available from http://www.w3.org/TR/css3-2d-transforms/#matrix-decomposition
 * @param {Vector4} aPoint A 3D point
 * @param {float} ascl
 * @param {float} bscl
 * @returns {Vector4}
 */
function combine(aPoint, bPoint, ascl, bscl) {
    return new aPoint.constructor(ascl * aPoint.x + bscl * bPoint.x, ascl * aPoint.y + bscl * bPoint.y, ascl * aPoint.z + bscl * bPoint.z);
}

function multiplyByMatrix(vector, matrix) {
    return new vector.constructor(matrix.m11 * vector.x + matrix.m12 * vector.y + matrix.m13 * vector.z, matrix.m21 * vector.x + matrix.m22 * vector.y + matrix.m23 * vector.z, matrix.m31 * vector.x + matrix.m32 * vector.y + matrix.m33 * vector.z);
}

exports["default"] = {
    length: length,
    normalize: normalize,
    dot: dot,
    cross: cross,
    combine: combine,
    multiplyByMatrix: multiplyByMatrix
};
module.exports = exports["default"];

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var div = document.createElement('div');

var selectProp = function selectProp(arr) {
    var idx = arr.length;
    while (idx--) {
        if (div.style[arr[idx]] !== undefined) {
            return arr[idx];
        }
    }
};

exports['default'] = selectProp(['transform', 'msTransform', 'oTransform', 'mozTransform', 'webkitTransform']) || '';
module.exports = exports['default'];

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = spring;
var END_VALUE = 100;
var TOLERANCE = 0.01;
var SPEED = 1 / 60;

var calcAcceleration = function calcAcceleration(tension, x, friction, velocity) {
    return -tension * x - friction * velocity;
};

var calcState = function calcState(state, speed) {
    var dt = speed * 0.5;
    var x = state.x;
    var velocity = state.velocity;
    var tension = state.tension;
    var friction = state.friction;

    var aDx = velocity;
    var aDv = calcAcceleration(tension, x, friction, velocity);

    var bDx = velocity + aDv * dt;
    var bEndX = x + aDx * dt;
    var bDv = calcAcceleration(tension, bEndX, friction, bDx);

    var cDx = velocity + bDv * dt;
    var cEndX = x + bDx * dt;
    var cDv = calcAcceleration(tension, cEndX, friction, cDx);

    var dDx = velocity + cDv * dt;
    var dEndX = x + cDx * dt;
    var dDv = calcAcceleration(tension, dEndX, friction, dDx);

    var dxdt = 1 / 6 * (aDx + 2 * (bDx + cDx) + dDx);
    var dvdt = 1 / 6 * (aDv + 2 * (bDv + cDv) + dDv);

    state.x = x + dxdt * speed;
    state.velocity = aDx + dvdt * speed;

    return state;
};

function spring() {
    var _velocity = 0;
    var _tension = 80;
    var _friction = 8;

    var _repeat = 0;
    var originalVelocity = 0;
    var originalTension = 80;
    var originalFriction = 8;
    var value = 0;
    var isPaused = false;

    // Stores x and velocity to do
    // calculations against so that
    // we can have multiple return
    // values from calcState
    var state = {};

    var updateCallback = undefined;
    var completeCallback = undefined;
    var reverseCallback = undefined;

    return {
        registerCallbacks: function registerCallbacks(obj) {
            updateCallback = obj.onUpdate;
            completeCallback = obj.onComplete;
            reverseCallback = obj.onReverse;
            return this;
        },

        repeat: function repeat(times) {
            _repeat = times;
            return this;
        },

        set: function set(t, f, v) {
            if (v !== undefined) {
                _velocity = originalVelocity = v;
            }
            if (t !== undefined) {
                _tension = originalTension = t;
            }
            if (f !== undefined) {
                _friction = originalFriction = f;
            }
            return this;
        },

        tension: function tension(t) {
            _tension = originalTension = t;
            return this;
        },

        friction: function friction(f) {
            _friction = originalFriction = f;
            return this;
        },

        velocity: function velocity(v) {
            _velocity = originalVelocity = v;
            return this;
        },

        pause: function pause() {
            isPaused = true;
            return this;
        },

        resume: function resume() {
            isPaused = false;
            return this;
        },

        step: function step() {
            if (isPaused) {
                return true;
            } // should set again?

            var stateBefore = state;

            stateBefore.x = value - END_VALUE;
            stateBefore.velocity = _velocity;
            stateBefore.tension = _tension;
            stateBefore.friction = _friction;

            var stateAfter = calcState(stateBefore, SPEED);
            var finalVelocity = stateAfter.velocity;
            var netFloat = stateAfter.x;
            var net1DVelocity = stateAfter.velocity;
            var netValueIsLow = Math.abs(netFloat) < TOLERANCE;
            var netVelocityIsLow = Math.abs(net1DVelocity) < TOLERANCE;
            var shouldSpringStop = netValueIsLow || netVelocityIsLow;

            value = END_VALUE + stateAfter.x;

            if (shouldSpringStop) {

                _velocity = 0;
                value = END_VALUE;

                updateCallback(value / 100);

                // Should we repeat?
                if (_repeat > 0) {

                    // Decrement the repeat counter (if finite,
                    // we may be in an infinite loop)
                    if (isFinite(_repeat)) {
                        _repeat--;
                    }

                    reverseCallback();
                    _velocity = originalVelocity;
                    _tension = originalTension;
                    _friction = originalFriction;
                    value = 0;

                    return true; // should set again?
                }

                // Otherwise, we're done repeating
                completeCallback();

                return false; // should set again?
            }

            _velocity = finalVelocity;
            updateCallback(value / 100);
            return true; // should set again?
        },

        stop: function stop() {
            _velocity = originalVelocity;
            _tension = originalTension;
            _friction = originalFriction;
            value = 0;
        }
    };
}

module.exports = exports["default"];

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}

var _matrix = require('./matrix');

var _matrix2 = _interopRequireDefault(_matrix);

var _prop = require('./prop');

var _prop2 = _interopRequireDefault(_prop);

exports['default'] = function (obj, element) {
    var matrix = new _matrix2['default']().compose(obj);
    element.style[_prop2['default']] = matrix.toString();
};

module.exports = exports['default'];

},{"./matrix":6,"./prop":10}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}

var _matrix = require('../matrix');

var _matrix2 = _interopRequireDefault(_matrix);

var _prop = require('../prop');

var _prop2 = _interopRequireDefault(_prop);

var getComputedStyle = function getComputedStyle(elem) {
    return document.defaultView.getComputedStyle(elem);
};

var decompose = function decompose(matrix) {
    var composition = matrix.decompose();
    var rotate = composition.rotate;
    var scale = composition.scale;
    var skew = composition.skew;
    var translate = composition.translate;

    return {
        x: translate.x,
        y: translate.y,
        z: translate.z,

        scaleX: scale.x,
        scaleY: scale.y,
        scaleZ: scale.z,

        skewX: skew.x,
        skewY: skew.y,

        rotateX: rotate.x,
        rotateY: rotate.y,
        rotateZ: rotate.z
    };
};

exports['default'] = {
    style: function style(elem) {
        var computedStyles = getComputedStyle(elem);
        var transform = computedStyles[_prop2['default']];
        if (!transform || transform === 'none') {
            return decompose(new _matrix2['default']());
        }

        var matrix = new _matrix2['default'](transform);
        return decompose(matrix);
    },

    obj: function obj(_obj) {
        var matrix = new _matrix2['default']();
        var composition = matrix.compose(_obj);
        return decompose(composition);
    }
};
module.exports = exports['default'];

},{"../matrix":6,"../prop":10}],14:[function(require,module,exports){
/*
    var MATRIX = {
        x: 0,
        y: 0,
        z: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0
    };
*/

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var expand = function expand(obj) {
    if (obj.scale !== undefined) {
        obj.scaleX = obj.scale;
        obj.scaleY = obj.scale;
        delete obj.scale;
    }

    if (obj.rotate !== undefined) {
        obj.rotateZ = obj.rotate;
        delete obj.rotate;
    }

    return obj;
};

exports["default"] = function (obj) {
    if (!obj) {
        return obj;
    }
    return expand(obj);
};

module.exports = exports["default"];

},{}],15:[function(require,module,exports){
// TODO: Get rid of deletes

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = matrix;

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { 'default': obj };
}

var _isElement = require('./isElement');

var _isElement2 = _interopRequireDefault(_isElement);

var _baser = require('./baser');

var _baser2 = _interopRequireDefault(_baser);

var _expandShorthand = require('./expandShorthand');

var _expandShorthand2 = _interopRequireDefault(_expandShorthand);

function matrix(initial) {
    var init = initial;

    var base = undefined;
    var _yoyo = undefined;
    var from = undefined;
    var _to = undefined;
    var repeat = undefined;

    return {
        value: function value() {
            return base;
        },

        yoyo: function yoyo(bool) {
            _yoyo = bool;
            return this;
        },

        from: function from(f) {
            init = f;
            return this;
        },

        to: function to(t) {
            _to = (0, _expandShorthand2['default'])(t);
            return this;
        },

        update: function update(perc) {
            for (var property in _to) {
                var start = from[property] || 0;
                var end = _to[property];

                base[property] = start + (end - start) * perc;
            }

            return this;
        },

        reverse: function reverse() {
            var tmp;

            // reassign starting values
            for (var property in repeat) {
                if (_yoyo) {
                    tmp = repeat[property];
                    repeat[property] = _to[property];
                    _to[property] = tmp;
                }

                from[property] = repeat[property];
            }

            return this;
        },

        start: function start() {
            if (!_to) {
                return this;
            }
            if (!base) {
                base = (0, _isElement2['default'])(init) ? _baser2['default'].style(init) : _baser2['default'].obj((0, _expandShorthand2['default'])(init));
            }
            if (!from) {
                from = {};
            }
            if (!repeat) {
                repeat = {};
            }

            for (var property in _to) {
                // omit unchanged properties
                if (base[property] === undefined || _to[property] === base[property]) {
                    delete _to[property];
                    continue;
                }

                from[property] = base[property];
                repeat[property] = from[property] || 0;
            }

            return this;
        }
    };
}

module.exports = exports['default'];

},{"./baser":13,"./expandShorthand":14,"./isElement":16}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports["default"] = function (obj) {
    return !!(obj && +obj.nodeType === obj.nodeType);
};

module.exports = exports["default"];

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovX0Rldi9mbHV4LXR3ZWVuL3NyYy9pbmRleC5qcyIsIkM6L19EZXYvZmx1eC10d2Vlbi9zcmMvYW5pbWF0aW9uLmpzIiwiQzovX0Rldi9mbHV4LXR3ZWVuL3NyYy9sb29wLmpzIiwiQzovX0Rldi9mbHV4LXR3ZWVuL3NyYy9tYXRyaXgvVmVjdG9yNC5qcyIsIkM6L19EZXYvZmx1eC10d2Vlbi9zcmMvbWF0cml4L2RlZzJyYWQuanMiLCJDOi9fRGV2L2ZsdXgtdHdlZW4vc3JjL21hdHJpeC9pbmRleC5qcyIsIkM6L19EZXYvZmx1eC10d2Vlbi9zcmMvbWF0cml4L21hdHJpeC5qcyIsIkM6L19EZXYvZmx1eC10d2Vlbi9zcmMvbWF0cml4L3RyYW5zcC5qcyIsIkM6L19EZXYvZmx1eC10d2Vlbi9zcmMvbWF0cml4L3ZlY3Rvci5qcyIsIkM6L19EZXYvZmx1eC10d2Vlbi9zcmMvcHJvcC5qcyIsIkM6L19EZXYvZmx1eC10d2Vlbi9zcmMvc3ByaW5nLmpzIiwiQzovX0Rldi9mbHV4LXR3ZWVuL3NyYy90cmFuc2Zvcm0uanMiLCJDOi9fRGV2L2ZsdXgtdHdlZW4vc3JjL3RyYW5zZm9ybWVyL2Jhc2VyLmpzIiwiQzovX0Rldi9mbHV4LXR3ZWVuL3NyYy90cmFuc2Zvcm1lci9leHBhbmRTaG9ydGhhbmQuanMiLCJDOi9fRGV2L2ZsdXgtdHdlZW4vc3JjL3RyYW5zZm9ybWVyL2luZGV4LmpzIiwiQzovX0Rldi9mbHV4LXR3ZWVuL3NyYy90cmFuc2Zvcm1lci9pc0VsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxZQUFZLENBQUM7O0FBRWIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFO0FBQ3pDLFNBQUssRUFBRSxJQUFJO0NBQ2QsQ0FBQyxDQUFDOztBQUVILElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLElBQUksVUFBVSxNQUFNLEVBQUU7QUFBRSxTQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUFFLFlBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxBQUFDLEtBQUssSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO0FBQUUsZ0JBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRTtBQUFFLHNCQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQUU7U0FBRTtLQUFFLEFBQUMsT0FBTyxNQUFNLENBQUM7Q0FBRSxDQUFDOztBQUVqUSxTQUFTLHNCQUFzQixDQUFDLEdBQUcsRUFBRTtBQUFFLFdBQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxHQUFHLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDO0NBQUU7O0FBRWpHLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FWRixRQUFRLENBQUEsQ0FBQTs7QUFZekIsSUFBSSxNQUFNLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRTNDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FiRixRQUFRLENBQUEsQ0FBQTs7QUFlekIsSUFBSSxNQUFNLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRTNDLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FoQkYsYUFBYSxDQUFBLENBQUE7O0FBa0JuQyxJQUFJLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFckQsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQW5CRixhQUFhLENBQUEsQ0FBQTs7QUFxQm5DLElBQUksV0FBVyxHQUFHLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQXBCckQsSUFBTSxPQUFPLEdBQUssRUFBRSxDQUFDOztBQXdCckIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQXRCSCxRQUFBLENBQWMsVUFBUyxHQUFHLEVBQUU7QUFDdkMsV0FBTyxRQUFBLENBQWMsQ0FBQSxDQUFBLEVBQUEsV0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLENBQVUsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7Q0FDakQsRUFBRTtBQUNDLFFBQUksRUFBQSxNQUFBLENBQUEsU0FBQSxDQUFBO0FBQ0osYUFBUyxFQUFBLFdBQUEsQ0FBQSxTQUFBLENBQUE7QUFDVCxVQUFNLEVBQUUsTUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFLLE1BQU07QUFDdEIsUUFBSSxFQUFJLE1BQUEsQ0FBQSxTQUFBLENBQUEsQ0FBSyxNQUFNO0FBQ2hCLFVBQU0sRUFBQSxTQUFBLE1BQUEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0FBQ2IsZUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVc7QUFDdkIsY0FBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDMUIsbUJBQU8sSUFBSSxDQUFDO1NBQ2YsQ0FBQztBQUNGLGVBQU8sSUFBSSxDQUFDO0tBQ2Y7Q0FDSixDQUFDLENBQUE7QUF1QkYsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7OztBQzNDcEMsWUFBWSxDQUFDOztBQUViLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRTtBQUN6QyxTQUFLLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQzs7QUFFSCxJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLFVBQVUsTUFBTSxFQUFFO0FBQUUsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFBRSxZQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQUFBQyxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtBQUFFLGdCQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFBRSxzQkFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUFFO1NBQUU7S0FBRSxBQUFDLE9BQU8sTUFBTSxDQUFDO0NBQUUsQ0FBQzs7QUFFalEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUpNLFNBQVMsQ0FBQTs7QUFNakMsU0FBUyxzQkFBc0IsQ0FBQyxHQUFHLEVBQUU7QUFBRSxXQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsR0FBRyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsQ0FBQztDQUFFOztBQUVqRyxJQUFJLEtBQUssR0FBRyxPQUFPLENBWkYsUUFBUSxDQUFBLENBQUE7O0FBY3pCLElBQUksTUFBTSxHQUFHLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUUzQyxJQUFJLFlBQVksR0FBRyxPQUFPLENBZkYsZUFBZSxDQUFBLENBQUE7O0FBaUJ2QyxJQUFJLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQzs7QUFFekQsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQWxCUCxVQUFVLENBQUEsQ0FBQTs7QUFvQnhCLElBQUksUUFBUSxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQWxCaEMsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFO0FBQ25DLFFBQU0sR0FBRyxHQUFPLEVBQUUsQ0FBQztBQUNuQixRQUFNLE1BQU0sR0FBSSxDQUFBLENBQUEsRUFBQSxhQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsQ0FBWSxHQUFHLENBQUMsQ0FBQztBQUNqQyxRQUFJLE9BQU8sR0FBSyxLQUFLLENBQUM7QUFDdEIsUUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2xCLFFBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNsQixRQUFJLE1BQU0sR0FBTSxFQUFFLENBQUM7QUFDbkIsUUFBSSxNQUFNLEdBQU0sQ0FBQSxDQUFBLEVBQUEsUUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLEVBQUcsQ0FBQzs7QUFFcEIsUUFBTSxNQUFLLEdBQUcsU0FBUixNQUFLLEdBQWM7QUFDckIsY0FBTSxDQUFDLGlCQUFpQixDQUFDO0FBQ3JCLG9CQUFRLEVBQUUsU0FBQSxRQUFBLENBQUMsSUFBSSxFQUFLO0FBQ2hCLHNCQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BCLG1CQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDOUM7QUFDRCxxQkFBUyxFQUFFLFNBQUEsU0FBQSxHQUFNO0FBQ2Isc0JBQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUNwQjtBQUNELHNCQUFVLEVBQUUsU0FBQSxVQUFBLEdBQU07QUFDZCxtQkFBRyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNsQztTQUNKLENBQUMsQ0FBQzs7QUFFSCxjQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDZixjQUFBLENBQUEsU0FBQSxDQUFBLENBQUssR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3BCLENBQUM7O0FBRUYsV0FBTyxRQUFBLENBQWMsR0FBRyxFQUFFO0FBQ3RCLFlBQUksRUFBQSxTQUFBLElBQUEsQ0FBQyxLQUFJLEVBQUU7QUFDUCxrQkFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsQ0FBQztBQUNsQixtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxVQUFFLEVBQUEsU0FBQSxFQUFBLENBQUMsR0FBRSxFQUFFO0FBQ0gsa0JBQU0sQ0FBQyxFQUFFLENBQUMsR0FBRSxDQUFDLENBQUM7QUFDZCxtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxXQUFHLEVBQUEsU0FBQSxHQUFBLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUU7O0FBRTdCLGdCQUFJLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRTtBQUN0QixvQkFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDO0FBQ25CLHdCQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUN6Qix3QkFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDekIsdUJBQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO2FBQzFCOztBQUVELGtCQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDeEMsbUJBQU8sR0FBRyxDQUFDO1NBQ2Q7O0FBRUQsZUFBTyxFQUFBLFNBQUEsT0FBQSxDQUFDLFFBQU8sRUFBRTtBQUNiLGtCQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBTyxDQUFDLENBQUM7QUFDekIsbUJBQU8sR0FBRyxDQUFDO1NBQ2Q7O0FBRUQsZ0JBQVEsRUFBQSxTQUFBLFFBQUEsQ0FBQyxTQUFRLEVBQUU7QUFDZixrQkFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVEsQ0FBQyxDQUFDO0FBQzNCLG1CQUFPLEdBQUcsQ0FBQztTQUNkOztBQUVELGdCQUFRLEVBQUEsU0FBQSxRQUFBLENBQUMsU0FBUSxFQUFFO0FBQ2Ysa0JBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFRLENBQUMsQ0FBQztBQUMzQixtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxVQUFFLEVBQUEsU0FBQSxFQUFBLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUNULGdCQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQSxDQUFFO0FBQ2hELGVBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDYixtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxXQUFHLEVBQUEsU0FBQSxHQUFBLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUNWLGdCQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsZ0JBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFO0FBQUUsdUJBQU8sR0FBRyxDQUFDO2FBQUU7O0FBRXhDLGdCQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFCLGdCQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNaLG1CQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUN0Qjs7QUFFRCxtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxlQUFPLEVBQUEsU0FBQSxPQUFBLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDaEIsZ0JBQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixnQkFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFBRSx1QkFBTyxHQUFHLENBQUM7YUFBRTs7QUFFeEMsaUJBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFO0FBQ3ZDLG1CQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ2xCOztBQUVELG1CQUFPLEdBQUcsQ0FBQztTQUNkOztBQUVELGFBQUssRUFBQSxTQUFBLEtBQUEsQ0FBQyxNQUFNLEVBQUU7QUFDVixxQkFBUyxHQUFHLE1BQU0sQ0FBQztBQUNuQixtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxjQUFNLEVBQUEsU0FBQSxNQUFBLENBQUMsT0FBTSxFQUFFO0FBQ1gsa0JBQU0sQ0FBQyxNQUFNLENBQUMsT0FBTSxDQUFDLENBQUM7QUFDdEIsbUJBQU8sR0FBRyxDQUFDO1NBQ2Q7O0FBRUQsWUFBSSxFQUFBLFNBQUEsSUFBQSxDQUFDLEtBQUksRUFBRTtBQUNQLGdCQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTtBQUFFLHFCQUFJLEdBQUcsSUFBSSxDQUFDO2FBQUU7QUFDdkMsa0JBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDO0FBQ3BCLG1CQUFPLEdBQUcsQ0FBQztTQUNkOztBQUVELGFBQUssRUFBQSxTQUFBLEtBQUEsQ0FBQyxJQUFJLEVBQUU7QUFDUixxQkFBUyxHQUFHLElBQUksSUFBSSxNQUFBLENBQUEsU0FBQSxDQUFBLENBQUssR0FBRyxDQUFDO0FBQzdCLGtCQUFBLENBQUEsU0FBQSxDQUFBLENBQUssS0FBSyxDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ2Ysb0JBQUksSUFBSSxHQUFJLFNBQVMsR0FBRyxTQUFTLEVBQUc7QUFDaEMsMkJBQU8sSUFBSSxDQUFDO2lCQUNmO0FBQ0QsdUJBQU8sR0FBRyxJQUFJLENBQUM7QUFDZixtQkFBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNyQixzQkFBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ1osdUJBQU8sS0FBSyxDQUFDO2FBQ2hCLENBQUMsQ0FBQzs7QUFFSCxtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxhQUFLLEVBQUEsU0FBQSxLQUFBLENBQUMsSUFBSSxFQUFFO0FBQ1IsZ0JBQUksR0FBRyxJQUFJLElBQUksTUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFLLEdBQUcsQ0FBQztBQUN4QixrQkFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQixtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxjQUFNLEVBQUEsU0FBQSxNQUFBLENBQUMsSUFBSSxFQUFFO0FBQ1QsZ0JBQUksR0FBRyxJQUFJLElBQUksTUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFLLEdBQUcsQ0FBQztBQUN4QixrQkFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQixtQkFBTyxHQUFHLENBQUM7U0FDZDs7QUFFRCxZQUFJLEVBQUEsU0FBQSxJQUFBLEdBQUc7QUFDSCxnQkFBSSxDQUFDLE9BQU8sRUFBRTtBQUFFLHVCQUFPLEdBQUcsQ0FBQzthQUFFO0FBQzdCLG1CQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ2hCLGtCQUFBLENBQUEsU0FBQSxDQUFBLENBQUssTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BCLGtCQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDZCxlQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BCLG1CQUFPLEdBQUcsQ0FBQztTQUNkO0tBQ0osQ0FBQyxDQUFDO0NBQ047O0FBOEJELE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7QUNyTHBDLFlBQVksQ0FBQzs7QUFFYixNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUU7QUFDekMsU0FBSyxFQUFFLElBQUk7Q0FDZCxDQUFDLENBQUM7QUFKSCxJQUFNLE9BQU8sR0FBTSxFQUFFLENBQUM7QUFDdEIsSUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDOztBQU90QixPQUFPLENBQUMsU0FBUyxDQUFDLEdBTEg7QUFDWCxPQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTs7QUFFZixTQUFLLEVBQUEsU0FBQSxLQUFBLENBQUMsRUFBRSxFQUFFO0FBQ04sZUFBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNwQjs7QUFFRCxPQUFHLEVBQUEsU0FBQSxHQUFBLENBQUMsRUFBRSxFQUFFO0FBQ0osa0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDdkI7O0FBRUQsVUFBTSxFQUFBLFNBQUEsTUFBQSxDQUFDLEVBQUUsRUFBRTtBQUNQLFlBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDakMsWUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDWixzQkFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0I7S0FDSjs7QUFFRCxVQUFNLEVBQUEsU0FBQSxNQUFBLEdBQUc7QUFDTCxZQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFbkMsWUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUNqRCxtQkFBTztTQUNWOztBQUVELFlBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNaLGVBQU8sR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDekIsZ0JBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3BCLG1CQUFHLEVBQUUsQ0FBQzthQUNULE1BQU07QUFDSCx1QkFBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDMUI7U0FDSjs7QUFFRCxXQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ1IsZUFBTyxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRTtBQUM1QixzQkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQixlQUFHLEVBQUUsQ0FBQztTQUNUO0tBQ0o7Q0FDSixDQUFBO0FBTUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7OztBQ2pEcEMsWUFBWSxDQUFDOztBQUViLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRTtBQUN6QyxTQUFLLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQzs7QUFFSCxTQUFTLHNCQUFzQixDQUFDLEdBQUcsRUFBRTtBQUFFLFdBQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxHQUFHLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDO0NBQUU7O0FBRWpHLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FSRixVQUFVLENBQUEsQ0FBQTs7QUFVN0IsSUFBSSxRQUFRLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7Ozs7OztBQUovQyxTQUFTLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDekIsUUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDWCxRQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNYLFFBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsUUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDWCxRQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Q0FDdEI7O0FBRUQsT0FBTyxDQUFDLFNBQVMsR0FBRztBQUNoQixlQUFXLEVBQUUsT0FBTzs7Ozs7O0FBTXBCLGVBQVcsRUFBQSxTQUFBLFdBQUEsR0FBRztBQUNWLFlBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckIsWUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyQixZQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDeEI7Ozs7OztBQU1ELFVBQU0sRUFBQSxTQUFBLE1BQUEsR0FBRztBQUNMLFlBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNuQixlQUFPLFFBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDOUI7Ozs7OztBQU1ELGFBQVMsRUFBQSxTQUFBLFNBQUEsR0FBRztBQUNSLGVBQU8sUUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNqQzs7Ozs7OztBQU9ELE9BQUcsRUFBQSxTQUFBLEdBQUEsQ0FBQyxDQUFDLEVBQUU7QUFDSCxlQUFPLFFBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzlCOzs7Ozs7O0FBT0QsU0FBSyxFQUFBLFNBQUEsS0FBQSxDQUFDLENBQUMsRUFBRTtBQUNMLGVBQU8sUUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDaEM7Ozs7Ozs7Ozs7QUFVRCxXQUFPLEVBQUEsU0FBQSxPQUFBLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDeEIsZUFBTyxRQUFBLENBQUEsU0FBQSxDQUFBLENBQU8sT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ25EOztBQUVELG9CQUFnQixFQUFDLFNBQUEsZ0JBQUEsQ0FBQyxNQUFNLEVBQUU7QUFDdEIsZUFBTyxRQUFBLENBQUEsU0FBQSxDQUFBLENBQU8sZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ2hEO0NBQ0osQ0FBQzs7QUFZRixPQUFPLENBQUMsU0FBUyxDQUFDLEdBVkgsT0FBTyxDQUFBO0FBV3RCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7Ozs7Ozs7QUNyRnBDLFlBQVksQ0FBQzs7QUFFYixNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUU7QUFDM0MsT0FBSyxFQUFFLElBQUk7Q0FDWixDQUFDLENBQUM7QUFDSCxPQUFPLENBQUMsU0FBUyxDQUFDLEdBTE0sT0FBTyxDQUFBOztBQUFoQixTQUFTLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDbkMsU0FBTyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7Q0FDaEM7O0FBU0QsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7OztBQ2pCcEMsWUFBWSxDQUFDOztBQUViLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRTtBQUN6QyxTQUFLLEVBQUUsSUFBSTtDQUNkLENBQUMsQ0FBQzs7QUFFSCxTQUFTLHNCQUFzQixDQUFDLEdBQUcsRUFBRTtBQUFFLFdBQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxHQUFHLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDO0NBQUU7O0FBRWpHLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FSRixXQUFXLENBQUEsQ0FBQTs7QUFVL0IsSUFBSSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRWpELElBQUksT0FBTyxHQUFHLE9BQU8sQ0FYRixVQUFVLENBQUEsQ0FBQTs7QUFhN0IsSUFBSSxRQUFRLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRS9DLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FkRixVQUFVLENBQUEsQ0FBQTs7QUFnQjdCLElBQUksUUFBUSxHQUFHLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQWQvQyxJQUFNLFlBQVksR0FBRyxTQUFmLFlBQVksQ0FBWSxLQUFLLEVBQUU7QUFDakMsV0FBTyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQztDQUMxQyxDQUFDOztBQUVGLElBQU0sWUFBWSxHQUFHLFNBQWYsWUFBWSxDQUFZLEtBQUssRUFBRTtBQUNqQyxXQUFPLEdBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUEsSUFBTSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQSxDQUFFO0NBQ2hFLENBQUM7O0FBRUYsSUFBTSxRQUFRLEdBQUcsQ0FDYixLQUFLO0FBQ0wsS0FBSztBQUNMLEtBQUs7QUFDTCxLQUFLO0FBQ0wsS0FBSztBQUNMLEtBQUs7Q0FDUixDQUFDOztBQUVGLElBQU0sUUFBUSxHQUFHLENBQ2IsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUMxQixLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQzFCLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFDMUIsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUM3QixDQUFDOztBQUVGLElBQU0sYUFBYSxHQUFHLFNBQWhCLGFBQWEsQ0FBWSxDQUFDLEVBQUU7QUFDOUIsV0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzdCLENBQUM7Ozs7Ozs7Ozs7OztBQVlGLFNBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRTtBQUNyQixRQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQzs7QUFFbkMsUUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQ3pDLElBQUksQ0FBQyxHQUFHLEdBQWMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUN6QyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQWMsSUFBSSxDQUFDLEdBQUcsR0FDekMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQWMsQ0FBQyxDQUFDOztBQUU5QyxRQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzVCOztBQUVELFVBQVUsQ0FBQyxTQUFTLEdBQUc7QUFDbkIsZUFBVyxFQUFFLFVBQVU7Ozs7OztBQU12QixZQUFRLEVBQUEsU0FBQSxRQUFBLENBQUMsV0FBVyxFQUFFO0FBQ2xCLGVBQU8sUUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDN0M7Ozs7OztBQU1ELFdBQU8sRUFBQSxTQUFBLE9BQUEsR0FBRztBQUNOLGVBQU8sUUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMvQjs7Ozs7Ozs7Ozs7O0FBWUQsVUFBTSxFQUFBLFNBQUEsTUFBQSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBQ2YsWUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFO0FBQUUsY0FBRSxHQUFHLENBQUMsQ0FBQztTQUFFOztBQUVqQyxZQUFJLEVBQUUsS0FBSyxTQUFTLElBQ2hCLEVBQUUsS0FBSyxTQUFTLEVBQUU7QUFDbEIsY0FBRSxHQUFHLEVBQUUsQ0FBQztBQUNSLGNBQUUsR0FBRyxDQUFDLENBQUM7QUFDUCxjQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ1Y7O0FBRUQsWUFBSSxFQUFFLEtBQUssU0FBUyxFQUFFO0FBQUUsY0FBRSxHQUFHLENBQUMsQ0FBQztTQUFFO0FBQ2pDLFlBQUksRUFBRSxLQUFLLFNBQVMsRUFBRTtBQUFFLGNBQUUsR0FBRyxDQUFDLENBQUM7U0FBRTs7QUFFakMsVUFBRSxHQUFHLENBQUEsQ0FBQSxFQUFBLFNBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxDQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ2pCLFVBQUUsR0FBRyxDQUFBLENBQUEsRUFBQSxTQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsQ0FBUSxFQUFFLENBQUMsQ0FBQztBQUNqQixVQUFFLEdBQUcsQ0FBQSxDQUFBLEVBQUEsU0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLENBQVEsRUFBRSxDQUFDLENBQUM7O0FBRWpCLFlBQUksRUFBRSxHQUFHLElBQUksVUFBVSxFQUFFO1lBQ3JCLEVBQUUsR0FBRyxJQUFJLFVBQVUsRUFBRTtZQUNyQixFQUFFLEdBQUcsSUFBSSxVQUFVLEVBQUU7WUFDckIsSUFBSTtZQUFFLElBQUk7WUFBRSxFQUFFLENBQUM7O0FBRW5CLFVBQUUsSUFBSSxDQUFDLENBQUM7QUFDUixZQUFJLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyQixZQUFJLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyQixVQUFFLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQzs7O0FBR2pCLFVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUM3QixVQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7QUFDbEMsVUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFFYixVQUFFLElBQUksQ0FBQyxDQUFDO0FBQ1IsWUFBSSxHQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckIsWUFBSSxHQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckIsVUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUM3QixVQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7QUFDbEMsVUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFFYixVQUFFLElBQUksQ0FBQyxDQUFDO0FBQ1IsWUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDcEIsWUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDcEIsVUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWpCLFVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUM3QixVQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFH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RyxDQUFDLENBQUMsR0FBRztRQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRztRQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRztRQUM5QyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUc7UUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUc7UUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUc7UUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQzs7O0FBR25ELFVBQU0sQ0FBQyxHQUFHLEdBQUksY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDakUsVUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ2pFLFVBQU0sQ0FBQyxHQUFHLEdBQUksY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDakUsVUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDOztBQUVqRSxVQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDakUsVUFBTSxDQUFDLEdBQUcsR0FBSSxjQUFjLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNqRSxVQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDakUsVUFBTSxDQUFDLEdBQUcsR0FBSSxjQUFjLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzs7QUFFakUsVUFBTSxDQUFDLEdBQUcsR0FBSSxjQUFjLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNqRSxVQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDakUsVUFBTSxDQUFDLEdBQUcsR0FBSSxjQUFjLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNqRSxVQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxD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QUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdEUsS0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdEUsS0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdEUsS0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7O0FBRXRFLEtBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ3RFLEtBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ3RFLEtBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQ3RFLEtBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDOztBQUV0RSxLQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUN0RSxLQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUN0RSxLQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUN0RSxLQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQzs7QUFFdEUsS0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdEUsS0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdEUsS0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDdEUsS0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFH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QUMsQ0FBQyxDQUFDO0tBQ3pDOzs7QUFHRCxhQUFTLEdBQUcsSUFBQSxTQUFBLENBQUEsU0FBQSxDQUFBLENBQVksTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O0FBRzVELE9BQUcsR0FBRyxDQUFFLElBQUEsU0FBQSxDQUFBLFNBQUEsQ0FBQSxFQUFhLEVBQUUsSUFBQSxTQUFBLENBQUEsU0FBQSxDQUFBLEVBQWEsRUFBRSxJQUFBLFNBQUEsQ0FBQSxTQUFBLENBQUEsRUFBYSxDQUFFLENBQUM7QUFDdEQsU0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDeEMsV0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDckMsV0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDckMsV0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7S0FDeEM7OztBQUdELFNBQUssR0FBRyxJQUFBLFNBQUEsQ0FBQSxTQUFBLENBQUEsRUFBYSxDQUFDO0FBQ3RCLFFBQUksR0FBRyxJQUFBLFNBQUEsQ0FBQSxTQUFBLENBQUEsRUFBYSxDQUFDOztBQUVyQixTQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUMxQixPQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDOzs7QUFHNUIsUUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCLE9BQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7OztBQUc5QyxTQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUMxQixPQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzVCLFFBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQzs7O0FBR2xCLFFBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixPQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlDLFFBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixPQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7QUFHOUMsU0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDMUIsT0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUM1QixRQUFJLENBQUMsQ0FBQyxHQUFHLElBQUssQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsSUFBSyxDQUFDLENBQUM7QUFDakMsUUFBSSxDQUFDLENBQUMsR0FBRyxJQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLElBQUssQ0FBQyxDQUFDOzs7OztBQUtqQyxTQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixRQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ3ZCLGFBQUssSUFBSSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsR0FBRyxDQUFDLEVBQUUsR0FBQyxFQUFFLEVBQUU7QUFDeEIsaUJBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDZCxlQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2YsZUFBRyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNmLGVBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDbEI7S0FDSjs7OztBQUlELFVBQU0sR0FBRyxJQUFBLFNBQUEsQ0FBQSxTQUFBLENBQUEsRUFBYSxDQUFDO0FBQ3ZCLFVBQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RSxVQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUUsVUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVFLFVBQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7OztBQU81RSxVQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsUUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDMUIsY0FBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FB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QUMsS0FBSyxTQUFTLElBQUksR0FBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNqRSwyQkFBTyxHQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDcEIsNkJBQVM7aUJBQ1o7O0FBRUQsb0JBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDaEMsc0JBQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzFDOztBQUVELG1CQUFPLElBQUksQ0FBQztTQUNmO0tBQ0osQ0FBQztDQUNMOztBQTJCRCxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs7O0FDOUdwQyxZQUFZLENBQUM7O0FBRWIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFO0FBQ3pDLFNBQUssRUFBRSxJQUFJO0NBQ2QsQ0FBQyxDQUFDOztBQUVILE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FOSCxVQUFTLEdBQUcsRUFBRTtBQUN6QixXQUFPLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxRQUFRLENBQUEsQ0FBRTtDQUNwRCxDQUFBOztBQVFELE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBsb29wIGZyb20gJy4vbG9vcCc7XHJcbmltcG9ydCBwcm9wIGZyb20gJy4vcHJvcCc7XHJcbmltcG9ydCBhbmltYXRpb24gZnJvbSAnLi9hbmltYXRpb24nO1xyXG5pbXBvcnQgdHJhbnNmb3JtIGZyb20gJy4vdHJhbnNmb3JtJztcclxuY29uc3QgcGx1Z2lucyAgID0ge307XHJcblxyXG5leHBvcnQgZGVmYXVsdCBPYmplY3QuYXNzaWduKGZ1bmN0aW9uKG9iaikge1xyXG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oYW5pbWF0aW9uKG9iaiksIHBsdWdpbnMpO1xyXG59LCB7XHJcbiAgICBwcm9wLFxyXG4gICAgdHJhbnNmb3JtLFxyXG4gICAgdXBkYXRlOiBsb29wLnVwZGF0ZSxcclxuXHR0aWNrOiAgIGxvb3AudXBkYXRlLFxyXG4gICAgcGx1Z2luKG5hbWUsIGZuKSB7XHJcbiAgICAgICAgcGx1Z2luc1tuYW1lXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG59KTsiLCJpbXBvcnQgbG9vcCBmcm9tICcuL2xvb3AnO1xyXG5pbXBvcnQgdHJhbnNmb3JtZXIgZnJvbSAnLi90cmFuc2Zvcm1lcic7XHJcbmltcG9ydCBzIGZyb20gJy4vc3ByaW5nJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGFuaW1hdGlvbihvYmopIHtcclxuICAgIGNvbnN0IGFwaSAgICAgPSB7fTtcclxuICAgIGNvbnN0IG1hdHJpeCAgPSB0cmFuc2Zvcm1lcihvYmopO1xyXG4gICAgbGV0IHBsYXlpbmcgICA9IGZhbHNlO1xyXG4gICAgbGV0IHN0YXJ0VGltZSA9IDA7XHJcbiAgICBsZXQgZGVsYXlUaW1lID0gMDtcclxuICAgIGxldCBldmVudHMgICAgPSB7fTtcclxuICAgIGxldCBzcHJpbmcgICAgPSBzKCk7XHJcblxyXG4gICAgY29uc3Qgc3RhcnQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBzcHJpbmcucmVnaXN0ZXJDYWxsYmFja3Moe1xyXG4gICAgICAgICAgICBvblVwZGF0ZTogKHBlcmMpID0+IHtcclxuICAgICAgICAgICAgICAgIG1hdHJpeC51cGRhdGUocGVyYyk7XHJcbiAgICAgICAgICAgICAgICBhcGkudHJpZ2dlcigndXBkYXRlJywgbWF0cml4LnZhbHVlKCksIG9iaik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uUmV2ZXJzZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbWF0cml4LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXBpLnN0b3AoKS50cmlnZ2VyKCdjb21wbGV0ZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG1hdHJpeC5zdGFydCgpO1xyXG4gICAgICAgIGxvb3AuYWRkKHNwcmluZyk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKGFwaSwge1xyXG4gICAgICAgIGZyb20oZnJvbSkge1xyXG4gICAgICAgICAgICBtYXRyaXguZnJvbShmcm9tKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFwaTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0byh0bykge1xyXG4gICAgICAgICAgICBtYXRyaXgudG8odG8pO1xyXG4gICAgICAgICAgICByZXR1cm4gYXBpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldCh0ZW5zaW9uLCBmcmljdGlvbiwgdmVsb2NpdHkpIHtcclxuICAgICAgICAgICAgLy8gSXQncyBhbiBvYmplY3RcclxuICAgICAgICAgICAgaWYgKCt0ZW5zaW9uICE9PSB0ZW5zaW9uKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVtcCA9IHRlbnNpb247XHJcbiAgICAgICAgICAgICAgICB2ZWxvY2l0eSA9IHRlbXAudmVsb2NpdHk7XHJcbiAgICAgICAgICAgICAgICBmcmljdGlvbiA9IHRlbXAuZnJpY3Rpb247XHJcbiAgICAgICAgICAgICAgICB0ZW5zaW9uID0gdGVtcC50ZW5zaW9uO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzcHJpbmcuc2V0KHRlbnNpb24sIGZyaWN0aW9uLCB2ZWxvY2l0eSk7XHJcbiAgICAgICAgICAgIHJldHVybiBhcGk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdGVuc2lvbih0ZW5zaW9uKSB7XHJcbiAgICAgICAgICAgIHNwcmluZy50ZW5zaW9uKCt0ZW5zaW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFwaTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBmcmljdGlvbihmcmljdGlvbikge1xyXG4gICAgICAgICAgICBzcHJpbmcuZnJpY3Rpb24oK2ZyaWN0aW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFwaTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB2ZWxvY2l0eSh2ZWxvY2l0eSkge1xyXG4gICAgICAgICAgICBzcHJpbmcudmVsb2NpdHkoK3ZlbG9jaXR5KTtcclxuICAgICAgICAgICAgcmV0dXJuIGFwaTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvbihuYW1lLCBmbikge1xyXG4gICAgICAgICAgICBjb25zdCBhcnIgPSBldmVudHNbbmFtZV0gfHwgKGV2ZW50c1tuYW1lXSA9IFtdKTtcclxuICAgICAgICAgICAgYXJyLnB1c2goZm4pO1xyXG4gICAgICAgICAgICByZXR1cm4gYXBpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9mZihuYW1lLCBmbikge1xyXG4gICAgICAgICAgICBjb25zdCBhcnIgPSBldmVudHNbbmFtZV07XHJcbiAgICAgICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiBhcGk7IH1cclxuXHJcbiAgICAgICAgICAgIGxldCBpZHggPSBhcnIuaW5kZXhPZihmbik7XHJcbiAgICAgICAgICAgIGlmIChpZHggIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBhcnIuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhcGk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHJpZ2dlcihuYW1lLCBhLCBiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IGV2ZW50c1tuYW1lXTtcclxuICAgICAgICAgICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIGFwaTsgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgYXJyLmxlbmd0aDsgaWR4KyspIHtcclxuICAgICAgICAgICAgICAgIGFycltpZHhdKGEsIGIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYXBpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGRlbGF5KGFtb3VudCkge1xyXG4gICAgICAgICAgICBkZWxheVRpbWUgPSBhbW91bnQ7XHJcbiAgICAgICAgICAgIHJldHVybiBhcGk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVwZWF0KHJlcGVhdCkge1xyXG4gICAgICAgICAgICBzcHJpbmcucmVwZWF0KHJlcGVhdCk7XHJcbiAgICAgICAgICAgIHJldHVybiBhcGk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgeW95byh5b3lvKSB7XHJcbiAgICAgICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyB5b3lvID0gdHJ1ZTsgfVxyXG4gICAgICAgICAgICBtYXRyaXgueW95byghIXlveW8pO1xyXG4gICAgICAgICAgICByZXR1cm4gYXBpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0YXJ0KHRpbWUpIHtcclxuICAgICAgICAgICAgc3RhcnRUaW1lID0gdGltZSB8fCBsb29wLm5vdztcclxuICAgICAgICAgICAgbG9vcC5hd2FpdCh0aW1lID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lIDwgKHN0YXJ0VGltZSArIGRlbGF5VGltZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gc2hvdWxkIGNvbnRpbnVlIHRvIHdhaXRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHBsYXlpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYXBpLnRyaWdnZXIoJ3N0YXJ0Jyk7XHJcbiAgICAgICAgICAgICAgICBzdGFydCh0aW1lKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gc2hvdWxkIGNvbnRpbnVlIHRvIHdhaXRcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYXBpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhdXNlKHRpbWUpIHtcclxuICAgICAgICAgICAgdGltZSA9IHRpbWUgfHwgbG9vcC5ub3c7XHJcbiAgICAgICAgICAgIHNwcmluZy5wYXVzZSh0aW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFwaTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZXN1bWUodGltZSkge1xyXG4gICAgICAgICAgICB0aW1lID0gdGltZSB8fCBsb29wLm5vdztcclxuICAgICAgICAgICAgc3ByaW5nLnJlc3VtZSh0aW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFwaTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzdG9wKCkge1xyXG4gICAgICAgICAgICBpZiAoIXBsYXlpbmcpIHsgcmV0dXJuIGFwaTsgfVxyXG4gICAgICAgICAgICBwbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGxvb3AucmVtb3ZlKHNwcmluZyk7XHJcbiAgICAgICAgICAgIHNwcmluZy5zdG9wKCk7XHJcbiAgICAgICAgICAgIGFwaS50cmlnZ2VyKCdzdG9wJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBhcGk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0iLCJjb25zdCB3YWl0aW5nICAgID0gW107XG5jb25zdCBhbmltYXRpb25zID0gW107XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgICBub3c6IERhdGUubm93KCksXG5cbiAgICBhd2FpdChmbikge1xuICAgICAgICB3YWl0aW5nLnB1c2goZm4pO1xuICAgIH0sXG5cbiAgICBhZGQoZm4pIHtcbiAgICAgICAgYW5pbWF0aW9ucy5wdXNoKGZuKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlKGZuKSB7XG4gICAgICAgIGxldCBpZHggPSBhbmltYXRpb25zLmluZGV4T2YoZm4pO1xuICAgICAgICBpZiAoaWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgYW5pbWF0aW9ucy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIGNvbnN0IHRpbWUgPSB0aGlzLm5vdyA9IERhdGUubm93KCk7XG5cbiAgICAgICAgaWYgKHdhaXRpbmcubGVuZ3RoID09PSAwICYmIGFuaW1hdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaWR4ID0gMDtcbiAgICAgICAgd2hpbGUgKGlkeCA8IHdhaXRpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAod2FpdGluZ1tpZHhdKHRpbWUpKSB7XG4gICAgICAgICAgICAgICAgaWR4Kys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdhaXRpbmcuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgYW5pbWF0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbnNbaWR4XS5zdGVwKHRpbWUpO1xuICAgICAgICAgICAgaWR4Kys7XG4gICAgICAgIH1cbiAgICB9XG59OyIsImltcG9ydCB2ZWN0b3IgZnJvbSAnLi92ZWN0b3InO1xyXG5cclxuLyoqXHJcbiAqIEEgNCBkaW1lbnNpb25hbCB2ZWN0b3JcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBWZWN0b3I0KHgsIHksIHosIHcpIHtcclxuICAgIHRoaXMueCA9IHg7XHJcbiAgICB0aGlzLnkgPSB5O1xyXG4gICAgdGhpcy56ID0gejtcclxuICAgIHRoaXMudyA9IHc7XHJcbiAgICB0aGlzLmNoZWNrVmFsdWVzKCk7XHJcbn1cclxuXHJcblZlY3RvcjQucHJvdG90eXBlID0ge1xyXG4gICAgY29uc3RydWN0b3I6IFZlY3RvcjQsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbnN1cmUgdGhhdCB2YWx1ZXMgYXJlIG5vdCB1bmRlZmluZWRcclxuICAgICAqIEByZXR1cm5zIG51bGxcclxuICAgICAqL1xyXG4gICAgY2hlY2tWYWx1ZXMoKSB7XHJcbiAgICAgICAgdGhpcy54ID0gdGhpcy54IHx8IDA7XHJcbiAgICAgICAgdGhpcy55ID0gdGhpcy55IHx8IDA7XHJcbiAgICAgICAgdGhpcy56ID0gdGhpcy56IHx8IDA7XHJcbiAgICAgICAgdGhpcy53ID0gdGhpcy53IHx8IDA7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHZlY3RvclxyXG4gICAgICogQHJldHVybnMge2Zsb2F0fVxyXG4gICAgICovXHJcbiAgICBsZW5ndGgoKSB7XHJcbiAgICAgICAgdGhpcy5jaGVja1ZhbHVlcygpO1xyXG4gICAgICAgIHJldHVybiB2ZWN0b3IubGVuZ3RoKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCBhIG5vcm1hbGlzZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxyXG4gICAgICogQHJldHVybnMge1ZlY3RvcjR9XHJcbiAgICAgKi9cclxuICAgIG5vcm1hbGl6ZSgpIHtcclxuICAgICAgICByZXR1cm4gdmVjdG9yLm5vcm1hbGl6ZSh0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWZWN0b3IgRG90LVByb2R1Y3RcclxuICAgICAqIEBwYXJhbSB7VmVjdG9yNH0gdiBUaGUgc2Vjb25kIHZlY3RvciB0byBhcHBseSB0aGUgcHJvZHVjdCB0b1xyXG4gICAgICogQHJldHVybnMge2Zsb2F0fSBUaGUgRG90LVByb2R1Y3Qgb2YgdGhpcyBhbmQgdi5cclxuICAgICAqL1xyXG4gICAgZG90KHYpIHtcclxuICAgICAgICByZXR1cm4gdmVjdG9yLmRvdCh0aGlzLCB2KTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWZWN0b3IgQ3Jvc3MtUHJvZHVjdFxyXG4gICAgICogQHBhcmFtIHtWZWN0b3I0fSB2IFRoZSBzZWNvbmQgdmVjdG9yIHRvIGFwcGx5IHRoZSBwcm9kdWN0IHRvXHJcbiAgICAgKiBAcmV0dXJucyB7VmVjdG9yNH0gVGhlIENyb3NzLVByb2R1Y3Qgb2YgdGhpcyBhbmQgdi5cclxuICAgICAqL1xyXG4gICAgY3Jvc3Modikge1xyXG4gICAgICAgIHJldHVybiB2ZWN0b3IuY3Jvc3ModGhpcywgdik7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIHJlcXVpcmVkIGZvciBtYXRyaXggZGVjb21wb3NpdGlvblxyXG4gICAgICogQSBKYXZhc2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHBzZXVkbyBjb2RlIGF2YWlsYWJsZSBmcm9tIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtMmQtdHJhbnNmb3Jtcy8jbWF0cml4LWRlY29tcG9zaXRpb25cclxuICAgICAqIEBwYXJhbSB7VmVjdG9yNH0gYVBvaW50IEEgM0QgcG9pbnRcclxuICAgICAqIEBwYXJhbSB7ZmxvYXR9IGFzY2xcclxuICAgICAqIEBwYXJhbSB7ZmxvYXR9IGJzY2xcclxuICAgICAqIEByZXR1cm5zIHtWZWN0b3I0fVxyXG4gICAgICovXHJcbiAgICBjb21iaW5lKGJQb2ludCwgYXNjbCwgYnNjbCkge1xyXG4gICAgICAgIHJldHVybiB2ZWN0b3IuY29tYmluZSh0aGlzLCBiUG9pbnQsIGFzY2wsIGJzY2wpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtdWx0aXBseUJ5TWF0cml4IChtYXRyaXgpIHtcclxuICAgICAgICByZXR1cm4gdmVjdG9yLm11bHRpcGx5QnlNYXRyaXgodGhpcywgbWF0cml4KTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFZlY3RvcjQ7IiwiLyoqXHJcbiAqICBDb252ZXJ0cyBhbmdsZXMgaW4gZGVncmVlcywgd2hpY2ggYXJlIHVzZWQgYnkgdGhlIGV4dGVybmFsIEFQSSwgdG8gYW5nbGVzXHJcbiAqICBpbiByYWRpYW5zIHVzZWQgaW4gaW50ZXJuYWwgY2FsY3VsYXRpb25zLlxyXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIC0gQW4gYW5nbGUgaW4gZGVncmVlcy5cclxuICogIEByZXR1cm5zIHtudW1iZXJ9IHJhZGlhbnNcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlZzJyYWQoYW5nbGUpIHtcclxuICAgIHJldHVybiBhbmdsZSAqIE1hdGguUEkgLyAxODA7XHJcbn1cclxuIiwiaW1wb3J0IGRlZzJyYWQgZnJvbSAnLi9kZWcycmFkJztcclxuaW1wb3J0IG1hdHJpeCBmcm9tICcuL21hdHJpeCc7XHJcbmltcG9ydCB0cmFuc3AgZnJvbSAnLi90cmFuc3AnO1xyXG5cclxuY29uc3QgaW5kZXhUb0tleTJkID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGluZGV4ICsgOTcpOyAvLyBBU0NJSSBjaGFyIDk3ID09ICdhJ1xyXG59O1xyXG5cclxuY29uc3QgaW5kZXhUb0tleTNkID0gZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgIHJldHVybiAoJ20nICsgKE1hdGguZmxvb3IoaW5kZXggLyA0KSArIDEpKSArIChpbmRleCAlIDQgKyAxKTtcclxufTtcclxuXHJcbmNvbnN0IHBvaW50czJkID0gW1xyXG4gICAgJ20xMScsIC8vIGFcclxuICAgICdtMTInLCAvLyBiXHJcbiAgICAnbTIxJywgLy8gY1xyXG4gICAgJ20yMicsIC8vIGRcclxuICAgICdtNDEnLCAvLyBlXHJcbiAgICAnbTQyJyAgLy8gZlxyXG5dO1xyXG5cclxuY29uc3QgcG9pbnRzM2QgPSBbXHJcbiAgICAnbTExJywgJ20xMicsICdtMTMnLCAnbTE0JyxcclxuICAgICdtMjEnLCAnbTIyJywgJ20yMycsICdtMjQnLFxyXG4gICAgJ20zMScsICdtMzInLCAnbTMzJywgJ20zNCcsXHJcbiAgICAnbTQxJywgJ200MicsICdtNDMnLCAnbTQ0J1xyXG5dO1xyXG5cclxuY29uc3QgbG9va3VwVG9GaXhlZCA9IGZ1bmN0aW9uKHApIHtcclxuICAgIHJldHVybiB0aGlzW3BdLnRvRml4ZWQoNik7XHJcbn07XHJcblxyXG4vKipcclxuICogIEdpdmVuIGEgQ1NTIHRyYW5zZm9ybSBzdHJpbmcgKGxpa2UgYHJvdGF0ZSgzcmFkKWAsIG9yXHJcbiAqICAgIGBtYXRyaXgoMSwgMCwgMCwgMCwgMSwgMClgKSwgcmV0dXJuIGFuIGluc3RhbmNlIGNvbXBhdGlibGUgd2l0aFxyXG4gKiAgICBbYFdlYktpdENTU01hdHJpeGBdKGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvc2FmYXJpL2RvY3VtZW50YXRpb24vQXVkaW9WaWRlby9SZWZlcmVuY2UvV2ViS2l0Q1NTTWF0cml4Q2xhc3NSZWZlcmVuY2UvV2ViS2l0Q1NTTWF0cml4L1dlYktpdENTU01hdHJpeC5odG1sKVxyXG4gKiAgQGNvbnN0cnVjdG9yXHJcbiAqICBAcGFyYW0ge3N0cmluZ30gZG9tc3RyIC0gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSAyRCBvciAzRCB0cmFuc2Zvcm0gbWF0cml4XHJcbiAqICAgIGluIHRoZSBmb3JtIGdpdmVuIGJ5IHRoZSBDU1MgdHJhbnNmb3JtIHByb3BlcnR5LCBpLmUuIGp1c3QgbGlrZSB0aGVcclxuICogICAgb3V0cHV0IGZyb20gW1tAbGluayN0b1N0cmluZ11dLlxyXG4gKiAgQHJldHVybnMge1hDU1NNYXRyaXh9IG1hdHJpeFxyXG4gKi9cclxuZnVuY3Rpb24gWENTU01hdHJpeChzdHIpIHtcclxuICAgIHRoaXMubTExID0gdGhpcy5tMjIgPSB0aGlzLm0zMyA9IHRoaXMubTQ0ID0gMTtcclxuXHJcbiAgICAgICAgICAgICAgIHRoaXMubTEyID0gdGhpcy5tMTMgPSB0aGlzLm0xNCA9XHJcbiAgICB0aGlzLm0yMSA9ICAgICAgICAgICAgdGhpcy5tMjMgPSB0aGlzLm0yNCA9XHJcbiAgICB0aGlzLm0zMSA9IHRoaXMubTMyID0gICAgICAgICAgICB0aGlzLm0zNCA9XHJcbiAgICB0aGlzLm00MSA9IHRoaXMubTQyID0gdGhpcy5tNDMgICAgICAgICAgICA9IDA7XHJcblxyXG4gICAgdGhpcy5zZXRNYXRyaXhWYWx1ZShzdHIpO1xyXG59XHJcblxyXG5YQ1NTTWF0cml4LnByb3RvdHlwZSA9IHtcclxuICAgIGNvbnN0cnVjdG9yOiBYQ1NTTWF0cml4LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogIE11bHRpcGx5IG9uZSBtYXRyaXggYnkgYW5vdGhlclxyXG4gICAgICogIEBwYXJhbSB7WENTU01hdHJpeH0gb3RoZXJNYXRyaXggLSBUaGUgbWF0cml4IHRvIG11bHRpcGx5IHRoaXMgb25lIGJ5LlxyXG4gICAgICovXHJcbiAgICBtdWx0aXBseShvdGhlck1hdHJpeCkge1xyXG4gICAgICAgIHJldHVybiBtYXRyaXgubXVsdGlwbHkodGhpcywgb3RoZXJNYXRyaXgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqICBJZiB0aGUgbWF0cml4IGlzIGludmVydGlibGUsIHJldHVybnMgaXRzIGludmVyc2UsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXHJcbiAgICAgKiAgQHJldHVybnMge1hDU1NNYXRyaXh8bnVsbH1cclxuICAgICAqL1xyXG4gICAgaW52ZXJzZSgpIHtcclxuICAgICAgICByZXR1cm4gbWF0cml4LmludmVyc2UodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogIFJldHVybnMgdGhlIHJlc3VsdCBvZiByb3RhdGluZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxyXG4gICAgICpcclxuICAgICAqICBJZiBvbmx5IHRoZSBmaXJzdCBhcmd1bWVudCBpcyBwcm92aWRlZCwgdGhlIG1hdHJpeCBpcyBvbmx5IHJvdGF0ZWQgYWJvdXRcclxuICAgICAqICB0aGUgeiBheGlzLlxyXG4gICAgICogIEBwYXJhbSB7bnVtYmVyfSByb3RYIC0gVGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeCBheGlzLlxyXG4gICAgICogIEBwYXJhbSB7bnVtYmVyfSByb3RZIC0gVGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeSBheGlzLiBJZiB1bmRlZmluZWQsIHRoZSB4IGNvbXBvbmVudCBpcyB1c2VkLlxyXG4gICAgICogIEBwYXJhbSB7bnVtYmVyfSByb3RaIC0gVGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeiBheGlzLiBJZiB1bmRlZmluZWQsIHRoZSB4IGNvbXBvbmVudCBpcyB1c2VkLlxyXG4gICAgICogIEByZXR1cm5zIFhDU1NNYXRyaXhcclxuICAgICAqL1xyXG4gICAgcm90YXRlKHJ4LCByeSwgcnopIHtcclxuICAgICAgICBpZiAocnggPT09IHVuZGVmaW5lZCkgeyByeCA9IDA7IH1cclxuXHJcbiAgICAgICAgaWYgKHJ5ID09PSB1bmRlZmluZWQgJiZcclxuICAgICAgICAgICAgcnogPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByeiA9IHJ4O1xyXG4gICAgICAgICAgICByeCA9IDA7XHJcbiAgICAgICAgICAgIHJ5ID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyeSA9PT0gdW5kZWZpbmVkKSB7IHJ5ID0gMDsgfVxyXG4gICAgICAgIGlmIChyeiA9PT0gdW5kZWZpbmVkKSB7IHJ6ID0gMDsgfVxyXG5cclxuICAgICAgICByeCA9IGRlZzJyYWQocngpO1xyXG4gICAgICAgIHJ5ID0gZGVnMnJhZChyeSk7XHJcbiAgICAgICAgcnogPSBkZWcycmFkKHJ6KTtcclxuXHJcbiAgICAgICAgdmFyIHR4ID0gbmV3IFhDU1NNYXRyaXgoKSxcclxuICAgICAgICAgICAgdHkgPSBuZXcgWENTU01hdHJpeCgpLFxyXG4gICAgICAgICAgICB0eiA9IG5ldyBYQ1NTTWF0cml4KCksXHJcbiAgICAgICAgICAgIHNpbkEsIGNvc0EsIHNxO1xyXG5cclxuICAgICAgICByeiAvPSAyO1xyXG4gICAgICAgIHNpbkEgID0gTWF0aC5zaW4ocnopO1xyXG4gICAgICAgIGNvc0EgID0gTWF0aC5jb3MocnopO1xyXG4gICAgICAgIHNxID0gc2luQSAqIHNpbkE7XHJcblxyXG4gICAgICAgIC8vIE1hdHJpY2VzIGFyZSBpZGVudGl0eSBvdXRzaWRlIHRoZSBhc3NpZ25lZCB2YWx1ZXNcclxuICAgICAgICB0ei5tMTEgPSB0ei5tMjIgPSAxIC0gMiAqIHNxO1xyXG4gICAgICAgIHR6Lm0xMiA9IHR6Lm0yMSA9IDIgKiBzaW5BICogY29zQTtcclxuICAgICAgICB0ei5tMjEgKj0gLTE7XHJcblxyXG4gICAgICAgIHJ5IC89IDI7XHJcbiAgICAgICAgc2luQSAgPSBNYXRoLnNpbihyeSk7XHJcbiAgICAgICAgY29zQSAgPSBNYXRoLmNvcyhyeSk7XHJcbiAgICAgICAgc3EgPSBzaW5BICogc2luQTtcclxuXHJcbiAgICAgICAgdHkubTExID0gdHkubTMzID0gMSAtIDIgKiBzcTtcclxuICAgICAgICB0eS5tMTMgPSB0eS5tMzEgPSAyICogc2luQSAqIGNvc0E7XHJcbiAgICAgICAgdHkubTEzICo9IC0xO1xyXG5cclxuICAgICAgICByeCAvPSAyO1xyXG4gICAgICAgIHNpbkEgPSBNYXRoLnNpbihyeCk7XHJcbiAgICAgICAgY29zQSA9IE1hdGguY29zKHJ4KTtcclxuICAgICAgICBzcSA9IHNpbkEgKiBzaW5BO1xyXG5cclxuICAgICAgICB0eC5tMjIgPSB0eC5tMzMgPSAxIC0gMiAqIHNxO1xyXG4gICAgICAgIHR4Lm0yMyA9IHR4Lm0zMiA9IDIgKiBzaW5BICogY29zQTtcclxuICAgICAgICB0eC5tMzIgKj0gLTE7XHJcblxyXG4gICAgICAgIGNvbnN0IGlkZW50aXR5TWF0cml4ID0gbmV3IFhDU1NNYXRyaXgoKTsgLy8gcmV0dXJucyBpZGVudGl0eSBtYXRyaXggYnkgZGVmYXVsdFxyXG4gICAgICAgIGNvbnN0IGlzSWRlbnRpdHkgICAgID0gdGhpcy50b1N0cmluZygpID09PSBpZGVudGl0eU1hdHJpeC50b1N0cmluZygpO1xyXG4gICAgICAgIGNvbnN0IHJvdGF0ZWRNYXRyaXggID0gaXNJZGVudGl0eSA/XHJcbiAgICAgICAgICAgICAgICB0ei5tdWx0aXBseSh0eSkubXVsdGlwbHkodHgpIDpcclxuICAgICAgICAgICAgICAgIHRoaXMubXVsdGlwbHkodHgpLm11bHRpcGx5KHR5KS5tdWx0aXBseSh0eik7XHJcblxyXG4gICAgICAgIHJldHVybiByb3RhdGVkTWF0cml4O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqICBSZXR1cm5zIHRoZSByZXN1bHQgb2Ygc2NhbGluZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxyXG4gICAgICogIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVggLSB0aGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHggYXhpcy5cclxuICAgICAqICBAcGFyYW0ge251bWJlcn0gc2NhbGVZIC0gdGhlIHNjYWxpbmcgZmFjdG9yIGluIHRoZSB5IGF4aXMuIElmIHVuZGVmaW5lZCwgdGhlIHggY29tcG9uZW50IGlzIHVzZWQuXHJcbiAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IHNjYWxlWiAtIHRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeiBheGlzLiBJZiB1bmRlZmluZWQsIDEgaXMgdXNlZC5cclxuICAgICAqICBAcmV0dXJucyBYQ1NTTWF0cml4XHJcbiAgICAgKi9cclxuICAgIHNjYWxlKHNjYWxlWCwgc2NhbGVZLCBzY2FsZVopIHtcclxuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBuZXcgWENTU01hdHJpeCgpO1xyXG5cclxuICAgICAgICBpZiAoc2NhbGVYID09PSB1bmRlZmluZWQpIHsgc2NhbGVYID0gMTsgfVxyXG4gICAgICAgIGlmIChzY2FsZVkgPT09IHVuZGVmaW5lZCkgeyBzY2FsZVkgPSBzY2FsZVg7IH1cclxuICAgICAgICBpZiAoIXNjYWxlWikgeyBzY2FsZVogPSAxOyB9XHJcblxyXG4gICAgICAgIHRyYW5zZm9ybS5tMTEgPSBzY2FsZVg7XHJcbiAgICAgICAgdHJhbnNmb3JtLm0yMiA9IHNjYWxlWTtcclxuICAgICAgICB0cmFuc2Zvcm0ubTMzID0gc2NhbGVaO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5tdWx0aXBseSh0cmFuc2Zvcm0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqICBSZXR1cm5zIHRoZSByZXN1bHQgb2Ygc2tld2luZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxyXG4gICAgICogIEBwYXJhbSB7bnVtYmVyfSBza2V3WCAtIFRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeCBheGlzLlxyXG4gICAgICogIEByZXR1cm5zIFhDU1NNYXRyaXhcclxuICAgICAqL1xyXG4gICAgc2tld1goZGVncmVlcykge1xyXG4gICAgICAgIGNvbnN0IHJhZGlhbnMgICA9IGRlZzJyYWQoZGVncmVlcyk7XHJcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gbmV3IFhDU1NNYXRyaXgoKTtcclxuXHJcbiAgICAgICAgdHJhbnNmb3JtLmMgPSBNYXRoLnRhbihyYWRpYW5zKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkodHJhbnNmb3JtKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAgUmV0dXJucyB0aGUgcmVzdWx0IG9mIHNrZXdpbmcgdGhlIG1hdHJpeCBieSBhIGdpdmVuIHZlY3Rvci5cclxuICAgICAqICBAcGFyYW0ge251bWJlcn0gc2tld1kgLSB0aGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHggYXhpcy5cclxuICAgICAqICBAcmV0dXJucyBYQ1NTTWF0cml4XHJcbiAgICAgKi9cclxuICAgIHNrZXdZKGRlZ3JlZXMpIHtcclxuICAgICAgICBjb25zdCByYWRpYW5zICAgPSBkZWcycmFkKGRlZ3JlZXMpO1xyXG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IG5ldyBYQ1NTTWF0cml4KCk7XHJcblxyXG4gICAgICAgIHRyYW5zZm9ybS5iID0gTWF0aC50YW4ocmFkaWFucyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KHRyYW5zZm9ybSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogIFJldHVybnMgdGhlIHJlc3VsdCBvZiB0cmFuc2xhdGluZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxyXG4gICAgICogIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIHggY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXHJcbiAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cclxuICAgICAqICBAcGFyYW0ge251bWJlcn0geiAtIFRoZSB6IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLiBJZiB1bmRlZmluZWQsIDAgaXMgdXNlZC5cclxuICAgICAqICBAcmV0dXJucyBYQ1NTTWF0cml4XHJcbiAgICAgKi9cclxuICAgIHRyYW5zbGF0ZSh4LCB5LCB6KSB7XHJcbiAgICAgICAgY29uc3QgdCA9IG5ldyBYQ1NTTWF0cml4KCk7XHJcblxyXG4gICAgICAgIGlmICh4ID09PSB1bmRlZmluZWQpIHsgeCA9IDA7IH1cclxuICAgICAgICBpZiAoeSA9PT0gdW5kZWZpbmVkKSB7IHkgPSAwOyB9XHJcbiAgICAgICAgaWYgKHogPT09IHVuZGVmaW5lZCkgeyB6ID0gMDsgfVxyXG5cclxuICAgICAgICB0Lm00MSA9IHg7XHJcbiAgICAgICAgdC5tNDIgPSB5O1xyXG4gICAgICAgIHQubTQzID0gejtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkodCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogIFNldHMgdGhlIG1hdHJpeCB2YWx1ZXMgdXNpbmcgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24sIHN1Y2ggYXMgdGhhdCBwcm9kdWNlZFxyXG4gICAgICogIGJ5IHRoZSBbW1hDU1NNYXRyaXgjdG9TdHJpbmddXSBtZXRob2QuXHJcbiAgICAgKiAgQHBhcmFtcyB7c3RyaW5nfSBkb21zdHIgLSBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIDJEIG9yIDNEIHRyYW5zZm9ybSBtYXRyaXhcclxuICAgICAqICAgIGluIHRoZSBmb3JtIGdpdmVuIGJ5IHRoZSBDU1MgdHJhbnNmb3JtIHByb3BlcnR5LCBpLmUuIGp1c3QgbGlrZSB0aGVcclxuICAgICAqICAgIG91dHB1dCBmcm9tIFtbWENTU01hdHJpeCN0b1N0cmluZ11dLlxyXG4gICAgICogIEByZXR1cm5zIHVuZGVmaW5lZFxyXG4gICAgICovXHJcbiAgICBzZXRNYXRyaXhWYWx1ZShkb21zdHIpIHtcclxuICAgICAgICBpZiAoIWRvbXN0cikgeyByZXR1cm47IH1cclxuXHJcbiAgICAgICAgdmFyIG1hdHJpeE9iamVjdCA9IHRyYW5zcChkb21zdHIpO1xyXG4gICAgICAgIGlmICghbWF0cml4T2JqZWN0KSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YXIgaXMzZCAgID0gbWF0cml4T2JqZWN0LmtleSA9PT0gJ21hdHJpeDNkJztcclxuICAgICAgICB2YXIga2V5Z2VuID0gaXMzZCA/IGluZGV4VG9LZXkzZCA6IGluZGV4VG9LZXkyZDtcclxuICAgICAgICB2YXIgdmFsdWVzID0gbWF0cml4T2JqZWN0LnZhbHVlO1xyXG4gICAgICAgIHZhciBjb3VudCAgPSB2YWx1ZXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoKGlzM2QgJiYgY291bnQgIT09IDE2KSB8fCAhKGlzM2QgfHwgY291bnQgPT09IDYpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbihvYmosIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5Z2VuKGlkeCk7XHJcbiAgICAgICAgICAgIHRoaXNba2V5XSA9IG9iai52YWx1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGVjb21wb3NlKCkge1xyXG4gICAgICAgIHJldHVybiBtYXRyaXguZGVjb21wb3NlKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb3NlKHtcclxuICAgICAgICB4LCB5LCB6LFxyXG4gICAgICAgIHJvdGF0ZVgsIHJvdGF0ZVksIHJvdGF0ZVosXHJcbiAgICAgICAgc2NhbGVYLCBzY2FsZVksIHNjYWxlWixcclxuICAgICAgICBza2V3WCwgc2tld1lcclxuICAgIH0pIHtcclxuICAgICAgICBsZXQgbSA9IHRoaXM7XHJcbiAgICAgICAgbSA9IG0udHJhbnNsYXRlKHgsIHksIHopO1xyXG4gICAgICAgIG0gPSBtLnJvdGF0ZShyb3RhdGVYLCByb3RhdGVZLCByb3RhdGVaKTtcclxuICAgICAgICBtID0gbS5zY2FsZShzY2FsZVgsIHNjYWxlWSwgc2NhbGVaKTtcclxuICAgICAgICBpZiAoc2tld1ggIT09IHVuZGVmaW5lZCkgeyBtID0gbS5za2V3WChza2V3WCk7IH1cclxuICAgICAgICBpZiAoc2tld1kgIT09IHVuZGVmaW5lZCkgeyBtID0gbS5za2V3WShza2V3WSk7IH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeC5cclxuICAgICAqICBAcmV0dXJucyB7c3RyaW5nfSBtYXRyaXhTdHJpbmcgLSBhIHN0cmluZyBsaWtlIGBtYXRyaXgoMS4wMDAwMDAsIDAuMDAwMDAwLCAwLjAwMDAwMCwgMS4wMDAwMDAsIDAuMDAwMDAwLCAwLjAwMDAwMClgXHJcbiAgICAgKlxyXG4gICAgICoqL1xyXG4gICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgbGV0IHBvaW50cywgcHJlZml4O1xyXG5cclxuICAgICAgICBpZiAobWF0cml4LmlzQWZmaW5lKHRoaXMpKSB7XHJcbiAgICAgICAgICAgIHByZWZpeCA9ICdtYXRyaXgnO1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMyZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwcmVmaXggPSAnbWF0cml4M2QnO1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMzZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBgJHtwcmVmaXh9KCR7cG9pbnRzLm1hcChsb29rdXBUb0ZpeGVkLCB0aGlzKS5qb2luKCcsICcpfSlgO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgWENTU01hdHJpeDsiLCJpbXBvcnQgVmVjdG9yNCBmcm9tICcuL1ZlY3RvcjQnO1xyXG5cclxuLyoqXHJcbiAqICBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIDJ4MiBtYXRyaXguXHJcbiAqICBAcGFyYW0ge251bWJlcn0gYSAtIFRvcC1sZWZ0IHZhbHVlIG9mIHRoZSBtYXRyaXguXHJcbiAqICBAcGFyYW0ge251bWJlcn0gYiAtIFRvcC1yaWdodCB2YWx1ZSBvZiB0aGUgbWF0cml4LlxyXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGMgLSBCb3R0b20tbGVmdCB2YWx1ZSBvZiB0aGUgbWF0cml4LlxyXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGQgLSBCb3R0b20tcmlnaHQgdmFsdWUgb2YgdGhlIG1hdHJpeC5cclxuICogIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAqL1xyXG5jb25zdCBkZXRlcm1pbmFudDJ4MiA9IGZ1bmN0aW9uKGEsIGIsIGMsIGQpIHtcclxuICAgIHJldHVybiBhICogZCAtIGIgKiBjO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqICBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIDN4MyBtYXRyaXguXHJcbiAqICBAcGFyYW0ge251bWJlcn0gYTEgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzEsIDFdLlxyXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGEyIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFsxLCAyXS5cclxuICogIEBwYXJhbSB7bnVtYmVyfSBhMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMSwgM10uXHJcbiAqICBAcGFyYW0ge251bWJlcn0gYjEgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzIsIDFdLlxyXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGIyIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFsyLCAyXS5cclxuICogIEBwYXJhbSB7bnVtYmVyfSBiMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMiwgM10uXHJcbiAqICBAcGFyYW0ge251bWJlcn0gYzEgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzMsIDFdLlxyXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGMyIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFszLCAyXS5cclxuICogIEBwYXJhbSB7bnVtYmVyfSBjMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMywgM10uXHJcbiAqICBAcmV0dXJucyB7bnVtYmVyfVxyXG4gKi9cclxuY29uc3QgZGV0ZXJtaW5hbnQzeDMgPSBmdW5jdGlvbihhMSwgYTIsIGEzLCBiMSwgYjIsIGIzLCBjMSwgYzIsIGMzKSB7XHJcbiAgICByZXR1cm4gYTEgKiBkZXRlcm1pbmFudDJ4MihiMiwgYjMsIGMyLCBjMykgLVxyXG4gICAgICAgIGIxICogZGV0ZXJtaW5hbnQyeDIoYTIsIGEzLCBjMiwgYzMpICtcclxuICAgICAgICBjMSAqIGRldGVybWluYW50MngyKGEyLCBhMywgYjIsIGIzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiAgQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSA0eDQgbWF0cml4LlxyXG4gKiAgQHBhcmFtIHtYQ1NTTWF0cml4fSBtYXRyaXggLSBUaGUgbWF0cml4IHRvIGNhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnQgb2YuXHJcbiAqICBAcmV0dXJucyB7bnVtYmVyfVxyXG4gKi9cclxuY29uc3QgZGV0ZXJtaW5hbnQ0eDQgPSBmdW5jdGlvbihtYXRyaXgpIHtcclxuICAgIHZhciBtID0gbWF0cml4LFxyXG4gICAgICAgIC8vIEFzc2lnbiB0byBpbmRpdmlkdWFsIHZhcmlhYmxlIG5hbWVzIHRvIGFpZCBzZWxlY3RpbmcgY29ycmVjdCBlbGVtZW50c1xyXG4gICAgICAgIGExID0gbS5tMTEsIGIxID0gbS5tMjEsIGMxID0gbS5tMzEsIGQxID0gbS5tNDEsXHJcbiAgICAgICAgYTIgPSBtLm0xMiwgYjIgPSBtLm0yMiwgYzIgPSBtLm0zMiwgZDIgPSBtLm00MixcclxuICAgICAgICBhMyA9IG0ubTEzLCBiMyA9IG0ubTIzLCBjMyA9IG0ubTMzLCBkMyA9IG0ubTQzLFxyXG4gICAgICAgIGE0ID0gbS5tMTQsIGI0ID0gbS5tMjQsIGM0ID0gbS5tMzQsIGQ0ID0gbS5tNDQ7XHJcblxyXG4gICAgcmV0dXJuIGExICogZGV0ZXJtaW5hbnQzeDMoYjIsIGIzLCBiNCwgYzIsIGMzLCBjNCwgZDIsIGQzLCBkNCkgLVxyXG4gICAgICAgIGIxICogZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYzIsIGMzLCBjNCwgZDIsIGQzLCBkNCkgK1xyXG4gICAgICAgIGMxICogZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgZDIsIGQzLCBkNCkgLVxyXG4gICAgICAgIGQxICogZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgYzIsIGMzLCBjNCk7XHJcbn07XHJcblxyXG4vKipcclxuICogIERldGVybWluZXMgd2hldGhlciB0aGUgbWF0cml4IGlzIGFmZmluZS5cclxuICogIEByZXR1cm5zIHtib29sZWFufVxyXG4gKi9cclxuY29uc3QgaXNBZmZpbmUgPSBmdW5jdGlvbihtKSB7XHJcbiAgICByZXR1cm4gbS5tMTMgPT09IDAgJiYgbS5tMTQgPT09IDAgJiZcclxuICAgICAgICBtLm0yMyA9PT0gMCAmJiBtLm0yNCA9PT0gMCAmJlxyXG4gICAgICAgIG0ubTMxID09PSAwICYmIG0ubTMyID09PSAwICYmXHJcbiAgICAgICAgbS5tMzMgPT09IDEgJiYgbS5tMzQgPT09IDAgJiZcclxuICAgICAgICBtLm00MyA9PT0gMCAmJiBtLm00NCA9PT0gMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiAgUmV0dXJucyB3aGV0aGVyIHRoZSBtYXRyaXggaXMgdGhlIGlkZW50aXR5IG1hdHJpeCBvciBhIHRyYW5zbGF0aW9uIG1hdHJpeC5cclxuICogIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAqL1xyXG5jb25zdCBpc0lkZW50aXR5T3JUcmFuc2xhdGlvbiA9IGZ1bmN0aW9uKG0pIHtcclxuICAgIHJldHVybiBtLm0xMSA9PT0gMSAmJiBtLm0xMiA9PT0gMCAmJiBtLm0xMyA9PT0gMCAmJiBtLm0xNCA9PT0gMCAmJlxyXG4gICAgICAgIG0ubTIxID09PSAwICYmIG0ubTIyID09PSAxICYmIG0ubTIzID09PSAwICYmIG0ubTI0ID09PSAwICYmXHJcbiAgICAgICAgbS5tMzEgPT09IDAgJiYgbS5tMzEgPT09IDAgJiYgbS5tMzMgPT09IDEgJiYgbS5tMzQgPT09IDAgJiZcclxuICAgICAgICAvLyBtNDEsIG00MiBhbmQgbTQzIGFyZSB0aGUgdHJhbnNsYXRpb24gcG9pbnRzXHJcbiAgICAgICAgbS5tNDQgPT09IDE7XHJcbn07XHJcblxyXG4vKipcclxuICogIFJldHVybnMgdGhlIGFkam9pbnQgbWF0cml4LlxyXG4gKiAgQHJldHVybiB7WENTU01hdHJpeH1cclxuICovXHJcbmNvbnN0IGFkam9pbnQgPSBmdW5jdGlvbihtKSB7XHJcbiAgICAvLyBtYWtlIGByZXN1bHRgIHRoZSBzYW1lIHR5cGUgYXMgdGhlIGdpdmVuIG1ldHJpY1xyXG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IG0uY29uc3RydWN0b3IoKSxcclxuICAgICAgICBhMSA9IG0ubTExLCBiMSA9IG0ubTEyLCBjMSA9IG0ubTEzLCBkMSA9IG0ubTE0LFxyXG4gICAgICAgIGEyID0gbS5tMjEsIGIyID0gbS5tMjIsIGMyID0gbS5tMjMsIGQyID0gbS5tMjQsXHJcbiAgICAgICAgYTMgPSBtLm0zMSwgYjMgPSBtLm0zMiwgYzMgPSBtLm0zMywgZDMgPSBtLm0zNCxcclxuICAgICAgICBhNCA9IG0ubTQxLCBiNCA9IG0ubTQyLCBjNCA9IG0ubTQzLCBkNCA9IG0ubTQ0O1xyXG5cclxuICAgIC8vIFJvdyBjb2x1bW4gbGFiZWxpbmcgcmV2ZXJzZWQgc2luY2Ugd2UgdHJhbnNwb3NlIHJvd3MgJiBjb2x1bW5zXHJcbiAgICByZXN1bHQubTExID0gIGRldGVybWluYW50M3gzKGIyLCBiMywgYjQsIGMyLCBjMywgYzQsIGQyLCBkMywgZDQpO1xyXG4gICAgcmVzdWx0Lm0yMSA9IC1kZXRlcm1pbmFudDN4MyhhMiwgYTMsIGE0LCBjMiwgYzMsIGM0LCBkMiwgZDMsIGQ0KTtcclxuICAgIHJlc3VsdC5tMzEgPSAgZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgZDIsIGQzLCBkNCk7XHJcbiAgICByZXN1bHQubTQxID0gLWRldGVybWluYW50M3gzKGEyLCBhMywgYTQsIGIyLCBiMywgYjQsIGMyLCBjMywgYzQpO1xyXG5cclxuICAgIHJlc3VsdC5tMTIgPSAtZGV0ZXJtaW5hbnQzeDMoYjEsIGIzLCBiNCwgYzEsIGMzLCBjNCwgZDEsIGQzLCBkNCk7XHJcbiAgICByZXN1bHQubTIyID0gIGRldGVybWluYW50M3gzKGExLCBhMywgYTQsIGMxLCBjMywgYzQsIGQxLCBkMywgZDQpO1xyXG4gICAgcmVzdWx0Lm0zMiA9IC1kZXRlcm1pbmFudDN4MyhhMSwgYTMsIGE0LCBiMSwgYjMsIGI0LCBkMSwgZDMsIGQ0KTtcclxuICAgIHJlc3VsdC5tNDIgPSAgZGV0ZXJtaW5hbnQzeDMoYTEsIGEzLCBhNCwgYjEsIGIzLCBiNCwgYzEsIGMzLCBjNCk7XHJcblxyXG4gICAgcmVzdWx0Lm0xMyA9ICBkZXRlcm1pbmFudDN4MyhiMSwgYjIsIGI0LCBjMSwgYzIsIGM0LCBkMSwgZDIsIGQ0KTtcclxuICAgIHJlc3VsdC5tMjMgPSAtZGV0ZXJtaW5hbnQzeDMoYTEsIGEyLCBhNCwgYzEsIGMyLCBjNCwgZDEsIGQyLCBkNCk7XHJcbiAgICByZXN1bHQubTMzID0gIGRldGVybWluYW50M3gzKGExLCBhMiwgYTQsIGIxLCBiMiwgYjQsIGQxLCBkMiwgZDQpO1xyXG4gICAgcmVzdWx0Lm00MyA9IC1kZXRlcm1pbmFudDN4MyhhMSwgYTIsIGE0LCBiMSwgYjIsIGI0LCBjMSwgYzIsIGM0KTtcclxuXHJcbiAgICByZXN1bHQubTE0ID0gLWRldGVybWluYW50M3gzKGIxLCBiMiwgYjMsIGMxLCBjMiwgYzMsIGQxLCBkMiwgZDMpO1xyXG4gICAgcmVzdWx0Lm0yNCA9ICBkZXRlcm1pbmFudDN4MyhhMSwgYTIsIGEzLCBjMSwgYzIsIGMzLCBkMSwgZDIsIGQzKTtcclxuICAgIHJlc3VsdC5tMzQgPSAtZGV0ZXJtaW5hbnQzeDMoYTEsIGEyLCBhMywgYjEsIGIyLCBiMywgZDEsIGQyLCBkMyk7XHJcbiAgICByZXN1bHQubTQ0ID0gIGRldGVybWluYW50M3gzKGExLCBhMiwgYTMsIGIxLCBiMiwgYjMsIGMxLCBjMiwgYzMpO1xyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5jb25zdCBpbnZlcnNlID0gZnVuY3Rpb24obWF0cml4KSB7XHJcbiAgICBsZXQgaW52O1xyXG5cclxuICAgIGlmIChpc0lkZW50aXR5T3JUcmFuc2xhdGlvbihtYXRyaXgpKSB7XHJcbiAgICAgICAgaW52ID0gbmV3IG1hdHJpeC5jb25zdHJ1Y3RvcigpO1xyXG5cclxuICAgICAgICBpZiAoIShtYXRyaXgubTQxID09PSAwICYmIG1hdHJpeC5tNDIgPT09IDAgJiYgbWF0cml4Lm00MyA9PT0gMCkpIHtcclxuICAgICAgICAgICAgaW52Lm00MSA9IC1tYXRyaXgubTQxO1xyXG4gICAgICAgICAgICBpbnYubTQyID0gLW1hdHJpeC5tNDI7XHJcbiAgICAgICAgICAgIGludi5tNDMgPSAtbWF0cml4Lm00MztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbnY7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBhZGpvaW50IG1hdHJpeFxyXG4gICAgY29uc3QgcmVzdWx0ID0gYWRqb2ludChtYXRyaXgpO1xyXG5cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgNHg0IGRldGVybWluYW50XHJcbiAgICBjb25zdCBkZXQgPSBkZXRlcm1pbmFudDR4NChtYXRyaXgpO1xyXG5cclxuICAgIC8vIElmIHRoZSBkZXRlcm1pbmFudCBpcyB6ZXJvLCB0aGVuIHRoZSBpbnZlcnNlIG1hdHJpeCBpcyBub3QgdW5pcXVlXHJcbiAgICBpZiAoTWF0aC5hYnMoZGV0KSA8IDFlLTgpIHsgcmV0dXJuIG51bGw7IH1cclxuXHJcbiAgICAvLyBTY2FsZSB0aGUgYWRqb2ludCBtYXRyaXggdG8gZ2V0IHRoZSBpbnZlcnNlXHJcbiAgICBmb3IgKGxldCBpZHggPSAxOyBpZHggPCA1OyBpZHgrKykge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgNTsgaSsrKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdFsoJ20nICsgaWR4KSArIGldIC89IGRldDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbmNvbnN0IG11bHRpcGx5ID0gZnVuY3Rpb24obWF0cml4LCBvdGhlck1hdHJpeCkge1xyXG4gICAgaWYgKCFvdGhlck1hdHJpeCkgeyByZXR1cm4gbnVsbDsgfVxyXG5cclxuICAgIHZhciBhID0gb3RoZXJNYXRyaXgsXHJcbiAgICAgICAgYiA9IG1hdHJpeCxcclxuICAgICAgICBjID0gbmV3IG1hdHJpeC5jb25zdHJ1Y3RvcigpO1xyXG5cclxuICAgIGMubTExID0gYS5tMTEgKiBiLm0xMSArIGEubTEyICogYi5tMjEgKyBhLm0xMyAqIGIubTMxICsgYS5tMTQgKiBiLm00MTtcclxuICAgIGMubTEyID0gYS5tMTEgKiBiLm0xMiArIGEubTEyICogYi5tMjIgKyBhLm0xMyAqIGIubTMyICsgYS5tMTQgKiBiLm00MjtcclxuICAgIGMubTEzID0gYS5tMTEgKiBiLm0xMyArIGEubTEyICogYi5tMjMgKyBhLm0xMyAqIGIubTMzICsgYS5tMTQgKiBiLm00MztcclxuICAgIGMubTE0ID0gYS5tMTEgKiBiLm0xNCArIGEubTEyICogYi5tMjQgKyBhLm0xMyAqIGIubTM0ICsgYS5tMTQgKiBiLm00NDtcclxuXHJcbiAgICBjLm0yMSA9IGEubTIxICogYi5tMTEgKyBhLm0yMiAqIGIubTIxICsgYS5tMjMgKiBiLm0zMSArIGEubTI0ICogYi5tNDE7XHJcbiAgICBjLm0yMiA9IGEubTIxICogYi5tMTIgKyBhLm0yMiAqIGIubTIyICsgYS5tMjMgKiBiLm0zMiArIGEubTI0ICogYi5tNDI7XHJcbiAgICBjLm0yMyA9IGEubTIxICogYi5tMTMgKyBhLm0yMiAqIGIubTIzICsgYS5tMjMgKiBiLm0zMyArIGEubTI0ICogYi5tNDM7XHJcbiAgICBjLm0yNCA9IGEubTIxICogYi5tMTQgKyBhLm0yMiAqIGIubTI0ICsgYS5tMjMgKiBiLm0zNCArIGEubTI0ICogYi5tNDQ7XHJcblxyXG4gICAgYy5tMzEgPSBhLm0zMSAqIGIubTExICsgYS5tMzIgKiBiLm0yMSArIGEubTMzICogYi5tMzEgKyBhLm0zNCAqIGIubTQxO1xyXG4gICAgYy5tMzIgPSBhLm0zMSAqIGIubTEyICsgYS5tMzIgKiBiLm0yMiArIGEubTMzICogYi5tMzIgKyBhLm0zNCAqIGIubTQyO1xyXG4gICAgYy5tMzMgPSBhLm0zMSAqIGIubTEzICsgYS5tMzIgKiBiLm0yMyArIGEubTMzICogYi5tMzMgKyBhLm0zNCAqIGIubTQzO1xyXG4gICAgYy5tMzQgPSBhLm0zMSAqIGIubTE0ICsgYS5tMzIgKiBiLm0yNCArIGEubTMzICogYi5tMzQgKyBhLm0zNCAqIGIubTQ0O1xyXG5cclxuICAgIGMubTQxID0gYS5tNDEgKiBiLm0xMSArIGEubTQyICogYi5tMjEgKyBhLm00MyAqIGIubTMxICsgYS5tNDQgKiBiLm00MTtcclxuICAgIGMubTQyID0gYS5tNDEgKiBiLm0xMiArIGEubTQyICogYi5tMjIgKyBhLm00MyAqIGIubTMyICsgYS5tNDQgKiBiLm00MjtcclxuICAgIGMubTQzID0gYS5tNDEgKiBiLm0xMyArIGEubTQyICogYi5tMjMgKyBhLm00MyAqIGIubTMzICsgYS5tNDQgKiBiLm00MztcclxuICAgIGMubTQ0ID0gYS5tNDEgKiBiLm0xNCArIGEubTQyICogYi5tMjQgKyBhLm00MyAqIGIubTM0ICsgYS5tNDQgKiBiLm00NDtcclxuXHJcbiAgICByZXR1cm4gYztcclxufTtcclxuXHJcbmZ1bmN0aW9uIHRyYW5zcG9zZShtYXRyaXgpIHtcclxuICAgIHZhciByZXN1bHQgPSBuZXcgbWF0cml4LmNvbnN0cnVjdG9yKCk7XHJcbiAgICB2YXIgcm93cyA9IDQsIGNvbHMgPSA0O1xyXG4gICAgdmFyIGkgPSBjb2xzLCBqO1xyXG4gICAgd2hpbGUgKGkpIHtcclxuICAgICAgICBqID0gcm93cztcclxuICAgICAgICB3aGlsZSAoaikge1xyXG4gICAgICAgICAgICByZXN1bHRbJ20nICsgaSArIGpdID0gbWF0cml4WydtJyArIGogKyBpXTtcclxuICAgICAgICAgICAgai0tO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpLS07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogIElucHV0OiAgbWF0cml4ICAgICAgOyBhIDR4NCBtYXRyaXhcclxuICogIE91dHB1dDogdHJhbnNsYXRpb24gOyBhIDMgY29tcG9uZW50IHZlY3RvclxyXG4gKiAgICAgICAgICBzY2FsZSAgICAgICA7IGEgMyBjb21wb25lbnQgdmVjdG9yXHJcbiAqICAgICAgICAgIHNrZXcgICAgICAgIDsgc2tldyBmYWN0b3JzIFhZLFhaLFlaIHJlcHJlc2VudGVkIGFzIGEgMyBjb21wb25lbnQgdmVjdG9yXHJcbiAqICAgICAgICAgIHBlcnNwZWN0aXZlIDsgYSA0IGNvbXBvbmVudCB2ZWN0b3JcclxuICogICAgICAgICAgcm90YXRlICA7IGEgNCBjb21wb25lbnQgdmVjdG9yXHJcbiAqICBSZXR1cm5zIGZhbHNlIGlmIHRoZSBtYXRyaXggY2Fubm90IGJlIGRlY29tcG9zZWQsIHRydWUgaWYgaXQgY2FuXHJcbiAqL1xyXG5mdW5jdGlvbiBkZWNvbXBvc2UobWF0cml4KSB7XHJcbiAgICB2YXIgcGVyc3BlY3RpdmVNYXRyaXgsIHJpZ2h0SGFuZFNpZGUsIGludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCwgdHJhbnNwb3NlZEludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCxcclxuICAgICAgcGVyc3BlY3RpdmUsIHRyYW5zbGF0ZSwgcm93LCBpLCBsZW4sIHNjYWxlLCBza2V3LCBwZHVtMywgcm90YXRlO1xyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSB0aGUgbWF0cml4LlxyXG4gICAgaWYgKG1hdHJpeC5tMzMgPT09IDApIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gNDsgaSsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPCA0OyBqKyspIHtcclxuICAgICAgICAgICAgbWF0cml4WydtJyArIGkgKyBqXSAvPSBtYXRyaXgubTQ0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBwZXJzcGVjdGl2ZU1hdHJpeCBpcyB1c2VkIHRvIHNvbHZlIGZvciBwZXJzcGVjdGl2ZSwgYnV0IGl0IGFsc28gcHJvdmlkZXNcclxuICAgIC8vIGFuIGVhc3kgd2F5IHRvIHRlc3QgZm9yIHNpbmd1bGFyaXR5IG9mIHRoZSB1cHBlciAzeDMgY29tcG9uZW50LlxyXG4gICAgcGVyc3BlY3RpdmVNYXRyaXggPSBtYXRyaXg7XHJcbiAgICBwZXJzcGVjdGl2ZU1hdHJpeC5tMTQgPSAwO1xyXG4gICAgcGVyc3BlY3RpdmVNYXRyaXgubTI0ID0gMDtcclxuICAgIHBlcnNwZWN0aXZlTWF0cml4Lm0zNCA9IDA7XHJcbiAgICBwZXJzcGVjdGl2ZU1hdHJpeC5tNDQgPSAxO1xyXG5cclxuICAgIGlmIChkZXRlcm1pbmFudDR4NChwZXJzcGVjdGl2ZU1hdHJpeCkgPT09IDApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmlyc3QsIGlzb2xhdGUgcGVyc3BlY3RpdmUuXHJcbiAgICBpZiAobWF0cml4Lm0xNCAhPT0gMCB8fCBtYXRyaXgubTI0ICE9PSAwIHx8IG1hdHJpeC5tMzQgIT09IDApIHtcclxuICAgICAgICAvLyByaWdodEhhbmRTaWRlIGlzIHRoZSByaWdodCBoYW5kIHNpZGUgb2YgdGhlIGVxdWF0aW9uLlxyXG4gICAgICAgIHJpZ2h0SGFuZFNpZGUgPSBuZXcgVmVjdG9yNChtYXRyaXgubTE0LCBtYXRyaXgubTI0LCBtYXRyaXgubTM0LCBtYXRyaXgubTQ0KTtcclxuXHJcbiAgICAgICAgLy8gU29sdmUgdGhlIGVxdWF0aW9uIGJ5IGludmVydGluZyBwZXJzcGVjdGl2ZU1hdHJpeCBhbmQgbXVsdGlwbHlpbmdcclxuICAgICAgICAvLyByaWdodEhhbmRTaWRlIGJ5IHRoZSBpbnZlcnNlLlxyXG4gICAgICAgIGludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCA9IGludmVyc2UocGVyc3BlY3RpdmVNYXRyaXgpO1xyXG4gICAgICAgIHRyYW5zcG9zZWRJbnZlcnNlUGVyc3BlY3RpdmVNYXRyaXggPSB0cmFuc3Bvc2UoaW52ZXJzZVBlcnNwZWN0aXZlTWF0cml4KTtcclxuICAgICAgICBwZXJzcGVjdGl2ZSA9IHJpZ2h0SGFuZFNpZGUubXVsdGlwbHlCeU1hdHJpeCh0cmFuc3Bvc2VkSW52ZXJzZVBlcnNwZWN0aXZlTWF0cml4KTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIE5vIHBlcnNwZWN0aXZlLlxyXG4gICAgICAgIHBlcnNwZWN0aXZlID0gbmV3IFZlY3RvcjQoMCwgMCwgMCwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTmV4dCB0YWtlIGNhcmUgb2YgdHJhbnNsYXRpb25cclxuICAgIHRyYW5zbGF0ZSA9IG5ldyBWZWN0b3I0KG1hdHJpeC5tNDEsIG1hdHJpeC5tNDIsIG1hdHJpeC5tNDMpO1xyXG5cclxuICAgIC8vIE5vdyBnZXQgc2NhbGUgYW5kIHNoZWFyLiAncm93JyBpcyBhIDMgZWxlbWVudCBhcnJheSBvZiAzIGNvbXBvbmVudCB2ZWN0b3JzXHJcbiAgICByb3cgPSBbIG5ldyBWZWN0b3I0KCksIG5ldyBWZWN0b3I0KCksIG5ldyBWZWN0b3I0KCkgXTtcclxuICAgIGZvciAoaSA9IDEsIGxlbiA9IHJvdy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgIHJvd1tpIC0gMV0ueCA9IG1hdHJpeFsnbScgKyBpICsgJzEnXTtcclxuICAgICAgICByb3dbaSAtIDFdLnkgPSBtYXRyaXhbJ20nICsgaSArICcyJ107XHJcbiAgICAgICAgcm93W2kgLSAxXS56ID0gbWF0cml4WydtJyArIGkgKyAnMyddO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbXB1dGUgWCBzY2FsZSBmYWN0b3IgYW5kIG5vcm1hbGl6ZSBmaXJzdCByb3cuXHJcbiAgICBzY2FsZSA9IG5ldyBWZWN0b3I0KCk7XHJcbiAgICBza2V3ID0gbmV3IFZlY3RvcjQoKTtcclxuXHJcbiAgICBzY2FsZS54ID0gcm93WzBdLmxlbmd0aCgpO1xyXG4gICAgcm93WzBdID0gcm93WzBdLm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgIC8vIENvbXB1dGUgWFkgc2hlYXIgZmFjdG9yIGFuZCBtYWtlIDJuZCByb3cgb3J0aG9nb25hbCB0byAxc3QuXHJcbiAgICBza2V3LnggPSByb3dbMF0uZG90KHJvd1sxXSk7XHJcbiAgICByb3dbMV0gPSByb3dbMV0uY29tYmluZShyb3dbMF0sIDEuMCwgLXNrZXcueCk7XHJcblxyXG4gICAgLy8gTm93LCBjb21wdXRlIFkgc2NhbGUgYW5kIG5vcm1hbGl6ZSAybmQgcm93LlxyXG4gICAgc2NhbGUueSA9IHJvd1sxXS5sZW5ndGgoKTtcclxuICAgIHJvd1sxXSA9IHJvd1sxXS5ub3JtYWxpemUoKTtcclxuICAgIHNrZXcueCAvPSBzY2FsZS55O1xyXG5cclxuICAgIC8vIENvbXB1dGUgWFogYW5kIFlaIHNoZWFycywgb3J0aG9nb25hbGl6ZSAzcmQgcm93XHJcbiAgICBza2V3LnkgPSByb3dbMF0uZG90KHJvd1syXSk7XHJcbiAgICByb3dbMl0gPSByb3dbMl0uY29tYmluZShyb3dbMF0sIDEuMCwgLXNrZXcueSk7XHJcbiAgICBza2V3LnogPSByb3dbMV0uZG90KHJvd1syXSk7XHJcbiAgICByb3dbMl0gPSByb3dbMl0uY29tYmluZShyb3dbMV0sIDEuMCwgLXNrZXcueik7XHJcblxyXG4gICAgLy8gTmV4dCwgZ2V0IFogc2NhbGUgYW5kIG5vcm1hbGl6ZSAzcmQgcm93LlxyXG4gICAgc2NhbGUueiA9IHJvd1syXS5sZW5ndGgoKTtcclxuICAgIHJvd1syXSA9IHJvd1syXS5ub3JtYWxpemUoKTtcclxuICAgIHNrZXcueSA9IChza2V3LnkgLyBzY2FsZS56KSB8fCAwO1xyXG4gICAgc2tldy56ID0gKHNrZXcueiAvIHNjYWxlLnopIHx8IDA7XHJcblxyXG4gICAgLy8gQXQgdGhpcyBwb2ludCwgdGhlIG1hdHJpeCAoaW4gcm93cykgaXMgb3J0aG9ub3JtYWwuXHJcbiAgICAvLyBDaGVjayBmb3IgYSBjb29yZGluYXRlIHN5c3RlbSBmbGlwLiAgSWYgdGhlIGRldGVybWluYW50XHJcbiAgICAvLyBpcyAtMSwgdGhlbiBuZWdhdGUgdGhlIG1hdHJpeCBhbmQgdGhlIHNjYWxpbmcgZmFjdG9ycy5cclxuICAgIHBkdW0zID0gcm93WzFdLmNyb3NzKHJvd1syXSk7XHJcbiAgICBpZiAocm93WzBdLmRvdChwZHVtMykgPCAwKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcclxuICAgICAgICAgICAgc2NhbGUueCAqPSAtMTtcclxuICAgICAgICAgICAgcm93W2ldLnggKj0gLTE7XHJcbiAgICAgICAgICAgIHJvd1tpXS55ICo9IC0xO1xyXG4gICAgICAgICAgICByb3dbaV0ueiAqPSAtMTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm93LCBnZXQgdGhlIHJvdGF0aW9ucyBvdXRcclxuICAgIC8vIEZST00gVzNDXHJcbiAgICByb3RhdGUgPSBuZXcgVmVjdG9yNCgpO1xyXG4gICAgcm90YXRlLnggPSAwLjUgKiBNYXRoLnNxcnQoTWF0aC5tYXgoMSArIHJvd1swXS54IC0gcm93WzFdLnkgLSByb3dbMl0ueiwgMCkpO1xyXG4gICAgcm90YXRlLnkgPSAwLjUgKiBNYXRoLnNxcnQoTWF0aC5tYXgoMSAtIHJvd1swXS54ICsgcm93WzFdLnkgLSByb3dbMl0ueiwgMCkpO1xyXG4gICAgcm90YXRlLnogPSAwLjUgKiBNYXRoLnNxcnQoTWF0aC5tYXgoMSAtIHJvd1swXS54IC0gcm93WzFdLnkgKyByb3dbMl0ueiwgMCkpO1xyXG4gICAgcm90YXRlLncgPSAwLjUgKiBNYXRoLnNxcnQoTWF0aC5tYXgoMSArIHJvd1swXS54ICsgcm93WzFdLnkgKyByb3dbMl0ueiwgMCkpO1xyXG5cclxuICAgIC8vIGlmIChyb3dbMl0ueSA+IHJvd1sxXS56KSByb3RhdGVbMF0gPSAtcm90YXRlWzBdO1xyXG4gICAgLy8gaWYgKHJvd1swXS56ID4gcm93WzJdLngpIHJvdGF0ZVsxXSA9IC1yb3RhdGVbMV07XHJcbiAgICAvLyBpZiAocm93WzFdLnggPiByb3dbMF0ueSkgcm90YXRlWzJdID0gLXJvdGF0ZVsyXTtcclxuXHJcbiAgICAvLyBGUk9NIE1PUkYuSlNcclxuICAgIHJvdGF0ZS55ID0gTWF0aC5hc2luKC1yb3dbMF0ueik7XHJcbiAgICBpZiAoTWF0aC5jb3Mocm90YXRlLnkpICE9PSAwKSB7XHJcbiAgICAgICAgcm90YXRlLnggPSBNYXRoLmF0YW4yKHJvd1sxXS56LCByb3dbMl0ueik7XHJcbiAgICAgICAgcm90YXRlLnogPSBNYXRoLmF0YW4yKHJvd1swXS55LCByb3dbMF0ueCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJvdGF0ZS54ID0gTWF0aC5hdGFuMigtcm93WzJdLngsIHJvd1sxXS55KTtcclxuICAgICAgICByb3RhdGUueiA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRlJPTSBodHRwOi8vYmxvZy5id2hpdGluZy5jby51ay8/cD0yNlxyXG4gICAgLy8gc2NhbGUueDIgPSBNYXRoLnNxcnQobWF0cml4Lm0xMSptYXRyaXgubTExICsgbWF0cml4Lm0yMSptYXRyaXgubTIxICsgbWF0cml4Lm0zMSptYXRyaXgubTMxKTtcclxuICAgIC8vIHNjYWxlLnkyID0gTWF0aC5zcXJ0KG1hdHJpeC5tMTIqbWF0cml4Lm0xMiArIG1hdHJpeC5tMjIqbWF0cml4Lm0yMiArIG1hdHJpeC5tMzIqbWF0cml4Lm0zMik7XHJcbiAgICAvLyBzY2FsZS56MiA9IE1hdGguc3FydChtYXRyaXgubTEzKm1hdHJpeC5tMTMgKyBtYXRyaXgubTIzKm1hdHJpeC5tMjMgKyBtYXRyaXgubTMzKm1hdHJpeC5tMzMpO1xyXG5cclxuICAgIC8vIHJvdGF0ZS54MiA9IE1hdGguYXRhbjIobWF0cml4Lm0yMy9zY2FsZS56MiwgbWF0cml4Lm0zMy9zY2FsZS56Mik7XHJcbiAgICAvLyByb3RhdGUueTIgPSAtTWF0aC5hc2luKG1hdHJpeC5tMTMvc2NhbGUuejIpO1xyXG4gICAgLy8gcm90YXRlLnoyID0gTWF0aC5hdGFuMihtYXRyaXgubTEyL3NjYWxlLnkyLCBtYXRyaXgubTExL3NjYWxlLngyKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHBlcnNwZWN0aXZlLFxyXG4gICAgICAgIHRyYW5zbGF0ZSxcclxuICAgICAgICBza2V3LFxyXG4gICAgICAgIHNjYWxlLFxyXG4gICAgICAgIHJvdGF0ZVxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gICAgZGVjb21wb3NlLFxyXG4gICAgaXNBZmZpbmUsXHJcbiAgICBpbnZlcnNlLFxyXG4gICAgbXVsdGlwbHlcclxufTsiLCJjb25zdCB2YWx1ZVRvT2JqZWN0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGNvbnN0IHVuaXRzID0gLyhbXFwtXFwrXT9bMC05XStbXFwuMC05XSopKGRlZ3xyYWR8Z3JhZHxweHwlKSovO1xyXG4gICAgY29uc3QgcGFydHMgPSB2YWx1ZS5tYXRjaCh1bml0cykgfHwgW107XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2YWx1ZTogcGFyc2VGbG9hdChwYXJ0c1sxXSksXHJcbiAgICAgICAgdW5pdHM6IHBhcnRzWzJdLFxyXG4gICAgICAgIHVucGFyc2VkOiB2YWx1ZVxyXG4gICAgfTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHN0YXRlbWVudFRvT2JqZWN0KHN0YXRlbWVudCwgc2tpcFZhbHVlcykge1xyXG4gICAgY29uc3QgbmFtZUFuZEFyZ3MgICAgPSAvKFxcdyspXFwoKFteXFwpXSspXFwpL2k7XHJcbiAgICBjb25zdCBzdGF0ZW1lbnRQYXJ0cyA9IHN0YXRlbWVudC50b1N0cmluZygpLm1hdGNoKG5hbWVBbmRBcmdzKS5zbGljZSgxKTtcclxuICAgIGNvbnN0IGZ1bmN0aW9uTmFtZSAgID0gc3RhdGVtZW50UGFydHNbMF07XHJcbiAgICBjb25zdCBzdHJpbmdWYWx1ZXMgICA9IHN0YXRlbWVudFBhcnRzWzFdLnNwbGl0KC8sID8vKTtcclxuICAgIGNvbnN0IHBhcnNlZFZhbHVlcyAgID0gIXNraXBWYWx1ZXMgJiYgc3RyaW5nVmFsdWVzLm1hcCh2YWx1ZVRvT2JqZWN0KTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGtleTogZnVuY3Rpb25OYW1lLFxyXG4gICAgICAgIHZhbHVlOiBwYXJzZWRWYWx1ZXMgfHwgc3RyaW5nVmFsdWVzLFxyXG4gICAgICAgIHVucGFyc2VkOiBzdGF0ZW1lbnRcclxuICAgIH07XHJcbn1cclxuIiwiLyoqXHJcbiAqIEdldCB0aGUgbGVuZ3RoIG9mIHRoZSB2ZWN0b3JcclxuICogQHJldHVybnMge2Zsb2F0fVxyXG4gKi9cclxuZnVuY3Rpb24gbGVuZ3RoKHZlY3Rvcikge1xyXG4gICAgcmV0dXJuIE1hdGguc3FydCh2ZWN0b3IueCAqIHZlY3Rvci54ICsgdmVjdG9yLnkgKiB2ZWN0b3IueSArIHZlY3Rvci56ICogdmVjdG9yLnopO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGEgbm9ybWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXHJcbiAqIEByZXR1cm5zIHtWZWN0b3I0fVxyXG4gKi9cclxuZnVuY3Rpb24gbm9ybWFsaXplKHZlY3Rvcikge1xyXG4gICAgdmFyIGxlbiA9IGxlbmd0aCh2ZWN0b3IpLFxyXG4gICAgICAgIHYgPSBuZXcgdmVjdG9yLmNvbnN0cnVjdG9yKHZlY3Rvci54IC8gbGVuLCB2ZWN0b3IueSAvIGxlbiwgdmVjdG9yLnogLyBsZW4pO1xyXG5cclxuICAgIHJldHVybiB2O1xyXG59XHJcblxyXG4vKipcclxuICogVmVjdG9yIERvdC1Qcm9kdWN0XHJcbiAqIEBwYXJhbSB7VmVjdG9yNH0gdiBUaGUgc2Vjb25kIHZlY3RvciB0byBhcHBseSB0aGUgcHJvZHVjdCB0b1xyXG4gKiBAcmV0dXJucyB7ZmxvYXR9IFRoZSBEb3QtUHJvZHVjdCBvZiBhIGFuZCBiLlxyXG4gKi9cclxuZnVuY3Rpb24gZG90KGEsIGIpIHtcclxuICAgIHJldHVybiBhLnggKiBiLnggKyBhLnkgKiBiLnkgKyBhLnogKiBiLnogKyBhLncgKiBiLnc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBWZWN0b3IgQ3Jvc3MtUHJvZHVjdFxyXG4gKiBAcGFyYW0ge1ZlY3RvcjR9IHYgVGhlIHNlY29uZCB2ZWN0b3IgdG8gYXBwbHkgdGhlIHByb2R1Y3QgdG9cclxuICogQHJldHVybnMge1ZlY3RvcjR9IFRoZSBDcm9zcy1Qcm9kdWN0IG9mIGEgYW5kIGIuXHJcbiAqL1xyXG5mdW5jdGlvbiBjcm9zcyhhLCBiKSB7XHJcbiAgICByZXR1cm4gbmV3IGEuY29uc3RydWN0b3IoXHJcbiAgICAgICAgKGEueSAqIGIueikgLSAoYS56ICogYi55KSxcclxuICAgICAgICAoYS56ICogYi54KSAtIChhLnggKiBiLnopLFxyXG4gICAgICAgIChhLnggKiBiLnkpIC0gKGEueSAqIGIueClcclxuICAgICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgZnVuY3Rpb24gcmVxdWlyZWQgZm9yIG1hdHJpeCBkZWNvbXBvc2l0aW9uXHJcbiAqIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiBwc2V1ZG8gY29kZSBhdmFpbGFibGUgZnJvbSBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLTJkLXRyYW5zZm9ybXMvI21hdHJpeC1kZWNvbXBvc2l0aW9uXHJcbiAqIEBwYXJhbSB7VmVjdG9yNH0gYVBvaW50IEEgM0QgcG9pbnRcclxuICogQHBhcmFtIHtmbG9hdH0gYXNjbFxyXG4gKiBAcGFyYW0ge2Zsb2F0fSBic2NsXHJcbiAqIEByZXR1cm5zIHtWZWN0b3I0fVxyXG4gKi9cclxuZnVuY3Rpb24gY29tYmluZShhUG9pbnQsIGJQb2ludCwgYXNjbCwgYnNjbCkge1xyXG4gICAgcmV0dXJuIG5ldyBhUG9pbnQuY29uc3RydWN0b3IoXHJcbiAgICAgICAgKGFzY2wgKiBhUG9pbnQueCkgKyAoYnNjbCAqIGJQb2ludC54KSxcclxuICAgICAgICAoYXNjbCAqIGFQb2ludC55KSArIChic2NsICogYlBvaW50LnkpLFxyXG4gICAgICAgIChhc2NsICogYVBvaW50LnopICsgKGJzY2wgKiBiUG9pbnQueilcclxuICAgICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG11bHRpcGx5QnlNYXRyaXgodmVjdG9yLCBtYXRyaXgpIHtcclxuICAgIHJldHVybiBuZXcgdmVjdG9yLmNvbnN0cnVjdG9yKFxyXG4gICAgICAgIChtYXRyaXgubTExICogdmVjdG9yLngpICsgKG1hdHJpeC5tMTIgKiB2ZWN0b3IueSkgKyAobWF0cml4Lm0xMyAqIHZlY3Rvci56KSxcclxuICAgICAgICAobWF0cml4Lm0yMSAqIHZlY3Rvci54KSArIChtYXRyaXgubTIyICogdmVjdG9yLnkpICsgKG1hdHJpeC5tMjMgKiB2ZWN0b3IueiksXHJcbiAgICAgICAgKG1hdHJpeC5tMzEgKiB2ZWN0b3IueCkgKyAobWF0cml4Lm0zMiAqIHZlY3Rvci55KSArIChtYXRyaXgubTMzICogdmVjdG9yLnopXHJcbiAgICApO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBsZW5ndGgsXHJcbiAgICBub3JtYWxpemUsXHJcbiAgICBkb3QsXHJcbiAgICBjcm9zcyxcclxuICAgIGNvbWJpbmUsXHJcbiAgICBtdWx0aXBseUJ5TWF0cml4XHJcbn07IiwiY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblxyXG5jb25zdCBzZWxlY3RQcm9wID0gZnVuY3Rpb24oYXJyKSB7XHJcbiAgICB2YXIgaWR4ID0gYXJyLmxlbmd0aDtcclxuICAgIHdoaWxlIChpZHgtLSkge1xyXG4gICAgICAgIGlmIChkaXYuc3R5bGVbYXJyW2lkeF1dICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFycltpZHhdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHNlbGVjdFByb3AoW1xyXG4gICAgJ3RyYW5zZm9ybScsXHJcbiAgICAnbXNUcmFuc2Zvcm0nLFxyXG4gICAgJ29UcmFuc2Zvcm0nLFxyXG4gICAgJ21velRyYW5zZm9ybScsXHJcbiAgICAnd2Via2l0VHJhbnNmb3JtJ1xyXG5dKSB8fCAnJzsiLCJjb25zdCBFTkRfVkFMVUUgPSAxMDA7XG5jb25zdCBUT0xFUkFOQ0UgPSAwLjAxO1xuY29uc3QgU1BFRUQgICAgID0gMSAvIDYwO1xuXG5jb25zdCBjYWxjQWNjZWxlcmF0aW9uID0gZnVuY3Rpb24odGVuc2lvbiwgeCwgZnJpY3Rpb24sIHZlbG9jaXR5KSB7XG4gICAgcmV0dXJuIC10ZW5zaW9uICogeCAtIGZyaWN0aW9uICogdmVsb2NpdHk7XG59O1xuXG5jb25zdCBjYWxjU3RhdGUgPSBmdW5jdGlvbihzdGF0ZSwgc3BlZWQpIHtcbiAgICBjb25zdCBkdCA9IHNwZWVkICogMC41O1xuICAgIGNvbnN0IHggICAgICAgID0gc3RhdGUueDtcbiAgICBjb25zdCB2ZWxvY2l0eSA9IHN0YXRlLnZlbG9jaXR5O1xuICAgIGNvbnN0IHRlbnNpb24gID0gc3RhdGUudGVuc2lvbjtcbiAgICBjb25zdCBmcmljdGlvbiA9IHN0YXRlLmZyaWN0aW9uO1xuXG4gICAgY29uc3QgYUR4ID0gdmVsb2NpdHk7XG4gICAgY29uc3QgYUR2ID0gY2FsY0FjY2VsZXJhdGlvbih0ZW5zaW9uLCB4LCBmcmljdGlvbiwgdmVsb2NpdHkpO1xuXG4gICAgY29uc3QgYkR4ID0gdmVsb2NpdHkgKyBhRHYgKiBkdDtcbiAgICBjb25zdCBiRW5kWCA9IHggKyBhRHggKiBkdDtcbiAgICBjb25zdCBiRHYgPSBjYWxjQWNjZWxlcmF0aW9uKHRlbnNpb24sIGJFbmRYLCBmcmljdGlvbiwgYkR4KTtcblxuICAgIGNvbnN0IGNEeCA9IHZlbG9jaXR5ICsgYkR2ICogZHQ7XG4gICAgY29uc3QgY0VuZFggPSB4ICsgYkR4ICogZHQ7XG4gICAgY29uc3QgY0R2ID0gY2FsY0FjY2VsZXJhdGlvbih0ZW5zaW9uLCBjRW5kWCwgZnJpY3Rpb24sIGNEeCk7XG5cbiAgICBjb25zdCBkRHggPSB2ZWxvY2l0eSArIGNEdiAqIGR0O1xuICAgIGNvbnN0IGRFbmRYID0geCArIGNEeCAqIGR0O1xuICAgIGNvbnN0IGREdiA9IGNhbGNBY2NlbGVyYXRpb24odGVuc2lvbiwgZEVuZFgsIGZyaWN0aW9uLCBkRHgpO1xuXG4gICAgY29uc3QgZHhkdCA9ICgxIC8gNikgKiAoYUR4ICsgMiAqIChiRHggKyBjRHgpICsgZER4KTtcbiAgICBjb25zdCBkdmR0ID0gKDEgLyA2KSAqIChhRHYgKyAyICogKGJEdiArIGNEdikgKyBkRHYpO1xuXG4gICAgc3RhdGUueCAgICAgICAgPSB4ICsgZHhkdCAqIHNwZWVkO1xuICAgIHN0YXRlLnZlbG9jaXR5ID0gYUR4ICsgZHZkdCAqIHNwZWVkO1xuXG4gICAgcmV0dXJuIHN0YXRlO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc3ByaW5nKCkge1xuICAgIGxldCB2ZWxvY2l0eSAgICAgICA9IDA7XG4gICAgbGV0IHRlbnNpb24gICAgICAgID0gODA7XG4gICAgbGV0IGZyaWN0aW9uICAgICAgID0gODtcblxuICAgIGxldCByZXBlYXQgICAgICAgICAgID0gMDtcbiAgICBsZXQgb3JpZ2luYWxWZWxvY2l0eSA9IDA7XG4gICAgbGV0IG9yaWdpbmFsVGVuc2lvbiAgPSA4MDtcbiAgICBsZXQgb3JpZ2luYWxGcmljdGlvbiA9IDg7XG4gICAgbGV0IHZhbHVlICAgICAgICAgICAgPSAwO1xuICAgIGxldCBpc1BhdXNlZCAgICAgICAgID0gZmFsc2U7XG5cbiAgICAvLyBTdG9yZXMgeCBhbmQgdmVsb2NpdHkgdG8gZG9cbiAgICAvLyBjYWxjdWxhdGlvbnMgYWdhaW5zdCBzbyB0aGF0XG4gICAgLy8gd2UgY2FuIGhhdmUgbXVsdGlwbGUgcmV0dXJuXG4gICAgLy8gdmFsdWVzIGZyb20gY2FsY1N0YXRlXG4gICAgY29uc3Qgc3RhdGUgPSB7fTtcblxuICAgIGxldCB1cGRhdGVDYWxsYmFjaztcbiAgICBsZXQgY29tcGxldGVDYWxsYmFjaztcbiAgICBsZXQgcmV2ZXJzZUNhbGxiYWNrO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVnaXN0ZXJDYWxsYmFja3Mob2JqKSB7XG4gICAgICAgICAgICB1cGRhdGVDYWxsYmFjayAgID0gb2JqLm9uVXBkYXRlO1xuICAgICAgICAgICAgY29tcGxldGVDYWxsYmFjayA9IG9iai5vbkNvbXBsZXRlO1xuICAgICAgICAgICAgcmV2ZXJzZUNhbGxiYWNrICA9IG9iai5vblJldmVyc2U7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICByZXBlYXQodGltZXMpIHtcbiAgICAgICAgICAgIHJlcGVhdCA9IHRpbWVzO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0KHQsIGYsIHYpIHtcbiAgICAgICAgICAgIGlmICh2ICE9PSB1bmRlZmluZWQpIHsgdmVsb2NpdHkgPSBvcmlnaW5hbFZlbG9jaXR5ID0gdjsgfVxuICAgICAgICAgICAgaWYgKHQgIT09IHVuZGVmaW5lZCkgeyB0ZW5zaW9uID0gb3JpZ2luYWxUZW5zaW9uID0gdDsgIH1cbiAgICAgICAgICAgIGlmIChmICE9PSB1bmRlZmluZWQpIHsgZnJpY3Rpb24gPSBvcmlnaW5hbEZyaWN0aW9uID0gZjsgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdGVuc2lvbih0KSB7XG4gICAgICAgICAgICB0ZW5zaW9uID0gb3JpZ2luYWxUZW5zaW9uID0gdDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZyaWN0aW9uKGYpIHtcbiAgICAgICAgICAgIGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbiA9IGY7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICB2ZWxvY2l0eSh2KSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IG9yaWdpbmFsVmVsb2NpdHkgPSB2O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGF1c2UoKSB7XG4gICAgICAgICAgICBpc1BhdXNlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICByZXN1bWUoKSB7XG4gICAgICAgICAgICBpc1BhdXNlZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RlcCgpIHtcbiAgICAgICAgICAgIGlmIChpc1BhdXNlZCkgeyByZXR1cm4gdHJ1ZTsgfSAvLyBzaG91bGQgc2V0IGFnYWluP1xuXG4gICAgICAgICAgICBjb25zdCBzdGF0ZUJlZm9yZSA9IHN0YXRlO1xuXG4gICAgICAgICAgICBzdGF0ZUJlZm9yZS54ICAgICAgICA9IHZhbHVlIC0gRU5EX1ZBTFVFO1xuICAgICAgICAgICAgc3RhdGVCZWZvcmUudmVsb2NpdHkgPSB2ZWxvY2l0eTtcbiAgICAgICAgICAgIHN0YXRlQmVmb3JlLnRlbnNpb24gID0gdGVuc2lvbjtcbiAgICAgICAgICAgIHN0YXRlQmVmb3JlLmZyaWN0aW9uID0gZnJpY3Rpb247XG5cbiAgICAgICAgICAgIGNvbnN0IHN0YXRlQWZ0ZXIgICAgICAgPSBjYWxjU3RhdGUoc3RhdGVCZWZvcmUsIFNQRUVEKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbmFsVmVsb2NpdHkgICAgPSBzdGF0ZUFmdGVyLnZlbG9jaXR5O1xuICAgICAgICAgICAgY29uc3QgbmV0RmxvYXQgICAgICAgICA9IHN0YXRlQWZ0ZXIueDtcbiAgICAgICAgICAgIGNvbnN0IG5ldDFEVmVsb2NpdHkgICAgPSBzdGF0ZUFmdGVyLnZlbG9jaXR5O1xuICAgICAgICAgICAgY29uc3QgbmV0VmFsdWVJc0xvdyAgICA9IE1hdGguYWJzKG5ldEZsb2F0KSA8IFRPTEVSQU5DRTtcbiAgICAgICAgICAgIGNvbnN0IG5ldFZlbG9jaXR5SXNMb3cgPSBNYXRoLmFicyhuZXQxRFZlbG9jaXR5KSA8IFRPTEVSQU5DRTtcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZFNwcmluZ1N0b3AgPSBuZXRWYWx1ZUlzTG93IHx8IG5ldFZlbG9jaXR5SXNMb3c7XG5cbiAgICAgICAgICAgIHZhbHVlID0gRU5EX1ZBTFVFICsgc3RhdGVBZnRlci54O1xuXG4gICAgICAgICAgICBpZiAoc2hvdWxkU3ByaW5nU3RvcCkge1xuXG4gICAgICAgICAgICAgICAgdmVsb2NpdHkgPSAwO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gRU5EX1ZBTFVFO1xuXG4gICAgICAgICAgICAgICAgdXBkYXRlQ2FsbGJhY2sodmFsdWUgLyAxMDApO1xuXG4gICAgICAgICAgICAgICAgLy8gU2hvdWxkIHdlIHJlcGVhdD9cbiAgICAgICAgICAgICAgICBpZiAocmVwZWF0ID4gMCkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIERlY3JlbWVudCB0aGUgcmVwZWF0IGNvdW50ZXIgKGlmIGZpbml0ZSxcbiAgICAgICAgICAgICAgICAgICAgLy8gd2UgbWF5IGJlIGluIGFuIGluZmluaXRlIGxvb3ApXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0Zpbml0ZShyZXBlYXQpKSB7IHJlcGVhdC0tOyB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZUNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIHZlbG9jaXR5ID0gb3JpZ2luYWxWZWxvY2l0eTtcbiAgICAgICAgICAgICAgICAgICAgdGVuc2lvbiAgPSBvcmlnaW5hbFRlbnNpb247XG4gICAgICAgICAgICAgICAgICAgIGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAwO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBzaG91bGQgc2V0IGFnYWluP1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgd2UncmUgZG9uZSByZXBlYXRpbmdcbiAgICAgICAgICAgICAgICBjb21wbGV0ZUNhbGxiYWNrKCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIHNob3VsZCBzZXQgYWdhaW4/XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZlbG9jaXR5ID0gZmluYWxWZWxvY2l0eTtcbiAgICAgICAgICAgIHVwZGF0ZUNhbGxiYWNrKHZhbHVlIC8gMTAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBzaG91bGQgc2V0IGFnYWluP1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0b3AoKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IG9yaWdpbmFsVmVsb2NpdHk7XG4gICAgICAgICAgICB0ZW5zaW9uICA9IG9yaWdpbmFsVGVuc2lvbjtcbiAgICAgICAgICAgIGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbjtcbiAgICAgICAgICAgIHZhbHVlID0gMDtcbiAgICAgICAgfVxuICAgIH07XG59IiwiaW1wb3J0IE1hdHJpeCBmcm9tICcuL21hdHJpeCc7XHJcbmltcG9ydCB0cmFuc2Zvcm1Qcm9wIGZyb20gJy4vcHJvcCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihvYmosIGVsZW1lbnQpIHtcclxuICAgIGNvbnN0IG1hdHJpeCA9IChuZXcgTWF0cml4KCkpLmNvbXBvc2Uob2JqKTtcclxuICAgIGVsZW1lbnQuc3R5bGVbdHJhbnNmb3JtUHJvcF0gPSBtYXRyaXgudG9TdHJpbmcoKTtcclxufSIsImltcG9ydCBNYXRyaXggZnJvbSAnLi4vbWF0cml4JztcclxuaW1wb3J0IHRyYW5zZm9ybVByb3AgZnJvbSAnLi4vcHJvcCc7XHJcblxyXG5jb25zdCBnZXRDb21wdXRlZFN0eWxlID0gZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgcmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWxlbSk7XHJcbn07XHJcblxyXG5jb25zdCBkZWNvbXBvc2UgPSBmdW5jdGlvbihtYXRyaXgpIHtcclxuICAgIGNvbnN0IGNvbXBvc2l0aW9uID0gbWF0cml4LmRlY29tcG9zZSgpO1xyXG4gICAgY29uc3QgeyByb3RhdGUsIHNjYWxlLCBza2V3LCB0cmFuc2xhdGUgfSA9IGNvbXBvc2l0aW9uO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgeDogdHJhbnNsYXRlLngsXHJcbiAgICAgICAgeTogdHJhbnNsYXRlLnksXHJcbiAgICAgICAgejogdHJhbnNsYXRlLnosXHJcblxyXG4gICAgICAgIHNjYWxlWDogc2NhbGUueCxcclxuICAgICAgICBzY2FsZVk6IHNjYWxlLnksXHJcbiAgICAgICAgc2NhbGVaOiBzY2FsZS56LFxyXG5cclxuICAgICAgICBza2V3WDogc2tldy54LFxyXG4gICAgICAgIHNrZXdZOiBza2V3LnksXHJcblxyXG4gICAgICAgIHJvdGF0ZVg6IHJvdGF0ZS54LFxyXG4gICAgICAgIHJvdGF0ZVk6IHJvdGF0ZS55LFxyXG4gICAgICAgIHJvdGF0ZVo6IHJvdGF0ZS56XHJcbiAgICB9O1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gICAgc3R5bGUoZWxlbSkge1xyXG4gICAgICAgIGNvbnN0IGNvbXB1dGVkU3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcclxuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBjb21wdXRlZFN0eWxlc1t0cmFuc2Zvcm1Qcm9wXTtcclxuICAgICAgICBpZiAoIXRyYW5zZm9ybSB8fCB0cmFuc2Zvcm0gPT09ICdub25lJykgeyByZXR1cm4gZGVjb21wb3NlKG5ldyBNYXRyaXgoKSk7IH1cclxuXHJcbiAgICAgICAgY29uc3QgbWF0cml4ID0gbmV3IE1hdHJpeCh0cmFuc2Zvcm0pO1xyXG4gICAgICAgIHJldHVybiBkZWNvbXBvc2UobWF0cml4KTtcclxuICAgIH0sXHJcblxyXG4gICAgb2JqKG9iaikge1xyXG4gICAgICAgIGNvbnN0IG1hdHJpeCA9IG5ldyBNYXRyaXgoKTtcclxuICAgICAgICBjb25zdCBjb21wb3NpdGlvbiA9IG1hdHJpeC5jb21wb3NlKG9iaik7XHJcbiAgICAgICAgcmV0dXJuIGRlY29tcG9zZShjb21wb3NpdGlvbik7XHJcbiAgICB9XHJcbn07IiwiLypcclxuICAgIHZhciBNQVRSSVggPSB7XHJcbiAgICAgICAgeDogMCxcclxuICAgICAgICB5OiAwLFxyXG4gICAgICAgIHo6IDAsXHJcbiAgICAgICAgc2NhbGVYOiAxLFxyXG4gICAgICAgIHNjYWxlWTogMSxcclxuICAgICAgICBzY2FsZVo6IDEsXHJcbiAgICAgICAgcm90YXRpb25YOiAwLFxyXG4gICAgICAgIHJvdGF0aW9uWTogMCxcclxuICAgICAgICByb3RhdGlvblo6IDBcclxuICAgIH07XHJcbiovXHJcblxyXG5jb25zdCBleHBhbmQgPSBmdW5jdGlvbihvYmopIHtcclxuICAgIGlmIChvYmouc2NhbGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIG9iai5zY2FsZVggPSBvYmouc2NhbGU7XHJcbiAgICAgICAgb2JqLnNjYWxlWSA9IG9iai5zY2FsZTtcclxuICAgICAgICBkZWxldGUgb2JqLnNjYWxlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvYmoucm90YXRlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBvYmoucm90YXRlWiA9IG9iai5yb3RhdGU7XHJcbiAgICAgICAgZGVsZXRlIG9iai5yb3RhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG9iajtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgaWYgKCFvYmopIHsgcmV0dXJuIG9iajsgfVxyXG4gICAgcmV0dXJuIGV4cGFuZChvYmopO1xyXG59IiwiLy8gVE9ETzogR2V0IHJpZCBvZiBkZWxldGVzXHJcblxyXG5pbXBvcnQgaXNFbGVtZW50IGZyb20gJy4vaXNFbGVtZW50JztcclxuaW1wb3J0IGJhc2VyIGZyb20gJy4vYmFzZXInO1xyXG5pbXBvcnQgZXhwYW5kU2hvcnRoYW5kIGZyb20gJy4vZXhwYW5kU2hvcnRoYW5kJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1hdHJpeChpbml0aWFsKSB7XHJcbiAgICBsZXQgaW5pdCA9IGluaXRpYWw7XHJcblxyXG4gICAgbGV0IGJhc2U7XHJcbiAgICBsZXQgeW95bztcclxuICAgIGxldCBmcm9tO1xyXG4gICAgbGV0IHRvO1xyXG4gICAgbGV0IHJlcGVhdDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHZhbHVlKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYmFzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB5b3lvKGJvb2wpIHtcclxuICAgICAgICAgICAgeW95byA9IGJvb2w7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGZyb20oZikge1xyXG4gICAgICAgICAgICBpbml0ID0gZjtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdG8odCkge1xyXG4gICAgICAgICAgICB0byA9IGV4cGFuZFNob3J0aGFuZCh0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdXBkYXRlKHBlcmMpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgcHJvcGVydHkgaW4gdG8pIHtcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IGZyb21bcHJvcGVydHldIHx8IDA7XHJcbiAgICAgICAgICAgICAgICBsZXQgZW5kID0gdG9bcHJvcGVydHldO1xyXG5cclxuICAgICAgICAgICAgICAgIGJhc2VbcHJvcGVydHldID0gc3RhcnQgKyAoZW5kIC0gc3RhcnQpICogcGVyYztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmV2ZXJzZSgpIHtcclxuICAgICAgICAgICAgdmFyIHRtcDtcclxuXHJcbiAgICAgICAgICAgIC8vIHJlYXNzaWduIHN0YXJ0aW5nIHZhbHVlc1xyXG4gICAgICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eSBpbiByZXBlYXQpIHtcclxuICAgICAgICAgICAgICAgIGlmICh5b3lvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdG1wID0gcmVwZWF0W3Byb3BlcnR5XTtcclxuICAgICAgICAgICAgICAgICAgICByZXBlYXRbcHJvcGVydHldID0gdG9bcHJvcGVydHldO1xyXG4gICAgICAgICAgICAgICAgICAgIHRvW3Byb3BlcnR5XSA9IHRtcDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmcm9tW3Byb3BlcnR5XSA9IHJlcGVhdFtwcm9wZXJ0eV07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHN0YXJ0KCkge1xyXG4gICAgICAgICAgICBpZiAoIXRvKSB7IHJldHVybiB0aGlzOyB9XHJcbiAgICAgICAgICAgIGlmICghYmFzZSkgeyBiYXNlID0gaXNFbGVtZW50KGluaXQpID8gYmFzZXIuc3R5bGUoaW5pdCkgOiBiYXNlci5vYmooZXhwYW5kU2hvcnRoYW5kKGluaXQpKTsgfVxyXG4gICAgICAgICAgICBpZiAoIWZyb20pIHsgZnJvbSA9IHt9OyB9XHJcbiAgICAgICAgICAgIGlmICghcmVwZWF0KSB7IHJlcGVhdCA9IHt9OyB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eSBpbiB0bykge1xyXG4gICAgICAgICAgICAgICAgLy8gb21pdCB1bmNoYW5nZWQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAgICAgaWYgKGJhc2VbcHJvcGVydHldID09PSB1bmRlZmluZWQgfHwgdG9bcHJvcGVydHldID09PSBiYXNlW3Byb3BlcnR5XSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0b1twcm9wZXJ0eV07XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZnJvbVtwcm9wZXJ0eV0gPSBiYXNlW3Byb3BlcnR5XTtcclxuICAgICAgICAgICAgICAgIHJlcGVhdFtwcm9wZXJ0eV0gPSBmcm9tW3Byb3BlcnR5XSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59IiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ob2JqKSB7XHJcbiAgICByZXR1cm4gISEob2JqICYmICtvYmoubm9kZVR5cGUgPT09IG9iai5ub2RlVHlwZSk7XHJcbn1cclxuIl19
