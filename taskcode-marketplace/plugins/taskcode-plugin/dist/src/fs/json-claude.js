/**
 * Lectura de los ficheros JSON de Claude Code que miran las sondas de doctor
 * (hooks, TASK-076; version del plugin, TASK-087). Nada de aqui lanza: son
 * ficheros de terceros y un fichero roto nunca debe volverse un `error`.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
export function leerJson(ruta) {
    if (!existsSync(ruta))
        return { estado: 'ausente' };
    try {
        return { estado: 'ok', json: JSON.parse(readFileSync(ruta, 'utf8').replace(/^﻿/, '')) };
    }
    catch (e) {
        return { estado: 'ilegible', motivo: (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim() };
    }
}
export const esObjeto = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Misma ruta tras resolverla, sin barra final; en Windows sin distinguir mayusculas. */
export function mismaRuta(a, b) {
    const n = (p) => {
        const r = path.resolve(p).replace(/[\\/]+$/, '');
        return process.platform === 'win32' ? r.toLowerCase() : r;
    };
    return n(a) === n(b);
}
/**
 * La instalacion de un plugin que aplica en `repoCwd`, de las entradas de
 * `installed_plugins.json`: la de usuario o la de este proyecto.
 */
export function entradaQueAplica(entradas, repoCwd) {
    if (!Array.isArray(entradas))
        return undefined;
    return entradas.find((e) => esObjeto(e) &&
        typeof e['installPath'] === 'string' &&
        (typeof e['projectPath'] !== 'string' || mismaRuta(e['projectPath'], repoCwd)));
}
