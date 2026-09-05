# 12 — Local development and hot updates

The user reported a visible flash of unstyled HTML during local refresh after the first release. Both production pages already linked their built CSS; the Vite preview omitted styles until client JavaScript imported them.

## Run locally

    bun install --frozen-lockfile
    bun run dev

The server listens on 127.0.0.1:7046. Existing Caddy mappings and trusted mkcert certificates provide:

- <https://lizheng-dev.dev.hexly.ai> for the résumé.
- <https://lizheng-me.dev.hexly.ai> for the handheld.

## Implemented behavior

- Preview HTML includes render-blocking links to base and surface CSS. It renders correctly even when the client script is delayed or blocked; no hidden-body or fake loading overlay is used.
- Vite warms both client entry points and the SSR renderer, and explicitly optimizes React dependencies before demand-driven loading.
- CSS changes use Vite HMR and preserve the document, theme and current controls. React Fast Refresh preserves the handheld's selected panel.
- Résumé templates are server-rendered with no React runtime in production. A development-only event refreshes their HTML; theme and browser reading position remain intact. Theme/observer listeners are disposed during module replacement.
- The four allowlisted public Markdown files trigger a content refresh. Archived docs, build outputs, caches and generated test reports are excluded from the development watcher. Running build/test gates does not reload an editing session.
- Development dependency caches live in .test-dist/dev-cache. Isolated test checkouts use their own cache and permit only their source plus the resolved dependency directory, retaining the secret/docs denial rules.

## Regression evidence

Run bun run test:development. Eight Chromium checks use a temporary source copy, an isolated Vite server on 27046 and the same loopback request guard as L3. They never edit the active working copy. CI runs them sequentially with the other browser suites.

Observed Red: blocking client JavaScript left both pages with zero stylesheets and the default Times font. Markdown edits did not update the visible content, and résumé template edits remained stale. After the fix, all eight checks pass, including actual font/style requests, CSS updates without navigation, React state preservation and a résumé refresh retaining scrollY=600 and dark mode.

The browser/performance suites use workerd and production assets; this suite specifically verifies the development renderer and Vite HMR. Keep both kinds of checks, since a correct production build does not prove the local editing experience is correct.

The actual Caddy HTTPS entry points were also checked in system Chrome with trusted certificates: both pages had two stylesheets and their intended font/background while the client entry was blocked. Both established their wss:// HMR connection with no page errors.

Vite owns UI hot updates. The start command runs one Bun server process; after changing the server bootstrap or its HTTP routing setup, restart bun run dev. This avoids the nested Bun watcher terminating the server on bootstrap edits.
