# Changelog

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
