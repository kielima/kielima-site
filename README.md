# kielima.com

Site pessoal de [Kiê Lima](https://kielima.com) — engenheira civil, mestranda em
Sistemas de Infraestrutura Urbana na PUC-Campinas, pesquisando Avaliação de Ciclo de
Vida de materiais cimentícios.

Quatro páginas, todas trilíngues (PT / EN / 中文) e com tema claro e escuro:

| Página | URL |
|---|---|
| Home — trajetória, pesquisa, publicações, contato | [`kielima.com`](https://kielima.com) |
| Índice de apresentações | [`kielima.com/ppt`](https://kielima.com/ppt) |
| Cartão de visita digital, com vCard | [`kielima.com/cartao`](https://kielima.com/cartao) |
| Instruções de plantio do cartão em papel semente | [`kielima.com/cartao/papel-semente`](https://kielima.com/cartao/papel-semente) |

Sob `/ppt` ficam também as apresentações em si, que são páginas à parte — não
seguem o sistema de design do site nem são traduzidas. Ver "Apresentações" abaixo.

O cartão impresso é feito de papel semente — celulose reciclada com sementes prensadas
na folha. O QR nele aponta para `/cartao`, e a página de plantio explica o que fazer
com o cartão depois da conversa.

## Sem build, sem framework, sem dependência em runtime

HTML, CSS e JavaScript escritos à mão. Não há `package.json`, bundler, nem etapa de
compilação: o que está em `public/` é exatamente o que é servido.

A única requisição a terceiros é o Google Fonts, para Newsreader, Geist e JetBrains
Mono.

```
.
├── wrangler.jsonc          configuração do Worker (assets estáticos)
└── public/
    ├── index.html          → /
    ├── ppt/
    │   ├── index.html      → /ppt          (índice, no sistema de design do site)
    │   └── dissertacao/    → /ppt/dissertacao   (a apresentação, autocontida)
    ├── cartao/
    │   ├── index.html      → /cartao
    │   └── papel-semente/
    │       └── index.html  → /cartao/papel-semente
    └── assets/
        ├── base.css            tokens de design, tema claro/escuro, elementos comuns
        ├── home.css            layout da home
        ├── ppt.css             layout do índice de apresentações
        ├── cartao.css          layout do cartão
        ├── papel-semente.css   layout da página de plantio e animação dos canteiros
        ├── i18n.js             troca PT/EN/ZH, persistida entre as páginas
        ├── theme.js            alternância de tema, com o valor salvo aplicado
        │                       antes da primeira pintura para não piscar
        ├── particles.js        campo de partículas WebGL do cartão
        ├── home.js             conteúdo da home nos três idiomas
        ├── ppt.js              lista de apresentações nos três idiomas
        ├── cartao.js           conteúdo do cartão, vCard, cópia de e-mail
        ├── papel-semente.js    conteúdo e geração dos canteiros
        └── favicon.svg
```

## Apresentações

`/ppt` é o índice; cada apresentação é uma pasta autocontida ao lado dele. Elas
vieram do repositório `kielima/apresentacoes`, aposentado em agosto de 2026, onde
eram publicadas em `kielima.github.io/apresentacoes`.

As apresentações **não** seguem as convenções do resto do site, de propósito: têm
CSS e fontes próprios, são só em português, não têm tema claro, e carregam React,
Babel, Plotly, 3Dmol e pdf.js de CDNs externos. São documentos fechados, com data —
uma apresentação de qualificação não é reescrita depois de apresentada.

Por isso as verificações de navegador cobrem `/ppt`, mas não as apresentações em si:
no CI, aqueles CDNs reprovariam o site por um problema que não é dele. Ver o
comentário em `scripts/navegador.mjs`.

⚠️ **Texto de apresentação nunca abaixo de 24px** — regra herdada do repositório
antigo, registrada em `CLAUDE.md`. Vale dentro de `public/ppt/*/`, não no resto do
site, que usa rótulos monoespaçados de 11px.

### Detalhes que talvez interessem

**Partículas em WebGL puro.** O fundo animado do cartão nasceu de um protótipo em
React que importava a biblioteca `ogl` de um CDN. Foi reescrito em WebGL direto —
mesmos shaders, mesma câmera, mesmos parâmetros — em cerca de 300 linhas sem
dependência alguma. Ele respeita `prefers-reduced-motion` e pausa quando a aba sai de
foco.

**Idioma e tema como estado compartilhado.** Ambos vivem em `localStorage` e
acompanham o visitante entre as três páginas. O tema é aplicado por um script inline
no `<head>`, antes da primeira pintura, para não haver o clarão branco típico de quem
resolve tema depois da montagem.

**Conteúdo separado da estrutura.** Todo o texto está em objetos `COPY` no JavaScript
de cada página, com uma chave por idioma. O HTML só marca onde cada chave entra, via
`data-i18n`. Traduzir ou corrigir um texto não exige tocar em marcação.

⚠️ **A versão em 中文 foi escrita por IA e ainda não passou por revisão de falante
nativo.** Correções são bem-vindas.

## Rodar localmente

Qualquer servidor estático serve. Sem instalação:

```bash
cd public
python3 -m http.server 8765
# http://127.0.0.1:8765/
```

## Publicar

Hospedado no [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)
como Worker de assets estáticos. Requisições a arquivos estáticos não são cobradas.

Com o repositório conectado ao Cloudflare, todo push para `main` publica sozinho. Para
publicar da linha de comando:

```bash
npx wrangler@latest deploy
```

## Licença

Código sob [MIT](LICENSE). O conteúdo — textos, trajetória profissional e identidade
visual — é de Kiê Lima e não está coberto pela licença do código.
