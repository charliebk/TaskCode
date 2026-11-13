/**
 * TASK-120: formato comun del registro de puertas de verificacion. Puro, sin
 * disco. Una linea por ejecucion de una puerta (la sincronizacion, y despues el
 * freno Stop de TASK-111 y las verificaciones de review y finish de TASK-128),
 * con seis campos separados por un tabulador:
 *
 *   puerta  tarea  instante  modo  duracion_s  resultado
 *
 * - puerta: que se ejecuto (`sincronizacion`, ...). Quien lee ignora las que no
 *   conoce.
 * - tarea: el ID (`TASK-123`, `TASK-123a`) o `-` si no hay tarea.
 * - instante: ISO 8601 en UTC del final de la ejecucion.
 * - modo: el contexto de la puerta (para la sincronizacion, la fase de taskctl).
 * - duracion_s: segundos, con un decimal.
 * - resultado: el desenlace, en una palabra o con guiones.
 *
 * El formato y su sitio (`.git/taskcode/puertas.log`) estan en
 * docs/registro-puertas.md.
 */

export interface LineaPuerta {
  puerta: string;
  tarea: string;
  instante: string;
  modo: string;
  duracionS: number;
  resultado: string;
}

/** Un campo no puede llevar tabuladores ni saltos de linea: se cambian por espacios. */
function campo(v: string): string {
  const limpio = v.replace(/[\t\r\n]+/g, ' ').trim();
  return limpio === '' ? '-' : limpio;
}

export function formatearLineaPuerta(l: LineaPuerta): string {
  const duracion = Number.isFinite(l.duracionS) && l.duracionS >= 0 ? l.duracionS.toFixed(1) : '0.0';
  return [campo(l.puerta), campo(l.tarea), campo(l.instante), campo(l.modo), duracion, campo(l.resultado)].join('\t');
}

/** Las lineas bien formadas del registro; el resto (vacias, rotas, de otro formato) se ignoran. */
export function parsearRegistroPuertas(texto: string): LineaPuerta[] {
  const lineas: LineaPuerta[] = [];
  for (const cruda of texto.split(/\r?\n/)) {
    const c = cruda.split('\t');
    if (c.length !== 6) continue;
    const duracionS = Number(c[4]);
    if (!/^\d+(\.\d+)?$/.test(c[4] as string) || !Number.isFinite(duracionS)) continue;
    lineas.push({
      puerta: c[0] as string,
      tarea: c[1] as string,
      instante: c[2] as string,
      modo: c[3] as string,
      duracionS,
      resultado: c[5] as string,
    });
  }
  return lineas;
}

/** Segundos totales de `puerta` por tarea (las lineas de otras puertas no cuentan). */
export function sumarPorTarea(lineas: readonly LineaPuerta[], puerta: string): Map<string, number> {
  const suma = new Map<string, number>();
  for (const l of lineas) {
    if (l.puerta !== puerta) continue;
    suma.set(l.tarea, (suma.get(l.tarea) ?? 0) + l.duracionS);
  }
  return suma;
}

/** El ID de tarea de un mensaje de commit (`chore(TASK-123): ...`), o null. */
export function tareaDeMensaje(mensaje: string): string | null {
  const m = /\bTASK-\d+[a-z]?\b/.exec(mensaje);
  return m === null ? null : m[0];
}

/**
 * TASK-111: la puerta del freno Stop. `modo` es el tipo de verificacion
 * (`completa`, `selectiva`, `documentacion`) y `resultado` uno de estos:
 * `verde` (ejecuto en verde), `rojo` (cualquier otro desenlace: bloquea),
 * `omitido` (no ejecuto: sin cambios desde el ultimo verde) y `excedido`
 * (agoto su presupuesto de tiempo; lo escribe el presupuesto del freno).
 */
export const PUERTA_FRENO = 'freno';
export const RESULTADOS_FRENO = Object.freeze(['verde', 'rojo', 'omitido', 'excedido'] as const);
export type ResultadoFreno = (typeof RESULTADOS_FRENO)[number];

export interface ResumenFreno {
  /** Veces que el freno ejecuto de verdad la verificacion (las `omitido` no cuentan). */
  ejecuciones: number;
  /** Segundos de todas sus lineas. */
  duracionS: number;
}

/** Por tarea: cuantas veces corrio el freno y cuanto sumo. Ignora las demas puertas. */
export function resumirFreno(lineas: readonly LineaPuerta[]): Map<string, ResumenFreno> {
  const resumen = new Map<string, ResumenFreno>();
  for (const l of lineas) {
    if (l.puerta !== PUERTA_FRENO) continue;
    const r = resumen.get(l.tarea) ?? { ejecuciones: 0, duracionS: 0 };
    if (l.resultado !== 'omitido') r.ejecuciones += 1;
    r.duracionS += l.duracionS;
    resumen.set(l.tarea, r);
  }
  return resumen;
}
