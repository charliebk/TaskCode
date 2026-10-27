/**
 * Lanzamiento de las herramientas externas de `taskctl doctor-deploy`
 * (TASK-066): localizarlas en un PATH que se puede controlar (los tests lo
 * vacian) y ejecutarlas con timeout.
 *
 * Presencia y lanzamiento van separados a proposito: en Windows `npm`, `pnpm`
 * y `yarn` son `.cmd`, y `spawnSync` sin shell devuelve ENOENT para ellos aunque
 * existan (ya paso con `codex`, ver runCodexReview). Y CON shell, un comando
 * que no existe no da ENOENT sino un «no se reconoce» con codigo 1. Asi que la
 * presencia se decide recorriendo el PATH, y solo lo que se encontro se lanza
 * (con shell unicamente si es un `.cmd`/`.bat` en Windows).
 */
import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

/** El PATH del proceso, sea cual sea su capitalizacion (`PATH` o `Path` en Windows). */
export function pathDelProceso(): string {
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toLowerCase() === 'path' && v !== undefined) return v;
  }
  return '';
}

function esEjecutable(ruta: string, plataforma: NodeJS.Platform): boolean {
  try {
    const st = statSync(ruta);
    if (!st.isFile()) return false;
    return plataforma === 'win32' ? true : (st.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

/** Ruta absoluta del ejecutable `nombre` en `pathEnv`, o null si no esta. */
export function localizarHerramienta(
  nombre: string,
  pathEnv: string,
  plataforma: NodeJS.Platform = process.platform
): string | null {
  const dirs = pathEnv.split(path.delimiter).filter((d) => d !== '');
  const exts =
    plataforma === 'win32'
      ? (process.env['PATHEXT'] ?? '.COM;.EXE;.BAT;.CMD').split(';').filter((e) => e !== '')
      : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidata = path.join(dir, nombre + ext);
      if (esEjecutable(candidata, plataforma)) return candidata;
    }
  }
  return null;
}

export interface EjecucionHerramienta {
  /** false si ni siquiera arranco (ENOENT, EACCES...). */
  lanzada: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
  /** Mensaje del error de lanzamiento, si lo hubo. */
  error: string | null;
  timeout: boolean;
}

const MAX_BUFFER_HERRAMIENTA = 64 * 1024 * 1024;

function entornoDeHerramienta(pathEnv: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.toLowerCase() !== 'path') env[k] = v;
  }
  env['PATH'] = pathEnv;
  // Salida estable: la que parsean los interpretes esta en ingles y sin color.
  env['NO_COLOR'] = '1';
  env['DOTNET_CLI_UI_LANGUAGE'] = 'en';
  env['DOTNET_NOLOGO'] = '1';
  env['DOTNET_CLI_TELEMETRY_OPTOUT'] = '1';
  return env;
}

export function ejecutarHerramienta(
  ruta: string,
  args: readonly string[],
  cwd: string,
  pathEnv: string,
  timeoutMs: number,
  plataforma: NodeJS.Platform = process.platform
): EjecucionHerramienta {
  const conShell = plataforma === 'win32' && /\.(?:cmd|bat)$/i.test(ruta);
  // Con shell, Node no cita: la ruta (puede llevar espacios) va entre comillas.
  // Los argumentos son constantes de este modulo, sin caracteres especiales.
  const comando = conShell ? `"${ruta}"` : ruta;
  const r = spawnSync(comando, [...args], {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: MAX_BUFFER_HERRAMIENTA,
    shell: conShell,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: entornoDeHerramienta(pathEnv),
  });
  const code = (r.error as NodeJS.ErrnoException | undefined)?.code;
  const timeout = code === 'ETIMEDOUT' || (r.error !== undefined && r.signal === 'SIGTERM');
  if (r.error !== undefined) {
    return {
      lanzada: timeout,
      status: null,
      stdout: r.stdout ?? '',
      stderr: r.stderr ?? '',
      error: r.error.message,
      timeout,
    };
  }
  return { lanzada: true, status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '', error: null, timeout: false };
}

/** Primera linea con algo, recortada: la version que imprime `herramienta --version`. */
export function versionDe(
  ruta: string,
  argsVersion: readonly string[],
  cwd: string,
  pathEnv: string,
  plataforma: NodeJS.Platform = process.platform
): string {
  const e = ejecutarHerramienta(ruta, argsVersion, cwd, pathEnv, 15_000, plataforma);
  if (e.error !== null || e.status !== 0) return 'version desconocida';
  const linea = e.stdout.split(/\r?\n/).find((l) => l.trim() !== '') ?? '';
  return linea.trim().slice(0, 60) || 'version desconocida';
}
