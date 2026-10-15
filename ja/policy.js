(() => {
  'use strict';
  const normalizeHost = host => host.toLowerCase().replace(/\.$/, '');
  const escapeRegex = value => Array.from(value, ch => '\\.^$*+?()[]{}|'.includes(ch) ? '\\' + ch : ch).join('');
  const pendingKey = tabId => 'urlcheckerPending:' + tabId;
  const temporaryKey = tabId => 'urlcheckerTemporary:' + tabId;
  const permanentKey = 'urlcheckerRememberedHosts';

  class Policy {
    constructor(api, makeToken) {
      this.api = api;
      this.makeToken = makeToken;
      this.queue = Promise.resolve();
    }
    serial(action) {
      const result = this.queue.then(action, action);
      this.queue = result.catch(() => {});
      return result;
    }
    async isAllowed(tabId, hostname) {
      const host = normalizeHost(hostname);
      const local = await this.api.storage.local.get(permanentKey);
      const session = await this.api.storage.session.get(temporaryKey(tabId));
      return Object.hasOwn(local[permanentKey] || {}, host) ||
        Object.hasOwn(session[temporaryKey(tabId)] || {}, host);
    }
    async prepare(tabId, analysis, source) {
      const key = pendingKey(tabId);
      const previous = (await this.api.storage.session.get(key))[key];
      if (previous && previous.targetURL === analysis.targetURL &&
          previous.displayHostname === analysis.displayHostname && previous.source === source) return previous;
      const record = {
        tabId, token: this.makeToken(), targetURL: analysis.targetURL,
        canonicalHostname: normalizeHost(analysis.canonicalHostname),
        displayHostname: analysis.displayHostname, source
      };
      await this.api.storage.session.set({ [key]: record });
      return record;
    }
    async getPending(tabId, token) {
      if (!Number.isInteger(tabId) || typeof token !== 'string' || !token) return null;
      const record = (await this.api.storage.session.get(pendingKey(tabId)))[pendingKey(tabId)];
      return record?.tabId === tabId && record.token === token ? record : null;
    }
    rule(id, hostname, tabId) {
      const condition = {
        regexFilter: '^https?://([^/?#@]*@)?' + escapeRegex(normalizeHost(hostname)) + '\\.?(:[0-9]+)?([/?#]|$)',
        isUrlFilterCaseSensitive: false,
        resourceTypes: ['main_frame']
      };
      if (tabId !== undefined) condition.tabIds = [tabId];
      return { id, priority: 10, action: { type: 'allow' }, condition };
    }
    async grant(tabId, hostname, remember) {
      const host = normalizeHost(hostname);
      const area = remember ? this.api.storage.local : this.api.storage.session;
      const key = remember ? permanentKey : temporaryKey(tabId);
      const entries = (await area.get(key))[key] || {};
      const rules = remember ? await this.api.declarativeNetRequest.getDynamicRules() :
        await this.api.declarativeNetRequest.getSessionRules();
      const update = options => remember ? this.api.declarativeNetRequest.updateDynamicRules(options) :
        this.api.declarativeNetRequest.updateSessionRules(options);
      if (Object.hasOwn(entries, host) && rules.some(rule => rule.id === entries[host])) return;
      const used = new Set(rules.map(rule => rule.id));
      let id = 1000;
      while (used.has(id)) id++;
      const rule = this.rule(id, host, remember ? undefined : tabId);
      const supported = await this.api.declarativeNetRequest.isRegexSupported({
        regex: rule.condition.regexFilter, isCaseSensitive: false
      });
      if (!supported.isSupported) throw new Error('この接続先を許可する規則を作成できませんでした。');
      await update({ addRules: [rule] });
      try {
        await area.set({ [key]: { ...entries, [host]: id } });
      } catch (error) {
        await update({ removeRuleIds: [id] });
        throw error;
      }
    }
    async discardPending(tabId) {
      await this.api.storage.session.remove(pendingKey(tabId));
    }
    async listRemembered() {
      const saved = (await this.api.storage.local.get(permanentKey))[permanentKey] || {};
      return Object.keys(saved).sort();
    }
    async revoke(hostname) {
      if (typeof hostname !== 'string') throw new Error('Invalid hostname');
      const host = normalizeHost(hostname);
      const saved = (await this.api.storage.local.get(permanentKey))[permanentKey] || {};
      if (!Object.hasOwn(saved, host)) return false;
      const sessions = await this.api.storage.session.get(null);
      const changed = {}, original = {};
      const sessionIds = new Set();
      for (const [key, entries] of Object.entries(sessions)) {
        if (!key.startsWith('urlcheckerTemporary:') || !Object.hasOwn(entries, host)) continue;
        original[key] = entries;
        changed[key] = { ...entries };
        sessionIds.add(entries[host]);
        delete changed[key][host];
      }
      const dynamic = (await this.api.declarativeNetRequest.getDynamicRules())
        .filter(rule => rule.id === saved[host]);
      const temporary = (await this.api.declarativeNetRequest.getSessionRules())
        .filter(rule => sessionIds.has(rule.id));
      const remaining = { ...saved };
      delete remaining[host];
      try {
        await this.api.declarativeNetRequest.updateDynamicRules({ removeRuleIds: dynamic.map(rule => rule.id) });
        if (temporary.length) await this.api.declarativeNetRequest.updateSessionRules({
          removeRuleIds: temporary.map(rule => rule.id)
        });
        await this.api.storage.local.set({ [permanentKey]: remaining });
        if (Object.keys(changed).length) await this.api.storage.session.set(changed);
      } catch (error) {
        // Restore this operation's previous state; do not claim removal on a partial failure.
        await this.api.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: dynamic.map(rule => rule.id), addRules: dynamic
        });
        if (temporary.length) await this.api.declarativeNetRequest.updateSessionRules({
          removeRuleIds: temporary.map(rule => rule.id), addRules: temporary
        });
        await this.api.storage.local.set({ [permanentKey]: saved });
        if (Object.keys(original).length) await this.api.storage.session.set(original);
        throw error;
      }
      return true;
    }
    async cleanupTab(tabId) {
      const rules = await this.api.declarativeNetRequest.getSessionRules();
      const ids = rules.filter(rule => rule.condition.tabIds?.includes(tabId)).map(rule => rule.id);
      if (ids.length) await this.api.declarativeNetRequest.updateSessionRules({ removeRuleIds: ids });
      await this.api.storage.session.remove([pendingKey(tabId), temporaryKey(tabId)]);
    }
  }
  globalThis.URLCheckerPolicy = Policy;
})();
