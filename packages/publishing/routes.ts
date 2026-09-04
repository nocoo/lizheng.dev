import type { Locale, Surface } from "../content/model";

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
	const origin =
		surface === "landing" ? "https://lizheng.me" : "https://lizheng.dev";
	if (path === "/robots.txt")
		return {
			type: "text/plain",
			body: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap-index.xml\n`,
		};
	if (path === "/llms.txt")
		return {
			type: "text/plain",
			body: `# Zheng Li\n\n${surface === "resume" ? "Professional résumé" : "Personal portfolio"}. Engineering leader at Microsoft.\n\n- [English](${origin}/en/content.md)\n- [中文](${origin}/zh/content.md)\n`,
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
