import manifest from "../package.json" with { type: "json" };

for (const host of [
	"lizheng.dev",
	"www.lizheng.dev",
	"lizheng.me",
	"www.lizheng.me",
]) {
	let verified = false;
	for (let attempt = 0; attempt < 6; attempt++) {
		try {
			const response = await fetch(`https://${host}/api/live`, {
				redirect: "manual",
				signal: AbortSignal.timeout(10000),
			});
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
		const page = await fetch(`https://${host}/${locale}/`, {
			signal: AbortSignal.timeout(10000),
		});
		const html = (await page.text()).replace(/<!--.*?-->/g, "");
		if (!page.ok || !html.includes(`v${manifest.version}`))
			throw new Error(`Missing versioned page: ${host}/${locale}`);
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
