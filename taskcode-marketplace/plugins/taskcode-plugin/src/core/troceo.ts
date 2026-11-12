/**
 * TASK-121: troceo de una tarea en partes TASK-NNNa, TASK-NNNb... que
 * comparten la rama de la tarea. Puro: lee el plan y el cuerpo de la tarea
 * y devuelve lo que hay que escribir; `commands/trocear.ts` lo escribe.
 *
 * El plan declara las partes en una seccion `## Troceo`:
 *
 *     ## Troceo
 *
 *     ### Parte a: IDs con letra en todo el CLI
 *     Objetivo de la parte (una o varias lineas).
 *     Duracion estimada: 40 min
 *     - [ ] criterio comprobable
 *
 * Trocear lo decide una persona (regla de una hora): este modulo no decide
 * nada, solo valida que las partes esten completas.
 */
import type { Task } from './task.js';
import { leerDuracionEstimada, type LecturaDuracion } from './duracion-estimada.js';

export class TroceoError extends Error {}

export interface ParteTroceo {
  /** Letra de la parte: a, b, c... */
  letra: string;
  titulo: string;
  objetivo: string;
  criterios: string[];
  duracion: LecturaDuracion;
}

/** `TASK-121` -> true; `TASK-121a` -> false (una parte no se vuelve a trocear). */
export function esIdTroceable(id: string): boolean {
  return /^TASK-\d{3,}$/.test(id);
}

/** `TASK-121b` -> `TASK-121`; un ID sin letra se devuelve tal cual. */
export function idRaiz(id: string): string {
  return id.replace(/^(TASK-\d{3,})[a-z]$/, '$1');
}

const CABECERA_TROCEO_RE = /^##\s+troceo\s*$/i;
const CABECERA_PARTE_RE = /^###\s+parte\s+([a-z])\s*[:.\-–—]\s*(.+?)\s*$/i;
const CRITERIO_RE = /^\s*[-*]\s+\[[ xX]\]\s+(.*\S)\s*$/;
const DURACION_RE = /duraci[oó]n estimada\s*[*_`]*\s*:/i;

/** Las lineas de la seccion `## Troceo`, fuera de bloques de codigo; null si no hay seccion. */
function lineasDeTroceo(plan: string): string[] | null {
  const lineas = plan.replace(/\r/g, '').split('\n');
  let enBloque = false;
  let dentro = false;
  let encontrada = false;
  const out: string[] = [];
  for (const l of lineas) {
    if (/^\s*(```|~~~)/.test(l)) {
      enBloque = !enBloque;
      if (dentro) out.push(l);
      continue;
    }
    if (!enBloque && /^##\s/.test(l)) {
      if (dentro) break;
      if (CABECERA_TROCEO_RE.test(l)) {
        dentro = true;
        encontrada = true;
      }
      continue;
    }
    if (dentro) out.push(l);
  }
  return encontrada ? out : null;
}

/**
 * Las partes que declara el plan. Lanza TroceoError si no hay seccion
 * `## Troceo`, si hay menos de dos partes, si las letras no van seguidas desde
 * la `a` o si una parte no trae objetivo o criterios.
 */
export function leerPartes(plan: string, id: string): ParteTroceo[] {
  const lineas = lineasDeTroceo(plan);
  if (lineas === null) {
    throw new TroceoError(
      `${id}: el plan no tiene seccion "## Troceo". Anadela con un bloque "### Parte a: <titulo>", ` +
        '"### Parte b: <titulo>"... y en cada uno su objetivo y sus criterios ("- [ ] ...").'
    );
  }
  const partes: { letra: string; titulo: string; cuerpo: string[] }[] = [];
  let enBloque = false;
  for (const l of lineas) {
    if (/^\s*(```|~~~)/.test(l)) enBloque = !enBloque;
    const m = enBloque ? null : CABECERA_PARTE_RE.exec(l);
    if (m !== null) {
      partes.push({ letra: (m[1] as string).toLowerCase(), titulo: m[2] as string, cuerpo: [] });
      continue;
    }
    const ultima = partes[partes.length - 1];
    if (ultima !== undefined) ultima.cuerpo.push(l);
  }
  if (partes.length < 2) {
    throw new TroceoError(
      `${id}: la seccion "## Troceo" declara ${String(partes.length)} parte(s); trocear pide al menos dos ` +
        '("### Parte a: ...", "### Parte b: ...").'
    );
  }
  return partes.map((p, i) => {
    const esperada = String.fromCharCode(97 + i);
    if (p.letra !== esperada) {
      throw new TroceoError(
        `${id}: la parte ${String(i + 1)} se llama "${p.letra}" y deberia ser "${esperada}": ` +
          'las partes van seguidas desde la a (a, b, c...).'
      );
    }
    const criterios: string[] = [];
    const objetivo: string[] = [];
    for (const l of p.cuerpo) {
      const c = CRITERIO_RE.exec(l);
      if (c !== null) criterios.push(c[1] as string);
      else if (!DURACION_RE.test(l)) objetivo.push(l);
    }
    const textoObjetivo = objetivo.join('\n').trim();
    if (textoObjetivo === '') {
      throw new TroceoError(`${id}: la parte ${p.letra} ("${p.titulo}") no tiene objetivo: escribe que entrega.`);
    }
    if (criterios.length === 0) {
      throw new TroceoError(
        `${id}: la parte ${p.letra} ("${p.titulo}") no tiene criterios de aceptacion ("- [ ] ...").`
      );
    }
    return {
      letra: p.letra,
      titulo: p.titulo,
      objetivo: textoObjetivo,
      criterios,
      duracion: leerDuracionEstimada(p.cuerpo.join('\n')),
    };
  });
}

function citar(texto: string): string {
  return texto
    .split(/\r?\n/)
    .map((l) => (l.trim() === '' ? '>' : `> ${l.trimEnd()}`))
    .join('\n');
}

function objetivoDeParte(task: Task, parte: ParteTroceo, ids: readonly string[]): string {
  return (
    `Parte ${parte.letra} del troceo de ${task.id} (${task.titulo}), partes ${ids.join(', ')} ` +
    `en la rama ${task.rama}.\n\n${parte.objetivo}`
  );
}

function criteriosMd(criterios: readonly string[]): string {
  return criterios.map((c) => `- [ ] ${c}`).join('\n');
}

const OBJETIVO_RE = /^##\s+objetivo\s*$/i;
const CRITERIOS_RE = /^##\s+criterios de aceptaci[oó]n\s*$/i;

/**
 * Reemplaza el contenido de la seccion cuya cabecera casa con `cabecera`
 * (hasta la siguiente `## `). Si no existe, la anade al principio en el orden
 * de la plantilla. Conserva las demas secciones (`## Transiciones`, etc.).
 */
function reemplazarSeccion(body: string, cabecera: RegExp, titulo: string, contenido: string): string {
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const lineas = body.split(/\r?\n/);
  const ini = lineas.findIndex((l) => cabecera.test(l.trim()));
  const bloque = [titulo, '', ...contenido.split('\n'), ''];
  if (ini === -1) return [...bloque, ...lineas].join(eol);
  let fin = ini + 1;
  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
  return [...lineas.slice(0, ini), ...bloque, ...lineas.slice(fin)].join(eol);
}

export interface PlanTroceo {
  /** La tarea original convertida en la parte a (mismo estado, otro ID). */
  parteA: { task: Task; body: string };
  /** Las partes b, c... nuevas, en 00-planificadas. */
  resto: { task: Task; body: string }[];
  ids: string[];
}

/**
 * Lo que hay que escribir para trocear `task` en `partes`. La parte a es la
 * propia tarea (conserva su registro de transiciones y su plan); las demas
 * nacen planificadas, con la misma rama y dependiendo de la anterior.
 */
export function planificarTroceo(task: Task, body: string, partes: readonly ParteTroceo[], hoy: string): PlanTroceo {
  if (!esIdTroceable(task.id)) {
    throw new TroceoError(`${task.id}: ya es una parte de un troceo; una parte no se vuelve a trocear.`);
  }
  const ids = partes.map((p) => `${task.id}${p.letra}`);
  const [primera, ...siguientes] = partes as [ParteTroceo, ...ParteTroceo[]];
  const original = body.match(/^##\s+objetivo\s*$/im) === null ? '' : extraerObjetivo(body);
  const objetivoA =
    objetivoDeParte(task, primera, ids) + (original === '' ? '' : `\n\nObjetivo de la tarea entera:\n\n${citar(original)}`);
  let bodyA = reemplazarSeccion(body, OBJETIVO_RE, '## Objetivo', objetivoA);
  bodyA = reemplazarSeccion(bodyA, CRITERIOS_RE, '## Criterios de aceptacion', criteriosMd(primera.criterios));
  const parteA = {
    task: { ...task, id: ids[0] as string, titulo: `${primera.titulo} (parte a de ${task.id})`, actualizado: hoy },
    body: bodyA,
  };
  const resto = siguientes.map((p, i) => ({
    task: {
      ...task,
      id: ids[i + 1] as string,
      titulo: `${p.titulo} (parte ${p.letra} de ${task.id})`,
      estado: 'planificada' as const,
      plan_aprobado: false,
      asignado_a: null,
      ultimo_commit_revisado: null,
      tokens_diseno: null,
      tokens_implementacion: null,
      tokens_revision: null,
      creado: hoy,
      actualizado: hoy,
      dependencias: [ids[i] as string],
    },
    body: `## Objetivo\n\n${objetivoDeParte(task, p, ids)}\n\n## Criterios de aceptacion\n${criteriosMd(p.criterios)}\n`,
  }));
  return { parteA, resto, ids };
}

function extraerObjetivo(body: string): string {
  const lineas = body.replace(/\r/g, '').split('\n');
  const ini = lineas.findIndex((l) => OBJETIVO_RE.test(l.trim()));
  if (ini === -1) return '';
  let fin = ini + 1;
  while (fin < lineas.length && !/^##\s/.test(lineas[fin] as string)) fin++;
  return lineas.slice(ini + 1, fin).join('\n').trim();
}

/**
 * El plan de la parte a tras trocear: su duracion estimada pasa a la de la
 * parte a (si la trae) y se anota quien acepto el troceo y cuando.
 */
export function planTrasTroceo(plan: string, partes: readonly ParteTroceo[], ids: readonly string[], hoy: string): string {
  const eol = plan.includes('\r\n') ? '\r\n' : '\n';
  const primera = partes[0] as ParteTroceo;
  let texto = plan;
  if (primera.duracion.tipo === 'ok') {
    const entera = leerDuracionEstimada(plan);
    const antes = entera.tipo === 'ok' ? `${String(entera.minutos)} min` : 'sin cifra legible';
    let hecho = false;
    let enBloque = false;
    texto = plan
      .split(/\r?\n/)
      .map((l) => {
        if (/^\s*(```|~~~)/.test(l)) enBloque = !enBloque;
        if (hecho || enBloque || !DURACION_RE.test(l) || !/^\s*(?:[-*+>#]\s*)*[*_`]*\s*duraci[oó]n estimada/i.test(l)) return l;
        hecho = true;
        return `Duracion estimada: ${String((primera.duracion as { minutos: number }).minutos)} min (parte a del troceo; la tarea entera estimaba ${antes})`;
      })
      .join(eol);
  }
  const base = texto.replace(/(\r?\n)*$/, '');
  return (
    `${base}${eol}${eol}## Troceo aceptado${eol}${eol}` +
    `Troceo aceptado por una persona el ${hoy}: ${ids.join(', ')}, todas en la misma rama. ` +
    `Este plan es el de ${ids[0] as string}; las demas partes se planifican al empezarlas.${eol}`
  );
}
