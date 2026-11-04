/**
 * Punto de entrada del hook `Stop` (hooks/hooks.json). Solo lee stdin, decide
 * (freno-stop.ts) y sale: 0 deja parar, 2 bloquea con el informe en stderr.
 * Nunca sale con 1, que Claude Code trata como error NO bloqueante.
 */
import { readFileSync } from 'node:fs';
import { decidirStop, parsearEntrada } from './freno-stop.js';

let texto = '';
try {
  texto = readFileSync(0, 'utf8');
} catch {
  texto = '';
}

decidirStop(parsearEntrada(texto)).then(
  (d) => {
    if (d.stderr !== '') process.stderr.write(`${d.stderr}\n`);
    process.exitCode = d.codigo;
  },
  () => {
    process.exitCode = 0;
  }
);
