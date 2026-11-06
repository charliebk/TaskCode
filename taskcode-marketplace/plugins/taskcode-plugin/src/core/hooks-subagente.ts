/**
 * Nucleo puro de la comprobacion `hooks-subagente` de `taskctl doctor`
 * (TASK-076): decide si un hook PreToolUse alcanza al lanzamiento de
 * subagentes (herramientas `Agent` y `Task`). Desde Claude Code 2.1.317 el
 * modo automatico puede denegar el lanzamiento (Auto-Mode Bypass) cuando un
 * hook de ese tipo reescribe el encargo.
 *
 * Semantica del matcher (plan de TASK-076, Carlos 2026-11-06):
 * - `""`, `"*"` o sin matcher: alcanza a todas las herramientas, cuenta.
 * - Solo letras, digitos, `_` y `|` (tras quitar los espacios alrededor de
 *   cada `|`): lista de nombres exactos separada por `|`.
 * - Cualquier otra cosa: regex anclada (`^(?:...)$`); si no compila, se parte
 *   por `|` y se compara literal.
 */

/** Herramientas con las que Claude Code lanza subagentes. */
export const HERRAMIENTAS_SUBAGENTE: readonly string[] = ['Agent', 'Task'];

export interface HallazgoHook {
  /** Quien declara el hook: `plugin x@y`, `settings de usuario`... */
  origen: string;
  /** Fichero donde esta declarado. */
  ruta: string;
  /** El matcher tal cual (`(sin matcher)` si falta). */
  matcher: string;
}

function porNombres(matcher: string): boolean {
  const nombres = matcher.split('|');
  return HERRAMIENTAS_SUBAGENTE.some((h) => nombres.includes(h));
}

/** true si un matcher de PreToolUse se aplica a `Agent` o a `Task`. */
export function matcherAlcanzaSubagente(matcher: unknown): boolean {
  if (matcher === undefined || matcher === null) return true;
  if (typeof matcher !== 'string') return false;
  // Sin espacios alrededor de cada `|`: "Bash | Agent" es la lista Bash, Agent (revision ronda 1, MEN-1).
  const m = matcher
    .split('|')
    .map((n) => n.trim())
    .join('|');
  if (m === '' || m === '*') return true;
  if (/^[A-Za-z0-9_|]+$/.test(m)) return porNombres(m);
  let re: RegExp;
  try {
    re = new RegExp(`^(?:${m})$`);
  } catch {
    return porNombres(m);
  }
  return HERRAMIENTAS_SUBAGENTE.some((h) => re.test(h));
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Hallazgos de un JSON con la forma de `hooks.json` o `settings.json`
 * (`{hooks: {PreToolUse: [{matcher, hooks}]}}`). Una forma inesperada no es
 * un fallo: simplemente no hay hallazgos.
 */
export function hooksQueAlcanzanSubagente(json: unknown, origen: string, ruta: string): HallazgoHook[] {
  if (!esObjeto(json) || !esObjeto(json['hooks'])) return [];
  const pre = json['hooks']['PreToolUse'];
  if (!Array.isArray(pre)) return [];
  const hallazgos: HallazgoHook[] = [];
  for (const entrada of pre) {
    if (!esObjeto(entrada)) continue;
    const matcher = entrada['matcher'];
    if (!matcherAlcanzaSubagente(matcher)) continue;
    hallazgos.push({ origen, ruta, matcher: typeof matcher === 'string' ? matcher : '(sin matcher)' });
  }
  return hallazgos;
}

/**
 * Si un plugin esta habilitado segun los `enabledPlugins` de los settings, del
 * mas especifico al menos (local de proyecto, proyecto, usuario). Sin entrada
 * en ninguno se da por habilitado: es lo prudente para un aviso.
 */
export function pluginHabilitado(clave: string, settings: readonly unknown[]): boolean {
  for (const s of settings) {
    if (!esObjeto(s) || !esObjeto(s['enabledPlugins'])) continue;
    const v = s['enabledPlugins'][clave];
    if (typeof v === 'boolean') return v;
  }
  return true;
}
