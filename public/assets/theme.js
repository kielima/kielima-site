/* Tema claro/escuro, compartilhado pela home e pelo cartão.
   O tema salvo é aplicado por um script inline no <head> de cada página,
   antes da primeira pintura — este módulo cuida só da alternância. */
(function () {
  'use strict';

  var STORAGE_KEY = 'kl-theme';
  var root = document.documentElement;

  function isDark() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  // A cor da barra do navegador no mobile é resolvida pelas media queries
  // enquanto o visitante não escolhe um tema à mão; depois disso, é preciso
  // fixá-la, senão ela contradiz a página.
  function paintThemeColor() {
    if (root.getAttribute('data-theme') === null) return;
    var dark = isDark();
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].removeAttribute('media');
      metas[i].setAttribute('content', dark ? '#0d110e' : '#f8f8f8');
    }
  }

  /**
   * @param {Element} button   botão de alternância (pode ser null)
   * @param {Function} onChange chamado com (isDark) na inicialização, a cada
   *                            clique e a cada mudança de preferência do sistema
   */
  function attach(button, onChange) {
    function sync() {
      var dark = isDark();
      if (button) button.classList.toggle('is-dark', dark);
      paintThemeColor();
      if (onChange) onChange(dark);
    }

    if (button) {
      button.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch (e) {}
        sync();
      });
    }

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onScheme = function () {
        if (root.getAttribute('data-theme') === null) sync();
      };
      if (mq.addEventListener) mq.addEventListener('change', onScheme);
      else if (mq.addListener) mq.addListener(onScheme);
    }

    sync();
    return { sync: sync };
  }

  window.KLTheme = { isDark: isDark, attach: attach };
})();
