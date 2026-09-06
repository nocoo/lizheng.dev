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
		(root.querySelector("[data-device-active]") ?? root)
			.querySelector<HTMLAnchorElement>(
				`[data-screen-link="${state.selected}"]`,
			)
			?.click();
}
const shortcuts: Record<string, string> = {
	ArrowDown: '[data-control="down"], .dpad-down',
	ArrowUp: '[data-control="up"], .dpad-up',
	Enter: '[data-control="open"], .button-a',
	a: '[data-control="open"], .button-a',
	b: '[data-control="back"], .button-b',
};
export function setupHandheld() {
	const scene = document.querySelector<HTMLElement>(".console-scene");
	const activeRoot = () =>
		document.querySelector<HTMLElement>("[data-device-active]") ?? document;
	const activeShell = () =>
		activeRoot().querySelector<HTMLElement>(
			"[data-device-shell], .console-shell",
		);
	const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
	let heldTilt: Animation[] = [];
	const releaseTilt = () => {
		for (const animation of heldTilt)
			if (animation.playState === "paused") animation.play();
		heldTilt = [];
	};
	const holdTilt = () => {
		for (const animation of activeShell()?.getAnimations?.() ?? []) {
			if (
				"transitionProperty" in animation &&
				animation.transitionProperty === "transform" &&
				animation.playState === "running"
			) {
				animation.pause();
				heldTilt.push(animation);
			}
		}
	};
	const over = (event: PointerEvent) => {
		if (event.target instanceof Element && event.target.closest("button, a"))
			holdTilt();
	};
	const reset = () => {
		releaseTilt();
		const shell = activeShell();
		shell?.style.setProperty("--tilt-y", "0deg");
		shell?.style.setProperty("--tilt-x", "0deg");
		shell?.style.setProperty("--light-x", "35%");
		shell?.style.setProperty("--light-y", "20%");
	};
	const move = (event: PointerEvent) => {
		// Hold the current pose: ignoring new tilt targets alone leaves the
		// previous transition moving small controls away from the pointer.
		if (
			event.buttons ||
			(event.target instanceof Element && event.target.closest("button, a"))
		) {
			holdTilt();
			return;
		}
		releaseTilt();
		const shell = activeShell();
		if (motion.matches || !pointer.matches || !scene || !shell) return;
		const rect = scene.getBoundingClientRect();
		if (!rect.width || !rect.height) return;
		const clamp = (value: number) => Math.max(-6, Math.min(6, value));
		shell.style.setProperty(
			"--tilt-y",
			`${clamp(((event.clientX - rect.left) / rect.width - 0.5) * 12)}deg`,
		);
		shell.style.setProperty(
			"--tilt-x",
			`${clamp(-((event.clientY - rect.top) / rect.height - 0.5) * 12)}deg`,
		);
		shell.style.setProperty(
			"--light-x",
			`${Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))}%`,
		);
		shell.style.setProperty(
			"--light-y",
			`${Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))}%`,
		);
	};
	let frame = 0;
	const keydown = (event: KeyboardEvent) => {
		if (
			event.defaultPrevented ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			event.isComposing
		)
			return;
		const active = document.activeElement;
		if (
			active?.closest(
				'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
			)
		)
			return;
		const inside = active?.closest("[data-console]");
		const vertical = event.key === "ArrowDown" || event.key === "ArrowUp";
		const galleryMenu = vertical && active?.closest("[data-gallery]");
		if (
			active &&
			active !== document.body &&
			active.id !== "app" &&
			!inside &&
			!galleryMenu
		)
			return;
		if (event.key === "Enter" && inside) return;
		const selector = shortcuts[event.key];
		if (!selector) return;
		event.preventDefault();
		activeRoot().querySelector<HTMLButtonElement>(selector)?.click();
		if (vertical) {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() =>
				activeRoot()
					.querySelector<HTMLAnchorElement>("[data-screen-link].is-selected")
					?.focus({ preventScroll: true }),
			);
		}
	};
	scene?.addEventListener("pointerover", over);
	scene?.addEventListener("pointermove", move);
	scene?.addEventListener("pointerleave", reset);
	motion.addEventListener("change", reset);
	document.addEventListener("visibilitychange", reset);
	document.addEventListener("keydown", keydown);
	return () => {
		cancelAnimationFrame(frame);
		scene?.removeEventListener("pointerover", over);
		scene?.removeEventListener("pointermove", move);
		scene?.removeEventListener("pointerleave", reset);
		motion.removeEventListener("change", reset);
		document.removeEventListener("visibilitychange", reset);
		document.removeEventListener("keydown", keydown);
		reset();
	};
}
