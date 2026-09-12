/**
 * Numeracion de rondas de los artefactos de una tarea.
 *
 * Un bucle de "pide cambios" es normal, no una excepcion: una tarea
 * puede necesitar dos o tres rondas de revision. El numero de ronda no
 * se guarda en ninguna parte: se DEDUCE de los ficheros que ya hay en
 * la carpeta. Es a proposito — un contador en el frontmatter seria un
 * segundo sitio donde vive la misma verdad, y el dia que discrepara del
 * disco ganaria el fichero equivocado.
 *
 * HISTORIA, porque el comentario que habia aqui dejo de ser cierto y lo
 * detecto la quinta ronda de revision de TASK-016: esto se extrajo de
 * commands/review.ts para compartirlo con commands/plan.ts. Plan acabo
 * necesitando algo distinto — no "la siguiente ronda" sino "que rondas
 * hay, de cada tipo de artefacto, y cual esta completa" — asi que hoy
 * **el unico consumidor vuelve a ser `review`**. Se deja aqui, y no de
 * vuelta dentro de review.ts, porque el modulo esta probado y moverlo
 * otra vez no compra nada; pero conviene saber que no es una
 * abstraccion compartida, es la numeracion de rondas de revision.
 *
 * TASK-018: una ronda de revision fragmentada por dominio deja VARIOS
 * ficheros con el MISMO numero de ronda (uno por revisor, con el nombre
 * de la skill como sufijo — ver RONDA_FILE_RE en commands/review.ts).
 * Ni `ultimaRonda` ni `siguienteRonda` necesitaron cambiar para eso: ya
 * recorren TODAS las entradas del directorio y se quedan con el numero
 * mas alto, sin asumir que cada numero aparece una sola vez — el
 * patron ya generalizaba. Lo unico que se amplio es el regex que le pasa
 * el llamador.
 */
import { readdir } from 'node:fs/promises';
import { isEnoent, isEnotdir } from './task-store.js';

/**
 * El mayor N que aparezca en el primer grupo de captura de `patron`
 * entre los ficheros del directorio, o 0 si no hay ninguno.
 *
 * Un directorio que no existe da 0, no un error: la carpeta se crea al
 * escribir la primera ronda, y preguntar antes de crearla es el caso
 * normal, no el raro. ENOTDIR se absorbe igual que ENOENT — es la
 * misma pregunta ("¿hay ahi rondas previas?") y la respuesta es la
 * misma. Sin esto, una ruta ocupada por un FICHERO salia como una
 * traza cruda de Node que ni el CLI capturaba (hallazgo IMPORTANTE de
 * la revision por pares de TASK-016, que reabria el fix de TASK-027:
 * en POSIX `readdir` sobre un fichero contesta ENOTDIR, no ENOENT).
 * Quien tiene que quejarse de la ruta ocupada es el `mkdir` de quien
 * llama, que ya lo hace con un mensaje accionable.
 */
export async function ultimaRonda(dir: string, patron: RegExp): Promise<number> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (e: unknown) {
    if (isEnoent(e) || isEnotdir(e)) return 0;
    throw e;
  }
  let max = 0;
  for (const entry of entries) {
    const m = patron.exec(entry);
    // Se recorren TODAS las entradas y se busca el maximo, en vez de
    // contar cuantas hay: un fichero borrado a mano no debe hacer que
    // la siguiente ronda reutilice un numero ya usado y pise el
    // historial de la anterior.
    if (m !== null) {
      const capturado = m[1];
      if (capturado !== undefined) max = Math.max(max, Number(capturado));
    }
  }
  return max;
}

/** Primera ronda libre: la ultima que haya + 1. */
export async function siguienteRonda(dir: string, patron: RegExp): Promise<number> {
  return (await ultimaRonda(dir, patron)) + 1;
}
