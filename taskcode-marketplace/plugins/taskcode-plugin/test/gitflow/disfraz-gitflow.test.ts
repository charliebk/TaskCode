/**
 * TASK-142: scripts de Git-Flow que aparentaban hacer algo que no hacian
 * (auditoria 4D completa, casos SCR-01, SCR-09, SCR-10, SCR-11 y SCR-14).
 *
 * Repos Git temporales de verdad y un repo bare como remoto, sin dobles.
 * Los scripts se lanzan como `bash script.sh` (core.fileMode=false) y las
 * respuestas a sus `read -rp` llegan por stdin.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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

function runScript(script: string, args: string[], cwd: string, input = ''): { status: number | null; output: string } {
  const result = spawnSync('bash', [path.join(SCRIPTS_DIR, script), ...args], { cwd, encoding: 'utf8', input });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

async function nuevoRepo(prefijo: string): Promise<string> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), prefijo));
  git(['init', '-q', '-b', 'main'], repoRoot);
  git(['config', 'user.email', 'test@example.com'], repoRoot);
  git(['config', 'user.name', 'Test'], repoRoot);
  git(['config', 'core.autocrlf', 'false'], repoRoot);
  await writeFile(path.join(repoRoot, 'trabajo.txt'), 'base\n', 'utf8');
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'inicial'], repoRoot);
  return repoRoot;
}

async function conDirs(n: number, fn: (dirs: string[]) => Promise<void>): Promise<void> {
  const dirs: string[] = [];
  try {
    for (let i = 0; i < n; i++) dirs.push(await mkdtemp(path.join(tmpdir(), 'taskctl-disfraz-gf-')));
    await fn(dirs);
  } finally {
    for (const d of dirs) await rm(d, { recursive: true, force: true });
  }
}

test('resume-work (SCR-01): aplica el stash de la rama exacta, no el ultimo ni el de una rama con el mismo prefijo', async () => {
  const repoRoot = await nuevoRepo('taskctl-resume-stash-');
  try {
    git(['branch', 'feature/a'], repoRoot);
    git(['branch', 'feature/ab'], repoRoot);
    // Stash de feature/a primero y de feature/ab despues: el de ab queda en stash@{0}.
    git(['checkout', '-q', 'feature/a'], repoRoot);
    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'cambios de a\n', 'utf8');
    git(['stash', 'push', '-u', '-m', 'pause: feature/a 2026-11-20'], repoRoot);
    git(['checkout', '-q', 'feature/ab'], repoRoot);
    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'cambios de ab\n', 'utf8');
    git(['stash', 'push', '-u', '-m', 'pause: feature/ab 2026-11-21'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);

    // Enter = aplicar el stash (el valor por defecto del script).
    const r = runScript('resume-work.sh', ['feature/a'], repoRoot, '\n');
    assert.equal(r.status, 0, r.output);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'feature/a');
    assert.equal(await readFile(path.join(repoRoot, 'trabajo.txt'), 'utf8'), 'cambios de a\n', r.output);
    const lista = git(['stash', 'list'], repoRoot);
    assert.match(lista, /pause: feature\/ab 2026-11-21/);
    assert.doesNotMatch(lista, /pause: feature\/a 2026-11-20/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('resume-work (SCR-01): sin stash propio no aplica el de otra rama que empiece igual', async () => {
  const repoRoot = await nuevoRepo('taskctl-resume-prefijo-');
  try {
    git(['branch', 'feature/a'], repoRoot);
    git(['checkout', '-q', '-b', 'feature/ab'], repoRoot);
    await writeFile(path.join(repoRoot, 'trabajo.txt'), 'cambios de ab\n', 'utf8');
    git(['stash', 'push', '-u', '-m', 'pause: feature/ab 2026-11-21'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);

    const r = runScript('resume-work.sh', ['feature/a'], repoRoot, '\n');
    assert.equal(r.status, 0, r.output);
    assert.equal(await readFile(path.join(repoRoot, 'trabajo.txt'), 'utf8'), 'base\n', r.output);
    assert.match(git(['stash', 'list'], repoRoot), /pause: feature\/ab/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('pause-work --push (SCR-09): sin origin no aborta, avisa de que el push se omite', async () => {
  const repoRoot = await nuevoRepo('taskctl-pause-sin-origin-');
  try {
    const r = runScript('pause-work.sh', ['--push'], repoRoot);
    assert.equal(r.status, 0, r.output);
    assert.match(r.output, /push omitido/i);
    assert.doesNotMatch(r.output, /does not appear to be a git repository/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('push-back-to-remote aditivo (SCR-10): un push rechazado no se da por completado', async () => {
  await conDirs(2, async ([destino, otro]) => {
    const repoRoot = await nuevoRepo('taskctl-pushback-');
    try {
      git(['init', '-q', '--bare', '-b', 'main', destino as string], repoRoot);
      git(['remote', 'add', 'empresa', destino as string], repoRoot);
      git(['push', '-q', 'empresa', 'main'], repoRoot);
      // Otro clon sube un commit a main en el destino: main diverge.
      git(['clone', '-q', destino as string, path.join(otro as string, 'c')], repoRoot);
      const clon = path.join(otro as string, 'c');
      git(['config', 'user.email', 'o@example.com'], clon);
      git(['config', 'user.name', 'Otro'], clon);
      await writeFile(path.join(clon, 'otro.txt'), 'del destino\n', 'utf8');
      git(['add', '-A'], clon);
      git(['commit', '-q', '-m', 'commit del destino'], clon);
      git(['push', '-q', 'origin', 'main'], clon);
      await writeFile(path.join(repoRoot, 'trabajo.txt'), 'local\n', 'utf8');
      git(['commit', '-q', '-am', 'commit local'], repoRoot);

      // s = continuar pese a la divergencia; Enter = confirmar el resumen.
      const r = runScript('push-back-to-remote.sh', ['--target', 'empresa', '--additive'], repoRoot, 's\n\n');
      assert.notEqual(r.status, 0, r.output);
      assert.doesNotMatch(r.output, /Push de ramas completado/);
      assert.doesNotMatch(r.output, /RESULTADO\s*:\s*COMPLETADO/);
      assert.match(r.output, /FALLIDO/);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});

test('mirror-to-remote (SCR-11): con destino no vacio no promete sobreescribir', async () => {
  await conDirs(2, async ([origin, destino]) => {
    const repoRoot = await nuevoRepo('taskctl-mirror-');
    try {
      git(['init', '-q', '--bare', '-b', 'main', origin as string], repoRoot);
      git(['remote', 'add', 'origin', origin as string], repoRoot);
      git(['push', '-q', 'origin', 'main'], repoRoot);
      git(['init', '-q', '--bare', '-b', 'main', destino as string], repoRoot);
      git(['push', '-q', destino as string, 'main:otra'], repoRoot);

      // n = no continuar con un destino que ya tiene ramas.
      const r = runScript('mirror-to-remote.sh', ['--name', 'destino', '--url', destino as string], repoRoot, 'n\n');
      assert.doesNotMatch(r.output, /sobreescribira/i, r.output);
      assert.match(r.output, /no se sobreescribe|se rechazar/i, r.output);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});

test('textos de Git-Flow (SCR-14): ningun script ni el README hablan de "19 scripts" ni de "copia literal"', async () => {
  const ficheros = (await readdir(SCRIPTS_DIR)).filter((f) => f.endsWith('.sh') || f.endsWith('.md'));
  assert.ok(ficheros.length > 20, `pocos ficheros en ${SCRIPTS_DIR}`);
  for (const f of ficheros) {
    const texto = await readFile(path.join(SCRIPTS_DIR, f), 'utf8');
    assert.doesNotMatch(texto, /\b19 scripts\b/, f);
    assert.doesNotMatch(texto, /copia literal/i, f);
  }
});
