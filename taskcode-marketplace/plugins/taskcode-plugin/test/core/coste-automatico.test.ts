/**
 * TASK-085: lo puro del coste de implementacion automatico. Ventanas en curso
 * sacadas de `## Transiciones`, el filtro de lineas por hora, rama y cwd, y
 * las filas del volcado sin duplicar lo ya anotado.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { filasDeVolcado, filtroDeTarea, ventanasEnCurso, type FuenteMedida } from '../../src/core/coste-automatico.js';
import { anadirCoste, idsDeFuente, resumirCostes, leerCostes, type FilaCoste } from '../../src/core/coste-registro.js';
import { sumarUsoTranscripcion, type UsoTranscripcion } from '../../src/core/coste-transcripcion.js';

const ms = (iso: string): number => Date.parse(iso);

function transiciones(...filas: [string, string][]): string {
  return [
    '## Objetivo',
    'x',
    '',
    '## Transiciones',
    '',
    '| fecha | fase | modo | decidido_por |',
    '|---|---|---|---|',
    ...filas.map(([f, fase]) => `| ${f} | ${fase} | automatico | persona |`),
    '',
  ].join('\n');
}

test('ventanas: de cada start a la siguiente review, y la ultima abierta hasta el volcado', () => {
  const body = transiciones(
    ['2026-11-01T09:00:00Z', 'plan'],
    ['2026-11-01T09:30:00Z', 'approve'],
    ['2026-11-01T10:00:00Z', 'start'],
    ['2026-11-01T12:00:00Z', 'review']
  );
  assert.deepEqual(ventanasEnCurso(body, ms('2026-11-02T00:00:00Z')), [
    { desde: ms('2026-11-01T10:00:00Z'), hasta: ms('2026-11-01T12:00:00Z') },
  ]);
  const abierta = transiciones(['2026-11-01T10:00:00Z', 'start']);
  assert.deepEqual(ventanasEnCurso(abierta, ms('2026-11-01T11:00:00Z')), [
    { desde: ms('2026-11-01T10:00:00Z'), hasta: ms('2026-11-01T11:00:00Z') },
  ]);
});

test('ventanas: una fila con solo el dia no abre ventana, y sin start no hay ninguna', () => {
  assert.deepEqual(ventanasEnCurso(transiciones(['2026-11-01', 'start']), ms('2026-11-02T00:00:00Z')), []);
  assert.deepEqual(ventanasEnCurso(transiciones(['2026-11-01T09:00:00Z', 'plan']), ms('2026-11-02T00:00:00Z')), []);
  assert.deepEqual(ventanasEnCurso('## Objetivo\nsin registro\n', Date.now()), []);
});

test('filtro: cuenta solo lo de la ventana, de la rama de la tarea y dentro del repo', () => {
  const raiz = path.join(tmpdir(), 'repo-coste');
  const f = filtroDeTarea([{ desde: ms('2026-11-01T10:00:00Z'), hasta: ms('2026-11-01T12:00:00Z') }], 'feature/x', raiz);
  const base = { timestamp: '2026-11-01T10:30:00.000Z', gitBranch: 'feature/x', cwd: path.join(raiz, 'src') };
  assert.equal(f(base), true);
  assert.equal(f({ ...base, timestamp: '2026-11-01T09:59:59.999Z' }), false, 'antes del start (el diseno)');
  assert.equal(f({ ...base, timestamp: '2026-11-01T12:00:00.000Z' }), false, 'desde la review, ya no');
  assert.equal(f({ ...base, gitBranch: 'feature/otra' }), false, 'otra tarea de la misma sesion');
  assert.equal(f({ ...base, cwd: path.join(tmpdir(), 'otro-repo') }), false, 'otro repo');
  assert.equal(f({ timestamp: base.timestamp }), true, 'sin rama ni cwd: decide la hora');
  assert.equal(f({ gitBranch: 'feature/x' }), false, 'sin hora no se puede atribuir');
});

test('sumarUsoTranscripcion con filtro: ignora las lineas que no cuentan; sin ninguna, null', () => {
  const linea = (id: string, ts: string, salida: number): string =>
    JSON.stringify({ type: 'assistant', timestamp: ts, message: { id, usage: { input_tokens: 1, output_tokens: salida } } });
  const texto = [linea('a', '2026-11-01T09:00:00Z', 100), linea('b', '2026-11-01T10:30:00Z', 5)].join('\n');
  const enVentana = (l: Readonly<Record<string, unknown>>): boolean => l['timestamp'] === '2026-11-01T10:30:00Z';
  assert.equal(sumarUsoTranscripcion(texto, enVentana)?.tokens, 6);
  assert.equal(sumarUsoTranscripcion(texto)?.tokens, 107, 'sin filtro, como siempre');
  assert.equal(sumarUsoTranscripcion(texto, () => false), null);
});

test('idsDeFuente: las fuentes sesion: se leen como las de agente, con diferencia', () => {
  assert.deepEqual(idsDeFuente('sesion:abc-123'), [{ id: 'abc-123', diferencia: false }]);
  assert.deepEqual(idsDeFuente('sesion:dif:abc-123'), [{ id: 'abc-123', diferencia: true }]);
  assert.deepEqual(idsDeFuente('manual'), [{ id: 'manual', diferencia: false }]);
});

function uso(tokens: number): UsoTranscripcion {
  // tokens = entrada + cacheEscritura + cacheLectura + salida
  return { tokens, llamadas: 1, entrada: tokens - 3, cacheEscritura: 1, cacheLectura: 1, salida: 1, lecturas: 2 };
}

function fila(fase: FilaCoste['fase'], fuente: string, u: UsoTranscripcion | null, total: number): FilaCoste {
  return {
    fecha: '2026-11-01T11:00:00Z',
    fase,
    fuente,
    entrada: u?.entrada ?? null,
    cacheEscritura: u?.cacheEscritura ?? null,
    cacheLectura: u?.cacheLectura ?? null,
    salida: u?.salida ?? null,
    lecturas: u?.lecturas ?? null,
    total,
    ronda: null,
    revisor: null,
  };
}

test('volcado: una fila por fuente nueva, de implementacion, con su desglose', () => {
  const medidas: FuenteMedida[] = [
    { tipo: 'sesion', id: 's-1', uso: uso(1000) },
    { tipo: 'agente', id: 'abc123', uso: uso(500) },
  ];
  const v = filasDeVolcado('## Objetivo\nx\n', medidas, '2026-11-01T12:00:00Z');
  assert.equal(v.total, 1500);
  assert.deepEqual(
    v.filas.map((f) => [f.fase, f.fuente, f.total, f.entrada, f.lecturas]),
    [
      ['implementacion', 'sesion:s-1', 1000, 997, 2],
      ['implementacion', 'agente:abc123', 500, 497, 2],
    ]
  );
});

test('volcado: no duplica. Lo ya anotado igual no suma; lo que crecio, solo la diferencia', () => {
  let body = '## Objetivo\nx\n';
  body = anadirCoste(body, fila('implementacion', 'sesion:s-1', uso(1000), 1000));
  body = anadirCoste(body, fila('implementacion', 'agente:abc123', uso(500), 500));
  const v = filasDeVolcado(
    body,
    [
      { tipo: 'sesion', id: 's-1', uso: uso(1000) },
      { tipo: 'agente', id: 'abc123', uso: uso(800) },
    ],
    '2026-11-01T12:00:00Z'
  );
  assert.deepEqual(
    v.filas.map((f) => [f.fuente, f.total, f.entrada]),
    [['agente:dif:abc123', 300, 300]]
  );
  // Y la tabla resultante no avisa de repetidas: la diferencia no es una repeticion.
  const final = v.filas.reduce((acc, f) => anadirCoste(acc, f), body);
  const resumen = resumirCostes(leerCostes(final), { diseno: null, implementacion: 1800, revision: null });
  assert.deepEqual(resumen.repetidas, []);
  assert.equal(resumen.fases.implementacion.sinDesglose, 0);
});

test('volcado: un agente anotado en otra fase, o junto a otros, no se toca', () => {
  let body = '## Objetivo\nx\n';
  body = anadirCoste(body, fila('revision', 'agente:abc123', uso(500), 500));
  body = anadirCoste(body, fila('implementacion', 'agente:def456,fed654', uso(900), 900));
  body = anadirCoste(body, fila('implementacion', 'manual', null, 50));
  const v = filasDeVolcado(
    body,
    [
      { tipo: 'agente', id: 'abc123', uso: uso(700) },
      { tipo: 'agente', id: 'def456', uso: uso(700) },
    ],
    '2026-11-01T12:00:00Z'
  );
  assert.deepEqual(v.filas, []);
  assert.equal(v.total, 0);
  assert.equal(v.omitidas.length, 2);
});

test('volcado: una transcripcion que encoge (otra o recortada) no resta ni suma', () => {
  const body = anadirCoste('## Objetivo\nx\n', fila('implementacion', 'sesion:s-1', uso(1000), 1000));
  const v = filasDeVolcado(body, [{ tipo: 'sesion', id: 's-1', uso: uso(400) }], '2026-11-01T12:00:00Z');
  assert.deepEqual(v.filas, []);
});
