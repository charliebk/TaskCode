/**
 * `taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar`
 * — TASK-058.
 *
 * Bloqueo por arbol de trabajo mientras dura una cadena de fases
 * (semiautomatico y automatico). Dos sesiones sobre el mismo arbol harian
 * checkout y commits a la vez y el trabajo acabaria en la rama equivocada
 * (riesgo del plan de TASK-055). El bloqueo vive en el directorio de Git
 * (`git rev-parse --git-path`), fuera del arbol: no ensucia el workspace y
 * en un worktree enlazado es propio de ese worktree.
 *
 * Una sesion de Claude Code no tiene identidad que el CLI pueda ver, asi que
 * la identidad es un TESTIGO: `abrir` lo genera y lo imprime, las skills lo
 * pasan de una a la siguiente con `--cadena`, y solo quien lo tiene puede
 * comprobar o cerrar el bloqueo.
 *
 * El fichero se crea con la bandera `wx` (falla si existe): dos `abrir` a la
 * vez no pueden ganar los dos.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runGit } from '../fs/git.js';
import { isEexist, isEnoent } from '../fs/task-store.js';
import { isValidTaskId } from '../core/task.js';
export class CadenaCommandError extends Error {
}
/** Ruta absoluta del bloqueo, en el directorio de Git de este arbol. */
export function rutaBloqueo(repoCwd) {
    return path.resolve(repoCwd, runGit(['rev-parse', '--git-path', 'taskcode/cadena.lock'], repoCwd));
}
async function leerBloqueo(ruta) {
    let texto;
    try {
        texto = await readFile(ruta, 'utf8');
    }
    catch (e) {
        if (isEnoent(e))
            return null;
        throw e;
    }
    try {
        const b = JSON.parse(texto);
        if (typeof b.tarea === 'string' && typeof b.testigo === 'string' && typeof b.abierto === 'string') {
            return { tarea: b.tarea, testigo: b.testigo, abierto: b.abierto };
        }
    }
    catch {
        // Fichero roto: se trata como un bloqueo de origen desconocido.
    }
    return { tarea: '(desconocida)', testigo: '', abierto: '(desconocido)' };
}
function antiguedad(abierto, ahora) {
    const t = Date.parse(abierto);
    if (Number.isNaN(t))
        return 'desde un momento desconocido';
    const min = Math.max(0, Math.round((ahora.getTime() - t) / 60000));
    return min < 60 ? `hace ${String(min)} min` : `hace ${String(Math.round(min / 60))} h`;
}
function mensajeOcupado(b, ruta, ahora) {
    return (`[ERROR] Hay otra cadena de fases en marcha en este arbol de trabajo: ${b.tarea}, ` +
        `abierta ${antiguedad(b.abierto, ahora)} (${ruta}).\n` +
        '        Dos sesiones encadenando fases sobre el mismo arbol se pisan las ramas. Espera a ' +
        'que termine, o trabaja desde otro worktree.\n' +
        '        Si esa sesion ya no existe (se corto a medias): taskctl cadena cerrar --forzar');
}
export async function runCadenaCommand(argv, deps) {
    const ahora = (deps.ahora ?? (() => new Date()))();
    const [accion, arg] = argv;
    const ruta = rutaBloqueo(deps.repoCwd);
    switch (accion) {
        case 'abrir': {
            if (arg === undefined || !isValidTaskId(arg)) {
                throw new CadenaCommandError('[ERROR] Uso: taskctl cadena abrir TASK-NNN.');
            }
            const bloqueo = {
                tarea: arg,
                testigo: randomBytes(8).toString('hex'),
                abierto: ahora.toISOString(),
            };
            await mkdir(path.dirname(ruta), { recursive: true });
            try {
                await writeFile(ruta, `${JSON.stringify(bloqueo)}\n`, { encoding: 'utf8', flag: 'wx' });
            }
            catch (e) {
                if (!isEexist(e))
                    throw e;
                const otro = await leerBloqueo(ruta);
                throw new CadenaCommandError(mensajeOcupado(otro, ruta, ahora));
            }
            return { accion: 'abrir', bloqueo, ruta };
        }
        case 'comprobar': {
            if (arg === undefined || arg.startsWith('--')) {
                throw new CadenaCommandError('[ERROR] Uso: taskctl cadena comprobar <testigo>.');
            }
            const b = await leerBloqueo(ruta);
            if (b === null) {
                throw new CadenaCommandError('[ERROR] La cadena ya no esta abierta en este arbol (se cerro o se forzo su cierre). ' +
                    'Para seguir, lanza la skill de la fase sin --cadena: abrira una nueva si hace falta.');
            }
            if (b.testigo !== arg)
                throw new CadenaCommandError(mensajeOcupado(b, ruta, ahora));
            return { accion: 'comprobar', bloqueo: b };
        }
        case 'cerrar': {
            const b = await leerBloqueo(ruta);
            if (arg === '--forzar') {
                await rm(ruta, { force: true });
                return { accion: 'cerrar', ruta, existia: b !== null };
            }
            if (arg === undefined) {
                throw new CadenaCommandError('[ERROR] Uso: taskctl cadena cerrar <testigo> | cerrar --forzar.');
            }
            if (b === null)
                return { accion: 'cerrar', ruta, existia: false };
            if (b.testigo !== arg) {
                throw new CadenaCommandError(`[ERROR] El testigo no es el de la cadena abierta (${b.tarea}): no se cierra la cadena ` +
                    'de otra sesion. Si esa sesion ya no existe: taskctl cadena cerrar --forzar');
            }
            await rm(ruta, { force: true });
            return { accion: 'cerrar', ruta, existia: true };
        }
        default:
            throw new CadenaCommandError('[ERROR] Uso: taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar.');
    }
}
