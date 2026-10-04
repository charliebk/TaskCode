/**
 * Tests de taskctl approve (TASK-011). Desde TASK-012, approve SI toca
 * Git (ensureBaseBranchReady, seccion 8.3) — monta un repo Git
 * temporal real, mismo patron que start.test.ts/plan.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile, stat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runApproveCommand, ApproveCommandError } from '../../src/commands/approve.js';
import {
  PLAN_FINAL_FILENAME,
  PLANIFICACION_DIRNAME,
  resolverPlanFinal,
} from '../../src/commands/plan.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import { BaseBranchGuardError } from '../../src/fs/git.js';
import type { Task } from '../../src/core/task.js';

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-800',
    titulo: 'Tarea de prueba de approve',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'en-diseno',
    plan_aprobado: false,
    rama: 'feature/task-800-prueba',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-03',
    actualizado: '2026-09-03',
    dependencias: [],
    ...overrides,
  };
}

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

function branchNow(cwd: string): string {
  return spawnSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' }).stdout.trim();
}

/**
 * Commit de SETUP del test. Desde TASK-030 (item C2) taskctl commitea
 * lo que el mismo escribe, asi que llamar a esto justo despues de un
 * comando puede no tener ya nada que registrar: `git commit` sale 1
 * con "nothing to commit" y el assert de `git()` lo daria por fallo
 * del test. Se commitea solo si queda algo — y que no quede es
 * exactamente la senal de que el auto-commit hizo su trabajo.
 */
function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', message], repoRoot);
}

async function withTempRepo(fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-approve-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);

    const tareasRoot = path.join(repoRoot, 'tareas');
    await fn(repoRoot, tareasRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/** Plan en la ubicacion canonica desde TASK-027: planificacion/plan-final.md. */
async function writePlanFinal(tareasRoot: string, id: string, content = '# Plan real\n\nEnfoque: probar approve.\n'): Promise<void> {
  const dir = path.join(tareasRoot, '01-en-diseno', id, PLANIFICACION_DIRNAME);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, PLAN_FINAL_FILENAME), content, 'utf8');
}

/**
 * Plan como lo dejaba el CLI ANTERIOR a TASK-027: suelto en la raiz de
 * la carpeta de la tarea. Es el estado en el que quedo cualquier tarea
 * planificada antes del cambio, y approve tiene que seguir aceptandolo.
 */
async function writePlanFinalLegado(
  tareasRoot: string,
  id: string,
  content = '# Plan real legado\n\nEnfoque legado.\n'
): Promise<void> {
  await writeFile(path.join(tareasRoot, '01-en-diseno', id, PLAN_FINAL_FILENAME), content, 'utf8');
}

test('taskctl approve: marca plan_aprobado true cuando la tarea esta en en-diseno y planificacion/plan-final.md existe', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nAlgo.\n');
    await writePlanFinal(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 con plan');

    const result = await runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot });

    assert.equal(result.id, 'TASK-800');
    // No se mueve de carpeta: sigue en 01-en-diseno.
    assert.match(result.filePath, /01-en-diseno[/\\]TASK-800[/\\]tarea\.md$/);
    assert.equal(result.baseBranchGuard.switched, false);

    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.plan_aprobado, true);
    assert.equal(read?.task.actualizado, '2026-09-05');

    // plan-final.md no se toco.
    const plan = await stat(
      path.join(tareasRoot, '01-en-diseno', 'TASK-800', PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME)
    );
    assert.ok(plan.isFile());
  });
});

// --- item C3 (TASK-027): compatibilidad con el plan legado ---

test('taskctl approve: con plan-final.md en la raiz Y en planificacion/ rechaza en vez de aprobar a ciegas', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo MENOR de revision por pares (ronda 1): "plan" trata ese
    // estado como irresoluble y aborta, pero "approve" marcaba
    // plan_aprobado: true sin mencionar que hay dos planes divergentes.
    // Dos merges --no-ff sin conflicto bastan para producirlo.
    await writeTareaFile(tareasRoot, sampleTask(), '');
    await writePlanFinal(tareasRoot, 'TASK-800', '# Plan B (planificacion)\n');
    await writePlanFinalLegado(tareasRoot, 'TASK-800', '# Plan A (raiz)\n');
    commitAll(repoRoot, 'tarea TASK-800 con dos planes');

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-06', { repoCwd: repoRoot }),
      ApproveCommandError
    );

    // No se aprobo nada.
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, false);
    assert.equal(read?.task.actualizado, '2026-09-03');
  });
});

test('taskctl approve: acepta el plan-final.md legado suelto en la raiz (tareas planificadas antes de TASK-027)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Sin esta compatibilidad, cualquier tarea que se planifico con el
    // CLI anterior se quedaria sin poder aprobarse: approve diria "no
    // hay plan" sobre una tarea que tiene el plan redactado.
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nAlgo.\n');
    await writePlanFinalLegado(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 con plan legado');

    const result = await runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-06', {
      repoCwd: repoRoot,
    });

    assert.equal(result.id, 'TASK-800');
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, true);

    // approve no reorganiza la carpeta (eso lo hace "plan"): el fichero
    // legado sigue donde estaba.
    const plan = await stat(path.join(tareasRoot, '01-en-diseno', 'TASK-800', PLAN_FINAL_FILENAME));
    assert.ok(plan.isFile());
  });
});

test('taskctl approve: rechaza si plan-final.md todavia no existe, sin tocar nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea TASK-800 sin plan');
    // Sin escribir plan-final.md.

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot }),
      StateMachineError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, false);
    assert.equal(read?.task.actualizado, '2026-09-03');
  });
});

test('taskctl approve: rechaza si la tarea no esta en en-diseno (p. ej. planificada)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'planificada' }), '');
    commitAll(repoRoot, 'tarea TASK-800 planificada');
    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot }),
      StateMachineError
    );
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.estado, 'planificada');
    assert.equal(read?.task.plan_aprobado, false);
  });
});

test('taskctl approve: rechaza si la tarea no esta en en-diseno (p. ej. en-curso), aunque exista un plan-final.md suelto', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), '');
    await writeFile(path.join(tareasRoot, '02-en-curso', 'TASK-800', PLAN_FINAL_FILENAME), '# x\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-800 en curso');

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot }),
      StateMachineError
    );
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.estado, 'en-curso');
  });
});

test('taskctl approve: rechaza si el ID no existe, sin efectos secundarios', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-999'], '2026-09-05', { repoCwd: repoRoot }),
      StateMachineError
    );
  });
});

test('taskctl approve: error claro si falta el ID', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runApproveCommand(tareasRoot, [], '2026-09-05', { repoCwd: repoRoot }),
      ApproveCommandError
    );
  });
});

test('taskctl approve: es idempotente si se invoca dos veces seguidas (ya aprobada sigue aprobada)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    await writePlanFinal(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 con plan');

    await runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot });
    // approve no comitea por la persona (fuera de alcance de TASK-012,
    // ver Objetivo de tarea.md — el paso 5 de la seccion 8.3 queda
    // pendiente): el workspace queda con tarea.md modificado, hay que
    // comitearlo a mano antes de la segunda vuelta, igual que en uso
    // real.
    commitAll(repoRoot, 'TASK-800 aprobada (primera vuelta)');
    const result2 = await runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-06', { repoCwd: repoRoot });

    assert.equal(result2.id, 'TASK-800');
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, true);
    assert.equal(read?.task.actualizado, '2026-09-06');
  });
});

test('taskctl approve: propaga cualquier error de stat que NO sea ENOENT (no lo confunde con "no existe")', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea TASK-800');
    const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-800');
    // Symlink autorreferencial en vez de un fichero normal: stat()
    // falla con ELOOP, no con ENOENT — debe propagarse, no
    // interpretarse como "el plan no existe todavia". (Restringir
    // permisos del directorio, probado primero, no sirve aqui: taskDir
    // tambien contiene tarea.md, asi que quitarle el bit de ejecucion
    // hace fallar la propia lectura de tarea.md en readTareaFile con
    // el mismo EACCES, antes de llegar siquiera al codigo bajo prueba
    // — hallazgo propio al escribir este test, TASK-011.)
    await symlink(PLAN_FINAL_FILENAME, path.join(taskDir, PLAN_FINAL_FILENAME));

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot }),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.equal((err as NodeJS.ErrnoException).code, 'ELOOP');
        return true;
      }
    );
  });
});

test('taskctl approve: complejidad trivial/simple tambien pasa por el mismo checkpoint si se invoca (approve no distingue complejidad)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ complejidad: 'trivial' }), '');
    await writePlanFinal(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 trivial');

    const result = await runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot });
    assert.equal(result.id, 'TASK-800');
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, true);
  });
});

// --- precondicion de rama base (seccion 8.3, TASK-012) ---------------------

test('taskctl approve: workspace sucio en develop aborta sin marcar plan_aprobado', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    await writePlanFinal(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 con plan');
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear', 'utf8');

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot }),
      BaseBranchGuardError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, false);
  });
});

test('taskctl approve: en una rama de feature, limpia, cambia sola a develop antes de aprobar', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    await writePlanFinal(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 con plan');
    git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);

    const result = await runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot });

    assert.equal(result.baseBranchGuard.switched, true);
    assert.equal(result.baseBranchGuard.branchAntes, 'feature/otra-cosa');
    assert.equal(branchNow(repoRoot), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, true);
  });
});

test('taskctl approve: falta de plan-final.md se sigue rechazando ANTES de tocar la rama activa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea TASK-800 sin plan');
    git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot }),
      StateMachineError
    );
    assert.equal(branchNow(repoRoot), 'feature/otra-cosa');
  });
});

test('taskctl approve: la tarea existe en la rama vieja pero NO en la rama base real tras el cambio — rechaza sin marcar nada (hallazgo CRITICO de revision por pares, TASK-012)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    git(['checkout', '-q', '-b', 'feature/donde-no-deberia-estar'], repoRoot);
    await writeTareaFile(tareasRoot, sampleTask(), '');
    await writePlanFinal(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 solo en esta rama de feature');

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-05', { repoCwd: repoRoot }),
      StateMachineError
    );

    assert.equal(branchNow(repoRoot), 'develop');
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-800')));
  });
});

test('taskctl approve: NO sobrescribe con datos viejos el contenido real de la rama base (hallazgo CRITICO de revision por pares, TASK-012)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // develop (rama base real) ya tiene la tarea aprobada de verdad,
    // con etiquetas que alguien edito despues de la lectura que va a
    // hacer la rama vieja.
    await writeTareaFile(tareasRoot, sampleTask({ etiquetas: ['orig'] }), '');
    await writePlanFinal(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 con plan (v1)');

    // Rama de feature vieja, bifurcada ANTES de que developara
    // avanzara.
    git(['checkout', '-q', '-b', 'feature/vieja'], repoRoot);

    // develop sigue avanzando de verdad: se edita a mano (simulando
    // otra persona/sesion) y se aprueba.
    git(['checkout', '-q', 'develop'], repoRoot);
    const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-800');
    const tareaPath = path.join(taskDir, 'tarea.md');
    const original = await (await import('node:fs/promises')).readFile(tareaPath, 'utf8');
    const editado = original
      .replace('etiquetas: [orig]', 'etiquetas: [real, editada-en-develop]')
      .replace('plan_aprobado: false', 'plan_aprobado: true');
    await writeFile(tareaPath, editado, 'utf8');
    commitAll(repoRoot, 'TASK-800 aprobada de verdad en develop, con etiquetas nuevas');

    // Vuelve a la rama vieja (limpia, sin cambios sin commitear) y
    // ejecuta approve desde ahi.
    git(['checkout', '-q', 'feature/vieja'], repoRoot);
    const staleRead = await readTareaFile(tareasRoot, 'TASK-800');
    assert.deepEqual(staleRead?.task.etiquetas, ['orig']);
    assert.equal(staleRead?.task.plan_aprobado, false);

    const result = await runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-06', { repoCwd: repoRoot });

    assert.equal(result.baseBranchGuard.switched, true);
    assert.equal(branchNow(repoRoot), 'develop');

    // El contenido real de develop (etiquetas nuevas) se conserva —
    // NO se sobrescribe con lo que veia la rama vieja.
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.deepEqual(read?.task.etiquetas, ['real', 'editada-en-develop']);
    assert.equal(read?.task.plan_aprobado, true);
    assert.equal(read?.task.actualizado, '2026-09-06');
  });
});

test('taskctl approve: "planificacion" ocupado por un FICHERO no revienta con un error crudo (ENOTDIR en POSIX, ENOENT en Windows)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo IMPORTANTE de revision por pares (ronda 2, TASK-027): la
    // ronda 1 envolvio el mkdir de "plan", pero approve no hace mkdir —
    // llega directo al stat. En POSIX ese stat contesta ENOTDIR y
    // existeFichero solo absorbia ENOENT, asi que approve moria con un
    // "taskctl no pudo arrancar: ENOTDIR" en Linux mientras en Windows
    // se comportaba bien. Este test da el MISMO veredicto en las dos
    // plataformas: sea cual sea el errno, aqui no hay plan y lo que
    // toca es el error de dominio, no el de libc.
    await writeTareaFile(tareasRoot, sampleTask(), '');
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', 'TASK-800', PLANIFICACION_DIRNAME),
      'soy un fichero, no una carpeta\n',
      'utf8'
    );
    commitAll(repoRoot, 'tarea TASK-800 con planificacion ocupado por un fichero');

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-06', { repoCwd: repoRoot }),
      (err: unknown) => {
        assert.ok(
          err instanceof StateMachineError,
          `se esperaba el error de dominio, no uno crudo del sistema: ${String(err)}`
        );
        assert.match((err as Error).message, /plan-final\.md/);
        return true;
      }
    );

    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, false);
  });
});

test('taskctl approve: con la tarea en un estado no aprobable Y dos plan-final.md, el error habla del ESTADO, no de la ambiguedad', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo MENOR de revision por pares (ronda 2, TASK-027): la
    // comprobacion de ambiguedad iba ANTES de assertTransitionAllowed y
    // tapaba el motivo real, mandando a comparar dos planes que no
    // desbloquean nada. El estado manda primero.
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso', plan_aprobado: true }), '');
    const taskDir = path.join(tareasRoot, '02-en-curso', 'TASK-800');
    await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME), { recursive: true });
    await writeFile(path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME), '# A\n', 'utf8');
    await writeFile(path.join(taskDir, PLAN_FINAL_FILENAME), '# B distinto\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-800 en-curso con los dos plan-final.md');

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-06', { repoCwd: repoRoot }),
      (err: unknown) => {
        assert.ok(
          err instanceof StateMachineError,
          `se esperaba el error de estado, no el de ambiguedad: ${String(err)}`
        );
        assert.match((err as Error).message, /en-curso/);
        return true;
      }
    );
  });
});


test('taskctl approve: la ambiguedad que solo existe en la rama base tambien se detecta (lectura fresca, no solo la preliminar)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo MENOR de revision por pares (ronda 2, TASK-027):
    // assertPlanNoAmbiguo se llama en los DOS puntos, pero quitarla de la
    // lectura fresca no rompia ningun test, porque los dos tests de
    // ambiguedad ya arrancan en develop y cortan en la preliminar. Y es
    // justo la fresca la que cubre el caso realista: la ambiguedad nace
    // de dos merges --no-ff en develop, y quien ejecuta approve puede
    // estar en su rama de feature, donde no se ve.
    await writeTareaFile(tareasRoot, sampleTask(), '');
    await writePlanFinal(tareasRoot, 'TASK-800');
    commitAll(repoRoot, 'tarea TASK-800 con un solo plan, el canonico');

    // Rama de feature bifurcada AHORA: aqui solo se ve el plan canonico.
    git(['checkout', '-q', '-b', 'feature/sin-ambiguedad-a-la-vista'], repoRoot);

    // develop avanza y acaba con los dos ficheros (lo que dejan dos
    // merges sin conflicto de dos ramas que planificaron distinto).
    git(['checkout', '-q', 'develop'], repoRoot);
    await writePlanFinalLegado(tareasRoot, 'TASK-800', '# Plan de la otra rama\n');
    commitAll(repoRoot, 'develop acaba con los dos plan-final.md');

    git(['checkout', '-q', 'feature/sin-ambiguedad-a-la-vista'], repoRoot);
    // La lectura preliminar NO ve ambiguedad desde aqui.
    const soloCanonico = await resolverPlanFinal(
      path.join(tareasRoot, '01-en-diseno', 'TASK-800')
    );
    assert.equal(soloCanonico.legadaExiste, false);

    await assert.rejects(
      () => runApproveCommand(tareasRoot, ['TASK-800'], '2026-09-06', { repoCwd: repoRoot }),
      (err: unknown) => {
        assert.ok(err instanceof ApproveCommandError, `error inesperado: ${String(err)}`);
        assert.match((err as Error).message, /No se puede aprobar sin saber cual es el plan bueno/);
        return true;
      }
    );

    // Cambio de rama hecho, pero nada aprobado.
    assert.equal(branchNow(repoRoot), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-800');
    assert.equal(read?.task.plan_aprobado, false);
  });
});
