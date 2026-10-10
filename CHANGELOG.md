# Changes

## 0.7.13 � October 11, 2026

- Import readable player caption appearance and position with subtitle lines.
- Add Restore player style inside Text style. Keep timing and sentence-sync points.
- Save the captured original appearance with the subtitle settings.
- Add weight, italic, position, alignment, spacing, and horizontal shadow controls.
- Report when native browser font style is not readable.

## 0.7.12 — preview

- Load the selected player subtitle file when its browser track has no readable lines.
- Parse SRT, WebVTT, ASS, and SSA text through the existing importer.
- Fetch one selected file after Import. Keep parsed lines in memory and show their count.
- Cancel or reject an import if the film, track, or source changes. Keep current subtitles and settings when loading fails.
- Check lazy SRT loading, Arabic text, sentence sync, Save, source changes, and failed-load recovery.

## 0.7.11 — preview

- Detect readable subtitle and caption tracks in the selected video.
- Keep the original player display, or import loaded text and timing into the overlay.
- Map imported cue times to the film clock. Reuse delay, timing scale, sentence sync, text style, background, shadow, and Save.
- Restore caption choices changed by the extension. Preserve later choices made through the player.
- Add browser tests for player-track detection, original display, lazy WebVTT loading, import, clock mapping, and saved settings.

## 0.7.10 — preview

- Add a Tip link in the popup. It opens `https://yahyanabil.com/support`.
- Keep all extension features available without a tip.
- Update the store and release packages.
- Add the MIT license to the repository and release packages.

## 0.7.9 — preview

- Read public playback timelines inside sibling and nested open shadow roots.
- Keep film time when player controls hide or are removed.
- Refresh the time mapping after a seek or a segment-clock reset.
- Use the same film time for captions and all three sentence-sync modes.
- Add regression coverage for these clock states and saved sync settings.

## Earlier preview changes

- Add local subtitle saving with timing and appearance presets.
- Add one-, two-, and three-sentence sync.
- Add ASS, SSA, text SUB, ZIP, gzip, and legacy Arabic decoding.
- Add website download tracking and recovery for provider redirects.
- Add editable website search and player-first title suggestions.
- Add background and shadow controls. Use marine blue across the UI.
- Add local player reports and external audio-source discovery.

Live player and provider checks remain release tasks.
