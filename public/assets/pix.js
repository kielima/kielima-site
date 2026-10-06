/* Pix — botão ao lado do WhatsApp (cartão e /tree) que abre o QR Code e o
   "copia e cola".

   O código segue o BR Code do Banco Central (EMV QRCPS-MPM): chave, nome,
   cidade e um CRC16 no fim. Sem valor fixo, quem paga digita o quanto quer;
   por isso o código é sempre o mesmo e o QR é um SVG estático,
   assets/pix-qr.svg, gerado a partir daqui por `npm run pix-qr`. Trocou a
   chave? Rode o script — o `npm run verificar` reprova um QR desatualizado.

   Nome e cidade são obrigatórios no padrão, mas ninguém os confere: o banco
   de quem paga mostra o nome cadastrado na chave. Sem acento, até 25 e 15
   caracteres. */
(function () {
  'use strict';

  var KEY = '82d581e2-8719-4dcf-930a-92c0cb069ee9';
  var NAME = 'KIE LIMA';
  var CITY = 'CAMPINAS';

  function field(id, value) {
    var len = String(value.length);
    return id + (len.length < 2 ? '0' + len : len) + value;
  }

  // CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido pelo BR Code.
  function crc16(text) {
    var crc = 0xffff;
    for (var i = 0; i < text.length; i++) {
      crc ^= text.charCodeAt(i) << 8;
      for (var b = 0; b < 8; b++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xffff;
      }
    }
    return ('000' + crc.toString(16).toUpperCase()).slice(-4);
  }

  function payload() {
    var body =
      field('00', '01') +
      field('26', field('00', 'br.gov.bcb.pix') + field('01', KEY)) +
      field('52', '0000') +
      field('53', '986') +
      field('58', 'BR') +
      field('59', NAME) +
      field('60', CITY) +
      field('62', field('05', '***')) +
      '6304';
    return body + crc16(body);
  }

  window.KLPix = { payload: payload, crc16: crc16 };

  // Carregado em Node pelo script que gera o QR: só a parte acima interessa.
  if (typeof document === 'undefined') return;

  var button = document.getElementById('pix-button');
  if (!button) return;

  var code = payload();

  /* O pop-up é montado aqui, uma vez, para o cartão e o /tree não terem duas
     cópias do HTML. Os textos vêm do COPY de cada página (chaves pix*) pelo
     data-i18n — por isso este script entra antes do da página, que é quem
     chama o KLI18n.init. */
  var dialog = document.createElement('dialog');
  dialog.className = 'pix-dialog';
  dialog.setAttribute('aria-labelledby', 'pix-title');
  dialog.innerHTML =
    '<div class="pix-head">' +
    '<span class="section-label" id="pix-title" data-i18n="pixTitle"></span>' +
    '<button type="button" class="pix-close">' +
    '<span class="visually-hidden" data-i18n="pixClose"></span>' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg>' +
    '</button>' +
    '</div>' +
    '<img class="pix-qr" src="/assets/pix-qr.svg" width="220" height="220" alt="QR Code Pix">' +
    '<p class="pix-hint" data-i18n="pixHint"></p>' +
    '<p class="pix-code"></p>' +
    '<button type="button" class="pix-copy"><span data-i18n="pixCopy"></span></button>' +
    '<span class="pix-status" role="status" data-i18n="pixCopied" hidden></span>';
  document.body.appendChild(dialog);

  var codeBox = dialog.querySelector('.pix-code');
  var status = dialog.querySelector('.pix-status');
  codeBox.textContent = code;

  button.addEventListener('click', function () {
    dialog.showModal();
  });

  dialog.querySelector('.pix-close').addEventListener('click', function () {
    dialog.close();
  });

  // Fecha ao tocar no fundo. O clique no fundo e na margem interna do painel
  // chegam ambos com o próprio <dialog> como alvo; a posição separa os dois.
  dialog.addEventListener('click', function (e) {
    if (e.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      dialog.close();
    }
  });

  var statusTimer;
  function showCopied() {
    status.hidden = false;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      status.hidden = true;
    }, 2200);
  }

  // Sem a API de área de transferência (ou com ela negada), sobra o
  // execCommand; e se nem isso der, o código fica selecionado na tela para
  // copiar à mão.
  function fallback() {
    var range = document.createRange();
    range.selectNodeContents(codeBox);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    try {
      if (document.execCommand('copy')) showCopied();
    } catch (e) {}
  }

  dialog.querySelector('.pix-copy').addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(showCopied, fallback);
    } else {
      fallback();
    }
  });
})();
