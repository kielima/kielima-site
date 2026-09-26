/* Banco de dados da metanálise — kielima.com/metanalise/dados
   Mostra a aba dados_fck do meta_analysis_base.xlsx inteira (todas as linhas,
   todas as colunas), a partir de /metanalise/dados/banco.json, gerado pelo
   metanalise-export-banco.py do repositório da revisão sistemática.

   Sem biblioteca externa: pesquisa em todas as colunas, ordenação por coluna,
   paginação e expansão de linha, em JS puro. Os nomes das colunas não se
   traduzem — são os cabeçalhos da planilha, citados assim nas notas e no
   protocolo da extração. */
(function () {
  'use strict';

  var POR_PAGINA = 50;

  var COPY = {
    PT: {
      navBack: '← Metanálise',
      kicker: 'PESQUISA · BANCO DE DADOS',
      title: 'Banco de dados da metanálise',
      lead: 'Todas as linhas e colunas da extração, tal como estão na planilha de trabalho: resistência à compressão, pegada de carbono, volume do corpo de prova, qualidade e as notas de cada correção. Inclui as linhas que ainda não entram nos gráficos do painel.',
      prev: '← Anterior',
      next: 'Seguinte →',
      download: 'Baixar JSON',
      hint: 'Clique no nome de uma coluna para ordenar; clique numa linha para ver o texto completo das células.',
      search: 'Pesquisar em todas as colunas…',
      loading: 'A carregar o banco de dados…',
      error: 'Não foi possível carregar o banco de dados.',
      empty: 'Nenhuma linha corresponde à pesquisa.',
      count: function (a, b, n, total) {
        return n === total
          ? 'Linhas ' + a + '–' + b + ' de ' + total
          : 'Linhas ' + a + '–' + b + ' de ' + n + ' (filtradas de ' + total + ')';
      },
      updated: function (data, linhas, colunas) {
        return 'Atualizado em ' + data + ' · ' + linhas + ' linhas · ' + colunas + ' colunas';
      },
      toDark: 'Modo escuro',
      toLight: 'Modo claro'
    },
    EN: {
      navBack: '← Meta-analysis',
      kicker: 'RESEARCH · DATABASE',
      title: 'Meta-analysis database',
      lead: 'Every row and column of the extraction, exactly as in the working spreadsheet: compressive strength, carbon footprint, specimen volume, quality score and the notes on every correction. Includes rows that are not yet in the dashboard charts.',
      prev: '← Previous',
      next: 'Next →',
      download: 'Download JSON',
      hint: 'Click a column name to sort; click a row to see the full text of its cells.',
      search: 'Search all columns…',
      loading: 'Loading the database…',
      error: 'The database could not be loaded.',
      empty: 'No rows match the search.',
      count: function (a, b, n, total) {
        return n === total
          ? 'Rows ' + a + '–' + b + ' of ' + total
          : 'Rows ' + a + '–' + b + ' of ' + n + ' (filtered from ' + total + ')';
      },
      updated: function (data, linhas, colunas) {
        return 'Updated ' + data + ' · ' + linhas + ' rows · ' + colunas + ' columns';
      },
      toDark: 'Dark mode',
      toLight: 'Light mode'
    },
    ZH: {
      navBack: '← 荟萃分析',
      kicker: '研究 · 数据库',
      title: '荟萃分析数据库',
      lead: '数据提取的全部行和列，与工作表中完全一致：抗压强度、碳足迹、试件体积、质量评分以及每次修正的说明。也包括尚未纳入面板图表的行。',
      prev: '← 上一页',
      next: '下一页 →',
      download: '下载 JSON',
      hint: '点击列名进行排序；点击某一行查看单元格的完整文本。',
      search: '在所有列中搜索…',
      loading: '正在加载数据库…',
      error: '无法加载数据库。',
      empty: '没有符合搜索条件的行。',
      count: function (a, b, n, total) {
        return n === total
          ? '第 ' + a + '–' + b + ' 行，共 ' + total + ' 行'
          : '第 ' + a + '–' + b + ' 行，共 ' + n + ' 行（从 ' + total + ' 行中筛选）';
      },
      updated: function (data, linhas, colunas) {
        return '更新于 ' + data + ' · ' + linhas + ' 行 · ' + colunas + ' 列';
      },
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
    prev: document.getElementById('db-prev'),
    next: document.getElementById('db-next'),
    updated: document.getElementById('db-updated'),
    scroll: document.getElementById('db-scroll')
  };

  var banco = null; // { gerado, colunas, linhas }
  var indice = []; // texto normalizado de cada linha, para a pesquisa
  var numerica = []; // por coluna: true se todos os valores preenchidos são números
  var visiveis = []; // índices das linhas que passam no filtro, já ordenados
  var pagina = 0;
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
    pagina = 0;
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
        pagina = 0;
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
    var ultima = Math.max(0, Math.ceil(n / POR_PAGINA) - 1);
    if (pagina > ultima) pagina = ultima;
    var ini = pagina * POR_PAGINA;
    var fim = Math.min(n, ini + POR_PAGINA);

    var frag = document.createDocumentFragment();
    for (var k = ini; k < fim; k++) {
      var linha = banco.linhas[visiveis[k]];
      var tr = document.createElement('tr');
      tr.className = 'db-row';
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
      tr.addEventListener('click', function () {
        this.classList.toggle('is-open');
      });
      frag.appendChild(tr);
    }
    el.body.appendChild(frag);

    el.status.textContent = n === 0 ? strings.empty : '';
    el.count.textContent = n === 0 ? '' : strings.count(ini + 1, fim, n, total);
    el.prev.disabled = pagina === 0;
    el.next.disabled = pagina >= ultima;
  }

  function aplicarIdioma() {
    el.search.setAttribute('placeholder', strings.search);
    el.search.setAttribute('aria-label', strings.search);
    if (estado === 'loading') el.status.textContent = strings.loading;
    else if (estado === 'error') el.status.textContent = strings.error;
    if (estado === 'ready') {
      el.updated.textContent = strings.updated(banco.gerado, banco.linhas.length, banco.colunas.length);
      desenharCorpo();
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

  var espera = null;
  el.search.addEventListener('input', function () {
    if (estado !== 'ready') return;
    clearTimeout(espera);
    espera = setTimeout(function () {
      filtrar();
      desenharCorpo();
    }, 150);
  });

  function mudarPagina(delta) {
    pagina += delta;
    desenharCorpo();
    el.scroll.scrollTop = 0;
  }
  el.prev.addEventListener('click', function () {
    mudarPagina(-1);
  });
  el.next.addEventListener('click', function () {
    mudarPagina(1);
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
