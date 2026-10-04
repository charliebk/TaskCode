/**
 * Particion propuesta de una tarea demasiado grande — TASK-044 (auditoria
 * del 2026-10-03, C3). Modulo puro: recibe la tarea y sus secciones y
 * devuelve el texto de un fichero que `taskctl import` acepta, o null si
 * la tarea no trae frentes con los que partirla. Quien llama decide donde
 * escribirlo.
 *
 * Decisiones del plan (ver su plan-final.md):
 * - Un frente es un grupo de criterios con titulo (`###` o linea en
 *   negrita) que no sea transversal. El Objetivo no se mira: da falsos
 *   positivos (subtitulos de contexto).
 * - Los grupos transversales («Transversal», «Comunes», «General») y los
 *   criterios sueltos se copian en cada hija: «suite en verde» o
 *   «revision por pares» valen para cada una y no entregan nada solos.
 * - `### Tras el cierre` no entra como criterio (finish lo exigiria
 *   marcado); se lista en el preambulo para reponerlo a mano.
 * - Cada hija lleva Objetivo (lineas `> ` que import entiende desde
 *   TASK-044): sin el, nacerian bloqueadas por la puerta de plan.
 */
import type { Task } from './task.js';
import type { SeccionesTarea } from './tarea-body.js';
import { frentesDe, gruposComunes, MAX_CRITERIOS } from './validacion-tarea.js';

export interface PropuestaParticion {
  /** Titulos de las tareas hijas, en orden. */
  titulos: string[];
  /** Hijas que, con los criterios comunes copiados, pasan de MAX_CRITERIOS. */
  hijasGrandes: string[];
  /** Contenido del fichero para `taskctl import`. */
  markdown: string;
}

function citar(texto: string): string {
  return texto
    .split(/\r?\n/)
    .map((l) => (l.trim() === '' ? '>' : `> ${l.trimEnd()}`))
    .join('\n');
}

export function proponerParticion(task: Task, s: SeccionesTarea): PropuestaParticion | null {
  const frentes = frentesDe(s.grupos);
  if (frentes.length < 2) return null;
  const comunes = gruposComunes(s.grupos).flatMap((g) => g.criterios);

  const titulos: string[] = [];
  const hijasGrandes: string[] = [];
  const bloques: string[] = [];
  const vistos = new Set<string>();
  for (const frente of frentes) {
    let titulo = `${task.id} ${frente.titulo ?? ''}`.trim();
    // Dos grupos con el mismo titulo darian dos hijas que import rechaza
    // por duplicadas: la segunda se numera.
    for (let n = 2; vistos.has(titulo.toLowerCase()); n++) titulo = `${task.id} ${frente.titulo ?? ''} (${String(n)})`;
    vistos.add(titulo.toLowerCase());
    titulos.push(titulo);

    const criterios = [...frente.criterios, ...comunes];
    if (criterios.length > MAX_CRITERIOS) hijasGrandes.push(titulo);
    const objetivo =
      `Parte de ${task.id} (${task.titulo}): el frente «${frente.titulo ?? ''}».` +
      (s.objetivo.trim() === '' ? '' : `\n\nObjetivo de la tarea original:\n\n${s.objetivo.trim()}`);
    bloques.push(`### ${titulo}\n${citar(objetivo)}\n${criterios.map((c) => `- ${c}`).join('\n')}\n`);
  }

  const preambulo =
    `Particion propuesta de ${task.id} (${task.titulo}) por "taskctl plan": una tarea por frente.\n` +
    'Revisala antes de importarla. Los criterios comunes se han copiado en cada tarea.\n' +
    (s.criteriosTrasCierre.length === 0
      ? ''
      : 'Criterios de "Tras el cierre" que hay que reponer a mano en la tarea que corresponda: ' +
        `${s.criteriosTrasCierre.map((c) => `«${c}»`).join('; ')}.\n`);
  return { titulos, hijasGrandes, markdown: `${preambulo}\n${bloques.join('\n')}` };
}
