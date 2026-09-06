import type { Locale } from "../content/model";

type ThemePreference = "system" | "light" | "dark";
const nextTheme: Record<ThemePreference, ThemePreference> = {
	system: "light",
	light: "dark",
	dark: "system",
};
const labels = {
	en: {
		system: "Theme: System (automatic). Switch to light theme.",
		light: "Theme: Light. Switch to dark theme.",
		dark: "Theme: Dark. Switch to system (automatic).",
	},
	zh: {
		system: "主题：自动（跟随系统）；切换为浅色",
		light: "主题：浅色；切换为深色",
		dark: "主题：深色；切换为自动（跟随系统）",
	},
};

export function themeLabel(locale: Locale, preference: ThemePreference) {
	return labels[locale][preference];
}

function savedTheme(): ThemePreference {
	try {
		const value = localStorage.getItem("zl-theme");
		return value === "light" || value === "dark" ? value : "system";
	} catch {
		return "system";
	}
}

export function setupPreferences() {
	const system = window.matchMedia("(prefers-color-scheme: dark)");
	const buttons = document.querySelectorAll<HTMLButtonElement>(
		"[data-theme-toggle]",
	);
	let preference = savedTheme();
	const apply = () => {
		const theme =
			preference === "system"
				? system.matches
					? "dark"
					: "light"
				: preference;
		document.documentElement.dataset.theme = theme;
		document.documentElement.dataset.themePreference = preference;
		document.documentElement.style.colorScheme = theme;
		for (const button of buttons) {
			const label = themeLabel(
				button.dataset.themeLocale === "zh" ? "zh" : "en",
				preference,
			);
			button.setAttribute("aria-label", label);
			button.title = label;
		}
	};
	const toggle = () => {
		preference = nextTheme[preference];
		apply();
		try {
			localStorage.setItem("zl-theme", preference);
		} catch {
			/* Keep the in-memory preference when storage is denied. */
		}
	};
	const followSystem = () => {
		if (preference === "system") apply();
	};
	apply();
	for (const button of buttons) button.addEventListener("click", toggle);
	system.addEventListener("change", followSystem);
	return () => {
		for (const button of buttons) button.removeEventListener("click", toggle);
		system.removeEventListener("change", followSystem);
	};
}
