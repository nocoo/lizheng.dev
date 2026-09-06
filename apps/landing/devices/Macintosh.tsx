import {
	DeviceAbout,
	DeviceLinks,
	type DeviceProps,
	RainbowApple,
} from "./shared";

export function Macintosh(props: DeviceProps) {
	const { content, state, active, dispatch, openSelected } = props;
	const zh = content.locale === "zh";
	return (
		<div className="hardware-position macintosh-position">
			<div
				className="macintosh-device device-object"
				data-console
				data-device-shell
			>
				<div className="mac-case">
					<div className="mac-top-vent" aria-hidden="true" />
					<div className="mac-crt-recess">
						<section
							id={active ? "screen" : undefined}
							className={`mac-screen native-screen panel-${state.panel}`}
							aria-label={
								zh
									? "Macintosh 桌面，个人信息与链接"
									: "Macintosh desktop, profile and links"
							}
						>
							<div className="mac-menubar">
								<span aria-hidden="true">◆</span>
								<button
									type="button"
									onClick={() => dispatch({ type: "select" })}
								>
									{zh ? "关于" : "About"}
								</button>
								<span>{zh ? "文件" : "File"}</span>
								<span>{zh ? "浏览" : "View"}</span>
								<span className="mac-menu-clock">ZL</span>
							</div>
							<div className="mac-desktop" key={state.boot}>
								<div className="mac-window">
									<div className="mac-titlebar">
										<button
											type="button"
											data-control="back"
											aria-label={zh ? "关闭关于窗口" : "Close about window"}
											onClick={() => dispatch({ type: "back" })}
										/>
										<strong>
											{state.panel === "about"
												? zh
													? "关于我"
													: "About me"
												: zh
													? "个人空间"
													: "Personal space"}
										</strong>
										<i />
									</div>
									<div className="mac-window-body">
										<div className="mac-profile">
											<img
												src="/design-assets/portrait-dither.png"
												width="64"
												height="72"
												alt={content.meta.name}
											/>
											<div>
												<span>{content.meta.eyebrow}</span>
												<h2>{zh ? "李征" : content.meta.name}</h2>
												<p className="native-role">{content.meta.role}</p>
											</div>
										</div>
										<p className="native-bio">{content.intro}</p>
										<DeviceLinks {...props} variant="desktop" />
										<DeviceAbout {...props} />
									</div>
									<div className="mac-window-status">
										<span>{zh ? "4 个项目" : "4 items"}</span>
										<span>{zh ? "保持好奇" : "Stay curious"}</span>
										<i />
									</div>
								</div>
							</div>
							<div className="mac-crt-glass" aria-hidden="true" />
						</section>
					</div>
					<div className="mac-badge" aria-hidden="true">
						<RainbowApple />
						<span>Macintosh Plus</span>
					</div>
					<div className="mac-floppy" aria-hidden="true">
						<span />
						<i />
					</div>
					<div className="mac-bottom-seam" aria-hidden="true" />
					<div className="mac-case-foot" aria-hidden="true" />
				</div>
				<div className="mac-cable" aria-hidden="true" />
				<div className="mac-keyboard">
					<div className="mac-keyboard-grid" aria-hidden="true">
						{[
							"esc 1 2 3 4 5 6 7 8 9 0 − +",
							"⇥ Q W E R T Y U I O P [ ]",
							"⇪ A S D F G H J K L ; ‘ ↩",
							"⇧ Z X C V B N M , . / shift",
						].map((row) => (
							<div key={row}>
								{row.split(" ").map((key) => (
									<span key={key}>{key}</span>
								))}
							</div>
						))}
					</div>
					<div className="mac-keyboard-controls">
						<button
							type="button"
							data-control="select"
							className="mac-command"
							aria-label={zh ? "Command：切换屏幕" : "Command: Switch screen"}
							onClick={() => dispatch({ type: "select" })}
						>
							⌘
						</button>
						<button
							type="button"
							data-control="open"
							className="mac-space"
							aria-label={
								zh ? "空格：打开选中的链接" : "Space: Open selected link"
							}
							onClick={openSelected}
						/>
						<button
							type="button"
							data-control="up"
							aria-label={zh ? "上一个链接" : "Previous link"}
							onClick={() => dispatch({ type: "move", delta: -1 })}
						>
							←
						</button>
						<button
							type="button"
							data-control="down"
							aria-label={zh ? "下一个链接" : "Next link"}
							onClick={() => dispatch({ type: "move", delta: 1 })}
						>
							→
						</button>
					</div>
				</div>
				<button
					type="button"
					className="mac-mouse"
					aria-label={zh ? "鼠标：打开选中的链接" : "Mouse: Open selected link"}
					onClick={openSelected}
				>
					<span />
				</button>
			</div>
		</div>
	);
}
