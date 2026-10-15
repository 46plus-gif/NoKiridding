(() => {
  'use strict';

  const googleHosts = new Set(['www.google.com', 'google.com', 'www.google.co.jp', 'google.co.jp']);
  const alphabet = globalThis.URLCheckerAlphabet;
  if (!alphabet) throw new Error('Alphabet blacklist is unavailable');

  // RFC 3492 decoding. Only labels already accepted by the URL parser reach here.
  function decodeLabel(label) {
    if (!label.toLowerCase().startsWith('xn--')) return label;
    const input = label.slice(4);
    const output = [];
    let n = 128, i = 0, bias = 72;
    const basicEnd = input.lastIndexOf('-');
    let index = basicEnd < 0 ? 0 : basicEnd + 1;
    if (basicEnd >= 0) {
      for (const ch of input.slice(0, basicEnd)) output.push(ch.codePointAt(0));
    }
    const adapt = (delta, points, first) => {
      delta = Math.floor(delta / (first ? 700 : 2));
      delta += Math.floor(delta / points);
      let k = 0;
      while (delta > 455) { delta = Math.floor(delta / 35); k += 36; }
      return k + Math.floor(36 * delta / (delta + 38));
    };
    while (index < input.length) {
      const old = i;
      let weight = 1;
      for (let k = 36; ; k += 36) {
        if (index >= input.length) throw new Error('Invalid Punycode');
        const code = input.toLowerCase().charCodeAt(index++);
        const digit = code >= 97 && code <= 122 ? code - 97 : code >= 48 && code <= 57 ? code - 22 : -1;
        if (digit < 0) throw new Error('Invalid Punycode digit');
        i += digit * weight;
        if (!Number.isSafeInteger(i)) throw new Error('Punycode overflow');
        const threshold = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
        if (digit < threshold) break;
        weight *= 36 - threshold;
        if (!Number.isSafeInteger(weight)) throw new Error('Punycode overflow');
      }
      const count = output.length + 1;
      bias = adapt(i - old, count, old === 0);
      n += Math.floor(i / count);
      i %= count;
      if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) throw new Error('Invalid Unicode');
      output.splice(i++, 0, n);
    }
    return String.fromCodePoint(...output);
  }

  function characterInfo(ch) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x20 && cp <= 0x7e) return null;
    const cyrillic = /\p{Script=Cyrillic}/u.test(ch);
    const resembles = alphabet.letters[ch];
    if (!cyrillic && !resembles) return null;
    let label = '英数字以外の文字';
    let display = ch;
    if (/[\p{Cf}\p{Cc}\p{Zl}\p{Zp}]/u.test(ch)) { label = '見えない文字'; display = '不可視'; }
    else if (/\p{Script=Cyrillic}/u.test(ch)) label = 'キリル文字';
    else if (/\p{Script=Greek}/u.test(ch)) label = 'ギリシャ文字';
    else if (/\p{Script=Hiragana}/u.test(ch)) label = 'ひらがな';
    else if (/\p{Script=Katakana}/u.test(ch)) label = 'カタカナ';
    else if (/\p{Script=Han}/u.test(ch)) label = '漢字';
    else if (/\p{Script=Latin}/u.test(ch)) label = '英数字以外のラテン文字';
    else if (/\p{Mark}/u.test(ch)) { label = '結合文字'; display = '\u25cc' + ch; }
    else if (/\p{Separator}/u.test(ch)) { label = '空白文字'; display = '空白'; }
    return { character: ch, display, label, resembles: resembles || null,
      codePoint: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0') };
  }

  function parseURL(input, allowBare = false) {
    if (typeof input !== 'string') return null;
    const raw = input.trim();
    const explicit = /^https?:\/\//i.test(raw);
    if (!explicit && !allowBare) return null;
    if (!explicit && (raw.includes('://') || /^[/?#]/.test(raw))) return null;
    const candidate = explicit ? raw : 'https://' + raw;
    let parsed;
    try { parsed = new URL(candidate); } catch { return null; }
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    const authority = candidate.match(/^https?:\/\/([^/?#]*)/i)?.[1];
    if (!authority) return null;
    let rawHost = authority.slice(authority.lastIndexOf('@') + 1);
    rawHost = rawHost.startsWith('[') ? rawHost.slice(0, rawHost.indexOf(']') + 1) : rawHost.replace(/:\d*$/, '');
    // A sentence's Japanese full stop is also mapped to "." by URL parsing.
    // Without an explicit scheme, require the ordinary ASCII domain separator.
    if (!explicit && !rawHost.includes('.')) return null;
    try { rawHost = decodeURIComponent(rawHost); } catch { /* URL parser has already validated the target. */ }
    let decoded;
    try { decoded = parsed.hostname.split('.').map(decodeLabel).join('.'); } catch { return null; }
    // Decode ACE labels even when a different label contains source Unicode.
    // Preserve original letters mapped by URL normalization when inspecting search input.
    let displayHostname;
    try { displayHostname = rawHost.split(/([.\u3002\uff0e\uff61])/u).map(decodeLabel).join(''); }
    catch { displayHostname = decoded; }
    let characters = Array.from(displayHostname).map(characterInfo).filter(Boolean);
    // Normalization can expose another risky character; never let source spelling hide it.
    if (!characters.length) {
      const canonicalCharacters = Array.from(decoded).map(characterInfo).filter(Boolean);
      if (canonicalCharacters.length) { displayHostname = decoded; characters = canonicalCharacters; }
    }
    return { displayHostname, canonicalHostname: parsed.hostname, targetURL: parsed.href, characters,
      international: parsed.hostname.split('.').some(label => label.startsWith('xn--')) };
  }

  function inspectURL(input, allowBare = false, protectedEntries) {
    const analysis = parseURL(input, allowBare);
    if (!analysis) return null;
    const similarity = globalThis.NoKiriddingProtection?.inspect(analysis.canonicalHostname, protectedEntries);
    if (similarity) analysis.similarity = similarity;
    return analysis.characters.length || similarity ? analysis : null;
  }

  function inspectSearch(input, protectedEntries) {
    let url;
    try { url = new URL(input); } catch { return null; }
    if (!['http:', 'https:'].includes(url.protocol) || !googleHosts.has(url.hostname) || url.pathname !== '/search') return null;
    // Only a query that is itself a URL/domain is examined. Ordinary Japanese prose is untouched.
    return inspectURL(url.searchParams.get('q'), true, protectedEntries);
  }

  function warningURL(base, analysis, source, context) {
    const url = new URL('warning.html', base);
    const fields = { host: analysis.displayHostname, source };
    if (context) fields.context = context;
    url.hash = new URLSearchParams(fields).toString();
    return url.href;
  }

  globalThis.URLCheckerCore = Object.freeze({ parseURL, inspectURL, inspectSearch, characterInfo, warningURL, decodeLabel });
})();
