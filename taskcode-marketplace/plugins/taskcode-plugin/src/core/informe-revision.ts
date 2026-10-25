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

/**
 * De donde viene un hallazgo (TASK-063), segun la columna `Origen` que
 * rellena el revisor: el codigo no hace lo que se pedia (`implementacion`),
 * el plan era ambiguo o equivocado y el codigo lo siguio (`plan`), o el
 * enunciado o sus criterios fallaban (`especificacion`). Vocabulario
 * cerrado; cualquier otro valor, la celda vacia o la columna ausente
 * (informes anteriores) es `sin clasificar`.
 */
export const ORIGENES_HALLAZGO = ['implementacion', 'plan', 'especificacion'] as const;
export type OrigenHallazgo = (typeof ORIGENES_HALLAZGO)[number] | 'sin clasificar';

/**
 * Vocabulario cerrado de severidades (TASK-064). La celda se reconoce sin
 * distinguir mayusculas, tildes ni enfasis (`Importante`, `**CRÍTICO**`,
 * `menor`); cualquier otro valor (`Alta`, `Major`, vacio) no es una
 * severidad reconocida y quien cuenta debe decirlo, no descartarlo.
 */
export const SEVERIDADES_HALLAZGO = ['CRITICO', 'IMPORTANTE', 'MENOR'] as const;
export type SeveridadHallazgo = (typeof SEVERIDADES_HALLAZGO)[number];

export interface HallazgoLeido extends Hallazgo {
  origen: OrigenHallazgo;
  /** La severidad dentro del vocabulario; null si la celda no es ninguna de las tres. */
  severidadReconocida: SeveridadHallazgo | null;
}

export interface LecturaTodosHallazgos {
  /** false si no hay tabla de hallazgos reconocible (informes anteriores a TASK-036). */
  tabla: boolean;
  /** Todas las filas de la tabla, abiertas o cerradas, en orden. */
  hallazgos: HallazgoLeido[];
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

/** Origen normalizado: minusculas, sin tildes ni enfasis; fuera del vocabulario, `sin clasificar`. */
function origenDe(celda: string): OrigenHallazgo {
  const valor = celda.toLowerCase();
  return (ORIGENES_HALLAZGO as readonly string[]).includes(valor) ? (valor as OrigenHallazgo) : 'sin clasificar';
}

/**
 * Severidad por la PRIMERA PALABRA de la celda, sin distinguir mayusculas,
 * tildes ni enfasis: `IMPORTANTE (no verificado por ejecucion)` o
 * `**Menor** (ronda 1)` se reconocen (los revisores anotan detras). null si
 * esa primera palabra no es del vocabulario (`Alta`, `Major`, `—`, vacia).
 */
export function severidadDe(celda: string): SeveridadHallazgo | null {
  const primera = (normalizarCelda(celda).split(/[\s(),;:]+/)[0] ?? '').replace(/^[*_`]+|[*_`]+$/g, '');
  const valor = primera.toUpperCase();
  return (SEVERIDADES_HALLAZGO as readonly string[]).includes(valor) ? (valor as SeveridadHallazgo) : null;
}

const SOLO_GUION_RE = /^[-—–]*$/;

/**
 * La fila-marcador «sin hallazgos» que la plantilla admite
 * (`| (ninguno) | — | sin hallazgos | — |` y variantes): ID `(ninguno)`,
 * Estado `sin hallazgos`, o ID y severidad en blanco o con un guion. No es
 * un hallazgo (IMP-1 de la revision de TASK-064).
 */
function esMarcadorSinHallazgos(id: string, severidad: string, estado: string): boolean {
  if (/^\(?ninguno\)?$/i.test(id)) return true;
  if (estado.toLowerCase() === 'sin hallazgos') return true;
  return SOLO_GUION_RE.test(id) && SOLO_GUION_RE.test(severidad);
}

/**
 * Todas las filas de la primera tabla bajo `## Hallazgos` cuya cabecera
 * tenga las columnas ID y Estado (por nombre, no por posicion), con su
 * severidad y su origen (TASK-063). Es el unico parser de la tabla:
 * `hallazgosNoCerrados` filtra sobre el. Se ignora la fila de ejemplo de la
 * plantilla y las tablas citadas dentro de bloques de codigo.
 */
export function leerHallazgos(informe: string): LecturaTodosHallazgos {
  const lineas = informe.replace(/\r/g, '').split('\n');
  const inicio = lineas.findIndex((l) => /^##\s+hallazgos\b/i.test(l.trim()));
  if (inicio === -1) return { tabla: false, hallazgos: [] };
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
    if (/^##\s/.test(l)) return { tabla: false, hallazgos: [] };
    if (l.startsWith('|')) break;
  }
  if (i >= lineas.length) return { tabla: false, hallazgos: [] };

  const celdas = (l: string): string[] =>
    l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(normalizarCelda);
  const cabecera = celdas(lineas[i] as string).map((c) => c.toLowerCase());
  const col = (nombre: string): number => cabecera.findIndex((c) => c === nombre);
  const iId = col('id');
  const iEstado = col('estado');
  if (iId === -1 || iEstado === -1) return { tabla: false, hallazgos: [] };
  const iSev = col('severidad');
  const iFich = col('fichero');
  // `Origen`, o `Origen (implementacion / plan / especificacion)` si el
  // revisor copia la aclaracion a la cabecera.
  const iOrigen = cabecera.findIndex((c) => c === 'origen' || c.startsWith('origen '));

  const hallazgos: HallazgoLeido[] = [];
  for (i++; i < lineas.length; i++) {
    const l = (lineas[i] as string).trim();
    if (!l.startsWith('|')) break;
    if (/^\|[\s:|-]+\|?$/.test(l)) continue;
    const c = celdas(l);
    const id = c[iId] ?? '';
    if (id === '' || id.toLowerCase().startsWith('(ej.')) continue;
    const severidad = iSev === -1 ? '' : (c[iSev] ?? '');
    if (esMarcadorSinHallazgos(id, severidad, c[iEstado] ?? '')) continue;
    hallazgos.push({
      id,
      severidad,
      severidadReconocida: severidadDe(severidad),
      estado: c[iEstado] ?? '',
      fichero: iFich === -1 ? '' : (c[iFich] ?? ''),
      origen: iOrigen === -1 ? 'sin clasificar' : origenDe(c[iOrigen] ?? ''),
    });
  }
  return { tabla: true, hallazgos };
}

/**
 * Hallazgos no cerrados de la tabla de `leerHallazgos`. Cerrado = Estado
 * `corregido` o `aceptado`; cualquier otro valor, tambien el vacio, cuenta
 * como abierto: listar de mas es barato y omitir es caro.
 */
export function hallazgosNoCerrados(informe: string): LecturaHallazgos {
  const { tabla, hallazgos } = leerHallazgos(informe);
  const abiertos = hallazgos
    .filter((h) => {
      const estado = h.estado.toLowerCase();
      return estado !== 'corregido' && estado !== 'aceptado';
    })
    .map(({ id, severidad, estado, fichero }) => ({ id, severidad, estado, fichero }));
  return { tabla, abiertos };
}

// --- Hallazgos de una tarea, para las metricas (TASK-064) --------------------

/** Un informe de revision ya leido, con la ronda y el revisor que da su nombre. */
export interface InformeLeido {
  /** Nombre del fichero dentro de `revision/` (para los avisos). */
  fichero: string;
  ronda: number;
  /** Sufijo de `informe-revision-N-<revisor>.md`; '' en un informe sin fragmentar. */
  revisor: string;
  texto: string;
}

export type ConteoSeveridad = Record<SeveridadHallazgo, number> & { desconocida: number };
export type ConteoOrigen = Record<OrigenHallazgo, number>;

export interface SeveridadDesconocida {
  fichero: string;
  id: string;
  /** La celda tal cual se leyo (sin enfasis ni tildes); '' si estaba vacia o no hay columna. */
  valor: string;
}

/**
 * Hallazgos de una tarea sumando todas sus rondas.
 *
 * REGLA (decision de Carlos, 2026-10-25): cada hallazgo cuenta UNA vez por
 * tarea, con clave revisor + ID (el ID sin distinguir mayusculas). Un
 * hallazgo que reaparece en la ronda 2 con estado `corregido` no suma otra
 * vez. Su severidad y su origen se fusionan CAMPO A CAMPO: cada uno es el de
 * la ultima ronda en que ese campo esta reconocido (una ronda 2 con
 * `IMPORTANTE (ronda 1)` sin Origen no borra el `plan` de la ronda 1); solo
 * si ninguna ronda lo reconoce queda `desconocida` / `sin clasificar`.
 *
 * El revisor sale del sufijo del fichero ('' sin sufijo), asi que el mismo ID
 * en `informe-revision-1.md` y en `informe-revision-2-<revisor>.md` (una
 * ronda sin fragmentar y otra fragmentada) cuenta como DOS hallazgos: no hay
 * forma de saber que el revisor sin sufijo era el mismo (MEN-3 de la
 * revision de TASK-064, consecuencia aceptada de la regla).
 *
 * QUE SIGNIFICA CADA null (para quien agregue despues):
 *  - `porSeveridad`/`porOrigen` null con `informes === 0`: la tarea no tiene
 *    informes de revision (no se reviso, o es anterior a `review`): NO MEDIDO.
 *  - null con `informesSinTabla.length > 0`: algun informe no tiene tabla de
 *    hallazgos reconocible (anteriores a TASK-036, o escrita en prosa). Es
 *    SIN DATO, no cero: contar solo los otros informes daria una cifra
 *    menor que la real con aspecto de buena.
 */
export interface ResumenHallazgos {
  informes: number;
  /** Ficheros sin tabla de hallazgos. */
  informesSinTabla: string[];
  porSeveridad: ConteoSeveridad | null;
  porOrigen: ConteoOrigen | null;
  /** Hallazgos con severidad fuera del vocabulario (se listan aunque el total sea sin dato). */
  severidadesDesconocidas: SeveridadDesconocida[];
}

export function resumirHallazgos(informes: readonly InformeLeido[]): ResumenHallazgos {
  const informesSinTabla: string[] = [];
  const severidadesDesconocidas: SeveridadDesconocida[] = [];
  const porClave = new Map<string, { severidad: SeveridadHallazgo | null; origen: OrigenHallazgo }>();
  const ordenados = [...informes].sort((a, b) => a.ronda - b.ronda || a.fichero.localeCompare(b.fichero));
  for (const inf of ordenados) {
    const { tabla, hallazgos } = leerHallazgos(inf.texto);
    if (!tabla) {
      informesSinTabla.push(inf.fichero);
      continue;
    }
    for (const h of hallazgos) {
      if (h.severidadReconocida === null) {
        severidadesDesconocidas.push({ fichero: inf.fichero, id: h.id, valor: h.severidad });
      }
      const clave = `${inf.revisor}\u0000${h.id.toUpperCase()}`;
      const previo = porClave.get(clave) ?? { severidad: null, origen: 'sin clasificar' as OrigenHallazgo };
      porClave.set(clave, {
        severidad: h.severidadReconocida ?? previo.severidad,
        origen: h.origen === 'sin clasificar' ? previo.origen : h.origen,
      });
    }
  }
  if (informes.length === 0 || informesSinTabla.length > 0) {
    return { informes: informes.length, informesSinTabla, porSeveridad: null, porOrigen: null, severidadesDesconocidas };
  }
  const porSeveridad: ConteoSeveridad = { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 0 };
  const porOrigen: ConteoOrigen = { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 0 };
  for (const h of porClave.values()) {
    porSeveridad[h.severidad ?? 'desconocida']++;
    porOrigen[h.origen]++;
  }
  return { informes: informes.length, informesSinTabla, porSeveridad, porOrigen, severidadesDesconocidas };
}
