import type { Route } from "@playwright/test";
import { isTraksCollectScriptUrl } from "../../packages/publishing/traks-collect";
import { assertLocalRequest } from "../../packages/quality/isolation";

export function routeIsolatedRequest(route: Route) {
	const url = route.request().url();
	if (isTraksCollectScriptUrl(url)) {
		return route.fulfill({
			status: 200,
			contentType: "application/javascript; charset=utf-8",
			body: "",
		});
	}
	try {
		assertLocalRequest(url);
		return route.continue();
	} catch {
		return route.abort();
	}
}

export function routeIsolatedRequestWithoutMedia(route: Route) {
	const url = route.request().url();
	if (isTraksCollectScriptUrl(url)) {
		return route.fulfill({
			status: 200,
			contentType: "application/javascript; charset=utf-8",
			body: "",
		});
	}
	try {
		assertLocalRequest(url);
		return ["image", "font"].includes(route.request().resourceType())
			? route.abort()
			: route.continue();
	} catch {
		return route.abort();
	}
}
