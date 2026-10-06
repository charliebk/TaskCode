// Fixtures compartidas de los tests de review (antes en test/commands/review.test.ts,
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
import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
import { diffParaRevision, diffRangeForPaths } from '../../src/fs/git.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';


export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

export function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-600',
    titulo: 'Tarea de prueba de review',
    tipo: 'feature',
    sprint: 2,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-curso',
    plan_aprobado: true,
    rama: 'feature/task-600-prueba-review',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
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
export const withTempRepo: ConRepo = plantillaRepo('taskctl-review-', async (repoRoot) => {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
});

/**
 * Deja la tarea en-curso en su rama, como la habria dejado "taskctl
 * start": rama creada desde develop, tarea.md commiteado en
 * 02-en-curso/, y un commit de trabajo propio de la rama.
 */
export async function setupTaskEnCurso(repoRoot: string, tareasRoot: string, task: Task): Promise<void> {
  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar review.\n');
  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo de la tarea\n', 'utf8');
  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
}

/** Avanza develop con un cambio y vuelve a la rama indicada. */
export async function advanceDevelop(repoRoot: string, volverA: string): Promise<void> {
  git(['checkout', '-q', 'develop'], repoRoot);
  await writeFile(path.join(repoRoot, 'cambio-develop.txt'), 'cambio en develop\n', 'utf8');
  commitAll(repoRoot, 'cambio en develop');
  git(['checkout', '-q', volverA], repoRoot);
}

/**
 * Escribe un fichero bajo `repoRoot/ruta` (con "/" de Git), creando los
 * directorios que hagan falta. Para las pruebas de clasificacion por
 * dominio (TASK-018): las rutas se eligen IGUAL que las de
 * test/skills/revisores.test.ts (RUTAS_LEGITIMAS/RUTAS_AJENAS), para no
 * inventar una segunda tabla de "que ruta cae en que dominio" que pueda
 * divergir de la que ese fichero ya prueba contra las skills reales.
 */
export async function escribirFichero(repoRoot: string, ruta: string, contenido: string): Promise<void> {
  const destino = path.join(repoRoot, ...ruta.split('/'));
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, contenido, 'utf8');
}

/**
 * Ruta (con "/" de Git) de tarea.md tal como queda en la rama de una
 * tarea en-curso. A diferencia de setupTaskEnCurso, esta variante NO
 * anade "trabajo.txt": las pruebas de clasificacion por dominio
 * (TASK-018) necesitan controlar EXACTAMENTE que ficheros trae el diff,
 * y tarea.md es el UNICO que no se puede evitar (toda tarea necesita su
 * frontmatter commiteado en la rama para que el resto del ciclo
 * funcione) — se deja como el unico "ruido" de fondo, documentado en
 * cada test que lo necesita.
 */
export function rutaTareaMd(id: string): string {
  return `tareas/02-en-curso/${id}/tarea.md`;
}

/** Como setupTaskEnCurso, pero sin escribir "trabajo.txt". */
export async function setupTaskEnCursoSoloTarea(
  repoRoot: string,
  tareasRoot: string,
  task: Task
): Promise<void> {
  git(['checkout', '-q', '-b', task.rama, 'develop'], repoRoot);
  await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el enrutado por dominio.\n');
  commitAll(repoRoot, `feat(${task.id}): trabajo de la tarea`);
}
