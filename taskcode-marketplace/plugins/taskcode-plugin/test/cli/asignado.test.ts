/**
 * Tests de parseAsignadoAFlag (item B6). Modulo puro: no toca disco ni
 * Git, asi que aqui no hacen falta repos temporales: los tests reales
 * de punta a punta (que el frontmatter acaba con el valor escrito)
 * viven en plan.test.ts y start.test.ts, contra repos Git de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAsignadoAFlag,
  ASIGNADO_FLAG,
  ASIGNADO_FLAG_ALIAS,
  ASIGNADO_MAX_LONGITUD,
  PISTA_VACIO_ESCRITURA,
  identidadUsable,
  motivoValorInvalido,
} from '../../src/cli/asignado.js';

class FlagError extends Error {}
const fail = (m: string): Error => new FlagError(m);

// Comprueba que el error es el nuestro Y que dice lo que debe decir:
// un assert.throws a secas pasaria con cualquier excepcion, incluido
// un TypeError por haber roto la firma de la funcion.
function esFlagError(fragmento: string) {
  return (e: unknown): boolean =>
    e instanceof FlagError && (e as Error).message.includes(fragmento);
}

test('parseAsignadoAFlag: sin el flag devuelve undefined (que NO es null)', () => {
  assert.equal(parseAsignadoAFlag(['TASK-001'], fail), undefined);
  assert.equal(parseAsignadoAFlag([], fail), undefined);
});

test('parseAsignadoAFlag: --asignado-a con valor, en las dos formas y en cualquier posicion', () => {
  assert.equal(parseAsignadoAFlag(['TASK-001', '--asignado-a', 'carlos'], fail), 'carlos');
  assert.equal(parseAsignadoAFlag(['TASK-001', '--asignado-a=carlos'], fail), 'carlos');
  // El flag DELANTE del ID: el motivo por el que plan y start pasaron a
  // leer el ID de los posicionales en vez de argv[0].
  assert.equal(parseAsignadoAFlag(['--asignado-a', 'carlos', 'TASK-001'], fail), 'carlos');
});

test('parseAsignadoAFlag: acepta el alias --asignado_a de taskctl board', () => {
  // Sin este alias, un "taskctl plan TASK-001 --asignado_a carlos" saldria
  // con codigo 0 SIN asignar a nadie: parseArgs ignora en silencio los
  // flags que no conoce (divergencia documentada en HALLAZGOS.md).
  assert.equal(parseAsignadoAFlag(['TASK-001', '--asignado_a', 'carlos'], fail), 'carlos');
  assert.equal(parseAsignadoAFlag(['TASK-001', '--asignado_a=carlos'], fail), 'carlos');
});

test('parseAsignadoAFlag: los dos nombres a la vez es un error, no un ganador silencioso', () => {
  assert.throws(
    () => parseAsignadoAFlag(['TASK-001', '--asignado-a', 'ana', '--asignado_a', 'carlos'], fail),
    esFlagError('son el mismo flag')
  );
});

test('parseAsignadoAFlag: el flag suelto (sin valor) se rechaza en vez de asignar true', () => {
  assert.throws(() => parseAsignadoAFlag(['TASK-001', '--asignado-a'], fail), esFlagError('necesita un valor'));
  // Seguido de otro flag, parseArgs tampoco puede darle valor.
  assert.throws(
    () => parseAsignadoAFlag(['TASK-001', '--asignado-a', '--otro'], fail),
    esFlagError('necesita un valor')
  );
});

test('parseAsignadoAFlag: valor vacio o solo espacios se rechaza', () => {
  for (const argv of [['--asignado-a='], ['--asignado-a=   ']]) {
    assert.throws(() => parseAsignadoAFlag(argv, fail), esFlagError('no puede estar vacio'));
  }
});

test('parseAsignadoAFlag: recorta espacios alrededor del nombre', () => {
  assert.equal(parseAsignadoAFlag(['--asignado-a=  carlos  '], fail), 'carlos');
});

test('parseAsignadoAFlag: un salto de linea se rechaza (romperia el frontmatter)', () => {
  assert.throws(
    () => parseAsignadoAFlag(['--asignado-a=car\nlos'], fail),
    esFlagError('saltos de linea')
  );
});

test('parseAsignadoAFlag: un nombre que empieza por -- solo entra con la forma =', () => {
  // Documenta la via de escape que ya existia en parseArgs desde
  // Sprint 0, aplicada a este flag.
  assert.equal(parseAsignadoAFlag(['--asignado-a=--raro'], fail), '--raro');
});

test('los nombres de flag exportados son los que documenta la ayuda', () => {
  assert.equal(ASIGNADO_FLAG, 'asignado-a');
  assert.equal(ASIGNADO_FLAG_ALIAS, 'asignado_a');
});

test('parseAsignadoAFlag: un valor mas largo que el tope se rechaza', () => {
  // El valor acaba como columna de docs/BOARD.md, que es un fichero
  // versionado: 500 caracteres dejan el tablero ilegible para todos.
  const largo = 'x'.repeat(ASIGNADO_MAX_LONGITUD + 1);
  assert.throws(() => parseAsignadoAFlag(['--asignado-a=' + largo], fail), esFlagError('no puede pasar de'));
  // Justo en el tope, pasa.
  const justo = 'x'.repeat(ASIGNADO_MAX_LONGITUD);
  assert.equal(parseAsignadoAFlag(['--asignado-a=' + justo], fail), justo);
});

test('parseAsignadoAFlag: el tope se mide DESPUES de recortar espacios', () => {
  const conEspacios = ' '.repeat(20) + 'x'.repeat(ASIGNADO_MAX_LONGITUD) + ' '.repeat(20);
  assert.equal(
    parseAsignadoAFlag(['--asignado-a=' + conEspacios], fail),
    'x'.repeat(ASIGNADO_MAX_LONGITUD)
  );
});

test('parseAsignadoAFlag: la pista del error de vacio es opcional (board no la pasa)', () => {
  assert.throws(
    () => parseAsignadoAFlag(['--asignado-a='], fail, PISTA_VACIO_ESCRITURA),
    esFlagError('NO desasigna')
  );
  // Sin la pista, el mensaje sigue siendo correcto pero no habla de
  // desasignar: en board el flag no escribe nada.
  assert.throws(
    () => parseAsignadoAFlag(['--asignado-a='], fail),
    (err: unknown) =>
      err instanceof FlagError &&
      (err as Error).message.includes('no puede estar vacio') &&
      !(err as Error).message.includes('NO desasigna')
  );
});

// --- TASK-024: la identidad Git pasa por las MISMAS reglas que el flag ---

test('identidadUsable: una identidad normal se usa tal cual, sin aviso', () => {
  const r = identidadUsable('ana@example.com');
  assert.equal(r.identidad, 'ana@example.com');
  assert.equal(r.aviso, null);
});

test('identidadUsable: sin identidad, ni valor ni aviso', () => {
  const r = identidadUsable(null);
  assert.equal(r.identidad, null);
  assert.equal(r.aviso, null);
});

test('identidadUsable: un salto de linea NO se usa y avisa (hallazgo CRITICO)', () => {
  // Sin esto, un user.email con un salto de linea dentro inyectaba
  // claves en el frontmatter y llegaba a pisar 'estado', dejando la
  // tarea en 01-en-diseno pero declarandose terminada, y ladrillada.
  const r = identidadUsable('ana@x.com\nestado: terminada # ');
  assert.equal(r.identidad, null);
  assert.ok(r.aviso?.includes('saltos de linea'), String(r.aviso));
  assert.ok(r.aviso?.includes('user.email'), String(r.aviso));
});

test('identidadUsable: un correo mas largo que el tope NO se usa y avisa', () => {
  const largo = 'x'.repeat(ASIGNADO_MAX_LONGITUD + 1) + '@example.com';
  const r = identidadUsable(largo);
  assert.equal(r.identidad, null);
  assert.ok(r.aviso?.includes('64 caracteres'), String(r.aviso));
});

test('identidadUsable: recorta, y una identidad en blanco no se usa ni avisa como invalida', () => {
  assert.equal(identidadUsable('  ana@example.com  ').identidad, 'ana@example.com');
  const r = identidadUsable('   ');
  assert.equal(r.identidad, null);
  assert.ok(r.aviso?.includes('vacio'), String(r.aviso));
});

test('motivoValorInvalido: mismas reglas para las dos vias', () => {
  // Es lo que garantiza que el flag y la identidad no diverjan otra vez.
  assert.equal(motivoValorInvalido('ana@example.com'), null);
  assert.ok(motivoValorInvalido('')?.includes('vacio'));
  assert.ok(motivoValorInvalido('a\nb')?.includes('saltos de linea'));
  assert.ok(motivoValorInvalido('x'.repeat(65))?.includes('64 caracteres'));
});
