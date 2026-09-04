// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import {
	activate,
	initialHandheld,
	setupHandheld,
	transition,
} from "../../packages/experience/handheld";

let reduced = false;
let fine = true;
let motionChange: (() => void) | undefined;
let raf: FrameRequestCallback | undefined;
beforeEach(() => {
	reduced = false;
	fine = true;
	document.body.innerHTML =
		'<button id="outside"></button><div id="app" tabindex="-1"><div class="console-scene"><div class="console-shell" data-console><button class="dpad-down"></button><button class="dpad-up"></button><button class="dpad-left"></button><button class="dpad-right"></button><button class="button-a"></button><button class="button-b"></button><div class="lcd-links"><a href="#target" class="is-selected" data-screen-link="0">Link</a></div></div></div></div>';
	vi.stubGlobal("matchMedia", (query: string) => ({
		get matches() {
			return query.includes("motion") ? reduced : fine;
		},
		addEventListener: (_: string, fn: () => void) => {
			motionChange = fn;
		},
		removeEventListener: vi.fn(),
	}));
	vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
		raf = fn;
		return 1;
	});
	vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
it("models wrapping, bounds, panels, reset and invalid link counts", () => {
	let state = transition(initialHandheld, { type: "move", delta: -1 }, 4);
	expect(state.selected).toBe(3);
	state = transition(state, { type: "move", delta: 1 }, 4);
	expect(state.selected).toBe(0);
	state = transition(state, { type: "select" }, 4);
	expect(state.panel).toBe("about");
	expect(transition(state, { type: "select" }, 4).panel).toBe("home");
	expect(transition(state, { type: "back" }, 4).panel).toBe("home");
	expect(transition(state, { type: "move", delta: 1 }, 4).panel).toBe("home");
	expect(transition(state, { type: "focus", index: 9 }, 4).selected).toBe(3);
	expect(transition(state, { type: "focus", index: -2 }, 4).selected).toBe(0);
	expect(transition(state, { type: "start" }, 4)).toEqual({
		...initialHandheld,
		boot: 1,
	});
	for (const count of [0, 0.5])
		expect(() => transition(state, { type: "back" }, count)).toThrow();
});
it("activates the selected real link or returns from about", () => {
	const click = vi.fn((event: Event) => event.preventDefault());
	document.querySelector("a")?.addEventListener("click", click);
	const back = vi.fn();
	activate(initialHandheld, back);
	expect(click).toHaveBeenCalledOnce();
	activate({ ...initialHandheld, panel: "about" }, back);
	expect(back).toHaveBeenCalledOnce();
	activate({ ...initialHandheld, selected: 99 }, back);
});
it("keyboard respects focus and browser modifiers; teardown cancels frames", () => {
	const cleanup = setupHandheld();
	const clicks = vi.fn();
	for (const button of document.querySelectorAll("button"))
		button.addEventListener("click", clicks);
	const press = (key: string, options: KeyboardEventInit = {}) =>
		document.dispatchEvent(new KeyboardEvent("keydown", { key, ...options }));
	for (const modifier of ["altKey", "ctrlKey", "metaKey"])
		press("ArrowDown", { [modifier]: true });
	document.getElementById("outside")?.focus();
	press("a");
	expect(clicks).not.toHaveBeenCalled();
	document.getElementById("app")?.focus();
	for (const key of [
		"ArrowDown",
		"ArrowUp",
		"ArrowLeft",
		"ArrowRight",
		"a",
		"b",
		"Enter",
	])
		press(key);
	expect(clicks).toHaveBeenCalledTimes(7);
	raf?.(0);
	expect(document.activeElement?.tagName).toBe("A");
	press("Enter");
	press("Escape");
	expect(clicks).toHaveBeenCalledTimes(7);
	cleanup();
	press("a");
	expect(clicks).toHaveBeenCalledTimes(7);
});
it("pointer tilt stays bounded, resets with motion settings and cleanup", () => {
	const scene = document.querySelector<HTMLElement>(".console-scene");
	const shell = document.querySelector<HTMLElement>(".console-shell");
	const cleanup = setupHandheld();
	const move = () =>
		scene?.dispatchEvent(
			new MouseEvent("pointermove", { clientX: 200, clientY: -100 }),
		);
	move();
	expect(shell?.style.getPropertyValue("--tilt-y")).toBe("");
	if (scene)
		vi.spyOn(scene, "getBoundingClientRect").mockReturnValue({
			left: 0,
			top: 0,
			width: 100,
			height: 100,
		} as DOMRect);
	move();
	expect(shell?.style.getPropertyValue("--tilt-y")).toBe("1.5deg");
	expect(shell?.style.getPropertyValue("--tilt-x")).toBe("1.5deg");
	reduced = true;
	motionChange?.();
	move();
	expect(shell?.style.getPropertyValue("--tilt-y")).toBe("0deg");
	reduced = false;
	fine = false;
	move();
	expect(shell?.style.getPropertyValue("--tilt-y")).toBe("0deg");
	fine = true;
	move();
	scene?.dispatchEvent(new Event("pointerleave"));
	expect(shell?.style.getPropertyValue("--tilt-x")).toBe("0deg");
	move();
	document.dispatchEvent(new Event("visibilitychange"));
	expect(shell?.style.getPropertyValue("--tilt-y")).toBe("0deg");
	cleanup();
	move();
	expect(shell?.style.getPropertyValue("--tilt-y")).toBe("0deg");
});
it("tolerates missing optional DOM without leaking listeners", () => {
	document.body.innerHTML = "";
	const cleanup = setupHandheld();
	document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
	raf?.(0);
	cleanup();
	document.body.innerHTML = '<div class="console-scene"></div>';
	const cleanup2 = setupHandheld();
	document.querySelector("div")?.dispatchEvent(new MouseEvent("pointermove"));
	cleanup2();
});
