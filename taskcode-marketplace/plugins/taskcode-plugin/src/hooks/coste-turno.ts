/**
 * Punto de entrada de los hooks `Stop` y `SubagentStop` del registro de
 * coste (hooks/hooks.json). Lee stdin, anota (registro-coste.ts) y sale
 * siempre con 0, sin escribir nada: nunca bloquea al agente.
 */
import { readFileSync } from 'node:fs';
import { parsearEntradaCoste, registrarTurno } from './registro-coste.js';

let texto = '';
try {
  texto = readFileSync(0, 'utf8');
} catch {
  texto = '';
}

registrarTurno(parsearEntradaCoste(texto)).then(
  () => {
    process.exitCode = 0;
  },
  () => {
    process.exitCode = 0;
  }
);
