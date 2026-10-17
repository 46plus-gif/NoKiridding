# Third-party notices

## Unicode character data

Copyright © 1991-2026 Unicode, Inc.

The Unicode confusables data and derived character mappings are covered by
UNICODE LICENSE V3, not by the project's MIT license. The full Unicode license
is included in `data/UNICODE-LICENSE.txt` and must be retained when redistributing
these data or derived mappings.

Covered files include `data/unicode-confusables.txt`,
`data/alphabet-blacklist.json`, and the mapping data in `alphabet-blacklist.js`.
The first two files are source material and need not be present in the runtime ZIP.

Source: https://www.unicode.org/Public/security/latest/confusables.txt

## Public Suffix List data

The rule data in `public-suffixes.js` is derived from an existing local snapshot
of the Public Suffix List and is covered by the Mozilla Public License 2.0,
not the project's MIT license. The license is available at
https://mozilla.org/MPL/2.0/. Retain the license notice when redistributing.

Source: https://publicsuffix.org/list/public_suffix_list.dat
Snapshot hash and provenance: `data/public-suffixes-metadata.json`.
This is a bundled snapshot, not a live or automatically updated list.
The extraction/normalization script is `work/build-public-suffixes.mjs`.
