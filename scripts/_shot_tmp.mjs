import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [nome, vp] of [['desk', { width: 1400, height: 1000 }], ['mob', { width: 390, height: 900 }]]) {
  const p = await b.newPage({ viewport: vp });
  const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
  await p.goto('http://127.0.0.1:8765/metanalise/', { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.evaluate(() => window.scrollTo(0, document.getElementById('forest-title').getBoundingClientRect().top + window.scrollY - 150));
  await p.waitForTimeout(200);
  await p.screenshot({ path: process.env.S + `/fm_${nome}.png` });
  console.log(nome, erros.join(' | ') || 'sem erros');
}
await b.close();
