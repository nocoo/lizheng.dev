import type { PageContent } from "../content/model";
import { Brand } from "./Brand";
import { Preferences } from "./Preferences";
import { surfaceLinks } from "./surface-links";

function SurfaceLinks({ content }: { content: PageContent }) {
	const { locale, surface, origins } = content;
	const links = surfaceLinks(locale, surface, origins);
	return (
		<nav
			className="surface-links"
			aria-label={locale === "zh" ? "访问面" : "Surfaces"}
		>
			{links.map((link) => (
				<a
					key={link.id}
					href={link.href}
					data-surface-link={link.id}
					aria-current={link.id === surface ? "true" : undefined}
					lang={locale === "zh" ? "zh-CN" : "en"}
				>
					{link.name}
				</a>
			))}
		</nav>
	);
}

export function SurfaceHeader({ content }: { content: PageContent }) {
	return (
		<header className="site-header">
			<div className="site-header-inner">
				<Brand locale={content.locale} />
				<SurfaceLinks content={content} />
				<Preferences locale={content.locale} />
			</div>
		</header>
	);
}

function LocationSignature() {
	return (
		<span className="location-signature" lang="en">
			<span className="location-dot" aria-hidden="true" />
			MADE IN BEIJING
		</span>
	);
}

export function SurfaceFooter({ content }: { content: PageContent }) {
	const compact = content.surface === "landing";
	return (
		<footer className={`site-footer${compact ? " site-footer-compact" : ""}`}>
			<div className="site-footer-inner">
				<div className="site-footer-body">
					<div className="site-footer-identity">
						<Brand locale={content.locale} />
						<p lang="en">
							{content.meta.copyright.replace("{year}", content.year)}
						</p>
					</div>
					{compact && <LocationSignature />}
					<nav
						className="public-formats"
						aria-label={
							content.locale === "zh" ? "阅读格式" : "Reading formats"
						}
					>
						<a href={`/${content.locale}/content.md`} lang="en">
							Markdown
						</a>
						<a href="/llms.txt" lang="en">
							llms.txt
						</a>
					</nav>
				</div>
			</div>
			{!compact && (
				<div className="site-footer-bottom">
					<div className="site-footer-inner">
						<LocationSignature />
						<span className="footer-curiosity" lang="en">
							BUILT WITH CURIOSITY.
						</span>
						<a href="#main">
							{content.locale === "zh" ? "返回顶部" : "Back to top"}
							<span aria-hidden="true">↑</span>
						</a>
					</div>
				</div>
			)}
		</footer>
	);
}
