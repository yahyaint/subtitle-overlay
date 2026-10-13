# Data and permission notes

These notes describe version 0.8.13 from its source. They are inputs for the publisher's dashboard answers. They do not claim store acceptance or assign dashboard data categories.

## Purpose

Display external subtitles over browser video. Help the user find, load, sync, style, and save those subtitles.

## Required permissions

| Permission | Use |
| --- | --- |
| `activeTab` | Access the selected film page after the user opens the extension. |
| `scripting` | Add packaged overlay code and a public player-clock bridge to that tab. Add the packaged download bridge to an approved provider window. |
| `storage` | Keep subtitle files, film labels, preferences, saved presets, and the API key locally. Keep tokens and active download associations in session storage. |
| `downloads` | Save subtitle copies, find the selected provider download, save user-requested player reports. |

## Optional host access

`https://*.opensubtitles.com/*` supports API calls and provider downloads. Website setup asks for the OpenSubtitles.org and OpenSubtitles.com origins.

`https://*/*` is an optional declaration for user-selected HTTPS subtitle providers and download hosts. The code requests selected origins when the user enables website downloads. It does not request all HTTPS sites at once. No permanent film-site host access is declared.

The broad optional declaration supports edited subtitle search links and provider download hosts. The extension requests only the selected origins.

## Data handling

| Data | Where used or stored |
| --- | --- |
| Film metadata, video state, public player controls | Read on the attached page to suggest titles, sync captions, and avoid visible controls. |
| Page address and selected provider/download URLs | Used locally to route a selected file to the film tab and match provider downloads. |
| Subtitle text, film labels, language, sync and text settings, captured player appearance | Kept in extension-local storage. Exported copies go to the browser's download folder. |
| Search title, language, optional year | Sent to the provider selected by the user. |
| API key | Stored locally; sent to OpenSubtitles API. |
| Username and password | Sent to OpenSubtitles when the user logs in. Not saved by extension code. |
| Login token | Kept in session storage; sent to the matching provider. |
| Selected download records | Checked through browser downloads for managed-window import. No developer-server upload. |
| Player report | Saved locally only on request. Review before sharing. |

There is no developer-operated backend, analytics, sale of data, or automatic diagnostic upload in this source. External sites still receive requests made by the user.

## Executable code

All extension JavaScript is packaged. The clock bridge runs a packaged file in the page's MAIN world. Subtitle responses are parsed as data. No `eval`, dynamic function construction, or remote JavaScript import is used.

## Final disclosure task

The publisher must map these facts to the current dashboard questions, confirm the published privacy URL, and complete the required attestations. Service-governing policy and terms review is excluded under the active Terms Privacy Guard.

Player-file import requests only the selected public track URL, after Import. It uses normal page CORS access and sends no cookies or authorization headers. Parsed text stays in page memory until saved. This adds no permission and does not intercept network traffic.

## Language groups and episode recognition

Version 0.8.13 groups public player track labels by their language codes. It reads public playback and page metadata to suggest the film or episode. Series searches send the show, season, and episode numbers to the selected provider after the user starts a search. There are no new permissions.


The Inter font is bundled with 0.8.13. Its single WOFF2 file is web accessible through a dynamic session URL so the controller can load it. No script, account data, or subtitle file is exposed by this rule. The extension does not request a remote font.

Public player caption files can also come from custom caption menus, open shadow roots, and Video.js, JW Player, and Artplayer APIs. Files load only after Import through normal page CORS access. This adds no permissions. Track discovery does not request these files.
