/**
 * Cobertura de las lineas cambiadas — TASK-074 (freno 8). Una linea cambiada
 * que ningun test ejecuta es un hallazgo, medido contra la merge base de la
 * rama y no sobre todo el repo. Este modulo es el UNICO que decide que linea
 * esta «sin cubrir»; review (que informa) y finish (que frena con el umbral)
 * no lo reimplementan.
 *
 * Reglas (decisiones de Carlos en el plan):
 * - Cuenta una linea añadida o cambiada con `DA` en el informe: `DA:n,0` es
 *   sin cubrir, `DA:n,k>0` cubierta. Sin `DA` (comentario, linea en blanco,
 *   un `type`) no es ejecutable y no cuenta.
 * - Un fichero cambiado que no esta en el informe cuenta con todas sus
 *   lineas añadidas sin cubrir si el informe SI mide su extension Y alguna
 *   carpeta suya (la propia o una padre, sin contar la raiz del repo ni la
 *   del proyecto que genero el informe, p. ej. `pkg/`) tiene un fichero
 *   medido: un .mjs nuevo en `src/` que ningun test carga (`node --test` y
 *   c8 sin `--all` solo listan lo cargado). IMP-1 e IMP-2 de la ronda 1;
 *   acotada en la ronda 2 (IMP-5) y en la 3 (IMP-6) para no frenar en falso.
 * - Si no, va aparte como «sin instrumentar» y no cuenta: un .md o un .yml
 *   (extension no medida), los tests cuando el proyecto los excluye de la
 *   cobertura (`test/` sin ningun fichero medido) y los `*.d.ts`, que no
 *   tienen codigo. Una tarea de solo docs, o de solo tests, no se frena.
 *   Riesgo aceptado: un .ts solo de tipos en una carpeta medida cuenta sin
 *   cubrir; el remedio es generar la cobertura con `--all`/`include`, y
 *   entonces sale en el informe sin lineas ejecutables.
 * - El umbral es el porcentaje minimo cubierto; el valor exacto pasa.
 *
 * Puro: recibe las lineas cambiadas y el informe ya resuelto a rutas del repo.
 */
import type { LineasEjecutadas } from './lcov.js';

export interface CoberturaFichero {
  ruta: string;
  /** Lineas cambiadas ejecutables. */
  ejecutables: number;
  cubiertas: number;
  /** Lineas cambiadas con `DA:n,0`, en orden. */
  sinCubrir: number[];
  /** El informe no lista el fichero, y es codigo de una carpeta medida: todas sus lineas cuentan sin cubrir. */
  fueraDelInforme?: true;
}

/** Extension en minusculas (`.mjs`), o '' si no tiene. */
export function extension(ruta: string): string {
  const base = ruta.slice(ruta.lastIndexOf('/') + 1);
  const punto = base.lastIndexOf('.');
  return punto <= 0 ? '' : base.slice(punto).toLowerCase();
}

/** Declaraciones de TypeScript: no tienen codigo ejecutable. */
const DECLARACIONES_RE = /\.d\.[cm]?ts$/i;

/** Carpetas (sin la raiz) de una ruta del repo, de la mas cercana a la mas lejana: `a/b/c.js` -> `a/b`, `a`. */
function carpetas(ruta: string): string[] {
  const partes = ruta.split('/').slice(0, -1);
  const r: string[] = [];
  for (let i = partes.length; i > 0; i--) r.push(partes.slice(0, i).join('/'));
  return r;
}

export interface CruceCobertura {
  ficheros: CoberturaFichero[];
  /** Ficheros cambiados (con lineas añadidas) que el informe no lista. */
  sinInstrumentar: string[];
  ejecutables: number;
  cubiertas: number;
  /** Porcentaje cubierto, o null si no hay ninguna linea ejecutable cambiada. */
  porcentaje: number | null;
}

/** Carpeta de una ruta del repo ('' en la raiz). */
function padre(ruta: string): string {
  const i = ruta.lastIndexOf('/');
  return i < 0 ? '' : ruta.slice(0, i);
}

/**
 * Cruza las lineas añadidas (por ruta del repo) con el informe (por ruta del
 * repo). `clave` normaliza la ruta para comparar: en Windows, sin mayusculas.
 * `raices`: carpetas del repo que son la raiz de un proyecto que genero el
 * informe (`pkg`, `packages/a`). Ellas y sus padres se descuentan como la
 * raiz del repo: `pkg/` siempre «tiene algo medido» y no dice nada de
 * `pkg/test/` (IMP-6 de la ronda 3).
 */
export function cruzarCobertura(
  anadidas: ReadonlyMap<string, readonly number[]>,
  informe: ReadonlyMap<string, LineasEjecutadas>,
  clave: (ruta: string) => string = (r) => r,
  raices: readonly string[] = []
): CruceCobertura {
  const descontadas = new Set<string>();
  for (const r of raices) {
    descontadas.add(clave(r));
    for (const c of carpetas(r)) descontadas.add(clave(c));
  }
  /** Carpetas de la ruta que dicen algo: sin la raiz del repo ni las de los proyectos. */
  const efectivas = (ruta: string): string[] => carpetas(ruta).filter((c) => !descontadas.has(clave(c)));
  const porClave = new Map<string, LineasEjecutadas>();
  const medidas = new Set<string>();
  /** Carpetas (por clave) con algun fichero medido debajo. */
  const carpetasMedidas = new Set<string>();
  /** Raices (del repo o de un proyecto, por clave) con un fichero medido directamente. */
  const raicesMedidas = new Set<string>();
  for (const [ruta, lineas] of informe) {
    porClave.set(clave(ruta), lineas);
    const ext = extension(ruta);
    if (ext !== '') medidas.add(ext);
    const cs = efectivas(ruta);
    if (cs.length === 0) raicesMedidas.add(clave(padre(ruta)));
    for (const c of cs) carpetasMedidas.add(clave(c));
  }
  const esCodigoMedido = (ruta: string): boolean => {
    if (DECLARACIONES_RE.test(ruta) || !medidas.has(extension(ruta))) return false;
    const cs = efectivas(ruta);
    return cs.length === 0 ? raicesMedidas.has(clave(padre(ruta))) : cs.some((c) => carpetasMedidas.has(clave(c)));
  };
  const ficheros: CoberturaFichero[] = [];
  const sinInstrumentar: string[] = [];
  let ejecutables = 0;
  let cubiertas = 0;
  for (const [ruta, lineas] of [...anadidas].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (lineas.length === 0) continue;
    const registro = porClave.get(clave(ruta));
    if (registro === undefined) {
      if (!esCodigoMedido(ruta)) {
        sinInstrumentar.push(ruta);
        continue;
      }
      const sinCubrir = [...lineas].sort((a, b) => a - b);
      ficheros.push({ ruta, ejecutables: sinCubrir.length, cubiertas: 0, sinCubrir, fueraDelInforme: true });
      ejecutables += sinCubrir.length;
      continue;
    }
    const f: CoberturaFichero = { ruta, ejecutables: 0, cubiertas: 0, sinCubrir: [] };
    for (const n of [...lineas].sort((a, b) => a - b)) {
      const veces = registro.get(n);
      if (veces === undefined) continue;
      f.ejecutables++;
      if (veces > 0) f.cubiertas++;
      else f.sinCubrir.push(n);
    }
    if (f.ejecutables === 0) continue;
    ficheros.push(f);
    ejecutables += f.ejecutables;
    cubiertas += f.cubiertas;
  }
  return {
    ficheros,
    sinInstrumentar,
    ejecutables,
    cubiertas,
    porcentaje: ejecutables === 0 ? null : (100 * cubiertas) / ejecutables,
  };
}

/** Solo los ficheros de `rutas` (una peticion fragmentada por dominio), con los totales recalculados. */
export function filtrarCruce(c: CruceCobertura, rutas: ReadonlySet<string>): CruceCobertura {
  const ficheros = c.ficheros.filter((f) => rutas.has(f.ruta));
  const ejecutables = ficheros.reduce((s, f) => s + f.ejecutables, 0);
  const cubiertas = ficheros.reduce((s, f) => s + f.cubiertas, 0);
  return {
    ficheros,
    sinInstrumentar: c.sinInstrumentar.filter((r) => rutas.has(r)),
    ejecutables,
    cubiertas,
    porcentaje: ejecutables === 0 ? null : (100 * cubiertas) / ejecutables,
  };
}

/** `[4,5,6,9]` -> `4-6, 9`. */
export function rangos(lineas: readonly number[]): string {
  const partes: string[] = [];
  let i = 0;
  while (i < lineas.length) {
    const ini = lineas[i] as number;
    let fin = ini;
    while (i + 1 < lineas.length && lineas[i + 1] === fin + 1) {
      fin++;
      i++;
    }
    partes.push(ini === fin ? String(ini) : `${ini}-${fin}`);
    i++;
  }
  return partes.join(', ');
}

/**
 * `87.5`, `100`, `33.3`: un decimal como mucho, redondeado HACIA ABAJO, para
 * que un 90.96 que no llega a 91 no se lea «91 % no llega a 91 %» (MEN-2).
 */
export function formatearPorcentaje(p: number): string {
  return String(Math.floor(p * 10) / 10);
}

/** true si cumple el umbral (porcentaje minimo; el valor exacto pasa). Sin lineas ejecutables, pasa. */
export function cumpleUmbral(c: CruceCobertura, umbral: number): boolean {
  if (c.ejecutables === 0) return true;
  // Sin dividir: 2 de 3 contra 66.67 no depende del redondeo de coma flotante.
  return c.cubiertas * 100 >= umbral * c.ejecutables;
}

/** El resumen y las lineas sin cubrir, en Markdown, para la peticion y para el mensaje de finish. */
export function describirCruce(c: CruceCobertura): string {
  const lineas: string[] = [];
  lineas.push(
    c.porcentaje === null
      ? 'Ninguna linea cambiada es ejecutable segun el informe: no hay nada que medir.'
      : `Cubiertas ${c.cubiertas} de ${c.ejecutables} lineas cambiadas ejecutables (${formatearPorcentaje(c.porcentaje)} %).`
  );
  const conHuecos = c.ficheros.filter((f) => f.sinCubrir.length > 0);
  if (conHuecos.length > 0) {
    lineas.push('', 'Sin cubrir (ningun test las ejecuta):', '');
    for (const f of conHuecos) {
      lineas.push(
        `- \`${f.ruta}\`: ${rangos(f.sinCubrir)}` +
          (f.fueraDelInforme ? ' (el informe no lo lista, y es codigo de una carpeta que si mide: cuenta entero)' : '')
      );
    }
  }
  if (c.sinInstrumentar.length > 0) {
    lineas.push('', 'Cambian pero el informe no los lista (sin instrumentar; no cuentan):', '');
    for (const r of c.sinInstrumentar) lineas.push(`- \`${r}\``);
  }
  return lineas.join('\n');
}
