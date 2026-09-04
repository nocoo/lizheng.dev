import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadContent } from "../../packages/content/model";

vi.mock("node:fs/promises", async (original) => ({
	...(await original<typeof import("node:fs/promises")>()),
	readFile: vi.fn(),
}));
const actual =
	await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
const en = await actual.readFile("docs/content/01-resume-en.md", "utf8");
beforeEach(() => vi.mocked(readFile).mockResolvedValue(en));
describe("public content boundary", () => {
	it("rejects mismatched identity metadata", async () => {
		vi.mocked(readFile).mockResolvedValue(
			en.replace('surface: "resume"', 'surface: "landing"'),
		);
		await expect(loadContent("resume", "en")).rejects.toThrow(/identity/i);
	});
	it("rejects deleted experience", async () => {
		vi.mocked(readFile).mockResolvedValue(
			en.replace(/## Work Experience[\s\S]*?(?=## Education)/, ""),
		);
		await expect(loadContent("resume", "en")).rejects.toThrow(/section/i);
	});
	it("rejects nested raw HTML", async () => {
		vi.mocked(readFile).mockResolvedValue(
			en.replace("He believes", "- <script>alert(1)</script>\n\nHe believes"),
		);
		await expect(loadContent("resume", "en")).rejects.toThrow(/HTML/i);
	});
	it("rejects malicious links anywhere", async () => {
		vi.mocked(readFile).mockResolvedValue(
			en.replace(
				"https://patents.google.com/patent/CN103248610A",
				"javascript:alert(1)",
			),
		);
		await expect(loadContent("resume", "en")).rejects.toThrow(/HTTPS/i);
	});
});
for (const [surface, locale, file] of [
	["resume", "en", "01-resume-en.md"],
	["resume", "zh", "02-resume-zh.md"],
	["landing", "en", "03-landing-en.md"],
	["landing", "zh", "04-landing-zh.md"],
] as const) {
	it(`loads complete ${surface}/${locale}`, async () => {
		const markdown = await actual.readFile(`docs/content/${file}`, "utf8");
		vi.mocked(readFile).mockResolvedValue(markdown);
		const result = await loadContent(surface, locale);
		expect(result.markdown).toBe(markdown);
		expect(result.links).toHaveLength(4);
		expect(result.sections).toHaveLength(surface === "resume" ? 6 : 0);
	});
}
const mutations = [
	["frontmatter", () => "no metadata", /frontmatter/],
	["null metadata", () => "---\nnull\n---\n", /metadata/],
	["array metadata", () => "---\n- value\n---\n", /metadata/],
	[
		"numeric metadata",
		(s: string) => s.replace('id: "resume-en"', "id: 42"),
		/metadata/,
	],
	[
		"empty metadata",
		(s: string) => s.replace('id: "resume-en"', 'id: " "'),
		/metadata/,
	],
	["missing title", (s: string) => s.replace(/^title:.*\n/m, ""), /metadata/],
	[
		"missing tagline",
		(s: string) => s.replace(/^tagline:.*\n/m, ""),
		/metadata/,
	],
	[
		"wrong locale",
		(s: string) => s.replace('locale: "en"', 'locale: "zh"'),
		/identity/,
	],
	[
		"wrong id",
		(s: string) => s.replace('id: "resume-en"', 'id: "private"'),
		/identity/,
	],
	[
		"wrong canonical",
		(s: string) => s.replace("https://lizheng.dev/en/", "https://evil.test/"),
		/canonical/,
	],
	[
		"unsupported table",
		(s: string) => `${s}\n|a|b|\n|--|--|\n|c|d|`,
		/Unsupported/,
	],
	[
		"credentials",
		(s: string) =>
			s.replace("https://github.com", "https://user:pass@github.com"),
		/HTTPS/,
	],
	[
		"password only",
		(s: string) => s.replace("https://github.com", "https://:pass@github.com"),
		/HTTPS/,
	],
	[
		"duplicate link",
		(s: string) =>
			s.replace("https://github.com/nocoo", "https://lizheng.blog/"),
		/four/,
	],
	["missing link", (s: string) => s.replace(/^- \[github.*\n/m, ""), /four/],
	[
		"missing job",
		(s: string) =>
			s.replace("### Microsoft Research Asia", "Microsoft Research Asia"),
		/jobs/,
	],
	[
		"missing degree",
		(s: string) => s.replace("### Tongji University", "Tongji University"),
		/degrees/,
	],
	[
		"missing achievement",
		(s: string) => s.replace(/^- Promoted.*\n/m, ""),
		/achievements/,
	],
	[
		"missing patent",
		(s: string) =>
			s.replace(
				"https://patents.google.com/patent/CN103248610A",
				"https://patents.google.com/",
			),
		/patent/,
	],
	[
		"no sections",
		(s: string) => s.split("## Professional Summary")[0] ?? "",
		/sections/,
	],
] as const;
for (const [label, mutate, error] of mutations)
	it(`rejects ${label}`, async () => {
		vi.mocked(readFile).mockResolvedValue(mutate(en));
		await expect(loadContent("resume", "en")).rejects.toThrow(error);
	});
it("does not read non-allowlisted paths", async () => {
	await expect(loadContent("archive" as "resume", "en")).rejects.toThrow(
		/identity/,
	);
	await expect(loadContent("resume", "../README" as "en")).rejects.toThrow(
		/identity/,
	);
	expect(readFile).not.toHaveBeenCalled();
});
it("requires landing introduction", async () => {
	const source = await actual.readFile("docs/content/03-landing-en.md", "utf8");
	vi.mocked(readFile).mockResolvedValue(
		source.replace(
			/15 years building web & mobile software\.\nNow rebuilding myself for the AI era\.\n(?=\n##)/,
			"",
		),
	);
	await expect(loadContent("landing", "en")).rejects.toThrow(/introduction/);
});
