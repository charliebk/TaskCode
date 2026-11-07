/**
 * Contexto permitido de una peticion de revision — TASK-081. Puro.
 *
 * El revisor no necesita recorrer el repo para revisar un diff: le basta el
 * enunciado y el plan de la tarea, y los ficheros que cambian en su dominio.
 * La lista orienta (no prohibe): lo que lea fuera de ella lo justifica en su
 * informe.
 */
import { EXCLUIR_HELDOUT } from './heldout.js';

export interface EntradaContexto {
  /** Carpeta de la tarea, relativa a la raiz del repo, con separadores POSIX. */
  carpetaTarea: string;
  /** Ficheros del diff que le tocan a este revisor (su dominio). */
  ficherosDelGrupo: readonly string[];
  /** Ficheros o carpetas que el proyecto declara en `contexto_revision`. */
  extra: readonly string[];
  /** Patrones `git :(glob)` excluidos de la revision (incluye los tests reservados). */
  excluir: readonly string[];
}

/** Traduce un patron `git :(glob)` a expresion regular: `*` no cruza `/`, `**` si. */
function globARegExp(patron: string): RegExp {
  let re = '';
  for (let i = 0; i < patron.length; i++) {
    const c = patron[i] as string;
    if (c === '*') {
      if (patron[i + 1] === '*') {
        const alFinal = i + 2 >= patron.length;
        const trasBarra = i === 0 || patron[i - 1] === '/';
        if (trasBarra && patron[i + 2] === '/') {
          re += '(?:.*/)?'; // `**/`: cero o mas carpetas
          i += 2;
        } else if (trasBarra && alFinal) {
          re += '.*'; // `/**`: todo lo de dentro
          i += 1;
        } else {
          re += '[^/]*';
          i += 1;
        }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

/** true si la ruta casa con alguno de los patrones. */
export function casaConAlguno(ruta: string, patrones: readonly string[]): boolean {
  return patrones.some((p) => globARegExp(p).test(ruta));
}

/**
 * Una carpeta que contiene (o es) la de tests reservados de alguna tarea:
 * `.`, `tareas`, `tareas/<estado>`, `tareas/<estado>/TASK-NNN` o su
 * `aceptacion`. `EXCLUIR_HELDOUT` solo casa con lo que ya esta DENTRO de
 * `aceptacion/`, asi que listar una carpeta padre los colaria (MEN-2, r1).
 */
function contieneHeldout(ruta: string): boolean {
  const segmentos = ruta.replace(/\/+$/, '').split('/').filter((s) => s !== '' && s !== '.');
  const molde = EXCLUIR_HELDOUT.split('/').slice(0, -1); // sin el `**` final
  if (segmentos.length > molde.length) return false;
  return segmentos.every((s, i) => globARegExp(molde[i] as string).test(s));
}

function normalizar(ruta: string): string {
  return ruta.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Rutas que el revisor puede leer sin justificarlo: `tarea.md` y
 * `planificacion/` de la carpeta de la tarea, mas los ficheros de su grupo y
 * los extra del proyecto, sin repetir y en ese orden.
 *
 * `excluir` se aplica a los ficheros del grupo y a los extra. A la carpeta de
 * la tarea solo le afectan los tests reservados: la lista por defecto excluye
 * `tareas/**` del DIFF, y eso no debe dejar al revisor sin el enunciado.
 */
export function contextoPermitido(entrada: EntradaContexto): string[] {
  const carpeta = normalizar(entrada.carpetaTarea).replace(/\/+$/, '');
  const deLaTarea = [`${carpeta}/tarea.md`, `${carpeta}/planificacion/`].filter(
    (r) => !casaConAlguno(r, [EXCLUIR_HELDOUT])
  );
  const resto = [...entrada.ficherosDelGrupo, ...entrada.extra]
    .map(normalizar)
    .filter((r) => r !== '')
    .filter((r) => !casaConAlguno(r, [...entrada.excluir, EXCLUIR_HELDOUT]))
    .filter((r) => !contieneHeldout(r));
  return [...new Set([...deLaTarea, ...resto])];
}
