# Subtitle Overlay 0.7.10 preview

Add external subtitles to browser video. Find files through OpenSubtitles, adjust their timing with one to three sentences, and save your text settings with each subtitle.

This preview improves film-clock reading on players with public timelines inside open shadow roots. Captions and sentence-sync controls use the same time. Hidden controls keep their last time mapping. A seek or clock reset asks for a fresh timeline when needed.

## Install

Download `subtitle-overlay-0.7.10-release.zip`. Extract it. In `chrome://extensions`, turn on **Developer mode**, select **Load unpacked**, and select its `extension` folder.

For an existing unpacked install, replace files in the same folder, select **Reload**, then refresh the film tab. Keep the same folder to retain the library.

## Checks and limits

Local Chromium tests cover formats, saved settings, download routing, seeking, and all three sentence-sync modes. Live signed-in Disney+ playback and authenticated OpenSubtitles delivery still need confirmation. Audio discovery does not replace or sync film audio. ASS and SSA use text and timing only.

The archive hashes are in `SHA256SUMS.txt`.
