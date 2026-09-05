# 11 — Release implementation and evidence

2026-09-05. Both designs are approved. The user authorized full 6DQ, ≥95% logic coverage, zero lint, versions, /api/live, legacy redirects, main push and Cloudflare deployment. The later instruction explicitly permits publishing v3.0.0 first and continuing hardening. This changes release order, not final quality requirements.

## Production and versioning

- Major release 2.1.0 → 3.0.0 followed the requested /su-release procedure: package/lock, changelog, green commits, push, tag, GitHub Release and Cloudflare deployment.
- [v3.0.0](https://github.com/nocoo/lizheng.dev/releases/tag/v3.0.0) is commit 25ff91866a1c544fb7a9475369e5c23fb87ee2a6. [CI 33930999181](https://github.com/nocoo/lizheng.dev/actions/runs/33930999181) passed, including a recheck at 23:56:58 UTC, more than five minutes after release.
- First deployment ID: a4d61e18-5a64-41c8-9f41-5d8dec502610. All four public hostnames subsequently passed the read-only production verifier: /api/live v3.0.0, both language pages and all applicable blog 301s.
- The first Release job correctly failed its post-deployment check because www.lizheng.dev had no public DNS record (NXDOMAIN). Added that Custom Domain and retained the existing lizheng.dev Custom Domain. Cloudflare now manages their DNS/certificates; .me retains its existing Routes. No domain name changed, no TLS validation was disabled.
- package.json is the single version source. Version text is quiet in both footers, as requested. /api/live returns status, service, surface, version and the Cloudflare deployment ID with no-store.
- The hardening and local-development follow-up is version 3.0.2. Its final CI/deployment evidence is recorded after verification, not inferred from a local commit.

## Implemented architecture

Four explicit public Markdown documents build four complete React pages. Old UI, CSS, builder and browser scripts are retired. Only public facts, the original identity photo and the legacy 301 contract/assertions carry forward. The original photo is outside the public build; all new fonts, portraits and social images are self-hosted.

The Worker handles host selection, all 12 legacy 301 patterns, query preservation, GET/HEAD, language negotiation, public Markdown, sitemaps and internal asset guards. /en, /en/, /zh and /zh/ serve the page; canonical URLs retain the slash. Hashed resources are immutable, HTML revalidates and live is never cached. CSP authorizes only self resources and the exact theme-bootstrap hash.

The parser validates identity, required metadata, all six résumé sections, jobs/degrees/achievements/patent and safe links. Nested HTML, unsafe protocols, unsupported content and arbitrary paths are rejected. Only allowlisted public documents enter HTML and agent exports. English/Chinese historical discrepancies remain explicitly recorded.

Both sites retain the approved naturally colored résumé photo, orange four-square brand/favicon and decorative English labels. Both location signatures say MADE IN BEIJING, with subtle nonlinear breathing lights and static reduced-motion glow.

## 6DQ evidence

| Dimension | Implemented gate and observed result |
| --- | --- |
| L1 | 196 tests; statements/functions/lines 100%, branches 99.67%; all thresholds ≥95%; legacy 301 logic 100% |
| L2 | Four full host matrices against actual local workerd/assets: both languages, real resources, GET/HEAD, metadata/MD, roots, 404/internal guards and all legacy 301s |
| L3 | 63 passing tests across Chromium, Firefox and WebKit; 48 language/theme/viewport combinations plus controls, keyboard, touch, reduced motion, no-JS, font/image failure and print |
| G1 | Biome zero warnings/errors, TS7 strict + noUncheckedIndexedAccess, generated types, Knip and active document checks |
| G2 | Gitleaks clean; OSV scans 341 locked packages with no issues; resource and cold-performance budgets enforced |
| D1 | Separate test Worker/config/assets/ports, preflight resource guard and outbound request allowlist; no storage, so storage isolation is N/A |

Coverage includes packages/**/*.ts, publishing TSX, the Markdown renderer and Worker. Presentation shells and tiny entry wiring are exercised through browsers; behavior lives in covered content/routing/theme/handheld/résumé modules. The retired builder is absent from coverage. Browser errors and axe WCAG A/AA violations are zero in the tested matrix.

Observed Red before implementation: four host live assertions, four malicious/incomplete content cases, invalid-storage/system synchronization and aria/cleanup cases. The follow-up first exposed résumé teardown returning undefined and missing IntersectionObserver throwing; both behavior failures now pass after extraction and fallback implementation.

Husky pre-commit waits for staged secrets, G1, L1 and build. Pre-push waits for actual L2, G2 and size budgets. A real temporary Git repository with real Husky blocked all 17 injected failures: nested lint/types/generated types/deps/docs, L1/build/secrets, HTTP, isolation, security/budgets and missing/failed scanners. Restored commit/push passed. No hooks or thresholds were bypassed.

## Browser and performance artifacts

Sixteen Chromium full-page baseline images in tests/browser/snapshots/darwin cover both sites, languages, themes and viewports. A subsequent comparison run passed all 21 Chromium tests without updating snapshots. Only the dynamic footer version is masked. Stable snapshots pause decoration; ordinary behavioral/performance checks retain normal motion. CI uses macos-26 arm64. Its system CJK font revision differs from local macOS, so reviewed CI variants are stored in darwin-ci; screenshot thresholds remain unchanged. Explicit loopback host entries keep test DNS deterministic. Linux is independently used for HTTP, static/unit/security and production artifact jobs.

CI uploads screenshot diffs, failed-run trace/video, axe results and performance raw samples. The browser job is mandatory before production artifact creation. Firefox explicitly bypasses proxies for its loopback test hostnames. Development remains on 7046; L2 and L3 use 17046 and 27046 with their own assets and temporary state. External navigation is intercepted; redirects are never followed to the blog in tests.

Cold performance uses Chromium, 4× CPU throttling, 1.6 Mbps down / 0.75 Mbps up, 150 ms latency, new context/cache per run, normal motion, three samples per case. [Raw samples](evidence/2026-09-05-performance.json) are retained. Local medians:

| Surface / width | LCP | CLS | Maximum tested interaction duration |
| --- | --- | --- | --- |
| Résumé / 390 | 476 ms | 0.04372 | 32 ms |
| Résumé / 1440 | 492 ms | 0.00145 | 32 ms |
| Handheld / 390 | 908 ms | 0.00046 | 40 ms |
| Handheld / 1440 | 924 ms | 0.00049 | 48 ms |

All pass the unchanged 2500 ms / 0.05 / 200 ms budgets. No >50 ms long tasks were reported in these local samples. Event Timing measures the tested actions in a lab; it is not a claim about real-user INP. CI measures its own three samples and preserves them as artifacts.

Compressed production resources: résumé JS 763 bytes, CSS 3778 bytes, fonts 132240 bytes, imagery 25278 bytes; total ≤167039 bytes. Handheld JS 65237 bytes, CSS 6664 bytes, fonts 53820 bytes, imagery 984 bytes; total ≤130251 bytes. The size gate traverses imported assets rather than counting only entry files.

## Dependency and release pipeline

All 25 direct dependencies were rechecked against registry latest on 2026-09-05 and matched: React 19.2.8, TypeScript 7.0.2, Vite 8.2.2, Wrangler 4.129.0, Vitest/coverage 5.0.0, Biome 2.5.12, Playwright 1.63.0, Knip 6.34.0 and other exact pins. gray-matter and redundant workers-types were removed; yaml 2.9.0 and generated Wrangler types replace them. No unused dependencies or security override suppressions remain. Node 26 and Bun 1.4 are validated.

The existing reusable base-ci quality job and CI-success → Release flow are preserved. Successful main CI uploads worker-{sha}, containing built assets and a bundled Worker. Release verifies the CI run/repository/branch/event, checks out that exact SHA, downloads its artifact, deploys with --no-bundle and verifies all four public hosts. Manual deployment also requires a successful main CI run ID. Production deployments are serialized.

Before v3 cutover, the previous complete deployment was 4fa4f704-e665-4f35-a08a-f646d5ffe2b7. Restore it, if required, with bunx wrangler rollback 4fa4f704-e665-4f35-a08a-f646d5ffe2b7 and recheck both surfaces and redirects. Normal follow-up releases can roll back to the recorded v3.0.0 deployment. Keep Custom Domains configured and do not rewrite main history.

## Scope of evidence

Browser and touch checks use automated desktop engines and emulated viewports. Physical iOS/Android devices and real-user Web Vitals are not claimed as verified. There is no database or external write path. The two local Caddy HTTPS previews and their live endpoints also pass with the trusted local mkcert CA.

The v3.0.1 CI correctly blocked deployment on eight platform-font snapshot differences and ten WebKit connection failures. The fonts were reviewed and CI baselines added; test-only loopback mappings made DNS deterministic. A subsequent run exposed a more specific cause of connection failures: Wrangler exited during the suite, followed by an esbuild watcher deadlock. CI 33932806478 passed all Chromium/Firefox tests and visual comparisons before the runtime exited during WebKit (51 passed, 12 failed). Browser/HTTP tests now bundle the isolated Worker once and run that fixed artifact with --no-bundle, retaining actual workerd/assets and all assertions. Startup output and Wrangler logs are preserved, and an unexpected runtime exit fails explicitly. The v3.0.2 release was rechecked at 00:25:11 UTC, more than five minutes after publication; CI was still running and subsequently failed as described.

CI 33933164855 confirmed that prebundling removed the esbuild deadlock but the shared macOS runtime still exited after 57 tests. The three engines now run on separate macOS runners, each with its own workerd process and evidence artifact; all 63 assertions remain mandatory. Chromium's job also runs the development and performance suites sequentially. This bounds resource accumulation across engines without changing coverage, visual or performance thresholds.

The v3.0.2 follow-up also adds eight local-development/HMR regression checks (see 12). Its final CI and deployment must be verified before declaring completion.
