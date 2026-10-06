/* Gera public/assets/pix-qr.svg a partir do código montado em
   public/assets/pix.js — uma fonte só para a chave, o "copia e cola" e o QR.

   `npm run pix-qr` regrava o arquivo; o verificar.mjs usa gerarSvg() para
   reprovar um QR que não bate mais com o código. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import QRCode from 'qrcode';

const PUBLICO = resolve(import.meta.dirname, '..', 'public');
export const ARQUIVO = join(PUBLICO, 'assets', 'pix-qr.svg');

export function codigoPix() {
  const contexto = { window: {} };
  vm.runInNewContext(readFileSync(join(PUBLICO, 'assets', 'pix.js'), 'utf8'), contexto);
  return contexto.window.KLPix.payload();
}

// Módulos escuros sobre branco, nos dois temas: leitor de QR lida mal com
// QR invertido.
export function gerarSvg() {
  return QRCode.toString(codigoPix(), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
    color: { dark: '#0f1410', light: '#ffffff' },
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(ARQUIVO, await gerarSvg());
  console.log(`✓ ${ARQUIVO.slice(PUBLICO.length - 'public'.length)} — ${codigoPix()}`);
}
