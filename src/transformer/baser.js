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