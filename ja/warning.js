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
  function render(displayHostname, source, similarity) {
    const analysis = !/[/?#@]/u.test(displayHostname) ? core.inspectURL('https://' + displayHostname + '/') : null;
    const parsed = !analysis && similarity ? core.parseURL('https://' + displayHostname + '/') : analysis;
    const comparison = document.getElementById('comparison');
    comparison.hidden = true;
    const fullHostname = document.getElementById('full-hostname');
    fullHostname.hidden = true;
    fullHostname.textContent = '';
    domain.replaceChildren();
    reasons.replaceChildren();
    if (!parsed) {
      domain.textContent = t('noHostname');
      outcome.textContent = t('noHostnameNote');
      return false;
    }
    for (const character of Array.from(parsed.displayHostname).slice(0, 512)) {
      const rawInfo = core.characterInfo(character);
      const info = rawInfo ? i18n.character(rawInfo) : null;
      const span = document.createElement(info ? 'mark' : 'span');
      span.textContent = info ? info.display : character;
      if (info) span.title = t('characterTooltip', [info.label, info.codePoint]);
      domain.append(span);
    }
    if (Array.from(parsed.displayHostname).length > 512) domain.append(document.createTextNode('…'));
    const unique = new Map(parsed.characters.map(info => [info.character, info]));
    for (const info of Array.from(unique.values()).slice(0, 12)) {
      const item = document.createElement('li');
      item.textContent = i18n.reason(info);
      reasons.append(item);
    }
    if (similarity) {
      const reference = document.getElementById('reference-hostname');
      domain.replaceChildren();
      reference.textContent = similarity.domain;
      for (const part of similarity.parts) {
        if (!part.input) continue;
        const node = document.createElement(part.changed && !part.subdomain ? 'mark' : 'span');
        node.textContent = part.input;
        domain.append(node);
      }
      document.getElementById('reference-name').textContent = similarity.name;
      comparison.hidden = false;
      const explanation = document.createElement('li');
      explanation.textContent = t(similarity.kind === 'brand' ? 'brandDomainReason' : 'similarDomainReason', [similarity.name, similarity.domain]);
      reasons.append(explanation);
      const differences = similarity.kind === 'brand' ? new Set([t('brandDifference')]) :
        new Set(similarity.parts.filter(part => part.changed).map(part => t('similarDifference', [part.input, part.expected])));
      for (const difference of differences) {
        const row = document.createElement('li'); row.textContent = difference; reasons.append(row);
      }
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
    if (!render(response.displayHostname, response.source, response.similarity)) return;
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
    proceed.textContent = t('connectingButton');
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
      proceed.textContent = t('continueButton');
      remember.disabled = false;
    }
  });
  void initialize().catch(() => {
    outcome.textContent = t('warningUnavailable');
  });
})();
