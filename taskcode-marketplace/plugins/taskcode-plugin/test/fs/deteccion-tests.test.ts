/**
 * Lectura de la raiz para proponer comando_verificacion (TASK-088, MEN-3 de la
 * ronda 1): los caminos defensivos que fallan en cerrado. Directorios
 * temporales reales.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { detectarComandosTests } from '../../src/fs/deteccion-tests.js';
import { MAX_BYTES_MARCADOR_APLICACION } from '../../src/fs/deteccion-app.js';

async function conDir(f: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'taskctl-deteccion-tests-'));
  try {
    await f(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const PKG_CON_TEST = JSON.stringify({ scripts: { test: 'node --test' } });

test('un directorio que no existe no detecta nada (no lanza)', () => {
  assert.deepEqual(detectarComandosTests(path.join(tmpdir(), 'taskctl-deteccion-tests-no-existe')), []);
});

test('package.json mayor que el tope no se lee: no cuenta', async () => {
  await conDir(async (dir) => {
    const relleno = ' '.repeat(MAX_BYTES_MARCADOR_APLICACION);
    await writeFile(path.join(dir, 'package.json'), `${PKG_CON_TEST}${relleno}`, 'utf8');
    assert.deepEqual(detectarComandosTests(dir), []);
  });
});

test('package.json justo en el tope si se lee', async () => {
  await conDir(async (dir) => {
    const relleno = ' '.repeat(MAX_BYTES_MARCADOR_APLICACION - PKG_CON_TEST.length);
    await writeFile(path.join(dir, 'package.json'), `${PKG_CON_TEST}${relleno}`, 'utf8');
    assert.deepEqual(
      detectarComandosTests(dir).map((c) => c.comando),
      ['npm test']
    );
  });
});

test('un directorio con nombre de manifiesto no cuenta', async () => {
  await conDir(async (dir) => {
    await mkdir(path.join(dir, 'Cargo.toml'));
    assert.deepEqual(detectarComandosTests(dir), []);
  });
});

test('enlace a fichero cuenta; enlace roto no (si la plataforma deja crearlos)', async (t) => {
  await conDir(async (dir) => {
    await writeFile(path.join(dir, 'real.toml'), '[package]\n', 'utf8');
    try {
      await symlink(path.join(dir, 'real.toml'), path.join(dir, 'Cargo.toml'));
      await symlink(path.join(dir, 'no-existe'), path.join(dir, 'go.mod'));
    } catch (e: unknown) {
      // Windows nativo sin privilegios: EPERM. El camino se prueba en el CI de Linux.
      if ((e as NodeJS.ErrnoException).code === 'EPERM') {
        t.skip('sin permiso para crear enlaces simbolicos');
        return;
      }
      throw e;
    }
    assert.deepEqual(
      detectarComandosTests(dir, 'linux').map((c) => c.comando),
      ['cargo test']
    );
  });
});
