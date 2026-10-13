# Subtitle Overlay 0.8 — 0.8.16

One consolidated release for the 0.8 series. This build includes the latest working features and uses PolyForm Perimeter 1.0.1.

- Use the marine-blue design and bundled Inter font. The popup has top navigation and fixed file actions; the video controller has side tools.
- Find subtitles by film or show, season, and episode. Player metadata is used first. Popup and controller search fields stay in sync.
- Open Detected Subtitles to import native or supported custom player captions, readable appearance, and position. Tracks are grouped by language. Lazy custom React menus are supported.
- Detected Subtitles opens when files are found. Find subtitles stays open when no files are found. Both headings use the same size.
- Browse Saved films and shows, with season and episode selectors. Save keeps timing and text style. Counts fit the bookmark icon.
- Use one, two, or three sentences to set sync. Seek and segmented-clock regression checks pass.
- Header X hides the controls and keeps subtitles and the icon. Side Close removes the overlay. Fullscreen prefers page fullscreen with browser navigation hidden, with a window fallback.
- External dub-audio features are removed.

The supplied Movy movie was checked in isolated Chromium with film media blocked: 89 caption files detected, six English choices, and 2,673 English lines imported. Vivaldi native-menu behavior still needs confirmation.

## License

[PolyForm Perimeter 1.0.1](https://polyformproject.org/licenses/perimeter/1.0.1) permits use, changes, distribution, and commercial reuse for noncompeting purposes. Providing a competing product to others is prohibited, including free competitors. Earlier grants remain valid; the new license does not revoke prior MIT permissions. Inter keeps its separate license.

## Downloads

Use the release ZIP for installation. The source ZIP contains the project. The previous-builds ZIP contains older 0.8 install and source packages with updated license notices. Old 0.7 entries remain separate old releases.

To update, replace files in the same installed folder, select Reload, then refresh video tabs.
