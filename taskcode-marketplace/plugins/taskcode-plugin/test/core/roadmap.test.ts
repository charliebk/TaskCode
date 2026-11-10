/**
 * TASK-098: generacion y comparacion del ROADMAP, puras (sin disco ni Git).
 * Lo que toca Git y las transiciones esta en test/commands/roadmap*.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extraerZonaManual,
  generarRoadmap,
  llevaMarcaTaskctl,
  MARCA_TASKCTL,
  RoadmapError,
  titulosDeHitos,
  ZONA_MANUAL_POR_DEFECTO,
  type TareaRoadmap,
} from '../../src/core/roadmap.js';
import { compararRoadmaps, extraerEstructura } from '../../src/core/roadmap-comparar.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// dist/test/core -> raiz del paquete -> test/fixtures/roadmap
const FIXTURES = path.join(HERE, '..', '..', '..', 'test', 'fixtures', 'roadmap');

function t(id: string, extra: Partial<TareaRoadmap> = {}): TareaRoadmap {
  return { id, titulo: `Titulo ${id}`, sprint: 0, complejidad: 'media', estado: 'planificada', dependencias: [], ...extra };
}

const MANUAL = [
  '<!-- manual:inicio (se edita a mano) -->',
  'Texto libre de la persona, con | barras y `codigo`.',
  '',
  '### H2 — Segundo en el tiempo',
  '',
  '### H1 — Primero en el tiempo',
  '<!-- manual:fin -->',
].join('\n');

/** Filas de tarea en el orden en que salen, como "Paso TASK". */
function filas(texto: string): string[] {
  return [...texto.matchAll(/^\| (\S+) \| (TASK-\d+) \|/gm)].map((m) => `${m[1]} ${m[2]}`);
}

test('generarRoadmap: la marca va exacta en la tercera linea y la zona manual se conserva byte a byte', () => {
  const g = generarRoadmap([t('TASK-001')], MANUAL);
  const lineas = g.texto.split('\n');
  assert.equal(lineas[0], '# Roadmap de tareas');
  assert.equal(lineas[2], MARCA_TASKCTL);
  assert.ok(llevaMarcaTaskctl(g.texto));
  assert.equal(extraerZonaManual(g.texto), MANUAL);
  // Regenerar desde lo generado no cambia nada: ni fecha ni hora en la salida.
  assert.equal(generarRoadmap([t('TASK-001')], extraerZonaManual(g.texto)).texto, g.texto);
  assert.ok(g.texto.endsWith('|\n'));
  assert.doesNotMatch(g.texto, /\d{4}-\d{2}-\d{2}/);
});

test('generarRoadmap: sin zona manual usa la de por defecto, que se reconoce al releerla', () => {
  const g = generarRoadmap([], null);
  assert.equal(extraerZonaManual(g.texto), ZONA_MANUAL_POR_DEFECTO);
  assert.match(g.texto, /\*\*En marcha:\*\* ninguna/);
  assert.match(g.texto, /\*\*Listas para empezar:\*\* ninguna/);
});

test('generarRoadmap: orden topologico; a igualdad, el hito anterior (orden de la zona manual) y el numero menor', () => {
  const tareas = [
    t('TASK-005', { sprint: 1 }),
    t('TASK-001', { sprint: 2, dependencias: ['TASK-006'] }),
    t('TASK-006', { sprint: 2 }),
    t('TASK-003', { sprint: 1, dependencias: ['TASK-001'] }),
    t('TASK-002', { sprint: 1, estado: 'terminada' }),
    t('TASK-009', { sprint: 7 }),
  ];
  const g = generarRoadmap(tareas, MANUAL);
  // H2 va antes que H1 porque asi lo ordena la zona manual; H7, sin titulo, al final.
  const hitos = [...g.texto.matchAll(/^## (H\d+ — .*)$/gm)].map((m) => m[1]);
  assert.deepEqual(hitos, ['H2 — Segundo en el tiempo', 'H1 — Primero en el tiempo', 'H7 — H7']);
  // TASK-006 antes que TASK-001 (dependencia) aunque tenga numero mayor;
  // TASK-003 depende de una de H2 que ya ha salido, asi que dentro de H1 va
  // por numero (antes que TASK-005); las terminadas no llevan paso.
  assert.deepEqual(filas(g.texto), ['1 TASK-006', '2 TASK-001', '— TASK-002', '3 TASK-003', '4 TASK-005', '5 TASK-009']);
  assert.match(g.texto, /^\| 3 \| TASK-003 \| Titulo TASK-003 \| media \| TASK-001 \| espera a TASK-001 \|$/m);
  assert.match(g.texto, /^\| — \| TASK-002 \| Titulo TASK-002 \| media \| — \| ✅ terminada \|$/m);
  assert.match(g.texto, /^1 de 3 terminadas\.$/m);
  assert.deepEqual(g.ciclos, []);
});

test('generarRoadmap: resumen de en marcha y listas para empezar, complejidad nula y | escapado en el titulo', () => {
  const g = generarRoadmap(
    [
      t('TASK-001', { estado: 'en-curso' }),
      t('TASK-002', { estado: 'en-revision', complejidad: null }),
      t('TASK-003', { estado: 'en-diseno' }),
      t('TASK-004', { titulo: 'a | b' }),
      t('TASK-005', { dependencias: ['TASK-001'] }),
    ],
    null
  );
  assert.match(g.texto, /^- \*\*En marcha:\*\* TASK-001 \(en curso\), TASK-002 \(en revisión\), TASK-003 \(en diseño\)$/m);
  assert.match(g.texto, /^- \*\*Listas para empezar:\*\* TASK-004$/m);
  assert.match(g.texto, /\| TASK-002 \| Titulo TASK-002 \| — \| — \| ▶ en revisión \|/);
  assert.match(g.texto, /\| TASK-004 \| a \\\| b \|/);
  assert.equal(extraerEstructura(g.texto).tareas.get('TASK-004')?.titulo, 'a | b');
});

test('generarRoadmap: un ciclo se informa en su seccion y en los avisos, sin lanzar y sin perder tareas', () => {
  const g = generarRoadmap(
    [
      t('TASK-001', { dependencias: ['TASK-002'] }),
      t('TASK-002', { dependencias: ['TASK-001'] }),
      t('TASK-003', { dependencias: ['TASK-002'] }),
      t('TASK-004'),
      t('TASK-005', { dependencias: ['TASK-999'] }),
    ],
    null
  );
  assert.deepEqual(g.ciclos, [['TASK-001', 'TASK-002', 'TASK-001']]);
  assert.match(g.texto, /^## Dependencias circulares$/m);
  assert.match(g.texto, /^- TASK-001 → TASK-002 → TASK-001$/m);
  assert.ok(g.avisos.some((a) => a.includes('dependencia circular: TASK-001 -> TASK-002 -> TASK-001')));
  assert.ok(g.avisos.some((a) => a.includes('TASK-005 depende de TASK-999, que no existe')));
  // Las cinco salen; las del ciclo y la que depende de el, al final.
  assert.deepEqual(filas(g.texto).map((f) => f.split(' ')[1]), ['TASK-004', 'TASK-005', 'TASK-001', 'TASK-002', 'TASK-003']);
});

test('llevaMarcaTaskctl: linea exacta en la tercera posicion, ignorando CRLF, nunca por subcadena', () => {
  assert.ok(llevaMarcaTaskctl(`# R\r\n\r\n${MARCA_TASKCTL}\r\n`));
  assert.equal(llevaMarcaTaskctl(`# R\n\n\n${MARCA_TASKCTL}\n`), false, 'en otra linea no vale');
  assert.equal(llevaMarcaTaskctl(`# R\n\n${MARCA_TASKCTL} \n`), false, 'con un espacio de mas no vale');
  assert.equal(llevaMarcaTaskctl(`# R\n\n<!-- generado por taskctl; formato 2; no editar fuera de la zona manual -->\n`), false);
  // Los dos ROADMAP reales mencionan "generado por" y "no editar a mano": no son nuestros.
  for (const f of ['toolsaweb.md', 'opendocktrading.md']) {
    assert.equal(llevaMarcaTaskctl(readFileSync(path.join(FIXTURES, f), 'utf8')), false, f);
  }
});

test('extraerZonaManual: reconoce la de OpenDockTrading por prefijo y rechaza una zona sin cerrar', () => {
  const odt = readFileSync(path.join(FIXTURES, 'opendocktrading.md'), 'utf8');
  const zona = extraerZonaManual(odt);
  assert.ok(zona !== null && zona.startsWith('<!-- manual:inicio (se edita a mano; scripts/grafo-tareas.py lo conserva) -->'));
  assert.ok(odt.includes(zona!));
  assert.equal(titulosDeHitos(zona).get(0), 'Diagnóstico y decisiones');
  assert.deepEqual([...titulosDeHitos(zona).keys()].slice(-2), [8, 7]);
  assert.equal(extraerZonaManual(readFileSync(path.join(FIXTURES, 'toolsaweb.md'), 'utf8')), null);
  assert.throws(() => extraerZonaManual('<!-- manual:inicio -->\nsin cierre\n'), RoadmapError);
  assert.throws(() => extraerZonaManual('texto\n<!-- manual:fin -->\n'), RoadmapError);
});

test('compararRoadmaps: identicos no dan diferencias; lista tareas, hitos, dependencias, estado y zona manual', () => {
  const base = [t('TASK-001', { sprint: 1 }), t('TASK-002', { sprint: 1, dependencias: ['TASK-001'] })];
  const a = generarRoadmap(base, MANUAL).texto;
  assert.deepEqual(compararRoadmaps(a, a), []);

  const b = generarRoadmap(
    [t('TASK-001', { sprint: 2, estado: 'terminada' }), t('TASK-002', { sprint: 1 }), t('TASK-003', { sprint: 1 })],
    MANUAL
  ).texto;
  const difs = compararRoadmaps(a, b);
  assert.ok(difs.includes('TASK-001: hito H1 en el actual y H2 en el generado.'), difs.join('\n'));
  assert.ok(difs.includes('TASK-001: estado "lista para empezar" en el actual y "✅ terminada" en el generado.'));
  assert.ok(difs.includes('TASK-002: depende de TASK-001 en el actual y de — en el generado.'));
  assert.ok(difs.includes('TASK-003: solo en el generado (H1).'));
  assert.ok(difs.includes('hito H2: solo en el generado ("Segundo en el tiempo").'));

  const sinManual = a.replace(MANUAL, '');
  assert.ok(compararRoadmaps(sinManual, a).some((d) => d.startsWith('zona manual: el ROADMAP actual no tiene')));
});

test('compararRoadmaps: lee los ROADMAP reales y declara no comparable lo que no casa', () => {
  const odt = readFileSync(path.join(FIXTURES, 'opendocktrading.md'), 'utf8');
  const e = extraerEstructura(odt);
  assert.equal(e.tareas.get('TASK-009')?.estado, '▶ en revisión');
  assert.deepEqual(e.tareas.get('TASK-009')?.dependencias, ['TASK-003', 'TASK-005', 'TASK-062']);
  assert.equal(e.hitos.get(0), 'Diagnóstico y decisiones');
  assert.deepEqual(e.noComparables, []);
  const tw = extraerEstructura(readFileSync(path.join(FIXTURES, 'toolsaweb.md'), 'utf8'));
  assert.ok(tw.tareas.size > 10);
  assert.equal(tw.zonaManual, null);

  const raro = `# R\n\n## H0 — x\n\n| 1 | TASK-001 | solo cuatro | celdas |\n`;
  assert.deepEqual(compararRoadmaps(raro, raro), ['fila no comparable en el actual: | 1 | TASK-001 | solo cuatro | celdas |']);
});

// H1 de la revision (ronda 1): texto propio fuera de la zona manual se perdia
// con `--escribir` y `--comparar` salia limpio.
test('compararRoadmaps: el texto propio fuera de la zona manual cuenta como diferencia', () => {
  const g = generarRoadmap([t('TASK-001', { sprint: 1 })], MANUAL).texto;
  const ajeno =
    g.replace(MARCA_TASKCTL, '<!-- generado por mi script -->') +
    '\nTEXTO PROPIO FUERA DE ZONA: contexto del negocio.\n\n## Notas de riesgos\n\nNO BORRAR: entregar H1 antes del 15.\n\n| Riesgo | Mitigacion |\n|---|---|\n| a | b |\n';
  const difs = compararRoadmaps(ajeno, g);
  for (const l of ['TEXTO PROPIO FUERA DE ZONA: contexto del negocio.', '## Notas de riesgos', 'NO BORRAR: entregar H1 antes del 15.', '| Riesgo | Mitigacion |', '| a | b |']) {
    assert.ok(difs.includes(`texto fuera de la zona manual que se perderia: ${l}`), `${l}\n${difs.join('\n')}`);
  }
  // Solo cambia la marca (comentario de una linea): sigue limpio.
  assert.deepEqual(compararRoadmaps(g.replace(MARCA_TASKCTL, '<!-- generado por mi script -->'), g), []);
  // Los resumenes que el generador recalcula no cuentan como texto propio.
  const otroResumen = g.replace('- **Listas para empezar:** TASK-001', '- **Listas para empezar:** ninguna');
  assert.ok(!compararRoadmaps(otroResumen, g).some((d) => d.startsWith('texto fuera')), compararRoadmaps(otroResumen, g).join('\n'));
});

// MEN-1 de la revision (ronda 1).
test('compararRoadmaps: compara titulo y complejidad y avisa de filas duplicadas', () => {
  const g = generarRoadmap([t('TASK-001', { sprint: 1 })], MANUAL).texto;
  const fila = g.split('\n').find((l) => l.includes('| TASK-001 |'))!;
  const cs = fila.split('|');
  const retocada = g.replace(fila, fila.replace(`|${cs[3]}|`, '| Otro titulo |').replace(`|${cs[4]}|`, '| compleja |'));
  const difs = compararRoadmaps(retocada, g);
  assert.ok(difs.some((d) => d.startsWith('TASK-001: titulo "Otro titulo"')), difs.join('\n'));
  assert.ok(difs.some((d) => d.startsWith('TASK-001: complejidad "compleja"')), difs.join('\n'));
  const duplicada = g.replace(fila, `${fila}\n${fila}`);
  assert.ok(compararRoadmaps(duplicada, g).some((d) => d.startsWith('fila duplicada en el actual')));
});

// MEN-2 de la revision (ronda 2): una fila propia dentro de la tabla de un
// hito tambien se perderia; solo se eximen la cabecera y el separador.
test('compararRoadmaps: una fila propia dentro de un hito cuenta como texto que se perderia', () => {
  const g = generarRoadmap([t('TASK-001', { sprint: 1 })], MANUAL).texto;
  const fila = g.split('\n').find((l) => l.includes('| TASK-001 |'))!;
  const ajeno = g.replace(MARCA_TASKCTL, '<!-- otro -->').replace(fila, `${fila}\n| Riesgo propio | dato perdido |`);
  assert.ok(
    compararRoadmaps(ajeno, g).includes('texto fuera de la zona manual que se perderia: | Riesgo propio | dato perdido |'),
    compararRoadmaps(ajeno, g).join('\n')
  );
  assert.deepEqual(compararRoadmaps(g.replace(MARCA_TASKCTL, '<!-- otro -->'), g), []);
});
