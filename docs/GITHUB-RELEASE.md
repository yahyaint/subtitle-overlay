# Subtitle Overlay 0.8.14

Detected Subtitles is the first Find panel. It opens when files are found; Find subtitles collapses. With no files, Find stays open. Both headings use the same size.

- Use the popup's new top navigation. The video controller keeps its side tools.
- Smaller Saved counts fit the bookmark icon.
- Both Close buttons remove the overlay. Reopening after an update repairs older Close handlers.
- Fullscreen first hides browser navigation through page fullscreen. Window fullscreen remains a fallback.
- Supported custom React players expose lazy caption files. Detection keeps files available after a menu closes and resets them on page or video-source changes.

The supplied Movy movie was checked in isolated Chromium with film media blocked: 89 subtitle files detected, six English choices, and 2,673 English lines imported. This checks subtitle discovery and import, not live playback or Vivaldi's native menu.

The current license is unchanged while the publisher compares published license options. No ads, payment gate, or new permissions were added.

Use `subtitle-overlay-0.8.14-chrome-web-store.zip` for store upload. For an unpacked update, replace files in the existing extension folder, select Reload, then refresh video tabs.
