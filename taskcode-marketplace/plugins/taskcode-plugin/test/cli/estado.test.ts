/**
 * TASK-110: `taskctl estado` dentro del proceso, sin lanzar nada. El `.git`
 * de estos repos es un directorio vacio a proposito: `estado` no puede
 * necesitar git (los tests con git de verdad y como subproceso estan en
 * test/commands/estado.test.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { Writable } from 'node:stream';
import { leerEstado, mainEstado, directorioDeEntrada } from '../../src/commands/estado.js';
import { crearProgreso, rutaProgreso, ubicarGit } from '../../src/fs/progreso.js';
import { dejarProgreso } from '../helpers/progreso.js';

async function conDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'estado-'));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

async function repoFalso(dir: string, conTareas = true): Promise<void> {
  await mkdir(path.join(dir, '.git'), { recursive: true });
  if (conTareas) await mkdir(path.join(dir, 'tareas'), { recursive: true });
}

test('estado: sin progreso y con tareas dice que no hay nada en marcha; sin tareas o fuera de un repo, nada', async () => {
  await conDir(async (dir) => {
    const repo = path.join(dir, 'repo');
    await repoFalso(repo);
    assert.deepEqual(leerEstado(repo), { linea: 'Nada en marcha.', enMarcha: false });
    const sinTareas = path.join(dir, 'otro');
    await repoFalso(sinTareas, false);
    assert.deepEqual(leerEstado(sinTareas), { linea: '', enMarcha: false });
    await mkdir(path.join(sinTareas, '.taskcode'));
    assert.equal(leerEstado(sinTareas).linea, 'Nada en marcha.', '.taskcode/ tambien cuenta');
    // Fuera de un repo: el tmp del sistema no esta dentro de ninguno (si lo estuviera, se salta).
    if (ubicarGit(dir) === null) assert.deepEqual(leerEstado(dir), { linea: '', enMarcha: false });
  });
});

test('estado: lee el progreso desde un subdirectorio y muestra el x/N del contador', async () => {
  await conDir(async (repo) => {
    await repoFalso(repo);
    const ahora = Date.now();
    const contador = dejarProgreso(repo, { paso: 'verificacion', haceMs: 125_000, contador: true, ahoraMs: ahora });
    assert.ok(contador !== null);
    const sub = path.join(repo, 'src', 'a');
    await mkdir(sub, { recursive: true });
    assert.deepEqual(leerEstado(sub, ahora), {
      linea: 'TASK-110 · finish (5/5) · verificacion (2/6) · 2 min',
      enMarcha: true,
    });
    await writeFile(contador, '1/10\n\u001b[31m3/10\u001b[0m\n', 'utf8');
    assert.equal(leerEstado(sub, ahora).linea, 'TASK-110 · finish (5/5) · verificacion (2/6) 3/10 · 2 min');
    // Un contador enorme: solo se leen sus ultimos bytes.
    await writeFile(contador, `${'x'.repeat(200_000)}\n9/10\n`, 'utf8');
    assert.equal(leerEstado(sub, ahora).linea, 'TASK-110 · finish (5/5) · verificacion (2/6) 9/10 · 2 min');
  });
});

test('estado: el contador solo cuenta en el paso que lo pidio y mientras la fase sigue', async () => {
  await conDir(async (repo) => {
    await repoFalso(repo);
    const p = crearProgreso(repo);
    p.fase('TASK-110', 'finish', ['verificacion', 'merge']);
    p.paso('verificacion');
    const ruta = p.contador();
    assert.ok(ruta !== null);
    await writeFile(ruta, '4/4\n', 'utf8');
    assert.match(leerEstado(repo).linea, /verificacion \(1\/2\) 4\/4/);
    p.paso('merge');
    assert.match(leerEstado(repo).linea, /merge \(2\/2\) · \d+ min$/);
    p.terminar('ok');
    assert.match(leerEstado(repo).linea, /^Nada en marcha · ultima: TASK-110 · finish \(5\/5\) · terminada hace 0 min$/);
    assert.equal(leerEstado(repo).enMarcha, false);
  });
});

test('estado: un progreso ilegible es como no tenerlo', async () => {
  await conDir(async (repo) => {
    await repoFalso(repo);
    const ruta = rutaProgreso(repo) as string;
    await mkdir(path.dirname(ruta), { recursive: true });
    await writeFile(ruta, '{"version": 1, "tarea": "TASK-1"', 'utf8');
    assert.equal(leerEstado(repo).linea, 'Nada en marcha.');
  });
});

test('estado: en un worktree (".git" fichero con gitdir:) escritor y lector usan el mismo sitio', async () => {
  await conDir(async (dir) => {
    const principal = path.join(dir, 'principal');
    await repoFalso(principal);
    const wt = path.join(dir, 'wt');
    await mkdir(path.join(wt, 'tareas'), { recursive: true });
    const gitdir = path.join(principal, '.git', 'worktrees', 'wt');
    await mkdir(gitdir, { recursive: true });
    await writeFile(path.join(wt, '.git'), 'gitdir: ../principal/.git/worktrees/wt\n', 'utf8');
    assert.equal(rutaProgreso(wt), path.join(gitdir, 'taskcode', 'progreso.json'));
    dejarProgreso(wt, { paso: 'merge' });
    assert.match(leerEstado(path.join(wt, 'tareas')).linea, /^TASK-110 · finish \(5\/5\) · merge/);
    assert.equal(leerEstado(principal).linea, 'Nada en marcha.', 'el progreso del worktree no es el del principal');
  });
});

test('estado: menos de 200 ms dentro del proceso (minimo de 5)', async () => {
  await conDir(async (repo) => {
    await repoFalso(repo);
    dejarProgreso(repo, { paso: 'verificacion', contador: true });
    const tiempos: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      leerEstado(repo);
      tiempos.push(performance.now() - t0);
    }
    assert.ok(Math.min(...tiempos) < 200, `minimo ${Math.min(...tiempos).toFixed(1)} ms`);
  });
});

test('estado: mainEstado escribe la linea y sale con 0; un flag desconocido sale con 1', async () => {
  await conDir(async (repo) => {
    await repoFalso(repo);
    let texto = '';
    const salida = new Writable({
      write(chunk: Buffer, _enc, cb) {
        texto += chunk.toString();
        cb();
      },
    });
    assert.equal(await mainEstado([], { cwd: repo, salida }), 0);
    assert.equal(texto, 'Nada en marcha.\n');
    const sinTareas = path.join(repo, 'no-es-repo-con-tareas');
    await repoFalso(sinTareas, false);
    texto = '';
    assert.equal(await mainEstado([], { cwd: sinTareas, salida }), 0);
    assert.equal(texto, '', 'sin tareas no imprime nada, ni un salto de linea');
  });
});

test('estado: --stdin toma el directorio del JSON de la status line', async () => {
  await conDir(async (dir) => {
    assert.equal(directorioDeEntrada(JSON.stringify({ workspace: { current_dir: dir }, cwd: '/no/existe' })), dir);
    assert.equal(directorioDeEntrada(JSON.stringify({ cwd: dir })), dir);
    assert.equal(directorioDeEntrada(JSON.stringify({ cwd: path.join(dir, 'no-existe') })), null);
    assert.equal(directorioDeEntrada('no es json'), null);
  });
});
