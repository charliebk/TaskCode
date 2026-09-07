/**
 * Test de integracion real (no mocks) para taskctl start (TASK-009):
 * monta un repo Git temporal de verdad (main/develop), invoca los
 * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
 * con evidencia (git branch --show-current, ubicacion real del
 * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
 * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
 * relleno" (principio de PLAN_SPRINTS.md).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
import { TaskFolderConflictError } from '../../src/fs/task-store.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/commands -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-500',
    titulo: 'Tarea de prueba de integracion',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-diseno',
    plan_aprobado: false,
    rama: 'feature/task-500-prueba-de-integracion',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
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

/**
 * writeTareaFile deja tareas/.../tarea.md sin commitear (es solo I/O de
 * disco, no toca Git). En uso real esa tarea.md ya estaria commiteada
 * (viene de un "taskctl plan"/"approve" previo) antes de que alguien
 * ejecute start, asi que los tests que prueban el camino feliz la
 * commitean aqui para dejar el workspace limpio antes de invocar
 * runStartCommand, igual que estaria en un uso real.
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
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-start-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    // Igual que en scripts/gitflow/test/smoke-test.sh: logs/ tiene que
    // estar en .gitignore ANTES del primer commit, o el propio uso de
    // Git-Flow se autobloquea (hallazgo 2 de TASK-007).
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
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

test('taskctl start: crea la rama de verdad y mueve la tarea a 02-en-curso (tipo feature)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar start.\n');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-500');
    assert.equal(result.rama, 'feature/task-500-prueba-de-integracion');
    assert.match(result.filePath, /02-en-curso[/\\]TASK-500[/\\]tarea\.md$/);

    // Evidencia real de Git, no solo el valor devuelto por el comando.
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');

    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-curso');
    assert.equal(read?.task.actualizado, '2026-09-04');

    // La carpeta vieja (01-en-diseno) no debe seguir existiendo.
    await assert.rejects(() => stat(path.join(tareasRoot, '01-en-diseno', 'TASK-500')));
  });
});

for (const tipo of ['fix', 'hotfix', 'release'] as const) {
  test(`taskctl start: tambien funciona para tipo "${tipo}" (repo sin origin)`, async () => {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      const task = sampleTask({
        id: 'TASK-501',
        tipo,
        rama: `${tipo}/task-501-prueba-${tipo}`,
      });
      await writeTareaFile(tareasRoot, task, '');
      commitAll(repoRoot, 'tarea(TASK-501): plan aprobado');

      const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-04', {
        repoCwd: repoRoot,
        scriptsDir: SCRIPTS_DIR,
      });

      assert.equal(result.rama, `${tipo}/task-501-prueba-${tipo}`);
      const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
      assert.equal(branch.stdout.trim(), `${tipo}/task-501-prueba-${tipo}`);

      // No basta con que el comando no lance: hay que confirmar que la
      // tarea de verdad quedo movida y con el contenido correcto (hallazgo
      // de revision por pares, TASK-009 — este es justo el caso, hotfix,
      // donde moveTareaFile necesito el fallback ENOENT porque Git ya
      // habia borrado la carpeta vieja del working tree al cambiar de
      // rama).
      const read = await readTareaFile(tareasRoot, 'TASK-501');
      assert.ok(read !== null, 'la tarea deberia poder releerse tras start');
      assert.equal(read?.task.estado, 'en-curso');
      assert.equal(read?.task.actualizado, '2026-09-04');
      assert.match(read?.filePath ?? '', /02-en-curso[/\\]TASK-501[/\\]tarea\.md$/);
    });
  });
}

test('taskctl start: rechaza un task.rama invalido para Git antes de invocar el script', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ rama: 'rama con espacios' }), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StartCommandError
    );

    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl start: si el script de Git-Flow falla (codigo != 0), no mueve la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    // Para forzar un fallo genuino del script (no simulado con mocks),
    // apuntamos runStartCommand a un scriptsDir con un create-feature.sh
    // que siempre termina en un codigo de error real.
    const brokenScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-broken-scripts-'));
    await writeFile(
      path.join(brokenScriptsDir, 'create-feature.sh'),
      '#!/usr/bin/env bash\nexit 7\n',
      'utf8'
    );

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
          repoCwd: repoRoot,
          scriptsDir: brokenScriptsDir,
        }),
      StartCommandError
    );

    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
    await rm(brokenScriptsDir, { recursive: true, force: true });
  });
});

test('taskctl start: si el script termina con codigo 0 pero la rama activa no coincide, no mueve la tarea (evidencia, no suposicion)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    // Script "malicioso/con bug": termina en codigo 0 sin haber creado
    // ni cambiado a la rama pedida. runStartCommand debe detectarlo con
    // git branch --show-current en vez de fiarse solo del exit code.
    const fakeScriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-fake-scripts-'));
    await writeFile(
      path.join(fakeScriptsDir, 'create-feature.sh'),
      '#!/usr/bin/env bash\nexit 0\n',
      'utf8'
    );

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', {
          repoCwd: repoRoot,
          scriptsDir: fakeScriptsDir,
        }),
      StartCommandError
    );

    // La rama activa sigue siendo develop (el script fake no la cambio).
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
    await rm(fakeScriptsDir, { recursive: true, force: true });
  });
});

test('taskctl start: rechaza una tarea en "planificada" (no ha pasado por plan) sin tocar Git ni mover nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ estado: 'planificada' }), '');

    await assert.rejects(
      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      StateMachineError
    );

    // No debe haberse creado ninguna rama nueva.
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    // La tarea sigue en 00-planificadas, no se movio.
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'planificada');
  });
});

test('taskctl start: rechaza una tarea de complejidad no trivial/simple sin plan_aprobado', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ complejidad: 'media', plan_aprobado: false }),
      ''
    );

    await assert.rejects(
      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      StateMachineError
    );
  });
});

test('taskctl start: rechaza si el workspace tiene cambios sin commitear, sin invocar el script', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');
    // Ensucia el workspace DESPUES de dejar la tarea commiteada, para
    // aislar especificamente el caso "hay cambios sin commitear" del
    // caso (ya cubierto arriba) de que la propia tarea.md este sin
    // commitear.
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'cambios sin commitear\n', 'utf8');

    await assert.rejects(
      () => runStartCommand(tareasRoot, ['TASK-500'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      StartCommandError
    );

    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl start: error claro si el ID no existe, sin efectos secundarios', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await assert.rejects(
      () => runStartCommand(tareasRoot, ['TASK-999'], '2026-09-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      StateMachineError
    );
  });
});

// --- item B6: --asignado-a ---

test('taskctl start --asignado-a: crea la rama Y deja asignado_a escrito en el frontmatter', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\
Probar start.\
');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'carlos'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'carlos');
    assert.equal(result.asignadoCambiado, true);
    // Evidencia real de Git: la rama existe de verdad, no solo el
    // campo escrito.
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');

    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'carlos');
    assert.equal(read?.task.estado, 'en-curso');
  });
});

test('taskctl start: sin --asignado-a hereda el asignado_a que dejo plan', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Es el caso que describe la seccion 8.2: plan asigna, y start
    // comprueba 'la persona asignada' sin volver a pedirla.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
    commitAll(repoRoot, 'tarea(TASK-500): asignada en plan');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'ana');
    assert.equal(result.asignadoCambiado, false);
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'ana');
  });
});

test('taskctl start --asignado-a: reasigna sobre lo que dejo plan', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana' }), '');
    commitAll(repoRoot, 'tarea(TASK-500): asignada a ana');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a=carlos'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'carlos');
    assert.equal(result.asignadoCambiado, true);
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'carlos');
  });
});

test('taskctl start --asignado-a invalido: falla ANTES de crear la rama', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask(), '');
    commitAll(repoRoot, 'tarea(TASK-500): plan aprobado');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500', '--asignado-a'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      StartCommandError
    );

    // Lo que de verdad importa del orden: la rama NO llego a
    // crearse. Si el flag se validara despues del script de
    // Git-Flow, quedaria una rama huerfana por cada intento fallido.
    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-500-prueba-de-integracion'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(ramas.stdout.trim(), '');
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');

    // Y la tarea sigue en 01-en-diseno, sin tocar.
    await stat(path.join(tareasRoot, '01-en-diseno', 'TASK-500', 'tarea.md'));
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-diseno');
    assert.equal(read?.task.asignado_a, null);
  });
});

// --- TASK-015 (item B7): limite de trabajo en curso ---

// El cableado del limite configurable (TASK-030, item C4) vive aqui y
// no en config.test.ts a proposito: los tests de alli son puros sobre
// tareasQueBloquean y pasaban igual con start.ts sin cablear — el
// hallazgo IMPORTANTE de la revision por pares fue justo ese, que
// deshacer la linea de start.ts no rompia ni un test. Esto pasa por
// runStartCommand de verdad.

test('taskctl start: limite_wip de .taskcode/config.yml manda de verdad (no solo en wip.ts)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-511', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-511-ya-abierta', titulo: 'La que ocupa hueco' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-512', asignado_a: 'carlos' }), '');
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'limite_wip: 2\n', 'utf8');
    commitAll(repoRoot, 'tareas y config con limite 2');

    // Con limite 2 cabe una segunda tarea: arranca y crea su rama.
    const r = await runStartCommand(tareasRoot, ['TASK-512'], '2026-09-07', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    assert.equal(r.id, 'TASK-512');
    assert.equal(
      spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' }).stdout.trim(),
      r.rama
    );
  });
});

test('taskctl start: con limite_wip 1 explicito en la config bloquea igual que sin fichero', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-521', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-521-ya-abierta', titulo: 'La que bloquea' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-522', asignado_a: 'carlos' }), '');
    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), 'limite_wip: 1\n', 'utf8');
    commitAll(repoRoot, 'tareas y config con limite 1');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-522'], '2026-09-07', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) => e instanceof StartCommandError && (e as Error).message.includes('TASK-521')
    );
  });
});

test('taskctl start: bloquea si la persona ya tiene otra tarea en curso, y NO crea la rama', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Una tarea de carlos ya en curso, con su rama abierta.
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-501-ya-abierta', titulo: 'La que bloquea' }),
      ''
    );
    // Y la que carlos intenta arrancar ahora.
    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-502', asignado_a: 'carlos' }), '');
    commitAll(repoRoot, 'tareas de carlos');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-502'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) =>
        e instanceof StartCommandError &&
        (e as Error).message.includes('TASK-501') &&
        (e as Error).message.includes('carlos')
    );

    // Lo que de verdad importa: no queda una rama huerfana ni la
    // tarea movida a medias.
    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-500-prueba-de-integracion'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(ramas.stdout.trim(), '');
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'develop');
    const read = await readTareaFile(tareasRoot, 'TASK-502');
    assert.equal(read?.task.estado, 'en-diseno');
  });
});

test('taskctl start: una tarea en revision tambien bloquea (la rama sigue abierta)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', estado: 'en-revision', asignado_a: 'carlos', rama: 'feature/task-501-en-revision' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-502', asignado_a: 'carlos' }), '');
    commitAll(repoRoot, 'carlos con una en revision');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-502'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) =>
        e instanceof StartCommandError && (e as Error).message.includes('03-en-revision')
    );
  });
});

test('taskctl start: la tarea en curso de OTRA persona no bloquea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'ana', rama: 'feature/task-501-de-ana' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
    commitAll(repoRoot, 'tareas de dos personas');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'carlos');
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
  });
});

test('taskctl start: sin identidad Git configurada, la tarea sigue sin asignar y no comprueba limite', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Comportamiento anterior a TASK-024, que se conserva cuando no
    // hay identidad. Se vacia user.email DESPUES de los commits (que
    // la necesitan): asi el repo no hereda tampoco la identidad
    // global de la maquina, que haria el test no determinista.
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: null, rama: 'feature/task-501-sin-duenno' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    commitAll(repoRoot, 'tareas sin asignar');
    git(['config', 'user.email', ''], repoRoot);

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, null);
    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
  });
});

test('taskctl start --asignado-a: el limite se comprueba a la persona NUEVA, no a la anterior', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // ana tiene una en curso; la tarea que arranca esta asignada a
    // carlos, pero se reasigna a ana en el propio start. Si el
    // limite se comprobara con el asignado ANTERIOR (carlos), esto
    // pasaria y dejaria a ana con dos ramas abiertas.
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'ana', rama: 'feature/task-501-de-ana' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
    commitAll(repoRoot, 'ana ocupada, tarea de carlos');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (e: unknown) =>
        e instanceof StartCommandError &&
        (e as Error).message.includes('ana') &&
        (e as Error).message.includes('TASK-501')
    );
  });
});

test('taskctl start --asignado-a: reasignar a alguien libre desbloquea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // La salida que ofrece el mensaje de error: reasignar. Si no
    // funcionara, el consejo del mensaje seria mentira.
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-501-de-carlos' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
    commitAll(repoRoot, 'carlos ocupado');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'ana');
    assert.equal(result.asignadoCambiado, true);
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'ana');
  });
});

test('taskctl start: un tarea.md ilegible en las carpetas de ejecucion aborta (fail-closed)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // No se sabe de quien es esa tarea: podria ser justo la que
    // bloquea. Dejar pasar aqui abriria una segunda rama.
    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-599');
    await mkdir(rota, { recursive: true });
    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
    commitAll(repoRoot, 'una tarea rota en curso');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof StartCommandError && (err as Error).message.includes('TASK-599')
    );
  });
});

test('taskctl start: una tarea rota en 00-planificadas NO bloquea a nadie', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // El fail-closed se acota a las carpetas que ocupan hueco: una
    // tarea rota en planificadas no puede tener una rama abierta.
    const rota = path.join(tareasRoot, '00-planificadas', 'TASK-599');
    await mkdir(rota, { recursive: true });
    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
    commitAll(repoRoot, 'una tarea rota en planificadas');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-500');
  });
});

// --- correcciones de la revision por pares de TASK-015 ---

test('taskctl start: un error de disco al comprobar el limite sale como StartCommandError', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // 02-en-curso como FICHERO en vez de carpeta: readdir da
    // ENOTDIR. Sin envolverlo, escapaba como Error crudo y el usuario
    // lo veia como 'taskctl no pudo arrancar', que es falso.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
    await writeFile(path.join(tareasRoot, '02-en-curso'), 'no soy una carpeta', 'utf8');
    commitAll(repoRoot, 'un fichero donde deberia haber una carpeta');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof StartCommandError &&
        (err as Error).message.includes('limite de trabajo en curso')
    );
  });
});

test('taskctl start: el mensaje nombra la carpeta donde ESTA la bloqueante', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Tarea fisicamente en 02-en-curso pero con estado terminada en
    // su frontmatter: bloquea (bien), y el mensaje debe mandar a
    // 02-en-curso, no a 04-terminadas, donde no hay nada.
    const dir = path.join(tareasRoot, '02-en-curso', 'TASK-501');
    await mkdir(dir, { recursive: true });
    const incoherente = sampleTask({ id: 'TASK-501', estado: 'terminada', asignado_a: 'carlos', rama: 'feature/task-501-incoherente' });
    await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(incoherente, ''), 'utf8');
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
    commitAll(repoRoot, 'una tarea con carpeta y estado incoherentes');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof StartCommandError &&
        (err as Error).message.includes('02-en-curso') &&
        !(err as Error).message.includes('04-terminadas')
    );
  });
});

// --- TASK-024 (item C7): identidad Git como asignado_a por defecto ---

test('taskctl start: una tarea sin asignar se autoasigna a la identidad Git', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    commitAll(repoRoot, 'tarea sin asignar');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // withTempRepo configura user.email como test@example.com.
    assert.equal(result.asignadoA, 'test@example.com');
    assert.equal(result.asignadoCambiado, true);
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.asignado_a, 'test@example.com');
  });
});

test('taskctl start: la identidad Git NO roba la tarea de otra persona', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // El asignado previo gana a la identidad de quien ejecuta. Sin
    // esto, arrancar la tarea de otra persona se la quedaria en
    // silencio y el limite de WIP se comprobaria contra la persona
    // equivocada.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
    commitAll(repoRoot, 'tarea de ana');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'ana@example.com');
    assert.equal(result.asignadoCambiado, false);
  });
});

test('taskctl start --asignado-a: el flag gana a la identidad Git', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    commitAll(repoRoot, 'tarea sin asignar');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'otra@example.com'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'otra@example.com');
  });
});

test('taskctl start: dos tareas sin asignar de la misma identidad chocan DENTRO de la misma rama', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Antes de TASK-024 ninguna de las dos tenia asignado_a, asi que
    // el limite no miraba nada. Ahora la primera se queda con la
    // identidad Git y la segunda choca contra ella.
    //
    // OJO con lo que este test NO demuestra (hallazgo de revision por
    // pares, TASK-024): aqui las dos invocaciones ocurren sin volver a
    // la rama base, y por eso la segunda ve a la primera en
    // 02-en-curso. En el flujo real, plan/new devuelven el repo a
    // develop — donde ese movimiento no esta commiteado — y el limite
    // NO se dispara. TASK-024 rellena asignado_a, que es condicion
    // necesaria pero no suficiente; lo otro se arregla aparte.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-501', asignado_a: null, rama: 'feature/task-501-segunda' }), '');
    commitAll(repoRoot, 'dos tareas sin asignar');

    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'la primera en curso');

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-05', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof StartCommandError &&
        (err as Error).message.includes('TASK-500') &&
        (err as Error).message.includes('test@example.com')
    );
  });
});

// --- correcciones de la revision por pares de TASK-024 ---

test('taskctl start: una identidad Git invalida no corrompe el frontmatter (CRITICO)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    commitAll(repoRoot, 'tarea sin asignar');
    // El salto de linea inyectaba una clave que pisaba 'estado'.
    git(['config', 'user.email', 'ana@x.com\nestado: terminada # '], repoRoot);

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, null);
    assert.ok(result.avisoIdentidad?.includes('saltos de linea'), String(result.avisoIdentidad));
    // Evidencia real: la tarea se relee y su estado es el correcto.
    const read = await readTareaFile(tareasRoot, 'TASK-500');
    assert.equal(read?.task.estado, 'en-curso');
    assert.equal(read?.task.asignado_a, null);
  });
});

test('taskctl start: avisa cuando arranca una tarea asignada a otra persona', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Quien abre la rama puede no ser quien planifico. No se cambia la
    // semantica (la tarea sigue siendo de ana), pero se dice en voz alta.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
    commitAll(repoRoot, 'tarea de ana');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.asignadoA, 'ana@example.com');
    assert.ok(result.avisoAtribucion?.includes('ana@example.com'), String(result.avisoAtribucion));
    assert.ok(result.avisoAtribucion?.includes('test@example.com'), String(result.avisoAtribucion));
  });
});

test('taskctl start: no avisa de atribucion cuando la tarea ya es tuya', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'test@example.com' }), '');
    commitAll(repoRoot, 'tarea propia');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.avisoAtribucion, null);
  });
});

test('taskctl start --asignado-a: pasar el flag silencia el aviso de atribucion', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
    commitAll(repoRoot, 'tarea de ana');

    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana@example.com'], '2026-09-05', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // Ha sido una decision explicita, no un descuido: no hay nada que avisar.
    assert.equal(result.avisoAtribucion, null);
  });
});

// --- TASK-025 (item C8): el limite ve las ramas de trabajo ---

test('taskctl start: bloquea aunque la tarea en curso solo exista en SU rama (el fallo de B7)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Este es el caso que B7 no cubria y que su smoke test no vio.
    // Se reproduce el flujo REAL: se arranca la primera tarea, se
    // commitea su movimiento EN SU RAMA, y se vuelve a develop — que
    // es lo que hacen plan/new/import — antes de arrancar la segunda.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
      ''
    );
    commitAll(repoRoot, 'dos tareas de carlos en diseno');

    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'TASK-500 en curso, EN SU RAMA');
    // De vuelta a la rama base: aqui TASK-500 sigue en 01-en-diseno.
    git(['checkout', '-q', 'develop'], repoRoot);

    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof StartCommandError &&
        (err as Error).message.includes('TASK-500') &&
        (err as Error).message.includes('feature/task-500-prueba-de-integracion')
    );

    // Y no se ha creado la rama de la segunda.
    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-501-segunda'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    assert.equal(ramas.stdout.trim(), '');
  });
});

test('taskctl start: una rama YA MERGEADA no bloquea, aunque siga viva', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Politica IECA: las ramas no se borran tras el merge. Sin el
    // filtro de mergeadas, cada tarea cerrada bloquearia para siempre.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
      ''
    );
    commitAll(repoRoot, 'dos tareas de carlos');

    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'TASK-500 en curso');
    // Se mergea la rama a develop, pero NO se borra.
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '--no-ff', '-q', '-m', 'merge de TASK-500', 'feature/task-500-prueba-de-integracion'], repoRoot);

    // Ahora TASK-500 SI esta en 02-en-curso en develop, asi que se
    // mueve a terminadas para aislar lo que este test comprueba: que
    // la RAMA mergeada no cuenta.
    const enCurso = (await readTareaFile(tareasRoot, 'TASK-500'))!;
    await moveTareaFile(tareasRoot, enCurso.filePath, { ...enCurso.task, estado: 'terminada' }, enCurso.body);
    commitAll(repoRoot, 'TASK-500 terminada');

    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-501');
  });
});

test('taskctl start: la rama de OTRA persona no bloquea, aunque este abierta', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-de-carlos' }),
      ''
    );
    commitAll(repoRoot, 'una de ana y una de carlos');

    // Ana abre su rama y la deja abierta.
    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'la de ana en curso');
    git(['checkout', '-q', 'develop'], repoRoot);

    // Carlos arranca la suya: la rama abierta de Ana no le afecta.
    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    assert.equal(result.id, 'TASK-501');
    assert.equal(result.asignadoA, 'carlos@example.com');
  });
});

test('taskctl start: reintentar una tarea cuya rama ya existe no la bloquea contra si misma', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // La rama existe y no esta mergeada, y su arbol tiene la tarea en
    // 02-en-curso: sin excluirla por ID, el reintento se bloquearia a
    // si mismo y no habria forma de salir.
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
    commitAll(repoRoot, 'tarea de carlos');
    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    commitAll(repoRoot, 'en curso en su rama');

    // Se simula el reintento: se vuelve a develop y se deja la tarea
    // otra vez en 01-en-diseno, con la rama ya creada.
    git(['checkout', '-q', 'develop'], repoRoot);
    const enDiseno = (await readTareaFile(tareasRoot, 'TASK-500'))!;
    assert.equal(enDiseno.task.estado, 'en-diseno');

    // El limite NO se dispara: la tarea no se bloquea a si misma
    // aunque su propia rama este abierta y tenga la tarea en curso.
    // El reintento si muere, pero por otra cosa y preexistente: el
    // checkout a la rama ya creada trae consigo la carpeta
    // 02-en-curso/TASK-500, y moveTareaFile se niega a pisarla. Lo
    // que este test fija es que el error NO es del limite de WIP.
    await assert.rejects(
      () =>
        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
          repoCwd: repoRoot,
          scriptsDir: SCRIPTS_DIR,
        }),
      (err: unknown) =>
        err instanceof TaskFolderConflictError &&
        !(err as Error).message.includes('sin cerrar')
    );
  });
});

test('taskctl start: un tarea.md roto en OTRA rama avisa, pero no bloquea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Hallazgo IMPORTANTE de revision por pares: al pasar a escanear
    // ramas, un fichero corrupto en cualquier rama ajena o abandonada
    // dejaba a TODO el mundo sin poder arrancar nada, y el remedio
    // ('arregla su frontmatter') era inaplicable sin hacer checkout de
    // esa rama. El coste de la duda lo pagaba quien no la creo.
    git(['checkout', '-q', '-b', 'feature/experimento-de-otro'], repoRoot);
    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-777');
    await mkdir(rota, { recursive: true });
    await writeFile(path.join(rota, 'tarea.md'), 'basura', 'utf8');
    commitAll(repoRoot, 'una tarea rota en una rama ajena');
    git(['checkout', '-q', 'develop'], repoRoot);

    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
    commitAll(repoRoot, 'tarea de carlos');

    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });

    // Arranca...
    assert.equal(result.id, 'TASK-500');
    // ...pero lo dice, con la rama delante para poder llegar al fichero.
    assert.equal(result.avisosWip.length, 1);
    assert.ok(result.avisosWip[0]?.includes('TASK-777'), result.avisosWip[0]);
    assert.ok(result.avisosWip[0]?.includes('experimento-de-otro'), result.avisosWip[0]);
  });
});
