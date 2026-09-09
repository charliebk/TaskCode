/**
 * Tests de taskctl plan (TASK-010). Desde TASK-012, plan SI toca Git
 * (ensureBaseBranchReady, seccion 8.3) — igual que start.test.ts
 * (TASK-009), monta un repo Git temporal real en vez de un directorio
 * de temp sin mas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readFile, writeFile, stat, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import {
  runPlanCommand,
  PlanCommandError,
  PLAN_FINAL_FILENAME,
  PLANIFICACION_DIRNAME,
} from '../../src/commands/plan.js';
import {
  PETICION_DESEMPATE_SKILL_FILENAME,
  SALIDA_DESEMPATE_SKILL_FILENAME,
} from '../../src/core/plan-desempate-skill.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import { BaseBranchGuardError } from '../../src/fs/git.js';
import { CatalogoSkillsError } from '../../src/core/catalogo-skills.js';
import type { Task } from '../../src/core/task.js';

const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const RUTA_HEURISTICA_REAL = path.join(RAIZ_PAQUETE, 'scripts', 'heuristica-complejidad.yml');

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-700',
    titulo: 'Tarea de prueba de plan',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-700-prueba',
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

/**
 * Cuerpo minimo pero VALIDO de una tarea. Desde TASK-016 "plan" aborta
 * si el "## Objetivo" esta vacio y la tarea lanza al menos un rol de
 * brainstorm, asi que un fixture con el cuerpo en blanco ya no
 * representa una tarea planificable: los tests que no prueban ESA
 * puerta usan este cuerpo para que lo que falle sea lo que cada uno
 * mide, y no la precondicion.
 */
const BODY_CON_OBJETIVO =
  '## Objetivo\n\nProbar el comando con una tarea que si dice a que viene.\n';

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

function branchNow(cwd: string): string {
  return spawnSync('git', ['branch', '--show-current'], { cwd, encoding: 'utf8' }).stdout.trim();
}

/**
 * writeTareaFile deja tareas/.../tarea.md sin commitear (es solo I/O de
 * disco). En uso real esa tarea.md ya estaria commiteada (viene de un
 * "taskctl new"/"import" previo) antes de que alguien ejecute plan, asi
 * que los tests la commitean aqui para dejar el workspace limpio antes
 * de invocar runPlanCommand — mismo patron que start.test.ts.
 */
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
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-plan-'));
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

test('taskctl plan: primera vez mueve la tarea a 01-en-diseno y crea el scaffold en planificacion/', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot });

    assert.equal(result.id, 'TASK-700');
    assert.match(result.filePath, /01-en-diseno[/\\]TASK-700[/\\]tarea\.md$/);
    // El plan vive en planificacion/, no suelto en la raiz (TASK-027).
    assert.equal(
      result.planPath,
      path.join(path.dirname(result.filePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME)
    );
    assert.equal(result.planCreated, true);
    assert.equal(result.planMigrado, false);
    assert.equal(result.baseBranchGuard.switched, false);
    assert.equal(result.baseBranchGuard.baseBranch, 'develop');

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.actualizado, '2026-09-04');
    // plan_aprobado NO lo toca "plan" (eso es taskctl approve, TASK-011).
    assert.equal(read?.task.plan_aprobado, false);

    const planContent = await readFile(result.planPath, 'utf8');
    assert.match(planContent, /# Plan — TASK-700: Tarea de prueba de plan/);

    // La carpeta vieja (00-planificadas) ya no existe.
    await assert.rejects(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));

    // Y no queda nada suelto en la raiz de la carpeta de la tarea.
    await assert.rejects(() =>
      stat(path.join(path.dirname(result.filePath), PLAN_FINAL_FILENAME))
    );
  });
});

test('taskctl plan: re-planificacion (en-diseno, plan_aprobado false) no pisa el plan-final.md existente', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Simula una primera vuelta ya hecha con el CLI actual: el plan
    // real (no el scaffold) ya vive en planificacion/.
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), BODY_CON_OBJETIVO);
    const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
    await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME), { recursive: true });
    await writeFile(
      path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME),
      '# Plan real ya redactado\n',
      'utf8'
    );
    commitAll(repoRoot, 'tarea TASK-700 en diseno');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-05', { repoCwd: repoRoot });

    assert.equal(result.planCreated, false);
    assert.equal(result.planMigrado, false);
    assert.match(result.filePath, /01-en-diseno[/\\]TASK-700[/\\]tarea\.md$/);

    const planContent = await readFile(result.planPath, 'utf8');
    assert.equal(planContent, '# Plan real ya redactado\n');

    // actualizado SI se refresca aunque no cambie de carpeta.
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.actualizado, '2026-09-05');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

// --- item C3 (TASK-027): planificacion/ y migracion del plan legado ---

test('taskctl plan: migra a planificacion/ el plan-final.md legado suelto en la raiz, con su contenido intacto', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Tarea planificada con el CLI ANTERIOR a TASK-027: el plan real,
    // ya redactado, esta suelto en la raiz de la carpeta.
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), BODY_CON_OBJETIVO);
    const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
    await writeFile(path.join(taskDir, PLAN_FINAL_FILENAME), '# Plan legado redactado\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-700 con plan legado');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot });

    assert.equal(result.planMigrado, true);
    // No se crea scaffold: el plan que ya habia es el que vale.
    assert.equal(result.planCreated, false);
    assert.equal(result.planPath, path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME));
    assert.equal(await readFile(result.planPath, 'utf8'), '# Plan legado redactado\n');

    // Se MOVIO: no queda una copia suelta que pueda divergir.
    await assert.rejects(() => stat(path.join(taskDir, PLAN_FINAL_FILENAME)));
  });
});

test('taskctl plan: con plan-final.md en la raiz Y en planificacion/ aborta sin tocar nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Estado ambiguo: dos planes distintos, ninguno obviamente el bueno.
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    const taskDirOrigen = path.join(tareasRoot, '00-planificadas', 'TASK-700');
    await writeFile(path.join(taskDirOrigen, PLAN_FINAL_FILENAME), '# Plan A (raiz)\n', 'utf8');
    await mkdir(path.join(taskDirOrigen, PLANIFICACION_DIRNAME), { recursive: true });
    await writeFile(
      path.join(taskDirOrigen, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME),
      '# Plan B (planificacion)\n',
      'utf8'
    );
    commitAll(repoRoot, 'tarea TASK-700 con dos planes');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot }),
      PlanCommandError
    );

    // Fail-closed de verdad: la tarea NO se movio de carpeta y los dos
    // ficheros siguen donde estaban, con su contenido original.
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'planificada');
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700')));
    assert.equal(
      await readFile(path.join(taskDirOrigen, PLAN_FINAL_FILENAME), 'utf8'),
      '# Plan A (raiz)\n'
    );
    assert.equal(
      await readFile(path.join(taskDirOrigen, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME), 'utf8'),
      '# Plan B (planificacion)\n'
    );
  });
});

test('taskctl plan: si "planificacion" existe como FICHERO, el error dice que hacer y no mueve la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo MENOR de revision por pares (ronda 1): el EEXIST crudo
    // del mkdir salia como "taskctl no pudo arrancar", que ni es cierto
    // ni dice que hacer.
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-700');
    await writeFile(path.join(taskDir, PLANIFICACION_DIRNAME), 'no soy una carpeta\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-700 con planificacion ocupada');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot }),
      (err: unknown) => {
        assert.ok(err instanceof PlanCommandError);
        // Dice donde esta el problema y como salir de el.
        assert.match(err.message, new RegExp(PLANIFICACION_DIRNAME));
        assert.match(err.message, /renombralo o borralo/);
        return true;
      }
    );

    // La tarea sigue donde estaba.
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'planificada');
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700')));
  });
});

test('taskctl plan: un DIRECTORIO llamado plan-final.md no cuenta como plan (no se "migra" ni se anuncia como movido)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo MENOR de revision por pares (ronda 1): con un stat
    // pelado, "plan" renombraba el directorio y anunciaba "el plan se ha
    // movido intacto".
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-700');
    await mkdir(path.join(taskDir, PLAN_FINAL_FILENAME), { recursive: true });
    commitAll(repoRoot, 'tarea TASK-700 con plan-final.md como directorio');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot });

    assert.equal(result.planMigrado, false);
    // Se crea un scaffold de verdad en la ubicacion canonica.
    assert.equal(result.planCreated, true);
    assert.match(await readFile(result.planPath, 'utf8'), /# Plan — TASK-700/);
    // Y el directorio raro se queda donde estaba, sin tocar.
    const raro = await stat(path.join(path.dirname(result.filePath), PLAN_FINAL_FILENAME));
    assert.ok(raro.isDirectory());
  });
});

test('taskctl plan: un DIRECTORIO en la ubicacion canonica falla diciendo que hacer, no finge una re-planificacion', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo MENOR del smoke test manual (TASK-027), simetrico del
    // test de arriba pero en la ruta canonica. writeFile con "wx" sobre
    // un directorio devuelve EEXIST, igual que sobre un fichero; el
    // catch se lo tragaba como re-planificacion y "plan" salia 0
    // diciendo "ya existia -- se dejo intacto" SIN plan ninguno,
    // mientras "approve" contestaba "todavia no tiene un plan-final.md
    // que aprobar. Ejecuta taskctl plan primero". Bucle sin salida.
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    const taskDir = path.join(tareasRoot, '00-planificadas', 'TASK-700');
    await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME), { recursive: true });
    commitAll(repoRoot, 'tarea TASK-700 con planificacion/plan-final.md como directorio');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot }),
      (err: unknown) => {
        assert.ok(err instanceof PlanCommandError);
        assert.match(err.message, /no es un fichero/);
        assert.match(err.message, /Renombra o borra/);
        return true;
      }
    );

    // Fail-closed de verdad: la tarea no se ha movido de carpeta y el
    // directorio raro sigue intacto donde estaba.
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'planificada');
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700')));
    const raro = await stat(path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME));
    assert.ok(raro.isDirectory());
  });
});

test('taskctl plan: planificacion/ viaja con la tarea al cambiar de carpeta de estado', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Una tarea "planificada" con artefactos previos en planificacion/
    // (p. ej. notas de una vuelta anterior): el cambio de estado tiene
    // que llevarse la subcarpeta entera, no solo tarea.md.
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    const origen = path.join(tareasRoot, '00-planificadas', 'TASK-700', PLANIFICACION_DIRNAME);
    await mkdir(origen, { recursive: true });
    await writeFile(path.join(origen, 'notas.md'), '# Notas previas\n', 'utf8');
    commitAll(repoRoot, 'tarea TASK-700 con notas');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-06', { repoCwd: repoRoot });

    const destino = path.join(path.dirname(result.filePath), PLANIFICACION_DIRNAME);
    assert.equal(await readFile(path.join(destino, 'notas.md'), 'utf8'), '# Notas previas\n');
    // Y el scaffold nuevo convive con lo que ya habia.
    assert.equal(result.planCreated, true);
    await stat(result.planPath);
    await assert.rejects(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));
  });
});

test('taskctl plan: rechaza si ya esta en en-diseno con plan_aprobado true, sin tocar nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno', plan_aprobado: true }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 aprobada');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.plan_aprobado, true);
    // No se creo ningun plan-final.md.
    await assert.rejects(() =>
      stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700', PLAN_FINAL_FILENAME))
    );
  });
});

test('taskctl plan: rechaza un estado que no admite plan (p. ej. en-curso)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 en curso');
    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-curso');
  });
});

test('taskctl plan: rechaza si el ID no existe, sin efectos secundarios', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-999'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );
  });
});

test('taskctl plan: propaga cualquier error de escritura que NO sea EEXIST (no lo confunde con una re-planificacion)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 en diseno');
    const taskDir = path.join(tareasRoot, '01-en-diseno', 'TASK-700');
    // planificacion/ existe pero sin permiso de escritura: writeFile de
    // plan-final.md falla con EACCES, no con EEXIST — debe
    // propagarse tal cual, no tratarse como "ya existe, re-planificacion
    // normal". Desde TASK-027 el chmod va sobre la subcarpeta, no sobre
    // la raiz de la tarea: con la raiz en 0555 el mkdir de
    // planificacion/ todavia funciona y el fichero se acaba escribiendo.
    await mkdir(path.join(taskDir, PLANIFICACION_DIRNAME), { recursive: true });
    await chmod(path.join(taskDir, PLANIFICACION_DIRNAME), 0o555);
    try {
      await assert.rejects(
        () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.equal((err as NodeJS.ErrnoException).code, 'EACCES');
          return true;
        }
      );
    } finally {
      // Restaura permisos para que withTempRepo pueda limpiar el directorio.
      await chmod(path.join(taskDir, PLANIFICACION_DIRNAME), 0o755);
    }
  });
});

test('taskctl plan: error claro si falta el ID', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runPlanCommand(tareasRoot, [], '2026-09-04', { repoCwd: repoRoot }),
      PlanCommandError
    );
  });
});

// --- precondicion de rama base (seccion 8.3, TASK-012) ---------------------

test('taskctl plan: workspace sucio en develop aborta sin mover ni escribir nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700');
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'sin commitear', 'utf8');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      BaseBranchGuardError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'planificada');
    await assert.rejects(() =>
      stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700'))
    );
  });
});

test('taskctl plan: en una rama de feature, limpia, cambia sola a develop antes de mover la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700');
    git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot });

    assert.equal(result.baseBranchGuard.switched, true);
    assert.equal(result.baseBranchGuard.branchAntes, 'feature/otra-cosa');
    assert.equal(branchNow(repoRoot), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl plan: el estado invalido se sigue rechazando ANTES de tocar la rama activa', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-curso' }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 en curso');
    git(['checkout', '-q', '-b', 'feature/otra-cosa'], repoRoot);

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );
    // No cambio de rama: el rechazo de la maquina de estados es previo
    // a ensureBaseBranchReady (mismo orden que documenta plan.ts).
    assert.equal(branchNow(repoRoot), 'feature/otra-cosa');
  });
});

test('taskctl plan: la tarea existe en la rama vieja pero NO en la rama base real tras el cambio — rechaza sin crear nada (hallazgo CRITICO de revision por pares, TASK-012)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // A proposito NO se commitea en develop: la tarea solo existe en
    // esta rama de feature (violando 8.3, pero es exactamente el
    // escenario que expone el hallazgo — una lectura preliminar en la
    // rama equivocada no debe decidir nada).
    git(['checkout', '-q', '-b', 'feature/donde-no-deberia-estar'], repoRoot);
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 solo en esta rama de feature');

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-04', { repoCwd: repoRoot }),
      StateMachineError
    );

    // Termino en develop (el cambio de rama SI se hizo, porque la
    // lectura preliminar en la rama de feature parecia valida) pero
    // sin crear ni mover nada ahi: develop nunca tuvo esta tarea.
    assert.equal(branchNow(repoRoot), 'develop');
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700')));
    await assert.rejects(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));
  });
});

test('taskctl plan: la rama base real tiene la tarea en un estado distinto al de la lectura preliminar — decide con el estado real, no con el viejo (hallazgo CRITICO de revision por pares, TASK-012)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Primero, la tarea nace "planificada" (como dejaria taskctl new).
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 planificada');

    // Una rama de feature se bifurca AQUI — ve la tarea "planificada",
    // sin plan-final.md.
    git(['checkout', '-q', '-b', 'feature/vieja'], repoRoot);
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'planificada');

    // develop sigue avanzando de verdad: se re-planifica de verdad
    // (en-diseno, con un plan-final.md real) — borra la carpeta vieja
    // a mano para que el commit refleje el movimiento real (aqui no se
    // usa runPlanCommand a proposito: es solo el estado de partida del
    // test, no lo que se esta probando).
    git(['checkout', '-q', 'develop'], repoRoot);
    await rm(path.join(tareasRoot, '00-planificadas', 'TASK-700'), { recursive: true, force: true });
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno' }), BODY_CON_OBJETIVO);
    await writeFile(
      path.join(tareasRoot, '01-en-diseno', 'TASK-700', PLAN_FINAL_FILENAME),
      '# Plan real en develop\n',
      'utf8'
    );
    commitAll(repoRoot, 'tarea TASK-700 en diseno de verdad en develop');

    // Vuelve a la rama vieja (limpia) para invocar "plan" desde ahi.
    git(['checkout', '-q', 'feature/vieja'], repoRoot);

    // "plan" desde la rama vieja: la lectura preliminar ve
    // "planificada" (primera vez, valido) y NO deberia usarse para
    // escribir. Tras el cambio automatico a develop, la lectura fresca
    // ve "en-diseno" con plan_aprobado false: sigue siendo una
    // re-planificacion legitima, PERO sobre el contenido real de
    // develop, no sobre el de la rama vieja — y sin pisar el
    // plan-final.md real que ya existe ahi. Desde TASK-027 el plan de
    // develop esta suelto en la raiz, asi que este caso entra por la
    // rama de MIGRACION (rename), no por el writeFile con 'wx'.
    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-05', { repoCwd: repoRoot });

    assert.equal(result.planCreated, false);
    const planContent = await readFile(result.planPath, 'utf8');
    assert.equal(planContent, '# Plan real en develop\n');
    assert.equal(branchNow(repoRoot), 'develop');
  });
});

// --- item B6: --asignado-a ---

test('taskctl plan --asignado-a: escribe asignado_a en el frontmatter de verdad', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700');

    const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a', 'carlos'], '2026-09-05', {
      repoCwd: repoRoot,
    });

    assert.equal(result.asignadoA, 'carlos');
    assert.equal(result.asignadoCambiado, true);

    // Evidencia en disco, no solo el valor devuelto: se relee el
    // fichero movido y se comprueba el campo ya parseado.
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.asignado_a, 'carlos');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl plan: sin --asignado-a NO borra el asignado_a que ya tuviera la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 ya asignada');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-05', { repoCwd: repoRoot });

    assert.equal(result.asignadoA, 'ana');
    assert.equal(result.asignadoCambiado, false);
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.asignado_a, 'ana');
  });
});

test('taskctl plan --asignado-a: reasignar a la MISMA persona no cuenta como cambio', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 asignada a carlos');

    const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a=carlos'], '2026-09-05', {
      repoCwd: repoRoot,
    });

    assert.equal(result.asignadoA, 'carlos');
    // Sin esto, el CLI imprimiria 'Asignada a carlos' en cada
    // re-planificacion aunque no hubiera cambiado nada.
    assert.equal(result.asignadoCambiado, false);
  });
});

test('taskctl plan --asignado-a: en una re-planificacion reasigna a otra persona', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'en-diseno', asignado_a: 'ana' }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 en diseno, de ana');

    const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a', 'carlos'], '2026-09-05', {
      repoCwd: repoRoot,
    });

    assert.equal(result.asignadoA, 'carlos');
    assert.equal(result.asignadoCambiado, true);
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.asignado_a, 'carlos');
  });
});

test('taskctl plan: el ID se lee de los posicionales, asi que --asignado-a puede ir delante', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700');

    const result = await runPlanCommand(tareasRoot, ['--asignado-a', 'carlos', 'TASK-700'], '2026-09-05', {
      repoCwd: repoRoot,
    });

    assert.equal(result.id, 'TASK-700');
    assert.equal(result.asignadoA, 'carlos');
  });
});

test('taskctl plan --asignado-a invalido: falla ANTES de mover la tarea ni cambiar de rama', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700');
    // Se arranca desde una rama que NO es la base, para que
    // ensureBaseBranchReady tenga algo que hacer si se llegara a
    // ejecutar. Si el flag se validara tarde, este test lo veria:
    // la rama activa habria cambiado a develop.
    git(['checkout', '-q', '-b', 'otra-rama'], repoRoot);

    await assert.rejects(
      () => runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a'], '2026-09-05', { repoCwd: repoRoot }),
      PlanCommandError
    );

    assert.equal(branchNow(repoRoot), 'otra-rama');
    // La tarea sigue donde estaba: nada se movio.
    await stat(path.join(tareasRoot, '00-planificadas', 'TASK-700', 'tarea.md'));
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'planificada');
    assert.equal(read?.task.asignado_a, null);
  });
});

// --- TASK-015 (item B7): en diseno NO hay limite ---

test('taskctl plan: NO comprueba el limite de WIP, aunque la persona tenga una tarea en curso', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // La decision #13 es explicita: el limite es unico y solo de
    // ejecucion. Disenar no consume el recurso escaso (la rama), asi
    // que se pueden tener varias tareas en diseno a la vez.
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-701', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-701-ya-abierta' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-700' }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'carlos con una tarea ya en curso');

    const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a', 'carlos'], '2026-09-05', {
      repoCwd: repoRoot,
    });

    assert.equal(result.asignadoA, 'carlos');
    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.asignado_a, 'carlos');
  });
});

// --- TASK-017: seleccion determinista de skill ------------------------

test('taskctl plan: una etiqueta que solapa con un unico skill del catalogo real lo deja en skills_recomendados', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ etiquetas: ['taskctl'] }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 con etiqueta taskctl');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot });

    assert.deepEqual(result.skillsRecomendados, ['task-workflow']);
    assert.equal(result.reglaSeleccionSkill, 'solape');
    assert.equal(result.skillsRecomendadosCambiado, true);
    assert.equal(result.avisoSkillSinCandidato, null);
    assert.equal(result.avisoSkillDesempatePendiente, null);
    assert.equal(result.peticionDesempateSkill, null);
    assert.equal(result.avisoSkillNoInstalada, null);

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.deepEqual(read?.task.skills_recomendados, ['task-workflow']);
    assert.equal(read?.task.regla_seleccion_skill, 'solape');
  });
});

test('taskctl plan: un empate en solape y prioridad escribe la peticion de desempate y deja skills_recomendados vacio', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // angular-vue-reviewer y java-spring-reviewer empatan: solape 1
    // (frontend / backend respectivamente) y misma prioridad (10).
    await writeTareaFile(tareasRoot, sampleTask({ etiquetas: ['frontend', 'backend'] }), BODY_CON_OBJETIVO);
    commitAll(repoRoot, 'tarea TASK-700 con etiquetas de dos dominios');

    const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot });

    assert.deepEqual(result.skillsRecomendados, []);
    assert.equal(result.reglaSeleccionSkill, null);
    assert.equal(result.skillsRecomendadosCambiado, false);
    assert.equal(result.avisoSkillSinCandidato, null);
    assert.ok(result.avisoSkillDesempatePendiente !== null);
    assert.match(result.avisoSkillDesempatePendiente!, /2 skills empatan/);
    assert.ok(result.peticionDesempateSkill !== null);

    // result.peticionDesempateSkill se recalcula sobre la carpeta de
    // DESTINO tras moveTareaFile (hallazgo IMPORTANTE de revision por
    // pares, TASK-017, IMP-2): antes apuntaba a la carpeta de origen,
    // que el rename ya se habia llevado.
    const planificacionDestino = path.join(path.dirname(result.filePath), PLANIFICACION_DIRNAME);
    assert.equal(
      result.peticionDesempateSkill,
      path.join(planificacionDestino, PETICION_DESEMPATE_SKILL_FILENAME)
    );
    assert.match(result.avisoSkillDesempatePendiente!, new RegExp(planificacionDestino.replace(/\\/g, '\\\\')));

    const peticionContent = await readFile(result.peticionDesempateSkill!, 'utf8');
    assert.match(peticionContent, /angular-vue-reviewer/);
    assert.match(peticionContent, /java-spring-reviewer/);

    const salidaContent = await readFile(
      path.join(planificacionDestino, SALIDA_DESEMPATE_SKILL_FILENAME),
      'utf8'
    );
    assert.match(salidaContent, /TASK-700/);

    const read = await readTareaFile(tareasRoot, 'TASK-700');
    assert.deepEqual(read?.task.skills_recomendados, []);
    assert.equal(read?.task.regla_seleccion_skill, null);
  });
});

test('taskctl plan: un skill externo ganador que no esta instalado deja el aviso de "/plugin install", y SI queda en skills_recomendados', async () => {
  const pluginRootTmp = await mkdtemp(path.join(tmpdir(), 'taskctl-plan-plugin-root-'));
  const previoPluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
  const marketplaceInventado = 'marketplace-inventado-para-el-test-de-plan';
  try {
    const scriptsDir = path.join(pluginRootTmp, 'scripts');
    await mkdir(scriptsDir, { recursive: true });
    // cargarHeuristica() usa el MISMO CLAUDE_PLUGIN_ROOT que
    // cargarCatalogoSkills() -- sin esta copia, runPlanCommand aborta
    // en la heuristica antes de llegar a la seleccion de skill.
    const heuristicaReal = await readFile(RUTA_HEURISTICA_REAL, 'utf8');
    await writeFile(path.join(scriptsDir, 'heuristica-complejidad.yml'), heuristicaReal, 'utf8');
    await writeFile(
      path.join(scriptsDir, 'catalogo-skills.yml'),
      [
        'total_skills: 1',
        'skill_1_id: skill-externo-de-prueba',
        'skill_1_origen: externo',
        `skill_1_marketplace: ${marketplaceInventado}`,
        'skill_1_rol: ejecucion',
        'skill_1_prioridad: 5',
        'skill_1_etiquetas: [etiqueta-unica-para-el-test-externo]',
        'skill_1_patrones_archivo: []',
        'skill_1_descripcion: "skill externo de prueba"',
        '',
      ].join('\n'),
      'utf8'
    );
    process.env['CLAUDE_PLUGIN_ROOT'] = pluginRootTmp;

    await withTempRepo(async (repoRoot, tareasRoot) => {
      await writeTareaFile(
        tareasRoot,
        sampleTask({ etiquetas: ['etiqueta-unica-para-el-test-externo'] }),
        BODY_CON_OBJETIVO
      );
      commitAll(repoRoot, 'tarea TASK-700 con etiqueta de skill externo');

      const result = await runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot });

      assert.deepEqual(result.skillsRecomendados, ['skill-externo-de-prueba']);
      assert.equal(result.reglaSeleccionSkill, 'solape');
      assert.ok(result.avisoSkillNoInstalada !== null);
      assert.match(
        result.avisoSkillNoInstalada!,
        new RegExp(`/plugin install skill-externo-de-prueba@${marketplaceInventado}`)
      );

      const read = await readTareaFile(tareasRoot, 'TASK-700');
      assert.deepEqual(read?.task.skills_recomendados, ['skill-externo-de-prueba']);
    });
  } finally {
    if (previoPluginRoot === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
    else process.env['CLAUDE_PLUGIN_ROOT'] = previoPluginRoot;
    await rm(pluginRootTmp, { recursive: true, force: true });
  }
});

test('taskctl plan: MEN-8 (revision por pares ronda 2) -- un catalogo de skills mal formado aborta ANTES de crear planificacion/, deja el workspace limpio', async () => {
  // cargarCatalogoSkills() se llama antes del mkdir/writeFile del
  // scaffold a proposito (ver el comentario en plan.ts junto a la
  // llamada): un catalogo corrupto tiene que abortar "plan" sin dejar
  // planificacion/ a medio crear, porque el guard de la seccion 8.3
  // bloquearia el reintento con un mensaje que no explica la causa
  // real. Este test fija ese orden como regresion.
  const pluginRootTmp = await mkdtemp(path.join(tmpdir(), 'taskctl-plan-plugin-root-'));
  const previoPluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
  try {
    const scriptsDir = path.join(pluginRootTmp, 'scripts');
    await mkdir(scriptsDir, { recursive: true });
    const heuristicaReal = await readFile(RUTA_HEURISTICA_REAL, 'utf8');
    await writeFile(path.join(scriptsDir, 'heuristica-complejidad.yml'), heuristicaReal, 'utf8');
    // Catalogo mal formado: le falta "total_skills". Cualquier fallo
    // de parseo vale para este test -- lo que se fija es el orden,
    // no la exhaustividad de la validacion (eso ya lo cubre
    // catalogo-skills.test.ts).
    await writeFile(path.join(scriptsDir, 'catalogo-skills.yml'), 'skill_1_id: x\n', 'utf8');
    process.env['CLAUDE_PLUGIN_ROOT'] = pluginRootTmp;

    await withTempRepo(async (repoRoot, tareasRoot) => {
      await writeTareaFile(tareasRoot, sampleTask({}), BODY_CON_OBJETIVO);
      commitAll(repoRoot, 'tarea TASK-700 para el test de catalogo corrupto');

      await assert.rejects(
        () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot }),
        CatalogoSkillsError
      );

      // La tarea NO se movio de 00-planificadas.
      await assert.doesNotReject(() => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700')));
      await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-700')));
      // Y planificacion/ no se llego a crear en ningun sitio.
      await assert.rejects(
        () => stat(path.join(tareasRoot, '00-planificadas', 'TASK-700', PLANIFICACION_DIRNAME))
      );
    });
  } finally {
    if (previoPluginRoot === undefined) delete process.env['CLAUDE_PLUGIN_ROOT'];
    else process.env['CLAUDE_PLUGIN_ROOT'] = previoPluginRoot;
    await rm(pluginRootTmp, { recursive: true, force: true });
  }
});
