# Changelog

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
