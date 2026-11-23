/**
 * TASK-120: el fichero del registro de puertas (formato en
 * core/registro-puertas.ts y docs/registro-puertas.md). Vive dentro del
 * directorio de Git (`git rev-parse --git-path taskcode/puertas.log`), fuera
 * del arbol de trabajo, como el registro de Git-Flow, y vale en un worktree.
 */
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { rutaGit } from './git-crudo.js';
import { formatearLineaPuerta, parsearRegistroPuertas, type LineaPuerta } from '../core/registro-puertas.js';

/** Ruta absoluta del registro, o null si `cwd` no esta en un repo. */
export function rutaRegistroPuertas(cwd: string): string | null {
  return rutaGit(cwd, 'taskcode/puertas.log');
}

/** Anade una linea. Nunca lanza: un registro que no se puede escribir no tumba una transicion. */
export function anotarPuerta(cwd: string, linea: LineaPuerta): void {
  try {
    const ruta = rutaRegistroPuertas(cwd);
    if (ruta === null) return;
    mkdirSync(path.dirname(ruta), { recursive: true });
    appendFileSync(ruta, `${formatearLineaPuerta(linea)}\n`, 'utf8');
  } catch {
    // sin registro: la transicion sigue
  }
}

/** Las lineas del registro del repo de `cwd`; vacio si no hay registro o no se puede leer. */
export function leerRegistroPuertas(cwd: string): LineaPuerta[] {
  try {
    const ruta = rutaRegistroPuertas(cwd);
    return ruta === null ? [] : parsearRegistroPuertas(readFileSync(ruta, 'utf8'));
  } catch {
    return [];
  }
}
