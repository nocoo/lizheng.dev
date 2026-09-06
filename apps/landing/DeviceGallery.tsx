import {
	type CSSProperties,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import type { LandingContent } from "../../packages/content/model";
import {
	createDeviceGallery,
	deviceChapters,
} from "../../packages/experience/device-gallery";
import { setupDeviceGallery } from "../../packages/experience/device-gallery-dom";
import {
	activate,
	type HandheldAction,
	initialHandheld,
	transition,
} from "../../packages/experience/handheld";
import { GameBoy } from "./devices/GameBoy";
import { Garmin } from "./devices/Garmin";
import { Honda } from "./devices/Honda";
import { IPod } from "./devices/IPod";
import { Macintosh } from "./devices/Macintosh";
import { Nokia } from "./devices/Nokia";
import { DeviceIcon, type DeviceProps } from "./devices/shared";
import { SceneAccessories } from "./SceneAccessories";

const sameScene = (previous: DeviceProps, next: DeviceProps) =>
	(!previous.active && !next.active) ||
	(previous.active === next.active &&
		previous.content === next.content &&
		previous.state === next.state &&
		previous.dispatch === next.dispatch &&
		previous.openSelected === next.openSelected);
const Accessories = memo(SceneAccessories);
const devices = {
	gameboy: memo(GameBoy, sameScene),
	nokia: memo(Nokia, sameScene),
	macintosh: memo(Macintosh, sameScene),
	ipod: memo(IPod, sameScene),
	garmin: memo(Garmin, sameScene),
	honda: memo(Honda, sameScene),
};

export function DeviceGallery({ content }: { content: LandingContent }) {
	const zh = content.locale === "zh";
	const root = useRef<HTMLElement>(null);
	const [gallery] = useState(createDeviceGallery);
	const snapshot = useSyncExternalStore(
		gallery.subscribe,
		gallery.getSnapshot,
		gallery.getServerSnapshot,
	);
	const [state, setState] = useState(initialHandheld);
	const [prepared, setPrepared] = useState(1);
	useEffect(() => {
		if (prepared === deviceChapters.length) return;
		const prepare = () => setPrepared((count) => count + 1);
		if (typeof window.requestIdleCallback === "function") {
			const id = window.requestIdleCallback(prepare);
			return () => window.cancelIdleCallback(id);
		}
		const id = window.setTimeout(prepare, 100);
		return () => window.clearTimeout(id);
	}, [prepared]);
	const dispatch = useCallback(
		(action: HandheldAction) =>
			setState((current) => transition(current, action, content.links.length)),
		[content.links.length],
	);
	const openSelected = useCallback(
		() => activate(state, () => dispatch({ type: "back" })),
		[state, dispatch],
	);
	useEffect(() => {
		if (root.current)
			return setupDeviceGallery(root.current, gallery, (index) =>
				dispatch({ type: "focus", index }),
			);
	}, [gallery, dispatch]);
	const current = content.journey.chapters[
		snapshot.index
	] as LandingContent["journey"]["chapters"][number];
	const layers = Array.from(
		new Set([
			...Array.from({ length: prepared }, (_, index) => index),
			...(snapshot.previous === null ? [] : [snapshot.previous]),
			snapshot.index,
		]),
	);
	const ready = snapshot.clockRevision > 0;
	return (
		<section
			className="device-gallery"
			ref={root}
			aria-label={zh ? "交互设备展示" : "Interactive devices"}
			aria-roledescription={zh ? "轮播" : "carousel"}
			aria-describedby="device-keyboard-help"
			aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter"
			data-gallery
			data-playing={snapshot.playing}
			data-running={snapshot.running}
		>
			<div className="journey-header" lang="en">
				<span>
					<i />
					SIX INTERACTIVE DEVICES
				</span>
				<span>PROFILE &amp; LINKS</span>
			</div>
			<div
				className="console-scene gallery-stage"
				role="tabpanel"
				id="device-display"
				aria-labelledby={`chapter-${current.id}`}
				style={{ "--direction": snapshot.direction } as CSSProperties}
			>
				{snapshot.previous !== null && (
					<div
						className="device-change-light"
						key={snapshot.revision}
						aria-hidden="true"
					/>
				)}
				<div className="stage-viewport">
					<div className="stage-space">
						<div className="scene-halo" aria-hidden="true" />
						<div className="stage-ground" aria-hidden="true" />
						<div className="orbit-label" lang="en">
							<span />
							SELECT A DEVICE
						</div>
						{layers.map((index) => {
							const chapter = deviceChapters[
								index
							] as (typeof deviceChapters)[number];
							const Device = devices[chapter.id];
							const active = index === snapshot.index;
							return (
								<div
									key={chapter.id}
									className={`device-layer layer-${chapter.id} ${active ? (snapshot.previous === null ? "is-current" : "is-entering") : index === snapshot.previous ? "is-exiting" : "is-cached"}`}
									data-device-active={active ? chapter.id : undefined}
									inert={!active}
									aria-hidden={!active}
								>
									<Accessories device={chapter.id} />
									<Device
										content={content}
										state={state}
										dispatch={dispatch}
										openSelected={openSelected}
										active={active}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>
			<div
				className="journey-caption"
				aria-live={snapshot.running ? "off" : "polite"}
				aria-atomic="true"
			>
				<div key={current.id}>
					<h2>{current.name}</h2>
					<p>{current.description}</p>
				</div>
				<span className="journey-count" aria-hidden="true">
					0{snapshot.index + 1}
					<small> / 06</small>
				</span>
			</div>
			<div
				className="chapter-rail"
				role="tablist"
				aria-label={zh ? "选择设备" : "Choose a device"}
			>
				{deviceChapters.map((chapter, index) => (
					<button
						key={chapter.id}
						type="button"
						role="tab"
						id={`chapter-${chapter.id}`}
						data-chapter={index}
						aria-controls="device-display"
						aria-selected={index === snapshot.index}
						aria-label={`0${index + 1} · ${chapter.chapter} · ${chapter.name}`}
						tabIndex={index === snapshot.index ? 0 : -1}
						disabled={!ready}
						onClick={() =>
							gallery.select(index, index < snapshot.index ? -1 : 1)
						}
					>
						<span className="chapter-object">
							<DeviceIcon id={chapter.id} />
							<span>0{index + 1}</span>
						</span>
						<span className="chapter-track">
							<i />
							{index === snapshot.index && (
								<span
									className="chapter-progress"
									key={snapshot.clockRevision}
									style={
										{
											"--progress": snapshot.progress,
											animationDuration: `${snapshot.remaining}ms`,
											animationPlayState: snapshot.running
												? "running"
												: "paused",
										} as CSSProperties
									}
								/>
							)}
						</span>
						<span className="chapter-label" lang="en">
							{chapter.chapter}
						</span>
					</button>
				))}
			</div>
			<div className="journey-playback">
				<span>
					<i className={snapshot.running ? "is-playing" : ""} />
					{snapshot.running
						? zh
							? "正在自动切换设备"
							: "Cycling through devices"
						: zh
							? "自动切换已暂停"
							: "Autoplay paused"}
				</span>
				<button
					type="button"
					className="gallery-playback"
					disabled={!ready}
					aria-label={
						snapshot.playing
							? zh
								? "暂停自动轮播"
								: "Pause autoplay"
							: zh
								? "开始自动轮播"
								: "Start autoplay"
					}
					onClick={() => {
						if (!snapshot.playing) gallery.pause("focus", false);
						gallery.setPlaying(!snapshot.playing);
					}}
				>
					<svg viewBox="0 0 12 12" aria-hidden="true">
						{snapshot.playing ? (
							<path d="M3 2h2v8H3zm4 0h2v8H7z" />
						) : (
							<path d="m3 1 8 5-8 5Z" />
						)}
					</svg>
					{snapshot.playing ? (zh ? "暂停" : "Pause") : zh ? "播放" : "Play"}
				</button>
			</div>
		</section>
	);
}
