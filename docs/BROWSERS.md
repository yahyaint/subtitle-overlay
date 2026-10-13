# Browser builds

Run `npm ci`, then `npm run build`. All browser targets use the same bundled code, font, and license. Generated manifests contain no permanent website access. Grant website access only when needed.

| Browser | Build | Status |
| --- | --- | --- |
| Chrome, Edge 132+ | `dist/chromium/extension` or the release ZIP | Desktop integration tests |
| Brave, Vivaldi, Opera and other current Chromium desktop browsers | Same Chromium build | Same extension APIs; Vivaldi playback previously confirmed by publisher; other browsers need a smoke test |
| Firefox desktop 140 or later | `dist/firefox/extension` or `firefox-unsigned.xpi` | Separate Manifest V3 event background and Promise APIs; real Firefox extension-context integration checks |
| Current Firefox-based desktop browsers (LibreWolf, Waterfox, Zen) | Firefox build, with a 140+ Firefox engine | Expected compatibility; not separately tested; fork signing requirements may differ |
| Safari desktop | `dist/safari/extension` or `safari-source.zip` | Experimental conversion source; Apple packaging and Safari testing still required |
| Firefox Android / mobile Safari | No supported mobile release | Desktop search windows, fullscreen controls and download tracking require mobile-specific work |

## Chromium desktop

Extract the release ZIP. Open the browser's Extensions page. Turn on Developer mode. Select Load unpacked and choose `extension`. Keep the same folder when updating to preserve the local library.

## Firefox desktop

Open `about:debugging#/runtime/this-firefox`. Select Load Temporary Add-on. Choose `manifest.json` inside `dist/firefox/extension`, or the unsigned XPI. Temporary installations end when Firefox restarts. Normal permanent installation in standard Firefox requires Mozilla signing. This repository does not contain signing credentials or a signed XPI.

The stable extension ID is `subtitle-overlay@yahyanabil.com`. Keep it for subsequent signed updates. Firefox uses an event background because it does not support extension service workers. Its manifest declares search terms, website content and authentication information transmitted by user-initiated provider actions; no developer analytics are added. The minimum version includes Firefox's built-in data consent interface.

Firefox does not support changing local-storage access levels. API keys therefore use background-only IndexedDB at the extension origin. Any legacy key is migrated and removed from `storage.local`. Login tokens remain in private `storage.session`. Saved subtitles and preferences remain local. On Firefox versions without local `getBytesInUse`, the library uses a UTF-8 size estimate.

Firefox lacks `downloads.onDeterminingFilename`. Extension-written subtitle copies still use `Subtitle Overlay` under the configured Downloads folder. Provider-initiated downloads may retain their original filename; completed matching downloads can still load automatically.

## Safari desktop source

The Safari target removes the unsupported `downloads` permission and uses an event background. Website search opens normally. Download a website file, then use Load file; automatic download tracking and automatic copies into the Downloads subfolder are unavailable. API import and saving to the internal subtitle library do not depend on download APIs. Reports use an ordinary file-download link.

Convert/package this source using Apple's Safari Web Extension tooling. Safari installation needs the Apple packaging/signing workflow. No installable Apple app or signed Safari extension is included. Validate permissions, popup windows, fullscreen, video clocks, imported tracks and sentence sync in Safari before distribution. Desktop Safari 17.1 or later is the intended test baseline.

## Compatibility references

- [Mozilla background formats](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)
- [Mozilla storage access levels](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/setAccessLevel)
- [Mozilla API compatibility data](https://github.com/mdn/browser-compat-data/tree/main/webextensions/api)
- [Firefox built-in data consent implementation](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/)
- [Edge extension compatibility](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/port-chrome-extension)
- [Apple Safari extension tooling](https://developer.apple.com/safari/extensions/)
