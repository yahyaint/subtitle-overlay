# Subtitle Overlay 0.7.15 preview

Filter player subtitle languages immediately in the popup, using the track list already loaded. This fixes the delayed filter found by GitHub CI.

Find player subtitles in language groups. Each group shows its language name and track count. Select a language to filter tracks in the popup or overlay. Select the subtitle search language from a named list.

Series suggestions now include the show, season, episode number, and readable episode name. For example: **The Bear S03E04 - Violet**. Player metadata comes first. Page episode metadata can fill missing details. Cinejoy episode routes and matching caption labels supply readable details when needed.

- Search the selected episode through the OpenSubtitles website or API.
- Keep Saved subtitles separate for each episode. A change to the episode name alone keeps the loaded subtitle and its sync settings.
- Keep player appearance import, Restore player style in Text style, and all three sentence-sync modes.
- Keep unknown track languages visible. No new permissions were added.

Download `subtitle-overlay-0.7.15-release.zip`. Extract it. In `chrome://extensions`, turn on **Developer mode**, select **Load unpacked**, and select its `extension` folder.

For an existing installation, reload the extension and refresh each film tab. Store upload uses `subtitle-overlay-0.7.15-chrome-web-store.zip`.

## Limits

Recognition uses readable metadata. Edit the suggestion if a player supplies stale or incomplete details. Group names use track language codes; tracks with no valid code appear under Unknown language. Subtitle discovery does not load each file. Select Import to load one track.

Some players expose no readable caption style. Use the site's caption menu when Use player cannot display a custom track. Native drawn fonts, animations, per-line effects, and ASS effects remain outside appearance import. Store submission remains a separate step.

See `docs/VALIDATION.md` for validation evidence.
