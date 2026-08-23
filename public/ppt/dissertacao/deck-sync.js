/**
 * deck-sync.js — sincronização de apresentação entre dispositivos.
 *
 * Permite controlar a apresentação a partir de um dispositivo (ex.: o
 * celular) e refletir a navegação em tempo real em todos os outros que
 * tenham a mesma apresentação aberta (ex.: o computador do projetor),
 * inclusive em tela cheia.
 *
 * Como funciona
 * -------------
 * O site é estático (GitHub Pages), então não há servidor próprio. Para que
 * dispositivos em redes diferentes conversem, usamos um "relay" pub/sub: um
 * broker MQTT público gratuito, acessado por WebSocket seguro (wss://). Cada
 * sessão tem uma "sala" identificada por um código aleatório (um tópico
 * MQTT). Só quem tem o código recebe as mensagens daquela sala.
 *
 *   📱 publica {slide:N}  ──►  ☁️ broker  ──►  🖥️ recebe e navega
 *
 * O pareamento é por QR code: o dispositivo que inicia a sessão mostra um QR
 * com a URL da sala; os outros escaneiam e entram automaticamente.
 *
 * Modelo simétrico: qualquer dispositivo conectado controla todos os outros.
 * O que sincroniza: índice do slide (autoritativo e idempotente) + os passos
 * internos de slides interativos (evento `deck:advance`).
 *
 * Transporte agnóstico
 * --------------------
 * A camada de rede está isolada em `createMqttTransport()`. Para trocar por
 * Firebase/Ably/etc. basta implementar o mesmo contrato:
 *   transport.connect(room, { message(obj), status(str) })
 *   transport.publish(obj)
 *   transport.close()
 * e apontar `makeTransport` para a nova implementação.
 *
 * Integração com <deck-stage>
 * ---------------------------
 * Usa só a API pública do componente:
 *   - evento `slidechange` (detail.index / .total / .reason) para detectar
 *     navegação local e difundi-la;
 *   - evento `deck:advance` (detail.dir) para os passos internos;
 *   - métodos `goTo(i)`, `next()`, `prev()` para aplicar comandos remotos.
 * Um guard (`applyingRemote`) evita o eco/loop de retransmissão.
 */

(() => {
  'use strict';
  if (window.__deckSyncLoaded) return;
  window.__deckSyncLoaded = true;

  // ── Configuração ────────────────────────────────────────────────────────
  const CFG = {
    // Brokers MQTT públicos (sem cadastro), tentados em paralelo — o primeiro
    // que conectar vence. Portas diferentes (8084/8884) aumentam a chance de
    // passar quando o firewall de uma rede bloqueia uma porta não-padrão.
    // (Nenhum broker público oferece a porta 443; redes que só liberam 443
    //  precisam do plano alternativo — ver README/observações.)
    brokerUrls: [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt',
    ],
    // Prefixo único do tópico para não colidir com outros usuários do broker.
    topicPrefix: 'kielima-apresentacoes',
    mqttCdn: 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js',
    qrCdn: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    PROTOCOL: 1,
    HEARTBEAT_MS: 8000,
    PEER_TTL_MS: 22000,
    CONNECT_TIMEOUT_MS: 12000,
  };

  // ── Utilitários ───────────────────────────────────────────────────────────
  const uid = () => Math.random().toString(36).slice(2, 10);
  const roomCode = () => Math.random().toString(36).slice(2, 7); // 5 chars

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Reutiliza uma tag já presente (qrcode.min.js, por ex., já é
      // dependência da página).
      const existing = Array.from(document.scripts).find((s) => s.src === src);
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('load fail: ' + src)));
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.addEventListener('load', () => { s.dataset.loaded = '1'; resolve(); });
      s.addEventListener('error', () => reject(new Error('load fail: ' + src)));
      document.head.appendChild(s);
    });
  }

  // ── Transporte: MQTT sobre WebSocket ──────────────────────────────────────
  function createMqttTransport() {
    let client = null;
    let topic = null;
    let handlers = null;
    let pending = [];        // clients em corrida durante a descoberta
    let activeUrl = null;

    function attachWinner(c) {
      client = c;
      activeUrl = c.__url;
      try { console.info('[deck-sync] conectado via', activeUrl); } catch (_) {}
      // Reabilita a reconexão automática só no vencedor (durante a corrida
      // ela ficou desligada para o timeout/erro decidir rápido).
      try { c.options.reconnectPeriod = 2500; } catch (_) {}
      c.on('reconnect', () => handlers.status('connecting'));
      c.on('close', () => handlers.status('disconnected'));
      c.on('offline', () => handlers.status('disconnected'));
      c.on('error', () => handlers.status('error'));
      c.on('message', (t, payload) => {
        if (t !== topic) return;
        try { handlers.message(JSON.parse(payload.toString())); } catch (_) {}
      });
      c.subscribe(topic, { qos: 0 }, () => {});
      handlers.status('connected');
    }

    return {
      async connect(room, h) {
        handlers = h;
        if (!window.mqtt) await loadScript(CFG.mqttCdn);
        topic = CFG.topicPrefix + '/' + room;
        handlers.status('connecting');

        let settled = false;
        let errors = 0;
        const urls = CFG.brokerUrls;

        // Corrida paralela: abre todos os brokers ao mesmo tempo; o primeiro
        // que conectar vence e os demais são encerrados. Cobre o caso de um
        // broker/porta estar bloqueado ou fora do ar sem esperar em série.
        pending = urls.map((url) => {
          let c;
          try {
            c = window.mqtt.connect(url, {
              clientId: 'deck-' + uid(),
              reconnectPeriod: 0,        // sem auto-reconnect durante a corrida
              connectTimeout: CFG.CONNECT_TIMEOUT_MS,
              clean: true,
              keepalive: 30,
            });
          } catch (e) { return null; }
          c.__url = url;
          c.on('connect', () => {
            if (settled) { try { c.end(true); } catch (_) {} return; }
            settled = true;
            // encerra os perdedores
            pending.forEach((o) => { if (o && o !== c) { try { o.end(true); } catch (_) {} } });
            pending = [];
            attachWinner(c);
          });
          c.on('error', (err) => {
            try { console.warn('[deck-sync] falha no broker', url, err && err.message); } catch (_) {}
            if (!settled) { errors++; if (errors >= urls.length) handlers.status('error'); }
          });
          return c;
        });

        // Rede pode aceitar o TCP mas o firewall/proxy segurar o handshake —
        // garante um veredito de erro mesmo sem 'error' de todos.
        setTimeout(() => {
          if (!settled) {
            try { console.warn('[deck-sync] tempo esgotado — nenhum broker conectou (porta bloqueada pela rede?)'); } catch (_) {}
            handlers.status('error');
          }
        }, CFG.CONNECT_TIMEOUT_MS + 1000);
      },
      publish(obj) {
        if (client && client.connected) {
          try { client.publish(topic, JSON.stringify(obj), { qos: 0 }); } catch (_) {}
        }
      },
      close() {
        pending.forEach((o) => { if (o) { try { o.end(true); } catch (_) {} } });
        pending = [];
        if (client) { try { client.end(true); } catch (_) {} client = null; }
      },
    };
  }

  // Ponto único de troca de transporte (Firebase/Ably/etc. entrariam aqui).
  const makeTransport = createMqttTransport;

  // ── Controlador de sincronização ──────────────────────────────────────────
  const Sync = {
    deck: null,
    transport: null,
    myId: uid(),
    room: null,
    status: 'idle',          // idle | connecting | connected | disconnected | error
    applyingRemote: false,   // guard anti-eco ao aplicar comando remoto
    currentIndex: 0,
    total: 1,
    peers: new Map(),        // id -> lastSeen ts
    seen: new Set(),         // ids já cumprimentados (evita ping-pong de hello)
    appEcho: new Map(),      // channel -> {j,ts} do último estado aplicado (anti-eco)
    heartbeat: null,
    prune: null,
    ui: null,

    init() {
      this.deck = document.querySelector('deck-stage');
      if (!this.deck) return;
      this.ui = createUI(this);

      // Difunde a navegação local. Ignora a montagem inicial ('init') — um
      // dispositivo que (re)entra não deve arrastar os outros; em vez disso
      // pede o estado atual via 'request' ao conectar.
      document.addEventListener('slidechange', (e) => {
        const d = e.detail || {};
        if (typeof d.index === 'number') this.currentIndex = d.index;
        if (typeof d.total === 'number') this.total = d.total;
        this.ui.refresh();
        if (this.applyingRemote) return;
        if (d.reason === 'init') return;
        this.publish({ t: 'state', index: this.currentIndex, total: this.total });
      });

      // Passos internos de slides interativos (walkthroughs por fragmento).
      document.addEventListener('deck:advance', (e) => {
        if (this.applyingRemote) return;
        const dir = e.detail && e.detail.dir;
        if (dir === 1 || dir === -1) this.publish({ t: 'advance', dir });
      });

      // Ponte para mini-apps embutidos em <iframe> (ex.: o mapa do ced-map).
      // Apps same-origin anunciam seu estado ao host via postMessage; o host
      // difunde para a sala e reentrega aos apps dos outros dispositivos.
      //
      // Contrato de mensagens (campo __deckSync:1 identifica o canal):
      //   app  → host:  { __deckSync:1, from:'app',  channel:'<nome>', payload:<qualquer> }
      //   host → app :  { __deckSync:1, from:'host', type:'apply', channel, payload, remote:true }
      //                 { __deckSync:1, from:'host', type:'request' }   // reanuncie seu estado
      //
      // O app deve aplicar 'apply' SEM reanunciar (para não criar loop entre
      // dispositivos); ainda assim o host filtra o eco imediato por
      // (channel, payload) recente. Ao receber 'request', o app reanuncia seu
      // estado atual — é assim que um dispositivo que entra no meio recupera
      // o estado do mapa. A própria página (sem iframe) pode usar o evento
      // `deck-sync:app` e o método DeckSync.broadcastApp(channel, payload).
      window.addEventListener('message', (e) => this.onAppMessage(e));

      // Auto-conexão se a página foi aberta via QR (?room=CODE).
      const params = new URLSearchParams(location.search);
      const r = params.get('room');
      if (r) this.start(r);
    },

    publish(obj) {
      if (!this.transport || this.status !== 'connected') return;
      obj.v = CFG.PROTOCOL;
      obj.id = this.myId;
      this.transport.publish(obj);
    },

    async start(room) {
      if (this.transport) return; // já em sessão
      this.room = room || roomCode();
      // Reflete a sala na URL para que um reload reentre na mesma sessão,
      // preservando o hash do slide que o deck-stage mantém.
      try {
        const url = location.pathname + '?room=' + this.room + location.hash;
        history.replaceState(null, '', url);
      } catch (_) {}

      this.transport = makeTransport();
      this.ui.refresh();
      try {
        await this.transport.connect(this.room, {
          message: (m) => this.onMessage(m),
          status: (s) => this.onStatus(s),
        });
      } catch (err) {
        this.onStatus('error');
        return;
      }

      // Presença + heartbeat.
      this.heartbeat = setInterval(() => {
        this.publish({ t: 'hello' });
      }, CFG.HEARTBEAT_MS);
      this.prune = setInterval(() => {
        const now = Date.now();
        let changed = false;
        this.peers.forEach((ts, id) => {
          if (now - ts > CFG.PEER_TTL_MS) { this.peers.delete(id); this.seen.delete(id); changed = true; }
        });
        if (changed) this.ui.refresh();
      }, 4000);
    },

    stop() {
      if (this.heartbeat) clearInterval(this.heartbeat);
      if (this.prune) clearInterval(this.prune);
      this.heartbeat = this.prune = null;
      if (this.transport) { this.transport.close(); this.transport = null; }
      this.peers.clear();
      this.seen.clear();
      this.room = null;
      this.status = 'idle';
      try {
        history.replaceState(null, '', location.pathname + location.hash);
      } catch (_) {}
      this.ui.refresh();
    },

    onStatus(s) {
      this.status = s;
      if (s === 'connected') {
        // Anuncia presença e pede o estado atual a quem já estiver na sala.
        this.publish({ t: 'hello' });
        this.publish({ t: 'request' });
      }
      this.ui.refresh();
    },

    onMessage(m) {
      if (!m || m.id === this.myId) return; // ignora o próprio eco
      const firstTime = !this.peers.has(m.id);
      this.peers.set(m.id, Date.now());
      if (firstTime) this.ui.refresh();

      switch (m.t) {
        case 'hello':
          // Responde uma única vez a um par novo, para que ele nos conte
          // também — sem ping-pong (heartbeats subsequentes não respondem).
          if (!this.seen.has(m.id)) { this.seen.add(m.id); this.publish({ t: 'hello' }); }
          break;
        case 'request':
          this.publish({ t: 'state', index: this.currentIndex, total: this.total });
          this.relayRequestToApps(); // apps locais reanunciam seu estado p/ o novo par
          break;
        case 'state':
          if (typeof m.total === 'number') this.total = m.total;
          this.applyState(m.index);
          break;
        case 'advance':
          this.applyAdvance(m.dir);
          break;
        case 'app':
          this.relayToApps(m.channel, m.payload);
          break;
        case 'laser':
          // Ponteiro/laser da caneta — alta frequência, canal próprio e leve
          // (não reentrega a iframes). deck-laser.js escuta este evento.
          try { document.dispatchEvent(new CustomEvent('deck-sync:laser', { detail: m })); } catch (_) {}
          break;
      }
    },

    applyState(index) {
      if (typeof index !== 'number' || index === this.currentIndex) return;
      this.applyingRemote = true;
      try { this.deck.goTo(index); } finally { this.applyingRemote = false; }
    },

    applyAdvance(dir) {
      if (dir !== 1 && dir !== -1) return;
      this.applyingRemote = true;
      try { dir === 1 ? this.deck.next() : this.deck.prev(); }
      finally { this.applyingRemote = false; }
    },

    // ── Ponte de mini-apps em <iframe> ───────────────────────────────────────
    // Estado anunciado por um app filho → difunde para a sala.
    onAppMessage(e) {
      const d = e.data;
      if (!d || d.__deckSync !== 1 || d.from !== 'app') return;
      const channel = d.channel || '';
      const j = JSON.stringify(d.payload);
      // Ignora o eco imediato: estado que acabámos de aplicar e o app
      // reanunciou em seguida (mesmo (channel,payload) dentro de ~600ms).
      const last = this.appEcho.get(channel);
      if (last && last.j === j && (Date.now() - last.ts) < 600) return;
      this.publish({ t: 'app', channel, payload: d.payload });
    },

    // Estado recebido da sala → entrega aos apps filhos e à própria página.
    relayToApps(channel, payload) {
      this.appEcho.set(channel, { j: JSON.stringify(payload), ts: Date.now() });
      document.querySelectorAll('iframe').forEach((f) => {
        try {
          f.contentWindow && f.contentWindow.postMessage(
            { __deckSync: 1, from: 'host', type: 'apply', channel, payload, remote: true }, '*');
        } catch (_) {}
      });
      try {
        document.dispatchEvent(new CustomEvent('deck-sync:app',
          { detail: { channel, payload, remote: true } }));
      } catch (_) {}
    },

    // Pede aos apps filhos que reanunciem seu estado (novo par entrou).
    relayRequestToApps() {
      document.querySelectorAll('iframe').forEach((f) => {
        try {
          f.contentWindow && f.contentWindow.postMessage(
            { __deckSync: 1, from: 'host', type: 'request' }, '*');
        } catch (_) {}
      });
    },

    // API pública: a própria página pode difundir um estado de app sem iframe.
    broadcastApp(channel, payload) { this.publish({ t: 'app', channel, payload }); },

    // API pública: difunde um quadro do ponteiro/laser (usado por deck-laser.js).
    sendLaser(msg) { this.publish(Object.assign({ t: 'laser' }, msg)); },

    peerCount() { return this.peers.size + 1; }, // +1 = este dispositivo

    joinUrl() {
      return location.origin + location.pathname + '?room=' + (this.room || '');
    },
  };

  // ── Interface (lançador + painel) ──────────────────────────────────────────
  // Texto sempre ≥ 24px (regra do projeto). Ícone do lançador é SVG (sem
  // font-size). Mantém-se acima dos controles do deck; encolhe em tela cheia.
  function createUI(sync) {
    const STYLE = `
      .ds-root { position: fixed; inset: 0; pointer-events: none; z-index: 2147483300;
        font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; }
      .ds-launch {
        position: fixed; top: 16px; right: 16px;
        width: 52px; height: 52px; border-radius: 999px;
        background: rgba(15,20,16,0.78); color: #fff;
        border: 1px solid rgba(255,255,255,0.16);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; pointer-events: auto;
        box-shadow: 0 6px 20px rgba(0,0,0,0.35);
        transition: transform .16s ease, background .16s ease, opacity .16s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .ds-launch:hover { background: rgba(15,20,16,0.92); transform: translateY(-1px); }
      .ds-launch svg { width: 24px; height: 24px; display: block; }
      .ds-launch .dot {
        position: absolute; top: 8px; right: 8px;
        width: 12px; height: 12px; border-radius: 999px;
        background: #888; border: 2px solid rgba(15,20,16,0.78);
      }
      .ds-root[data-status="connected"] .dot { background: #3ea568; }
      .ds-root[data-status="connecting"] .dot { background: #f0a04b; animation: ds-pulse 1s infinite; }
      .ds-root[data-status="error"] .dot,
      .ds-root[data-status="disconnected"] .dot { background: #d96b52; }
      @keyframes ds-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

      /* Em tela cheia / modo de apresentação: encolhe para um ponto discreto
         no canto, sem poluir a tela do projetor. */
      .ds-root[data-presenting] .ds-launch {
        width: 16px; height: 16px; top: 12px; right: 12px;
        background: transparent; border: 0; box-shadow: none; cursor: default;
      }
      .ds-root[data-presenting] .ds-launch svg { display: none; }
      .ds-root[data-presenting] .ds-launch .dot { top: 0; right: 0; width: 14px; height: 14px; }
      .ds-root[data-presenting] .ds-backdrop,
      .ds-root[data-presenting] .ds-panel { display: none !important; }

      .ds-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        pointer-events: auto; display: none;
      }
      .ds-backdrop[data-open] { display: block; }

      .ds-panel {
        position: fixed; top: 80px; right: 16px;
        width: min(420px, calc(100vw - 32px));
        max-height: calc(100vh - 96px); overflow-y: auto;
        background: #161b16; color: #f8f8f8;
        border: 1px solid rgba(255,255,255,0.14); border-radius: 16px;
        box-shadow: 0 18px 48px rgba(0,0,0,0.5);
        padding: 28px; pointer-events: auto; display: none;
        font-size: 24px; line-height: 1.45;
      }
      .ds-panel[data-open] { display: block; }
      .ds-panel h2 {
        margin: 0 0 16px; font-family: 'Newsreader', serif; font-weight: 400;
        font-size: 34px; line-height: 1.1;
      }
      .ds-panel p { margin: 0 0 18px; font-size: 24px; color: rgba(248,248,248,0.78); }
      .ds-status {
        display: flex; align-items: center; gap: 12px;
        font-size: 24px; margin-bottom: 20px; font-weight: 500;
      }
      .ds-status .s-dot { width: 16px; height: 16px; border-radius: 999px; background: #888; flex: 0 0 auto; }
      .ds-root[data-status="connected"] .s-dot { background: #3ea568; }
      .ds-root[data-status="connecting"] .s-dot { background: #f0a04b; }
      .ds-root[data-status="error"] .s-dot,
      .ds-root[data-status="disconnected"] .s-dot { background: #d96b52; }

      .ds-qr {
        background: #fff; padding: 16px; border-radius: 12px;
        width: max-content; margin: 0 auto 18px; line-height: 0;
      }
      .ds-qr img, .ds-qr canvas { display: block; width: 220px !important; height: 220px !important; }
      .ds-code {
        text-align: center; font-family: 'JetBrains Mono', monospace;
        font-size: 40px; letter-spacing: 0.12em; font-weight: 600;
        margin-bottom: 8px; color: #3ea568;
      }
      .ds-code-label {
        text-align: center; font-size: 24px; color: rgba(248,248,248,0.6);
        margin-bottom: 22px;
      }
      .ds-btn {
        display: block; width: 100%; box-sizing: border-box;
        appearance: none; border: 0; border-radius: 12px;
        padding: 16px 20px; font: inherit; font-size: 24px; font-weight: 600;
        cursor: pointer; margin-top: 12px; -webkit-tap-highlight-color: transparent;
      }
      .ds-btn.primary { background: #3ea568; color: #06150c; }
      .ds-btn.primary:hover { background: #46b574; }
      .ds-btn.ghost { background: transparent; color: rgba(248,248,248,0.8);
        border: 1px solid rgba(255,255,255,0.18); }
      .ds-btn.ghost:hover { background: rgba(255,255,255,0.06); }
    `;

    const root = document.createElement('div');
    root.className = 'ds-root';
    root.setAttribute('data-status', 'idle');
    const style = document.createElement('style');
    style.textContent = STYLE;

    const launch = document.createElement('button');
    launch.className = 'ds-launch';
    launch.type = 'button';
    launch.setAttribute('aria-label', 'Sincronizar dispositivos');
    launch.setAttribute('title', 'Sincronizar dispositivos');
    launch.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M4 9a8 8 0 0 1 13-3l3 3"/><path d="M20 5v4h-4"/>' +
      '<path d="M20 15a8 8 0 0 1-13 3l-3-3"/><path d="M4 19v-4h4"/></svg>' +
      '<span class="dot"></span>';

    const backdrop = document.createElement('div');
    backdrop.className = 'ds-backdrop';

    const panel = document.createElement('div');
    panel.className = 'ds-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Sincronização de dispositivos');

    root.append(style, launch, backdrop, panel);
    document.body.appendChild(root);

    let open = false;
    let renderedView = null; // 'idle' | 'active' — qual estrutura está no DOM
    let statusEl = null;     // span de status atualizado sem reconstruir o painel

    const statusText = () => ({
      idle: 'Desconectado',
      connecting: 'Conectando…',
      connected: 'Conectado',
      disconnected: 'Reconectando…',
      error: 'Falha na conexão',
    }[sync.status] || '—');

    const peersLine = () => {
      if (sync.status !== 'connected') return '';
      const others = sync.peerCount() - 1;
      if (others <= 0) return ' · Aguardando outro dispositivo…';
      return ' · ' + others + (others === 1
        ? ' outro dispositivo conectado'
        : ' outros dispositivos conectados');
    };

    function renderQR(text) {
      const box = panel.querySelector('.ds-qr');
      if (!box) return;
      const draw = () => {
        if (typeof window.QRCode === 'undefined') { setTimeout(draw, 200); return; }
        box.innerHTML = '';
        new window.QRCode(box, {
          text, width: 220, height: 220,
          colorDark: '#0f1410', colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      };
      if (typeof window.QRCode === 'undefined') {
        loadScript(CFG.qrCdn).then(draw).catch(() => {});
      } else { draw(); }
    }

    function buildIdle() {
      panel.innerHTML =
        '<h2>Sincronizar dispositivos</h2>' +
        '<p>Abra esta apresentação no celular e no computador do projetor e ' +
        'controle os dois em tempo real. Inicie a sessão e escaneie o QR code ' +
        'no outro dispositivo.</p>' +
        '<button class="ds-btn primary" data-act="start">Iniciar sincronização</button>';
      renderedView = 'idle';
      statusEl = null;
    }

    function buildActive() {
      panel.innerHTML =
        '<h2>Sincronização ativa</h2>' +
        '<div class="ds-status"><span class="s-dot"></span>' +
          '<span class="ds-status-text"></span></div>' +
        '<div class="ds-qr"></div>' +
        '<div class="ds-code">' + (sync.room || '').toUpperCase() + '</div>' +
        '<div class="ds-code-label">Escaneie o QR code ou abra a sala neste código</div>' +
        '<button class="ds-btn ghost" data-act="stop">Encerrar sincronização</button>';
      renderedView = 'active';
      statusEl = panel.querySelector('.ds-status-text');
      renderQR(sync.joinUrl());
    }

    // Atualiza só o texto de status (chamado a cada slidechange / mudança de
    // presença) sem reconstruir o painel — preserva o QR já desenhado.
    function render() {
      root.setAttribute('data-status', sync.status);
      if (!open) return;
      const view = (!sync.transport && sync.status === 'idle') ? 'idle' : 'active';
      if (view !== renderedView) { view === 'idle' ? buildIdle() : buildActive(); }
      if (view === 'active' && statusEl) statusEl.textContent = statusText() + peersLine();
    }

    function toggle(force) {
      open = typeof force === 'boolean' ? force : !open;
      panel.toggleAttribute('data-open', open);
      backdrop.toggleAttribute('data-open', open);
      if (open) { renderedView = null; render(); } // reconstrói fresco ao abrir
    }

    launch.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    backdrop.addEventListener('click', (e) => { e.stopPropagation(); toggle(false); });
    panel.addEventListener('click', (e) => {
      const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if (!act) return;
      e.stopPropagation();
      if (act === 'start') { sync.start(); render(); }
      else if (act === 'stop') { sync.stop(); }
    });

    // Modo de apresentação (tela cheia): o deck posta __omelette_presenting.
    window.addEventListener('message', (e) => {
      const d = e.data;
      if (d && typeof d.__omelette_presenting === 'boolean') {
        root.toggleAttribute('data-presenting', d.__omelette_presenting);
        if (d.__omelette_presenting) toggle(false);
      }
    });

    return { refresh: render, toggle };
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Sync.init());
  } else {
    Sync.init();
  }
  window.DeckSync = Sync; // exposto para depuração
})();
