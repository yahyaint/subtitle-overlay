# Subtitle Overlay 0.7.13 preview

Import readable player subtitle style and position with the subtitle text. Change the appearance in the overlay. In **Text style**, select **Restore player style** to restore the captured appearance. Timing and sentence-sync points stay the same.

- Copy font, weight, italic, size, colors, background opacity, one shadow, spacing, and video-relative position from supported page caption renderers.
- Change top or bottom position, horizontal position, alignment, width, and spacing in Text style.
- Save the original player style with your current settings. Restore remains available after loading the saved subtitle.
- Keep the existing selected-file loader, one-, two-, and three-sentence sync, and film clock.

Download `subtitle-overlay-0.7.13-release.zip`. Extract it. In `chrome://extensions`, turn on **Developer mode**, select **Load unpacked**, and select its `extension` folder.

For an existing installation, reload the extension and refresh each film tab. Store upload uses the separate `subtitle-overlay-0.7.13-chrome-web-store.zip`.

## Limits

Some players expose no readable caption style. Native browser cues expose position but not their drawn font style. The import message explains what was copied. Missing fonts use the browser fallback. Multiple shadows, animations, per-line styles, vertical writing, and image effects are not copied. ASS and SSA files still import text and timing; embedded effects are not rendered.

Use the site's caption menu when **Use player** cannot display a custom player track. Subtitle files use normal browser access with no credentials. Protected data is not retrieved. No permissions were added. Store submission remains a separate step.

See `docs/VALIDATION.md` for validation evidence.
