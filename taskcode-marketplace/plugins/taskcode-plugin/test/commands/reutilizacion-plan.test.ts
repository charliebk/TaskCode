/**
 * TASK-153a (Regla 4D al crear): el plan dice que reutiliza, buscado antes de
 * disenar. La plantilla y las peticiones de los agentes lo piden y approve
 * avisa, sin bloquear, si falta. Repos Git temporales reales y el CLI real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ID, CONFIG_AUTO, commitAll, cliOk, withRepo, nueva } from '../helpers/automatico-fixtures.js';
import { LINEA_PLANTILLA_REUTILIZACION, SECCION_REUTILIZACION } from '../../src/core/validacion-tarea.js';

test('reutilizacion (TASK-153a): la plantilla del plan y la peticion que lo redacta piden la seccion', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Reutilizar antes de crear');
    cliOk(repoRoot, ['plan', ID]);
    const planificacion = path.join(tareasRoot, '01-en-diseno', ID, 'planificacion');
    const plan = await readFile(path.join(planificacion, 'plan-final.md'), 'utf8');
    assert.ok(plan.includes(`${SECCION_REUTILIZACION}\n\n${LINEA_PLANTILLA_REUTILIZACION}`), plan);

    const brainstorm = path.join(planificacion, 'brainstorm');
    const redactoras = (await readdir(brainstorm)).filter((n) => /^peticion-(plan|unificador)-\d+\.md$/.test(n));
    assert.ok(redactoras.length > 0, 'debe haber una peticion que redacte el plan');
    for (const n of redactoras) {
      const texto = await readFile(path.join(brainstorm, n), 'utf8');
      assert.match(texto, /- Reutilizacion \(Regla 4D\): lo que ya existe en el repo y se va a usar/, n);
    }
  });
});

async function planificarCon(repoRoot: string, tareasRoot: string, reutilizacion: string | null): Promise<void> {
  nueva(repoRoot, 'feature', 'Reutilizar antes de crear');
  cliOk(repoRoot, ['plan', ID]);
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', ID, 'planificacion', 'plan-final.md'),
    '# Plan\n\n## Enfoque propuesto\n\nDuracion estimada: 30 min\n\nCambiar app.txt.\n\n' +
      (reutilizacion === null ? '' : `${SECCION_REUTILIZACION}\n\n${reutilizacion}\n\n`) +
      '## Plan de pruebas\n\nUn test.\n',
    'utf8'
  );
  commitAll(repoRoot, `docs(${ID}): plan final`);
}

const AVISO = /\[AVISO\] TASK-001: el plan no dice que reutiliza/;

test('reutilizacion (TASK-153a): approve avisa sin bloquear si falta la seccion o solo trae la linea de la plantilla', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planificarCon(repoRoot, tareasRoot, null);
    const r = cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    assert.match(r.stderr, AVISO);
  });
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planificarCon(repoRoot, tareasRoot, LINEA_PLANTILLA_REUTILIZACION);
    const r = cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    assert.match(r.stderr, AVISO);
  });
});

test('reutilizacion (TASK-153a): con la seccion rellena, approve no avisa', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    await planificarCon(repoRoot, tareasRoot, `${LINEA_PLANTILLA_REUTILIZACION}\n\n- rangoDeSeccion (core/transiciones.ts) para leer la seccion.`);
    const r = cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
    assert.doesNotMatch(r.stderr, AVISO);
  });
});
