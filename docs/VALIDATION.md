# Local validation

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
