/**
 * Cobertura de las lineas cambiadas (TASK-074), contra repos Git temporales
 * de verdad y con un lcov REAL: el de `node --test --experimental-test-coverage
 * --test-reporter=lcov`, que en Windows escribe `SF:` relativo y con `\`. Un
 * lcov escrito a mano con `/` no detectaria eso. El lcov lo genera el script
 * de verificacion del fixture (fuera del repo), nunca el codigo de produccion.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { lineasAnadidas, mergeBase } from '../../src/fs/git.js';
import { coberturaDeRama, leerInformeCobertura } from '../../src/fs/cobertura.js';
import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';

/**
 * Verificacion del fixture. Lee su modo de un fichero junto a el:
 * `cov` genera el lcov real; `nada` no escribe nada; `dist` escribe un lcov que
 * solo nombra codigo compilado. Deja un testigo en cada ejecucion.
 * NODE_TEST_CONTEXT se quita: si no, el `node --test` hijo se reportaria al
 * runner de esta suite en vez de ejecutarse solo.
 */
const SCRIPT = `
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
fs.appendFileSync(path.join(__dirname, 'testigo'), 'x');
const modo = fs.readFileSync(path.join(__dirname, 'modo'), 'utf8').trim();
if (modo === 'nada') process.exit(0);
fs.mkdirSync('coverage', { recursive: true });
if (modo === 'dist') { fs.writeFileSync('coverage/lcov.info', 'SF:dist/x.js\\nDA:1,1\\nend_of_record\\n'); process.exit(0); }
const env = { ...process.env };
delete env.NODE_TEST_CONTEXT;
const r = spawnSync(process.execPath, ['--test', '--experimental-test-coverage', '--test-reporter=lcov',
  '--test-reporter-destination=coverage/lcov.info', 'test/*.test.mjs'], { env, encoding: 'utf8' });
process.exit(r.status === null ? 1 : r.status);
`;

/** Lineas 1-7; la 6 (return 'neg') no la ejecuta ningun test. */
const FUENTE = "// comentario\nexport function f(x) {\n  if (x > 0) {\n    return 'pos';\n  }\n  return 'neg';\n}\n";
const TEST_FUENTE = "import { test } from 'node:test';\nimport { f } from '../src/a.mjs';\ntest('pos', () => { f(1); });\n";

interface Ctx {
  repoRoot: string;
  tareasRoot: string;
  dir: string;
  modo(m: 'cov' | 'nada' | 'dist'): Promise<void>;
  ejecuciones(): number;
  generar(): void;
}

function config(comando: string, extra: string): string {
  return `comando_verificacion: "${comando}"\ninforme_cobertura: coverage/lcov.info\n${extra}`;
}

async function conCobertura(extraBase: string, fn: (c: Ctx) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'cobertura-verif-'));
  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
  await writeFile(path.join(dir, 'modo'), 'cov', 'utf8');
  const comando = `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')}`;
  try {
    await withTempRepo(async (repoRoot, tareasRoot) => {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config(comando, extraBase), 'utf8');
      await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\ncoverage/\n', 'utf8');
      commitAll(repoRoot, 'config');
      await fn({
        repoRoot,
        tareasRoot,
        dir,
        modo: (m) => writeFile(path.join(dir, 'modo'), m, 'utf8'),
        ejecuciones: () => (existsSync(path.join(dir, 'testigo')) ? readFileSync(path.join(dir, 'testigo'), 'utf8').length : 0),
        generar: () => {
          const r = spawnSync('node', [path.join(dir, 'verif.cjs')], { cwd: repoRoot, encoding: 'utf8' });
          assert.equal(r.status, 0, r.stderr);
        },
      });
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** En la rama de la tarea: el codigo con una linea sin cubrir y su test. */
async function codigoDeLaTarea(repoRoot: string): Promise<void> {
  await mkdir(path.join(repoRoot, 'src'), { recursive: true });
  await mkdir(path.join(repoRoot, 'test'), { recursive: true });
  await writeFile(path.join(repoRoot, 'src', 'a.mjs'), FUENTE, 'utf8');
  await writeFile(path.join(repoRoot, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
  commitAll(repoRoot, 'feat: codigo con una rama sin test');
}

const integrada = (rama: string, cwd: string) =>
  spawnSync('git', ['merge-base', '--is-ancestor', rama, 'develop'], { cwd }).status === 0;

async function finish(c: Ctx, args: string[], avisos: string[] = []) {
  return runFinishCommand(c.tareasRoot, args, '2026-11-05', {
    repoCwd: c.repoRoot,
    scriptsDir: SCRIPTS_DIR,
    onAviso: (a) => avisos.push(a),
  });
}

// ---------------------------------------------------------------------
// Lineas cambiadas y lectura del informe
// ---------------------------------------------------------------------

test('cobertura: las lineas cambiadas se miden desde la merge base, no desde la punta de la base', async () => {
  await withTempRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/task-990-x', 'develop'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\ndos\n', 'utf8');
    commitAll(repoRoot, 'a');
    git(['checkout', '-q', 'develop'], repoRoot);
    // develop cambia un fichero que la rama tambien tiene: contra la PUNTA de
    // develop, el diff lo daria por «cambiado» en la rama (su version vieja).
    await writeFile(path.join(repoRoot, 'README.md'), '# cambiado en develop\n', 'utf8');
    commitAll(repoRoot, 'readme en develop');
    git(['checkout', '-q', 'feature/task-990-x'], repoRoot);
    const mb = mergeBase('HEAD', 'develop', repoRoot);
    assert.deepEqual([...lineasAnadidas(mb, 'HEAD', [], repoRoot)], [['a.mjs', [1, 2]]]);
    assert.deepEqual(lineasAnadidas('develop', 'HEAD', [], repoRoot).get('README.md'), [1], 'contra la punta si saldria');
    // Tras integrar la base (lo que hace el update de review), b.mjs sigue fuera.
    git(['merge', '-q', '--no-edit', 'develop'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\nDOS\ntres\n', 'utf8');
    commitAll(repoRoot, 'a de nuevo');
    const mb2 = mergeBase('HEAD', 'develop', repoRoot);
    assert.deepEqual([...lineasAnadidas(mb2, 'HEAD', [], repoRoot)], [['a.mjs', [1, 2, 3]]]);
  });
});

test('cobertura: el cruce de la rama usa la merge base: un cambio posterior de la base no cuenta', async () => {
  await withTempRepo(async (repoRoot) => {
    git(['checkout', '-q', '-b', 'feature/task-989-x', 'develop'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\n', 'utf8');
    commitAll(repoRoot, 'a');
    git(['checkout', '-q', 'develop'], repoRoot);
    // Cambia una linea que la rama tiene: contra la punta, saldria como «añadida» en la rama.
    await writeFile(path.join(repoRoot, 'README.md'), '# cambiado en develop\n', 'utf8');
    commitAll(repoRoot, 'readme en develop');
    git(['checkout', '-q', 'feature/task-989-x'], repoRoot);
    await mkdir(path.join(repoRoot, 'coverage'), { recursive: true });
    await writeFile(
      path.join(repoRoot, 'coverage', 'lcov.info'),
      'SF:a.mjs\nDA:1,1\nend_of_record\nSF:README.md\nDA:1,0\nDA:2,0\nend_of_record\n',
      'utf8'
    );
    const c = coberturaDeRama(repoRoot, 'develop', 'coverage/lcov.info', []);
    assert.ok(c.cruce);
    assert.deepEqual([c.cruce.cubiertas, c.cruce.ejecutables], [1, 1], 'README.md es de develop, no de la rama');
  });
});

test('cobertura: respeta excluir_de_revision, no depende de la config de diff de la maquina y sigue renombres', async () => {
  await withTempRepo(async (repoRoot) => {
    await writeFile(path.join(repoRoot, 'viejo.mjs'), Array.from({ length: 20 }, (_, i) => `l${i}`).join('\n') + '\n', 'utf8');
    commitAll(repoRoot, 'viejo');
    git(['checkout', '-q', '-b', 'feature/task-991-x', 'develop'], repoRoot);
    git(['config', 'diff.noprefix', 'true'], repoRoot);
    git(['config', 'diff.renames', 'false'], repoRoot);
    git(['config', 'color.diff', 'always'], repoRoot);
    git(['mv', 'viejo.mjs', 'nuevo.mjs'], repoRoot);
    await mkdir(path.join(repoRoot, 'dist'), { recursive: true });
    await writeFile(path.join(repoRoot, 'dist', 'x.js'), 'compilado\n', 'utf8');
    await writeFile(path.join(repoRoot, 'con espacio.mjs'), 'a\n', 'utf8');
    commitAll(repoRoot, 'rename y dist');
    const mb = mergeBase('HEAD', 'develop', repoRoot);
    const conExclusion = lineasAnadidas(mb, 'HEAD', ['**/dist/**'], repoRoot);
    assert.deepEqual([...conExclusion], [['con espacio.mjs', [1]]], 'el rename puro no aporta lineas; dist excluido');
    const sin = lineasAnadidas(mb, 'HEAD', [], repoRoot);
    assert.deepEqual(sin.get('dist/x.js'), [1]);
  });
});

test('cobertura: el lcov real de node --test (SF relativo, con \\ en Windows) se resuelve a rutas del repo', async () => {
  await conCobertura('', async (c) => {
    await codigoDeLaTarea(c.repoRoot);
    c.generar();
    const texto = await readFile(path.join(c.repoRoot, 'coverage', 'lcov.info'), 'utf8');
    assert.match(texto, /^SF:src[\\/]a\.mjs$/m, 'formato real del reporter');
    assert.match(texto, /^DA:6,0$/m);
    const l = leerInformeCobertura(c.repoRoot, 'coverage/lcov.info', ['**/dist/**']);
    assert.equal(l.tipo, 'ok');
    if (l.tipo !== 'ok') return;
    assert.deepEqual([...l.porRuta.keys()].sort(), ['src/a.mjs', 'test/a.test.mjs']);
    assert.equal(l.validos, 2);
    // Absoluta (c8, istanbul) y relativa a la carpeta del propio informe.
    await writeFile(
      path.join(c.repoRoot, 'coverage', 'lcov.info'),
      `SF:${path.join(c.repoRoot, 'src', 'a.mjs')}\nDA:1,1\nend_of_record\nSF:../test/a.test.mjs\nDA:1,1\nend_of_record\nSF:${path.join(tmpdir(), 'fuera.js')}\nDA:1,0\nend_of_record\n`,
      'utf8'
    );
    const l2 = leerInformeCobertura(c.repoRoot, 'coverage/lcov.info', []);
    assert.ok(l2.tipo === 'ok');
    assert.deepEqual([...l2.porRuta.keys()].sort(), ['src/a.mjs', 'test/a.test.mjs'], 'lo de fuera del repo se ignora');
    await writeFile(path.join(c.repoRoot, 'coverage', 'lcov.info'), 'SF:src/a.mjs\nDA:1,1\n', 'utf8');
    assert.equal(leerInformeCobertura(c.repoRoot, 'coverage/lcov.info', []).tipo, 'truncado');
    assert.equal(leerInformeCobertura(c.repoRoot, 'coverage/no-existe.info', []).tipo, 'ausente');
  });
});

// ---------------------------------------------------------------------
// review: informa, no ejecuta nada
// ---------------------------------------------------------------------

async function peticion(c: Ctx, id: string): Promise<string> {
  await runFinishlessReview(c, id);
  return readFile(path.join(c.tareasRoot, '03-en-revision', id, 'revision', 'peticion-revision-1.md'), 'utf8');
}

async function runFinishlessReview(c: Ctx, id: string): Promise<void> {
  await runReviewCommand(c.tareasRoot, [id], '2026-11-05', { repoCwd: c.repoRoot, scriptsDir: SCRIPTS_DIR });
}

async function tareaEnCurso(c: Ctx, id: string, rama: string): Promise<void> {
  const { writeTareaFile } = await import('../../src/fs/task-store.js');
  git(['checkout', '-q', '-b', rama, 'develop'], c.repoRoot);
  await writeTareaFile(c.tareasRoot, sampleTask({ id, rama, estado: 'en-curso' }), '## Objetivo\nProbar.\n');
  commitAll(c.repoRoot, `chore(${id}): tarea`);
  await codigoDeLaTarea(c.repoRoot);
}

test('review: la peticion nombra la linea exacta sin cubrir (y no su vecina cubierta) sin ejecutar ningun test', async () => {
  await conCobertura('', async (c) => {
    await tareaEnCurso(c, 'TASK-995', 'feature/task-995-cob');
    c.generar();
    const antes = c.ejecuciones();
    const p = await peticion(c, 'TASK-995');
    assert.equal(c.ejecuciones(), antes, 'review no ejecuta comando_verificacion');
    assert.match(p, /## Cobertura de las lineas cambiadas/);
    assert.match(p, /- `src\/a\.mjs`: 6\n/);
    assert.doesNotMatch(p, /`src\/a\.mjs`: [^\n]*\b5\b/);
    assert.match(p, /Cubiertas 9 de 10 lineas cambiadas ejecutables \(90 %\)/);
    assert.match(p, /Cada linea sin cubrir es un hallazgo/);
  });
});

test('review: un informe anterior al ultimo commit de la rama, o ausente, es un aviso y no lista lineas', async () => {
  await conCobertura('', async (c) => {
    await tareaEnCurso(c, 'TASK-996', 'feature/task-996-cob');
    c.generar();
    const viejo = new Date('2020-01-01T00:00:00Z');
    await utimes(path.join(c.repoRoot, 'coverage', 'lcov.info'), viejo, viejo);
    const p = await peticion(c, 'TASK-996');
    assert.match(p, /\[AVISO\] El informe es de 2020-01-01T00:00:00\.000Z, anterior al ultimo commit de la rama/);
    assert.doesNotMatch(p, /`src\/a\.mjs`: 6/);
  });
  await conCobertura('', async (c) => {
    await tareaEnCurso(c, 'TASK-997', 'feature/task-997-cob');
    const p = await peticion(c, 'TASK-997');
    assert.match(p, /\[AVISO\] No existe el informe/);
  });
});

test('review: sin informe_cobertura no hay seccion (como hasta ahora)', async () => {
  await withTempRepo(async (repoRoot, tareasRoot) => {
    const c = { repoRoot, tareasRoot } as Ctx;
    await tareaEnCurso(c, 'TASK-998', 'feature/task-998-cob');
    const p = await peticion(c, 'TASK-998');
    assert.doesNotMatch(p, /Cobertura de las lineas cambiadas/);
  });
});

// ---------------------------------------------------------------------
// finish: frena con el umbral de la base
// ---------------------------------------------------------------------

async function tareaEnRevision(c: Ctx, id: string): Promise<string> {
  const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-cob` });
  await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
  await codigoDeLaTarea(c.repoRoot);
  return task.rama;
}

test('finish: por debajo del umbral no cierra, nombra la linea y develop no avanza', async () => {
  await conCobertura('umbral_cobertura: 91\n', async (c) => {
    const rama = await tareaEnRevision(c, 'TASK-981');
    const develop = git(['rev-parse', 'develop'], c.repoRoot).trim();
    await assert.rejects(
      () => finish(c, ['TASK-981']),
      (e: unknown) => {
        assert.ok(e instanceof FinishCommandError);
        assert.match(e.message, /la cobertura de las lineas cambiadas \(90 %\) no llega al umbral de "develop" \(91 %\)/);
        assert.match(e.message, /- `src\/a\.mjs`: 6/);
        assert.match(e.message, /No se ha mergeado nada/);
        return true;
      }
    );
    assert.equal(git(['rev-parse', 'develop'], c.repoRoot).trim(), develop);
    assert.equal(integrada(rama, c.repoRoot), false);
    assert.ok(existsSync(path.join(c.tareasRoot, '03-en-revision', 'TASK-981')));
  });
});

test('finish: en el valor exacto del umbral cierra, con el informe que regenera su propia verificacion', async () => {
  await conCobertura('umbral_cobertura: 90\n', async (c) => {
    const rama = await tareaEnRevision(c, 'TASK-982');
    // Un informe viejo y engañoso en disco: la verificacion lo reescribe y se mide el nuevo.
    await mkdir(path.join(c.repoRoot, 'coverage'), { recursive: true });
    await writeFile(path.join(c.repoRoot, 'coverage', 'lcov.info'), 'SF:src/a.mjs\nDA:1,0\nDA:2,0\nend_of_record\n', 'utf8');
    const r = await finish(c, ['TASK-982']);
    assert.equal(r.cierre, 'terminada');
    assert.equal(integrada(rama, c.repoRoot), true);
  });
});

test('finish: el umbral se lee de la base; la rama no puede rebajarlo', async () => {
  await conCobertura('umbral_cobertura: 100\n', async (c) => {
    await tareaEnRevision(c, 'TASK-983');
    const cfg = path.join(c.repoRoot, '.taskcode', 'config.yml');
    const texto = (await readFile(cfg, 'utf8')).replace('umbral_cobertura: 100', 'umbral_cobertura: 0');
    await writeFile(cfg, texto, 'utf8');
    commitAll(c.repoRoot, 'rebajar el umbral en la rama');
    await assert.rejects(() => finish(c, ['TASK-983']), /no llega al umbral de "develop" \(100 %\)[\s\S]*commit en \.taskcode\/config\.yml de "develop"/);
  });
});

test('finish: sin datos fiables no cierra (informe ausente, viejo o que solo mide lo excluido)', async () => {
  await conCobertura('umbral_cobertura: 50\n', async (c) => {
    await tareaEnRevision(c, 'TASK-984');
    await c.modo('nada');
    await assert.rejects(() => finish(c, ['TASK-984']), /no se puede medir[\s\S]*no existe coverage\/lcov\.info/);
    await mkdir(path.join(c.repoRoot, 'coverage'), { recursive: true });
    await writeFile(path.join(c.repoRoot, 'coverage', 'lcov.info'), 'SF:src/a.mjs\nDA:1,1\nend_of_record\n', 'utf8');
    const viejo = new Date(Date.now() - 3600_000);
    await utimes(path.join(c.repoRoot, 'coverage', 'lcov.info'), viejo, viejo);
    await assert.rejects(() => finish(c, ['TASK-984']), /anterior a la verificacion de este finish: no la ha regenerado/);
    await c.modo('dist');
    await assert.rejects(() => finish(c, ['TASK-984']), /ninguna ruta del informe coverage\/lcov\.info es un fichero del repo fuera de lo excluido/);
    assert.equal(integrada('feature/task-984-cob', c.repoRoot), false);
  });
});

test('finish: --sin-verificacion salta tambien la cobertura y lo avisa; sin umbral cierra como siempre', async () => {
  await conCobertura('umbral_cobertura: 100\n', async (c) => {
    await tareaEnRevision(c, 'TASK-985');
    const avisos: string[] = [];
    const r = await finish(c, ['TASK-985', '--sin-verificacion'], avisos);
    assert.equal(r.cierre, 'terminada');
    assert.ok(avisos.some((a) => /tampoco se mide el umbral de cobertura \(100 %\)/.test(a)), avisos.join('\n'));
  });
  await conCobertura('', async (c) => {
    await tareaEnRevision(c, 'TASK-986');
    await c.modo('nada');
    const r = await finish(c, ['TASK-986']);
    assert.equal(r.cierre, 'terminada', 'sin umbral, sin informe: no frena');
  });
});
