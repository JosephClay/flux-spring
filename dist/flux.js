(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.flux = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Encapsulates the functionality of an animation.
 * Constructs and tears down the matrix, the spring
 * and the loop. Acts as the interface to the user for
 * configuration.
 */

var loop = require('./loop');
var transformer = require('./transformer');
var spr = require('./spring');

module.exports = function animation(obj) {
	var api = {};
	var matrix = transformer(obj);
	var events = {};
	var spring = spr();

	var playing = false;
	var startTime = 0;
	var delayTime = 0;

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

/**
 * The public api
 */
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

	await: function _await(fn) {
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
var matrix = require('./static');
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

		var tx = new XCSSMatrix();
		var ty = new XCSSMatrix();
		var tz = new XCSSMatrix();
		var sinA = void 0,
		    cosA = void 0,
		    sq = void 0;

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
		var x = _ref.x,
		    y = _ref.y,
		    z = _ref.z,
		    rotateX = _ref.rotateX,
		    rotateY = _ref.rotateY,
		    rotateZ = _ref.rotateZ,
		    scaleX = _ref.scaleX,
		    scaleY = _ref.scaleY,
		    scaleZ = _ref.scaleZ,
		    skewX = _ref.skewX,
		    skewY = _ref.skewY;

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

},{"./deg2rad":5,"./static":7,"./transp":8}],7:[function(require,module,exports){
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
	var result = new m.constructor();
	var a1 = m.m11,
	    b1 = m.m12,
	    c1 = m.m13,
	    d1 = m.m14;
	var a2 = m.m21,
	    b2 = m.m22,
	    c2 = m.m23,
	    d2 = m.m24;
	var a3 = m.m31,
	    b3 = m.m32,
	    c3 = m.m33,
	    d3 = m.m34;
	var a4 = m.m41,
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

	var a = otherMatrix;
	var b = matrix;
	var c = new matrix.constructor();

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
	var perspectiveMatrix = void 0;
	var rightHandSide = void 0;
	var inversePerspectiveMatrix = void 0;
	var transposedInversePerspectiveMatrix = void 0;
	var perspective = void 0;
	var translate = void 0;
	var row = void 0;
	var i = void 0;
	var len = void 0;
	var scale = void 0;
	var skew = void 0;
	var pdum3 = void 0;
	var rotate = void 0;

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

/**
 * Parses a DOM string into values usable by matrix
 * `static.js` functions to contruct a true Matrix.
 */

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
  var len = length(vector);
  var v = new vector.constructor(vector.x / len, vector.y / len, vector.z / len);

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

/**
 * @param  {Vector4} vector
 * @param  {Matrix} matrix
 * @return {Vector4}
 */
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
	return '';
};

/**
 * Determines the transformation property to use
 * for the environment, testing the "transform"
 * property before testing proprietary properties
 * @type {String}
 */
module.exports = selectProp(['transform', 'msTransform', 'oTransform', 'mozTransform', 'webkitTransform']);

// cleanup div
div = undefined;

},{}],11:[function(require,module,exports){
"use strict";

/**
 * Encapsulates the functionality of a spring,
 * calculating state based off of tension, friction
 * and velocity. Implemented by `animation.js`
 */

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
			var springShouldStop = netValueIsLow || netVelocityIsLow;

			value = END_VALUE + stateAfter.x;

			if (springShouldStop) {

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
			return this;
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

/**
 * Helps "base" a matrix POJO off of either an element
 * or another POJO. Acts as a normalizer between the two
 * ways to pass arguments to flux-spring:
 * - spring(element)
 * - spring({...})
 */

var Matrix = require('../matrix');
var transformProp = require('../prop');

var getComputedStyle = function getComputedStyle(elem) {
	return document.defaultView.getComputedStyle(elem);
};

var decompose = function decompose(matrix) {
	var composition = matrix.decompose();
	var rotate = composition.rotate,
	    scale = composition.scale,
	    skew = composition.skew,
	    translate = composition.translate;

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

/**
 * Expands the shorthand of an object to usable
 * matrix properties. Biggest ones are the common
 * "scale" and "rotate" props.
 */

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

/**
 * Handles object transformations so that these operations
 * can be offloaded from `animation.js`. Especially useful
 * for tracking the to and from of an object for yoyoing
 * and reversing.
 *
 * Takes a percent on update and updates all properties.
 * This percentage is the percentage of the way through
 * the current animation and is generated by `spring.js`
 */

var isElement = require('./isElement');
var baser = require('./baser');
var expandShorthand = require('./expandShorthand');

module.exports = function transformer(initial) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYW5pbWF0aW9uLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL2xvb3AuanMiLCJzcmMvbWF0cml4L1ZlY3RvcjQuanMiLCJzcmMvbWF0cml4L2RlZzJyYWQuanMiLCJzcmMvbWF0cml4L2luZGV4LmpzIiwic3JjL21hdHJpeC9zdGF0aWMuanMiLCJzcmMvbWF0cml4L3RyYW5zcC5qcyIsInNyYy9tYXRyaXgvdmVjdG9yLmpzIiwic3JjL3Byb3AuanMiLCJzcmMvc3ByaW5nLmpzIiwic3JjL3RyYW5zZm9ybS5qcyIsInNyYy90cmFuc2Zvcm1lci9iYXNlci5qcyIsInNyYy90cmFuc2Zvcm1lci9leHBhbmRTaG9ydGhhbmQuanMiLCJzcmMvdHJhbnNmb3JtZXIvaW5kZXguanMiLCJzcmMvdHJhbnNmb3JtZXIvaXNFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7Ozs7OztBQU9BLElBQU0sT0FBTyxRQUFiLEFBQWEsQUFBUTtBQUNyQixJQUFNLGNBQWMsUUFBcEIsQUFBb0IsQUFBUTtBQUM1QixJQUFNLE1BQU0sUUFBWixBQUFZLEFBQVE7O0FBRXBCLE9BQUEsQUFBTyxVQUFVLFNBQUEsQUFBUyxVQUFULEFBQW1CLEtBQUssQUFDeEM7S0FBTSxNQUFOLEFBQVksQUFDWjtLQUFNLFNBQVMsWUFBZixBQUFlLEFBQVksQUFDM0I7S0FBTSxTQUFOLEFBQWUsQUFDZjtLQUFNLFNBQU4sQUFBZSxBQUVmOztLQUFJLFVBQUosQUFBYyxBQUNkO0tBQUksWUFBSixBQUFnQixBQUNoQjtLQUFJLFlBQUosQUFBZ0IsQUFFaEI7O0tBQU0sU0FBUSxTQUFSLEFBQVEsU0FBVyxBQUN4QjtTQUFBLEFBQU87QUFBa0IsK0JBQUEsQUFDZixNQUFNLEFBQ2Q7V0FBQSxBQUFPLE9BQVAsQUFBYyxBQUNkO1FBQUEsQUFBSSxRQUFKLEFBQVksVUFBVSxPQUF0QixBQUFzQixB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QUFBVSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhCLEFBQTBCLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEMsQUFBMEMsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFoRSxBQUFrRSxBQUNsRTtHQUFBLEFBQUUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFSLEFBQVUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QixBQUEwQixNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhDLEFBQTBDLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBaEUsQUFBa0UsQUFDbEU7R0FBQSxBQUFFLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxBQUEwQyxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQWhFLEFBQWtFLEFBRWxFOztHQUFBLEFBQUUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFSLEFBQVUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QixBQUEwQixNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhDLEFBQTBDLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBaEUsQUFBa0UsQUFDbEU7R0FBQSxBQUFFLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxBQUEwQyxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQWhFLEFBQWtFLEFBQ2xFO0dBQUEsQUFBRSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQVIsQUFBVSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhCLEFBQTBCLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEMsQUFBMEMsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFoRSxBQUFrRSxBQUNsRTtHQUFBLEFBQUUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFSLEFBQVUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QixBQUEwQixNQUFNLEVBQUEs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QUFBcUMsQUFDckM7QUFFRDs7VUFBQSxBQUFPLEFBQ1A7QUFsRUYsQUFBTyxBQW9FUDtBQXBFTyxBQUNOO0FBVkY7Ozs7O0FDZkEsT0FBQSxBQUFPLFVBQVUsZUFBQTtTQUFPLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBRCxBQUFLLGFBQWEsSUFBbkMsQUFBUSxBQUErQjtBQUF4RCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEVuY2Fwc3VsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiBhbiBhbmltYXRpb24uXG4gKiBDb25zdHJ1Y3RzIGFuZCB0ZWFycyBkb3duIHRoZSBtYXRyaXgsIHRoZSBzcHJpbmdcbiAqIGFuZCB0aGUgbG9vcC4gQWN0cyBhcyB0aGUgaW50ZXJmYWNlIHRvIHRoZSB1c2VyIGZvclxuICogY29uZmlndXJhdGlvbi5cbiAqL1xuXG5jb25zdCBsb29wID0gcmVxdWlyZSgnLi9sb29wJyk7XG5jb25zdCB0cmFuc2Zvcm1lciA9IHJlcXVpcmUoJy4vdHJhbnNmb3JtZXInKTtcbmNvbnN0IHNwciA9IHJlcXVpcmUoJy4vc3ByaW5nJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYW5pbWF0aW9uKG9iaikge1xuXHRjb25zdCBhcGkgPSB7fTtcblx0Y29uc3QgbWF0cml4ID0gdHJhbnNmb3JtZXIob2JqKTtcblx0Y29uc3QgZXZlbnRzID0ge307XG5cdGNvbnN0IHNwcmluZyA9IHNwcigpO1xuXG5cdGxldCBwbGF5aW5nID0gZmFsc2U7XG5cdGxldCBzdGFydFRpbWUgPSAwO1xuXHRsZXQgZGVsYXlUaW1lID0gMDtcblxuXHRjb25zdCBzdGFydCA9IGZ1bmN0aW9uKCkge1xuXHRcdHNwcmluZy5yZWdpc3RlckNhbGxiYWNrcyh7XG5cdFx0XHRvblVwZGF0ZShwZXJjKSB7XG5cdFx0XHRcdG1hdHJpeC51cGRhdGUocGVyYyk7XG5cdFx0XHRcdGFwaS50cmlnZ2VyKCd1cGRhdGUnLCBtYXRyaXgudmFsdWUoKSwgb2JqKTtcblx0XHRcdH0sXG5cdFx0XHRvblJldmVyc2UoKSB7XG5cdFx0XHRcdG1hdHJpeC5yZXZlcnNlKCk7XG5cdFx0XHR9LFxuXHRcdFx0b25Db21wbGV0ZSgpIHtcblx0XHRcdFx0YXBpLnN0b3AoKS50cmlnZ2VyKCdjb21wbGV0ZScpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0bWF0cml4LnN0YXJ0KCk7XG5cdFx0bG9vcC5hZGQoc3ByaW5nKTtcblx0fTtcblxuXHRyZXR1cm4gT2JqZWN0LmFzc2lnbihhcGksIHtcblx0XHRmcm9tKGZyb20pIHtcblx0XHRcdG1hdHJpeC5mcm9tKGZyb20pO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0dG8odG8pIHtcblx0XHRcdG1hdHJpeC50byh0byk7XG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH0sXG5cblx0XHRzZXQodGVuc2lvbiwgZnJpY3Rpb24sIHZlbG9jaXR5KSB7XG5cdFx0XHQvLyBJdCdzIGFuIG9iamVjdFxuXHRcdFx0aWYgKCt0ZW5zaW9uICE9PSB0ZW5zaW9uKSB7XG5cdFx0XHRcdHZhciB0ZW1wID0gdGVuc2lvbjtcblx0XHRcdFx0dmVsb2NpdHkgPSB0ZW1wLnZlbG9jaXR5O1xuXHRcdFx0XHRmcmljdGlvbiA9IHRlbXAuZnJpY3Rpb247XG5cdFx0XHRcdHRlbnNpb24gPSB0ZW1wLnRlbnNpb247XG5cdFx0XHR9XG5cblx0XHRcdHNwcmluZy5zZXQodGVuc2lvbiwgZnJpY3Rpb24sIHZlbG9jaXR5KTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdHRlbnNpb24odGVuc2lvbikge1xuXHRcdFx0c3ByaW5nLnRlbnNpb24oK3RlbnNpb24pO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0ZnJpY3Rpb24oZnJpY3Rpb24pIHtcblx0XHRcdHNwcmluZy5mcmljdGlvbigrZnJpY3Rpb24pO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0dmVsb2NpdHkodmVsb2NpdHkpIHtcblx0XHRcdHNwcmluZy52ZWxvY2l0eSgrdmVsb2NpdHkpO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0b24obmFtZSwgZm4pIHtcblx0XHRcdGNvbnN0IGFyciA9IGV2ZW50c1tuYW1lXSB8fCAoZXZlbnRzW25hbWVdID0gW10pO1xuXHRcdFx0YXJyLnB1c2goZm4pO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0b2ZmKG5hbWUsIGZuKSB7XG5cdFx0XHRjb25zdCBhcnIgPSBldmVudHNbbmFtZV07XG5cdFx0XHRpZiAoIWFyciB8fCAhYXJyLmxlbmd0aCkgeyByZXR1cm4gYXBpOyB9XG5cblx0XHRcdGxldCBpZHggPSBhcnIuaW5kZXhPZihmbik7XG5cdFx0XHRpZiAoaWR4ICE9PSAtMSkge1xuXHRcdFx0XHRhcnIuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdHRyaWdnZXIobmFtZSwgYSwgYikge1xuXHRcdFx0Y29uc3QgYXJyID0gZXZlbnRzW25hbWVdO1xuXHRcdFx0aWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIGFwaTsgfVxuXG5cdFx0XHRmb3IgKGxldCBpZHggPSAwOyBpZHggPCBhcnIubGVuZ3RoOyBpZHgrKykge1xuXHRcdFx0XHRhcnJbaWR4XShhLCBiKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0ZGVsYXkoYW1vdW50KSB7XG5cdFx0XHRkZWxheVRpbWUgPSBhbW91bnQ7XG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH0sXG5cblx0XHRyZXBlYXQocmVwZWF0KSB7XG5cdFx0XHRzcHJpbmcucmVwZWF0KHJlcGVhdCk7XG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH0sXG5cblx0XHR5b3lvKHlveW8pIHtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgeyB5b3lvID0gdHJ1ZTsgfVxuXHRcdFx0bWF0cml4LnlveW8oISF5b3lvKTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdHN0YXJ0KHRpbWUpIHtcblx0XHRcdHN0YXJ0VGltZSA9IHRpbWUgfHwgbG9vcC5ub3c7XG5cdFx0XHRsb29wLmF3YWl0KHRpbWUgPT4ge1xuXHRcdFx0XHRpZiAodGltZSA8IChzdGFydFRpbWUgKyBkZWxheVRpbWUpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7IC8vIHNob3VsZCBjb250aW51ZSB0byB3YWl0XG5cdFx0XHRcdH1cblx0XHRcdFx0cGxheWluZyA9IHRydWU7XG5cdFx0XHRcdGFwaS50cmlnZ2VyKCdzdGFydCcpO1xuXHRcdFx0XHRzdGFydCh0aW1lKTtcblx0XHRcdFx0cmV0dXJuIGZhbHNlOyAvLyBzaG91bGQgY29udGludWUgdG8gd2FpdFxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdHBhdXNlKHRpbWUpIHtcblx0XHRcdHRpbWUgPSB0aW1lIHx8IGxvb3Aubm93O1xuXHRcdFx0c3ByaW5nLnBhdXNlKHRpbWUpO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0cmVzdW1lKHRpbWUpIHtcblx0XHRcdHRpbWUgPSB0aW1lIHx8IGxvb3Aubm93O1xuXHRcdFx0c3ByaW5nLnJlc3VtZSh0aW1lKTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdHN0b3AoKSB7XG5cdFx0XHRpZiAoIXBsYXlpbmcpIHsgcmV0dXJuIGFwaTsgfVxuXHRcdFx0cGxheWluZyA9IGZhbHNlO1xuXHRcdFx0bG9vcC5yZW1vdmUoc3ByaW5nKTtcblx0XHRcdHNwcmluZy5zdG9wKCk7XG5cdFx0XHRhcGkudHJpZ2dlcignc3RvcCcpO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9XG5cdH0pO1xufTsiLCJjb25zdCBsb29wID0gcmVxdWlyZSgnLi9sb29wJyk7XG5jb25zdCBwcm9wID0gcmVxdWlyZSgnLi9wcm9wJyk7XG5jb25zdCBhbmltYXRpb24gPSByZXF1aXJlKCcuL2FuaW1hdGlvbicpO1xuY29uc3QgdHJhbnNmb3JtID0gcmVxdWlyZSgnLi90cmFuc2Zvcm0nKTtcbmNvbnN0IHBsdWdpbnMgPSB7fTtcblxuLyoqXG4gKiBUaGUgcHVibGljIGFwaVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5hc3NpZ24oZnVuY3Rpb24ob2JqKSB7XG5cdHJldHVybiBPYmplY3QuYXNzaWduKGFuaW1hdGlvbihvYmopLCBwbHVnaW5zKTtcbn0sIHtcblx0cHJvcCxcblx0dHJhbnNmb3JtLFxuXHR0aWNrOiBsb29wLnVwZGF0ZSxcblx0dXBkYXRlOiBsb29wLnVwZGF0ZSxcblx0cGx1Z2luKG5hbWUsIGZuKSB7XG5cdFx0cGx1Z2luc1tuYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Zm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH07XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cbn0pOyIsImNvbnN0IHdhaXRpbmcgICAgPSBbXTtcbmNvbnN0IGFuaW1hdGlvbnMgPSBbXTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdG5vdzogRGF0ZS5ub3coKSxcblxuXHRhd2FpdChmbikge1xuXHRcdHdhaXRpbmcucHVzaChmbik7XG5cdH0sXG5cblx0YWRkKGZuKSB7XG5cdFx0YW5pbWF0aW9ucy5wdXNoKGZuKTtcblx0fSxcblxuXHRyZW1vdmUoZm4pIHtcblx0XHRsZXQgaWR4ID0gYW5pbWF0aW9ucy5pbmRleE9mKGZuKTtcblx0XHRpZiAoaWR4ICE9PSAtMSkge1xuXHRcdFx0YW5pbWF0aW9ucy5zcGxpY2UoaWR4LCAxKTtcblx0XHR9XG5cdH0sXG5cblx0dXBkYXRlKCkge1xuXHRcdGNvbnN0IHRpbWUgPSB0aGlzLm5vdyA9IERhdGUubm93KCk7XG5cblx0XHRpZiAod2FpdGluZy5sZW5ndGggPT09IDAgJiYgYW5pbWF0aW9ucy5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsZXQgaWR4ID0gMDtcblx0XHR3aGlsZSAoaWR4IDwgd2FpdGluZy5sZW5ndGgpIHtcblx0XHRcdGlmICh3YWl0aW5nW2lkeF0odGltZSkpIHtcblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR3YWl0aW5nLnNwbGljZShpZHgsIDEpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlkeCA9IDA7XG5cdFx0d2hpbGUgKGlkeCA8IGFuaW1hdGlvbnMubGVuZ3RoKSB7XG5cdFx0XHRhbmltYXRpb25zW2lkeF0uc3RlcCh0aW1lKTtcblx0XHRcdGlkeCsrO1xuXHRcdH1cblx0fVxufTsiLCJjb25zdCB2ZWN0b3IgPSByZXF1aXJlKCcuL3ZlY3RvcicpO1xuXG4vKipcbiAqIEEgNCBkaW1lbnNpb25hbCB2ZWN0b3JcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5jb25zdCBWZWN0b3I0ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBWZWN0b3I0KHgsIHksIHosIHcpIHtcblx0dGhpcy54ID0geDtcblx0dGhpcy55ID0geTtcblx0dGhpcy56ID0gejtcblx0dGhpcy53ID0gdztcblx0dGhpcy5jaGVja1ZhbHVlcygpO1xufTtcblxuVmVjdG9yNC5wcm90b3R5cGUgPSB7XG5cdGNvbnN0cnVjdG9yOiBWZWN0b3I0LFxuXG5cdC8qKlxuXHQgKiBFbnN1cmUgdGhhdCB2YWx1ZXMgYXJlIG5vdCB1bmRlZmluZWRcblx0ICogQHJldHVybnMgbnVsbFxuXHQgKi9cblx0Y2hlY2tWYWx1ZXMoKSB7XG5cdFx0dGhpcy54ID0gdGhpcy54IHx8IDA7XG5cdFx0dGhpcy55ID0gdGhpcy55IHx8IDA7XG5cdFx0dGhpcy56ID0gdGhpcy56IHx8IDA7XG5cdFx0dGhpcy53ID0gdGhpcy53IHx8IDA7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEdldCB0aGUgbGVuZ3RoIG9mIHRoZSB2ZWN0b3Jcblx0ICogQHJldHVybnMge2Zsb2F0fVxuXHQgKi9cblx0bGVuZ3RoKCkge1xuXHRcdHRoaXMuY2hlY2tWYWx1ZXMoKTtcblx0XHRyZXR1cm4gdmVjdG9yLmxlbmd0aCh0aGlzKTtcblx0fSxcblxuXHQvKipcblx0ICogR2V0IGEgbm9ybWFsaXNlZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXG5cdCAqIEByZXR1cm5zIHtWZWN0b3I0fVxuXHQgKi9cblx0bm9ybWFsaXplKCkge1xuXHRcdHJldHVybiB2ZWN0b3Iubm9ybWFsaXplKHRoaXMpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBWZWN0b3IgRG90LVByb2R1Y3Rcblx0ICogQHBhcmFtIHtWZWN0b3I0fSB2IFRoZSBzZWNvbmQgdmVjdG9yIHRvIGFwcGx5IHRoZSBwcm9kdWN0IHRvXG5cdCAqIEByZXR1cm5zIHtmbG9hdH0gVGhlIERvdC1Qcm9kdWN0IG9mIHRoaXMgYW5kIHYuXG5cdCAqL1xuXHRkb3Qodikge1xuXHRcdHJldHVybiB2ZWN0b3IuZG90KHRoaXMsIHYpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBWZWN0b3IgQ3Jvc3MtUHJvZHVjdFxuXHQgKiBAcGFyYW0ge1ZlY3RvcjR9IHYgVGhlIHNlY29uZCB2ZWN0b3IgdG8gYXBwbHkgdGhlIHByb2R1Y3QgdG9cblx0ICogQHJldHVybnMge1ZlY3RvcjR9IFRoZSBDcm9zcy1Qcm9kdWN0IG9mIHRoaXMgYW5kIHYuXG5cdCAqL1xuXHRjcm9zcyh2KSB7XG5cdFx0cmV0dXJuIHZlY3Rvci5jcm9zcyh0aGlzLCB2KTtcblx0fSxcblxuXHQvKipcblx0ICogSGVscGVyIGZ1bmN0aW9uIHJlcXVpcmVkIGZvciBtYXRyaXggZGVjb21wb3NpdGlvblxuXHQgKiBBIEphdmFzY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgcHNldWRvIGNvZGUgYXZhaWxhYmxlIGZyb20gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy0yZC10cmFuc2Zvcm1zLyNtYXRyaXgtZGVjb21wb3NpdGlvblxuXHQgKiBAcGFyYW0ge1ZlY3RvcjR9IGFQb2ludCBBIDNEIHBvaW50XG5cdCAqIEBwYXJhbSB7ZmxvYXR9IGFzY2xcblx0ICogQHBhcmFtIHtmbG9hdH0gYnNjbFxuXHQgKiBAcmV0dXJucyB7VmVjdG9yNH1cblx0ICovXG5cdGNvbWJpbmUoYlBvaW50LCBhc2NsLCBic2NsKSB7XG5cdFx0cmV0dXJuIHZlY3Rvci5jb21iaW5lKHRoaXMsIGJQb2ludCwgYXNjbCwgYnNjbCk7XG5cdH0sXG5cblx0bXVsdGlwbHlCeU1hdHJpeCAobWF0cml4KSB7XG5cdFx0cmV0dXJuIHZlY3Rvci5tdWx0aXBseUJ5TWF0cml4KHRoaXMsIG1hdHJpeCk7XG5cdH1cbn07IiwiLyoqXG4gKiAgQ29udmVydHMgYW5nbGVzIGluIGRlZ3JlZXMsIHdoaWNoIGFyZSB1c2VkIGJ5IHRoZSBleHRlcm5hbCBBUEksIHRvIGFuZ2xlc1xuICogIGluIHJhZGlhbnMgdXNlZCBpbiBpbnRlcm5hbCBjYWxjdWxhdGlvbnMuXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGFuZ2xlIC0gQW4gYW5nbGUgaW4gZGVncmVlcy5cbiAqICBAcmV0dXJucyB7bnVtYmVyfSByYWRpYW5zXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYW5nbGUgPT4gYW5nbGUgKiBNYXRoLlBJIC8gMTgwO1xuIiwiY29uc3QgZGVnMnJhZCA9IHJlcXVpcmUoJy4vZGVnMnJhZCcpO1xuY29uc3QgbWF0cml4ID0gcmVxdWlyZSgnLi9zdGF0aWMnKTtcbmNvbnN0IHRyYW5zcCA9IHJlcXVpcmUoJy4vdHJhbnNwJyk7XG5cbi8vIEFTQ0lJIGNoYXIgOTcgPT0gJ2EnXG5jb25zdCBpbmRleFRvS2V5MmQgPSBpbmRleCA9PiBTdHJpbmcuZnJvbUNoYXJDb2RlKGluZGV4ICsgOTcpO1xuXG5jb25zdCBpbmRleFRvS2V5M2QgPSBpbmRleCA9PiAoJ20nICsgKE1hdGguZmxvb3IoaW5kZXggLyA0KSArIDEpKSArIChpbmRleCAlIDQgKyAxKTtcblxuY29uc3QgcG9pbnRzMmQgPSBbXG5cdCdtMTEnLCAvLyBhXG5cdCdtMTInLCAvLyBiXG5cdCdtMjEnLCAvLyBjXG5cdCdtMjInLCAvLyBkXG5cdCdtNDEnLCAvLyBlXG5cdCdtNDInICAvLyBmXG5dO1xuXG5jb25zdCBwb2ludHMzZCA9IFtcblx0J20xMScsICdtMTInLCAnbTEzJywgJ20xNCcsXG5cdCdtMjEnLCAnbTIyJywgJ20yMycsICdtMjQnLFxuXHQnbTMxJywgJ20zMicsICdtMzMnLCAnbTM0Jyxcblx0J200MScsICdtNDInLCAnbTQzJywgJ200NCdcbl07XG5cbmNvbnN0IGxvb2t1cFRvRml4ZWQgPSBmdW5jdGlvbihwKSB7XG5cdHJldHVybiB0aGlzW3BdLnRvRml4ZWQoNik7XG59O1xuXG4vKipcbiAqICBHaXZlbiBhIENTUyB0cmFuc2Zvcm0gc3RyaW5nIChsaWtlIGByb3RhdGUoM3JhZClgLCBvclxuICogICAgYG1hdHJpeCgxLCAwLCAwLCAwLCAxLCAwKWApLCByZXR1cm4gYW4gaW5zdGFuY2UgY29tcGF0aWJsZSB3aXRoXG4gKiAgICBbYFdlYktpdENTU01hdHJpeGBdKGh0dHA6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvc2FmYXJpL2RvY3VtZW50YXRpb24vQXVkaW9WaWRlby9SZWZlcmVuY2UvV2ViS2l0Q1NTTWF0cml4Q2xhc3NSZWZlcmVuY2UvV2ViS2l0Q1NTTWF0cml4L1dlYktpdENTU01hdHJpeC5odG1sKVxuICogIEBjb25zdHJ1Y3RvclxuICogIEBwYXJhbSB7c3RyaW5nfSBkb21zdHIgLSBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIDJEIG9yIDNEIHRyYW5zZm9ybSBtYXRyaXhcbiAqICAgIGluIHRoZSBmb3JtIGdpdmVuIGJ5IHRoZSBDU1MgdHJhbnNmb3JtIHByb3BlcnR5LCBpLmUuIGp1c3QgbGlrZSB0aGVcbiAqICAgIG91dHB1dCBmcm9tIFtbQGxpbmsjdG9TdHJpbmddXS5cbiAqICBAcmV0dXJucyB7WENTU01hdHJpeH0gbWF0cml4XG4gKi9cbmNvbnN0IFhDU1NNYXRyaXggPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFhDU1NNYXRyaXgoc3RyKSB7XG5cdHRoaXMubTExID0gdGhpcy5tMjIgPSB0aGlzLm0zMyA9IHRoaXMubTQ0ID0gMTtcbiAgICAgICAgICAgICAgIHRoaXMubTEyID0gdGhpcy5tMTMgPSB0aGlzLm0xNCA9XG5cdHRoaXMubTIxID0gICAgICAgICAgICB0aGlzLm0yMyA9IHRoaXMubTI0ID1cblx0dGhpcy5tMzEgPSB0aGlzLm0zMiA9ICAgICAgICAgICAgdGhpcy5tMzQgPVxuXHR0aGlzLm00MSA9IHRoaXMubTQyID0gdGhpcy5tNDMgICAgICAgICAgICA9IDA7XG5cblx0dGhpcy5zZXRNYXRyaXhWYWx1ZShzdHIpO1xufTtcblxuWENTU01hdHJpeC5wcm90b3R5cGUgPSB7XG5cdGNvbnN0cnVjdG9yOiBYQ1NTTWF0cml4LFxuXG5cdC8qKlxuXHQgKiAgTXVsdGlwbHkgb25lIG1hdHJpeCBieSBhbm90aGVyXG5cdCAqICBAcGFyYW0ge1hDU1NNYXRyaXh9IG90aGVyTWF0cml4IC0gVGhlIG1hdHJpeCB0byBtdWx0aXBseSB0aGlzIG9uZSBieS5cblx0ICovXG5cdG11bHRpcGx5KG90aGVyTWF0cml4KSB7XG5cdFx0cmV0dXJuIG1hdHJpeC5tdWx0aXBseSh0aGlzLCBvdGhlck1hdHJpeCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqICBJZiB0aGUgbWF0cml4IGlzIGludmVydGlibGUsIHJldHVybnMgaXRzIGludmVyc2UsIG90aGVyd2lzZSByZXR1cm5zIG51bGwuXG5cdCAqICBAcmV0dXJucyB7WENTU01hdHJpeHxudWxsfVxuXHQgKi9cblx0aW52ZXJzZSgpIHtcblx0XHRyZXR1cm4gbWF0cml4LmludmVyc2UodGhpcyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqICBSZXR1cm5zIHRoZSByZXN1bHQgb2Ygcm90YXRpbmcgdGhlIG1hdHJpeCBieSBhIGdpdmVuIHZlY3Rvci5cblx0ICpcblx0ICogIElmIG9ubHkgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIHByb3ZpZGVkLCB0aGUgbWF0cml4IGlzIG9ubHkgcm90YXRlZCBhYm91dFxuXHQgKiAgdGhlIHogYXhpcy5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSByb3RYIC0gVGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeCBheGlzLlxuXHQgKiAgQHBhcmFtIHtudW1iZXJ9IHJvdFkgLSBUaGUgcm90YXRpb24gYXJvdW5kIHRoZSB5IGF4aXMuIElmIHVuZGVmaW5lZCwgdGhlIHggY29tcG9uZW50IGlzIHVzZWQuXG5cdCAqICBAcGFyYW0ge251bWJlcn0gcm90WiAtIFRoZSByb3RhdGlvbiBhcm91bmQgdGhlIHogYXhpcy4gSWYgdW5kZWZpbmVkLCB0aGUgeCBjb21wb25lbnQgaXMgdXNlZC5cblx0ICogIEByZXR1cm5zIFhDU1NNYXRyaXhcblx0ICovXG5cdHJvdGF0ZShyeCwgcnksIHJ6KSB7XG5cdFx0aWYgKHJ4ID09PSB1bmRlZmluZWQpIHsgcnggPSAwOyB9XG5cblx0XHRpZiAocnkgPT09IHVuZGVmaW5lZCAmJlxuXHRcdFx0cnogPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cnogPSByeDtcblx0XHRcdHJ4ID0gMDtcblx0XHRcdHJ5ID0gMDtcblx0XHR9XG5cblx0XHRpZiAocnkgPT09IHVuZGVmaW5lZCkgeyByeSA9IDA7IH1cblx0XHRpZiAocnogPT09IHVuZGVmaW5lZCkgeyByeiA9IDA7IH1cblxuXHRcdHJ4ID0gZGVnMnJhZChyeCk7XG5cdFx0cnkgPSBkZWcycmFkKHJ5KTtcblx0XHRyeiA9IGRlZzJyYWQocnopO1xuXG5cdFx0Y29uc3QgdHggPSBuZXcgWENTU01hdHJpeCgpO1xuXHRcdGNvbnN0IHR5ID0gbmV3IFhDU1NNYXRyaXgoKTtcblx0XHRjb25zdCB0eiA9IG5ldyBYQ1NTTWF0cml4KCk7XG5cdFx0bGV0IHNpbkEsIGNvc0EsIHNxO1xuXG5cdFx0cnogLz0gMjtcblx0XHRzaW5BICA9IE1hdGguc2luKHJ6KTtcblx0XHRjb3NBICA9IE1hdGguY29zKHJ6KTtcblx0XHRzcSA9IHNpbkEgKiBzaW5BO1xuXG5cdFx0Ly8gTWF0cmljZXMgYXJlIGlkZW50aXR5IG91dHNpZGUgdGhlIGFzc2lnbmVkIHZhbHVlc1xuXHRcdHR6Lm0xMSA9IHR6Lm0yMiA9IDEgLSAyICogc3E7XG5cdFx0dHoubTEyID0gdHoubTIxID0gMiAqIHNpbkEgKiBjb3NBO1xuXHRcdHR6Lm0yMSAqPSAtMTtcblxuXHRcdHJ5IC89IDI7XG5cdFx0c2luQSAgPSBNYXRoLnNpbihyeSk7XG5cdFx0Y29zQSAgPSBNYXRoLmNvcyhyeSk7XG5cdFx0c3EgPSBzaW5BICogc2luQTtcblxuXHRcdHR5Lm0xMSA9IHR5Lm0zMyA9IDEgLSAyICogc3E7XG5cdFx0dHkubTEzID0gdHkubTMxID0gMiAqIHNpbkEgKiBjb3NBO1xuXHRcdHR5Lm0xMyAqPSAtMTtcblxuXHRcdHJ4IC89IDI7XG5cdFx0c2luQSA9IE1hdGguc2luKHJ4KTtcblx0XHRjb3NBID0gTWF0aC5jb3MocngpO1xuXHRcdHNxID0gc2luQSAqIHNpbkE7XG5cblx0XHR0eC5tMjIgPSB0eC5tMzMgPSAxIC0gMiAqIHNxO1xuXHRcdHR4Lm0yMyA9IHR4Lm0zMiA9IDIgKiBzaW5BICogY29zQTtcblx0XHR0eC5tMzIgKj0gLTE7XG5cblx0XHRjb25zdCBpZGVudGl0eU1hdHJpeCA9IG5ldyBYQ1NTTWF0cml4KCk7IC8vIHJldHVybnMgaWRlbnRpdHkgbWF0cml4IGJ5IGRlZmF1bHRcblx0XHRjb25zdCBpc0lkZW50aXR5ID0gdGhpcy50b1N0cmluZygpID09PSBpZGVudGl0eU1hdHJpeC50b1N0cmluZygpO1xuXHRcdGNvbnN0IHJvdGF0ZWRNYXRyaXggPSBpc0lkZW50aXR5ID9cblx0XHRcdHR6Lm11bHRpcGx5KHR5KS5tdWx0aXBseSh0eCkgOlxuXHRcdFx0dGhpcy5tdWx0aXBseSh0eCkubXVsdGlwbHkodHkpLm11bHRpcGx5KHR6KTtcblxuXHRcdHJldHVybiByb3RhdGVkTWF0cml4O1xuXHR9LFxuXG5cdC8qKlxuXHQgKiAgUmV0dXJucyB0aGUgcmVzdWx0IG9mIHNjYWxpbmcgdGhlIG1hdHJpeCBieSBhIGdpdmVuIHZlY3Rvci5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVggLSB0aGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHggYXhpcy5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVkgLSB0aGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHkgYXhpcy4gSWYgdW5kZWZpbmVkLCB0aGUgeCBjb21wb25lbnQgaXMgdXNlZC5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSBzY2FsZVogLSB0aGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHogYXhpcy4gSWYgdW5kZWZpbmVkLCAxIGlzIHVzZWQuXG5cdCAqICBAcmV0dXJucyBYQ1NTTWF0cml4XG5cdCAqL1xuXHRzY2FsZShzY2FsZVgsIHNjYWxlWSwgc2NhbGVaKSB7XG5cdFx0Y29uc3QgdHJhbnNmb3JtID0gbmV3IFhDU1NNYXRyaXgoKTtcblxuXHRcdGlmIChzY2FsZVggPT09IHVuZGVmaW5lZCkgeyBzY2FsZVggPSAxOyB9XG5cdFx0aWYgKHNjYWxlWSA9PT0gdW5kZWZpbmVkKSB7IHNjYWxlWSA9IHNjYWxlWDsgfVxuXHRcdGlmICghc2NhbGVaKSB7IHNjYWxlWiA9IDE7IH1cblxuXHRcdHRyYW5zZm9ybS5tMTEgPSBzY2FsZVg7XG5cdFx0dHJhbnNmb3JtLm0yMiA9IHNjYWxlWTtcblx0XHR0cmFuc2Zvcm0ubTMzID0gc2NhbGVaO1xuXG5cdFx0cmV0dXJuIHRoaXMubXVsdGlwbHkodHJhbnNmb3JtKTtcblx0fSxcblxuXHQvKipcblx0ICogIFJldHVybnMgdGhlIHJlc3VsdCBvZiBza2V3aW5nIHRoZSBtYXRyaXggYnkgYSBnaXZlbiB2ZWN0b3IuXG5cdCAqICBAcGFyYW0ge251bWJlcn0gc2tld1ggLSBUaGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHggYXhpcy5cblx0ICogIEByZXR1cm5zIFhDU1NNYXRyaXhcblx0ICovXG5cdHNrZXdYKGRlZ3JlZXMpIHtcblx0XHRjb25zdCByYWRpYW5zICAgPSBkZWcycmFkKGRlZ3JlZXMpO1xuXHRcdGNvbnN0IHRyYW5zZm9ybSA9IG5ldyBYQ1NTTWF0cml4KCk7XG5cblx0XHR0cmFuc2Zvcm0uYyA9IE1hdGgudGFuKHJhZGlhbnMpO1xuXG5cdFx0cmV0dXJuIHRoaXMubXVsdGlwbHkodHJhbnNmb3JtKTtcblx0fSxcblxuXHQvKipcblx0ICogIFJldHVybnMgdGhlIHJlc3VsdCBvZiBza2V3aW5nIHRoZSBtYXRyaXggYnkgYSBnaXZlbiB2ZWN0b3IuXG5cdCAqICBAcGFyYW0ge251bWJlcn0gc2tld1kgLSB0aGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHggYXhpcy5cblx0ICogIEByZXR1cm5zIFhDU1NNYXRyaXhcblx0ICovXG5cdHNrZXdZKGRlZ3JlZXMpIHtcblx0XHRjb25zdCByYWRpYW5zICAgPSBkZWcycmFkKGRlZ3JlZXMpO1xuXHRcdGNvbnN0IHRyYW5zZm9ybSA9IG5ldyBYQ1NTTWF0cml4KCk7XG5cblx0XHR0cmFuc2Zvcm0uYiA9IE1hdGgudGFuKHJhZGlhbnMpO1xuXG5cdFx0cmV0dXJuIHRoaXMubXVsdGlwbHkodHJhbnNmb3JtKTtcblx0fSxcblxuXHQvKipcblx0ICogIFJldHVybnMgdGhlIHJlc3VsdCBvZiB0cmFuc2xhdGluZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxuXHQgKiAgQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgeCBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIHkgY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG5cdCAqICBAcGFyYW0ge251bWJlcn0geiAtIFRoZSB6IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLiBJZiB1bmRlZmluZWQsIDAgaXMgdXNlZC5cblx0ICogIEByZXR1cm5zIFhDU1NNYXRyaXhcblx0ICovXG5cdHRyYW5zbGF0ZSh4LCB5LCB6KSB7XG5cdFx0Y29uc3QgdCA9IG5ldyBYQ1NTTWF0cml4KCk7XG5cblx0XHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB7IHggPSAwOyB9XG5cdFx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeyB5ID0gMDsgfVxuXHRcdGlmICh6ID09PSB1bmRlZmluZWQpIHsgeiA9IDA7IH1cblxuXHRcdHQubTQxID0geDtcblx0XHR0Lm00MiA9IHk7XG5cdFx0dC5tNDMgPSB6O1xuXG5cdFx0cmV0dXJuIHRoaXMubXVsdGlwbHkodCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqICBTZXRzIHRoZSBtYXRyaXggdmFsdWVzIHVzaW5nIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uLCBzdWNoIGFzIHRoYXQgcHJvZHVjZWRcblx0ICogIGJ5IHRoZSBbW1hDU1NNYXRyaXgjdG9TdHJpbmddXSBtZXRob2QuXG5cdCAqICBAcGFyYW1zIHtzdHJpbmd9IGRvbXN0ciAtIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgMkQgb3IgM0QgdHJhbnNmb3JtIG1hdHJpeFxuXHQgKiAgICBpbiB0aGUgZm9ybSBnaXZlbiBieSB0aGUgQ1NTIHRyYW5zZm9ybSBwcm9wZXJ0eSwgaS5lLiBqdXN0IGxpa2UgdGhlXG5cdCAqICAgIG91dHB1dCBmcm9tIFtbWENTU01hdHJpeCN0b1N0cmluZ11dLlxuXHQgKiAgQHJldHVybnMgdW5kZWZpbmVkXG5cdCAqL1xuXHRzZXRNYXRyaXhWYWx1ZShkb21zdHIpIHtcblx0XHRpZiAoIWRvbXN0cikgeyByZXR1cm47IH1cblxuXHRcdHZhciBtYXRyaXhPYmplY3QgPSB0cmFuc3AoZG9tc3RyKTtcblx0XHRpZiAoIW1hdHJpeE9iamVjdCkgeyByZXR1cm47IH1cblxuXHRcdHZhciBpczNkICAgPSBtYXRyaXhPYmplY3Qua2V5ID09PSAnbWF0cml4M2QnO1xuXHRcdHZhciBrZXlnZW4gPSBpczNkID8gaW5kZXhUb0tleTNkIDogaW5kZXhUb0tleTJkO1xuXHRcdHZhciB2YWx1ZXMgPSBtYXRyaXhPYmplY3QudmFsdWU7XG5cdFx0dmFyIGNvdW50ICA9IHZhbHVlcy5sZW5ndGg7XG5cblx0XHRpZiAoKGlzM2QgJiYgY291bnQgIT09IDE2KSB8fCAhKGlzM2QgfHwgY291bnQgPT09IDYpKSB7IHJldHVybjsgfVxuXG5cdFx0dmFsdWVzLmZvckVhY2goZnVuY3Rpb24ob2JqLCBpZHgpIHtcblx0XHRcdHZhciBrZXkgPSBrZXlnZW4oaWR4KTtcblx0XHRcdHRoaXNba2V5XSA9IG9iai52YWx1ZTtcblx0XHR9LCB0aGlzKTtcblx0fSxcblxuXHRkZWNvbXBvc2UoKSB7XG5cdFx0cmV0dXJuIG1hdHJpeC5kZWNvbXBvc2UodGhpcyk7XG5cdH0sXG5cblx0Y29tcG9zZSh7XG5cdFx0eCwgeSwgeixcblx0XHRyb3RhdGVYLCByb3RhdGVZLCByb3RhdGVaLFxuXHRcdHNjYWxlWCwgc2NhbGVZLCBzY2FsZVosXG5cdFx0c2tld1gsIHNrZXdZXG5cdH0pIHtcblx0XHRsZXQgbSA9IHRoaXM7XG5cdFx0bSA9IG0udHJhbnNsYXRlKHgsIHksIHopO1xuXHRcdG0gPSBtLnJvdGF0ZShyb3RhdGVYLCByb3RhdGVZLCByb3RhdGVaKTtcblx0XHRtID0gbS5zY2FsZShzY2FsZVgsIHNjYWxlWSwgc2NhbGVaKTtcblx0XHRpZiAoc2tld1ggIT09IHVuZGVmaW5lZCkgeyBtID0gbS5za2V3WChza2V3WCk7IH1cblx0XHRpZiAoc2tld1kgIT09IHVuZGVmaW5lZCkgeyBtID0gbS5za2V3WShza2V3WSk7IH1cblxuXHRcdHJldHVybiBtO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiAgUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4LlxuXHQgKiAgQHJldHVybnMge3N0cmluZ30gbWF0cml4U3RyaW5nIC0gYSBzdHJpbmcgbGlrZSBgbWF0cml4KDEuMDAwMDAwLCAwLjAwMDAwMCwgMC4wMDAwMDAsIDEuMDAwMDAwLCAwLjAwMDAwMCwgMC4wMDAwMDApYFxuXHQgKlxuXHQgKiovXG5cdHRvU3RyaW5nKCkge1xuXHRcdGxldCBwb2ludHMsIHByZWZpeDtcblxuXHRcdGlmIChtYXRyaXguaXNBZmZpbmUodGhpcykpIHtcblx0XHRcdHByZWZpeCA9ICdtYXRyaXgnO1xuXHRcdFx0cG9pbnRzID0gcG9pbnRzMmQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHByZWZpeCA9ICdtYXRyaXgzZCc7XG5cdFx0XHRwb2ludHMgPSBwb2ludHMzZDtcblx0XHR9XG5cblx0XHRyZXR1cm4gYCR7cHJlZml4fSgke3BvaW50cy5tYXAobG9va3VwVG9GaXhlZCwgdGhpcykuam9pbignLCAnKX0pYDtcblx0fVxufTsiLCJjb25zdCBWZWN0b3I0ID0gcmVxdWlyZSgnLi9WZWN0b3I0Jyk7XG5cbi8qKlxuICogIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgMngyIG1hdHJpeC5cbiAqICBAcGFyYW0ge251bWJlcn0gYSAtIFRvcC1sZWZ0IHZhbHVlIG9mIHRoZSBtYXRyaXguXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGIgLSBUb3AtcmlnaHQgdmFsdWUgb2YgdGhlIG1hdHJpeC5cbiAqICBAcGFyYW0ge251bWJlcn0gYyAtIEJvdHRvbS1sZWZ0IHZhbHVlIG9mIHRoZSBtYXRyaXguXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGQgLSBCb3R0b20tcmlnaHQgdmFsdWUgb2YgdGhlIG1hdHJpeC5cbiAqICBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5jb25zdCBkZXRlcm1pbmFudDJ4MiA9IGZ1bmN0aW9uKGEsIGIsIGMsIGQpIHtcblx0cmV0dXJuIGEgKiBkIC0gYiAqIGM7XG59O1xuXG4vKipcbiAqICBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIDN4MyBtYXRyaXguXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGExIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFsxLCAxXS5cbiAqICBAcGFyYW0ge251bWJlcn0gYTIgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzEsIDJdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBhMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMSwgM10uXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGIxIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFsyLCAxXS5cbiAqICBAcGFyYW0ge251bWJlcn0gYjIgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzIsIDJdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBiMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMiwgM10uXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGMxIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFszLCAxXS5cbiAqICBAcGFyYW0ge251bWJlcn0gYzIgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzMsIDJdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBjMyAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMywgM10uXG4gKiAgQHJldHVybnMge251bWJlcn1cbiAqL1xuY29uc3QgZGV0ZXJtaW5hbnQzeDMgPSBmdW5jdGlvbihhMSwgYTIsIGEzLCBiMSwgYjIsIGIzLCBjMSwgYzIsIGMzKSB7XG5cdHJldHVybiBhMSAqIGRldGVybWluYW50MngyKGIyLCBiMywgYzIsIGMzKSAtXG5cdFx0YjEgKiBkZXRlcm1pbmFudDJ4MihhMiwgYTMsIGMyLCBjMykgK1xuXHRcdGMxICogZGV0ZXJtaW5hbnQyeDIoYTIsIGEzLCBiMiwgYjMpO1xufTtcblxuLyoqXG4gKiAgQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSA0eDQgbWF0cml4LlxuICogIEBwYXJhbSB7WENTU01hdHJpeH0gbWF0cml4IC0gVGhlIG1hdHJpeCB0byBjYWxjdWxhdGUgdGhlIGRldGVybWluYW50IG9mLlxuICogIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmNvbnN0IGRldGVybWluYW50NHg0ID0gZnVuY3Rpb24obWF0cml4KSB7XG5cdGxldCBtID0gbWF0cml4LFxuXHRcdC8vIEFzc2lnbiB0byBpbmRpdmlkdWFsIHZhcmlhYmxlIG5hbWVzIHRvIGFpZCBzZWxlY3RpbmcgY29ycmVjdCBlbGVtZW50c1xuXHRcdGExID0gbS5tMTEsIGIxID0gbS5tMjEsIGMxID0gbS5tMzEsIGQxID0gbS5tNDEsXG5cdFx0YTIgPSBtLm0xMiwgYjIgPSBtLm0yMiwgYzIgPSBtLm0zMiwgZDIgPSBtLm00Mixcblx0XHRhMyA9IG0ubTEzLCBiMyA9IG0ubTIzLCBjMyA9IG0ubTMzLCBkMyA9IG0ubTQzLFxuXHRcdGE0ID0gbS5tMTQsIGI0ID0gbS5tMjQsIGM0ID0gbS5tMzQsIGQ0ID0gbS5tNDQ7XG5cblx0cmV0dXJuIGExICogZGV0ZXJtaW5hbnQzeDMoYjIsIGIzLCBiNCwgYzIsIGMzLCBjNCwgZDIsIGQzLCBkNCkgLVxuXHRcdGIxICogZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYzIsIGMzLCBjNCwgZDIsIGQzLCBkNCkgK1xuXHRcdGMxICogZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgZDIsIGQzLCBkNCkgLVxuXHRcdGQxICogZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgYzIsIGMzLCBjNCk7XG59O1xuXG4vKipcbiAqICBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG1hdHJpeCBpcyBhZmZpbmUuXG4gKiAgQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzQWZmaW5lID0gZnVuY3Rpb24obSkge1xuXHRyZXR1cm4gbS5tMTMgPT09IDAgJiYgbS5tMTQgPT09IDAgJiZcblx0XHRtLm0yMyA9PT0gMCAmJiBtLm0yNCA9PT0gMCAmJlxuXHRcdG0ubTMxID09PSAwICYmIG0ubTMyID09PSAwICYmXG5cdFx0bS5tMzMgPT09IDEgJiYgbS5tMzQgPT09IDAgJiZcblx0XHRtLm00MyA9PT0gMCAmJiBtLm00NCA9PT0gMTtcbn07XG5cbi8qKlxuICogIFJldHVybnMgd2hldGhlciB0aGUgbWF0cml4IGlzIHRoZSBpZGVudGl0eSBtYXRyaXggb3IgYSB0cmFuc2xhdGlvbiBtYXRyaXguXG4gKiAgQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuY29uc3QgaXNJZGVudGl0eU9yVHJhbnNsYXRpb24gPSBmdW5jdGlvbihtKSB7XG5cdHJldHVybiBtLm0xMSA9PT0gMSAmJiBtLm0xMiA9PT0gMCAmJiBtLm0xMyA9PT0gMCAmJiBtLm0xNCA9PT0gMCAmJlxuXHRcdG0ubTIxID09PSAwICYmIG0ubTIyID09PSAxICYmIG0ubTIzID09PSAwICYmIG0ubTI0ID09PSAwICYmXG5cdFx0bS5tMzEgPT09IDAgJiYgbS5tMzEgPT09IDAgJiYgbS5tMzMgPT09IDEgJiYgbS5tMzQgPT09IDAgJiZcblx0XHQvLyBtNDEsIG00MiBhbmQgbTQzIGFyZSB0aGUgdHJhbnNsYXRpb24gcG9pbnRzXG5cdFx0bS5tNDQgPT09IDE7XG59O1xuXG4vKipcbiAqICBSZXR1cm5zIHRoZSBhZGpvaW50IG1hdHJpeC5cbiAqICBAcmV0dXJuIHtYQ1NTTWF0cml4fVxuICovXG5jb25zdCBhZGpvaW50ID0gZnVuY3Rpb24obSkge1xuXHQvLyBtYWtlIGByZXN1bHRgIHRoZSBzYW1lIHR5cGUgYXMgdGhlIGdpdmVuIG1ldHJpY1xuXHRjb25zdCByZXN1bHQgPSBuZXcgbS5jb25zdHJ1Y3RvcigpO1xuXHRsZXQgYTEgPSBtLm0xMSwgYjEgPSBtLm0xMiwgYzEgPSBtLm0xMywgZDEgPSBtLm0xNDtcblx0bGV0IGEyID0gbS5tMjEsIGIyID0gbS5tMjIsIGMyID0gbS5tMjMsIGQyID0gbS5tMjQ7XG5cdGxldCBhMyA9IG0ubTMxLCBiMyA9IG0ubTMyLCBjMyA9IG0ubTMzLCBkMyA9IG0ubTM0O1xuXHRsZXQgYTQgPSBtLm00MSwgYjQgPSBtLm00MiwgYzQgPSBtLm00MywgZDQgPSBtLm00NDtcblxuXHQvLyBSb3cgY29sdW1uIGxhYmVsaW5nIHJldmVyc2VkIHNpbmNlIHdlIHRyYW5zcG9zZSByb3dzICYgY29sdW1uc1xuXHRyZXN1bHQubTExID0gIGRldGVybWluYW50M3gzKGIyLCBiMywgYjQsIGMyLCBjMywgYzQsIGQyLCBkMywgZDQpO1xuXHRyZXN1bHQubTIxID0gLWRldGVybWluYW50M3gzKGEyLCBhMywgYTQsIGMyLCBjMywgYzQsIGQyLCBkMywgZDQpO1xuXHRyZXN1bHQubTMxID0gIGRldGVybWluYW50M3gzKGEyLCBhMywgYTQsIGIyLCBiMywgYjQsIGQyLCBkMywgZDQpO1xuXHRyZXN1bHQubTQxID0gLWRldGVybWluYW50M3gzKGEyLCBhMywgYTQsIGIyLCBiMywgYjQsIGMyLCBjMywgYzQpO1xuXG5cdHJlc3VsdC5tMTIgPSAtZGV0ZXJtaW5hbnQzeDMoYjEsIGIzLCBiNCwgYzEsIGMzLCBjNCwgZDEsIGQzLCBkNCk7XG5cdHJlc3VsdC5tMjIgPSAgZGV0ZXJtaW5hbnQzeDMoYTEsIGEzLCBhNCwgYzEsIGMzLCBjNCwgZDEsIGQzLCBkNCk7XG5cdHJlc3VsdC5tMzIgPSAtZGV0ZXJtaW5hbnQzeDMoYTEsIGEzLCBhNCwgYjEsIGIzLCBiNCwgZDEsIGQzLCBkNCk7XG5cdHJlc3VsdC5tNDIgPSAgZGV0ZXJtaW5hbnQzeDMoYTEsIGEzLCBhNCwgYjEsIGIzLCBiNCwgYzEsIGMzLCBjNCk7XG5cblx0cmVzdWx0Lm0xMyA9ICBkZXRlcm1pbmFudDN4MyhiMSwgYjIsIGI0LCBjMSwgYzIsIGM0LCBkMSwgZDIsIGQ0KTtcblx0cmVzdWx0Lm0yMyA9IC1kZXRlcm1pbmFudDN4MyhhMSwgYTIsIGE0LCBjMSwgYzIsIGM0LCBkMSwgZDIsIGQ0KTtcblx0cmVzdWx0Lm0zMyA9ICBkZXRlcm1pbmFudDN4MyhhMSwgYTIsIGE0LCBiMSwgYjIsIGI0LCBkMSwgZDIsIGQ0KTtcblx0cmVzdWx0Lm00MyA9IC1kZXRlcm1pbmFudDN4MyhhMSwgYTIsIGE0LCBiMSwgYjIsIGI0LCBjMSwgYzIsIGM0KTtcblxuXHRyZXN1bHQubTE0ID0gLWRldGVybWluYW50M3gzKGIxLCBiMiwgYjMsIGMxLCBjMiwgYzMsIGQxLCBkMiwgZDMpO1xuXHRyZXN1bHQubTI0ID0gIGRldGVybWluYW50M3gzKGExLCBhMiwgYTMsIGMxLCBjMiwgYzMsIGQxLCBkMiwgZDMpO1xuXHRyZXN1bHQubTM0ID0gLWRldGVybWluYW50M3gzKGExLCBhMiwgYTMsIGIxLCBiMiwgYjMsIGQxLCBkMiwgZDMpO1xuXHRyZXN1bHQubTQ0ID0gIGRldGVybWluYW50M3gzKGExLCBhMiwgYTMsIGIxLCBiMiwgYjMsIGMxLCBjMiwgYzMpO1xuXG5cdHJldHVybiByZXN1bHQ7XG59O1xuXG5jb25zdCBpbnZlcnNlID0gZnVuY3Rpb24obWF0cml4KSB7XG5cdGxldCBpbnY7XG5cblx0aWYgKGlzSWRlbnRpdHlPclRyYW5zbGF0aW9uKG1hdHJpeCkpIHtcblx0XHRpbnYgPSBuZXcgbWF0cml4LmNvbnN0cnVjdG9yKCk7XG5cblx0XHRpZiAoIShtYXRyaXgubTQxID09PSAwICYmIG1hdHJpeC5tNDIgPT09IDAgJiYgbWF0cml4Lm00MyA9PT0gMCkpIHtcblx0XHRcdGludi5tNDEgPSAtbWF0cml4Lm00MTtcblx0XHRcdGludi5tNDIgPSAtbWF0cml4Lm00Mjtcblx0XHRcdGludi5tNDMgPSAtbWF0cml4Lm00Mztcblx0XHR9XG5cblx0XHRyZXR1cm4gaW52O1xuXHR9XG5cblx0Ly8gQ2FsY3VsYXRlIHRoZSBhZGpvaW50IG1hdHJpeFxuXHRjb25zdCByZXN1bHQgPSBhZGpvaW50KG1hdHJpeCk7XG5cblx0Ly8gQ2FsY3VsYXRlIHRoZSA0eDQgZGV0ZXJtaW5hbnRcblx0Y29uc3QgZGV0ID0gZGV0ZXJtaW5hbnQ0eDQobWF0cml4KTtcblxuXHQvLyBJZiB0aGUgZGV0ZXJtaW5hbnQgaXMgemVybywgdGhlbiB0aGUgaW52ZXJzZSBtYXRyaXggaXMgbm90IHVuaXF1ZVxuXHRpZiAoTWF0aC5hYnMoZGV0KSA8IDFlLTgpIHsgcmV0dXJuIG51bGw7IH1cblxuXHQvLyBTY2FsZSB0aGUgYWRqb2ludCBtYXRyaXggdG8gZ2V0IHRoZSBpbnZlcnNlXG5cdGZvciAobGV0IGlkeCA9IDE7IGlkeCA8IDU7IGlkeCsrKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDE7IGkgPCA1OyBpKyspIHtcblx0XHRcdHJlc3VsdFsoJ20nICsgaWR4KSArIGldIC89IGRldDtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufTtcblxuY29uc3QgbXVsdGlwbHkgPSBmdW5jdGlvbihtYXRyaXgsIG90aGVyTWF0cml4KSB7XG5cdGlmICghb3RoZXJNYXRyaXgpIHsgcmV0dXJuIG51bGw7IH1cblxuXHRsZXQgYSA9IG90aGVyTWF0cml4O1xuXHRsZXQgYiA9IG1hdHJpeDtcblx0bGV0IGMgPSBuZXcgbWF0cml4LmNvbnN0cnVjdG9yKCk7XG5cblx0Yy5tMTEgPSBhLm0xMSAqIGIubTExICsgYS5tMTIgKiBiLm0yMSArIGEubTEzICogYi5tMzEgKyBhLm0xNCAqIGIubTQxO1xuXHRjLm0xMiA9IGEubTExICogYi5tMTIgKyBhLm0xMiAqIGIubTIyICsgYS5tMTMgKiBiLm0zMiArIGEubTE0ICogYi5tNDI7XG5cdGMubTEzID0gYS5tMTEgKiBiLm0xMyArIGEubTEyICogYi5tMjMgKyBhLm0xMyAqIGIubTMzICsgYS5tMTQgKiBiLm00Mztcblx0Yy5tMTQgPSBhLm0xMSAqIGIubTE0ICsgYS5tMTIgKiBiLm0yNCArIGEubTEzICogYi5tMzQgKyBhLm0xNCAqIGIubTQ0O1xuXG5cdGMubTIxID0gYS5tMjEgKiBiLm0xMSArIGEubTIyICogYi5tMjEgKyBhLm0yMyAqIGIubTMxICsgYS5tMjQgKiBiLm00MTtcblx0Yy5tMjIgPSBhLm0yMSAqIGIubTEyICsgYS5tMjIgKiBiLm0yMiArIGEubTIzICogYi5tMzIgKyBhLm0yNCAqIGIubTQyO1xuXHRjLm0yMyA9IGEubTIxICogYi5tMTMgKyBhLm0yMiAqIGIubTIzICsgYS5tMjMgKiBiLm0zMyArIGEubTI0ICogYi5tNDM7XG5cdGMubTI0ID0gYS5tMjEgKiBiLm0xNCArIGEubTIyICogYi5tMjQgKyBhLm0yMyAqIGIubTM0ICsgYS5tMjQgKiBiLm00NDtcblxuXHRjLm0zMSA9IGEubTMxICogYi5tMTEgKyBhLm0zMiAqIGIubTIxICsgYS5tMzMgKiBiLm0zMSArIGEubTM0ICogYi5tNDE7XG5cdGMubTMyID0gYS5tMzEgKiBiLm0xMiArIGEubTMyICogYi5tMjIgKyBhLm0zMyAqIGIubTMyICsgYS5tMzQgKiBiLm00Mjtcblx0Yy5tMzMgPSBhLm0zMSAqIGIubTEzICsgYS5tMzIgKiBiLm0yMyArIGEubTMzICogYi5tMzMgKyBhLm0zNCAqIGIubTQzO1xuXHRjLm0zNCA9IGEubTMxICogYi5tMTQgKyBhLm0zMiAqIGIubTI0ICsgYS5tMzMgKiBiLm0zNCArIGEubTM0ICogYi5tNDQ7XG5cblx0Yy5tNDEgPSBhLm00MSAqIGIubTExICsgYS5tNDIgKiBiLm0yMSArIGEubTQzICogYi5tMzEgKyBhLm00NCAqIGIubTQxO1xuXHRjLm00MiA9IGEubTQxICogYi5tMTIgKyBhLm00MiAqIGIubTIyICsgYS5tNDMgKiBiLm0zMiArIGEubTQ0ICogYi5tNDI7XG5cdGMubTQzID0gYS5tNDEgKiBiLm0xMyArIGEubTQyICogYi5tMjMgKyBhLm00MyAqIGIubTMzICsgYS5tNDQgKiBiLm00Mztcblx0Yy5tNDQgPSBhLm00MSAqIGIubTE0ICsgYS5tNDIgKiBiLm0yNCArIGEubTQzICogYi5tMzQgKyBhLm00NCAqIGIubTQ0O1xuXG5cdHJldHVybiBjO1xufTtcblxuZnVuY3Rpb24gdHJhbnNwb3NlKG1hdHJpeCkge1xuXHR2YXIgcmVzdWx0ID0gbmV3IG1hdHJpeC5jb25zdHJ1Y3RvcigpO1xuXHR2YXIgcm93cyA9IDQsIGNvbHMgPSA0O1xuXHR2YXIgaSA9IGNvbHMsIGo7XG5cdHdoaWxlIChpKSB7XG5cdFx0aiA9IHJvd3M7XG5cdFx0d2hpbGUgKGopIHtcblx0XHRcdHJlc3VsdFsnbScgKyBpICsgal0gPSBtYXRyaXhbJ20nICsgaiArIGldO1xuXHRcdFx0ai0tO1xuXHRcdH1cblx0XHRpLS07XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiAgSW5wdXQ6ICBtYXRyaXggICAgICA7IGEgNHg0IG1hdHJpeFxuICogIE91dHB1dDogdHJhbnNsYXRpb24gOyBhIDMgY29tcG9uZW50IHZlY3RvclxuICogICAgICAgICAgc2NhbGUgICAgICAgOyBhIDMgY29tcG9uZW50IHZlY3RvclxuICogICAgICAgICAgc2tldyAgICAgICAgOyBza2V3IGZhY3RvcnMgWFksWFosWVogcmVwcmVzZW50ZWQgYXMgYSAzIGNvbXBvbmVudCB2ZWN0b3JcbiAqICAgICAgICAgIHBlcnNwZWN0aXZlIDsgYSA0IGNvbXBvbmVudCB2ZWN0b3JcbiAqICAgICAgICAgIHJvdGF0ZSAgOyBhIDQgY29tcG9uZW50IHZlY3RvclxuICogIFJldHVybnMgZmFsc2UgaWYgdGhlIG1hdHJpeCBjYW5ub3QgYmUgZGVjb21wb3NlZCwgdHJ1ZSBpZiBpdCBjYW5cbiAqL1xuZnVuY3Rpb24gZGVjb21wb3NlKG1hdHJpeCkge1xuXHRsZXQgcGVyc3BlY3RpdmVNYXRyaXg7XG5cdGxldCByaWdodEhhbmRTaWRlO1xuXHRsZXQgaW52ZXJzZVBlcnNwZWN0aXZlTWF0cml4O1xuXHRsZXQgdHJhbnNwb3NlZEludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeDtcblx0bGV0IHBlcnNwZWN0aXZlO1xuXHRsZXQgdHJhbnNsYXRlO1xuXHRsZXQgcm93O1xuXHRsZXQgaTtcblx0bGV0IGxlbjtcblx0bGV0IHNjYWxlO1xuXHRsZXQgc2tldztcblx0bGV0IHBkdW0zO1xuXHRsZXQgcm90YXRlO1xuXG5cdC8vIE5vcm1hbGl6ZSB0aGUgbWF0cml4LlxuXHRpZiAobWF0cml4Lm0zMyA9PT0gMCkgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRmb3IgKGxldCBpID0gMTsgaSA8PSA0OyBpKyspIHtcblx0XHRmb3IgKGxldCBqID0gMTsgaiA8IDQ7IGorKykge1xuXHRcdFx0bWF0cml4WydtJyArIGkgKyBqXSAvPSBtYXRyaXgubTQ0O1xuXHRcdH1cblx0fVxuXG5cdC8vIHBlcnNwZWN0aXZlTWF0cml4IGlzIHVzZWQgdG8gc29sdmUgZm9yIHBlcnNwZWN0aXZlLCBidXQgaXQgYWxzbyBwcm92aWRlc1xuXHQvLyBhbiBlYXN5IHdheSB0byB0ZXN0IGZvciBzaW5ndWxhcml0eSBvZiB0aGUgdXBwZXIgM3gzIGNvbXBvbmVudC5cblx0cGVyc3BlY3RpdmVNYXRyaXggPSBtYXRyaXg7XG5cdHBlcnNwZWN0aXZlTWF0cml4Lm0xNCA9IDA7XG5cdHBlcnNwZWN0aXZlTWF0cml4Lm0yNCA9IDA7XG5cdHBlcnNwZWN0aXZlTWF0cml4Lm0zNCA9IDA7XG5cdHBlcnNwZWN0aXZlTWF0cml4Lm00NCA9IDE7XG5cblx0aWYgKGRldGVybWluYW50NHg0KHBlcnNwZWN0aXZlTWF0cml4KSA9PT0gMCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIEZpcnN0LCBpc29sYXRlIHBlcnNwZWN0aXZlLlxuXHRpZiAobWF0cml4Lm0xNCAhPT0gMCB8fCBtYXRyaXgubTI0ICE9PSAwIHx8IG1hdHJpeC5tMzQgIT09IDApIHtcblx0XHQvLyByaWdodEhhbmRTaWRlIGlzIHRoZSByaWdodCBoYW5kIHNpZGUgb2YgdGhlIGVxdWF0aW9uLlxuXHRcdHJpZ2h0SGFuZFNpZGUgPSBuZXcgVmVjdG9yNChtYXRyaXgubTE0LCBtYXRyaXgubTI0LCBtYXRyaXgubTM0LCBtYXRyaXgubTQ0KTtcblxuXHRcdC8vIFNvbHZlIHRoZSBlcXVhdGlvbiBieSBpbnZlcnRpbmcgcGVyc3BlY3RpdmVNYXRyaXggYW5kIG11bHRpcGx5aW5nXG5cdFx0Ly8gcmlnaHRIYW5kU2lkZSBieSB0aGUgaW52ZXJzZS5cblx0XHRpbnZlcnNlUGVyc3BlY3RpdmVNYXRyaXggPSBpbnZlcnNlKHBlcnNwZWN0aXZlTWF0cml4KTtcblx0XHR0cmFuc3Bvc2VkSW52ZXJzZVBlcnNwZWN0aXZlTWF0cml4ID0gdHJhbnNwb3NlKGludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCk7XG5cdFx0cGVyc3BlY3RpdmUgPSByaWdodEhhbmRTaWRlLm11bHRpcGx5QnlNYXRyaXgodHJhbnNwb3NlZEludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCk7XG5cdH1cblx0ZWxzZSB7XG5cdFx0Ly8gTm8gcGVyc3BlY3RpdmUuXG5cdFx0cGVyc3BlY3RpdmUgPSBuZXcgVmVjdG9yNCgwLCAwLCAwLCAxKTtcblx0fVxuXG5cdC8vIE5leHQgdGFrZSBjYXJlIG9mIHRyYW5zbGF0aW9uXG5cdC8vIElmIGl0J3MgYSAyRCBtYXRyaXgsIGUgYW5kIGYgd2lsbCBiZSBmaWxsZWRcblx0dHJhbnNsYXRlID0gbmV3IFZlY3RvcjQobWF0cml4LmUgfHwgbWF0cml4Lm00MSwgbWF0cml4LmYgfHwgbWF0cml4Lm00MiwgbWF0cml4Lm00Myk7XG5cblx0Ly8gTm93IGdldCBzY2FsZSBhbmQgc2hlYXIuICdyb3cnIGlzIGEgMyBlbGVtZW50IGFycmF5IG9mIDMgY29tcG9uZW50IHZlY3RvcnNcblx0cm93ID0gWyBuZXcgVmVjdG9yNCgpLCBuZXcgVmVjdG9yNCgpLCBuZXcgVmVjdG9yNCgpIF07XG5cdGZvciAoaSA9IDEsIGxlbiA9IHJvdy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdHJvd1tpIC0gMV0ueCA9IG1hdHJpeFsnbScgKyBpICsgJzEnXTtcblx0XHRyb3dbaSAtIDFdLnkgPSBtYXRyaXhbJ20nICsgaSArICcyJ107XG5cdFx0cm93W2kgLSAxXS56ID0gbWF0cml4WydtJyArIGkgKyAnMyddO1xuXHR9XG5cblx0Ly8gQ29tcHV0ZSBYIHNjYWxlIGZhY3RvciBhbmQgbm9ybWFsaXplIGZpcnN0IHJvdy5cblx0c2NhbGUgPSBuZXcgVmVjdG9yNCgpO1xuXHRza2V3ID0gbmV3IFZlY3RvcjQoKTtcblxuXHRzY2FsZS54ID0gcm93WzBdLmxlbmd0aCgpO1xuXHRyb3dbMF0gPSByb3dbMF0ubm9ybWFsaXplKCk7XG5cblx0Ly8gQ29tcHV0ZSBYWSBzaGVhciBmYWN0b3IgYW5kIG1ha2UgMm5kIHJvdyBvcnRob2dvbmFsIHRvIDFzdC5cblx0c2tldy54ID0gcm93WzBdLmRvdChyb3dbMV0pO1xuXHRyb3dbMV0gPSByb3dbMV0uY29tYmluZShyb3dbMF0sIDEuMCwgLXNrZXcueCk7XG5cblx0Ly8gTm93LCBjb21wdXRlIFkgc2NhbGUgYW5kIG5vcm1hbGl6ZSAybmQgcm93LlxuXHRzY2FsZS55ID0gcm93WzFdLmxlbmd0aCgpO1xuXHRyb3dbMV0gPSByb3dbMV0ubm9ybWFsaXplKCk7XG5cdHNrZXcueCAvPSBzY2FsZS55O1xuXG5cdC8vIENvbXB1dGUgWFogYW5kIFlaIHNoZWFycywgb3J0aG9nb25hbGl6ZSAzcmQgcm93XG5cdHNrZXcueSA9IHJvd1swXS5kb3Qocm93WzJdKTtcblx0cm93WzJdID0gcm93WzJdLmNvbWJpbmUocm93WzBdLCAxLjAsIC1za2V3LnkpO1xuXHRza2V3LnogPSByb3dbMV0uZG90KHJvd1syXSk7XG5cdHJvd1syXSA9IHJvd1syXS5jb21iaW5lKHJvd1sxXSwgMS4wLCAtc2tldy56KTtcblxuXHQvLyBOZXh0LCBnZXQgWiBzY2FsZSBhbmQgbm9ybWFsaXplIDNyZCByb3cuXG5cdHNjYWxlLnogPSByb3dbMl0ubGVuZ3RoKCk7XG5cdHJvd1syXSA9IHJvd1syXS5ub3JtYWxpemUoKTtcblx0c2tldy55ID0gKHNrZXcueSAvIHNjYWxlLnopIHx8IDA7XG5cdHNrZXcueiA9IChza2V3LnogLyBzY2FsZS56KSB8fCAwO1xuXG5cdC8vIEF0IHRoaXMgcG9pbnQsIHRoZSBtYXRyaXggKGluIHJvd3MpIGlzIG9ydGhvbm9ybWFsLlxuXHQvLyBDaGVjayBmb3IgYSBjb29yZGluYXRlIHN5c3RlbSBmbGlwLiAgSWYgdGhlIGRldGVybWluYW50XG5cdC8vIGlzIC0xLCB0aGVuIG5lZ2F0ZSB0aGUgbWF0cml4IGFuZCB0aGUgc2NhbGluZyBmYWN0b3JzLlxuXHRwZHVtMyA9IHJvd1sxXS5jcm9zcyhyb3dbMl0pO1xuXHRpZiAocm93WzBdLmRvdChwZHVtMykgPCAwKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcblx0XHRcdHNjYWxlLnggKj0gLTE7XG5cdFx0XHRyb3dbaV0ueCAqPSAtMTtcblx0XHRcdHJvd1tpXS55ICo9IC0xO1xuXHRcdFx0cm93W2ldLnogKj0gLTE7XG5cdFx0fVxuXHR9XG5cblx0Ly8gTm93LCBnZXQgdGhlIHJvdGF0aW9ucyBvdXRcblx0Ly8gRlJPTSBXM0Ncblx0cm90YXRlID0gbmV3IFZlY3RvcjQoKTtcblx0cm90YXRlLnggPSAwLjUgKiBNYXRoLnNxcnQoTWF0aC5tYXgoMSArIHJvd1swXS54IC0gcm93WzFdLnkgLSByb3dbMl0ueiwgMCkpO1xuXHRyb3RhdGUueSA9IDAuNSAqIE1hdGguc3FydChNYXRoLm1heCgxIC0gcm93WzBdLnggKyByb3dbMV0ueSAtIHJvd1syXS56LCAwKSk7XG5cdHJvdGF0ZS56ID0gMC41ICogTWF0aC5zcXJ0KE1hdGgubWF4KDEgLSByb3dbMF0ueCAtIHJvd1sxXS55ICsgcm93WzJdLnosIDApKTtcblx0cm90YXRlLncgPSAwLjUgKiBNYXRoLnNxcnQoTWF0aC5tYXgoMSArIHJvd1swXS54ICsgcm93WzFdLnkgKyByb3dbMl0ueiwgMCkpO1xuXG5cdC8vIGlmIChyb3dbMl0ueSA+IHJvd1sxXS56KSByb3RhdGVbMF0gPSAtcm90YXRlWzBdO1xuXHQvLyBpZiAocm93WzBdLnogPiByb3dbMl0ueCkgcm90YXRlWzFdID0gLXJvdGF0ZVsxXTtcblx0Ly8gaWYgKHJvd1sxXS54ID4gcm93WzBdLnkpIHJvdGF0ZVsyXSA9IC1yb3RhdGVbMl07XG5cblx0Ly8gRlJPTSBNT1JGLkpTXG5cdHJvdGF0ZS55ID0gTWF0aC5hc2luKC1yb3dbMF0ueik7XG5cdGlmIChNYXRoLmNvcyhyb3RhdGUueSkgIT09IDApIHtcblx0XHRyb3RhdGUueCA9IE1hdGguYXRhbjIocm93WzFdLnosIHJvd1syXS56KTtcblx0XHRyb3RhdGUueiA9IE1hdGguYXRhbjIocm93WzBdLnksIHJvd1swXS54KTtcblx0fSBlbHNlIHtcblx0XHRyb3RhdGUueCA9IE1hdGguYXRhbjIoLXJvd1syXS54LCByb3dbMV0ueSk7XG5cdFx0cm90YXRlLnogPSAwO1xuXHR9XG5cblx0Ly8gRlJPTSBodHRwOi8vYmxvZy5id2hpdGluZy5jby51ay8/cD0yNlxuXHQvLyBzY2FsZS54MiA9IE1hdGguc3FydChtYXRyaXgubTExKm1hdHJpeC5tMTEgKyBtYXRyaXgubTIxKm1hdHJpeC5tMjEgKyBtYXRyaXgubTMxKm1hdHJpeC5tMzEpO1xuXHQvLyBzY2FsZS55MiA9IE1hdGguc3FydChtYXRyaXgubTEyKm1hdHJpeC5tMTIgKyBtYXRyaXgubTIyKm1hdHJpeC5tMjIgKyBtYXRyaXgubTMyKm1hdHJpeC5tMzIpO1xuXHQvLyBzY2FsZS56MiA9IE1hdGguc3FydChtYXRyaXgubTEzKm1hdHJpeC5tMTMgKyBtYXRyaXgubTIzKm1hdHJpeC5tMjMgKyBtYXRyaXgubTMzKm1hdHJpeC5tMzMpO1xuXG5cdC8vIHJvdGF0ZS54MiA9IE1hdGguYXRhbjIobWF0cml4Lm0yMy9zY2FsZS56MiwgbWF0cml4Lm0zMy9zY2FsZS56Mik7XG5cdC8vIHJvdGF0ZS55MiA9IC1NYXRoLmFzaW4obWF0cml4Lm0xMy9zY2FsZS56Mik7XG5cdC8vIHJvdGF0ZS56MiA9IE1hdGguYXRhbjIobWF0cml4Lm0xMi9zY2FsZS55MiwgbWF0cml4Lm0xMS9zY2FsZS54Mik7XG5cblx0cmV0dXJuIHtcblx0XHRwZXJzcGVjdGl2ZSxcblx0XHR0cmFuc2xhdGUsXG5cdFx0c2tldyxcblx0XHRzY2FsZSxcblx0XHRyb3RhdGVcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGRlY29tcG9zZSxcblx0aXNBZmZpbmUsXG5cdGludmVyc2UsXG5cdG11bHRpcGx5XG59OyIsIi8qKlxuICogUGFyc2VzIGEgRE9NIHN0cmluZyBpbnRvIHZhbHVlcyB1c2FibGUgYnkgbWF0cml4XG4gKiBgc3RhdGljLmpzYCBmdW5jdGlvbnMgdG8gY29udHJ1Y3QgYSB0cnVlIE1hdHJpeC5cbiAqL1xuXG5jb25zdCB2YWx1ZVRvT2JqZWN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0Y29uc3QgdW5pdHMgPSAvKFtcXC1cXCtdP1swLTldK1tcXC4wLTldKikoZGVnfHJhZHxncmFkfHB4fCUpKi87XG5cdGNvbnN0IHBhcnRzID0gdmFsdWUubWF0Y2godW5pdHMpIHx8IFtdO1xuXG5cdHJldHVybiB7XG5cdFx0dmFsdWU6IHBhcnNlRmxvYXQocGFydHNbMV0pLFxuXHRcdHVuaXRzOiBwYXJ0c1syXSxcblx0XHR1bnBhcnNlZDogdmFsdWVcblx0fTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RhdGVtZW50VG9PYmplY3Qoc3RhdGVtZW50LCBza2lwVmFsdWVzKSB7XG5cdGNvbnN0IG5hbWVBbmRBcmdzID0gLyhcXHcrKVxcKChbXlxcKV0rKVxcKS9pO1xuXHRjb25zdCBzdGF0ZW1lbnRQYXJ0cyA9IHN0YXRlbWVudC50b1N0cmluZygpLm1hdGNoKG5hbWVBbmRBcmdzKS5zbGljZSgxKTtcblx0Y29uc3QgZnVuY3Rpb25OYW1lID0gc3RhdGVtZW50UGFydHNbMF07XG5cdGNvbnN0IHN0cmluZ1ZhbHVlcyA9IHN0YXRlbWVudFBhcnRzWzFdLnNwbGl0KC8sID8vKTtcblx0Y29uc3QgcGFyc2VkVmFsdWVzID0gIXNraXBWYWx1ZXMgJiYgc3RyaW5nVmFsdWVzLm1hcCh2YWx1ZVRvT2JqZWN0KTtcblxuXHRyZXR1cm4ge1xuXHRcdGtleTogZnVuY3Rpb25OYW1lLFxuXHRcdHZhbHVlOiBwYXJzZWRWYWx1ZXMgfHwgc3RyaW5nVmFsdWVzLFxuXHRcdHVucGFyc2VkOiBzdGF0ZW1lbnRcblx0fTtcbn07IiwiLyoqXG4gKiBHZXQgdGhlIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gKiBAcmV0dXJucyB7ZmxvYXR9XG4gKi9cbmZ1bmN0aW9uIGxlbmd0aCh2ZWN0b3IpIHtcblx0cmV0dXJuIE1hdGguc3FydCh2ZWN0b3IueCAqIHZlY3Rvci54ICsgdmVjdG9yLnkgKiB2ZWN0b3IueSArIHZlY3Rvci56ICogdmVjdG9yLnopO1xufVxuXG4vKipcbiAqIEdldCBhIG5vcm1hbGl6ZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxuICogQHJldHVybnMge1ZlY3RvcjR9XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZSh2ZWN0b3IpIHtcblx0Y29uc3QgbGVuID0gbGVuZ3RoKHZlY3Rvcik7XG5cdGNvbnN0IHYgPSBuZXcgdmVjdG9yLmNvbnN0cnVjdG9yKHZlY3Rvci54IC8gbGVuLCB2ZWN0b3IueSAvIGxlbiwgdmVjdG9yLnogLyBsZW4pO1xuXG5cdHJldHVybiB2O1xufVxuXG4vKipcbiAqIFZlY3RvciBEb3QtUHJvZHVjdFxuICogQHBhcmFtIHtWZWN0b3I0fSB2IFRoZSBzZWNvbmQgdmVjdG9yIHRvIGFwcGx5IHRoZSBwcm9kdWN0IHRvXG4gKiBAcmV0dXJucyB7ZmxvYXR9IFRoZSBEb3QtUHJvZHVjdCBvZiBhIGFuZCBiLlxuICovXG5mdW5jdGlvbiBkb3QoYSwgYikge1xuXHRyZXR1cm4gYS54ICogYi54ICsgYS55ICogYi55ICsgYS56ICogYi56ICsgYS53ICogYi53O1xufVxuXG4vKipcbiAqIFZlY3RvciBDcm9zcy1Qcm9kdWN0XG4gKiBAcGFyYW0ge1ZlY3RvcjR9IHYgVGhlIHNlY29uZCB2ZWN0b3IgdG8gYXBwbHkgdGhlIHByb2R1Y3QgdG9cbiAqIEByZXR1cm5zIHtWZWN0b3I0fSBUaGUgQ3Jvc3MtUHJvZHVjdCBvZiBhIGFuZCBiLlxuICovXG5mdW5jdGlvbiBjcm9zcyhhLCBiKSB7XG5cdHJldHVybiBuZXcgYS5jb25zdHJ1Y3Rvcihcblx0XHQoYS55ICogYi56KSAtIChhLnogKiBiLnkpLFxuXHRcdChhLnogKiBiLngpIC0gKGEueCAqIGIueiksXG5cdFx0KGEueCAqIGIueSkgLSAoYS55ICogYi54KVxuXHQpO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiByZXF1aXJlZCBmb3IgbWF0cml4IGRlY29tcG9zaXRpb25cbiAqIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiBwc2V1ZG8gY29kZSBhdmFpbGFibGUgZnJvbSBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLTJkLXRyYW5zZm9ybXMvI21hdHJpeC1kZWNvbXBvc2l0aW9uXG4gKiBAcGFyYW0ge1ZlY3RvcjR9IGFQb2ludCBBIDNEIHBvaW50XG4gKiBAcGFyYW0ge2Zsb2F0fSBhc2NsXG4gKiBAcGFyYW0ge2Zsb2F0fSBic2NsXG4gKiBAcmV0dXJucyB7VmVjdG9yNH1cbiAqL1xuZnVuY3Rpb24gY29tYmluZShhUG9pbnQsIGJQb2ludCwgYXNjbCwgYnNjbCkge1xuXHRyZXR1cm4gbmV3IGFQb2ludC5jb25zdHJ1Y3Rvcihcblx0XHQoYXNjbCAqIGFQb2ludC54KSArIChic2NsICogYlBvaW50LngpLFxuXHRcdChhc2NsICogYVBvaW50LnkpICsgKGJzY2wgKiBiUG9pbnQueSksXG5cdFx0KGFzY2wgKiBhUG9pbnQueikgKyAoYnNjbCAqIGJQb2ludC56KVxuXHQpO1xufVxuXG4vKipcbiAqIEBwYXJhbSAge1ZlY3RvcjR9IHZlY3RvclxuICogQHBhcmFtICB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge1ZlY3RvcjR9XG4gKi9cbmZ1bmN0aW9uIG11bHRpcGx5QnlNYXRyaXgodmVjdG9yLCBtYXRyaXgpIHtcblx0cmV0dXJuIG5ldyB2ZWN0b3IuY29uc3RydWN0b3IoXG5cdFx0KG1hdHJpeC5tMTEgKiB2ZWN0b3IueCkgKyAobWF0cml4Lm0xMiAqIHZlY3Rvci55KSArIChtYXRyaXgubTEzICogdmVjdG9yLnopLFxuXHRcdChtYXRyaXgubTIxICogdmVjdG9yLngpICsgKG1hdHJpeC5tMjIgKiB2ZWN0b3IueSkgKyAobWF0cml4Lm0yMyAqIHZlY3Rvci56KSxcblx0XHQobWF0cml4Lm0zMSAqIHZlY3Rvci54KSArIChtYXRyaXgubTMyICogdmVjdG9yLnkpICsgKG1hdHJpeC5tMzMgKiB2ZWN0b3Iueilcblx0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGxlbmd0aCxcblx0bm9ybWFsaXplLFxuXHRkb3QsXG5cdGNyb3NzLFxuXHRjb21iaW5lLFxuXHRtdWx0aXBseUJ5TWF0cml4XG59OyIsImxldCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuY29uc3Qgc2VsZWN0UHJvcCA9IGZ1bmN0aW9uKGFycikge1xuXHR2YXIgaWR4ID0gYXJyLmxlbmd0aDtcblx0d2hpbGUgKGlkeC0tKSB7XG5cdFx0aWYgKGRpdi5zdHlsZVthcnJbaWR4XV0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIGFycltpZHhdO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gJyc7XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgdGhlIHRyYW5zZm9ybWF0aW9uIHByb3BlcnR5IHRvIHVzZVxuICogZm9yIHRoZSBlbnZpcm9ubWVudCwgdGVzdGluZyB0aGUgXCJ0cmFuc2Zvcm1cIlxuICogcHJvcGVydHkgYmVmb3JlIHRlc3RpbmcgcHJvcHJpZXRhcnkgcHJvcGVydGllc1xuICogQHR5cGUge1N0cmluZ31cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBzZWxlY3RQcm9wKFtcblx0J3RyYW5zZm9ybScsXG5cdCdtc1RyYW5zZm9ybScsXG5cdCdvVHJhbnNmb3JtJyxcblx0J21velRyYW5zZm9ybScsXG5cdCd3ZWJraXRUcmFuc2Zvcm0nXG5dKTtcblxuLy8gY2xlYW51cCBkaXZcbmRpdiA9IHVuZGVmaW5lZDsiLCIvKipcbiAqIEVuY2Fwc3VsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiBhIHNwcmluZyxcbiAqIGNhbGN1bGF0aW5nIHN0YXRlIGJhc2VkIG9mZiBvZiB0ZW5zaW9uLCBmcmljdGlvblxuICogYW5kIHZlbG9jaXR5LiBJbXBsZW1lbnRlZCBieSBgYW5pbWF0aW9uLmpzYFxuICovXG5cbmNvbnN0IEVORF9WQUxVRSA9IDEwMDtcbmNvbnN0IFRPTEVSQU5DRSA9IDAuMDE7XG5jb25zdCBTUEVFRCA9IDEgLyA2MDtcblxuY29uc3QgY2FsY0FjY2VsZXJhdGlvbiA9IGZ1bmN0aW9uKHRlbnNpb24sIHgsIGZyaWN0aW9uLCB2ZWxvY2l0eSkge1xuXHRyZXR1cm4gLXRlbnNpb24gKiB4IC0gZnJpY3Rpb24gKiB2ZWxvY2l0eTtcbn07XG5cbmNvbnN0IGNhbGNTdGF0ZSA9IGZ1bmN0aW9uKHN0YXRlLCBzcGVlZCkge1xuXHRjb25zdCBkdCA9IHNwZWVkICogMC41O1xuXHRjb25zdCB4ID0gc3RhdGUueDtcblx0Y29uc3QgdmVsb2NpdHkgPSBzdGF0ZS52ZWxvY2l0eTtcblx0Y29uc3QgdGVuc2lvbiA9IHN0YXRlLnRlbnNpb247XG5cdGNvbnN0IGZyaWN0aW9uID0gc3RhdGUuZnJpY3Rpb247XG5cblx0Y29uc3QgYUR4ID0gdmVsb2NpdHk7XG5cdGNvbnN0IGFEdiA9IGNhbGNBY2NlbGVyYXRpb24odGVuc2lvbiwgeCwgZnJpY3Rpb24sIHZlbG9jaXR5KTtcblxuXHRjb25zdCBiRHggPSB2ZWxvY2l0eSArIGFEdiAqIGR0O1xuXHRjb25zdCBiRW5kWCA9IHggKyBhRHggKiBkdDtcblx0Y29uc3QgYkR2ID0gY2FsY0FjY2VsZXJhdGlvbih0ZW5zaW9uLCBiRW5kWCwgZnJpY3Rpb24sIGJEeCk7XG5cblx0Y29uc3QgY0R4ID0gdmVsb2NpdHkgKyBiRHYgKiBkdDtcblx0Y29uc3QgY0VuZFggPSB4ICsgYkR4ICogZHQ7XG5cdGNvbnN0IGNEdiA9IGNhbGNBY2NlbGVyYXRpb24odGVuc2lvbiwgY0VuZFgsIGZyaWN0aW9uLCBjRHgpO1xuXG5cdGNvbnN0IGREeCA9IHZlbG9jaXR5ICsgY0R2ICogZHQ7XG5cdGNvbnN0IGRFbmRYID0geCArIGNEeCAqIGR0O1xuXHRjb25zdCBkRHYgPSBjYWxjQWNjZWxlcmF0aW9uKHRlbnNpb24sIGRFbmRYLCBmcmljdGlvbiwgZER4KTtcblxuXHRjb25zdCBkeGR0ID0gKDEgLyA2KSAqIChhRHggKyAyICogKGJEeCArIGNEeCkgKyBkRHgpO1xuXHRjb25zdCBkdmR0ID0gKDEgLyA2KSAqIChhRHYgKyAyICogKGJEdiArIGNEdikgKyBkRHYpO1xuXG5cdHN0YXRlLnggPSB4ICsgZHhkdCAqIHNwZWVkO1xuXHRzdGF0ZS52ZWxvY2l0eSA9IGFEeCArIGR2ZHQgKiBzcGVlZDtcblxuXHRyZXR1cm4gc3RhdGU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNwcmluZygpIHtcblx0bGV0IHZlbG9jaXR5ID0gMDtcblx0bGV0IHRlbnNpb24gPSA4MDtcblx0bGV0IGZyaWN0aW9uID0gODtcblxuXHRsZXQgcmVwZWF0ID0gMDtcblx0bGV0IG9yaWdpbmFsVmVsb2NpdHkgPSAwO1xuXHRsZXQgb3JpZ2luYWxUZW5zaW9uID0gODA7XG5cdGxldCBvcmlnaW5hbEZyaWN0aW9uID0gODtcblx0bGV0IHZhbHVlID0gMDtcblx0bGV0IGlzUGF1c2VkID0gZmFsc2U7XG5cblx0Ly8gU3RvcmVzIHggYW5kIHZlbG9jaXR5IHRvIGRvXG5cdC8vIGNhbGN1bGF0aW9ucyBhZ2FpbnN0IHNvIHRoYXRcblx0Ly8gd2UgY2FuIGhhdmUgbXVsdGlwbGUgcmV0dXJuXG5cdC8vIHZhbHVlcyBmcm9tIGNhbGNTdGF0ZVxuXHRjb25zdCBzdGF0ZSA9IHt9O1xuXG5cdGxldCB1cGRhdGVDYWxsYmFjaztcblx0bGV0IGNvbXBsZXRlQ2FsbGJhY2s7XG5cdGxldCByZXZlcnNlQ2FsbGJhY2s7XG5cblx0cmV0dXJuIHtcblx0XHRyZWdpc3RlckNhbGxiYWNrcyhvYmopIHtcblx0XHRcdHVwZGF0ZUNhbGxiYWNrID0gb2JqLm9uVXBkYXRlO1xuXHRcdFx0Y29tcGxldGVDYWxsYmFjayA9IG9iai5vbkNvbXBsZXRlO1xuXHRcdFx0cmV2ZXJzZUNhbGxiYWNrID0gb2JqLm9uUmV2ZXJzZTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRyZXBlYXQodGltZXMpIHtcblx0XHRcdHJlcGVhdCA9IHRpbWVzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdHNldCh0LCBmLCB2KSB7XG5cdFx0XHRpZiAodiAhPT0gdW5kZWZpbmVkKSB7IHZlbG9jaXR5ID0gb3JpZ2luYWxWZWxvY2l0eSA9IHY7IH1cblx0XHRcdGlmICh0ICE9PSB1bmRlZmluZWQpIHsgdGVuc2lvbiA9IG9yaWdpbmFsVGVuc2lvbiA9IHQ7ICB9XG5cdFx0XHRpZiAoZiAhPT0gdW5kZWZpbmVkKSB7IGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbiA9IGY7IH1cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHR0ZW5zaW9uKHQpIHtcblx0XHRcdHRlbnNpb24gPSBvcmlnaW5hbFRlbnNpb24gPSB0O1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdGZyaWN0aW9uKGYpIHtcblx0XHRcdGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbiA9IGY7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXG5cdFx0dmVsb2NpdHkodikge1xuXHRcdFx0dmVsb2NpdHkgPSBvcmlnaW5hbFZlbG9jaXR5ID0gdjtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRwYXVzZSgpIHtcblx0XHRcdGlzUGF1c2VkID0gdHJ1ZTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRyZXN1bWUoKSB7XG5cdFx0XHRpc1BhdXNlZCA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdHN0ZXAoKSB7XG5cdFx0XHRpZiAoaXNQYXVzZWQpIHsgcmV0dXJuIHRydWU7IH0gLy8gc2hvdWxkIHNldCBhZ2Fpbj9cblxuXHRcdFx0Y29uc3Qgc3RhdGVCZWZvcmUgPSBzdGF0ZTtcblxuXHRcdFx0c3RhdGVCZWZvcmUueCA9IHZhbHVlIC0gRU5EX1ZBTFVFO1xuXHRcdFx0c3RhdGVCZWZvcmUudmVsb2NpdHkgPSB2ZWxvY2l0eTtcblx0XHRcdHN0YXRlQmVmb3JlLnRlbnNpb24gPSB0ZW5zaW9uO1xuXHRcdFx0c3RhdGVCZWZvcmUuZnJpY3Rpb24gPSBmcmljdGlvbjtcblxuXHRcdFx0Y29uc3Qgc3RhdGVBZnRlciA9IGNhbGNTdGF0ZShzdGF0ZUJlZm9yZSwgU1BFRUQpO1xuXHRcdFx0Y29uc3QgZmluYWxWZWxvY2l0eSA9IHN0YXRlQWZ0ZXIudmVsb2NpdHk7XG5cdFx0XHRjb25zdCBuZXRGbG9hdCA9IHN0YXRlQWZ0ZXIueDtcblx0XHRcdGNvbnN0IG5ldDFEVmVsb2NpdHkgPSBzdGF0ZUFmdGVyLnZlbG9jaXR5O1xuXHRcdFx0Y29uc3QgbmV0VmFsdWVJc0xvdyA9IE1hdGguYWJzKG5ldEZsb2F0KSA8IFRPTEVSQU5DRTtcblx0XHRcdGNvbnN0IG5ldFZlbG9jaXR5SXNMb3cgPSBNYXRoLmFicyhuZXQxRFZlbG9jaXR5KSA8IFRPTEVSQU5DRTtcblx0XHRcdGNvbnN0IHNwcmluZ1Nob3VsZFN0b3AgPSBuZXRWYWx1ZUlzTG93IHx8IG5ldFZlbG9jaXR5SXNMb3c7XG5cblx0XHRcdHZhbHVlID0gRU5EX1ZBTFVFICsgc3RhdGVBZnRlci54O1xuXG5cdFx0XHRpZiAoc3ByaW5nU2hvdWxkU3RvcCkge1xuXG5cdFx0XHRcdHZlbG9jaXR5ID0gMDtcblx0XHRcdFx0dmFsdWUgPSBFTkRfVkFMVUU7XG5cblx0XHRcdFx0dXBkYXRlQ2FsbGJhY2sodmFsdWUgLyAxMDApO1xuXG5cdFx0XHRcdC8vIFNob3VsZCB3ZSByZXBlYXQ/XG5cdFx0XHRcdGlmIChyZXBlYXQgPiAwKSB7XG5cblx0XHRcdFx0XHQvLyBEZWNyZW1lbnQgdGhlIHJlcGVhdCBjb3VudGVyIChpZiBmaW5pdGUsXG5cdFx0XHRcdFx0Ly8gd2UgbWF5IGJlIGluIGFuIGluZmluaXRlIGxvb3ApXG5cdFx0XHRcdFx0aWYgKGlzRmluaXRlKHJlcGVhdCkpIHsgcmVwZWF0LS07IH1cblxuXHRcdFx0XHRcdHJldmVyc2VDYWxsYmFjaygpO1xuXHRcdFx0XHRcdHZlbG9jaXR5ID0gb3JpZ2luYWxWZWxvY2l0eTtcblx0XHRcdFx0XHR0ZW5zaW9uICA9IG9yaWdpbmFsVGVuc2lvbjtcblx0XHRcdFx0XHRmcmljdGlvbiA9IG9yaWdpbmFsRnJpY3Rpb247XG5cdFx0XHRcdFx0dmFsdWUgPSAwO1xuXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7IC8vIHNob3VsZCBzZXQgYWdhaW4/XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBPdGhlcndpc2UsIHdlJ3JlIGRvbmUgcmVwZWF0aW5nXG5cdFx0XHRcdGNvbXBsZXRlQ2FsbGJhY2soKTtcblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7IC8vIHNob3VsZCBzZXQgYWdhaW4/XG5cdFx0XHR9XG5cblx0XHRcdHZlbG9jaXR5ID0gZmluYWxWZWxvY2l0eTtcblx0XHRcdHVwZGF0ZUNhbGxiYWNrKHZhbHVlIC8gMTAwKTtcblx0XHRcdHJldHVybiB0cnVlOyAvLyBzaG91bGQgc2V0IGFnYWluP1xuXHRcdH0sXG5cblx0XHRzdG9wKCkge1xuXHRcdFx0dmVsb2NpdHkgPSBvcmlnaW5hbFZlbG9jaXR5O1xuXHRcdFx0dGVuc2lvbiA9IG9yaWdpbmFsVGVuc2lvbjtcblx0XHRcdGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbjtcblx0XHRcdHZhbHVlID0gMDtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0fTtcbn07IiwiY29uc3QgTWF0cml4ID0gcmVxdWlyZSgnLi9tYXRyaXgnKTtcbmNvbnN0IHRyYW5zZm9ybVByb3AgPSByZXF1aXJlKCcuL3Byb3AnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIGVsZW1lbnQpIHtcblx0Y29uc3QgbWF0cml4ID0gKG5ldyBNYXRyaXgoKSkuY29tcG9zZShvYmopO1xuXHRlbGVtZW50LnN0eWxlW3RyYW5zZm9ybVByb3BdID0gbWF0cml4LnRvU3RyaW5nKCk7XG59OyIsIi8qKlxuICogSGVscHMgXCJiYXNlXCIgYSBtYXRyaXggUE9KTyBvZmYgb2YgZWl0aGVyIGFuIGVsZW1lbnRcbiAqIG9yIGFub3RoZXIgUE9KTy4gQWN0cyBhcyBhIG5vcm1hbGl6ZXIgYmV0d2VlbiB0aGUgdHdvXG4gKiB3YXlzIHRvIHBhc3MgYXJndW1lbnRzIHRvIGZsdXgtc3ByaW5nOlxuICogLSBzcHJpbmcoZWxlbWVudClcbiAqIC0gc3ByaW5nKHsuLi59KVxuICovXG5cbmNvbnN0IE1hdHJpeCA9IHJlcXVpcmUoJy4uL21hdHJpeCcpO1xuY29uc3QgdHJhbnNmb3JtUHJvcCA9IHJlcXVpcmUoJy4uL3Byb3AnKTtcblxuY29uc3QgZ2V0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0pIHtcblx0cmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG59O1xuXG5jb25zdCBkZWNvbXBvc2UgPSBmdW5jdGlvbihtYXRyaXgpIHtcblx0Y29uc3QgY29tcG9zaXRpb24gPSBtYXRyaXguZGVjb21wb3NlKCk7XG5cdGNvbnN0IHsgcm90YXRlLCBzY2FsZSwgc2tldywgdHJhbnNsYXRlIH0gPSBjb21wb3NpdGlvbjtcblxuXHRyZXR1cm4ge1xuXHRcdHg6IHRyYW5zbGF0ZS54LFxuXHRcdHk6IHRyYW5zbGF0ZS55LFxuXHRcdHo6IHRyYW5zbGF0ZS56LFxuXG5cdFx0c2NhbGVYOiBzY2FsZS54LFxuXHRcdHNjYWxlWTogc2NhbGUueSxcblx0XHRzY2FsZVo6IHNjYWxlLnosXG5cblx0XHRza2V3WDogc2tldy54LFxuXHRcdHNrZXdZOiBza2V3LnksXG5cblx0XHRyb3RhdGVYOiByb3RhdGUueCxcblx0XHRyb3RhdGVZOiByb3RhdGUueSxcblx0XHRyb3RhdGVaOiByb3RhdGUuelxuXHR9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHN0eWxlKGVsZW0pIHtcblx0XHRjb25zdCBjb21wdXRlZFN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG5cdFx0Y29uc3QgdHJhbnNmb3JtID0gY29tcHV0ZWRTdHlsZXNbdHJhbnNmb3JtUHJvcF07XG5cdFx0aWYgKCF0cmFuc2Zvcm0gfHwgdHJhbnNmb3JtID09PSAnbm9uZScpIHsgcmV0dXJuIGRlY29tcG9zZShuZXcgTWF0cml4KCkpOyB9XG5cblx0XHRjb25zdCBtYXRyaXggPSBuZXcgTWF0cml4KHRyYW5zZm9ybSk7XG5cdFx0cmV0dXJuIGRlY29tcG9zZShtYXRyaXgpO1xuXHR9LFxuXG5cdG9iaihvYmopIHtcblx0XHRjb25zdCBtYXRyaXggPSBuZXcgTWF0cml4KCk7XG5cdFx0Y29uc3QgY29tcG9zaXRpb24gPSBtYXRyaXguY29tcG9zZShvYmopO1xuXHRcdHJldHVybiBkZWNvbXBvc2UoY29tcG9zaXRpb24pO1xuXHR9XG59OyIsIi8qKlxuICogRXhwYW5kcyB0aGUgc2hvcnRoYW5kIG9mIGFuIG9iamVjdCB0byB1c2FibGVcbiAqIG1hdHJpeCBwcm9wZXJ0aWVzLiBCaWdnZXN0IG9uZXMgYXJlIHRoZSBjb21tb25cbiAqIFwic2NhbGVcIiBhbmQgXCJyb3RhdGVcIiBwcm9wcy5cbiAqL1xuXG4vKlxuXHR2YXIgTUFUUklYID0ge1xuXHRcdHg6IDAsXG5cdFx0eTogMCxcblx0XHR6OiAwLFxuXHRcdHNjYWxlWDogMSxcblx0XHRzY2FsZVk6IDEsXG5cdFx0c2NhbGVaOiAxLFxuXHRcdHJvdGF0aW9uWDogMCxcblx0XHRyb3RhdGlvblk6IDAsXG5cdFx0cm90YXRpb25aOiAwXG5cdH07XG4qL1xuXG5jb25zdCBleHBhbmQgPSBmdW5jdGlvbihvYmopIHtcblx0aWYgKG9iai5zY2FsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0b2JqLnNjYWxlWCA9IG9iai5zY2FsZTtcblx0XHRvYmouc2NhbGVZID0gb2JqLnNjYWxlO1xuXHRcdGRlbGV0ZSBvYmouc2NhbGU7XG5cdH1cblxuXHRpZiAob2JqLnJvdGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0b2JqLnJvdGF0ZVogPSBvYmoucm90YXRlO1xuXHRcdGRlbGV0ZSBvYmoucm90YXRlO1xuXHR9XG5cblx0aWYgKG9iai5yb3RhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0b2JqLnJvdGF0ZVogPSBvYmoucm90YXRpb247XG5cdFx0ZGVsZXRlIG9iai5yb3RhdGlvbjtcblx0fVxuXG5cdHJldHVybiBvYmo7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9iaiA9PiAhb2JqID8gb2JqIDogZXhwYW5kKG9iaik7XG4iLCIvKipcbiAqIEhhbmRsZXMgb2JqZWN0IHRyYW5zZm9ybWF0aW9ucyBzbyB0aGF0IHRoZXNlIG9wZXJhdGlvbnNcbiAqIGNhbiBiZSBvZmZsb2FkZWQgZnJvbSBgYW5pbWF0aW9uLmpzYC4gRXNwZWNpYWxseSB1c2VmdWxcbiAqIGZvciB0cmFja2luZyB0aGUgdG8gYW5kIGZyb20gb2YgYW4gb2JqZWN0IGZvciB5b3lvaW5nXG4gKiBhbmQgcmV2ZXJzaW5nLlxuICpcbiAqIFRha2VzIGEgcGVyY2VudCBvbiB1cGRhdGUgYW5kIHVwZGF0ZXMgYWxsIHByb3BlcnRpZXMuXG4gKiBUaGlzIHBlcmNlbnRhZ2UgaXMgdGhlIHBlcmNlbnRhZ2Ugb2YgdGhlIHdheSB0aHJvdWdoXG4gKiB0aGUgY3VycmVudCBhbmltYXRpb24gYW5kIGlzIGdlbmVyYXRlZCBieSBgc3ByaW5nLmpzYFxuICovXG5cbmNvbnN0IGlzRWxlbWVudCA9IHJlcXVpcmUoJy4vaXNFbGVtZW50Jyk7XG5jb25zdCBiYXNlciA9IHJlcXVpcmUoJy4vYmFzZXInKTtcbmNvbnN0IGV4cGFuZFNob3J0aGFuZCA9IHJlcXVpcmUoJy4vZXhwYW5kU2hvcnRoYW5kJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdHJhbnNmb3JtZXIoaW5pdGlhbCkge1xuXHRsZXQgaW5pdCA9IGluaXRpYWw7XG5cblx0bGV0IGJhc2U7XG5cdGxldCB5b3lvO1xuXHRsZXQgZnJvbTtcblx0bGV0IHRvO1xuXHRsZXQgcmVwZWF0O1xuXG5cdHJldHVybiB7XG5cdFx0dmFsdWUoKSB7XG5cdFx0XHRyZXR1cm4gYmFzZTtcblx0XHR9LFxuXG5cdFx0eW95byhib29sKSB7XG5cdFx0XHR5b3lvID0gYm9vbDtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRmcm9tKGYpIHtcblx0XHRcdGluaXQgPSBmO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdHRvKHQpIHtcblx0XHRcdHRvID0gZXhwYW5kU2hvcnRoYW5kKHQpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdHVwZGF0ZShwZXJjKSB7XG5cdFx0XHRmb3IgKGxldCBwcm9wZXJ0eSBpbiB0bykge1xuXHRcdFx0XHRsZXQgc3RhcnQgPSBmcm9tW3Byb3BlcnR5XSB8fCAwO1xuXHRcdFx0XHRsZXQgZW5kID0gdG9bcHJvcGVydHldO1xuXG5cdFx0XHRcdGJhc2VbcHJvcGVydHldID0gc3RhcnQgKyAoZW5kIC0gc3RhcnQpICogcGVyYztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdHJldmVyc2UoKSB7XG5cdFx0XHR2YXIgdG1wO1xuXG5cdFx0XHQvLyByZWFzc2lnbiBzdGFydGluZyB2YWx1ZXNcblx0XHRcdGZvciAobGV0IHByb3BlcnR5IGluIHJlcGVhdCkge1xuXHRcdFx0XHRpZiAoeW95bykge1xuXHRcdFx0XHRcdHRtcCA9IHJlcGVhdFtwcm9wZXJ0eV07XG5cdFx0XHRcdFx0cmVwZWF0W3Byb3BlcnR5XSA9IHRvW3Byb3BlcnR5XTtcblx0XHRcdFx0XHR0b1twcm9wZXJ0eV0gPSB0bXA7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmcm9tW3Byb3BlcnR5XSA9IHJlcGVhdFtwcm9wZXJ0eV07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRzdGFydCgpIHtcblx0XHRcdGlmICghdG8pIHsgcmV0dXJuIHRoaXM7IH1cblx0XHRcdGlmICghYmFzZSkgeyBiYXNlID0gaXNFbGVtZW50KGluaXQpID8gYmFzZXIuc3R5bGUoaW5pdCkgOiBiYXNlci5vYmooZXhwYW5kU2hvcnRoYW5kKGluaXQpKTsgfVxuXHRcdFx0aWYgKCFmcm9tKSB7IGZyb20gPSB7fTsgfVxuXHRcdFx0aWYgKCFyZXBlYXQpIHsgcmVwZWF0ID0ge307IH1cblxuXHRcdFx0Zm9yIChsZXQgcHJvcGVydHkgaW4gdG8pIHtcblx0XHRcdFx0Ly8gb21pdCB1bmNoYW5nZWQgcHJvcGVydGllc1xuXHRcdFx0XHRpZiAoYmFzZVtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCB8fCB0b1twcm9wZXJ0eV0gPT09IGJhc2VbcHJvcGVydHldKSB7XG5cdFx0XHRcdFx0ZGVsZXRlIHRvW3Byb3BlcnR5XTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZyb21bcHJvcGVydHldID0gYmFzZVtwcm9wZXJ0eV07XG5cdFx0XHRcdHJlcGVhdFtwcm9wZXJ0eV0gPSBmcm9tW3Byb3BlcnR5XSB8fCAwO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cdH07XG59OyIsIm1vZHVsZS5leHBvcnRzID0gb2JqID0+ICEhKG9iaiAmJiArb2JqLm5vZGVUeXBlID09PSBvYmoubm9kZVR5cGUpO1xuIl19
