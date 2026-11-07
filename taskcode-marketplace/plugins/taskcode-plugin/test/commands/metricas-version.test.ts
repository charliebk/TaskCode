/**
 * TASK-084: `taskctl metricas --por-version [--json]` por CLI, contra repos
 * Git temporales reales con tareas cuya tabla `## Transiciones` lleva version
 * (5 columnas) y tareas anteriores sin ella (4 columnas). Solo lectura.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conRepos, escribirTareas, metricas, estado, type TareaFixture } from '../helpers/metricas-repos.js';
import type { SalidaJsonMetricas } from '../../src/commands/metricas.js';

const TAREAS: TareaFixture[] = [
  // Anterior a la version: tabla de 4 columnas.
  { id: 'TASK-001', finish: '2026-09-01T10:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'MEN-1', sev: 'MENOR' }] }] },
  // 0.10.0 (orden semver: va antes que 0.9 si se ordenase como texto, y no debe).
  { id: 'TASK-002', version: '0.10.0', finish: '2026-10-02T10:00:00Z', tokensRevision: 3000, rondas: [{ veredicto: 'cambios-solicitados', hallazgos: [{ id: 'IMP-1', sev: 'IMPORTANTE' }] }, { veredicto: 'aprobada', hallazgos: [] }] },
  { id: 'TASK-003', version: '0.9.0', finish: '2026-10-01T10:00:00Z', tokensRevision: 1000, rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'CRI-1', sev: 'CRITICO' }] }] },
  // finish abortado con 0.9.0 y reintentado con 0.10.0: cuenta el ultimo.
  {
    id: 'TASK-004',
    version: '0.9.0',
    finish: '2026-10-03T10:00:00Z',
    filasExtra: ['| 2026-10-04T10:00:00Z | finish | manual | persona | 0.10.0 |'],
    tokensDiseno: 500,
  },
  // Con version pero sin terminar: fuera.
  { id: 'TASK-005', version: '0.10.0', estado: 'en-curso' },
];

test('--por-version: agrupa por la version del ultimo finish, en orden semver, y las de 4 columnas aparte', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, TAREAS);
    const antes = estado(alfa);
    const r = metricas(alfa, ['--por-version']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^Por version de 4 tareas terminadas \(sin version anotada: 1\)\./);
    const filas = r.stdout
      .split('\n')
      .filter((l) => /^\| (\d|sin version)/.test(l))
      .map((l) => l.slice(1, -1).split('|').map((c) => c.trim()));
    // Tabla general: version, tareas, con revision, a la primera, rondas medias, tokens...
    assert.deepEqual(filas.slice(0, 3).map((c) => c.slice(0, 5)), [
      ['0.9.0', '1', '1', '100% (1)', '1'],
      ['0.10.0', '2', '1', '0% (0)', '2'],
      ['sin version', '1', '1', '100% (1)', '1'],
    ]);
    assert.deepEqual([filas[1]?.[5], filas[1]?.[7]], ['500 (n=1)', '3000 (n=1)']);
    // Tabla de hallazgos: con tabla, sin tabla, CRITICO, IMPORTANTE, MENOR...
    assert.deepEqual(filas.slice(3).map((c) => c.slice(0, 6)), [
      ['0.9.0', '1', '0', '1', '0', '0'],
      ['0.10.0', '1', '0', '0', '1', '0'],
      ['sin version', '1', '0', '0', '0', '1'],
    ]);
    assert.doesNotMatch(r.stdout, /\| TASK-/, 'sin la tabla por tarea');
    assert.doesNotMatch(r.stdout, /NaN|undefined|null/);
    assert.equal(estado(alfa), antes, 'solo lectura');
  });
});

test('--por-version --json: clave porVersion con versiones y sinVersion; sin el flag la salida --json no cambia', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, TAREAS);
    const r = metricas(alfa, ['--por-version', '--json']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim().split('\n').length, 1, 'una sola linea');
    const o = JSON.parse(r.stdout) as SalidaJsonMetricas;
    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'lecturasRevision', 'porVersion']);
    assert.ok(o.porVersion);
    assert.equal(o.porVersion.terminadas, 4);
    assert.deepEqual(o.porVersion.versiones.map((g) => [g.version, g.n]), [['0.9.0', 1], ['0.10.0', 2]]);
    assert.deepEqual(o.porVersion.sinVersion.version, null);
    assert.deepEqual(o.porVersion.sinVersion.hallazgosPorSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 1, desconocida: 0 });
    assert.deepEqual(o.porVersion.versiones[1]?.tokens.revision, { suma: 3000, conDato: 1, media: 3000 });
    assert.doesNotMatch(r.stdout, /NaN|Infinity/);
    // El contrato de siempre: sin --por-version no aparece la clave nueva.
    const sinFlag = JSON.parse(metricas(alfa, ['--json']).stdout) as Record<string, unknown>;
    assert.deepEqual(Object.keys(sinFlag), ['proyectos', 'sinCoste', 'lecturasRevision']);
  });
});

test('--por-version con --grupos sale en su seccion; sin tareas, n 0 y sin NaN', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, TAREAS);
    const r = metricas(alfa, ['--grupos', '--por-version']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.indexOf('Grupos de 4') < r.stdout.indexOf('Por version de 4'), 'grupos y despues por version');
    const vacio = await crear('vacio');
    const v = metricas(vacio, ['--por-version']);
    assert.equal(v.status, 0, v.stderr);
    assert.match(v.stdout, /Por version de 0 tareas terminadas \(sin version anotada: 0\)\./);
    const j = JSON.parse(metricas(vacio, ['--por-version', '--json']).stdout) as SalidaJsonMetricas;
    assert.deepEqual(j.porVersion?.versiones, []);
    assert.equal(j.porVersion?.sinVersion.n, 0);
    assert.doesNotMatch(v.stdout + JSON.stringify(j), /NaN/);
  });
});

test('--por-version con --tokens, --heuristica o --escribir, o con valor, aborta sin leer ni escribir', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, TAREAS);
    const antes = estado(alfa);
    const casos: [string[], RegExp][] = [
      [['--por-version', '--tokens'], /--por-version no se combina con --tokens/],
      [['--por-version', '--heuristica'], /--por-version no se combina con --heuristica/],
      [['--por-version', '--tokens', '--escribir'], /--por-version no se combina con --tokens ni --escribir/],
      [['--por-version=0.9.0'], /"--por-version" no lleva valor|--por-version no lleva valor/],
    ];
    for (const [args, error] of casos) {
      const r = metricas(alfa, args);
      assert.equal(r.status, 1, args.join(' '));
      assert.match(r.stderr, error, args.join(' '));
      assert.equal(r.stdout, '');
    }
    assert.equal(estado(alfa), antes);
  });
});
