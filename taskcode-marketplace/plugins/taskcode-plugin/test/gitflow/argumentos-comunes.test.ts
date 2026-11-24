/**
 * TASK-143b (auditoria 4D completa, SCR-06, SCR-12 y SCR-15):
 *
 * - la lectura de argumentos y la validacion del nombre de rama salen de
 *   parse_gitflow_args y normalize_branch_name; los merge-* no validaban;
 * - diagnose-repo usa detect_origin_available y lee --develop;
 * - el mirror de push-back-to-remote sube solo ramas y tags, lo que ensena
 *   su vista previa (antes `push --mirror` subia todas las referencias).
 *
 * Repos Git temporales de verdad y un repo bare como remoto, sin dobles; los
 * scripts se lanzan como `bash script.sh` (core.fileMode=false).
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
  return result.stdout.trim();
}

function runScript(script: string, args: string[], cwd: string, input = ''): { status: number | null; output: string } {
  const result = spawnSync('bash', [path.join(SCRIPTS_DIR, script), ...args], { cwd, encoding: 'utf8', input });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

/** Repo con main y develop y un commit; logs/ ignorado para que el log no ensucie. */
async function conRepo(fn: (repo: string, raiz: string) => Promise<void>): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-args-comunes-'));
  try {
    const repo = path.join(raiz, 'repo');
    git(['init', '-q', '-b', 'main', repo], raiz);
    git(['config', 'user.email', 'test@example.com'], repo);
    git(['config', 'user.name', 'Test'], repo);
    git(['config', 'core.autocrlf', 'false'], repo);
    await writeFile(path.join(repo, '.gitignore'), 'logs/\n', 'utf8');
    git(['add', '-A'], repo);
    git(['commit', '-q', '-m', 'inicial'], repo);
    await fn(repo, raiz);
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
}

for (const script of ['merge-feature-to-develop.sh', 'merge-release-to-main.sh'] as const) {
  test(`${script} (TASK-143b, SCR-06): rechaza un nombre de rama invalido sin tocar nada`, async () => {
    await conRepo(async (repo) => {
      git(['branch', 'develop'], repo);
      const antes = git(['rev-parse', 'HEAD'], repo);
      const r = runScript(script, ['mal..nombre'], repo);
      assert.notEqual(r.status, 0, r.output);
      assert.match(r.output, /Nombre de rama invalido/);
      assert.equal(git(['branch', '--show-current'], repo), 'main');
      assert.equal(git(['rev-parse', 'HEAD'], repo), antes);
    });
  });
}

test('diagnose-repo.sh (TASK-143b, SCR-12): lee --develop y no fija el nombre develop', async () => {
  await conRepo(async (repo) => {
    git(['branch', 'integracion'], repo);
    const conNombre = runScript('diagnose-repo.sh', ['--develop', 'integracion'], repo);
    assert.equal(conNombre.status, 0, conNombre.output);
    assert.match(conNombre.output, /Develop:\s+integracion: .*solo local/);
    const porDefecto = runScript('diagnose-repo.sh', [], repo);
    assert.match(porDefecto.output, /Develop:\s+develop: .*no existe/);
  });
});

test('push-back-to-remote.sh --mirror (TASK-143b, SCR-15): sube ramas y tags, no el resto de referencias', async () => {
  await conRepo(async (repo, raiz) => {
    const destino = path.join(raiz, 'destino.git');
    git(['init', '-q', '--bare', '-b', 'main', destino], raiz);
    git(['remote', 'add', 'destino', destino], repo);
    git(['tag', '-a', 'v1.0.0', '-m', 'v1'], repo);
    // Referencias que la vista previa no ensena: una nota y una de otro remoto.
    git(['notes', 'add', '-m', 'nota local', 'HEAD'], repo);
    git(['update-ref', 'refs/remotes/otro/rama', 'HEAD'], repo);

    // Enter = confirmar el resumen; despues, la frase exacta.
    const r = runScript('push-back-to-remote.sh', ['--target', 'destino', '--mirror'], repo, '\nBORRAR Y SUSTITUIR\n');
    assert.equal(r.status, 0, r.output);
    const refs = git(['for-each-ref', '--format=%(refname)'], destino).split('\n');
    assert.ok(refs.includes('refs/heads/main'), refs.join(' '));
    assert.ok(refs.includes('refs/tags/v1.0.0'), refs.join(' '));
    assert.deepEqual(refs.filter((x) => !x.startsWith('refs/heads/') && !x.startsWith('refs/tags/')), []);
  });
});
