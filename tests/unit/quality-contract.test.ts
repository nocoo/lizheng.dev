import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parse } from "yaml";
import {
	parseDeclarations,
	SLOT_IDS,
	SLOT_JOBS,
	SLOT_NAMES,
} from "../../packages/quality/slots";

const BASE_CI_SHA = "9933a7461a312cfaac526ccc5907357a7e3f669a";
const PINNED = new RegExp(`^nocoo/base-ci/[^@]+@${BASE_CI_SHA}$`);

interface Step {
	run?: string;
	uses?: string;
	env?: Record<string, string>;
	with?: Record<string, string>;
}
interface Job {
	name?: string;
	uses?: string;
	"runs-on"?: string;
	container?: { image: string; options: string };
	if?: string;
	needs?: string[];
	outputs?: Record<string, string>;
	steps?: Step[];
	with?: Record<string, unknown>;
}
interface Document {
	jobs: Record<string, Job>;
}

const read = (path: string) => parse(readFileSync(path, "utf8")) as Document;
const slots = read(".github/workflows/quality-slots.yml");
const pipeline = read(".github/workflows/pipeline.yml");
const slotJobKeys = Object.values(SLOT_JOBS);

it("declares one canonical job per System0 slot", () => {
	for (const id of SLOT_IDS) {
		const job = slots.jobs[SLOT_JOBS[id]];
		expect(job, `missing slot job ${SLOT_JOBS[id]}`).toBeDefined();
		expect(job?.name).toBe(SLOT_NAMES[id]);
	}
	const nonSlotJobs = Object.keys(slots.jobs).filter(
		(key) => !slotJobKeys.includes(key),
	);
	expect(nonSlotJobs).toEqual([]);
});

it("keeps the committed declaration in step with the jobs that run", () => {
	const declarations = parseDeclarations(
		readFileSync(".github/slot-status.json", "utf8"),
	);
	for (const id of SLOT_IDS) {
		if (id === "Z1") continue;
		const job = slots.jobs[SLOT_JOBS[id]];
		expect(job, `missing slot job ${SLOT_JOBS[id]}`).toBeDefined();
		expect(job?.if !== undefined).toBe(declarations[id].status !== "impl");
		if (declarations[id].status === "impl")
			expect(Object.keys(job?.outputs ?? {})).toContain("tested-sha");
	}
});

it("aggregates every slot job and every blocking job in a checkout-free Z1", () => {
	const gate = slots.jobs[SLOT_JOBS.Z1];
	expect(gate?.if).toBe("always()");
	const blocking = Object.keys(slots.jobs).filter(
		(key) => key !== SLOT_JOBS.Z1,
	);
	expect([...(gate?.needs ?? [])].sort()).toEqual(blocking.sort());
	expect(
		gate?.steps?.some((step) => step.uses?.startsWith("actions/checkout@")),
	).toBe(false);
	const gateStep = gate?.steps?.find(
		(step) =>
			step.uses === `nocoo/base-ci/.github/actions/z1-gate@${BASE_CI_SHA}`,
	);
	expect(gateStep).toBeDefined();
	expect(gateStep?.with?.["needs-json"]).toMatch(
		/^\$\{\{ toJSON\(needs\) \}\}$/,
	);
	expect(gateStep?.with?.["expected-sha"]).toMatch(/^\$\{\{ github\.sha \}\}$/);
	expect(gateStep?.with?.["skipped-jobs"]).toBe("l2-runtime=L2: Runtime");
	expect(gate?.outputs?.["tested-sha"]).toMatch(
		/^\$\{\{ steps\.gate\.outputs\.tested-sha \}\}$/,
	);
});

it("keeps the caller shape branch protection depends on", () => {
	expect(Object.keys(pipeline.jobs)).toEqual(["quality", "deploy"]);
	const caller = pipeline.jobs.quality;
	expect(caller?.uses).toBe("./.github/workflows/quality-slots.yml");
	expect(caller?.name).toBeUndefined();
});

it("runs browser jobs on ubuntu-latest with setup-playwright and reuses B1 dist", () => {
	const extended = read(".github/workflows/extended.yml");
	for (const job of [slots.jobs["l4-e2e"], extended.jobs.performance]) {
		expect(job?.["runs-on"]).toBe("ubuntu-latest");
		expect(job?.container).toBeUndefined();
		const setupJs = job?.steps?.find((step) =>
			step.uses?.startsWith("nocoo/base-ci/.github/actions/setup-js@"),
		);
		expect(setupJs?.with?.["package-manager"]).toBe("bun");
		expect(setupJs?.with?.["install-policy"]).toBe("blocked");
		const setupPlaywright = job?.steps?.find((step) =>
			step.uses?.startsWith("nocoo/base-ci/.github/actions/setup-playwright@"),
		);
		expect(setupPlaywright?.with?.["package-manager"]).toBe("bun");
		expect(setupPlaywright?.with?.browsers).toBe("chromium");
	}
	for (const jobId of ["l3-integration", "l4-e2e", "p1-package"]) {
		const job = slots.jobs[jobId];
		expect(job?.needs).toContain("b1-build");
		expect(
			job?.steps?.some((step) =>
				step.uses?.startsWith("actions/download-artifact@"),
			),
		).toBe(true);
	}
	for (const document of [slots, extended, pipeline])
		for (const job of Object.values(document.jobs))
			if (job["runs-on"]) expect(job["runs-on"]).toBe("ubuntu-latest");
});

it("pins every shared base-ci reference to v2026.25", () => {
	const files = [
		".github/workflows/pipeline.yml",
		".github/workflows/quality-slots.yml",
		".github/workflows/extended.yml",
	];
	let references = 0;
	for (const file of files) {
		const document = read(file);
		for (const job of Object.values(document.jobs)) {
			const items = [job, ...(job.steps ?? [])];
			const uses = items
				.map((item) => item.uses)
				.filter(
					(reference): reference is string =>
						reference?.startsWith("nocoo/base-ci/") === true,
				);
			for (const reference of uses) {
				references += 1;
				expect(reference, `${file} reference`).toMatch(PINNED);
			}
		}
	}
	expect(references).toBeGreaterThan(0);
});

it("gates unified deploy on quality and main push with mandatory verify", () => {
	const deploy = pipeline.jobs.deploy;
	expect(deploy?.needs).toEqual(["quality"]);
	expect(deploy?.uses).toBe(
		`nocoo/base-ci/.github/workflows/deploy-worker.yml@${BASE_CI_SHA}`,
	);
	expect(deploy?.with?.["artifact-name"]).toMatch(
		/^worker-\$\{\{ github\.sha \}\}$/,
	);
	expect(deploy?.with?.["verify-command"]).toBe(
		"bun scripts/verify-production.ts",
	);
});
