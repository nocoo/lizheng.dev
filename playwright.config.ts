import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
	testDir: "tests/browser",
	// Résumé keeps system-CJK platform variants; landing uses its self-hosted subset.
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
		command:
			"bun build scripts/test-server.ts --target=node --packages=external --outfile=.test-dist/test-server-l3.mjs && node .test-dist/test-server-l3.mjs l3",
		url: "http://127.0.0.1:27046/api/live",
		reuseExistingServer: false,
		timeout: 120000,
		stdout: "pipe",
		stderr: "pipe",
		gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
	},
});
