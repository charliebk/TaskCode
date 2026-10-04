/**
 * Validacion determinista del enunciado de una tarea — TASK-043
 * (auditoria del 2026-10-03, C2, C6 y D5). Modulo puro: recibe texto o
 * secciones ya extraidas y devuelve motivos; nunca lanza.
 *
 * Lo que bloquea y lo que solo avisa salio de calibrar contra las tareas
 * cerradas del propio repo (rol de riesgos del brainstorm): la regla
 * estricta «cada criterio cita algo comprobable» habria rechazado criterios
 * de 13 de 27 tareas que no eran vagos sino de comportamiento («sin nada
 * que commitear no se crea commit vacio»). Por eso:
 * - BLOQUEA lo que de verdad deja la tarea sin definir: objetivo vacio, sin
 *   criterios, un criterio vacio, mas de 12 criterios (las tres tareas con
 *   13 o mas fueron las de peticiones de revision de 110-160 KB), o un
 *   criterio hecho solo de palabras vagas sin nada comprobable.
 * - AVISA de lo que conviene mirar: 9 a 12 criterios y criterios sin ancla.
 */
import type { GrupoCriterios, SeccionesTarea } from './tarea-body.js';

export const MAX_CRITERIOS = 12;
export const AVISO_CRITERIOS = 8;

export interface ResultadoValidacion {
  bloqueos: string[];
  avisos: string[];
  /** TASK-044: bloquea por numero de criterios (plan propone particion). */
  demasiadoGrande: boolean;
}

/** Titulos de grupo que no son un frente sino criterios de todos (TASK-044). */
const GRUPOS_TRANSVERSALES = ['transversal', 'transversales', 'comun', 'comunes', 'general', 'generales'];

function esTransversal(g: GrupoCriterios): boolean {
  if (g.titulo === null) return true;
  // Basta la primera palabra: «Comunes a ambos» o «Transversal (suite)»
  // tambien son transversales (MEN-3 de la revision de TASK-044).
  const primera = normalizar(g.titulo).split(/[^a-z]+/).find((p) => p !== '') ?? '';
  return GRUPOS_TRANSVERSALES.includes(primera);
}

/** Grupos que son un frente propio: con titulo y no transversales. */
export function frentesDe(grupos: readonly GrupoCriterios[]): GrupoCriterios[] {
  return grupos.filter((g) => !esTransversal(g));
}

/** Grupos cuyos criterios valen para todos los frentes (y los sueltos). */
export function gruposComunes(grupos: readonly GrupoCriterios[]): GrupoCriterios[] {
  return grupos.filter(esTransversal);
}

/**
 * Palabras que, solas, no dicen como comprobar nada. Lista construida a
 * mano: en los criterios reales del repo no aparece ninguna (la
 * calibracion no tiene casos con los que validarla).
 */
const PALABRAS_VAGAS = [
  'mejorar', 'mejora', 'mejorado', 'mejorada', 'robusto', 'robusta', 'correctamente',
  'adecuado', 'adecuada', 'adecuadamente', 'bien', 'optimizar', 'optimizado', 'optimizada',
  'limpio', 'limpia', 'limpiar', 'eficiente', 'eficientes', 'rapido', 'rapida', 'facil',
  'mantenible', 'escalable', 'calidad', 'correcto', 'correcta', 'funciona', 'funcione',
  'funcionen',
];

/** Palabras vacias que no cuentan al decidir si un criterio es «solo vago». */
const PALABRAS_VACIAS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'que', 'y', 'o', 'en', 'se', 'es', 'mas',
  'muy', 'con', 'para', 'por', 'su', 'sus', 'lo', 'al', 'debe', 'deberia', 'ser', 'esta', 'este',
  'sea', 'sean', 'quede', 'queden', 'resulte',
  'codigo', 'sistema', 'todo', 'toda',
]);

/** Comandos que cuentan como ancla aunque vayan sin comillas invertidas. */
const COMANDOS = ['taskctl', 'git', 'npm', 'pnpm', 'node', 'bash', 'npx'];

function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * true si el criterio cita algo comprobable: codigo entre comillas
 * invertidas, una ruta (`/` o una extension), un flag `--x`, un comando,
 * un numero que no sea parte de un ID o seccion, o una mencion a tests.
 */
export function tieneAncla(criterio: string): boolean {
  if (/`[^`]+`/.test(criterio)) return true;
  if (/(^|\s)--[a-z]/i.test(criterio)) return true;
  // Ruta: dos barras como minimo (`src/core/x`); con una sola, «y/o» o
  // «si/no» pasarian por ancla (MEN-2 de la revision).
  if (/[\w.-]+\/[\w.-]+\/[\w./-]+/.test(criterio) || /\b[\w-]+\.(ts|js|mjs|md|sh|json|yml|yaml|java|cs|vue|py)\b/i.test(criterio)) {
    return true;
  }
  const n = normalizar(criterio);
  if (/\b(test|tests|prueba|pruebas|suite|mutante|mutantes)\b/.test(n)) return true;
  if (COMANDOS.some((c) => new RegExp(`\\b${c}\\b`).test(n))) return true;
  // Numeros, pero no los de un ID, una seccion o una sigla con digito
  // (TASK-018, §8.3, AC1, C6, «seccion 14»), que pasan el lint sin
  // decir nada medible.
  const sinIds = n
    .replace(/\btask-\d+\b/g, ' ')
    .replace(/§\s*[\d.]+/g, ' ')
    .replace(/\bseccion\s+[\d.]+/g, ' ')
    .replace(/\b[a-z]{1,3}\d+\b/g, ' ');
  return /\d/.test(sinIds);
}

/** true si, quitando palabras vacias, todo lo que queda son palabras vagas. */
export function esSoloVago(criterio: string): boolean {
  const palabras = normalizar(criterio)
    .split(/[^a-z0-9]+/)
    .filter((p) => p !== '' && !PALABRAS_VACIAS.has(p));
  if (palabras.length === 0) return false;
  return palabras.every((p) => PALABRAS_VAGAS.includes(p));
}

/** Bloqueos y avisos del enunciado (Objetivo y criterios de aceptacion). */
export function validarEnunciado(s: SeccionesTarea): ResultadoValidacion {
  const bloqueos: string[] = [];
  const avisos: string[] = [];
  if (s.objetivo.trim() === '') {
    bloqueos.push('el "## Objetivo" esta vacio');
  }
  const criterios = s.criterios;
  if (criterios.length === 0) {
    bloqueos.push('no hay ningun criterio de aceptacion');
  }
  criterios.forEach((c, i) => {
    if (c.trim() === '') bloqueos.push(`el criterio ${String(i + 1)} esta vacio`);
  });
  if (criterios.length > MAX_CRITERIOS) {
    bloqueos.push(
      `tiene ${String(criterios.length)} criterios (mas de ${String(MAX_CRITERIOS)}): es demasiado ` +
        'grande para una tarea; partela en varias'
    );
  } else if (criterios.length > AVISO_CRITERIOS) {
    avisos.push(
      `tiene ${String(criterios.length)} criterios: por encima de ${String(AVISO_CRITERIOS)}, ` +
        'las revisiones se alargan; valora partirla'
    );
  }
  // TASK-044: varios frentes con 12 criterios o menos AVISAN, no bloquean
  // (decision 1 del plan: el bloqueo no tendria salida, y agrupar por capas
  // una sola tarea es legitimo).
  const frentes = frentesDe(s.grupos ?? []);
  if (criterios.length <= MAX_CRITERIOS && frentes.length >= 2) {
    avisos.push(
      `tiene ${String(frentes.length)} frentes (${frentes.map((g) => `«${g.titulo ?? ''}»`).join(', ')}): ` +
        'si son independientes, valora partirla en una tarea por frente'
    );
  }
  const vagos = criterios.filter((c) => c.trim() !== '' && esSoloVago(c) && !tieneAncla(c));
  for (const c of vagos) {
    bloqueos.push(`el criterio «${c}» solo dice palabras vagas: di como se comprueba`);
  }
  const sinAncla = criterios.filter((c) => c.trim() !== '' && !tieneAncla(c) && !vagos.includes(c));
  if (sinAncla.length > 0) {
    avisos.push(
      `${String(sinAncla.length)} criterio(s) no citan nada comprobable (un comando, una ruta, ` +
        `un numero, codigo o un test): ${sinAncla.map((c) => `«${c}»`).join('; ')}`
    );
  }
  return { bloqueos, avisos, demasiadoGrande: criterios.length > MAX_CRITERIOS };
}

/**
 * true si un plan-final.md no tiene contenido propio: quitando las
 * cabeceras y las lineas que ya trae la plantilla, no queda nada. Se
 * compara contra las plantillas dadas (las de 0, 1 y N roles), no contra
 * textos copiados aqui, para que siga valiendo si la plantilla cambia.
 */
export function planEsEsqueleto(contenido: string, plantillas: readonly string[]): boolean {
  const lineasDe = (t: string): string[] =>
    t
      .replace(/\r/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');
  const dePlantilla = new Set(plantillas.flatMap(lineasDe));
  const propias = lineasDe(contenido).filter((l) => !/^#{1,6}\s/.test(l) && !dePlantilla.has(l));
  return propias.length === 0;
}

/** Criterios normales sin marcar (las casillas de `### Tras el cierre` no cuentan). */
export function casillasSinMarcar(body: string): string[] {
  const lineas = body.replace(/\r/g, '').split('\n');
  const pendientes: string[] = [];
  let enCriterios = false;
  let enTrasCierre = false;
  for (const l of lineas) {
    const cab = /^ {0,3}(#{2,6})\s+(.*?)\s*#*\s*$/.exec(l);
    if (cab !== null) {
      const nivel = (cab[1] as string).length;
      const titulo = normalizar(cab[2] as string);
      if (nivel === 2) {
        enCriterios = titulo === 'criterios de aceptacion';
        enTrasCierre = false;
      } else if (enCriterios) {
        enTrasCierre = titulo === 'tras el cierre';
      }
      continue;
    }
    if (!enCriterios || enTrasCierre) continue;
    const m = /^\s*[-*]\s+\[ \]\s*(.*)$/.exec(l);
    if (m !== null) pendientes.push((m[1] ?? '').trim());
  }
  return pendientes;
}
