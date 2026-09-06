import { Battery, DeviceAbout, DeviceLinks, type DeviceProps } from "./shared";

function CourseMap() {
	return (
		<svg
			className="garmin-map"
			viewBox="0 0 240 180"
			preserveAspectRatio="xMidYMid slice"
			fill="none"
			aria-hidden="true"
		>
			<path fill="#d8e1c8" d="M0 0h240v180H0z" />
			<path
				fill="#bbd0b0"
				d="m0 0 90 0-8 42-24 15-14 48L0 85Zm156 0h84v56l-40 7-19-22ZM152 125l52-16 36 32v39H135Z"
			/>
			<path
				fill="#b6d0d2"
				d="m118 0-17 39 17 23-12 48 10 70h15l-13-70 13-47-16-27 15-36Z"
			/>
			<path
				stroke="#b5bda7"
				strokeWidth="12"
				d="m-12 138 84-68 169 57M24-5l61 104 83 87M190-5l-10 78-42 30-4 83"
			/>
			<path
				stroke="#f7f3e4"
				strokeWidth="8"
				d="m-12 138 84-68 169 57M24-5l61 104 83 87M190-5l-10 78-42 30-4 83"
			/>
			<path
				stroke="#f7f3e4"
				strokeWidth="3"
				d="m-5 31 78 16 90-26 40 82 39 7M0 164l67-35 43 17 120-71"
			/>
			<path
				className="course-line"
				stroke="#8e4265"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
				d="m36 145 48-48-24-45 84-23 35 43-39 32-5 48"
			/>
			<circle
				cx="36"
				cy="145"
				r="5"
				fill="#f8f8ed"
				stroke="#8e4265"
				strokeWidth="3"
			/>
			<path
				fill="#26557b"
				stroke="#fff"
				strokeWidth="2"
				d="m135 133 9 20-9-4-9 4Z"
			/>
			<g fill="#536348" fontSize="8" fontFamily="sans-serif">
				<text x="11" y="18">
					N ↑
				</text>
				<text x="186" y="167">
					EXPLORE
				</text>
			</g>
		</svg>
	);
}

export function Garmin(props: DeviceProps) {
	const { content, state, active, dispatch, openSelected } = props;
	const zh = content.locale === "zh";
	return (
		<div className="hardware-position garmin-position">
			<div
				className="garmin-device device-object"
				data-console
				data-device-shell
			>
				<div className="garmin-left-controls">
					<button
						type="button"
						data-control="select"
						aria-label={
							zh ? "页面：切换个人信息" : "Page: Switch profile screen"
						}
						onClick={() => dispatch({ type: "select" })}
					>
						⏻
					</button>
					<button
						type="button"
						data-control="up"
						aria-label={zh ? "上一个链接" : "Previous link"}
						onClick={() => dispatch({ type: "move", delta: -1 })}
					>
						▴
					</button>
					<button
						type="button"
						data-control="down"
						aria-label={zh ? "下一个链接" : "Next link"}
						onClick={() => dispatch({ type: "move", delta: 1 })}
					>
						▾
					</button>
				</div>
				<div className="garmin-right-controls">
					<button
						type="button"
						data-control="open"
						aria-label={
							zh ? "确认：打开选中的链接" : "Enter: Open selected link"
						}
						onClick={openSelected}
					>
						↵
					</button>
					<button
						type="button"
						data-control="back"
						aria-label={zh ? "返回" : "Back"}
						onClick={() => dispatch({ type: "back" })}
					>
						↶
					</button>
				</div>
				<div className="garmin-face">
					<div className="garmin-wordmark" aria-hidden="true">
						GARMIN<span>▲</span>
					</div>
					<section
						id={active ? "screen" : undefined}
						className={`garmin-screen native-screen panel-${state.panel}`}
						aria-label={
							zh ? "Edge 地图，个人信息与链接" : "Edge map, profile and links"
						}
					>
						<div className="garmin-status">
							<span aria-hidden="true">⌁ GPS</span>
							<strong>{zh ? "路线" : "ROUTE"}</strong>
							<Battery />
						</div>
						<div className="garmin-screen-content" key={state.boot}>
							<div className="garmin-profile">
								<span>{zh ? "骑行者" : "RIDER PROFILE"}</span>
								<h2>{zh ? "李征" : content.meta.name}</h2>
								<p className="native-role">{content.meta.role}</p>
							</div>
							<div className="garmin-map-area">
								<CourseMap />
								<span className="garmin-course-label">
									{zh ? "骑行路线" : "CYCLING ROUTE"}
								</span>
							</div>
							<p className="native-bio">{content.intro}</p>
							<DeviceLinks {...props} variant="waypoints" />
							<DeviceAbout {...props} />
						</div>
					</section>
					<span className="garmin-model" aria-hidden="true">
						EDGE <strong>540</strong>
					</span>
					<div className="garmin-bottom-controls">
						<button
							type="button"
							aria-label={zh ? "Lap：切换屏幕" : "Lap: Switch screen"}
							onClick={() => dispatch({ type: "select" })}
						>
							↶
						</button>
						<button
							type="button"
							aria-label={
								zh ? "Start：打开选中的链接" : "Start: Open selected link"
							}
							onClick={openSelected}
						>
							▶
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
