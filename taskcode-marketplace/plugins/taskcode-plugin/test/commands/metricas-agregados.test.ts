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

/** Celdas de la fila de un grupo en la salida de --grupos. */
function grupo(salida: string, nombre: string): string[] {
  const l = salida.split('\n').find((x) => x.startsWith(`| ${nombre} `));
  assert.ok(l, `sin grupo ${nombre}:\n${salida}`);
  return l
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

test('--grupos con dos repos: tipo, complejidad, criterios, terciles de KB y proyecto, con los grupos vacios a la vista', async () => {
  await conRepos(async (crear, base) => {
    const alfa = await crear('alfa');
    const beta = await crear('beta');
    await escribirTareas(alfa, ALFA);
    await escribirTareas(beta, BETA);
    const r = metricas(base, ['--grupos', '--repo', 'alfa', '--repo', 'beta']);
    assert.equal(r.status, 0, r.stderr);
    const s = r.stdout;
    // 6 terminadas: alfa 099 (1a), 100 (2 rondas, IMP-1 una vez), 101 (1a, con correcciones),
    // 102 (sin revision), 103 (sin cierre, 1a, informe sin tabla); beta 099 (fix, 8 criterios, CRITICO).
    assert.match(s, /Grupos de 6 tareas terminadas \(sin revision: 1; revisadas sin tabla de hallazgos: 1\)\./);
    assert.deepEqual(grupo(s, 'feature').slice(1, 8), ['5', '4', '75% (3)', '1.25', '0.33 (n=3)', '1', '1']);
    assert.deepEqual(grupo(s, 'fix').slice(1, 8), ['1', '1', '100% (1)', '1', '1 (n=1)', '0', '0']);
    assert.deepEqual(grupo(s, 'hotfix').slice(1, 8), ['0', '0', '—', '—', '—', '0', '0'], 'grupo vacio');
    assert.deepEqual(grupo(s, '7+').slice(1, 3), ['1', '1']);
    assert.deepEqual(grupo(s, '0-4').slice(1, 3), ['5', '4']);
    assert.deepEqual(grupo(s, 'alfa').slice(1, 3), ['5', '4']);
    assert.deepEqual(grupo(s, 'beta').slice(1, 3), ['1', '1'], 'la en-curso de beta no cuenta');
    // KB por tarea: alfa/099 1, alfa/100 3 (4 y 2), beta/099 10 -> una en cada tercil; 3 sin peticion.
    assert.match(s, /terciles; sin peticion, fuera: 3\):/);
    assert.equal(grupo(s, 'bajo (<= 1 KB)')[1], '1');
    assert.equal(grupo(s, 'medio (1-3 KB)')[1], '1');
    assert.equal(grupo(s, 'alto (> 3 KB)')[1], '1');
    assert.doesNotMatch(s, /NaN|undefined|null/);
  });
});

test('--json con --evolucion y --grupos: un unico objeto que pasa JSON.parse, sin texto en stdout; avisos por stderr', async () => {
  await conRepos(async (crear, base) => {
    const alfa = await crear('alfa');
    const beta = await crear('beta');
    await escribirTareas(alfa, ALFA);
    await escribirTareas(beta, BETA);
    const r = metricas(base, ['--json', '--evolucion', '--tramo', '2', '--grupos', '--repo', 'alfa', '--repo', 'beta']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim().split('\n').length, 1, 'una sola linea');
    const o = JSON.parse(r.stdout) as Record<string, any>;
    assert.deepEqual(Object.keys(o), ['proyectos', 'sinCoste', 'evolucion', 'grupos']);
    assert.deepEqual(
      o.proyectos.map((p: Record<string, unknown>) => [p.proyecto, p.tareas]),
      [['alfa', 5], ['beta', 2]]
    );
    assert.deepEqual(o.evolucion.sinCierre, { total: 1, porProyecto: { alfa: 1 } });
    assert.deepEqual(o.evolucion.tramos.map((t: { n: number }) => t.n), [2, 2, 1]);
    assert.deepEqual(o.evolucion.tramos[2].rondas, { valor: null, n: 0 }, 'null solo junto a n 0');
    const hotfix = o.grupos.porTipo.find((g: { grupo: string }) => g.grupo === 'hotfix');
    assert.deepEqual([hotfix.n, hotfix.pctAprobadaPrimera, hotfix.critImpPorTarea], [0, null, null]);
    assert.equal(o.sinCoste.total, 6);
    assert.doesNotMatch(r.stdout, /NaN|Infinity/);
    assert.match(r.stderr, /^Repos leidos: alfa/m);
    assert.match(r.stderr, /\[AVISO\] 1 informe\(s\) de revision sin tabla/);
  });
});

test('--json sin tareas y con grupos vacios: objeto valido, sin "No hay tareas" ni NaN', async () => {
  await conRepos(async (crear) => {
    const vacio = await crear('vacio');
    for (const extra of [[], ['--evolucion'], ['--grupos'], ['--evolucion', '--grupos']]) {
      const r = metricas(vacio, ['--json', ...extra]);
      assert.equal(r.status, 0, r.stderr);
      const o = JSON.parse(r.stdout) as Record<string, any>;
      assert.deepEqual(
        o.proyectos.map((p: Record<string, unknown>) => [p.proyecto, p.tareas]),
        [['vacio', 0]]
      );
      assert.deepEqual(o.sinCoste, { terminadas: 0, total: 0, porFase: { diseno: 0, implementacion: 0, revision: 0 }, tareas: [] });
      if (extra.includes('--evolucion')) assert.deepEqual(o.evolucion.tramos, []);
      if (extra.includes('--grupos')) {
        assert.equal(o.grupos.porKb.cortes, null);
        assert.ok(o.grupos.porTipo.every((g: { n: number; rondasMedia: unknown }) => g.n === 0 && g.rondasMedia === null));
      }
      assert.doesNotMatch(r.stdout, /NaN|No hay tareas/);
      assert.equal(r.stderr, '');
    }
  });
});

test('--json con un flag fuera de la lista (--escribir, --tokens, --heuristica) aborta sin escribir nada', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, ALFA);
    const antes = estado(alfa);
    for (const otro of [['--tokens', '--escribir'], ['--tokens'], ['--heuristica'], ['--escribir']]) {
      const r = metricas(alfa, ['--json', ...otro]);
      assert.equal(r.status, 1, otro.join(' '));
      assert.match(r.stderr, /--json no se combina con .*: solo con --repo, --evolucion, --tramo, --grupos/);
      assert.equal(r.stdout, '');
      assert.equal(estado(alfa), antes, `${otro.join(' ')}: no se crea docs/METRICAS.md`);
    }
  });
});

test('terminadas sin coste: recuento por fase, las 10 primeras y «y N mas» por pantalla; completa en --json', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(
      alfa,
      Array.from({ length: 12 }, (_, i) => ({ id: `TASK-${String(i + 1).padStart(3, '0')}`, tokensRevision: i < 3 ? 50 : null }))
    );
    const r = metricas(alfa, []);
    assert.equal(r.status, 0, r.stderr);
    const linea = r.stdout.split('\n').find((l) => l.startsWith('Terminadas sin coste'));
    assert.ok(linea, r.stdout);
    assert.match(linea, /^Terminadas sin coste en alguna fase: 12 de 12 \(diseno 12, implementacion 12, revision 9\): TASK-001 \(diseno, implementacion\), /);
    assert.match(linea, /TASK-010 \(diseno, implementacion, revision\) y 2 mas \(lista completa con --json\)\.$/);
    assert.doesNotMatch(linea, /TASK-011/);
    const o = JSON.parse(metricas(alfa, ['--json']).stdout) as { sinCoste: { tareas: { id: string }[] } };
    assert.equal(o.sinCoste.tareas.length, 12);
    assert.equal(o.sinCoste.tareas[11]?.id, 'TASK-012');
  });
});

test('--evolucion --grupos juntos: las dos secciones, en ese orden', async () => {
  await conRepos(async (crear) => {
    const alfa = await crear('alfa');
    await escribirTareas(alfa, ALFA);
    const r = metricas(alfa, ['--grupos', '--evolucion']);
    assert.equal(r.status, 0, r.stderr);
    const i = r.stdout.indexOf('Evolucion por tramos');
    const j = r.stdout.indexOf('Grupos de 5 tareas terminadas');
    assert.ok(i === 0 && j > i, r.stdout);
    assert.match(metricas(alfa, ['--grupos', '--tokens']).stderr, /--grupos no se combina con --tokens/);
  });
});
