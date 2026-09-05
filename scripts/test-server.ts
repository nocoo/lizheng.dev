import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";
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
async function run(command: string, args: string[]) {
	await new Promise<void>((done, fail) => {
		const child = spawn(command, args, { stdio: "inherit" });
		child.once("error", fail);
		child.once("exit", (code, signal) => {
			if (code === 0) done();
			else fail(new Error(`${command} exited: code=${code}, signal=${signal}`));
		});
	});
}
console.info(
	`Starting isolated ${layer} runtime with Node ${process.versions.node}`,
);
await run("bun", ["scripts/build.tsx", `.test-dist/${layer}`]);
const configuration = [
	"--config",
	"wrangler.test.jsonc",
	"--env",
	layer === "l3" ? "l3" : "",
];
const bundleDirectory = `.test-dist/${layer}-worker`;
process.env.WRANGLER_SEND_METRICS = "false";
process.env.WRANGLER_LOG_PATH = resolve(`.test-results/${layer}-wrangler.log`);
// Exercise a fixed Worker artifact, as production does. An esbuild watch
// process must not rebuild or terminate the server during browser assertions.
await run(process.execPath, [
	resolve("node_modules/wrangler/bin/wrangler.js"),
	"deploy",
	...configuration,
	"--dry-run",
	"--outdir",
	bundleDirectory,
]);
const state = await mkdtemp(join(tmpdir(), "lizheng-test-"));
const target = layer === "l3" ? config.env.l3 : config;
const { html_handling, not_found_handling, run_worker_first } = target.assets;
if (
	html_handling !== "none" ||
	not_found_handling !== "none" ||
	run_worker_first !== true
)
	throw new Error("Unsupported test asset routing");
const runtime = new Miniflare(
	convertV4MiniflareOptions({
		name: target.name,
		host: "127.0.0.1",
		port,
		modules: true,
		scriptPath: join(bundleDirectory, "index.js"),
		compatibilityDate: config.compatibility_date,
		compatibilityFlags: config.compatibility_flags,
		bindings: target.vars,
		assets: {
			directory: target.assets.directory,
			binding: target.assets.binding,
			run_worker_first,
			routerConfig: { has_user_worker: true },
			assetConfig: {
				html_handling,
				not_found_handling,
			},
		},
		defaultPersistRoot: state,
		cf: false,
	}),
);
let closing = false;
async function close() {
	if (closing) return;
	closing = true;
	await runtime.dispose();
	await rm(state, { recursive: true, force: true });
}
process.once("SIGINT", close);
process.once("SIGTERM", close);
try {
	console.info(`Isolated Worker ready at ${await runtime.ready}`);
} catch (error) {
	await close();
	throw error;
}
