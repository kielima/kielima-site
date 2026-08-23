/* Apresentações — kielima.com/ppt

   Mesmo contrato das outras páginas: todo o texto vive no objeto COPY, uma
   chave por idioma, e o HTML só marca onde cada chave entra via data-i18n.

   A lista de apresentações é um array por idioma (`decks`) em vez de chaves
   soltas: o que muda entre um deck e outro é conteúdo, não estrutura, e
   assim acrescentar uma apresentação é acrescentar um item — não mexer em
   marcação nem inventar chaves numeradas. */
(function () {
  'use strict';

  /* O caminho e a data não são texto traduzível: repetem-se iguais nos três
     idiomas e ficam aqui para não haver três lugares onde errar um deles. */
  var DECKS = [
    { id: 'dissertacao', href: '/ppt/dissertacao/', year: '2026' }
  ];

  var COPY = {
    PT: {
      back: 'Início',
      kicker: 'APRESENTAÇÕES',
      title: 'Apresentações interativas.',
      lead: 'Escritas em HTML, CSS e JavaScript, sem PowerPoint no caminho. Abrem no navegador, em tela cheia, de qualquer dispositivo — e sincronizam a navegação entre telas quando a mesma sala é aberta em mais de uma.',
      decksLabel: 'DISPONÍVEIS',
      openLabel: 'Abrir',
      note: 'Uma apresentação em HTML é lida por qualquer navegador daqui a dez anos, não depende de licença e cabe no mesmo controle de versão do resto do trabalho. É o mesmo argumento que eu faço sobre materiais: o custo real aparece no fim da vida útil, não na compra.',
      decks: {
        dissertacao: {
          context: 'Qualificação de mestrado · PPGSIU · PUC-Campinas',
          title: 'Avaliação do impacto ambiental do concreto de ultra alto desempenho',
          desc: 'Revisão sistemática e meta-análise da pegada de carbono do UHPC em comparação com o concreto convencional, com avaliação de ciclo de vida e fluxo de materiais.',
          tag: 'Meta-análise · ACV · UHPC'
        }
      }
    },

    EN: {
      back: 'Home',
      kicker: 'PRESENTATIONS',
      title: 'Interactive presentations.',
      lead: 'Written in HTML, CSS and JavaScript, with no PowerPoint in the way. They open in the browser, full screen, on any device — and keep slide navigation in sync across screens when the same room is opened on more than one.',
      decksLabel: 'AVAILABLE',
      openLabel: 'Open',
      note: 'A presentation written in HTML will still be readable by any browser ten years from now, needs no licence, and lives in the same version control as the rest of the work. It is the argument I make about materials: the real cost shows up at end of life, not at purchase.',
      decks: {
        dissertacao: {
          context: "Master's qualifying exam · PPGSIU · PUC-Campinas",
          title: 'Environmental impact assessment of ultra-high performance concrete',
          desc: 'Systematic review and meta-analysis of the carbon footprint of UHPC compared with conventional concrete, with life cycle assessment and material flow analysis.',
          tag: 'Meta-analysis · LCA · UHPC'
        }
      }
    },

    ZH: {
      back: '首页',
      kicker: '演示文稿',
      title: '交互式演示文稿。',
      lead: '使用 HTML、CSS 与 JavaScript 编写，不经过 PowerPoint。可在任何设备的浏览器中全屏打开；当同一个房间在多块屏幕上打开时，翻页会实时同步。',
      decksLabel: '可查看',
      openLabel: '打开',
      note: '用 HTML 写成的演示文稿，十年后任何浏览器都能打开，不依赖授权，并且与其余工作共用同一套版本控制。这与我对材料的论点相同：真实成本出现在生命周期末端，而不是购买当下。',
      decks: {
        dissertacao: {
          context: '硕士资格考试 · PPGSIU · 坎皮纳斯天主教大学',
          title: '超高性能混凝土的环境影响评估',
          desc: '以系统综述与元分析比较超高性能混凝土（UHPC）与普通混凝土的碳足迹，并结合生命周期评估与物质流分析。',
          tag: '元分析 · 生命周期评估 · UHPC'
        }
      }
    }
  };

  var lista = document.getElementById('decks');

  function renderDecks(strings) {
    lista.textContent = '';

    DECKS.forEach(function (deck) {
      var texto = strings.decks[deck.id];
      if (!texto) return;

      var item = document.createElement('li');

      var link = document.createElement('a');
      link.className = 'deck-card';
      link.href = deck.href;

      var meta = document.createElement('span');
      meta.className = 'deck-meta';
      meta.textContent = deck.year + ' · ' + texto.context;

      var titulo = document.createElement('h2');
      titulo.className = 'deck-title';
      titulo.textContent = texto.title;

      var desc = document.createElement('p');
      desc.className = 'deck-desc';
      desc.textContent = texto.desc;

      var rodape = document.createElement('span');
      rodape.className = 'deck-footer';

      var tag = document.createElement('span');
      tag.className = 'deck-tag';
      tag.textContent = texto.tag;

      var abrir = document.createElement('span');
      abrir.className = 'deck-open';
      abrir.textContent = strings.openLabel + ' →';

      rodape.appendChild(tag);
      rodape.appendChild(abrir);

      link.appendChild(meta);
      link.appendChild(titulo);
      link.appendChild(desc);
      link.appendChild(rodape);
      item.appendChild(link);
      lista.appendChild(item);
    });
  }

  var themeCtl = null;

  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, s) {
      renderDecks(s);
      if (themeCtl) themeCtl.sync();
    }
  });

  var toggle = document.getElementById('theme-toggle');

  themeCtl = window.KLTheme.attach(toggle, function (dark) {
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
