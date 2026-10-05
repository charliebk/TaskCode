// Tests de test/helpers/repo-plantilla.ts: que cada test reciba una copia
// propia y que lo que un test cambia no llegue al siguiente.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { plantillaRepo } from './repo-plantilla.js';

let montajes = 0;
const conRepo = plantillaRepo('taskctl-plantilla-test-', async (dir) => {
  montajes++;
  await writeFile(path.join(dir, 'base.txt'), 'original\n', 'utf8');
});

test('repo-plantilla: la receta se ejecuta una sola vez y cada llamada recibe un directorio distinto', async () => {
  const vistos: string[] = [];
  await conRepo(async (repoRoot, tareasRoot) => {
    vistos.push(repoRoot);
    assert.equal(tareasRoot, path.join(repoRoot, 'tareas'));
    assert.equal(await readFile(path.join(repoRoot, 'base.txt'), 'utf8'), 'original\n');
  });
  await conRepo(async (repoRoot) => {
    vistos.push(repoRoot);
  });
  assert.equal(montajes, 1);
  assert.notEqual(vistos[0], vistos[1]);
});

test('repo-plantilla: lo que cambia un test no contamina la copia del siguiente', async () => {
  let anterior = '';
  await conRepo(async (repoRoot) => {
    anterior = repoRoot;
    await writeFile(path.join(repoRoot, 'base.txt'), 'mutado\n', 'utf8');
    await writeFile(path.join(repoRoot, 'nuevo.txt'), 'x\n', 'utf8');
  });
  await conRepo(async (repoRoot) => {
    assert.equal(await readFile(path.join(repoRoot, 'base.txt'), 'utf8'), 'original\n');
    await assert.rejects(stat(path.join(repoRoot, 'nuevo.txt')), { code: 'ENOENT' });
  });
  // La copia se borra al terminar, tambien si el test no falla.
  await assert.rejects(stat(anterior), { code: 'ENOENT' });
});

test('repo-plantilla: si la receta falla, el error llega al test y la siguiente llamada lo reintenta', async () => {
  let intentos = 0;
  const fallaUnaVez = plantillaRepo('taskctl-plantilla-falla-', async (dir) => {
    intentos++;
    if (intentos === 1) throw new Error('receta rota');
    await writeFile(path.join(dir, 'ok.txt'), 'ok\n', 'utf8');
  });
  await assert.rejects(fallaUnaVez(async () => {}), /receta rota/);
  await fallaUnaVez(async (repoRoot) => {
    assert.equal(await readFile(path.join(repoRoot, 'ok.txt'), 'utf8'), 'ok\n');
  });
  assert.equal(intentos, 2);
});

// Una plantilla creada dentro de un test (como hace automatico.test.ts, una
// por config) tiene que seguir viva en los tests siguientes: con un
// `after()` atado al primer test, el segundo fallaba con ENOENT.
let creadaDentro: ReturnType<typeof plantillaRepo> | null = null;

test('repo-plantilla: una plantilla creada dentro de un test se crea y se usa ahi', async () => {
  creadaDentro = plantillaRepo('taskctl-plantilla-dentro-', async (dir) => {
    await writeFile(path.join(dir, 'dentro.txt'), 'si\n', 'utf8');
  });
  await creadaDentro(async () => {});
});

test('repo-plantilla: ... y sigue disponible en el test siguiente', async () => {
  assert.ok(creadaDentro !== null);
  await creadaDentro(async (repoRoot) => {
    assert.equal(await readFile(path.join(repoRoot, 'dentro.txt'), 'utf8'), 'si\n');
  });
});
