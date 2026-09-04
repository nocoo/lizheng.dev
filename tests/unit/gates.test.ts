import { expect, it } from "vitest";
import { gatesPassed, runGates } from "../../packages/quality/gates";

it("waits for every gate and retains early failures", async () => {
	let finish: ((code: number) => void) | undefined;
	const pending = runGates(
		[
			{ name: "lint", command: ["bad"] },
			{ name: "L1", command: ["slow"] },
		],
		async ([command]) =>
			command === "bad"
				? 1
				: new Promise<number>((resolve) => {
						finish = resolve;
					}),
	);
	let done = false;
	pending.then(() => {
		done = true;
	});
	await Promise.resolve();
	expect(done).toBe(false);
	finish?.(0);
	const results = await pending;
	expect(results).toEqual([
		{ name: "lint", code: 1 },
		{ name: "L1", code: 0 },
	]);
	expect(gatesPassed(results)).toBe(false);
});
it("fails closed for missing scanners or thrown setup errors", async () => {
	const results = await runGates(
		[{ name: "G2", command: ["missing"] }],
		async () => {
			throw new Error("ENOENT");
		},
	);
	expect(gatesPassed(results)).toBe(false);
	expect(gatesPassed([])).toBe(false);
	expect(gatesPassed([{ code: 0 }])).toBe(true);
});
