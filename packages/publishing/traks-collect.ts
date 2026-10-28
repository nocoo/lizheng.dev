import type { Surface } from "../content/model";

export const traksStubScript =
	"window.traks=window.traks||function(){(window.traks.q=window.traks.q||[]).push(arguments)}";

export const TRAKS_COLLECT_ORIGIN = "https://track-collect.nocoo.cloud";

const traksSiteKeys: Record<Surface, string> = {
	resume: "pb_live_zq1jbvt6hrll2zx01fk36hp7",
	landing: "pb_live_ahl78eqd9kzx8sqgww66oag9",
};

const traksCollectScriptPath = "/t.js";

export function isTraksCollectScriptUrl(url: string): boolean {
	try {
		const target = new URL(url);
		return (
			target.origin === TRAKS_COLLECT_ORIGIN &&
			target.pathname === traksCollectScriptPath
		);
	} catch {
		return false;
	}
}

export function traksCollectHeadMarkup(surface: Surface): string {
	const siteKey = traksSiteKeys[surface];
	return `<script>${traksStubScript}</script><script defer data-site="${siteKey}" src="${TRAKS_COLLECT_ORIGIN}${traksCollectScriptPath}"></script>`;
}
