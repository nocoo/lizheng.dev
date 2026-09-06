import { expect, test } from "@playwright/test";
import sharp from "sharp";
import manifest from "../../package.json" with { type: "json" };

const { version } = manifest;

import { assertLocalRequest } from "../../packages/quality/isolation";

const base = "http://127.0.0.1:17046";
for (const surface of ["resume", "landing"])
	for (const prefix of ["", "www."]) {
		const host = `${prefix}${surface}.lizheng-test.localhost`;
		test(`${host}: complete route matrix and real assets`, async ({
			request,
		}) => {
			async function get(path: string, headers: Record<string, string> = {}) {
				assertLocalRequest(base + path);
				return request.get(base + path, {
					headers: { Host: host, ...headers },
					maxRedirects: 0,
				});
			}
			const live = await get("/api/live");
			expect(await live.json()).toMatchObject({
				version,
				surface,
				status: "ok",
			});
			expect(live.headers()["cache-control"]).toBe("no-store");
			for (const [accept, locale] of [
				["zh-CN", "zh"],
				["en-US", "en"],
			]) {
				const root = await get("/", { "Accept-Language": accept ?? "" });
				expect(root.status()).toBe(302);
				expect(root.headers().location).toBe(`http://${host}/${locale}/`);
			}
			for (const locale of ["en", "zh"]) {
				const page = await get(`/${locale}/`);
				expect(page.status()).toBe(200);
				expect(page.headers()["cache-control"]).toBe(
					"public, max-age=0, must-revalidate, no-transform",
				);
				expect(page.headers().link).toContain('rel="service-doc"');
				expect(page.headers().link).toContain(
					`/${locale}/content.md>; rel="alternate"`,
				);
				const html = await page.text();
				const imageUrl = /<meta property="og:image" content="([^"]+)"/.exec(
					html,
				)?.[1];
				expect(imageUrl).toBeTruthy();
				const imagePath = new URL(imageUrl as string).pathname;
				const image = await get(imagePath, {
					"User-Agent": "facebookexternalhit/1.1",
				});
				expect(image.status()).toBe(200);
				expect(image.headers()["content-type"]).toContain("image/jpeg");
				expect(image.headers()["cache-control"]).toContain("immutable");
				expect(await sharp(await image.body()).metadata()).toMatchObject({
					width: 1200,
					height: 630,
				});
				expect(html).toContain(
					`<html lang="${locale === "zh" ? "zh-CN" : "en"}">`,
				);
				expect(html.replace(/<!--.*?-->/g, "")).toContain(`v${version}`);
				expect(html).toContain(
					surface === "resume" ? "resume-document" : "console-shell",
				);
				expect(html).not.toContain("{{");
				expect(page.headers()["content-security-policy"]).toContain(
					"frame-ancestors 'none'",
				);
				expect((await get(`/${locale}`)).status()).toBe(200);
				const head = await request.head(`${base}/${locale}/`, {
					headers: { Host: host },
					maxRedirects: 0,
				});
				expect(head.status()).toBe(200);
				expect(head.headers()["cache-control"]).toBe(
					page.headers()["cache-control"],
				);
				expect(await head.body()).toHaveLength(0);
				const md = await get(`/${locale}/content.md`);
				expect(md.status()).toBe(200);
				expect(md.headers()["cache-control"]).toBe(
					"public, max-age=0, must-revalidate",
				);
				expect(md.headers()["content-type"]).toContain("text/markdown");
				expect(md.headers().link).toContain(`/${locale}/>; rel="canonical"`);
				expect(await md.text()).toContain(`surface: "${surface}"`);
				expect(await (await get(`/${locale}.md`)).text()).toBe(await md.text());
				const assets = new Set(
					[
						...html.matchAll(
							/(?:src|href)="(\/(?:assets|design-assets)\/[^"?]+)"/g,
						),
					].map((match) => match[1] as string),
				);
				expect(assets.size).toBeGreaterThan(3);
				for (const path of assets) {
					const asset = await get(path);
					expect(asset.status(), path).toBe(200);
					expect(asset.headers()["cache-control"], path).not.toContain(
						"no-transform",
					);
					if (path.endsWith(".css"))
						for (const font of (await asset.text()).matchAll(
							/url\((?:"|')?(\/assets\/[^)"']+)/g,
						))
							expect((await get(font[1] as string)).status()).toBe(200);
				}
			}
			for (const path of [
				"/robots.txt",
				"/llms.txt",
				"/sitemap-index.xml",
				"/sitemap-pages.xml",
				"/favicon.svg",
			])
				expect((await get(path)).status()).toBe(200);
			const llms = await get("/llms.txt", {
				"User-Agent": "Python-urllib/3.14",
			});
			expect(llms.headers()["content-type"]).toContain("text/plain");
			expect(await llms.text()).toContain(
				"Public pages welcome search and AI crawlers.",
			);
			expect(await llms.text()).toContain(
				surface === "resume" ? "微软首席软件工程经理" : "六个可交互的设备界面",
			);
			for (const path of [
				"/_sites/landing/en/index.html",
				"/docs/content/03-landing-en.md",
				"/cover/en/",
				"/assets/missing.js",
				"/api/unknown",
			])
				expect((await get(path)).status(), path).toBe(404);
			expect((await get("/unknown")).status()).toBe(404);
			for (const path of [
				"/2024/01/post",
				"/category/tech",
				"/tag/js",
				"/archive",
				"/search",
				"/feed.xml",
				"/feed",
				"/page/2",
				"/preview/secret",
				"/sitemap.xml",
				"/admin",
				"/login",
			]) {
				const result = await get(`${path}?a=%20&b=1&b=2`);
				if (surface === "landing") {
					expect(result.status()).toBe(301);
					expect(result.headers().location).toBe(
						`https://lizheng.blog${path}?a=%20&b=1&b=2`,
					);
				} else expect(result.status()).not.toBe(301);
			}
		});
	}
