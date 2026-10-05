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

test('comprobarSkillInstalado nunca lanza y siempre devuelve un estado valido', () => {
  const ESTADOS_VALIDOS: readonly EstadoInstalacionSkill[] = ['instalado', 'no-instalado', 'no-verificable'];
  const estado = comprobarSkillInstalado('plugin-inventado@marketplace-inventado-para-el-test');
  assert.ok(ESTADOS_VALIDOS.includes(estado), `estado inesperado: ${String(estado)}`);
});
