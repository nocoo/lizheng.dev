import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { GameBoy } from "../apps/landing/devices/GameBoy";
import {
	type Locale,
	loadContent,
	type Surface,
} from "../packages/content/model";
import { Brand } from "../packages/experience/Brand";
import { initialHandheld } from "../packages/experience/handheld";

const dataUrl = async (path: string, type: string) =>
	`data:${type};base64,${(await readFile(path)).toString("base64")}`;
async function embeddedStyle(path: string) {
	let css = await readFile(path, "utf8");
	for (const match of css.matchAll(/url\("([^"]+)"\)/g)) {
		const source = match[1] as string;
		if (source.startsWith("data:")) continue;
		const font = source.startsWith("@")
			? resolve("node_modules", source)
			: resolve(dirname(path), source);
		css = css.replace(match[0], `url("${await dataUrl(font, "font/woff2")}")`);
	}
	return css;
}

const styles = (
	await Promise.all([
		embeddedStyle("packages/experience/base.css"),
		embeddedStyle("apps/landing/landing.css"),
		readFile("scripts/social.css", "utf8"),
	])
).join("\n");
const portrait = `data:image/jpeg;base64,${(
	await sharp("assets/source/portrait.jpeg")
		.extract({ left: 190, top: 200, width: 420, height: 500 })
		.jpeg({ quality: 95 })
		.toBuffer()
).toString("base64")}`;
const lcdPortrait = await dataUrl(
	"design-public/design-assets/portrait-dither.png",
	"image/png",
);
const directory = "design-public/design-assets/social";
await mkdir(directory, { recursive: true });
const manifest: Record<Surface, Partial<Record<Locale, string>>> = {
	landing: {},
	resume: {},
};
const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: 1200, height: 630 },
		deviceScaleFactor: 2,
	});
	await page.route("**/*", (route) => route.abort());
	for (const surface of ["landing", "resume"] as const)
		for (const locale of ["en", "zh"] as const) {
			const content = await loadContent(surface, locale);
			const markup = renderToStaticMarkup(
				<main
					id="social-preview"
					className={`social-card social-${surface} social-${locale}`}
				>
					<header>
						<Brand locale={locale} />
						<span>{surface === "resume" ? "RÉSUMÉ" : "PERSONAL WEBSITE"}</span>
					</header>
					<div className="social-copy">
						{surface === "landing" && (
							<p className="social-person">{content.meta.socialLabel}</p>
						)}
						<h1>{content.meta.socialHeading}</h1>
						{surface === "resume" && (
							<p className="social-role">{content.meta.socialLabel}</p>
						)}
					</div>
					{content.surface === "resume" ? (
						<figure className="social-portrait">
							<img src={portrait} alt="" />
						</figure>
					) : (
						<div className="social-object">
							<GameBoy
								content={content}
								state={initialHandheld}
								active
								dispatch={() => {}}
								openSelected={() => {}}
							/>
						</div>
					)}
					<footer>
						<span>
							{surface === "resume"
								? "ENGINEERING · LEADERSHIP · AI"
								: "BLOG · RÉSUMÉ · GITHUB · LINKEDIN"}
						</span>
						<strong>lizheng.{surface === "resume" ? "dev" : "me"}</strong>
					</footer>
				</main>,
			).replaceAll("/design-assets/portrait-dither.png", lcdPortrait);
			await page.setContent(
				`<!doctype html><html lang="${locale === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><style>${styles}</style></head><body>${markup}</body></html>`,
			);
			await page.evaluate(async () => {
				await document.fonts.ready;
				await Promise.all([...document.images].map((image) => image.decode()));
			});
			const raster = await page.screenshot({ animations: "disabled" });
			const buffer = await sharp(raster)
				.resize(1200, 630)
				.jpeg({ quality: 90, chromaSubsampling: "4:4:4", mozjpeg: true })
				.toBuffer();
			if (buffer.length > 500 * 1024)
				throw new Error("Social image exceeds 500 KiB");
			const hash = createHash("sha256")
				.update(buffer)
				.digest("hex")
				.slice(0, 12);
			const name = `${surface}-${locale}.${hash}.jpg`;
			await writeFile(`${directory}/${name}`, buffer);
			manifest[surface][locale] = `/design-assets/social/${name}`;
			console.info(`${surface}/${locale}: ${name}, ${buffer.length} bytes`);
		}
} finally {
	await browser.close();
}
await writeFile(
	"packages/publishing/social-images.json",
	`${JSON.stringify(manifest, null, "\t")}\n`,
);
