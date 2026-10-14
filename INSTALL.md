# Manual installation — Chromium desktop

The repository's `extension/` folder is the unpacked Chromium extension. No build is required.

1. Download or clone the repository. Extract it if needed.
2. Open your browser's Extensions page: `chrome://extensions`, `edge://extensions`, `brave://extensions`, `vivaldi://extensions`, or `opera://extensions`.
3. Turn on Developer mode. Select Load unpacked.
4. Choose the `extension` folder that contains `manifest.json`.
5. Open a video page. Open Subtitle Overlay and select Show overlay.
6. Use Load file or Find to choose subtitles.

For an update, replace files in the same installed folder, select Reload on the extension card, then refresh video tabs. Keep the same folder to preserve the extension ID and local subtitle library. Moving an existing unpacked installation to a different folder can change that ID.

Firefox and Safari do not use this unpacked folder. Their packages are attached to [GitHub Releases](https://github.com/yahyaint/subtitle-overlay/releases/latest). See [browser instructions](docs/BROWSERS.md).
