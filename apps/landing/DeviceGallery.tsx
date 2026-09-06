import {
	type CSSProperties,
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import type { PageContent } from "../../packages/content/model";
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
import { DeviceIcon } from "./devices/shared";
import { SceneAccessories } from "./SceneAccessories";

const devices = {
	gameboy: GameBoy,
	nokia: Nokia,
	macintosh: Macintosh,
	ipod: IPod,
	garmin: Garmin,
	honda: Honda,
};

export function DeviceGallery({ content }: { content: PageContent }) {
	const zh = content.locale === "zh";
	const root = useRef<HTMLElement>(null);
	const [gallery] = useState(createDeviceGallery);
	const snapshot = useSyncExternalStore(
		gallery.subscribe,
		gallery.getSnapshot,
		gallery.getServerSnapshot,
	);
	const [state, setState] = useState(initialHandheld);
	const dispatch = useCallback(
		(action: HandheldAction) =>
			setState((current) => transition(current, action, content.links.length)),
		[content.links.length],
	);
	const openSelected = () => activate(state, () => dispatch({ type: "back" }));
	useEffect(() => {
		if (root.current)
			return setupDeviceGallery(root.current, gallery, (index) =>
				dispatch({ type: "focus", index }),
			);
	}, [gallery, dispatch]);
	const current = deviceChapters[
		snapshot.index
	] as (typeof deviceChapters)[number];
	const layers =
		snapshot.previous === null
			? [snapshot.index]
			: [snapshot.previous, snapshot.index];
	const ready = snapshot.clockRevision > 0;
	return (
		<section
			className="device-gallery"
			ref={root}
			aria-label={zh ? "我的设备旅程" : "Objects along my journey"}
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
					OBJECTS ALONG THE WAY
				</span>
				<span>A PERSONAL COLLECTION</span>
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
							SOME THINGS STAY WITH YOU
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
									className={`device-layer layer-${chapter.id} ${active ? (snapshot.previous === null ? "is-current" : "is-entering") : "is-exiting"}`}
									data-device-active={active ? chapter.id : undefined}
									inert={!active}
									aria-hidden={!active}
								>
									<SceneAccessories device={chapter.id} />
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
					<p>{current[content.locale]}</p>
				</div>
				<span className="journey-count" aria-hidden="true">
					0{snapshot.index + 1}
					<small> / 06</small>
				</span>
			</div>
			<div
				className="chapter-rail"
				role="tablist"
				aria-label={zh ? "选择人生章节" : "Choose a chapter"}
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
							? "顺着回忆，继续前行"
							: "A few things that shaped me"
						: zh
							? "停留片刻，随心探索"
							: "Take a moment. Look around."}
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
