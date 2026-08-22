/* Verificações de navegador: abre as três páginas de verdade, nos três
   idiomas e nos dois temas, e confere que nada quebrou em tempo de execução.

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
  await conferirIdiomas(cartao, { '.links a': 5 });

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
