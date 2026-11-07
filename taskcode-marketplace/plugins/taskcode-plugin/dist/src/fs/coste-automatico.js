/**
 * Volcado del coste de implementacion registrado automaticamente (TASK-085).
 * Lo llaman `review` (al pasar a en-revision) y `finish` (red, por si el de
 * review no pudo): devuelve la tarea y el cuerpo con `tokens_implementacion`
 * y las filas de `## Coste` ya sumadas, para que viajen en SU commit. Que
 * cuenta y como no se duplica, en `core/coste-automatico.ts`.
 *
 * De donde salen las transcripciones:
 *  - El libro de pendientes (`fs/coste-pendiente.ts`), que llena el hook de
 *    fin de turno y de fin de subagente.
 *  - La sesion que esta ejecutando el comando, si el entorno la nombra
 *    (`CLAUDE_CODE_SESSION_ID`): cuando todo el ciclo cabe en un turno, el
 *    hook de fin de turno aun no ha corrido al llegar a `review`.
 *  - Los subagentes de cada sesion (`<sesion>/subagents/agent-*.jsonl`): las
 *    ventanas descartan los que no trabajaron con la tarea en curso.
 *
 * NUNCA rompe el comando que lo llama: cualquier fallo deja la tarea como
 * estaba y un aviso. El coste es una metrica; la transicion, no.
 */
import { realpathSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { anadirCoste } from '../core/coste-registro.js';
import { esAgentIdValido, sumarUsoTranscripcion } from '../core/coste-transcripcion.js';
import { filasDeVolcado, filtroDeTarea, ventanasEnCurso, } from '../core/coste-automatico.js';
import { formatearInstante, instanteDe, precisionDeFecha } from '../core/transiciones.js';
import { directorioConfigClaude } from './config-claude.js';
import { leerPendientes, olvidarPendientes, rutaLibro } from './coste-pendiente.js';
/** `COSTE_AUTOMATICO=0` apaga el hook y el volcado. */
export const INTERRUPTOR_COSTE = 'COSTE_AUTOMATICO';
/** Variable con la que Claude Code nombra la sesion a sus procesos hijos (no siempre esta). */
export const VARIABLE_SESION = 'CLAUDE_CODE_SESSION_ID';
const SESION_ID_RE = /^[0-9A-Za-z_-]{1,128}$/;
export function esSesionIdValido(id) {
    return SESION_ID_RE.test(id);
}
/** Hasta cuando cuenta el volcado: el instante de la transicion (`deps.ahora`) o, sin el, ahora. */
export function instanteDelVolcado(ahora) {
    return ahora !== undefined && precisionDeFecha(ahora) === 'segundo' ? instanteDe(ahora) : Date.now();
}
async function nombres(dir) {
    try {
        return await readdir(dir);
    }
    catch {
        return [];
    }
}
/** La transcripcion de una sesion por su id: `<config>/projects/*\/<id>.jsonl`. */
async function transcripcionDeSesion(configDir, id) {
    const proyectos = path.join(configDir, 'projects');
    for (const p of (await nombres(proyectos)).sort()) {
        if ((await nombres(path.join(proyectos, p))).includes(`${id}.jsonl`))
            return path.join(proyectos, p, `${id}.jsonl`);
    }
    return null;
}
/** Subagentes de una sesion, junto a su transcripcion: `<dir>/<id>/subagents/agent-<agente>.jsonl`. */
async function subagentesDeSesion(rutaSesion) {
    const dir = path.join(path.dirname(rutaSesion), path.basename(rutaSesion, '.jsonl'), 'subagents');
    return (await nombres(dir)).flatMap((n) => {
        const m = /^agent-(.+)\.jsonl$/.exec(n);
        return m !== null && esAgentIdValido(m[1]) ? [{ id: m[1], ruta: path.join(dir, n) }] : [];
    });
}
/** realpath con cache (una transcripcion repite el mismo cwd en cada linea); si no existe, la ruta tal cual. */
function normalizadorDeRutas() {
    const cache = new Map();
    return (ruta) => {
        let r = cache.get(ruta);
        if (r === undefined) {
            try {
                r = realpathSync.native(ruta);
            }
            catch {
                r = path.resolve(ruta);
            }
            cache.set(ruta, r);
        }
        return r;
    };
}
export async function volcarCosteAutomatico(task, body, hastaMs, deps) {
    const sinCambios = (avisos = []) => ({
        task,
        body,
        sumado: 0,
        filas: 0,
        avisos,
        olvidar: () => undefined,
    });
    const env = deps.env ?? process.env;
    if (env[INTERRUPTOR_COSTE] === '0')
        return sinCambios();
    try {
        const ventanas = ventanasEnCurso(body, hastaMs);
        const libro = rutaLibro(deps.raiz);
        const olvidar = () => {
            if (libro !== null)
                olvidarPendientes(libro, task.id);
        };
        if (ventanas.length === 0 || typeof task.rama !== 'string' || task.rama === '') {
            return { ...sinCambios(), olvidar };
        }
        const fuentes = new Map();
        const anadir = (tipo, id, ruta) => {
            if (!fuentes.has(`${tipo}:${id}`))
                fuentes.set(`${tipo}:${id}`, { tipo, id, ruta });
        };
        for (const e of libro === null ? [] : leerPendientes(libro, task.id)) {
            if (e.tipo === 'agente' ? esAgentIdValido(e.id) : esSesionIdValido(e.id))
                anadir(e.tipo, e.id, e.ruta);
        }
        const actual = env[VARIABLE_SESION];
        if (typeof actual === 'string' && esSesionIdValido(actual) && !fuentes.has(`sesion:${actual}`)) {
            const ruta = await transcripcionDeSesion(deps.configDir ?? directorioConfigClaude(env), actual);
            if (ruta !== null)
                anadir('sesion', actual, ruta);
        }
        for (const f of [...fuentes.values()]) {
            if (f.tipo !== 'sesion')
                continue;
            for (const s of await subagentesDeSesion(f.ruta))
                anadir('agente', s.id, s.ruta);
        }
        const filtro = filtroDeTarea(ventanas, task.rama, deps.raiz, normalizadorDeRutas());
        const medidas = [];
        for (const f of fuentes.values()) {
            let texto;
            try {
                texto = await readFile(f.ruta, 'utf8');
            }
            catch {
                continue; // borrada o movida: no hay nada que medir
            }
            const uso = sumarUsoTranscripcion(texto, filtro);
            if (uso !== null && uso.tokens > 0)
                medidas.push({ tipo: f.tipo, id: f.id, uso });
        }
        medidas.sort((a, b) => (a.tipo === b.tipo ? a.id.localeCompare(b.id) : a.tipo === 'sesion' ? -1 : 1));
        const v = filasDeVolcado(body, medidas, formatearInstante(new Date(hastaMs)));
        if (v.filas.length === 0)
            return { ...sinCambios(), olvidar };
        const total = (task.tokens_implementacion ?? 0) + v.total;
        if (!Number.isSafeInteger(total)) {
            return sinCambios(['No se ha registrado el coste de implementacion: el total dejaria de ser un entero seguro.']);
        }
        return {
            task: { ...task, tokens_implementacion: total },
            body: v.filas.reduce((acc, f) => anadirCoste(acc, f), body),
            sumado: v.total,
            filas: v.filas.length,
            avisos: [],
            olvidar,
        };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return sinCambios([`No se ha podido registrar el coste de implementacion automaticamente: ${msg}`]);
    }
}
