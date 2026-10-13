# Prepare a release

Current version: `0.8.15`. Repository: `yahyaint/subtitle-overlay`.

1. Include the official PolyForm Perimeter LICENSE and NOTICE in each archive. Keep third-party licenses.
2. Run `npm run check` and relevant tests. Run `npm run build`.
3. Verify archive contents, checksums, and install files.
4. Push the tested commit. Publish one stable release for the 0.8 series using [the release notes](GITHUB-RELEASE.md).
5. Attach the install ZIP, source ZIP, previous-builds archive, and SHA256SUMS.txt.
6. Verify the tag, latest status, and uploaded digests before removing superseded release pages.

Old 0.7 releases keep their own entries. Updated downloads offer Perimeter as an additional license; earlier grants and original Git tags remain valid. Prior 0.8 install and source packages are grouped in the consolidated release's history archive.

For an update, replace files in the same installed folder, select Reload in the browser's extension page, then refresh the video tab.
