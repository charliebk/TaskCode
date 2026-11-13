/**
 * TASK-117: la complejidad propuesta por tareas parecidas ya cerradas. Logica
 * pura, sin disco ni Git.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proponerComplejidad, type TareaComparable } from '../../src/core/complejidad-similar.js';

const t = (id: string, etiquetas: string[], complejidad: TareaComparable['complejidad']): TareaComparable => ({
  id,
  etiquetas,
  complejidad,
});

test('complejidad propuesta (TASK-117): solo cuentan las terminadas con MAS etiquetas en comun', () => {
  const p = proponerComplejidad(
    ['ifc', 'importador'],
    [t('TASK-001', ['ifc', 'importador'], 'alta'), t('TASK-002', ['ifc'], 'trivial'), t('TASK-003', ['otra'], 'simple')]
  );
  assert.deepEqual(p, { valor: 'alta', desde: ['TASK-001'], enComun: 2 });
});

test('complejidad propuesta (TASK-117): mediana impar, y con numero par la inferior de las dos centrales', () => {
  const impar = proponerComplejidad(
    ['cli'],
    [t('TASK-003', ['cli'], 'alta'), t('TASK-001', ['cli'], 'simple'), t('TASK-002', ['cli'], 'media')]
  );
  assert.equal(impar?.valor, 'media');
  assert.deepEqual(impar?.desde, ['TASK-001', 'TASK-002', 'TASK-003']);
  const par = proponerComplejidad(
    ['cli'],
    [
      t('TASK-001', ['cli'], 'critica'),
      t('TASK-002', ['cli'], 'simple'),
      t('TASK-003', ['cli'], 'alta'),
      t('TASK-004', ['cli'], 'trivial'),
    ]
  );
  assert.equal(par?.valor, 'simple', 'trivial, simple | alta, critica: la inferior de las centrales');
});

test('complejidad propuesta (TASK-117): sin etiquetas, sin complejidad declarada o sin coincidencias, null', () => {
  const terminadas = [t('TASK-001', ['cli'], 'media'), t('TASK-002', ['ifc'], null)];
  assert.equal(proponerComplejidad([], terminadas), null);
  assert.equal(proponerComplejidad(['ifc'], terminadas), null, 'la unica parecida no declara complejidad');
  assert.equal(proponerComplejidad(['web'], terminadas), null);
  assert.equal(proponerComplejidad(['cli'], []), null);
});

test('complejidad propuesta (TASK-117): las etiquetas se comparan sin distinguir mayusculas', () => {
  assert.equal(proponerComplejidad(['CLI'], [t('TASK-001', ['cli'], 'alta')])?.valor, 'alta');
});
