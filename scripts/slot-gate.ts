import { appendFileSync, readFileSync } from "node:fs";
import {
	type ExtraRun,
	parseDeclarations,
	SLOT_IDS,
	SLOT_JOBS,
	type SlotId,
	type SlotRun,
	summaryTable,
	verifySlots,
} from "../packages/quality/slots";

interface NeedEntry {
	result?: string;
	outputs?: Record<string, string>;
}

function fail(message: string): never {
	console.error(`::error::${message}`);
	process.exit(1);
}

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

const declarations = (() => {
	try {
		return parseDeclarations(readFileSync(".github/slot-status.json", "utf8"));
	} catch (error) {
		return fail(describeError(error));
	}
})();

const needs = (() => {
	try {
		const parsed = JSON.parse(process.env.NEEDS_JSON ?? "null") as Record<
			string,
			NeedEntry
		> | null;
		if (!parsed) throw new Error("Z1 received no job results");
		return parsed;
	} catch (error) {
		return fail(describeError(error));
	}
})();

const expectedSha = process.env.EXPECTED_SHA ?? "";
if (expectedSha === "") fail("Z1 requires the expected commit sha");

const runs: Partial<Record<SlotId, SlotRun>> = {};
const extras: ExtraRun[] = [];
for (const [job, entry] of Object.entries(needs)) {
	const run = {
		result: entry.result ?? "missing",
		sha: entry.outputs?.["tested-sha"] ?? "",
	};
	const slot = SLOT_IDS.find((id) => id !== "Z1" && SLOT_JOBS[id] === job);
	if (!slot) {
		if (job !== SLOT_JOBS.Z1) extras.push({ name: job, ...run });
		continue;
	}
	runs[slot] = run;
}
const missing = SLOT_IDS.filter((id) => id !== "Z1" && !runs[id]);
if (missing.length > 0)
	fail(`Z1 has no job result for slots: ${missing.join(", ")}`);

let verified: { slot: SlotId; sha: string }[];
try {
	verified = verifySlots({ declarations, runs, extras, expectedSha });
} catch (error) {
	fail(describeError(error));
}

for (const item of verified)
	console.info(`PASS ${item.slot} tested ${item.sha.slice(0, 12)}`);
for (const extra of extras) console.info(`PASS blocking job ${extra.name}`);
const summary = summaryTable({ declarations, runs });
console.info(summary);
if (process.env.GITHUB_STEP_SUMMARY)
	appendFileSync(
		process.env.GITHUB_STEP_SUMMARY,
		`\n## Slot gate\n\n${summary}\n`,
	);
if (process.env.GITHUB_OUTPUT)
	appendFileSync(process.env.GITHUB_OUTPUT, `tested-sha=${expectedSha}\n`);
