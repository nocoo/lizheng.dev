interface Env {
	ASSETS: Fetcher;
}

const COVER_HOSTS = new Set(["lizheng.me", "www.lizheng.me"]);

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const host = url.host.toLowerCase();

		if (COVER_HOSTS.has(host)) {
			const rewritten = new URL(request.url);
			const path = rewritten.pathname;

			if (path.startsWith("/cover/")) {
				return new Response("Not Found", { status: 404 });
			}

			rewritten.pathname = path === "/" ? "/cover/" : `/cover${path}`;
			return env.ASSETS.fetch(new Request(rewritten.toString(), request));
		}

		return env.ASSETS.fetch(request);
	},
};
