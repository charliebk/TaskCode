/**
 * Invocacion de los scripts de scripts/gitflow/ desde taskctl.
 *
 * Dos decisiones deliberadas, ambas motivadas por hallazgos de
 * TASK-007/TASK-008:
 *
 * 1. Siempre `bash "<ruta>/script.sh"`, nunca ejecucion directa del
 *    fichero: el bit +x no sobrevive en este repo (`core.fileMode`
 *    en false — ver scripts/gitflow/README.md), y es mas robusto en
 *    general (NTFS tampoco preserva permisos Unix).
 * 2. `stdin: 'ignore'`, nunca `'inherit'`: si por lo que sea el script
 *    SI llega a un `read -rp` (no deberia, taskctl comprueba workspace
 *    limpio antes de invocar), TASK-007 establecio que `read` con
 *    stdin no interactivo recibe EOF de inmediato (no bloquea el
 *    proceso) — ignorar stdin explicitamente hace ese comportamiento
 *    determinista en vez de heredar lo que sea que tenga el proceso
 *    padre.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

function packageRoot(): string {
  // dist/src/fs/gitflow-runner.js -> dist/src/fs -> dist/src -> dist -> raiz del paquete
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(moduleDir, '..', '..', '..');
}

/**
 * Resuelve el directorio de scripts/gitflow/. Respeta
 * CLAUDE_PLUGIN_ROOT (convencion documentada para cuando Claude Code
 * lanza taskctl como comando de plugin) si esta definida; si no,
 * calcula la ruta relativa al propio modulo compilado — necesario
 * para el dogfooding directo (taskctl invocado a mano, como en este
 * mismo repo) donde esa variable no esta puesta.
 */
export function resolveGitflowScriptsDir(): string {
  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
    return path.join(pluginRoot, 'scripts', 'gitflow');
  }
  return path.join(packageRoot(), 'scripts', 'gitflow');
}

export interface RunGitflowScriptOptions {
  scriptsDir: string;
  cwd: string;
}

export interface GitflowScriptResult {
  code: number;
  /** Nombre de la senal que mato al proceso, si fue el caso (p. ej. un OOM-kill). */
  signal: NodeJS.Signals | null;
}

/**
 * "bash" no se pudo ni siquiera lanzar (no esta en el PATH, etc.).
 * Distinto de un exit code != 0 (el script SI corrio). Sin esto, el
 * ENOENT de spawnSync se propagaba como Error generico y terminaba en
 * el catch-all de bin/taskctl con un mensaje enganoso, como si taskctl
 * mismo hubiera fallado al arrancar (hallazgo de revision por pares,
 * TASK-009) — relevante porque en Windows "bash" solo esta en el PATH
 * si Git for Windows lo expone.
 */
export class GitflowScriptLaunchError extends Error {
  constructor(
    public readonly scriptName: string,
    public readonly originalError: Error
  ) {
    super(`No se pudo ejecutar "bash" para lanzar ${scriptName}: ${originalError.message}`);
    this.name = 'GitflowScriptLaunchError';
  }
}

export function runGitflowScript(
  scriptName: string,
  args: readonly string[],
  opts: RunGitflowScriptOptions
): GitflowScriptResult {
  const scriptPath = path.join(opts.scriptsDir, scriptName);
  const result = spawnSync('bash', [scriptPath, ...args], {
    cwd: opts.cwd,
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  if (result.error) {
    throw new GitflowScriptLaunchError(scriptName, result.error);
  }
  return { code: result.status ?? 1, signal: result.signal ?? null };
}
