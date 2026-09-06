import type { PageContent } from "../content/model";
import { Brand } from "./Brand";
import { Preferences } from "./Preferences";
import { Version } from "./Version";

function SurfaceLinks({
	content,
	footer = false,
}: {
	content: PageContent;
	footer?: boolean;
}) {
	const { locale, surface, origins } = content;
	const links = [
		{
			id: "blog",
			name: "Journal",
			href: `${origins?.blog ?? "https://lizheng.blog"}/`,
		},
		{
			id: "landing",
			name: "Play",
			href: `${origins?.landing ?? "https://lizheng.me"}/${locale}/`,
		},
		{
			id: "resume",
			name: "Résumé",
			href: `${origins?.resume ?? "https://lizheng.dev"}/${locale}/`,
		},
	];
	return (
		<nav
			className="surface-links"
			aria-label={
				locale === "zh"
					? footer
						? "页脚访问面"
						: "访问面"
					: footer
						? "Footer surfaces"
						: "Surfaces"
			}
		>
			{links.map((link) => (
				<a
					key={link.id}
					href={link.id === surface ? `/${locale}/` : link.href}
					data-surface-link={link.id}
					aria-current={link.id === surface ? "true" : undefined}
					lang="en"
				>
					{link.name}
					{link.id !== surface && <span aria-hidden="true">↗</span>}
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
			<div className="site-footer-body">
				<div className="site-footer-identity">
					<Brand locale={content.locale} />
					<p lang="en">
						{content.meta.copyright.replace("{year}", content.year)}
						<Version />
					</p>
				</div>
				{compact && <LocationSignature />}
				<SurfaceLinks content={content} footer />
			</div>
			{!compact && (
				<div className="site-footer-bottom">
					<LocationSignature />
					<span className="footer-curiosity" lang="en">
						BUILT WITH CURIOSITY.
					</span>
					<a href="#main">
						{content.locale === "zh" ? "返回顶部" : "Back to top"}
						<span aria-hidden="true">↑</span>
					</a>
				</div>
			)}
		</footer>
	);
}
