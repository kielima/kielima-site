/* Currículo — kielima.com/cv

   Mesmo contrato das outras páginas: todo o texto vive no objeto COPY, uma
   chave por idioma, e o HTML só marca onde cada chave entra via data-i18n.
   As listas datadas (pesquisa, publicações, formação, experiência…) são
   arrays por idioma, renderizados por cv.js — acrescentar um item é
   acrescentar uma linha, não mexer em marcação.

   Fonte dos fatos: historico-profissional e cv-matrix no vault de carreira.
   Regra editorial do site: só entra o que tem lastro (formação concluída,
   pesquisa em andamento, publicação aceita). */
(function () {
  'use strict';

  var COPY = {
    PT: {
      name: 'Kiê Lima',
      back: 'Início',
      kicker: 'CURRÍCULO',
      role: 'Engenharia civil · pesquisa em Avaliação de Ciclo de Vida de materiais cimentícios · gestão de projetos.',
      lead: 'Currículo completo, com a frente acadêmica em primeiro plano: pesquisa, publicações, formação, experiência e habilidades. A versão curta está na página inicial.',
      updated: 'Atualizado em novembro de 2026',

      researchLabel: 'PESQUISA',
      researchTitle: 'Avaliação de Ciclo de Vida de concretos sustentáveis.',
      researchP1: 'Mestrado em andamento em Sistemas de Infraestrutura Urbana (PUC-Campinas, bolsa CAPES), com dissertação sobre Avaliação de Ciclo de Vida (ACV) do concreto de ultra alto desempenho (UHPC) em comparação com concretos de agregado reciclado. O trabalho integra o projeto "Avaliação Ambiental de Materiais Estruturais para Grandes Obras", na área de concentração Sustentabilidade dos Sistemas de Infraestrutura Urbana, e inclui uma revisão sistemática com meta-análise da pegada de carbono do UHPC.',
      researchP2: 'A entrada no tema veio de duas iniciações científicas (2020–2022) sobre o efeito de altas temperaturas nas propriedades mecânicas do concreto com agregado reciclado. O horizonte seguinte é um doutorado em sustentabilidade de materiais cimentícios e infraestrutura urbana, hoje em preparação.',
      research: [
        { period: '2025 – atual', title: 'Avaliação Ambiental de Materiais Estruturais para Grandes Obras', org: 'Projeto de pesquisa · PUC-Campinas', note: 'Pesquisa em ACV de UHPC e de concretos com agregado reciclado, vinculada à dissertação de mestrado.' },
        { period: '2025 – atual', title: 'Comissão de Autoavaliação Acadêmica (CAA)', org: 'Programa de Pós-Graduação em Sistemas de Infraestrutura Urbana · PUC-Campinas', note: 'Integrante da comissão do programa.' },
        { period: '2021 – 2022', title: 'Análise do efeito de altas temperaturas na resistência à compressão e no módulo de elasticidade do concreto com agregado reciclado de concreto', org: 'Iniciação científica · PUC-Campinas', note: 'Pôsteres (2020, 2021), resumos expandidos (2021, 2022), comunicação oral na Semana Integrada e artigo no Congresso Brasileiro do Concreto.' },
        { period: '2022', title: 'Revisão Sistemática de Literatura sobre o Gerenciamento Inteligente de Resíduos Urbanos em Cidades Brasileiras', org: 'Trabalho de conclusão de curso · Engenharia Civil · PUC-Campinas', note: 'Práticas e ferramentas de gestão de resíduos em cidades inteligentes: sensores, LoRaWAN e otimização de rotas de coleta.' }
      ],

      pubsLabel: 'PUBLICAÇÕES',
      publications: [
        { cite: 'JACINTHO, A. E. P. G. A.; LIMA, K. T.; SANTOS, L. G.; FORTI, N. C. S.; PIMENTEL, L. L. Comparison of CO₂ Emission of Concretes with Recycled Aggregates and UHPC.', venue: 'fib Congress 2026 — Lisboa, Portugal', year: '2026', status: 'Publicado' },
        { cite: 'LIMA, K. T.; JACINTHO, A. E. P. G. A.; PIMENTEL, L. L.; FORTI, N. C. S. Estudo do Efeito de Altas Temperaturas nas Propriedades Mecânicas do Concreto com ARC.', venue: 'Congresso Brasileiro do Concreto (CBC) — Brasília', year: '2022', status: 'Publicado' }
      ],

      talksLabel: 'APRESENTAÇÕES E EVENTOS',
      talks: [
        { period: '2026', title: 'fib Congress 2026', org: 'Lisboa, Portugal', note: 'Artigo em anais: comparação das emissões de CO₂ de concretos com agregado reciclado e UHPC.' },
        { period: '2025', title: 'VII Post Graduated Meeting', org: 'PUC-Campinas', note: 'Comunicação oral: revisão sistemática e meta-análise, com apoio de inteligência artificial, sobre materiais estruturais sustentáveis para infraestrutura urbana.' },
        { period: '2025', title: '2º Simpósio de Pavimento de Concreto Reforçado', org: 'PUC-Campinas', note: 'Participação.' },
        { period: '2024', title: 'X Simpósio de Pesquisas em Sistemas de Infraestrutura Urbana (PISIU)', org: 'PUC-Campinas', note: 'Participação.' },
        { period: '2020 – 2021', title: 'Semana Integrada e encontros de iniciação científica', org: 'PUC-Campinas', note: 'Pôster (2020); pôster e comunicação oral (2021).' }
      ],

      educationLabel: 'FORMAÇÃO',
      education: [
        { period: '2025 – 2027', title: 'Mestrado em Sistemas de Infraestrutura Urbana', org: 'PUC-Campinas', note: 'Bolsa CAPES · Área de concentração: Sustentabilidade dos Sistemas de Infraestrutura Urbana · Dissertação em Avaliação de Ciclo de Vida de UHPC.' },
        { period: '2024 – 2025', title: 'MBA em Gestão de Projetos', org: 'Fundação Getulio Vargas (FGV)', note: 'Concluído em julho de 2025 · Trabalho final: Jogo de Negócios.' },
        { period: '2018 – 2022', title: 'Bacharelado em Engenharia Civil', org: 'PUC-Campinas', note: 'Bolsa ProUni integral · Duas iniciações científicas em concreto com agregado reciclado · Monitoria em Física, Estatística e Matemática · Registro no CREA-SP.' }
      ],

      experienceLabel: 'EXPERIÊNCIA',
      experience: [
        { period: '2021 – 2023', title: 'Estágio em projetos', org: 'NA Engenharia · Taubaté, SP', note: 'Modelagem em Revit de projetos arquitetônicos (três residências e um estabelecimento comercial), apoio à compatibilização de projetos estruturais, documentação técnica (ART, orçamentos e contratos), diários de obra, EAP e cronogramas. Os quatro projetos foram aprovados em prefeitura e concluídos no período.' },
        { period: '2013 – 2015', title: 'Analista técnico pleno', org: '3M do Brasil · Divisão Automotiva, Serviço Técnico', note: 'Ensaios químicos e físicos conforme normas técnicas de clientes do setor automotivo; gestão de equipamentos, insumos e reservas de laboratório; 5S e segurança do trabalho segundo normas ABNT.' },
        { period: '2012 – 2013', title: 'Aprendiz', org: '3M do Brasil · Sumaré, SP', note: 'Controle de insumos, estoque, envios e recebimentos; emissão e controle de notas fiscais e pagamentos; apoio administrativo.' }
      ],

      volunteerLabel: 'VOLUNTARIADO',
      volunteer: [
        { period: '2023 – atual', title: 'Conselho fiscal', org: 'ONG União · saúde', note: 'Fiscalização das contas e da conformidade financeira da organização.' },
        { period: '2015 – 2023', title: 'Tesouraria', org: 'ONG União · saúde', note: 'Gestão financeira, controle de caixa e prestação de contas.' }
      ],

      coursesLabel: 'FORMAÇÃO COMPLEMENTAR',
      courses: [
        'Estrategista Legal de Obras (ELO)',
        'Mapeamento com drones',
        'Revit',
        'TQS — cálculo estrutural',
        'Comunicação e oratória'
      ],

      skillsLabel: 'HABILIDADES',
      skills: [
        'Avaliação de Ciclo de Vida (ACV) de materiais de construção',
        'Revisão sistemática e meta-análise',
        'Revit e AutoCAD',
        'Microsoft Project e pacote Office',
        'Ensaios laboratoriais e normas técnicas',
        'Documentação técnica: ART, orçamentos e contratos',
        'Gestão de projetos e metodologias ágeis',
        'Inteligência artificial aplicada ao trabalho técnico'
      ],

      languagesLabel: 'IDIOMAS',
      languages: [
        { name: 'Português', level: 'Nativo' },
        { name: 'Inglês', level: 'Proficiência profissional' },
        { name: 'Mandarim', level: 'Elementar, em estudo' }
      ],

      contactLabel: 'CONTATO',
      contactP: 'Disponível para colaborações de pesquisa, parcerias e oportunidades em ACV de materiais e infraestrutura urbana sustentável.'
    },

    EN: {
      name: 'Kiê Lima',
      back: 'Home',
      kicker: 'CURRICULUM VITAE',
      role: 'Civil engineering · research in Life Cycle Assessment of cementitious materials · project management.',
      lead: 'Full CV, with the academic track first: research, publications, education, experience and skills. The short version is on the home page.',
      updated: 'Updated November 2026',

      researchLabel: 'RESEARCH',
      researchTitle: 'Life Cycle Assessment of sustainable concretes.',
      researchP1: 'Ongoing MSc in Urban Infrastructure Systems (PUC-Campinas, CAPES scholarship), with a dissertation on the Life Cycle Assessment (LCA) of ultra high performance concrete (UHPC) compared with recycled aggregate concretes. The work sits within the research project "Environmental Assessment of Structural Materials for Large Infrastructure", in the concentration area Sustainability of Urban Infrastructure Systems, and includes a systematic review with meta-analysis of the carbon footprint of UHPC.',
      researchP2: 'The way in was two undergraduate research projects (2020–2022) on how high temperatures affect the mechanical properties of recycled aggregate concrete. The next horizon is a PhD in the sustainability of cementitious materials and urban infrastructure, currently in preparation.',
      research: [
        { period: '2025 – present', title: 'Environmental Assessment of Structural Materials for Large Infrastructure', org: 'Research project · PUC-Campinas', note: 'Research on the LCA of UHPC and recycled aggregate concretes, linked to the MSc dissertation.' },
        { period: '2025 – present', title: 'Academic Self-Assessment Committee (CAA)', org: 'Graduate Programme in Urban Infrastructure Systems · PUC-Campinas', note: 'Member of the programme committee.' },
        { period: '2021 – 2022', title: 'Effect of high temperatures on the compressive strength and modulus of elasticity of recycled concrete aggregate concrete', org: 'Undergraduate research · PUC-Campinas', note: 'Posters (2020, 2021), extended abstracts (2021, 2022), oral presentation at the Integrated Week and a paper at the Brazilian Concrete Congress.' },
        { period: '2022', title: 'Systematic Literature Review on Smart Urban Waste Management in Brazilian Cities', org: 'Final-year thesis · Civil Engineering · PUC-Campinas', note: 'Waste management practices and tools in smart cities: sensors, LoRaWAN and collection route optimisation.' }
      ],

      pubsLabel: 'PUBLICATIONS',
      publications: [
        { cite: 'JACINTHO, A. E. P. G. A.; LIMA, K. T.; SANTOS, L. G.; FORTI, N. C. S.; PIMENTEL, L. L. Comparison of CO₂ Emission of Concretes with Recycled Aggregates and UHPC.', venue: 'fib Congress 2026 — Lisbon, Portugal', year: '2026', status: 'Published' },
        { cite: 'LIMA, K. T.; JACINTHO, A. E. P. G. A.; PIMENTEL, L. L.; FORTI, N. C. S. Study of the Effect of High Temperatures on the Mechanical Properties of Recycled Aggregate Concrete.', venue: 'Brazilian Concrete Congress (CBC) — Brasília', year: '2022', status: 'Published' }
      ],

      talksLabel: 'PRESENTATIONS AND EVENTS',
      talks: [
        { period: '2026', title: 'fib Congress 2026', org: 'Lisbon, Portugal', note: 'Conference paper: comparison of CO₂ emissions of recycled aggregate concretes and UHPC.' },
        { period: '2025', title: 'VII Post Graduated Meeting', org: 'PUC-Campinas', note: 'Oral presentation: AI-supported systematic review and meta-analysis of sustainable structural materials for urban infrastructure.' },
        { period: '2025', title: '2nd Symposium on Reinforced Concrete Pavements', org: 'PUC-Campinas', note: 'Attendance.' },
        { period: '2024', title: 'X Symposium on Research in Urban Infrastructure Systems (PISIU)', org: 'PUC-Campinas', note: 'Attendance.' },
        { period: '2020 – 2021', title: 'Integrated Week and undergraduate research meetings', org: 'PUC-Campinas', note: 'Poster (2020); poster and oral presentation (2021).' }
      ],

      educationLabel: 'EDUCATION',
      education: [
        { period: '2025 – 2027', title: 'MSc in Urban Infrastructure Systems', org: 'PUC-Campinas', note: 'CAPES scholarship · Concentration: Sustainability of Urban Infrastructure Systems · Dissertation on the LCA of UHPC.' },
        { period: '2024 – 2025', title: 'MBA in Project Management', org: 'Fundação Getulio Vargas (FGV)', note: 'Completed in July 2025 · Final project: Business Game.' },
        { period: '2018 – 2022', title: 'BSc in Civil Engineering', org: 'PUC-Campinas', note: 'Full ProUni scholarship · Two undergraduate research projects on recycled aggregate concrete · Teaching assistant in Physics, Statistics and Mathematics · Registered with CREA-SP.' }
      ],

      experienceLabel: 'EXPERIENCE',
      experience: [
        { period: '2021 – 2023', title: 'Design internship', org: 'NA Engenharia · Taubaté, Brazil', note: 'Revit modelling of architectural designs (three houses and one commercial building), support in coordinating structural designs, technical documentation (ART, budgets and contracts), site diaries, WBS and schedules. All four projects were approved by the municipality and completed within the period.' },
        { period: '2013 – 2015', title: 'Technical analyst', org: '3M Brazil · Automotive Division, Technical Service', note: 'Chemical and physical testing to the technical standards of automotive customers; management of laboratory equipment, supplies and bookings; 5S and occupational safety under ABNT standards.' },
        { period: '2012 – 2013', title: 'Apprentice', org: '3M Brazil · Sumaré, Brazil', note: 'Supplies, inventory, shipping and receiving; invoicing and payment control; administrative support.' }
      ],

      volunteerLabel: 'VOLUNTEERING',
      volunteer: [
        { period: '2023 – present', title: 'Audit committee', org: 'ONG União · health', note: 'Oversight of the organisation’s accounts and financial compliance.' },
        { period: '2015 – 2023', title: 'Treasury', org: 'ONG União · health', note: 'Financial management, cash control and accountability reporting.' }
      ],

      coursesLabel: 'FURTHER TRAINING',
      courses: [
        'Legal Strategy for Construction Works (ELO)',
        'Drone mapping',
        'Revit',
        'TQS — structural analysis',
        'Communication and public speaking'
      ],

      skillsLabel: 'SKILLS',
      skills: [
        'Life Cycle Assessment (LCA) of construction materials',
        'Systematic review and meta-analysis',
        'Revit and AutoCAD',
        'Microsoft Project and Office',
        'Laboratory testing and technical standards',
        'Technical documentation: ART, budgets and contracts',
        'Project management and agile methods',
        'Applied artificial intelligence in technical work'
      ],

      languagesLabel: 'LANGUAGES',
      languages: [
        { name: 'Portuguese', level: 'Native' },
        { name: 'English', level: 'Professional proficiency' },
        { name: 'Mandarin', level: 'Elementary, studying' }
      ],

      contactLabel: 'CONTACT',
      contactP: 'Open to research collaborations, partnerships and opportunities in materials LCA and sustainable urban infrastructure.'
    },

    ZH: {
      name: '霆宇',
      back: '首页',
      kicker: '简历',
      role: '土木工程 · 水泥基材料生命周期评估研究 · 项目管理。',
      lead: '完整简历，学术方向优先：研究、论文、教育、经历与技能。简短版本见首页。',
      updated: '更新于 2026 年 11 月',

      researchLabel: '研究',
      researchTitle: '可持续混凝土的生命周期评估。',
      researchP1: '目前在坎皮纳斯天主教大学攻读城市基础设施系统硕士（CAPES 奖学金），学位论文研究超高性能混凝土（UHPC）与再生骨料混凝土的生命周期评估（LCA）比较。该研究隶属于"大型工程结构材料环境评估"项目，属于"城市基础设施系统可持续性"研究方向，并包含一项关于 UHPC 碳足迹的系统综述与元分析。',
      researchP2: '进入这一领域源于两项本科科研（2020–2022），主题是高温对再生骨料混凝土力学性能的影响。下一步目标是攻读水泥基材料可持续性与城市基础设施方向的博士学位，目前正在准备中。',
      research: [
        { period: '2025 – 至今', title: '大型工程结构材料环境评估', org: '研究项目 · 坎皮纳斯天主教大学', note: 'UHPC 与再生骨料混凝土的生命周期评估研究，与硕士论文相关联。' },
        { period: '2025 – 至今', title: '学术自评委员会（CAA）', org: '城市基础设施系统研究生项目 · 坎皮纳斯天主教大学', note: '项目委员会成员。' },
        { period: '2021 – 2022', title: '高温对再生混凝土骨料混凝土抗压强度与弹性模量的影响分析', org: '本科科研 · 坎皮纳斯天主教大学', note: '海报（2020、2021）、扩展摘要（2021、2022）、综合周口头报告，以及巴西混凝土大会论文。' },
        { period: '2022', title: '巴西城市智能城市废弃物管理的系统文献综述', org: '本科毕业论文 · 土木工程 · 坎皮纳斯天主教大学', note: '智慧城市中的废弃物管理实践与工具：传感器、LoRaWAN 与收集路线优化。' }
      ],

      pubsLabel: '论文',
      publications: [
        { cite: 'JACINTHO, A. E. P. G. A.; LIMA, K. T.; SANTOS, L. G.; FORTI, N. C. S.; PIMENTEL, L. L. Comparison of CO₂ Emission of Concretes with Recycled Aggregates and UHPC.', venue: 'fib Congress 2026 — 葡萄牙里斯本', year: '2026', status: '已发表' },
        { cite: 'LIMA, K. T.; JACINTHO, A. E. P. G. A.; PIMENTEL, L. L.; FORTI, N. C. S. 高温对再生骨料混凝土力学性能影响的研究。', venue: '巴西混凝土大会（CBC）— 巴西利亚', year: '2022', status: '已发表' }
      ],

      talksLabel: '报告与会议',
      talks: [
        { period: '2026', title: 'fib Congress 2026', org: '葡萄牙里斯本', note: '会议论文：再生骨料混凝土与 UHPC 的二氧化碳排放比较。' },
        { period: '2025', title: '第七届研究生学术会议（VII Post Graduated Meeting）', org: '坎皮纳斯天主教大学', note: '口头报告：以人工智能辅助的系统综述与元分析，面向城市基础设施的可持续结构材料。' },
        { period: '2025', title: '第二届钢筋混凝土路面研讨会', org: '坎皮纳斯天主教大学', note: '参会。' },
        { period: '2024', title: '第十届城市基础设施系统研究研讨会（PISIU）', org: '坎皮纳斯天主教大学', note: '参会。' },
        { period: '2020 – 2021', title: '综合周与本科科研研讨会', org: '坎皮纳斯天主教大学', note: '海报（2020）；海报与口头报告（2021）。' }
      ],

      educationLabel: '教育',
      education: [
        { period: '2025 – 2027', title: '城市基础设施系统硕士', org: '坎皮纳斯天主教大学', note: 'CAPES 奖学金 · 研究方向：城市基础设施系统的可持续性 · 学位论文：UHPC 的生命周期评估。' },
        { period: '2024 – 2025', title: '项目管理 MBA', org: '瓦加斯基金会（FGV）', note: '2025 年 7 月毕业 · 结业项目：商业模拟。' },
        { period: '2018 – 2022', title: '土木工程学士', org: '坎皮纳斯天主教大学', note: 'ProUni 全额奖学金 · 两项再生骨料混凝土本科科研 · 物理、统计与数学助教 · 圣保罗州工程师协会（CREA-SP）注册。' }
      ],

      experienceLabel: '经历',
      experience: [
        { period: '2021 – 2023', title: '设计实习', org: 'NA Engenharia · 巴西陶巴特', note: '使用 Revit 建模建筑设计（三栋住宅与一处商业建筑），协助结构设计协调，技术文件（ART、预算与合同），施工日志、WBS 与进度计划。四个项目均获市政审批并在期内完工。' },
        { period: '2013 – 2015', title: '技术分析员', org: '3M 巴西 · 汽车事业部技术服务', note: '按汽车客户技术标准进行化学与物理试验；管理实验室设备、耗材与预约；依据 ABNT 标准执行 5S 与职业安全。' },
        { period: '2012 – 2013', title: '学徒', org: '3M 巴西 · 巴西苏马雷', note: '物料、库存、收发货管理；发票与付款控制；行政支持。' }
      ],

      volunteerLabel: '志愿服务',
      volunteer: [
        { period: '2023 – 至今', title: '监事会', org: 'ONG União · 医疗卫生', note: '监督机构账目与财务合规。' },
        { period: '2015 – 2023', title: '财务', org: 'ONG União · 医疗卫生', note: '财务管理、现金控制与账目报告。' }
      ],

      coursesLabel: '继续教育',
      courses: [
        '工程法律策略（ELO）',
        '无人机测绘',
        'Revit',
        'TQS — 结构分析',
        '沟通与演讲'
      ],

      skillsLabel: '技能',
      skills: [
        '建筑材料生命周期评估（LCA）',
        '系统综述与元分析',
        'Revit 与 AutoCAD',
        'Microsoft Project 与 Office',
        '实验室试验与技术标准',
        '技术文件：ART、预算与合同',
        '项目管理与敏捷方法',
        '人工智能在技术工作中的应用'
      ],

      languagesLabel: '语言',
      languages: [
        { name: '葡萄牙语', level: '母语' },
        { name: '英语', level: '专业工作水平' },
        { name: '普通话', level: '初级，在学' }
      ],

      contactLabel: '联系',
      contactP: '欢迎在材料生命周期评估与可持续城市基础设施领域开展研究合作、伙伴关系与工作机会。'
    }
  };

  var heroName = document.getElementById('hero-name');

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* Nome em duas partes, como no wordmark impresso: o primeiro nome reto e o
     resto em itálico verde-floresta. Nomes sem espaço ficam sem o realce. */
  function renderName(lang) {
    var full = COPY[lang].name;
    var space = full.indexOf(' ');
    heroName.textContent = '';
    if (space === -1) {
      heroName.textContent = full;
      return;
    }
    heroName.appendChild(document.createTextNode(full.slice(0, space + 1)));
    heroName.appendChild(el('span', 'accent', full.slice(space + 1)));
  }

  /* Lista datada: período, título, instituição e nota. */
  function renderDated(id, items) {
    var lista = document.getElementById(id);
    lista.textContent = '';
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.appendChild(el('span', 'cv-period', item.period));
      var body = el('div', 'cv-body');
      body.appendChild(el('span', 'cv-title', item.title));
      if (item.org) body.appendChild(el('span', 'cv-org', item.org));
      if (item.note) body.appendChild(el('span', 'cv-note', item.note));
      li.appendChild(body);
      lista.appendChild(li);
    });
  }

  function renderPublications(items) {
    var lista = document.getElementById('cv-pubs');
    lista.textContent = '';
    items.forEach(function (pub) {
      var li = document.createElement('li');
      li.appendChild(el('span', 'cv-pub-cite', pub.cite));
      var meta = el('span', 'cv-pub-meta');
      meta.appendChild(document.createTextNode(pub.year + ' · ' + pub.venue + ' · '));
      meta.appendChild(el('span', 'status', pub.status));
      li.appendChild(meta);
      lista.appendChild(li);
    });
  }

  function renderPlain(id, items) {
    var lista = document.getElementById(id);
    lista.textContent = '';
    items.forEach(function (texto) {
      lista.appendChild(el('li', null, texto));
    });
  }

  function renderLanguages(items) {
    var lista = document.getElementById('cv-languages');
    lista.textContent = '';
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.appendChild(el('span', 'name', item.name));
      li.appendChild(el('span', 'level', item.level));
      lista.appendChild(li);
    });
  }

  var themeCtl = null;

  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, s) {
      renderName(lang);
      renderDated('cv-research', s.research);
      renderPublications(s.publications);
      renderDated('cv-talks', s.talks);
      renderDated('cv-education', s.education);
      renderDated('cv-experience', s.experience);
      renderDated('cv-volunteer', s.volunteer);
      renderPlain('cv-courses', s.courses);
      renderPlain('cv-skills', s.skills);
      renderLanguages(s.languages);
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
