/* Home — kielima.com

   Todo o texto da página vive no objeto COPY abaixo, com uma chave por idioma.
   O HTML apenas marca onde cada chave entra, via data-i18n — traduzir ou
   corrigir um texto não exige tocar em marcação. */
(function () {
  'use strict';

  var EMAIL = 'kie@kielima.com';
  var LINKEDIN = 'https://www.linkedin.com/in/kielima/';
  var GITHUB = 'https://github.com/kielima';
  var ORCID = 'https://orcid.org/0000-0003-0294-5676';
  var LATTES = 'http://lattes.cnpq.br/8777364542894550';

  var COPY = {
    PT: {
      name: 'Kiê Lima',
      navAbout: 'Trajetória',
      navResearch: 'Pesquisa',
      navContact: 'Contato',

      heroKicker: 'ENGENHARIA CIVIL · PESQUISA · SUSTENTABILIDADE',
      heroRole: 'Avaliação de ciclo de vida de materiais de construção e infraestrutura urbana sustentável.',
      heroLead: 'Engenheira civil formada pela PUC-Campinas, com MBA em Gestão de Projetos pela FGV e mestrado em andamento em Sistemas de Infraestrutura Urbana. Pesquiso o custo ambiental do concreto — do berço ao túmulo.',
      ctaCard: 'Cartão de visita',

      aboutLabel: 'TRAJETÓRIA',
      aboutTitle: 'Da obra para o ciclo de vida.',
      aboutP1: 'Sou Kiê Lima, engenheira civil formada pela PUC-Campinas (bolsa ProUni), com MBA em Gestão de Projetos pela FGV e mestrado em andamento em Sistemas de Infraestrutura Urbana pela PUC-Campinas (bolsa CAPES). Antes da pesquisa, atuei em projetos estruturais e arquitetônicos na NA Engenharia e em laboratório técnico na 3M.',
      aboutP2: 'Trabalho na fronteira entre engenharia, sustentabilidade ambiental e gestão de projetos, priorizando sempre o ambiental e o social acima de qualquer outro interesse. Meu horizonte de longo prazo é um doutorado em infraestrutura urbana sustentável, hoje em preparação para candidaturas na China.',
      education: [
        { period: '2025 – 2027', title: 'Mestrado em Sistemas de Infraestrutura Urbana', org: 'PUC-Campinas', note: 'Bolsa CAPES · Área de concentração: Sustentabilidade dos Sistemas de Infraestrutura Urbana' },
        { period: '2024 – 2025', title: 'MBA em Gestão de Projetos', org: 'Fundação Getulio Vargas (FGV)', note: 'Concluído em julho de 2025' },
        { period: '2018 – 2022', title: 'Bacharelado em Engenharia Civil', org: 'PUC-Campinas', note: 'Bolsa ProUni integral · Iniciação científica em concreto com agregado reciclado' }
      ],

      researchLabel: 'PESQUISA',
      researchTitle: 'Quanto custa, em carbono, o concreto que a gente escolhe.',
      researchP1: 'A dissertação em desenvolvimento aplica Avaliação de Ciclo de Vida (ACV) ao concreto de ultra alto desempenho (UHPC), comparando seu impacto ambiental ao de concretos com agregado reciclado. O trabalho está vinculado ao projeto de pesquisa "Avaliação Ambiental de Materiais Estruturais para Grandes Obras", na linha que cruza infraestrutura urbana, dados e sustentabilidade.',
      researchP2: 'A entrada no tema veio da iniciação científica, sobre o efeito de altas temperaturas nas propriedades mecânicas do concreto com agregado reciclado — a pergunta de fundo já era a mesma: o que acontece com um material depois que ele deixa de ser novo.',
      pubsLabel: 'PUBLICAÇÕES',
      publications: [
        {
          year: '2026',
          cite: 'JACINTHO, A. E. P. G. A.; LIMA, K. T.; SANTOS, L. G.; FORTI, N. C. S.; PIMENTEL, L. L. Comparison of CO₂ Emission of Concretes with Recycled Aggregates and UHPC.',
          venue: 'fib Congress 2026 — Lisboa, Portugal',
          status: 'Aceito'
        },
        {
          year: '2022',
          cite: 'LIMA, K. T.; JACINTHO, A. E. P. G. A.; PIMENTEL, L. L.; FORTI, N. C. S. Estudo do Efeito de Altas Temperaturas nas Propriedades Mecânicas do Concreto com ARC.',
          venue: 'Congresso Brasileiro do Concreto (CBC) — Brasília',
          status: 'Publicado'
        }
      ],


      contactLabel: 'CONTATO',
      contactTitle: 'Vamos conversar.',
      contactP: 'Aberta a colaborações de pesquisa, parcerias e oportunidades em ACV de materiais e infraestrutura urbana sustentável.',
      contactKeys: { email: 'E-mail', linkedin: 'LinkedIn', github: 'GitHub', orcid: 'ORCID', lattes: 'Lattes' },

      mission: 'ES > G'
    },

    EN: {
      name: 'Kiê Lima',
      navAbout: 'Background',
      navResearch: 'Research',
      navContact: 'Contact',

      heroKicker: 'CIVIL ENGINEERING · RESEARCH · SUSTAINABILITY',
      heroRole: 'Life cycle assessment of construction materials and sustainable urban infrastructure.',
      heroLead: 'Civil engineer from PUC-Campinas, with an MBA in Project Management from FGV and an ongoing MSc in Urban Infrastructure Systems. My research is on the environmental cost of concrete — cradle to grave.',
      ctaCard: 'Business card',

      aboutLabel: 'BACKGROUND',
      aboutTitle: 'From the building site to the life cycle.',
      aboutP1: "I'm Kiê Lima, a civil engineer (PUC-Campinas, ProUni scholarship) with an MBA in Project Management from FGV and an ongoing MSc in Urban Infrastructure Systems at PUC-Campinas (CAPES scholarship). Before research, I worked on structural and architectural projects at NA Engenharia and in a technical lab at 3M.",
      aboutP2: 'I work at the intersection of engineering, environmental sustainability and project management, prioritising environmental and social impact above any other interest. My long-term goal is a PhD in sustainable urban infrastructure — currently preparing to apply in China.',
      education: [
        { period: '2025 – 2027', title: 'MSc in Urban Infrastructure Systems', org: 'PUC-Campinas', note: 'CAPES scholarship · Concentration: Sustainability of Urban Infrastructure Systems' },
        { period: '2024 – 2025', title: 'MBA in Project Management', org: 'Fundação Getulio Vargas (FGV)', note: 'Completed in July 2025' },
        { period: '2018 – 2022', title: 'BSc in Civil Engineering', org: 'PUC-Campinas', note: 'Full ProUni scholarship · Undergraduate research on recycled aggregate concrete' }
      ],

      researchLabel: 'RESEARCH',
      researchTitle: 'What the concrete we choose costs, in carbon.',
      researchP1: 'My ongoing dissertation applies Life Cycle Assessment (LCA) to ultra high performance concrete (UHPC), comparing its environmental impact with that of recycled aggregate concretes. The work sits within the research project "Environmental Assessment of Structural Materials for Large Infrastructure", on the line where urban infrastructure, data and sustainability meet.',
      researchP2: 'The way in was undergraduate research on how high temperatures affect the mechanical properties of recycled aggregate concrete — the underlying question was already the same one: what happens to a material once it stops being new.',
      pubsLabel: 'PUBLICATIONS',
      publications: [
        {
          year: '2026',
          cite: 'JACINTHO, A. E. P. G. A.; LIMA, K. T.; SANTOS, L. G.; FORTI, N. C. S.; PIMENTEL, L. L. Comparison of CO₂ Emission of Concretes with Recycled Aggregates and UHPC.',
          venue: 'fib Congress 2026 — Lisbon, Portugal',
          status: 'Accepted'
        },
        {
          year: '2022',
          cite: 'LIMA, K. T.; JACINTHO, A. E. P. G. A.; PIMENTEL, L. L.; FORTI, N. C. S. Study of the Effect of High Temperatures on the Mechanical Properties of Recycled Aggregate Concrete.',
          venue: 'Brazilian Concrete Congress (CBC) — Brasília',
          status: 'Published'
        }
      ],


      contactLabel: 'CONTACT',
      contactTitle: 'Let’s talk.',
      contactP: 'Open to research collaborations, partnerships and opportunities in materials LCA and sustainable urban infrastructure.',
      contactKeys: { email: 'Email', linkedin: 'LinkedIn', github: 'GitHub', orcid: 'ORCID', lattes: 'Lattes' },

      mission: 'Environmental and social impact, prioritized above all else.'
    },

    ZH: {
      name: '霆宇',
      navAbout: '经历',
      navResearch: '研究',
      navContact: '联系',

      heroKicker: '土木工程 · 科研 · 可持续发展',
      heroRole: '建筑材料的生命周期评估与可持续城市基础设施。',
      heroLead: '毕业于坎皮纳斯天主教大学的土木工程师，持有FGV项目管理MBA学位，目前攻读城市基础设施系统硕士学位。研究方向是混凝土的环境代价——从摇篮到坟墓。',
      ctaCard: '电子名片',

      aboutLabel: '经历',
      aboutTitle: '从工地走向生命周期。',
      aboutP1: '我是霆宇，坎皮纳斯天主教大学土木工程专业毕业（ProUni奖学金），持有FGV项目管理MBA学位，目前在坎皮纳斯天主教大学攻读城市基础设施系统硕士学位（CAPES奖学金）。进入科研之前，我在NA Engenharia从事结构与建筑设计工作，并在3M的技术实验室任职。',
      aboutP2: '我的工作处在工程、环境可持续性与项目管理的交界处，始终将环境与社会利益置于其他利益之上。长期目标是攻读可持续城市基础设施方向的博士学位，目前正在准备申请中国的院校。',
      education: [
        { period: '2025 – 2027', title: '城市基础设施系统硕士', org: '坎皮纳斯天主教大学', note: 'CAPES奖学金 · 研究方向：城市基础设施系统的可持续性' },
        { period: '2024 – 2025', title: '项目管理MBA', org: '瓦加斯基金会（FGV）', note: '2025年7月毕业' },
        { period: '2018 – 2022', title: '土木工程学士', org: '坎皮纳斯天主教大学', note: 'ProUni全额奖学金 · 再生骨料混凝土本科科研' }
      ],

      researchLabel: '研究',
      researchTitle: '我们选择的混凝土，用碳来算是多少。',
      researchP1: '在研的硕士论文将生命周期评估（LCA）应用于超高性能混凝土（UHPC），并将其环境影响与再生骨料混凝土进行比较。该研究隶属于“大型工程结构材料环境评估”项目，处在城市基础设施、数据与可持续性交汇的研究方向上。',
      researchP2: '这一课题始于本科阶段的科研：高温对再生骨料混凝土力学性能的影响。当时的核心问题其实已经相同——一种材料在不再是新的之后，会发生什么。',
      pubsLabel: '论文',
      publications: [
        {
          year: '2026',
          cite: 'JACINTHO, A. E. P. G. A.; LIMA, K. T.; SANTOS, L. G.; FORTI, N. C. S.; PIMENTEL, L. L. Comparison of CO₂ Emission of Concretes with Recycled Aggregates and UHPC.',
          venue: 'fib Congress 2026 — 葡萄牙里斯本',
          status: '已录用'
        },
        {
          year: '2022',
          cite: 'LIMA, K. T.; JACINTHO, A. E. P. G. A.; PIMENTEL, L. L.; FORTI, N. C. S. 高温对再生骨料混凝土力学性能影响的研究。',
          venue: '巴西混凝土大会（CBC）— 巴西利亚',
          status: '已发表'
        }
      ],


      contactLabel: '联系',
      contactTitle: '欢迎交流。',
      contactP: '欢迎在材料生命周期评估与可持续城市基础设施方向开展科研合作与各类合作。',
      contactKeys: { email: '电子邮件', linkedin: '领英', github: 'GitHub', orcid: 'ORCID', lattes: 'Lattes' },

      mission: '始终将环境与社会利益置于其他利益之上。'
    }
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderEducation(items) {
    var host = document.getElementById('education');
    host.textContent = '';
    var frag = document.createDocumentFragment();

    for (var i = 0; i < items.length; i++) {
      var li = el('li');
      var body = el('div', 'tl-body');
      body.appendChild(el('span', 'tl-title', items[i].title));
      body.appendChild(el('span', 'tl-org', items[i].org));
      body.appendChild(el('span', 'tl-note', items[i].note));
      li.appendChild(el('span', 'tl-period', items[i].period));
      li.appendChild(body);
      frag.appendChild(li);
    }

    host.appendChild(frag);
  }

  function renderPublications(items) {
    var host = document.getElementById('pubs');
    host.textContent = '';
    var frag = document.createDocumentFragment();

    for (var i = 0; i < items.length; i++) {
      var li = el('li');
      var body = el('div', 'pub-body');
      body.appendChild(el('span', 'pub-cite', items[i].cite));

      var meta = el('span', 'pub-meta');
      meta.appendChild(document.createTextNode(items[i].venue + ' · '));
      meta.appendChild(el('span', 'pub-status', items[i].status));
      body.appendChild(meta);

      li.appendChild(el('span', 'pub-year', items[i].year));
      li.appendChild(body);
      frag.appendChild(li);
    }

    host.appendChild(frag);
  }

  function renderContacts(keys) {
    var rows = [
      { key: keys.email, label: EMAIL, href: 'mailto:' + EMAIL },
      { key: keys.linkedin, label: 'linkedin.com/in/kielima', href: LINKEDIN },
      { key: keys.github, label: 'github.com/kielima', href: GITHUB },
      { key: keys.orcid, label: '0000-0003-0294-5676', href: ORCID },
      { key: keys.lattes, label: 'lattes.cnpq.br', href: LATTES }
    ];

    var host = document.getElementById('contacts');
    host.textContent = '';
    var frag = document.createDocumentFragment();

    for (var i = 0; i < rows.length; i++) {
      var li = el('li');
      li.appendChild(el('span', 'contact-key', rows[i].key));

      var a = el('a', null, rows[i].label);
      a.href = rows[i].href;
      if (rows[i].href.indexOf('mailto:') !== 0) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      li.appendChild(a);
      frag.appendChild(li);
    }

    host.appendChild(frag);
  }

  var themeCtl = null;

  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, s) {
      renderEducation(s.education);
      renderPublications(s.publications);
      renderContacts(s.contactKeys);
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
