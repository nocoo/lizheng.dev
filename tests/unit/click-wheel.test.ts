// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { setupClickWheel } from "../../packages/experience/click-wheel";

let wheel: HTMLElement;
beforeEach(() => {
	document.body.innerHTML = '<div id="wheel"><button>Next</button></div>';
	wheel = document.getElementById("wheel") as HTMLElement;
	vi.spyOn(wheel, "getBoundingClientRect").mockReturnValue({
		left: 0,
		top: 0,
		width: 200,
		height: 200,
	} as DOMRect);
	wheel.setPointerCapture = vi.fn();
	wheel.releasePointerCapture = vi.fn();
	wheel.hasPointerCapture = () => true;
});
function point(type: string, degrees: number, radius = 80, pointerId = 1) {
	wheel.dispatchEvent(
		Object.assign(
			new MouseEvent(type, {
				clientX: 100 + Math.cos((degrees * Math.PI) / 180) * radius,
				clientY: 100 + Math.sin((degrees * Math.PI) / 180) * radius,
				button: 0,
				bubbles: true,
				cancelable: true,
			}),
			{ pointerId },
		),
	);
}

it("rotates in both directions, crosses the angular seam and suppresses only dragged clicks", () => {
	const step = vi.fn();
	const cleanup = setupClickWheel(wheel, step);
	point("pointerdown", 170);
	point("pointermove", -150);
	expect(step).toHaveBeenCalledWith(1);
	point("pointermove", 155);
	expect(step).toHaveBeenLastCalledWith(-1);
	point("pointerup", 155);
	const click = new MouseEvent("click", { bubbles: true, cancelable: true });
	wheel.querySelector("button")?.dispatchEvent(click);
	expect(click.defaultPrevented).toBe(true);
	const normalClick = new MouseEvent("click", {
		bubbles: true,
		cancelable: true,
	});
	wheel.querySelector("button")?.dispatchEvent(normalClick);
	expect(normalClick.defaultPrevented).toBe(false);
	cleanup();
});

it("ignores the center, stray pointers, secondary buttons and tiny movements", () => {
	const step = vi.fn();
	const cleanup = setupClickWheel(wheel, step);
	point("pointermove", 100);
	point("pointerdown", 0, 20);
	point("pointermove", 90);
	wheel.dispatchEvent(new MouseEvent("pointerdown", { button: 2 }));
	expect(step).not.toHaveBeenCalled();
	point("pointerdown", 0);
	point("pointermove", 80, 80, 2);
	point("pointerup", 80, 80, 2);
	point("pointermove", 8);
	expect(step).not.toHaveBeenCalled();
	point("pointermove", 40);
	expect(step).toHaveBeenCalledWith(1);
	point("pointercancel", 40);
	point("pointermove", 90);
	expect(step).toHaveBeenCalledTimes(1);
	cleanup();
	point("pointerdown", 0);
	point("pointermove", 90);
	expect(step).toHaveBeenCalledTimes(1);
});

it("handles counterclockwise seam crossings and releases captured pointers on teardown", () => {
	const step = vi.fn();
	const cleanup = setupClickWheel(wheel, step);
	point("pointerdown", -170);
	point("pointermove", 140);
	expect(step).toHaveBeenCalledWith(-1);
	cleanup();
	expect(wheel.releasePointerCapture).toHaveBeenCalledWith(1);
});

it("ends a press released outside the wheel before capture without turning later hover into a drag", () => {
	const step = vi.fn();
	const cleanup = setupClickWheel(wheel, step);
	point("pointerdown", 0);
	point("pointermove", 5);
	document.dispatchEvent(
		Object.assign(new MouseEvent("pointerup", { bubbles: true }), {
			pointerId: 1,
		}),
	);
	point("pointermove", 100);
	expect(step).not.toHaveBeenCalled();
	cleanup();
});

it("never carries a cancelled drag into the next center or keyboard click", () => {
	const step = vi.fn();
	const cleanup = setupClickWheel(wheel, step);
	point("pointerdown", 0);
	point("pointermove", 70);
	point("pointercancel", 70);
	point("pointerdown", 0, 0);
	const click = new MouseEvent("click", { bubbles: true, cancelable: true });
	wheel.querySelector("button")?.dispatchEvent(click);
	expect(click.defaultPrevented).toBe(false);
	cleanup();
});
