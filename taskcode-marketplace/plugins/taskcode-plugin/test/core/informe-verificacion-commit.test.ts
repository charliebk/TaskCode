/**
 * TASK-112: la seccion «Verificacion de esta ronda» dice con que commit y
 * huella se verifico, y solo en verde le dice al revisor que no la repita.
 * Logica pura, sin disco.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NO_REPITAS,
  seccionVerificacionRevision,
  type ResultadoVerificacion,
} from '../../src/core/informe-verificacion.js';

const resultado = (estado: ResultadoVerificacion['estado']): ResultadoVerificacion => ({
  estado,
  comando: 'npm test',
  codigo: estado === 'verde' ? 0 : 1,
  duracionMs: 1200,
  timeoutS: 600,
  cola: 'salida\n',
  bytesTotales: 7,
});

const base = { tipo: 'selectiva' as const, base: 'develop', deMemo: false, conCobertura: false };

test('verificacion de ronda (TASK-112): en verde, commit, huella y la regla de no repetir', () => {
  const s = seccionVerificacionRevision({ ...base, resultado: resultado('verde'), commit: 'abc123', huella: 'f00d' });
  assert.match(s, /^- Commit verificado: abc123$/m);
  assert.match(s, /^- Huella: f00d$/m);
  assert.ok(s.includes(NO_REPITAS));
});

test('verificacion de ronda (TASK-112, MEN-2): en rojo o cortada dice el commit pero no que no se repita', () => {
  for (const estado of ['roja', 'cortada', 'no-lanzable'] as const) {
    const s = seccionVerificacionRevision({ ...base, resultado: resultado(estado), commit: 'abc123', huella: 'f00d' });
    assert.match(s, /^- Commit verificado: abc123$/m, estado);
    assert.ok(!s.includes(NO_REPITAS), `${estado}: un resultado que no es verde no se reutiliza`);
  }
});

test('verificacion de ronda (TASK-112, MEN-2): sin commit (fuera de un repo) ni linea de commit ni regla', () => {
  const conNull = seccionVerificacionRevision({ ...base, resultado: resultado('verde'), commit: null, huella: null });
  const sinClave = seccionVerificacionRevision({ ...base, resultado: resultado('verde') });
  for (const s of [conNull, sinClave]) {
    assert.doesNotMatch(s, /Commit verificado|Huella:/);
    assert.ok(!s.includes(NO_REPITAS));
  }
});
