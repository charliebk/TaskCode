/**
 * Test de regresion real (no mocks) para el frente S1 del item C6
 * (TASK-029): create-develop.sh, recover-branch.sh y resume-work.sh hacian
 * "fetch origin" / "pull --ff-only origin" / "push -u origin" /
 * "ls-remote origin" sin el guard de disponibilidad que B2 ya habia
 * introducido en los merge-*-to-main. En un repo sin origin morian con el
 * "fatal: 'origin' does not appear to be a git repository" crudo de Git.
 *
 * Mismo espiritu que test/gitflow/merge-to-main.test.ts: repos Git
 * temporales de verdad, y un segundo repo bare haciendo de origin cuando el
 * escenario lo pide (CONVENCIONES.md, seccion Tests).
 *
 * Cubre ademas la parte de S3 que vive en resume-work.sh: los dos mensajes
 * que remitian a menus de IntelliJ ("GitFlow 16 Pause Work" y "GitFlow 18
 * Recover Branch from Origin") ahora nombran comandos que existen de verdad
 * en el CLI desde TASK-026.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/gitflow -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

/**
 * Ejecuta un script de Git-Flow como lo haria una persona: "bash script.sh"
 * (core.fileMode=false en este repo, ver HALLAZGOS.md) y con stdin en EOF,
 * que es lo que reciben los prompts interactivos cuando no hay terminal.
 */
function runScript(script: string, args: string[], cwd: string): { status: number | null; output: string } {
  const result = spawnSync('bash', [path.join(SCRIPTS_DIR, script), ...args], {
    cwd,
    encoding: 'utf8',
    input: '',
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

/** Repo Git temporal vacio, sin remoto, con la rama inicial pedida. */
async function nuevoRepo(prefijo: string, ramaInicial: string): Promise<string> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), prefijo));
  git(['init', '-q', '-b', ramaInicial], repoRoot);
  git(['config', 'user.email', 'test@example.com'], repoRoot);
  git(['config', 'user.name', 'Test'], repoRoot);
  // logs/ ignorado ANTES del primer commit (hallazgo 2 de TASK-007: el
  // propio log de Git-Flow ensuciaria el workspace y autobloquearia el
  // script). Inofensivo aunque el registro ya no viva ahi.
  await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
  await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'inicial'], repoRoot);
  return repoRoot;
}

/** Repo con rama principal `main` y sin remoto. */
async function conRepo(prefijo: string, fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await nuevoRepo(prefijo, 'main');
  try {
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/** Repo con rama principal `main` y un origin bare real ya emparejado. */
async function conRepoYOrigin(
  prefijo: string,
  fn: (repoRoot: string, origin: string) => Promise<void>,
): Promise<void> {
  const repoRoot = await nuevoRepo(prefijo, 'main');
  const origin = await mkdtemp(path.join(tmpdir(), `${prefijo}origin-`));
  try {
    git(['init', '-q', '--bare', origin], origin);
    git(['remote', 'add', 'origin', origin], repoRoot);
    git(['push', '-q', 'origin', 'main'], repoRoot);
    await fn(repoRoot, origin);
  } finally {
    await rm(origin, { recursive: true, force: true });
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/**
 * Remoto configurado apuntando a una ruta inexistente: simula la VPN/red
 * caida, que NO es lo mismo que no tener remoto (hallazgo IMPORTANTE de la
 * revision por pares de B2).
 */
function romperOrigin(repoRoot: string): void {
  git(['remote', 'add', 'origin', path.join(repoRoot, 'no-existe.git')], repoRoot);
}

// ── create-develop.sh ────────────────────────────────────────────────────────

test('create-develop.sh: sin origin crea develop en local y omite el push (antes: exit 1)', async () => {
  await conRepo('taskctl-og-cd-local-', async (repoRoot) => {
    const { status, output } = runScript('create-develop.sh', [], repoRoot);

    assert.equal(status, 0, `deberia terminar en 0 sin origin. Salida:\n${output}`);
    assert.match(output, /Push omitido: no hay conexion con origin/);
    // Evidencia real de Git: develop existe y sale exactamente de main.
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
    assert.equal(
      git(['rev-parse', 'develop'], repoRoot).trim(),
      git(['rev-parse', 'main'], repoRoot).trim(),
    );
  });
});

test('create-develop.sh: sin origin y con develop ya en local no intenta subirla', async () => {
  await conRepo('taskctl-og-cd-existe-', async (repoRoot) => {
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);

    const { status, output } = runScript('create-develop.sh', [], repoRoot);

    assert.equal(status, 0, `deberia terminar en 0 sin origin. Salida:\n${output}`);
    assert.match(output, /Push omitido: no hay conexion con origin/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
  });
});

test('create-develop.sh: sin origin y sin rama principal local falla con error claro', async () => {
  // Unica rama "trabajo": resolve_main_branch cae al fallback "master", que
  // no existe ni local ni remotamente.
  const repoRoot = await nuevoRepo('taskctl-og-cd-sinmain-', 'trabajo');
  try {
    const { status, output } = runScript('create-develop.sh', [], repoRoot);

    assert.notEqual(status, 0);
    assert.match(output, /no existe localmente y no hay conexion remota para crearla/);
    assert.doesNotMatch(output, /does not appear to be a git repository/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'trabajo');
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('create-develop.sh: con origin (repo bare real) sigue creando y subiendo develop', async () => {
  await conRepoYOrigin('taskctl-og-cd-origin-', async (repoRoot, origin) => {
    const { status, output } = runScript('create-develop.sh', [], repoRoot);

    assert.equal(status, 0, `deberia terminar en 0 con origin. Salida:\n${output}`);
    assert.match(output, /Conexion remota disponible/);
    // La evidencia se lee en el ORIGIN bare: lo que importa es que el push llego.
    assert.match(git(['branch', '--list', 'develop'], origin), /develop/);
  });
});

test('create-develop.sh: origin configurado pero inaccesible aborta sin crear develop', async () => {
  await conRepo('taskctl-og-cd-roto-', async (repoRoot) => {
    romperOrigin(repoRoot);

    const { status, output } = runScript('create-develop.sh', [], repoRoot);

    assert.notEqual(status, 0);
    assert.match(output, /origin esta configurado pero no responde/);
    // No se crea una develop que podria quedar divergente de la de origin.
    assert.equal(git(['branch', '--list', 'develop'], repoRoot).trim(), '');
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'main');
  });
});

// ── recover-branch.sh ────────────────────────────────────────────────────────

test('recover-branch.sh: sin origin falla explicando que no hay remoto (antes: fatal de Git)', async () => {
  await conRepo('taskctl-og-rb-local-', async (repoRoot) => {
    const { status, output } = runScript('recover-branch.sh', ['feature/1-x'], repoRoot);

    assert.notEqual(status, 0);
    assert.match(output, /no tiene un remoto 'origin' configurado/);
    assert.match(output, /git remote add origin/);
    // El fix es fallar con un mensaje que se entienda, no con el de Git.
    assert.doesNotMatch(output, /does not appear to be a git repository/);
  });
});

test('recover-branch.sh: origin configurado pero inaccesible falla distinguiendolo de "sin remoto"', async () => {
  await conRepo('taskctl-og-rb-roto-', async (repoRoot) => {
    romperOrigin(repoRoot);

    const { status, output } = runScript('recover-branch.sh', ['feature/1-x'], repoRoot);

    assert.notEqual(status, 0);
    assert.match(output, /origin esta configurado pero no responde/);
    assert.doesNotMatch(output, /no tiene un remoto 'origin' configurado/);
  });
});

test('recover-branch.sh: con origin (repo bare real) recupera la rama borrada en local', async () => {
  await conRepoYOrigin('taskctl-og-rb-origin-', async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/7-perdida'], repoRoot);
    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'trabajo\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'trabajo en feature'], repoRoot);
    git(['push', '-q', '-u', 'origin', 'feature/7-perdida'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);
    git(['branch', '-q', '-D', 'feature/7-perdida'], repoRoot);

    const { status, output } = runScript('recover-branch.sh', ['feature/7-perdida'], repoRoot);

    assert.equal(status, 0, `deberia recuperar la rama con origin. Salida:\n${output}`);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/7-perdida');
    assert.match(git(['log', '--oneline', 'feature/7-perdida'], repoRoot), /trabajo en feature/);
  });
});

// ── resume-work.sh ───────────────────────────────────────────────────────────

test('resume-work.sh: sin origin retoma la rama local y avisa de que no ha sincronizado (antes: exit 1)', async () => {
  await conRepo('taskctl-og-rw-local-', async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/1-algo'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);

    const { status, output } = runScript('resume-work.sh', ['feature/1-algo'], repoRoot);

    assert.equal(status, 0, `deberia terminar en 0 sin origin. Salida:\n${output}`);
    assert.match(output, /este repo no tiene remoto 'origin'/);
    assert.match(output, /retomada sin sincronizar con origin/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/1-algo');
  });
});

test('resume-work.sh: sin origin y con rama inexistente falla dejando a la persona en su rama', async () => {
  await conRepo('taskctl-og-rw-fantasma-', async (repoRoot) => {
    const { status, output } = runScript('resume-work.sh', ['feature/9-fantasma'], repoRoot);

    assert.notEqual(status, 0);
    assert.match(output, /no existe localmente y no hay conexion con origin para buscarla/);
    assert.doesNotMatch(output, /does not appear to be a git repository/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'main');
  });
});

test('resume-work.sh: origin configurado pero inaccesible NO aborta, sigue en local avisando', async () => {
  // A diferencia de create-develop y de los merge a main, retomar una rama
  // que ya existe en local no escribe historia ni publica nada: abortar
  // romperia el caso de uso central (volver a tu rama con la VPN caida).
  await conRepo('taskctl-og-rw-roto-', async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/1-algo'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);
    romperOrigin(repoRoot);

    const { status, output } = runScript('resume-work.sh', ['feature/1-algo'], repoRoot);

    assert.equal(status, 0, `no deberia abortar con origin caido. Salida:\n${output}`);
    assert.match(output, /origin esta configurado pero no responde/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/1-algo');
  });
});

test('resume-work.sh: con origin (repo bare real) sigue creando la copia local de una rama remota', async () => {
  await conRepoYOrigin('taskctl-og-rw-origin-', async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/5-remota'], repoRoot);
    await writeFile(path.join(repoRoot, 'remoto.txt'), 'remoto\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'commit remoto'], repoRoot);
    git(['push', '-q', '-u', 'origin', 'feature/5-remota'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);
    git(['branch', '-q', '-D', 'feature/5-remota'], repoRoot);

    const { status, output } = runScript('resume-work.sh', ['feature/5-remota'], repoRoot);

    assert.equal(status, 0, `deberia terminar en 0 con origin. Salida:\n${output}`);
    assert.match(output, /solo existe en origin/);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/5-remota');
    assert.match(git(['log', '--oneline'], repoRoot), /commit remoto/);
  });
});

// ── S3: los mensajes de resume-work.sh dejan de remitir a IntelliJ ───────────

test('resume-work.sh: con el workspace sucio remite a taskctl pause, no a "GitFlow 16"', async () => {
  await conRepo('taskctl-og-rw-sucio-', async (repoRoot) => {
    await writeFile(path.join(repoRoot, 'sucio.txt'), 'cambio sin commitear\n', 'utf8');

    const { status, output } = runScript('resume-work.sh', ['main'], repoRoot);

    assert.notEqual(status, 0);
    assert.match(output, /Usa taskctl pause para guardar tu trabajo actual/);
    assert.doesNotMatch(output, /GitFlow 16/);
    assert.doesNotMatch(output, /Pause Work/);
  });
});

test('resume-work.sh: con origin y rama inexistente remite a taskctl recover, no a "GitFlow 18"', async () => {
  await conRepoYOrigin('taskctl-og-rw-recover-', async (repoRoot) => {
    const { status, output } = runScript('resume-work.sh', ['feature/9-fantasma'], repoRoot);

    assert.notEqual(status, 0);
    assert.match(output, /no existe ni localmente ni en origin/);
    assert.match(output, /usa taskctl recover/);
    assert.doesNotMatch(output, /GitFlow 18/);
    assert.doesNotMatch(output, /Recover Branch from Origin/);
  });
});
