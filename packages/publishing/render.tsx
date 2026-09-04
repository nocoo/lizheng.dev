import { renderToStaticMarkup } from "react-dom/server";
import { LandingPage } from "../../apps/landing/LandingPage";
import { ResumePage } from "../../apps/resume/ResumePage";
import { type Locale, loadContent, type Surface } from "../content/model";

export const themeScript = `(()=>{let t;try{t=localStorage.getItem('zl-theme')}catch{}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t})()`;
const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
const json = (value: unknown) =>
	JSON.stringify(value).replaceAll("<", "\\u003c");

export async function renderPage(
	surface: Surface,
	locale: Locale,
	assets?: { script: string; css: string[] },
	preview = false,
) {
	const content = await loadContent(surface, locale);
	if (preview) {
		content.origins = {
			resume: "https://lizheng-dev.dev.hexly.ai",
			landing: "https://lizheng-me.dev.hexly.ai",
		};
		content.links = content.links.map((link) => ({
			...link,
			href: link.href.replace(
				"https://lizheng.dev",
				content.origins?.resume ?? "https://lizheng.dev",
			),
		}));
	}
	const origin =
		surface === "resume" ? "https://lizheng.dev" : "https://lizheng.me";
	const markup = renderToStaticMarkup(
		surface === "resume" ? (
			<ResumePage content={content} />
		) : (
			<LandingPage content={content} />
		),
	);
	const script =
		assets?.script ??
		`/apps/${surface}/client.${surface === "resume" ? "ts" : "tsx"}`;
	const styles =
		assets?.css
			.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`)
			.join("") ?? "";
	return `<!doctype html><html lang="${locale === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><script>${themeScript}</script><title>${escapeHtml(content.meta.title ?? "Zheng Li")}</title><meta name="description" content="${escapeHtml(content.meta.description ?? "")}"><link rel="canonical" href="${origin}/${locale}/"><link rel="alternate" hreflang="en" href="${origin}/en/"><link rel="alternate" hreflang="zh-CN" href="${origin}/zh/"><link rel="alternate" hreflang="x-default" href="${origin}/en/"><link rel="alternate" type="text/markdown" href="/${locale}.md"><meta property="og:type" content="profile"><meta property="og:title" content="${escapeHtml(content.meta.title ?? "")}"><meta property="og:description" content="${escapeHtml(content.meta.description ?? "")}"><meta property="og:url" content="${origin}/${locale}/"><meta property="og:image" content="${origin}/design-assets/portrait.webp"><link rel="icon" type="image/svg+xml" href="/favicon.svg">${styles}<script type="application/ld+json">${json({ "@context": "https://schema.org", "@type": "ProfilePage", url: `${origin}/${locale}/`, mainEntity: { "@type": "Person", name: locale === "zh" ? "李征" : "Zheng Li", alternateName: locale === "zh" ? "Zheng Li" : "李征", jobTitle: "Principal Software Engineering Manager", worksFor: { "@type": "Organization", name: "Microsoft" }, sameAs: ["https://github.com/nocoo", "https://linkedin.com/in/nocoo", "https://lizheng.blog/"] } })}</script></head><body><div id="app">${markup}</div>${surface === "landing" ? `<script type="application/json" id="page-data">${json(content)}</script>` : ""}<script type="module" src="${escapeHtml(script)}"></script></body></html>`;
}
