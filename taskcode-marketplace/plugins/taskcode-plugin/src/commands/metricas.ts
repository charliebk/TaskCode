/**
 * taskctl metricas — tabla de fases por tarea (TASK-052). Solo lectura,
 * con el patron de `board`: no escribe nada ni cambia de rama, asi que no
 * aplica la precondicion de rama base.
 *
 * Lee cada tarea, los nombres de su `revision/` y, solo si alguna tarea no
 * tiene registro de Transiciones, UN `git log` para todas (nunca uno por
 * tarea). Si git no esta o el directorio no es un repo, esas tareas salen
 * con «—» y un aviso; el comando no falla por eso.
 *
 * `--heuristica` anade la puntuacion y el nivel que da la heuristica
 * vigente a las tareas terminadas con informes de revision (las demas no
 * entran en la muestra), y un resumen por nivel declarado y heuristico con
 * las rondas medias: es la tabla con la que se recalibra el YML.
 */
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { TaskValidationError, TASK_COMPLEXITIES } from '../core/task.js';
import { cargarHeuristica, nivelHeuristico, puntuarTarea } from '../core/heuristica.js';
import { leerTransiciones } from '../core/transiciones.js';
import {
  COLUMNAS_HEURISTICA,
  COLUMNAS_METRICAS,
  calcularFila,
  enMuestraHeuristica,
  formatearResumen,
  formatearTabla,
  parsearLogGit,
  resumirPorNivel,
  type EventoGit,
  type FilaMetricas,
} from '../core/metricas.js';
import { INFORME_REVISION_RE, nombresDeUltimaRonda } from '../fs/rondas.js';
import { listExistingTaskIds, readTareaFile, isEnoent, isEnotdir } from '../fs/task-store.js';
import { runGit, GitCommandError, GitLaunchError } from '../fs/git.js';

export class MetricasCommandError extends Error {}

export const FLAGS_METRICAS: readonly string[] = ['--heuristica'];

export interface MetricasCommandResult {
  /** Vacio solo cuando no hay ni una tarea que leer. */
  output: string;
  totalTareas: number;
  advertencias: string[];
}

/** MENOR-2 de la revision: hay tareas, pero ninguna entra en la muestra. */
export const MUESTRA_HEURISTICA_VACIA =
  'n=0: ninguna tarea terminada con informes de revision; no hay muestra con la que ' +
  'comparar la heuristica. Sin --heuristica salen todas las tareas.';

export interface MetricasCommandDeps {
  /** Raiz del repo donde se consulta git log. */
  repoCwd: string;
  /** Ruta del YML de la heuristica (tests); por defecto la del plugin. */
  rutaHeuristica?: string;
}

const NOTA_CALENDARIO =
  'Duraciones de calendario: diseno = plan->start, curso = start->primer review, ' +
  'revision = primer review->finish. Las pausas no se descuentan. Con origen "registro" ' +
  'de filas antiguas (solo el dia) o mezcladas, la duracion va en dias ("N d").';

function parseHeuristicaFlag(argv: readonly string[]): boolean {
  const { flags, positional } = parseArgs(argv);
  if (positional.length > 0) {
    throw new MetricasCommandError(
      `[ERROR] taskctl metricas no admite argumentos sueltos ("${positional.join(' ')}"). ` +
        'Saca la tabla de todas las tareas; para una sola, filtra la salida.'
    );
  }
  const raw = flags['heuristica'];
  if (raw === undefined) return false;
  if (raw !== true) {
    throw new MetricasCommandError(
      '[ERROR] --heuristica no lleva valor: usalo suelto (taskctl metricas --heuristica).'
    );
  }
  return true;
}

async function nombresDeRevision(dirTarea: string): Promise<string[]> {
  try {
    return await readdir(path.join(dirTarea, 'revision'));
  } catch (e: unknown) {
    if (isEnoent(e) || isEnotdir(e)) return [];
    throw e;
  }
}

/** Un solo git log para todo el repo; null si git no se pudo consultar. */
function eventosGit(repoCwd: string): EventoGit[] | null {
  try {
    return parsearLogGit(runGit(['log', '--all', '--format=%at%x09%s'], repoCwd));
  } catch (e: unknown) {
    if (e instanceof GitCommandError || e instanceof GitLaunchError) return null;
    throw e;
  }
}

export async function runMetricasCommand(
  tareasRoot: string,
  argv: readonly string[],
  deps: MetricasCommandDeps
): Promise<MetricasCommandResult> {
  rechazarFlagsDesconocidos(argv, FLAGS_METRICAS, 'metricas', (m) => new MetricasCommandError(m));
  const conHeuristica = parseHeuristicaFlag(argv);
  // La heuristica se carga ANTES de leer nada: un YML roto aborta sin
  // haber sacado media tabla.
  const h = conHeuristica ? cargarHeuristica(deps.rutaHeuristica) : null;

  const advertencias: string[] = [];
  const ids = [...new Set(await listExistingTaskIds(tareasRoot))].sort(
    (a, b) => Number(a.slice(5)) - Number(b.slice(5))
  );

  const leidas: { task: NonNullable<Awaited<ReturnType<typeof readTareaFile>>>; ronda: number }[] = [];
  for (const id of ids) {
    try {
      const read = await readTareaFile(tareasRoot, id);
      if (read === null) continue;
      const nombres = await nombresDeRevision(path.dirname(read.filePath));
      leidas.push({ task: read, ronda: nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).ronda });
    } catch (e: unknown) {
      if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
        advertencias.push(`${id} tiene un tarea.md invalido y no aparece en las metricas: ${e.message}`);
        continue;
      }
      throw e;
    }
  }

  // git solo si hace falta, y una sola vez.
  const sinRegistro = leidas.some((l) => leerTransiciones(l.task.body).length === 0);
  let porId = new Map<string, EventoGit[]>();
  if (sinRegistro) {
    const eventos = eventosGit(deps.repoCwd);
    if (eventos === null) {
      advertencias.push(
        'No se pudo consultar git log: las tareas sin registro de Transiciones salen con "—". ' +
          'Ejecuta taskctl metricas desde la raiz del repo.'
      );
    } else {
      porId = new Map();
      for (const ev of eventos) {
        const lista = porId.get(ev.id) ?? [];
        lista.push(ev);
        porId.set(ev.id, lista);
      }
    }
  }

  let filas: FilaMetricas[] = leidas.map((l) =>
    calcularFila({
      task: l.task.task,
      body: l.task.body,
      ronda: l.ronda,
      eventosGit: porId.get(l.task.task.id) ?? [],
    })
  );

  if (filas.length === 0) return { output: '', totalTareas: 0, advertencias };

  if (h === null) {
    return {
      output: `${formatearTabla(filas, COLUMNAS_METRICAS)}\n\n${NOTA_CALENDARIO}`,
      totalTareas: filas.length,
      advertencias,
    };
  }

  const cuerpoPorId = new Map(leidas.map((l) => [l.task.task.id, l.task]));
  filas = filas.filter(enMuestraHeuristica).map((f) => {
    const leida = cuerpoPorId.get(f.id) as NonNullable<Awaited<ReturnType<typeof readTareaFile>>>;
    const { puntos } = puntuarTarea(leida.task, leida.body, h);
    return { ...f, heuristica: { puntos, nivel: nivelHeuristico(puntos, h) } };
  });
  if (filas.length === 0) return { output: MUESTRA_HEURISTICA_VACIA, totalTareas: 0, advertencias };
  const coinciden = filas.filter((f) => f.heuristica?.nivel === f.complejidad).length;
  const salida = [
    formatearTabla(filas, [...COLUMNAS_METRICAS, ...COLUMNAS_HEURISTICA]),
    '',
    `Muestra: ${String(filas.length)} tareas terminadas con informes de revision ` +
      '(rondas = numero de la ultima ronda; las tareas sin revision/ no entran). ' +
      `Declarado y heuristico coinciden en ${String(coinciden)} de ${String(filas.length)}.`,
    '',
    formatearResumen('Por complejidad declarada:', resumirPorNivel(filas, (f) => f.complejidad, TASK_COMPLEXITIES)),
    '',
    formatearResumen(
      'Por nivel heuristico:',
      resumirPorNivel(filas, (f) => f.heuristica?.nivel ?? null, TASK_COMPLEXITIES)
    ),
    '',
    NOTA_CALENDARIO,
  ].join('\n');
  return { output: salida, totalTareas: filas.length, advertencias };
}
