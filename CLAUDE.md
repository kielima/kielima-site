# Regras do projeto — kielima.com

## Tipografia das apresentações (`public/ppt/*/`)

- **Tamanho mínimo de texto: 24px.** Nunca criar nem alterar texto de uma
  apresentação para um tamanho de fonte inferior a 24px. Vale para `font-size` em
  CSS, atributos inline e valores em `rem`/`em` que resultem em menos de 24px.
  Uma apresentação é lida de longe, projetada; o que serve numa página lida a
  50 cm não serve numa sala.

  Regra herdada do repositório `kielima/apresentacoes`, aposentado em agosto de
  2026, quando as apresentações passaram para `public/ppt/`.

- **Não vale para o resto do site.** A home, o cartão, o papel semente e o índice
  em `/ppt` usam os rótulos monoespaçados de 11px definidos em
  `public/assets/base.css`. São páginas lidas na mão, não projetadas.

## O que é código nosso e o que é documento fechado

`public/index.html`, `public/cartao/`, `public/ppt/index.html` e `public/assets/`
são o site: sistema de design compartilhado (`base.css`), texto separado da
estrutura em objetos `COPY` com uma chave por idioma, PT/EN/ZH sempre em paridade,
tema claro e escuro.

`public/ppt/<apresentacao>/` são documentos fechados, com data. Têm CSS e fontes
próprios, são só em português e carregam bibliotecas de CDNs externos. Não
uniformizar com o resto do site, não traduzir, não refatorar sem motivo: uma
apresentação já apresentada não se reescreve.

`public/foguinho/` é a mesma categoria de exceção, por outro motivo: não é
documento, é um app (PWA "pensei em você" com amigos, back-end em Supabase,
repositório-fonte `kielima/foguinho`). Reusa a paleta/tipografia do site
(Newsreader/Geist/JetBrains Mono, tokens duplicados do `base.css` — não
importados, porque o app também é publicável sozinho fora daqui), mas não
segue o i18n (só português), tem manifest/service worker e config.js
próprios, e não entra em `npm run navegador` — mesma lógica do
`/ppt/<apresentacao>/`: código externo ao site não deve reprovar o CI do
site por um problema que não é dele. Fica fora da navegação (home/tree) de
propósito: é uso pessoal, não conteúdo do portfólio.

**Ícone do app (`public/foguinho/icons/`): monograma "KL".** Especificação
completa em `vault-carreira/02_BRANDING PESSOAL/logotipo.md` (repositório
separado, fora deste). Resumo: Newsreader peso 300, K reto + L itálico
(variante do monograma original, que tem as duas letras em itálico),
`letter-spacing: -0.03em`. ⚠️ **Se algum dia precisar re-renderizar esse
ícone (ou qualquer texto com webfont) via Chromium headless neste ambiente:**
`<link>` para `fonts.googleapis.com` dentro da página falha silenciosamente
atrás do proxy deste sandbox (a fonte cai num fallback do sistema sem erro
visível — foi exatamente o que gerou a primeira versão errada do ícone,
peso 400 em vez de 300). Baixe o `.woff2` via `curl` (que não passa pelo
mesmo bloqueio) e referencie o arquivo local num `@font-face` — nunca
confie num screenshot de webfont carregada por `<link>` neste ambiente sem
essa checagem.

## Antes de abrir um PR

`npm run testar` (verificações estáticas + navegador). Todo PR que passa no CI é
mesclado sozinho e vai ao ar sem revisão humana — o portão do site é o CI e mais
nada.
