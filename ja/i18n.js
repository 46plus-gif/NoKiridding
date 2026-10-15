(() => {
  'use strict';
  const t = (key, substitutions = []) => chrome.i18n.getMessage(key, substitutions);
  const labels = {"英数字以外の文字": "labelOther", "見えない文字": "labelInvisible", "キリル文字": "labelCyrillic", "ギリシャ文字": "labelGreek", "ひらがな": "labelHiragana", "カタカナ": "labelKatakana", "漢字": "labelHan", "英数字以外のラテン文字": "labelLatin", "結合文字": "labelMark", "空白文字": "labelSpace"};
  function character(info) {
    return { ...info, label: t(labels[info.label] || 'labelOther'),
      display: info.display === '不可視' ? t('displayInvisible') :
        info.display === '空白' ? t('displaySpace') : info.display };
  }
  function reason(info) {
    const localized = character(info);
    return t('characterReason', [localized.display, localized.label]) +
      (info.resembles ? t('characterResembles', [info.resembles]) : '');
  }
  function localizePage() {
    document.documentElement.lang = t('language');
    for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
    for (const node of document.querySelectorAll('[data-i18n-aria]')) node.setAttribute('aria-label', t(node.dataset.i18nAria));
  }
  globalThis.NoKiriddingI18n = Object.freeze({ t, character, reason, localizePage });
})();
