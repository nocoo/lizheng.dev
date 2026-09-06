# 11 — Release implementation and evidence

2026-09-05. Both designs are approved. The user authorized full 6DQ, ≥95% logic coverage, zero lint, versions, /api/live, legacy redirects, main push and Cloudflare deployment. The later instruction explicitly permits publishing v3.0.0 first and continuing hardening. This changes release order, not final quality requirements.

## SEO, agents and social previews — v3.1.5

On 2026-09-07 the user reviewed all four share images in Chrome and authorized `/su-release Z+1`: v3.1.4 → v3.1.5. The release includes the approved bilingual copy, separate résumé/personal-page metadata and images, complete public Markdown and llms.txt discovery, semantic text fixes and unknown-path 404 behavior. All twelve legacy blog 301 patterns remain covered. Production keeps indexing and link following enabled; development and isolated tests retain only noindex.

The reviewed implementation is `a952cb1`. Its local commit hooks passed static checks, the 254 unit tests with 100% statements/functions/lines and 99.41% branches, and the production build. [15 — SEO, agents and social previews](15-seo-agent-social.md) records the full local browser, development, HTTP, performance and image review evidence. Package version is the single source for both footers and all live endpoints.

Publication follows the existing main CI → validated Worker/assets artifact → production workflow. The [v3.1.5 release record](https://github.com/nocoo/lizheng.dev/releases/tag/v3.1.5) records the final source commit, CI and deployment runs, production metadata/image checks and mandatory five-minute recheck. Before publication all four public hostnames returned v3.1.4 with deployment `e928def1-0d04-4d7d-89bb-9f431b360f08`; this is the rollback reference.

The Cloudflare 403 / 1010 response to the default Python user agent is still unresolved: available credentials cannot read the relevant BIC setting or WAF rulesets, so no edge rule has been applied. Social-platform cache refreshes require separate evidence and are not implied by publishing the new metadata.

## Connected surfaces follow-up — v3.1.1 / v3.1.2 / v3.1.3

The authorized patch release connects Journal, Play and Résumé through a common header, automatic/light/dark themes, aligned widths and six keepsake families. Play uses a single footer band, a 2:3 introduction/device grid and equal vertical padding. Device arrivals decelerate smoothly, and an unfinished pointer tilt pauses over controls to keep hit areas steady. [14](14-connected-surfaces.md) records the final local evidence and the shared Firefly implementation.

The [v3.1.1 CI](https://github.com/nocoo/lizheng.dev/actions/runs/34014479578) passed all 246 browser cases, development checks and quality gates except the desktop English Play interaction case: its median was 208ms against the unchanged 200ms limit. Artifact packaging and deployment were correctly blocked. The published tag remains unchanged.

The v3.1.2 follow-up avoided redundant root palette writes, restored Play's immediate scrolling and deferred rendering of cached scenes. All 249 local browser cases passed. Its [main CI](https://github.com/nocoo/lizheng.dev/actions/runs/34016706524) passed the performance gate, Chromium and WebKit, but Firefox recorded 12 browser-test timeouts and blocked deployment. The five-minute check confirmed healthy production on v3.1.0. Its published tag also remains unchanged.

The authorized v3.1.3 follow-up keeps cached scenes out of layout with `display: none`, retaining the DOM and state while avoiding Firefox's deferred-style overhead. Visible devices retain their full entrance/exit motion and unclipped effects. The [v3.1.3 release record](https://github.com/nocoo/lizheng.dev/releases/tag/v3.1.3) tracks final main CI, validated-artifact deployment and the mandatory five-minute follow-up. The pre-release production version was v3.1.0, deployment `01b6c533-ddc6-4ff7-aa66-654459bfac84`; this is the rollback reference. Earlier release evidence follows.

## Device journey follow-up — v3.1.0

The 2026-09-06 extension turns the personal page into six interactive hardware chapters, with a 12-second sequential carousel, stronger pointer tilt, nonlinear depth transitions and native screens carrying the same public information. Wired earbuds, floppy disks, cycling gloves and a helmet accompany the existing Game Boy decorations. A self-hosted CJK subset keeps the small screens consistent, and the scene's shadow now fades into transparency below the devices. Design, model assumptions and current verification are recorded in [13 — Objects along the way](13-devices-journey.md).

Both local HTTPS previews and their live endpoints report v3.1.0. Final local verification includes 220 unit tests with 100% statements/functions/lines and 99.77% branches, all 213 browser cases in one complete run across three engines, eight development checks, six cold-performance scenarios and all static, HTTP, security and resource gates. The complete results and public performance samples are recorded in [13](13-devices-journey.md).

The first remote CI blocked publication on personal-page interaction latency and WebKit control/timing failures. The follow-up limits scene layout work without paint clipping, keeps controls steady under the pointer, pauses test clocks explicitly and uses the real reading pause during axe inspection. WebKit runs with one worker to avoid rendering contention. All assertions, automatic-retry settings, timeouts and quality thresholds remain intact; six reviewed narrow Nokia/Macintosh snapshot pairs account for the layout optimization.

The second CI passed all 207 browser regressions and the desktop performance cases, but mobile interaction medians still exceeded 200 ms. The final follow-up prepares scenes individually during browser idle time and retains their layouts in a six-layer cache. Hidden scenes remain inert, absent from the accessibility tree and free of animations; inactive devices skip React updates until selected. New browser checks exercise native idle scheduling and its timer fallback without changing any existing performance or screenshot threshold.

The production browser smoke then exposed a Cloudflare-injected analytics script blocked by the existing CSP. HTML responses now include `Cache-Control: no-transform`, following [Cloudflare's documented injection behavior](https://developers.cloudflare.com/web-analytics/get-started/). The CSP remains unchanged. Markdown and asset responses keep their existing policies; HTTP checks cover GET/HEAD headers and assets, while the production verifier rejects missing protection or a reintroduced beacon. See [13](13-devices-journey.md) for the observed Red/Green evidence.

The user authorized `/su-release Y+1`: v3.0.3 → v3.1.0. The working-tree version already represents that increment; frozen installation confirmed that the existing lockfile needs no change. The release also includes the previously committed résumé keepsake. Its eight CI baselines now contain only the reviewed decoration delta, retaining all platform-specific typography and dimensions.

Publication uses the unchanged mandatory CI and validated-artifact deployment workflow. The [v3.1.0 GitHub Release](https://github.com/nocoo/lizheng.dev/releases/tag/v3.1.0) records the validated commit, CI/deployment runs, live deployment ID and delayed production recheck once published. The pre-release live version was v3.0.3, deployment `b23dbe9f-79f1-49b3-88d3-9a75231dfc55`; that is the rollback reference for this release. The records below describe earlier deployments and retain their original evidence.

## Production and versioning

- Major release 2.1.0 → 3.0.0 followed the requested /su-release procedure: package/lock, changelog, green commits, push, tag, GitHub Release and Cloudflare deployment.
- [v3.0.0](https://github.com/nocoo/lizheng.dev/releases/tag/v3.0.0) is commit 25ff91866a1c544fb7a9475369e5c23fb87ee2a6. [CI 33930999181](https://github.com/nocoo/lizheng.dev/actions/runs/33930999181) passed, including a recheck at 23:56:58 UTC, more than five minutes after release.
- First deployment ID: a4d61e18-5a64-41c8-9f41-5d8dec502610. All four public hostnames subsequently passed the read-only production verifier: /api/live v3.0.0, both language pages and all applicable blog 301s.
- The first Release job correctly failed its post-deployment check because www.lizheng.dev had no public DNS record (NXDOMAIN). Added that Custom Domain and retained the existing lizheng.dev Custom Domain. Cloudflare now manages their DNS/certificates; .me retains its existing Routes. No domain name changed, no TLS validation was disabled.
- package.json is the single version source. Version text is quiet in both footers, as requested. /api/live returns status, service, surface, version and the Cloudflare deployment ID with no-store.
- The hardening and local-development follow-up v3.0.2 is deployed. [CI 33933967229](https://github.com/nocoo/lizheng.dev/actions/runs/33933967229) passed on fa3a4023d569ac037eadee24560ded80b656d33c. [Release 33934123422](https://github.com/nocoo/lizheng.dev/actions/runs/33934123422) deployed its validated artifact and passed all four public-host verifications at 00:48:00 UTC. Deployment ID: b204d7fd-b425-4d0c-bea7-cdaec124645f. Both primary live endpoints independently returned v3.0.2 and that deployment ID. The published v3.0.2 tag remains unchanged; these follow-up commits repair test/development infrastructure.

## Implemented architecture

Four explicit public Markdown documents build four complete React pages. Old UI, CSS, builder and browser scripts are retired. Only public facts, the original identity photo and the legacy 301 contract/assertions carry forward. The original photo is outside the public build; all new fonts, portraits and social images are self-hosted.

The Worker handles host selection, all 12 legacy 301 patterns, query preservation, GET/HEAD, language negotiation, public Markdown, sitemaps and internal asset guards. /en, /en/, /zh and /zh/ serve the page; canonical URLs retain the slash. Hashed resources are immutable, HTML revalidates and live is never cached. CSP authorizes only self resources and the exact theme-bootstrap hash.

The parser validates identity, required metadata, all six résumé sections, jobs/degrees/achievements/patent and safe links. Nested HTML, unsafe protocols, unsupported content and arbitrary paths are rejected. Only allowlisted public documents enter HTML and agent exports. English/Chinese historical discrepancies remain explicitly recorded.

Both sites retain the approved naturally colored résumé photo, orange four-square brand/favicon and decorative English labels. Both location signatures say MADE IN BEIJING, with subtle nonlinear breathing lights and static reduced-motion glow.

### Adventure decoration follow-up — v3.0.3

The handheld now has original SVG capsule-ball, pixel-sparkle and grass decorations, with theme-aware shading and responsive placement. They introduce no dependency or resource request, take no layout space, stay outside the navigation/controls and remain hidden from assistive technology. A finite entrance settles to a static scene; reduced motion skips it. See [05](05-landing-design.md) for the visual specification.

The local HTTPS review exercised 16 site/language/theme/viewport combinations, controls and routing. All 63 production-browser checks passed across Chromium, Firefox and WebKit, with zero axe violations. A separate local check confirmed pointer passthrough, no running decoration animations after entrance and immediate reduced-motion presentation. G1 passed with zero lint warnings/errors, and all 26 direct dependency pins still match registry latest.

All four cold-performance cases passed with three samples each and normal motion. Handheld median LCP was 896ms at 390px and 916ms at 1440px; CLS remained below 0.0005, with measured interactions at most 48ms. The unchanged résumé cases also passed. These are local lab observations using the existing throttled model, not field metrics.

The initial screenshot run detected the intended decoration change in all eight landing baselines. Pixel comparison confirmed that every changed pixel belongs to the new decorations and that none overlaps an existing local/CI rendering difference. Only those pixels were transferred to the CI baselines, retaining the runner's original CJK typography and every other pixel. The local comparison rerun passed with the original 0.001 threshold and no additional masks. Résumé baselines remain unchanged. Publishing uses the existing mandatory CI gates and validated-artifact deployment flow.

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

Compressed production resources: résumé JS 763 bytes, CSS 3778 bytes, fonts 132240 bytes, imagery 25278 bytes; total ≤167039 bytes. Handheld JS 65262 bytes, CSS 6664 bytes, fonts 53820 bytes, imagery 984 bytes; total ≤130281 bytes. The size gate traverses imported assets rather than counting only entry files.

## Dependency and release pipeline

All 25 original direct dependencies were rechecked against registry latest on 2026-09-05 and matched: React 19.2.8, TypeScript 7.0.2, Vite 8.2.2, Wrangler 4.129.0, Vitest/coverage 5.0.0, Biome 2.5.12, Playwright 1.63.0, Knip 6.34.0 and other exact pins. Miniflare is now the 26th direct dependency, used only by the test runner. Its registry latest is 5.20260903.0-alpha, the identical version already used transitively by Wrangler 4.129.0; adding the direct declaration introduces no new resolved package. gray-matter and redundant workers-types were removed; yaml 2.9.0 and generated Wrangler types replace them. No unused dependencies or security override suppressions remain. Node 26 and Bun 1.4 are validated.

The existing reusable base-ci quality job and CI-success → Release flow are preserved. Successful main CI uploads worker-{sha}, containing built assets and a bundled Worker. Release verifies the CI run/repository/branch/event, checks out that exact SHA, downloads its artifact, deploys with --no-bundle and verifies all four public hosts. Manual deployment also requires a successful main CI run ID. Production deployments are serialized.

Before v3 cutover, the previous complete deployment was 4fa4f704-e665-4f35-a08a-f646d5ffe2b7. Restore it, if required, with bunx wrangler rollback 4fa4f704-e665-4f35-a08a-f646d5ffe2b7 and recheck both surfaces and redirects. Normal follow-up releases can roll back to the recorded v3.0.0 deployment. Keep Custom Domains configured and do not rewrite main history.

## Scope of evidence

Browser and touch checks use automated desktop engines and emulated viewports. Physical iOS/Android devices and real-user Web Vitals are not claimed as verified. There is no database or external write path. The two local Caddy HTTPS previews and their live endpoints also pass with the trusted local mkcert CA.

The v3.0.1 CI correctly blocked deployment on eight platform-font snapshot differences and WebKit connection failures. The fonts were reviewed and CI baselines added; test-only loopback mappings made DNS deterministic. Later logs established that Wrangler's development CLI was exiting during tests with an empty error, sometimes followed by an esbuild watcher deadlock. Prebundling and separate browser runners did not fully resolve it (runs 33932806478, 33933164855 and 33933525963). The v3.0.2 release was rechecked at 00:25:11 UTC, more than five minutes after publication; CI was still running and subsequently failed as described.

Browser/HTTP tests now compile their launcher for Node, build the Worker once with Wrangler's dry-run, and start it using Miniflare's API. This uses the same real workerd and assets, with the explicit user-worker/asset binding and routing settings from the isolated configuration. It removes the Bun server supervisor and long-running Wrangler development CLI/proxy from production-asset tests. Bun still manages dependencies and builds the application; Vite still owns local editing. Startup output, bundler logs and failures remain visible. Each browser engine has its own macOS runner, workerd process and evidence artifact; all 63 assertions remain mandatory. Chromium's job also runs the development and performance suites sequentially. Coverage, visual and performance thresholds are unchanged.

The v3.0.2 follow-up adds eight local-development/HMR regression checks (see 12). Final CI 33933967229 passed all 63 browser tests across the three engines, all eight development checks, four cold-performance scenarios, four HTTP matrices, L1/G1/G2, hook fault injection and artifact validation. No assertions, snapshots or thresholds were relaxed to resolve the runtime failures. Release 33934123422 then passed deployment and the production verifier.
