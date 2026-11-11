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
	type InstalledPackage,
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
const root = "/tree";

type Entry = {
	dependencies: Record<string, string>;
	name: string;
	version: string;
};

const lockFrom = (entries: Map<string, Entry>, overrides = {}): Lockfile => ({
	byNameVersion: new Map(
		[...entries.values()].map((value) => [
			`${value.name}@${value.version}`,
			value,
		]),
	),
	entries,
	nameVersions: new Map(
		[...entries.values()].reduce((all, value) => {
			const versions = all.get(value.name) ?? new Set<string>();
			versions.add(value.version);
			all.set(value.name, versions);
			return all;
		}, new Map<string, Set<string>>()),
	),
	overrides,
	workspace: {},
});
const at = (path: string, name: string, version: string): InstalledPackage => ({
	key: path.replace(/^node_modules\//, "").replaceAll("/node_modules/", "/"),
	name,
	path: join(root, path),
	version,
});

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
	expect(lock.nameVersions.get("react")).toEqual(new Set(["19.3.1"]));
	expect(lock.nameVersions.get("undici")).toEqual(
		new Set(["8.12.3", "7.30.1"]),
	);
	expect(lock.entries.get("miniflare/undici")).toMatchObject({
		name: "undici",
		version: "7.30.1",
	});
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
	const directory = mkdtempSync(join(tmpdir(), "lizheng-deps-"));
	try {
		const write = (path: string, name: string, version: string) => {
			mkdirSync(join(directory, path), { recursive: true });
			writeFileSync(
				join(directory, path, "package.json"),
				JSON.stringify({ name, version }),
			);
		};
		write("node_modules/react", "react", "19.3.1");
		write("node_modules/@scope/pkg", "@scope/pkg", "1.0.0");
		write("node_modules/parent/node_modules/child", "child", "2.0.0");
		mkdirSync(join(directory, "node_modules/.bin"), { recursive: true });
		writeFileSync(join(directory, "node_modules/.bin/react"), "");
		mkdirSync(join(directory, "node_modules/empty"), { recursive: true });
		writeFileSync(join(directory, "node_modules/@scope/LICENSE"), "");
		const installed = readInstalledPackages(join(directory, "node_modules"));
		for (const expected of [
			{ name: "react", version: "19.3.1" },
			{ name: "@scope/pkg", version: "1.0.0" },
			{ name: "child", version: "2.0.0" },
		])
			expect(installed).toContainEqual(expect.objectContaining(expected));
		const nested = installed.find((item) => item.name === "child");
		expect(nested?.key).toBe("parent/child");
		expect(nested?.path).toBe(
			join(directory, "node_modules/parent/node_modules/child"),
		);
		expect(() => readInstalledPackages(join(directory, "missing"))).toThrow(
			/is missing; install dependencies first/,
		);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});

it("accepts the real tree, including nested duplicate resolutions", () => {
	const lock = parseLockfile(lockText);
	expect(auditManifest(manifest, lock)).toEqual([]);
	expect(
		auditInstalled(manifest, lock, readInstalledPackages("node_modules")),
	).toEqual([]);
});

it("rejects an installed tree missing a locked transitive dependency", () => {
	const lock = parseLockfile(lockText);
	const problems = auditInstalled(
		manifest,
		lock,
		readInstalledPackages("node_modules").filter(
			(entry) => entry.name !== "picocolors",
		),
	);
	expect(problems).toContain(
		"postcss@8.5.30 depends on picocolors@1.1.1, which is not installed",
	);
});

it("keeps override parent scopes distinct", () => {
	const lock = parseLockfile(lockText);
	const { overrides, ...rest } = manifest;
	const scoped = Object.fromEntries(
		Object.entries(overrides ?? {}).map(([key, value]) => [
			key === "miniflare>undici" ? "other-parent>undici" : key,
			value,
		]),
	);
	expect(auditManifest({ ...rest, overrides: scoped }, lock)).toContain(
		"package.json override other-parent>undici is 7.30.1 but bun.lock records nothing",
	);
});

it("follows node resolution instead of trusting any matching version", () => {
	const lock = lockFrom(
		new Map<string, Entry>([
			[
				"consumer",
				{
					dependencies: { child: "1.0.0" },
					name: "consumer",
					version: "1.0.0",
				},
			],
			["consumer/child", { dependencies: {}, name: "child", version: "1.0.0" }],
			["child", { dependencies: {}, name: "child", version: "2.0.0" }],
			[
				"a/shared",
				{ dependencies: { leaf: "1.0.0" }, name: "shared", version: "1.0.0" },
			],
			["a/shared/leaf", { dependencies: {}, name: "leaf", version: "1.0.0" }],
			["leaf", { dependencies: {}, name: "leaf", version: "2.0.0" }],
		]),
	);
	const problems = auditInstalled({}, lock, [
		at("node_modules/consumer", "consumer", "1.0.0"),
		at("node_modules/child", "child", "2.0.0"),
		at("node_modules/a/node_modules/shared", "shared", "1.0.0"),
		at("node_modules/leaf", "leaf", "2.0.0"),
	]);
	expect(problems).toContain(
		"consumer@1.0.0 resolves child@2.0.0 but bun.lock records 1.0.0",
	);
	expect(problems).toContain(
		"shared@1.0.0 resolves leaf@2.0.0 but bun.lock records 1.0.0",
	);
});

it("accepts the nested resolution the lockfile records", () => {
	const lock = lockFrom(
		new Map<string, Entry>([
			[
				"consumer",
				{
					dependencies: { child: "1.0.0" },
					name: "consumer",
					version: "1.0.0",
				},
			],
			["consumer/child", { dependencies: {}, name: "child", version: "1.0.0" }],
			["child", { dependencies: {}, name: "child", version: "2.0.0" }],
		]),
	);
	expect(
		auditInstalled({}, lock, [
			at("node_modules/consumer", "consumer", "1.0.0"),
			at("node_modules/consumer/node_modules/child", "child", "1.0.0"),
			at("node_modules/child", "child", "2.0.0"),
		]),
	).toEqual([]);
});

it("keeps nested duplicate resolutions apart", () => {
	const lock = lockFrom(
		new Map<string, Entry>([
			[
				"consumer",
				{ dependencies: { leaf: "1.0.0" }, name: "consumer", version: "1.0.0" },
			],
			["consumer/leaf", { dependencies: {}, name: "leaf", version: "1.0.0" }],
			[
				"outer",
				{
					dependencies: { consumer: "2.0.0" },
					name: "outer",
					version: "1.0.0",
				},
			],
			[
				"outer/consumer",
				{ dependencies: { leaf: "2.0.0" }, name: "consumer", version: "2.0.0" },
			],
			[
				"outer/consumer/leaf",
				{ dependencies: {}, name: "leaf", version: "2.0.0" },
			],
		]),
	);
	const problems = auditInstalled({}, lock, [
		at("node_modules/consumer", "consumer", "1.0.0"),
		at("node_modules/consumer/node_modules/leaf", "leaf", "1.0.0"),
		at("node_modules/outer", "outer", "1.0.0"),
		at("node_modules/outer/node_modules/consumer", "consumer", "2.0.0"),
		at(
			"node_modules/outer/node_modules/consumer/node_modules/leaf",
			"leaf",
			"1.0.0",
		),
	]);
	expect(problems).toContain(
		"consumer@2.0.0 resolves leaf@1.0.0 but bun.lock records 2.0.0",
	);
});

it("requires the root copy of a direct dependency", () => {
	const lock = lockFrom(
		new Map<string, Entry>([
			["foo", { dependencies: {}, name: "foo", version: "1.0.0" }],
		]),
	);
	const problems = auditInstalled({ dependencies: { foo: "1.0.0" } }, lock, [
		at("node_modules/stale/node_modules/foo", "foo", "1.0.0"),
	]);
	expect(problems).toContain(
		"dependencies.foo@1.0.0 is declared but the root copy is missing",
	);
	expect(problems).toContain(
		"foo@1.0.0 is installed at stale/foo but bun.lock records nothing there",
	);
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
	expect(problems).toContain(
		"package.json override playwright-core is 1.0.0 but bun.lock records 1.65.0",
	);
	expect(
		auditManifest(
			{ dependencies: {}, devDependencies: {} },
			{ ...lock, overrides: {} },
		),
	).toContain("bun.lock dependencies.react is not declared in package.json");
});

it("reports installed drift, missing declarations and overrides", () => {
	const lock = lockFrom(
		new Map<string, Entry>([
			[
				"child",
				{ dependencies: { grand: "1.0.0" }, name: "child", version: "2.0.0" },
			],
			["grand", { dependencies: {}, name: "grand", version: "1.0.0" }],
		]),
		{ parent: { child: "2.0.0" }, other: { child: "3.0.0" } },
	);
	const problems = auditInstalled(
		{
			dependencies: { child: "2.0.0", missing: "1.0.0" },
			overrides: { "parent>child": "2.0.0", other: { child: "3.0.0" } },
		},
		lock,
		[
			at("node_modules/child", "child", "2.0.0"),
			at("node_modules/parent/node_modules/child", "child", "1.0.0"),
			at("node_modules/stray", "stray", "1.0.0"),
		],
	);
	expect(problems).toContain("stray@1.0.0 is installed but not locked");
	expect(problems).toContain(
		"child@1.0.0 is installed but bun.lock records 2.0.0",
	);
	expect(problems).toContain(
		"dependencies.missing@1.0.0 is declared but the root copy is missing",
	);
	expect(problems).toContain(
		"override other>child@3.0.0 is not installed at that version",
	);
	expect(problems).toContain(
		"child@2.0.0 depends on grand@1.0.0, which is not installed",
	);
});

it("compares versions against the ranges the manifest declares", () => {
	expect(parseVersion("26.12.1")).toEqual([26, 12, 1]);
	expect(() => parseVersion("7.x")).toThrow(/non-stable or malformed/);
	expect(() => parseVersion("26.0.0-rc.1")).toThrow(/non-stable or malformed/);
	expect(satisfies("26.13.0", ">=26.0.0")).toBe(true);
	expect(satisfies("26.13.0", "*")).toBe(true);
	expect(() => satisfies("26.13.0", "")).toThrow(/cannot verify version range/);
	expect(() => satisfies("26.0.0-rc.1", "*")).toThrow(
		/non-stable or malformed/,
	);
	expect(satisfies("26.13.0", "26.13.0")).toBe(true);
	expect(satisfies("26.13.0", ">26.13.0")).toBe(false);
	expect(satisfies("26.13.0", ">=26.13.1")).toBe(false);
	expect(satisfies("26.13.0", "<=26.13.0")).toBe(true);
	expect(satisfies("26.13.0", "<26.13.0")).toBe(false);
	expect(() => satisfies("26.13.0", "^26.0.0")).toThrow(
		/cannot verify version range/,
	);
	expect(() => satisfies("26.13.0", "26.x")).toThrow(
		/cannot verify version range/,
	);
	expect(() => satisfies("26.13.0", ">=26.0.0 <27.0.0")).toThrow(
		/cannot verify version range/,
	);
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
		"package.json packageManager 'missing' is not a pinned bun version",
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
		auditToolchain({ ...manifest, packageManager: "bun@1.4.0garbage" }, actual),
	).toContain(
		"package.json packageManager 'bun@1.4.0garbage' is not a pinned bun version",
	);
	expect(
		auditToolchain({ ...manifest, packageManager: "bun@99.0.0" }, actual),
	).toContain(
		"bun 1.4.0 is not on the pinned line bun@99.0.0 (same major.minor, not older)",
	);
	expect(
		auditToolchain({ ...manifest, packageManager: "bun@1.5.0" }, actual),
	).toContain(
		"bun 1.4.0 is not on the pinned line bun@1.5.0 (same major.minor, not older)",
	);
	expect(auditToolchain(manifest, { bun: "1.4.4", node: "26.13.0" })).toEqual(
		[],
	);
	expect(
		auditToolchain(manifest, { bun: "1.4.0-canary", node: "26.13.0" }),
	).toContain(
		"cannot verify the non-stable or malformed version '1.4.0-canary'",
	);
});
