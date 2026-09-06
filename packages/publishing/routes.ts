import type { Locale, Surface } from "../content/model";

export function publicOrigin(surface: Surface) {
	return surface === "landing" ? "https://lizheng.me" : "https://lizheng.dev";
}

/** Exact aliases only; preserve the path and query without re-encoding either. */
export function canonicalHostRedirect(
	url: URL,
	testMode = false,
): string | undefined {
	const aliases: Record<string, string> = {
		"www.lizheng.me": "lizheng.me",
		"www.lizheng.dev": "lizheng.dev",
		"www.lizheng.blog": "lizheng.blog",
		...(testMode
			? {
					"www.landing.lizheng-test.localhost":
						"landing.lizheng-test.localhost",
					"www.resume.lizheng-test.localhost": "resume.lizheng-test.localhost",
					"www.blog.lizheng-test.localhost": "blog.lizheng-test.localhost",
				}
			: {}),
	};
	const host = Object.hasOwn(aliases, url.hostname)
		? aliases[url.hostname]
		: undefined;
	if (!host) return undefined;
	const target = new URL(url);
	target.hostname = host;
	if (!host.endsWith(".localhost")) {
		target.protocol = "https:";
		target.port = "";
	}
	return target.href;
}

export function iconAssetPath(path: string): string | undefined {
	const icons: Record<string, string> = {
		"/favicon.svg": "/favicon.svg",
		"/favicon.ico": "/favicon.ico",
		"/apple-touch-icon.png": "/apple-touch-icon.png",
		"/apple-touch-icon": "/apple-touch-icon.png",
		"/apple-touch-icon-precomposed.png": "/apple-touch-icon.png",
	};
	return icons[path];
}

// These legacy patterns intentionally retain the production contract exactly.
const legacyBlogPaths = [
	/^\/\d{4}\/\d{2}\//,
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
export function legacyRedirect(surface: Surface, url: URL): string | undefined {
	if (
		surface === "landing" &&
		legacyBlogPaths.some((pattern) => pattern.test(url.pathname))
	)
		return `https://lizheng.blog${url.pathname}${url.search}`;
	return undefined;
}
export function selectSurface(host: string, landingHost?: string): Surface {
	return [
		"lizheng.me",
		"www.lizheng.me",
		"lizheng-me.dev.hexly.ai",
		landingHost,
		landingHost ? `www.${landingHost}` : undefined,
	].includes(host.toLowerCase().split(":")[0] as string)
		? "landing"
		: "resume";
}
export function selectLocale(accept = ""): Locale {
	return accept.split(",")[0]?.toLowerCase().startsWith("zh") ? "zh" : "en";
}
export function metadataFile(
	surface: Surface,
	path: string,
): { type: string; body: string } | undefined {
	const origin = publicOrigin(surface);
	if (path === "/robots.txt")
		return {
			type: "text/plain",
			body: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap-index.xml\n`,
		};
	if (path === "/sitemap-index.xml")
		return {
			type: "application/xml",
			body: `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${origin}/sitemap-pages.xml</loc></sitemap></sitemapindex>`,
		};
	if (
		path === "/sitemap-pages.xml" ||
		(surface === "resume" && path === "/sitemap.xml")
	)
		return {
			type: "application/xml",
			body: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["en", "zh"].map((locale) => `<url><loc>${origin}/${locale}/</loc></url>`).join("")}</urlset>`,
		};
	return undefined;
}
