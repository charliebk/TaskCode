// Fixtures compartidas de los tests de automatico (antes en test/commands/automatico.test.ts,
// partido en varios ficheros para que el runner los reparta entre procesos).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { plantillaRepo, type ConRepo } from '../helpers/repo-plantilla.js';
import { readTareaFile } from '../../src/fs/task-store.js';
import { leerTransiciones } from '../../src/core/transiciones.js';


export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PLUGIN_ROOT = path.resolve(HERE, '..', '..', '..');
export const TASKCTL = path.join(PLUGIN_ROOT, 'bin', 'taskctl');
export const ID = 'TASK-001';
export const CONFIG_AUTO = 'modo_flujo: automatico\n';

export function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')} fallo: ${result.stderr}`);
  return result.stdout;
}

export function commitAll(repoRoot: string, message: string): void {
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', message], repoRoot);
}

export function cli(cwd: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [TASKCTL, ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

export function cliOk(cwd: string, args: string[]) {
  const r = cli(cwd, args);
  assert.equal(r.status, 0, `taskctl ${args.join(' ')} fallo: ${r.stderr}${r.stdout}`);
  return r;
}

export function siguiente(cwd: string, id = ID): Record<string, unknown> {
  return JSON.parse(cliOk(cwd, ['siguiente', id, '--json']).stdout) as Record<string, unknown>;
}

export function resumen(s: Record<string, unknown>): [unknown, unknown] {
  return [s.fase, s.accion];
}

// Repo base montado una vez por fichero (y por config) y copiado en cada
// test (test/helpers/repo-plantilla.ts). La receta es la de siempre.
export const plantillasPorConfig = new Map<string, ConRepo>();

export function withRepo(
  config: string,
  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
): Promise<void> {
  let conRepo = plantillasPorConfig.get(config);
  if (conRepo === undefined) {
    conRepo = plantillaRepo('taskctl-auto-', async (repoRoot) => {
      git(['init', '-q', '-b', 'main'], repoRoot);
      git(['config', 'user.email', 'test@example.com'], repoRoot);
      git(['config', 'user.name', 'Test'], repoRoot);
      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), config, 'utf8');
      await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
      commitAll(repoRoot, 'inicial');
      git(['checkout', '-q', '-b', 'develop'], repoRoot);
    });
    plantillasPorConfig.set(config, conRepo);
  }
  return conRepo(fn);
}

/** `taskctl new` por CLI; devuelve el ID creado (TASK-001 en un repo vacio). */
export function nueva(repoRoot: string, tipo: string, titulo: string): void {
  cliOk(repoRoot, [
    'new',
    '--titulo', titulo,
    '--tipo', tipo,
    '--complejidad', 'simple',
    '--objetivo', 'Probar el modo automatico.',
    '--criterio', 'La tarea queda en 04-terminadas',
  ]);
  // `new` deja la tarea en el working tree; el flujo la commitea antes de seguir.
  if (git(['status', '--porcelain'], repoRoot).trim() !== '') commitAll(repoRoot, `docs: ${titulo}`);
}

/** plan por CLI y plan-final.md redactado y commiteado. */
export async function planificar(repoRoot: string, tareasRoot: string, id = ID): Promise<void> {
  cliOk(repoRoot, ['plan', id]);
  await writeFile(
    path.join(tareasRoot, '01-en-diseno', id, 'planificacion', 'plan-final.md'),
    '# Plan\n\n## Enfoque propuesto\n\nCambiar app.txt.\n',
    'utf8'
  );
  commitAll(repoRoot, `docs(${id}): plan final`);
}

export async function codigo(repoRoot: string, contenido: string, mensaje: string): Promise<void> {
  await writeFile(path.join(repoRoot, 'app.txt'), contenido, 'utf8');
  commitAll(repoRoot, mensaje);
}

export function dirRevision(tareasRoot: string, id = ID): string {
  return path.join(tareasRoot, '03-en-revision', id, 'revision');
}

/** Tarea feature de TASK-001 planificada, aprobada, empezada y con un commit de codigo. */
export async function hastaCodigo(repoRoot: string, tareasRoot: string, tipo = 'feature'): Promise<void> {
  nueva(repoRoot, tipo, 'Flujo automatico');
  await planificar(repoRoot, tareasRoot);
  cliOk(repoRoot, ['approve', ID, '--decidido-por', 'automatico']);
  cliOk(repoRoot, ['start', ID]);
  await codigo(repoRoot, 'cambiado\n', `feat(${ID}): trabajo`);
}

/**
 * Lo que hace el revisor: rellena la cabecera y la tabla de hallazgos del
 * informe (sin tocar la linea de veredicto) y lo commitea SOLO.
 */
export async function rellenarInforme(repoRoot: string, informe: string): Promise<void> {
  const texto = await readFile(informe, 'utf8');
  const relleno = texto
    .replace(/^- Revisor: \(rellenar.*$/m, '- Revisor: revisor independiente de prueba')
    .replace(/^\| \(ej\. IMP-1\).*$/m, '| MEN-1 | MENOR | aceptado | app.txt |');
  assert.notEqual(relleno, texto, 'el informe tenia la plantilla');
  await writeFile(informe, relleno, 'utf8');
  commitAll(repoRoot, `docs(${ID}): informe de revision`);
}

/** Sustituye la linea de veredicto del informe 1 sin commitear (a mano, como un agente). */
export async function escribirVeredicto(informe: string, valor: string): Promise<void> {
  const texto = await readFile(informe, 'utf8');
  const nuevo = texto.replace(/^- Veredicto:.*$/m, `- Veredicto: ${valor}`);
  assert.notEqual(nuevo, texto, 'el informe debe tener la linea de veredicto');
  await writeFile(informe, nuevo, 'utf8');
}
