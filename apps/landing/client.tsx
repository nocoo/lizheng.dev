import { setupHandheld } from "../../packages/experience/handheld";
import "../../packages/experience/base.css";
import "./landing.css";
import "./devices.css";
import { hydrateRoot } from "react-dom/client";
import type { PageContent } from "../../packages/content/model";
import { setupPreferences } from "../../packages/experience/theme";
import { LandingPage } from "./LandingPage";

const data = document.getElementById("page-data");
const root = document.getElementById("app");
if (root && data?.textContent) {
	const content: PageContent = JSON.parse(data.textContent);
	hydrateRoot(root, <LandingPage content={content} />);
}
const cleanupPreferences = setupPreferences();
const cleanupHandheld = setupHandheld();
if (import.meta.hot)
	import.meta.hot.dispose(() => {
		cleanupPreferences();
		cleanupHandheld();
	});
