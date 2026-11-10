/**
 * Decision de verificacion proporcional entre dos puntos de Git — TASK-101.
 *
 * La comparten `finish` (TASK-100: base de la tarea contra HEAD) y el guardian
 * de merges (destino contra el commit que entra), para que los dos decidan lo
 * mismo por construccion y no con dos copias que se desvien. Lee SIEMPRE la
 * configuracion de `base` (`configDeRef`), nunca la del arbol de trabajo: la
 * rama que se integra no puede ampliar sus propias rutas de documentacion, ni
 * con un commit ni con un cambio sin commitear.
 *
 * Devuelve tambien el `timeout_verificacion` de la base: la huella del memo de
 * documentacion se calcula con el (lo guarda `finish`, lo busca el guardian).
 */
import { ConfigError } from '../core/config.js';
import { decidirVerificacion, documentacionDeclarada, patronesDocumentacion, } from '../core/verificacion-proporcional.js';
import { configDeRef } from './config-de-ref.js';
import { rutasDeTarea } from './git.js';
/**
 * Tests held-out de las tareas (`tareas/<estado>/TASK-NNN/aceptacion/`). `finish`
 * los corre con su propia puerta; el guardian no, asi que alli cuentan como
 * codigo (decision de Carlos en el plan de TASK-101).
 */
const RUTA_HELDOUT = /^tareas\/(?:[^/]+\/)+aceptacion\//;
/**
 * Decision para lo que cambia `hasta` frente a `base` (desde su merge base).
 * null si la base no declara `rutas_documentacion`: entonces ni se calcula el
 * diff (cero coste para quien no lo usa).
 */
export function decidirVerificacionEntre(base, hasta, cwd, opciones = {}) {
    let config;
    try {
        config = configDeRef(base, cwd);
    }
    catch (e) {
        if (e instanceof ConfigError)
            return { tipo: 'config-invalida', error: e };
        throw e;
    }
    if (!documentacionDeclarada(config))
        return null;
    let diff = rutasDeTarea(base, hasta, patronesDocumentacion(config), cwd);
    if (diff !== null && opciones.heldoutComoCodigo === true) {
        const heldout = diff.todas.filter((r) => RUTA_HELDOUT.test(r) && !diff?.fueraDeDocs.includes(r));
        if (heldout.length > 0)
            diff = { todas: diff.todas, fueraDeDocs: [...diff.fueraDeDocs, ...heldout] };
    }
    return {
        tipo: 'decision',
        decision: decidirVerificacion(config, diff, base),
        timeoutS: config.timeout_verificacion,
        comandoDocumentacion: config.comando_verificacion_documentacion,
    };
}
