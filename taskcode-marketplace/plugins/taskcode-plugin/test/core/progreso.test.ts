/**
 * TASK-110: el formato de la linea de estado es una interfaz publica (la
 * status line de la persona la muestra tal cual). Este fichero es su unica
 * fuente de verdad: si cambia el separador o los minutos, se pone rojo aqui.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  etiquetaFase,
  formatearEstado,
  limpiarTexto,
  minutosDesde,
  parsearContador,
  validarProgreso,
  MAX_LINEA,
  VERSION_PROGRESO,
  type EstadoProgreso,
} from '../../src/core/progreso.js';

const T0 = Date.UTC(2026, 10, 12, 10, 0, 0);

function estado(extra: Partial<EstadoProgreso> = {}): EstadoProgreso {
  return {
    version: VERSION_PROGRESO,
    tarea: 'TASK-110',
    fase: 'review',
    pasos: ['guardas', 'integracion', 'verificacion', 'peticiones', 'commit'],
    paso: 'verificacion',
    ronda: 2,
    inicio: T0,
    contador: true,
    terminado: false,
    resultado: null,
    fin: null,
    ...extra,
  };
}

test('progreso: la linea dice fase en el ciclo, ronda, paso en la fase, x/N y minutos', () => {
  assert.equal(
    formatearEstado(estado(), T0 + 12 * 60_000 + 59_000, { x: 7, n: 22 }),
    'TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min'
  );
  // Sin contador, sin ronda: el paso con su posicion.
  assert.equal(
    formatearEstado(
      estado({ fase: 'finish', ronda: null, contador: false, paso: 'merge', pasos: ['puertas', 'verificacion', 'cobertura', 'held-out', 'merge', 'artefactos'] }),
      T0 + 125_000,
      { x: 1, n: 2 }
    ),
    'TASK-110 · finish (5/5) · merge (5/6) · 2 min'
  );
  // Antes del primer paso, y fuera del ciclo (el freno).
  assert.equal(formatearEstado(estado({ paso: null, ronda: null }), T0, null), 'TASK-110 · review (4/5) · 0 min');
  assert.equal(
    formatearEstado(estado({ fase: 'freno', pasos: ['verificacion'], ronda: null }), T0 + 60_000, { x: 3, n: 10 }),
    'TASK-110 · freno · verificacion (1/1) 3/10 · 1 min'
  );
});

test('progreso: terminada o abortada dice que no hay nada en marcha, con la ultima fase', () => {
  assert.equal(
    formatearEstado(estado({ terminado: true, resultado: 'ok', fin: T0 + 60_000 }), T0 + 4 * 60_000, null),
    'Nada en marcha · ultima: TASK-110 · review (4/5) · terminada hace 3 min'
  );
  assert.equal(
    formatearEstado(estado({ terminado: true, resultado: 'abortada', fin: T0 }), T0 + 30_000, { x: 1, n: 2 }),
    'Nada en marcha · ultima: TASK-110 · review (4/5) · abortada hace 0 min'
  );
  // El freno que termino con la verificacion en rojo no se interrumpio: dice "en rojo", no "abortada".
  assert.equal(
    formatearEstado(estado({ fase: 'freno', pasos: ['verificacion'], ronda: null, terminado: true, resultado: 'en-rojo', fin: T0 }), T0 + 120_000, null),
    'Nada en marcha · ultima: TASK-110 · freno · en rojo hace 2 min'
  );
});

test('progreso: el resultado "en-rojo" se lee; un fichero viejo con ok o abortada sigue igual', () => {
  const base = { version: 1, tarea: 'TASK-1', fase: 'freno', inicio: 5, terminado: true, fin: 6 };
  assert.equal(validarProgreso({ ...base, resultado: 'en-rojo' })?.resultado, 'en-rojo');
  assert.equal(validarProgreso({ ...base, resultado: 'abortada' })?.resultado, 'abortada');
  assert.equal(validarProgreso({ ...base, resultado: 'ok' })?.resultado, 'ok');
});

test('progreso: minutos enteros hacia abajo y nunca negativos', () => {
  assert.equal(minutosDesde(T0, T0 + 125_000), 2);
  assert.equal(minutosDesde(T0, T0 + 59_999), 0);
  assert.equal(minutosDesde(T0, T0 - 5_000), 0, 'un reloj que retrocede');
  assert.equal(etiquetaFase('plan'), 'plan (1/5)');
  assert.equal(etiquetaFase('otra'), 'otra');
});

test('progreso: validar exige version, tarea, fase e inicio; lo demas se tolera', () => {
  assert.equal(validarProgreso(null), null);
  assert.equal(validarProgreso([]), null);
  assert.equal(validarProgreso({ version: 2, tarea: 'T', fase: 'f', inicio: 1 }), null);
  assert.equal(validarProgreso({ version: 1, fase: 'f', inicio: 1 }), null);
  assert.equal(validarProgreso({ version: 1, tarea: 'T', inicio: 1 }), null);
  assert.equal(validarProgreso({ version: 1, tarea: 'T', fase: 'f', inicio: 'ayer' }), null);
  const v = validarProgreso({ version: 1, tarea: 'TASK-1', fase: 'plan', inicio: 5, pasos: ['a', 3, null, 'b'], ronda: -1, resultado: 'raro' });
  assert.deepEqual(v, {
    version: 1,
    tarea: 'TASK-1',
    fase: 'plan',
    pasos: ['a', 'b'],
    paso: null,
    ronda: null,
    inicio: 5,
    contador: false,
    terminado: false,
    resultado: null,
    fin: null,
  });
});

test('progreso: nada ajeno llega a la barra (ANSI, control, saltos de linea) y todo va recortado', () => {
  assert.equal(limpiarTexto('\u001b[31mrojo\u001b[0m\r\nmal\u0007'), 'rojo mal');
  assert.equal(limpiarTexto('\u001b]0;titulo\u0007paso'), 'paso');
  assert.equal(limpiarTexto('a\u202eb'), 'a b', 'una marca de direccion no reordena la barra');
  assert.equal(limpiarTexto(''), null);
  assert.equal(limpiarTexto(42), null);
  assert.equal(limpiarTexto('x'.repeat(100))?.length, 40);
  const v = validarProgreso({ version: 1, tarea: 'TASK-1\u001b[2J', fase: 'review', inicio: T0, paso: 'ver\rificacion\n', pasos: ['ver ificacion'] });
  assert.ok(v !== null);
  const linea = formatearEstado(v, T0, null);
  assert.equal(linea, 'TASK-1 · review (4/5) · ver ificacion (1/1) · 0 min');
  const larga = formatearEstado(estado({ tarea: 'T'.repeat(20), paso: 'p'.repeat(40), pasos: [] }), T0 + 9_999 * 60_000, { x: 999_999_999, n: 999_999_999 });
  assert.ok(Array.from(larga).length <= MAX_LINEA);
});

test('progreso: el contador solo da numeros, del ultimo x/N de la ultima linea con texto', () => {
  assert.deepEqual(parsearContador('3/10'), { x: 3, n: 10 });
  assert.deepEqual(parsearContador('1/10\n2/10\n\n'), { x: 2, n: 10 });
  assert.deepEqual(parsearContador('\u001b[32m[ 5 / 9 ]\u001b[0m'), { x: 5, n: 9 });
  assert.deepEqual(parsearContador('{"x":1}\nsuite 4/8 ok, 12/40 total'), { x: 12, n: 40 });
  assert.deepEqual(parsearContador('a\r7/8'), { x: 7, n: 8 });
  assert.equal(parsearContador(''), null);
  assert.equal(parsearContador('sin numeros'), null);
  assert.equal(parsearContador('3/0'), null);
  assert.equal(parsearContador('{"x": 3, "n": 10'), null, 'JSON a medias: nada');
});
