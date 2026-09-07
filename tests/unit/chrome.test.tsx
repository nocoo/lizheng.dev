import { createRequire } from "node:module";
import { expect, it } from "vitest";
import { renderPage } from "../../packages/publishing/render";

const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
	JSDOM: new () => { window: { document: Document } };
};
const { document } = new JSDOM().window;

const links = (root: string) =>
	[...document.querySelectorAll(`${root} .surface-links a`)].map((anchor) => ({
		label: anchor.textContent?.replace(/\s+/g, "").trim(),
		href: anchor.getAttribute("href"),
		current: anchor.getAttribute("aria-current"),
	}));

for (const surface of ["landing", "resume"] as const)
	for (const locale of ["en", "zh"] as const)
		it(`${surface}/${locale} footer lists the same four destinations as the header`, async () => {
			document.documentElement.innerHTML = await renderPage(surface, locale);
			const header = links(".site-header");
			const footer = links(".site-footer");
			expect(header).toHaveLength(4);
			expect(footer).toEqual(header);
			expect(footer.at(-1)).toMatchObject({
				label: "Portfolio↗",
				href: "https://hexly.ai",
			});
			expect(footer.find((link) => link.current === "true")?.label).toBe(
				surface === "landing" ? "Play" : "Résumé",
			);
			expect(
				document
					.querySelector(".site-footer")
					?.classList.contains("site-footer-compact"),
			).toBe(surface === "landing");
			const back = document.querySelector('.site-footer a[href="#main"]');
			if (surface === "resume") {
				expect(back?.textContent).toMatch(
					locale === "zh" ? /返回顶部/ : /Back to top/,
				);
				expect(document.querySelector(".site-footer-bottom")).not.toBeNull();
			} else {
				expect(back).toBeNull();
				expect(document.querySelector(".site-footer-bottom")).toBeNull();
			}
		});
