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
 * 2. `stdin: 'ignore'` POR DEFECTO, nunca `'inherit'` por descuido: si
 *    por lo que sea un script del ciclo de vida SI llega a un
 *    `read -rp` (no deberia, taskctl comprueba workspace limpio antes
 *    de invocar), TASK-007 establecio que `read` con stdin no
 *    interactivo recibe EOF de inmediato (no bloquea el proceso) —
 *    ignorar stdin explicitamente hace ese comportamiento
 *    determinista en vez de heredar lo que sea que tenga el proceso
 *    padre, y evita que un `taskctl finish` se quede colgado
 *    esperando en una tuberia que nadie va a cerrar.
 *
 * Los cinco wrappers de TASK-026 (`diagnose`, `pause`, `resume`,
 * `recover`, `abort-merge`) son la excepcion, y por eso la opcion
 * existe: sus scripts SI preguntan, y preguntar es justamente lo que
 * se espera de ellos. Pasan `stdin: 'inherit'` de forma explicita;
 * `start`, `review` y `finish` no la pasan y se quedan con 'ignore'.
 */
import { spawnSync, type SpawnSyncOptions, type SpawnSyncReturns } from 'node:child_process';
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
  /**
   * Que hacer con la entrada estandar del script. Omitirlo significa
   * 'ignore', que es lo que quiere todo el ciclo de vida; 'inherit'
   * es para los wrappers interactivos de TASK-026 (ver cabecera).
   */
  stdin?: 'ignore' | 'inherit';
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

/**
 * EL unico sitio que lanza bash: `bash "<ruta>" args`, sin shell y con el
 * PATH heredado. `runGitflowScript` y la sonda de `taskctl doctor` pasan por
 * aqui: si la sonda lanzara de otra forma, podria dar OK y que los scripts
 * fallaran (o al reves).
 */
function lanzarBash(
  scriptPath: string,
  args: readonly string[],
  extra: SpawnSyncOptions
): SpawnSyncReturns<string | Buffer> {
  return spawnSync('bash', [scriptPath, ...args], extra);
}

export function runGitflowScript(
  scriptName: string,
  args: readonly string[],
  opts: RunGitflowScriptOptions
): GitflowScriptResult {
  const scriptPath = path.join(opts.scriptsDir, scriptName);
  const result = lanzarBash(scriptPath, args, {
    cwd: opts.cwd,
    stdio: [opts.stdin ?? 'ignore', 'inherit', 'inherit'],
  });
  if (result.error) {
    throw new GitflowScriptLaunchError(scriptName, result.error);
  }
  return { code: result.status ?? 1, signal: result.signal ?? null };
}

/** Script de la sonda, junto a los de Git-Flow. */
export const SONDA_BASH = '_sonda-bash.sh';
const MARCA_SONDA = 'taskctl-sonda-ok';

export type ResultadoSondaBash =
  | { ok: true; version: string }
  | { ok: false; causa: 'no-lanzable' | 'timeout' | 'fallo'; detalle: string };

/**
 * TASK-062 (`taskctl doctor`): ejecuta de verdad el script minimo de la
 * sonda con el mismo lanzamiento que los scripts de Git-Flow y exige codigo 0
 * Y la marca en stdout. Ni `--version` ni buscar `bash` por el PATH: en
 * Windows el bash de WSL (System32) responde a `--version` y a `where` y
 * luego no puede abrir el script, y el de Git sin usr/bin en el PATH arranca
 * pero sin mktemp ni grep. Nunca lanza; la salida se captura (no se hereda,
 * para que `doctor --json` siga limpio).
 */
export function sondearBash(opts: { scriptsDir: string; cwd: string; timeoutMs?: number }): ResultadoSondaBash {
  const r = lanzarBash(path.join(opts.scriptsDir, SONDA_BASH), [], {
    cwd: opts.cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: opts.timeoutMs ?? 20_000,
  });
  // wsl.exe escribe en UTF-16: sin los NUL el texto es legible.
  const limpio = (t: unknown): string => String(t ?? '').replace(/\u0000/g, '').trim();
  if (r.error) {
    const agotado = (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT';
    return { ok: false, causa: agotado ? 'timeout' : 'no-lanzable', detalle: limpio(r.error.message) };
  }
  const lineas = limpio(r.stdout).split(/\r?\n/);
  const marca = lineas.find((l) => l.startsWith(MARCA_SONDA));
  if (r.status === 0 && marca !== undefined) {
    return { ok: true, version: marca.slice(MARCA_SONDA.length).trim() };
  }
  const err = limpio(r.stderr).split(/\r?\n/).filter((x) => x !== '').slice(0, 3).join(' | ');
  const codigo = r.status === null ? `senal ${r.signal ?? 'desconocida'}` : `codigo ${r.status}`;
  return { ok: false, causa: 'fallo', detalle: `el script de prueba termino con ${codigo}${err === '' ? '' : `: ${err}`}` };
}
