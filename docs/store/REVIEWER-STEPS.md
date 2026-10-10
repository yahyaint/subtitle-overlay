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

## Player-subtitle path

1. Open a test video with public subtitle or caption tracks.
2. Open **Player subtitles** in the popup, or **Find → Player subtitles** in the video controls.
3. Check that only tracks from the selected video appear. Detection must not change caption choices.
4. Select **Use player**. Check the original caption display. Overlay timing and style controls are disabled in this mode.
5. Select **Import**. Check the loaded lines, delay, sentence sync, text style, and Save.
6. Test an empty HTML track with an SRT file URL. It must show **not loaded** before Import, request only the selected file after Import, and show its imported line count.
7. Select **Restore player**. Check that the caption choices changed by the extension are restored.

Some players expose no readable tracks. Streaming tracks may expose only loaded lines. The new import feature has not yet been checked live on Disney+.

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

For 0.7.10, all seven local-fixture integration suites passed on GitHub. The publisher confirmed Disney+ playback, seeking, and sentence sync in Vivaldi on Windows with that version. Version 0.7.11 adds a player-track integration suite. Live Disney+ player-subtitle import, other player and browser combinations, and authenticated OpenSubtitles delivery still need confirmation. See the [validation notes](../VALIDATION.md).
