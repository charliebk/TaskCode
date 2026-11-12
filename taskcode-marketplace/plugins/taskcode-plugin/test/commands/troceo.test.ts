/**
 * TASK-121: troceo de una tarea de mas de una hora en TASK-NNNa, b, c... en la
 * misma rama. Repos Git temporales reales y el CLI real por spawn.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
import { runTrocearCommand } from '../../src/commands/trocear.js';
import {
  ID,
  CONFIG_AUTO,
  commitAll,
  cli,
  cliOk,
  git,
  siguiente,
  resumen,
  withRepo,
  nueva,
  codigo,
  dirRevision,
  rellenarInforme,
} from '../helpers/automatico-fixtures.js';

const TROCEO = [
  '## Troceo',
  '',
  '### Parte a: IDs con letra',
  'Que el CLI acepte TASK-001a.',
  'Duracion estimada: 40 min',
  '- [ ] new, board y roadmap aceptan el ID',
  '',
  '### Parte b: Comando trocear',
  'El comando que parte la tarea.',
  'Duracion estimada: 50 min',
  '- [ ] trocear crea las partes',
  '- [ ] el ROADMAP se regenera',
  '',
  '### Parte c: Skills',
  'Las skills explican las dos salidas.',
  'Duracion estimada: 20 min',
  '- [ ] la skill de approve nombra trocear',
  '',
].join('\n');

/** TASK-001 en diseno con un plan de 150 min y, si se pide, su seccion de troceo. */
async function planGrande(repoRoot: string, tareasRoot: string, conTroceo: boolean): Promise<void> {
  nueva(repoRoot, 'feature', 'Tarea grande');
  cliOk(repoRoot, ['plan', ID]);
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
    `# Plan\n\n## Enfoque propuesto\n\nDuracion estimada: 150 min\n\nCambiar app.txt.\n\n${conTroceo ? TROCEO : ''}`,
    'utf8'
  );
  commitAll(repoRoot, `docs(${ID}): plan final`);
}

test('troceo: con mas de 60 min siguiente pregunta con dos salidas, tambien en automatico, y no trocea solo', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planGrande(repoRoot, tareasRoot, true);
    const s = siguiente(repoRoot);
    assert.deepEqual(resumen(s), ['approve', 'preguntar']);
    const salidas = s.salidas as { opcion: string; comando: string }[];
    assert.deepEqual(
      salidas.map((x) => [x.opcion, x.comando]),
      [
        ['trocear', `taskctl trocear ${ID}`],
        ['aprobar-entera', `taskctl approve ${ID}`],
      ]
    );
    // Nada se ha troceado: siguiente solo lee.
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-diseno');
    assert.equal(existsSync(path.join(tareasRoot, '00-planificadas', `${ID}b`)), false);
    // En texto tambien salen las dos salidas.
    const texto = cliOk(repoRoot, ['siguiente', ID]).stdout;
    assert.match(texto, /Salida trocear: taskctl trocear TASK-001/);
    assert.match(texto, /Salida aprobar-entera: taskctl approve TASK-001/);
  });
});

test('troceo: trocear pasa la tarea a TASK-NNNa, crea b y c planificadas con la misma rama y regenera el ROADMAP', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planGrande(repoRoot, tareasRoot, true);
    const original = (await readTareaFile(tareasRoot, ID))!.task;
    const r = cliOk(repoRoot, ['trocear', ID]);
    assert.match(r.stdout, /troceada en TASK-001a, TASK-001b, TASK-001c/);

    assert.equal(await readTareaFile(tareasRoot, ID), null, 'el ID sin letra ya no existe');
    const a = (await readTareaFile(tareasRoot, `${ID}a`))!;
    assert.equal(a.task.estado, 'en-diseno');
    assert.equal(a.task.rama, original.rama);
    assert.match(a.body, /^- \[ \] new, board y roadmap aceptan el ID$/m);
    assert.match(a.body, /Objetivo de la tarea entera:/);
    assert.match(a.body, /^## Transiciones$/m, 'conserva su registro (modo congelado)');
    assert.ok(existsSync(path.join(tareasRoot, '01-en-diseno', `${ID}a`, 'planificacion', 'plan-final.md')));
    const plan = await readFile(path.join(tareasRoot, '01-en-diseno', `${ID}a`, 'planificacion', 'plan-final.md'), 'utf8');
    assert.match(plan, /^Duracion estimada: 40 min/m, 'la parte a hereda su propia estimacion');
    assert.match(plan, /Troceo aceptado por una persona el \d{4}-\d{2}-\d{2}/);

    for (const [letra, previa] of [['b', 'a'], ['c', 'b']] as const) {
      const p = (await readTareaFile(tareasRoot, `${ID}${letra}`))!;
      assert.equal(p.task.estado, 'planificada');
      assert.equal(p.task.rama, original.rama, `la parte ${letra} comparte la rama`);
      assert.deepEqual(p.task.dependencias, [`${ID}${previa}`]);
      assert.ok(p.filePath.includes(`00-planificadas${path.sep}${ID}${letra}`));
    }
    const b = (await readTareaFile(tareasRoot, `${ID}b`))!;
    assert.match(b.body, /^- \[ \] trocear crea las partes$/m);
    assert.match(b.body, /^- \[ \] el ROADMAP se regenera$/m);

    // Un solo commit en develop, con el ROADMAP ya regenerado y el arbol limpio.
    assert.equal(git(['status', '--porcelain'], repoRoot), '');
    assert.match(git(['log', '-1', '--format=%s'], repoRoot).trim(), /^chore\(TASK-001\): troceo en TASK-001a, TASK-001b, TASK-001c$/);
    const roadmap = await readFile(path.join(tareasRoot, 'ROADMAP.md'), 'utf8');
    for (const x of ['a', 'b', 'c']) assert.match(roadmap, new RegExp(`TASK-001${x}`));
    assert.match(git(['show', '--name-only', '--format=', 'HEAD'], repoRoot), /tareas\/ROADMAP\.md/);

    // new da el numero siguiente, sin chocar con las partes.
    nueva(repoRoot, 'feature', 'Otra');
    assert.ok(await readTareaFile(tareasRoot, 'TASK-002'));
    // board y metricas aceptan los IDs con letra.
    const board = cliOk(repoRoot, ['board']).stdout;
    // Dentro de 00-planificadas: TASK-001b, TASK-001c y luego TASK-002.
    assert.ok(board.includes('TASK-001a'));
    assert.ok(board.indexOf('TASK-001b') < board.indexOf('TASK-001c'));
    assert.ok(board.indexOf('TASK-001c') < board.indexOf('TASK-002'));
    cliOk(repoRoot, ['metricas']);
    cliOk(repoRoot, ['roadmap']);
    // MEN-1: el ROADMAP con partes se compara fila a fila (sin "no comparable").
    cliOk(repoRoot, ['roadmap', '--escribir']);
    const comp = cli(repoRoot, ['roadmap', '--comparar']);
    assert.equal(comp.status, 0, comp.stdout + comp.stderr);
    assert.doesNotMatch(comp.stdout + comp.stderr, /no comparable/i);
  });
});

test('troceo: las partes comparten la rama; a la abre, se cierra, y b sigue en la misma', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planGrande(repoRoot, tareasRoot, true);
    cliOk(repoRoot, ['trocear', ID]);
    const A = `${ID}a`;
    const B = `${ID}b`;
    const rama = (await readTareaFile(tareasRoot, A))!.task.rama;
    assert.deepEqual(resumen(siguiente(repoRoot, A)), ['approve', 'continuar'], 'la parte a ya no pasa de la hora');
    cliOk(repoRoot, ['approve', A]);
    cliOk(repoRoot, ['start', A]);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
    await codigo(repoRoot, 'parte a\n', `feat(${A}): parte a`);
    cliOk(repoRoot, ['review', A]);
    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot, A), 'informe-revision-1.md'));
    cliOk(repoRoot, ['veredicto', A, 'aprobada']);
    cliOk(repoRoot, ['finish', A]);
    assert.equal((await readTareaFile(tareasRoot, A))?.task.estado, 'terminada');

    // La parte b se planifica y arranca en la MISMA rama, sin crear otra.
    const ramasAntes = git(['branch', '--format=%(refname:short)'], repoRoot).trim().split('\n').sort();
    cliOk(repoRoot, ['plan', B]);
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', B, 'planificacion', 'plan-final.md'),
      '# Plan\n\n## Enfoque propuesto\n\nDuracion estimada: 30 min\n\nSeguir.\n',
      'utf8'
    );
    commitAll(repoRoot, `docs(${B}): plan final`);
    cliOk(repoRoot, ['approve', B]);
    cliOk(repoRoot, ['start', B]);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
    const ramasDespues = git(['branch', '--format=%(refname:short)'], repoRoot).trim().split('\n').sort();
    assert.deepEqual(ramasDespues, ramasAntes, 'no se crea ninguna rama nueva');
    assert.equal((await readTareaFile(tareasRoot, B))?.task.estado, 'en-curso');
  });
});

test('troceo: sin seccion "## Troceo" trocear falla sin tocar nada', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planGrande(repoRoot, tareasRoot, false);
    const cabeza = git(['rev-parse', 'HEAD'], repoRoot);
    const r = cli(repoRoot, ['trocear', ID]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /no tiene seccion "## Troceo".*No se ha tocado nada/s);
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), cabeza);
    assert.equal(git(['status', '--porcelain'], repoRoot), '');
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-diseno');
  });
});

test('troceo: si la persona rechaza el troceo, approve deja la tarea entera, como antes (regresion)', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planGrande(repoRoot, tareasRoot, true);
    const rutaPlan = path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md');
    await writeFile(rutaPlan, `${await readFile(rutaPlan, 'utf8')}\nMotivo para no trocear: se prueba de punta a punta.\n`, 'utf8');
    commitAll(repoRoot, `docs(${ID}): motivo`);
    cliOk(repoRoot, ['approve', ID]);
    const t = await readTareaFile(tareasRoot, ID);
    assert.equal(t?.task.plan_aprobado, true);
    assert.equal(await readTareaFile(tareasRoot, `${ID}a`), null);
    assert.equal(await readTareaFile(tareasRoot, `${ID}b`), null);
    assert.match(await readFile(rutaPlan, 'utf8'), /Motivo para no trocear/);
    // Con el plan aprobado ya no se puede trocear.
    const r = cli(repoRoot, ['trocear', ID]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /plan sin aprobar/);
  });
});

test('troceo (MEN-5): si falla a medias se deshace y la tarea sigue entera', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planGrande(repoRoot, tareasRoot, true);
    const cabeza = git(['rev-parse', 'HEAD'], repoRoot);
    let llamadas = 0;
    await assert.rejects(
      runTrocearCommand(tareasRoot, [ID], '2026-11-12', {
        repoCwd: repoRoot,
        escribirParte: async (root, task, body, opts) => {
          llamadas++;
          if (llamadas === 2) throw new Error('disco lleno simulado');
          return writeTareaFile(root, task, body, opts);
        },
      }),
      /fallo a medias \(disco lleno simulado\) y se ha deshecho/
    );
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), cabeza);
    assert.equal(git(['status', '--porcelain'], repoRoot), '', 'el arbol queda como estaba');
    assert.equal((await readTareaFile(tareasRoot, ID))?.task.estado, 'en-diseno');
    for (const x of ['a', 'b', 'c']) assert.equal(await readTareaFile(tareasRoot, `${ID}${x}`), null);
  });
});

test('troceo (MEN-4): si traer la base a la rama compartida choca, start lo deshace y no mueve la tarea', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planGrande(repoRoot, tareasRoot, true);
    cliOk(repoRoot, ['trocear', ID]);
    const A = `${ID}a`;
    const B = `${ID}b`;
    const rama = (await readTareaFile(tareasRoot, A))!.task.rama;
    cliOk(repoRoot, ['approve', A]);
    cliOk(repoRoot, ['start', A]);
    await codigo(repoRoot, 'parte a\n', `feat(${A}): parte a`);
    cliOk(repoRoot, ['review', A]);
    await rellenarInforme(repoRoot, path.join(dirRevision(tareasRoot, A), 'informe-revision-1.md'));
    cliOk(repoRoot, ['veredicto', A, 'aprobada']);
    cliOk(repoRoot, ['finish', A]);
    // La rama y la base tocan la misma linea despues del cierre de a.
    git(['checkout', '-q', rama], repoRoot);
    await codigo(repoRoot, 'desde la rama\n', 'feat: cambio en la rama');
    git(['checkout', '-q', 'develop'], repoRoot);
    await codigo(repoRoot, 'desde develop\n', 'feat: cambio en develop');
    cliOk(repoRoot, ['plan', B]);
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', B, 'planificacion', 'plan-final.md'),
      '# Plan\n\n## Enfoque propuesto\n\nDuracion estimada: 30 min\n\nSeguir.\n',
      'utf8'
    );
    commitAll(repoRoot, `docs(${B}): plan final`);
    cliOk(repoRoot, ['approve', B]);
    // --asignado-a: la rama con un commit sin integrar cuenta como trabajo abierto.
    const r = cli(repoRoot, ['start', B, '--asignado-a', 'otra@ejemplo.test']);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /no se pudo traer "develop" \(CONFLICT \(content\): Merge conflict in app\.txt\)/);
    assert.match(r.stderr, /El merge se ha deshecho y la tarea no se ha movido/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
    assert.equal(git(['status', '--porcelain'], repoRoot), '', 'sin merge a medias');
  });
});
