# Subtitle Overlay 0.8 — 0.8.17

One consolidated release for the 0.8 series. This build includes the latest working features and uses PolyForm Perimeter 1.0.1.

- Add Firefox desktop 140+ builds with private credential storage and Blob downloads. Chrome and Edge integration checks pass. Brave, Vivaldi and Opera share the Chromium build. Safari conversion source is experimental and uses manual website file import.
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

## Installation

Use the repository's `extension/` folder for Chromium desktop browsers. Follow the [manual installation guide](https://github.com/yahyaint/subtitle-overlay/blob/main/INSTALL.md).

Uploaded ZIP/XPI packages and their checksums have been removed from GitHub Releases and retained in the publisher's local archive. The repository's only unpacked manual installation is Chromium. Firefox and Safari preparation remains in the local build tools, without public package attachments.

Old release entries and original tags remain. GitHub may show automatically generated Source code downloads for those tags; these are separate from uploaded assets.
