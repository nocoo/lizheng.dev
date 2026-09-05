import { defineConfig } from "@playwright/test";
export default defineConfig({
	testDir: "tests/http",
	fullyParallel: true,
	workers: 4,
	forbidOnly: true,
	retries: 0,
	reporter: [["list"], ["json", { outputFile: ".test-results/http.json" }]],
	outputDir: ".test-results/http",
	webServer: {
		command:
			"bun build scripts/test-server.ts --target=node --packages=external --outfile=.test-dist/test-server-l2.mjs && node .test-dist/test-server-l2.mjs l2",
		url: "http://127.0.0.1:17046/api/live",
		reuseExistingServer: false,
		timeout: 60000,
		gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
	},
});
