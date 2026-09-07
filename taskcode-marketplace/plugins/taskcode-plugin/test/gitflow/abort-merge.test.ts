/**
 * Test de regresion real (no mocks) para el frente S4 de TASK-029:
 * abort-merge.sh solo conocia MERGE_HEAD y los directorios de rebase,
 * asi que con un cherry-pick o un revert a medias decia "El workspace
 * esta en estado normal" y salia 0 — un mensaje falso sobre un repo
 * que esta a medias.
 *
 * Mismo espiritu que test/gitflow/merge-to-main.test.ts: repos Git
 * temporales de verdad y conflictos provocados de verdad
 * (CONVENCIONES.md, seccion Tests). Los testigos que Git deja en .git/
 * son justo lo que este test fija, porque no son simetricos entre
 * cherry-pick y revert y no se pueden dar por supuestos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/gitflow -> dist/test -> dist -> raiz del paquete -> scripts/gitflow
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');
const SCRIPT = 'abort-merge.sh';

/** git que asevera exito. Para los comandos que conflictan a proposito se usa gitRaw. */
function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

function gitRaw(args: string[], cwd: string): { status: number | null; output: string } {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

/**
 * Ejecuta el script como lo haria una persona: "bash script.sh"
 * (core.fileMode=false en este repo, ver HALLAZGOS.md). `respuesta`
 * es lo que recibe el `read -rp` de confirmacion: "" es EOF (no hay
 * terminal) y equivale a no confirmar; "s\n" confirma.
 */
function runScript(cwd: string, respuesta = ''): { status: number | null; output: string } {
  const result = spawnSync('bash', [path.join(SCRIPTS_DIR, SCRIPT)], {
    cwd,
    encoding: 'utf8',
    input: respuesta,
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

/**
 * Repo temporal con un commit inicial en main. logs/ va en .gitignore
 * ANTES del primer commit (hallazgo 2 de TASK-007: el propio registro
 * de Git-Flow ensuciaria el workspace).
 */
async function withTempRepo(fn: (repoRoot: string) => Promise<void>): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-abort-merge-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nl2\nl3\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'base'], repoRoot);
    await fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
}

/** Deja el repo con un cherry-pick en conflicto de verdad. */
async function provocarCherryPick(repoRoot: string): Promise<void> {
  git(['checkout', '-q', '-b', 'otra'], repoRoot);
  await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
  git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
  git(['checkout', '-q', 'main'], repoRoot);
  await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
  git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
  const cp = gitRaw(['cherry-pick', 'otra'], repoRoot);
  assert.notEqual(cp.status, 0, `el cherry-pick deberia conflictar:\n${cp.output}`);
  assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), true);
}

/** Deja el repo con un revert en conflicto de verdad. */
async function provocarRevert(repoRoot: string): Promise<void> {
  await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nDOS\nl3\n', 'utf8');
  git(['commit', '-q', '-am', 'segundo'], repoRoot);
  await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nTRES\nl3\n', 'utf8');
  git(['commit', '-q', '-am', 'tercero'], repoRoot);
  const rv = gitRaw(['revert', '--no-edit', 'HEAD~1'], repoRoot);
  assert.notEqual(rv.status, 0, `el revert deberia conflictar:\n${rv.output}`);
  assert.equal(existsSync(path.join(repoRoot, '.git', 'REVERT_HEAD')), true);
}

// ── Cherry-pick ─────────────────────────────────────────────────────

test(`${SCRIPT}: detecta un cherry-pick en conflicto (antes: "estado normal" y exit 0)`, async () => {
  await withTempRepo(async (repoRoot) => {
    await provocarCherryPick(repoRoot);

    const { status, output } = runScript(repoRoot);

    assert.equal(status, 0, `salida:\n${output}`);
    // Lo que fallaba: el script afirmaba que no habia nada a medias.
    assert.doesNotMatch(output, /estado normal/, `salida:\n${output}`);
    assert.match(output, /Cherry-pick en curso detectado/);
    assert.match(output, /Archivos en conflicto/);
    assert.match(output, /a\.txt/);
    // Sin confirmar (EOF) NO aborta nada: el estado sigue igual.
    assert.match(output, /El cherry-pick sigue en curso/);
    assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), true);
  });
});

test(`${SCRIPT}: confirmando, aborta el cherry-pick de verdad y deja el workspace limpio`, async () => {
  await withTempRepo(async (repoRoot) => {
    await provocarCherryPick(repoRoot);

    const { status, output } = runScript(repoRoot, 's\n');

    assert.equal(status, 0, `salida:\n${output}`);
    assert.match(output, /Cherry-pick abortado/);
    assert.match(output, /COMPLETADO/);
    // Evidencia de Git, no solo el mensaje del script.
    assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), false);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'main');
  });
});

// ── Revert ──────────────────────────────────────────────────────────

test(`${SCRIPT}: detecta un revert en conflicto (antes: "estado normal" y exit 0)`, async () => {
  await withTempRepo(async (repoRoot) => {
    await provocarRevert(repoRoot);

    const { status, output } = runScript(repoRoot);

    assert.equal(status, 0, `salida:\n${output}`);
    assert.doesNotMatch(output, /estado normal/, `salida:\n${output}`);
    assert.match(output, /Revert en curso detectado/);
    assert.match(output, /El revert sigue en curso/);
    assert.equal(existsSync(path.join(repoRoot, '.git', 'REVERT_HEAD')), true);
  });
});

test(`${SCRIPT}: confirmando, aborta el revert de verdad y deja el workspace limpio`, async () => {
  await withTempRepo(async (repoRoot) => {
    await provocarRevert(repoRoot);

    const { status, output } = runScript(repoRoot, 's\n');

    assert.equal(status, 0, `salida:\n${output}`);
    assert.match(output, /Revert abortado/);
    assert.equal(existsSync(path.join(repoRoot, '.git', 'REVERT_HEAD')), false);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

// ── Secuencia a medias sin CHERRY_PICK_HEAD / REVERT_HEAD ───────────

test(`${SCRIPT}: detecta una secuencia a medias cuando el unico testigo es .git/sequencer`, async () => {
  await withTempRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'otra'], repoRoot);
    await writeFile(path.join(repoRoot, 'b.txt'), 'b\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'limpio'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
    git(['commit', '-q', '-am', 'conflictivo'], repoRoot);
    await writeFile(path.join(repoRoot, 'c.txt'), 'c\n', 'utf8');
    git(['add', '-A'], repoRoot);
    git(['commit', '-q', '-m', 'pendiente'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);

    const cp = gitRaw(['cherry-pick', 'main..otra'], repoRoot);
    assert.notEqual(cp.status, 0, `deberia conflictar en el segundo commit:\n${cp.output}`);

    // Resolver y comitear a mano en vez de "cherry-pick --continue":
    // Git borra CHERRY_PICK_HEAD y deja .git/sequencer con lo que falta.
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nRESUELTO\nl3\n', 'utf8');
    git(['add', 'a.txt'], repoRoot);
    git(['commit', '-q', '-m', 'resuelto a mano'], repoRoot);
    assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), false);
    assert.equal(existsSync(path.join(repoRoot, '.git', 'sequencer')), true);

    const { status, output } = runScript(repoRoot);

    assert.equal(status, 0, `salida:\n${output}`);
    assert.doesNotMatch(output, /estado normal/, `salida:\n${output}`);
    assert.match(output, /Cherry-pick en curso detectado/);
    assert.match(output, /Commits pendientes en la secuencia/);
  });
});

// ── No regresion: lo que ya funcionaba sigue funcionando ────────────

test(`${SCRIPT}: sigue abortando un merge en conflicto (no regresion)`, async () => {
  await withTempRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'otra'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
    git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
    const mg = gitRaw(['merge', 'otra'], repoRoot);
    assert.notEqual(mg.status, 0, `el merge deberia conflictar:\n${mg.output}`);

    const { status, output } = runScript(repoRoot, 's\n');

    assert.equal(status, 0, `salida:\n${output}`);
    assert.match(output, /Merge en curso detectado/);
    assert.match(output, /Merge abortado/);
    assert.equal(existsSync(path.join(repoRoot, '.git', 'MERGE_HEAD')), false);
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
  });
});

test(`${SCRIPT}: sigue abortando un rebase en conflicto (no regresion)`, async () => {
  await withTempRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'otra'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
    git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
    git(['checkout', '-q', 'otra'], repoRoot);
    const rb = gitRaw(['rebase', 'main'], repoRoot);
    assert.notEqual(rb.status, 0, `el rebase deberia conflictar:\n${rb.output}`);

    const { status, output } = runScript(repoRoot, 's\n');

    assert.equal(status, 0, `salida:\n${output}`);
    assert.match(output, /Rebase en curso detectado/);
    assert.match(output, /Rebase abortado/);
    assert.equal(existsSync(path.join(repoRoot, '.git', 'rebase-merge')), false);
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'otra');
  });
});

test(`${SCRIPT}: en un repo sin nada a medias sigue diciendo que el estado es normal`, async () => {
  await withTempRepo(async (repoRoot) => {
    const { status, output } = runScript(repoRoot);

    assert.equal(status, 0, `salida:\n${output}`);
    assert.match(output, /estado normal/);
    // El mensaje nombra ya las cuatro operaciones que sabe detectar.
    assert.match(output, /merge, rebase, cherry-pick ni revert/);
  });
});

test(`${SCRIPT}: un "cherry-pick -n" en conflicto no se reporta como secuencia (Git tampoco lo aborta)`, async () => {
  await withTempRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'otra'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nOTRA\nl3\n', 'utf8');
    git(['commit', '-q', '-am', 'cambio en otra'], repoRoot);
    git(['checkout', '-q', 'main'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.txt'), 'l1\nMAIN\nl3\n', 'utf8');
    git(['commit', '-q', '-am', 'cambio en main'], repoRoot);
    const cp = gitRaw(['cherry-pick', '-n', 'otra'], repoRoot);
    assert.notEqual(cp.status, 0);

    // Con -n Git no escribe CHERRY_PICK_HEAD ni sequencer: no hay
    // secuencia que abortar, solo un indice en conflicto.
    assert.equal(existsSync(path.join(repoRoot, '.git', 'CHERRY_PICK_HEAD')), false);
    assert.equal(existsSync(path.join(repoRoot, '.git', 'sequencer')), false);
    const abort = gitRaw(['cherry-pick', '--abort'], repoRoot);
    assert.notEqual(abort.status, 0, 'Git deberia negarse a abortar aqui');

    const { status, output } = runScript(repoRoot);

    assert.equal(status, 0, `salida:\n${output}`);
    assert.match(output, /estado normal/);
  });
});
