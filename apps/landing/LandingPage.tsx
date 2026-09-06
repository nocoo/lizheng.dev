import type { LandingContent } from "../../packages/content/model";
import {
	SurfaceFooter,
	SurfaceHeader,
} from "../../packages/experience/SurfaceChrome";
import { DeviceGallery } from "./DeviceGallery";

export function LandingPage({ content }: { content: LandingContent }) {
	const { locale } = content;
	const zh = locale === "zh";

	return (
		<>
			<a className="skip-link" href="#screen">
				{zh ? "跳到个人信息与链接" : "Skip to profile and links"}
			</a>
			<SurfaceHeader content={content} />
			<main id="main" className="landing-main">
				<div className="landing-intro">
					<div className="intro-kicker" lang="en">
						<span className="tiny-square" />
						ZHENG LI / PERSONAL WEBSITE
					</div>
					<h1>
						{zh ? (
							<>
								你好<span className="headline-period">，</span>
								<br />
								<span className="outline-word">我是李征</span>
								<span className="headline-period">。</span>
							</>
						) : (
							<>
								A little <br />
								<span className="outline-word">bit of me</span>
								<span className="headline-period">.</span>
							</>
						)}
					</h1>
					<p className="intro-description">
						{zh ? (
							<>
								软件工程与团队管理。
								<br />
								Web、移动、数据与 AI。
							</>
						) : (
							<>
								Software engineering and team leadership. <br />
								Web, mobile, data and AI.
							</>
						)}
					</p>
					<p className="intro-story">{content.journey.story}</p>
					<div className="intro-invitation">
						<span className="invitation-line" />
						<span>
							{zh
								? "点击屏幕，访问我的链接。"
								: "Open a link on the device screen."}
						</span>
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
					<details className="journey-directory">
						<summary>
							<h2>{content.journey.title}</h2>
						</summary>
						<ol>
							{content.journey.chapters.map((chapter) => (
								<li key={chapter.id}>
									<h3>
										{chapter.name} <span lang="en">· {chapter.chapter}</span>
									</h3>
									<p>{chapter.description}</p>
								</li>
							))}
						</ol>
					</details>
				</div>
				<DeviceGallery content={content} />
			</main>
			<SurfaceFooter content={content} />
		</>
	);
}
