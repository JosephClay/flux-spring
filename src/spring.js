/**
 * Encapsulates the functionality of a spring,
 * calculating state based off of tension, friction
 * and velocity. Implemented by `animation.js`
 */

const END_VALUE = 100;
const TOLERANCE = 0.01;
const SPEED = 1 / 60;

const calcAcceleration = function(tension, x, friction, velocity) {
	return -tension * x - friction * velocity;
};

const calcState = function(state, speed) {
	const dt = speed * 0.5;
	const x = state.x;
	const velocity = state.velocity;
	const tension = state.tension;
	const friction = state.friction;

	const aDx = velocity;
	const aDv = calcAcceleration(tension, x, friction, velocity);

	const bDx = velocity + aDv * dt;
	const bEndX = x + aDx * dt;
	const bDv = calcAcceleration(tension, bEndX, friction, bDx);

	const cDx = velocity + bDv * dt;
	const cEndX = x + bDx * dt;
	const cDv = calcAcceleration(tension, cEndX, friction, cDx);

	const dDx = velocity + cDv * dt;
	const dEndX = x + cDx * dt;
	const dDv = calcAcceleration(tension, dEndX, friction, dDx);

	const dxdt = (1 / 6) * (aDx + 2 * (bDx + cDx) + dDx);
	const dvdt = (1 / 6) * (aDv + 2 * (bDv + cDv) + dDv);

	state.x = x + dxdt * speed;
	state.velocity = aDx + dvdt * speed;

	return state;
};

module.exports = function spring() {
	let velocity = 0;
	let tension = 80;
	let friction = 8;

	let repeat = 0;
	let originalVelocity = 0;
	let originalTension = 80;
	let originalFriction = 8;
	let value = 0;
	let isPaused = false;

	// Stores x and velocity to do
	// calculations against so that
	// we can have multiple return
	// values from calcState
	const state = {};

	let updateCallback;
	let completeCallback;
	let reverseCallback;

	return {
		registerCallbacks(obj) {
			updateCallback = obj.onUpdate;
			completeCallback = obj.onComplete;
			reverseCallback = obj.onReverse;
			return this;
		},

		repeat(times) {
			repeat = times;
			return this;
		},

		set(t, f, v) {
			if (v !== undefined) { velocity = originalVelocity = v; }
			if (t !== undefined) { tension = originalTension = t;  }
			if (f !== undefined) { friction = originalFriction = f; }
			return this;
		},

		tension(t) {
			tension = originalTension = t;
			return this;
		},

		friction(f) {
			friction = originalFriction = f;
			return this;
		},

		velocity(v) {
			velocity = originalVelocity = v;
			return this;
		},

		pause() {
			isPaused = true;
			return this;
		},

		resume() {
			isPaused = false;
			return this;
		},

		step() {
			if (isPaused) { return true; } // should set again?

			const stateBefore = state;

			stateBefore.x = value - END_VALUE;
			stateBefore.velocity = velocity;
			stateBefore.tension = tension;
			stateBefore.friction = friction;

			const stateAfter = calcState(stateBefore, SPEED);
			const finalVelocity = stateAfter.velocity;
			const netFloat = stateAfter.x;
			const net1DVelocity = stateAfter.velocity;
			const netValueIsLow = Math.abs(netFloat) < TOLERANCE;
			const netVelocityIsLow = Math.abs(net1DVelocity) < TOLERANCE;
			const springShouldStop = netValueIsLow || netVelocityIsLow;

			value = END_VALUE + stateAfter.x;

			if (springShouldStop) {

				velocity = 0;
				value = END_VALUE;

				updateCallback(value / 100);

				// Should we repeat?
				if (repeat > 0) {

					// Decrement the repeat counter (if finite,
					// we may be in an infinite loop)
					if (isFinite(repeat)) { repeat--; }

					reverseCallback();
					velocity = originalVelocity;
					tension  = originalTension;
					friction = originalFriction;
					value = 0;

					return true; // should set again?
				}

				// Otherwise, we're done repeating
				completeCallback();

				return false; // should set again?
			}

			velocity = finalVelocity;
			updateCallback(value / 100);
			return true; // should set again?
		},

		stop() {
			velocity = originalVelocity;
			tension = originalTension;
			friction = originalFriction;
			value = 0;
			return this;
		}
	};
};