# 13 — Objects along the way

Date: 2026-09-06. Status: implemented; final local verification passed. The user authorized the v3.1.0 minor release through `/su-release Y+1`.

## Requested experience

The right-hand centerpiece on lizheng.me becomes a collection of important personal devices: the existing Game Boy, Nokia 5300, Macintosh Plus, iPod Classic, Garmin Edge 540 and a Honda motorcycle instrument panel. The initial Apple Classic reference is implemented as iPod Classic, subsequently named explicitly in the user's feedback. The Honda visual reference is Africa Twin. These are device references explicitly requested by the user, superseding the earlier restriction on naming inspiration hardware.

The order expresses chapters, not dated biographical claims. Use Play, Connect, Create, Listen, Explore and Ride. Do not invent ownership years, ride statistics, routes taken or career facts. Both languages continue to use their existing public Markdown for the name, role, introduction and four real destinations.

## Visual and interaction design

- Keep the paper/graphite palette, warm lighting and finely textured surfaces. Extend the left-hand introduction with bilingual personal prose about the quiet ways the things we choose become part of us. Each device gets its own proportions, case depth, screen technology and controls.
- Preserve the Game Boy and its original adventure details. Build a sliding Nokia with a numeric keypad, a compact Macintosh with CRT/keyboard/mouse, an iPod with a working click wheel, a button-driven Edge 540 and a wide Honda TFT instrument pod.
- Give every scene a related physical keepsake: the existing capsule ball, charcoal/coral wired earbuds for Nokia, stacked floppy disks for Macintosh, ivory wired earbuds for iPod, matching fingerless cycling gloves for Garmin and an ivory adventure helmet in side profile for Honda. Wire endpoints meet the transformed strain reliefs. Both gloves use the same charcoal/ember material and visible open finger cuffs. Keep the Macintosh and keyboard upright. Use shaded SVG with the same warm materials; keep accessories outside screen content, hidden from assistive technology and transparent to pointer input.
- All six expose the same four destinations and personal information through native-looking interfaces. Real anchors and keyboard navigation remain available. Physical buttons operate the selected link and profile view.
- A six-stop chapter rail supports pointer selection and keyboard arrows/Home/End. Default sequential autoplay uses a 12-second reading interval, wraps to the first device and offers a visible pause control.
- Up/down select links inside the current device; left/right switch devices without changing the selected link or toggling the profile panel. Enter opens the focused link. A three-row legend explains the shortcuts on the left. Focus follows the incoming screen, or its Back control when the profile panel is open; chapter tabs retain their native Home/End and left/right navigation. Editing controls, modified keys and unrelated page controls keep their native behavior.
- Keyboard focus uses compact, material-colored outlines around hardware and inset screen-colored indicators on menu rows, with pixel-style outlines for Game Boy and Macintosh. Chapter focus follows the rail's accent and rounded shape. These indicators remain visible for keyboard use without adding a large floating outline on pointer clicks.
- Suspend autoplay while the scene is hovered, keyboard focus is within the gallery, the scene is outside the viewport or the document is hidden. Preserve the remaining interval. Pointer selection does not leave a persistent focus pause. Autoplay defaults to on, including reduced motion; reduced motion eliminates spatial transitions and never overrides an explicit pause.
- Device changes combine outgoing and incoming depth, rotation, light and shadow with asymmetric easing. The incoming device is immediately interactive; the outgoing device is inert, hidden from assistive technology and returns to the hidden scene cache after the finite transition. Rapid choices replace the pending transition.
- Increase pointer tilt from ±1.5° to ±6°, with eased settling and a moving highlight. Update only on pointer input; disable spatial motion for coarse pointers and reduced motion. Keep the pose steady over buttons/links and during pressed-pointer gestures so small controls and the click wheel remain under the pointer.
- Inset Hold and the headphone jack into the iPod's top metal edge. The Garmin quarter-turn mount sits behind the case and is concealed in this frontal view. Reflections follow the visible case surfaces, including composite machines, rather than painting a rectangular layer across their empty surroundings.
- Keep both stage layers free of rectangular clipping and masks, so animated accessories can travel beyond the stage in either direction. Existing soft shadows decay to transparency behind the caption and chapter rail, which sit above the scene. Only the outer page constrains horizontal overflow.
- Use a smooth, steadily darkening iPod face gradient so its lower-right corner does not read as a fold. Place transition light in an independent expanded layer and use a closest-side radial gradient that reaches zero alpha before all four canvas edges. Lower its dark-theme intensity; extending the canvas alone would only move the visible cutoff.

## Implementation boundaries

- `packages/experience/device-gallery.ts`: independent device selection and autoplay clock; observable snapshots, pause reasons and lifecycle cleanup.
- `packages/experience/device-gallery-dom.ts`: focus/visibility/viewport integration and chapter keyboard navigation.
- `packages/experience/click-wheel.ts`: captured pointer rotation, angular seam wrapping, step accumulation and dragged-click suppression.
- `packages/experience/handheld.ts`: shared selected-link actions, keyboard adapter and bounded pointer tilt.
- `packages/experience/ride-instruments.ts`: one finite navigation-driven speed/gear/RPM clock shared by the Honda displays.
- `apps/landing/DeviceGallery.tsx`: scene, transition layers, chapter rail and playback control.
- `apps/landing/SceneAccessories.tsx`: device-specific SVG keepsakes, finite entrances, responsive placement and shared material gradients.
- `apps/landing/devices/`: six hardware shells and their native screen presentations.
- `apps/landing/devices.css`: hardware materials, responsive geometry and nonlinear transitions.

No new runtime dependency, external image/font request or storage binding is required. SSR and the initial client render present only the complete first device. The browser prepares the remaining scenes one at a time during idle callbacks, with a cancellable 100 ms timer fallback. A chapter selected before preparation completes still renders immediately.

Prepared scenes retain their DOM and layout in a cache bounded to six layers. Hidden layers use `visibility: hidden`, `inert` and `aria-hidden`, accept no pointer input and run no CSS animations or transitions. Inactive devices skip React updates until activation, when they receive the current shared selection and profile state; decorative SVGs are memoized. This avoids constructing and laying out a complete machine during the click while preserving the original entrances, geometry and native controls.

The stage and device layers use layout/style containment to limit the work of a scene change without clipping its paint. Unbordered devices share the existing hardware-position container for relative sizing; only the bordered iPod and Garmin shells retain a second inner container. Accessories, light and shadows remain free to extend beyond these containers.

The selected destination and profile panel are shared across devices. The Nokia grip opens/closes the slider; its directional pad, soft keys and numeric keypad are usable. The Macintosh has desktop links, keyboard controls and a mouse. The iPod wheel accepts both button presses and circular pointer gestures, ignoring the center and unrelated pointers; document-level release/cancel handling also ends short presses released outside the wheel. Garmin uses its physical buttons around the portrait screen.

Honda combines a landscape TFT, secondary LCD and separate switchgear. Navigation engages D immediately and eases toward 72 km/h; the two speed readings, both gear indicators and the RPM bar use one observable state. After 2.2 seconds without another input, speed eases down over 3.2 seconds, remains at zero in D for 2.6 seconds and returns to N. New input accelerates from the current value. Exit, page hiding and teardown cancel scheduled work; idle schedules nothing. These values are an interaction animation, not recorded personal riding data.

The left-hand Chinese copy reads: “凭着喜欢，把一些东西带在身边。久而久之，连看世界的方式也有了它们的影子。旧物收着回忆，有些习惯与好奇，却一直随身。” It is new user-requested interface prose; the established profile facts and public Markdown remain intact.

## Small-screen typography and assets

`assets/fonts/journey-cjk.woff2` is a self-hosted 217-character Noto Sans SC subset covering the CJK text in the public landing content and UI. Its variable weight range is 400–700 and its file size is 64,792 bytes. The SIL Open Font License is retained in `assets/fonts/OFL.txt`; `characters.txt` records the glyph set. Latin typefaces and the résumé's typography retain their existing sources.

Regenerate only when public copy needs additional glyphs:

    bun scripts/create-journey-font.ts

The script reads an explicit allowlist of public landing components and the two public landing Markdown documents, sends only the deduplicated CJK characters to Google Fonts, verifies the font host/WOFF2 signature and saves the accompanying license. This is an offline authoring step; production requests all fonts from its own origin. Review screen fit and affected snapshots after regeneration.

Development HTML links `devices.css` before hydration, alongside the existing base/landing styles. Isolated development fixtures copy the font assets, so the no-JavaScript and HMR tests exercise the same typography and initial layout.

## Verification scope

1. Red/Green tests for stronger tilt, ordered wrapping, rapid selection, pause/resume remaining time, reduced motion and timer cleanup.
2. Real browser checks for all six devices in both languages, light/dark, desktop/mobile, real controls and identical destinations; axe and screen overflow checks.
3. Autoplay, manual selection, focus, hidden-page behavior, nonlinear transitions, coarse pointer and reduced motion regression tests.
4. Preserve existing résumé, HTTP, content and development regression checks. Recheck the existing 95% coverage, zero-warning static gates, resource budgets and cold-performance budgets without lowering thresholds.
5. Review new screenshots before updating affected landing baselines. Record observed results here when complete.

Observed Red included the missing gallery behaviors, the original ±1.5° tilt failing the new ±6° assertion, missing DOM/wheel adapters, a block-layout chapter rail before development JavaScript and a 4px Chinese Game Boy overflow at 320px. Browser checks also exposed native content overflow in the Macintosh, Nokia, Garmin and Honda, a Firefox bottom-padding difference and insufficient chapter-rail contrast. These were corrected in the layouts and palette without loosening checks.

The subsequent visual review identified a detached Hold switch, an exposed Garmin mount, rectangular reflections around composite cases and hard stage boundaries. The revised shells, surface-shaped reflections and unclipped stage address those findings. Added accessories remain decorative and accept no pointer or keyboard input.

The next feedback round corrected earbud cable joins, matching half-finger gloves, Macintosh alignment, the helmet profile and default autoplay, and added the finite Honda instrument sequence. New unit Red covered outside-wheel release, cancelled-drag click suppression, pointer focus leaving autoplay paused, reduced-motion defaults and the missing instrument controller. Firefox event recordings also exposed smooth page scrolling moving links under a stationary pointer. The personal page now settles native focus scrolling immediately, and link selection follows intentional pointer movement rather than synthetic hover changes. A real wheel-scroll regression verifies that stationary-pointer scrolling preserves selection.

WebKit reports zero `movementX`/`movementY` for the pointer moves in that regression, so shared hover selection compares actual client coordinates instead. The narrow touch check now scrolls the whole device into view before tapping: the longer introduction had left just eight pixels of its Down key at the Chromium viewport's bottom edge, where a tap targeted the root document despite the DOM hit test reporting the key. The control succeeds when fully visible; no forced click, delay or assertion relaxation was added.

The final shortcut Red showed left/right still invoking the profile toggle, no chapter switch from the page, and up/down failing to enter the menu from the chapter rail. Separate horizontal and vertical handlers now pass those assertions. Real browser checks follow focus across every device, wrap the sequence, open a link with Enter and preserve unrelated header controls. Light/dark transition review also compares the glow with an identical frame without glow: the enlarged canvas boundary has zero changed pixels, followed by a gradual increase inward. Device accessories are reviewed during transitions as well as at rest.

There are 48 personal-page Chromium baselines: eight full-page Game Boy views plus forty gallery views for the five additional devices, covering both languages, themes and viewport sizes. The eight local résumé views remain unchanged by the device journey. Personal-page baselines use the pinned CJK subset in both `darwin` and `darwin-ci`; the résumé retains its platform-specific system-font variants. Release review also transfers the previously committed résumé keepsake into its eight CI baselines: only the 705–1,258 decoration pixels change in each image, with no overlap with platform-font differences. All other CI pixels and image dimensions are preserved. The comparison threshold remains 0.001. Gallery snapshots mask only the moving chapter progress; existing full-page snapshots retain only their version mask. Remote CI remains mandatory before artifact publication.

The [first release CI run](https://github.com/nocoo/lizheng.dev/actions/runs/34000836162) correctly blocked artifact publication. Quality, HTTP and all Chromium/Firefox browser cases passed, but the English personal-page interaction medians were 216 ms at 390px and 232 ms at 1440px, above the unchanged 200 ms limit. Chromium CDP profiling traced the cost to scene layout; removing redundant sizing containers and adding layout/style containment reduced that work. WebKit also exposed small controls moving under pointer tilt, autoplay advancing during a long axe inspection, clock assertions depending on command latency and contention between three video/axe workers.

The control-stability unit regression failed before the pointer guard and now passes. Browser timing assertions use an explicitly paused clock, advancing it only for the behavior under test. Static axe inspection uses the normal scene-hover reading pause, then resets the pointer before screenshots. CI gives WebKit one worker; Chromium and Firefox retain three. No assertion, timeout, snapshot mask or performance threshold was relaxed, and automatic retries remain disabled.

The optimized full browser run passed 201 of 207 cases, including all 69 Firefox and all 69 WebKit cases. Its remaining differences were six narrow Chromium Nokia/Macintosh snapshots. Review of expected, actual and difference images confirmed the intended proportions, content, accessories and layout; those six baselines were updated in both platform sets. A subsequent normal comparison run passed all six, including their control assertions. Together, those two runs covered all 207 cases at that stage.

The [second CI run](https://github.com/nocoo/lizheng.dev/actions/runs/34002453349) passed all 207 browser cases, all eight development checks and both desktop performance cases. Mobile interaction medians of 248 ms in English and 224 ms in Chinese still blocked publication. Further CDP comparisons identified first-time scene construction/layout as the remaining dominant cost; small sizing changes alone did not provide enough margin. Idle preparation and a bounded scene cache remove that work from ordinary chapter changes. In a 12× CPU diagnostic, Nokia/Honda switch durations changed from 224/288 ms to 88/88 ms; this diagnostic is separate from the unchanged 4× CPU release gate.

Two new browser regressions verify both preparation paths, hidden-scene focus exclusion, stopped animations, exactly four accessible destination links, reuse of the prepared Nokia and current selection on the incoming Honda. Both first failed against the prior implementation (one layer instead of six) and then passed in all three engines. Existing control/tilt assertions now explicitly target the active device, while retaining their expected values and timing thresholds.

The final full browser run passed all 213 cases: 71 each in Chromium, Firefox and WebKit. All existing screenshots passed normal comparison without further baseline changes. All eight development/first-paint/HMR checks also passed with the scene cache enabled.

Production smoke testing found that Cloudflare automatically injected its analytics beacon, which the existing self-hosted CSP correctly blocked. Following the [official Web Analytics documentation](https://developers.cloudflare.com/web-analytics/get-started/), HTML responses now add `no-transform` while retaining their revalidation policy and the unchanged CSP. Eight existing page-rewrite regressions first failed on the missing directive, then all 116 edge tests passed after the header fix. The HTTP matrix also checks GET/HEAD consistency and preserves Markdown/asset policies, and the production verifier rejects a missing directive or injected beacon. Cloudflare's [cache documentation](https://developers.cloudflare.com/cache/concepts/cache-control/) notes that this directive also disables additional edge transformations, including compression of an uncompressed origin response; it is deliberately limited to HTML. Final production browser and transfer checks are recorded with the release.

## Final local verification

All checks below have passing local evidence on 2026-09-06. No test was skipped or made less strict, and automatic retries remain disabled. Earlier CI and comparison findings are recorded above.

| Check | Observed result |
| --- | --- |
| L1 | 220 tests; statements, functions and lines 100%; branches 99.77%; every logic metric exceeds the unchanged 95% threshold |
| L2 | Four complete host matrices against isolated workerd and real assets, including both languages, live versions and legacy 301s |
| L3 | All 213 cases passed in one final run: 71 each across Chromium, Firefox and WebKit, with zero axe violations in the tested matrix and no further snapshot changes |
| Development | All eight first-paint and HMR regressions passed |
| G1 | Biome zero warnings/errors, strict TypeScript, generated Worker types, Knip and active documentation checks passed |
| G2 | Gitleaks clean; OSV scanned all 341 locked packages with no issues; resource budgets passed |
| Performance | All six cold-performance scenarios passed, including every device switch, native controls and the Honda drive animation |
| Local HTTPS | Both surfaces and their live endpoints returned v3.1.0 |

Husky remains active. The existing hook verification blocked all 17 injected failure paths; commit and push also enforce their normal gates. `bun install --frozen-lockfile` required no dependency or lockfile changes. Only public metrics are retained in the [performance evidence](evidence/2026-09-06-device-performance.json).

Performance uses Chromium with normal motion, 4× CPU throttling, 1.6 Mbps download, 0.75 Mbps upload and 150 ms latency. Each scenario has three cold samples. Interaction values below are the median of each sample's longest measured interaction.

| Surface / language / width | Median LCP | Median CLS | Median longest interaction |
| --- | --- | --- | --- |
| Résumé / en / 390 | 488 ms | 0.043717 | 24 ms |
| Résumé / en / 1440 | 492 ms | 0.001450 | 32 ms |
| Personal / en / 390 | 1,028 ms | 0.000858 | 48 ms |
| Personal / en / 1440 | 1,060 ms | 0.001142 | 72 ms |
| Personal / zh / 390 | 1,028 ms | 0.000563 | 48 ms |
| Personal / zh / 1440 | 1,044 ms | 0.001052 | 64 ms |

The maximum observed interaction was 80 ms and the largest observed long task was 165 ms. The cache moves scene preparation into idle work; the recorded long tasks remain part of the performance evidence. All scenarios meet the unchanged median budgets of 2,500 ms LCP, 0.05 CLS and 200 ms interaction duration. These are laboratory observations, not real-user INP or physical-device measurements.

| Surface | JS gzip | CSS gzip | Fonts | Images | Total en / zh |
| --- | --- | --- | --- | --- | --- |
| Personal | 78,478 B | 17,516 B | 118,612 B | 984 B | 220,910 / 221,280 B |
| Résumé | 763 B | 3,881 B | 132,240 B | 27,250 B | 168,695 / 169,163 B |

The release uses the existing mandatory CI → validated Worker artifact → production deployment flow. The [v3.1.0 release record](https://github.com/nocoo/lizheng.dev/releases/tag/v3.1.0) records the remote CI, deployment and production verification when published; local results alone do not establish those outcomes.
