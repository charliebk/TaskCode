/**
 * Lectura del informe de cobertura y cruce con la rama — TASK-074. Nunca
 * ejecuta tests: lee el lcov que haya en `informe_cobertura` (lo genera
 * `comando_verificacion`).
 *
 * Las rutas `SF:` se resuelven contra el repo: absolutas (c8, istanbul) o
 * relativas al cwd en que corrieron los tests (`node --test`, con `\` en
 * Windows). Una relativa se prueba contra la carpeta del informe y cada una
 * de sus padres hasta la raiz del repo, la mas cercana primero (un proyecto
 * cuyos tests corren en un subdirectorio y escriben el lcov ahi). Las rutas cortas 8.3 de
 * Windows se expanden con realpath, y en Windows se comparan sin mayusculas.
 */
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { parsearLcov, type LineasEjecutadas } from '../core/lcov.js';
import { cruzarCobertura, describirCruce, filtrarCruce, type CruceCobertura } from '../core/cobertura-cambios.js';
import { ficherosVersionados, instanteUltimoCommitPropio, lineasAnadidas, mergeBase } from './git.js';

/** Clave de comparacion de rutas del repo: en Windows, sin mayusculas. */
export function claveRuta(ruta: string): string {
  return process.platform === 'win32' ? ruta.toLowerCase() : ruta;
}

export type LecturaInforme =
  | { tipo: 'ausente'; ruta: string }
  | { tipo: 'truncado'; ruta: string; mtimeMs: number }
  | {
      tipo: 'ok';
      ruta: string;
      mtimeMs: number;
      /** Por ruta del repo (con `/`). */
      porRuta: Map<string, LineasEjecutadas>;
      /** Ficheros del informe que son ficheros versionados del repo fuera de lo excluido. */
      validos: number;
      /**
       * Carpetas del repo (sin la raiz) contra las que se resolvieron las `SF:`
       * relativas: las raices de los proyectos que generaron el informe (`pkg`).
       */
      raices: string[];
    };

function real(p: string): string {
  try {
    return realpathSync.native(p);
  } catch {
    return p;
  }
}

/**
 * Donde puede haber corrido el generador: la carpeta del informe y cada una de
 * sus padres hasta la raiz del repo, la mas cercana primero. Un proyecto en
 * `pkg/` que escribe `pkg/coverage/lcov.info` con `SF:src\a.mjs` es `pkg/`
 * (IMP-3 de la revision); un informe en `coverage/` de la raiz, la raiz.
 */
function basesRelativas(raizReal: string, dirInforme: string): string[] {
  const bases: string[] = [];
  let dir = dirInforme;
  for (;;) {
    bases.push(dir);
    const rel = path.relative(raizReal, dir);
    if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) break;
    dir = path.dirname(dir);
  }
  if (!bases.includes(raizReal)) bases.push(raizReal);
  return bases;
}

/** Ruta del repo con `/`, o null si `abs` cae fuera de el (o es la raiz). */
function relativaAlRepo(raizReal: string, abs: string): string | null {
  const rel = path.relative(raizReal, real(abs));
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel.split(path.sep).join('/');
}

/**
 * Ruta del repo (con `/`) de una entrada `SF:`, o null si cae fuera del repo;
 * y, si era relativa, la carpeta del repo contra la que se resolvio (la raiz
 * del proyecto que genero el informe; '' si es la raiz del repo).
 */
function resolverSfConBase(sf: string, raizReal: string, dirInforme: string): { ruta: string; base: string | null } | null {
  const s = sf.replace(/\\/g, '/');
  const absoluta = /^[A-Za-z]:\//.test(s) || s.startsWith('/');
  if (absoluta) {
    const ruta = relativaAlRepo(raizReal, s);
    return ruta === null ? null : { ruta, base: null };
  }
  const bases = basesRelativas(raizReal, dirInforme);
  const elegida = bases.find((b) => existsSync(path.join(b, s))) ?? (bases[0] as string);
  const ruta = relativaAlRepo(raizReal, path.join(elegida, s));
  if (ruta === null) return null;
  return { ruta, base: relativaAlRepo(raizReal, elegida) ?? '' };
}

/** Ruta del repo (con `/`) de una entrada `SF:`, o null si cae fuera del repo. */
export function resolverSf(sf: string, raizReal: string, dirInforme: string): string | null {
  return resolverSfConBase(sf, raizReal, dirInforme)?.ruta ?? null;
}

/** Lee y resuelve el informe. `informe` es relativa a la raiz del repo. */
export function leerInformeCobertura(raiz: string, informe: string, excluir: readonly string[]): LecturaInforme {
  const raizReal = real(raiz);
  const abs = path.join(raizReal, informe);
  let texto: string;
  let mtimeMs: number;
  try {
    mtimeMs = statSync(abs).mtimeMs;
    texto = readFileSync(abs, 'utf8');
  } catch {
    return { tipo: 'ausente', ruta: informe };
  }
  const lcov = parsearLcov(texto);
  if (lcov.truncado) return { tipo: 'truncado', ruta: informe, mtimeMs };
  const dirInforme = path.dirname(abs);
  const porRuta = new Map<string, LineasEjecutadas>();
  const raices = new Set<string>();
  for (const [sf, lineas] of lcov.ficheros) {
    const r = resolverSfConBase(sf, raizReal, dirInforme);
    if (r === null) continue;
    const ruta = r.ruta;
    if (r.base !== null && r.base !== '') raices.add(r.base);
    const previa = porRuta.get(ruta);
    if (previa === undefined) {
      porRuta.set(ruta, lineas);
    } else {
      for (const [n, v] of lineas) previa.set(n, (previa.get(n) ?? 0) + v);
    }
  }
  const versionados = new Set(ficherosVersionados(excluir, raiz).map(claveRuta));
  let validos = 0;
  for (const ruta of porRuta.keys()) if (versionados.has(claveRuta(ruta))) validos++;
  return { tipo: 'ok', ruta: informe, mtimeMs, porRuta, validos, raices: [...raices].sort() };
}

export interface CoberturaDeRama {
  mergeBase: string;
  lectura: LecturaInforme;
  /** null si el informe no se pudo usar (ausente o truncado). */
  cruce: CruceCobertura | null;
}

/** Lineas añadidas desde la merge base de HEAD con `base`, cruzadas con el informe. */
export function coberturaDeRama(raiz: string, base: string, informe: string, excluir: readonly string[]): CoberturaDeRama {
  const mb = mergeBase('HEAD', base, raiz);
  const lectura = leerInformeCobertura(raiz, informe, excluir);
  if (lectura.tipo !== 'ok') return { mergeBase: mb, lectura, cruce: null };
  const anadidas = lineasAnadidas(mb, 'HEAD', excluir, raiz);
  return { mergeBase: mb, lectura, cruce: cruzarCobertura(anadidas, lectura.porRuta, claveRuta, lectura.raices) };
}

/** Lo que la peticion de revision necesita, calculado UNA vez por ronda. */
export type DatosCoberturaRevision =
  | { tipo: 'error'; motivo: string }
  | {
      tipo: 'ok';
      cobertura: CoberturaDeRama;
      base: string;
      /** El informe es anterior al ultimo commit propio de la rama: no corresponde a este codigo. */
      viejo: boolean;
      umbral: number | null;
      comando: string | null;
    };

/** Nunca lanza: un fallo es un aviso en la peticion, no una ronda sin escribir. */
export function datosCoberturaRevision(
  raiz: string,
  base: string,
  informe: string,
  excluir: readonly string[],
  umbral: number | null,
  comando: string | null
): DatosCoberturaRevision {
  try {
    const cobertura = coberturaDeRama(raiz, base, informe, excluir);
    const ultimo = instanteUltimoCommitPropio('HEAD', raiz);
    const lectura = cobertura.lectura;
    // %ct tiene resolucion de segundos: el informe cuenta como nuevo si es del mismo segundo o posterior.
    const viejo = lectura.tipo !== 'ausente' && ultimo !== null && Math.floor(lectura.mtimeMs / 1000) * 1000 < ultimo;
    return { tipo: 'ok', cobertura, base, viejo, umbral, comando };
  } catch (e: unknown) {
    return { tipo: 'error', motivo: e instanceof Error ? e.message : String(e) };
  }
}

/** La seccion de la peticion; con `rutas`, solo esos ficheros (peticion fragmentada por dominio). */
export function seccionCoberturaRevision(d: DatosCoberturaRevision, rutas?: ReadonlySet<string>): string {
  const titulo = '\n## Cobertura de las lineas cambiadas\n\n';
  if (d.tipo === 'error') return `${titulo}[AVISO] No se pudo calcular: ${d.motivo}\n`;
  const { cobertura, base, viejo, umbral, comando } = d;
  const lectura = cobertura.lectura;
  const regenerar = comando === null ? 'regeneralo' : `regeneralo con \`${comando}\``;
  const cabecera =
    `Informe \`${lectura.ruta}\`; lineas añadidas desde la merge base con \`${base}\` ` +
    `(${cobertura.mergeBase.slice(0, 10)}), sin lo excluido del diff. No se ha ejecutado ningun test ` +
    'para esta peticion.' +
    (umbral === null ? '' : ` Umbral de finish: ${umbral} % cubierto (se mide con el informe que regenera finish).`) +
    '\n\n';
  if (lectura.tipo === 'ausente') {
    return `${titulo}${cabecera}[AVISO] No existe el informe: ${regenerar} y repite la peticion si quieres el dato.\n`;
  }
  const fecha = new Date(lectura.mtimeMs).toISOString();
  if (lectura.tipo === 'truncado') {
    return `${titulo}${cabecera}[AVISO] El informe (de ${fecha}) esta cortado (sin end_of_record): no se usa. ${regenerar}.\n`;
  }
  if (viejo) {
    return (
      `${titulo}${cabecera}[AVISO] El informe es de ${fecha}, anterior al ultimo commit de la rama: no ` +
      `corresponde a este codigo y no se listan lineas. ${regenerar} despues de commitear.\n`
    );
  }
  if (lectura.validos === 0) {
    return (
      `${titulo}${cabecera}[AVISO] Ninguna ruta del informe es un fichero del repo fuera de lo excluido ` +
      '(¿mide el codigo compilado, esta vacio, o sus rutas son de otra maquina o relativas a una carpeta que no es la del informe ni una de sus padres?): el informe esta mal configurado y no se usa.\n'
    );
  }
  const cruce = rutas === undefined ? cobertura.cruce : cobertura.cruce === null ? null : filtrarCruce(cobertura.cruce, rutas);
  if (cruce === null) return `${titulo}${cabecera}[AVISO] Sin datos.\n`;
  return (
    `${titulo}${cabecera}Informe de ${fecha}. Cada linea sin cubrir es un hallazgo para el informe de ` +
    'revision: o se anade el test que la ejecuta, o se justifica por que no.\n\n' +
    `${describirCruce(cruce)}\n`
  );
}
