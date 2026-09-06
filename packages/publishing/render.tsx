import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { LandingPage } from "../../apps/landing/LandingPage";
import { ResumePage } from "../../apps/resume/ResumePage";
import { type Locale, loadContent, type Surface } from "../content/model";

import { themeScript } from "../experience/theme-bootstrap";
import { Metadata } from "./Metadata";

export { themeScript } from "../experience/theme-bootstrap";

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
			blog: "https://firefly.dev.hexly.ai",
		};
		content.links = content.links.map((link) => ({
			...link,
			href: link.href.replace(
				"https://lizheng.dev",
				"https://lizheng-dev.dev.hexly.ai",
			),
		}));
	}
	const profile =
		surface === "resume" ? content : await loadContent("resume", locale);
	const metadata = renderToStaticMarkup(
		<Metadata content={content} profile={profile} />,
	);
	const render = surface === "landing" ? renderToString : renderToStaticMarkup;
	const markup = render(
		content.surface === "resume" ? (
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
	return `<!doctype html><html lang="${locale === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><script>${themeScript}</script>${metadata}<link rel="icon" type="image/svg+xml" href="/favicon.svg">${styles}</head><body><div id="app">${markup}</div>${surface === "landing" ? `<script type="application/json" id="page-data">${json({ ...content, markdown: "", sections: [] })}</script>` : ""}<script type="module" src="${escapeHtml(script)}"></script></body></html>`;
}
