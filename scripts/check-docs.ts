import { access, readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadContent } from "../packages/content/model";

for (const surface of ["resume", "landing"] as const)
	for (const locale of ["en", "zh"] as const)
		await loadContent(surface, locale);
const files = [
	"README.md",
	"CLAUDE.md",
	...(await readdir("docs"))
		.filter((name) => name.endsWith(".md"))
		.map((name) => `docs/${name}`),
	...(await readdir("docs/content"))
		.filter((name) => name.endsWith(".md"))
		.map((name) => `docs/content/${name}`),
];
for (const file of files) {
	const body = await readFile(file, "utf8");
	if (!body.endsWith("\n") || /[ \t]+$/m.test(body))
		throw new Error(`Whitespace: ${file}`);
	for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
		const target = match[1] as string;
		if (/^(?:https?:|#|mailto:)/.test(target) || target.includes("archive/"))
			continue;
		const path = resolve(dirname(file), target.split("#")[0] as string);
		await access(path).catch(() => {
			throw new Error(`Broken link in ${file}: ${target}`);
		});
	}
}
console.info(
	`Validated four public documents and links in ${files.length} active Markdown files; archives excluded.`,
);
