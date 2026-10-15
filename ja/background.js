'use strict';
importScripts('alphabet-blacklist.js', 'core.js', 'policy.js');

const core = globalThis.URLCheckerCore;
const messageText = (key, fallback) => chrome.i18n?.getMessage(key) || fallback;
const policy = new globalThis.URLCheckerPolicy(chrome, () => crypto.randomUUID());
const latestNavigation = new Map();
chrome.action.onClicked.addListener(() => {
  void chrome.runtime.openOptionsPage().catch(() => {
    console.warn('URLchecker: 許可リストを開けませんでした。');
  });
});
chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' }).catch(() => {
  console.warn('URLchecker: 許可記録のアクセス制限を設定できませんでした。');
});
const httpFilter = { url: [{ schemes: ['http', 'https'] }] };
const searchFilter = { url: [
  { hostEquals: 'www.google.com', pathEquals: '/search' },
  { hostEquals: 'google.com', pathEquals: '/search' },
  { hostEquals: 'www.google.co.jp', pathEquals: '/search' },
  { hostEquals: 'google.co.jp', pathEquals: '/search' }
] };

function showWarning(tabId, analysis, source, observedURL) {
  return policy.serial(async () => {
    const isCurrent = () => !latestNavigation.has(tabId) || latestNavigation.get(tabId) === observedURL;
    if (!isCurrent() || await policy.isAllowed(tabId, analysis.canonicalHostname)) return;
    const pending = await policy.prepare(tabId, analysis, source);
    if (!isCurrent()) return;
    await chrome.tabs.update(tabId, {
      url: core.warningURL(chrome.runtime.getURL('/'), analysis, source, pending.token)
    });
  });
}

function reportWarningFailure() {
  // Keep the original static block and, for search, the visible content-script warning.
  console.warn('URLchecker: 警告画面へ移動できませんでした。');
}

function passCheckedNavigation(tabId, analysis, observedURL) {
  return policy.serial(async () => {
    const isCurrent = () => !latestNavigation.has(tabId) || latestNavigation.get(tabId) === observedURL;
    // Already allowed means the error came from elsewhere. Do not retry indefinitely.
    if (!isCurrent() || await policy.isAllowed(tabId, analysis.canonicalHostname)) return;
    await policy.grant(tabId, analysis.canonicalHostname, false);
    if (isCurrent()) await chrome.tabs.update(tabId, { url: analysis.targetURL });
  });
}

chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (details.frameId === 0) latestNavigation.set(details.tabId, details.url);
}, httpFilter);

chrome.tabs.onRemoved.addListener(tabId => {
  latestNavigation.delete(tabId);
  void policy.serial(() => policy.cleanupTab(tabId)).catch(() => {
    console.warn('URLchecker: 一時許可の片付けに失敗しました。');
  });
});

chrome.webNavigation.onErrorOccurred.addListener(details => {
  if (details.frameId !== 0 || details.error !== 'net::ERR_BLOCKED_BY_CLIENT') return;
  const analysis = core.parseURL(details.url);
  if (!analysis?.international) return;
  const operation = analysis.characters.length ?
    showWarning(details.tabId, analysis, 'direct', details.url) :
    passCheckedNavigation(details.tabId, analysis, details.url);
  void operation.catch(reportWarningFailure);
}, httpFilter);

function inspectGoogleNavigation(details) {
  if (details.frameId !== 0) return;
  latestNavigation.set(details.tabId, details.url);
  const analysis = core.inspectSearch(details.url);
  if (analysis) void showWarning(details.tabId, analysis, 'search', details.url).catch(reportWarningFailure);
}
chrome.webNavigation.onCommitted.addListener(inspectGoogleNavigation, searchFilter);
chrome.webNavigation.onHistoryStateUpdated.addListener(inspectGoogleNavigation, searchFilter);

function warningSender(message, sender) {
  if (sender.id !== chrome.runtime.id || !Number.isInteger(message.tabId)) return false;
  if (sender.tab?.id !== undefined && sender.tab.id !== message.tabId) return false;
  try {
    const page = new URL(sender.url);
    return page.href.split('#')[0] === chrome.runtime.getURL('warning.html') &&
      new URLSearchParams(page.hash.slice(1)).get('context') === message.context;
  } catch { return false; }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (['urlchecker-list-permissions', 'urlchecker-remove-permission'].includes(message?.type)) {
    if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('settings.html') ||
        (sender.frameId !== undefined && sender.frameId !== 0)) return;
    policy.serial(async () => {
      if (message.type === 'urlchecker-remove-permission') await policy.revoke(message.hostname);
      const hosts = await policy.listRemembered();
      return { ok: true, hosts };
    }).then(sendResponse).catch(() => sendResponse({
      ok: false, error: messageText('listBackgroundFailed', '許可リストを更新できませんでした。もう一度お試しください。')
    }));
    return true;
  }
  if (message?.type === 'urlchecker-search-warning') {
    if (sender.id !== chrome.runtime.id || sender.frameId !== 0 || !Number.isInteger(sender.tab?.id)) return;
    const analysis = core.inspectSearch(sender.url);
    if (!analysis) return;
    (async () => {
      if (await policy.isAllowed(sender.tab.id, analysis.canonicalHostname)) {
        sendResponse({ allowed: true });
      } else {
        await showWarning(sender.tab.id, analysis, 'search', sender.url);
        sendResponse({ allowed: false });
      }
    })().catch(() => sendResponse({ allowed: false }));
    return true;
  }
  if (!['urlchecker-warning-context', 'urlchecker-continue'].includes(message?.type) ||
      !warningSender(message, sender)) return;
  policy.serial(async () => {
    const pending = await policy.getPending(message.tabId, message.context);
    if (!pending) return { ok: false, error: messageText('pendingMissing', 'この警告の情報が見つかりません。元のURLを開き直してください。') };
    if (message.type === 'urlchecker-warning-context') {
      return { ok: true, displayHostname: pending.displayHostname, source: pending.source };
    }
    if (typeof message.remember !== 'boolean') return { ok: false, error: messageText('permissionInvalid', '許可の設定を確認できませんでした。') };
    const target = new URL(pending.targetURL);
    if (!['http:', 'https:'].includes(target.protocol) ||
        target.hostname.toLowerCase().replace(/\.$/, '') !== pending.canonicalHostname) {
      return { ok: false, error: messageText('destinationInvalid', '接続先を確認できませんでした。') };
    }
    await policy.grant(pending.tabId, pending.canonicalHostname, message.remember);
    await chrome.tabs.update(pending.tabId, { url: pending.targetURL });
    await policy.discardPending(pending.tabId);
    return { ok: true };
  }).then(sendResponse).catch(() => sendResponse({
    ok: false, error: messageText('continueRetry', '続行できませんでした。もう一度お試しください。')
  }));
  return true;
});
