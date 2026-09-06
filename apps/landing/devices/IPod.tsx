import { useEffect, useRef } from "react";
import { setupClickWheel } from "../../../packages/experience/click-wheel";
import { Battery, DeviceAbout, DeviceLinks, type DeviceProps } from "./shared";

export function IPod(props: DeviceProps) {
	const { content, state, active, dispatch, openSelected } = props;
	const zh = content.locale === "zh";
	const wheel = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (wheel.current)
			return setupClickWheel(wheel.current, (delta) =>
				dispatch({ type: "move", delta }),
			);
	}, [dispatch]);
	return (
		<div className="hardware-position ipod-position">
			<div className="ipod-device device-object" data-console data-device-shell>
				<div className="ipod-top-edge" aria-hidden="true">
					<div className="ipod-hold">
						<span />
						HOLD
					</div>
					<i className="ipod-headphone-jack" />
				</div>
				<section
					id={active ? "screen" : undefined}
					className={`ipod-screen native-screen panel-${state.panel}`}
					aria-label={
						zh ? "iPod 屏幕，个人信息与链接" : "iPod screen, profile and links"
					}
				>
					<div className="ipod-status">
						<strong>
							{state.panel === "about"
								? zh
									? "正在播放"
									: "Now playing"
								: zh
									? "李征的 iPod"
									: "Zheng’s iPod"}
						</strong>
						<span aria-hidden="true">▶</span>
						<Battery />
					</div>
					<div className="ipod-screen-content" key={state.boot}>
						<div className="ipod-split">
							<div className="ipod-library">
								<span className="ipod-library-label">
									{zh ? "我的世界" : "My world"}
								</span>
								<DeviceLinks {...props} />
							</div>
							<div className="ipod-artwork">
								<div className="ipod-cover">
									<img
										src="/design-assets/portrait-dither.png"
										width="64"
										height="72"
										alt=""
									/>
									<span aria-hidden="true">VOL. 01</span>
								</div>
								<h2>{zh ? "李征" : content.meta.name}</h2>
								<p className="native-role">{content.meta.role}</p>
							</div>
						</div>
						<p className="native-bio">{content.intro}</p>
						<DeviceAbout {...props} />
					</div>
				</section>
				<div className="ipod-wheel" ref={wheel}>
					<button
						type="button"
						className="ipod-menu"
						data-control="back"
						aria-label={zh ? "Menu：返回主菜单" : "Menu: Return to menu"}
						onClick={() => dispatch({ type: "back" })}
					>
						MENU
					</button>
					<button
						type="button"
						className="ipod-previous"
						data-control="up"
						aria-label={zh ? "上一个链接" : "Previous link"}
						onClick={() => dispatch({ type: "move", delta: -1 })}
					>
						Ⅰ◀◀
					</button>
					<button
						type="button"
						className="ipod-next"
						data-control="down"
						aria-label={zh ? "下一个链接" : "Next link"}
						onClick={() => dispatch({ type: "move", delta: 1 })}
					>
						▶▶Ⅰ
					</button>
					<button
						type="button"
						className="ipod-play"
						data-control="select"
						aria-label={
							zh ? "播放：切换个人页面" : "Play: Switch profile screen"
						}
						onClick={() => dispatch({ type: "select" })}
					>
						▶Ⅱ
					</button>
					<button
						type="button"
						className="ipod-center"
						data-control="open"
						aria-label={
							zh ? "确认：打开选中的链接" : "Select: Open selected link"
						}
						onClick={openSelected}
					/>
				</div>
				<div className="ipod-bottom" aria-hidden="true">
					iPod <span>CLASSIC</span>
				</div>
			</div>
		</div>
	);
}
