/**
 * TASK-041: `taskctl new` con objetivo y criterios. Repos Git temporales
 * reales; la evidencia se lee del tarea.md escrito y del commit.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runNewCommand, NewTaskArgError, DEFAULT_BODY } from '../../src/commands/new.js';
import { parseTareaFile } from '../../src/core/tarea-file.js';
import { extraerSecciones } from '../../src/core/tarea-body.js';

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}

async function withRepo(fn: (repo: string, tareas: string) => Promise<void>): Promise<void> {
  const repo = await mkdtemp(path.join(tmpdir(), 'taskctl-new-'));
  try {
    git(['init', '-q', '-b', 'main'], repo);
    git(['config', 'user.email', 't@t'], repo);
    git(['config', 'user.name', 't'], repo);
    await writeFile(path.join(repo, 'README.md'), 'r\n', 'utf8');
    git(['add', '.'], repo);
    git(['commit', '-q', '-m', 'i'], repo);
    git(['checkout', '-q', '-b', 'develop'], repo);
    await fn(repo, path.join(repo, 'tareas'));
  } finally {
    await rm(repo, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

async function cuerpoDe(filePath: string): Promise<string> {
  return parseTareaFile(await readFile(filePath, 'utf8')).body;
}

test('new (TASK-041): --objetivo y --criterio repetido dejan la tarea definida en el mismo commit', async () => {
  await withRepo(async (repo, tareas) => {
    const r = await runNewCommand(
      tareas,
      ['--titulo', 'Prueba', '--tipo', 'feature', '--objetivo', 'Que X haga Y.', '--criterio', 'A pasa', '--criterio=B pasa'],
      '2026-10-04',
      { repoCwd: repo }
    );
    const secciones = extraerSecciones(await cuerpoDe(r.filePath));
    assert.equal(secciones.objetivo, 'Que X haga Y.');
    assert.deepEqual(secciones.criterios, ['A pasa', 'B pasa']);
    assert.match(git(['log', '-1', '--format=%s'], repo), /tarea creada/);
    assert.equal(git(['status', '--porcelain'], repo).trim(), '');
  });
});

test('new (TASK-041, MEN-1 de su revision): un --criterio con saltos de linea queda en una sola linea', async () => {
  await withRepo(async (repo, tareas) => {
    const r = await runNewCommand(
      tareas,
      ['--titulo', 'P', '--tipo', 'feature', '--objetivo', 'O.', '--criterio', 'primera\nsegunda'],
      '2026-10-04',
      { repoCwd: repo }
    );
    assert.deepEqual(extraerSecciones(await cuerpoDe(r.filePath)).criterios, ['primera segunda']);
  });
});

test('new (TASK-041): sin flags, el cuerpo es el de siempre', async () => {
  await withRepo(async (repo, tareas) => {
    const r = await runNewCommand(tareas, ['--titulo', 'Prueba', '--tipo', 'feature'], '2026-10-04', {
      repoCwd: repo,
    });
    assert.equal(await cuerpoDe(r.filePath), DEFAULT_BODY);
  });
});

test('new (TASK-041): --desde toma las secciones del fichero, o el fichero entero como objetivo', async () => {
  await withRepo(async (repo, tareas) => {
    const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-new-desde-'));
    try {
      const conSecciones = path.join(fuera, 'con.md');
      await writeFile(
        conSecciones,
        '# Borrador\n\n## Objetivo\n\nQue Z.\n\n## Criterios de aceptacion\n- [ ] Uno\n- Dos\n',
        'utf8'
      );
      const r1 = await runNewCommand(tareas, ['--titulo', 'Uno', '--tipo', 'feature', '--desde', conSecciones], '2026-10-04', {
        repoCwd: repo,
      });
      const s1 = extraerSecciones(await cuerpoDe(r1.filePath));
      assert.equal(s1.objetivo, 'Que Z.');
      assert.deepEqual(s1.criterios, ['Uno', 'Dos']);

      const sinSecciones = path.join(fuera, 'sin.md');
      await writeFile(sinSecciones, 'Solo prosa del objetivo.\n', 'utf8');
      const r2 = await runNewCommand(tareas, ['--titulo', 'Dos', '--tipo', 'feature', '--desde', sinSecciones], '2026-10-04', {
        repoCwd: repo,
      });
      assert.equal(extraerSecciones(await cuerpoDe(r2.filePath)).objetivo, 'Solo prosa del objetivo.');
    } finally {
      await rm(fuera, { recursive: true, force: true });
    }
  });
});

test('new (TASK-041): --desde con --criterio, un --criterio vacio o un fichero que no existe abortan sin escribir nada', async () => {
  await withRepo(async (repo, tareas) => {
    // MEN-3 de la revision: el fichero de --desde tiene que existir para que
    // el caso pruebe la exclusion con --criterio y no el ENOENT.
    const existe = path.join(tmpdir(), `taskctl-new-existe-${process.pid}.md`);
    await writeFile(existe, '## Objetivo\n\nX.\n', 'utf8');
    const vacio = path.join(tmpdir(), `taskctl-new-vacio-${process.pid}.md`);
    await writeFile(vacio, '  \n', 'utf8');
    const casos: string[][] = [
      ['--desde', existe, '--criterio', 'A'],
      ['--desde', vacio],
      ['--objetivo', 'Linea\n## Criterios de aceptacion\n- [ ] falso'],
      ['--criterio', ''],
      ['--objetivo'],
      ['--desde', path.join(tmpdir(), 'no-existe-taskctl.md')],
    ];
    for (const extra of casos) {
      await assert.rejects(
        runNewCommand(tareas, ['--titulo', 'X', '--tipo', 'feature', ...extra], '2026-10-04', { repoCwd: repo }),
        NewTaskArgError,
        extra.join(' ')
      );
    }
    await rm(existe, { force: true });
    await rm(vacio, { force: true });
    assert.equal(git(['status', '--porcelain'], repo).trim(), '');
    assert.equal(git(['log', '--oneline'], repo).trim().split('\n').length, 1, 'no se tenia que commitear nada');
  });
});
