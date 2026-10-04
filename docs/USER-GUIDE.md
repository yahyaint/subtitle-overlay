# Use Subtitle Overlay

## Find and load

Open a film. Select the extension, then **Open controls**. The title suggestion uses player metadata first. You can edit the title, language, and year.

Select **Website** to search in a small browser window. Allow provider access when asked. Select a subtitle and complete its download steps. Tracking stays active until a valid file loads or you close that window.

Select **API** to search in the extension. Add an OpenSubtitles API key in **Settings → OpenSubtitles account**. Log in if the provider needs an account. Search only starts when you ask for it.

Use **Load file** for a local subtitle. For frame-based SUB files, enter the FPS shown by the source if the file does not declare it. Do not guess the FPS.

## Sync

A positive delay shows subtitles later. A negative delay shows them earlier.

In **Sentence sync**, the current sentence follows playback. Pause to select another sentence. You can type part of the sentence in **Words you hear**.

For **One sentence**, pause at its start and select **Sync to now**. For **Two sentences**, set the first point, move to a later sentence, then sync the second point. **Three sentences** adds a third point. Two or three points correct steady timing drift across the film.

If the clock shows `--:--:--`, show the player's own controls. Wait for a readable time before you set a sync point.

## Text style

Open **Text style** to set the font, size, text color, background color, background opacity, and height. Open **Shadow** inside this section to set shadow color, opacity, blur, and offset.

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
