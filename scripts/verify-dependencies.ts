import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
	auditInstalled,
	auditManifest,
	auditToolchain,
	type Manifest,
	parseLockfile,
	readInstalledPackages,
} from "../packages/quality/dependencies";

const nodeModules = resolve(process.argv[2] ?? "node_modules");
const manifest = JSON.parse(readFileSync("package.json", "utf8")) as Manifest;
const lock = parseLockfile(readFileSync("bun.lock", "utf8"));

const problems = [
	...auditToolchain(manifest, {
		bun: Bun.version,
		node: process.versions.node,
	}),
	...auditManifest(manifest, lock),
	...auditInstalled(manifest, lock, readInstalledPackages(nodeModules)),
];
if (problems.length > 0) {
	for (const problem of problems) console.error(`dependencies: ${problem}`);
	console.error(
		`dependencies: ${nodeModules} does not match package.json and bun.lock; run bun install --frozen-lockfile`,
	);
	process.exit(1);
}
console.info(
	`Dependencies match package.json, bun.lock and bun ${Bun.version} / node ${process.versions.node}`,
);
