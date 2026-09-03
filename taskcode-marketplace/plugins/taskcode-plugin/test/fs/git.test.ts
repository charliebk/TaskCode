import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  isWorkspaceClean,
  currentBranch,
  isValidBranchName,
  isRemoteAvailable,
  localBranchExists,
  resolveMainBranch,
  resolveBaseBranchForTipo,
  ensureBaseBranchReady,
  BaseBranchGuardError,
  GitCommandError,
  GitLaunchError,
} from '../../src/fs/git.js';

function git(args: string[], cwd: string): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
}

async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-git-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

test('isWorkspaceClean: true en un repo recien inicializado sin cambios', async () => {
  await withTempRepo(async (repoRoot) => {
    assert.equal(isWorkspaceClean(repoRoot), true);
  });
});

test('isWorkspaceClean: false si hay ficheros sin trackear', async () => {
  await withTempRepo(async (repoRoot) => {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(repoRoot, 'x.txt'), 'x', 'utf8');
    assert.equal(isWorkspaceClean(repoRoot), false);
  });
});

test('currentBranch: devuelve el nombre de la rama activa', async () => {
  await withTempRepo(async (repoRoot) => {
    assert.equal(currentBranch(repoRoot), 'main');
  });
});

test('isValidBranchName: true para un nombre valido, false para uno invalido', async () => {
  await withTempRepo(async (repoRoot) => {
    assert.equal(isValidBranchName('feature/algo-1001', repoRoot), true);
    assert.equal(isValidBranchName('rama con espacios', repoRoot), false);
    assert.equal(isValidBranchName('-empieza-con-guion', repoRoot), false);
  });
});

test('GitCommandError: mensaje incluye los argumentos y el stderr', () => {
  const err = new GitCommandError(['status', '--porcelain'], 'algo fallo\n');
  assert.match(err.message, /git status --porcelain fallo: algo fallo/);
  assert.equal(err.name, 'GitCommandError');
});

test('GitLaunchError: envuelve el error original con un mensaje claro', () => {
  const original = new Error('spawnSync git ENOENT');
  const err = new GitLaunchError(original);
  assert.match(err.message, /No se pudo ejecutar "git"/);
  assert.equal(err.originalError, original);
  assert.equal(err.name, 'GitLaunchError');
});

// --- TASK-012: resolveMainBranch / resolveBaseBranchForTipo / ensureBaseBranchReady ---

async function withOriginRepo(fn: (originRoot: string) => Promise<void>): Promise<void> {
  const originRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-git-origin-'));
  try {
    const { writeFile } = await import('node:fs/promises');
    git(['init', '-q', '-b', 'main'], originRoot);
    git(['config', 'user.email', 'test@example.com'], originRoot);
    git(['config', 'user.name', 'Test'], originRoot);
    await writeFile(path.join(originRoot, 'README.md'), '# origen\n', 'utf8');
    git(['add', '-A'], originRoot);
    git(['commit', '-q', '-m', 'inicial'], originRoot);
    git(['checkout', '-q', '-b', 'develop'], originRoot);
    // Vuelve a "main" al terminar: un "git clone" de este repo hace
    // checkout de la rama activa en ESTE momento, y las pruebas de
    // abajo asumen que el clon empieza en "main" con "develop"
    // disponible solo como origin/develop (no ya como rama local) —
    // hallazgo propio al escribir estos tests, TASK-012.
    git(['checkout', '-q', 'main'], originRoot);
    await fn(originRoot);
  } finally {
    await rm(originRoot, { recursive: true, force: true });
  }
}

/** Repo temporal SIN remoto, con la rama inicial que se le pida. */
async function withPlainRepo(
  initialBranch: string,
  fn: (repoRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-git-plain-'));
  try {
    const { writeFile } = await import('node:fs/promises');
    git(['init', '-q', '-b', initialBranch], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), '# x\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/** Clona originRoot a un repo temporal nuevo (crea el remoto "origin" de verdad). */
async function withClone(
  originRoot: string,
  fn: (repoRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-git-clone-'));
  try {
    git(['clone', '-q', originRoot, repoRoot], tmpdir());
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

test('isRemoteAvailable: false sin origin configurado', async () => {
  await withTempRepo(async (repoRoot) => {
    assert.equal(isRemoteAvailable(repoRoot), false);
  });
});

test('isRemoteAvailable: true con un origin real y alcanzable (segundo repo local)', async () => {
  await withOriginRepo(async (originRoot) => {
    await withTempRepo(async (repoRoot) => {
      git(['remote', 'add', 'origin', originRoot], repoRoot);
      assert.equal(isRemoteAvailable(repoRoot), true);
    });
  });
});

test('localBranchExists: true para una rama que existe, false para una que no', async () => {
  await withPlainRepo('main', async (repoRoot) => {
    assert.equal(localBranchExists('main', repoRoot), true);
    assert.equal(localBranchExists('develop', repoRoot), false);
  });
});

test('resolveMainBranch: origin con "main" gana, aunque en local solo haya "master"', async () => {
  await withOriginRepo(async (originRoot) => {
    // originRoot tiene main+develop, no master — sirve igual: lo que
    // importa es que exista origin/main.
    await withPlainRepo('master', async (repoRoot) => {
      git(['remote', 'add', 'origin', originRoot], repoRoot);
      assert.equal(resolveMainBranch(repoRoot), 'main');
    });
  });
});

test('resolveMainBranch: origin sin "main" pero con "master" usa "master"', async () => {
  await withPlainRepo('master', async (originRoot) => {
    await withPlainRepo('develop', async (repoRoot) => {
      git(['remote', 'add', 'origin', originRoot], repoRoot);
      assert.equal(resolveMainBranch(repoRoot), 'master');
    });
  });
});

test('resolveMainBranch: origin disponible pero sin "main" ni "master" cae a las ramas locales', async () => {
  await withPlainRepo('trunk', async (originRoot) => {
    await withPlainRepo('main', async (repoRoot) => {
      git(['remote', 'add', 'origin', originRoot], repoRoot);
      assert.equal(resolveMainBranch(repoRoot), 'main');
    });
  });
});

test('resolveMainBranch: sin remoto, usa "main" local si existe', async () => {
  await withPlainRepo('main', async (repoRoot) => {
    assert.equal(resolveMainBranch(repoRoot), 'main');
  });
});

test('resolveMainBranch: sin remoto y sin "main" local, usa "master" local si existe', async () => {
  await withPlainRepo('master', async (repoRoot) => {
    assert.equal(resolveMainBranch(repoRoot), 'master');
  });
});

test('resolveMainBranch: sin remoto, sin "main" ni "master" en ningun lado, "master" por defecto', async () => {
  await withPlainRepo('trunk', async (repoRoot) => {
    assert.equal(resolveMainBranch(repoRoot), 'master');
  });
});

test('resolveBaseBranchForTipo: feature/fix/release siempre resuelven a "develop"', async () => {
  await withPlainRepo('main', async (repoRoot) => {
    assert.equal(resolveBaseBranchForTipo('feature', repoRoot), 'develop');
    assert.equal(resolveBaseBranchForTipo('fix', repoRoot), 'develop');
    assert.equal(resolveBaseBranchForTipo('release', repoRoot), 'develop');
  });
});

test('resolveBaseBranchForTipo: hotfix delega en resolveMainBranch', async () => {
  await withPlainRepo('master', async (repoRoot) => {
    assert.equal(resolveBaseBranchForTipo('hotfix', repoRoot), 'master');
  });
});

test('ensureBaseBranchReady: ya en la rama base, no toca Git mas alla de comprobarlo', async () => {
  await withOriginRepo(async (originRoot) => {
    await withClone(originRoot, async (repoRoot) => {
      git(['checkout', '-q', 'develop'], repoRoot);
      const result = ensureBaseBranchReady('feature', repoRoot);
      assert.deepEqual(result, { baseBranch: 'develop', switched: false, branchAntes: 'develop' });
      assert.equal(currentBranch(repoRoot), 'develop');
    });
  });
});

test('ensureBaseBranchReady: workspace sucio aborta sin cambiar de rama', async () => {
  await withOriginRepo(async (originRoot) => {
    await withClone(originRoot, async (repoRoot) => {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(path.join(repoRoot, 'sucio.txt'), 'x', 'utf8');
      assert.throws(() => ensureBaseBranchReady('feature', repoRoot), BaseBranchGuardError);
      assert.equal(currentBranch(repoRoot), 'main');
    });
  });
});

test('ensureBaseBranchReady: rama base existe en local pero sin remoto, cambia sin intentar pull', async () => {
  await withOriginRepo(async (originRoot) => {
    await withClone(originRoot, async (repoRoot) => {
      // Crea el tracking local de develop mientras el remoto todavia
      // existe, y luego quita el remoto — simula un repo local que ya
      // conocia "develop" pero se quedo sin conexion.
      git(['checkout', '-q', 'develop'], repoRoot);
      git(['checkout', '-q', 'main'], repoRoot);
      git(['remote', 'remove', 'origin'], repoRoot);

      const result = ensureBaseBranchReady('feature', repoRoot);
      assert.equal(result.switched, true);
      assert.equal(result.branchAntes, 'main');
      assert.equal(result.baseBranch, 'develop');
      assert.equal(currentBranch(repoRoot), 'develop');
    });
  });
});

test('ensureBaseBranchReady: rama base existe en local y hay remoto, cambia y hace pull --ff-only de verdad', async () => {
  await withOriginRepo(async (originRoot) => {
    await withClone(originRoot, async (repoRoot) => {
      git(['checkout', '-q', 'develop'], repoRoot);
      git(['checkout', '-q', 'main'], repoRoot);

      // Adelanta origin/develop con un commit nuevo DESPUES del clone,
      // para que el pull --ff-only tenga algo real que traer — no solo
      // un checkout.
      const { writeFile } = await import('node:fs/promises');
      git(['checkout', '-q', 'develop'], originRoot);
      await writeFile(path.join(originRoot, 'nuevo.txt'), 'contenido nuevo\n', 'utf8');
      git(['add', '-A'], originRoot);
      git(['commit', '-q', '-m', 'avance en origin/develop'], originRoot);

      const result = ensureBaseBranchReady('feature', repoRoot);
      assert.equal(result.switched, true);
      assert.equal(currentBranch(repoRoot), 'develop');
      // El pull trajo el commit nuevo de verdad: el fichero existe.
      const { stat } = await import('node:fs/promises');
      await assert.doesNotReject(() => stat(path.join(repoRoot, 'nuevo.txt')));
    });
  });
});

test('ensureBaseBranchReady: rama base NO existe en local pero si en origin, crea el tracking local', async () => {
  await withOriginRepo(async (originRoot) => {
    await withClone(originRoot, async (repoRoot) => {
      // No se hace "git checkout develop" a mano: solo existe como
      // origin/develop, nunca como rama local, hasta que
      // ensureBaseBranchReady la cree.
      assert.equal(localBranchExists('develop', repoRoot), false);

      const result = ensureBaseBranchReady('feature', repoRoot);
      assert.equal(result.switched, true);
      assert.equal(result.branchAntes, 'main');
      assert.equal(currentBranch(repoRoot), 'develop');
      assert.equal(localBranchExists('develop', repoRoot), true);
    });
  });
});

test('ensureBaseBranchReady: rama base no existe en local ni hay remoto, rechaza sin tocar nada', async () => {
  await withPlainRepo('main', async (repoRoot) => {
    assert.throws(() => ensureBaseBranchReady('feature', repoRoot), BaseBranchGuardError);
    assert.equal(currentBranch(repoRoot), 'main');
  });
});

test('ensureBaseBranchReady: hay remoto pero no tiene la rama base — el checkout falla y se envuelve en BaseBranchGuardError', async () => {
  await withPlainRepo('main', async (originRoot) => {
    await withClone(originRoot, async (repoRoot) => {
      // origin solo tiene "main" — nunca "develop".
      assert.throws(() => ensureBaseBranchReady('feature', repoRoot), BaseBranchGuardError);
      assert.equal(currentBranch(repoRoot), 'main');
    });
  });
});

test('ensureBaseBranchReady: si el checkout tiene exito pero el pull --ff-only falla, el mensaje deja claro que la rama SI cambio (no se deshace)', async () => {
  await withOriginRepo(async (originRoot) => {
    await withClone(originRoot, async (repoRoot) => {
      const { writeFile } = await import('node:fs/promises');

      git(['checkout', '-q', 'develop'], repoRoot);
      // Diverge: un commit local que origin no tiene.
      await writeFile(path.join(repoRoot, 'local.txt'), 'solo en local\n', 'utf8');
      git(['add', '-A'], repoRoot);
      git(['commit', '-q', '-m', 'commit local que origin no tiene'], repoRoot);
      git(['checkout', '-q', 'main'], repoRoot);

      // Y origin/develop avanza con OTRO commit distinto — ff-only es
      // imposible en cualquier direccion.
      git(['checkout', '-q', 'develop'], originRoot);
      await writeFile(path.join(originRoot, 'remoto.txt'), 'solo en origin\n', 'utf8');
      git(['add', '-A'], originRoot);
      git(['commit', '-q', '-m', 'commit en origin que el local no tiene'], originRoot);

      let error: unknown;
      try {
        ensureBaseBranchReady('feature', repoRoot);
      } catch (e) {
        error = e;
      }
      assert.ok(error instanceof BaseBranchGuardError);
      assert.match((error as Error).message, /Se cambio a la rama base "develop"/);
      assert.match((error as Error).message, /no se pudo actualizar/);
      assert.match((error as Error).message, /no se deshizo/);
      // La rama SI cambio de verdad, pese al error de pull — el
      // mensaje no debe sugerir lo contrario (hallazgo importante de
      // revision por pares, TASK-012).
      assert.equal(currentBranch(repoRoot), 'develop');
    });
  });
});
