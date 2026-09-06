import { useState } from "react";
import { Battery, DeviceAbout, DeviceLinks, type DeviceProps } from "./shared";

const keypad = [
	["1", "●"],
	["2", "abc"],
	["3", "def"],
	["4", "ghi"],
	["5", "jkl"],
	["6", "mno"],
	["7", "pqrs"],
	["8", "tuv"],
	["9", "wxyz"],
	["*", "+"],
	["0", "⌂"],
	["#", "↵"],
] as const;

function Handset() {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="m6 3 4 4-2 3c1.2 2.5 3.5 4.8 6 6l3-2 4 4-3 3C9 21 3 15 3 7Z" />
		</svg>
	);
}

export function Nokia(props: DeviceProps) {
	const { content, state, active, dispatch, openSelected } = props;
	const zh = content.locale === "zh";
	const [open, setOpen] = useState(true);
	return (
		<div
			className={`hardware-position nokia-position${open ? " slider-open" : ""}`}
		>
			<div
				className="nokia-device device-object"
				data-console
				data-device-shell
			>
				<div className="nokia-back">
					<div className="nokia-keypad" inert={!open}>
						{keypad.map(([number, letters], index) => (
							<button
								type="button"
								key={number}
								aria-label={
									index < 4
										? `${number}: ${content.links[index]?.label}`
										: `${number}: ${zh ? "探索个人信息" : "Explore profile"}`
								}
								onClick={() =>
									index < 4
										? dispatch({ type: "focus", index })
										: number === "#"
											? openSelected()
											: number === "0"
												? dispatch({ type: "start" })
												: dispatch({ type: "select" })
								}
							>
								<span>{number}</span>
								<small>{letters}</small>
							</button>
						))}
					</div>
					<span className="nokia-base-label" aria-hidden="true">
						XpressMusic
					</span>
				</div>
				<div className="nokia-front">
					<div className="nokia-side-media">
						<button
							type="button"
							aria-label={zh ? "上一个链接" : "Previous link"}
							onClick={() => dispatch({ type: "move", delta: -1 })}
						>
							◂◂
						</button>
						<button
							type="button"
							aria-label={zh ? "打开选中的链接" : "Open selected link"}
							onClick={openSelected}
						>
							▶Ⅱ
						</button>
						<button
							type="button"
							aria-label={zh ? "下一个链接" : "Next link"}
							onClick={() => dispatch({ type: "move", delta: 1 })}
						>
							▸▸
						</button>
					</div>
					<div className="nokia-earpiece" aria-hidden="true" />
					<div className="nokia-wordmark" aria-hidden="true">
						NOKIA
					</div>
					<section
						id={active ? "screen" : undefined}
						className={`nokia-screen native-screen panel-${state.panel}`}
						aria-label={
							zh
								? "Nokia 屏幕，个人信息与链接"
								: "Nokia screen, profile and links"
						}
					>
						<div className="nokia-status">
							<span aria-hidden="true">▂▄▆█</span>
							<span lang="en">Personal</span>
							<Battery />
						</div>
						<div className="nokia-screen-content" key={state.boot}>
							<div className="nokia-profile">
								<span className="nokia-avatar" aria-hidden="true">
									ZL
								</span>
								<div>
									<span>{content.meta.eyebrow}</span>
									<h2>{zh ? "李征" : content.meta.name}</h2>
								</div>
							</div>
							<p className="native-role">{content.meta.role}</p>
							<p className="native-bio">{content.intro}</p>
							<DeviceLinks {...props} />
							<DeviceAbout {...props} />
						</div>
						<div className="nokia-soft-labels">
							<span>{zh ? "选项" : "Options"}</span>
							<strong>
								{state.panel === "about"
									? zh
										? "返回"
										: "Back"
									: zh
										? "选择"
										: "Select"}
							</strong>
							<span>{zh ? "返回" : "Back"}</span>
						</div>
					</section>
					<div className="nokia-navigation">
						<div className="nokia-soft-keys">
							<button
								type="button"
								data-control="select"
								aria-label={zh ? "选项：切换屏幕" : "Options: Switch screen"}
								onClick={() => dispatch({ type: "select" })}
							>
								—
							</button>
							<button
								type="button"
								className="nokia-call"
								aria-label={zh ? "呼叫：打开链接" : "Call: Open selected link"}
								onClick={openSelected}
							>
								<Handset />
							</button>
						</div>
						<div className="nokia-dpad">
							<button
								type="button"
								className="nokia-up"
								data-control="up"
								aria-label={zh ? "上一个链接" : "Previous link"}
								onClick={() => dispatch({ type: "move", delta: -1 })}
							/>
							<button
								type="button"
								className="nokia-down"
								data-control="down"
								aria-label={zh ? "下一个链接" : "Next link"}
								onClick={() => dispatch({ type: "move", delta: 1 })}
							/>
							<button
								type="button"
								className="nokia-center"
								data-control="open"
								aria-label={
									zh ? "确认：打开选中的链接" : "Select: Open selected link"
								}
								onClick={openSelected}
							>
								<span />
							</button>
						</div>
						<div className="nokia-soft-keys">
							<button
								type="button"
								data-control="back"
								aria-label={zh ? "返回" : "Back"}
								onClick={() => dispatch({ type: "back" })}
							>
								—
							</button>
							<button
								type="button"
								className="nokia-end"
								aria-label={zh ? "结束：返回主屏幕" : "End: Return home"}
								onClick={() => dispatch({ type: "start" })}
							>
								<Handset />
							</button>
						</div>
					</div>
					<button
						type="button"
						className="nokia-slide-grip"
						aria-label={
							open
								? zh
									? "合上滑盖"
									: "Close slider"
								: zh
									? "打开数字键盘"
									: "Open numeric keypad"
						}
						aria-expanded={open}
						onClick={() => setOpen(!open)}
					>
						<i />
						<i />
						<i />
					</button>
				</div>
			</div>
		</div>
	);
}
