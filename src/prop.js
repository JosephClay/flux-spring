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