export const DEVICE_INTERVAL = 12000;
export const DEVICE_TRANSITION = 950;

export const deviceChapters = [
	{
		id: "gameboy",
		name: "Game Boy",
		chapter: "PLAY",
	},
	{
		id: "nokia",
		name: "Nokia 5300",
		chapter: "CONNECT",
	},
	{
		id: "macintosh",
		name: "Macintosh Plus",
		chapter: "CREATE",
	},
	{
		id: "ipod",
		name: "iPod Classic",
		chapter: "LISTEN",
	},
	{
		id: "garmin",
		name: "Garmin Edge 540",
		chapter: "EXPLORE",
	},
	{
		id: "honda",
		name: "Honda Africa Twin",
		chapter: "RIDE",
	},
] as const;
export type DeviceId = (typeof deviceChapters)[number]["id"];
export type PauseReason = "pointer" | "focus" | "visibility" | "viewport";
export interface GallerySnapshot {
	index: number;
	previous: number | null;
	direction: number;
	revision: number;
	playing: boolean;
	running: boolean;
	reducedMotion: boolean;
	progress: number;
	remaining: number;
	clockRevision: number;
}
const initial: GallerySnapshot = {
	index: 0,
	previous: null,
	direction: 1,
	revision: 0,
	playing: true,
	running: false,
	reducedMotion: false,
	progress: 0,
	remaining: DEVICE_INTERVAL,
	clockRevision: 0,
};

export function createDeviceGallery() {
	let snapshot = initial;
	const listeners = new Set<() => void>();
	const pauses = new Set<PauseReason>();
	let started = false;
	let deadline = 0;
	let clock: ReturnType<typeof setTimeout> | undefined;
	let exit: ReturnType<typeof setTimeout> | undefined;
	const publish = (patch: Partial<GallerySnapshot>) => {
		snapshot = { ...snapshot, ...patch };
		for (const listener of listeners) listener();
	};
	const syncClock = (patch: Partial<GallerySnapshot>, restart = false) => {
		clearTimeout(clock);
		clock = undefined;
		const remaining = restart
			? DEVICE_INTERVAL
			: snapshot.running
				? Math.max(0, deadline - Date.now())
				: snapshot.remaining;
		const playing = patch.playing ?? snapshot.playing;
		const running = started && playing && pauses.size === 0;
		if (running) {
			deadline = Date.now() + remaining;
			clock = setTimeout(() => controller.advance(), remaining);
		}
		publish({
			...patch,
			running,
			remaining,
			progress: 1 - remaining / DEVICE_INTERVAL,
			clockRevision: snapshot.clockRevision + 1,
		});
	};
	const controller = {
		getSnapshot: () => snapshot,
		getServerSnapshot: () => initial,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		start() {
			if (started) return;
			started = true;
			syncClock({});
		},
		stop() {
			if (!started) return;
			started = false;
			clearTimeout(exit);
			syncClock({ previous: null });
		},
		select(index: number, direction = 1) {
			if (
				!Number.isInteger(index) ||
				index < 0 ||
				index >= deviceChapters.length
			)
				throw new RangeError("Unknown device chapter");
			if (index === snapshot.index) return;
			clearTimeout(exit);
			const previous = snapshot.reducedMotion ? null : snapshot.index;
			if (previous !== null)
				exit = setTimeout(() => publish({ previous: null }), DEVICE_TRANSITION);
			syncClock(
				{ index, previous, direction, revision: snapshot.revision + 1 },
				true,
			);
		},
		advance(direction = 1) {
			controller.select(
				(snapshot.index + direction + deviceChapters.length) %
					deviceChapters.length,
				direction,
			);
		},
		setPlaying(playing: boolean) {
			if (snapshot.playing === playing) return;
			syncClock({ playing });
		},
		pause(reason: PauseReason, paused: boolean) {
			if (pauses.has(reason) === paused) return;
			if (paused) pauses.add(reason);
			else pauses.delete(reason);
			syncClock({});
		},
		setReducedMotion(reducedMotion: boolean) {
			if (snapshot.reducedMotion === reducedMotion) return;
			if (reducedMotion) clearTimeout(exit);
			syncClock(
				reducedMotion ? { reducedMotion, previous: null } : { reducedMotion },
			);
		},
	};
	return controller;
}
export type DeviceGalleryController = ReturnType<typeof createDeviceGallery>;
