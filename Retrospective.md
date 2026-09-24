# Retrospective

Accident narratives for this repository. No root-handbook incidents were present when this log was initialized.

Record the actual date, what happened, cause and follow-up. Keep recurring project rules brief in [AGENTS.md](AGENTS.md); cross-project lessons belong in global rules/nmem, and deterministic checks belong in tests or hooks.

## 2026-09-24 SEO release verification raced edge propagation

- What happened: commit 8f3b775 added Tongji `alumniOf` and canonical checks to `scripts/verify-production.ts`. The release deployed successfully, but verification failed with `Missing identity SEO metadata: lizheng.dev/en`. A local rerun minutes later passed on all four hosts. Earlier the same release hit a transient `tar: stdout: write error` in artifact identity checking and needed one job rerun; the CI Chromium performance job also needed two reruns for interaction medians of 216–224ms against the 200ms budget, consistent with previous flaky runs (e.g. 208ms on af05e98).
- Cause: the version did not change, so the `/api/live` retry loop passed immediately against edges still serving the previous HTML; page-level content checks ran only once.
- Follow-up: page checks now retry with the same bound as `/api/live`. New content assertions in release verification must tolerate propagation when the version is unchanged.
