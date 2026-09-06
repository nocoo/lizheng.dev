import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createRideInstruments } from "../../packages/experience/ride-instruments";

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(0);
});
afterEach(() => vi.useRealTimers());

it("engages D before accelerating, then coasts to zero before the delayed neutral shift", () => {
	const ride = createRideInstruments();
	expect(ride.getSnapshot()).toMatchObject({ speed: 0, gear: "N" });
	expect(vi.getTimerCount()).toBe(0);
	ride.engage();
	expect(ride.getSnapshot()).toMatchObject({ speed: 0, gear: "D" });
	vi.advanceTimersByTime(600);
	const early = ride.getSnapshot();
	expect(early.speed).toBeGreaterThan(0);
	vi.advanceTimersByTime(1200);
	const cruising = ride.getSnapshot();
	expect(cruising.speed).toBeGreaterThan(early.speed);
	expect(cruising.rpm).toBeGreaterThan(early.rpm);
	vi.advanceTimersByTime(1600);
	const coasting = ride.getSnapshot();
	expect(coasting.speed).toBeGreaterThan(0);
	expect(coasting.speed).toBeLessThan(cruising.speed);
	vi.advanceTimersByTime(2000);
	expect(ride.getSnapshot()).toMatchObject({ speed: 0, gear: "D" });
	vi.advanceTimersByTime(2500);
	expect(ride.getSnapshot().gear).toBe("D");
	vi.advanceTimersByTime(100);
	expect(ride.getSnapshot()).toMatchObject({ speed: 0, gear: "N" });
	expect(vi.getTimerCount()).toBe(0);
});

it("continues smoothly from the current speed on repeated navigation and during coasting", () => {
	const ride = createRideInstruments();
	ride.engage();
	vi.advanceTimersByTime(800);
	const first = ride.getSnapshot().speed;
	ride.engage();
	expect(ride.getSnapshot().speed).toBe(first);
	vi.advanceTimersByTime(3000);
	const coasting = ride.getSnapshot().speed;
	ride.engage();
	expect(ride.getSnapshot().speed).toBe(coasting);
	vi.advanceTimersByTime(500);
	expect(ride.getSnapshot().speed).toBeGreaterThan(coasting);
	vi.advanceTimersByTime(7500);
	expect(ride.getSnapshot()).toMatchObject({ speed: 0, gear: "N" });
	ride.engage();
	expect(ride.getSnapshot().gear).toBe("D");
	ride.stop();
});

it("shares stable idle snapshots and removes all scheduled work on exit or hide", () => {
	const ride = createRideInstruments();
	expect(ride.getSnapshot()).toBe(ride.getServerSnapshot());
	const listener = vi.fn();
	const unsubscribe = ride.subscribe(listener);
	ride.engage();
	vi.advanceTimersByTime(1000);
	expect(listener).toHaveBeenCalled();
	unsubscribe();
	listener.mockClear();
	ride.stop();
	expect(ride.getSnapshot()).toMatchObject({ speed: 0, gear: "N" });
	expect(vi.getTimerCount()).toBe(0);
	vi.advanceTimersByTime(20000);
	expect(listener).not.toHaveBeenCalled();
	ride.stop();
});
