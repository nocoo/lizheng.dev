import type { Locale } from "../content/model";
import { Icon } from "./Icons";
import { themeLabel } from "./theme";

export function Preferences({ locale }: { locale: Locale }) {
	const other = locale === "en" ? "zh" : "en";
	const languageLabel = locale === "zh" ? "切换为英文" : "Switch to Chinese";
	return (
		<div className="preferences">
			<nav
				className="languages"
				aria-label={locale === "zh" ? "语言" : "Language"}
			>
				<a
					className="icon-toggle"
					href={`/${other}/`}
					lang={other === "zh" ? "zh-CN" : "en"}
					hrefLang={other === "zh" ? "zh-CN" : "en"}
					aria-label={languageLabel}
					title={languageLabel}
				>
					<Icon name="languages" />
				</a>
			</nav>
			<button
				className="theme-toggle icon-toggle"
				type="button"
				data-theme-toggle
				data-theme-locale={locale}
				suppressHydrationWarning
				aria-label={themeLabel(locale, "light")}
				title={themeLabel(locale, "light")}
			>
				<Icon name="sun" className="theme-sun" />
				<Icon name="moon" className="theme-moon" />
			</button>
		</div>
	);
}
