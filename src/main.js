// Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
const html = document.documentElement;

themeToggle.addEventListener("click", () => {
	const currentTheme = html.getAttribute("data-theme");
	const newTheme = currentTheme === "dark" ? "light" : "dark";
	html.setAttribute("data-theme", newTheme);
	try {
		localStorage.setItem("theme", newTheme);
	} catch {}
});

// Set current year in footer
const copyrightEl = document.getElementById("copyright");
if (copyrightEl) {
	const year = new Date().getFullYear();
	copyrightEl.textContent = `© ${year} Zheng Li. All rights reserved.`;
}
