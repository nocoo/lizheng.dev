import { execFileSync } from "node:child_process";
import { type Gate, gatesPassed, runGates } from "../packages/quality/gates";
import {
	parsePushRefs,
	selectPushTargets,
} from "../packages/quality/push-refs";

const command = (name: string, script: string): Gate => ({
	name,
	command: ["bun", "run", script],
});

const gitleaks = (scope: string, logOpts: string): Gate => ({
	name: `G1 secrets ${scope}`,
	command: [
		"gitleaks",
		"git",
		"--no-banner",
		"--redact",
		"--config",
		".gitleaks.toml",
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

function git(args: string[]): string {
	return execFileSync("git", args, { encoding: "utf8" }).trim();
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
	if (targets.length === 0) {
		console.info("pre-push: no source changes to verify");
		return [];
	}
	return targets;
}

async function prePushGates(): Promise<Gate[]> {
	const targets = await readPushRefs();
	for (const target of targets)
		console.info(`pre-push: verifying ${target.oid} for ${target.remoteRef}`);
	return [
		...targets.map((target) =>
			gitleaks(target.remoteRef, `${target.oid} --not --remotes`),
		),
		osv,
		command("L3", "test:http"),
		command("budgets", "check:budgets"),
	];
}

const groups: Record<string, () => Gate[] | Promise<Gate[]>> = {
	"pre-push": prePushGates,
	static: () => [
		command("lint", "lint"),
		command("types", "typecheck"),
		command("generated types", "types:check"),
		command("dependencies", "check:deps"),
		command("documents", "check:docs"),
		command("workflows", "check:workflows"),
	],
	security: () => [gitleaks("pushed commits", "HEAD --not --remotes"), osv],
};

const build = groups[process.argv[2] ?? ""];
if (!build) throw new Error("Unknown gate group");
const gates = await build();
if (gates.length === 0) process.exit(0);
const results = await runGates(gates, async (args) => {
	const proc = Bun.spawn(args, {
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
