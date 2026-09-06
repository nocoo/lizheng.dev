import type { DeviceId } from "../../packages/experience/device-gallery";
import { AdventureDetails } from "./AdventureDetails";

function Materials({ id }: { id: string }) {
	return (
		<defs>
			<linearGradient id={`${id}-ivory`} x1="0" y1="0" x2=".85" y2="1">
				<stop stopColor="#fffcef" />
				<stop offset=".48" stopColor="#e7e4d5" />
				<stop offset="1" stopColor="#9ea694" />
			</linearGradient>
			<linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2=".7">
				<stop stopColor="#9ba69c" />
				<stop offset=".35" stopColor="#f2f1e5" />
				<stop offset=".62" stopColor="#c1c9bd" />
				<stop offset="1" stopColor="#7b887c" />
			</linearGradient>
			<linearGradient id={`${id}-ink`} x1="0" y1="0" x2=".9" y2="1">
				<stop stopColor="#647063" />
				<stop offset=".35" stopColor="#39473d" />
				<stop offset="1" stopColor="#1c2b22" />
			</linearGradient>
			<linearGradient id={`${id}-ember`} x1="0" y1="0" x2=".8" y2="1">
				<stop stopColor="#e3a580" />
				<stop offset=".45" stopColor="#c96e4c" />
				<stop offset="1" stopColor="#8b4434" />
			</linearGradient>
			<radialGradient id={`${id}-shadow`}>
				<stop stopColor="#17291d" stopOpacity=".3" />
				<stop offset="1" stopColor="#17291d" stopOpacity="0" />
			</radialGradient>
		</defs>
	);
}

function Earbuds({ device }: { device: "nokia" | "ipod" }) {
	const id = `journey-${device}-earbuds`;
	const nokia = device === "nokia";
	const cable = nokia ? "#c97d5d" : "#e6e6d9";
	const edge = nokia ? "#744b3b" : "#9ba494";
	const shell = `url(#${id}-${nokia ? "ink" : "ivory"})`;
	// Begin at the strain reliefs after each earbud's rotation and translation.
	const wire =
		"M61.53 86.82C68 105 62 122 75 137L85 150M110.98 104.98C104 123 96 132 85 150M85 150c12 32 50 26 54 47 4 23-76 28-90 3-12-22 24-36 40-16 12 16-22 33-31 18-7-12-2-10 5-7";
	return (
		<svg
			className={`journey-prop prop-earbuds prop-earbuds-${device}`}
			viewBox="0 0 170 230"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<Materials id={id} />
			<ellipse cx="91" cy="220" rx="73" ry="10" fill={`url(#${id}-shadow)`} />
			<path d={wire} stroke={edge} strokeWidth="4.5" strokeLinecap="round" />
			<path d={wire} stroke={cable} strokeWidth="2.9" strokeLinecap="round" />
			<path d={wire} stroke="#ffffee" strokeWidth=".7" strokeOpacity=".5" />
			<g transform="translate(29 13) rotate(-19 19 33)">
				<rect
					x="12"
					y="30"
					width="13"
					height="40"
					rx="6"
					fill={shell}
					stroke={edge}
					strokeWidth=".8"
				/>
				<path d="M14 65h9v11h-9z" fill={cable} />
				<path
					d="M17 39v23"
					stroke="#fffce8"
					strokeOpacity=".45"
					strokeWidth="1.5"
				/>
				<ellipse cx="18" cy="27" rx="18" ry="22" fill={shell} stroke={edge} />
				<ellipse
					cx="13"
					cy="19"
					rx="17"
					ry="14"
					transform="rotate(-20 13 19)"
					fill={`url(#${id}-metal)`}
				/>
				<ellipse
					cx="12"
					cy="18"
					rx="12.5"
					ry="10"
					transform="rotate(-20 12 18)"
					fill="#28372f"
					stroke="#778479"
				/>
				<path
					d="m4 17 15-5M3 21l19-6M6 24l16-5"
					stroke="#879183"
					strokeWidth=".7"
					opacity=".65"
				/>
				<path
					d="M1 11q6-8 17-7"
					stroke="#ffffed"
					strokeOpacity=".7"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</g>
			<g transform="translate(109 35) rotate(22 18 29)">
				<rect
					x="12"
					y="25"
					width="13"
					height="40"
					rx="6"
					fill={shell}
					stroke={edge}
					strokeWidth=".8"
				/>
				<path d="M14 62h9v11h-9z" fill={cable} />
				<ellipse cx="18" cy="22" rx="18" ry="21" fill={shell} stroke={edge} />
				<path
					d="M7 8q-9 14 0 25"
					stroke="#ffffed"
					strokeOpacity=".6"
					strokeWidth="2"
					strokeLinecap="round"
				/>
				<ellipse
					cx="24"
					cy="14"
					rx="9"
					ry="7"
					fill="#25392c"
					stroke="#859382"
				/>
				<path
					d="m19 12 8-1m-9 4 11-1m-10 4 8-1"
					stroke="#8b9887"
					strokeWidth=".7"
				/>
				<path d="M17 41v17" stroke="#ffffed" strokeOpacity=".4" />
			</g>
			<g transform="translate(84 144) rotate(-24)">
				<rect
					x="-4"
					y="-5"
					width="8"
					height="17"
					rx="3"
					fill={shell}
					stroke={edge}
					strokeWidth=".8"
				/>
				<path d="M-1-2v10" stroke="#ffffe8" strokeOpacity=".5" />
			</g>
			<g transform="translate(63 195) rotate(-65)">
				<rect x="-5" width="10" height="17" rx="3" fill={shell} stroke={edge} />
				<path d="M-2.7 17h5.4v14h-5.4z" fill={`url(#${id}-metal)`} />
				<path d="M-3 21h6m-6 5h6" stroke="#526052" strokeWidth="1.5" />
			</g>
		</svg>
	);
}

function FloppyDisks() {
	const id = "journey-floppies";
	return (
		<svg
			className="journey-prop prop-floppies"
			viewBox="0 0 150 154"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<Materials id={id} />
			<ellipse cx="78" cy="141" rx="69" ry="12" fill={`url(#${id}-shadow)`} />
			<g transform="rotate(-17 71 75)">
				<path d="M16 22h93l11 11v99H16Z" fill="#8f9582" stroke="#788272" />
				<path
					d="M15 18h93l11 11v99H15Z"
					fill={`url(#${id}-ivory)`}
					stroke="#d9d9c7"
				/>
				<path d="M42 18h48v36H42Z" fill={`url(#${id}-metal)`} />
				<path d="M75 22h10v25H75Z" fill="#394b3c" />
				<rect x="28" y="66" width="76" height="47" rx="2" fill="#e5b58f" />
				<path
					d="M34 79h63m-63 10h63m-63 10h44"
					stroke="#a87656"
					strokeOpacity=".55"
				/>
			</g>
			<g transform="rotate(9 83 83)">
				<path d="M34 31h84l10 10v98H34Z" fill="#1e3026" />
				<path
					d="M31 27h84l10 10v98H31Z"
					fill={`url(#${id}-ink)`}
					stroke="#7f8d7d"
					strokeWidth="1.2"
				/>
				<path d="M36 36v94h84V39" stroke="#a4af9544" />
				<path
					d="M55 28h47v37H55Z"
					fill={`url(#${id}-metal)`}
					stroke="#bdc5b7"
				/>
				<path d="M86 31h11v27H86Z" fill="#334639" />
				<path d="M59 32v28" stroke="#fffcef" strokeOpacity=".7" />
				<rect
					x="42"
					y="76"
					width="72"
					height="44"
					rx="2"
					fill="#eee9d3"
					stroke="#fbf5df"
				/>
				<path d="M43 80h70v6H43Z" fill="#c27753" />
				<text
					x="49"
					y="97"
					fill="#4d5b46"
					fontSize="7"
					fontFamily="monospace"
					letterSpacing="1"
				>
					IDEAS
				</text>
				<path d="M49 103h57m-57 7h39" stroke="#aab09a" strokeWidth=".8" />
				<path
					d="M37 124h6v6h-6zm76 0h6v6h-6z"
					fill="#172b20"
					stroke="#667963"
					strokeWidth=".7"
				/>
			</g>
		</svg>
	);
}

function Glove({ id }: { id: string }) {
	return (
		<g>
			<path
				d="M44 128c-3-13-8-24-16-31L15 85q-4-5 1-10l6-6q4-3 8 1l13 12-7-26q-1-4 3-5l10-3 7 20-5-24q-1-4 3-5l13-1 6 26-1-22q0-4 4-3l12 3 5 27 2-14q1-4 5-2l10 5 2 23c12 20 9 33-5 47Z"
				fill={`url(#${id}-ink)`}
				stroke="#7a8872"
				strokeWidth="1.2"
			/>
			<path
				d="m42 58 7 21m11-33 6 28m15-27 4 28m17-12 1 18"
				stroke="#a4ae9566"
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
			<g fill="#14251c" stroke="#9caa8d" strokeWidth="1.5">
				<ellipse
					cx="43"
					cy="53"
					rx="7"
					ry="3.2"
					transform="rotate(-17 43 53)"
				/>
				<ellipse cx="59" cy="41" rx="8" ry="3.5" transform="rotate(-7 59 41)" />
				<ellipse cx="80" cy="43" rx="8" ry="3.5" transform="rotate(12 80 43)" />
				<ellipse
					cx="102"
					cy="57"
					rx="7.3"
					ry="3.2"
					transform="rotate(22 102 57)"
				/>
				<ellipse
					cx="20"
					cy="77"
					rx="7.5"
					ry="3.3"
					transform="rotate(-45 20 77)"
				/>
			</g>
			<path
				d="M48 77q25-13 51 2l7 19-15 18-41-4-9-21Z"
				fill={`url(#${id}-ember)`}
				stroke="#d18b64"
			/>
			<path
				d="m49 81 12 5 16-4 19 3m-47 4 13 5 17-4 20 3m-48 4 14 5 17-4 15 3"
				stroke="#8b4d37"
				strokeWidth="1.2"
				strokeDasharray="1 3"
				opacity=".6"
			/>
			<path
				d="m43 78-1 14 11 16 35 4 13-13"
				stroke="#f5d8ab"
				strokeWidth=".8"
				strokeDasharray="2 2"
				opacity=".8"
			/>
			<path
				d="M43 120h64l-4 29H48Z"
				fill={`url(#${id}-ink)`}
				stroke="#76866c"
			/>
			<path d="M47 124h54l-2 18H50Z" fill={`url(#${id}-ember)`} />
			<path d="M60 128h30v11H60Z" fill="#344731" />
			<path
				d="m64 131 4 5 5-6m4 1 4 5 5-6"
				stroke="#aeb99c"
				strokeWidth="1.3"
			/>
		</g>
	);
}

function CyclingGloves() {
	const id = "journey-gloves";
	return (
		<svg
			className="journey-prop prop-gloves"
			viewBox="0 0 164 181"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<Materials id={id} />
			<ellipse cx="88" cy="168" rx="71" ry="11" fill={`url(#${id}-shadow)`} />
			<g transform="translate(166 7) rotate(14) scale(-.8 .8)">
				<Glove id={id} />
			</g>
			<g transform="translate(0 13) rotate(-11 65 97)">
				<Glove id={id} />
			</g>
		</svg>
	);
}

function Helmet() {
	const id = "journey-helmet";
	return (
		<svg
			className="journey-prop prop-helmet"
			viewBox="0 0 180 164"
			fill="none"
			aria-hidden="true"
			focusable="false"
		>
			<Materials id={id} />
			<defs>
				<linearGradient id={`${id}-visor`} x1="0" y1="0" x2=".7" y2="1">
					<stop stopColor="#7b9791" />
					<stop offset=".45" stopColor="#364d46" />
					<stop offset="1" stopColor="#152b22" />
				</linearGradient>
			</defs>
			<ellipse cx="88" cy="153" rx="78" ry="10" fill={`url(#${id}-shadow)`} />
			<path d="m31 126 26 5 53 3 35-5-7 15q-50 16-85-1Z" fill="#28382d" />
			<path
				d="M29 128C15 116 10 93 16 66 23 34 49 17 81 18c26 0 47 17 56 42l6 16-9 22 25 20-10 18c-34 16-77 13-120-8Z"
				fill={`url(#${id}-ivory)`}
				stroke="#9da995"
				strokeWidth="1.2"
			/>
			<path
				d="M65 20C31 39 22 83 42 126l15 8C36 93 42 48 83 18Z"
				fill={`url(#${id}-ember)`}
			/>
			<path
				d="M55 25C27 47 22 82 36 112"
				stroke="#ffefd1"
				strokeOpacity=".8"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M79 55c20-6 43 2 60 21l-14 25-34-5-20-15 2-19Z"
				fill="#17281f"
				stroke="#566850"
				strokeWidth="2"
			/>
			<path
				d="M84 58c19-3 38 5 52 19l-13 18-31-3-16-13 2-14Z"
				fill={`url(#${id}-visor)`}
			/>
			<path
				d="M85 61q25 0 45 15l-4 7q-18-11-43-14Z"
				fill="#d2e1cb"
				fillOpacity=".24"
			/>
			<path
				d="M91 60q21 3 35 13"
				stroke="#f4f9dd"
				strokeOpacity=".45"
				strokeWidth="1.5"
			/>
			<path
				d="m94 104 37-6 25 20-9 14-35 5-38-12Z"
				fill={`url(#${id}-ivory)`}
				stroke="#9aa58e"
			/>
			<path d="m123 109 22 11-6 7-18-4Z" fill="#394c3b" stroke="#7e8b76" />
			<path
				d="m127 114-1 9m6-6-1 8m6-6-1 7"
				stroke="#b3baa0"
				strokeWidth="1.5"
			/>
			<path
				d="M59 48c31-10 75-3 109 13l-2 6-34-5-29-8-30 5Z"
				fill={`url(#${id}-ivory)`}
				stroke="#a4af97"
			/>
			<path
				d="M72 48q43-6 85 12"
				stroke="#fefae5"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path d="m84 29 20 5 3 5-22-5Z" fill="#64725c" />
			<circle
				cx="75"
				cy="77"
				r="8"
				fill={`url(#${id}-metal)`}
				stroke="#6f7f69"
			/>
			<circle cx="75" cy="77" r="4.5" fill="#586f57" />
			<path d="m73 74 4 6" stroke="#c8d2b7" strokeWidth="1.5" />
			<path
				d="M30 126q59 23 117 7"
				stroke="#52634d"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</svg>
	);
}

export function SceneAccessories({ device }: { device: DeviceId }) {
	if (device === "gameboy") return <AdventureDetails />;
	return (
		<div
			className={`scene-accessories accessories-${device}`}
			aria-hidden="true"
		>
			{(device === "nokia" || device === "ipod") && <Earbuds device={device} />}
			{device === "macintosh" && <FloppyDisks />}
			{device === "garmin" && <CyclingGloves />}
			{device === "honda" && <Helmet />}
		</div>
	);
}
