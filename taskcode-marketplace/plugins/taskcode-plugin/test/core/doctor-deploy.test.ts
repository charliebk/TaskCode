/**
 * TASK-066 (MEN-6): el nucleo puro de doctor-deploy. `sanearPunto` es la red
 * del invariante «ningun OK sin evidencia»: hoy ninguna sonda devuelve un OK
 * vacio, asi que solo un test directo la mantiene viva.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codigoSalida, resumir, sanearPunto, type ResultadoPunto } from '../../src/core/doctor-deploy.js';

function punto(parcial: Partial<ResultadoPunto>): ResultadoPunto {
  return {
    id: 'p',
    severidad: 'alta',
    metodo: 'determinista',
    arreglo: 'arreglalo',
    descripcion: 'descripcion',
    referencia: null,
    desactivado: false,
    estado: 'ok',
    motivo: 'todo bien',
    evidencias: [],
    ...parcial,
  };
}

test('sanearPunto: un OK sin evidencia se degrada a NO VERIFICADO y lo dice', () => {
  const r = sanearPunto(punto({ estado: 'ok', evidencias: [] }));
  assert.equal(r.estado, 'no-verificado');
  assert.match(r.motivo, /no aporto evidencia/);
  assert.match(r.motivo, /todo bien/);
});

test('sanearPunto: un OK con evidencia, y los demas estados, quedan como estan', () => {
  const ok = punto({ estado: 'ok', evidencias: [{ descripcion: 'visto' }] });
  assert.deepEqual(sanearPunto(ok), ok);
  for (const estado of ['falla', 'no-verificado', 'no-aplica'] as const) {
    const p = punto({ estado });
    assert.deepEqual(sanearPunto(p), p);
  }
});

test('codigoSalida: 1 solo con alguna FALLA; resumir cuenta cada estado', () => {
  const ps = [punto({ estado: 'ok', evidencias: [{ descripcion: 'x' }] }), punto({ estado: 'no-verificado' }), punto({ estado: 'no-aplica' })];
  assert.equal(codigoSalida(ps), 0);
  assert.equal(codigoSalida([...ps, punto({ estado: 'falla' })]), 1);
  assert.deepEqual(resumir([...ps, punto({ estado: 'falla' })]), { ok: 1, falla: 1, noVerificado: 1, noAplica: 1, total: 4 });
});
