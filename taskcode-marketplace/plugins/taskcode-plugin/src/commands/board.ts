/**
 * taskctl board — listado de tareas por estado (TASK-005 de
 * PLAN_SPRINTS.md). A diferencia de "new"/"import"/"plan"/"approve",
 * board es de SOLO LECTURA: no crea ni modifica ningun fichero de
 * tareas/ ni toca Git, asi que no aplica la precondicion de rama base
 * de la seccion 8.3 (esa precondicion es para comandos que escriben
 * en la rama activa — TASK-012 ya lo dice explicitamente para "start",
 * y por el mismo motivo tampoco aplica aqui).
 *
 * Lee CADA tarea existente (no solo los nombres de carpeta) para poder
 * filtrar y mostrar titulo/asignado — a diferencia de "import", que
 * solo necesitaba el titulo de las tareas ya existentes para detectar
 * duplicados, board los necesita todos para el listado en si. Aplica
 * el mismo tratamiento que TASK-004 establecio para una tarea.md
 * invalida ajena (FrontmatterParseError/TaskValidationError): se
 * reporta como advertencia y esa tarea concreta no aparece en el
 * board, en vez de romper el comando entero.
 */
import path from 'node:path';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
import { parseAsignadoAFlag } from '../cli/asignado.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { TaskValidationError, type Task } from '../core/task.js';
import {
  filterTasks,
  formatBoard,
  renderBoardMarkdown,
  type BoardFilters,
} from '../core/board-format.js';
import { listExistingTaskIds, readTareaFile, isEnoent } from '../fs/task-store.js';

export class BoardCommandError extends Error {}

/** Flags de `taskctl board`: parseBoardArgs, parseEscribirFlag y parseAsignadoAFlag (con su alias). */
export const FLAGS_BOARD: readonly string[] = ['--sprint', '--asignado-a', '--asignado_a', '--escribir'];

/** Ruta de docs/BOARD.md dentro del repo del usuario. */
export function boardFilePath(repoCwd: string): string {
  return path.join(repoCwd, 'docs', 'BOARD.md');
}

/**
 * true si se pidio "--escribir" (item B5): regenerar docs/BOARD.md
 * ademas de listar por pantalla. No se escribe por defecto a
 * proposito: "board" es hoy el unico comando de solo lectura del CLI, y
 * escribir en cada invocacion ensuciaria el workspace, disparando el
 * guard de la seccion 8.3 en el siguiente plan/start/review/finish —
 * exactamente la trampa que "taskctl import" ya documenta en
 * HALLAZGOS.md (genera la suciedad que bloquea su propio siguiente uso).
 */
function parseEscribirFlag(argv: readonly string[]): boolean {
  const { flags } = parseArgs(argv);
  const raw = flags['escribir'];
  if (raw === undefined) return false;
  if (raw !== true) {
    throw new BoardCommandError('--escribir no lleva valor: usalo suelto (taskctl board --escribir).');
  }
  return true;
}

export function parseBoardArgs(argv: readonly string[]): BoardFilters {
  const { flags } = parseArgs(argv);
  const filters: BoardFilters = {};

  const sprintRaw = flags['sprint'];
  if (sprintRaw !== undefined) {
    if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
      throw new BoardCommandError('--sprint debe ser un numero entero no negativo.');
    }
    filters.sprint = parseInt(sprintRaw, 10);
  }

  // Historicamente este filtro solo aceptaba "--asignado_a", con guion
  // bajo: asi lo especifico el Objetivo de TASK-005, a proposito igual
  // al nombre del campo en el frontmatter aunque rompiera la convencion
  // de guiones del resto de flags del CLI.
  //
  // Desde B6 acepta TAMBIEN "--asignado-a", que es el nombre que la
  // seccion 8.2 de la metodologia da al flag de "plan"/"start" y el que
  // sale en la ayuda. Sin esto (hallazgo IMPORTANTE de revision por
  // pares, B6), quien acababa de asignar con "plan --asignado-a carlos"
  // y reutilizaba esa grafia aqui recibia EL TABLERO ENTERO con codigo
  // 0 — parseArgs ignora los flags que no conoce — y concluia que
  // carlos tenia todas las tareas del repo. Mismo modulo y mismas
  // reglas que plan/start, para que las tres no puedan divergir.
  const asignadoA = parseAsignadoAFlag(argv, (m) => new BoardCommandError(m));
  if (asignadoA !== undefined) {
    filters.asignadoA = asignadoA;
  }

  return filters;
}

export interface BoardCommandResult {
  output: string;
  totalTareas: number;
  advertencias: string[];
  /** Ruta de docs/BOARD.md si se paso --escribir; null si no. */
  boardPath: string | null;
}

export interface BoardCommandDeps {
  /** Solo lo necesita "--escribir": raiz del repo donde vive docs/. */
  repoCwd?: string;
  /** Fecha para la cabecera del fichero generado (solo con --escribir). */
  today?: string;
}

export async function runBoardCommand(
  tareasRoot: string,
  argv: readonly string[],
  deps: BoardCommandDeps = {}
): Promise<BoardCommandResult> {
  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
  rechazarFlagsDesconocidos(argv, FLAGS_BOARD, 'board', (m) => new BoardCommandError(m));
  const filters = parseBoardArgs(argv);
  const escribir = parseEscribirFlag(argv);

  // docs/BOARD.md es el tablero COMPLETO del repo (es lo que regenera
  // taskctl finish). Escribirlo con filtros dejaria un fichero parcial
  // que parece el tablero entero: se rechaza en vez de generar algo
  // enganoso.
  if (escribir && (filters.sprint !== undefined || filters.asignadoA !== undefined)) {
    throw new BoardCommandError(
      '--escribir no se puede combinar con --sprint ni --asignado-a: docs/BOARD.md es el ' +
        'tablero completo del repo. Ejecuta "taskctl board --escribir" sin filtros, o quita ' +
        '--escribir para ver el listado filtrado por pantalla.'
      // (--asignado_a, con guion bajo, es el mismo filtro: ver
      // parseBoardArgs.)
    );
  }
  if (escribir && (deps.repoCwd === undefined || deps.today === undefined)) {
    throw new BoardCommandError(
      '--escribir necesita saber la raiz del repo y la fecha; invocalo desde el CLI.'
    );
  }
  // Sin esto (hallazgo IMPORTANTE de revision por pares, B5), ejecutar
  // "board --escribir" desde una subcarpeta o desde un directorio que
  // no es un repo de TaskCode creaba un docs/BOARD.md fantasma con solo
  // la cabecera — un tablero aparentemente vacio pero legitimo, y
  // basura que luego dispara el guard de la seccion 8.3.
  if (escribir) {
    try {
      await stat(tareasRoot);
    } catch (e: unknown) {
      if (!isEnoent(e)) throw e;
      throw new BoardCommandError(
        `No existe "${tareasRoot}", asi que esto no parece la raiz de un repo con tareas. ` +
          'Ejecuta "taskctl board --escribir" desde la raiz del repo (donde esta la carpeta ' +
          '"tareas"), no desde una subcarpeta.'
      );
    }
  }

  const rawIds = await listExistingTaskIds(tareasRoot);
  const tasks: Task[] = [];
  const advertencias: string[] = [];

  // listExistingTaskIds devuelve un ID una vez POR CARPETA de estado
  // en la que aparece: si el mismo ID existe a la vez en dos carpetas
  // (inconsistencia de datos -- p. ej. un merge de Git-Flow que dejo
  // la carpeta vieja sin borrar), el ID sale repetido en rawIds.
  // Hallazgo IMPORTANTE de revision por pares: iterar rawIds tal cual
  // mostraba esa tarea DOS VECES (siempre con el mismo contenido,
  // porque readTareaFile ya devuelve solo la primera coincidencia
  // segun el orden del ciclo de vida) y escondia en silencio la copia
  // real mas avanzada, sin ningun aviso. Deduplicado aqui, con una
  // advertencia explicita cuando se detecta la inconsistencia -- mismo
  // tratamiento que una tarea.md invalida.
  const idCounts = new Map<string, number>();
  for (const id of rawIds) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);

  await Promise.all(
    [...idCounts.keys()].map(async (id) => {
      const count = idCounts.get(id) ?? 1;
      if (count > 1) {
        advertencias.push(
          `${id} existe en ${count} carpetas de estado distintas a la vez (inconsistencia de ` +
            'datos); se muestra la copia de la carpeta mas temprana del ciclo de vida -- revisa ' +
            'el repo a mano.'
        );
      }
      try {
        const read = await readTareaFile(tareasRoot, id);
        if (read) tasks.push(read.task);
      } catch (e: unknown) {
        if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
          const msg = e instanceof Error ? e.message : String(e);
          advertencias.push(`${id} tiene un tarea.md invalido y no aparece en el board: ${msg}`);
          return;
        }
        throw e;
      }
    })
  );

  // Orden estable de los avisos (hallazgo IMPORTANTE de revision por
  // pares, B5): se acumulan dentro del Promise.all, asi que su orden
  // dependia de cuando terminaba cada lectura de disco. Mientras solo
  // salian por pantalla era cosmetico; desde que acaban DENTRO de
  // docs/BOARD.md, un fichero versionado, hacian que dos ejecuciones
  // seguidas con la misma entrada produjeran ficheros distintos.
  advertencias.sort();

  const filtered = filterTasks(tasks, filters);
  const output = formatBoard(filtered);

  let boardPath: string | null = null;
  if (escribir) {
    boardPath = boardFilePath(deps.repoCwd as string);
    try {
      await mkdir(path.dirname(boardPath), { recursive: true });
      await writeFile(
        boardPath,
        renderBoardMarkdown(output, advertencias, deps.today as string, 'taskctl board --escribir'),
        'utf8'
      );
    } catch (e: unknown) {
      // Sin esto, un EPERM/EEXIST de disco escapaba del catch del CLI y
      // salia como "taskctl no pudo arrancar" (hallazgo MENOR de
      // revision por pares, B5), que es falso y despista.
      const msg = e instanceof Error ? e.message : String(e);
      throw new BoardCommandError(
        `No se pudo escribir ${boardPath}: ${msg}. Comprueba permisos y que "docs" sea una ` +
          'carpeta; el listado por pantalla de arriba si es correcto.'
      );
    }
  }

  return { output, totalTareas: filtered.length, advertencias, boardPath };
}
