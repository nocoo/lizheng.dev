import { execFileSync, spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repo = resolveRepo();
const owned = mkdtempSync(join(tmpdir(), "lizheng-l1-gate-"));
let failed = 0;

function resolveRepo() {
	const cwd = process.cwd();
	if (existsSync(join(cwd, "scripts/pre-commit-l1.sh"))) return cwd;
	throw new Error("verify-l1-gate must run from the repository root");
}

function check(name: string, ok: boolean, detail = "") {
	const text = (ok ? detail : detail)
		.trim()
		.replace(/\s+/g, " ")
		.slice(0, ok ? 320 : 480);
	console.info(`${ok ? "ok" : "FAIL"} ${name}${text ? `: ${text}` : ""}`);
	if (!ok) failed = 1;
}

function rootIndex() {
	return execFileSync("git", ["diff", "--cached", "--name-only"], {
		cwd: repo,
		encoding: "utf8",
	});
}

const indexBefore = rootIndex();

function snapshotGone(_scratch: string, leftovers: string[]) {
	return leftovers.every((name) => !name.startsWith("lizheng-index-"));
}

function materializeArchive(target: string) {
	const archive = join(target, ".l1-gate-archive.tar");
	execFileSync("git", ["archive", "-o", archive, "HEAD"], { cwd: repo });
	execFileSync("tar", ["-xf", archive], { cwd: target });
	rmSync(archive);
	symlinkSync(join(repo, "node_modules"), join(target, "node_modules"));
	execFileSync("git", ["init", "-q"], { cwd: target });
	execFileSync("git", ["config", "user.email", "l1-gate@example.com"], {
		cwd: target,
	});
	execFileSync("git", ["config", "user.name", "l1-gate"], { cwd: target });
	writeFileSync(
		join(target, ".gitignore"),
		`${readFileSync(join(repo, ".gitignore"), "utf8")}\n.tmp/\n`,
	);
	execFileSync("git", ["add", "-A"], { cwd: target });
}

function runHook(
	dir: string,
	scratch: string,
	env: Record<string, string> = {},
) {
	const result = spawnSync("sh", ["scripts/pre-commit-l1.sh"], {
		cwd: dir,
		env: { ...process.env, TMPDIR: scratch, PATH: process.env.PATH, ...env },
		encoding: "utf8",
	});
	const leftovers = existsSync(scratch) ? readdirSync(scratch) : ["missing"];
	return {
		status: result.status,
		output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
		leftovers,
	};
}

const passingAssertion = "expect(true).toBe(true)";
const failingAssertion = "expect(true).toBe(false)";
const probeTest = join("tests", "unit", "l1-gate-probe.test.ts");

try {
	const scratchHealthy = join(owned, "scratch-healthy");
	mkdirSync(scratchHealthy, { recursive: true });
	const healthyDir = join(owned, "healthy");
	mkdirSync(healthyDir);
	materializeArchive(healthyDir);
	const healthy = runHook(healthyDir, scratchHealthy);
	check("healthy index snapshot exits 0", healthy.status === 0, healthy.output);
	check(
		"healthy removes snapshot temp dir",
		snapshotGone(scratchHealthy, healthy.leftovers),
		healthy.leftovers.join(","),
	);

	const scratchUt = join(owned, "scratch-ut");
	mkdirSync(scratchUt, { recursive: true });
	const utDir = join(owned, "ut-fail");
	mkdirSync(utDir);
	materializeArchive(utDir);
	const probePath = join(utDir, probeTest);
	const probeSource = readFileSync(join(repo, probeTest), "utf8");
	writeFileSync(
		probePath,
		probeSource.replace(passingAssertion, failingAssertion),
	);
	execFileSync("git", ["add", "--", probeTest], { cwd: utDir });
	writeFileSync(probePath, probeSource);
	const ut = runHook(utDir, scratchUt);
	check(
		"staged unit test failure rejects",
		ut.status !== 0 && /AssertionError|expected false|FAIL/i.test(ut.output),
		ut.output,
	);
	check(
		"UT probe leaves unstaged worktree fix",
		readFileSync(probePath, "utf8").includes(passingAssertion),
	);
	check(
		"UT probe keeps failing staged index",
		execFileSync("git", ["show", `:${probeTest}`], {
			cwd: utDir,
			encoding: "utf8",
		}).includes(failingAssertion),
	);

	const scratchReal = join(owned, "scratch-real");
	mkdirSync(scratchReal, { recursive: true });
	const realStart = Date.now();
	const real = runHook(repo, scratchReal);
	const realSeconds = (Date.now() - realStart) / 1000;
	check(
		"repository hook exits 0 on clean index",
		real.status === 0,
		`${real.output.slice(0, 200)} elapsed ${realSeconds.toFixed(2)}s`,
	);

	check("repository index untouched", rootIndex() === indexBefore);
} finally {
	rmSync(owned, { recursive: true, force: true });
}

if (failed) process.exit(failed);
console.info("L1 gate probes passed");
