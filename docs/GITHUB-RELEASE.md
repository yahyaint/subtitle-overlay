# Subtitle Overlay 0.7.16 preview

Remove Use player and Restore player from the popup and overlay. Import is now the main player-subtitle action. It still copies readable subtitle text, timing, appearance, and position.

- Keep language groups, counts, and immediate popup filtering.
- Restore caption choices automatically when loading another file or removing the overlay.
- Keep Restore player style in Text style for the captured appearance.
- Keep Save, series recognition, and all three sentence-sync modes.
- Remove the unused native-display mode and its disabled-control state. No permissions were added.

Download `subtitle-overlay-0.7.16-release.zip`. Extract it. In `chrome://extensions`, turn on Developer mode, select Load unpacked, and select its extension folder.

For an existing installation, reload the extension and refresh each film tab. Store upload uses `subtitle-overlay-0.7.16-chrome-web-store.zip`. Store submission remains a separate step.

See `docs/VALIDATION.md` for test evidence and the user guide for import limits.
