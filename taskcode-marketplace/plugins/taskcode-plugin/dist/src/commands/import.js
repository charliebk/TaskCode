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
import path from 'node:path';
import { parseArgs } from '../cli/args.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { ensureBaseBranchReady } from '../fs/git.js';
import { TASK_TYPES, TASK_COMPLEXITIES, TaskValidationError } from '../core/task.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { nextTaskId } from '../core/task-id.js';
import { listExistingTaskIds, readTareaFile, writeTareaFile, TaskAlreadyExistsError, } from '../fs/task-store.js';
import { parseImportMarkdown } from '../core/import-parser.js';
import { slugify, buildNewTask, SLUG_FALLBACK } from './new.js';
import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
export class ImportCommandError extends Error {
}
const DEFAULT_SPRINT = 0;
/**
 * Sin --complejidad la tarea nace sin declararla (null): la decide la
 * heuristica al planificar (TASK-042, decision C4). Antes era `media`.
 */
const DEFAULT_COMPLEJIDAD = null;
const DEFAULT_MODELO = 'sonnet';
/**
 * Un unico --tipo/--sprint/--complejidad para todo el fichero (no hay
 * sintaxis por entrada): mismo enfoque deliberadamente simple que el
 * resto de Sprint 0 — "taskctl import docs/sprint-N-propuesta.md"
 * importa un lote homogeneo (un sprint, un tipo de trabajo).
 *
 * `agenteRevisorPorDefecto` (TASK-030, item C4): hasta C4 este fichero
 * tenia su propia constante DEFAULT_AGENTE_REVISOR = 'general-purpose',
 * copia literal de la de new.ts. Dos copias del mismo default en dos
 * comandos que crean la misma clase de tarea es precisamente lo que la
 * decision #9 mandaba eliminar. La unica fuente es ahora
 * CONFIG_DEFAULTS, y el valor efectivo lo decide
 * `.taskcode/config.yml`.
 */
export function parseImportArgs(argv, agenteRevisorPorDefecto = CONFIG_DEFAULTS.agente_revisor_por_defecto) {
    const { positional, flags } = parseArgs(argv);
    const filePath = positional[0];
    if (!filePath || filePath.trim() === '') {
        throw new ImportCommandError('Falta la ruta del fichero Markdown a importar (primer argumento posicional).');
    }
    let tipo = 'feature';
    const tipoRaw = flags['tipo'];
    if (tipoRaw !== undefined) {
        if (typeof tipoRaw !== 'string' || !TASK_TYPES.includes(tipoRaw)) {
            throw new ImportCommandError(`--tipo "${String(tipoRaw)}" invalido. Debe ser uno de: ${TASK_TYPES.join(', ')}.`);
        }
        tipo = tipoRaw;
    }
    let complejidad = DEFAULT_COMPLEJIDAD;
    const complejidadRaw = flags['complejidad'];
    if (complejidadRaw !== undefined) {
        if (typeof complejidadRaw !== 'string' ||
            !TASK_COMPLEXITIES.includes(complejidadRaw)) {
            throw new ImportCommandError(`--complejidad invalida. Debe ser una de: ${TASK_COMPLEXITIES.join(', ')}.`);
        }
        complejidad = complejidadRaw;
    }
    let sprint = DEFAULT_SPRINT;
    const sprintRaw = flags['sprint'];
    if (sprintRaw !== undefined) {
        if (typeof sprintRaw !== 'string' || !/^\d+$/.test(sprintRaw)) {
            throw new ImportCommandError('--sprint debe ser un numero entero no negativo.');
        }
        sprint = parseInt(sprintRaw, 10);
    }
    const modeloSugerido = typeof flags['modelo-sugerido'] === 'string' ? flags['modelo-sugerido'] : DEFAULT_MODELO;
    const agenteRevisor = typeof flags['agente-revisor'] === 'string'
        ? flags['agente-revisor']
        : agenteRevisorPorDefecto;
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
export function normalizedTitleKey(titulo) {
    const slug = slugify(titulo);
    if (slug !== SLUG_FALLBACK)
        return slug;
    return `${SLUG_FALLBACK}:${titulo.trim().toLowerCase()}`;
}
export async function runImportCommand(tareasRoot, argv, today, deps) {
    // Igual que en new.ts (TASK-030, item C4): el config se resuelve lo
    // primero, para que un `.taskcode/config.yml` roto aborte antes de
    // leer el fichero a importar y antes de cualquier cambio de rama.
    const config = resolverConfig(deps.repoCwd);
    // --push fuera de parseArgs, mismo motivo que en new.ts: ese parser
    // trata "--flag valor" como par y se comeria la ruta del fichero.
    const { push, resto } = extraerPushFlag(argv);
    const opts = parseImportArgs(resto, config.agente_revisor_por_defecto);
    let content;
    try {
        content = await readFile(opts.filePath, 'utf8');
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new ImportCommandError(`No se pudo leer "${opts.filePath}": ${msg}`);
    }
    // Solo AHORA, con el fichero ya leido con exito, se aplica la
    // precondicion de rama base — ver nota de cabecera del fichero.
    const baseBranchGuard = ensureBaseBranchReady(opts.tipo, deps.repoCwd);
    const parsed = parseImportMarkdown(content);
    const errores = [];
    const omitidas = [];
    const creadas = [];
    const advertencias = [];
    let existingIds = await listExistingTaskIds(tareasRoot);
    const usedSlugs = new Set();
    // Lectura en paralelo (hallazgo MENOR de revision por pares,
    // corregido de paso): cada tarea existente se lee de forma
    // independiente, sin esperar a la anterior. Una tarea.md corrupta
    // (hallazgo IMPORTANTE de revision por pares) ya NO bloquea el
    // import entero: se reporta como advertencia y esa tarea
    // simplemente no participa en la deteccion de duplicados.
    await Promise.all(existingIds.map(async (id) => {
        try {
            const existing = await readTareaFile(tareasRoot, id);
            if (existing)
                usedSlugs.add(normalizedTitleKey(existing.task.titulo));
        }
        catch (e) {
            if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
                const msg = e instanceof Error ? e.message : String(e);
                advertencias.push(`${id} tiene un tarea.md invalido y no se pudo leer (no participa en la deteccion ` +
                    `de duplicados de este import): ${msg}`);
                return;
            }
            throw e;
        }
    }));
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
        const task = buildNewTask(id, {
            titulo: entry.titulo,
            tipo: opts.tipo,
            sprint: opts.sprint,
            etiquetas: [],
            complejidad: opts.complejidad,
            modeloSugerido: opts.modeloSugerido,
            agenteRevisor: opts.agenteRevisor,
        }, today);
        let filePath;
        try {
            filePath = await writeTareaFile(tareasRoot, task, body, { failIfExists: true });
        }
        catch (e) {
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
                    motivo: `no se pudo crear como ${id}: ${e.message} Puede haberse creado por otra ejecucion ` +
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
    // Auto-commit (TASK-030, item C2). Aqui esta la razon original del
    // item: sin commitear, "import" no se podia ejecutar dos veces
    // seguidas — las carpetas que creaba la primera vez dejaban el
    // workspace sucio y el guard de la §8.3 abortaba la segunda
    // (HALLAZGOS.md). Se commitean solo las carpetas creadas en ESTA
    // pasada; si no se creo ninguna (todo omitido o con error), no hay
    // nada que commitear y no se crea un commit vacio.
    const autoCommitResult = autoCommit({
        cwd: deps.repoCwd,
        rutas: creadas.map((c) => path.dirname(c.filePath)),
        mensaje: mensajeChore('taskctl', `import de ${creadas.length} tarea(s): ${creadas.map((c) => c.id).join(', ')}`),
        push,
    });
    return {
        baseBranchGuard,
        autoCommit: autoCommitResult,
        creadas,
        omitidas,
        errores,
        advertencias,
    };
}
