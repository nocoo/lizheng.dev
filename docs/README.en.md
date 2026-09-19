<h1 align="center">lizheng.dev / lizheng.me</h1>
<p align="center">A bilingual résumé and an interactive personal device collection.</p>
<p align="center"><a href="https://lizheng.dev">Website</a> · <a href="../README.md">简体中文</a></p>

## What it does

One stateless Cloudflare Worker serves two experiences: a bilingual résumé at [lizheng.dev](https://lizheng.dev) and an interactive personal device collection at [lizheng.me](https://lizheng.me). Both support Chinese/English and system/light/dark themes, with shared navigation connecting Play, Journal, Résumé and Portfolio.

## Features

- Generate complete HTML from [four public Markdown documents](content/README.md); core content and links work without JavaScript.
- Use a lightweight DOM client for the résumé and hydrate device screens, controls and chapter navigation for the collection.
- Navigate devices by keyboard, select chapters and pause the carousel.
- Preserve exact 301 redirects from legacy lizheng.me blog URLs to lizheng.blog.
- Share the root `package.json` version across site footers and `/api/live`.

## Usage

Open the [résumé](https://lizheng.dev) or [personal page](https://lizheng.me), then choose a language and theme. On the device page, ↑ / ↓ select a screen link, ← / → switch devices, and Enter opens the selected link. The chapter rail also supports direct selection and pausing the carousel.

## Development

Requires Bun 1.4.0 and Node.js 26+ (CI uses 26.8.1).

```sh
bun install --frozen-lockfile
bun run dev
bun run build
```

Local Caddy maps the [résumé preview](https://lizheng-dev.dev.hexly.ai) and [personal-page preview](https://lizheng-me.dev.hexly.ai) to `127.0.0.1:7046`. Interfaces live in `apps/resume/` and `apps/landing/`, shared models/publishing in `packages/` and `scripts/`, and Worker routes in `worker/`.

The four documents in `docs/content/` are the public content source; historical archives are not current editing or publishing inputs. After successful main CI, the existing Release workflow deploys the verified Worker and assets. See the [release guide](11-release-implementation.md).

## Tests

```sh
bun run typecheck
bun run lint
bun run check:docs
bun run test:coverage
bun run test:http
bunx playwright install chromium firefox webkit
bun run test:browser
bun run test:performance
bun run test:development
```

Vitest checks content, publishing and Worker logic. HTTP/browser tests use isolated workerd instances, separate assets and ports `17046` / `27046`. Browser checks cover three engines, accessibility and visual regression. Performance and development checks run separately; run browser suites sequentially. Résumé screenshots retain separate local/CI baselines for system-font differences.

## Stack

| Technology | Role |
| --- | --- |
| React, TypeScript | Content rendering and interaction |
| Vite, Bun | Local development and HTML publishing |
| Cloudflare Workers | Dual-site routing, static assets and legacy redirects |
| Biome, Vitest, Playwright | Static, logic, HTTP and browser checks |

## Documentation

- [Active documentation](README.md) and [architecture](06-architecture.md).
- [Local development](12-local-development.md) and [release guide](11-release-implementation.md).
- [Device journey](13-devices-journey.md) and [connected surfaces](14-connected-surfaces.md).
- [Public content](content/README.md).

## License

The repository has no project-level LICENSE. Third-party dependencies retain their own terms.
