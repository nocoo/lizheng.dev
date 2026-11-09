import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type Gate, gatesPassed, runGates } from "../packages/quality/gates";

const mode = process.argv[2];
const fixtureFailPath = join(process.cwd(), ".fixture-fail-gate");
if (existsSync(fixtureFailPath)) {
	const failGate = readFileSync(fixtureFailPath, "utf8").trim();
	const reject =
		(mode === "pre-push" &&
			(
				[
					"test:http",
					"isolation",
					"check:security",
					"check:budgets",
				] as string[]
			).includes(failGate)) ||
		(mode === "security" &&
			(
				[
					"gitleaks",
					"gitleaks-missing",
					"osv-scanner",
					"osv-scanner-missing",
					"check:security",
				] as string[]
			).includes(failGate));
	if (reject) {
		if (failGate.endsWith("-missing")) process.exit(127);
		process.exit(1);
	}
}
const command = (name: string, script: string): Gate => ({
	name,
	command: ["bun", "run", script],
});
const groups: Record<string, Gate[]> = {
	"pre-push": [
		command("L2", "test:http"),
		command("G2", "check:security"),
		command("budgets", "check:budgets"),
	],
	static: [
		command("lint", "lint"),
		command("types", "typecheck"),
		command("generated types", "types:check"),
		command("dependencies", "check:deps"),
		command("documents", "check:docs"),
	],
	security: [
		{
			name: "gitleaks",
			command: [
				"gitleaks",
				"git",
				"--no-banner",
				"--redact",
				"--log-opts=origin/main..HEAD",
			],
		},
		{
			name: "OSV",
			command: ["osv-scanner", "scan", "source", "--lockfile", "bun.lock"],
		},
	],
};
const gates = groups[mode ?? ""];
if (!gates) throw new Error("Unknown gate group");
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
