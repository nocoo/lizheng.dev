import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { assertLocalRequest } from "../../packages/quality/isolation";
import { chooseKeepsake } from "./keepsake-fixture";

const origin = (surface: string) =>
	`http://${surface}.lizheng-test.localhost:27046`;
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
for (const surface of ["resume", "landing"])
	for (const locale of ["en", "zh"])
		for (const theme of ["light", "dark"] as const)
			for (const width of [1440, 390]) {
				test(`${surface}/${locale}/${theme}/${width}: approved layout, content and accessibility`, async ({
					page,
				}, info) => {
					await page.setViewportSize({
						width,
						height: width === 390 ? 844 : 900,
					});
					await page.emulateMedia({ colorScheme: theme });
					await chooseKeepsake(page, "gameboy");
					const errors: string[] = [];
					page.on("pageerror", (error) => errors.push(error.message));
					page.on("console", (message) => {
						if (message.type() === "error") errors.push(message.text());
					});
					await page.goto(`${origin(surface)}/${locale}/`);
					await page.evaluate(async () => {
						await document.fonts.ready;
						await Promise.all(
							document
								.getAnimations()
								.filter(
									(animation) =>
										animation.effect?.getTiming().iterations !== Infinity,
								)
								.map((animation) => animation.finished),
						);
					});
					await expect(page.locator("html")).toHaveAttribute(
						"data-theme",
						theme,
					);
					await expect(page.locator("h1")).toBeVisible();
					await expect(page.locator(".site-header .brand-grid")).toBeVisible();
					await expect(page.locator(".site-version")).toContainText(
						/^v\d+\.\d+\.\d+$/,
					);
					expect(
						await page.evaluate(
							() => document.documentElement.scrollWidth <= innerWidth,
						),
					).toBe(true);
					if (surface === "resume") {
						await expect(page.locator(".resume-section")).toHaveCount(6);
						await expect(page.locator(".resume-prose li")).toHaveCount(13);
						await expect(
							page.locator(
								'a[href="https://patents.google.com/patent/CN103248610A"]',
							),
						).toBeVisible();
						expect(
							await page
								.locator(".portrait-frame > img:not(.resume-keepsake)")
								.evaluate((node) => getComputedStyle(node).filter),
						).toContain("saturate(0.9)");
					} else {
						await expect(page.locator(".lcd-links a")).toHaveCount(4);
						await expect(page.locator(".console-shell")).toBeVisible();
					}
					await expect(page.locator("footer")).toContainText("Zheng Li");
					if (surface === "landing")
						await page
							.locator(".gallery-stage")
							.hover({ position: { x: 1, y: 1 } });
					const results = await new AxeBuilder({ page })
						.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
						.analyze();
					await info.attach("axe", {
						body: JSON.stringify(results.violations, null, 2),
						contentType: "application/json",
					});
					expect(
						results.violations.map(({ id, nodes }) => ({
							id,
							nodes: nodes.map((node) => ({
								target: node.target,
								summary: node.failureSummary,
							})),
						})),
					).toEqual([]);
					await page.mouse.move(0, 0);
					await page.screenshot({
						path: info.outputPath("approved-layout.png"),
						fullPage: true,
						animations: "disabled",
					});
					if (info.project.name === "chromium")
						await expect(page).toHaveScreenshot(
							`${surface}-${locale}-${theme}-${width}.png`,
							{
								fullPage: true,
								animations: "disabled",
								mask: [page.locator(".site-version")],
								maxDiffPixelRatio: 0.001,
							},
						);
					expect(errors).toEqual([]);
					await page.locator("[data-theme-toggle]").click();
					await expect(page.locator("html")).toHaveAttribute(
						"data-theme-preference",
						"light",
					);
					await expect(page.locator("html")).toHaveAttribute(
						"data-theme",
						"light",
					);
					await page.locator("[data-theme-toggle]").click();
					await expect(page.locator("html")).toHaveAttribute(
						"data-theme-preference",
						"dark",
					);
					await page.reload();
					await expect(page.locator("html")).toHaveAttribute(
						"data-theme",
						"dark",
					);
					await page
						.locator(`.languages a[href="/${locale === "en" ? "zh" : "en"}/"]`)
						.click();
					await expect(page.locator("html")).toHaveAttribute(
						"lang",
						locale === "en" ? "zh-CN" : "en",
					);
				});
			}

test("handheld controls, keyboard, external links and motion", async ({
	page,
}) => {
	await page.goto(`${origin("landing")}/en/`);
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
	const navigations: string[] = [];
	await page
		.locator(".lcd-links")
		.evaluate((element) =>
			element.addEventListener("click", (event) => event.preventDefault()),
		);
	await page.exposeFunction("recordLink", (href: string) =>
		navigations.push(href),
	);
	await page.locator(".lcd-links").evaluate((element) =>
		element.addEventListener("click", (event) => {
			const anchor = (event.target as Element).closest("a");
			if (anchor)
				(
					window as unknown as { recordLink: (href: string) => void }
				).recordLink(anchor.href);
		}),
	);
	await page.locator(".button-a").click();
	await expect.poll(() => navigations).toEqual(["https://lizheng.blog/"]);
	await page.emulateMedia({ reducedMotion: "reduce" });
	expect(
		await page
			.locator(".console-shell")
			.evaluate((element) => getComputedStyle(element).animationName),
	).toBe("none");
});

for (const surface of ["resume", "landing"])
	test(`${surface}: no JavaScript, failed imagery, narrow and short viewports`, async ({
		browser,
	}) => {
		const context = await browser.newContext({
			javaScriptEnabled: false,
			viewport: { width: 320, height: 568 },
		});
		await context.route("**/*", (route) => {
			try {
				assertLocalRequest(route.request().url());
				return ["image", "font"].includes(route.request().resourceType())
					? route.abort()
					: route.continue();
			} catch {
				return route.abort();
			}
		});
		const page = await context.newPage();
		await page.goto(`${origin(surface)}/zh/`);
		await expect(page.locator("h1")).toBeVisible();
		await expect(page.locator(".site-header .surface-links a")).toHaveCount(3);
		for (const link of await page
			.locator(".site-header .surface-links a")
			.all())
			await expect(link).toBeVisible();
		await expect(
			page.locator(surface === "resume" ? ".resume-socials a" : ".lcd-links a"),
		).toHaveCount(4);
		for (const viewport of [
			{ width: 320, height: 568 },
			{ width: 768, height: 1024 },
			{ width: 844, height: 390 },
		]) {
			await page.setViewportSize(viewport);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
		}
		await context.close();
	});

test("handheld responds to touch on a narrow screen", async ({ browser }) => {
	const context = await browser.newContext({
		hasTouch: true,
		viewport: { width: 390, height: 844 },
	});
	await context.route("**/*", (route) => {
		try {
			assertLocalRequest(route.request().url());
			return route.continue();
		} catch {
			return route.abort();
		}
	});
	const page = await context.newPage();
	await page.goto(`${origin("landing")}/zh/`);
	// The introduction can put only the bottom-edge sliver of a key above the fold.
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

test("resume print retains identity and full document", async ({
	page,
	browserName,
}, info) => {
	await page.goto(`${origin("resume")}/en/`);
	await page.emulateMedia({ media: "print" });
	await expect(page.locator("h1")).toBeVisible();
	await expect(page.locator("#beyond")).toBeVisible();
	await expect(page.locator(".resume-section")).toHaveCount(6);
	if (browserName === "chromium")
		await page.pdf({
			path: info.outputPath("resume.pdf"),
			format: "A4",
			printBackground: true,
		});
});
