(() => {
  'use strict';
  const key = 'nokiriddingProtectedDomains';
  const firstId = 1000000;
  const maximumDomains = 400;
  const defaults = globalThis.NoKiriddingDefaults || [];
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function validate(entries) {
    if (!Array.isArray(entries) || entries.length > 200) throw new Error('protectionLimit');
    const seen = new Set();
    const result = entries.map(entry => {
      if (!entry || typeof entry.name !== 'string' || !entry.name.trim() || entry.name.length > 80 ||
          /[\p{Cc}\p{Cf}]/u.test(entry.name) || !Array.isArray(entry.domains) || !entry.domains.length) throw new Error('protectionInvalid');
      const domains = entry.domains.map(value => {
        if (typeof value !== 'string') throw new Error('protectionInvalid');
        const host = value.trim().toLowerCase().replace(/\.$/, '');
        if (host.length > 253 || !host.includes('.') || !/^[a-z0-9.-]+$/.test(host) ||
            !/[a-z]$/.test(host) || host.split('.').some(label => label.length > 63 ||
              !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label) || label.startsWith('xn--'))) throw new Error('protectionInvalid');
        if (seen.has(host)) throw new Error('protectionDuplicate');
        seen.add(host); return host;
      });
      return { name: entry.name.trim(), domains };
    });
    if (seen.size > maximumDomains) throw new Error('protectionLimit');
    return result;
  }
  // Chrome lowercases hostnames: an entered capital I is therefore compared as i.
  // Capture each visual unit to keep the exact differing span for both display rows.
  function units(host) {
    return host.match(/rn|vv|cl|./g).map(text => {
      if (text === 'm' || text === 'rn') return { text, pattern: '(?:m|rn)' };
      if (text === 'w' || text === 'vv') return { text, pattern: '(?:w|vv)' };
      if (text === 'd' || text === 'cl') return { text, pattern: '(?:d|cl)' };
      if ('o0'.includes(text)) return { text, pattern: '[o0]' };
      if ('1li'.includes(text)) return { text, pattern: '[1li]' };
      return { text, pattern: escape(text) };
    });
  }
  const exactOrChild = (host, reference) => host === reference || host.endsWith('.' + reference);
  function inspect(hostname, entries = defaults) {
    const host = hostname.toLowerCase().replace(/\.$/, '');
    if (!/^[a-z0-9.-]+$/.test(host) || host.split('.').some(label => label.startsWith('xn--'))) return null;
    const domains = entries.flatMap(entry => entry.domains);
    if (domains.some(domain => exactOrChild(host, domain))) return null;
    for (const entry of entries) for (const reference of entry.domains) {
      const tokens = units(reference);
      const match = host.match(new RegExp('^((?:[a-z0-9-]+\\.)*)' + tokens.map(unit => '(' + unit.pattern + ')').join('') + '$'));
      if (!match) continue;
      let offset = match[1].length;
      const parts = [{ input: match[1], expected: match[1], changed: false, start: 0, end: offset }];
      tokens.forEach((unit, index) => {
        const input = match[index + 2];
        parts.push({ input, expected: unit.text, changed: input !== unit.text, start: offset, end: offset + input.length });
        offset += input.length;
      });
      if (parts.some(part => part.changed)) return { name: entry.name, domain: reference, hostname: host, parts };
    }
    return null;
  }
  function rules(entries) {
    const domains = entries.flatMap(entry => entry.domains);
    return domains.map((domain, index) => ({
      id: firstId + index, priority: 1, action: { type: 'block' },
      condition: {
        regexFilter: '^https?://([^/?#@]*@)?([a-z0-9-]+\\.)*' + units(domain).map(unit => unit.pattern).join('') + '\\.?(:[0-9]+)?([/?#]|$)',
        isUrlFilterCaseSensitive: false, resourceTypes: ['main_frame'], excludedRequestDomains: domains
      }
    }));
  }
  class Store {
    constructor(api) { this.api = api; this.entries = defaults; }
    async load() {
      const stored = (await this.api.storage.local.get(key))[key];
      if (stored !== undefined) {
        this.entries = validate(stored);
        await this.install(this.entries);
      }
      return this.entries;
    }
    async install(entries) {
      const api = this.api.declarativeNetRequest;
      const addRules = rules(entries);
      for (const rule of addRules) {
        const supported = await api.isRegexSupported({ regex: rule.condition.regexFilter, isCaseSensitive: false });
        if (!supported.isSupported) throw new Error('protectionRuleFailed');
      }
      const removeRuleIds = (await api.getDynamicRules()).filter(rule => rule.id >= firstId).map(rule => rule.id);
      await api.updateDynamicRules({ removeRuleIds, addRules });
      await api.updateEnabledRulesets({ disableRulesetIds: ['protect_domains'] });
    }
    async save(input) {
      const entries = validate(input);
      const api = this.api.declarativeNetRequest;
      const oldRules = (await api.getDynamicRules()).filter(rule => rule.id >= firstId);
      const enabled = await api.getEnabledRulesets();
      try {
        await this.install(entries);
        await this.api.storage.local.set({ [key]: entries });
        this.entries = entries;
      } catch (error) {
        const current = (await api.getDynamicRules()).filter(rule => rule.id >= firstId);
        await api.updateDynamicRules({ removeRuleIds: current.map(rule => rule.id), addRules: oldRules });
        await api.updateEnabledRulesets({
          enableRulesetIds: enabled.includes('protect_domains') ? ['protect_domains'] : [],
          disableRulesetIds: enabled.includes('protect_domains') ? [] : ['protect_domains']
        });
        throw error;
      }
      return entries;
    }
  }
  globalThis.NoKiriddingProtection = Object.freeze({ defaults, validate, inspect, rules, Store, firstId, maximumDomains });
})();
