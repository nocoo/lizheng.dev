import { execFileSync, spawnSync } from "node:child_process";
import { symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Real Git hooks in an isolated fixture: inject failed gates through stub binaries and
// staged manifests, then verify that Git refuses the operation. No source edits or bypass.
const source = resolve(".");
const root = await mkdtemp(join(tmpdir(), "lizheng-hook-test-"));
// The bare remote lives outside the fixture worktree: a checkout must not treat it as content.
const remoteRoot = await mkdtemp(join(tmpdir(), "lizheng-hook-remote-"));
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
const failGateFile = join(root, ".fixture-fail-gate");
function git(
	args: string[],
	expected = 0,
	failGate = "",
	expectedOutput?: RegExp,
) {
	if (failGate) writeFileSync(failGateFile, failGate);
	else {
		try {
			unlinkSync(failGateFile);
		} catch {
			/* absent */
		}
	}
	const result = spawnSync("git", args, { cwd: root, env, encoding: "utf8" });
	if ((result.status === 0) !== (expected === 0))
		throw new Error(
			`Hook fixture git ${args[0]} expected failure for '${failGate}' but returned ${result.status}: ${result.stderr}`,
		);
	if (expectedOutput) {
		const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
		if (!expectedOutput.test(output))
			throw new Error(
				`Hook fixture git ${args[0]} missed ${expectedOutput}: ${output}`,
			);
	}
	return result;
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
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
FAIL_GATE=$(cat "$repo_root/.fixture-fail-gate" 2>/dev/null || true)
should_fail() { [ "$FAIL_GATE" = "$1" ]; }
case "$1" in
  scripts/*gates.ts) exec "$REAL_BUN" "$@" ;;
  scripts/*)
    base=$(basename "$1" .ts)
    if should_fail "check:docs" && [ "$base" = "check-docs" ]; then exit 1; fi
    exec "$REAL_BUN" "$@"
    ;;
  run)
    if should_fail "isolation" && [ "$2" = "test:http" ]; then exec "$REAL_BUN" "$FIXTURE_ISOLATION"; fi
    for gate in lint typecheck types:check check:deps check:docs check:workflows test:coverage build test:http check:budgets; do
      if should_fail "$gate" && [ "$2" = "$gate" ]; then exit 1; fi
    done
    exec "$REAL_BUN" "$@"
    ;;
esac
exec "$REAL_BUN" "$@"
`,
		{ mode: 0o755 },
	);
	for (const scanner of ["gitleaks", "osv-scanner"])
		await writeFile(
			join(bin, scanner),
			`#!/bin/sh
repo_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
FAIL_GATE=$(cat "$repo_root/.fixture-fail-gate" 2>/dev/null || true)
if [ "$FAIL_GATE" = "${scanner}" ]; then exit 1; fi
if [ "$FAIL_GATE" = "${scanner}-missing" ]; then exit 127; fi
exit 0
`,
			{ mode: 0o755 },
		);
	await writeFile(
		join(root, ".gitignore"),
		`${await readFile(join(root, ".gitignore"), "utf8")}\n/isolation.ts\n.fixture-fail-gate\n`,
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
	const commitGates = [
		"gitleaks",
		"lint",
		"typecheck",
		"types:check",
		"check:deps",
		"check:docs",
		"check:workflows",
		"test:coverage",
		"build",
	];
	for (const failure of commitGates)
		git(["commit", "-m", "must fail"], 1, failure);

	const manifest = join(root, "package.json");
	const manifestSource = await readFile(manifest, "utf8");
	await writeFile(
		manifest,
		manifestSource.replace(
			'"yaml": "2.9.1"',
			'"yaml": "2.9.1",\n\t\t"unlocked-package": "1.0.0"',
		),
	);
	git(["add", "-A"]);
	git(
		["commit", "-m", "must fail"],
		1,
		"",
		/bun\.lock records nothing|does not match|dependencies:/,
	);
	await writeFile(
		manifest,
		manifestSource.replace('"bun": ">=1.4.0"', '"bun": ">=99.0.0"'),
	);
	git(["add", "-A"]);
	git(
		["commit", "-m", "must fail"],
		1,
		"",
		/dependencies: bun .* does not satisfy engines\.bun/,
	);
	await writeFile(manifest, manifestSource);
	git(["add", "-A"]);
	git(["commit", "-m", "all gates pass"]);

	await writeFile(
		join(root, "isolation.ts"),
		`
import { readFileSync } from "node:fs";
import { assertIsolation } from ${JSON.stringify(resolve("packages/quality/isolation.ts"))};

const config = ${await readFile("wrangler.test.jsonc", "utf8")};
let failGate = "";
try {
  failGate = readFileSync(".fixture-fail-gate", "utf8").trim();
} catch {}
if (failGate === "isolation") config.name = "lizheng-dev";
assertIsolation(config, "l2", 17046);
`,
	);
	const remote = join(remoteRoot, "remote.git");
	git(["init", "--bare", "--quiet", remote]);
	git(["remote", "add", "origin", remote]);
	const branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
		cwd: root,
		encoding: "utf8",
	}).trim();
	const pushGates = [
		"test:http",
		"isolation",
		"check:budgets",
		"gitleaks",
		"gitleaks-missing",
		"osv-scanner",
		"osv-scanner-missing",
	];
	for (const failure of pushGates) git(["push", "origin", "HEAD"], 1, failure);

	git(["checkout", "--quiet", "-b", "side"]);
	await writeFile(join(root, "side.txt"), "side\n");
	git(["add", "-A"]);
	git(["commit", "-m", "side branch work"]);
	const sideSha = execFileSync("git", ["rev-parse", "HEAD"], {
		cwd: root,
		encoding: "utf8",
	}).trim();
	git(["checkout", "--quiet", branch]);
	git(
		["push", "origin", `refs/heads/side:refs/heads/side`],
		1,
		"",
		new RegExp(`${sideSha} is not HEAD`),
	);

	const missing = spawnSync(
		"sh",
		[join(root, ".husky", "pre-push"), "origin", remote],
		{
			cwd: root,
			env,
			encoding: "utf8",
			input: `refs/heads/ghost ${"a".repeat(40)} refs/heads/ghost ${"0".repeat(40)}\n`,
		},
	);
	if (missing.status === 0)
		throw new Error(
			"Hook accepted a push ref with a commit that is not present",
		);
	if (!/is not in this repository/.test(`${missing.stdout}${missing.stderr}`))
		throw new Error(
			`Missing-object rejection did not explain the cause: ${missing.stdout}${missing.stderr}`,
		);
	// The pushed commit is what counts: a clean worktree must not rescue a bad HEAD.
	const manifestPath = join(root, "package.json");
	const goodManifest = await readFile(manifestPath, "utf8");
	await writeFile(
		manifestPath,
		goodManifest.replace(
			'"yaml": "2.9.1"',
			'"yaml": "2.9.1",\n\t\t"unlocked-package": "1.0.0"',
		),
	);
	git(["add", "-A"]);
	const badTree = execFileSync("git", ["write-tree"], {
		cwd: root,
		encoding: "utf8",
	}).trim();
	const badCommit = execFileSync(
		"git",
		["commit-tree", badTree, "-p", "HEAD", "-m", "unpushed bad manifest"],
		{ cwd: root, encoding: "utf8" },
	).trim();
	execFileSync("git", ["update-ref", `refs/heads/${branch}`, badCommit], {
		cwd: root,
	});
	await writeFile(manifestPath, goodManifest);
	git(
		["push", "origin", "HEAD"],
		1,
		"",
		/dependencies: .*unlocked-package.*bun\.lock records nothing/,
	);
	git(["reset", "--hard", "--quiet", "HEAD~1"]);

	const rejections = commitGates.length + pushGates.length + 3;
	git(["push", "origin", "HEAD"]);
	execFileSync("git", [
		"--git-dir",
		remote,
		"update-ref",
		"refs/heads/stale",
		execFileSync("git", ["rev-parse", "HEAD"], {
			cwd: root,
			encoding: "utf8",
		}).trim(),
	]);
	// A deletion must not run source checks: the injected failure would block it.
	git(["push", "origin", "--delete", "stale"], 0, "test:http");
	console.info(
		`Real Git fixture blocked ${rejections} failures, including nested static/security gates, dependency and toolchain drift, a bad pushed commit behind a clean worktree, non-HEAD refs and absent commits, and accepted a commit, a push and a deletion that skipped source checks.`,
	);
} finally {
	await rm(root, { recursive: true, force: true });
	await rm(remoteRoot, { recursive: true, force: true });
}
