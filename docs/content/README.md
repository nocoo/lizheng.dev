# Public content corpus

Extracted on 2026-09-05 from all four live language pages, cross-checked against source at bf23331. Main prose is preserved verbatim; presentation-only HTML and SVG decoration have been removed.

## Publication allowlist

| File | Public surface | Body |
| --- | --- | --- |
| [01 — Résumé, English](01-resume-en.md) | lizheng.dev/en/ | Full résumé and social links |
| [02 — 简历，中文](02-resume-zh.md) | lizheng.dev/zh/ | 完整简历及社交链接 |
| [03 — Landing, English](03-landing-en.md) | lizheng.me/en/ | Introduction and four destinations |
| [04 — 入口页，中文](04-landing-zh.md) | lizheng.me/zh/ | 自我介绍及四个入口 |

These four files, including their frontmatter, are the future publishing source of truth. Frontmatter stores public title, description, identity, role, canonical URL, and footer information. Body Markdown stores the content to render. New renderers must use both, without displaying YAML syntax.

[05 — Interface and asset inventory](05-interface-and-assets.md) records controls, visible labels, destinations, image provenance, and current rendering discrepancies. It is an internal migration reference, not a public content entry. This README is also not published.

## Editing rules

- Preserve all facts and complete paragraphs; do not replace this corpus with summaries.
- Keep the two languages independent where the original wording differs. Flag inconsistent years and claims in [the content contract](../02-content-contract.md).
- A new UI may change presentation and interaction labels; it may not invent employers, dates, contacts, projects, metrics, or achievements.
- User-approved presentation edit (2026-09-05): copyright remains English in both locales; the landing location signature is “made in Beijing” in both. Chinese frontmatter reflects this preference; the extracted body prose is unchanged.
- The original photo is identity material. New crops, dithering, responsive formats, and OG images are newly produced assets; legacy CSS and illustrated decorations are not carried forward.
- Only the four explicit entries may produce public Markdown endpoints, llms.txt entries, or structured data. Never glob all docs into a site bundle.
