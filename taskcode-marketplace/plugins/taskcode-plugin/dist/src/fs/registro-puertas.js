/**
 * TASK-120: el fichero del registro de puertas (formato en
 * core/registro-puertas.ts y docs/registro-puertas.md). Vive dentro del
 * directorio de Git (`git rev-parse --git-path taskcode/puertas.log`), fuera
 * del arbol de trabajo, como el registro de Git-Flow, y vale en un worktree.
 */
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { rutaGit } from './git-crudo.js';
import { formatearLineaPuerta, parsearRegistroPuertas } from '../core/registro-puertas.js';
/** Ruta absoluta del registro, o null si `cwd` no esta en un repo. */
export function rutaRegistroPuertas(cwd) {
    return rutaGit(cwd, 'taskcode/puertas.log');
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
/**
 * TASK-138b (A4): la linea de una verificacion: instante, duracion desde
 * `inicioMs` y resultado (`omitido` si salio del memo sin ejecutar; si no,
 * verde o rojo). Antes, la misma decision escrita en finish, review,
 * anotarSuite y verificar-lote.
 */
export function anotarVerificacion(cwd, o) {
    anotarPuerta(cwd, {
        puerta: o.puerta,
        tarea: o.tarea,
        instante: new Date().toISOString(),
        modo: o.modo,
        duracionS: (Date.now() - o.inicioMs) / 1000,
        resultado: o.deMemo === true ? 'omitido' : o.estado === 'verde' ? 'verde' : 'rojo',
    });
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
