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
 *
 * Nota (hallazgo IMPORTANTE de revision por pares): el fichero a
 * importar se lee ANTES de ensureBaseBranchReady, no despues. A
 * diferencia de "new" (que no depende de ningun fichero externo que
 * pueda no existir), "import" si tiene un argumento que puede fallar
 * — y si esa comprobacion corriera despues de la precondicion, un
 * "taskctl import fichero-que-no-existe.md" desde una rama de feature
 * limpia cambiaria de rama igualmente (porque el workspace SI esta
 * limpio) y luego fallaria, dejando a la persona en la rama base sin
 * avisarle del cambio (el aviso solo se imprime en el camino de
 * exito). Leer el fichero primero no incumple "no toca nada antes de
 * la precondicion" — esa garantia es sobre tareas/ y Git, no sobre
 * validar los argumentos de entrada.
 */
import { readFile } from 'node:fs/promises';
import { parseArgs } from '../cli/args.js';
import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
import { TASK_TYPES, TASK_COMPLEXITIES, TaskValidationError, type TaskType, type TaskComplexity } from '../core/task.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { nextTaskId } from '../core/task-id.js';
import {
  listExistingTaskIds,
  readTareaFile,
  writeTareaFile,
  TaskAlreadyExistsError,
} from '../fs/task-store.js';
import { parseImportMarkdown } from '../core/import-parser.js';
import { slugify, buildNewTask, SLUG_FALLBACK } from './new.js';

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

/**
 * Clave de idempotencia por "titulo normalizado" (hallazgo CRITICO de
 * revision por pares): slugify() colapsa CUALQUIER titulo sin ningun
 * caracter ASCII alfanumerico al mismo literal SLUG_FALLBACK
 * ("tarea") — pensado para nombrar la rama de una tarea aislada
 * (taskctl new), donde es inofensivo. Reutilizado tal cual como clave
 * de deteccion de duplicados en un import de VARIAS tareas, dos
 * titulos completamente distintos que caen en el fallback (p. ej.
 * "日本語のタスク" y "!!!???") colisionaban en silencio: la segunda
 * se descartaba como si ya existiera, sin ningun aviso real, violando
 * el criterio de aceptacion "5 tareas bien formadas -> 5 ficheros".
 * Fuera del caso fallback, el comportamiento no cambia: sigue usando
 * el slug tal cual (misma insensibilidad a mayusculas/acentos que ya
 * prueban los tests de idempotencia).
 */
export function normalizedTitleKey(titulo: string): string {
  const slug = slugify(titulo);
  if (slug !== SLUG_FALLBACK) return slug;
  return `${SLUG_FALLBACK}:${titulo.trim().toLowerCase()}`;
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
  /**
   * Avisos que no impiden el import pero merecen visibilidad
   * (hallazgo IMPORTANTE de revision por pares): p. ej. una tarea
   * YA EXISTENTE, ajena a este import, cuyo tarea.md esta corrupto y
   * no se pudo leer para calcular la deteccion de duplicados.
   */
  advertencias: string[];
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

  let content: string;
  try {
    content = await readFile(opts.filePath, 'utf8');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new ImportCommandError(`No se pudo leer "${opts.filePath}": ${msg}`);
  }

  // Solo AHORA, con el fichero ya leido con exito, se aplica la
  // precondicion de rama base — ver nota de cabecera del fichero.
  const baseBranchGuard = ensureBaseBranchReady(opts.tipo, deps.repoCwd);

  const parsed = parseImportMarkdown(content);

  const errores: ImportErrorEntry[] = [];
  const omitidas: ImportSkippedEntry[] = [];
  const creadas: ImportCreatedEntry[] = [];
  const advertencias: string[] = [];

  let existingIds = await listExistingTaskIds(tareasRoot);
  const usedSlugs = new Set<string>();
  // Lectura en paralelo (hallazgo MENOR de revision por pares,
  // corregido de paso): cada tarea existente se lee de forma
  // independiente, sin esperar a la anterior. Una tarea.md corrupta
  // (hallazgo IMPORTANTE de revision por pares) ya NO bloquea el
  // import entero: se reporta como advertencia y esa tarea
  // simplemente no participa en la deteccion de duplicados.
  await Promise.all(
    existingIds.map(async (id) => {
      try {
        const existing = await readTareaFile(tareasRoot, id);
        if (existing) usedSlugs.add(normalizedTitleKey(existing.task.titulo));
      } catch (e: unknown) {
        if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
          const msg = e instanceof Error ? e.message : String(e);
          advertencias.push(
            `${id} tiene un tarea.md invalido y no se pudo leer (no participa en la deteccion ` +
              `de duplicados de este import): ${msg}`
          );
          return;
        }
        throw e;
      }
    })
  );

  for (const entry of parsed) {
    if (!entry.ok) {
      errores.push({ tituloRaw: entry.tituloRaw, motivo: entry.motivo, lineNumber: entry.lineNumber });
      continue;
    }

    const key = normalizedTitleKey(entry.titulo);
    if (usedSlugs.has(key)) {
      omitidas.push({
        titulo: entry.titulo,
        motivo: `ya existe una tarea con el titulo normalizado "${slugify(entry.titulo)}"; no se sobreescribe.`,
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

    let filePath: string;
    try {
      filePath = await writeTareaFile(tareasRoot, task, body, { failIfExists: true });
    } catch (e: unknown) {
      // Hallazgo IMPORTANTE de revision por pares: si otra ejecucion
      // concurrente ("taskctl new"/"taskctl import" en paralelo) crea
      // ese mismo ID entre listExistingTaskIds() y este write, antes
      // esto escapaba sin capturar y perdia el resumen entero de la
      // pasada (incluidas las tareas ya escritas con exito antes en
      // el mismo bucle). Ahora se reporta como error de ESTA entrada
      // y el import sigue con las demas — igual que una entrada
      // malformada — resincronizando el listado de IDs para no volver
      // a calcular el mismo ID ya ocupado en la siguiente vuelta.
      if (e instanceof TaskAlreadyExistsError) {
        errores.push({
          tituloRaw: entry.titulo,
          lineNumber: entry.lineNumber,
          motivo:
            `no se pudo crear como ${id}: ${e.message} Puede haberse creado por otra ejecucion ` +
            'concurrente de "taskctl new"/"taskctl import"; las tareas ya creadas en esta misma ' +
            'pasada se conservan. Vuelve a intentar el import para esta entrada.',
        });
        existingIds = await listExistingTaskIds(tareasRoot);
        continue;
      }
      throw e;
    }

    creadas.push({ id, titulo: entry.titulo, filePath });
    existingIds = [...existingIds, id];
    usedSlugs.add(key);
  }

  return { baseBranchGuard, creadas, omitidas, errores, advertencias };
}
