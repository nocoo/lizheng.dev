# lizheng.dev / lizheng.me

Two independent experiences, one Cloudflare Worker: a bilingual résumé at [lizheng.dev](https://lizheng.dev) and an interactive collection of personal devices at [lizheng.me](https://lizheng.me). Both support English/Chinese and light/dark. Legacy blog URLs on lizheng.me retain their exact 301 redirects to lizheng.blog.

Content comes from the four public Markdown documents in [docs/content](docs/content/README.md). React 19, Vite 8 and TypeScript 7 generate complete HTML; core information and links work without JavaScript. The résumé uses a lightweight DOM client, and the device gallery hydrates its native screens, controls and chapter navigation.

On the personal page, ↑/↓ select a screen link, ←/→ switch devices, and Enter opens the selected link. The chapter rail also supports direct selection and pausing the default carousel.

```sh
bun install --frozen-lockfile
bun run dev
bun run build
bun run gate:commit
bun run gate:push
bunx playwright install chromium firefox webkit
bun run test:browser
bun run test:performance
bun run test:development
```

Local Caddy previews use 127.0.0.1:7046:

- [Résumé](https://lizheng-dev.dev.hexly.ai)
- [Personal page](https://lizheng-me.dev.hexly.ai)

L2 and L3 use isolated workerd configurations, ports 17046/27046, and separate test assets. Husky enforces static checks, 95%+ logic coverage and a build before commits; real HTTP, secrets/dependency scans and size budgets before pushes. See [release implementation](docs/11-release-implementation.md) for measured results and test scope. CI also runs all three browsers, axe, visual regression and three-sample cold performance checks. Landing typography uses a self-hosted CJK subset to keep its small device screens consistent. Résumé snapshots retain separate local/CI variants for the existing system-font differences.

The existing GitHub CI → Release pipeline is retained. Successful main CI uploads a verified Worker/assets artifact; Release deploys that exact artifact to Cloudflare and verifies all four public hostnames, versions, languages and legacy redirects. package.json is the version source; the UI footer and /api/live consume it.

[Active documentation](docs/README.md) explains the architecture and contracts. [CLAUDE.md](CLAUDE.md) prohibits proactive access to expired documentation in docs/archive.

[Local development behavior](docs/12-local-development.md) describes first-paint styles, React/CSS hot updates and content refresh tests.

[Objects along the way](docs/13-devices-journey.md) describes the six devices, interactive screens, chapter carousel and motion.
