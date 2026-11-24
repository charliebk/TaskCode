/**
 * TASK-113: la peticion de `taskctl review` embebe el diff del codigo de
 * produccion y lista los ficheros de test con su `--stat` y su ruta, sin su
 * diff. Repos Git temporales reales y los scripts de Git-Flow del repo; la
 * evidencia se lee de los ficheros de peticion que escribe el comando.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile } from '../../src/fs/task-store.js';
import { runReviewCommand, MAX_RUTAS_ORDEN_TESTS } from '../../src/commands/review.js';
import { statDeFicheros, diffRangeForPaths, LOTE_RUTAS_STAT } from '../../src/fs/git.js';
import type { Task } from '../../src/core/task.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(HERE, '..', '..', '..', 'scripts', 'gitflow');

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
  return r.stdout;
}

function commitAll(repoRoot: string, msg: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', msg], repoRoot);
}

const TASK: Task = {
  id: 'TASK-931',
  titulo: 'Prueba de tests fuera del diff de revision',
  tipo: 'feature',
  sprint: 2,
  etiquetas: ['cli'],
  complejidad: 'simple',
  modelo_sugerido: 'sonnet',
  estado: 'en-curso',
  plan_aprobado: true,
  rama: 'feature/task-931-tests-stat',
  asignado_a: null,
  agente_revisor: 'general-purpose',
  skills_recomendados: [],
  regla_seleccion_skill: null,
  ultimo_commit_revisado: null,
  revision_codex: false,
  tokens_diseno: null,
  tokens_implementacion: null,
  tokens_revision: null,
  creado: '2026-11-12',
  actualizado: '2026-11-12',
  dependencias: [],
};

/**
 * Repo con develop y la rama de la tarea en-curso con `ficheros` cambiados
 * respecto a develop. Devuelve las peticiones de la ronda 1 y los diffs que
 * se pidan en `pedir` (se calculan antes de borrar el repo).
 */
async function revisar(
  ficheros: Record<string, string>,
  pedir: readonly (readonly string[])[] = []
): Promise<{ peticiones: Map<string, string>; diffs: string[] }> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-tstat-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    git(['config', 'core.autocrlf', 'false'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    git(['checkout', '-q', '-b', TASK.rama], repoRoot);
    const tareasRoot = path.join(repoRoot, 'tareas');
    await writeTareaFile(tareasRoot, TASK, '## Objetivo\nProbar.\n');
    for (const [rel, contenido] of Object.entries(ficheros)) {
      await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
      await writeFile(path.join(repoRoot, rel), contenido, 'utf8');
    }
    commitAll(repoRoot, 'feat(TASK-931): trabajo');
    const diffs = pedir.map((rutas) => git(['diff', 'develop..HEAD', '--', ...rutas], repoRoot));

    await runReviewCommand(tareasRoot, ['TASK-931'], '2026-11-12', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    const dir = path.join(tareasRoot, '03-en-revision', 'TASK-931', 'revision');
    const peticiones = new Map<string, string>();
    for (const n of (await readdir(dir)).filter((x) => x.startsWith('peticion-')).sort()) {
      peticiones.set(n, await readFile(path.join(dir, n), 'utf8'));
    }
    return { peticiones, diffs };
  } finally {
    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

/** El bloque ```diff de la peticion (hasta la primera seccion que le sigue). */
function bloqueDiff(peticion: string): string {
  const i = peticion.indexOf('diff\n', peticion.indexOf('## Diff'));
  const fin = peticion.indexOf('\n## ', i);
  return peticion.slice(i, fin === -1 ? undefined : fin);
}

/** Un test grande: muchas lineas con un marcador reconocible. */
function testGrande(marca: string, lineas = 400): string {
  return Array.from({ length: lineas }, (_, i) => `test('${marca} ${i}', () => assert.ok(${i} >= 0));`).join('\n') + '\n';
}

test('review (TASK-113): la peticion embebe el diff del codigo y lista los tests con su --stat y su ruta, sin su diff', async () => {
  const { peticiones } = await revisar({
    'src/a.ts': 'export const a = 1;\n',
    'test/a.test.ts': "test('MARCA-TEST-A', () => {});\n",
    'pkg/tests/b.ts': "test('MARCA-TEST-B', () => {});\n",
    'src/c.spec.js': "it('MARCA-TEST-C', () => {});\n",
  });
  assert.deepEqual([...peticiones.keys()], ['peticion-revision-1.md']);
  const peticion = peticiones.get('peticion-revision-1.md') as string;
  const diff = bloqueDiff(peticion);
  assert.match(diff, /diff --git a\/src\/a\.ts/);
  assert.doesNotMatch(peticion, /MARCA-TEST-/, 'el contenido de un test no se tenia que embeber');
  assert.match(peticion, /## Tests del diff \(3 fichero\(s\)\)/);
  for (const ruta of ['test/a.test.ts', 'pkg/tests/b.ts', 'src/c.spec.js']) {
    const escapada = ruta.replace(/[./]/g, (c) => `\\${c}`);
    assert.match(peticion, new RegExp(`${escapada}\\s+\\|\\s+1 \\+`), `falta ${ruta} en el --stat`);
    assert.match(peticion, new RegExp(`":\\(literal\\)${escapada}"`), `falta ${ruta} en la orden`);
  }
  assert.match(peticion, /git diff develop\.\.HEAD -- ":\(literal\)/);
});

test('review (TASK-113): con tres tests grandes la peticion pesa menos de la mitad que embebiendolos', async () => {
  const tests = ['test/uno.test.ts', 'test/dos.test.ts', 'test/tres.test.ts'];
  const { peticiones, diffs } = await revisar(
    {
      'src/a.ts': 'export const a = 1;\nexport const b = 2;\n',
      [tests[0] as string]: testGrande('uno'),
      [tests[1] as string]: testGrande('dos'),
      [tests[2] as string]: testGrande('tres'),
    },
    [tests]
  );
  const peticion = peticiones.get('peticion-revision-1.md') as string;
  const seccion = peticion.slice(peticion.indexOf('\n## Tests del diff'));
  // La version anterior embebia el diff de los tests en lugar de la seccion.
  const anterior = peticion.length - seccion.length + (diffs[0] as string).length;
  assert.ok(
    peticion.length * 2 < anterior,
    `la peticion pesa ${peticion.length} bytes; con los tests embebidos, ${anterior}`
  );
});

test('review (TASK-113): si solo cambian tests, el bloque del diff lo dice', async () => {
  const { peticiones } = await revisar({ 'test/a.test.ts': "test('x', () => {});\n" });
  const peticion = peticiones.get('peticion-revision-1.md') as string;
  assert.match(bloqueDiff(peticion), /\(solo cambian tests: ver "Tests del diff" mas abajo\)/);
  assert.match(peticion, /## Tests del diff \(1 fichero\(s\)\)/);
});

test('review (TASK-113): sin tests en el diff no hay seccion de tests', async () => {
  const { peticiones } = await revisar({ 'src/a.ts': 'export const a = 1;\n' });
  assert.doesNotMatch(peticiones.get('peticion-revision-1.md') as string, /## Tests del diff/);
});

test('review (TASK-113): en la peticion fragmentada cada dominio lista solo sus tests', async () => {
  const { peticiones } = await revisar({
    'src/a.ts': 'export const a = 1;\n',
    'test/a.test.ts': "test('MARCA-TS', () => {});\n",
    'src/lib.rs': 'pub fn f() {}\n',
    'tests/integracion.rs': '#[test] fn marca_rs() {}\n',
  });
  const rust = peticiones.get('peticion-revision-1-rust-wasm-reviewer.md');
  assert.ok(rust !== undefined, `no hubo peticion de Rust: ${[...peticiones.keys()].join(', ')}`);
  assert.match(bloqueDiff(rust), /diff --git a\/src\/lib\.rs/);
  assert.doesNotMatch(rust, /marca_rs|MARCA-TS/);
  assert.match(rust, /## Tests del diff \(1 fichero\(s\)\)/);
  assert.match(rust, /tests\/integracion\.rs\s+\|/);
  assert.doesNotMatch(rust, /test\/a\.test\.ts/);
  const otra = [...peticiones.entries()].find(([n]) => n !== 'peticion-revision-1-rust-wasm-reviewer.md');
  assert.ok(otra !== undefined);
  const [, generica] = otra;
  assert.match(bloqueDiff(generica), /diff --git a\/src\/a\.ts/);
  assert.match(generica, /test\/a\.test\.ts\s+\|/);
  assert.doesNotMatch(generica, /integracion\.rs|MARCA-TS/);
});

test('review (TASK-113, MEN-1): con mas de MAX_RUTAS_ORDEN_TESTS tests la orden pide por patrones y el --stat los lista todos', async () => {
  const ficheros: Record<string, string> = { 'src/a.ts': 'export const a = 1;\n' };
  // Fijo, no derivado de la constante: si el umbral subiera, el test lo veria.
  const n = 25;
  assert.ok(MAX_RUTAS_ORDEN_TESTS < n);
  for (let i = 0; i < n; i++) ficheros[`test/t${i}.test.ts`] = `test('${i}', () => {});\n`;
  const { peticiones } = await revisar(ficheros);
  const peticion = peticiones.get('peticion-revision-1.md') as string;
  assert.match(peticion, new RegExp(`## Tests del diff \\(${n} fichero\\(s\\)\\)`));
  assert.match(peticion, /git diff develop\.\.HEAD -- ":\(glob\)\*\*\/test\/\*\*"/);
  assert.match(peticion, /":\(exclude,glob\)tareas\/\*\*"/, 'la orden por patrones respeta excluir_de_revision');
  assert.doesNotMatch(peticion, /":\(literal\)test\//, 'con tantos tests no se nombran uno a uno');
  for (let i = 0; i < n; i++) assert.match(peticion, new RegExp(`test/t${i}\\.test\\.ts\\s+\\|`));
});

test('statDeFicheros (TASK-113, MEN-1): por lotes de LOTE_RUTAS_STAT rutas, sin perder ninguna', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-tstat-lote-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    const rutas: string[] = [];
    await mkdir(path.join(repoRoot, 'test'), { recursive: true });
    for (let i = 0; i < LOTE_RUTAS_STAT * 2 + 3; i++) {
      rutas.push(`test/f${i}.test.ts`);
      await writeFile(path.join(repoRoot, 'test', `f${i}.test.ts`), `x${i}\n`, 'utf8');
    }
    commitAll(repoRoot, 'tests');
    const stat = statDeFicheros('HEAD~1', 'HEAD', rutas, repoRoot);
    for (const r of rutas) assert.match(stat, new RegExp(`${r.replace(/\./g, '\\.')}\\s+\\|`));
    assert.equal((stat.match(/files? changed/g) ?? []).length, 3, 'tres lotes, tres resumenes');
    assert.equal(statDeFicheros('HEAD~1', 'HEAD', [], repoRoot), '');
  } finally {
    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
});

/** TASK-135: ruta larga de un volcado (unos 90 caracteres), como las del proyecto donde fallo. */
function rutaDeVolcado(i: number): string {
  return `src/volcado/modulo_de_datos_exportados/subcarpeta_profunda/fichero_generado_numero_${i}.ts`;
}

/** Repo con un commit `inicial` y otro con `rutas` anadidas; `fn` recibe la raiz. */
async function conRepoDeRutas(rutas: readonly string[], fn: (repoRoot: string) => void): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-diff-lote-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    git(['config', 'core.autocrlf', 'false'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    for (const [i, r] of rutas.entries()) {
      await mkdir(path.dirname(path.join(repoRoot, r)), { recursive: true });
      await writeFile(path.join(repoRoot, r), `export const v${i} = ${i};\n`, 'utf8');
    }
    commitAll(repoRoot, 'rutas');
    fn(repoRoot);
  } finally {
    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

test('diffRangeForPaths (TASK-135): 1300 rutas largas por lotes, sin ENAMETOOLONG y sin perder ninguna', async () => {
  const rutas = Array.from({ length: 1300 }, (_, i) => rutaDeVolcado(i)).sort();
  // Sin lotes, este pathspec pasa con mucho del limite de Windows (32 767).
  assert.ok(rutas.reduce((n, r) => n + r.length + 11, 0) > 100_000);
  await conRepoDeRutas(rutas, (repoRoot) => {
    const diff = diffRangeForPaths('HEAD~1', 'HEAD', rutas, repoRoot);
    assert.equal((diff.match(/^diff --git /gm) ?? []).length, rutas.length);
    for (const r of [rutas[0], rutas[rutas.length - 1]] as string[]) assert.ok(diff.includes(`diff --git a/${r} b/${r}`));
  });
});

test('diffRangeForPaths (TASK-135): el diff por lotes es identico al de una sola llamada; lista vacia, vacio', async () => {
  const rutas = Array.from({ length: LOTE_RUTAS_STAT * 2 + 3 }, (_, i) => `src/m${String(i).padStart(3, '0')}.ts`);
  await conRepoDeRutas(rutas, (repoRoot) => {
    const deUna = git(['-c', 'core.quotePath=false', 'diff', 'HEAD~1..HEAD', '--', ...rutas], repoRoot).trim();
    assert.equal(diffRangeForPaths('HEAD~1', 'HEAD', rutas, repoRoot), deUna);
    assert.equal(diffRangeForPaths('HEAD~1', 'HEAD', [], repoRoot), '');
  });
});

// TASK-139a (B5): no duplica al de 1300 rutas. Aquel prueba diffRangeForPaths;
// este, que review la usa para el diff de un grupo fragmentado (si llamara a Git
// con todas las rutas de una vez, en Windows ENAMETOOLONG). Baja de 1100 a 500
// ficheros: basta con pasar del limite de la linea de comandos de Windows.
test('review (TASK-135): peticion fragmentada con un grupo que pasa del limite de la linea de comandos embebe el diff de todos', async () => {
  const ficheros: Record<string, string> = { 'src/lib.rs': 'pub fn f() {}\n' };
  const n = 500;
  for (let i = 0; i < n; i++) ficheros[rutaDeVolcado(i)] = `export const v${i} = ${i};\n`;
  assert.ok(Object.keys(ficheros).reduce((t, r) => t + r.length + 11, 0) > 32_767, 'el pathspec pasa del limite de Windows');
  const { peticiones } = await revisar(ficheros);
  assert.ok(peticiones.has('peticion-revision-1-rust-wasm-reviewer.md'), `no se fragmento: ${[...peticiones.keys()].join(', ')}`);
  const generica = [...peticiones.entries()].find(([k]) => k !== 'peticion-revision-1-rust-wasm-reviewer.md');
  assert.ok(generica !== undefined);
  const bloque = bloqueDiff(generica[1]);
  assert.equal((bloque.match(/^diff --git /gm) ?? []).length, n);
  for (const i of [0, n - 1]) assert.ok(bloque.includes(`diff --git a/${rutaDeVolcado(i)} `), `falta el diff de ${rutaDeVolcado(i)}`);
});
