const waiting    = [];
const animations = [];

export default {
    now: Date.now(),

    await(fn) {
        waiting.push(fn);
    },

    add(fn) {
        animations.push(fn);
    },

    remove(fn) {
        let idx = animations.indexOf(fn);
        if (idx !== -1) {
            animations.splice(idx, 1);
        }
    },

    update() {
        const time = this.now = Date.now();

        if (waiting.length === 0 && animations.length === 0) {
            return;
        }

        let idx = 0;
        while (idx < waiting.length) {
            if (waiting[idx](time)) {
                idx++;
            } else {
                waiting.splice(idx, 1);
            }
        }

        idx = 0;
        while (idx < animations.length) {
            animations[idx].step(time);
            idx++;
        }
    }
};