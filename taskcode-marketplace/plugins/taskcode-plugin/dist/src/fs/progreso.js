/**
 * Lectura y escritura del progreso visible (TASK-110). El fichero vive en
 * `<git-dir>/taskcode/progreso.json`, FUERA del arbol de trabajo: dentro
 * cambiaria la huella de la verificacion (`huellaDelArbol`) y `review`
 * abortaria por `cambioElArbol`.
 *
 * SIN GIT: la ruta se resuelve subiendo desde el directorio hasta encontrar
 * `.git`; si es un fichero (worktree enlazado, submodulo) se sigue su linea
 * `gitdir:`. La usan quien escribe y quien lee: si uno resolviera con
 * `git rev-parse` y el otro a mano, en un worktree acabarian en sitios
 * distintos y `estado` diria "nada en marcha" con la verificacion corriendo.
 * Coincide con `git rev-parse --git-path taskcode/...`, que es por worktree.
 *
 * NUNCA LANZA NI IMPRIME: escribir el progreso es cosmetico y va dentro del
 * camino critico de finish, review y el freno Stop. Un EPERM/EBUSY del rename
 * en Windows (la status line leyendo, un antivirus) pierde ese tic y nada
 * mas: sin reintentos, sin excepcion, sin salida (lo que se imprime lo lee el
 * agente y cuesta tokens).
 */
import { closeSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { VERSION_PROGRESO, parsearContador, validarProgreso, } from '../core/progreso.js';
/** Variable de entorno con la ruta del contador que recibe el comando de verificacion. Nombre neutro: la leen proyectos ajenos. */
export const VARIABLE_PROGRESO = 'TASKCTL_PROGRESO';
const FICHERO_PROGRESO = 'progreso.json';
const FICHERO_CONTADOR = 'progreso-contador';
/** Lo que se lee, como mucho, del final del contador: lo escribe un script ajeno. */
const BYTES_CONTADOR = 4096;
/** El `.git` mas cercano subiendo desde `desde`, sin lanzar git. null fuera de un repo. */
export function ubicarGit(desde) {
    let dir = path.resolve(desde);
    for (;;) {
        const candidato = path.join(dir, '.git');
        let esDir = false;
        let esFichero = false;
        try {
            const st = statSync(candidato);
            esDir = st.isDirectory();
            esFichero = st.isFile();
        }
        catch {
            /* no esta aqui: se sube */
        }
        if (esDir)
            return { raiz: dir, gitDir: candidato };
        if (esFichero) {
            try {
                const m = /^gitdir:\s*(.+?)\s*$/m.exec(readFileSync(candidato, 'utf8'));
                return m?.[1] === undefined ? null : { raiz: dir, gitDir: path.resolve(dir, m[1]) };
            }
            catch {
                return null;
            }
        }
        const padre = path.dirname(dir);
        if (padre === dir)
            return null;
        dir = padre;
    }
}
/** `<git-dir>/taskcode`, o null fuera de un repo. */
export function dirProgreso(desde) {
    const g = ubicarGit(desde);
    return g === null ? null : path.join(g.gitDir, 'taskcode');
}
export function rutaProgreso(desde) {
    const d = dirProgreso(desde);
    return d === null ? null : path.join(d, FICHERO_PROGRESO);
}
export function rutaContador(desde) {
    const d = dirProgreso(desde);
    return d === null ? null : path.join(d, FICHERO_CONTADOR);
}
/** El progreso guardado, o null si no hay (o no es legible: se trata como ausente). */
export function leerProgreso(desde) {
    const ruta = rutaProgreso(desde);
    if (ruta === null)
        return null;
    try {
        return validarProgreso(JSON.parse(readFileSync(ruta, 'utf8')));
    }
    catch {
        return null;
    }
}
/** El x/N del contador, leyendo como mucho sus ultimos 4 KB. null si no hay o no dice nada util. */
export function leerContador(desde) {
    const ruta = rutaContador(desde);
    if (ruta === null)
        return null;
    let fd = null;
    try {
        fd = openSync(ruta, 'r');
        const tam = fstatSync(fd).size;
        const n = Math.min(tam, BYTES_CONTADOR);
        const buf = Buffer.alloc(n);
        readSync(fd, buf, 0, n, tam - n);
        return parsearContador(buf.toString('utf8'));
    }
    catch {
        return null;
    }
    finally {
        if (fd !== null) {
            try {
                closeSync(fd);
            }
            catch {
                /* nada */
            }
        }
    }
}
/** Escribe con tmp+rename. Nunca lanza: devuelve false si no pudo. */
export function escribirAtomico(ruta, texto) {
    const tmp = `${ruta}.${String(process.pid)}.tmp`;
    try {
        mkdirSync(path.dirname(ruta), { recursive: true });
        writeFileSync(tmp, texto, 'utf8');
        renameSync(tmp, ruta);
        return true;
    }
    catch {
        try {
            unlinkSync(tmp);
        }
        catch {
            /* nada */
        }
        return false;
    }
}
/** El que no hace nada. */
export const SIN_PROGRESO = Object.freeze({
    fase: () => undefined,
    paso: () => undefined,
    contador: () => null,
    terminar: () => undefined,
});
/** El escritor real, sobre el repo que contiene `desde`. Fuera de un repo, no hace nada. */
export function crearProgreso(desde, opciones = {}) {
    const ruta = rutaProgreso(desde);
    const rutaCont = rutaContador(desde);
    if (ruta === null || rutaCont === null)
        return SIN_PROGRESO;
    const reloj = opciones.reloj ?? Date.now;
    let estado = null;
    const guardar = () => {
        if (estado !== null)
            escribirAtomico(ruta, `${JSON.stringify(estado)}\n`);
    };
    return {
        fase(tarea, fase, pasos, extra = {}) {
            estado = {
                version: VERSION_PROGRESO,
                tarea,
                fase,
                pasos: [...pasos],
                paso: null,
                ronda: extra.ronda ?? null,
                inicio: reloj(),
                contador: false,
                terminado: false,
                resultado: null,
                fin: null,
            };
            guardar();
        },
        paso(nombre, extra = {}) {
            if (estado === null)
                return;
            estado = { ...estado, paso: nombre, contador: false, ...(extra.ronda === undefined ? {} : { ronda: extra.ronda }) };
            guardar();
        },
        contador() {
            if (estado === null)
                return null;
            // Vacio antes de lanzar el comando: un x/N de la ejecucion anterior no se muestra.
            if (!escribirAtomico(rutaCont, ''))
                return null;
            estado = { ...estado, contador: true };
            guardar();
            return rutaCont;
        },
        terminar(resultado) {
            if (estado === null || estado.terminado)
                return;
            estado = { ...estado, contador: false, terminado: true, resultado, fin: reloj() };
            guardar();
        },
    };
}
/**
 * Ejecuta `fn` y marca el final de la fase pase lo que pase: `ok` si termina,
 * `abortada` si lanza (y relanza). Lo que no cubre es la muerte del proceso.
 */
export async function conProgreso(progreso, fn) {
    try {
        const r = await fn();
        progreso.terminar('ok');
        return r;
    }
    catch (e) {
        progreso.terminar('abortada');
        throw e;
    }
}
/**
 * El entorno del comando de verificacion: el de `base` sin ningun
 * TASKCTL_PROGRESO heredado y, si hay contador, con el suyo. Solo ese comando
 * lo recibe.
 */
export function entornoConContador(base, rutaCont) {
    const env = { ...base };
    delete env[VARIABLE_PROGRESO];
    if (rutaCont !== null)
        env[VARIABLE_PROGRESO] = rutaCont;
    return env;
}
