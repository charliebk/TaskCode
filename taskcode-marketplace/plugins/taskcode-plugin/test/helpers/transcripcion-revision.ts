/**
 * TASK-081: transcripciones de subagentes REVISORES (`agent-<id>.jsonl`) con la
 * forma de Claude Code: el primer mensaje `user` es el prompt con la ruta de la
 * peticion, y despues vienen `N` lecturas con su `usage`. Fixture NUEVO: no
 * toca `TRANSCRIPCION_EJEMPLO`.
 */
import { herramienta, mensaje, uso } from './transcripcion-ejemplo.js';

/** Linea `user` con el contenido como string (lo que escribe Claude Code hoy). */
export function usuarioTexto(prompt: string): string {
  return JSON.stringify({ type: 'user', message: { role: 'user', content: prompt } });
}

/** Linea `user` con el contenido como bloques de texto. */
export function usuarioBloques(...textos: string[]): string {
  return JSON.stringify({
    type: 'user',
    message: { role: 'user', content: textos.map((text) => ({ type: 'text', text })) },
  });
}

/** Prompt de un revisor que lleva la ruta de su peticion, como exige skills/review. */
export function promptDeRevision(peticion: string): string {
  return `Revisa la tarea TASK-001 con tu skill. Tu peticion esta en tareas/02-en-curso/TASK-001/revision/${peticion}. Escribe tu informe.`;
}

/** Cada lectura cuesta 10 de entrada, 10 de escritura de cache, 100 de lectura de cache y 5 de salida. */
export const COSTE_POR_LECTURA = { entrada: 10, cacheEscritura: 10, cacheLectura: 100, salida: 5, total: 125 } as const;

/** Transcripcion de un revisor: su prompt (o ninguno, con null) y `lecturas` llamadas a `Read`. */
export function transcripcionRevisor(prompt: string | null, lecturas: number): string[] {
  const lineas: string[] = prompt === null ? [] : [usuarioTexto(prompt)];
  for (let i = 1; i <= lecturas; i++) {
    const n = String(i);
    lineas.push(mensaje(`m${n}`, [herramienta(`t${n}`, 'Read', { file_path: `f${n}.ts` })], uso(10, 5)));
  }
  return lineas;
}
