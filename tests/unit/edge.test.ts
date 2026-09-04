import { describe, expect, it, vi } from "vitest";
import manifest from "../../package.json" with { type: "json" };

const { version } = manifest;

import worker from "../../worker/index";

function fixture(host = "lizheng.dev") {
	const asset = vi.fn(
		async () =>
			new Response("asset", { headers: { "Content-Type": "text/html" } }),
	);
	const env = { ASSETS: { fetch: asset } } as unknown as Env;
	return {
		asset,
		request: (path: string, init?: RequestInit) =>
			worker.fetch(new Request(`https://${host}${path}`, init), env),
	};
}

describe("versioned dual-surface edge contract", () => {
	for (const [host, surface] of [
		["lizheng.dev", "resume"],
		["www.lizheng.dev", "resume"],
		["lizheng.me", "landing"],
		["www.lizheng.me", "landing"],
	]) {
		it(`${host}: live reports package version without fetching assets`, async () => {
			const { request, asset } = fixture(host);
			const result = await request("/api/live");
			expect(result.status).toBe(200);
			expect(await result.json()).toMatchObject({
				status: "ok",
				version,
				surface,
			});
			expect(result.headers.get("cache-control")).toBe("no-store");
			expect(asset).not.toHaveBeenCalled();
		});
	}
});

const legacyPaths = [
	"/2024/01/some-post",
	"/category/tech",
	"/tag/js",
	"/archive",
	"/search",
	"/feed.xml",
	"/feed",
	"/page/2",
	"/preview/secret",
	"/sitemap.xml",
	"/admin/posts",
	"/login",
];
const boundaries = [
	"/categoryish",
	"/tagline",
	"/2024/1/post",
	"/search/",
	"/feed/",
	"/page",
	"/preview",
	"/login/",
	"/SITEMAP.xml",
];
for (const host of ["lizheng.me", "www.lizheng.me"]) {
	for (const path of legacyPaths)
		it(`${host}${path} preserves 301 and query bytes`, async () => {
			const { request, asset } = fixture(host);
			const suffix = "?q=%E4%BD%A0%20a&x=1&x=2";
			const response = await request(path + suffix);
			expect(response.status).toBe(301);
			expect(response.headers.get("location")).toBe(
				`https://lizheng.blog${path}${suffix}`,
			);
			expect(asset).not.toHaveBeenCalled();
		});
	for (const path of boundaries)
		it(`does not redirect boundary ${host}${path} to blog`, async () => {
			const result = await fixture(host).request(path);
			expect(result.status).not.toBe(301);
		});
}
for (const host of ["lizheng.dev", "www.lizheng.dev"])
	for (const path of legacyPaths)
		it(`no blog redirect on ${host}${path}`, async () => {
			expect((await fixture(host).request(path)).status).not.toBe(301);
		});
for (const host of ["lizheng.dev", "lizheng.me"]) {
	for (const path of [
		"/_sites/resume/en/index.html",
		"/_sites",
		"/cover/en/",
		"/docs/content/01-resume-en.md",
		"/.git/config",
		"/_sites%2fresume/en/index.html",
		"/%5c_docs",
	])
		it(`blocks ${host}${path}`, async () => {
			const f = fixture(host);
			expect((await f.request(path)).status).toBe(404);
			expect(f.asset).not.toHaveBeenCalled();
		});
	for (const locale of ["en", "zh"])
		for (const suffix of ["", "/", ".md", "/content.md"])
			it(`rewrites ${host}/${locale}${suffix}`, async () => {
				const f = fixture(host);
				const result = await f.request(`/${locale}${suffix}?ref=a`);
				expect(result.status).toBe(200);
				const path = new URL(
					(f.asset.mock.calls[0] as unknown as [Request])[0].url,
				).pathname;
				const base = `/_sites/${host === "lizheng.me" ? "landing" : "resume"}/${locale}`;
				expect(path).toBe(
					suffix.includes("md") ? `${base}.md` : `${base}/index.html`,
				);
				if (suffix.includes("md"))
					expect(result.headers.get("content-type")).toContain("text/markdown");
			});
	for (const path of [
		"/robots.txt",
		"/llms.txt",
		"/sitemap-index.xml",
		"/sitemap-pages.xml",
	])
		it(`metadata ${host}${path}`, async () => {
			const f = fixture(host);
			const result = await f.request(path);
			expect(result.status).toBe(200);
			expect(await result.text()).toContain(`https://${host}/`);
			expect(f.asset).not.toHaveBeenCalled();
		});
	it(`locale root ${host}`, async () => {
		for (const [accept, locale] of [
			["zh-CN, en;q=0.5", "zh"],
			["en-US,zh;q=0.5", "en"],
			["", "en"],
		]) {
			const result = await fixture(host).request("/", {
				headers: { "Accept-Language": accept ?? "" },
			});
			expect(result.status).toBe(302);
			expect(result.headers.get("location")).toBe(`https://${host}/${locale}/`);
			expect(result.headers.get("vary")).toBe("Accept-Language");
		}
	});
}
it("denies unsupported methods", async () => {
	const result = await fixture().request("/api/live", { method: "POST" });
	expect(result.status).toBe(405);
	expect(result.headers.get("allow")).toBe("GET, HEAD");
});
it("HEAD does not return a body", async () => {
	const result = await fixture().request("/api/live", { method: "HEAD" });
	expect(result.status).toBe(200);
	expect(await result.text()).toBe("");
});
it("keeps missing APIs and arbitrary assets at 404", async () => {
	for (const path of ["/api/missing", "/missing.css", "/elsewhere"])
		expect((await fixture().request(path)).status).toBe(404);
});
it("serves hashed assets with immutable cache", async () => {
	const result = await fixture().request("/assets/a-abc.js");
	expect(result.headers.get("cache-control")).toContain("immutable");
	expect(result.headers.get("content-security-policy")).toContain("sha256-");
});
it("does not cache missing assets forever or expose asset redirects", async () => {
	for (const status of [301, 302, 307, 308, 304, 404]) {
		const f = fixture();
		f.asset.mockImplementation(async () => new Response(null, { status }));
		const result = await f.request("/assets/missing.js");
		expect(result.status).toBe(
			status >= 300 && status < 400 && status !== 304 ? 404 : status,
		);
		expect(result.headers.get("cache-control")).not.toContain("immutable");
	}
});
it("uses isolated host mapping and deployment metadata", async () => {
	const env = {
		ENVIRONMENT: "test",
		LANDING_HOST: "landing.lizheng-test.localhost",
		CF_VERSION_METADATA: { id: "test-id" },
	} as Env;
	const result = await worker.fetch(
		new Request("http://landing.lizheng-test.localhost/api/live"),
		env,
	);
	expect(await result.json()).toMatchObject({
		surface: "landing",
		deployment: "test-id",
	});
	expect(result.headers.get("x-robots-tag")).toContain("noindex");
	expect(result.headers.get("content-security-policy")).not.toContain(
		"upgrade-insecure-requests",
	);
});
