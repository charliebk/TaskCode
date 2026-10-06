// Fixtures compartidas de los tests de start (antes en test/commands/start.test.ts,
// partido en varios ficheros para que el runner los reparta entre procesos).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
import { TaskFolderConflictError } from '../../src/fs/task-store.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';


export const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/commands -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
export const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

export function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-500',
    titulo: 'Tarea de prueba de integracion',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-diseno',
    // true desde TASK-016. Hasta entonces era false y la tarea
    // arrancaba igual, porque `simple` estaba eximida del checkpoint
    // humano; ahora el checkpoint es obligatorio para las cinco
    // complejidades (seccion 14, punto 1) y una tarea sin aprobar ya no
    // representa el caso normal de "start", sino el que se rechaza.
    // Ese rechazo lo cubren dos tests propios mas abajo.
    plan_aprobado: true,
    rama: 'feature/task-500-prueba-de-integracion',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: '2026-09-03',
    actualizado: '2026-09-03',
    dependencias: [],
    ...overrides,
  };
}

export function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

/**
 * writeTareaFile deja tareas/.../tarea.md sin commitear (es solo I/O de
 * disco, no toca Git). En uso real esa tarea.md ya estaria commiteada
 * (viene de un "taskctl plan"/"approve" previo) antes de que alguien
 * ejecute start, asi que los tests que prueban el camino feliz la
 * commitean aqui para dejar el workspace limpio antes de invocar
 * runStartCommand, igual que estaria en un uso real.
 */
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
export const withTempRepo: ConRepo = plantillaRepo('taskctl-start-', async (repoRoot) => {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    // Igual que en scripts/gitflow/test/smoke-test.sh: logs/ tiene que
    // estar en .gitignore ANTES del primer commit, o el propio uso de
    // Git-Flow se autobloquea (hallazgo 2 de TASK-007).
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
});
