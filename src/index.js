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