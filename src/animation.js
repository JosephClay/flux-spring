const loop = require('./loop');
const transformer = require('./transformer');
const s = require('./spring');

module.exports = function animation(obj) {
    const api     = {};
    const matrix  = transformer(obj);
    let playing   = false;
    let startTime = 0;
    let delayTime = 0;
    let events    = {};
    let spring    = s();

    const start = function() {
        spring.registerCallbacks({
            onUpdate: (perc) => {
                matrix.update(perc);
                api.trigger('update', matrix.value(), obj);
            },
            onReverse: () => {
                matrix.reverse();
            },
            onComplete: () => {
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