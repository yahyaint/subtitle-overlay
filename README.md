# Subtitle Overlay

Read. Sync. Watch.

Add your own subtitles to browser video. Find a subtitle, set its timing, and change how it looks. Save the file and its settings for the next viewing.

![Subtitle controls on a local demo player](docs/store/assets/01-controls.png)

## Features

- Load SRT, WebVTT, ASS, SSA, and text SUB files. Open ZIP and gzip files.
- Search OpenSubtitles through its website or API.
- Get a film title suggestion from the player. Edit it before you search.
- Adjust the delay. Sync with one, two, or three sentences.
- Change the font, size, color, background, and shadow.
- Save subtitles and their timing and text settings on this device.
- Find external audio sources through websites or audio catalogs.

## Install

This version is a preview. A Chrome Web Store listing is not available yet.

1. Download this repository or a release ZIP. Extract the files.
2. Open `chrome://extensions`. In Edge, open `edge://extensions`.
3. Turn on **Developer mode**.
4. Select **Load unpacked**. Select the `extension` folder.
5. Open a video page. Select the extension, then **Open controls**.
6. Select **Load file**, or use **Find** to search for a subtitle.

Chrome is the main target. Edge and Vivaldi use the same extension format. The publisher confirmed Disney+ playback, seeking, and sentence sync in Vivaldi on Windows with version 0.7.10. Other player and browser combinations still need testing.

## Sync a subtitle

1. Open **Sentence sync**. Select one, two, or three sentences.
2. Pause when a sentence starts. Check the selected sentence.
3. Select **Sync to now**, or set the first point.
4. For two or three sentences, repeat at later sentences.
5. Select the **Save** icon to keep the subtitle and its settings.

One sentence sets the delay. Two or three sentences also correct steady timing drift. Different film edits can still need another subtitle file.

## Files and downloads

Local files need no account. Website search needs no extension API key. API search needs your OpenSubtitles key. Some provider actions also need an account.

Website downloads go to `Subtitle Overlay` inside your browser's download folder. They also load into the film tab and local subtitle library. Complete any website step or browser Save prompt first. Closing the search window stops tracking.

The library stays on this device. Deleting a library item does not delete files in your download folder. See the [user guide](docs/USER-GUIDE.md).

## Limits

- A video must expose a readable clock or public playback timeline. Show the player controls if the overlay asks for the time.
- Closed shadow roots and inaccessible frames can prevent player access.
- ASS and SSA text and timing are supported. Embedded styles and effects are not rendered.
- Image subtitles, RAR files, encrypted ZIP files, and archives over the 2 MB limit are not supported.
- Audio tools find sources and download direct audio files. They do not replace or sync the stream's audio.
- Authenticated OpenSubtitles delivery still needs confirmation for version 0.7.10.

## Update an unpacked install

Replace the files in the same extension folder. Select **Reload** on its browser extension card. Refresh the film tab. Keep the same folder to retain the extension's local library.

## Development

```sh
npm ci
npx playwright install chromium
npm run check
npm test
npm run build
```

The extension has no runtime npm dependencies. Tests use Playwright and local fixtures. The build creates a Chrome Web Store ZIP with `manifest.json` at its root. See [development](docs/DEVELOPMENT.md) and [release preparation](docs/RELEASE.md).

## Support development

The extension is free to use. Select **Tip** in the popup, or visit [the support page](https://yahyanabil.com/support). Tips are optional.

## Project links

[Privacy](docs/PRIVACY.md) · [Support](SUPPORT.md) · [Changes](CHANGELOG.md) · [Contribute](CONTRIBUTING.md)

Publisher: `yahyaint`. Repository: [`yahyaint/subtitle-overlay`](https://github.com/yahyaint/subtitle-overlay). License: [MIT](LICENSE).
