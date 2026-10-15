# NoKiridding

NoKiridding is a lookalike-character checker for desktop Chrome. It checks for Cyrillic characters and other listed non-ASCII lookalikes of ordinary Latin letters, stops navigation when a target character is detected, and highlights the character with an explanation.

For example, it detects `аmazon`, where the first character is the Cyrillic `а` rather than the Latin `a` in `amazon`. It does not flag `amazen`, which uses only ordinary Latin letters. **It does not check spelling or compare hostnames against the correct spelling of a brand or domain.**

## Warning screen example

![English warning screen showing a highlighted Cyrillic character](images/warning.jpg)

Display example using the actual interface with the reserved hostname `аmazon.invalid`. The first `а` is Cyrillic. This is not a record of visiting a real site.

**This does not block all phishing sites. No warning does not mean a site is safe.** Read the [disclaimer and limitations](DISCLAIMER.md) before use.

[Download NoKiridding 0.6.0](https://github.com/46plus-gif/NoKiridding/raw/refs/heads/main/en/NoKiridding-0.6.0-en.zip)

This folder contains the English documentation and a complete copy of the extension. You do not need the Japanese folder.

Version: 0.6.0. Requires desktop Chrome 120 or later. It does not run in mobile Chrome. The interface is Japanese when Chrome's UI language is Japanese, and English otherwise.

[English source files](https://github.com/46plus-gif/NoKiridding/tree/main/en)

## Install from a ZIP

1. Download [NoKiridding-0.6.0-en.zip](https://github.com/46plus-gif/NoKiridding/raw/refs/heads/main/en/NoKiridding-0.6.0-en.zip). Use this extension ZIP, rather than GitHub's automatically generated “Source code” archive.
2. Extract the ZIP and place the extracted folder somewhere you will keep it.
3. Enter `chrome://extensions` in Chrome's address bar.
4. Turn on **Developer mode**.
5. Select **Load unpacked**.
6. Choose the extracted folder that directly contains `manifest.json`. Do not select only its `rules` or `icons` subfolder.
7. Check that **NoKiridding** appears, its version is **0.6.0**, and its switch is on.

Keep the extracted folder in place while using the extension. You may delete the downloaded ZIP. Organization-managed Chrome may prevent this installation method.

These steps follow [Chrome's official unpacked-extension instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## When a warning appears

The warning highlights target characters in red with an underline, and identifies the type of character. Cyrillic characters are flagged even if they do not resemble Latin letters. Legitimate hostnames can therefore trigger a warning.

- Select **Close this tab** to stop.
- After checking the destination, select **Continue** to allow the exact hostname in this tab.
- Select **Always allow this hostname** before continuing to save permission for future visits.

Continuing does not verify safety. An allowed hostname bypasses NoKiridding's character blocking and warnings while that permission is active. Permissions match the exact hostname and do not extend to other subdomains.

Click the extension icon to open **Allowed sites**, where saved permissions can be removed individually. Removing a hostname also revokes its tab-only permissions; already open pages remain open.

## What it checks

For HTTP and HTTPS navigation, it checks only the hostname, including subdomains and the top-level domain. In `https://shop.example.com/page?q=search`, the checked part is `shop.example.com`. Paths, query strings, fragments, credentials and port numbers are outside the character check.

The target characters are:

- All Cyrillic characters.
- Other non-ASCII characters in a bundled list derived from Unicode's confusables data that resemble the Latin letters `a–z` or `A–Z`.

Japanese or Greek text is not blocked solely because of its script, but a character on the lookalike list still triggers a warning. The Unicode data describes visual similarities, not a list of characters confirmed in actual attacks.

If Chrome treats an entry as a Google search, the extension also checks it when the entire search query is shaped like a URL or hostname. This applies only to `/search` on `google.com`, `www.google.com`, `google.co.jp` and `www.google.co.jp`. It hides flagged search results but does **not** prevent the search query from being sent to Google.

It does not inspect ASCII-only fake domains, page content, email messages or downloaded files. See the [full limitations](DISCLAIMER.md).

## Your data

Saved hostname permissions are stored in this Chrome profile on this device. They do not sync through your Google account. Full destination URLs are held temporarily to support continuing after a warning.

NoKiridding itself does not send checked URLs or allowed sites to an external service. Normal browser requests and Google searches are separate. See the [privacy policy](PRIVACY.md).

## Update manually

There is no automatic update mechanism for this ZIP distribution.

1. Pause opening new pages in Chrome.
2. Download the new extension ZIP and extract it separately.
3. Copy its contents into the original installation folder, replacing files with the same names. Keep the installation folder at the same location.
4. Open `chrome://extensions` and reload NoKiridding.
5. Check the displayed version and enabled switch, then use a new tab to check it.

Do not remove the extension to update it if you want to retain saved permissions: removal deletes its stored information. Follow any version-specific update instructions included with a future release.

## Disable or remove

At `chrome://extensions`, switch NoKiridding off to disable it, or select **Remove** to uninstall it and delete its saved information. NoKiridding does not check navigation while disabled or uninstalled.

## License

Original NoKiridding code and documentation are provided under the [MIT License](LICENSE).

Copyright (c) 2026 Akapluko.com

Use, modification, commercial use and redistribution are permitted under its terms. Retain the copyright and license notices when redistributing.

Unicode data and derived character mappings have separate terms. Retain [third-party notices](THIRD_PARTY_NOTICES.md) and `data/UNICODE-LICENSE.txt`, included in the ZIP.

## Character-data sources

- [Unicode confusables data](https://www.unicode.org/Public/security/latest/confusables.txt)
- [Unicode confusable detection](https://www.unicode.org/reports/tr39/#Confusable_Detection)

Version 0.6.0 bundles its character data. It does not query these sites or automatically update the data during use.
