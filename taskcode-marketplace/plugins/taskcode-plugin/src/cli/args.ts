/**
 * Parser de argumentos minimo, sin dependencias: --flag valor,
 * --flag=valor y --flag (booleano) mezclados con argumentos
 * posicionales. Suficiente para los comandos de Sprint 0; si mas
 * adelante hace falta algo mas rico (subcomandos anidados, alias) se
 * reevalua, pero no antes.
 *
 * `--flag=valor` (hallazgo de revision por pares, Sprint 0) es la via
 * de escape para pasar un valor que empieza por "--" (p. ej.
 * --titulo="--urgente"), que con la forma "--flag valor" se
 * malinterpretaria como un flag nuevo.
 */
export interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg.startsWith('--')) {
      const withoutPrefix = arg.slice(2);
      const eqIdx = withoutPrefix.indexOf('=');
      if (eqIdx !== -1) {
        const key = withoutPrefix.slice(0, eqIdx);
        flags[key] = withoutPrefix.slice(eqIdx + 1);
        continue;
      }
      const key = withoutPrefix;
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}
