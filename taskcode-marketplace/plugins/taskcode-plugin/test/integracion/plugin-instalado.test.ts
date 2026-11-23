/**
 * Test de `comprobarSkillInstalado` (TASK-017) contra el binario real.
 *
 * Vive aqui y no en `test/core/plugin-instalado.test.ts` porque lanza
 * `claude plugin list --json` de verdad: `npm run test:rapido` solo
 * recoge `core/` y `cli/`, y en esas carpetas no hay subprocesos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  comprobarSkillInstalado,
  type EstadoInstalacionSkill,
} from '../../src/core/plugin-instalado.js';

// TASK-151a (TRES-06): antes aceptaba cualquiera de los tres estados, asi que no
// probaba nada. Ahora cada caso tiene su estado esperado.
test('comprobarSkillInstalado: un plugin inventado nunca sale como instalado', () => {
  const ESPERADOS: readonly EstadoInstalacionSkill[] = ['no-instalado', 'no-verificable'];
  const estado = comprobarSkillInstalado('plugin-inventado@marketplace-inventado-para-el-test');
  assert.ok(ESPERADOS.includes(estado), `estado inesperado: ${String(estado)}`);
});

test('comprobarSkillInstalado: sin el binario claude en el PATH es no-verificable, sin lanzar', () => {
  const antes = process.env['PATH'];
  try {
    process.env['PATH'] = '';
    assert.equal(comprobarSkillInstalado('plugin-inventado@marketplace-inventado-para-el-test'), 'no-verificable');
  } finally {
    process.env['PATH'] = antes;
  }
});
