import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { loadContent } from "../../packages/content/model";
import { llmsDocument } from "../../packages/publishing/documents";
import { Metadata } from "../../packages/publishing/Metadata";
import { renderPage } from "../../packages/publishing/render";

// Keep server rendering and source-file URLs in the Node environment.
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
	JSDOM: new () => { window: { document: Document } };
};
const { document } = new JSDOM().window;

it("keeps metadata text and structured data inert", async () => {
	const content = await loadContent("resume", "en");
	const value = '</script><script>alert("metadata")</script>';
	content.meta.description = value;
	document.head.innerHTML = renderToStaticMarkup(
		<Metadata content={content} profile={content} />,
	);
	expect(document.head.querySelectorAll("script")).toHaveLength(1);
	const graph = JSON.parse(
		document.head.querySelector("script")?.textContent ?? "{}",
	);
	expect(graph.description).toBe(value);
	expect(
		document.head
			.querySelector('meta[name="description"]')
			?.getAttribute("content"),
	).toBe(value);
});

for (const surface of ["resume", "landing"] as const)
	it(`${surface} publishes a bilingual llms index from public metadata`, async () => {
		const en = await loadContent(surface, "en");
		const zh = await loadContent(surface, "zh");
		const llms = llmsDocument(en, zh);
		for (const page of [en, zh]) {
			expect(llms).toContain(page.meta.title);
			expect(llms).toContain(page.meta.description);
			expect(llms).toContain(`${page.meta.canonical}content.md`);
		}
		expect(llms).toContain("/sitemap-index.xml");
		expect(llms).not.toContain("docs/");
		expect(() => llmsDocument(zh, en)).toThrow(/languages/);
		expect(() => llmsDocument(en, en)).toThrow(/languages/);
		expect(() =>
			llmsDocument(en, {
				...zh,
				surface: surface === "resume" ? "landing" : "resume",
			} as typeof zh),
		).toThrow(/surface/);
	});

const text = (selector: string) =>
	document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim();

for (const locale of ["en", "zh"] as const) {
	it(`exports the complete personal journey in ${locale}`, async () => {
		const content = await loadContent("landing", locale);
		for (const name of [
			"Game Boy",
			"Nokia 5300",
			"Macintosh Plus",
			"iPod Classic",
			"Garmin Edge 540",
			"Honda Africa Twin",
		])
			expect(content.markdown).toContain(`### ${name}`);
		expect(content.markdown).toContain(
			locale === "en"
				? "Here you can find my blog, résumé, GitHub and LinkedIn."
				: "这里可以找到我的博客、简历、GitHub 和 LinkedIn。",
		);
		document.documentElement.innerHTML = await renderPage("landing", locale);
		expect(document.querySelectorAll(".journey-directory h3")).toHaveLength(6);
		expect(text(".journey-directory")).toContain(
			locale === "en"
				? "Speed, gears and motorcycle instruments."
				: "车速、挡位与摩托仪表。",
		);
		expect(document.querySelectorAll(".device-layer")).toHaveLength(1);
	});
}

it("keeps identity and sentence boundaries in plain HTML text", async () => {
	document.documentElement.innerHTML = await renderPage("landing", "en");
	expect(text("h1")).toBe("A little bit of me.");
	expect(text(".intro-description")).toBe(
		"Software engineering and team leadership. Web, mobile, data and AI.",
	);
	expect(text(".lcd-identity h2")).toBe("Zheng Li");
	expect(text(".site-footer-identity p")).toMatch(/Zheng Li · v\d/);
	document.documentElement.innerHTML = await renderPage("resume", "en");
	expect(text(".resume-role")).toBe(
		"Principal Software Engineering Manager @ Microsoft",
	);
	expect(text(".resume-sidebar nav a")).toBe("01 Professional Summary");
	expect(text(".sidebar-location")).toContain("BEIJING 39.90°");
	expect(text(".site-footer-identity p")).toMatch(/reserved\. · v\d/);
});

for (const surface of ["landing", "resume"] as const)
	for (const locale of ["en", "zh"] as const)
		it(`${surface}/${locale} exposes localized sharing and public reading formats`, async () => {
			const origin = `https://lizheng.${surface === "landing" ? "me" : "dev"}`;
			document.documentElement.innerHTML = await renderPage(surface, locale);
			const meta = (name: string) =>
				document
					.querySelector(`meta[property="${name}"], meta[name="${name}"]`)
					?.getAttribute("content");
			expect(meta("og:title")).toBe(document.title);
			expect(meta("twitter:title")).toBe(document.title);
			expect(meta("og:description")).toBe(meta("description"));
			expect(meta("twitter:description")).toBe(meta("description"));
			if (locale === "zh") expect(document.title).toMatch(/[\u4e00-\u9fff]/);
			expect(meta("og:image")).toMatch(
				new RegExp(
					`^${origin}/design-assets/social/${surface}-${locale}\\.[a-f0-9]{12}\\.jpg$`,
				),
			);
			expect(meta("twitter:image")).toBe(meta("og:image"));
			expect(meta("twitter:image:alt")).toBe(meta("og:image:alt"));
			expect(meta("og:image:type")).toBe("image/jpeg");
			expect(meta("og:image:width")).toBe("1200");
			expect(meta("og:image:height")).toBe("630");
			expect(
				document
					.querySelector('head link[type="text/markdown"]')
					?.getAttribute("href"),
			).toBe(`${origin}/${locale}/content.md`);
			expect(
				document.querySelector(`footer a[href="/${locale}/content.md"]`),
			).not.toBeNull();
			expect(
				document.querySelector('footer a[href="/llms.txt"]'),
			).not.toBeNull();
			const graph = JSON.parse(
				document.querySelector('script[type="application/ld+json"]')
					?.textContent ?? "{}",
			);
			expect(graph.mainEntity["@id"]).toBe("https://lizheng.me/#person");
			expect(graph.mainEntity.sameAs).toEqual(
				expect.arrayContaining([
					"https://lizheng.me/",
					"https://lizheng.dev/",
					"https://x.com/zhengli",
				]),
			);
		});
