import { describe, expect, test } from "bun:test";
import {
	findMatchingClose,
	getValue,
	processEach,
	processIf,
	processVariables,
} from "../build.js";

describe("getValue", () => {
	test("simple key", () => {
		expect(getValue({ name: "Li" }, "name")).toBe("Li");
	});

	test("nested path", () => {
		expect(getValue({ a: { b: { c: 42 } } }, "a.b.c")).toBe(42);
	});

	test("missing path returns undefined", () => {
		expect(getValue({ a: 1 }, "b.c")).toBeUndefined();
	});

	test("empty object", () => {
		expect(getValue({}, "a")).toBeUndefined();
	});
});

describe("findMatchingClose", () => {
	test("simple match", () => {
		const str = "{{#each items}}hello{{/each}}";
		const pos = findMatchingClose(str, "{{#each ", "{{/each}}", 15);
		expect(pos).toBe(20);
	});

	test("nested tags", () => {
		const str = "{{#each a}}{{#each b}}inner{{/each}}{{/each}}";
		const pos = findMatchingClose(str, "{{#each ", "{{/each}}", 11);
		expect(pos).toBe(36);
	});

	test("no closing tag returns -1", () => {
		expect(
			findMatchingClose("{{#each a}}hello", "{{#each ", "{{/each}}", 11),
		).toBe(-1);
	});
});

describe("processEach", () => {
	test("array of strings", () => {
		const template = "{{#each items}}{{this}} {{/each}}";
		const result = processEach(template, { items: ["a", "b", "c"] });
		expect(result).toBe("a b c ");
	});

	test("array of objects", () => {
		const template = "{{#each people}}{{name}},{{/each}}";
		const result = processEach(template, {
			people: [{ name: "Alice" }, { name: "Bob" }],
		});
		expect(result).toBe("Alice,Bob,");
	});

	test("empty array", () => {
		const template = "{{#each items}}{{this}}{{/each}}";
		expect(processEach(template, { items: [] })).toBe("");
	});

	test("missing array", () => {
		const template = "{{#each items}}{{this}}{{/each}}";
		expect(processEach(template, {})).toBe("");
	});
});

describe("processIf", () => {
	test("truthy value shows content", () => {
		const template = "{{#if show}}visible{{/if}}";
		expect(processIf(template, { show: true })).toBe("visible");
	});

	test("falsy value hides content", () => {
		const template = "{{#if show}}visible{{/if}}";
		expect(processIf(template, { show: false })).toBe("");
	});

	test("undefined value hides content", () => {
		const template = "{{#if show}}visible{{/if}}";
		expect(processIf(template, {})).toBe("");
	});

	test("truthy string shows content", () => {
		const template = "{{#if name}}Hello{{/if}}";
		expect(processIf(template, { name: "Li" })).toBe("Hello");
	});
});

describe("processVariables", () => {
	test("simple variable", () => {
		expect(processVariables("Hello {{name}}", { name: "World" })).toBe(
			"Hello World",
		);
	});

	test("nested variable", () => {
		expect(processVariables("{{a.b}}", { a: { b: "val" } })).toBe("val");
	});

	test("triple braces (unescaped)", () => {
		expect(processVariables("{{{html}}}", { html: "<b>bold</b>" })).toBe(
			"<b>bold</b>",
		);
	});

	test("missing variable unchanged", () => {
		expect(processVariables("{{missing}}", {})).toBe("{{missing}}");
	});

	test("multiple variables", () => {
		expect(processVariables("{{a}} and {{b}}", { a: "1", b: "2" })).toBe(
			"1 and 2",
		);
	});
});
