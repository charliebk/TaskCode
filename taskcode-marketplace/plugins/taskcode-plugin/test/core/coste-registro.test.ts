/**
 * TASK-063: la tabla `## Coste` del cuerpo de tarea.md. Puro: anade sin
 * reescribir, deja intacto el cuerpo antiguo y lee solo filas validas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anadirCoste,
  CABECERA_COSTE,
  idsDeFuente,
  leerCostes,
  resumirCostes,
  SECCION_COSTE,
  type FilaCoste,
} from '../../src/core/coste-registro.js';
import { anadirTransicion, leerTransiciones } from '../../src/core/transiciones.js';

const AGENTE: FilaCoste = {
  fecha: '2026-10-25T14:03:22Z',
  fase: 'diseno',
  fuente: 'agente:a1b2c3d4e5f60718',
  entrada: 120,
  cacheEscritura: 3000,
  cacheLectura: 90000,
  salida: 800,
  lecturas: 14,
  total: 93920,
};

const MANUAL: FilaCoste = {
  fecha: '2026-10-25T15:10:00Z',
  fase: 'implementacion',
  fuente: 'manual',
  entrada: null,
  cacheEscritura: null,
  cacheLectura: null,
  salida: null,
  lecturas: null,
  total: 5000,
};

const ANTIGUO = '## Objetivo\nAlgo.\n\n## Criterios de aceptacion\n- [ ] uno\n';

test('cuerpo sin seccion: la crea al final, deja el resto byte a byte y la fila se lee igual', () => {
  const body = anadirCoste(ANTIGUO, AGENTE);
  assert.ok(body.startsWith(ANTIGUO), 'el cuerpo antiguo queda intacto delante');
  assert.equal(
    body.slice(ANTIGUO.length),
    '\n## Coste\n\n' +
      `${CABECERA_COSTE}\n` +
      '|---|---|---|---|---|---|---|---|---|\n' +
      '| 2026-10-25T14:03:22Z | diseno | agente:a1b2c3d4e5f60718 | 120 | 3000 | 90000 | 800 | 14 | 93920 |\n'
  );
  assert.deepEqual(leerCostes(body), [AGENTE]);
});

test('una tarea antigua sin tabla no tiene filas, y leer no falla con basura', () => {
  assert.deepEqual(leerCostes(ANTIGUO), []);
  assert.deepEqual(leerCostes(''), []);
  assert.deepEqual(leerCostes(`${SECCION_COSTE}\n\nsolo prosa\n`), []);
});

test('la segunda fila va detras de la ultima de la tabla, sin reescribir la primera; la manual lleva "-"', () => {
  const una = anadirCoste(ANTIGUO, AGENTE);
  const dos = anadirCoste(una + '\nTexto despues de la tabla.\n', MANUAL);
  assert.match(dos, /\| 93920 \|\n\| 2026-10-25T15:10:00Z \| implementacion \| manual \| - \| - \| - \| - \| - \| 5000 \|\n\nTexto despues/);
  assert.deepEqual(leerCostes(dos), [AGENTE, MANUAL]);
});

test('convive con ## Transiciones en cualquier orden: cada una escribe y lee solo la suya', () => {
  const t = { fecha: '2026-10-25T13:30:44Z', fase: 'plan', modo: 'automatico', decidido_por: 'persona' } as const;
  // Transiciones antes que Coste (lo normal: plan antes del primer coste).
  let body = anadirTransicion(ANTIGUO, t);
  body = anadirCoste(body, AGENTE);
  body = anadirTransicion(body, { ...t, fase: 'approve' });
  body = anadirCoste(body, MANUAL);
  assert.deepEqual(leerCostes(body), [AGENTE, MANUAL]);
  assert.deepEqual(
    leerTransiciones(body).map((f) => f.fase),
    ['plan', 'approve']
  );
  // La fila de approve quedo en su seccion, no debajo de la de coste.
  const iTrans = body.indexOf('## Transiciones');
  const iCoste = body.indexOf('## Coste');
  const iApprove = body.indexOf('| approve |');
  assert.ok(iTrans < iApprove && iApprove < iCoste, body);
});

test('una tabla de ejemplo dentro de un bloque de codigo no es el registro', () => {
  const conEjemplo =
    ANTIGUO +
    '\n```markdown\n## Coste\n\n' +
    `${CABECERA_COSTE}\n|---|---|---|---|---|---|---|---|---|\n` +
    '| 2026-01-01T00:00:00Z | diseno | manual | - | - | - | - | - | 1 |\n```\n';
  assert.deepEqual(leerCostes(conEjemplo), []);
  const body = anadirCoste(conEjemplo, MANUAL);
  assert.ok(body.startsWith(conEjemplo), 'el ejemplo no se toca');
  assert.deepEqual(leerCostes(body), [MANUAL]);
});

test('CRLF se respeta al anadir', () => {
  const crlf = ANTIGUO.replace(/\n/g, '\r\n');
  const una = anadirCoste(crlf, AGENTE);
  const dos = anadirCoste(una, MANUAL);
  assert.ok(!/[^\r]\n/.test(dos), 'ningun salto sin \\r');
  assert.deepEqual(leerCostes(dos), [AGENTE, MANUAL]);
});

test('filas editadas a mano con valores raros se ignoran; fecha de dia vale', () => {
  const body =
    `${SECCION_COSTE}\n\n${CABECERA_COSTE}\n|---|---|---|---|---|---|---|---|---|\n` +
    '| 2026-10-25 | revision | manual | - | - | - | - | - | 7 |\n' + // valida (dia)
    '| 2026-02-30 | revision | manual | - | - | - | - | - | 7 |\n' + // dia inexistente
    '| 2026-10-25 | curso | manual | - | - | - | - | - | 7 |\n' + // fase desconocida
    '| 2026-10-25 | revision |  | - | - | - | - | - | 7 |\n' + // sin fuente
    '| 2026-10-25 | revision | manual | 1,5 | - | - | - | - | 7 |\n' + // no entero
    '| 2026-10-25 | revision | manual | - | - | - | - | - | - |\n' + // sin total
    '| 2026-10-25 | revision | manual | - | - | - | - | 7 |\n'; // columnas de menos
  assert.deepEqual(leerCostes(body), [{ ...MANUAL, fecha: '2026-10-25', fase: 'revision', total: 7 }]);
});

// TASK-065: la fila de diferencia de un agente reanudado no es una repeticion.
test('idsDeFuente reconoce dif:<id>; resumirCostes no avisa de un agente con su fila de diferencia, si de uno registrado dos veces', () => {
  assert.deepEqual(idsDeFuente('agente:a1,dif:b2'), [
    { id: 'a1', diferencia: false },
    { id: 'b2', diferencia: true },
  ]);
  assert.deepEqual(idsDeFuente('manual'), [{ id: 'manual', diferencia: false }]);
  const reg = { diseno: 2 * AGENTE.total, implementacion: null, revision: null };
  const conDif = resumirCostes([AGENTE, { ...AGENTE, fuente: 'agente:dif:a1b2c3d4e5f60718' }], reg);
  assert.deepEqual(conDif.repetidas, []);
  assert.equal(conDif.fases.diseno.sinDesglose, 0, 'la diferencia cuenta en el desglose');
  const dosVeces = resumirCostes([AGENTE, AGENTE], reg);
  assert.deepEqual(dosVeces.repetidas, [{ fase: 'diseno', fuente: 'a1b2c3d4e5f60718', filas: 2 }]);
});
