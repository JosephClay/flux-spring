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