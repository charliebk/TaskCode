/**
 * TASK-117: complejidad propuesta para una tarea nueva a partir de las tareas
 * terminadas que mas se le parecen. Puro, sin disco: `new` le pasa las
 * terminadas ya leidas.
 *
 * La complejidad declarada decide cuantos roles de diseno se lanzan, pero hay
 * proyectos que no la declaran nunca y otros donde no predice el coste. Esto no
 * la calcula de la nada: propone la que ya se uso en las tareas cerradas que
 * comparten mas etiquetas con la nueva, y dice de cuales sale.
 */
import { TASK_COMPLEXITIES, type TaskComplexity } from './task.js';

/** Lo minimo de una tarea terminada que hace falta para comparar. */
export interface TareaComparable {
  id: string;
  etiquetas: readonly string[];
  complejidad: TaskComplexity | null;
}

export interface ComplejidadPropuesta {
  valor: TaskComplexity;
  /** IDs de las tareas de las que sale, ordenados. */
  desde: string[];
  /** Cuantas etiquetas comparten con la nueva. */
  enComun: number;
}

/**
 * La mediana de las complejidades de las terminadas que comparten MAS
 * etiquetas con la nueva (al menos una), en el orden trivial < simple < media
 * < alta < critica. Con un numero par de parecidas, la inferior de las dos
 * centrales: la mas barata (la heuristica del plan puede subirla). null sin
 * etiquetas, sin terminadas con complejidad declarada o sin ninguna en comun.
 */
export function proponerComplejidad(
  etiquetas: readonly string[],
  terminadas: readonly TareaComparable[]
): ComplejidadPropuesta | null {
  const propias = new Set(etiquetas.map((e) => e.toLowerCase()));
  if (propias.size === 0) return null;
  let max = 0;
  let parecidas: TareaComparable[] = [];
  for (const t of terminadas) {
    if (t.complejidad === null) continue;
    const comunes = new Set(t.etiquetas.map((e) => e.toLowerCase()).filter((e) => propias.has(e))).size;
    if (comunes === 0 || comunes < max) continue;
    if (comunes > max) {
      max = comunes;
      parecidas = [];
    }
    parecidas.push(t);
  }
  if (parecidas.length === 0) return null;
  const orden = (c: TaskComplexity): number => TASK_COMPLEXITIES.indexOf(c);
  const valores = parecidas.map((t) => t.complejidad as TaskComplexity).sort((a, b) => orden(a) - orden(b));
  const valor = valores[Math.floor((valores.length - 1) / 2)] as TaskComplexity;
  return { valor, desde: parecidas.map((t) => t.id).sort(), enComun: max };
}
