import { execFileSync, spawnSync } from "node:child_process";
import { symlinkSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Real Git hooks in an isolated fixture: inject each failed gate through stub
// binaries, then verify that Git refuses the operation. No source edits or bypass.
const source = resolve(".");
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
	REAL_BUN: bun,
	REAL_GATE: gate,
	FIXTURE_ISOLATION: join(root, "isolation.ts"),
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
	const archive = join(root, ".hook-fixture-archive.tar");
	execFileSync("git", ["archive", "-o", archive, "HEAD"], { cwd: source });
	execFileSync("tar", ["-xf", archive], { cwd: root });
	await rm(archive);
	symlinkSync(resolve("node_modules"), join(root, "node_modules"));
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
		if (hook === "pre-commit") {
			if (!original.includes("scripts/pre-commit-l1.sh"))
				throw new Error("Hook is not wired: pre-commit");
			await writeFile(
				join(root, ".husky", hook),
				`#!/bin/sh\nsh scripts/pre-commit-l1.sh\n`,
				{ mode: 0o755 },
			);
		} else {
			if (!original.includes(`bun scripts/gates.ts ${hook}`))
				throw new Error(`Hook is not wired: ${hook}`);
			await writeFile(
				join(root, ".husky", hook),
				`#!/bin/sh\n"${bun}" "${gate}" ${hook}\n`,
				{ mode: 0o755 },
			);
		}
	}
	await writeFile(
		join(bin, "bun"),
		`#!/bin/sh
should_fail() { [ "$FAIL_GATE" = "$1" ]; }
case "$1" in
  *gates.ts)
    if should_fail "check:static" && [ "$2" = "static" ]; then exit 1; fi
    exec "$REAL_BUN" "$@"
    ;;
  run)
    for gate in lint typecheck types:check check:deps check:docs test:coverage build test:http; do
      if should_fail "$gate" && [ "$2" = "$gate" ]; then exit 1; fi
    done
    exec "$REAL_BUN" "$@"
    ;;
  check:security) exec "$REAL_BUN" "$REAL_GATE" security ;;
esac
case "$2" in
  test:http) exec "$REAL_BUN" "$FIXTURE_ISOLATION" ;;
esac
echo "Hook fixture bun stub rejected: $*" >&2
exit 127
`,
		{ mode: 0o755 },
	);
	for (const scanner of ["gitleaks", "osv-scanner"])
		await writeFile(
			join(bin, scanner),
			`#!/bin/sh
if [ "$FAIL_GATE" = "${scanner}" ]; then exit 1; fi
if [ "$FAIL_GATE" = "${scanner}-missing" ]; then exit 127; fi
exit 0
`,
			{ mode: 0o755 },
		);
	await writeFile(
		join(root, "isolation.ts"),
		`
import { assertIsolation } from ${JSON.stringify(resolve("packages/quality/isolation.ts"))};
const config = ${await readFile("wrangler.test.jsonc", "utf8")};
if (process.env.FAIL_GATE === "isolation") config.name = "lizheng-dev";
assertIsolation(config, "l2", 17046);
`,
	);
	git(["add", "-A"]);
	spawnSync(
		"git",
		["rm", "-r", "--cached", "-f", "--ignore-unmatch", "node_modules"],
		{
			cwd: root,
			stdio: "ignore",
		},
	);
	git(["add", "-A"]);
	for (const failure of [
		"gitleaks",
		"check:static",
		"lint",
		"typecheck",
		"types:check",
		"check:deps",
		"check:docs",
		"test:coverage",
		"build",
	])
		git(["commit", "-m", "must fail"], 1, { FAIL_GATE: failure });
	git(["commit", "-m", "all gates pass"]);
	const remote = join(root, "remote.git");
	git(["init", "--bare", "--quiet", remote]);
	git(["remote", "add", "origin", remote]);
	for (const failure of [
		"test:http",
		"isolation",
		"check:security",
		"check:budgets",
		"gitleaks",
		"gitleaks-missing",
		"osv-scanner",
		"osv-scanner-missing",
	])
		git(["push", "origin", "HEAD"], 1, { FAIL_GATE: failure });
	git(["push", "origin", "HEAD"]);
	console.info(
		"Real Git fixture blocked all 17 injected failures, including nested static/security gates and production-resource isolation, and accepted restored commit/push.",
	);
} finally {
	await rm(root, { recursive: true, force: true });
}
