import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseImportArgs, runImportCommand, normalizedTitleKey, ImportCommandError } from '../../src/commands/import.js';
import { writeTareaFile } from '../../src/fs/task-store.js';
import { buildNewTask, DEFAULT_BODY } from '../../src/commands/new.js';
import { BaseBranchGuardError } from '../../src/fs/git.js';
import { listExistingTaskIds } from '../../src/fs/task-store.js';

test('parseImportArgs: ruta obligatoria, defaults razonables', () => {
  const a = parseImportArgs(['docs/sprint-1.md']);
  assert.equal(a.filePath, 'docs/sprint-1.md');
  assert.equal(a.tipo, 'feature');
  assert.equal(a.sprint, 0);
  assert.equal(a.complejidad, null, 'TASK-042: sin --complejidad decide la heuristica');
});

test('parseImportArgs: falla sin ruta', () => {
  assert.throws(() => parseImportArgs([]), ImportCommandError);
  assert.throws(() => parseImportArgs(['--tipo', 'fix']), ImportCommandError);
});

test('parseImportArgs: falla con --tipo/--complejidad/--sprint invalidos', () => {
  assert.throws(() => parseImportArgs(['f.md', '--tipo', 'chore']), ImportCommandError);
  assert.throws(() => parseImportArgs(['f.md', '--complejidad', 'imposible']), ImportCommandError);
  assert.throws(() => parseImportArgs(['f.md', '--sprint', 'dos']), ImportCommandError);
});

test('parseImportArgs: --tipo/--sprint/--complejidad validos se respetan', () => {
  const a = parseImportArgs(['f.md', '--tipo', 'fix', '--sprint', '2', '--complejidad', 'alta']);
  assert.equal(a.tipo, 'fix');
  assert.equal(a.sprint, 2);
  assert.equal(a.complejidad, 'alta');
});

// --- integracion con disco (repo Git temporal real) -------------------

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

/** Mismo patron que test/commands/new.test.ts: repo con main+develop, en develop, limpio. */
async function withTempRepo(
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-import-'));
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

let fixtureCounter = 0;

/**
 * Escribe un fichero Markdown de prueba FUERA del repo temporal: si
 * viviera dentro de repoRoot quedaria como fichero sin commitear y la
 * precondicion de workspace limpio (seccion 8.3) abortaria antes
 * siquiera de que runImportCommand llegue a leerlo — igual que le
 * pasaria a una persona real important desde fuera del repo.
 */
async function writeFixture(content: string): Promise<string> {
  fixtureCounter += 1;
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-import-fixture-'));
  const filePath = path.join(dir, `import-${fixtureCounter}.md`);
  await writeFile(filePath, content, 'utf8');
  return filePath;
}

const CINCO_TAREAS = [1, 2, 3, 4, 5]
  .map((n) => `### Tarea numero ${n}\n- criterio ${n}.a\n- criterio ${n}.b\n`)
  .join('\n');

test('runImportCommand: 5 tareas bien formadas producen 5 tarea.md validos con IDs consecutivos', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const md = await writeFixture(CINCO_TAREAS);

    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });

    assert.equal(result.creadas.length, 5);
    assert.equal(result.omitidas.length, 0);
    assert.equal(result.errores.length, 0);
    assert.deepEqual(
      result.creadas.map((c) => c.id),
      ['TASK-001', 'TASK-002', 'TASK-003', 'TASK-004', 'TASK-005']
    );

    const ids = await listExistingTaskIds(tareasRoot);
    assert.equal(ids.length, 5);

    const content = await readFile(result.creadas[0]!.filePath, 'utf8');
    assert.match(content, /titulo: "Tarea numero 1"/);
    assert.match(content, /- \[ \] criterio 1\.a/);
    assert.match(content, /- \[ \] criterio 1\.b/);
    assert.match(content, /estado: planificada/);
    assert.match(content, /tipo: feature/);
  });
});

test('runImportCommand: una entrada malformada no impide que las demas se creen, y se reporta con el motivo exacto', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const md = await writeFixture(
      '### Tarea valida uno\n- criterio uno\n\n### Tarea sin criterios\n\n### Tarea valida dos\n- criterio dos\n'
    );

    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });

    assert.equal(result.creadas.length, 2);
    assert.deepEqual(
      result.creadas.map((c) => c.titulo),
      ['Tarea valida uno', 'Tarea valida dos']
    );
    assert.equal(result.errores.length, 1);
    assert.match(result.errores[0]!.motivo, /ningun criterio de aceptacion/);
    assert.equal(result.errores[0]!.tituloRaw, 'Tarea sin criterios');
  });
});

test('runImportCommand: idempotente por titulo normalizado — reimportar el mismo fichero no duplica', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const md = await writeFixture('### Anadir validacion\n- criterio unico\n');

    const r1 = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(r1.creadas.length, 1);
    // Sin commit manual en medio desde TASK-030 (item C2): lo comitea
    // el propio import. Era la razon original del item — la trampa de
    // "import no se puede ejecutar dos veces seguidas" de HALLAZGOS.md.
    const r2 = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(r2.creadas.length, 0);
    assert.equal(r2.omitidas.length, 1);
    assert.equal(r2.omitidas[0]!.titulo, 'Anadir validacion');
    assert.match(r2.omitidas[0]!.motivo, /ya existe una tarea/);

    const ids = await listExistingTaskIds(tareasRoot);
    assert.equal(ids.length, 1);
  });
});

test('runImportCommand: dos entradas con el mismo titulo normalizado dentro del MISMO fichero — solo la primera se crea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const md = await writeFixture(
      '### Anadir validacion de espesor\n- criterio a\n\n### Anadir Validacion De Espesor\n- criterio b\n'
    );

    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(result.creadas.length, 1);
    assert.equal(result.omitidas.length, 1);
  });
});

test('runImportCommand: fichero inexistente falla con ImportCommandError, sin tocar Git ni tareas/', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () =>
        runImportCommand(tareasRoot, [path.join(repoRoot, 'no-existe.md')], '2026-09-03', {
          repoCwd: repoRoot,
        }),
      ImportCommandError
    );
    const ids = await listExistingTaskIds(tareasRoot);
    assert.deepEqual(ids, []);
  });
});

test('runImportCommand: workspace sucio aborta sin crear ningun fichero (seccion 8.3, igual que "new")', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const md = await writeFixture('### Tarea\n- criterio\n');
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear', 'utf8');

    await assert.rejects(
      () => runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot }),
      BaseBranchGuardError
    );
    const ids = await listExistingTaskIds(tareasRoot);
    assert.deepEqual(ids, []);
  });
});

test('runImportCommand: en una rama de feature, limpia, cambia sola a develop antes de importar', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);
    const md = await writeFixture('### Tarea\n- criterio\n');

    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(result.baseBranchGuard.switched, true);
    assert.equal(result.baseBranchGuard.baseBranch, 'develop');
    assert.equal(result.creadas.length, 1);

    const branchNow = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branchNow.stdout.trim(), 'develop');
  });
});

test('runImportCommand: --tipo hotfix resuelve la rama base a "main"', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    git(['checkout', '-q', 'main'], repoRoot);
    const md = await writeFixture('### Tarea urgente\n- criterio\n');

    const result = await runImportCommand(tareasRoot, [md, '--tipo', 'hotfix'], '2026-09-03', {
      repoCwd: repoRoot,
    });
    assert.equal(result.baseBranchGuard.baseBranch, 'main');
    assert.equal(result.creadas[0]!.id, 'TASK-001');
  });
});

test('runImportCommand: --tipo/--sprint/--complejidad se propagan a las tareas creadas', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const md = await writeFixture('### Tarea\n- criterio\n');

    const result = await runImportCommand(
      tareasRoot,
      [md, '--tipo', 'fix', '--sprint', '3', '--complejidad', 'alta'],
      '2026-09-03',
      { repoCwd: repoRoot }
    );
    const content = await readFile(result.creadas[0]!.filePath, 'utf8');
    assert.match(content, /tipo: fix/);
    assert.match(content, /sprint: 3/);
    assert.match(content, /complejidad: alta/);
  });
});


// --- hallazgos de revision por pares (TASK-004), corregidos ------------

test('normalizedTitleKey: titulos normales usan el slug tal cual (sin cambio de comportamiento)', () => {
  assert.equal(normalizedTitleKey('Anadir validacion'), 'anadir-validacion');
  assert.equal(normalizedTitleKey('Añadir Validación'), 'anadir-validacion');
});

test('normalizedTitleKey: dos titulos MUY distintos que caen en el fallback de slugify ya NO colisionan (hallazgo CRITICO de revision por pares)', () => {
  const a = normalizedTitleKey('日本語のタスク一番');
  const b = normalizedTitleKey('!!!???');
  assert.notEqual(a, b);
});

test('runImportCommand: dos titulos sin ASCII alfanumerico (colisionaban antes en el fallback "tarea") ahora se crean AMBOS', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const md = await writeFixture('### 日本語のタスク一番\n- criterio japones\n\n### !!!???\n- criterio simbolos totalmente distintos\n');
    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(result.creadas.length, 2, `deberian crearse las 2: ${JSON.stringify(result)}`);
    assert.equal(result.omitidas.length, 0);
  });
});

test('runImportCommand: fichero inexistente NO cambia de rama (hallazgo IMPORTANTE de revision por pares)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    git(['checkout', '-q', '-b', 'feature/algo-existente'], repoRoot);
    await assert.rejects(
      () =>
        runImportCommand(tareasRoot, [path.join(repoRoot, 'no-existe.md')], '2026-09-03', {
          repoCwd: repoRoot,
        }),
      ImportCommandError
    );
    const branchNow = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branchNow.stdout.trim(), 'feature/algo-existente');
  });
});

test('runImportCommand: una tarea EXISTENTE con tarea.md corrupto se reporta como advertencia y no bloquea el import de tareas nuevas y no relacionadas (hallazgo IMPORTANTE de revision por pares)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Tarea existente valida, comiteada, y luego corrompida a mano
    // (typo humano: falta ":" en una linea de frontmatter) para
    // simular un tarea.md invalido ya presente en el repo, sin
    // relacion alguna con lo que se va a importar.
    const previa = buildNewTask('TASK-001', {
      titulo: 'Tarea previa intacta', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const filePath = await writeTareaFile(tareasRoot, previa, DEFAULT_BODY);
    const original = await readFile(filePath, 'utf8');
    await writeFile(filePath, original.replace('complejidad: media', 'complejidad media'), 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'TASK-001 (corrupta a proposito para el test)'], repoRoot);

    const md = await writeFixture('### Tarea nueva sin relacion\n- criterio nuevo\n');
    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });

    assert.equal(result.creadas.length, 1, `la tarea nueva deberia crearse igualmente: ${JSON.stringify(result)}`);
    assert.equal(result.creadas[0]!.titulo, 'Tarea nueva sin relacion');
    assert.equal(result.advertencias.length, 1);
    assert.match(result.advertencias[0]!, /TASK-001/);
  });
});

test('runImportCommand: una tarea EXISTENTE con frontmatter sintacticamente valido pero con un valor invalido (TaskValidationError) tambien se reporta como advertencia, no como excepcion sin capturar', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const previa = buildNewTask('TASK-001', {
      titulo: 'Tarea previa con tipo invalido', tipo: 'feature', sprint: 0, etiquetas: [],
      complejidad: 'media', modeloSugerido: 'sonnet', agenteRevisor: 'general-purpose',
    }, '2026-09-01');
    const filePath = await writeTareaFile(tareasRoot, previa, DEFAULT_BODY);
    const original = await readFile(filePath, 'utf8');
    // Sintacticamente valido como frontmatter (tiene ":"), pero "chore"
    // no es un TaskType valido: dispara TaskValidationError, no
    // FrontmatterParseError.
    await writeFile(filePath, original.replace('tipo: feature', 'tipo: chore'), 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'TASK-001 (tipo invalido a proposito para el test)'], repoRoot);

    const md = await writeFixture('### Otra tarea nueva\n- criterio\n');
    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });

    assert.equal(result.creadas.length, 1);
    assert.equal(result.advertencias.length, 1);
    assert.match(result.advertencias[0]!, /TASK-001/);
  });
});

test('runImportCommand: dos imports concurrentes sobre el mismo repo no pierden ninguna entrada ni lanzan sin capturar (hallazgo IMPORTANTE de revision por pares)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const mdA = await writeFixture('### Tarea concurrente A\n- criterio a\n');
    const mdB = await writeFixture('### Tarea concurrente B\n- criterio b\n');

    const [ra, rb] = await Promise.all([
      runImportCommand(tareasRoot, [mdA], '2026-09-03', { repoCwd: repoRoot }),
      runImportCommand(tareasRoot, [mdB], '2026-09-03', { repoCwd: repoRoot }),
    ]);

    // Ninguna de las dos llamadas debe rechazar la promesa (antes del
    // fix, TaskAlreadyExistsError escapaba sin capturar). Cada entrada
    // debe quedar contabilizada en exactamente un sitio: creada, o con
    // un error que documenta la colision.
    assert.equal(ra.creadas.length + ra.errores.length, 1);
    assert.equal(rb.creadas.length + rb.errores.length, 1);
    if (ra.errores.length > 0) assert.match(ra.errores[0]!.motivo, /concurrente/);
    if (rb.errores.length > 0) assert.match(rb.errores[0]!.motivo, /concurrente/);
  });
});
