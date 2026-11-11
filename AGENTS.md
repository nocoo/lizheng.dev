# Li Zheng — Résumé and Play

Bilingual résumé and interactive personal portfolio, published by one stateless Worker.
Profile: `ts-worker-web` (Bun publishing, React, Cloudflare Workers).
Human overview: [README.md](README.md). Direction: [active docs](docs/README.md); current copy/design: [18](docs/18-engineering-and-ai-profile.md), [17](docs/17-kami-reading.md), [13](docs/13-devices-journey.md). Frameworks must preserve this file. Maintain this root `AGENTS.md` as the only project handbook; do not create a `CLAUDE.md` alias, copy or import.

## Sources of Truth

This file is the contract; hooks, CI and config enforce it. Raise weaker enforcement instead of lowering the contract.

| Fact                       | Where                                                                         |
| -------------------------- | ----------------------------------------------------------------------------- |
| Human entry / architecture | [README.md](README.md), [architecture](docs/06-architecture.md)               |
| Public content             | [four allowlisted documents](docs/content/README.md)                          |
| Version / dependencies     | `package.json`, frozen `bun.lock`; bare SemVer, display `v` prefix            |
| Enforcement                | `.husky/`, `scripts/gates.ts`, `vitest.config.ts`, `.github/workflows/ci.yml` |
| Machine rules / accidents  | Global `AGENTS.md` and `rules/`; [Retrospective.md](Retrospective.md)         |

## Project Invariants

- Never open, read, search, index or summarize `docs/archive/**` unless explicitly asked for a specific historical investigation. Exclude it from routine searches; hash-only archival verification is permitted.
- Only the four public documents may enter the site or agent exports. Preserve both languages, facts, links and all six résumé sections; record discrepancies instead of silently reconciling them.
- Preserve the approved formal résumé and tactile handheld designs, responsive behavior and language/theme variants. Do not import obsolete UI/CSS/template/build code; only public facts, original portrait and legacy 301 behavior may carry forward.
- Keep the résumé portrait naturally colored, with only mild softening. Both surfaces share the orange four-square mark and Space Grotesk wordmark; résumé reading typography stays independent. The portrait remains a résumé asset.
- Keep header destinations Play (`lizheng.me`), Journal (`lizheng.blog`), Résumé (`lizheng.dev`), Portfolio (`hexly.ai`), labeled 主页 / 博客 / 简历 / 作品集 in Chinese. Destination changes update both headers, llms Related and Person `sameAs`; omit self from Related. Footers omit versions and repeated header destinations; keep copyright, reading formats and location signatures. Package version remains authoritative for `/api/live` and releases.
- Decorative labels, copyright, location signatures, Markdown and llms labels stay English in Chinese mode; localize substantive content and functional guidance. Preserve semantic HTML, keyboard access, SEO, agent access and progressive enhancement with the visual design.
- Keep exact dependencies, strict TypeScript 7 and frozen installs. Preserve working production behavior until its tested replacement is ready; HSTS preload and extra Person fields are not implicit requirements.

## Stack / Layout

| Component                     | Location / choice                                                          |
| ----------------------------- | -------------------------------------------------------------------------- |
| Résumé / portfolio            | `apps/resume/`, `apps/landing/`; React publishing and browser interactions |
| Content / rendering / quality | `packages/`, `scripts/`; Bun build and Vite development                    |
| Delivery                      | `worker/`, `wrangler.jsonc`; static assets, routing and `/api/live`        |
| Tests / analysis              | Vitest L1, Playwright HTTP L2/browser L3, Biome and TypeScript             |

Keep content, publishing, browser behavior and Worker routing separate; no database is required.

## Commands

Run from root with Bun 1.4.0 and Node ≥26 (CI: 26.12.1). Tests need no production credentials.

```bash
bun install --frozen-lockfile
bun run dev
bun run typecheck
bun run lint
bun run build
bun run test:coverage
bun run check:docs
bun run check:deps
bun run check:workflows
bun run types:check
bun run test:http
bunx playwright install chromium firefox webkit
bun run test:browser
bun run check:security
bun run check:hooks
```

Hooks need bun, node, gitleaks, osv-scanner and actionlint on PATH; a missing tool blocks the gate instead of skipping it. `test:development` remains a blocking Chromium check inside L4. `test:performance` runs in the independent daily/manual Performance lab workflow; failures remain visible but do not block publication. Run local suites sequentially with L4.
Loopback browser host mappings and trusted Caddy previews: [development](docs/12-local-development.md), [release](docs/11-release-implementation.md).

## Verification

System0 quality slots, base-ci v2026.13 in native mode. `.github/slot-status.json` declares every slot; `scripts/slot-gate.ts` (Z1) verifies each declaration against the job that ran and the tested sha; `tests/unit/quality-contract.test.ts` keeps the declaration, the workflow, the canonical check names and the pinned references in step. Every slot job is named `<ID>: <Name>` inside `quality-slots.yml`, the caller job stays `quality`, so checks render as `quality / <ID>: <Name>`. Branch protection requires only `quality / Z1: Gate`. No skipped or focused tests.

| Slot            | Phase            | Working evidence                                                                                               | Status |
| --------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| S1 Types        | commit, CI       | `bun run typecheck`, `bun run types:check`                                                                     | impl   |
| S2 Lint         | commit, CI       | `bun run lint` and static `check:docs` / `check:deps` at zero warnings                                         | impl   |
| S3 Workflow     | commit, CI       | `bun run check:workflows` (actionlint, base-ci sha pinning); CI adds yamllint                                  | impl   |
| G1 Secrets      | commit, push, CI | staged scan, per-pushed-ref scan `oid --not --remotes`, CI scans the checkout                                  | impl   |
| G2 Dependencies | push, CI         | `osv-scanner` over `bun.lock` with `osv-scanner.toml`                                                          | impl   |
| B1 Build        | commit, push, CI | `bun run build` inside the index snapshot and before budgets                                                   | impl   |
| L1 Unit         | commit, CI       | `bun run test:coverage`, statements/branches/functions/lines each ≥95%                                         | impl   |
| L2 Runtime      | —                | no workerd or pool-workers suite; Web APIs are covered by L1 units and L3 against a real wrangler build        | na     |
| L3 Integration  | push, CI         | `bun run test:http`: real wrangler artifact on Miniflare, full route and host matrix on 17046                  | impl   |
| L4 E2E          | CI               | Chromium plus `test:development` in the slot job; Firefox 1/2–2/2 and WebKit 1/4–4/4 aggregated, three engines | impl   |
| P1 Package      | —                | private package, nothing is published                                                                          | na     |
| Z1 Gate         | CI               | `bun scripts/slot-gate.ts`; also requires the jobs outside the slot list                                       | impl   |

`Release package verify` runs `check:hooks`, `check:budgets`, the wrangler dry run and the production archive extraction; it carries no slot id and Z1 requires it. The former L1.5 slot is gone: worker runtime coverage is L2, and this project declares it na.

| Hook       | Measured behavior (bun 1.4.4, node 26.13.0, Apple silicon)                                                                                                                                                                                              | Budget                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| pre-commit | Index snapshot: staged gitleaks, dependency and toolchain snapshot check, static gates, coverage, build. 4.7s cold after a frozen install, 3.4s warm                                                                                                    | ≤15s, reject above 30s      |
| pre-push   | Reads Git's stdin refs, blocks non-HEAD and absent commits, skips ref deletions without source checks, exports the pushed commit to a temporary snapshot and runs per-ref gitleaks, the dependency snapshot, L3 and budgets there. 4.1s cold, 3.3s warm | target 2.5min, ceiling 5min |

`check:hooks` proves the gates reject: it reproduces 19 failures in a temporary Git fixture, including dependency and toolchain drift, a bad pushed commit behind a clean worktree, non-HEAD refs and absent commits, and accepts a commit, a push and a deletion that must skip source checks. `check:l1-gate` proves the staged-unit-failure-behind-a-corrected-worktree case; both run in CI's release package job.

Hooks are check-only. No `--no-verify`, disabled checks, hidden failures or autofix gates; commit tests and implementation together in a green atomic commit. Work with production access pushes to `main` directly, so the `main quality gate` ruleset (id 27029540) requires only `quality / Z1: Gate` and lets the admin repository role bypass it; every other push path is checked by the hooks and by CI.

## Resources / Isolation

Dev uses `127.0.0.1:7046` behind existing résumé/portfolio Caddy hosts. Reserved test ports are 17046 for L3 and 27046 for L4, never reusing an existing server; the `l2` / `l3` identifiers inside test configs name those ports, not slots.
Test builds use `.test-dist/l2` or `l3`; Miniflare owns a fresh temporary state directory. Local `-test` names do not authorize remote test deployments.
No production or daily-dev stores, credentials or requests enter E2E. Test hosts resolve to loopback; run one suite per reserved port at a time.

## Operations / Release

Authorized releases follow [the runbook](docs/11-release-implementation.md): green gates, maintained exact dependencies, unused-dependency review and `/api/live` on both surfaces.
`bun run deploy` publishes the Worker. Successful main push CI can trigger production release. CI `workflow_dispatch` is validation-only and cannot be used as a Release source. A local commit itself does not deploy. Every CI validates the release archive with the same extraction script as production; see [pipeline evidence](docs/19-ci-stability.md).

## Retrospective

Narratives belong in [Retrospective.md](Retrospective.md), brief recurring rules here, cross-project lessons in global rules/nmem, deterministic checks in tests/hooks.

- Preserve archive exclusion and the public-content allowlist in every tooling path.
