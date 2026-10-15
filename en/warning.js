(() => {
  'use strict';
  const i18n = globalThis.NoKiriddingI18n;
  const { t } = i18n;
  i18n.localizePage();
  const core = globalThis.URLCheckerCore;
  const params = new URLSearchParams(location.hash.slice(1));
  const host = params.get('host') || '';
  const domain = document.getElementById('hostname');
  const reasons = document.getElementById('reasons');
  const outcome = document.getElementById('outcome');
  const inExtension = location.protocol === 'chrome-extension:';
  function render(displayHostname, source) {
    const analysis = !/[/?#@]/u.test(displayHostname) ? core.inspectURL('https://' + displayHostname + '/') : null;
    domain.replaceChildren();
    reasons.replaceChildren();
    if (!analysis) {
      domain.textContent = t('noHostname');
      outcome.textContent = t('noHostnameNote');
      return false;
    }
    for (const character of Array.from(analysis.displayHostname).slice(0, 512)) {
      const rawInfo = core.characterInfo(character);
      const info = rawInfo ? i18n.character(rawInfo) : null;
      const span = document.createElement(info ? 'mark' : 'span');
      span.textContent = info ? info.display : character;
      if (info) span.title = t('characterTooltip', [info.label, info.codePoint]);
      domain.append(span);
    }
    if (Array.from(analysis.displayHostname).length > 512) domain.append(document.createTextNode('…'));
    const unique = new Map(analysis.characters.map(info => [info.character, info]));
    for (const info of Array.from(unique.values()).slice(0, 12)) {
      const item = document.createElement('li');
      item.textContent = i18n.reason(info);
      reasons.append(item);
    }
    outcome.textContent = !inExtension ? t('previewNote') : source === 'search' ?
      t('searchStopped') : t('accessStopped');
    return true;
  }
  render(host, params.get('source'));
  if (!inExtension) return;

  const form = document.getElementById('decision');
  const close = document.getElementById('close');
  const proceed = document.getElementById('continue');
  const remember = document.getElementById('remember');
  const error = document.getElementById('action-error');
  const context = params.get('context');
  let currentTab;
  async function initialize() {
    currentTab = await chrome.tabs.getCurrent();
    if (!Number.isInteger(currentTab?.id) || !context) {
      outcome.textContent = t('reopenURL');
      return;
    }
    const response = await chrome.runtime.sendMessage({
      type: 'urlchecker-warning-context', tabId: currentTab.id, context
    });
    if (!response?.ok) {
      outcome.textContent = response?.error || t('warningUnavailable');
      return;
    }
    // The trusted background context owns both displayed host and actual destination.
    if (!render(response.displayHostname, response.source)) return;
    form.hidden = false;
  }
  close.addEventListener('click', async () => {
    try {
      const tab = await chrome.tabs.getCurrent();
      if (tab?.id !== undefined) await chrome.tabs.remove(tab.id);
    } catch { error.textContent = t('closeFailed'); }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (proceed.disabled || !Number.isInteger(currentTab?.id)) return;
    proceed.disabled = true;
    remember.disabled = true;
    error.textContent = '';
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'urlchecker-continue', tabId: currentTab.id, context, remember: remember.checked
      });
      if (!response?.ok) throw new Error(response?.error || t('continueFailed'));
    } catch (failure) {
      error.textContent = failure.message || t('continueFailed');
      proceed.disabled = false;
      remember.disabled = false;
    }
  });
  void initialize().catch(() => {
    outcome.textContent = t('warningUnavailable');
  });
})();
