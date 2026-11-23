/**
 * TASK-144c (CMD2-02, CMD2-09 y CMD1-10 de la auditoria 4D): los patrones de
 * los ficheros de ronda y de rol salen de quien genera los nombres, y «que
 * plan cuenta» es una sola regla.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { INFORME_REVISION_RE, PETICION_REVISION_RE, RONDA_REVISION_RE, nombresDeRonda } from '../../src/fs/rondas.js';
import {
  PETICION_ROL_RE,
  SALIDA_ROL_RE,
  nombrePeticionRol,
  nombrePeticionUnificador,
  nombrePeticionRedaccion,
  nombreSalidaRol,
} from '../../src/core/plan-brainstorm.js';
import { TODOS_LOS_ROLES } from '../../src/core/roles-brainstorm.js';
import { duracionDelPlan, planQueCuenta } from '../../src/commands/approve.js';
import { resolverPlanFinal } from '../../src/commands/plan.js';

test('CMD2-02: los nombres de ronda que genera review casan con los patrones de rondas.ts, con y sin revisor', () => {
  for (const sufijo of ['', '-java-spring-reviewer']) {
    const { peticion, informe } = nombresDeRonda(12, sufijo);
    assert.equal(RONDA_REVISION_RE.exec(peticion)?.[1], '12', peticion);
    assert.equal(RONDA_REVISION_RE.exec(informe)?.[1], '12', informe);
    assert.equal(PETICION_REVISION_RE.exec(peticion)?.[2], sufijo === '' ? undefined : 'java-spring-reviewer');
    assert.ok(INFORME_REVISION_RE.test(informe));
    assert.ok(!PETICION_REVISION_RE.test(informe));
  }
  assert.ok(!RONDA_REVISION_RE.test('otro-revision-1.md'));
});

test('CMD2-09: los patrones de rol salen de los ids de TODOS los roles (tambien los condicionales)', () => {
  for (const rol of TODOS_LOS_ROLES) {
    assert.equal(PETICION_ROL_RE.exec(nombrePeticionRol(rol, 3))?.[1], '3', rol.id);
    assert.equal(SALIDA_ROL_RE.exec(nombreSalidaRol(rol, 3))?.[1], '3', rol.id);
    assert.ok(PETICION_ROL_RE.source.includes(rol.id), `el patron no sale del id ${rol.id}`);
  }
  // Las peticiones del unificador y de redaccion no son de un rol: no cuentan como ronda de roles.
  assert.ok(!PETICION_ROL_RE.test(nombrePeticionUnificador(3)));
  assert.ok(!PETICION_ROL_RE.test(nombrePeticionRedaccion(3)));
  assert.ok(!PETICION_ROL_RE.test('peticion-brainstorm-inventado-3.md'), 'un rol que no existe no cuenta');
});

test('CMD1-10: con un plan en la raiz y otro en planificacion/ no cuenta ninguno (ambiguo), igual que en approve', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'plan-que-cuenta-'));
  try {
    assert.equal(planQueCuenta(await resolverPlanFinal(dir)), null);
    await writeFile(path.join(dir, 'plan-final.md'), '# Plan\n\nDuracion estimada: 30 min\n', 'utf8');
    assert.equal(planQueCuenta(await resolverPlanFinal(dir)), path.join(dir, 'plan-final.md'));
    await mkdir(path.join(dir, 'planificacion'), { recursive: true });
    await writeFile(path.join(dir, 'planificacion', 'plan-final.md'), '# Plan\n\nDuracion estimada: 90 min\n', 'utf8');
    assert.equal(planQueCuenta(await resolverPlanFinal(dir)), 'ambiguo');
    // Antes elegia el canonico (90 min) en silencio; ahora, sin saber cual cuenta, no hay duracion.
    assert.deepEqual(await duracionDelPlan(dir), { tipo: 'ausente' });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
