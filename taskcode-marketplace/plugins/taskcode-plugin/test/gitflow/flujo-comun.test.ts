/**
 * TASK-143a (auditoria 4D completa, SCR-02 a SCR-05): los create, update y
 * merge a main de Git-Flow comparten su cuerpo en _gitflow-common.sh. Dos
 * comportamientos que la unificacion trae y que antes no estaban en todos:
 *
 * - el fetch previo (solo lo hacian create-release y create-hotfix): sin el,
 *   una rama que otro subio a origin despues del clon no tiene
 *   `origin/<rama>` local y el checkout falla;
 * - el `pull --ff-only` de develop antes del backmerge de los merge a main:
 *   sin el, con la develop local atrasada, el push de develop se rechaza
 *   con la principal y el tag ya subidos.
 *
 * Repos Git temporales de verdad y un repo bare como origin, sin dobles; los
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

function runScript(script: string, args: string[], cwd: string): { status: number | null; output: string } {
  const result = spawnSync('bash', [path.join(SCRIPTS_DIR, script), ...args], { cwd, encoding: 'utf8', input: '' });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

function configurar(repo: string): void {
  git(['config', 'user.email', 'test@example.com'], repo);
  git(['config', 'user.name', 'Test'], repo);
  git(['config', 'core.autocrlf', 'false'], repo);
}

async function commitEn(repo: string, fichero: string, mensaje: string): Promise<void> {
  await writeFile(path.join(repo, fichero), `${mensaje}\n`, 'utf8');
  git(['add', '-A'], repo);
  git(['commit', '-q', '-m', mensaje], repo);
}

/**
 * Un origin bare con main y develop, y dos clones: `mio` (donde se lanza el
 * script) y `otro` (el companero que sube cosas despues del clon).
 */
async function conOrigenYDosClones(fn: (r: { mio: string; otro: string; origen: string }) => Promise<void>): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-flujo-comun-'));
  try {
    const origen = path.join(raiz, 'origen.git');
    const semilla = path.join(raiz, 'semilla');
    git(['init', '-q', '--bare', '-b', 'main', origen], raiz);
    git(['init', '-q', '-b', 'main', semilla], raiz);
    configurar(semilla);
    await writeFile(path.join(semilla, '.gitignore'), 'logs/\n', 'utf8');
    await commitEn(semilla, 'README.md', 'inicial');
    git(['branch', 'develop'], semilla);
    git(['remote', 'add', 'origin', origen], semilla);
    git(['push', '-q', 'origin', 'main', 'develop'], semilla);
    const mio = path.join(raiz, 'mio');
    const otro = path.join(raiz, 'otro');
    git(['clone', '-q', '-c', 'core.autocrlf=false', origen, mio], raiz);
    git(['clone', '-q', '-c', 'core.autocrlf=false', origen, otro], raiz);
    configurar(mio);
    configurar(otro);
    git(['checkout', '-q', 'develop'], mio);
    git(['checkout', '-q', 'develop'], otro);
    await fn({ mio, otro, origen });
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
}

for (const { script, args } of [
  { script: 'update-feature.sh', args: ['feature/700-del-otro'] },
  { script: 'create-feature.sh', args: ['feature/700-del-otro'] },
] as const) {
  test(`${script} (TASK-143a, SCR-02): hace fetch antes, y trae una rama que otro subio despues del clon`, async () => {
    await conOrigenYDosClones(async ({ mio, otro }) => {
      git(['checkout', '-q', '-b', 'feature/700-del-otro'], otro);
      await commitEn(otro, 'del-otro.txt', 'trabajo del otro');
      git(['push', '-q', 'origin', 'feature/700-del-otro'], otro);
      const punta = git(['rev-parse', 'HEAD'], otro);

      const r = runScript(script, [...args], mio);
      assert.equal(r.status, 0, r.output);
      assert.equal(git(['branch', '--show-current'], mio), 'feature/700-del-otro', r.output);
      // La rama local sale de la del otro (update la mergea con develop encima).
      assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', punta, 'HEAD'], { cwd: mio }).status, 0, r.output);
    });
  });
}

test('merge-release-to-main.sh (TASK-143a, SCR-05): con la develop local atrasada, el backmerge hace pull y el push de develop no se rechaza', async () => {
  await conOrigenYDosClones(async ({ mio, otro, origen }) => {
    git(['checkout', '-q', '-b', 'release/800-cierre'], mio);
    await commitEn(mio, 'release.txt', 'cambio de release');
    // El otro sube un commit a develop: la develop local de `mio` queda atrasada.
    await commitEn(otro, 'otro-en-develop.txt', 'commit del otro en develop');
    git(['push', '-q', 'origin', 'develop'], otro);
    const delOtro = git(['rev-parse', 'HEAD'], otro);

    const r = runScript('merge-release-to-main.sh', ['release/800-cierre', '--push'], mio);
    assert.equal(r.status, 0, r.output);
    const developRemota = git(['rev-parse', 'refs/heads/develop'], origen);
    assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', delOtro, developRemota], { cwd: origen }).status, 0);
    assert.match(git(['log', '-1', '--format=%s', developRemota], origen), /^merge\(release\): release\/800-cierre -> develop \(backmerge\)$/);
    // La principal y su tag, con el mensaje de release.
    assert.match(git(['log', '-1', '--format=%s', 'refs/heads/main'], origen), /^merge\(release\): release\/800-cierre -> main$/);
    assert.equal(git(['tag', '-l', '--format=%(contents:subject)', 'v800-cierre'], origen), 'Release v800-cierre');
  });
});
