import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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
const configuration = [
	"--config",
	"wrangler.test.jsonc",
	...(layer === "l3" ? ["--env", "l3"] : []),
];
const bundleDirectory = `.test-dist/${layer}-worker`;
const environment = {
	...process.env,
	WRANGLER_SEND_METRICS: "false",
	WRANGLER_LOG_PATH: resolve(`.test-results/${layer}-wrangler.log`),
};
// Exercise a fixed Worker artifact, as production does. An esbuild watch
// process must not rebuild or terminate the server during browser assertions.
const bundle = Bun.spawn(
	[
		"bunx",
		"wrangler",
		"deploy",
		...configuration,
		"--dry-run",
		"--outdir",
		bundleDirectory,
	],
	{ stdout: "inherit", stderr: "inherit", env: environment },
);
if ((await bundle.exited) !== 0) throw new Error("Test Worker bundling failed");
const state = await mkdtemp(join(tmpdir(), "lizheng-test-"));
const child = spawn(
	"bunx",
	[
		"wrangler",
		"dev",
		join(bundleDirectory, "index.js"),
		"--no-bundle",
		...configuration,
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
	{ stdio: "inherit", env: environment },
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
child.once("exit", async (code, signal) => {
	await rm(state, { recursive: true, force: true });
	if (!closing) {
		console.error(
			`Test Worker exited unexpectedly: code=${code}, signal=${signal}`,
		);
		process.exitCode = code || 1;
	}
});
