/**
 * TASK-115: verificacion completa por lote. Repos Git temporales de verdad
 * con los scripts reales de Git-Flow (finish) y un `comando_verificacion` que
 * es un script de node FUERA del repo: cuenta sus ejecuciones y lee su
 * desenlace de un fichero, asi se cambia lo que haria sin tocar el arbol.
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
import { runVerificarLoteCommand, VerificarLoteCommandError } from '../../src/commands/verificar-lote.js';
import { ConfigError, parsearConfig } from '../../src/core/config.js';
import { anotarPendienteLote, pendienteDeLote } from '../../src/core/transiciones.js';
import { leerRegistroPuertas } from '../../src/fs/registro-puertas.js';
import { leerProgreso } from '../../src/fs/progreso.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

const SCRIPT = `
const fs = require('node:fs');
const dir = __dirname;
fs.appendFileSync(dir + '/cuenta', 'x');
const d = fs.readFileSync(dir + '/desenlace', 'utf8').trim();
if (d === 'ok') { console.log('todo en verde'); process.exit(0); }
console.error('ERROR: 2 tests fallan'); process.exit(3);
`;

interface Entorno {
  repoRoot: string;
  tareasRoot: string;
  desenlace(d: 'ok' | 'ko'): Promise<void>;
  ejecuciones(): number;
}

async function conLote(
  fn: (e: Entorno) => Promise<void>,
  opts: { porLoteEnDevelop?: boolean } = {}
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'verificar-lote-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  await writeFile(path.join(dir, 'desenlace'), 'ok', 'utf8');
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      const comando = `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')}`;
      await writeFile(
        path.join(repoRoot, '.taskcode', 'config.yml'),
        `comando_verificacion: "${comando}"\n` + (opts.porLoteEnDevelop === false ? '' : 'verificacion_por_lote: true\n'),
        'utf8'
      );
      commitAll(repoRoot, 'config');
      await fn({
        repoRoot,
        tareasRoot,
        desenlace: (d) => writeFile(path.join(dir, 'desenlace'), d, 'utf8'),
        ejecuciones: () => (existsSync(path.join(dir, 'cuenta')) ? readFileSync(path.join(dir, 'cuenta'), 'utf8').length : 0),
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const integradaEnDevelop = (rama: string, cwd: string) =>
  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;

async function cerrar(e: Entorno, id: string): Promise<string[]> {
  const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-lote` });
  await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
  const avisos: string[] = [];
  await runFinishCommand(e.tareasRoot, [id], '2026-11-13', {
    repoCwd: e.repoRoot,
    scriptsDir: SCRIPTS_DIR,
    onAviso: (a) => avisos.push(a),
  });
  assert.ok(integradaEnDevelop(task.rama, e.repoRoot), `${id} integrada`);
  return avisos;
}

function lote(e: Entorno) {
  return runVerificarLoteCommand(e.tareasRoot, [], { repoCwd: e.repoRoot, ahora: '2026-11-13T12:00:00Z' });
}

test('config (TASK-115): verificacion_por_lote es booleana, false por defecto, y exige comando_verificacion', () => {
  const ruta = '/repo/.taskcode/config.yml';
  assert.equal(parsearConfig('', ruta).verificacion_por_lote, false);
  assert.equal(parsearConfig('comando_verificacion: "npm test"\nverificacion_por_lote: true\n', ruta).verificacion_por_lote, true);
  assert.throws(() => parsearConfig('comando_verificacion: "npm test"\nverificacion_por_lote: si\n', ruta), /debe ser true o false/);
  assert.throws(() => parsearConfig('comando_verificacion: "npm test"\nverificacion_por_lote: 1\n', ruta), ConfigError);
  assert.throws(() => parsearConfig('verificacion_por_lote: true\n', ruta), /necesita tambien "comando_verificacion"/);
});

test('finish (TASK-115): con la clave en develop integra sin la completa y deja la tarea pendiente de lote', async () => {
  await conLote(async (e) => {
    const avisos = await cerrar(e, 'TASK-811');
    assert.equal(e.ejecuciones(), 0, 'no corre la completa');
    assert.ok(avisos.some((a) => /verificacion_por_lote: no se ejecuta .* pendiente de lote/.test(a)), avisos.join('\n'));
    const t = await readTareaFile(e.tareasRoot, 'TASK-811');
    assert.equal(t?.task.estado, 'terminada');
    assert.match(t?.body ?? '', /## Verificacion por lote\n\n- 2026-11-13: pendiente de lote; no se ejecuta `node .*verif\.cjs` \(verificacion_por_lote\)/);
    assert.equal(pendienteDeLote(t?.body ?? ''), true);
  });
});

test('verificar-lote (TASK-115): una completa en develop anota en verde todas las pendientes y lo commitea', async () => {
  await conLote(async (e) => {
    await cerrar(e, 'TASK-811');
    await cerrar(e, 'TASK-812');
    git(['checkout', '-q', 'develop'], e.repoRoot);
    const r = await lote(e);
    assert.equal(e.ejecuciones(), 1, 'una sola completa para el lote');
    // MEN-3: el paso se ve en el progreso, como en finish.
    assert.deepEqual([leerProgreso(e.repoRoot)?.fase, leerProgreso(e.repoRoot)?.resultado], ['finish', 'ok']);
    assert.deepEqual(r.pendientes, ['TASK-811', 'TASK-812']);
    const head = r.commitVerificado as string;
    for (const id of ['TASK-811', 'TASK-812']) {
      const t = await readTareaFile(e.tareasRoot, id);
      assert.match(t?.body ?? '', new RegExp(`- 2026-11-13T12:00:00Z: lote en verde en ${head.slice(0, 7)} \\(taskctl verificar-lote\\)`));
      assert.equal(pendienteDeLote(t?.body ?? ''), false);
    }
    assert.equal(git(['status', '--porcelain'], e.repoRoot), '', 'lo commitea');
    assert.match(git(['log', '-1', '--format=%s'], e.repoRoot), /verificacion completa en verde para TASK-811, TASK-812/);
    assert.deepEqual(
      leerRegistroPuertas(e.repoRoot)
        .filter((l) => l.puerta === 'finish' && l.modo === 'lote')
        .map((l) => l.resultado),
      ['verde']
    );
    // Ya no queda nada pendiente: un segundo lote no ejecuta.
    const otra = await lote(e);
    assert.equal(otra.commitVerificado, null);
    assert.equal(e.ejecuciones(), 1);
  });
});

test('verificar-lote (TASK-115): en rojo no anota nada y dice que tareas entraron desde la ultima completa en verde', async () => {
  await conLote(async (e) => {
    await cerrar(e, 'TASK-811');
    await cerrar(e, 'TASK-812');
    git(['checkout', '-q', 'develop'], e.repoRoot);
    await e.desenlace('ko');
    const head = git(['rev-parse', 'HEAD'], e.repoRoot).trim();
    await assert.rejects(
      () => lote(e),
      (err: unknown) => {
        assert.ok(err instanceof VerificarLoteCommandError);
        assert.match(err.message, /Entraron desde la ultima completa en verde \(2\): TASK-811, TASK-812/);
        assert.match(err.message, /ERROR: 2 tests fallan/);
        assert.match(err.message, /No se ha anotado nada/);
        return true;
      }
    );
    assert.equal(git(['rev-parse', 'HEAD'], e.repoRoot).trim(), head, 'ningun commit');
    for (const id of ['TASK-811', 'TASK-812']) {
      assert.equal(pendienteDeLote((await readTareaFile(e.tareasRoot, id))?.body ?? ''), true, `${id} sigue pendiente`);
    }
  });
});

test('verificar-lote (TASK-115): sin pendientes no ejecuta; fuera de develop o con el arbol sucio aborta', async () => {
  await conLote(async (e) => {
    const vacio = await lote(e);
    assert.equal(vacio.commitVerificado, null);
    assert.equal(e.ejecuciones(), 0);
    git(['checkout', '-q', '-b', 'otra'], e.repoRoot);
    await assert.rejects(() => lote(e), /rama de integracion "develop", y la rama activa es "otra"/);
    git(['checkout', '-q', 'develop'], e.repoRoot);
    await writeFile(path.join(e.repoRoot, 'suelto.txt'), 'x', 'utf8');
    await assert.rejects(() => lote(e), /cambios sin commitear/);
    assert.equal(e.ejecuciones(), 0);
  });
});

test('finish (TASK-115, regresion): sin la clave en develop corre la completa, aunque la rama de la tarea la active', async () => {
  await conLote(
    async (e) => {
      const task = sampleTask({ id: 'TASK-813' });
      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
      // La rama intenta activarse el lote: manda la config de develop.
      const cfg = path.join(e.repoRoot, '.taskcode', 'config.yml');
      await writeFile(cfg, `${readFileSync(cfg, 'utf8')}verificacion_por_lote: true\n`, 'utf8');
      commitAll(e.repoRoot, 'la rama activa el lote');
      await runFinishCommand(e.tareasRoot, ['TASK-813'], '2026-11-13', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });
      assert.equal(e.ejecuciones(), 1, 'corre la completa');
      assert.equal(pendienteDeLote((await readTareaFile(e.tareasRoot, 'TASK-813'))?.body ?? ''), false);
    },
    { porLoteEnDevelop: false }
  );
});

test('finish (TASK-115, IMP-1): un hotfix va a la completa aunque la principal declare el lote', async () => {
  await conLote(async (e) => {
    // La config de develop (con la clave) se lleva tal cual a main.
    const config = readFileSync(path.join(e.repoRoot, '.taskcode', 'config.yml'), 'utf8');
    git(['checkout', '-q', 'main'], e.repoRoot);
    await mkdir(path.join(e.repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
    commitAll(e.repoRoot, 'config en main');
    git(['checkout', '-q', 'develop'], e.repoRoot);
    const task = sampleTask({ id: 'TASK-814', tipo: 'hotfix', rama: 'hotfix/task-814-arreglo' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task, { base: 'main' });
    await runFinishCommand(e.tareasRoot, ['TASK-814'], '2026-11-13', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });
    assert.equal(e.ejecuciones(), 1, 'el hotfix corre la completa');
    assert.equal(pendienteDeLote((await readTareaFile(e.tareasRoot, 'TASK-814'))?.body ?? ''), false);
  });
});

test('finish (TASK-115, IMP-1): un release va a la completa aunque develop declare el lote', async () => {
  await conLote(async (e) => {
    const task = sampleTask({ id: 'TASK-815', tipo: 'release', rama: 'release/task-815-q4' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await runFinishCommand(e.tareasRoot, ['TASK-815'], '2026-11-13', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });
    assert.equal(e.ejecuciones(), 1, 'el release corre la completa');
    assert.equal(pendienteDeLote((await readTareaFile(e.tareasRoot, 'TASK-815'))?.body ?? ''), false);
  });
});

test('lote (TASK-115, MEN-1/MEN-2): un reintento no duplica la pendiente; notas a mano y bloques de codigo no la cambian', () => {
  const una = anotarPendienteLote('## Objetivo\nx\n', '2026-11-13', 'npm test');
  assert.equal(anotarPendienteLote(una, '2026-11-14', 'npm test'), una, 'el reintento no anade otra linea');
  assert.equal(pendienteDeLote(una), true);
  assert.equal(pendienteDeLote(`${una}- 2026-11-13: nota a mano de la persona\n`), true, 'una nota no la resuelve');
  assert.equal(pendienteDeLote(`${una}- 2026-11-14: lote en verde en abc1234 (taskctl verificar-lote)\n`), false);
  const citada = '## Objetivo\n\n```\n## Verificacion por lote\n\n- 2026-11-13: pendiente de lote\n```\n';
  assert.equal(pendienteDeLote(citada), false, 'una seccion citada en un bloque de codigo no cuenta');
});

test('lote (TASK-115, MEN-2 ronda 2): una nota a mano con la frase de taskctl no resuelve ni reabre la pendiente', () => {
  const pendiente = anotarPendienteLote('## Objetivo\nx\n', '2026-11-13', 'npm test');
  assert.equal(pendienteDeLote(`${pendiente}- nota: lote en verde en develop el lunes\n`), true, 'sin la forma exacta no la resuelve');
  const verde = `${pendiente}- 2026-11-14T10:00:00Z: lote en verde en abc1234 (taskctl verificar-lote)\n`;
  assert.equal(pendienteDeLote(verde), false);
  assert.equal(pendienteDeLote(`${verde}- revisar lo pendiente de lote antes del release\n`), false, 'ni la reabre');
});
