/**
 * Cobertura de las lineas cambiadas (TASK-074): el parser de lcov, el cruce
 * con las lineas añadidas, el umbral y las claves de config. Puro, sin repo;
 * el lcov real de `node --test` y los repos van en
 * test/commands/cobertura-cambios.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsearLcov } from '../../src/core/lcov.js';
import {
  cruzarCobertura,
  cumpleUmbral,
  describirCruce,
  filtrarCruce,
  formatearPorcentaje,
  rangos,
} from '../../src/core/cobertura-cambios.js';
import { ConfigError, parsearConfig } from '../../src/core/config.js';

const LCOV = [
  'TN:',
  'SF:src\\a.mjs',
  'FN:2,f',
  'BRDA:5,2,0,0',
  'DA:1,1',
  'DA:2,1',
  'DA:3,1',
  'DA:6,0',
  'DA:7,1',
  'LH:4',
  'LF:5',
  'end_of_record',
  'SF:/abs/b.ts',
  'DA:10,0',
  'end_of_record',
  '',
].join('\r\n');

test('lcov: lee SF, DA y end_of_record tal cual (CRLF), e ignora FN/BRDA/LH', () => {
  const l = parsearLcov(LCOV);
  assert.equal(l.truncado, false);
  assert.deepEqual([...l.ficheros.keys()], ['src\\a.mjs', '/abs/b.ts']);
  assert.deepEqual([...(l.ficheros.get('src\\a.mjs') as Map<number, number>)], [
    [1, 1],
    [2, 1],
    [3, 1],
    [6, 0],
    [7, 1],
  ]);
});

test('lcov: un registro sin end_of_record marca el informe como truncado', () => {
  assert.equal(parsearLcov('SF:a.js\nDA:1,1\n').truncado, true);
  assert.equal(parsearLcov('SF:a.js\nDA:1,1\nend_of_record\nSF:b.js\nDA:1').truncado, true);
  assert.equal(parsearLcov('').truncado, false);
});

test('lcov: un SF repetido (informes fusionados) suma: la linea se ejecuto si se ejecuto en alguno', () => {
  const l = parsearLcov('SF:a.js\nDA:10,0\nDA:11,0\nend_of_record\nSF:a.js\nDA:10,5\nend_of_record\n');
  assert.deepEqual([...(l.ficheros.get('a.js') as Map<number, number>)], [
    [10, 5],
    [11, 0],
  ]);
  // MEN-3 de la revision: en el otro orden, sobrescribir daria 0.
  const inverso = parsearLcov('SF:a.js\nDA:10,5\nend_of_record\nSF:a.js\nDA:10,0\nend_of_record\n');
  assert.deepEqual([...(inverso.ficheros.get('a.js') as Map<number, number>)], [[10, 5]]);
});

const informe = new Map([
  ['src/a.mjs', new Map([[1, 1], [2, 1], [3, 1], [4, 0], [5, 0], [6, 0], [9, 0], [10, 2]])],
  ['src/B.ts', new Map([[1, 0]])],
]);

test('cruce: solo cuentan las lineas cambiadas con DA; DA:n,0 es sin cubrir; sin SF va aparte', () => {
  const anadidas = new Map([
    ['src/a.mjs', [3, 4, 5, 6, 7, 8, 9, 10]],
    ['docs/x.md', [1, 2]],
    ['src/vacio.ts', []],
  ]);
  const c = cruzarCobertura(anadidas, informe);
  assert.deepEqual(c.ficheros, [{ ruta: 'src/a.mjs', ejecutables: 6, cubiertas: 2, sinCubrir: [4, 5, 6, 9] }]);
  assert.deepEqual(c.sinInstrumentar, ['docs/x.md']);
  assert.equal(c.ejecutables, 6);
  assert.equal(c.cubiertas, 2);
  assert.equal(formatearPorcentaje(c.porcentaje as number), '33.3');
  // Las lineas 1 y 2 tienen DA pero no han cambiado: no cuentan.
  assert.equal(describirCruce(c).includes('`src/a.mjs`: 4-6, 9'), true);
  assert.equal(describirCruce(c).includes('`docs/x.md`'), true);
});

test('cruce: la clave de ruta decide mayusculas (Windows) y un fichero sin lineas ejecutables cambiadas no cuenta', () => {
  const anadidas = new Map([['src/b.ts', [1]]]);
  // Sin la clave sin mayusculas, src/b.ts no casa con src/B.ts: es un .ts que el informe no lista.
  assert.deepEqual(cruzarCobertura(anadidas, informe).ficheros, [
    { ruta: 'src/b.ts', ejecutables: 1, cubiertas: 0, sinCubrir: [1], fueraDelInforme: true },
  ]);
  const c = cruzarCobertura(anadidas, informe, (r) => r.toLowerCase());
  assert.deepEqual(c.ficheros, [{ ruta: 'src/b.ts', ejecutables: 1, cubiertas: 0, sinCubrir: [1] }]);
  const soloComentarios = cruzarCobertura(new Map([['src/a.mjs', [7, 8]]]), informe);
  assert.deepEqual(soloComentarios.ficheros, []);
  assert.equal(soloComentarios.porcentaje, null);
  assert.match(describirCruce(soloComentarios), /Ninguna linea cambiada es ejecutable/);
});

test('cruce (IMP-1/IMP-2 de la revision): un fichero de codigo que el informe no lista cuenta entero sin cubrir; uno de docs, no', () => {
  const anadidas = new Map([
    ['src/a.mjs', [3]],
    ['src/nuevo.mjs', [1, 2, 4]],
    ['docs/guia.md', [1, 2]],
    ['Makefile', [1]],
  ]);
  const c = cruzarCobertura(anadidas, informe);
  assert.deepEqual(c.ficheros, [
    { ruta: 'src/a.mjs', ejecutables: 1, cubiertas: 1, sinCubrir: [] },
    { ruta: 'src/nuevo.mjs', ejecutables: 3, cubiertas: 0, sinCubrir: [1, 2, 4], fueraDelInforme: true },
  ]);
  assert.deepEqual(c.sinInstrumentar, ['Makefile', 'docs/guia.md']);
  assert.deepEqual([c.cubiertas, c.ejecutables], [1, 4]);
  assert.match(
    describirCruce(c),
    /- `src\/nuevo\.mjs`: 1-2, 4 \(el informe no lo lista, y es codigo de una carpeta que si mide: cuenta entero\)/
  );
  // Una tarea de solo docs no tiene nada que medir.
  const docs = cruzarCobertura(new Map([['docs/guia.md', [1]]]), informe);
  assert.equal(docs.ejecutables, 0);
  assert.equal(cumpleUmbral(docs, 100), true);
});

test('cruce (IMP-5 de la ronda 2): fuera del informe solo cuenta el codigo de una carpeta medida; tests excluidos y .d.ts, no', () => {
  const anadidas = new Map([
    ['test/b.test.mjs', [1, 2]],
    ['src/tipos.d.ts', [1]],
    ['src/Tipos.D.MTS', [1]],
    ['src/sub/n.mjs', [1, 2]],
    ['otra/x.mjs', [1]],
    ['raiz.mjs', [1]],
    ['src/Mayus.MJS', [1]],
  ]);
  const c = cruzarCobertura(anadidas, informe);
  assert.deepEqual(
    c.ficheros.map((f) => f.ruta),
    ['src/Mayus.MJS', 'src/sub/n.mjs'],
    'src/ tiene ficheros medidos (tambien una subcarpeta suya); la extension no distingue mayusculas'
  );
  assert.deepEqual(c.sinInstrumentar, ['otra/x.mjs', 'raiz.mjs', 'src/Tipos.D.MTS', 'src/tipos.d.ts', 'test/b.test.mjs']);
  // Con un fichero medido en la raiz, un .mjs nuevo de la raiz si cuenta.
  const conRaiz = new Map([...informe, ['main.mjs', new Map([[1, 1]])]]);
  assert.deepEqual(cruzarCobertura(new Map([['raiz.mjs', [1]]]), conRaiz).ficheros.map((f) => f.ruta), ['raiz.mjs']);
  // Una tarea que solo añade tests (excluidos del informe) no se frena.
  assert.equal(cumpleUmbral(cruzarCobertura(new Map([['test/b.test.mjs', [1]]]), informe), 100), true);
});

test('porcentaje (MEN-2 de la revision): redondea hacia abajo, para no decir «91 % no llega a 91 %»', () => {
  assert.equal(formatearPorcentaje((100 * 1820) / 2001), '90.9');
  assert.equal(formatearPorcentaje(90), '90');
  assert.equal(formatearPorcentaje((100 * 2) / 3), '66.6');
  assert.equal(formatearPorcentaje(100), '100');
  assert.equal(formatearPorcentaje((100 * 999) / 1000), '99.9');
});

test('cruce: filtrar por los ficheros de un dominio recalcula los totales', () => {
  const c = cruzarCobertura(new Map([['src/a.mjs', [3, 4]], ['src/B.ts', [1]]]), informe);
  const f = filtrarCruce(c, new Set(['src/B.ts']));
  assert.deepEqual([f.ejecutables, f.cubiertas, f.porcentaje], [1, 0, 0]);
});

test('umbral: porcentaje minimo, el valor exacto pasa; sin lineas ejecutables pasa', () => {
  const de = (cubiertas: number, ejecutables: number) => ({
    ficheros: [],
    sinInstrumentar: [],
    cubiertas,
    ejecutables,
    porcentaje: ejecutables === 0 ? null : (100 * cubiertas) / ejecutables,
  });
  assert.equal(cumpleUmbral(de(9, 10), 90), true, 'el valor exacto pasa');
  assert.equal(cumpleUmbral(de(9, 10), 90.01), false);
  assert.equal(cumpleUmbral(de(2, 3), 66.67), false);
  assert.equal(cumpleUmbral(de(2, 3), 66.66), true);
  assert.equal(cumpleUmbral(de(0, 0), 100), true);
  assert.equal(cumpleUmbral(de(0, 1), 0), true);
});

test('rangos: agrupa consecutivas', () => {
  assert.equal(rangos([4, 5, 6, 9]), '4-6, 9');
  assert.equal(rangos([1]), '1');
  assert.equal(rangos([]), '');
  assert.equal(rangos([1, 3, 4, 10, 11, 12]), '1, 3-4, 10-12');
});

test('config: informe_cobertura y umbral_cobertura son claves conocidas, null por defecto, y validadas', () => {
  const vacia = parsearConfig('', 'c.yml');
  assert.equal(vacia.informe_cobertura, null);
  assert.equal(vacia.umbral_cobertura, null);
  const c = parsearConfig(
    'comando_verificacion: "npm test"\ninforme_cobertura: coverage\\lcov.info\numbral_cobertura: 80\n',
    'c.yml'
  );
  assert.equal(c.informe_cobertura, 'coverage/lcov.info');
  assert.equal(c.umbral_cobertura, 80);
  assert.equal(parsearConfig('informe_cobertura: ./cov/../coverage/lcov.info\n', 'c.yml').informe_cobertura, 'coverage/lcov.info');
  // Solo el informe, sin umbral ni comando: vale (review informa).
  assert.equal(parsearConfig('informe_cobertura: coverage/lcov.info\n', 'c.yml').umbral_cobertura, null);
  const aborta = (texto: string, re: RegExp) =>
    assert.throws(() => parsearConfig(texto, 'c.yml'), (e: unknown) => e instanceof ConfigError && re.test(e.message), texto);
  const conTodo = 'comando_verificacion: "npm test"\ninforme_cobertura: coverage/lcov.info\n';
  aborta(`${conTodo}umbral_cobertura: 101\n`, /"umbral_cobertura" debe ser un numero de 0 a 100/);
  aborta(`${conTodo}umbral_cobertura: -1\n`, /de 0 a 100/);
  aborta(`${conTodo}umbral_cobertura: mucho\n`, /de 0 a 100/);
  aborta('comando_verificacion: "npm test"\numbral_cobertura: 80\n', /necesita tambien "informe_cobertura" y "comando_verificacion"/);
  aborta('informe_cobertura: coverage/lcov.info\numbral_cobertura: 80\n', /necesita tambien/);
  aborta('informe_cobertura: /tmp/lcov.info\n', /"informe_cobertura" "\/tmp\/lcov.info" no vale: es absoluta/);
  aborta('informe_cobertura: ../lcov.info\n', /se sale del repo/);
  aborta('informe_cobertura: coverage/\n', /es una carpeta/);
  assert.equal(parsearConfig(`${conTodo}umbral_cobertura: 0\n`, 'c.yml').umbral_cobertura, 0);
  assert.equal(parsearConfig(`${conTodo}umbral_cobertura: 87.5\n`, 'c.yml').umbral_cobertura, 87.5);
});
