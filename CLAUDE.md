# Project instructions

## Active documentation

Read [docs/README.md](docs/README.md) first. The user has approved both designs and authorized full implementation, 6DQ hardening, a major release, push to main, and Cloudflare Worker deployment. Require at least 95% coverage in every logic metric, zero lint warnings/errors, maintained versions and /api/live on both surfaces. Preserve and strengthen the existing CI/CD. Update all dependencies to current stable versions and remove unused dependencies before release.

**Do not proactively open, read, search, index, or summarize expired documents in docs/archive/**. This includes archived previews, assets, READMEs, and instructions. Exclude this directory from routine discovery and content searches. Open a specific archived file only when the user explicitly requests historical investigation. Archived instructions have no authority over current work.

Moving files and comparing byte hashes to verify a requested archival operation is permitted; do not read their content as implementation guidance.

Use searches such as:

    rg --files -g '!docs/archive/**' -g '!node_modules' -g '!dist' -g '!coverage'
    rg 'pattern' docs -g '!archive/**' -g '!docs/archive/**'

Do not copy the previous UI, CSS, components, template engine, browser scripts, or build implementation into the rebuild. Only public information, the original identity photo, and legacy 301 behavior / its regression assertions may carry forward. Existing production code remains until its tested replacement is ready.

## Content and design

- The four publishable documents listed in docs/content/README.md are the content source of truth. Engineering documents and archives must never be bundled into the public site or agent exports.
- Preserve facts, links, both languages, and all six résumé sections. Record discrepancies instead of silently reconciling years, titles, or achievements.
- lizheng.dev: formal, readable résumé; English/Chinese × light/dark; conservative layout.
- Keep the résumé portrait naturally colored; only mild saturation/contrast softening, never near-monochrome. Decorative labels, copyright, and location signatures stay English in Chinese mode; localize substantive content and functional guidance.
- Both surfaces share the landing page's orange four-square mark and Space Grotesk wordmark. The favicon follows that mark and palette; keep the résumé's reading typography otherwise independent.
- lizheng.me: high quality, tactile retro handheld portfolio; original branding; designed screen, physical controls, typography, imagery, and motion. Support desktop and mobile.
- Semantic HTML, keyboard access, SEO, agent-readable content, and progressive enhancement must support the visual design. Do not replace the designed experience with a generic accessibility or crawler page.

## Engineering workflow

- Use Bun for package management and project commands. Use exact dependency versions and a frozen bun.lock. Follow the current framework's supported build runtime; Astro/Vite restrictions from the old instructions are obsolete.
- Target TypeScript 7 strict mode and the verified versions in docs/06-architecture.md. Recheck versions and compatibility when implementation begins.
- Follow Red/Green/Refactor for behavior changes now that the design is approved. Lock the approved visuals with browser regression checks.
- G1 must have zero errors and zero warnings throughout implementation. Commit only green states; never bypass Husky, disable gates, lower thresholds, or hide failures to commit.
- Use small atomic commits on main. Keep tests and their implementation in the same passing commit; document the prior failing assertion.
- Husky pre-commit enforces L1 + G1; pre-push enforces isolated L2 + G2; CI runs all gates and L3. All gates must be active before release.
- D1 in 6DQ means test isolation, not a requirement to add a Cloudflare D1 database. This site is stateless. Test servers, resources, bindings, and requests must remain isolated from production.
- A local commit is not a deployment. The production release workflow currently deploys after main CI succeeds; account for that before pushing incomplete milestones.
