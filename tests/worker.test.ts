import { describe, expect, test } from "vitest";
import worker from "../worker/index";

// Minimal ASSETS mock: records every URL the worker forwards to the asset store,
// and returns a 200 so we can assert routing decisions without real files.
function makeEnv() {
	const calls: string[] = [];
	const env = {
		ASSETS: {
			fetch: async (req: Request | string): Promise<Response> => {
				const url = typeof req === "string" ? req : req.url;
				calls.push(url);
				return new Response(`asset:${url}`, { status: 200 });
			},
		},
	} as unknown as Env;
	return { env, calls };
}

function call(url: string, init?: RequestInit) {
	const { env, calls } = makeEnv();
	return worker
		.fetch(new Request(url, init), env)
		.then((res) => ({ res, calls }));
}

describe("cover host — internal path guard", () => {
	test("/cover/* direct access returns 404 and never hits assets", async () => {
		const { res, calls } = await call("https://lizheng.me/cover/en/");
		expect(res.status).toBe(404);
		expect(calls).toHaveLength(0);
	});

	test("/cover/ root direct access returns 404", async () => {
		const { res } = await call("https://lizheng.me/cover/");
		expect(res.status).toBe(404);
	});
});

describe("cover host — 301 legacy blog redirects", () => {
	const cases = [
		"/2024/01/some-post",
		"/category/tech",
		"/tag/javascript",
		"/archive",
		"/search",
		"/feed.xml",
		"/feed",
		"/page/2",
		"/preview/secret",
		"/sitemap.xml",
		"/admin",
		"/admin/posts",
		"/login",
	];
	for (const path of cases) {
		test(`${path} → 301 https://lizheng.blog${path}`, async () => {
			const { res, calls } = await call(`https://lizheng.me${path}`);
			expect(res.status).toBe(301);
			expect(res.headers.get("location")).toBe(`https://lizheng.blog${path}`);
			expect(calls).toHaveLength(0);
		});
	}

	test("preserves query string on 301", async () => {
		const { res } = await call("https://lizheng.me/tag/js?ref=feed");
		expect(res.status).toBe(301);
		expect(res.headers.get("location")).toBe(
			"https://lizheng.blog/tag/js?ref=feed",
		);
	});
});

describe("cover host — real 404 for unknown paths", () => {
	test("unknown path is not another homepage", async () => {
		const { res } = await call("https://lizheng.me/random-thing");
		expect(res.status).toBe(404);
		expect(res.headers.get("location")).toBeNull();
	});

	test("language preference does not change a missing path", async () => {
		const { res } = await call("https://lizheng.me/random-thing", {
			headers: { "accept-language": "zh-CN,zh;q=0.9" },
		});
		expect(res.status).toBe(404);
		expect(res.headers.get("location")).toBeNull();
	});
});
