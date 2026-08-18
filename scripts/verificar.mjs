/* Verificações estáticas: rodam sem navegador, em menos de um segundo.
   Pegam o tipo de erro que passa despercebido na leitura de um diff —
   um arquivo renomeado e não atualizado, um ponto e vírgula perdido,
   ou o workflow publicando mais do que devia. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const RAIZ = resolve(import.meta.dirname, '..');
const PUBLICO = join(RAIZ, 'public');
const erros = [];

function arquivos(dir, filtro) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory()
      ? arquivos(caminho, filtro)
      : filtro.test(nome) ? [caminho] : [];
  });
}

const relativo = (p) => p.slice(RAIZ.length + 1);

/* 1 — Todo asset referenciado existe de fato -------------------------------- */
for (const html of arquivos(PUBLICO, /\.html$/)) {
  const conteudo = readFileSync(html, 'utf8');
  for (const [, atributo] of conteudo.matchAll(/(?:src|href)="(\/[^"]*)"/g)) {
    if (atributo.startsWith('//')) continue; // protocolo relativo, é externo
    const alvo = join(PUBLICO, atributo);
    const existe = existsSync(alvo) || existsSync(join(alvo, 'index.html'));
    if (!existe) erros.push(`${relativo(html)}: referencia "${atributo}", que não existe`);
  }
}

/* 2 — Todo JavaScript tem sintaxe válida ------------------------------------ */
for (const js of arquivos(PUBLICO, /\.js$/)) {
  try {
    execFileSync(process.execPath, ['--check', js], { stdio: 'pipe' });
  } catch (e) {
    erros.push(`${relativo(js)}: erro de sintaxe — ${String(e.stderr).split('\n')[2] || ''}`);
  }
}

/* 3 — Cada página tem título e idioma declarado ----------------------------- */
for (const html of arquivos(PUBLICO, /\.html$/)) {
  const conteudo = readFileSync(html, 'utf8');
  if (!/<title>[^<]+<\/title>/.test(conteudo)) erros.push(`${relativo(html)}: sem <title>`);
  if (!/<html lang="/.test(conteudo)) erros.push(`${relativo(html)}: <html> sem atributo lang`);
}

/* 4 — Nenhum workflow publica mais do que a pasta do site -------------------
   Esta é a verificação mais importante do arquivo. Se algum dia voltar um
   workflow de publicação e o caminho publicado não for ./public, tudo o que
   estiver no repositório vai para a internet. Falha barulhenta é melhor que
   vazamento silencioso — por isso a regra vale para qualquer workflow, não
   só para o do Pages, que foi removido quando o site passou para o
   Cloudflare. */
const pastaWorkflows = join(RAIZ, '.github/workflows');
if (existsSync(pastaWorkflows)) {
  for (const wf of arquivos(pastaWorkflows, /\.ya?ml$/)) {
    const conteudo = readFileSync(wf, 'utf8');
    if (!/upload-pages-artifact/.test(conteudo)) continue;
    const caminhos = [...conteudo.matchAll(/^\s*path:\s*(\S+)\s*$/gm)].map((m) => m[1]);
    if (caminhos.length !== 1 || caminhos[0] !== './public') {
      erros.push(`${relativo(wf)}: publica ${JSON.stringify(caminhos)} — só "./public" é permitido`);
    }
  }
}

/* 5 — O nome no wrangler.jsonc bate com o Worker (exigência do Cloudflare) --- */
const wrangler = join(RAIZ, 'wrangler.jsonc');
if (existsSync(wrangler)) {
  const cru = readFileSync(wrangler, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const conf = JSON.parse(cru);
  if (conf.name !== 'kielima-site') erros.push(`wrangler.jsonc: name "${conf.name}" — deveria ser "kielima-site"`);
  if (conf.assets?.directory !== './public') erros.push(`wrangler.jsonc: assets.directory deveria ser "./public"`);
}

/* 6 — Toda chave de tradução existe nos três idiomas ------------------------
   Sem isto, faltar uma chave no chinês não aparece como espaço em branco:
   o texto do idioma anterior fica na tela. O leitor chinês vê uma frase em
   português no meio da página, e ninguém percebe. */
import vm from 'node:vm';

function extrairCopy(codigo) {
  const inicio = codigo.indexOf('var COPY = {');
  if (inicio === -1) return null;
  let i = codigo.indexOf('{', inicio);
  let profundidade = 0;
  for (let j = i; j < codigo.length; j++) {
    if (codigo[j] === '{') profundidade++;
    else if (codigo[j] === '}') {
      profundidade--;
      if (profundidade === 0) {
        /* O literal usa constantes definidas fora dele (EMAIL, por exemplo).
           Este contexto responde a qualquer identificador com string vazia,
           porque aqui só interessam as CHAVES, nunca os valores. */
        const contexto = new Proxy({}, {
          has: () => true,
          get: (_, chave) => (chave === Symbol.unscopables ? undefined : ''),
        });
        return vm.runInNewContext('(' + codigo.slice(i, j + 1) + ')', contexto);
      }
    }
  }
  return null;
}

for (const js of arquivos(PUBLICO, /\.js$/)) {
  let copy;
  try {
    copy = extrairCopy(readFileSync(js, 'utf8'));
  } catch (e) {
    erros.push(`${relativo(js)}: não consegui ler o bloco COPY — ${e.message}`);
    continue;
  }
  if (!copy) continue;
  const idiomas = Object.keys(copy);
  const todas = new Set(idiomas.flatMap((l) => Object.keys(copy[l])));
  for (const idioma of idiomas) {
    for (const chave of todas) {
      if (!(chave in copy[idioma])) erros.push(`${relativo(js)}: a chave "${chave}" falta no ${idioma}`);
    }
  }
}

if (erros.length) {
  console.error(`\n✗ ${erros.length} problema(s):\n`);
  for (const e of erros) console.error(`  · ${e}`);
  process.exit(1);
}
console.log('✓ Verificações estáticas passaram.');
