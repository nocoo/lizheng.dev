import { type DeviceGalleryController, deviceChapters } from "./device-gallery";

export function setupDeviceGallery(
	root: HTMLElement,
	gallery: DeviceGalleryController,
	onLinkHover?: (index: number) => void,
) {
	const scene = root.querySelector<HTMLElement>(".console-scene");
	const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const updateMotion = () => gallery.setReducedMotion(motion.matches);
	const visibility = () => gallery.pause("visibility", document.hidden);
	const enter = (event: PointerEvent) => {
		if (event.pointerType !== "touch") gallery.pause("pointer", true);
	};
	const leave = () => gallery.pause("pointer", false);
	let keyboardFocus = true;
	const point = () => {
		keyboardFocus = false;
		gallery.pause("focus", false);
	};
	const focus = () => gallery.pause("focus", keyboardFocus);
	let pointerPosition: { x: number; y: number } | undefined;
	const hover = (event: PointerEvent) => {
		const moved =
			!pointerPosition ||
			pointerPosition.x !== event.clientX ||
			pointerPosition.y !== event.clientY;
		pointerPosition = { x: event.clientX, y: event.clientY };
		if (
			!moved ||
			event.pointerType === "touch" ||
			!(event.target instanceof Element) ||
			!root.contains(event.target)
		)
			return;
		const link = event.target.closest<HTMLElement>("[data-screen-link]");
		if (
			link?.closest("[data-device-active]") &&
			!link.classList.contains("is-selected")
		)
			onLinkHover?.(Number(link.dataset.screenLink));
	};
	const blur = (event: FocusEvent) => {
		if (
			!(event.relatedTarget instanceof Node) ||
			!root.contains(event.relatedTarget)
		)
			gallery.pause("focus", false);
	};
	let focusFrame = 0;
	const keydown = (event: KeyboardEvent) => {
		if (
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			event.isComposing ||
			!(event.target instanceof Element)
		)
			return;
		keyboardFocus = true;
		const inside = root.contains(event.target);
		if (inside) gallery.pause("focus", true);
		if (
			event.defaultPrevented ||
			event.target.closest(
				'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
			) ||
			(!inside && event.target !== document.body && event.target.id !== "app")
		)
			return;
		const tab = event.target.closest<HTMLElement>("[data-chapter]");
		const current = gallery.getSnapshot().index;
		const last = deviceChapters.length - 1;
		const targets: Record<string, number> = {
			ArrowLeft: (current + last) % deviceChapters.length,
			ArrowRight: (current + 1) % deviceChapters.length,
		};
		if (tab) {
			targets.Home = 0;
			targets.End = last;
		}
		const next = targets[event.key];
		if (next === undefined) return;
		event.preventDefault();
		gallery.pause("focus", true);
		gallery.select(
			next,
			event.key === "ArrowLeft" || event.key === "Home" ? -1 : 1,
		);
		cancelAnimationFrame(focusFrame);
		if (tab) {
			root
				.querySelector<HTMLElement>(`[data-chapter="${next}"]`)
				?.focus({ preventScroll: true });
		} else {
			// Incoming screens mount after the store update; never leave focus on an inert object.
			focusFrame = requestAnimationFrame(() => {
				const device = root.querySelector("[data-device-active]");
				const link = device?.querySelector<HTMLElement>(
					"[data-screen-link].is-selected",
				);
				const target = link?.closest(".panel-about")
					? device?.querySelector<HTMLElement>(
							'[data-control="back"], .button-b',
						)
					: link;
				target?.focus({ preventScroll: true });
			});
		}
	};
	const observer =
		typeof IntersectionObserver === "undefined"
			? undefined
			: new IntersectionObserver(
					(entries) => {
						for (const entry of entries)
							gallery.pause("viewport", !entry.isIntersecting);
					},
					{ threshold: 0.25 },
				);
	if (scene) observer?.observe(scene);
	updateMotion();
	visibility();
	gallery.pause("focus", root.contains(document.activeElement));
	gallery.start();
	scene?.addEventListener("pointerenter", enter);
	scene?.addEventListener("pointerleave", leave);
	root.addEventListener("focusin", focus);
	root.addEventListener("focusout", blur);
	root.addEventListener("pointerdown", point);
	document.addEventListener("keydown", keydown);
	document.addEventListener("pointermove", hover);
	motion.addEventListener("change", updateMotion);
	document.addEventListener("visibilitychange", visibility);
	return () => {
		cancelAnimationFrame(focusFrame);
		observer?.disconnect();
		scene?.removeEventListener("pointerenter", enter);
		scene?.removeEventListener("pointerleave", leave);
		root.removeEventListener("focusin", focus);
		root.removeEventListener("focusout", blur);
		root.removeEventListener("pointerdown", point);
		document.removeEventListener("keydown", keydown);
		document.removeEventListener("pointermove", hover);
		motion.removeEventListener("change", updateMotion);
		document.removeEventListener("visibilitychange", visibility);
		gallery.stop();
	};
}
