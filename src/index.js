import loop from './loop';
import prop from './prop';
import animation from './animation';
import transform from './transform';
const plugins   = {};

export default Object.assign(function(obj) {
    return Object.assign(animation(obj), plugins);
}, {
    prop,
    transform,
    update: loop.update,
	tick:   loop.update,
    plugin(name, fn) {
        plugins[name] = function() {
            fn.apply(this, arguments);
            return this;
        };
        return this;
    }
});