/* Hub de links — kielima.com/tree

   Mesmo contrato das outras páginas: o texto vive no objeto COPY, uma chave
   por idioma, e o HTML só marca onde cada chave entra via data-i18n.

   Os cards são um array por idioma (`cards`), como em ppt.js: acrescentar um
   link é acrescentar um item, não inventar chaves numeradas. */
(function () {
  'use strict';

  var EMAIL = 'kie@kielima.com';

  /* O destino e o ícone não são texto traduzível — ficam aqui para não haver
     três lugares onde errar uma URL. `icon` casa com um <template> no HTML. */
  var CARDS = [
    { id: 'ppt', href: '/ppt', icon: 'deck' }
  ];

  var COPY = {
    PT: {
      name: 'Kiê Lima',
      role: 'Pesquisa e inovação em materiais sustentáveis para construção.',
      linksLabel: 'CONTATO',
      cardsLabel: 'LINKS',
      copied: EMAIL + ' copiado',
      siteLink: 'Site completo',
      cards: {
        ppt: {
          title: 'Apresentações',
          desc: 'Apresentações interativas, abertas no navegador de qualquer dispositivo.'
        }
      }
    },

    EN: {
      name: 'Kiê Lima',
      role: 'Research and innovation in sustainable construction materials.',
      linksLabel: 'CONTACT',
      cardsLabel: 'LINKS',
      copied: EMAIL + ' copied',
      siteLink: 'Full site',
      cards: {
        ppt: {
          title: 'Presentations',
          desc: 'Interactive presentations, opened in the browser on any device.'
        }
      }
    },

    ZH: {
      name: '霆宇',
      role: '可持续建筑材料的研究与创新。',
      linksLabel: '联系方式',
      cardsLabel: '链接',
      copied: EMAIL + ' 已复制',
      siteLink: '完整网站',
      cards: {
        ppt: {
          title: '演示文稿',
          desc: '交互式演示文稿，可在任何设备的浏览器中打开。'
        }
      }
    }
  };

  var lista = document.getElementById('cards');
  var moldes = document.getElementById('icons');
  var heroName = document.getElementById('hero-name');

  /* Nome em duas partes, como no wordmark impresso: o primeiro nome reto e
     o resto em itálico verde-floresta (span .accent, ver tree.css). Nomes
     sem espaço (ex.: o nome em chinês) ficam sem o realce — não há um ponto
     de corte "sobrenome" natural pra inventar. */
  function renderName(lang) {
    if (!heroName) return;
    var full = COPY[lang].name;
    var space = full.indexOf(' ');
    if (space === -1) {
      heroName.textContent = full;
      return;
    }
    heroName.textContent = '';
    heroName.appendChild(document.createTextNode(full.slice(0, space + 1)));
    var accent = document.createElement('span');
    accent.className = 'accent';
    accent.textContent = full.slice(space + 1);
    heroName.appendChild(accent);
  }

  var PALETTE = {
    light: ['#1f5a3a', '#3ea568'],
    dark: ['#eaeee8', '#a8dcbd']
  };

  var particles = window.KLParticles.init(document.getElementById('particles'), {
    particleColors: PALETTE[window.KLTheme.isDark() ? 'dark' : 'light'],
    particleCount: 200,
    particleSpread: 10,
    speed: 0.1,
    particleBaseSize: 100,
    moveParticlesOnHover: true,
    alphaParticles: false,
    disableRotation: false
  });

  function renderCards(strings) {
    lista.textContent = '';

    CARDS.forEach(function (card) {
      var texto = strings.cards[card.id];
      if (!texto) return;

      var item = document.createElement('li');

      var link = document.createElement('a');
      link.className = 'tree-link';
      link.href = card.href;

      var molde = moldes.content.querySelector('[data-icon="' + card.icon + '"]');
      if (molde) {
        var icone = molde.cloneNode(true);
        icone.classList.add('tree-link-icon');
        link.appendChild(icone);
      }

      var texto_ = document.createElement('span');
      texto_.className = 'tree-link-text';

      var titulo = document.createElement('span');
      titulo.className = 'tree-link-title';
      titulo.textContent = texto.title;

      var desc = document.createElement('span');
      desc.className = 'tree-link-desc';
      desc.textContent = texto.desc;

      texto_.appendChild(titulo);
      texto_.appendChild(desc);

      var seta = document.createElement('span');
      seta.className = 'tree-link-arrow';
      seta.setAttribute('aria-hidden', 'true');
      seta.textContent = '→';

      link.appendChild(texto_);
      link.appendChild(seta);
      item.appendChild(link);
      lista.appendChild(item);
    });
  }

  var themeCtl = null;

  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, s) {
      renderName(lang);
      renderCards(s);
      if (themeCtl) themeCtl.sync();
    }
  });

  /* Mesma conveniência do cartão e da home: clicar no ícone de e-mail copia o
     endereço, para quem não tem cliente de e-mail configurado. */
  var copied = document.getElementById('copied');
  var copyTimer;
  document.getElementById('email-link').addEventListener('click', function () {
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(EMAIL);
    } catch (e) {}
    copied.textContent = i18n ? i18n.strings().copied : EMAIL;
    copied.hidden = false;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () {
      copied.hidden = true;
    }, 2200);
  });

  var toggle = document.getElementById('theme-toggle');

  themeCtl = window.KLTheme.attach(toggle, function (dark) {
    if (particles) particles.setColors(PALETTE[dark ? 'dark' : 'light']);
    var lang = i18n ? i18n.current() : 'PT';
    var labels = {
      PT: { toDark: 'Modo escuro', toLight: 'Modo claro' },
      EN: { toDark: 'Dark mode', toLight: 'Light mode' },
      ZH: { toDark: '深色模式', toLight: '浅色模式' }
    }[lang];
    var label = dark ? labels.toLight : labels.toDark;
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  });
})();
