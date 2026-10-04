/**
 * Lectura determinista de los ficheros de una ronda de revision —
 * TASK-040. Modulo puro: recibe texto, no toca disco.
 *
 * Reune lo que antes estaba disperso (el gate de veredicto vivia en
 * finish.ts y codex-review lo importaba de alli) y anade lo que necesita
 * la ronda incremental de `taskctl review`: que dijo la ronda anterior,
 * desde que commit se reviso y que hallazgos siguen abiertos.
 */

const PREFIJO_VEREDICTO = '- veredicto:';

/** Valor de una linea `- Veredicto:` sin enfasis de markdown, en minusculas. */
function valorDeLinea(linea: string): string {
  // TASK-036: se recorta el enfasis de markdown (`**aprobada**`,
  // `_aprobada_`, comillas invertidas) que los revisores ponen solos.
  return linea
    .trim()
    .slice(PREFIJO_VEREDICTO.length)
    .trim()
    .replace(/^[*_`]+/, '')
    .replace(/[*_`]+$/, '')
    .trim()
    .toLowerCase();
}

function lineasDeVeredicto(informe: string): string[] {
  return informe
    .split('\n')
    .filter((l) => l.trim().toLowerCase().startsWith(PREFIJO_VEREDICTO));
}

/**
 * true solo si TODAS las lineas "- Veredicto:" del informe aprueban.
 * Fail-closed de verdad (hallazgo CRITICO de revision por pares,
 * TASK-014): una version anterior buscaba "aprobada" en cualquier parte
 * y aprobaba literalmente "no aprobada".
 * - sin linea de veredicto (o sin informe), NO esta aprobada;
 * - si hay varias (p. ej. una nueva y la de la plantilla sin borrar),
 *   TODAS deben aprobar.
 * Vive aqui desde TASK-040; finish.ts lo reexporta.
 */
export function veredictoAprobado(informe: string): boolean {
  const lineas = lineasDeVeredicto(informe);
  if (lineas.length === 0) return false;
  return lineas.every((linea) => {
    const valor = valorDeLinea(linea);
    if (/\bpendiente\b/.test(valor) || valor.includes('cambios-solicitados')) return false;
    return /^aprobada\b/.test(valor);
  });
}

/**
 * Que dice un informe, para decidir si se abre otra ronda (TASK-040).
 * - `sin-linea`: no hay ninguna linea `- Veredicto:`.
 * - `pendiente`: alguna sigue en PENDIENTE (la plantilla sin tocar).
 * - `cambios-solicitados`: alguna los pide (con o sin guion: el
 *   vocabulario historico tiene «cambios solicitados»).
 * - `aprobada`: todas aprueban, segun `veredictoAprobado`.
 * - `desconocido`: cualquier otra cosa.
 */
export type VeredictoInforme = 'sin-linea' | 'pendiente' | 'cambios-solicitados' | 'aprobada' | 'desconocido';

export function veredictoDe(informe: string): VeredictoInforme {
  const lineas = lineasDeVeredicto(informe);
  if (lineas.length === 0) return 'sin-linea';
  const valores = lineas.map(valorDeLinea);
  if (valores.some((v) => /\bpendiente\b/.test(v))) return 'pendiente';
  if (valores.some((v) => /^cambios[ -]solicitados\b/.test(v))) return 'cambios-solicitados';
  if (veredictoAprobado(informe)) return 'aprobada';
  return 'desconocido';
}

/**
 * Veredicto de una RONDA, que puede tener varios informes (revision
 * fragmentada por dominio). Prioridad: si alguno no tiene veredicto o
 * esta pendiente, la ronda esta pendiente (no se abre otra con un
 * fragmento sin revisar); si alguno es desconocido, desconocido; si
 * alguno pide cambios, cambios; si todos aprueban, aprobada.
 */
export function veredictoDeRonda(informes: readonly string[]): VeredictoInforme {
  if (informes.length === 0) return 'sin-linea';
  const v = informes.map(veredictoDe);
  if (v.some((x) => x === 'sin-linea' || x === 'pendiente')) return 'pendiente';
  if (v.includes('desconocido')) return 'desconocido';
  if (v.includes('cambios-solicitados')) return 'cambios-solicitados';
  return 'aprobada';
}

/**
 * SHA del commit revisado en una peticion de revision: la linea
 * `- Commit revisado (HEAD): <sha>` que escribe solo el CLI. Se toma el
 * SHA del principio y se ignora lo que venga detras. null si no esta.
 */
export function commitRevisadoDe(peticion: string): string | null {
  const m = /^- Commit revisado(?: \(HEAD\))?:\s*([0-9a-f]{7,40})\b/im.exec(peticion);
  return m === null ? null : (m[1] as string);
}

export interface Hallazgo {
  id: string;
  severidad: string;
  estado: string;
  fichero: string;
}

export interface LecturaHallazgos {
  /** false si no hay tabla de hallazgos reconocible (informes anteriores a TASK-036). */
  tabla: boolean;
  /** Hallazgos cuyo Estado no es `corregido` ni `aceptado`. */
  abiertos: Hallazgo[];
}

function normalizarCelda(c: string): string {
  return c
    .trim()
    .replace(/^[*_`]+/, '')
    .replace(/[*_`]+$/, '')
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Hallazgos no cerrados de la primera tabla bajo `## Hallazgos` cuya
 * cabecera tenga las columnas ID y Estado (por nombre, no por
 * posicion). Cerrado = Estado `corregido` o `aceptado`; cualquier otro
 * valor, tambien el vacio, cuenta como abierto: listar de mas es barato
 * y omitir es caro. Se ignora la fila de ejemplo de la plantilla.
 */
export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
  const lineas = informe.replace(/\r/g, '').split('\n');
  const inicio = lineas.findIndex((l) => /^##\s+hallazgos\b/i.test(l.trim()));
  if (inicio === -1) return { tabla: false, abiertos: [] };
  // Se buscan tablas FUERA de los bloques de codigo: una tabla citada en
  // una reproduccion no es la de hallazgos (MEN-1 de la revision de
  // TASK-040: con una asi delante, se perdian las filas reales).
  let i = inicio + 1;
  let enBloque = false;
  for (; i < lineas.length; i++) {
    const l = (lineas[i] as string).trim();
    if (l.startsWith('```') || l.startsWith('~~~')) {
      enBloque = !enBloque;
      continue;
    }
    if (enBloque) continue;
    if (/^##\s/.test(l)) return { tabla: false, abiertos: [] };
    if (l.startsWith('|')) break;
  }
  if (i >= lineas.length) return { tabla: false, abiertos: [] };

  const celdas = (l: string): string[] =>
    l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(normalizarCelda);
  const cabecera = celdas(lineas[i] as string).map((c) => c.toLowerCase());
  const col = (nombre: string): number => cabecera.findIndex((c) => c === nombre);
  const iId = col('id');
  const iEstado = col('estado');
  if (iId === -1 || iEstado === -1) return { tabla: false, abiertos: [] };
  const iSev = col('severidad');
  const iFich = col('fichero');

  const abiertos: Hallazgo[] = [];
  for (i++; i < lineas.length; i++) {
    const l = (lineas[i] as string).trim();
    if (!l.startsWith('|')) break;
    if (/^\|[\s:|-]+\|?$/.test(l)) continue;
    const c = celdas(l);
    const id = c[iId] ?? '';
    if (id === '' || id.toLowerCase().startsWith('(ej.')) continue;
    const estado = (c[iEstado] ?? '').toLowerCase();
    if (estado === 'corregido' || estado === 'aceptado') continue;
    abiertos.push({
      id,
      severidad: iSev === -1 ? '' : (c[iSev] ?? ''),
      estado: c[iEstado] ?? '',
      fichero: iFich === -1 ? '' : (c[iFich] ?? ''),
    });
  }
  return { tabla: true, abiertos };
}
