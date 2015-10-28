var flux = window.flux;

var $ = document.querySelector.bind(document);

var spring = flux.spring($('#target'))
    .transform.to({ x: 200 })
    .yoyo()
    .repeat(Infinity)
    .on('update', function(obj, spring) {
        spring.elem.style[flux.transform] = spring.matrix.toString();
    })
    .start();

var isPaused = false;
setInterval(function() {
    if (isPaused) {
        spring.resume();
    } else {
        spring.pause();
    }

    isPaused = !isPaused;
}, 1000);

var tick = function(time) {
    requestAnimationFrame(tick);
    flux.update(time);
};

requestAnimationFrame(tick);