# Public content corpus

Extracted on 2026-09-05 from all four live language pages, cross-checked against source at bf23331. Main prose was preserved verbatim at extraction; presentation-only HTML and SVG decoration were removed. Subsequent presentation, landing-copy and résumé edits are recorded below.

## Publication allowlist

| File | Public surface | Body |
| --- | --- | --- |
| [01 — Résumé, English](01-resume-en.md) | lizheng.dev/en/ | Full résumé and social links |
| [02 — 简历，中文](02-resume-zh.md) | lizheng.dev/zh/ | 完整简历及社交链接 |
| [03 — Landing, English](03-landing-en.md) | lizheng.me/en/ | Introduction, page overview, six device descriptions and four destinations |
| [04 — 入口页，中文](04-landing-zh.md) | lizheng.me/zh/ | 自我介绍、页面说明、六个设备介绍及四个入口 |

These four files, including their frontmatter, are the publishing source of truth. Frontmatter stores public title, description, social image heading/label/alt, identity, role, canonical URL, and footer information. Body Markdown stores the content to render. Renderers use both without displaying YAML syntax. HTML, Markdown and llms.txt share the validated model; the image generator reads the same public social fields.

On 2026-09-07 the page overview and six device captions moved into the two landing documents. Their About and Devices sections (关于我 / 设备与界面 in Chinese) supply the initial HTML, native expandable directory and active caption. At the user's request, the copy now describes the website and device functions directly. The introduction keeps the existing experience years and fields while describing the current AI focus in plain language; no ownership dates or new biographical claims were added. All four destinations remain complete. See [15](../15-seo-agent-social.md) for the local implementation and review status.

On 2026-09-11, after confirming the Kami layout and completing an original-copy restoration, the user authorized a new bilingual editorial pass based on every public blog article. The current copy presents engineering depth, sustained AI-native practice and team leadership without naming specific projects. It keeps the Microsoft Teams affiliation, all three employers, career progression, education, patent and four social links. No transfer date or new performance metrics are inferred.

The user subsequently supplied additional facts: company-wide top-100 AI token consumption, dedicated AI-native and Frontier Team transformation responsibilities spanning three organizational levels, advice to senior leadership, daily management of dozens of agents, AI software factory practice, and an extensive personal open-source portfolio and community contributions. These are now placed in the summary, Microsoft experience and Beyond Work, with people, trust and constructive human–AI collaboration emphasized in leadership. The six sections and 13 work bullets remain intact.

[18](../18-engineering-and-ai-profile.md) records the 491-article corpus, collaboration with Gemini through Herdr / pi, editorial evidence and current validation. [17](../17-kami-reading.md) records the retained Kami typography, layout, portrait treatment and label alignment, together with the preceding restoration. [16](../16-resume-refresh.md) retains earlier research. The six résumé sections and four-file publication allowlist are unchanged; research and collaboration artifacts are not published.

[05 — Interface and asset inventory](05-interface-and-assets.md) records controls, visible labels, destinations, image provenance, and current rendering discrepancies. It is an internal migration reference, not a public content entry. This README is also not published.

## Editing rules

- Preserve verified facts and complete public sections. The original verbatim migration baseline does not prohibit user-requested editorial updates; record their scope and sources in the content contract.
- Keep the two languages independent where the original wording differs. Flag inconsistent years and claims in [the content contract](../02-content-contract.md).
- A new UI may change presentation and interaction labels; it may not invent employers, dates, contacts, projects, metrics, or achievements.
- User-approved presentation edit (2026-09-05): copyright remains English in both locales; the landing location signature is “made in Beijing” in both. Chinese frontmatter reflects this preference; the extracted body prose is unchanged.
- The original photo is identity material. New crops, dithering, responsive formats, and OG images are newly produced assets; legacy CSS and illustrated decorations are not carried forward.
- Only the four explicit entries may produce public Markdown endpoints, llms.txt entries, or structured data. Never glob all docs into a site bundle.
