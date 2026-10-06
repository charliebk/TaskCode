/**
 * Telemetria de fases (TASK-052): el calculo puro de `taskctl metricas`.
 * Duraciones con origen registro, git y ausente; precision de dia; plan
 * repetido; varias rondas; pausa; y que nunca salga ni 0 inventado ni NaN.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BloqueTokensError,
  COLUMNAS_HEURISTICA,
  COLUMNAS_TOKENS,
  MARCADOR_FIN_TOKENS,
  MARCADOR_INICIO_TOKENS,
  formatearResumenTokens,
  renderBloqueTokens,
  resumenesTokens,
  resumirTokens,
  sustituirBloqueTokens,
  totalTokens,
  type ResumenTokensGrupo,
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
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
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

// --- Coste en tokens (TASK-023) ---------------------------------------------

/** Una fila de ejemplo con el coste dado; el resto como una tarea terminada cualquiera. */
function conCoste(
  id: string,
  sprint: number,
  complejidad: Task['complejidad'],
  d: number | null,
  i: number | null,
  r: number | null
): FilaMetricas {
  return calcularFila(
    entrada({
      task: tarea({ id, sprint, complejidad, tokens_diseno: d, tokens_implementacion: i, tokens_revision: r }),
    })
  );
}

// Datos de ejemplo a mano: las cuentas de cada celda se verifican con la
// aritmetica del propio test, no con el codigo que se prueba.
const MUESTRA_TOKENS: FilaMetricas[] = [
  conCoste('TASK-001', 1, 'simple', 100, 200, 300),
  conCoste('TASK-002', 1, 'media', 300, null, 100),
  conCoste('TASK-003', 2, 'simple', null, null, null), // sin ningun dato
  conCoste('TASK-004', 2, 'simple', 50, 150, null),
  conCoste('TASK-005', 3, null, null, null, null), // sprint entero sin datos, complejidad no declarada
];

test('tokens: totalTokens suma lo registrado, es null sin ningun dato y un 0 registrado SI es dato', () => {
  assert.equal(totalTokens({ diseno: 100, implementacion: 200, revision: 300 }), 600);
  assert.equal(totalTokens({ diseno: 300, implementacion: null, revision: 100 }), 400);
  assert.equal(totalTokens({ diseno: null, implementacion: null, revision: null }), null);
  assert.equal(totalTokens({ diseno: 0, implementacion: null, revision: null }), 0);
});

test('tokens: calcularFila copia sprint y las tres fases de la tarea', () => {
  const f = MUESTRA_TOKENS[1] as FilaMetricas;
  assert.equal(f.sprint, 1);
  assert.deepEqual(f.tokens, { diseno: 300, implementacion: null, revision: 100 });
});

test('tokens: columnas de la tabla, «—» para null y curso = implementacion', () => {
  const celdas = (f: FilaMetricas): string[] => COLUMNAS_TOKENS.map((c) => c.valor(f));
  assert.deepEqual(COLUMNAS_TOKENS.map((c) => c.cabecera), ['tok_diseno', 'tok_curso', 'tok_revision', 'tok_total']);
  assert.deepEqual(celdas(MUESTRA_TOKENS[0] as FilaMetricas), ['100', '200', '300', '600']);
  assert.deepEqual(celdas(MUESTRA_TOKENS[1] as FilaMetricas), ['300', '—', '100', '400']);
  assert.deepEqual(celdas(MUESTRA_TOKENS[2] as FilaMetricas), ['—', '—', '—', '—']);
});

test('tokens: la tabla incluye la tarea sin datos (no se excluye de la tabla, solo del resumen)', () => {
  const tabla = formatearTabla(MUESTRA_TOKENS, [...COLUMNAS_METRICAS, ...COLUMNAS_TOKENS]);
  const lineas = tabla.split('\n');
  assert.equal(lineas.length, 2 + MUESTRA_TOKENS.length);
  const sinDatos = lineas.find((l) => l.startsWith('| TASK-003 ')) as string;
  assert.ok(sinDatos, tabla);
  assert.match(sinDatos, /\| — +\| — +\| — +\| — +\|$/);
});

test('tokens: resumen por sprint: suma, media por fase sobre las tareas que la tienen, % y n con dato/total', () => {
  const r = resumirTokens(MUESTRA_TOKENS, (f) => String(f.sprint), ['1', '2', '3']);
  assert.deepEqual(r.map((g) => [g.grupo, g.nConDato, g.nTotal]), [['1', 2, 2], ['2', 1, 2], ['3', 0, 1]]);

  const s1 = r[0] as ResumenTokensGrupo;
  assert.deepEqual(s1.fases.diseno, { suma: 400, n: 2, media: 200, porcentaje: 40 });
  // implementacion: solo TASK-001 la tiene; la media NO divide entre 2 (null no es 0).
  assert.deepEqual(s1.fases.implementacion, { suma: 200, n: 1, media: 200, porcentaje: 20 });
  assert.deepEqual(s1.fases.revision, { suma: 400, n: 2, media: 200, porcentaje: 40 });
  assert.equal(s1.total, 1000);
  assert.equal(s1.mediaTotal, 500);

  // Sprint 2: TASK-003 no tiene dato y no entra en medias ni sumas.
  const s2 = r[1] as ResumenTokensGrupo;
  assert.deepEqual(s2.fases.diseno, { suma: 50, n: 1, media: 50, porcentaje: 25 });
  assert.deepEqual(s2.fases.implementacion, { suma: 150, n: 1, media: 150, porcentaje: 75 });
  assert.deepEqual(s2.fases.revision, { suma: 0, n: 0, media: null, porcentaje: 0 });
  assert.equal(s2.mediaTotal, 200, 'media sobre la unica tarea con dato, no sobre las 2');

  // Sprint 3: existe, y dice que no tiene datos en vez de desaparecer o dar NaN.
  const s3 = r[2] as ResumenTokensGrupo;
  assert.equal(s3.mediaTotal, null);
  assert.equal(s3.total, 0);
  assert.deepEqual(s3.fases.diseno, { suma: 0, n: 0, media: null, porcentaje: null });
});

test('tokens: resumen por complejidad declarada, con «—» para las no declaradas, en el orden del enum', () => {
  const r = resumirTokens(MUESTRA_TOKENS, (f) => f.complejidad ?? '—', [...TASK_COMPLEXITIES, '—']);
  assert.deepEqual(r.map((g) => [g.grupo, g.nConDato, g.nTotal, g.total]), [
    ['simple', 2, 3, 800], // 600 + 200; TASK-003 sin datos
    ['media', 1, 1, 400],
    ['—', 0, 1, 0],
  ]);
});

test('tokens: un total registrado de 0 no divide entre cero (sin NaN ni Infinity)', () => {
  const r = resumirTokens([conCoste('TASK-009', 1, 'simple', 0, 0, 0)], (f) => String(f.sprint));
  assert.equal(r[0]?.nConDato, 1, 'un 0 registrado es un dato');
  assert.equal(r[0]?.fases.diseno.porcentaje, null);
  const texto = formatearResumenTokens('sprint', r);
  assert.doesNotMatch(texto, /NaN|Infinity|undefined/);
});

test('tokens: el resumen formateado dice con dato/total y no cuenta las tareas sin datos', () => {
  const { porSprint, porComplejidad } = resumenesTokens(MUESTRA_TOKENS);
  const lineas = porSprint.split('\n');
  assert.match(lineas[0] as string, /^\| sprint +\| con dato\/total +\| diseno +\| curso +\| revision +\| total \(media\) +\|$/);
  assert.match(lineas[2] as string, /^\| 1 +\| 2\/2 +\| 400 \(media 200, 40\.0%\) +\| 200 \(media 200, 20\.0%\) +\| 400 \(media 200, 40\.0%\) +\| 1000 \(media 500\) +\|$/);
  assert.match(lineas[3] as string, /^\| 2 +\| 1\/2 +\| 50 \(media 50, 25\.0%\) +\| 150 \(media 150, 75\.0%\) +\| — +\| 200 \(media 200\) +\|$/);
  assert.match(lineas[4] as string, /^\| 3 +\| 0\/1 +\| — +\| — +\| — +\| — +\|$/);
  assert.match(porComplejidad, /\| simple +\| 2\/3 /);
  assert.doesNotMatch(porSprint + porComplejidad, /NaN|undefined/);
});

test('tokens: sin ninguna tarea con dato, todos los grupos salen 0/N y sin cifras', () => {
  const filas = [conCoste('TASK-001', 1, 'simple', null, null, null), conCoste('TASK-002', 1, 'simple', null, null, null)];
  const g = resumirTokens(filas, (f) => String(f.sprint));
  assert.deepEqual(g.map((x) => [x.nConDato, x.nTotal, x.mediaTotal]), [[0, 2, null]]);
});

test('bloque de tokens: determinista, con marcadores y sin ninguna fecha que ensucie los diffs', () => {
  const a = renderBloqueTokens(MUESTRA_TOKENS);
  assert.equal(renderBloqueTokens([...MUESTRA_TOKENS]), a);
  assert.ok(a.startsWith(`${MARCADOR_INICIO_TOKENS}\n`));
  assert.ok(a.endsWith(`\n${MARCADOR_FIN_TOKENS}`));
  assert.doesNotMatch(a, /\d{4}-\d{2}-\d{2}/);
  assert.match(a, /\| TASK-003 +\| 2 +\| simple +\| — +\| — +\| — +\| — +\|/);
  assert.ok(!a.includes('\r'));
});

const BLOQUE = `${MARCADOR_INICIO_TOKENS}\nuno\n${MARCADOR_FIN_TOKENS}`;

test('sustituirBloqueTokens: sin marcadores anade el bloque al final y no toca lo anterior', () => {
  const previo = '# Metricas\n\ntexto con acentos: sesion 11 — cierre\n';
  const r = sustituirBloqueTokens(previo, BLOQUE);
  assert.ok(r.startsWith(previo), 'el resto queda byte a byte');
  assert.equal(r, `${previo}\n${BLOQUE}\n`);
  // Fichero que no acaba en salto de linea: se cierra la ultima linea sin comerse nada.
  assert.equal(sustituirBloqueTokens('sin salto', BLOQUE), `sin salto\n\n${BLOQUE}\n`);
  assert.equal(sustituirBloqueTokens('', BLOQUE), `${BLOQUE}\n`);
});

test('sustituirBloqueTokens: con marcadores sustituye SOLO lo de dentro y es idempotente', () => {
  const antes = '# Metricas\n\nintro\n\n';
  const despues = '\n\n## Otra seccion\n\ncola sin salto';
  const viejo = `${MARCADOR_INICIO_TOKENS}\nVIEJO\n${MARCADOR_FIN_TOKENS}`;
  const nuevo = `${MARCADOR_INICIO_TOKENS}\nNUEVO\n${MARCADOR_FIN_TOKENS}`;
  const r = sustituirBloqueTokens(`${antes}${viejo}${despues}`, nuevo);
  assert.equal(r, `${antes}${nuevo}${despues}`);
  assert.equal(sustituirBloqueTokens(r, nuevo), r, 'segunda vez: ni un byte');
});

test('sustituirBloqueTokens: un fichero CRLF sigue siendo CRLF, bloque incluido, y lo de fuera no cambia', () => {
  const previo = '# Metricas\r\n\r\ntexto\r\n';
  const r = sustituirBloqueTokens(previo, BLOQUE);
  assert.ok(r.startsWith(previo));
  assert.ok(!/[^\r]\n/.test(r), 'ningun LF sin CR');
  const otra = BLOQUE.replace('uno', 'dos');
  const r2 = sustituirBloqueTokens(r, otra);
  assert.ok(r2.startsWith(previo) && r2.includes('dos') && !r2.includes('uno'));
  assert.ok(!/[^\r]\n/.test(r2));
  assert.equal(sustituirBloqueTokens(r2, otra), r2);
});

test('sustituirBloqueTokens: marcadores sueltos, repetidos o desordenados se rechazan sin adivinar', () => {
  const malos = [
    `a\n${MARCADOR_INICIO_TOKENS}\nb\n`,
    `a\n${MARCADOR_FIN_TOKENS}\nb\n`,
    `${MARCADOR_FIN_TOKENS}\n${MARCADOR_INICIO_TOKENS}\n`,
    `${BLOQUE}\n${BLOQUE}\n`,
  ];
  for (const m of malos) assert.throws(() => sustituirBloqueTokens(m, BLOQUE), BloqueTokensError);
});
