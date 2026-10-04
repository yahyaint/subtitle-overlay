# Prepare a release

Prepared project: `yahyaint/subtitle-overlay`. Current version: `0.7.9` preview.

## Files prepared

- STE-style README, user guide, privacy notice, and support guide.
- Portable tests and a GitHub Actions check job.
- Store listing, permission explanations, and reviewer steps.
- Store icon, three screenshots, and a small promotional tile.
- Store upload ZIP, GitHub release ZIP, source ZIP, and SHA-256 file.

## Before public release

1. Select a project license. This preparation does not assign one.
2. Confirm publisher identity and a private security contact.
3. Check version 0.7.9 in the existing signed-in player. Test pause, forward seek, backward seek, hidden controls, and all three sentence-sync modes.
4. Test a live OpenSubtitles download through its follow-up page. Confirm Save, ZIP import, load, and reload.
5. Run `npm ci`, `npm run check`, `npm test`, and `npm run build` from a fresh checkout.
6. Create the GitHub repository. Choose its visibility. Push the prepared local history.
7. Enable Issues. Enable private vulnerability reporting or add a private contact.
8. Host `site/` for the public privacy URL. Confirm that the URL works before store submission.
9. Review the store disclosure answers against the current code. Complete account and dashboard fields.

No remote repository, release, website, or store listing is created by these files.

## GitHub setup

Create `yahyaint/subtitle-overlay` on GitHub with no initial files. Then run these commands inside this repository:

```sh
git remote add origin https://github.com/yahyaint/subtitle-overlay.git
git push -u origin main
```

Check `git remote -v` first. Add the remote only if it is missing. Use `git remote set-url origin ...` only if its URL needs to change.

Use [the release draft](GITHUB-RELEASE.md) for a preview release. Upload the generated release ZIP and SHA-256 file.

## Chrome Web Store setup

Upload `dist/subtitle-overlay-0.7.9-chrome-web-store.zip`. Its manifest is at the ZIP root. This follows Google's [package preparation instructions](https://developer.chrome.com/docs/webstore/prepare).

Copy the [listing text](store/LISTING.md). Use the images in `docs/store/assets`. The prepared screenshots are 1280 × 800. The tile is 440 × 280. See Google's [listing image fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

Planned privacy URL: `https://yahyaint.github.io/subtitle-overlay/privacy.html`. This is a target URL, not an active published page. GitHub Pages must use the `site/` files. Publishing this page is a separate action.

Use [reviewer steps](store/REVIEWER-STEPS.md) and [data and permissions](store/DATA-AND-PERMISSIONS.md). Do not provide real credentials in the review notes.

Service-governing terms and acceptable-use material were not reviewed. Technical preparation does not establish store acceptance.

Blocked by Terms Privacy Guard. The active skill says: "Do not open, read, retrieve, search for, inspect, quote, summarize, or otherwise access blocked material." Skill file: `C:/Users/Yahya/.codex/skills/terms-privacy-guard/SKILL.md`. This restriction applies to service-governing terms review, not to the technical files prepared here.
