# 19 — CI stability

2026-09-30. Acceptance requires ten consecutive independent GitHub executions of
one final SHA, each within ten minutes. CI-only validation must not repeatedly
deploy production. This document records the design and baseline, not an unearned
acceptance claim.

## Baseline and attribution

Both workflows were active. Local and remote main were clean at
`a659cd811670b48bb75fee1155f1c050d3e5313c`, without a rule requiring another PR.
Draft [28](https://github.com/nocoo/lizheng.dev/pull/28) was on
`b91c35c899a8b788f25e6634ec93f0b00a204fc7` with successful CI. The latest failed
CI belonged to Draft [29](https://github.com/nocoo/lizheng.dev/pull/29),
`e88726062e3d6f3d6f079d29b69a431c8309d4d7`. Neither branch is modified here.

| Run / attempt | Event / SHA | UTC execution window | Result |
| --- | --- | --- | --- |
| [35988441560 / 3](https://github.com/nocoo/lizheng.dev/actions/runs/35988441560/attempts/3) | push / a659cd8 | Sep 27 22:33:36–22:45:29 | Success, 713 s |
| [36356385708 / 1](https://github.com/nocoo/lizheng.dev/actions/runs/36356385708) | workflow_run / a659cd8 | Sep 27 22:45:31–22:45:54 | Failed before deployment: tar stdout write error |
| [36354936758 / 1](https://github.com/nocoo/lizheng.dev/actions/runs/36354936758) | pull_request / b91c35c | Sep 27 22:20:18–22:29:52 | Success, 574 s; does not validate main |
| [36638588258 / 2](https://github.com/nocoo/lizheng.dev/actions/runs/36638588258/attempts/2) | pull_request / e887260 | Sep 29 22:31:22–22:42:23 | Failed: mobile Play interaction median 216 ms exceeds 200 ms |

Main attempt 3 job times: L1 24 s, G2 11 s, HTTP 25 s, Firefox 297 s,
Chromium 467 s, WebKit 684 s, artifact 17 s. WebKit tests alone took 638 s
with one worker. Chromium browser tests took 178 s, then development 14 s and
cold-performance sampling 232 s. Artifact creation waited for these checks.
The main run was originally created on Sep 24; that date through attempt 3 on
Sep 27 is not queueing. Queue, execution and propagation must be distinguished.

## Mandatory checks

- Frozen exact dependencies with blocked install scripts; Node 26 and Bun 1.4.
- Strict types, lint/format, generated types, active docs and unused dependencies.
- Complete unit suite; statements/branches/functions/lines each at least 95%.
- Gitleaks and OSV, failing closed for findings or missing scanners.
- Full real HTTP routes, host mapping, legacy redirects and test isolation.
- All existing Chromium, Firefox and WebKit journeys, accessibility and visual
  assertions, without retries, skipped tests or relaxed screenshot thresholds.
- Build, public asset allowlist, deterministic resource budgets and hook rejection
  checks, then Wrangler dry-run packaging and real archive extraction.
- Production requires successful same-repository main push CI, matching workflow
  and artifact SHA, fresh main checked twice, serialized production environment,
  rollback reference and both-surface/redirect verification.

The generic base-ci workflow still reports unused Build/L3/Worker/Package wrappers
as skipped. These were already unused: this project has dedicated build/browser
jobs, includes Worker units in L1, and is not a published library. Acceptance
requires every actual project gate to succeed; optional wrappers do not count.

## Changes and tradeoffs

WebKit retains every test and one worker per runner, split into three Playwright
shards. Chromium and Firefox retain their full suites. Shards have separate test
servers and unique evidence artifacts. Extra runner demand may increase queueing;
measure it rather than claiming a guaranteed service-level bound.

Vite HMR remains blocking: its roughly fourteen seconds are not a bottleneck.
Cold performance moves to the independent daily/manual Performance lab. Hosted throttled
performance is noisy: repeated 216–224 ms observations near a 200 ms threshold
blocked unrelated changes. All tests and thresholds remain; failures remain red
with artifacts. Latency regressions may now be detected at the next
daily run. Functional journeys, accessibility and deterministic size budgets
still block every release. No browser assertion is deleted.

Miniflare's vulnerable Undici 7.29.0 is pinned to 7.29.1 with a parent-specific
Bun override, preserving jsdom's separate 8.10.2. This follows the independently
reviewed patch in PR 29. No advisory is suppressed. Local OSV changed from ten
findings to zero; frozen installation and the HTTP suite passed.

The shared unpack script consumes the full tar listing, avoiding grep's early
pipe close. It requires the bundled Worker and all four HTML documents. Fixtures
cover large listings, missing payloads, missing archives and corruption. CI
extracts the real artifact into an empty temporary directory before upload;
production uses the same script.

## Safe validation and measurement

CI dispatch runs the same mandatory graph and creates the same artifact as push.
It has read-only permissions and no production credentials. Automatic Release
accepts only push; both release-source checks also reject dispatch artifacts,
including explicit manual Release attempts.

Until production publication is authorized, a temporary remote validation branch
may point to the locally committed main SHA. It creates no PR, cannot match
Release's main filter, and permits real workflow validation before remote main
advances. Record both branch and SHA.

Freeze the final SHA before acceptance. Dispatch sequentially so reusable-workflow
concurrency cannot cancel another validation. Record URL, event, attempt (must
be 1), SHA, creation, run-start and final completion, all mandatory job results,
test counts and artifact presence. Wall time is creation through completion,
including queueing. Report initial queue and per-job execution separately;
internal queueing remains in wall time. Reruns/partial reruns do not count.
Any failure or over-budget run breaks the streak. Code changes reset SHA/count.
Keep the measurement report outside the frozen source tree so recording results
does not change the SHA being tested.

Measure a single authorized production release separately from push creation
through final verification, including CI, handoff, deployment and propagation.
Ten CI-only successes do not prove ten deployments or guarantee edge propagation.
Report the separate production result before claiming the full CI/CD objective.
