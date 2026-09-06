import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
	createDeviceGallery,
	DEVICE_INTERVAL,
	DEVICE_TRANSITION,
	deviceChapters,
} from "../../packages/experience/device-gallery";

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(0);
});
afterEach(() => {
	vi.useRealTimers();
});

it("starts with the existing device, cycles through the six chapters, and wraps", () => {
	const gallery = createDeviceGallery();
	expect(gallery.getSnapshot().index).toBe(0);
	expect(vi.getTimerCount()).toBe(0);
	gallery.start();
	for (let step = 1; step <= deviceChapters.length; step++) {
		vi.advanceTimersByTime(DEVICE_INTERVAL);
		expect(gallery.getSnapshot().index).toBe(step % deviceChapters.length);
	}
	gallery.stop();
	expect(vi.getTimerCount()).toBe(0);
});

it("makes a chosen device active immediately and discards interrupted exits", () => {
	const gallery = createDeviceGallery();
	gallery.start();
	gallery.select(3);
	expect(gallery.getSnapshot()).toMatchObject({
		index: 3,
		previous: 0,
		direction: 1,
	});
	vi.advanceTimersByTime(100);
	gallery.select(1, -1);
	expect(gallery.getSnapshot()).toMatchObject({
		index: 1,
		previous: 3,
		direction: -1,
	});
	vi.advanceTimersByTime(DEVICE_TRANSITION);
	expect(gallery.getSnapshot().previous).toBeNull();
	gallery.advance(-1);
	gallery.advance(-1);
	expect(gallery.getSnapshot().index).toBe(5);
	gallery.stop();
});

it("preserves reading time across overlapping pointer, focus and visibility pauses", () => {
	const gallery = createDeviceGallery();
	gallery.start();
	vi.advanceTimersByTime(4000);
	gallery.pause("pointer", true);
	expect(gallery.getSnapshot()).toMatchObject({
		running: false,
		remaining: 8000,
	});
	gallery.pause("focus", true);
	vi.advanceTimersByTime(30000);
	gallery.pause("pointer", false);
	expect(gallery.getSnapshot().running).toBe(false);
	gallery.pause("visibility", true);
	gallery.pause("focus", false);
	gallery.pause("visibility", false);
	vi.advanceTimersByTime(7999);
	expect(gallery.getSnapshot().index).toBe(0);
	vi.advanceTimersByTime(1);
	expect(gallery.getSnapshot().index).toBe(1);
	gallery.stop();
});

it("manual selection restarts the interval and playback can be explicitly paused", () => {
	const gallery = createDeviceGallery();
	gallery.start();
	vi.advanceTimersByTime(11000);
	gallery.select(2);
	vi.advanceTimersByTime(2000);
	expect(gallery.getSnapshot().index).toBe(2);
	gallery.setPlaying(false);
	vi.advanceTimersByTime(30000);
	expect(gallery.getSnapshot().index).toBe(2);
	gallery.setPlaying(true);
	vi.advanceTimersByTime(10000);
	expect(gallery.getSnapshot().index).toBe(3);
	gallery.stop();
});

it("autoplay is on by default with reduced motion, with immediate swaps and a persistent manual pause", () => {
	const gallery = createDeviceGallery();
	gallery.start();
	gallery.select(1);
	gallery.setReducedMotion(true);
	expect(gallery.getSnapshot()).toMatchObject({
		playing: true,
		running: true,
		previous: null,
	});
	gallery.select(4);
	expect(gallery.getSnapshot().previous).toBeNull();
	vi.advanceTimersByTime(DEVICE_INTERVAL);
	expect(gallery.getSnapshot().index).toBe(5);
	gallery.setPlaying(false);
	vi.advanceTimersByTime(DEVICE_INTERVAL * 2);
	expect(gallery.getSnapshot().index).toBe(5);
	gallery.setReducedMotion(false);
	expect(gallery.getSnapshot().playing).toBe(false);
	gallery.setPlaying(true);
	vi.advanceTimersByTime(DEVICE_INTERVAL);
	expect(gallery.getSnapshot().index).toBe(0);
	gallery.stop();
});

it("keeps snapshots stable, validates selection and disposes all scheduled work", () => {
	const gallery = createDeviceGallery();
	const changed = vi.fn();
	const unsubscribe = gallery.subscribe(changed);
	expect(gallery.getServerSnapshot()).toBe(gallery.getSnapshot());
	gallery.start();
	gallery.start();
	gallery.select(0);
	gallery.pause("viewport", false);
	gallery.pause("viewport", true);
	gallery.pause("viewport", true);
	gallery.setPlaying(true);
	gallery.setReducedMotion(false);
	expect(changed).toHaveBeenCalled();
	for (const index of [-1, 6, 0.5, Number.NaN])
		expect(() => gallery.select(index)).toThrow();
	gallery.pause("viewport", false);
	gallery.select(1);
	unsubscribe();
	changed.mockClear();
	gallery.stop();
	gallery.stop();
	vi.advanceTimersByTime(DEVICE_INTERVAL * 3);
	expect(changed).not.toHaveBeenCalled();
	expect(gallery.getSnapshot().index).toBe(1);
	expect(vi.getTimerCount()).toBe(0);
});
