/**
 * TASK-153b (Regla 4D al crear): candidatos 4D de una ronda de revision.
 *
 * Pistas para el revisor, no hallazgos: las definiciones que la tarea anade y
 * las que ya existian en la rama base con nombre igual o parecido, las nuevas
 * que se parecen entre si (posible duplicacion), y los tests nuevos cuyo
 * nombre promete algo comprobable (a mutar: posible disfraz). La auditoria de
 * TASK-141 encontro 102 duplicaciones y 21 disfraces.
 *
 * Puro: recibe texto de diffs y de `git grep` y devuelve datos y markdown. La
 * decision de «que es una definicion» vive SOLO aqui: el patron grueso que
 * usa `git grep` (`PATRON_GREP_DEFINICION`) y las extensiones de codigo
 * (`EXTENSIONES_CODIGO`) salen de este modulo (MENOR-6 de su revision).
 */
import { distanciaEdicion } from './sugerencia.js';

export const SECCION_CANDIDATOS_4D = '## Candidatos 4D';

/** Una definicion (funcion, clase, constante) en un fichero. */
export interface Definicion {
  nombre: string;
  fichero: string;
  /** Linea en el fichero (la del lado nuevo del diff, o la de `git grep`). */
  linea: number;
}

export interface CandidatoDuplicado {
  nueva: Definicion;
  existentes: Definicion[];
}

export interface Candidatos4D {
  /** Nuevas parecidas a una que ya existia en la rama base (como mucho MAX_DEFINICIONES). */
  duplicados: CandidatoDuplicado[];
  /** Cuantas nuevas tenian algun parecido en la base (sin tope): para el «y N mas». */
  totalDuplicados: number;
  /** Pares de nuevas parecidas entre si (MENOR-2): la misma tarea escribiendo dos veces lo mismo. */
  entreNuevas: [Definicion, Definicion][];
  totalEntreNuevas: number;
  /** Tests nuevos cuyo nombre promete algo comprobable (como mucho MAX_TESTS). */
  testsAMutar: Definicion[];
  totalTests: number;
  /**
   * Comparaciones de nombres hechas contra las existentes: lo que cuesta la
   * ronda. Con el indice por longitud queda muy por debajo de nuevas x
   * existentes (lo fija un test sin depender del reloj).
   */
  comparaciones: number;
}

/** Extensiones de codigo donde se buscan definiciones (TS/JS, Rust, Python, Java/Kotlin/C#, bash). */
export const EXTENSIONES_CODIGO: readonly string[] = [
  'ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs', 'rs', 'py', 'java', 'kt', 'cs', 'sh', 'bash',
];

const EXT_CODIGO = new RegExp(`\\.(?:${EXTENSIONES_CODIGO.join('|')})$`, 'i');

/**
 * Patron ERE grueso para `git grep -E`: preselecciona lineas con pinta de
 * definicion. El filtro fino es `PATRONES_DEFINICION`; todo lo que este
 * reconoce tiene que pasar antes por este (lo comprueba un test por familia).
 */
export const PATRON_GREP_DEFINICION =
  '(function|class|fn|def|const|let|var|struct|interface|record|enum)[[:space:]]+[A-Za-z_$]' +
  '|^[[:space:]]*[A-Za-z_][A-Za-z0-9_-]*[[:space:]]*\\(\\)[[:space:]]*\\{';

/** Patrones de definicion por familia de lenguaje. El grupo 1 es el nombre. */
const PATRONES_DEFINICION: readonly RegExp[] = [
  /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/,
  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=]+)?=>/,
  /^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
  /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_][\w]*)/,
  /^\s*(?:async\s+)?def\s+([A-Za-z_][\w]*)/,
  /^\s*(?:pub(?:\([^)]*\))?|public|private|protected|internal)?\s*(?:static\s+)?(?:final\s+|sealed\s+|abstract\s+)?(?:class|interface|record|struct|enum)\s+([A-Za-z_][\w]*)/,
  /^\s*(?:function\s+)?([A-Za-z_][\w-]*)\s*\(\)\s*\{/,
];

/** Nombres de menos letras no se consideran (ruido: `i`, `fn`, `ok`). */
const LONGITUD_MINIMA = 3;

function nombreDeDefinicion(linea: string): string | null {
  for (const re of PATRONES_DEFINICION) {
    const m = re.exec(linea);
    if (m?.[1] !== undefined) return m[1].length >= LONGITUD_MINIMA ? m[1] : null;
  }
  return null;
}

/** Recorre un diff unificado y devuelve las lineas anadidas con su fichero y numero de linea nuevo. */
function lineasAnadidas(diff: string): { fichero: string; linea: number; texto: string }[] {
  const salida: { fichero: string; linea: number; texto: string }[] = [];
  let fichero = '';
  let nueva = 0;
  for (const l of diff.split(/\r?\n/)) {
    if (l.startsWith('+++ ')) {
      const ruta = l.slice(4).trim();
      fichero = ruta === '/dev/null' ? '' : ruta.replace(/^b\//, '');
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
    if (hunk !== null) {
      nueva = Number(hunk[1]);
      continue;
    }
    if (fichero === '' || l.startsWith('--- ')) continue;
    if (l.startsWith('+')) {
      salida.push({ fichero, linea: nueva, texto: l.slice(1) });
      nueva++;
    } else if (l.startsWith(' ')) {
      nueva++;
    }
  }
  return salida;
}

/** Definiciones que el diff anade (solo ficheros de codigo). */
export function definicionesNuevas(diff: string): Definicion[] {
  const vistas = new Set<string>();
  const salida: Definicion[] = [];
  for (const { fichero, linea, texto } of lineasAnadidas(diff)) {
    if (!EXT_CODIGO.test(fichero)) continue;
    const nombre = nombreDeDefinicion(texto);
    if (nombre === null) continue;
    const clave = `${fichero}\0${nombre}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    salida.push({ nombre, fichero, linea });
  }
  return salida;
}

/**
 * Definiciones existentes a partir de la salida de
 * `git grep -n -I -E <patron> <ref> -- ...` (lineas `ref:fichero:linea:texto`
 * o `fichero:linea:texto`).
 */
export function definicionesDeGrep(salida: string, ref?: string): Definicion[] {
  const defs: Definicion[] = [];
  const prefijo = ref === undefined ? '' : `${ref}:`;
  for (const raw of salida.split(/\r?\n/)) {
    if (raw === '') continue;
    const l = prefijo !== '' && raw.startsWith(prefijo) ? raw.slice(prefijo.length) : raw;
    const m = /^(.+?):(\d+):(.*)$/.exec(l);
    if (m === null) continue;
    const [, fichero, num, texto] = m as unknown as [string, string, string, string];
    if (!EXT_CODIGO.test(fichero)) continue;
    const nombre = nombreDeDefinicion(texto);
    if (nombre !== null) defs.push({ nombre, fichero, linea: Number(num) });
  }
  return defs;
}

/** Forma comparable de un nombre: sin mayusculas ni separadores. */
function normal(nombre: string): string {
  return nombre.toLowerCase().replace(/[_$-]/g, '');
}

/** Distancia de edicion tolerada para dos nombres normalizados: `corto` es la longitud del menor. */
function tolerancia(corto: number): number {
  return Math.max(1, Math.floor(corto / 5));
}

/** Por debajo de esta longitud solo cuenta la igualdad exacta (normalizada). */
const CORTO_PARA_DISTANCIA = 5;

/** ¿Se parecen lo bastante dos nombres como para sospechar duplicacion? */
export function nombresParecidos(a: string, b: string): boolean {
  const na = normal(a);
  const nb = normal(b);
  if (na === nb) return true;
  const corto = Math.min(na.length, nb.length);
  if (corto < CORTO_PARA_DISTANCIA) return false;
  // IMP-1: la distancia nunca baja de la diferencia de longitudes: se
  // descarta sin calcular.
  if (Math.abs(na.length - nb.length) > tolerancia(corto)) return false;
  return distanciaEdicion(na, nb) <= tolerancia(corto);
}

/**
 * IMP-1 de la revision: indice de las existentes por longitud del nombre
 * normalizado. Para una nueva solo se comparan las de longitud compatible
 * (la distancia nunca baja de la diferencia de longitudes), asi que el coste
 * deja de ser nuevas x existentes.
 */
function indicePorLongitud(defs: readonly Definicion[]): Map<number, Definicion[]> {
  const indice = new Map<number, Definicion[]>();
  for (const d of defs) {
    const n = normal(d.nombre).length;
    const cubo = indice.get(n);
    if (cubo === undefined) indice.set(n, [d]);
    else cubo.push(d);
  }
  return indice;
}

function parecidasEn(nueva: Definicion, indice: Map<number, Definicion[]>, cuenta = { n: 0 }): Definicion[] {
  const n = normal(nueva.nombre).length;
  const margen = tolerancia(n);
  const salida: Definicion[] = [];
  for (let len = n - margen; len <= n + margen; len++) {
    for (const e of indice.get(len) ?? []) {
      if (e.fichero === nueva.fichero && e.nombre === nueva.nombre) continue;
      cuenta.n++;
      if (nombresParecidos(nueva.nombre, e.nombre)) salida.push(e);
    }
  }
  return salida;
}

/** Palabras que hacen de un nombre de test una promesa comprobable (ver disfraz-tests.md). */
const PROMESAS = [
  'sin efectos', 'no toca', 'intacto', 'limpio', 'antes de', 'nunca', 'siempre', 'solo ', 'ordena',
  'no cambia', 'no deja', 'no pisa', 'no borra', 'error claro', 'exacto', 'exactamente', 'ninguno',
  'without', 'never', 'always', 'only ', 'unchanged', 'untouched', 'sorted', 'before',
];

const PATRONES_TEST: readonly RegExp[] = [
  /^\s*(?:test|it|describe)(?:\.\w+)?\(\s*(['"`])(.+?)\1/,
  /^\s*(?:async\s+)?(?:fn|def)\s+(test_[\w]+)/,
];

/** Tests que el diff anade con un nombre que promete algo comprobable. */
export function testsQuePrometen(diffTests: string): Definicion[] {
  const salida: Definicion[] = [];
  for (const { fichero, linea, texto } of lineasAnadidas(diffTests)) {
    let nombre: string | null = null;
    for (const re of PATRONES_TEST) {
      const m = re.exec(texto);
      if (m !== null) {
        nombre = (m[2] ?? m[1] ?? '').replace(/_/g, ' ');
        break;
      }
    }
    if (nombre === null) continue;
    const bajo = ` ${nombre.toLowerCase()} `;
    if (PROMESAS.some((p) => bajo.includes(p))) salida.push({ nombre, fichero, linea });
  }
  return salida;
}

/** Topes para no inflar la peticion; lo que pasa se cuenta («y N mas»). */
export const MAX_DEFINICIONES = 15;
export const MAX_PARECIDOS = 3;
export const MAX_TESTS = 15;

export function candidatos4D(diffCodigo: string, diffTests: string, existentes: readonly Definicion[]): Candidatos4D {
  const nuevas = definicionesNuevas(diffCodigo);
  const indice = indicePorLongitud(existentes);
  const todos: CandidatoDuplicado[] = [];
  const cuenta = { n: 0 };
  for (const nueva of nuevas) {
    const parecidas = parecidasEn(nueva, indice, cuenta);
    if (parecidas.length > 0) todos.push({ nueva, existentes: parecidas });
  }
  // MENOR-2: nuevas parecidas entre si (distinto nombre o distinto fichero).
  const pares: [Definicion, Definicion][] = [];
  const indiceNuevas = indicePorLongitud(nuevas);
  for (const a of nuevas) {
    for (const b of parecidasEn(a, indiceNuevas)) {
      const orden = `${a.fichero}\0${a.nombre}` < `${b.fichero}\0${b.nombre}`;
      if (orden) pares.push([a, b]);
    }
  }
  const tests = testsQuePrometen(diffTests);
  return {
    duplicados: todos.slice(0, MAX_DEFINICIONES),
    totalDuplicados: todos.length,
    entreNuevas: pares.slice(0, MAX_DEFINICIONES),
    totalEntreNuevas: pares.length,
    testsAMutar: tests.slice(0, MAX_TESTS),
    totalTests: tests.length,
    comparaciones: cuenta.n,
  };
}

/** `nombre` (fichero:linea): como se cita una definicion en las listas 4D. */
export const loc = (d: Definicion): string => `\`${d.nombre}\` (${d.fichero}:${String(d.linea)})`;

function masAlla(mostrados: number, total: number, tope: number): string {
  return total > mostrados ? `- ... y ${String(total - mostrados)} mas (tope ${String(tope)})\n` : '';
}

/** La seccion `## Candidatos 4D` de la peticion. */
export function seccionCandidatos4D(c: Candidatos4D): string {
  const cabecera =
    `${SECCION_CANDIDATOS_4D}\n\n` +
    'Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).\n\n';
  if (c.totalDuplicados === 0 && c.totalEntreNuevas === 0 && c.totalTests === 0) {
    return `${cabecera}Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.\n\n`;
  }
  let texto = cabecera;
  if (c.totalDuplicados > 0) {
    texto +=
      '### Posible duplicacion con lo que ya existia\n\n' +
      'Definiciones nuevas con nombre igual o parecido a otra de la rama base. ' +
      'Mira si hacen lo mismo con pequenas diferencias (duplicacion real = IMPORTANTE).\n\n' +
      c.duplicados
        .map((d) => {
          const resto = d.existentes.length > MAX_PARECIDOS ? ` y ${String(d.existentes.length - MAX_PARECIDOS)} mas` : '';
          return `- ${loc(d.nueva)} ~ ${d.existentes.slice(0, MAX_PARECIDOS).map(loc).join(', ')}${resto}\n`;
        })
        .join('') +
      masAlla(c.duplicados.length, c.totalDuplicados, MAX_DEFINICIONES) +
      '\n';
  }
  if (c.totalEntreNuevas > 0) {
    texto +=
      '### Posible duplicacion dentro de la tarea\n\n' +
      'Definiciones nuevas parecidas entre si: la misma tarea puede estar escribiendo dos veces lo mismo.\n\n' +
      c.entreNuevas.map(([a, b]) => `- ${loc(a)} ~ ${loc(b)}\n`).join('') +
      masAlla(c.entreNuevas.length, c.totalEntreNuevas, MAX_DEFINICIONES) +
      '\n';
  }
  if (c.totalTests > 0) {
    texto +=
      '### Tests a mutar\n\n' +
      'Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ' +
      'ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).\n\n' +
      c.testsAMutar.map((t) => `- «${t.nombre}» (${t.fichero}:${String(t.linea)})\n`).join('') +
      masAlla(c.testsAMutar.length, c.totalTests, MAX_TESTS) +
      '\n';
  }
  return texto;
}
