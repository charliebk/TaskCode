/**
 * Telemetria de fases (TASK-052): el calculo puro de `taskctl metricas`.
 * Duraciones con origen registro, git y ausente; precision de dia; plan
 * repetido; varias rondas; pausa; y que nunca salga ni 0 inventado ni NaN.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLUMNAS_HEURISTICA,
  COLUMNAS_METRICAS,
  calcularFila,
  duracionEntre,
  enMuestraHeuristica,
  formatearDuracion,
  formatearTabla,
  parsearLogGit,
  resumirPorNivel,
  type EntradaMetricas,
  type EventoGit,
  type FilaMetricas,
} from '../../src/core/metricas.js';
import { TASK_COMPLEXITIES, type Task } from '../../src/core/task.js';

function tarea(o: Partial<Task> = {}): Task {
  return {
    id: 'TASK-007',
    titulo: 'Medir',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'terminada',
    plan_aprobado: true,
    rama: null,
    asignado_a: null,
    agente_revisor: null,
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-10-01',
    actualizado: '2026-10-05',
    dependencias: [],
    ...o,
  } as Task;
}

function cuerpoCon(filas: readonly [string, string][]): string {
  return (
    '## Objetivo\n\nAlgo.\n\n## Transiciones\n\n| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n' +
    filas.map(([fecha, fase]) => `| ${fecha} | ${fase} | manual | persona |`).join('\n') +
    '\n'
  );
}

function entrada(o: Partial<EntradaMetricas> = {}): EntradaMetricas {
  return { task: tarea(), body: '## Objetivo\n\nAlgo.\n', ronda: 0, eventosGit: [], ...o };
}

const CICLO_CON_HORA: [string, string][] = [
  ['2026-10-05T10:00:00Z', 'plan'],
  ['2026-10-05T10:30:00Z', 'approve'],
  ['2026-10-05T10:45:00Z', 'start'],
  ['2026-10-05T12:50:00Z', 'review'],
  ['2026-10-06T13:00:00Z', 'finish'],
];

test('registro con hora: diseno plan->start, curso start->review, revision review->finish', () => {
  const f = calcularFila(entrada({ body: cuerpoCon(CICLO_CON_HORA), ronda: 2 }));
  assert.equal(f.origen, 'registro');
  assert.deepEqual(f.diseno, { valor: 45 * 60_000, precision: 'segundo' });
  assert.deepEqual(f.curso, { valor: 125 * 60_000, precision: 'segundo' });
  assert.deepEqual(f.revision, { valor: (24 * 60 + 10) * 60_000, precision: 'segundo' });
  assert.equal(f.rondas, 2);
  assert.equal(f.cierre, '2026-10-06');
  const fila = COLUMNAS_METRICAS.map((c) => c.valor(f));
  assert.deepEqual(fila, ['TASK-007', 'simple', '45m', '2h 05m', '1d 00h', '2', '2026-10-06', 'registro']);
});

test('precision de dia: filas viejas dan dias enteros, y una sola marca de dia basta para pasar a dias', () => {
  const viejas = calcularFila(
    entrada({
      body: cuerpoCon([
        ['2026-10-01', 'plan'],
        ['2026-10-03', 'start'],
        ['2026-10-03', 'review'],
        ['2026-10-04', 'finish'],
      ]),
    })
  );
  assert.equal(formatearDuracion(viejas.diseno), '2 d');
  assert.equal(formatearDuracion(viejas.curso), '0 d');
  assert.equal(formatearDuracion(viejas.revision), '1 d');
  // Mezcla: plan de dia (medianoche implicita) y start a las 23:10 del mismo
  // dia. En horas daria 23h 10m, que parece preciso y no lo es: van dias.
  const mezcla = calcularFila(entrada({ body: cuerpoCon([['2026-10-04', 'plan'], ['2026-10-04T23:10:00Z', 'start']]) }));
  assert.deepEqual(mezcla.diseno, { valor: 0, precision: 'dia' });
});

test('plan repetido: diseno mide desde el PRIMER plan; varias reviews: curso hasta la primera', () => {
  const f = calcularFila(
    entrada({
      body: cuerpoCon([
        ['2026-10-05T10:00:00Z', 'plan'],
        ['2026-10-05T11:00:00Z', 'plan'],
        ['2026-10-05T12:00:00Z', 'start'],
        ['2026-10-05T13:00:00Z', 'review'],
        ['2026-10-05T15:00:00Z', 'review'],
        ['2026-10-05T16:00:00Z', 'finish'],
      ]),
      ronda: 2,
    })
  );
  assert.equal(formatearDuracion(f.diseno), '2h 00m');
  assert.equal(formatearDuracion(f.curso), '1h 00m');
  assert.equal(formatearDuracion(f.revision), '3h 00m');
});

// MENOR-1 de la revision: dos pares review/finish (tarea reabierta). La
// revision mide hasta el ULTIMO finish y el cierre es su dia. Mutacion
// comprobada: tomar finishes[0] pone rojo este test.
test('dos pares review/finish: revision llega al ULTIMO finish y el cierre es el suyo', () => {
  const f = calcularFila(
    entrada({
      body: cuerpoCon([
        ['2026-10-05T10:00:00Z', 'plan'],
        ['2026-10-05T11:00:00Z', 'start'],
        ['2026-10-05T12:00:00Z', 'review'],
        ['2026-10-05T13:00:00Z', 'finish'],
        ['2026-10-06T09:00:00Z', 'review'],
        ['2026-10-07T12:30:00Z', 'finish'],
      ]),
      ronda: 2,
    })
  );
  assert.equal(formatearDuracion(f.revision), '2d 00h');
  assert.deepEqual(f.revision, { valor: (48 * 60 + 30) * 60_000, precision: 'segundo' });
  assert.equal(f.cierre, '2026-10-07');
});

test('pausa se cuenta pero no se descuenta: la duracion es de calendario', () => {
  const f = calcularFila(
    entrada({
      body: cuerpoCon([
        ['2026-10-05T10:00:00Z', 'plan'],
        ['2026-10-05T10:05:00Z', 'pausa'],
        ['2026-10-05T18:00:00Z', 'start'],
      ]),
    })
  );
  assert.equal(f.pausas, 1);
  assert.equal(formatearDuracion(f.diseno), '8h 00m');
});

test('sin finish ni review: las columnas que faltan salen "—", nunca 0 ni NaN', () => {
  const f = calcularFila(entrada({ body: cuerpoCon([['2026-10-05T10:00:00Z', 'plan']]) }));
  assert.equal(f.origen, 'registro');
  assert.equal(f.diseno, null);
  assert.equal(f.cierre, null);
  assert.equal(f.rondas, null, 'sin informes no es "0 rondas"');
  const texto = formatearTabla([f], [...COLUMNAS_METRICAS, ...COLUMNAS_HEURISTICA]);
  assert.doesNotMatch(texto, /NaN|undefined|null/);
  assert.match(texto, /\| — +\| — +\| — +\| — +\| — +\| registro/);
});

test('un fin anterior al inicio (registro editado a mano) da "—", no un negativo', () => {
  assert.equal(
    duracionEntre({ ms: Date.UTC(2026, 9, 5, 12), precision: 'segundo' }, { ms: Date.UTC(2026, 9, 5, 11), precision: 'segundo' }),
    null
  );
  assert.equal(duracionEntre({ ms: Date.UTC(2026, 9, 5), precision: 'dia' }, { ms: Date.UTC(2026, 9, 4), precision: 'dia' }), null);
  assert.equal(duracionEntre(null, { ms: 0, precision: 'dia' }), null);
});

test('parsearLogGit reconoce SOLO los asuntos automaticos de cada fase', () => {
  const s = (iso: string): number => Date.parse(iso) / 1000;
  const salida = [
    `${s('2026-10-05T10:00:05Z')}\tchore(TASK-007): tarea terminada y artefactos de cierre`,
    `${s('2026-10-05T09:00:00Z')}\tchore(TASK-007): peticion de revision ronda 2`,
    `${s('2026-10-05T08:00:00Z')}\tchore(TASK-007): peticion de revision ronda 1`,
    `${s('2026-10-05T07:00:00Z')}\tchore(TASK-007): pausa registrada`,
    `${s('2026-10-05T06:00:00Z')}\tchore(TASK-007): tarea en curso`,
    `${s('2026-10-05T05:00:00Z')}\tchore(TASK-007): plan aprobado`,
    `${s('2026-10-05T04:00:00Z')}\tchore(TASK-007): tarea en diseno`,
    `${s('2026-10-05T03:00:00Z')}\tchore(TASK-007): tarea creada`,
    `${s('2026-10-05T03:00:00Z')}\tchore(TASK-007): veredicto ronda 1 (aprobada)`,
    `${s('2026-10-05T03:00:00Z')}\tfeat(TASK-007): tarea en curso`,
    `${s('2026-10-05T03:00:00Z')}\tmerge(feature): x -> develop`,
    'basura sin tabulador',
    `no-numero\tchore(TASK-007): tarea en curso`,
    '',
  ].join('\n');
  const eventos = parsearLogGit(salida);
  assert.deepEqual(
    eventos.map((e) => e.fase),
    ['finish', 'review', 'review', 'pausa', 'start', 'approve', 'plan']
  );
  assert.ok(eventos.every((e) => e.id === 'TASK-007'));
  assert.equal(eventos[0]?.ms, Date.parse('2026-10-05T10:00:05Z'));
});

test('origen git: sin registro se usan los commits; con registro, el registro gana', () => {
  const ev = (fase: EventoGit['fase'], iso: string): EventoGit => ({ id: 'TASK-007', fase, ms: Date.parse(iso) });
  const git = [
    ev('finish', '2026-10-05T12:00:00Z'),
    ev('review', '2026-10-05T11:00:00Z'),
    ev('start', '2026-10-05T10:20:00Z'),
    ev('plan', '2026-10-05T10:00:00Z'),
  ];
  const f = calcularFila(entrada({ eventosGit: git, ronda: 1 }));
  assert.equal(f.origen, 'git');
  assert.equal(formatearDuracion(f.diseno), '20m');
  assert.equal(formatearDuracion(f.curso), '40m');
  assert.equal(formatearDuracion(f.revision), '1h 00m');
  assert.equal(f.cierre, '2026-10-05');

  const conRegistro = calcularFila(entrada({ eventosGit: git, body: cuerpoCon([['2026-10-01', 'plan']]) }));
  assert.equal(conRegistro.origen, 'registro');
  assert.equal(conRegistro.diseno, null, 'no se mezclan las dos fuentes en una fila');
});

test('sin registro ni git: origen "—" y todo "—"', () => {
  const f = calcularFila(entrada({ ronda: 3 }));
  assert.equal(f.origen, '—');
  assert.deepEqual(
    COLUMNAS_METRICAS.map((c) => c.valor(f)),
    ['TASK-007', 'simple', '—', '—', '—', '3', '—', '—']
  );
  assert.equal(COLUMNAS_METRICAS.find((c) => c.cabecera === 'complejidad')?.valor(calcularFila(entrada({ task: tarea({ complejidad: null }) }))), '—');
});

test('formatearDuracion: segundos, minutos, horas y dias', () => {
  const seg = (s: number) => ({ valor: s * 1000, precision: 'segundo' as const });
  assert.equal(formatearDuracion(seg(0)), '0s');
  assert.equal(formatearDuracion(seg(40)), '40s');
  assert.equal(formatearDuracion(seg(7 * 60 + 59)), '7m');
  assert.equal(formatearDuracion(seg(3600 + 5 * 60)), '1h 05m');
  assert.equal(formatearDuracion(seg(86_400 * 3 + 3600 * 4)), '3d 04h');
  assert.equal(formatearDuracion({ valor: 12, precision: 'dia' }), '12 d');
  assert.equal(formatearDuracion(null), '—');
});

test('la muestra de la heuristica: terminadas con informes; sin revision/ no es 0 rondas', () => {
  const base = calcularFila(entrada({ ronda: 2 }));
  const sinInformes = calcularFila(entrada({ ronda: 0 }));
  const enCurso = calcularFila(entrada({ ronda: 1, task: tarea({ estado: 'en-curso' }) }));
  assert.equal(enMuestraHeuristica(base), true);
  assert.equal(enMuestraHeuristica(sinInformes), false);
  assert.equal(enMuestraHeuristica(enCurso), false);
});

test('resumirPorNivel: n y rondas medias por nivel, en el orden del enum, con "—" al final', () => {
  const f = (complejidad: Task['complejidad'], ronda: number): FilaMetricas =>
    calcularFila(entrada({ task: tarea({ complejidad }), ronda }));
  const grupos = resumirPorNivel([f('media', 3), f('simple', 1), f('media', 1), f(null, 2)], (x) => x.complejidad, TASK_COMPLEXITIES);
  assert.deepEqual(grupos, [
    { nivel: 'simple', n: 1, rondasMedia: 1 },
    { nivel: 'media', n: 2, rondasMedia: 2 },
    { nivel: '—', n: 1, rondasMedia: 2 },
  ]);
});

test('formatearTabla: cabecera, separador y columnas alineadas', () => {
  const f = calcularFila(entrada({ body: cuerpoCon(CICLO_CON_HORA), ronda: 1 }));
  const lineas = formatearTabla([f], COLUMNAS_METRICAS).split('\n');
  assert.equal(lineas.length, 3);
  assert.match(lineas[0] as string, /^\| id +\| complejidad \| diseno \| curso +\| revision \| rondas \| cierre +\| origen +\|$/);
  assert.match(lineas[1] as string, /^\|-+\|-+\|/);
  assert.equal(new Set(lineas.map((l) => l.length)).size, 1, 'todas las lineas miden lo mismo');
});
