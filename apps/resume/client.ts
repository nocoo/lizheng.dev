import "../../packages/experience/base.css";
import "./resume.css";
import { setupKeepsakes } from "../../packages/experience/keepsakes";
import { setupResume } from "../../packages/experience/resume";
import { setupPreferences } from "../../packages/experience/theme";

const cleanupPreferences = setupPreferences();
setupKeepsakes(document);
const cleanupResume = setupResume();
if (import.meta.hot) {
	const refresh = () => window.location.reload();
	import.meta.hot.on("resume:refresh", refresh);
	import.meta.hot.dispose(() => {
		cleanupPreferences();
		cleanupResume();
		import.meta.hot?.off("resume:refresh", refresh);
	});
}
