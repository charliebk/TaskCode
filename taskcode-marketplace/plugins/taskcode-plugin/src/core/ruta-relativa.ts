/**
 * TASK-148b (CORE1-10 de la auditoria 4D): la unica regla de «ruta relativa a
 * la raiz del repo». Antes habia tres (config, sus patrones y los veredictos de
 * doctor-deploy), dos con el mismo nombre y reglas distintas: `a/../b` pasaba en
 * config (se normalizaba a `b`) y se rechazaba en los veredictos.
 *
 * Se queda la de config, la mas completa: la ruta se normaliza (separadores
 * POSIX, `.` y `..` resueltos) y solo se rechaza si la forma normalizada sale
 * del repo. Quien protege carpetas (config con `tareas/` y `.git/`) mira la
 * forma normalizada, asi que `docs/../tareas/02-en-curso/x` no esquiva nada.
 *
 * Devuelve el problema, no el mensaje: cada llamador lo dice con su contexto.
 */
import path from 'node:path';

export type ProblemaRuta = 'vacia' | 'control' | 'absoluta' | 'sale';

/** La ruta con `/` y normalizada (`./a/../b` -> `b`). */
export function normalizarRutaRelativa(ruta: string): string {
  return path.posix.normalize(ruta.replace(/\\/g, '/'));
}

export function problemaDeRutaRelativa(ruta: string): ProblemaRuta | null {
  if (ruta.trim() === '') return 'vacia';
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(ruta)) return 'control';
  if (ruta.startsWith('/') || ruta.startsWith('\\') || /^[A-Za-z]:/.test(ruta)) return 'absoluta';
  const normalizada = normalizarRutaRelativa(ruta);
  if (normalizada === '..' || normalizada.startsWith('../')) return 'sale';
  return null;
}
