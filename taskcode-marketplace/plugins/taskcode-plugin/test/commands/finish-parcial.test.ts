/**
 * TASK-106: verificacion proporcional en `taskctl finish`, nivel 2 (parte B3
 * de TASK-096). Repos Git temporales de verdad y los scripts de Git-Flow tal
 * cual. Dos comandos (la completa y la selectiva) que viven FUERA del repo,
 * cuentan sus ejecuciones, leen su desenlace de un fichero junto a ellos y la
 * selectiva apunta el RAMA_BASE que recibe.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerRegistroPuertas } from '../../src/fs/registro-puertas.js';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import { resolverConfig } from '../../src/core/config.js';
import { guardarMemo, huellaDelArbol, huellaDeCommit, leerMemo, contextoSelectiva, verificarConMemo } from '../../src/fs/verificacion.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

// argv[2] = 'completa' | 'sel': cada uno con su contador y su desenlace.
const SCRIPT = `
const fs = require('node:fs');
const tipo = process.argv[2];
const dir = __dirname;
fs.appendFileSync(dir + '/cuenta-' + tipo, 'x');
if (tipo === 'sel' && fs.existsSync(dir + '/ensucia')) fs.writeFileSync(process.cwd() + '/sucio.txt', 'x');
if (tipo === 'sel') fs.writeFileSync(dir + '/rama-base', process.env.RAMA_BASE === undefined ? '(sin)' : process.env.RAMA_BASE);
const d = fs.readFileSync(dir + '/desenlace-' + tipo, 'utf8').trim();
if (d === 'ok') { console.log(tipo + ' en verde'); process.exit(0); }
console.error('ERROR: ' + tipo + ' en rojo'); process.exit(3);
`;

type Tipo = 'completa' | 'sel' | 'docs';

interface Entorno {
  repoRoot: string;
  tareasRoot: string;
  comandoCompleta: string;
  comandoSel: string;
  desenlace(tipo: Tipo, d: 'ok' | 'ko'): Promise<void>;
  ejecuciones(tipo: Tipo): number;
  ramaBaseRecibida(): string | null;
  /** La selectiva deja `sucio.txt` (no ignorado) en el repo. */
  ensuciar(): Promise<void>;
}

/** `trabajo-*.txt` (lo que deja `setupTaskEnRevision`) es documentacion; el codigo parcial vive en src/**. */
const NIVEL2 = (sel: string): string =>
  `rutas_documentacion: [docs/**, trabajo-*.txt]\ncomando_verificacion_selectiva: "${sel}"\nrutas_verificacion_parcial: [src/**]\n`;

async function conEntorno(
  extra: (comandos: { completa: string; sel: string; docs: string }) => string,
  fn: (e: Entorno) => Promise<void>
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'finish-parcial-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  await writeFile(path.join(dir, 'desenlace-completa'), 'ok', 'utf8');
  await writeFile(path.join(dir, 'desenlace-sel'), 'ok', 'utf8');
  await writeFile(path.join(dir, 'desenlace-docs'), 'ok', 'utf8');
  const script = path.join(dir, 'verif.cjs').replace(/\\/g, '/');
  const comandos = { completa: `node ${script} completa`, sel: `node ${script} sel`, docs: `node ${script} docs` };
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(
        path.join(repoRoot, '.taskcode', 'config.yml'),
        `comando_verificacion: "${comandos.completa}"\n${extra(comandos)}`,
        'utf8'
      );
      commitAll(repoRoot, 'config');
      await fn({
        repoRoot,
        tareasRoot,
        comandoCompleta: comandos.completa,
        comandoSel: comandos.sel,
        desenlace: (tipo, d) => writeFile(path.join(dir, `desenlace-${tipo}`), d, 'utf8'),
        ejecuciones: (tipo) => {
          const f = path.join(dir, `cuenta-${tipo}`);
          return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
        },
        ensuciar: () => writeFile(path.join(dir, 'ensucia'), 'x', 'utf8'),
        ramaBaseRecibida: () => {
          const f = path.join(dir, 'rama-base');
          return existsSync(f) ? readFileSync(f, 'utf8') : null;
        },
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const integrada = (rama: string, destino: string, cwd: string) =>
  spawnSync('git', ['merge-base', '--is-ancestor', rama, destino], { cwd }).status === 0;

async function finish(e: Entorno, id: string): Promise<{ avisos: string[] }> {
  const avisos: string[] = [];
  await runFinishCommand(e.tareasRoot, [id], '2026-11-11', {
    repoCwd: e.repoRoot,
    scriptsDir: SCRIPTS_DIR,
    onAviso: (a) => avisos.push(a),
  });
  return { avisos };
}

async function enLaRama(e: Entorno, ruta: string, contenido = 'export const x = 1;\n'): Promise<void> {
  await mkdir(path.dirname(path.join(e.repoRoot, ruta)), { recursive: true });
  await writeFile(path.join(e.repoRoot, ruta), contenido, 'utf8');
  commitAll(e.repoRoot, `cambio en ${ruta}`);
}

/** El memo de la completa (`freno-verificacion.json`) no existe. */
function sinMemoDeLaCompleta(repoRoot: string): boolean {
  const p = git(['rev-parse', '--git-path', 'freno-verificacion.json'], repoRoot).trim();
  return !existsSync(path.resolve(repoRoot, p));
}

test('finish (TASK-106): codigo solo en rutas parciales: corre la selectiva, no la completa, integra, lo dice y lo anota', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-951' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    const { avisos } = await finish(e, 'TASK-951');
    assert.equal(e.ejecuciones('sel'), 1);
    assert.equal(e.ejecuciones('completa'), 0);
    assert.equal(e.ramaBaseRecibida(), 'develop', 'la selectiva recibe RAMA_BASE');
    // TASK-128 (MEN-1): la selectiva de finish queda en el registro de puertas.
    assert.deepEqual(leerRegistroPuertas(e.repoRoot)
      .filter((l) => l.puerta === 'finish')
      .map((l) => [l.tarea, l.modo, l.resultado]), [['TASK-951', 'selectiva', 'verde']]);
    assert.ok(integrada(task.rama, 'develop', e.repoRoot));
    assert.ok(
      avisos.some((a) => /cae en rutas_verificacion_parcial de "develop".*se ejecuta la verificacion selectiva \(".*sel"\) en vez de la completa/.test(a)),
      avisos.join('\n')
    );
    const t = await readTareaFile(e.tareasRoot, 'TASK-951');
    assert.equal(t?.task.estado, 'terminada');
    assert.match(t?.body ?? '', /## Verificacion parcial\n\n- 2026-11-11: todo el codigo que cambia la tarea \(1 fichero\(s\)\) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node .*sel` en verde, no la completa `node .*completa`/);
    assert.match(git(['log', '--format=%s', 'develop'], e.repoRoot), /cierre con verificacion parcial/);
  });
});

test('finish (TASK-106): codigo fuera de las rutas parciales: corre la completa y dice que queda fuera', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-952' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    await enLaRama(e, 'lib/util.ts');
    const { avisos } = await finish(e, 'TASK-952');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.equal(e.ejecuciones('sel'), 0);
    assert.ok(integrada(task.rama, 'develop', e.repoRoot));
    assert.ok(
      avisos.some((a) => /se ejecuta la verificacion completa: la tarea cambia rutas fuera de rutas_verificacion_parcial: lib\/util\.ts\.$/.test(a)),
      avisos.join('\n')
    );
    const t = await readTareaFile(e.tareasRoot, 'TASK-952');
    assert.doesNotMatch(t?.body ?? '', /## Verificacion parcial/);
  });
});

test('finish (TASK-106): con la selectiva en rojo no integra, develop no se mueve y no anota nada', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-953' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    await e.desenlace('sel', 'ko');
    const develop = git(['rev-parse', 'develop'], e.repoRoot);
    const head = git(['rev-parse', 'HEAD'], e.repoRoot);
    await assert.rejects(
      () => finish(e, 'TASK-953'),
      (err: unknown) =>
        err instanceof FinishCommandError &&
        /no se mergea con la verificacion selectiva en rojo/.test(err.message) &&
        /RAMA_BASE=develop/.test(err.message) &&
        /--sin-verificacion/.test(err.message)
    );
    assert.equal(e.ejecuciones('completa'), 0);
    // TASK-128 (MEN-1): el rojo se anota antes de abortar.
    assert.deepEqual(leerRegistroPuertas(e.repoRoot)
      .filter((l) => l.puerta === 'finish')
      .map((l) => [l.tarea, l.modo, l.resultado]), [['TASK-953', 'selectiva', 'rojo']]);
    assert.equal(git(['rev-parse', 'develop'], e.repoRoot), develop, 'develop no se mueve');
    assert.equal(git(['rev-parse', 'HEAD'], e.repoRoot), head, 'ni un commit de anotacion en la rama');
    const t = await readTareaFile(e.tareasRoot, 'TASK-953');
    assert.equal(t?.task.estado, 'en-revision');
    assert.doesNotMatch(t?.body ?? '', /## Verificacion parcial/);
  });
});

test('finish (TASK-106): el verde de la selectiva no escribe el memo de la completa', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-954' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    await finish(e, 'TASK-954');
    assert.equal(e.ejecuciones('sel'), 1);
    assert.ok(sinMemoDeLaCompleta(e.repoRoot), 'freno-verificacion.json no existe');
    const memoSel = git(['rev-parse', '--git-path', 'freno-verificacion-selectiva.json'], e.repoRoot).trim();
    assert.ok(existsSync(path.resolve(e.repoRoot, memoSel)), 'el verde va al memo de la selectiva');
  });
});

test('finish (TASK-106): con umbral de cobertura, la puerta de cobertura queda omitida en el nivel 2', async () => {
  await conEntorno(
    ({ sel }) => `${NIVEL2(sel)}informe_cobertura: coverage/lcov.info\numbral_cobertura: 80\n`,
    async (e) => {
      const task = sampleTask({ id: 'TASK-955' });
      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
      await enLaRama(e, 'src/calculo.ts');
      const { avisos } = await finish(e, 'TASK-955');
      assert.equal(e.ejecuciones('sel'), 1);
      assert.ok(integrada(task.rama, 'develop', e.repoRoot), 'sin informe lcov no aborta');
      assert.ok(
        avisos.some((a) => /umbral de cobertura \(80 %\) no se mide aqui, sino en la verificacion completa del release/.test(a)),
        avisos.join('\n')
      );
    }
  );
});

test('finish (TASK-106): un hotfix con codigo en rutas parciales corre la completa', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    // La config manda la de la principal: se lleva tal cual a main.
    const config = await readFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), 'utf8');
    git(['checkout', '-q', 'main'], e.repoRoot);
    await mkdir(path.join(e.repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
    commitAll(e.repoRoot, 'config en main');
    git(['checkout', '-q', 'develop'], e.repoRoot);
    const task = sampleTask({ id: 'TASK-956', tipo: 'hotfix', rama: 'hotfix/task-956-arreglo' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task, { base: 'main' });
    await enLaRama(e, 'src/calculo.ts');
    const { avisos } = await finish(e, 'TASK-956');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.equal(e.ejecuciones('sel'), 0);
    assert.ok(integrada(task.rama, 'main', e.repoRoot));
    assert.ok(
      avisos.some((a) => /se ejecuta la verificacion completa: un hotfix integra en la principal/.test(a)),
      avisos.join('\n')
    );
  });
});

test('finish (TASK-106): un hotfix de solo documentacion conserva su camino de la 0.14.0', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const config = await readFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), 'utf8');
    git(['checkout', '-q', 'main'], e.repoRoot);
    await mkdir(path.join(e.repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(e.repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
    commitAll(e.repoRoot, 'config en main');
    git(['checkout', '-q', 'develop'], e.repoRoot);
    const task = sampleTask({ id: 'TASK-957', tipo: 'hotfix', rama: 'hotfix/task-957-docs' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task, { base: 'main' });
    await enLaRama(e, 'docs/guia.md', '# guia\n');
    await finish(e, 'TASK-957');
    assert.equal(e.ejecuciones('completa'), 0);
    assert.equal(e.ejecuciones('sel'), 0);
    assert.ok(integrada(task.rama, 'main', e.repoRoot));
  });
});

test('finish (TASK-106): un release con codigo en rutas parciales corre la completa', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-958', tipo: 'release', rama: 'release/task-958-q4' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    await finish(e, 'TASK-958');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.equal(e.ejecuciones('sel'), 0);
    assert.ok(integrada(task.rama, 'main', e.repoRoot));
  });
});

test('finish (TASK-106): una rama que cambia codigo y su propio clasificador (fuera de las rutas) va a la completa', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-959' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    await enLaRama(e, 'scripts/verificacion-selectiva.cjs', 'process.exit(0);\n');
    const { avisos } = await finish(e, 'TASK-959');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.equal(e.ejecuciones('sel'), 0);
    assert.ok(
      avisos.some((a) => /fuera de rutas_verificacion_parcial: scripts\/verificacion-selectiva\.cjs/.test(a)),
      avisos.join('\n')
    );
  });
});

test('finish (TASK-106): selectiva declarada sin rutas_verificacion_parcial: la completa, como en la 0.14.0', async () => {
  await conEntorno(
    ({ sel }) => `rutas_documentacion: [docs/**, trabajo-*.txt]\ncomando_verificacion_selectiva: "${sel}"\n`,
    async (e) => {
      const task = sampleTask({ id: 'TASK-960' });
      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
      await enLaRama(e, 'src/calculo.ts');
      await e.desenlace('completa', 'ko');
      await assert.rejects(
        () => finish(e, 'TASK-960'),
        (err: unknown) =>
          err instanceof FinishCommandError &&
          /aunque las rondas usaran la selectiva/.test(err.message) &&
          !/no la selectiva, porque/.test(err.message)
      );
      assert.equal(e.ejecuciones('completa'), 1);
      assert.equal(e.ejecuciones('sel'), 0);
    }
  );
});

test('finish (TASK-106): con el nivel 2, el rojo de la completa dice por que no basto la selectiva', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-961' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'lib/util.ts');
    await e.desenlace('completa', 'ko');
    await assert.rejects(
      () => finish(e, 'TASK-961'),
      (err: unknown) =>
        err instanceof FinishCommandError &&
        /Es la verificacion completa \(comando_verificacion\), no la selectiva, porque la tarea cambia rutas fuera de rutas_verificacion_parcial: lib\/util\.ts\./.test(err.message) &&
        !/aunque las rondas usaran la selectiva/.test(err.message)
    );
  });
});

test('finish (TASK-106): reutiliza el verde de la selectiva que dejo el Stop para el mismo commit', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-962' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    // Lo que haria el freno Stop con el arbol limpio al final del turno.
    const timeoutS = resolverConfig(e.repoRoot).timeout_verificacion_selectiva;
    const stop = verificarConMemo(e.repoRoot, { tipo: 'selectiva', comando: e.comandoSel, timeoutS, base: 'develop' });
    assert.equal(stop.resultado.estado, 'verde');
    assert.equal(e.ejecuciones('sel'), 1);
    const { avisos } = await finish(e, 'TASK-962');
    assert.equal(e.ejecuciones('sel'), 1, 'finish no la vuelve a ejecutar');
    assert.equal(e.ejecuciones('completa'), 0);
    assert.ok(integrada(task.rama, 'develop', e.repoRoot));
    assert.ok(avisos.some((a) => /no se vuelve a ejecutar/.test(a)), avisos.join('\n'));
  });
});

test('finish (TASK-106): un rojo o un corte guardados de la selectiva no se reutilizan: se vuelve a ejecutar', async () => {
  for (const estado of ['roja', 'cortada'] as const) {
    await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
      const task = sampleTask({ id: 'TASK-963' });
      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
      await enLaRama(e, 'src/calculo.ts');
      const timeoutS = resolverConfig(e.repoRoot).timeout_verificacion_selectiva;
      const huella = huellaDelArbol(e.repoRoot, e.comandoSel, timeoutS, contextoSelectiva(e.repoRoot, 'develop')) as string;
      // Un memo del Stop con ese desenlace para este mismo commit (p. ej. un timeout bajo carga).
      const guardado = verificarConMemo(e.repoRoot, { tipo: 'selectiva', comando: e.comandoSel, timeoutS, base: 'develop' }).resultado;
      guardarMemo(e.repoRoot, huella, { ...guardado, estado } as typeof guardado, 'selectiva');
      const antes = e.ejecuciones('sel');
      await finish(e, 'TASK-963');
      assert.equal(e.ejecuciones('sel'), antes + 1, `con un memo ${estado}, finish la ejecuta`);
      assert.ok(integrada(task.rama, 'develop', e.repoRoot));
    });
  }
});

test('finish (TASK-106): un reintento que acaba en la completa lo anota bajo la selectiva anotada antes, y el memo de la completa casa', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-964' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    // Lo que dejo un intento anterior: la selectiva en verde, anotada y commiteada (el merge no llego).
    const t0 = await readTareaFile(e.tareasRoot, 'TASK-964');
    await writeTareaFile(e.tareasRoot, t0!.task, `${t0!.body.replace(/\s*$/, '')}\n\n## Verificacion parcial\n\n- 2026-11-10: todo en src; se ejecuta la selectiva en verde\n`);
    commitAll(e.repoRoot, 'intento anterior');
    await enLaRama(e, 'lib/util.ts');
    await finish(e, 'TASK-964');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.equal(e.ejecuciones('sel'), 0);
    const t = await readTareaFile(e.tareasRoot, 'TASK-964');
    assert.match(t?.body ?? '', /- 2026-11-11: la tarea cambia rutas fuera de rutas_verificacion_parcial: lib\/util\.ts; este intento exige la completa `node .*completa`/);
    assert.match(git(['log', '--format=%s', 'develop'], e.repoRoot), /reintento con verificacion completa/);
    const huella = huellaDeCommit(e.repoRoot, task.rama, e.comandoCompleta, 600) as string;
    assert.equal(leerMemo(e.repoRoot, huella, 'completa')?.estado, 'verde', 'el verde de la completa es del commit integrado');
  });
});

test('finish (TASK-106, IMP-1): la selectiva en verde que deja el arbol sucio no integra ni anota', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-965' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    await e.ensuciar();
    const develop = git(['rev-parse', 'develop'], e.repoRoot);
    await assert.rejects(
      () => finish(e, 'TASK-965'),
      (err: unknown) =>
        err instanceof FinishCommandError &&
        /la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo/.test(err.message) &&
        /No se ha mergeado nada/.test(err.message)
    );
    assert.equal(e.ejecuciones('sel'), 1);
    assert.equal(git(['rev-parse', 'develop'], e.repoRoot), develop, 'develop no se mueve');
    const t = await readTareaFile(e.tareasRoot, 'TASK-965');
    assert.equal(t?.task.estado, 'en-revision');
    assert.doesNotMatch(t?.body ?? '', /## Verificacion parcial/);
  });
});

test('finish (TASK-106, MEN-3): el rojo de la completa en un reintento dice que solo se commiteo la anotacion', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-966' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    const t0 = await readTareaFile(e.tareasRoot, 'TASK-966');
    await writeTareaFile(e.tareasRoot, t0!.task, `${t0!.body.replace(/\s*$/, '')}\n\n## Verificacion parcial\n\n- 2026-11-10: todo en src; se ejecuta la selectiva en verde\n`);
    commitAll(e.repoRoot, 'intento anterior');
    await enLaRama(e, 'lib/util.ts');
    await e.desenlace('completa', 'ko');
    const develop = git(['rev-parse', 'develop'], e.repoRoot);
    await assert.rejects(
      () => finish(e, 'TASK-966'),
      (err: unknown) =>
        err instanceof FinishCommandError &&
        /No se ha mergeado nada; solo se ha commiteado en la rama la anotacion del intento \([0-9a-f]+\)/.test(err.message) &&
        !/No se ha tocado nada/.test(err.message)
    );
    assert.equal(git(['rev-parse', 'develop'], e.repoRoot), develop);
  });
});

// TASK-123 (IMP-2 r1): el reintento de finish (la rama ya integrada a mano) toma
// la misma decision proporcional que la puerta normal, sobre lo que entro con la
// tarea: la base es el commit de la rama de integracion justo antes del merge.

/** Merge a mano de la rama en develop y vuelta a la rama: lo que deja el reintento. */
function mergeAMano(e: Entorno, rama: string): string {
  git(['checkout', '-q', 'develop'], e.repoRoot);
  const base = git(['rev-parse', 'HEAD'], e.repoRoot).trim();
  git(['merge', '--no-ff', '-q', '-m', 'merge a mano', rama], e.repoRoot);
  return base;
}

test('finish reintento (TASK-123): merge a mano de una tarea que solo cambia documentacion: corre la de documentacion, no la completa', async () => {
  await conEntorno(
    ({ sel, docs }) => `${NIVEL2(sel)}comando_verificacion_documentacion: "${docs}"\n`,
    async (e) => {
      const task = sampleTask({ id: 'TASK-961' });
      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
      mergeAMano(e, task.rama);
      git(['checkout', '-q', task.rama], e.repoRoot);
      const { avisos } = await finish(e, 'TASK-961');
      assert.ok(avisos.some((a) => /ya esta integrada en "develop"/.test(a)), avisos.join('\n'));
      assert.equal(e.ejecuciones('docs'), 1);
      assert.equal(e.ejecuciones('completa'), 0);
      assert.equal(e.ejecuciones('sel'), 0);
      assert.equal((await readTareaFile(e.tareasRoot, 'TASK-961'))?.task.estado, 'terminada');
    }
  );
});

test('finish reintento (TASK-123): merge a mano de una tarea con codigo solo en rutas parciales: corre la selectiva desde la base anterior al merge', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-962' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    const base = mergeAMano(e, task.rama);
    git(['checkout', '-q', task.rama], e.repoRoot);
    await finish(e, 'TASK-962');
    assert.equal(e.ejecuciones('sel'), 1);
    assert.equal(e.ejecuciones('completa'), 0);
    assert.equal(e.ramaBaseRecibida(), base);
    assert.equal((await readTareaFile(e.tareasRoot, 'TASK-962'))?.task.estado, 'terminada');
  });
});

test('finish reintento (TASK-123): con varios merges posteriores en develop la base sigue siendo la de antes del merge de la tarea', async () => {
  await conEntorno(({ sel }) => NIVEL2(sel), async (e) => {
    const task = sampleTask({ id: 'TASK-963' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'src/calculo.ts');
    const base = mergeAMano(e, task.rama);
    // Despues entran en develop otras dos ramas que solo tocan documentacion.
    for (const n of [1, 2]) {
      git(['checkout', '-q', '-b', `docs/otra-${n}`, 'develop'], e.repoRoot);
      await mkdir(path.join(e.repoRoot, 'docs'), { recursive: true });
      await writeFile(path.join(e.repoRoot, 'docs', `otra-${n}.md`), `# otra ${n}\n`, 'utf8');
      commitAll(e.repoRoot, `docs otra ${n}`);
      git(['checkout', '-q', 'develop'], e.repoRoot);
      git(['merge', '--no-ff', '-q', '-m', `merge otra ${n}`, `docs/otra-${n}`], e.repoRoot);
    }
    git(['checkout', '-q', task.rama], e.repoRoot);
    await finish(e, 'TASK-963');
    // Una base tomada tras el merge de la tarea veria solo documentacion; sin base, la completa.
    assert.equal(e.ejecuciones('sel'), 1);
    assert.equal(e.ejecuciones('completa'), 0);
    assert.equal(e.ramaBaseRecibida(), base);
  });
});
