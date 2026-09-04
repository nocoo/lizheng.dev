import { readFile } from "node:fs/promises";
import { marked, type Token } from "marked";
import { parse } from "yaml";

export type Locale = "en" | "zh";
export type Surface = "resume" | "landing";
interface PublicLink {
	label: string;
	href: string;
}
interface ContentSection {
	id: string;
	title: string;
	tokens: Token[];
}
interface ContentMeta {
	id: string;
	surface: string;
	locale: string;
	title: string;
	description: string;
	name: string;
	role: string;
	canonical: string;
	copyright: string;
	tagline?: string;
	eyebrow?: string;
	location?: string;
}
export interface PageContent {
	origins?: Record<Surface, string>;
	year: string;
	surface: Surface;
	locale: Locale;
	meta: ContentMeta;
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
	if (
		!Object.hasOwn(sources, surface) ||
		!Object.hasOwn(sources[surface], locale)
	)
		throw new Error("Unknown public content identity");
	const markdown = await readFile(
		new URL(`../../docs/content/${sources[surface][locale]}`, import.meta.url),
		"utf8",
	);
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(markdown);
	if (!match) throw new Error("Missing frontmatter");
	const data = parse(match[1] as string) as Record<string, unknown>;
	const content = match[2] as string;
	if (!data || typeof data !== "object" || Array.isArray(data))
		throw new Error("Invalid metadata object");
	const meta: Record<string, string> = {};
	for (const [key, value] of Object.entries(data)) {
		if (typeof value !== "string" || !value.trim())
			throw new Error(`Invalid metadata: ${key}`);
		meta[key] = value;
	}
	for (const key of [
		"id",
		"surface",
		"locale",
		"title",
		"description",
		"name",
		"role",
		"canonical",
		"copyright",
	]) {
		if (!meta[key]) throw new Error(`Missing metadata: ${key}`);
	}
	if (
		meta.id !== `${surface}-${locale}` ||
		meta.surface !== surface ||
		meta.locale !== locale
	)
		throw new Error("Content identity mismatch");
	const origin =
		surface === "resume" ? "https://lizheng.dev" : "https://lizheng.me";
	if (meta.canonical !== `${origin}/${locale}/`)
		throw new Error("Invalid canonical URL");
	for (const key of surface === "resume"
		? ["tagline"]
		: ["eyebrow", "location"])
		if (!meta[key]) throw new Error(`Missing metadata: ${key}`);
	const tokens = marked.lexer(content);
	const supported = new Set([
		"space",
		"heading",
		"paragraph",
		"text",
		"link",
		"list",
		"list_item",
		"strong",
		"em",
		"br",
		"escape",
		"codespan",
	]);
	marked.walkTokens(tokens, (token) => {
		if (token.type === "html")
			throw new Error("Raw HTML is not allowed in public content");
		if (!supported.has(token.type))
			throw new Error(`Unsupported Markdown: ${token.type}`);
		if (
			token.type === "link" &&
			(!/^https:\/\/[^\s]+$/.test(token.href) ||
				new URL(token.href).username ||
				new URL(token.href).password)
		)
			throw new Error("Expected HTTPS public link without credentials");
	});
	const sections: ContentSection[] = [];
	const links: PublicLink[] = [];
	const intro: string[] = [];
	let section: ContentSection | undefined;
	for (const token of tokens) {
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
				links.push({ label: token.text, href: token.href });
			}
		});
		sections.pop();
	}
	const expectedTitles =
		surface === "landing"
			? []
			: locale === "en"
				? [
						"Professional Summary",
						"Work Experience",
						"Education",
						"Patent",
						"Leadership & Communication",
						"Beyond Work",
					]
				: [
						"职业概述",
						"工作经历",
						"教育背景",
						"专利",
						"领导力与沟通",
						"工作之外",
					];
	if (
		JSON.stringify(sections.map((item) => item.title)) !==
		JSON.stringify(expectedTitles)
	)
		throw new Error("Missing or reordered content sections");
	if (links.length !== 4 || new Set(links.map((link) => link.href)).size !== 4)
		throw new Error("Expected four unique public links");
	if (surface === "landing" && !intro.join("").trim())
		throw new Error("Missing introduction");
	if (surface === "resume") {
		const experience = sections.find((item) => item.id === "experience");
		const education = sections.find((item) => item.id === "education");
		const count = (items: Token[], type: string) =>
			items.filter((token) => token.type === type).length;
		if (
			count((experience as ContentSection).tokens, "heading") !== 3 ||
			count((education as ContentSection).tokens, "heading") !== 2
		)
			throw new Error("Incomplete jobs or degrees");
		let achievements = 0;
		marked.walkTokens((experience as ContentSection).tokens, (token) => {
			if (token.type === "list_item") achievements++;
		});
		if (
			achievements !== 13 ||
			!content.includes("https://patents.google.com/patent/CN103248610A")
		)
			throw new Error("Incomplete achievements or patent");
	}
	return {
		year: String(new Date().getUTCFullYear()),
		surface,
		locale,
		meta: meta as unknown as ContentMeta,
		intro: intro.join("\n"),
		sections,
		links,
		markdown,
	};
}
