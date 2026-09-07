/**
 * taskctl finish — TASK-014 de PLAN_SPRINTS.md. Cierra el ciclo de
 * vida de una tarea: exige revision aprobada (fuente determinista: la
 * linea "Veredicto:" del ultimo informe de revision), mergea la rama
 * con el script Git-Flow del tipo (tag + backmerge para
 * hotfix/release), verifica con evidencia Git que los merges
 * ocurrieron, detecta la colision de IDs entre main y develop ANTES de
 * mergear (riesgo documentado en TASK-012), mueve la carpeta a
 * 04-terminadas/ y renderiza CHANGELOG.md, docs/INDEX.md y
 * docs/BOARD.md desde el frontmatter — plantillas deterministas, cero
 * LLM (correccion de la seccion 16 de la metodologia).
 *
 * Desde TASK-030 (item C2) tambien cumple el paso 5 de la seccion 8.3:
 * commitea lo que acaba de escribir — la carpeta de la tarea y los tres
 * artefactos de cierre, y nada mas — sobre develop, que es donde
 * termina el comando. Con --push sube ademas la rama.
 *
 */
import path from 'node:path';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseTareaFile } from '../core/tarea-file.js';
import { FrontmatterParseError } from '../core/frontmatter.js';
import { TaskValidationError } from '../core/task.js';
import { readTareaFile, moveTareaFile, isEnoent } from '../fs/task-store.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { isWorkspaceClean, currentBranch, isAncestor, resolveMainBranch, lsTreeNames, showFileAtRef, mergeBase, checkoutBranch, } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';
import { runBoardCommand, boardFilePath } from './board.js';
import { renderBoardMarkdown } from '../core/board-format.js';
import { REVISION_DIRNAME } from './review.js';
export class FinishCommandError extends Error {
}
const SCRIPT_BY_TYPE = {
    feature: 'merge-feature-to-develop.sh',
    fix: 'merge-fix-to-develop.sh',
    hotfix: 'merge-hotfix-to-main.sh',
    release: 'merge-release-to-main.sh',
};
/** hotfix/release mergean a main (con tag) y backmergean a develop. */
const MERGEA_A_MAIN = {
    feature: false,
    fix: false,
    hotfix: true,
    release: true,
};
const DEVELOP_BRANCH = 'develop';
const INFORME_REVISION_RE = /^informe-revision-(\d+)\.md$/;
const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;
/**
 * true solo si TODAS las lineas "- Veredicto:" del informe aprueban.
 * Fail-closed de verdad (hallazgo CRITICO de revision por pares,
 * TASK-014: la version anterior buscaba la palabra "aprobada" en
 * cualquier parte y aprobaba literalmente "no aprobada"):
 * - el VALOR del veredicto debe EMPEZAR por "aprobada" — una negacion
 *   delante ("no aprobada", "rechazada: aprobada seria...") no pasa;
 * - "pendiente" (con limites de palabra: "independiente" no cuenta) o
 *   "cambios-solicitados" en el valor lo tumban;
 * - si hay varias lineas Veredicto (p. ej. el placeholder de la
 *   plantilla sin borrar), TODAS deben aprobar;
 * - sin linea de veredicto (o sin informe), NO esta aprobada.
 */
export function veredictoAprobado(informe) {
    const prefijo = '- veredicto:';
    const lineas = informe
        .split('\n')
        .filter((l) => l.trim().toLowerCase().startsWith(prefijo));
    if (lineas.length === 0)
        return false;
    return lineas.every((linea) => {
        const valor = linea.trim().slice(prefijo.length).trim().toLowerCase();
        if (/\bpendiente\b/.test(valor) || valor.includes('cambios-solicitados'))
            return false;
        return /^aprobada\b/.test(valor);
    });
}
/** Contenido del informe con mayor N segun `re`, o null si no hay. */
async function ultimoInforme(revisionDir, re) {
    let entries;
    try {
        entries = await readdir(revisionDir);
    }
    catch (e) {
        if (isEnoent(e))
            return null;
        throw e;
    }
    let max = 0;
    let elegido = null;
    for (const entry of entries) {
        const m = re.exec(entry);
        if (m !== null && Number(m[1]) > max) {
            max = Number(m[1]);
            elegido = entry;
        }
    }
    if (elegido === null)
        return null;
    return readFile(path.join(revisionDir, elegido), 'utf8');
}
/**
 * Contexto de aprobacion para la maquina de estados, derivado de los
 * informes de revision/ de la carpeta de la tarea. La convencion del
 * informe de Codex (informe-codex-<n>.md) la producira TASK-020; leerla
 * ya aqui deja a finish preparado sin acoplarse a ese comando.
 */
async function buildTransitionContext(taskDir) {
    const revisionDir = path.join(taskDir, REVISION_DIRNAME);
    const informe = await ultimoInforme(revisionDir, INFORME_REVISION_RE);
    const informeCodex = await ultimoInforme(revisionDir, INFORME_CODEX_RE);
    return {
        revisionPrimariaAprobada: informe !== null && veredictoAprobado(informe),
        revisionCodexAprobada: informeCodex !== null && veredictoAprobado(informeCodex),
    };
}
/**
 * Colision de IDs (riesgo documentado en TASK-012): el mismo TASK-NNN
 * puede existir en `ref` con dos formas de romper el merge:
 *
 * - OTRA tarea (titulo distinto) numerada igual en un linaje que no
 *   comparte tareas/ (un hotfix numerado sobre main mientras develop ya
 *   usaba ese ID): mergear mezclaria dos tareas bajo un numero.
 * - La MISMA tarea (mismo titulo) pero anadida en `ref` por un commit
 *   que NO es ancestro comun con la rama (hallazgo IMPORTANTE de
 *   revision por pares, TASK-014): sin historia compartida el merge es
 *   add+add, no un rename — las dos carpetas sobreviven y develop queda
 *   con el ID duplicado en dos carpetas de estado a la vez.
 *
 * El caso normal (feature/fix cuya carpeta vive en `ref` en una carpeta
 * de estado anterior) no dispara nada: ahi la copia de `ref` SI esta en
 * el ancestro comun y Git resuelve el movimiento como rename.
 */
function detectarColisionId(id, titulo, rama, ref, cwd) {
    const names = lsTreeNames(ref, 'tareas', cwd);
    const match = names.find((n) => n.endsWith(`/${id}/tarea.md`));
    if (match === undefined)
        return null;
    let tituloEnRef;
    try {
        tituloEnRef = parseTareaFile(showFileAtRef(ref, match, cwd)).task.titulo;
    }
    catch (e) {
        if (e instanceof FrontmatterParseError || e instanceof TaskValidationError) {
            // Fail-closed: si el tarea.md de la otra rama ni se puede
            // parsear, no se puede descartar la colision.
            return { path: match, motivo: 'ilegible' };
        }
        throw e;
    }
    if (tituloEnRef !== titulo) {
        return { path: match, motivo: 'titulo-distinto' };
    }
    const base = mergeBase(rama, ref, cwd);
    const enBase = lsTreeNames(base, 'tareas', cwd).some((n) => n.endsWith(`/${id}/tarea.md`));
    if (!enBase) {
        return { path: match, motivo: 'linaje-divergente' };
    }
    return null;
}
function insertAfterHeader(content, header, entry) {
    const idx = content.indexOf(header);
    if (idx === -1) {
        // Fichero preexistente sin la seccion: se inserta ARRIBA (tras la
        // primera linea, normalmente el titulo), no al final — lo mas nuevo
        // encabeza el documento (hallazgo MENOR de revision por pares,
        // TASK-014: antes quedaba "Sin publicar" debajo de versiones viejas).
        const nl = content.indexOf('\n');
        if (nl === -1) {
            return `${content}\n\n${header}\n\n${entry}\n`;
        }
        return `${content.slice(0, nl + 1)}\n${header}\n\n${entry}\n${content.slice(nl + 1)}`;
    }
    let pos = content.indexOf('\n', idx + header.length);
    if (pos === -1)
        return `${content}\n\n${entry}\n`;
    pos += 1;
    if (content[pos] === '\n')
        pos += 1;
    return `${content.slice(0, pos)}${entry}\n${content.slice(pos)}`;
}
export function changelogEntry(task, fecha) {
    return `- ${task.id} (${task.tipo}) — ${task.titulo} (${fecha})`;
}
export function indexEntry(task, fecha) {
    const etiquetas = task.etiquetas.length > 0 ? task.etiquetas.join(', ') : '(sin etiquetas)';
    return (`- ${task.id} — ${task.titulo} · etiquetas: ${etiquetas} · rama ${task.rama} · ` +
        `terminada ${fecha} · tareas/04-terminadas/${task.id}/`);
}
const CHANGELOG_HEADER = '## Sin publicar';
const CHANGELOG_INICIAL = '# Changelog\n\n' +
    'Registro de tareas terminadas. Lo actualiza taskctl finish; una linea\n' +
    'por tarea, renderizada desde su frontmatter.\n\n' +
    `${CHANGELOG_HEADER}\n\n`;
const INDEX_HEADER = '## Tareas terminadas';
const INDEX_INICIAL = '# Indice de tareas terminadas\n\n' +
    'Indice determinista para la recuperacion de contexto por etiquetas\n' +
    '(seccion 6.1 de la metodologia). Lo actualiza taskctl finish.\n\n' +
    `${INDEX_HEADER}\n\n`;
async function appendEntry(filePath, inicial, header, entry) {
    let content;
    try {
        content = await readFile(filePath, 'utf8');
    }
    catch (e) {
        if (!isEnoent(e))
            throw e;
        content = inicial;
    }
    await writeFile(filePath, insertAfterHeader(content, header, entry), 'utf8');
}
export async function runFinishCommand(tareasRoot, argv, today, deps) {
    const { push, resto } = extraerPushFlag(argv);
    const id = resto[0];
    if (id === undefined || id.trim() === '') {
        throw new FinishCommandError('[ERROR] Falta el ID de la tarea: taskctl finish TASK-NNN.');
    }
    // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): rechazo
    // rapido sin tocar Git + metadata estable (tipo/rama/titulo). La
    // lectura que decide la escritura va DESPUES de los merges.
    const initial = await readTareaFile(tareasRoot, id);
    // Mensaje propio para "no esta en este working tree" (hallazgo MENOR
    // de revision por pares, TASK-014): el generico de la maquina de
    // estados aconseja crear la tarea con import/new, que aqui es lo
    // contrario de lo util — lo normal es estar en develop y que la
    // tarea viva en su rama.
    if (initial === null) {
        throw new FinishCommandError(`[ERROR] ${id}: no se encuentra en el working tree de la rama actual. ` +
            'Si la tarea existe en su propia rama, cambiate a esa rama antes de "taskctl finish".');
    }
    const ctxInicial = await buildTransitionContext(path.dirname(initial.filePath));
    assertTransitionAllowed('finish', initial.task, ctxInicial);
    const tipo = initial.task.tipo;
    const rama = initial.task.rama;
    const titulo = initial.task.titulo;
    if (!isWorkspaceClean(deps.repoCwd)) {
        throw new FinishCommandError(`[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
            'Haz commit o stash antes de "taskctl finish" — los merges de Git-Flow necesitan el ' +
            'workspace limpio y su prompt interactivo cancela en silencio sin terminal.');
    }
    // Colision de IDs ANTES de mergear (criterio 4): se comprueba contra
    // cada rama destino del merge. Para feature/fix solo develop; para
    // hotfix/release tambien la principal.
    const mainBranch = MERGEA_A_MAIN[tipo] ? resolveMainBranch(deps.repoCwd) : null;
    const destinos = mainBranch === null ? [DEVELOP_BRANCH] : [mainBranch, DEVELOP_BRANCH];
    for (const destino of destinos) {
        const colision = detectarColisionId(id, titulo, rama, destino, deps.repoCwd);
        if (colision !== null) {
            const detalle = colision.motivo === 'titulo-distinto'
                ? `con OTRO titulo distinto de "${titulo}": mergear mezclaria dos tareas bajo el mismo numero. ` +
                    'Renumera una de las dos (carpeta, frontmatter y rama)'
                : colision.motivo === 'linaje-divergente'
                    ? 'anadido por un linaje SIN ancestro comun con la rama de la tarea: el merge seria ' +
                        'add+add (no un rename) y dejaria el ID duplicado en dos carpetas de estado a la vez. ' +
                        'Elimina o sincroniza a mano una de las dos copias'
                    : 'con un tarea.md que no se puede parsear, asi que la colision no se puede descartar. ' +
                        'Arregla ese fichero';
            throw new FinishCommandError(`[ERROR] ${id}: colision de IDs — "${destino}" ya contiene ${colision.path} ${detalle} ` +
                'antes de reintentar; no se ha tocado nada.');
        }
    }
    const scriptName = SCRIPT_BY_TYPE[tipo];
    const integradaEnDevelop = isAncestor(rama, DEVELOP_BRANCH, deps.repoCwd);
    const integradaEnMain = mainBranch === null || isAncestor(rama, mainBranch, deps.repoCwd);
    if (integradaEnDevelop && integradaEnMain) {
        // Camino idempotente (hallazgo IMPORTANTE de revision por pares,
        // TASK-014): los merges ya estan consumados — p. ej. un reintento
        // tras resolver a mano un conflicto de backmerge. Reejecutar el
        // script moriria en el tag ya creado (hotfix/release); aqui solo
        // queda cerrar: ponerse en develop y mover/renderizar.
        if (currentBranch(deps.repoCwd) !== DEVELOP_BRANCH) {
            checkoutBranch(DEVELOP_BRANCH, deps.repoCwd);
        }
    }
    else if (mainBranch !== null && integradaEnMain && !integradaEnDevelop) {
        // Estado a medias: merge a main (y su tag) consumados, backmerge
        // pendiente. Reejecutar el script chocaria con el tag duplicado.
        throw new FinishCommandError(`[ERROR] ${id}: el merge a "${mainBranch}" (con su tag) ya esta consumado pero falta ` +
            `el backmerge a "${DEVELOP_BRANCH}". No se reejecuta ${scriptName} (moriria en el tag ` +
            `duplicado): completa el backmerge a mano — git checkout ${DEVELOP_BRANCH} && ` +
            `git merge --no-ff ${rama} — y reintenta taskctl finish.`);
    }
    else {
        const { code, signal } = runGitflowScript(scriptName, [rama], {
            scriptsDir: deps.scriptsDir,
            cwd: deps.repoCwd,
        });
        if (code !== 0) {
            const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
            throw new FinishCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
                'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo antes de ' +
                'reintentar); la tarea no se ha movido de carpeta.');
        }
        // Evidencia, no suposicion (TASK-007/009): los cuatro scripts
        // terminan en develop, con la rama de la tarea integrada; para
        // hotfix/release ademas integrada en la principal. Un backmerge
        // cancelado sale del script con exit 0 ("PARCIAL") — lo detecta la
        // ancestria, no el exit code.
        const branchNow = currentBranch(deps.repoCwd);
        if (branchNow !== DEVELOP_BRANCH) {
            throw new FinishCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
                `"${branchNow}", no "${DEVELOP_BRANCH}". No se actualiza la tarea; revisa el repo a mano.`);
        }
        if (!isAncestor(rama, 'HEAD', deps.repoCwd)) {
            throw new FinishCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
                `en "${DEVELOP_BRANCH}" (merge-base --is-ancestor lo niega). ¿Backmerge cancelado o ` +
                'merge a medias? No se actualiza la tarea; revisa el repo a mano.');
        }
        if (mainBranch !== null && !isAncestor(rama, mainBranch, deps.repoCwd)) {
            throw new FinishCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${rama}" NO esta integrada ` +
                `en "${mainBranch}" (merge-base --is-ancestor lo niega). No se actualiza la tarea; ` +
                'revisa el repo a mano.');
        }
    }
    // Lectura FRESCA, ya en develop con el merge consumado: la unica que
    // decide la escritura. El contexto de aprobacion se recalcula sobre
    // la carpeta que el merge dejo en develop.
    const existing = await readTareaFile(tareasRoot, id);
    const ctx = existing === null ? {} : await buildTransitionContext(path.dirname(existing.filePath));
    assertTransitionAllowed('finish', existing ? existing.task : null, ctx);
    const { task, body, filePath } = existing;
    const updated = { ...task, estado: 'terminada', actualizado: today };
    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
    // Renderizado de cierre (criterio 3): plantillas desde el
    // frontmatter. BOARD.md se regenera entero reutilizando el mismo
    // render de "taskctl board" — la direccion que la tabla de la
    // seccion 8 da por hecha; B5 decidira si el comando board tambien
    // lo escribe.
    const changelogPath = path.join(deps.repoCwd, 'CHANGELOG.md');
    const docsDir = path.join(deps.repoCwd, 'docs');
    await mkdir(docsDir, { recursive: true });
    const indexPath = path.join(docsDir, 'INDEX.md');
    // Misma ruta que usa "taskctl board --escribir" (item B5).
    const boardPath = boardFilePath(deps.repoCwd);
    await appendEntry(changelogPath, CHANGELOG_INICIAL, CHANGELOG_HEADER, changelogEntry(updated, today));
    await appendEntry(indexPath, INDEX_INICIAL, INDEX_HEADER, indexEntry(updated, today));
    const board = await runBoardCommand(tareasRoot, []);
    await writeFile(boardPath, renderBoardMarkdown(board.output, board.advertencias, today, 'taskctl finish'), 'utf8');
    // Paso 5 de la 8.3 (TASK-030, item C2). "finish" commitea sobre
    // DEVELOP, no sobre la rama de la tarea: cuando llega aqui el merge
    // ya esta consumado y el comando termina siempre en develop (se
    // comprueba mas arriba). Es lo que se venia haciendo a mano; queda
    // fijado con un test para que nadie lo "arregle" mas adelante.
    // Ademas de las dos carpetas de la tarea entran los tres artefactos
    // de cierre — y NADA mas: "finish" tampoco aplica
    // ensureBaseBranchReady, asi que el resto del arbol puede tener
    // trabajo de la persona.
    const commitResult = autoCommit({
        cwd: deps.repoCwd,
        rutas: [
            path.dirname(filePath),
            path.dirname(newFilePath),
            changelogPath,
            indexPath,
            boardPath,
        ],
        mensaje: mensajeChore(task.id, 'tarea terminada y artefactos de cierre'),
        push,
    });
    return {
        id: task.id,
        rama,
        baseBranch: DEVELOP_BRANCH,
        mainBranch,
        filePath: newFilePath,
        changelogPath,
        indexPath,
        boardPath,
        autoCommit: commitResult,
    };
}
