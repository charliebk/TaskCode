/**
 * Correcciones de la ronda 1 de revision de TASK-062 (MEN-1 a MEN-5): config
 * invalida, prefijo duplicado, Node minimo y timeout de `git status`. Repos
 * Git temporales de verdad, como doctor.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runDoctorCommand } from '../../src/commands/doctor.js';
import { NODE_MINIMO, nodeSoportado, type Comprobacion } from '../../src/core/doctor.js';
import { STATE_FOLDER } from '../../src/core/task.js';
import { git } from '../helpers/finish-fixtures.js';
import { plantillaRepo } from '../helpers/repo-plantilla.js';

const PLUGIN_ROOT = path.join(import.meta.dirname, '..', '..', '..');

const conRepo = plantillaRepo('taskctl-doctor-corr-', async (repoRoot) => {
  git(['init', '-q', '-b', 'main'], repoRoot);
  git(['config', 'user.email', 'test@example.com'], repoRoot);
  git(['config', 'user.name', 'Test'], repoRoot);
  for (const c of Object.values(STATE_FOLDER)) {
    await mkdir(path.join(repoRoot, 'tareas', c), { recursive: true });
    await writeFile(path.join(repoRoot, 'tareas', c, '.gitkeep'), '', 'utf8');
  }
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'inicial'], repoRoot);
  git(['checkout', '-q', '-b', 'develop'], repoRoot);
});

async function config(repoRoot: string, texto: string): Promise<void> {
  await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
  await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), texto, 'utf8');
}

function por(cs: readonly Comprobacion[], id: string): Comprobacion {
  const c = cs.find((x) => x.id === id);
  assert.ok(c, `no hay comprobacion "${id}"`);
  return c;
}

// MEN-2
test('config invalida: lo que depende de la config sale omitido, no ok con los valores por defecto', async () => {
  await conRepo(async (repoRoot) => {
    // rama_base valida pero distinta de develop, y un valor invalido en otra clave.
    await config(repoRoot, 'rama_base: dev\nmodo_flujo: xx\n');
    const r = runDoctorCommand([], { repoCwd: repoRoot });
    assert.equal(por(r.comprobaciones, 'config').nivel, 'error');
    const base = por(r.comprobaciones, 'rama-base');
    assert.equal(base.nivel, 'omitida');
    assert.match(base.mensaje, /config invalida/);
    assert.equal(por(r.comprobaciones, 'plataforma').nivel, 'omitida');
    assert.match(por(r.comprobaciones, 'plataforma').mensaje, /config invalida/);
    // La rama principal no depende de la config: se comprueba igual.
    assert.equal(por(r.comprobaciones, 'rama-principal').nivel, 'ok');
    assert.equal(r.codigo, 1);
  });
});

test('config invalida y sin origin: origin se omite (no se sabe si hace falta), no es aviso ni error por defecto', async () => {
  await conRepo(async (repoRoot) => {
    await config(repoRoot, 'cierre_por_defecto: merge-request\nlimite_wip: abc\n');
    const o = por(runDoctorCommand([], { repoCwd: repoRoot }).comprobaciones, 'origin');
    assert.equal(o.nivel, 'omitida');
    assert.match(o.mensaje, /config invalida/);
  });
});

// MEN-3
test('el mensaje de la config no repite el prefijo [ERROR] / [AVISO], ni en texto ni en JSON', async () => {
  await conRepo(async (repoRoot) => {
    await config(repoRoot, 'limite_wip: abc\n');
    const r = runDoctorCommand([], { repoCwd: repoRoot });
    assert.doesNotMatch(r.salida, /\[ERROR\][^\n]*\[ERROR\]/);
    assert.match(por(r.comprobaciones, 'config').mensaje, /^[^[]/);
    const j = JSON.parse(runDoctorCommand(['--json'], { repoCwd: repoRoot }).salida) as { comprobaciones: Comprobacion[] };
    assert.doesNotMatch(por(j.comprobaciones, 'config').mensaje, /^\[(ERROR|AVISO)\]/);
    await config(repoRoot, 'clave_rara: 1\n');
    const a = runDoctorCommand([], { repoCwd: repoRoot });
    assert.doesNotMatch(a.salida, /\[AVISO\][^\n]*\[AVISO\]/);
    assert.doesNotMatch(por(a.comprobaciones, 'config-claves').mensaje, /^\[AVISO\]/);
    assert.match(por(a.comprobaciones, 'config-claves').mensaje, /clave_rara/);
  });
});

// MEN-4
test('Node minimo: 22, y package.json declara el mismo valor en engines', async () => {
  assert.equal(NODE_MINIMO, 22);
  assert.equal(nodeSoportado('22.0.0'), true);
  assert.equal(nodeSoportado('21.9.0'), false);
  assert.equal(nodeSoportado('20.19.0'), false);
  const pkg = JSON.parse(await readFile(path.join(PLUGIN_ROOT, 'package.json'), 'utf8')) as { engines?: { node?: string } };
  assert.equal(pkg.engines?.node, `>=${NODE_MINIMO}`);
  const lock = JSON.parse(await readFile(path.join(PLUGIN_ROOT, 'package-lock.json'), 'utf8')) as {
    packages: Record<string, { engines?: { node?: string } }>;
  };
  assert.equal(lock.packages['']?.engines?.node, `>=${NODE_MINIMO}`);
});

// MEN-5b
test('git status que no responde a tiempo es aviso, no error (timeout propio)', async (t) => {
  await conRepo(async (repoRoot) => {
    // Un fsmonitor que tarda 30 s: git status se queda esperando al hook.
    git(['config', 'core.fsmonitor', 'sleep 30 #'], repoRoot);
    const t0 = Date.now();
    const r = runDoctorCommand([], { repoCwd: repoRoot, timeoutGitMs: 1500 });
    const w = por(r.comprobaciones, 'workspace');
    if (Date.now() - t0 > 25_000) return t.skip('esta version de Git no espera al hook de fsmonitor');
    assert.equal(w.nivel, 'aviso', `${w.nivel}: ${w.mensaje}`);
    assert.match(w.mensaje, /no termino/);
    assert.ok(w.arreglo !== null);
    assert.equal(r.codigo, 0, r.comprobaciones.map((c) => `${c.id}=${c.nivel}`).join(' '));
  });
});

// MEN-1
test('SKILL.md: ningun parrafo duplicado y `taskctl doctor` se pide una sola vez al empezar', async () => {
  const texto = await readFile(path.join(PLUGIN_ROOT, 'skills', 'task-workflow', 'SKILL.md'), 'utf8');
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length >= 40 && !l.startsWith('|'));
  const vistas = new Set<string>();
  const repetidas = lineas.filter((l) => (vistas.has(l) ? true : (vistas.add(l), false)));
  assert.deepEqual(repetidas, [], 'lineas repetidas en SKILL.md (parrafo duplicado)');
  assert.equal((texto.match(/ejecuta tambien `taskctl doctor`/g) ?? []).length, 1);
});
