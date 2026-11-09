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
import { raizDelRepo, resolverConfig } from '../core/config.js';
import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertura.js';
import { formatearVerificacionRoja, seccionVerificacionRevision } from '../core/informe-verificacion.js';
import { verificarConMemo } from '../fs/verificacion.js';
import { registrarTransicion } from '../core/transiciones.js';
import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda, siguienteRonda } from '../fs/rondas.js';
import { alcanceRondaSiguiente, commitRevisadoDe, ficheroNombrado, hallazgosNoCerrados, veredictoDeRonda, } from '../core/informe-revision.js';
import { fenceFor } from '../core/markdown.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { isWorkspaceClean, currentBranch, resolveBaseBranchForTipo, gitflowBaseArgs, isAncestor, headCommit, logOneline, diffParaRevision, diffRangeForPaths, hayMergesEntre, } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';
import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
import { excluirDeRevision } from '../fs/revisores-rango.js';
import { avisoAutorrevision } from '../core/autorrevision.js';
import { contextoPermitido } from '../core/contexto-revision.js';
import { modeloDeVerificacion } from '../core/modelo-revision.js';
export class ReviewCommandError extends Error {
}
/** Flags de `taskctl review`: los de extraerPushFlag y `--completa` (TASK-083). */
export const FLAGS_REVIEW = ['--push', '-p', '--completa'];
/** TASK-083: la cabecera que marca una peticion de verificacion acotada (la lee la ronda siguiente). */
const ALCANCE_ACOTADA = 'verificacion acotada al diff de las correcciones';
const ALCANCE_ACOTADA_RE = /^- Alcance: verificacion acotada\b/im;
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
        (extras.modeloRonda === undefined
            ? ''
            : `- Modelo sugerido para esta ronda: ${extras.modeloRonda} (verificacion de correcciones; la tarea usa ${task.modelo_sugerido})\n`) +
        `- Skill revisora a cargar: ${skillRevisora}\n` +
        (extras.carpetaTarea === undefined
            ? ''
            : `- Carpeta de la tarea: ${extras.carpetaTarea} (criterios de aceptacion y plan)\n`) +
        (extras.desde === undefined
            ? ''
            : `- Revision incremental: solo los cambios desde ${extras.desde} (el commit revisado en la ronda anterior)\n`) +
        (extras.alcance === undefined
            ? ''
            : `- Alcance: ${extras.alcance.acotada ? ALCANCE_ACOTADA : 'completa'} (motivo: ${extras.alcance.motivo})\n`) +
        '\n' +
        (extras.alcance?.acotada === true ? instruccionesAcotadas(nombreInforme) : instruccionesCompletas(nombreInforme)) +
        seccionContextoPermitido(extras.contextoPermitido) +
        (extras.seccionPrevia ?? '') +
        `## Commits a revisar (git log ${desde}..HEAD)\n\n` +
        `${fence}\n` +
        `${commitsBlock}\n` +
        `${fence}\n\n` +
        `## ${alcanceDiff}\n\n` +
        `${fence}diff\n` +
        `${diffBlock}\n` +
        `${fence}\n` +
        seccionExcluidos(desde, extras) +
        (extras.seccionCobertura ?? '') +
        (extras.seccionVerificacion ?? ''));
}
const CLASIFICACION = 'Clasifica cada hallazgo como\n' +
    'CRITICO (perdida de datos, corrupcion de estado, el comando hace lo\n' +
    'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
    'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
    'explicito tambien vale; inventar hallazgos, no.';
function instruccionesCompletas(nombreInforme) {
    return ('## Instrucciones para el agente revisor\n\n' +
        'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
        'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
        'directorio temporal, corre la suite tu mismo y construye el caso que\n' +
        `rompe el codigo antes de reportarlo. ${CLASIFICACION} Vuelca tu salida en el\n` +
        `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
        'peticion.\n\n');
}
/**
 * TASK-083: la ronda anterior solo dejo MENORES y el delta solo toca sus
 * ficheros. No basta con tachar la lista: la correccion de un MENOR puede meter
 * un IMPORTANTE nuevo (se vio en un proyecto real, y se encontro ejecutando),
 * asi que se siguen exigiendo los tests y la busqueda de fallos en el delta.
 */
function instruccionesAcotadas(nombreInforme) {
    return ('## Instrucciones para el agente revisor (verificacion acotada)\n\n' +
        'Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una\n' +
        'revision completa y la ronda anterior solo dejo hallazgos MENORES: esta ronda\n' +
        'verifica sus correcciones, no vuelve a revisar la rama entera. Haz esto, y\n' +
        'nada mas:\n\n' +
        '1. Comprueba, uno por uno, que cada hallazgo de la tabla de abajo queda resuelto\n' +
        '   por el diff de esta ronda, o que se justifica por que no.\n' +
        '2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit\n' +
        '   revisado y di el resultado: verificar sin ejecutar no vale.\n' +
        '3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo\n' +
        '   donde se cuelan los IMPORTANTES nuevos. Si encuentras uno, construye el caso\n' +
        '   que lo rompe antes de reportarlo.\n\n' +
        `${CLASIFICACION} Un CRITICO o IMPORTANTE nuevo obliga a que la ronda\n` +
        'siguiente sea completa (lo decide taskctl). Vuelca tu salida en el informe de\n' +
        `esta ronda (${nombreInforme}), sin borrar la peticion.\n\n`);
}
/** TASK-081: la lista orienta, no prohibe; lo de fuera se justifica en el informe. */
function seccionContextoPermitido(rutas) {
    if (rutas === undefined)
        return '';
    return ('## Contexto permitido\n\n' +
        'Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.\n' +
        'Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del\n' +
        'contexto permitido` de tu informe.\n\n' +
        rutas.map((r) => `- ${r}`).join('\n') +
        '\n\n');
}
/** Vive en core/informe-revision.ts desde TASK-083; se reexporta para quien la importe de aqui. */
export { modeloBaratoPermitido } from '../core/informe-revision.js';
async function leerRondaPrevia(revisionDir) {
    const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
    const textos = await Promise.all(informes.nombres.map(async (n) => ({ nombre: n, texto: await readFile(path.join(revisionDir, n), 'utf8') })));
    const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
    let commit = null;
    let fueAcotada = false;
    for (const n of peticiones.nombres) {
        const texto = await readFile(path.join(revisionDir, n), 'utf8');
        if (ALCANCE_ACOTADA_RE.test(texto))
            fueAcotada = true;
        commit ??= commitRevisadoDe(texto);
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
    return {
        ronda: informes.ronda,
        veredicto: veredictoDeRonda(textos.map((t) => t.texto)),
        commit,
        seccion: seccion + '\n',
        alcance: alcanceRondaSiguiente(textos.map((t) => t.texto)),
        fueAcotada,
    };
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
        // TASK-063: `Origen` por hallazgo, para medir cuantos fallos vienen del
        // plan o del enunciado y no del codigo (lo lee `leerHallazgos`).
        '| ID | Severidad | Estado | Fichero | Origen |\n' +
        '|---|---|---|---|---|\n' +
        '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) | ' +
        '(implementacion / plan / especificacion) |\n\n' +
        'Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el\n' +
        'plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el\n' +
        'enunciado o en los criterios de aceptacion de la tarea.\n\n' +
        'Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.\n\n' +
        // TASK-081: lo leido fuera de la lista de la peticion, con su motivo.
        '## Lecturas fuera del contexto permitido\n\n' +
        'ninguna\n');
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
    const { push, resto: sinPush } = extraerPushFlag(argv);
    const completaPedida = sinPush.includes('--completa');
    const resto = sinPush.filter((a) => a !== '--completa');
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
    // TASK-082: aviso (sin bloquear) si falta la constancia de la
    // autorrevision. Sobre la lectura fresca y antes de cualquier escritura;
    // avisoAutorrevision es pura y nunca lanza.
    const sinAutorrevision = avisoAutorrevision(body, id);
    if (sinAutorrevision !== null)
        avisos.push(sinAutorrevision);
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
    // TASK-034: lo generado (dist/, lockfiles) y la propia carpeta de
    // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
    // TASK-073: los tests held-out nunca se embeben, se configure lo que se configure.
    const configRama = resolverConfig(deps.repoCwd);
    const excluir = excluirDeRevision(configRama.excluir_de_revision);
    let paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
    // TASK-083: alcance de la ronda. Acotada solo si los informes de la ronda
    // anterior lo permiten (alcanceRondaSiguiente, fail-closed) Y ademas: no se
    // pidio --completa, hay diff de correcciones (no se cayo a la base), el delta
    // no trae merges (codigo ajeno sin revisar) y solo toca ficheros que algun
    // hallazgo nombraba (decision de la persona). Antes de escribir nada: es
    // funcion pura de lo commiteado, y un reintento da el mismo alcance.
    let acotada = false;
    let motivoAlcance = 'primera ronda de revision';
    if (incremental && previa !== null) {
        const fuera = paraRevision.incluidos.filter((f) => !ficheroNombrado(f, previa.alcance.ficherosNombrados));
        if (completaPedida)
            motivoAlcance = 'pedida con --completa';
        else if (!previa.alcance.acotada)
            motivoAlcance = previa.alcance.motivo;
        else if (desde === baseBranch)
            motivoAlcance = 'no hay diff de correcciones: el diff va desde la rama base';
        else if (hayMergesEntre(desde, 'HEAD', deps.repoCwd))
            motivoAlcance = `hay commits de merge entre ${desde} y HEAD`;
        else if (fuera.length > 0) {
            // Cinco bastan para el motivo: es una linea de cabecera, no la lista.
            const resto = fuera.length > 5 ? ` (y ${fuera.length - 5} mas)` : '';
            motivoAlcance = `el diff toca ficheros que ningun hallazgo nombraba: ${fuera.slice(0, 5).join(', ')}${resto}`;
        }
        else {
            acotada = true;
            motivoAlcance = `${previa.alcance.motivo} y el diff solo toca sus ficheros`;
        }
        // Una ronda completa tras una acotada revisa desde la base: el delta de
        // la acotada nunca tuvo revision completa (punto 3 del plan de TASK-083).
        if (!acotada && previa.fueAcotada && desde !== baseBranch) {
            motivoAlcance += `; la ronda ${previa.ronda} fue acotada, asi que el diff va desde "${baseBranch}"`;
            desde = baseBranch;
            paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
        }
    }
    const commits = logOneline(desde, 'HEAD', deps.repoCwd);
    const diff = paraRevision.diff;
    // TASK-091: con `comando_verificacion_selectiva`, la ronda la corre (con la
    // base en RAMA_BASE) ANTES de escribir la ronda: un rojo aborta con la tarea
    // en curso y sin ronda a medias (decision de Carlos). En la primera ronda el
    // update de Git-Flow ya integro la base (y ese merge queda hecho); en una
    // incremental la rama no se actualiza (TASK-040). Sin la clave, nada.
    const selectiva = verificacionSelectivaDeRonda(id, configRama, baseBranch, incremental, deps);
    // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
    // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
    // nadie arreglo sigue ahi). Una vez por ronda y antes de escribir nada;
    // nunca lanza: un informe roto es un aviso en la peticion. TASK-091: si
    // corrio la selectiva no se muestra: su informe puede ser parcial
    // (decision de Carlos; la completa la mide en el cierre).
    const datosCobertura = configRama.informe_cobertura === null || selectiva !== null
        ? null
        : datosCoberturaRevision(raizDelRepo(deps.repoCwd), baseBranch, configRama.informe_cobertura, excluir, configRama.umbral_cobertura, configRama.comando_verificacion);
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
    // TASK-083: la verificacion acotada no se fragmenta: un solo revisor, el
    // generico, con todo el delta y los nombres de siempre (sin sufijo).
    const plan = acotada
        ? { fragmentado: false, grupos: [{ revisor: catalogoRevisores.generico.nombre, ficheros: ficherosTocados }] }
        : clasificarPorDominio(ficherosTocados, catalogoRevisores);
    // TASK-074 (MEN-4 de la revision): en una peticion fragmentada, la seccion
    // de cobertura de cada dominio lleva SUS ficheros cambiados desde la merge
    // base, no solo los del delta de la ronda: una linea sin cubrir de la ronda
    // 1 sigue en la 2 aunque su fichero no haya vuelto a cambiar. Y si el
    // dominio de un fichero no tiene peticion en esta ronda (el delta solo toca
    // otros dominios), sus lineas van a la primera peticion: no se pierden
    // (MEN-5 de la ronda 2).
    const coberturaPorRevisor = new Map();
    if (plan.fragmentado && datosCobertura?.tipo === 'ok' && datosCobertura.cobertura.cruce !== null) {
        const cruce = datosCobertura.cobertura.cruce;
        const cambiados = [...cruce.ficheros.map((f) => f.ruta), ...cruce.sinInstrumentar];
        const conPeticion = new Set(plan.grupos.map((g) => g.revisor));
        const primera = plan.grupos[0].revisor;
        for (const g of clasificarPorDominio(cambiados, catalogoRevisores).grupos) {
            const destino = conPeticion.has(g.revisor) ? g.revisor : primera;
            const set = coberturaPorRevisor.get(destino) ?? new Set();
            for (const f of g.ficheros)
                set.add(f);
            coberturaPorRevisor.set(destino, set);
        }
    }
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
    // TASK-081: todo lo que va a la peticion se calcula ANTES del primer
    // writeFile: si algo falla aqui no queda nada a medias en revision/.
    const carpetaTarea = `tareas/${STATE_FOLDER[updated.estado]}/${updated.id}`;
    const modeloRonda = incremental && previa !== null && previa.alcance.modeloBarato
        ? modeloDeVerificacion(updated.modelo_sugerido)
        : null;
    const escrituras = plan.grupos.map((grupo) => {
        const sufijo = plan.fragmentado ? `-${grupo.revisor}` : '';
        return {
            revisor: grupo.revisor,
            ficheros: grupo.ficheros,
            nombrePeticion: `peticion-revision-${ronda}${sufijo}.md`,
            nombreInforme: `informe-revision-${ronda}${sufijo}.md`,
            contexto: contextoPermitido({
                carpetaTarea,
                ficherosDelGrupo: grupo.ficheros,
                extra: configRama.contexto_revision,
                excluir,
            }),
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
                carpetaTarea,
                contextoPermitido: escritura.contexto,
                alcance: { acotada, motivo: motivoAlcance },
                ...(modeloRonda === null ? {} : { modeloRonda }),
                excluidos: paraRevision.excluidos,
                stat: paraRevision.stat,
                patrones: excluir,
                ...(incremental && desde !== baseBranch ? { desde } : {}),
                ...(previa !== null ? { seccionPrevia: previa.seccion } : {}),
                ...(datosCobertura === null
                    ? {}
                    : {
                        seccionCobertura: seccionCoberturaRevision(datosCobertura, plan.fragmentado ? (coberturaPorRevisor.get(escritura.revisor) ?? new Set()) : undefined),
                    }),
                ...(selectiva === null
                    ? {}
                    : {
                        seccionVerificacion: seccionVerificacionRevision({
                            resultado: selectiva.resultado,
                            base: baseBranch,
                            deMemo: selectiva.deMemo,
                            conCobertura: configRama.informe_cobertura !== null,
                        }),
                    }),
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
    // TASK-085: el coste de implementacion que el hook fue anotando se suma
    // aqui, en el mismo fichero y commit que la transicion. Nunca aborta.
    const volcado = await volcarCosteAutomatico(updated, body, instanteDelVolcado(deps.ahora), {
        raiz: deps.repoCwd,
        ...(deps.env === undefined ? {} : { env: deps.env }),
        ...(deps.configDir === undefined ? {} : { configDir: deps.configDir }),
    });
    avisos.push(...volcado.avisos);
    const conRegistro = registrarTransicion(volcado.body, 'review', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
    const newFilePath = await moveTareaFile(tareasRoot, filePath, volcado.task, conRegistro);
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
    if (commitResult.commiteado)
        volcado.olvidar();
    return {
        autoCommit: commitResult,
        incremental,
        desde,
        avisos,
        costeImplementacion: { sumado: volcado.sumado, filas: volcado.filas },
        id: task.id,
        rama,
        baseBranch,
        commitRevisado,
        ronda,
        filePath: newFilePath,
        agente: updated.agente_revisor,
        modelo: updated.modelo_sugerido,
        ...(modeloRonda === null ? {} : { modeloRonda }),
        alcance: acotada ? 'acotada' : 'completa',
        motivoAlcance,
        informes,
    };
}
/**
 * TASK-091: la verificacion selectiva de la ronda, o null si el proyecto no
 * la declara. Reutiliza el resultado del hook Stop si la huella coincide.
 * Lanza ReviewCommandError (sin haber escrito nada) si no sale en verde o si
 * deja el arbol sucio: el autocommit de la ronda se llevaria esos ficheros o
 * el siguiente comando abortaria por workspace sucio.
 */
function verificacionSelectivaDeRonda(id, config, base, incremental, deps) {
    const comando = config.comando_verificacion_selectiva;
    if (comando === null)
        return null;
    const raiz = raizDelRepo(deps.repoCwd);
    const v = verificarConMemo(raiz, { tipo: 'selectiva', comando, timeoutS: config.timeout_verificacion_selectiva, base }, deps.env === undefined ? {} : { env: deps.env });
    // Lo que ya paso con la base antes de verificar: solo la primera ronda la integra.
    const estadoBase = incremental
        ? `en una ronda incremental la rama no se actualiza con "${base}"`
        : `la rama ya incluye "${base}" tal como estaba al empezar este review; si "${base}" avanza, el ` +
            'siguiente review lo integra';
    if (v.resultado.estado !== 'verde') {
        throw new ReviewCommandError(`[ERROR] ${id}: la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE) no esta en ` +
            'verde, asi que no se abre ronda de revision: la tarea sigue en curso y no se ha escrito peticion ni ' +
            `informe (${estadoBase}).\n` +
            `${formatearVerificacionRoja(v.resultado)}\n` +
            (v.deMemo
                ? 'Es el resultado guardado: el arbol no ha cambiado desde la ultima ejecucion. Cambia algo o ejecuta el comando a mano.\n'
                : '') +
            `Para reproducirla: ejecuta "${comando}" con la variable de entorno RAMA_BASE=${base}.`);
    }
    if (v.cambioElArbol) {
        throw new ReviewCommandError(`[ERROR] ${id}: la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
            `("${comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en .gitignore, ` +
            `o descartalos, y reintenta. No se ha abierto ronda (${estadoBase}).`);
    }
    return v;
}
