import type { Surface } from "../content/model";
import { surfaceLinks } from "../experience/surface-links";
import { selectLocale } from "./routes";

export function notFoundPage(surface: Surface, path: string, accept = "") {
	const locale = selectLocale(/^\/(en|zh)(?:\/|$)/.exec(path)?.[1] ?? accept);
	const links = surfaceLinks(locale, surface)
		.map((link) => `<a href="${link.href}">${link.name}</a>`)
		.join(" ");
	const title = locale === "zh" ? "页面未找到" : "Page not found";
	return `<!doctype html><html lang="${locale === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 — ${title}</title><style>body{font-family:system-ui,sans-serif;max-width:60rem;margin:0 auto;padding:2rem;line-height:1.6}nav{display:flex;flex-wrap:wrap;gap:1.5rem}main{margin-top:5rem}a{color:inherit}</style></head><body><header><nav aria-label="${locale === "zh" ? "访问面" : "Surfaces"}">${links}</nav></header><main><h1>404 — ${title}</h1><p>${locale === "zh" ? "请选择上方链接继续浏览。" : "Choose a link above to continue."}</p></main></body></html>`;
}
