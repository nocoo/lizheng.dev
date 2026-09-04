# 11 — Release implementation

2026-09-05: both designs approved. The user explicitly authorized complete 6DQ, at least 95% logic coverage in every metric, zero lint, version maintenance, /api/live, legacy redirects, push, a major release and Cloudflare deployment. All direct dependencies must be current stable and used. Existing CI/CD is to be retained and strengthened.

## Implemented foundation

- Production entry now builds the four approved React pages from the public Markdown allowlist. The legacy UI, builder, scripts and duplicate images are retired. The original photograph is retained in assets/source/portrait.jpeg outside the public build.
- Root package.json owns the version. Both footers display a quiet version label (the user explicitly moved it away from the logo). /api/live returns status, service, surface, version, and the Cloudflare deployment ID without caching.
- Host routing, all 12 legacy blog 301 patterns, query preservation, locale roots, Markdown endpoints, sitemaps and internal asset guards share the new Worker. Language routes with and without a slash return 200; canonical URLs retain the slash.
- A strict content parser rejects wrong metadata identity, missing/reordered sections, incomplete jobs/degrees/achievements/patent, nested HTML and unsafe links. Markdown exports contain only the four allowlisted documents.
- Theme storage failure handling, keyboard navigation, handheld transitions, bounded tilt, reduced motion changes and listener disposal have covered logic modules.
- The actual local workerd serves separately built test assets. L2 uses 17046, L3 uses 27046, local design previews retain 7046. Test configs have no production routes, accounts or storage bindings. D1 storage isolation is N/A because there is no storage.

## TDD and evidence

Observed Red before implementation: all four host /api/live assertions failed (asset text or 302); four content boundary tests incorrectly resolved malicious/incomplete input; theme tests failed invalid-storage/system synchronization and aria-pressed/cleanup behavior. These assertions passed after implementation.

At this checkpoint, new application logic coverage is 100% statements/lines/functions and 99.66% branches. Coverage includes packages/**/*.ts, publishing TSX, the Markdown renderer and Worker; presentation-only page/brand/icon shells are covered by browser tests. It does not measure the removed legacy builder.

Real HTTP checks have passed for all four isolated host aliases, both language routes, actual HTML/CSS/JS/fonts/images, Markdown, metadata, GET/HEAD, internal paths, missing assets, root negotiation and all legacy 301s. Wrangler dry-run passed. OSV scanned 281 locked packages with no vulnerabilities. Full browser, gate-failure injection, CI and deployment evidence is still pending at this checkpoint.

## Dependencies and runtime

Registry checked 2026-09-05: React 19.2.8, TypeScript 7.0.2, Vite 8.2.2, Wrangler 4.129.0, Vitest/coverage 5.0.0, Biome 2.5.12, Playwright 1.63.0. Exact pins and bun.lock are maintained. gray-matter was replaced by yaml 2.9.0; redundant workers-types was removed in favor of generated Wrangler types. Security overrides were removed after the upgraded lock passed OSV. Node 26 and Bun 1.4 are the validated runtimes.

Cloudflare compatibility_date is 2026-09-04, the current UTC date at validation. Using the local Asia/Shanghai date 2026-09-05 was correctly rejected by workerd as a future date. Generated runtime types are regenerated from the actual config.

## Release and rollback

The requested /su-release X+1 means 2.1.0 → 3.0.0. Follow the local command definition: package/lock, changelog, green commit, push, v3.0.0 tag, GitHub Release, Worker deployment and a CI check after five minutes. The existing CI-success → Release flow is retained; release must use the exact CI-validated commit and artifact.

Before cutover, Wrangler authenticated successfully. The previous complete production version is `4fa4f704-e665-4f35-a08a-f646d5ffe2b7` (2026-07-02). If cutover regresses, restore it with `bunx wrangler rollback 4fa4f704-e665-4f35-a08a-f646d5ffe2b7`, then verify both sites and redirects. Do not rewrite main history.

## First-release authorization

The user explicitly approved publishing v3.0.0 before the remaining browser/performance/6DQ work is complete, then continuing that work. This changes the release sequence, not the final quality requirements. Current Chromium full-matrix checks pass, including axe (no WCAG A/AA violations), all interaction flows, no-JS and printing. WebKit is being verified; Firefox has a local hostname/proxy 502 that is being isolated. No failing browser gate is being bypassed: the existing CI did not previously include L3; it will become mandatory once the cross-browser infrastructure is verified.

The user also moved version labels into both footers and requested MADE IN BEIJING with a subtle asymmetrical breathing light on both surfaces. The light animates only opacity/transform; reduced-motion gets a static glow.

Husky now waits for all tasks and fails on any failed task. A separate temporary Git repository verified that seven injected commit/push failures are blocked and restored operations succeed. OSV and Knip are mandatory; system-installed Gitleaks is explicitly recognized as a binary, not an npm dependency.
