// Fixtures compartidas de los tests de finish (antes en test/commands/finish.test.ts,
// partido en varios ficheros para que el runner los reparta entre procesos).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand, FinishCommandError, veredictoAprobado } from '../../src/commands/finish.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';


export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

export function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-700',
    titulo: 'Tarea de prueba de finish',
    tipo: 'feature',
    sprint: 2,
    etiquetas: ['cli', 'gitflow'],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-revision',
    plan_aprobado: true,
    rama: 'feature/task-700-prueba-finish',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-05',
    actualizado: '2026-09-05',
    dependencias: [],
    ...overrides,
  };
}

export function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

/**
 * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
 * lo que el mismo escribe, asi que llamar a esto justo despues de un
 * comando puede no tener ya nada que registrar: `git commit` sale 1
 * con "nothing to commit" y el assert de `git()` lo daria por fallo
 * del test. Se commitea solo si queda algo — y que no quede es
 * exactamente la senal de que el auto-commit hizo su trabajo.
 */
export function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', message], repoRoot);
}

// Repo base montado una vez por fichero y copiado en cada test
// (test/helpers/repo-plantilla.ts). La receta es la de siempre.
export const withTempRepo: ConRepo = plantillaRepo('taskctl-finish-', async (repoRoot) => {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
});

export const VEREDICTO_APROBADO = '- Veredicto: aprobada (revisada por el agente independiente)\n';

/**
 * Deja la tarea en-revision en su rama con el informe de la ronda 1
 * commiteado, como la habria dejado el ciclo start -> review + el
 * revisor volcando su veredicto. `base` es la rama de la que nace la
 * rama de trabajo (develop para feature/fix/release, main para hotfix).
 */
export async function setupTaskEnRevision(
  repoRoot: string,
  tareasRoot: string,
  task: Task,
  opts: { base?: string; veredicto?: string; conCodex?: string } = {}
): Promise<void> {
  const base = opts.base ?? 'develop';
  git(['checkout', '-q', '-b', task.rama, base], repoRoot);
  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar finish.\n');
  await writeFile(path.join(repoRoot, `trabajo-${task.id}.txt`), 'trabajo de la tarea\n', 'utf8');
  const revisionDir = path.join(tareasRoot, '03-en-revision', task.id, 'revision');
  await mkdir(revisionDir, { recursive: true });
  await writeFile(
    path.join(revisionDir, 'informe-revision-1.md'),
    `# Informe de revision — ${task.id} (ronda 1)\n\n${opts.veredicto ?? VEREDICTO_APROBADO}`,
    'utf8'
  );
  if (opts.conCodex !== undefined) {
    await writeFile(
      path.join(revisionDir, 'informe-codex-1.md'),
      `# Informe Codex — ${task.id}\n\n${opts.conCodex}`,
      'utf8'
    );
  }
  commitAll(repoRoot, `feat(${task.id}): trabajo revisado`);
}
