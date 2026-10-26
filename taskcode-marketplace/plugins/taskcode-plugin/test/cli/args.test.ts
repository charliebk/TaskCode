import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, extraerRepetible } from '../../src/cli/args.js';

test('parseArgs: separa posicionales de flags con valor', () => {
  const r = parseArgs(['new', '--titulo', 'Mi tarea', '--tipo', 'feature']);
  assert.deepEqual(r.positional, ['new']);
  assert.equal(r.flags['titulo'], 'Mi tarea');
  assert.equal(r.flags['tipo'], 'feature');
});

test('parseArgs: flag sin valor siguiente se trata como booleano', () => {
  const r = parseArgs(['--verbose']);
  assert.equal(r.flags['verbose'], true);
});

test('parseArgs: flag seguido de otro flag se trata como booleano, no consume el siguiente', () => {
  const r = parseArgs(['--verbose', '--titulo', 'x']);
  assert.equal(r.flags['verbose'], true);
  assert.equal(r.flags['titulo'], 'x');
});

test('parseArgs: sin argumentos devuelve listas vacias', () => {
  const r = parseArgs([]);
  assert.deepEqual(r.positional, []);
  assert.deepEqual(r.flags, {});
});

test('parseArgs: --flag=valor permite valores que empiezan por "--"', () => {
  const r = parseArgs(['--titulo=--urgente', '--tipo', 'fix']);
  assert.equal(r.flags['titulo'], '--urgente');
  assert.equal(r.flags['tipo'], 'fix');
});

test('parseArgs: --flag=valor con "=" dentro del valor solo separa en el primer "="', () => {
  const r = parseArgs(['--titulo=a=b=c']);
  assert.equal(r.flags['titulo'], 'a=b=c');
});

// TASK-065: lector comun de flags repetibles (--repo, --agente).
test('extraerRepetible: saca todos los valores en orden, en las dos formas, y deja el resto intacto', () => {
  const r = extraerRepetible(['--repo', 'a', '--tokens', '--repo=b', 'x', '--repo', '../c'], '--repo', () => new Error('sin valor'));
  assert.deepEqual(r.valores, ['a', 'b', '../c']);
  assert.deepEqual(r.resto, ['--tokens', 'x']);
});

test('extraerRepetible: no confunde un flag que empieza igual (--repositorio)', () => {
  const r = extraerRepetible(['--repositorio', 'z'], '--repo', () => new Error('sin valor'));
  assert.deepEqual(r.valores, []);
  assert.deepEqual(r.resto, ['--repositorio', 'z']);
});

test('extraerRepetible: sin valor (al final, seguido de otro flag, vacio) lanza el error de quien llama', () => {
  for (const argv of [['--repo'], ['--repo', '--tokens'], ['--repo='], ['--repo', '  ']]) {
    assert.throws(() => extraerRepetible(argv, '--repo', () => new Error('falta la ruta')), /falta la ruta/, argv.join(' '));
  }
});

// TASK-065: un flag repetido que no admite repeticion aborta en cualquier comando.
import { rechazarFlagsDesconocidos, FLAGS_REPETIBLES } from '../../src/cli/args.js';

test('rechazarFlagsDesconocidos: un flag repetido aborta (tambien mezclando --flag valor y --flag=valor)', () => {
  const fallo = (m: string): Error => new Error(m);
  for (const argv of [
    ['--sprint', '1', '--sprint', '2'],
    ['--sprint=1', '--sprint', '2'],
    ['--escribir', '--escribir'],
  ]) {
    assert.throws(
      () => rechazarFlagsDesconocidos(argv, ['--sprint', '--escribir'], 'board', fallo),
      /taskctl board: "--(sprint|escribir)" esta repetido y no admite repeticion/,
      argv.join(' ')
    );
  }
});

test('rechazarFlagsDesconocidos: los repetibles (--repo, --agente, --criterio) si se repiten', () => {
  assert.deepEqual([...FLAGS_REPETIBLES].sort(), ['--agente', '--criterio', '--repo']);
  for (const flag of FLAGS_REPETIBLES) {
    assert.doesNotThrow(() =>
      rechazarFlagsDesconocidos([flag, 'a', `${flag}=b`, flag, 'c'], [flag], 'x', (m) => new Error(m))
    );
  }
});
