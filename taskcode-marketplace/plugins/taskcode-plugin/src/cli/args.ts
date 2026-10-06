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
import { masParecida } from '../core/sugerencia.js';

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

/**
 * Aborta si argv trae un flag que el comando no conoce (TASK-047, auditoria
 * D4). Antes `--complejida trivial` se ignoraba en silencio y la tarea salia
 * con otra complejidad. Mira argv en bruto y no la salida de `parseArgs`,
 * porque varios comandos leen sus flags a mano.
 *
 * Solo cuenta como flag un token `--nombre` (o `--nombre=valor`) y los cortos
 * que el comando declare (`-p`): un valor como `-1` no es un flag. Un token
 * `--x` justo despues de un flag con valor tambien se comprueba — es lo que
 * `parseArgs` haria con el; para pasar un valor que empieza por `--` esta
 * `--flag=valor`. `validos` va con su prefijo (`--titulo`, `-p`).
 */
/** Flags booleanos del CLI: los comandos solo reconocen el token suelto. */
const FLAGS_SIN_VALOR: readonly string[] = ['--push', '--json', '--forzar', '--escribir', '--heuristica', '--merge-request'];

export function rechazarFlagsDesconocidos(
  argv: readonly string[],
  validos: readonly string[],
  comando: string,
  fail: (mensaje: string) => Error
): void {
  for (const arg of argv) {
    let flag: string;
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      flag = eq === -1 ? arg : arg.slice(0, eq);
    } else if (/^-[A-Za-z]$/.test(arg)) {
      flag = arg;
    } else {
      continue;
    }
    if (validos.includes(flag)) {
      // MENOR-1 de la revision de TASK-047: `--push=1` o `--json=1` pasaban
      // la guarda y el comando, que mira el token suelto, los ignoraba.
      if (flag !== arg && FLAGS_SIN_VALOR.includes(flag)) {
        throw fail(
          `[ERROR] taskctl ${comando}: "${flag}" no lleva valor: usalo suelto (${flag}).`
        );
      }
      continue;
    }
    const sugerida = flag.startsWith('--') && flag.length > 2
      ? masParecida(flag.slice(2), validos.filter((v) => v.startsWith('--')).map((v) => v.slice(2)))
      : null;
    const lineas = [`[ERROR] taskctl ${comando}: flag desconocido "${flag}".`];
    if (sugerida !== null) lineas.push(`        Quiza quisiste decir "--${sugerida}".`);
    lineas.push(
      validos.length === 0
        ? `        "${comando}" no admite flags.`
        : `        Flags validos: ${validos.join(', ')}.`
    );
    throw fail(lineas.join('\n'));
  }
}
