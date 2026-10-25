# NoKiridding privacy policy — draft

Date: October 20, 2026  
Version: 0.8.3

## Information used

NoKiridding uses navigation URLs to check the characters in destination hostnames. On supported Google search pages, if the query in the page URL is shaped like a URL or hostname, it checks that hostname. It does not retrieve the text of search results.

## Allowed sites

Selecting **Always allow this hostname** and continuing stores the hostname and an internal rule identifier in this Chrome profile on this device. The saved list does not contain URL paths or query strings. It is not synced to other devices.

You can remove saved entries individually through the extension icon's **Allowed sites** page. Removal also revokes tab-only permissions for the same hostname; already open pages remain open. Uninstalling the extension deletes its stored information.

## Domains targeted by phishing impersonation

Company/service names and registered domain names that you add, edit or remove are stored as a list in this Chrome profile. The list is used only for lookalike comparisons, is not synced or transmitted externally, and is removed when the extension is uninstalled. Blocking rules are generated locally from it. Do not enter private contact details or secrets in these fields.

## Temporary information

To open the original destination after a warning, the extension temporarily stores the full URL, including any path and query string, together with warning identifiers in Chrome's session storage. Pending warning information is deleted after continuing or closing the tab, and is cleared when the extension reloads, updates or the browser exits.

Hostnames allowed without saving, and internationalized hostnames automatically determined to contain no target characters, are kept as tab-only permissions until that tab closes. They are not automatically added to the saved list.

The latest navigation URL is also held in background-process memory to avoid acting on stale navigation events. It is discarded when the tab closes. NoKiridding does not retrieve or accumulate the browser's history list.

The warning page's own URL contains the hostname and warning identifiers, which may appear in Chrome tabs or browsing history.

## External transmission and sharing

NoKiridding itself does not transmit checked URLs, allowed sites or browsing history to an external service. It has no usage analytics or advertising-sharing functionality. Character data is bundled; checks do not query external services.

Normal browser requests to destinations and Google search submissions are separate. NoKiridding does not prevent a search query from being sent to Google.

## Use of information

Information is used to check hostname characters, display warnings, continue to a user-selected destination and manage permissions. NoKiridding follows the Chrome Web Store user-data policy and its limited-use requirements.

## Supported environment

NoKiridding targets desktop Chrome. It does not run in mobile Chrome, and its allowed sites are not synced through a Google account.
