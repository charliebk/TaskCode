import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, extraerRepetible, rechazarFlagsDesconocidos, FLAGS_REPETIBLES } from '../../src/cli/args.js';

test('parseArgs: posicionales, flags con valor, booleanos, vacio y --flag=valor', () => {
  // Separa posicionales de flags con valor.
  const r = parseArgs(['new', '--titulo', 'Mi tarea', '--tipo', 'feature']);
  assert.deepEqual(r.positional, ['new']);
  assert.equal(r.flags['titulo'], 'Mi tarea');
  assert.equal(r.flags['tipo'], 'feature');
  // Flag sin valor siguiente se trata como booleano.
  assert.equal(parseArgs(['--verbose']).flags['verbose'], true, 'booleano al final');
  // Flag seguido de otro flag se trata como booleano, no consume el siguiente.
  const b = parseArgs(['--verbose', '--titulo', 'x']);
  assert.equal(b.flags['verbose'], true, 'booleano seguido de flag');
  assert.equal(b.flags['titulo'], 'x');
  // Sin argumentos devuelve listas vacias.
  const v = parseArgs([]);
  assert.deepEqual(v.positional, []);
  assert.deepEqual(v.flags, {});
  // --flag=valor permite valores que empiezan por "--".
  const e = parseArgs(['--titulo=--urgente', '--tipo', 'fix']);
  assert.equal(e.flags['titulo'], '--urgente');
  assert.equal(e.flags['tipo'], 'fix');
  // --flag=valor con "=" dentro del valor solo separa en el primer "=".
  assert.equal(parseArgs(['--titulo=a=b=c']).flags['titulo'], 'a=b=c');
});

// TASK-065: lector comun de flags repetibles (--repo, --agente).
test('extraerRepetible: todos los valores en orden, sin confundir prefijos, y error sin valor', () => {
  // Saca todos los valores en orden, en las dos formas, y deja el resto intacto.
  const r = extraerRepetible(['--repo', 'a', '--tokens', '--repo=b', 'x', '--repo', '../c'], '--repo', () => new Error('sin valor'));
  assert.deepEqual(r.valores, ['a', 'b', '../c']);
  assert.deepEqual(r.resto, ['--tokens', 'x']);
  // No confunde un flag que empieza igual (--repositorio).
  const p = extraerRepetible(['--repositorio', 'z'], '--repo', () => new Error('sin valor'));
  assert.deepEqual(p.valores, []);
  assert.deepEqual(p.resto, ['--repositorio', 'z']);
  // Sin valor (al final, seguido de otro flag, vacio) lanza el error de quien llama.
  for (const argv of [['--repo'], ['--repo', '--tokens'], ['--repo='], ['--repo', '  ']]) {
    assert.throws(() => extraerRepetible(argv, '--repo', () => new Error('falta la ruta')), /falta la ruta/, argv.join(' '));
  }
});

// TASK-065: un flag repetido que no admite repeticion aborta en cualquier comando.
test('rechazarFlagsDesconocidos: un flag repetido aborta, y los repetibles si se repiten', () => {
  const fallo = (m: string): Error => new Error(m);
  // Tambien mezclando --flag valor y --flag=valor.
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
  // Los repetibles (--repo, --agente, --criterio) si se repiten.
  assert.deepEqual([...FLAGS_REPETIBLES].sort(), ['--agente', '--criterio', '--repo']);
  for (const flag of FLAGS_REPETIBLES) {
    assert.doesNotThrow(() =>
      rechazarFlagsDesconocidos([flag, 'a', `${flag}=b`, flag, 'c'], [flag], 'x', (m) => new Error(m))
    );
  }
});
