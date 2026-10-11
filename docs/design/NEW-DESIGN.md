# New Design

## Contract

Replace popup and controller presentation. Keep the marine-blue identity and existing logo. Keep local and provider file loading, public player-track import, subtitle rendering, film recognition, library storage, timing, all sentence-sync modes, fullscreen, and permission boundaries. Do not change clocks, subtitle parsing, network requests, or credential handling.

| ID | Outcome to preserve | Evidence |
| --- | --- | --- |
| B1 | Open controls on the selected video; repeated attachment stays unique | `verify`, `verify-clock-bridge` |
| B2 | Find subtitles from website/API, edit search link and credentials | `verify`, `verify-automatic` |
| B3 | Load local SRT/VTT/SUB/ASS/SSA/ZIP/gzip and select archive tracks | `verify`, `verify-ass`, `verify-automatic` |
| B4 | Recognize films/episodes; preserve manual search edits and correct routing | `verify-automatic`, `verify-sync-seek` |
| B5 | Group player tracks by language; import text and readable appearance | `verify-player-tracks` |
| B6 | Save/reload subtitle text, original appearance and timing; reject bad tracks | `verify`, `verify-player-tracks` |
| B7 | Delay, rate and one/two/three-sentence sync survive seeks | `verify`, `verify-sync-seek`, `verify-shadow-clock` |
| B8 | Font, color, size, background, shadow, position and spacing remain reachable | `verify`, `verify-player-tracks` |
| B9 | Temporary control clearance preserves saved position; opt-out and reduced motion work | `verify-shadow-clock` |
| B10 | Fullscreen, close, toggle, report export and complete cleanup work | `verify`, `verify-clock-bridge` |
| B11 | Tip stays available; no extra permissions or referrer | `verify-tip` |
| B12 | Visible focus, keyboard tabs, readable states, compact viewport and RTL isolation work | `verify`, focused design checks |

## Research

- [NN/g: Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): put frequent actions first and keep advanced controls clearly reachable.
- [NN/g: Recognition and recall](https://www.nngroup.com/articles/recognition-and-recall/): keep named actions and current context visible.
- [Material Design: Compact layouts](https://m3.material.io/foundations/layout/canonical-examples/overview): adapt grouping and navigation to the available window.
- [Material Design: Typography](https://m3.material.io/styles/typography/applying-type): separate text roles and use tabular numbers for clocks.

These principles guide the layout; they do not prove usability for this extension. Local behavior and visual checks provide implementation evidence.

## Visual brief

A viewing companion for people who want to find, load, align, and restyle subtitles while watching. Show one clear task at a time. Keep the film visible. Use the logo and marine blue as identity assets, with a distinct hierarchy for title, action, timing, and helper text. Use local fonts and bundled SVG only. Keep motion short and respect reduced motion. No remote design code or analytics.

## Candidate coverage

| Behavior | Screening Room | Subtitle Desk | Broadcast Booth |
| --- | --- | --- | --- |
| B1/B3 | Persistent Open controls/Load file dock | File shelf and bottom command strip | Source bank |
| B2/B4 | Find workspace with detected title | Editorial search sheet | Source step with title metadata |
| B5 | Player-track disclosure inside Find | Player source sheet | Track bank |
| B6 | Saved rail and active-file card | Library shelf | Preset bank |
| B7 | Large delay readout and sentence-sync sheet | Horizontal timing dock and sync drawer | Timing console |
| B8/B9 | Text-style inspector with nested sections | Typography sheet | Style console |
| B10/B12 | Labeled rail, header actions, advanced sheet | Bottom labels and compact command strip | Numbered steps and utilities |
| B11 | Quiet support footer | Links on library shelf | Utility row |

All candidates use mocked state during exploration. Production integration keeps existing domain code and stable control IDs.

## Selection

User selected Codex local. The selection question remained unanswered while baseline checks and concept work continued; the stated default was autonomous selection. Screening Room is selected: its labeled rail and persistent file dock make the next action easy to find without putting account setup on the main task path. Subtitle Desk uses more video width and a light surface. Broadcast Booth favors precision and density over quick recognition.

The production controller uses the same labeled rail as the popup, with Controls, Find, and Saved. It uses a prominent delay readout, an active-file card, and separate sync, text, and advanced inspectors. The popup moves global file actions to a persistent bottom dock and puts player-track import inside Find. Stable IDs and native details remain adapters for existing logic; their presentation is replaced.

Reviewed visual distance: shell/navigation 2, silhouette 2, grouping 1, typography 1, rhythm 1, grammar 2, palette/motion 2 = 22/26. This is a review score, not a usability guarantee. Before/after local demo renders show the new rail, fixed action dock, timing focal point, surfaced file card, and stacked inspectors. The marine-blue identity and logo are retained on purpose.


## Visual and access checks

Three local concepts were rendered at desktop and 390px widths. Screening Room was integrated, then checked against the previous controller screenshots. The score is 22/26: shell/navigation 6, silhouette 6, grouping 2, typography 1, rhythm 1, component grammar 4, palette/motion 2. The rail, bottom action dock, and timing card change the main layout. The marine identity and native disclosure behavior remain familiar. Inter replaces the system UI typeface.

Text and focus checks use the actual local theme. White on marine actions and silver text on the dark marine shell meet the sampled minimum contrast check; muted gold marks focus and navigation. These checks cover the sampled theme roles, not a full accessibility certification. SVG decoration is hidden from assistive technology. Tabs have names, selected state, and vertical arrow-key navigation. Short windows scroll within the workspace while the header and tool rail remain available.

Tool changes reset workspace scroll to show the view heading. They retain form inputs, playback time, and subtitle settings. Player import sits below the search form in Find. Caption lift and reduced-motion behavior remain in the rendering path.


## Font and three-color revision

The user requested a new UI font and three main colors, then chose marine as the dominant color. Inter is selected for the app labels and controls. Its [official design notes](https://rsms.me/inter/) describe small-text optical sizing, interface use, and tabular numerals. The variable font is bundled locally, including its upstream copyright notice. No CDN request is made during use. The caption font remains a user setting. Removal releases the controller's font registration.

The final palette adapts [Color Hunt's navy/marine/gold palette](https://colorhunt.co/palette/191d881450a3337ccfffc436). Muted marine `#274c73` is the dominant identity, with deep marine surfaces. Muted gold `#c6b07c` marks selected tools, focus, and timing. Silver `#e7edf3` supports text. Accents occupy small areas; file surfaces stay marine. The original logo is retained. Contrast follows the [W3C minimum-contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum).

Font source: `https://rsms.me/inter/font-files/InterVariable.woff2?v=4.1`.
Font SHA-256: `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3`.
Upstream notice source: `https://raw.githubusercontent.com/rsms/inter/v4.1/LICENSE.txt`. The font notice is separate from the project's MIT license.

The controller font is the only web-accessible resource. It uses a dynamic session URL. The resource rule exposes no executable code or user data.


## Final evidence

The behavior contract covers B1-B12. All 12 outcomes are retained. The nine-suite regression run passed, including file formats, search, downloads, recognition, imported styles, saved presets, all sentence-sync modes, segmented clocks, seeking, fullscreen, and caption clearance. After the font and final palette changes, focused UI/font and core overlay checks cover the changed paths. The font test confirms a loaded Inter face in both popup and video document, plus removal of the controller registration on cleanup.

Commands: `npm run check`, `npm test`, `node tests/verify-design.cjs`, `node tests/verify-tip.cjs`, `node tests/verify.cjs`, `npm run store:assets`, and `npm run build`. Screenshot review covers desktop controls and text style, popup at 440px, popup sizing from a 200px initial viewport, and controller at 390x600. Store screenshots use local sample video.

Remaining checks: the final design still needs a live signed-in player check and store review. Browser-native HUD clearance remains an interaction estimate. No new extension permissions, playback algorithms, provider endpoints, or credential operations are added. The one web-accessible font resource is a presentation asset.

The 0.8.2 refinement widens the popup to 440 px, reduces saturation across the app theme and logo, and removes side rules from player status and film-source helper text. Caption appearance and timing remain user settings.

Version 0.8.3 sets an intrinsic 440 px popup document/body width. The previous viewport-capped width could shrink in Vivaldi. The header no longer includes the decorative three-bar mark. Narrow-window responsiveness remains on the video controller.

The actual Chrome action popup is measured through its CDP target after chrome.action.openPopup: 440 px content width and a footer contained within the browser-limited height. The main wrapper is a flex column so the workspace absorbs scrolling; the header and file actions stay visible.
