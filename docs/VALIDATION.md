# Local validation

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
