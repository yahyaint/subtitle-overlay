# Subtitle Overlay 0.7.17 preview

Bottom subtitles now move above visible player controls and return to their chosen distance when the controls hide.

- Add Avoid player controls under Text style → Position. Turn it off for a fixed position.
- Read controls in open shadow roots. Check parent opacity and visibility, and ignore controls outside the video.
- Keep top captions and positions that already clear the controls fixed. Respect reduced-motion preferences.
- Use a recent-interaction estimate for browser-drawn video controls. Closed shadow roots and cross-frame controls may not expose readable bounds.
- Keep the saved distance, imported appearance, timing, and all three sentence-sync modes. No permissions were added.

Download `subtitle-overlay-0.7.17-release.zip`. Extract it. In `chrome://extensions`, turn on Developer mode, select Load unpacked, and select its extension folder.

For an existing installation, reload the extension and refresh each film tab. Store upload uses `subtitle-overlay-0.7.17-chrome-web-store.zip`. Store submission remains a separate step.

See `docs/VALIDATION.md` for test evidence and the user guide for player limits.
