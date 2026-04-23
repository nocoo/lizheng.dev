interface Env {
	ASSETS: Fetcher;
}

const COVER_HOSTS = new Set(["lizheng.me", "www.lizheng.me"]);
const COVER_HTML_PATHS = new Set(["/", "/en", "/en/", "/zh", "/zh/"]);

// Legacy lizheng.me paths that should 301 to lizheng.blog
const BLOG_PATTERNS: RegExp[] = [
	/^\/\d{4}\/\d{2}\//, // /2024/01/post-slug
	/^\/category(\/|$)/,
	/^\/tag(\/|$)/,
	/^\/archive(\/|$)/,
	/^\/search$/,
	/^\/feed\.xml$/,
	/^\/feed$/,
	/^\/page\//,
	/^\/preview\//,
	/^\/sitemap\.xml$/,
	/^\/admin(\/|$)/,
	/^\/login$/,
];

function detectLocale(request: Request): "en" | "zh" {
	const accept = request.headers.get("accept-language");
	if (accept) {
		const preferred = accept.split(",")[0]?.split("-")[0]?.toLowerCase();
		if (preferred === "zh") return "zh";
	}
	return "en";
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const host = url.host.toLowerCase();

		if (COVER_HOSTS.has(host)) {
			const path = url.pathname;

			// Block direct access to internal /cover/* paths
			if (path.startsWith("/cover/")) {
				return new Response("Not Found", { status: 404 });
			}

			// 301 legacy blog paths to lizheng.blog
			if (BLOG_PATTERNS.some((re) => re.test(path))) {
				return Response.redirect(
					`https://lizheng.blog${path}${url.search}`,
					301,
				);
			}

			// Cover HTML routes — rewrite to /cover/* assets (always with trailing slash)
			if (COVER_HTML_PATHS.has(path)) {
				const rewritten = new URL(request.url);
				const normalized = path.endsWith("/") ? path : `${path}/`;
				rewritten.pathname =
					normalized === "/" ? "/cover/" : `/cover${normalized}`;
				return env.ASSETS.fetch(new Request(rewritten.toString(), request));
			}

			// Static asset (has a dot, not .xml) — pass through to root assets
			if (path.includes(".") && !path.endsWith(".xml")) {
				return env.ASSETS.fetch(request);
			}

			// Unknown path — redirect to locale homepage to avoid 404 indexing
			const locale = detectLocale(request);
			return Response.redirect(`${url.origin}/${locale}/`, 302);
		}

		return env.ASSETS.fetch(request);
	},
};
