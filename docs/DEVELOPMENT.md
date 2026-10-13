# Development

These editing instructions are for the publisher or contributors with separate written permission. The public personal-use license permits viewing and running, not code edits or redistribution. See [license scope](LICENSING.md).

Use Node.js 22 or later. The extension runs plain JavaScript. npm packages are used only for development.

```sh
npm ci
npx playwright install chromium
npm run check
npm test
npm run build
```

On a new Linux system, use `npx playwright install --with-deps chromium` to install the browser and its system libraries.

## Layout

| Path | Use |
| --- | --- |
| `extension/` | Unpacked extension source |
| `scripts/` | Checks, tests, build, and store asset tools |
| `tests/` | Local integration tests and fixtures |
| `docs/store/` | Listing text, permissions, reviewer steps, and images |
| `site/` | Static privacy page for later hosting |
| `dist/` | Generated ZIP files and checksums |
| `.test-artifacts/` | Local test profiles, reports, and screenshots |

## Tests

Tests use separate headless Chromium profiles. Only test copies receive loopback host access. The production manifest has no permanent video-site grant.

The core suite creates a short video locally. Other suites simulate clocks, metadata, seeks, and provider responses. The shadow-clock fixture contains only public timing attributes needed to reproduce a player clock mismatch.

Tests cover parsing, archive checks, subtitle settings, storage boundaries, download routing, paused sentence selection, rapid seeks, and one-, two-, and three-sentence sync. They do not prove signed-in service compatibility.

Test output stays outside Git and the upload ZIP. Test failure stops the runner. It stops a stalled suite after three minutes.

## Build

`npm run build` runs static checks first. It packages only a fixed extension-file list. It verifies each ZIP entry against the source bytes. Store files have no parent folder inside the ZIP.

The second ZIP has an `extension/` folder and a short install guide. Use it for a GitHub release. Do not upload it to the Chrome Web Store.

Set the same version in `package.json`, `extension/manifest.json`, and the background User-Agent before a new release. The build rejects a mismatch.

## Store images

`npm run store:assets` renders the real extension UI on a local demo video. It writes four 1280 × 800 screenshots, one 440 × 280 tile, and the 128 × 128 icon. It uses no film footage or remote media. It also regenerates the privacy HTML from the notice.


## Public player subtitle sources

The source bridge reads only players tied to the selected video. It never changes the player's subtitle selection. Caption files load through the page's normal CORS access only after Import. Track and DOM events queue discovery after 100 ms; periodic checks cover API-only changes. The bridge and observers stop when the overlay is removed.

API references: [Video.js text tracks](https://docs.videojs.com/docs/guides/text-tracks.html), [JW Player playlist metadata](https://docs.jwplayer.com/players/reference/playlist-events), and [Artplayer subtitle properties](https://github.artplayer.org/document/en/advanced/built-in.html). Cross-origin iframe players need a separate permission and routing design.
