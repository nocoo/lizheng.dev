# Journal, Play and Résumé

2026-09-06. A common frame for `lizheng.blog`, `lizheng.me` and `lizheng.dev`, following the public Journal design in the sibling Firefly repository.

## Navigation and layout

`packages/experience/SurfaceChrome.tsx` owns the me/dev header and compact footer. Both display Journal / Play / Résumé in that order, with the current surface identified by `aria-current`. Cross-links between me and dev retain the current locale. The shared wordmark, monospaced navigation, small terracotta current indicator, round theme control, fine rules and location signature follow Firefly.

The frame is at most 1500px wide. The résumé uses Firefly's 272px sidebar (228px at 1100px) and 1060px content column; prose retains its readable 72ch measure. Header, content and footer gutters follow the journal's breakpoints. At 640px and below the header has two rows, keeping all three destinations visible. Native scrolling accounts for the sticky header; section links and the skip link remain usable without JavaScript.

The footer keeps the brand, copyright/version, three destinations and Beijing signature. Play merges these into one compact band, without the second divider, closing caption or back-to-top action; Résumé retains its back-to-top link. Firefly retains its fuller journal directories and closing invitation. Public biography, résumé sections, metadata and content exports are unchanged.

Play uses a 2:3 desktop grid for the introduction and device area, with matching top and bottom padding at every breakpoint. Narrow screens keep the stacked layout. The public CJK font subset includes the shared chrome and current theme guidance, avoiding system-font substitutions in these strings.

The existing HTTPS development origins link to each other, including Firefly. Production builds link to the public domains. No deployment configuration or publishing trigger is changed.

## Theme preference

The preference is **system → light → dark → system**, starting with system when nothing valid has been saved. The resolved light/dark palette is separate from that preference. Returning to system resumes live OS updates; explicit choices ignore subsequent OS changes. Existing `zl-theme=light` and `zl-theme=dark` values continue to work. Preferences remain local to each origin.

The monitor, sun and moon represent the current preference. The accessible name and tooltip announce both the current state and next action in the page's locale. A binary `aria-pressed` is not used for this three-state action. The inline bootstrap applies the preference before paint, with the exact CSP hash still generated from the same script. Denied storage preserves an in-memory choice. Listeners are removed on teardown.

## Six keepsake families

| Me device | Dev portrait keepsake | Blog writing metaphor |
| --- | --- | --- |
| Game Boy | Existing orange/ivory ball, metal paperclip and pixel spark | Spiral Pokédex field notebook and the same ball |
| Nokia 5300 | Closed slider phone and wired earbuds | Saved-message slips, closed phone and pencil |
| Macintosh Plus | Upright miniature Macintosh and floppy disk | Continuous-feed first draft, floppy and pencil |
| iPod Classic | Pearlescent player and wired earbuds | Voice/lyric notebook, player and earbuds |
| Garmin Edge 540 | Cycle computer and half-finger glove | Folded route journal, cycle computer and pencil |
| Honda motorcycle | Front-facing helmet and key | Navigation roadbook, helmet and key |

The twelve SVGs are original code-drawn artwork with consistent paper, ivory, olive, terracotta and brushed-metal materials. They use transparent backgrounds, bounded soft shadows and deliberate space around each composition. The résumé portrait stays naturally colored; decoration is confined to its edges and hidden in print. Blog artwork uses notes and recording as its main subject, rather than a cartridge.

Generate both asset sets from this repository:

```sh
bun scripts/create-keepsakes.ts ../firefly/public/journal-keepsakes
```

The résumé assets live in `design-public/design-assets/keepsakes`. Firefly commits its own six generated assets in `public/journal-keepsakes`; neither repository imports the other at build time or in production. No runtime dependency was added.

The document owns one random scene. Theme changes, reading, resize, HMR and Firefly client navigation do not redraw the selection; a new document can choose again. No scene is stored across refreshes. The static résumé renders the Game Boy family as a useful no-JavaScript fallback. Firefly chooses its scene on the server for each document request and passes that same choice through hydration, so no default image appears before the selected image. Fixed image dimensions prevent layout shifts. All decorative images are hidden from assistive technology and accept no input.

The me device gallery retains its autoplay and controls. Arrival now follows a single `cubic-bezier(0.16, 1, 0.3, 1)` curve over 950ms. Translation, rotation and scale approach the final pose without crossing it; the former 58% and 82% overshoot keyframes are removed. Lighting and accessory choreography continue around the smooth stop.

## Verification

The new theme tests failed against the binary implementation before the three-state controller was added. Scene tests initially failed without the document-scoped selector, then passed for all six choices, remount stability and invalid identifiers. Tests cover stored preferences, live system changes, localized actions, denied storage, bootstrap/CSP and listener cleanup.

The browser checks exercise all three navigation links from 320px to 1920px, both locales, all six portrait decorations, theme cycling, no-JavaScript reading and print. The first full run caught a 2px transparent-image overflow at narrow widths; additional space around the portrait fixes it without clipping artwork. The existing iPod gesture now scrolls the whole device into view before dragging, because the new sticky header can otherwise cover its starting point; its gesture and selection assertions are unchanged.

Screenshots retain the existing 0.001 comparison threshold and existing masks. Deterministic document choices make the résumé snapshots reproducible without hiding the new artwork. Local and CI image variants remain separately reviewed because the runner's résumé CJK system font differs. Me's self-hosted fonts continue to make its device baselines portable between these two macOS environments.

The arrival regression samples the browser's actual interpolated transforms over the final half of the animation. It failed against the former keyframes with a −12.6553px horizontal overshoot, then passed in Chromium, Firefox and WebKit with the new curve. It also checks that equal-time travel distances decrease toward the destination. All 21 targeted motion/keepsake checks passed after the final feedback.

A control stability regression reproduced 1.27–1.32px of continued movement after the pointer entered a button during an unfinished tilt, failing in all three engines. The shell now pauses only its running transform transition at the current pose while the pointer is over a control or dragging, then resumes on exit; lighting, entrance animation and unrelated transitions remain independent. The regression verifies steady hit areas, a real delayed pointer click and the return to rest for Nokia and Macintosh. All nine targeted browser checks passed, including the two previously intermittent mobile control cases. Unit coverage includes preserving already-paused animations and releasing owned transitions on cleanup.

Final layout measurements cover both locales at 320, 390, 820, 1100, 1440 and 1920px: one footer band, no back-to-top action on Play, no horizontal page overflow, equal vertical padding, and a 2:3 grid above the stacked breakpoint. All eight Play page baselines and twenty desktop device crops were visually reviewed at the unchanged comparison threshold.

Final local evidence: 233 unit tests; 100% statements/functions/lines and 99.56% branches; G1 with no errors or warnings; and all 246 browser cases across Chromium, Firefox and WebKit, with no failures, retries or skips. All eight isolated development checks passed. Six cold-load performance cases passed with normal motion, 4× CPU throttling, 1.6Mbps bandwidth and 150ms latency: median LCP 492–1048ms, CLS at most 0.01874, and measured interaction durations at most 64ms. HTTP matrices, dependency/security scans and asset budgets also remain mandatory in the pre-push gate and CI.

The user has authorized `/su-release Z+1`: me/dev v3.1.1 and Firefly v2.12.1. The [me/dev release record](https://github.com/nocoo/lizheng.dev/releases/tag/v3.1.1) records final main CI, validated-artifact deployment and the mandatory five-minute follow-up as they complete. Firefly v2.12.1 has passed its CI, Railway deployment and five-minute production check; the public header no longer contains an administrator shortcut.
