import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		allowOnly: false,
		passWithNoTests: false,
		include: ["tests/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json", "json-summary"],
			include: ["packages/**/*.ts", "worker/*.ts"],
			exclude: [
				"**/*.test.{ts,tsx}",
				"**/*.d.ts",
				"**/index.ts",
				"**/types.ts",
				"apps/**",
				"packages/**/*.tsx",
			],
			thresholds: {
				statements: 90,
				functions: 90,
				lines: 90,
				branches: 85,
			},
		},
	},
});
