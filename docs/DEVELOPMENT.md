# Development

Development is permitted for purposes covered by PolyForm Perimeter. Providing a competing product to others is prohibited. See [license scope](LICENSING.md).

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
| `extension/` | Chromium source and manual unpacked installation |
| `scripts/` | Checks, tests, build, and demo asset tools |
| `tests/` | Local integration tests and fixtures |
| `docs/images/` | Local demo images |
| `site/` | Static privacy page for later hosting |
| `../releases/builds/<version>/` | Generated packages and checksums, outside the repository |
| `.test-artifacts/` | Local test profiles, reports, and screenshots |

## Tests

Tests use separate headless Chromium profiles. Only test copies receive loopback host access. The production manifest has no permanent video-site grant.

The core suite creates a short video locally. Other suites simulate clocks, metadata, seeks, and provider responses. The shadow-clock fixture contains only public timing attributes needed to reproduce a player clock mismatch.

Tests cover parsing, archive checks, subtitle settings, storage boundaries, download routing, paused sentence selection, rapid seeks, and one-, two-, and three-sentence sync. They do not prove signed-in service compatibility.

Test output stays outside Git and release ZIPs. Test failure stops the runner. It stops a stalled suite after three minutes.

## Build

`npm run build` runs static checks first. It verifies each ZIP entry against the source bytes. Packages go to `../releases/builds/<version>/`, outside the repository. Keep these packages local; do not attach them to GitHub Releases. No generated browser folders are written into the repository.

To choose another external folder, use `npm run build -- --out "../my-release-files"`. Paths resolve from your working directory. Output inside the repository is rejected. Firefox and Safari manifests are generated directly into their packages. The Chromium `extension/` folder is the only unpacked manual install in the repository.

- The Chromium package puts `manifest.json`, bundled extension files, LICENSE and NOTICE directly at the ZIP root. It has no outer `extension/` folder or sibling installation documents.
- The source ZIP contains the project, tests, documentation, and build tools.

Set the same version in `package.json`, `extension/manifest.json`, and the background User-Agent before a new release. The build rejects a mismatch.

## Preview images

`npm run preview:assets` renders the real extension UI on a local demo video. It writes four 1280 × 800 screenshots, one 440 × 280 tile, and the 128 × 128 icon. It uses no film footage or remote media. It also regenerates the privacy HTML from the notice.


## Public player subtitle sources

The source bridge reads only players tied to the selected video. It never changes the player's subtitle selection. Caption files load through the page's normal CORS access only after Import. Track and DOM events queue discovery after 100 ms; periodic checks cover API-only changes. The bridge and observers stop when the overlay is removed.

API references: [Video.js text tracks](https://docs.videojs.com/docs/guides/text-tracks.html), [JW Player playlist metadata](https://docs.jwplayer.com/players/reference/playlist-events), and [Artplayer subtitle properties](https://github.artplayer.org/document/en/advanced/built-in.html). Cross-origin iframe players need a separate permission and routing design.
