/**
 * La status line de Claude Code que muestra `taskctl estado` (TASK-110). Un
 * plugin no puede declararla: solo se configura con la clave `statusLine` de
 * un `settings.json`. Se instala UNA vez, en el de usuario
 * (`<config>/settings.json`), y vale para todos los proyectos: fuera de uno
 * con tareas, `taskctl estado` no imprime nada.
 *
 * Es la primera escritura de taskctl en un fichero de Claude Code, asi que:
 *
 * - Solo con un flag explicito de doctor; sin el, solo se mira.
 * - Se conservan las demas claves (se lee, se cambia `statusLine` y nada mas).
 * - Una `statusLine` ajena no se sustituye sin un flag aparte, y entonces su
 *   valor se guarda para que desinstalar la devuelva.
 * - Copia del fichero antes de tocarlo, y escritura con tmp+rename (Claude
 *   Code puede estar reescribiendo el mismo fichero: la ventana es minima).
 * - Idempotente: si ya esta, no se escribe.
 * - El comando es `taskctl` por el PATH, nunca una ruta a la cache del
 *   plugin (cambia con cada actualizacion y la barra se romperia sin avisar).
 *   Si `taskctl` no esta en el PATH del sistema, no se instala. La carpeta
 *   del plugin que Claude Code anade al PATH de su herramienta Bash no cuenta:
 *   es esa misma ruta de la cache.
 */
import { accessSync, constants, copyFileSync, existsSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { esObjeto, leerJson } from './json-claude.js';
import { escribirAtomico } from './progreso.js';
/** Lo que ejecuta la status line. `--stdin`: toma el directorio del JSON que le pasa Claude Code. */
export const COMANDO_STATUS_LINE = 'taskctl estado --stdin';
/** Donde se guarda la status line ajena que se sustituyo, para devolverla al desinstalar. */
export const FICHERO_PREVIA = 'statusline-previa-taskctl.json';
export function rutaSettingsUsuario(configDir) {
    return path.join(configDir, 'settings.json');
}
/** true si la `statusLine` es la que instala doctor (un `taskctl estado`, con o sin flags). */
export function esNuestra(statusLine) {
    return (esObjeto(statusLine) &&
        statusLine['type'] === 'command' &&
        typeof statusLine['command'] === 'string' &&
        /^\s*taskctl(?:\.cmd)?\s+estado(?:\s|$)/.test(statusLine['command']));
}
function describir(statusLine) {
    if (esObjeto(statusLine) && typeof statusLine['command'] === 'string')
        return statusLine['command'];
    return JSON.stringify(statusLine) ?? String(statusLine);
}
export function sondearStatusLine(configDir) {
    const ruta = rutaSettingsUsuario(configDir);
    const l = leerJson(ruta);
    if (l.estado === 'ausente')
        return { estado: 'ausente', ruta };
    if (l.estado === 'ilegible')
        return { estado: 'ilegible', ruta, motivo: l.motivo };
    if (!esObjeto(l.json))
        return { estado: 'ilegible', ruta, motivo: 'no es un objeto JSON' };
    const sl = l.json['statusLine'];
    if (sl === undefined || sl === null)
        return { estado: 'ausente', ruta };
    if (esNuestra(sl))
        return { estado: 'nuestra', ruta };
    return { estado: 'ajena', ruta, comando: describir(sl) };
}
/** Una variable del entorno sin distinguir mayusculas (en Windows es `Path`, `PATH`...). */
function variable(env, nombre) {
    const clave = Object.keys(env).find((k) => k.toUpperCase() === nombre);
    return clave === undefined ? undefined : env[clave];
}
function dentroDe(ruta, dir) {
    const rel = path.relative(path.resolve(dir), path.resolve(ruta));
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}
/** Busca `taskctl` en el PATH de `env`, sin lanzar nada. */
export function buscarTaskctl(env, configDir) {
    const win = process.platform === 'win32';
    const exts = win ? ['', ...(variable(env, 'PATHEXT') ?? '.COM;.EXE;.BAT;.CMD').split(';').filter((e) => e !== '')] : [''];
    const plugins = path.join(configDir, 'plugins');
    let soloEnPlugin = false;
    for (const dir of (variable(env, 'PATH') ?? '').split(path.delimiter)) {
        if (dir.trim() === '')
            continue;
        for (const ext of exts) {
            const candidato = path.join(dir, `taskctl${ext.toLowerCase()}`);
            try {
                if (!statSync(candidato).isFile())
                    continue;
                if (!win)
                    accessSync(candidato, constants.X_OK);
            }
            catch {
                continue;
            }
            if (dentroDe(candidato, plugins)) {
                soloEnPlugin = true;
                continue;
            }
            return { ruta: candidato, soloEnPlugin: false };
        }
    }
    return { ruta: null, soloEnPlugin };
}
function sello(ahora) {
    return ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}
/** Copia del settings.json antes de cambiarlo; devuelve su ruta (o null si no habia fichero). */
function copiaDeSeguridad(ruta, ahora) {
    if (!existsSync(ruta))
        return null;
    const copia = `${ruta}.${sello(ahora)}.bak`;
    copyFileSync(ruta, copia);
    return copia;
}
function leerObjeto(ruta) {
    if (!existsSync(ruta))
        return {};
    const json = JSON.parse(readFileSync(ruta, 'utf8').replace(/^\uFEFF/, ''));
    if (!esObjeto(json))
        throw new Error('no es un objeto JSON');
    return json;
}
function escribir(ruta, obj) {
    return escribirAtomico(ruta, `${JSON.stringify(obj, null, 2)}\n`);
}
const ARREGLO_PATH = 'Pon taskctl en el PATH de tu sistema (no la carpeta de la version del plugin, que cambia con cada ' +
    'actualizacion: un envoltorio que elija la version instalada mas alta, como el de "Usar taskctl fuera ' +
    'de Claude Code" en el README del plugin), abre una terminal nueva y repite con --instalar-status-line.';
export function instalarStatusLine(configDir, o) {
    const s = sondearStatusLine(configDir);
    if (s.estado === 'nuestra')
        return { tipo: 'nada', mensaje: `ya estaba instalada en ${s.ruta} (${COMANDO_STATUS_LINE})` };
    if (s.estado === 'ilegible') {
        return {
            tipo: 'rechazado',
            mensaje: `no se instala: ${s.ruta} no se puede leer (${s.motivo})`,
            arreglo: `Corrige ${s.ruta} (JSON valido) y repite; no se ha tocado.`,
        };
    }
    if (s.estado === 'ajena' && !o.reemplazar) {
        return {
            tipo: 'rechazado',
            mensaje: `no se instala: ${s.ruta} ya tiene otra status line ("${s.comando}") y no se sustituye sin pedirlo`,
            arreglo: 'Para sustituirla (se guarda copia y desinstalar la devuelve): taskctl doctor --instalar-status-line ' +
                '--reemplazar-status-line',
        };
    }
    const t = buscarTaskctl(o.env, configDir);
    if (t.ruta === null) {
        return {
            tipo: 'rechazado',
            mensaje: t.soloEnPlugin
                ? 'no se instala: taskctl solo esta en el PATH que Claude Code da a su herramienta Bash (la carpeta del ' +
                    'plugin, que cambia con cada actualizacion), y la status line no tiene por que verlo'
                : 'no se instala: taskctl no esta en el PATH, y la status line lo ejecuta por su nombre',
            arreglo: ARREGLO_PATH,
        };
    }
    try {
        const obj = leerObjeto(s.ruta);
        const copia = copiaDeSeguridad(s.ruta, o.ahora);
        if (s.estado === 'ajena') {
            if (!escribirAtomico(path.join(configDir, FICHERO_PREVIA), `${JSON.stringify({ statusLine: obj['statusLine'] }, null, 2)}\n`)) {
                throw new Error('no se pudo guardar la status line anterior');
            }
        }
        obj['statusLine'] = { type: 'command', command: COMANDO_STATUS_LINE };
        if (!escribir(s.ruta, obj))
            throw new Error(`no se pudo escribir ${s.ruta}`);
        return {
            tipo: 'hecho',
            mensaje: `instalada en ${s.ruta} (${COMANDO_STATUS_LINE}; taskctl en ${t.ruta})` +
                (copia === null ? '' : `; copia previa en ${copia}`) +
                (s.estado === 'ajena' ? `; la anterior ("${s.comando}") vuelve al desinstalar` : '') +
                '. Se ve en la proxima sesion de Claude Code',
        };
    }
    catch (e) {
        return {
            tipo: 'rechazado',
            mensaje: `no se pudo instalar: ${e instanceof Error ? e.message : String(e)}`,
            arreglo: `Revisa que ${s.ruta} se pueda leer y escribir, y repite.`,
        };
    }
}
export function desinstalarStatusLine(configDir, ahora) {
    const s = sondearStatusLine(configDir);
    if (s.estado === 'ausente')
        return { tipo: 'nada', mensaje: `no habia ninguna status line en ${s.ruta}` };
    if (s.estado === 'ajena') {
        return { tipo: 'nada', mensaje: `la status line de ${s.ruta} no es la de taskctl ("${s.comando}"): no se toca` };
    }
    if (s.estado === 'ilegible') {
        return {
            tipo: 'rechazado',
            mensaje: `no se desinstala: ${s.ruta} no se puede leer (${s.motivo})`,
            arreglo: `Corrige ${s.ruta} (JSON valido) y repite; no se ha tocado.`,
        };
    }
    try {
        const obj = leerObjeto(s.ruta);
        const rutaPrevia = path.join(configDir, FICHERO_PREVIA);
        const previa = leerJson(rutaPrevia);
        const devuelta = previa.estado === 'ok' && esObjeto(previa.json) ? previa.json['statusLine'] : undefined;
        const copia = copiaDeSeguridad(s.ruta, ahora);
        if (devuelta === undefined || devuelta === null)
            delete obj['statusLine'];
        else
            obj['statusLine'] = devuelta;
        if (!escribir(s.ruta, obj))
            throw new Error(`no se pudo escribir ${s.ruta}`);
        if (previa.estado !== 'ausente') {
            try {
                unlinkSync(rutaPrevia);
            }
            catch {
                /* se queda: la proxima instalacion la sobrescribe */
            }
        }
        return {
            tipo: 'hecho',
            mensaje: `desinstalada de ${s.ruta}` +
                (devuelta === undefined || devuelta === null ? '' : `; vuelve la anterior ("${describir(devuelta)}")`) +
                (copia === null ? '' : `; copia previa en ${copia}`),
        };
    }
    catch (e) {
        return {
            tipo: 'rechazado',
            mensaje: `no se pudo desinstalar: ${e instanceof Error ? e.message : String(e)}`,
            arreglo: `Revisa que ${s.ruta} se pueda leer y escribir, y repite.`,
        };
    }
}
