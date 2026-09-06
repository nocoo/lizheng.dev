import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { HandheldAction } from "../../../packages/experience/handheld";
import { createRideInstruments } from "../../../packages/experience/ride-instruments";
import { DeviceAbout, DeviceLinks, type DeviceProps } from "./shared";

const tachSegments = Array.from({ length: 32 }, (_, index) => index);

export function Honda(props: DeviceProps) {
	const { content, state, active, dispatch, openSelected } = props;
	const zh = content.locale === "zh";
	const [instruments] = useState(createRideInstruments);
	const ride = useSyncExternalStore(
		instruments.subscribe,
		instruments.getSnapshot,
		instruments.getServerSnapshot,
	);
	useEffect(() => {
		if (!active) {
			instruments.stop();
			return;
		}
		const visibility = () => {
			if (document.hidden) instruments.stop();
		};
		document.addEventListener("visibilitychange", visibility);
		return () => {
			document.removeEventListener("visibilitychange", visibility);
			instruments.stop();
		};
	}, [active, instruments]);
	const navigate = useCallback(
		(action: HandheldAction) => {
			if (active) instruments.engage();
			dispatch(action);
		},
		[active, dispatch, instruments],
	);
	const open = () => {
		instruments.engage();
		openSelected();
	};
	return (
		<div className="hardware-position honda-position">
			<div
				className="honda-device device-object"
				data-console
				data-device-shell
			>
				<div className="honda-windscreen" aria-hidden="true" />
				<div className="honda-mount" aria-hidden="true" />
				<div className="honda-cluster">
					<i className="cluster-bolt bolt-one" aria-hidden="true" />
					<i className="cluster-bolt bolt-two" aria-hidden="true" />
					<i className="cluster-bolt bolt-three" aria-hidden="true" />
					<i className="cluster-bolt bolt-four" aria-hidden="true" />
					<div className="honda-top-label" aria-hidden="true">
						<span>◀</span>
						<strong>AFRICA TWIN</strong>
						<span>▶</span>
					</div>
					<section
						id={active ? "screen" : undefined}
						className={`honda-screen native-screen panel-${state.panel}`}
						aria-label={
							zh
								? "本田仪表，个人信息与链接"
								: "Honda instruments, profile and links"
						}
					>
						<div className="honda-tft-header">
							<strong lang="en">TOUR</strong>
							<span>{zh ? "个人旅程" : "PERSONAL JOURNEY"}</span>
							<span aria-hidden="true">☼</span>
						</div>
						<div
							className="honda-tachometer"
							aria-hidden="true"
							data-ride-rpm={ride.rpm}
						>
							<div className="tach-numbers">
								{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
									<span key={number}>{number}</span>
								))}
							</div>
							<div className="tach-segments">
								{tachSegments.map((segment) => (
									<i
										key={segment}
										className={
											segment < Math.round((ride.rpm / 10000) * 32)
												? "is-lit"
												: ""
										}
									/>
								))}
							</div>
							<small>×1000 r/min</small>
						</div>
						<div className="honda-tft-content" key={state.boot}>
							<div className="honda-riding-display" aria-hidden="true">
								<div className="honda-speed">
									<strong data-ride-speed>{ride.speed}</strong>
									<span>km/h</span>
								</div>
								<div className="honda-gear" data-gear={ride.gear}>
									<strong data-ride-gear>{ride.gear}</strong>
									<span>{ride.gear === "N" ? "NEUTRAL" : "DRIVE"}</span>
								</div>
								<div className="honda-compass">
									<span>N</span>
									<i />
									<small>ONWARD</small>
								</div>
							</div>
							<div className="honda-profile">
								<span className="honda-profile-label">
									{zh ? "骑士档案" : "RIDER PROFILE"}
								</span>
								<h2>{zh ? "李征" : content.meta.name}</h2>
								<p className="native-role">{content.meta.role}</p>
								<p className="native-bio">{content.intro}</p>
								<DeviceLinks {...props} dispatch={navigate} />
							</div>
							<DeviceAbout {...props} />
						</div>
						<div className="honda-tft-footer">
							<span aria-hidden="true">E ▰▰▰▰▰ F</span>
							<span lang="en">THE ROAD CONTINUES</span>
							<span aria-hidden="true">H ▰▰ C</span>
						</div>
					</section>
					<div className="honda-wordmark" aria-hidden="true">
						<svg viewBox="0 0 50 26" aria-hidden="true">
							<path
								fill="currentColor"
								d="M4 3 48 0 19 9Zm1 5 35-2-23 8Zm1 5 27-2-18 8Zm2 5 18-1-12 7Z"
							/>
						</svg>
						HONDA
					</div>
				</div>
				<div className="honda-secondary" aria-hidden="true">
					<span className="honda-indicator" data-ride-gear>
						{ride.gear}
					</span>
					<div>
						<strong data-ride-speed>{ride.speed}</strong>
						<small>km/h</small>
						<i>− − −</i>
					</div>
					<span>
						ABS
						<br />
						<small>◉</small>
					</span>
				</div>
				<div className="honda-switchgear">
					<div className="switchgear-label" aria-hidden="true">
						SELECT
					</div>
					<button
						type="button"
						className="honda-home"
						data-control="select"
						aria-label={
							zh ? "主页：切换个人屏幕" : "Home: Switch profile screen"
						}
						onClick={() => navigate({ type: "select" })}
					>
						⌂
					</button>
					<button
						type="button"
						className="honda-up"
						data-control="up"
						aria-label={zh ? "上一个链接" : "Previous link"}
						onClick={() => navigate({ type: "move", delta: -1 })}
					>
						▴
					</button>
					<button
						type="button"
						className="honda-enter"
						data-control="open"
						aria-label={zh ? "ENT：打开选中的链接" : "ENT: Open selected link"}
						onClick={open}
					>
						ENT
					</button>
					<button
						type="button"
						className="honda-down"
						data-control="down"
						aria-label={zh ? "下一个链接" : "Next link"}
						onClick={() => navigate({ type: "move", delta: 1 })}
					>
						▾
					</button>
					<button
						type="button"
						className="honda-back"
						data-control="back"
						aria-label={zh ? "返回" : "Back"}
						onClick={() => navigate({ type: "back" })}
					>
						↶
					</button>
				</div>
			</div>
		</div>
	);
}
