(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.flux = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

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

module.exports = selectProp(['transform', 'msTransform', 'oTransform', 'mozTransform', 'webkitTransform']);

div = undefined;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYW5pbWF0aW9uLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL2xvb3AuanMiLCJzcmMvbWF0cml4L1ZlY3RvcjQuanMiLCJzcmMvbWF0cml4L2RlZzJyYWQuanMiLCJzcmMvbWF0cml4L2luZGV4LmpzIiwic3JjL21hdHJpeC9zdGF0aWMuanMiLCJzcmMvbWF0cml4L3RyYW5zcC5qcyIsInNyYy9tYXRyaXgvdmVjdG9yLmpzIiwic3JjL3Byb3AuanMiLCJzcmMvc3ByaW5nLmpzIiwic3JjL3RyYW5zZm9ybS5qcyIsInNyYy90cmFuc2Zvcm1lci9iYXNlci5qcyIsInNyYy90cmFuc2Zvcm1lci9leHBhbmRTaG9ydGhhbmQuanMiLCJzcmMvdHJhbnNmb3JtZXIvaW5kZXguanMiLCJzcmMvdHJhbnNmb3JtZXIvaXNFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLE9BQU8sUUFBYixBQUFhLEFBQVE7QUFDckIsSUFBTSxjQUFjLFFBQXBCLEFBQW9CLEFBQVE7QUFDNUIsSUFBTSxNQUFNLFFBQVosQUFBWSxBQUFROztBQUVwQixPQUFBLEFBQU8sVUFBVSxTQUFBLEFBQVMsVUFBVCxBQUFtQixLQUFLLEFBQ3hDO0tBQU0sTUFBTixBQUFZLEFBQ1o7S0FBTSxTQUFTLFlBQWYsQUFBZSxBQUFZLEFBQzNCO0tBQU0sU0FBTixBQUFlLEFBQ2Y7S0FBTSxTQUFOLEFBQWUsQUFFZjs7S0FBSSxVQUFKLEFBQWMsQUFDZDtLQUFJLFlBQUosQUFBZ0IsQUFDaEI7S0FBSSxZQUFKLEFBQWdCLEFBRWhCOztLQUFNLFNBQVEsU0FBUixBQUFRLFNBQVcsQUFDeEI7U0FBQSxBQUFPO0FBQWtCLCtCQUFBLEFBQ2YsTUFBTSxBQUNkO1dBQUEsQUFBTyxPQUFQLEFBQWMsQUFDZDtRQUFBLEFBQUksUUFBSixBQUFZLFVBQVUsT0FBdEIsQUFBc0IsQUFBTyxTQUE3QixB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QUUsTUFBTSxFQUF4QixBQUEwQixNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhDLEFBQTBDLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBaEUsQUFBa0UsQUFDbEU7R0FBQSxBQUFFLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxBQUEwQyxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQWhFLEFBQWtFLEFBQ2xFO0dBQUEsQUFBRSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQVIsQUFBVSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhCLEFBQTBCLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEMsQUFBMEMsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFoRSxBQUFrRSxBQUVsRTs7R0FBQSxBQUFFLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxBQUEwQyxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQWhFLEFBQWtFLEFBQ2xFO0dBQUEsQUFBRSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQVIsQUFBVSxNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhCLEFBQTBCLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEMsQUFBMEMsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFoRSxBQUFrRSxBQUNsRTtHQUFBLEFBQUUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUFSLEFBQVUsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QixBQUEwQixNQUFNLEVBQUEsQUFBRSxNQUFNLEVBQXhDLEFBQTBDLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBaEUsQUFBa0UsQUFDbEU7R0FBQSxBQUFFLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBUixBQUFVLE1BQU0sRUFBQSxBQUFFLE1BQU0sRUFBeEIsQUFBMEIsTUFBTSxFQUFBLEFBQUUsTUFBTSxFQUF4QyxB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LGVBQUE7U0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLElBQUQsQUFBSyxhQUFhLElBQW5DLEFBQVEsQUFBK0I7QUFBeEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgbG9vcCA9IHJlcXVpcmUoJy4vbG9vcCcpO1xuY29uc3QgdHJhbnNmb3JtZXIgPSByZXF1aXJlKCcuL3RyYW5zZm9ybWVyJyk7XG5jb25zdCBzcHIgPSByZXF1aXJlKCcuL3NwcmluZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGFuaW1hdGlvbihvYmopIHtcblx0Y29uc3QgYXBpID0ge307XG5cdGNvbnN0IG1hdHJpeCA9IHRyYW5zZm9ybWVyKG9iaik7XG5cdGNvbnN0IGV2ZW50cyA9IHt9O1xuXHRjb25zdCBzcHJpbmcgPSBzcHIoKTtcblxuXHRsZXQgcGxheWluZyA9IGZhbHNlO1xuXHRsZXQgc3RhcnRUaW1lID0gMDtcblx0bGV0IGRlbGF5VGltZSA9IDA7XG5cblx0Y29uc3Qgc3RhcnQgPSBmdW5jdGlvbigpIHtcblx0XHRzcHJpbmcucmVnaXN0ZXJDYWxsYmFja3Moe1xuXHRcdFx0b25VcGRhdGUocGVyYykge1xuXHRcdFx0XHRtYXRyaXgudXBkYXRlKHBlcmMpO1xuXHRcdFx0XHRhcGkudHJpZ2dlcigndXBkYXRlJywgbWF0cml4LnZhbHVlKCksIG9iaik7XG5cdFx0XHR9LFxuXHRcdFx0b25SZXZlcnNlKCkge1xuXHRcdFx0XHRtYXRyaXgucmV2ZXJzZSgpO1xuXHRcdFx0fSxcblx0XHRcdG9uQ29tcGxldGUoKSB7XG5cdFx0XHRcdGFwaS5zdG9wKCkudHJpZ2dlcignY29tcGxldGUnKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdG1hdHJpeC5zdGFydCgpO1xuXHRcdGxvb3AuYWRkKHNwcmluZyk7XG5cdH07XG5cblx0cmV0dXJuIE9iamVjdC5hc3NpZ24oYXBpLCB7XG5cdFx0ZnJvbShmcm9tKSB7XG5cdFx0XHRtYXRyaXguZnJvbShmcm9tKTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdHRvKHRvKSB7XG5cdFx0XHRtYXRyaXgudG8odG8pO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0c2V0KHRlbnNpb24sIGZyaWN0aW9uLCB2ZWxvY2l0eSkge1xuXHRcdFx0Ly8gSXQncyBhbiBvYmplY3Rcblx0XHRcdGlmICgrdGVuc2lvbiAhPT0gdGVuc2lvbikge1xuXHRcdFx0XHR2YXIgdGVtcCA9IHRlbnNpb247XG5cdFx0XHRcdHZlbG9jaXR5ID0gdGVtcC52ZWxvY2l0eTtcblx0XHRcdFx0ZnJpY3Rpb24gPSB0ZW1wLmZyaWN0aW9uO1xuXHRcdFx0XHR0ZW5zaW9uID0gdGVtcC50ZW5zaW9uO1xuXHRcdFx0fVxuXG5cdFx0XHRzcHJpbmcuc2V0KHRlbnNpb24sIGZyaWN0aW9uLCB2ZWxvY2l0eSk7XG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH0sXG5cblx0XHR0ZW5zaW9uKHRlbnNpb24pIHtcblx0XHRcdHNwcmluZy50ZW5zaW9uKCt0ZW5zaW9uKTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdGZyaWN0aW9uKGZyaWN0aW9uKSB7XG5cdFx0XHRzcHJpbmcuZnJpY3Rpb24oK2ZyaWN0aW9uKTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdHZlbG9jaXR5KHZlbG9jaXR5KSB7XG5cdFx0XHRzcHJpbmcudmVsb2NpdHkoK3ZlbG9jaXR5KTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdG9uKG5hbWUsIGZuKSB7XG5cdFx0XHRjb25zdCBhcnIgPSBldmVudHNbbmFtZV0gfHwgKGV2ZW50c1tuYW1lXSA9IFtdKTtcblx0XHRcdGFyci5wdXNoKGZuKTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdG9mZihuYW1lLCBmbikge1xuXHRcdFx0Y29uc3QgYXJyID0gZXZlbnRzW25hbWVdO1xuXHRcdFx0aWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHsgcmV0dXJuIGFwaTsgfVxuXG5cdFx0XHRsZXQgaWR4ID0gYXJyLmluZGV4T2YoZm4pO1xuXHRcdFx0aWYgKGlkeCAhPT0gLTEpIHtcblx0XHRcdFx0YXJyLnNwbGljZShpZHgsIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH0sXG5cblx0XHR0cmlnZ2VyKG5hbWUsIGEsIGIpIHtcblx0XHRcdGNvbnN0IGFyciA9IGV2ZW50c1tuYW1lXTtcblx0XHRcdGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSB7IHJldHVybiBhcGk7IH1cblxuXHRcdFx0Zm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgYXJyLmxlbmd0aDsgaWR4KyspIHtcblx0XHRcdFx0YXJyW2lkeF0oYSwgYik7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdGRlbGF5KGFtb3VudCkge1xuXHRcdFx0ZGVsYXlUaW1lID0gYW1vdW50O1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0cmVwZWF0KHJlcGVhdCkge1xuXHRcdFx0c3ByaW5nLnJlcGVhdChyZXBlYXQpO1xuXHRcdFx0cmV0dXJuIGFwaTtcblx0XHR9LFxuXG5cdFx0eW95byh5b3lvKSB7XG5cdFx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHsgeW95byA9IHRydWU7IH1cblx0XHRcdG1hdHJpeC55b3lvKCEheW95byk7XG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH0sXG5cblx0XHRzdGFydCh0aW1lKSB7XG5cdFx0XHRzdGFydFRpbWUgPSB0aW1lIHx8IGxvb3Aubm93O1xuXHRcdFx0bG9vcC5hd2FpdCh0aW1lID0+IHtcblx0XHRcdFx0aWYgKHRpbWUgPCAoc3RhcnRUaW1lICsgZGVsYXlUaW1lKSkge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlOyAvLyBzaG91bGQgY29udGludWUgdG8gd2FpdFxuXHRcdFx0XHR9XG5cdFx0XHRcdHBsYXlpbmcgPSB0cnVlO1xuXHRcdFx0XHRhcGkudHJpZ2dlcignc3RhcnQnKTtcblx0XHRcdFx0c3RhcnQodGltZSk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTsgLy8gc2hvdWxkIGNvbnRpbnVlIHRvIHdhaXRcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH0sXG5cblx0XHRwYXVzZSh0aW1lKSB7XG5cdFx0XHR0aW1lID0gdGltZSB8fCBsb29wLm5vdztcblx0XHRcdHNwcmluZy5wYXVzZSh0aW1lKTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fSxcblxuXHRcdHJlc3VtZSh0aW1lKSB7XG5cdFx0XHR0aW1lID0gdGltZSB8fCBsb29wLm5vdztcblx0XHRcdHNwcmluZy5yZXN1bWUodGltZSk7XG5cdFx0XHRyZXR1cm4gYXBpO1xuXHRcdH0sXG5cblx0XHRzdG9wKCkge1xuXHRcdFx0aWYgKCFwbGF5aW5nKSB7IHJldHVybiBhcGk7IH1cblx0XHRcdHBsYXlpbmcgPSBmYWxzZTtcblx0XHRcdGxvb3AucmVtb3ZlKHNwcmluZyk7XG5cdFx0XHRzcHJpbmcuc3RvcCgpO1xuXHRcdFx0YXBpLnRyaWdnZXIoJ3N0b3AnKTtcblx0XHRcdHJldHVybiBhcGk7XG5cdFx0fVxuXHR9KTtcbn07IiwiY29uc3QgbG9vcCA9IHJlcXVpcmUoJy4vbG9vcCcpO1xuY29uc3QgcHJvcCA9IHJlcXVpcmUoJy4vcHJvcCcpO1xuY29uc3QgYW5pbWF0aW9uID0gcmVxdWlyZSgnLi9hbmltYXRpb24nKTtcbmNvbnN0IHRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vdHJhbnNmb3JtJyk7XG5jb25zdCBwbHVnaW5zID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmFzc2lnbihmdW5jdGlvbihvYmopIHtcblx0cmV0dXJuIE9iamVjdC5hc3NpZ24oYW5pbWF0aW9uKG9iaiksIHBsdWdpbnMpO1xufSwge1xuXHRwcm9wLFxuXHR0cmFuc2Zvcm0sXG5cdHRpY2s6IGxvb3AudXBkYXRlLFxuXHR1cGRhdGU6IGxvb3AudXBkYXRlLFxuXHRwbHVnaW4obmFtZSwgZm4pIHtcblx0XHRwbHVnaW5zW25hbWVdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxufSk7IiwiY29uc3Qgd2FpdGluZyAgICA9IFtdO1xuY29uc3QgYW5pbWF0aW9ucyA9IFtdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0bm93OiBEYXRlLm5vdygpLFxuXG5cdGF3YWl0KGZuKSB7XG5cdFx0d2FpdGluZy5wdXNoKGZuKTtcblx0fSxcblxuXHRhZGQoZm4pIHtcblx0XHRhbmltYXRpb25zLnB1c2goZm4pO1xuXHR9LFxuXG5cdHJlbW92ZShmbikge1xuXHRcdGxldCBpZHggPSBhbmltYXRpb25zLmluZGV4T2YoZm4pO1xuXHRcdGlmIChpZHggIT09IC0xKSB7XG5cdFx0XHRhbmltYXRpb25zLnNwbGljZShpZHgsIDEpO1xuXHRcdH1cblx0fSxcblxuXHR1cGRhdGUoKSB7XG5cdFx0Y29uc3QgdGltZSA9IHRoaXMubm93ID0gRGF0ZS5ub3coKTtcblxuXHRcdGlmICh3YWl0aW5nLmxlbmd0aCA9PT0gMCAmJiBhbmltYXRpb25zLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxldCBpZHggPSAwO1xuXHRcdHdoaWxlIChpZHggPCB3YWl0aW5nLmxlbmd0aCkge1xuXHRcdFx0aWYgKHdhaXRpbmdbaWR4XSh0aW1lKSkge1xuXHRcdFx0XHRpZHgrKztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdhaXRpbmcuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWR4ID0gMDtcblx0XHR3aGlsZSAoaWR4IDwgYW5pbWF0aW9ucy5sZW5ndGgpIHtcblx0XHRcdGFuaW1hdGlvbnNbaWR4XS5zdGVwKHRpbWUpO1xuXHRcdFx0aWR4Kys7XG5cdFx0fVxuXHR9XG59OyIsImNvbnN0IHZlY3RvciA9IHJlcXVpcmUoJy4vdmVjdG9yJyk7XG5cbi8qKlxuICogQSA0IGRpbWVuc2lvbmFsIHZlY3RvclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmNvbnN0IFZlY3RvcjQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFZlY3RvcjQoeCwgeSwgeiwgdykge1xuXHR0aGlzLnggPSB4O1xuXHR0aGlzLnkgPSB5O1xuXHR0aGlzLnogPSB6O1xuXHR0aGlzLncgPSB3O1xuXHR0aGlzLmNoZWNrVmFsdWVzKCk7XG59O1xuXG5WZWN0b3I0LnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3I6IFZlY3RvcjQsXG5cblx0LyoqXG5cdCAqIEVuc3VyZSB0aGF0IHZhbHVlcyBhcmUgbm90IHVuZGVmaW5lZFxuXHQgKiBAcmV0dXJucyBudWxsXG5cdCAqL1xuXHRjaGVja1ZhbHVlcygpIHtcblx0XHR0aGlzLnggPSB0aGlzLnggfHwgMDtcblx0XHR0aGlzLnkgPSB0aGlzLnkgfHwgMDtcblx0XHR0aGlzLnogPSB0aGlzLnogfHwgMDtcblx0XHR0aGlzLncgPSB0aGlzLncgfHwgMDtcblx0fSxcblxuXHQvKipcblx0ICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHZlY3RvclxuXHQgKiBAcmV0dXJucyB7ZmxvYXR9XG5cdCAqL1xuXHRsZW5ndGgoKSB7XG5cdFx0dGhpcy5jaGVja1ZhbHVlcygpO1xuXHRcdHJldHVybiB2ZWN0b3IubGVuZ3RoKHRoaXMpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBHZXQgYSBub3JtYWxpc2VkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3Jcblx0ICogQHJldHVybnMge1ZlY3RvcjR9XG5cdCAqL1xuXHRub3JtYWxpemUoKSB7XG5cdFx0cmV0dXJuIHZlY3Rvci5ub3JtYWxpemUodGhpcyk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFZlY3RvciBEb3QtUHJvZHVjdFxuXHQgKiBAcGFyYW0ge1ZlY3RvcjR9IHYgVGhlIHNlY29uZCB2ZWN0b3IgdG8gYXBwbHkgdGhlIHByb2R1Y3QgdG9cblx0ICogQHJldHVybnMge2Zsb2F0fSBUaGUgRG90LVByb2R1Y3Qgb2YgdGhpcyBhbmQgdi5cblx0ICovXG5cdGRvdCh2KSB7XG5cdFx0cmV0dXJuIHZlY3Rvci5kb3QodGhpcywgdik7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFZlY3RvciBDcm9zcy1Qcm9kdWN0XG5cdCAqIEBwYXJhbSB7VmVjdG9yNH0gdiBUaGUgc2Vjb25kIHZlY3RvciB0byBhcHBseSB0aGUgcHJvZHVjdCB0b1xuXHQgKiBAcmV0dXJucyB7VmVjdG9yNH0gVGhlIENyb3NzLVByb2R1Y3Qgb2YgdGhpcyBhbmQgdi5cblx0ICovXG5cdGNyb3NzKHYpIHtcblx0XHRyZXR1cm4gdmVjdG9yLmNyb3NzKHRoaXMsIHYpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIZWxwZXIgZnVuY3Rpb24gcmVxdWlyZWQgZm9yIG1hdHJpeCBkZWNvbXBvc2l0aW9uXG5cdCAqIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiBwc2V1ZG8gY29kZSBhdmFpbGFibGUgZnJvbSBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLTJkLXRyYW5zZm9ybXMvI21hdHJpeC1kZWNvbXBvc2l0aW9uXG5cdCAqIEBwYXJhbSB7VmVjdG9yNH0gYVBvaW50IEEgM0QgcG9pbnRcblx0ICogQHBhcmFtIHtmbG9hdH0gYXNjbFxuXHQgKiBAcGFyYW0ge2Zsb2F0fSBic2NsXG5cdCAqIEByZXR1cm5zIHtWZWN0b3I0fVxuXHQgKi9cblx0Y29tYmluZShiUG9pbnQsIGFzY2wsIGJzY2wpIHtcblx0XHRyZXR1cm4gdmVjdG9yLmNvbWJpbmUodGhpcywgYlBvaW50LCBhc2NsLCBic2NsKTtcblx0fSxcblxuXHRtdWx0aXBseUJ5TWF0cml4IChtYXRyaXgpIHtcblx0XHRyZXR1cm4gdmVjdG9yLm11bHRpcGx5QnlNYXRyaXgodGhpcywgbWF0cml4KTtcblx0fVxufTsiLCIvKipcbiAqICBDb252ZXJ0cyBhbmdsZXMgaW4gZGVncmVlcywgd2hpY2ggYXJlIHVzZWQgYnkgdGhlIGV4dGVybmFsIEFQSSwgdG8gYW5nbGVzXG4gKiAgaW4gcmFkaWFucyB1c2VkIGluIGludGVybmFsIGNhbGN1bGF0aW9ucy5cbiAqICBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBBbiBhbmdsZSBpbiBkZWdyZWVzLlxuICogIEByZXR1cm5zIHtudW1iZXJ9IHJhZGlhbnNcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBhbmdsZSA9PiBhbmdsZSAqIE1hdGguUEkgLyAxODA7XG4iLCJjb25zdCBkZWcycmFkID0gcmVxdWlyZSgnLi9kZWcycmFkJyk7XG5jb25zdCBtYXRyaXggPSByZXF1aXJlKCcuL3N0YXRpYycpO1xuY29uc3QgdHJhbnNwID0gcmVxdWlyZSgnLi90cmFuc3AnKTtcblxuLy8gQVNDSUkgY2hhciA5NyA9PSAnYSdcbmNvbnN0IGluZGV4VG9LZXkyZCA9IGluZGV4ID0+IFN0cmluZy5mcm9tQ2hhckNvZGUoaW5kZXggKyA5Nyk7XG5cbmNvbnN0IGluZGV4VG9LZXkzZCA9IGluZGV4ID0+ICgnbScgKyAoTWF0aC5mbG9vcihpbmRleCAvIDQpICsgMSkpICsgKGluZGV4ICUgNCArIDEpO1xuXG5jb25zdCBwb2ludHMyZCA9IFtcblx0J20xMScsIC8vIGFcblx0J20xMicsIC8vIGJcblx0J20yMScsIC8vIGNcblx0J20yMicsIC8vIGRcblx0J200MScsIC8vIGVcblx0J200MicgIC8vIGZcbl07XG5cbmNvbnN0IHBvaW50czNkID0gW1xuXHQnbTExJywgJ20xMicsICdtMTMnLCAnbTE0Jyxcblx0J20yMScsICdtMjInLCAnbTIzJywgJ20yNCcsXG5cdCdtMzEnLCAnbTMyJywgJ20zMycsICdtMzQnLFxuXHQnbTQxJywgJ200MicsICdtNDMnLCAnbTQ0J1xuXTtcblxuY29uc3QgbG9va3VwVG9GaXhlZCA9IGZ1bmN0aW9uKHApIHtcblx0cmV0dXJuIHRoaXNbcF0udG9GaXhlZCg2KTtcbn07XG5cbi8qKlxuICogIEdpdmVuIGEgQ1NTIHRyYW5zZm9ybSBzdHJpbmcgKGxpa2UgYHJvdGF0ZSgzcmFkKWAsIG9yXG4gKiAgICBgbWF0cml4KDEsIDAsIDAsIDAsIDEsIDApYCksIHJldHVybiBhbiBpbnN0YW5jZSBjb21wYXRpYmxlIHdpdGhcbiAqICAgIFtgV2ViS2l0Q1NTTWF0cml4YF0oaHR0cDovL2RldmVsb3Blci5hcHBsZS5jb20vbGlicmFyeS9zYWZhcmkvZG9jdW1lbnRhdGlvbi9BdWRpb1ZpZGVvL1JlZmVyZW5jZS9XZWJLaXRDU1NNYXRyaXhDbGFzc1JlZmVyZW5jZS9XZWJLaXRDU1NNYXRyaXgvV2ViS2l0Q1NTTWF0cml4Lmh0bWwpXG4gKiAgQGNvbnN0cnVjdG9yXG4gKiAgQHBhcmFtIHtzdHJpbmd9IGRvbXN0ciAtIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgMkQgb3IgM0QgdHJhbnNmb3JtIG1hdHJpeFxuICogICAgaW4gdGhlIGZvcm0gZ2l2ZW4gYnkgdGhlIENTUyB0cmFuc2Zvcm0gcHJvcGVydHksIGkuZS4ganVzdCBsaWtlIHRoZVxuICogICAgb3V0cHV0IGZyb20gW1tAbGluayN0b1N0cmluZ11dLlxuICogIEByZXR1cm5zIHtYQ1NTTWF0cml4fSBtYXRyaXhcbiAqL1xuY29uc3QgWENTU01hdHJpeCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gWENTU01hdHJpeChzdHIpIHtcblx0dGhpcy5tMTEgPSB0aGlzLm0yMiA9IHRoaXMubTMzID0gdGhpcy5tNDQgPSAxO1xuICAgICAgICAgICAgICAgdGhpcy5tMTIgPSB0aGlzLm0xMyA9IHRoaXMubTE0ID1cblx0dGhpcy5tMjEgPSAgICAgICAgICAgIHRoaXMubTIzID0gdGhpcy5tMjQgPVxuXHR0aGlzLm0zMSA9IHRoaXMubTMyID0gICAgICAgICAgICB0aGlzLm0zNCA9XG5cdHRoaXMubTQxID0gdGhpcy5tNDIgPSB0aGlzLm00MyAgICAgICAgICAgID0gMDtcblxuXHR0aGlzLnNldE1hdHJpeFZhbHVlKHN0cik7XG59O1xuXG5YQ1NTTWF0cml4LnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3I6IFhDU1NNYXRyaXgsXG5cblx0LyoqXG5cdCAqICBNdWx0aXBseSBvbmUgbWF0cml4IGJ5IGFub3RoZXJcblx0ICogIEBwYXJhbSB7WENTU01hdHJpeH0gb3RoZXJNYXRyaXggLSBUaGUgbWF0cml4IHRvIG11bHRpcGx5IHRoaXMgb25lIGJ5LlxuXHQgKi9cblx0bXVsdGlwbHkob3RoZXJNYXRyaXgpIHtcblx0XHRyZXR1cm4gbWF0cml4Lm11bHRpcGx5KHRoaXMsIG90aGVyTWF0cml4KTtcblx0fSxcblxuXHQvKipcblx0ICogIElmIHRoZSBtYXRyaXggaXMgaW52ZXJ0aWJsZSwgcmV0dXJucyBpdHMgaW52ZXJzZSwgb3RoZXJ3aXNlIHJldHVybnMgbnVsbC5cblx0ICogIEByZXR1cm5zIHtYQ1NTTWF0cml4fG51bGx9XG5cdCAqL1xuXHRpbnZlcnNlKCkge1xuXHRcdHJldHVybiBtYXRyaXguaW52ZXJzZSh0aGlzKTtcblx0fSxcblxuXHQvKipcblx0ICogIFJldHVybnMgdGhlIHJlc3VsdCBvZiByb3RhdGluZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxuXHQgKlxuXHQgKiAgSWYgb25seSB0aGUgZmlyc3QgYXJndW1lbnQgaXMgcHJvdmlkZWQsIHRoZSBtYXRyaXggaXMgb25seSByb3RhdGVkIGFib3V0XG5cdCAqICB0aGUgeiBheGlzLlxuXHQgKiAgQHBhcmFtIHtudW1iZXJ9IHJvdFggLSBUaGUgcm90YXRpb24gYXJvdW5kIHRoZSB4IGF4aXMuXG5cdCAqICBAcGFyYW0ge251bWJlcn0gcm90WSAtIFRoZSByb3RhdGlvbiBhcm91bmQgdGhlIHkgYXhpcy4gSWYgdW5kZWZpbmVkLCB0aGUgeCBjb21wb25lbnQgaXMgdXNlZC5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSByb3RaIC0gVGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeiBheGlzLiBJZiB1bmRlZmluZWQsIHRoZSB4IGNvbXBvbmVudCBpcyB1c2VkLlxuXHQgKiAgQHJldHVybnMgWENTU01hdHJpeFxuXHQgKi9cblx0cm90YXRlKHJ4LCByeSwgcnopIHtcblx0XHRpZiAocnggPT09IHVuZGVmaW5lZCkgeyByeCA9IDA7IH1cblxuXHRcdGlmIChyeSA9PT0gdW5kZWZpbmVkICYmXG5cdFx0XHRyeiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyeiA9IHJ4O1xuXHRcdFx0cnggPSAwO1xuXHRcdFx0cnkgPSAwO1xuXHRcdH1cblxuXHRcdGlmIChyeSA9PT0gdW5kZWZpbmVkKSB7IHJ5ID0gMDsgfVxuXHRcdGlmIChyeiA9PT0gdW5kZWZpbmVkKSB7IHJ6ID0gMDsgfVxuXG5cdFx0cnggPSBkZWcycmFkKHJ4KTtcblx0XHRyeSA9IGRlZzJyYWQocnkpO1xuXHRcdHJ6ID0gZGVnMnJhZChyeik7XG5cblx0XHRjb25zdCB0eCA9IG5ldyBYQ1NTTWF0cml4KCk7XG5cdFx0Y29uc3QgdHkgPSBuZXcgWENTU01hdHJpeCgpO1xuXHRcdGNvbnN0IHR6ID0gbmV3IFhDU1NNYXRyaXgoKTtcblx0XHRsZXQgc2luQSwgY29zQSwgc3E7XG5cblx0XHRyeiAvPSAyO1xuXHRcdHNpbkEgID0gTWF0aC5zaW4ocnopO1xuXHRcdGNvc0EgID0gTWF0aC5jb3MocnopO1xuXHRcdHNxID0gc2luQSAqIHNpbkE7XG5cblx0XHQvLyBNYXRyaWNlcyBhcmUgaWRlbnRpdHkgb3V0c2lkZSB0aGUgYXNzaWduZWQgdmFsdWVzXG5cdFx0dHoubTExID0gdHoubTIyID0gMSAtIDIgKiBzcTtcblx0XHR0ei5tMTIgPSB0ei5tMjEgPSAyICogc2luQSAqIGNvc0E7XG5cdFx0dHoubTIxICo9IC0xO1xuXG5cdFx0cnkgLz0gMjtcblx0XHRzaW5BICA9IE1hdGguc2luKHJ5KTtcblx0XHRjb3NBICA9IE1hdGguY29zKHJ5KTtcblx0XHRzcSA9IHNpbkEgKiBzaW5BO1xuXG5cdFx0dHkubTExID0gdHkubTMzID0gMSAtIDIgKiBzcTtcblx0XHR0eS5tMTMgPSB0eS5tMzEgPSAyICogc2luQSAqIGNvc0E7XG5cdFx0dHkubTEzICo9IC0xO1xuXG5cdFx0cnggLz0gMjtcblx0XHRzaW5BID0gTWF0aC5zaW4ocngpO1xuXHRcdGNvc0EgPSBNYXRoLmNvcyhyeCk7XG5cdFx0c3EgPSBzaW5BICogc2luQTtcblxuXHRcdHR4Lm0yMiA9IHR4Lm0zMyA9IDEgLSAyICogc3E7XG5cdFx0dHgubTIzID0gdHgubTMyID0gMiAqIHNpbkEgKiBjb3NBO1xuXHRcdHR4Lm0zMiAqPSAtMTtcblxuXHRcdGNvbnN0IGlkZW50aXR5TWF0cml4ID0gbmV3IFhDU1NNYXRyaXgoKTsgLy8gcmV0dXJucyBpZGVudGl0eSBtYXRyaXggYnkgZGVmYXVsdFxuXHRcdGNvbnN0IGlzSWRlbnRpdHkgICAgID0gdGhpcy50b1N0cmluZygpID09PSBpZGVudGl0eU1hdHJpeC50b1N0cmluZygpO1xuXHRcdGNvbnN0IHJvdGF0ZWRNYXRyaXggID0gaXNJZGVudGl0eSA/XG5cdFx0XHRcdHR6Lm11bHRpcGx5KHR5KS5tdWx0aXBseSh0eCkgOlxuXHRcdFx0XHR0aGlzLm11bHRpcGx5KHR4KS5tdWx0aXBseSh0eSkubXVsdGlwbHkodHopO1xuXG5cdFx0cmV0dXJuIHJvdGF0ZWRNYXRyaXg7XG5cdH0sXG5cblx0LyoqXG5cdCAqICBSZXR1cm5zIHRoZSByZXN1bHQgb2Ygc2NhbGluZyB0aGUgbWF0cml4IGJ5IGEgZ2l2ZW4gdmVjdG9yLlxuXHQgKiAgQHBhcmFtIHtudW1iZXJ9IHNjYWxlWCAtIHRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeCBheGlzLlxuXHQgKiAgQHBhcmFtIHtudW1iZXJ9IHNjYWxlWSAtIHRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeSBheGlzLiBJZiB1bmRlZmluZWQsIHRoZSB4IGNvbXBvbmVudCBpcyB1c2VkLlxuXHQgKiAgQHBhcmFtIHtudW1iZXJ9IHNjYWxlWiAtIHRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeiBheGlzLiBJZiB1bmRlZmluZWQsIDEgaXMgdXNlZC5cblx0ICogIEByZXR1cm5zIFhDU1NNYXRyaXhcblx0ICovXG5cdHNjYWxlKHNjYWxlWCwgc2NhbGVZLCBzY2FsZVopIHtcblx0XHRjb25zdCB0cmFuc2Zvcm0gPSBuZXcgWENTU01hdHJpeCgpO1xuXG5cdFx0aWYgKHNjYWxlWCA9PT0gdW5kZWZpbmVkKSB7IHNjYWxlWCA9IDE7IH1cblx0XHRpZiAoc2NhbGVZID09PSB1bmRlZmluZWQpIHsgc2NhbGVZID0gc2NhbGVYOyB9XG5cdFx0aWYgKCFzY2FsZVopIHsgc2NhbGVaID0gMTsgfVxuXG5cdFx0dHJhbnNmb3JtLm0xMSA9IHNjYWxlWDtcblx0XHR0cmFuc2Zvcm0ubTIyID0gc2NhbGVZO1xuXHRcdHRyYW5zZm9ybS5tMzMgPSBzY2FsZVo7XG5cblx0XHRyZXR1cm4gdGhpcy5tdWx0aXBseSh0cmFuc2Zvcm0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiAgUmV0dXJucyB0aGUgcmVzdWx0IG9mIHNrZXdpbmcgdGhlIG1hdHJpeCBieSBhIGdpdmVuIHZlY3Rvci5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSBza2V3WCAtIFRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeCBheGlzLlxuXHQgKiAgQHJldHVybnMgWENTU01hdHJpeFxuXHQgKi9cblx0c2tld1goZGVncmVlcykge1xuXHRcdGNvbnN0IHJhZGlhbnMgICA9IGRlZzJyYWQoZGVncmVlcyk7XG5cdFx0Y29uc3QgdHJhbnNmb3JtID0gbmV3IFhDU1NNYXRyaXgoKTtcblxuXHRcdHRyYW5zZm9ybS5jID0gTWF0aC50YW4ocmFkaWFucyk7XG5cblx0XHRyZXR1cm4gdGhpcy5tdWx0aXBseSh0cmFuc2Zvcm0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiAgUmV0dXJucyB0aGUgcmVzdWx0IG9mIHNrZXdpbmcgdGhlIG1hdHJpeCBieSBhIGdpdmVuIHZlY3Rvci5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSBza2V3WSAtIHRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgeCBheGlzLlxuXHQgKiAgQHJldHVybnMgWENTU01hdHJpeFxuXHQgKi9cblx0c2tld1koZGVncmVlcykge1xuXHRcdGNvbnN0IHJhZGlhbnMgICA9IGRlZzJyYWQoZGVncmVlcyk7XG5cdFx0Y29uc3QgdHJhbnNmb3JtID0gbmV3IFhDU1NNYXRyaXgoKTtcblxuXHRcdHRyYW5zZm9ybS5iID0gTWF0aC50YW4ocmFkaWFucyk7XG5cblx0XHRyZXR1cm4gdGhpcy5tdWx0aXBseSh0cmFuc2Zvcm0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiAgUmV0dXJucyB0aGUgcmVzdWx0IG9mIHRyYW5zbGF0aW5nIHRoZSBtYXRyaXggYnkgYSBnaXZlbiB2ZWN0b3IuXG5cdCAqICBAcGFyYW0ge251bWJlcn0geCAtIFRoZSB4IGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuXHQgKiAgQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cblx0ICogIEBwYXJhbSB7bnVtYmVyfSB6IC0gVGhlIHogY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuIElmIHVuZGVmaW5lZCwgMCBpcyB1c2VkLlxuXHQgKiAgQHJldHVybnMgWENTU01hdHJpeFxuXHQgKi9cblx0dHJhbnNsYXRlKHgsIHksIHopIHtcblx0XHRjb25zdCB0ID0gbmV3IFhDU1NNYXRyaXgoKTtcblxuXHRcdGlmICh4ID09PSB1bmRlZmluZWQpIHsgeCA9IDA7IH1cblx0XHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB7IHkgPSAwOyB9XG5cdFx0aWYgKHogPT09IHVuZGVmaW5lZCkgeyB6ID0gMDsgfVxuXG5cdFx0dC5tNDEgPSB4O1xuXHRcdHQubTQyID0geTtcblx0XHR0Lm00MyA9IHo7XG5cblx0XHRyZXR1cm4gdGhpcy5tdWx0aXBseSh0KTtcblx0fSxcblxuXHQvKipcblx0ICogIFNldHMgdGhlIG1hdHJpeCB2YWx1ZXMgdXNpbmcgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24sIHN1Y2ggYXMgdGhhdCBwcm9kdWNlZFxuXHQgKiAgYnkgdGhlIFtbWENTU01hdHJpeCN0b1N0cmluZ11dIG1ldGhvZC5cblx0ICogIEBwYXJhbXMge3N0cmluZ30gZG9tc3RyIC0gQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSAyRCBvciAzRCB0cmFuc2Zvcm0gbWF0cml4XG5cdCAqICAgIGluIHRoZSBmb3JtIGdpdmVuIGJ5IHRoZSBDU1MgdHJhbnNmb3JtIHByb3BlcnR5LCBpLmUuIGp1c3QgbGlrZSB0aGVcblx0ICogICAgb3V0cHV0IGZyb20gW1tYQ1NTTWF0cml4I3RvU3RyaW5nXV0uXG5cdCAqICBAcmV0dXJucyB1bmRlZmluZWRcblx0ICovXG5cdHNldE1hdHJpeFZhbHVlKGRvbXN0cikge1xuXHRcdGlmICghZG9tc3RyKSB7IHJldHVybjsgfVxuXG5cdFx0dmFyIG1hdHJpeE9iamVjdCA9IHRyYW5zcChkb21zdHIpO1xuXHRcdGlmICghbWF0cml4T2JqZWN0KSB7IHJldHVybjsgfVxuXG5cdFx0dmFyIGlzM2QgICA9IG1hdHJpeE9iamVjdC5rZXkgPT09ICdtYXRyaXgzZCc7XG5cdFx0dmFyIGtleWdlbiA9IGlzM2QgPyBpbmRleFRvS2V5M2QgOiBpbmRleFRvS2V5MmQ7XG5cdFx0dmFyIHZhbHVlcyA9IG1hdHJpeE9iamVjdC52YWx1ZTtcblx0XHR2YXIgY291bnQgID0gdmFsdWVzLmxlbmd0aDtcblxuXHRcdGlmICgoaXMzZCAmJiBjb3VudCAhPT0gMTYpIHx8ICEoaXMzZCB8fCBjb3VudCA9PT0gNikpIHsgcmV0dXJuOyB9XG5cblx0XHR2YWx1ZXMuZm9yRWFjaChmdW5jdGlvbihvYmosIGlkeCkge1xuXHRcdFx0dmFyIGtleSA9IGtleWdlbihpZHgpO1xuXHRcdFx0dGhpc1trZXldID0gb2JqLnZhbHVlO1xuXHRcdH0sIHRoaXMpO1xuXHR9LFxuXG5cdGRlY29tcG9zZSgpIHtcblx0XHRyZXR1cm4gbWF0cml4LmRlY29tcG9zZSh0aGlzKTtcblx0fSxcblxuXHRjb21wb3NlKHtcblx0XHR4LCB5LCB6LFxuXHRcdHJvdGF0ZVgsIHJvdGF0ZVksIHJvdGF0ZVosXG5cdFx0c2NhbGVYLCBzY2FsZVksIHNjYWxlWixcblx0XHRza2V3WCwgc2tld1lcblx0fSkge1xuXHRcdGxldCBtID0gdGhpcztcblx0XHRtID0gbS50cmFuc2xhdGUoeCwgeSwgeik7XG5cdFx0bSA9IG0ucm90YXRlKHJvdGF0ZVgsIHJvdGF0ZVksIHJvdGF0ZVopO1xuXHRcdG0gPSBtLnNjYWxlKHNjYWxlWCwgc2NhbGVZLCBzY2FsZVopO1xuXHRcdGlmIChza2V3WCAhPT0gdW5kZWZpbmVkKSB7IG0gPSBtLnNrZXdYKHNrZXdYKTsgfVxuXHRcdGlmIChza2V3WSAhPT0gdW5kZWZpbmVkKSB7IG0gPSBtLnNrZXdZKHNrZXdZKTsgfVxuXG5cdFx0cmV0dXJuIG07XG5cdH0sXG5cblx0LyoqXG5cdCAqICBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBtYXRyaXguXG5cdCAqICBAcmV0dXJucyB7c3RyaW5nfSBtYXRyaXhTdHJpbmcgLSBhIHN0cmluZyBsaWtlIGBtYXRyaXgoMS4wMDAwMDAsIDAuMDAwMDAwLCAwLjAwMDAwMCwgMS4wMDAwMDAsIDAuMDAwMDAwLCAwLjAwMDAwMClgXG5cdCAqXG5cdCAqKi9cblx0dG9TdHJpbmcoKSB7XG5cdFx0bGV0IHBvaW50cywgcHJlZml4O1xuXG5cdFx0aWYgKG1hdHJpeC5pc0FmZmluZSh0aGlzKSkge1xuXHRcdFx0cHJlZml4ID0gJ21hdHJpeCc7XG5cdFx0XHRwb2ludHMgPSBwb2ludHMyZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cHJlZml4ID0gJ21hdHJpeDNkJztcblx0XHRcdHBvaW50cyA9IHBvaW50czNkO1xuXHRcdH1cblxuXHRcdHJldHVybiBgJHtwcmVmaXh9KCR7cG9pbnRzLm1hcChsb29rdXBUb0ZpeGVkLCB0aGlzKS5qb2luKCcsICcpfSlgO1xuXHR9XG59OyIsImNvbnN0IFZlY3RvcjQgPSByZXF1aXJlKCcuL1ZlY3RvcjQnKTtcblxuLyoqXG4gKiAgQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSAyeDIgbWF0cml4LlxuICogIEBwYXJhbSB7bnVtYmVyfSBhIC0gVG9wLWxlZnQgdmFsdWUgb2YgdGhlIG1hdHJpeC5cbiAqICBAcGFyYW0ge251bWJlcn0gYiAtIFRvcC1yaWdodCB2YWx1ZSBvZiB0aGUgbWF0cml4LlxuICogIEBwYXJhbSB7bnVtYmVyfSBjIC0gQm90dG9tLWxlZnQgdmFsdWUgb2YgdGhlIG1hdHJpeC5cbiAqICBAcGFyYW0ge251bWJlcn0gZCAtIEJvdHRvbS1yaWdodCB2YWx1ZSBvZiB0aGUgbWF0cml4LlxuICogIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmNvbnN0IGRldGVybWluYW50MngyID0gZnVuY3Rpb24oYSwgYiwgYywgZCkge1xuXHRyZXR1cm4gYSAqIGQgLSBiICogYztcbn07XG5cbi8qKlxuICogIENhbGN1bGF0ZXMgdGhlIGRldGVybWluYW50IG9mIGEgM3gzIG1hdHJpeC5cbiAqICBAcGFyYW0ge251bWJlcn0gYTEgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzEsIDFdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBhMiAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMSwgMl0uXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGEzIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFsxLCAzXS5cbiAqICBAcGFyYW0ge251bWJlcn0gYjEgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzIsIDFdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBiMiAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMiwgMl0uXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGIzIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFsyLCAzXS5cbiAqICBAcGFyYW0ge251bWJlcn0gYzEgLSBNYXRyaXggdmFsdWUgaW4gcG9zaXRpb24gWzMsIDFdLlxuICogIEBwYXJhbSB7bnVtYmVyfSBjMiAtIE1hdHJpeCB2YWx1ZSBpbiBwb3NpdGlvbiBbMywgMl0uXG4gKiAgQHBhcmFtIHtudW1iZXJ9IGMzIC0gTWF0cml4IHZhbHVlIGluIHBvc2l0aW9uIFszLCAzXS5cbiAqICBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5jb25zdCBkZXRlcm1pbmFudDN4MyA9IGZ1bmN0aW9uKGExLCBhMiwgYTMsIGIxLCBiMiwgYjMsIGMxLCBjMiwgYzMpIHtcblx0cmV0dXJuIGExICogZGV0ZXJtaW5hbnQyeDIoYjIsIGIzLCBjMiwgYzMpIC1cblx0XHRiMSAqIGRldGVybWluYW50MngyKGEyLCBhMywgYzIsIGMzKSArXG5cdFx0YzEgKiBkZXRlcm1pbmFudDJ4MihhMiwgYTMsIGIyLCBiMyk7XG59O1xuXG4vKipcbiAqICBDYWxjdWxhdGVzIHRoZSBkZXRlcm1pbmFudCBvZiBhIDR4NCBtYXRyaXguXG4gKiAgQHBhcmFtIHtYQ1NTTWF0cml4fSBtYXRyaXggLSBUaGUgbWF0cml4IHRvIGNhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnQgb2YuXG4gKiAgQHJldHVybnMge251bWJlcn1cbiAqL1xuY29uc3QgZGV0ZXJtaW5hbnQ0eDQgPSBmdW5jdGlvbihtYXRyaXgpIHtcblx0bGV0IG0gPSBtYXRyaXgsXG5cdFx0Ly8gQXNzaWduIHRvIGluZGl2aWR1YWwgdmFyaWFibGUgbmFtZXMgdG8gYWlkIHNlbGVjdGluZyBjb3JyZWN0IGVsZW1lbnRzXG5cdFx0YTEgPSBtLm0xMSwgYjEgPSBtLm0yMSwgYzEgPSBtLm0zMSwgZDEgPSBtLm00MSxcblx0XHRhMiA9IG0ubTEyLCBiMiA9IG0ubTIyLCBjMiA9IG0ubTMyLCBkMiA9IG0ubTQyLFxuXHRcdGEzID0gbS5tMTMsIGIzID0gbS5tMjMsIGMzID0gbS5tMzMsIGQzID0gbS5tNDMsXG5cdFx0YTQgPSBtLm0xNCwgYjQgPSBtLm0yNCwgYzQgPSBtLm0zNCwgZDQgPSBtLm00NDtcblxuXHRyZXR1cm4gYTEgKiBkZXRlcm1pbmFudDN4MyhiMiwgYjMsIGI0LCBjMiwgYzMsIGM0LCBkMiwgZDMsIGQ0KSAtXG5cdFx0YjEgKiBkZXRlcm1pbmFudDN4MyhhMiwgYTMsIGE0LCBjMiwgYzMsIGM0LCBkMiwgZDMsIGQ0KSArXG5cdFx0YzEgKiBkZXRlcm1pbmFudDN4MyhhMiwgYTMsIGE0LCBiMiwgYjMsIGI0LCBkMiwgZDMsIGQ0KSAtXG5cdFx0ZDEgKiBkZXRlcm1pbmFudDN4MyhhMiwgYTMsIGE0LCBiMiwgYjMsIGI0LCBjMiwgYzMsIGM0KTtcbn07XG5cbi8qKlxuICogIERldGVybWluZXMgd2hldGhlciB0aGUgbWF0cml4IGlzIGFmZmluZS5cbiAqICBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuY29uc3QgaXNBZmZpbmUgPSBmdW5jdGlvbihtKSB7XG5cdHJldHVybiBtLm0xMyA9PT0gMCAmJiBtLm0xNCA9PT0gMCAmJlxuXHRcdG0ubTIzID09PSAwICYmIG0ubTI0ID09PSAwICYmXG5cdFx0bS5tMzEgPT09IDAgJiYgbS5tMzIgPT09IDAgJiZcblx0XHRtLm0zMyA9PT0gMSAmJiBtLm0zNCA9PT0gMCAmJlxuXHRcdG0ubTQzID09PSAwICYmIG0ubTQ0ID09PSAxO1xufTtcblxuLyoqXG4gKiAgUmV0dXJucyB3aGV0aGVyIHRoZSBtYXRyaXggaXMgdGhlIGlkZW50aXR5IG1hdHJpeCBvciBhIHRyYW5zbGF0aW9uIG1hdHJpeC5cbiAqICBAcmV0dXJuIHtib29sZWFufVxuICovXG5jb25zdCBpc0lkZW50aXR5T3JUcmFuc2xhdGlvbiA9IGZ1bmN0aW9uKG0pIHtcblx0cmV0dXJuIG0ubTExID09PSAxICYmIG0ubTEyID09PSAwICYmIG0ubTEzID09PSAwICYmIG0ubTE0ID09PSAwICYmXG5cdFx0bS5tMjEgPT09IDAgJiYgbS5tMjIgPT09IDEgJiYgbS5tMjMgPT09IDAgJiYgbS5tMjQgPT09IDAgJiZcblx0XHRtLm0zMSA9PT0gMCAmJiBtLm0zMSA9PT0gMCAmJiBtLm0zMyA9PT0gMSAmJiBtLm0zNCA9PT0gMCAmJlxuXHRcdC8vIG00MSwgbTQyIGFuZCBtNDMgYXJlIHRoZSB0cmFuc2xhdGlvbiBwb2ludHNcblx0XHRtLm00NCA9PT0gMTtcbn07XG5cbi8qKlxuICogIFJldHVybnMgdGhlIGFkam9pbnQgbWF0cml4LlxuICogIEByZXR1cm4ge1hDU1NNYXRyaXh9XG4gKi9cbmNvbnN0IGFkam9pbnQgPSBmdW5jdGlvbihtKSB7XG5cdC8vIG1ha2UgYHJlc3VsdGAgdGhlIHNhbWUgdHlwZSBhcyB0aGUgZ2l2ZW4gbWV0cmljXG5cdGNvbnN0IHJlc3VsdCA9IG5ldyBtLmNvbnN0cnVjdG9yKCk7XG5cdGxldCBhMSA9IG0ubTExLCBiMSA9IG0ubTEyLCBjMSA9IG0ubTEzLCBkMSA9IG0ubTE0O1xuXHRsZXQgYTIgPSBtLm0yMSwgYjIgPSBtLm0yMiwgYzIgPSBtLm0yMywgZDIgPSBtLm0yNDtcblx0bGV0IGEzID0gbS5tMzEsIGIzID0gbS5tMzIsIGMzID0gbS5tMzMsIGQzID0gbS5tMzQ7XG5cdGxldCBhNCA9IG0ubTQxLCBiNCA9IG0ubTQyLCBjNCA9IG0ubTQzLCBkNCA9IG0ubTQ0O1xuXG5cdC8vIFJvdyBjb2x1bW4gbGFiZWxpbmcgcmV2ZXJzZWQgc2luY2Ugd2UgdHJhbnNwb3NlIHJvd3MgJiBjb2x1bW5zXG5cdHJlc3VsdC5tMTEgPSAgZGV0ZXJtaW5hbnQzeDMoYjIsIGIzLCBiNCwgYzIsIGMzLCBjNCwgZDIsIGQzLCBkNCk7XG5cdHJlc3VsdC5tMjEgPSAtZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYzIsIGMzLCBjNCwgZDIsIGQzLCBkNCk7XG5cdHJlc3VsdC5tMzEgPSAgZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgZDIsIGQzLCBkNCk7XG5cdHJlc3VsdC5tNDEgPSAtZGV0ZXJtaW5hbnQzeDMoYTIsIGEzLCBhNCwgYjIsIGIzLCBiNCwgYzIsIGMzLCBjNCk7XG5cblx0cmVzdWx0Lm0xMiA9IC1kZXRlcm1pbmFudDN4MyhiMSwgYjMsIGI0LCBjMSwgYzMsIGM0LCBkMSwgZDMsIGQ0KTtcblx0cmVzdWx0Lm0yMiA9ICBkZXRlcm1pbmFudDN4MyhhMSwgYTMsIGE0LCBjMSwgYzMsIGM0LCBkMSwgZDMsIGQ0KTtcblx0cmVzdWx0Lm0zMiA9IC1kZXRlcm1pbmFudDN4MyhhMSwgYTMsIGE0LCBiMSwgYjMsIGI0LCBkMSwgZDMsIGQ0KTtcblx0cmVzdWx0Lm00MiA9ICBkZXRlcm1pbmFudDN4MyhhMSwgYTMsIGE0LCBiMSwgYjMsIGI0LCBjMSwgYzMsIGM0KTtcblxuXHRyZXN1bHQubTEzID0gIGRldGVybWluYW50M3gzKGIxLCBiMiwgYjQsIGMxLCBjMiwgYzQsIGQxLCBkMiwgZDQpO1xuXHRyZXN1bHQubTIzID0gLWRldGVybWluYW50M3gzKGExLCBhMiwgYTQsIGMxLCBjMiwgYzQsIGQxLCBkMiwgZDQpO1xuXHRyZXN1bHQubTMzID0gIGRldGVybWluYW50M3gzKGExLCBhMiwgYTQsIGIxLCBiMiwgYjQsIGQxLCBkMiwgZDQpO1xuXHRyZXN1bHQubTQzID0gLWRldGVybWluYW50M3gzKGExLCBhMiwgYTQsIGIxLCBiMiwgYjQsIGMxLCBjMiwgYzQpO1xuXG5cdHJlc3VsdC5tMTQgPSAtZGV0ZXJtaW5hbnQzeDMoYjEsIGIyLCBiMywgYzEsIGMyLCBjMywgZDEsIGQyLCBkMyk7XG5cdHJlc3VsdC5tMjQgPSAgZGV0ZXJtaW5hbnQzeDMoYTEsIGEyLCBhMywgYzEsIGMyLCBjMywgZDEsIGQyLCBkMyk7XG5cdHJlc3VsdC5tMzQgPSAtZGV0ZXJtaW5hbnQzeDMoYTEsIGEyLCBhMywgYjEsIGIyLCBiMywgZDEsIGQyLCBkMyk7XG5cdHJlc3VsdC5tNDQgPSAgZGV0ZXJtaW5hbnQzeDMoYTEsIGEyLCBhMywgYjEsIGIyLCBiMywgYzEsIGMyLCBjMyk7XG5cblx0cmV0dXJuIHJlc3VsdDtcbn07XG5cbmNvbnN0IGludmVyc2UgPSBmdW5jdGlvbihtYXRyaXgpIHtcblx0bGV0IGludjtcblxuXHRpZiAoaXNJZGVudGl0eU9yVHJhbnNsYXRpb24obWF0cml4KSkge1xuXHRcdGludiA9IG5ldyBtYXRyaXguY29uc3RydWN0b3IoKTtcblxuXHRcdGlmICghKG1hdHJpeC5tNDEgPT09IDAgJiYgbWF0cml4Lm00MiA9PT0gMCAmJiBtYXRyaXgubTQzID09PSAwKSkge1xuXHRcdFx0aW52Lm00MSA9IC1tYXRyaXgubTQxO1xuXHRcdFx0aW52Lm00MiA9IC1tYXRyaXgubTQyO1xuXHRcdFx0aW52Lm00MyA9IC1tYXRyaXgubTQzO1xuXHRcdH1cblxuXHRcdHJldHVybiBpbnY7XG5cdH1cblxuXHQvLyBDYWxjdWxhdGUgdGhlIGFkam9pbnQgbWF0cml4XG5cdGNvbnN0IHJlc3VsdCA9IGFkam9pbnQobWF0cml4KTtcblxuXHQvLyBDYWxjdWxhdGUgdGhlIDR4NCBkZXRlcm1pbmFudFxuXHRjb25zdCBkZXQgPSBkZXRlcm1pbmFudDR4NChtYXRyaXgpO1xuXG5cdC8vIElmIHRoZSBkZXRlcm1pbmFudCBpcyB6ZXJvLCB0aGVuIHRoZSBpbnZlcnNlIG1hdHJpeCBpcyBub3QgdW5pcXVlXG5cdGlmIChNYXRoLmFicyhkZXQpIDwgMWUtOCkgeyByZXR1cm4gbnVsbDsgfVxuXG5cdC8vIFNjYWxlIHRoZSBhZGpvaW50IG1hdHJpeCB0byBnZXQgdGhlIGludmVyc2Vcblx0Zm9yIChsZXQgaWR4ID0gMTsgaWR4IDwgNTsgaWR4KyspIHtcblx0XHRmb3IgKGxldCBpID0gMTsgaSA8IDU7IGkrKykge1xuXHRcdFx0cmVzdWx0WygnbScgKyBpZHgpICsgaV0gLz0gZGV0O1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59O1xuXG5jb25zdCBtdWx0aXBseSA9IGZ1bmN0aW9uKG1hdHJpeCwgb3RoZXJNYXRyaXgpIHtcblx0aWYgKCFvdGhlck1hdHJpeCkgeyByZXR1cm4gbnVsbDsgfVxuXG5cdGxldCBhID0gb3RoZXJNYXRyaXg7XG5cdGxldCBiID0gbWF0cml4O1xuXHRsZXQgYyA9IG5ldyBtYXRyaXguY29uc3RydWN0b3IoKTtcblxuXHRjLm0xMSA9IGEubTExICogYi5tMTEgKyBhLm0xMiAqIGIubTIxICsgYS5tMTMgKiBiLm0zMSArIGEubTE0ICogYi5tNDE7XG5cdGMubTEyID0gYS5tMTEgKiBiLm0xMiArIGEubTEyICogYi5tMjIgKyBhLm0xMyAqIGIubTMyICsgYS5tMTQgKiBiLm00Mjtcblx0Yy5tMTMgPSBhLm0xMSAqIGIubTEzICsgYS5tMTIgKiBiLm0yMyArIGEubTEzICogYi5tMzMgKyBhLm0xNCAqIGIubTQzO1xuXHRjLm0xNCA9IGEubTExICogYi5tMTQgKyBhLm0xMiAqIGIubTI0ICsgYS5tMTMgKiBiLm0zNCArIGEubTE0ICogYi5tNDQ7XG5cblx0Yy5tMjEgPSBhLm0yMSAqIGIubTExICsgYS5tMjIgKiBiLm0yMSArIGEubTIzICogYi5tMzEgKyBhLm0yNCAqIGIubTQxO1xuXHRjLm0yMiA9IGEubTIxICogYi5tMTIgKyBhLm0yMiAqIGIubTIyICsgYS5tMjMgKiBiLm0zMiArIGEubTI0ICogYi5tNDI7XG5cdGMubTIzID0gYS5tMjEgKiBiLm0xMyArIGEubTIyICogYi5tMjMgKyBhLm0yMyAqIGIubTMzICsgYS5tMjQgKiBiLm00Mztcblx0Yy5tMjQgPSBhLm0yMSAqIGIubTE0ICsgYS5tMjIgKiBiLm0yNCArIGEubTIzICogYi5tMzQgKyBhLm0yNCAqIGIubTQ0O1xuXG5cdGMubTMxID0gYS5tMzEgKiBiLm0xMSArIGEubTMyICogYi5tMjEgKyBhLm0zMyAqIGIubTMxICsgYS5tMzQgKiBiLm00MTtcblx0Yy5tMzIgPSBhLm0zMSAqIGIubTEyICsgYS5tMzIgKiBiLm0yMiArIGEubTMzICogYi5tMzIgKyBhLm0zNCAqIGIubTQyO1xuXHRjLm0zMyA9IGEubTMxICogYi5tMTMgKyBhLm0zMiAqIGIubTIzICsgYS5tMzMgKiBiLm0zMyArIGEubTM0ICogYi5tNDM7XG5cdGMubTM0ID0gYS5tMzEgKiBiLm0xNCArIGEubTMyICogYi5tMjQgKyBhLm0zMyAqIGIubTM0ICsgYS5tMzQgKiBiLm00NDtcblxuXHRjLm00MSA9IGEubTQxICogYi5tMTEgKyBhLm00MiAqIGIubTIxICsgYS5tNDMgKiBiLm0zMSArIGEubTQ0ICogYi5tNDE7XG5cdGMubTQyID0gYS5tNDEgKiBiLm0xMiArIGEubTQyICogYi5tMjIgKyBhLm00MyAqIGIubTMyICsgYS5tNDQgKiBiLm00Mjtcblx0Yy5tNDMgPSBhLm00MSAqIGIubTEzICsgYS5tNDIgKiBiLm0yMyArIGEubTQzICogYi5tMzMgKyBhLm00NCAqIGIubTQzO1xuXHRjLm00NCA9IGEubTQxICogYi5tMTQgKyBhLm00MiAqIGIubTI0ICsgYS5tNDMgKiBiLm0zNCArIGEubTQ0ICogYi5tNDQ7XG5cblx0cmV0dXJuIGM7XG59O1xuXG5mdW5jdGlvbiB0cmFuc3Bvc2UobWF0cml4KSB7XG5cdHZhciByZXN1bHQgPSBuZXcgbWF0cml4LmNvbnN0cnVjdG9yKCk7XG5cdHZhciByb3dzID0gNCwgY29scyA9IDQ7XG5cdHZhciBpID0gY29scywgajtcblx0d2hpbGUgKGkpIHtcblx0XHRqID0gcm93cztcblx0XHR3aGlsZSAoaikge1xuXHRcdFx0cmVzdWx0WydtJyArIGkgKyBqXSA9IG1hdHJpeFsnbScgKyBqICsgaV07XG5cdFx0XHRqLS07XG5cdFx0fVxuXHRcdGktLTtcblx0fVxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqICBJbnB1dDogIG1hdHJpeCAgICAgIDsgYSA0eDQgbWF0cml4XG4gKiAgT3V0cHV0OiB0cmFuc2xhdGlvbiA7IGEgMyBjb21wb25lbnQgdmVjdG9yXG4gKiAgICAgICAgICBzY2FsZSAgICAgICA7IGEgMyBjb21wb25lbnQgdmVjdG9yXG4gKiAgICAgICAgICBza2V3ICAgICAgICA7IHNrZXcgZmFjdG9ycyBYWSxYWixZWiByZXByZXNlbnRlZCBhcyBhIDMgY29tcG9uZW50IHZlY3RvclxuICogICAgICAgICAgcGVyc3BlY3RpdmUgOyBhIDQgY29tcG9uZW50IHZlY3RvclxuICogICAgICAgICAgcm90YXRlICA7IGEgNCBjb21wb25lbnQgdmVjdG9yXG4gKiAgUmV0dXJucyBmYWxzZSBpZiB0aGUgbWF0cml4IGNhbm5vdCBiZSBkZWNvbXBvc2VkLCB0cnVlIGlmIGl0IGNhblxuICovXG5mdW5jdGlvbiBkZWNvbXBvc2UobWF0cml4KSB7XG5cdGxldCBwZXJzcGVjdGl2ZU1hdHJpeDtcblx0bGV0IHJpZ2h0SGFuZFNpZGU7XG5cdGxldCBpbnZlcnNlUGVyc3BlY3RpdmVNYXRyaXg7XG5cdGxldCB0cmFuc3Bvc2VkSW52ZXJzZVBlcnNwZWN0aXZlTWF0cml4O1xuXHRsZXQgcGVyc3BlY3RpdmU7XG5cdGxldCB0cmFuc2xhdGU7XG5cdGxldCByb3c7XG5cdGxldCBpO1xuXHRsZXQgbGVuO1xuXHRsZXQgc2NhbGU7XG5cdGxldCBza2V3O1xuXHRsZXQgcGR1bTM7XG5cdGxldCByb3RhdGU7XG5cblx0Ly8gTm9ybWFsaXplIHRoZSBtYXRyaXguXG5cdGlmIChtYXRyaXgubTMzID09PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdGZvciAobGV0IGkgPSAxOyBpIDw9IDQ7IGkrKykge1xuXHRcdGZvciAobGV0IGogPSAxOyBqIDwgNDsgaisrKSB7XG5cdFx0XHRtYXRyaXhbJ20nICsgaSArIGpdIC89IG1hdHJpeC5tNDQ7XG5cdFx0fVxuXHR9XG5cblx0Ly8gcGVyc3BlY3RpdmVNYXRyaXggaXMgdXNlZCB0byBzb2x2ZSBmb3IgcGVyc3BlY3RpdmUsIGJ1dCBpdCBhbHNvIHByb3ZpZGVzXG5cdC8vIGFuIGVhc3kgd2F5IHRvIHRlc3QgZm9yIHNpbmd1bGFyaXR5IG9mIHRoZSB1cHBlciAzeDMgY29tcG9uZW50LlxuXHRwZXJzcGVjdGl2ZU1hdHJpeCA9IG1hdHJpeDtcblx0cGVyc3BlY3RpdmVNYXRyaXgubTE0ID0gMDtcblx0cGVyc3BlY3RpdmVNYXRyaXgubTI0ID0gMDtcblx0cGVyc3BlY3RpdmVNYXRyaXgubTM0ID0gMDtcblx0cGVyc3BlY3RpdmVNYXRyaXgubTQ0ID0gMTtcblxuXHRpZiAoZGV0ZXJtaW5hbnQ0eDQocGVyc3BlY3RpdmVNYXRyaXgpID09PSAwKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gRmlyc3QsIGlzb2xhdGUgcGVyc3BlY3RpdmUuXG5cdGlmIChtYXRyaXgubTE0ICE9PSAwIHx8IG1hdHJpeC5tMjQgIT09IDAgfHwgbWF0cml4Lm0zNCAhPT0gMCkge1xuXHRcdC8vIHJpZ2h0SGFuZFNpZGUgaXMgdGhlIHJpZ2h0IGhhbmQgc2lkZSBvZiB0aGUgZXF1YXRpb24uXG5cdFx0cmlnaHRIYW5kU2lkZSA9IG5ldyBWZWN0b3I0KG1hdHJpeC5tMTQsIG1hdHJpeC5tMjQsIG1hdHJpeC5tMzQsIG1hdHJpeC5tNDQpO1xuXG5cdFx0Ly8gU29sdmUgdGhlIGVxdWF0aW9uIGJ5IGludmVydGluZyBwZXJzcGVjdGl2ZU1hdHJpeCBhbmQgbXVsdGlwbHlpbmdcblx0XHQvLyByaWdodEhhbmRTaWRlIGJ5IHRoZSBpbnZlcnNlLlxuXHRcdGludmVyc2VQZXJzcGVjdGl2ZU1hdHJpeCA9IGludmVyc2UocGVyc3BlY3RpdmVNYXRyaXgpO1xuXHRcdHRyYW5zcG9zZWRJbnZlcnNlUGVyc3BlY3RpdmVNYXRyaXggPSB0cmFuc3Bvc2UoaW52ZXJzZVBlcnNwZWN0aXZlTWF0cml4KTtcblx0XHRwZXJzcGVjdGl2ZSA9IHJpZ2h0SGFuZFNpZGUubXVsdGlwbHlCeU1hdHJpeCh0cmFuc3Bvc2VkSW52ZXJzZVBlcnNwZWN0aXZlTWF0cml4KTtcblx0fVxuXHRlbHNlIHtcblx0XHQvLyBObyBwZXJzcGVjdGl2ZS5cblx0XHRwZXJzcGVjdGl2ZSA9IG5ldyBWZWN0b3I0KDAsIDAsIDAsIDEpO1xuXHR9XG5cblx0Ly8gTmV4dCB0YWtlIGNhcmUgb2YgdHJhbnNsYXRpb25cblx0Ly8gSWYgaXQncyBhIDJEIG1hdHJpeCwgZSBhbmQgZiB3aWxsIGJlIGZpbGxlZFxuXHR0cmFuc2xhdGUgPSBuZXcgVmVjdG9yNChtYXRyaXguZSB8fCBtYXRyaXgubTQxLCBtYXRyaXguZiB8fCBtYXRyaXgubTQyLCBtYXRyaXgubTQzKTtcblxuXHQvLyBOb3cgZ2V0IHNjYWxlIGFuZCBzaGVhci4gJ3JvdycgaXMgYSAzIGVsZW1lbnQgYXJyYXkgb2YgMyBjb21wb25lbnQgdmVjdG9yc1xuXHRyb3cgPSBbIG5ldyBWZWN0b3I0KCksIG5ldyBWZWN0b3I0KCksIG5ldyBWZWN0b3I0KCkgXTtcblx0Zm9yIChpID0gMSwgbGVuID0gcm93Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0cm93W2kgLSAxXS54ID0gbWF0cml4WydtJyArIGkgKyAnMSddO1xuXHRcdHJvd1tpIC0gMV0ueSA9IG1hdHJpeFsnbScgKyBpICsgJzInXTtcblx0XHRyb3dbaSAtIDFdLnogPSBtYXRyaXhbJ20nICsgaSArICczJ107XG5cdH1cblxuXHQvLyBDb21wdXRlIFggc2NhbGUgZmFjdG9yIGFuZCBub3JtYWxpemUgZmlyc3Qgcm93LlxuXHRzY2FsZSA9IG5ldyBWZWN0b3I0KCk7XG5cdHNrZXcgPSBuZXcgVmVjdG9yNCgpO1xuXG5cdHNjYWxlLnggPSByb3dbMF0ubGVuZ3RoKCk7XG5cdHJvd1swXSA9IHJvd1swXS5ub3JtYWxpemUoKTtcblxuXHQvLyBDb21wdXRlIFhZIHNoZWFyIGZhY3RvciBhbmQgbWFrZSAybmQgcm93IG9ydGhvZ29uYWwgdG8gMXN0LlxuXHRza2V3LnggPSByb3dbMF0uZG90KHJvd1sxXSk7XG5cdHJvd1sxXSA9IHJvd1sxXS5jb21iaW5lKHJvd1swXSwgMS4wLCAtc2tldy54KTtcblxuXHQvLyBOb3csIGNvbXB1dGUgWSBzY2FsZSBhbmQgbm9ybWFsaXplIDJuZCByb3cuXG5cdHNjYWxlLnkgPSByb3dbMV0ubGVuZ3RoKCk7XG5cdHJvd1sxXSA9IHJvd1sxXS5ub3JtYWxpemUoKTtcblx0c2tldy54IC89IHNjYWxlLnk7XG5cblx0Ly8gQ29tcHV0ZSBYWiBhbmQgWVogc2hlYXJzLCBvcnRob2dvbmFsaXplIDNyZCByb3dcblx0c2tldy55ID0gcm93WzBdLmRvdChyb3dbMl0pO1xuXHRyb3dbMl0gPSByb3dbMl0uY29tYmluZShyb3dbMF0sIDEuMCwgLXNrZXcueSk7XG5cdHNrZXcueiA9IHJvd1sxXS5kb3Qocm93WzJdKTtcblx0cm93WzJdID0gcm93WzJdLmNvbWJpbmUocm93WzFdLCAxLjAsIC1za2V3LnopO1xuXG5cdC8vIE5leHQsIGdldCBaIHNjYWxlIGFuZCBub3JtYWxpemUgM3JkIHJvdy5cblx0c2NhbGUueiA9IHJvd1syXS5sZW5ndGgoKTtcblx0cm93WzJdID0gcm93WzJdLm5vcm1hbGl6ZSgpO1xuXHRza2V3LnkgPSAoc2tldy55IC8gc2NhbGUueikgfHwgMDtcblx0c2tldy56ID0gKHNrZXcueiAvIHNjYWxlLnopIHx8IDA7XG5cblx0Ly8gQXQgdGhpcyBwb2ludCwgdGhlIG1hdHJpeCAoaW4gcm93cykgaXMgb3J0aG9ub3JtYWwuXG5cdC8vIENoZWNrIGZvciBhIGNvb3JkaW5hdGUgc3lzdGVtIGZsaXAuICBJZiB0aGUgZGV0ZXJtaW5hbnRcblx0Ly8gaXMgLTEsIHRoZW4gbmVnYXRlIHRoZSBtYXRyaXggYW5kIHRoZSBzY2FsaW5nIGZhY3RvcnMuXG5cdHBkdW0zID0gcm93WzFdLmNyb3NzKHJvd1syXSk7XG5cdGlmIChyb3dbMF0uZG90KHBkdW0zKSA8IDApIHtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuXHRcdFx0c2NhbGUueCAqPSAtMTtcblx0XHRcdHJvd1tpXS54ICo9IC0xO1xuXHRcdFx0cm93W2ldLnkgKj0gLTE7XG5cdFx0XHRyb3dbaV0ueiAqPSAtMTtcblx0XHR9XG5cdH1cblxuXHQvLyBOb3csIGdldCB0aGUgcm90YXRpb25zIG91dFxuXHQvLyBGUk9NIFczQ1xuXHRyb3RhdGUgPSBuZXcgVmVjdG9yNCgpO1xuXHRyb3RhdGUueCA9IDAuNSAqIE1hdGguc3FydChNYXRoLm1heCgxICsgcm93WzBdLnggLSByb3dbMV0ueSAtIHJvd1syXS56LCAwKSk7XG5cdHJvdGF0ZS55ID0gMC41ICogTWF0aC5zcXJ0KE1hdGgubWF4KDEgLSByb3dbMF0ueCArIHJvd1sxXS55IC0gcm93WzJdLnosIDApKTtcblx0cm90YXRlLnogPSAwLjUgKiBNYXRoLnNxcnQoTWF0aC5tYXgoMSAtIHJvd1swXS54IC0gcm93WzFdLnkgKyByb3dbMl0ueiwgMCkpO1xuXHRyb3RhdGUudyA9IDAuNSAqIE1hdGguc3FydChNYXRoLm1heCgxICsgcm93WzBdLnggKyByb3dbMV0ueSArIHJvd1syXS56LCAwKSk7XG5cblx0Ly8gaWYgKHJvd1syXS55ID4gcm93WzFdLnopIHJvdGF0ZVswXSA9IC1yb3RhdGVbMF07XG5cdC8vIGlmIChyb3dbMF0ueiA+IHJvd1syXS54KSByb3RhdGVbMV0gPSAtcm90YXRlWzFdO1xuXHQvLyBpZiAocm93WzFdLnggPiByb3dbMF0ueSkgcm90YXRlWzJdID0gLXJvdGF0ZVsyXTtcblxuXHQvLyBGUk9NIE1PUkYuSlNcblx0cm90YXRlLnkgPSBNYXRoLmFzaW4oLXJvd1swXS56KTtcblx0aWYgKE1hdGguY29zKHJvdGF0ZS55KSAhPT0gMCkge1xuXHRcdHJvdGF0ZS54ID0gTWF0aC5hdGFuMihyb3dbMV0ueiwgcm93WzJdLnopO1xuXHRcdHJvdGF0ZS56ID0gTWF0aC5hdGFuMihyb3dbMF0ueSwgcm93WzBdLngpO1xuXHR9IGVsc2Uge1xuXHRcdHJvdGF0ZS54ID0gTWF0aC5hdGFuMigtcm93WzJdLngsIHJvd1sxXS55KTtcblx0XHRyb3RhdGUueiA9IDA7XG5cdH1cblxuXHQvLyBGUk9NIGh0dHA6Ly9ibG9nLmJ3aGl0aW5nLmNvLnVrLz9wPTI2XG5cdC8vIHNjYWxlLngyID0gTWF0aC5zcXJ0KG1hdHJpeC5tMTEqbWF0cml4Lm0xMSArIG1hdHJpeC5tMjEqbWF0cml4Lm0yMSArIG1hdHJpeC5tMzEqbWF0cml4Lm0zMSk7XG5cdC8vIHNjYWxlLnkyID0gTWF0aC5zcXJ0KG1hdHJpeC5tMTIqbWF0cml4Lm0xMiArIG1hdHJpeC5tMjIqbWF0cml4Lm0yMiArIG1hdHJpeC5tMzIqbWF0cml4Lm0zMik7XG5cdC8vIHNjYWxlLnoyID0gTWF0aC5zcXJ0KG1hdHJpeC5tMTMqbWF0cml4Lm0xMyArIG1hdHJpeC5tMjMqbWF0cml4Lm0yMyArIG1hdHJpeC5tMzMqbWF0cml4Lm0zMyk7XG5cblx0Ly8gcm90YXRlLngyID0gTWF0aC5hdGFuMihtYXRyaXgubTIzL3NjYWxlLnoyLCBtYXRyaXgubTMzL3NjYWxlLnoyKTtcblx0Ly8gcm90YXRlLnkyID0gLU1hdGguYXNpbihtYXRyaXgubTEzL3NjYWxlLnoyKTtcblx0Ly8gcm90YXRlLnoyID0gTWF0aC5hdGFuMihtYXRyaXgubTEyL3NjYWxlLnkyLCBtYXRyaXgubTExL3NjYWxlLngyKTtcblxuXHRyZXR1cm4ge1xuXHRcdHBlcnNwZWN0aXZlLFxuXHRcdHRyYW5zbGF0ZSxcblx0XHRza2V3LFxuXHRcdHNjYWxlLFxuXHRcdHJvdGF0ZVxuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0ZGVjb21wb3NlLFxuXHRpc0FmZmluZSxcblx0aW52ZXJzZSxcblx0bXVsdGlwbHlcbn07IiwiY29uc3QgdmFsdWVUb09iamVjdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdGNvbnN0IHVuaXRzID0gLyhbXFwtXFwrXT9bMC05XStbXFwuMC05XSopKGRlZ3xyYWR8Z3JhZHxweHwlKSovO1xuXHRjb25zdCBwYXJ0cyA9IHZhbHVlLm1hdGNoKHVuaXRzKSB8fCBbXTtcblxuXHRyZXR1cm4ge1xuXHRcdHZhbHVlOiBwYXJzZUZsb2F0KHBhcnRzWzFdKSxcblx0XHR1bml0czogcGFydHNbMl0sXG5cdFx0dW5wYXJzZWQ6IHZhbHVlXG5cdH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0YXRlbWVudFRvT2JqZWN0KHN0YXRlbWVudCwgc2tpcFZhbHVlcykge1xuXHRjb25zdCBuYW1lQW5kQXJncyA9IC8oXFx3KylcXCgoW15cXCldKylcXCkvaTtcblx0Y29uc3Qgc3RhdGVtZW50UGFydHMgPSBzdGF0ZW1lbnQudG9TdHJpbmcoKS5tYXRjaChuYW1lQW5kQXJncykuc2xpY2UoMSk7XG5cdGNvbnN0IGZ1bmN0aW9uTmFtZSA9IHN0YXRlbWVudFBhcnRzWzBdO1xuXHRjb25zdCBzdHJpbmdWYWx1ZXMgPSBzdGF0ZW1lbnRQYXJ0c1sxXS5zcGxpdCgvLCA/Lyk7XG5cdGNvbnN0IHBhcnNlZFZhbHVlcyA9ICFza2lwVmFsdWVzICYmIHN0cmluZ1ZhbHVlcy5tYXAodmFsdWVUb09iamVjdCk7XG5cblx0cmV0dXJuIHtcblx0XHRrZXk6IGZ1bmN0aW9uTmFtZSxcblx0XHR2YWx1ZTogcGFyc2VkVmFsdWVzIHx8IHN0cmluZ1ZhbHVlcyxcblx0XHR1bnBhcnNlZDogc3RhdGVtZW50XG5cdH07XG59OyIsIi8qKlxuICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHZlY3RvclxuICogQHJldHVybnMge2Zsb2F0fVxuICovXG5mdW5jdGlvbiBsZW5ndGgodmVjdG9yKSB7XG5cdHJldHVybiBNYXRoLnNxcnQodmVjdG9yLnggKiB2ZWN0b3IueCArIHZlY3Rvci55ICogdmVjdG9yLnkgKyB2ZWN0b3IueiAqIHZlY3Rvci56KTtcbn1cblxuLyoqXG4gKiBHZXQgYSBub3JtYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqIEByZXR1cm5zIHtWZWN0b3I0fVxuICovXG5mdW5jdGlvbiBub3JtYWxpemUodmVjdG9yKSB7XG5cdGNvbnN0IGxlbiA9IGxlbmd0aCh2ZWN0b3IpO1xuXHRjb25zdCB2ID0gbmV3IHZlY3Rvci5jb25zdHJ1Y3Rvcih2ZWN0b3IueCAvIGxlbiwgdmVjdG9yLnkgLyBsZW4sIHZlY3Rvci56IC8gbGVuKTtcblxuXHRyZXR1cm4gdjtcbn1cblxuLyoqXG4gKiBWZWN0b3IgRG90LVByb2R1Y3RcbiAqIEBwYXJhbSB7VmVjdG9yNH0gdiBUaGUgc2Vjb25kIHZlY3RvciB0byBhcHBseSB0aGUgcHJvZHVjdCB0b1xuICogQHJldHVybnMge2Zsb2F0fSBUaGUgRG90LVByb2R1Y3Qgb2YgYSBhbmQgYi5cbiAqL1xuZnVuY3Rpb24gZG90KGEsIGIpIHtcblx0cmV0dXJuIGEueCAqIGIueCArIGEueSAqIGIueSArIGEueiAqIGIueiArIGEudyAqIGIudztcbn1cblxuLyoqXG4gKiBWZWN0b3IgQ3Jvc3MtUHJvZHVjdFxuICogQHBhcmFtIHtWZWN0b3I0fSB2IFRoZSBzZWNvbmQgdmVjdG9yIHRvIGFwcGx5IHRoZSBwcm9kdWN0IHRvXG4gKiBAcmV0dXJucyB7VmVjdG9yNH0gVGhlIENyb3NzLVByb2R1Y3Qgb2YgYSBhbmQgYi5cbiAqL1xuZnVuY3Rpb24gY3Jvc3MoYSwgYikge1xuXHRyZXR1cm4gbmV3IGEuY29uc3RydWN0b3IoXG5cdFx0KGEueSAqIGIueikgLSAoYS56ICogYi55KSxcblx0XHQoYS56ICogYi54KSAtIChhLnggKiBiLnopLFxuXHRcdChhLnggKiBiLnkpIC0gKGEueSAqIGIueClcblx0KTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gcmVxdWlyZWQgZm9yIG1hdHJpeCBkZWNvbXBvc2l0aW9uXG4gKiBBIEphdmFzY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgcHNldWRvIGNvZGUgYXZhaWxhYmxlIGZyb20gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy0yZC10cmFuc2Zvcm1zLyNtYXRyaXgtZGVjb21wb3NpdGlvblxuICogQHBhcmFtIHtWZWN0b3I0fSBhUG9pbnQgQSAzRCBwb2ludFxuICogQHBhcmFtIHtmbG9hdH0gYXNjbFxuICogQHBhcmFtIHtmbG9hdH0gYnNjbFxuICogQHJldHVybnMge1ZlY3RvcjR9XG4gKi9cbmZ1bmN0aW9uIGNvbWJpbmUoYVBvaW50LCBiUG9pbnQsIGFzY2wsIGJzY2wpIHtcblx0cmV0dXJuIG5ldyBhUG9pbnQuY29uc3RydWN0b3IoXG5cdFx0KGFzY2wgKiBhUG9pbnQueCkgKyAoYnNjbCAqIGJQb2ludC54KSxcblx0XHQoYXNjbCAqIGFQb2ludC55KSArIChic2NsICogYlBvaW50LnkpLFxuXHRcdChhc2NsICogYVBvaW50LnopICsgKGJzY2wgKiBiUG9pbnQueilcblx0KTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gIHtWZWN0b3I0fSB2ZWN0b3JcbiAqIEBwYXJhbSAge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtWZWN0b3I0fVxuICovXG5mdW5jdGlvbiBtdWx0aXBseUJ5TWF0cml4KHZlY3RvciwgbWF0cml4KSB7XG5cdHJldHVybiBuZXcgdmVjdG9yLmNvbnN0cnVjdG9yKFxuXHRcdChtYXRyaXgubTExICogdmVjdG9yLngpICsgKG1hdHJpeC5tMTIgKiB2ZWN0b3IueSkgKyAobWF0cml4Lm0xMyAqIHZlY3Rvci56KSxcblx0XHQobWF0cml4Lm0yMSAqIHZlY3Rvci54KSArIChtYXRyaXgubTIyICogdmVjdG9yLnkpICsgKG1hdHJpeC5tMjMgKiB2ZWN0b3IueiksXG5cdFx0KG1hdHJpeC5tMzEgKiB2ZWN0b3IueCkgKyAobWF0cml4Lm0zMiAqIHZlY3Rvci55KSArIChtYXRyaXgubTMzICogdmVjdG9yLnopXG5cdCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRsZW5ndGgsXG5cdG5vcm1hbGl6ZSxcblx0ZG90LFxuXHRjcm9zcyxcblx0Y29tYmluZSxcblx0bXVsdGlwbHlCeU1hdHJpeFxufTsiLCJsZXQgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbmNvbnN0IHNlbGVjdFByb3AgPSBmdW5jdGlvbihhcnIpIHtcblx0dmFyIGlkeCA9IGFyci5sZW5ndGg7XG5cdHdoaWxlIChpZHgtLSkge1xuXHRcdGlmIChkaXYuc3R5bGVbYXJyW2lkeF1dICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBhcnJbaWR4XTtcblx0XHR9XG5cdH1cblx0cmV0dXJuICcnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZWxlY3RQcm9wKFtcblx0J3RyYW5zZm9ybScsXG5cdCdtc1RyYW5zZm9ybScsXG5cdCdvVHJhbnNmb3JtJyxcblx0J21velRyYW5zZm9ybScsXG5cdCd3ZWJraXRUcmFuc2Zvcm0nXG5dKTtcblxuZGl2ID0gdW5kZWZpbmVkOyIsImNvbnN0IEVORF9WQUxVRSA9IDEwMDtcbmNvbnN0IFRPTEVSQU5DRSA9IDAuMDE7XG5jb25zdCBTUEVFRCA9IDEgLyA2MDtcblxuY29uc3QgY2FsY0FjY2VsZXJhdGlvbiA9IGZ1bmN0aW9uKHRlbnNpb24sIHgsIGZyaWN0aW9uLCB2ZWxvY2l0eSkge1xuXHRyZXR1cm4gLXRlbnNpb24gKiB4IC0gZnJpY3Rpb24gKiB2ZWxvY2l0eTtcbn07XG5cbmNvbnN0IGNhbGNTdGF0ZSA9IGZ1bmN0aW9uKHN0YXRlLCBzcGVlZCkge1xuXHRjb25zdCBkdCA9IHNwZWVkICogMC41O1xuXHRjb25zdCB4ID0gc3RhdGUueDtcblx0Y29uc3QgdmVsb2NpdHkgPSBzdGF0ZS52ZWxvY2l0eTtcblx0Y29uc3QgdGVuc2lvbiA9IHN0YXRlLnRlbnNpb247XG5cdGNvbnN0IGZyaWN0aW9uID0gc3RhdGUuZnJpY3Rpb247XG5cblx0Y29uc3QgYUR4ID0gdmVsb2NpdHk7XG5cdGNvbnN0IGFEdiA9IGNhbGNBY2NlbGVyYXRpb24odGVuc2lvbiwgeCwgZnJpY3Rpb24sIHZlbG9jaXR5KTtcblxuXHRjb25zdCBiRHggPSB2ZWxvY2l0eSArIGFEdiAqIGR0O1xuXHRjb25zdCBiRW5kWCA9IHggKyBhRHggKiBkdDtcblx0Y29uc3QgYkR2ID0gY2FsY0FjY2VsZXJhdGlvbih0ZW5zaW9uLCBiRW5kWCwgZnJpY3Rpb24sIGJEeCk7XG5cblx0Y29uc3QgY0R4ID0gdmVsb2NpdHkgKyBiRHYgKiBkdDtcblx0Y29uc3QgY0VuZFggPSB4ICsgYkR4ICogZHQ7XG5cdGNvbnN0IGNEdiA9IGNhbGNBY2NlbGVyYXRpb24odGVuc2lvbiwgY0VuZFgsIGZyaWN0aW9uLCBjRHgpO1xuXG5cdGNvbnN0IGREeCA9IHZlbG9jaXR5ICsgY0R2ICogZHQ7XG5cdGNvbnN0IGRFbmRYID0geCArIGNEeCAqIGR0O1xuXHRjb25zdCBkRHYgPSBjYWxjQWNjZWxlcmF0aW9uKHRlbnNpb24sIGRFbmRYLCBmcmljdGlvbiwgZER4KTtcblxuXHRjb25zdCBkeGR0ID0gKDEgLyA2KSAqIChhRHggKyAyICogKGJEeCArIGNEeCkgKyBkRHgpO1xuXHRjb25zdCBkdmR0ID0gKDEgLyA2KSAqIChhRHYgKyAyICogKGJEdiArIGNEdikgKyBkRHYpO1xuXG5cdHN0YXRlLnggPSB4ICsgZHhkdCAqIHNwZWVkO1xuXHRzdGF0ZS52ZWxvY2l0eSA9IGFEeCArIGR2ZHQgKiBzcGVlZDtcblxuXHRyZXR1cm4gc3RhdGU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNwcmluZygpIHtcblx0bGV0IHZlbG9jaXR5ID0gMDtcblx0bGV0IHRlbnNpb24gPSA4MDtcblx0bGV0IGZyaWN0aW9uID0gODtcblxuXHRsZXQgcmVwZWF0ID0gMDtcblx0bGV0IG9yaWdpbmFsVmVsb2NpdHkgPSAwO1xuXHRsZXQgb3JpZ2luYWxUZW5zaW9uID0gODA7XG5cdGxldCBvcmlnaW5hbEZyaWN0aW9uID0gODtcblx0bGV0IHZhbHVlID0gMDtcblx0bGV0IGlzUGF1c2VkID0gZmFsc2U7XG5cblx0Ly8gU3RvcmVzIHggYW5kIHZlbG9jaXR5IHRvIGRvXG5cdC8vIGNhbGN1bGF0aW9ucyBhZ2FpbnN0IHNvIHRoYXRcblx0Ly8gd2UgY2FuIGhhdmUgbXVsdGlwbGUgcmV0dXJuXG5cdC8vIHZhbHVlcyBmcm9tIGNhbGNTdGF0ZVxuXHRjb25zdCBzdGF0ZSA9IHt9O1xuXG5cdGxldCB1cGRhdGVDYWxsYmFjaztcblx0bGV0IGNvbXBsZXRlQ2FsbGJhY2s7XG5cdGxldCByZXZlcnNlQ2FsbGJhY2s7XG5cblx0cmV0dXJuIHtcblx0XHRyZWdpc3RlckNhbGxiYWNrcyhvYmopIHtcblx0XHRcdHVwZGF0ZUNhbGxiYWNrID0gb2JqLm9uVXBkYXRlO1xuXHRcdFx0Y29tcGxldGVDYWxsYmFjayA9IG9iai5vbkNvbXBsZXRlO1xuXHRcdFx0cmV2ZXJzZUNhbGxiYWNrID0gb2JqLm9uUmV2ZXJzZTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRyZXBlYXQodGltZXMpIHtcblx0XHRcdHJlcGVhdCA9IHRpbWVzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdHNldCh0LCBmLCB2KSB7XG5cdFx0XHRpZiAodiAhPT0gdW5kZWZpbmVkKSB7IHZlbG9jaXR5ID0gb3JpZ2luYWxWZWxvY2l0eSA9IHY7IH1cblx0XHRcdGlmICh0ICE9PSB1bmRlZmluZWQpIHsgdGVuc2lvbiA9IG9yaWdpbmFsVGVuc2lvbiA9IHQ7ICB9XG5cdFx0XHRpZiAoZiAhPT0gdW5kZWZpbmVkKSB7IGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbiA9IGY7IH1cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHR0ZW5zaW9uKHQpIHtcblx0XHRcdHRlbnNpb24gPSBvcmlnaW5hbFRlbnNpb24gPSB0O1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdGZyaWN0aW9uKGYpIHtcblx0XHRcdGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbiA9IGY7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXG5cdFx0dmVsb2NpdHkodikge1xuXHRcdFx0dmVsb2NpdHkgPSBvcmlnaW5hbFZlbG9jaXR5ID0gdjtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRwYXVzZSgpIHtcblx0XHRcdGlzUGF1c2VkID0gdHJ1ZTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRyZXN1bWUoKSB7XG5cdFx0XHRpc1BhdXNlZCA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblxuXHRcdHN0ZXAoKSB7XG5cdFx0XHRpZiAoaXNQYXVzZWQpIHsgcmV0dXJuIHRydWU7IH0gLy8gc2hvdWxkIHNldCBhZ2Fpbj9cblxuXHRcdFx0Y29uc3Qgc3RhdGVCZWZvcmUgPSBzdGF0ZTtcblxuXHRcdFx0c3RhdGVCZWZvcmUueCA9IHZhbHVlIC0gRU5EX1ZBTFVFO1xuXHRcdFx0c3RhdGVCZWZvcmUudmVsb2NpdHkgPSB2ZWxvY2l0eTtcblx0XHRcdHN0YXRlQmVmb3JlLnRlbnNpb24gPSB0ZW5zaW9uO1xuXHRcdFx0c3RhdGVCZWZvcmUuZnJpY3Rpb24gPSBmcmljdGlvbjtcblxuXHRcdFx0Y29uc3Qgc3RhdGVBZnRlciA9IGNhbGNTdGF0ZShzdGF0ZUJlZm9yZSwgU1BFRUQpO1xuXHRcdFx0Y29uc3QgZmluYWxWZWxvY2l0eSA9IHN0YXRlQWZ0ZXIudmVsb2NpdHk7XG5cdFx0XHRjb25zdCBuZXRGbG9hdCA9IHN0YXRlQWZ0ZXIueDtcblx0XHRcdGNvbnN0IG5ldDFEVmVsb2NpdHkgPSBzdGF0ZUFmdGVyLnZlbG9jaXR5O1xuXHRcdFx0Y29uc3QgbmV0VmFsdWVJc0xvdyA9IE1hdGguYWJzKG5ldEZsb2F0KSA8IFRPTEVSQU5DRTtcblx0XHRcdGNvbnN0IG5ldFZlbG9jaXR5SXNMb3cgPSBNYXRoLmFicyhuZXQxRFZlbG9jaXR5KSA8IFRPTEVSQU5DRTtcblx0XHRcdGNvbnN0IHNwcmluZ1Nob3VsZFN0b3AgPSBuZXRWYWx1ZUlzTG93IHx8IG5ldFZlbG9jaXR5SXNMb3c7XG5cblx0XHRcdHZhbHVlID0gRU5EX1ZBTFVFICsgc3RhdGVBZnRlci54O1xuXG5cdFx0XHRpZiAoc3ByaW5nU2hvdWxkU3RvcCkge1xuXG5cdFx0XHRcdHZlbG9jaXR5ID0gMDtcblx0XHRcdFx0dmFsdWUgPSBFTkRfVkFMVUU7XG5cblx0XHRcdFx0dXBkYXRlQ2FsbGJhY2sodmFsdWUgLyAxMDApO1xuXG5cdFx0XHRcdC8vIFNob3VsZCB3ZSByZXBlYXQ/XG5cdFx0XHRcdGlmIChyZXBlYXQgPiAwKSB7XG5cblx0XHRcdFx0XHQvLyBEZWNyZW1lbnQgdGhlIHJlcGVhdCBjb3VudGVyIChpZiBmaW5pdGUsXG5cdFx0XHRcdFx0Ly8gd2UgbWF5IGJlIGluIGFuIGluZmluaXRlIGxvb3ApXG5cdFx0XHRcdFx0aWYgKGlzRmluaXRlKHJlcGVhdCkpIHsgcmVwZWF0LS07IH1cblxuXHRcdFx0XHRcdHJldmVyc2VDYWxsYmFjaygpO1xuXHRcdFx0XHRcdHZlbG9jaXR5ID0gb3JpZ2luYWxWZWxvY2l0eTtcblx0XHRcdFx0XHR0ZW5zaW9uICA9IG9yaWdpbmFsVGVuc2lvbjtcblx0XHRcdFx0XHRmcmljdGlvbiA9IG9yaWdpbmFsRnJpY3Rpb247XG5cdFx0XHRcdFx0dmFsdWUgPSAwO1xuXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7IC8vIHNob3VsZCBzZXQgYWdhaW4/XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBPdGhlcndpc2UsIHdlJ3JlIGRvbmUgcmVwZWF0aW5nXG5cdFx0XHRcdGNvbXBsZXRlQ2FsbGJhY2soKTtcblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7IC8vIHNob3VsZCBzZXQgYWdhaW4/XG5cdFx0XHR9XG5cblx0XHRcdHZlbG9jaXR5ID0gZmluYWxWZWxvY2l0eTtcblx0XHRcdHVwZGF0ZUNhbGxiYWNrKHZhbHVlIC8gMTAwKTtcblx0XHRcdHJldHVybiB0cnVlOyAvLyBzaG91bGQgc2V0IGFnYWluP1xuXHRcdH0sXG5cblx0XHRzdG9wKCkge1xuXHRcdFx0dmVsb2NpdHkgPSBvcmlnaW5hbFZlbG9jaXR5O1xuXHRcdFx0dGVuc2lvbiA9IG9yaWdpbmFsVGVuc2lvbjtcblx0XHRcdGZyaWN0aW9uID0gb3JpZ2luYWxGcmljdGlvbjtcblx0XHRcdHZhbHVlID0gMDtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblx0fTtcbn07IiwiY29uc3QgTWF0cml4ID0gcmVxdWlyZSgnLi9tYXRyaXgnKTtcbmNvbnN0IHRyYW5zZm9ybVByb3AgPSByZXF1aXJlKCcuL3Byb3AnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIGVsZW1lbnQpIHtcblx0Y29uc3QgbWF0cml4ID0gKG5ldyBNYXRyaXgoKSkuY29tcG9zZShvYmopO1xuXHRlbGVtZW50LnN0eWxlW3RyYW5zZm9ybVByb3BdID0gbWF0cml4LnRvU3RyaW5nKCk7XG59OyIsImNvbnN0IE1hdHJpeCA9IHJlcXVpcmUoJy4uL21hdHJpeCcpO1xuY29uc3QgdHJhbnNmb3JtUHJvcCA9IHJlcXVpcmUoJy4uL3Byb3AnKTtcblxuY29uc3QgZ2V0Q29tcHV0ZWRTdHlsZSA9IGZ1bmN0aW9uKGVsZW0pIHtcblx0cmV0dXJuIGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG59O1xuXG5jb25zdCBkZWNvbXBvc2UgPSBmdW5jdGlvbihtYXRyaXgpIHtcblx0Y29uc3QgY29tcG9zaXRpb24gPSBtYXRyaXguZGVjb21wb3NlKCk7XG5cdGNvbnN0IHsgcm90YXRlLCBzY2FsZSwgc2tldywgdHJhbnNsYXRlIH0gPSBjb21wb3NpdGlvbjtcblxuXHRyZXR1cm4ge1xuXHRcdHg6IHRyYW5zbGF0ZS54LFxuXHRcdHk6IHRyYW5zbGF0ZS55LFxuXHRcdHo6IHRyYW5zbGF0ZS56LFxuXG5cdFx0c2NhbGVYOiBzY2FsZS54LFxuXHRcdHNjYWxlWTogc2NhbGUueSxcblx0XHRzY2FsZVo6IHNjYWxlLnosXG5cblx0XHRza2V3WDogc2tldy54LFxuXHRcdHNrZXdZOiBza2V3LnksXG5cblx0XHRyb3RhdGVYOiByb3RhdGUueCxcblx0XHRyb3RhdGVZOiByb3RhdGUueSxcblx0XHRyb3RhdGVaOiByb3RhdGUuelxuXHR9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHN0eWxlKGVsZW0pIHtcblx0XHRjb25zdCBjb21wdXRlZFN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG5cdFx0Y29uc3QgdHJhbnNmb3JtID0gY29tcHV0ZWRTdHlsZXNbdHJhbnNmb3JtUHJvcF07XG5cdFx0aWYgKCF0cmFuc2Zvcm0gfHwgdHJhbnNmb3JtID09PSAnbm9uZScpIHsgcmV0dXJuIGRlY29tcG9zZShuZXcgTWF0cml4KCkpOyB9XG5cblx0XHRjb25zdCBtYXRyaXggPSBuZXcgTWF0cml4KHRyYW5zZm9ybSk7XG5cdFx0cmV0dXJuIGRlY29tcG9zZShtYXRyaXgpO1xuXHR9LFxuXG5cdG9iaihvYmopIHtcblx0XHRjb25zdCBtYXRyaXggPSBuZXcgTWF0cml4KCk7XG5cdFx0Y29uc3QgY29tcG9zaXRpb24gPSBtYXRyaXguY29tcG9zZShvYmopO1xuXHRcdHJldHVybiBkZWNvbXBvc2UoY29tcG9zaXRpb24pO1xuXHR9XG59OyIsIi8qXG5cdHZhciBNQVRSSVggPSB7XG5cdFx0eDogMCxcblx0XHR5OiAwLFxuXHRcdHo6IDAsXG5cdFx0c2NhbGVYOiAxLFxuXHRcdHNjYWxlWTogMSxcblx0XHRzY2FsZVo6IDEsXG5cdFx0cm90YXRpb25YOiAwLFxuXHRcdHJvdGF0aW9uWTogMCxcblx0XHRyb3RhdGlvblo6IDBcblx0fTtcbiovXG5cbmNvbnN0IGV4cGFuZCA9IGZ1bmN0aW9uKG9iaikge1xuXHRpZiAob2JqLnNjYWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRvYmouc2NhbGVYID0gb2JqLnNjYWxlO1xuXHRcdG9iai5zY2FsZVkgPSBvYmouc2NhbGU7XG5cdFx0ZGVsZXRlIG9iai5zY2FsZTtcblx0fVxuXG5cdGlmIChvYmoucm90YXRlICE9PSB1bmRlZmluZWQpIHtcblx0XHRvYmoucm90YXRlWiA9IG9iai5yb3RhdGU7XG5cdFx0ZGVsZXRlIG9iai5yb3RhdGU7XG5cdH1cblxuXHRpZiAob2JqLnJvdGF0aW9uICE9PSB1bmRlZmluZWQpIHtcblx0XHRvYmoucm90YXRlWiA9IG9iai5yb3RhdGlvbjtcblx0XHRkZWxldGUgb2JqLnJvdGF0aW9uO1xuXHR9XG5cblx0cmV0dXJuIG9iajtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqID0+ICFvYmogPyBvYmogOiBleHBhbmQob2JqKTtcbiIsImNvbnN0IGlzRWxlbWVudCA9IHJlcXVpcmUoJy4vaXNFbGVtZW50Jyk7XG5jb25zdCBiYXNlciA9IHJlcXVpcmUoJy4vYmFzZXInKTtcbmNvbnN0IGV4cGFuZFNob3J0aGFuZCA9IHJlcXVpcmUoJy4vZXhwYW5kU2hvcnRoYW5kJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWF0cml4KGluaXRpYWwpIHtcblx0bGV0IGluaXQgPSBpbml0aWFsO1xuXG5cdGxldCBiYXNlO1xuXHRsZXQgeW95bztcblx0bGV0IGZyb207XG5cdGxldCB0bztcblx0bGV0IHJlcGVhdDtcblxuXHRyZXR1cm4ge1xuXHRcdHZhbHVlKCkge1xuXHRcdFx0cmV0dXJuIGJhc2U7XG5cdFx0fSxcblxuXHRcdHlveW8oYm9vbCkge1xuXHRcdFx0eW95byA9IGJvb2w7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXG5cdFx0ZnJvbShmKSB7XG5cdFx0XHRpbml0ID0gZjtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHR0byh0KSB7XG5cdFx0XHR0byA9IGV4cGFuZFNob3J0aGFuZCh0KTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHR1cGRhdGUocGVyYykge1xuXHRcdFx0Zm9yIChsZXQgcHJvcGVydHkgaW4gdG8pIHtcblx0XHRcdFx0bGV0IHN0YXJ0ID0gZnJvbVtwcm9wZXJ0eV0gfHwgMDtcblx0XHRcdFx0bGV0IGVuZCA9IHRvW3Byb3BlcnR5XTtcblxuXHRcdFx0XHRiYXNlW3Byb3BlcnR5XSA9IHN0YXJ0ICsgKGVuZCAtIHN0YXJ0KSAqIHBlcmM7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cblx0XHRyZXZlcnNlKCkge1xuXHRcdFx0dmFyIHRtcDtcblxuXHRcdFx0Ly8gcmVhc3NpZ24gc3RhcnRpbmcgdmFsdWVzXG5cdFx0XHRmb3IgKGxldCBwcm9wZXJ0eSBpbiByZXBlYXQpIHtcblx0XHRcdFx0aWYgKHlveW8pIHtcblx0XHRcdFx0XHR0bXAgPSByZXBlYXRbcHJvcGVydHldO1xuXHRcdFx0XHRcdHJlcGVhdFtwcm9wZXJ0eV0gPSB0b1twcm9wZXJ0eV07XG5cdFx0XHRcdFx0dG9bcHJvcGVydHldID0gdG1wO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZnJvbVtwcm9wZXJ0eV0gPSByZXBlYXRbcHJvcGVydHldO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXG5cdFx0c3RhcnQoKSB7XG5cdFx0XHRpZiAoIXRvKSB7IHJldHVybiB0aGlzOyB9XG5cdFx0XHRpZiAoIWJhc2UpIHsgYmFzZSA9IGlzRWxlbWVudChpbml0KSA/IGJhc2VyLnN0eWxlKGluaXQpIDogYmFzZXIub2JqKGV4cGFuZFNob3J0aGFuZChpbml0KSk7IH1cblx0XHRcdGlmICghZnJvbSkgeyBmcm9tID0ge307IH1cblx0XHRcdGlmICghcmVwZWF0KSB7IHJlcGVhdCA9IHt9OyB9XG5cblx0XHRcdGZvciAobGV0IHByb3BlcnR5IGluIHRvKSB7XG5cdFx0XHRcdC8vIG9taXQgdW5jaGFuZ2VkIHByb3BlcnRpZXNcblx0XHRcdFx0aWYgKGJhc2VbcHJvcGVydHldID09PSB1bmRlZmluZWQgfHwgdG9bcHJvcGVydHldID09PSBiYXNlW3Byb3BlcnR5XSkge1xuXHRcdFx0XHRcdGRlbGV0ZSB0b1twcm9wZXJ0eV07XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmcm9tW3Byb3BlcnR5XSA9IGJhc2VbcHJvcGVydHldO1xuXHRcdFx0XHRyZXBlYXRbcHJvcGVydHldID0gZnJvbVtwcm9wZXJ0eV0gfHwgMDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXHR9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IG9iaiA9PiAhIShvYmogJiYgK29iai5ub2RlVHlwZSA9PT0gb2JqLm5vZGVUeXBlKTtcbiJdfQ==
