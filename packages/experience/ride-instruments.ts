export interface RideSnapshot {
	speed: number;
	gear: "N" | "D";
	rpm: number;
}
const idle: RideSnapshot = { speed: 0, gear: "N", rpm: 1000 };
const cruiseSpeed = 72;
const acceleration = 1800;
const coastAfter = 2200;
const coasting = 3200;
const neutralDelay = 2600;

/** A finite instrument animation, driven by navigation rather than activity data. */
export function createRideInstruments() {
	let snapshot = idle;
	let lastInput = 0;
	let fromSpeed = 0;
	let clock: ReturnType<typeof setTimeout> | undefined;
	const listeners = new Set<() => void>();
	const speedAt = (now: number) => {
		const elapsed = now - lastInput;
		if (elapsed < coastAfter) {
			const t = Math.min(1, elapsed / acceleration);
			return fromSpeed + (cruiseSpeed - fromSpeed) * (1 - (1 - t) ** 3);
		}
		const t = Math.min(1, (elapsed - coastAfter) / coasting);
		return cruiseSpeed * (1 - t * t * (3 - 2 * t));
	};
	const publish = (next: RideSnapshot) => {
		if (
			next.speed === snapshot.speed &&
			next.gear === snapshot.gear &&
			next.rpm === snapshot.rpm
		)
			return;
		snapshot = next;
		for (const listener of listeners) listener();
	};
	const tick = () => {
		const now = Date.now();
		if (now - lastInput >= coastAfter + coasting + neutralDelay) {
			clock = undefined;
			publish(idle);
			return;
		}
		const speed = Math.round(speedAt(now));
		publish({ speed, gear: "D", rpm: 1000 + speed * 65 });
		clock = setTimeout(tick, 50);
	};
	return {
		getSnapshot: () => snapshot,
		getServerSnapshot: () => idle,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		engage() {
			const now = Date.now();
			fromSpeed = snapshot.gear === "N" ? 0 : speedAt(now);
			lastInput = now;
			clearTimeout(clock);
			tick();
		},
		stop() {
			clearTimeout(clock);
			clock = undefined;
			publish(idle);
		},
	};
}
