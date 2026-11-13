/**
 * TASK-120: el fichero del registro de puertas (formato en
 * core/registro-puertas.ts y docs/registro-puertas.md). Vive dentro del
 * directorio de Git (`git rev-parse --git-path taskcode/puertas.log`), fuera
 * del arbol de trabajo, como el registro de Git-Flow, y vale en un worktree.
 */
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { formatearLineaPuerta, parsearRegistroPuertas } from '../core/registro-puertas.js';
/** Ruta absoluta del registro, o null si `cwd` no esta en un repo. */
export function rutaRegistroPuertas(cwd) {
    const r = spawnSync('git', ['rev-parse', '--git-path', 'taskcode/puertas.log'], {
        cwd,
        encoding: 'utf8',
        windowsHide: true,
    });
    const salida = (r.stdout ?? '').trim();
    if (r.error !== undefined || r.status !== 0 || salida === '')
        return null;
    return path.resolve(cwd, salida);
}
/** Anade una linea. Nunca lanza: un registro que no se puede escribir no tumba una transicion. */
export function anotarPuerta(cwd, linea) {
    try {
        const ruta = rutaRegistroPuertas(cwd);
        if (ruta === null)
            return;
        mkdirSync(path.dirname(ruta), { recursive: true });
        appendFileSync(ruta, `${formatearLineaPuerta(linea)}\n`, 'utf8');
    }
    catch {
        // sin registro: la transicion sigue
    }
}
/** Las lineas del registro del repo de `cwd`; vacio si no hay registro o no se puede leer. */
export function leerRegistroPuertas(cwd) {
    try {
        const ruta = rutaRegistroPuertas(cwd);
        return ruta === null ? [] : parsearRegistroPuertas(readFileSync(ruta, 'utf8'));
    }
    catch {
        return [];
    }
}
