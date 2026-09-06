// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import {
	documentKeepsake,
	keepsakeIds,
	setupKeepsakes,
} from "../../packages/experience/keepsakes";

afterEach(() => {
	vi.restoreAllMocks();
});

it("chooses every device family across fresh documents", () => {
	const random = vi.spyOn(Math, "random");
	for (const [index, id] of keepsakeIds.entries()) {
		const doc = document.implementation.createHTMLDocument();
		random.mockReturnValue((index + 0.5) / keepsakeIds.length);
		expect(documentKeepsake(doc)).toBe(id);
		expect(doc.documentElement.dataset.keepsake).toBe(id);
	}
	expect(new Set(keepsakeIds).size).toBe(6);
});

it("retains one choice through remounts, reinitialization and DOM changes", () => {
	const doc = document.implementation.createHTMLDocument();
	const random = vi.spyOn(Math, "random").mockReturnValue(0.7);
	const first = documentKeepsake(doc);
	random.mockReturnValue(0);
	doc.body.innerHTML =
		'<img data-keepsake-image src="/design-assets/keepsakes/gameboy.svg" alt="">';
	setupKeepsakes(doc);
	expect(documentKeepsake(doc)).toBe(first);
	expect(doc.querySelector("img")?.getAttribute("src")).toBe(
		`/design-assets/keepsakes/${first}.svg`,
	);
	setupKeepsakes(doc);
	expect(random).toHaveBeenCalledTimes(1);
});

it("replaces invalid scene identifiers instead of using them in asset URLs", () => {
	const doc = document.implementation.createHTMLDocument();
	doc.documentElement.dataset.keepsake = "../../invalid";
	vi.spyOn(Math, "random").mockReturnValue(0);
	expect(documentKeepsake(doc)).toBe("gameboy");
	setupKeepsakes(doc);
});
