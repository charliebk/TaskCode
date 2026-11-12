/**
 * Tests de scripts/perfil-tests.mjs (TASK-122): el listado por fichero de
 * duracion y procesos git. Se lanza por ruta sobre un "plugin" minimo con
 * tres ficheros de test ya compilados: uno que lanza git desde node, otro que
 * lo lanza desde bash (como los scripts de Git-Flow) y otro que no lo lanza.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, '..', '..', '..', '..', '..', '..', 'scripts', 'perfil-tests.mjs');

/**
 * El bash de los scripts de Git-Flow. En Windows el primer `bash` del PATH
 * puede ser el de WSL (System32, desde PowerShell o un hook), que no ve el
 * git de Windows: se usa el de Git for Windows, junto al git real.
 */
function bashDeGit(): string {
  if (process.platform !== 'win32') return 'bash';
  const exec = spawnSync('git', ['--exec-path'], { encoding: 'utf8' }).stdout.trim();
  const raiz = path.resolve(exec, '..', '..', '..');
  // usr/bin primero: bin/bash.exe es un lanzador que antepone su propio git al PATH.
  const candidato = [path.join(raiz, 'usr', 'bin', 'bash.exe'), path.join(raiz, 'bin', 'bash.exe')].find((p) => existsSync(p));
  assert.ok(candidato, `no encuentro el bash de Git for Windows junto a ${exec}`);
  return candidato;
}
const ENV = { ...process.env, BASH_PRUEBA: bashDeGit() };

const CON_GIT = `import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
test('git dos veces', () => {
  for (let i = 0; i < 2; i++) {
    const r = spawnSync('git', ['--version'], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error('git no arranco');
  }
});
`;
const CON_BASH = `import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
test('git desde bash', () => {
  const r = spawnSync(process.env.BASH_PRUEBA || 'bash', ['-c', 'git --version'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('bash o git no arrancaron: ' + r.stderr);
});
`;
const SIN_GIT = `import { test } from 'node:test';
test('uno', () => {});
test('dos', () => {});
`;

interface Fila {
  fichero: string;
  tests: number;
  git: number;
  fallos: number;
  segundos: number;
}

test('cuenta por fichero los tests y los procesos git (desde node y desde bash), y la duracion', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'perfil-tests-'));
  try {
    await mkdir(path.join(dir, 'dist', 'test', 'sub'), { recursive: true });
    await writeFile(path.join(dir, 'package.json'), '{"type":"module"}\n');
    await writeFile(path.join(dir, 'dist', 'test', 'con-git.test.js'), CON_GIT);
    await writeFile(path.join(dir, 'dist', 'test', 'sub', 'con-bash.test.js'), CON_BASH);
    await writeFile(path.join(dir, 'dist', 'test', 'sin-git.test.js'), SIN_GIT);
    const r = spawnSync(process.execPath, [SCRIPT, '--dir', dir, '--sin-build', '--json', '--concurrencia', '2'], { encoding: 'utf8', env: ENV });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const filas = (JSON.parse(r.stdout) as { filas: Fila[] }).filas;
    assert.deepEqual(
      filas.map((f) => [f.fichero, f.tests, f.git, f.fallos]),
      [
        ['test/con-git.test.ts', 1, 2, 0],
        ['test/sin-git.test.ts', 2, 0, 0],
        ['test/sub/con-bash.test.ts', 1, 1, 0],
      ]
    );
    assert.ok(filas.every((f) => f.segundos > 0));

    // --filtro limita a una carpeta; sin --json escribe la tabla en --salida.
    const salida = path.join(dir, 'informe.md');
    const t = spawnSync(process.execPath, [SCRIPT, '--dir', dir, '--sin-build', '--filtro', 'test/sub', '--salida', salida], { encoding: 'utf8', env: ENV });
    assert.equal(t.status, 0, t.stderr);
    assert.match(t.stdout, /Ficheros: 1\. Tests: 1\./);
    assert.match(t.stdout, /\| 1 \| test\/sub\/con-bash\.test\.ts \| [\d.]+ \| 1 \| 1 \| 1\.0 \| 0 \|/);
    assert.match(t.stdout, /solo test\/sub/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
