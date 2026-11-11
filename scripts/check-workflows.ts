import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const directory = ".github/workflows";
const files = readdirSync(directory)
	.filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
	.sort()
	.map((name) => join(directory, name));
if (files.length === 0) throw new Error(`no workflow files in ${directory}`);

execFileSync("actionlint", files, { stdio: "inherit" });

const sharedReference = /^nocoo\/base-ci\/[^@]+@[a-f0-9]{40}$/;
const problems: string[] = [];
const collect = (value: unknown, file: string) => {
	if (Array.isArray(value)) {
		for (const item of value) collect(item, file);
		return;
	}
	if (typeof value !== "object" || value === null) return;
	for (const [key, nested] of Object.entries(value)) {
		if (key === "uses" && typeof nested === "string")
			if (nested.startsWith("nocoo/base-ci/") && !sharedReference.test(nested))
				problems.push(`${file}: ${nested} is not pinned to a full commit sha`);
		collect(nested, file);
	}
};
for (const file of files) collect(parse(readFileSync(file, "utf8")), file);
if (problems.length > 0) {
	for (const problem of problems) console.error(problem);
	process.exit(1);
}
console.info(
	`Workflows lint clean: ${files.length} files, shared references pinned to commit shas`,
);
