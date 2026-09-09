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
import path from 'node:path';
import { parseArgs } from '../cli/args.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { ensureBaseBranchReady } from '../fs/git.js';
import { TASK_TYPES, TASK_COMPLEXITIES, } from '../core/task.js';
import { nextTaskId } from '../core/task-id.js';
import { listExistingTaskIds, writeTareaFile } from '../fs/task-store.js';
import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
export class NewTaskArgError extends Error {
}
const DEFAULT_SPRINT = 0;
const DEFAULT_COMPLEJIDAD = 'media';
const DEFAULT_MODELO = 'sonnet';
export const DEFAULT_BODY = '## Objetivo\n\n\n## Criterios de aceptacion\n- [ ] \n';
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
export function parseNewTaskArgs(argv, agenteRevisorPorDefecto = CONFIG_DEFAULTS.agente_revisor_por_defecto) {
    const { positional, flags } = parseArgs(argv);
    const tituloFlag = flags['titulo'];
    const titulo = typeof tituloFlag === 'string' ? tituloFlag : positional[0];
    if (!titulo || titulo.trim() === '') {
        throw new NewTaskArgError('Falta el titulo: usa --titulo "<texto>" o pasalo como primer argumento.');
    }
    const tipoRaw = flags['tipo'];
    if (typeof tipoRaw !== 'string') {
        throw new NewTaskArgError(`Falta --tipo (uno de: ${TASK_TYPES.join(', ')}).`);
    }
    if (!TASK_TYPES.includes(tipoRaw)) {
        throw new NewTaskArgError(`--tipo "${tipoRaw}" invalido. Debe ser uno de: ${TASK_TYPES.join(', ')}.`);
    }
    let complejidad = DEFAULT_COMPLEJIDAD;
    const complejidadRaw = flags['complejidad'];
    if (complejidadRaw !== undefined) {
        if (typeof complejidadRaw !== 'string' ||
            !TASK_COMPLEXITIES.includes(complejidadRaw)) {
            throw new NewTaskArgError(`--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`);
        }
        complejidad = complejidadRaw;
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
    const etiquetas = typeof etiquetasRaw === 'string' && etiquetasRaw.trim() !== ''
        ? etiquetasRaw
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [];
    const modeloSugerido = typeof flags['modelo-sugerido'] === 'string'
        ? flags['modelo-sugerido']
        : DEFAULT_MODELO;
    const agenteRevisor = typeof flags['agente-revisor'] === 'string'
        ? flags['agente-revisor']
        : agenteRevisorPorDefecto;
    return { titulo, tipo: tipoRaw, sprint, etiquetas, complejidad, modeloSugerido, agenteRevisor };
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
export function slugify(titulo) {
    const base = titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const sliced = base.slice(0, 40).replace(/^-+|-+$/g, '');
    return sliced.length > 0 ? sliced : SLUG_FALLBACK;
}
export function buildNewTask(id, opts, today) {
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
export async function runNewCommand(tareasRoot, argv, today, deps) {
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
    const { push, resto } = extraerPushFlag(argv);
    const opts = parseNewTaskArgs(resto, config.agente_revisor_por_defecto);
    // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
    // tiene cambios sin commitear, o si no puede cambiar de forma
    // automatica a la rama base esperada segun opts.tipo — en ambos
    // casos no se llega a leer ni escribir nada de tareas/.
    const baseBranchGuard = ensureBaseBranchReady(opts.tipo, deps.repoCwd);
    const existingIds = await listExistingTaskIds(tareasRoot);
    const id = nextTaskId(existingIds);
    const task = buildNewTask(id, opts, today);
    const filePath = await writeTareaFile(tareasRoot, task, DEFAULT_BODY, { failIfExists: true });
    // Auto-commit (TASK-030, item C2): se commitea la CARPETA de la tarea
    // recien creada, no el arbol. La decision #14 fijo commitear si y
    // subir solo con --push.
    const autoCommitResult = autoCommit({
        cwd: deps.repoCwd,
        rutas: [path.dirname(filePath)],
        mensaje: mensajeChore(id, 'tarea creada'),
        push,
    });
    return { id, filePath, baseBranchGuard, autoCommit: autoCommitResult };
}
