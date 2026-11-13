/**
 * Metricas por version del plugin (TASK-084, `taskctl metricas --por-version`).
 * Puro: recibe las filas de metricas y devuelve los grupos y su texto. La E/S
 * vive en `commands/metricas.ts`.
 *
 * Se agrupan las tareas TERMINADAS por `versionCierre`: la version de taskctl
 * del ultimo `finish` de su registro de Transiciones. No va en `calcularGrupos`
 * porque alli los grupos son fijos y estos son las versiones que aparezcan, y
 * porque piden mas cifras (hallazgos por severidad y origen, tokens por fase):
 * ampliar `GrupoMetricas` cambiaria el `--json` de `--grupos`.
 *
 * REGLAS (decididas por Carlos, 2026-11-06):
 *  - Las tareas sin version anotada (cerradas antes de TASK-084, con origen
 *    `git`, o con la celda editada a mano) van a `sinVersion`, aparte. Nunca
 *    se reparten por fecha ni por tag: deducirlo es el error que motiva esto.
 *  - Orden semver por componentes numericos (0.9.0 < 0.10.0); una
 *    pre-release (`0.12.0-dev`) va antes de su release.
 *  - Rondas y «aprobada a la primera», con las reglas de `--grupos`
 *    (`resumirGrupo`): sobre las tareas con revision.
 *  - Hallazgos: suma de las tareas con tabla de hallazgos en todos sus
 *    informes (`conHallazgos`); las revisadas sin tabla se cuentan aparte.
 *  - Tokens por fase: suma y media de las tareas con dato en esa fase
 *    (`conDato`); null = sin registrar, no cero.
 */
import { media, tablaDeTexto, type FilaMetricas } from './metricas.js';
import { resumirGrupo } from './grupos-metricas.js';
import type { ConteoOrigen, ConteoSeveridad } from './informe-revision.js';
import { compararVersiones } from './version.js';

/** Tokens de una fase en un grupo; `media` null si ninguna tarea tiene dato. */
export interface CifraTokens {
  suma: number;
  conDato: number;
  media: number | null;
}

export interface GrupoVersion {
  /** La version; null en el grupo de las tareas sin version anotada. */
  version: string | null;
  /** Tareas terminadas del grupo. */
  n: number;
  conRevision: number;
  aprobadasPrimera: number;
  /** Porcentaje (un decimal) sobre `conRevision`; null si es 0. */
  pctAprobadaPrimera: number | null;
  rondasMedia: number | null;
  /** Terminadas sin ningun informe de revision. */
  sinRevision: number;
  /** Con tabla de hallazgos en todos sus informes: las unicas que suman hallazgos. */
  conHallazgos: number;
  /** Revisadas con algun informe sin tabla de hallazgos (sin dato, no cero). */
  sinTablaHallazgos: number;
  hallazgosPorSeveridad: ConteoSeveridad;
  hallazgosPorOrigen: ConteoOrigen;
  tokens: { diseno: CifraTokens; implementacion: CifraTokens; revision: CifraTokens };
  /** TASK-129: el mayor numero de tests de la completa visto en el grupo; null sin dato. */
  tests: number | null;
  /** TASK-129: mediana de la duracion (s) de la completa en verde; null sin dato. */
  completaS: number | null;
}

export interface PorVersion {
  terminadas: number;
  /** Una por version encontrada, en orden semver ascendente. */
  versiones: GrupoVersion[];
  /** Las terminadas sin version anotada; con n 0 si no hay ninguna. */
  sinVersion: GrupoVersion;
}

// El orden semver vive en `version.ts` desde TASK-087 (doctor lo usa tambien);
// se reexporta para no cambiar los imports existentes.
export { compararVersiones };

function cifraTokens(valores: readonly (number | null)[]): CifraTokens {
  const con = valores.filter((v): v is number => v !== null);
  return { suma: con.reduce((a, b) => a + b, 0), conDato: con.length, media: media(con, 0) };
}

/** Resumen de un grupo de tareas terminadas; con `filas` vacio, n 0 y cifras null o 0. */
export function resumirVersion(version: string | null, filas: readonly FilaMetricas[]): GrupoVersion {
  const g = resumirGrupo(version ?? '', filas);
  const porSeveridad: ConteoSeveridad = { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 0 };
  const porOrigen: ConteoOrigen = { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 0 };
  // Las mismas tareas que cuenta `conHallazgos`: revisadas y con tabla.
  for (const f of filas) {
    if (f.rondas === null || f.hallazgos.porSeveridad === null) continue;
    for (const k of Object.keys(porSeveridad) as (keyof ConteoSeveridad)[]) porSeveridad[k] += f.hallazgos.porSeveridad[k];
    if (f.hallazgos.porOrigen !== null) {
      for (const k of Object.keys(porOrigen) as (keyof ConteoOrigen)[]) porOrigen[k] += f.hallazgos.porOrigen[k];
    }
  }
  return {
    version,
    n: g.n,
    conRevision: g.conRevision,
    aprobadasPrimera: g.aprobadasPrimera,
    pctAprobadaPrimera: g.pctAprobadaPrimera,
    rondasMedia: g.rondasMedia,
    sinRevision: g.sinRevision,
    conHallazgos: g.conHallazgos,
    sinTablaHallazgos: g.sinTablaHallazgos,
    hallazgosPorSeveridad: porSeveridad,
    hallazgosPorOrigen: porOrigen,
    tests: (() => {
      const xs = filas.map((f) => f.suite?.tests ?? null).filter((x): x is number => x !== null);
      return xs.length === 0 ? null : Math.max(...xs);
    })(),
    completaS: (() => {
      const xs = filas.map((f) => f.suite?.completaS ?? null).filter((x): x is number => x !== null).sort((a, b) => a - b);
      if (xs.length === 0) return null;
      const m = Math.floor(xs.length / 2);
      return xs.length % 2 === 1 ? (xs[m] as number) : ((xs[m - 1] as number) + (xs[m] as number)) / 2;
    })(),
    tokens: {
      diseno: cifraTokens(filas.map((f) => f.tokens.diseno)),
      implementacion: cifraTokens(filas.map((f) => f.tokens.implementacion)),
      revision: cifraTokens(filas.map((f) => f.tokens.revision)),
    },
  };
}

/** Las tareas TERMINADAS de `filas`, agrupadas por la version de su cierre. */
export function calcularPorVersion(filas: readonly FilaMetricas[]): PorVersion {
  const t = filas.filter((f) => f.estado === 'terminada');
  const versiones = [...new Set(t.map((f) => f.versionCierre).filter((v): v is string => v !== null))].sort(
    compararVersiones
  );
  return {
    terminadas: t.length,
    versiones: versiones.map((v) => resumirVersion(v, t.filter((f) => f.versionCierre === v))),
    sinVersion: resumirVersion(null, t.filter((f) => f.versionCierre === null)),
  };
}

function celda(v: number | null): string {
  return v === null ? '—' : String(v);
}

function celdaTokens(c: CifraTokens): string {
  return c.media === null ? '—' : `${String(c.media)} (n=${String(c.conDato)})`;
}

export const NOTA_POR_VERSION =
  'Solo tareas terminadas, agrupadas por la version de taskctl de su ultimo finish (columna version ' +
  'de ## Transiciones). «sin version» = cerradas sin version anotada (antes de anotarla, con origen git ' +
  'o editadas a mano): nunca se deducen por fecha. «a la primera» y «rondas medias», de las tareas con ' +
  'revision. Hallazgos: suma de las tareas con tabla de hallazgos (n), una vez por revisor + ID; ' +
  '«sin tabla» se cuenta aparte, no como cero. Tokens: media por tarea de las que tienen dato en esa ' +
  'fase (n). tests y completa: el mayor numero de tests y la mediana de la duracion de la verificacion ' +
  'completa en verde del grupo, del registro de puertas (linea suite). «—» = ninguna tarea del grupo tiene ese dato.';

/** Texto de `--por-version`: una tabla de rondas y tokens y otra de hallazgos. */
export function formatearPorVersion(p: PorVersion): string {
  const grupos = [...p.versiones, ...(p.sinVersion.n > 0 ? [p.sinVersion] : [])];
  const nombre = (g: GrupoVersion): string => g.version ?? 'sin version';
  const general = tablaDeTexto(
    [
      'version',
      'tareas',
      'con revision',
      'a la primera',
      'rondas medias',
      'tokens diseno',
      'tokens impl.',
      'tokens revision',
      // TASK-129: tamano de la suite (registro de puertas, linea `suite`).
      'tests',
      'completa',
    ],
    grupos.map((g) => [
      nombre(g),
      String(g.n),
      String(g.conRevision),
      g.pctAprobadaPrimera === null ? '—' : `${String(g.pctAprobadaPrimera)}% (${String(g.aprobadasPrimera)})`,
      celda(g.rondasMedia),
      celdaTokens(g.tokens.diseno),
      celdaTokens(g.tokens.implementacion),
      celdaTokens(g.tokens.revision),
      celda(g.tests),
      g.completaS === null ? '—' : `${String(Math.round(g.completaS))} s`,
    ])
  );
  const hallazgos = tablaDeTexto(
    ['version', 'con tabla', 'sin tabla', 'CRITICO', 'IMPORTANTE', 'MENOR', 'desconocida', 'impl.', 'plan', 'especif.', 'sin clasificar'],
    grupos.map((g) => {
      const s = g.hallazgosPorSeveridad;
      const o = g.hallazgosPorOrigen;
      return [
        nombre(g),
        String(g.conHallazgos),
        String(g.sinTablaHallazgos),
        String(s.CRITICO),
        String(s.IMPORTANTE),
        String(s.MENOR),
        String(s.desconocida),
        String(o.implementacion),
        String(o.plan),
        String(o.especificacion),
        String(o['sin clasificar']),
      ];
    })
  );
  return [
    `Por version de ${String(p.terminadas)} tareas terminadas (sin version anotada: ${String(p.sinVersion.n)}).`,
    '',
    general,
    '',
    'Hallazgos por severidad y origen:',
    hallazgos,
    '',
    NOTA_POR_VERSION,
  ].join('\n');
}
