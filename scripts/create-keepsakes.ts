import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Original, code-drawn keepsakes. Both sites deploy the resulting SVGs locally;
// neither site needs the other repository at build time or in the browser.
const portraitDirectory = resolve("design-public/design-assets/keepsakes");
const journalDirectory = resolve(
	process.argv[2] ?? ".design-dist/journal-keepsakes",
);
const capsuleSource = await readFile(
	"design-public/design-assets/capsule.svg",
	"utf8",
);
const capsule = (x: number, y: number, size: number) =>
	capsuleSource.replace(
		"<svg ",
		`<svg x="${x}" y="${y}" width="${size}" height="${(size * 136) / 120}" `,
	);
const group = (
	x: number,
	y: number,
	scale: number,
	angle: number,
	body: string,
) =>
	`<g transform="translate(${x} ${y}) scale(${scale}) rotate(${angle})">${body}</g>`;
const text = (
	x: number,
	y: number,
	label: string,
	size = 7,
	fill = "#596650",
	extra = "",
) =>
	`<text x="${x}" y="${y}" font-family="'Courier New',monospace" font-size="${size}" fill="${fill}" ${extra}>${label}</text>`;
const lines = (
	x: number,
	y: number,
	widths: number[],
	gap = 9,
	color = "#c7ccba",
) =>
	widths
		.map(
			(width, index) =>
				`<path d="M${x} ${y + index * gap}h${width}" stroke="${color}" stroke-linecap="round"/>`,
		)
		.join("");
const definitions = `<defs>
  <linearGradient id="paper" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#fffef0"/><stop offset=".64" stop-color="#f0efdf"/><stop offset="1" stop-color="#dedecb"/></linearGradient>
  <linearGradient id="edge" x2="0" y2="1"><stop stop-color="#f3f1df"/><stop offset=".42" stop-color="#bdc3b0"/><stop offset="1" stop-color="#8f9a87"/></linearGradient>
  <linearGradient id="pearl" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#fffdf3"/><stop offset=".48" stop-color="#eeede2"/><stop offset="1" stop-color="#d5d8cb"/></linearGradient>
  <linearGradient id="ember" x1="0" y1="0" x2=".5" y2="1"><stop stop-color="#e69b73"/><stop offset=".5" stop-color="#c76b4b"/><stop offset="1" stop-color="#985037"/></linearGradient>
  <linearGradient id="olive" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#9da98b"/><stop offset="1" stop-color="#66775c"/></linearGradient>
  <linearGradient id="graphite" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#657267"/><stop offset=".3" stop-color="#3f4c42"/><stop offset="1" stop-color="#25362e"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#728776"/><stop offset=".48" stop-color="#354d43"/><stop offset="1" stop-color="#1c3029"/></linearGradient>
  <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dae2bd"/><stop offset="1" stop-color="#b6c49b"/></linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="#879487"/><stop offset=".27" stop-color="#f0f0de"/><stop offset=".48" stop-color="#c3cbb8"/><stop offset=".72" stop-color="#f7f7e7"/><stop offset="1" stop-color="#8c9989"/></linearGradient>
  <filter id="shadow" x="-45%" y="-35%" width="190%" height="195%" color-interpolation-filters="sRGB"><feDropShadow dx="1.5" dy="5" stdDeviation="3.5" flood-color="#25382b" flood-opacity=".18"/></filter>
  <filter id="soft" x="-45%" y="-35%" width="190%" height="195%" color-interpolation-filters="sRGB"><feDropShadow dx=".5" dy="2" stdDeviation="1.4" flood-color="#203a2a" flood-opacity=".2"/></filter>
</defs>`;
const svg = (body: string, portrait = false) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${portrait ? "200 230" : "256 280"}" fill="none" aria-hidden="true" focusable="false">${definitions}${body}</svg>\n`;

const paperclip = `<g filter="url(#soft)"><path d="M4 26V4a6 6 0 0 1 12 0v27a9 9 0 0 1-18 0V7" transform="translate(3 5)" stroke="#768473" stroke-width="3.5" stroke-linecap="round"/><path d="M4 26V4a6 6 0 0 1 12 0v27a9 9 0 0 1-18 0V7" transform="translate(3 4)" stroke="url(#steel)" stroke-width="2" stroke-linecap="round"/></g>`;
const spark = (x: number, y: number, scale = 1) =>
	group(
		x,
		y,
		scale,
		0,
		`<path d="M0 5h5V0h3v5h5v3H8v5H5V8H0Z" fill="#c67850" opacity=".7"/>`,
	);
const pencil = `<g filter="url(#soft)"><path d="M0 0h7v107l-3.5 13L0 107Z" fill="url(#ember)" stroke="#965e43" stroke-width=".7"/><path d="M1.5 4v100" stroke="#f1b68b" stroke-width="1.3"/><path d="m0 107 3.5 13L7 107Z" fill="#d6bc91"/><path d="m2.4 116 1.1 4 1.1-4" fill="#384536"/><path d="M0 0h7v9H0Z" fill="url(#steel)"/><path d="M0 2h7M0 5h7" stroke="#a6af9e" stroke-width=".5"/></g>`;

const nokia = `<g filter="url(#shadow)">
  <rect x="0" y="5" width="56" height="101" rx="11" fill="#98553d"/>
  <rect x="0" y="2" width="56" height="101" rx="11" fill="url(#ember)" stroke="#f2bb94" stroke-width=".8"/>
  <rect x="4" y="-1" width="48" height="98" rx="10" fill="url(#pearl)" stroke="#f9f7e7"/>
  <path d="M3 24v37M53 24v37" stroke="#b4593b" stroke-width="3" stroke-linecap="round"/>
  <path d="M2.5 31h2m-2 11h2m-2 11h2M53 35h1.5m-1.5 15h1.5" stroke="#f4d3b3" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M22 7h12" stroke="#7f8c78" stroke-width="2" stroke-linecap="round"/>
  ${text(21, 16, "5300", 4.5)}
  <rect x="9" y="21" width="38" height="48" rx="3" fill="#3d4e40"/>
  <rect x="11" y="23" width="34" height="44" rx="1.5" fill="url(#lcd)"/>
  <path d="M15 27h5m-5 2h3m18-2h5v3h-5Z" stroke="#637450" stroke-width=".7"/>
  ${text(15, 37, "MESSAGES", 4)}
  <rect x="18" y="43" width="20" height="14" rx="1.5" fill="#f0f1ce" stroke="#6d7e55" stroke-width=".7"/>
  <path d="m19 44 9 7 9-7m-18 12 6-5m12 5-6-5" stroke="#6d7e55" stroke-width=".8"/>
  <path d="M14 26v35" stroke="#f8f9df" opacity=".35"/>
  <rect x="21" y="75" width="14" height="14" rx="4" fill="url(#steel)" stroke="#8d9987" stroke-width=".8"/>
  <rect x="24" y="78" width="8" height="8" rx="2" fill="#eaeed9"/>
  <path d="M11 78h6m22 0h6" stroke="#a1ac94" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M11 88h6" stroke="#728b5a" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M39 88h6" stroke="#bf6749" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M7 96q21 4 42 0" stroke="#9f775b" stroke-width=".8"/>
  <path d="M9 101h38" stroke="#e6a57f" stroke-width=".7"/>
</g>`;

const floppy = `<g filter="url(#soft)">
  <path d="M3 0h56l7 8v56a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3Z" fill="url(#olive)" stroke="#566951"/>
  <path d="M8 0h45v26H8Z" fill="url(#steel)" stroke="#a0ad95" stroke-width=".7"/>
  <rect x="33" y="3" width="11" height="18" rx="1" fill="#3d5142"/>
  <rect x="8" y="33" width="50" height="30" rx="1.5" fill="url(#paper)"/>
  <path d="M8 39h50" stroke="#c67a52" stroke-width="4"/>
  ${text(13, 50, "DRAFTS", 7)}${lines(13, 55, [29, 21], 4)}
  <path d="M3 61h3v3H3Zm57 0h3v3h-3Z" fill="#3d5142"/>
</g>`;
const macintosh = `<g filter="url(#shadow)">
  <path d="M5 0h75l7 7v94H0V7Z" fill="url(#edge)" stroke="#99a18a"/>
  <path d="M7 1h71l4 5v84H4V6Z" fill="url(#pearl)" stroke="#fffcea"/>
  <rect x="12" y="13" width="63" height="48" rx="8" fill="#a1aa92"/>
  <rect x="16" y="16" width="55" height="41" rx="7" fill="url(#glass)" stroke="#61715b"/>
  <path d="M21 23q18-8 42-1" stroke="#b8c7a5" stroke-width="1" opacity=".3"/>
  <path d="M36 26h15v18H36Z" fill="#d2dbb5"/><path d="M39 30h2m5 0h2m-8 9h6m-3-6v3h2" stroke="#516347" stroke-width="1.4"/>
  <path d="M50 73h23" stroke="#445c46" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M53 75h17" stroke="#fbfbe7" stroke-width=".8"/>
  <rect x="14" y="71" width="5" height="6" rx=".6" fill="#bd7550"/>
  ${text(12, 85, "PLUS", 4.2)}
  <path d="M0 92h87v10H0Z" fill="#b5bca6"/><path d="M5 95h77" stroke="#f2f1dd"/>
  <path d="M13 100h62v6H13Z" fill="#88957f"/>
</g>`;

const ipod = `<g filter="url(#shadow)">
  <rect x="0" y="3" width="76" height="122" rx="12" fill="url(#steel)" stroke="#99a793"/>
  <rect x="0" y="0" width="76" height="121" rx="11" fill="url(#pearl)" stroke="#fffef3"/>
  <path d="M11 2h11" stroke="#a5ad99" stroke-width="1.1" stroke-linecap="round"/>
  <path d="M14 2h4" stroke="#cb8058" stroke-width="1.1"/>
  <rect x="10" y="13" width="56" height="43" rx="5" fill="#52624f"/>
  <rect x="13" y="16" width="50" height="37" rx="2" fill="#dce3cc" stroke="#1f362d" stroke-width=".5"/>
  ${text(18, 24, "Voice memo", 4.8)}
  <path d="M15 28h46" stroke="#a4b193"/>
  <circle cx="21" cy="39" r="3" fill="#bf6846"/>
  <path d="M29 37v4m3-7v10m3-13v15m3-9v6m3-9v11m3-8v5m3-6v9m3-11v12m3-8v4" stroke="#6a7d56" stroke-width="1.6"/>
  <circle cx="38" cy="87" r="25" fill="#faf9ec" stroke="#ced4c0"/>
  <circle cx="38" cy="87" r="9" fill="url(#pearl)" stroke="#c1cab6"/>
  ${text(31, 69, "MENU", 4, "#8a967f")}
  <path d="m56 85 3 2-3 2Zm-38 0-3 2 3 2Z" fill="#8a967f"/>
  <path d="M59 85v4M15 85v4" stroke="#8a967f" stroke-width=".8"/>
  <path d="m33 104 4 2-4 2Zm7 0h1v4h-1Zm3 0h1v4h-1Z" fill="#8a967f"/>
</g>`;

// Cords terminate at the centre of each stem, before the earbud is painted.
const earbuds = `<g fill="none" stroke-linecap="round">
  <path d="M10 22v20c0 24 26 9 26 32v18m21-61v19c0 18-21 4-21 24" stroke="#73816f" stroke-opacity=".25" stroke-width="3.5"/>
  <path d="M10 22v20c0 24 26 9 26 32v18m21-61v19c0 18-21 4-21 24" stroke="#ecefde" stroke-width="2"/>
  <g filter="url(#soft)"><rect x="7" y="11" width="6" height="16" rx="3" fill="url(#pearl)" stroke="#aab79f" stroke-width=".7"/>
  <ellipse cx="8" cy="9" rx="8" ry="10" fill="url(#pearl)" stroke="#b1bba5" stroke-width=".7"/>
  <ellipse cx="5" cy="8" rx="3.5" ry="5.5" fill="#586b5e"/>
  <path d="M4 4v8m2-8v8" stroke="#adbfa8" stroke-width=".6"/>
  <rect x="54" y="20" width="6" height="16" rx="3" fill="url(#pearl)" stroke="#aab79f" stroke-width=".7"/>
  <ellipse cx="59" cy="18" rx="8" ry="10" fill="url(#pearl)" stroke="#b1bba5" stroke-width=".7"/>
  <ellipse cx="62" cy="17" rx="3.5" ry="5.5" fill="#586b5e"/><path d="M61 13v8m2-8v8" stroke="#adbfa8" stroke-width=".6"/>
  <rect x="33.5" y="89" width="5" height="12" rx="2" fill="url(#pearl)" stroke="#adb8a2" stroke-width=".7"/>
  <path d="M36 101v8" stroke="url(#steel)" stroke-width="2.4"/><path d="M35 104h2m-2 3h2" stroke="#56694e" stroke-width=".7"/>
  </g>
</g>`;

const garmin = `<g filter="url(#shadow)">
  <path d="M16 0h40l15 13v78l-12 15H13L0 91V13Z" fill="#223a2d"/>
  <path d="M15 1h41l12 12v76l-12 13H15L3 90V14Z" fill="url(#graphite)" stroke="#778474"/>
  <path d="M16 4h39l9 10v72" stroke="#a2ae97" stroke-opacity=".5"/>
  <rect x="11" y="16" width="49" height="69" rx="4" fill="#162e24"/>
  <rect x="13" y="18" width="45" height="65" rx="2" fill="url(#paper)"/>
  ${text(20, 27, "EXPLORE", 4.5)}
  <path d="M15 34h41M15 46h41M15 58h41M15 70h41M24 34v46m13-46v46m13-46v46" stroke="#bdc9ac" stroke-width=".6"/>
  <path d="m20 73 8-14 15-2-7-11 11-9" stroke="#bf6f46" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="20" cy="73" r="2.5" fill="#edf0d9" stroke="#6f8358"/><path d="m47 34-3 6h6Z" fill="#bf6f46"/>
  <path d="M23 92h25" stroke="#a1ae98" stroke-width="1" stroke-linecap="round"/>
  <path d="M12 100h11m26 0h10" stroke="#87967e" stroke-width="1.8" stroke-linecap="round"/>
</g>`;
const glove = `<g filter="url(#soft)">
  <path d="M13 17V7q0-5 7-4l1 12V3q4-4 9-1v13l2-14q6-2 9 2l-1 14 3-11q7-1 8 5l-3 21q10-4 13 3l-13 20-1 15H15l-2-16L5 36q-2-8 4-9l9 9Z" fill="url(#olive)" stroke="#52684f" stroke-width="1.2"/>
  <path d="M14 9h6m2-3h7m4 1h7m5 5h5" stroke="#e9dcc0" stroke-width="5"/>
  <path d="M17 23q14-8 27-1l-3 24q-13 6-21-2Z" fill="#5c7258"/>
  <path d="M20 27h20m-20 5h19m-18 5h17" stroke="#aeb89b" stroke-width=".8" stroke-dasharray="1 3"/>
  <path d="M14 57h34v13H15Z" fill="#354f3e"/><rect x="19" y="59" width="22" height="7" rx="2" fill="#be7953"/>
  <path d="M17 53h29" stroke="#c8d1b5" stroke-width=".8" stroke-dasharray="2 2"/>
</g>`;

const helmet = `<g filter="url(#shadow)">
  <path d="M9 46C6 15 24 0 48 0s42 15 39 46l-5 26-15 26H29L14 73Z" fill="url(#pearl)" stroke="#929e88" stroke-width="1.2"/>
  <path d="M36 2h24l4 23H32Z" fill="url(#ember)"/>
  <path d="M39 3h4l-1 21h-5Z" fill="#efc09a" opacity=".7"/>
  <path d="M13 36q35-12 70 0l-4 27q-31 10-62 0Z" fill="url(#graphite)" stroke="#aebaa3"/>
  <path d="M20 38q28-8 56 0l-2 19q-26 8-52 0Z" fill="url(#glass)" stroke="#263d31"/>
  <path d="M24 41q24-7 46-1" stroke="#cbd9c3" stroke-opacity=".5" stroke-width="1.2"/>
  <path d="M19 35 2 25l7-4q39-9 78 0l7 4-17 10q-29-7-58 0Z" fill="url(#pearl)" stroke="#899a81"/>
  <path d="M5 25q43-12 86 0" stroke="#ffffed" stroke-width="1.5"/>
  <path d="m34 66 14-4 14 4 9 20-8 12H33l-8-12Z" fill="url(#pearl)" stroke="#a5b098"/>
  <path d="m37 74 11-4 11 4-3 9H40Z" fill="#354d3f"/>
  <path d="M42 74v6m6-8v9m6-7v6" stroke="#879c7c" stroke-width="1.4"/>
  <path d="M29 91h38" stroke="#6f8165" stroke-width="1.5"/>
  <circle cx="15" cy="46" r="3" fill="url(#steel)"/><circle cx="81" cy="46" r="3" fill="url(#steel)"/>
  <path d="M17 69 29 81m50-12L67 81" stroke="#c57c54" stroke-width="4"/>
</g>`;
const key = `<g filter="url(#soft)">
  <ellipse cx="15" cy="3" rx="10" ry="13" stroke="#6c7e69" stroke-width="3"/>
  <ellipse cx="15" cy="2" rx="10" ry="13" stroke="url(#steel)" stroke-width="2"/>
  <path d="M11 22h9v39l-5 6-4-4V51h4v-5h-4v-6h4v-5h-4Z" fill="url(#steel)" stroke="#82917e" stroke-width=".8"/>
  <rect x="1" y="7" width="29" height="25" rx="7" fill="url(#graphite)" stroke="#72836b"/>
  <path d="M8 13h14M8 16h14" stroke="#a0ad94" stroke-width=".6"/>
  <path d="m11 21 4-3 4 3-4 4Z" fill="#ca8156"/>
</g>`;

function notebook(body: string, cover = "url(#olive)") {
	return `<g filter="url(#shadow)">
    <rect x="-6" y="-4" width="143" height="185" rx="7" fill="${cover}" stroke="#697a5b" stroke-width=".8"/>
    <path d="M1 174h130v5H1Z" fill="#c2c8b2"/><path d="M3 175h124m-124 2h124" stroke="#f4f1db" stroke-width=".7"/>
    <rect x="1" y="0" width="131" height="174" rx="4" fill="url(#paper)" stroke="#fcfce9"/>
    <path d="M13 0v174" stroke="#bbbfa6"/><path d="M16 0v174" stroke="#fffcea"/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M-5 ${15 + i * 20}q-9-6 1-10h8" stroke="#788570" stroke-width="2.2" stroke-linecap="round"/><path d="M-5 ${14 + i * 20}q-7-5 1-8h7" stroke="#f1edce" stroke-width=".8" stroke-linecap="round"/>`).join("")}
    ${body}
  </g>`;
}

const pokedex = notebook(
	`
  ${text(26, 23, "POKÉDEX", 12, "#ad5e3e", 'font-weight="bold" letter-spacing="1"')}
  ${text(26, 35, "FIELD NOTES", 6.5)}
  <path d="M26 44h89" stroke="#aeb99f"/>
  <rect x="28" y="53" width="85" height="65" rx="2" fill="#e2e7d1" stroke="#a6b395"/>
  <path d="M37 61h5m-5 0v5m67-5h-5m5 0v5M37 110h5m-5 0v-5m67 5h-5m5 0v-5" stroke="#9eac8a"/>
  <path d="M54 75h7v-8h7v5h8v-5h7v8h5v8h6v15h-7v7H58v-7h-8V84h4Z" fill="#7a8d5e"/>
  <path d="M62 84h20v16H62Z" fill="#b6c797"/><path d="M59 84h5v5h-5m17-5h5v5h-5" fill="#374f38"/>
  <path d="M68 95h7v3h-7" fill="#f1efca"/>
  ${text(30, 130, "NO. 001 / SEEN", 6)}
  <path d="m29 141 2 2 4-5m-6 12 2 2 4-5" stroke="#9c603e" stroke-width="1.5"/>
  ${lines(41, 141, [59, 46, 66], 9)}
`,
	"url(#ember)",
);

const messages = `<g filter="url(#shadow)">
  <rect x="-7" y="7" width="141" height="176" rx="4" fill="#a4b196" transform="rotate(-5)"/>
  <rect x="-1" y="4" width="137" height="172" rx="3" fill="#d4dbc3" stroke="#b2bda4"/>
  <rect width="133" height="169" rx="3" fill="url(#paper)" stroke="#fffced"/>
  <path d="M0 26h133" stroke="#d6ccb0"/>
  ${text(14, 19, "SAVED MESSAGES", 8.5, "#a45d3f", 'font-weight="bold"')}
  ${text(14, 42, "INBOX / THINGS TO KEEP", 5.3)}
  <path d="M16 54h90v35H26l-10 7Z" fill="#dce3cc" stroke="#a9b898"/>
  ${lines(25, 66, [64, 46, 57], 7, "#8c9b77")}
  <path d="M117 105H30v28h77l10 7Z" fill="#eee1c9" stroke="#c6b28e"/>
  ${lines(40, 116, [62, 43], 8, "#ad9673")}
  ${text(16, 157, "a thought, before it goes.", 5.4)}
  <path d="M57-4h22v12H57Z" fill="url(#graphite)" stroke="#7a886f"/><path d="M62-3v-7q6-10 12 0v7" stroke="url(#steel)" stroke-width="2.5"/>
</g>`;

const manuscript = `<g filter="url(#shadow)">
  <path d="M-4 7h145v179H-4Z" fill="#b2bea5" transform="rotate(3)"/>
  <path d="M0 0h140v178l-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3-5-3V0Z" fill="url(#paper)" stroke="#e6e8d3"/>
  ${Array.from({ length: 13 }, (_, i) => `<circle cx="6" cy="${8 + i * 13}" r="2.3" fill="#89967e" fill-opacity=".5"/><circle cx="134" cy="${8 + i * 13}" r="2.3" fill="#89967e" fill-opacity=".5"/>`).join("")}
  <path d="M12 2v174m116-174v174" stroke="#c8ceb5" stroke-dasharray="2 2"/>
  <rect x="20" y="15" width="100" height="130" fill="#f4f3e4" stroke="#697c60" stroke-width="1.2"/>
  <path d="M20 32h100" stroke="#697c60"/>
  ${lines(24, 19, [91, 91, 91], 4, "#8c9c7d")}
  <rect x="38" y="17" width="61" height="12" fill="#f4f3e4"/>
  ${text(43, 25, "Untitled — 01", 5.8, "#405b42")}
  <rect x="25" y="19" width="7" height="7" fill="#f4f3e4" stroke="#697c60"/>
  ${text(29, 51, "A FIRST DRAFT", 7.6, "#506b47", 'font-weight="bold"')}
  ${lines(30, 64, [77, 78, 63, 75, 68, 78, 41], 8, "#a4b08f")}
  <path d="M30 127h4v8h-4Z" fill="#b76f48"/>
  ${text(40, 161, "words worth saving.", 5.5)}
</g>`;

const soundNotes = notebook(`
  ${text(27, 22, "SIDE A", 11, "#a85f3f", 'font-weight="bold" letter-spacing="1"')}
  ${text(27, 34, "VOICE &amp; OTHER NOTES", 5.8)}
  <path d="M26 43h91" stroke="#b8c0a6"/>
  <circle cx="32" cy="62" r="4" fill="#c57e54"/>
  <path d="M47 58v8m4-15v22m4-28v34m4-19v7m4-18v28m4-20v12m4-28v40m4-23v9m4-16v25m4-19v13m4-27v39m4-23v9m4-16v24m4-13v5" stroke="#809268" stroke-width="2" stroke-linecap="round"/>
  ${text(27, 93, "01 / A FAMILIAR FEELING", 5.4)}
  ${lines(27, 108, [81, 68, 76, 60, 81], 10)}
  <path d="M122-3v32l-6-5-6 5V-3" fill="url(#ember)"/>
`);

const routeMap = `<g filter="url(#shadow)">
  <path d="M0 7 49 0l48 8 49-6v171l-49 6-48-8-49 7Z" fill="url(#paper)" stroke="#bcc6aa"/>
  <path d="M49 0v171l48 8V8Z" fill="#b8c7a1" opacity=".2"/>
  <path d="M49 1v169M97 9v168" stroke="#879a75" stroke-opacity=".3"/>
  <path d="M50 2v168M98 9v168" stroke="#fffdeb" stroke-opacity=".75"/>
  <path d="M10 65q12-27 27-10t36-11 28 8 29-9M7 76q19-29 38-9t36-10 29 9 25-13M10 86q13-19 29-4t32-5 34 5 29-11M8 142q15-24 34-13t25-4 33 13 30-6M10 155q14-22 31-11t28-4 35 9 30-7" stroke="#c1cbb1" stroke-width="1.3"/>
  <path d="m10 113 35-20 32 17 34-19 26 6M22 43l14 56-13 49M113 43l-12 65 18 46" stroke="#c6d1b6" stroke-width="4"/>
  <path d="m10 113 35-20 32 17 34-19 26 6" stroke="#f9f9e9" stroke-width="2.2"/>
  <path d="M25 140c37-6 17-35 44-39s42-7 35-25-26-17-7-31" stroke="#a3633e" stroke-opacity=".14" stroke-width="6"/>
  <path d="M25 140c37-6 17-35 44-39s42-7 35-25-26-17-7-31" stroke="#c47d4e" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="25" cy="140" r="4" fill="#edf0d7" stroke="#6e8357" stroke-width="1.6"/>
  <path d="m97 39-4 8h8Z" fill="#b96d42"/>
  <rect x="8" y="15" width="127" height="22" rx="1" fill="#f5f3df"/>
  ${text(16, 29, "ROUTE NOTES", 9.7, "#64794f", 'font-weight="bold" letter-spacing=".8"')}
  ${text(85, 159, "GO FURTHER", 5.7)}
  <path d="M122 53v15m-5-8 5-7 5 7" stroke="#799363" stroke-width="1"/>
  ${text(120, 50, "N", 5)}
</g>`;

const roadbook = `<g filter="url(#shadow)">
  <rect x="-5" y="6" width="138" height="181" rx="4" fill="#71846a"/>
  <rect x="0" y="0" width="133" height="181" rx="3" fill="url(#paper)" stroke="#fcfbe8"/>
  <rect x="-3" y="-4" width="139" height="18" rx="6" fill="url(#pearl)" stroke="#b4bea5"/>
  <path d="M1 0h131" stroke="#fffef0" stroke-width="1.4"/>
  <path d="M2 11h129" stroke="#9eae91"/>
  ${text(15, 34, "ROAD NOTES", 10.5, "#a55f3f", 'font-weight="bold" letter-spacing=".7"')}
  <path d="M10 46h113v104H10Z" stroke="#a8b899"/><path d="M43 46v104m39-104v104M10 81h113M10 116h113" stroke="#a8b899"/>
  ${text(17, 65, "001", 8)}${text(17, 100, "002", 8)}${text(17, 136, "003", 8)}
  <path d="M61 73V55m-5 6 5-6 5 6M54 108V93h16m-6-6 6 6-6 6M56 142v-9l11-10m-8 0h8v8" stroke="#506547" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="61" cy="74" r="2.5" fill="#506547"/><circle cx="54" cy="109" r="2.5" fill="#506547"/><circle cx="56" cy="143" r="2.5" fill="#506547"/>
  ${lines(89, 58, [25, 20, 22], 5)}${lines(89, 92, [24, 17, 23], 5)}${lines(89, 128, [24, 21, 18], 5)}
  ${text(15, 168, "TAKE THE LONG WAY HOME", 5.4)}
  <path d="m117 179 7-7v10Z" fill="#c48056"/>
</g>`;

const journals = {
	gameboy:
		group(78, 31, 1, 8, pokedex) +
		capsule(24, 173, 92) +
		spark(216, 55, 0.7) +
		spark(39, 142, 0.4),
	nokia:
		group(90, 36, 1, 8, messages) +
		group(27, 151, 0.85, -13, nokia) +
		group(212, 155, 0.7, 16, pencil) +
		spark(47, 82, 0.6),
	macintosh:
		group(73, 30, 1, 5, manuscript) +
		group(29, 174, 1.05, -13, floppy) +
		group(226, 103, 0.95, 15, pencil) +
		spark(38, 75, 0.5),
	ipod:
		group(89, 29, 1, 9, soundNotes) +
		group(27, 149, 0.74, -12, ipod) +
		group(173, 171, 0.76, -9, earbuds) +
		spark(51, 79, 0.6),
	garmin:
		group(68, 36, 1, 7, routeMap) +
		group(27, 163, 0.8, -13, garmin) +
		group(214, 130, 0.83, 15, pencil) +
		spark(44, 85, 0.6),
	honda:
		group(81, 30, 1, 8, roadbook) +
		group(24, 165, 0.77, -7, helmet) +
		group(204, 183, 0.8, 17, key) +
		spark(41, 84, 0.55),
};

const portraits = {
	gameboy:
		capsule(4, 147, 70) +
		group(160, 19, 0.68, 16, paperclip) +
		spark(163, 72, 0.52),
	nokia: group(6, 148, 0.65, -13, nokia) + group(164, 20, 0.39, 9, earbuds),
	macintosh:
		group(4, 159, 0.6, -3, macintosh) + group(156, 18, 0.48, 12, floppy),
	ipod: group(8, 148, 0.55, -12, ipod) + group(164, 18, 0.4, 12, earbuds),
	garmin: group(7, 155, 0.6, -12, garmin) + group(159, 18, 0.48, 12, glove),
	honda: group(3, 161, 0.62, -8, helmet) + group(163, 21, 0.58, 13, key),
};

await mkdir(portraitDirectory, { recursive: true });
await mkdir(journalDirectory, { recursive: true });
for (const id of Object.keys(journals) as (keyof typeof journals)[]) {
	await writeFile(`${portraitDirectory}/${id}.svg`, svg(portraits[id], true));
	await writeFile(`${journalDirectory}/${id}.svg`, svg(journals[id]));
}
console.info(
	`Created six portrait and six journal keepsakes in ${portraitDirectory} and ${journalDirectory}`,
);
