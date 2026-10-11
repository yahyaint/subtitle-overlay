# Subtitle Overlay

1. Open `chrome://extensions` or `edge://extensions`.
2. Turn on **Developer mode**.
3. Select **Load unpacked**. Select this folder.
4. Start a video. Open the extension and select **Open controls**.
5. Select **Load file**, or use **Find** to search OpenSubtitles.

Use **Sentence sync** to align one, two, or three sentences. Use **Text style** to change the font, color, size, background, and shadow. Under **Text style → Position**, **Avoid player controls** lifts bottom subtitles above readable controls and returns them to the chosen distance when the controls hide. Browser-drawn controls use a recent-interaction estimate. Select **Save** to keep the subtitle and its settings.

Downloads go to `Subtitle Overlay` inside your browser's download folder. Finish any website step or browser Save prompt first. Closing the search window stops tracking.

If the clock is unavailable, show the video's own controls. Some players do not expose a readable film clock.

ASS and SSA files use their text and timing. File styles and effects are not rendered. ZIP and gzip files are supported. Image subtitles and RAR files are not supported. The file and total extracted subtitle size limit is 2 MB.

To update: replace these files in the same folder, select **Reload** in the browser's extension page, then refresh the video tab.

In **Find → Player subtitles**, select **Import** to load the selected file or copy readable lines, player style, and position into the overlay. Under **Text style**, **Restore player style** restores the captured appearance and keeps timing and sentence-sync points. Save keeps the original style with your current settings. Some player styles are not readable. Only public tracks are listed; some players expose none.

Version 0.8.6 is a preview. The publisher confirmed Disney+ playback, seeking, and sentence sync in Vivaldi on Windows with 0.7.10. The new player-subtitle import still needs a live Disney+ check. Authenticated OpenSubtitles delivery still needs confirmation.

## Languages and series

In Find, select a subtitle language from the list. Open Player subtitles to see tracks grouped by language, with a count for each group. Select a language to filter the track list. Unknown language keeps tracks with no valid language code.

Player metadata supplies the current film or show first. Episode suggestions use show name, season, episode number, and a readable episode name, such as The Bear S03E04 - Violet. Website search and API search use the episode numbers. Saved subtitles stay separate for each episode. Edit the suggestion when the page gives incomplete or stale metadata.

Player subtitles is the first panel in Find. Track events and video changes trigger a quick update. Custom caption links and public Video.js, JW Player, and Artplayer caption files are supported. Open shadow roots are included. Files load only after Import. Some players expose no subtitle files; cross-origin frame players require a separate integration.
