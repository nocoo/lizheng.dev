# Li Zheng — Résumé and Play

Bilingual résumé and interactive personal portfolio, published by one stateless Worker.
Profile: `ts-worker-web` (Bun publishing, React, Cloudflare Workers).
Human overview: [README.md](README.md). Direction: [active docs](docs/README.md); current copy/design: [18](docs/18-engineering-and-ai-profile.md), [17](docs/17-kami-reading.md), [13](docs/13-devices-journey.md). Frameworks must preserve this file. Maintain this root `AGENTS.md` as the only project handbook; do not create a `CLAUDE.md` alias, copy or import.

## Sources of Truth

This file is the contract; hooks, CI and config enforce it. Raise weaker enforcement instead of lowering the contract.

| Fact | Where |
|---|---|
| Human entry / architecture | [README.md](README.md), [architecture](docs/06-architecture.md) |
| Public content | [four allowlisted documents](docs/content/README.md) |
| Version / dependencies | `package.json`, frozen `bun.lock`; bare SemVer, display `v` prefix |
| Enforcement | `.husky/`, `scripts/gates.ts`, `vitest.config.ts`, `.github/workflows/ci.yml` |
| Machine rules / accidents | Global `AGENTS.md` and `rules/`; [Retrospective.md](Retrospective.md) |

## Project Invariants

- Never open, read, search, index or summarize `docs/archive/**` unless explicitly asked for a specific historical investigation. Exclude it from routine searches; hash-only archival verification is permitted.
- Only the four public documents may enter the site or agent exports. Preserve both languages, facts, links and all six résumé sections; record discrepancies instead of silently reconciling them.
- Preserve the approved formal résumé and tactile handheld designs, responsive behavior and language/theme variants. Do not import obsolete UI/CSS/template/build code; only public facts, original portrait and legacy 301 behavior may carry forward.
- Keep the résumé portrait naturally colored, with only mild softening. Both surfaces share the orange four-square mark and Space Grotesk wordmark; résumé reading typography stays independent. The portrait remains a résumé asset.
- Keep destinations Play (`lizheng.me`), Journal (`lizheng.blog`), Résumé (`lizheng.dev`), Portfolio (`hexly.ai`), labeled 主页 / 博客 / 简历 / 作品集 in Chinese. Changes update both headers/footers, llms Related and Person `sameAs`; omit self from Related.
- Decorative labels, copyright, location signatures, Markdown and llms labels stay English in Chinese mode; localize substantive content and functional guidance. Preserve semantic HTML, keyboard access, SEO, agent access and progressive enhancement with the visual design.
- Keep exact dependencies, strict TypeScript 7 and frozen installs. Preserve working production behavior until its tested replacement is ready; HSTS preload and extra Person fields are not implicit requirements.

## Stack / Layout

| Component | Location / choice |
|---|---|
| Résumé / portfolio | `apps/resume/`, `apps/landing/`; React publishing and browser interactions |
| Content / rendering / quality | `packages/`, `scripts/`; Bun build and Vite development |
| Delivery | `worker/`, `wrangler.jsonc`; static assets, routing and `/api/live` |
| Tests / analysis | Vitest L1, Playwright HTTP L2/browser L3, Biome and TypeScript |

Keep content, publishing, browser behavior and Worker routing separate; no database is required.

## Commands

Run from root with Bun 1.4.0 and Node ≥26 (CI: 26.8.1). Tests need no production credentials.

```bash
bun install --frozen-lockfile
bun run dev
bun run typecheck
bun run lint
bun run build
bun run test:coverage
bun run check:docs
bun run check:deps
bun run types:check
bun run test:http
bunx playwright install chromium firefox webkit
bun run test:browser
bun run check:security
bun run check:hooks
```

G2 needs gitleaks and osv-scanner on PATH. `test:development` and `test:performance` are additional Chromium suites; run sequentially with L3.
Loopback browser host mappings and trusted Caddy previews: [development](docs/12-local-development.md), [release](docs/11-release-implementation.md).

## Verification

6DQ = L1/L2/L3 + G2 + D1 isolation; the former G1 dimension was merged into L1 on 2026-09-21. Status: `enforced`, `planned`, `manual`, `N/A`. No skipped/focused tests.

| Piece | Required proof and current reality | Status | Evidence |
|---|---|---|---|
| L1 (incl. former G1 static) | Statements/branches/functions/lines each ≥95% over configured content/publishing/Worker logic; strict types and lint/format with zero errors/warnings; generated types and docs/dependency consistency | planned | Achieved subchecks run today: `vitest.config.ts` coverage plus `check:static` (types, lint, docs/dependency consistency) in pre-commit and CI. Full unified L1 stays planned: checks run on working files rather than the index snapshot, and <30s timing plus isolated rejection proof are unverified |
| L2 | Real HTTP for public routes/methods and both hosts; keep the full route matrix current | enforced | `tests/http/`, `playwright.http.config.ts`; pre-push and CI |
| L3 | Bilingual/theme/device journeys, visual regression and accessibility in three browser engines | enforced | `tests/browser/`, `playwright.config.ts`; CI matrix |
| G2 | Required dependency and secret scanners; missing binary fails | enforced | `check:security`, gitleaks + OSV; push-ref gap below |
| D1 | Local runtime, per-run temporary state, loopback requests and forbidden production bindings; SQLite marker N/A for stateless site | enforced | `scripts/test-server.ts`, `packages/quality/isolation.ts` |
| Build | Publishable assets and fixed Worker artifact | enforced | Pre-commit build; CI packaging and budgets |
| Docs | Update active index and numbered documents with behavior changes | manual | [Documentation index](docs/README.md), diff review |

| Hook | Actual behavior | Required follow-up |
|---|---|---|
| pre-commit | Parallel staged-secret scan, static checks, L1 and build on working files | Index snapshot for every check; target <30s |
| pre-push | Parallel L2, G2 and budgets; secrets scanned over `origin/main..HEAD` | Read stdin push refs for every pushed commit; target <3min |

Hooks are check-only. No `--no-verify`, disabled checks, hidden failures or autofix gates; commit tests and implementation together in a green atomic commit.

## Resources / Isolation

Dev uses `127.0.0.1:7046` behind existing résumé/portfolio Caddy hosts. L2: 17046; L3: 27046, never reusing an existing server.
Test builds use `.test-dist/l2` or `l3`; Miniflare owns a fresh temporary state directory. Local `-test` names do not authorize remote test deployments.
No production or daily-dev stores, credentials or requests enter E2E. Test hosts resolve to loopback; run one suite per reserved port at a time.

## Operations / Release

Authorized releases follow [the runbook](docs/11-release-implementation.md): green gates, maintained exact dependencies, unused-dependency review and `/api/live` on both surfaces.
`bun run deploy` publishes the Worker. Main CI success can trigger the existing production release workflow; a local commit itself does not deploy.

## Retrospective

Narratives belong in [Retrospective.md](Retrospective.md), brief recurring rules here, cross-project lessons in global rules/nmem, deterministic checks in tests/hooks.
- Preserve archive exclusion and the public-content allowlist in every tooling path.
