import type { Locale } from "../content/model";
import { Icon } from "./Icons";
import { themeLabel } from "./theme";

export function Preferences({ locale }: { locale: Locale }) {
	return (
		<div className="preferences">
			<nav
				className="languages"
				aria-label={locale === "zh" ? "语言" : "Language"}
			>
				<a
					href="/en/"
					lang="en"
					hrefLang="en"
					aria-current={locale === "en" ? "page" : undefined}
				>
					EN
				</a>
				<span aria-hidden="true">/</span>
				<a
					href="/zh/"
					lang="zh-CN"
					hrefLang="zh-CN"
					aria-current={locale === "zh" ? "page" : undefined}
				>
					中文
				</a>
			</nav>
			<button
				className="theme-toggle"
				type="button"
				data-theme-toggle
				data-theme-locale={locale}
				suppressHydrationWarning
				aria-label={themeLabel(locale, "system")}
				title={themeLabel(locale, "system")}
			>
				<Icon name="system" className="theme-system" />
				<Icon name="sun" className="theme-sun" />
				<Icon name="moon" className="theme-moon" />
			</button>
		</div>
	);
}
