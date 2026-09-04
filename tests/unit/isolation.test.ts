import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
	assertIsolation,
	assertLocalRequest,
} from "../../packages/quality/isolation";

const config = JSON.parse(readFileSync("wrangler.test.jsonc", "utf8"));
it("accepts only reserved layers and isolated config", () => {
	assertIsolation(config, "l2", 17046);
	assertIsolation(config, "l3", 27046);
	expect(() => assertIsolation(config, "dev", 7046)).toThrow(/layer/);
	expect(() => assertIsolation(config, "l2", 7046)).toThrow(/port/);
});
it("fails closed on each production binding", () => {
	for (const field of [
		"routes",
		"account_id",
		"d1_databases",
		"kv_namespaces",
		"r2_buckets",
		"services",
		"durable_objects",
		"queues",
	]) {
		expect(() =>
			assertIsolation({ ...config, [field]: [] }, "l2", 17046),
		).toThrow(/binding/);
	}
});
it("rejects production names, hosts, assets and missing nested config", () => {
	for (const name of [undefined, "lizheng-dev"])
		expect(() => assertIsolation({ ...config, name }, "l2", 17046)).toThrow(
			/name/,
		);
	for (const vars of [
		undefined,
		{},
		{ ENVIRONMENT: "production" },
		{ ENVIRONMENT: "test", LANDING_HOST: "lizheng.me" },
	])
		expect(() => assertIsolation({ ...config, vars }, "l2", 17046)).toThrow(
			/mapping/,
		);
	for (const assets of [undefined, { directory: "dist" }])
		expect(() => assertIsolation({ ...config, assets }, "l2", 17046)).toThrow(
			/isolated/,
		);
	for (const env of [undefined, {}])
		expect(() => assertIsolation({ ...config, env }, "l3", 27046)).toThrow(
			/name/,
		);
});
it("blocks all test traffic outside the reserved loopback origins", () => {
	for (const url of [
		"https://lizheng.me/",
		"http://lizheng.dev:17046/",
		"http://127.0.0.1:7046/",
		"https://127.0.0.1:17046/",
	])
		expect(() => assertLocalRequest(url)).toThrow(/Blocked/);
	assertLocalRequest("http://127.0.0.1:17046/");
	assertLocalRequest("http://landing.lizheng-test.localhost:27046/en/");
});
