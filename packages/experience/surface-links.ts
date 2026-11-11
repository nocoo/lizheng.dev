import type { Locale, PageContent, Surface } from "../content/model";

export function surfaceLinks(
	locale: Locale,
	surface: Surface,
	origins?: PageContent["origins"],
) {
	const names = {
		en: ["Play", "Journal", "Résumé", "Portfolio"],
		zh: ["主页", "博客", "简历", "作品集"],
	}[locale];
	return [
		{
			id: "landing",
			name: names[0],
			href: `${origins?.landing ?? "https://lizheng.me"}/${locale}/`,
		},
		{
			id: "blog",
			name: names[1],
			href: `${origins?.blog ?? "https://lizheng.blog"}/`,
		},
		{
			id: "resume",
			name: names[2],
			href: `${origins?.resume ?? "https://lizheng.dev"}/${locale}/`,
		},
		{ id: "portfolio", name: names[3], href: "https://hexly.ai" },
	].map((link) => ({
		...link,
		href: link.id === surface ? `/${locale}/` : link.href,
	}));
}
