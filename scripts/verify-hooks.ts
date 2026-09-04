import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Real Git hooks in an isolated fixture: inject each failed gate through stub
// binaries, then verify that Git refuses the operation. No source edits or bypass.
const root = await mkdtemp(join(tmpdir(), "lizheng-hook-test-"));
const bin = join(root, "bin");
await mkdir(bin);
await mkdir(join(root, ".husky"));
const husky = resolve("node_modules/husky/bin.js");
const gate = resolve("scripts/gates.ts");
const bun = process.execPath;
const env = {
	...process.env,
	PATH: `${bin}:${process.env.PATH}`,
	NO_COLOR: undefined,
};
function git(
	args: string[],
	expected = 0,
	additions: Record<string, string> = {},
) {
	const result = spawnSync("git", args, {
		cwd: root,
		env: { ...env, ...additions },
		encoding: "utf8",
	});
	if ((result.status === 0) !== (expected === 0))
		throw new Error(
			`Hook fixture git ${args[0]} returned ${result.status}: ${result.stderr}`,
		);
}
try {
	git(["init", "--quiet"]);
	git(["config", "user.email", "fixture@example.invalid"]);
	git(["config", "user.name", "Hook Fixture"]);
	const install = spawnSync("node", [husky], {
		cwd: root,
		env,
		encoding: "utf8",
	});
	if (install.status !== 0)
		throw new Error(`Husky fixture setup failed: ${install.stderr}`);
	for (const hook of ["pre-commit", "pre-push"]) {
		const original = await readFile(`.husky/${hook}`, "utf8");
		if (!original.includes(`bun scripts/gates.ts ${hook}`))
			throw new Error(`Hook is not wired: ${hook}`);
		await writeFile(
			join(root, ".husky", hook),
			`#!/bin/sh\n"${bun}" "${gate}" ${hook}\n`,
			{ mode: 0o755 },
		);
	}
	await writeFile(
		join(bin, "bun"),
		'#!/bin/sh\nif [ "$2" = "$FAIL_GATE" ]; then exit 1; fi\nexit 0\n',
		{ mode: 0o755 },
	);
	await writeFile(join(root, "fixture.txt"), "fixture\n");
	git(["add", "."]);
	for (const failure of [
		"check:staged",
		"check:static",
		"test:coverage",
		"build",
	])
		git(["commit", "-m", "must fail"], 1, { FAIL_GATE: failure });
	git(["commit", "-m", "all gates pass"]);
	const remote = join(root, "remote.git");
	git(["init", "--bare", "--quiet", remote]);
	git(["remote", "add", "origin", remote]);
	for (const failure of ["test:http", "check:security", "check:budgets"])
		git(["push", "origin", "HEAD"], 1, { FAIL_GATE: failure });
	git(["push", "origin", "HEAD"]);
	console.info(
		"Real Git fixture blocked all seven injected failures and accepted restored commit/push.",
	);
} finally {
	await rm(root, { recursive: true, force: true });
}
