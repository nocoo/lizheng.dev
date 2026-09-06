import { mkdir } from "node:fs/promises";
import sharp from "sharp";

await mkdir("design-public/design-assets", { recursive: true });
const original = "assets/source/portrait.jpeg";
const crop = { left: 190, top: 200, width: 420, height: 500 };
await sharp(original)
	.extract(crop)
	.resize(320, 380)
	.webp({ quality: 85 })
	.toFile("design-public/design-assets/portrait.webp");
const width = 64;
const height = 72;
const { data } = await sharp(original)
	.extract(crop)
	.resize(width, height)
	.grayscale()
	.normalise()
	.raw()
	.toBuffer({ resolveWithObject: true });
const values = Float32Array.from(data);
const palette = [
	[48, 61, 37],
	[94, 114, 62],
	[149, 168, 104],
	[208, 219, 161],
];
const pixels = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y++) {
	for (let x = 0; x < width; x++) {
		const index = y * width + x;
		const old = Math.min(255, Math.max(0, values[index] ?? 0));
		const step = Math.round(old / 85);
		const color = palette[step];
		if (!color) throw new Error("Invalid dither palette index");
		for (let channel = 0; channel < 3; channel++)
			pixels[index * 3 + channel] = color[channel] ?? 0;
		const error = old - step * 85;
		for (const [dx, dy, weight] of [
			[1, 0, 7],
			[-1, 1, 3],
			[0, 1, 5],
			[1, 1, 1],
		]) {
			if (dx === undefined || dy === undefined || weight === undefined)
				continue;
			const nx = x + dx;
			const ny = y + dy;
			if (nx >= 0 && nx < width && ny < height) {
				const next = ny * width + nx;
				values[next] = (values[next] ?? 0) + (error * weight) / 16;
			}
		}
	}
}
await sharp(pixels, { raw: { width, height, channels: 3 } })
	.png({ palette: true })
	.toFile("design-public/design-assets/portrait-dither.png");
console.info(
	"Created new portrait and four-tone LCD portrait from the original photograph.",
);
