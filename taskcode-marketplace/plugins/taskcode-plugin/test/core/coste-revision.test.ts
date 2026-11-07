/**
 * TASK-081: ronda y revisor de un subagente de revision (puro), lectura de
 * `## Coste` con filas de 9 y de 11 columnas, y agrupacion por (ronda, revisor).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rondaYRevisorDeTranscripcion } from '../../src/core/coste-transcripcion.js';
import {
  CABECERA_COSTE,
  anadirCoste,
  leerCostes,
  lecturasDeRevision,
  type FilaCoste,
} from '../../src/core/coste-registro.js';
import { rondaYRevisorDePeticion } from '../../src/fs/rondas.js';
import {
  promptDeRevision,
  transcripcionRevisor,
  usuarioBloques,
  usuarioTexto,
} from '../helpers/transcripcion-revision.js';

const unir = (lineas: string[]): string => lineas.join('\n') + '\n';

test('rondaYRevisorDeTranscripcion: contenido string, ronda fragmentada (revisor = sufijo) y sin fragmentar (revisor vacio)', () => {
  assert.deepEqual(
    rondaYRevisorDeTranscripcion(unir(transcripcionRevisor(promptDeRevision('peticion-revision-2-java-spring-reviewer.md'), 1))),
    { ronda: 2, revisor: 'java-spring-reviewer' }
  );
  assert.deepEqual(
    rondaYRevisorDeTranscripcion(unir(transcripcionRevisor(promptDeRevision('peticion-revision-1.md'), 1))),
    { ronda: 1, revisor: '' }
  );
  assert.deepEqual(rondaYRevisorDeTranscripcion(usuarioTexto('ver peticion-revision-12-x.md.')), { ronda: 12, revisor: 'x' });
});

test('rondaYRevisorDeTranscripcion: contenido como bloques de texto (los que no son texto se ignoran)', () => {
  const bloques = JSON.stringify({
    type: 'user',
    message: { content: [{ type: 'image', source: 'x' }, { type: 'text', text: 'ruta: revision/peticion-revision-3-a-b.md' }] },
  });
  assert.deepEqual(rondaYRevisorDeTranscripcion(bloques), { ronda: 3, revisor: 'a-b' });
  assert.deepEqual(rondaYRevisorDeTranscripcion(usuarioBloques('hola', 'peticion-revision-4.md')), { ronda: 4, revisor: '' });
});

test('rondaYRevisorDeTranscripcion: sin peticion, sin mensaje de usuario o con basura da null (nunca la ronda 1)', () => {
  assert.equal(rondaYRevisorDeTranscripcion(''), null);
  assert.equal(rondaYRevisorDeTranscripcion('no es json\n{}\n'), null);
  assert.equal(rondaYRevisorDeTranscripcion(unir(transcripcionRevisor(null, 2))), null, 'sin mensaje user');
  assert.equal(rondaYRevisorDeTranscripcion(usuarioTexto('revisa la tarea sin ruta')), null);
  assert.equal(rondaYRevisorDeTranscripcion(usuarioTexto('el informe-revision-1.md y peticion-revision-x.md')), null);
  assert.equal(rondaYRevisorDeTranscripcion(usuarioTexto('xpeticion-revision-1.md')), null, 'pegado a otro nombre no cuenta');
  assert.equal(rondaYRevisorDeTranscripcion(usuarioTexto('mi-peticion-revision-1.md')), null);
});

test('rondaYRevisorDeTranscripcion: solo mira el PRIMER mensaje de usuario', () => {
  const texto = unir([usuarioTexto('Revisa sin ruta'), usuarioTexto(promptDeRevision('peticion-revision-9-otro.md'))]);
  assert.equal(rondaYRevisorDeTranscripcion(texto), null);
  const primero = unir([usuarioTexto(promptDeRevision('peticion-revision-1-x.md')), usuarioTexto('peticion-revision-9-otro.md')]);
  assert.deepEqual(rondaYRevisorDeTranscripcion(primero), { ronda: 1, revisor: 'x' });
});

test('rondaYRevisorDeTranscripcion (MEN-4 r1): salta las lineas que no son de usuario antes del primer mensaje user', () => {
  const otras = [
    JSON.stringify({ type: 'summary', summary: 'resumen previo' }),
    JSON.stringify({ type: 'system', content: 'arranque' }),
    JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: 'mira peticion-revision-7-z.md' } }),
  ];
  const texto = unir([...otras, usuarioTexto(promptDeRevision('peticion-revision-2-y.md'))]);
  assert.deepEqual(rondaYRevisorDeTranscripcion(texto), { ronda: 2, revisor: 'y' });
});

test('la regex de rondas es una sola: rondaYRevisorDePeticion da la misma clave que los informes', () => {
  assert.deepEqual(rondaYRevisorDePeticion('peticion-revision-2-x.md'), { ronda: 2, revisor: 'x' });
  assert.deepEqual(rondaYRevisorDePeticion('peticion-revision-2.md'), { ronda: 2, revisor: '' });
  assert.equal(rondaYRevisorDePeticion('informe-revision-2.md'), null);
});

function fila(o: Partial<FilaCoste>): FilaCoste {
  return {
    fecha: '2026-10-25T10:00:00Z',
    fase: 'revision',
    fuente: 'agente:a1b2c3',
    entrada: 10,
    cacheEscritura: 20,
    cacheLectura: 300,
    salida: 40,
    lecturas: 4,
    total: 370,
    ronda: null,
    revisor: null,
    ...o,
  };
}

test('leerCostes lee filas de 9 columnas (sin ronda ni revisor) y de 11, mezcladas, y la cabecera nueva es de 11', () => {
  assert.equal(CABECERA_COSTE.split('|').length - 2, 11);
  const cuerpo =
    '## Coste\n\n' +
    '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |\n' +
    '|---|---|---|---|---|---|---|---|---|\n' +
    '| 2026-10-25T10:00:00Z | revision | agente:a1b2c3 | 10 | 20 | 300 | 40 | 4 | 370 |\n' +
    '| 2026-10-25T11:00:00Z | revision | agente:b1b2c3 | 1 | 2 | 3 | 4 | 5 | 10 | 2 | x-reviewer |\n' +
    '| 2026-10-25T12:00:00Z | revision | agente:c1b2c3 | 1 | 2 | 3 | 4 | 5 | 10 | 1 | - |\n' +
    '| 2026-10-25T13:00:00Z | revision | agente:d1b2c3 | 1 | 2 | 3 | 4 | 5 | 10 | - | - |\n' +
    '| fila | de | 10 | columnas |\n';
  assert.deepEqual(
    leerCostes(cuerpo).map((x) => [x.fuente, x.total, x.ronda, x.revisor]),
    [
      ['agente:a1b2c3', 370, null, null],
      ['agente:b1b2c3', 10, 2, 'x-reviewer'],
      ['agente:c1b2c3', 10, 1, ''],
      ['agente:d1b2c3', 10, null, null],
    ]
  );
});

test('anadirCoste escribe 11 columnas y NO reescribe las filas de 9 que ya hay', () => {
  const antiguo =
    '## Coste\n\n' +
    '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |\n' +
    '|---|---|---|---|---|---|---|---|---|\n' +
    '| 2026-10-25T10:00:00Z | revision | agente:a1b2c3 | 10 | 20 | 300 | 40 | 4 | 370 |\n';
  const nuevo = anadirCoste(antiguo, fila({ fuente: 'agente:b1b2c3', ronda: 1, revisor: 'x-reviewer' }));
  assert.ok(nuevo.startsWith(antiguo), 'lo anterior queda byte a byte');
  assert.match(nuevo, /\| agente:b1b2c3 \| 10 \| 20 \| 300 \| 40 \| 4 \| 370 \| 1 \| x-reviewer \|\n$/);
  const sinFragmentar = anadirCoste(antiguo, fila({ ronda: 3, revisor: '' }));
  assert.match(sinFragmentar, /\| 370 \| 3 \| - \|\n$/);
  assert.deepEqual(
    leerCostes(sinFragmentar).map((x) => [x.ronda, x.revisor]),
    [
      [null, null],
      [3, ''],
    ]
  );
});

test('lecturasDeRevision agrupa por (ronda, revisor), suma sus filas y deja la ausencia en null', () => {
  const grupos = lecturasDeRevision([
    fila({ ronda: 1, revisor: 'x', lecturas: 3, entrada: 30, cacheLectura: 300 }),
    fila({ ronda: 1, revisor: 'y', lecturas: 5, entrada: 50, cacheLectura: 500 }),
    fila({ ronda: 2, revisor: 'x', lecturas: 2, entrada: 20, cacheLectura: 200 }),
    fila({ ronda: 1, revisor: 'x', lecturas: 4, entrada: 40, cacheLectura: 400 }),
    fila({ ronda: null, revisor: null, lecturas: 7 }),
    fila({ ronda: null, revisor: null, lecturas: null, entrada: null, cacheLectura: null }),
    fila({ fase: 'diseno', ronda: 1, revisor: 'x', lecturas: 99 }),
    fila({ fuente: 'manual', ronda: 4, revisor: '', lecturas: null, entrada: null, cacheLectura: null }),
  ]);
  assert.deepEqual(
    grupos.map((g) => [g.ronda, g.revisor, g.filas, g.lecturas, g.entrada, g.cacheLectura]),
    [
      [1, 'x', 2, 7, 70, 700],
      [1, 'y', 1, 5, 50, 500],
      [2, 'x', 1, 2, 20, 200],
      [4, '', 1, null, null, null],
      [null, null, 2, 7, 10, 300],
    ]
  );
  assert.deepEqual(lecturasDeRevision([fila({ fase: 'diseno' })]), [], 'sin filas de revision no hay grupos');
  assert.deepEqual(lecturasDeRevision([]), []);
});
