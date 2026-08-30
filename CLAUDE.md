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
repositório-fonte `kielima/foguinho`). Não segue o sistema de design nem o
i18n do site, tem manifest/service worker e config.js próprios, e não entra
em `npm run navegador` — mesma lógica do `/ppt/<apresentacao>/`: código
externo ao site não deve reprovar o CI do site por um problema que não é
dele. Fica fora da navegação (home/tree) de propósito: é uso pessoal, não
conteúdo do portfólio.

## Antes de abrir um PR

`npm run testar` (verificações estáticas + navegador). Todo PR que passa no CI é
mesclado sozinho e vai ao ar sem revisão humana — o portão do site é o CI e mais
nada.
