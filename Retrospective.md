# Retrospective

Accident narratives for this repository. No root-handbook incidents were present when this log was initialized.

Record the actual date, what happened, cause and follow-up. Keep recurring project rules brief in [AGENTS.md](AGENTS.md); cross-project lessons belong in global rules/nmem, and deterministic checks belong in tests or hooks.

## 2026-09-24 SEO release verification raced edge propagation

- What happened: commit 8f3b775 added Tongji `alumniOf` and canonical checks to `scripts/verify-production.ts`. The release deployed successfully, but verification failed with `Missing identity SEO metadata: lizheng.dev/en`. A local rerun minutes later passed on all four hosts. Earlier the same release hit a transient `tar: stdout: write error` in artifact identity checking and needed one job rerun; the CI Chromium performance job also needed two reruns for interaction medians of 216–224ms against the 200ms budget, consistent with previous flaky runs (e.g. 208ms on af05e98).
- Cause: the version did not change, so the `/api/live` retry loop passed immediately against edges still serving the previous HTML; page-level content checks ran only once.
- Follow-up: page checks now retry with the same bound as `/api/live`. New content assertions in release verification must tolerate propagation when the version is unchanged.

## 2026-09-30 CI and archive validation

Release 36356385708 failed before deployment because `grep -q` closed the tar
listing pipe early under `pipefail`. A shared extraction script now drains the
listing and checks the Worker plus all four pages. CI uses it against the real
archive in an empty directory; large-listing and invalid-artifact fixtures keep
the regression visible without production writes.

During integration, redirecting `git show` directly to package.json truncated it
when the PR object had not yet been fetched. The file was restored immediately
from HEAD before validation; no broken state was committed. Fetch and materialize
external Git files into temporary paths before replacing working files.

The first CI-only calibration added a custom run title. Review identified that
the pinned release-source action checks the API run name against `CI`; live run
36643481028 confirmed that `run-name` changes that API field. The custom title
was removed before any main push or deployment. Track validation by run ID and
SHA without changing names used by downstream trust checks. This calibration
does not count toward acceptance of the subsequent final commit.

## 2026-10-04 — Bound release archive fixture I/O

The dependency commit gate exposed the existing 600-file release archive fixture taking 13.6 seconds while static checks and the build ran concurrently, exceeding its unchanged 5-second test limit. Profiling isolated filesystem packing/extraction as the cost. Use 128 longer paths to produce a larger real listing (108,169 bytes versus 102,820), assert the listing exceeds 100,000 bytes, and verify every extracted file's content. Keep the timeout, incomplete/corrupt archive checks and production extractor unchanged. Local BSD tar did not reject a temporary grep-q mutation with either the original or revised fixture; this local run does not prove GNU tar SIGPIPE behavior. Preserve that limitation and require the normal Linux CI artifact validation.

## 2026-10-08 - Mirror metadata and lockfile locations

The Microsoft mirror reported September releases as latest while upstream had
already published October releases; its frozen install also returned 404 for
six locked tarballs. Cross-checking upstream and the permitted Tencent mirror
caught the stale metadata before choosing upgrades. Do not interpret a reachable
mirror as proof of fresh metadata or complete tarball coverage.

A temporary Tencent registry setting made Bun write mirror tarball locations
throughout bun.lock during the first dependency update. The pre-stage URL check
caught the unintended churn. Normalize only those location fields back to the
repository's existing empty-location form, preserving versions and integrity
hashes, then inspect the semantic diff and prove frozen-install hash stability.
No mirror URLs were committed and no global registry settings were changed.

The footer follow-up initially missed an HTTP assertion requiring visible
version text because the first targeted reference search omitted tests/http.
The full route matrix caught it before commit. Include unit, HTTP, browser and
production verification consumers when removing a shared presentation contract;
retain `/api/live` version checks rather than inventing hidden display metadata.
