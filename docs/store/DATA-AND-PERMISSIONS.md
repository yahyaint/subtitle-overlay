# Data and permission notes

These notes describe version 0.7.11 from its source. They are inputs for the publisher's dashboard answers. They do not claim store acceptance or assign dashboard data categories.

## Purpose

Display external subtitles over browser video. Help the user find, load, sync, style, and save those subtitles. A related audio-source page finds external audio candidates; it does not replace stream audio.

## Required permissions

| Permission | Use |
| --- | --- |
| `activeTab` | Access the selected film page after the user opens the extension. |
| `scripting` | Add packaged overlay code and a public player-clock bridge to that tab. Add the packaged download bridge to an approved provider window. |
| `storage` | Keep subtitle files, film labels, preferences, saved presets, and the API key locally. Keep tokens and active download associations in session storage. |
| `downloads` | Save subtitle copies, find the selected provider download, save user-requested player reports, and download selected direct audio files. |

## Optional host access

`https://*.opensubtitles.com/*` supports API calls and provider downloads. Website setup asks for the OpenSubtitles.org and OpenSubtitles.com origins.

`https://*/*` is an optional declaration for user-added HTTPS audio catalogs and provider download hosts. The code requests selected origins when the user enables website downloads or a catalog. It does not request all HTTPS sites at once. No permanent film-site host access is declared.

The broad optional declaration remains because catalogs can use a user-selected HTTPS origin. Review this scope if the audio-source feature changes.

## Data handling

| Data | Where used or stored |
| --- | --- |
| Film metadata, video state, public clock controls | Read on the attached page to suggest titles and sync captions. |
| Page address and selected provider/download URLs | Used locally to route a selected file to the film tab and match provider downloads. |
| Subtitle text, film labels, language, sync and text settings | Kept in extension-local storage. Exported copies go to the browser's download folder. |
| Search title, language, optional year | Sent to the provider or source selected by the user. |
| API key | Stored locally; sent to OpenSubtitles API. |
| Username and password | Sent to OpenSubtitles when the user logs in. Not saved by extension code. |
| Login or catalog token | Kept in session storage; sent to the matching provider or catalog. |
| Selected download records | Checked through browser downloads for managed-window import. No developer-server upload. |
| Player report | Saved locally only on request. Review before sharing. |

There is no developer-operated backend, analytics, sale of data, or automatic diagnostic upload in this source. External sites still receive requests made by the user.

## Executable code

All extension JavaScript is packaged. The clock bridge runs a packaged file in the page's MAIN world. Catalog and subtitle responses are parsed as data. No `eval`, dynamic function construction, or remote JavaScript import is used.

SoundCloud preview opens a third-party iframe only after the user selects Preview audio. This is external web content. Include it when reviewing third-party data flows and the final store submission.

## Final disclosure task

The publisher must map these facts to the current dashboard questions, confirm the published privacy URL, and complete the required attestations. Service-governing policy and terms review is excluded under the active Terms Privacy Guard.
