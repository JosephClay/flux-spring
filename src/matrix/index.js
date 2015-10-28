import deg2rad from './deg2rad';
import matrix from './matrix';
import transp from './transp';

const indexToKey2d = function(index) {
    return String.fromCharCode(index + 97); // ASCII char 97 == 'a'
};

const indexToKey3d = function(index) {
    return ('m' + (Math.floor(index / 4) + 1)) + (index % 4 + 1);
};

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
function XCSSMatrix(str) {
    this.m11 = this.m22 = this.m33 = this.m44 = 1;

               this.m12 = this.m13 = this.m14 =
    this.m21 =            this.m23 = this.m24 =
    this.m31 = this.m32 =            this.m34 =
    this.m41 = this.m42 = this.m43            = 0;

    this.setMatrixValue(str);
}

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

        var tx = new XCSSMatrix(),
            ty = new XCSSMatrix(),
            tz = new XCSSMatrix(),
            sinA, cosA, sq;

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
        const isIdentity     = this.toString() === identityMatrix.toString();
        const rotatedMatrix  = isIdentity ?
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

export default XCSSMatrix;