// TODO: Get rid of deletes

import isElement from './isElement';
import baser from './baser';
import expandShorthand from './expandShorthand';

export default function matrix(initial) {
    let init = initial;

    let base;
    let yoyo;
    let from;
    let to;
    let repeat;

    return {
        value() {
            return base;
        },

        yoyo(bool) {
            yoyo = bool;
            return this;
        },

        from(f) {
            init = f;
            return this;
        },

        to(t) {
            to = expandShorthand(t);
            return this;
        },

        update(perc) {
            for (let property in to) {
                let start = from[property] || 0;
                let end = to[property];

                base[property] = start + (end - start) * perc;
            }

            return this;
        },

        reverse() {
            var tmp;

            // reassign starting values
            for (let property in repeat) {
                if (yoyo) {
                    tmp = repeat[property];
                    repeat[property] = to[property];
                    to[property] = tmp;
                }

                from[property] = repeat[property];
            }

            return this;
        },

        start() {
            if (!to) { return this; }
            if (!base) { base = isElement(init) ? baser.style(init) : baser.obj(expandShorthand(init)); }
            if (!from) { from = {}; }
            if (!repeat) { repeat = {}; }

            for (let property in to) {
                // omit unchanged properties
                if (base[property] === undefined || to[property] === base[property]) {
                    delete to[property];
                    continue;
                }

                from[property] = base[property];
                repeat[property] = from[property] || 0;
            }

            return this;
        }
    };
}