/**
 * taskctl new — alta individual de una tarea (TASK-003 de
 * PLAN_SPRINTS.md). Separa a proposito el parseo/validacion de
 * argumentos (puro, testeable sin disco) de la escritura real
 * (src/fs/task-store.ts).
 */
import { parseArgs } from '../cli/args.js';
import {
  TASK_TYPES,
  TASK_COMPLEXITIES,
  type Task,
  type TaskType,
  type TaskComplexity,
} from '../core/task.js';
import { nextTaskId } from '../core/task-id.js';
import { listExistingTaskIds, writeTareaFile } from '../fs/task-store.js';

export class NewTaskArgError extends Error {}

export interface NewTaskOptions {
  titulo: string;
  tipo: TaskType;
  sprint: number;
  etiquetas: string[];
  complejidad: TaskComplexity;
  modeloSugerido: string;
  agenteRevisor: string;
}

const DEFAULT_SPRINT = 0;
const DEFAULT_COMPLEJIDAD: TaskComplexity = 'media';
const DEFAULT_MODELO = 'sonnet';
const DEFAULT_AGENTE_REVISOR = 'general-purpose';
export const DEFAULT_BODY = '## Objetivo\n\n\n## Criterios de aceptacion\n- [ ] \n';

export function parseNewTaskArgs(argv: readonly string[]): NewTaskOptions {
  const { positional, flags } = parseArgs(argv);

  const tituloFlag = flags['titulo'];
  const titulo = typeof tituloFlag === 'string' ? tituloFlag : positional[0];
  if (!titulo || titulo.trim() === '') {
    throw new NewTaskArgError(
      'Falta el titulo: usa --titulo "<texto>" o pasalo como primer argumento.'
    );
  }

  const tipoRaw = flags['tipo'];
  if (typeof tipoRaw !== 'string') {
    throw new NewTaskArgError(`Falta --tipo (uno de: ${TASK_TYPES.join(', ')}).`);
  }
  if (!(TASK_TYPES as readonly string[]).includes(tipoRaw)) {
    throw new NewTaskArgError(
      `--tipo "${tipoRaw}" invalido. Debe ser uno de: ${TASK_TYPES.join(', ')}.`
    );
  }

  let complejidad: TaskComplexity = DEFAULT_COMPLEJIDAD;
  const complejidadRaw = flags['complejidad'];
  if (complejidadRaw !== undefined) {
    if (
      typeof complejidadRaw !== 'string' ||
      !(TASK_COMPLEXITIES as readonly string[]).includes(complejidadRaw)
    ) {
      throw new NewTaskArgError(
        `--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`
      );
    }
    complejidad = complejidadRaw as TaskComplexity;
  }

  let sprint = DEFAULT_SPRINT;
  const sprintRaw = flags['sprint'];
  if (sprintRaw !== undefined) {
    if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
      throw new NewTaskArgError('--sprint debe ser un numero entero no negativo.');
    }
    sprint = parseInt(sprintRaw, 10);
  }

  const etiquetasRaw = flags['etiquetas'];
  const etiquetas =
    typeof etiquetasRaw === 'string' && etiquetasRaw.trim() !== ''
      ? etiquetasRaw
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

  const modeloSugerido =
    typeof flags['modelo-sugerido'] === 'string'
      ? (flags['modelo-sugerido'] as string)
      : DEFAULT_MODELO;
  const agenteRevisor =
    typeof flags['agente-revisor'] === 'string'
      ? (flags['agente-revisor'] as string)
      : DEFAULT_AGENTE_REVISOR;

  return { titulo, tipo: tipoRaw as TaskType, sprint, etiquetas, complejidad, modeloSugerido, agenteRevisor };
}

const SLUG_FALLBACK = 'tarea';

export function slugify(titulo: string): string {
  const base = titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const sliced = base.slice(0, 40).replace(/^-+|-+$/g, '');
  return sliced.length > 0 ? sliced : SLUG_FALLBACK;
}

export function buildNewTask(id: string, opts: NewTaskOptions, today: string): Task {
  const slug = slugify(opts.titulo);
  return {
    id,
    titulo: opts.titulo,
    tipo: opts.tipo,
    sprint: opts.sprint,
    etiquetas: opts.etiquetas,
    complejidad: opts.complejidad,
    modelo_sugerido: opts.modeloSugerido,
    estado: 'planificada',
    plan_aprobado: false,
    rama: `${opts.tipo}/${id.toLowerCase()}-${slug}`,
    asignado_a: null,
    agente_revisor: opts.agenteRevisor,
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: today,
    actualizado: today,
    dependencias: [],
  };
}

export interface NewCommandResult {
  id: string;
  filePath: string;
}

export async function runNewCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string
): Promise<NewCommandResult> {
  const opts = parseNewTaskArgs(argv);
  const existingIds = await listExistingTaskIds(tareasRoot);
  const id = nextTaskId(existingIds);
  const task = buildNewTask(id, opts, today);
  const filePath = await writeTareaFile(tareasRoot, task, DEFAULT_BODY, { failIfExists: true });
  return { id, filePath };
}
