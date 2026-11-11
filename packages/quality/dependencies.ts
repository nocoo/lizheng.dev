import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

export interface Manifest {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	overrides?: Record<string, string | Record<string, string>>;
	engines?: Record<string, string>;
	packageManager?: string;
}

interface LockedEntry {
	dependencies: Record<string, string>;
	name: string;
	version: string;
}

export interface Lockfile {
	byNameVersion: Map<string, LockedEntry>;
	entries: Map<string, LockedEntry>;
	nameVersions: Map<string, Set<string>>;
	overrides: Record<string, string | Record<string, string>>;
	workspace: Manifest;
}

export interface InstalledPackage {
	/** Lockfile key: the install path below the root with `node_modules` removed. */
	key: string;
	name: string;
	path: string;
	version: string;
}

export function stripTrailingCommas(text: string): string {
	let output = "";
	let inString = false;
	for (let index = 0; index < text.length; index += 1) {
		const character = text[index] as string;
		if (inString) {
			output += character;
			if (character === "\\") {
				output += text[index + 1] ?? "";
				index += 1;
			} else if (character === '"') inString = false;
			continue;
		}
		if (character === '"') {
			inString = true;
			output += character;
			continue;
		}
		if (character === ",") {
			let next = index + 1;
			while (next < text.length && /\s/.test(text[next] as string)) next += 1;
			if (text[next] === "}" || text[next] === "]") continue;
		}
		output += character;
	}
	return output;
}

export function parseLockfile(text: string): Lockfile {
	const parsed = JSON.parse(stripTrailingCommas(text)) as {
		workspaces?: Record<string, Manifest>;
		packages?: Record<string, [string, string, Record<string, unknown>?]>;
		overrides?: Record<string, string | Record<string, string>>;
	};
	const workspace = parsed.workspaces?.[""];
	if (!workspace) throw new Error("bun.lock has no root workspace entry");
	const entries = new Map<string, LockedEntry>();
	const byNameVersion = new Map<string, LockedEntry>();
	const nameVersions = new Map<string, Set<string>>();
	for (const [key, entry] of Object.entries(parsed.packages ?? {})) {
		const resolved = entry[0];
		const at = resolved.lastIndexOf("@");
		const name = resolved.slice(0, at);
		const version = resolved.slice(at + 1);
		if (key !== name && !key.endsWith(`/${name}`))
			throw new Error(
				`bun.lock entry ${key} resolves ${resolved}; the lockfile is inconsistent`,
			);
		const metadata = entry[2] ?? {};
		const dependencies = (metadata.dependencies ?? {}) as Record<
			string,
			string
		>;
		const locked = { dependencies, name, version };
		entries.set(key, locked);
		if (!byNameVersion.has(`${name}@${version}`))
			byNameVersion.set(`${name}@${version}`, locked);
		const versions = nameVersions.get(name) ?? new Set<string>();
		versions.add(version);
		nameVersions.set(name, versions);
	}
	return {
		byNameVersion,
		entries,
		nameVersions,
		overrides: parsed.overrides ?? {},
		workspace,
	};
}

export function readInstalledPackages(nodeModules: string): InstalledPackage[] {
	if (!existsSync(nodeModules))
		throw new Error(`${nodeModules} is missing; install dependencies first`);
	const installed: InstalledPackage[] = [];
	const visit = (directory: string) => {
		for (const entry of readdirSync(directory)) {
			if (entry.startsWith(".")) continue;
			const path = join(directory, entry);
			if (!statSync(path).isDirectory()) continue;
			if (entry.startsWith("@")) {
				for (const scoped of readdirSync(path)) {
					const scopedPath = join(path, scoped);
					if (statSync(scopedPath).isDirectory())
						collect(scopedPath, installed, visit, nodeModules);
				}
				continue;
			}
			collect(path, installed, visit, nodeModules);
		}
	};
	visit(nodeModules);
	return installed;
}

function collect(
	path: string,
	installed: InstalledPackage[],
	visit: (directory: string) => void,
	nodeModules: string,
): void {
	const manifestPath = join(path, "package.json");
	if (existsSync(manifestPath)) {
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
			name?: string;
			version?: string;
		};
		if (manifest.name && manifest.version)
			installed.push({
				key: path
					.slice(nodeModules.length + 1)
					.replaceAll("/node_modules/", "/"),
				name: manifest.name,
				path,
				version: manifest.version,
			});
	}
	const nested = join(path, "node_modules");
	if (existsSync(nested)) visit(nested);
}

function overridesOf(
	overrides: Record<string, string | Record<string, string>>,
): Map<string, string> {
	const flattened = new Map<string, string>();
	for (const [key, value] of Object.entries(overrides)) {
		if (typeof value === "string") {
			flattened.set(key, value);
			continue;
		}
		for (const [nested, version] of Object.entries(value))
			flattened.set(`${key}>${nested}`, version);
	}
	return flattened;
}

export function auditManifest(manifest: Manifest, lock: Lockfile): string[] {
	const problems: string[] = [];
	for (const field of ["dependencies", "devDependencies"] as const) {
		const declared = manifest[field] ?? {};
		const locked = lock.workspace[field] ?? {};
		for (const [name, spec] of Object.entries(declared))
			if (locked[name] !== spec)
				problems.push(
					`package.json ${field}.${name} is ${spec} but bun.lock records ${locked[name] ?? "nothing"}`,
				);
		for (const name of Object.keys(locked))
			if (!(name in declared))
				problems.push(
					`bun.lock ${field}.${name} is not declared in package.json`,
				);
	}
	const declaredOverrides = overridesOf(manifest.overrides ?? {});
	const lockedOverrides = overridesOf(lock.overrides);
	for (const [scope, version] of declaredOverrides)
		if (lockedOverrides.get(scope) !== version)
			problems.push(
				`package.json override ${scope} is ${version} but bun.lock records ${lockedOverrides.get(scope) ?? "nothing"}`,
			);
	for (const scope of lockedOverrides.keys())
		if (!declaredOverrides.has(scope))
			problems.push(
				`bun.lock override ${scope} is not declared in package.json`,
			);
	return problems;
}

export function auditInstalled(
	manifest: Manifest,
	lock: Lockfile,
	installed: InstalledPackage[],
): string[] {
	const problems: string[] = [];
	const present = new Set(
		installed.map((entry) => `${entry.name}@${entry.version}`),
	);
	for (const entry of installed) {
		const locked = lock.nameVersions.get(entry.name);
		if (!locked)
			problems.push(
				`${entry.name}@${entry.version} is installed but not locked`,
			);
		else if (!locked.has(entry.version))
			problems.push(
				`${entry.name}@${entry.version} is installed but bun.lock records ${[...locked].join(", ")}`,
			);
	}
	const byPath = new Map(installed.map((entry) => [entry.path, entry]));
	const byKey = new Map(installed.map((entry) => [entry.key, entry]));
	for (const field of ["dependencies", "devDependencies"] as const)
		for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
			const resolved = byKey.get(name);
			if (!resolved || resolved.version !== spec)
				problems.push(
					`${field}.${name}@${spec} is declared but the root copy is ${resolved ? `${resolved.name}@${resolved.version}` : "missing"}`,
				);
		}
	for (const [scope, version] of overridesOf(manifest.overrides ?? {}))
		if (!present.has(`${scope.split(">").pop()}@${version}`))
			problems.push(
				`override ${scope}@${version} is not installed at that version`,
			);
	for (const entry of installed) {
		const key = `${entry.name}@${entry.version}`;
		const located = lock.entries.get(entry.key);
		if (
			!located ||
			located.name !== entry.name ||
			located.version !== entry.version
		)
			problems.push(
				`${key} is installed at ${entry.key} but bun.lock records ${located ? `${located.name}@${located.version}` : "nothing there"}`,
			);
		for (const dependency of Object.keys(located?.dependencies ?? {})) {
			const expected = edgeVersion(lock, entry.key, dependency);
			if (expected === undefined) {
				problems.push(
					`${key} depends on ${dependency}, which bun.lock does not record`,
				);
				continue;
			}
			const resolved = resolveDependency(entry.path, dependency, byPath);
			if (!resolved) {
				problems.push(
					`${key} depends on ${dependency}@${expected}, which is not installed`,
				);
				continue;
			}
			if (resolved.version !== expected)
				problems.push(
					`${key} resolves ${dependency}@${resolved.version} but bun.lock records ${expected}`,
				);
		}
	}
	return problems;
}

const STABLE_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(version: string): number[] {
	const match = STABLE_VERSION.exec(version);
	if (!match)
		throw new Error(
			`cannot verify the non-stable or malformed version '${version}'`,
		);
	return [match[1], match[2], match[3]].map((part) =>
		Number.parseInt(part as string, 10),
	);
}

function edgeVersion(
	lock: Lockfile,
	parentKey: string,
	dependency: string,
): string | undefined {
	const nested = lock.entries.get(`${parentKey}/${dependency}`);
	if (nested) return nested.version;
	return lock.entries.get(dependency)?.version;
}

function resolveDependency(
	from: string,
	name: string,
	byPath: Map<string, InstalledPackage>,
): InstalledPackage | undefined {
	let directory = from;
	for (;;) {
		const candidate = byPath.get(join(directory, "node_modules", name));
		if (candidate) return candidate;
		const parent = dirname(directory);
		if (parent === directory) return undefined;
		directory = parent;
	}
}

const RANGE = /^(>=|>|<=|<)?(\d+)\.(\d+)\.(\d+)$/;

function compare(left: number[], right: number[]): number {
	for (let index = 0; index < 3; index += 1) {
		const a = left[index] ?? 0;
		const b = right[index] ?? 0;
		if (a !== b) return a < b ? -1 : 1;
	}
	return 0;
}

export function satisfies(version: string, range: string): boolean {
	const actual = parseVersion(version);
	const trimmed = range.trim();
	if (trimmed === "*") return true;
	const match = RANGE.exec(trimmed);
	if (!match) throw new Error(`cannot verify version range '${range}'`);
	const operator = match[1] ?? "";
	const bound = [match[2], match[3], match[4]].map((part) =>
		Number.parseInt(part as string, 10),
	);
	const order = compare(actual, bound);
	if (operator === ">=") return order >= 0;
	if (operator === ">") return order > 0;
	if (operator === "<=") return order <= 0;
	if (operator === "<") return order < 0;
	return order === 0;
}

export function auditToolchain(
	manifest: Manifest,
	actual: { bun: string; node: string },
): string[] {
	const problems: string[] = [];
	const check = (value: string, range: string, label: string) => {
		try {
			if (!satisfies(value, range)) problems.push(label);
		} catch (error) {
			problems.push(error instanceof Error ? error.message : String(error));
		}
	};
	for (const field of ["bun", "node"] as const) {
		const range = manifest.engines?.[field];
		if (!range) {
			problems.push(`package.json engines.${field} is missing`);
			continue;
		}
		check(
			actual[field],
			range,
			`${field} ${actual[field]} does not satisfy engines.${field} '${range}'`,
		);
	}
	const declared = manifest.packageManager;
	const pin = declared?.startsWith("bun@") ? declared.slice("bun@".length) : "";
	if (!STABLE_VERSION.test(pin)) {
		problems.push(
			`package.json packageManager '${declared ?? "missing"}' is not a pinned bun version`,
		);
		return problems;
	}
	try {
		const pinned = parseVersion(pin);
		const running = parseVersion(actual.bun);
		const sameLine =
			(running[0] ?? 0) === (pinned[0] ?? 0) &&
			(running[1] ?? 0) === (pinned[1] ?? 0);
		if (!sameLine || compare(running, pinned) < 0)
			problems.push(
				`bun ${actual.bun} is not on the pinned line bun@${pin} (same major.minor, not older)`,
			);
	} catch (error) {
		problems.push(error instanceof Error ? error.message : String(error));
	}
	return problems;
}
