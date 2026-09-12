/* Ibovespa — acionistas e pulverização. Dashboard estático, sem dependências
   externas: os dados vêm de data.json (mesma origem), gerado a partir do
   banco de dados em vault-carreira/04_FINANCEIRO/INVESTIMENTOS/. */

const fmtPct = (v) => (v == null || Number.isNaN(v) ? '—' : `${Number(v).toFixed(2)}%`);
const fmtNum = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR'));

const TABLE_NAMES = ['empresas', 'acionistas', 'pessoas'];

const state = {
  data: null,
  sort: {
    empresas: { key: 'peso_ibov_pct', dir: -1 },
    acionistas: { key: 'percentual_total_pct', dir: -1 },
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
  },
  acionistas: {
    empresa: (r) => r.empresa,
    ticker: (r) => r.ticker,
    acionista: (r) => r.acionista,
    tipo_pessoa: (r) => r.tipo_pessoa || '—',
    percentual_total_pct: (r) => fmtPct(r.percentual_total_pct),
    acionista_controlador: (r) => (r.acionista_controlador === 'S' ? 'Sim' : 'Não'),
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

/* ---- Tabelas planas (Empresas, Acionistas) -------------------------------- */

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
      td.textContent = render(row);
      if (col.includes('pct') || col.includes('num_') || col === 'peso_ibov_pct') td.classList.add('num');
      tr.appendChild(td);
    }
    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);
  markSortedHeader(name, key);
}

/* ---- Pessoas: uma linha por pessoa, empresas como badges com tooltip ------ */

function agruparPessoasPorNome(pessoas) {
  const porNome = new Map();
  for (const p of pessoas) {
    if (!porNome.has(p.nome)) porNome.set(p.nome, { nome: p.nome, empresas: [] });
    porNome.get(p.nome).empresas.push({
      ticker: p.ticker,
      empresa: p.empresa,
      pct: p.percentual_efetivo_na_empresa_pct,
      veiculos: p.num_veiculos_societarios,
      controlador: p.acionista_controlador === 'S',
    });
  }
  return [...porNome.values()].map((p) => ({
    ...p,
    qtdEmpresas: p.empresas.length,
    maiorPct: Math.max(...p.empresas.map((e) => e.pct ?? 0)),
  }));
}

function filtrarPessoas(rows, term) {
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

function renderPessoas() {
  const rows = filtrarPessoas(state.data.pessoasPorNome, state.filter.pessoas);
  const { key, dir } = state.sort.pessoas;
  const sorted = sortRows(rows, key, dir);
  const tbody = document.querySelector('#table-pessoas tbody');
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
    const empresasOrdenadas = [...row.empresas].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
    for (const e of empresasOrdenadas) {
      const badge = document.createElement('span');
      badge.className = 'ticker-badge';
      badge.textContent = e.ticker;
      badge.title =
        `${e.empresa}\n` +
        `% efetivo: ${fmtPct(e.pct)}\n` +
        `Veículos societários: ${fmtNum(e.veiculos)}\n` +
        `Controlador: ${e.controlador ? 'Sim' : 'Não'}`;
      tdEmpresas.appendChild(badge);
    }
    tr.appendChild(tdEmpresas);

    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);
  markSortedHeader('pessoas', key);
}

function markSortedHeader(name, key) {
  for (const th of document.querySelectorAll(`#table-${name} thead th`)) {
    th.classList.toggle('is-sorted', th.dataset.sort === key);
  }
}

function renderTableFor(name) {
  if (name === 'pessoas') renderPessoas();
  else renderTable(name);
}

function renderChart() {
  const container = document.getElementById('chart-ranking');
  const rows = state.data.ranking;
  const max = Math.max(...rows.map((r) => r.pct_acionistas_dispersos));
  const frag = document.createDocumentFragment();
  for (const r of rows) {
    const row = document.createElement('div');
    row.className = 'chart-row';

    const label = document.createElement('span');
    label.className = 'chart-label';
    label.title = r.empresa;
    label.textContent = `${r.tickers} — ${r.empresa}`;

    const track = document.createElement('div');
    track.className = 'chart-track';
    const fill = document.createElement('div');
    fill.className = 'chart-fill';
    fill.style.width = `${(r.pct_acionistas_dispersos / max) * 100}%`;
    track.appendChild(fill);

    const value = document.createElement('span');
    value.className = 'chart-value';
    value.textContent = fmtPct(r.pct_acionistas_dispersos);

    row.append(label, track, value);
    frag.appendChild(row);
  }
  container.replaceChildren(frag);
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

async function main() {
  const res = await fetch('./data.json');
  state.data = await res.json();
  state.data.pessoasPorNome = agruparPessoasPorNome(state.data.pessoas);

  renderKpis();
  renderChart();
  for (const name of TABLE_NAMES) renderTableFor(name);

  setupTabs();
  setupSort();
  setupSearch();
}

main();
