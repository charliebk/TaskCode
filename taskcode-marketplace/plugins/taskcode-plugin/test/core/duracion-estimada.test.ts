/** TASK-097: lectura de la duracion estimada del plan y anotacion de finish (puro). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siguienteFase, type ContextoFlujo } from '../../src/core/flujo.js';
import type { ModoFlujo } from '../../src/core/config.js';
import type { Task } from '../../src/core/task.js';
import {
  LINEA_PLANTILLA_DURACION,
  UMBRAL_MINUTOS,
  anotarDuracion,
  estimadaAnotada,
  leerDuracionEstimada,
  superaUmbral,
} from '../../src/core/duracion-estimada.js';

test('leerDuracionEstimada: cifras validas, ausencia, plantilla y formatos que no se adivinan', () => {
  assert.deepEqual(leerDuracionEstimada('# Plan\n\nDuracion estimada: 45 min (senales)\n'), { tipo: 'ok', minutos: 45 });
  assert.deepEqual(leerDuracionEstimada('**Duración estimada:** 90 minutos\n'), { tipo: 'ok', minutos: 90 });
  assert.deepEqual(leerDuracionEstimada('duracion estimada: 30\r\n'), { tipo: 'ok', minutos: 30 });
  assert.deepEqual(leerDuracionEstimada('# Plan\n\nSin estimacion.\n'), { tipo: 'ausente' });
  assert.deepEqual(leerDuracionEstimada(LINEA_PLANTILLA_DURACION), { tipo: 'ausente' }, 'la plantilla sin cifra');
  for (const raro of ['1h30', '~90 min', '90-120 min', '1,5 h', '1.5 h']) {
    assert.equal(leerDuracionEstimada(`Duracion estimada: ${raro}\n`).tipo, 'ilegible', raro);
  }
  // H1 de la revision: con espacio entre la cifra y lo que sigue tampoco se
  // adivina (antes «2 horas» se leia como 2 minutos y saltaba la regla).
  for (const raro of ['2 horas', '2 h', '1 h 30', '3 horas (14 ficheros)', '1 hora', '90 - 120', '45 - 90', '45 + 30 min']) {
    assert.equal(leerDuracionEstimada(`Duracion estimada: ${raro}\n`).tipo, 'ilegible', raro);
  }
  assert.deepEqual(leerDuracionEstimada('Duracion estimada: 60 min.\n'), { tipo: 'ok', minutos: 60 });
  // H4: viñeta, cita, encabezado y acentos graves tambien son la linea.
  for (const forma of ['- Duracion estimada: 120 min', '> Duracion estimada: 120 min', '## Duracion estimada: 120 min', '`Duracion estimada: 120 min`']) {
    assert.deepEqual(leerDuracionEstimada(`# Plan\n\n${forma}\n`), { tipo: 'ok', minutos: 120 }, forma);
  }
  // H4: la linea de plantilla sin rellenar no tapa una estimacion real mas abajo.
  assert.deepEqual(
    leerDuracionEstimada(`${LINEA_PLANTILLA_DURACION}\n\nDuracion estimada: 120 min\n`),
    { tipo: 'ok', minutos: 120 }
  );
  // Un ejemplo dentro de un bloque de codigo no es la estimacion.
  assert.deepEqual(
    leerDuracionEstimada('```\nDuracion estimada: 500 min\n```\n\nDuracion estimada: 20 min\n'),
    { tipo: 'ok', minutos: 20 }
  );
});

test('superaUmbral: mas de una hora o ilegible; la ausencia no', () => {
  assert.equal(UMBRAL_MINUTOS, 60);
  assert.equal(superaUmbral({ tipo: 'ok', minutos: 60 }), false);
  assert.equal(superaUmbral({ tipo: 'ok', minutos: 61 }), true);
  assert.equal(superaUmbral({ tipo: 'ilegible', valor: '1h' }), true);
  assert.equal(superaUmbral({ tipo: 'ausente' }), false);
});

test('anotarDuracion: escribe la seccion, la reemplaza en un reintento y nunca pone 0 por un dato que falta', () => {
  const body = '## Objetivo\n\nX.\n\n## Transiciones\n\n| a |\n';
  const una = anotarDuracion(body, { tipo: 'ok', minutos: 30 }, 42);
  assert.match(una, /## Duracion\n\n- Estimada: 30 min\n- Real \(de la rama abierta al cierre con merge, sin pausas\): 42 min\n/);
  assert.equal(estimadaAnotada(una), 30);
  const dos = anotarDuracion(una, { tipo: 'ok', minutos: 30 }, 75);
  assert.equal((dos.match(/^## Duracion$/gm) ?? []).length, 1, 'reemplaza, no duplica');
  assert.match(dos, /Real .*: 75 min/);
  assert.match(dos, /- Paso de la hora: 75 min reales frente a 30 estimados/);
  const sinDatos = anotarDuracion(body, { tipo: 'ausente' }, null);
  assert.match(sinDatos, /- Estimada: — \(el plan no la dice\)/);
  assert.match(sinDatos, /- Real .*: — \(sin hora en start o finish\)/);
  assert.equal(estimadaAnotada(sinDatos), null);
  // Con la seccion en medio, lo que va detras se conserva.
  const enMedio = anotarDuracion('## Duracion\n\n- Estimada: 1 min\n\n## Otra\n\nZ\n', { tipo: 'ok', minutos: 5 }, 6);
  assert.match(enMedio, /- Estimada: 5 min[\s\S]*\n## Otra\n\nZ\n$/);
  // CRLF se respeta.
  assert.match(anotarDuracion('## Objetivo\r\n\r\nX.\r\n', { tipo: 'ok', minutos: 5 }, 6), /\r\n- Estimada: 5 min\r\n/);
});

// H3 de la revision: la decision 1 de la persona (preguntar en TODOS los
// modos, manual incluido) necesita su red de regresion.
function enDiseno(): Task {
  return {
    id: 'TASK-100', titulo: 'Prueba', tipo: 'feature', sprint: 0, etiquetas: [], complejidad: 'simple',
    modelo_sugerido: 'sonnet', estado: 'en-diseno', plan_aprobado: false, rama: 'feature/task-100-prueba',
    asignado_a: null, agente_revisor: 'general-purpose', skills_recomendados: [], regla_seleccion_skill: null,
    ultimo_commit_revisado: null, revision_codex: false, tokens_diseno: null, tokens_implementacion: null,
    tokens_revision: null, creado: '2026-11-10', actualizado: '2026-11-10', dependencias: [],
  };
}
const CTX_DISENO: ContextoFlujo = {
  planRedactado: true, veredicto: null, veredictoCodex: null, modoCongelado: true, rondaRevision: 0, informeEnCommitPropio: true,
};
const MODOS: ModoFlujo[] = ['manual', 'semiautomatico', 'automatico'];

test('siguienteFase (TASK-097): con mas de una hora pregunta en los TRES modos, manual incluido', () => {
  for (const modo of MODOS) {
    for (const duracionEstimada of [{ tipo: 'ok', minutos: 90 }, { tipo: 'ilegible', valor: '2 horas' }] as const) {
      const r = siguienteFase(enDiseno(), { ...CTX_DISENO, duracionEstimada }, modo);
      assert.equal(r.fase, 'approve', modo);
      assert.equal(r.accion, 'preguntar', `${modo}, ${duracionEstimada.tipo}`);
      assert.match(r.motivo, /regla de una hora/);
    }
  }
});

test('siguienteFase (TASK-097): con 60 min o sin la linea, cada modo hace lo de siempre', () => {
  const esperado: Record<ModoFlujo, string> = { manual: 'detener', semiautomatico: 'preguntar', automatico: 'continuar' };
  for (const modo of MODOS) {
    for (const duracionEstimada of [{ tipo: 'ok', minutos: 60 }, { tipo: 'ausente' }] as const) {
      const r = siguienteFase(enDiseno(), { ...CTX_DISENO, duracionEstimada }, modo);
      assert.equal(r.accion, esperado[modo], `${modo}, ${duracionEstimada.tipo}`);
      assert.doesNotMatch(r.motivo, /regla de una hora/);
    }
  }
});
