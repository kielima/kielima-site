/* Ibovespa — acionistas e pulverização. Dashboard estático, sem dependências
   externas: os dados vêm de data.json (mesma origem), gerado a partir do
   banco de dados em vault-carreira/04_FINANCEIRO/INVESTIMENTOS/. */

const fmtPct = (v) => (v == null || Number.isNaN(v) ? '—' : `${Number(v).toFixed(2)}%`);
const fmtNum = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR'));

const TABLE_NAMES = ['empresas', 'acionistas', 'pessoas'];
const PIE_CORES = ['pie-1', 'pie-2', 'pie-3', 'pie-4', 'pie-5', 'pie-6'];
const NOMES_RESIDUO = new Set(['Outros', 'Ações Tesouraria']);

const state = {
  data: null,
  sort: {
    empresas: { key: 'peso_ibov_pct', dir: -1 },
    acionistas: { key: 'qtdEmpresas', dir: -1 },
    pessoas: { key: 'qtdEmpresas', dir: -1 },
  },
  filter: { empresas: '', acionistas: '', pessoas: '' },
};

const COLS = {
  empresas: {
    ticker: (r) => r.ticker,
    empresa: (r) => r.empresa,
    setor: (r) => r.setor,
    peso_ibov_pct: (r) => fmtPct(r.peso_ibov_pct),
    free_float_cvm_pct: (r) => fmtPct(r.free_float_cvm_pct),
    pct_acionistas_dispersos: (r) => fmtPct(r.pct_acionistas_dispersos),
  },
};

function numeric(v) {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
  return Number.isFinite(n) ? n : null;
}

function sortRows(rows, key, dir) {
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const an = numeric(av);
    const bn = numeric(bv);
    if (an !== null && bn !== null) return (an - bn) * dir;
    return String(av ?? '').localeCompare(String(bv ?? ''), 'pt-BR') * dir;
  });
}

function filterRows(rows, term) {
  if (!term) return rows;
  const t = term.toLocaleLowerCase('pt-BR');
  return rows.filter((r) =>
    Object.values(r).some((v) => v != null && String(v).toLocaleLowerCase('pt-BR').includes(t))
  );
}

/* ---- Selo de ticker com popover de pizza (usado em toda a página) --------- */

function tickerRef(ticker, extra) {
  const el = document.createElement('span');
  el.className = 'ticker-ref';
  el.textContent = ticker;
  el.dataset.ticker = ticker;
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v != null && v !== '') el.dataset[k] = v;
    }
  }
  return el;
}

/* ---- Tabela de Empresas ---------------------------------------------------- */

function renderTable(name) {
  const rows = filterRows(state.data[name], state.filter[name]);
  const { key, dir } = state.sort[name];
  const sorted = sortRows(rows, key, dir);
  const tbody = document.querySelector(`#table-${name} tbody`);
  const cols = COLS[name];
  const frag = document.createDocumentFragment();
  for (const row of sorted) {
    const tr = document.createElement('tr');
    for (const [col, render] of Object.entries(cols)) {
      const td = document.createElement('td');
      if (col === 'ticker') {
        td.appendChild(tickerRef(row.ticker));
      } else {
        td.textContent = render(row);
      }
      if (col.includes('pct') || col === 'peso_ibov_pct') td.classList.add('num');
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);
  markSortedHeader(name, key);
}

/* ---- Agrupamento genérico: uma linha por entidade, empresas como badges --- */

function agruparPorEntidade(linhas, montarEmpresa) {
  const porNome = new Map();
  for (const l of linhas) {
    const nome = l.nome;
    if (!porNome.has(nome)) porNome.set(nome, { nome, empresas: [] });
    porNome.get(nome).empresas.push(montarEmpresa(l));
  }
  return [...porNome.values()].map((p) => ({ ...p, qtdEmpresas: p.empresas.length }));
}

function filtrarAgrupado(rows, term) {
  if (!term) return rows;
  const t = term.toLocaleLowerCase('pt-BR');
  return rows.filter(
    (r) =>
      r.nome.toLocaleLowerCase('pt-BR').includes(t) ||
      r.empresas.some(
        (e) => e.ticker.toLocaleLowerCase('pt-BR').includes(t) || e.empresa.toLocaleLowerCase('pt-BR').includes(t)
      )
  );
}

function renderAgrupado(name, dadosOrdenadosPorPct) {
  const rows = filtrarAgrupado(state.data[`${name}PorNome`], state.filter[name]);
  const { key, dir } = state.sort[name];
  const sorted = sortRows(rows, key, dir);
  const tbody = document.querySelector(`#table-${name} tbody`);
  const frag = document.createDocumentFragment();

  for (const row of sorted) {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.textContent = row.nome;
    tr.appendChild(tdNome);

    const tdQtd = document.createElement('td');
    tdQtd.className = 'num';
    tdQtd.textContent = fmtNum(row.qtdEmpresas);
    tr.appendChild(tdQtd);

    const tdEmpresas = document.createElement('td');
    tdEmpresas.className = 'empresas-cell';
    const empresasOrdenadas = dadosOrdenadosPorPct
      ? [...row.empresas].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
      : row.empresas;
    for (const e of empresasOrdenadas) {
      tdEmpresas.appendChild(tickerRef(e.ticker, e.badge));
    }
    tr.appendChild(tdEmpresas);

    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);
  markSortedHeader(name, key);
}

/* ---- Pessoas: cadeia societária do FRE, percentual efetivo já calculado --- */

function agruparPessoas(pessoas) {
  return agruparPorEntidade(
    pessoas,
    (p) => ({
      ticker: p.ticker,
      empresa: p.empresa,
      pct: p.percentual_efetivo_na_empresa_pct,
      badge: {
        efetivo: fmtPct(p.percentual_efetivo_na_empresa_pct),
        veiculos: fmtNum(p.num_veiculos_societarios),
        controlador: p.acionista_controlador === 'S' ? 'Sim' : 'Não',
      },
    })
  );
}

/* ---- Acionistas: todo mundo nomeado no item 15.1/2, PF e PJ --------------- */

function normalizarNomeAcionista(nome) {
  let n = nome.trim();
  n = n.replace(/\s*\([^)]*\)\s*$/, ''); // sufixo parentético, ex.: "(Gestor/Administrador - Ver item 6.6)"
  n = n.replace(/^fundos?\s+administrados?\s+pel[ao]s?\s+/i, ''); // "Fundos administrados pela X" -> X
  n = n.toUpperCase().replace(/[.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
  return n;
}

const GRAFIA_INDESEJADA = /\(|^FUNDOS?\s/i;

function agruparAcionistas(acionistas) {
  // O mesmo acionista (ex.: BlackRock) às vezes aparece com grafias diferentes
  // em empresas diferentes (maiúsculas, pontuação) — agrupa por nome
  // normalizado e usa a grafia mais frequente como rótulo de exibição.
  const contagemGrafias = new Map();
  const linhasComNomeNormalizado = [];
  for (const a of acionistas) {
    if (NOMES_RESIDUO.has(a.acionista)) continue;
    const chave = normalizarNomeAcionista(a.acionista);
    if (!contagemGrafias.has(chave)) contagemGrafias.set(chave, new Map());
    const grafias = contagemGrafias.get(chave);
    grafias.set(a.acionista, (grafias.get(a.acionista) || 0) + 1);
    linhasComNomeNormalizado.push({ ...a, nome: chave });
  }
  const grafiaExibicao = new Map();
  for (const [chave, grafias] of contagemGrafias) {
    const candidatas = [...grafias.entries()].sort((x, y) => y[1] - x[1]);
    const limpa = candidatas.find(([nome]) => !GRAFIA_INDESEJADA.test(nome));
    grafiaExibicao.set(chave, (limpa || candidatas[0])[0]);
  }

  const agrupado = agruparPorEntidade(linhasComNomeNormalizado, (a) => ({
    ticker: a.ticker,
    empresa: a.empresa,
    pct: numeric(a.percentual_total_pct),
    badge: {
      pct: fmtPct(a.percentual_total_pct),
      tipo: a.tipo_pessoa === 'PJ' ? 'Pessoa jurídica' : a.tipo_pessoa === 'PF' ? 'Pessoa física' : null,
      controlador: a.acionista_controlador === 'S' ? 'Sim' : a.acionista_controlador === 'N' ? 'Não' : null,
      cargo: a.cargo || null,
    },
  }));

  return agrupado.map((r) => ({ ...r, nome: grafiaExibicao.get(r.nome) }));
}

function markSortedHeader(name, key) {
  for (const th of document.querySelectorAll(`#table-${name} thead th`)) {
    th.classList.toggle('is-sorted', th.dataset.sort === key);
  }
}

function renderTableFor(name) {
  if (name === 'pessoas') renderAgrupado('pessoas', true);
  else if (name === 'acionistas') renderAgrupado('acionistas', true);
  else renderTable(name);
}

function renderKpis() {
  const { empresas, ranking, pessoasPorNome } = state.data;
  document.getElementById('data-captura').textContent = state.data.capturado_em;
  document.getElementById('kpi-empresas').textContent = fmtNum(empresas.length);
  document.getElementById('kpi-pessoas').textContent = fmtNum(pessoasPorNome.length);

  const maisPulverizada = ranking[0];
  const maisConcentrada = ranking[ranking.length - 1];
  document.getElementById('kpi-mais-pulverizada').textContent =
    `${maisPulverizada.tickers} (${fmtPct(maisPulverizada.pct_acionistas_dispersos)})`;
  document.getElementById('kpi-mais-concentrada').textContent =
    `${maisConcentrada.tickers} (${fmtPct(maisConcentrada.pct_acionistas_dispersos)})`;
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      for (const t of tabs) {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      }
      for (const panel of document.querySelectorAll('.panel')) {
        panel.classList.toggle('is-active', panel.id === `panel-${tab.dataset.tab}`);
      }
    });
  }
}

function setupSort() {
  for (const name of TABLE_NAMES) {
    for (const th of document.querySelectorAll(`#table-${name} thead th[data-sort]`)) {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        const current = state.sort[name];
        state.sort[name] = { key, dir: current.key === key ? -current.dir : -1 };
        renderTableFor(name);
      });
    }
  }
}

function setupSearch() {
  for (const input of document.querySelectorAll('.search')) {
    input.addEventListener('input', () => {
      const name = input.dataset.table;
      state.filter[name] = input.value.trim();
      renderTableFor(name);
    });
  }
}

/* ---- Popover de pizza dos acionistas (delegado, cobre a página inteira) --- */

function agruparAcionistasPorTicker(acionistas) {
  const porTicker = new Map();
  for (const a of acionistas) {
    if (!porTicker.has(a.ticker)) porTicker.set(a.ticker, []);
    porTicker.get(a.ticker).push(a);
  }
  for (const rows of porTicker.values()) rows.sort((a, b) => b.percentual_total_pct - a.percentual_total_pct);
  return porTicker;
}

function corDaFatia(nomeAcionista, indiceCorVerde) {
  if (NOMES_RESIDUO.has(nomeAcionista)) return 'var(--pie-outros)';
  return `var(--${PIE_CORES[indiceCorVerde % PIE_CORES.length]})`;
}

const LEGENDA_MAX_LINHAS = 8;

function montarPizza(linhas) {
  let acumulado = 0;
  let indiceCor = 0;
  const fatias = [];
  const legenda = [];
  let restantePct = 0;
  let restanteQtd = 0;

  linhas.forEach((l, i) => {
    const pct = numeric(l.percentual_total_pct) ?? 0;
    const cor = corDaFatia(l.acionista, indiceCor);
    if (!NOMES_RESIDUO.has(l.acionista)) indiceCor++;
    fatias.push(`${cor} ${acumulado}% ${acumulado + pct}%`);
    acumulado += pct;

    if (i < LEGENDA_MAX_LINHAS) {
      legenda.push(
        `<li><span class="pie-swatch" style="background:${cor}"></span>` +
          `<span class="pie-legend-nome">${l.acionista}</span>` +
          `<span class="pie-legend-pct">${fmtPct(pct)}</span></li>`
      );
    } else {
      restantePct += pct;
      restanteQtd++;
    }
  });

  if (restanteQtd > 0) {
    legenda.push(
      `<li><span class="pie-swatch" style="background:var(--pie-outros)"></span>` +
        `<span class="pie-legend-nome">+ ${restanteQtd} outro(s) nome(s)</span>` +
        `<span class="pie-legend-pct">${fmtPct(restantePct)}</span></li>`
    );
  }

  return { gradiente: fatias.join(', '), legendaHtml: legenda.join('') };
}

function linhaInfoBadge(dataset) {
  const partes = [];
  if (dataset.efetivo) partes.push(`% efetivo aqui: <strong>${dataset.efetivo}</strong>`);
  if (dataset.pct) partes.push(`Participação aqui: <strong>${dataset.pct}</strong>`);
  if (dataset.veiculos) partes.push(`${dataset.veiculos} veículo(s) societário(s)`);
  if (dataset.tipo) partes.push(dataset.tipo);
  if (dataset.cargo) partes.push(`Cargo: ${dataset.cargo}`);
  if (dataset.controlador) partes.push(`Controlador(a): ${dataset.controlador}`);
  return partes.length ? `<p class="pie-info-pessoa">${partes.join(' · ')}</p>` : '';
}

function criarPopover() {
  const el = document.createElement('div');
  el.className = 'pie-popover';
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}

function setupPiePopover() {
  const popover = criarPopover();

  function esconder() {
    popover.hidden = true;
  }

  function mostrar(alvo) {
    const ticker = alvo.dataset.ticker;
    const linhas = state.data.acionistasPorTicker.get(ticker);
    if (!linhas) return;
    const empresa = (state.data.empresas.find((e) => e.ticker === ticker) || {}).empresa || ticker;
    const { gradiente, legendaHtml } = montarPizza(linhas);

    popover.innerHTML =
      `<p class="pie-empresa">${ticker} — ${empresa}</p>` +
      linhaInfoBadge(alvo.dataset) +
      `<div class="pie-body">` +
      `<div class="pie-circle" style="background: conic-gradient(${gradiente})"></div>` +
      `<ul class="pie-legend">${legendaHtml}</ul>` +
      `</div>`;

    popover.hidden = false;
    const rect = alvo.getBoundingClientRect();
    const largura = popover.offsetWidth;
    const altura = popover.offsetHeight;
    let x = rect.left;
    let y = rect.bottom + 8;
    if (x + largura > window.innerWidth - 12) x = window.innerWidth - largura - 12;
    if (y + altura > window.innerHeight - 12) y = rect.top - altura - 8;
    popover.style.left = `${Math.max(12, x)}px`;
    popover.style.top = `${Math.max(12, y)}px`;
  }

  document.addEventListener('mouseover', (e) => {
    const alvo = e.target.closest('.ticker-ref');
    if (alvo) mostrar(alvo);
  });
  document.addEventListener('mouseout', (e) => {
    const alvo = e.target.closest('.ticker-ref');
    if (alvo && !alvo.contains(e.relatedTarget)) esconder();
  });
  document.addEventListener('scroll', esconder, true);
}

async function main() {
  const res = await fetch('./data.json');
  state.data = await res.json();

  // Pulverização deixou de ser uma aba própria: a % de cada empresa entra
  // como coluna na aba Empresas, usando o mesmo dado (ranking) de antes.
  const pctDispersosPorTicker = new Map();
  for (const r of state.data.ranking) {
    for (const t of r.tickers.split(', ')) pctDispersosPorTicker.set(t, r.pct_acionistas_dispersos);
  }
  for (const e of state.data.empresas) e.pct_acionistas_dispersos = pctDispersosPorTicker.get(e.ticker) ?? null;

  state.data.pessoasPorNome = agruparPessoas(state.data.pessoas);
  state.data.acionistasPorNome = agruparAcionistas(state.data.acionistas);
  state.data.acionistasPorTicker = agruparAcionistasPorTicker(state.data.acionistas);

  renderKpis();
  for (const name of TABLE_NAMES) renderTableFor(name);

  setupTabs();
  setupSort();
  setupSearch();
  setupPiePopover();
}

main();
