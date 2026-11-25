import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		allowOnly: false,
		passWithNoTests: false,
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
			exclude: [
				"**/*.test.{ts,tsx}",
				"**/*.d.ts",
				"**/index.ts",
				"**/types.ts",
				"apps/landing/**",
				"apps/resume/ResumePage.tsx",
				"apps/resume/client.ts",
				"packages/experience/*.tsx",
			],
			thresholds: {
				statements: 80,
				functions: 80,
				lines: 80,
				branches: 80,
			},
		},
	},
});
