/**
 * TASK-034: la peticion de `taskctl review` no embebe el diff de lo
 * generado (dist/), los lockfiles ni la carpeta de tareas; lo deja en un
 * `--stat` con la orden para pedirlo. Repos Git temporales reales y los
 * scripts de Git-Flow del repo; la evidencia se lee del fichero de
 * peticion que escribe el comando.
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
import { ConfigError, parsearConfig } from '../../src/core/config.js';
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
  id: 'TASK-930',
  titulo: 'Prueba de exclusion del diff de revision',
  tipo: 'feature',
  sprint: 2,
  etiquetas: ['cli'],
  complejidad: 'simple',
  modelo_sugerido: 'sonnet',
  estado: 'en-curso',
  plan_aprobado: true,
  rama: 'feature/task-930-exclusion',
  asignado_a: null,
  agente_revisor: 'general-purpose',
  skills_recomendados: [],
  regla_seleccion_skill: null,
  ultimo_commit_revisado: null,
  revision_codex: false,
  tokens_diseno: null,
  tokens_implementacion: null,
  tokens_revision: null,
  creado: '2026-10-03',
  actualizado: '2026-10-03',
  dependencias: [],
};

/**
 * Repo con develop y la rama de la tarea en-curso con `ficheros`
 * cambiados respecto a develop. Devuelve la peticion de la ronda 1 y
 * los nombres de fichero que dejo `review` en revision/.
 */
async function revisar(
  ficheros: Record<string, string>,
  config: string | null = null
): Promise<{ peticion: string; nombres: string[] }> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-excl-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    git(['config', 'core.autocrlf', 'false'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
    if (config !== null) {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
    }
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);
    git(['checkout', '-q', '-b', TASK.rama], repoRoot);
    const tareasRoot = path.join(repoRoot, 'tareas');
    await writeTareaFile(tareasRoot, TASK, '## Objetivo\nProbar.\n');
    for (const [rel, contenido] of Object.entries(ficheros)) {
      await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
      await writeFile(path.join(repoRoot, rel), contenido, 'utf8');
    }
    commitAll(repoRoot, 'feat(TASK-930): trabajo');

    await runReviewCommand(tareasRoot, ['TASK-930'], '2026-10-03', {
      repoCwd: repoRoot,
      scriptsDir: SCRIPTS_DIR,
    });
    const dir = path.join(tareasRoot, '03-en-revision', 'TASK-930', 'revision');
    const nombres = (await readdir(dir)).sort();
    const peticion = await readFile(path.join(dir, 'peticion-revision-1.md'), 'utf8');
    return { peticion, nombres };
  } finally {
    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

/** El bloque ```diff de la peticion (lo que el revisor lee entero). */
function bloqueDiff(peticion: string): string {
  const i = peticion.indexOf('diff\n', peticion.indexOf('## Diff'));
  const fin = peticion.indexOf('\n## Excluido del diff');
  return peticion.slice(i, fin === -1 ? undefined : fin);
}

test('review (TASK-034): dist/ y los lockfiles salen del diff embebido y quedan en el --stat con la orden para pedirlos', async () => {
  const { peticion } = await revisar({
    'src/b.ts': 'export const b = 1;\n',
    'dist/a.js': 'var compilado = 1;\n',
    'pkg/yarn.lock': 'lock: 1\n',
  });
  const diff = bloqueDiff(peticion);
  assert.match(diff, /diff --git a\/src\/b\.ts/);
  assert.doesNotMatch(diff, /dist\/a\.js/, 'el diff de dist/ no se tenia que embeber');
  assert.doesNotMatch(diff, /yarn\.lock/, 'un lockfile en una subcarpeta tambien se excluye');
  assert.doesNotMatch(diff, /diff --git a\/tareas\//, 'la carpeta de tareas no se embebe');
  assert.match(peticion, /## Excluido del diff \(\d+ fichero\(s\)\)/);
  assert.match(peticion, /dist\/a\.js\s+\|/, 'falta dist/a.js en el --stat');
  assert.match(peticion, /pkg\/yarn\.lock\s+\|/, 'falta el lockfile en el --stat');
  assert.match(peticion, /git diff develop\.\.HEAD -- ":\(glob\)\*\*\/dist\/\*\*"/);
});

test('review (TASK-034): la peticion nombra la carpeta de la tarea ya en su estado destino', async () => {
  const { peticion } = await revisar({ 'src/b.ts': 'export const b = 1;\n' });
  assert.match(peticion, /^- Carpeta de la tarea: tareas\/03-en-revision\/TASK-930 /m);
});

test('review (TASK-034): con excluir_de_revision: [] se embebe todo y no hay seccion de excluidos', async () => {
  const { peticion } = await revisar(
    { 'src/b.ts': 'export const b = 1;\n', 'dist/a.js': 'var compilado = 1;\n' },
    'excluir_de_revision: []\n'
  );
  assert.match(bloqueDiff(peticion), /diff --git a\/dist\/a\.js/);
  assert.doesNotMatch(peticion, /## Excluido del diff/);
});

test('review (TASK-034): un fichero excluido no activa un dominio ni fragmenta la revision', async () => {
  // dist/App.vue casaria con el revisor de Vue: si se clasificara, habria
  // una peticion aparte para ese dominio por un fichero que nadie lee.
  const { nombres } = await revisar({
    'src/b.ts': 'export const b = 1;\n',
    'dist/App.vue': '<template></template>\n',
  });
  assert.deepEqual(
    nombres.filter((n) => n.startsWith('peticion-')),
    ['peticion-revision-1.md'],
    `la revision se fragmento: ${nombres.join(', ')}`
  );
});

test('config (TASK-034): excluir_de_revision valida, ancla los patrones sin / y rechaza los que salen del repo', () => {
  const RUTA = '/repo/.taskcode/config.yml';
  assert.deepEqual(parsearConfig('limite_wip: 1\n', RUTA).excluir_de_revision, [
    '**/dist/**',
    '**/*.lock',
    '**/*-lock.*',
    'tareas/**',
  ]);
  assert.deepEqual(parsearConfig('excluir_de_revision: []\n', RUTA).excluir_de_revision, []);
  assert.deepEqual(
    parsearConfig('excluir_de_revision: [*.min.js, build\\**, *.min.js]\n', RUTA).excluir_de_revision,
    ['**/*.min.js', 'build/**']
  );
  for (const malo of ['[/etc/x]', '[C:/x]', '[../fuera/**]', '[""]', 'dist']) {
    assert.throws(
      () => parsearConfig(`excluir_de_revision: ${malo}\n`, RUTA),
      ConfigError,
      `deberia rechazar ${malo}`
    );
  }
});
