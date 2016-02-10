const flux = require('../src');

flux({ x: 100, scale: 1, y: 1 })
    .to({ x: 0, scale: 0 })
    .yoyo()
    .repeat(Infinity)
    .on('update', function(obj) {
        console.log('obj: ', obj);
    })
    .start();

const tick = function(time) {
    flux.update(time);
    setTimeout(tick, 500);
};

tick();