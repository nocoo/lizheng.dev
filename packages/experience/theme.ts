export function setupPreferences() {
	const system = window.matchMedia("(prefers-color-scheme: dark)");
	const apply = (theme: string) => {
		document.documentElement.dataset.theme = theme;
		document.documentElement.style.colorScheme = theme;
	};
	document
		.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")
		.forEach((button) => {
			button.addEventListener("click", () => {
				const theme =
					document.documentElement.dataset.theme === "dark" ? "light" : "dark";
				apply(theme);
				try {
					localStorage.setItem("zl-theme", theme);
				} catch {
					/* Private browsing can deny storage. */
				}
			});
		});
	system.addEventListener("change", (event) => {
		try {
			if (localStorage.getItem("zl-theme")) return;
		} catch {
			/* Follow the system when storage is unavailable. */
		}
		apply(event.matches ? "dark" : "light");
	});
}
