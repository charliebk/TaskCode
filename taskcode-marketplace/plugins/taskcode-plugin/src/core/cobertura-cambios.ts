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
 * - Un fichero cambiado que no esta en el informe y cuya extension el
 *   informe SI instrumenta en otros ficheros (un .mjs nuevo que ningun test
 *   carga: `node --test` y c8 sin `--all` solo listan lo cargado) cuenta con
 *   todas sus lineas añadidas sin cubrir (IMP-1 e IMP-2 de la revision).
 * - Uno cuya extension el informe no mide (un .md, un .yml...) va aparte,
 *   «sin instrumentar»: no cuenta. Una tarea de solo docs no se frena.
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
  /** El informe no lista el fichero (ningun test lo carga): todas sus lineas cuentan sin cubrir. */
  fueraDelInforme?: true;
}

/** Extension en minusculas (`.mjs`), o '' si no tiene. */
function extension(ruta: string): string {
  const base = ruta.slice(ruta.lastIndexOf('/') + 1);
  const punto = base.lastIndexOf('.');
  return punto <= 0 ? '' : base.slice(punto).toLowerCase();
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

/**
 * Cruza las lineas añadidas (por ruta del repo) con el informe (por ruta del
 * repo). `clave` normaliza la ruta para comparar: en Windows, sin mayusculas.
 */
export function cruzarCobertura(
  anadidas: ReadonlyMap<string, readonly number[]>,
  informe: ReadonlyMap<string, LineasEjecutadas>,
  clave: (ruta: string) => string = (r) => r
): CruceCobertura {
  const porClave = new Map<string, LineasEjecutadas>();
  const medidas = new Set<string>();
  for (const [ruta, lineas] of informe) {
    porClave.set(clave(ruta), lineas);
    const ext = extension(ruta);
    if (ext !== '') medidas.add(ext);
  }
  const ficheros: CoberturaFichero[] = [];
  const sinInstrumentar: string[] = [];
  let ejecutables = 0;
  let cubiertas = 0;
  for (const [ruta, lineas] of [...anadidas].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (lineas.length === 0) continue;
    const registro = porClave.get(clave(ruta));
    if (registro === undefined) {
      if (!medidas.has(extension(ruta))) {
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
  return String(Math.floor(p * 10 + 1e-9) / 10);
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
          (f.fueraDelInforme ? ' (el informe no lo lista: ningun test lo carga)' : '')
      );
    }
  }
  if (c.sinInstrumentar.length > 0) {
    lineas.push('', 'Cambian pero el informe no los lista (sin instrumentar; no cuentan):', '');
    for (const r of c.sinInstrumentar) lineas.push(`- \`${r}\``);
  }
  return lineas.join('\n');
}
