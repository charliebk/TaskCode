/**
 * Comparacion estructural de dos ROADMAP (TASK-098), pura.
 *
 * Es la comprobacion previa a migrar un proyecto que ya tiene su propio
 * ROADMAP: no compara bytes (la cabecera y los textos de cada generador
 * difieren a proposito) sino lo que importa — que tareas salen, en que
 * hito, de que dependen, en que estado, los titulos de los hitos y la
 * zona manual.
 *
 * El extractor es tolerante: lee las filas `| Paso | TASK-NNN | ... |`
 * bajo un `## Hn` fuera de la zona manual. Lo que parece una fila de
 * tarea y no casa con ese formato se declara "no comparable" en vez de
 * ignorarlo en silencio. Cualquier otro texto del actual fuera de la zona
 * manual que el generado no lleve se lista como "se perderia" (H1 de la
 * revision: antes un parrafo o una seccion propia se borraba en silencio
 * con `--escribir`).
 */
import { CABECERA_TABLA_HITO, extraerZonaManual, normalizarFinales } from './roadmap.js';

export interface FilaRoadmap {
  hito: number;
  titulo: string;
  complejidad: string;
  dependencias: string[];
  estado: string;
}

export interface EstructuraRoadmap {
  tareas: Map<string, FilaRoadmap>;
  /** Numero de hito -> titulo de su `## Hn — titulo`. */
  hitos: Map<number, string>;
  zonaManual: string | null;
  /** Lineas que parecen filas de tarea pero no se han podido leer. */
  noComparables: string[];
  /** Filas de una tarea que ya habia salido antes (solo cuenta la primera). */
  duplicadas: string[];
  /**
   * Lineas no vacias fuera de la zona manual que no son estructura leida
   * (filas de tarea, encabezados `## Hn`, cabecera y separador de sus
   * tablas, comentarios HTML de una linea ni los resumenes que el generador
   * recalcula). Si el generado no las lleva, migrar las pierde.
   */
  textoPropio: string[];
}

/** Separador de cabecera de una tabla Markdown (`|---|:--:|...`). */
const SEPARADOR_RE = /^\|(?:\s*:?-+:?\s*\|)+$/;

/** Lineas que el generador recalcula siempre: no son contenido propio. */
const DERIVADA_RE = /^(?:\d+ de \d+ terminadas\.|- \*\*(?:En marcha|Listas para empezar):\*\* .*)$/;

/** Separa las celdas de una fila de tabla Markdown respetando los `\|` escapados. */
function celdas(linea: string): string[] {
  const cuerpo = linea.trim().replace(/^\|/, '').replace(/\|$/, '');
  const out: string[] = [];
  let actual = '';
  for (let i = 0; i < cuerpo.length; i++) {
    const c = cuerpo[i];
    if (c === '\\' && cuerpo[i + 1] === '|') {
      actual += '|';
      i++;
    } else if (c === '|') {
      out.push(actual.trim());
      actual = '';
    } else {
      actual += c;
    }
  }
  out.push(actual.trim());
  return out;
}

function listaDeps(celda: string): string[] {
  return celda
    .split(',')
    .map((d) => d.trim())
    .filter((d) => d !== '' && d !== '—' && d !== '-');
}

/** Extrae la estructura de un ROADMAP. Lanza solo si la zona manual esta rota. */
export function extraerEstructura(texto: string): EstructuraRoadmap {
  const lf = normalizarFinales(texto);
  const zonaManual = extraerZonaManual(lf);
  const fuera = zonaManual === null ? lf : lf.replace(zonaManual, '');
  const tareas = new Map<string, FilaRoadmap>();
  const hitos = new Map<number, string>();
  const noComparables: string[] = [];
  const duplicadas: string[] = [];
  const textoPropio: string[] = [];
  let hito: number | null = null;
  for (const linea of fuera.split('\n')) {
    const h = /^## H(\d+)(?:\s+—\s+(.*))?\s*$/.exec(linea);
    if (h !== null) {
      hito = Number(h[1]);
      hitos.set(hito, (h[2] ?? '').trim());
      continue;
    }
    const recortada = linea.trim();
    if (/^#{1,2} /.test(linea)) {
      hito = null;
      textoPropio.push(recortada);
      continue;
    }
    if (!recortada.startsWith('|') || !/TASK-\d+/.test(linea)) {
      // Solo la cabecera de la tabla del generador y los separadores; una
      // fila propia dentro de un hito si se lista (MEN-2 de la ronda 2).
      const cabeceraDeTabla = hito !== null && (recortada === CABECERA_TABLA_HITO || SEPARADOR_RE.test(recortada));
      if (recortada !== '' && !cabeceraDeTabla && !/^<!--.*-->$/.test(recortada) && !DERIVADA_RE.test(recortada)) {
        textoPropio.push(recortada);
      }
      continue;
    }
    const cs = celdas(linea);
    const id = cs[1] ?? '';
    if (hito === null || cs.length !== 6 || !/^TASK-\d+[a-z]?$/.test(id)) {
      noComparables.push(linea);
      continue;
    }
    if (tareas.has(id)) {
      duplicadas.push(linea);
      continue;
    }
    tareas.set(id, {
      hito,
      titulo: cs[2] ?? '',
      complejidad: cs[3] ?? '',
      dependencias: listaDeps(cs[4] ?? ''),
      estado: cs[5] ?? '',
    });
  }
  return { tareas, hitos, zonaManual, noComparables, duplicadas, textoPropio };
}

function numero(id: string): number {
  // TASK-121: la letra de una parte ordena dentro de su numero (TASK-121a < TASK-121b < TASK-122).
  const m = /(\d+)([a-z]?)$/.exec(id);
  if (m === null) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * 100 + (m[2] === '' ? 0 : (m[2] as string).charCodeAt(0) - 96);
}

function mismaLista(a: readonly string[], b: readonly string[]): boolean {
  const x = [...new Set(a)].sort();
  const y = [...new Set(b)].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

/**
 * Diferencias entre el ROADMAP actual y el que generaria taskctl, una
 * por linea y en orden estable. Vacio = nada que perder al migrar.
 */
export function compararRoadmaps(actual: string, generado: string): string[] {
  const a = extraerEstructura(actual);
  const g = extraerEstructura(generado);
  const difs: string[] = [];

  if (a.zonaManual === null && g.zonaManual !== null) {
    difs.push(
      'zona manual: el ROADMAP actual no tiene (falta "<!-- manual:inicio ... -->" ... "<!-- manual:fin -->"); ' +
        'el generado anade una por defecto. Pon en ella un "### Hn — titulo" por hito antes de migrar.'
    );
  } else if (a.zonaManual !== null && a.zonaManual !== g.zonaManual) {
    difs.push('zona manual: el texto entre las marcas no coincide con el que se conservaria.');
  }

  const hitos = [...new Set([...a.hitos.keys(), ...g.hitos.keys()])].sort((x, y) => x - y);
  for (const h of hitos) {
    const ta = a.hitos.get(h);
    const tg = g.hitos.get(h);
    if (ta === undefined) difs.push(`hito H${h}: solo en el generado ("${tg}").`);
    else if (tg === undefined) difs.push(`hito H${h}: solo en el actual ("${ta}").`);
    else if (ta !== tg) difs.push(`hito H${h}: titulo "${ta}" en el actual y "${tg}" en el generado.`);
  }

  const ids = [...new Set([...a.tareas.keys(), ...g.tareas.keys()])].sort((x, y) => numero(x) - numero(y));
  for (const id of ids) {
    const fa = a.tareas.get(id);
    const fg = g.tareas.get(id);
    if (fa === undefined) {
      difs.push(`${id}: solo en el generado (H${fg!.hito}).`);
      continue;
    }
    if (fg === undefined) {
      difs.push(`${id}: solo en el actual (H${fa.hito}).`);
      continue;
    }
    if (fa.hito !== fg.hito) difs.push(`${id}: hito H${fa.hito} en el actual y H${fg.hito} en el generado.`);
    if (fa.titulo !== fg.titulo) difs.push(`${id}: titulo "${fa.titulo}" en el actual y "${fg.titulo}" en el generado.`);
    if (fa.complejidad !== fg.complejidad) {
      difs.push(`${id}: complejidad "${fa.complejidad}" en el actual y "${fg.complejidad}" en el generado.`);
    }
    if (!mismaLista(fa.dependencias, fg.dependencias)) {
      const fmt = (l: readonly string[]): string => (l.length === 0 ? '—' : l.join(', '));
      difs.push(
        `${id}: depende de ${fmt(fa.dependencias)} en el actual y de ${fmt(fg.dependencias)} en el generado.`
      );
    }
    if (fa.estado !== fg.estado) {
      difs.push(`${id}: estado "${fa.estado}" en el actual y "${fg.estado}" en el generado.`);
    }
  }

  for (const l of a.noComparables) difs.push(`fila no comparable en el actual: ${l.trim()}`);
  for (const l of a.duplicadas) difs.push(`fila duplicada en el actual (solo cuenta la primera): ${l.trim()}`);
  const delGenerado = new Set(normalizarFinales(generado).split('\n').map((l) => l.trim()));
  for (const l of a.textoPropio) {
    if (!delGenerado.has(l)) difs.push(`texto fuera de la zona manual que se perderia: ${l}`);
  }
  return difs;
}
