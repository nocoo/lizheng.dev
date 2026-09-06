import type { PageContent } from "../../packages/content/model";
import {
	SurfaceFooter,
	SurfaceHeader,
} from "../../packages/experience/SurfaceChrome";
import { DeviceGallery } from "./DeviceGallery";

export function LandingPage({ content }: { content: PageContent }) {
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
			<SurfaceFooter content={content} />
		</>
	);
}
