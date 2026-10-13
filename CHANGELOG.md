# Changelog

## 0.8 — 0.8.15 (consolidated)

- Adopt PolyForm Perimeter 1.0.1 for noncompeting reuse. Keep earlier grants and third-party licenses valid.
- Use marine blue, soft-white accents, and bundled Inter. Add wider popup top navigation, fixed file actions, and side tools in the controller.
- Improve film and episode recognition. Keep popup and controller search fields in sync without stale saved searches replacing the detected title.
- Put Detected Subtitles first. Match heading sizes; open detected files when available and keep Find open when none are available.
- Detect native, custom-link, open-shadow, supported player API, and lazy React caption sources. Group tracks by language and import files on demand.
- Keep detected files after the player menu closes. Reset them when the page or video source changes.
- Separate Saved films and shows, with season/episode names, Specials, language variants, and smaller count badges.
- Save imported appearance and timing. Keep one-, two-, and three-sentence sync and seek recovery.
- Make header X and side Close remove the overlay. Repair stale Close handlers after updates. Prefer page fullscreen with browser navigation hidden.
- Remove dub-audio features and retired preferences.
- Remove dedicated upload packages and instructions. Consolidate earlier 0.8 packages in one history archive; keep 0.7 as old releases.

## 0.7.17 - October 11, 2026

- Move bottom subtitles above visible player controls and return them to the selected distance when controls hide.
- Add Avoid player controls under Text style → Position. Keep saved positions, imported appearance, timing, and sentence-sync points.
- Read open shadow-root controls and parent visibility. Use an interaction estimate for browser-drawn controls. Respect reduced motion.

## 0.7.16 - October 11, 2026

- Remove Use player and Restore player from the popup and overlay. Use Import for player subtitles.
- Remove the unused native-display mode. Restore caption choices automatically during file changes and cleanup. Keep Restore player style in Text style, Save, and synchronization.

## 0.7.15 - October 11, 2026

- Filter the loaded player track list immediately in the popup. Avoid waiting for a tab reply when changing the language.

## 0.7.14 - October 11, 2026

- Group detected player tracks by named language and show track counts. Filter groups in the popup and overlay.
- Replace typed search languages with named dropdown lists.
- Recognize show name, season, episode number, and readable episode name from player and page metadata.
- Search episodes with season and episode filters. Keep Saved entries separate for each episode.
- Keep loaded subtitles and sync settings when only episode names or optional metadata change.

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
- Update the release packages.
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
