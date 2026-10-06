// Fixtures de los tests de finish con remoto (TASK-060): un repo bare REAL
// haciendo de origin, bajo la URL de GitHub / GitLab que se quiera.
//
// `origin` se configura con la URL "publica" (la que lee la deteccion de
// plataforma) y una regla `url.<bare>.insteadOf <esa url>` hace que Git hable
// en realidad con el bare local: push, fetch y ls-remote son reales y no hay
// red. Funciona igual con una URL con credenciales incrustadas.

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { git } from './finish-fixtures.js';

export const URL_GITHUB = 'https://github.com/acme/repo.git';
export const URL_GITLAB = 'https://gitlab.example.com/acme/repo.git';

export interface Origin {
  /** Directorio del repo bare. */
  bare: string;
  limpiar(): Promise<void>;
}

/** Crea el bare, lo configura como origin de `repoRoot` y sube `main` y `develop`. */
export async function montarOrigin(repoRoot: string, urlVisible: string = URL_GITHUB): Promise<Origin> {
  const bare = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-'));
  git(['init', '-q', '--bare', '-b', 'main', bare], repoRoot);
  const ruta = bare.replace(/\\/g, '/');
  git(['remote', 'add', 'origin', urlVisible], repoRoot);
  git(['config', `url.${ruta}.insteadOf`, urlVisible], repoRoot);
  git(['push', '-q', 'origin', 'main', 'develop'], repoRoot);
  return { bare, limpiar: () => rm(bare, { recursive: true, force: true }) };
}

/** Lo que el bare tiene en `refs/heads/<rama>` (SHA) o null. */
export function ramaEnBare(bare: string, rama: string): string | null {
  const r = spawnSync('git', ['--git-dir', bare, 'rev-parse', '--verify', '--quiet', `refs/heads/${rama}`], {
    encoding: 'utf8',
  });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** Tags del bare. */
export function tagsEnBare(bare: string): string[] {
  return git(['--git-dir', bare, 'tag', '-l'], bare)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
}

/**
 * Simula lo que hace la plataforma al mergear el PR: en un clon temporal del
 * bare integra `rama` en `base` (merge `--no-ff`, squash o rebase) y sube.
 * Devuelve el commit resultante en `base` (el que la plataforma informaria).
 */
export async function mergearEnPlataforma(
  bare: string,
  rama: string,
  base: string,
  modo: 'merge' | 'squash' | 'rebase'
): Promise<string> {
  const clon = await mkdtemp(path.join(tmpdir(), 'taskctl-plataforma-'));
  try {
    git(['clone', '-q', bare, clon], tmpdir());
    git(['config', 'user.email', 'plataforma@example.com'], clon);
    git(['config', 'user.name', 'Plataforma'], clon);
    git(['checkout', '-q', base], clon);
    if (modo === 'merge') {
      git(['merge', '-q', '--no-ff', `origin/${rama}`, '-m', `Merge pull request de ${rama}`], clon);
    } else if (modo === 'squash') {
      git(['merge', '-q', '--squash', `origin/${rama}`], clon);
      git(['commit', '-q', '-m', `Squash de ${rama}`], clon);
    } else {
      git(['checkout', '-q', '-b', 'rebase-tmp', `origin/${rama}`], clon);
      git(['rebase', '-q', base], clon);
      git(['checkout', '-q', base], clon);
      git(['merge', '-q', '--ff-only', 'rebase-tmp'], clon);
    }
    git(['push', '-q', 'origin', base], clon);
    const sha = git(['rev-parse', 'HEAD'], clon).trim();
    assert.match(sha, /^[0-9a-f]{40}$/);
    return sha;
  } finally {
    await rm(clon, { recursive: true, force: true });
  }
}
