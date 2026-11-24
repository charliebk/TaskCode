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

// MEN H-2 de la revision: release y hotfix, porque tipo y etiqueta del tag son parametros de una sola funcion.
for (const { script, tipo, etiqueta, base } of [
  { script: 'merge-release-to-main.sh', tipo: 'release', etiqueta: 'Release', base: 'develop' },
  { script: 'merge-hotfix-to-main.sh', tipo: 'hotfix', etiqueta: 'Hotfix', base: 'main' },
] as const) {
  test(`${script} (TASK-143a, SCR-05): con la develop local atrasada, el backmerge hace pull y el push de develop no se rechaza`, async () => {
    await conOrigenYDosClones(async ({ mio, otro, origen }) => {
      const rama = `${tipo}/800-cierre`;
      git(['checkout', '-q', base], mio);
      git(['checkout', '-q', '-b', rama], mio);
      await commitEn(mio, `${tipo}.txt`, `cambio de ${tipo}`);
      // El otro sube un commit a develop: la develop local de `mio` queda atrasada.
      await commitEn(otro, 'otro-en-develop.txt', 'commit del otro en develop');
      git(['push', '-q', 'origin', 'develop'], otro);
      const delOtro = git(['rev-parse', 'HEAD'], otro);

      const r = runScript(script, [rama, '--push'], mio);
      assert.equal(r.status, 0, r.output);
      const developRemota = git(['rev-parse', 'refs/heads/develop'], origen);
      assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', delOtro, developRemota], { cwd: origen }).status, 0);
      assert.equal(git(['log', '-1', '--format=%s', developRemota], origen), `merge(${tipo}): ${rama} -> develop (backmerge)`);
      assert.equal(git(['log', '-1', '--format=%s', 'refs/heads/main'], origen), `merge(${tipo}): ${rama} -> main`);
      assert.equal(git(['tag', '-l', '--format=%(contents:subject)', 'v800-cierre'], origen), `${etiqueta} v800-cierre`);
    });
  });
}

test('merge-release-to-main.sh (MEN H-1 de la revision de TASK-143a): con develop divergida de origin aborta antes de tocar main y sin tag', async () => {
  await conOrigenYDosClones(async ({ mio, otro, origen }) => {
    await commitEn(mio, 'local-en-develop.txt', 'commit local sin subir');
    git(['checkout', '-q', '-b', 'release/801-diverge'], mio);
    await commitEn(mio, 'release.txt', 'cambio de release');
    await commitEn(otro, 'otro-en-develop.txt', 'commit del otro en develop');
    git(['push', '-q', 'origin', 'develop'], otro);
    const mainAntes = git(['rev-parse', 'refs/heads/main'], origen);

    const r = runScript('merge-release-to-main.sh', ['release/801-diverge', '--push'], mio);
    assert.notEqual(r.status, 0, r.output);
    assert.equal(git(['rev-parse', 'refs/heads/main'], origen), mainAntes);
    assert.equal(git(['rev-parse', 'refs/heads/main'], mio), mainAntes, 'la main local tampoco se mueve');
    assert.equal(git(['tag', '-l', 'v801-diverge'], mio), '');
  });
});

// MEN H-2: el tipo del mensaje de update es un parametro; cada script pasa el suyo.
for (const { script, tipo, base } of [
  { script: 'update-fix.sh', tipo: 'fix', base: 'develop' },
  { script: 'update-release.sh', tipo: 'release', base: 'develop' },
  { script: 'update-hotfix.sh', tipo: 'hotfix', base: 'main' },
] as const) {
  test(`${script} (TASK-143a, MEN H-2): el merge de la base lleva update(${tipo})`, async () => {
    await conOrigenYDosClones(async ({ mio }) => {
      const rama = `${tipo}/702-tipo`;
      git(['checkout', '-q', base], mio);
      git(['checkout', '-q', '-b', rama], mio);
      await commitEn(mio, 'rama.txt', 'trabajo en la rama');
      git(['checkout', '-q', base], mio);
      await commitEn(mio, 'base.txt', 'avance de la base');
      git(['push', '-q', 'origin', base], mio);

      const r = runScript(script, [rama], mio);
      assert.equal(r.status, 0, r.output);
      assert.equal(git(['log', '-1', '--format=%s', rama], mio), `update(${tipo}): ${base} -> ${rama}`);
    });
  });
}

test('create-release.sh (TASK-143a, MEN H-3): con develop local atrasada, la rama nace de la punta de origin', async () => {
  await conOrigenYDosClones(async ({ mio, otro }) => {
    await commitEn(otro, 'otro-en-develop.txt', 'commit del otro en develop');
    git(['push', '-q', 'origin', 'develop'], otro);
    const delOtro = git(['rev-parse', 'HEAD'], otro);

    const r = runScript('create-release.sh', ['803-desde-origin'], mio);
    assert.equal(r.status, 0, r.output);
    assert.equal(git(['branch', '--show-current'], mio), 'release/803-desde-origin');
    assert.equal(git(['rev-parse', 'HEAD'], mio), delOtro, r.output);
  });
});
