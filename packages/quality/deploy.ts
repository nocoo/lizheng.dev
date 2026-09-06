interface Route {
	pattern: string;
	custom_domain?: boolean;
	zone_id?: string;
	zone_name?: string;
}
interface Domain {
	hostname: string;
	service: string;
}

export async function deployValidatedWorker(
	config: { name?: string; routes?: (string | Route)[] },
	credentials: { accountId?: string; apiToken?: string },
	execute: (command: string[]) => Promise<number>,
	request: (url: string, init: RequestInit) => Promise<Response>,
) {
	if (!credentials.accountId || !credentials.apiToken)
		throw new Error("Missing Cloudflare deployment credentials");
	if (!config.name || !config.routes?.length)
		throw new Error("Incomplete Worker deployment configuration");
	const customDomains = config.routes.filter(
		(route): route is Route =>
			typeof route !== "string" && route.custom_domain === true,
	);
	const zoneRoutes = config.routes
		.filter((route) => typeof route === "string" || !route.custom_domain)
		.map((route) => (typeof route === "string" ? route : route.pattern));
	if (!zoneRoutes.length)
		throw new Error("Missing zone routes in Worker deployment configuration");

	const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(credentials.accountId)}/workers/domains`;
	async function api<T>(url: string, method: "GET" | "PUT", body?: object) {
		const response = await request(url, {
			method,
			headers: {
				Authorization: `Bearer ${credentials.apiToken}`,
				"Content-Type": "application/json",
			},
			body: body ? JSON.stringify(body) : undefined,
			signal: AbortSignal.timeout(20000),
		});
		const error = new Error(
			`Cloudflare custom domains ${method} failed (HTTP ${response.status})`,
		);
		if (!response.ok) throw error;
		const payload = (await response.json().catch(() => null)) as {
			success: boolean;
			result?: T;
		} | null;
		if (payload?.success !== true || payload.result == null) throw error;
		return payload.result;
	}
	function verifyAssignment(domain: Domain, hostname: string) {
		if (domain.hostname !== hostname || domain.service !== config.name)
			throw new Error(`Unexpected custom domain assignment for ${hostname}`);
	}

	// Inspect before deploying, and never take another Worker's domain assignment.
	const missing: Route[] = [];
	for (const domain of customDomains) {
		const existing = await api<Domain[]>(
			`${endpoint}?hostname=${encodeURIComponent(domain.pattern)}`,
			"GET",
		);
		for (const entry of existing) verifyAssignment(entry, domain.pattern);
		if (!existing.length) missing.push(domain);
	}

	// Wrangler 4.129 checks zone routes even for Custom Domains. Limit that CLI
	// operation to zone routes, then use the account-scoped Custom Domains API.
	const code = await execute([
		"bunx",
		"wrangler",
		"deploy",
		".release-worker/index.js",
		"--no-bundle",
		"--routes",
		...zoneRoutes,
	]);
	if (code !== 0) throw new Error(`Worker deployment failed (exit ${code})`);
	for (const domain of missing) {
		const attached = await api<Domain>(endpoint, "PUT", {
			hostname: domain.pattern,
			service: config.name,
			zone_id: domain.zone_id,
			zone_name: domain.zone_name,
		});
		verifyAssignment(attached, domain.pattern);
	}
	return customDomains.map((domain) => domain.pattern);
}
