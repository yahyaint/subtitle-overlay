# Subtitle Overlay privacy notice

Version: 0.7.12. Updated: October 11, 2026. Publisher: yahyaint.

## Data on this device

The extension stores saved subtitle text, film labels, language choices, rejected subtitle IDs, search preferences, source URLs, and timing and text settings in extension-local browser storage. The library does not use browser sync.

An OpenSubtitles API key stays in local extension storage. Login tokens and optional audio-catalog tokens stay in browser-session storage. The extension sends a password to OpenSubtitles only when you log in. It does not save the password to extension storage. Browser password-manager behavior is separate.

Provider credentials and saved subtitle storage are restricted to trusted extension contexts. The film page does not receive the provider API key or account token.

## Data used on a video page

When you open the extension on a video page, it reads film metadata, video state, public timing controls, and public subtitle-track labels to suggest a title and detect player subtitles. It checks title changes on the attached page. It does not send a film search until you start one.

Player track detection does not change caption choices. **Use player** selects the chosen track for display. **Import** reads its loaded caption text and timing. If the track is empty and exposes a file URL, Import requests that selected file through normal browser access. It does not send cookies, authorization headers, API keys, or account tokens with this request. Parsed player-file lines stay in memory until the page is closed. The copied text stays on this device; **Save** stores it with the selected timing and text settings. The extension does not intercept streaming requests or retrieve protected caption data.

The current page address is used locally to keep a subtitle attached to the correct film tab. Public page information can appear in title suggestions.

## Data sent to services

A selected player subtitle file request contacts its file host. That host receives normal network information, such as your IP address and the browser's normal referrer information. The extension does not request player subtitle files during track discovery.

OpenSubtitles receives the title, language, year if entered, and requests needed to find or download a subtitle. API requests also send your key and session token when present. Website search opens the provider website. Its browser session can use the provider's existing cookies. Website file retrieval can include provider cookies.

Audio search sends your search fields to the source you select, such as Internet Archive, SoundCloud, Google search, or a catalog you add. A catalog token is sent to that catalog when you configure one. Direct downloads contact the file host. SoundCloud preview loads its embedded player after you select **Preview audio**.

These services receive normal network information, such as your IP address. This notice describes the extension's behavior. It does not describe what those services do with data they receive.

## Optional tips

The **Tip** link opens `https://yahyanabil.com/support` in a new browser tab. It sends no subtitle text, film title, or extension credentials to that page. Tip payments, if offered there, take place on that website. The extension does not process payments or unlock paid features.

## Downloads and reports

The extension uses browser download events and matching download records to find the subtitle you select in its managed search window. It keeps the search window, selected link, download ID, and film-tab association in session storage. It does not upload download history to a developer server.

Subtitle copies go to `Subtitle Overlay` inside the browser's download folder. Direct audio downloads use a Save dialog. Browser settings can also cause subtitle Save dialogs.

A player report is created only when you select its report button. It contains public player clocks, playback state, control labels and attributes, and layout measurements. It excludes stream URLs, subtitle text, and extension credentials. It is saved locally. It is not sent automatically. Check it before sharing it.

## Developer collection

This build has no developer-operated server, analytics SDK, advertising SDK, or automatic report upload. It does not sell data. Requests to sources described above are part of actions you choose.

## Remove data

Remove a subtitle in **Saved** to delete its library copy and saved settings. Use **Remove account access** to remove the OpenSubtitles API key and token. Remove an added audio source to remove its configuration and session token.

Uninstall the extension to remove its remaining extension storage. Files already saved in the download folder remain until you delete them. Browser history, provider sessions, and provider-held data are separate.

## Contact

Use [the project's issue page](https://github.com/yahyaint/subtitle-overlay/issues) for privacy questions. Do not include passwords or tokens in a public issue.
