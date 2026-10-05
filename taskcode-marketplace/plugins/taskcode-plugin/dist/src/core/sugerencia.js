/**
 * «Quiza quisiste decir...»: la sugerencia ante una clave o un flag mal
 * escritos. Una sola implementacion para config, heuristica, catalogo y los
 * flags del CLI (TASK-047; antes habia tres copias privadas identicas).
 */
/** Distancia de edicion (Levenshtein) a mano — cero dependencias, como el resto. */
export function distanciaEdicion(a, b) {
    let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        const actual = [i];
        for (let j = 1; j <= b.length; j++) {
            const coste = a[i - 1] === b[j - 1] ? 0 : 1;
            actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
        }
        previa = actual;
    }
    return previa[b.length];
}
/**
 * La clave valida mas cercana, si esta lo bastante cerca como para ser una
 * errata. Umbral: hasta un tercio de la clave. Sin el, "foo" propondria
 * cualquier cosa y el consejo dejaria de valer nada.
 */
export function masParecida(clave, validas) {
    let mejor = null;
    let mejorDistancia = Number.POSITIVE_INFINITY;
    for (const valida of validas) {
        const d = distanciaEdicion(clave.toLowerCase(), valida);
        if (d < mejorDistancia) {
            mejorDistancia = d;
            mejor = valida;
        }
    }
    return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
}
