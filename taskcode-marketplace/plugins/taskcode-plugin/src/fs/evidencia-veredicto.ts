/**
 * Comprobacion de la evidencia (fichero y linea) de un veredicto del agente
 * contra el commit analizado (TASK-067). Se lee el blob del commit, no el
 * arbol de trabajo: un fichero que solo existe sin commitear no es el codigo
 * sobre el que se juzga, y el informe describe un commit.
 */
import type { ComprobadorEvidencia } from '../core/doctor-deploy-veredictos.js';
import { gitCrudo } from './git-crudo.js';

const MAX_BYTES_FICHERO = 8 * 1024 * 1024;

/** Numero de lineas de un texto: un `\n` final no abre una linea mas. */
export function contarLineas(texto: string): number {
  if (texto === '') return 0;
  const partes = texto.split('\n');
  return texto.endsWith('\n') ? partes.length - 1 : partes.length;
}

/**
 * Comprobador para `mezclarVeredictos`: el fichero tiene que estar versionado en `commit`
 * (un blob, no una carpeta ni un enlace a otra cosa), ser de texto y tener esa linea.
 */
export function comprobadorEnCommit(raiz: string, commit: string): ComprobadorEvidencia {
  return (fichero, linea) => {
    // Normalizada con `/`; `./a` y `a` son el mismo fichero. Los `..` ya los rechazo quien llama.
    const ruta = fichero.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '');
    // El modo del arbol distingue un fichero normal de un enlace simbolico (120000) o un
    // submodulo (160000): `cat-file blob` devuelve el texto del enlace como si fuera el fichero
    // (MEN-2 de la ronda 1).
    const entrada = gitCrudo(['ls-tree', '-z', commit, '--', ruta], raiz, { timeoutMs: 15_000 });
    if (entrada.status === 0) {
      const modo = entrada.stdout.toString('utf8').split(' ')[0] ?? '';
      if (modo === '120000') return `${ruta} es un enlace simbolico en el commit analizado: cita el fichero al que apunta`;
      if (modo === '160000') return `${ruta} es un submodulo en el commit analizado: no se puede citar una linea`;
    }
    const r = gitCrudo(['cat-file', 'blob', `${commit}:${ruta}`], raiz, { timeoutMs: 15_000, maxBuffer: MAX_BYTES_FICHERO });
    if (r.error !== undefined) {
      return `no se pudo leer ${ruta} en el commit analizado (${r.error.message.split('\n')[0] ?? 'error'}): puede ser demasiado grande`;
    }
    if (r.status !== 0) return `${ruta} no es un fichero versionado en el commit analizado`;
    if (r.stdout.subarray(0, 8000).includes(0)) return `${ruta} es un fichero binario: no se puede citar una linea`;
    const total = contarLineas(r.stdout.toString('utf8'));
    if (linea > total) return `${ruta} tiene ${total} linea(s) y el veredicto cita la ${linea}`;
    return null;
  };
}
