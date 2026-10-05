/**
 * Test de integracion real (no mocks) para taskctl start (TASK-009):
 * monta un repo Git temporal de verdad (main/develop), invoca los
 * scripts de scripts/gitflow/ tal cual estan en el repo, y comprueba
 * con evidencia (git branch --show-current, ubicacion real del
 * fichero) que la rama se crea y la tarea se mueve. Mismo espiritu que
 * scripts/gitflow/test/smoke-test.sh (TASK-008): "tests reales, no de
 * relleno" (principio de PLAN_SPRINTS.md).
 */
// Parte de los tests de start (ver test/helpers/start-fixtures.ts).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
import { TaskFolderConflictError } from '../../src/fs/task-store.js';
import { StateMachineError } from '../../src/core/state-machine.js';
import type { Task } from '../../src/core/task.js';

import {
  HERE,
  SCRIPTS_DIR,
  sampleTask,
  git,
  commitAll,
  withTempRepo,
} from '../helpers/start-fixtures.js';

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
