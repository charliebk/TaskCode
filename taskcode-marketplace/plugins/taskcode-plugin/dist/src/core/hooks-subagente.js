/**
 * Nucleo puro de la comprobacion `hooks-subagente` de `taskctl doctor`
 * (TASK-076): decide si un hook PreToolUse alcanza al lanzamiento de
 * subagentes (herramientas `Agent` y `Task`). Desde Claude Code 2.1.317 el
 * modo automatico puede denegar el lanzamiento (Auto-Mode Bypass) cuando un
 * hook de ese tipo reescribe el encargo.
 *
 * Semantica del matcher (plan de TASK-076, Carlos 2026-11-06):
 * - `""`, `"*"` o sin matcher: alcanza a todas las herramientas, cuenta.
 * - Solo letras, digitos, `_` y `|`: lista de nombres exactos separada por `|`.
 * - Cualquier otra cosa: regex anclada (`^(?:...)$`); si no compila, se parte
 *   por `|` y se compara literal.
 */
/** Herramientas con las que Claude Code lanza subagentes. */
export const HERRAMIENTAS_SUBAGENTE = ['Agent', 'Task'];
function porNombres(matcher) {
    const nombres = matcher.split('|').map((n) => n.trim());
    return HERRAMIENTAS_SUBAGENTE.some((h) => nombres.includes(h));
}
/** true si un matcher de PreToolUse se aplica a `Agent` o a `Task`. */
export function matcherAlcanzaSubagente(matcher) {
    if (matcher === undefined || matcher === null)
        return true;
    if (typeof matcher !== 'string')
        return false;
    const m = matcher.trim();
    if (m === '' || m === '*')
        return true;
    if (/^[A-Za-z0-9_|]+$/.test(m))
        return porNombres(m);
    let re;
    try {
        re = new RegExp(`^(?:${m})$`);
    }
    catch {
        return porNombres(m);
    }
    return HERRAMIENTAS_SUBAGENTE.some((h) => re.test(h));
}
const esObjeto = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
/**
 * Hallazgos de un JSON con la forma de `hooks.json` o `settings.json`
 * (`{hooks: {PreToolUse: [{matcher, hooks}]}}`). Una forma inesperada no es
 * un fallo: simplemente no hay hallazgos.
 */
export function hooksQueAlcanzanSubagente(json, origen, ruta) {
    if (!esObjeto(json) || !esObjeto(json['hooks']))
        return [];
    const pre = json['hooks']['PreToolUse'];
    if (!Array.isArray(pre))
        return [];
    const hallazgos = [];
    for (const entrada of pre) {
        if (!esObjeto(entrada))
            continue;
        const matcher = entrada['matcher'];
        if (!matcherAlcanzaSubagente(matcher))
            continue;
        hallazgos.push({ origen, ruta, matcher: typeof matcher === 'string' ? matcher : '(sin matcher)' });
    }
    return hallazgos;
}
/**
 * Si un plugin esta habilitado segun los `enabledPlugins` de los settings, del
 * mas especifico al menos (local de proyecto, proyecto, usuario). Sin entrada
 * en ninguno se da por habilitado: es lo prudente para un aviso.
 */
export function pluginHabilitado(clave, settings) {
    for (const s of settings) {
        if (!esObjeto(s) || !esObjeto(s['enabledPlugins']))
            continue;
        const v = s['enabledPlugins'][clave];
        if (typeof v === 'boolean')
            return v;
    }
    return true;
}
