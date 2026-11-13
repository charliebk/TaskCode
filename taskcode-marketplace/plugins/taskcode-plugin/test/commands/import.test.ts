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

test('parseImportArgs: ruta obligatoria, defaults razonables, falla con flags invalidos y respeta los validos', () => {
  const a = parseImportArgs(['docs/sprint-1.md']);
  assert.equal(a.filePath, 'docs/sprint-1.md');
  assert.equal(a.tipo, 'feature');
  assert.equal(a.sprint, 0);
  assert.equal(a.complejidad, null, 'TASK-042: sin --complejidad decide la heuristica');

  // falla sin ruta
  assert.throws(() => parseImportArgs([]), ImportCommandError);
  assert.throws(() => parseImportArgs(['--tipo', 'fix']), ImportCommandError);

  // falla con --tipo/--complejidad/--sprint invalidos
  assert.throws(() => parseImportArgs(['f.md', '--tipo', 'chore']), ImportCommandError);
  assert.throws(() => parseImportArgs(['f.md', '--complejidad', 'imposible']), ImportCommandError);
  assert.throws(() => parseImportArgs(['f.md', '--sprint', 'dos']), ImportCommandError);

  // --tipo/--sprint/--complejidad validos se respetan
  const v = parseImportArgs(['f.md', '--tipo', 'fix', '--sprint', '2', '--complejidad', 'alta']);
  assert.equal(v.tipo, 'fix');
  assert.equal(v.sprint, 2);
  assert.equal(v.complejidad, 'alta');
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


test('runImportCommand: escenario de contenido sobre un mismo repo (5 tareas con IDs consecutivos, entrada malformada, idempotencia, duplicados, titulos sin ASCII, flags propagados, Objetivo, ">" invalido, imports concurrentes)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // 5 tareas bien formadas producen 5 tarea.md validos con IDs consecutivos
    const md5 = await writeFixture(CINCO_TAREAS);

    const result = await runImportCommand(tareasRoot, [md5], '2026-09-03', { repoCwd: repoRoot });

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

    // Una entrada malformada no impide que las demas se creen, y se reporta con el motivo exacto
    const mdMal = await writeFixture(
      '### Tarea valida uno\n- criterio uno\n\n### Tarea sin criterios\n\n### Tarea valida dos\n- criterio dos\n'
    );
    const rMal = await runImportCommand(tareasRoot, [mdMal], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(rMal.creadas.length, 2);
    assert.deepEqual(
      rMal.creadas.map((c) => c.titulo),
      ['Tarea valida uno', 'Tarea valida dos']
    );
    assert.equal(rMal.errores.length, 1);
    assert.match(rMal.errores[0]!.motivo, /ningun criterio de aceptacion/);
    assert.equal(rMal.errores[0]!.tituloRaw, 'Tarea sin criterios');

    // Idempotente por titulo normalizado: reimportar el mismo fichero no duplica
    const idsAntes = (await listExistingTaskIds(tareasRoot)).length;
    const mdIdem = await writeFixture('### Anadir validacion\n- criterio unico\n');
    const r1 = await runImportCommand(tareasRoot, [mdIdem], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(r1.creadas.length, 1);
    // Sin commit manual en medio desde TASK-030 (item C2): lo comitea
    // el propio import. Era la razon original del item — la trampa de
    // "import no se puede ejecutar dos veces seguidas" de HALLAZGOS.md.
    const r2 = await runImportCommand(tareasRoot, [mdIdem], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(r2.creadas.length, 0);
    assert.equal(r2.omitidas.length, 1);
    assert.equal(r2.omitidas[0]!.titulo, 'Anadir validacion');
    assert.match(r2.omitidas[0]!.motivo, /ya existe una tarea/);
    assert.equal((await listExistingTaskIds(tareasRoot)).length, idsAntes + 1);

    // Dos entradas con el mismo titulo normalizado dentro del MISMO fichero: solo la primera se crea
    const mdDup = await writeFixture(
      '### Anadir validacion de espesor\n- criterio a\n\n### Anadir Validacion De Espesor\n- criterio b\n'
    );
    const rDup = await runImportCommand(tareasRoot, [mdDup], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(rDup.creadas.length, 1);
    assert.equal(rDup.omitidas.length, 1);

    // Dos titulos sin ASCII alfanumerico (colisionaban antes en el fallback "tarea") ahora se crean AMBOS
    const mdJa = await writeFixture('### 日本語のタスク一番\n- criterio japones\n\n### !!!???\n- criterio simbolos totalmente distintos\n');
    const rJa = await runImportCommand(tareasRoot, [mdJa], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(rJa.creadas.length, 2, `deberian crearse las 2: ${JSON.stringify(rJa)}`);
    assert.equal(rJa.omitidas.length, 0);

    // --tipo/--sprint/--complejidad se propagan a las tareas creadas
    const mdFlags = await writeFixture('### Tarea con flags\n- criterio\n');
    const rFlags = await runImportCommand(
      tareasRoot,
      [mdFlags, '--tipo', 'fix', '--sprint', '3', '--complejidad', 'alta'],
      '2026-09-03',
      { repoCwd: repoRoot }
    );
    const contentFlags = await readFile(rFlags.creadas[0]!.filePath, 'utf8');
    assert.match(contentFlags, /tipo: fix/);
    assert.match(contentFlags, /sprint: 3/);
    assert.match(contentFlags, /complejidad: alta/);

    // El Objetivo de la entrada se escribe en el tarea.md; sin Objetivo queda vacio como siempre
    const mdObj = await writeFixture(
      '### Con objetivo\n> Linea uno\n> linea dos\n>\n> Otro parrafo\n- criterio a\n\n### Sin objetivo\n- criterio b\n'
    );
    const rObj = await runImportCommand(tareasRoot, [mdObj], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(rObj.creadas.length, 2);
    const con = await readFile(rObj.creadas[0]!.filePath, 'utf8');
    assert.match(
      con.replace(/\r\n/g, '\n'),
      /## Objetivo\n\nLinea uno\nlinea dos\n\nOtro parrafo\n\n## Criterios de aceptacion\n- \[ \] criterio a\n/
    );
    const sin = await readFile(rObj.creadas[1]!.filePath, 'utf8');
    assert.match(sin.replace(/\r\n/g, '\n'), /## Objetivo\n\n\n## Criterios de aceptacion\n- \[ \] criterio b\n/);

    // Un ">" tras un criterio invalida la entrada y no crea nada
    const mdMala = await writeFixture('### Mala\n> objetivo\n- criterio a\n> suelta\n');
    const rMala = await runImportCommand(tareasRoot, [mdMala], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(rMala.creadas.length, 0);
    assert.equal(rMala.errores.length, 1);

    // Dos imports concurrentes sobre el mismo repo no pierden ninguna entrada ni lanzan sin capturar (hallazgo IMPORTANTE de revision por pares)
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

test('runImportCommand: guardas de rama y workspace (sucio aborta, fichero inexistente no toca Git ni cambia de rama, feature limpia cambia a develop, hotfix resuelve a main)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Workspace sucio aborta sin crear ningun fichero (seccion 8.3, igual que "new")
    const mdSucio = await writeFixture('### Tarea sucia\n- criterio\n');
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear', 'utf8');
    await assert.rejects(
      () => runImportCommand(tareasRoot, [mdSucio], '2026-09-03', { repoCwd: repoRoot }),
      BaseBranchGuardError
    );
    assert.deepEqual(await listExistingTaskIds(tareasRoot), []);
    await rm(path.join(repoRoot, 'sucio.txt'), { force: true });

    // Fichero inexistente falla con ImportCommandError, sin tocar Git ni tareas/
    await assert.rejects(
      () =>
        runImportCommand(tareasRoot, [path.join(repoRoot, 'no-existe.md')], '2026-09-03', {
          repoCwd: repoRoot,
        }),
      ImportCommandError
    );
    assert.deepEqual(await listExistingTaskIds(tareasRoot), []);

    // Fichero inexistente NO cambia de rama (hallazgo IMPORTANTE de revision por pares)
    git(['checkout', '-q', '-b', 'feature/algo-existente'], repoRoot);
    await assert.rejects(
      () =>
        runImportCommand(tareasRoot, [path.join(repoRoot, 'no-existe.md')], '2026-09-03', {
          repoCwd: repoRoot,
        }),
      ImportCommandError
    );
    const branchSigue = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branchSigue.stdout.trim(), 'feature/algo-existente');

    // En una rama de feature, limpia, cambia sola a develop antes de importar
    const md = await writeFixture('### Tarea\n- criterio\n');
    const result = await runImportCommand(tareasRoot, [md], '2026-09-03', { repoCwd: repoRoot });
    assert.equal(result.baseBranchGuard.switched, true);
    assert.equal(result.baseBranchGuard.baseBranch, 'develop');
    assert.equal(result.creadas.length, 1);

    const branchNow = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branchNow.stdout.trim(), 'develop');

    // --tipo hotfix resuelve la rama base a "main"
    git(['checkout', '-q', 'main'], repoRoot);
    const mdHot = await writeFixture('### Tarea urgente\n- criterio\n');
    const rHot = await runImportCommand(tareasRoot, [mdHot, '--tipo', 'hotfix'], '2026-09-03', {
      repoCwd: repoRoot,
    });
    assert.equal(rHot.baseBranchGuard.baseBranch, 'main');
    assert.equal(rHot.creadas[0]!.id, 'TASK-001');
  });
});

// --- hallazgos de revision por pares (TASK-004), corregidos ------------

test('normalizedTitleKey: titulos normales usan el slug tal cual y dos titulos MUY distintos que caen en el fallback de slugify ya NO colisionan (hallazgo CRITICO de revision por pares)', () => {
  assert.equal(normalizedTitleKey('Anadir validacion'), 'anadir-validacion');
  assert.equal(normalizedTitleKey('Añadir Validación'), 'anadir-validacion');

  const a = normalizedTitleKey('日本語のタスク一番');
  const b = normalizedTitleKey('!!!???');
  assert.notEqual(a, b);
});

test('runImportCommand: una tarea EXISTENTE con tarea.md corrupto, o con un valor invalido (TaskValidationError), se reporta como advertencia y no bloquea el import de tareas nuevas y no relacionadas (hallazgo IMPORTANTE de revision por pares)', async () => {
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

    // Una tarea EXISTENTE con frontmatter sintacticamente valido pero con un valor invalido
    // (TaskValidationError) tambien se reporta como advertencia, no como excepcion sin capturar.
    // Sintacticamente valido como frontmatter (tiene ":"), pero "chore"
    // no es un TaskType valido: dispara TaskValidationError, no
    // FrontmatterParseError. Se reemplaza la corrupcion anterior sobre la misma tarea.
    await writeFile(filePath, original.replace('tipo: feature', 'tipo: chore'), 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'TASK-001 (tipo invalido a proposito para el test)'], repoRoot);

    const md2 = await writeFixture('### Otra tarea nueva\n- criterio\n');
    const result2 = await runImportCommand(tareasRoot, [md2], '2026-09-03', { repoCwd: repoRoot });

    assert.equal(result2.creadas.length, 1);
    assert.equal(result2.advertencias.length, 1);
    assert.match(result2.advertencias[0]!, /TASK-001/);
  });
});
