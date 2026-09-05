import { expect, test } from "@playwright/test";
import { assertLocalRequest } from "../../packages/quality/isolation";

type Entry = PerformanceEntry & {
	value?: number;
	hadRecentInput?: boolean;
	interactionId?: number;
};
type Metrics = {
	lcp: number;
	cls: number;
	interactions: number[];
	longTasks: number[];
};
declare global {
	interface Window {
		labMetrics: Metrics;
	}
}
const median = (values: number[]) =>
	[...values].sort((a, b) => a - b)[1] ?? NaN;

for (const surface of ["resume", "landing"])
	for (const width of [390, 1440])
		test(`${surface}/${width}: cold load and real interactions with normal motion`, async ({
			browser,
		}, info) => {
			const samples: Metrics[] = [];
			for (let sample = 0; sample < 3; sample++) {
				const context = await browser.newContext({
					viewport: { width, height: 900 },
					reducedMotion: "no-preference",
					colorScheme: "light",
				});
				await context.route("**/*", (route) => {
					try {
						assertLocalRequest(route.request().url());
						return route.continue();
					} catch {
						return route.abort();
					}
				});
				await context.addInitScript(() => {
					window.labMetrics = {
						lcp: 0,
						cls: 0,
						interactions: [],
						longTasks: [],
					};
					let session = 0,
						first = 0,
						last = 0;
					new PerformanceObserver((list) => {
						for (const entry of list.getEntries())
							window.labMetrics.lcp = entry.startTime;
					}).observe({ type: "largest-contentful-paint", buffered: true });
					new PerformanceObserver((list) => {
						for (const entry of list.getEntries() as Entry[]) {
							if (entry.hadRecentInput) continue;
							if (
								entry.startTime - last > 1000 ||
								entry.startTime - first > 5000
							) {
								session = 0;
								first = entry.startTime;
							}
							session += entry.value ?? 0;
							last = entry.startTime;
							window.labMetrics.cls = Math.max(window.labMetrics.cls, session);
						}
					}).observe({ type: "layout-shift", buffered: true });
					new PerformanceObserver((list) => {
						for (const entry of list.getEntries() as Entry[])
							if (entry.interactionId)
								window.labMetrics.interactions.push(entry.duration);
					}).observe({
						type: "event",
						buffered: true,
						durationThreshold: 16,
					} as PerformanceObserverInit);
					new PerformanceObserver((list) => {
						for (const entry of list.getEntries())
							window.labMetrics.longTasks.push(entry.duration);
					}).observe({ type: "longtask", buffered: true });
				});
				const page = await context.newPage();
				const cdp = await context.newCDPSession(page);
				await cdp.send("Network.enable");
				await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
				await cdp.send("Network.emulateNetworkConditions", {
					offline: false,
					latency: 150,
					downloadThroughput: 1_600_000 / 8,
					uploadThroughput: 750_000 / 8,
					connectionType: "cellular4g",
				});
				await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
				await page.goto(`http://${surface}.lizheng-test.localhost:27046/en/`);
				await page.evaluate(async () => {
					await document.fonts.ready;
					await Promise.all(
						document
							.getAnimations()
							.filter((a) => a.effect?.getTiming().iterations !== Infinity)
							.map((a) => a.finished),
					);
				});
				// Allow paint observers to flush; keep all decorative animation running.
				await page.waitForTimeout(500);
				await page.locator("[data-theme-toggle]").click();
				await expect(page.locator("html")).toHaveAttribute(
					"data-theme",
					"dark",
				);
				if (surface === "landing") {
					await page.locator(".dpad-down").click();
					await expect(page.locator('[data-screen-link="1"]')).toHaveClass(
						"is-selected",
					);
					await page.locator('[aria-label="Select: Switch screen"]').click();
					await expect(page.locator("#screen")).toHaveClass(
						"lcd-screen panel-about",
					);
					await page.locator(".button-b").click();
				}
				await page.waitForTimeout(500);
				samples.push(await page.evaluate(() => window.labMetrics));
				await context.close();
			}
			const result = {
				model:
					"Chromium, 4x CPU, 1.6 Mbps down / 0.75 Mbps up, 150ms latency, cold cache, normal motion",
				samples,
				median: {
					lcp: median(samples.map((s) => s.lcp)),
					cls: median(samples.map((s) => s.cls)),
					// Event Timing only reports durations >=16ms. Zero means below reporting threshold.
					interaction: median(
						samples.map((s) => Math.max(0, ...s.interactions)),
					),
				},
			};
			await info.attach("cold-samples-and-medians", {
				body: JSON.stringify(result, null, 2),
				contentType: "application/json",
			});
			console.info(surface, width, JSON.stringify(result));
			expect(samples.every((s) => s.lcp > 0)).toBe(true);
			expect(result.median.lcp).toBeLessThanOrEqual(2500);
			expect(result.median.cls).toBeLessThanOrEqual(0.05);
			expect(result.median.interaction).toBeLessThanOrEqual(200);
		});
