/**
 * TASK-110: el reporter de progreso contra un `node --test` REAL, con los dos
 * reporters como en `npm test` (spec por stdout, progreso por stderr), sobre
 * ficheros minimos en un repo temporal (el total se guarda bajo su .git).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { git } from '../helpers/finish-fixtures.js';

const REPORTER = path.join(import.meta.dirname, '..', 'reporter', 'progreso.js');
const PLUGIN = path.join(import.meta.dirname, '..', '..', '..');

const FICHEROS: Record<string, string> = {
  'a.test.mjs': `import { test } from 'node:test';\ntest('suelto', () => {});\n`,
  'b.test.mjs':
    `import { test, describe, it } from 'node:test';\n` +
    `describe('grupo', () => { it('uno', () => {}); it('dos', () => {}); });\n` +
    `test('padre', async (t) => { await t.test('hijo 1', () => {}); await t.test('hijo 2', () => {}); });\n`,
  'c.test.mjs': `import { test } from 'node:test';\ntest('el que falla', () => { throw new Error('roto a proposito'); });\n`,
};
const HOJAS = 6;

function correr(dir: string, env: NodeJS.ProcessEnv = {}) {
  const base: NodeJS.ProcessEnv = { ...process.env, ...env };
  if (env['TASKCTL_PROGRESO'] === undefined) delete base['TASKCTL_PROGRESO'];
  // Heredada del runner que ejecuta este test, haria que el node --test de dentro
  // se comportara como un hijo suyo (sin reporters y saliendo con 0).
  delete base['NODE_TEST_CONTEXT'];
  const r = spawnSync(
    process.execPath,
    [
      '--test',
      '--test-reporter=spec',
      '--test-reporter-destination=stdout',
      `--test-reporter=${pathToFileURL(REPORTER).href}`,
      '--test-reporter-destination=stderr',
      ...Object.keys(FICHEROS),
    ],
    { cwd: dir, encoding: 'utf8', env: base }
  );
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

const progresos = (stderr: string): string[] => [...stderr.matchAll(/^\[(\d+)\/(\d+|\?)\]$/gm)].map((m) => `${m[1] as string}/${m[2] as string}`);

test('reporter: [x/N] con el total de la ejecucion anterior, sin pasarse, sin tapar el fallo ni cambiar el codigo', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'reporter-progreso-'));
  try {
    git(['init', '-q'], dir);
    for (const [f, t] of Object.entries(FICHEROS)) await writeFile(path.join(dir, f), t, 'utf8');

    const primera = correr(dir);
    assert.notEqual(primera.status, 0, 'un test falla: el codigo no es 0');
    assert.deepEqual(progresos(primera.stderr), ['1/?'], 'sin total anterior');
    assert.match(primera.stderr, new RegExp(`^\\[progreso\\] ${String(HOJAS)} tests \\(sin total`, 'm'));
    assert.match(primera.stdout, /el que falla/, 'el spec sigue nombrando el fallo');
    assert.match(primera.stdout, /roto a proposito/);
    assert.ok(existsSync(path.join(dir, '.git', 'taskcode', 'suite-total.json')), 'el total, bajo .git');

    const segunda = correr(dir);
    assert.notEqual(segunda.status, 0);
    assert.deepEqual(progresos(segunda.stderr), ['1/6', '2/6', '3/6', '4/6', '5/6', '6/6']);
    assert.match(segunda.stderr, /^\[progreso\] 6 tests \(la anterior: 6\)$/m);
    assert.match(segunda.stdout, /el que falla/);

    // Con TASKCTL_PROGRESO escribe ahi su x/N.
    const contador = path.join(dir, '.git', 'taskcode', 'progreso-contador');
    const tercera = correr(dir, { TASKCTL_PROGRESO: contador });
    assert.notEqual(tercera.status, 0);
    assert.equal(readFileSync(contador, 'utf8'), '6/6\n');
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('reporter: npm test y test:rapido lo usan junto al spec, con el glob entrecomillado', () => {
  const pkg = JSON.parse(readFileSync(path.join(PLUGIN, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
  for (const s of ['test', 'test:rapido']) {
    const cmd = pkg.scripts[s] as string;
    assert.match(cmd, /--test-reporter=spec --test-reporter-destination=stdout/, s);
    assert.match(cmd, /--test-reporter=\.\/dist\/test\/reporter\/progreso\.js --test-reporter-destination=stderr/, s);
    assert.match(cmd, /"dist\/test\/[^"]*\*\.test\.js"/, `${s}: el glob lo expande node, entre comillas`);
  }
});
