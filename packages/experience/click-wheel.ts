export function setupClickWheel(
	wheel: HTMLElement,
	step: (delta: number) => void,
) {
	let pointer: number | null = null;
	let previous = 0;
	let accumulated = 0;
	let dragged = false;
	let center = { x: 0, y: 0 };
	const root = wheel.ownerDocument;
	const angle = (event: PointerEvent) =>
		(Math.atan2(event.clientY - center.y, event.clientX - center.x) * 180) /
		Math.PI;
	const start = (event: PointerEvent) => {
		if (event.button !== 0 || pointer !== null) return;
		dragged = false;
		const rect = wheel.getBoundingClientRect();
		center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		if (
			Math.hypot(event.clientX - center.x, event.clientY - center.y) <
			rect.width * 0.22
		)
			return;
		pointer = event.pointerId;
		previous = angle(event);
		accumulated = 0;
	};
	const move = (event: PointerEvent) => {
		if (pointer !== event.pointerId) return;
		const next = angle(event);
		accumulated += ((next - previous + 540) % 360) - 180;
		previous = next;
		const steps = Math.trunc(accumulated / 30);
		if (!steps) return;
		accumulated -= steps * 30;
		dragged = true;
		wheel.setPointerCapture(event.pointerId);
		event.preventDefault();
		step(steps);
	};
	const release = () => {
		const released = pointer;
		pointer = null;
		if (released !== null && wheel.hasPointerCapture(released))
			wheel.releasePointerCapture(released);
	};
	const end = (event: PointerEvent) => {
		if (pointer !== event.pointerId) return;
		release();
		if (event.type === "pointercancel") dragged = false;
	};
	const click = (event: MouseEvent) => {
		if (!dragged) return;
		dragged = false;
		event.preventDefault();
		event.stopImmediatePropagation();
	};
	wheel.addEventListener("pointerdown", start);
	wheel.addEventListener("pointermove", move);
	// A short press may leave the wheel before the rotation threshold captures it.
	root.addEventListener("pointerup", end, true);
	root.addEventListener("pointercancel", end, true);
	wheel.addEventListener("click", click, true);
	return () => {
		release();
		wheel.removeEventListener("pointerdown", start);
		wheel.removeEventListener("pointermove", move);
		root.removeEventListener("pointerup", end, true);
		root.removeEventListener("pointercancel", end, true);
		wheel.removeEventListener("click", click, true);
	};
}
