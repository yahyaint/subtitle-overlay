# Local validation

## 0.7.10 tip update — October 10, 2026

The popup adds an optional Tip link to `https://yahyanabil.com/support`. It adds no permission and no paid feature gate. Subtitle rendering, parsing, downloads, and sync logic are unchanged from 0.7.9.

The static checks and real-UI store asset render pass. The support URL returns HTTP 200. A full local test rerun hit system memory limits. The prior six-suite results below remain the baseline; they are not a claim that the full rerun passed for 0.7.10. GitHub Actions runs the full suite from the published source.

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

The GitHub Actions workflow is prepared but has not run on GitHub. Live signed-in Disney+ playback, real Vivaldi seek behavior, and authenticated OpenSubtitles delivery remain unconfirmed for this version.

A fresh profile must still be tested through the installed store package before public release. The publisher must create the public support and privacy URLs and complete the store contact and disclosure fields.

Raw local reports and browser profiles stay in `.test-artifacts`. They are excluded from Git and distribution archives.
