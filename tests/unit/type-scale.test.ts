import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const files = [
	"packages/experience/base.css",
	"apps/resume/resume.css",
	"apps/landing/landing.css",
	"apps/landing/devices.css",
];

it("keeps page type no smaller than 9px", () => {
	const undersized: string[] = [];
	for (const file of files) {
		const css = readFileSync(file, "utf8").replace(
			/@media print\s*\{[\s\S]*?\n\}\n(?=@media|$)/g,
			"",
		);
		for (const match of css.matchAll(
			/(?:font-size:\s*|font:\s*(?:\d+\s+)?)(\d+(?:\.\d+)?)(px|rem)/g,
		)) {
			const value = Number(match[1]);
			const unit = match[2];
			if ((unit === "px" && value < 9) || (unit === "rem" && value * 16 < 9))
				undersized.push(`${file} ${match[1]}${unit}`);
		}
	}
	expect(undersized).toEqual([]);
});
