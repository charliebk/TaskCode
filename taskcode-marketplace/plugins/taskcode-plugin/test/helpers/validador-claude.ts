// El validador oficial de plugins (`claude plugin validate`) para los tests
// de integracion — TASK-075. Antes cada fichero de test tenia su copia de
// `validar()` y decidia «valida limpio» buscando la cruz en TODA la salida.
//
// Desde Claude Code 2.1.316 el validador añade al final un bloque «Plugin
// directory checks» con las comprobaciones del directorio de plugins (README,
// icono...). Sus problemas salen marcados con una cruz aunque no cambien el
// resultado: con la copia de un plugin sin README la salida tiene una cruz y
// termina en «Validation passed» con exit 0. La condicion mira por eso solo el
// resultado de la validacion, nunca ese bloque (ver HALLAZGOS.md).

import { spawnSync } from 'node:child_process';

export interface ResultadoValidate {
  status: number | null;
  salida: string;
}

const CRUZ = '✘';
/**
 * Primera linea del bloque del directorio de plugins (Claude Code 2.1.316+),
 * anclada al principio de linea: la frase dentro de una ruta o de un mensaje
 * no corta (MEN-1 de la revision de TASK-075).
 */
const MARCA_DIRECTORIO = /^Plugin directory checks for /m;
const RESULTADO_OK = 'Validation passed';

export function claudeDisponible(): boolean {
  try {
    const r = spawnSync('claude', ['--version'], { encoding: 'utf8' });
    return r.status === 0;
  } catch {
    return false;
  }
}

export function validarPlugin(ruta: string): ResultadoValidate {
  const r = spawnSync('claude', ['plugin', 'validate', ruta], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { status: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

/**
 * true si la validacion paso sin errores, ignorando el bloque del directorio:
 * exit 0, la ultima linea no vacia dice «Validation passed» y no hay ninguna
 * cruz ANTES de ese bloque (sin bloque, en toda la salida). Ante un texto que
 * no reconoce devuelve false: un cambio de formato da rojo, nunca falso verde.
 */
export function validacionLimpia(r: ResultadoValidate): { ok: boolean; motivo: string } {
  if (r.status !== 0) return { ok: false, motivo: `exit ${String(r.status)}` };
  const lineas = r.salida.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');
  const ultima = lineas[lineas.length - 1] ?? '';
  if (!ultima.includes(RESULTADO_OK)) {
    return { ok: false, motivo: `la ultima linea no dice "${RESULTADO_OK}": "${ultima}"` };
  }
  const i = r.salida.search(MARCA_DIRECTORIO);
  const resultado = i === -1 ? r.salida : r.salida.slice(0, i);
  if (resultado.includes(CRUZ)) return { ok: false, motivo: 'hay errores antes de las comprobaciones del directorio' };
  return { ok: true, motivo: '' };
}
