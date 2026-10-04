# Test steps

## Account-free path

1. Load the extension in Chrome.
2. Open a normal HTML video page with a readable clock.
3. Start its video. Select the extension, then **Open controls**.
4. Select **Load file**. Choose `sample.srt` from the extension files.
5. Seek to the first three seconds. Check the caption text.
6. Change delay, font, size, background opacity, and shadow.
7. Open **Sentence sync**. Pause at a sentence start. Check its line and select **Sync to now**.
8. Repeat with two and three sentences on a longer subtitle file.
9. Select **Save**. Open **Saved** and reload the subtitle. Check the saved settings.
10. Seek forward and backward. Check the caption and current sentence.

No API key or provider account is needed for local files. The local sample is short; use a longer local track to test widely spaced sync points.

## Website path

1. Open **Find**. Enter a film title and language. Select **Website**.
2. Open OpenSubtitles. Allow the requested provider access.
3. Select a subtitle. Complete the site's download steps and any browser Save prompt.
4. Check that the file saves under `Subtitle Overlay` in the browser's download folder and loads into the attached film tab.
5. Close the search window. Check that its download tracking ends.

Website delivery can depend on the provider. API mode requires the reviewer's own key and any account access needed by that provider. No shared production credentials are included.

## Audio-source path

Open **Find dub audio**. Add a website search link or a JSON audio catalog. Search sends the entered fields to that source after permission is granted. `audio-catalog-example.json` shows the data format; its example URLs are placeholders.

## Clock limits

When a player uses a segment clock, a public playback timeline can supply the film time. Show the player controls if asked. Players that expose neither cannot be synced reliably. The extension does not access closed shadow roots or inaccessible frame internals.

Local fixture tests passed before packaging. Live signed-in Disney+ and authenticated OpenSubtitles delivery remain unconfirmed for this preview.
