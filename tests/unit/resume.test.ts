// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setupResume } from "../../packages/experience/resume";

let notify: IntersectionObserverCallback;
const observe = vi.fn();
const disconnect = vi.fn();
const print = vi.fn();
beforeEach(() => {
	vi.clearAllMocks();
	document.body.innerHTML = `<button data-print>Print</button>
	<aside class="resume-sidebar"><nav><a href="#one">One</a><a href="#two">Two</a></nav></aside>
	<section class="resume-section" id="one"></section><section class="resume-section" id="two"></section>`;
	vi.stubGlobal("print", print);
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			constructor(callback: IntersectionObserverCallback) {
				notify = callback;
			}
			observe = observe;
			disconnect = disconnect;
		},
	);
});
afterEach(() => vi.unstubAllGlobals());
function enter(id: string, isIntersecting = true) {
	const target = document.getElementById(id);
	if (!target) throw new Error("Missing section fixture");
	notify(
		[
			{
				target,
				isIntersecting,
				boundingClientRect: target.getBoundingClientRect(),
				intersectionRect: target.getBoundingClientRect(),
				intersectionRatio: isIntersecting ? 1 : 0,
				rootBounds: null,
				time: 0,
			},
		],
		{} as IntersectionObserver,
	);
}
it("marks the visible section without clearing it for exiting sections", () => {
	setupResume();
	expect(observe).toHaveBeenCalledTimes(2);
	enter("one");
	expect(
		document.querySelector('[href="#one"]')?.getAttribute("aria-current"),
	).toBe("location");
	enter("two", false);
	expect(
		document.querySelector('[href="#one"]')?.getAttribute("aria-current"),
	).toBe("location");
	enter("two");
	expect(
		document.querySelector('[href="#one"]')?.hasAttribute("aria-current"),
	).toBe(false);
	expect(
		document.querySelector('[href="#two"]')?.getAttribute("aria-current"),
	).toBe("location");
});
it("prints once and disconnects all behavior on teardown", () => {
	const cleanup = setupResume();
	document.querySelector("button")?.click();
	expect(print).toHaveBeenCalledOnce();
	expect(cleanup).toBeTypeOf("function");
	if (typeof cleanup === "function") cleanup();
	document.querySelector("button")?.click();
	expect(print).toHaveBeenCalledOnce();
	expect(disconnect).toHaveBeenCalledOnce();
});
it("keeps print usable when observation is unavailable", () => {
	vi.stubGlobal("IntersectionObserver", undefined);
	const cleanup = setupResume();
	document.querySelector("button")?.click();
	expect(print).toHaveBeenCalledOnce();
	expect(typeof cleanup).toBe("function");
	cleanup();
});
it("tolerates a page without print or sections", () => {
	document.body.innerHTML = "";
	expect(() => setupResume()).not.toThrow();
	expect(observe).not.toHaveBeenCalled();
});
