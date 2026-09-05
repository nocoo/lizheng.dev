export function AdventureDetails() {
	return (
		<div className="adventure-details" aria-hidden="true">
			<div className="adventure-ball">
				<svg
					viewBox="0 0 120 136"
					fill="none"
					focusable="false"
					aria-hidden="true"
				>
					<defs>
						<radialGradient id="capsule-ivory" cx=".3" cy=".2" r=".85">
							<stop stopColor="#fffdf0" />
							<stop offset=".6" stopColor="#e9e7d5" />
							<stop offset=".88" stopColor="#b1b8a3" />
							<stop offset="1" stopColor="#788571" />
						</radialGradient>
						<radialGradient id="capsule-ember" cx=".3" cy=".23" r=".88">
							<stop stopColor="#edac7e" />
							<stop offset=".42" stopColor="#c96a45" />
							<stop offset=".76" stopColor="#a64932" />
							<stop offset="1" stopColor="#6e392c" />
						</radialGradient>
						<radialGradient id="capsule-shadow">
							<stop stopColor="#18251d" stopOpacity=".3" />
							<stop offset="1" stopColor="#18251d" stopOpacity="0" />
						</radialGradient>
						<linearGradient id="capsule-rim" x2="0" y2="1">
							<stop stopColor="#677264" />
							<stop offset="1" stopColor="#26372c" />
						</linearGradient>
					</defs>
					<ellipse
						cx="63"
						cy="119"
						rx="55"
						ry="15"
						fill="url(#capsule-shadow)"
					/>
					<g transform="rotate(-23 60 60)">
						<circle cx="60" cy="60" r="48" fill="url(#capsule-ivory)" />
						<path
							d="M12 59a48 48 0 0 1 96 0Q60 77 12 59Z"
							fill="url(#capsule-ember)"
						/>
						<path
							d="M12 57q48 18 96 0l-.7 8q-47.3 19-94.6 0Z"
							fill="url(#capsule-rim)"
						/>
						<path d="M14 68q46 18 92 0" stroke="#fffcef" strokeOpacity=".5" />
						<circle cx="60" cy="70" r="15" fill="#26372c" />
						<circle
							cx="60"
							cy="68"
							r="14"
							fill="url(#capsule-rim)"
							stroke="#879080"
							strokeWidth=".8"
						/>
						<circle
							cx="60"
							cy="68"
							r="10.5"
							fill="url(#capsule-ivory)"
							stroke="#fff8e4"
							strokeWidth=".8"
						/>
						<circle cx="60" cy="68" r="4" fill="#bf6846" />
						<path
							d="M27 37a38 38 0 0 1 28-16"
							stroke="#ffdab2"
							strokeWidth="3"
							strokeLinecap="round"
							opacity=".65"
						/>
						<path
							d="M29 89q13 13 30 13"
							stroke="#fffdef"
							strokeWidth="1.5"
							strokeLinecap="round"
							opacity=".55"
						/>
						<circle
							cx="60"
							cy="60"
							r="47.5"
							stroke="#ffffe4"
							strokeOpacity=".2"
						/>
					</g>
				</svg>
			</div>
			<svg
				className="adventure-sparkles"
				aria-hidden="true"
				viewBox="0 0 48 48"
				fill="currentColor"
				focusable="false"
			>
				<path d="M12 0h4v8h8v4h-8v8h-4v-8H4V8h8Z" />
				<path d="M36 28h3v6h6v3h-6v6h-3v-6h-6v-3h6Z" opacity=".45" />
				<path d="M5 34h3v3H5Z" opacity=".3" />
			</svg>
			<svg
				className="adventure-grass"
				aria-hidden="true"
				viewBox="0 0 48 40"
				fill="currentColor"
				focusable="false"
			>
				<path
					d="M4 12h4v4h4v8h4V8h4v8h4v12h4V16h4V4h4v20h4v-8h4v16h-4v4H8v-4H4Z"
					opacity=".7"
				/>
				<path d="M12 28h4v4h4v4h-8Zm16 0h4v-4h4v12h-8Z" />
				<path d="M0 4h4v4H0Zm44 0h4v4h-4Z" opacity=".3" />
			</svg>
		</div>
	);
}
