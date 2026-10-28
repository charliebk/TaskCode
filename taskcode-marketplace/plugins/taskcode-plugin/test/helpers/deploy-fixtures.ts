/**
 * Piezas comunes de los tests de doctor-deploy de TASK-067 (repos Git
 * temporales reales, nunca mocks). Las herramientas externas de auditoria se
 * controlan con un PATH vacio, como en test/commands/doctor-deploy.test.ts.
 */
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runDoctorDeployCommand, runDoctorDeployCompleto, type DoctorDeployResult } from '../../src/commands/doctor-deploy.js';
import type { InformeDeploy, ResultadoPunto } from '../../src/core/doctor-deploy.js';

export const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
export const STRIPE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';

export function git(args: string[], cwd: string): string {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
  return r.stdout.trim();
}

export async function escribir(raiz: string, archivos: Record<string, string>): Promise<void> {
  for (const [rel, contenido] of Object.entries(archivos)) {
    const abs = path.join(raiz, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, contenido, 'utf8');
  }
}

export async function commit(raiz: string, mensaje: string): Promise<string> {
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', mensaje], raiz);
  return git(['rev-parse', 'HEAD'], raiz);
}

export const NODE: Record<string, string> = {
  'package.json': '{"name":"app","version":"1.0.0","dependencies":{}}\n',
  'package-lock.json': '{"name":"app","lockfileVersion":3}\n',
  '.gitignore': 'node_modules/\n.env\n',
  'index.js': 'console.log("hola");\n',
};

export interface OpcionesTest {
  pathHerramientas: string;
  [k: string]: unknown;
}

/** Repo Git temporal con los ficheros dados, un commit, y un PATH de herramientas vacio. */
export async function conRepo(
  archivos: Record<string, string>,
  fn: (raiz: string, opciones: OpcionesTest) => Promise<void>
): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-'));
  const vacio = await mkdtemp(path.join(tmpdir(), 'taskctl-dd-path-'));
  try {
    git(['init', '-q', '-b', 'main'], raiz);
    git(['config', 'user.email', 'test@example.com'], raiz);
    git(['config', 'user.name', 'Test'], raiz);
    await escribir(raiz, archivos);
    await commit(raiz, 'inicial');
    await fn(raiz, { pathHerramientas: vacio });
  } finally {
    await rm(raiz, { recursive: true, force: true });
    await rm(vacio, { recursive: true, force: true });
  }
}

/** Como `conRepo`, pero en la rama `develop` (la base de las tareas creadas con --crear-tareas). */
export async function conRepoDevelop(
  archivos: Record<string, string>,
  fn: (raiz: string, opciones: OpcionesTest) => Promise<void>
): Promise<void> {
  await conRepo(archivos, async (raiz, opciones) => {
    git(['checkout', '-q', '-b', 'develop'], raiz);
    await fn(raiz, opciones);
  });
}

export function ejecutar(raiz: string, opciones: OpcionesTest, args: string[] = ['--json'], ahora?: Date): DoctorDeployResult {
  return runDoctorDeployCommand(args, {
    repoCwd: raiz,
    opciones,
    ...(ahora === undefined ? {} : { ahora: () => ahora }),
  });
}

/** El comando entero (con --crear-tareas). */
export function ejecutarCompleto(raiz: string, opciones: OpcionesTest, args: string[], ahora?: Date): Promise<DoctorDeployResult> {
  return runDoctorDeployCompleto(args, {
    repoCwd: raiz,
    opciones,
    ...(ahora === undefined ? {} : { ahora: () => ahora }),
  });
}

export function analisis(raiz: string, opciones: OpcionesTest): InformeDeploy {
  return JSON.parse(ejecutar(raiz, opciones).salida) as InformeDeploy;
}

export function punto(informe: InformeDeploy, id: string): ResultadoPunto {
  const p = informe.puntos.find((x) => x.id === id);
  assert.ok(p !== undefined, `no hay punto ${id}`);
  return p;
}
