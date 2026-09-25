import { defineConfig } from "@playwright/test";
import browserConfig from "./playwright.config";

export default defineConfig({
	...browserConfig,
	testDir: "tests/performance",
	workers: 1,
	fullyParallel: false,
	timeout: 90000,
	projects: [{ name: "chromium", use: { browserName: "chromium" } }],
	reporter: [
		["list"],
		["json", { outputFile: ".test-results/performance.json" }],
	],
	outputDir: ".test-results/performance",
});
