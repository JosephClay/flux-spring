const tape = require('tape');
// const flux = require('../src');

const expandShorthand = require('../src/matrix/expandShorthand');

tape('expand shorthand', function(t) {
    t.plan(5);

    t.ok(expandShorthand() === undefined, 'not passing parameter is a noop');
    t.deepEqual({ x: 0, y: 0, z: 0 }, expandShorthand({ x: 0, y: 0, z: 0 }), 'nothing expanded does not alter object');
    t.deepEqual({ scaleX: 1, scaleY: 1 }, expandShorthand({ scale: 1 }), 'expanded scale');
    t.deepEqual({ rotationZ: 1 }, expandShorthand({ rotation: 1 }), 'expanded rotation');
    t.deepEqual({ rotationZ: 1 }, expandShorthand({ rotate: 1 }), 'expanded rotate');
});