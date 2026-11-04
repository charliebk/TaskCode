/**
 * Puerta de verificacion de `taskctl finish` (TASK-072, capa 1). Repos Git
 * temporales de verdad y los scripts de Git-Flow tal cual; el comando de
 * verificacion es un script de node que vive FUERA del repo (no ensucia el
 * workspace) y lee su desenlace de un fichero junto a el, asi que se puede
 * cambiar lo que hace sin tocar el arbol. Cuenta sus ejecuciones.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import { anotarVerificacionOmitida } from '../../src/core/transiciones.js';
import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
import { guardarMemo, huellaDelArbol } from '../../src/fs/verificacion.js';
import { resolverConfig } from '../../src/core/config.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

const SCRIPT = `
const fs = require('node:fs');
const dir = __dirname;
fs.appendFileSync(dir + '/cuenta', 'x');
const d = fs.readFileSync(dir + '/desenlace', 'utf8').trim();
if (d === 'ok') { console.log('todo en verde'); process.exit(0); }
if (d === 'ensucia') { fs.writeFileSync('cobertura.txt', 'x'); process.exit(0); }
console.error('ERROR: 2 tests fallan'); process.exit(3);
`;

interface Verif {
  dir: string;
  desenlace(d: 'ok' | 'ko' | 'ensucia'): Promise<void>;
  ejecuciones(): number;
}

async function conVerificacion(fn: (v: Verif, repoRoot: string, tareasRoot: string) => Promise<void>, opts: { conComando?: boolean } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'finish-verif-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  await writeFile(path.join(dir, 'desenlace'), 'ok', 'utf8');
  const v: Verif = {
    dir,
    desenlace: (d) => writeFile(path.join(dir, 'desenlace'), d, 'utf8'),
    ejecuciones: () => (existsSync(path.join(dir, 'cuenta')) ? readFileSync(path.join(dir, 'cuenta'), 'utf8').length : 0),
  };
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      const comando = `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')}`;
      await writeFile(
        path.join(repoRoot, '.taskcode', 'config.yml'),
        opts.conComando === false ? 'rama_base: develop\n' : `comando_verificacion: "${comando}"\n`,
        'utf8'
      );
      commitAll(repoRoot, 'config');
      await fn(v, repoRoot, tareasRoot);
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const integradaEnDevelop = (rama: string, cwd: string) =>
  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;

test('finish (puerta): con la verificacion en rojo aborta con su salida, sin merge y sin mover la tarea', async () => {
  await conVerificacion(async (v, repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-720' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await v.desenlace('ko');
    const developAntes = git(['rev-parse', 'develop'], repoRoot).trim();
    await assert.rejects(
      () => runFinishCommand(tareasRoot, ['TASK-720'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match(e.message, /no se mergea con la verificacion en rojo/);
        assert.match(e.message, /ERROR: 2 tests fallan/);
        assert.match(e.message, /codigo 3|3/);
        assert.match(e.message, /taskctl finish TASK-720 --sin-verificacion/);
        return true;
      }
    );
    assert.equal(v.ejecuciones(), 1);
    assert.equal(git(['rev-parse', 'develop'], repoRoot).trim(), developAntes, 'develop no se ha movido');
    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), task.rama);
    assert.equal((await readTareaFile(tareasRoot, 'TASK-720'))?.task.estado, 'en-revision');
    assert.equal(git(['status', '--porcelain'], repoRoot), '');
  });
});

test('finish (puerta): en verde ejecuta la verificacion SIEMPRE (aunque haya memo) y mergea; el guardian reconoce ese verde', async () => {
  await conVerificacion(async (v, repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-721' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    // El guardian bloquea el merge directo antes de verificar...
    const directo = `git checkout develop && git merge --no-ff ${task.rama}`;
    assert.equal(decidirPreToolUse({ cwd: repoRoot, tool_input: { command: directo } }).codigo, 2);
    // Un verde ya guardado para este mismo arbol no evita la ejecucion (decision D3).
    const comando = resolverConfig(repoRoot).comando_verificacion as string;
    const huella = huellaDelArbol(repoRoot, comando, 600);
    assert.ok(huella);
    guardarMemo(repoRoot, huella, { comando, estado: 'verde', codigo: 0, duracionMs: 1, timeoutS: 600, bytesTotales: 0, cola: '' });
    const r = await runFinishCommand(tareasRoot, ['TASK-721'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    assert.equal(v.ejecuciones(), 1, 'finish ejecuta aunque haya un verde guardado');
    assert.equal(r.cierre, 'terminada');
    assert.ok(integradaEnDevelop(task.rama, repoRoot));
    assert.equal((await readTareaFile(tareasRoot, 'TASK-721'))?.task.estado, 'terminada');
    // finish dejo el verde del commit de la rama en el memo: el merge (ya hecho) no se bloquea.
    assert.equal(decidirPreToolUse({ cwd: repoRoot, tool_input: { command: directo } }).codigo, 0);
  });
});

test('finish (puerta): --sin-verificacion no ejecuta, mergea y deja la anotacion commiteada en la rama ANTES del merge', async () => {
  await conVerificacion(async (v, repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-722' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await v.desenlace('ko');
    const avisos: string[] = [];
    await runFinishCommand(tareasRoot, ['TASK-722', '--sin-verificacion'], '2026-11-04', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
      ahora: '2026-11-04T10:00:00Z',
      onAviso: (a) => avisos.push(a),
    });
    assert.equal(v.ejecuciones(), 0);
    assert.ok(avisos.some((a) => /cierre con --sin-verificacion: no se ha ejecutado/.test(a)), avisos.join('\n'));
    const fin = await readTareaFile(tareasRoot, 'TASK-722');
    assert.equal(fin?.task.estado, 'terminada');
    assert.match(fin?.body ?? '', /## Verificacion omitida\n\n- 2026-11-04T10:00:00Z: taskctl finish --sin-verificacion; no se ejecuto `node /);
    // El commit de la anotacion esta en la rama de la tarea, y entro con el merge.
    const log = git(['log', '--format=%s', task.rama], repoRoot);
    assert.match(log.split('\n')[0] ?? '', /^chore\(TASK-722\): cierre sin verificacion$/);
    assert.ok(integradaEnDevelop(task.rama, repoRoot));
  });
});

test('finish (puerta): si el proceso muere tras la anotacion (script de merge roto), el rastro del salto ya esta commiteado', async () => {
  await conVerificacion(async (_v, repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-723' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    const scriptsRotos = await mkdtemp(path.join(tmpdir(), 'finish-scripts-rotos-'));
    try {
      await writeFile(path.join(scriptsRotos, 'merge-feature-to-develop.sh'), 'exit 7\n', 'utf8');
      await assert.rejects(
        () => runFinishCommand(tareasRoot, ['TASK-723', '--sin-verificacion'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: scriptsRotos }),
        /termino con codigo 7/
      );
    } finally {
      await rm(scriptsRotos, { recursive: true, force: true });
    }
    assert.equal(git(['status', '--porcelain'], repoRoot), '');
    const enRama = git(['show', `${task.rama}:tareas/03-en-revision/TASK-723/tarea.md`], repoRoot);
    assert.match(enRama, /## Verificacion omitida/);
  });
});

test('finish (puerta): una verificacion verde que ensucia el arbol aborta con mensaje propio, sin mergear', async () => {
  await conVerificacion(async (v, repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-724' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    await v.desenlace('ensucia');
    await assert.rejects(
      () => runFinishCommand(tareasRoot, ['TASK-724'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      /salio en verde, pero ha dejado cambios en el arbol de trabajo/
    );
    assert.equal(integradaEnDevelop(task.rama, repoRoot), false);
  });
});

test('finish (puerta): fuera de la rama de la tarea no verifica otro arbol: aborta y dice a que rama cambiarse', async () => {
  await conVerificacion(async (v, repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-725' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    git(['checkout', '-q', '-b', 'otra'], repoRoot);
    await assert.rejects(
      () => runFinishCommand(tareasRoot, ['TASK-725'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR }),
      new RegExp(`la rama activa es "otra", no "${task.rama.replace(/\//g, '\\/')}"`)
    );
    assert.equal(v.ejecuciones(), 0);
  });
});

test('finish (puerta): no corre en el camino idempotente (los merges ya estan hechos)', async () => {
  await conVerificacion(async (v, repoRoot, tareasRoot) => {
    const task = sampleTask({ id: 'TASK-726' });
    await setupTaskEnRevision(repoRoot, tareasRoot, task);
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['merge', '-q', '--no-ff', '-m', 'merge a mano', task.rama], repoRoot);
    await v.desenlace('ko');
    const r = await runFinishCommand(tareasRoot, ['TASK-726'], '2026-11-04', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
    assert.equal(r.cierre, 'terminada');
    assert.equal(v.ejecuciones(), 0);
  });
});

test('finish (puerta): sin comando_verificacion no hay puerta, y --sin-verificacion solo avisa', async () => {
  await conVerificacion(
    async (v, repoRoot, tareasRoot) => {
      const task = sampleTask({ id: 'TASK-727' });
      await setupTaskEnRevision(repoRoot, tareasRoot, task);
      const avisos: string[] = [];
      await runFinishCommand(tareasRoot, ['TASK-727', '--sin-verificacion'], '2026-11-04', {
        repoCwd: repoRoot,
        scriptsDir: SCRIPTS_DIR,
        onAviso: (a) => avisos.push(a),
      });
      assert.equal(v.ejecuciones(), 0);
      assert.ok(avisos.some((a) => /no declara comando_verificacion/.test(a)));
      assert.doesNotMatch((await readTareaFile(tareasRoot, 'TASK-727'))?.body ?? '', /Verificacion omitida/);
    },
    { conComando: false }
  );
});

test('anotarVerificacionOmitida: crea la seccion al final y en un reintento anade la linea dentro de ella', () => {
  const uno = anotarVerificacionOmitida('## Objetivo\nx\n', '2026-11-04T10:00:00Z', 'npm `test`');
  assert.equal(uno, "## Objetivo\nx\n\n## Verificacion omitida\n\n- 2026-11-04T10:00:00Z: taskctl finish --sin-verificacion; no se ejecuto `npm 'test'`\n");
  const dos = anotarVerificacionOmitida(`${uno}\n## Transiciones\n\n| a |\n`, '2026-11-05T10:00:00Z', 'npm test');
  const lineas = dos.split('\n');
  const i = lineas.indexOf('## Verificacion omitida');
  assert.match(lineas[i + 3] ?? '', /^- 2026-11-05T10:00:00Z/);
  assert.ok(dos.indexOf('2026-11-05') < dos.indexOf('## Transiciones'));
  assert.equal(anotarVerificacionOmitida('a\r\n', 'f', 'c'), 'a\r\n\r\n## Verificacion omitida\r\n\r\n- f: taskctl finish --sin-verificacion; no se ejecuto `c`\r\n');
});
