/**
 * Desglose del coste de una tarea (TASK-063): la seccion `## Coste` de
 * `tarea.md`, una fila por cada `taskctl registrar-coste`.
 *
 * | fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
 * |---|---|---|---|---|---|---|---|---|---|---|
 * | 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 | - | - |
 * | 2026-10-25T15:10:00Z | diseno | manual | - | - | - | - | - | 5000 | - | - |
 * | 2026-10-25T16:00:00Z | revision | agente:b1... | 90 | 800 | 40000 | 600 | 9 | 41490 | 1 | java-spring-reviewer |
 *
 * Calcado de `core/transiciones.ts` (misma busqueda de seccion, fuera de
 * bloques de codigo, la ultima gana), y por la misma razon que TASK-056: una
 * tabla en el cuerpo y no claves de frontmatter, que no anida y obligaria a
 * tocar el parser y `TASK_FIELD_ORDER` con quince claves planas nuevas.
 *
 * El TOTAL de cada fase sigue en `tokens_<fase>` del frontmatter: la tabla es
 * el desglose de ese total y la escribe el mismo comando en el mismo commit.
 * Una tarea anterior no tiene tabla y sigue siendo valida; lo que el
 * desglose no cubra lo calcula quien lo lea (`tokens_<fase>` menos la suma de
 * sus filas).
 *
 * Columnas:
 *  - `fuente`: `agente:<id>[,<id>...]` (lo leido de las transcripciones),
 *    `manual` (`--tokens N`, una cifra sin desglose) o, desde TASK-085,
 *    `sesion:<id>` (el hilo principal de una sesion, del registro automatico
 *    de `core/coste-automatico.ts`). `dif:` delante de un id = diferencia.
 *  - `entrada` .. `salida`: los cuatro campos del `usage`; `lecturas`, los
 *    `tool_use` de lectura (`core/coste-transcripcion.ts`). `-` = sin dato,
 *    que no es 0: una fila `manual` solo tiene `total`.
 *  - `total`: lo que la fila sumo a `tokens_<fase>`. Sin ella, una fila
 *    manual no tendria donde poner su cifra.
 *  - `ronda` y `revisor` (TASK-081, solo con `--fase revision`): a que ronda
 *    de revision y a que revisor (el sufijo de `peticion-revision-N-<skill>.md`)
 *    pertenece la fila, para medir las lecturas por revisor y ronda. `-` en
 *    `ronda` = SIN ATRIBUIR (no se pudo deducir; no es la ronda 0 ni la 1).
 *    Con ronda conocida, `-` en `revisor` = ronda sin fragmentar (revisor
 *    '' en memoria, como `InformeLeido.revisor`).
 *  - Las filas anteriores a TASK-081 tienen 9 columnas y se leen igual, con
 *    ronda y revisor sin atribuir. Nunca se reescriben: la tabla de un
 *    tarea.md antiguo mezcla filas de 9 y de 11 columnas, y la cabecera es la
 *    de 11 solo en las tablas nuevas.
 *
 * Un plugin ANTERIOR a TASK-081 ignora las filas de 11 columnas: si vuelve a
 * registrar el mismo agente, `yaAnotado` no lo ve y lo suma otra vez (riesgo
 * aceptado y documentado en docs/METRICAS.md).
 *
 * Puro: recibe y devuelve el cuerpo como texto. Nunca reescribe filas ni
 * toca nada fuera de su seccion; leer nunca falla.
 */
import { dentroDeBloque, precisionDeFecha, rangoDeSeccion } from './transiciones.js';

export const SECCION_COSTE = '## Coste';

/** Fases con coste propio, cada una con su `tokens_<fase>` en el frontmatter. */
export const FASES_COSTE = ['diseno', 'implementacion', 'revision'] as const;
export type FaseCoste = (typeof FASES_COSTE)[number];

export interface FilaCoste {
  /** `YYYY-MM-DDTHH:MM:SSZ` (o `YYYY-MM-DD`, que tambien se lee). */
  fecha: string;
  fase: FaseCoste;
  /** `agente:<id>[,<id>...]`, `sesion:<id>` (TASK-085) o `manual`. */
  fuente: string;
  entrada: number | null;
  cacheEscritura: number | null;
  cacheLectura: number | null;
  salida: number | null;
  lecturas: number | null;
  total: number;
  /** TASK-081: ronda de revision de la fila; null = sin atribuir (y toda fila de 9 columnas). */
  ronda: number | null;
  /** TASK-081: revisor (sufijo de la peticion); '' = ronda sin fragmentar; null solo si `ronda` es null. */
  revisor: string | null;
}

export const CABECERA_COSTE =
  '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |';
const SEPARADOR = '|---|---|---|---|---|---|---|---|---|---|---|';
const COLUMNAS_ANTIGUA = 9;
const COLUMNAS = 11;
const SIN_DATO = '-';

function celda(n: number | null): string {
  return n === null ? SIN_DATO : String(n);
}

function filaATexto(f: FilaCoste): string {
  const revisor = f.ronda === null || f.revisor === null || f.revisor === '' ? SIN_DATO : f.revisor;
  return (
    `| ${f.fecha} | ${f.fase} | ${f.fuente} | ${celda(f.entrada)} | ${celda(f.cacheEscritura)} | ` +
    `${celda(f.cacheLectura)} | ${celda(f.salida)} | ${celda(f.lecturas)} | ${String(f.total)} | ` +
    `${celda(f.ronda)} | ${revisor} |`
  );
}

/**
 * Anade una fila al desglose. Si la seccion no existe la crea al final del
 * cuerpo; si existe, la fila va detras de su ultima fila de tabla.
 */
export function anadirCoste(body: string, fila: FilaCoste): string {
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const lineas = body.split(/\r?\n/);
  const rango = rangoDeSeccion(lineas, SECCION_COSTE);

  if (rango === null) {
    const base = body.replace(/(\r?\n)*$/, '');
    const separacion = base === '' ? '' : eol + eol;
    return base + separacion + [SECCION_COSTE, '', CABECERA_COSTE, SEPARADOR, filaATexto(fila)].join(eol) + eol;
  }

  const [inicio, fin] = rango;
  const enBloque = dentroDeBloque(lineas);
  let ultimaTabla = -1;
  for (let i = inicio + 1; i < fin; i++) {
    if (!enBloque[i] && (lineas[i] as string).trimStart().startsWith('|')) ultimaTabla = i;
  }
  const nuevas =
    ultimaTabla === -1
      ? // Seccion sin tabla (editada a mano): la tabla va justo bajo el titulo.
        [...lineas.slice(0, inicio + 1), '', CABECERA_COSTE, SEPARADOR, filaATexto(fila), ...lineas.slice(inicio + 1)]
      : [...lineas.slice(0, ultimaTabla + 1), filaATexto(fila), ...lineas.slice(ultimaTabla + 1)];
  return nuevas.join(eol);
}

const ENTERO_RE = /^\d+$/;

/** Celda numerica: entero >= 0, `-` (sin dato) o undefined si no es valida. */
function leerNumero(c: string): number | null | undefined {
  if (c === SIN_DATO) return null;
  if (!ENTERO_RE.test(c)) return undefined;
  const n = Number(c);
  return Number.isSafeInteger(n) ? n : undefined;
}

/**
 * Filas validas del desglose, en orden. Las que no casan (cabecera,
 * separador, filas editadas a mano con valores raros) se ignoran.
 */
export function leerCostes(body: string): FilaCoste[] {
  const lineas = body.split(/\r?\n/);
  const rango = rangoDeSeccion(lineas, SECCION_COSTE);
  if (rango === null) return [];
  const enBloque = dentroDeBloque(lineas);
  const filas: FilaCoste[] = [];
  for (let i = rango[0] + 1; i < rango[1]; i++) {
    if (enBloque[i]) continue;
    const celdas = (lineas[i] as string)
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
    if (celdas.length !== COLUMNAS_ANTIGUA && celdas.length !== COLUMNAS) continue;
    const [fecha, fase, fuente, ...resto] = celdas as [string, string, string, ...string[]];
    if (precisionDeFecha(fecha) === null) continue;
    if (!(FASES_COSTE as readonly string[]).includes(fase)) continue;
    if (fuente === '') continue;
    const valores = resto.slice(0, 6).map(leerNumero);
    if (valores.some((v) => v === undefined)) continue;
    const [entrada, cacheEscritura, cacheLectura, salida, lecturas, total] = valores as (number | null)[];
    if (total === null || total === undefined) continue;
    // TASK-081: ronda y revisor (solo en las filas de 11). Una ronda ilegible
    // deja la fila sin atribuir, no la descarta: su coste cuenta igual.
    let ronda: number | null = null;
    let revisor: string | null = null;
    if (celdas.length === COLUMNAS) {
      const r = leerNumero(resto[6] as string);
      if (typeof r === 'number' && r >= 1) {
        ronda = r;
        const v = resto[7] as string;
        revisor = v === SIN_DATO || v === '' ? '' : v;
      }
    }
    filas.push({
      fecha,
      fase: fase as FaseCoste,
      fuente,
      entrada: entrada ?? null,
      cacheEscritura: cacheEscritura ?? null,
      cacheLectura: cacheLectura ?? null,
      salida: salida ?? null,
      lecturas: lecturas ?? null,
      total,
      ronda,
      revisor,
    });
  }
  return filas;
}

// --- Lecturas por revisor y ronda (TASK-081) ----------------------------------

/**
 * Lo que costo y leyo UN revisor en UNA ronda, sumando las filas de
 * `--fase revision` que le atribuyen. `ronda` null = el grupo «sin atribuir»
 * (filas anteriores a TASK-081 o cuya transcripcion no nombra su peticion).
 * Cada cifra es null si ninguna fila del grupo la mide: ausente, no 0.
 */
export interface LecturasDeRevisor {
  ronda: number | null;
  /** '' = ronda sin fragmentar; null solo en el grupo sin atribuir. */
  revisor: string | null;
  /** Filas de `## Coste` del grupo (un agente por fila). */
  filas: number;
  /** Suma de `lecturas`: LLAMADAS de lectura, no bytes. */
  lecturas: number | null;
  entrada: number | null;
  cacheLectura: number | null;
}

function sumaODato(valores: readonly (number | null)[]): number | null {
  const datos = valores.filter((v): v is number => v !== null);
  return datos.length === 0 ? null : datos.reduce((a, b) => a + b, 0);
}

/**
 * Agrupa por (ronda, revisor) las filas de fase `revision`. Orden: rondas
 * ascendentes, revisores por nombre, y el grupo sin atribuir al final. Pura:
 * no lee nada, y no inventa un grupo si no hay filas de revision.
 */
export function lecturasDeRevision(filas: readonly FilaCoste[]): LecturasDeRevisor[] {
  const grupos = new Map<string, FilaCoste[]>();
  for (const f of filas) {
    if (f.fase !== 'revision') continue;
    const clave = f.ronda === null ? '\u0000sin' : `${String(f.ronda)}\u0000${f.revisor ?? ''}`;
    const lista = grupos.get(clave) ?? [];
    lista.push(f);
    grupos.set(clave, lista);
  }
  const salida: LecturasDeRevisor[] = [];
  for (const lista of grupos.values()) {
    const primera = lista[0] as FilaCoste;
    salida.push({
      ronda: primera.ronda,
      revisor: primera.ronda === null ? null : (primera.revisor ?? ''),
      filas: lista.length,
      lecturas: sumaODato(lista.map((f) => f.lecturas)),
      entrada: sumaODato(lista.map((f) => f.entrada)),
      cacheLectura: sumaODato(lista.map((f) => f.cacheLectura)),
    });
  }
  return salida.sort((a, b) => {
    if (a.ronda === null || b.ronda === null) return a.ronda === b.ronda ? 0 : a.ronda === null ? 1 : -1;
    return a.ronda - b.ronda || (a.revisor as string).localeCompare(b.revisor as string);
  });
}

// --- Lectura para las metricas (TASK-064) ------------------------------------

/** Lo que dice el desglose de UNA fase, frente a su `tokens_<fase>`. */
export interface ResumenFaseCoste {
  /** `tokens_<fase>` del frontmatter; null = nadie lo registro. */
  registrado: number | null;
  /** Filas de esta fase en `## Coste`. */
  filas: number;
  /** Suma de `total` de las filas con desglose (entrada, cache y salida con dato). */
  desglosado: number;
  /** Tokens nuevos de esas filas: entrada + escritura de cache + salida. */
  nuevos: number;
  /** Lectura de cache de esas filas, aparte: es lo barato y lo que mas abulta. */
  cacheLectura: number;
  /**
   * `registrado` - `desglosado`: lo que la tabla no explica (filas `manual`,
   * coste registrado antes de TASK-063). NEGATIVO si el desglose supera al
   * total: nunca se recorta a 0, es una incoherencia que se avisa. null solo
   * si no hay ni total ni filas (fase sin medir).
   */
  sinDesglose: number | null;
  /** Suma de `lecturas`; null si ninguna fila de la fase la trae (no medido, no 0). */
  lecturas: number | null;
}

/** Un agente que aparece en mas de una fila de la misma fase: su coste se suma varias veces. */
export interface CosteRepetido {
  fase: FaseCoste;
  /** Id del agente (o la fuente entera si no es `agente:`). */
  fuente: string;
  filas: number;
}

export interface ResumenCostes {
  /** false = la tarea no tiene filas en `## Coste` (anterior a TASK-063 o sin registrar). */
  conTabla: boolean;
  fases: Record<FaseCoste, ResumenFaseCoste>;
  repetidas: CosteRepetido[];
}

function conDesglose(f: FilaCoste): boolean {
  return f.entrada !== null && f.cacheEscritura !== null && f.cacheLectura !== null && f.salida !== null;
}

/**
 * Prefijo de un id en `fuente` cuya fila es la DIFERENCIA de un agente
 * reanudado (TASK-065): `agente:dif:<id>`. Su transcripcion acumula los dos
 * trabajos, asi que `registrar-coste` solo suma lo que crecio desde lo ya
 * anotado para ese id, y esa fila no es una repeticion.
 */
export const PREFIJO_DIFERENCIA = 'dif:';

/** Un id de agente de una fuente, y si su fila es la diferencia de un reanudado. */
export interface IdDeFuente {
  id: string;
  diferencia: boolean;
}

/**
 * Fuentes con ids: `agente:` (subagentes) y, desde TASK-085, `sesion:` (el
 * hilo principal de una sesion, que vuelca el registro automatico). Las dos
 * admiten varios ids y el prefijo de diferencia.
 */
export const PREFIJOS_CON_ID = ['agente:', 'sesion:'] as const;

/** Ids de una fuente `agente:a,dif:b` o `sesion:<id>`; cualquier otra fuente cuenta entera. */
export function idsDeFuente(fuente: string): IdDeFuente[] {
  const prefijo = PREFIJOS_CON_ID.find((p) => fuente.startsWith(p));
  if (prefijo === undefined) return [{ id: fuente, diferencia: false }];
  return fuente
    .slice(prefijo.length)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map((s) =>
      s.startsWith(PREFIJO_DIFERENCIA)
        ? { id: s.slice(PREFIJO_DIFERENCIA.length), diferencia: true }
        : { id: s, diferencia: false }
    );
}

/**
 * Cruza las filas de `## Coste` con los `tokens_<fase>` de la tarea. No
 * deduplica nada (MEN-2 de TASK-063): un agente registrado dos veces en la
 * misma fase ya sumo dos veces a `tokens_<fase>`, asi que quitar una fila
 * aqui descuadraria el total; se devuelve en `repetidas` para avisar. Las
 * filas `manual` no cuentan como repetidas: dos cifras a mano son dos
 * aportaciones legitimas y no hay id con el que compararlas. Tampoco las
 * filas de diferencia de un agente reanudado (`agente:dif:<id>`, TASK-065):
 * suman solo lo que su transcripcion crecio, no lo repiten.
 */
export function resumirCostes(
  filas: readonly FilaCoste[],
  registrado: Readonly<Record<FaseCoste, number | null>>
): ResumenCostes {
  const fases = {} as Record<FaseCoste, ResumenFaseCoste>;
  const repetidas: CosteRepetido[] = [];
  for (const fase of FASES_COSTE) {
    const deFase = filas.filter((f) => f.fase === fase);
    const desglose = deFase.filter(conDesglose);
    const suma = (v: (f: FilaCoste) => number): number => desglose.reduce((a, f) => a + v(f), 0);
    const desglosado = suma((f) => f.total);
    const conLecturas = deFase.filter((f) => f.lecturas !== null);
    const reg = registrado[fase];
    fases[fase] = {
      registrado: reg,
      filas: deFase.length,
      desglosado,
      nuevos: suma((f) => (f.entrada as number) + (f.cacheEscritura as number) + (f.salida as number)),
      cacheLectura: suma((f) => f.cacheLectura as number),
      sinDesglose: reg === null && deFase.length === 0 ? null : (reg ?? 0) - desglosado,
      lecturas: conLecturas.length === 0 ? null : conLecturas.reduce((a, f) => a + (f.lecturas as number), 0),
    };
    const vistas = new Map<string, number>();
    for (const f of deFase) {
      if (f.fuente === 'manual') continue;
      const nuevos = idsDeFuente(f.fuente).filter((x) => !x.diferencia).map((x) => x.id);
      for (const id of new Set(nuevos)) vistas.set(id, (vistas.get(id) ?? 0) + 1);
    }
    for (const [fuente, n] of vistas) if (n > 1) repetidas.push({ fase, fuente, filas: n });
  }
  return { conTabla: filas.length > 0, fases, repetidas };
}
