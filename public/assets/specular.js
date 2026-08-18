/* Anel especular que acompanha o ponteiro.
   Dois arcos opostos de luz percorrem a borda do botão conforme o ponteiro se
   move, e ganham intensidade à medida que ele se aproxima — como o reflexo numa
   superfície polida.

   Escuta `pointermove`, não `mousemove`: assim funciona com mouse, caneta e
   toque. Em tela sensível ao toque o efeito aparece enquanto o dedo desliza. */
(function () {
  'use strict';

  var RADIUS = 250; // distância, em px, a partir da qual o anel começa a acender

  function attach(el) {
    if (!el) return;

    var raf = 0;

    function onMove(e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;

        // Distância até a borda do botão (zero quando o ponteiro está sobre ele).
        var dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
        var dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
        var dist = Math.sqrt(dx * dx + dy * dy);

        var t = Math.max(0, 1 - dist / RADIUS);
        var prox = Math.round(t * t * (3 - 2 * t) * 100) / 100; // suavização
        var deg = Math.round((Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90);

        el.style.setProperty('--spec-from', deg - 14 + 'deg');
        el.style.setProperty('--spec-a', (0.35 + 0.65 * prox).toFixed(2));
        el.style.setProperty('--spec-op', String(prox));
      });
    }

    window.addEventListener('pointermove', onMove);
  }

  window.KLSpecular = { attach: attach };
})();
