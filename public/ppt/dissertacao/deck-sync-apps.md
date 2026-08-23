# Sincronizar mini-apps embutidos (iframe) via deck-sync

A apresentação sincroniza a **navegação de slides** entre dispositivos
(`deck-sync.js`). Mini-apps embutidos por `<iframe>` — como o mapa
`ced-map` do slide 7 — têm estado próprio e precisam cooperar com a ponte
para que a interação (zoom, pan, camadas, filtros, slider, popups) também
apareça em tempo real nas outras telas.

A ponte já existe **do lado da apresentação** (em `deck-sync.js`). Falta só
o app embutido falar o protocolo abaixo. Isto vale para qualquer app
embutido por `<iframe>`, inclusive de outra origem: o host manda com
`targetOrigin: '*'` e não filtra a origem das mensagens que recebe. Desde
que a apresentação passou a ser servida em `https://kielima.com/ppt/`
(agosto de 2026), o `ced-map` — que continua em `https://kielima.github.io/ced-map/`
— é justamente um caso desses.

## Protocolo

O campo `__deckSync: 1` identifica as mensagens da ponte.

| Direção | Mensagem | Quando |
|---|---|---|
| app → host | `{ __deckSync:1, from:'app', channel:'ced-map', payload:<estado> }` | o usuário mudou algo no app |
| host → app | `{ __deckSync:1, from:'host', type:'apply', channel, payload, remote:true }` | aplicar o estado que veio de outra tela |
| host → app | `{ __deckSync:1, from:'host', type:'request' }` | um dispositivo entrou: reanuncie seu estado atual |

- `host` é a janela da apresentação (`window.parent` de dentro do iframe).
- `payload` é livre — só precisa ser serializável em JSON. Inclua tudo o que
  define a "vista" do app: `center`, `zoom`, camadas ativas, nível, ano do
  slider, busca, marcador/popup aberto.
- **Anti-loop:** ao aplicar um `apply`, NÃO reanuncie (não dispare um
  `from:'app'` em resposta). O host ainda filtra o eco imediato por
  `(channel, payload)` repetido em ~600 ms, mas suprimir no app é o correto.

## Snippet de referência (colar no ced-map)

Adapte `readState` / `applyState` à API real do app. Exemplo para um mapa
[Leaflet] com a instância em `window.map` e algumas camadas/controles:

```js
(function () {
  var CHANNEL = 'ced-map';
  var applying = false;        // guard anti-loop ao aplicar estado remoto
  var pending = null, timer = null;

  // 1) Lê a "vista" atual do app como um objeto serializável.
  function readState() {
    var c = map.getCenter();
    return {
      center: [+c.lat.toFixed(5), +c.lng.toFixed(5)],
      zoom: map.getZoom(),
      // …adicione: camadas ligadas, nível (nacional/estadual/municipal),
      //   ano do slider temporal, texto da busca, id do popup aberto, etc.
    };
  }

  // 2) Aplica um estado recebido de outra tela, sem reanunciar.
  function applyState(s) {
    if (!s) return;
    applying = true;
    try {
      if (s.center && typeof s.zoom === 'number') {
        map.setView(s.center, s.zoom, { animate: true });
      }
      // …reproduza aqui as mesmas camadas/filtros/slider/popup do readState.
    } finally {
      // setView dispara 'moveend' de forma assíncrona; libera no próximo tick.
      setTimeout(function () { applying = false; }, 0);
    }
  }

  // 3) Anuncia (com leve debounce para pan/zoom contínuos).
  function announce() {
    if (applying) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      parent.postMessage({ __deckSync: 1, from: 'app', channel: CHANNEL, payload: readState() }, '*');
    }, 120);
  }

  // 4) Liga os eventos do app que representam "interação".
  map.on('moveend zoomend', announce);
  // …map.on para toggles de camada, mudança de nível, slider, busca, popupopen…

  // 5) Recebe comandos do host.
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.__deckSync !== 1 || d.from !== 'host') return;
    if (d.type === 'apply' && d.channel === CHANNEL) applyState(d.payload);
    else if (d.type === 'request') announce();   // novo dispositivo entrou
  });
})();
```

[Leaflet]: https://leafletjs.com/

## Como testar

1. Abra a apresentação em dois dispositivos/abas e pareie pelo QR (slide
   com o botão de sincronização).
2. Vá ao slide do mapa nos dois.
3. Mova/zoom/troque camadas em um → o outro deve seguir em ~100–300 ms.
4. Entre com um terceiro dispositivo no meio: ele deve receber o estado
   atual do mapa (via `request` → `announce`).
