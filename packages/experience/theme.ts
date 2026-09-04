export type Theme = "light" | "dark";
function savedTheme(): Theme | undefined {
	try {
		const value = localStorage.getItem("zl-theme");
		return value === "light" || value === "dark" ? value : undefined;
	} catch {
		return undefined;
	}
}
export function setupPreferences() {
	const system = window.matchMedia("(prefers-color-scheme: dark)");
	const buttons = document.querySelectorAll<HTMLButtonElement>(
		"[data-theme-toggle]",
	);
	let preference = savedTheme();
	const apply = (theme: Theme) => {
		document.documentElement.dataset.theme = theme;
		document.documentElement.style.colorScheme = theme;
		for (const button of buttons)
			button.setAttribute("aria-pressed", String(theme === "dark"));
	};
	const toggle = () => {
		preference =
			document.documentElement.dataset.theme === "dark" ? "light" : "dark";
		apply(preference);
		try {
			localStorage.setItem("zl-theme", preference);
		} catch {
			/* Keep the in-memory preference when storage is denied. */
		}
	};
	const followSystem = () => {
		if (!preference) apply(system.matches ? "dark" : "light");
	};
	apply(preference ?? (system.matches ? "dark" : "light"));
	for (const button of buttons) button.addEventListener("click", toggle);
	system.addEventListener("change", followSystem);
	return () => {
		for (const button of buttons) button.removeEventListener("click", toggle);
		system.removeEventListener("change", followSystem);
	};
}
