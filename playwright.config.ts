import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
	testDir: "tests/browser",
	// macOS CI and local macOS ship different CJK font revisions.
	snapshotPathTemplate: `{testDir}/snapshots/{platform}${process.env.CI ? "-ci" : ""}/{arg}{ext}`,
	fullyParallel: true,
	workers: 3,
	forbidOnly: true,
	retries: 0,
	timeout: 30000,
	reporter: [
		["list"],
		["html", { open: "never" }],
		["json", { outputFile: ".test-results/browser.json" }],
	],
	outputDir: ".test-results/browser",
	use: {
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{
			name: "firefox",
			use: {
				...devices["Desktop Firefox"],
				launchOptions: {
					firefoxUserPrefs: {
						"network.proxy.type": 0,
						"network.dns.localDomains":
							"resume.lizheng-test.localhost,landing.lizheng-test.localhost",
					},
				},
			},
		},
		{ name: "webkit", use: { ...devices["Desktop Safari"] } },
	],
	webServer: {
		command: "env -u NO_COLOR bun scripts/test-server.ts l3",
		url: "http://127.0.0.1:27046/api/live",
		reuseExistingServer: false,
		timeout: 60000,
		gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
	},
});
