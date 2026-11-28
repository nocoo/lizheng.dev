import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import { loadContent } from "../../packages/content/model";
import { themeScript } from "../../packages/experience/theme-bootstrap";
import { llmsDocument } from "../../packages/publishing/documents";
import {
	canonicalHostRedirect,
	legacyBlogVerificationPaths,
	legacyRedirect,
	metadataFile,
	selectLocale,
	selectSurface,
	sitemapPagesXml,
} from "../../packages/publishing/routes";
import { securityHeaders } from "../../packages/publishing/security";
import {
	isTraksCollectScriptUrl,
	TRAKS_COLLECT_ORIGIN,
	traksCollectMarkup,
	traksStubScript,
} from "../../packages/publishing/traks-collect";

it("limits canonical host redirects to declared aliases and keeps local redirects isolated", () => {
	for (const host of [
		"lizheng.me",
		"constructor",
		"www.hexly.ai",
		"www.lizheng.me.evil.test",
		"www.landing.lizheng-test.localhost",
	]) {
		expect(
			canonicalHostRedirect(new URL(`https://${host}/en/`)),
		).toBeUndefined();
	}
	expect(
		canonicalHostRedirect(
			new URL("http://www.lizheng.me:8080/zh/?a=%20&b=1&b=2"),
		),
	).toBe("https://lizheng.me/zh/?a=%20&b=1&b=2");
	for (const surface of ["landing", "resume", "blog"]) {
		expect(
			canonicalHostRedirect(
				new URL(
					`http://www.${surface}.lizheng-test.localhost:17046/en/?q=%E4%BD%A0`,
				),
				true,
			),
		).toBe(`http://${surface}.lizheng-test.localhost:17046/en/?q=%E4%BD%A0`);
	}
});

it("recognizes the Traks collect script URL for isolated stubs", () => {
	expect(isTraksCollectScriptUrl(`${TRAKS_COLLECT_ORIGIN}/t.js`)).toBe(true);
	expect(isTraksCollectScriptUrl(`${TRAKS_COLLECT_ORIGIN}/other`)).toBe(false);
	expect(isTraksCollectScriptUrl("https://evil.test/t.js")).toBe(false);
	expect(isTraksCollectScriptUrl("")).toBe(false);
});

it("emits surface-specific Traks collect markup", () => {
	const resume = traksCollectMarkup("resume");
	const landing = traksCollectMarkup("landing");
	expect(resume).toContain('data-site="pb_live_zq1jbvt6hrll2zx01fk36hp7"');
	expect(resume).not.toContain('data-site="pb_live_ahl78eqd9kzx8sqgww66oag9"');
	expect(landing).toContain('data-site="pb_live_ahl78eqd9kzx8sqgww66oag9"');
	expect(landing).not.toContain('data-site="pb_live_zq1jbvt6hrll2zx01fk36hp7"');
	expect(resume).toContain(`${TRAKS_COLLECT_ORIGIN}/t.js`);
});

it("CSP permits bootstrap and Traks collect scripts", () => {
	const policy = securityHeaders["Content-Security-Policy"];
	expect(policy).toContain(
		createHash("sha256").update(themeScript).digest("base64"),
	);
	expect(policy).toContain(
		createHash("sha256").update(traksStubScript).digest("base64"),
	);
	expect(policy).toContain(TRAKS_COLLECT_ORIGIN);
	expect(securityHeaders["Cross-Origin-Opener-Policy"]).toBe("same-origin");
	expect(securityHeaders["Cross-Origin-Resource-Policy"]).toBe("same-origin");
});

it("lists reciprocal hreflang alternates in the pages sitemap", () => {
	const xml = sitemapPagesXml("https://lizheng.dev");
	expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
	for (const locale of ["en", "zh"]) {
		expect(xml).toContain(`<loc>https://lizheng.dev/${locale}/</loc>`);
	}
	expect(xml.match(/hreflang="en"/g)?.length).toBe(2);
	expect(xml.match(/hreflang="zh-CN"/g)?.length).toBe(2);
	expect(xml.match(/hreflang="x-default"/g)?.length).toBe(2);
});

it("keeps release legacy redirect checks aligned with legacy blog patterns", () => {
	for (const path of legacyBlogVerificationPaths) {
		expect(
			legacyRedirect(
				"landing",
				new URL(`https://lizheng.me${path}?ref=release`),
			),
		).toBe(`https://lizheng.blog${path}?ref=release`);
	}
	expect(
		legacyRedirect("landing", new URL("https://lizheng.me/sitemap.xml")),
	).toBeUndefined();
});

it("normalizes host and first preferred language", () => {
	expect(selectSurface("LIZHENG.ME:443")).toBe("landing");
	expect(selectSurface("")).toBe("resume");
	expect(selectLocale()).toBe("en");
	expect(selectLocale("ZH-cn,en")).toBe("zh");
	const landingSitemap = metadataFile("landing", "/sitemap.xml");
	expect(landingSitemap?.body).toContain("https://lizheng.me/zh/");
	expect(metadataFile("resume", "/sitemap.xml")?.body).toContain(
		"https://lizheng.dev/en/",
	);
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
		if (surface === "resume") expect(llms).toContain("## Page intro");
		expect(llms).toContain("https://hexly.ai/");
		expect(llms).toContain("https://basaltui.com/");
		expect(llms).toContain("https://his.fm/");
		expect(llms).toContain("[Portfolio]");
		expect(llms).toContain("[Journal]");
		const related = llms.split("## Related sites")[1]?.split("## ")[0] ?? "";
		expect(related).toContain("https://lizheng.blog/");
		if (surface === "resume") {
			expect(related).not.toContain("https://lizheng.dev/");
			expect(related).toContain("https://lizheng.me/");
		} else {
			expect(related).not.toContain("https://lizheng.me/");
			expect(related).toContain("https://lizheng.dev/");
		}
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
