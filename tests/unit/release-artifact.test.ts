import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, expect, it } from "vitest";

const roots: string[] = [];
const script = resolve("scripts/unpack-release.sh");

afterEach(async () => {
	await Promise.all(
		roots.splice(0).map((root) => rm(root, { recursive: true })),
	);
});

async function fixture(omit = "") {
	const root = await mkdtemp(join(tmpdir(), "lizheng-release-"));
	roots.push(root);
	const source = join(root, "source");
	const output = join(root, "output");
	await mkdir(output);
	await mkdir(join(source, ".release-worker"), { recursive: true });
	const files = [
		".release-worker/index.js",
		...(["resume", "landing"] as const).flatMap((surface) =>
			["en", "zh"].map(
				(locale) => `dist/_sites/${surface}/${locale}/index.html`,
			),
		),
	];
	for (const file of files.filter((file) => file !== omit)) {
		const path = join(source, file);
		await mkdir(resolve(path, ".."), { recursive: true });
		await writeFile(path, file);
	}
	return { root, source, output, archive: join(root, "release-artifact.tgz") };
}

function pack(source: string, archive: string) {
	const result = spawnSync(
		"tar",
		["-czf", archive, ".release-worker", "dist"],
		{
			cwd: source,
		},
	);
	expect(result.status, result.stderr.toString()).toBe(0);
}

function unpack(output: string, archive: string) {
	return spawnSync("bash", [script, archive], {
		cwd: output,
		encoding: "utf8",
	});
}

it("drains a large listing and extracts the complete release in an empty directory", async () => {
	const { source, output, archive } = await fixture();
	await Promise.all(
		Array.from({ length: 600 }, (_, index) =>
			writeFile(
				join(source, ".release-worker", `${index}-${"x".repeat(150)}`),
				"",
			),
		),
	);
	const result = spawnSync(
		"tar",
		["-czf", archive, ".release-worker", "dist"],
		{
			cwd: source,
		},
	);
	expect(result.status).toBe(0);
	const extracted = unpack(output, archive);
	expect(extracted.status, extracted.stderr).toBe(0);
	expect(await readFile(join(output, ".release-worker/index.js"), "utf8")).toBe(
		".release-worker/index.js",
	);
});

it.each([".release-worker/index.js", "dist/_sites/landing/zh/index.html"])(
	"rejects an incomplete release missing %s",
	async (missing) => {
		const { source, output, archive } = await fixture(missing);
		pack(source, archive);
		expect(unpack(output, archive).status).not.toBe(0);
	},
);

it("rejects a missing or corrupt archive", async () => {
	const { output, archive } = await fixture();
	expect(unpack(output, archive).status).not.toBe(0);
	await writeFile(archive, "not a gzip archive");
	expect(unpack(output, archive).status).not.toBe(0);
});
