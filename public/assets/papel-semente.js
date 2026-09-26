/* Papel semente — kielima.com/cartao/papel-semente */
(function () {
  'use strict';

  var COPY = {
    PT: {
      back: 'Cartão',
      title: 'Plante este cartão.',
      lead: 'O cartão físico é impresso em papel semente: celulose reciclada, sem plástico e sem laminação, com sementes prensadas na própria folha. Ele termina a vida como planta, não como resíduo.',
      stepsLabel: 'COMO PLANTAR',
      specsLabel: 'FICHA TÉCNICA',
      closeLabel: 'Fechar',
      themeToDark: 'Modo escuro',
      themeToLight: 'Modo claro',
      closing: 'Um cartão de visita que vira flor é o argumento mais curto que eu tenho sobre ciclo de vida de materiais.',
      steps: [
        { title: 'Deixe o cartão de molho', text: 'Mergulhe o cartão em água por cerca de 1 minuto, o suficiente para amolecer a fibra. Pode rasgar em pedaços de 2 a 3 cm se quiser plantar em vasos pequenos.' },
        { title: 'Prepare a terra', text: 'Encha um vaso ou canteiro com terra vegetal solta e úmida. Deixe uns 2 cm livres na borda.' },
        { title: 'Cubra com uma camada fina', text: 'Apoie o cartão sobre a terra e cubra com no máximo 3 a 5 mm de substrato. Semente enterrada fundo não germina — ela precisa de luz.' },
        { title: 'Regue e acompanhe', text: 'Mantenha úmido (nunca encharcado) por 7 a 10 dias, em local ensolarado. A germinação costuma começar entre o 5º e o 10º dia.' }
      ],
      specs: [
        { k: 'Substrato do papel', v: 'Celulose 100% reciclada, sem cloro' },
        { k: 'Sementes', v: 'Manjericão (Ocimum basilicum)' },
        { k: 'Época ideal', v: 'Primavera e verão, após o risco de geadas; solo aquecido acelera a germinação' },
        { k: 'Germinação', v: '5 a 10 dias, com solo úmido e bastante luz' },
        { k: 'Tinta', v: 'Impressão à base de água, sem revestimento plástico' },
        { k: 'Descarte', v: 'Não há: o cartão é o vaso e a semente' }
      ]
    },
    EN: {
      back: 'Card',
      title: 'Plant this card.',
      lead: 'The printed card is made of seed paper: recycled cellulose, no plastic, no lamination, with seeds pressed into the sheet itself. It ends its life as a plant, not as waste.',
      stepsLabel: 'HOW TO PLANT',
      specsLabel: 'SPECIFICATIONS',
      closeLabel: 'Close',
      themeToDark: 'Dark mode',
      themeToLight: 'Light mode',
      closing: 'A business card that turns into a flower is the shortest argument I have about material life cycles.',
      steps: [
        { title: 'Soak the card', text: 'Submerge the card in water for about a minute — just enough to soften the fibre. Tear it into 2–3 cm pieces if you are planting in small pots.' },
        { title: 'Prepare the soil', text: 'Fill a pot or bed with loose, moist potting soil, leaving about 2 cm free at the rim.' },
        { title: 'Cover it thinly', text: 'Lay the card on the soil and cover with no more than 3–5 mm of substrate. Seeds buried deep will not sprout — they need light.' },
        { title: 'Water and watch', text: 'Keep it moist (never soaked) for 7 to 10 days in a sunny spot. Germination usually starts between day 5 and day 10.' }
      ],
      specs: [
        { k: 'Paper substrate', v: '100% recycled, chlorine-free cellulose' },
        { k: 'Seeds', v: 'Basil (Ocimum basilicum)' },
        { k: 'Best season', v: 'Spring and summer, after the last frost; warm soil speeds germination' },
        { k: 'Germination', v: '5 to 10 days, moist soil and plenty of light' },
        { k: 'Ink', v: 'Water-based printing, no plastic coating' },
        { k: 'Disposal', v: 'None: the card is both pot and seed' }
      ]
    },
    ZH: {
      back: '名片',
      title: '把这张名片种下。',
      lead: '实体名片使用种子纸印刷：再生纤维、无塑料、无覆膜，种子直接压入纸张。它的终点是一株植物，而不是垃圾。',
      stepsLabel: '种植步骤',
      specsLabel: '材料信息',
      closeLabel: '关闭',
      themeToDark: '深色模式',
      themeToLight: '浅色模式',
      closing: '一张会开花的名片，是我关于材料生命周期最简短的论证。',
      steps: [
        { title: '浸湿名片', text: '将名片浸入水中约一分钟，使纤维变软。若使用小花盆，可撕成 2–3 厘米的碎片。' },
        { title: '准备土壤', text: '在花盆或苗床中装入疏松湿润的营养土，顶部留出约 2 厘米。' },
        { title: '薄薄覆土', text: '将名片平铺在土面，覆盖 3–5 毫米基质即可。埋得太深种子无法发芽，它需要光照。' },
        { title: '浇水观察', text: '保持湿润但不积水，置于阳光充足处 7–10 天。通常第 5 至 10 天开始发芽。' }
      ],
      specs: [
        { k: '纸张基材', v: '100% 再生纤维，无氯漂白' },
        { k: '种子', v: '罗勒（甜罗勒）' },
        { k: '最佳季节', v: '春夏季，霜期过后；土壤温暖有助发芽' },
        { k: '发芽时间', v: '5–10 天，湿润土壤，充足光照' },
        { k: '油墨', v: '水性印刷，无塑料涂层' },
        { k: '废弃处理', v: '无需处理：名片既是容器也是种子' }
      ]
    }
  };

  /* Canteiros: cada entrada é uma haste com duas folhas e uma ponta.
     left/h em %, tilt em graus, delay em segundos, leaf = altura das folhas em %,
     lr = rotação de cada folha, size = [largura, altura] da folha maior em px. */
  var SPECS_L = [
    { left: 6, h: 46, tilt: -4, delay: 0.1, leaf: [38, 66], lr: [-38, 34], size: [17, 9] },
    { left: 18, h: 30, tilt: 5, delay: 0.5, leaf: [42, 72], lr: [32, -30], size: [13, 7] },
    { left: 30, h: 58, tilt: -2, delay: 0.25, leaf: [34, 62], lr: [-30, 28], size: [19, 10] },
    { left: 44, h: 24, tilt: 7, delay: 0.75, leaf: [48, 78], lr: [30, -26], size: [12, 6] },
    { left: 56, h: 40, tilt: -6, delay: 0.4, leaf: [36, 68], lr: [-34, 30], size: [16, 8] },
    { left: 70, h: 52, tilt: 3, delay: 0.6, leaf: [40, 70], lr: [28, -32], size: [18, 9] },
    { left: 84, h: 28, tilt: -5, delay: 0.9, leaf: [44, 74], lr: [-28, 26], size: [13, 7] }
  ];

  var SPECS_R = [
    { left: 10, h: 36, tilt: 4, delay: 0.2, leaf: [40, 70], lr: [-32, 30], size: [15, 8] },
    { left: 24, h: 54, tilt: -3, delay: 0.55, leaf: [34, 64], lr: [30, -28], size: [19, 10] },
    { left: 40, h: 26, tilt: 6, delay: 0.85, leaf: [46, 76], lr: [-28, 26], size: [12, 6] },
    { left: 54, h: 44, tilt: -5, delay: 0.35, leaf: [38, 68], lr: [32, -30], size: [17, 9] },
    { left: 70, h: 32, tilt: 3, delay: 0.7, leaf: [42, 72], lr: [-30, 28], size: [14, 7] },
    { left: 86, h: 48, tilt: -2, delay: 0.45, leaf: [36, 66], lr: [28, -26], size: [18, 9] }
  ];

  function plant(host, specs) {
    if (!host) return;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < specs.length; i++) {
      var s = specs[i];

      var stem = document.createElement('div');
      stem.className = 'stem';
      stem.style.left = s.left + '%';
      stem.style.height = s.h + '%';
      stem.style.setProperty('--tilt', s.tilt + 'deg');
      stem.style.animationDelay = s.delay + 's';

      var leafA = document.createElement('div');
      leafA.className = 'leaf-a';
      leafA.style.bottom = s.leaf[0] + '%';
      leafA.style.width = s.size[0] + 'px';
      leafA.style.height = s.size[1] + 'px';
      leafA.style.setProperty('--lrot', s.lr[0] + 'deg');
      leafA.style.animationDelay = s.delay + 1.1 + 's';

      var leafB = document.createElement('div');
      leafB.className = 'leaf-b';
      leafB.style.bottom = s.leaf[1] + '%';
      leafB.style.width = s.size[0] * 0.8 + 'px';
      leafB.style.height = s.size[1] * 0.8 + 'px';
      leafB.style.setProperty('--lrot', s.lr[1] + 'deg');
      leafB.style.animationDelay = s.delay + 1.5 + 's';

      var tip = document.createElement('div');
      tip.className = 'tip';
      tip.style.setProperty('--lrot', '0deg');
      tip.style.animationDelay = s.delay + 1.9 + 's';

      stem.appendChild(leafA);
      stem.appendChild(leafB);
      stem.appendChild(tip);
      frag.appendChild(stem);
    }

    host.appendChild(frag);
  }

  function renderSteps(steps) {
    var host = document.getElementById('steps');
    host.textContent = '';
    var frag = document.createDocumentFragment();

    for (var i = 0; i < steps.length; i++) {
      var li = document.createElement('li');
      li.className = 'step';

      var num = document.createElement('span');
      num.className = 'step-num';
      num.textContent = String(i + 1).length < 2 ? '0' + (i + 1) : String(i + 1);

      var body = document.createElement('div');
      body.className = 'step-body';

      var title = document.createElement('span');
      title.className = 'step-title';
      title.textContent = steps[i].title;

      var text = document.createElement('span');
      text.className = 'step-text';
      text.textContent = steps[i].text;

      body.appendChild(title);
      body.appendChild(text);
      li.appendChild(num);
      li.appendChild(body);
      frag.appendChild(li);
    }

    host.appendChild(frag);
  }

  function renderSpecs(specs) {
    var host = document.getElementById('specs');
    host.textContent = '';
    var frag = document.createDocumentFragment();

    for (var i = 0; i < specs.length; i++) {
      var wrap = document.createElement('div');
      wrap.className = 'spec';

      var key = document.createElement('dt');
      key.className = 'spec-key';
      key.textContent = specs[i].k;

      var value = document.createElement('dd');
      value.className = 'spec-value';
      value.textContent = specs[i].v;

      wrap.appendChild(key);
      wrap.appendChild(value);
      frag.appendChild(wrap);
    }

    host.appendChild(frag);
  }

  plant(document.getElementById('garden-left'), SPECS_L);
  plant(document.getElementById('garden-right'), SPECS_R);

  /* ------------------------------------------------------- popup da ficha */

  var specsDialog = document.getElementById('specs-dialog');
  var specsTrigger = document.getElementById('specs-trigger');
  var specsClose = document.getElementById('specs-dialog-close');

  if (specsTrigger && specsDialog) {
    specsTrigger.addEventListener('click', function () {
      specsDialog.showModal();
    });
  }

  if (specsClose && specsDialog) {
    specsClose.addEventListener('click', function () {
      specsDialog.close();
    });
  }

  if (specsDialog) {
    // Um <dialog> modal ocupa a tela toda; clique fora do painel cai
    // direto no próprio elemento (não em algum filho), então isso basta
    // para fechar ao clicar no fundo.
    specsDialog.addEventListener('click', function (e) {
      if (e.target === specsDialog) specsDialog.close();
    });
  }

  var themeCtl = null;

  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, strings) {
      renderSteps(strings.steps);
      renderSpecs(strings.specs);
      if (specsClose) specsClose.setAttribute('aria-label', strings.closeLabel);
      if (themeCtl) themeCtl.sync();
    }
  });

  /* ------------------------------------------------------------- tema */

  var toggle = document.getElementById('theme-toggle');
  themeCtl = window.KLTheme.attach(toggle, function (dark) {
    var s = i18n.strings();
    var label = dark ? s.themeToLight : s.themeToDark;
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  });
})();
