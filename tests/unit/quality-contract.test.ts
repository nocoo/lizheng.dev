import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parse } from "yaml";
import {
	parseDeclarations,
	SLOT_IDS,
	SLOT_JOBS,
	SLOT_NAMES,
} from "../../packages/quality/slots";

const BASE_CI_SHA = "777bbe4f9bacab8a91d8c01974480a6ee23d28e0";
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

it("runs browser jobs in the same pinned Linux image as visual updates", () => {
	const image =
		"mcr.microsoft.com/playwright:v1.65.0-noble@sha256:9beb546099e11f52d62e505537914870e01a67e0e6b00ae41da4775324e73dbe";
	const extended = read(".github/workflows/extended.yml");
	for (const job of [
		slots.jobs["l4-e2e"],
		slots.jobs["browser-e2e"],
		extended.jobs.performance,
	]) {
		expect(job?.["runs-on"]).toBe("ubuntu-latest");
		expect(job?.container).toEqual({ image, options: "--ipc=host" });
		const commands = job?.steps?.map((step) => step.run ?? "").join("\n");
		expect(commands).toContain('test "$(node --version)" = "v26.13.1"');
		expect(commands).toContain('test "$(bun --version)" = "1.4.0"');
		expect(commands).toContain(
			"npm install --prefix /tmp/bun --no-save --ignore-scripts @oven/bun-linux-x64@1.4.0",
		);
		expect(commands).toContain(
			"bun install --frozen-lockfile --ignore-scripts",
		);
		expect(commands).toContain(
			'git config --global --add safe.directory "$GITHUB_WORKSPACE"',
		);
		const browserSteps = job?.steps?.filter((step) =>
			step.run?.startsWith("bun run test:"),
		);
		expect(browserSteps?.length).toBeGreaterThan(0);
		for (const step of browserSteps ?? []) expect(step.env?.HOME).toBe("/root");
	}
	for (const document of [slots, extended, release])
		for (const job of Object.values(document.jobs))
			if (job["runs-on"]) expect(job["runs-on"]).toBe("ubuntu-latest");
	expect(readFileSync("scripts/update-linux-snapshots.sh", "utf8")).toContain(
		image,
	);
});

it("pins every shared base-ci reference to v2026.15", () => {
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
