import type { PageContent } from "../content/model";
import { themeColors } from "../experience/theme-colors";
import { publicOrigin } from "./routes";
import socialImages from "./social-images.json" with { type: "json" };

export function Metadata({
	content,
	profile,
}: {
	content: PageContent;
	profile: PageContent;
}) {
	const { surface, locale, meta } = content;
	const origin = publicOrigin(surface);
	const canonical = `${origin}/${locale}/`;
	const image = `${origin}${socialImages[surface][locale]}`;
	const [jobTitle, employer] = profile.meta.role.split(" @ ");
	const graph = {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		"@id": `${canonical}#profile`,
		url: canonical,
		name: meta.title,
		description: meta.description,
		inLanguage: locale === "zh" ? "zh-CN" : "en",
		mainEntity: {
			"@type": "Person",
			"@id": "https://lizheng.me/#person",
			name: profile.meta.name,
			alternateName: locale === "zh" ? "Zheng Li" : "李征",
			url: "https://lizheng.me/",
			jobTitle,
			worksFor: { "@type": "Organization", name: employer },
			image: "https://lizheng.dev/design-assets/portrait.webp",
			sameAs: [
				...new Set([
					"https://lizheng.me/",
					"https://lizheng.dev/",
					"https://hexly.ai/",
					...profile.links.map((link) => link.href),
				]),
			],
		},
	};
	return (
		<>
			<title>{meta.title}</title>
			<meta name="description" content={meta.description} />
			<meta name="robots" content="index, follow, max-image-preview:large" />
			<meta
				name="theme-color"
				media="(prefers-color-scheme: light)"
				content={themeColors.light}
			/>
			<meta
				name="theme-color"
				media="(prefers-color-scheme: dark)"
				content={themeColors.dark}
			/>
			<link rel="canonical" href={canonical} />
			<link rel="alternate" hrefLang="en" href={`${origin}/en/`} />
			<link rel="alternate" hrefLang="zh-CN" href={`${origin}/zh/`} />
			<link rel="alternate" hrefLang="x-default" href={`${origin}/en/`} />
			<link
				rel="alternate"
				type="text/markdown"
				href={`${origin}/${locale}/content.md`}
			/>
			<meta property="og:type" content="profile" />
			<meta
				property="og:site_name"
				content={`Zheng Li · ${surface === "resume" ? "Résumé" : "Play"}`}
			/>
			<meta property="og:title" content={meta.title} />
			<meta property="og:description" content={meta.description} />
			<meta property="og:url" content={canonical} />
			<meta
				property="og:locale"
				content={locale === "zh" ? "zh_CN" : "en_US"}
			/>
			<meta
				property="og:locale:alternate"
				content={locale === "zh" ? "en_US" : "zh_CN"}
			/>
			<meta property="og:image" content={image} />
			<meta property="og:image:type" content="image/jpeg" />
			<meta property="og:image:width" content="1200" />
			<meta property="og:image:height" content="630" />
			<meta property="og:image:alt" content={meta.socialImageAlt} />
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:title" content={meta.title} />
			<meta name="twitter:description" content={meta.description} />
			<meta name="twitter:image" content={image} />
			<meta name="twitter:image:alt" content={meta.socialImageAlt} />
			<script type="application/ld+json">
				{JSON.stringify(graph).replaceAll("<", "\\u003c")}
			</script>
		</>
	);
}
