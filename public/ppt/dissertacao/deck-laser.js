/**
 * deck-laser.js — ponteiro a laser com a S Pen (ou qualquer caneta/stylus),
 * sincronizado entre dispositivos via deck-sync.
 *
 * O que faz
 * ---------
 * Reconhece a caneta pelos Pointer Events (`pointerType === 'pen'`) — o que
 * inclui a S Pen da Samsung e o Apple Pencil — e transforma o traçado dela
 * num ponteiro a laser vermelho que brilha e desvanece em ~1,1s, como o
 * laser do PowerPoint. Quando a caneta apenas paira (hover), mostra um ponto
 * de laser; quando toca e arrasta, deixa um rastro temporário.
 *
 * Os pontos são difundidos pela mesma sala do deck-sync, então o que você
 * escreve no tablet/celular aparece em tempo real no projetor — inclusive em
 * tela cheia. O dedo continua navegando normalmente; só a caneta vira laser.
 *
 * Coordenadas
 * -----------
 * Os pontos são normalizados (0..1) em relação ao canvas do slide
 * (1920×1080, obtido de `deck.shadowRoot .canvas`), de modo que aparecem no
 * mesmo lugar relativo em telas de tamanhos e proporções diferentes.
 *
 * Protocolo (via DeckSync.sendLaser / evento `deck-sync:laser`)
 * ------------------------------------------------------------
 *   { k:'s' }                 início de traço
 *   { k:'m', p:[[x,y],...] }  pontos do traço (em lote, ~25 Hz)
 *   { k:'e' }                 fim de traço
 *   { k:'h', p:[x,y] }        ponto de hover (caneta pairando)
 *   { k:'c' }                 limpar (reservado)
 * O deck-sync injeta o id do remetente, usado para separar traços de
 * dispositivos diferentes.
 */

(() => {
  'use strict';
  if (window.__deckLaserLoaded) return;
  window.__deckLaserLoaded = true;

  const CFG = {
    TTL: 1100,        // ms de vida de cada ponto do rastro (laser desvanece)
    HOVER_TTL: 220,   // ms de vida do ponto de hover
    FLUSH_MS: 40,     // ~25 Hz de envio dos pontos do traço
    HOVER_MS: 55,     // throttle do hover
    PEN_GRACE: 700,   // janela p/ suprimir o "click" gerado por toque de caneta
    // Vermelho de laser: núcleo intenso + brilho. (rgb)
    CORE: '255,45,45',
    GLOW: '255,70,70',
    TIP: '255,235,235',
  };

  const now = () => performance.now();
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  // ── Estado ────────────────────────────────────────────────────────────────
  // Cada traço: { origin, pts:[{x,y,t}] }. origin = 'local' ou id do remetente.
  const strokes = [];
  const currentByOrigin = new Map(); // origin -> traço aberto
  const hoverByOrigin = new Map();   // origin -> {x,y,t}

  let drawing = false;     // caneta local em contato
  let pending = [];        // pontos locais aguardando envio em lote
  let lastFlush = 0, lastHoverSent = 0, lastPenTs = -1e9;

  // Permite testar com o mouse no desktop: DeckLaser.allowMouse = true.
  const API = { allowMouse: false };
  window.DeckLaser = API;

  const deck = () => document.querySelector('deck-stage');

  // Retângulo do canvas do slide (CSS px, relativo à viewport).
  function slideRect() {
    const d = deck();
    const c = d && d.shadowRoot && d.shadowRoot.querySelector('.canvas');
    if (c) { const r = c.getBoundingClientRect(); if (r.width && r.height) return r; }
    return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  }

  function isPen(e) {
    return e.pointerType === 'pen' || (API.allowMouse && e.pointerType === 'mouse');
  }
  function overUI(e) {
    const t = e.target;
    return !!(t && t.closest && t.closest('.ds-root'));
  }
  function norm(e) {
    const r = slideRect();
    return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
  }

  // ── Canvas overlay ──────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('data-noncommentable', '');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;' +
    'touch-action:none;z-index:2147483200;';
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let capturedId = null;   // pointerId capturado durante o traço da caneta

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function mount() {
    if (!canvas.isConnected) document.body.appendChild(canvas);
    resize();
  }

  // ── Traços ────────────────────────────────────────────────────────────────
  function newStroke(origin) {
    const s = { origin, pts: [] };
    strokes.push(s);
    currentByOrigin.set(origin, s);
    return s;
  }
  function addPoint(origin, x, y) {
    let s = currentByOrigin.get(origin);
    if (!s) s = newStroke(origin);
    s.pts.push({ x, y, t: now() });
  }
  function endStroke(origin) { currentByOrigin.delete(origin); }

  function send(msg) {
    if (window.DeckSync && typeof window.DeckSync.sendLaser === 'function') {
      window.DeckSync.sendLaser(msg);
    }
  }
  function flush(force) {
    if (!pending.length) return;
    if (!force && (now() - lastFlush) < CFG.FLUSH_MS) return;
    send({ k: 'm', p: pending });
    pending = [];
    lastFlush = now();
  }

  // ── Entrada da caneta ───────────────────────────────────────────────────────
  // Ao tocar, capturamos o ponteiro no overlay (que passa a pointer-events:auto
  // com touch-action:none). Sem isso, ao arrastar a caneta em contato o
  // navegador (Android/Samsung) interpreta como rolagem/gesto e dispara
  // pointercancel — o traço andava poucos mm e parava. A captura redireciona
  // todos os eventos da caneta para o overlay e suprime o gesto.
  function grabPointer(e) {
    try {
      canvas.style.pointerEvents = 'auto';
      canvas.setPointerCapture(e.pointerId);
      capturedId = e.pointerId;
    } catch (_) {}
  }
  function releasePointer() {
    if (capturedId != null) { try { canvas.releasePointerCapture(capturedId); } catch (_) {} }
    capturedId = null;
    canvas.style.pointerEvents = 'none';
  }

  // Desativa os gestos de rolagem/zoom do navegador NA RAIZ enquanto a caneta
  // está por perto. Precisa estar ativo ANTES do contato (o navegador decide
  // "isto é scroll" já no toque, pelo touch-action do alvo) — por isso armamos
  // no hover, que a S Pen reporta antes de encostar. Desarma após um tempinho
  // sem eventos de caneta, devolvendo o toque/rolagem normal ao dedo.
  let penIdleTimer = null;
  function armPenSurface() {
    document.documentElement.style.setProperty('touch-action', 'none');
    if (document.body) document.body.style.setProperty('touch-action', 'none');
    if (penIdleTimer) clearTimeout(penIdleTimer);
    penIdleTimer = setTimeout(disarmPenSurface, 1500);
  }
  function disarmPenSurface() {
    if (drawing) return; // nunca desarmar no meio de um traço
    document.documentElement.style.removeProperty('touch-action');
    if (document.body) document.body.style.removeProperty('touch-action');
    penIdleTimer = null;
  }

  function onDown(e) {
    if (!isPen(e) || overUI(e)) return;
    lastPenTs = now();
    drawing = true;
    armPenSurface();
    grabPointer(e);
    newStroke('local');
    const p = norm(e);
    addPoint('local', p.x, p.y);
    pending.push([p.x, p.y]);
    send({ k: 's' });
    flush(true);
    e.preventDefault();
  }
  function onMove(e) {
    if (!isPen(e)) return;
    armPenSurface(); // mantém os gestos desativados enquanto a caneta atua/paira
    if (drawing) {
      lastPenTs = now();
      const p = norm(e);
      addPoint('local', p.x, p.y);
      pending.push([p.x, p.y]);
      e.preventDefault();
    } else {
      // Hover (caneta pairando): ponto de laser, sem rastro. Não mexe em
      // lastPenTs — só o contato da caneta deve suprimir o clique seguinte,
      // para um toque de dedo logo após o hover continuar navegando.
      if (overUI(e)) return;
      const p = norm(e);
      hoverByOrigin.set('local', { x: p.x, y: p.y, t: now() });
      if (now() - lastHoverSent > CFG.HOVER_MS) {
        lastHoverSent = now();
        send({ k: 'h', p: [p.x, p.y] });
      }
    }
  }
  function finishStroke() {
    if (!drawing) return;
    drawing = false;
    flush(true);
    send({ k: 'e' });
    endStroke('local');
  }
  function onUp(e) {
    if (!isPen(e)) return;
    if (drawing) { finishStroke(); e.preventDefault(); }
    releasePointer();
    lastPenTs = now();
  }
  // Se a captura for perdida no meio (alguma plataforma ainda cancela),
  // encerra o traço atual graciosamente em vez de deixá-lo pendurado.
  canvas.addEventListener('lostpointercapture', () => { finishStroke(); releasePointer(); });
  // Suprime o "click" sintetizado por um toque de caneta, para a S Pen não
  // avançar slide / acionar tap-zones enquanto serve de laser.
  function onClick(e) {
    if (overUI(e)) return;
    if (now() - lastPenTs < CFG.PEN_GRACE) { e.stopPropagation(); e.preventDefault(); }
  }

  window.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointermove', onMove, true);
  window.addEventListener('pointerup', onUp, true);
  window.addEventListener('pointercancel', onUp, true);
  window.addEventListener('click', onClick, true);
  window.addEventListener('resize', resize);

  // ── Recepção (outro dispositivo) ────────────────────────────────────────────
  document.addEventListener('deck-sync:laser', (e) => {
    const m = e.detail || {};
    const origin = m.id || 'remote';
    switch (m.k) {
      case 's': newStroke(origin); break;
      case 'm':
        if (Array.isArray(m.p)) m.p.forEach((pt) => addPoint(origin, clamp01(pt[0]), clamp01(pt[1])));
        break;
      case 'e': endStroke(origin); break;
      case 'h':
        if (Array.isArray(m.p)) hoverByOrigin.set(origin, { x: clamp01(m.p[0]), y: clamp01(m.p[1]), t: now() });
        break;
      case 'c':
        for (let i = strokes.length - 1; i >= 0; i--) if (strokes[i].origin === origin) strokes.splice(i, 1);
        currentByOrigin.delete(origin);
        hoverByOrigin.delete(origin);
        break;
    }
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  function seg(x0, y0, x1, y1) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  function dot(px, py, r, a) {
    ctx.save();
    ctx.shadowColor = 'rgba(' + CFG.GLOW + ',' + (0.9 * a) + ')';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(' + CFG.GLOW + ',' + (0.95 * a) + ')';
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(' + CFG.TIP + ',' + a + ')';
    ctx.beginPath(); ctx.arc(px, py, r * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function frame() {
    const t = now();
    const r = slideRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let si = strokes.length - 1; si >= 0; si--) {
      const s = strokes[si];
      // Descarta pontos expirados pela frente (limita memória).
      while (s.pts.length && (t - s.pts[0].t) > CFG.TTL) s.pts.shift();
      const open = currentByOrigin.has(s.origin);
      if (!s.pts.length) { if (!open) strokes.splice(si, 1); continue; }

      const pts = s.pts;
      for (let i = 1; i < pts.length; i++) {
        const age = t - pts[i].t;
        if (age >= CFG.TTL) continue;
        const a = 1 - age / CFG.TTL;
        const x0 = r.left + pts[i - 1].x * r.width, y0 = r.top + pts[i - 1].y * r.height;
        const x1 = r.left + pts[i].x * r.width, y1 = r.top + pts[i].y * r.height;
        ctx.strokeStyle = 'rgba(' + CFG.GLOW + ',' + (0.22 * a) + ')';
        ctx.lineWidth = 13 * a + 3; seg(x0, y0, x1, y1);
        ctx.strokeStyle = 'rgba(' + CFG.CORE + ',' + (0.95 * a) + ')';
        ctx.lineWidth = 4.5 * a + 1.5; seg(x0, y0, x1, y1);
      }
      // Ponta brilhante no último ponto vivo.
      const last = pts[pts.length - 1];
      const at = 1 - (t - last.t) / CFG.TTL;
      if (at > 0) dot(r.left + last.x * r.width, r.top + last.y * r.height, 6 * at + 2, at);
    }

    hoverByOrigin.forEach((h, origin) => {
      const age = t - h.t;
      if (age > CFG.HOVER_TTL) { hoverByOrigin.delete(origin); return; }
      // Enquanto o mesmo origin desenha, o rastro já mostra a ponta.
      if (currentByOrigin.has(origin)) return;
      dot(r.left + h.x * r.width, r.top + h.y * r.height, 7, 1 - age / CFG.HOVER_TTL);
    });

    flush(false);
    requestAnimationFrame(frame);
  }

  // ── Boot ────────────────────────────────────────────────────────────────────
  function boot() { mount(); requestAnimationFrame(frame); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
