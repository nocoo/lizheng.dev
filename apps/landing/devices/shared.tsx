import { type ReactNode, useId } from "react";
import type { LandingContent } from "../../../packages/content/model";
import type { DeviceId } from "../../../packages/experience/device-gallery";
import type {
	HandheldAction,
	HandheldState,
} from "../../../packages/experience/handheld";

export interface DeviceProps {
	content: LandingContent;
	state: HandheldState;
	active: boolean;
	dispatch: (action: HandheldAction) => void;
	openSelected: () => void;
}

export function DeviceIcon({ id }: { id: DeviceId }) {
	const shapes: Record<DeviceId, ReactNode> = {
		gameboy: (
			<>
				<path d="M7 2h10a2 2 0 0 1 2 2v15a3 3 0 0 1-3 3H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
				<path d="M8 5h8v7H8zm0 12h4m-2-2v4m5-2h.01m2-2h.01" />
			</>
		),
		nokia: (
			<>
				<rect x="6" y="1" width="12" height="22" rx="3" />
				<path d="M8 5h8v8H8zm0 12h2m4 0h2m-8 3h2m4 0h2m-3-5h2" />
			</>
		),
		macintosh: (
			<>
				<path d="M5 2h14v16H5zM3 20h18l1 2H2Z" />
				<path d="M8 5h8v7H8zm5 10h3" />
			</>
		),
		ipod: (
			<>
				<rect x="5" y="1" width="14" height="22" rx="2" />
				<path d="M8 4h8v7H8z" />
				<circle cx="12" cy="17" r="3" />
				<circle cx="12" cy="17" r=".5" />
			</>
		),
		garmin: (
			<>
				<rect x="5" y="2" width="14" height="20" rx="5" />
				<path d="M8 6h8v12H8zm2 9 2-6 2 4M3 8v3m18 2v3" />
			</>
		),
		honda: (
			<>
				<path d="m3 5 3-2h12l3 2 1 11-4 3H6l-4-3Z" />
				<path d="M6 7h12v8H6zm3 14h6M8 11a4 4 0 0 1 8 0m-4 2 2-3" />
			</>
		),
	};
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.3"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{shapes[id]}
		</svg>
	);
}

function LinkGlyph({ index }: { index: number }) {
	const shapes = [
		<path key="blog" d="M4 3h11l4 4v14H4Zm10 0v5h5M7 12h9m-9 4h6" />,
		<g key="resume">
			<path d="M4 3h16v18H4Z" />
			<circle cx="12" cy="9" r="2.5" />
			<path d="M7 18v-2c0-4 10-4 10 0v2" />
		</g>,
		<path key="code" d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 14" />,
		<g key="linkedin">
			<rect x="3" y="3" width="18" height="18" rx="2" />
			<path d="M7 11v6m0-9v.1m5 9v-6m0 2c0-3 5-3 5 0v4" />
		</g>,
	];
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{shapes[index]}
		</svg>
	);
}

export function DeviceLinks({
	content,
	state,
	dispatch,
	variant = "list",
}: Pick<DeviceProps, "content" | "state" | "dispatch"> & {
	variant?: "list" | "desktop" | "waypoints";
}) {
	return (
		<nav
			className={`native-links links-${variant}`}
			aria-label={content.locale === "zh" ? "个人链接" : "Profile links"}
		>
			{content.links.map((link, index) => (
				<a
					key={link.href}
					href={link.href}
					data-screen-link={index}
					data-surface-link={index === 1 ? "resume" : undefined}
					className={index === state.selected ? "is-selected" : ""}
					onFocus={() => dispatch({ type: "focus", index })}
				>
					<span className="native-link-icon">
						<LinkGlyph index={index} />
					</span>
					<span>{link.label}</span>
					<span className="native-link-arrow" aria-hidden="true">
						›
					</span>
				</a>
			))}
		</nav>
	);
}

export function DeviceAbout({
	content,
	state,
}: Pick<DeviceProps, "content" | "state">) {
	const zh = content.locale === "zh";
	return (
		<div className="device-about" aria-hidden={state.panel !== "about"}>
			<span className="about-star" aria-hidden="true">
				✳
			</span>
			<strong lang="en">ABOUT THIS PAGE</strong>
			<p>
				{zh
					? "这里汇集了我的博客、简历和公开主页。"
					: "Links to my blog, résumé and public profiles."}
			</p>
			<small>{zh ? "返回链接列表" : "Return to the links"}</small>
		</div>
	);
}

export function Battery() {
	return (
		<span className="native-battery" aria-hidden="true">
			<i />
			<i />
			<i />
		</span>
	);
}

export function RainbowApple() {
	const id = useId();
	return (
		<svg className="rainbow-apple" viewBox="0 0 24 28" aria-hidden="true">
			<defs>
				<clipPath id={id}>
					<path d="M13 6c0-4 3-6 6-6 0 4-2 6-6 6ZM12 8c3 0 4-3 8-1 1 .5 2 1.5 2.5 2.5-5 3-4 9 1 11-2 5-4 8-7 7-3-1-4-1-7 0C5 29 0 18 1 12 2 6 7 5 12 8Z" />
				</clipPath>
			</defs>
			<g clipPath={`url(#${id})`}>
				{["#61a44b", "#ecc553", "#de8c3d", "#c35a46", "#97639c", "#6696ba"].map(
					(color, index) => (
						<path key={color} fill={color} d={`M0 ${index * 4.7}h24v4.8H0z`} />
					),
				)}
			</g>
		</svg>
	);
}
