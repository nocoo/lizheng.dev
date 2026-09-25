import { defineConfig } from "@playwright/test";
import browserConfig from "./playwright.config";

export default defineConfig({
	...browserConfig,
	testDir: "tests/performance",
	workers: 1,
	fullyParallel: false,
	timeout: 90000,
	projects: [{ name: "chromium", use: { browserName: "chromium" } }],
	use: {
		...browserConfig.use,
		// DOM snapshot collection forces layout on the timed input path.
		trace: {
			mode: "retain-on-failure",
			screenshots: true,
			snapshots: false,
		},
	},
	reporter: [
		["list"],
		["json", { outputFile: ".test-results/performance.json" }],
	],
	outputDir: ".test-results/performance",
});
