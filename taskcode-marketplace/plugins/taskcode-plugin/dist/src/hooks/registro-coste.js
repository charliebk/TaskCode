/**
 * Registro automatico del coste de implementacion (TASK-085). Lo ejecutan los
 * hooks `Stop` (fin de turno del hilo principal) y `SubagentStop` (fin de un
 * subagente) en TODAS las sesiones de TODOS los proyectos con el plugin, asi
 * que las guardas van de la mas barata a la mas cara, como en el freno de
 * verificacion, y ningun proceso hasta saber que hay una tarea en curso:
 *
 *   1. `COSTE_AUTOMATICO=0`: interruptor.
 *   2. Sin `cwd` valido en la entrada.
 *   3. `tareas/02-en-curso/` no existe (solo `stat`).
 *   4. Ninguna tarea en curso con rama (lectura de esa carpeta).
 *   5. La rama actual (el primer `git`) no es la de ninguna de ellas.
 *
 * Solo entonces anota en el libro de pendientes (`fs/coste-pendiente.ts`)
 * QUE transcripcion trabajo en la tarea: la de la sesion y, en
 * `SubagentStop`, la del subagente. No lee transcripciones ni escribe
 * `tarea.md`: la cifra la calcula `review` al volcar, en su commit. Asi el
 * hook no cambia la huella del freno de verificacion ni ensucia el arbol.
 *
 * Nunca bloquea: sale siempre con 0 y sin decir nada (un 2 en `Stop`
 * detendria al agente). Nada de lo que escribe nombra el producto.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { raizDelRepo } from '../core/config.js';
import { esAgentIdValido } from '../core/coste-transcripcion.js';
import { listTareasEnEstados } from '../fs/task-store.js';
import { anotarPendientes, rutaLibro } from '../fs/coste-pendiente.js';
import { esSesionIdValido, INTERRUPTOR_COSTE } from '../fs/coste-automatico.js';
import { carpetaEnCurso, ramaActual } from './freno-stop.js';
function texto(v) {
    return typeof v === 'string' && v !== '' ? v : null;
}
/**
 * Lo que hay que anotar para una entrada, sin mirar el disco. La ruta del
 * subagente, si la entrada no la trae, es la que Claude Code usa junto a la
 * de la sesion: `<dir>/<session_id>/subagents/agent-<agent_id>.jsonl`.
 */
export function entradasDeHook(entrada, tarea) {
    const sesion = texto(entrada.session_id);
    const rutaSesion = texto(entrada.transcript_path);
    const salida = [];
    if (sesion !== null && rutaSesion !== null && esSesionIdValido(sesion) && path.isAbsolute(rutaSesion)) {
        salida.push({ tarea, tipo: 'sesion', id: sesion, ruta: rutaSesion });
    }
    const agente = texto(entrada.agent_id);
    if (agente !== null && esAgentIdValido(agente)) {
        const declarada = texto(entrada.agent_transcript_path);
        const ruta = declarada !== null && path.isAbsolute(declarada)
            ? declarada
            : sesion !== null && rutaSesion !== null && esSesionIdValido(sesion)
                ? path.join(path.dirname(rutaSesion), sesion, 'subagents', `agent-${agente}.jsonl`)
                : null;
        if (ruta !== null)
            salida.push({ tarea, tipo: 'agente', id: agente, ruta });
    }
    return salida;
}
/** Anota lo que toque y devuelve cuantas entradas escribio. Nunca lanza. */
export async function registrarTurno(entrada, deps = {}) {
    try {
        const env = deps.env ?? process.env;
        if (env[INTERRUPTOR_COSTE] === '0')
            return 0;
        const cwd = texto(entrada.cwd);
        if (cwd === null || !existsSync(cwd))
            return 0;
        const raiz = raizDelRepo(cwd);
        if (carpetaEnCurso(raiz) === null)
            return 0;
        const { tareas } = await listTareasEnEstados(path.join(raiz, 'tareas'), ['en-curso']);
        const conRama = tareas.filter((t) => typeof t.task.rama === 'string' && t.task.rama !== '');
        if (conRama.length === 0)
            return 0;
        const rama = (deps.ramaActual ?? ramaActual)(raiz);
        if (rama === null)
            return 0;
        const entradas = conRama.filter((t) => t.task.rama === rama).flatMap((t) => entradasDeHook(entrada, t.task.id));
        if (entradas.length === 0)
            return 0;
        const libro = rutaLibro(raiz);
        if (libro === null)
            return 0;
        anotarPendientes(libro, entradas);
        return entradas.length;
    }
    catch {
        return 0;
    }
}
/** El JSON del hook. Uno roto o vacio es una entrada sin campos. */
export function parsearEntradaCoste(textoEntrada) {
    try {
        const v = JSON.parse(textoEntrada);
        return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {};
    }
    catch {
        return {};
    }
}
