# lizheng.dev / lizheng.me

One repository serves a bilingual résumé at lizheng.dev and a personal landing page at lizheng.me on Cloudflare Workers. Legacy blog URLs on lizheng.me redirect permanently to lizheng.blog.

The project is entering a complete UI and implementation rebuild. The current delivery is its documentation baseline; the deployed application still uses the existing implementation.

Start with the [active documentation index](docs/README.md), the [rebuild brief](docs/01-rebuild-brief.md), and the [public content corpus](docs/content/README.md). Read the [6DQ / TDD plan](docs/07-quality-and-tdd.md) before application development.

Current local commands:

    bun install --frozen-lockfile
    bun run dev
    bun run build
    bun run test:coverage
    bun run lint
    bun run typecheck
    bunx markdownlint-cli2@0.23.2

The development server uses port 3000. Main CI currently triggers production deployment. Future architecture and commands are explicitly marked as planned in the numbered documents.

Historical documentation is archived and must not be read proactively; see [CLAUDE.md](CLAUDE.md).
