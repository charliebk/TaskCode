/**
 * P-1: duracion del cierre (`taskctl finish`). La fila `finish` de
 * `## Transiciones` lleva el instante de FIN del comando; esta linea de
 * `## Duracion` anota cuanto tardo (verificacion + merge) y desde cuando, para
 * que `metricas` pueda separar ese tiempo del resto.
 *
 * Puro: lee y escribe texto, no toca disco.
 */

import { instanteDe, precisionDeFecha, rangoDeSeccion } from './transiciones.js';
import { SECCION_DURACION } from './duracion-estimada.js';

export interface Cierre {
  inicio: string;
  fin: string;
  segundos: number;
}

const CIERRE_RE = /^- Cierre \(finish\): (\d+) s, de (\S+) a (\S+)$/;

function segundosEntre(inicio: string, fin: string): number {
  return Math.max(0, Math.round((instanteDe(fin) - instanteDe(inicio)) / 1000));
}

/** Linea exacta: `- Cierre (finish): <segundos> s, de <inicio> a <fin>` */
export function lineaCierre(inicio: string, fin: string): string {
  return `- Cierre (finish): ${String(segundosEntre(inicio, fin))} s, de ${inicio} a ${fin}`;
}

/**
 * Inserta o reemplaza la linea de cierre dentro de `## Duracion` (crea la
 * seccion al final del cuerpo si no existe). Idempotente. Conserva el fin de
 * linea del cuerpo. Nunca toca nada fuera de esa seccion. Sin hora en `inicio`
 * o `fin` (solo dia, o no es un instante) no hay duracion medible: el cuerpo
 * vuelve igual.
 */
export function anotarCierre(body: string, inicio: string, fin: string): string {
  if (precisionDeFecha(inicio) !== 'segundo' || precisionDeFecha(fin) !== 'segundo') return body;
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const linea = lineaCierre(inicio, fin);
  const lineas = body.split(/\r?\n/);
  const rango = rangoDeSeccion(lineas, SECCION_DURACION);

  if (rango === null) {
    const base = body.replace(/(\r?\n)*$/, '');
    return `${base}${base === '' ? '' : eol + eol}${[SECCION_DURACION, '', linea].join(eol)}${eol}`;
  }

  const [ini, limite] = rango;
  for (let i = ini + 1; i < limite; i++) {
    if (CIERRE_RE.test((lineas[i] as string).trimEnd())) {
      lineas[i] = linea;
      return lineas.join(eol);
    }
  }
  let ultima = ini;
  for (let i = ini + 1; i < limite; i++) if ((lineas[i] as string).trim() !== '') ultima = i;
  lineas.splice(ultima + 1, 0, linea);
  return lineas.join(eol);
}

/** Lee la linea de cierre de `## Duracion`; null si no hay, o si alguna fecha no es un instante valido. */
export function leerCierre(body: string): Cierre | null {
  const lineas = body.split(/\r?\n/);
  const rango = rangoDeSeccion(lineas, SECCION_DURACION);
  if (rango === null) return null;
  for (let i = rango[0] + 1; i < rango[1]; i++) {
    const m = CIERRE_RE.exec((lineas[i] as string).trimEnd());
    if (m === null) continue;
    const inicio = m[2] as string;
    const fin = m[3] as string;
    if (precisionDeFecha(inicio) !== 'segundo' || precisionDeFecha(fin) !== 'segundo') return null;
    return { inicio, fin, segundos: Number(m[1]) };
  }
  return null;
}
