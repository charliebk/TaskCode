/**
 * taskctl new — alta individual de una tarea (TASK-003 de
 * PLAN_SPRINTS.md). Separa a proposito el parseo/validacion de
 * argumentos (puro, testeable sin disco) de la escritura real
 * (src/fs/task-store.ts).
 *
 * Desde TASK-012 aplica la precondicion de la seccion 8.3 antes de
 * tocar cualquier fichero (ni siquiera antes de calcular el siguiente
 * ID): ensureBaseBranchReady aborta si el workspace tiene cambios sin
 * commitear, o cambia automaticamente a la rama base esperada segun
 * --tipo si el workspace esta limpio pero no esta ya ahi.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from '../cli/args.js';
import {
  autoCommit,
  extraerPushFlag,
  mensajeChore,
  type AutoCommitResult,
} from '../fs/git-commit.js';
import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
import {
  TASK_TYPES,
  TASK_COMPLEXITIES,
  type Task,
  type TaskType,
  type TaskComplexity,
} from '../core/task.js';
import { nextTaskId } from '../core/task-id.js';
import { listExistingTaskIds, writeTareaFile } from '../fs/task-store.js';
import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
import { extraerSecciones } from '../core/tarea-body.js';

export class NewTaskArgError extends Error {}

export interface NewTaskOptions {
  titulo: string;
  tipo: TaskType;
  sprint: number;
  etiquetas: string[];
  complejidad: TaskComplexity | null;
  modeloSugerido: string;
  agenteRevisor: string;
}

const DEFAULT_SPRINT = 0;
/**
 * Sin --complejidad la tarea nace sin declararla (null): la decide la
 * heuristica al planificar (TASK-042, decision C4). Antes era `media`.
 */
const DEFAULT_COMPLEJIDAD: TaskComplexity | null = null;
const DEFAULT_MODELO = 'sonnet';
export const DEFAULT_BODY = '## Objetivo\n\n\n## Criterios de aceptacion\n- [ ] \n';

/**
 * Objetivo y criterios con los que nace la tarea (TASK-041). Sin ellos,
 * `DEFAULT_BODY` de siempre: la seccion vacia que `plan` exige rellenar.
 */
export interface ContenidoInicial {
  objetivo: string | null;
  criterios: string[];
  /** Fichero de `--desde`, si se paso. */
  desde: string | null;
}

/**
 * Saca de argv `--objetivo`, `--criterio` (repetible) y `--desde`, en sus
 * dos formas (`--flag valor` y `--flag=valor`). Se hace ANTES de
 * `parseArgs` porque ese parser se queda solo con el ultimo valor de un
 * flag repetido: con el, tres `--criterio` darian uno.
 */
export function extraerContenidoInicial(argv: readonly string[]): {
  contenido: ContenidoInicial;
  resto: string[];
} {
  const resto: string[] = [];
  const contenido: ContenidoInicial = { objetivo: null, criterios: [], desde: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    const m = /^--(objetivo|criterio|desde)(?:=(.*))?$/s.exec(arg);
    if (m === null) {
      resto.push(arg);
      continue;
    }
    const nombre = m[1] as 'objetivo' | 'criterio' | 'desde';
    let valor = m[2];
    if (valor === undefined) {
      valor = argv[i + 1];
      if (valor === undefined || valor.startsWith('--')) {
        throw new NewTaskArgError(`--${nombre} necesita un valor: --${nombre} "<texto>".`);
      }
      i++;
    }
    if (valor.trim() === '') {
      throw new NewTaskArgError(`--${nombre} no puede estar vacio.`);
    }
    // MEN-1 de la revision: un criterio es UNA linea de checklist (con
    // saltos, `plan` perdia lo que venia detras), y un objetivo con una
    // cabecera `##` partiria las secciones de tarea.md.
    if (nombre === 'criterio') contenido.criterios.push(valor.trim().replace(/\s*\r?\n\s*/g, ' '));
    else if (nombre === 'objetivo') {
      if (/^#{1,6}\s/m.test(valor)) {
        throw new NewTaskArgError(
          '--objetivo no puede contener cabeceras markdown (lineas que empiezan por "#"): ' +
            'partirian las secciones de tarea.md. Usa --desde <fichero> para un objetivo con estructura.'
        );
      }
      contenido.objetivo = valor.trim();
    }
    else contenido.desde = valor;
  }
  if (contenido.desde !== null && (contenido.objetivo !== null || contenido.criterios.length > 0)) {
    throw new NewTaskArgError(
      '--desde no se combina con --objetivo ni --criterio: o el fichero trae las dos ' +
        'secciones, o se pasan por flags.'
    );
  }
  return { contenido, resto };
}

/**
 * En la seccion de criterios de un fichero de `--desde`, una viñeta simple
 * (`- texto`, el formato de `import`) cuenta como criterio igual que una
 * con casilla (`- [ ] texto`). Fuera de esa seccion no se toca nada.
 */
function vinetasComoCasillas(texto: string): string {
  let enCriterios = false;
  return texto
    .split(/\r?\n/)
    .map((l) => {
      if (/^#{1,6}\s/.test(l)) {
        enCriterios = /^#{1,6}\s+criterios de aceptaci[oó]n\b/i.test(l);
        return l;
      }
      return enCriterios ? l.replace(/^(\s*)[-*]\s+(?!\[[ xX]\])/, '$1- [ ] ') : l;
    })
    .join('\n');
}

/** Cuerpo de tarea.md con el objetivo y los criterios dados (TASK-041). */
export function componerCuerpo(objetivo: string | null, criterios: readonly string[]): string {
  if (objetivo === null && criterios.length === 0) return DEFAULT_BODY;
  const lista = criterios.length === 0 ? ['- [ ] '] : criterios.map((c) => `- [ ] ${c}`);
  return `## Objetivo\n\n${objetivo ?? ''}\n\n## Criterios de aceptacion\n${lista.join('\n')}\n`;
}

/**
 * `agenteRevisorPorDefecto` (TASK-030, item C4) es lo que se usa
 * cuando no se pasa --agente-revisor. Antes de C4 era una constante
 * DUPLICADA aqui y en import.ts; ahora la unica fuente es
 * CONFIG_DEFAULTS y el valor efectivo lo decide
 * `.taskcode/config.yml` (clave `agente_revisor_por_defecto`).
 *
 * Es un parametro y no una lectura del fichero aqui dentro porque esta
 * funcion es pura y testeable sin disco (esa separacion es el motivo
 * de que exista). Quien resuelve el config es runNewCommand, que ya
 * tiene el cwd del repo. El default del parametro conserva el
 * comportamiento de las llamadas de un solo argumento.
 */
export function parseNewTaskArgs(
  argv: readonly string[],
  agenteRevisorPorDefecto: string = CONFIG_DEFAULTS.agente_revisor_por_defecto
): NewTaskOptions {
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

  let complejidad: TaskComplexity | null = DEFAULT_COMPLEJIDAD;
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
      : agenteRevisorPorDefecto;

  return { titulo, tipo: tipoRaw as TaskType, sprint, etiquetas, complejidad, modeloSugerido, agenteRevisor };
}

/**
 * Exportado (hallazgo CRITICO de revision por pares, TASK-004): "import"
 * reutiliza slugify() para su clave de idempotencia y necesita saber
 * cuando el resultado es este fallback generico, para no tratar dos
 * titulos MUY distintos que colisionan en el (p. ej. "日本語のタスク" y
 * "!!!???", ninguno con ASCII alfanumerico) como si fueran el mismo
 * titulo. Ver normalizedTitleKey en src/commands/import.ts.
 */
export const SLUG_FALLBACK = 'tarea';

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
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: today,
    actualizado: today,
    dependencias: [],
  };
}

export interface NewCommandResult {
  /** TASK-041: true si la tarea nacio con objetivo o criterios. */
  conContenido: boolean;
  id: string;
  filePath: string;
  baseBranchGuard: BaseBranchGuardResult;
  autoCommit: AutoCommitResult;
}

export interface NewCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
}

export async function runNewCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: NewCommandDeps
): Promise<NewCommandResult> {
  // El config se resuelve ANTES de parsear los argumentos (TASK-030,
  // item C4): si esta roto, se aborta sin haber tocado nada y sin
  // haber cambiado de rama. Un `.taskcode/config.yml` invalido es un
  // fallo del repo, no del comando, y enterarse de el despues de que
  // ensureBaseBranchReady te haya movido de rama seria peor.
  const config = resolverConfig(deps.repoCwd);
  // --push se saca ANTES de parseArgs a proposito (hallazgo del frente
  // C2): ese parser trata "--flag valor" como par, asi que
  // "taskctl new --push \"Titulo\"" habria leido push="Titulo" y el
  // titulo habria desaparecido.
  const { push, resto: sinPush } = extraerPushFlag(argv);
  // TASK-041: objetivo y criterios iniciales, antes de parseArgs.
  const { contenido, resto } = extraerContenidoInicial(sinPush);
  const opts = parseNewTaskArgs(resto, config.agente_revisor_por_defecto);
  // `--desde` se lee ANTES del guard de rama: un fichero que no existe
  // aborta sin haber tocado nada. Si vive dentro del repo sin commitear,
  // el guard de workspace sucio aborta como siempre.
  let cuerpo = componerCuerpo(contenido.objetivo, contenido.criterios);
  if (contenido.desde !== null) {
    let texto: string;
    try {
      texto = await readFile(path.resolve(deps.repoCwd, contenido.desde), 'utf8');
    } catch (e: unknown) {
      throw new NewTaskArgError(
        `No se pudo leer --desde "${contenido.desde}": ${e instanceof Error ? e.message : String(e)}`
      );
    }
    // MEN-7 de la revision: un fichero vacio no puede crear la tarea en
    // silencio con el cuerpo por defecto.
    if (texto.trim() === '') {
      throw new NewTaskArgError(`--desde "${contenido.desde}" esta vacio.`);
    }
    const secciones = extraerSecciones(vinetasComoCasillas(texto));
    const objetivo = secciones.objetivo.trim();
    const criterios = secciones.criterios.filter((c) => c.trim() !== '');
    // Sin las secciones de una tarea, el fichero entero es el objetivo.
    cuerpo =
      objetivo === '' && criterios.length === 0
        ? componerCuerpo(texto.trim(), [])
        : componerCuerpo(objetivo === '' ? null : objetivo, criterios);
  }
  // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
  // tiene cambios sin commitear, o si no puede cambiar de forma
  // automatica a la rama base esperada segun opts.tipo — en ambos
  // casos no se llega a leer ni escribir nada de tareas/.
  const baseBranchGuard = ensureBaseBranchReady(opts.tipo, deps.repoCwd);
  const existingIds = await listExistingTaskIds(tareasRoot);
  const id = nextTaskId(existingIds);
  const task = buildNewTask(id, opts, today);
  const filePath = await writeTareaFile(tareasRoot, task, cuerpo, { failIfExists: true });
  // Auto-commit (TASK-030, item C2): se commitea la CARPETA de la tarea
  // recien creada, no el arbol. La decision #14 fijo commitear si y
  // subir solo con --push.
  const autoCommitResult = autoCommit({
    cwd: deps.repoCwd,
    rutas: [path.dirname(filePath)],
    mensaje: mensajeChore(id, 'tarea creada'),
    push,
  });
  return {
    conContenido: cuerpo !== DEFAULT_BODY,
    id,
    filePath,
    baseBranchGuard,
    autoCommit: autoCommitResult,
  };
}
