/**
 * Tests de wip-scan (TASK-025, item C8) contra repos Git reales con
 * varias ramas de verdad: una mergeada, otra no, y una sin tareas.
 * Nada de esto se puede probar con mocks, que es justo lo que hizo que
 * B7 pareciera correcto durante una tarea entera.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeTareaFile } from '../../src/fs/task-store.js';
import {
  ramasDeTrabajoAbiertas,
  tareasEnRamasAbiertas,
  escanearWip,
} from '../../src/fs/wip-scan.js';
import { ESTADOS_QUE_OCUPAN_WIP } from '../../src/core/wip.js';
import type { Task } from '../../src/core/task.js';

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git fallo: ${result.stderr}`);
}

function tarea(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-900',
    titulo: 'Tarea de prueba',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-curso',
    plan_aprobado: true,
    rama: 'feature/task-900-prueba',
    asignado_a: 'carlos@example.com',
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-06',
    actualizado: '2026-09-06',
    dependencias: [],
    ...overrides,
  };
}

async function withRepo(
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wipscan-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# repo', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/** Crea una rama con una tarea en curso dentro, y vuelve a develop. */
async function ramaConTarea(
  repoRoot: string,
  tareasRoot: string,
  rama: string,
  task: Task
): Promise<void> {
  git(['checkout', '-q', '-b', rama], repoRoot);
  await writeTareaFile(tareasRoot, task, '');
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'tarea en rama'], repoRoot);
  git(['checkout', '-q', 'develop'], repoRoot);
}

test('ramasDeTrabajoAbiertas: excluye la base y la principal', async () => {
  await withRepo(async (repoRoot) => {
    assert.deepEqual(ramasDeTrabajoAbiertas(repoRoot, 'develop', 'main'), []);
  });
});

test('ramasDeTrabajoAbiertas: una rama sin mergear cuenta; una mergeada no', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await ramaConTarea(repoRoot, tareasRoot, 'feature/abierta', tarea({ id: 'TASK-901' }));
    await ramaConTarea(repoRoot, tareasRoot, 'feature/cerrada', tarea({ id: 'TASK-902' }));
    git(['merge', '--no-ff', '-q', '-m', 'merge', 'feature/cerrada'], repoRoot);

    // La mergeada sigue existiendo (politica IECA: las ramas no se
    // borran), pero ya no es trabajo en curso.
    assert.deepEqual(ramasDeTrabajoAbiertas(repoRoot, 'develop', 'main'), ['feature/abierta']);
  });
});

test('ramasDeTrabajoAbiertas: una rama mergeada solo en main tampoco cuenta', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    // Un hotfix mergeado a main esta cerrado aunque el backmerge a
    // develop no haya ocurrido: bloquear por eso seria un falso
    // positivo imposible de adivinar desde el mensaje.
    await ramaConTarea(repoRoot, tareasRoot, 'hotfix/urgente', tarea({ id: 'TASK-903' }));
    git(['checkout', '-q', 'main'], repoRoot);
    git(['merge', '--no-ff', '-q', '-m', 'merge a main', 'hotfix/urgente'], repoRoot);
    git(['checkout', '-q', 'develop'], repoRoot);

    assert.deepEqual(ramasDeTrabajoAbiertas(repoRoot, 'develop', 'main'), []);
  });
});

test('tareasEnRamasAbiertas: lee la tarea DENTRO de la rama, no del working tree', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await ramaConTarea(
      repoRoot,
      tareasRoot,
      'feature/abierta',
      tarea({ id: 'TASK-901', asignado_a: 'carlos@example.com' })
    );

    // En develop no hay ni rastro de la tarea.
    const r = tareasEnRamasAbiertas(repoRoot, ['feature/abierta'], ESTADOS_QUE_OCUPAN_WIP);

    assert.equal(r.tareas.length, 1);
    assert.equal(r.tareas[0]?.task.id, 'TASK-901');
    assert.equal(r.tareas[0]?.task.asignado_a, 'carlos@example.com');
    assert.equal(r.tareas[0]?.estadoCarpeta, 'en-curso');
  });
});

test('tareasEnRamasAbiertas: una rama sin tareas no aporta nada ni falla', async () => {
  await withRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/sin-tareas'], repoRoot);
    git(['checkout', '-q', 'develop'], repoRoot);

    const r = tareasEnRamasAbiertas(repoRoot, ['feature/sin-tareas'], ESTADOS_QUE_OCUPAN_WIP);

    assert.deepEqual(r.tareas, []);
    assert.deepEqual(r.ilegibles, []);
  });
});

test('tareasEnRamasAbiertas: un tarea.md ilegible se reporta con SU rama delante', async () => {
  await withRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/rota'], repoRoot);
    const dir = path.join(repoRoot, 'tareas', '02-en-curso', 'TASK-904');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'tarea.md'), 'esto no es frontmatter', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'tarea rota'], repoRoot);
    git(['checkout', '-q', 'develop'], repoRoot);

    const r = tareasEnRamasAbiertas(repoRoot, ['feature/rota'], ESTADOS_QUE_OCUPAN_WIP);

    assert.deepEqual(r.tareas, []);
    assert.equal(r.ilegibles.length, 1);
    // Sin la rama delante, la ruta manda a un fichero que en el
    // checkout de quien lee el error no existe.
    assert.ok(r.ilegibles[0]?.startsWith('feature/rota:'), r.ilegibles[0]);
  });
});

test('escanearWip: une el arbol activo y las ramas, sin contar dos veces', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    // Una tarea vive en la rama...
    await ramaConTarea(repoRoot, tareasRoot, 'feature/abierta', tarea({ id: 'TASK-901' }));
    // ...y otra en el arbol de develop (el caso del bootstrapping).
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-902' }), '');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'una en curso en la propia base'], repoRoot);

    const r = await escanearWip(tareasRoot, repoRoot, 'develop', 'main', ESTADOS_QUE_OCUPAN_WIP);

    assert.deepEqual(
      r.tareas.map((t) => t.task.id).sort(),
      ['TASK-901', 'TASK-902']
    );
  });
});

test('escanearWip: la misma tarea en el arbol y en su rama ocupa un solo hueco', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-901' }), '');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'en curso en develop'], repoRoot);
    git(['checkout', '-q', '-b', 'feature/abierta'], repoRoot);
    git(['commit', '-q', '--allow-empty', '-m', 'algo mas en la rama'], repoRoot);
    git(['checkout', '-q', 'develop'], repoRoot);

    const r = await escanearWip(tareasRoot, repoRoot, 'develop', 'main', ESTADOS_QUE_OCUPAN_WIP);

    assert.equal(r.tareas.length, 1);
  });
});
