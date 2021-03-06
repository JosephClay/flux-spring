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
