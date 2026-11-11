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
 *
 * TASK-102: el freno Stop la usa ademas con el arbol de trabajo (`conArbol`) y
 * elige que verificacion toca con `peticionDeTrabajo`, la misma para Stop y
 * para review: primero solo documentacion, despues la selectiva, y si no, la
 * de siempre.
 */
import { ConfigError } from '../core/config.js';
import { decidirVerificacion, documentacionDeclarada, parcialDeclarada, patronesDocumentacion, patronesParcial, RUTA_CONFIG, } from '../core/verificacion-proporcional.js';
import { configDeRef } from './config-de-ref.js';
import { resolverCommits, rutasDelArbol, rutasDelArbolFueraDe, rutasDeTarea, rutasFueraDe } from './git.js';
/**
 * Tests held-out de las tareas (`tareas/<estado>/TASK-NNN/aceptacion/`). `finish`
 * los corre con su propia puerta; el guardian no, asi que alli cuentan como
 * codigo (decision de Carlos en el plan de TASK-101).
 */
const RUTA_HELDOUT = /^tareas\/(?:[^/]+\/)+aceptacion\//;
function unir(a, b) {
    if (a === null || b === null)
        return null;
    return {
        todas: [...new Set([...a.todas, ...b.todas])],
        fueraDeDocs: [...new Set([...a.fueraDeDocs, ...b.fueraDeDocs])],
    };
}
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
    const patrones = patronesDocumentacion(config);
    const conArbol = opciones.conArbol === true;
    const parcial = parcialDeclarada(config);
    // TASK-105: con el nivel 2 se diffea dos veces el mismo rango; se fijan los
    // SHA antes (un proceso), y sin la clave se diffea por nombre como en la 0.14.0.
    const rango = parcial ? resolverCommits([base, hasta], cwd) : [base, hasta];
    const desde = rango?.[0] ?? base;
    const a = rango?.[1] ?? hasta;
    let diff = rango === null ? null : rutasDeTarea(desde, a, patrones, cwd);
    if (conArbol)
        diff = unir(diff, rutasDelArbol(patrones, cwd));
    let heldout = [];
    if (diff !== null && opciones.heldoutComoCodigo === true) {
        const fuera = diff.fueraDeDocs;
        heldout = diff.todas.filter((r) => RUTA_HELDOUT.test(r) && !fuera.includes(r));
        if (heldout.length > 0)
            diff = { todas: diff.todas, fueraDeDocs: [...fuera, ...heldout] };
    }
    let diffDecision = diff;
    if (diff !== null && parcial && necesitaNivel2(diff)) {
        // Se recalcula sobre el diff ya completo (arbol y held-out sumados): los
        // held-out caen en `tareas/**`, que los patrones parciales excluyen, asi que
        // se anaden a mano igual que a `fueraDeDocs`. Si algun lado falla, el campo
        // no se pone y la decision es la completa.
        const patronesN2 = patronesParcial(config);
        let fueraDeParcial = rutasFueraDe(desde, a, patronesN2, cwd);
        if (fueraDeParcial !== null && conArbol) {
            const delArbol = rutasDelArbolFueraDe(patronesN2, cwd);
            fueraDeParcial = delArbol === null ? null : [...fueraDeParcial, ...delArbol];
        }
        if (fueraDeParcial !== null) {
            diffDecision = { ...diff, fueraDeParcial: [...new Set([...fueraDeParcial, ...heldout])] };
        }
    }
    return {
        tipo: 'decision',
        decision: decidirVerificacion(config, diffDecision, base),
        timeoutS: config.timeout_verificacion,
        timeoutSelectivaS: config.timeout_verificacion_selectiva,
        comandoDocumentacion: config.comando_verificacion_documentacion,
    };
}
/**
 * TASK-105: el nivel 2 solo cambia la decision si hay codigo y nada que fuerce
 * ya la completa (diff vacio o que toca la config). En los demas casos ni se
 * lanza el segundo diff.
 */
function necesitaNivel2(diff) {
    return diff.todas.length > 0 && !diff.todas.includes(RUTA_CONFIG) && diff.fueraDeDocs.length > 0;
}
/**
 * TASK-105: el motivo que finish y el guardian muestran al exigir la completa.
 * Hasta que acepten la selectiva (B3/B5), una decision `selectiva` se ensena
 * como en la 0.14.0: su motivo («basta la verificacion de lo afectado»)
 * contradiria que se ejecuta la completa.
 */
export function motivoDeLaCompleta(d) {
    return d.tipo === 'selectiva' ? 'la tarea cambia rutas que no son documentacion' : d.motivo;
}
/**
 * TASK-102: la eleccion «documentacion -> selectiva -> la de siempre», en un
 * solo sitio para que Stop y review decidan igual para el mismo diff.
 *
 * La puerta mira la config del arbol: sin `rutas_documentacion` no se lee la de
 * la base ni se calcula ningun diff (cero procesos git nuevos por turno). Si la
 * declara, decide la de la base (`decidirVerificacionEntre`, la de finish y el
 * guardian), con el arbol de trabajo incluido. Una config de la base invalida
 * no bloquea: la de siempre con un aviso, como en finish.
 */
export function peticionDeTrabajo(e) {
    const avisos = [];
    const { config } = e;
    let resuelta;
    const base = () => (resuelta ??= e.base());
    if (documentacionDeclarada(config)) {
        if (e.baseFiable) {
            // Sin `heldoutComoCodigo`, igual que finish (MEN-3 de la revision): los
            // held-out de `tareas/**/aceptacion/` no los ejecuta la suite de Stop ni
            // la de review, sino la puerta propia de finish antes de integrar.
            const r = decidirVerificacionEntre(base(), 'HEAD', e.raiz, { conArbol: true });
            if (r !== null && r.tipo === 'config-invalida') {
                avisos.push(`La configuracion de "${base()}" no es valida, asi que no se puede saber si solo cambia ` +
                    `documentacion: se aplica la verificacion de siempre. Detalle: ` +
                    r.error.message.replace(/^\[ERROR\]\s*/, ''));
            }
            else if (r !== null && r.decision.tipo === 'documentacion') {
                return {
                    plan: { tipo: 'documentacion', comando: r.comandoDocumentacion, timeoutS: r.timeoutS, motivo: r.decision.motivo },
                    avisos,
                };
            }
        }
    }
    const selectiva = config.comando_verificacion_selectiva;
    if (selectiva !== null) {
        return {
            plan: { tipo: 'selectiva', comando: selectiva, timeoutS: config.timeout_verificacion_selectiva, base: base() },
            avisos,
        };
    }
    if (e.sinSelectiva === 'completa' && config.comando_verificacion !== null) {
        return { plan: { tipo: 'completa', comando: config.comando_verificacion, timeoutS: config.timeout_verificacion }, avisos };
    }
    return { plan: { tipo: 'nada' }, avisos };
}
