export interface Gate {
	name: string;
	command: string[];
}
export async function runGates(
	gates: Gate[],
	execute: (command: string[]) => Promise<number>,
) {
	return Promise.all(
		gates.map(async (gate) => {
			try {
				return { name: gate.name, code: await execute(gate.command) };
			} catch {
				return { name: gate.name, code: 1 };
			}
		}),
	);
}
export function gatesPassed(results: { code: number }[]): boolean {
	return results.length > 0 && results.every((result) => result.code === 0);
}
