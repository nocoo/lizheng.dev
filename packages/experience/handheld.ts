export interface HandheldState {
	selected: number;
	panel: "home" | "about";
	boot: number;
}
export type HandheldAction =
	| { type: "move"; delta: number }
	| { type: "focus"; index: number }
	| { type: "select" | "back" | "start" };
export const initialHandheld: HandheldState = {
	selected: 0,
	panel: "home",
	boot: 0,
};
export function transition(
	state: HandheldState,
	action: HandheldAction,
	count: number,
): HandheldState {
	if (!Number.isInteger(count) || count < 1)
		throw new Error("Handheld requires links");
	switch (action.type) {
		case "move":
			return {
				...state,
				panel: "home",
				selected: (((state.selected + action.delta) % count) + count) % count,
			};
		case "focus":
			return {
				...state,
				selected: Math.max(0, Math.min(count - 1, action.index)),
			};
		case "select":
			return { ...state, panel: state.panel === "home" ? "about" : "home" };
		case "back":
			return { ...state, panel: "home" };
		case "start":
			return { ...initialHandheld, boot: state.boot + 1 };
	}
}
export function activate(
	state: HandheldState,
	back: () => void,
	root: Document = document,
) {
	if (state.panel === "about") back();
	else
		root
			.querySelector<HTMLAnchorElement>(
				`[data-screen-link="${state.selected}"]`,
			)
			?.click();
}
const shortcuts: Record<string, string> = {
	ArrowDown: ".dpad-down",
	ArrowUp: ".dpad-up",
	ArrowLeft: ".dpad-left",
	ArrowRight: ".dpad-right",
	Enter: ".button-a",
	a: ".button-a",
	b: ".button-b",
};
export function setupHandheld() {
	const scene = document.querySelector<HTMLElement>(".console-scene");
	const shell = document.querySelector<HTMLElement>(".console-shell");
	const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
	const reset = () => {
		shell?.style.setProperty("--tilt-y", "0deg");
		shell?.style.setProperty("--tilt-x", "0deg");
	};
	const move = (event: PointerEvent) => {
		if (motion.matches || !pointer.matches || !scene || !shell) return;
		const rect = scene.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		const clamp = (value: number) => Math.max(-1.5, Math.min(1.5, value));
		shell.style.setProperty(
			"--tilt-y",
			`${clamp(((event.clientX - rect.left) / rect.width - 0.5) * 3)}deg`,
		);
		shell.style.setProperty(
			"--tilt-x",
			`${clamp(-((event.clientY - rect.top) / rect.height - 0.5) * 3)}deg`,
		);
	};
	let frame = 0;
	const keydown = (event: KeyboardEvent) => {
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		const active = document.activeElement;
		const inside = active?.closest("[data-console]");
		if (active && active !== document.body && active.id !== "app" && !inside)
			return;
		if (event.key === "Enter" && inside) return;
		const selector = shortcuts[event.key];
		if (!selector) return;
		event.preventDefault();
		document.querySelector<HTMLButtonElement>(selector)?.click();
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() =>
				document
					.querySelector<HTMLAnchorElement>(".lcd-links .is-selected")
					?.focus({ preventScroll: true }),
			);
		}
	};
	scene?.addEventListener("pointermove", move);
	scene?.addEventListener("pointerleave", reset);
	motion.addEventListener("change", reset);
	document.addEventListener("visibilitychange", reset);
	document.addEventListener("keydown", keydown);
	return () => {
		cancelAnimationFrame(frame);
		scene?.removeEventListener("pointermove", move);
		scene?.removeEventListener("pointerleave", reset);
		motion.removeEventListener("change", reset);
		document.removeEventListener("visibilitychange", reset);
		document.removeEventListener("keydown", keydown);
		reset();
	};
}
