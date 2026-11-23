/**
 * TASK-149a (FS-05 a FS-08, FS-17 de la auditoria 4D): un solo envoltorio de
 * git sin lanzar, una rama actual, un --git-path y un parser de la entrada de
 * los hooks; y los hooks ligeros no cargan el grafo del freno. Contra repos Git
 * reales.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gitOk, ramaActual, rutaGit } from '../../src/fs/git-crudo.js';
import { parsearEntradaHook } from '../../src/hooks/entrada-pretooluse.js';

function git(args: string[], cwd: string): void {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}

async function repo(): Promise<string> {
  const raiz = realpathSync(await mkdtemp(path.join(tmpdir(), 'taskctl-git-crudo-')));
  git(['init', '-q', '-b', 'feature/task-901-x'], raiz);
  git(['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'inicio'], raiz);
  return raiz;
}

test('ramaActual: la rama; con HEAD desacoplado, null; durante un rebase, la que se rebasa; fuera de un repo, null', async () => {
  const raiz = await repo();
  const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-git-crudo-fuera-'));
  try {
    assert.equal(ramaActual(raiz), 'feature/task-901-x');
    git(['checkout', '-q', '--detach'], raiz);
    assert.equal(ramaActual(raiz), null, 'desacoplado sin rebase');
    const dirRebase = rutaGit(raiz, 'rebase-merge') as string;
    await mkdir(dirRebase, { recursive: true });
    await writeFile(path.join(dirRebase, 'head-name'), 'refs/heads/feature/task-901-x\n', 'utf8');
    assert.equal(ramaActual(raiz), 'feature/task-901-x', 'durante el rebase');
    assert.equal(ramaActual(fuera), null);
  } finally {
    await rm(raiz, { recursive: true, force: true });
    await rm(fuera, { recursive: true, force: true });
  }
});

test('rutaGit: absoluta bajo el directorio de Git (aunque cwd sea un subdirectorio); fuera de un repo, null; gitOk', async () => {
  const raiz = await repo();
  const fuera = await mkdtemp(path.join(tmpdir(), 'taskctl-git-crudo-fuera-'));
  try {
    const sub = path.join(raiz, 'a', 'b');
    await mkdir(sub, { recursive: true });
    assert.equal(rutaGit(sub, 'taskcode/puertas.log'), path.join(raiz, '.git', 'taskcode', 'puertas.log'));
    assert.equal(rutaGit(fuera, 'taskcode/puertas.log'), null);
    assert.equal(gitOk(['rev-parse', 'HEAD'], raiz), true);
    assert.equal(gitOk(['rev-parse', 'HEAD'], fuera), false);
  } finally {
    await rm(raiz, { recursive: true, force: true });
    await rm(fuera, { recursive: true, force: true });
  }
});

test('parsearEntradaHook: objeto tal cual; JSON roto, vacio, array o escalar, sin campos', () => {
  assert.deepEqual(parsearEntradaHook<{ cwd?: unknown }>('{"cwd":"/x","otro":1}'), { cwd: '/x', otro: 1 });
  for (const t of ['', '{roto', '[1,2]', '"cadena"', 'null', '7']) assert.deepEqual(parsearEntradaHook(t), {}, t);
});

test('los hooks de coste y de merges no cargan el modulo del freno (ni directa ni indirectamente)', async () => {
  const dirSrc = path.join(import.meta.dirname, '..', '..', 'src');
  const visitados = new Set<string>();
  async function grafo(fichero: string): Promise<void> {
    if (visitados.has(fichero)) return;
    visitados.add(fichero);
    const texto = await readFile(fichero, 'utf8');
    for (const m of texto.matchAll(/^(?:import|export)[^;]*?from '(\.{1,2}\/[^']+)'/gm)) {
      await grafo(path.resolve(path.dirname(fichero), m[1] as string));
    }
  }
  for (const hook of ['registro-coste.js', 'coste-turno.js', 'guardia-merge.js', 'pre-tool-merge.js']) {
    visitados.clear();
    await grafo(path.join(dirSrc, 'hooks', hook));
    const freno = [...visitados].filter((f) => path.basename(f) === 'freno-stop.js');
    assert.deepEqual(freno, [], `${hook} carga el freno`);
  }
});
