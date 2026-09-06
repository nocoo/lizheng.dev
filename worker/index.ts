import manifest from "../package.json" with { type: "json" };

const { version } = manifest;

import {
	legacyRedirect,
	metadataFile,
	publicOrigin,
	selectLocale,
	selectSurface,
} from "../packages/publishing/routes";
import { securityHeaders } from "../packages/publishing/security";
import socialImages from "../packages/publishing/social-images.json" with {
	type: "json",
};

const socialPaths = new Set(
	Object.values(socialImages).flatMap((locales) => Object.values(locales)),
);

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const surface = selectSurface(url.hostname, env.LANDING_HOST);
		const path = url.pathname;
		const headers = new Headers(securityHeaders);
		// Exercise the same policy locally without upgrading localhost to HTTPS.
		if (env.ENVIRONMENT === "test") {
			headers.set("X-Robots-Tag", "noindex");
			headers.set(
				"Content-Security-Policy",
				securityHeaders["Content-Security-Policy"].replace(
					"; upgrade-insecure-requests",
					"",
				),
			);
		} else
			headers.set(
				"Strict-Transport-Security",
				"max-age=31536000; includeSubDomains",
			);
		headers.set("Cache-Control", "no-store");
		const respond = (body: BodyInit | null, status = 200) =>
			new Response(request.method === "HEAD" ? null : body, {
				status,
				headers,
			});
		if (request.method !== "GET" && request.method !== "HEAD") {
			headers.set("Allow", "GET, HEAD");
			return respond("Method Not Allowed", 405);
		}
		const redirect = legacyRedirect(surface, url);
		if (redirect) {
			headers.set("Location", redirect);
			headers.set("Cache-Control", "public, max-age=86400");
			return respond(null, 301);
		}
		if (
			/^\/(?:_sites|cover|docs|\.git)(?:\/|$)/.test(path) ||
			/%2f|%5c/i.test(path)
		)
			return respond("Not Found", 404);
		if (path === "/api/live") {
			headers.set("Content-Type", "application/json; charset=utf-8");
			return respond(
				JSON.stringify({
					status: "ok",
					service: "lizheng-dev",
					surface,
					version,
					deployment: env.CF_VERSION_METADATA?.id ?? "local",
				}),
			);
		}
		const metadata = metadataFile(surface, path);
		if (metadata) {
			headers.set("Content-Type", `${metadata.type}; charset=utf-8`);
			headers.set("Cache-Control", "public, max-age=300");
			return respond(metadata.body);
		}
		const page = /^\/(en|zh)\/?$/.exec(path);
		const markdown = /^\/(en|zh)(?:\.md|\/content\.md)$/.exec(path);
		const llms = path === "/llms.txt";
		if (
			page ||
			markdown ||
			llms ||
			/^\/(?:assets\/|design-assets\/|favicon\.svg$)/.test(path)
		) {
			const target = new URL(url);
			target.search = "";
			if (page) target.pathname = `/_sites/${surface}/${page[1]}/index.html`;
			if (markdown) target.pathname = `/_sites/${surface}/${markdown[1]}.md`;
			if (llms) target.pathname = `/_sites/${surface}/llms.txt`;
			const asset = await env.ASSETS.fetch(
				new Request(target, {
					method: request.method,
					headers: request.headers,
				}),
			);
			// Never expose an internal asset path in Location.
			if (asset.status >= 300 && asset.status < 400 && asset.status !== 304)
				return respond("Not Found", 404);
			const result = new Response(asset.body, asset);
			for (const [key, value] of headers) result.headers.set(key, value);
			result.headers.set(
				"Cache-Control",
				(path.startsWith("/assets/") || socialPaths.has(path)) && asset.ok
					? "public, max-age=31536000, immutable"
					: llms && asset.ok
						? "public, max-age=300"
						: "public, max-age=0, must-revalidate",
			);
			// Keep edge-injected scripts from conflicting with the self-only CSP.
			if (page) result.headers.append("Cache-Control", "no-transform");
			if (markdown && asset.ok)
				result.headers.set("Content-Type", "text/markdown; charset=utf-8");
			if (llms && asset.ok)
				result.headers.set("Content-Type", "text/plain; charset=utf-8");
			if ((page || markdown) && asset.ok) {
				const origin = publicOrigin(surface);
				const locale = (page ?? markdown)?.[1];
				const canonical = `${origin}/${locale}/`;
				result.headers.set(
					"Link",
					[
						`<${origin}/llms.txt>; rel="service-doc"; type="text/plain"`,
						...(markdown
							? [
									`<${canonical}>; rel="canonical"`,
									`<${canonical}>; rel="alternate"; type="text/html"`,
								]
							: [
									`<${canonical}content.md>; rel="alternate"; type="text/markdown"`,
								]),
					].join(", "),
				);
			}
			return result;
		}
		if (path === "/") {
			headers.set(
				"Location",
				`${url.origin}/${selectLocale(request.headers.get("Accept-Language") ?? "")}/`,
			);
			headers.set("Vary", "Accept-Language");
			return respond(null, 302);
		}
		return respond("Not Found", 404);
	},
} satisfies ExportedHandler<Env>;
