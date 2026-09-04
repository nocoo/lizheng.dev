import { useState } from "react";
import type { PageContent } from "../../packages/content/model";
import { Brand } from "../../packages/experience/Brand";
import {
	activate,
	type HandheldAction,
	initialHandheld,
	transition,
} from "../../packages/experience/handheld";
import { Icon } from "../../packages/experience/Icons";
import { Preferences } from "../../packages/experience/Preferences";

function PixelStar({ className = "" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M10 0h4v6h4v4h6v4h-6v4h-4v6h-4v-6H6v-4H0v-4h6V6h4Z" />
		</svg>
	);
}

export function LandingPage({ content }: { content: PageContent }) {
	const { locale, meta, links, intro } = content;
	const zh = locale === "zh";
	const [state, setState] = useState(initialHandheld);
	const { selected, panel, boot } = state;
	const dispatch = (action: HandheldAction) =>
		setState((current) => transition(current, action, links.length));
	const move = (delta: number) => dispatch({ type: "move", delta });
	const setSelected = (index: number) => dispatch({ type: "focus", index });
	const openSelected = () => activate(state, () => dispatch({ type: "back" }));

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
					<div className="intro-invitation" lang="en">
						<span className="invitation-line" />
						<span>A familiar feeling. A new adventure.</span>
					</div>
					<div className="desktop-instructions">
						<span className="keyboard-keys" aria-hidden="true">
							<kbd>↑</kbd>
							<kbd>↓</kbd>
							<kbd>↵</kbd>
						</span>
						<p>
							{zh
								? "用方向键探索，Enter 打开"
								: "Use the arrows. Follow your curiosity."}
							<br />
							<span>
								{zh
									? "也可以直接点击屏幕里的链接"
									: "Or tap any link on the screen."}
							</span>
						</p>
					</div>
				</div>
				<div className="console-scene">
					<div className="scene-halo" />
					<div className="orbit-label" lang="en">
						<span />
						REBUILDING FOR THE NEXT ERA
					</div>
					<div className="console-position">
						<div className="console-shell" data-console>
							<div className="shell-top-edge" aria-hidden="true">
								<span>◁ OFF · ON ▷</span>
								<div className="power-switch" />
							</div>
							<div className="shell-seam" aria-hidden="true" />
							<div className="screen-bezel">
								<div className="bezel-heading" aria-hidden="true">
									<span />
									<p>DOT MATRIX / PERSONAL SYSTEM</p>
									<span />
								</div>
								<div className="power-indicator" aria-hidden="true">
									<i />
									<span>BATTERY</span>
								</div>
								<section
									id="screen"
									className={`lcd-screen panel-${panel}`}
									aria-label={
										zh
											? "掌机屏幕，个人信息与链接"
											: "Handheld screen, profile and links"
									}
								>
									<div className="lcd-content" key={boot}>
										<div className="lcd-status">
											<span>
												<PixelStar /> HELLO, WORLD!
											</span>
											<span
												className="pixel-battery"
												role="img"
												aria-label={zh ? "电量充足" : "Full battery"}
											>
												<i />
												<i />
												<i />
											</span>
										</div>
										<div className="lcd-identity">
											<img
												src="/design-assets/portrait-dither.png"
												width="64"
												height="72"
												alt={meta.name}
												fetchPriority="high"
											/>
											<div>
												<span className="lcd-eyebrow">{meta.eyebrow}</span>
												<h2>
													{zh ? "李征" : "Zheng Li"}
													<span className="lcd-cursor" aria-hidden="true">
														_
													</span>
												</h2>
												<p>{meta.role}</p>
											</div>
										</div>
										<p className="lcd-bio">{intro}</p>
										<nav
											className="lcd-links"
											aria-label={zh ? "探索我的链接" : "Explore my links"}
										>
											{links.map((link, index) => (
												<a
													key={link.href}
													href={link.href}
													data-screen-link={index}
													data-surface-link={index === 1 ? "resume" : undefined}
													className={index === selected ? "is-selected" : ""}
													onFocus={() => setSelected(index)}
													onMouseEnter={() => setSelected(index)}
												>
													<span className="link-selector" aria-hidden="true">
														{index === selected ? "▶" : "·"}
													</span>
													<span>{link.label}</span>
													<span className="lcd-link-arrow" aria-hidden="true">
														↗
													</span>
												</a>
											))}
										</nav>
										<div className="lcd-about" aria-hidden={panel !== "about"}>
											<PixelStar />
											<p lang="en">STAY CURIOUS.</p>
											<span>
												{zh
													? "每一个系统，都值得认真迭代。"
													: "Every system deserves thoughtful iteration."}
											</span>
											<small>{zh ? "按 B 返回" : "PRESS B TO RETURN"}</small>
										</div>
										<div className="lcd-footer" lang="en">
											<span>
												{panel === "home" ? "01 / EXPLORE" : "02 / PHILOSOPHY"}
											</span>
											<span>SELECT · EXPLORE</span>
										</div>
									</div>
									<div className="lcd-glass" aria-hidden="true" />
								</section>
							</div>
							<div className="shell-brand" aria-hidden="true">
								<strong>zheng li</strong>
								<span>PERSONAL SYSTEM</span>
								<i>01</i>
							</div>
							<div className="physical-controls">
								<div className="dpad-surround">
									<div className="dpad">
										<button
											type="button"
											className="dpad-up"
											aria-label={zh ? "上一个链接" : "Previous link"}
											onClick={() => move(-1)}
										>
											<span />
										</button>
										<button
											type="button"
											className="dpad-left"
											aria-label={zh ? "上一个页面" : "Previous screen"}
											onClick={() => dispatch({ type: "select" })}
										>
											<span />
										</button>
										<div className="dpad-center" aria-hidden="true">
											<i />
										</div>
										<button
											type="button"
											className="dpad-right"
											aria-label={zh ? "下一个页面" : "Next screen"}
											onClick={() => dispatch({ type: "select" })}
										>
											<span />
										</button>
										<button
											type="button"
											className="dpad-down"
											aria-label={zh ? "下一个链接" : "Next link"}
											onClick={() => move(1)}
										>
											<span />
										</button>
									</div>
								</div>
								<div className="action-buttons">
									<div>
										<button
											type="button"
											className="button-b"
											aria-label={zh ? "B：返回" : "B: Back"}
											onClick={() => dispatch({ type: "back" })}
										/>
										<span>B</span>
									</div>
									<div>
										<button
											type="button"
											className="button-a"
											aria-label={
												zh ? "A：打开选中的链接" : "A: Open selected link"
											}
											onClick={openSelected}
										/>
										<span>A</span>
									</div>
								</div>
							</div>
							<div className="system-buttons">
								<div>
									<button
										type="button"
										aria-label={
											zh ? "Select：切换屏幕" : "Select: Switch screen"
										}
										onClick={() => dispatch({ type: "select" })}
									/>
									<span>SELECT</span>
								</div>
								<div>
									<button
										type="button"
										aria-label={
											zh ? "Start：重新开始" : "Start: Restart presentation"
										}
										onClick={() => dispatch({ type: "start" })}
									/>
									<span>START</span>
								</div>
							</div>
							<div className="speaker-grille" aria-hidden="true">
								{[0, 1, 2, 3, 4, 5].map((slot) => (
									<i key={slot} />
								))}
							</div>
							<div className="shell-bottom-mark" aria-hidden="true">
								STEREO SOUND <span>••</span>
							</div>
						</div>
					</div>
					<div className="console-caption" lang="en">
						<span className="caption-dot" />
						<p>OLD-SCHOOL SOUL. NEXT-CHAPTER MIND.</p>
						<span className="caption-edition">ZL–001</span>
					</div>
				</div>
			</main>
			<footer className="landing-footer" lang="en">
				<span>{meta.copyright.replace("{year}", content.year)}</span>
				<span className="footer-location">
					<span className="location-dot" />
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
