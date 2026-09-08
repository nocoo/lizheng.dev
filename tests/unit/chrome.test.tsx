import { readFileSync } from "node:fs";
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
			const destinations =
				locale === "zh"
					? ["主页", "博客", "简历", "作品集"]
					: ["Play", "Journal", "Résumé", "Portfolio"];
			expect(header.map((link) => link.label)).toEqual(destinations);
			expect(footer).toEqual(header);
			expect(footer.at(-1)).toMatchObject({
				label: destinations[3],
				href: "https://hexly.ai",
			});
			expect(
				header.every(
					(link) =>
						link.label !== undefined &&
						(locale === "zh"
							? !/^[A-Za-z]/.test(link.label)
							: /^[A-Za-z]/.test(link.label)),
				),
			).toBe(true);
			expect(footer.find((link) => link.current === "true")?.label).toBe(
				surface === "landing" ? destinations[0] : destinations[2],
			);
			const other = locale === "en" ? "zh" : "en";
			const language = document.querySelector(".languages a");
			expect(language?.getAttribute("href")).toBe(`/${other}/`);
			expect(language?.querySelector("svg")).not.toBeNull();
			expect(language?.textContent?.replace(/\s+/g, "")).toBe("");
			expect(document.querySelector(".theme-system")).toBeNull();
			expect(document.querySelector(".theme-toggle .theme-sun")).not.toBeNull();
			expect(
				document.querySelector(".theme-toggle .theme-moon"),
			).not.toBeNull();
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

it("keeps résumé footer rules inside the content column", () => {
	const css = readFileSync("packages/experience/base.css", "utf8");
	const footer = css.match(/^\.site-footer \{\n([^}]+)\}/m)?.[1] ?? "";
	const bottom = css.match(/^\.site-footer-bottom \{\n([^}]+)\}/m)?.[1] ?? "";
	expect(footer).not.toMatch(/border-top:\s*1px/);
	expect(bottom).not.toMatch(/border-top:\s*1px/);
	expect(css).toMatch(/\.site-footer:not\(\.site-footer-compact\)::before/);
	expect(css).toMatch(/\.site-footer-bottom::before/);
	expect(css).toMatch(/\.site-footer-compact \{\n[^}]*border-top:\s*1px/m);
});

it("hides the header preference divider when destinations wrap", () => {
	const css = readFileSync("packages/experience/base.css", "utf8");
	expect(css).toMatch(
		/\.preferences \{\n[^}]*border-left:\s*1px solid var\(--site-line\)/m,
	);
	expect(css).toMatch(
		/@media \(max-width: 640px\) \{[\s\S]*?\.preferences \{[^}]*border-left:\s*none/,
	);
});
