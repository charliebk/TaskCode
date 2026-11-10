// Fixtures de los tests del ROADMAP (TASK-098): repos Git temporales reales.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from './repo-plantilla.js';
import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
import { STATE_FOLDER, type Task } from '../../src/core/task.js';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/helpers -> raiz del paquete
export const PAQUETE = path.join(HERE, '..', '..', '..');
export const SCRIPTS_DIR = path.join(PAQUETE, 'scripts', 'gitflow');
export const FIXTURES_ROADMAP = path.join(PAQUETE, 'test', 'fixtures', 'roadmap');

export function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
  return r.stdout;
}

export function commitAll(repoRoot: string, mensaje: string): void {
  git(['add', '-A'], repoRoot);
  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
  git(['commit', '-q', '-m', mensaje], repoRoot);
}

export function ficherosDeHead(repoRoot: string): string[] {
  return git(['show', '--name-only', '--format=', 'HEAD'], repoRoot)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '');
}

export function porcelain(repoRoot: string): string {
  return git(['status', '--porcelain', '--untracked-files=all'], repoRoot).trim();
}

/** Bytes exactos de un fichero (Buffer), para comparar sin normalizar nada. */
export function bytes(ruta: string): Buffer {
  return readFileSync(ruta);
}

export function rutaRoadmap(repoRoot: string): string {
  return path.join(repoRoot, 'tareas', 'ROADMAP.md');
}

export function tarea(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-930',
    titulo: 'Tarea de prueba del roadmap',
    tipo: 'feature',
    sprint: 1,
    etiquetas: ['cli'],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-930-roadmap',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: '2026-11-10',
    actualizado: '2026-11-10',
    dependencias: [],
    ...overrides,
  };
}

/** Cuerpo que `plan` acepta (TASK-043: objetivo y al menos un criterio). */
export const CUERPO_PLANIFICABLE =
  '## Objetivo\nProbar el roadmap.\n\n## Criterios de aceptacion\n- [ ] Se regenera.\n';

/** Repo con main y develop, sin tareas ni ROADMAP. core.autocrlf=false: los bytes son los bytes. */
export const withRepo: ConRepo = plantillaRepo('taskctl-roadmap-', async (repoRoot) => {
  git(['init', '-q', '-b', 'main'], repoRoot);
  git(['config', 'user.email', 'test@example.com'], repoRoot);
  git(['config', 'user.name', 'Test'], repoRoot);
  git(['config', 'core.autocrlf', 'false'], repoRoot);
  await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
  await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'inicial'], repoRoot);
  git(['checkout', '-q', '-b', 'develop'], repoRoot);
});

/** Copia un ROADMAP de fixtures (byte a byte) a tareas/ROADMAP.md y lo commitea. */
export async function ponerRoadmap(repoRoot: string, contenido: Buffer | string): Promise<void> {
  await mkdir(path.join(repoRoot, 'tareas'), { recursive: true });
  await writeFile(rutaRoadmap(repoRoot), contenido);
  commitAll(repoRoot, 'docs: roadmap del proyecto');
}

/**
 * Lo que dejarian review y el revisor en la rama de la tarea: la tarea en
 * 03-en-revision con su informe aprobado, todo commiteado.
 */
export async function aRevision(repoRoot: string, tareasRoot: string, id: string): Promise<void> {
  const { task, body } = (await readTareaFile(tareasRoot, id))!;
  for (const carpeta of Object.values(STATE_FOLDER)) {
    await rm(path.join(tareasRoot, carpeta, id), { recursive: true, force: true });
  }
  await writeTareaFile(tareasRoot, { ...task, estado: 'en-revision', plan_aprobado: true }, body);
  const dir = path.join(tareasRoot, '03-en-revision', id, 'revision');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'informe-revision-1.md'), `# Informe ${id}\n\n- Veredicto: aprobada\n`, 'utf8');
  await writeFile(path.join(repoRoot, `trabajo-${id}.txt`), `trabajo de ${id}\n`, 'utf8');
  commitAll(repoRoot, `feat(${id}): trabajo revisado`);
}
