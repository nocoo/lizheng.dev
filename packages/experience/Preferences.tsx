import type { Locale } from "../content/model";
import { Icon } from "./Icons";

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
				aria-pressed={false}
				suppressHydrationWarning
				aria-label={
					locale === "zh" ? "切换浅色与深色主题" : "Toggle light and dark theme"
				}
			>
				<Icon name="sun" className="theme-sun" />
				<Icon name="moon" className="theme-moon" />
			</button>
		</div>
	);
}
