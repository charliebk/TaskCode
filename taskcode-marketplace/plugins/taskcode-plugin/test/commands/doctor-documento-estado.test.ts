/**
 * TASK-124: la comprobacion `documento-estado` de `taskctl doctor` contra repos
 * Git temporales de verdad. Los commits se fechan con GIT_COMMITTER_DATE y
 * GIT_AUTHOR_DATE, y "hoy" se inyecta con `deps.ahora`, asi que el resultado no
 * depende del dia en que se corra. La logica (dias, borde de 14, mensajes) se
 * prueba sin Git en test/core/documento-estado.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runDoctorCommand } from '../../src/commands/doctor.js';
import type { Comprobacion } from '../../src/core/doctor.js';
import { serializeTareaFile } from '../../src/core/tarea-file.js';
import { STATE_FOLDER } from '../../src/core/task.js';
import { git, sampleTask } from '../helpers/finish-fixtures.js';
import { plantillaRepo } from '../helpers/repo-plantilla.js';

const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
const SIN_CONFIG_CLAUDE = path.join(tmpdir(), 'taskctl-doctor-sin-config-claude-no-existe');
/** "Hoy" de todos los tests: 2026-11-12 a mediodia, hora local. */
const AHORA = new Date(2026, 10, 12, 12, 0, 0);
const DOC = 'docs/ESTADO.md';

const conRepo = plantillaRepo('taskctl-doctor-estado-', async (repoRoot) => {
  git(['init', '-q', '-b', 'main'], repoRoot);
  git(['config', 'user.email', 'test@example.com'], repoRoot);
  git(['config', 'user.name', 'Test'], repoRoot);
  for (const c of Object.values(STATE_FOLDER)) {
    await mkdir(path.join(repoRoot, 'tareas', c), { recursive: true });
    await writeFile(path.join(repoRoot, 'tareas', c, '.gitkeep'), '', 'utf8');
  }
  await writeFile(path.join(repoRoot, 'README.md'), '# proyecto\n', 'utf8');
  git(['add', '-A'], repoRoot);
  git(['commit', '-q', '-m', 'inicial'], repoRoot);
  git(['checkout', '-q', '-b', 'develop'], repoRoot);
});

/** Commit de todo lo pendiente con fecha local `fecha` (AAAA-MM-DDTHH:MM:SS, sin zona: Git la toma como local). */
function commitFechado(repoRoot: string, mensaje: string, fecha: string): void {
  git(['add', '-A'], repoRoot);
  const r = spawnSync('git', ['commit', '-q', '-m', mensaje], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, GIT_COMMITTER_DATE: fecha, GIT_AUTHOR_DATE: fecha },
  });
  assert.equal(r.status, 0, `git commit fallo: ${r.stderr}`);
}

async function escribir(repoRoot: string, rel: string, texto: string): Promise<void> {
  await mkdir(path.dirname(path.join(repoRoot, rel)), { recursive: true });
  await writeFile(path.join(repoRoot, rel), texto, 'utf8');
}

async function conDocumento(repoRoot: string, fecha: string): Promise<void> {
  await escribir(repoRoot, '.taskcode/config.yml', `documento_estado: ${DOC}\n`);
  await escribir(repoRoot, DOC, '# Estado\n');
  commitFechado(repoRoot, 'docs: estado', fecha);
}

async function terminada(repoRoot: string, id: string, actualizado: string): Promise<void> {
  const task = sampleTask({ id, estado: 'terminada', rama: `feature/${id.toLowerCase()}-x`, actualizado });
  await escribir(repoRoot, `tareas/${STATE_FOLDER.terminada}/${id}/tarea.md`, serializeTareaFile(task, '## Objetivo\nx\n'));
}

function documentoEstado(repoRoot: string): Comprobacion {
  const r = runDoctorCommand([], { repoCwd: repoRoot, configClaudeDir: SIN_CONFIG_CLAUDE, ahora: AHORA });
  const c = r.comprobaciones.find((x) => x.id === 'documento-estado');
  assert.ok(c, `no hay documento-estado; hay: ${r.comprobaciones.map((x) => x.id).join(', ')}`);
  assert.equal(r.comprobaciones.filter((x) => x.id === 'documento-estado').length, 1);
  return c;
}

test('documento-estado: sin la clave, omitida (no se presupone ningun documento)', async () => {
  await conRepo(async (repoRoot) => {
    await escribir(repoRoot, DOC, '# Estado\n');
    commitFechado(repoRoot, 'docs: estado', '2026-09-01T12:00:00');
    const c = documentoEstado(repoRoot);
    assert.equal(c.nivel, 'omitida', c.mensaje);
    assert.equal(c.arreglo, null);
  });
});

test('documento-estado: ruta declarada que no existe, aviso con arreglo', async () => {
  await conRepo(async (repoRoot) => {
    await escribir(repoRoot, '.taskcode/config.yml', 'documento_estado: docs/NO-EXISTE.md\n');
    commitFechado(repoRoot, 'config', '2026-11-12T10:00:00');
    const c = documentoEstado(repoRoot);
    assert.equal(c.nivel, 'aviso', c.mensaje);
    assert.match(c.mensaje, /docs\/NO-EXISTE\.md, declarado en documento_estado, no existe/);
    assert.match(c.arreglo ?? '', /Crea docs\/NO-EXISTE\.md/);
  });
});

test('documento-estado: existe pero sin commits, aviso', async () => {
  await conRepo(async (repoRoot) => {
    await escribir(repoRoot, '.taskcode/config.yml', `documento_estado: ${DOC}\n`);
    commitFechado(repoRoot, 'config', '2026-11-12T10:00:00');
    await escribir(repoRoot, DOC, '# Estado sin commitear\n');
    const c = documentoEstado(repoRoot);
    assert.equal(c.nivel, 'aviso', c.mensaje);
    assert.match(c.mensaje, /no tiene ningun commit/);
  });
});

test('documento-estado: ultimo commit de hace 20 dias, aviso aunque el mtime sea de hoy', async () => {
  await conRepo(async (repoRoot) => {
    await conDocumento(repoRoot, '2026-10-23T12:00:00');
    // Se reescribe con el mismo contenido: mtime de hoy, ningun commit nuevo.
    await escribir(repoRoot, DOC, '# Estado\n');
    const c = documentoEstado(repoRoot);
    assert.equal(c.nivel, 'aviso', c.mensaje);
    assert.match(c.mensaje, /lleva 20 dias sin actualizarse \(ultimo commit: 2026-10-23; se toleran 14\)/);
    assert.match(c.arreglo ?? '', /Repasa docs\/ESTADO\.md con lo cerrado desde 2026-10-23/);
  });
});

test('documento-estado: al dia (commit de hace 14 dias, ninguna tarea despues), ok con la fecha', async () => {
  await conRepo(async (repoRoot) => {
    await terminada(repoRoot, 'TASK-001', '2026-10-29');
    await conDocumento(repoRoot, '2026-10-29T12:00:00');
    // Un commit posterior que no toca el documento no cambia su fecha.
    await escribir(repoRoot, 'otro.txt', 'x\n');
    commitFechado(repoRoot, 'otro', '2026-11-11T12:00:00');
    const c = documentoEstado(repoRoot);
    assert.equal(c.nivel, 'ok', c.mensaje);
    assert.equal(c.mensaje, 'docs/ESTADO.md al dia: ultimo commit 2026-10-29 (hace 14 dias) y ninguna tarea terminada despues');
  });
});

test('documento-estado: tareas terminadas despues del ultimo commit, aviso con cuantas y la mas reciente', async () => {
  await conRepo(async (repoRoot) => {
    await conDocumento(repoRoot, '2026-11-09T12:00:00');
    await terminada(repoRoot, 'TASK-002', '2026-11-10');
    await terminada(repoRoot, 'TASK-003', '2026-11-11');
    commitFechado(repoRoot, 'tareas', '2026-11-11T12:00:00');
    const c = documentoEstado(repoRoot);
    assert.equal(c.nivel, 'aviso', c.mensaje);
    assert.match(c.mensaje, /va por detras de 2 tareas terminadas despues de su ultimo commit \(2026-11-09\); la mas reciente, TASK-003 \(2026-11-11\)/);
  });
});

test('documento-estado: sale en --json como las demas (CLI real)', async () => {
  await conRepo(async (repoRoot) => {
    await conDocumento(repoRoot, '2026-10-01T12:00:00');
    const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_CONFIG_DIR: SIN_CONFIG_CLAUDE },
    });
    const salida = JSON.parse(r.stdout) as { comprobaciones: Comprobacion[] };
    const c = salida.comprobaciones.find((x) => x.id === 'documento-estado');
    assert.ok(c, r.stdout);
    // Con el reloj real el commit de 2026-10-01 tiene mas de 14 dias.
    assert.equal(c.nivel, 'aviso', c.mensaje);
    assert.match(c.mensaje, /ultimo commit: 2026-10-01/);
    assert.equal(typeof c.arreglo, 'string');
  });
});
