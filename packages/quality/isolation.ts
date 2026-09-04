export function assertIsolation(
	value: unknown,
	layer: string,
	port: number,
): void {
	const config = value as {
		name?: string;
		routes?: unknown;
		account_id?: unknown;
		vars?: Record<string, string>;
		assets?: { directory?: string };
		env?: Record<string, unknown>;
		[key: string]: unknown;
	};
	if (layer !== "l2" && layer !== "l3") throw new Error("Unknown test layer");
	if (port !== (layer === "l2" ? 17046 : 27046))
		throw new Error("Unreserved test port");
	const target = layer === "l3" ? (config.env?.l3 as typeof config) : config;
	for (const item of [config, target]) {
		if (!item?.name?.endsWith("-test"))
			throw new Error("Test Worker must have a -test name");
		for (const forbidden of [
			"routes",
			"account_id",
			"d1_databases",
			"kv_namespaces",
			"r2_buckets",
			"services",
			"durable_objects",
			"queues",
		])
			if (forbidden in item)
				throw new Error(`Forbidden test binding: ${forbidden}`);
		if (
			item.vars?.ENVIRONMENT !== "test" ||
			item.vars.LANDING_HOST !== "landing.lizheng-test.localhost"
		)
			throw new Error("Invalid test host mapping");
	}
	if (target.assets?.directory !== `.test-dist/${layer}`)
		throw new Error("Test assets must be physically isolated");
}
export function assertLocalRequest(url: string): void {
	const target = new URL(url);
	if (
		target.protocol !== "http:" ||
		![
			"127.0.0.1",
			"resume.lizheng-test.localhost",
			"landing.lizheng-test.localhost",
			"www.resume.lizheng-test.localhost",
			"www.landing.lizheng-test.localhost",
		].includes(target.hostname) ||
		!["17046", "27046"].includes(target.port)
	)
		throw new Error(`Blocked non-test request: ${target.origin}`);
}
