/**
 * Puerta de cobertura en `taskctl finish` — TASK-074 (freno 8). Corre justo
 * despues de la puerta de verificacion, que acaba de regenerar el informe, y
 * antes de la de held-out (cuyo comando podria reescribir el mismo informe
 * con otra suite). Mismos caminos que ellas: abrir el MR o ejecutar el script.
 *
 * Decisiones de Carlos en el plan:
 * - `umbral_cobertura` e `informe_cobertura` se leen de la config de la RAMA
 *   BASE, como los held-out: la rama no puede rebajar su propio freno.
 * - Sin umbral, no hace nada (la cobertura solo se informa en la peticion de
 *   revision).
 * - Sin datos fiables, NO cierra: el informe no existe, esta cortado, es
 *   anterior al arranque de la verificacion de este mismo finish, o ninguna
 *   de sus rutas es un fichero del repo fuera de lo excluido. «No encuentro
 *   datos» nunca se lee como «nada sin cubrir».
 * - Con `--sin-verificacion` no hay informe fresco: se salta, y el salto ya
 *   queda anotado en la tarea (seccion "Verificacion omitida").
 * - El umbral es el porcentaje minimo cubierto; el valor exacto pasa.
 *
 * Lanza FinishCommandError si no se puede mergear; no escribe nada.
 */
import { ConfigError, type TaskcodeConfig } from '../core/config.js';
import { EXCLUIR_HELDOUT } from '../core/heldout.js';
import { cumpleUmbral, describirCruce, formatearPorcentaje } from '../core/cobertura-cambios.js';
import { coberturaDeRama } from '../fs/cobertura.js';
import { configDeRef } from '../fs/config-de-ref.js';
import { FinishCommandError } from './finish-opciones.js';
import type { ResultadoPuerta } from './finish-verificacion.js';

export interface PuertaCoberturaOpts {
  id: string;
  /** Rama de la que nace la de la tarea: su config manda, y contra ella se mide. */
  ramaBase: string;
  /** Lo que dejo la puerta de verificacion en este mismo finish. */
  verificacion: ResultadoPuerta;
  /** Raiz del repo, en la rama de la tarea. */
  cwd: string;
  onAviso?: (aviso: string) => void;
}

export type ResultadoCobertura =
  | { tipo: 'sin-umbral' }
  | { tipo: 'omitida' }
  | { tipo: 'cumple'; porcentaje: number | null };

const CIERRE = 'No se ha mergeado nada.';

/**
 * Margen para comparar el mtime del informe con el arranque de la verificacion:
 * hay sistemas de ficheros con mtime de resolucion gruesa.
 */
const MARGEN_MTIME_MS = 1000;

function configBase(o: PuertaCoberturaOpts): TaskcodeConfig {
  try {
    return configDeRef(o.ramaBase, o.cwd);
  } catch (e: unknown) {
    if (!(e instanceof ConfigError)) throw e;
    throw new FinishCommandError(
      `[ERROR] ${o.id}: la configuracion de "${o.ramaBase}", que es la que manda en el umbral de cobertura, ` +
        `no es valida:\n  ${e.message.replace(/^\[ERROR\]\s*/, '')}\n${CIERRE}`
    );
  }
}

export function puertaCobertura(o: PuertaCoberturaOpts): ResultadoCobertura {
  const config = configBase(o);
  const umbral = config.umbral_cobertura;
  const informe = config.informe_cobertura;
  if (umbral === null || informe === null) return { tipo: 'sin-umbral' };
  const quitar =
    `Cambiar o quitar el umbral lo decide la persona: es un commit en .taskcode/config.yml de ` +
    `"${o.ramaBase}", integrado despues en la rama.`;

  if (o.verificacion.tipo === 'omitida') {
    o.onAviso?.(
      `${o.id}: sin verificacion no hay informe de cobertura fresco: tampoco se mide el umbral de ` +
        `cobertura (${umbral} %). El salto ya queda anotado en la tarea.`
    );
    return { tipo: 'omitida' };
  }
  if (o.verificacion.tipo === 'sin-comando') {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: "${o.ramaBase}" declara umbral_cobertura (${umbral} %), pero la rama no declara ` +
        `comando_verificacion, asi que nadie regenera el informe ${informe} antes de medirlo. Restaura ` +
        `comando_verificacion en la rama y reintenta. ${quitar} ${CIERRE}`
    );
  }

  const excluir = [...new Set([...config.excluir_de_revision, EXCLUIR_HELDOUT])];
  const c = coberturaDeRama(o.cwd, o.ramaBase, informe, excluir);
  const lectura = c.lectura;
  const sinDatos = (motivo: string): FinishCommandError =>
    new FinishCommandError(
      `[ERROR] ${o.id}: no se puede medir la cobertura de las lineas cambiadas (umbral ${umbral} %): ${motivo}. ` +
        `Sin datos fiables no se cierra: comprueba que comando_verificacion escribe el informe lcov en ` +
        `${informe} con rutas del fuente del repo. ${quitar} ${CIERRE}`
    );
  if (lectura.tipo === 'ausente') throw sinDatos(`la verificacion salio en verde pero no existe ${informe}`);
  if (lectura.tipo === 'truncado') throw sinDatos(`el informe ${informe} esta cortado (sin end_of_record)`);
  if (lectura.mtimeMs + MARGEN_MTIME_MS < o.verificacion.inicioMs) {
    throw sinDatos(
      `el informe ${informe} es de ${new Date(lectura.mtimeMs).toISOString()}, anterior a la verificacion de ` +
        'este finish: no la ha regenerado'
    );
  }
  if (lectura.validos === 0) {
    throw sinDatos(
      `ninguna ruta del informe ${informe} es un fichero del repo fuera de lo excluido de la revision ` +
        '(¿mide el codigo compilado, o rutas de otra maquina?)'
    );
  }
  const cruce = c.cruce;
  if (cruce === null) throw sinDatos('no se pudo cruzar el informe con la rama');
  if (!cumpleUmbral(cruce, umbral)) {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: la cobertura de las lineas cambiadas (${formatearPorcentaje(cruce.porcentaje as number)} %) ` +
        `no llega al umbral de "${o.ramaBase}" (${umbral} %), medida desde la merge base ` +
        `(${c.mergeBase.slice(0, 10)}).\n${describirCruce(cruce)}\n` +
        `Anade los tests que ejecutan esas lineas y reintenta. ${quitar} ${CIERRE}`
    );
  }
  return { tipo: 'cumple', porcentaje: cruce.porcentaje };
}
