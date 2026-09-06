/**
 * Test de integracion real (no mocks) de los cinco wrappers de
 * Git-Flow (TASK-026, item C1): repos Git temporales de verdad, los
 * scripts de scripts/gitflow/ tal cual estan en el repo, y un merge
 * en conflicto y un stash de verdad donde hacen falta.
 *
 * Que 'inherit' deja llegar una respuesta al ead -rp del script,
 * y que el default 'ignore' no, se distingue en
 * test/fs/gitflow-runner.test.ts, con un proceso hijo de stdin
 * controlado. Lo que se comprueba aqui es el contrato del wrapper:
 * sin terminal se toma el valor por defecto de cada pregunta,
 * avisando de cual, y se corta antes de invocar cuando ese valor
 * haria lo contrario de lo que anuncia el comando.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  runWrapperCommand,
  isWrapperCommand,
  WrapperCommandError,
  WRAPPER_NAMES,
  type WrapperName,
} from '../../src/commands/wrappers.js';
import { operacionEnCurso } from '../../src/fs/git.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.join(HERE, '..', '..', '..');
const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'gitflow');
const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');

/** Directorio que no existe: si el wrapper llegase a lanzar el script,
 *  devolveria un codigo de salida en vez de lanzar WrapperCommandError.
 *  Es la forma de aseverar "aborto ANTES de invocar bash". */
const SCRIPTS_DIR_INEXISTENTE = path.join(tmpdir(), 'taskctl-scripts-que-no-existen');

/** Doble mudo: un script que no pregunta nada y contesta 21. Es lo que
 *  permite recorrer la rama interactiva (interactivo: true, sin
 *  guards) en un test, donde no hay terminal de verdad: con el script
 *  real, su `read -rp` se quedaria esperando una respuesta que no
 *  llega nunca y colgaria la suite. */
const DOBLE_MUDO_21 = `#!/usr/bin/env bash
exit 21
`;

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

interface RunOpts {
  interactivo?: boolean;
  scriptsDir?: string;
}

function run(
  nombre: WrapperName,
  argv: readonly string[],
  repoCwd: string,
  opts: RunOpts = {}
): { code: number; avisos: string[]; emitidos: string[] } {
  const emitidos: string[] = [];
  const result = runWrapperCommand(nombre, argv, {
    repoCwd,
    scriptsDir: opts.scriptsDir ?? SCRIPTS_DIR,
    interactivo: opts.interactivo ?? false,
    onAviso: (aviso) => emitidos.push(aviso),
  });
  return { code: result.code, avisos: result.avisos, emitidos };
}

function capturaError(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (e) {
    return e;
  }
}

/**
 * El `.gitignore` con `logs/` NO es decorado: todos los scripts de
 * Git-Flow llaman a `initialize_gitflow_log`, que crea `logs/gitflow/`
 * dentro del repo. Sin ignorarlo, el propio script deja el workspace
 * sucio y `pause-work.sh` acaba preguntando que hacer con un
 * directorio que acaba de crear el. El repo TaskCode ya lo ignora
 * (.gitignore, linea 14) y el resto de tests de comandos hacen lo
 * mismo.
 */
async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

async function withTempDirSinRepo(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-sin-repo-'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// ── Tabla de comandos ───────────────────────────────────────────────

test('isWrapperCommand: reconoce los cinco y nada mas', () => {
  assert.deepEqual([...WRAPPER_NAMES], [
    'diagnose',
    'pause',
    'resume',
    'recover',
    'abort-merge',
  ]);
  for (const nombre of WRAPPER_NAMES) {
    assert.equal(isWrapperCommand(nombre), true, nombre);
  }
  for (const otro of ['start', 'finish', 'board', 'diagnose-repo', '', 'constructor']) {
    assert.equal(isWrapperCommand(otro), false, otro);
  }
});

// ── Precondicion: estar en un repositorio Git ───────────────────────

test('los cinco abortan fuera de un repositorio Git, sin llegar a lanzar bash', async () => {
  await withTempDirSinRepo(async (dir) => {
    for (const nombre of WRAPPER_NAMES) {
      const argv = nombre === 'resume' || nombre === 'recover' ? ['alguna-rama'] : [];
      const error = capturaError(() =>
        run(nombre, argv, dir, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
      );
      assert.ok(error instanceof WrapperCommandError, `${nombre}: ${String(error)}`);
      assert.match((error as Error).message, /dentro del arbol de trabajo de un repositorio Git/);
      assert.match((error as Error).message, new RegExp(`taskctl ${nombre}`));
    }
  });
});

// ── Validacion de argumentos ────────────────────────────────────────

test('diagnose y abort-merge no aceptan argumentos', async () => {
  await withTempRepo(async (repoRoot) => {
    for (const nombre of ['diagnose', 'abort-merge'] as const) {
      const error = capturaError(() =>
        run(nombre, ['algo'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
      );
      assert.ok(error instanceof WrapperCommandError, nombre);
      assert.match((error as Error).message, /no acepta argumentos/);
    }
  });
});

test('pause solo admite --push y -p, y se los pasa al script', async () => {
  await withTempRepo(async (repoRoot) => {
    const error = capturaError(() =>
      run('pause', ['--forzar'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
    );
    assert.ok(error instanceof WrapperCommandError);
    assert.match((error as Error).message, /solo admite --push y -p/);

    // Las dos grafias validas llegan al script, tal cual y sin
    // duplicar: se comprueba con un doble del script que escribe sus
    // argumentos, no con el pause-work.sh real (que haria un push).
    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
    try {
      await writeFile(
        path.join(scriptsDir, 'pause-work.sh'),
        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > args.txt\n',
        'utf8'
      );
      for (const opcion of ['--push', '-p']) {
        assert.equal(run('pause', [opcion, opcion], repoRoot, { scriptsDir }).code, 0);
        const argsPath = path.join(repoRoot, 'args.txt');
        assert.equal(
          await readFile(argsPath, 'utf8'),
          `${opcion}\n`,
          `${opcion} deberia llegar una sola vez`
        );
        await rm(argsPath);
      }
    } finally {
      await rm(scriptsDir, { recursive: true, force: true });
    }
  });
});

test('resume pasa el nombre de rama al script como argumento posicional', async () => {
  await withTempRepo(async (repoRoot) => {
    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
    try {
      await writeFile(
        path.join(scriptsDir, 'resume-work.sh'),
        '#!/usr/bin/env bash\nprintf "%s\\n" "$@" > args.txt\n',
        'utf8'
      );
      assert.equal(run('resume', ['feature/algo'], repoRoot, { scriptsDir }).code, 0);
      assert.equal(await readFile(path.join(repoRoot, 'args.txt'), 'utf8'), 'feature/algo\n');
    } finally {
      await rm(scriptsDir, { recursive: true, force: true });
    }
  });
});

test('resume --push mi-rama no se lleva "--push" como nombre de rama', async () => {
  await withTempRepo(async (repoRoot) => {
    const error = capturaError(() =>
      run('resume', ['--push', 'mi-rama'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
    );
    assert.ok(error instanceof WrapperCommandError);
    assert.match((error as Error).message, /no admite ninguna opcion/);
    assert.match((error as Error).message, /--push/);
  });
});

test('resume y recover aceptan un solo nombre de rama', async () => {
  await withTempRepo(async (repoRoot) => {
    for (const nombre of ['resume', 'recover'] as const) {
      const error = capturaError(() =>
        run(nombre, ['una', 'otra'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
      );
      assert.ok(error instanceof WrapperCommandError, nombre);
      assert.match((error as Error).message, /un solo nombre de rama/);
    }
  });
});

test('un nombre de rama con formato invalido se rechaza antes de invocar el script', async () => {
  await withTempRepo(async (repoRoot) => {
    const error = capturaError(() =>
      run('resume', ['rama con espacios'], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
    );
    assert.ok(error instanceof WrapperCommandError);
    assert.match((error as Error).message, /no es un nombre de rama valido/);
  });
});

// ── Sin terminal: cuando corta y cuando no ──────────────────────────

test('diagnose funciona sin terminal y sin avisos: no pregunta nada', async () => {
  await withTempRepo(async (repoRoot) => {
    const result = run('diagnose', [], repoRoot);
    assert.equal(result.code, 0);
    assert.deepEqual(result.avisos, []);
  });
});

test('pause sin terminal y con el workspace limpio sigue adelante', async () => {
  await withTempRepo(async (repoRoot) => {
    const result = run('pause', [], repoRoot);
    assert.equal(result.code, 0);
    assert.deepEqual(result.avisos, []);
  });
});

test('pause sin terminal y con el workspace sucio aborta y no toca nada', async () => {
  await withTempRepo(async (repoRoot) => {
    await writeFile(path.join(repoRoot, 'sin-guardar.txt'), 'trabajo a medias\n', 'utf8');
    const estadoAntes = git(['status', '--porcelain'], repoRoot);
    const headAntes = git(['rev-parse', 'HEAD'], repoRoot);

    const error = capturaError(() => run('pause', [], repoRoot));

    assert.ok(error instanceof WrapperCommandError);
    assert.match((error as Error).message, /commit o como stash/);
    assert.match((error as Error).message, /no hay terminal interactiva/);
    // Y sobre todo: el trabajo sin guardar sigue exactamente donde
    // estaba, sin stash nuevo ni commit nuevo.
    assert.equal(git(['status', '--porcelain'], repoRoot), estadoAntes);
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), headAntes);
    assert.equal(git(['stash', 'list'], repoRoot), '');
  });
});

test('pause sin terminal aborta si el repo no ignora logs/, aunque el workspace este limpio', async () => {
  // Repo SIN "logs/" en .gitignore: el propio pause-work.sh crea
  // logs/gitflow/ al arrancar y despues ve el workspace sucio por su
  // culpa, pregunta, y con EOF por respuesta muere con "Opcion no
  // reconocida" y exit 1 — el fallo que este comando venia a quitar
  // de en medio (hallazgo IMPORTANTE de revision por pares).
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sinlogs-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# sin ignorar logs\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    assert.equal(git(['status', '--porcelain'], repoRoot), '', 'el workspace parte limpio');

    const error = capturaError(() => run('pause', [], repoRoot));

    assert.ok(error instanceof WrapperCommandError);
    assert.match((error as Error).message, /este repo no lo ignora/);
    assert.match((error as Error).message, /\.gitignore/);
    // Y no se llego a invocar el script: el repo sigue sin logs/.
    assert.equal(git(['status', '--porcelain'], repoRoot), '');
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('pause sin terminal NO aborta si el registro esta ignorado por un patron que no es "logs/"', async () => {
  // El guard pregunta por el fichero que escriben los scripts, no por
  // la carpeta: un .gitignore con "logs/gitflow/" ignora el registro
  // igual de bien, y abortar ahi seria un falso positivo (hallazgo
  // MENOR de revision por pares, ronda 2).
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-otroignore-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/gitflow/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# otro patron\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);

    const result = run('pause', [], repoRoot);
    assert.equal(result.code, 0);
    assert.equal(git(['status', '--porcelain'], repoRoot), '', 'el registro quedo ignorado');
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('abort-merge sin terminal y sin nada en curso informa y sale 0', async () => {
  await withTempRepo(async (repoRoot) => {
    const result = run('abort-merge', [], repoRoot);
    assert.equal(result.code, 0);
  });
});

test('abort-merge sin terminal y con un merge en conflicto aborta el comando, no el merge', async () => {
  await withTempRepo(async (repoRoot) => {
    const fichero = path.join(repoRoot, 'a.txt');
    await writeFile(fichero, 'base\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'base'], repoRoot);

    git(['checkout', '-q', '-b', 'otra'], repoRoot);
    await writeFile(fichero, 'version de otra\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'cambio en otra'], repoRoot);

    git(['checkout', '-q', 'main'], repoRoot);
    await writeFile(fichero, 'version de main\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'cambio en main'], repoRoot);

    const merge = spawnSync('git', ['merge', 'otra'], { cwd: repoRoot, encoding: 'utf8' });
    assert.notEqual(merge.status, 0, 'el merge deberia haber conflictado');
    assert.equal(operacionEnCurso(repoRoot), 'merge');

    const error = capturaError(() => run('abort-merge', [], repoRoot));

    assert.ok(error instanceof WrapperCommandError);
    assert.match((error as Error).message, /confirmar contigo/);
    assert.match((error as Error).message, /git merge --abort/);
    // Lo importante: el merge SIGUE en curso. Sin este guard, el
    // script habria contestado que no y habria salido con codigo 0,
    // como si hubiera terminado su trabajo.
    assert.equal(operacionEnCurso(repoRoot), 'merge');
  });
});

test('resume y recover sin rama y sin terminal dicen como invocarlos', async () => {
  await withTempRepo(async (repoRoot) => {
    for (const nombre of ['resume', 'recover'] as const) {
      const error = capturaError(() =>
        run(nombre, [], repoRoot, { scriptsDir: SCRIPTS_DIR_INEXISTENTE })
      );
      assert.ok(error instanceof WrapperCommandError, nombre);
      assert.match((error as Error).message, /no hay terminal interactiva/);
      assert.match((error as Error).message, new RegExp(`taskctl ${nombre} <rama>`));
    }
  });
});

test('resume y recover con rama y sin terminal avisan del valor por defecto ANTES de lanzar', async () => {
  await withTempRepo(async (repoRoot) => {
    const resume = run('resume', ['main'], repoRoot);
    assert.equal(resume.avisos.length, 1);
    assert.deepEqual(resume.emitidos, resume.avisos);
    assert.match(resume.avisos[0] as string, /aplicara sin preguntar/);
    // Sin "origin" configurado, resume-work.sh muere en su "fetch
    // origin" sin guard: es el bug conocido del item C6, que esta
    // tarea NO tapa a proposito.
    assert.notEqual(resume.code, 0);

    const recover = run('recover', ['main'], repoRoot);
    assert.equal(recover.avisos.length, 1);
    assert.match(recover.avisos[0] as string, /cancelara/);
  });
});

// ── Propagacion del codigo de salida ────────────────────────────────

test('el codigo de salida del script se propaga tal cual, sin colapsarlo a 0 o 1', async () => {
  await withTempRepo(async (repoRoot) => {
    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
    try {
      await writeFile(
        path.join(scriptsDir, 'diagnose-repo.sh'),
        '#!/usr/bin/env bash\nexit 42\n',
        'utf8'
      );
      assert.equal(run('diagnose', [], repoRoot, { scriptsDir }).code, 42);
    } finally {
      await rm(scriptsDir, { recursive: true, force: true });
    }
  });
});

// ── Herencia de stdin de punta a punta ──────────────────────────────

/**
 * Repo con un "origin" real (segundo repo temporal, bare) y una rama
 * con un stash de los que crea "taskctl pause". Es el escenario
 * minimo en el que resume-work.sh llega de verdad a su `read -rp`.
 */
async function withRepoConStash(
  fn: (repoRoot: string, rama: string) => Promise<void>
): Promise<void> {
  const originRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-origin-'));
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wrap-stash-'));
  const rama = 'feature/con-stash';
  try {
    git(['init', '-q', '--bare', '-b', 'main'], originRoot);

    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    git(['remote', 'add', 'origin', originRoot], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo con stash\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['push', '-q', '-u', 'origin', 'main'], repoRoot);

    git(['checkout', '-q', '-b', rama], repoRoot);
    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'primera version\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'trabajo de la rama'], repoRoot);
    git(['push', '-q', '-u', 'origin', rama], repoRoot);

    // El stash tal y como lo deja pause-work.sh: "pause: <rama> <fecha>".
    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'cambios a medias\n', 'utf8');
    git(['stash', 'push', '-u', '-m', `pause: ${rama} 2026-09-06`], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);

    await fn(repoRoot, rama);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
    await rm(originRoot, { recursive: true, force: true });
  }
}

function taskctl(argv: string[], cwd: string, input: string): { status: number; salida: string } {
  const result = spawnSync(process.execPath, [TASKCTL, ...argv], {
    cwd,
    input,
    encoding: 'utf8',
  });
  assert.equal(result.error, undefined, `no se pudo lanzar taskctl: ${String(result.error)}`);
  return { status: result.status ?? -1, salida: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

test('taskctl resume sin terminal: NO usa lo que venga por la tuberia, toma el default y no se cuelga', async () => {
  await withRepoConStash(async (repoRoot, rama) => {
    // Se le escribe "n" (no apliques el stash) por stdin. Sin
    // terminal, taskctl invoca con stdin ignorado a proposito: si lo
    // heredara, una tuberia abierta que nadie cierra colgaria el
    // comando para siempre (hallazgo IMPORTANTE de revision por
    // pares). Asi que la respuesta se descarta y manda el valor por
    // defecto del script, que es justo el que anuncia el aviso.
    const { status, salida } = taskctl(['resume', rama], repoRoot, 'n\n');
    assert.equal(status, 0);
    assert.match(salida, /\[AVISO\].*aplicara sin preguntar/s);
    assert.equal(git(['stash', 'list'], repoRoot), '', 'el default aplica el stash');
    assert.notEqual(git(['status', '--porcelain'], repoRoot), '');
  });
});

test('con terminal los guards no se aplican: pause con el workspace sucio llega al script', async () => {
  await withTempRepo(async (repoRoot) => {
    await writeFile(path.join(repoRoot, 'sin-guardar.txt'), 'a medias', 'utf8');
    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
    try {
      await writeFile(path.join(scriptsDir, 'pause-work.sh'), DOBLE_MUDO_21, 'utf8');
      const result = run('pause', [], repoRoot, { scriptsDir, interactivo: true });
      assert.equal(result.code, 21);
      assert.deepEqual(result.avisos, [], 'con terminal no hay nada de que avisar');
    } finally {
      await rm(scriptsDir, { recursive: true, force: true });
    }
  });
});

test('con terminal resume sin rama tampoco corta: es el script quien pregunta', async () => {
  await withTempRepo(async (repoRoot) => {
    const scriptsDir = await mkdtemp(path.join(tmpdir(), 'taskctl-scripts-'));
    try {
      await writeFile(path.join(scriptsDir, 'resume-work.sh'), DOBLE_MUDO_21, 'utf8');
      const result = run('resume', [], repoRoot, { scriptsDir, interactivo: true });
      assert.equal(result.code, 21);
      assert.deepEqual(result.avisos, []);
    } finally {
      await rm(scriptsDir, { recursive: true, force: true });
    }
  });
});
