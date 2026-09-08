import { expect, test } from "@playwright/test";
import { keepsakeIds } from "../../packages/experience/keepsakes";
import { assertLocalRequest } from "../../packages/quality/isolation";
import { chooseKeepsake } from "./keepsake-fixture";

test.beforeEach(async ({ context }) => {
	await context.route("**/*", (route) => {
		try {
			assertLocalRequest(route.request().url());
			return route.continue();
		} catch {
			return route.abort();
		}
	});
});

for (const surface of ["resume", "landing"]) {
	test(`${surface}: shared frame and portfolio stay available on every screen`, async ({
		page,
	}) => {
		for (const locale of ["en", "zh"]) {
			await page.goto(
				`http://${surface}.lizheng-test.localhost:27046/${locale}/`,
			);
			const destinations =
				locale === "zh"
					? ["主页", "博客", "简历", "作品集"]
					: ["Play", "Journal", "Résumé", "Portfolio"];
			const links = page.locator(".site-header .surface-links a");
			const footerLinks = page.locator(".site-footer .surface-links a");
			await expect(links).toHaveText(destinations);
			await expect(footerLinks).toHaveText(destinations);
			await expect(links.last()).toHaveAttribute("href", "https://hexly.ai");
			await expect(footerLinks.last()).toHaveAttribute(
				"href",
				"https://hexly.ai",
			);
			await expect(
				page.locator(`.site-header [data-surface-link="${surface}"]`),
			).toHaveAttribute("aria-current", "true");
			await expect(
				page.locator('.site-header [data-surface-link="blog"]'),
			).toHaveAttribute("href", "https://lizheng.blog/");
			const other = surface === "resume" ? "landing" : "resume";
			await expect(
				page.locator(`.site-header [data-surface-link="${other}"]`),
			).toHaveAttribute(
				"href",
				`https://lizheng.${other === "landing" ? "me" : "dev"}/${locale}/`,
			);
			for (const width of [320, 390, 640, 768, 769, 820, 1100, 1440, 1920]) {
				await page.setViewportSize({ width, height: 900 });
				for (const link of await links.all()) await expect(link).toBeVisible();
				expect(
					await page
						.locator(".site-header-inner")
						.evaluate((el) => el.getBoundingClientRect().width),
				).toBe(Math.min(width, 1500));
				expect(
					await page
						.locator(".site-footer")
						.evaluate((el) => el.getBoundingClientRect().width),
				).toBe(width);
				expect(
					await page
						.locator(".site-footer-inner")
						.first()
						.evaluate((el) => el.getBoundingClientRect().width),
				).toBe(Math.min(width, 1500));
				if (surface === "resume") {
					const rules = await page.evaluate(() => {
						const footer = document.querySelector(".site-footer");
						const inner = document.querySelector(
							".site-footer > .site-footer-inner",
						);
						const bottom = document.querySelector(".site-footer-bottom");
						if (!footer || !inner || !bottom) return null;
						const padding = Number.parseFloat(
							getComputedStyle(inner).paddingLeft,
						);
						const box = inner.getBoundingClientRect();
						return {
							footerBorder: getComputedStyle(footer).borderTopWidth,
							bottomBorder: getComputedStyle(bottom).borderTopWidth,
							topWidth: Number.parseFloat(
								getComputedStyle(footer, "::before").width,
							),
							bottomWidth: Number.parseFloat(
								getComputedStyle(bottom, "::before").width,
							),
							contentWidth: box.width - padding * 2,
						};
					});
					expect(rules).not.toBeNull();
					expect(rules?.footerBorder).toBe("0px");
					expect(rules?.bottomBorder).toBe("0px");
					expect(rules?.topWidth).toBe(rules?.contentWidth);
					expect(rules?.bottomWidth).toBe(rules?.contentWidth);
				}
				expect(
					await page
						.locator("main")
						.evaluate((el) => el.getBoundingClientRect().width),
				).toBe(Math.min(width, 1500));
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth <= innerWidth,
					),
				).toBe(true);
			}
		}
	});

	test(`${surface}: theme toggle switches light and dark without a system control`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme: "dark" });
		await page.goto(`http://${surface}.lizheng-test.localhost:27046/en/`);
		const html = page.locator("html");
		const toggle = page.locator("[data-theme-toggle]");
		await expect(html).toHaveAttribute("data-theme-preference", "system");
		await expect(html).toHaveAttribute("data-theme", "dark");
		await expect(
			page.locator('meta[name="theme-color"]').first(),
		).toHaveAttribute("content", "#1e2824");
		await expect(page.locator(".theme-system")).toHaveCount(0);
		await expect(page.locator(".theme-moon")).toBeVisible();
		await toggle.focus();
		await page.keyboard.press("Enter");
		await expect(html).toHaveAttribute("data-theme-preference", "light");
		await expect(html).toHaveAttribute("data-theme", "light");
		await expect(
			page.locator('meta[name="theme-color"]').last(),
		).toHaveAttribute("content", "#f0f0e9");
		await expect(page.locator(".theme-sun")).toBeVisible();
		await expect(toggle).toHaveAccessibleName(/Light.*dark/);
		await page.keyboard.press("Space");
		await expect(html).toHaveAttribute("data-theme-preference", "dark");
		await expect(page.locator(".theme-moon")).toBeVisible();
		await expect(
			page.locator('meta[name="theme-color"]').first(),
		).toHaveAttribute("content", "#1e2824");
		await page.emulateMedia({ colorScheme: "light" });
		await expect(html).toHaveAttribute("data-theme", "dark");
		await toggle.click();
		await expect(html).toHaveAttribute("data-theme-preference", "light");
		await expect(html).toHaveAttribute("data-theme", "light");
		await page.emulateMedia({ colorScheme: "dark" });
		await expect(html).toHaveAttribute("data-theme", "light");
		await page.reload();
		await expect(html).toHaveAttribute("data-theme-preference", "light");
		await expect(html).toHaveAttribute("data-theme", "light");
	});
}

for (const id of keepsakeIds)
	test(`${id}: portrait keepsake stays fixed through reading and theme changes`, async ({
		page,
	}) => {
		await chooseKeepsake(page, id);
		await page.goto("http://resume.lizheng-test.localhost:27046/en/");
		const image = page.locator(".resume-keepsake");
		await expect(image).toHaveAttribute(
			"src",
			`/design-assets/keepsakes/${id}.svg`,
		);
		await expect
			.poll(() =>
				image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
			)
			.toBeGreaterThan(0);
		await page.locator("[data-theme-toggle]").click();
		await page.locator('.resume-sidebar a[href="#experience"]').click();
		await expect(image).toHaveAttribute(
			"src",
			`/design-assets/keepsakes/${id}.svg`,
		);
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(image).toHaveAttribute(
			"src",
			`/design-assets/keepsakes/${id}.svg`,
		);
		await expect(image).toHaveAttribute("aria-hidden", "true");
		await page.emulateMedia({ media: "print" });
		await expect(image).toBeHidden();
		await page.emulateMedia({ media: "screen" });
		await page.setViewportSize({ width: 1440, height: 900 });
	});
