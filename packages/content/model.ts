import { readFile } from "node:fs/promises";
import matter from "gray-matter";
import { marked, type Token } from "marked";

export type Locale = "en" | "zh";
export type Surface = "resume" | "landing";
export interface PublicLink {
	label: string;
	href: string;
}
export interface ContentSection {
	id: string;
	title: string;
	tokens: Token[];
}
export interface PageContent {
	origins?: Record<Surface, string>;
	surface: Surface;
	locale: Locale;
	meta: Record<string, string>;
	intro: string;
	sections: ContentSection[];
	links: PublicLink[];
	markdown: string;
}

const sources: Record<Surface, Record<Locale, string>> = {
	resume: { en: "01-resume-en.md", zh: "02-resume-zh.md" },
	landing: { en: "03-landing-en.md", zh: "04-landing-zh.md" },
};
const sectionIds = [
	"summary",
	"experience",
	"education",
	"patent",
	"leadership",
	"beyond",
];

export async function loadContent(
	surface: Surface,
	locale: Locale,
): Promise<PageContent> {
	const markdown = await readFile(
		new URL(`../../docs/content/${sources[surface][locale]}`, import.meta.url),
		"utf8",
	);
	const { data, content } = matter(markdown);
	const meta: Record<string, string> = {};
	for (const [key, value] of Object.entries(data)) {
		if (typeof value !== "string") throw new Error(`Invalid metadata: ${key}`);
		meta[key] = value;
	}
	for (const key of [
		"title",
		"description",
		"name",
		"role",
		"canonical",
		"copyright",
	]) {
		if (!meta[key]) throw new Error(`Missing metadata: ${key}`);
	}
	const tokens = marked.lexer(content);
	const sections: ContentSection[] = [];
	const links: PublicLink[] = [];
	const intro: string[] = [];
	let section: ContentSection | undefined;
	for (const token of tokens) {
		if (token.type === "html")
			throw new Error("Raw HTML is not allowed in public content");
		if (token.type === "heading" && token.depth === 2) {
			section = {
				id: sectionIds[sections.length] ?? "links",
				title: token.text,
				tokens: [],
			};
			sections.push(section);
		} else if (section) {
			section.tokens.push(token);
		} else if (token.type === "paragraph") {
			intro.push(token.text);
		}
	}
	const linkSection = sections.at(-1);
	if (linkSection) {
		marked.walkTokens(linkSection.tokens, (token) => {
			if (token.type === "link") {
				if (!token.href.startsWith("https://"))
					throw new Error("Expected HTTPS public link");
				links.push({ label: token.text, href: token.href });
			}
		});
		sections.pop();
	}
	return {
		surface,
		locale,
		meta,
		intro: intro.join("\n"),
		sections,
		links,
		markdown,
	};
}
