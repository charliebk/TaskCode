/**
 * TASK-098: las transiciones que commitean en la rama de integracion (new,
 * plan, approve y finish tras el merge) crean o regeneran tareas/ROADMAP.md
 * dentro de su mismo commit; start, que commitea en la rama de la tarea, no
 * lo toca, y por eso dos ramas en paralelo cierran sin conflicto en el.
 * Repos Git temporales reales y los scripts de Git-Flow tal cual.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runNewCommand } from '../../src/commands/new.js';
import { runPlanCommand } from '../../src/commands/plan.js';
import { runApproveCommand } from '../../src/commands/approve.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { MARCA_TASKCTL } from '../../src/core/roadmap.js';
import {
  CUERPO_PLANIFICABLE,
  SCRIPTS_DIR,
  aRevision,
  commitAll,
  ficherosDeHead,
  git,
  porcelain,
  rutaRoadmap,
  tarea,
  withRepo,
} from '../helpers/roadmap-fixtures.js';

const ROADMAP = 'tareas/ROADMAP.md';

function roadmap(repoRoot: string): string {
  return readFileSync(rutaRoadmap(repoRoot), 'utf8');
}

/** Fila de una tarea en el ROADMAP, o null. */
function fila(repoRoot: string, id: string): string | null {
  // La segunda columna, no cualquiera: el id tambien sale en "Depende de".
  return roadmap(repoRoot).split('\n').find((l) => l.split(' | ')[1] === id) ?? null;
}

test('new, plan, approve y finish crean o regeneran el ROADMAP con la marca en su mismo commit; start no lo toca', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    // new: no habia ROADMAP ni historia de el -> lo crea en el commit de la tarea.
    const n = await runNewCommand(
      tareasRoot,
      ['--titulo', 'Primera', '--tipo', 'feature', '--sprint', '1', '--complejidad', 'media',
        '--objetivo', 'Probar el roadmap.', '--criterio', 'Se regenera.'],
      '2026-11-10',
      { repoCwd: repoRoot }
    );
    assert.equal(n.id, 'TASK-001');
    assert.ok(ficherosDeHead(repoRoot).includes(ROADMAP), ficherosDeHead(repoRoot).join(', '));
    assert.equal(roadmap(repoRoot).split('\n')[2], MARCA_TASKCTL);
    assert.match(fila(repoRoot, 'TASK-001')!, /\| 1 \| TASK-001 \| Primera \| media \| — \| lista para empezar \|/);
    assert.match(roadmap(repoRoot), /^## H1 — H1$/m);
    assert.match(roadmap(repoRoot), /^- \*\*Listas para empezar:\*\* TASK-001$/m);
    assert.equal(porcelain(repoRoot), '');

    // Una tarea que depende de TASK-001, anadida a mano: el ROADMAP queda
    // desfasado hasta la siguiente transicion, que lo pone al dia entero.
    await writeTareaFile(
      tareasRoot,
      tarea({ id: 'TASK-002', titulo: 'Segunda', sprint: 0, complejidad: 'alta', dependencias: ['TASK-001'] }),
      CUERPO_PLANIFICABLE
    );
    commitAll(repoRoot, 'docs: segunda tarea');

    await runPlanCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot });
    assert.ok(ficherosDeHead(repoRoot).includes(ROADMAP));
    assert.match(fila(repoRoot, 'TASK-001')!, /▶ en diseño \|$/);
    // TASK-002 es de H0 pero depende de TASK-001 (H1): va despues de ella.
    assert.match(fila(repoRoot, 'TASK-002')!, /\| 2 \| TASK-002 \| Segunda \| alta \| TASK-001 \| espera a TASK-001 \|/);
    assert.match(roadmap(repoRoot), /^- \*\*En marcha:\*\* TASK-001 \(en diseño\)$/m);
    assert.equal(porcelain(repoRoot), '');

    // approve: otra tarea anadida a mano entra en el ROADMAP con el commit de approve.
    const plan = path.join(tareasRoot, '01-en-diseno', 'TASK-001', 'planificacion', 'plan-final.md');
    await writeFile(plan, '# Plan\n\nEnfoque: probar el roadmap.\n', 'utf8');
    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-003', titulo: 'Tercera', sprint: 1 }), CUERPO_PLANIFICABLE);
    commitAll(repoRoot, 'docs: plan y tercera tarea');
    const a = await runApproveCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot });
    assert.ok(a.autoCommit.ficheros.includes(ROADMAP));
    assert.ok(ficherosDeHead(repoRoot).includes(ROADMAP));
    assert.match(fila(repoRoot, 'TASK-003')!, /lista para empezar \|$/);
    assert.equal(porcelain(repoRoot), '');

    // start: commitea en la rama de la tarea y el ROADMAP no se toca.
    const antes = roadmap(repoRoot);
    const s = await runStartCommand(tareasRoot, ['TASK-001'], '2026-11-10', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), s.rama);
    assert.equal(s.autoCommit.roadmap, null);
    assert.ok(!ficherosDeHead(repoRoot).includes(ROADMAP));
    assert.equal(roadmap(repoRoot), antes);

    // finish: tras el merge, en develop, con la tarea ya terminada.
    await aRevision(repoRoot, tareasRoot, 'TASK-001');
    const f = await runFinishCommand(tareasRoot, ['TASK-001'], '2026-11-10', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    assert.ok(f.autoCommit.ficheros.includes(ROADMAP), f.autoCommit.ficheros.join(', '));
    assert.match(fila(repoRoot, 'TASK-001')!, /\| — \| TASK-001 \| Primera \| media \| — \| ✅ terminada \|/);
    assert.match(fila(repoRoot, 'TASK-002')!, /lista para empezar \|$/);
    assert.match(roadmap(repoRoot), /^1 de 2 terminadas\.$/m);
    assert.equal(porcelain(repoRoot), '');
    // Ninguna fecha: regenerar sin cambios no da diff.
    assert.doesNotMatch(roadmap(repoRoot), /2026-11-10/);
  });
});

test('dos ramas de tarea en paralelo cierran con finish sin conflicto en el ROADMAP', async () => {
  await withRepo(async (repoRoot, tareasRoot) => {
    for (const titulo of ['Rama A', 'Rama B']) {
      await runNewCommand(tareasRoot, ['--titulo', titulo, '--tipo', 'feature'], '2026-11-10', { repoCwd: repoRoot });
    }
    const roadmapInicial = roadmap(repoRoot);
    assert.match(roadmapInicial, /TASK-001.*TASK-002/s);

    // Las dos ramas nacen del mismo develop y avanzan cada una por su lado.
    const ramas: string[] = [];
    for (const id of ['TASK-001', 'TASK-002']) {
      git(['checkout', '-q', 'develop'], repoRoot);
      const { task } = (await readTareaFile(tareasRoot, id))!;
      ramas.push(task.rama);
      git(['checkout', '-q', '-b', task.rama], repoRoot);
      await aRevision(repoRoot, tareasRoot, id);
      // En la rama de la tarea el ROADMAP sigue siendo el de develop.
      assert.equal(roadmap(repoRoot), roadmapInicial);
    }

    git(['checkout', '-q', ramas[0]!], repoRoot);
    await runFinishCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    git(['checkout', '-q', ramas[1]!], repoRoot);
    const f2 = await runFinishCommand(tareasRoot, ['TASK-002'], '2026-11-10', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });

    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    assert.ok(f2.autoCommit.ficheros.includes(ROADMAP));
    const final = await readFile(rutaRoadmap(repoRoot), 'utf8');
    assert.doesNotMatch(final, /^(<<<<<<<|=======|>>>>>>>)/m);
    assert.match(fila(repoRoot, 'TASK-001')!, /✅ terminada \|$/);
    assert.match(fila(repoRoot, 'TASK-002')!, /✅ terminada \|$/);
    assert.match(final, /^2 de 2 terminadas\.$/m);
    assert.equal(porcelain(repoRoot), '');
  });
});
