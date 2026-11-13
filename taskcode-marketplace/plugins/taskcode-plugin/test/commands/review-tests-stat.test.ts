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
import { runReviewCommand } from '../../src/commands/review.js';
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
