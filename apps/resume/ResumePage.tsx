import type { PageContent } from "../../packages/content/model";
import { Brand } from "../../packages/experience/Brand";
import { Icon } from "../../packages/experience/Icons";
import { Preferences } from "../../packages/experience/Preferences";
import { Version } from "../../packages/experience/Version";
import { Markdown } from "./Markdown";

export function ResumePage({ content }: { content: PageContent }) {
	const { locale, meta, sections, links } = content;
	const zh = locale === "zh";
	return (
		<>
			<a className="skip-link" href="#main">
				{zh ? "跳到正文" : "Skip to content"}
			</a>
			<header className="resume-topbar">
				<Brand locale={locale} />
				<div className="resume-topbar-right">
					<a
						className="personal-link"
						href={`${content.origins?.landing ?? "https://lizheng.me"}/${locale}/`}
						data-surface-link="landing"
					>
						{zh ? "另一面的我" : "The playful side"}
						<Icon name="arrow" />
					</a>
					<Preferences locale={locale} />
				</div>
			</header>
			<main id="main" className="resume-layout">
				<aside className="resume-sidebar">
					<div className="sidebar-inner">
						<span className="index-label" lang="en">
							CURRICULUM VITAE
						</span>
						<div className="sidebar-rule" />
						<nav aria-label={zh ? "章节导航" : "On this page"}>
							{sections.map((section, index) => (
								<a key={section.id} href={`#${section.id}`}>
									<span>{String(index + 1).padStart(2, "0")}</span>
									{section.title}
								</a>
							))}
						</nav>
						<button type="button" className="print-button" data-print>
							<Icon name="print" />
							{zh ? "打印 / PDF" : "Print / PDF"}
						</button>
						<p className="sidebar-location">
							<span className="location-signature" lang="en">
								<span className="location-dot" aria-hidden="true" />
								MADE IN BEIJING
							</span>
							<br />
							39.90° N · 116.40° E
						</p>
					</div>
				</aside>
				<div className="resume-document">
					<div className="resume-hero">
						<p className="resume-eyebrow" lang="en">
							<span />
							ENGINEERING · LEADERSHIP · CURIOSITY
						</p>
						<div className="identity-row">
							<div>
								<h1>
									{meta.name}
									<span>.</span>
								</h1>
								<p className="resume-role">
									Principal Software
									<br className="role-break" /> Engineering Manager
									<br />
									<span>@ Microsoft</span>
								</p>
							</div>
							<div className="portrait-frame">
								<img
									src="/design-assets/portrait.webp"
									width="128"
									height="152"
									alt={meta.name}
									fetchPriority="high"
								/>
								<span className="portrait-caption">ZHENG LI / 李征</span>
								<img
									className="resume-keepsake"
									src="/design-assets/capsule.svg"
									width="42"
									height="48"
									alt=""
									aria-hidden="true"
								/>
							</div>
						</div>
						<p className="resume-tagline">{meta.tagline}</p>
						<div className="resume-socials">
							{links.map((link) => (
								<a key={link.href} href={link.href}>
									{new URL(link.href).hostname
										.replace(".com", "")
										.replace("lizheng.", "")
										.replace("x", "X")}
									<Icon name="arrow" />
								</a>
							))}
						</div>
					</div>
					{sections.map((section, index) => (
						<section
							key={section.id}
							id={section.id}
							className={`resume-section section-${section.id}`}
						>
							<div className="section-heading">
								<span className="section-number">
									{String(index + 1).padStart(2, "0")}
								</span>
								<h2>{section.title}</h2>
								<span className="section-rule" />
							</div>
							<div className="resume-prose">
								<Markdown tokens={section.tokens} />
							</div>
						</section>
					))}
					<footer className="resume-footer">
						<p lang="en">
							{meta.copyright.replace("{year}", content.year)}
							<Version />
						</p>
						<a href="#main">
							{zh ? "回到顶部" : "Back to top"}
							<span aria-hidden="true">↑</span>
						</a>
					</footer>
				</div>
			</main>
		</>
	);
}
