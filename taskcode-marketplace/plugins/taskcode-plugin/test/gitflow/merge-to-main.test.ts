/**
 * Test de regresion real (no mocks) para el item B2 del checklist de
 * terminacion: merge-hotfix-to-main.sh y merge-release-to-main.sh
 * fallaban duro (exit 1) en un repo sin origin, porque hacian "fetch
 * origin" y "pull --ff-only origin" sin el guard de disponibilidad que
 * TASK-008 ya habia introducido en los merge a develop.
 *
 * Mismo espiritu que test/commands/start.test.ts: repos Git temporales
 * de verdad, y un segundo repo bare haciendo de origin cuando el
 * escenario lo pide (CONVENCIONES.md, seccion Tests).
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
 * Ejecuta un script de Git-Flow como lo haria una persona: "bash
 * script.sh" (core.fileMode=false en este repo, ver HALLAZGOS.md) y con
 * stdin en EOF, que es lo que reciben los prompts interactivos
 * (show_merge_diff) cuando no hay terminal: read devuelve vacio y el
 * script continua, igual que en el smoke test de CI.
 */
function runScript(script: string, args: string[], cwd: string): { status: number | null; output: string } {
  const result = spawnSync('bash', [path.join(SCRIPTS_DIR, script), ...args], {
    cwd,
    encoding: 'utf8',
    input: '',
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

/**
 * Repo temporal con main + develop y un commit inicial. logs/ va en
 * .gitignore ANTES del primer commit (hallazgo 2 de TASK-007: el propio
 * log de Git-Flow ensuciaria el workspace y autobloquearia el script).
 */
async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-merge-main-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'inicial'], repoRoot);
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

const CASOS = [
  { script: 'merge-hotfix-to-main.sh', tipo: 'hotfix', base: 'main' },
  { script: 'merge-release-to-main.sh', tipo: 'release', base: 'develop' },
] as const;

for (const { script, tipo, base } of CASOS) {
  test(`${script}: sin origin hace merge + tag + backmerge en modo local (antes: exit 1)`, async () => {
    await withTempRepo(async (repoRoot) => {
      const rama = `${tipo}/900-caso-local`;
      git(['checkout', '-q', base], repoRoot);
      git(['checkout', '-q', '-b', rama], repoRoot);
      await writeFile(path.join(repoRoot, 'cambio.txt'), `cambio de ${tipo}\n`, 'utf8');
      git(['add', '-A'], repoRoot);
      git(['commit', '-q', '-m', `cambio en ${rama}`], repoRoot);

      const { status, output } = runScript(script, ['900-caso-local'], repoRoot);

      assert.equal(status, 0, `el script deberia terminar en 0 sin origin. Salida:\n${output}`);
      assert.match(output, /No hay conexion con origin/);

      // Evidencia real de Git, no solo el exit code.
      const logMain = git(['log', '--oneline', 'main'], repoRoot);
      assert.match(logMain, new RegExp(`merge\\(${tipo}\\): ${tipo}/900-caso-local -> main`));

      const tags = git(['tag', '--list', 'v900-caso-local'], repoRoot);
      assert.equal(tags.trim(), 'v900-caso-local');

      const logDevelop = git(['log', '--oneline', 'develop'], repoRoot);
      assert.match(logDevelop, /backmerge/);
    });
  });

  test(`${script}: sin origin y sin rama principal local falla con error claro, no con un fetch roto`, async () => {
    const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-merge-nomain-'));
    try {
      // Repo cuya unica rama es develop: resolve_main_branch cae a
      // "master", que no existe ni local ni remotamente.
      git(['init', '-q', '-b', 'develop'], repoRoot);
      git(['config', 'user.email', 'test@example.com'], repoRoot);
      git(['config', 'user.name', 'Test'], repoRoot);
      await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
      git(['add', '-A'], repoRoot);
      git(['commit', '-q', '-m', 'inicial'], repoRoot);
      git(['checkout', '-q', '-b', `${tipo}/901-sin-main`], repoRoot);

      const { status, output } = runScript(script, ['901-sin-main'], repoRoot);

      assert.notEqual(status, 0);
      assert.match(output, /no existe localmente y no hay conexion remota/);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  test(`${script}: con origin (repo bare real) sigue haciendo fetch, pull y push del merge, tag y backmerge`, async () => {
    await withTempRepo(async (repoRoot) => {
      const origin = await mkdtemp(path.join(tmpdir(), 'taskctl-merge-origin-'));
      try {
        git(['init', '-q', '--bare', origin], origin);
        git(['remote', 'add', 'origin', origin], repoRoot);
        git(['push', '-q', 'origin', 'main', 'develop'], repoRoot);

        const rama = `${tipo}/910-con-origin`;
        git(['checkout', '-q', base], repoRoot);
        git(['checkout', '-q', '-b', rama], repoRoot);
        await writeFile(path.join(repoRoot, 'cambio.txt'), `cambio de ${tipo}\n`, 'utf8');
        git(['add', '-A'], repoRoot);
        git(['commit', '-q', '-m', `cambio en ${rama}`], repoRoot);

        const { status, output } = runScript(script, ['910-con-origin', '--push'], repoRoot);

        assert.equal(status, 0, `el script deberia terminar en 0 con origin. Salida:\n${output}`);
        assert.match(output, /Conexion remota disponible/);

        // La evidencia se lee en el ORIGIN bare, no en el repo de trabajo:
        // lo que importa es que el push de verdad llego.
        const logMainOrigin = git(['log', '--oneline', 'main'], origin);
        assert.match(logMainOrigin, new RegExp(`merge\\(${tipo}\\): ${tipo}/910-con-origin -> main`));

        const tagsOrigin = git(['tag', '--list', 'v910-con-origin'], origin);
        assert.equal(tagsOrigin.trim(), 'v910-con-origin');

        const logDevelopOrigin = git(['log', '--oneline', 'develop'], origin);
        assert.match(logDevelopOrigin, /backmerge/);
      } finally {
        await rm(origin, { recursive: true, force: true });
      }
    });
  });
}
