export function Icon({
	name,
	className = "",
}: {
	name: "system" | "sun" | "moon" | "arrow" | "print" | "chevron";
	className?: string;
}) {
	const paths = {
		system: (
			<>
				<rect x="3" y="4" width="18" height="13" rx="2" />
				<path d="M12 17v4m-4 0h8" />
			</>
		),
		sun: (
			<>
				<circle cx="12" cy="12" r="4" />
				<path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
			</>
		),
		moon: <path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z" />,
		arrow: <path d="M5 19 19 5M5 5h14v14" />,
		print: (
			<>
				<path d="M7 8V3h10v5M7 16H4V8h16v8h-3M7 13h10v8H7Z" />
				<path d="M16 10h1" />
			</>
		),
		chevron: <path d="m9 5 7 7-7 7" />,
	};
	return (
		<svg
			className={className}
			aria-hidden="true"
			viewBox="0 0 24 24"
			width="20"
			height="20"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{paths[name]}
		</svg>
	);
}
