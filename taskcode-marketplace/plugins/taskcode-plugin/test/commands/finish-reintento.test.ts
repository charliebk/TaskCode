/**
 * TASK-123 (F-16): la via de reintento de `finish` (la rama ya integrada en la
 * de integracion) verifica el arbol de esa rama antes de cerrar, y el guardian
 * de merges ve el `git commit` que cierra un merge en curso. Repos Git
 * temporales de verdad y los scripts de Git-Flow tal cual; el comando de
 * verificacion vive fuera del repo y lee su desenlace de un fichero junto a el.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

const SCRIPT = `
const fs = require('node:fs');
const dir = __dirname;
fs.appendFileSync(dir + '/cuenta', 'x');
const d = fs.readFileSync(dir + '/desenlace', 'utf8').trim();
if (d === 'ok') { process.exit(0); }
console.error('ERROR: 2 tests fallan'); process.exit(3);
`;

interface Verif {
  desenlace(d: 'ok' | 'ko'): Promise<void>;
  n(): number;
}

async function conVerif(fn: (v: Verif, repo: string, tareas: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'finish-reintento-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  await writeFile(path.join(dir, 'desenlace'), 'ok', 'utf8');
  const v: Verif = {
    desenlace: (d) => writeFile(path.join(dir, 'desenlace'), d, 'utf8'),
    n: () => (existsSync(path.join(dir, 'cuenta')) ? readFileSync(path.join(dir, 'cuenta'), 'utf8').length : 0),
  };
  try {
    await withTempRepo(async (repo, tareas) => {
      await mkdir(path.join(repo, '.taskcode'), { recursive: true });
      const comando = `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')}`;
      await writeFile(path.join(repo, '.taskcode', 'config.yml'), `comando_verificacion: "${comando}"\n`, 'utf8');
      commitAll(repo, 'config');
      await fn(v, repo, tareas);
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function finishFalla(tareas: string, repo: string, argv: string[]): Promise<string> {
  try {
    await runFinishCommand(tareas, argv, '2026-11-12', { repoCwd: repo, scriptsDir: SCRIPTS_DIR });
  } catch (e) {
    return (e as Error).message;
  }
  return assert.fail('finish deberia haber abortado');
}

/** Rama y develop cambian el mismo fichero: el merge de finish choca. */
async function prepararConflicto(repo: string, tareas: string, id: string): Promise<ReturnType<typeof sampleTask>> {
  git(['checkout', '-q', 'develop'], repo);
  await writeFile(path.join(repo, 'comun.txt'), 'base\n', 'utf8');
  commitAll(repo, 'comun base');
  const task = sampleTask({ id });
  await setupTaskEnRevision(repo, tareas, task);
  await writeFile(path.join(repo, 'comun.txt'), 'version de la tarea\n', 'utf8');
  commitAll(repo, `feat(${id}): cambia comun`);
  git(['checkout', '-q', 'develop'], repo);
  await writeFile(path.join(repo, 'comun.txt'), 'version de develop\n', 'utf8');
  commitAll(repo, 'otra tarea cambia comun');
  git(['checkout', '-q', task.rama], repo);
  return task;
}

function mergeHead(repo: string): boolean {
  return spawnSync('git', ['rev-parse', '-q', '--verify', 'MERGE_HEAD'], { cwd: repo }).status === 0;
}

test('F-16 caso A: merge a mano en develop con la verificacion en rojo -> finish no cierra, lo dice y vuelve a la rama', async () => {
  await conVerif(async (v, repo, tareas) => {
    const task = sampleTask({ id: 'TASK-901' });
    await setupTaskEnRevision(repo, tareas, task);
    await v.desenlace('ko');
    git(['checkout', '-q', 'develop'], repo);
    git(['merge', '--no-ff', '-q', '-m', 'merge a mano', task.rama], repo);
    git(['checkout', '-q', task.rama], repo);
    const error = await finishFalla(tareas, repo, ['TASK-901']);
    assert.match(error, /ya esta integrada en "develop", pero la verificacion de su arbol no sale en verde/);
    assert.match(error, /no se ha movido de carpeta/);
    assert.match(error, /2 tests fallan/);
    assert.match(error, /relanza taskctl finish TASK-901 desde ella/);
    assert.equal(v.n(), 1, 'la verificacion corre una vez, sobre develop');
    assert.equal(git(['branch', '--show-current'], repo).trim(), task.rama);
    assert.equal((await readTareaFile(tareas, 'TASK-901'))?.task.estado, 'en-revision');
  });
});

test('F-16 caso A con --sin-verificacion: cierra sin ejecutar nada y lo anota en la tarea', async () => {
  await conVerif(async (v, repo, tareas) => {
    const task = sampleTask({ id: 'TASK-903' });
    await setupTaskEnRevision(repo, tareas, task);
    await v.desenlace('ko');
    git(['checkout', '-q', 'develop'], repo);
    git(['merge', '--no-ff', '-q', '-m', 'merge a mano', task.rama], repo);
    const avisos: string[] = [];
    const r = await runFinishCommand(tareas, ['TASK-903', '--sin-verificacion'], '2026-11-12', {
      repoCwd: repo,
      scriptsDir: SCRIPTS_DIR,
      onAviso: (a) => avisos.push(a),
    });
    assert.equal(r.cierre, 'terminada');
    assert.equal(v.n(), 0);
    assert.ok(avisos.some((a) => /--sin-verificacion: la rama ya estaba integrada/.test(a)));
    assert.match((await readTareaFile(tareas, 'TASK-903'))?.body ?? '', /## Verificacion omitida/);
  });
});

test('F-16 caso verde: el reintento con la verificacion en verde cierra como siempre', async () => {
  await conVerif(async (v, repo, tareas) => {
    const task = sampleTask({ id: 'TASK-904' });
    await setupTaskEnRevision(repo, tareas, task);
    git(['checkout', '-q', 'develop'], repo);
    git(['merge', '--no-ff', '-q', '-m', 'merge a mano', task.rama], repo);
    git(['checkout', '-q', task.rama], repo);
    const r = await runFinishCommand(tareas, ['TASK-904'], '2026-11-12', { repoCwd: repo, scriptsDir: SCRIPTS_DIR });
    assert.equal(r.cierre, 'terminada');
    assert.equal(v.n(), 1);
    assert.equal((await readTareaFile(tareas, 'TASK-904'))?.task.estado, 'terminada');
  });
});

test('F-16 caso B: conflicto en finish; el guardian bloquea los commits que lo cerrarian en develop, y si se cierra igual el reintento verifica y aborta en rojo', async () => {
  await conVerif(async (v, repo, tareas) => {
    const task = await prepararConflicto(repo, tareas, 'TASK-902');
    const error = await finishFalla(tareas, repo, ['TASK-902']);
    assert.match(error, /codigo/);
    // El remedio en el mensaje de finish (criterio 4).
    assert.match(error, /taskctl abort-merge/);
    assert.match(error, /integra la base en la rama de la tarea/);
    assert.match(error, /relanza taskctl finish TASK-902 desde la rama de la tarea/);
    assert.equal(v.n(), 1, 'la verificacion corrio una vez, sobre la rama');
    assert.equal(git(['branch', '--show-current'], repo).trim(), 'develop');
    assert.ok(mergeHead(repo), 'merge en curso en develop');

    for (const command of ['git commit --no-edit', 'git add -A && git commit -m "resuelvo"', 'git commit -am "resuelvo"', 'git merge --continue']) {
      const d = decidirPreToolUse({ cwd: repo, tool_input: { command } });
      assert.equal(d.codigo, 2, `el guardian deberia bloquear «${command}»`);
      assert.match(d.stderr, /cerraria en "develop" el merge en curso/);
      assert.match(d.stderr, /taskctl abort-merge/);
      assert.match(d.stderr, /vuelve a lanzar taskctl finish TASK-NNN desde ella/);
    }

    // La resolucion rompe algo, y se commitea igualmente (fuera del guardian).
    await writeFile(path.join(repo, 'comun.txt'), 'resolucion ROTA\n', 'utf8');
    git(['add', '-A'], repo);
    git(['commit', '-q', '--no-edit'], repo);
    await v.desenlace('ko');
    git(['checkout', '-q', task.rama], repo);

    const error2 = await finishFalla(tareas, repo, ['TASK-902']);
    assert.match(error2, /la verificacion de su arbol no sale en verde/);
    assert.equal(v.n(), 2, 'el reintento verifica la resolucion');
    assert.equal((await readTareaFile(tareas, 'TASK-902'))?.task.estado, 'en-revision');
  });
});

test('F-16 guardian: un git commit sin MERGE_HEAD en develop, o con MERGE_HEAD en la rama de la tarea, no se toca', async () => {
  await conVerif(async (_v, repo, tareas) => {
    git(['checkout', '-q', 'develop'], repo);
    for (const command of ['git commit -m "x"', 'git add -A && git commit -am "x"']) {
      assert.equal(decidirPreToolUse({ cwd: repo, tool_input: { command } }).codigo, 0, command);
    }
    // Integrar la base en la rama de la tarea es el remedio: su commit no se bloquea.
    const task = await prepararConflicto(repo, tareas, 'TASK-905');
    assert.equal(git(['branch', '--show-current'], repo).trim(), task.rama);
    const r = spawnSync('git', ['merge', '-q', 'develop'], { cwd: repo });
    assert.notEqual(r.status, 0, 'el merge de develop en la rama debe chocar');
    assert.ok(mergeHead(repo));
    for (const command of ['git commit --no-edit', 'git merge --continue']) {
      assert.equal(decidirPreToolUse({ cwd: repo, tool_input: { command } }).codigo, 0, command);
    }
  });
});

test('F-16 guardian (IMP-1 r1): sincronizar develop con origin/develop con conflicto no bloquea el commit que lo cierra', async () => {
  await conVerif(async (_v, repo) => {
    const fuera = await mkdtemp(path.join(tmpdir(), 'finish-reintento-remoto-'));
    try {
      const remoto = path.join(fuera, 'origen.git');
      const otro = path.join(fuera, 'otro');
      git(['checkout', '-q', 'develop'], repo);
      await writeFile(path.join(repo, 'comun.txt'), 'base\n', 'utf8');
      commitAll(repo, 'comun base');
      git(['init', '-q', '--bare', remoto], fuera);
      git(['remote', 'add', 'origin', remoto], repo);
      git(['push', '-q', 'origin', 'develop'], repo);
      // Otro clon empuja un cambio a origin/develop sobre el mismo fichero.
      git(['clone', '-q', '-b', 'develop', remoto, otro], fuera);
      git(['config', 'user.email', 'otro@example.com'], otro);
      git(['config', 'user.name', 'Otro'], otro);
      await writeFile(path.join(otro, 'comun.txt'), 'version remota\n', 'utf8');
      commitAll(otro, 'docs remota');
      git(['push', '-q', 'origin', 'develop'], otro);
      // Commit local en develop (documentacion suelta) y sincronizar choca.
      await writeFile(path.join(repo, 'comun.txt'), 'version local\n', 'utf8');
      commitAll(repo, 'docs local');
      git(['fetch', '-q', 'origin'], repo);
      assert.equal(decidirPreToolUse({ cwd: repo, tool_input: { command: 'git merge origin/develop' } }).codigo, 0);
      const r = spawnSync('git', ['merge', '-q', 'origin/develop'], { cwd: repo });
      assert.notEqual(r.status, 0, 'el merge de origin/develop debe chocar');
      assert.ok(mergeHead(repo));
      await writeFile(path.join(repo, 'comun.txt'), 'resuelto\n', 'utf8');
      git(['add', '-A'], repo);
      for (const command of ['git commit --no-edit', 'git merge --continue']) {
        const d = decidirPreToolUse({ cwd: repo, tool_input: { command } });
        assert.equal(d.codigo, 0, `no deberia bloquear «${command}»: ${d.stderr}`);
      }
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });
});
