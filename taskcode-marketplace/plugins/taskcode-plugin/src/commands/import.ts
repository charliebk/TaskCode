/**
 * taskctl import — alta masiva de tareas desde un fichero Markdown
 * (TASK-004 de PLAN_SPRINTS.md). Reutiliza el parser puro de
 * src/core/import-parser.ts y, por cada entrada valida, construye la
 * tarea con `buildNewTask` (el mismo constructor que usa `taskctl
 * new`, TASK-003/TASK-012) para no duplicar la logica de slug/rama.
 *
 * Aplica la precondicion de la seccion 8.3 (TASK-012) igual que
 * `taskctl new`: import solo CREA tareas, nunca las modifica, asi que
 * — igual que new.ts documenta — no hace falta el patron de "doble
 * lectura" de plan.ts/approve.ts: toda lectura de tareas/ existentes
 * ocurre DESPUES de ensureBaseBranchReady, ya en la rama base real.
 */
import { readFile } from 'node:fs/promises';
import { parseArgs } from '../cli/args.js';
import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
import { TASK_TYPES, TASK_COMPLEXITIES, type TaskType, type TaskComplexity } from '../core/task.js';
import { nextTaskId } from '../core/task-id.js';
import { listExistingTaskIds, readTareaFile, writeTareaFile } from '../fs/task-store.js';
import { parseImportMarkdown } from '../core/import-parser.js';
import { slugify, buildNewTask } from './new.js';

export class ImportCommandError extends Error {}

export interface ImportOptions {
  filePath: string;
  tipo: TaskType;
  sprint: number;
  complejidad: TaskComplexity;
  modeloSugerido: string;
  agenteRevisor: string;
}

const DEFAULT_SPRINT = 0;
const DEFAULT_COMPLEJIDAD: TaskComplexity = 'media';
const DEFAULT_MODELO = 'sonnet';
const DEFAULT_AGENTE_REVISOR = 'general-purpose';

/**
 * Un unico --tipo/--sprint/--complejidad para todo el fichero (no hay
 * sintaxis por entrada): mismo enfoque deliberadamente simple que el
 * resto de Sprint 0 — "taskctl import docs/sprint-N-propuesta.md"
 * importa un lote homogeneo (un sprint, un tipo de trabajo).
 */
export function parseImportArgs(argv: readonly string[]): ImportOptions {
  const { positional, flags } = parseArgs(argv);

  const filePath = positional[0];
  if (!filePath || filePath.trim() === '') {
    throw new ImportCommandError(
      'Falta la ruta del fichero Markdown a importar (primer argumento posicional).'
    );
  }

  let tipo: TaskType = 'feature';
  const tipoRaw = flags['tipo'];
  if (tipoRaw !== undefined) {
    if (typeof tipoRaw !== 'string' || !(TASK_TYPES as readonly string[]).includes(tipoRaw)) {
      throw new ImportCommandError(
        `--tipo "${String(tipoRaw)}" invalido. Debe ser uno de: ${TASK_TYPES.join(', ')}.`
      );
    }
    tipo = tipoRaw as TaskType;
  }

  let complejidad: TaskComplexity = DEFAULT_COMPLEJIDAD;
  const complejidadRaw = flags['complejidad'];
  if (complejidadRaw !== undefined) {
    if (
      typeof complejidadRaw !== 'string' ||
      !(TASK_COMPLEXITIES as readonly string[]).includes(complejidadRaw)
    ) {
      throw new ImportCommandError(
        `--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`
      );
    }
    complejidad = complejidadRaw as TaskComplexity;
  }

  let sprint = DEFAULT_SPRINT;
  const sprintRaw = flags['sprint'];
  if (sprintRaw !== undefined) {
    if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
      throw new ImportCommandError('--sprint debe ser un numero entero no negativo.');
    }
    sprint = parseInt(sprintRaw, 10);
  }

  const modeloSugerido =
    typeof flags['modelo-sugerido'] === 'string' ? (flags['modelo-sugerido'] as string) : DEFAULT_MODELO;
  const agenteRevisor =
    typeof flags['agente-revisor'] === 'string'
      ? (flags['agente-revisor'] as string)
      : DEFAULT_AGENTE_REVISOR;

  return { filePath, tipo, sprint, complejidad, modeloSugerido, agenteRevisor };
}

export interface ImportCreatedEntry {
  id: string;
  titulo: string;
  filePath: string;
}

export interface ImportSkippedEntry {
  titulo: string;
  motivo: string;
}

export interface ImportErrorEntry {
  tituloRaw: string;
  motivo: string;
  lineNumber: number;
}

export interface ImportCommandResult {
  baseBranchGuard: BaseBranchGuardResult;
  creadas: ImportCreatedEntry[];
  omitidas: ImportSkippedEntry[];
  errores: ImportErrorEntry[];
}

export interface ImportCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
}

export async function runImportCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: ImportCommandDeps
): Promise<ImportCommandResult> {
  const opts = parseImportArgs(argv);
  // Igual que "new" (TASK-012): la precondicion corre ANTES de leer o
  // escribir nada de tareas/, incluso antes de intentar abrir el
  // fichero a importar.
  const baseBranchGuard = ensureBaseBranchReady(opts.tipo, deps.repoCwd);

  let content: string;
  try {
    content = await readFile(opts.filePath, 'utf8');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new ImportCommandError(`No se pudo leer "${opts.filePath}": ${msg}`);
  }

  const parsed = parseImportMarkdown(content);

  const errores: ImportErrorEntry[] = [];
  const omitidas: ImportSkippedEntry[] = [];
  const creadas: ImportCreatedEntry[] = [];

  let existingIds = await listExistingTaskIds(tareasRoot);
  // Titulo normalizado = mismo slug que usa "taskctl new" para la
  // rama (TASK-012 lo reutiliza tal cual): es la nocion de "mismo
  // titulo" mas barata de calcular sin arrastrar un segundo criterio
  // de similitud. Se calcula una vez, leyendo cada tarea existente,
  // y se actualiza en memoria segun se van creando tareas nuevas en
  // esta misma pasada (para que dos entradas iguales dentro del mismo
  // fichero tambien se detecten, no solo contra tareas ya en disco).
  const usedSlugs = new Set<string>();
  for (const id of existingIds) {
    const existing = await readTareaFile(tareasRoot, id);
    if (existing) usedSlugs.add(slugify(existing.task.titulo));
  }

  for (const entry of parsed) {
    if (!entry.ok) {
      errores.push({ tituloRaw: entry.tituloRaw, motivo: entry.motivo, lineNumber: entry.lineNumber });
      continue;
    }

    const slug = slugify(entry.titulo);
    if (usedSlugs.has(slug)) {
      omitidas.push({
        titulo: entry.titulo,
        motivo: `ya existe una tarea con el titulo normalizado "${slug}"; no se sobreescribe.`,
      });
      continue;
    }

    const id = nextTaskId(existingIds);
    const body = `## Objetivo\n\n\n## Criterios de aceptacion\n${entry.criterios
      .map((c) => `- [ ] ${c}`)
      .join('\n')}\n`;
    const task = buildNewTask(
      id,
      {
        titulo: entry.titulo,
        tipo: opts.tipo,
        sprint: opts.sprint,
        etiquetas: [],
        complejidad: opts.complejidad,
        modeloSugerido: opts.modeloSugerido,
        agenteRevisor: opts.agenteRevisor,
      },
      today
    );
    const filePath = await writeTareaFile(tareasRoot, task, body, { failIfExists: true });

    creadas.push({ id, titulo: entry.titulo, filePath });
    existingIds = [...existingIds, id];
    usedSlugs.add(slug);
  }

  return { baseBranchGuard, creadas, omitidas, errores };
}
