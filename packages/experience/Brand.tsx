import manifest from "../../package.json" with { type: "json" };

const { version } = manifest;

import type { Locale } from "../content/model";

export function Brand({ locale }: { locale: Locale }) {
	return (
		<span className="brand-lockup">
			<a className="brand-wordmark" href={`/${locale}/`} lang="en">
				<span className="brand-grid" aria-hidden="true">
					<i />
					<i />
					<i />
					<i />
				</span>
				zheng li<span className="brand-dot">.</span>
			</a>
			<span className="version-pill" title={`Version ${version}`}>
				v{version}
			</span>
		</span>
	);
}
