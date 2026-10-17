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
  const base = globalThis.NoKiriddingSuffix.base;
  function referenceBase(reference) {
    return base(reference) || { domain: reference, label: reference.split('.')[0], suffix: reference.split('.').slice(1).join('.') };
  }
  function brandParts(host, target, reference) {
    const brand = reference.label;
    const position = ('-' + target.label + '-').indexOf('-' + brand + '-');
    if (position < 0) return null;
    const begin = target.offset + position;
    const end = begin + brand.length;
    const suffix = '.' + reference.suffix;
    const suffixStart = host.endsWith(suffix) ? host.length - suffix.length : host.length;
    const parts = [];
    const add = (from, to, expected, subdomain = false) => {
      const input = host.slice(from, to);
      if (input || expected) parts.push({ input, expected, changed: !subdomain && input !== expected, subdomain, start: from, end: to });
    };
    add(0, target.offset, '', true);
    add(target.offset, begin, ''); add(begin, end, brand);
    if (suffixStart >= end && suffixStart < host.length) {
      add(end, suffixStart, ''); add(suffixStart, host.length, suffix);
    } else add(end, host.length, suffix);
    return parts;
  }
  function inspect(hostname, entries = defaults) {
    const host = hostname.toLowerCase().replace(/\.$/, '');
    if (!/^[a-z0-9.-]+$/.test(host) || host.split('.').some(label => label.startsWith('xn--'))) return null;
    const target = base(host);
    if (!target) return null;
    const domains = entries.flatMap(entry => entry.domains);
    if (domains.some(domain => exactOrChild(host, domain))) return null;
    const references = entries.flatMap(entry => entry.domains.map(domain => ({ name: entry.name, ...referenceBase(domain) })));
    for (const reference of references) {
      const tokens = units(reference.domain);
      const match = target.domain.match(new RegExp('^' + tokens.map(unit => '(' + unit.pattern + ')').join('') + '$'));
      if (!match) continue;
      let offset = target.offset;
      const parts = [{ input: target.subdomain, expected: '', changed: false, subdomain: true, start: 0, end: offset }];
      tokens.forEach((unit, index) => {
        const input = match[index + 1];
        parts.push({ input, expected: unit.text, changed: input !== unit.text, start: offset, end: offset + input.length });
        offset += input.length;
      });
      if (parts.some(part => part.changed)) return { name: reference.name, domain: reference.domain, hostname: host, mainDomain: target.domain, subdomain: target.subdomain, parts };
    }
    // Prefer a registered regional suffix that matches the destination, so .co.jp
    // is not highlighted when an equivalent official .co.jp domain is registered.
    references.sort((a, b) => Number(b.suffix === target.suffix) - Number(a.suffix === target.suffix));
    for (const reference of references) {
      const parts = brandParts(host, target, reference);
      if (parts) return { kind: 'brand', name: reference.name, domain: reference.domain, hostname: host, mainDomain: target.domain, subdomain: target.subdomain, parts };
    }
    return null;
  }
  function rules(entries) {
    const domains = entries.flatMap(entry => entry.domains);
    // Chrome caps the compiled RE2 program for each rule at 2 KB.
    // Keep visual substitutions and added-name checks in separate small rules.
    // Two rules per domain remain within Chrome 120's 1,000-regex-rule limit
    // even for the maximum user list of 400 domains.
    return domains.flatMap((domain, index) => {
      const visual = '([a-z0-9-]+\\.)*' + units(referenceBase(domain).domain).map(unit => unit.pattern).join('');
      const brand = escape(referenceBase(domain).label);
      const named = '([a-z0-9-]+\\.)*([a-z0-9-]*-)?' + brand + '(-[a-z0-9-]*)?(\\.[a-z0-9-]+)+';
      return [visual, named].map((pattern, part) => ({
        id: firstId + index * 2 + part, priority: 1, action: { type: 'block' },
        condition: {
          regexFilter: '^https?://([^/?#@]*@)?' + pattern + '\\.?(:[0-9]+)?([/?#]|$)',
          isUrlFilterCaseSensitive: false, resourceTypes: ['main_frame'], excludedRequestDomains: domains
        }
      }));
    });
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
