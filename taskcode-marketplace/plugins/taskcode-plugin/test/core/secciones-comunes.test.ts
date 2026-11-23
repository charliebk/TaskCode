/**
 * TASK-147a (CORE1-01, CORE1-02, CORE2-02, CORE2-06 de la auditoria 4D): las
 * secciones de tarea.md se leen y se crean con una sola regla. Un ejemplo de
 * la seccion dentro de un bloque de codigo (en el enunciado) no se confunde
 * con la real: antes varios lectores tomaban la primera aparicion.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anotarDuracion, estimadaAnotada } from '../../src/core/duracion-estimada.js';
import { anotarCierre, leerCierre } from '../../src/core/cierre.js';
import { leerVerificacionesLigeras } from '../../src/core/menores.js';
import { rondaExtraDecidida } from '../../src/core/rondas-extra.js';
import { anotarMergeRequest, urlMergeRequestAnotada } from '../../src/core/plataforma-remota.js';
import { anadirSeccionAlFinal } from '../../src/core/transiciones.js';
import { leerPartes, planificarTroceo } from '../../src/core/troceo.js';
import { tarea } from '../helpers/tarea-ejemplo.js';

const EJEMPLO = (titulo: string, cuerpo: string) => `## Objetivo\n\nEjemplo:\n\n\`\`\`\n${titulo}\n\n${cuerpo}\n\`\`\`\n`;

test('anadirSeccionAlFinal: separa con una linea en blanco y respeta el fin de linea del cuerpo', () => {
  assert.equal(anadirSeccionAlFinal('', ['## A', '', 'x']), '## A\n\nx\n');
  assert.equal(anadirSeccionAlFinal('texto\n\n\n', ['## A']), 'texto\n\n## A\n');
  assert.equal(anadirSeccionAlFinal('texto\r\n', ['## A', '', 'x']), 'texto\r\n\r\n## A\r\n\r\nx\r\n');
});

test('duracion: con un ejemplo de ## Duracion en un bloque de codigo, anotarDuracion y anotarCierre usan la misma seccion real', () => {
  let body = EJEMPLO('## Duracion', '- Estimada: 999 min');
  body = anotarDuracion(body, { tipo: 'ok', minutos: 30 }, 45);
  body = anotarCierre(body, '2026-11-23T10:00:00Z', '2026-11-23T10:05:00Z');
  assert.equal((body.match(/^## Duracion$/gm) ?? []).length, 2, 'el ejemplo y UNA seccion real');
  assert.ok(body.includes('- Estimada: 999 min'), 'el ejemplo queda intacto');
  assert.equal(estimadaAnotada(body), 30);
  assert.equal(leerCierre(body)?.segundos, 300);
});

test('verificacion ligera y rondas extra: el ejemplo del bloque no tapa la seccion real', () => {
  const verif =
    EJEMPLO('## Verificacion ligera', '- ronda 9; commit revisado aaaaaaa; commit verificado bbbbbbb') +
    '\n## Verificacion ligera\n\n- 2026-11-23: ronda 1; commit revisado 1234567; commit verificado 89abcde\n';
  assert.deepEqual(leerVerificacionesLigeras(verif), [{ ronda: 1, commitRevisado: '1234567', commitVerificado: '89abcde' }]);

  const extra = EJEMPLO('## Rondas extra', '- Ronda 3: ejemplo') + '\n## Rondas extra\n\n- Ronda 4: Carlos, decision real\n';
  assert.equal(rondaExtraDecidida(extra, 4), true);
  assert.equal(rondaExtraDecidida(extra, 3), false, 'la ronda del ejemplo no cuenta');
});

test('merge request: ida y vuelta con un ejemplo de la seccion en un bloque', () => {
  const body = anotarMergeRequest(EJEMPLO('## Merge request', '- URL del merge request: https://ejemplo.invalid/1'), 'https://github.com/o/r/pull/7', 'github');
  assert.equal(urlMergeRequestAnotada(body), 'https://github.com/o/r/pull/7');
});

test('troceo: «### Criterios de aceptacion» abre la seccion y la parte a no arrastra los criterios viejos', () => {
  const plan =
    '# Plan\n\nDuracion estimada: 90 min\n\n## Troceo\n\n### Parte a: uno\nObjetivo a.\nDuracion estimada: 40 min\n- [ ] criterio a\n\n' +
    '### Parte b: dos\nObjetivo b.\nDuracion estimada: 50 min\n- [ ] criterio b\n';
  const body = '## Objetivo\n\nEl objetivo.\n\n### Criterios de aceptacion\n- [ ] criterio viejo\n';
  const partes = leerPartes(plan, 'TASK-007');
  const { parteA } = planificarTroceo(tarea(), body, partes, '2026-11-23');
  assert.ok(!parteA.body.includes('criterio viejo'), parteA.body);
  assert.ok(parteA.body.includes('criterio a'));
  assert.equal((parteA.body.match(/criterios de aceptaci/gi) ?? []).length, 1, parteA.body);
});

test('troceo: «### Criterios de aceptacion» dentro de una parte del plan no corta «## Troceo» (IMP-1 de la revision)', () => {
  const plan =
    '# Plan\n\nDuracion estimada: 90 min\n\n## Troceo\n\n### Parte a: uno\nObjetivo a.\nDuracion estimada: 40 min\n### Criterios de aceptacion\n- [ ] criterio a\n\n' +
    '### Parte b: dos\nObjetivo b.\nDuracion estimada: 50 min\n- [ ] criterio b\n';
  const partes = leerPartes(plan, 'TASK-007');
  assert.deepEqual(
    partes.map((p) => [p.letra, p.criterios]),
    [
      ['a', ['criterio a']],
      ['b', ['criterio b']],
    ]
  );
});

test('troceo: un «## Objetivo» o «### Criterios» dentro de un bloque de codigo no es la seccion (MEN-1 de la revision)', () => {
  const plan =
    '# Plan\n\nDuracion estimada: 90 min\n\n## Troceo\n\n### Parte a: uno\nObjetivo a.\nDuracion estimada: 40 min\n- [ ] criterio a\n\n' +
    '### Parte b: dos\nObjetivo b.\nDuracion estimada: 50 min\n- [ ] criterio b\n';
  const body =
    '## Contexto\n\n```\n## Objetivo\n\nobjetivo del ejemplo\n\n### Criterios de aceptacion\n- [ ] criterio del ejemplo\n```\n\n' +
    '## Objetivo\n\nEl objetivo real.\n\n## Criterios de aceptacion\n- [ ] criterio viejo\n';
  const { parteA } = planificarTroceo(tarea(), body, leerPartes(plan, 'TASK-007'), '2026-11-23');
  const bloque = '```\n## Objetivo\n\nobjetivo del ejemplo\n\n### Criterios de aceptacion\n- [ ] criterio del ejemplo\n```';
  assert.ok(parteA.body.includes(bloque), `el ejemplo queda intacto:\n${parteA.body}`);
  assert.ok(!parteA.body.includes('> objetivo del ejemplo'), 'el ejemplo no se cita como objetivo de la tarea entera');
  assert.ok(!parteA.body.includes('criterio viejo'), parteA.body);
  assert.ok(parteA.body.includes('criterio a'), parteA.body);
});

test('duracion: estimadaAnotada solo lee dentro de «## Duracion» (MEN-2 de la revision)', () => {
  assert.equal(estimadaAnotada('## Notas\n\n- Estimada: 30 min\n'), null, 'fuera de la seccion no cuenta');
  assert.equal(estimadaAnotada('## Duracion\r\n\r\n- Estimada: 30 min\r\n'), 30, 'con CRLF');
});

test('troceo: «### Criterios de aceptacion» despues de la ultima parte cierra «## Troceo» (IMP-2 de la revision)', () => {
  const plan =
    '# Plan\n\n## Troceo\n\n### Parte a: Primera\nObjetivo.\nDuracion estimada: 30 min\n- [ ] a1\n\n' +
    '### Parte b: Segunda\nObjetivo.\nDuracion estimada: 30 min\n- [ ] b1\n\n### Criterios de aceptacion\n- [ ] global1\n\n## Notas\n';
  assert.deepEqual(
    leerPartes(plan, 'TASK-007').map((p) => [p.letra, p.criterios]),
    [
      ['a', ['a1']],
      ['b', ['b1']],
    ]
  );
});

test('troceo: la cabecera propia de la ultima parte es de esa parte; un «### Objetivo» tras sus criterios cierra «## Troceo» (IMP-3 e IMP-4 de la revision)', () => {
  const cabeza = '# Plan\n\n## Troceo\n\n### Parte a: uno\nObjetivo a.\nDuracion estimada: 30 min\n- [ ] a1\n\n### Parte b: dos\n';
  const criteriosPropios = cabeza + 'Objetivo b.\nDuracion estimada: 30 min\n### Criterios de aceptacion\n- [ ] b1\n';
  const objetivoPropio = cabeza + '### Objetivo\nObjetivo b.\nDuracion estimada: 30 min\n- [ ] b1\n';
  const objetivoGlobal = cabeza + 'Objetivo b.\nDuracion estimada: 30 min\n- [ ] b1\n\n### Objetivo\nTexto global.\n- [ ] global1\n';
  for (const plan of [criteriosPropios, objetivoPropio, objetivoGlobal]) {
    assert.deepEqual(
      leerPartes(plan, 'TASK-007').map((p) => [p.letra, p.criterios]),
      [
        ['a', ['a1']],
        ['b', ['b1']],
      ],
      plan
    );
  }
});
