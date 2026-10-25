/**
 * TASK-063: transcripcion de subagente de ejemplo (formato `agent-<id>.jsonl`
 * de Claude Code) con un numero de lecturas conocido. La usan el test puro
 * de `sumarUsoTranscripcion` y el de `registrar-coste --agente` contra un
 * repo Git real.
 */

type Bloque = Record<string, unknown>;

export function mensaje(id: string | null, contenido: Bloque[], usage: Record<string, unknown> | null): string {
  return JSON.stringify({
    type: 'assistant',
    message: { ...(id === null ? {} : { id }), content: contenido, ...(usage === null ? {} : { usage }) },
  });
}

export function herramienta(id: string | null, name: string, input: Record<string, unknown> = {}): Bloque {
  return { type: 'tool_use', ...(id === null ? {} : { id }), name, input };
}

const bash = (id: string, command: string): Bloque => herramienta(id, 'Bash', { command });
export const uso = (entrada: number, salida: number): Record<string, unknown> => ({
  input_tokens: entrada,
  cache_creation_input_tokens: 10,
  cache_read_input_tokens: 100,
  output_tokens: salida,
});

/**
 * Transcripcion de ejemplo con la forma de Claude Code: el streaming parte un
 * mensaje en varias lineas con el mismo message.id, una por bloque, y repite
 * el tool_use. Lleva lecturas, no lecturas y casi-lecturas.
 */
export const TRANSCRIPCION_EJEMPLO = [
  JSON.stringify({ type: 'user', message: { role: 'user', content: 'arranca' } }),
  mensaje('m1', [{ type: 'text', text: 'Miro el proyecto.' }], uso(5, 1)),
  mensaje('m1', [herramienta('t1', 'Read', { file_path: 'a.ts' })], uso(5, 2)),
  mensaje('m1', [herramienta('t1', 'Read', { file_path: 'a.ts' })], uso(5, 3)), // mismo tool_use: 1 lectura
  JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'x' }] } }),
  mensaje('m2', [herramienta('t2', 'Grep', { pattern: 'x' }), herramienta('t3', 'Glob', { pattern: '*.ts' })], uso(7, 4)),
  mensaje(
    'm3',
    [
      bash('t4', '   cat a.txt'), // si: espacios iniciales fuera
      bash('t5', 'sed -n 1,5p x.ts'), // si
      bash('t6', 'sed -i s/a/b/ x.ts'), // no: sed sin -n
      bash('t7', 'npm test'), // no
      bash('t8', 'category x'), // no: empieza por "cat" pero no es cat
      bash('t9', 'ls'), // si: el comando solo
      bash('t10', 'git grep x'), // no: no EMPIEZA por grep
      bash('t11', 'rg -n foo src'), // si
    ],
    uso(9, 5)
  ),
  mensaje(
    'm4',
    [
      herramienta('t12', 'Edit', { file_path: 'a.ts' }), // no
      herramienta('t13', 'mcp__filesystem__read_file', { path: 'a.ts' }), // si
      herramienta('t14', 'mcp__otro__read_file', { path: 'a.ts' }), // no: fuera de la lista cerrada
      herramienta('t15', 'Write', { file_path: 'b.ts' }), // no
      herramienta('t16', 'Bash', {}), // no: sin comando
    ],
    uso(11, 6)
  ),
  mensaje(null, [herramienta(null, 'Read', { file_path: 'c.ts' })], uso(1, 1)), // sin ids: cuenta tal cual
  'linea rota {',
].join('\n');

/** Lo que da `sumarUsoTranscripcion(TRANSCRIPCION_EJEMPLO)`; ver el test puro. */
export const USO_EJEMPLO = {
  tokens: 602,
  llamadas: 5,
  entrada: 33,
  cacheEscritura: 50,
  cacheLectura: 500,
  salida: 19,
  lecturas: 9,
} as const;
