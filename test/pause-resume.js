const flux = window.flux;
const $ = document.querySelector.bind(document);

const spring = flux.spring($('#target'))
	.transform.to({ x: 200 })
	.yoyo()
	.repeat(Infinity)
	.on('update', function(obj, spring) {
		spring.elem.style[flux.transform] = spring.matrix.toString();
	})
	.start();

let isPaused = false;
setInterval(function() {
	if (isPaused) {
		spring.resume();
	} else {
		spring.pause();
	}

	isPaused = !isPaused;
}, 1000);

const tick = function(time) {
	flux.update(time);
	requestAnimationFrame(tick);
};

requestAnimationFrame(tick);