# Retrospective

Accident narratives for this repository. No root-handbook incidents were present when this log was initialized.

Record the actual date, what happened, cause and follow-up. Keep recurring project rules brief in [AGENTS.md](AGENTS.md); cross-project lessons belong in global rules/nmem, and deterministic checks belong in tests or hooks.

## 2026-09-24 SEO release verification raced edge propagation

- What happened: commit 8f3b775 added Tongji `alumniOf` and canonical checks to `scripts/verify-production.ts`. The release deployed successfully, but verification failed with `Missing identity SEO metadata: lizheng.dev/en`. A local rerun minutes later passed on all four hosts. Earlier the same release hit a transient `tar: stdout: write error` in artifact identity checking and needed one job rerun; the CI Chromium performance job also needed two reruns for interaction medians of 216–224ms against the 200ms budget, consistent with previous flaky runs (e.g. 208ms on af05e98).
- Cause: the version did not change, so the `/api/live` retry loop passed immediately against edges still serving the previous HTML; page-level content checks ran only once.
- Follow-up: page checks now retry with the same bound as `/api/live`. New content assertions in release verification must tolerate propagation when the version is unchanged.

## 2026-09-26 Interaction latency lacked event attribution

- What happened: CI run 35988441560 failed its 200ms interaction budget at 390px on attempt 1 and at 1440px on attempt 2. The unchanged six-case suite passed locally; the single controlled CI verification did not establish recovery.
- Cause of the diagnostic gap: duration arrays did not identify events or targets, and equal-duration entries could not safely be mapped to individual controls. Local tracing comparisons did not establish a sole cause for the hosted failure.
- Follow-up: preserve every performance scenario, sample, throttle, assertion and trace setting. Attach native event timings with control identities and long-animation-frame data so subsequent CI evidence can distinguish input delay, handler work and rendering. These diagnostics do not by themselves constitute a performance fix.
- A separate local pause-state candidate hit the normal formatting gate. Its review brief was sent before the hook result was inspected and incorrectly named the prior diagnostic commit; the brief was withdrawn and corrected before publication. Inspect the hook exit and actual SHA before requesting exact-head approval. That candidate remains local while the hosted evidence is evaluated.

## 2026-09-26 Isolate frame measurement from continuous screenshot recording

- Observation: hosted native timings showed short event handlers and long presentation delays across different controls, including 224ms individual events in a passing run. This did not establish JavaScript state publication as the sole cause.
- Measurement issue: Playwright's `retain-on-failure` mode records throughout the test and only discards successful traces afterward. Its default continuous screenshot filmstrip shares resources with the frame delivery measured by the performance suite.
- Follow-up: compare an explicit screenshot-free performance trace against the captured baseline. Keep DOM snapshots, action/network traces, native timing attachments, failure screenshots and every original scenario, sample and performance threshold. Normal browser tests retain their full traces. Hosted comparison and fresh CI/release acceptance are required before claiming recovery.
