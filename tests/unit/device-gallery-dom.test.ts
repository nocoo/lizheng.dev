// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, onTestFinished, vi } from "vitest";
import {
	createDeviceGallery,
	DEVICE_INTERVAL,
} from "../../packages/experience/device-gallery";
import { setupDeviceGallery } from "../../packages/experience/device-gallery-dom";

let motion: EventTarget & { matches: boolean };
let intersect: IntersectionObserverCallback;
const disconnect = vi.fn();
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(0);
	motion = Object.assign(new EventTarget(), { matches: false });
	vi.stubGlobal("matchMedia", () => motion);
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			constructor(callback: IntersectionObserverCallback) {
				intersect = callback;
			}
			observe = vi.fn();
			disconnect = disconnect;
		},
	);
	document.body.innerHTML = `<div data-gallery><div class="console-scene"><button id="control">Control</button></div><div role="tablist">${Array.from({ length: 6 }, (_, i) => `<button role="tab" data-chapter="${i}">${i}</button>`).join("")}</div></div><button id="outside">Outside</button>`;
});
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
const root = () =>
	document.querySelector<HTMLElement>("[data-gallery]") as HTMLElement;

it("keeps one chapter tab stop through selection, autoplay and teardown", () => {
	const gallery = createDeviceGallery();
	const tabs = [
		...root().querySelectorAll<HTMLButtonElement>("[data-chapter]"),
	];
	const stops = () => tabs.map((tab) => tab.tabIndex);
	const cleanup = setupDeviceGallery(root(), gallery);
	onTestFinished(cleanup);
	expect(stops()).toEqual([0, -1, -1, -1, -1, -1]);
	gallery.select(4);
	expect(stops()).toEqual([-1, -1, -1, -1, 0, -1]);
	vi.advanceTimersByTime(DEVICE_INTERVAL);
	expect(stops()).toEqual([-1, -1, -1, -1, -1, 0]);
	gallery.advance();
	expect(stops()).toEqual([0, -1, -1, -1, -1, -1]);
	gallery.setReducedMotion(true);
	cleanup();
	gallery.select(2);
	expect(stops()).toEqual([0, -1, -1, -1, -1, -1]);
	expect(vi.getTimerCount()).toBe(0);
});

it("restores the current tab stop on setup and leaves it untouched by pause updates", () => {
	const gallery = createDeviceGallery();
	gallery.setReducedMotion(true);
	gallery.select(3);
	const cleanup = setupDeviceGallery(root(), gallery);
	onTestFinished(cleanup);
	expect(
		[...root().querySelectorAll<HTMLButtonElement>("[data-chapter]")].map(
			(tab) => tab.tabIndex,
		),
	).toEqual([-1, -1, -1, 0, -1, -1]);
	const observer = new MutationObserver(() => {});
	observer.observe(root(), {
		attributes: true,
		subtree: true,
		attributeFilter: ["tabindex"],
	});
	gallery.pause("pointer", true);
	gallery.pause("pointer", false);
	gallery.setPlaying(false);
	expect(observer.takeRecords()).toEqual([]);
	observer.disconnect();
	cleanup();
	expect(vi.getTimerCount()).toBe(0);
});

it("coordinates hover, internal focus and viewport pauses without losing time", () => {
	const gallery = createDeviceGallery();
	const cleanup = setupDeviceGallery(root(), gallery);
	vi.advanceTimersByTime(3000);
	const scene = document.querySelector(".console-scene");
	scene?.dispatchEvent(new Event("pointerenter"));
	expect(gallery.getSnapshot()).toMatchObject({
		running: false,
		remaining: 9000,
	});
	document.getElementById("control")?.focus();
	scene?.dispatchEvent(new Event("pointerleave"));
	expect(gallery.getSnapshot().running).toBe(false);
	document.querySelector<HTMLButtonElement>("[data-chapter]")?.focus();
	expect(gallery.getSnapshot().running).toBe(false);
	document.getElementById("outside")?.focus();
	expect(gallery.getSnapshot().running).toBe(true);
	intersect(
		[{ isIntersecting: false } as IntersectionObserverEntry],
		{} as IntersectionObserver,
	);
	vi.advanceTimersByTime(DEVICE_INTERVAL * 3);
	expect(gallery.getSnapshot().index).toBe(0);
	intersect(
		[{ isIntersecting: true } as IntersectionObserverEntry],
		{} as IntersectionObserver,
	);
	vi.advanceTimersByTime(9000);
	expect(gallery.getSnapshot().index).toBe(1);
	cleanup();
	expect(disconnect).toHaveBeenCalled();
	expect(vi.getTimerCount()).toBe(0);
});

it("supports chapter arrow/Home/End navigation without stealing native controls", () => {
	const gallery = createDeviceGallery();
	const cleanup = setupDeviceGallery(root(), gallery);
	const press = (key: string, options: KeyboardEventInit = {}) =>
		document.activeElement?.dispatchEvent(
			new KeyboardEvent("keydown", {
				key,
				bubbles: true,
				cancelable: true,
				...options,
			}),
		);
	document.getElementById("outside")?.focus();
	press("ArrowRight");
	expect(gallery.getSnapshot().index).toBe(0);
	document.querySelector<HTMLButtonElement>("[data-chapter]")?.focus();
	press("ArrowLeft");
	expect(gallery.getSnapshot().index).toBe(5);
	expect(document.activeElement?.getAttribute("data-chapter")).toBe("5");
	press("ArrowRight");
	expect(gallery.getSnapshot().index).toBe(0);
	press("End");
	expect(gallery.getSnapshot().index).toBe(5);
	press("Home");
	expect(gallery.getSnapshot().index).toBe(0);
	for (const modifier of ["altKey", "ctrlKey", "metaKey"])
		press("ArrowRight", { [modifier]: true });
	press("Enter");
	expect(gallery.getSnapshot().index).toBe(0);
	cleanup();
	press("End");
	expect(gallery.getSnapshot().index).toBe(0);
});

it("uses horizontal arrows for devices, preserves menu focus and leaves edits and browser keys alone", () => {
	const scene = root().querySelector(".console-scene") as HTMLElement;
	scene.innerHTML =
		'<div data-device-active="gameboy" data-console><a href="#first" data-screen-link="0">First</a><a href="#second" class="is-selected" data-screen-link="1">Second</a><button data-control="back">Back</button><input><span contenteditable="true" tabindex="0">Edit</span></div>';
	const gallery = createDeviceGallery();
	const cleanup = setupDeviceGallery(root(), gallery);
	const press = (key: string, options: KeyboardEventInit = {}) => {
		const event = new KeyboardEvent("keydown", {
			key,
			bubbles: true,
			cancelable: true,
			...options,
		});
		document.activeElement?.dispatchEvent(event);
		return event.defaultPrevented;
	};
	expect(press("ArrowLeft")).toBe(true);
	expect(gallery.getSnapshot().index).toBe(5);
	vi.advanceTimersToNextFrame();
	expect(document.activeElement?.getAttribute("data-screen-link")).toBe("1");
	expect(gallery.getSnapshot().running).toBe(false);
	press("ArrowRight");
	expect(gallery.getSnapshot().index).toBe(0);
	vi.advanceTimersToNextFrame();
	press("ArrowDown");
	press("Home");
	for (const modifier of [
		"altKey",
		"ctrlKey",
		"metaKey",
		"shiftKey",
		"isComposing",
	])
		expect(press("ArrowRight", { [modifier]: true })).toBe(false);
	for (const selector of ["input", "[contenteditable]", "#outside"]) {
		document.querySelector<HTMLElement>(selector)?.focus();
		expect(press("ArrowRight")).toBe(false);
	}
	expect(gallery.getSnapshot().index).toBe(0);
	const selected = scene.querySelector<HTMLElement>(
		".is-selected",
	) as HTMLElement;
	selected.focus();
	selected.parentElement?.classList.add("panel-about");
	press("ArrowRight");
	vi.advanceTimersToNextFrame();
	expect(document.activeElement?.getAttribute("data-control")).toBe("back");
	press("ArrowLeft");
	cleanup();
	vi.advanceTimersToNextFrame();
	expect(vi.getTimerCount()).toBe(0);
});

it("reacts to system motion and visibility, ignores touch hover and removes listeners", () => {
	motion.matches = true;
	const gallery = createDeviceGallery();
	const cleanup = setupDeviceGallery(root(), gallery);
	expect(gallery.getSnapshot().playing).toBe(true);
	motion.matches = false;
	motion.dispatchEvent(new Event("change"));
	gallery.setPlaying(true);
	const scene = document.querySelector(".console-scene");
	scene?.dispatchEvent(
		Object.assign(new Event("pointerenter"), { pointerType: "touch" }),
	);
	expect(gallery.getSnapshot().running).toBe(true);
	vi.spyOn(document, "hidden", "get").mockReturnValue(true);
	document.dispatchEvent(new Event("visibilitychange"));
	expect(gallery.getSnapshot().running).toBe(false);
	vi.spyOn(document, "hidden", "get").mockReturnValue(false);
	document.dispatchEvent(new Event("visibilitychange"));
	expect(gallery.getSnapshot().running).toBe(true);
	document.getElementById("control")?.focus();
	document.getElementById("control")?.blur();
	expect(gallery.getSnapshot().running).toBe(true);
	cleanup();
	motion.matches = true;
	motion.dispatchEvent(new Event("change"));
	scene?.dispatchEvent(new Event("pointerenter"));
	expect(gallery.getSnapshot().reducedMotion).toBe(false);
	vi.restoreAllMocks();
});

it("works without an IntersectionObserver and cleans an optional empty scene", () => {
	vi.stubGlobal("IntersectionObserver", undefined);
	root().innerHTML = "";
	const gallery = createDeviceGallery();
	const cleanup = setupDeviceGallery(root(), gallery);
	expect(gallery.getSnapshot().running).toBe(true);
	cleanup();
	expect(vi.getTimerCount()).toBe(0);
});

it("resumes after mouse or touch chapter choices while still pausing for keyboard navigation", () => {
	const gallery = createDeviceGallery();
	const cleanup = setupDeviceGallery(root(), gallery);
	const tab = document.querySelector<HTMLButtonElement>("[data-chapter]");
	tab?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
	tab?.focus();
	expect(gallery.getSnapshot().running).toBe(true);
	tab?.dispatchEvent(
		new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
	);
	expect(gallery.getSnapshot().running).toBe(false);
	const next = document.activeElement;
	next?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
	expect(gallery.getSnapshot().running).toBe(true);
	vi.advanceTimersByTime(DEVICE_INTERVAL);
	expect(gallery.getSnapshot().index).toBe(2);
	const outside = document.getElementById("outside");
	outside?.focus();
	outside?.dispatchEvent(
		new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
	);
	document.getElementById("control")?.focus();
	expect(gallery.getSnapshot().running).toBe(false);
	// Flush jsdom selectionchange events queued by the final focus transfers.
	vi.advanceTimersByTime(0);
	cleanup();
	next?.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
	expect(vi.getTimerCount()).toBe(0);
});

it("uses actual pointer coordinates for screen selection and ignores stationary layout changes and touch scrolling", () => {
	const scene = root().querySelector(".console-scene") as HTMLElement;
	scene.innerHTML =
		'<div data-device-active="ipod"><a class="is-selected" data-screen-link="0">First</a><a data-screen-link="1"><span>Second</span></a></div><a data-screen-link="2">Outgoing</a>';
	const first = scene.querySelector("a") as HTMLElement;
	const second = scene.querySelector("span") as HTMLElement;
	const move = (
		target: EventTarget,
		x: number,
		y: number,
		pointerType = "mouse",
	) =>
		target.dispatchEvent(
			Object.assign(
				new MouseEvent("pointermove", {
					clientX: x,
					clientY: y,
					bubbles: true,
				}),
				{ pointerType },
			),
		);
	const select = vi.fn();
	const gallery = createDeviceGallery();
	const cleanup = setupDeviceGallery(root(), gallery, select);
	move(first, 20, 20);
	move(second, 20, 20);
	expect(select).not.toHaveBeenCalled();
	move(second, 25, 20);
	expect(select).toHaveBeenCalledExactlyOnceWith(1);
	move(second, 25, 20);
	move(first, 25, 21, "touch");
	move(document, 1, 1);
	move(document.getElementById("outside") as HTMLElement, 2, 2);
	move(scene.lastElementChild as HTMLElement, 3, 3);
	move(scene, 4, 4);
	expect(select).toHaveBeenCalledOnce();
	cleanup();
	move(second, 30, 20);
	expect(select).toHaveBeenCalledOnce();
	const withoutHover = setupDeviceGallery(root(), gallery);
	move(second, 40, 20);
	withoutHover();
	expect(vi.getTimerCount()).toBe(0);
});
