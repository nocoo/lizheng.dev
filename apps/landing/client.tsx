import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/geist-mono";
import "@fontsource/silkscreen/400.css";
import "../../packages/experience/base.css";
import "./landing.css";
import { hydrateRoot } from "react-dom/client";
import type { PageContent } from "../../packages/content/model";
import { setupPreferences } from "../../packages/experience/theme";
import { LandingPage } from "./LandingPage";

const data = document.getElementById("page-data");
const root = document.getElementById("app");
if (root && data?.textContent) {
	const content: PageContent = JSON.parse(data.textContent);
	hydrateRoot(root, <LandingPage content={content} />);
}
setupPreferences();
const scene = document.querySelector<HTMLElement>(".console-scene");
const shell = document.querySelector<HTMLElement>(".console-shell");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (
	scene &&
	shell &&
	window.matchMedia("(hover: hover) and (pointer: fine)").matches
) {
	scene.addEventListener("pointermove", (event) => {
		if (reducedMotion.matches) return;
		const rect = scene.getBoundingClientRect();
		shell.style.setProperty(
			"--tilt-y",
			`${((event.clientX - rect.left) / rect.width - 0.5) * 3}deg`,
		);
		shell.style.setProperty(
			"--tilt-x",
			`${-((event.clientY - rect.top) / rect.height - 0.5) * 3}deg`,
		);
	});
	scene.addEventListener("pointerleave", () => {
		shell.style.setProperty("--tilt-y", "0deg");
		shell.style.setProperty("--tilt-x", "0deg");
	});
}

document.addEventListener("keydown", (event) => {
	if (event.altKey || event.ctrlKey || event.metaKey) return;
	const active = document.activeElement;
	const insideConsole = active?.closest("[data-console]");
	if (active && active !== document.body && active !== root && !insideConsole)
		return;
	if (event.key === "Enter" && insideConsole) return;
	const labels: Record<string, string> = {
		ArrowDown: ".dpad-down",
		ArrowUp: ".dpad-up",
		ArrowLeft: ".dpad-left",
		ArrowRight: ".dpad-right",
		Enter: ".button-a",
		a: ".button-a",
		b: ".button-b",
	};
	const selector = labels[event.key];
	if (selector) {
		event.preventDefault();
		document.querySelector<HTMLButtonElement>(selector)?.click();
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			requestAnimationFrame(() =>
				document
					.querySelector<HTMLAnchorElement>(".lcd-links .is-selected")
					?.focus({ preventScroll: true }),
			);
		}
	}
});
