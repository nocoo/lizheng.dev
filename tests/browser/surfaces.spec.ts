import { expect, test } from "@playwright/test";
import { keepsakeIds } from "../../packages/experience/keepsakes";
import {
	routeIsolatedRequest,
	routeIsolatedRequestWithoutMedia,
} from "./isolated-route";
import { chooseKeepsake } from "./keepsake-fixture";

const origin = (surface: string) =>
	`http://${surface}.lizheng-test.localhost:27046`;

test.beforeEach(async ({ context }) => {
	await context.route("**/*", routeIsolatedRequest);
});

for (const surface of ["resume", "landing"] as const) {
	test(`${surface}: bilingual routes, shared frame, keepsake and clean console`, async ({
		page,
	}) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});
		if (surface === "resume") await chooseKeepsake(page, keepsakeIds[0]);

		for (const locale of ["en", "zh"] as const) {
			await page.goto(`${origin(surface)}/${locale}/`);
			await expect(page.locator("html")).toHaveAttribute(
				"lang",
				locale === "zh" ? "zh-CN" : "en",
			);
			const destinations =
				locale === "zh"
					? ["主页", "博客", "简历", "作品集"]
					: ["Play", "Journal", "Résumé", "Portfolio"];
			const links = page.locator(".site-header .surface-links a");
			await expect(links).toHaveText(destinations);
			await expect(page.locator(".site-footer .surface-links a")).toHaveCount(
				0,
			);
			await expect(page.locator(".site-version")).toHaveCount(0);
			await expect(page.locator(".site-footer-identity p")).toHaveText(
				"\u00a9 2026 Zheng Li. All rights reserved.",
			);
			await expect(
				page.locator(`.site-header [data-surface-link="${surface}"]`),
			).toHaveAttribute("aria-current", "true");
			await expect(links.last()).toHaveAttribute("href", "https://hexly.ai");

			if (surface === "resume") {
				await expect(page.locator(".resume-section")).toHaveCount(6);
				await expect(page.locator(".resume-prose li")).toHaveCount(13);
				await expect(page.locator(".resume-keepsake")).toHaveAttribute(
					"src",
					`/design-assets/keepsakes/${keepsakeIds[0]}.svg`,
				);
			} else {
				await expect(page.locator(".lcd-links a")).toHaveCount(4);
				await expect(page.locator(".console-shell")).toBeVisible();
			}

			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
		}
		expect(errors).toEqual([]);
	});
}

test("theme toggle switches light and dark and persists across reload", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "dark" });
	await page.goto(`${origin("resume")}/en/`);
	const html = page.locator("html");
	const toggle = page.locator("[data-theme-toggle]");
	await expect(html).toHaveAttribute("data-theme-preference", "system");
	await expect(html).toHaveAttribute("data-theme", "dark");
	await toggle.focus();
	await page.keyboard.press("Enter");
	await expect(html).toHaveAttribute("data-theme-preference", "light");
	await expect(html).toHaveAttribute("data-theme", "light");
	await page.reload();
	await expect(html).toHaveAttribute("data-theme-preference", "light");
	await expect(html).toHaveAttribute("data-theme", "light");
	await toggle.click();
	await expect(html).toHaveAttribute("data-theme", "dark");
});

test("no-JS mode preserves navigation, locale links and system theme", async ({
	browser,
}) => {
	const context = await browser.newContext({
		javaScriptEnabled: false,
		viewport: { width: 320, height: 568 },
	});
	await context.route("**/*", routeIsolatedRequestWithoutMedia);
	const page = await context.newPage();

	for (const surface of ["resume", "landing"] as const) {
		await page.goto(`${origin(surface)}/zh/`);
		await expect(page.locator("h1")).toBeVisible();
		await expect(page.locator(".site-header .surface-links a")).toHaveCount(4);
		await expect(page.locator('footer a[href="/zh/content.md"]')).toBeVisible();
		await expect(page.locator('footer a[href="/llms.txt"]')).toBeVisible();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	}

	await page.emulateMedia({ colorScheme: "dark" });
	await expect
		.poll(() =>
			page.evaluate(() => getComputedStyle(document.body).backgroundColor),
		)
		.toBe("rgb(30, 40, 36)");
	await page.emulateMedia({ colorScheme: "light" });
	await expect
		.poll(() =>
			page.evaluate(() => getComputedStyle(document.body).backgroundColor),
		)
		.toBe("rgb(240, 240, 233)");
	await context.close();
});
