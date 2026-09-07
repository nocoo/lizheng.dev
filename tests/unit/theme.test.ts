// @vitest-environment jsdom
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setupPreferences } from "../../packages/experience/theme";
import { themeScript } from "../../packages/experience/theme-bootstrap";

let matches = false;
let change: (() => void) | undefined;
let remove: ReturnType<typeof vi.fn>;
const root = document.documentElement;
const button = () => document.querySelector("button") as HTMLButtonElement;
const runBootstrap = () =>
	runInNewContext(themeScript, {
		localStorage,
		document,
		matchMedia: window.matchMedia,
	});
beforeEach(() => {
	localStorage.clear();
	matches = false;
	change = undefined;
	remove = vi.fn();
	delete root.dataset.theme;
	delete root.dataset.themePreference;
	document.head.innerHTML =
		'<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f0f0e9"><meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1e2824">';
	document.body.innerHTML =
		'<button data-theme-toggle data-theme-locale="en"></button>';
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
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it.each([null, "invalid", "system"])(
	"defaults to live automatic mode for %s",
	(saved) => {
		if (saved) localStorage.setItem("zl-theme", saved);
		const cleanup = setupPreferences();
		expect(root.dataset.themePreference).toBe("system");
		expect(root.dataset.theme).toBe("light");
		expect(button().getAttribute("aria-label")).toMatch(/Light.*dark/);
		expect(button().hasAttribute("aria-pressed")).toBe(false);
		matches = true;
		change?.();
		expect(root.dataset.theme).toBe("dark");
		expect(
			[...document.querySelectorAll('meta[name="theme-color"]')].map((meta) =>
				meta.getAttribute("content"),
			),
		).toEqual(["#1e2824", "#1e2824"]);
		expect(root.style.colorScheme).toBe("dark");
		cleanup();
	},
);

it.each(["light", "dark"])(
	"restores the existing saved %s preference",
	(saved) => {
		localStorage.setItem("zl-theme", saved);
		matches = true;
		const cleanup = setupPreferences();
		expect(root.dataset.themePreference).toBe(saved);
		expect(root.dataset.theme).toBe(saved);
		matches = false;
		change?.();
		expect(root.dataset.theme).toBe(saved);
		cleanup();
		expect(remove).toHaveBeenCalledWith("change", change);
	},
);

it("switches automatic appearance to explicit light and dark without a system control", () => {
	matches = true;
	const cleanup = setupPreferences();
	expect(root.dataset.themePreference).toBe("system");
	expect(root.dataset.theme).toBe("dark");
	button().click();
	expect(root.dataset.themePreference).toBe("light");
	expect(root.dataset.theme).toBe("light");
	expect(localStorage.getItem("zl-theme")).toBe("light");
	button().click();
	expect(root.dataset.themePreference).toBe("dark");
	expect(root.dataset.theme).toBe("dark");
	matches = false;
	change?.();
	expect(root.dataset.theme).toBe("dark");
	button().click();
	expect(root.dataset.themePreference).toBe("light");
	cleanup();
	expect(remove).toHaveBeenCalledWith("change", change);
});

it("preserves the resolved palette when hydration or a preference change keeps the same theme", () => {
	runBootstrap();
	const observer = new MutationObserver(() => {});
	observer.observe(root, { attributes: true });
	const cleanup = setupPreferences();
	expect(observer.takeRecords()).toEqual([]);
	button().click();
	expect(root.dataset.themePreference).toBe("dark");
	expect(button().getAttribute("aria-label")).toMatch(/Dark.*light/);
	expect(localStorage.getItem("zl-theme")).toBe("dark");
	expect(observer.takeRecords().map((record) => record.attributeName)).toEqual(
		expect.arrayContaining(["data-theme", "data-theme-preference"]),
	);
	button().click();
	expect(root.dataset.theme).toBe("light");
	expect(root.style.colorScheme).toBe("light");
	observer.disconnect();
	cleanup();
});

it("announces the current preference and next action in both locales", () => {
	document.body.insertAdjacentHTML(
		"beforeend",
		'<button data-theme-toggle data-theme-locale="zh"></button>',
	);
	const cleanup = setupPreferences();
	const zh = document.querySelectorAll("button")[1] as HTMLButtonElement;
	expect(zh.getAttribute("aria-label")).toMatch(/浅色.*深色/);
	zh.click();
	expect(button().getAttribute("aria-label")).toMatch(/Dark.*light/);
	expect(zh.getAttribute("aria-label")).toMatch(/深色.*浅色/);
	zh.click();
	expect(button().getAttribute("aria-label")).toMatch(/Light.*dark/);
	expect(zh.getAttribute("aria-label")).toMatch(/浅色.*深色/);
	cleanup();
});

it("survives denied storage and keeps an in-memory manual choice", () => {
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("denied");
	});
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("denied");
	});
	matches = true;
	const cleanup = setupPreferences();
	expect(root.dataset.theme).toBe("dark");
	button().click();
	change?.();
	expect(root.dataset.theme).toBe("light");
	button().click();
	expect(root.dataset.themePreference).toBe("dark");
	matches = false;
	change?.();
	expect(root.dataset.theme).toBe("dark");
	cleanup();
});

it.each([null, "invalid", "system", "light", "dark"])(
	"bootstraps %s without a theme flash before hydration",
	(saved) => {
		if (saved) localStorage.setItem("zl-theme", saved);
		matches = true;
		runBootstrap();
		const preference = saved === "light" || saved === "dark" ? saved : "system";
		expect(root.dataset.themePreference).toBe(preference);
		expect(root.dataset.theme).toBe(
			preference === "system" ? "dark" : preference,
		);
		expect(root.style.colorScheme).toBe(root.dataset.theme);
		expect(
			[...document.querySelectorAll('meta[name="theme-color"]')].map((meta) =>
				meta.getAttribute("content"),
			),
		).toEqual(
			Array(2).fill(root.dataset.theme === "dark" ? "#1e2824" : "#f0f0e9"),
		);
	},
);

it("bootstraps automatic mode even when reading storage is denied", () => {
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("denied");
	});
	runBootstrap();
	expect(root.dataset.themePreference).toBe("system");
	expect(root.dataset.theme).toBe("light");
});
