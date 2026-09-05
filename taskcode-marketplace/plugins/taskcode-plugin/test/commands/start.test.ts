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
import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
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
function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
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

test('taskctl start: una tarea sin asignar no comprueba limite y arranca', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    // Comportamiento de todo lo anterior a B6: asignado_a nace a
    // null. Aunque haya otra tarea en curso, tambien sin asignar.
    await writeTareaFile(
      tareasRoot,
      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: null, rama: 'feature/task-501-sin-duenno' }),
      ''
    );
    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
    commitAll(repoRoot, 'tareas sin asignar');

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
