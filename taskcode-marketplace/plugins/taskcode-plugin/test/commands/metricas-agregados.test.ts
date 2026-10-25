/**
 * TASK-065: `taskctl metricas --evolucion [--tramo N]`, `--grupos` y `--json`
 * por CLI, contra repos Git temporales reales (uno o varios con `--repo`).
 * Solo lectura: ningun repo cambia.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conRepos, escribirTareas, metricas, estado, type TareaFixture } from '../helpers/metricas-repos.js';

/** Cinco tareas terminadas de alfa y dos de beta (una con el mismo ID), y una sin cierre. */
const ALFA: TareaFixture[] = [
  { id: 'TASK-099', finish: '2026-10-02T12:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [], bytesPeticion: 1024 }] },
  { id: 'TASK-100', finish: '2026-10-02T09:00:00Z', rondas: [{ veredicto: 'cambios-solicitados', hallazgos: [{ id: 'IMP-1', sev: 'IMPORTANTE' }], bytesPeticion: 4096 }, { veredicto: 'aprobada', hallazgos: [{ id: 'IMP-1', sev: 'IMPORTANTE' }], bytesPeticion: 2048 }] },
  { id: 'TASK-101', finish: '2026-10-01', rondas: [{ veredicto: 'aprobada-con-correcciones', hallazgos: [{ id: 'MEN-1', sev: 'MENOR' }] }] },
  { id: 'TASK-102', finish: '2026-10-03T10:00:00Z' },
  { id: 'TASK-103', finish: null, rondas: [{ veredicto: 'aprobada', hallazgos: null }] },
];
const BETA: TareaFixture[] = [
  { id: 'TASK-099', tipo: 'fix', criterios: 8, finish: '2026-10-02T08:00:00Z', rondas: [{ veredicto: 'aprobada', hallazgos: [{ id: 'CRI-1', sev: 'CRITICO' }], bytesPeticion: 10240 }] },
  { id: 'TASK-001', estado: 'en-curso' },
];

function filasTramo(salida: string): string[][] {
  return salida
    .split('\n')
    .filter((l) => /^\| \d+ /.test(l))
    .map((l) =>
      l
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())
    );
}

test('--evolucion: tramos por dia de cierre (proyecto y numero de ID desempatan), las sin cierre fuera por proyecto', async () => {
  await conRepos(async (crear, base) => {
    const alfa = await crear('alfa');
    const beta = await crear('beta');
    await escribirTareas(alfa, ALFA);
    await escribirTareas(beta, BETA);
    const antes = [estado(alfa), estado(beta)];
    const r = metricas(base, ['--evolucion', '--tramo', '2', '--repo', 'alfa', '--repo', 'beta']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /Evolucion por tramos de 2: 6 tareas terminadas, 5 en tramos; fuera por no tener fecha de cierre: 1 \(alfa 1\)\./);
    // Orden: alfa/101 (dia 1), alfa/099, alfa/100, beta/099 (dia 2: proyecto y numero, no la hora), alfa/102.
    const t = filasTramo(r.stdout);
    assert.deepEqual(t.map((c) => [c[0], c[1], c[2]]), [
      ['1', '2', '2026-10-01 a 2026-10-02'],
      ['2', '2', '2026-10-02'],
      ['3', '1', '2026-10-03'],
    ]);
    // Tramo 1 = alfa/101 (solo dia) + alfa/099: rondas 1 y 1; IMP 0 y 0.
    assert.deepEqual([t[0]?.[4], t[0]?.[5], t[0]?.[6]], ['1', '1 (n=2)', '0 (n=2)']);
    // Tramo 2 = alfa/100 (2 rondas, 1 IMP una vez) + beta/099 (1 ronda, 0 IMP; KB 10).
    assert.deepEqual([t[1]?.[5], t[1]?.[6], t[1]?.[8]], ['1.5 (n=2)', '0.5 (n=2)', '6.5 (n=2)']);
    // Tramo 3 = alfa/102: sin revision.
    assert.deepEqual([t[2]?.[5], t[2]?.[6]], ['— (n=0)', '— (n=0)']);
    assert.doesNotMatch(r.stdout, /NaN|undefined|null/);
    assert.doesNotMatch(r.stdout, /\| TASK-/, 'sin la tabla por tarea');
    assert.deepEqual([estado(alfa), estado(beta)], antes, 'solo lectura');
  });
});

test('--tramo invalido (0, -1, 2.5, abc, sin valor, sin --evolucion) y --evolucion con --tokens/--heuristica abortan sin leer', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, ALFA);
    const casos: [string[], RegExp][] = [
      [['--evolucion', '--tramo', '0'], /--tramo "0" no es un entero de 1 o mas/],
      [['--evolucion', '--tramo', '-1'], /--tramo "-1" no es un entero de 1 o mas/],
      [['--evolucion', '--tramo', '2.5'], /--tramo "2.5" no es un entero de 1 o mas/],
      [['--evolucion', '--tramo', 'abc'], /--tramo "abc" no es un entero de 1 o mas/],
      [['--evolucion', '--tramo=-1'], /--tramo "-1" no es/],
      [['--evolucion', '--tramo'], /--tramo necesita un entero de 1 o mas/],
      [['--tramo', '5'], /--tramo solo se admite con --evolucion/],
      [['--evolucion', '--tokens'], /--evolucion no se combina con --tokens/],
      [['--evolucion', '--heuristica'], /--evolucion no se combina con --heuristica/],
      [['--evolucion=1'], /"--evolucion" no lleva valor/],
    ];
    for (const [args, error] of casos) {
      const r = metricas(alfa, args);
      assert.equal(r.status, 1, args.join(' '));
      assert.match(r.stderr, error, args.join(' '));
      assert.equal(r.stdout, '', args.join(' '));
    }
  });
});

test('--evolucion sin tareas: sale la cabecera con ceros, sin tabla ni NaN', async () => {
  await conRepos(async (crear) => {
    const vacio = await crear('vacio');
    const r = metricas(vacio, ['--evolucion']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^Evolucion por tramos de 20: 0 tareas terminadas, 0 en tramos; fuera por no tener fecha de cierre: ninguna\./);
    assert.doesNotMatch(r.stdout, /NaN|No hay tareas/);
  });
});
