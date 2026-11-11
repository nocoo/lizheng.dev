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
function materialize(snapshot: string, oid: string, repository: string): void {
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
}

// Owned temporary tree for the pushed commit; cleaned up even when preparation fails.
let snapshot: string | undefined;

interface PlannedGate {
	cwd: string;
	gate: Gate;
}

async function prePushGates(): Promise<PlannedGate[]> {
	const targets = await readPushRefs();
	if (targets.length === 0) {
		console.info("pre-push: no source changes to verify");
		return [];
	}
	const repository = git(["rev-parse", "--show-toplevel"]);
	const [target] = targets as [{ oid: string; remoteRef: string }];
	snapshot = mkdtempSync(join(tmpdir(), "lizheng-push-"));
	materialize(snapshot, target.oid, repository);
	console.info(
		`pre-push: verifying ${target.oid} for ${target.remoteRef} in ${snapshot}`,
	);
	// Dependencies are the prerequisite for everything else: verify them alone so a
	// mismatched tree cannot run the suites it is supposed to support.
	const prerequisites = await runGates(
		[command("dependencies", "check:dependency-snapshot")],
		async (args) => {
			const proc = Bun.spawn(args, {
				cwd: snapshot,
				stdout: "inherit",
				stderr: "inherit",
				env: { ...process.env, NO_COLOR: undefined },
			});
			return proc.exited;
		},
	);
	for (const result of prerequisites)
		console.info(
			`${result.code === 0 ? "PASS" : "FAIL"} ${result.name} (${result.code})`,
		);
	if (!gatesPassed(prerequisites))
		throw new Error(
			"pre-push: the installed dependencies do not match the pushed lockfile",
		);
	// gitleaks needs Git metadata, which the exported tree does not have, so it runs
	// in the repository while using the pushed commit's config.
	return [
		...targets.map((item) => ({
			cwd: repository,
			gate: gitleaks(
				item.remoteRef,
				`${item.oid} --not --remotes`,
				join(snapshot ?? ".", ".gitleaks.toml"),
			),
		})),
		{ cwd: snapshot, gate: osv },
		{ cwd: snapshot, gate: command("L3", "test:http") },
		{ cwd: snapshot, gate: command("budgets", "check:budgets") },
	];
}

function plannedGates(mode: string): PlannedGate[] {
	if (mode === "static")
		return [
			command("lint", "lint"),
			command("types", "typecheck"),
			command("generated types", "types:check"),
			command("dependencies", "check:deps"),
			command("documents", "check:docs"),
			command("workflows", "check:workflows"),
		].map((gate) => ({ cwd: ".", gate }));
	if (mode === "security")
		return [
			gitleaks("pushed commits", "HEAD --not --remotes", ".gitleaks.toml"),
			osv,
		].map((gate) => ({ cwd: ".", gate }));
	throw new Error("Unknown gate group");
}

try {
	const mode = process.argv[2] ?? "";
	const planned =
		mode === "pre-push" ? await prePushGates() : plannedGates(mode);
	if (planned.length > 0) {
		const results = await runGates(
			planned.map((item) => item.gate),
			async (args) => {
				const gate = planned.find((item) => item.gate.command === args);
				const proc = Bun.spawn(args, {
					cwd: gate?.cwd ?? ".",
					stdout: "inherit",
					stderr: "inherit",
					env: { ...process.env, NO_COLOR: undefined },
				});
				return proc.exited;
			},
		);
		for (const result of results)
			console.info(
				`${result.code === 0 ? "PASS" : "FAIL"} ${result.name} (${result.code})`,
			);
		process.exitCode = gatesPassed(results) ? 0 : 1;
	}
} finally {
	// Covers a failure while the snapshot is still being prepared.
	if (snapshot) rmSync(snapshot, { recursive: true, force: true });
}
