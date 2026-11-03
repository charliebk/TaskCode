#!/usr/bin/env node
/**
 * Sonda de hooks (TASK-069). Sin dependencias, forma exec: Claude Code la
 * lanza como `node <ruta>` sin pasar por ningun shell, asi que corre igual
 * en Windows (con o sin Git Bash) que en Linux.
 *
 * INERTE POR DEFECTO: sin TASKCODE_SONDA_MODO sale 0 sin leer nada mas ni
 * escribir nada. Asi puede ir dentro del plugin publicado sin efecto.
 *
 * Modos (TASKCODE_SONDA_MODO):
 *   registrar  anota la entrada JSON y sale 0 (observa, no decide).
 *   stop2      en Stop: anota y sale 2 con motivo por stderr, SALVO que
 *              stop_hook_active sea true (H5: corta el bucle). En otros
 *              eventos se comporta como `registrar`.
 *   pre2       en PreToolUse: anota y sale 2 si el comando contiene
 *              `git merge` (H4). Vuelve a comprobar el comando porque el
 *              filtro `if` de hooks.json es best-effort segun la
 *              documentacion oficial. En otros eventos, como `registrar`.
 *
 * Registro: una linea JSON por invocacion en TASKCODE_SONDA_LOG, o en
 * <tmpdir>/taskcode-sonda.jsonl si no esta definida.
 *
 * Cualquier fallo propio (stdin no JSON, log no escribible) sale 0: una
 * sonda nunca debe bloquear por un error suyo. Los frenos reales de
 * TASK-071/072 decidiran su propia politica de fallo.
 */
import { appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const MODOS = new Set(['registrar', 'stop2', 'pre2']);
const modo = process.env.TASKCODE_SONDA_MODO;
if (!modo) process.exit(0);
if (!MODOS.has(modo)) {
  process.stderr.write(`sonda-hooks: modo desconocido "${modo}"; se ignora.\n`);
  process.exit(0);
}

function leerStdin() {
  return new Promise((resolve) => {
    let datos = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (t) => { datos += t; });
    process.stdin.on('end', () => resolve(datos));
    process.stdin.on('error', () => resolve(datos));
  });
}

function decidir(modoActual, entrada) {
  const evento = entrada.hook_event_name;
  if (modoActual === 'stop2' && evento === 'Stop') {
    if (entrada.stop_hook_active === true) return { codigo: 0, motivo: null };
    return { codigo: 2, motivo: 'sonda TASK-069: Stop bloqueado a proposito (stop2). Responde solo "sonda recibida" y termina.' };
  }
  if (modoActual === 'pre2' && evento === 'PreToolUse') {
    const comando = String(entrada.tool_input?.command ?? '');
    if (/\bgit\s+merge\b/.test(comando)) {
      return { codigo: 2, motivo: `sonda TASK-069: git merge bloqueado a proposito (pre2). Comando: ${comando}` };
    }
  }
  return { codigo: 0, motivo: null };
}

const crudo = await leerStdin();
let entrada;
try {
  entrada = JSON.parse(crudo);
} catch {
  process.stderr.write('sonda-hooks: la entrada no es JSON; se ignora.\n');
  process.exit(0);
}

const decision = decidir(modo, entrada);
const destino = process.env.TASKCODE_SONDA_LOG || path.join(tmpdir(), 'taskcode-sonda.jsonl');
try {
  appendFileSync(destino, JSON.stringify({
    ts: new Date().toISOString(),
    modo,
    plataforma: process.platform,
    node: process.version,
    evento: entrada.hook_event_name ?? null,
    stop_hook_active: entrada.stop_hook_active ?? null,
    tool_name: entrada.tool_name ?? null,
    comando: entrada.tool_input?.command ?? null,
    claves: Object.keys(entrada).sort(),
    salida: decision.codigo,
  }) + '\n');
} catch {
  // registro best-effort
}

if (decision.motivo) process.stderr.write(decision.motivo + '\n');
process.exit(decision.codigo);
