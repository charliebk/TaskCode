/**
 * TASK-126: verificacion por tipo de rama. Los tests pesados
 * (`comando_verificacion_pesada`) se exigen, ademas de la completa, solo en el
 * finish y el guardian de merges de los tipos de `verificacion_pesada_en`
 * (release por defecto). Repos Git temporales de verdad con los scripts reales
 * de Git-Flow; los dos comandos son un script de node FUERA del repo que cuenta
 * sus ejecuciones por nombre y lee su desenlace de un fichero.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import { comprobarPuertasVerificacion } from '../../src/commands/doctor.js';
import { ConfigError, parsearConfig, resolverConfig } from '../../src/core/config.js';
import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
import { guardarMemo, huellaDeCommit } from '../../src/fs/verificacion.js';
import { leerRegistroPuertas } from '../../src/fs/registro-puertas.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

const SCRIPT = `
const fs = require('node:fs');
const quien = process.argv[2];
fs.appendFileSync(__dirname + '/cuenta-' + quien, 'x');
const d = fs.readFileSync(__dirname + '/desenlace-' + quien, 'utf8').trim();
if (d === 'ok') { console.log(quien + ': verde'); process.exit(0); }
console.error(quien + ': ERROR, 1 test pesado falla'); process.exit(1);
`;

type Quien = 'completa' | 'pesada';

interface Entorno {
  repoRoot: string;
  tareasRoot: string;
  ejecuciones(q: Quien): number;
  desenlace(q: Quien, d: 'ok' | 'ko'): Promise<void>;
}

async function conEntorno(extra: string | null, fn: (e: Entorno) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'verif-pesada-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  for (const q of ['completa', 'pesada']) await writeFile(path.join(dir, `desenlace-${q}`), 'ok', 'utf8');
  const cmd = (q: Quien) => `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')} ${q}`;
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      const config =
        `comando_verificacion: "${cmd('completa')}"\n` +
        (extra === null ? '' : `comando_verificacion_pesada: "${cmd('pesada')}"\n${extra}`);
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
      commitAll(repoRoot, 'config');
      // La misma config en la principal (un hotfix sale de ella).
      git(['checkout', '-q', 'main'], repoRoot);
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
      commitAll(repoRoot, 'config en main');
      git(['checkout', '-q', 'develop'], repoRoot);
      await fn({
        repoRoot,
        tareasRoot,
        ejecuciones: (q) => (existsSync(path.join(dir, `cuenta-${q}`)) ? readFileSync(path.join(dir, `cuenta-${q}`), 'utf8').length : 0),
        desenlace: (q, d) => writeFile(path.join(dir, `desenlace-${q}`), d, 'utf8'),
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const integrada = (rama: string, destino: string, cwd: string) =>
  spawnSync('git', ['merge-base', '--is-ancestor', rama, destino], { cwd }).status === 0;

async function cerrar(e: Entorno, id: string, tipo: 'feature' | 'fix' | 'release' | 'hotfix', rama: string): Promise<void> {
  const task = sampleTask({ id, tipo, rama });
  await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task, tipo === 'hotfix' ? { base: 'main' } : {});
  await runFinishCommand(e.tareasRoot, [id], '2026-11-13', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });
}

test('config (TASK-126): comando y lista de tipos; release por defecto, hotfix admitido, lo demas aborta', () => {
  const r = '/repo/.taskcode/config.yml';
  const base = 'comando_verificacion: "cargo test"\ncomando_verificacion_pesada: "cargo test -- --ignored"\n';
  assert.deepEqual(parsearConfig(base, r).verificacion_pesada_en, ['release']);
  assert.deepEqual(parsearConfig(`${base}verificacion_pesada_en: [release, hotfix]\n`, r).verificacion_pesada_en, ['release', 'hotfix']);
  assert.throws(() => parsearConfig(`${base}verificacion_pesada_en: [feature]\n`, r), /contiene "feature", que no es un tipo de rama/);
  assert.throws(() => parsearConfig(`${base}verificacion_pesada_en: []\n`, r), ConfigError);
  assert.throws(() => parsearConfig('comando_verificacion_pesada: "x"\n', r), /necesita tambien "comando_verificacion"/);
  assert.throws(
    () => parsearConfig('comando_verificacion: "x"\nverificacion_pesada_en: [release]\n', r),
    /"verificacion_pesada_en" sin "comando_verificacion_pesada" no hace nada/
  );
  assert.equal(parsearConfig('', r).comando_verificacion_pesada, null);
});

test('finish (TASK-126): una feature y un fix se cierran con la completa, sin los pesados', async () => {
  await conEntorno('', async (e) => {
    await cerrar(e, 'TASK-841', 'feature', 'feature/task-841-x');
    await cerrar(e, 'TASK-842', 'fix', 'fix/task-842-y');
    assert.equal(e.ejecuciones('completa'), 2);
    assert.equal(e.ejecuciones('pesada'), 0);
  });
});

test('finish (TASK-126): una release corre los pesados tras la completa y los anota', async () => {
  await conEntorno('', async (e) => {
    await cerrar(e, 'TASK-843', 'release', 'release/task-843-q4');
    assert.deepEqual([e.ejecuciones('completa'), e.ejecuciones('pesada')], [1, 1]);
    assert.ok(integrada('release/task-843-q4', 'main', e.repoRoot));
    assert.deepEqual(
      leerRegistroPuertas(e.repoRoot)
        .filter((l) => l.puerta === 'finish')
        .map((l) => [l.modo, l.resultado]),
      [
        ['completa', 'verde'],
        ['pesada', 'verde'],
      ]
    );
  });
});

test('finish (TASK-126): con los pesados en rojo una release no integra', async () => {
  await conEntorno('', async (e) => {
    await e.desenlace('pesada', 'ko');
    const task = sampleTask({ id: 'TASK-844', tipo: 'release', rama: 'release/task-844-q4' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    const main = git(['rev-parse', 'main'], e.repoRoot);
    await assert.rejects(
      () => runFinishCommand(e.tareasRoot, ['TASK-844'], '2026-11-13', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR }),
      (err: unknown) =>
        err instanceof FinishCommandError &&
        /no se mergea con los tests pesados en rojo/.test(err.message) &&
        /pesada: ERROR, 1 test pesado falla/.test(err.message) &&
        /--sin-verificacion/.test(err.message)
    );
    assert.equal(git(['rev-parse', 'main'], e.repoRoot), main, 'main no se mueve');
  });
});

test('finish (TASK-126): un hotfix solo corre los pesados si verificacion_pesada_en lo lista', async () => {
  await conEntorno('', async (e) => {
    await cerrar(e, 'TASK-845', 'hotfix', 'hotfix/task-845-a');
    assert.deepEqual([e.ejecuciones('completa'), e.ejecuciones('pesada')], [1, 0], 'por defecto, solo release');
  });
  await conEntorno('verificacion_pesada_en: [release, hotfix]\n', async (e) => {
    await cerrar(e, 'TASK-846', 'hotfix', 'hotfix/task-846-b');
    assert.deepEqual([e.ejecuciones('completa'), e.ejecuciones('pesada')], [1, 1]);
  });
});

test('finish (TASK-126, regresion): sin la clave una release se cierra solo con la completa', async () => {
  await conEntorno(null, async (e) => {
    await cerrar(e, 'TASK-847', 'release', 'release/task-847-q4');
    assert.deepEqual([e.ejecuciones('completa'), e.ejecuciones('pesada')], [1, 0]);
  });
});

test('guardian (TASK-126): una release sin el verde de los pesados se bloquea; con el, pasa; una feature no lo pide', async () => {
  await conEntorno('', async (e) => {
    const cfg = resolverConfig(e.repoRoot);
    const verde = (comando: string) => ({ comando, estado: 'verde' as const, codigo: 0, duracionMs: 1, timeoutS: 600, bytesTotales: 0, cola: '' });
    const marcarCompleta = (rama: string) =>
      guardarMemo(e.repoRoot, huellaDeCommit(e.repoRoot, rama, cfg.comando_verificacion as string, cfg.timeout_verificacion) as string, verde('c'));
    // Feature con la completa en verde: pasa sin pesados.
    git(['checkout', '-q', '-b', 'feature/task-848-z', 'develop'], e.repoRoot);
    await writeFile(path.join(e.repoRoot, 'z.txt'), 'z\n', 'utf8');
    commitAll(e.repoRoot, 'z');
    marcarCompleta('feature/task-848-z');
    const mergeFeature = 'git checkout develop && git merge --no-ff feature/task-848-z';
    assert.equal(decidirPreToolUse({ cwd: e.repoRoot, tool_input: { command: mergeFeature } }).codigo, 0);
    // Release con la completa en verde pero sin pesados: bloquea y lo dice.
    git(['checkout', '-q', '-b', 'release/task-849-q4', 'develop'], e.repoRoot);
    await writeFile(path.join(e.repoRoot, 'r.txt'), 'r\n', 'utf8');
    commitAll(e.repoRoot, 'r');
    marcarCompleta('release/task-849-q4');
    const mergeRelease = 'git checkout main && git merge --no-ff release/task-849-q4';
    const bloqueo = decidirPreToolUse({ cwd: e.repoRoot, tool_input: { command: mergeRelease } });
    assert.equal(bloqueo.codigo, 2);
    assert.match(bloqueo.stderr, /una rama release exige tambien los tests pesados \(comando_verificacion_pesada\)/);
    // Con el verde de los pesados del mismo commit, pasa.
    const huellaPesada = huellaDeCommit(e.repoRoot, 'release/task-849-q4', cfg.comando_verificacion_pesada as string, cfg.timeout_verificacion) as string;
    guardarMemo(e.repoRoot, huellaPesada, verde('p'), 'pesada');
    assert.equal(decidirPreToolUse({ cwd: e.repoRoot, tool_input: { command: mergeRelease } }).codigo, 0);
  });
});

test('doctor (TASK-126): puertas-verificacion dice que puerta corre los pesados', () => {
  const r = '/repo/.taskcode/config.yml';
  const [sin] = comprobarPuertasVerificacion(parsearConfig('comando_verificacion: "cargo test"\n', r));
  assert.match(sin?.mensaje ?? '', /; sin pesados$/);
  const [con] = comprobarPuertasVerificacion(
    parsearConfig('comando_verificacion: "cargo test"\ncomando_verificacion_pesada: "cargo test -- --ignored"\nverificacion_pesada_en: [release, hotfix]\n', r)
  );
  assert.match(con?.mensaje ?? '', /; pesados "cargo test -- --ignored" solo en release y hotfix$/);
});

test('guia (TASK-126): la skill finish y la doc explican como separar los pesados, con cargo test --ignored', () => {
  const raiz = path.join(import.meta.dirname, '..', '..', '..');
  const skill = readFileSync(path.join(raiz, 'skills', 'finish', 'SKILL.md'), 'utf8');
  assert.match(skill, /comando_verificacion_pesada[\s\S]*cargo test -- --ignored[\s\S]*verificacion_pesada_en/);
  const doc = readFileSync(path.join(raiz, 'docs', 'configuracion.md'), 'utf8');
  assert.match(doc, /#### Tests pesados solo en release[\s\S]*cargo test -- --ignored[\s\S]*Guardián de merges/);
});

test('finish (TASK-126, IMP-1): en el camino idempotente una release integrada a mano tambien exige los pesados', async () => {
  await conEntorno('', async (e) => {
    await e.desenlace('pesada', 'ko');
    const task = sampleTask({ id: 'TASK-850', tipo: 'release', rama: 'release/task-850-q4' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    for (const destino of ['main', 'develop']) {
      git(['checkout', '-q', destino], e.repoRoot);
      git(['merge', '-q', '--no-ff', '-m', `merge a mano en ${destino}`, task.rama], e.repoRoot);
    }
    await assert.rejects(
      () => runFinishCommand(e.tareasRoot, ['TASK-850'], '2026-11-13', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR }),
      (err: unknown) => {
        assert.ok(err instanceof FinishCommandError);
        // IMP-2 (ronda 2): el merge ya esta hecho; el mensaje no puede decir «no se mergea».
        assert.doesNotMatch(err.message, /no se mergea|no se ha tocado nada/);
        assert.match(err.message, /la rama ya esta integrada en "main" y "develop"/);
        assert.match(err.message, /se arregla hacia delante, en la rama de integracion/);
        assert.match(err.message, /pesada: ERROR, 1 test pesado falla/);
        return true;
      }
    );
    assert.deepEqual([e.ejecuciones('completa'), e.ejecuciones('pesada')], [1, 1]);
  });
});

test('guardian (TASK-126, MEN-1): un hotfix exige los pesados solo si verificacion_pesada_en lo lista', async () => {
  for (const [extra, esperado] of [
    ['', 0],
    ['verificacion_pesada_en: [release, hotfix]\n', 2],
  ] as const) {
    await conEntorno(extra, async (e) => {
      const cfg = resolverConfig(e.repoRoot);
      git(['checkout', '-q', '-b', 'hotfix/task-851-a', 'main'], e.repoRoot);
      await writeFile(path.join(e.repoRoot, 'h.txt'), 'h\n', 'utf8');
      commitAll(e.repoRoot, 'h');
      const huella = huellaDeCommit(e.repoRoot, 'hotfix/task-851-a', cfg.comando_verificacion as string, cfg.timeout_verificacion) as string;
      guardarMemo(e.repoRoot, huella, { comando: 'c', estado: 'verde', codigo: 0, duracionMs: 1, timeoutS: 600, bytesTotales: 0, cola: '' });
      const merge = 'git checkout main && git merge --no-ff hotfix/task-851-a';
      const d = decidirPreToolUse({ cwd: e.repoRoot, tool_input: { command: merge } });
      assert.equal(d.codigo, esperado, d.stderr);
      if (esperado === 2) assert.match(d.stderr, /una rama hotfix exige tambien los tests pesados/);
    });
  }
});

test('finish (TASK-126): en el camino idempotente con los pesados en verde, una release integrada a mano se cierra', async () => {
  await conEntorno('', async (e) => {
    const task = sampleTask({ id: 'TASK-852', tipo: 'release', rama: 'release/task-852-q4' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    for (const destino of ['main', 'develop']) {
      git(['checkout', '-q', destino], e.repoRoot);
      git(['merge', '-q', '--no-ff', '-m', `merge a mano en ${destino}`, task.rama], e.repoRoot);
    }
    const r = await runFinishCommand(e.tareasRoot, ['TASK-852'], '2026-11-13', { repoCwd: e.repoRoot, scriptsDir: SCRIPTS_DIR });
    assert.equal(r.cierre, 'terminada');
    assert.deepEqual([e.ejecuciones('completa'), e.ejecuciones('pesada')], [1, 1]);
  });
});
