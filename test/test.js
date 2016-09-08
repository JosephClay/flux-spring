const tape = require('tape');
const expandShorthand = require('../src/transformer/expandShorthand');

const partialEqual = (a, b) => {
	for (let key in a) {
		if (a[key] !== b[key]) {
			return false;
		}
	}
	return true;
};

tape('expand shorthand', assert => {
	assert.plan(5);

	assert.ok(expandShorthand() === undefined, 'not passing parameter is a noop');
	assert.ok(partialEqual({ x: 0, y: 0, z: 0 }, expandShorthand({ x: 0, y: 0, z: 0 })), 'nothing expanded does not alter object');
	assert.ok(partialEqual({ scaleX: 1, scaleY: 1 }, expandShorthand({ scale: 1 })), 'expanded scale');
	assert.ok(partialEqual({ rotateZ: 1 }, expandShorthand({ rotation: 1 })), 'expanded rotation');
	assert.ok(partialEqual({ rotateZ: 1 }, expandShorthand({ rotate: 1 })), 'expanded rotate');

	assert.end();
});