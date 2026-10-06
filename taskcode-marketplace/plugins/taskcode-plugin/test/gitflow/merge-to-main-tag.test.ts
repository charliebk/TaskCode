/**
 * `--tag <nombre>` de merge-hotfix-to-main.sh y merge-release-to-main.sh
 * (TASK-060, criterio 4): sustituye el nombre del tag que pone el script, sigue
 * habiendo UN solo tag, y un nombre malo o repetido aborta antes de tocar
 * ninguna rama. Repos Git reales; los scripts se invocan como `bash script.sh`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function runScript(script: string, args: string[], cwd: string): { status: number | null; output: string } {
  const r = spawnSync('bash', [path.join(SCRIPTS_DIR, script), ...args], { cwd, encoding: 'utf8', input: '' });
  return { status: r.status, output: `${r.stdout}\n${r.stderr}` };
}

const CASOS = [
  { script: 'merge-hotfix-to-main.sh', tipo: 'hotfix', base: 'main' },
  { script: 'merge-release-to-main.sh', tipo: 'release', base: 'develop' },
] as const;

async function conRamaDeTrabajo(tipo: string, base: string, fn: (repoRoot: string, rama: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-merge-tag-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    const rama = `${tipo}/950-con-tag`;
    git(['checkout', '-q', base], repoRoot);
    git(['checkout', '-q', '-b', rama], repoRoot);
    await writeFile(path.join(repoRoot, 'cambio.txt'), 'cambio\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', `cambio en ${rama}`], repoRoot);
    await fn(repoRoot, rama);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

for (const { script, tipo, base } of CASOS) {
  test(`${script} --tag: usa ese nombre en lugar del calculado, y no hay un segundo tag`, async () => {
    await conRamaDeTrabajo(tipo, base, async (repoRoot) => {
      const { status, output } = runScript(script, ['950-con-tag', '--tag', 'v3.1.4'], repoRoot);
      assert.equal(status, 0, output);
      assert.match(output, /Tag creado: v3\.1\.4/);
      assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v3.1.4', 'un solo tag, el pedido');
      assert.equal(git(['cat-file', '-t', 'refs/tags/v3.1.4'], repoRoot).trim(), 'tag');
      assert.equal(git(['rev-parse', 'v3.1.4^{commit}'], repoRoot).trim(), git(['rev-parse', 'main'], repoRoot).trim());
      assert.match(git(['log', '--oneline', 'develop'], repoRoot), /backmerge/);
    });
  });

  test(`${script} --tag: un nombre invalido, con "-" inicial o ya existente aborta ANTES de mergear`, async () => {
    await conRamaDeTrabajo(tipo, base, async (repoRoot, rama) => {
      git(['tag', 'ya-esta', 'main'], repoRoot);
      const mainAntes = git(['rev-parse', 'main'], repoRoot).trim();
      for (const [malo, patron] of [
        ['con espacio', /no es valido/],
        ['a..b', /no es valido/],
        ['-x', /no es valido/],
        ['ya-esta', /ya existe/],
      ] as const) {
        const { status, output } = runScript(script, ['950-con-tag', '--tag', malo], repoRoot);
        assert.notEqual(status, 0, `${malo}: ${output}`);
        assert.match(output, patron, malo);
        assert.equal(git(['rev-parse', 'main'], repoRoot).trim(), mainAntes, `${malo}: main intacta`);
        assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama, `${malo}: sigue en su rama`);
      }
      assert.equal(git(['tag', '-l'], repoRoot).trim(), 'ya-esta');
    });
  });

  test(`${script} --tag SIN valor aborta con mensaje y sin tocar nada (no se ignora en silencio)`, async () => {
    await conRamaDeTrabajo(tipo, base, async (repoRoot, rama) => {
      const mainAntes = git(['rev-parse', 'main'], repoRoot).trim();
      const { status, output } = runScript(script, ['950-con-tag', '--develop', 'develop', '--tag'], repoRoot);
      assert.notEqual(status, 0, output);
      assert.match(output, /--tag necesita un nombre/);
      assert.equal(git(['tag', '-l'], repoRoot).trim(), '');
      assert.equal(git(['rev-parse', 'main'], repoRoot).trim(), mainAntes);
      assert.equal(git(['branch', '--show-current'], repoRoot).trim(), rama);
    });
  });

  test(`${script} sin --tag sigue poniendo el tag calculado (el flag es opcional)`, async () => {
    await conRamaDeTrabajo(tipo, base, async (repoRoot) => {
      const { status, output } = runScript(script, ['950-con-tag'], repoRoot);
      assert.equal(status, 0, output);
      assert.equal(git(['tag', '-l'], repoRoot).trim(), 'v950-con-tag');
    });
  });
}
