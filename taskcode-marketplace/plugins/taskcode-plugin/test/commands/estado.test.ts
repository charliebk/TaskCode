/**
 * TASK-110: `taskctl estado` como lo lanza la status line: subproceso de
 * `bin/taskctl`, en repos Git de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TASKCTL, PLUGIN_ROOT, git } from '../helpers/automatico-fixtures.js';
import { dejarProgreso } from '../helpers/progreso.js';
import { ubicarGit } from '../../src/fs/progreso.js';

function estado(cwd: string, env: NodeJS.ProcessEnv = process.env, args: string[] = []) {
  const r = spawnSync(process.execPath, [TASKCTL, 'estado', ...args], { cwd, encoding: 'utf8', env });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

async function conRepo(fn: (raiz: string, fuera: string) => Promise<void>): Promise<void> {
  const fuera = await mkdtemp(path.join(tmpdir(), 'estado-cmd-'));
  const raiz = path.join(fuera, 'repo');
  await mkdir(path.join(raiz, 'tareas', '02-en-curso'), { recursive: true });
  await mkdir(path.join(raiz, '.taskcode'), { recursive: true });
  await writeFile(path.join(raiz, '.taskcode', 'config.yml'), 'limite_wip: 1\n', 'utf8');
  await writeFile(path.join(raiz, 'tareas', '02-en-curso', '.gitkeep'), '', 'utf8');
  git(['init', '-q', '-b', 'main'], raiz);
  git(['config', 'user.email', 'test@example.com'], raiz);
  git(['config', 'user.name', 'Test'], raiz);
  git(['add', '-A'], raiz);
  git(['commit', '-q', '-m', 'inicial'], raiz);
  try {
    await fn(raiz, fuera);
  } finally {
    await rm(fuera, { recursive: true, force: true, maxRetries: 5 });
  }
}

test('estado: sin tarea en curso dice que no hay nada en marcha y sale con 0', async () => {
  await conRepo(async (raiz) => {
    const r = estado(raiz);
    assert.deepEqual(r, { status: 0, stdout: 'Nada en marcha.\n', stderr: '' });
  });
});

test('estado: lee solo el fichero de progreso, sin git: sin PATH y sin tareas/ ni .taskcode/ dice lo mismo', async () => {
  await conRepo(async (raiz) => {
    dejarProgreso(raiz, { paso: 'verificacion', haceMs: 125_000 });
    const antes = estado(raiz);
    assert.equal(antes.status, 0, antes.stderr);
    assert.match(antes.stdout, /^TASK-110 · finish \(5\/5\) · verificacion \(2\/6\) · 2 min\n$/);
    await rm(path.join(raiz, 'tareas'), { recursive: true, force: true });
    await rm(path.join(raiz, '.taskcode'), { recursive: true, force: true });
    // Sin PATH no hay git que lanzar: si `estado` lo necesitara, fallaria o diria otra cosa.
    const sinGit = estado(path.join(raiz), { SYSTEMROOT: process.env['SYSTEMROOT'] ?? '', PATH: '' });
    assert.equal(sinGit.status, 0, sinGit.stderr);
    assert.equal(sinGit.stderr, '');
    assert.equal(sinGit.stdout, antes.stdout);
  });
});

test('estado: fuera de un repo con tareas no imprime nada y sale con 0', async () => {
  const fuera = await mkdtemp(path.join(tmpdir(), 'estado-fuera-'));
  try {
    const repoSinTareas = path.join(fuera, 'ajeno');
    await mkdir(repoSinTareas);
    git(['init', '-q'], repoSinTareas);
    assert.deepEqual(estado(repoSinTareas), { status: 0, stdout: '', stderr: '' });
    if (ubicarGit(fuera) === null) assert.deepEqual(estado(fuera), { status: 0, stdout: '', stderr: '' });
  } finally {
    await rm(fuera, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('estado: un flag desconocido o repetido aborta con 1', async () => {
  await conRepo(async (raiz) => {
    const r = estado(raiz, process.env, ['--json']);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /taskctl estado/);
    const suelto = estado(raiz, process.env, ['algo']);
    assert.equal(suelto.status, 1);
    assert.match(suelto.stderr, /Uso: taskctl estado \[--seguir\] \[--stdin\]\./, 'el uso menciona --stdin');
    const rep = estado(raiz, process.env, ['--stdin', '--stdin']);
    assert.equal(rep.status, 1);
    assert.match(rep.stderr, /"--stdin" esta repetido/);
    const seguir = estado(raiz, process.env, ['--seguir', '--seguir']);
    assert.equal(seguir.status, 1);
    assert.match(seguir.stderr, /"--seguir" esta repetido/);
  });
});

test('estado: --stdin usa el directorio del JSON de la status line y no se cuelga con stdin abierto', async () => {
  await conRepo(async (raiz, fuera) => {
    dejarProgreso(raiz, { paso: 'merge' });
    const json = JSON.stringify({ workspace: { current_dir: raiz } });
    const r = spawnSync(process.execPath, [TASKCTL, 'estado', '--stdin'], { cwd: fuera, input: json, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^TASK-110 · finish \(5\/5\) · merge \(5\/6\)/);
  });
});

test('estado: en un worktree enlazado de verdad, el progreso es el suyo', async () => {
  await conRepo(async (raiz, fuera) => {
    const wt = path.join(fuera, 'wt');
    git(['worktree', 'add', '-q', '-b', 'otra', wt], raiz);
    dejarProgreso(wt, { tarea: 'TASK-200', paso: 'merge' });
    const enWt = estado(path.join(wt, 'tareas'));
    assert.match(enWt.stdout, /^TASK-200 · finish/);
    assert.equal(estado(raiz).stdout, 'Nada en marcha.\n');
    // El mismo sitio que daria git: --git-path es por worktree.
    const gitPath = path.resolve(wt, git(['rev-parse', '--git-path', 'taskcode/progreso.json'], wt).trim());
    assert.doesNotThrow(() => readFileSync(gitPath, 'utf8'));
  });
});

test('estado: la via rapida no carga el grafo de comandos ni nada que lance git', () => {
  // Las importaciones de los modulos compilados que carga `taskctl estado`.
  const dist = path.join(PLUGIN_ROOT, 'dist', 'src');
  const visto = new Set<string>();
  const pendientes = [path.join(dist, 'commands', 'estado.js')];
  while (pendientes.length > 0) {
    const f = pendientes.pop() as string;
    if (visto.has(f)) continue;
    visto.add(f);
    for (const m of readFileSync(f, 'utf8').matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
      const spec = m[1] as string;
      if (spec.startsWith('.')) pendientes.push(path.resolve(path.dirname(f), spec));
      else assert.match(spec, /^node:/, `${path.relative(dist, f)} importa ${spec}`);
    }
  }
  const relativos = [...visto].map((f) => path.relative(dist, f).split(path.sep).join('/')).sort();
  assert.deepEqual(relativos, ['cli/args.js', 'commands/estado.js', 'core/progreso.js', 'core/sugerencia.js', 'fs/progreso.js']);
  const bin = readFileSync(TASKCTL, 'utf8');
  assert.match(bin, /argv\[0\] === 'estado'[\s\S]*commands\/estado\.js/);
});
