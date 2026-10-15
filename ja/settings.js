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

(() => {
  'use strict';
  const { t } = globalThis.NoKiriddingI18n;
  const form = document.getElementById('protection-form');
  const name = document.getElementById('company-name');
  const domains = document.getElementById('company-domains');
  const save = document.getElementById('save-protection');
  const cancel = document.getElementById('cancel-protection');
  const filter = document.getElementById('protection-filter');
  const list = document.getElementById('protected-domains');
  const status = document.getElementById('protection-status');
  let entries = [], editing = -1, busy = true;
  function announce(text, error = false) {
    status.textContent = text; status.classList.toggle('error', error);
  }
  function clearEditor() {
    editing = -1; name.value = ''; domains.value = '';
    save.textContent = t('addProtection'); cancel.hidden = true;
  }
  function render() {
    list.replaceChildren();
    document.getElementById('protection-count').textContent = t('protectionCount', [String(entries.length), String(entries.reduce((count, entry) => count + entry.domains.length, 0))]);
    const query = filter.value.trim().toLowerCase();
    entries.forEach((entry, index) => {
      if (query && ![entry.name, ...entry.domains].join(' ').toLowerCase().includes(query)) return;
      const row = document.createElement('li'); row.className = 'permission-row';
      const host = document.createElement('div'); host.className = 'permission-host';
      const title = document.createElement('b'); title.textContent = entry.name;
      const text = document.createElement('span'); text.className = 'canonical'; text.textContent = entry.domains.join(' · ');
      host.append(title, text);
      const actions = document.createElement('div'); actions.className = 'row-actions';
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'secondary';
      edit.textContent = t('editProtection'); edit.setAttribute('aria-label', t('editProtectionAria', [entry.name]));
      edit.disabled = busy;
      edit.addEventListener('click', () => {
        editing = index; name.value = entry.name; domains.value = entry.domains.join('\n');
        save.textContent = t('saveProtection'); cancel.hidden = false; name.focus();
      });
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove';
      remove.textContent = t('remove'); remove.setAttribute('aria-label', t('removeProtectionAria', [entry.name]));
      remove.disabled = busy;
      remove.addEventListener('click', () => { void persist(entries.filter((_, current) => current !== index), t('protectionRemoved', [entry.name])); });
      actions.append(edit, remove); row.append(host, actions); list.append(row);
    });
    document.getElementById('protection-empty').hidden = list.children.length !== 0;
  }
  function setBusy(value) {
    busy = value; save.disabled = value; cancel.disabled = value;
    name.disabled = value; domains.disabled = value;
    for (const button of list.querySelectorAll('button')) button.disabled = value;
  }
  async function persist(next, success) {
    if (busy) return;
    setBusy(true); announce('');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'urlchecker-save-protection', entries: next });
      if (!response?.ok || !Array.isArray(response.entries)) throw new Error(response?.error || t('protectionSaveFailed'));
      entries = response.entries; clearEditor(); announce(success);
    } catch (error) { announce(error.message || t('protectionSaveFailed'), true); }
    finally { setBusy(false); render(); }
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const entry = { name: name.value, domains: domains.value.split(/[\s,]+/).filter(Boolean) };
    const next = entries.map(value => ({ ...value, domains: [...value.domains] }));
    if (editing < 0) next.push(entry); else next[editing] = entry;
    void persist(next, t('protectionSaved'));
  });
  cancel.addEventListener('click', clearEditor);
  filter.addEventListener('input', render);
  void (async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'urlchecker-list-protection' });
      if (!response?.ok || !Array.isArray(response.entries)) throw new Error(response?.error || t('listLoadFailed'));
      entries = response.entries; setBusy(false); render();
    } catch (error) { announce(error.message || t('listLoadFailed'), true); }
    finally { document.getElementById('protection-loading').hidden = true; }
  })();
})();
