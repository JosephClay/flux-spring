(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.flux = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var loop = require('./loop');
var transformer = require('./transformer');
var s = require('./spring');

module.exports = function animation(obj) {
    var api = {};
    var matrix = transformer(obj);
    var playing = false;
    var startTime = 0;
    var delayTime = 0;
    var events = {};
    var spring = s();

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
        loop.add(spring);
    };

    return Object.assign(api, {
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
            startTime = time || loop.now;
            loop.await(function (time) {
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
            time = time || loop.now;
            spring.pause(time);
            return api;
        },
        resume: function resume(time) {
            time = time || loop.now;
            spring.resume(time);
            return api;
        },
        stop: function stop() {
            if (!playing) {
                return api;
            }
            playing = false;
            loop.remove(spring);
            spring.stop();
            api.trigger('stop');
            return api;
        }
    });
};

},{"./loop":3,"./spring":11,"./transformer":15}],2:[function(require,module,exports){
'use strict';

var loop = require('./loop');
var prop = require('./prop');
var animation = require('./animation');
var transform = require('./transform');
var plugins = {};

module.exports = Object.assign(function (obj) {
    return Object.assign(animation(obj), plugins);
}, {
    prop: prop,
    transform: transform,
    tick: loop.update,
    update: loop.update,
    plugin: function plugin(name, fn) {
        plugins[name] = function () {
            fn.apply(this, arguments);
            return this;
        };
        return this;
    }
});

},{"./animation":1,"./loop":3,"./prop":10,"./transform":12}],3:[function(require,module,exports){
"use strict";

var waiting = [];
var animations = [];

module.exports = {
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

},{}],4:[function(require,module,exports){
'use strict';

var vector = require('./vector');

/**
 * A 4 dimensional vector
 * @constructor
 */
var Vector4 = module.exports = function Vector4(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    this.checkValues();
};

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
        return vector.length(this);
    },

    /**
     * Get a normalised representation of the vector
     * @returns {Vector4}
     */
    normalize: function normalize() {
        return vector.normalize(this);
    },

    /**
     * Vector Dot-Product
     * @param {Vector4} v The second vector to apply the product to
     * @returns {float} The Dot-Product of this and v.
     */
    dot: function dot(v) {
        return vector.dot(this, v);
    },

    /**
     * Vector Cross-Product
     * @param {Vector4} v The second vector to apply the product to
     * @returns {Vector4} The Cross-Product of this and v.
     */
    cross: function cross(v) {
        return vector.cross(this, v);
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
        return vector.combine(this, bPoint, ascl, bscl);
    },
    multiplyByMatrix: function multiplyByMatrix(matrix) {
        return vector.multiplyByMatrix(this, matrix);
    }
};

},{"./vector":9}],5:[function(require,module,exports){
"use strict";

/**
 *  Converts angles in degrees, which are used by the external API, to angles
 *  in radians used in internal calculations.
 *  @param {number} angle - An angle in degrees.
 *  @returns {number} radians
 */

module.exports = function (angle) {
  return angle * Math.PI / 180;
};

},{}],6:[function(require,module,exports){
'use strict';

var deg2rad = require('./deg2rad');
var matrix = require('./matrix');
var transp = require('./transp');

// ASCII char 97 == 'a'
var indexToKey2d = function indexToKey2d(index) {
    return String.fromCharCode(index + 97);
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
var XCSSMatrix = module.exports = function XCSSMatrix(str) {
    this.m11 = this.m22 = this.m33 = this.m44 = 1;
    this.m12 = this.m13 = this.m14 = this.m21 = this.m23 = this.m24 = this.m31 = this.m32 = this.m34 = this.m41 = this.m42 = this.m43 = 0;

    this.setMatrixValue(str);
};

XCSSMatrix.prototype = {
    constructor: XCSSMatrix,

    /**
     *  Multiply one matrix by another
     *  @param {XCSSMatrix} otherMatrix - The matrix to multiply this one by.
     */
    multiply: function multiply(otherMatrix) {
        return matrix.multiply(this, otherMatrix);
    },

    /**
     *  If the matrix is invertible, returns its inverse, otherwise returns null.
     *  @returns {XCSSMatrix|null}
     */
    inverse: function inverse() {
        return matrix.inverse(this);
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

        rx = deg2rad(rx);
        ry = deg2rad(ry);
        rz = deg2rad(rz);

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
        var radians = deg2rad(degrees);
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
        var radians = deg2rad(degrees);
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

        var matrixObject = transp(domstr);
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
        return matrix.decompose(this);
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
        var points = void 0,
            prefix = void 0;

        if (matrix.isAffine(this)) {
            prefix = 'matrix';
            points = points2d;
        } else {
            prefix = 'matrix3d';
            points = points3d;
        }

        return prefix + '(' + points.map(lookupToFixed, this).join(', ') + ')';
    }
};

},{"./deg2rad":5,"./matrix":7,"./transp":8}],7:[function(require,module,exports){
'use strict';

var Vector4 = require('./Vector4');

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
    var inv = void 0;

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
    var perspectiveMatrix = void 0,
        rightHandSide = void 0,
        inversePerspectiveMatrix = void 0,
        transposedInversePerspectiveMatrix = void 0,
        perspective = void 0,
        translate = void 0,
        row = void 0,
        i = void 0,
        len = void 0,
        scale = void 0,
        skew = void 0,
        pdum3 = void 0,
        rotate = void 0;

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
        rightHandSide = new Vector4(matrix.m14, matrix.m24, matrix.m34, matrix.m44);

        // Solve the equation by inverting perspectiveMatrix and multiplying
        // rightHandSide by the inverse.
        inversePerspectiveMatrix = inverse(perspectiveMatrix);
        transposedInversePerspectiveMatrix = transpose(inversePerspectiveMatrix);
        perspective = rightHandSide.multiplyByMatrix(transposedInversePerspectiveMatrix);
    } else {
        // No perspective.
        perspective = new Vector4(0, 0, 0, 1);
    }

    // Next take care of translation
    // If it's a 2D matrix, e and f will be filled
    translate = new Vector4(matrix.e || matrix.m41, matrix.f || matrix.m42, matrix.m43);

    // Now get scale and shear. 'row' is a 3 element array of 3 component vectors
    row = [new Vector4(), new Vector4(), new Vector4()];
    for (i = 1, len = row.length; i < len; i++) {
        row[i - 1].x = matrix['m' + i + '1'];
        row[i - 1].y = matrix['m' + i + '2'];
        row[i - 1].z = matrix['m' + i + '3'];
    }

    // Compute X scale factor and normalize first row.
    scale = new Vector4();
    skew = new Vector4();

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
    rotate = new Vector4();
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

module.exports = {
    decompose: decompose,
    isAffine: isAffine,
    inverse: inverse,
    multiply: multiply
};

},{"./Vector4":4}],8:[function(require,module,exports){
"use strict";

var valueToObject = function valueToObject(value) {
    var units = /([\-\+]?[0-9]+[\.0-9]*)(deg|rad|grad|px|%)*/;
    var parts = value.match(units) || [];

    return {
        value: parseFloat(parts[1]),
        units: parts[2],
        unparsed: value
    };
};

module.exports = function statementToObject(statement, skipValues) {
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
};

},{}],9:[function(require,module,exports){
"use strict";

/**
 * Get the length of the vector
 * @returns {float}
 */

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

module.exports = {
    length: length,
    normalize: normalize,
    dot: dot,
    cross: cross,
    combine: combine,
    multiplyByMatrix: multiplyByMatrix
};

},{}],10:[function(require,module,exports){
'use strict';

var div = document.createElement('div');

var selectProp = function selectProp(arr) {
    var idx = arr.length;
    while (idx--) {
        if (div.style[arr[idx]] !== undefined) {
            return arr[idx];
        }
    }
};

module.exports = selectProp(['transform', 'msTransform', 'oTransform', 'mozTransform', 'webkitTransform']) || '';

},{}],11:[function(require,module,exports){
"use strict";

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

module.exports = function spring() {
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

    var updateCallback = void 0;
    var completeCallback = void 0;
    var reverseCallback = void 0;

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
};

},{}],12:[function(require,module,exports){
'use strict';

var Matrix = require('./matrix');
var transformProp = require('./prop');

module.exports = function (obj, element) {
    var matrix = new Matrix().compose(obj);
    element.style[transformProp] = matrix.toString();
};

},{"./matrix":6,"./prop":10}],13:[function(require,module,exports){
'use strict';

var Matrix = require('../matrix');
var transformProp = require('../prop');

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

module.exports = {
    style: function style(elem) {
        var computedStyles = getComputedStyle(elem);
        var transform = computedStyles[transformProp];
        if (!transform || transform === 'none') {
            return decompose(new Matrix());
        }

        var matrix = new Matrix(transform);
        return decompose(matrix);
    },
    obj: function obj(_obj) {
        var matrix = new Matrix();
        var composition = matrix.compose(_obj);
        return decompose(composition);
    }
};

},{"../matrix":6,"../prop":10}],14:[function(require,module,exports){
"use strict";

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

	if (obj.rotation !== undefined) {
		obj.rotateZ = obj.rotation;
		delete obj.rotation;
	}

	return obj;
};

module.exports = function (obj) {
	return !obj ? obj : expand(obj);
};

},{}],15:[function(require,module,exports){
'use strict';

var isElement = require('./isElement');
var baser = require('./baser');
var expandShorthand = require('./expandShorthand');

module.exports = function matrix(initial) {
    var init = initial;

    var base = void 0;
    var _yoyo = void 0;
    var from = void 0;
    var _to = void 0;
    var repeat = void 0;

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
            _to = expandShorthand(t);
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
                base = isElement(init) ? baser.style(init) : baser.obj(expandShorthand(init));
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
};

},{"./baser":13,"./expandShorthand":14,"./isElement":16}],16:[function(require,module,exports){
"use strict";

module.exports = function (obj) {
  return !!(obj && +obj.nodeType === obj.nodeType);
};

},{}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYW5pbWF0aW9uLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL2xvb3AuanMiLCJzcmMvbWF0cml4L1ZlY3RvcjQuanMiLCJzcmMvbWF0cml4L2RlZzJyYWQuanMiLCJzcmMvbWF0cml4L2luZGV4LmpzIiwic3JjL21hdHJpeC9tYXRyaXguanMiLCJzcmMvbWF0cml4L3RyYW5zcC5qcyIsInNyYy9tYXRyaXgvdmVjdG9yLmpzIiwic3JjL3Byb3AuanMiLCJzcmMvc3ByaW5nLmpzIiwic3JjL3RyYW5zZm9ybS5qcyIsInNyYy90cmFuc2Zvcm1lci9iYXNlci5qcyIsInNyYy90cmFuc2Zvcm1lci9leHBhbmRTaG9ydGhhbmQuanMiLCJzcmMvdHJhbnNmb3JtZXIvaW5kZXguanMiLCJzcmMvdHJhbnNmb3JtZXIvaXNFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLE9BQU8sUUFBYixBQUFhLEFBQVE7QUFDckIsSUFBTSxjQUFjLFFBQXBCLEFBQW9CLEFBQVE7QUFDNUIsSUFBTSxJQUFJLFFBQVYsQUFBVSxBQUFROztBQUVsQixPQUFBLEFBQU8sVUFBVSxTQUFBLEFBQVMsVUFBVCxBQUFtQixLQUFLLEFBQ3JDO1FBQU0sTUFBTixBQUFnQixBQUNoQjtRQUFNLFNBQVUsWUFBaEIsQUFBZ0IsQUFBWSxBQUM1QjtRQUFJLFVBQUosQUFBZ0IsQUFDaEI7UUFBSSxZQUFKLEFBQWdCLEFBQ2hCO1FBQUksWUFBSixBQUFnQixBQUNoQjtRQUFJLFNBQUosQUFBZ0IsQUFDaEI7UUFBSSxTQUFKLEFBQWdCLEFBRWhCOztRQUFNLFNBQVEsU0FBUixBQUFRLFNBQVcsQUFDckI7ZUFBQSxBQUFPO3NCQUNPLGtCQUFBLEFBQUMsTUFBUyxBQUNoQjt1QkFBQSxBQUFPLE9BQVAsQUFBYyxBQUNkO29CQUFBLEFBQUksUUFBSixBQUFZLFVBQVUsT0FBdEIsQUFBc0Is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QUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxBQUEwQyxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQWhFLEFBQWtFLEFBQ2xFO01BQUEsQUFBRSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQVIsQUFBVSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhCLEFBQTBCLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEMsQUFBMEMsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFoRSxBQUFrRSxBQUNsRTtNQUFBLEFBQUUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFSLEFBQVUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QixBQUEwQixNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhDLEFBQTBDLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBaEUsQUFBa0UsQUFFbEU7O01BQUEsQUFBRSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQVIsQUFBVSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhCLEFBQTBCLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEMsQUFBMEMsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFoRSxBQUFrRSxBQUNsRTtNQUFBLEFBQUUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFSLEFBQVUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QixBQUEwQixNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhDLEFBQTBDLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBaEUsQUFBa0UsQUFDbEU7TUFBQSxBQUFFLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxBQUEwQyxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQWhFLEFBQWtFLEFBQ2xFO01BQUEsQUFBRSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQVIsQUFBVSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhCLEFBQTBCLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEMsQUFBMEMsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFoRSxBQUFrRSxBQUVsRTs7TUFBQSxBQUFFLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxBQUEwQyxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQWhFLEFBQWtFLEFBQ2xFO01BQUEsQUFBRSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQVIsQUFBVSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhCLEFBQTBCLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEMsQUFBMEMsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFoRSxBQUFrRSxBQUNsRTtNQUFBLEFBQUUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFSLEFBQVUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QixBQUEwQixNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhDLEFBQTBDLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBaEUsQUFBa0UsQUFDbEU7TUFBQSxBQUFFLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxBQUEwQyxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQWhFLEFBQWtFLEFBRWxFOztXQUFBLEFBQU8sQUFDVjtBQTVCRDs7QUE4QkEsU0FBQSxBQUFTLFVBQVQsQUFBbUIsUUFBUSxBQUN2QjtRQUFJLFNBQVMsSUFBSSxPQUFqQixBQUFhLEFBQVcsQUFDeEI7UUFBSSxPQUFKLEFBQVc7UUFBRyxPQUFkLEFBQXFCLEFBQ3JCO1FBQUksSUFBSixBQUFRO1FBQVIsQUFBYyxBQUNkO1dBQUEsQUFBTyxHQUFHLEFBQ047WUFBQSxBQUFJLEFBQ0o7ZUFBQSxBQUFPLEdBQUcsQUFDTjttQkFBTyxNQUFBLEFBQU0sSUFBYixBQUFpQixLQUFLLE9BQU8sTUFBQSxBQUFNLElBQW5DLEFBQXNCLEFBQWlCLEFBQ3ZDO0FBQ0g7QUFDRDtBQUNIO0FBQ0Q7V0FBQSxBQUFPLEFBQ1Y7OztBQUVEOzs7Ozs7Ozs7QUFTQSxTQUFBLEFBQVMsVUFBVCxBQUFtQixRQUFRLEFBQ3ZCO1FBQUkseUJBQUo7UUFDSSxxQkFESjtRQUVJLGdDQUZKO1FBR0ksMENBSEo7UUFJSSxtQkFKSjtRQUtJLGlCQUxKO1FBTUksV0FOSjtRQU9JLFNBUEo7UUFRSSxXQVJKO1FBU0ksYUFUSjtRQVVJLFlBVko7UUFXSSxhQVhKO1FBWUksY0FaSixBQWNBOztBQUNBO1FBQUksT0FBQSxBQUFPLFFBQVgsQUFBbUIsR0FBRyxBQUFFO2VBQUEsQUFBTyxBQUFRO0FBRXZDOztTQUFLLElBQUksS0FBVCxBQUFhLEdBQUcsTUFBaEIsQUFBcUIsR0FBckIsQUFBd0IsTUFBSyxBQUN6QjthQUFLLElBQUksSUFBVCxBQUFhLEdBQUcsSUFBaEIsQUFBb0IsR0FBcEIsQUFBdUIsS0FBSyxBQUN4QjttQkFBTyxNQUFBLEFBQU0sS0FBYixBQUFpQixNQUFNLE9BQXZCLEFBQThCLEFBQ2pDO0FBQ0o7QUFFRDs7QUFDQTtBQUNBO3dCQUFBLEFBQW9CLEFBQ3BCO3NCQUFBLEFBQWtCLE1BQWxCLEFBQXdCLEFBQ3hCO3NCQUFBLEFBQWtCLE1BQWxCLEFBQXdCLEFBQ3hCO3NCQUFBLEFBQWtCLE1BQWxCLEFBQXdCLEFBQ3hCO3NCQUFBLEFBQWtCLE1BQWxCLEFBQXdCLEFBRXhCOztRQUFJLGVBQUEsQUFBZSx1QkFBbkIsQUFBMEMsR0FBRyxBQUN6QztlQUFBLEFBQU8sQUFDVjtBQUVEOztBQUNBO1FBQUksT0FBQSxBQUFPLFFBQVAsQUFBZSxLQUFLLE9BQUEsQUFBTyxRQUEzQixBQUFtQyxLQUFLLE9BQUEsQUFBTyxRQUFuRCxBQUEyRCxHQUFHLEFBQzFEO0FBQ0E7d0JBQWdCLElBQUEsQUFBSSxRQUFRLE9BQVosQUFBbUIsS0FBSyxPQUF4QixBQUErQixLQUFLLE9BQXBDLEFBQTJDLEtBQUssT0FBaEUsQUFBZ0IsQUFBdUQsQUFFdkU7O0FBQ0E7QUFDQTttQ0FBMkIsUUFBM0IsQUFBMkIsQUFBUSxBQUNuQzs2Q0FBcUMsVUFBckMsQUFBcUMsQUFBVSxBQUMvQztzQkFBYyxjQUFBLEFBQWMsaUJBQTVCLEFBQWMsQUFBK0IsQUFDaEQ7QUFURCxXQVVLLEFBQ0Q7QUFDQTtzQkFBYyxJQUFBLEFBQUksUUFBSixBQUFZLEdBQVosQUFBZSxHQUFmLEFBQWtCLEdBQWhDLEFBQWMsQUFBcUIsQUFDdEM7QUFFRDs7QUFDQTtBQUNBO2dCQUFZLElBQUEsQUFBSSxRQUFRLE9BQUEsQUFBTyxLQUFLLE9BQXhCLEFBQStCLEtBQUssT0FBQSxBQUFPLEtBQUssT0FBaEQsQUFBdUQsS0FBSyxPQUF4RSxBQUFZLEFBQW1FLEFBRS9FOztBQUNBO1VBQU0sQ0FBRSxJQUFGLEFBQUUsQUFBSSxXQUFXLElBQWpCLEFBQWlCLEFBQUksV0FBVyxJQUF0QyxBQUFNLEFBQWdDLEFBQUksQUFDMUM7U0FBSyxJQUFBLEFBQUksR0FBRyxNQUFNLElBQWxCLEFBQXNCLFFBQVEsSUFBOUIsQUFBa0MsS0FBbEMsQUFBdUMsS0FBSyxBQUN4QztZQUFJLElBQUosQUFBUSxHQUFSLEFBQVcsSUFBSSxPQUFPLE1BQUEsQUFBTSxJQUE1QixBQUFlLEFBQWlCLEFBQ2hDO1lBQUksSUFBSixBQUFRLEdBQVIsQUFBVyxJQUFJLE9BQU8sTUFBQSxBQUFNLElBQTVCLEFBQWUsQUFBaUIsQUFDaEM7WUFBSSxJQUFKLEFBQVEsR0FBUixBQUFXLElBQUksT0FBTyxNQUFBLEFBQU0sSUFBNUIsQUFBZSxBQUFpQixBQUNuQztBQUVEOztBQUNBO1lBQVEsSUFBUixBQUFRLEFBQUksQUFDWjtXQUFPLElBQVAsQUFBTyxBQUFJLEFBRVg7O1VBQUEsQUFBTSxJQUFJLElBQUEsQUFBSSxHQUFkLEFBQVUsQUFBTyxBQUNqQjtRQUFBLEFBQUksS0FBSyxJQUFBLEFBQUksR0FBYixBQUFTLEFBQU8sQUFFaEI7O0FBQ0E7U0FBQSxBQUFLLElBQUksSUFBQSxBQUFJLEdBQUosQUFBTyxJQUFJLElBQXBCLEFBQVMsQUFBVyxBQUFJLEFBQ3hCO1FBQUEsQUFBSSxLQUFLLElBQUEsQUFBSSxHQUFKLEFBQU8sUUFBUSxJQUFmLEFBQWUsQUFBSSxJQUFuQixBQUF1QixLQUFLLENBQUMsS0FBdEMsQUFBUyxBQUFrQyxBQUUzQzs7QUFDQTtVQUFBLEFBQU0sSUFBSSxJQUFBLEFBQUksR0FBZCxBQUFVLEFBQU8sQUFDakI7UUFBQSxBQUFJLEtBQUssSUFBQSxBQUFJLEdBQWIsQUFBUyxBQUFPLEFBQ2hCO1NBQUEsQUFBSyxLQUFLLE1BQVYsQUFBZ0IsQUFFaEI7O0FBQ0E7U0FBQSxBQUFLLElBQUksSUFBQSxBQUFJLEdBQUosQUFBTyxJQUFJLElBQXBCLEFBQVMsQUFBVyxBQUFJLEFBQ3hCO1FBQUEsQUFBSSxLQUFLLElBQUEsQUFBSSxHQUFKLEFBQU8sUUFBUSxJQUFmLEFBQWUsQUFBSSxJQUFuQixBQUF1QixLQUFLLENBQUMsS0FBdEMsQUFBUyxBQUFrQyxBQUMzQztTQUFBLEFBQUssSUFBSSxJQUFBLEFBQUksR0FBSixBQUFPLElBQUksSUFBcEIsQUFBUyxBQUFXLEFBQUksQUFDeEI7UUFBQSxBQUFJLEtBQUssSUFBQSxBQUFJLEdBQUosQUFBTyxRQUFRLElBQWYsQUFBZSxBQUFJLElBQW5CLEFBQXVCLEtBQUssQ0FBQyxLQUF0QyxBQUFTLEFBQWtDLEFBRTNDOztBQUNBO1VBQUEsQUFBTSxJQUFJLElBQUEsQUFBSSxHQUFkLEFBQVUsQUFBTyxBQUNqQjtRQUFBLEFBQUksS0FBSyxJQUFBLEFBQUksR0FBYixBQUFTLEFBQU8sQUFDaEI7U0FBQSxBQUFLLElBQUssS0FBQSxBQUFLLElBQUksTUFBVixBQUFnQixLQUF6QixBQUErQixBQUMvQjtTQUFBLEFBQUssSUFBSyxLQUFBLEFBQUssSUFBSSxNQUFWLEFBQWdCLEtBQXpCLEFBQStCLEFBRS9COztBQUNBO0FBQ0E7QUFDQTtZQUFRLElBQUEsQUFBSSxHQUFKLEFBQU8sTUFBTSxJQUFyQixBQUFRLEFBQWEsQUFBSSxBQUN6QjtRQUFJLElBQUEsQUFBSSxHQUFKLEFBQU8sSUFBUCxBQUFXLFNBQWYsQUFBd0IsR0FBRyxBQUN2QjthQUFLLElBQUksTUFBVCxBQUFhLEdBQUcsTUFBaEIsQUFBb0IsR0FBcEIsQUFBdUIsT0FBSyxBQUN4QjtrQkFBQSxBQUFNLEtBQUssQ0FBWCxBQUFZLEFBQ1o7Z0JBQUEsQUFBSSxLQUFKLEFBQU8sS0FBSyxDQUFaLEFBQWEsQUFDYjtnQkFBQSxBQUFJLEtBQUosQUFBTyxLQUFLLENBQVosQUFBYSxBQUNiO2dCQUFBLEFBQUksS0FBSixBQUFPLEtBQUssQ0FBWixBQUFhLEFBQ2hCO0FBQ0o7QUFFRDs7QUFDQTtBQUNBO2FBQVMsSUFBVCxBQUFTLEFBQUksQUFDYjtXQUFBLEFBQU8sSUFBSSxNQUFNLEtBQUEsQUFBSyxLQUFLLEtBQUEsQUFBSyxJQUFJLElBQUksSUFBQSxBQUFJLEdBQVIsQUFBVyxJQUFJLElBQUEsQUFBSSxHQUFuQixBQUFzQixJQUFJLElBQUEsQUFBSSxHQUF2QyxBQUEwQyxHQUFyRSxBQUFpQixBQUFVLEFBQTZDLEFBQ3hFO1dBQUEsQUFBTyxJQUFJLE1BQU0sS0FBQSxBQUFLLEtBQUssS0FBQSxBQUFLLElBQUksSUFBSSxJQUFBLEFBQUksR0FBUixBQUFXLElBQUksSUFBQSxBQUFJLEdBQW5CLEFBQXNCLElBQUksSUFBQSxBQUFJLEdBQXZDLEFBQTBDLEdBQXJFLEFBQWlCLEFBQVUsQUFBNkMsQUFDeEU7V0FBQSxBQUFPLElBQUksTUFBTSxLQUFBLEFBQUssS0FBSyxLQUFBLEFBQUssSUFBSSxJQUFJLElBQUEsQUFBSSxHQUFSLEFBQVcsSUFBSSxJQUFBLEFBQUksR0FBbkIsQUFBc0IsSUFBSSxJQUFBLEFBQUksR0FBdkMsQUFBMEMsR0FBckUsQUFBaUIsQUFBVSxBQUE2QyxBQUN4RTtXQUFBLEFBQU8sSUFBSSxNQUFNLEtBQUEsQUFBSyxLQUFLLEtBQUEsQUFBSyxJQUFJLElBQUksSUFBQSxBQUFJLEdBQVIsQUFBVyxJQUFJLElBQUEsQUFBSSxHQUFuQixBQUFzQixJQUFJLElBQUEsQUFBSSxHQUF2QyxBQUEwQyxHQUFyRSxBQUFpQixBQUFVLEFBQTZDLEFBRXhFOztBQUNBO0FBQ0E7QUFFQTs7QUFDQTtXQUFBLEFBQU8sSUFBSSxLQUFBLEFBQUssS0FBSyxDQUFDLElBQUEsQUFBSSxHQUExQixBQUFXLEFBQWtCLEFBQzdCO1FBQUksS0FBQSxBQUFLLElBQUksT0FBVCxBQUFnQixPQUFwQixBQUEyQixHQUFHLEFBQzFCO2VBQUEsQUFBTyxJQUFJLEtBQUEsQUFBSyxNQUFNLElBQUEsQUFBSSxHQUFmLEFBQWtCLEdBQUcsSUFBQSxBQUFJLEdBQXBDLEFBQVcsQUFBNEIsQUFDdkM7ZUFBQSxBQUFPLElBQUksS0FBQSxBQUFLLE1BQU0sSUFBQSxBQUFJLEdBQWYsQUFBa0IsR0FBRyxJQUFBLEFBQUksR0FBcEMsQUFBVyxBQUE0QixBQUMxQztBQUhELFdBR08sQUFDSDtlQUFBLEFBQU8sSUFBSSxLQUFBLEFBQUssTUFBTSxDQUFDLElBQUEsQUFBSSxHQUFoQixBQUFtQixHQUFHLElBQUEsQUFBSSxHQUFyQyxBQUFXLEFBQTZCLEFBQ3hDO2VBQUEsQUFBTyxJQUFQLEFBQVcsQUFDZDtBQUVEOztBQUNBO0FBQ0E7QUFDQTtBQUVBOztBQUNBO0FBQ0E7QUFFQTs7O3FCQUFPLEFBRUg7bUJBRkcsQUFHSDtjQUhHLEFBSUg7ZUFKRyxBQUtIO2dCQUxKLEFBQU8sQUFPVjtBQVBVLEFBQ0g7OztBQVFSLE9BQUEsQUFBTztlQUFVLEFBRWI7Y0FGYSxBQUdiO2FBSGEsQUFJYjtjQUpKLEFBQWlCO0FBQUEsQUFDYjs7Ozs7QUMxVkosSUFBTSxnQkFBZ0IsU0FBaEIsQUFBZ0IsY0FBQSxBQUFTLE9BQU8sQUFDbEM7UUFBTSxRQUFOLEFBQWMsQUFDZDtRQUFNLFFBQVEsTUFBQSxBQUFNLE1BQU4sQUFBWSxVQUExQixBQUFvQyxBQUVwQzs7O2VBQ1csV0FBVyxNQURmLEFBQ0ksQUFBVyxBQUFNLEFBQ3hCO2VBQU8sTUFGSixBQUVJLEFBQU0sQUFDYjtrQkFISixBQUFPLEFBR08sQUFFakI7QUFMVSxBQUNIO0FBTFI7O0FBV0EsT0FBQSxBQUFPLFVBQVUsU0FBQSxBQUFTLGtCQUFULEFBQTJCLFdBQTNCLEFBQXNDLFlBQVksQUFDL0Q7UUFBTSxjQUFOLEFBQXVCLEFBQ3ZCO1FBQU0saUJBQWlCLFVBQUEsQUFBVSxXQUFWLEFBQXFCLE1BQXJCLEFBQTJCLGFBQTNCLEFBQXdDLE1BQS9ELEFBQXVCLEFBQThDLEFBQ3JFO1FBQU0sZUFBaUIsZUFBdkIsQUFBdUIsQUFBZSxBQUN0QztRQUFNLGVBQWlCLGVBQUEsQUFBZSxHQUFmLEFBQWtCLE1BQXpDLEFBQXVCLEFBQXdCLEFBQy9DO1FBQU0sZUFBaUIsQ0FBQSxBQUFDLGNBQWMsYUFBQSxBQUFhLElBQW5ELEFBQXNDLEFBQWlCLEFBRXZEOzs7YUFBTyxBQUNFLEFBQ0w7ZUFBTyxnQkFGSixBQUVvQixBQUN2QjtrQkFISixBQUFPLEFBR08sQUFFakI7QUFMVSxBQUNIO0FBUlI7Ozs7O0FDWEE7Ozs7O0FBSUEsU0FBQSxBQUFTLE9BQVQsQUFBZ0IsUUFBUSxBQUNwQjtXQUFPLEtBQUEsQUFBSyxLQUFLLE9BQUEsQUFBTyxJQUFJLE9BQVgsQUFBa0IsSUFBSSxPQUFBLEFBQU8sSUFBSSxPQUFqQyxBQUF3QyxJQUFJLE9BQUEsQUFBTyxJQUFJLE9BQXhFLEFBQU8sQUFBd0UsQUFDbEY7OztBQUVEOzs7O0FBSUEsU0FBQSxBQUFTLFVBQVQsQUFBbUIsUUFBUSxBQUN2QjtRQUFJLE1BQU0sT0FBVixBQUFVLEFBQU87UUFDYixJQUFJLElBQUksT0FBSixBQUFXLFlBQVksT0FBQSxBQUFPLElBQTlCLEFBQWtDLEtBQUssT0FBQSxBQUFPLElBQTlDLEFBQWtELEtBQUssT0FBQSxBQUFPLElBRHRFLEFBQ1EsQUFBa0UsQUFFMUU7O1dBQUEsQUFBTyxBQUNWOzs7QUFFRDs7Ozs7QUFLQSxTQUFBLEFBQVMsSUFBVCxBQUFhLEdBQWIsQUFBZ0IsR0FBRyxBQUNmO1dBQU8sRUFBQSxBQUFFLElBQUksRUFBTixBQUFRLElBQUksRUFBQSxBQUFFLElBQUksRUFBbEIsQUFBb0IsSUFBSSxFQUFBLEFBQUUsSUFBSSxFQUE5QixBQUFnQyxJQUFJLEVBQUEsQUFBRSxJQUFJLEVBQWpELEFBQW1ELEFBQ3REOzs7QUFFRDs7Ozs7QUFLQSxTQUFBLEFBQVMsTUFBVCxBQUFlLEdBQWYsQUFBa0IsR0FBRyxBQUNqQjtXQUFPLElBQUksRUFBSixBQUFNLFlBQ1IsRUFBQSxBQUFFLElBQUksRUFBUCxBQUFTLElBQU0sRUFBQSxBQUFFLElBQUksRUFEbEIsQUFDb0IsR0FDdEIsRUFBQSxBQUFFLElBQUksRUFBUCxBQUFTLElBQU0sRUFBQSxBQUFFLElBQUksRUFGbEIsQUFFb0IsR0FDdEIsRUFBQSxBQUFFLElBQUksRUFBUCxBQUFTLElBQU0sRUFBQSxBQUFFLElBQUksRUFIekIsQUFBTyxBQUdvQixBQUU5Qjs7O0FBRUQ7Ozs7Ozs7O0FBUUEsU0FBQSxBQUFTLFFBQVQsQUFBaUIsUUFBakIsQUFBeUIsUUFBekIsQUFBaUMsTUFBakMsQUFBdUMsTUFBTSxBQUN6QztXQUFPLElBQUksT0FBSixBQUFXLFlBQ2IsT0FBTyxPQUFSLEFBQWUsSUFBTSxPQUFPLE9BRHpCLEFBQ2dDLEdBQ2xDLE9BQU8sT0FBUixBQUFlLElBQU0sT0FBTyxPQUZ6QixBQUVnQyxHQUNsQyxPQUFPLE9BQVIsQUFBZSxJQUFNLE9BQU8sT0FIaEMsQUFBTyxBQUdnQyxBQUUxQzs7O0FBRUQsU0FBQSxBQUFTLGlCQUFULEFBQTBCLFFBQTFCLEFBQWtDLFFBQVEsQUFDdEM7V0FBTyxJQUFJLE9BQUosQUFBVyxZQUNiLE9BQUEsQUFBTyxNQUFNLE9BQWQsQUFBcUIsSUFBTSxPQUFBLEFBQU8sTUFBTSxPQUF4QyxBQUErQyxJQUFNLE9BQUEsQUFBTyxNQUFNLE9BRC9ELEFBQ3NFLEdBQ3hFLE9BQUEsQUFBTyxNQUFNLE9BQWQsQUFBcUIsSUFBTSxPQUFBLEFBQU8sTUFBTSxPQUF4QyxBQUErQyxJQUFNLE9BQUEsQUFBTyxNQUFNLE9BRi9ELEFBRXNFLEdBQ3hFLE9BQUEsQUFBTyxNQUFNLE9BQWQsQUFBcUIsSUFBTSxPQUFBLEFBQU8sTUFBTSxPQUF4QyxBQUErQyxJQUFNLE9BQUEsQUFBTyxNQUFNLE9BSHRFLEFBQU8sQUFHc0UsQUFFaEY7OztBQUVELE9BQUEsQUFBTztZQUFVLEFBRWI7ZUFGYSxBQUdiO1NBSGEsQUFJYjtXQUphLEFBS2I7YUFMYSxBQU1iO3NCQU5KLEFBQWlCO0FBQUEsQUFDYjs7Ozs7QUNsRUosSUFBTSxNQUFNLFNBQUEsQUFBUyxjQUFyQixBQUFZLEFBQXVCOztBQUVuQyxJQUFNLGFBQWEsU0FBYixBQUFhLFdBQUEsQUFBUyxLQUFLLEFBQzdCO1FBQUksTUFBTSxJQUFWLEFBQWMsQUFDZDtXQUFBLEFBQU8sT0FBTyxBQUNWO1lBQUksSUFBQSxBQUFJLE1BQU0sSUFBVixBQUFVLEFBQUksVUFBbEIsQUFBNEIsV0FBVyxBQUNuQzttQkFBTyxJQUFQLEFBQU8sQUFBSSxBQUNkO0FBQ0o7QUFDSjtBQVBEOztBQVNBLE9BQUEsQUFBTyxVQUFVLFdBQVcsQ0FBQSxBQUN4QixhQUR3QixBQUV4QixlQUZ3QixBQUd4QixjQUh3QixBQUl4QixnQkFKYSxBQUFXLEFBS3hCLHVCQUxKLEFBTU07Ozs7O0FDakJOLElBQU0sWUFBTixBQUFrQjtBQUNsQixJQUFNLFlBQU4sQUFBa0I7QUFDbEIsSUFBTSxRQUFZLElBQWxCLEFBQXNCOztBQUV0QixJQUFNLG1CQUFtQixTQUFuQixBQUFtQixpQkFBQSxBQUFTLFNBQVQsQUFBa0IsR0FBbEIsQUFBcUIsVUFBckIsQUFBK0IsVUFBVSxBQUM5RDtXQUFPLENBQUEsQUFBQyxVQUFELEFBQVcsSUFBSSxXQUF0QixBQUFpQyxBQUNwQztBQUZEOztBQUlBLElBQU0sWUFBWSxTQUFaLEFBQVksVUFBQSxBQUFTLE9BQVQsQUFBZ0IsT0FBTyxBQUNyQztRQUFNLEtBQUssUUFBWCxBQUFtQixBQUNuQjtRQUFNLElBQVcsTUFBakIsQUFBdUIsQUFDdkI7UUFBTSxXQUFXLE1BQWpCLEFBQXVCLEFBQ3ZCO1FBQU0sVUFBVyxNQUFqQixBQUF1QixBQUN2QjtRQUFNLFdBQVcsTUFBakIsQUFBdUIsQUFFdkI7O1FBQU0sTUFBTixBQUFZLEFBQ1o7UUFBTSxNQUFNLGlCQUFBLEFBQWlCLFNBQWpCLEFBQTBCLEdBQTFCLEFBQTZCLFVBQXpDLEFBQVksQUFBdUMsQUFFbkQ7O1FBQU0sTUFBTSxXQUFXLE1BQXZCLEFBQTZCLEFBQzdCO1FBQU0sUUFBUSxJQUFJLE1BQWxCLEFBQXdCLEFBQ3hCO1FBQU0sTUFBTSxpQkFBQSxBQUFpQixTQUFqQixBQUEwQixPQUExQixBQUFpQyxVQUE3QyxBQUFZLEFBQTJDLEFBRXZEOztRQUFNLE1BQU0sV0FBVyxNQUF2QixBQUE2QixBQUM3QjtRQUFNLFFBQVEsSUFBSSxNQUFsQixBQUF3QixBQUN4QjtRQUFNLE1BQU0saUJBQUEsQUFBaUIsU0FBakIsQUFBMEIsT0FBMUIsQUFBaUMsVUFBN0MsQUFBWSxBQUEyQyxBQUV2RDs7UUFBTSxNQUFNLFdBQVcsTUFBdkIsQUFBNkIsQUFDN0I7UUFBTSxRQUFRLElBQUksTUFBbEIsQUFBd0IsQUFDeEI7UUFBTSxNQUFNLGlCQUFBLEFBQWlCLFNBQWpCLEFBQTBCLE9BQTFCLEFBQWlDLFVBQTdDLEFBQVksQUFBMkMsQUFFdkQ7O1FBQU0sT0FBUSxJQUFELEFBQUssS0FBTSxNQUFNLEtBQUssTUFBWCxBQUFNLEFBQVcsT0FBekMsQUFBYSxBQUFtQyxBQUNoRDtRQUFNLE9BQVEsSUFBRCxBQUFLLEtBQU0sTUFBTSxLQUFLLE1BQVgsQUFBTSxBQUFXLE9BQXpDLEFBQWEsQUFBbUMsQUFFaEQ7O1VBQUEsQUFBTSxJQUFXLElBQUksT0FBckIsQUFBNEIsQUFDNUI7VUFBQSxBQUFNLFdBQVcsTUFBTSxPQUF2QixBQUE4QixBQUU5Qjs7V0FBQSxBQUFPLEFBQ1Y7QUE3QkQ7O0FBK0JBLE9BQUEsQUFBTyxVQUFVLFNBQUEsQUFBUyxTQUFTLEFBQy9CO1FBQUksWUFBSixBQUFxQixBQUNyQjtRQUFJLFdBQUosQUFBcUIsQUFDckI7UUFBSSxZQUFKLEFBQXFCLEFBRXJCOztRQUFJLFVBQUosQUFBdUIsQUFDdkI7UUFBSSxtQkFBSixBQUF1QixBQUN2QjtRQUFJLGtCQUFKLEFBQXVCLEFBQ3ZCO1FBQUksbUJBQUosQUFBdUIsQUFDdkI7UUFBSSxRQUFKLEFBQXVCLEFBQ3ZCO1FBQUksV0FBSixBQUF1QixBQUV2Qjs7QUFDQTtBQUNBO0FBQ0E7QUFDQTtRQUFNLFFBQU4sQUFBYyxBQUVkOztRQUFJLHNCQUFKLEFBQ0E7UUFBSSx3QkFBSixBQUNBO1FBQUksdUJBQUosQUFFQTs7O0FBQU8sc0RBQUEsQUFDZSxLQUFLLEFBQ25COzZCQUFtQixJQUFuQixBQUF1QixBQUN2QjsrQkFBbUIsSUFBbkIsQUFBdUIsQUFDdkI7OEJBQW1CLElBQW5CLEFBQXVCLEFBQ3ZCO21CQUFBLEFBQU8sQUFDVjtBQU5FLEFBUUg7QUFSRyxnQ0FBQSxBQVFJLE9BQU8sQUFDVjtzQkFBQSxBQUFTLEFBQ1Q7bUJBQUEsQUFBTyxBQUNWO0FBWEUsQUFhSDtBQWJHLDBCQUFBLEFBYUMsR0FiRCxBQWFJLEdBYkosQUFhTyxHQUFHLEFBQ1Q7Z0JBQUksTUFBSixBQUFVLFdBQVcsQUFBRTs0QkFBVyxtQkFBWCxBQUE4QixBQUFJO0FBQ3pEO2dCQUFJLE1BQUosQUFBVSxXQUFXLEFBQUU7MkJBQVUsa0JBQVYsQUFBNEIsQUFBSztBQUN4RDtnQkFBSSxNQUFKLEFBQVUsV0FBVyxBQUFFOzRCQUFXLG1CQUFYLEFBQThCLEFBQUk7QUFDekQ7bUJBQUEsQUFBTyxBQUNWO0FBbEJFLEFBb0JIO0FBcEJHLGtDQUFBLEFBb0JLLEdBQUcsQUFDUDt1QkFBVSxrQkFBVixBQUE0QixBQUM1QjttQkFBQSxBQUFPLEFBQ1Y7QUF2QkUsQUF5Qkg7QUF6Qkcsb0NBQUEsQUF5Qk0sR0FBRyxBQUNSO3dCQUFXLG1CQUFYLEFBQThCLEFBQzlCO21CQUFBLEFBQU8sQUFDVjtBQTVCRSxBQThCSDtBQTlCRyxvQ0FBQSxBQThCTSxHQUFHLEFBQ1I7d0JBQVcsbUJBQVgsQUFBOEIsQUFDOUI7bUJBQUEsQUFBTyxBQUNWO0FBakNFLEFBbUNIO0FBbkNHLGdDQW1DSyxBQUNKO3VCQUFBLEFBQVcsQUFDWDttQkFBQSxBQUFPLEFBQ1Y7QUF0Q0UsQUF3Q0g7QUF4Q0csa0NBd0NNLEFBQ0w7dUJBQUEsQUFBVyxBQUNYO21CQUFBLEFBQU8sQUFDVjtBQTNDRSxBQTZDSDtBQTdDRztnQkE4Q0MsQUFBSSxVQUFVLEFBQUU7dUJBQUEsQUFBTyxBQUFPO0FBRDNCLGFBQUEsQUFDSCxDQUErQixBQUUvQjs7Z0JBQU0sY0FBTixBQUFvQixBQUVwQjs7d0JBQUEsQUFBWSxJQUFXLFFBQXZCLEFBQStCLEFBQy9CO3dCQUFBLEFBQVksV0FBWixBQUF1QixBQUN2Qjt3QkFBQSxBQUFZLFVBQVosQUFBdUIsQUFDdkI7d0JBQUEsQUFBWSxXQUFaLEFBQXVCLEFBRXZCOztnQkFBTSxhQUFtQixVQUFBLEFBQVUsYUFBbkMsQUFBeUIsQUFBdUIsQUFDaEQ7Z0JBQU0sZ0JBQW1CLFdBQXpCLEFBQW9DLEFBQ3BDO2dCQUFNLFdBQW1CLFdBQXpCLEFBQW9DLEFBQ3BDO2dCQUFNLGdCQUFtQixXQUF6QixBQUFvQyxBQUNwQztnQkFBTSxnQkFBbUIsS0FBQSxBQUFLLElBQUwsQUFBUyxZQUFsQyxBQUE4QyxBQUM5QztnQkFBTSxtQkFBbUIsS0FBQSxBQUFLLElBQUwsQUFBUyxpQkFBbEMsQUFBbUQsQUFDbkQ7Z0JBQU0sbUJBQW1CLGlCQUF6QixBQUEwQyxBQUUxQzs7b0JBQVEsWUFBWSxXQUFwQixBQUErQixBQUUvQjs7Z0JBQUEsQUFBSTs7NEJBRUEsQUFBVyxBQUNYO3dCQUFBLEFBQVEsQUFFUjs7K0JBQWUsUUFBZixBQUF1QixBQUV2Qjs7QUFDQTtvQkFBSSxVQUFKLEFBQWE7O0FBR1Q7QUFDQTt3QkFBSSxTQUFKLEFBQUksQUFBUyxVQUFTLEFBQUU7QUFBVztBQUVuQzs7QUFDQTtnQ0FBQSxBQUFXLEFBQ1g7K0JBQUEsQUFBVyxBQUNYO2dDQUFBLEFBQVcsQUFDWDs0QkFBQSxBQUFRLEFBRVI7OzJCQVpZLEFBWVosQUFBTyxLQVpLLEFBRVosQ0FVYSxBQUNoQjtBQUVEOztBQUNBO0FBRUE7O3VCQTFCa0IsQUEwQmxCLEFBQU8sTUExQlcsQUFFbEIsQ0F3QmMsQUFDakI7QUFFRDs7d0JBQUEsQUFBVyxBQUNYOzJCQUFlLFFBQWYsQUFBdUIsQUFDdkI7bUJBbkRHLEFBbURILEFBQU8sTUFBTSxBQUNoQjtBQWpHRSxBQW1HSDtBQW5HRyw4QkFtR0ksQUFDSDt3QkFBQSxBQUFXLEFBQ1g7dUJBQUEsQUFBVyxBQUNYO3dCQUFBLEFBQVcsQUFDWDtvQkFBQSxBQUFRLEFBQ1g7QUF4R0wsQUFBTyxBQTBHVjtBQTFHVSxBQUNIO0FBdkJSOzs7OztBQ3ZDQSxJQUFNLFNBQVMsUUFBZixBQUFlLEFBQVE7QUFDdkIsSUFBTSxnQkFBZ0IsUUFBdEIsQUFBc0IsQUFBUTs7QUFFOUIsT0FBQSxBQUFPLFVBQVUsVUFBQSxBQUFTLEtBQVQsQUFBYyxTQUFTLEFBQ3BDO1FBQU0sU0FBVSxJQUFELEFBQUMsQUFBSSxTQUFMLEFBQWUsUUFBOUIsQUFBZSxBQUF1QixBQUN0QztZQUFBLEFBQVEsTUFBUixBQUFjLGlCQUFpQixPQUEvQixBQUErQixBQUFPLEFBQ3pDO0FBSEQ7Ozs7O0FDSEEsSUFBTSxTQUFTLFFBQWYsQUFBZSxBQUFRO0FBQ3ZCLElBQU0sZ0JBQWdCLFFBQXRCLEFBQXNCLEFBQVE7O0FBRTlCLElBQU0sbUJBQW1CLFNBQW5CLEFBQW1CLGlCQUFBLEFBQVMsTUFBTSxBQUNwQztXQUFPLFNBQUEsQUFBUyxZQUFULEFBQXFCLGlCQUE1QixBQUFPLEFBQXNDLEFBQ2hEO0FBRkQ7O0FBSUEsSUFBTSxZQUFZLFNBQVosQUFBWSxVQUFBLEFBQVMsUUFBUSxBQUMvQjtRQUFNLGNBQWMsT0FEVyxBQUMvQixBQUFvQixBQUFPO1FBREksQUFFdkIsU0FGdUIsQUFFWSxZQUZaLEFBRXZCO1FBRnVCLEFBRWYsUUFGZSxBQUVZLFlBRlosQUFFZjtRQUZlLEFBRVIsT0FGUSxBQUVZLFlBRlosQUFFUjtRQUZRLEFBRUYsWUFGRSxBQUVZLFlBRlosQUFFRixBQUU3Qjs7O1dBQ08sVUFEQSxBQUNVLEFBQ2I7V0FBRyxVQUZBLEFBRVUsQUFDYjtXQUFHLFVBSEEsQUFHVSxBQUViOztnQkFBUSxNQUxMLEFBS1csQUFDZDtnQkFBUSxNQU5MLEFBTVcsQUFDZDtnQkFBUSxNQVBMLEFBT1csQUFFZDs7ZUFBTyxLQVRKLEFBU1MsQUFDWjtlQUFPLEtBVkosQUFVUyxBQUVaOztpQkFBUyxPQVpOLEFBWWEsQUFDaEI7aUJBQVMsT0FiTixBQWFhLEFBQ2hCO2lCQUFTLE9BZGIsQUFBTyxBQWNhLEFBRXZCO0FBaEJVLEFBQ0g7QUFMUjs7QUFzQkEsT0FBQSxBQUFPO0FBQVUsMEJBQUEsQUFDUCxNQUFNLEFBQ1I7WUFBTSxpQkFBaUIsaUJBQXZCLEFBQXVCLEFBQWlCLEFBQ3hDO1lBQU0sWUFBWSxlQUFsQixBQUFrQixBQUFlLEFBQ2pDO1lBQUksQ0FBQSxBQUFDLGFBQWEsY0FBbEIsQUFBZ0MsUUFBUSxBQUFFO21CQUFPLFVBQVUsSUFBakIsQUFBTyxBQUFVLEFBQUksQUFBWTtBQUUzRTs7WUFBTSxTQUFTLElBQUEsQUFBSSxPQUFuQixBQUFlLEFBQVcsQUFDMUI7ZUFBTyxVQUFQLEFBQU8sQUFBVSxBQUNwQjtBQVJZLEFBVWI7QUFWYSxzQkFBQSxBQVVULE1BQUssQUFDTDtZQUFNLFNBQVMsSUFBZixBQUFlLEFBQUksQUFDbkI7WUFBTSxjQUFjLE9BQUEsQUFBTyxRQUEzQixBQUFvQixBQUFlLEFBQ25DO2VBQU8sVUFBUCxBQUFPLEFBQVUsQUFDcEI7QUFkTCxBQUFpQjtBQUFBLEFBQ2I7Ozs7O0FDOUJKOzs7Ozs7Ozs7Ozs7OztBQWNBLElBQU0sU0FBUyxTQUFULEFBQVMsT0FBQSxBQUFTLEtBQUssQUFDNUI7S0FBSSxJQUFBLEFBQUksVUFBUixBQUFrQixXQUFXLEFBQzVCO01BQUEsQUFBSSxTQUFTLElBQWIsQUFBaUIsQUFDakI7TUFBQSxBQUFJLFNBQVMsSUFBYixBQUFpQixBQUNqQjtTQUFPLElBQVAsQUFBVyxBQUNYO0FBRUQ7O0tBQUksSUFBQSxBQUFJLFdBQVIsQUFBbUIsV0FBVyxBQUM3QjtNQUFBLEFBQUksVUFBVSxJQUFkLEFBQWtCLEFBQ2xCO1NBQU8sSUFBUCxBQUFXLEFBQ1g7QUFFRDs7S0FBSSxJQUFBLEFBQUksYUFBUixBQUFxQixXQUFXLEFBQy9CO01BQUEsQUFBSSxVQUFVLElBQWQsQUFBa0IsQUFDbEI7U0FBTyxJQUFQLEFBQVcsQUFDWDtBQUVEOztRQUFBLEFBQU8sQUFDUDtBQWxCRDs7QUFvQkEsT0FBQSxBQUFPLFVBQVUsZUFBQTtRQUFPLENBQUEsQUFBQyxNQUFELEFBQU8sTUFBTSxPQUFwQixBQUFvQixBQUFPO0FBQTVDOzs7OztBQ2xDQSxJQUFNLFlBQVksUUFBbEIsQUFBa0IsQUFBUTtBQUMxQixJQUFNLFFBQVEsUUFBZCxBQUFjLEFBQVE7QUFDdEIsSUFBTSxrQkFBa0IsUUFBeEIsQUFBd0IsQUFBUTs7QUFFaEMsT0FBQSxBQUFPLFVBQVUsU0FBQSxBQUFTLE9BQVQsQUFBZ0IsU0FBUyxBQUN0QztRQUFJLE9BQUosQUFBVyxBQUVYOztRQUFJLFlBQUosQUFDQTtRQUFJLGFBQUosQUFDQTtRQUFJLFlBQUosQUFDQTtRQUFJLFdBQUosQUFDQTtRQUFJLGNBQUosQUFFQTs7O0FBQU8sZ0NBQ0ssQUFDSjttQkFBQSxBQUFPLEFBQ1Y7QUFIRSxBQUtIO0FBTEcsNEJBQUEsQUFLRSxNQUFNLEFBQ1A7b0JBQUEsQUFBTyxBQUNQO21CQUFBLEFBQU8sQUFDVjtBQVJFLEFBVUg7QUFWRyw0QkFBQSxBQVVFLEdBQUcsQUFDSjttQkFBQSxBQUFPLEFBQ1A7bUJBQUEsQUFBTyxBQUNWO0FBYkUsQUFlSDtBQWZHLHdCQUFBLEFBZUEsR0FBRyxBQUNGO2tCQUFLLGdCQUFMLEFBQUssQUFBZ0IsQUFDckI7bUJBQUEsQUFBTyxBQUNWO0FBbEJFLEFBb0JIO0FBcEJHLGdDQUFBLEFBb0JJLE1BQU0sQUFDVDtpQkFBSyxJQUFMLEFBQVMsWUFBVCxBQUFxQixLQUFJLEFBQ3JCO29CQUFJLFFBQVEsS0FBQSxBQUFLLGFBQWpCLEFBQThCLEFBQzlCO29CQUFJLE1BQU0sSUFBVixBQUFVLEFBQUcsQUFFYjs7cUJBQUEsQUFBSyxZQUFZLFFBQVEsQ0FBQyxNQUFELEFBQU8sU0FBaEMsQUFBeUMsQUFDNUM7QUFFRDs7bUJBQUEsQUFBTyxBQUNWO0FBN0JFLEFBK0JIO0FBL0JHLG9DQStCTyxBQUNOO2dCQUFBLEFBQUksQUFFSjs7QUFDQTtpQkFBSyxJQUFMLEFBQVMsWUFBVCxBQUFxQixRQUFRLEFBQ3pCO29CQUFBLEFBQUksT0FBTSxBQUNOOzBCQUFNLE9BQU4sQUFBTSxBQUFPLEFBQ2I7MkJBQUEsQUFBTyxZQUFZLElBQW5CLEFBQW1CLEFBQUcsQUFDdEI7d0JBQUEsQUFBRyxZQUFILEFBQWUsQUFDbEI7QUFFRDs7cUJBQUEsQUFBSyxZQUFZLE9BQWpCLEFBQWlCLEFBQU8sQUFDM0I7QUFFRDs7bUJBQUEsQUFBTyxBQUNWO0FBOUNFLEFBZ0RIO0FBaERHLGdDQWdESyxBQUNKO2dCQUFJLENBQUosQUFBSyxLQUFJLEFBQUU7dUJBQUEsQUFBTyxBQUFPO0FBQ3pCO2dCQUFJLENBQUosQUFBSyxNQUFNLEFBQUU7dUJBQU8sVUFBQSxBQUFVLFFBQVEsTUFBQSxBQUFNLE1BQXhCLEFBQWtCLEFBQVksUUFBUSxNQUFBLEFBQU0sSUFBSSxnQkFBdkQsQUFBNkMsQUFBVSxBQUFnQixBQUFTO0FBQzdGO2dCQUFJLENBQUosQUFBSyxNQUFNLEFBQUU7dUJBQUEsQUFBTyxBQUFLO0FBQ3pCO2dCQUFJLENBQUosQUFBSyxRQUFRLEFBQUU7eUJBQUEsQUFBUyxBQUFLO0FBRTdCOztpQkFBSyxJQUFMLEFBQVMsWUFBVCxBQUFxQixLQUFJLEFBQ3JCO0FBQ0E7b0JBQUksS0FBQSxBQUFLLGNBQUwsQUFBbUIsYUFBYSxJQUFBLEFBQUcsY0FBYyxLQUFyRCxBQUFxRCxBQUFLLFdBQVcsQUFDakU7MkJBQU8sSUFBUCxBQUFPLEFBQUcsQUFDVjtBQUNIO0FBRUQ7O3FCQUFBLEFBQUssWUFBWSxLQUFqQixBQUFpQixBQUFLLEFBQ3RCO3VCQUFBLEFBQU8sWUFBWSxLQUFBLEFBQUssYUFBeEIsQUFBcUMsQUFDeEM7QUFFRDs7bUJBQUEsQUFBTyxBQUNWO0FBbEVMLEFBQU8sQUFvRVY7QUFwRVUsQUFDSDtBQVZSOzs7OztBQ0pBLE9BQUEsQUFBTyxVQUFVLGVBQUE7U0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLElBQUQsQUFBSyxhQUFhLElBQW5DLEFBQVEsQUFBK0I7QUFBeEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgbG9vcCA9IHJlcXVpcmUoJy4vbG9vcCcpO1xuY29uc3QgdHJhbnNmb3JtZXIgPSByZXF1aXJlKCcuL3RyYW5zZm9ybWVyJyk7XG5jb25zdCBzID0gcmVxdWlyZSgnLi9zcHJpbmcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhbmltYXRpb24ob2JqKSB7XG4gICAgY29uc3QgYXBpICAgICA9IHt9O1xuICAgIGNvbnN0IG1hdHJpeCAgPSB0cmFuc2Zvcm1lcihvYmopO1xuICAgIGxldCBwbGF5aW5nICAgPSBmYWxzZTtcbiAgICBsZXQgc3RhcnRUaW1lID0gMDtcbiAgICBsZXQgZGVsYXlUaW1lID0gMDtcbiAgICBsZXQgZXZlbnRzICAgID0ge307XG4gICAgbGV0IHNwcmluZyAgICA9IHMoKTtcblxuICAgIGNvbnN0IHN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNwcmluZy5yZWdpc3RlckNhbGxiYWNrcyh7XG4gICAgICAgICAgICBvblVwZGF0ZTogKHBlcmMpID0+IHtcbiAgICAgICAgICAgICAgICBtYXRyaXgudXBkYXRlKHBlcmMpO1xuICAgICAgICAgICAgICAgIGFwaS50cmlnZ2VyKCd1cGRhdGUnLCBtYXRyaXgudmFsdWUoKSwgb2JqKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvblJldmVyc2U6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBtYXRyaXgucmV2ZXJzZSgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBhcGkuc3RvcCgpLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1hdHJpeC5zdGFydCgpO1xuICAgICAgICBsb29wLmFkZChzcHJpbmcpO1xuICAgIH07XG5cbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihhcGksIHtcbiAgICAgICAgZnJvbShmcm9tKSB7XG4gICAgICAgICAgICBtYXRyaXguZnJvbShmcm9tKTtcbiAgICAgICAgICAgIHJldHVybiBhcGk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG8odG8pIHtcbiAgICAgICAgICAgIG1hdHJpeC50byh0byk7XG4gICAgICAgICAgICByZXR1cm4gYXBpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldCh0ZW5zaW9uLCBmcmljdGlvbiwgdmVsb2NpdHkpIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYW4gb2JqZWN0XG4gICAgICAgICAgICBpZiAoK3RlbnNpb24gIT09IHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcCA9IHRlbnNpb247XG4gICAgICAgICAgICAgICAgdmVsb2NpdHkgPSB0ZW1wLnZlbG9jaXR5O1xuICAgICAgICAgICAgICAgIGZyaWN0aW9uID0gdGVtcC5mcmljdGlvbjtcbiAgICAgICAgICAgICAgICB0ZW5zaW9uID0gdGVtcC50ZW5zaW9uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzcHJpbmcuc2V0KHRlbnNpb24sIGZyaWN0aW9uLCB2ZWxvY2l0eSk7XG4gICAgICAgICAgICByZXR1cm4gYXBpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRlbnNpb24odGVuc2lvbikge1xuICAgICAgICAgICAgc3ByaW5nLnRlbnNpb24oK3RlbnNpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGFwaTtcbiAgICAgICAgfSxcblxuICAgICAgICBmcmljdGlvbihmcmljdGlvbikge1xuICAgICAgICAgICAgc3ByaW5nLmZyaWN0aW9uKCtmcmljdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYXBpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZlbG9jaXR5KHZlbG9jaXR5KSB7XG4gICAgICAgICAgICBzcHJpbmcudmVsb2NpdHkoK3ZlbG9jaXR5KTtcbiAgICAgICAgICAgIHJldHVybiBhcGk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb24obmFtZSwgZm4pIHtcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IGV2ZW50c1tuYW1lXSB8fCAoZXZlbnRzW25hbWVdID0gW10pO1xuICAgICAgICAgICAgYXJyLnB1c2goZm4pO1xuICAgICAgICAgICAgcmV0dXJuIGFwaTtcbiAgICAgICAgfSxcblxuICAgICAgICBvZmYobmFtZSwgZm4pIHtcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IGV2ZW50c1tuYW1lXTtcbiAgICAgICAgICAgIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiBhcGk7IH1cblxuICAgICAgICAgICAgbGV0IGlkeCA9IGFyci5pbmRleE9mKGZuKTtcbiAgICAgICAgICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYXJyLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYXBpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRyaWdnZXIobmFtZSwgYSwgYikge1xuICAgICAgICAgICAgY29uc3QgYXJyID0gZXZlbnRzW25hbWVdO1xuICAgICAgICAgICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIGFwaTsgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBhcnIubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICAgICAgICAgIGFycltpZHhdKGEsIGIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYXBpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGF5KGFtb3VudCkge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gYW1vdW50O1xuICAgICAgICAgICAgcmV0dXJuIGFwaTtcbiAgICAgICAgfSxcblxuICAgICAgICByZXBlYXQocmVwZWF0KSB7XG4gICAgICAgICAgICBzcHJpbmcucmVwZWF0KHJlcGVhdCk7XG4gICAgICAgICAgICByZXR1cm4gYXBpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHlveW8oeW95bykge1xuICAgICAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7IHlveW8gPSB0cnVlOyB9XG4gICAgICAgICAgICBtYXRyaXgueW95byghIXlveW8pO1xuICAgICAgICAgICAgcmV0dXJuIGFwaTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdGFydCh0aW1lKSB7XG4gICAgICAgICAgICBzdGFydFRpbWUgPSB0aW1lIHx8IGxvb3Aubm93O1xuICAgICAgICAgICAgbG9vcC5hd2FpdCh0aW1lID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGltZSA8IChzdGFydFRpbWUgKyBkZWxheVRpbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBzaG91bGQgY29udGludWUgdG8gd2FpdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBhcGkudHJpZ2dlcignc3RhcnQnKTtcbiAgICAgICAgICAgICAgICBzdGFydCh0aW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIHNob3VsZCBjb250aW51ZSB0byB3YWl0XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGFwaTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXVzZSh0aW1lKSB7XG4gICAgICAgICAgICB0aW1lID0gdGltZSB8fCBsb29wLm5vdztcbiAgICAgICAgICAgIHNwcmluZy5wYXVzZSh0aW1lKTtcbiAgICAgICAgICAgIHJldHVybiBhcGk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzdW1lKHRpbWUpIHtcbiAgICAgICAgICAgIHRpbWUgPSB0aW1lIHx8IGxvb3Aubm93O1xuICAgICAgICAgICAgc3ByaW5nLnJlc3VtZSh0aW1lKTtcbiAgICAgICAgICAgIHJldHVybiBhcGk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RvcCgpIHtcbiAgICAgICAgICAgIGlmICghcGxheWluZykgeyByZXR1cm4gYXBpOyB9XG4gICAgICAgICAgICBwbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICAgICBsb29wLnJlbW92ZShzcHJpbmcpO1xuICAgICAgICAgICAgc3ByaW5nLnN0b3AoKTtcbiAgICAgICAgICAgIGFwaS50cmlnZ2VyKCdzdG9wJyk7XG4gICAgICAgICAgICByZXR1cm4gYXBpO1xuICAgICAgICB9XG4gICAgfSk7XG59OyIsImNvbnN0IGxvb3AgPSByZXF1aXJlKCcuL2xvb3AnKTtcbmNvbnN0IHByb3AgPSByZXF1aXJlKCcuL3Byb3AnKTtcbmNvbnN0IGFuaW1hdGlvbiA9IHJlcXVpcmUoJy4vYW5pbWF0aW9uJyk7XG5jb25zdCB0cmFuc2Zvcm0gPSByZXF1aXJlKCcuL3RyYW5zZm9ybScpO1xuY29uc3QgcGx1Z2lucyAgID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbihmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihhbmltYXRpb24ob2JqKSwgcGx1Z2lucyk7XG59LCB7XG4gICAgcHJvcCxcbiAgICB0cmFuc2Zvcm0sXG4gICAgdGljazogbG9vcC51cGRhdGUsXG4gICAgdXBkYXRlOiBsb29wLnVwZGF0ZSxcbiAgICBwbHVnaW4obmFtZSwgZm4pIHtcbiAgICAgICAgcGx1Z2luc1tuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59KTsiLCJjb25zdCB3YWl0aW5nICAgID0gW107XG5jb25zdCBhbmltYXRpb25zID0gW107XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5vdzogRGF0ZS5ub3coKSxcblxuICAgIGF3YWl0KGZuKSB7XG4gICAgICAgIHdhaXRpbmcucHVzaChmbik7XG4gICAgfSxcblxuICAgIGFkZChmbikge1xuICAgICAgICBhbmltYXRpb25zLnB1c2goZm4pO1xuICAgIH0sXG5cbiAgICByZW1vdmUoZm4pIHtcbiAgICAgICAgbGV0IGlkeCA9IGFuaW1hdGlvbnMuaW5kZXhPZihmbik7XG4gICAgICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICAgICAgICBhbmltYXRpb25zLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgY29uc3QgdGltZSA9IHRoaXMubm93ID0gRGF0ZS5ub3coKTtcblxuICAgICAgICBpZiAod2FpdGluZy5sZW5ndGggPT09IDAgJiYgYW5pbWF0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpZHggPSAwO1xuICAgICAgICB3aGlsZSAoaWR4IDwgd2FpdGluZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICh3YWl0aW5nW2lkeF0odGltZSkpIHtcbiAgICAgICAgICAgICAgICBpZHgrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2FpdGluZy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlkeCA9IDA7XG4gICAgICAgIHdoaWxlIChpZHggPCBhbmltYXRpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgYW5pbWF0aW9uc1tpZHhdLnN0ZXAodGltZSk7XG4gICAgICAgICAgICBpZHgrKztcbiAgICAgICAgfVxuICAgIH1cbn07IiwiY29uc3QgdmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3InKTtcblxuLyoqXG4gKiBBIDQgZGltZW5zaW9uYWwgdmVjdG9yXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuY29uc3QgVmVjdG9yNCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gVmVjdG9yNCh4LCB5LCB6LCB3KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMueiA9IHo7XG4gICAgdGhpcy53ID0gdztcbiAgICB0aGlzLmNoZWNrVmFsdWVzKCk7XG59O1xuXG5WZWN0b3I0LnByb3RvdHlwZSA9IHtcbiAgICBjb25zdHJ1Y3RvcjogVmVjdG9yNCxcblxuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGF0IHZhbHVlcyBhcmUgbm90IHVuZGVmaW5lZFxuICAgICAqIEByZXR1cm5zIG51bGxcbiAgICAgKi9cbiAgICBjaGVja1ZhbHVlcygpIHtcbiAgICAgICAgdGhpcy54ID0gdGhpcy54IHx8IDA7XG4gICAgICAgIHRoaXMueSA9IHRoaXMueSB8fCAwO1xuICAgICAgICB0aGlzLnogPSB0aGlzLnogfHwgMDtcbiAgICAgICAgdGhpcy53ID0gdGhpcy53IHx8IDA7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbGVuZ3RoIG9mIHRoZSB2ZWN0b3JcbiAgICAgKiBAcmV0dXJucyB7ZmxvYXR9XG4gICAgICovXG4gICAgbGVuZ3RoKCkge1xuICAgICAgICB0aGlzLmNoZWNrVmFsdWVzKCk7XG4gICAgICAgIHJldHVybiB2ZWN0b3IubGVuZ3RoKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBub3JtYWxpc2VkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAgICAgKiBAcmV0dXJucyB7VmVjdG9yNH1cbiAgICAgKi9cbiAgICBub3JtYWxpemUoKSB7XG4gICAgICAgIHJldHVybiB2ZWN0b3Iubm9ybWFsaXplKHRoaXMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBWZWN0b3IgRG90LVByb2R1Y3RcbiAgICAgKiBAcGFyYW0ge1ZlY3RvcjR9IHYgVGhlIHNlY29uZCB2ZWN0b3IgdG8gYXBwbHkgdGhlIHByb2R1Y3QgdG9cbiAgICAgKiBAcmV0dXJucyB7ZmxvYXR9IFRoZSBEb3QtUHJvZHVjdCBvZiB0aGlzIGFuZCB2LlxuICAgICAqL1xuICAgIGRvdCh2KSB7XG4gICAgICAgIHJldHVybiB2ZWN0b3IuZG90KHRoaXMsIHYpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBWZWN0b3IgQ3Jvc3MtUHJvZHVjdFxuICAgICAqIEBwYXJhbSB7VmVjdG9yNH0gdiBUaGUgc2Vjb25kIHZlY3RvciB0byBhcHBseSB0aGUgcHJvZHVjdCB0b1xuICAgICAqIEByZXR1cm5zIHtWZWN0b3I0fSBUaGUgQ3Jvc3MtUHJvZHVjdCBvZiB0aGlzIGFuZCB2LlxuICAgICAqL1xuICAgIGNyb3NzKHYpIHtcbiAgICAgICAgcmV0dXJuIHZlY3Rvci5jcm9zcyh0aGlzLCB2KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIHJlcXVpcmVkIGZvciBtYXRyaXggZGVjb21wb3NpdGlvblxuICAgICAqIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiBwc2V1ZG8gY29kZSBhdmFpbGFibGUgZnJvbSBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLTJkLXRyYW5zZm9ybXMvI21hdHJpeC1kZWNvbXBvc2l0aW9uXG4gICAgICogQHBhcmFtIHtWZWN0b3I0fSBhUG9pbnQgQSAzRCBwb2ludFxuICAgICAqIEBwYXJhbSB7ZmxvYXR9IGFzY2xcbiAgICAgKiBAcGFyYW0ge2Zsb2F0fSBic2NsXG4gICAgICogQHJldHVybnMge1ZlY3RvcjR9XG4gICAgICovXG4gICAgY29tYmluZShiUG9pbnQsIGFzY2wsIGJzY2wpIHtcbiAgICAgICAgcmV0dXJuIHZlY3Rvci5jb21iaW5lKHRoaXMsIGJQb2ludCwgYXNjbCwgYnNjbCk7XG4gICAgfSxcblxuICAgIG11bHRpcGx5QnlNYXRyaXggKG1hdHJpeCkge1xuICAgICAgICByZXR1cm4gdmVjdG9yLm11bHRpcGx5QnlNYXRyaXgodGhpcywgbWF0cml4KTtcbiAgICB9XG59OyIsIi8qKlxuICogIENvbnZlcnRzIGFuZ2xlcyBpbiBkZWdyZWVzLCB3aGljaCBhcmUgdXNlZCBieSB0aGUgZXh0ZXJuYWwgQVBJLCB0byBhbmdsZXNcbiAqICBpbiByYWRpYW5zIHVzZWQgaW4gaW50ZXJuYWwgY2FsY3VsYXRpb25zLlxuICogIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIEFuIGFuZ2xlIGluIGRlZ3JlZXMuXG4gKiAgQHJldHVybnMge251bWJlcn0gcmFkaWFuc1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IGFuZ2xlID0+IGFuZ2xlICogTWF0aC5QSSAvIDE4MDtcbiIsImNvbnN0IGRlZzJyYWQgPSByZXF1aXJlKCcuL2RlZzJyYWQnKTtcbmNvbnN0IG1hdHJpeCA9IHJlcXVpcmUoJy4vbWF0cml4Jyk7XG5jb25zdCB0cmFuc3AgPSByZXF1aXJlKCcuL3RyYW5zcCcpO1xuXG4vLyBBU0NJSSBjaGFyIDk3ID09ICdhJ1xuY29uc3QgaW5kZXhUb0tleTJkID0gaW5kZXggPT4gU3RyaW5nLmZyb21DaGFyQ29kZShpbmRleCArIDk3KTtcblxuY29uc3QgaW5kZXhUb0tleTNkID0gaW5kZXggPT4gKCdtJyArIChNYXRoLmZsb29yKGluZGV4IC8gNCkgKyAxKSkgKyAoaW5kZXggJSA0ICsgMSk7XG5cbmNvbnN0IHBvaW50czJkID0gW1xuICAgICdtMTEnLCAvLyBhXG4gICAgJ20xMicsIC8vIGJcbiAgICAnbTIxJywgLy8gY1xuICAgICdtMjInLCAvLyBkXG4gICAgJ200MScsIC8vIGVcbiAgICAnbTQyJyAgLy8gZlxuXTtcblxuY29uc3QgcG9pbnRzM2QgPSBbXG4gICAgJ20xMScsICdtMTInLCAnbTEzJywgJ20xNCcsXG4gICAgJ20yMScsICdtMjInLCAnbTIzJywgJ20yNCcsXG4gICAgJ20zMScsICdtMzInLCAnbTMzJywgJ20zNCcsXG4gICAgJ200MScsICdtNDInLCAnbTQzJywgJ200NCdcbl07XG5cbmNvbnN0IGxvb2t1cFRvRml4ZWQgPSBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuIHRoaXNbcF0udG9GaXhlZCg2KTtcbn07XG5cbi8qKlxuICogIEdpdmVuIGEgQ1NTIHRyYW5zZm9ybSBzdHJpbmcgKGxpa2UgYHJvdGF0ZSgzcmFkKWAsIG9yXG4gKiAgICBgbWF0cml4KDEsIDAsIDAsIDAsIDEsIDApYCksIHJldHVybiBhbiBpbnN0YW5jZSBjb21wYXRpYmxlIHdpdGhcbiAqICAgIFtgV2ViS2l0Q1NTTWF0cml4YF0oaHR0cDovL2RldmVsb3Blci5hcHBsZS5jb20vbGlicmFyeS9zYWZhcmkvZG9jdW1lbnRhdGlvbi9BdWRpb1ZpZGVvL1JlZmVyZW5jZS9XZWJLaXRDU1NNYXRyaXhDbGFzc1JlZmVyZW5jZS9XZWJLaXRDU1NNYXRyaXgvV2ViS2l0Q1NTTWF0cml4Lmh0bWwpXG4gKiAgQGNvbnN0cnVjdG9yXG4gKiAgQHBhcmFtIHtzdHJpbmd9IGRvbXN0ciAtIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgMkQgb3IgM0QgdHJhbnNmb3JtIG1hdHJpeFxuICogICAgaW4gdGhlIGZvcm0gZ2l2ZW4gYnkgdGhlIENTUyB0cmFuc2Zvcm0gcHJvcGVydHksIGkuZS4ganVzdCBsaWtlIHRoZVxuICogICAgb3V0cHV0IGZyb20gW1tAbGluayN0b1N0cmluZ11dLlxuICogIEByZXR1cm5zIHtYQ1NTTWF0cml4fSBtYXRyaXhcbiAqL1xuY29uc3QgWENTU01hdHJpeCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gWENTU01hdHJpeChzdHIpIHtcbiAgICB0aGlzLm0xMSA9IHRoaXMubTIyID0gdGhpcy5tMzMgPSB0aGlzLm00NCA9IDE7XG4gICAgICAgICAgICAgICB0aGlzLm0xMiA9IHRoaXMubTEzID0gdGhpcy5tMTQgPVxuICAgIHRoaXMubTIxID0gICAgICAgICAgICB0aGlzLm0yMyA9IHRoaXMubTI0ID1cbiAgICB0aGlzLm0zMSA9IHRoaXMubTMyID0gICAgICAgICAgICB0aGlzLm0zNCA9XG4gICAgdGhpcy5tNDEgPSB0aGlzLm00MiA9IHRoaXMubTQzICAgICAgICAgICAgPSAwO1xuXG4gICAgdGhpcy5zZXRNYXRyaXhWYWx1ZShzdHIpO1xufTtcblxuWENTU01hdHJpeC5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IFhDU1NNYXRyaXgsXG5cbiAgICAvKipcbiAgICAgKiAgTXVsdGlwbHkgb25lIG1hdHJpeCBieSBhbm90aGVyXG4gICAgICogIEBwYXJhbSB7WENTU01hdHJpeH0gb3RoZXJNYXRyaXggLSBUaGUgbWF0cml4IHRvIG11bHRpcGx5IHRoaXMgb25lIGJ5LlxuICAgICAqL1xuICAgIG11bHRpcGx5KG90aGVyTWF0cml4KSB7XG4gICAgICAgIHJldHVybiBtYXRyaXgubXVsdGlwbHkodGhpcywgb3RoZXJNYXRyaXgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiAgSWYgdGhlIG1hdHJpeCBpcyBpbnZlcnRpYmxlLCByZXR1cm5zIGl0cyBpbnZlcnNlLCBvdGhlcndpc2UgcmV0dXJucyBudWxsLlxuICAgICAqICBAcmV0dXJucyB7WENTU01hdHJpeHxudWxsfVxuICAgICAqL1xuICAgIGludmVyc2UoKSB7XG4gICAgICAgIHJldHVybiBtYXRyaXguaW52ZXJzZSh0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogIFJldHVybnMgdGhlIHJlc3VsdCBvZiByb3RhdGluZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxuICAgICAqXG4gICAgICogIElmIG9ubHkgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIHByb3ZpZGVkLCB0aGUgbWF0cml4IGlzIG9ubHkgcm90YXRlZCBhYm91dFxuICAgICAqICB0aGUgeiBheGlzLlxuICAgICAqICBAcGFyYW0ge251bWJlcn0gcm90WCAtIFRoZSByb3RhdGlvbiBhcm91bmQgdGhlIHggYXhpcy5cbiAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IHJvdFkgLSBUaGUgcm90YXRpb24gYXJvdW5kIHRoZSB5IGF4aXMuIElmIHVuZGVmaW5lZCwgdGhlIHggY29tcG9uZW50IGlzIHVzZWQuXG4gICAgICogIEBwYXJhbSB7bnVtYmVyfSByb3RaIC0gVGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeiBheGlzLiBJZiB1bmRlZmluZWQsIHRoZSB4IGNvbXBvbmVudCBpcyB1c2VkLlxuICAgICAqICBAcmV0dXJucyBYQ1NTTWF0cml4XG4gICAgICovXG4gICAgcm90YXRlKHJ4LCByeSwgcnopIHtcbiAgICAgICAgaWYgKHJ4ID09PSB1bmRlZmluZWQpIHsgcnggPSAwOyB9XG5cbiAgICAgICAgaWYgKHJ5ID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIHJ6ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJ6ID0gcng7XG4gICAgICAgICAgICByeCA9IDA7XG4gICAgICAgICAgICByeSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocnkgPT09IHVuZGVmaW5lZCkgeyByeSA9IDA7IH1cbiAgICAgICAgaWYgKHJ6ID09PSB1bmRlZmluZWQpIHsgcnogPSAwOyB9XG5cbiAgICAgICAgcnggPSBkZWcycmFkKHJ4KTtcbiAgICAgICAgcnkgPSBkZWcycmFkKHJ5KTtcbiAgICAgICAgcnogPSBkZWcycmFkKHJ6KTtcblxuICAgICAgICB2YXIgdHggPSBuZXcgWENTU01hdHJpeCgpLFxuICAgICAgICAgICAgdHkgPSBuZXcgWENTU01hdHJpeCgpLFxuICAgICAgICAgICAgdHogPSBuZXcgWENTU01hdHJpeCgpLFxuICAgICAgICAgICAgc2luQSwgY29zQSwgc3E7XG5cbiAgICAgICAgcnogLz0gMjtcbiAgICAgICAgc2luQSAgPSBNYXRoLnNpbihyeik7XG4gICAgICAgIGNvc0EgID0gTWF0aC5jb3MocnopO1xuICAgICAgICBzcSA9IHNpbkEgKiBzaW5BO1xuXG4gICAgICAgIC8vIE1hdHJpY2VzIGFyZSBpZGVudGl0eSBvdXRzaWRlIHRoZSBhc3NpZ25lZCB2YWx1ZXNcbiAgICAgICAgdHoubTExID0gdHoubTIyID0gMSAtIDIgKiBzcTtcbiAgICAgICAgdHoubTEyID0gdHoubTIxID0gMiAqIHNpbkEgKiBjb3NBO1xuICAgICAgICB0ei5tMjEgKj0gLTE7XG5cbiAgICAgICAgcnkgLz0gMjtcbiAgICAgICAgc2luQSAgPSBNYXRoLnNpbihyeSk7XG4gICAgICAgIGNvc0EgID0gTWF0aC5jb3MocnkpO1xuICAgICAgICBzcSA9IHNpbkEgKiBzaW5BO1xuXG4gICAgICAgIHR5Lm0xMSA9IHR5Lm0zMyA9IDEgLSAyICogc3E7XG4gICAgICAgIHR5Lm0xMyA9IHR5Lm0zMSA9IDIgKiBzaW5BICogY29zQTtcbiAgICAgICAgdHkubTEzICo9IC0xO1xuXG4gICAgICAgIHJ4IC89IDI7XG4gICAgICAgIHNpbkEgPSBNYXRoLnNpbihyeCk7XG4gICAgICAgIGNvc0EgPSBNYXRoLmNvcyhyeCk7XG4gICAgICAgIHNxID0gc2luQSAqIHNpbkE7XG5cbiAgICAgICAgdHgubTIyID0gdHgubTMzID0gMSAtIDIgKiBzcTtcbiAgICAgICAgdHgubTIzID0gdHgubTMyID0gMiAqIHNpbkEgKiBjb3NBO1xuICAgICAgICB0eC5tMzIgKj0gLTE7XG5cbiAgICAgICAgY29uc3QgaWRlbnRpdHlNYXRyaXggPSBuZXcgWENTU01hdHJpeCgpOyAvLyByZXR1cm5zIGlkZW50aXR5IG1hdHJpeCBieSBkZWZhdWx0XG4gICAgICAgIGNvbnN0IGlzSWRlbnRpdHkgICAgID0gdGhpcy50b1N0cmluZygpID09PSBpZGVudGl0eU1hdHJpeC50b1N0cmluZygpO1xuICAgICAgICBjb25zdCByb3RhdGVkTWF0cml4ICA9IGlzSWRlbnRpdHkgP1xuICAgICAgICAgICAgICAgIHR6Lm11bHRpcGx5KHR5KS5tdWx0aXBseSh0eCkgOlxuICAgICAgICAgICAgICAgIHRoaXMubXVsdGlwbHkodHgpLm11bHRpcGx5KHR5KS5tdWx0aXBseSh0eik7XG5cbiAgICAgICAgcmV0dXJuIHJvdGF0ZWRNYXRyaXg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBSZXR1cm5zIHRoZSByZXN1bHQgb2Ygc2NhbGluZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxuICAgICAqICBAcGFyYW0ge251bWJlcn0gc2NhbGVYIC0gdGhlIHNjYWxpbmcgZmFjdG9yIGluIHRoZSB4IGF4aXMuXG4gICAgICogIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVkgLSB0aGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHkgYXhpcy4gSWYgdW5kZWZpbmVkLCB0aGUgeCBjb21wb25lbnQgaXMgdXNlZC5cbiAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IHNjYWxlWiAtIHRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeiBheGlzLiBJZiB1bmRlZmluZWQsIDEgaXMgdXNlZC5cbiAgICAgKiAgQHJldHVybnMgWENTU01hdHJpeFxuICAgICAqL1xuICAgIHNjYWxlKHNjYWxlWCwgc2NhbGVZLCBzY2FsZVopIHtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gbmV3IFhDU1NNYXRyaXgoKTtcblxuICAgICAgICBpZiAoc2NhbGVYID09PSB1bmRlZmluZWQpIHsgc2NhbGVYID0gMTsgfVxuICAgICAgICBpZiAoc2NhbGVZID09PSB1bmRlZmluZWQpIHsgc2NhbGVZID0gc2NhbGVYOyB9XG4gICAgICAgIGlmICghc2NhbGVaKSB7IHNjYWxlWiA9IDE7IH1cblxuICAgICAgICB0cmFuc2Zvcm0ubTExID0gc2NhbGVYO1xuICAgICAgICB0cmFuc2Zvcm0ubTIyID0gc2NhbGVZO1xuICAgICAgICB0cmFuc2Zvcm0ubTMzID0gc2NhbGVaO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KHRyYW5zZm9ybSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBSZXR1cm5zIHRoZSByZXN1bHQgb2Ygc2tld2luZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxuICAgICAqICBAcGFyYW0ge251bWJlcn0gc2tld1ggLSBUaGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHggYXhpcy5cbiAgICAgKiAgQHJldHVybnMgWENTU01hdHJpeFxuICAgICAqL1xuICAgIHNrZXdYKGRlZ3JlZXMpIHtcbiAgICAgICAgY29uc3QgcmFkaWFucyAgID0gZGVnMnJhZChkZWdyZWVzKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gbmV3IFhDU1NNYXRyaXgoKTtcblxuICAgICAgICB0cmFuc2Zvcm0uYyA9IE1hdGgudGFuKHJhZGlhbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KHRyYW5zZm9ybSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBSZXR1cm5zIHRoZSByZXN1bHQgb2Ygc2tld2luZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxuICAgICAqICBAcGFyYW0ge251bWJlcn0gc2tld1kgLSB0aGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHggYXhpcy5cbiAgICAgKiAgQHJldHVybnMgWENTU01hdHJpeFxuICAgICAqL1xuICAgIHNrZXdZKGRlZ3JlZXMpIHtcbiAgICAgICAgY29uc3QgcmFkaWFucyAgID0gZGVnMnJhZChkZWdyZWVzKTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gbmV3IFhDU1NNYXRyaXgoKTtcblxuICAgICAgICB0cmFuc2Zvcm0uYiA9IE1hdGgudGFuKHJhZGlhbnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KHRyYW5zZm9ybSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBSZXR1cm5zIHRoZSByZXN1bHQgb2YgdHJhbnNsYXRpbmcgdGhlIG1hdHJpeCBieSBhIGdpdmVuIHZlY3Rvci5cbiAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgeCBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cbiAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cbiAgICAgKiAgQHBhcmFtIHtudW1iZXJ9IHogLSBUaGUgeiBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci4gSWYgdW5kZWZpbmVkLCAwIGlzIHVzZWQuXG4gICAgICogIEByZXR1cm5zIFhDU1NNYXRyaXhcbiAgICAgKi9cbiAgICB0cmFuc2xhdGUoeCwgeSwgeikge1xuICAgICAgICBjb25zdCB0ID0gbmV3IFhDU1NNYXRyaXgoKTtcblxuICAgICAgICBpZiAoeCA9PT0gdW5kZWZpbmVkKSB7IHggPSAwOyB9XG4gICAgICAgIGlmICh5ID09PSB1bmRlZmluZWQpIHsgeSA9IDA7IH1cbiAgICAgICAgaWYgKHogPT09IHVuZGVmaW5lZCkgeyB6ID0gMDsgfVxuXG4gICAgICAgIHQubTQxID0geDtcbiAgICAgICAgdC5tNDIgPSB5O1xuICAgICAgICB0Lm00MyA9IHo7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkodCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqICBTZXRzIHRoZSBtYXRyaXggdmFsdWVzIHVzaW5nIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uLCBzdWNoIGFzIHRoYXQgcHJvZHVjZWRcbiAgICAgKiAgYnkgdGhlIFtbWENTU01hdHJpeCN0b1N0cmluZ11dIG1ldGhvZC5cbiAgICAgKiAgQHBhcmFtcyB7c3RyaW5nfSBkb21zdHIgLSBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIDJEIG9yIDNEIHRyYW5zZm9ybSBtYXRyaXhcbiAgICAgKiAgICBpbiB0aGUgZm9ybSBnaXZlbiBieSB0aGUgQ1NTIHRyYW5zZm9ybSBwcm9wZXJ0eSwgaS5lLiBqdXN0IGxpa2UgdGhlXG4gICAgICogICAgb3V0cHV0IGZyb20gW1tYQ1NTTWF0cml4I3RvU3RyaW5nXV0uXG4gICAgICogIEByZXR1cm5zIHVuZGVmaW5lZFxuICAgICAqL1xuICAgIHNldE1hdHJpeFZhbHVlKGRvbXN0cikge1xuICAgICAgICBpZiAoIWRvbXN0cikgeyByZXR1cm47IH1cblxuICAgICAgICB2YXIgbWF0cml4T2JqZWN0ID0gdHJhbnNwKGRvbXN0cik7XG4gICAgICAgIGlmICghbWF0cml4T2JqZWN0KSB7IHJldHVybjsgfVxuXG4gICAgICAgIHZhciBpczNkICAgPSBtYXRyaXhPYmplY3Qua2V5ID09PSAnbWF0cml4M2QnO1xuICAgICAgICB2YXIga2V5Z2VuID0gaXMzZCA/IGluZGV4VG9LZXkzZCA6IGluZGV4VG9LZXkyZDtcbiAgICAgICAgdmFyIHZhbHVlcyA9IG1hdHJpeE9iamVjdC52YWx1ZTtcbiAgICAgICAgdmFyIGNvdW50ICA9IHZhbHVlcy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKChpczNkICYmIGNvdW50ICE9PSAxNikgfHwgIShpczNkIHx8IGNvdW50ID09PSA2KSkgeyByZXR1cm47IH1cblxuICAgICAgICB2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbihvYmosIGlkeCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGtleWdlbihpZHgpO1xuICAgICAgICAgICAgdGhpc1trZXldID0gb2JqLnZhbHVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgZGVjb21wb3NlKCkge1xuICAgICAgICByZXR1cm4gbWF0cml4LmRlY29tcG9zZSh0aGlzKTtcbiAgICB9LFxuXG4gICAgY29tcG9zZSh7XG4gICAgICAgIHgsIHksIHosXG4gICAgICAgIHJvdGF0ZVgsIHJvdGF0ZVksIHJvdGF0ZVosXG4gICAgICAgIHNjYWxlWCwgc2NhbGVZLCBzY2FsZVosXG4gICAgICAgIHNrZXdYLCBza2V3WVxuICAgIH0pIHtcbiAgICAgICAgbGV0IG0gPSB0aGlzO1xuICAgICAgICBtID0gbS50cmFuc2xhdGUoeCwgeSwgeik7XG4gICAgICAgIG0gPSBtLnJvdGF0ZShyb3RhdGVYLCByb3RhdGVZLCByb3RhdGVaKTtcbiAgICAgICAgbSA9IG0uc2NhbGUoc2NhbGVYLCBzY2FsZVksIHNjYWxlWik7XG4gICAgICAgIGlmIChza2V3WCAhPT0gdW5kZWZpbmVkKSB7IG0gPSBtLnNrZXdYKHNrZXdYKTsgfVxuICAgICAgICBpZiAoc2tld1kgIT09IHVuZGVmaW5lZCkgeyBtID0gbS5za2V3WShza2V3WSk7IH1cblxuICAgICAgICByZXR1cm4gbTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG1hdHJpeC5cbiAgICAgKiAgQHJldHVybnMge3N0cmluZ30gbWF0cml4U3RyaW5nIC0gYSBzdHJpbmcgbGlrZSBgbWF0cml4KDEuMDAwMDAwLCAwLjAwMDAwMCwgMC4wMDAwMDAsIDEuMDAwMDAwLCAwLjAwMDAwMCwgMC4wMDAwMDApYFxuICAgICAqXG4gICAgICoqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICBsZXQgcG9pbnRzLCBwcmVmaXg7XG5cbiAgICAgICAgaWYgKG1hdHJpeC5pc0FmZmluZSh0aGlzKSkge1xuICAgICAgICAgICAgcHJlZml4ID0gJ21hdHJpeCc7XG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMyZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByZWZpeCA9ICdtYXRyaXgzZCc7XG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMzZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBgJHtwcmVmaXh9KCR7cG9pbnRzLm1hcChsb29rdXBUb0ZpeGVkLCB0aGlzKS5qb2luKCcsICcpfSlgO1xuICAgIH1cbn07IiwiY29uc3QgVmVjdG9yNCA9IHJlcXVpcmUoJy4vVmVjdG9yNCcpO1xuXG4vKipcbiAqICBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIDJ4MiBtYXRyaXguXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGEgLSBUb3AtbGVmdCB2YWx1ZSBvZiB0aGUgbWF0cml4LlxuICogIEBwYXJhbSB7bnVtYmVyfSBiIC0gVG9wLXJpZ2h0IHZhbHVlIG9mIHRoZSBtYXRyaXguXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGMgLSBCb3R0b20tbGVmdCB2YWx1ZSBvZiB0aGUgbWF0cml4LlxuICogIEBwYXJhbSB7bnVtYmVyfSBkIC0gQm90dG9tLXJpZ2h0IHZhbHVlIG9mIHRoZSBtYXRyaXguXG4gKiAgQHJldHVybnMge251bWJlcn1cbiAqL1xuY29uc3QgZGV0ZXJtaW5hbnQyeDIgPSBmdW5jdGlvbihhLCBiLCBjLCBkKSB7XG4gICAgcmV0dXJuIGEgKiBkIC0gYiAqIGM7XG59O1xuXG4vKipcbiAqICBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIDN4MyBtYXRyaXguXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGExIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFsxLCAxXS5cbiAqICBAcGFyYW0ge251bWJlcn0gYTIgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzEsIDJdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBhMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMSwgM10uXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGIxIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFsyLCAxXS5cbiAqICBAcGFyYW0ge251bWJlcn0gYjIgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzIsIDJdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBiMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMiwgM10uXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGMxIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFszLCAxXS5cbiAqICBAcGFyYW0ge251bWJlcn0gYzIgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzMsIDJdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBjMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMywgM10uXG4gKiAgQHJldHVybnMge251bWJlcn1cbiAqL1xuY29uc3QgZGV0ZXJtaW5hbnQzeDMgPSBmdW5jdGlvbihhMSwgYTIsIGEzLCBiMSwgYjIsIGIzLCBjMSwgYzIsIGMzKSB7XG4gICAgcmV0dXJuIGExICogZGV0ZXJtaW5hbnQyeDIoYjIsIGIzLCBjMiwgYzMpIC1cbiAgICAgICAgYjEgKiBkZXRlcm1pbmFudDJ4MihhMiwgYTMsIGMyLCBjMykgK1xuICAgICAgICBjMSAqIGRldGVybWluYW50MngyKGEyLCBhMywgYjIsIGIzKTtcbn07XG5cbi8qKlxuICogIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgNHg0IG1hdHJpeC5cbiAqICBAcGFyYW0ge1hDU1NNYXRyaXh9IG1hdHJpeCAtIFRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudCBvZi5cbiAqICBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5jb25zdCBkZXRlcm1pbmFudDR4NCA9IGZ1bmN0aW9uKG1hdHJpeCkge1xuICAgIHZhciBtID0gbWF0cml4LFxuICAgICAgICAvLyBBc3NpZ24gdG8gaW5kaXZpZHVhbCB2YXJpYWJsZSBuYW1lcyB0byBhaWQgc2VsZWN0aW5nIGNvcnJlY3QgZWxlbWVudHNcbiAgICAgICAgYTEgPSBtLm0xMSwgYjEgPSBtLm0yMSwgYzEgPSBtLm0zMSwgZDEgPSBtLm00MSxcbiAgICAgICAgYTIgPSBtLm0xMiwgYjIgPSBtLm0yMiwgYzIgPSBtLm0zMiwgZDIgPSBtLm00MixcbiAgICAgICAgYTMgPSBtLm0xMywgYjMgPSBtLm0yMywgYzMgPSBtLm0zMywgZDMgPSBtLm00MyxcbiAgICAgICAgYTQgPSBtLm0xNCwgYjQgPSBtLm0yNCwgYzQgPSBtLm0zNCwgZDQgPSBtLm00NDtcblxuICAgIHJldHVybiBhMSAqIGRldGVybWluYW50M3gzKGIyLCBiMywgYjQsIGMyLCBjMywgYzQsIGQyLCBkMywgZDQpIC1cbiAgICAgICAgYjEgKiBkZXRlcm1pbmFudDN4MyhhMiwgYTMsIGE0LCBjMiwgYzMsIGM0LCBkMiwgZDMsIGQ0KSArXG4gICAgICAgIGMxICogZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgZDIsIGQzLCBkNCkgLVxuICAgICAgICBkMSAqIGRldGVybWluYW50M3gzKGEyLCBhMywgYTQsIGIyLCBiMywgYjQsIGMyLCBjMywgYzQpO1xufTtcblxuLyoqXG4gKiAgRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBtYXRyaXggaXMgYWZmaW5lLlxuICogIEByZXR1cm5zIHtib29sZWFufVxuICovXG5jb25zdCBpc0FmZmluZSA9IGZ1bmN0aW9uKG0pIHtcbiAgICByZXR1cm4gbS5tMTMgPT09IDAgJiYgbS5tMTQgPT09IDAgJiZcbiAgICAgICAgbS5tMjMgPT09IDAgJiYgbS5tMjQgPT09IDAgJiZcbiAgICAgICAgbS5tMzEgPT09IDAgJiYgbS5tMzIgPT09IDAgJiZcbiAgICAgICAgbS5tMzMgPT09IDEgJiYgbS5tMzQgPT09IDAgJiZcbiAgICAgICAgbS5tNDMgPT09IDAgJiYgbS5tNDQgPT09IDE7XG59O1xuXG4vKipcbiAqICBSZXR1cm5zIHdoZXRoZXIgdGhlIG1hdHJpeCBpcyB0aGUgaWRlbnRpdHkgbWF0cml4IG9yIGEgdHJhbnNsYXRpb24gbWF0cml4LlxuICogIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzSWRlbnRpdHlPclRyYW5zbGF0aW9uID0gZnVuY3Rpb24obSkge1xuICAgIHJldHVybiBtLm0xMSA9PT0gMSAmJiBtLm0xMiA9PT0gMCAmJiBtLm0xMyA9PT0gMCAmJiBtLm0xNCA9PT0gMCAmJlxuICAgICAgICBtLm0yMSA9PT0gMCAmJiBtLm0yMiA9PT0gMSAmJiBtLm0yMyA9PT0gMCAmJiBtLm0yNCA9PT0gMCAmJlxuICAgICAgICBtLm0zMSA9PT0gMCAmJiBtLm0zMSA9PT0gMCAmJiBtLm0zMyA9PT0gMSAmJiBtLm0zNCA9PT0gMCAmJlxuICAgICAgICAvLyBtNDEsIG00MiBhbmQgbTQzIGFyZSB0aGUgdHJhbnNsYXRpb24gcG9pbnRzXG4gICAgICAgIG0ubTQ0ID09PSAxO1xufTtcblxuLyoqXG4gKiAgUmV0dXJucyB0aGUgYWRqb2ludCBtYXRyaXguXG4gKiAgQHJldHVybiB7WENTU01hdHJpeH1cbiAqL1xuY29uc3QgYWRqb2ludCA9IGZ1bmN0aW9uKG0pIHtcbiAgICAvLyBtYWtlIGByZXN1bHRgIHRoZSBzYW1lIHR5cGUgYXMgdGhlIGdpdmVuIG1ldHJpY1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBtLmNvbnN0cnVjdG9yKCksXG4gICAgICAgIGExID0gbS5tMTEsIGIxID0gbS5tMTIsIGMxID0gbS5tMTMsIGQxID0gbS5tMTQsXG4gICAgICAgIGEyID0gbS5tMjEsIGIyID0gbS5tMjIsIGMyID0gbS5tMjMsIGQyID0gbS5tMjQsXG4gICAgICAgIGEzID0gbS5tMzEsIGIzID0gbS5tMzIsIGMzID0gbS5tMzMsIGQzID0gbS5tMzQsXG4gICAgICAgIGE0ID0gbS5tNDEsIGI0ID0gbS5tNDIsIGM0ID0gbS5tNDMsIGQ0ID0gbS5tNDQ7XG5cbiAgICAvLyBSb3cgY29sdW1uIGxhYmVsaW5nIHJldmVyc2VkIHNpbmNlIHdlIHRyYW5zcG9zZSByb3dzICYgY29sdW1uc1xuICAgIHJlc3VsdC5tMTEgPSAgZGV0ZXJtaW5hbnQzeDMoYjIsIGIzLCBiNCwgYzIsIGMzLCBjNCwgZDIsIGQzLCBkNCk7XG4gICAgcmVzdWx0Lm0yMSA9IC1kZXRlcm1pbmFudDN4MyhhMiwgYTMsIGE0LCBjMiwgYzMsIGM0LCBkMiwgZDMsIGQ0KTtcbiAgICByZXN1bHQubTMxID0gIGRldGVybWluYW50M3gzKGEyLCBhMywgYTQsIGIyLCBiMywgYjQsIGQyLCBkMywgZDQpO1xuICAgIHJlc3VsdC5tNDEgPSAtZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgYzIsIGMzLCBjNCk7XG5cbiAgICByZXN1bHQubTEyID0gLWRldGVybWluYW50M3gzKGIxLCBiMywgYjQsIGMxLCBjMywgYzQsIGQxLCBkMywgZDQpO1xuICAgIHJlc3VsdC5tMjIgPSAgZGV0ZXJtaW5hbnQzeDMoYTEsIGEzLCBhNCwgYzEsIGMzLCBjNCwgZDEsIGQzLCBkNCk7XG4gICAgcmVzdWx0Lm0zMiA9IC1kZXRlcm1pbmFudDN4MyhhMSwgYTMsIGE0LCBiMSwgYjMsIGI0LCBkMSwgZDMsIGQ0KTtcbiAgICByZXN1bHQubTQyID0gIGRldGVybWluYW50M3gzKGExLCBhMywgYTQsIGIxLCBiMywgYjQsIGMxLCBjMywgYzQpO1xuXG4gICAgcmVzdWx0Lm0xMyA9ICBkZXRlcm1pbmFudDN4MyhiMSwgYjIsIGI0LCBjMSwgYzIsIGM0LCBkMSwgZDIsIGQ0KTtcbiAgICByZXN1bHQubTIzID0gLWRldGVybWluYW50M3gzKGExLCBhMiwgYTQsIGMxLCBjMiwgYzQsIGQxLCBkMiwgZDQpO1xuICAgIHJlc3VsdC5tMzMgPSAgZGV0ZXJtaW5hbnQzeDMoYTEsIGEyLCBhNCwgYjEsIGIyLCBiNCwgZDEsIGQyLCBkNCk7XG4gICAgcmVzdWx0Lm00MyA9IC1kZXRlcm1pbmFudDN4MyhhMSwgYTIsIGE0LCBiMSwgYjIsIGI0LCBjMSwgYzIsIGM0KTtcblxuICAgIHJlc3VsdC5tMTQgPSAtZGV0ZXJtaW5hbnQzeDMoYjEsIGIyLCBiMywgYzEsIGMyLCBjMywgZDEsIGQyLCBkMyk7XG4gICAgcmVzdWx0Lm0yNCA9ICBkZXRlcm1pbmFudDN4MyhhMSwgYTIsIGEzLCBjMSwgYzIsIGMzLCBkMSwgZDIsIGQzKTtcbiAgICByZXN1bHQubTM0ID0gLWRldGVybWluYW50M3gzKGExLCBhMiwgYTMsIGIxLCBiMiwgYjMsIGQxLCBkMiwgZDMpO1xuICAgIHJlc3VsdC5tNDQgPSAgZGV0ZXJtaW5hbnQzeDMoYTEsIGEyLCBhMywgYjEsIGIyLCBiMywgYzEsIGMyLCBjMyk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuY29uc3QgaW52ZXJzZSA9IGZ1bmN0aW9uKG1hdHJpeCkge1xuICAgIGxldCBpbnY7XG5cbiAgICBpZiAoaXNJZGVudGl0eU9yVHJhbnNsYXRpb24obWF0cml4KSkge1xuICAgICAgICBpbnYgPSBuZXcgbWF0cml4LmNvbnN0cnVjdG9yKCk7XG5cbiAgICAgICAgaWYgKCEobWF0cml4Lm00MSA9PT0gMCAmJiBtYXRyaXgubTQyID09PSAwICYmIG1hdHJpeC5tNDMgPT09IDApKSB7XG4gICAgICAgICAgICBpbnYubTQxID0gLW1hdHJpeC5tNDE7XG4gICAgICAgICAgICBpbnYubTQyID0gLW1hdHJpeC5tNDI7XG4gICAgICAgICAgICBpbnYubTQzID0gLW1hdHJpeC5tNDM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW52O1xuICAgIH1cblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgYWRqb2ludCBtYXRyaXhcbiAgICBjb25zdCByZXN1bHQgPSBhZGpvaW50KG1hdHJpeCk7XG5cbiAgICAvLyBDYWxjdWxhdGUgdGhlIDR4NCBkZXRlcm1pbmFudFxuICAgIGNvbnN0IGRldCA9IGRldGVybWluYW50NHg0KG1hdHJpeCk7XG5cbiAgICAvLyBJZiB0aGUgZGV0ZXJtaW5hbnQgaXMgemVybywgdGhlbiB0aGUgaW52ZXJzZSBtYXRyaXggaXMgbm90IHVuaXF1ZVxuICAgIGlmIChNYXRoLmFicyhkZXQpIDwgMWUtOCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgLy8gU2NhbGUgdGhlIGFkam9pbnQgbWF0cml4IHRvIGdldCB0aGUgaW52ZXJzZVxuICAgIGZvciAobGV0IGlkeCA9IDE7IGlkeCA8IDU7IGlkeCsrKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgNTsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHRbKCdtJyArIGlkeCkgKyBpXSAvPSBkZXQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuY29uc3QgbXVsdGlwbHkgPSBmdW5jdGlvbihtYXRyaXgsIG90aGVyTWF0cml4KSB7XG4gICAgaWYgKCFvdGhlck1hdHJpeCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgdmFyIGEgPSBvdGhlck1hdHJpeCxcbiAgICAgICAgYiA9IG1hdHJpeCxcbiAgICAgICAgYyA9IG5ldyBtYXRyaXguY29uc3RydWN0b3IoKTtcblxuICAgIGMubTExID0gYS5tMTEgKiBiLm0xMSArIGEubTEyICogYi5tMjEgKyBhLm0xMyAqIGIubTMxICsgYS5tMTQgKiBiLm00MTtcbiAgICBjLm0xMiA9IGEubTExICogYi5tMTIgKyBhLm0xMiAqIGIubTIyICsgYS5tMTMgKiBiLm0zMiArIGEubTE0ICogYi5tNDI7XG4gICAgYy5tMTMgPSBhLm0xMSAqIGIubTEzICsgYS5tMTIgKiBiLm0yMyArIGEubTEzICogYi5tMzMgKyBhLm0xNCAqIGIubTQzO1xuICAgIGMubTE0ID0gYS5tMTEgKiBiLm0xNCArIGEubTEyICogYi5tMjQgKyBhLm0xMyAqIGIubTM0ICsgYS5tMTQgKiBiLm00NDtcblxuICAgIGMubTIxID0gYS5tMjEgKiBiLm0xMSArIGEubTIyICogYi5tMjEgKyBhLm0yMyAqIGIubTMxICsgYS5tMjQgKiBiLm00MTtcbiAgICBjLm0yMiA9IGEubTIxICogYi5tMTIgKyBhLm0yMiAqIGIubTIyICsgYS5tMjMgKiBiLm0zMiArIGEubTI0ICogYi5tNDI7XG4gICAgYy5tMjMgPSBhLm0yMSAqIGIubTEzICsgYS5tMjIgKiBiLm0yMyArIGEubTIzICogYi5tMzMgKyBhLm0yNCAqIGIubTQzO1xuICAgIGMubTI0ID0gYS5tMjEgKiBiLm0xNCArIGEubTIyICogYi5tMjQgKyBhLm0yMyAqIGIubTM0ICsgYS5tMjQgKiBiLm00NDtcblxuICAgIGMubTMxID0gYS5tMzEgKiBiLm0xMSArIGEubTMyICogYi5tMjEgKyBhLm0zMyAqIGIubTMxICsgYS5tMzQgKiBiLm00MTtcbiAgICBjLm0zMiA9IGEubTMxICogYi5tMTIgKyBhLm0zMiAqIGIubTIyICsgYS5tMzMgKiBiLm0zMiArIGEubTM0ICogYi5tNDI7XG4gICAgYy5tMzMgPSBhLm0zMSAqIGIubTEzICsgYS5tMzIgKiBiLm0yMyArIGEubTMzICogYi5tMzMgKyBhLm0zNCAqIGIubTQzO1xuICAgIGMubTM0ID0gYS5tMzEgKiBiLm0xNCArIGEubTMyICogYi5tMjQgKyBhLm0zMyAqIGIubTM0ICsgYS5tMzQgKiBiLm00NDtcblxuICAgIGMubTQxID0gYS5tNDEgKiBiLm0xMSArIGEubTQyICogYi5tMjEgKyBhLm00MyAqIGIubTMxICsgYS5tNDQgKiBiLm00MTtcbiAgICBjLm00MiA9IGEubTQxICogYi5tMTIgKyBhLm00MiAqIGIubTIyICsgYS5tNDMgKiBiLm0zMiArIGEubTQ0ICogYi5tNDI7XG4gICAgYy5tNDMgPSBhLm00MSAqIGIubTEzICsgYS5tNDIgKiBiLm0yMyArIGEubTQzICogYi5tMzMgKyBhLm00NCAqIGIubTQzO1xuICAgIGMubTQ0ID0gYS5tNDEgKiBiLm0xNCArIGEubTQyICogYi5tMjQgKyBhLm00MyAqIGIubTM0ICsgYS5tNDQgKiBiLm00NDtcblxuICAgIHJldHVybiBjO1xufTtcblxuZnVuY3Rpb24gdHJhbnNwb3NlKG1hdHJpeCkge1xuICAgIHZhciByZXN1bHQgPSBuZXcgbWF0cml4LmNvbnN0cnVjdG9yKCk7XG4gICAgdmFyIHJvd3MgPSA0LCBjb2xzID0gNDtcbiAgICB2YXIgaSA9IGNvbHMsIGo7XG4gICAgd2hpbGUgKGkpIHtcbiAgICAgICAgaiA9IHJvd3M7XG4gICAgICAgIHdoaWxlIChqKSB7XG4gICAgICAgICAgICByZXN1bHRbJ20nICsgaSArIGpdID0gbWF0cml4WydtJyArIGogKyBpXTtcbiAgICAgICAgICAgIGotLTtcbiAgICAgICAgfVxuICAgICAgICBpLS07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogIElucHV0OiAgbWF0cml4ICAgICAgOyBhIDR4NCBtYXRyaXhcbiAqICBPdXRwdXQ6IHRyYW5zbGF0aW9uIDsgYSAzIGNvbXBvbmVudCB2ZWN0b3JcbiAqICAgICAgICAgIHNjYWxlICAgICAgIDsgYSAzIGNvbXBvbmVudCB2ZWN0b3JcbiAqICAgICAgICAgIHNrZXcgICAgICAgIDsgc2tldyBmYWN0b3JzIFhZLFhaLFlaIHJlcHJlc2VudGVkIGFzIGEgMyBjb21wb25lbnQgdmVjdG9yXG4gKiAgICAgICAgICBwZXJzcGVjdGl2ZSA7IGEgNCBjb21wb25lbnQgdmVjdG9yXG4gKiAgICAgICAgICByb3RhdGUgIDsgYSA0IGNvbXBvbmVudCB2ZWN0b3JcbiAqICBSZXR1cm5zIGZhbHNlIGlmIHRoZSBtYXRyaXggY2Fubm90IGJlIGRlY29tcG9zZWQsIHRydWUgaWYgaXQgY2FuXG4gKi9cbmZ1bmN0aW9uIGRlY29tcG9zZShtYXRyaXgpIHtcbiAgICBsZXQgcGVyc3BlY3RpdmVNYXRyaXgsXG4gICAgICAgIHJpZ2h0SGFuZFNpZGUsXG4gICAgICAgIGludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCxcbiAgICAgICAgdHJhbnNwb3NlZEludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCxcbiAgICAgICAgcGVyc3BlY3RpdmUsXG4gICAgICAgIHRyYW5zbGF0ZSxcbiAgICAgICAgcm93LFxuICAgICAgICBpLFxuICAgICAgICBsZW4sXG4gICAgICAgIHNjYWxlLFxuICAgICAgICBza2V3LFxuICAgICAgICBwZHVtMyxcbiAgICAgICAgcm90YXRlO1xuXG4gICAgLy8gTm9ybWFsaXplIHRoZSBtYXRyaXguXG4gICAgaWYgKG1hdHJpeC5tMzMgPT09IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8PSA0OyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPCA0OyBqKyspIHtcbiAgICAgICAgICAgIG1hdHJpeFsnbScgKyBpICsgal0gLz0gbWF0cml4Lm00NDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIHBlcnNwZWN0aXZlTWF0cml4IGlzIHVzZWQgdG8gc29sdmUgZm9yIHBlcnNwZWN0aXZlLCBidXQgaXQgYWxzbyBwcm92aWRlc1xuICAgIC8vIGFuIGVhc3kgd2F5IHRvIHRlc3QgZm9yIHNpbmd1bGFyaXR5IG9mIHRoZSB1cHBlciAzeDMgY29tcG9uZW50LlxuICAgIHBlcnNwZWN0aXZlTWF0cml4ID0gbWF0cml4O1xuICAgIHBlcnNwZWN0aXZlTWF0cml4Lm0xNCA9IDA7XG4gICAgcGVyc3BlY3RpdmVNYXRyaXgubTI0ID0gMDtcbiAgICBwZXJzcGVjdGl2ZU1hdHJpeC5tMzQgPSAwO1xuICAgIHBlcnNwZWN0aXZlTWF0cml4Lm00NCA9IDE7XG5cbiAgICBpZiAoZGV0ZXJtaW5hbnQ0eDQocGVyc3BlY3RpdmVNYXRyaXgpID09PSAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBGaXJzdCwgaXNvbGF0ZSBwZXJzcGVjdGl2ZS5cbiAgICBpZiAobWF0cml4Lm0xNCAhPT0gMCB8fCBtYXRyaXgubTI0ICE9PSAwIHx8IG1hdHJpeC5tMzQgIT09IDApIHtcbiAgICAgICAgLy8gcmlnaHRIYW5kU2lkZSBpcyB0aGUgcmlnaHQgaGFuZCBzaWRlIG9mIHRoZSBlcXVhdGlvbi5cbiAgICAgICAgcmlnaHRIYW5kU2lkZSA9IG5ldyBWZWN0b3I0KG1hdHJpeC5tMTQsIG1hdHJpeC5tMjQsIG1hdHJpeC5tMzQsIG1hdHJpeC5tNDQpO1xuXG4gICAgICAgIC8vIFNvbHZlIHRoZSBlcXVhdGlvbiBieSBpbnZlcnRpbmcgcGVyc3BlY3RpdmVNYXRyaXggYW5kIG11bHRpcGx5aW5nXG4gICAgICAgIC8vIHJpZ2h0SGFuZFNpZGUgYnkgdGhlIGludmVyc2UuXG4gICAgICAgIGludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCA9IGludmVyc2UocGVyc3BlY3RpdmVNYXRyaXgpO1xuICAgICAgICB0cmFuc3Bvc2VkSW52ZXJzZVBlcnNwZWN0aXZlTWF0cml4ID0gdHJhbnNwb3NlKGludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCk7XG4gICAgICAgIHBlcnNwZWN0aXZlID0gcmlnaHRIYW5kU2lkZS5tdWx0aXBseUJ5TWF0cml4KHRyYW5zcG9zZWRJbnZlcnNlUGVyc3BlY3RpdmVNYXRyaXgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gTm8gcGVyc3BlY3RpdmUuXG4gICAgICAgIHBlcnNwZWN0aXZlID0gbmV3IFZlY3RvcjQoMCwgMCwgMCwgMSk7XG4gICAgfVxuXG4gICAgLy8gTmV4dCB0YWtlIGNhcmUgb2YgdHJhbnNsYXRpb25cbiAgICAvLyBJZiBpdCdzIGEgMkQgbWF0cml4LCBlIGFuZCBmIHdpbGwgYmUgZmlsbGVkXG4gICAgdHJhbnNsYXRlID0gbmV3IFZlY3RvcjQobWF0cml4LmUgfHwgbWF0cml4Lm00MSwgbWF0cml4LmYgfHwgbWF0cml4Lm00MiwgbWF0cml4Lm00Myk7XG5cbiAgICAvLyBOb3cgZ2V0IHNjYWxlIGFuZCBzaGVhci4gJ3JvdycgaXMgYSAzIGVsZW1lbnQgYXJyYXkgb2YgMyBjb21wb25lbnQgdmVjdG9yc1xuICAgIHJvdyA9IFsgbmV3IFZlY3RvcjQoKSwgbmV3IFZlY3RvcjQoKSwgbmV3IFZlY3RvcjQoKSBdO1xuICAgIGZvciAoaSA9IDEsIGxlbiA9IHJvdy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICByb3dbaSAtIDFdLnggPSBtYXRyaXhbJ20nICsgaSArICcxJ107XG4gICAgICAgIHJvd1tpIC0gMV0ueSA9IG1hdHJpeFsnbScgKyBpICsgJzInXTtcbiAgICAgICAgcm93W2kgLSAxXS56ID0gbWF0cml4WydtJyArIGkgKyAnMyddO1xuICAgIH1cblxuICAgIC8vIENvbXB1dGUgWCBzY2FsZSBmYWN0b3IgYW5kIG5vcm1hbGl6ZSBmaXJzdCByb3cuXG4gICAgc2NhbGUgPSBuZXcgVmVjdG9yNCgpO1xuICAgIHNrZXcgPSBuZXcgVmVjdG9yNCgpO1xuXG4gICAgc2NhbGUueCA9IHJvd1swXS5sZW5ndGgoKTtcbiAgICByb3dbMF0gPSByb3dbMF0ubm9ybWFsaXplKCk7XG5cbiAgICAvLyBDb21wdXRlIFhZIHNoZWFyIGZhY3RvciBhbmQgbWFrZSAybmQgcm93IG9ydGhvZ29uYWwgdG8gMXN0LlxuICAgIHNrZXcueCA9IHJvd1swXS5kb3Qocm93WzFdKTtcbiAgICByb3dbMV0gPSByb3dbMV0uY29tYmluZShyb3dbMF0sIDEuMCwgLXNrZXcueCk7XG5cbiAgICAvLyBOb3csIGNvbXB1dGUgWSBzY2FsZSBhbmQgbm9ybWFsaXplIDJuZCByb3cuXG4gICAgc2NhbGUueSA9IHJvd1sxXS5sZW5ndGgoKTtcbiAgICByb3dbMV0gPSByb3dbMV0ubm9ybWFsaXplKCk7XG4gICAgc2tldy54IC89IHNjYWxlLnk7XG5cbiAgICAvLyBDb21wdXRlIFhaIGFuZCBZWiBzaGVhcnMsIG9ydGhvZ29uYWxpemUgM3JkIHJvd1xuICAgIHNrZXcueSA9IHJvd1swXS5kb3Qocm93WzJdKTtcbiAgICByb3dbMl0gPSByb3dbMl0uY29tYmluZShyb3dbMF0sIDEuMCwgLXNrZXcueSk7XG4gICAgc2tldy56ID0gcm93WzFdLmRvdChyb3dbMl0pO1xuICAgIHJvd1syXSA9IHJvd1syXS5jb21iaW5lKHJvd1sxXSwgMS4wLCAtc2tldy56KTtcblxuICAgIC8vIE5leHQsIGdldCBaIHNjYWxlIGFuZCBub3JtYWxpemUgM3JkIHJvdy5cbiAgICBzY2FsZS56ID0gcm93WzJdLmxlbmd0aCgpO1xuICAgIHJvd1syXSA9IHJvd1syXS5ub3JtYWxpemUoKTtcbiAgICBza2V3LnkgPSAoc2tldy55IC8gc2NhbGUueikgfHwgMDtcbiAgICBza2V3LnogPSAoc2tldy56IC8gc2NhbGUueikgfHwgMDtcblxuICAgIC8vIEF0IHRoaXMgcG9pbnQsIHRoZSBtYXRyaXggKGluIHJvd3MpIGlzIG9ydGhvbm9ybWFsLlxuICAgIC8vIENoZWNrIGZvciBhIGNvb3JkaW5hdGUgc3lzdGVtIGZsaXAuICBJZiB0aGUgZGV0ZXJtaW5hbnRcbiAgICAvLyBpcyAtMSwgdGhlbiBuZWdhdGUgdGhlIG1hdHJpeCBhbmQgdGhlIHNjYWxpbmcgZmFjdG9ycy5cbiAgICBwZHVtMyA9IHJvd1sxXS5jcm9zcyhyb3dbMl0pO1xuICAgIGlmIChyb3dbMF0uZG90KHBkdW0zKSA8IDApIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgICAgIHNjYWxlLnggKj0gLTE7XG4gICAgICAgICAgICByb3dbaV0ueCAqPSAtMTtcbiAgICAgICAgICAgIHJvd1tpXS55ICo9IC0xO1xuICAgICAgICAgICAgcm93W2ldLnogKj0gLTE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOb3csIGdldCB0aGUgcm90YXRpb25zIG91dFxuICAgIC8vIEZST00gVzNDXG4gICAgcm90YXRlID0gbmV3IFZlY3RvcjQoKTtcbiAgICByb3RhdGUueCA9IDAuNSAqIE1hdGguc3FydChNYXRoLm1heCgxICsgcm93WzBdLnggLSByb3dbMV0ueSAtIHJvd1syXS56LCAwKSk7XG4gICAgcm90YXRlLnkgPSAwLjUgKiBNYXRoLnNxcnQoTWF0aC5tYXgoMSAtIHJvd1swXS54ICsgcm93WzFdLnkgLSByb3dbMl0ueiwgMCkpO1xuICAgIHJvdGF0ZS56ID0gMC41ICogTWF0aC5zcXJ0KE1hdGgubWF4KDEgLSByb3dbMF0ueCAtIHJvd1sxXS55ICsgcm93WzJdLnosIDApKTtcbiAgICByb3RhdGUudyA9IDAuNSAqIE1hdGguc3FydChNYXRoLm1heCgxICsgcm93WzBdLnggKyByb3dbMV0ueSArIHJvd1syXS56LCAwKSk7XG5cbiAgICAvLyBpZiAocm93WzJdLnkgPiByb3dbMV0ueikgcm90YXRlWzBdID0gLXJvdGF0ZVswXTtcbiAgICAvLyBpZiAocm93WzBdLnogPiByb3dbMl0ueCkgcm90YXRlWzFdID0gLXJvdGF0ZVsxXTtcbiAgICAvLyBpZiAocm93WzFdLnggPiByb3dbMF0ueSkgcm90YXRlWzJdID0gLXJvdGF0ZVsyXTtcblxuICAgIC8vIEZST00gTU9SRi5KU1xuICAgIHJvdGF0ZS55ID0gTWF0aC5hc2luKC1yb3dbMF0ueik7XG4gICAgaWYgKE1hdGguY29zKHJvdGF0ZS55KSAhPT0gMCkge1xuICAgICAgICByb3RhdGUueCA9IE1hdGguYXRhbjIocm93WzFdLnosIHJvd1syXS56KTtcbiAgICAgICAgcm90YXRlLnogPSBNYXRoLmF0YW4yKHJvd1swXS55LCByb3dbMF0ueCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcm90YXRlLnggPSBNYXRoLmF0YW4yKC1yb3dbMl0ueCwgcm93WzFdLnkpO1xuICAgICAgICByb3RhdGUueiA9IDA7XG4gICAgfVxuXG4gICAgLy8gRlJPTSBodHRwOi8vYmxvZy5id2hpdGluZy5jby51ay8/cD0yNlxuICAgIC8vIHNjYWxlLngyID0gTWF0aC5zcXJ0KG1hdHJpeC5tMTEqbWF0cml4Lm0xMSArIG1hdHJpeC5tMjEqbWF0cml4Lm0yMSArIG1hdHJpeC5tMzEqbWF0cml4Lm0zMSk7XG4gICAgLy8gc2NhbGUueTIgPSBNYXRoLnNxcnQobWF0cml4Lm0xMiptYXRyaXgubTEyICsgbWF0cml4Lm0yMiptYXRyaXgubTIyICsgbWF0cml4Lm0zMiptYXRyaXgubTMyKTtcbiAgICAvLyBzY2FsZS56MiA9IE1hdGguc3FydChtYXRyaXgubTEzKm1hdHJpeC5tMTMgKyBtYXRyaXgubTIzKm1hdHJpeC5tMjMgKyBtYXRyaXgubTMzKm1hdHJpeC5tMzMpO1xuXG4gICAgLy8gcm90YXRlLngyID0gTWF0aC5hdGFuMihtYXRyaXgubTIzL3NjYWxlLnoyLCBtYXRyaXgubTMzL3NjYWxlLnoyKTtcbiAgICAvLyByb3RhdGUueTIgPSAtTWF0aC5hc2luKG1hdHJpeC5tMTMvc2NhbGUuejIpO1xuICAgIC8vIHJvdGF0ZS56MiA9IE1hdGguYXRhbjIobWF0cml4Lm0xMi9zY2FsZS55MiwgbWF0cml4Lm0xMS9zY2FsZS54Mik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBwZXJzcGVjdGl2ZSxcbiAgICAgICAgdHJhbnNsYXRlLFxuICAgICAgICBza2V3LFxuICAgICAgICBzY2FsZSxcbiAgICAgICAgcm90YXRlXG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZGVjb21wb3NlLFxuICAgIGlzQWZmaW5lLFxuICAgIGludmVyc2UsXG4gICAgbXVsdGlwbHlcbn07IiwiY29uc3QgdmFsdWVUb09iamVjdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgY29uc3QgdW5pdHMgPSAvKFtcXC1cXCtdP1swLTldK1tcXC4wLTldKikoZGVnfHJhZHxncmFkfHB4fCUpKi87XG4gICAgY29uc3QgcGFydHMgPSB2YWx1ZS5tYXRjaCh1bml0cykgfHwgW107XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogcGFyc2VGbG9hdChwYXJ0c1sxXSksXG4gICAgICAgIHVuaXRzOiBwYXJ0c1syXSxcbiAgICAgICAgdW5wYXJzZWQ6IHZhbHVlXG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RhdGVtZW50VG9PYmplY3Qoc3RhdGVtZW50LCBza2lwVmFsdWVzKSB7XG4gICAgY29uc3QgbmFtZUFuZEFyZ3MgICAgPSAvKFxcdyspXFwoKFteXFwpXSspXFwpL2k7XG4gICAgY29uc3Qgc3RhdGVtZW50UGFydHMgPSBzdGF0ZW1lbnQudG9TdHJpbmcoKS5tYXRjaChuYW1lQW5kQXJncykuc2xpY2UoMSk7XG4gICAgY29uc3QgZnVuY3Rpb25OYW1lICAgPSBzdGF0ZW1lbnRQYXJ0c1swXTtcbiAgICBjb25zdCBzdHJpbmdWYWx1ZXMgICA9IHN0YXRlbWVudFBhcnRzWzFdLnNwbGl0KC8sID8vKTtcbiAgICBjb25zdCBwYXJzZWRWYWx1ZXMgICA9ICFza2lwVmFsdWVzICYmIHN0cmluZ1ZhbHVlcy5tYXAodmFsdWVUb09iamVjdCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGZ1bmN0aW9uTmFtZSxcbiAgICAgICAgdmFsdWU6IHBhcnNlZFZhbHVlcyB8fCBzdHJpbmdWYWx1ZXMsXG4gICAgICAgIHVucGFyc2VkOiBzdGF0ZW1lbnRcbiAgICB9O1xufTsiLCIvKipcbiAqIEdldCB0aGUgbGVuZ3RoIG9mIHRoZSB2ZWN0b3JcbiAqIEByZXR1cm5zIHtmbG9hdH1cbiAqL1xuZnVuY3Rpb24gbGVuZ3RoKHZlY3Rvcikge1xuICAgIHJldHVybiBNYXRoLnNxcnQodmVjdG9yLnggKiB2ZWN0b3IueCArIHZlY3Rvci55ICogdmVjdG9yLnkgKyB2ZWN0b3IueiAqIHZlY3Rvci56KTtcbn1cblxuLyoqXG4gKiBHZXQgYSBub3JtYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqIEByZXR1cm5zIHtWZWN0b3I0fVxuICovXG5mdW5jdGlvbiBub3JtYWxpemUodmVjdG9yKSB7XG4gICAgdmFyIGxlbiA9IGxlbmd0aCh2ZWN0b3IpLFxuICAgICAgICB2ID0gbmV3IHZlY3Rvci5jb25zdHJ1Y3Rvcih2ZWN0b3IueCAvIGxlbiwgdmVjdG9yLnkgLyBsZW4sIHZlY3Rvci56IC8gbGVuKTtcblxuICAgIHJldHVybiB2O1xufVxuXG4vKipcbiAqIFZlY3RvciBEb3QtUHJvZHVjdFxuICogQHBhcmFtIHtWZWN0b3I0fSB2IFRoZSBzZWNvbmQgdmVjdG9yIHRvIGFwcGx5IHRoZSBwcm9kdWN0IHRvXG4gKiBAcmV0dXJucyB7ZmxvYXR9IFRoZSBEb3QtUHJvZHVjdCBvZiBhIGFuZCBiLlxuICovXG5mdW5jdGlvbiBkb3QoYSwgYikge1xuICAgIHJldHVybiBhLnggKiBiLnggKyBhLnkgKiBiLnkgKyBhLnogKiBiLnogKyBhLncgKiBiLnc7XG59XG5cbi8qKlxuICogVmVjdG9yIENyb3NzLVByb2R1Y3RcbiAqIEBwYXJhbSB7VmVjdG9yNH0gdiBUaGUgc2Vjb25kIHZlY3RvciB0byBhcHBseSB0aGUgcHJvZHVjdCB0b1xuICogQHJldHVybnMge1ZlY3RvcjR9IFRoZSBDcm9zcy1Qcm9kdWN0IG9mIGEgYW5kIGIuXG4gKi9cbmZ1bmN0aW9uIGNyb3NzKGEsIGIpIHtcbiAgICByZXR1cm4gbmV3IGEuY29uc3RydWN0b3IoXG4gICAgICAgIChhLnkgKiBiLnopIC0gKGEueiAqIGIueSksXG4gICAgICAgIChhLnogKiBiLngpIC0gKGEueCAqIGIueiksXG4gICAgICAgIChhLnggKiBiLnkpIC0gKGEueSAqIGIueClcbiAgICApO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiByZXF1aXJlZCBmb3IgbWF0cml4IGRlY29tcG9zaXRpb25cbiAqIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiBwc2V1ZG8gY29kZSBhdmFpbGFibGUgZnJvbSBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLTJkLXRyYW5zZm9ybXMvI21hdHJpeC1kZWNvbXBvc2l0aW9uXG4gKiBAcGFyYW0ge1ZlY3RvcjR9IGFQb2ludCBBIDNEIHBvaW50XG4gKiBAcGFyYW0ge2Zsb2F0fSBhc2NsXG4gKiBAcGFyYW0ge2Zsb2F0fSBic2NsXG4gKiBAcmV0dXJucyB7VmVjdG9yNH1cbiAqL1xuZnVuY3Rpb24gY29tYmluZShhUG9pbnQsIGJQb2ludCwgYXNjbCwgYnNjbCkge1xuICAgIHJldHVybiBuZXcgYVBvaW50LmNvbnN0cnVjdG9yKFxuICAgICAgICAoYXNjbCAqIGFQb2ludC54KSArIChic2NsICogYlBvaW50LngpLFxuICAgICAgICAoYXNjbCAqIGFQb2ludC55KSArIChic2NsICogYlBvaW50LnkpLFxuICAgICAgICAoYXNjbCAqIGFQb2ludC56KSArIChic2NsICogYlBvaW50LnopXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gbXVsdGlwbHlCeU1hdHJpeCh2ZWN0b3IsIG1hdHJpeCkge1xuICAgIHJldHVybiBuZXcgdmVjdG9yLmNvbnN0cnVjdG9yKFxuICAgICAgICAobWF0cml4Lm0xMSAqIHZlY3Rvci54KSArIChtYXRyaXgubTEyICogdmVjdG9yLnkpICsgKG1hdHJpeC5tMTMgKiB2ZWN0b3IueiksXG4gICAgICAgIChtYXRyaXgubTIxICogdmVjdG9yLngpICsgKG1hdHJpeC5tMjIgKiB2ZWN0b3IueSkgKyAobWF0cml4Lm0yMyAqIHZlY3Rvci56KSxcbiAgICAgICAgKG1hdHJpeC5tMzEgKiB2ZWN0b3IueCkgKyAobWF0cml4Lm0zMiAqIHZlY3Rvci55KSArIChtYXRyaXgubTMzICogdmVjdG9yLnopXG4gICAgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbGVuZ3RoLFxuICAgIG5vcm1hbGl6ZSxcbiAgICBkb3QsXG4gICAgY3Jvc3MsXG4gICAgY29tYmluZSxcbiAgICBtdWx0aXBseUJ5TWF0cml4XG59OyIsImNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG5jb25zdCBzZWxlY3RQcm9wID0gZnVuY3Rpb24oYXJyKSB7XG4gICAgdmFyIGlkeCA9IGFyci5sZW5ndGg7XG4gICAgd2hpbGUgKGlkeC0tKSB7XG4gICAgICAgIGlmIChkaXYuc3R5bGVbYXJyW2lkeF1dICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnJbaWR4XTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gc2VsZWN0UHJvcChbXG4gICAgJ3RyYW5zZm9ybScsXG4gICAgJ21zVHJhbnNmb3JtJyxcbiAgICAnb1RyYW5zZm9ybScsXG4gICAgJ21velRyYW5zZm9ybScsXG4gICAgJ3dlYmtpdFRyYW5zZm9ybSdcbl0pIHx8ICcnOyIsImNvbnN0IEVORF9WQUxVRSA9IDEwMDtcbmNvbnN0IFRPTEVSQU5DRSA9IDAuMDE7XG5jb25zdCBTUEVFRCAgICAgPSAxIC8gNjA7XG5cbmNvbnN0IGNhbGNBY2NlbGVyYXRpb24gPSBmdW5jdGlvbih0ZW5zaW9uLCB4LCBmcmljdGlvbiwgdmVsb2NpdHkpIHtcbiAgICByZXR1cm4gLXRlbnNpb24gKiB4IC0gZnJpY3Rpb24gKiB2ZWxvY2l0eTtcbn07XG5cbmNvbnN0IGNhbGNTdGF0ZSA9IGZ1bmN0aW9uKHN0YXRlLCBzcGVlZCkge1xuICAgIGNvbnN0IGR0ID0gc3BlZWQgKiAwLjU7XG4gICAgY29uc3QgeCAgICAgICAgPSBzdGF0ZS54O1xuICAgIGNvbnN0IHZlbG9jaXR5ID0gc3RhdGUudmVsb2NpdHk7XG4gICAgY29uc3QgdGVuc2lvbiAgPSBzdGF0ZS50ZW5zaW9uO1xuICAgIGNvbnN0IGZyaWN0aW9uID0gc3RhdGUuZnJpY3Rpb247XG5cbiAgICBjb25zdCBhRHggPSB2ZWxvY2l0eTtcbiAgICBjb25zdCBhRHYgPSBjYWxjQWNjZWxlcmF0aW9uKHRlbnNpb24sIHgsIGZyaWN0aW9uLCB2ZWxvY2l0eSk7XG5cbiAgICBjb25zdCBiRHggPSB2ZWxvY2l0eSArIGFEdiAqIGR0O1xuICAgIGNvbnN0IGJFbmRYID0geCArIGFEeCAqIGR0O1xuICAgIGNvbnN0IGJEdiA9IGNhbGNBY2NlbGVyYXRpb24odGVuc2lvbiwgYkVuZFgsIGZyaWN0aW9uLCBiRHgpO1xuXG4gICAgY29uc3QgY0R4ID0gdmVsb2NpdHkgKyBiRHYgKiBkdDtcbiAgICBjb25zdCBjRW5kWCA9IHggKyBiRHggKiBkdDtcbiAgICBjb25zdCBjRHYgPSBjYWxjQWNjZWxlcmF0aW9uKHRlbnNpb24sIGNFbmRYLCBmcmljdGlvbiwgY0R4KTtcblxuICAgIGNvbnN0IGREeCA9IHZlbG9jaXR5ICsgY0R2ICogZHQ7XG4gICAgY29uc3QgZEVuZFggPSB4ICsgY0R4ICogZHQ7XG4gICAgY29uc3QgZER2ID0gY2FsY0FjY2VsZXJhdGlvbih0ZW5zaW9uLCBkRW5kWCwgZnJpY3Rpb24sIGREeCk7XG5cbiAgICBjb25zdCBkeGR0ID0gKDEgLyA2KSAqIChhRHggKyAyICogKGJEeCArIGNEeCkgKyBkRHgpO1xuICAgIGNvbnN0IGR2ZHQgPSAoMSAvIDYpICogKGFEdiArIDIgKiAoYkR2ICsgY0R2KSArIGREdik7XG5cbiAgICBzdGF0ZS54ICAgICAgICA9IHggKyBkeGR0ICogc3BlZWQ7XG4gICAgc3RhdGUudmVsb2NpdHkgPSBhRHggKyBkdmR0ICogc3BlZWQ7XG5cbiAgICByZXR1cm4gc3RhdGU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNwcmluZygpIHtcbiAgICBsZXQgdmVsb2NpdHkgICAgICAgPSAwO1xuICAgIGxldCB0ZW5zaW9uICAgICAgICA9IDgwO1xuICAgIGxldCBmcmljdGlvbiAgICAgICA9IDg7XG5cbiAgICBsZXQgcmVwZWF0ICAgICAgICAgICA9IDA7XG4gICAgbGV0IG9yaWdpbmFsVmVsb2NpdHkgPSAwO1xuICAgIGxldCBvcmlnaW5hbFRlbnNpb24gID0gODA7XG4gICAgbGV0IG9yaWdpbmFsRnJpY3Rpb24gPSA4O1xuICAgIGxldCB2YWx1ZSAgICAgICAgICAgID0gMDtcbiAgICBsZXQgaXNQYXVzZWQgICAgICAgICA9IGZhbHNlO1xuXG4gICAgLy8gU3RvcmVzIHggYW5kIHZlbG9jaXR5IHRvIGRvXG4gICAgLy8gY2FsY3VsYXRpb25zIGFnYWluc3Qgc28gdGhhdFxuICAgIC8vIHdlIGNhbiBoYXZlIG11bHRpcGxlIHJldHVyblxuICAgIC8vIHZhbHVlcyBmcm9tIGNhbGNTdGF0ZVxuICAgIGNvbnN0IHN0YXRlID0ge307XG5cbiAgICBsZXQgdXBkYXRlQ2FsbGJhY2s7XG4gICAgbGV0IGNvbXBsZXRlQ2FsbGJhY2s7XG4gICAgbGV0IHJldmVyc2VDYWxsYmFjaztcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlZ2lzdGVyQ2FsbGJhY2tzKG9iaikge1xuICAgICAgICAgICAgdXBkYXRlQ2FsbGJhY2sgICA9IG9iai5vblVwZGF0ZTtcbiAgICAgICAgICAgIGNvbXBsZXRlQ2FsbGJhY2sgPSBvYmoub25Db21wbGV0ZTtcbiAgICAgICAgICAgIHJldmVyc2VDYWxsYmFjayAgPSBvYmoub25SZXZlcnNlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVwZWF0KHRpbWVzKSB7XG4gICAgICAgICAgICByZXBlYXQgPSB0aW1lcztcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldCh0LCBmLCB2KSB7XG4gICAgICAgICAgICBpZiAodiAhPT0gdW5kZWZpbmVkKSB7IHZlbG9jaXR5ID0gb3JpZ2luYWxWZWxvY2l0eSA9IHY7IH1cbiAgICAgICAgICAgIGlmICh0ICE9PSB1bmRlZmluZWQpIHsgdGVuc2lvbiA9IG9yaWdpbmFsVGVuc2lvbiA9IHQ7ICB9XG4gICAgICAgICAgICBpZiAoZiAhPT0gdW5kZWZpbmVkKSB7IGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbiA9IGY7IH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRlbnNpb24odCkge1xuICAgICAgICAgICAgdGVuc2lvbiA9IG9yaWdpbmFsVGVuc2lvbiA9IHQ7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBmcmljdGlvbihmKSB7XG4gICAgICAgICAgICBmcmljdGlvbiA9IG9yaWdpbmFsRnJpY3Rpb24gPSBmO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmVsb2NpdHkodikge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBvcmlnaW5hbFZlbG9jaXR5ID0gdjtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhdXNlKCkge1xuICAgICAgICAgICAgaXNQYXVzZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzdW1lKCkge1xuICAgICAgICAgICAgaXNQYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0ZXAoKSB7XG4gICAgICAgICAgICBpZiAoaXNQYXVzZWQpIHsgcmV0dXJuIHRydWU7IH0gLy8gc2hvdWxkIHNldCBhZ2Fpbj9cblxuICAgICAgICAgICAgY29uc3Qgc3RhdGVCZWZvcmUgPSBzdGF0ZTtcblxuICAgICAgICAgICAgc3RhdGVCZWZvcmUueCAgICAgICAgPSB2YWx1ZSAtIEVORF9WQUxVRTtcbiAgICAgICAgICAgIHN0YXRlQmVmb3JlLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgICAgICAgICBzdGF0ZUJlZm9yZS50ZW5zaW9uICA9IHRlbnNpb247XG4gICAgICAgICAgICBzdGF0ZUJlZm9yZS5mcmljdGlvbiA9IGZyaWN0aW9uO1xuXG4gICAgICAgICAgICBjb25zdCBzdGF0ZUFmdGVyICAgICAgID0gY2FsY1N0YXRlKHN0YXRlQmVmb3JlLCBTUEVFRCk7XG4gICAgICAgICAgICBjb25zdCBmaW5hbFZlbG9jaXR5ICAgID0gc3RhdGVBZnRlci52ZWxvY2l0eTtcbiAgICAgICAgICAgIGNvbnN0IG5ldEZsb2F0ICAgICAgICAgPSBzdGF0ZUFmdGVyLng7XG4gICAgICAgICAgICBjb25zdCBuZXQxRFZlbG9jaXR5ICAgID0gc3RhdGVBZnRlci52ZWxvY2l0eTtcbiAgICAgICAgICAgIGNvbnN0IG5ldFZhbHVlSXNMb3cgICAgPSBNYXRoLmFicyhuZXRGbG9hdCkgPCBUT0xFUkFOQ0U7XG4gICAgICAgICAgICBjb25zdCBuZXRWZWxvY2l0eUlzTG93ID0gTWF0aC5hYnMobmV0MURWZWxvY2l0eSkgPCBUT0xFUkFOQ0U7XG4gICAgICAgICAgICBjb25zdCBzaG91bGRTcHJpbmdTdG9wID0gbmV0VmFsdWVJc0xvdyB8fCBuZXRWZWxvY2l0eUlzTG93O1xuXG4gICAgICAgICAgICB2YWx1ZSA9IEVORF9WQUxVRSArIHN0YXRlQWZ0ZXIueDtcblxuICAgICAgICAgICAgaWYgKHNob3VsZFNwcmluZ1N0b3ApIHtcblxuICAgICAgICAgICAgICAgIHZlbG9jaXR5ID0gMDtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IEVORF9WQUxVRTtcblxuICAgICAgICAgICAgICAgIHVwZGF0ZUNhbGxiYWNrKHZhbHVlIC8gMTAwKTtcblxuICAgICAgICAgICAgICAgIC8vIFNob3VsZCB3ZSByZXBlYXQ/XG4gICAgICAgICAgICAgICAgaWYgKHJlcGVhdCA+IDApIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBEZWNyZW1lbnQgdGhlIHJlcGVhdCBjb3VudGVyIChpZiBmaW5pdGUsXG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIG1heSBiZSBpbiBhbiBpbmZpbml0ZSBsb29wKVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNGaW5pdGUocmVwZWF0KSkgeyByZXBlYXQtLTsgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldmVyc2VDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB2ZWxvY2l0eSA9IG9yaWdpbmFsVmVsb2NpdHk7XG4gICAgICAgICAgICAgICAgICAgIHRlbnNpb24gID0gb3JpZ2luYWxUZW5zaW9uO1xuICAgICAgICAgICAgICAgICAgICBmcmljdGlvbiA9IG9yaWdpbmFsRnJpY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gMDtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gc2hvdWxkIHNldCBhZ2Fpbj9cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIHdlJ3JlIGRvbmUgcmVwZWF0aW5nXG4gICAgICAgICAgICAgICAgY29tcGxldGVDYWxsYmFjaygpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBzaG91bGQgc2V0IGFnYWluP1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2ZWxvY2l0eSA9IGZpbmFsVmVsb2NpdHk7XG4gICAgICAgICAgICB1cGRhdGVDYWxsYmFjayh2YWx1ZSAvIDEwMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gc2hvdWxkIHNldCBhZ2Fpbj9cbiAgICAgICAgfSxcblxuICAgICAgICBzdG9wKCkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBvcmlnaW5hbFZlbG9jaXR5O1xuICAgICAgICAgICAgdGVuc2lvbiAgPSBvcmlnaW5hbFRlbnNpb247XG4gICAgICAgICAgICBmcmljdGlvbiA9IG9yaWdpbmFsRnJpY3Rpb247XG4gICAgICAgICAgICB2YWx1ZSA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xufTsiLCJjb25zdCBNYXRyaXggPSByZXF1aXJlKCcuL21hdHJpeCcpO1xuY29uc3QgdHJhbnNmb3JtUHJvcCA9IHJlcXVpcmUoJy4vcHJvcCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9iaiwgZWxlbWVudCkge1xuICAgIGNvbnN0IG1hdHJpeCA9IChuZXcgTWF0cml4KCkpLmNvbXBvc2Uob2JqKTtcbiAgICBlbGVtZW50LnN0eWxlW3RyYW5zZm9ybVByb3BdID0gbWF0cml4LnRvU3RyaW5nKCk7XG59OyIsImNvbnN0IE1hdHJpeCA9IHJlcXVpcmUoJy4uL21hdHJpeCcpO1xuY29uc3QgdHJhbnNmb3JtUHJvcCA9IHJlcXVpcmUoJy4uL3Byb3AnKTtcblxuY29uc3QgZ2V0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcbn07XG5cbmNvbnN0IGRlY29tcG9zZSA9IGZ1bmN0aW9uKG1hdHJpeCkge1xuICAgIGNvbnN0IGNvbXBvc2l0aW9uID0gbWF0cml4LmRlY29tcG9zZSgpO1xuICAgIGNvbnN0IHsgcm90YXRlLCBzY2FsZSwgc2tldywgdHJhbnNsYXRlIH0gPSBjb21wb3NpdGlvbjtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHRyYW5zbGF0ZS54LFxuICAgICAgICB5OiB0cmFuc2xhdGUueSxcbiAgICAgICAgejogdHJhbnNsYXRlLnosXG5cbiAgICAgICAgc2NhbGVYOiBzY2FsZS54LFxuICAgICAgICBzY2FsZVk6IHNjYWxlLnksXG4gICAgICAgIHNjYWxlWjogc2NhbGUueixcblxuICAgICAgICBza2V3WDogc2tldy54LFxuICAgICAgICBza2V3WTogc2tldy55LFxuXG4gICAgICAgIHJvdGF0ZVg6IHJvdGF0ZS54LFxuICAgICAgICByb3RhdGVZOiByb3RhdGUueSxcbiAgICAgICAgcm90YXRlWjogcm90YXRlLnpcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3R5bGUoZWxlbSkge1xuICAgICAgICBjb25zdCBjb21wdXRlZFN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IGNvbXB1dGVkU3R5bGVzW3RyYW5zZm9ybVByb3BdO1xuICAgICAgICBpZiAoIXRyYW5zZm9ybSB8fCB0cmFuc2Zvcm0gPT09ICdub25lJykgeyByZXR1cm4gZGVjb21wb3NlKG5ldyBNYXRyaXgoKSk7IH1cblxuICAgICAgICBjb25zdCBtYXRyaXggPSBuZXcgTWF0cml4KHRyYW5zZm9ybSk7XG4gICAgICAgIHJldHVybiBkZWNvbXBvc2UobWF0cml4KTtcbiAgICB9LFxuXG4gICAgb2JqKG9iaikge1xuICAgICAgICBjb25zdCBtYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIGNvbnN0IGNvbXBvc2l0aW9uID0gbWF0cml4LmNvbXBvc2Uob2JqKTtcbiAgICAgICAgcmV0dXJuIGRlY29tcG9zZShjb21wb3NpdGlvbik7XG4gICAgfVxufTsiLCIvKlxuXHR2YXIgTUFUUklYID0ge1xuXHRcdHg6IDAsXG5cdFx0eTogMCxcblx0XHR6OiAwLFxuXHRcdHNjYWxlWDogMSxcblx0XHRzY2FsZVk6IDEsXG5cdFx0c2NhbGVaOiAxLFxuXHRcdHJvdGF0aW9uWDogMCxcblx0XHRyb3RhdGlvblk6IDAsXG5cdFx0cm90YXRpb25aOiAwXG5cdH07XG4qL1xuXG5jb25zdCBleHBhbmQgPSBmdW5jdGlvbihvYmopIHtcblx0aWYgKG9iai5zY2FsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0b2JqLnNjYWxlWCA9IG9iai5zY2FsZTtcblx0XHRvYmouc2NhbGVZID0gb2JqLnNjYWxlO1xuXHRcdGRlbGV0ZSBvYmouc2NhbGU7XG5cdH1cblxuXHRpZiAob2JqLnJvdGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0b2JqLnJvdGF0ZVogPSBvYmoucm90YXRlO1xuXHRcdGRlbGV0ZSBvYmoucm90YXRlO1xuXHR9XG5cblx0aWYgKG9iai5yb3RhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0b2JqLnJvdGF0ZVogPSBvYmoucm90YXRpb247XG5cdFx0ZGVsZXRlIG9iai5yb3RhdGlvbjtcblx0fVxuXG5cdHJldHVybiBvYmo7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9iaiA9PiAhb2JqID8gb2JqIDogZXhwYW5kKG9iaik7XG4iLCJjb25zdCBpc0VsZW1lbnQgPSByZXF1aXJlKCcuL2lzRWxlbWVudCcpO1xuY29uc3QgYmFzZXIgPSByZXF1aXJlKCcuL2Jhc2VyJyk7XG5jb25zdCBleHBhbmRTaG9ydGhhbmQgPSByZXF1aXJlKCcuL2V4cGFuZFNob3J0aGFuZCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1hdHJpeChpbml0aWFsKSB7XG4gICAgbGV0IGluaXQgPSBpbml0aWFsO1xuXG4gICAgbGV0IGJhc2U7XG4gICAgbGV0IHlveW87XG4gICAgbGV0IGZyb207XG4gICAgbGV0IHRvO1xuICAgIGxldCByZXBlYXQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZSgpIHtcbiAgICAgICAgICAgIHJldHVybiBiYXNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHlveW8oYm9vbCkge1xuICAgICAgICAgICAgeW95byA9IGJvb2w7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBmcm9tKGYpIHtcbiAgICAgICAgICAgIGluaXQgPSBmO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG8odCkge1xuICAgICAgICAgICAgdG8gPSBleHBhbmRTaG9ydGhhbmQodCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGUocGVyYykge1xuICAgICAgICAgICAgZm9yIChsZXQgcHJvcGVydHkgaW4gdG8pIHtcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnQgPSBmcm9tW3Byb3BlcnR5XSB8fCAwO1xuICAgICAgICAgICAgICAgIGxldCBlbmQgPSB0b1twcm9wZXJ0eV07XG5cbiAgICAgICAgICAgICAgICBiYXNlW3Byb3BlcnR5XSA9IHN0YXJ0ICsgKGVuZCAtIHN0YXJ0KSAqIHBlcmM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJldmVyc2UoKSB7XG4gICAgICAgICAgICB2YXIgdG1wO1xuXG4gICAgICAgICAgICAvLyByZWFzc2lnbiBzdGFydGluZyB2YWx1ZXNcbiAgICAgICAgICAgIGZvciAobGV0IHByb3BlcnR5IGluIHJlcGVhdCkge1xuICAgICAgICAgICAgICAgIGlmICh5b3lvKSB7XG4gICAgICAgICAgICAgICAgICAgIHRtcCA9IHJlcGVhdFtwcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgIHJlcGVhdFtwcm9wZXJ0eV0gPSB0b1twcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgIHRvW3Byb3BlcnR5XSA9IHRtcDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmcm9tW3Byb3BlcnR5XSA9IHJlcGVhdFtwcm9wZXJ0eV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0KCkge1xuICAgICAgICAgICAgaWYgKCF0bykgeyByZXR1cm4gdGhpczsgfVxuICAgICAgICAgICAgaWYgKCFiYXNlKSB7IGJhc2UgPSBpc0VsZW1lbnQoaW5pdCkgPyBiYXNlci5zdHlsZShpbml0KSA6IGJhc2VyLm9iaihleHBhbmRTaG9ydGhhbmQoaW5pdCkpOyB9XG4gICAgICAgICAgICBpZiAoIWZyb20pIHsgZnJvbSA9IHt9OyB9XG4gICAgICAgICAgICBpZiAoIXJlcGVhdCkgeyByZXBlYXQgPSB7fTsgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBwcm9wZXJ0eSBpbiB0bykge1xuICAgICAgICAgICAgICAgIC8vIG9taXQgdW5jaGFuZ2VkIHByb3BlcnRpZXNcbiAgICAgICAgICAgICAgICBpZiAoYmFzZVtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCB8fCB0b1twcm9wZXJ0eV0gPT09IGJhc2VbcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0b1twcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZyb21bcHJvcGVydHldID0gYmFzZVtwcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgcmVwZWF0W3Byb3BlcnR5XSA9IGZyb21bcHJvcGVydHldIHx8IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBvYmogPT4gISEob2JqICYmICtvYmoubm9kZVR5cGUgPT09IG9iai5ub2RlVHlwZSk7XG4iXX0=
