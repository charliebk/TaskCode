/**
 * TASK-099: logica pura de la verificacion ligera de MENORES.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  backlogMenores,
  bloqueantesAbiertos,
  esRutaDeTest,
  fueraDeAlcance,
  leerVerificacionesLigeras,
  lineaVerificacionLigera,
  menoresAbiertos,
  repartirMenores,
  rutasDeCelda,
  SECCION_VERIFICACION_LIGERA,
  verificacionDeRonda,
} from '../../src/core/menores.js';

function informe(filas: string[]): string {
  return (
    '# Informe\n\n- Revisor: code-quality-reviewer\n- Veredicto: aprobada con correcciones\n\n## Hallazgos\n\n' +
    '| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n' +
    filas.join('\n') +
    '\n'
  );
}

test('bloqueantes: CRITICO, IMPORTANTE y severidad desconocida abiertos bloquean; cerrados y MENORES no', () => {
  const texto = informe([
    '| CRIT-1 | CRITICO | abierto | src/a.ts | implementacion |',
    '| IMP-1 | IMPORTANTE | corregido | src/b.ts | implementacion |',
    '| IMP-2 | **Importante** | aceptado | src/b.ts | plan |',
    '| X-1 | Alta | abierto | src/c.ts | implementacion |',
    '| MEN-1 | MENOR | abierto | src/d.ts | implementacion |',
  ]);
  assert.deepEqual(
    bloqueantesAbiertos([texto]).map((h) => h.id),
    ['CRIT-1', 'X-1']
  );
  assert.deepEqual(
    menoresAbiertos([texto]).map((h) => h.id),
    ['MEN-1']
  );
  // Contraprueba: solo MENORES (abiertos o no) no bloquea nada.
  const soloMenores = informe(['| MEN-1 | MENOR | abierto | src/d.ts | x |', '| MEN-2 | menor | corregido | src/e.ts | x |']);
  assert.deepEqual(bloqueantesAbiertos([soloMenores]), []);
  assert.deepEqual(
    menoresAbiertos([soloMenores]).map((h) => h.id),
    ['MEN-1']
  );
});

test('rutasDeCelda quita linea, ancla, comillas invertidas y ./; separa varias', () => {
  assert.deepEqual(rutasDeCelda('src/a.ts:42'), ['src/a.ts']);
  assert.deepEqual(rutasDeCelda('`src/a.ts` L10-20'), ['src/a.ts']);
  assert.deepEqual(rutasDeCelda('./src/a.ts#L3, test/a.test.ts:1-4'), ['src/a.ts', 'test/a.test.ts']);
  assert.deepEqual(rutasDeCelda('src\\win\\b.ts'), ['src/win/b.ts']);
  // MEN-1 de la revision: `:L42` y `(12)` tambien.
  assert.deepEqual(rutasDeCelda('src/a.ts:L42'), ['src/a.ts']);
  assert.deepEqual(rutasDeCelda('src/a.ts:L10-L20'), ['src/a.ts']);
  assert.deepEqual(rutasDeCelda('foo.ts(12)'), ['foo.ts']);
  assert.deepEqual(rutasDeCelda('—'), []);
  assert.deepEqual(rutasDeCelda(''), []);
});

test('esRutaDeTest reconoce carpetas y sufijos de test, y nada mas', () => {
  for (const r of ['test/a.ts', 'pkg/tests/b.py', 'src/__tests__/c.tsx', 'src/d.test.ts', 'src/e.spec.js']) {
    assert.equal(esRutaDeTest(r), true, r);
  }
  for (const r of ['src/testing.ts', 'src/contest/a.ts', 'src/test-utils.ts', 'README.md']) {
    assert.equal(esRutaDeTest(r), false, r);
  }
});

test('alcance: fichero de un MENOR (tambien por sufijo desde la raiz) y tests valen; un fichero ajeno no', () => {
  const menores = menoresAbiertos([
    informe(['| MEN-1 | MENOR | abierto | src/a.ts:42 | x |', '| MEN-2 | MENOR | abierto | `docs/b.md` | x |']),
  ]);
  assert.deepEqual(fueraDeAlcance(['plugins/p/src/a.ts', 'docs/b.md', 'plugins/p/test/a.test.ts'], menores), []);
  assert.deepEqual(fueraDeAlcance(['src/a.ts', 'src/otro.ts'], menores), ['src/otro.ts']);
  // Sufijo solo tras '/': "xsrc/a.ts" no es "src/a.ts".
  assert.deepEqual(fueraDeAlcance(['xsrc/a.ts'], menores), ['xsrc/a.ts']);
  // MEN-1: un nombre sin carpeta solo vale tal cual, no por sufijo.
  const suelto = menoresAbiertos([informe(['| MEN-9 | MENOR | abierto | index.ts | x |'])]);
  assert.deepEqual(fueraDeAlcance(['index.ts', 'pkg/src/critico/index.ts'], suelto), ['pkg/src/critico/index.ts']);
  // Sin MENORES, cualquier cambio que no sea test esta fuera.
  assert.deepEqual(fueraDeAlcance(['src/a.ts', 'test/x.ts'], []), ['src/a.ts']);
});

test('reparto: corregido si cambio algun fichero que cita; pendiente si no o si no cita ninguno', () => {
  const menores = menoresAbiertos([
    informe([
      '| MEN-1 | MENOR | abierto | src/a.ts | x |',
      '| MEN-2 | MENOR | abierto | src/b.ts | x |',
      '| MEN-3 | MENOR | abierto | — | x |',
    ]),
  ]);
  const { corregidos, pendientes } = repartirMenores(menores, ['root/src/a.ts']);
  assert.deepEqual(
    corregidos.map((h) => h.id),
    ['MEN-1']
  );
  assert.deepEqual(
    pendientes.map((h) => h.id),
    ['MEN-2', 'MEN-3']
  );
});

test('la linea de verificacion se vuelve a leer, y se elige la ultima de esa ronda y ese commit', () => {
  const linea = (ronda: number, rev: string, ver: string) =>
    lineaVerificacionLigera({
      instante: '2026-11-12T10:00:00Z',
      ronda,
      commitRevisado: rev,
      commitVerificado: ver,
      ficheros: ['src/a.ts'],
      corregidos: ['MEN-1'],
      pendientes: [],
    });
  const l1 = linea(1, 'aaaaaaa1111', 'bbbbbbb2222');
  assert.match(l1, /ficheros: src\/a\.ts; corregidos: MEN-1; pendientes: ninguno$/);
  const body =
    `## Objetivo\n\nx\n\n${SECCION_VERIFICACION_LIGERA}\n\n${l1}\n${linea(1, 'aaaaaaa1111', 'ccccccc3333')}\n` +
    `${linea(2, 'ddddddd4444', 'eeeeeee5555')}\n\n## Resultado\n\n- ronda 9; commit revisado 1234567; commit verificado 7654321\n`;
  assert.equal(leerVerificacionesLigeras(body).length, 3, 'lo de otra seccion no cuenta');
  assert.equal(verificacionDeRonda(body, 1, 'aaaaaaa')?.commitVerificado, 'ccccccc3333', 'prefijo del SHA y la ultima');
  assert.equal(verificacionDeRonda(body, 2, 'aaaaaaa'), null, 'otra ronda no vale');
  assert.equal(verificacionDeRonda(body, 1, 'fffffff'), null, 'otro commit revisado no vale');
  assert.deepEqual(leerVerificacionesLigeras('## Objetivo\n\nnada\n'), []);
});

test('backlog: tabla con id, fichero y motivo; escapa barras verticales', () => {
  const pendientes = menoresAbiertos([informe(['| MEN-2 | MENOR | abierto | src/b.ts:3 | x |'])]);
  const texto = backlogMenores('TASK-001', 1, pendientes, 'lo hace TASK-002 | despues');
  assert.match(texto, /^# MENORES pendientes — TASK-001/);
  assert.match(texto, /no abren otra ronda ni impiden `finish`/);
  assert.match(texto, /\| ID \| Fichero \| Motivo \|/);
  assert.ok(texto.includes('| MEN-2 | src/b.ts:3 | lo hace TASK-002 \\| despues |'));
});
