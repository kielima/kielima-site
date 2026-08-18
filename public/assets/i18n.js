/* Troca de idioma PT / EN / ZH.
   O idioma escolhido é guardado em localStorage para que o cartão e a página
   de papel semente fiquem no mesmo idioma quando o visitante navega entre elas. */
(function () {
  'use strict';

  var STORAGE_KEY = 'kl-lang';
  var LANGS = ['PT', 'EN', 'ZH'];
  var HTML_LANG = { PT: 'pt-BR', EN: 'en', ZH: 'zh-Hans' };

  function readSaved() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return LANGS.indexOf(saved) !== -1 ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function save(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }

  /**
   * @param {Object} options
   * @param {Object} options.copy      dicionário { PT: {...}, EN: {...}, ZH: {...} }
   * @param {Element} options.select   <select> de idioma
   * @param {Function} [options.onChange] chamado após cada aplicação, com (lang, strings)
   */
  function init(options) {
    var copy = options.copy;
    var select = options.select;
    var lang = readSaved() || 'PT';

    function apply(next) {
      lang = next;
      var strings = copy[lang];
      var nodes = document.querySelectorAll('[data-i18n]');
      for (var i = 0; i < nodes.length; i++) {
        var key = nodes[i].getAttribute('data-i18n');
        if (key in strings) nodes[i].textContent = strings[key];
      }
      document.documentElement.setAttribute('lang', HTML_LANG[lang]);
      if (select) select.value = lang;
      if (options.onChange) options.onChange(lang, strings);
    }

    if (select) {
      select.addEventListener('change', function (e) {
        var next = e.target.value;
        if (LANGS.indexOf(next) === -1) return;
        save(next);
        apply(next);
      });
    }

    apply(lang);

    return {
      current: function () {
        return lang;
      },
      strings: function () {
        return copy[lang];
      }
    };
  }

  window.KLI18n = { init: init };
})();
