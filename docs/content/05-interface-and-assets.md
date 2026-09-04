# Interface and asset inventory

Status: internal migration reference. Baseline: 2026-09-05. This file must not be published as a content entry.

## Identity and images

| Existing material | Meaning to preserve | Rebuild treatment |
| --- | --- | --- |
| public/images/profile.jpeg | Original portrait of Zheng Li / 李征 | Source for fresh responsive crops, screen portrait, social cards |
| public/images/profile.webp and profile-optimized.jpg | Résumé portrait derivatives | Re-encode from original; do not inherit old presentation |
| public/images/profile-176.webp and profile-176.jpg | Landing portrait derivatives | Replace with designed screen imagery derived from the same identity |
| public/favicon.png and public/images/favicon.png | Current favicon identity | New coherent favicon and touch icon set |
| Decorative SVG lines, stars, blobs, and link icons | Presentation, no additional biographical facts | Completely redesigned |

Portrait alt text on the résumé is “Zheng Li” in English and “李征” in Chinese. Landing alt text is “Zheng Li” in English and “李征 / Zheng Li” in Chinese. Dimensions, layout, animation, and fonts are not content requirements.

## Shared destinations

| Destination | Current visible label(s) | Present on |
| --- | --- | --- |
| <https://lizheng.blog/> | lizheng.blog; Blog / 博客 | Both |
| <https://lizheng.dev/en/> and /zh/ | lizheng.dev; Résumé / 简历 | Landing, matching locale |
| <https://github.com/nocoo> | github.com/nocoo; GitHub | Both |
| <https://linkedin.com/in/nocoo> | linkedin.com/in/nocoo; LinkedIn | Both |
| <https://x.com/zhengli> | x.com/zhengli | Résumé |
| <https://patents.google.com/patent/CN103248610A> | Icon beside CN103248610 A | Résumé |

All of these current external anchors use target=_blank and rel=noopener. The résumé data contains View Patent / 查看专利, but the current template displays an icon and uses the English accessible label View Patent in both languages. Preserve the destination; localize the accessible label in the rebuild.

## Current interface strings and states

| Surface | English page | Chinese page |
| --- | --- | --- |
| Landing brand/home | lizheng.me → / | lizheng.me → / |
| Landing greeting | Hello · I'm | 你好 · 我是 |
| Landing language control | 中 / 中文 → /zh/ | EN / English → /en/ |
| Landing language accessible label | Switch to 中文 | Switch to English |
| Landing links label | // links | // 链接 |
| Landing nav accessible label | Where to find me | 链接 |
| Landing location | made in Beijing | Beijing |
| Résumé section counters | 01–06 | 01–06 |
| Résumé language control accessible label | Switch language → /zh/ | Switch language → /en/ |
| Theme actions | Switch to dark theme / Switch to light theme | 切换到深色主题 / 切换到浅色主题 |

Theme buttons reflect the current mode with aria-pressed. Stored preference takes precedence over system preference; unavailable storage or matchMedia falls back safely. Preferences are origin-scoped: lizheng.dev and lizheng.me do not currently share localStorage.

## Root routes and metadata

Both roots currently show a transient Redirecting... document and select /zh/ for a browser language beginning with zh, otherwise /en/. Without script, meta refresh falls back to /en/. The fallback sentence is “Redirecting to English or 中文...” with links to both locales.

All four pages expose a title, description, canonical URL, and en/zh/x-default alternate links. x-default targets the English page. Root canonicals point to the respective domain root. Exact page titles and descriptions are preserved in each public file's frontmatter.

The landing footer replaces {year} at runtime. On the extraction date this means © 2026 Zheng Li / © 2026 李征. The résumé script writes “© 2026 Zheng Li. All rights reserved.” in both languages. The Chinese data contains “© {year} 李征. 保留所有权利。”; the corpus keeps that intended localized value and records the existing rendering defect here.

The live HTTP capture does not execute browser scripts. Footer and theme runtime behavior above was verified by reading the current scripts; it is not claimed as a browser screenshot observation.

## Proposed labels are separate

New console labels such as ZL / PERSONAL SYSTEM, A / OPEN, B / BACK, SELECT, and START are design proposals in [05 — Landing design](../05-landing-design.md). They are not extracted personal facts. The public UI must not use the inspiration device's commercial names or logos.
