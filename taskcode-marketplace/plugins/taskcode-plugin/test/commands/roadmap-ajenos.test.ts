/**
 * TASK-098, regla numero uno: taskctl no pisa un ROADMAP ajeno.
 *
 * - Las copias de los ROADMAP reales de ToolsaWeb y OpenDockTrading (en
 *   test/fixtures/roadmap, recortadas) quedan byte a byte iguales tras cada
 *   transicion, igual que uno declarado en rutas_sincronizacion.
 * - La zona manual de uno con la marca se conserva y un ciclo se informa sin
 *   abortar; una tarea ilegible deja el ROADMAP como estaba.
 * - Ni cambios sin commitear, ni un fichero borrado con historia, ni un
 *   nombre con otras mayusculas se tocan.
 * - `roadmap --comparar` no escribe nada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { writeTareaFile } from '../../src/fs/task-store.js';
import { runNewCommand } from '../../src/commands/new.js';
import { runPlanCommand } from '../../src/commands/plan.js';
import { runApproveCommand } from '../../src/commands/approve.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { runRoadmapCommand } from '../../src/commands/roadmap.js';
import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
import { extraerZonaManual, generarRoadmap, llevaMarcaTaskctl, MARCA_TASKCTL } from '../../src/core/roadmap.js';
import {
  CUERPO_PLANIFICABLE,
  FIXTURES_ROADMAP,
  SCRIPTS_DIR,
  aRevision,
  bytes,
  commitAll,
  ficherosDeHead,
  git,
  porcelain,
  ponerRoadmap,
  rutaRoadmap,
  tarea,
  withRepo,
} from '../helpers/roadmap-fixtures.js';

const ROADMAP = 'tareas/ROADMAP.md';

/**
 * Recorre new, plan, approve, start y finish de una tarea y comprueba tras
 * cada paso que el ROADMAP tiene exactamente los bytes de `esperado`.
 */
async function cicloSinTocar(repoRoot: string, tareasRoot: string, esperado: Buffer): Promise<void> {
  const igual = (paso: string): void => {
    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(esperado), `${paso} cambio el ROADMAP ajeno`);
    assert.ok(!ficherosDeHead(repoRoot).includes(ROADMAP), `${paso} metio el ROADMAP en su commit`);
  };
  await runNewCommand(
    tareasRoot,
    ['--titulo', 'Ajena', '--tipo', 'feature', '--objetivo', 'Probar.', '--criterio', 'No pisa.'],
    '2026-11-10',
    { repoCwd: repoRoot }
  );
  igual('new');
  await runPlanCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot });
  igual('plan');
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', 'TASK-001', 'planificacion', 'plan-final.md'),
    '# Plan\n\nEnfoque: no pisar.\n',
    'utf8'
  );
  commitAll(repoRoot, 'docs: plan');
  await runApproveCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot });
  igual('approve');
  await runStartCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
  igual('start');
  await aRevision(repoRoot, tareasRoot, 'TASK-001');
  await runFinishCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
  igual('finish');
  assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
  assert.equal(porcelain(repoRoot), '');
}

for (const fichero of ['toolsaweb.md', 'opendocktrading.md']) {
  test(`el ROADMAP real de ${fichero} queda byte a byte igual tras new, plan, approve, start y finish`, async () => {
    await withRepo(async (repoRoot, tareasRoot) => {
      const original = readFileSync(path.join(FIXTURES_ROADMAP, fichero));
      assert.equal(llevaMarcaTaskctl(original.toString('utf8')), false);
      await ponerRoadmap(repoRoot, original);
      await cicloSinTocar(repoRoot, tareasRoot, original);
    });
  });
}

test('un ROADMAP declarado en rutas_sincronizacion no se toca aunque lleve la marca de taskctl', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    // Con la marca y desfasado a proposito (sin tareas): si taskctl lo
    // regenerara, cambiaria. El comando del proyecto no hace nada.
    const conMarca = Buffer.from(generarRoadmap([], null).texto, 'utf8');
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    await writeFile(
      path.join(repoRoot, '.taskcode', 'config.yml'),
      'comando_sincronizacion: "node -e 0"\nrutas_sincronizacion: [tareas/ROADMAP.md]\n',
      'utf8'
    );
    await ponerRoadmap(repoRoot, conMarca);
    await cicloSinTocar(repoRoot, tareasRoot, conMarca);
    const c = runRoadmapCommand(repoRoot, ['--escribir']);
    assert.equal(c.codigo, 1);
    assert.match(c.salida, /rutas_sincronizacion/);
    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(conMarca));
  });
});

const MANUAL = [
  '<!-- manual:inicio (notas de la persona) -->',
  '## Hitos',
  '',
  '### H1 — Lo primero',
  '',
  'Motivo con *énfasis*, tildes y | barras que no se tocan.  ',
  '<!-- manual:fin -->',
].join('\n');

test('la zona manual se conserva al regenerar y un ciclo se informa en el ROADMAP sin abortar la transicion', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await ponerRoadmap(repoRoot, generarRoadmap([], MANUAL).texto);
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-001', dependencias: ['TASK-002'] }), CUERPO_PLANIFICABLE);
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-002', dependencias: ['TASK-001'] }), CUERPO_PLANIFICABLE);
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-003', estado: 'en-diseno' }), CUERPO_PLANIFICABLE);
    const planDir = path.join(tareasRoot, '01-en-diseno', 'TASK-003', 'planificacion');
    await mkdir(planDir, { recursive: true });
    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n\nEnfoque: ciclo.\n', 'utf8');
    commitAll(repoRoot, 'docs: tareas con ciclo');

    const a = await runApproveCommand(tareasRoot, ['TASK-003'], '2026-11-10', { repoCwd: repoRoot });

    assert.equal(a.autoCommit.commiteado, true);
    assert.ok(a.autoCommit.ficheros.includes(ROADMAP));
    const texto = readFileSync(rutaRoadmap(repoRoot), 'utf8');
    assert.equal(texto.split('\n')[2], MARCA_TASKCTL);
    assert.equal(extraerZonaManual(texto), MANUAL);
    assert.ok(texto.includes(`\n${MANUAL}\n`));
    assert.match(texto, /^## H1 — Lo primero$/m);
    assert.match(texto, /^## Dependencias circulares$/m);
    assert.match(texto, /^- TASK-001 → TASK-002 → TASK-001$/m);
    assert.ok(a.autoCommit.avisos.some((m) => m.includes('dependencia circular')), a.autoCommit.avisos.join('\n'));
    assert.equal(porcelain(repoRoot), '');
  });
});

test('una tarea ilegible deja el ROADMAP como estaba, avisa y la transicion sigue', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    const previo = generarRoadmap([], MANUAL).texto;
    await ponerRoadmap(repoRoot, previo);
    await mkdir(path.join(tareasRoot, '00-planificadas', 'TASK-009'), { recursive: true });
    await writeFile(path.join(tareasRoot, '00-planificadas', 'TASK-009', 'tarea.md'), 'sin frontmatter\n', 'utf8');
    commitAll(repoRoot, 'docs: tarea rota');

    const n = await runNewCommand(tareasRoot, ['--titulo', 'Nueva', '--tipo', 'feature'], '2026-11-10', {
      repoCwd: repoRoot,
    });

    assert.equal(n.autoCommit.commiteado, true);
    assert.equal(readFileSync(rutaRoadmap(repoRoot), 'utf8'), previo);
    assert.ok(!n.autoCommit.ficheros.includes(ROADMAP));
    assert.ok(n.autoCommit.avisos.some((m) => m.includes('no se ha regenerado') && m.includes('TASK-009')));
  });
});

test('con cambios sin commitear en el ROADMAP no se regenera: se avisa y los cambios siguen ahi', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await ponerRoadmap(repoRoot, generarRoadmap([], null).texto);
    const editado = `${readFileSync(rutaRoadmap(repoRoot), 'utf8')}\nnota a medias de la persona\n`;
    await writeFile(rutaRoadmap(repoRoot), editado, 'utf8');
    // Lo que haria una transicion: escribir su tarea y commitearla.
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-001' }), CUERPO_PLANIFICABLE);

    const r = autoCommit({
      cwd: repoRoot,
      rutas: [path.join(tareasRoot, '00-planificadas', 'TASK-001')],
      mensaje: mensajeChore('TASK-001', 'tarea creada'),
      roadmap: true,
    });

    assert.equal(r.commiteado, true);
    assert.equal(r.roadmap?.estado, 'omitido');
    assert.ok(r.avisos.some((m) => m.includes('cambios sin commitear')), r.avisos.join('\n'));
    assert.deepEqual(r.ficheros, ['tareas/00-planificadas/TASK-001/tarea.md']);
    assert.equal(readFileSync(rutaRoadmap(repoRoot), 'utf8'), editado);
    assert.equal(porcelain(repoRoot), `M ${ROADMAP}`);

    const e = runRoadmapCommand(repoRoot, ['--escribir']);
    assert.equal(e.codigo, 1);
    assert.equal(readFileSync(rutaRoadmap(repoRoot), 'utf8'), editado);
  });
});

test('un ROADMAP borrado con historia en git no se recrea solo; roadmap --escribir si lo crea', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await runNewCommand(tareasRoot, ['--titulo', 'Una', '--tipo', 'feature'], '2026-11-10', { repoCwd: repoRoot });
    assert.ok(existsSync(rutaRoadmap(repoRoot)));
    git(['rm', '-q', ROADMAP], repoRoot);
    git(['commit', '-q', '-m', 'docs: fuera el roadmap'], repoRoot);

    const n = await runNewCommand(tareasRoot, ['--titulo', 'Otra', '--tipo', 'feature'], '2026-11-10', {
      repoCwd: repoRoot,
    });
    assert.equal(existsSync(rutaRoadmap(repoRoot)), false);
    assert.ok(n.autoCommit.avisos.some((m) => m.includes('tiene historia en git')));

    const e = runRoadmapCommand(repoRoot, ['--escribir']);
    assert.equal(e.codigo, 0);
    assert.match(e.salida, /Regenerado tareas\/ROADMAP\.md/);
    assert.match(readFileSync(rutaRoadmap(repoRoot), 'utf8'), /TASK-002/);
  });
});

test('un fichero con otras mayusculas (tareas/Roadmap.md) no se toca ni se crea otro al lado', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await mkdir(tareasRoot, { recursive: true });
    await writeFile(path.join(tareasRoot, 'Roadmap.md'), '# Mio\n', 'utf8');
    commitAll(repoRoot, 'docs: roadmap propio');

    const n = await runNewCommand(tareasRoot, ['--titulo', 'Una', '--tipo', 'feature'], '2026-11-10', {
      repoCwd: repoRoot,
    });

    assert.equal(readFileSync(path.join(tareasRoot, 'Roadmap.md'), 'utf8'), '# Mio\n');
    assert.ok(!n.autoCommit.ficheros.some((f) => f.toLowerCase() === ROADMAP.toLowerCase()));
    assert.ok(n.autoCommit.avisos.some((m) => m.includes('"Roadmap.md"')));
  });
});

test('roadmap --comparar no escribe nada y lista lo que difiere de un ROADMAP ajeno; --escribir no lo sustituye', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    const original = readFileSync(path.join(FIXTURES_ROADMAP, 'opendocktrading.md'));
    await ponerRoadmap(repoRoot, original);
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-009', sprint: 0, estado: 'terminada' }), CUERPO_PLANIFICABLE);
    commitAll(repoRoot, 'docs: una tarea');
    const head = git(['rev-parse', 'HEAD'], repoRoot);

    const c = runRoadmapCommand(repoRoot, ['--comparar']);

    assert.equal(c.codigo, 1);
    assert.match(c.salida, /no lleva la marca de taskctl/);
    assert.match(c.salida, /TASK-009: estado "▶ en revisión" en el actual y "✅ terminada" en el generado\./);
    assert.match(c.salida, /TASK-001: solo en el actual \(H0\)\./);
    // La zona manual de OpenDockTrading se conserva tal cual (ninguna
    // diferencia "zona manual:"); su texto fuera de la zona si se lista.
    assert.doesNotMatch(c.salida, /^\s*- zona manual:/m);
    assert.match(c.salida, /texto fuera de la zona manual que se perderia: /);
    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(original));
    assert.equal(porcelain(repoRoot), '');
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head);

    const e = runRoadmapCommand(repoRoot, ['--escribir']);
    assert.equal(e.codigo, 1);
    assert.match(e.salida, /no lleva la marca de taskctl y difiere/);
    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(original));

    // Sin flags tampoco escribe: saca por stdout el que se generaria.
    const m = runRoadmapCommand(repoRoot, []);
    assert.equal(m.codigo, 0);
    assert.equal(m.salida.split('\n')[2], MARCA_TASKCTL);
    assert.ok(m.salida.includes(extraerZonaManual(original.toString('utf8'))!));
    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(original));
  });
});

test('roadmap --escribir migra un ROADMAP ajeno solo si --comparar sale limpio, y conserva su zona manual', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-001' }), CUERPO_PLANIFICABLE);
    // Mismo contenido estructural que el de taskctl, con la marca de otro generador.
    const propio = generarRoadmap([{ id: 'TASK-001', titulo: 'Tarea de prueba del roadmap', sprint: 1, complejidad: 'simple', estado: 'planificada', dependencias: [] }], MANUAL)
      .texto.replace(MARCA_TASKCTL, '<!-- generado por scripts/otro.py; no editar a mano -->');
    await ponerRoadmap(repoRoot, propio);

    const c = runRoadmapCommand(repoRoot, ['--comparar']);
    assert.equal(c.codigo, 0, c.salida);
    assert.match(c.salida, /Sin diferencias/);

    const e = runRoadmapCommand(repoRoot, ['--escribir']);
    assert.equal(e.codigo, 0, e.salida);
    const texto = readFileSync(rutaRoadmap(repoRoot), 'utf8');
    assert.ok(llevaMarcaTaskctl(texto));
    assert.equal(extraerZonaManual(texto), MANUAL);
  });
});
