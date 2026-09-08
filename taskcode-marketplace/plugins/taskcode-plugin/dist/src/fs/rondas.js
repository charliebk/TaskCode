/**
 * Numeracion de rondas de los artefactos de una tarea.
 *
 * Un bucle de "pide cambios" es normal, no una excepcion: una tarea
 * puede necesitar dos o tres rondas de revision, y desde TASK-016
 * tambien varias de planificacion. En los dos casos el numero de ronda
 * no se guarda en ninguna parte: se DEDUCE de los ficheros que ya hay
 * en la carpeta. Es a proposito — un contador en el frontmatter seria
 * un segundo sitio donde vive la misma verdad, y el dia que discrepara
 * del disco ganaria el fichero equivocado.
 *
 * La logica vivia privada en commands/review.ts desde TASK-013.
 * TASK-016 la necesita igual para `planificacion/brainstorm/`, y
 * copiarla habria dejado dos numeradores que divergen en cuanto
 * alguien toque uno.
 */
import { readdir } from 'node:fs/promises';
import { isEnoent } from './task-store.js';
/**
 * Primera ronda libre: 1 + el mayor N que aparezca en el primer grupo
 * de captura de `patron` entre los ficheros del directorio.
 *
 * Un directorio que no existe es ronda 1, no un error: la carpeta se
 * crea al escribir la primera ronda, y preguntar antes de crearla es
 * el caso normal, no el raro.
 */
export async function siguienteRonda(dir, patron) {
    let entries;
    try {
        entries = await readdir(dir);
    }
    catch (e) {
        if (isEnoent(e))
            return 1;
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
            if (capturado !== undefined)
                max = Math.max(max, Number(capturado));
        }
    }
    return max + 1;
}
