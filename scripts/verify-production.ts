import manifest from "../package.json" with { type: "json" };

async function fetchCanonical(host: string, path: string) {
	let response = await fetch(`https://${host}${path}`, {
		redirect: "manual",
		signal: AbortSignal.timeout(10000),
	});
	if (host.startsWith("www.")) {
		const target = `https://${host.slice(4)}${path}`;
		if (response.status !== 301 || response.headers.get("Location") !== target)
			throw new Error(`Canonical host regression: ${host}${path}`);
		response = await fetch(target, {
			redirect: "manual",
			signal: AbortSignal.timeout(10000),
		});
	}
	return response;
}

for (const host of [
	"lizheng.dev",
	"www.lizheng.dev",
	"lizheng.me",
	"www.lizheng.me",
]) {
	let verified = false;
	for (let attempt = 0; attempt < 6; attempt++) {
		try {
			const response = await fetchCanonical(host, "/api/live");
			const data = (await response.json()) as {
				version: string;
				surface: string;
			};
			if (
				response.status === 200 &&
				data.version === manifest.version &&
				data.surface === (host.endsWith(".me") ? "landing" : "resume")
			) {
				verified = true;
				break;
			}
		} catch {
			/* Retry while edge propagation completes. */
		}
		await Bun.sleep(5000);
	}
	if (!verified) throw new Error(`${host} did not serve v${manifest.version}`);
	for (const locale of ["en", "zh"]) {
		const page = await fetchCanonical(host, `/${locale}/`);
		const html = (await page.text()).replace(/<!--.*?-->/g, "");
		if (!page.ok || !html.includes(`v${manifest.version}`))
			throw new Error(`Missing versioned page: ${host}/${locale}`);
		if (
			!page.headers.get("Cache-Control")?.includes("no-transform") ||
			html.includes("https://static.cloudflareinsights.com/beacon.min.js")
		)
			throw new Error(`HTML transformation regression: ${host}/${locale}`);
		const schema =
			/<script type="application\/ld\+json">([^<]+)<\/script>/.exec(html)?.[1];
		if (
			!schema ||
			!JSON.parse(schema).mainEntity.sameAs.includes("https://hexly.ai/")
		)
			throw new Error(`Missing portfolio identity: ${host}/${locale}`);
		for (const color of ["#f0f0e9", "#1e2824"])
			if (!html.includes(`content="${color}"`))
				throw new Error(`Missing theme color: ${host}/${locale}`);
		if (!html.includes('rel="apple-touch-icon"'))
			throw new Error(`Missing touch icon link: ${host}/${locale}`);
	}
	for (const path of [
		"/favicon.ico",
		"/apple-touch-icon.png",
		"/apple-touch-icon",
		"/apple-touch-icon-precomposed.png",
	]) {
		const icon = await fetchCanonical(host, path);
		if (!icon.ok || !icon.headers.get("Content-Type")?.startsWith("image/"))
			throw new Error(`Missing browser icon: ${host}${path}`);
	}
	if (host.endsWith(".me")) {
		for (const path of [
			"/2024/01/post",
			"/category/tech",
			"/tag/js",
			"/archive",
			"/search",
			"/feed.xml",
			"/feed",
			"/page/2",
			"/preview/secret",
			"/sitemap.xml",
			"/admin",
			"/login",
		]) {
			const response = await fetch(`https://${host}${path}?ref=release`, {
				redirect: "manual",
				signal: AbortSignal.timeout(10000),
			});
			if (
				response.status !== 301 ||
				response.headers.get("Location") !==
					`https://lizheng.blog${path}?ref=release`
			)
				throw new Error(`301 regression: ${host}${path}`);
		}
	}
	console.info(
		`Verified ${host}: v${manifest.version}, both languages and applicable 301s.`,
	);
}

// The blog's alias shares the edge redirect Worker; its apex remains on Railway.
let blogAliasReady = false;
for (let attempt = 0; attempt < 18; attempt++) {
	try {
		for (const path of [
			"/",
			"/2026/09/article?q=%E4%BD%A0%20a&x=1&x=2",
			"/favicon.ico",
		]) {
			const response = await fetch(`https://www.lizheng.blog${path}`, {
				redirect: "manual",
				signal: AbortSignal.timeout(10000),
			});
			if (
				response.status !== 301 ||
				response.headers.get("Location") !== `https://lizheng.blog${path}`
			)
				throw new Error(`Blog alias regression: ${path}`);
		}
		blogAliasReady = true;
		break;
	} catch {
		// Allow DNS and the new custom-domain certificate to propagate.
		await Bun.sleep(5000);
	}
}
if (!blogAliasReady)
	throw new Error("www.lizheng.blog did not serve its canonical 301");
console.info(
	"Verified www.lizheng.blog: direct HTTPS 301 to the Railway blog apex.",
);
