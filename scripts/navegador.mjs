/* Verificações de navegador: abre as páginas de verdade, nos três idiomas
   e nos dois temas, e confere que nada quebrou em tempo de execução.

   É o tipo de falha que a leitura do código não pega: uma função chamada
   antes de existir, um elemento que voltou nulo, uma chave de tradução
   faltando só no chinês. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright';

const PUBLICO = resolve(import.meta.dirname, '..', 'public');
const PORTA = 8123;
const problemas = [];

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.vcf': 'text/vcard; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
};

/* Servidor estático mínimo, com o mesmo comportamento de índice de pasta
   que o GitHub Pages e o Cloudflare usam. */
const servidor = createServer(async (req, res) => {
  let caminho = decodeURIComponent(req.url.split('?')[0]);
  if (caminho.endsWith('/')) caminho += 'index.html';
  let alvo = join(PUBLICO, caminho);
  try {
    let corpo;
    try {
      corpo = await readFile(alvo);
    } catch {
      alvo = join(alvo, 'index.html');
      corpo = await readFile(alvo);
    }
    res.writeHead(200, { 'content-type': TIPOS[extname(alvo)] || 'application/octet-stream' });
    res.end(corpo);
  } catch {
    res.writeHead(404).end('não encontrado');
  }
});

const externa = (url) => /fonts\.(googleapis|gstatic)\.com/.test(url);

async function abrir(navegador, caminho, opcoes = {}) {
  const ctx = await navegador.newContext({
    viewport: opcoes.viewport || { width: 1440, height: 900 },
    colorScheme: opcoes.tema || 'light',
  });
  const pagina = await ctx.newPage();
  const rotulo = `${caminho}${opcoes.tema === 'dark' ? ' [escuro]' : ''}${opcoes.viewport ? ' [móvel]' : ''}`;

  // Falha de fonte externa não reprova o site: a rede do CI não é o site.
  pagina.on('pageerror', (e) => problemas.push(`${rotulo}: erro de JavaScript — ${e.message}`));
  pagina.on('console', (m) => {
    if (m.type() === 'error' && !externa(m.location()?.url || '')) {
      problemas.push(`${rotulo}: console.error — ${m.text()}`);
    }
  });

  await pagina.goto(`http://127.0.0.1:${PORTA}${caminho}`, { waitUntil: 'load' });
  await pagina.waitForTimeout(1200);

  const largura = await pagina.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (largura > 0) problemas.push(`${rotulo}: a página rola para o lado (${largura}px a mais)`);

  return { pagina, ctx, rotulo };
}

async function conferirIdiomas({ pagina, rotulo }, esperado) {
  for (const idioma of ['PT', 'EN', 'ZH']) {
    await pagina.selectOption('#lang-select', idioma);
    await pagina.waitForTimeout(250);

    const vazias = await pagina.evaluate(() =>
      [...document.querySelectorAll('[data-i18n]')]
        .filter((n) => !n.textContent.trim())
        .map((n) => n.getAttribute('data-i18n'))
    );
    if (vazias.length) problemas.push(`${rotulo} [${idioma}]: tradução faltando — ${vazias.join(', ')}`);

    for (const [seletor, quantos] of Object.entries(esperado)) {
      const achou = await pagina.evaluate((s) => document.querySelectorAll(s).length, seletor);
      if (achou !== quantos) problemas.push(`${rotulo} [${idioma}]: ${seletor} → ${achou}, esperado ${quantos}`);
    }
  }
  await pagina.selectOption('#lang-select', 'PT');
}

/* O pop-up do Pix (cartão e /tree): abre, mostra o QR de fato carregado e
   copia exatamente o código a partir do qual o QR foi gerado — se o botão
   copiasse outra coisa, o pagamento iria para outro lugar sem erro nenhum. */
const { codigoPix } = await import('./pix-qr.mjs');

async function conferirPix({ pagina, ctx, rotulo }) {
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await pagina.click('#pix-button');
  await pagina.waitForTimeout(300);

  const estado = await pagina.evaluate(() => {
    const d = document.querySelector('.pix-dialog');
    const qr = d && d.querySelector('.pix-qr');
    return { aberto: !!(d && d.open), qr: !!(qr && qr.complete && qr.naturalWidth > 0) };
  });
  if (!estado.aberto) return problemas.push(`${rotulo}: o pop-up do Pix não abriu`);
  if (!estado.qr) problemas.push(`${rotulo}: o QR Code do Pix não carregou`);

  await pagina.click('.pix-copy');
  await pagina.waitForTimeout(300);
  const copiado = await pagina.evaluate(() => navigator.clipboard.readText());
  if (copiado !== codigoPix()) problemas.push(`${rotulo}: o Pix copiado não é o código do QR — ${copiado}`);
  if (await pagina.locator('.pix-status').isHidden()) {
    problemas.push(`${rotulo}: o aviso de código copiado não apareceu`);
  }

  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  if (await pagina.evaluate(() => document.querySelector('.pix-dialog').open)) {
    problemas.push(`${rotulo}: o pop-up do Pix não fechou com Esc`);
  }
}

servidor.listen(PORTA);
/* CHROMIUM_PATH permite usar um Chromium já presente na máquina, em vez de
   baixar o do Playwright. O CI não precisa disso; ambientes com o navegador
   pré-instalado, sim. */
const navegador = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

/* ---- Home ---------------------------------------------------------------- */
{
  const home = await abrir(navegador, '/');
  await conferirIdiomas(home, {
    '#education li': 3,
    '#pubs li': 2,
    '.section .links a': 6,
  });

  const canvas = await home.pagina.evaluate(() => !!document.querySelector('#particles canvas'));
  if (!canvas) problemas.push('/: o campo de partículas não foi criado');

  // O anel especular precisa acender quando o ponteiro se aproxima do botão.
  const caixa = await home.pagina.locator('#email-cta').boundingBox();
  await home.pagina.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
  await home.pagina.waitForTimeout(500);
  const aceso = await home.pagina.evaluate(
    () => parseFloat(getComputedStyle(document.querySelector('#email-cta .spec-ring')).opacity)
  );
  if (!(aceso > 0)) problemas.push('/: o anel do botão não acendeu ao aproximar o ponteiro');

  await home.ctx.close();
  await abrir(navegador, '/', { tema: 'dark' }).then((r) => r.ctx.close());
  await abrir(navegador, '/', { viewport: { width: 390, height: 844 } }).then((r) => r.ctx.close());
}

/* ---- Cartão -------------------------------------------------------------- */
{
  const cartao = await abrir(navegador, '/cartao/');
  await conferirIdiomas(cartao, { '.links a': 4 });

  if (!(await cartao.pagina.evaluate(() => !!document.querySelector('#particles canvas')))) {
    problemas.push('/cartao/: o campo de partículas não foi criado');
  }

  // A alternância de tema mostra um ícone por vez.
  await cartao.pagina.click('#theme-toggle');
  await cartao.pagina.waitForTimeout(400);
  const icones = await cartao.pagina.evaluate(() => ({
    tema: document.documentElement.getAttribute('data-theme'),
    sol: getComputedStyle(document.querySelector('.icon-sun')).display,
    lua: getComputedStyle(document.querySelector('.icon-moon')).display,
  }));
  if (icones.tema !== 'dark' || icones.sol !== 'block' || icones.lua !== 'none') {
    problemas.push(`/cartao/: alternância de tema errada — ${JSON.stringify(icones)}`);
  }

  await conferirPix(cartao);

  // O vCard precisa ser gerado ao clicar em "Adicionar contato". O botão usa
  // um data: URI (sem nome de arquivo), então quem importa é o conteúdo, não
  // o nome sugerido pelo navegador. Fica por último nesta página de propósito:
  // o clique cria e clica um <a href="data:..."> na hora, que o Playwright
  // entende como uma navegação que nunca "termina" de verdade (vira download)
  // -- isso trava qualquer ação seguinte na mesma página, então nada roda
  // depois dele aqui além de fechar o contexto.
  const [baixado] = await Promise.all([
    cartao.pagina.waitForEvent('download', { timeout: 5000 }).catch(() => null),
    cartao.pagina.click('#add-contact', { noWaitAfter: true }),
  ]);
  if (!baixado) problemas.push('/cartao/: o vCard não foi gerado');
  else {
    const caminho = await baixado.path();
    const conteudo = caminho ? await readFile(caminho, 'utf8') : '';
    if (!conteudo.includes('BEGIN:VCARD') || !conteudo.includes('kie@kielima.com')) {
      problemas.push(`/cartao/: vCard baixado com conteúdo inesperado: ${JSON.stringify(conteudo.slice(0, 80))}`);
    }
  }

  await cartao.ctx.close();
  await abrir(navegador, '/cartao/', { viewport: { width: 390, height: 844 } }).then((r) => r.ctx.close());
}

/* ---- Papel semente ------------------------------------------------------- */
{
  const semente = await abrir(navegador, '/cartao/papel-semente/');
  await conferirIdiomas(semente, { '.step': 4, '.spec': 6 });
  await semente.ctx.close();
}

/* ---- Hub de links -------------------------------------------------------- */
{
  const tree = await abrir(navegador, '/tree/');
  await conferirIdiomas(tree, { '.tree-links a': 5, '.tree-link': 2 });
  await conferirPix(tree);

  // O avatar é a única imagem do site: se o arquivo sumir num rename, a página
  // continua "funcionando" e ninguém vê — daí conferir que ela de fato carregou.
  const avatar = await tree.pagina.evaluate(() => {
    const img = document.querySelector('.tree-avatar');
    return img && img.complete && img.naturalWidth > 0;
  });
  if (!avatar) problemas.push('/tree/: a foto de perfil não carregou');

  await tree.ctx.close();
  await abrir(navegador, '/tree/', { tema: 'dark' }).then((r) => r.ctx.close());
  await abrir(navegador, '/tree/', { viewport: { width: 390, height: 844 } }).then((r) => r.ctx.close());
}

/* ---- Apresentações ------------------------------------------------------- */
{
  const ppt = await abrir(navegador, '/ppt/');
  await conferirIdiomas(ppt, { '.deck-card': 1 });
  await ppt.ctx.close();
  await abrir(navegador, '/ppt/', { tema: 'dark' }).then((r) => r.ctx.close());
  await abrir(navegador, '/ppt/', { viewport: { width: 390, height: 844 } }).then((r) => r.ctx.close());
}

/* As apresentações em si (/ppt/dissertacao/ e as páginas soltas ao lado dela)
   ficam de fora deste ensaio de propósito. Elas carregam React, Babel, Plotly
   e 3Dmol de CDNs externos: no CI essas requisições vão para fora ou falham,
   e o `console.error` resultante reprovaria o site por um problema que não é
   dele. O índice em /ppt/ — que é código nosso — está coberto acima. */

/* ---- Metanálise ao vivo ---------------------------------------------------
   Os gráficos (SVG) são montados em JS puro, sem biblioteca externa — nada
   de rede além das fontes do Google, então esta página entra no ensaio
   normal como qualquer outra. */
{
  const meta = await abrir(navegador, '/metanalise/');
  await conferirIdiomas(meta, { '.kpi-tile': 6, '.cat-chip': 8, '.forest-head': 9 });

  const pontos = await meta.pagina.evaluate(() => document.querySelectorAll('.scatter-pt').length);
  if (pontos < 1000) problemas.push(`/metanalise/: só ${pontos} pontos na dispersão, esperado 1000+`);

  // Clicar num chip de categoria precisa esmaecer os pontos das outras.
  await meta.pagina.click('.cat-chip');
  await meta.pagina.waitForTimeout(150);
  const esmaecidos = await meta.pagina.evaluate(() => document.querySelectorAll('.scatter-pt.is-dim').length);
  if (esmaecidos < 1) problemas.push('/metanalise/: clicar num chip de categoria não esmaeceu os outros pontos');
  await meta.pagina.click('.cat-chip'); // desliga o filtro de categoria antes do proximo teste

  // Desligar o estrato "sensibilidade" tem de reduzir os pontos e o KPI de pares.
  const paresAntes = await meta.pagina.evaluate(() => document.getElementById('kpi-pares').textContent);
  await meta.pagina.click('#tier-check-s');
  await meta.pagina.waitForTimeout(150);
  const pontosSoPrincipal = await meta.pagina.evaluate(() => document.querySelectorAll('.scatter-pt').length);
  const paresDepois = await meta.pagina.evaluate(() => document.getElementById('kpi-pares').textContent);
  if (pontosSoPrincipal >= pontos) {
    problemas.push(`/metanalise/: desligar o terço "sensibilidade" não reduziu os pontos (${pontos} -> ${pontosSoPrincipal})`);
  }
  if (paresDepois === paresAntes) {
    problemas.push(`/metanalise/: KPI de pares não mudou ao desligar um estrato (ficou em ${paresDepois})`);
  }

  // Não pode ser possível desligar os dois estratos ao mesmo tempo.
  await meta.pagina.click('#tier-check-p');
  await meta.pagina.waitForTimeout(150);
  const pCheckedAinda = await meta.pagina.evaluate(() => document.getElementById('tier-check-p').checked);
  if (!pCheckedAinda) problemas.push('/metanalise/: foi possível desligar os dois estratos ao mesmo tempo');

  // Clicar numa família do "ci por família de material" tem de expandir o
  // forest plot com os estudos que a compõem, e recolher de novo ao clicar
  // outra vez.
  await meta.pagina.click('.forest-head');
  await meta.pagina.waitForTimeout(150);
  const subLinhas = await meta.pagina.evaluate(() =>
    document.querySelector('.forest-item.is-open .forest-sub-list')?.querySelectorAll('.forest-sub-row').length ?? 0
  );
  if (subLinhas < 1) problemas.push('/metanalise/: clicar numa família não expandiu os estudos que a compõem');
  await meta.pagina.click('.forest-head');
  await meta.pagina.waitForTimeout(150);
  const aindaAberta = await meta.pagina.evaluate(() => document.querySelectorAll('.forest-item.is-open').length);
  if (aindaAberta !== 0) problemas.push('/metanalise/: clicar de novo na família não recolheu o forest plot');

  // F28 (Kiê, 2026-10-16): o forest mostra a estimativa do modelo em R (losango + IC 95%)
  // por família e no total, com a legenda e a nota do método.
  const modelo = await meta.pagina.evaluate(() => ({
    losangos: document.querySelectorAll('.forest-head .forest-diamond').length,
    ics: document.querySelectorAll('.forest-head .forest-ci').length,
    legenda: !document.getElementById('forest-legend').hidden,
    nota: document.getElementById('forest-modelo-nota').textContent.length,
  }));
  if (modelo.losangos < 3 || modelo.ics < 3 || !modelo.legenda || modelo.nota < 40) {
    problemas.push(`/metanalise/: o forest não mostra o modelo em R (${JSON.stringify(modelo)})`);
  }

  // Kiê (2026-10-16): o botão ci / ci_t troca o indicador do forest por família;
  // no modo ci_t só entram os pares com vida útil declarada.
  await meta.pagina.click('#forest-radio-cit');
  await meta.pagina.waitForTimeout(150);
  const cit = await meta.pagina.evaluate(() => ({
    titulo: document.getElementById('forest-title').textContent,
    heads: document.querySelectorAll('.forest-head').length,
    nCi: Number(document.getElementById('forest-n-ci').textContent),
    nCit: Number(document.getElementById('forest-n-cit').textContent),
    losangos: document.querySelectorAll('.forest-head .forest-diamond').length,
  }));
  if (!cit.titulo.includes('ci_t') || cit.heads < 2 || !(cit.nCit > 0 && cit.nCit < cit.nCi) || cit.losangos < 2) {
    problemas.push(`/metanalise/: o botão ci_t não trocou o forest (${JSON.stringify(cit)})`);
  }
  await meta.pagina.click('#forest-radio-ci');
  await meta.pagina.waitForTimeout(150);

  // F12: a família do cimento Portland abre em subfamílias (CEM I, CP II-E…),
  // cada uma com um botão (i) que mostra a norma de referência.
  const subfam = await meta.pagina.evaluate(() => {
    const item = [...document.querySelectorAll('.forest-item')].find((el) => el.querySelector(':scope > .forest-detail > .forest-subfam-list'));
    if (!item) return { n: 0 };
    item.querySelector(':scope > .forest-head').click();
    return { n: document.querySelectorAll('.forest-subfam').length };
  });
  if (subfam.n < 2) problemas.push(`/metanalise/: a família do cimento Portland não mostrou subfamílias (${subfam.n})`);
  await meta.pagina.click('.forest-info-btn');
  await meta.pagina.waitForTimeout(150);
  const infoTexto = await meta.pagina.evaluate(() => document.querySelector('.forest-info')?.textContent ?? '');
  if (infoTexto.length < 20) problemas.push('/metanalise/: o botão (i) da subfamília não mostrou a explicação');
  // Kiê (2026-10-13): a barra «kg/m³ excluído» abre a lista das linhas excluídas com o motivo.
  const excl = await meta.pagina.evaluate(() => {
    const btn = document.querySelector('.unit-row-btn');
    if (!btn) return { btn: false };
    btn.click();
    const linhas = document.querySelectorAll('.unit-excl-table tbody tr');
    const motivo = linhas.length ? linhas[0].lastElementChild.textContent.trim() : '';
    return { btn: true, aberto: btn.getAttribute('aria-expanded') === 'true', n: linhas.length, motivo };
  });
  if (!excl.btn) problemas.push('/metanalise/: falta a barra clicável das linhas em kg/m³ excluídas');
  else if (!excl.aberto || excl.n < 1 || excl.motivo.length < 10) problemas.push(`/metanalise/: a barra das excluídas não abriu a lista com motivo (${excl.n} linhas)`);
  const outros = await meta.pagina.evaluate(() => [...document.querySelectorAll('.unit-name')].some((el) => /não classificado/.test(el.textContent)));
  if (outros) problemas.push('/metanalise/: o gráfico de unidades ainda tem a barra «outro / não classificado»');
  // Kiê (2026-10-13/14): mapa de países e rede temporal de citações, com os dois universos.
  await meta.pagina.waitForFunction(() => document.querySelectorAll('#mapa-svg path.tem').length > 10, null, { timeout: 10000 })
    .catch(() => problemas.push('/metanalise/: o mapa de países não desenhou os países com artigos'));
  const mapa = await meta.pagina.evaluate(() => ({
    paises: document.querySelectorAll('#mapa-svg path').length,
    lista: document.querySelectorAll('#pais-list .pais-row').length,
    nos: document.querySelectorAll('#rede-svg .rede-no').length,
    ligs: document.querySelectorAll('#rede-svg .rede-lig').length,
  }));
  if (mapa.paises < 150) problemas.push(`/metanalise/: o mapa tem só ${mapa.paises} países desenhados`);
  if (mapa.lista < 10) problemas.push(`/metanalise/: a lista de países tem só ${mapa.lista} linhas`);
  if (mapa.nos < 300 || mapa.ligs < 100) problemas.push(`/metanalise/: a rede de citações tem ${mapa.nos} pontos e ${mapa.ligs} ligações`);
  await meta.pagina.hover('#mapa-svg path.tem');
  const tipMapa = await meta.pagina.evaluate(() => document.getElementById('mapa-tooltip').textContent);
  if (!/\d/.test(tipMapa)) problemas.push('/metanalise/: o tooltip do mapa não mostrou o número de artigos');
  // Kiê (2026-10-17): clicar num ponto fixa o cartão; vários ao mesmo tempo; × desfixa.
  const hits = meta.pagina.locator('#rede-svg .rede-hit');
  await hits.first().click();
  await hits.last().click();
  const pins1 = await meta.pagina.evaluate(() => ({
    n: document.querySelectorAll('#rede-wrap .rede-pin').length,
    texto: [...document.querySelectorAll('#rede-wrap .rede-pin')].every((el) => /\d{4}/.test(el.textContent)),
    foco: document.getElementById('rede-svg').classList.contains('is-foco'),
  }));
  if (pins1.n !== 2 || !pins1.texto) problemas.push(`/metanalise/: clicar em dois pontos da rede deixou ${pins1.n} cartões fixados`);
  if (!pins1.foco) problemas.push('/metanalise/: com cartões fixados a rede não destacou as ligações');
  await meta.pagina.click('#rede-wrap .rede-pin .rede-pin-x');
  await hits.last().click();
  const pins2 = await meta.pagina.evaluate(() => ({
    n: document.querySelectorAll('#rede-wrap .rede-pin').length,
    foco: document.getElementById('rede-svg').classList.contains('is-foco'),
  }));
  if (pins2.n !== 0) problemas.push(`/metanalise/: o × e o segundo clique não desfixaram os cartões (${pins2.n} abertos)`);
  if (pins2.foco) problemas.push('/metanalise/: sem cartões fixados a rede continuou com o destaque');
  await meta.pagina.click('#univ-rede-meta');
  await meta.pagina.waitForTimeout(150);
  const meta2 = await meta.pagina.evaluate(() => ({
    nos: document.querySelectorAll('#rede-svg .rede-no').length,
    outro: document.getElementById('univ-mapa-meta').checked,
  }));
  if (!(meta2.nos < mapa.nos)) problemas.push('/metanalise/: o botão «só metanálise» não reduziu a rede');
  if (!meta2.outro) problemas.push('/metanalise/: os botões de universo do mapa e da rede não ficaram sincronizados');
  await meta.pagina.click('#univ-rede-todos');

  // botões (i) da barra de filtros: abrem a nota do seu filtro, só uma de cada vez
  await meta.pagina.evaluate(() => window.scrollTo(0, 0));
  await meta.pagina.click('#base-info-btn');
  const info1 = await meta.pagina.evaluate(() => ({
    base: !document.getElementById('base-info').hidden && document.getElementById('base-info').textContent.length,
    co2: !document.getElementById('co2-info').hidden,
  }));
  await meta.pagina.click('#co2-info-btn');
  const info2 = await meta.pagina.evaluate(() => ({
    base: !document.getElementById('base-info').hidden,
    co2: !document.getElementById('co2-info').hidden && document.getElementById('co2-info').textContent.length,
  }));
  await meta.pagina.keyboard.press('Escape');
  const info3 = await meta.pagina.evaluate(() => document.getElementById('co2-info').hidden);
  if (!(info1.base > 50) || info1.co2) problemas.push('/metanalise/: o (i) da base do ligante não abriu só a sua nota');
  if (!(info2.co2 > 50) || info2.base) problemas.push('/metanalise/: o (i) do CO₂ não abriu só a sua nota');
  if (!info3) problemas.push('/metanalise/: Esc não fechou a nota do filtro');

  await meta.ctx.close();
  await abrir(navegador, '/metanalise/', { tema: 'dark' }).then((r) => r.ctx.close());
  await abrir(navegador, '/metanalise/', { viewport: { width: 390, height: 844 } }).then((r) => r.ctx.close());
}

/* ---- Banco de dados da metanálise -----------------------------------------
   Tabela com a aba dados_fck inteira, lida de /metanalise/dados/banco.json. */
{
  // O botão da barra superior do painel tem de levar ao banco de dados.
  const painel = await abrir(navegador, '/metanalise/');
  await painel.pagina.click('#db-link');
  await painel.pagina.waitForLoadState('load');
  if (!painel.pagina.url().endsWith('/metanalise/dados/')) {
    problemas.push(`/metanalise/: o botão do banco de dados levou a ${painel.pagina.url()}`);
  }
  await painel.ctx.close();

  const db = await abrir(navegador, '/metanalise/dados/');
  const nColunas = JSON.parse(await readFile(join(PUBLICO, 'metanalise/dados/banco.json'), 'utf8')).colunas.length;
  await conferirIdiomas(db, { '#db-head th': nColunas });

  // Todas as linhas numa só página, sem paginação: a tabela tem de mostrar
  // o banco inteiro de uma vez.
  const totalLinhas = await db.pagina.evaluate(async () =>
    (await (await fetch('/metanalise/dados/banco.json')).json()).linhas.length
  );
  const mostradas = await db.pagina.evaluate(() => document.querySelectorAll('#db-body tr').length);
  if (mostradas !== totalLinhas) {
    problemas.push(`/metanalise/dados/: a tabela mostra ${mostradas} linhas, esperado ${totalLinhas} (todas)`);
  }

  // Pesquisar tem de filtrar as linhas; limpar a pesquisa, voltar a todas.
  // Espera condicional, não um tempo fixo: no runner do CI filtrar e redesenhar
  // as ~2.100 linhas pode passar dos 400 ms (falha de 2026-10-16, PR #145).
  await db.pagina.fill('#db-search', 'monorail');
  await db.pagina.waitForFunction((n) => document.querySelectorAll('#db-body tr').length < n, totalLinhas, { timeout: 10000 }).catch(() => {});
  const filtradas = await db.pagina.evaluate(() => document.querySelectorAll('#db-body tr').length);
  if (!(filtradas >= 1 && filtradas < totalLinhas)) {
    problemas.push(`/metanalise/dados/: a pesquisa não filtrou as linhas (ficaram ${filtradas})`);
  }
  await db.pagina.fill('#db-search', '');
  await db.pagina.waitForFunction((n) => document.querySelectorAll('#db-body tr').length === n, totalLinhas, { timeout: 10000 }).catch(() => {});
  const deVolta = await db.pagina.evaluate(() => document.querySelectorAll('#db-body tr').length);
  if (deVolta !== totalLinhas) {
    problemas.push(`/metanalise/dados/: limpar a pesquisa não voltou a mostrar todas as linhas (${deVolta})`);
  }

  // Ordenar por fck_mpa, do maior para o menor: a primeira linha tem de ser
  // o maior valor do banco.
  const colFck = await db.pagina.evaluate(() =>
    [...document.querySelectorAll('#db-head .db-sort')].findIndex((b) => b.textContent.trim() === 'fck_mpa')
  );
  if (colFck < 0) problemas.push('/metanalise/dados/: coluna fck_mpa não encontrada');
  else {
    const botao = db.pagina.locator('#db-head .db-sort').nth(colFck);
    await botao.click();
    await botao.click();
    await db.pagina.waitForTimeout(200);
    const valores = await db.pagina.evaluate((c) =>
      [...document.querySelectorAll('#db-body tr')]
        .map((tr) => parseFloat(tr.children[c].textContent))
        .filter((v) => !Number.isNaN(v)), colFck);
    if (!valores.length || valores[0] !== Math.max(...valores)) {
      problemas.push('/metanalise/dados/: ordenar fck_mpa de forma decrescente não pôs o maior valor primeiro');
    }
  }

  // Clicar numa linha abre a ficha técnica do artigo; Escape fecha-a.
  await db.pagina.fill('#db-search', '');
  await db.pagina.waitForTimeout(400);
  await db.pagina.click('#db-body tr:first-child');
  await db.pagina.waitForTimeout(200);
  const ficha = await db.pagina.evaluate(() => ({
    aberta: !document.getElementById('db-modal').hidden,
    titulo: document.getElementById('ficha-titulo')?.textContent.trim() || '',
    secoes: document.querySelectorAll('#ficha-corpo .ficha-sec').length
  }));
  if (!ficha.aberta || !ficha.titulo || ficha.secoes < 1) {
    problemas.push(`/metanalise/dados/: clicar numa linha não abriu a ficha técnica — ${JSON.stringify(ficha)}`);
  }
  // A ficha tem de caber numa folha A4 ao imprimir (o zoom ajusta-a antes).
  await db.pagina.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const pdf = await db.pagina.pdf({ format: 'A4', preferCSSPageSize: true });
  const paginas = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (paginas !== 1) problemas.push(`/metanalise/dados/: a ficha impressa ocupa ${paginas} páginas, esperado 1`);
  await db.pagina.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await db.pagina.keyboard.press('Escape');
  await db.pagina.waitForTimeout(150);
  const fechada = await db.pagina.evaluate(() => document.getElementById('db-modal').hidden);
  if (!fechada) problemas.push('/metanalise/dados/: Escape não fechou a ficha técnica');

  await db.ctx.close();
  await abrir(navegador, '/metanalise/dados/', { tema: 'dark' }).then((r) => r.ctx.close());
  await abrir(navegador, '/metanalise/dados/', { viewport: { width: 390, height: 844 } }).then((r) => r.ctx.close());
}

/* ---- Navegação entre páginas --------------------------------------------- */
{
  const { pagina, ctx } = await abrir(navegador, '/cartao/');
  await pagina.selectOption('#lang-select', 'EN');
  await pagina.waitForTimeout(200);
  await pagina.click('.seed-note a');
  await pagina.waitForLoadState('load');
  const idioma = await pagina.evaluate(() => document.getElementById('lang-select').value);
  if (idioma !== 'EN') problemas.push(`o idioma não acompanhou a navegação entre páginas (ficou ${idioma})`);
  await ctx.close();
}

await navegador.close();
servidor.close();

if (problemas.length) {
  console.error(`\n✗ ${problemas.length} problema(s):\n`);
  for (const p of problemas) console.error(`  · ${p}`);
  process.exit(1);
}
console.log('✓ Verificações de navegador passaram.');
