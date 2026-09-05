import "../../packages/experience/base.css";
import "./resume.css";
import { setupResume } from "../../packages/experience/resume";
import { setupPreferences } from "../../packages/experience/theme";

const cleanupPreferences = setupPreferences();
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
