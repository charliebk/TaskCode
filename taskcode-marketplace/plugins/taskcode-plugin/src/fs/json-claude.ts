/**
 * Lectura de los ficheros JSON de Claude Code que miran las sondas de doctor
 * (hooks, TASK-076; version del plugin, TASK-087). Nada de aqui lanza: son
 * ficheros de terceros y un fichero roto nunca debe volverse un `error`.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type Lectura = { estado: 'ausente' } | { estado: 'ok'; json: unknown } | { estado: 'ilegible'; motivo: string };

export function leerJson(ruta: string): Lectura {
  if (!existsSync(ruta)) return { estado: 'ausente' };
  try {
    return { estado: 'ok', json: JSON.parse(readFileSync(ruta, 'utf8').replace(/^﻿/, '')) as unknown };
  } catch (e: unknown) {
    return { estado: 'ilegible', motivo: (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim() };
  }
}

export const esObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/** Misma ruta tras resolverla, sin barra final; en Windows sin distinguir mayusculas. */
export function mismaRuta(a: string, b: string): boolean {
  const n = (p: string): string => {
    const r = path.resolve(p).replace(/[\\/]+$/, '');
    return process.platform === 'win32' ? r.toLowerCase() : r;
  };
  return n(a) === n(b);
}

/**
 * La instalacion de un plugin que aplica en `repoCwd`, de las entradas de
 * `installed_plugins.json`: la de usuario o la de este proyecto.
 */
export function entradaQueAplica(entradas: unknown, repoCwd: string): Record<string, unknown> | undefined {
  if (!Array.isArray(entradas)) return undefined;
  return entradas.find(
    (e): e is Record<string, unknown> =>
      esObjeto(e) &&
      typeof e['installPath'] === 'string' &&
      (typeof e['projectPath'] !== 'string' || mismaRuta(e['projectPath'], repoCwd))
  );
}
