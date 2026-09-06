import { realpathSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { createServer as createViteServer } from "vite";
import manifest from "../package.json" with { type: "json" };
import { loadContent } from "../packages/content/model";
import {
	legacyRedirect,
	metadataFile,
	selectLocale,
	selectSurface,
} from "../packages/publishing/routes";

const testMode = process.argv[2] === "--test";
const port = testMode ? 27046 : 7046;
const server = createServer();
const vite = await createViteServer({
	configFile: false,
	cacheDir: resolve(".test-dist/dev-cache"),
	optimizeDeps: {
		include: ["react", "react-dom/client", "react/jsx-dev-runtime"],
	},
	plugins: [
		react(),
		{
			name: "resume-document-refresh",
			handleHotUpdate({ file, server: developmentServer }) {
				if (
					file.endsWith(".tsx") &&
					(file.startsWith(resolve("apps/resume")) ||
						file.startsWith(resolve("packages/experience")))
				)
					developmentServer.ws.send({
						type: "custom",
						event: "resume:refresh",
					});
			},
		},
	],
	publicDir: resolve("design-public"),
	appType: "custom",
	server: {
		middlewareMode: true,
		warmup: {
			clientFiles: ["./apps/resume/client.ts", "./apps/landing/client.tsx"],
			ssrFiles: ["./packages/publishing/render.tsx"],
		},
		watch: {
			ignored: [
				"**/docs/archive/**",
				"**/dist/**",
				"**/dist.tmp/**",
				"**/.test-dist/**",
				"**/.test-results/**",
				"**/playwright-report/**",
				"**/.design-dist/**",
				"**/.design-review/**",
				"**/coverage/**",
				"**/.release-worker/**",
			],
		},
		fs: {
			allow: [resolve("."), realpathSync("node_modules")],
			deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/docs/**"],
		},
		allowedHosts: [
			"lizheng-dev.dev.hexly.ai",
			"lizheng-me.dev.hexly.ai",
			...(testMode
				? ["resume.lizheng-test.localhost", "landing.lizheng-test.localhost"]
				: []),
		],
		hmr: { server },
	},
});

const publicContent = new Set(
	[
		"01-resume-en.md",
		"02-resume-zh.md",
		"03-landing-en.md",
		"04-landing-zh.md",
	].map((file) => resolve("docs/content", file)),
);
vite.watcher.add([...publicContent]);
vite.watcher.on("change", (file) => {
	if (publicContent.has(file)) vite.ws.send({ type: "full-reload", path: "*" });
});

server.on("request", async (request, response) => {
	try {
		const url = new URL(
			request.url ?? "/",
			`http://${request.headers.host ?? "localhost"}`,
		);
		const surface = selectSurface(
			url.hostname,
			testMode ? "landing.lizheng-test.localhost" : undefined,
		);
		const redirect = legacyRedirect(surface, url);
		response.setHeader("X-Robots-Tag", "noindex, nofollow");
		if (redirect) {
			response.writeHead(301, { Location: redirect }).end();
			return;
		}
		if (
			url.pathname.startsWith("/_sites/") ||
			url.pathname.startsWith("/cover/") ||
			url.pathname.startsWith("/docs/")
		) {
			response.writeHead(404).end("Not Found");
			return;
		}
		if (url.pathname === "/api/live") {
			response
				.writeHead(200, {
					"Content-Type": "application/json; charset=utf-8",
					"Cache-Control": "no-store",
				})
				.end(
					JSON.stringify({
						status: "ok",
						service: "lizheng-dev",
						surface,
						version: manifest.version,
						deployment: "local-preview",
					}),
				);
			return;
		}

		const metadata = metadataFile(surface, url.pathname);
		if (metadata) {
			response
				.writeHead(200, { "Content-Type": `${metadata.type}; charset=utf-8` })
				.end(metadata.body);
			return;
		}
		if (/^\/(en|zh)(?:\.md|\/content\.md)$/.test(url.pathname)) {
			const locale = url.pathname.startsWith("/zh") ? "zh" : "en";
			response
				.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" })
				.end((await loadContent(surface, locale)).markdown);
			return;
		}
		if (url.pathname === "/") {
			response
				.writeHead(302, {
					Location: `/${selectLocale(request.headers["accept-language"])}/`,
					Vary: "Accept-Language",
				})
				.end();
			return;
		}
		if (["/en", "/zh", "/en/", "/zh/"].includes(url.pathname)) {
			const { renderPage } = await vite.ssrLoadModule(
				"/packages/publishing/render.tsx",
			);
			const html = await vite.transformIndexHtml(
				url.pathname,
				await renderPage(
					surface,
					url.pathname.startsWith("/zh") ? "zh" : "en",
					{
						script: `/apps/${surface}/client.${surface === "resume" ? "ts" : "tsx"}`,
						css: [
							"/packages/experience/base.css",
							`/apps/${surface}/${surface}.css`,
							...(surface === "landing" ? ["/apps/landing/devices.css"] : []),
						],
					},
					true,
				),
			);
			response
				.writeHead(200, {
					"Content-Type": "text/html; charset=utf-8",
					"Cache-Control": "no-store",
				})
				.end(html);
			return;
		}
		vite.middlewares(request, response, () => {
			if (surface === "landing" && !url.pathname.includes("."))
				response
					.writeHead(302, {
						Location: `/${selectLocale(request.headers["accept-language"])}/`,
					})
					.end();
			else response.writeHead(404).end("Not Found");
		});
	} catch (error) {
		if (error instanceof Error) vite.ssrFixStacktrace(error);
		console.error(error);
		response
			.writeHead(500, { "Content-Type": "text/plain" })
			.end("Preview error. See the development server log.");
	}
});
server.listen(port, "127.0.0.1", () => {
	console.info(`Design preview ready on 127.0.0.1:${port}`);
	console.info("Résumé: https://lizheng-dev.dev.hexly.ai");
	console.info("Handheld: https://lizheng-me.dev.hexly.ai");
});
async function shutdown() {
	await vite.close();
	server.close();
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
