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
 */

/** agentId que devuelve la herramienta Agent: hexadecimal. Se valida antes de componer rutas. */
const AGENT_ID_RE = /^[0-9a-f]{6,64}$/i;

export function esAgentIdValido(id: string): boolean {
  return AGENT_ID_RE.test(id);
}

export interface UsoTranscripcion {
  /** Tokens procesados: entrada + escritura y lectura de cache + salida. */
  tokens: number;
  /** Llamadas distintas (message.id unicos) que se han sumado. */
  llamadas: number;
}

function numero(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

function tokensDeUsage(u: Record<string, unknown>): number {
  return (
    numero(u['input_tokens']) +
    numero(u['cache_creation_input_tokens']) +
    numero(u['cache_read_input_tokens']) +
    numero(u['output_tokens'])
  );
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** null si la transcripcion no tiene ninguna linea de asistente con usage (formato desconocido). */
export function sumarUsoTranscripcion(texto: string): UsoTranscripcion | null {
  const porId = new Map<string, number>();
  let sinId = 0;
  let sumaSinId = 0;
  for (const linea of texto.split(/\r?\n/)) {
    if (linea.trim() === '') continue;
    let obj: unknown;
    try {
      obj = JSON.parse(linea);
    } catch {
      continue;
    }
    if (!esObjeto(obj) || obj['type'] !== 'assistant') continue;
    const mensaje = obj['message'];
    if (!esObjeto(mensaje) || !esObjeto(mensaje['usage'])) continue;
    const tokens = tokensDeUsage(mensaje['usage']);
    const id = mensaje['id'];
    if (typeof id === 'string' && id !== '') {
      porId.set(id, tokens); // la ultima aparicion gana
    } else {
      sinId++;
      sumaSinId += tokens;
    }
  }
  const llamadas = porId.size + sinId;
  if (llamadas === 0) return null;
  let tokens = sumaSinId;
  for (const t of porId.values()) tokens += t;
  return { tokens, llamadas };
}
