import type { Page } from "@playwright/test";

export async function chooseKeepsake(page: Page, id: string) {
	// Set the ordinary document preference before the client reads it. The
	// production random source remains covered on fresh documents in L1.
	await page.addInitScript((choice) => {
		const apply = () => {
			if (!document.documentElement) return false;
			document.documentElement.dataset.keepsake = choice;
			return true;
		};
		if (!apply()) {
			const observer = new MutationObserver(() => {
				if (apply()) observer.disconnect();
			});
			observer.observe(document, { childList: true });
		}
	}, id);
}
