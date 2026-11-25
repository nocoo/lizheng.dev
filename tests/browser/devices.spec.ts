import { expect, type Page, test } from "@playwright/test";
import { routeIsolatedRequest } from "./isolated-route";

const origin = "http://landing.lizheng-test.localhost:27046";
const models = ["gameboy", "nokia", "macintosh", "ipod", "garmin", "honda"];

test.beforeEach(async ({ context }) => {
	await context.route("**/*", routeIsolatedRequest);
});

async function settle(page: Page) {
	await expect(page.locator(".is-exiting")).toHaveCount(0);
	await page.evaluate(async () => {
		await document.fonts.ready;
		await Promise.all(
			document
				.getAnimations()
				.filter(
					(animation) => animation.effect?.getTiming().iterations !== Infinity,
				)
				.map((animation) => animation.finished.catch(() => {})),
		);
	});
}

test("all six devices render across chapters with valid links and native controls", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/en/`);
	await page.getByRole("button", { name: "Pause autoplay" }).click();

	for (const [index, model] of models.entries()) {
		await page.locator(`[data-chapter="${index}"]`).click();
		await settle(page);
		const device = page.locator(`[data-device-active="${model}"]`);
		await expect(device).toBeVisible();
		const links = device.locator("[data-screen-link]");
		await expect(links).toHaveCount(4);

		if (index > 0) {
			await device.locator('[data-control="down"]').click();
			await expect(links.nth(1)).toHaveClass("is-selected");
			await device.locator('[data-control="up"]').click();
			await expect(links.nth(0)).toHaveClass("is-selected");
			await device.locator('[data-control="select"]').click();
			await expect(device.locator(".native-screen")).toHaveClass(/panel-about/);
			await device.locator('[data-control="back"]').click();
			await expect(device.locator(".native-screen")).toHaveClass(/panel-home/);
		}
	}
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
});

test("autoplay advances chapters, pauses on hover and supports explicit play/pause", async ({
	page,
}) => {
	await page.clock.install({ time: 0 });
	await page.clock.pauseAt(60_000);
	await page.goto(`${origin}/en/`);
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"true",
	);
	await page.locator(".gallery-stage").hover();
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"false",
	);
	await page.mouse.move(0, 0);
	await page.clock.fastForward(12_000);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"nokia",
	);
	await page.getByRole("button", { name: "Pause autoplay" }).click();
	await page.clock.fastForward(30_000);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"nokia",
	);
	await page.getByRole("button", { name: "Play autoplay" }).click();
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"true",
	);
});

test("keyboard arrows separate device chapters from screen menus", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(`${origin}/en/`);
	await page.bringToFront();
	await page.keyboard.press("ArrowDown");
	const current = page.locator("[data-device-active]");
	await expect(current.locator('[data-screen-link="1"]')).toBeFocused();
	await settle(page);
	await page.keyboard.press("ArrowRight");
	await expect(current).toHaveAttribute("data-device-active", "nokia");
	await expect(current.locator('[data-screen-link="1"]')).toBeFocused();
	await page.keyboard.press("ArrowLeft");
	await expect(current).toHaveAttribute("data-device-active", "gameboy");
	await page.keyboard.press("ArrowUp");
	await expect(current.locator('[data-screen-link="0"]')).toBeFocused();
});

test("Nokia slider and iPod click wheel respond to pointer gestures", async ({
	page,
}) => {
	await page.goto(`${origin}/en/`);
	await page.locator('[data-chapter="1"]').click();
	await settle(page);
	const slider = page.getByRole("button", { name: "Numeric keypad slider" });
	await expect(slider).toHaveAttribute("aria-expanded", "true");
	await slider.click();
	await expect(slider).toHaveAttribute("aria-expanded", "false");
	await slider.click();
	await expect(slider).toHaveAttribute("aria-expanded", "true");
	await page.locator(".nokia-keypad button").nth(2).click();
	await expect(
		page.locator('[data-device-active] [data-screen-link="2"]'),
	).toHaveClass("is-selected");

	await page.locator('[data-chapter="3"]').click();
	await settle(page);
	await page.locator(".ipod-position").scrollIntoViewIfNeeded();
	const wheel = await page.locator(".ipod-wheel").boundingBox();
	if (!wheel) throw new Error("Missing wheel");
	const center = {
		x: wheel.x + wheel.width / 2,
		y: wheel.y + wheel.height / 2,
	};
	await page.mouse.move(center.x, center.y - wheel.height * 0.36);
	await page.mouse.down();
	for (const degrees of [-75, -60, -45, -30, -15, 0])
		await page.mouse.move(
			center.x + Math.cos((degrees * Math.PI) / 180) * wheel.width * 0.36,
			center.y + Math.sin((degrees * Math.PI) / 180) * wheel.height * 0.36,
		);
	await page.mouse.up();
	await expect(
		page.locator('[data-device-active] [data-screen-link="2"]'),
	).not.toHaveClass("is-selected");
});

test("Honda navigation drives synchronized speed and gear instruments", async ({
	page,
}) => {
	await page.clock.install({ time: 0 });
	await page.clock.pauseAt(60_000);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(`${origin}/en/`);
	await page.locator('[data-chapter="5"]').click();
	const speeds = page.locator("[data-device-active] [data-ride-speed]");
	const gears = page.locator("[data-device-active] [data-ride-gear]");
	await expect(speeds).toHaveText(["0", "0"]);
	await expect(gears).toHaveText(["N", "N"]);
	await page.locator('[data-device-active] [data-control="down"]').click();
	await expect(gears).toHaveText(["D", "D"]);
	await page.clock.fastForward(600);
	const accelerating = Number((await speeds.allTextContents())[0]);
	expect(accelerating).toBeGreaterThan(0);
	await page.clock.fastForward(8000);
	await expect(speeds).toHaveText(["0", "0"]);
	await expect(gears).toHaveText(["N", "N"]);
});
