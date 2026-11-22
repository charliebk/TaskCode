/**
 * TASK-137: la seccion `## Regla 4D` del informe de revision. Funciones puras.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avisoRegla4D, faltasRegla4D, plantillaRegla4D } from '../../src/core/informe-revision.js';
import { informeTemplate } from '../../src/commands/review.js';
import { sampleTask } from '../helpers/review-fixtures.js';

const RELLENA =
  '## Hallazgos\n\nsin hallazgos\n\n## Regla 4D\n\n' +
  '- **Duplicación**: cumple\n- Desviacion: IMP-2\n- Diluvio: cumple\n- Disfraz: cumple\n\n## Otra\n';

test('la plantilla del informe trae la seccion con las cuatro D sin rellenar', () => {
  const plantilla = informeTemplate(sampleTask({ id: 'TASK-777' }), 'abc1234', 1);
  assert.ok(plantilla.includes(plantillaRegla4D()));
  assert.deepEqual(faltasRegla4D(plantilla), ['Duplicacion', 'Desviacion', 'Diluvio', 'Disfraz']);
});

test('rellena (con tildes, enfasis o un ID) no falta nada y no hay aviso', () => {
  assert.deepEqual(faltasRegla4D(RELLENA), []);
  assert.deepEqual(faltasRegla4D(RELLENA.replace(/\n/g, '\r\n')), []);
  assert.equal(avisoRegla4D([{ fichero: 'informe-revision-1.md', texto: RELLENA }], 'TASK-900'), null);
});

test('una D ausente, vacia o fuera de la seccion cuenta como falta', () => {
  assert.deepEqual(faltasRegla4D(RELLENA.replace('- Diluvio: cumple\n', '')), ['Diluvio']);
  assert.deepEqual(faltasRegla4D(RELLENA.replace('- Disfraz: cumple', '- Disfraz:')), ['Disfraz']);
  const fuera = RELLENA.replace('- Desviacion: IMP-2\n', '') + '- Desviacion: cumple\n';
  assert.deepEqual(faltasRegla4D(fuera), ['Desviacion']);
  // MEN-1 de la revision: solo vale `cumple` o un ID de hallazgo.
  const basura = '## Regla 4D\n\n- Duplicacion: xyz\n- Desviacion: n/a\n- Diluvio: -\n- Disfraz: TODO\n';
  assert.deepEqual(faltasRegla4D(basura), ['Duplicacion', 'Desviacion', 'Diluvio', 'Disfraz']);
});

test('sin seccion: el aviso nombra la tarea y el fichero; uno incompleto, sus D', () => {
  const sin = avisoRegla4D(
    [
      { fichero: 'informe-revision-2-a.md', texto: '## Hallazgos\n\nsin hallazgos\n' },
      { fichero: 'informe-revision-2-b.md', texto: RELLENA.replace('- Diluvio: cumple', '- Diluvio: (cumple / ID del hallazgo)') },
    ],
    'TASK-900'
  );
  assert.ok(sin !== null);
  assert.match(sin, /^TASK-900: /);
  assert.match(sin, /informe-revision-2-a\.md no la tiene/);
  assert.match(sin, /informe-revision-2-b\.md sin rellenar: Diluvio/);
});
