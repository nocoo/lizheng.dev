import "@fontsource-variable/newsreader";
import "@fontsource-variable/source-sans-3";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/space-grotesk";
import "../../packages/experience/base.css";
import "./resume.css";
import { setupPreferences } from "../../packages/experience/theme";

setupPreferences();
document
	.querySelector("[data-print]")
	?.addEventListener("click", () => window.print());
const sections = document.querySelectorAll(".resume-section");
const observer = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			document.querySelectorAll(".resume-sidebar nav a").forEach((link) => {
				if (link.getAttribute("href") === `#${entry.target.id}`)
					link.setAttribute("aria-current", "location");
				else link.removeAttribute("aria-current");
			});
		}
	},
	{ rootMargin: "-10% 0px -65% 0px" },
);
for (const section of sections) observer.observe(section);
