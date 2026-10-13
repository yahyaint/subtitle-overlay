## Version 0.8.14 - October 13, 2026

All ten local integration suites pass. Static checks and real-UI store asset generation pass.

- Popup navigation is horizontal; controller navigation remains vertical. Keyboard tabs work in both.
- Saved count badges measure 12 px high with 8 px text and overlap the bookmark corner. Film/show library actions still pass.
- Detected Subtitles and Find subtitles headings both measure 19 px. Zero/nonzero transitions set the requested default panels. Manual choices survive refresh. Find cannot collapse when no tracks are available.
- Header X, side Close, and Remove share teardown. A simulated stale hide-only X is repaired by reattachment without losing the loaded subtitle. Close keeps saved files and settings.
- A trusted button enters page fullscreen with browser navigation hidden and exits. A rejected page request uses window fullscreen and restores its prior state. This was tested in Chromium; Vivaldi native-menu behavior needs publisher confirmation.
- Lazy React descriptors use the current render. Tests exclude audio, stale render descriptors, and unrelated players; import remains on demand. Files survive a closed caption menu and are cleared on video-source changes.
- Existing seek, hidden-control, segment-clock, shadow-clock, and one/two/three-sentence sync checks pass. Core clock and sentence-fit code are unchanged.

The supplied Movy movie URL `/movie/969681` was checked in isolated Chromium with film media blocked. After opening the player's subtitle search, the extension detected 89 files, grouped six English choices, and imported 2,673 English lines. Native TextTrack count was zero. This confirms caption discovery and import, not live film playback or the user's Vivaldi window. Other React player structures and cross-origin frames may need an adapter.

The current project license and third-party font license are unchanged while the publisher compares license choices. New archives are checked for manifest placement, CRCs, production-file equality, license/NOTICE equality, SHA-256 hashes, and installed-output equality.

## Version 0.8.13 - October 13, 2026

Source-Available Personal Use license replaces PolyForm for the current distribution. Viewing and running are allowed. Code edits, derivative creation, redistribution, and commercial use are not licensed. User explicitly selected no private edits. Previous grants and third-party licenses are unchanged.

Static/build/package checks verify current license and notices in every ZIP, no bundled legacy license file, package metadata, digests, and unchanged extension code apart from version strings. These are technical checks, not legal review or a guarantee of enforceability.

## Version 0.8.12 - October 11, 2026

Remove the bundled legacy license file and references to it in current documentation and packaging. The official PolyForm license and Inter font license are unchanged. Previously granted permissions remain valid.

Static and build checks pass. Package checks verify no legacy license file, official license equality, CRCs/digests, unchanged extension code apart from version strings, and installed-output equality. No feature or permission changes.

## Version 0.8.11 - October 11, 2026

Licensing and packaging update. PolyForm Noncommercial 1.0.0 is copied unchanged from its official source. LICENSE-MIT-LEGACY.txt preserves the original MIT notice for code published through v0.8.10. NOTICE and docs/LICENSING.md explain the scope and prior permissions. The Inter font license is unchanged.

Static syntax/resources and verified ZIP builds pass. Package validation checks official license equality, old MIT notice equality, required notices in all ZIPs, digests, and unchanged extension code apart from version strings. No feature or permission changes. No payment gate was added; the planned EUR 1 checkout needs an external processor.

## Version 0.8.10 - October 11, 2026

Both Close buttons use the existing Remove overlay cleanup. Subtitle text, controller, and icon are removed together. Saved files and saved settings are kept.

Checks passed:

- Design suite: header Close, rail Close from each view, and keyboard Close remove the overlay root, runtime instance, and UI font. Visible caption text is removed with the root.
- Saved extension storage is unchanged by Close. Show overlay creates one fresh overlay after each removal.
- Existing design checks cover keyboard tabs, compact sizing, file/style/sync controls, and script errors.
- Static checks, regenerated store assets, verified ZIP builds, and installed-output equality pass.

Playback-clock and sentence-sync logic are unchanged. No new permissions.

## Version 0.8.9 - October 11, 2026

The controller has a Close button at the bottom of its tool rail. The popup action is Show overlay. This release is marked stable after the publisher reported that the current build works in their setup.

Checks passed:

- The design suite: Close is visible in the compact controller and works from Controls, Find, and Saved. It stays outside the tab list. Keyboard activation returns focus to the overlay toggle.
- Show overlay opens the same view and keeps the sentence-sync mode. Existing header Close, file loading, text style, focus, and popup sizing checks still pass.
- The saved-library suite: film/show selection, episode names, refresh, load/save/delete, and empty categories.
- Controller screenshot inspected. Store screenshots and public site assets regenerated. Static checks and verified ZIP builds pass.

Playback-clock code and subtitle timing are unchanged. No new permissions. Live player and provider support can vary.

## Version 0.8.8 - October 11, 2026

Saved has separate Films and Shows views in the popup and controller. Shows use show, season, and episode selectors. This is a display change; stored files and settings do not need a migration.

Checks passed:

- Four focused local browser suites: saved-library, design, automatic, and main integration.
- Current episode selection in both views, older title-only records, episode names, numeric sorting, Specials, and same-episode language/release variants.
- Selection after refresh, episode load/save with timing settings, single-track deletion, remaining categories, and empty shows.
- Existing film saves, offline loading, import/archive paths, popup/controller search sharing, sentence sync, and cached settings.
- Popup/controller screenshots inspected. Store screenshots regenerated. Static resource and syntax checks, ZIP integrity/digests, and installed-file equality pass.

The test command now includes ten suites. The four affected suites were run for this release. The full nine-suite run passed on 0.8.7 before this display change; film-clock code is unchanged.

No new permissions. Live player and provider support can vary.

## Version 0.8.7 - October 11, 2026

The controller no longer replaces the detected film with a stale saved search. The popup and controller share search fields for the active tab. Player subtitles stays first, with a 20 px gap before online search.

Checks passed:

- All nine local integration suites on the final extension code.
- A held real settings response reproduces the startup race. The current film and year remain correct when the response arrives. Language and method still load.
- Popup/controller edits to title, year, language, and method agree. Edits survive polling and reopening. A new film resets title/year. Old-page writes are rejected.
- Open and closed Player subtitles panels keep a measured gap before online search. Compact controls, keyboard focus, and fixed popup actions remain usable.
- Subtitle imports, saved style/timing, seeks, segment-clock recovery, and one/two/three-sentence sync pass.
- JavaScript/manifest checks, four store screenshots, ZIP integrity, digests, and installed-file equality pass.

No new permissions. These are local browser checks. Live player and provider support can vary.

## Version 0.8.6 - October 11, 2026

All nine local integration suites pass. Static checks and test syntax checks pass. Store image generation passes; the Player subtitles screenshot was inspected.

New checks cover first-panel order in both Find views, native track updates within 900 ms, unchanged Refresh without change notifications, custom caption links in open shadow roots, public Video.js/JW Player/Artplayer caption adapters, language grouping, file imports on demand, and exclusion of metadata/other players/removed sources. Source-change tests use a controlled pending response rather than a fixed delay. Episode routing tests prepare saved entries before changing the episode.

Existing checks cover local files, archive downloads, ASS/SSA, saved style and timing, one/two/three-sentence sync, seeking, segmented clocks, shadow controls, and cleanup.

Live Movy check: https://www.movy.sx/tv/138502/1/4 opened and played in an isolated Chromium window. Its episode player exposed no native tracks; its own caption menu text reported no subtitles available. This does not prove that all Movy episodes or servers have no subtitles. Public player APIs were tested with local adapters, not live engine distributions. Cross-origin iframe players need a separate integration. Live Disney+ player-subtitle import and authenticated OpenSubtitles delivery remain unverified.

# Local validation

## 0.8.5 soft-white browser checks - October 11, 2026

The popup, controller, and subtitle website setup use soft-white accents. Caption colors and marine backgrounds remain. The Tip browser fixture now uses the intrinsic 440 px popup width. This corrects the old 370 px preview assertion that failed in the 0.8.3 GitHub check.

The focused design and Tip checks pass. Actual Chrome action-popup inspection reports 440 px content width with the footer contained in the browser-limited height. Store assets were rendered again and reviewed with white accents. Static, ZIP, digest, and production-file checks pass. Tests use isolated local Chromium fixtures; no live streaming check is claimed. Playback and subtitle algorithms are unchanged.

## 0.8.4 soft-white accents - October 11, 2026

Soft white #dce4ec replaces gold #c6b07c in the popup, controller, and subtitle website setup. Marine surfaces and caption colors remain unchanged.

Static and package checks pass. A byte comparison confirms that the three theme files change only this color literal. The upload archive contains the new accent and no old gold accent in these files. Browser-render checks were attempted but Chromium exited with access denied under the current local process sandbox. No new browser-render pass is claimed. The store screenshots remain the real 0.8.3 captures. The earlier popup sizing and behavioral checks remain the baseline.

## 0.8.3 intrinsic browser popup sizing - October 11, 2026

The popup document and body have an intrinsic 440 px width. The old viewport-capped rule could retain Vivaldi's narrow starting viewport. The three-bar header decoration and its CSS are removed. The document requests 590 px height; the body fits the available height. Main is a flex column so only the workspace scrolls while the header and file-action footer remain visible.

The focused design browser check passes from 200 px, 440 px, and 800 px starting viewports. A separate actual Chrome action-popup check calls chrome.action.openPopup and reads its popup target through CDP. With a 200 px starting browser viewport, the popup reports a 448 px viewport, 440 px document/body, 510 px available height, and footer bottom at 510 px. No header decoration remains. The captured actual popup shows all footer actions. This directly checks browser auto-sizing rather than a manually enlarged preview. The current fix still needs confirmation in Vivaldi.

Keyboard navigation, font loading, focus, sampled action contrast, compact controller access, and sync/style/import/file paths pass. Final store assets and static/package checks pass. No player, subtitle, sync, storage, or request logic changed. Tests use isolated local Chromium fixtures; no live stream is claimed.

## 0.8.2 muted theme and wider popup - October 11, 2026

The popup is 440 px wide instead of 392 px. Player status and film-source hints use plain helper text without a side rule. Marine surfaces, buttons, gold accents, and the logo use less saturated colors. Narrow-screen access remains. Caption appearance is unchanged.

The focused design browser check passes: popup access at 440 px and 320 px, local Inter loading and cleanup, keyboard navigation, focus, sampled action contrast, compact controller access, and sync/style/import/file paths. Final store asset rendering and screenshot review pass. Static checks pass. A source comparison confirms that the controller's executable logic is unchanged outside the style sheet and logo colors; background changes only its version label. The nine-suite 0.8.1 regression remains the behavioral baseline. Checks use isolated local Chromium fixtures and sample video, not a live signed-in stream.

## 0.8.1 remove dub audio - October 11, 2026

Find dub audio, audio pages, provider routes, catalogs, source examples, and bundled source data are removed. Updates clear only the retired audio preferences and session tokens. Saved subtitles, OpenSubtitles access, and film matching remain. Subtitle website setup now uses its own stylesheet.

All nine local integration suites pass. The design fixture checks the removed action and route, legacy storage cleanup, retained subtitle credentials and files, and unchanged title normalization. The other suites cover player import and original style restore, subtitle formats, automatic downloads, first-use website access, saved presets, seeking, one/two/three-sentence sync, film clocks, fullscreen, and caption movement around player controls. Static checks and updated store assets pass. No new permissions are added. These checks use isolated local Chromium fixtures; this release has not been tested in a live signed-in stream.

## 0.8.0 New Design - October 11, 2026

The popup and controller share a tool rail, fixed popup file dock, surfaced file card, and larger timing readout. Inter is bundled for app controls. The final palette adapts Color Hunt: marine dominates, amber marks selected actions and timing, and silver supports text. The original logo remains. Caption font and appearance settings remain user-controlled.

The nine-suite local regression passes. After the font and palette changes, focused design, Tip, and core overlay reruns pass. The design test verifies actual Inter loading in the popup and video document, font cleanup, 320px popup access, a compact controller, vertical keyboard navigation, focus, action contrast, and all sync/style/import/file paths. Core overlay checks preserve seeking, sentence sync, imported appearance, library saves, provider results, fullscreen, and cleanup. Static checks and final store screenshots pass. No new extension permissions or playback algorithms are added. A dynamic resource rule exposes only the bundled font.

Behavior contract: 12 retained outcomes. Visual review score: 22/26; see [design notes](design/NEW-DESIGN.md). Checks use isolated local Chromium fixtures and sample video. The final design still needs a live signed-in player check and store review.

## 0.7.17 player-control clearance - October 11, 2026

Bottom captions clear visible lower player controls and return to the configured distance when the controls hide. Avoid player controls is enabled by default under Text style > Position and can be saved with a subtitle. The lift is a temporary render offset. It does not change the saved distance, imported original appearance, delay, rate, or sync points.

The shadow-clock browser fixture checks control bounds in a sibling open shadow root, parent opacity/display/visibility, reduced motion, opt-out, top captions, positions already above controls, and controls below the video. A focused final check also confirms that a new line after a gap appears above visible controls immediately. Native browser controls use a bounded video-interaction estimate because their drawn bounds are not public. Closed shadow roots and cross-frame controls may not be supported.

All eight local integration suites pass. Style import/restore, saved presets, file/download paths, fullscreen, large subtitle tracks, segmented film clocks, forward/backward seeks, and all three sentence-sync modes pass their regression checks. Static checks and updated real-UI store assets pass. The clock and sentence-fit algorithms are unchanged. No new permissions were added. These are isolated local Chromium fixtures; the new clearance behavior still needs a live check in the user's signed-in player.

## 0.7.16 simplified player actions - October 11, 2026

Use player and Restore player are removed from the popup and overlay. Import and Refresh remain. The unused native-display action and its disabled-control state are removed. Restore player style remains in Text style.

Caption choices still restore automatically when another file is loaded, the film changes, or the overlay is removed. The player-track test checks both button removals, native cue import without the removed actions, file import, language groups, copied style and position, Save, style restoration, all sync anchors, later site caption choices, and cleanup. The local video fixture now draws a moving marker to avoid recording a static clip with no usable frames.

All eight local integration suites pass, followed by the final player-track checks after the second button removal. Static checks and the four updated store screenshots pass. No permissions or clock and sentence-fit algorithms were changed.

## 0.7.14 languages and series - October 11, 2026

The popup and overlay group selected-player tracks by their language codes. The popup filters its loaded list immediately without waiting for a tab reply. Browser tests check named groups, counts, language filtering, filter retention on refresh, regional codes, and Unknown language. Discovery still leaves track modes and lazy file loading unchanged.

All 53 search language options map to a website language filter. Episode tests cover Media Session titles and album metadata, player attributes, special episodes, JSON-LD with referenced season/series nodes, episode-only player titles, and editable search fields. API search sends the show name, season, and episode numbers. Saved routing separates episodes. Missing episode names and optional metadata keep the loaded subtitle and timing; a new episode clears the old subtitle.

An isolated Chromium check of the supplied Cinejoy page recognizes The Bear S03E04 - Violet from player metadata and page details. It groups 91 public tracks, including 14 Arabic tracks. Media requests were blocked. This checks public metadata and groups, not full live playback or the user's Vivaldi window.

All eight local integration suites pass. A final automatic-download/recognition rerun also passes after the last language-map and title-punctuation changes. Style import/restore, all three sentence-sync modes, segmented clocks, seeking, file imports, and downloads pass their regression checks. Static checks and four real-UI store screenshots pass. No new permissions were added.

## 0.7.13 player appearance � October 11, 2026

The supplied Cinejoy episode imported 641 English lines and its public caption appearance: Inter at 28.8 px, white text, a black background at 50% opacity, a 2 px shadow offset with 4 px blur, padding, and video-relative position. The check used an isolated Chromium window with media requests blocked. It checks subtitle loading and appearance capture, not full live playback or the user's Vivaldi window.

The player-track suite checks a hidden custom caption renderer, copied font and background alpha, shadow, spacing, top and bottom positioning, rendered geometry, Save/reload of the original appearance, and Restore player style. Restore retains delay, timing scale, sentence mode, and all three sync points. It also checks native cue position with an unreadable-font message, malformed style rejection, old presets, failed-import preservation, and original renderer visibility restoration.

All eight local integration suites pass. A focused native-track check also verifies position capture after a disabled track loads and restoration of its original mode. Static package checks and store asset generation pass.

Clock and sentence-sync algorithms were not changed. No permissions were added. Native drawn fonts, per-line effects, and animations remain outside this feature.

## 0.7.12 lazy player files — October 11, 2026

A browser check of the supplied Cinejoy episode found 91 public HTML caption tracks with empty cue lists. Its selected file was SRT. The fixed loader imported 641 English lines through normal browser CORS access while the native track still had zero cues. Video and media requests were blocked during this check. This checks the subtitle loader on the live page, not full live playback.

The player-track integration suite also checks empty SRT source tracks, no file requests during discovery, selected-file loading, cached counts, Arabic text, full-file film timestamps with a segmented native clock, three-sentence sync, Save, bad responses, changed source URLs, and ASS conversion. No new permissions or player-clock changes were added.

All eight local integration suites pass across the combined run and focused reruns. The first combined run timed out while opening the provider permission window; its focused rerun passed. The final file-timestamp change also passed the player-track suite. Static checks and store asset generation pass.

## 0.7.11 player subtitles — October 11, 2026

Player detection reads subtitle and caption track labels from the selected video. It leaves track modes unchanged until the user selects Use player or Import. Import reads loaded public cues, maps their times to the film clock, and uses the existing subtitle settings and local Save path. No new permissions were added.

The new browser suite uses real TextTrack and VTTCue objects, lazy-loaded WebVTT, Arabic text, and a segment/film-clock fixture. Live player-subtitle import on Disney+ remains unconfirmed. The publisher's live playback/seek/sentence-sync check below applies to 0.7.10.

All eight local integration suites pass. The player-track suite checks detection without caption changes, original display, Arabic import, film-clock mapping, sentence sync, saved timing and text style, late tracks, failed-import recovery, and restoration on removal. The popup layout, file formats, download routing, seeking, clock bridge, and shadow-root clock suites also pass. Static checks, real-UI store asset generation, and archive build checks pass.

## 0.7.10 tip update — October 10, 2026

The popup adds an optional Tip link to `https://yahyanabil.com/support`. It adds no permission and no paid feature gate. Subtitle rendering, parsing, downloads, and sync logic are unchanged from 0.7.9.

The static checks and real-UI store asset render pass. The support URL returns HTTP 200. The focused Tip test passes: the new tab has no window opener, referrer, credentials, or extra permission. The popup fits its width and height.

The first rerun used Playwright's page-creator reference to test window security. Formatting that failed object assertion exhausted memory. The corrected test reads `window.opener` in the destination page. The prior six-suite results below remain the baseline. GitHub Actions runs the full updated suite from the published source.

All seven integration suites, static checks, and package builds passed on GitHub Linux for version 0.7.10. See the [completed checks](https://github.com/yahyaint/subtitle-overlay/actions/runs/38077867401). The clock tests replay the Disney+ player report and cover seeking and one-, two-, and three-sentence sync. These tests use local fixtures.

## Live Disney+ check — October 10, 2026

The publisher confirmed that Disney+ works in Vivaldi on Windows with version 0.7.10. The check includes playback, seeking with the video controls, and sentence sync. This is a publisher-reported live check. The automated tests above use local fixtures.

This confirmation applies to the tested setup. Other player and browser combinations still need testing.

## 0.7.9 baseline

Version: 0.7.9 preview. Date: October 5, 2026.

## Passed

- `npm ci --ignore-scripts` installs the exact dependencies in the lockfile.
- Static checks validate Manifest V3, matching versions, permissions, packaged resources, JavaScript syntax, and icon dimensions.
- All six local integration suites pass from this repository with its locked Playwright dependency.
- The main suite uses a real, locally generated video for pause, seek, playback, captions, text style, fullscreen, and saved-settings checks.
- Format tests cover ASS/SSA text conversion and archive imports.
- Website tests cover selected download matching, redirects, ZIP/gzip import, tracking lifetime, and unrelated-download exclusion. Provider transport uses local fixtures or mocks.
- Seek tests cover 20,000 cues, metadata changes, current-sentence selection, invalid clocks, and saved sync settings.
- Clock-bridge and open-shadow-root tests cover one-, two-, and three-sentence sync, hidden controls, segment-clock resets, report export, and cleanup.
- Store screenshots show the actual extension UI on an original local demo video. Their dimensions are 1280 × 800.
- The build checks every ZIP entry against its source bytes. The store ZIP has its manifest at the root. The build writes SHA-256 hashes.
- An independent Python check verifies ZIP CRC values, SHA-256 hashes, manifest placement, file scope, and extraction.
- The exact extracted store ZIP loads in a fresh headless Chromium profile. Its service worker, popup, Settings tab, and version check pass.

## Still needed

GitHub Actions runs the tests after each push. The website test fixtures attach before the first search-page navigation to support both Windows and Linux. Authenticated OpenSubtitles delivery remains unconfirmed for this version.

The store installation must still be checked in a fresh profile after upload. Public support is available through GitHub Issues. The publisher must host the privacy page and complete the store contact and disclosure fields.

Raw local reports and browser profiles stay in `.test-artifacts`. They are excluded from Git and distribution archives.
