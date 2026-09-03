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

function runGit(args: readonly string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error) {
    throw result.error;
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
