/**
 * TASK-144b (CMD1-09, CMD2-05 y FS-01 de la auditoria 4D): una sola regla
 * para los flags. Los booleanos que un comando lee por token estan todos en
 * FLAGS_SIN_VALOR (asi `--flag=valor` aborta en vez de ignorarse), y los
 * flags con valor dan lo mismo con `--flag valor` y con `--flag=valor`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extraerUnico, FLAGS_SIN_VALOR, rechazarFlagsDesconocidos } from '../../src/cli/args.js';
import { FLAGS_REVIEW } from '../../src/commands/review.js';
import { FLAGS_REGISTRAR_COSTE } from '../../src/commands/registrar-coste.js';
import { extraerFlagsCierre } from '../../src/commands/finish-opciones.js';
import { extraerCadena } from '../../src/commands/cadena.js';
import { extraerContenidoInicial } from '../../src/commands/new.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC_COMMANDS = path.join(HERE, '..', '..', '..', 'src', 'commands');

test('paridad: todo booleano que un comando lee por token esta en FLAGS_SIN_VALOR', () => {
  const leidos = new Set<string>();
  for (const f of readdirSync(SRC_COMMANDS).filter((n) => n.endsWith('.ts'))) {
    const texto = readFileSync(path.join(SRC_COMMANDS, f), 'utf8');
    for (const m of texto.matchAll(/\.includes\('(--[a-z][a-z-]*)'\)/g)) leidos.add(m[1] as string);
    for (const m of texto.matchAll(/^export const FLAG_[A-Z_]+ = '(--[a-z][a-z-]*)';/gm)) leidos.add(m[1] as string);
  }
  assert.ok(leidos.has('--completa') && leidos.has('--sin-verificacion'), [...leidos].join(', '));
  const faltan = [...leidos].filter((f) => !FLAGS_SIN_VALOR.includes(f));
  assert.deepEqual(faltan, [], `booleanos fuera de FLAGS_SIN_VALOR: ${faltan.join(', ')}`);
});

test('IMP-1/MENOR-3 de su revision: ningun flag que un comando lee CON valor esta en la lista global de booleanos', () => {
  const conValor = new Set<string>();
  for (const f of readdirSync(SRC_COMMANDS).filter((n) => n.endsWith('.ts'))) {
    const texto = readFileSync(path.join(SRC_COMMANDS, f), 'utf8');
    for (const m of texto.matchAll(/extraer(?:Unico|Repetible)\([^,]+,\s*'(--[a-z][a-z-]*)'/g)) conValor.add(m[1] as string);
  }
  // registrar-coste lee --tokens con valor (parseArgs); metricas lo trata como booleano por su cuenta.
  conValor.add('--tokens');
  assert.ok(conValor.has('--tag') && conValor.has('--motivo'), [...conValor].join(', '));
  const choques = [...conValor].filter((f) => FLAGS_SIN_VALOR.includes(f));
  assert.deepEqual(choques, [], `flags con valor en la lista de booleanos: ${choques.join(', ')}`);
  assert.doesNotThrow(() =>
    rechazarFlagsDesconocidos(['TASK-001', '--fase', 'implementacion', '--tokens=5'], FLAGS_REGISTRAR_COSTE, 'registrar-coste', (m) => new Error(m))
  );
});

test('FS-01: review --completa=1 aborta en vez de ignorarse', () => {
  assert.throws(
    () => rechazarFlagsDesconocidos(['TASK-001', '--completa=1'], FLAGS_REVIEW, 'review', (m) => new Error(m)),
    /"--completa" no lleva valor/
  );
});

test('flags con valor: --flag valor y --flag=valor dan lo mismo; sin valor o repetido, el error del comando', () => {
  const err = (repetido: boolean) => new Error(repetido ? 'repetido' : 'sin valor');
  assert.deepEqual(extraerUnico(['A', '--motivo', 'por x', 'B'], '--motivo', err), { valor: 'por x', resto: ['A', 'B'] });
  assert.deepEqual(extraerUnico(['A', '--motivo=por x', 'B'], '--motivo', err), { valor: 'por x', resto: ['A', 'B'] });
  assert.deepEqual(extraerUnico(['A'], '--motivo', err), { valor: null, resto: ['A'] });
  assert.throws(() => extraerUnico(['--motivo'], '--motivo', err), /sin valor/);
  assert.throws(() => extraerUnico(['--motivo', '--push'], '--motivo', err), /sin valor/);
  assert.throws(() => extraerUnico(['--motivo='], '--motivo', err), /sin valor/);
  assert.throws(() => extraerUnico(['--motivo', 'a', '--motivo=b'], '--motivo', err), /repetido/);
  // Un valor que empieza por -- solo con =.
  assert.equal(extraerUnico(['--motivo=--raro'], '--motivo', err).valor, '--raro');

  // Los comandos que antes leian a mano dan lo mismo en las dos formas.
  assert.deepEqual(extraerFlagsCierre(['T', '--tag', 'v1.2.0']), extraerFlagsCierre(['T', '--tag=v1.2.0']));
  assert.equal(extraerFlagsCierre(['T', '--merge-request', '--tag=v1']).mergeRequest, true);
  assert.deepEqual(extraerCadena(['T', '--cadena', 'abc']), extraerCadena(['T', '--cadena=abc']));
  assert.throws(() => extraerCadena(['T', '--cadena', '']), /necesita el testigo/);
  assert.deepEqual(
    extraerContenidoInicial(['--objetivo', 'O', '--criterio', 'a', '--criterio=b']).contenido,
    extraerContenidoInicial(['--objetivo=O', '--criterio=a', '--criterio', 'b']).contenido
  );
  // MENOR-2 de su revision: el objetivo y los criterios se recortan.
  assert.deepEqual(extraerContenidoInicial(['--objetivo', '  O  ', '--criterio', ' a\n b ']).contenido, {
    objetivo: 'O',
    criterios: ['a b'],
    desde: null,
  });
});
