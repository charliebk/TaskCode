/**
 * Tests de scripts/verificar-impacto.mjs (TASK-122): la verificacion por
 * impacto de este repo. El script vive en la raiz del repo (no se publica con
 * el plugin), asi que se lanza por ruta contra un repo Git temporal real que
 * reproduce la estructura del plugin en miniatura.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { plantillaRepo } from '../helpers/repo-plantilla.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, '..', '..', '..', '..', '..', '..', 'scripts', 'verificar-impacto.mjs');
const PLUGIN = 'taskcode-marketplace/plugins/taskcode-plugin';

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}

async function escribir(raiz: string, rel: string, contenido: string): Promise<void> {
  const abs = path.join(raiz, ...rel.split('/'));
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, contenido);
}

const PASA = "import { test } from 'node:test';\ntest('ok', () => {});\n";
const FALLA = "import { test } from 'node:test';\ntest('rojo', () => { throw new Error('rojo'); });\n";

const FICHEROS: Record<string, string> = {
  'docs/guia.md': '# guia\n',
  [`${PLUGIN}/package.json`]: JSON.stringify({ type: 'module', scripts: { build: 'node -e 0', 'limpiar:test': 'node -e 0' } }),
  [`${PLUGIN}/tsconfig.json`]: '{}\n',
  [`${PLUGIN}/bin/taskctl`]: '#!/usr/bin/env node\n',
  [`${PLUGIN}/scripts/gitflow/start.sh`]: 'echo hola\n',
  [`${PLUGIN}/plantilla.yml`]: 'clave: 1\n',
  [`${PLUGIN}/huerfano.yml`]: 'clave: 2\n',
  [`${PLUGIN}/src/a.ts`]: 'export const a = 1;\n',
  [`${PLUGIN}/src/b.ts`]: "import { a } from './a.js';\nexport const b = a + 1;\n",
  [`${PLUGIN}/src/c.ts`]: 'export const c = 3;\n',
  [`${PLUGIN}/test/b.test.ts`]: "import { b } from '../src/b.js';\nvoid b;\n",
  [`${PLUGIN}/test/c.test.ts`]: "import { c } from '../src/c.js';\nvoid c;\n",
  [`${PLUGIN}/test/helpers/h.ts`]: "export const RAIZ = 'x';\nexport const BIN = ['bin', 'taskctl'];\n",
  [`${PLUGIN}/test/lanza.test.ts`]: "import { BIN } from './helpers/h.js';\nvoid BIN;\n",
  [`${PLUGIN}/test/flujo.test.ts`]: "const S = ['scripts', 'gitflow'];\nconst Y = 'plantilla.yml';\nvoid S; void Y;\n",
  [`${PLUGIN}/test/core/x.test.ts`]: "import { c } from '../../src/c.js';\nvoid c;\n",
  // El enrutador de comandos: quien lo importa solo depende de los comandos que nombra.
  [`${PLUGIN}/src/cli.ts`]: "import { alfa } from './commands/alfa.js';\nimport { beta } from './commands/beta.js';\nexport const main = [alfa, beta];\n",
  [`${PLUGIN}/src/commands/alfa.ts`]: "import { x } from '../core/x.js';\nexport const alfa = x;\n",
  [`${PLUGIN}/src/commands/beta.ts`]: 'export const beta = 2;\n',
  [`${PLUGIN}/src/core/x.ts`]: 'export const x = 1;\n',
  [`${PLUGIN}/test/alfa.test.ts`]: "import { main } from '../src/cli.js';\nvoid main; const ARGS = ['alfa'];\nvoid ARGS;\n",
  [`${PLUGIN}/test/beta.test.ts`]: "import { main } from '../src/cli.js';\nvoid main; const ARGS = ['beta'];\nvoid ARGS;\n",
  // Lo "compilado" que corre node --test (el build del repo miniatura no hace nada).
  [`${PLUGIN}/dist/test/core/x.test.js`]: PASA,
  [`${PLUGIN}/dist/test/b.test.js`]: PASA,
  [`${PLUGIN}/dist/test/c.test.js`]: FALLA,
};

const conRepo = plantillaRepo('verificar-impacto-', async (dir) => {
  git(['init', '-q', '-b', 'develop'], dir);
  git(['config', 'user.email', 't@t'], dir);
  git(['config', 'user.name', 't'], dir);
  git(['config', 'core.autocrlf', 'false'], dir);
  for (const [rel, contenido] of Object.entries(FICHEROS)) await escribir(dir, rel, contenido);
  git(['add', '-A'], dir);
  git(['commit', '-q', '-m', 'base'], dir);
  git(['checkout', '-q', '-b', 'feature/x'], dir);
});

interface Seleccion {
  todo: boolean;
  motivo?: string;
  tests: { fichero: string; motivo: string }[];
}

function listar(raiz: string, base = 'develop'): Seleccion {
  const r = spawnSync(process.execPath, [SCRIPT, '--listar'], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: base } });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout) as Seleccion;
}

async function cambiarYCommitear(raiz: string, rel: string, contenido = '// cambio\n'): Promise<void> {
  await escribir(raiz, rel, contenido);
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'cambio'], raiz);
}

const ficheros = (s: Seleccion) => s.tests.map((t) => t.fichero);

test('un test cambiado se corre solo el', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/test/c.test.ts`, "import { c } from '../src/c.js';\nvoid c; // cambio\n");
    const s = listar(raiz);
    assert.equal(s.todo, false);
    assert.deepEqual(ficheros(s), ['test/c.test.ts']);
  });
});

test('un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/src/a.ts`, 'export const a = 2;\n');
    const s = listar(raiz);
    assert.equal(s.todo, false);
    assert.deepEqual(ficheros(s), ['test/b.test.ts']);
    assert.match(s.tests[0]!.motivo, /src\/a\.ts/);
  });
});

test('el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/src/core/x.ts`, 'export const x = 5;\n');
    // alfa.test nombra 'alfa'; beta.test y lanza.test (bin/taskctl via su helper) no.
    assert.deepEqual(ficheros(listar(raiz)), ['test/alfa.test.ts']);
  });
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/src/cli.ts`, "export const main = [];\n");
    assert.deepEqual(ficheros(listar(raiz)), ['test/alfa.test.ts', 'test/beta.test.ts', 'test/lanza.test.ts']);
  });
});

test('un cambio sin commitear tambien cuenta', async () => {
  await conRepo(async (raiz) => {
    await escribir(raiz, `${PLUGIN}/src/c.ts`, 'export const c = 4;\n');
    assert.deepEqual(ficheros(listar(raiz)), ['test/c.test.ts', 'test/core/x.test.ts']);
  });
});

test('un helper de test elige los tests que lo importan', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/test/helpers/h.ts`, "export const BIN = ['bin', 'taskctl'];\n");
    assert.deepEqual(ficheros(listar(raiz)), ['test/lanza.test.ts']);
  });
});

test('bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/bin/taskctl`);
    assert.deepEqual(ficheros(listar(raiz)), ['test/lanza.test.ts']);
  });
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/scripts/gitflow/start.sh`);
    assert.deepEqual(ficheros(listar(raiz)), ['test/flujo.test.ts']);
  });
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/plantilla.yml`, 'clave: 3\n');
    assert.deepEqual(ficheros(listar(raiz)), ['test/flujo.test.ts']);
  });
});

test('ante la duda, la suite entera: transversales, ficheros sin test y base inexistente', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/package.json`, '{"type":"module"}\n');
    const s = listar(raiz);
    assert.equal(s.todo, true);
    assert.match(s.motivo ?? '', /package\.json/);
  });
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/huerfano.yml`, 'clave: 9\n');
    assert.equal(listar(raiz).todo, true);
  });
  await conRepo(async (raiz) => {
    const s = listar(raiz, 'no-existe');
    assert.equal(s.todo, true);
    assert.match(s.motivo ?? '', /no-existe/);
  });
});

test('solo documentacion y tareas: ningun test por impacto (solo los rapidos)', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
    await cambiarYCommitear(raiz, 'tareas/02-en-curso/TASK-001/tarea.md', 'x\n');
    await cambiarYCommitear(raiz, 'CHANGELOG.md', 'x\n');
    const s = listar(raiz);
    assert.equal(s.todo, false);
    assert.deepEqual(s.tests, []);
  });
});

test('ejecuta lo elegido mas los rapidos y sale con el codigo de node --test', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
    const verde = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
    assert.equal(verde.status, 0, verde.stdout + verde.stderr);
    assert.match(verde.stdout, /Por impacto: 0 fichero/);
    assert.match(verde.stdout, /pass 1\b/);
  });
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/test/c.test.ts`, "import { c } from '../src/c.js';\nvoid c; // cambio\n");
    const rojo = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
    assert.notEqual(rojo.status, 0);
    assert.match(rojo.stdout, /test\/c\.test\.ts \(test cambiado\)/);
    assert.match(rojo.stdout, /fail 1\b/);
  });
});
