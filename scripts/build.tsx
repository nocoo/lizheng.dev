import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { build, type Manifest } from "vite";
import { loadContent, type Surface } from "../packages/content/model";
import { renderPage } from "../packages/publishing/render";
import { metadataFile } from "../packages/publishing/routes";

const destination = resolve(process.argv[2] ?? "dist");
const output = `${destination}.tmp`;
await rm(output, { recursive: true, force: true });
await build({
	configFile: false,
	plugins: [react()],
	publicDir: false,
	build: {
		outDir: output,
		assetsInlineLimit: 0,
		manifest: true,
		rolldownOptions: {
			input: {
				resume: resolve("apps/resume/client.ts"),
				landing: resolve("apps/landing/client.tsx"),
			},
		},
	},
});
await cp("design-public", output, { recursive: true });
const manifest: Manifest = JSON.parse(
	await readFile(`${output}/.vite/manifest.json`, "utf8"),
);
for (const surface of ["resume", "landing"] as Surface[]) {
	const entry =
		manifest[`apps/${surface}/client.${surface === "resume" ? "ts" : "tsx"}`];
	if (!entry) throw new Error(`Missing built entry for ${surface}`);
	const css = new Set(entry.css ?? []);
	for (const key of entry.imports ?? [])
		for (const file of manifest[key]?.css ?? []) css.add(file);
	for (const locale of ["en", "zh"] as const) {
		const directory = `${output}/_sites/${surface}/${locale}`;
		await mkdir(directory, { recursive: true });
		await writeFile(
			`${directory}/index.html`,
			await renderPage(surface, locale, {
				script: `/${entry.file}`,
				css: [...css].map((file) => `/${file}`),
			}),
		);
		await writeFile(
			`${output}/_sites/${surface}/${locale}.md`,
			(await loadContent(surface, locale)).markdown,
		);
	}
	for (const path of [
		"/robots.txt",
		"/llms.txt",
		"/sitemap-index.xml",
		"/sitemap-pages.xml",
	]) {
		const metadata = metadataFile(surface, path);
		if (metadata)
			await writeFile(`${output}/_sites/${surface}${path}`, metadata.body);
	}
}
await rm(`${output}/.vite`, { recursive: true });
await rm(destination, { recursive: true, force: true });
await rename(output, destination);
console.info(
	`Built four complete pages and public Markdown into ${destination}`,
);
