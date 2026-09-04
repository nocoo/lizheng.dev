import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json", "json-summary"],
			include: [
				"packages/**/*.ts",
				"packages/publishing/*.tsx",
				"apps/resume/Markdown.tsx",
				"worker/*.ts",
			],
			thresholds: {
				statements: 95,
				functions: 95,
				lines: 95,
				branches: 95,
			},
		},
	},
});
