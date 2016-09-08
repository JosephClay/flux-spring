(function(flux) {
	var $ = document.querySelector.bind(document);

	var spring = flux($('#target'))
		.to({ x: 200 })
		.yoyo()
		.repeat(Infinity)
		.on('update', flux.transform)
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

	var tick = function(time) {
		flux.update(time);
		requestAnimationFrame(tick);
	};

	requestAnimationFrame(tick);
}(window.flux));