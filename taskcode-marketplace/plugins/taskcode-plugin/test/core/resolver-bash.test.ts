/**
 * TASK-134: que bash lanza taskctl, como logica pura (sin procesos ni disco):
 * el PATH y los ficheros que existen entran como datos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverBash } from '../../src/core/resolver-bash.js';

function win(pathVar: string, ficheros: readonly string[]) {
  const set = new Set(ficheros.map((f) => f.toLowerCase()));
  return resolverBash({ plataforma: 'win32', path: pathVar, existe: (f) => set.has(f.toLowerCase()) });
}

const GIT = 'C:\\Program Files\\Git';
const USR_BASH = `${GIT}\\usr\\bin\\bash.exe`;
const WSL = 'C:\\Windows\\System32';

test('resolverBash: en Windows, con System32 (bash de WSL) delante, elige el bash de Git a partir de cmd\\git.exe', () => {
  const r = win(`${WSL};${GIT}\\cmd`, [`${WSL}\\bash.exe`, `${GIT}\\cmd\\git.exe`, USR_BASH, `${GIT}\\bin\\bash.exe`]);
  assert.deepEqual(r, { comando: USR_BASH, origen: 'git' });
});

test('resolverBash: git.exe a dos niveles de la raiz (ucrt64\\bin, mingw64\\bin)', () => {
  for (const sub of ['ucrt64', 'mingw64']) {
    const r = win(`${GIT}\\${sub}\\bin`, [`${GIT}\\${sub}\\bin\\git.exe`, USR_BASH]);
    assert.deepEqual(r, { comando: USR_BASH, origen: 'git' }, sub);
  }
});

test('resolverBash: sin usr\\bin\\bash.exe usa bin\\bash.exe de la instalacion', () => {
  const r = win(`${GIT}\\cmd`, [`${GIT}\\cmd\\git.exe`, `${GIT}\\bin\\bash.exe`]);
  assert.deepEqual(r, { comando: `${GIT}\\bin\\bash.exe`, origen: 'git' });
});

test('resolverBash: entradas del PATH vacias, entrecomilladas o con barra final no rompen la busqueda', () => {
  const r = win(`;;"${GIT}\\cmd\\";`, [`${GIT}\\cmd\\git.exe`, USR_BASH]);
  assert.deepEqual(r, { comando: USR_BASH, origen: 'git' });
});

test('resolverBash: el primer git.exe del PATH con bash al lado gana; uno sin bash se salta', () => {
  const otro = 'D:\\PortableGit';
  const r = win(`C:\\solo-git;${otro}\\cmd;${GIT}\\cmd`, [
    'C:\\solo-git\\git.exe',
    `${otro}\\cmd\\git.exe`,
    `${otro}\\usr\\bin\\bash.exe`,
    `${GIT}\\cmd\\git.exe`,
    USR_BASH,
  ]);
  assert.deepEqual(r, { comando: `${otro}\\usr\\bin\\bash.exe`, origen: 'git' });
});

test('resolverBash: sin bash de Git, respaldo al bash del PATH (origen path)', () => {
  assert.deepEqual(win(`${WSL}`, [`${WSL}\\bash.exe`]), { comando: 'bash', origen: 'path' });
  assert.deepEqual(win(`${GIT}\\cmd`, [`${GIT}\\cmd\\git.exe`]), { comando: 'bash', origen: 'path' });
  assert.deepEqual(win('', []), { comando: 'bash', origen: 'path' });
});

test('resolverBash: en Linux y macOS, "bash" del PATH como siempre, aunque haya un git con bash al lado', () => {
  for (const plataforma of ['linux', 'darwin'] as const) {
    const r = resolverBash({ plataforma, path: '/usr/bin:/bin', existe: () => true });
    assert.deepEqual(r, { comando: 'bash', origen: 'path' }, plataforma);
  }
});
