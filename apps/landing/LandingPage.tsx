import type { PageContent } from "../../packages/content/model";
import { Brand } from "../../packages/experience/Brand";
import { Icon } from "../../packages/experience/Icons";
import { Preferences } from "../../packages/experience/Preferences";
import { Version } from "../../packages/experience/Version";
import { DeviceGallery } from "./DeviceGallery";

export function LandingPage({ content }: { content: PageContent }) {
	const { locale, meta } = content;
	const zh = locale === "zh";

	return (
		<>
			<a className="skip-link" href="#screen">
				{zh ? "跳到个人信息与链接" : "Skip to profile and links"}
			</a>
			<header className="landing-header">
				<Brand locale={locale} />
				<span className="header-edition">PERSONAL SPACE — VOL. 01</span>
				<div className="landing-header-right">
					<a
						className="resume-link"
						href={`${content.origins?.resume ?? "https://lizheng.dev"}/${locale}/`}
						data-surface-link="resume"
					>
						{zh ? "简历" : "Résumé"}
						<Icon name="arrow" />
					</a>
					<Preferences locale={locale} />
				</div>
			</header>
			<main className="landing-main">
				<div className="landing-intro">
					<div className="intro-kicker" lang="en">
						<span className="tiny-square" />
						PLAYER 01 / ZHENG LI
					</div>
					<h1>
						{zh ? (
							<>
								保持好奇<span className="headline-period">.</span>
								<br />
								<span className="outline-word">继续探索</span>
							</>
						) : (
							<>
								A little
								<br />
								<span className="outline-word">bit of me</span>
								<span className="headline-period">.</span>
							</>
						)}
					</h1>
					<p className="intro-description">
						{zh ? (
							<>
								工程师的理性。
								<br />
								探索者的好奇心。
							</>
						) : (
							<>
								An engineer’s mind.
								<br />
								An explorer’s curiosity.
							</>
						)}
					</p>
					<p className="intro-story">
						{zh
							? "凭着喜欢，把一些东西带在身边。久而久之，连看世界的方式也有了它们的影子。旧物收着回忆，有些习惯与好奇，却一直随身。"
							: "I chose a few things to carry with me. In time, they left their own habits and curiosities behind. The screens may have gone quiet, but something of them is still in the way I see the world."}
					</p>
					<div className="intro-invitation" lang="en">
						<span className="invitation-line" />
						<span>A familiar feeling. A new adventure.</span>
					</div>
					<div className="desktop-instructions" id="device-keyboard-help">
						<dl className="keyboard-legend">
							<div>
								<dt className="keyboard-keys">
									<kbd>↑</kbd>
									<kbd>↓</kbd>
								</dt>
								<dd>{zh ? "选择屏幕菜单" : "Select a screen link"}</dd>
							</div>
							<div>
								<dt className="keyboard-keys">
									<kbd>←</kbd>
									<kbd>→</kbd>
								</dt>
								<dd>{zh ? "切换设备" : "Switch devices"}</dd>
							</div>
							<div>
								<dt className="keyboard-keys">
									<kbd className="key-enter">Enter ↵</kbd>
								</dt>
								<dd>{zh ? "打开选中链接" : "Open the selected link"}</dd>
							</div>
						</dl>
						<p>
							{zh
								? "也可以直接点击屏幕里的链接"
								: "Or tap any link on the screen."}
						</p>
					</div>
				</div>
				<DeviceGallery content={content} />
			</main>
			<footer className="landing-footer" lang="en">
				<span>
					{meta.copyright.replace("{year}", content.year)}
					<Version />
				</span>
				<span className="footer-location">
					<span className="location-dot" aria-hidden="true" />
					{meta.location}
					<span className="footer-time">UTC +08:00</span>
				</span>
				<a href="https://lizheng.blog/">
					The story continues
					<Icon name="arrow" />
				</a>
			</footer>
		</>
	);
}
