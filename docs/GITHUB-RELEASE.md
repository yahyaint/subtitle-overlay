# Subtitle Overlay 0.7.10 preview

Adds an optional Tip link in the popup. It opens https://yahyanabil.com/support in a new tab. All extension features remain free to use.

Find subtitles through OpenSubtitles, adjust their timing with one to three sentences, and save text settings with each subtitle. This release keeps the 0.7.9 film-clock reader for public timelines inside open shadow roots. Caption and sentence-sync logic is unchanged by the Tip update.

## Install

Download `subtitle-overlay-0.7.10-release.zip`. Extract it. In `chrome://extensions`, turn on **Developer mode**, select **Load unpacked**, and select its `extension` folder.

For an existing unpacked install, replace files in the same folder, select **Reload**, then refresh the film tab. Keep the same folder to retain the library.

## Checks and limits

The publisher confirmed Disney+ playback, seeking, and sentence sync in Vivaldi on Windows with version 0.7.10. All seven automated integration suites also pass. They use local Chromium fixtures for formats, saved settings, download routing, seeking, and all three sentence-sync modes. See the [validation notes](https://github.com/yahyaint/subtitle-overlay/blob/main/docs/VALIDATION.md).

Other player and browser combinations and authenticated OpenSubtitles delivery still need confirmation. Audio discovery does not replace or sync film audio. ASS and SSA use text and timing only.

The archive hashes are in `SHA256SUMS.txt`.
