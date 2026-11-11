/**
 * TASK-100: verificacion proporcional en `taskctl finish` (parte A1 de
 * TASK-096). Repos Git temporales de verdad y los scripts de Git-Flow tal
 * cual. Dos comandos de verificacion (la completa y la de documentacion) que
 * viven FUERA del repo, cuentan sus ejecuciones y leen su desenlace de un
 * fichero junto a ellos.
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
import { leerMemo, huellaDeCommit } from '../../src/fs/verificacion.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

// argv[2] = 'completa' | 'docs': cada uno con su contador y su desenlace.
const SCRIPT = `
const fs = require('node:fs');
const tipo = process.argv[2];
const dir = __dirname;
fs.appendFileSync(dir + '/cuenta-' + tipo, 'x');
const d = fs.readFileSync(dir + '/desenlace-' + tipo, 'utf8').trim();
if (d === 'ok') { console.log(tipo + ' en verde'); process.exit(0); }
console.error('ERROR: ' + tipo + ' en rojo'); process.exit(3);
`;

interface Entorno {
  repoRoot: string;
  tareasRoot: string;
  comandoCompleta: string;
  comandoDocs: string;
  desenlace(tipo: 'completa' | 'docs', d: 'ok' | 'ko'): Promise<void>;
  ejecuciones(tipo: 'completa' | 'docs'): number;
}

/**
 * Repo con `.taskcode/config.yml` en develop: la completa siempre y, segun
 * `extra`, rutas de documentacion y comando de documentacion. `extra` recibe
 * los dos comandos ya resueltos.
 */
async function conEntorno(
  extra: (comandos: { completa: string; docs: string }) => string,
  fn: (e: Entorno) => Promise<void>
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'finish-docs-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  await writeFile(path.join(dir, 'desenlace-completa'), 'ok', 'utf8');
  await writeFile(path.join(dir, 'desenlace-docs'), 'ok', 'utf8');
  const script = path.join(dir, 'verif.cjs').replace(/\\/g, '/');
  const comandos = { completa: `node ${script} completa`, docs: `node ${script} docs` };
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
        comandoDocs: comandos.docs,
        desenlace: (tipo, d) => writeFile(path.join(dir, `desenlace-${tipo}`), d, 'utf8'),
        ejecuciones: (tipo) => {
          const f = path.join(dir, `cuenta-${tipo}`);
          return existsSync(f) ? readFileSync(f, 'utf8').length : 0;
        },
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** `trabajo-*.txt` es lo que deja `setupTaskEnRevision` en la raiz: aqui cuenta como documentacion. */
const RUTAS_DOCS = 'rutas_documentacion: [docs/**, trabajo-*.txt]\n';

const integradaEnDevelop = (rama: string, cwd: string) =>
  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;

async function finish(e: Entorno, id: string): Promise<{ avisos: string[] }> {
  const avisos: string[] = [];
  await runFinishCommand(e.tareasRoot, [id], '2026-11-10', {
    repoCwd: e.repoRoot,
    scriptsDir: SCRIPTS_DIR,
    onAviso: (a) => avisos.push(a),
  });
  return { avisos };
}

/** Anade un fichero en la rama de la tarea (que esta activa) y lo commitea. */
async function enLaRama(e: Entorno, ruta: string, contenido = 'x\n'): Promise<void> {
  await mkdir(path.dirname(path.join(e.repoRoot, ruta)), { recursive: true });
  await writeFile(path.join(e.repoRoot, ruta), contenido, 'utf8');
  commitAll(e.repoRoot, `cambio en ${ruta}`);
}

test('finish (TASK-100): solo documentacion y sin comando de documentacion: integra sin la completa, lo dice y lo anota', async () => {
  await conEntorno(() => RUTAS_DOCS, async (e) => {
    const task = sampleTask({ id: 'TASK-901' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    const { avisos } = await finish(e, 'TASK-901');
    assert.equal(e.ejecuciones('completa'), 0, 'no corre la completa');
    assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
    const t = await readTareaFile(e.tareasRoot, 'TASK-901');
    assert.equal(t?.task.estado, 'terminada');
    assert.match(t?.body ?? '', /## Verificacion de documentacion\n\n- 2026-11-10: la tarea solo cambia documentacion \(\d+ fichero\(s\) dentro de rutas_documentacion de "develop"\); no se ejecuta `node .*completa`, sin comprobacion de documentacion declarada/);
    assert.ok(avisos.some((a) => /solo cambia documentacion.*no se ejecuta la verificacion completa/.test(a)), avisos.join('\n'));
    // La anotacion se commiteo en la rama antes del merge.
    assert.match(git(['log', '--format=%s', 'develop'], e.repoRoot), /cierre solo documentacion/);
  });
});

test('finish (TASK-100): solo documentacion con comando de documentacion: corre ese, no la completa, y guarda su propio memo', async () => {
  await conEntorno(({ docs }) => `${RUTAS_DOCS}comando_verificacion_documentacion: "${docs}"\n`, async (e) => {
    const task = sampleTask({ id: 'TASK-902' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    const { avisos } = await finish(e, 'TASK-902');
    assert.equal(e.ejecuciones('completa'), 0);
    assert.equal(e.ejecuciones('docs'), 1);
    assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
    assert.ok(avisos.some((a) => /comprobacion de documentacion \(".*docs"\) sale en verde/.test(a)), avisos.join('\n'));
    // Memo de documentacion para el commit integrado; ninguno de la completa.
    const huellaDocs = huellaDeCommit(e.repoRoot, task.rama, e.comandoDocs, 600) as string;
    assert.equal(leerMemo(e.repoRoot, huellaDocs, 'documentacion')?.estado, 'verde');
    const huellaCompleta = huellaDeCommit(e.repoRoot, task.rama, e.comandoCompleta, 600) as string;
    assert.equal(leerMemo(e.repoRoot, huellaCompleta, 'completa'), null, 'nunca un verde de la completa que no corrio');
  });
});

test('finish (TASK-100): solo documentacion con la comprobacion de documentacion en rojo: aborta sin mergear', async () => {
  await conEntorno(({ docs }) => `${RUTAS_DOCS}comando_verificacion_documentacion: "${docs}"\n`, async (e) => {
    const task = sampleTask({ id: 'TASK-903' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    await e.desenlace('docs', 'ko');
    const developAntes = git(['rev-parse', 'develop'], e.repoRoot).trim();
    await assert.rejects(
      () => finish(e, 'TASK-903'),
      (err: unknown) => {
        assert.ok(err instanceof FinishCommandError);
        assert.match(err.message, /solo cambia documentacion, pero su comprobacion/);
        assert.match(err.message, /ERROR: docs en rojo/);
        assert.match(err.message, /No se ha mergeado nada/);
        return true;
      }
    );
    assert.equal(e.ejecuciones('completa'), 0);
    assert.equal(git(['rev-parse', 'develop'], e.repoRoot).trim(), developAntes);
    assert.equal((await readTareaFile(e.tareasRoot, 'TASK-903'))?.task.estado, 'en-revision');
    assert.equal(git(['status', '--porcelain'], e.repoRoot), '');
    // MEN-1: el reintento tras arreglar la documentacion no duplica ni la linea ni el commit.
    await e.desenlace('docs', 'ok');
    await finish(e, 'TASK-903');
    assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
    const commits = git(['log', '--format=%s', 'develop'], e.repoRoot).split('\n').filter((l) => /cierre solo documentacion/.test(l));
    assert.equal(commits.length, 1, commits.join('\n'));
    const body = (await readTareaFile(e.tareasRoot, 'TASK-903'))?.body ?? '';
    assert.equal((body.match(/no se ejecuta `/g) ?? []).length, 1);
  });
});

test('finish (TASK-100): un diff mixto (documentacion y codigo) corre la completa y dice por que', async () => {
  await conEntorno(() => RUTAS_DOCS, async (e) => {
    const task = sampleTask({ id: 'TASK-904' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
    const { avisos } = await finish(e, 'TASK-904');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.ok(avisos.some((a) => /verificacion completa: la tarea cambia rutas que no son documentacion: src\/calculo\.ts/.test(a)), avisos.join('\n'));
    assert.doesNotMatch((await readTareaFile(e.tareasRoot, 'TASK-904'))?.body ?? '', /Verificacion de documentacion/);
  });
});

test('finish (TASK-100): mover codigo a una ruta de documentacion no lo exime (cuentan las dos rutas del renombre)', async () => {
  await conEntorno(() => RUTAS_DOCS, async (e) => {
    git(['checkout', '-q', 'develop'], e.repoRoot);
    await mkdir(path.join(e.repoRoot, 'src'), { recursive: true });
    await writeFile(path.join(e.repoRoot, 'src', 'calculo.ts'), 'export const x = 1;\n'.repeat(20), 'utf8');
    commitAll(e.repoRoot, 'codigo en develop');
    const task = sampleTask({ id: 'TASK-905' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await mkdir(path.join(e.repoRoot, 'docs'), { recursive: true });
    git(['mv', 'src/calculo.ts', 'docs/calculo.md'], e.repoRoot);
    commitAll(e.repoRoot, 'mover codigo a docs');
    const { avisos } = await finish(e, 'TASK-905');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.ok(avisos.some((a) => /no son documentacion: src\/calculo\.ts/.test(a)), avisos.join('\n'));
  });
});

test('finish (TASK-100): la rama no puede ampliar sus rutas de documentacion: las de la base mandan y cambiar la config corre la completa', async () => {
  await conEntorno(() => 'rutas_documentacion: [docs/**]\n', async (e) => {
    const task = sampleTask({ id: 'TASK-906' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    // La rama declara su codigo como documentacion en su propio config.
    await enLaRama(
      e,
      '.taskcode/config.yml',
      `comando_verificacion: "${e.comandoCompleta}"\nrutas_documentacion: [docs/**, src/**, trabajo-*.txt]\n`
    );
    await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
    const { avisos } = await finish(e, 'TASK-906');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.ok(avisos.some((a) => /verificacion completa: la tarea cambia \.taskcode\/config\.yml/.test(a)), avisos.join('\n'));
  });
});

// Con un fichero y no con una carpeta (Docs/ frente a docs/): en Windows y macOS
// la carpeta Docs/ seria la misma docs/ donde finish escribe sus artefactos.
test('finish (TASK-100): las rutas distinguen mayusculas: Trabajo-x.txt no casa con trabajo-*.txt', async () => {
  await conEntorno(() => RUTAS_DOCS, async (e) => {
    const task = sampleTask({ id: 'TASK-907' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'Trabajo-extra.txt');
    const { avisos } = await finish(e, 'TASK-907');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.ok(avisos.some((a) => /no son documentacion: Trabajo-extra\.txt/.test(a)), avisos.join('\n'));
  });
});

test('finish (TASK-100): sin rutas_documentacion todo es como en la 0.14.0 (completa, sin aviso ni anotacion nuevos)', async () => {
  await conEntorno(() => '', async (e) => {
    const task = sampleTask({ id: 'TASK-908' });
    await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
    await enLaRama(e, 'docs/guia.md');
    const { avisos } = await finish(e, 'TASK-908');
    assert.equal(e.ejecuciones('completa'), 1);
    assert.ok(!avisos.some((a) => /documentacion/.test(a)), avisos.join('\n'));
    assert.doesNotMatch((await readTareaFile(e.tareasRoot, 'TASK-908'))?.body ?? '', /Verificacion de documentacion/);
  });
});

test('finish (TASK-100): con umbral de cobertura, una tarea de solo documentacion no aborta por informe ausente', async () => {
  await conEntorno(
    () => `${RUTAS_DOCS}informe_cobertura: coverage/lcov.info\numbral_cobertura: 80\n`,
    async (e) => {
      const task = sampleTask({ id: 'TASK-909' });
      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
      await enLaRama(e, 'docs/guia.md');
      const { avisos } = await finish(e, 'TASK-909');
      assert.equal(e.ejecuciones('completa'), 0);
      assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
      assert.ok(avisos.some((a) => /no hay lineas de codigo que medir contra el umbral de cobertura \(80 %\)/.test(a)), avisos.join('\n'));
    }
  );
});

test('finish (TASK-105): con el nivel 2 activo y todo el codigo en rutas parciales, corre la completa sin un motivo contradictorio', async () => {
  await conEntorno(
    ({ docs }) => `${RUTAS_DOCS}comando_verificacion_selectiva: "${docs}"\nrutas_verificacion_parcial: [src/**]\n`,
    async (e) => {
      const task = sampleTask({ id: 'TASK-906' });
      await setupTaskEnRevision(e.repoRoot, e.tareasRoot, task);
      await enLaRama(e, 'src/calculo.ts', 'export const x = 1;\n');
      const { avisos } = await finish(e, 'TASK-906');
      assert.equal(e.ejecuciones('completa'), 1, 'finish sigue exigiendo la completa');
      assert.equal(e.ejecuciones('docs'), 0, 'y no corre la selectiva');
      assert.ok(integradaEnDevelop(task.rama, e.repoRoot));
      assert.ok(
        avisos.some((a) => /: se ejecuta la verificacion completa: la tarea cambia rutas que no son documentacion\.$/.test(a)),
        avisos.join('\n')
      );
      assert.ok(!avisos.some((a) => /basta la verificacion de lo afectado/.test(a)), avisos.join('\n'));
    }
  );
});
