import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { routeIsolatedRequest } from "./isolated-route";

const origin = (surface: string) =>
	`http://${surface}.lizheng-test.localhost:27046`;

test.beforeEach(async ({ context }) => {
	await context.route("**/*", routeIsolatedRequest);
});

test("resume: accessibility, mobile contents drawer and print layout", async ({
	page,
}, info) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin("resume")}/en/`);
	await page.evaluate(async () => {
		await document.fonts.ready;
		await Promise.all(
			document
				.getAnimations()
				.filter(
					(animation) => animation.effect?.getTiming().iterations !== Infinity,
				)
				.map((animation) => animation.finished),
		);
	});
	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
		.analyze();
	await info.attach("axe-resume", {
		body: JSON.stringify(results.violations, null, 2),
		contentType: "application/json",
	});
	expect(results.violations).toEqual([]);

	await page.setViewportSize({ width: 375, height: 812 });
	const contents = page.locator(".resume-contents");
	const summary = contents.locator("summary");
	await expect(summary).toBeVisible();
	await expect(contents.locator("nav")).toBeHidden();
	await summary.focus();
	await page.keyboard.press("Enter");
	await expect(contents.locator("nav a")).toHaveCount(6);
	await contents.locator('a[href="#education"]').click();
	await expect(page).toHaveURL(/#education$/);

	await page.emulateMedia({ media: "print" });
	await expect(contents).toBeHidden();
	await expect(page.locator("#beyond")).toBeVisible();
	await expect(page.locator(".resume-section")).toHaveCount(6);
});

test("landing: accessibility, handheld controls, keyboard and reduced motion", async ({
	page,
}, info) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin("landing")}/en/`);
	await page.evaluate(async () => {
		await document.fonts.ready;
		await Promise.all(
			document
				.getAnimations()
				.filter(
					(animation) => animation.effect?.getTiming().iterations !== Infinity,
				)
				.map((animation) => animation.finished),
		);
	});
	await page.locator(".gallery-stage").hover({ position: { x: 1, y: 1 } });
	const results = await new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
		.analyze();
	await info.attach("axe-landing", {
		body: JSON.stringify(results.violations, null, 2),
		contentType: "application/json",
	});
	expect(results.violations).toEqual([]);

	await page.locator(".dpad-down").click();
	await expect(page.locator('.lcd-links a[data-screen-link="1"]')).toHaveClass(
		"is-selected",
	);
	await page.locator("body").click({ position: { x: 1, y: 500 } });
	await page.keyboard.press("ArrowDown");
	await expect(
		page.locator('.lcd-links a[data-screen-link="2"]'),
	).toBeFocused();
	await page.locator('[aria-label="Select: Switch screen"]').click();
	await expect(page.locator("#screen")).toHaveClass("lcd-screen panel-about");
	await page.locator(".button-a").click();
	await expect(page.locator("#screen")).toHaveClass("lcd-screen panel-home");
	await page.locator('[aria-label="Start: Restart presentation"]').click();
	await expect(page.locator('.lcd-links a[data-screen-link="0"]')).toHaveClass(
		"is-selected",
	);

	await page.emulateMedia({ reducedMotion: "reduce" });
	expect(
		await page
			.locator(".console-shell")
			.evaluate((element) => getComputedStyle(element).animationName),
	).toBe("none");
});

test("handheld responds to touch on a narrow viewport", async ({ browser }) => {
	const context = await browser.newContext({
		hasTouch: true,
		viewport: { width: 390, height: 844 },
	});
	await context.route("**/*", routeIsolatedRequest);
	const page = await context.newPage();
	await page.goto(`${origin("landing")}/zh/`);
	await page.locator(".console-scene").scrollIntoViewIfNeeded();
	await page.locator(".dpad-down").tap();
	await expect(
		page.locator('[data-device-active] [data-screen-link="1"]'),
	).toHaveClass("is-selected");
	await page.locator('[aria-label="Select：切换屏幕"]').tap();
	await expect(page.locator("#screen")).toHaveClass("lcd-screen panel-about");
	await page.locator(".button-b").tap();
	await expect(page.locator("#screen")).toHaveClass("lcd-screen panel-home");
	await context.close();
});
