/**
 * Puerta de verificacion de `taskctl finish` — TASK-072, capa 1.
 *
 * Con `comando_verificacion` declarado, `finish` lo ejecuta SIEMPRE antes de
 * mergear o de abrir el merge request (decision de Carlos: no reutiliza el
 * memo, que no ve los ficheros ignorados) y aborta con el informe si no sale
 * en verde. Solo corre en los caminos que van a integrar algo: ni en el
 * segundo `finish --merge-request` (la plataforma ya mergeo) ni en el camino
 * idempotente (los merges ya estan hechos), donde solo bloquearia lo hecho.
 *
 * `--sin-verificacion` la salta y lo deja escrito en la tarea. La anotacion
 * se COMMITEA en la rama de la tarea ANTES del merge: asi viaja con el merge
 * y el rastro sobrevive aunque el proceso muera despues del script. Escribirla
 * sin commitear ensuciaria el workspace y el script de Git-Flow abortaria.
 *
 * TASK-091: la verificacion selectiva no cuenta aqui. Aunque las rondas de
 * revision corrieran la selectiva, `finish` ejecuta la COMPLETA sobre el
 * commit que va a integrar, y el guardian solo lee el memo de la completa.
 *
 * Tras un verde se guarda el memo con la huella del arbol (limpio, igual que
 * `huellaDeCommit` del commit de la rama): es lo que consulta el guardian de
 * merges (hooks/guardia-merge) para no bloquear un merge ya verificado.
 *
 * TASK-100: si la config de la rama base declara `rutas_documentacion` y todo
 * lo que cambia la tarea cae en ellas (core/verificacion-proporcional), no se
 * ejecuta `comando_verificacion`: solo `comando_verificacion_documentacion` si
 * existe, con su propio memo (nunca el de la completa). Queda anotado en la
 * tarea y commiteado antes del merge, como el salto con --sin-verificacion.
 * Ante cualquier duda (diff no calculable, vacio, mixto, config cambiada o de
 * la base invalida), la completa de siempre.
 */
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { ConfigError, resolverConfig } from '../core/config.js';
import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
import { serializeTareaFile } from '../core/tarea-file.js';
import { anotarVerificacionDocumentacion, anotarVerificacionOmitida } from '../core/transiciones.js';
import { decidirVerificacion, documentacionDeclarada, patronesDocumentacion, } from '../core/verificacion-proporcional.js';
import { configDeRef } from '../fs/config-de-ref.js';
import { currentBranch, isWorkspaceClean, rutasDeTarea } from '../fs/git.js';
import { autoCommit, mensajeChore } from '../fs/git-commit.js';
import { readTareaFile } from '../fs/task-store.js';
import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
import { FinishCommandError } from './finish-opciones.js';
export const FLAG_SIN_VERIFICACION = '--sin-verificacion';
/** Saca `--sin-verificacion` de argv. */
export function extraerSinVerificacion(argv) {
    const resto = argv.filter((a) => a !== FLAG_SIN_VERIFICACION);
    return { sinVerificacion: resto.length !== argv.length, resto };
}
/**
 * TASK-100: la decision para esta tarea, con la config de la base, o null si
 * la base no declara rutas de documentacion (entonces ni se calcula el diff).
 * Una config de la base invalida no exime de nada: la completa.
 */
function decisionDocumentacion(o, ramaBase) {
    let base;
    try {
        base = configDeRef(ramaBase, o.cwd);
    }
    catch (e) {
        if (!(e instanceof ConfigError))
            throw e;
        o.onAviso?.(`${o.id}: la configuracion de "${ramaBase}" no es valida, asi que no se puede saber si la tarea es solo ` +
            `documentacion: se ejecuta la verificacion completa. Detalle: ${e.message.replace(/^\[ERROR\]\s*/, '')}`);
        return null;
    }
    if (!documentacionDeclarada(base))
        return null;
    const diff = rutasDeTarea(ramaBase, 'HEAD', patronesDocumentacion(base), o.cwd);
    return { decision: decidirVerificacion(base, diff, ramaBase), timeoutS: base.timeout_verificacion };
}
/**
 * Ejecuta la puerta. Devuelve la tarea releida (la anotacion del salto cambia
 * su cuerpo, y quien escriba despues tiene que partir de ella). Lanza
 * FinishCommandError si no se puede mergear; antes del commit del salto no
 * ha tocado nada.
 */
export async function puertaVerificacion(o) {
    const config = resolverConfig(o.cwd);
    const comando = config.comando_verificacion;
    if (comando === null) {
        if (o.sinVerificacion) {
            o.onAviso?.(`${o.id}: el proyecto no declara comando_verificacion, asi que no hay verificacion que saltar: ` +
                `${FLAG_SIN_VERIFICACION} no tiene efecto y no se anota nada.`);
        }
        return { resultado: { tipo: 'sin-comando' }, tarea: o.initial };
    }
    // La verificacion mira el arbol de trabajo: tiene que ser el de la tarea.
    const actual = currentBranch(o.cwd);
    if (actual !== o.rama) {
        throw new FinishCommandError(`[ERROR] ${o.id}: la verificacion del proyecto se ejecuta sobre el arbol de la rama de la tarea, ` +
            `y la rama activa es "${actual === '' ? 'HEAD desacoplado' : actual}", no "${o.rama}". ` +
            `Cambiate a ella (git checkout ${o.rama}) y reintenta taskctl finish; no se ha tocado nada.`);
    }
    if (o.sinVerificacion) {
        const body = anotarVerificacionOmitida(o.initial.body, o.instante, comando);
        await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
        const c = autoCommit({
            cwd: o.cwd,
            rutas: [path.dirname(o.initial.filePath)],
            mensaje: mensajeChore(o.id, 'cierre sin verificacion'),
            push: false,
        });
        for (const a of c.avisos)
            o.onAviso?.(a);
        o.onAviso?.(`${o.id}: cierre con ${FLAG_SIN_VERIFICACION}: no se ha ejecutado "${comando}". Queda anotado en ` +
            `tarea.md (seccion "Verificacion omitida")${c.commit === null ? '' : `, commit ${c.commit}`}.`);
        const releida = await readTareaFile(o.tareasRoot, o.id);
        if (releida === null) {
            throw new FinishCommandError(`[ERROR] ${o.id}: tarea.md desaparecio tras anotar el salto; revisa el repo a mano.`);
        }
        return { resultado: { tipo: 'omitida', commit: c.commit }, tarea: releida };
    }
    const docs = o.ramaBase === undefined ? null : decisionDocumentacion(o, o.ramaBase);
    if (docs !== null && docs.decision.tipo === 'documentacion') {
        return puertaSoloDocumentacion(o, comando, docs.decision, docs.timeoutS);
    }
    if (docs !== null) {
        o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${docs.decision.motivo}.`);
    }
    const timeoutS = config.timeout_verificacion;
    const inicioMs = Date.now();
    const r = ejecutarVerificacion(o.cwd, comando, timeoutS, o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs });
    // El memo solo con el arbol limpio: es la huella del commit que consulta el
    // guardian de merges; con el arbol sucio no la casaria nunca (MEN-3).
    const limpio = isWorkspaceClean(o.cwd);
    const huella = limpio ? huellaDelArbol(o.cwd, comando, timeoutS) : null;
    if (huella !== null)
        guardarMemo(o.cwd, huella, r);
    if (r.estado !== 'verde') {
        throw new FinishCommandError(`[ERROR] ${o.id}: no se mergea con la verificacion en rojo. No se ha tocado nada.\n` +
            `${formatearVerificacionRoja(r)}\n` +
            // TASK-091: con selectiva, que quede claro por que se corre la completa aunque las rondas pasaran.
            (config.comando_verificacion_selectiva === null
                ? ''
                : 'Es la verificacion completa (comando_verificacion): se exige en verde sobre el commit que se ' +
                    'integra aunque las rondas usaran la selectiva. Correla a mano con ese comando en la rama de la ' +
                    'tarea hasta que salga en verde, commitea los arreglos y reintenta.\n') +
            `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
            'lo deja anotado en la tarea.');
    }
    if (!limpio) {
        throw new FinishCommandError(`[ERROR] ${o.id}: la verificacion salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
            `("${comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita el ` +
            'workspace limpio: ignora esos ficheros en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.');
    }
    return { resultado: { tipo: 'verde', duracionMs: r.duracionMs, inicioMs }, tarea: o.initial };
}
/**
 * TASK-100: la tarea solo cambia documentacion. Primero se anota y commitea
 * en la rama (asi el merge lleva el rastro y el memo casa con el commit que
 * se integra); despues corre la comprobacion de documentacion, si existe, y
 * su rojo bloquea igual que el de la completa.
 */
async function puertaSoloDocumentacion(o, comando, decision, timeoutS) {
    const body = anotarVerificacionDocumentacion(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
    await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
    const c = autoCommit({
        cwd: o.cwd,
        rutas: [path.dirname(o.initial.filePath)],
        mensaje: mensajeChore(o.id, 'cierre solo documentacion'),
        push: false,
    });
    for (const a of c.avisos)
        o.onAviso?.(a);
    const releida = await readTareaFile(o.tareasRoot, o.id);
    if (releida === null) {
        throw new FinishCommandError(`[ERROR] ${o.id}: tarea.md desaparecio tras anotar la verificacion; revisa el repo a mano.`);
    }
    if (decision.comando !== null) {
        const r = ejecutarVerificacion(o.cwd, decision.comando, timeoutS, o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs });
        const limpio = isWorkspaceClean(o.cwd);
        const huella = limpio ? huellaDelArbol(o.cwd, decision.comando, timeoutS) : null;
        if (huella !== null)
            guardarMemo(o.cwd, huella, r, 'documentacion');
        if (r.estado !== 'verde') {
            throw new FinishCommandError(`[ERROR] ${o.id}: la tarea solo cambia documentacion, pero su comprobacion ` +
                `(comando_verificacion_documentacion) no sale en verde. No se ha mergeado nada.\n` +
                `${formatearVerificacionRoja(r)}\n` +
                `Arregla la documentacion, commitea y reintenta. Si la persona decide cerrar igualmente, ` +
                `taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`);
        }
        if (!limpio) {
            throw new FinishCommandError(`[ERROR] ${o.id}: la comprobacion de documentacion salio en verde, pero ha dejado cambios en el arbol ` +
                `de trabajo ("${decision.comando}" escribe ficheros versionados o no ignorados: mira git status). ` +
                'Ignoralos en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.');
        }
    }
    o.onAviso?.(`${o.id}: ${decision.motivo}: no se ejecuta la verificacion completa ("${comando}"); ` +
        (decision.comando === null
            ? 'no hay comprobacion de documentacion declarada.'
            : `la comprobacion de documentacion ("${decision.comando}") sale en verde.`) +
        ` Queda anotado en tarea.md (seccion "Verificacion de documentacion")` +
        `${c.commit === null ? '' : `, commit ${c.commit}`}.`);
    return { resultado: { tipo: 'documentacion', comando: decision.comando, motivo: decision.motivo }, tarea: releida };
}
