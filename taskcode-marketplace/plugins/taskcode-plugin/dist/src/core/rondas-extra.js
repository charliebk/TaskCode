/**
 * TASK-127: la decision de una persona de abrir una ronda de revision pasado
 * el tope. Modulo puro: recibe el cuerpo de `tarea.md`, no toca disco ni Git.
 *
 * Cada ronda extra necesita su propia linea en la seccion `## Rondas extra`:
 *
 *     ## Rondas extra
 *     - Ronda 3: Carlos, el IMP-2 necesita otra mirada tras el cambio de API
 *
 * Asi `--ronda-extra` no se reutiliza: la ronda 4 vuelve a exigir su linea, y
 * la pregunta del tope se repite en cada ronda extra.
 */
import { SECCION_RONDAS_EXTRA } from './flujo.js';
import { contenidoDeSeccion } from './transiciones.js';
/** Lo que `lineaRondaExtra` deja de ejemplo: copiado tal cual no es una decision. */
const MARCADOR = /^<[^>]*>$/;
/** ¿Consta en `body` la decision de abrir la ronda `ronda` (linea con texto)? */
export function rondaExtraDecidida(body, ronda) {
    return seccionRondasExtra(body).some((linea) => {
        const m = /^-\s*Ronda\s+(\d+)\s*:\s*(.*)$/i.exec(linea.trim());
        if (m === null || Number(m[1]) !== ronda)
            return false;
        const texto = (m[2] ?? '').trim();
        return texto !== '' && !MARCADOR.test(texto);
    });
}
/** Lineas de la seccion `## Rondas extra` (TASK-147a: con el lector comun de secciones). */
function seccionRondasExtra(body) {
    return contenidoDeSeccion(body, SECCION_RONDAS_EXTRA) ?? [];
}
