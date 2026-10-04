/**
 * Flujo E, modo automatico (TASK-059): ciclo completo sin preguntas, guardas
 * que siguen preguntando (informe fuera de commit propio, tope de rondas,
 * hotfix) y guardas del CLI que abortan tambien en automatico. Repos Git
 * temporales reales y el CLI real por spawn; los fixtures hacen de agentes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { leerTransiciones } from '../../src/core/transiciones.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
const ID = 'TASK-001';
const CONFIG_AUTO = 'modo_flujo: automatico\n';

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

function cliOk(cwd: string, args: string[]) {
  const r = cli(cwd, args);
  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
  return r;
}

function siguiente(cwd: string, id = ID): Record<string, unknown> {
  return JSON.parse(cliOk(cwd, ['siguiente', id, '--json']).stdout) as Record<string, unknown>;
}

function resumen(s: Record<string, unknown>): [unknown, unknown] {
  return [s.fase, s.accion];
}

async function withRepo(
  config: string,
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-auto-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
    await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot, path.join(repoRoot, 'tareas'));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/** `taskctl new` por CLI; devuelve el ID creado (TASK-001 en un repo vacio). */
function nueva(repoRoot: string, tipo: string, titulo: string): void {
  cliOk(repoRoot, [
    'new',
    '--titulo', titulo,
    '--tipo', tipo,
    '--complejidad', 'simple',
    '--objetivo', 'Probar el modo automatico.',
    '--criterio', 'La tarea queda en 04-terminadas',
  ]);
  // `new` deja la tarea en el working tree; el flujo la commitea antes de seguir.
  if (git(['status', '--porcelain'], repoRoot).trim() !== '') commitAll(repoRoot, `docs: ${titulo}`);
}

/** plan por CLI y plan-final.md redactado y commiteado. */
async function planificar(repoRoot: string, tareasRoot: string, id = ID): Promise<void> {
  cliOk(repoRoot, ['plan', id]);
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
    '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
    'utf8'
  );
  commitAll(repoRoot, `docs(${id}): plan final`);
}

async function codigo(repoRoot: string, contenido: string, mensaje: string): Promise<void> {
  await writeFile(path.join(repoRoot, 'app.txt'), contenido, 'utf8');
  commitAll(repoRoot, mensaje);
}

function dirRevision(tareasRoot: string, id = ID): string {
  return path.join(tareasRoot, '03-en-revision', id, 'revision');
}

/** Tarea feature de TASK-001 planificada, aprobada, empezada y con un commit de codigo. */
async function hastaCodigo(repoRoot: string, tareasRoot: string, tipo = 'feature'): Promise<void> {
  nueva(repoRoot, tipo, 'Flujo automatico');
  await planificar(repoRoot, tareasRoot);
  cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
  cliOk(repoRoot, ['start', ID]);
  await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
}

/** Sustituye la linea de veredicto del informe 1 sin commitear (a mano, como un agente). */
async function escribirVeredicto(informe: string, valor: string): Promise<void> {
  const texto = await readFile(informe, 'utf8');
  const nuevo = texto.replace(/^- Veredicto:.*$/m, `- Veredicto: ${valor}`);
  assert.notEqual(nuevo, texto, 'el informe debe tener la linea de veredicto');
  await writeFile(informe, nuevo, 'utf8');
}

test('ciclo feature completo en automatico: tras plan nunca se pregunta y cada transicion va en su commit', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Ciclo completo');
    const vistos: Array<Record<string, unknown>> = [];
    const ver = (): Record<string, unknown> => {
      const s = siguiente(repoRoot);
      vistos.push(s);
      return s;
    };

    let s = ver();
    assert.deepEqual([s.fase, s.modo, s.accion], ['plan', 'automatico', 'continuar']);
    await planificar(repoRoot, tareasRoot);

    s = ver();
    assert.deepEqual([s.estado, s.fase, s.accion], ['en-diseno', 'approve', 'continuar']);
    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);

    s = ver();
    assert.deepEqual(resumen(s), ['start', 'continuar']);
    cliOk(repoRoot, ['start', ID]);
    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);

    s = ver();
    assert.deepEqual([s.estado, ...resumen(s)], ['en-curso', 'review', 'continuar']);
    cliOk(repoRoot, ['review', ID]);

    s = ver();
    assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'veredicto', 'continuar']);
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);

    s = ver();
    assert.deepEqual([s.estado, ...resumen(s)], ['en-revision', 'finish', 'continuar']);
    cliOk(repoRoot, ['finish', ID]);

    s = ver();
    assert.deepEqual([s.estado, ...resumen(s)], ['terminada', 'terminada', 'detener']);
    assert.ok(
      vistos.every((v) => v.accion !== 'preguntar'),
      `ningun siguiente debia preguntar: ${JSON.stringify(vistos.map(resumen))}`
    );

    const t = await readTareaFile(tareasRoot, ID);
    assert.ok(t);
    assert.equal(t.task.estado, 'terminada');
    assert.ok(
      git(['ls-files', path.join(tareasRoot, '04-terminadas', ID, 'tarea.md')], repoRoot).trim().length > 0,
      'la tarea esta en 04-terminadas'
    );
    const rows = leerTransiciones(t.body);
    assert.deepEqual(
      rows.map((r) => r.fase),
      ['plan', 'approve', 'start', 'review', 'finish']
    );
    assert.ok(rows.every((r) => r.modo === 'automatico'));
    const approve = rows.find((r) => r.fase === 'approve');
    assert.equal(approve?.decidido_por, 'automatico');

    // Un commit distinto por transicion: ninguna fila entra en el mismo commit que otra.
    const shas = new Set<string>();
    for (const r of rows) {
      const encontrados = git(
        ['log', '--all', '--format=%H', '-S', `| ${r.fase} | automatico | ${r.decidido_por} |`],
        repoRoot
      )
        .split('\n')
        .filter(Boolean);
      assert.ok(encontrados.length >= 1, `ningun commit anade la fila ${r.fase}`);
      shas.add(encontrados[encontrados.length - 1] as string);
    }
    assert.equal(shas.size, rows.length, 'cada transicion en un commit distinto');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('informe aprobado fuera de commit propio: finish pregunta (mezclado, con codigo posterior y sin commitear)', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    const informe = path.join(dirRevision(tareasRoot), 'informe-revision-1.md');
    assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar']);

    // (c) aprobado en disco, sin commitear.
    await escribirVeredicto(informe, 'aprobada');
    let s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
    assert.equal(s.comando, `taskctl finish ${ID}`);

    // (a) informe aprobado en el MISMO commit que un cambio de codigo.
    await writeFile(path.join(repoRoot, 'app.txt'), 'mezclado\n', 'utf8');
    commitAll(repoRoot, `feat(${ID}): codigo con veredicto dentro`);
    s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['finish', 'preguntar']);

    // Contraprueba: el informe re-commiteado SOLO (con un cambio inocuo en el
    // informe) y posterior al codigo vuelve a ser seguro.
    await writeFile(informe, (await readFile(informe, 'utf8')) + '\nsin hallazgos\n', 'utf8');
    commitAll(repoRoot, `chore(${ID}): informe solo`);
    s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['finish', 'continuar']);

    // Con el informe ya bien commiteado, una edicion sin commitear vuelve a
    // preguntar: lo que se lee del disco no esta en ningun commit. Aqui la unica
    // que lo detecta es la comprobacion del workspace (el ultimo commit del
    // informe es correcto).
    const commiteado = await readFile(informe, 'utf8');
    await writeFile(informe, commiteado + '\nnota sin commitear\n', 'utf8');
    s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
    await writeFile(informe, commiteado, 'utf8');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');

    // (b) informe en commit propio pero con un commit de codigo POSTERIOR.
    await codigo(repoRoot, 'despues del informe\n', `feat(${ID}): codigo tras el informe`);
    s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
  });
});

test('informe aprobado con taskctl veredicto y codigo posterior: finish pregunta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'continuar']);
    await codigo(repoRoot, 'colado despues\n', `feat(${ID}): codigo tras el veredicto`);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['finish', 'preguntar']);
  });
});

test('tope de rondas: las rondas 1 y 2 con cambios siguen solas, la 3 pregunta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    for (const ronda of [1, 2, 3]) {
      cliOk(repoRoot, ['review', ID]);
      assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar'], `ronda ${String(ronda)} sin veredicto`);
      cliOk(repoRoot, ['veredicto', ID, 'cambios-solicitados']);
      const s = siguiente(repoRoot);
      assert.equal(s.estado, 'en-revision');
      assert.equal(s.fase, 'review');
      assert.equal(s.accion, ronda < 3 ? 'continuar' : 'preguntar', `ronda ${String(ronda)}`);
      if (ronda < 3) await codigo(repoRoot, `correccion ${String(ronda)}\n`, `fix(${ID}): correccion ${String(ronda)}`);
    }
  });
});

test('hotfix en automatico con revision aprobada en commit propio: finish pregunta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot, 'hotfix');
    assert.match(git(['branch', '--show-current'], repoRoot).trim(), /^hotfix\//);
    cliOk(repoRoot, ['review', ID]);
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);
    const s = siguiente(repoRoot);
    assert.equal(s.modo, 'automatico');
    assert.deepEqual(resumen(s), ['finish', 'preguntar']);
    assert.equal(s.comando, `taskctl finish ${ID}`);
  });
});

test('guarda WIP: con otra tarea en curso, start aborta tambien en automatico', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Primera');
    nueva(repoRoot, 'feature', 'Segunda');
    await planificar(repoRoot, tareasRoot, 'TASK-001');
    await planificar(repoRoot, tareasRoot, 'TASK-002');
    cliOk(repoRoot, ['approve', 'TASK-001', '--decidido-por', 'automatico']);
    cliOk(repoRoot, ['approve', 'TASK-002', '--decidido-por', 'automatico']);
    assert.deepEqual(resumen(siguiente(repoRoot, 'TASK-002')), ['start', 'continuar']);
    cliOk(repoRoot, ['start', 'TASK-001']);
    await codigo(repoRoot, 'trabajo 1\n', 'feat(TASK-001): trabajo');

    git(['checkout', '-q', 'develop'], repoRoot);
    const r = cli(repoRoot, ['start', 'TASK-002']);
    assert.notEqual(r.status, 0, `start debia abortar: ${r.stdout}`);
    assert.match(r.stderr, /TASK-001|WIP|limite/i);
    const t = await readTareaFile(tareasRoot, 'TASK-002');
    assert.equal(t?.task.estado, 'en-diseno', 'TASK-002 no se movio');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('finish con el informe sin veredicto (PENDIENTE) aborta aunque siguiente diga veredicto/continuar', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await hastaCodigo(repoRoot, tareasRoot);
    cliOk(repoRoot, ['review', ID]);
    assert.deepEqual(resumen(siguiente(repoRoot)), ['veredicto', 'continuar']);
    const r = cli(repoRoot, ['finish', ID]);
    assert.notEqual(r.status, 0);
    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.estado, 'en-revision');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test('revision_codex: true sin segunda opinion: siguiente da codex-review y finish aborta', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Con codex');
    // revision_codex se declara en el frontmatter de la tarea antes de planificar.
    const tareaMd = path.join(tareasRoot, '00-planificadas', ID, 'tarea.md');
    const texto = await readFile(tareaMd, 'utf8');
    assert.match(texto, /^revision_codex:\s*false/m);
    await writeFile(tareaMd, texto.replace(/^revision_codex:\s*false/m, 'revision_codex: true'), 'utf8');
    commitAll(repoRoot, `docs(${ID}): revision_codex`);
    await planificar(repoRoot, tareasRoot);
    cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    cliOk(repoRoot, ['start', ID]);
    await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
    cliOk(repoRoot, ['review', ID]);
    cliOk(repoRoot, ['veredicto', ID, 'aprobada']);

    const s = siguiente(repoRoot);
    assert.equal(s.fase, 'codex-review');
    assert.equal(s.comando, `taskctl codex-review ${ID}`);
    const r = cli(repoRoot, ['finish', ID]);
    assert.notEqual(r.status, 0, `finish debia abortar: ${r.stdout}`);
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-revision');
  });
});

test('approve --decidido-por automatico en una tarea planificada en manual aborta', async () => {
  await withRepo('modo_flujo: manual\n', async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Planificada en manual');
    await planificar(repoRoot, tareasRoot);
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), CONFIG_AUTO, 'utf8');
    commitAll(repoRoot, 'chore: config pasa a automatico');

    // La tarea congelo manual en plan: manda su modo, no el config.
    const s = siguiente(repoRoot);
    assert.equal(s.modo, 'manual');
    assert.equal(s.accion, 'detener');

    const r = cli(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    assert.notEqual(r.status, 0, `approve debia abortar: ${r.stdout}`);
    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.plan_aprobado, false);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});
