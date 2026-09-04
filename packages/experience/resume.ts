export function setupResume() {
	const button = document.querySelector("[data-print]");
	const print = () => window.print();
	button?.addEventListener("click", print);
	const observer =
		typeof IntersectionObserver === "function"
			? new IntersectionObserver(
					(entries) => {
						for (const entry of entries) {
							if (!entry.isIntersecting) continue;
							for (const link of document.querySelectorAll(
								".resume-sidebar nav a",
							)) {
								if (link.getAttribute("href") === `#${entry.target.id}`)
									link.setAttribute("aria-current", "location");
								else link.removeAttribute("aria-current");
							}
						}
					},
					{ rootMargin: "-10% 0px -65% 0px" },
				)
			: undefined;
	for (const section of document.querySelectorAll(".resume-section"))
		observer?.observe(section);
	return () => {
		button?.removeEventListener("click", print);
		observer?.disconnect();
	};
}
