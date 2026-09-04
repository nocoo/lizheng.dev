import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertIsolation } from "../packages/quality/isolation";
import config from "../wrangler.test.jsonc";

const layer = process.argv[2];
if (layer !== "l2" && layer !== "l3") throw new Error("Expected l2 or l3");
const port = layer === "l2" ? 17046 : 27046;
assertIsolation(config, layer, port);
await new Promise<void>((resolve, reject) => {
	const probe = createServer();
	probe.once("error", reject);
	probe.listen(port, "127.0.0.1", () => probe.close(() => resolve()));
});
const build = Bun.spawn(["bun", "scripts/build.tsx", `.test-dist/${layer}`], {
	stdout: "inherit",
	stderr: "inherit",
});
if ((await build.exited) !== 0) throw new Error("Test build failed");
const state = await mkdtemp(join(tmpdir(), "lizheng-test-"));
const child = spawn(
	"bunx",
	[
		"wrangler",
		"dev",
		"--config",
		"wrangler.test.jsonc",
		...(layer === "l3" ? ["--env", "l3"] : []),
		"--local",
		"--ip",
		"127.0.0.1",
		"--port",
		String(port),
		"--persist-to",
		state,
		"--show-interactive-dev-session=false",
		"--inspector-port",
		"0",
	],
	{ stdio: "inherit", env: { ...process.env, WRANGLER_SEND_METRICS: "false" } },
);
let closing = false;
async function close() {
	if (closing) return;
	closing = true;
	child.kill("SIGTERM");
	await new Promise<void>((resolve) => child.once("exit", () => resolve()));
	await rm(state, { recursive: true, force: true });
}
process.once("SIGINT", close);
process.once("SIGTERM", close);
child.once("exit", async (code) => {
	await rm(state, { recursive: true, force: true });
	process.exitCode = code ?? 0;
});
