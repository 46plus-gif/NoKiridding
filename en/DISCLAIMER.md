# NoKiridding disclaimer and limitations

Date: October 17, 2026  
Version: 0.8.1

## Purpose

NoKiridding helps users notice Cyrillic characters and other characters resembling ordinary Latin letters in hostnames. It checks character properties; it does not verify who operates a site or whether the site is safe.

**It does not guarantee protection after opening a malicious URL or block every phishing site. No warning does not mean a site is safe.**

## Detection limits

- Additional comparisons examine the main domain and its suffix against registered references: five visual substitutions and certain hyphen-separated name additions. Subdomain-only names do not trigger these additional warnings. Unregistered official domains or legitimate commentary sites can trigger warnings; the list is incomplete and may become outdated.
- Only the hostname is checked. Characters in paths, query strings and other URL components are outside the character check.
- It does not inspect page content, verify login pages, detect attacks inside a page or check downloaded files.
- Legitimate hostnames containing target characters can trigger warnings. All Cyrillic characters are targeted.
- Unlisted characters and transformations performed by Chrome can cause lookalike characters to go undetected.
- Search-entry checks apply only to the supported Google search pages when the whole query is shaped like a URL or hostname. Other search services and other query formats are outside scope. The extension does not prevent the query from being sent to Google.
- Browser changes, other extensions, the user's environment or processing failures can affect operation. A failure may also leave a legitimate, otherwise untargeted hostname blocked.

## Continuing and allowed sites

Selecting **Continue** allows navigation at the user's discretion. It does not verify safety. While permission is active, that hostname bypasses NoKiridding's character blocking and warnings.

A saved **Always allow this hostname** choice remains until removed from allowed sites. The extension does not continuously verify the safety of previously allowed sites.

## Warranty and liability

NoKiridding is provided as is. Accuracy, completeness, continuous operation and fitness for a particular purpose are not guaranteed.

Do not rely on its verdict alone when deciding whether a destination is safe or whether to enter information. It does not guarantee the absence of harm or consequences from missed detections or false warnings.

This document does not exclude or limit liability where applicable law does not permit it. The existence and scope of developer or distributor liability are governed by applicable law. See also the [MIT License](LICENSE).
