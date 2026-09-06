import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Conventional raster fallbacks use the same four-square mark as the SVG icon.
const source = await readFile("design-public/favicon.svg");
const sizes = [16, 32, 48];
const images = await Promise.all(
	sizes.map((size) => sharp(source).resize(size, size).png().toBuffer()),
);
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (const [index, data] of images.entries()) {
	const entry = 6 + index * 16;
	directory[entry] = sizes[index] as number;
	directory[entry + 1] = sizes[index] as number;
	directory.writeUInt16LE(1, entry + 4);
	directory.writeUInt16LE(32, entry + 6);
	directory.writeUInt32LE(data.length, entry + 8);
	directory.writeUInt32LE(offset, entry + 12);
	offset += data.length;
}
await writeFile(
	"design-public/favicon.ico",
	Buffer.concat([directory, ...images]),
);
await sharp(source)
	.resize(180, 180)
	.flatten({ background: "#f0f0e9" })
	.png()
	.toFile("design-public/apple-touch-icon.png");
console.info("Generated 16/32/48px favicon.ico and 180px Apple touch icon.");
