import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { assertLocalRequest } from "../../packages/quality/isolation";

const origin = "http://landing.lizheng-test.localhost:27046";
const models = ["gameboy", "nokia", "macintosh", "ipod", "garmin", "honda"];
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

async function freezeClock(page: Page) {
	await page.clock.install({ time: 0 });
	await page.clock.pauseAt(60_000);
}

for (const fallback of [false, true])
	test(`prepared scenes stay inert and reuse native controls (${fallback ? "timer fallback" : "idle callback"})`, async ({
		page,
	}) => {
		if (fallback)
			await page.addInitScript(() => {
				Object.defineProperty(window, "requestIdleCallback", {
					value: undefined,
					configurable: true,
				});
			});
		await page.goto(`${origin}/en/`);
		await page.getByRole("button", { name: "Pause autoplay" }).click();
		await expect(page.locator(".device-layer")).toHaveCount(6);
		await expect(page.locator(".is-cached")).toHaveCount(5);
		expect(
			await page.locator(".is-cached").evaluateAll((layers) =>
				layers.every((layer) => {
					layer.querySelector<HTMLButtonElement>("button")?.focus();
					return (
						layer.hasAttribute("inert") &&
						layer.getAttribute("aria-hidden") === "true" &&
						getComputedStyle(layer).visibility === "hidden" &&
						!layer.contains(document.activeElement) &&
						!layer
							.getAnimations({ subtree: true })
							.some(
								(animation) =>
									animation.playState === "running" || animation.pending,
							)
					);
				}),
			),
		).toBe(true);
		await expect(page.locator("[data-gallery]").getByRole("link")).toHaveCount(
			4,
		);
		const prepared = await page.locator(".layer-nokia").elementHandle();
		if (!prepared) throw new Error("Missing prepared Nokia");
		await page.locator('[data-chapter="1"]').click();
		await settle(page);
		const active = page.locator("[data-device-active]");
		expect(
			await active.evaluate((node, cached) => node === cached, prepared),
		).toBe(true);
		await active.locator('[data-control="down"]').click();
		await expect(active.locator('[data-screen-link="1"]')).toHaveClass(
			"is-selected",
		);
		await page.locator('[data-chapter="5"]').click();
		await settle(page);
		await expect(active.locator('[data-screen-link="1"]')).toHaveClass(
			"is-selected",
		);
		await expect(page.locator(".device-layer")).toHaveCount(6);
		await expect(page.locator(".is-cached")).toHaveCount(5);
		await expect(page.locator("[data-gallery]").getByRole("link")).toHaveCount(
			4,
		);
	});

for (const [index, model] of models.entries()) {
	if (index === 0) continue; // The existing experience matrix covers the Game Boy.
	for (const locale of ["en", "zh"])
		for (const theme of ["light", "dark"] as const)
			for (const width of [1440, 390])
				test(`${model}/${locale}/${theme}/${width}: native layout, same content, controls and accessibility`, async ({
					page,
				}, info) => {
					await page.setViewportSize({
						width,
						height: width === 390 ? 844 : 900,
					});
					await page.emulateMedia({ colorScheme: theme });
					const errors: string[] = [];
					page.on("pageerror", (error) => errors.push(error.message));
					await page.goto(`${origin}/${locale}/`);
					const destinations = await page
						.locator("[data-device-active] [data-screen-link]")
						.evaluateAll((links) =>
							links.map((link) => link.getAttribute("href")),
						);
					await page.locator(`[data-chapter="${index}"]`).click();
					await settle(page);
					await page.mouse.move(0, 0);
					const device = page.locator(`[data-device-active="${model}"]`);
					await expect(device).toBeVisible();
					const links = device.locator("[data-screen-link]");
					await expect(links).toHaveCount(4);
					expect(
						await links.evaluateAll((anchors) =>
							anchors.map((anchor) => anchor.getAttribute("href")),
						),
					).toEqual(destinations);
					await expect(device.locator(".native-screen h2")).toHaveText(
						locale === "zh" ? "李征" : "Zheng Li",
					);
					await expect(device.locator(".native-role")).toHaveText(
						"Principal Software Engineering Manager @ Microsoft",
					);
					await expect(device.locator(".native-bio")).toContainText(
						locale === "zh"
							? "写了 20 年代码，15 年微软。"
							: "15 years building web & mobile software.",
					);
					expect(
						await page.evaluate(
							() => document.documentElement.scrollWidth <= innerWidth,
						),
					).toBe(true);
					// Compare native layout coordinates, before the intentional 3D transform.
					const clipped = await device.evaluate((element) => {
						const screen = element.querySelector<HTMLElement>(".native-screen");
						if (!screen) return ["missing screen"];
						const bottom = (node: HTMLElement) => {
							let y = node.offsetTop + node.offsetHeight;
							let parent = node.offsetParent;
							while (parent instanceof HTMLElement && parent !== screen) {
								y += parent.offsetTop;
								parent = parent.offsetParent;
							}
							return y;
						};
						const clipped = [
							...screen.querySelectorAll<HTMLElement>(
								"[data-screen-link], .native-bio, .native-role",
							),
						]
							.filter((node) => bottom(node) > screen.clientHeight + 1)
							.map((node) => node.textContent);
						for (const region of screen.querySelectorAll<HTMLElement>(
							".mac-window-body, .nokia-screen-content, .ipod-screen-content, .garmin-screen-content, .honda-tft-content",
						)) {
							if (region.scrollHeight > region.clientHeight + 2)
								clipped.push(region.className);
						}
						return clipped;
					});
					expect(clipped).toEqual([]);
					// Read one chapter while axe inspects it, using the normal hover pause.
					await page
						.locator(".gallery-stage")
						.hover({ position: { x: 1, y: 1 } });
					const violations = (
						await new AxeBuilder({ page })
							.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
							.analyze()
					).violations;
					await info.attach("axe", {
						body: JSON.stringify(violations, null, 2),
						contentType: "application/json",
					});
					expect(
						violations.map(({ id, nodes }) => ({
							id,
							targets: nodes.map((node) => ({
								target: node.target,
								summary: node.failureSummary,
							})),
						})),
					).toEqual([]);
					await page.mouse.move(0, 0);
					if (info.project.name === "chromium")
						await expect(page.locator(".device-gallery")).toHaveScreenshot(
							`${model}-${locale}-${theme}-${width}.png`,
							{
								animations: "disabled",
								maxDiffPixelRatio: 0.001,
								mask: [page.locator(".chapter-progress")],
							},
						);
					await device.locator('[data-control="down"]').click();
					await expect(links.nth(1)).toHaveClass("is-selected");
					await device.locator('[data-control="up"]').click();
					await expect(links.nth(0)).toHaveClass("is-selected");
					await device.locator('[data-control="select"]').click();
					await expect(device.locator(".native-screen")).toHaveClass(
						/panel-about/,
					);
					await expect(device.locator(".device-about")).toBeVisible();
					await device.locator('[data-control="back"]').click();
					await expect(device.locator(".native-screen")).toHaveClass(
						/panel-home/,
					);
					await device.evaluate((element) =>
						element.addEventListener("click", (event) => {
							const target = (
								event.target as Element
							).closest<HTMLAnchorElement>("[data-screen-link]");
							if (target) {
								event.preventDefault();
								element.setAttribute(
									"data-activated",
									target.getAttribute("href") ?? "",
								);
							}
						}),
					);
					await device.locator('[data-control="open"]').click();
					await expect(device).toHaveAttribute(
						"data-activated",
						destinations[0] as string,
					);
					expect(errors).toEqual([]);
				});
}

test("native button presses complete when the page brings the control into view", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(`${origin}/en/`);
	await page.locator('[data-chapter="1"]').click();
	await settle(page);
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
	await page.mouse.move(0, 0);
	const device = page.locator('[data-device-active="nokia"]');
	const control = device.locator('[data-control="down"]');
	await control.evaluate((button) => button.scrollIntoView({ block: "start" }));
	const box = await control.boundingBox();
	if (!box) throw new Error("Missing native button");
	// Hold a real press long enough to expose any page pan between down and up.
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
		delay: 160,
	});
	const after = await control.boundingBox();
	if (!after) throw new Error("Missing pressed button");
	expect(Math.hypot(after.x - box.x, after.y - box.y)).toBeLessThan(0.5);
	await expect(device.locator('[data-screen-link="1"]')).toHaveClass(
		"is-selected",
	);
});

test("native controls stay under the pointer during an unfinished tilt", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(`${origin}/en/`);
	await page.getByRole("button", { name: "Pause autoplay" }).click();
	for (const chapter of [1, 2]) {
		await page.locator(`[data-chapter="${chapter}"]`).click();
		await settle(page);
		const device = page.locator("[data-device-active]");
		const control = device.locator('[data-control="down"]');
		await page.locator(".gallery-stage").hover({ position: { x: 15, y: 30 } });
		await settle(page);
		const scene = await page.locator(".gallery-stage").boundingBox();
		if (!scene) throw new Error("Missing scene");
		await page.mouse.move(
			scene.x + scene.width - 15,
			scene.y + scene.height - 30,
		);
		const box = await control.boundingBox();
		if (!box) throw new Error("Missing control");
		const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
		await page.mouse.move(point.x, point.y);
		const drift = await control.evaluate(async (button) => {
			const start = button.getBoundingClientRect();
			await new Promise<void>((resolve) => setTimeout(resolve, 250));
			const end = button.getBoundingClientRect();
			return Math.hypot(end.x - start.x, end.y - start.y);
		});
		expect(drift).toBeLessThan(0.5);
		const selected = Number(
			await device
				.locator("[data-screen-link].is-selected")
				.getAttribute("data-screen-link"),
		);
		await page.mouse.click(point.x, point.y, { delay: 80 });
		await expect(
			device.locator(`[data-screen-link="${(selected + 1) % 4}"]`),
		).toHaveClass("is-selected");
		await page.mouse.move(0, 0);
		await settle(page);
		await expect(device.locator("[data-device-shell]")).toHaveCSS(
			"transform",
			"matrix(1, 0, 0, 1, 0, 0)",
		);
	}
});

test("automatic chapters preserve reading time, wrap and offer explicit playback", async ({
	page,
}) => {
	await freezeClock(page);
	await page.goto(`${origin}/en/`);
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"true",
	);
	await page.clock.fastForward(4000);
	await page.locator(".gallery-stage").hover();
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"false",
	);
	await page.clock.fastForward(30000);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"gameboy",
	);
	await page.mouse.move(0, 0);
	await page.clock.fastForward(8000);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"nokia",
	);
	for (const id of ["macintosh", "ipod", "garmin", "honda", "gameboy"]) {
		await page.clock.fastForward(12000);
		await expect(page.locator("[data-device-active]")).toHaveAttribute(
			"data-device-active",
			id,
		);
	}
	await page.getByRole("button", { name: "Pause autoplay" }).click();
	await page.clock.fastForward(60000);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"gameboy",
	);
	await page.getByRole("button", { name: "Start autoplay" }).click();
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"true",
	);
	await page.clock.fastForward(12000);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"nokia",
	);
});

test("rapid chapter changes, nonlinear motion, stronger tilt and reduced motion", async ({
	page,
}) => {
	await freezeClock(page);
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(`${origin}/en/`);
	await page.locator('[data-chapter="1"]').click();
	await page.locator('[data-chapter="3"]').click();
	await page.locator('[data-chapter="5"]').click();
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"honda",
	);
	await expect(page.locator(".is-exiting")).toHaveAttribute("inert", "");
	await expect(page.locator(".is-exiting")).toHaveAttribute(
		"aria-hidden",
		"true",
	);
	expect(
		await page
			.locator(".is-entering")
			.evaluate((node) =>
				node
					.getAnimations()
					.some((animation) =>
						(animation.effect as KeyframeEffect)
							.getKeyframes()
							.some((frame) => frame.easing.includes("cubic-bezier")),
					),
			),
	).toBe(true);
	const arrival = await page.locator(".is-entering").evaluate((node) => {
		const animation = node
			.getAnimations()
			.find((item) => (item as CSSAnimation).animationName === "object-enter");
		if (!animation?.effect) throw new Error("Missing arrival animation");
		const time = animation.currentTime;
		const duration = Number(animation.effect.getTiming().duration);
		const direction = Number(
			getComputedStyle(node).getPropertyValue("--direction"),
		);
		animation.pause();
		const samples = [0.5, 0.6, 0.7, 0.8, 0.9, 1].map((progress) => {
			animation.currentTime = duration * progress;
			const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
			return {
				x: matrix.m41 * direction,
				y: matrix.m42,
				z: matrix.m43,
				scale: Math.hypot(matrix.m11, matrix.m12, matrix.m13),
				distance: Math.hypot(matrix.m41, matrix.m42, matrix.m43),
			};
		});
		animation.currentTime = time;
		animation.play();
		return samples;
	});
	let previousDistance = Infinity;
	let previousStep = Infinity;
	for (const sample of arrival) {
		// Actual interpolated poses must approach the destination from one side.
		expect(sample.x).toBeGreaterThanOrEqual(-0.001);
		expect(sample.y).toBeGreaterThanOrEqual(-0.001);
		expect(sample.z).toBeLessThanOrEqual(0.001);
		expect(sample.scale).toBeLessThanOrEqual(1.00001);
		expect(sample.distance).toBeLessThanOrEqual(previousDistance + 0.001);
		const step = previousDistance - sample.distance;
		expect(step).toBeLessThanOrEqual(previousStep + 0.001);
		previousDistance = sample.distance;
		previousStep = step;
	}
	await page.clock.fastForward(1100);
	await settle(page);
	const stage = await page.locator(".gallery-stage").boundingBox();
	if (!stage) throw new Error("Missing stage");
	await page.mouse.move(stage.x + stage.width - 5, stage.y + 30);
	const tilt = await page
		.locator("[data-device-active] [data-device-shell]")
		.evaluate((node) =>
			parseFloat((node as HTMLElement).style.getPropertyValue("--tilt-y")),
		);
	expect(tilt).toBeGreaterThan(4);
	expect(tilt).toBeLessThanOrEqual(6);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-playing",
		"true",
	);
	await page.locator('[data-chapter="2"]').click();
	await expect(page.locator(".is-exiting")).toHaveCount(0);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"macintosh",
	);
	expect(
		await page
			.locator("[data-device-active] [data-device-shell]")
			.evaluate((node) => getComputedStyle(node).transform),
	).toBe("none");
	await page.keyboard.press("Home");
	await expect(page.locator('[data-chapter="0"]')).toBeFocused();
	await page.keyboard.press("ArrowLeft");
	await expect(page.locator('[data-chapter="5"]')).toBeFocused();
	await page.keyboard.press("ArrowRight");
	await expect(page.locator('[data-chapter="0"]')).toBeFocused();
	await page.keyboard.press("End");
	await expect(page.locator('[data-chapter="5"]')).toBeFocused();
});

test("keyboard arrows separate device chapters from screen menus and carry focus through transitions", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(`${origin}/en/`);
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"true",
	);
	await expect(page.locator(".keyboard-legend")).toContainText(
		"Select a screen link",
	);
	await expect(page.locator(".keyboard-legend")).toContainText(
		"Switch devices",
	);
	await page.keyboard.press("ArrowDown");
	const current = page.locator("[data-device-active]");
	await expect(current.locator('[data-screen-link="1"]')).toBeFocused();
	for (const model of [...models.slice(1), "gameboy"]) {
		await page.keyboard.press("ArrowRight");
		await expect(current).toHaveAttribute("data-device-active", model);
		await expect(current.locator('[data-screen-link="1"]')).toHaveClass(
			"is-selected",
		);
		await expect(current.locator('[data-screen-link="1"]')).toBeFocused();
		await expect(current.locator(".native-screen, .lcd-screen")).toHaveClass(
			/panel-home/,
		);
	}
	await page.keyboard.press("ArrowLeft");
	await expect(current).toHaveAttribute("data-device-active", "honda");
	await expect(current.locator('[data-screen-link="1"]')).toBeFocused();
	await page.keyboard.press("ArrowUp");
	await expect(current.locator('[data-screen-link="0"]')).toBeFocused();
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"false",
	);
	await current.evaluate((element) =>
		element.addEventListener("click", (event) => {
			const link = (event.target as Element).closest("[data-screen-link]");
			if (link) {
				event.preventDefault();
				element.setAttribute(
					"data-keyboard-opened",
					link.getAttribute("data-screen-link") ?? "",
				);
			}
		}),
	);
	await page.keyboard.press("Enter");
	await expect(current).toHaveAttribute("data-keyboard-opened", "0");
	await page.locator('[data-chapter="5"]').focus();
	await page.keyboard.press("ArrowDown");
	await expect(current.locator('[data-screen-link="1"]')).toBeFocused();
	await expect(current).toHaveAttribute("data-device-active", "honda");
	await page.locator(".theme-toggle").focus();
	await page.keyboard.press("ArrowRight");
	await expect(current).toHaveAttribute("data-device-active", "honda");
	await expect(page.locator(".theme-toggle")).toBeFocused();
});

test("Nokia slider and iPod click wheel work with real pointer gestures", async ({
	page,
}) => {
	await page.goto(`${origin}/en/`);
	await page.locator('[data-chapter="1"]').click();
	await settle(page);
	await page.getByRole("button", { name: "Close slider" }).click();
	await expect(page.locator(".nokia-keypad")).toHaveAttribute("inert", "");
	await page.getByRole("button", { name: "Open numeric keypad" }).click();
	await expect(page.locator(".nokia-keypad")).not.toHaveAttribute("inert");
	await page.locator(".nokia-keypad button").nth(2).click();
	await expect(
		page.locator('[data-device-active] [data-screen-link="2"]'),
	).toHaveClass("is-selected");
	await page.locator('[data-chapter="3"]').click();
	await settle(page);
	// The shared sticky header can cover the top of a partly scrolled wheel.
	// Bring the whole device into view before performing the physical gesture.
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

test("scrolling under a stationary pointer preserves selection until the pointer moves", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1440, height: 800 });
	await page.goto(`${origin}/en/`);
	await page.locator('[data-chapter="3"]').click();
	await settle(page);
	await page.evaluate(() => window.scrollTo(0, 0));
	const first = page.locator('[data-device-active] [data-screen-link="0"]');
	const last = page.locator('[data-device-active] [data-screen-link="3"]');
	await first.hover();
	await expect(first).toHaveClass("is-selected");
	const from = await first.boundingBox();
	const to = await last.boundingBox();
	if (!from || !to) throw new Error("Missing screen links");
	await page.mouse.wheel(0, to.y - from.y);
	await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
	await expect(first).toHaveClass("is-selected");
	await last.hover({ position: { x: 8, y: 8 } });
	await expect(last).toHaveClass("is-selected");
});

test("mouse chapter selection keeps autoplay on and reduced motion preserves the playback choice", async ({
	page,
}) => {
	await freezeClock(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(`${origin}/en/`);
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-playing",
		"true",
	);
	await page.locator('[data-chapter="2"]').click();
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-running",
		"true",
	);
	await page.clock.fastForward(12000);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"ipod",
	);
	await page.getByRole("button", { name: "Pause autoplay" }).click();
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.clock.fastForward(30000);
	await expect(page.locator("[data-device-active]")).toHaveAttribute(
		"data-device-active",
		"ipod",
	);
	await expect(page.locator("[data-gallery]")).toHaveAttribute(
		"data-playing",
		"false",
	);
});

test("Honda navigation drives synchronized instruments, coasts to zero, then returns to neutral", async ({
	page,
}) => {
	await freezeClock(page);
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(`${origin}/en/`);
	await page.locator('[data-chapter="5"]').click();
	const speeds = page.locator("[data-device-active] [data-ride-speed]");
	const gears = page.locator("[data-device-active] [data-ride-gear]");
	await expect(speeds).toHaveText(["0", "0"]);
	await expect(gears).toHaveText(["N", "N"]);
	await page.locator('[data-device-active] [data-control="down"]').click();
	await expect(gears).toHaveText(["D", "D"]);
	const reading = async () => {
		const values = await speeds.allTextContents();
		expect(values[0]).toBe(values[1]);
		return Number(values[0]);
	};
	await page.clock.fastForward(600);
	const accelerating = await reading();
	expect(accelerating).toBeGreaterThan(0);
	await page.clock.fastForward(1200);
	const cruising = await reading();
	expect(cruising).toBeGreaterThan(accelerating);
	await page.clock.fastForward(1600);
	const coasting = await reading();
	expect(coasting).toBeGreaterThan(0);
	expect(coasting).toBeLessThan(cruising);
	await page.clock.fastForward(2100);
	await expect(speeds).toHaveText(["0", "0"]);
	await expect(gears).toHaveText(["D", "D"]);
	await page.clock.fastForward(1800);
	await expect(gears).toHaveText(["D", "D"]);
	await page.clock.fastForward(800);
	await expect(gears).toHaveText(["N", "N"]);
	await page.locator('[data-device-active] [data-control="up"]').click();
	await expect(gears).toHaveText(["D", "D"]);
	await page.locator('[data-chapter="0"]').click();
	await page.locator('[data-chapter="5"]').click();
	await expect(speeds).toHaveText(["0", "0"]);
	await expect(gears).toHaveText(["N", "N"]);
});

test("all six devices remain usable with touch at 320px and in landscape", async ({
	browser,
}) => {
	const context = await browser.newContext({
		hasTouch: true,
		viewport: { width: 320, height: 568 },
		reducedMotion: "reduce",
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
	await page.goto(`${origin}/zh/`);
	await page.evaluate(() =>
		document.addEventListener("click", (event) => {
			const anchor = (event.target as Element).closest<HTMLAnchorElement>(
				"[data-screen-link]",
			);
			if (anchor) {
				event.preventDefault();
				document.body.setAttribute(
					"data-touch-link",
					anchor.getAttribute("data-screen-link") ?? "",
				);
			}
		}),
	);
	for (const viewport of [
		{ width: 320, height: 568 },
		{ width: 844, height: 390 },
	]) {
		await page.setViewportSize(viewport);
		for (const [index, id] of models.entries()) {
			await page.locator(`[data-chapter="${index}"]`).tap();
			const active = page.locator(`[data-device-active="${id}"]`);
			await expect(active.locator("[data-screen-link]")).toHaveCount(4);
			if (id === "gameboy")
				expect(
					await active
						.locator(".lcd-content")
						.evaluate((node) => node.scrollHeight - node.clientHeight),
				).toBeLessThanOrEqual(1);
			await active.locator('[data-screen-link="3"]').tap();
			await expect(page.locator("body")).toHaveAttribute(
				"data-touch-link",
				"3",
			);
			expect(
				await active
					.locator("[data-device-shell]")
					.evaluate((node) => getComputedStyle(node).transform),
			).toBe("none");
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			await page
				.locator("body")
				.evaluate((node) => node.removeAttribute("data-touch-link"));
		}
	}
	await context.close();
});
