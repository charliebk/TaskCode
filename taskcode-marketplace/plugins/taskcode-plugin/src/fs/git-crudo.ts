/**
 * `git` sin lanzar nunca. Nacio para `taskctl doctor-deploy` (TASK-066: salida
 * en bruto, blobs que pueden no ser UTF-8, un fallo convertible en «NO
 * VERIFICADO»). Desde TASK-149a es el unico envoltorio de git sin lanzar de fs
 * y hooks: texto, linea, resultado, ok, ruta bajo el directorio de Git y rama
 * actual. El `git` que lanza (GitCommandError) es runGit de fs/git.ts.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export interface SalidaGitCruda {
  status: number | null;
  stdout: Buffer;
  stderr: string;
  /** Error de lanzamiento: git no esta, directorio inexistente, timeout o desbordamiento de buffer. */
  error: Error | undefined;
}

export interface OpcionesGitCrudo {
  input?: string | Buffer;
  maxBuffer?: number;
  timeoutMs?: number;
  /** TASK-145a: variables que se anaden al entorno (el de doctor, p. ej.). */
  env?: NodeJS.ProcessEnv;
}

const MAX_BUFFER_POR_DEFECTO = 64 * 1024 * 1024;
const TIMEOUT_POR_DEFECTO_MS = 60_000;

export function gitCrudo(args: readonly string[], cwd: string, opciones: OpcionesGitCrudo = {}): SalidaGitCruda {
  const r = spawnSync('git', args, {
    cwd,
    input: opciones.input,
    maxBuffer: opciones.maxBuffer ?? MAX_BUFFER_POR_DEFECTO,
    timeout: opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0', ...opciones.env },
  });
  return {
    status: r.status,
    stdout: Buffer.isBuffer(r.stdout) ? r.stdout : Buffer.alloc(0),
    stderr: Buffer.isBuffer(r.stderr) ? r.stderr.toString('utf8') : '',
    error: r.error,
  };
}

/** Salida de texto de un `git` que acabo bien, o null si fallo (en cualquier forma). */
export function gitTexto(args: readonly string[], cwd: string, opciones: OpcionesGitCrudo = {}): string | null {
  const r = gitCrudo(args, cwd, opciones);
  if (r.error !== undefined || r.status !== 0) return null;
  return r.stdout.toString('utf8');
}

// TASK-149a (FS-07): los envoltorios de git sin lanzar de fs y hooks son estos,
// todos sobre gitCrudo (un maxBuffer, un timeout y un entorno).

/** La salida recortada de un `git` que acabo bien, o null si fallo. */
export function gitLinea(args: readonly string[], cwd: string): string | null {
  const t = gitTexto(args, cwd);
  return t === null ? null : t.trim();
}

/** Si el `git` acabo bien y su salida recortada ('' si fallo): la forma de los guardianes. */
export function gitResultado(args: readonly string[], cwd: string): { ok: boolean; out: string } {
  const t = gitLinea(args, cwd);
  return { ok: t !== null, out: t ?? '' };
}

/** true si el `git` acabo bien. */
export function gitOk(args: readonly string[], cwd: string): boolean {
  return gitLinea(args, cwd) !== null;
}

/**
 * TASK-149a (FS-08): ruta absoluta de `ruta` dentro del directorio de Git
 * (`git rev-parse --git-path`, por worktree), o null fuera de un repo.
 * `--git-path` responde relativa al cwd de Git, por eso se resuelve contra `cwd`.
 */
export function rutaGit(cwd: string, ruta: string): string | null {
  const p = gitLinea(['rev-parse', '--git-path', ruta], cwd);
  return p === null || p === '' ? null : path.resolve(cwd, p);
}

/**
 * TASK-149a (FS-06): la rama actual. Con HEAD desacoplado durante un rebase,
 * la que se esta rebasando (la tarea sigue protegida). null fuera de un repo
 * o con HEAD desacoplado sin rebase.
 */
export function ramaActual(cwd: string): string | null {
  const actual = gitLinea(['branch', '--show-current'], cwd);
  if (actual === null) return null;
  if (actual !== '') return actual;
  for (const f of ['rebase-merge/head-name', 'rebase-apply/head-name']) {
    const fichero = rutaGit(cwd, f);
    if (fichero !== null && existsSync(fichero)) {
      const rama = readFileSync(fichero, 'utf8').trim().replace(/^refs\/heads\//, '');
      return rama === '' ? null : rama;
    }
  }
  return null;
}
