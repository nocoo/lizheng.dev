import manifest from "../../package.json" with { type: "json" };
export function Version() {
	return (
		<span className="site-version" lang="en">
			v{manifest.version}
		</span>
	);
}
