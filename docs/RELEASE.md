# Prepare a release

Prepared project: `yahyaint/subtitle-overlay`. Current version: `0.8.1` preview.

## Files prepared

- STE-style README, user guide, privacy notice, and support guide.
- Portable tests and a GitHub Actions check job.
- Store listing, permission explanations, and reviewer steps.
- Store icon, four screenshots, and a small promotional tile.
- Store upload ZIP, GitHub release ZIP, source ZIP, and SHA-256 file.

## Before public release

1. Include the project's MIT license in each release archive.
2. Confirm publisher identity and a private security contact.
3. Check version 0.8.1 in the existing signed-in player. Test pause, forward seek, backward seek, hidden controls, and all three sentence-sync modes.
4. Test a live OpenSubtitles download through its follow-up page. Confirm Save, ZIP import, load, and reload.
5. Run `npm ci`, `npm run check`, `npm test`, and `npm run build` from a fresh checkout.
6. Push the release commit to the public GitHub repository.
7. Enable Issues. Enable private vulnerability reporting or add a private contact.
8. Host `site/` for the public privacy URL. Confirm that the URL works before store submission.
9. Review the store disclosure answers against the current code. Complete account and dashboard fields.

The source repository is public at `https://github.com/yahyaint/subtitle-overlay`. Website hosting and Chrome Web Store submission remain separate steps.

## GitHub setup

The public repository is `yahyaint/subtitle-overlay`. From the prepared local repository, push a new release commit with:

```sh
git push -u origin main
```

Check `git remote -v` first. Its origin should point to `https://github.com/yahyaint/subtitle-overlay.git`.

Use [the release draft](GITHUB-RELEASE.md) for a preview release. Upload the generated release ZIP and SHA-256 file.

## Chrome Web Store setup

Upload `dist/subtitle-overlay-0.8.1-chrome-web-store.zip`. Its manifest is at the ZIP root. This follows Google's [package preparation instructions](https://developer.chrome.com/docs/webstore/prepare).

Copy the [listing text](store/LISTING.md). Use the images in `docs/store/assets`. The prepared screenshots are 1280 × 800. The tile is 440 × 280. See Google's [listing image fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

Planned privacy URL: `https://yahyaint.github.io/subtitle-overlay/privacy.html`. This is a target URL, not an active published page. GitHub Pages must use the `site/` files. Publishing this page is a separate action.

Use [reviewer steps](store/REVIEWER-STEPS.md) and [data and permissions](store/DATA-AND-PERMISSIONS.md). Do not provide real credentials in the review notes.

Service-governing terms and acceptable-use material were not reviewed. Technical preparation does not establish store acceptance.

Service terms review was excluded during technical preparation.
