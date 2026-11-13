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
import { runVeredictoCommand } from '../../src/commands/veredicto.js';
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
const excluir = modo === 'cov-sin-tests' ? ['--test-coverage-exclude=test/**'] : [];
const r = spawnSync(process.execPath, ['--test', '--experimental-test-coverage', ...excluir, '--test-reporter=lcov',
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
  modo(m: 'cov' | 'cov-sin-tests' | 'nada' | 'dist'): Promise<void>;
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

test('cobertura: lineas cambiadas (merge base, config de diff de la maquina, renombres, "++ ", diff externo) y cruce de la rama con la merge base', async () => {
  await withTempRepo(async (repoRoot) => {
    // --- las lineas cambiadas se miden desde la merge base, no desde la punta de la base
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

    // --- el cruce de la rama usa la merge base: un cambio posterior de la base no cuenta
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['checkout', '-q', '-b', 'feature/task-989-x', 'develop'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\n', 'utf8');
    commitAll(repoRoot, 'a');
    git(['checkout', '-q', 'develop'], repoRoot);
    // Cambia una linea que la rama tiene: contra la punta, saldria como «añadida» en la rama.
    await writeFile(path.join(repoRoot, 'README.md'), '# cambiado otra vez en develop\n', 'utf8');
    commitAll(repoRoot, 'readme en develop otra vez');
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
    // El informe de prueba no debe colarse en los commits de los pasos siguientes.
    await rm(path.join(repoRoot, 'coverage'), { recursive: true, force: true });

    // --- lineasAnadidas (MEN-1): una linea añadida que empieza por "++ " es contenido, no una cabecera; las vacias no cuentan
    git(['checkout', '-q', 'develop'], repoRoot);
    const baseX = Array.from({ length: 20 }, (_, i) => `l${i + 1}`);
    await writeFile(path.join(repoRoot, 'x.txt'), baseX.join('\n') + '\n', 'utf8');
    commitAll(repoRoot, 'x');
    git(['checkout', '-q', '-b', 'feature/task-979-x', 'develop'], repoRoot);
    const lx = [...baseX];
    lx.splice(2, 0, '++ b/otro');
    lx.splice(10, 0, '   ');
    lx.splice(16, 0, 'nueva');
    await writeFile(path.join(repoRoot, 'x.txt'), lx.join('\n') + '\n', 'utf8');
    commitAll(repoRoot, 'x cambiado');
    const mbX = mergeBase('HEAD', 'develop', repoRoot);
    assert.deepEqual([...lineasAnadidas(mbX, 'HEAD', [], repoRoot)], [['x.txt', [3, 17]]]);

    // --- respeta excluir_de_revision, no depende de la config de diff de la maquina y sigue renombres
    git(['checkout', '-q', 'develop'], repoRoot);
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
    const mbR = mergeBase('HEAD', 'develop', repoRoot);
    const conExclusion = lineasAnadidas(mbR, 'HEAD', ['**/dist/**'], repoRoot);
    assert.deepEqual([...conExclusion], [['con espacio.mjs', [1]]], 'el rename puro no aporta lineas; dist excluido');
    const sin = lineasAnadidas(mbR, 'HEAD', [], repoRoot);
    assert.deepEqual(sin.get('dist/x.js'), [1]);

    // --- cobertura (IMP-4): un diff externo configurado en el repo no cambia las lineas
    git(['checkout', '-q', 'develop'], repoRoot);
    git(['checkout', '-q', '-b', 'feature/task-978-x', 'develop'], repoRoot);
    await writeFile(path.join(repoRoot, 'a.mjs'), 'uno\n', 'utf8');
    commitAll(repoRoot, 'a');
    git(['config', 'diff.external', 'false'], repoRoot);
    const mbE = mergeBase('HEAD', 'develop', repoRoot);
    assert.deepEqual([...lineasAnadidas(mbE, 'HEAD', [], repoRoot)], [['a.mjs', [1]]]);
  });
});

test('cobertura: el lcov real de node --test (SF relativo, con \\ en Windows) se resuelve a rutas del repo; un proyecto en subcarpeta resuelve sus rutas a pkg/ (IMP-3) y con los tests excluidos un test nuevo no cuenta y un modulo nuevo si (IMP-6 de la ronda 3)', async () => {
  await conCobertura('', async (c) => {
    // --- el lcov real de node --test se resuelve a rutas del repo
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

    // --- cobertura (IMP-3): un proyecto en subcarpeta con el informe en pkg/coverage/ resuelve sus rutas a pkg/
    // (coverage/ esta en el .gitignore del fixture: el informe no se cuela en los commits siguientes)
    const repoRoot = c.repoRoot;
    const pkg = path.join(repoRoot, 'pkg');
    await mkdir(path.join(pkg, 'src'), { recursive: true });
    await mkdir(path.join(pkg, 'test'), { recursive: true });
    await mkdir(path.join(pkg, 'coverage'), { recursive: true });
    await writeFile(path.join(pkg, 'src', 'a.mjs'), FUENTE, 'utf8');
    await writeFile(path.join(pkg, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
    commitAll(repoRoot, 'pkg');
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const r = spawnSync(
      process.execPath,
      ['--test', '--experimental-test-coverage', '--test-reporter=lcov', '--test-reporter-destination=coverage/lcov.info', 'test/*.test.mjs'],
      { cwd: pkg, env, encoding: 'utf8' }
    );
    assert.equal(r.status, 0, r.stderr);
    const lp = leerInformeCobertura(repoRoot, 'pkg/coverage/lcov.info', []);
    assert.ok(lp.tipo === 'ok');
    assert.deepEqual([...lp.porRuta.keys()].sort(), ['pkg/src/a.mjs', 'pkg/test/a.test.mjs']);
    assert.equal(lp.validos, 2);
    assert.deepEqual(lp.raices, ['pkg'], 'la raiz del proyecto que genero el informe');

    // --- cobertura (IMP-6 de la ronda 3): en un proyecto en subcarpeta con los tests excluidos, un test nuevo no cuenta y un modulo nuevo si
    git(['checkout', '-q', '-b', 'feature/task-967-x', 'develop'], repoRoot);
    await writeFile(path.join(pkg, 'test', 'b.test.mjs'), "import { test } from 'node:test';\nimport { f } from '../src/a.mjs';\ntest('neg', () => { f(-1); });\n", 'utf8');
    await writeFile(path.join(pkg, 'src', 'nuevo.mjs'), 'export const n = 1;\n', 'utf8');
    commitAll(repoRoot, 'test y modulo nuevos');
    const r2 = spawnSync(
      process.execPath,
      ['--test', '--experimental-test-coverage', '--test-coverage-exclude=test/**', '--test-reporter=lcov', '--test-reporter-destination=coverage/lcov.info', 'test/*.test.mjs'],
      { cwd: pkg, env, encoding: 'utf8' }
    );
    assert.equal(r2.status, 0, r2.stderr);
    const cr = coberturaDeRama(repoRoot, 'develop', 'pkg/coverage/lcov.info', []);
    assert.ok(cr.cruce);
    assert.deepEqual(cr.cruce.ficheros.map((f) => f.ruta), ['pkg/src/nuevo.mjs']);
    assert.ok(cr.cruce.sinInstrumentar.includes('pkg/test/b.test.mjs'));
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

test('review: la peticion informa de la cobertura sin ejecutar nada (linea exacta sin cubrir; informe viejo o ausente = aviso; merge de la base del update; fragmentada por dominio; ronda 2 fragmentada)', async () => {
  await conCobertura('', async (c) => {
    // --- la peticion nombra la linea exacta sin cubrir (y no su vecina cubierta) sin ejecutar ningun test
    await tareaEnCurso(c, 'TASK-995', 'feature/task-995-cob');
    c.generar();
    const antes = c.ejecuciones();
    const p995 = await peticion(c, 'TASK-995');
    assert.equal(c.ejecuciones(), antes, 'review no ejecuta comando_verificacion');
    assert.match(p995, /## Cobertura de las lineas cambiadas/);
    assert.match(p995, /- `src\/a\.mjs`: 6\n/);
    assert.doesNotMatch(p995, /`src\/a\.mjs`: [^\n]*\b5\b/);
    assert.match(p995, /Cubiertas 9 de 10 lineas cambiadas ejecutables \(90 %\)/);
    assert.match(p995, /Cada linea sin cubrir es un hallazgo/);

    // --- un informe anterior al ultimo commit de la rama es un aviso y no lista lineas
    git(['checkout', '-q', 'develop'], c.repoRoot);
    await tareaEnCurso(c, 'TASK-996', 'feature/task-996-cob');
    c.generar();
    const viejo = new Date('2020-01-01T00:00:00Z');
    await utimes(path.join(c.repoRoot, 'coverage', 'lcov.info'), viejo, viejo);
    const p996 = await peticion(c, 'TASK-996');
    assert.match(p996, /\[AVISO\] El informe es de 2020-01-01T00:00:00\.000Z, anterior al ultimo commit de la rama/);
    assert.doesNotMatch(p996, /`src\/a\.mjs`: 6/);

    // --- un informe ausente es un aviso
    git(['checkout', '-q', 'develop'], c.repoRoot);
    await rm(path.join(c.repoRoot, 'coverage'), { recursive: true, force: true });
    await tareaEnCurso(c, 'TASK-997', 'feature/task-997-cob');
    const p997 = await peticion(c, 'TASK-997');
    assert.match(p997, /\[AVISO\] No existe el informe/);

    // --- review (IMP-4): el merge de la base que hace el update no deja el informe por viejo
    git(['checkout', '-q', 'develop'], c.repoRoot);
    const { writeTareaFile } = await import('../../src/fs/task-store.js');
    git(['checkout', '-q', '-b', 'feature/task-972-cob', 'develop'], c.repoRoot);
    await writeTareaFile(c.tareasRoot, sampleTask({ id: 'TASK-972', rama: 'feature/task-972-cob', estado: 'en-curso' }), '## Objetivo\nProbar.\n');
    await mkdir(path.join(c.repoRoot, 'src'), { recursive: true });
    await mkdir(path.join(c.repoRoot, 'test'), { recursive: true });
    await writeFile(path.join(c.repoRoot, 'src', 'a.mjs'), FUENTE, 'utf8');
    await writeFile(path.join(c.repoRoot, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
    commitConFecha(c.repoRoot, 'feat: codigo', '2020-01-01T00:00:00Z');
    c.generar();
    const informe = new Date('2021-01-01T00:00:00Z');
    await utimes(path.join(c.repoRoot, 'coverage', 'lcov.info'), informe, informe);
    // La base avanza: el update de review la mergea en la rama con la fecha de hoy.
    git(['checkout', '-q', 'develop'], c.repoRoot);
    await writeFile(path.join(c.repoRoot, 'otro.txt'), 'de develop\n', 'utf8');
    commitAll(c.repoRoot, 'develop avanza');
    git(['checkout', '-q', 'feature/task-972-cob'], c.repoRoot);
    const p972 = await peticion(c, 'TASK-972');
    assert.doesNotMatch(p972, /anterior al ultimo commit de la rama/);
    assert.match(p972, /- `src\/a\.mjs`: 6\n/);

    // --- review (IMP-4, MEN-4): en una peticion fragmentada cada dominio ve solo la cobertura de sus ficheros
    git(['checkout', '-q', 'develop'], c.repoRoot);
    await tareaEnCurso(c, 'TASK-971', 'feature/task-971-cob');
    await mkdir(path.join(c.repoRoot, 'java'), { recursive: true });
    await writeFile(path.join(c.repoRoot, 'java', 'X.java'), 'class X {}\n', 'utf8');
    commitAll(c.repoRoot, 'feat: java');
    c.generar();
    await runFinishlessReview(c, 'TASK-971');
    const dir971 = path.join(c.tareasRoot, '03-en-revision', 'TASK-971', 'revision');
    const java971 = await readFile(path.join(dir971, 'peticion-revision-1-java-spring-reviewer.md'), 'utf8');
    const generico971 = await readFile(path.join(dir971, 'peticion-revision-1-code-quality-reviewer.md'), 'utf8');
    assert.match(java971, /## Cobertura de las lineas cambiadas/);
    assert.doesNotMatch(java971, /src\/a\.mjs/);
    assert.match(java971, /`java\/X\.java`/, 'el .java no esta instrumentado: va aparte');
    assert.match(generico971, /- `src\/a\.mjs`: 6\n/);
    assert.doesNotMatch(generico971, /X\.java/);

    // --- review (MEN-5): en la ronda 2 fragmentada, una linea sin cubrir de un dominio sin peticion va a la primera
    git(['checkout', '-q', 'develop'], c.repoRoot);
    await tareaEnCurso(c, 'TASK-968', 'feature/task-968-cob');
    c.generar();
    await runFinishlessReview(c, 'TASK-968');
    await runVeredictoCommand(c.tareasRoot, ['TASK-968', 'cambios-solicitados'], { repoCwd: c.repoRoot });
    // La ronda 2 solo toca otros dominios: java y vue, sin grupo generico.
    await mkdir(path.join(c.repoRoot, 'java'), { recursive: true });
    await mkdir(path.join(c.repoRoot, 'web'), { recursive: true });
    await writeFile(path.join(c.repoRoot, 'java', 'X.java'), 'class X {}\n', 'utf8');
    await writeFile(path.join(c.repoRoot, 'web', 'C.vue'), '<template><p/></template>\n', 'utf8');
    commitAll(c.repoRoot, 'feat: java y vue');
    c.generar();
    const r2 = await runReviewCommand(c.tareasRoot, ['TASK-968'], '2026-11-05', { repoCwd: c.repoRoot, scriptsDir: SCRIPTS_DIR });
    assert.equal(r2.incremental, true);
    const dir = path.join(c.tareasRoot, '03-en-revision', 'TASK-968', 'revision');
    const java = await readFile(path.join(dir, 'peticion-revision-2-java-spring-reviewer.md'), 'utf8');
    const vue = await readFile(path.join(dir, 'peticion-revision-2-angular-vue-reviewer.md'), 'utf8');
    const conA = [java, vue].filter((p) => /- `src\/a\.mjs`: 6\n/.test(p));
    assert.equal(conA.length, 1, 'la linea sin cubrir de la ronda 1 sale una vez, aunque su dominio no tenga peticion');
    assert.doesNotMatch(vue, /X\.java/);
    // MEN-8 de la ronda 3: la peticion que recibe src/a.mjs conserva tambien sus propios ficheros.
    if (conA[0] === java) assert.match(java, /`java\/X\.java`/);
    else assert.match(vue, /`web\/C\.vue`/);
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

// ---------------------------------------------------------------------
// Ronda 1 de revision
// ---------------------------------------------------------------------

test('finish (IMP-1): un modulo nuevo que ningun test carga no pasa el umbral; una tarea de solo docs, si', async () => {
  await conCobertura('umbral_cobertura: 50\n', async (c) => {
    // El codigo medido ya esta en la base; la rama solo añade un modulo sin test.
    await codigoDeLaTarea(c.repoRoot);
    const task = sampleTask({ id: 'TASK-975', rama: 'feature/task-975-cob' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await writeFile(path.join(c.repoRoot, 'src', 'nuevo.mjs'), 'export function g(x) {\n  if (x) return 1;\n  return 2;\n}\n', 'utf8');
    commitAll(c.repoRoot, 'feat: modulo sin test');
    await assert.rejects(
      () => finish(c, ['TASK-975']),
      /no llega al umbral[\s\S]*- `src\/nuevo\.mjs`: 1-4 \(el informe no lo lista, y es codigo de una carpeta que si mide: cuenta entero\)/
    );
    assert.equal(integrada(task.rama, c.repoRoot), false);
  });
  await conCobertura('umbral_cobertura: 100\n', async (c) => {
    await codigoDeLaTarea(c.repoRoot);
    const task = sampleTask({ id: 'TASK-976', rama: 'feature/task-976-cob' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await mkdir(path.join(c.repoRoot, 'docs'), { recursive: true });
    await writeFile(path.join(c.repoRoot, 'docs', 'guia.md'), '# guia\n', 'utf8');
    commitAll(c.repoRoot, 'docs');
    const r = await finish(c, ['TASK-976']);
    assert.equal(r.cierre, 'terminada', 'solo docs y .txt: nada que medir');
  });
});

test('finish (IMP-4): una rama que quita comando_verificacion no sortea el umbral de la base', async () => {
  await conCobertura('umbral_cobertura: 10\n', async (c) => {
    await tareaEnRevision(c, 'TASK-974');
    await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'informe_cobertura: coverage/lcov.info\n', 'utf8');
    commitAll(c.repoRoot, 'quitar la verificacion en la rama');
    await assert.rejects(() => finish(c, ['TASK-974']), /la rama no declara comando_verificacion, asi que nadie regenera el informe/);
    assert.equal(integrada('feature/task-974-cob', c.repoRoot), false);
  });
});

test('finish (IMP-4): un hotfix mide contra la principal y con la config de la principal', async () => {
  await conCobertura('umbral_cobertura: 0\n', async (c) => {
    const config = await readFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), 'utf8');
    git(['checkout', '-q', 'main'], c.repoRoot);
    await mkdir(path.join(c.repoRoot, '.taskcode'), { recursive: true });
    await writeFile(path.join(c.repoRoot, '.taskcode', 'config.yml'), config.replace('umbral_cobertura: 0', 'umbral_cobertura: 100'), 'utf8');
    await writeFile(path.join(c.repoRoot, '.gitignore'), 'logs/\ncoverage/\n', 'utf8');
    commitAll(c.repoRoot, 'config en main');
    git(['checkout', '-q', 'develop'], c.repoRoot);
    const task = sampleTask({ id: 'TASK-973', tipo: 'hotfix', rama: 'hotfix/task-973-arreglo' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task, { base: 'main' });
    await codigoDeLaTarea(c.repoRoot);
    await assert.rejects(() => finish(c, ['TASK-973']), /no llega al umbral de "main" \(100 %\)/);
  });
});

/** Commit con fecha de autor y de commit fijas: el merge que haga review sera posterior. */
function commitConFecha(repoRoot: string, mensaje: string, fecha: string): void {
  git(['add', '-A'], repoRoot);
  const r = spawnSync('git', ['commit', '-q', '-m', mensaje], {
    cwd: repoRoot,
    env: { ...process.env, GIT_AUTHOR_DATE: fecha, GIT_COMMITTER_DATE: fecha },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
}

// ---------------------------------------------------------------------
// Ronda 2 de revision
// ---------------------------------------------------------------------

test('finish (IMP-5): con los tests excluidos de la cobertura, una tarea que solo añade tests cierra', async () => {
  await conCobertura('umbral_cobertura: 100\n', async (c) => {
    // Base con el codigo cubierto por completo.
    await mkdir(path.join(c.repoRoot, 'src'), { recursive: true });
    await mkdir(path.join(c.repoRoot, 'test'), { recursive: true });
    await writeFile(path.join(c.repoRoot, 'src', 'a.mjs'), FUENTE, 'utf8');
    await writeFile(path.join(c.repoRoot, 'test', 'a.test.mjs'), TEST_FUENTE, 'utf8');
    commitAll(c.repoRoot, 'codigo en la base');
    await c.modo('cov-sin-tests');
    const task = sampleTask({ id: 'TASK-969', rama: 'feature/task-969-cob' });
    await setupTaskEnRevision(c.repoRoot, c.tareasRoot, task);
    await writeFile(path.join(c.repoRoot, 'test', 'b.test.mjs'), "import { test } from 'node:test';\nimport { f } from '../src/a.mjs';\ntest('neg', () => { f(-1); });\n", 'utf8');
    commitAll(c.repoRoot, 'test: rama neg');
    const r = await finish(c, ['TASK-969']);
    assert.equal(r.cierre, 'terminada', 'test/b.test.mjs no esta en el informe ni en una carpeta medida: no cuenta');
  });
});

