/**
 * Test de `comprobarSkillInstalado` (TASK-017) contra el binario real.
 *
 * Vive aqui y no en `test/core/plugin-instalado.test.ts` porque lanza
 * `claude plugin list --json` de verdad: `npm run test:rapido` solo
 * recoge `core/` y `cli/`, y en esas carpetas no hay subprocesos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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

/** Ejecuta `fn` con `valor` como unico PATH del proceso y lo restaura despues. */
function conPath<T>(valor: string, fn: () => T): T {
  const antes = process.env['PATH'];
  try {
    process.env['PATH'] = valor;
    return fn();
  } finally {
    process.env['PATH'] = antes;
  }
}

test('comprobarSkillInstalado: sin el binario claude en el PATH es no-verificable, sin lanzar', () => {
  assert.equal(
    conPath('', () => comprobarSkillInstalado('plugin-inventado@marketplace-inventado-para-el-test')),
    'no-verificable'
  );
});

// TASK-155: en Windows `claude` es un `.cmd`, y `spawnSync` sin shell no lo
// ejecuta: el resultado era siempre no-verificable. El doble imprime el JSON
// de `claude plugin list --json`; en Windows es un `claude.cmd` de verdad.
// TASK-157: `esperaS` hace que el doble tarde ese tiempo antes de contestar. El
// PATH del proceso es solo `dir`, asi que la espera usa rutas del sistema.
function conClaudeDoble<T>(json: string, fn: () => T, esperaS = 0): T {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'taskcode-claude-doble-'));
  try {
    if (process.platform === 'win32') {
      // `ping -n N` tarda unos N-1 s.
      const espera = esperaS > 0 ? `@"%SystemRoot%\\System32\\PING.EXE" -n ${esperaS + 1} 127.0.0.1 >nul\r\n` : '';
      writeFileSync(path.join(dir, 'claude.cmd'), `${espera}@echo ${json}\r\n`);
    } else {
      const script = path.join(dir, 'claude');
      const espera = esperaS > 0 ? `PATH=/usr/bin:/bin sleep ${esperaS}\n` : '';
      writeFileSync(script, `#!/bin/sh\n${espera}printf '%s\\n' '${json}'\n`);
      chmodSync(script, 0o755);
    }
    return conPath(dir, fn);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('comprobarSkillInstalado: con un claude (.cmd en Windows) en el PATH que lista el plugin, instalado', () => {
  const estado = conClaudeDoble('[{"id":"plugin-de-prueba@marketplace-de-prueba","enabled":true}]', () =>
    comprobarSkillInstalado('plugin-de-prueba@marketplace-de-prueba')
  );
  assert.equal(estado, 'instalado');
});

test('comprobarSkillInstalado: con un claude (.cmd en Windows) en el PATH que no lo lista, no-instalado', () => {
  const estado = conClaudeDoble('[{"id":"otro-plugin@marketplace-de-prueba","enabled":true}]', () =>
    comprobarSkillInstalado('plugin-de-prueba@marketplace-de-prueba')
  );
  assert.equal(estado, 'no-instalado');
});

// TASK-157: el `claude` real tarda unos 18 s en `plugin list --json`; con el
// timeout de 5 s salia siempre no-verificable. Un doble que tarda 6 s, por
// encima del timeout viejo, tiene que llegar a contestar.
test('comprobarSkillInstalado: un claude que tarda mas de 5 s en responder llega a dar instalado', () => {
  const estado = conClaudeDoble(
    '[{"id":"plugin-de-prueba@marketplace-de-prueba","enabled":true}]',
    () => comprobarSkillInstalado('plugin-de-prueba@marketplace-de-prueba'),
    6
  );
  assert.equal(estado, 'instalado');
});
