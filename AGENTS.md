# Li Zheng — Résumé and Play

Bilingual résumé (`lizheng.dev`) and interactive portfolio (`lizheng.me`) served by one stateless Cloudflare Worker (Bun, React, Vite, TS 7).
Docs: [README](README.md) · [Index](docs/README.md) · [Arch](docs/06-architecture.md) · [Content](docs/content/README.md) · [Quality](docs/07-quality-and-tdd.md) · [Release](docs/11-release-implementation.md) · [CI](docs/19-ci-stability.md) · [Retrospective](Retrospective.md)

This file is the contract; raise weaker enforcement rather than lowering it. Current specs: [18](docs/18-engineering-and-ai-profile.md), [17](docs/17-kami-reading.md), [14](docs/14-connected-surfaces.md), [13](docs/13-devices-journey.md), [15](docs/15-seo-agent-social.md).

## Commands

Run from root with Bun 1.4.0 and Node >=26 (CI: 26.12.1; browser containers: 26.13.1). Tests need no production credentials.

```sh
bun install --frozen-lockfile
bun run dev  # Vite SSR/HMR on 127.0.0.1:7046
bun run check:static  # S1/S2/S3: lint, typecheck, types:check, check:deps, check:docs, check:workflows
bun run test:coverage  # L1 unit tests (>=80% statements/branches/functions/lines)
bun run build  # B1 production assets + Worker
bun run test:http  # L3 real wrangler artifact on Miniflare (:17046)
bunx playwright install chromium
bun run test:browser --project=chromium --workers=3  # L4 blocking Chromium browser/a11y/visual (:27046)
bun run test:development  # Blocking Chromium HMR/preview suite inside L4
bun run test:visual:update:linux  # Linux CI visual baselines in pinned Docker image
bun run check:security  # Local G1 + G2 scan
bun run check:hooks  # Local hook fault-injection
```

- Hooks require `bun`, `node`, `gitleaks`, `osv-scanner` and `actionlint` on `PATH`; missing tools fail closed.
- Run local suites sequentially with L4; `test:performance` and Firefox/WebKit `browser-e2e` shards run in the non-blocking daily/manual extended workflow.
- Loopback hosts, Caddy HTTPS previews and Linux container image/font settings: [12](docs/12-local-development.md), [11](docs/11-release-implementation.md).

## Invariants

- Never open, read, search, index or summarize `docs/archive/**` unless asked for a historical investigation; exclude it from every tooling path (hash-only verification permitted).
- Only the [four public documents](docs/content/README.md) enter site/agent exports; preserve both locales, facts, links and all six résumé sections—record discrepancies instead of reconciling them.
- Keep content, publishing, browser behavior and Worker routing separate across `apps/resume/`, `apps/landing/`, `packages/`, `scripts/` and `worker/`; no database.
- Preserve approved résumé/handheld designs and locale/theme variants; never import obsolete UI/CSS/template/build code—carry forward only public facts, original portrait and legacy 301s.
- Keep the portrait résumé-only and naturally colored (mild softening only); surfaces share the orange four-square mark and Space Grotesk wordmark, while résumé reading typography stays independent.
- Header links: Play (`lizheng.me`), Journal (`lizheng.blog`), Résumé (`lizheng.dev`), Portfolio (`hexly.ai`) (主页/博客/简历/作品集); sync edits across headers, `llms.txt` Related (omit self) and `Person.sameAs`.
- Footers keep copyright, reading formats and location signatures, omitting versions and repeated header links; `package.json` (bare SemVer, `v` display prefix) owns `/api/live` and release versions.
- Keep decorative, copyright, location, Markdown and `llms.txt` labels English in Chinese mode; localize substantive copy and guidance. Preserve semantic HTML, keyboard a11y, SEO, agent and no-JS access.
- Keep exact dependencies, strict TS 7 and frozen installs; keep working production behavior until its tested replacement is ready. HSTS preload and extra `Person` fields are not implicit requirements.
- Dev uses `127.0.0.1:7046` behind Caddy; L3 reserves `17046` and L4 reserves `27046` without reusing servers. Test config names `l2`/`l3` (`.test-dist/l2`, `l3`) label ports, not slots; one suite per port.
- Miniflare uses a fresh temp dir, test hosts resolve to loopback, and no prod/dev stores or credentials enter E2E; local `-test` names never authorize remote deployments.
- Releases follow [11](docs/11-release-implementation.md) (`bun run deploy` or green `main` push CI); local commits never deploy, `workflow_dispatch` is validation-only, and CI runs `scripts/unpack-release.sh`.

## Quality & Local Gates

Follows `system1-quality`; CI slots and pinned `base-ci` refs live in `.github/workflows/quality-slots.yml` and `.github/slot-status.json` (`quality / Z1: Gate` required on `main`, ruleset `27029540`, admin bypass). Status vocabulary: `enforced`, `planned`, `manual`, `N/A`.

- **Exceptions / extra jobs**: `L2 Runtime` is `N/A` (covered by L1 and L3). `P1 Package` verifies budgets, `wrangler deploy --dry-run`, and `release-artifact.tgz` pack/unpack; Firefox/WebKit `browser-e2e` shards run non-blocking in `.github/workflows/extended.yml`.
- **Contract parity**: `tests/unit/quality-contract.test.ts` keeps `.github/slot-status.json`, workflow jobs, check names and pinned references in step; no skipped or focused tests.
- **Local hooks**: `bun run prepare` (`.husky/`, check-only, no autofix); `pre-commit` (`scripts/pre-commit-l1.sh`) checks staged index snapshot (`G1`, deps, `S1`/`S2`/`S3`, `L1` >=80%, `B1`).
- **Pre-push**: `scripts/gates.ts pre-push` pins stdin OIDs (rejecting non-HEAD/absent commits, skipping deletions) and runs dep snapshot, per-ref `G1`, `G2`, `L3` and `check:budgets` on the exported commit.

## Retrospective

Record incident narratives in [Retrospective.md](Retrospective.md); promote recurring project constraints to `Invariants` above and enforceable safeguards to tests/hooks.
