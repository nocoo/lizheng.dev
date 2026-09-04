// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { setupPreferences } from "../../packages/experience/theme";

let matches = false;
let change: (() => void) | undefined;
let remove: ReturnType<typeof vi.fn>;
beforeEach(() => {
	localStorage.clear();
	matches = false;
	change = undefined;
	remove = vi.fn();
	document.documentElement.dataset.theme = "light";
	document.body.innerHTML = "<button data-theme-toggle></button>";
	vi.stubGlobal("matchMedia", () => ({
		get matches() {
			return matches;
		},
		addEventListener: (_: string, callback: () => void) => {
			change = callback;
		},
		removeEventListener: remove,
	}));
});
it("ignores invalid saved themes and follows system changes", () => {
	localStorage.setItem("zl-theme", "invalid");
	setupPreferences();
	matches = true;
	change?.();
	expect(document.documentElement.dataset.theme).toBe("dark");
});
it("synchronizes pressed state and cleans listeners", () => {
	const cleanup = setupPreferences();
	const button = document.querySelector("button");
	button?.click();
	expect(button?.getAttribute("aria-pressed")).toBe("true");
	expect(cleanup).toBeTypeOf("function");
});
it("restores saved dark and light choices", () => {
	for (const theme of ["light", "dark"]) {
		localStorage.setItem("zl-theme", theme);
		matches = true;
		const cleanup = setupPreferences();
		expect(document.documentElement.dataset.theme).toBe(theme);
		matches = false;
		change?.();
		expect(document.documentElement.dataset.theme).toBe(theme);
		cleanup();
		expect(remove).toHaveBeenCalled();
	}
});
it("toggles both ways, persists, and stops after teardown", () => {
	const cleanup = setupPreferences();
	const button = document.querySelector("button");
	button?.click();
	button?.click();
	expect(localStorage.getItem("zl-theme")).toBe("light");
	cleanup();
	button?.click();
	expect(document.documentElement.dataset.theme).toBe("light");
});
it("survives denied storage while retaining a manual choice", () => {
	const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("denied");
	});
	const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("denied");
	});
	matches = true;
	const cleanup = setupPreferences();
	expect(document.documentElement.dataset.theme).toBe("dark");
	matches = false;
	change?.();
	expect(document.documentElement.dataset.theme).toBe("light");
	document.querySelector("button")?.click();
	change?.();
	expect(document.documentElement.dataset.theme).toBe("dark");
	cleanup();
	get.mockRestore();
	set.mockRestore();
});
