import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  parseNewTaskArgs,
  buildNewTask,
  slugify,
  runNewCommand,
  NewTaskArgError,
} from '../../src/commands/new.js';
import { BaseBranchGuardError } from '../../src/fs/git.js';

test('parseNewTaskArgs: titulo por --titulo o posicional, defaults razonables', () => {
  const a = parseNewTaskArgs(['--titulo', 'Mi tarea', '--tipo', 'feature']);
  assert.equal(a.titulo, 'Mi tarea');
  assert.equal(a.tipo, 'feature');
  assert.equal(a.sprint, 0);
  assert.equal(a.complejidad, 'media');
  assert.deepEqual(a.etiquetas, []);

  const b = parseNewTaskArgs(['Otra tarea', '--tipo', 'fix']);
  assert.equal(b.titulo, 'Otra tarea');
});

test('parseNewTaskArgs: falla sin titulo', () => {
  assert.throws(() => parseNewTaskArgs(['--tipo', 'feature']), NewTaskArgError);
});

test('parseNewTaskArgs: falla sin --tipo', () => {
  assert.throws(() => parseNewTaskArgs(['--titulo', 'x']), NewTaskArgError);
});

test('parseNewTaskArgs: falla con --tipo invalido', () => {
  assert.throws(
    () => parseNewTaskArgs(['--titulo', 'x', '--tipo', 'chore']),
    NewTaskArgError
  );
});

test('parseNewTaskArgs: falla con --complejidad invalida', () => {
  assert.throws(
    () => parseNewTaskArgs(['--titulo', 'x', '--tipo', 'fix', '--complejidad', 'imposible']),
    NewTaskArgError
  );
});

test('parseNewTaskArgs: falla con --sprint no numerico', () => {
  assert.throws(
    () => parseNewTaskArgs(['--titulo', 'x', '--tipo', 'fix', '--sprint', 'dos']),
    NewTaskArgError
  );
});

test('parseNewTaskArgs: --complejidad y --sprint validos se aceptan tal cual (hallazgo pre-existente sin cubrir, cerrado de paso)', () => {
  const a = parseNewTaskArgs(['--titulo', 'x', '--tipo', 'feature', '--complejidad', 'critica', '--sprint', '3']);
  assert.equal(a.complejidad, 'critica');
  assert.equal(a.sprint, 3);
});

test('parseNewTaskArgs: --etiquetas separadas por coma, con espacios', () => {
  const a = parseNewTaskArgs([
    '--titulo', 'x', '--tipo', 'feature', '--etiquetas', 'ifc, importador ,validacion',
  ]);
  assert.deepEqual(a.etiquetas, ['ifc', 'importador', 'validacion']);
});

test('slugify: normaliza tildes, minusculas y separadores', () => {
  assert.equal(slugify('Añadir validación de espesor'), 'anadir-validacion-de-espesor');
  assert.equal(slugify('  Con   espacios   raros  '), 'con-espacios-raros');
});

test('slugify: nunca devuelve vacio (fallback si el titulo no tiene ASCII alfanumerico)', () => {
  assert.equal(slugify('日本語のタスク'), 'tarea');
  assert.equal(slugify('!!!???'), 'tarea');
});

test('slugify: un titulo largo no deja un guion colgante tras cortar a 40 caracteres', () => {
  // Construido para que el caracter 40 caiga justo despues de un separador.
  const titulo = 'a'.repeat(39) + ' b';
  const slug = slugify(titulo);
  assert.ok(!slug.endsWith('-'), `no deberia terminar en "-": "${slug}"`);
});

test('buildNewTask: construye una tarea planificada valida con rama derivada del slug', () => {
  const task = buildNewTask(
    'TASK-005',
    {
      titulo: 'Revisar formato de fechas',
      tipo: 'fix',
      sprint: 2,
      etiquetas: ['fechas'],
      complejidad: 'simple',
      modeloSugerido: 'haiku',
      agenteRevisor: 'typescript-reviewer',
    },
    '2026-09-03'
  );
  assert.equal(task.id, 'TASK-005');
  assert.equal(task.estado, 'planificada');
  assert.equal(task.plan_aprobado, false);
  assert.equal(task.rama, 'fix/task-005-revisar-formato-de-fechas');
  assert.equal(task.creado, '2026-09-03');
  assert.equal(task.actualizado, '2026-09-03');
});

// --- integracion con disco (repo Git temporal, real desde TASK-012) -------

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

/**
 * Repo Git temporal con main+develop, en develop y con el workspace
 * limpio — el estado en el que runNewCommand espera encontrarse en uso
 * real (TASK-012: ensureBaseBranchReady exige exactamente esto para
 * feature/fix/release). Mismo patron que start.test.ts (TASK-009).
 */
async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-new-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);

    const tareasRoot = path.join(repoRoot, 'tareas');
    await fn(repoRoot, tareasRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

test('runNewCommand: crea tareas/00-planificadas/TASK-001/tarea.md desde cero', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const result = await runNewCommand(
      tareasRoot,
      ['--titulo', 'Primera tarea', '--tipo', 'feature'],
      '2026-09-03',
      { repoCwd: repoRoot }
    );
    assert.equal(result.id, 'TASK-001');
    assert.equal(result.baseBranchGuard.switched, false);
    const content = await readFile(result.filePath, 'utf8');
    assert.match(content, /id: TASK-001/);
    assert.match(content, /estado: planificada/);
  });
});

test('runNewCommand: IDs consecutivos sin colision al crear varias tareas seguidas (misma rama base: develop)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Desde TASK-030 (item C2) "new" comitea lo que escribe, asi que
    // tres llamadas seguidas funcionan SIN commit manual en medio.
    // Antes habia aqui un "git add -A && git commit" entre llamadas,
    // porque si no ensureBaseBranchReady rechazaba la segunda por
    // workspace sucio — sucio por culpa de la primera. Que ya no haga
    // falta es el item C2 funcionando; si alguien rompe el auto-commit,
    // este test se cae.
    const r1 = await runNewCommand(
      tareasRoot, ['--titulo', 'Uno', '--tipo', 'feature'], '2026-09-03', { repoCwd: repoRoot }
    );
    const r2 = await runNewCommand(
      tareasRoot, ['--titulo', 'Dos', '--tipo', 'fix'], '2026-09-03', { repoCwd: repoRoot }
    );
    // release tambien resuelve a develop (igual que feature/fix).
    const r3 = await runNewCommand(
      tareasRoot, ['--titulo', 'Tres', '--tipo', 'release'], '2026-09-03', { repoCwd: repoRoot }
    );
    assert.deepEqual([r1.id, r2.id, r3.id], ['TASK-001', 'TASK-002', 'TASK-003']);
    // Y el workspace queda limpio, no con tres tarea.md sueltos.
    assert.equal(
      spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim(),
      ''
    );
  });
});

test('runNewCommand: hallazgo real (no corregido, fuera de alcance de TASK-012) — un tipo hotfix cambia a "main", que puede no compartir el historial de tareas/ con develop y arriesga colisionar IDs', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const r1 = await runNewCommand(
      tareasRoot, ['--titulo', 'Uno', '--tipo', 'feature'], '2026-09-03', { repoCwd: repoRoot }
    );
    // Sin commit manual desde TASK-030: lo comitea "new" (item C2).
    assert.equal(r1.id, 'TASK-001');

    // Un hotfix resuelve la rama base a "main" (seccion 8.3). En este
    // repo de prueba (como en el propio TaskCode hasta que exista
    // "taskctl finish"/TASK-014, que hace el backmerge) "main" no
    // tiene la carpeta tareas/TASK-001 — solo existe en develop.
    // nextTaskId, al listar IDs contra un tareas/ vacio en main,
    // vuelve a calcular TASK-001 en vez de TASK-002: colision real de
    // IDs si esa tarea llegara a mergearse mas tarde tal cual. Es una
    // consecuencia real de seguir la seccion 8.3 al pie de la letra
    // (resuelve la base por tipo, no sincroniza tareas/ entre ramas) —
    // documentado aqui a proposito, no corregido: sincronizar
    // tareas/ entre main y develop es un problema mayor (necesitaria
    // el propio backmerge de TASK-014) y no es lo que pide el titulo
    // de TASK-012. Ver Resultado en tareas/*/TASK-012/tarea.md.
    const r2 = await runNewCommand(
      tareasRoot, ['--titulo', 'Hotfix urgente', '--tipo', 'hotfix'], '2026-09-03', { repoCwd: repoRoot }
    );
    assert.equal(r2.baseBranchGuard.baseBranch, 'main');
    assert.equal(r2.id, 'TASK-001');
  });
});

test('runNewCommand: sin --tipo no crea ningun fichero (ni siquiera intenta tocar Git)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runNewCommand(tareasRoot, ['--titulo', 'Sin tipo'], '2026-09-03', { repoCwd: repoRoot }),
      NewTaskArgError
    );
    const ids = await import('../../src/fs/task-store.js').then((m) =>
      m.listExistingTaskIds(tareasRoot)
    );
    assert.deepEqual(ids, []);
    // La rama activa no cambio: el error de parseo de argumentos pasa
    // ANTES de ensureBaseBranchReady, asi que ni siquiera se intento
    // resolver o cambiar de rama.
    const result = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(result.stdout.trim(), 'develop');
  });
});

// --- precondicion de rama base (seccion 8.3, TASK-012) ---------------------

test('runNewCommand: workspace sucio en develop aborta sin crear ningun fichero', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear', 'utf8');
    await assert.rejects(
      () => runNewCommand(
        tareasRoot, ['--titulo', 'Con workspace sucio', '--tipo', 'feature'], '2026-09-03',
        { repoCwd: repoRoot }
      ),
      BaseBranchGuardError
    );
    const ids = await import('../../src/fs/task-store.js').then((m) =>
      m.listExistingTaskIds(tareasRoot)
    );
    assert.deepEqual(ids, []);
  });
});

test('runNewCommand: en una rama de feature, limpia, cambia sola a develop antes de crear la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);
    const result = await runNewCommand(
      tareasRoot, ['--titulo', 'Se crea desde feature', '--tipo', 'fix'], '2026-09-03',
      { repoCwd: repoRoot }
    );
    assert.equal(result.baseBranchGuard.switched, true);
    assert.equal(result.baseBranchGuard.branchAntes, 'feature/otra-cosa');
    assert.equal(result.baseBranchGuard.baseBranch, 'develop');
    const branchNow = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branchNow.stdout.trim(), 'develop');
    const content = await readFile(result.filePath, 'utf8');
    assert.match(content, /id: TASK-001/);
  });
});

test('runNewCommand: tipo hotfix resuelve la rama base a "main" (o "master"), no "develop"', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    git(['checkout', '-q', 'main'], repoRoot);
    const result = await runNewCommand(
      tareasRoot, ['--titulo', 'Hotfix urgente', '--tipo', 'hotfix'], '2026-09-03',
      { repoCwd: repoRoot }
    );
    assert.equal(result.baseBranchGuard.switched, false);
    assert.equal(result.baseBranchGuard.baseBranch, 'main');
  });
});
