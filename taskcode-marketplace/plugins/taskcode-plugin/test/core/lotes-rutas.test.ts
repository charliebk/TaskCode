/**
 * TASK-135: `lotesDeRutas` parte la lista de rutas que se pasa a Git como
 * pathspec, por numero de rutas y por caracteres acumulados. Logica pura,
 * sin Git: aqui se ve el corte por caracteres tambien en Linux, donde el
 * limite de la linea de comandos (~2 MB) no deja ver el ENAMETOOLONG.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lotesDeRutas, LOTE_RUTAS_STAT, LOTE_CARACTERES_PATHSPEC } from '../../src/fs/git.js';

const PREFIJO = ':(literal)'.length;

function caracteresDe(lote: readonly string[]): number {
  return lote.reduce((n, r) => n + PREFIJO + r.length + 1, 0);
}

test('lotesDeRutas (TASK-135): rutas cortas cortan por numero, sin perder ni reordenar ninguna', () => {
  const rutas = Array.from({ length: LOTE_RUTAS_STAT * 2 + 3 }, (_, i) => `src/f${i}.ts`);
  const lotes = lotesDeRutas(rutas);
  assert.deepEqual(
    lotes.map((l) => l.length),
    [LOTE_RUTAS_STAT, LOTE_RUTAS_STAT, 3]
  );
  assert.deepEqual(lotes.flat(), rutas);
});

test('lotesDeRutas (TASK-135, MENOR de TASK-113): rutas de 300 caracteres cortan por caracteres antes de llegar a 100', () => {
  const largo = (i: number): string => `src/${String(i).padStart(4, '0')}/${'x'.repeat(291)}`;
  const rutas = Array.from({ length: 1300 }, (_, i) => largo(i));
  assert.equal(rutas[0]?.length, 300);
  const lotes = lotesDeRutas(rutas);
  assert.deepEqual(lotes.flat(), rutas, 'concatenar los lotes devuelve la lista original');
  for (const lote of lotes) {
    assert.ok(lote.length < LOTE_RUTAS_STAT, `un lote de ${lote.length} rutas largas: no corto por caracteres`);
    assert.ok(caracteresDe(lote) <= LOTE_CARACTERES_PATHSPEC, `lote de ${caracteresDe(lote)} caracteres`);
  }
  // Cada lote esta lleno: con una ruta mas pasaria del tope.
  const coste = PREFIJO + 300 + 1;
  for (const lote of lotes.slice(0, -1)) assert.ok(caracteresDe(lote) + coste > LOTE_CARACTERES_PATHSPEC);
});

test('lotesDeRutas (TASK-135): una ruta mas larga que el tope va sola; lista vacia, ningun lote', () => {
  const enorme = 'a/'.repeat(30) + 'b'.repeat(200);
  assert.deepEqual(lotesDeRutas(['x.ts', enorme, 'y.ts'], 100, 50), [['x.ts'], [enorme], ['y.ts']]);
  assert.deepEqual(lotesDeRutas([]), []);
});
