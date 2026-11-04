/**
 * Freno de fin de turno — TASK-071. Lo ejecuta el hook `Stop` de Claude Code
 * (hooks/hooks.json -> dist/src/hooks/stop-verificacion.js) al terminar cada
 * turno del agente principal, en TODAS las sesiones de TODOS los proyectos con
 * el plugin. De ahi el orden de las guardas: de la mas barata a la mas cara, y
 * ningun proceso hasta saber que hay una tarea en curso.
 *
 *   1. `FRENO_VERIFICACION=0` en el entorno: interruptor de emergencia.
 *   2. `stop_hook_active: true`: Claude Code ya esta continuando por un
 *      bloqueo nuestro; volver a bloquear haria un bucle con un test flaky.
 *      Por eso el freno es de UN disparo por turno (aceptado en el plan).
 *   3. `tareas/02-en-curso/` no existe en la raiz del repo (solo `stat`).
 *   4. Ninguna tarea en curso (lectura de esa carpeta).
 *   5. Config: sin `comando_verificacion`, nada. Config invalida: se recuerda.
 *   6. La rama actual (el unico `git`) no es la `rama` de ninguna tarea en
 *      curso: nada. HEAD desacoplado cae aqui (aceptado en el plan).
 *   7. Config invalida con tarea en curso en la rama: BLOQUEA (decision de
 *      Carlos: fallo cerrado, como el resto de la config).
 *   8. Memo: misma huella del arbol que la ultima verificacion -> su resultado.
 *   9. Ejecutar. Verde -> 0. Cualquier otra cosa -> 2 con el informe.
 *
 * Contrato con Claude Code (spike TASK-069 y documentacion oficial): exit 0
 * deja parar; exit 2 bloquea y el stderr le llega al agente; exit 1 NO
 * bloquea, asi que nunca se sale con 1 por accidente: decidirStop no lanza.
 * Nada de lo que escribe nombra el producto: lo leen proyectos ajenos.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ConfigError, raizDelRepo, resolverConfigConAvisos } from '../core/config.js';
import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
import { listTareasEnEstados } from '../fs/task-store.js';
import { ejecutarVerificacion, guardarMemo, huellaDelArbol, leerMemo } from '../fs/verificacion.js';
/**
 * `timeout` del hook Stop en hooks/hooks.json, en segundos. Claude Code cancela
 * el hook al vencerlo y descarta su salida: el freno fallaria ABIERTO. Por eso
 * la verificacion se corta antes, con margen para escribir el informe. Un test
 * comprueba que coincide con hooks.json.
 */
export const TECHO_HOOK_S = 3600;
export const MARGEN_HOOK_S = 60;
/** Variable de entorno que apaga el freno: `FRENO_VERIFICACION=0`. */
export const INTERRUPTOR = 'FRENO_VERIFICACION';
const DEJAR_PARAR = Object.freeze({ codigo: 0, stderr: '' });
/** El directorio de tareas en curso, si existe. Sin procesos. */
function carpetaEnCurso(raiz) {
    const dir = path.join(raiz, 'tareas', '02-en-curso');
    try {
        return statSync(dir).isDirectory() ? dir : null;
    }
    catch {
        return null;
    }
}
function ramaActual(raiz) {
    const r = spawnSync('git', ['branch', '--show-current'], { cwd: raiz, encoding: 'utf8', windowsHide: true });
    if (r.error !== undefined || r.status !== 0)
        return null;
    const rama = (r.stdout ?? '').trim();
    return rama === '' ? null : rama;
}
export async function decidirStop(entrada, deps = {}) {
    const env = deps.env ?? process.env;
    // 1 y 2: sin I/O.
    if (env[INTERRUPTOR] === '0')
        return DEJAR_PARAR;
    if (entrada.stop_hook_active === true)
        return DEJAR_PARAR;
    if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd))
        return DEJAR_PARAR;
    let raiz;
    let ids;
    let config = null;
    let errorConfig = null;
    let rama;
    try {
        // 3 y 4: stat y lectura de una carpeta.
        raiz = raizDelRepo(entrada.cwd);
        const dir = carpetaEnCurso(raiz);
        if (dir === null)
            return DEJAR_PARAR;
        const { tareas } = await listTareasEnEstados(path.join(raiz, 'tareas'), ['en-curso']);
        const ramas = new Set(tareas.map((t) => t.task.rama).filter((r) => typeof r === 'string' && r !== ''));
        ids = tareas.map((t) => t.task.id);
        if (ramas.size === 0)
            return DEJAR_PARAR;
        // 5: un readFile.
        try {
            config = resolverConfigConAvisos(raiz).config;
            if (config.comando_verificacion === null)
                return DEJAR_PARAR;
        }
        catch (e) {
            if (!(e instanceof ConfigError))
                throw e;
            errorConfig = e.message.replace(/^\[ERROR\]\s*/, '');
        }
        // 6: el unico git hasta aqui.
        rama = ramaActual(raiz);
        if (rama === null || !ramas.has(rama))
            return DEJAR_PARAR;
        ids = tareas.filter((t) => t.task.rama === rama).map((t) => t.task.id);
    }
    catch {
        // Algo inesperado ANTES de saber si el freno aplica (tareas ilegibles,
        // permisos): no se puede afirmar que haya una tarea en curso aqui.
        return DEJAR_PARAR;
    }
    try {
        const tarea = ids.join(', ');
        // 7
        if (errorConfig !== null || config === null) {
            return {
                codigo: 2,
                stderr: `Hay una tarea en curso en esta rama (${tarea}), pero la configuracion del proyecto no se ` +
                    `puede leer, asi que no se sabe como verificarla:\n  ${errorConfig ?? 'configuracion ausente'}\n` +
                    'Corrige .taskcode/config.yml y vuelve a verificar antes de dar la tarea por terminada.',
            };
        }
        const comando = config.comando_verificacion;
        const techo = TECHO_HOOK_S - MARGEN_HOOK_S;
        const timeoutS = Math.min(config.timeout_verificacion, techo);
        const avisos = [];
        if (config.timeout_verificacion > techo) {
            avisos.push(`timeout_verificacion pide ${String(config.timeout_verificacion)} s, pero este freno tiene un tope de ` +
                `${String(techo)} s: se ha usado el tope.`);
        }
        // 8
        const huella = huellaDelArbol(raiz, comando, timeoutS);
        const guardado = huella === null ? null : leerMemo(raiz, huella);
        if (guardado !== null) {
            if (guardado.estado === 'verde')
                return DEJAR_PARAR;
            avisos.push('Es el resultado guardado de la ultima verificacion: el arbol no ha cambiado desde entonces y no ' +
                'se ha vuelto a ejecutar. Si crees que el fallo es intermitente, cambia algo o ejecuta el comando a mano.');
            return bloquear(tarea, guardado, avisos);
        }
        // 9
        const deOpciones = deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs };
        const r = ejecutarVerificacion(raiz, comando, timeoutS, deOpciones);
        const despues = huellaDelArbol(raiz, comando, timeoutS);
        if (despues !== null)
            guardarMemo(raiz, despues, r);
        if (r.estado === 'verde')
            return DEJAR_PARAR;
        if (huella !== null && despues !== null && huella !== despues) {
            avisos.push('La propia verificacion ha cambiado ficheros del arbol de trabajo (git status): revisalos antes del ' +
                'siguiente comando, que puede abortar por workspace sucio.');
        }
        return bloquear(tarea, r, avisos);
    }
    catch (e) {
        // Con una tarea en curso en la rama y el freno configurado, un fallo del
        // propio freno no puede convertirse en un "todo bien" silencioso.
        const msg = e instanceof Error ? e.message : String(e);
        return {
            codigo: 2,
            stderr: `El freno de verificacion no pudo comprobar la tarea en curso: ${msg}\n` +
                'Ejecuta a mano el comando de verificacion del proyecto antes de dar la tarea por terminada.',
        };
    }
}
function bloquear(tarea, r, avisos) {
    const lineas = [`Tarea en curso en esta rama: ${tarea}.`, formatearVerificacionRoja(r), ...avisos];
    return { codigo: 2, stderr: lineas.join('\n') };
}
/** Lee stdin entero (el JSON del hook). Un JSON roto o vacio es una entrada sin campos. */
export function parsearEntrada(texto) {
    try {
        const v = JSON.parse(texto);
        return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {};
    }
    catch {
        return {};
    }
}
