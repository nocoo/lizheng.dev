import type { KnipConfig } from "knip";

const config: KnipConfig = {
	// Installed operating-system tool, enforced separately by the security gate.
	ignoreBinaries: ["gitleaks"],
	entry: [
		"apps/*/client.{ts,tsx}",
		"worker/index.ts",
		"scripts/*.{ts,tsx}",
		"tests/**/*.{test,spec}.{ts,tsx}",
		"*.config.ts",
	],
	project: [
		"apps/**/*.{ts,tsx,css}",
		"packages/**/*.{ts,tsx,css}",
		"worker/**/*.ts",
		"scripts/*.{ts,tsx}",
		"tests/**/*.{ts,tsx}",
		"*.ts",
	],
	compilers: {
		css: (source) =>
			[...source.matchAll(/url\(["'](@[^"']+)["']\)/g)]
				.map((match) => `import "${match[1]}";`)
				.join("\n"),
	},
};
export default config;
