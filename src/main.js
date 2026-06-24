// Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
const html = document.documentElement;

const themeLabels = {
	en: { dark: "Switch to dark theme", light: "Switch to light theme" },
	zh: { dark: "切换到深色主题", light: "切换到浅色主题" },
};
const themeLang = html.getAttribute("lang") === "zh" ? "zh" : "en";
const syncToggle = () => {
	if (!themeToggle) return;
	const dark = html.getAttribute("data-theme") === "dark";
	themeToggle.setAttribute("aria-pressed", String(dark));
	themeToggle.setAttribute(
		"aria-label",
		themeLabels[themeLang][dark ? "light" : "dark"],
	);
};
syncToggle();

if (themeToggle) {
	themeToggle.addEventListener("click", () => {
		const currentTheme = html.getAttribute("data-theme");
		const newTheme = currentTheme === "dark" ? "light" : "dark";
		html.setAttribute("data-theme", newTheme);
		try {
			localStorage.setItem("theme", newTheme);
		} catch {}
		syncToggle();
	});
}

// Set current year in footer
const copyrightEl = document.getElementById("copyright");
if (copyrightEl) {
	const year = new Date().getFullYear();
	copyrightEl.textContent = `© ${year} Zheng Li. All rights reserved.`;
}
