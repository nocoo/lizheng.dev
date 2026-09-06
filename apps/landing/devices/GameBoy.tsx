import type { DeviceProps } from "./shared";

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

export function GameBoy({
	content,
	state,
	dispatch,
	openSelected,
	active,
}: DeviceProps) {
	const { locale, meta, links, intro } = content;
	const zh = locale === "zh";
	const { selected, panel, boot } = state;
	const move = (delta: number) => dispatch({ type: "move", delta });
	const setSelected = (index: number) => dispatch({ type: "focus", index });
	return (
		<div className="console-position">
			<div className="console-shell" data-console data-device-shell>
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
						id={active ? "screen" : undefined}
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
										<span className="lcd-cursor" aria-hidden="true" />
									</h2>
									<p>{meta.role}</p>
								</div>
							</div>
							<p className="lcd-bio">{intro}</p>
							<nav
								className="lcd-links"
								aria-label={zh ? "个人链接" : "Profile links"}
							>
								{links.map((link, index) => (
									<a
										key={link.href}
										href={link.href}
										data-screen-link={index}
										data-surface-link={index === 1 ? "resume" : undefined}
										className={index === selected ? "is-selected" : ""}
										onFocus={() => setSelected(index)}
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
								<p lang="en">ABOUT THIS PAGE</p>
								<span>
									{zh
										? "这里汇集了我的博客、简历和公开主页。"
										: "Links to my blog, résumé and public profiles."}
								</span>
								<small>{zh ? "按 B 返回" : "PRESS B TO RETURN"}</small>
							</div>
							<div className="lcd-footer" lang="en">
								<span>{panel === "home" ? "01 / LINKS" : "02 / ABOUT"}</span>
								<span>SELECT · SWITCH</span>
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
								aria-label={zh ? "A：打开选中的链接" : "A: Open selected link"}
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
							aria-label={zh ? "Select：切换屏幕" : "Select: Switch screen"}
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
	);
}
