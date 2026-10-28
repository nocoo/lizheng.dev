import { createHash } from "node:crypto";
import { marked, type Token } from "marked";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Markdown } from "../../apps/resume/Markdown";
import { renderPage, themeScript } from "../../packages/publishing/render";
import {
	canonicalHostRedirect,
	metadataFile,
	selectLocale,
	selectSurface,
	sitemapPagesXml,
} from "../../packages/publishing/routes";
import {
	isTraksCollectScriptUrl,
	TRAKS_COLLECT_ORIGIN,
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

import { securityHeaders } from "../../packages/publishing/security";

for (const surface of ["resume", "landing"] as const)
	for (const locale of ["en", "zh"] as const)
		for (const preview of [true, false])
			it(`publishes ${surface}/${locale} preview=${preview}`, async () => {
				const html = await renderPage(
					surface,
					locale,
					preview
						? undefined
						: {
								script: '/assets/client.js?x="<>&',
								css: ["/assets/style.css"],
							},
					preview,
				);
				const origin =
					surface === "resume" ? "https://lizheng.dev" : "https://lizheng.me";
				expect(html).toContain(`rel="canonical" href="${origin}/${locale}/"`);
				expect(html).toContain(`href="/${locale}/content.md"`);
				expect(html).toContain('hreflang="en"');
				expect(html).toContain('hreflang="zh-CN"');
				expect(html).toContain('hreflang="x-default"');
				expect(html.split("</head>")[0]).not.toContain("hrefLang=");
				expect(html).toContain('"@type":"ProfilePage"');
				expect(html).not.toContain("docs/archive");
				if (preview) expect(html).toContain("dev.hexly.ai");
				else expect(html).toContain("&quot;&lt;&gt;&amp;");
				if (surface === "resume") {
					expect(html).toContain("CN103248610");
					expect(html).toContain('id="beyond"');
					expect(html).toContain(
						'data-site="pb_live_zq1jbvt6hrll2zx01fk36hp7"',
					);
					expect(html).not.toContain(
						'data-site="pb_live_ahl78eqd9kzx8sqgww66oag9"',
					);
				} else {
					expect(html).toContain('id="page-data"');
					expect(html).toContain('"markdown":""');
					expect(html).toContain(
						'data-site="pb_live_ahl78eqd9kzx8sqgww66oag9"',
					);
					expect(html).not.toContain(
						'data-site="pb_live_zq1jbvt6hrll2zx01fk36hp7"',
					);
				}
				expect(html).toContain(`<script>${traksStubScript}</script>`);
				expect(html).toContain(`${TRAKS_COLLECT_ORIGIN}/t.js`);
			});
it("recognizes the Traks collect script URL for isolated stubs", () => {
	expect(isTraksCollectScriptUrl(`${TRAKS_COLLECT_ORIGIN}/t.js`)).toBe(true);
	expect(isTraksCollectScriptUrl(`${TRAKS_COLLECT_ORIGIN}/other`)).toBe(false);
	expect(isTraksCollectScriptUrl("https://evil.test/t.js")).toBe(false);
	expect(isTraksCollectScriptUrl("")).toBe(false);
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
it("normalizes host and first preferred language", () => {
	expect(selectSurface("LIZHENG.ME:443")).toBe("landing");
	expect(selectSurface("")).toBe("resume");
	expect(selectLocale()).toBe("en");
	expect(selectLocale("ZH-cn,en")).toBe("zh");
	expect(metadataFile("landing", "/sitemap.xml")).toBeUndefined();
});
it("renders supported inline Markdown as semantic escaped HTML", () => {
	const html = renderToStaticMarkup(
		<Markdown
			tokens={marked.lexer(
				"### Heading\n\n**bold** *italic* `code` \\*escaped\\* & <text>\n\n- list\n\n[line](https://example.com)  \nnext",
			)}
		/>,
	);
	expect(html).toContain("<strong>bold</strong>");
	expect(html).toContain("<em>italic</em>");
	expect(html).toContain("code");
	expect(html).toContain("<br/>");
	expect(html).toContain("<ul>");
});

it("safely handles malformed or unsupported render tokens", () => {
	const tokens = ["paragraph", "heading", "text", "strong", "em"].map(
		(type) => ({ type, raw: "", text: "" }),
	);
	const html = renderToStaticMarkup(
		<Markdown
			tokens={
				[
					...tokens,
					{ type: "link", raw: "", href: "javascript:alert(1)" },
					{ type: "unknown", raw: "" },
				] as Token[]
			}
		/>,
	);
	expect(html).not.toContain("javascript:");
	expect(html).toContain("<a>");
});
