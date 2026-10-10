# Use Subtitle Overlay

## Find and load

Open a film. Select the extension, then **Open controls**. The title suggestion uses player metadata first. You can edit the title, language, and year.

Select **Website** to search in a small browser window. Allow provider access when asked. Select a subtitle and complete its download steps. Tracking stays active until a valid file loads or you close that window.

Select **API** to search in the extension. Add an OpenSubtitles API key in **Settings → OpenSubtitles account**. Log in if the provider needs an account. Search only starts when you ask for it.

Use **Load file** for a local subtitle. For frame-based SUB files, enter the FPS shown by the source if the file does not declare it. Do not guess the FPS.

## Player subtitles

Open **Find → Player subtitles** in the popup or video controls. The list follows the selected video. It excludes metadata and chapter tracks.

Select **Use player** to show the chosen track in its original player display. Overlay timing and style controls are disabled in this mode. Select **Import** to load its file if the track has no readable lines, or to copy loaded lines into the overlay. Import also copies readable font, weight, italic, colors, background opacity, shadow, spacing, and position from the player. Delay, timing scale, sentence sync, text style, and Save are then available.

Select **Restore player** to restore the caption modes changed by the extension. Importing a file, loading a saved subtitle, changing film, or removing the overlay also restores those modes. Choices made later through the site's caption controls are preserved.

A track can say **not loaded** before Import. The extension requests only the selected file, through normal browser access. It supports SRT, WebVTT, ASS, and SSA text. File imports keep their original film timestamps. Native player cues are mapped to the film clock. A blocked file reports an error. Select another track or load a local file. Use the site's caption menu if **Use player** has no native lines to display.

If no track appears, select a subtitle language in the player and select **Refresh**. A player may expose no readable tracks. Streaming tracks may expose only loaded lines; importing again creates a new copy and resets its timing. If the site uses its own caption renderer and both captions appear, turn off captions in that site's controls.

## Sync

A positive delay shows subtitles later. A negative delay shows them earlier.

In **Sentence sync**, the current sentence follows playback. Pause to select another sentence. You can type part of the sentence in **Words you hear**.

For **One sentence**, pause at its start and select **Sync to now**. For **Two sentences**, set the first point, move to a later sentence, then sync the second point. **Three sentences** adds a third point. Two or three points correct steady timing drift across the film.

If the clock shows `--:--:--`, show the player's own controls. Wait for a readable time before you set a sync point.

## Text style

Open **Text style** to change font, weight, italic, size, colors, and background opacity. Open **Position** to set the top or bottom edge, distance, horizontal position, text alignment, and width. Open **Shadow** for its color, opacity, blur, and offsets. Open **Spacing** for line height, padding, and corner radius.

Select **Restore player style** to restore the appearance captured on Import. Delay, timing scale, sentence mode, and sync points stay the same. Save keeps your changes and the captured original style. Restore stays available when you load that saved subtitle.

Some players expose only native text cues. Their drawn font style is not readable. The import message tells you when only position is copied or no style is available. Unavailable fonts use the browser fallback. Multiple shadows, animations, per-line styles, vertical writing, and image effects are not copied.

ASS and SSA file styles do not apply. These text controls apply to their converted subtitle text.

## Save and remove

Website downloads are cached in **Saved**. The **Save** icon stores the current timing and appearance settings with the subtitle. Local files can also be saved.

Use **Saved** to select a film and load its subtitle. The saved settings return with it. The remove icon deletes the library copy and settings. It also hides a rejected provider subtitle from later results. It leaves downloaded files on disk.

The library is local to this extension installation. It does not sync to another device. Removing the extension can remove its library.

## Fullscreen

The overlay's fullscreen button switches browser fullscreen. F11 also toggles this mode. The player can have its own fullscreen button.

## Audio sources

Select **Find dub audio** to search audio sources. Add a website search link or a JSON catalog. An example catalog is in `extension/audio-catalog-example.json`.

Search results are candidates. Check the language, duration, and film version. Direct audio downloads use the browser's Save dialog. A source preview does not sync with the film. The extension does not replace the player's audio.
