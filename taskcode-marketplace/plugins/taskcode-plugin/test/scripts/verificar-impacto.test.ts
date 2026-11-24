/**
 * Tests de scripts/verificar-impacto.mjs (TASK-122): la verificacion por
 * impacto de este repo. El script vive en la raiz del repo (no se publica con
 * el plugin), asi que se lanza por ruta contra un repo Git temporal real que
 * reproduce la estructura del plugin en miniatura.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
  recorte?: string;
  enrutador?: string;
  tests: { fichero: string; motivo: string }[];
  sinTope?: boolean;
  suiteEntera?: boolean;
}

function listar(raiz: string, base = 'develop', tope?: number, tipo?: string): Seleccion {
  const env: NodeJS.ProcessEnv = { ...process.env, RAMA_BASE: base };
  if (tope === undefined) delete env['VERIFICAR_IMPACTO_TOPE'];
  else env['VERIFICAR_IMPACTO_TOPE'] = String(tope);
  // TASK-139b: el tipo lo decide cada test, no el entorno de quien corre la suite.
  if (tipo === undefined) delete env['TASKCODE_VERIFICACION'];
  else env['TASKCODE_VERIFICACION'] = tipo;
  const r = spawnSync(process.execPath, [SCRIPT, '--listar'], { cwd: raiz, encoding: 'utf8', env });
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
    const s = listar(raiz);
    assert.deepEqual(ficheros(s), ['test/alfa.test.ts']);
    // Y lo dice: la busqueda se paro en el enrutador.
    assert.match(s.enrutador ?? '', /se paro en src\/cli\.ts.*'alfa'/);
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
    assert.match(r.stdout, /Enrutador: la busqueda se paro en src\/cli\.ts; mas alla, solo los que nombran 'alfa'/);
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

test('ante la duda, la suite entera: transversales y ficheros sin test', async () => {
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
});

test('base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/test/c.test.ts`, "import { c } from '../src/c.js';\nvoid c; // cambio\n");
    for (const args of [[SCRIPT], [SCRIPT, '--listar']]) {
      const r = spawnSync(process.execPath, args, { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'no-existe' } });
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.match(r.stderr, /la rama base "no-existe" no existe/);
      assert.match(r.stderr, /git branch no-existe origin\/no-existe/);
      assert.match(r.stderr, /RAMA_BASE=/);
      // No corre nada: ni compila ni lanza node --test.
      assert.doesNotMatch(r.stdout, /Por impacto|pass \d/);
    }
  });
});

test('solo documentacion y tareas: ningun test por impacto (solo los rapidos)', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
    await cambiarYCommitear(raiz, 'tareas/02-en-curso/TASK-001/tarea.md', 'x\n');
    await cambiarYCommitear(raiz, 'CHANGELOG.md', 'x\n');
    await cambiarYCommitear(raiz, '.taskcode/config.yml', 'modo_flujo: automatico\n');
    await cambiarYCommitear(raiz, `${PLUGIN}/README.md`, '# x\n');
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

test('los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa)', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/test/c.test.ts`, "import { c } from '../src/c.js';\nvoid c; // cambio\n");
    // Lo "compilado" de ese test (el build del repo miniatura no hace nada): pasa solo sin RAMA_BASE.
    await escribir(
      raiz,
      `${PLUGIN}/dist/test/c.test.js`,
      "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\n" +
        "test('sin RAMA_BASE', () => { assert.equal(process.env.RAMA_BASE, undefined); });\n"
    );
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /test\/c\.test\.ts \(test cambiado\)/);
  });
});

test('tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice)', async () => {
  await conRepo(async (raiz) => {
    // a.ts lo importa b.ts, y b.test.ts a b.ts: por impacto entra b.test, pero no es directo.
    await cambiarYCommitear(raiz, `${PLUGIN}/src/a.ts`, 'export const a = 9;\n');
    await cambiarYCommitear(raiz, `${PLUGIN}/src/c.ts`, 'export const c = 9;\n');
    assert.deepEqual(ficheros(listar(raiz, 'develop', 5)), ['test/b.test.ts', 'test/c.test.ts', 'test/core/x.test.ts']);
    const s = listar(raiz, 'develop', 1);
    assert.match(s.recorte ?? '', /2 ficheros por impacto pasan del tope de 1; se corren los 1 tests directos$/);
    assert.deepEqual(ficheros(s), ['test/c.test.ts', 'test/core/x.test.ts']);
    // Ni con tope 0 queda en cero lo que cambia: al menos el directo mas proximo.
    const cero = listar(raiz, 'develop', 0);
    assert.match(cero.recorte ?? '', /los 1 tests directos mas proximos de 1 \(0 se dejan fuera\)/);
    assert.deepEqual(ficheros(cero), ['test/c.test.ts', 'test/core/x.test.ts']);
  });
});

// TASK-139b: en review y finish (TASKCODE_VERIFICACION=selectiva) no hay recorte
// silencioso: todos los afectados, y la suite entera si no se sabe que afecta. El
// freno (tipo freno) y una ejecucion a mano mantienen el tope.
test('TASK-139b: con TASKCODE_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si', async () => {
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/src/a.ts`, 'export const a = 9;\n');
    await cambiarYCommitear(raiz, `${PLUGIN}/src/c.ts`, 'export const c = 9;\n');
    const todos = ['test/b.test.ts', 'test/c.test.ts', 'test/core/x.test.ts'];
    const sel = listar(raiz, 'develop', 1, 'selectiva');
    assert.equal(sel.sinTope, true);
    assert.equal(sel.recorte, undefined, 'sin recorte');
    assert.deepEqual(ficheros(sel), todos);
    for (const tipo of ['freno', undefined]) {
      const s = listar(raiz, 'develop', 1, tipo);
      assert.equal(s.sinTope, false, String(tipo));
      assert.match(s.recorte ?? '', /pasan del tope de 1/, String(tipo));
    }
  });
  await conRepo(async (raiz) => {
    await cambiarYCommitear(raiz, `${PLUGIN}/huerfano.yml`, 'clave: 9\n');
    assert.equal(listar(raiz, 'develop', undefined, 'selectiva').suiteEntera, true, 'sin saber que afecta: la suite entera');
    assert.equal(listar(raiz, 'develop', undefined, 'freno').suiteEntera, false);
  });
});

/** Escribe ficheros nuevos y los deja en la base (develop), para cambiar otro despues. */
async function enLaBase(raiz: string, ficherosNuevos: Record<string, string>): Promise<void> {
  for (const [rel, contenido] of Object.entries(ficherosNuevos)) await escribir(raiz, rel, contenido);
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'base ampliada'], raiz);
  git(['branch', '-f', 'develop'], raiz);
}

test('tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero', async () => {
  await conRepo(async (raiz) => {
    // gamma.ts lo importan cuatro tests: dos se llaman como el, uno vive en
    // test/commands (su carpeta) y otro no tiene nada que ver por nombre.
    const importa = "import { gamma } from '../src/commands/gamma.js';\nvoid gamma;\n";
    await enLaBase(raiz, {
      [`${PLUGIN}/src/commands/gamma.ts`]: 'export const gamma = 1;\n',
      [`${PLUGIN}/test/aaa.test.ts`]: importa,
      [`${PLUGIN}/test/gamma.test.ts`]: importa,
      [`${PLUGIN}/test/gamma-otro.test.ts`]: importa,
      [`${PLUGIN}/test/commands/zz.test.ts`]: importa.replace('../src', '../../src'),
    });
    await cambiarYCommitear(raiz, `${PLUGIN}/src/commands/gamma.ts`, 'export const gamma = 2;\n');
    const dos = listar(raiz, 'develop', 2);
    assert.deepEqual(ficheros(dos), ['test/gamma-otro.test.ts', 'test/gamma.test.ts']);
    assert.match(dos.recorte ?? '', /los 2 tests directos mas proximos de 4 \(2 se dejan fuera\)/);
    assert.deepEqual(ficheros(listar(raiz, 'develop', 3)), ['test/commands/zz.test.ts', 'test/gamma-otro.test.ts', 'test/gamma.test.ts']);
  });
  await conRepo(async (raiz) => {
    // scripts/gitflow: primero los de test/gitflow.
    const lanza = "const S = ['scripts', 'gitflow'];\nvoid S;\n";
    await enLaBase(raiz, { [`${PLUGIN}/test/gitflow/merge.test.ts`]: lanza, [`${PLUGIN}/test/aaa.test.ts`]: lanza });
    await cambiarYCommitear(raiz, `${PLUGIN}/scripts/gitflow/_comun.sh`, 'echo comun\n');
    assert.deepEqual(ficheros(listar(raiz, 'develop', 1)), ['test/gitflow/merge.test.ts']);
  });
  await conRepo(async (raiz) => {
    // package.json pide la suite entera: se corren los tests que lo nombran, y el motivo lo dice.
    await enLaBase(raiz, { [`${PLUGIN}/test/meta.test.ts`]: "const P = 'package.json';\nvoid P;\n" });
    await cambiarYCommitear(raiz, `${PLUGIN}/package.json`, '{"type":"module"}\n');
    const s = listar(raiz);
    assert.equal(s.todo, true);
    assert.deepEqual(ficheros(s), ['test/meta.test.ts']);
    assert.match(s.recorte ?? '', /package\.json, que afecta a toda la suite \(la completa queda para antes de publicar\); se corren los 1 tests directos/);
  });
});

test('una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa', async () => {
  await conRepo(async (raiz) => {
    // Un build que reescribe dist/src y, con MATAR=1, mata a verificar-impacto
    // (cuyo pid deja en el marcador de su copia) sin que corra su finally.
    const matar = [
      "const fs = require('fs'); const os = require('os'); const path = require('path');",
      "fs.writeFileSync('dist/src/x.js', 'cambiado');",
      "if (process.env.MATAR === '1') {",
      "  for (const d of fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('verificar-impacto-'))) {",
      "    const m = path.join(os.tmpdir(), d, 'marcador.json');",
      '    if (!fs.existsSync(m)) continue;',
      "    const j = JSON.parse(fs.readFileSync(m, 'utf8'));",
      '    if (path.resolve(j.dirPlugin).toLowerCase() === process.cwd().toLowerCase()) process.kill(j.pid);',
      '  }',
      '}',
    ].join('\n');
    await escribir(raiz, `${PLUGIN}/dist/src/x.js`, 'export const x = 1;\n');
    await escribir(raiz, `${PLUGIN}/matar.cjs`, matar);
    await escribir(raiz, `${PLUGIN}/package.json`, JSON.stringify({ type: 'module', scripts: { build: 'node matar.cjs' } }));
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'dist'], raiz);
    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
    const env = { ...process.env, RAMA_BASE: 'develop' };
    const cortada = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...env, MATAR: '1' } });
    assert.notEqual(cortada.status, 0, cortada.stdout + cortada.stderr);
    assert.notEqual(git(['status', '--porcelain'], raiz), '', 'el corte deja dist/src cambiado');
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /AVISO: una ejecucion anterior se corto a mitad/);
    assert.equal(git(['status', '--porcelain'], raiz), '');
  });
});

test('la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar', async () => {
  await conRepo(async (raiz) => {
    await escribir(raiz, `${PLUGIN}/dist/src/x.js`, 'export const x = 1;\n');
    // Un build que reescribe un fichero versionado de dist/src.
    const pkg = { type: 'module', scripts: { build: 'node -e "require(\'fs\').writeFileSync(\'dist/src/x.js\',\'cambiado\')"' } };
    await escribir(raiz, `${PLUGIN}/package.json`, JSON.stringify(pkg));
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'dist'], raiz);
    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(git(['status', '--porcelain'], raiz), '');
    assert.match(r.stdout, /Seleccion recortada/);
  });
});

// TASK-136: el cerrojo. La ruta del cerrojo sale de la raiz tal como la ve el
// script (git rev-parse), no de la del test: en Windows tmpdir() puede venir
// con nombres cortos (NULLCA~1) y el hash seria otro.
async function rutaCerrojo(raiz: string): Promise<string> {
  const { dirCopia } = (await import(pathToFileURL(SCRIPT).href)) as { dirCopia: (d: string) => string };
  const top = git(['rev-parse', '--show-toplevel'], raiz).trim();
  return `${dirCopia(path.join(top, ...PLUGIN.split('/')))}.cerrojo`;
}

/** Repo con dist/src versionado y un build que tarda `ms` y reescribe dist/src/x.js. */
async function conDistYBuildLento(raiz: string, ms: number): Promise<void> {
  await escribir(raiz, `${PLUGIN}/dist/src/x.js`, 'export const x = 1;\n');
  await escribir(
    raiz,
    `${PLUGIN}/lento.cjs`,
    `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${String(ms)});\n` +
      "require('fs').writeFileSync('dist/src/x.js', 'cambiado');\n"
  );
  await escribir(raiz, `${PLUGIN}/package.json`, JSON.stringify({ type: 'module', scripts: { build: 'node lento.cjs' } }));
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'dist'], raiz);
  await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
}

function lanzar(raiz: string, env: NodeJS.ProcessEnv): Promise<{ status: number | null; salida: string }> {
  return new Promise((resolve) => {
    const hijo = spawn(process.execPath, [SCRIPT], { cwd: raiz, env, windowsHide: true });
    let salida = '';
    hijo.stdout.on('data', (d: Buffer) => (salida += d.toString()));
    hijo.stderr.on('data', (d: Buffer) => (salida += d.toString()));
    hijo.on('close', (status) => resolve({ status, salida }));
  });
}

test('TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera', async () => {
  await conRepo(async (raiz) => {
    await conDistYBuildLento(raiz, 2500);
    const env = { ...process.env, RAMA_BASE: 'develop' };
    const primera = lanzar(raiz, env);
    await new Promise((r) => setTimeout(r, 800));
    const segunda = lanzar(raiz, env);
    const [a, b] = await Promise.all([primera, segunda]);
    assert.equal(a.status, 0, a.salida);
    assert.equal(b.status, 0, b.salida);
    assert.match(b.salida, /espero a la ejecucion \d+ que tiene el cerrojo/);
    assert.equal(git(['status', '--porcelain'], raiz), '', 'dist/src debe quedar como estaba');
    assert.ok(!existsSync(await rutaCerrojo(raiz)), 'el cerrojo se libera al acabar');
  });
});

test('TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio', async () => {
  await conRepo(async (raiz) => {
    await conDistYBuildLento(raiz, 0);
    const muerto = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' });
    const cerrojo = await rutaCerrojo(raiz);
    writeFileSync(cerrojo, JSON.stringify({ pid: Number(muerto.stdout), desde: new Date().toISOString() }));
    try {
      const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
      assert.equal(r.status, 0, r.stdout + r.stderr);
      assert.match(r.stdout, /cerrojo de una ejecucion que ya no existe/);
      assert.equal(git(['status', '--porcelain'], raiz), '');
      assert.ok(!existsSync(cerrojo));
    } finally {
      rmSync(cerrojo, { force: true });
    }
  });
});

// TASK-139a (B3): la rama del cerrojo ilegible (pid null) no tenia test: el de
// cerrojo muerto escribe JSON valido. `dormir` sustituido hace la prueba sin tiempos.
test('TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera', async () => {
  const { tomarCerrojo } = (await import(pathToFileURL(SCRIPT).href)) as {
    tomarCerrojo: (c: string, s: number, o?: { dormir?: (ms: number) => void }) => boolean;
  };
  const dir = mkdtempSync(path.join(tmpdir(), 'cerrojo-ilegible-'));
  const cerrojo = path.join(dir, 'x.cerrojo');
  try {
    // A medio escribir: en el reintento ya tiene el pid de un proceso vivo (este).
    writeFileSync(cerrojo, '{"pid": ');
    let dormidas = 0;
    const tomado = tomarCerrojo(cerrojo, 0, {
      dormir: () => {
        if (dormidas++ === 0) writeFileSync(cerrojo, JSON.stringify({ pid: process.pid, desde: 'x' }));
      },
    });
    assert.equal(tomado, false, 'un cerrojo que pasa a ser de un vivo no se roba');
    assert.equal(JSON.parse(readFileSync(cerrojo, 'utf8')).pid, process.pid, 'el cerrojo ajeno sigue ahi');
    // Ilegible de verdad (sigue roto tras el reintento): es de una ejecucion cortada y se toma.
    writeFileSync(cerrojo, 'basura');
    let reintentos = 0;
    assert.equal(tomarCerrojo(cerrojo, 0, { dormir: () => void reintentos++ }), true);
    assert.equal(reintentos, 1, 'un unico reintento antes de tomarlo');
    assert.equal(JSON.parse(readFileSync(cerrojo, 'utf8')).pid, process.pid, 'ahora es nuestro');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src', async () => {
  await conRepo(async (raiz) => {
    await conDistYBuildLento(raiz, 0);
    const cerrojo = await rutaCerrojo(raiz);
    writeFileSync(cerrojo, JSON.stringify({ pid: process.pid, desde: new Date().toISOString() }));
    try {
      const r = spawnSync(process.execPath, [SCRIPT], {
        cwd: raiz,
        encoding: 'utf8',
        env: { ...process.env, RAMA_BASE: 'develop', VERIFICAR_IMPACTO_ESPERA_S: '1' },
      });
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.ok((r.stdout + r.stderr).includes(String(process.pid)), 'nombra el pid que tiene el cerrojo');
      assert.ok((r.stdout + r.stderr).includes(cerrojo), 'dice donde esta el cerrojo');
      assert.equal(git(['status', '--porcelain'], raiz), '');
      assert.ok(existsSync(cerrojo), 'el cerrojo ajeno no se borra');
    } finally {
      rmSync(cerrojo, { force: true });
    }
  });
});

test('TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src', async () => {
  await conRepo(async (raiz) => {
    await escribir(raiz, `${PLUGIN}/dist/src/x.js`, 'export const x = 1;\n');
    // Un build que reescribe dist/src y borra la copia que verificar-impacto
    // tiene guardada (lo que hacia una segunda ejecucion antes del cerrojo).
    await escribir(
      raiz,
      `${PLUGIN}/pierde-copia.cjs`,
      "const fs = require('fs');\n" +
        "fs.writeFileSync('dist/src/x.js', 'cambiado');\n" +
        "fs.rmSync(require('path').join(process.env.COPIA_A_BORRAR, 'src'), { recursive: true, force: true });\n"
    );
    await escribir(raiz, `${PLUGIN}/package.json`, JSON.stringify({ type: 'module', scripts: { build: 'node pierde-copia.cjs' } }));
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'dist'], raiz);
    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
    const copia = (await rutaCerrojo(raiz)).replace(/[.]cerrojo$/, '');
    const r = spawnSync(process.execPath, [SCRIPT], {
      cwd: raiz,
      encoding: 'utf8',
      env: { ...process.env, RAMA_BASE: 'develop', COPIA_A_BORRAR: copia },
    });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /no encuentro la copia de dist[/]src/);
    const x = path.join(raiz, ...PLUGIN.split('/'), 'dist', 'src', 'x.js');
    assert.ok(existsSync(x), 'dist/src no se borra sin copia que devolver');
    assert.ok(!existsSync(copia), 'la carpeta de copia se limpia');
  });
});

test('TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea', async () => {
  await conRepo(async (raiz) => {
    await conDistYBuildLento(raiz, 0);
    const muerto = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' });
    const cerrojo = await rutaCerrojo(raiz);
    const robo = `${cerrojo}.robo`;
    writeFileSync(cerrojo, JSON.stringify({ pid: Number(muerto.stdout), desde: new Date().toISOString() }));
    // Un .robo recien creado: otra ejecucion esta retirando el cerrojo muerto.
    writeFileSync(robo, '1');
    try {
      const inicio = Date.now();
      const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
      const ms = Date.now() - inicio;
      assert.equal(r.status, 0, r.stdout + r.stderr);
      assert.ok(ms >= 9000, `respeta el .robo hasta que caduca (tardo ${String(ms)} ms)`);
      assert.match(r.stdout, /cerrojo de una ejecucion que ya no existe/);
      assert.equal(git(['status', '--porcelain'], raiz), '');
      assert.ok(!existsSync(cerrojo) && !existsSync(robo));
    } finally {
      rmSync(cerrojo, { force: true });
      rmSync(robo, { force: true });
    }
  });
});
