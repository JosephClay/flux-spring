(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.flux = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Encapsulates the functionality of an animation.
 * Constructs and tears down the matrix, the spring
 * and the loop. Acts as the interface to the user for
 * configuration.
 */

const loop = require('./loop');
const transformer = require('./transformer');
const spr = require('./spring');

module.exports = function animation(obj) {
	const api = {};
	const matrix = transformer(obj);
	const events = {};
	const spring = spr();

	let playing = false;
	let startTime = 0;
	let delayTime = 0;

	const start = function() {
		spring.registerCallbacks({
			onUpdate(perc) {
				matrix.update(perc);
				api.trigger('update', matrix.value(), obj);
			},
			onReverse() {
				matrix.reverse();
			},
			onComplete() {
				api.stop().trigger('complete');
			}
		});

		matrix.start();
		loop.add(spring);
	};

	return Object.assign(api, {
		from(from) {
			matrix.from(from);
			return api;
		},

		to(to) {
			matrix.to(to);
			return api;
		},

		set(tension, friction, velocity) {
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

		tension(tension) {
			spring.tension(+tension);
			return api;
		},

		friction(friction) {
			spring.friction(+friction);
			return api;
		},

		velocity(velocity) {
			spring.velocity(+velocity);
			return api;
		},

		on(name, fn) {
			const arr = events[name] || (events[name] = []);
			arr.push(fn);
			return api;
		},

		off(name, fn) {
			const arr = events[name];
			if (!arr || !arr.length) { return api; }

			let idx = arr.indexOf(fn);
			if (idx !== -1) {
				arr.splice(idx, 1);
			}

			return api;
		},

		trigger(name, a, b) {
			const arr = events[name];
			if (!arr || !arr.length) { return api; }

			for (let idx = 0; idx < arr.length; idx++) {
				arr[idx](a, b);
			}

			return api;
		},

		delay(amount) {
			delayTime = amount;
			return api;
		},

		repeat(repeat) {
			spring.repeat(repeat);
			return api;
		},

		yoyo(yoyo) {
			if (!arguments.length) { yoyo = true; }
			matrix.yoyo(!!yoyo);
			return api;
		},

		start(time) {
			startTime = time || loop.now;
			loop.await(time => {
				if (time < (startTime + delayTime)) {
					return true; // should continue to wait
				}
				playing = true;
				api.trigger('start');
				start(time);
				return false; // should continue to wait
			});

			return api;
		},

		pause(time) {
			time = time || loop.now;
			spring.pause(time);
			return api;
		},

		resume(time) {
			time = time || loop.now;
			spring.resume(time);
			return api;
		},

		stop() {
			if (!playing) { return api; }
			playing = false;
			loop.remove(spring);
			spring.stop();
			api.trigger('stop');
			return api;
		}
	});
};
},{"./loop":3,"./spring":11,"./transformer":15}],2:[function(require,module,exports){
const loop = require('./loop');
const prop = require('./prop');
const animation = require('./animation');
const transform = require('./transform');
const plugins = {};

/**
 * The public api
 */
module.exports = Object.assign(function(obj) {
	return Object.assign(animation(obj), plugins);
}, {
	prop,
	transform,
	tick: loop.update,
	update: loop.update,
	plugin(name, fn) {
		plugins[name] = function() {
			fn.apply(this, arguments);
			return this;
		};
		return this;
	}
});
},{"./animation":1,"./loop":3,"./prop":10,"./transform":12}],3:[function(require,module,exports){
const waiting    = [];
const animations = [];

module.exports = {
	now: Date.now(),

	await(fn) {
		waiting.push(fn);
	},

	add(fn) {
		animations.push(fn);
	},

	remove(fn) {
		let idx = animations.indexOf(fn);
		if (idx !== -1) {
			animations.splice(idx, 1);
		}
	},

	update() {
		const time = this.now = Date.now();

		if (waiting.length === 0 && animations.length === 0) {
			return;
		}

		let idx = 0;
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
const vector = require('./vector');

/**
 * A 4 dimensional vector
 * @constructor
 */
const Vector4 = module.exports = function Vector4(x, y, z, w) {
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
	checkValues() {
		this.x = this.x || 0;
		this.y = this.y || 0;
		this.z = this.z || 0;
		this.w = this.w || 0;
	},

	/**
	 * Get the length of the vector
	 * @returns {float}
	 */
	length() {
		this.checkValues();
		return vector.length(this);
	},

	/**
	 * Get a normalised representation of the vector
	 * @returns {Vector4}
	 */
	normalize() {
		return vector.normalize(this);
	},

	/**
	 * Vector Dot-Product
	 * @param {Vector4} v The second vector to apply the product to
	 * @returns {float} The Dot-Product of this and v.
	 */
	dot(v) {
		return vector.dot(this, v);
	},

	/**
	 * Vector Cross-Product
	 * @param {Vector4} v The second vector to apply the product to
	 * @returns {Vector4} The Cross-Product of this and v.
	 */
	cross(v) {
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
	combine(bPoint, ascl, bscl) {
		return vector.combine(this, bPoint, ascl, bscl);
	},

	multiplyByMatrix (matrix) {
		return vector.multiplyByMatrix(this, matrix);
	}
};
},{"./vector":9}],5:[function(require,module,exports){
/**
 *  Converts angles in degrees, which are used by the external API, to angles
 *  in radians used in internal calculations.
 *  @param {number} angle - An angle in degrees.
 *  @returns {number} radians
 */
module.exports = angle => angle * Math.PI / 180;

},{}],6:[function(require,module,exports){
const deg2rad = require('./deg2rad');
const matrix = require('./static');
const transp = require('./transp');

// ASCII char 97 == 'a'
const indexToKey2d = index => String.fromCharCode(index + 97);

const indexToKey3d = index => ('m' + (Math.floor(index / 4) + 1)) + (index % 4 + 1);

const points2d = [
	'm11', // a
	'm12', // b
	'm21', // c
	'm22', // d
	'm41', // e
	'm42'  // f
];

const points3d = [
	'm11', 'm12', 'm13', 'm14',
	'm21', 'm22', 'm23', 'm24',
	'm31', 'm32', 'm33', 'm34',
	'm41', 'm42', 'm43', 'm44'
];

const lookupToFixed = function(p) {
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
const XCSSMatrix = module.exports = function XCSSMatrix(str) {
	this.m11 = this.m22 = this.m33 = this.m44 = 1;
               this.m12 = this.m13 = this.m14 =
	this.m21 =            this.m23 = this.m24 =
	this.m31 = this.m32 =            this.m34 =
	this.m41 = this.m42 = this.m43            = 0;

	this.setMatrixValue(str);
};

XCSSMatrix.prototype = {
	constructor: XCSSMatrix,

	/**
	 *  Multiply one matrix by another
	 *  @param {XCSSMatrix} otherMatrix - The matrix to multiply this one by.
	 */
	multiply(otherMatrix) {
		return matrix.multiply(this, otherMatrix);
	},

	/**
	 *  If the matrix is invertible, returns its inverse, otherwise returns null.
	 *  @returns {XCSSMatrix|null}
	 */
	inverse() {
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
	rotate(rx, ry, rz) {
		if (rx === undefined) { rx = 0; }

		if (ry === undefined &&
			rz === undefined) {
			rz = rx;
			rx = 0;
			ry = 0;
		}

		if (ry === undefined) { ry = 0; }
		if (rz === undefined) { rz = 0; }

		rx = deg2rad(rx);
		ry = deg2rad(ry);
		rz = deg2rad(rz);

		const tx = new XCSSMatrix();
		const ty = new XCSSMatrix();
		const tz = new XCSSMatrix();
		let sinA, cosA, sq;

		rz /= 2;
		sinA  = Math.sin(rz);
		cosA  = Math.cos(rz);
		sq = sinA * sinA;

		// Matrices are identity outside the assigned values
		tz.m11 = tz.m22 = 1 - 2 * sq;
		tz.m12 = tz.m21 = 2 * sinA * cosA;
		tz.m21 *= -1;

		ry /= 2;
		sinA  = Math.sin(ry);
		cosA  = Math.cos(ry);
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

		const identityMatrix = new XCSSMatrix(); // returns identity matrix by default
		const isIdentity = this.toString() === identityMatrix.toString();
		const rotatedMatrix = isIdentity ?
			tz.multiply(ty).multiply(tx) :
			this.multiply(tx).multiply(ty).multiply(tz);

		return rotatedMatrix;
	},

	/**
	 *  Returns the result of scaling the matrix by a given vector.
	 *  @param {number} scaleX - the scaling factor in the x axis.
	 *  @param {number} scaleY - the scaling factor in the y axis. If undefined, the x component is used.
	 *  @param {number} scaleZ - the scaling factor in the z axis. If undefined, 1 is used.
	 *  @returns XCSSMatrix
	 */
	scale(scaleX, scaleY, scaleZ) {
		const transform = new XCSSMatrix();

		if (scaleX === undefined) { scaleX = 1; }
		if (scaleY === undefined) { scaleY = scaleX; }
		if (!scaleZ) { scaleZ = 1; }

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
	skewX(degrees) {
		const radians   = deg2rad(degrees);
		const transform = new XCSSMatrix();

		transform.c = Math.tan(radians);

		return this.multiply(transform);
	},

	/**
	 *  Returns the result of skewing the matrix by a given vector.
	 *  @param {number} skewY - the scaling factor in the x axis.
	 *  @returns XCSSMatrix
	 */
	skewY(degrees) {
		const radians   = deg2rad(degrees);
		const transform = new XCSSMatrix();

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
	translate(x, y, z) {
		const t = new XCSSMatrix();

		if (x === undefined) { x = 0; }
		if (y === undefined) { y = 0; }
		if (z === undefined) { z = 0; }

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
	setMatrixValue(domstr) {
		if (!domstr) { return; }

		var matrixObject = transp(domstr);
		if (!matrixObject) { return; }

		var is3d   = matrixObject.key === 'matrix3d';
		var keygen = is3d ? indexToKey3d : indexToKey2d;
		var values = matrixObject.value;
		var count  = values.length;

		if ((is3d && count !== 16) || !(is3d || count === 6)) { return; }

		values.forEach(function(obj, idx) {
			var key = keygen(idx);
			this[key] = obj.value;
		}, this);
	},

	decompose() {
		return matrix.decompose(this);
	},

	compose({
		x, y, z,
		rotateX, rotateY, rotateZ,
		scaleX, scaleY, scaleZ,
		skewX, skewY
	}) {
		let m = this;
		m = m.translate(x, y, z);
		m = m.rotate(rotateX, rotateY, rotateZ);
		m = m.scale(scaleX, scaleY, scaleZ);
		if (skewX !== undefined) { m = m.skewX(skewX); }
		if (skewY !== undefined) { m = m.skewY(skewY); }

		return m;
	},

	/**
	 *  Returns a string representation of the matrix.
	 *  @returns {string} matrixString - a string like `matrix(1.000000, 0.000000, 0.000000, 1.000000, 0.000000, 0.000000)`
	 *
	 **/
	toString() {
		let points, prefix;

		if (matrix.isAffine(this)) {
			prefix = 'matrix';
			points = points2d;
		} else {
			prefix = 'matrix3d';
			points = points3d;
		}

		return `${prefix}(${points.map(lookupToFixed, this).join(', ')})`;
	}
};
},{"./deg2rad":5,"./static":7,"./transp":8}],7:[function(require,module,exports){
const Vector4 = require('./Vector4');

/**
 *  Calculates the determinant of a 2x2 matrix.
 *  @param {number} a - Top-left value of the matrix.
 *  @param {number} b - Top-right value of the matrix.
 *  @param {number} c - Bottom-left value of the matrix.
 *  @param {number} d - Bottom-right value of the matrix.
 *  @returns {number}
 */
const determinant2x2 = function(a, b, c, d) {
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
const determinant3x3 = function(a1, a2, a3, b1, b2, b3, c1, c2, c3) {
	return a1 * determinant2x2(b2, b3, c2, c3) -
		b1 * determinant2x2(a2, a3, c2, c3) +
		c1 * determinant2x2(a2, a3, b2, b3);
};

/**
 *  Calculates the determinant of a 4x4 matrix.
 *  @param {XCSSMatrix} matrix - The matrix to calculate the determinant of.
 *  @returns {number}
 */
const determinant4x4 = function(matrix) {
	let m = matrix,
		// Assign to individual variable names to aid selecting correct elements
		a1 = m.m11, b1 = m.m21, c1 = m.m31, d1 = m.m41,
		a2 = m.m12, b2 = m.m22, c2 = m.m32, d2 = m.m42,
		a3 = m.m13, b3 = m.m23, c3 = m.m33, d3 = m.m43,
		a4 = m.m14, b4 = m.m24, c4 = m.m34, d4 = m.m44;

	return a1 * determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4) -
		b1 * determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4) +
		c1 * determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4) -
		d1 * determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
};

/**
 *  Determines whether the matrix is affine.
 *  @returns {boolean}
 */
const isAffine = function(m) {
	return m.m13 === 0 && m.m14 === 0 &&
		m.m23 === 0 && m.m24 === 0 &&
		m.m31 === 0 && m.m32 === 0 &&
		m.m33 === 1 && m.m34 === 0 &&
		m.m43 === 0 && m.m44 === 1;
};

/**
 *  Returns whether the matrix is the identity matrix or a translation matrix.
 *  @return {boolean}
 */
const isIdentityOrTranslation = function(m) {
	return m.m11 === 1 && m.m12 === 0 && m.m13 === 0 && m.m14 === 0 &&
		m.m21 === 0 && m.m22 === 1 && m.m23 === 0 && m.m24 === 0 &&
		m.m31 === 0 && m.m31 === 0 && m.m33 === 1 && m.m34 === 0 &&
		// m41, m42 and m43 are the translation points
		m.m44 === 1;
};

/**
 *  Returns the adjoint matrix.
 *  @return {XCSSMatrix}
 */
const adjoint = function(m) {
	// make `result` the same type as the given metric
	const result = new m.constructor();
	let a1 = m.m11, b1 = m.m12, c1 = m.m13, d1 = m.m14;
	let a2 = m.m21, b2 = m.m22, c2 = m.m23, d2 = m.m24;
	let a3 = m.m31, b3 = m.m32, c3 = m.m33, d3 = m.m34;
	let a4 = m.m41, b4 = m.m42, c4 = m.m43, d4 = m.m44;

	// Row column labeling reversed since we transpose rows & columns
	result.m11 =  determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
	result.m21 = -determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
	result.m31 =  determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
	result.m41 = -determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);

	result.m12 = -determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
	result.m22 =  determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
	result.m32 = -determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
	result.m42 =  determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);

	result.m13 =  determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
	result.m23 = -determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
	result.m33 =  determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
	result.m43 = -determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);

	result.m14 = -determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
	result.m24 =  determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
	result.m34 = -determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
	result.m44 =  determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);

	return result;
};

const inverse = function(matrix) {
	let inv;

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
	const result = adjoint(matrix);

	// Calculate the 4x4 determinant
	const det = determinant4x4(matrix);

	// If the determinant is zero, then the inverse matrix is not unique
	if (Math.abs(det) < 1e-8) { return null; }

	// Scale the adjoint matrix to get the inverse
	for (let idx = 1; idx < 5; idx++) {
		for (let i = 1; i < 5; i++) {
			result[('m' + idx) + i] /= det;
		}
	}

	return result;
};

const multiply = function(matrix, otherMatrix) {
	if (!otherMatrix) { return null; }

	let a = otherMatrix;
	let b = matrix;
	let c = new matrix.constructor();

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
	var rows = 4, cols = 4;
	var i = cols, j;
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
	let perspectiveMatrix;
	let rightHandSide;
	let inversePerspectiveMatrix;
	let transposedInversePerspectiveMatrix;
	let perspective;
	let translate;
	let row;
	let i;
	let len;
	let scale;
	let skew;
	let pdum3;
	let rotate;

	// Normalize the matrix.
	if (matrix.m33 === 0) { return false; }

	for (let i = 1; i <= 4; i++) {
		for (let j = 1; j < 4; j++) {
			matrix['m' + i + j] /= matrix.m44;
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
	}
	else {
		// No perspective.
		perspective = new Vector4(0, 0, 0, 1);
	}

	// Next take care of translation
	// If it's a 2D matrix, e and f will be filled
	translate = new Vector4(matrix.e || matrix.m41, matrix.f || matrix.m42, matrix.m43);

	// Now get scale and shear. 'row' is a 3 element array of 3 component vectors
	row = [ new Vector4(), new Vector4(), new Vector4() ];
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
	skew.y = (skew.y / scale.z) || 0;
	skew.z = (skew.z / scale.z) || 0;

	// At this point, the matrix (in rows) is orthonormal.
	// Check for a coordinate system flip.  If the determinant
	// is -1, then negate the matrix and the scaling factors.
	pdum3 = row[1].cross(row[2]);
	if (row[0].dot(pdum3) < 0) {
		for (let i = 0; i < 3; i++) {
			scale.x *= -1;
			row[i].x *= -1;
			row[i].y *= -1;
			row[i].z *= -1;
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
		perspective,
		translate,
		skew,
		scale,
		rotate
	};
}

module.exports = {
	decompose,
	isAffine,
	inverse,
	multiply
};
},{"./Vector4":4}],8:[function(require,module,exports){
/**
 * Parses a DOM string into values usable by matrix
 * `static.js` functions to contruct a true Matrix.
 */

const valueToObject = function(value) {
	const units = /([\-\+]?[0-9]+[\.0-9]*)(deg|rad|grad|px|%)*/;
	const parts = value.match(units) || [];

	return {
		value: parseFloat(parts[1]),
		units: parts[2],
		unparsed: value
	};
};

module.exports = function statementToObject(statement, skipValues) {
	const nameAndArgs = /(\w+)\(([^\)]+)\)/i;
	const statementParts = statement.toString().match(nameAndArgs).slice(1);
	const functionName = statementParts[0];
	const stringValues = statementParts[1].split(/, ?/);
	const parsedValues = !skipValues && stringValues.map(valueToObject);

	return {
		key: functionName,
		value: parsedValues || stringValues,
		unparsed: statement
	};
};
},{}],9:[function(require,module,exports){
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
	const len = length(vector);
	const v = new vector.constructor(vector.x / len, vector.y / len, vector.z / len);

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
	return new a.constructor(
		(a.y * b.z) - (a.z * b.y),
		(a.z * b.x) - (a.x * b.z),
		(a.x * b.y) - (a.y * b.x)
	);
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
	return new aPoint.constructor(
		(ascl * aPoint.x) + (bscl * bPoint.x),
		(ascl * aPoint.y) + (bscl * bPoint.y),
		(ascl * aPoint.z) + (bscl * bPoint.z)
	);
}

/**
 * @param  {Vector4} vector
 * @param  {Matrix} matrix
 * @return {Vector4}
 */
function multiplyByMatrix(vector, matrix) {
	return new vector.constructor(
		(matrix.m11 * vector.x) + (matrix.m12 * vector.y) + (matrix.m13 * vector.z),
		(matrix.m21 * vector.x) + (matrix.m22 * vector.y) + (matrix.m23 * vector.z),
		(matrix.m31 * vector.x) + (matrix.m32 * vector.y) + (matrix.m33 * vector.z)
	);
}

module.exports = {
	length,
	normalize,
	dot,
	cross,
	combine,
	multiplyByMatrix
};
},{}],10:[function(require,module,exports){
let div = document.createElement('div');

const selectProp = function(arr) {
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
module.exports = selectProp([
	'transform',
	'msTransform',
	'oTransform',
	'mozTransform',
	'webkitTransform'
]);

// cleanup div
div = undefined;
},{}],11:[function(require,module,exports){
/**
 * Encapsulates the functionality of a spring,
 * calculating state based off of tension, friction
 * and velocity. Implemented by `animation.js`
 */

const END_VALUE = 100;
const TOLERANCE = 0.01;
const SPEED = 1 / 60;

const calcAcceleration = function(tension, x, friction, velocity) {
	return -tension * x - friction * velocity;
};

const calcState = function(state, speed) {
	const dt = speed * 0.5;
	const x = state.x;
	const velocity = state.velocity;
	const tension = state.tension;
	const friction = state.friction;

	const aDx = velocity;
	const aDv = calcAcceleration(tension, x, friction, velocity);

	const bDx = velocity + aDv * dt;
	const bEndX = x + aDx * dt;
	const bDv = calcAcceleration(tension, bEndX, friction, bDx);

	const cDx = velocity + bDv * dt;
	const cEndX = x + bDx * dt;
	const cDv = calcAcceleration(tension, cEndX, friction, cDx);

	const dDx = velocity + cDv * dt;
	const dEndX = x + cDx * dt;
	const dDv = calcAcceleration(tension, dEndX, friction, dDx);

	const dxdt = (1 / 6) * (aDx + 2 * (bDx + cDx) + dDx);
	const dvdt = (1 / 6) * (aDv + 2 * (bDv + cDv) + dDv);

	state.x = x + dxdt * speed;
	state.velocity = aDx + dvdt * speed;

	return state;
};

module.exports = function spring() {
	let velocity = 0;
	let tension = 80;
	let friction = 8;

	let repeat = 0;
	let originalVelocity = 0;
	let originalTension = 80;
	let originalFriction = 8;
	let value = 0;
	let isPaused = false;

	// Stores x and velocity to do
	// calculations against so that
	// we can have multiple return
	// values from calcState
	const state = {};

	let updateCallback;
	let completeCallback;
	let reverseCallback;

	return {
		registerCallbacks(obj) {
			updateCallback = obj.onUpdate;
			completeCallback = obj.onComplete;
			reverseCallback = obj.onReverse;
			return this;
		},

		repeat(times) {
			repeat = times;
			return this;
		},

		set(t, f, v) {
			if (v !== undefined) { velocity = originalVelocity = v; }
			if (t !== undefined) { tension = originalTension = t;  }
			if (f !== undefined) { friction = originalFriction = f; }
			return this;
		},

		tension(t) {
			tension = originalTension = t;
			return this;
		},

		friction(f) {
			friction = originalFriction = f;
			return this;
		},

		velocity(v) {
			velocity = originalVelocity = v;
			return this;
		},

		pause() {
			isPaused = true;
			return this;
		},

		resume() {
			isPaused = false;
			return this;
		},

		step() {
			if (isPaused) { return true; } // should set again?

			const stateBefore = state;

			stateBefore.x = value - END_VALUE;
			stateBefore.velocity = velocity;
			stateBefore.tension = tension;
			stateBefore.friction = friction;

			const stateAfter = calcState(stateBefore, SPEED);
			const finalVelocity = stateAfter.velocity;
			const netFloat = stateAfter.x;
			const net1DVelocity = stateAfter.velocity;
			const netValueIsLow = Math.abs(netFloat) < TOLERANCE;
			const netVelocityIsLow = Math.abs(net1DVelocity) < TOLERANCE;
			const springShouldStop = netValueIsLow || netVelocityIsLow;

			value = END_VALUE + stateAfter.x;

			if (springShouldStop) {

				velocity = 0;
				value = END_VALUE;

				updateCallback(value / 100);

				// Should we repeat?
				if (repeat > 0) {

					// Decrement the repeat counter (if finite,
					// we may be in an infinite loop)
					if (isFinite(repeat)) { repeat--; }

					reverseCallback();
					velocity = originalVelocity;
					tension  = originalTension;
					friction = originalFriction;
					value = 0;

					return true; // should set again?
				}

				// Otherwise, we're done repeating
				completeCallback();

				return false; // should set again?
			}

			velocity = finalVelocity;
			updateCallback(value / 100);
			return true; // should set again?
		},

		stop() {
			velocity = originalVelocity;
			tension = originalTension;
			friction = originalFriction;
			value = 0;
			return this;
		}
	};
};
},{}],12:[function(require,module,exports){
const Matrix = require('./matrix');
const transformProp = require('./prop');

module.exports = function(obj, element) {
	const matrix = (new Matrix()).compose(obj);
	element.style[transformProp] = matrix.toString();
};
},{"./matrix":6,"./prop":10}],13:[function(require,module,exports){
/**
 * Helps "base" a matrix POJO off of either an element
 * or another POJO. Acts as a normalizer between the two
 * ways to pass arguments to flux-spring:
 * - spring(element)
 * - spring({...})
 */

const Matrix = require('../matrix');
const transformProp = require('../prop');

const getComputedStyle = function(elem) {
	return document.defaultView.getComputedStyle(elem);
};

const decompose = function(matrix) {
	const composition = matrix.decompose();
	const { rotate, scale, skew, translate } = composition;

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
	style(elem) {
		const computedStyles = getComputedStyle(elem);
		const transform = computedStyles[transformProp];
		if (!transform || transform === 'none') { return decompose(new Matrix()); }

		const matrix = new Matrix(transform);
		return decompose(matrix);
	},

	obj(obj) {
		const matrix = new Matrix();
		const composition = matrix.compose(obj);
		return decompose(composition);
	}
};
},{"../matrix":6,"../prop":10}],14:[function(require,module,exports){
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

const expand = function(obj) {
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

module.exports = obj => !obj ? obj : expand(obj);

},{}],15:[function(require,module,exports){
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

const isElement = require('./isElement');
const baser = require('./baser');
const expandShorthand = require('./expandShorthand');

module.exports = function transformer(initial) {
	let init = initial;

	let base;
	let yoyo;
	let from;
	let to;
	let repeat;

	return {
		value() {
			return base;
		},

		yoyo(bool) {
			yoyo = bool;
			return this;
		},

		from(f) {
			init = f;
			return this;
		},

		to(t) {
			to = expandShorthand(t);
			return this;
		},

		update(perc) {
			for (let property in to) {
				let start = from[property] || 0;
				let end = to[property];

				base[property] = start + (end - start) * perc;
			}

			return this;
		},

		reverse() {
			var tmp;

			// reassign starting values
			for (let property in repeat) {
				if (yoyo) {
					tmp = repeat[property];
					repeat[property] = to[property];
					to[property] = tmp;
				}

				from[property] = repeat[property];
			}

			return this;
		},

		start() {
			if (!to) { return this; }
			if (!base) { base = isElement(init) ? baser.style(init) : baser.obj(expandShorthand(init)); }
			if (!from) { from = {}; }
			if (!repeat) { repeat = {}; }

			for (let property in to) {
				// omit unchanged properties
				if (base[property] === undefined || to[property] === base[property]) {
					delete to[property];
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
module.exports = obj => !!(obj && +obj.nodeType === obj.nodeType);

},{}]},{},[2])(2)
});