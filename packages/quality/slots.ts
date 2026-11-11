export const SLOT_IDS = [
	"S1",
	"S2",
	"S3",
	"G1",
	"G2",
	"B1",
	"L1",
	"L2",
	"L3",
	"L4",
	"P1",
	"Z1",
] as const;

export type SlotId = (typeof SLOT_IDS)[number];

export const SLOT_JOBS: Record<SlotId, string> = {
	S1: "s1-types",
	S2: "s2-lint",
	S3: "s3-workflow",
	G1: "g1-secrets",
	G2: "g2-dependencies",
	B1: "b1-build",
	L1: "l1-unit",
	L2: "l2-runtime",
	L3: "l3-integration",
	L4: "l4-e2e",
	P1: "p1-package",
	Z1: "z1-gate",
};

export const SLOT_NAMES: Record<SlotId, string> = {
	S1: "S1: Types",
	S2: "S2: Lint",
	S3: "S3: Workflow",
	G1: "G1: Secrets",
	G2: "G2: Dependencies",
	B1: "B1: Build",
	L1: "L1: Unit",
	L2: "L2: Runtime",
	L3: "L3: Integration",
	L4: "L4: E2E",
	P1: "P1: Package",
	Z1: "Z1: Gate",
};

const STATUSES = ["impl", "na", "todo"] as const;

type SlotStatus = (typeof STATUSES)[number];

interface SlotDeclaration {
	status: SlotStatus;
	reason?: string;
}

export type SlotDeclarations = Record<SlotId, SlotDeclaration>;

export interface SlotRun {
	result: string;
	sha: string;
}

export interface ExtraRun {
	name: string;
	result: string;
	sha: string;
}

export function parseDeclarations(raw: string): SlotDeclarations {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		throw new Error(
			`slot status is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
		throw new Error("slot status must be a JSON object");
	const entries = parsed as Record<string, unknown>;
	if ("L1.5" in entries)
		throw new Error(
			"slot status uses the removed slot L1.5; worker runtime coverage belongs to L2",
		);
	const unknown = Object.keys(entries).filter(
		(key) => !(SLOT_IDS as readonly string[]).includes(key),
	);
	if (unknown.length > 0)
		throw new Error(
			`slot status declares unknown slots: ${unknown.join(", ")}`,
		);
	const missing = SLOT_IDS.filter((id) => !(id in entries));
	if (missing.length > 0)
		throw new Error(
			`slot status is missing declarations: ${missing.join(", ")}`,
		);
	const declarations = {} as SlotDeclarations;
	for (const id of SLOT_IDS) {
		const entry = entries[id];
		if (typeof entry !== "object" || entry === null || Array.isArray(entry))
			throw new Error(`slot status entry for ${id} must be an object`);
		const { status: declaredStatus, reason } = entry as Record<string, unknown>;
		if (
			typeof declaredStatus !== "string" ||
			!(STATUSES as readonly string[]).includes(declaredStatus)
		)
			throw new Error(
				`slot status entry for ${id} has an invalid status '${String(declaredStatus)}'`,
			);
		const status = declaredStatus as SlotStatus;
		if (status !== "impl") {
			if (typeof reason !== "string" || reason.trim() === "")
				throw new Error(
					`slot status entry for ${id} requires a non-empty reason`,
				);
			declarations[id] = { status, reason: reason as string };
			continue;
		}
		declarations[id] = { status: "impl" };
	}
	if (declarations.Z1.status !== "impl")
		throw new Error("slot status entry for Z1 must be impl");
	return declarations;
}

export function verifySlots(input: {
	declarations: SlotDeclarations;
	runs: Partial<Record<SlotId, SlotRun>>;
	extras: ExtraRun[];
	expectedSha: string;
}): { slot: SlotId; sha: string }[] {
	const verified: { slot: SlotId; sha: string }[] = [];
	for (const id of SLOT_IDS) {
		if (id === "Z1") continue;
		const { status } = input.declarations[id];
		const run = input.runs[id];
		if (!run) throw new Error(`slot ${id} has no job result to verify`);
		if (status === "impl") {
			if (run.result !== "success")
				throw new Error(
					`slot ${id} is declared impl but finished with '${run.result}'`,
				);
			if (run.sha === "")
				throw new Error(
					`slot ${id} is declared impl but reported no tested sha`,
				);
			verified.push({ slot: id, sha: run.sha });
			continue;
		}
		if (run.result !== "skipped")
			throw new Error(
				`slot ${id} is declared ${status} but finished with '${run.result}'`,
			);
	}
	const first = verified[0];
	if (!first)
		throw new Error("slot status declares no implemented slot besides Z1");
	for (const item of verified) {
		if (item.sha !== first.sha)
			throw new Error(
				`commit sha mismatch between slot ${first.slot} (${first.sha}) and slot ${item.slot} (${item.sha})`,
			);
	}
	if (first.sha !== input.expectedSha)
		throw new Error(
			`slots verified ${first.sha} but this run is ${input.expectedSha}`,
		);
	for (const extra of input.extras) {
		if (extra.result !== "success")
			throw new Error(
				`blocking job ${extra.name} finished with '${extra.result}'`,
			);
		if (extra.sha === "")
			throw new Error(`blocking job ${extra.name} reported no tested sha`);
		if (extra.sha !== first.sha)
			throw new Error(
				`blocking job ${extra.name} verified ${extra.sha} but slots verified ${first.sha}`,
			);
	}
	return verified;
}

export function summaryTable(input: {
	declarations: SlotDeclarations;
	runs: Partial<Record<SlotId, SlotRun>>;
}): string {
	const rows = [
		"| Slot | Status | Reason | Result |",
		"| --- | --- | --- | --- |",
	];
	for (const id of SLOT_IDS) {
		const declaration = input.declarations[id];
		if (id === "Z1") {
			rows.push(`| ${SLOT_NAMES[id]} | impl | — | success |`);
			continue;
		}
		const reason = declaration.reason?.replaceAll("|", "\\|") ?? "—";
		const result = input.runs[id]?.result ?? "not_run";
		rows.push(
			`| ${SLOT_NAMES[id]} | ${declaration.status} | ${reason} | ${result} |`,
		);
	}
	return `${rows.join("\n")}\n`;
}
