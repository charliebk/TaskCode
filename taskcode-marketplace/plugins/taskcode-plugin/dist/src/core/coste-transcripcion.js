/**
 * Coste real de un subagente a partir de su transcripcion (TASK-023).
 *
 * La cifra que Claude Code devuelve al terminar un subagente es el tamano de
 * su contexto FINAL, no lo que gasto. Lo gastado es la suma del `usage` de
 * cada llamada al modelo, que la transcripcion (`agent-<id>.jsonl`, un JSON
 * por linea) guarda en las lineas `type: "assistant"` con `message.usage`.
 *
 * Puro: recibe el texto y devuelve numeros; la busqueda del fichero vive en
 * `fs/transcripciones.ts`.
 *
 * Reglas:
 *  - Se cuenta cada `message.id` UNA vez, con su ULTIMA aparicion: el
 *    streaming repite el id y el usage de la ultima es el final.
 *  - Por llamada: input + cache_creation + cache_read + output. Un campo
 *    ausente o no numerico cuenta 0.
 *  - Las lineas que no son JSON, o no son de asistente con usage, se ignoran.
 *    Una linea con usage pero sin id se cuenta tal cual (no se puede
 *    deduplicar).
 *
 * TASK-063: ademas del total, el desglose (entrada, escritura y lectura de
 * cache, salida) con la misma deduplicacion, y `lecturas`: cuantas veces
 * leyo el agente para orientarse. Una lectura es un bloque `tool_use` del
 * `message.content` de una linea de asistente, contado UNA vez por su `id`
 * (el streaming tambien lo repite; uno sin id se cuenta tal cual), que:
 *  - tiene un `name` de `HERRAMIENTAS_LECTURA`, o
 *  - es `Bash` y su `input.command`, sin espacios iniciales, empieza por un
 *    comando de `COMANDOS_BASH_LECTURA` o por `sed -n`.
 * Es heuristico a sabiendas: `cd x && cat y` no cuenta y `cat > f` si. Lo
 * que importa es la tendencia entre tareas, no la cifra exacta. Sin ningun
 * `tool_use`, `lecturas` es 0.
 */
/** agentId que devuelve la herramienta Agent: hexadecimal. Se valida antes de componer rutas. */
const AGENT_ID_RE = /^[0-9a-f]{6,64}$/i;
export function esAgentIdValido(id) {
    return AGENT_ID_RE.test(id);
}
/**
 * Herramientas que cuentan como lectura del proyecto (TASK-063). Lista
 * CERRADA a proposito: una herramienta nueva se anade aqui, no se adivina
 * por su nombre. Son las de Claude Code (Read, Grep, Glob; LS y
 * NotebookRead de versiones anteriores) y las de lectura o busqueda de dos
 * servidores MCP comunes: el `filesystem` de referencia y el grafo de codigo
 * `tokensave`. Un MCP instalado como plugin lleva otro prefijo en el nombre
 * y no casa: se anade con su nombre completo.
 */
export const HERRAMIENTAS_LECTURA = [
    'Read',
    'Grep',
    'Glob',
    'LS',
    'NotebookRead',
    'mcp__filesystem__read_file',
    'mcp__filesystem__read_text_file',
    'mcp__filesystem__read_media_file',
    'mcp__filesystem__read_multiple_files',
    'mcp__filesystem__list_directory',
    'mcp__filesystem__list_directory_with_sizes',
    'mcp__filesystem__directory_tree',
    'mcp__filesystem__search_files',
    'mcp__filesystem__get_file_info',
    'mcp__tokensave__tokensave_context',
    'mcp__tokensave__tokensave_search',
    'mcp__tokensave__tokensave_read',
];
/** Comandos de Bash que cuentan como lectura si el comando EMPIEZA por ellos. `sed` cuenta solo con `-n`. */
export const COMANDOS_BASH_LECTURA = ['cat', 'head', 'tail', 'grep', 'rg', 'find', 'ls'];
const BASH_LECTURA_RE = new RegExp(`^(?:${COMANDOS_BASH_LECTURA.join('|')}|sed\\s+-n)(?:\\s|$)`);
/** true si un comando de Bash es de lectura segun la regla de la cabecera. */
export function esComandoBashDeLectura(comando) {
    return BASH_LECTURA_RE.test(comando.trimStart());
}
function numero(v) {
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}
function desgloseDeUsage(u) {
    return {
        entrada: numero(u['input_tokens']),
        cacheEscritura: numero(u['cache_creation_input_tokens']),
        cacheLectura: numero(u['cache_read_input_tokens']),
        salida: numero(u['output_tokens']),
    };
}
function esObjeto(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
/** true si un bloque `tool_use` es una lectura (ver la cabecera). */
function esLectura(bloque) {
    const nombre = bloque['name'];
    if (typeof nombre !== 'string')
        return false;
    if (HERRAMIENTAS_LECTURA.includes(nombre))
        return true;
    if (nombre !== 'Bash')
        return false;
    const input = bloque['input'];
    return esObjeto(input) && typeof input['command'] === 'string' && esComandoBashDeLectura(input['command']);
}
/** null si la transcripcion no tiene ninguna linea de asistente con usage (formato desconocido). */
export function sumarUsoTranscripcion(texto) {
    const porId = new Map();
    const sinId = [];
    const lecturasPorId = new Set();
    let lecturasSinId = 0;
    for (const linea of texto.split(/\r?\n/)) {
        if (linea.trim() === '')
            continue;
        let obj;
        try {
            obj = JSON.parse(linea);
        }
        catch {
            continue;
        }
        if (!esObjeto(obj) || obj['type'] !== 'assistant')
            continue;
        const mensaje = obj['message'];
        if (!esObjeto(mensaje))
            continue;
        const contenido = mensaje['content'];
        if (Array.isArray(contenido)) {
            for (const bloque of contenido) {
                if (!esObjeto(bloque) || bloque['type'] !== 'tool_use' || !esLectura(bloque))
                    continue;
                const idBloque = bloque['id'];
                if (typeof idBloque === 'string' && idBloque !== '')
                    lecturasPorId.add(idBloque);
                else
                    lecturasSinId++;
            }
        }
        if (!esObjeto(mensaje['usage']))
            continue;
        const desglose = desgloseDeUsage(mensaje['usage']);
        const id = mensaje['id'];
        if (typeof id === 'string' && id !== '') {
            porId.set(id, desglose); // la ultima aparicion gana
        }
        else {
            sinId.push(desglose);
        }
    }
    const llamadas = porId.size + sinId.length;
    if (llamadas === 0)
        return null;
    const suma = { entrada: 0, cacheEscritura: 0, cacheLectura: 0, salida: 0 };
    for (const d of [...porId.values(), ...sinId]) {
        suma.entrada += d.entrada;
        suma.cacheEscritura += d.cacheEscritura;
        suma.cacheLectura += d.cacheLectura;
        suma.salida += d.salida;
    }
    const tokens = suma.entrada + suma.cacheEscritura + suma.cacheLectura + suma.salida;
    return { tokens, llamadas, ...suma, lecturas: lecturasPorId.size + lecturasSinId };
}
