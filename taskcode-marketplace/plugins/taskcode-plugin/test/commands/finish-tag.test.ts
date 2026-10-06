/**
 * `taskctl finish --tag <nombre>` (TASK-060, criterios 2, 3, 4 y 11): repos
 * Git temporales de verdad, los scripts merge-*.sh reales y un remoto bare
 * local cuando el caso lo pide. La evidencia se lee de Git, no del resultado
 * del comando.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import {
  SCRIPTS_DIR,
  sampleTask,
  git,
  withTempRepo,
  setupTaskEnRevision,
} from '../helpers/finish-fixtures.js';
import { montarOrigin, tagsEnBare, ramaEnBare, URL_GITHUB } from '../helpers/finish-origin.js';

const HOY = '2026-10-06';

function finish(tareasRoot: string, repoRoot: string, argv: string[], avisos: string[] = []) {
  return runFinishCommand(tareasRoot, argv, HOY, {
    repoCwd: repoRoot,
    scriptsDir: SCRIPTS_DIR,
    onAviso: (a) => avisos.push(a),
  });
}

/** El tag es anotado (objeto `tag`, no un commit suelto) y su mensaje es el titulo. */
function mensajeDeTag(repoRoot: string, tag: string): string {
  assert.equal(git(['cat-file', '-t', `refs/tags/${tag}`], repoRoot).trim(), 'tag', 'el tag debe ser anotado');
  return git(['for-each-ref', '--format=%(contents:subject)', `refs/tags/${tag}`], repoRoot).trim();
}

/** Estado observable de "no se ha tocado nada": HEAD, develop y carpeta de la tarea. */
function huella(repoRoot: string, tareasRoot: string, id: string): string {
  return [
    git(['rev-parse', 'HEAD'], repoRoot).trim(),
    git(['rev-parse', 'develop'], repoRoot).trim(),
    git(['branch', '--show-current'], repoRoot).trim(),
    existsSync(path.join(tareasRoot, '03-en-revision', id, 'tarea.md')),
    git(['tag', '-l'], repoRoot).trim(),
  ].join('|');
}

test('finish --tag (feature): tag ANOTADO con el titulo como mensaje, sobre el commit de MERGE y no sobre HEAD', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ titulo: 'Titulo para el tag' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);

    const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1.0.0']);

    assert.equal(r.tag?.nombre, 'v1.0.0');
    assert.equal(r.tag?.creado, true);
    assert.equal(mensajeDeTag(repoRoot, 'v1.0.0'), 'Titulo para el tag');
    const destino = git(['rev-parse', 'v1.0.0^{commit}'], repoRoot).trim();
    // El merge es el padre del commit de cierre que taskctl hizo despues: HEAD NO es el objetivo.
    const head = git(['rev-parse', 'HEAD'], repoRoot).trim();
    assert.notEqual(destino, head);
    assert.equal(git(['rev-parse', 'HEAD~1'], repoRoot).trim(), destino);
    assert.match(git(['log', '-1', '--format=%s', destino], repoRoot), /merge\(feature\): feature\/task-700-prueba-finish -> develop/);
    assert.equal(git(['rev-list', '--parents', '-n', '1', destino], repoRoot).trim().split(' ').length, 3, 'es un commit de merge');
    assert.equal((await readTareaFile(tareasRoot, 'TASK-700'))?.task.estado, 'terminada');
  });
});

test('finish --tag=v2 (forma con igual) tambien vale, y sin --tag no se crea ningun tag', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-701', rama: 'fix/task-701-a', tipo: 'fix' }));
    const sin = await finish(tareasRoot, repoRoot, ['TASK-701']);
    assert.equal(sin.tag, null);
    assert.equal(git(['tag', '-l'], repoRoot).trim(), '', 'sin --tag no hay tag (comportamiento de hoy)');
  });
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-702', rama: 'fix/task-702-b', tipo: 'fix' }));
    await finish(tareasRoot, repoRoot, ['TASK-702', '--tag=v2']);
    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v2');
  });
});

test('finish --tag: un tag que YA EXISTE en local aborta ANTES de mergear, sin tocar nada', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    git(['tag', 'v1.0.0', 'main'], repoRoot);
    const antes = huella(repoRoot, tareasRoot, 'TASK-700');

    await assert.rejects(
      () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1.0.0']),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match((e as Error).message, /el tag "v1\.0\.0" ya existe en local/);
        assert.match((e as Error).message, /no se ha tocado nada/);
        return true;
      }
    );
    assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes);
    assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', task.rama, 'develop'], { cwd: repoRoot }).status, 1, 'no se mergeo');
  });
});

test('finish --tag: un tag que YA EXISTE en origin (y no en local) aborta antes de mergear', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot);
    try {
      git(['tag', 'v9', 'main'], repoRoot);
      git(['push', '-q', 'origin', 'refs/tags/v9'], repoRoot);
      git(['tag', '-d', 'v9'], repoRoot);
      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask());
      const antes = huella(repoRoot, tareasRoot, 'TASK-700');

      await assert.rejects(
        () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v9']),
        /el tag "v9" ya existe en origin/
      );
      assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes);
    } finally {
      await origin.limpiar();
    }
  });
});

test('finish --tag: nombre invalido (check-ref-format) o con "-" inicial aborta antes de mergear', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask());
    const antes = huella(repoRoot, tareasRoot, 'TASK-700');
    for (const malo of ['con espacio', 'a..b', 'a~b', 'termina.lock', '@{x}', '/empieza', 'v1.0/']) {
      await assert.rejects(
        () => finish(tareasRoot, repoRoot, ['TASK-700', `--tag=${malo}`]),
        /no es un nombre de tag valido/,
        malo
      );
    }
    // "-x" como valor se lee como opcion de git: se rechaza aunque refs/tags/-x sea legal.
    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag=-x']), /no es un nombre de tag valido/);
    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag=--delete']), /no es un nombre de tag valido/);
    // Y separado: el guard de flags desconocidos de TASK-047 lo para antes de nada.
    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', '-x']), /flag desconocido "-x"/);
    // --tag sin nombre, o repetido.
    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag']), /necesita un nombre/);
    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-700', '--tag=a', '--tag=b']), /repetido/);
    assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes, 'ningun rechazo toco nada');
  });
});

test('finish --tag: reintento con el tag PROPIO ya puesto sobre el merge de esta tarea se salta, y cierra', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    // Fallo parcial simulado: el merge y el tag estan hechos, la tarea sin mover.
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge manual'], repoRoot);
    git(['tag', '-a', 'v3', '-m', 'puesto antes', 'HEAD'], repoRoot);
    git(['checkout', '-q', task.rama], repoRoot);

    const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v3']);

    assert.equal(r.tag?.creado, false, 'no se vuelve a crear');
    assert.equal(mensajeDeTag(repoRoot, 'v3'), 'puesto antes', 'no se reescribe');
    assert.equal((await readTareaFile(tareasRoot, 'TASK-700'))?.task.estado, 'terminada');
  });
});

test('finish --tag: reintento con un tag AJENO (apunta a otro commit) aborta sin mover la tarea', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge manual'], repoRoot);
    git(['tag', 'ajeno', 'main'], repoRoot);
    git(['checkout', '-q', task.rama], repoRoot);
    const antes = huella(repoRoot, tareasRoot, 'TASK-700');

    await assert.rejects(
      () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'ajeno']),
      /el tag "ajeno" ya existe en local y NO apunta al merge de esta tarea/
    );
    assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes);
    // Con otro nombre el mismo reintento si cierra: el merge hecho se reconoce.
    const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'propio']);
    assert.equal(r.tag?.creado, true);
    assert.equal(git(['rev-parse', 'propio^{commit}'], repoRoot).trim(), git(['rev-parse', 'develop~1'], repoRoot).trim());
  });
});

test('finish --tag --push: el tag llega al bare y el bare ya tiene la rama destino; sin --push queda local y la salida lo dice', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot);
    try {
      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask());
      const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1.0.0', '--push']);
      assert.equal(r.tag?.subida, 'subido');
      assert.deepEqual(tagsEnBare(origin.bare), ['v1.0.0']);
      // El tag remoto es el mismo objeto anotado y apunta al merge, contenido en develop del bare.
      assert.equal(
        git(['--git-dir', origin.bare, 'rev-parse', 'v1.0.0^{commit}'], repoRoot).trim(),
        git(['rev-parse', 'v1.0.0^{commit}'], repoRoot).trim()
      );
      assert.equal(ramaEnBare(origin.bare, 'develop'), git(['rev-parse', 'develop'], repoRoot).trim());
    } finally {
      await origin.limpiar();
    }
  });
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot);
    try {
      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-703', rama: 'feature/task-703-sin-push' }));
      const r = await finish(tareasRoot, repoRoot, ['TASK-703', '--tag', 'v1.0.1']);
      assert.equal(r.tag?.subida, 'no-solicitada');
      assert.deepEqual(tagsEnBare(origin.bare), [], 'sin --push el tag no sale de local');
      assert.equal(git(['tag', '-l', 'v1.0.1'], repoRoot).trim(), 'v1.0.1');
    } finally {
      await origin.limpiar();
    }
  });
});

test('finish --tag --push con origin caido aborta ANTES de mergear; sin --push avisa y deja el tag en local', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot);
    try {
      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask());
      // Origin "cae": el bare desaparece de la regla de reescritura.
      git(['config', `url.${path.join(origin.bare, 'no-existe').replace(/\\/g, '/')}.insteadOf`, URL_GITHUB], repoRoot);
      git(['config', '--unset-all', `url.${origin.bare.replace(/\\/g, '/')}.insteadOf`], repoRoot);
      const antes = huella(repoRoot, tareasRoot, 'TASK-700');
      await assert.rejects(
        () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1', '--push']),
        /origin no responde y con --push no se puede comprobar/
      );
      assert.equal(huella(repoRoot, tareasRoot, 'TASK-700'), antes);
    } finally {
      await origin.limpiar();
    }
  });
});

test('finish --tag (hotfix): --tag SUSTITUYE el nombre del script, un solo tag, anotado, sobre el merge a main', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-710', tipo: 'hotfix', rama: 'hotfix/task-710-urgente' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });

    const r = await finish(tareasRoot, repoRoot, ['TASK-710', '--tag', 'v2.0.1']);

    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v2.0.1', 'UN solo tag, con el nombre dado (no task-710-urgente)');
    assert.equal(git(['cat-file', '-t', 'refs/tags/v2.0.1'], repoRoot).trim(), 'tag');
    assert.equal(
      git(['rev-parse', 'v2.0.1^{commit}'], repoRoot).trim(),
      git(['rev-parse', 'main'], repoRoot).trim(),
      'el tag esta sobre la punta de main, el merge'
    );
    assert.match(git(['log', '-1', '--format=%s', 'main'], repoRoot), /merge\(hotfix\)/);
    assert.equal(r.tag?.rama, 'main');
    assert.equal((await readTareaFile(tareasRoot, 'TASK-710'))?.task.estado, 'terminada');
  });
});

test('finish --tag (release): igual que hotfix, y sin --tag el script sigue poniendo el suyo', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-711', tipo: 'release', rama: 'release/task-711-q4' }));
    await finish(tareasRoot, repoRoot, ['TASK-711', '--tag', 'v4.0.0']);
    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v4.0.0');
  });
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-712', tipo: 'release', rama: 'release/task-712-q5' }));
    await finish(tareasRoot, repoRoot, ['TASK-712']);
    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'task-712-q5', 'sin --tag: el nombre calculado de siempre');
  });
});

test('finish --tag (hotfix): un tag ya existente aborta antes de que el script toque main', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-713', tipo: 'hotfix', rama: 'hotfix/task-713-x' }), { base: 'main' });
    git(['tag', 'v7', 'main'], repoRoot);
    const mainAntes = git(['rev-parse', 'main'], repoRoot).trim();
    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-713', '--tag', 'v7']), /el tag "v7" ya existe en local/);
    assert.equal(git(['rev-parse', 'main'], repoRoot).trim(), mainAntes);
  });
});

test('finish --tag (hotfix) reintento: con el merge ya hecho se reconoce SU tag; otro nombre NO crea un segundo tag', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-714', tipo: 'hotfix', rama: 'hotfix/task-714-y' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task, { base: 'main' });
    // Merge a main y backmerge ya consumados, con un tag propio.
    git(['checkout', '-q', 'main'], repoRoot);
    git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge manual'], repoRoot);
    git(['tag', '-a', 'v8', '-m', 'hotfix', 'HEAD'], repoRoot);
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--no-ff', task.rama, '-m', 'backmerge manual'], repoRoot);
    git(['checkout', '-q', task.rama], repoRoot);

    await assert.rejects(() => finish(tareasRoot, repoRoot, ['TASK-714', '--tag', 'v9']), /lleva un solo tag/);
    assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v8');
    await finish(tareasRoot, repoRoot, ['TASK-714', '--tag', 'v8']);
    assert.equal((await readTareaFile(tareasRoot, 'TASK-714'))?.task.estado, 'terminada');
  });
});

test('finish --tag --push (hotfix): el tag solo se sube si main ya esta en origin con ese commit; si no, queda local y se dice', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot);
    try {
      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-715', tipo: 'hotfix', rama: 'hotfix/task-715-z' }), { base: 'main' });
      const r = await finish(tareasRoot, repoRoot, ['TASK-715', '--tag', 'v5', '--push']);
      // finish --push sube develop, no main: el tag NO puede ir a un remoto que no tiene su commit en main.
      assert.equal(r.tag?.subida, 'rama-no-publicada');
      assert.deepEqual(tagsEnBare(origin.bare), []);
      // Con main ya publicada, subir el tag a mano es lo que se indica; y el helper lo comprueba.
      git(['push', '-q', 'origin', 'main'], repoRoot);
      assert.equal(ramaEnBare(origin.bare, 'main'), git(['rev-parse', 'main'], repoRoot).trim());
    } finally {
      await origin.limpiar();
    }
  });
});

test('finish --tag --push: reintento con el tag propio ya en origin sobre ese commit no lo vuelve a subir', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const origin = await montarOrigin(repoRoot);
    try {
      const task = sampleTask();
      await setupTaskEnRevision(repoRoot, tareasRoot, task);
      git(['checkout', '-q', 'develop'], repoRoot);
      git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge manual'], repoRoot);
      git(['tag', '-a', 'v6', '-m', 'ya', 'HEAD'], repoRoot);
      git(['push', '-q', 'origin', 'develop', 'refs/tags/v6'], repoRoot);
      git(['checkout', '-q', task.rama], repoRoot);
      const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v6', '--push']);
      assert.equal(r.tag?.creado, false);
      assert.equal(r.tag?.subida, 'ya-en-remoto');
    } finally {
      await origin.limpiar();
    }
  });
});

test('finish --tag (feature) sin commit de merge localizable: aborta con el merge hecho y la tarea sin mover', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    // Rama integrada por fast-forward: no existe commit de merge en el que poner el tag.
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--ff-only', task.rama], repoRoot);
    git(['checkout', '-q', task.rama], repoRoot);
    await assert.rejects(
      () => finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v1']),
      /no se encuentra el commit de merge/
    );
    assert.equal(git(['tag', '-l'], repoRoot).trim(), '');
    assert.ok(existsSync(path.join(tareasRoot, '03-en-revision', 'TASK-700', 'tarea.md')));
  });
});

test('finish --tag: con commits POSTERIORES al merge en develop el tag va sobre el merge de la tarea, no sobre HEAD', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const task = sampleTask();
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    // Merge ya hecho (reintento) y despues alguien mas integro algo en develop.
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--no-ff', task.rama, '-m', 'merge de la tarea'], repoRoot);
    const merge = git(['rev-parse', 'HEAD'], repoRoot).trim();
    git(['commit', '-q', '--allow-empty', '-m', 'trabajo ajeno posterior 1'], repoRoot);
    git(['commit', '-q', '--allow-empty', '-m', 'trabajo ajeno posterior 2'], repoRoot);
    const head = git(['rev-parse', 'HEAD'], repoRoot).trim();
    git(['checkout', '-q', task.rama], repoRoot);

    const r = await finish(tareasRoot, repoRoot, ['TASK-700', '--tag', 'v10']);

    assert.equal(r.tag?.commit, merge);
    assert.equal(git(['rev-parse', 'v10^{commit}'], repoRoot).trim(), merge, 'sobre el merge de la tarea');
    assert.notEqual(git(['rev-parse', 'v10^{commit}'], repoRoot).trim(), head, 'no sobre HEAD de develop');
  });
});
