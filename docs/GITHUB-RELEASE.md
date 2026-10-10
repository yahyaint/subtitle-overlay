# Subtitle Overlay 0.7.12 preview

Load subtitle files from player tracks that have no readable lines. This fixes the empty SRT tracks found on Cinejoy. Open **Find → Player subtitles** in the popup or video controls.

- **Use player** keeps the original player display.
- **Import** loads the selected subtitle file if the track is empty, or copies loaded text and timing into the overlay. Delay, timing scale, one-, two-, and three-sentence sync, text style, background, shadow, and Save are available.
- **Restore player** restores caption choices changed by the extension. Later choices made through the site are preserved.

## Install

Download `subtitle-overlay-0.7.12-release.zip`. Extract it. In `chrome://extensions`, turn on **Developer mode**, select **Load unpacked**, and select its `extension` folder.

For an existing unpacked install, replace files in the same folder, select **Reload**, then refresh the film tab. Keep the same folder to retain the library.

## Checks and limits

Player subtitle detection uses public browser text tracks. Some sites expose none. Selected file requests use normal browser access and send no credentials. Blocked files report an error. Streaming tracks may expose only loaded lines. Importing again creates a new copy and resets its timing. Imported copies use plain text; original styling is kept with **Use player**. The extension does not intercept streaming requests or retrieve protected caption data.

The publisher confirmed Disney+ playback, seeking, and sentence sync in Vivaldi on Windows with 0.7.10. The new player-subtitle import still needs a live Disney+ check. Authenticated OpenSubtitles delivery also needs confirmation. Audio discovery does not replace or sync film audio. ASS and SSA use text and timing only.

See the [validation notes](https://github.com/yahyaint/subtitle-overlay/blob/main/docs/VALIDATION.md). Archive hashes are in `SHA256SUMS.txt`. The [MIT license](https://github.com/yahyaint/subtitle-overlay/blob/main/LICENSE) is included in each release archive.
