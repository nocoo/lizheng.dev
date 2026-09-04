import type { Locale } from "../content/model";

export function Brand({ locale }: { locale: Locale }) {
	return (
		<a className="brand-wordmark" href={`/${locale}/`} lang="en">
			<span className="brand-grid" aria-hidden="true">
				<i />
				<i />
				<i />
				<i />
			</span>
			zheng li<span className="brand-dot">.</span>
		</a>
	);
}
