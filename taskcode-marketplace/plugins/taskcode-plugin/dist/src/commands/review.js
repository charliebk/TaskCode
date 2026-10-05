/**
 * taskctl review — TASK-013 de PLAN_SPRINTS.md. Cierra la fase de
 * ejecucion y abre la de revision: trae los cambios de la rama base
 * con el script Git-Flow del tipo, verifica con evidencia Git que el
 * merge ocurrio (no lo supone), mueve la tarea a 03-en-revision/ y
 * deja en revision/ la peticion para el agente revisor generico (con
 * el diff real embebido) mas el scaffold de su informe.
 *
 * El CLI hace SOLO lo determinista: no invoca ningun LLM (decision
 * con Carlos, 2026-09-05 — mismo patron que el plan minimo de
 * TASK-010, donde el contenido lo redacta el agente que orquesta
 * Claude Code). La fragmentacion de revisores por dominio es TASK-018
 * y la puerta determinista build/lint/tests de la seccion 16
 * (correccion 5) queda para TASK-018/019.
 *
 * `ultimo_commit_revisado` NO se actualiza aqui a proposito: segun la
 * seccion 16.3 se actualiza cuando una revision TERMINA (informe
 * aprobado), no cuando se genera la peticion.
 *
 * TASK-040: con la tarea ya en `en-revision` y la ultima ronda en
 * `cambios-solicitados`, `review` genera la ronda N+1 en modo
 * INCREMENTAL: el diff va desde el commit revisado en la ronda N (la
 * linea `- Commit revisado (HEAD):` de su peticion, que solo escribe el
 * CLI) y la peticion lista los hallazgos de la ronda N que siguen
 * abiertos. No se ejecuta el update de Git-Flow: el merge de la base
 * entraria en el delta como si fuera una correccion; la base la integra
 * `finish` al cerrar.
 */
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { STATE_FOLDER } from '../core/task.js';
import { resolverConfig } from '../core/config.js';
import { registrarTransicion } from '../core/transiciones.js';
import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
import { INFORME_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
import { commitRevisadoDe, hallazgosNoCerrados, veredictoDeRonda, } from '../core/informe-revision.js';
import { fenceFor } from '../core/markdown.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { isWorkspaceClean, currentBranch, resolveBaseBranchForTipo, gitflowBaseArgs, isAncestor, headCommit, logOneline, diffParaRevision, diffRangeForPaths, } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';
import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
export class ReviewCommandError extends Error {
}
/** Flags de `taskctl review`: solo extraerPushFlag. */
export const FLAGS_REVIEW = ['--push', '-p'];
const SCRIPT_BY_TYPE = {
    feature: 'update-feature.sh',
    fix: 'update-fix.sh',
    hotfix: 'update-hotfix.sh',
    release: 'update-release.sh',
};
export const REVISION_DIRNAME = 'revision';
/**
 * Nombre de fichero de una ronda de revision, CON o SIN sufijo de
 * dominio (TASK-018). El sufijo es el nombre de la skill revisora
 * (`java-spring-reviewer`, etc.) y solo aparece cuando la ronda se
 * fragmento por dominio — mismo precedente que
 * `peticion-brainstorm-<rol>-<ronda>.md` (TASK-016, plan.ts). Una ronda
 * SIN fragmentar (0 dominios detectados, o mas del umbral) sigue dejando
 * el nombre de siempre, sin sufijo: es lo que ya prueban 8 de los tests
 * de review.test.ts y lo que finish.ts ya sabia leer antes de esta
 * tarea.
 */
const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
/**
 * fenceFor se mudo a core/markdown.ts en TASK-016, cuando "plan"
 * empezo a embeber tambien texto de la persona en sus peticiones. Se
 * re-exporta desde aqui para no romper a quien la importe de este
 * modulo, que es donde nacio.
 */
export { fenceFor } from '../core/markdown.js';
/**
 * `skillRevisora` y `nombreInforme` (TASK-018) los decide el
 * clasificador por dominio en runReviewCommand, NO `task.agente_revisor`
 * del frontmatter. Desde TASK-047 la peticion separa la skill que el
 * revisor carga (la del dominio) del agente que se lanza y su modelo
 * (`task.agente_revisor` y `task.modelo_sugerido`). `alcanceDiff` es el titulo de la seccion del
 * diff embebido: "Diff completo" cuando la ronda no se fragmento,
 * "Diff de tu dominio" (con el recuento de ficheros) cuando si.
 */
export function peticionTemplate(task, baseBranch, commitRevisado, ronda, fecha, commits, diff, skillRevisora, nombreInforme, alcanceDiff, extras = {}) {
    // TASK-040: en una ronda incremental el rango empieza en el commit
    // revisado en la ronda anterior, no en la rama base.
    const desde = extras.desde ?? baseBranch;
    const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
    // MENOR-1 de la revision de TASK-034: si TODO quedo excluido, decir
    // "sin diferencias" seria falso.
    const diffBlock = diff !== ''
        ? diff
        : (extras.excluidos ?? []).length > 0
            ? '(todo el diff quedo excluido: ver "Excluido del diff" mas abajo)'
            : '(sin diferencias respecto a la base)';
    const fence = fenceFor(commitsBlock, diffBlock);
    return (`# Peticion de revision — ${task.id} (ronda ${ronda})\n\n` +
        `- Tarea: ${task.id} — ${task.titulo}\n` +
        `- Rama revisada: ${task.rama}\n` +
        `- Rama base: ${baseBranch}\n` +
        `- Commit revisado (HEAD): ${commitRevisado}\n` +
        `- Fecha: ${fecha}\n` +
        `- Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})\n` +
        `- Skill revisora a cargar: ${skillRevisora}\n` +
        (extras.carpetaTarea === undefined
            ? ''
            : `- Carpeta de la tarea: ${extras.carpetaTarea} (criterios de aceptacion y plan)\n`) +
        (extras.desde === undefined
            ? ''
            : `- Revision incremental: solo los cambios desde ${extras.desde} (el commit revisado en la ronda anterior)\n`) +
        '\n' +
        '## Instrucciones para el agente revisor\n\n' +
        'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
        'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
        'directorio temporal, corre la suite tu mismo y construye el caso que\n' +
        'rompe el codigo antes de reportarlo. Clasifica cada hallazgo como\n' +
        'CRITICO (perdida de datos, corrupcion de estado, el comando hace lo\n' +
        'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
        'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
        'explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el\n' +
        `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
        'peticion.\n\n' +
        (extras.seccionPrevia ?? '') +
        `## Commits a revisar (git log ${desde}..HEAD)\n\n` +
        `${fence}\n` +
        `${commitsBlock}\n` +
        `${fence}\n\n` +
        `## ${alcanceDiff}\n\n` +
        `${fence}diff\n` +
        `${diffBlock}\n` +
        `${fence}\n` +
        seccionExcluidos(desde, extras));
}
/** Peticiones de revision, con o sin sufijo de dominio (TASK-018). */
export const PETICION_REVISION_RE = /^peticion-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;
async function leerRondaPrevia(revisionDir) {
    const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
    const textos = await Promise.all(informes.nombres.map(async (n) => ({ nombre: n, texto: await readFile(path.join(revisionDir, n), 'utf8') })));
    const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
    let commit = null;
    for (const n of peticiones.nombres) {
        commit = commitRevisadoDe(await readFile(path.join(revisionDir, n), 'utf8'));
        if (commit !== null)
            break;
    }
    const filas = [];
    const sinTabla = [];
    for (const { nombre, texto } of textos) {
        const lectura = hallazgosNoCerrados(texto);
        if (!lectura.tabla) {
            sinTabla.push(nombre);
            continue;
        }
        for (const h of lectura.abiertos) {
            filas.push(`| ${h.id} | ${h.severidad} | ${h.estado} | ${h.fichero} | ${nombre} |`);
        }
    }
    let seccion = `## Hallazgos de la ronda ${informes.ronda} que siguen abiertos\n\n` +
        'Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la\n' +
        'correccion no abre otro fallo: es justo donde se cuelan.\n\n';
    if (filas.length > 0) {
        seccion += '| ID | Severidad | Estado | Fichero | Informe |\n|---|---|---|---|---|\n' + filas.join('\n') + '\n';
    }
    else if (sinTabla.length === 0) {
        seccion += '0 hallazgos abiertos en la tabla de la ronda anterior.\n';
    }
    if (sinTabla.length > 0) {
        // Una tabla ausente NO es "0 abiertos": los informes anteriores a la
        // tabla, o escritos a mano, hay que leerlos enteros.
        seccion +=
            `\nTabla de hallazgos ausente o ilegible en: ${sinTabla.join(', ')}. ` +
                'Lee esos informes enteros.\n';
    }
    return { ronda: informes.ronda, veredicto: veredictoDeRonda(textos.map((t) => t.texto)), commit, seccion: seccion + '\n' };
}
/**
 * Lo excluido del diff no desaparece: se dice que es, cuanto pesa y con
 * que orden se pide (TASK-034). Sin excluidos, no hay seccion.
 */
function seccionExcluidos(baseBranch, extras) {
    const excluidos = extras.excluidos ?? [];
    if (excluidos.length === 0)
        return '';
    // Comillas dobles: agrupan en bash y tambien en cmd.exe, donde las
    // simples no (MENOR-4 de la revision de TASK-034).
    const patrones = (extras.patrones ?? []).map((p) => `":(glob)${p}"`).join(' ');
    // Sin trim() al principio: se comeria la sangria de la primera linea
    // del --stat (MENOR-3).
    const stat = (extras.stat ?? '').replace(/\s+$/, '');
    const fence = fenceFor(stat);
    return (`\n## Excluido del diff (${excluidos.length} fichero(s))\n\n` +
        'Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de\n' +
        'tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo\n' +
        'necesitas, pidelo con:\n\n' +
        `${fence}\n` +
        `git diff ${baseBranch}..HEAD -- ${patrones}\n` +
        `${fence}\n\n` +
        `${fence}\n` +
        `${stat}\n` +
        `${fence}\n`);
}
export function informeTemplate(task, commitRevisado, ronda) {
    return (`# Informe de revision — ${task.id} (ronda ${ronda})\n\n` +
        `- Commit revisado: ${commitRevisado}\n` +
        '- Revisor: (rellenar por el agente)\n' +
        // taskctl finish exige que TODAS las lineas "- Veredicto:" del
        // informe aprueben: hay que SUSTITUIR esta linea, no anadir otra.
        // TASK-036: el veredicto lo escribe `taskctl veredicto`, que deja la
        // linea canonica y la commitea; escribirla a mano en otro vocabulario
        // obligaba a commits de normalizacion.
        '- Veredicto: PENDIENTE (escribelo con: taskctl veredicto ' +
        `${task.id} aprobada | aprobada-con-correcciones | cambios-solicitados)\n\n` +
        '## Hallazgos\n\n' +
        // La tabla es para que una maquina la lea (la ronda incremental,
        // TASK-040); la reproduccion de cada hallazgo va debajo, en prosa.
        '| ID | Severidad | Estado | Fichero |\n' +
        '|---|---|---|---|\n' +
        '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) |\n\n' +
        'Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.\n');
}
/** isAncestor sin lanzar: un SHA que ya no existe (gc) no es antepasado. */
function esAntepasado(sha, cwd) {
    try {
        return isAncestor(sha, 'HEAD', cwd);
    }
    catch {
        return false;
    }
}
export async function runReviewCommand(tareasRoot, argv, today, deps) {
    // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
    rechazarFlagsDesconocidos(argv, FLAGS_REVIEW, 'review', (m) => new ReviewCommandError(m));
    const { push, resto } = extraerPushFlag(argv);
    const id = resto[0];
    if (id === undefined || id.trim() === '') {
        throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
    }
    // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): sirve
    // para rechazo rapido sin tocar Git y para extraer tipo/rama —
    // metadata estable que ningun comando reescribe. La lectura que
    // decide la escritura va DESPUES del script, que cambia de rama.
    const initial = await readTareaFile(tareasRoot, id);
    // TASK-040: con la tarea en en-revision, la guarda decide con el
    // veredicto de la ultima ronda, leido de revision/.
    const incremental = initial !== null && initial.task.estado === 'en-revision';
    let previa = null;
    const ctx = {};
    if (incremental) {
        previa = await leerRondaPrevia(path.join(path.dirname(initial.filePath), REVISION_DIRNAME));
        ctx.veredictoRondaAnterior = previa.veredicto;
    }
    assertTransitionAllowed('review', initial ? initial.task : null, ctx);
    const tipo = initial.task.tipo;
    const rama = initial.task.rama;
    // Mismo motivo que en start: el prompt interactivo de Git-Flow con
    // stdin no interactivo cancela en silencio (EOF => "No" => exit 0).
    if (!isWorkspaceClean(deps.repoCwd)) {
        throw new ReviewCommandError(`[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
            'Haz commit o stash antes de "taskctl review" — el update de Git-Flow necesita el ' +
            'workspace limpio y su prompt interactivo cancela en silencio sin terminal.');
    }
    const scriptName = SCRIPT_BY_TYPE[tipo];
    // TASK-040: la ronda incremental no ejecuta el update (el merge de la
    // base entraria en el delta); exige estar ya en la rama de la tarea.
    const { code, signal } = incremental
        ? { code: 0, signal: null }
        : runGitflowScript(scriptName, [rama, ...gitflowBaseArgs(tipo, deps.repoCwd)], {
            scriptsDir: deps.scriptsDir,
            cwd: deps.repoCwd,
        });
    if (code !== 0) {
        const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
        throw new ReviewCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
            'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo y haz commit ' +
            'antes de reintentar); la tarea no se ha movido de carpeta.');
    }
    // Evidencia, no suposicion (TASK-007/009): rama activa correcta y
    // merge de la base ocurrido de verdad (la base es antepasada de
    // HEAD), no solo un exit 0 del script.
    const branchNow = currentBranch(deps.repoCwd);
    if (incremental && branchNow !== rama) {
        throw new ReviewCommandError(`[ERROR] ${id}: la ronda incremental se genera desde la rama de la tarea, "${rama}", ` +
            `y la activa es "${branchNow}". Cambia a "${rama}" (git checkout ${rama}) y reintenta.`);
    }
    if (branchNow !== rama) {
        throw new ReviewCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
            `"${branchNow}", no "${rama}". No se actualiza la tarea; revisa el repo a mano.`);
    }
    const baseBranch = resolveBaseBranchForTipo(tipo, deps.repoCwd);
    if (!incremental && !isAncestor(baseBranch, 'HEAD', deps.repoCwd)) {
        throw new ReviewCommandError(`[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${baseBranch}" NO esta ` +
            `integrada en "${rama}" (merge-base --is-ancestor lo niega). No se actualiza la ` +
            'tarea; revisa el repo a mano.');
    }
    // Lectura FRESCA, ya con la rama de la tarea activa: la unica que
    // decide si se muta algo y con que contenido (regla de la doble
    // lectura — el update pudo traer de la base un tarea.md mas nuevo).
    const existing = await readTareaFile(tareasRoot, id);
    assertTransitionAllowed('review', existing ? existing.task : null, ctx);
    const { task, body, filePath } = existing;
    const commitRevisado = headCommit(deps.repoCwd);
    // TASK-040: inicio del rango. En la ronda incremental, el commit
    // revisado en la ronda N si sigue siendo antepasado de HEAD; si no (un
    // rebase, un amend, un gc) o no consta, el diff completo con un aviso.
    const avisos = [];
    let desde = baseBranch;
    if (incremental && previa !== null) {
        const valido = previa.commit !== null && esAntepasado(previa.commit, deps.repoCwd);
        if (valido) {
            desde = previa.commit;
        }
        else {
            avisos.push(`${id}: ${previa.commit === null ? 'ninguna peticion de la ronda ' + String(previa.ronda) + ' dice que commit se reviso' : `el commit revisado en la ronda ${previa.ronda} (${previa.commit}) ya no es antepasado de HEAD (¿rebase o amend?)`}. ` +
                `La ronda ${String(previa.ronda + 1)} lleva el diff completo desde "${baseBranch}".`);
        }
    }
    const commits = logOneline(desde, 'HEAD', deps.repoCwd);
    // TASK-034: lo generado (dist/, lockfiles) y la propia carpeta de
    // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
    const excluir = resolverConfig(deps.repoCwd).excluir_de_revision;
    const paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
    const diff = paraRevision.diff;
    // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
    // el diff real de la rama, no `task.agente_revisor` del frontmatter,
    // decide quien revisa. El catalogo se relee de skills/*/SKILL.md en
    // CADA ejecucion (sin cache: HALLAZGOS.md documenta que una copia
    // congelada de patrones_archivo ya diverguio dos veces).
    // Solo los INCLUIDOS se clasifican: un dist/*.js no debe activar un
    // dominio ni fragmentar la revision por ficheros que nadie va a leer
    // (correccion del rol de arquitectura, TASK-034).
    const ficherosTocados = paraRevision.incluidos;
    const catalogoRevisores = cargarCatalogoRevisores();
    const plan = clasificarPorDominio(ficherosTocados, catalogoRevisores);
    const updated = { ...task, estado: 'en-revision', actualizado: today };
    // Peticion + scaffold de informe ANTES de mover la tarea (hallazgo
    // IMPORTANTE de revision por pares, TASK-013): si una escritura
    // falla (EEXIST por colision case-insensitive en NTFS, permisos,
    // disco), la tarea sigue en-curso y reintentar es posible — el orden
    // inverso dejaba estado en-revision sin peticion ni salida, un
    // callejon de la maquina de estados. Se escriben en la carpeta
    // ACTUAL: el rename de moveTareaFile se lleva revision/ entera.
    // Flag 'wx' en ambos: la numeracion garantiza un hueco libre, y si
    // aun asi el fichero existiera, fallar ruidosamente es mejor que
    // pisar una revision anterior — mismo principio que plan-final.md.
    const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
    await mkdir(revisionDir, { recursive: true });
    const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);
    // Un par de nombres (con o sin sufijo de dominio) por grupo del plan.
    // Sin fragmentar hay un unico grupo y se usa el nombre de siempre, sin
    // sufijo: ninguna tarea que solo cae al generico cambia de convencion.
    const escrituras = plan.grupos.map((grupo) => {
        const sufijo = plan.fragmentado ? `-${grupo.revisor}` : '';
        return {
            revisor: grupo.revisor,
            ficheros: grupo.ficheros,
            nombrePeticion: `peticion-revision-${ronda}${sufijo}.md`,
            nombreInforme: `informe-revision-${ronda}${sufijo}.md`,
        };
    });
    // TASK-040 (riesgo 1 del brainstorm): si una escritura falla a mitad,
    // se borran las de esta invocacion. Sin esto, una ronda N+1 a medias
    // dejaba la tarea sin salida: finish bloquea por el PENDIENTE y review
    // rechaza otra ronda por lo mismo. Son ficheros nuevos ('wx'): no se
    // borra nada que no se acabe de crear.
    const escritos = [];
    const escribir = async (ruta, contenido) => {
        await writeFile(ruta, contenido, { encoding: 'utf8', flag: 'wx' });
        escritos.push(ruta);
    };
    try {
        for (const escritura of escrituras) {
            // Cada revisor recibe SOLO el subconjunto de su dominio (criterio
            // de aceptacion 3): un `git diff` filtrado por pathspec, no el
            // diff entero. Sin fragmentar, el unico grupo ya es "todos los
            // ficheros" y se reusa el diff completo ya calculado arriba, para
            // no repetir la misma llamada a Git dos veces.
            const diffDelGrupo = plan.fragmentado
                ? diffRangeForPaths(desde, 'HEAD', escritura.ficheros, deps.repoCwd)
                : diff;
            const alcanceDiff = plan.fragmentado
                ? `Diff de tu dominio (${escritura.ficheros.length} fichero(s) de ` +
                    `${ficherosTocados.length}; git diff ${desde}..HEAD -- <tus ficheros>)`
                : desde === baseBranch
                    ? `Diff completo (git diff ${baseBranch}..HEAD)`
                    : `Diff desde la ronda anterior (git diff ${desde}..HEAD)`;
            await escribir(path.join(revisionDir, escritura.nombrePeticion), peticionTemplate(updated, baseBranch, commitRevisado, ronda, today, commits, diffDelGrupo, escritura.revisor, escritura.nombreInforme, alcanceDiff, {
                // La peticion se escribe ANTES de mover la tarea: la carpeta
                // sale del estado destino, no de filePath.
                carpetaTarea: `tareas/${STATE_FOLDER[updated.estado]}/${updated.id}`,
                excluidos: paraRevision.excluidos,
                stat: paraRevision.stat,
                patrones: excluir,
                ...(incremental && desde !== baseBranch ? { desde } : {}),
                ...(previa !== null ? { seccionPrevia: previa.seccion } : {}),
            }));
            await escribir(path.join(revisionDir, escritura.nombreInforme), informeTemplate(updated, commitRevisado, ronda));
        }
    }
    catch (e) {
        await Promise.all(escritos.map((r) => unlink(r).catch(() => undefined)));
        if (!isEexist(e))
            throw e;
        throw new ReviewCommandError(`[ERROR] ${id}: ya existe un fichero de la ronda ${ronda} en ${revisionDir} ` +
            '(¿restos con otro case en un filesystem case-insensitive?). La tarea NO se ha ' +
            'movido; limpia o renombra esos ficheros y reintenta.');
    }
    const conRegistro = registrarTransicion(body, 'review', today, resolverConfig(deps.repoCwd).modo_flujo);
    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
    const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
    const informes = escrituras.map((escritura) => ({
        revisor: escritura.revisor,
        ficheros: escritura.ficheros,
        peticionPath: path.join(newRevisionDir, escritura.nombrePeticion),
        informePath: path.join(newRevisionDir, escritura.nombreInforme),
    }));
    // Paso 5 de la 8.3 (TASK-030, item C2). "review" NO aplica
    // ensureBaseBranchReady, asi que en el arbol puede haber trabajo de
    // la persona junto al de taskctl: solo entran las dos carpetas de la
    // tarea (la de origen para que el movimiento se registre como tal, y
    // la de destino, que ya contiene revision/ con la peticion y el
    // scaffold del informe).
    const commitResult = autoCommit({
        cwd: deps.repoCwd,
        rutas: [path.dirname(filePath), path.dirname(newFilePath)],
        mensaje: mensajeChore(task.id, `peticion de revision ronda ${ronda}`),
        push,
    });
    return {
        autoCommit: commitResult,
        incremental,
        desde,
        avisos,
        id: task.id,
        rama,
        baseBranch,
        commitRevisado,
        ronda,
        filePath: newFilePath,
        agente: updated.agente_revisor,
        modelo: updated.modelo_sugerido,
        informes,
    };
}
