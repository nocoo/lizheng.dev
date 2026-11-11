import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface Manifest {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	overrides?: Record<string, string | Record<string, string>>;
	engines?: Record<string, string>;
	packageManager?: string;
}

export interface Lockfile {
	overrides: Record<string, string | Record<string, string>>;
	packages: Map<string, Set<string>>;
	workspace: Manifest;
}

export interface InstalledPackage {
	name: string;
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
		packages?: Record<string, [string, ...unknown[]]>;
		overrides?: Record<string, string | Record<string, string>>;
	};
	const workspace = parsed.workspaces?.[""];
	if (!workspace) throw new Error("bun.lock has no root workspace entry");
	const packages = new Map<string, Set<string>>();
	for (const [key, entry] of Object.entries(parsed.packages ?? {})) {
		const resolved = entry[0];
		const at = resolved.lastIndexOf("@");
		const lockedName = resolved.slice(0, at);
		if (key !== lockedName && !key.endsWith(`/${lockedName}`))
			throw new Error(
				`bun.lock entry ${key} resolves ${resolved}; the lockfile is inconsistent`,
			);
		const versions = packages.get(lockedName) ?? new Set<string>();
		versions.add(resolved.slice(at + 1));
		packages.set(lockedName, versions);
	}
	return { overrides: parsed.overrides ?? {}, packages, workspace };
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
						collect(scopedPath, installed, visit);
				}
				continue;
			}
			collect(path, installed, visit);
		}
	};
	visit(nodeModules);
	return installed;
}

function collect(
	path: string,
	installed: InstalledPackage[],
	visit: (directory: string) => void,
): void {
	const manifestPath = join(path, "package.json");
	if (existsSync(manifestPath)) {
		const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
			name?: string;
			version?: string;
		};
		if (manifest.name && manifest.version)
			installed.push({ name: manifest.name, version: manifest.version });
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
			flattened.set(key.split(">").pop() ?? key, value);
			continue;
		}
		for (const [nested, version] of Object.entries(value))
			flattened.set(nested, version);
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
	if (!sameOverrides(manifest.overrides ?? {}, lock.overrides))
		problems.push("package.json overrides do not match bun.lock");
	return problems;
}

function sameOverrides(
	left: Record<string, string | Record<string, string>>,
	right: Record<string, string | Record<string, string>>,
): boolean {
	const normalize = (
		value: Record<string, string | Record<string, string>>,
	) => {
		const flattened = overridesOf(value);
		return [...flattened.entries()]
			.map(([name, version]) => `${name}@${version}`)
			.sort()
			.join(",");
	};
	return normalize(left) === normalize(right);
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
		const locked = lock.packages.get(entry.name);
		if (!locked)
			problems.push(
				`${entry.name}@${entry.version} is installed but not locked`,
			);
		else if (!locked.has(entry.version))
			problems.push(
				`${entry.name}@${entry.version} is installed but bun.lock records ${[...locked].join(", ")}`,
			);
	}
	for (const field of ["dependencies", "devDependencies"] as const)
		for (const [name, spec] of Object.entries(manifest[field] ?? {}))
			if (!present.has(`${name}@${spec}`))
				problems.push(
					`${field}.${name}@${spec} is declared but the installed copy differs`,
				);
	for (const [name, version] of overridesOf(manifest.overrides ?? {}))
		if (!present.has(`${name}@${version}`))
			problems.push(
				`override ${name}@${version} is not installed at that version`,
			);
	return problems;
}

export function parseVersion(version: string): number[] {
	const core = version.split("-")[0]?.split("+")[0] ?? version;
	return core.split(".").map((part) => {
		const parsed = Number.parseInt(part, 10);
		if (Number.isNaN(parsed))
			throw new Error(`cannot parse version '${version}'`);
		return parsed;
	});
}

export function satisfies(version: string, range: string): boolean {
	const target = parseVersion(version);
	const compare = (candidate: number[]) => {
		for (let index = 0; index < 3; index += 1) {
			const left = target[index] ?? 0;
			const right = candidate[index] ?? 0;
			if (left !== right) return left < right ? -1 : 1;
		}
		return 0;
	};
	const at = (candidate: string) => compare(parseVersion(candidate));
	const trimmed = range.trim();
	if (trimmed === "" || trimmed === "*" || trimmed === "x") return true;
	if (trimmed.startsWith(">=")) return at(trimmed.slice(2)) >= 0;
	if (trimmed.startsWith(">")) return at(trimmed.slice(1)) > 0;
	if (trimmed.startsWith("<=")) return at(trimmed.slice(2)) <= 0;
	if (trimmed.startsWith("<")) return at(trimmed.slice(1)) < 0;
	if (/^[0-9]/.test(trimmed)) return at(trimmed) === 0;
	throw new Error(`cannot verify version range '${range}'`);
}

export function auditToolchain(
	manifest: Manifest,
	actual: { bun: string; node: string },
): string[] {
	const problems: string[] = [];
	for (const field of ["bun", "node"] as const) {
		const range = manifest.engines?.[field];
		if (!range) {
			problems.push(`package.json engines.${field} is missing`);
			continue;
		}
		if (!satisfies(actual[field], range))
			problems.push(
				`${field} ${actual[field]} does not satisfy engines.${field} '${range}'`,
			);
	}
	const declared = manifest.packageManager;
	if (!declared) {
		problems.push("package.json packageManager is missing");
		return problems;
	}
	const [manager, version] = declared.split("@") as [
		string,
		string | undefined,
	];
	if (manager !== "bun" || !version) {
		problems.push(
			`package.json packageManager '${declared}' is not a pinned bun version`,
		);
		return problems;
	}
	if (!satisfies(actual.bun, `>=${version}`))
		problems.push(
			`bun ${actual.bun} is older than the pinned packageManager bun@${version}`,
		);
	return problems;
}
