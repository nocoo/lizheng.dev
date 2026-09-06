import type { PageContent } from "../content/model";
import { publicOrigin } from "./routes";

export function llmsDocument(en: PageContent, zh: PageContent) {
	if (en.locale !== "en" || zh.locale !== "zh" || en.surface !== zh.surface)
		throw new Error("Expected both languages of one public surface");
	const origin = publicOrigin(en.surface);
	return `# ${en.meta.title}

> ${en.meta.description}
>
> ${zh.meta.description}

Public pages welcome search and AI crawlers. The Markdown documents contain the full public content of the corresponding pages; no JavaScript is needed to read them.

## English

- [Read in the browser](${en.meta.canonical}): ${en.meta.title}
- [Full public content in Markdown](${en.meta.canonical}content.md)

## 中文

- [浏览网页](${zh.meta.canonical}): ${zh.meta.title}
- [完整公开内容 Markdown](${zh.meta.canonical}content.md)

## Related sites

- [Résumé](https://lizheng.dev/en/): Professional identity, experience, education, patent and engineering leadership. [中文](https://lizheng.dev/zh/)
- [Play](https://lizheng.me/en/): Personal website with six interactive devices and links to the blog, résumé and public profiles. [中文](https://lizheng.me/zh/)
- [Journal](https://lizheng.blog/): Essays and notes.

## Discovery

- [Sitemap index](${origin}/sitemap-index.xml)
- [Crawler policy](${origin}/robots.txt)
`;
}
