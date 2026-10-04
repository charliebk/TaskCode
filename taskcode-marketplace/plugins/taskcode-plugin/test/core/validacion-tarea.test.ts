/**
 * TASK-043: validacion determinista del enunciado (modulo puro).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarEnunciado,
  tieneAncla,
  esSoloVago,
  planEsEsqueleto,
  casillasSinMarcar,
  MAX_CRITERIOS,
  AVISO_CRITERIOS,
} from '../../src/core/validacion-tarea.js';
import type { SeccionesTarea } from '../../src/core/tarea-body.js';

function secciones(objetivo: string, criterios: string[]): SeccionesTarea {
  return { objetivo, criterios, criteriosTrasCierre: [] };
}

const n = (k: number): string[] => Array.from({ length: k }, (_, i) => `\`taskctl\` caso ${String(i + 1)}`);

test('validarEnunciado: objetivo vacio y cero criterios bloquean, con un motivo cada uno', () => {
  const r = validarEnunciado(secciones('  ', []));
  assert.equal(r.bloqueos.length, 2);
  assert.match(r.bloqueos[0] as string, /Objetivo/);
  assert.match(r.bloqueos[1] as string, /ningun criterio/);
});

test('validarEnunciado: el limite es exactamente 12 (bloquea 13) y el aviso empieza en 9', () => {
  assert.equal(MAX_CRITERIOS, 12);
  assert.equal(AVISO_CRITERIOS, 8);
  assert.deepEqual(validarEnunciado(secciones('X', n(8))), { bloqueos: [], avisos: [] });
  const nueve = validarEnunciado(secciones('X', n(9)));
  assert.equal(nueve.bloqueos.length, 0);
  assert.match(nueve.avisos[0] as string, /tiene 9 criterios/);
  const doce = validarEnunciado(secciones('X', n(12)));
  assert.equal(doce.bloqueos.length, 0);
  assert.equal(doce.avisos.length, 1);
  const trece = validarEnunciado(secciones('X', n(13)));
  assert.equal(trece.bloqueos.length, 1);
  assert.match(trece.bloqueos[0] as string, /13 criterios .*partela/);
});

test('validarEnunciado: un criterio vacio bloquea indicando su posicion', () => {
  const r = validarEnunciado(secciones('X', ['`a` hace 1 cosa', '']));
  assert.deepEqual(r.bloqueos, ['el criterio 2 esta vacio']);
});

test('validarEnunciado: un criterio solo vago bloquea; uno de comportamiento sin ancla solo avisa', () => {
  const vago = validarEnunciado(secciones('X', ['El codigo debe ser robusto y mantenible']));
  assert.equal(vago.bloqueos.length, 1);
  assert.match(vago.bloqueos[0] as string, /palabras vagas/);
  assert.equal(vago.avisos.length, 0, 'el vago no se cuenta ademas como sin ancla');

  const comportamiento = validarEnunciado(secciones('X', ['Sin nada que commitear no se crea commit vacio']));
  assert.equal(comportamiento.bloqueos.length, 0);
  assert.match(comportamiento.avisos[0] as string, /1 criterio\(s\) no citan nada comprobable/);
});

test('tieneAncla: codigo, rutas, flags, comandos, tests y numeros cuentan; IDs y secciones no', () => {
  for (const si of [
    'usa `foo()`',
    'toca src/core/x',
    'edita README.md',
    'acepta --push',
    'taskctl plan lo rechaza',
    'git log lo muestra',
    'hay un test que lo cubre',
    'tarda menos de 5 segundos',
  ]) {
    assert.equal(tieneAncla(si), true, si);
  }
  for (const no of ['como en TASK-018', 'segun la §8.3', 'ver la seccion 14', 'cumple AC1 y C6', 'queda claro']) {
    assert.equal(tieneAncla(no), false, no);
  }
});

test('esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva', () => {
  assert.equal(esSoloVago('Mejorar el rendimiento'), false, '"rendimiento" no es vaga');
  assert.equal(esSoloVago('Que sea rapido y eficiente'), true);
  assert.equal(esSoloVago('Rápido'), true, 'las tildes se normalizan');
  assert.equal(esSoloVago(''), false);
});

test('planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva', () => {
  const plantilla = '# Plan — TASK-1\n\n## Enfoque\n\n(Rellena aqui)\n';
  assert.equal(planEsEsqueleto(plantilla, [plantilla]), true);
  assert.equal(planEsEsqueleto(plantilla.replace(/\n/g, '\r\n'), [plantilla]), true, 'CRLF no cambia nada');
  assert.equal(planEsEsqueleto('# Solo un titulo\n', []), true);
  assert.equal(planEsEsqueleto(`${plantilla}\nUsar un modulo puro.\n`, [plantilla]), false);
});

test('casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones', () => {
  const body =
    '## Objetivo\n- [ ] no es criterio\n\n' +
    '## Criterios de aceptacion\n- [x] hecho\n- [ ] pendiente uno\n### Parser\n* [ ] pendiente dos\n' +
    '### Tras el cierre\n- [ ] CI en verde\n\n## Resultado\n- [ ] tampoco\n';
  assert.deepEqual(casillasSinMarcar(body), ['pendiente uno', 'pendiente dos']);
  assert.deepEqual(casillasSinMarcar(body.replace(/\n/g, '\r\n')), ['pendiente uno', 'pendiente dos']);
  assert.deepEqual(casillasSinMarcar('## Criterios de aceptacion\n- [x] a\n'), []);
});

test('casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar', () => {
  const body = '## Criterios de aceptacion\n### Tras el cierre\n- [ ] CI\n### CLI\n- [ ] vuelve a contar\n';
  assert.deepEqual(casillasSinMarcar(body), ['vuelve a contar']);
});

test('esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas', () => {
  for (const vago of ['Que sea rapida', 'Es correcta', 'Que quede limpia', 'Optimizada', 'Que funcione correctamente']) {
    assert.equal(esSoloVago(vago), true, vago);
  }
  assert.equal(tieneAncla('Robusto y/o eficiente'), false);
  assert.equal(tieneAncla('si/no segun el caso'), false);
  assert.equal(tieneAncla('toca src/core/x'), true);
});
