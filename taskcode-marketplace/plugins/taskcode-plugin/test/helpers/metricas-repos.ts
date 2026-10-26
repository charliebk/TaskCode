/**
 * TASK-065: repos Git temporales reales para las metricas agregadas
 * (`--repo`, `--evolucion`, `--grupos`, `--json`). Las tareas se escriben
 * con el serializador del propio plugin (`serializeTareaFile`) en la carpeta
 * de su estado, con su tabla `## Transiciones`, sus criterios, sus informes
 * y peticiones de revision, y se commitean: lo que `metricas` lee es un repo
 * de verdad, no un doble.
 */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { STATE_FOLDER, type Task, type TaskComplexity, type TaskState, type TaskType } from '../../src/core/task.js';
import { TASKCTL } from './automatico-fixtures.js';

export interface RondaFixture {
  /** Linea `- Veredicto:` del informe. */
  veredicto: string;
  /** Filas de hallazgos (ID y severidad); null = informe en prosa, sin tabla. */
  hallazgos: { id: string; sev: string }[] | null;
  /** Bytes de la peticion de revision de la ronda; sin el, no hay peticion. */
  bytesPeticion?: number;
}

export interface TareaFixture {
  id: string;
  tipo?: TaskType;
  complejidad?: TaskComplexity | null;
  estado?: TaskState;
  criterios?: number;
  /** Instante (o dia) del `plan`; null = sin fila de plan. */
  plan?: string | null;
  /** Instante (o dia) del `finish`; null = sin cierre. */
  finish?: string | null;
  rondas?: RondaFixture[];
  tokensRevision?: number | null;
}

function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
  return r.stdout;
}

function tarea(t: TareaFixture): Task {
  return {
    id: t.id,
    titulo: `Tarea ${t.id}`,
    tipo: t.tipo ?? 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: t.complejidad === undefined ? 'simple' : t.complejidad,
    modelo_sugerido: 'sonnet',
    estado: t.estado ?? 'terminada',
    plan_aprobado: true,
    rama: `feature/${t.id.toLowerCase()}`,
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: t.tokensRevision ?? null,
    creado: '2026-10-01',
    actualizado: '2026-10-01',
    dependencias: [],
  } as unknown as Task;
}

function cuerpo(t: TareaFixture): string {
  const criterios = Array.from({ length: t.criterios ?? 2 }, (_, i) => `- [ ] Criterio ${String(i + 1)}`);
  const filas: string[] = [];
  const plan = t.plan === undefined ? '2026-10-01T10:00:00Z' : t.plan;
  if (plan !== null) filas.push(`| ${plan} | plan | manual | persona |`);
  const fin = t.finish === undefined ? null : t.finish;
  if (fin !== null) filas.push(`| ${fin} | finish | manual | persona |`);
  return [
    '## Objetivo',
    '',
    'Medir.',
    '',
    '## Criterios de aceptacion',
    ...criterios,
    '',
    '## Transiciones',
    '',
    '| fecha | fase | modo | decidido_por |',
    '|---|---|---|---|',
    ...filas,
    '',
  ].join('\n');
}

function informe(r: RondaFixture): string {
  const tabla =
    r.hallazgos === null
      ? 'Sin tabla: todo en prosa.\n'
      : '## Hallazgos\n\n| ID | Severidad | Estado | Fichero |\n|---|---|---|---|\n' +
        r.hallazgos.map((h) => `| ${h.id} | ${h.sev} | corregido | a.ts |`).join('\n') +
        '\n';
  return `# Informe\n\n- Veredicto: ${r.veredicto}\n\n${tabla}`;
}

/** Escribe las tareas en `repo` (repo git ya creado) y lo commitea todo. */
export async function escribirTareas(repo: string, tareas: readonly TareaFixture[]): Promise<void> {
  for (const t of tareas) {
    const dir = path.join(repo, 'tareas', STATE_FOLDER[t.estado ?? 'terminada'], t.id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(tarea(t), cuerpo(t)), 'utf8');
    const rondas = t.rondas ?? [];
    if (rondas.length > 0) await mkdir(path.join(dir, 'revision'), { recursive: true });
    for (const [i, r] of rondas.entries()) {
      const n = String(i + 1);
      await writeFile(path.join(dir, 'revision', `informe-revision-${n}.md`), informe(r), 'utf8');
      if (r.bytesPeticion !== undefined) {
        await writeFile(path.join(dir, 'revision', `peticion-revision-${n}.md`), 'x'.repeat(r.bytesPeticion), 'utf8');
      }
    }
  }
  git(['add', '-A'], repo);
  git(['commit', '-q', '--allow-empty', '-m', 'test: tareas'], repo);
}

/**
 * Un directorio temporal en el que cada `crear(nombre, ruta?)` monta un repo
 * git con `tareas/` en `<tmp>/<ruta>/<nombre>` (el nombre es el proyecto).
 * Todo se borra al terminar.
 */
export async function conRepos(
  fn: (crear: (nombre: string, sub?: string) => Promise<string>, base: string) => Promise<void>
): Promise<void> {
  const base = await mkdtemp(path.join(tmpdir(), 'taskctl-metricas-repos-'));
  try {
    await fn(async (nombre, sub = '') => {
      const repo = path.join(base, sub, nombre);
      await mkdir(path.join(repo, 'tareas'), { recursive: true });
      git(['init', '-q', '-b', 'develop'], repo);
      git(['config', 'user.email', 'test@example.com'], repo);
      git(['config', 'user.name', 'Test'], repo);
      git(['commit', '-q', '--allow-empty', '-m', 'inicial'], repo);
      return repo;
    }, base);
  } finally {
    await rm(base, { recursive: true, force: true });
  }
}

export function metricas(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [TASKCTL, 'metricas', ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

export function estado(repo: string): string {
  return git(['status', '--porcelain', '--untracked-files=all'], repo);
}
