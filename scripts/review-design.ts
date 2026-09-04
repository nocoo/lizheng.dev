import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

// Manual design review aid: captures current output, without freezing draft layouts.
const output = ".design-review";
const origins = {
	resume: "https://lizheng-dev.dev.hexly.ai",
	landing: "https://lizheng-me.dev.hexly.ai",
};
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results: object[] = [];
try {
	for (const [surface, origin] of Object.entries(origins)) {
		for (const locale of ["en", "zh"]) {
			for (const colorScheme of ["light", "dark"] as const) {
				for (const viewport of [
					{ width: 1440, height: 900 },
					{ width: 390, height: 844 },
				]) {
					const page = await browser.newPage({ colorScheme, viewport });
					const errors: string[] = [];
					page.on("pageerror", (error) => errors.push(error.message));
					await page.route("**/*", (route) => {
						const url = new URL(route.request().url());
						return Object.values(origins).includes(url.origin)
							? route.continue()
							: route.abort();
					});
					await page.goto(`${origin}/${locale}/`);
					await page.evaluate(() => document.fonts.ready);
					await page.waitForTimeout(950);
					assert.equal(
						await page.locator("html").getAttribute("data-theme"),
						colorScheme,
					);
					assert.equal(
						await page.locator("html").getAttribute("lang"),
						locale === "zh" ? "zh-CN" : "en",
					);
					assert.equal(
						await page.evaluate(() => document.documentElement.scrollWidth),
						viewport.width,
						`${surface}: horizontal overflow`,
					);
					if (surface === "resume") {
						assert.equal(await page.locator(".resume-section").count(), 6);
						assert.equal(
							await page.locator(".section-experience li").count(),
							13,
						);
					} else {
						assert.equal(await page.locator(".lcd-links a").count(), 4);
						assert.ok(
							await page
								.locator(".lcd-content")
								.evaluate(
									(element) => element.scrollHeight <= element.clientHeight + 1,
								),
							`${surface}/${locale}/${viewport.width}: screen content clipped`,
						);
					}
					assert.deepEqual(errors, [], `${surface}: browser errors`);
					const file = `${surface}-${locale}-${colorScheme}-${viewport.width}.png`;
					await page.screenshot({ path: `${output}/${file}`, fullPage: true });
					results.push({
						surface,
						locale,
						colorScheme,
						viewport,
						screenshot: file,
						errors,
					});
					await page.close();
				}
			}
		}
	}
	const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
	await page.goto(`${origins.landing}/en/`);
	await page.locator(".dpad-down").click();
	await page.waitForFunction(() =>
		document
			.querySelector("[data-screen-link='1']")
			?.classList.contains("is-selected"),
	);
	await page.locator(".lcd-links .is-selected").focus();
	await page.keyboard.press("ArrowDown");
	await page.waitForFunction(
		() => document.activeElement?.getAttribute("data-screen-link") === "2",
	);
	await page
		.getByRole("button", { name: "Select: Switch screen", exact: true })
		.click();
	assert.equal(
		await page.locator(".lcd-about").getAttribute("aria-hidden"),
		"false",
	);
	await page.getByRole("button", { name: "B: Back", exact: true }).click();
	assert.equal(
		await page.locator(".lcd-about").getAttribute("aria-hidden"),
		"true",
	);
	await page
		.getByRole("button", { name: "Start: Restart presentation", exact: true })
		.click();
	assert.equal(
		await page
			.locator(".lcd-links .is-selected")
			.getAttribute("data-screen-link"),
		"0",
	);
	await page.locator(".dpad-down").click();
	await page
		.getByRole("button", { name: "A: Open selected link", exact: true })
		.click();
	await page.waitForURL(`${origins.resume}/en/`);
	assert.equal(await page.locator(".resume-section").count(), 6);
	await page.goto(`${origins.landing}/en/`);
	await page.locator("[data-theme-toggle]").click();
	const theme = await page.locator("html").getAttribute("data-theme");
	await page.getByRole("link", { name: "中文", exact: true }).click();
	assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
	for (const viewport of [
		{ width: 320, height: 568 },
		{ width: 844, height: 390 },
	]) {
		await page.setViewportSize(viewport);
		for (const origin of Object.values(origins)) {
			await page.goto(`${origin}/zh/`);
			assert.equal(
				await page.evaluate(() => document.documentElement.scrollWidth),
				viewport.width,
				`${origin}: overflow at ${viewport.width}`,
			);
		}
	}
	const localGet = (surface: keyof typeof origins, path: string) =>
		page.request.get(`http://127.0.0.1:7046${path}`, {
			headers: { Host: new URL(origins[surface]).hostname },
			maxRedirects: 0,
		});
	for (const path of [
		"/2024/01/example?from=archive",
		"/category/tech",
		"/tag/ai",
		"/archive/2024",
		"/search?q=ai",
		"/feed.xml",
		"/feed",
		"/page/2",
		"/preview/article",
		"/sitemap.xml",
		"/admin",
		"/login",
	]) {
		const response = await localGet("landing", path);
		assert.equal(response.status(), 301);
		assert.equal(response.headers().location, `https://lizheng.blog${path}`);
	}
	assert.equal((await localGet("landing", "/sitemap-index.xml")).status(), 200);
	assert.equal((await localGet("resume", "/missing-page")).status(), 404);
	assert.equal((await localGet("landing", "/docs/README.md")).status(), 404);

	await page.close();
	await writeFile(
		`${output}/review.json`,
		`${JSON.stringify({ reviewedAt: new Date().toISOString(), results, interactions: "passed", routingSmoke: "passed" }, null, 2)}\n`,
	);
	console.info(
		`Reviewed ${results.length} visual combinations, physical controls, keyboard, preferences, and routing. Screenshots: ${output}/`,
	);
} finally {
	await browser.close();
}
