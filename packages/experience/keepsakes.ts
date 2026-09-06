export const keepsakeIds = [
	"gameboy",
	"nokia",
	"macintosh",
	"ipod",
	"garmin",
	"honda",
] as const;
type KeepsakeId = (typeof keepsakeIds)[number];

// The document owns the choice: remounts and HMR keep it; a reload starts afresh.
export function documentKeepsake(doc: Document): KeepsakeId {
	const saved = doc.documentElement.dataset.keepsake;
	if (keepsakeIds.some((id) => id === saved)) return saved as KeepsakeId;
	const choice = keepsakeIds[
		Math.floor(Math.random() * keepsakeIds.length)
	] as KeepsakeId;
	doc.documentElement.dataset.keepsake = choice;
	return choice;
}

export function setupKeepsakes(doc: Document) {
	const choice = documentKeepsake(doc);
	for (const image of doc.querySelectorAll<HTMLImageElement>(
		"[data-keepsake-image]",
	)) {
		image.src = `/design-assets/keepsakes/${choice}.svg`;
	}
}
