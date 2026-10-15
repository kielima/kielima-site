/* Ibovespa — acionistas e pulverização. Dashboard estático, sem dependências
   externas: os dados vêm de data.json (mesma origem), gerado a partir do
   banco de dados em vault-carreira/04_FINANCEIRO/INVESTIMENTOS/. */

const fmtPct = (v) => (v == null || Number.isNaN(v) ? '—' : `${Number(v).toFixed(2)}%`);
const fmtNum = (v) => (v == null ? '—' : Number(v).toLocaleString('pt-BR'));

// Valores em R$ no recorte vão de milhões a bilhões — compacta pra caber na
// tabela. Fonte do valor de mercado: ver rodapé "Metodologia e limitações".
function fmtMoeda(v) {
  if (v == null || Number.isNaN(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e9) return `R$ ${(v / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bi`;
  if (abs >= 1e6) return `R$ ${(v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  if (abs >= 1e3) return `R$ ${(v / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
  return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

const TABLE_NAMES = ['empresas', 'acionistas', 'pessoas', 'familias'];
const PIE_CORES = ['pie-1', 'pie-2', 'pie-3', 'pie-4', 'pie-5', 'pie-6'];
const NOMES_RESIDUO = new Set(['Outros', 'Ações Tesouraria']);

const state = {
  data: null,
  sort: {
    empresas: { key: 'peso_ibov_pct', dir: -1 },
    acionistas: { key: 'pctIndice', dir: -1 },
    pessoas: { key: 'qtdEmpresas', dir: -1 },
    familias: { key: 'pctIndice', dir: -1 },
  },
  filter: { empresas: '', acionistas: '', pessoas: '', familias: '' },
};

const COLS = {
  empresas: {
    ticker: (r) => r.ticker,
    empresa: (r) => r.empresa,
    setor: (r) => r.setor,
    peso_ibov_pct: (r) => fmtPct(r.peso_ibov_pct),
    free_float_cvm_pct: (r) => fmtPct(r.free_float_cvm_pct),
    pct_acionistas_dispersos: (r) => fmtPct(r.pct_acionistas_dispersos),
    valor_mercado_rs: (r) => fmtMoeda(r.valor_mercado_rs),
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

// Badge de acionista-pai numa célula de Empresas (usado pelos "acionistas de
// acionistas" — não têm ação de nenhuma empresa do Ibovespa diretamente, o
// vínculo deles é com o acionista-pai). Visual igual ao ticker-ref; o hover
// mostra o mesmo popover de quem hover no nome do acionista-pai.
function entidadeBadge(nome, chave, extra) {
  const el = document.createElement('span');
  el.className = 'ticker-ref';
  el.textContent = nome;
  el.dataset.entidade = chave;
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
      if (col.includes('pct') || col === 'peso_ibov_pct' || col === 'valor_mercado_rs') td.classList.add('num');
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
      r.empresas.some((e) =>
        [e.ticker, e.empresa, e.nome].some((v) => v && v.toLocaleLowerCase('pt-BR').includes(t))
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
    const estrutura = name === 'acionistas' && state.data.estruturaAcionistas
      ? state.data.estruturaAcionistas[row.chaveNormalizada]
      : null;
    if (estrutura) {
      const span = document.createElement('span');
      span.className = 'entidade-ref';
      span.textContent = row.nome;
      span.dataset.entidade = row.chaveNormalizada;
      tdNome.appendChild(span);
    } else {
      tdNome.textContent = row.nome;
    }
    tr.appendChild(tdNome);

    const tdQtd = document.createElement('td');
    tdQtd.className = 'num';
    tdQtd.textContent = fmtNum(row.qtdEmpresas);
    tr.appendChild(tdQtd);

    if (name === 'acionistas') {
      const tdIndice = document.createElement('td');
      tdIndice.className = 'num';
      tdIndice.textContent = fmtPct(row.pctIndice);
      tr.appendChild(tdIndice);
    }

    const tdPatrimonio = document.createElement('td');
    tdPatrimonio.className = 'num';
    tdPatrimonio.textContent = fmtMoeda(row.patrimonioRs);
    tr.appendChild(tdPatrimonio);

    const tdEmpresas = document.createElement('td');
    tdEmpresas.className = 'empresas-cell';
    const empresasOrdenadas = dadosOrdenadosPorPct
      ? [...row.empresas].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
      : row.empresas;
    for (const e of empresasOrdenadas) {
      tdEmpresas.appendChild(e.tipo === 'entidade' ? entidadeBadge(e.nome, e.chave, e.badge) : tickerRef(e.ticker, e.badge));
    }
    tr.appendChild(tdEmpresas);

    frag.appendChild(tr);
  }
  tbody.replaceChildren(frag);
  markSortedHeader(name, key);
}

/* ---- Pessoas: cadeia societária do FRE, percentual efetivo já calculado --- */

function agruparPessoas(pessoas) {
  const agrupado = agruparPorEntidade(
    pessoas,
    (p) => ({
      ticker: p.ticker,
      empresa: p.empresa,
      pct: p.percentual_efetivo_na_empresa_pct,
      patrimonioRs: p.patrimonio_rs,
      badge: {
        efetivo: fmtPct(p.percentual_efetivo_na_empresa_pct),
        veiculos: fmtNum(p.num_veiculos_societarios),
        controlador: p.acionista_controlador === 'S' ? 'Sim' : 'Não',
        patrimonio: p.patrimonio_rs != null ? fmtMoeda(p.patrimonio_rs) : null,
      },
    })
  );
  return agrupado.map((r) => ({
    ...r,
    patrimonioRs: r.empresas.reduce((soma, e) => soma + (e.patrimonioRs ?? 0), 0),
  }));
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

function agruparAcionistas(acionistas, pesoPorTicker) {
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
    patrimonioRs: a.patrimonio_rs,
    badge: {
      pct: fmtPct(a.percentual_total_pct),
      tipo: a.tipo_pessoa === 'PJ' ? 'Pessoa jurídica' : a.tipo_pessoa === 'PF' ? 'Pessoa física' : null,
      controlador: a.acionista_controlador === 'S' ? 'Sim' : a.acionista_controlador === 'N' ? 'Não' : null,
      cargo: a.cargo || null,
      patrimonio: a.patrimonio_rs != null ? fmtMoeda(a.patrimonio_rs) : null,
    },
  }));

  return agrupado.map((r) => {
    // % do Ibovespa: para cada empresa onde a entidade aparece, pondera a %
    // que ela tem lá pelo peso daquela empresa no índice, e soma tudo — é a
    // fatia do índice inteiro atribuível a essa entidade, na proporção dos pesos.
    let pctIndice = 0;
    let patrimonioRs = 0;
    for (const e of r.empresas) {
      const peso = pesoPorTicker.get(e.ticker);
      if (e.pct != null && peso != null) pctIndice += (e.pct * peso) / 100;
      if (e.patrimonioRs != null) patrimonioRs += e.patrimonioRs;
    }
    return { ...r, chaveNormalizada: r.nome, nome: grafiaExibicao.get(r.nome), pctIndice, patrimonioRs };
  });
}

/* ---- Acionistas de acionistas: quem tem participação pesquisada dentro de --
   um acionista curado (estrutura-acionistas.json) vira linha própria. Some
   quando o mesmo sub-acionista aparece sob mais de um acionista-pai; pula
   quando o sub-acionista já é ele mesmo um acionista com linha própria (dado
   real da CVM) — nesse caso a linha existente já responde por ele. Itens
   marcados como "familia" não viram linha na aba Acionistas — viram linha
   na aba Famílias, expansível para mostrar os integrantes nomeados. ------- */

function construirSubEntidades(acionistasPorNome, estrutura) {
  if (!estrutura) return { acionistas: [], familias: [] };
  const chavesExistentes = new Set(acionistasPorNome.map((r) => r.chaveNormalizada));
  const porChaveAcionista = new Map();
  const porChaveFamilia = new Map();

  for (const pai of acionistasPorNome) {
    const info = estrutura[pai.chaveNormalizada];
    if (!info || !info.pizza) continue;
    for (const item of info.pizza) {
      if (RESIDUO_GENERICO.test(item.nome)) continue;
      const chave = normalizarNomeAcionista(item.nome);
      if (chavesExistentes.has(chave)) continue;
      const pctAqui = numeric(item.pct) ?? 0;
      const linkPai = {
        tipo: 'entidade',
        chave: pai.chaveNormalizada,
        nome: pai.nome,
        pct: pctAqui,
        badge: {
          pct: fmtPct(pctAqui),
          patrimonio: pai.patrimonioRs != null ? fmtMoeda((pctAqui * pai.patrimonioRs) / 100) : null,
        },
      };

      if (item.familia) {
        if (!porChaveFamilia.has(chave)) {
          porChaveFamilia.set(chave, {
            nome: item.nome,
            chaveNormalizada: chave,
            fonte: 'pesquisa_aberta',
            empresas: [],
            resumo: item.familia.resumo || '',
            membros: item.familia.membros || [],
            fontes: item.familia.fontes || [],
          });
        }
        porChaveFamilia.get(chave).empresas.push(linkPai);
      } else {
        if (!porChaveAcionista.has(chave)) porChaveAcionista.set(chave, { nome: item.nome, chaveNormalizada: chave, empresas: [] });
        porChaveAcionista.get(chave).empresas.push(linkPai);
      }
    }
  }

  function finalizar(mapa) {
    return [...mapa.values()].map((r) => ({
      ...r,
      qtdEmpresas: r.empresas.length,
      pctIndice: r.empresas.reduce((soma, e) => {
        const pai = acionistasPorNome.find((p) => p.chaveNormalizada === e.chave);
        return soma + (pai ? (e.pct * pai.pctIndice) / 100 : 0);
      }, 0),
      patrimonioRs: r.empresas.reduce((soma, e) => {
        const pai = acionistasPorNome.find((p) => p.chaveNormalizada === e.chave);
        return soma + (pai && pai.patrimonioRs != null ? (e.pct * pai.patrimonioRs) / 100 : 0);
      }, 0),
    }));
  }

  return { acionistas: finalizar(porChaveAcionista), familias: finalizar(porChaveFamilia) };
}

/* ---- Famílias reais: detectadas automaticamente por sobrenome na própria --
   aba Pessoas (dado direto da CVM/FRE — não pesquisa aberta). O mesmo
   sobrenome (última palavra do nome, descontando sufixos geracionais) em
   2+ pessoas distintas vira uma família; sobrenomes genéricos demais pra
   confiar na coincidência (Silva, Santos, Oliveira…) só entram via um
   trecho mais específico (as 3 últimas palavras). Confirmado por amostragem
   via pesquisa aberta em 2026-10-15 — um falso positivo encontrado (ver
   SOBRENOMES_EXCLUIDOS) e descartado. ------------------------------------ */

const SUFIXOS_GERACIONAIS = new Set(['FILHO', 'JUNIOR', 'JÚNIOR', 'NETO', 'SOBRINHO', 'II', 'III', 'IV']);
const SOBRENOMES_GENERICOS = new Set([
  'SILVA', 'SANTOS', 'OLIVEIRA', 'SOUZA', 'SOUSA', 'RODRIGUES', 'FERREIRA', 'ALVES', 'PEREIRA',
  'LIMA', 'GOMES', 'COSTA', 'RIBEIRO', 'MARTINS', 'CARVALHO', 'ALMEIDA', 'LOPES', 'SOARES',
  'FERNANDES', 'VIEIRA', 'BARBOSA', 'ROCHA', 'DIAS', 'NASCIMENTO', 'ANDRADE', 'MOREIRA', 'NUNES',
  'MARQUES', 'MACHADO', 'MENDES', 'FREITAS', 'BARROS', 'PINTO', 'MOURA', 'CAVALCANTI', 'PINHEIRO',
  'CARDOSO', 'CORREIA', 'CORREA', 'TEIXEIRA', 'MELO', 'MELLO', 'MONTEIRO', 'NOGUEIRA', 'AZEVEDO',
  'REIS', 'ARAUJO', 'ARAÚJO', 'CASTRO', 'CAMPOS', 'CUNHA', 'FONSECA', 'RAMOS', 'GONÇALVES',
  'BATISTA', 'GARCIA', 'PEREZ', 'DUARTE', 'SANTANA', 'MATTOS', 'PASSOS',
]);
// "Porto": pesquisa confirmou que são duas pessoas sem nenhum parentesco
// (Antonio Carlos Canto Porto Filho, sócio do BTG Pactual, e Luis Fernando
// Memória Porto, cofundador da Localiza) — coincidência de sobrenome, não família.
const SOBRENOMES_EXCLUIDOS = new Set(['PORTO']);
const PREPOSICOES_SOBRENOME = new Set(['DE', 'DA', 'DO', 'DOS', 'DAS', 'E']);

// Famílias com fonte externa que confirma a relação (pesquisa feita em
// 2026-10-15) — as demais entram só com a ressalva do agrupamento automático.
const FONTES_FAMILIAS_REAIS = {
  'SETUBAL': [{ titulo: 'Acordo de Acionistas da IUPAR (Itaú)', url: 'https://www.itau.com.br/download-file/v2/d/42787847-4cf6-4461-94a5-40ed237dca33/3b3d1813-0316-47e2-9887-2415532d142d?origin=1' }],
  'VILLELA': [{ titulo: 'Acordo de Acionistas da IUPAR (Itaú)', url: 'https://www.itau.com.br/download-file/v2/d/42787847-4cf6-4461-94a5-40ed237dca33/3b3d1813-0316-47e2-9887-2415532d142d?origin=1' }],
  'MARINO': [{ titulo: 'Acordo de Acionistas da IUPAR (Itaú)', url: 'https://www.itau.com.br/download-file/v2/d/42787847-4cf6-4461-94a5-40ed237dca33/3b3d1813-0316-47e2-9887-2415532d142d?origin=1' }],
  'SALLES': [{ titulo: 'Acordo de Acionistas da IUPAR (Itaú)', url: 'https://www.itau.com.br/download-file/v2/d/42787847-4cf6-4461-94a5-40ed237dca33/3b3d1813-0316-47e2-9887-2415532d142d?origin=1' }],
  'MORAES': [{ titulo: 'Forbes — Lista de Bilionários Brasileiros (Votorantim/Ermírio de Moraes)', url: 'https://forbes.com.br/listas/bilionarios-brasileiros-2025/pg/4/' }],
  'KLABIN': [{ titulo: 'Exame — Klabin propõe retrocesso em governança', url: 'https://exame.com/insight/klabin-propoe-retrocesso-em-governanca-mas-bndes-pode-reduzir-problema/p' }],
  'GALVÃO': [{ titulo: 'Forbes — Lista de Bilionários Brasileiros (família Galvão, Klabin/Raia Drogasil)', url: 'https://forbes.com.br/listas/bilionarios-brasileiros-2025/pg/8/' }],
  'JOHANNPETER': [{ titulo: 'Forbes — Lista de Bilionários Brasileiros (família Johannpeter/Gerdau)', url: 'https://forbes.com.br/listas/bilionarios-brasileiros-2021/' }],
  'FEFFER': [{ titulo: 'Forbes — Lista de Bilionários Brasileiros (família Feffer/Suzano)', url: 'https://forbes.com.br/listas/bilionarios-brasileiros-2025/pg/9/' }],
  'GUPER': [{ titulo: 'Forbes — Lista de Bilionários Brasileiros (Janet Guper, neta de Leon Feffer/Suzano)', url: 'https://forbes.com.br/listas/bilionarios-brasileiros-2025/pg/9/' }],
  'QUEIROZ': [{ titulo: 'Exame — No agronegócio, chegou a vez do Minerva Foods (família Queiroz)', url: 'https://exame.com/revista-exame/chegou-a-vez-dele/' }],
  'PIPPONZI': [{ titulo: 'Suno — Antônio Carlos Pipponzi (RD Saúde/RaiaDrogasil)', url: 'https://www.suno.com.br/tudo-sobre/antonio-carlos-pipponzi/' }],
  'MOLL': [{ titulo: 'Seu Dinheiro — Jorge Neval Moll Filho, fundador da Rede D\'Or', url: 'https://www.seudinheiro.com/2019/candido-pinheiro/candido-pinheiro-bilionario-brasileiro/' }],
  'KOREN DE LIMA': [{ titulo: 'Seu Dinheiro — Candido Pinheiro Koren de Lima, fundador da Hapvida', url: 'https://www.seudinheiro.com/2019/candido-pinheiro/candido-pinheiro-bilionario-brasileiro/' }],
  'BIRMAN': [{ titulo: 'InfoMoney — Arezzo vira Azzas 2154 (bloco de controle de Alexandre Birman)', url: 'https://www.infomoney.com.br/business/arezzo-vai-se-chamar-azzas-2154-apos-fusao-com-grupo-soma/' }],
  'STEINBRUCH': [{ titulo: 'Forbes — Lista de Bilionários Brasileiros (família Steinbruch/CSN)', url: 'https://forbes.com.br/listas/bilionarios-brasileiros-2025/' }],
  'HORN': [{ titulo: 'InfoMoney — Elie Horn, fundador da Cyrela', url: 'https://www.infomoney.com.br/perfil/elie-horn/' }],
  'LEMANN': [{ titulo: 'Wikipedia — Jorge Paulo Lemann (3G Capital/Ambev)', url: 'https://en.wikipedia.org/wiki/Jorge_Paulo_Lemann' }],
  'JEREISSATI': [{ titulo: 'Forbes — Lista de Bilionários Brasileiros (família Jereissati/Iguatemi)', url: 'https://forbes.com.br/listas/bilionarios-brasileiros-2025/' }],
  'VOIGT': [{ titulo: 'ND Mais — Fábrica de bilionários: quem é quem na família Voigt (WEG)', url: 'https://ndmais.com.br/cidadania/fabrica-de-bilionarios-quem-e-quem-na-familia-voigt-dona-da-multinacional-catarinense-weg/' }],
  'TREJES': [{ titulo: 'ND Mais — Fábrica de bilionários: quem é quem na família Voigt (WEG)', url: 'https://ndmais.com.br/cidadania/fabrica-de-bilionarios-quem-e-quem-na-familia-voigt-dona-da-multinacional-catarinense-weg/' }],
  'WERNINGHAUS': [{ titulo: 'NSC Total — Como a fábrica de bilionários de SC fez herdeiros escalarem no ranking dos super-ricos (WEG)', url: 'https://www.nsctotal.com.br/colunistas/pedro-machado/como-a-fabrica-de-bilionarios-de-sc-fez-herdeiros-escalarem-no-ranking-dos-super-ricos' }],
  'WERNINGHAUS DE CARVALHO': [{ titulo: 'NSC Total — Como a fábrica de bilionários de SC fez herdeiros escalarem no ranking dos super-ricos (WEG)', url: 'https://www.nsctotal.com.br/colunistas/pedro-machado/como-a-fabrica-de-bilionarios-de-sc-fez-herdeiros-escalarem-no-ranking-dos-super-ricos' }],
  'BEHNKE': [{ titulo: 'NSC Total — Como a fábrica de bilionários de SC fez herdeiros escalarem no ranking dos super-ricos (WEG)', url: 'https://www.nsctotal.com.br/colunistas/pedro-machado/como-a-fabrica-de-bilionarios-de-sc-fez-herdeiros-escalarem-no-ranking-dos-super-ricos' }],
};

function sobrenomeChave(nomeCompleto) {
  let nome = nomeCompleto.replace(/\([^)]*\)/g, ' '); // remove parênteses (ex.: veículos trust)
  nome = nome.replace(/^esp[óo]lio de\s+/i, '');
  const partes = nome.trim().toUpperCase().split(/\s+/).filter(Boolean);
  while (partes.length && SUFIXOS_GERACIONAIS.has(partes[partes.length - 1])) partes.pop();
  if (!partes.length) return null;
  const ultima = partes[partes.length - 1];
  if (SOBRENOMES_EXCLUIDOS.has(ultima)) return null;
  if (!SOBRENOMES_GENERICOS.has(ultima)) return ultima;
  if (partes.length < 3) return null;
  const composto = partes.slice(-3).join(' ');
  return SOBRENOMES_EXCLUIDOS.has(composto) ? null : composto;
}

function tituloSobrenome(chave) {
  return chave
    .split(' ')
    .map((p, i) => (i > 0 && PREPOSICOES_SOBRENOME.has(p) ? p.toLowerCase() : p.charAt(0) + p.slice(1).toLowerCase()))
    .join(' ');
}

function detectarFamiliasReais(pessoas, pesoPorTicker, empresaPorTicker) {
  const porChave = new Map();
  for (const p of pessoas) {
    const chave = sobrenomeChave(p.nome);
    if (!chave) continue;
    if (!porChave.has(chave)) porChave.set(chave, new Map());
    const porPessoa = porChave.get(chave);
    if (!porPessoa.has(p.nome)) porPessoa.set(p.nome, []);
    porPessoa.get(p.nome).push(p);
  }

  const familias = [];
  for (const [chave, porPessoa] of porChave) {
    if (porPessoa.size < 2) continue;

    const membros = [];
    const empresasMap = new Map();
    let pctIndice = 0;
    let patrimonioRs = 0;

    for (const [nome, linhas] of porPessoa) {
      const partes = [];
      for (const l of linhas) {
        const peso = pesoPorTicker.get(l.ticker);
        if (l.percentual_efetivo_na_empresa_pct != null && peso != null) {
          pctIndice += (l.percentual_efetivo_na_empresa_pct * peso) / 100;
        }
        if (l.patrimonio_rs != null) patrimonioRs += l.patrimonio_rs;
        partes.push(`${l.ticker} (${fmtPct(l.percentual_efetivo_na_empresa_pct)})`);
        if (!empresasMap.has(l.ticker)) {
          empresasMap.set(l.ticker, { tipo: 'ticker', ticker: l.ticker, empresa: empresaPorTicker.get(l.ticker) || l.empresa, badge: {} });
        }
      }
      membros.push({ nome, relacao: partes.join(', ') });
    }
    membros.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    familias.push({
      nome: `Família ${tituloSobrenome(chave)}`,
      chaveNormalizada: chave,
      fonte: 'cvm',
      resumo:
        'Agrupamento automático pelo sobrenome comum entre linhas da aba Pessoas — dado direto da CVM/FRE, ' +
        'não pesquisa de imprensa. Os mesmos percentuais e valores já aparecem individualmente na aba Pessoas.',
      membros,
      fontes: FONTES_FAMILIAS_REAIS[chave] || [],
      empresas: [...empresasMap.values()],
      qtdEmpresas: empresasMap.size,
      pctIndice,
      patrimonioRs,
    });
  }

  return familias;
}

function markSortedHeader(name, key) {
  for (const th of document.querySelectorAll(`#table-${name} thead th`)) {
    th.classList.toggle('is-sorted', th.dataset.sort === key);
  }
}

function renderTableFor(name) {
  if (name === 'pessoas') renderAgrupado('pessoas', true);
  else if (name === 'acionistas') renderAgrupado('acionistas', true);
  else if (name === 'familias') renderFamilias();
  else renderTable(name);
}

/* ---- Famílias: holdings de família (ex.: as 3 famílias fundadoras da WEG --
   dentro da WPA Participações) — clique na linha expande e mostra os
   integrantes nomeados, pesquisados abertamente (não são dado da CVM). --- */

function montarDetalheFamilia(row) {
  const membros =
    row.membros && row.membros.length
      ? `<ul class="familia-membros">${row.membros
          .map(
            (m) =>
              `<li><span class="familia-membro-nome">${m.nome}</span>${
                m.relacao ? `<span class="familia-membro-relacao">${m.relacao}</span>` : ''
              }</li>`
          )
          .join('')}</ul>`
      : '<p class="pie-resumo">Integrantes não identificados publicamente.</p>';
  return `<p class="pie-resumo">${row.resumo || ''}</p>${membros}${fontesHtml(row.fontes)}`;
}

function selodeFonte(row) {
  return row.fonte === 'cvm'
    ? '<span class="familia-fonte familia-fonte-cvm" title="Agrupamento automático por sobrenome, a partir de dado direto da CVM/FRE">CVM</span>'
    : '<span class="familia-fonte familia-fonte-pesquisa" title="Pesquisa aberta (imprensa financeira), não é dado da CVM">pesquisa aberta</span>';
}

function renderFamilias() {
  const rows = filtrarAgrupado(state.data.familiasPorNome, state.filter.familias);
  const { key, dir } = state.sort.familias;
  const sorted = sortRows(rows, key, dir);
  const tbody = document.querySelector('#table-familias tbody');
  const frag = document.createDocumentFragment();

  for (const row of sorted) {
    const tr = document.createElement('tr');
    tr.className = 'familia-row';
    tr.tabIndex = 0;

    const tdNome = document.createElement('td');
    const toggle = document.createElement('span');
    toggle.className = 'familia-toggle';
    toggle.textContent = '▸';
    tdNome.appendChild(toggle);
    tdNome.appendChild(document.createTextNode(' ' + row.nome + ' '));
    tdNome.insertAdjacentHTML('beforeend', selodeFonte(row));
    tr.appendChild(tdNome);

    const tdIndice = document.createElement('td');
    tdIndice.className = 'num';
    tdIndice.textContent = fmtPct(row.pctIndice);
    tr.appendChild(tdIndice);

    const tdPatrimonio = document.createElement('td');
    tdPatrimonio.className = 'num';
    tdPatrimonio.textContent = fmtMoeda(row.patrimonioRs);
    tr.appendChild(tdPatrimonio);

    const tdVia = document.createElement('td');
    tdVia.className = 'empresas-cell';
    for (const e of row.empresas) {
      tdVia.appendChild(e.tipo === 'ticker' ? tickerRef(e.ticker, e.badge) : entidadeBadge(e.nome, e.chave, e.badge));
    }
    tr.appendChild(tdVia);

    const trDetalhe = document.createElement('tr');
    trDetalhe.className = 'familia-detalhe';
    trDetalhe.hidden = true;
    const tdDetalhe = document.createElement('td');
    tdDetalhe.colSpan = 4;
    tdDetalhe.innerHTML = montarDetalheFamilia(row);
    trDetalhe.appendChild(tdDetalhe);

    tr.addEventListener('click', () => {
      const abrindo = trDetalhe.hidden;
      trDetalhe.hidden = !abrindo;
      toggle.textContent = abrindo ? '▾' : '▸';
      tr.classList.toggle('is-expandida', abrindo);
    });

    frag.appendChild(tr);
    frag.appendChild(trDetalhe);
  }
  tbody.replaceChildren(frag);
  markSortedHeader('familias', key);
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

  const valorTotal = empresas.reduce((soma, e) => soma + (e.valor_mercado_rs ?? 0), 0);
  document.getElementById('kpi-valor-total').textContent = fmtMoeda(valorTotal);

  const spanCaptura = document.getElementById('valor-mercado-capturado');
  if (spanCaptura) spanCaptura.textContent = state.data.valor_mercado_capturado_em || '—';
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

function corDaFatia(ehResiduo, indiceCorVerde) {
  if (ehResiduo) return 'var(--pie-outros)';
  return `var(--${PIE_CORES[indiceCorVerde % PIE_CORES.length]})`;
}

const LEGENDA_MAX_LINHAS = 8;
const RESIDUO_GENERICO = /^outros|^público/i;

// itens: [{nome, pct}]. ehResiduo(nome) decide a fatia neutra (cinza) —
// "Outros"/"Ações Tesouraria" numa empresa, "Outros (capital disperso)" etc.
// numa entidade pesquisada manualmente.
function montarPizzaGenerica(itens, ehResiduo) {
  let acumulado = 0;
  let indiceCor = 0;
  const fatias = [];
  const legenda = [];
  let restantePct = 0;
  let restanteQtd = 0;

  itens.forEach((item, i) => {
    const pct = numeric(item.pct) ?? 0;
    const residuo = ehResiduo(item.nome);
    const cor = corDaFatia(residuo, indiceCor);
    if (!residuo) indiceCor++;
    fatias.push(`${cor} ${acumulado}% ${acumulado + pct}%`);
    acumulado += pct;

    if (i < LEGENDA_MAX_LINHAS) {
      legenda.push(
        `<li><span class="pie-swatch" style="background:${cor}"></span>` +
          `<span class="pie-legend-nome">${item.nome}</span>` +
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

function montarPizza(linhas) {
  return montarPizzaGenerica(
    linhas.map((l) => ({ nome: l.acionista, pct: numeric(l.percentual_total_pct) ?? 0 })),
    (nome) => NOMES_RESIDUO.has(nome)
  );
}

function linhaInfoBadge(dataset) {
  const partes = [];
  if (dataset.efetivo) partes.push(`% efetivo aqui: <strong>${dataset.efetivo}</strong>`);
  if (dataset.pct) partes.push(`Participação aqui: <strong>${dataset.pct}</strong>`);
  if (dataset.patrimonio) partes.push(`Patrimônio aqui: <strong>${dataset.patrimonio}</strong>`);
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

function fontesHtml(fontes) {
  if (!fontes || !fontes.length) return '';
  const itens = fontes.map((f) => `<li><a href="${f.url}" target="_blank" rel="noopener">${f.titulo}</a></li>`);
  return `<ul class="pie-fontes">${itens.join('')}</ul>`;
}

function posicionarPopover(popover, alvo) {
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

function setupPiePopover() {
  const popover = criarPopover();

  function esconder() {
    popover.hidden = true;
  }

  function mostrarTicker(alvo) {
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

    posicionarPopover(popover, alvo);
  }

  function mostrarEntidade(alvo) {
    const chave = alvo.dataset.entidade;
    const info = state.data.estruturaAcionistas && state.data.estruturaAcionistas[chave];
    if (!info) return;

    // "Já no recorte" (ex.: Itaúsa, Banco do Brasil): a estrutura real via
    // CVM já existe no ticker da própria empresa — mostra o gráfico dela.
    if (info.tipo === 'ja_no_recorte' && info.ticker) {
      const linhas = state.data.acionistasPorTicker.get(info.ticker);
      const empresa = (state.data.empresas.find((e) => e.ticker === info.ticker) || {}).empresa || info.ticker;
      if (linhas) {
        const { gradiente, legendaHtml } = montarPizza(linhas);
        popover.innerHTML =
          `<p class="pie-empresa">${alvo.textContent} → ${info.ticker} — ${empresa}</p>` +
          linhaInfoBadge(alvo.dataset) +
          `<p class="pie-resumo">${info.resumo}</p>` +
          `<div class="pie-body">` +
          `<div class="pie-circle" style="background: conic-gradient(${gradiente})"></div>` +
          `<ul class="pie-legend">${legendaHtml}</ul>` +
          `</div>`;
        posicionarPopover(popover, alvo);
        return;
      }
    }

    if (info.pizza && info.pizza.length) {
      const { gradiente, legendaHtml } = montarPizzaGenerica(info.pizza, (nome) => RESIDUO_GENERICO.test(nome));
      popover.innerHTML =
        `<p class="pie-empresa">${alvo.textContent}</p>` +
        linhaInfoBadge(alvo.dataset) +
        `<p class="pie-resumo">${info.resumo}</p>` +
        `<div class="pie-body">` +
        `<div class="pie-circle" style="background: conic-gradient(${gradiente})"></div>` +
        `<ul class="pie-legend">${legendaHtml}</ul>` +
        `</div>` +
        fontesHtml(info.fontes);
    } else {
      popover.innerHTML =
        `<p class="pie-empresa">${alvo.textContent}</p>` +
        linhaInfoBadge(alvo.dataset) +
        `<p class="pie-resumo">${info.resumo}</p>` +
        fontesHtml(info.fontes);
    }

    posicionarPopover(popover, alvo);
  }

  document.addEventListener('mouseover', (e) => {
    const alvo = e.target.closest('.ticker-ref, .entidade-ref');
    if (!alvo) return;
    if (alvo.dataset.entidade) mostrarEntidade(alvo);
    else if (alvo.dataset.ticker) mostrarTicker(alvo);
  });
  document.addEventListener('mouseout', (e) => {
    const alvo = e.target.closest('.ticker-ref, .entidade-ref');
    if (alvo && !alvo.contains(e.relatedTarget)) esconder();
  });
  document.addEventListener('scroll', esconder, true);
}

async function main() {
  const [res, resEstrutura] = await Promise.all([fetch('./data.json'), fetch('./estrutura-acionistas.json')]);
  state.data = await res.json();
  state.data.estruturaAcionistas = resEstrutura.ok ? await resEstrutura.json() : {};

  // Pulverização deixou de ser uma aba própria: a % de cada empresa entra
  // como coluna na aba Empresas, usando o mesmo dado (ranking) de antes.
  const pctDispersosPorTicker = new Map();
  for (const r of state.data.ranking) {
    for (const t of r.tickers.split(', ')) pctDispersosPorTicker.set(t, r.pct_acionistas_dispersos);
  }
  for (const e of state.data.empresas) e.pct_acionistas_dispersos = pctDispersosPorTicker.get(e.ticker) ?? null;

  const pesoPorTicker = new Map(state.data.empresas.map((e) => [e.ticker, numeric(e.peso_ibov_pct)]));

  state.data.pessoasPorNome = agruparPessoas(state.data.pessoas);
  state.data.acionistasPorNome = agruparAcionistas(state.data.acionistas, pesoPorTicker);
  state.data.acionistasPorTicker = agruparAcionistasPorTicker(state.data.acionistas);

  const subEntidades = construirSubEntidades(state.data.acionistasPorNome, state.data.estruturaAcionistas);
  state.data.acionistasPorNome = [...state.data.acionistasPorNome, ...subEntidades.acionistas];

  const empresaPorTicker = new Map(state.data.empresas.map((e) => [e.ticker, e.empresa]));
  const familiasReais = detectarFamiliasReais(state.data.pessoas, pesoPorTicker, empresaPorTicker);
  state.data.familiasPorNome = [...subEntidades.familias, ...familiasReais];

  renderKpis();
  for (const name of TABLE_NAMES) renderTableFor(name);

  setupTabs();
  setupSort();
  setupSearch();
  setupPiePopover();
}

main();
