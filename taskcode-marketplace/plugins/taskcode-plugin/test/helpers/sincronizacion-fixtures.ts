// Fixtures compartidas de los tests de sincronizacion (antes en test/commands/sincronizacion.test.ts,
// partido en varios ficheros para que el runner los reparta entre procesos).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeTareaFile } from '../../src/fs/task-store.js';
import { runApproveCommand } from '../../src/commands/approve.js';
import { runStartCommand } from '../../src/commands/start.js';
import { runReviewCommand } from '../../src/commands/review.js';
import { runFinishCommand } from '../../src/commands/finish.js';
import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
import { CODIGO_SINCRONIZACION_NO_APLICADA } from '../../src/fs/sincronizacion.js';
import type { Task } from '../../src/core/task.js';


export const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/commands -> raiz del paquete
export const PAQUETE = path.join(HERE, '..', '..', '..');
export const SCRIPTS_DIR = path.join(PAQUETE, 'scripts', 'gitflow');
export const BIN = path.join(PAQUETE, 'bin', 'taskctl');

export function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

export function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

export function porcelain(repoRoot: string): string {
  return git(['status', '--porcelain', '--untracked-files=all'], repoRoot).trim();
}

export function ficherosDeHead(repoRoot: string): string[] {
  return git(['show', '--name-only', '--format=', 'HEAD'], repoRoot)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
}

export function sampleTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-920',
    titulo: 'Tarea de prueba de la sincronizacion',
    tipo: 'feature',
    sprint: 1,
    etiquetas: ['cli'],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'en-diseno',
    plan_aprobado: false,
    rama: 'feature/task-920-sincronizacion',
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
    ...overrides,
  };
}

/**
 * Regenera docs/PLAN.md: una linea por tarea con su carpeta y si el
 * plan esta aprobado. Lee el estado de disco, como el script real.
 */
export const SCRIPT_SYNC = `import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const filas = [];
for (const c of ['00-planificadas', '01-en-diseno', '02-en-curso', '03-en-revision', '04-terminadas']) {
  const d = 'tareas/' + c;
  if (!existsSync(d)) continue;
  for (const id of readdirSync(d).filter((x) => x.startsWith('TASK-'))) {
    const md = readFileSync(d + '/' + id + '/tarea.md', 'utf8');
    filas.push(id + ' ' + c + (/plan_aprobado: true/.test(md) ? ' aprobado' : ''));
  }
}
mkdirSync('docs', { recursive: true });
writeFileSync('docs/PLAN.md', filas.sort().join('\\n') + '\\n');
`;

export const CONFIG_SYNC =
  'comando_sincronizacion: "node scripts/sync.mjs"\nrutas_sincronizacion: [docs/PLAN.md]\n';

/**
 * Repo con develop, el script de sincronizacion, la config que lo
 * activa (si `config` no es null) y una tarea en 01-en-diseno con su
 * plan. Todo commiteado, docs/PLAN.md incluido: arbol limpio al entrar.
 */
export async function withRepoSincronizado(
  config: string | null,
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-sync-'));
  try {
    git(['init', '-q', '-b', 'main'], repoRoot);
    git(['config', 'user.email', 'test@example.com'], repoRoot);
    git(['config', 'user.name', 'Test'], repoRoot);
    git(['config', 'core.autocrlf', 'false'], repoRoot);
    await writeFile(path.join(repoRoot, 'README.md'), 'repo\n', 'utf8');
    commitAll(repoRoot, 'inicial');
    git(['checkout', '-q', '-b', 'develop'], repoRoot);

    const tareasRoot = path.join(repoRoot, 'tareas');
    await writeTareaFile(tareasRoot, sampleTask(), '## Objetivo\nProbar la sincronizacion.\n');
    const planDir = path.join(tareasRoot, '01-en-diseno', 'TASK-920', 'planificacion');
    await mkdir(planDir, { recursive: true });
    // TASK-043: approve rechaza un plan que es solo una cabecera.
    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n\nEnfoque: sincronizar.\n', 'utf8');
    await mkdir(path.join(repoRoot, 'scripts'), { recursive: true });
    await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), SCRIPT_SYNC, 'utf8');
    if (config !== null) {
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
    }
    const r = spawnSync('node', ['scripts/sync.mjs'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    commitAll(repoRoot, 'docs: plan y sincronizacion');
    await fn(repoRoot, tareasRoot);
  } finally {
    // Un EBUSY aqui (un proceso huerfano con el cwd dentro) no puede
    // tapar la asercion que de verdad fallo: se reintenta y se traga.
    await rm(repoRoot, { recursive: true, force: true, maxRetries: 5 }).catch(() => undefined);
  }
}

export async function planEnDisco(repoRoot: string): Promise<string> {
  return (await readFile(path.join(repoRoot, 'docs', 'PLAN.md'), 'utf8')).trim();
}

// ─── Los tres desenlaces en que no se aplica ───────────────────────────────

/** Escribe un cambio en la tarea (lo que haria un comando) para que autoCommit tenga algo. */
export async function tocarTarea(tareasRoot: string): Promise<string> {
  const dir = path.join(tareasRoot, '01-en-diseno', 'TASK-920');
  await writeFile(path.join(dir, 'nota.md'), 'cambio de la transicion\n', 'utf8');
  return dir;
}

export async function reescribirScript(repoRoot: string, contenido: string): Promise<void> {
  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
  commitAll(repoRoot, 'chore: script nuevo');
}

/** Como reescribirScript pero sin commit, para no barrer el README sucio del test. */
export async function reescribirScriptSinCommitear(repoRoot: string, contenido: string): Promise<void> {
  await writeFile(path.join(repoRoot, 'scripts', 'sync.mjs'), contenido, 'utf8');
  git(['add', '--', 'scripts/sync.mjs'], repoRoot);
  git(['commit', '-q', '-m', 'chore: script nuevo', '--', 'scripts/sync.mjs'], repoRoot);
}
