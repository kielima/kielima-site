/* Banco de dados da metanálise — kielima.com/metanalise/dados
   Mostra a aba dados_fck do meta_analysis_base.xlsx inteira (todas as linhas,
   todas as colunas), a partir de /metanalise/dados/banco.json, gerado pelo
   metanalise-export-banco.py do repositório da revisão sistemática.

   Sem biblioteca externa: pesquisa em todas as colunas, ordenação por coluna
   e ficha técnica de cada linha (janela sobreposta, imprimível numa folha
   A4), em JS puro. Todas as linhas numa só página, sem
   paginação (pedido da Kiê, 2026-09-26). Os nomes das colunas não se
   traduzem — são os cabeçalhos da planilha, citados assim nas notas e no
   protocolo da extração. */
(function () {
  'use strict';

  var COPY = {
    PT: {
      navBack: '← Metanálise',
      kicker: 'PESQUISA · BANCO DE DADOS',
      title: 'Banco de dados da metanálise',
      lead: 'Todas as linhas e colunas da extração, tal como estão na planilha de trabalho: resistência à compressão, pegada de carbono, volume do corpo de prova, qualidade e as notas de cada correção. Inclui as linhas que ainda não entram nos gráficos do painel.',
      download: 'Baixar JSON',
      hint: 'Clique no nome de uma coluna para ordenar; clique numa linha para abrir a ficha técnica do artigo, pronta a imprimir numa folha A4.',
      search: 'Pesquisar em todas as colunas…',
      loading: 'A carregar o banco de dados…',
      error: 'Não foi possível carregar o banco de dados.',
      empty: 'Nenhuma linha corresponde à pesquisa.',
      count: function (n, total) {
        return n === total ? total + ' linhas' : n + ' de ' + total + ' linhas';
      },
      updated: function (data, linhas, colunas) {
        return 'Atualizado em ' + data + ' · ' + linhas + ' linhas · ' + colunas + ' colunas';
      },
      fichaKicker: 'Ficha técnica · linha',
      print: 'Imprimir',
      close: 'Fechar',
      secMat: 'Material e resistência',
      secCo2: 'Pegada de carbono',
      secCp: 'Corpo de prova',
      secDur: 'Durabilidade e vida útil',
      secQual: 'Qualidade (Etapa 4)',
      secIc: 'Intervalo de confiança',
      secObs: 'Observações',
      f_material: 'Material',
      f_fck: 'Resistência à compressão (MPa)',
      f_classe: 'Classe de resistência',
      f_idade: 'Idade (dias)',
      f_tipo: 'Tipo de corpo de prova',
      f_fonte: 'Fonte no PDF',
      f_co2: 'Valor',
      f_co2u: 'Unidade',
      f_co2f: 'Fonte no PDF',
      f_vol: 'Volume (m³)',
      f_volf: 'Origem do volume',
      f_volc: 'Citação',
      f_dur: 'Resumo',
      f_durf: 'Fonte no PDF',
      f_vida: 'Vida útil (anos)',
      f_vidaf: 'Fonte no PDF',
      f_e4: 'Pontuação',
      f_estr: 'Estrato',
      f_icfck: 'Resistência',
      f_icco2: 'CO₂',
      rodape: 'kielima.com/metanalise/dados · banco gerado em ',
      toDark: 'Modo escuro',
      toLight: 'Modo claro'
    },
    EN: {
      navBack: '← Meta-analysis',
      kicker: 'RESEARCH · DATABASE',
      title: 'Meta-analysis database',
      lead: 'Every row and column of the extraction, exactly as in the working spreadsheet: compressive strength, carbon footprint, specimen volume, quality score and the notes on every correction. Includes rows that are not yet in the dashboard charts.',
      download: 'Download JSON',
      hint: 'Click a column name to sort; click a row to open the article’s data sheet, ready to print on one A4 page.',
      search: 'Search all columns…',
      loading: 'Loading the database…',
      error: 'The database could not be loaded.',
      empty: 'No rows match the search.',
      count: function (n, total) {
        return n === total ? total + ' rows' : n + ' of ' + total + ' rows';
      },
      updated: function (data, linhas, colunas) {
        return 'Updated ' + data + ' · ' + linhas + ' rows · ' + colunas + ' columns';
      },
      fichaKicker: 'Data sheet · row',
      print: 'Print',
      close: 'Close',
      secMat: 'Material and strength',
      secCo2: 'Carbon footprint',
      secCp: 'Specimen',
      secDur: 'Durability and service life',
      secQual: 'Quality (Stage 4)',
      secIc: 'Confidence interval',
      secObs: 'Notes',
      f_material: 'Material',
      f_fck: 'Compressive strength (MPa)',
      f_classe: 'Strength class',
      f_idade: 'Age (days)',
      f_tipo: 'Specimen type',
      f_fonte: 'Source in the PDF',
      f_co2: 'Value',
      f_co2u: 'Unit',
      f_co2f: 'Source in the PDF',
      f_vol: 'Volume (m³)',
      f_volf: 'Volume source',
      f_volc: 'Quote',
      f_dur: 'Summary',
      f_durf: 'Source in the PDF',
      f_vida: 'Service life (years)',
      f_vidaf: 'Source in the PDF',
      f_e4: 'Score',
      f_estr: 'Stratum',
      f_icfck: 'Strength',
      f_icco2: 'CO₂',
      rodape: 'kielima.com/metanalise/dados · database generated on ',
      toDark: 'Dark mode',
      toLight: 'Light mode'
    },
    ZH: {
      navBack: '← 荟萃分析',
      kicker: '研究 · 数据库',
      title: '荟萃分析数据库',
      lead: '数据提取的全部行和列，与工作表中完全一致：抗压强度、碳足迹、试件体积、质量评分以及每次修正的说明。也包括尚未纳入面板图表的行。',
      download: '下载 JSON',
      hint: '点击列名进行排序；点击某一行打开该文章的技术卡片，可打印在一张 A4 纸上。',
      search: '在所有列中搜索…',
      loading: '正在加载数据库…',
      error: '无法加载数据库。',
      empty: '没有符合搜索条件的行。',
      count: function (n, total) {
        return n === total ? '共 ' + total + ' 行' : total + ' 行中的 ' + n + ' 行';
      },
      updated: function (data, linhas, colunas) {
        return '更新于 ' + data + ' · ' + linhas + ' 行 · ' + colunas + ' 列';
      },
      fichaKicker: '技术卡片 · 行',
      print: '打印',
      close: '关闭',
      secMat: '材料与强度',
      secCo2: '碳足迹',
      secCp: '试件',
      secDur: '耐久性与使用寿命',
      secQual: '质量（第 4 阶段）',
      secIc: '置信区间',
      secObs: '备注',
      f_material: '材料',
      f_fck: '抗压强度 (MPa)',
      f_classe: '强度等级',
      f_idade: '龄期（天）',
      f_tipo: '试件类型',
      f_fonte: 'PDF 中的出处',
      f_co2: '数值',
      f_co2u: '单位',
      f_co2f: 'PDF 中的出处',
      f_vol: '体积 (m³)',
      f_volf: '体积来源',
      f_volc: '引文',
      f_dur: '摘要',
      f_durf: 'PDF 中的出处',
      f_vida: '使用寿命（年）',
      f_vidaf: 'PDF 中的出处',
      f_e4: '评分',
      f_estr: '层级',
      f_icfck: '强度',
      f_icco2: 'CO₂',
      rodape: 'kielima.com/metanalise/dados · 数据库生成于 ',
      toDark: '深色模式',
      toLight: '浅色模式'
    }
  };

  var el = {
    head: document.getElementById('db-head'),
    body: document.getElementById('db-body'),
    status: document.getElementById('db-status'),
    count: document.getElementById('db-count'),
    search: document.getElementById('db-search'),
    updated: document.getElementById('db-updated'),
    scroll: document.getElementById('db-scroll')
  };

  var banco = null; // { gerado, colunas, linhas }
  var indice = []; // texto normalizado de cada linha, para a pesquisa
  var numerica = []; // por coluna: true se todos os valores preenchidos são números
  var visiveis = []; // índices das linhas que passam no filtro, já ordenados
  var ordem = { col: -1, asc: true };
  var estado = 'loading'; // loading | ready | error
  var strings = COPY.PT;

  function normalizar(s) {
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function textoCelula(v) {
    return v === null || v === undefined ? '' : String(v);
  }

  function comparar(a, b) {
    var va = banco.linhas[a][ordem.col];
    var vb = banco.linhas[b][ordem.col];
    // Vazio vai sempre para o fim, nos dois sentidos.
    var na = va === null || va === '';
    var nb = vb === null || vb === '';
    if (na || nb) return na === nb ? a - b : na ? 1 : -1;
    var r;
    if (typeof va === 'number' && typeof vb === 'number') r = va - vb;
    else r = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
    if (r === 0) return a - b;
    return ordem.asc ? r : -r;
  }

  function filtrar() {
    var q = normalizar(el.search.value.trim());
    visiveis = [];
    for (var i = 0; i < banco.linhas.length; i++) {
      if (!q || indice[i].indexOf(q) !== -1) visiveis.push(i);
    }
    if (ordem.col >= 0) visiveis.sort(comparar);
  }

  function desenharCabecalho() {
    el.head.textContent = '';
    banco.colunas.forEach(function (nome, c) {
      var th = document.createElement('th');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'db-sort';
      btn.textContent = nome;
      if (ordem.col === c) {
        btn.classList.add('is-active');
        th.setAttribute('aria-sort', ordem.asc ? 'ascending' : 'descending');
        var seta = document.createElement('span');
        seta.className = 'db-arrow';
        seta.textContent = ordem.asc ? ' ↑' : ' ↓';
        btn.appendChild(seta);
      }
      btn.addEventListener('click', function () {
        if (ordem.col === c) ordem.asc = !ordem.asc;
        else ordem = { col: c, asc: true };
        visiveis.sort(comparar);
        desenharCabecalho();
        desenharCorpo();
      });
      th.appendChild(btn);
      el.head.appendChild(th);
    });
  }

  function desenharCorpo() {
    el.body.textContent = '';
    var total = banco.linhas.length;
    var n = visiveis.length;

    var frag = document.createDocumentFragment();
    for (var k = 0; k < n; k++) {
      var linha = banco.linhas[visiveis[k]];
      var tr = document.createElement('tr');
      tr.className = 'db-row';
      tr.tabIndex = 0;
      tr.setAttribute('data-i', visiveis[k]);
      for (var c = 0; c < linha.length; c++) {
        var td = document.createElement('td');
        var v = linha[c];
        if (numerica[c]) td.className = 'is-num';
        var div = document.createElement('div');
        div.className = 'db-cell';
        div.textContent = textoCelula(v);
        td.appendChild(div);
        tr.appendChild(td);
      }
      frag.appendChild(tr);
    }
    el.body.appendChild(frag);

    el.status.textContent = n === 0 ? strings.empty : '';
    el.count.textContent = strings.count(n, total);
  }

  function aplicarIdioma() {
    el.search.setAttribute('placeholder', strings.search);
    el.search.setAttribute('aria-label', strings.search);
    if (estado === 'loading') el.status.textContent = strings.loading;
    else if (estado === 'error') el.status.textContent = strings.error;
    if (estado === 'ready') {
      el.updated.textContent = strings.updated(banco.gerado, banco.linhas.length, banco.colunas.length);
      desenharCorpo();
      if (fichaAtual !== -1) montarFicha(fichaAtual);
    } else {
      el.updated.textContent = '';
    }
  }

  var themeCtl = null;
  var i18n = window.KLI18n.init({
    copy: COPY,
    select: document.getElementById('lang-select'),
    onChange: function (lang, s) {
      strings = s;
      aplicarIdioma();
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

  /* ---- Ficha técnica ------------------------------------------------------
     Um clique (ou Enter) numa linha abre a ficha do artigo numa janela
     sobreposta. Imprimir a partir dela sai só a ficha, numa folha A4: antes
     da impressão, a ficha é medida já com a largura útil de uma A4 e, se o
     texto não couber na altura, reduz-se proporcionalmente (zoom). */
  var SECOES = [
    ['secMat', [['material', 'f_material'], ['fck_mpa', 'f_fck'], ['classe_resistencia', 'f_classe'],
      ['idade_dias', 'f_idade'], ['tipo_corpo_prova', 'f_tipo'], ['fonte_no_pdf', 'f_fonte']]],
    ['secCo2', [['co2_valor', 'f_co2'], ['co2_unidade', 'f_co2u'], ['co2_fonte_no_pdf', 'f_co2f']]],
    ['secCp', [['vol_corpo_prova_m3', 'f_vol'], ['vol_corpo_prova_fonte', 'f_volf'], ['vol_corpo_prova_citacao', 'f_volc']]],
    ['secDur', [['durabilidade_resumo', 'f_dur'], ['durabilidade_fonte_no_pdf', 'f_durf'],
      ['vida_util_anos', 'f_vida'], ['vida_util_fonte_no_pdf', 'f_vidaf']]],
    ['secQual', [['e4_qualidade_total', 'f_e4'], ['e4_estrato', 'f_estr']]],
    ['secIc', [['ic_fck', 'f_icfck'], ['ic_co2', 'f_icco2']]],
    ['secObs', [['observacoes', null]]]
  ];
  var MM = 96 / 25.4; // px por mm a 96 dpi
  var modal = document.getElementById('db-modal');
  var ficha = document.getElementById('ficha');
  var fichaCorpo = document.getElementById('ficha-corpo');
  var fichaAtual = -1;
  var focoAntes = null;

  function valor(linha, col) {
    var c = banco.colunas.indexOf(col);
    return c === -1 ? '' : textoCelula(linha[c]).trim();
  }

  // Os campos de intervalo de confiança vêm em quatro colunas cada
  // (valor, tipo, n, citação); na ficha juntam-se numa linha só.
  function valorIc(linha, prefixo) {
    var v = valor(linha, prefixo + '_valor');
    if (!v) return '';
    var tipo = valor(linha, prefixo + '_tipo');
    var n = valor(linha, prefixo + '_n');
    var cit = valor(linha, prefixo + '_citacao');
    return v + (tipo ? ' (' + tipo + ')' : '') + (n ? ' · n = ' + n : '') + (cit ? ' — ' + cit : '');
  }

  function no(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function montarFicha(i) {
    var linha = banco.linhas[i];
    fichaCorpo.textContent = '';

    fichaCorpo.appendChild(no('span', 'kicker', strings.fichaKicker + ' ' + valor(linha, 'row_id')));
    var h = no('h2', 'ficha-titulo', valor(linha, 'titulo') || '—');
    h.id = 'ficha-titulo';
    fichaCorpo.appendChild(h);
    var meta = [valor(linha, 'autores'), valor(linha, 'ano'), valor(linha, 'journal')].filter(Boolean);
    if (meta.length) fichaCorpo.appendChild(no('p', 'ficha-meta', meta.join(' · ')));
    var doi = valor(linha, 'doi');
    if (doi) {
      var pd = no('p', 'ficha-doi');
      var a = no('a', '', 'doi.org/' + doi);
      a.href = 'https://doi.org/' + doi;
      a.target = '_blank';
      a.rel = 'noopener';
      pd.appendChild(a);
      fichaCorpo.appendChild(pd);
    }

    SECOES.forEach(function (sec) {
      var campos = sec[1]
        .map(function (f) {
          var v = f[0].indexOf('ic_') === 0 && f[0].split('_').length === 2 ? valorIc(linha, f[0]) : valor(linha, f[0]);
          return [f[1], v];
        })
        .filter(function (f) {
          return f[1] !== '';
        });
      if (!campos.length) return;
      var bloco = no('section', 'ficha-sec');
      bloco.appendChild(no('h3', '', strings[sec[0]]));
      if (sec[1][0][1] === null) {
        bloco.appendChild(no('p', 'ficha-obs', campos[0][1]));
      } else {
        var dl = no('dl', '');
        campos.forEach(function (f) {
          dl.appendChild(no('dt', '', strings[f[0]]));
          dl.appendChild(no('dd', '', f[1]));
        });
        bloco.appendChild(dl);
      }
      fichaCorpo.appendChild(bloco);
    });

    fichaCorpo.appendChild(no('p', 'ficha-rodape', strings.rodape + banco.gerado));
  }

  function abrirFicha(i) {
    fichaAtual = i;
    focoAntes = document.activeElement;
    montarFicha(i);
    modal.hidden = false;
    document.documentElement.classList.add('ficha-aberta');
    ficha.scrollTop = 0;
    document.getElementById('ficha-fechar').focus();
  }

  function fecharFicha() {
    if (fichaAtual === -1) return;
    fichaAtual = -1;
    modal.hidden = true;
    document.documentElement.classList.remove('ficha-aberta');
    if (focoAntes && focoAntes.focus) focoAntes.focus();
  }

  el.body.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-i]');
    if (tr) abrirFicha(+tr.getAttribute('data-i'));
  });
  el.body.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var tr = e.target.closest('tr[data-i]');
    if (!tr) return;
    e.preventDefault();
    abrirFicha(+tr.getAttribute('data-i'));
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) fecharFicha();
  });
  document.getElementById('ficha-fechar').addEventListener('click', fecharFicha);
  document.getElementById('ficha-imprimir').addEventListener('click', function () {
    window.print();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharFicha();
  });

  // Medir e ajustar a ficha a uma folha A4 (210 × 297 mm, margens de 12 mm).
  window.addEventListener('beforeprint', function () {
    if (fichaAtual === -1) return;
    ficha.style.zoom = '';
    document.documentElement.classList.add('ficha-medir');
    var util = 273 * MM;
    var altura = ficha.scrollHeight;
    if (altura > util) ficha.style.zoom = String(Math.max(0.4, (util / altura) * 0.98));
  });
  window.addEventListener('afterprint', function () {
    document.documentElement.classList.remove('ficha-medir');
    ficha.style.zoom = '';
  });

  var espera = null;
  el.search.addEventListener('input', function () {
    if (estado !== 'ready') return;
    clearTimeout(espera);
    espera = setTimeout(function () {
      filtrar();
      desenharCorpo();
    }, 150);
  });


  fetch('/metanalise/dados/banco.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (dados) {
      banco = dados;
      indice = banco.linhas.map(function (linha) {
        return normalizar(linha.map(textoCelula).join(' \u0001 '));
      });
      numerica = banco.colunas.map(function (_, c) {
        var algum = false;
        for (var i = 0; i < banco.linhas.length; i++) {
          var v = banco.linhas[i][c];
          if (v === null || v === '') continue;
          if (typeof v !== 'number') return false;
          algum = true;
        }
        return algum;
      });
      estado = 'ready';
      filtrar();
      desenharCabecalho();
      aplicarIdioma();
    })
    .catch(function () {
      estado = 'error';
      aplicarIdioma();
    });
})();
