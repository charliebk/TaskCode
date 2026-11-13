/**
 * `taskctl verificar-lote [--push]` — TASK-115 (P-7 de la auditoria del
 * 2026-11-12): la verificacion completa por lote.
 *
 * Con `verificacion_por_lote: true` en la rama base, `finish` de una feature o
 * fix con codigo integra sin la completa y deja en `tarea.md` una linea
 * «pendiente de lote» bajo `## Verificacion por lote`. Este comando, desde la
 * rama de integracion con el arbol limpio:
 * - busca las tareas terminadas cuya ultima linea de esa seccion esta
 *   pendiente (las que entraron desde la ultima completa en verde);
 * - sin pendientes, lo dice y no ejecuta nada;
 * - ejecuta `comando_verificacion` sobre HEAD una sola vez (guarda el memo de
 *   la completa, como finish, y anota la puerta `finish` con modo `lote`);
 * - en verde, anade a cada pendiente «lote en verde en <commit>» y lo commitea;
 * - en rojo, no anota nada y aborta listando esas tareas: son las sospechosas.
 *   La vuelta atras (revertir un merge, abrir un fix) la decide una persona.
 */
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { resolverConfig } from '../core/config.js';
import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
import { PUERTA_FINISH } from '../core/registro-puertas.js';
import { serializeTareaFile } from '../core/tarea-file.js';
import { isValidTaskId, STATE_FOLDER } from '../core/task.js';
import { anotarLineaEnSeccion, pendienteDeLote, SECCION_VERIFICACION_LOTE } from '../core/transiciones.js';
import { currentBranch, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
import { autoCommit, type AutoCommitResult } from '../fs/git-commit.js';
import { anotarPuerta } from '../fs/registro-puertas.js';
import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
import { spawnSync } from 'node:child_process';

export class VerificarLoteCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VerificarLoteCommandError';
  }
}

export interface VerificarLoteDeps {
  repoCwd: string;
  /** Instante de las anotaciones (ISO); por defecto, ahora. */
  ahora?: string;
  /** Solo para tests: sustituye al timeout de la verificacion (en ms). */
  timeoutMs?: number;
}

export interface VerificarLoteResult {
  /** Tareas pendientes de lote encontradas (en orden de cierre). */
  pendientes: string[];
  /** null si no habia pendientes y no se ejecuto nada. */
  commitVerificado: string | null;
  duracionMs: number | null;
  autoCommit: AutoCommitResult | null;
}

function headDe(cwd: string): string {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', windowsHide: true });
  return (r.stdout ?? '').trim();
}

/** Las tareas terminadas pendientes de lote, en orden de su ultima anotacion. */
async function pendientesDeLote(tareasRoot: string): Promise<ReadTareaResult[]> {
  let entradas: string[];
  try {
    entradas = await readdir(path.join(tareasRoot, STATE_FOLDER.terminada));
  } catch {
    return [];
  }
  const pendientes: ReadTareaResult[] = [];
  for (const id of entradas.filter((e) => isValidTaskId(e)).sort()) {
    const t = await readTareaFile(tareasRoot, id);
    if (t !== null && pendienteDeLote(t.body)) pendientes.push(t);
  }
  return pendientes;
}

export async function runVerificarLoteCommand(
  tareasRoot: string,
  argv: readonly string[],
  deps: VerificarLoteDeps
): Promise<VerificarLoteResult> {
  rechazarFlagsDesconocidos(argv, ['--push'], 'taskctl verificar-lote', (m) => new VerificarLoteCommandError(m));
  const push = argv.includes('--push');
  const cwd = deps.repoCwd;
  const config = resolverConfig(cwd);
  const comando = config.comando_verificacion;
  if (comando === null) {
    throw new VerificarLoteCommandError(
      '[ERROR] taskctl verificar-lote: el proyecto no declara comando_verificacion, asi que no hay completa que ' +
        'correr por lote.'
    );
  }
  const integracion = resolveIntegrationBranch(cwd);
  const rama = currentBranch(cwd);
  if (rama !== integracion) {
    throw new VerificarLoteCommandError(
      `[ERROR] taskctl verificar-lote: el lote se verifica sobre la rama de integracion "${integracion}", y la ` +
        `rama activa es "${rama === '' ? 'HEAD desacoplado' : rama}". Cambiate (git checkout ${integracion}) y reintenta.`
    );
  }
  if (!isWorkspaceClean(cwd)) {
    throw new VerificarLoteCommandError(
      '[ERROR] taskctl verificar-lote: el arbol de trabajo tiene cambios sin commitear: el lote se verifica sobre ' +
        'lo integrado, no sobre lo que hay a medias. Commitealos o apartalos y reintenta.'
    );
  }

  const pendientes = await pendientesDeLote(tareasRoot);
  if (pendientes.length === 0) {
    return { pendientes: [], commitVerificado: null, duracionMs: null, autoCommit: null };
  }
  const ids = pendientes.map((t) => t.task.id);
  const commit = headDe(cwd);
  const timeoutS = config.timeout_verificacion;
  const inicio = Date.now();
  const r = ejecutarVerificacion(cwd, comando, timeoutS, deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs });
  anotarPuerta(cwd, {
    puerta: PUERTA_FINISH,
    tarea: '-',
    instante: new Date().toISOString(),
    modo: 'lote',
    duracionS: (Date.now() - inicio) / 1000,
    resultado: r.estado === 'verde' ? 'verde' : 'rojo',
  });
  // Como finish: el memo de la completa solo con el arbol limpio (la huella del commit).
  const limpio = isWorkspaceClean(cwd);
  const huella = limpio ? huellaDelArbol(cwd, comando, timeoutS) : null;
  if (huella !== null) guardarMemo(cwd, huella, r);
  if (r.estado !== 'verde') {
    throw new VerificarLoteCommandError(
      `[ERROR] taskctl verificar-lote: la verificacion completa del lote no sale en verde en "${integracion}" ` +
        `(${commit.slice(0, 7)}). No se ha anotado nada: las tareas siguen pendientes de lote.\n` +
        `Entraron desde la ultima completa en verde (${String(ids.length)}): ${ids.join(', ')}.\n` +
        `${formatearVerificacionRoja(r)}\n` +
        'Busca la causa en esas tareas; revertir un merge o abrir una tarea de arreglo lo decide una persona.'
    );
  }
  if (!limpio) {
    throw new VerificarLoteCommandError(
      `[ERROR] taskctl verificar-lote: la verificacion salio en verde, pero ha dejado cambios en el arbol ("${comando}" ` +
        'escribe ficheros versionados o no ignorados: mira git status). No se ha anotado nada.'
    );
  }

  const instante = deps.ahora ?? new Date().toISOString();
  for (const t of pendientes) {
    const body = anotarLineaEnSeccion(
      t.body,
      SECCION_VERIFICACION_LOTE,
      `- ${instante}: lote en verde en ${commit.slice(0, 7)} (taskctl verificar-lote)`
    );
    await writeFile(t.filePath, serializeTareaFile(t.task, body), 'utf8');
  }
  const commitResult = autoCommit({
    cwd,
    rutas: pendientes.map((t) => t.filePath),
    mensaje: `chore(lote): verificacion completa en verde para ${ids.join(', ')}`,
    push,
  });
  return { pendientes: ids, commitVerificado: commit, duracionMs: r.duracionMs, autoCommit: commitResult };
}
