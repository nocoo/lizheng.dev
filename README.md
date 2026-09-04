# lizheng.dev / lizheng.me

One repository serves a bilingual résumé at lizheng.dev and a personal landing page at lizheng.me on Cloudflare Workers. Legacy blog URLs on lizheng.me redirect permanently to lizheng.blog.

The new React 19 / Vite 8 / TypeScript 7 experiences are ready for local design review. Both sites have English/Chinese and light/dark modes. The résumé uses an editorial reading layout; the personal page is a tactile, interactive handheld console.

Start with the [design preview guide](docs/10-design-preview.md), [active documentation index](docs/README.md), and [public content corpus](docs/content/README.md). This phase prioritizes visual iteration; full 6DQ and coverage gates follow design approval.

Current local commands:

    bun install --frozen-lockfile
    bun run dev
    bun run build:design
    bun run review:design
    bun run lint
    bun run typecheck
    bun run test:coverage

Local Caddy serves both previews through one Vite/SSR server on 127.0.0.1:7046:

- Résumé: <https://lizheng-dev.dev.hexly.ai>
- Personal page: <https://lizheng-me.dev.hexly.ai>

`review:design` uses locally installed Google Chrome and writes fresh screenshots to the ignored .design-review directory. It does not lock visual snapshots. `build:design` writes the new static HTML, client assets, and public Markdown into .design-dist. `assets:design` regenerates both portrait treatments from the original photograph.

Production remains on the existing Cloudflare implementation during design review. `build`, `deploy`, and `dev:legacy` still address that implementation. Main CI triggers production deployment, so the design work is committed locally without pushing.

Historical documentation is archived and must not be read proactively; see [CLAUDE.md](CLAUDE.md).
