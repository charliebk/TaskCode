/**
 * TASK-065: un flag repetido que no admite repeticion aborta con error en
 * cualquier comando de taskctl, en vez de quedarse con el ultimo valor sin
 * avisar; y no toca nada. Contra un repo Git temporal real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { ID, CONFIG_AUTO, git, cli, withRepo, nueva } from '../helpers/automatico-fixtures.js';

test('flag repetido en new, board, metricas, registrar-coste, veredicto y un wrapper: aborta sin tocar nada', async () => {
  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
    nueva(repoRoot, 'feature', 'Base');
    const head = git(['rev-parse', 'HEAD'], repoRoot);
    const casos: [string[], RegExp][] = [
      [['new', '--titulo', 'Uno', '--titulo', 'Dos', '--tipo', 'fix'], /taskctl new: "--titulo" esta repetido/],
      [['new', '--titulo', 'Uno', '--tipo', 'fix', '--objetivo', 'a', '--objetivo=b'], /"--objetivo" esta repetido/],
      [['board', '--sprint', '1', '--sprint', '2'], /taskctl board: "--sprint" esta repetido/],
      [['metricas', '--tokens', '--tokens'], /taskctl metricas: "--tokens" esta repetido/],
      [['registrar-coste', ID, '--fase', 'diseno', '--fase', 'revision', '--tokens', '5'], /"--fase" esta repetido/],
      [['registrar-coste', ID, '--fase', 'diseno', '--tokens', '5', '--tokens=7'], /"--tokens" esta repetido/],
      [['pause', '--push', '--push'], /taskctl pause: "--push" esta repetido/],
      [['pausa', ID, '--cadena', 'a', '--cadena', 'b'], /--cadena esta repetido/],
    ];
    for (const [args, error] of casos) {
      const r = cli(repoRoot, args);
      assert.equal(r.status, 1, `${args.join(' ')}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, error, args.join(' '));
      assert.doesNotMatch(r.stderr, /no pudo arrancar/);
    }
    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head, 'ningun commit');
    assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '', 'nada escrito');
    assert.deepEqual(await readdir(path.join(tareasRoot, '00-planificadas')), [ID], 'new no creo ninguna tarea');

    // Los repetibles siguen funcionando: --criterio suma.
    const ok = cli(repoRoot, ['new', '--titulo', 'Tres', '--tipo', 'fix', '--criterio', 'a', '--criterio', 'b']);
    assert.equal(ok.status, 0, ok.stderr);
  });
});
