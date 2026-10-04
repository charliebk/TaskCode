/**
 * Test de integracion real (no mocks) del auto-commit de taskctl
 * (TASK-030, item C2): repos Git temporales de verdad, incluido un
 * `origin` bare real para el `--push`, y la evidencia leida de Git
 * (`git show --stat`, `git status --porcelain`, `git log` del remoto)
 * en vez de fiarse de lo que devuelve la funcion.
 *
 * El test que manda es "no se lleva por delante el trabajo de la
 * persona": es la regla 1 del item y la razon de que exista este
 * modulo en vez de un `git add -A`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, rename, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  autoCommit,
  AutoCommitError,
  extraerPushFlag,
  mensajeChore,
} from '../../src/fs/git-commit.js';

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

/** Sin assert de exito: para comprobar estados que Git reporta con exit != 0. */
function gitRaw(args: string[], cwd: string): { status: number | null; stdout: string } {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout ?? '' };
}

async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-autocommit-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await mkdir(path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900'), { recursive: true });
    await writeFile(
      path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900', 'tarea.md'),
      'tarea inicial\n',
      'utf8'
    );
    await mkdir(path.join(repoRoot, 'src'), { recursive: true });
    await writeFile(path.join(repoRoot, 'src', 'algo.ts'), 'export const x = 1;\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

// ─── Regla 1: solo lo que taskctl acaba de escribir ────────────────────────

test('autoCommit NO se lleva el trabajo de la persona: su fichero sucio no entra en el commit y sigue sucio', async () => {
  await withTempRepo(async (repoRoot) => {
    // "La persona" tiene trabajo a medias en el arbol, ajeno a taskctl.
    const suyo = path.join(repoRoot, 'src', 'algo.ts');
    await writeFile(suyo, 'export const x = 1;\n// trabajo a medias de la persona\n', 'utf8');
    // Y ademas un fichero nuevo, sin seguimiento.
    await writeFile(path.join(repoRoot, 'src', 'borrador.ts'), 'borrador\n', 'utf8');

    // taskctl escribe lo suyo.
    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
    await writeFile(path.join(tareaDir, 'tarea.md'), 'tarea modificada por taskctl\n', 'utf8');

    const r = autoCommit({
      cwd: repoRoot,
      rutas: [tareaDir],
      mensaje: mensajeChore('TASK-900', 'tarea en diseno'),
    });

    assert.equal(r.commiteado, true);
    assert.deepEqual(r.ficheros, ['tareas/00-planificadas/TASK-900/tarea.md']);
    // TASK-039 (MEN-1 de su revision): el SHA sale ahora de `show --format=%h`;
    // tiene que ser el mismo que da Git para HEAD.
    assert.equal(r.commit, git(['rev-parse', '--short', 'HEAD'], repoRoot).trim());

    // Evidencia 1: el commit contiene EXACTAMENTE el fichero de taskctl.
    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
    assert.match(stat, /tareas[/\\]00-planificadas[/\\]TASK-900[/\\]tarea\.md/);
    assert.doesNotMatch(stat, /algo\.ts/);
    assert.doesNotMatch(stat, /borrador\.ts/);

    // Evidencia 2: el trabajo de la persona sigue exactamente donde estaba.
    const status = git(['status', '--porcelain'], repoRoot);
    assert.match(status, /^ M src\/algo\.ts$/m);
    assert.match(status, /^\?\? src\/borrador\.ts$/m);
    assert.doesNotMatch(status, /tareas\//);
  });
});

test('autoCommit respeta lo que la persona ya tenia PREPARADO con git add (modo --only)', async () => {
  await withTempRepo(async (repoRoot) => {
    const suyo = path.join(repoRoot, 'src', 'algo.ts');
    await writeFile(suyo, 'export const x = 2;\n', 'utf8');
    git(['add', 'src/algo.ts'], repoRoot); // la persona ya lo tenia en el indice
    await writeFile(suyo, 'export const x = 3;\n', 'utf8'); // y siguio editando

    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
    await writeFile(path.join(tareaDir, 'tarea.md'), 'tocado por taskctl\n', 'utf8');

    autoCommit({ cwd: repoRoot, rutas: [tareaDir], mensaje: 'chore(TASK-900): prueba' });

    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
    assert.doesNotMatch(stat, /algo\.ts/);
    // Sigue preparado Y modificado despues: "MM", igual que antes del commit.
    assert.match(git(['status', '--porcelain'], repoRoot), /^MM src\/algo\.ts$/m);
  });
});

test('autoCommit registra el MOVIMIENTO de carpeta (origen borrado + destino) en un solo commit', async () => {
  await withTempRepo(async (repoRoot) => {
    const origen = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
    const destino = path.join(repoRoot, 'tareas', '01-en-diseno', 'TASK-900');
    await mkdir(path.dirname(destino), { recursive: true });
    await rename(origen, destino);

    const r = autoCommit({
      cwd: repoRoot,
      rutas: [origen, destino],
      mensaje: mensajeChore('TASK-900', 'tarea en diseno'),
    });

    assert.equal(r.commiteado, true);
    // Nada queda pendiente bajo tareas/: el borrado del origen entro tambien.
    assert.doesNotMatch(git(['status', '--porcelain'], repoRoot), /tareas\//);
    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
    assert.match(stat, /01-en-diseno/);
  });
});

// ─── Regla 2: nada que commitear, ningun commit ────────────────────────────

test('autoCommit no crea commits vacios cuando el fichero ya estaba identico', async () => {
  await withTempRepo(async (repoRoot) => {
    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();
    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');

    const r = autoCommit({ cwd: repoRoot, rutas: [tareaDir], mensaje: 'chore(TASK-900): nada' });

    assert.equal(r.commiteado, false);
    assert.equal(r.commit, null);
    assert.deepEqual(r.ficheros, []);
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), antes);
  });
});

test('autoCommit ignora rutas que no existen ni en disco ni en el indice (carpeta de origen no versionada)', async () => {
  await withTempRepo(async (repoRoot) => {
    const inexistente = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-999');
    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
    await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio\n', 'utf8');

    // Sin el filtro, "git add -- tareas/00-planificadas/TASK-999" muere
    // con "fatal: pathspec ... did not match any files" (exit 128).
    const r = autoCommit({
      cwd: repoRoot,
      rutas: [inexistente, tareaDir],
      mensaje: 'chore(TASK-900): prueba',
    });
    assert.equal(r.commiteado, true);
  });
});

// ─── Regla 3: si el commit falla, se falla ruidosamente ────────────────────

test('autoCommit falla RUIDOSAMENTE si un hook de pre-commit rechaza, diciendo que esta escrito pero no registrado', async () => {
  await withTempRepo(async (repoRoot) => {
    const hook = path.join(repoRoot, '.git', 'hooks', 'pre-commit');
    await writeFile(hook, '#!/bin/sh\necho "el hook dice que no" >&2\nexit 1\n', 'utf8');
    await chmod(hook, 0o755);

    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
    await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio\n', 'utf8');
    const antes = git(['rev-parse', 'HEAD'], repoRoot).trim();

    await assert.rejects(
      async () =>
        autoCommit({ cwd: repoRoot, rutas: [tareaDir], mensaje: 'chore(TASK-900): con hook' }),
      (e: unknown) => {
        assert.ok(e instanceof AutoCommitError, `no es AutoCommitError: ${String(e)}`);
        assert.match(e.message, /escrita pero no registrada/);
        assert.match(e.message, /el hook dice que no/);
        return true;
      }
    );
    // Nada se ha commiteado, y los cambios siguen ahi (preparados).
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot).trim(), antes);
    assert.match(git(['status', '--porcelain'], repoRoot), /^M {2}tareas\//m);
  });
});

// ─── Guard contra el "git add -A" encubierto ───────────────────────────────

test('autoCommit rechaza la raiz del repo y cualquier ruta de fuera (no hay git add -A por la puerta de atras)', async () => {
  await withTempRepo(async (repoRoot) => {
    for (const ruta of [repoRoot, path.join(repoRoot, '.'), path.join(repoRoot, '..')]) {
      assert.throws(
        () => autoCommit({ cwd: repoRoot, rutas: [ruta], mensaje: 'chore(x): y' }),
        AutoCommitError,
        `deberia rechazar "${ruta}"`
      );
    }
  });
});

// ─── Regla 4: --push ───────────────────────────────────────────────────────

test('autoCommit --push: con un origin bare real, la rama llega al remoto', async () => {
  await withTempRepo(async (repoRoot) => {
    const bare = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-'));
    try {
      git(['init', '-q', '--bare', '-b', 'main', '.'], bare);
      git(['remote', 'add', 'origin', bare], repoRoot);

      const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
      await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio para subir\n', 'utf8');

      const r = autoCommit({
        cwd: repoRoot,
        rutas: [tareaDir],
        mensaje: mensajeChore('TASK-900', 'tarea en diseno'),
        push: true,
      });

      assert.equal(r.commiteado, true);
      assert.equal(r.push, 'empujado');
      assert.deepEqual(r.avisos, []);
      // Evidencia en el REMOTO, no en el resultado del comando.
      const enRemoto = git(['log', '--format=%s', '-1', 'develop'], bare).trim();
      assert.equal(enRemoto, 'chore(TASK-900): tarea en diseno');
    } finally {
      await rm(bare, { recursive: true, force: true });
    }
  });
});

test('autoCommit --push sin remoto: avisa y sigue (no lanza), y el commit local se hace igual', async () => {
  await withTempRepo(async (repoRoot) => {
    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
    await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio local\n', 'utf8');

    const r = autoCommit({
      cwd: repoRoot,
      rutas: [tareaDir],
      mensaje: 'chore(TASK-900): sin remoto',
      push: true,
    });

    assert.equal(r.commiteado, true);
    assert.equal(r.push, 'sin-remoto');
    assert.equal(r.avisos.length, 1);
    assert.match(r.avisos[0] as string, /no hay conexion con origin/i);
    assert.equal(git(['log', '--format=%s', '-1'], repoRoot).trim(), 'chore(TASK-900): sin remoto');
  });
});

test('autoCommit --push con HEAD desacoplado: avisa y no intenta subir nada', async () => {
  await withTempRepo(async (repoRoot) => {
    git(['checkout', '-q', '--detach', 'HEAD'], repoRoot);
    const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
    await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio en detached\n', 'utf8');

    const r = autoCommit({
      cwd: repoRoot,
      rutas: [tareaDir],
      mensaje: 'chore(TASK-900): detached',
      push: true,
    });

    assert.equal(r.push, 'sin-rama');
    assert.match(r.avisos[0] as string, /HEAD esta desacoplado/);
  });
});

test('autoCommit --push que falla de verdad: lanza diciendo que el commit SI se creo', async () => {
  await withTempRepo(async (repoRoot) => {
    // origin existe y responde a ls-remote, pero rechaza el push por
    // no ser fast-forward: el bare tiene un develop distinto.
    const bare = await mkdtemp(path.join(tmpdir(), 'taskctl-origin-'));
    const otro = await mkdtemp(path.join(tmpdir(), 'taskctl-otro-'));
    try {
      git(['init', '-q', '--bare', '-b', 'main', '.'], bare);
      git(['clone', '-q', bare, '.'], otro);
      git(['config', 'user.email', 'o@e.com'], otro);
      git(['config', 'user.name', 'Otro'], otro);
      await writeFile(path.join(otro, 'a.txt'), 'a\n', 'utf8');
      git(['add', '-A'], otro);
      git(['commit', '-q', '-m', 'ajeno'], otro);
      git(['push', '-q', 'origin', 'HEAD:develop'], otro);

      git(['remote', 'add', 'origin', bare], repoRoot);
      const tareaDir = path.join(repoRoot, 'tareas', '00-planificadas', 'TASK-900');
      await writeFile(path.join(tareaDir, 'tarea.md'), 'cambio\n', 'utf8');

      await assert.rejects(
        async () =>
          autoCommit({
            cwd: repoRoot,
            rutas: [tareaDir],
            mensaje: 'chore(TASK-900): push rechazado',
            push: true,
          }),
        (e: unknown) => {
          assert.ok(e instanceof AutoCommitError);
          assert.match(e.message, /quedo commiteado/);
          assert.match(e.message, /git push origin develop/);
          return true;
        }
      );
      // El commit local existe: el mensaje no miente.
      assert.equal(
        git(['log', '--format=%s', '-1'], repoRoot).trim(),
        'chore(TASK-900): push rechazado'
      );
      assert.equal(gitRaw(['diff', '--cached', '--quiet'], repoRoot).status, 0);
    } finally {
      await rm(otro, { recursive: true, force: true });
      await rm(bare, { recursive: true, force: true });
    }
  });
});

// ─── Mensajes y flags ──────────────────────────────────────────────────────

test('mensajeChore: formato del repo y rechazo de tildes (los scripts de Git-Flow los procesan)', () => {
  assert.equal(mensajeChore('TASK-030', 'tarea en curso'), 'chore(TASK-030): tarea en curso');
  assert.throws(() => mensajeChore('TASK-030', 'peticón de revisión'), AutoCommitError);
  assert.throws(() => mensajeChore('TASK-030', ''), AutoCommitError);
});

test('extraerPushFlag: saca --push y -p sin comerse el ID (parseArgs lo tomaria por valor del flag)', () => {
  assert.deepEqual(extraerPushFlag(['--push', 'TASK-030']), {
    push: true,
    resto: ['TASK-030'],
  });
  assert.deepEqual(extraerPushFlag(['TASK-030', '-p']), { push: true, resto: ['TASK-030'] });
  assert.deepEqual(extraerPushFlag(['TASK-030', '--asignado-a', 'ana']), {
    push: false,
    resto: ['TASK-030', '--asignado-a', 'ana'],
  });
});
