import { defineConfig } from "@playwright/test";
export default defineConfig({
	testDir: "tests/development",
	workers: 1,
	forbidOnly: true,
	retries: 0,
	timeout: 45000,
	outputDir: ".test-results/development",
	reporter: [
		["list"],
		["json", { outputFile: ".test-results/development.json" }],
	],
	use: { browserName: "chromium", trace: "retain-on-failure" },
});
