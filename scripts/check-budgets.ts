import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const build = Bun.spawn(["bun", "run", "build"], {
	stdout: "inherit",
	stderr: "inherit",
});
if ((await build.exited) !== 0)
	throw new Error("Build failed before budget verification");
const root = resolve("dist");
const read = async (path: string) => {
	const absolute = resolve(root, `.${path}`);
	if (!absolute.startsWith(`${root}/`))
		throw new Error("Asset escapes build root");
	return readFile(absolute);
};
const report = [];
for (const surface of ["resume", "landing"])
	for (const locale of ["en", "zh"]) {
		const html = await read(`/_sites/${surface}/${locale}/index.html`);
		const text = html.toString();
		const scripts = new Set(
			[...text.matchAll(/<script[^>]*src="([^"]+)"/g)].map(
				(match) => match[1] as string,
			),
		);
		const styles = new Set(
			[...text.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map(
				(match) => match[1] as string,
			),
		);
		const media = new Set(
			[...text.matchAll(/<img[^>]*src="([^"]+)"/g)].map(
				(match) => match[1] as string,
			),
		);
		let js = 0;
		let css = 0;
		let fonts = 0;
		let images = 0;
		for (const path of scripts) {
			const content = await read(path);
			js += gzipSync(content).byteLength;
			for (const match of content
				.toString()
				.matchAll(/(?:from|import)\s*\(?["'](\.\/[^"']+)["']/g))
				scripts.add(`${dirname(path)}/${(match[1] as string).slice(2)}`);
		}
		const fontFiles = new Set<string>();
		for (const path of styles) {
			const content = await read(path);
			css += gzipSync(content).byteLength;
			for (const match of content
				.toString()
				.matchAll(/url\(["']?(\/assets\/[^)"']+)/g))
				fontFiles.add(match[1] as string);
		}
		for (const path of fontFiles) fonts += (await read(path)).byteLength;
		for (const path of media) images += (await read(path)).byteLength;
		const total = js + css + fonts + images + gzipSync(html).byteLength;
		const limits =
			surface === "resume"
				? { js: 8, css: 20, images: 80, total: 300 }
				: { js: 90, css: 35, images: 100, total: 450 };
		for (const [key, bytes] of Object.entries({ js, css, images, total }))
			if (bytes > limits[key as keyof typeof limits] * 1024)
				throw new Error(`${surface}/${locale} exceeds ${key} budget: ${bytes}`);
		report.push({ surface, locale, js, css, fonts, images, total });
	}
// Only reviewed public assets and the four content exports may enter the artifact.
for (const entry of await readdir(root))
	if (
		![
			"assets",
			"design-assets",
			"favicon.svg",
			"favicon.ico",
			"apple-touch-icon.png",
			"_sites",
		].includes(entry)
	)
		throw new Error(`Unexpected public build entry: ${entry}`);
for (const file of await readdir(`${root}/assets`))
	if ((await stat(`${root}/assets/${file}`)).size > 1024 * 1024)
		throw new Error(`Oversize resource: ${file}`);
await mkdir(".test-results", { recursive: true });
await writeFile(".test-results/budgets.json", JSON.stringify(report, null, 2));
console.table(report);
