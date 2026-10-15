(() => {
  'use strict';
  const i18n = globalThis.NoKiriddingI18n;
  const { t } = i18n;
  const core = globalThis.URLCheckerCore;
  const analysis = core.inspectSearch(location.href);
  if (!analysis) return;

  // Hide search results immediately while the extension-owned explanation opens.
  // This does not prevent the search request from having reached Google.
  const cover = document.createElement('div');
  cover.setAttribute('data-urlchecker-warning', '');
  cover.setAttribute('role', 'alert');
  cover.style.cssText = 'position:fixed!important;inset:0!important;z-index:2147483647!important;visibility:visible!important;background-color:var(--urlchecker-warning-background,#f7f8fa)!important;background-image:radial-gradient(circle,rgba(32,33,36,.035) .65px,transparent .85px)!important;background-size:18px 18px!important;color:#202124!important;';
  const root = cover.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = ':host{font-family:system-ui,sans-serif;--urlchecker-warning-background:#f7f8fa}@media(prefers-color-scheme:dark){:host{--urlchecker-warning-background:#e5e7eb}}main{max-width:720px;margin:12vh auto;padding:32px}h1{font-size:26px}p{font-size:18px;line-height:1.8}div{font-size:32px;overflow-wrap:anywhere;direction:ltr;unicode-bidi:isolate}mark{background:#fff0ed;color:#9f201b;border-bottom:2px solid #b3261e;padding:0 2px}';
  const main = document.createElement('main');
  const heading = document.createElement('h1');
  heading.textContent = t('searchHeading');
  const domain = document.createElement('div');
  for (const character of Array.from(analysis.displayHostname).slice(0, 512)) {
    const rawInfo = core.characterInfo(character);
      const info = rawInfo ? i18n.character(rawInfo) : null;
    const span = document.createElement(info ? 'mark' : 'span');
    span.textContent = info ? info.display : character;
    if (info) span.title = t('characterTooltip', [info.label, info.codePoint]);
    domain.append(span);
  }
  const explanation = document.createElement('p');
  const first = analysis.characters[0];
  explanation.textContent = i18n.reason(first);
  main.append(heading, domain, explanation);
  root.append(style, main);
  const hide = document.createElement('style');
  hide.textContent = 'html{visibility:hidden!important}';
  document.documentElement.append(hide, cover);
  chrome.runtime.sendMessage({ type: 'urlchecker-search-warning' }).then(response => {
    if (response?.allowed) { cover.remove(); hide.remove(); }
  }).catch(() => {
    const note = document.createElement('p');
    note.textContent = t('checkCharacters');
    main.append(note);
  });
})();
