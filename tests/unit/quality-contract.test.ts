import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parse } from "yaml";
import {
	parseDeclarations,
	SLOT_IDS,
	SLOT_JOBS,
	SLOT_NAMES,
} from "../../packages/quality/slots";

const BASE_CI_SHA = "e4598815d171e2281f77f27a4800ff8fc2537f3f";
const PINNED = new RegExp(`^nocoo/base-ci/[^@]+@${BASE_CI_SHA}$`);

interface Step {
	run?: string;
	uses?: string;
	with?: Record<string, string>;
}
interface Job {
	name?: string;
	uses?: string;
	if?: string;
	needs?: string[];
	outputs?: Record<string, string>;
	steps?: Step[];
}
interface Document {
	jobs: Record<string, Job>;
}

const read = (path: string) => parse(readFileSync(path, "utf8")) as Document;
const slots = read(".github/workflows/quality-slots.yml");
const ci = read(".github/workflows/ci.yml");
const release = read(".github/workflows/release.yml");
const slotJobKeys = Object.values(SLOT_JOBS);

it("declares one canonical job per System0 slot", () => {
	for (const id of SLOT_IDS) {
		const job = slots.jobs[SLOT_JOBS[id]];
		expect(job, `missing slot job ${SLOT_JOBS[id]}`).toBeDefined();
		expect(job?.name).toBe(SLOT_NAMES[id]);
	}
	const labelled = /^(S1|S2|S3|G1|G2|B1|L1|L2|L3|L4|P1|Z1):/;
	for (const [key, job] of Object.entries(slots.jobs))
		if (!slotJobKeys.includes(key))
			expect(job.name ?? key).not.toMatch(labelled);
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

it("aggregates every slot job and every blocking job in Z1", () => {
	const gate = slots.jobs[SLOT_JOBS.Z1];
	expect(gate?.if).toBe("always()");
	const blocking = Object.keys(slots.jobs).filter(
		(key) => key !== SLOT_JOBS.Z1,
	);
	expect([...(gate?.needs ?? [])].sort()).toEqual(blocking.sort());
	expect(
		gate?.steps?.some((step) =>
			`${step.run ?? ""}`.includes("scripts/slot-gate.ts"),
		),
	).toBe(true);
	expect(gate?.outputs?.["tested-sha"]).toMatch(
		/^\$\{\{ steps\.gate\.outputs\.tested-sha \}\}$/,
	);
});

it("keeps the caller shape branch protection depends on", () => {
	expect(Object.keys(ci.jobs)).toEqual(["quality"]);
	const caller = ci.jobs.quality;
	expect(caller?.uses).toBe("./.github/workflows/quality-slots.yml");
	expect(caller?.name).toBeUndefined();
});

it("pins every shared base-ci reference to v2026.13", () => {
	const files = [
		".github/workflows/ci.yml",
		".github/workflows/quality-slots.yml",
		".github/workflows/release.yml",
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

it("requires the aggregated quality check for release proof", () => {
	const sources = Object.values(release.jobs)
		.flatMap((job) => job.steps ?? [])
		.filter((step) => step.uses?.includes("release-source"));
	expect(sources).toHaveLength(2);
	for (const source of sources)
		expect(source.with?.["required-quality-check"]).toBe("quality / Z1: Gate");
});
