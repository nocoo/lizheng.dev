# Changelog

## [3.1.4] - 2026-09-06

- Add a shared `Portfolio` header link to `https://hexly.ai` on me and dev, matching the blog and keeping all four links visible on narrow screens.

## [3.1.3] - 2026-09-06

- Keep cached device DOM and state out of layout with `display: none`, avoiding Firefox's repeated deferred-style work while preserving responsive controls and the full visible-device animation.
- Deliver the approved connected-surface layout and rendering improvements after v3.1.2 passed performance checks but was blocked by Firefox browser-test timeouts.

## [3.1.2] - 2026-09-06

- Defer rendering of cached, invisible devices while retaining their prepared content and state; restore full rendering during entrance and exit animations.
- Avoid invalidating the page palette when restoring an already applied theme or moving between automatic and explicit preferences with the same resolved color scheme.
- Restore Play's immediate page scrolling when shared styles load later, keeping native buttons steady between pointer press and release.
- Deliver the approved connected-surface improvements from v3.1.1 after its production deployment was blocked by the interaction-performance gate.

## [3.1.1] - 2026-09-06

- Unify the Journal / Play / Résumé header and cross-surface navigation with Firefly, preserving the current language between me and dev.
- Add system / light / dark theme preferences, defaulting to the live system setting, with localized controls and first-paint theme initialization.
- Align the shared frame, content widths, typography and footer details with the blog while retaining the résumé's readable text measure and print layout.
- Add six original keepsake families around the résumé portrait, with matching writing-themed blog artwork; each document keeps its chosen scene through navigation, theme changes and resizing.
- Merge Play's footer into one compact band, remove Back to top and the closing caption, use a 2:3 introduction/device grid, and balance the top and bottom content padding.
- Make device arrivals decelerate to a smooth stop without rebound; hold unfinished pointer tilt over native controls so their hit areas stay steady during interaction.
- Extend the public CJK font subset and refresh reviewed visual baselines, retaining the existing accessibility, screenshot and performance gates.

## [3.1.0] - 2026-09-06

- Turn the personal page into six interactive chapters: Game Boy, Nokia 5300, Macintosh Plus, iPod Classic, Garmin Edge 540 and Honda Africa Twin instruments, with device-specific screens and physical controls.
- Add a clickable chapter rail, sequential 12-second autoplay on by default, explicit playback and pauses for reading, keyboard focus, hidden pages and offscreen scenes; pointer selection resumes naturally.
- Strengthen pointer tilt to ±6° and add nonlinear depth transitions, responsive lighting and immediate reduced-motion switching.
- Keep small device controls steady under the pointer and during click-wheel drags; prepare scenes during browser idle time and reuse their layouts for faster switching.
- Separate keyboard navigation into up/down for screen menus and left/right for devices, with a left-side legend and restrained native focus indicators.
- Make the Nokia slider and iPod click wheel functional; preserve the same public profile and four real destinations on every screen.
- Add wired earbuds with aligned cable joins, floppy disks, matching half-finger cycling gloves and a side-profile riding helmet; straighten the Macintosh, inset the iPod Hold switch, conceal the Garmin rear mount and let stage shadows fade naturally above the chapter rail.
- Smooth the iPod face gradient; let transition light and animated accessories extend beyond the stage without a hard clipping edge or horizontal page scrolling.
- Animate the Honda's synchronized speed, gear and RPM displays in response to navigation, with gradual deceleration and delayed neutral; enrich the bilingual introduction about the objects that stay with us.
- Stabilize Chinese screen typography with a self-hosted Noto Sans SC subset; load the gallery styles before JavaScript in local development.
- Add the shared collectible decoration beside the résumé portrait, with matching light/dark and mobile treatments and a clean print view.
- Preserve HTML through the Cloudflare edge so its automatically injected analytics script no longer conflicts with the site's self-hosted content security policy.

## [3.0.3] - 2026-09-05

- Add original adventure-game decorations around the handheld: a shaded ember-and-ivory capsule ball, pixel sparkles and a grass motif, without brand names or character assets.
- Adapt placement for mobile and dark mode; keep decorations outside navigation and controls, with a brief entrance and static reduced-motion presentation.

## [3.0.2] - 2026-09-05

- Eliminate unstyled local refreshes by loading preview CSS with the initial HTML; warm Vite/React entry modules.
- Preserve CSS/React hot-edit state and refresh public Markdown and server-rendered résumé templates, retaining theme and reading position.
- Add eight isolated development regressions to CI; use reviewed runner-specific CJK snapshots and explicit loopback host mappings.
- Keep generated build/test files out of preview refreshes; give each CI browser engine its own runner and fixed Worker artifact, with retained runtime diagnostics.

## [3.0.1] - 2026-09-05

- Provision both résumé hosts as Cloudflare Custom Domains, including the previously missing www DNS record and managed certificate.
- Make résumé navigation/print adapters disposable and resilient when IntersectionObserver is unavailable.
- Require Chromium, Firefox and WebKit, 16 visual baselines, axe and three-sample throttled performance checks before producing deployable CI artifacts.
- Verify 17 Git-hook failure paths; record 196 passing unit tests, ≥99.67% logic coverage, 63 browser checks and current dependency/security evidence.

## 3.0.0 — 2026-09-05

- Rebuild both sites from public Markdown: a bilingual editorial résumé and an interactive handheld portfolio, each with light/dark themes and responsive layouts.
- Share the orange four-square brand and favicon, preserve natural portrait color, and add quiet footer versions and MADE IN BEIJING breathing indicators.
- Preserve all legacy blog 301 redirects, add /api/live, canonical/hreflang/structured data, public Markdown and agent metadata.
- Replace the old build with React 19, Vite 8, TypeScript 7 and a current Cloudflare Worker; update and audit all dependencies.
- Enforce 95%+ logic coverage, zero lint, real HTTP integration, dependency/secrets scans, size budgets and isolated Husky gates. Preserve CI-triggered deployment using the validated Worker/assets artifact.
- Chromium and WebKit full experience matrices pass. Further Firefox infrastructure, performance baselines and mandatory browser CI are continuing after this first release, as authorized.

All notable changes to this project are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/), and adheres to [Semantic Versioning](https://semver.org/).

## [2.1.0] - 2026-06-24

### Added

- Cover-style visual system for the résumé: OKLch paper-white palette with a tomato accent, Instrument Serif display type, and a subtle grid + soft-blob + sparse-star background flourish.
- Dark mode for the Cover portal (`lizheng.me`) with flash-guard initialization and a top-right theme toggle button.
- Numbered sections (01–06) and a hand-drawn squiggle underline on the résumé tagline.

### Changed

- Résumé and Cover avatars: dropped the border, replaced with a soft drop shadow (dark mode gets a deeper shadow + subtle ring).
- Migrated résumé palette to OKLch; raised `--accent` / `--text-muted` contrast to WCAG AA (≥ 4.5:1).

### Fixed

- Theme init and toggle now tolerate disabled or sandboxed storage and `matchMedia` (wrapped in `try/catch`).
- Theme toggle exposes state to assistive tech via `aria-pressed` and a dynamic label (English / 中文).

### Removed

- Dead `.cover-*` rules from the legacy stylesheet.
