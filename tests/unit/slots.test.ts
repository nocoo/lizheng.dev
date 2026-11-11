import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
	parseDeclarations,
	SLOT_IDS,
	SLOT_JOBS,
	SLOT_NAMES,
	type SlotId,
	type SlotRun,
	summaryTable,
	verifySlots,
} from "../../packages/quality/slots";

const sha = "a".repeat(40);
const declared = (overrides: Record<string, unknown> = {}) =>
	JSON.stringify({
		...Object.fromEntries(SLOT_IDS.map((id) => [id, { status: "impl" }])),
		...overrides,
	});
const successRuns = () =>
	Object.fromEntries(
		SLOT_IDS.filter((id) => id !== "Z1").map((id) => [
			id,
			{ result: "success", sha },
		]),
	) as Record<Exclude<SlotId, "Z1">, SlotRun>;

it("parses the committed declaration and keeps na reasons", () => {
	const declarations = parseDeclarations(
		readFileSync(".github/slot-status.json", "utf8"),
	);
	expect(declarations.L2.status).toBe("na");
	expect(declarations.L2.reason).toContain("wrangler");
	expect(declarations.P1.status).toBe("na");
	expect(declarations.L4.status).toBe("impl");
	expect(declarations.Z1.status).toBe("impl");
});

it("rejects declarations that are not a complete, current object", () => {
	expect(() => parseDeclarations("{")).toThrow(/not valid JSON/);
	expect(() => parseDeclarations("[]")).toThrow(/must be a JSON object/);
	expect(() => parseDeclarations("null")).toThrow(/must be a JSON object/);
	expect(() =>
		parseDeclarations(declared({ "L1.5": { status: "na", reason: "x" } })),
	).toThrow(/removed slot L1\.5/);
	expect(() => parseDeclarations(declared({ L5: { status: "impl" } }))).toThrow(
		/unknown slots: L5/,
	);
	const missing = JSON.parse(declared()) as Record<string, unknown>;
	delete missing.L3;
	expect(() => parseDeclarations(JSON.stringify(missing))).toThrow(
		/missing declarations: L3/,
	);
});

it("rejects malformed entries", () => {
	expect(() => parseDeclarations(declared({ S1: "impl" }))).toThrow(
		/entry for S1 must be an object/,
	);
	expect(() => parseDeclarations(declared({ S1: [] }))).toThrow(
		/entry for S1 must be an object/,
	);
	expect(() => parseDeclarations(declared({ S1: {} }))).toThrow(
		/invalid status 'undefined'/,
	);
	expect(() => parseDeclarations(declared({ S1: { status: "done" } }))).toThrow(
		/invalid status 'done'/,
	);
	expect(() => parseDeclarations(declared({ S1: { status: "na" } }))).toThrow(
		/requires a non-empty reason/,
	);
	expect(() =>
		parseDeclarations(declared({ S1: { status: "todo", reason: "   " } })),
	).toThrow(/requires a non-empty reason/);
	expect(() =>
		parseDeclarations(declared({ Z1: { status: "na", reason: "x" } })),
	).toThrow(/Z1 must be impl/);
});

it("verifies implemented slots and the shared tested sha", () => {
	const verified = verifySlots({
		declarations: parseDeclarations(
			declared({ L2: { status: "na", reason: "x" } }),
		),
		runs: { ...successRuns(), L2: { result: "skipped", sha: "" } },
		extras: [{ name: "browser-e2e", result: "success", sha }],
		expectedSha: sha,
	});
	expect(verified.map((item) => item.slot)).toEqual([
		"S1",
		"S2",
		"S3",
		"G1",
		"G2",
		"B1",
		"L1",
		"L3",
		"L4",
		"P1",
	]);
	expect(verified.every((item) => item.sha === sha)).toBe(true);
});

it("rejects implemented slots that did not succeed", () => {
	const declarations = parseDeclarations(declared());
	const runs = successRuns();
	expect(() =>
		verifySlots({ declarations, runs: {}, extras: [], expectedSha: sha }),
	).toThrow(/S1 has no job result/);
	expect(() =>
		verifySlots({
			declarations,
			runs: { ...runs, S1: { result: "failure", sha } },
			extras: [],
			expectedSha: sha,
		}),
	).toThrow(/S1 is declared impl but finished with 'failure'/);
	expect(() =>
		verifySlots({
			declarations,
			runs: { ...runs, S1: { result: "success", sha: "" } },
			extras: [],
			expectedSha: sha,
		}),
	).toThrow(/S1 is declared impl but reported no tested sha/);
});

it("rejects slots declared na that actually ran", () => {
	const declarations = parseDeclarations(
		declared({ P1: { status: "na", reason: "private" } }),
	);
	expect(() =>
		verifySlots({
			declarations,
			runs: { ...successRuns(), P1: { result: "success", sha } },
			extras: [],
			expectedSha: sha,
		}),
	).toThrow(/P1 is declared na but finished with 'success'/);
});

it("rejects sha drift between slots, extras and the run", () => {
	const declarations = parseDeclarations(declared());
	expect(() =>
		verifySlots({
			declarations,
			runs: {
				...successRuns(),
				S2: { result: "success", sha: "b".repeat(40) },
			},
			extras: [],
			expectedSha: sha,
		}),
	).toThrow(/commit sha mismatch between slot S1/);
	expect(() =>
		verifySlots({
			declarations,
			runs: successRuns(),
			extras: [{ name: "browser-e2e", result: "success", sha: "b".repeat(40) }],
			expectedSha: sha,
		}),
	).toThrow(/blocking job browser-e2e verified/);
	expect(() =>
		verifySlots({
			declarations,
			runs: successRuns(),
			extras: [],
			expectedSha: "c".repeat(40),
		}),
	).toThrow(/slots verified a+ but this run is c+/);
});

it("rejects failing blocking jobs and empty impl declarations", () => {
	const declarations = parseDeclarations(declared());
	expect(() =>
		verifySlots({
			declarations,
			runs: successRuns(),
			extras: [{ name: "release-package", result: "failure", sha: "" }],
			expectedSha: sha,
		}),
	).toThrow(/blocking job release-package finished with 'failure'/);
	const empty = parseDeclarations(
		JSON.stringify({
			...Object.fromEntries(
				SLOT_IDS.filter((id) => id !== "Z1").map((id) => [
					id,
					{ status: "na", reason: "not applicable" },
				]),
			),
			Z1: { status: "impl" },
		}),
	);
	expect(() =>
		verifySlots({
			declarations: empty,
			runs: Object.fromEntries(
				SLOT_IDS.filter((id) => id !== "Z1").map((id) => [
					id,
					{ result: "skipped", sha: "" },
				]),
			),
			extras: [],
			expectedSha: sha,
		}),
	).toThrow(/no implemented slot besides Z1/);
});

it("renders a slot summary table", () => {
	const table = summaryTable({
		declarations: parseDeclarations(
			declared({ P1: { status: "na", reason: "private | no package" } }),
		),
		runs: { ...successRuns(), P1: { result: "skipped", sha: "" } },
	});
	expect(table).toContain("| L4: E2E | impl | — | success |");
	expect(table).toContain(
		"| P1: Package | na | private \\| no package | skipped |",
	);
	expect(table).toContain("| Z1: Gate | impl | — | success |");
	expect(table.trimEnd().split("\n")).toHaveLength(SLOT_IDS.length + 2);
	expect(
		summaryTable({
			declarations: parseDeclarations(declared()),
			runs: {},
		}),
	).toContain("| S1: Types | impl | — | not_run |");
	expect(Object.values(SLOT_NAMES)).toContain("L3: Integration");
	expect(Object.values(SLOT_JOBS)).toContain("z1-gate");
});
