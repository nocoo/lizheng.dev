import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import {
	auditInstalled,
	auditManifest,
	auditToolchain,
	type Lockfile,
	type Manifest,
	parseLockfile,
	parseVersion,
	readInstalledPackages,
	satisfies,
	stripTrailingCommas,
} from "../../packages/quality/dependencies";

const manifest = JSON.parse(readFileSync("package.json", "utf8")) as Manifest;
const lockText = readFileSync("bun.lock", "utf8");

it("strips trailing commas without touching strings", () => {
	const source = '{"a": [1, 2,], "b": {"c": "x,}",}, "d": "\\",]",}';
	expect(JSON.parse(stripTrailingCommas(source))).toEqual({
		a: [1, 2],
		b: { c: "x,}" },
		d: '",]',
	});
});

it("parses the real lockfile including nested duplicate versions", () => {
	const lock = parseLockfile(lockText);
	expect(lock.workspace.dependencies?.react).toBe("19.3.1");
	expect(lock.packages.get("react")).toEqual(new Set(["19.3.1"]));
	expect(lock.packages.get("undici")).toEqual(new Set(["8.12.3", "7.30.1"]));
	expect(lock.overrides.miniflare).toEqual({
		sharp: "0.35.5",
		undici: "7.30.1",
	});
});

it("rejects malformed lockfiles", () => {
	expect(() => parseLockfile('{"packages": {}}')).toThrow(
		/no root workspace entry/,
	);
	expect(() =>
		parseLockfile(
			JSON.stringify({
				workspaces: { "": {} },
				packages: { react: ["preact@19.3.1"] },
			}),
		),
	).toThrow(/lockfile is inconsistent/);
});

it("reads installed packages across scopes and nested trees", () => {
	const root = mkdtempSync(join(tmpdir(), "lizheng-deps-"));
	try {
		const write = (path: string, name: string, version: string) => {
			mkdirSync(join(root, path), { recursive: true });
			writeFileSync(
				join(root, path, "package.json"),
				JSON.stringify({ name, version }),
			);
		};
		write("node_modules/react", "react", "19.3.1");
		write("node_modules/@scope/pkg", "@scope/pkg", "1.0.0");
		write("node_modules/parent/node_modules/child", "child", "2.0.0");
		mkdirSync(join(root, "node_modules/.bin"), { recursive: true });
		writeFileSync(join(root, "node_modules/.bin/react"), "");
		writeFileSync(join(root, "node_modules/@scope/LICENSE"), "");
		mkdirSync(join(root, "node_modules/empty"), { recursive: true });
		expect(readInstalledPackages(join(root, "node_modules"))).toEqual(
			expect.arrayContaining([
				{ name: "react", version: "19.3.1" },
				{ name: "@scope/pkg", version: "1.0.0" },
				{ name: "child", version: "2.0.0" },
			]),
		);
		expect(() => readInstalledPackages(join(root, "missing"))).toThrow(
			/is missing; install dependencies first/,
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

it("accepts an installed tree that matches the manifest and lock", () => {
	const lock = parseLockfile(lockText);
	expect(auditManifest(manifest, lock)).toEqual([]);
	expect(
		auditInstalled(manifest, lock, readInstalledPackages("node_modules")),
	).toEqual([]);
});

it("reports manifest and lock drift", () => {
	const lock = parseLockfile(lockText);
	const problems = auditManifest(
		{
			dependencies: {
				...manifest.dependencies,
				react: "19.0.0",
				extra: "1.0.0",
			},
			devDependencies: manifest.devDependencies,
			overrides: { ...manifest.overrides, "playwright-core": "1.0.0" },
		},
		lock,
	);
	expect(problems).toContain(
		"package.json dependencies.react is 19.0.0 but bun.lock records 19.3.1",
	);
	expect(problems).toContain(
		"package.json dependencies.extra is 1.0.0 but bun.lock records nothing",
	);
	expect(problems).toContain("package.json overrides do not match bun.lock");
	expect(
		auditManifest(
			{ dependencies: {}, devDependencies: {} },
			{ ...lock, overrides: {} },
		),
	).toContain("bun.lock dependencies.react is not declared in package.json");
});

it("reports installed drift, missing declarations and overrides", () => {
	const lock: Lockfile = {
		overrides: { "parent>child": "2.0.0", other: { child: "3.0.0" } },
		packages: new Map([["child", new Set(["2.0.0"])]]),
		workspace: {},
	};
	const problems = auditInstalled(
		{
			dependencies: { child: "2.0.0", missing: "1.0.0" },
			overrides: { "parent>child": "2.0.0", other: { child: "3.0.0" } },
		},
		lock,
		[
			{ name: "child", version: "2.0.0" },
			{ name: "child", version: "1.0.0" },
			{ name: "stray", version: "1.0.0" },
		],
	);
	expect(problems).toContain("stray@1.0.0 is installed but not locked");
	expect(problems).toContain(
		"child@1.0.0 is installed but bun.lock records 2.0.0",
	);
	expect(problems).toContain(
		"dependencies.missing@1.0.0 is declared but the installed copy differs",
	);
	expect(problems).toContain(
		"override child@3.0.0 is not installed at that version",
	);
});

it("compares versions against the ranges the manifest declares", () => {
	expect(parseVersion("26.12.1")).toEqual([26, 12, 1]);
	expect(parseVersion("5.20261006.1-alpha")).toEqual([5, 20261006, 1]);
	expect(() => parseVersion("7.x")).toThrow(/cannot parse version '7\.x'/);
	expect(satisfies("26.13.0", ">=26.0.0")).toBe(true);
	expect(satisfies("26.13.0", "*")).toBe(true);
	expect(satisfies("26.13.0", "")).toBe(true);
	expect(satisfies("26.13.0", "26.13.0")).toBe(true);
	expect(satisfies("26.13", ">=26.0")).toBe(true);
	expect(satisfies("26", ">26.0.0")).toBe(false);
	expect(satisfies("26.13.0", ">26.13.0")).toBe(false);
	expect(satisfies("26.13.0", ">=26.13.1")).toBe(false);
	expect(satisfies("26.13.0", "<=26.13.0")).toBe(true);
	expect(satisfies("26.13.0", "<26.13.0")).toBe(false);
	expect(() => satisfies("26.13.0", "^26.0.0")).toThrow(
		/cannot verify version range/,
	);
	expect(() => satisfies("26.13.0", "26.x")).toThrow(/cannot parse version/);
});

it("accepts the declared toolchain minimum and rejects mismatches", () => {
	const actual = { bun: "1.4.0", node: "26.0.0" };
	expect(auditToolchain(manifest, actual)).toEqual([]);
	expect(
		auditToolchain(
			{ ...manifest, engines: undefined, packageManager: undefined },
			actual,
		),
	).toEqual([
		"package.json engines.bun is missing",
		"package.json engines.node is missing",
		"package.json packageManager is missing",
	]);
	expect(
		auditToolchain(
			{ ...manifest, engines: { bun: ">=99.0.0", node: ">=26.0.0" } },
			actual,
		),
	).toContain("bun 1.4.0 does not satisfy engines.bun '>=99.0.0'");
	expect(
		auditToolchain({ ...manifest, packageManager: "npm@11.0.0" }, actual),
	).toContain(
		"package.json packageManager 'npm@11.0.0' is not a pinned bun version",
	);
	expect(
		auditToolchain({ ...manifest, packageManager: "bun" }, actual),
	).toContain("package.json packageManager 'bun' is not a pinned bun version");
	expect(
		auditToolchain({ ...manifest, packageManager: "bun@99.0.0" }, actual),
	).toContain("bun 1.4.0 is older than the pinned packageManager bun@99.0.0");
});
