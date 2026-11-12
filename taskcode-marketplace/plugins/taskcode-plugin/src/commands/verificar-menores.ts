/**
 * `taskctl verificar-menores TASK-NNN [--motivo "<texto>"] [--push]` —
 * TASK-099 (P-2 de la auditoria del 2026-11-12): la verificacion ligera.
 *
 * Tras una ronda aprobada (`aprobada` o `aprobada con correcciones`) los
 * MENORES baratos se corrigen sin abrir otra ronda. Este comando comprueba,
 * fail-closed, que eso es lo unico que paso despues del `Commit revisado`:
 * - la ultima ronda primaria esta aprobada, con informes rellenados y una
 *   peticion con `Commit revisado` antepasado de HEAD;
 * - no queda ningun CRITICO ni IMPORTANTE abierto (ni una severidad que no
 *   se reconoce): esos siguen exigiendo cambios-solicitados y otra ronda;
 * - cada fichero cambiado fuera de `tareas/` desde el commit revisado es el
 *   de algun MENOR abierto o un test: lo demas es codigo que nadie reviso;
 * - no hay cambios sin commitear fuera de `tareas/`.
 * Si pasa, deja una linea en `## Verificacion ligera` de `tarea.md` y los
 * MENORES que no se corrigieron en `revision/menores-pendientes.md`
 * (backlog: no abre ronda ni impide finish), y lo commitea. No corre tests:
 * `finish` corre `comando_verificacion` antes del merge.
 *
 * `finish` y `siguiente` leen la linea con `estadoCorreccionPosterior`.
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { commitRevisadoDe, informeRellenado, veredictoDeRonda } from '../core/informe-revision.js';
import {
  MENORES_PENDIENTES,
  SECCION_VERIFICACION_LIGERA,
  backlogMenores,
  bloqueantesAbiertos,
  fueraDeAlcance,
  lineaVerificacionLigera,
  menoresAbiertos,
  repartirMenores,
  verificacionDeRonda,
  type VerificacionLigeraLeida,
} from '../core/menores.js';
import { anotarLineaEnSeccion } from '../core/transiciones.js';
import { readTareaFile, writeTareaFile } from '../fs/task-store.js';
import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
import { isAncestor, runGit } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
import { REVISION_DIRNAME } from './review.js';

export class VerificarMenoresCommandError extends Error {}

export const FLAGS_VERIFICAR_MENORES: readonly string[] = ['--motivo', '--push', '-p'];

const MOTIVO_POR_DEFECTO = 'no se corrigio en la verificacion ligera';

export interface VerificarMenoresCommandDeps {
  repoCwd: string;
  /** Solo para tests: instante de la linea. */
  ahora?: string;
}

export interface VerificarMenoresCommandResult {
  id: string;
  ronda: number;
  commitRevisado: string;
  commitVerificado: string;
  ficheros: string[];
  corregidos: string[];
  pendientes: string[];
  /** Ruta del backlog si se escribio; null si no hizo falta. */
  backlogPath: string | null;
  autoCommit: AutoCommitResult;
}

/** Pathspec de Git para «todo el repo menos `tareas/`», desde cualquier subdirectorio. */
function fueraDeTareas(cwd: string): string[] {
  return ['--', ':(top)', `:(top,exclude)${runGit(['rev-parse', '--show-prefix'], cwd)}tareas/`];
}

/** Ficheros (rutas desde la raiz del repo) que cambian fuera de `tareas/` entre dos commits. */
export function codigoCambiado(desde: string, hasta: string, cwd: string): string[] {
  const salida = runGit(['diff', '--name-only', desde, hasta, ...fueraDeTareas(cwd)], cwd);
  return salida === '' ? [] : salida.split('\n').map((l) => l.trim()).filter((l) => l !== '');
}

export interface EstadoCorreccion {
  /** Codigo cambiado fuera de `tareas/` desde el commit revisado. */
  cambiados: string[];
  /** La verificacion ligera de esa ronda y ese commit revisado, si la hay. */
  verificacion: VerificacionLigeraLeida | null;
  /** Hay verificacion y el codigo de `ref` es el que se verifico. */
  alDia: boolean;
}

/**
 * Que paso despues del commit revisado, para `finish` y `siguiente`. null si
 * no hay referencia fiable (sin `Commit revisado`, o no es antepasado de
 * `ref`): quien llama decide que hacer sin ella, como antes de TASK-099.
 */
export function estadoCorreccionPosterior(
  body: string,
  ronda: number,
  revisado: string | null,
  ref: string,
  cwd: string
): EstadoCorreccion | null {
  if (revisado === null || !isAncestor(revisado, ref, cwd)) return null;
  const cambiados = codigoCambiado(revisado, ref, cwd);
  const verificacion = verificacionDeRonda(body, ronda, revisado);
  let alDia = false;
  if (verificacion !== null) {
    try {
      alDia =
        isAncestor(verificacion.commitVerificado, ref, cwd) &&
        codigoCambiado(verificacion.commitVerificado, ref, cwd).length === 0;
    } catch {
      alDia = false; // un SHA que ya no existe no verifica nada
    }
  }
  return { cambiados, verificacion, alDia };
}

/** Saca `--motivo <texto>` de argv. */
function extraerMotivo(argv: readonly string[]): { motivo: string | null; resto: string[] } {
  const resto: string[] = [];
  let motivo: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (arg === '--motivo') {
      const valor = argv[i + 1];
      if (valor === undefined || valor.startsWith('--') || valor.trim() === '') {
        throw new VerificarMenoresCommandError('[ERROR] --motivo necesita un texto: --motivo "<por que no se corrigen>"');
      }
      motivo = valor.trim();
      i++;
      continue;
    }
    resto.push(arg);
  }
  return { motivo, resto };
}

export async function runVerificarMenoresCommand(
  tareasRoot: string,
  argv: readonly string[],
  deps: VerificarMenoresCommandDeps
): Promise<VerificarMenoresCommandResult> {
  rechazarFlagsDesconocidos(
    argv,
    FLAGS_VERIFICAR_MENORES,
    'verificar-menores',
    (m) => new VerificarMenoresCommandError(m)
  );
  const { push, resto: sinPush } = extraerPushFlag(argv);
  const { motivo, resto } = extraerMotivo(sinPush);
  const [id, ...sobra] = resto;
  const uso = 'Uso: taskctl verificar-menores TASK-NNN [--motivo "<texto>"] [--push]';
  if (id === undefined || id.trim() === '') {
    throw new VerificarMenoresCommandError(`[ERROR] Falta el ID de la tarea. ${uso}`);
  }
  if (sobra.length > 0) {
    throw new VerificarMenoresCommandError(`[ERROR] Argumentos de mas: ${sobra.join(' ')}. ${uso}`);
  }

  const existing = await readTareaFile(tareasRoot, id);
  assertTransitionAllowed('verificar-menores', existing === null ? null : existing.task);
  const { task, body, filePath } = existing as NonNullable<typeof existing>;
  const cwd = deps.repoCwd;
  const error = (texto: string): VerificarMenoresCommandError =>
    new VerificarMenoresCommandError(`[ERROR] ${task.id}: ${texto}`);

  const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
  const { ronda, nombres } = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
  if (nombres.length === 0) throw error('no tiene ningun informe de revision. Lo crea "taskctl review".');
  const informes = await Promise.all(nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8')));

  const veredicto = veredictoDeRonda(informes);
  if (veredicto === 'cambios-solicitados') {
    throw error(
      `la ronda ${String(ronda)} pidio cambios: corregir y pedir otra ronda con taskctl review ${task.id}. ` +
        'La verificacion ligera es solo para MENORES tras una ronda aprobada.'
    );
  }
  if (veredicto !== 'aprobada') {
    throw error(
      `la ronda ${String(ronda)} no tiene un veredicto aprobado ("${veredicto}"). ` +
        `Escribelo con taskctl veredicto ${task.id} <aprobada|aprobada-con-correcciones|cambios-solicitados>.`
    );
  }
  if (!informes.every(informeRellenado)) {
    throw error(`algun informe de la ronda ${String(ronda)} sigue siendo la plantilla: lo rellena el revisor.`);
  }

  const bloqueantes = bloqueantesAbiertos(informes);
  if (bloqueantes.length > 0) {
    const ids = bloqueantes.map((h) => `${h.id} (${h.severidad || 'sin severidad'})`).join(', ');
    throw error(
      `tiene abierto ${ids}. Un CRITICO o IMPORTANTE abierto exige ` +
        `taskctl veredicto ${task.id} cambios-solicitados y otra ronda (taskctl review ${task.id}); ` +
        'la verificacion ligera no lo cubre.'
    );
  }

  const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
  const revisado =
    peticiones.ronda !== ronda
      ? null
      : (
          await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8')))
        )
          .map(commitRevisadoDe)
          .find((c) => c !== null) ?? null;
  if (revisado === null) {
    throw error(
      `la peticion de la ronda ${String(ronda)} no dice que commit se reviso ("- Commit revisado"): ` +
        'sin esa referencia no se puede saber que cambio despues. Lo decide una persona.'
    );
  }
  if (!isAncestor(revisado, 'HEAD', cwd)) {
    throw error(`el commit revisado ${revisado} no es antepasado de HEAD: la rama se reescribio despues de revisar.`);
  }
  if (runGit(['status', '--porcelain', ...fueraDeTareas(cwd)], cwd) !== '') {
    throw error('hay cambios sin commitear fuera de tareas/: commitea las correcciones antes de verificarlas.');
  }

  const cambiados = codigoCambiado(revisado, 'HEAD', cwd);
  const menores = menoresAbiertos(informes);
  const fuera = fueraDeAlcance(cambiados, menores);
  if (fuera.length > 0) {
    throw error(
      `desde el commit revisado ${revisado} cambian ficheros que no son de ningun MENOR abierto ni tests: ` +
        `${fuera.join(', ')}. Eso no es corregir MENORES, es codigo sin revisar. Dos salidas: ` +
        `otra ronda (taskctl veredicto ${task.id} cambios-solicitados y taskctl review ${task.id}), ` +
        `o que una persona decida integrarlo con taskctl finish ${task.id} --aceptar-sin-revisar.`
    );
  }

  const { corregidos, pendientes } = repartirMenores(menores, cambiados);
  const commitVerificado = runGit(['rev-parse', 'HEAD'], cwd);
  const linea = lineaVerificacionLigera({
    instante: deps.ahora ?? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    ronda,
    commitRevisado: revisado,
    commitVerificado,
    ficheros: cambiados,
    corregidos: corregidos.map((h) => h.id),
    pendientes: pendientes.map((h) => h.id),
  });
  const tareaPath = await writeTareaFile(tareasRoot, task, anotarLineaEnSeccion(body, SECCION_VERIFICACION_LIGERA, linea));

  // El backlog refleja la ultima verificacion: se reescribe si hay pendientes
  // o si ya existia (para no dejar uno viejo con MENORES ya corregidos).
  const backlog = path.join(revisionDir, MENORES_PENDIENTES);
  let backlogPath: string | null = null;
  if (pendientes.length > 0 || existsSync(backlog)) {
    await writeFile(backlog, backlogMenores(task.id, ronda, pendientes, motivo ?? MOTIVO_POR_DEFECTO), 'utf8');
    backlogPath = backlog;
  }

  const commitResult = autoCommit({
    cwd,
    rutas: backlogPath === null ? [tareaPath] : [tareaPath, backlogPath],
    mensaje: mensajeChore(task.id, `verificacion ligera ronda ${String(ronda)}`),
    push,
  });
  return {
    id: task.id,
    ronda,
    commitRevisado: revisado,
    commitVerificado,
    ficheros: cambiados,
    corregidos: corregidos.map((h) => h.id),
    pendientes: pendientes.map((h) => h.id),
    backlogPath,
    autoCommit: commitResult,
  };
}

export interface CodigoSinVerificar {
  ronda: number;
  revisado: string;
  cambiados: string[];
}

/**
 * Para la puerta de `finish` (criterio 3 de TASK-099): codigo commiteado en
 * `ref` despues del `Commit revisado` de la ultima ronda primaria que no
 * cubre ninguna verificacion ligera al dia; null si no lo hay. Sin `Commit
 * revisado` en la peticion (tareas anteriores a TASK-059) o con un SHA que
 * Git no conoce no hay referencia y la puerta no aplica, como antes.
 */
export async function codigoSinVerificar(
  taskDir: string,
  body: string,
  ref: string,
  cwd: string
): Promise<CodigoSinVerificar | null> {
  const revisionDir = path.join(taskDir, REVISION_DIRNAME);
  const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
  const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
  if (informes.nombres.length === 0 || peticiones.ronda !== informes.ronda) return null;
  const revisado =
    (await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8'))))
      .map(commitRevisadoDe)
      .find((c) => c !== null) ?? null;
  let estado: EstadoCorreccion | null;
  try {
    estado = estadoCorreccionPosterior(body, informes.ronda, revisado, ref, cwd);
  } catch {
    return null;
  }
  if (estado === null || revisado === null || estado.cambiados.length === 0 || estado.alDia) return null;
  return { ronda: informes.ronda, revisado, cambiados: estado.cambiados };
}
