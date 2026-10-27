/**
 * Piezas puras de `taskctl doctor-deploy --crear-tareas` (TASK-067): que
 * tarea sale de un punto que FALLA, como se reconoce una tarea ya creada para
 * ese punto y cuales quedaron huerfanas. No toca disco; lo hace
 * commands/doctor-deploy-tareas.ts.
 *
 * La tarea se escribe solo con texto que el comando controla: el arreglo y la
 * descripcion del catalogo, el motivo de una SONDA y `fichero:linea` de la
 * evidencia (saneado). Nunca el texto libre de un agente: una tarea la lee mas
 * tarde otro agente como instrucciones, y eso seria inyeccion de prompt.
 *
 * Deduplicacion: etiqueta `doctor-deploy:<id-punto>` (sin campo nuevo en el
 * frontmatter). Quien la borra a mano rompe la deduplicacion de ese punto.
 */
import type { ResultadoPunto } from './doctor-deploy.js';

/** Etiqueta comun de todas las tareas creadas por doctor-deploy. */
export const ETIQUETA_DEPLOY = 'doctor-deploy';
const PREFIJO_ETIQUETA = `${ETIQUETA_DEPLOY}:`;

/** Evidencias que se nombran en el objetivo como mucho. */
const MAX_DONDE = 10;
const MAX_LARGO_TEXTO = 400;

export interface TareaDeFalla {
  titulo: string;
  objetivo: string;
  criterios: string[];
  etiquetas: string[];
}

export interface TareaReferida {
  id: string;
  punto: string;
}

export interface TareaHuerfana extends TareaReferida {
  motivo: string;
}

export interface ResumenTareas {
  creadas: TareaReferida[];
  /** Ya existia una tarea abierta para el punto: se reutiliza, no se crea otra. */
  reutilizadas: TareaReferida[];
  /** Tareas abiertas cuyo punto ya da OK o ya no existe. No se cierran: solo se avisa. */
  huerfanas: TareaHuerfana[];
}

export const etiquetaDePunto = (idPunto: string): string => `${PREFIJO_ETIQUETA}${idPunto}`;

/** Id del punto de la etiqueta `doctor-deploy:<id>` de la tarea, o null si no la lleva. */
export function puntoDeEtiquetas(etiquetas: readonly string[]): string | null {
  for (const e of etiquetas) {
    if (e.startsWith(PREFIJO_ETIQUETA) && e.length > PREFIJO_ETIQUETA.length) return e.slice(PREFIJO_ETIQUETA.length);
  }
  return null;
}

/** Una linea de texto sin saltos, sin caracteres de control y sin cabeceras markdown al principio. */
function plano(texto: string): string {
  // eslint-disable-next-line no-control-regex
  const limpio = texto.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^#+\s*/, '');
  return limpio.length > MAX_LARGO_TEXTO ? `${limpio.slice(0, MAX_LARGO_TEXTO - 3)}...` : limpio;
}

/** `fichero:linea` de las evidencias que lo traen, sin repetir y como mucho `MAX_DONDE`. */
function dondeFalla(p: ResultadoPunto): string[] {
  const vistos = new Set<string>();
  for (const e of p.evidencias) {
    if (e.fichero === undefined) continue;
    vistos.add(plano(e.linea === undefined ? e.fichero : `${e.fichero}:${e.linea}`));
  }
  return [...vistos];
}

/** La tarea que corresponde a un punto en FALLA. */
export function componerTarea(p: ResultadoPunto): TareaDeFalla {
  const donde = dondeFalla(p);
  const lineas = [
    `Arreglar el punto "${p.id}" de doctor-deploy (severidad ${p.severidad}): ${plano(p.arreglo)}`,
    `Lo que se comprueba: ${plano(p.descripcion)}`,
  ];
  // El motivo de una sonda lo genera el comando; el de un agente es texto externo y no se copia.
  if (p.origen === 'sonda') lineas.push(`Por que falla: ${plano(p.motivo)}`);
  if (donde.length > 0) {
    lineas.push(`Donde: ${donde.slice(0, MAX_DONDE).join(', ')}${donde.length > MAX_DONDE ? ` y ${donde.length - MAX_DONDE} mas` : ''}`);
  }
  const criterio =
    `taskctl doctor-deploy da OK en el punto ${p.id}` +
    (p.metodo === 'juicio' ? ' (es un punto de juicio: lo decide el agente revisor al ejecutar la skill doctor-deploy)' : '');
  return {
    titulo: `Arreglar ${p.id} (doctor-deploy)`,
    objetivo: lineas.join('\n'),
    criterios: [criterio],
    etiquetas: [ETIQUETA_DEPLOY, etiquetaDePunto(p.id)],
  };
}

/**
 * Tareas abiertas con etiqueta `doctor-deploy:<id>` cuyo punto ya da OK, ya no aplica o ya no
 * existe en el catalogo. Una con el punto aun en FALLA (o sin verificar) no es huerfana.
 */
export function detectarHuerfanas(
  abiertas: ReadonlyArray<{ id: string; etiquetas: readonly string[] }>,
  puntos: readonly ResultadoPunto[]
): TareaHuerfana[] {
  const res: TareaHuerfana[] = [];
  for (const t of abiertas) {
    const idPunto = puntoDeEtiquetas(t.etiquetas);
    if (idPunto === null) continue;
    const p = puntos.find((x) => x.id === idPunto);
    if (p === undefined) res.push({ id: t.id, punto: idPunto, motivo: 'el punto ya no existe en el catalogo' });
    else if (p.estado === 'ok') res.push({ id: t.id, punto: idPunto, motivo: 'el punto ya da OK' });
    else if (p.estado === 'no-aplica') res.push({ id: t.id, punto: idPunto, motivo: 'el punto ya no aplica a este proyecto' });
  }
  return res;
}
