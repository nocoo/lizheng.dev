import { createServer } from "node:http";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { createServer as createViteServer } from "vite";
import { loadContent } from "../packages/content/model";
import {
	legacyRedirect,
	metadataFile,
	selectLocale,
	selectSurface,
} from "../packages/publishing/routes";

const port = 7046;
const server = createServer();
const vite = await createViteServer({
	configFile: false,
	plugins: [react()],
	publicDir: resolve("design-public"),
	appType: "custom",
	server: {
		middlewareMode: true,
		fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/docs/**"] },
		allowedHosts: ["lizheng-dev.dev.hexly.ai", "lizheng-me.dev.hexly.ai"],
		hmr: { server },
	},
});

server.on("request", async (request, response) => {
	try {
		const url = new URL(
			request.url ?? "/",
			`http://${request.headers.host ?? "localhost"}`,
		);
		const surface = selectSurface(url.hostname);
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
		const metadata = metadataFile(surface, url.pathname);
		if (metadata) {
			response
				.writeHead(200, { "Content-Type": `${metadata.type}; charset=utf-8` })
				.end(metadata.body);
			return;
		}
		if (url.pathname === "/en.md" || url.pathname === "/zh.md") {
			const locale = url.pathname === "/zh.md" ? "zh" : "en";
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
		if (["/en", "/zh"].includes(url.pathname)) {
			response
				.writeHead(308, { Location: `${url.pathname}/${url.search}` })
				.end();
			return;
		}
		if (["/en/", "/zh/"].includes(url.pathname)) {
			const { renderPage } = await vite.ssrLoadModule(
				"/packages/publishing/render.tsx",
			);
			const html = await vite.transformIndexHtml(
				url.pathname,
				await renderPage(
					surface,
					url.pathname === "/zh/" ? "zh" : "en",
					undefined,
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
