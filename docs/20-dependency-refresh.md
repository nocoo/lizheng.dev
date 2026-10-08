# 20 - Dependency refresh

2026-10-08. The user authorized checking all direct dependencies and upgrading
stable releases, with an explicit exception for the Miniflare alpha required by
the latest stable Wrangler. Work stays on local main until Chrome/Caddy
acceptance. There were no open dependency issues to close.

## Version selection

All 26 direct dependencies were checked against release metadata. The Microsoft
package mirror lagged upstream and lacked several locked tarballs; the permitted
Tencent mirror and upstream release notes supplied current evidence. Versions
remain exact, the package manager remains Bun, and bun.lock contains no mirror
tarball URLs. Node 26.10.0 and Bun 1.4.2 satisfy the existing engine requirements.

| Dependency | Before | Selected |
| --- | --- | --- |
| marked | 18.0.14 | 18.1.0 |
| jsdom | 30.1.1 | 30.1.2 |
| knip | 6.39.0 | 6.40.0 |
| vite | 8.3.1 | 8.3.3 |
| @vitejs/plugin-react | 6.1.1 | 6.1.2 |
| @playwright/test | 1.63.0 | 1.64.0 |
| wrangler | 4.145.0 | 4.148.0 |
| miniflare | 5.20260910.0-alpha | 5.20261006.0-alpha |

The other 18 direct pins already match current stable releases. Miniflare's
latest stable 4.20260730.0 would downgrade the existing runtime and is not
adopted. The selected alpha matches Wrangler's exact dependency and workerd
1.20261006.1. The application compatibility date remains 2026-09-04; generated
Worker declarations are regenerated, not edited manually. Dependency upgrades
do not require public content, layout, route, coverage floor, screenshot baseline
or release workflow changes. The user subsequently authorizes a separate footer
simplification in [14](14-connected-surfaces.md), including intentional page
baseline updates. Knip and source/configuration inspection find no unused direct
dependencies.

## Transitive security fixes

The required OSV scan identified three affected locked versions:

| Package / owner | Before | Fixed | Advisory |
| --- | --- | --- | --- |
| sharp / Miniflare | 0.35.4 | 0.35.5 | [GHSA-wq5f-xc86-pv6w](https://osv.dev/GHSA-wq5f-xc86-pv6w) |
| smol-toml / Knip | 1.8.0 | 1.9.0 | [GHSA-r4xh-jqrq-34v2](https://osv.dev/GHSA-r4xh-jqrq-34v2) |
| source-map-js / CSS and build tools | 1.2.1 | 1.2.2 | [GHSA-68fv-2mgg-jv7q](https://osv.dev/GHSA-68fv-2mgg-jv7q) |

Bun updates smol-toml and source-map-js within their upstream dependency ranges.
Miniflare still pins sharp exactly, so a parent-specific miniflare>sharp override
selects the existing patched direct version, including its native libraries. No
advisories are ignored. The obsolete miniflare>undici override is removed because
the selected Miniflare already pins patched Undici 7.29.1. jsdom independently
selects Undici 8.11.2 through its own declared range.

## Verification and acceptance

Atomic dependency commits retain normal check-only hooks. Final product evidence
at source revision 823f3fb:

- All 287 unit tests pass. Statements, functions and lines are 100%; branches
  are 99.47%, above every existing 95% floor.
- Strict TypeScript, Biome, generated types, Knip, active-document checks and
  production builds pass.
- All five HTTP checks pass, including the four complete host/route matrices.
- All ten isolated development/HMR checks pass on the final layout.
- Frozen install preserves the lockfile hash; Gitleaks and OSV pass with no
  issues across the upgraded graph.
- The isolated real-Git hook fixture rejects all 17 injected failures and
  accepts restored commit/push. All four production resource budgets pass.
- All 255 browser cases pass in Chromium, Firefox and WebKit (10.3 minutes),
  without retries or skips. Earlier runs stopped for the user's footer feedback
  are not counted as complete proof. Thresholds remain unchanged; footer-only
  baseline updates belong to the separately requested design.
- The additional nonblocking performance lab has three passes and three failures
  (6.5 minutes). English Play cases time out at the unchanged 90-second limit;
  Chinese mobile Play measures median LCP 2688ms and interaction 360ms, above the
  existing 2500ms/200ms limits. During this run the machine's load averages reach
  163.08 / 140.74 / 103.99 with other repositories testing concurrently. This is
  not passing performance evidence and does not prove the cause is contention.
  Retest on an idle machine; no thresholds, tests or unrelated processes change.

Both Caddy pages and `/api/live` respond successfully with trusted HTTPS and
the updated copy. Chrome is opened to both real preview URLs. No remote CI/CD
or deployment evidence is claimed for these unpushed changes.

Existing active Caddy routes map both HTTPS previews to 127.0.0.1:7046:
[Resume](https://lizheng-dev.dev.hexly.ai) and
[Play](https://lizheng-me.dev.hexly.ai). User acceptance, version changes,
push/tag/release and production deployment remain pending.

## Release sources

- [Wrangler 4.148.0](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.148.0)
- [Miniflare 5.20261006.0-alpha](https://github.com/cloudflare/workers-sdk/releases/tag/miniflare%405.20261006.0-alpha)
- [Playwright 1.64.0](https://github.com/microsoft/playwright/releases/tag/v1.64.0)
- [Vite 8.3.3](https://github.com/vitejs/vite/releases/tag/v8.3.3)
- [React plugin 6.1.2](https://github.com/vitejs/vite-plugin-react/releases/tag/plugin-react%406.1.2)
- [marked 18.1.0](https://github.com/markedjs/marked/releases/tag/v18.1.0)
- [Knip 6.40.0](https://github.com/webpro-nl/knip/releases/tag/knip%406.40.0)
