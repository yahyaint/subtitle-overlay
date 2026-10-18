# Prepare a release

Current local package: `0.8.18`. The latest published GitHub release remains `v0.8.17`. Repository: `yahyaint/subtitle-overlay`.

1. Include the official PolyForm Perimeter LICENSE and NOTICE in each archive. Keep third-party licenses.
2. Run `npm run check` and relevant tests. Run `npm run build`. Packages go to `../releases/builds/<version>/`, outside the repository.
3. Verify archive contents, checksums, and install files.
4. Push the tested commit. Publish one stable release for the 0.8 series using [the release notes](GITHUB-RELEASE.md).
5. Keep all generated packages and checksums in external local storage. Do not attach ZIPs, XPIs, or checksum files to GitHub Releases. Keep only `extension/` as the public manual unpacked Chromium installation, documented in INSTALL.md.
6. Verify the tag, latest status, and local package digests. Release pages contain notes and tags, without uploaded package assets.

Old 0.7 releases keep their own entries. Archived local packages offer Perimeter as an additional license; earlier grants and original Git tags remain valid. Prior 0.8 packages remain in the local history archive.

Use [INSTALL.md](../INSTALL.md) for Chromium installation and updates.
