/**
 * TASK-114: los hooks PreToolUse salen pronto cuando no tienen nada que hacer.
 * El de lectura (held-out) sin `comando_heldout` declarado deja pasar antes de
 * lanzar git; el de merges, con un comando sin `git` ni script de cierre, no
 * llega a cargar el guardian. Repos Git temporales reales; los puntos de
 * entrada se lanzan como los lanza Claude Code, con un PATH sin git.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { decidirHeldout, declaraHeldout } from '../../src/hooks/guardia-heldout.js';
import { comandoCandidato, INVOCA_GIT_O_CIERRE } from '../../src/hooks/guardia-merge.js';
import { nombraHeldout, puedeIntegrar } from '../../src/hooks/prefiltro.js';
import { git } from '../helpers/finish-fixtures.js';

const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
const ENTRADA_LECTURA = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'pre-tool-lectura.js');
const ENTRADA_SHELL = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'pre-tool-merge.js');
const RAMA = 'feature/task-901-trabajo';
const HELDOUT = 'tareas/02-en-curso/TASK-901/aceptacion';

/** Repo en la rama de TASK-901 con su carpeta held-out y la config dada (null: sin config). */
async function conRepo(config: string | null, fn: (raiz: string) => Promise<void>): Promise<void> {
  const raiz = await mkdtemp(path.join(tmpdir(), 'salida-temprana-'));
  try {
    git(['init', '-q', '-b', 'main'], raiz);
    git(['config', 'user.email', 'test@example.com'], raiz);
    git(['config', 'user.name', 'Test'], raiz);
    await mkdir(path.join(raiz, HELDOUT), { recursive: true });
    await writeFile(path.join(raiz, HELDOUT, 'prueba.cjs'), '// held-out\n', 'utf8');
    if (config !== null) {
      await mkdir(path.join(raiz, '.taskcode'), { recursive: true });
      await writeFile(path.join(raiz, '.taskcode', 'config.yml'), config, 'utf8');
    }
    git(['add', '-A'], raiz);
    git(['commit', '-q', '-m', 'inicial'], raiz);
    git(['checkout', '-q', '-b', RAMA], raiz);
    await fn(raiz);
  } finally {
    await rm(raiz, { recursive: true, force: true });
  }
}

/** Lanza un punto de entrada con un PATH que no tiene git (una carpeta vacia). */
async function lanzarSinGit(entrada: string, cwd: string, tool_name: string, tool_input: Record<string, unknown>) {
  const vacia = await mkdtemp(path.join(tmpdir(), 'path-sin-git-'));
  try {
    const env: NodeJS.ProcessEnv = { ...process.env, PATH: vacia, Path: vacia };
    return spawnSync(process.execPath, [entrada], {
      input: JSON.stringify({ cwd, tool_name, tool_input, hook_event_name: 'PreToolUse' }),
      encoding: 'utf8',
      env,
    });
  } finally {
    await rm(vacia, { recursive: true, force: true });
  }
}

test('salida temprana (TASK-114, criterio 1): sin comando_heldout el guardian de held-out deja pasar en la rama de la tarea', async () => {
  for (const config of [null, 'limite_wip: 1\n']) {
    await conRepo(config, async (raiz) => {
      const ruta = path.join(raiz, HELDOUT, 'prueba.cjs');
      assert.equal(declaraHeldout(raiz), false);
      // En la rama de TASK-901 nombrando su carpeta: con la clave bloquearia (ver guardia-heldout.test.ts).
      assert.equal(decidirHeldout({ cwd: raiz, tool_name: 'Read', tool_input: { file_path: ruta } }).codigo, 0);
      const r = await lanzarSinGit(ENTRADA_LECTURA, raiz, 'Read', { file_path: ruta });
      assert.equal(r.status, 0, r.stderr);
      assert.equal(r.stderr, '');
    });
  }
});

test('salida temprana (TASK-114): con comando_heldout sigue bloqueando, y una config ilegible tambien protege', async () => {
  await conRepo('comando_heldout: node x.cjs\n', async (raiz) => {
    const ruta = path.join(raiz, HELDOUT, 'prueba.cjs');
    assert.equal(declaraHeldout(raiz), true);
    assert.equal(decidirHeldout({ cwd: raiz, tool_name: 'Read', tool_input: { file_path: ruta } }).codigo, 2);
  });
  await conRepo('limite_wip: [roto\n', async (raiz) => {
    assert.equal(declaraHeldout(raiz), true, 'un error de config no apaga el guardian');
    const ruta = path.join(raiz, HELDOUT, 'prueba.cjs');
    assert.equal(decidirHeldout({ cwd: raiz, tool_name: 'Read', tool_input: { file_path: ruta } }).codigo, 2);
  });
});

test('salida temprana (TASK-114, criterio 2): un comando sin git ni script de cierre no es candidato a merge', async () => {
  for (const cmd of ['grep -rn merge src', 'npm run commit-lint', 'echo "commit hecho"', 'cat merge.md', 'gitlab-merge x']) {
    assert.equal(comandoCandidato({ tool_input: { command: cmd } }), null, cmd);
  }
  for (const cmd of [
    'git merge feature/x',
    'cd repo && git commit -m x',
    'C:/Program Files/Git/bin/git.exe merge x',
    'git-merge x',
    'bash scripts/gitflow/merge-feature-to-develop.sh feature/x',
  ]) {
    assert.equal(comandoCandidato({ tool_input: { command: cmd } }), cmd, cmd);
    assert.ok(INVOCA_GIT_O_CIERRE.test(cmd), cmd);
  }
  await conRepo('comando_verificacion: npm test\n', async (raiz) => {
    for (const command of ['grep -rn merge src', 'npm run commit-lint']) {
      const r = await lanzarSinGit(ENTRADA_SHELL, raiz, 'Bash', { command });
      assert.equal(r.status, 0, `${command}: ${r.stderr}`);
      assert.equal(r.stderr, '');
    }
  });
});

test('salida temprana (TASK-114, MEN-1): el prefiltro del punto de entrada no carga el guardian sin git ni script', () => {
  for (const t of ['grep -rn merge src', 'npm run commit-lint', 'echo commit', 'ls']) {
    assert.equal(puedeIntegrar(t), false, t);
  }
  for (const t of ['git merge x', 'git commit -m x', 'bash merge-feature-to-develop.sh f', '& git.exe merge x']) {
    assert.equal(puedeIntegrar(t), true, t);
  }
  assert.equal(nombraHeldout('cat tareas/02-en-curso/TASK-1/ACEPTACION/x'), true);
  assert.equal(nombraHeldout('cat src/a.ts'), false);
});
