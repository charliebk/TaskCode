/**
 * Wrapper minimo sobre comandos Git puntuales que taskctl necesita
 * ejecutar el mismo (no via los scripts de Git-Flow): comprobar si el
 * workspace esta limpio y confirmar la rama activa. Deliberadamente
 * pequeno — la logica de Git-Flow en si (crear/mergear ramas) vive en
 * scripts/gitflow/, no aqui (ver seccion 7.1 de la metodologia: los
 * scripts .sh siguen siendo la unica fuente de verdad para eso).
 */
import { spawnSync } from 'node:child_process';

export class GitCommandError extends Error {
  constructor(
    public readonly args: readonly string[],
    public readonly stderr: string
  ) {
    super(`git ${args.join(' ')} fallo: ${stderr.trim() || '(sin salida de error)'}`);
    this.name = 'GitCommandError';
  }
}

/**
 * "git" no se pudo ni siquiera lanzar (no esta en el PATH, etc.) —
 * distinto de GitCommandError (git se ejecuto pero devolvio un error).
 * Sin esto, un ENOENT de spawnSync se propagaba como Error generico y
 * terminaba en el catch-all de bin/taskctl con un mensaje enganoso
 * ("taskctl no pudo arrancar"), como si el propio CLI hubiera fallado
 * al arrancar en vez de faltarle una dependencia externa en tiempo de
 * ejecucion (hallazgo de revision por pares, TASK-009).
 */
export class GitLaunchError extends Error {
  constructor(public readonly originalError: Error) {
    super(`No se pudo ejecutar "git": ${originalError.message}`);
    this.name = 'GitLaunchError';
  }
}

function runGit(args: readonly string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  if (result.status !== 0) {
    throw new GitCommandError(args, result.stderr ?? '');
  }
  return (result.stdout ?? '').trim();
}

/** true si `git status --porcelain` no devuelve nada (workspace limpio). */
export function isWorkspaceClean(cwd: string): boolean {
  return runGit(['status', '--porcelain'], cwd) === '';
}

/** Nombre de la rama activa (equivalente a `git branch --show-current`). */
export function currentBranch(cwd: string): string {
  return runGit(['branch', '--show-current'], cwd);
}

/**
 * true si `name` es un nombre de rama valido para Git (delega en
 * `git check-ref-format`, la misma comprobacion que ya hace
 * `assert_valid_branch_name` en _gitflow-common.sh). Defensa en
 * profundidad (hallazgo menor de revision por pares, TASK-009): sin
 * esto, un `task.rama` invalido solo se detecta varios procesos mas
 * abajo, dentro del script de Git-Flow.
 */
export function isValidBranchName(name: string, cwd: string): boolean {
  const result = spawnSync('git', ['check-ref-format', '--branch', name], {
    cwd,
    encoding: 'utf8',
  });
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  return result.status === 0;
}
