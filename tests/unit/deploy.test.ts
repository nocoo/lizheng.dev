import { describe, expect, it, vi } from "vitest";
import { deployValidatedWorker } from "../../packages/quality/deploy";

const config = {
	name: "lizheng-dev",
	routes: [
		{ pattern: "lizheng.dev", zone_name: "lizheng.dev", custom_domain: true },
		{
			pattern: "www.lizheng.dev",
			zone_name: "lizheng.dev",
			custom_domain: true,
		},
		{ pattern: "lizheng.me/*", zone_name: "lizheng.me" },
		"www.lizheng.me/*",
		{
			pattern: "www.lizheng.blog",
			zone_name: "lizheng.blog",
			custom_domain: true,
		},
	],
};
const credentials = { accountId: "test-account", apiToken: "test-token" };
const endpoint =
	"https://api.cloudflare.com/client/v4/accounts/test-account/workers/domains";

function fixtures() {
	const events: string[] = [];
	const execute = vi.fn(async (command: string[]) => {
		events.push("deploy");
		expect(command).toEqual([
			"bunx",
			"wrangler",
			"deploy",
			".release-worker/index.js",
			"--no-bundle",
			"--routes",
			"lizheng.me/*",
			"www.lizheng.me/*",
		]);
		return 0;
	});
	const request = vi.fn(async (url: string, init: RequestInit) => {
		expect(init.headers).toEqual({
			Authorization: "Bearer test-token",
			"Content-Type": "application/json",
		});
		expect(init.signal).toBeInstanceOf(AbortSignal);
		if (init.method === "PUT") {
			expect(url).toBe(endpoint);
			const body = JSON.parse(String(init.body));
			events.push(`attach:${body.hostname}`);
			return Response.json({ success: true, result: body });
		}
		const parsed = new URL(url);
		expect(`${parsed.origin}${parsed.pathname}`).toBe(endpoint);
		const hostname = parsed.searchParams.get("hostname");
		events.push(`inspect:${hostname}`);
		return Response.json({
			success: true,
			result:
				hostname === "www.lizheng.blog"
					? []
					: [{ hostname, service: "lizheng-dev" }],
		});
	});
	return { events, execute, request };
}

describe("validated Worker deployment with scoped credentials", () => {
	it("uses account domain APIs without reading blog zone routes or rebinding existing domains", async () => {
		const { events, execute, request } = fixtures();
		await deployValidatedWorker(config, credentials, execute, request);
		expect(events).toEqual([
			"inspect:lizheng.dev",
			"inspect:www.lizheng.dev",
			"inspect:www.lizheng.blog",
			"deploy",
			"attach:www.lizheng.blog",
		]);
		expect(JSON.parse(String(request.mock.calls.at(-1)?.[1].body))).toEqual({
			hostname: "www.lizheng.blog",
			service: "lizheng-dev",
			zone_name: "lizheng.blog",
		});
	});

	it("supports configured zone IDs when adding a domain", async () => {
		const { execute, request } = fixtures();
		await deployValidatedWorker(
			{
				...config,
				routes: [
					...config.routes.slice(0, 4),
					{
						pattern: "www.lizheng.blog",
						zone_id: "blog-zone",
						custom_domain: true,
					},
				],
			},
			credentials,
			execute,
			request,
		);
		expect(JSON.parse(String(request.mock.calls.at(-1)?.[1].body))).toEqual({
			hostname: "www.lizheng.blog",
			service: "lizheng-dev",
			zone_id: "blog-zone",
		});
	});

	it.each([
		{ ...credentials, apiToken: undefined },
		{ ...credentials, accountId: undefined },
	])("rejects missing credentials before making changes", async (missing) => {
		const { execute, request } = fixtures();
		await expect(
			deployValidatedWorker(config, missing, execute, request),
		).rejects.toThrow("credentials");
		expect(execute).not.toHaveBeenCalled();
		expect(request).not.toHaveBeenCalled();
	});

	it.each([
		{ ...config, name: undefined },
		{ ...config, routes: undefined },
		{ ...config, routes: config.routes.slice(0, 1) },
	])(
		"rejects an incomplete deployment target before making changes",
		async (invalid) => {
			const { execute, request } = fixtures();
			await expect(
				deployValidatedWorker(invalid, credentials, execute, request),
			).rejects.toThrow("configuration");
			expect(execute).not.toHaveBeenCalled();
			expect(request).not.toHaveBeenCalled();
		},
	);

	it.each([
		{ hostname: "lizheng.dev", service: "another-worker" },
		{ hostname: "unrelated.example", service: "lizheng-dev" },
	])("leaves conflicting domain assignments untouched", async (domain) => {
		const { execute, request } = fixtures();
		request.mockResolvedValueOnce(
			Response.json({ success: true, result: [domain] }),
		);
		await expect(
			deployValidatedWorker(config, credentials, execute, request),
		).rejects.toThrow("domain assignment");
		expect(execute).not.toHaveBeenCalled();
		expect(request).toHaveBeenCalledTimes(1);
	});

	it.each([
		new Response("test-token must never reach logs", { status: 403 }),
		Response.json({ success: false, errors: [{ message: "test-token" }] }),
		Response.json({ success: true, result: null }),
		new Response("invalid JSON including test-token"),
	])(
		"fails closed on domain API errors without echoing credentials",
		async (response) => {
			const { execute, request } = fixtures();
			request.mockResolvedValueOnce(response);
			const error = await deployValidatedWorker(
				config,
				credentials,
				execute,
				request,
			).catch((reason: Error) => reason);
			expect(error).toBeInstanceOf(Error);
			expect(String(error)).toContain("Cloudflare custom domains");
			expect(String(error)).not.toContain("test-token");
			expect(execute).not.toHaveBeenCalled();
		},
	);

	it("does not attach new domains when Worker deployment fails", async () => {
		const { execute, request } = fixtures();
		execute.mockResolvedValueOnce(1);
		await expect(
			deployValidatedWorker(config, credentials, execute, request),
		).rejects.toThrow("Worker deployment failed");
		expect(request.mock.calls.every(([, init]) => init.method === "GET")).toBe(
			true,
		);
	});

	it("rejects an incorrect attachment response", async () => {
		const { execute, request } = fixtures();
		request
			.mockResolvedValueOnce(Response.json({ success: true, result: [] }))
			.mockResolvedValueOnce(Response.json({ success: true, result: [] }))
			.mockResolvedValueOnce(Response.json({ success: true, result: [] }))
			.mockResolvedValueOnce(
				Response.json({
					success: true,
					result: { hostname: "lizheng.dev", service: "other" },
				}),
			);
		await expect(
			deployValidatedWorker(config, credentials, execute, request),
		).rejects.toThrow("domain assignment");
		expect(execute).toHaveBeenCalledTimes(1);
		expect(request).toHaveBeenCalledTimes(4);
	});
});
