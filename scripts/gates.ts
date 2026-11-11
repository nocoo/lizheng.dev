import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Gate, gatesPassed, runGates } from "../packages/quality/gates";
import {
	parsePushRefs,
	selectPushTargets,
} from "../packages/quality/push-refs";

const command = (name: string, script: string): Gate => ({
	name,
	command: ["bun", "run", script],
});

const gitleaks = (scope: string, logOpts: string, config: string): Gate => ({
	name: `G1 secrets ${scope}`,
	command: [
		"gitleaks",
		"git",
		"--no-banner",
		"--redact",
		"--config",
		config,
		"--log-opts",
		logOpts,
	],
});

const osv: Gate = {
	name: "G2 dependencies",
	command: [
		"osv-scanner",
		"scan",
		"source",
		"--lockfile",
		"bun.lock",
		"--config",
		"osv-scanner.toml",
	],
};

function git(args: string[], cwd = "."): string {
	return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function hasCommit(sha: string): boolean {
	try {
		execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], {
			stdio: "ignore",
		});
		return true;
	} catch {
		return false;
	}
}

async function readPushRefs() {
	if (process.stdin.isTTY)
		throw new Error(
			"pre-push expects the refs Git writes to stdin; run it through git push",
		);
	const refs = parsePushRefs(await Bun.stdin.text());
	const { deletions, targets } = selectPushTargets(refs, {
		head: git(["rev-parse", "HEAD"]),
		hasCommit,
	});
	if (deletions.length > 0)
		console.info(
			`pre-push: deleted refs skip source checks: ${deletions.join(", ")}`,
		);
	return targets;
}

// The pushed commit is exported so unstaged or uncommitted work cannot satisfy the
// gate. Dependencies are reused only after the snapshot's own lockfile check.
function materialize(oid: string, repository: string): string {
	const snapshot = mkdtempSync(join(tmpdir(), "lizheng-push-"));
	const archive = join(snapshot, ".push-archive.tar");
	git(["archive", "-o", archive, oid], repository);
	execFileSync("tar", ["-xf", archive, "-C", snapshot]);
	rmSync(archive);
	// The dependency tree must come from the verified install, never from the tree.
	rmSync(join(snapshot, "node_modules"), { recursive: true, force: true });
	mkdirSync(join(snapshot, "node_modules"), { recursive: true });
	for (const entry of readdirSync(join(repository, "node_modules"))) {
		if (entry.startsWith(".") && entry !== ".bin") continue;
		symlinkSync(
			join(repository, "node_modules", entry),
			join(snapshot, "node_modules", entry),
		);
	}
	return snapshot;
}

async function prePushGates(): Promise<{ cwd?: string; gates: Gate[] }> {
	const targets = await readPushRefs();
	if (targets.length === 0) {
		console.info("pre-push: no source changes to verify");
		return { gates: [] };
	}
	const repository = git(["rev-parse", "--show-toplevel"]);
	const [target] = targets as [{ oid: string; remoteRef: string }];
	const snapshot = materialize(target.oid, repository);
	console.info(
		`pre-push: verifying ${target.oid} for ${target.remoteRef} in ${snapshot}`,
	);
	return {
		cwd: snapshot,
		gates: [
			...targets.map((item) =>
				gitleaks(
					item.remoteRef,
					`${item.oid} --not --remotes`,
					join(snapshot, ".gitleaks.toml"),
				),
			),
			command("dependencies", "check:dependency-snapshot"),
			osv,
			command("L3", "test:http"),
			command("budgets", "check:budgets"),
		],
	};
}

const mode = process.argv[2] ?? "";
let cwd = ".";
let snapshot: string | undefined;
let gates: Gate[];
if (mode === "pre-push") {
	const prepared = await prePushGates();
	cwd = prepared.cwd ?? ".";
	snapshot = prepared.cwd;
	gates = prepared.gates;
} else if (mode === "static") {
	gates = [
		command("lint", "lint"),
		command("types", "typecheck"),
		command("generated types", "types:check"),
		command("dependencies", "check:deps"),
		command("documents", "check:docs"),
		command("workflows", "check:workflows"),
	];
} else if (mode === "security") {
	gates = [
		gitleaks("pushed commits", "HEAD --not --remotes", ".gitleaks.toml"),
		osv,
	];
} else {
	throw new Error("Unknown gate group");
}

try {
	if (gates.length === 0) process.exit(0);
	const results = await runGates(gates, async (args) => {
		const proc = Bun.spawn(args, {
			cwd,
			stdout: "inherit",
			stderr: "inherit",
			env: { ...process.env, NO_COLOR: undefined },
		});
		return proc.exited;
	});
	for (const result of results)
		console.info(
			`${result.code === 0 ? "PASS" : "FAIL"} ${result.name} (${result.code})`,
		);
	process.exitCode = gatesPassed(results) ? 0 : 1;
} finally {
	if (snapshot) rmSync(snapshot, { recursive: true, force: true });
}
