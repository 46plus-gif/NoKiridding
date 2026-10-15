(() => {
  'use strict';
  const i18n = globalThis.NoKiriddingI18n;
  const { t } = i18n;
  i18n.localizePage();
  const list = document.getElementById('permissions');
  const count = document.getElementById('count');
  const loading = document.getElementById('loading');
  const empty = document.getElementById('empty');
  const status = document.getElementById('status');
  const reload = document.getElementById('reload');
  let busy = false;
  function displayHost(host) {
    try { return host.split('.').map(globalThis.URLCheckerCore.decodeLabel).join('.'); }
    catch { return host; }
  }
  function announce(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
  }
  function render(hosts) {
    list.replaceChildren();
    count.textContent = t('hostCount', [String(hosts.length)]);
    empty.hidden = hosts.length !== 0;
    for (const host of hosts) {
      const row = document.createElement('li');
      row.className = 'permission-row';
      const name = document.createElement('div');
      name.className = 'permission-host';
      const visible = displayHost(host);
      const label = document.createElement('b');
      label.textContent = visible;
      name.append(label);
      if (visible !== host) {
        const canonical = document.createElement('span');
        canonical.className = 'canonical';
        canonical.textContent = host;
        name.append(canonical);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = t('remove');
      remove.setAttribute('aria-label', t('removeAria', [visible]));
      remove.addEventListener('click', () => {
        void update({ type: 'urlchecker-remove-permission', hostname: host }, visible);
      });
      row.append(name, remove);
      list.append(row);
    }
  }
  async function update(message, removedName) {
    if (busy) return;
    let focusAfterUpdate = false;
    busy = true;
    reload.disabled = true;
    for (const button of list.querySelectorAll('button')) button.disabled = true;
    announce('');
    try {
      const response = await chrome.runtime.sendMessage(message);
      if (!response?.ok || !Array.isArray(response.hosts)) throw new Error(response?.error || t('listLoadFailed'));
      render(response.hosts);
      if (removedName) {
        announce(t('permissionRemoved', [removedName]));
        focusAfterUpdate = true;
      }
    } catch (error) {
      announce((error.message || t('listUpdateFailed')) + t('retryList'), true);
    } finally {
      busy = false;
      loading.hidden = true;
      reload.disabled = false;
      for (const button of list.querySelectorAll('button')) button.disabled = false;
      if (focusAfterUpdate) (list.querySelector('button') || reload).focus();
    }
  }
  reload.addEventListener('click', () => { void update({ type: 'urlchecker-list-permissions' }); });
  void update({ type: 'urlchecker-list-permissions' });
})();
