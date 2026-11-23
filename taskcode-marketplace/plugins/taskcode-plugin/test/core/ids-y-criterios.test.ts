/**
 * TASK-147b (CORE2-01, CORE2-04, CORE2-14, FS-04, CMD2-08 de la auditoria 4D):
 * el ID de tarea se valida y se ordena con un solo lector, y las casillas sin
 * marcar se leen con el mismo lector de criterios que el resto del flujo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compararIds, esIdTroceable, isValidTaskId, type TareaUbicada } from '../../src/core/task.js';
import { formatBoard } from '../../src/core/board-format.js';
import { tareasQueBloquean } from '../../src/core/wip.js';
import { generarRoadmap, type TareaRoadmap } from '../../src/core/roadmap.js';
import { compararRoadmaps } from '../../src/core/roadmap-comparar.js';
import { citar } from '../../src/core/tarea-body.js';
import { ordenarPorCierre } from '../../src/core/evolucion.js';
import { calcularFila } from '../../src/core/metricas.js';
import { casillasSinMarcar } from '../../src/core/validacion-tarea.js';
import { tarea } from '../helpers/tarea-ejemplo.js';

const DESORDENADOS = ['TASK-1000', 'TASK-121b', 'TASK-122', 'TASK-121', 'TASK-999', 'TASK-121a'];
const ORDEN = ['TASK-121', 'TASK-121a', 'TASK-121b', 'TASK-122', 'TASK-999', 'TASK-1000'];
const ids = (texto: string): string[] => [...texto.matchAll(/TASK-\d+[a-z]?/g)].map((m) => m[0]);

test('el ID: una regex para validar y troceable solo sin letra', () => {
  assert.deepEqual(
    ['TASK-121', 'TASK-121a', 'TASK-1000', 'TASK-12', 'TASK-121ab', 'TASK-121A'].map(isValidTaskId),
    [true, true, true, false, false, false]
  );
  assert.deepEqual(['TASK-121', 'TASK-121a', 'TASK-12'].map(esIdTroceable), [true, false, false]);
});

test('TASK-121a y TASK-1000 ordenan igual en compararIds, board, wip, roadmap y evolucion', () => {
  assert.deepEqual([...DESORDENADOS].sort(compararIds), ORDEN);
  assert.deepEqual(['x', 'TASK-002', 'TASK-0001'].sort(compararIds), ['TASK-0001', 'TASK-002', 'x'], 'lo que no es un ID, al final');

  const board = formatBoard(DESORDENADOS.map((id) => tarea({ id, estado: 'planificada' })));
  assert.deepEqual(ids(board), ORDEN, board);

  const ocupadas: TareaUbicada[] = DESORDENADOS.map((id) => {
    const task = tarea({ id, estado: 'en-curso', asignado_a: 'claude' });
    return { task, estadoCarpeta: task.estado };
  });
  assert.deepEqual(
    tareasQueBloquean(ocupadas, 'claude', 'TASK-001').map((t) => t.task.id),
    ORDEN
  );

  const roadmap = generarRoadmap(
    DESORDENADOS.map((id) => ({ id, titulo: `T ${id}`, sprint: 0, complejidad: 'media' as const, estado: 'planificada' as const, dependencias: id === 'TASK-121a' ? ['TASK-121'] : [] })),
    null
  );
  assert.deepEqual([...roadmap.texto.matchAll(/^\| \S+ \| (TASK-\d+[a-z]?) \|/gm)].map((m) => m[1]), ORDEN, roadmap.texto);

  const filas = DESORDENADOS.map((id) => ({
    ...calcularFila({ task: tarea({ id }), body: '', ronda: 0, eventosGit: [] }),
    cierre: '2026-11-23',
    proyecto: 'p',
  }));
  assert.deepEqual(ordenarPorCierre(filas).map((f) => f.id), ORDEN);
});

test('casillasSinMarcar: «### Criterios de aceptacion» cuenta y «**Tras el cierre**» en negrita no', () => {
  const body =
    '## Objetivo\n\nAlgo.\n\n### Criterios de aceptacion\n\n- [x] hecho\n- [ ] pendiente uno\n\n' +
    '**Tras el cierre**\n\n- [ ] se verifica despues\n';
  assert.deepEqual(casillasSinMarcar(body), ['pendiente uno']);
  assert.deepEqual(
    casillasSinMarcar('## Criterios de aceptacion\n\n- [ ] a\n\n### Tras el cierre\n\n- [ ] b\n'),
    ['a'],
    'el subtitulo de Tras el cierre sigue sin contar'
  );
});

test('orden (MEN-2 y MEN-4 de la revision): mismo numero por cadena, ciclo del roadmap y diferencias de compararRoadmaps', () => {
  assert.deepEqual(['TASK-099', 'TASK-0099'].sort(compararIds), ['TASK-0099', 'TASK-099']);
  assert.deepEqual(['TASK-0099', 'TASK-099'].sort(compararIds), ['TASK-0099', 'TASK-099']);

  const t = (id: string, dependencias: string[] = []): TareaRoadmap => ({
    id,
    titulo: `T ${id}`,
    sprint: 0,
    complejidad: 'media',
    estado: 'planificada',
    dependencias,
  });
  // Ciclo: ninguna sale por Kahn; van aparte, en el orden de compararIds.
  const ciclo = generarRoadmap([t('TASK-1000', ['TASK-999']), t('TASK-999', ['TASK-121a']), t('TASK-121a', ['TASK-1000'])], null);
  assert.deepEqual([...ciclo.texto.matchAll(/^\| \S+ \| (TASK-\d+[a-z]?) \|/gm)].map((m) => m[1]), ['TASK-121a', 'TASK-999', 'TASK-1000'], ciclo.texto);

  const actual = generarRoadmap([], null).texto;
  const generado = generarRoadmap(DESORDENADOS.map((id) => t(id)), null).texto;
  const difs = compararRoadmaps(actual, generado).filter((d) => d.startsWith('TASK-'));
  assert.deepEqual(difs.map((d) => d.split(':')[0]), ORDEN, difs.join('\n'));
});

test('citar (MEN-4 de la revision): cada linea con «> » y las vacias con «>» solo', () => {
  assert.equal(citar('uno\n\n  dos  \r\ntres'), '> uno\n>\n>   dos\n> tres');
});
