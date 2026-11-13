/**
 * TASK-129: freno al crecimiento de la suite. La logica pura (conteo de tests,
 * agregado por version y aviso) y doctor sobre un repo temporal real con
 * tareas terminadas y el registro de puertas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { avisoCrecimiento, contarTests, suitePorVersion } from '../../src/core/crecimiento-suite.js';
import { parsearRegistroPuertas } from '../../src/core/registro-puertas.js';
import { ConfigError, parsearConfig } from '../../src/core/config.js';
import { comprobarCrecimientoSuite } from '../../src/commands/doctor.js';
import { LINEA_PLANTILLA_PRESUPUESTO_TESTS, planTemplate } from '../../src/commands/plan.js';
import { buildNewTask } from '../../src/commands/new.js';

test('contarTests (TASK-129): node, jest, dotnet, maven, cargo y pytest; null si no se reconoce', () => {
  assert.equal(contarTests('...\nℹ tests 868\nℹ suites 0\nℹ pass 868\n'), 868);
  assert.equal(contarTests('# tests 12\n# pass 12\n'), 12);
  assert.equal(contarTests('Tests:       2 failed, 40 passed, 42 total\n'), 42);
  assert.equal(contarTests('Passed!  - Failed: 0, Passed: 7\nTotal tests: 7\n'), 7);
  assert.equal(contarTests('Tests run: 3, Failures: 0\n[INFO] Tests run: 15, Failures: 0, Errors: 0\n'), 15);
  assert.equal(
    contarTests('test result: ok. 10 passed; 0 failed; 0 ignored\ntest result: FAILED. 4 passed; 1 failed; 2 ignored\n'),
    15
  );
  assert.equal(contarTests('===== 2 failed, 30 passed in 1.2s =====\n'), 32);
  assert.equal(contarTests('\u001b[32mℹ tests 5\u001b[0m\n'), 5, 'sin colores ANSI');
  assert.equal(contarTests('todo bien, sin resumen'), null);
});

const linea = (tarea: string, tests: string, s: number, resultado = 'verde') =>
  `suite\t${tarea}\t2026-11-13T00:00:00.000Z\t${tests}\t${s.toFixed(1)}\t${resultado}`;

test('suitePorVersion y avisoCrecimiento (TASK-129): mayor numero de tests y mediana por version; aviso sobre el umbral', () => {
  const tareas = [
    { id: 'TASK-1', version: '0.14.0' },
    { id: 'TASK-2', version: '0.14.0' },
    { id: 'TASK-3', version: '0.15.0' },
    { id: 'TASK-4', version: null },
  ];
  const lineas = parsearRegistroPuertas(
    [
      linea('TASK-1', '100', 600),
      linea('TASK-2', '110', 800),
      linea('TASK-3', '140', 1000),
      linea('TASK-3', '999', 9, 'rojo'),
      linea('TASK-4', '500', 5000),
    ].join('\n')
  );
  const v = suitePorVersion(tareas, lineas);
  assert.deepEqual(v, [
    { version: '0.14.0', tests: 110, completaS: 700 },
    { version: '0.15.0', tests: 140, completaS: 1000 },
  ]);
  const aviso = avisoCrecimiento(v, 20);
  assert.ok(aviso !== null);
  assert.match(aviso, /tests 110 en 0\.14\.0 -> 140 en 0\.15\.0 \(\+27 %\)/);
  assert.match(aviso, /duracion de la completa 700 s en 0\.14\.0 -> 1000 s en 0\.15\.0 \(\+43 %\)/);
  assert.equal(avisoCrecimiento(v, 50), null, 'por debajo del umbral no avisa');
});

test('avisoCrecimiento (TASK-129): sin datos o con una sola version, ni avisa ni falla', () => {
  assert.equal(avisoCrecimiento([], 20), null);
  assert.equal(avisoCrecimiento([{ version: '0.14.0', tests: 10, completaS: 5 }], 20), null);
  assert.equal(avisoCrecimiento([{ version: '0.14.0', tests: null, completaS: null }, { version: '0.15.0', tests: null, completaS: null }], 20), null);
  assert.deepEqual(suitePorVersion([{ id: 'TASK-1', version: '0.14.0' }], []), []);
});

test('config (TASK-129): umbral_crecimiento_suite, 20 por defecto, de 1 a 1000', () => {
  const r = '/repo/.taskcode/config.yml';
  assert.equal(parsearConfig('', r).umbral_crecimiento_suite, 20);
  assert.equal(parsearConfig('umbral_crecimiento_suite: 35\n', r).umbral_crecimiento_suite, 35);
  for (const v of ['0', '1001', '2.5', 'mucho']) {
    assert.throws(() => parsearConfig(`umbral_crecimiento_suite: ${v}\n`, r), ConfigError, v);
  }
});

const TRANSICIONES = (version: string) =>
  '\n## Transiciones\n\n| fecha | fase | modo | decidido_por | version |\n|---|---|---|---|---|\n' +
  `| 2026-11-01T00:00:00Z | finish | manual | persona | ${version} |\n`;

test('doctor (TASK-129): avisa si la suite crecio mas del umbral entre versiones; sin registro, nada', async () => {
  const raiz = await mkdtemp(path.join(tmpdir(), 'crecimiento-suite-'));
  try {
    spawnSync('git', ['init', '-q'], { cwd: raiz });
    const tareasRoot = path.join(raiz, 'tareas');
    for (const [id, version] of [
      ['TASK-001', '0.14.0'],
      ['TASK-002', '0.15.0'],
    ] as const) {
      await mkdir(path.join(tareasRoot, '04-terminadas', id), { recursive: true });
      await writeFile(path.join(tareasRoot, '04-terminadas', id, 'tarea.md'), `---\nid: ${id}\n---\n## Objetivo\nx\n${TRANSICIONES(version)}`, 'utf8');
    }
    const cfg = parsearConfig('comando_verificacion: "npm test"\n', 'c');
    assert.deepEqual(comprobarCrecimientoSuite(raiz, tareasRoot, cfg), [], 'sin registro: nada');
    await mkdir(path.join(raiz, '.git', 'taskcode'), { recursive: true });
    await writeFile(path.join(raiz, '.git', 'taskcode', 'puertas.log'), `${linea('TASK-001', '100', 600)}\n${linea('TASK-002', '150', 610)}\n`, 'utf8');
    const [c] = comprobarCrecimientoSuite(raiz, tareasRoot, cfg);
    assert.equal(c?.id, 'crecimiento-suite');
    assert.equal(c?.nivel, 'aviso');
    assert.match(c?.mensaje ?? '', /tests 100 en 0\.14\.0 -> 150 en 0\.15\.0 \(\+50 %\)/);
    assert.match(c?.arreglo ?? '', /tests-pesados\.md/);
    const holgado = parsearConfig('comando_verificacion: "npm test"\numbral_crecimiento_suite: 60\n', 'c');
    assert.equal(comprobarCrecimientoSuite(raiz, tareasRoot, holgado)[0]?.nivel, 'ok');
  } finally {
    await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('plantilla y skills (TASK-129): presupuesto de tests por criterio, duplicados como MENOR y pesados por lenguaje', async () => {
  const task = buildNewTask('TASK-129', { titulo: 't', tipo: 'feature', sprint: 0, etiquetas: [], complejidad: null, modeloSugerido: 'sonnet', agenteRevisor: 'g' }, '2026-11-13');
  assert.ok(planTemplate(task, []).includes(`## Plan de pruebas\n\n${LINEA_PLANTILLA_PRESUPUESTO_TESTS}\n`));
  const raiz = path.join(import.meta.dirname, '..', '..', '..');
  const plan = await readFile(path.join(raiz, 'skills', 'plan', 'SKILL.md'), 'utf8');
  assert.match(plan, /cuantos tests nuevos preve \(de 1\s+a 3; si pasa, el motivo\)/);
  assert.match(plan, /tests-pesados\.md/);
  const review = await readFile(path.join(raiz, 'skills', 'review', 'SKILL.md'), 'utf8');
  assert.match(review, /Un test que duplica a otro ya existente es MENOR/);
  const pesados = await readFile(path.join(raiz, 'skills', 'task-workflow', 'tests-pesados.md'), 'utf8');
  for (const marca of ['Node', 'Rust', '#[ignore]', 'Java', '@Tag', '.NET', '[Trait', 'comando_verificacion_pesada', 'de 1 a 3']) {
    assert.ok(pesados.includes(marca), marca);
  }
  assert.match(LINEA_PLANTILLA_PRESUPUESTO_TESTS, /presupuesto de 1 a 3 por criterio; si se pasa, el motivo/);
});

test('contarTests (TASK-129, IMP-2): con la salida recortada, cargo y Maven no dan cifra; node y pytest si', () => {
  const cargo = 'test result: ok. 400 passed; 0 failed; 0 ignored\n';
  assert.equal(contarTests(cargo + cargo), 800);
  assert.equal(contarTests(cargo + cargo, { recortada: true }), null, 'faltan crates del principio');
  assert.equal(contarTests('[INFO] Tests run: 15, Failures: 0\n', { recortada: true }), null);
  assert.equal(contarTests('ℹ tests 868\n', { recortada: true }), 868);
  assert.equal(contarTests('===== 30 passed in 1.2s =====\n', { recortada: true }), 30);
});

test('avisoCrecimiento (TASK-129, MEN-2): crecer exactamente el umbral no avisa; un poco mas, si', () => {
  const v = (tests: number) => [
    { version: '0.14.0', tests: 100, completaS: null },
    { version: '0.15.0', tests, completaS: null },
  ];
  assert.equal(avisoCrecimiento(v(120), 20), null);
  assert.match(avisoCrecimiento(v(121), 20) ?? '', /tests 100 en 0\.14\.0 -> 121/);
});
