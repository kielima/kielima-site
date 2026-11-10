/* Fluxograma PRISMA 2020 da metanálise (/metanalise/prisma).
   Números = fotografia de 2026-11-10 do articles_final.xlsx (repositório da
   RSL), o mesmo funil do painel (/metanalise/). Cada caixa leva ao lado a
   definição do filtro que a produz (tarefa #1336: «definir cada número com
   um filtro explícito e verificável»). Atualizar à mão quando o funil mudar. */
(function () {
  'use strict';

  /* kind: 'main' (caixa do fluxo), 'out' (exclusão), 'side' (ramo lateral). */
  var STEPS = [
    { id: 'ident', phase: 'ident', n: 5093, kind: 'main' },
    { id: 'dup', phase: 'ident', n: 2630, kind: 'out' },
    { id: 'e1', phase: 'screen', n: 2463, kind: 'main' },
    { id: 'e1x', phase: 'screen', n: 272, kind: 'out' },
    { id: 'ret', phase: 'elig', n: 2191, kind: 'main' },
    { id: 'retx', phase: 'elig', n: 6, kind: 'out' },
    { id: 'e2', phase: 'elig', n: 2185, kind: 'main' },
    { id: 'e2x', phase: 'elig', n: 1643, kind: 'out' },
    { id: 'e3', phase: 'elig', n: 542, kind: 'main' },
    { id: 'e3x', phase: 'elig', n: 18, kind: 'out' },
    { id: 'e4', phase: 'incl', n: 524, kind: 'main' },
    { id: 'rev', phase: 'incl', n: 58, kind: 'out' },
    { id: 'fin', phase: 'incl', n: 466, kind: 'main' },
    { id: 'tier', phase: 'incl', n: 104, kind: 'out' }
  ];

  var COPY = {
    PT: {
      navBack: '← Metanálise',
      toDark: 'Modo escuro',
      toLight: 'Modo claro',
      kicker: 'PESQUISA · PRISMA 2020',
      title: 'Fluxograma PRISMA: de 5.093 registos a 466 artigos',
      lead: 'O fluxo da revisão sistemática em quatro etapas (metadados, texto completo, restrição geográfica do material e qualidade). Ao lado de cada número está o filtro que o produz, para que qualquer contagem possa ser refeita no banco de triagem.',
      updated: 'Fotografia de 10/11/2026 — o painel em /metanalise é o que acompanha o banco ao vivo',
      note: 'Cada registo é contado no primeiro critério que o exclui. Os artigos do terço de menor qualidade não saem do corpus: ficam fora do resultado principal e entram na análise de sensibilidade. Os 58 estudos de revisão sem ACV própria seguem como ramo de citação (fontes primárias a extrair).',
      phase_ident: 'Identificação',
      phase_screen: 'Triagem — Etapa 1',
      phase_elig: 'Elegibilidade — Etapas 2 e 3',
      phase_incl: 'Inclusão — Etapa 4',
      ident: ['Registos identificados nas bases', 'Web of Science 1.917 · Scopus 1.427 · Engineering Village 763 · MDPI 475 · Science Direct 411 · BDTD 72 · SciELO 28. Filtro: todas as linhas do banco (articles_final.xlsx).'],
      dup: ['Duplicados removidos antes da triagem', 'Filtro: status_triagem = Duplicado. Remoção pré-triagem, não é critério de exclusão.'],
      e1: ['Registos triados por metadados', 'Filtro: status_triagem ≠ Duplicado.'],
      e1x: ['Excluídos na Etapa 1', 'Construção 190 · material não moldável 72 · tipo de documento 9 · ano 1. Filtro: E1_construcao, E1_moldavel, E1_tipo_doc ou E1_ano ≠ Aceito (ano ≥ 2006), contado no primeiro critério que falha.'],
      ret: ['Textos completos procurados', 'Filtro: os quatro critérios E1 = Aceito.'],
      retx: ['Texto completo não obtido', 'Sem decisão da Etapa 2 por falta de PDF (E2_resistencia vazio).'],
      e2: ['Textos completos avaliados', 'Leitura integral do PDF, incluindo figuras e tabelas.'],
      e2x: ['Excluídos na Etapa 2 — falta de dado', '1.303 sem resistência à compressão própria pareável a um CO₂ próprio; 340 com resistência mas sem CO₂ absoluto. Filtro: E2_resistencia ou E2_co2 ≠ Aceito. É a categoria que sustenta a discussão do viés de relato.'],
      e3: ['Artigos aceites na Etapa 2', 'Filtro: E2_resistencia = Aceito e E2_co2 = Aceito.'],
      e3x: ['Excluídos na Etapa 3 — material geograficamente restrito', '14 com E3_regional = Rejeitado; 4 rejeitados pelo mesmo motivo na triagem antiga (C6), sem E3_regional preenchido (a regularizar no banco).'],
      e4: ['Artigos que passam a Etapa 3', 'Filtro: E3_regional = Aceito (466 elegíveis + 58 revisões).'],
      rev: ['Revisões sem ACV própria — ramo de citação', 'Filtro: status_triagem = Revisao. Não pontuam, mas as fontes primárias que citam serão extraídas.'],
      fin: ['Artigos incluídos na revisão', 'Filtro: status_triagem = Elegível. 362 formam o resultado principal (nota de qualidade ≥ 4,0 de 7).'],
      tier: ['Terço mais fraco — fora do resultado principal', 'Filtro: E4_estrato = sensibilidade (nota < 4,0). Exclusão do resultado principal, não do corpus; entra na análise de sensibilidade.']
    },
    EN: {
      navBack: '← Meta-analysis',
      toDark: 'Dark mode',
      toLight: 'Light mode',
      kicker: 'RESEARCH · PRISMA 2020',
      title: 'PRISMA flow: from 5,093 records to 466 articles',
      lead: 'The systematic review flow in four stages (metadata, full text, geographic restriction of the material, and quality). Next to each number is the filter that produces it, so any count can be redone on the screening database.',
      updated: 'Snapshot of 10 Nov 2026 — the /metanalise dashboard follows the database live',
      note: 'Each record is counted at the first criterion that excludes it. Articles in the lowest quality third do not leave the corpus: they are left out of the main result and enter the sensitivity analysis. The 58 review studies without their own LCA continue as a citation branch (primary sources to be extracted).',
      phase_ident: 'Identification',
      phase_screen: 'Screening — Stage 1',
      phase_elig: 'Eligibility — Stages 2 and 3',
      phase_incl: 'Inclusion — Stage 4',
      ident: ['Records identified from databases', 'Web of Science 1,917 · Scopus 1,427 · Engineering Village 763 · MDPI 475 · Science Direct 411 · BDTD 72 · SciELO 28. Filter: every row of the database (articles_final.xlsx).'],
      dup: ['Duplicates removed before screening', 'Filter: status_triagem = Duplicado. Pre-screening removal, not an exclusion criterion.'],
      e1: ['Records screened on metadata', 'Filter: status_triagem ≠ Duplicado.'],
      e1x: ['Excluded at Stage 1', 'Construction 190 · non-castable material 72 · document type 9 · year 1. Filter: E1_construcao, E1_moldavel, E1_tipo_doc or E1_ano ≠ Aceito (year ≥ 2006), counted at the first criterion that fails.'],
      ret: ['Full texts sought for retrieval', 'Filter: all four E1 criteria = Aceito.'],
      retx: ['Full text not retrieved', 'No Stage 2 decision for lack of a PDF (E2_resistencia empty).'],
      e2: ['Full texts assessed', 'Full reading of the PDF, including figures and tables.'],
      e2x: ['Excluded at Stage 2 — missing data', '1,303 without their own compressive strength pairable with their own CO₂; 340 with strength but no absolute CO₂. Filter: E2_resistencia or E2_co2 ≠ Aceito. This category supports the reporting-bias discussion.'],
      e3: ['Articles accepted at Stage 2', 'Filter: E2_resistencia = Aceito and E2_co2 = Aceito.'],
      e3x: ['Excluded at Stage 3 — geographically restricted material', '14 with E3_regional = Rejeitado; 4 rejected for the same reason in the old screening (C6), with E3_regional not filled in (to be regularised in the database).'],
      e4: ['Articles passing Stage 3', 'Filter: E3_regional = Aceito (466 eligible + 58 reviews).'],
      rev: ['Reviews without their own LCA — citation branch', 'Filter: status_triagem = Revisao. They are not scored, but the primary sources they cite will be extracted.'],
      fin: ['Articles included in the review', 'Filter: status_triagem = Elegível. 362 form the main result (quality score ≥ 4.0 of 7).'],
      tier: ['Weakest third — outside the main result', 'Filter: E4_estrato = sensibilidade (score < 4.0). Exclusion from the main result, not from the corpus; it enters the sensitivity analysis.']
    },
    ZH: {
      navBack: '← 荟萃分析',
      toDark: '深色模式',
      toLight: '浅色模式',
      kicker: '研究 · PRISMA 2020',
      title: 'PRISMA 流程图：从 5,093 条记录到 466 篇文章',
      lead: '系统综述分四个阶段进行（元数据、全文、材料的地理限制、质量）。每个数字旁边都标注了产生它的筛选条件，因此任何计数都可以在筛选数据库中重新核对。',
      updated: '2026 年 11 月 10 日快照 — /metanalise 面板实时跟踪数据库',
      note: '每条记录只在第一个将其排除的标准处计数。质量最低三分之一的文章不会离开语料库：它们不进入主要结果，而进入敏感性分析。58 篇没有自己生命周期评价的综述作为引文分支保留（待提取原始文献）。',
      phase_ident: '识别',
      phase_screen: '筛选 — 第 1 阶段',
      phase_elig: '资格 — 第 2、3 阶段',
      phase_incl: '纳入 — 第 4 阶段',
      ident: ['从数据库识别的记录', 'Web of Science 1,917 · Scopus 1,427 · Engineering Village 763 · MDPI 475 · Science Direct 411 · BDTD 72 · SciELO 28。条件：数据库（articles_final.xlsx）的全部行。'],
      dup: ['筛选前移除的重复项', '条件：status_triagem = Duplicado。筛选前移除，不属于排除标准。'],
      e1: ['按元数据筛选的记录', '条件：status_triagem ≠ Duplicado。'],
      e1x: ['第 1 阶段排除', '建筑应用 190 · 非可浇筑材料 72 · 文献类型 9 · 年份 1。条件：E1_construcao、E1_moldavel、E1_tipo_doc 或 E1_ano ≠ Aceito（年份 ≥ 2006），按第一个不通过的标准计数。'],
      ret: ['尝试获取全文的记录', '条件：四项 E1 标准均为 Aceito。'],
      retx: ['未能获取全文', '因缺少 PDF 而无第 2 阶段决定（E2_resistencia 为空）。'],
      e2: ['评估的全文', '完整阅读 PDF，包括图和表。'],
      e2x: ['第 2 阶段排除 — 数据缺失', '1,303 篇没有可与自身 CO₂ 配对的抗压强度；340 篇有强度但没有绝对 CO₂。条件：E2_resistencia 或 E2_co2 ≠ Aceito。该类别支撑报告偏倚的讨论。'],
      e3: ['通过第 2 阶段的文章', '条件：E2_resistencia = Aceito 且 E2_co2 = Aceito。'],
      e3x: ['第 3 阶段排除 — 材料受地理限制', '14 篇 E3_regional = Rejeitado；4 篇在旧筛选（C6）中因同一原因被拒，E3_regional 未填写（待在数据库中规范）。'],
      e4: ['通过第 3 阶段的文章', '条件：E3_regional = Aceito（466 篇合格 + 58 篇综述）。'],
      rev: ['没有自身 LCA 的综述 — 引文分支', '条件：status_triagem = Revisao。不评分，但将提取其引用的原始文献。'],
      fin: ['纳入综述的文章', '条件：status_triagem = Elegível。其中 362 篇构成主要结果（质量得分 ≥ 4.0/7）。'],
      tier: ['最弱的三分之一 — 不进入主要结果', '条件：E4_estrato = sensibilidade（得分 < 4.0）。从主要结果而非语料库中排除；进入敏感性分析。']
    }
  };

  var el = document.getElementById('prisma');
  var strings = COPY.PT;

  function fmt(n) {
    var s = String(n), out = '';
    for (var i = 0; i < s.length; i++) {
      if (i && (s.length - i) % 3 === 0) out += '.';
      out += s.charAt(i);
    }
    return out;
  }

  function render() {
    el.textContent = '';
    var phase = null, row = null;
    STEPS.forEach(function (st) {
      if (st.phase !== phase) {
        phase = st.phase;
        var h = document.createElement('h3');
        h.className = 'prisma-phase';
        h.textContent = strings['phase_' + phase];
        el.appendChild(h);
      }
      if (st.kind === 'main') {
        row = document.createElement('div');
        row.className = 'prisma-row';
        el.appendChild(row);
      }
      var box = document.createElement('div');
      box.className = 'prisma-box prisma-' + st.kind;
      var n = document.createElement('span');
      n.className = 'prisma-n';
      n.textContent = fmt(st.n);
      var t = document.createElement('span');
      t.className = 'prisma-t';
      t.textContent = strings[st.id][0];
      var d = document.createElement('span');
      d.className = 'prisma-d';
      d.textContent = strings[st.id][1];
      box.appendChild(n); box.appendChild(t); box.appendChild(d);
      row.appendChild(box);
    });
  }

  var themeCtl = null;
  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, s) {
      strings = s;
      render();
      if (themeCtl) themeCtl.sync();
    }
  });

  var toggle = document.getElementById('theme-toggle');
  themeCtl = window.KLTheme.attach(toggle, function (dark) {
    var s = COPY[i18n ? i18n.current() : 'PT'];
    var label = dark ? s.toLight : s.toDark;
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  });
})();
