import { mkdir, readFile, writeFile } from "node:fs/promises";

// Only public UI strings and the two public landing documents are sent to the font subset service.
const sources = [
	"apps/landing/LandingPage.tsx",
	"apps/landing/DeviceGallery.tsx",
	"apps/landing/SceneAccessories.tsx",
	"apps/landing/devices/GameBoy.tsx",
	"apps/landing/devices/Nokia.tsx",
	"apps/landing/devices/Macintosh.tsx",
	"apps/landing/devices/IPod.tsx",
	"apps/landing/devices/Garmin.tsx",
	"apps/landing/devices/Honda.tsx",
	"apps/landing/devices/shared.tsx",
	"packages/experience/device-gallery.ts",
	"packages/experience/Preferences.tsx",
	"packages/experience/theme.ts",
	"packages/experience/Brand.tsx",
	"docs/content/03-landing-en.md",
	"docs/content/04-landing-zh.md",
];
const content = (
	await Promise.all(sources.map((path) => readFile(path, "utf8")))
).join("");
const characters = [...new Set(content.match(/[\u3000-\u9fff\uff00-\uffef]/gu))]
	.sort()
	.join("");
const url = new URL("https://fonts.googleapis.com/css2");
url.searchParams.set("family", "Noto Sans SC:wght@400..700");
url.searchParams.set("text", characters);
const response = await fetch(url, {
	headers: {
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
	},
	signal: AbortSignal.timeout(20000),
});
if (!response.ok) throw new Error(`Font metadata: ${response.status}`);
const css = await response.text();
const source = /src:\s*url\(([^)]+)\)/.exec(css)?.[1];
if (!source || new URL(source).hostname !== "fonts.gstatic.com")
	throw new Error("Unrecognized font source");
const font = await fetch(source, { signal: AbortSignal.timeout(20000) });
if (!font.ok) throw new Error(`Font download: ${font.status}`);
const data = await font.arrayBuffer();
if (new TextDecoder().decode(data.slice(0, 4)) !== "wOF2")
	throw new Error("Expected WOFF2");
const license = await fetch(
	"https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/LICENSE",
	{ signal: AbortSignal.timeout(20000) },
);
if (!license.ok) throw new Error(`Font license: ${license.status}`);
const licenseText = await license.text();
if (!licenseText.includes("SIL OPEN FONT LICENSE"))
	throw new Error("Expected OFL");
await mkdir("assets/fonts", { recursive: true });
await writeFile("assets/fonts/journey-cjk.woff2", new Uint8Array(data));
await writeFile("assets/fonts/OFL.txt", licenseText);
await writeFile("assets/fonts/characters.txt", `${characters}\n`);
console.info(
	`Saved ${characters.length} public characters, ${data.byteLength} bytes. Review screenshots after regenerating.`,
);
