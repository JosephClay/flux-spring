(function(flux) {
	var $ = document.querySelector.bind(document);
	var SPRING = {
		tension: 80,
		friction: 15,
		velocity: 1000
	};

	flux($('[data-x]'))
		.set(SPRING)
		.to({ x: 50 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-y]'))
		.set(SPRING)
		.to({ y: -50 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-z]'))
		.set(SPRING)
		.to({ z: -200 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-scale-y]'))
		.set(SPRING)
		.to({ scaleY: 1.8 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-scale-x]'))
		.set(SPRING)
		.to({ scaleX: 1.8 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-scale-z]'))
		.set(SPRING)
		.to({ scaleZ: 1.8 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-scale]'))
		.set(SPRING)
		.to({ scale: 1.8 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-rotate]'))
		.set(SPRING)
		.to({ rotate: -360 * 2 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-rotate-x]'))
		.set(SPRING)
		.to({ rotateX: 90 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-rotate-y]'))
		.set(SPRING)
		.to({ rotateY: 90 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-rotate-z]'))
		.set(SPRING)
		.to({ rotateZ: 90 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-x-from]'))
		.set(SPRING)
		.from({ x: -50 })
		.to({ x: 50 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-y-from]'))
		.set(SPRING)
		.from({ y: 50 })
		.to({ y: -50 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-z-from]'))
		.set(SPRING)
		.from({ z: 50 })
		.to({ z: -50 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-scale-y-from]'))
		.set(SPRING)
		.from({ scaleY: 0.5 })
		.to({ scaleY: 1.8 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-scale-x-from]'))
		.set(SPRING)
		.from({ scaleX: 0.5 })
		.to({ scaleX: 1.8 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-scale-z-from]'))
		.set(SPRING)
		.from({ scaleZ: 0.5 })
		.to({ scaleZ: 1.8 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-rotate-x-from]'))
		.set(SPRING)
		.from({ rotateX: -45 })
		.to({ rotateX: 90 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-rotate-y-from]'))
		.set(SPRING)
		.from({ rotateY: -45 })
		.to({ rotateY: 90 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	flux($('[data-rotate-z-from]'))
		.set(SPRING)
		.from({ rotateZ: -45 })
		.to({ rotateZ: 90 })
		.repeat(Infinity)
		.yoyo()
		.on('update', flux.transform)
		.start();

	var tick = function(time) {
		flux.update(time);
		requestAnimationFrame(tick);
	};

	requestAnimationFrame(tick);
}(window.flux));