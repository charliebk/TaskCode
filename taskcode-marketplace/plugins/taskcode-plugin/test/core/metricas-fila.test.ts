/**
 * TASK-064: la fila enriquecida de `taskctl metricas`, en puro. Desglose de
 * `## Coste` frente a `tokens_<fase>` (nunca recortado a 0, repetidas
 * avisadas), hallazgos una vez por tarea (revisor + ID) con severidad sin
 * distinguir mayusculas ni tildes, «sin tabla = sin dato», lecturas y
 * terminadas sin coste.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerCostes, resumirCostes, type FilaCoste } from '../../src/core/coste-registro.js';
import { leerHallazgos, resumirHallazgos, severidadDe, type InformeLeido } from '../../src/core/informe-revision.js';
import {
  COLUMNAS_DESGLOSE_TOKENS,
  COLUMNAS_METRICAS,
  avisoInformesSinTabla,
  avisosDeFila,
  calcularFila,
  claveTarea,
  mediana,
  medianaLecturas,
  notasFilaEnriquecida,
  tareasSinCoste,
  type EntradaMetricas,
} from '../../src/core/metricas.js';
import { rondaYRevisorDeInforme } from '../../src/fs/rondas.js';
import type { Task } from '../../src/core/task.js';

function tarea(o: Partial<Task> = {}): Task {
  return {
    id: 'TASK-007',
    titulo: 'Medir',
    tipo: 'fix',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'terminada',
    plan_aprobado: true,
    rama: null,
    asignado_a: null,
    agente_revisor: null,
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: '2026-10-01',
    actualizado: '2026-10-05',
    dependencias: [],
    ...o,
  } as Task;
}

function entrada(o: Partial<EntradaMetricas> = {}): EntradaMetricas {
  return { task: tarea(), body: '## Objetivo\n\nAlgo.\n', ronda: 0, eventosGit: [], ...o };
}

function agente(fase: FilaCoste['fase'], fuente: string, e: number, w: number, r: number, s: number, l: number | null): FilaCoste {
  return {
    fecha: '2026-10-25T10:00:00Z',
    fase,
    fuente,
    entrada: e,
    cacheEscritura: w,
    cacheLectura: r,
    salida: s,
    lecturas: l,
    total: e + w + r + s,
  };
}

function manual(fase: FilaCoste['fase'], total: number): FilaCoste {
  return {
    fecha: '2026-10-25T11:00:00Z',
    fase,
    fuente: 'manual',
    entrada: null,
    cacheEscritura: null,
    cacheLectura: null,
    salida: null,
    lecturas: null,
    total,
  };
}

function filaTexto(f: FilaCoste): string {
  const c = (n: number | null): string => (n === null ? '-' : String(n));
  return `| ${f.fecha} | ${f.fase} | ${f.fuente} | ${c(f.entrada)} | ${c(f.cacheEscritura)} | ${c(f.cacheLectura)} | ${c(f.salida)} | ${c(f.lecturas)} | ${String(f.total)} |`;
}

function cuerpoConCoste(filas: readonly FilaCoste[], extra = ''): string {
  return (
    '## Objetivo\n\nAlgo.\n\n## Criterios de aceptacion\n- [ ] uno\n- [ ] dos\n- [ ] tres\n\n## Coste\n\n' +
    '| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |\n' +
    '|---|---|---|---|---|---|---|---|---|\n' +
    filas.map(filaTexto).join('\n') +
    '\n' +
    extra
  );
}

// --- Coste -------------------------------------------------------------------

test('resumirCostes: nuevos = entrada + escritura + salida, lectura de cache aparte, y lo manual queda sin desglose', () => {
  const filas = [agente('diseno', 'agente:a1', 10, 200, 3000, 40, 7), manual('diseno', 500), agente('revision', 'agente:b2', 1, 2, 3, 4, null)];
  const r = resumirCostes(filas, { diseno: 3750, implementacion: 900, revision: 10 });
  assert.equal(r.conTabla, true);
  // 10+200+3000+40 = 3250 desglosado; 3750 - 3250 = 500 (la fila manual).
  assert.deepEqual(r.fases.diseno, {
    registrado: 3750,
    filas: 2,
    desglosado: 3250,
    nuevos: 250,
    cacheLectura: 3000,
    sinDesglose: 500,
    lecturas: 7,
  });
  // Fase sin filas pero con total: todo sin desglose (coste anterior a la tabla).
  assert.equal(r.fases.implementacion.sinDesglose, 900);
  assert.equal(r.fases.implementacion.lecturas, null, 'sin filas no hay lecturas: no medido, no 0');
  // lecturas null en la unica fila de revision: no medido.
  assert.equal(r.fases.revision.lecturas, null);
  assert.equal(r.fases.revision.sinDesglose, 0);
  assert.deepEqual(r.repetidas, []);
});

test('resumirCostes: diferencia negativa sin recortar a 0; fase sin total ni filas es null', () => {
  const r = resumirCostes([agente('implementacion', 'agente:x', 100, 100, 100, 100, 3)], {
    diseno: null,
    implementacion: 250,
    revision: null,
  });
  assert.equal(r.fases.implementacion.sinDesglose, -150);
  assert.equal(r.fases.diseno.sinDesglose, null);
  // Sin tabla: conTabla false aunque haya totales.
  assert.equal(resumirCostes([], { diseno: 5, implementacion: null, revision: null }).conTabla, false);
});

test('resumirCostes: un agente en dos filas de la misma fase es repetida (tambien dentro de una lista); manual no', () => {
  const filas = [
    agente('diseno', 'agente:a1', 1, 1, 1, 1, 1),
    agente('diseno', 'agente:a1', 1, 1, 1, 1, 1),
    agente('implementacion', 'agente:b2,c3', 1, 1, 1, 1, 1),
    agente('implementacion', 'agente:c3', 1, 1, 1, 1, 1),
    agente('revision', 'agente:a1', 1, 1, 1, 1, 1),
    manual('revision', 10),
    manual('revision', 10),
  ];
  const r = resumirCostes(filas, { diseno: 8, implementacion: 8, revision: 24 });
  assert.deepEqual(r.repetidas, [
    { fase: 'diseno', fuente: 'a1', filas: 2 },
    { fase: 'implementacion', fuente: 'c3', filas: 2 },
  ]);
  // No se deduplica: las dos filas de a1 suman.
  assert.equal(r.fases.diseno.desglosado, 8);
  assert.equal(r.fases.diseno.sinDesglose, 0);
});

// MEN-1 de TASK-063: una seccion `## Coste` REAL con un bloque de codigo que
// contiene una fila valida. Sin la guarda de bloques, leerCostes la contaria.
test('leerCostes: una fila valida dentro de un bloque de codigo en una seccion ## Coste real no cuenta', () => {
  const buena = agente('diseno', 'agente:a1', 1, 2, 3, 4, 5);
  const citada = agente('revision', 'agente:zz', 100, 100, 100, 100, 100);
  const body = cuerpoConCoste([buena], `\nEjemplo citado:\n\n\`\`\`\n${filaTexto(citada)}\n\`\`\`\n`);
  assert.deepEqual(leerCostes(body), [buena]);
});

// --- Hallazgos ---------------------------------------------------------------

test('severidadDe: sin distinguir mayusculas, tildes ni enfasis; fuera del vocabulario, null', () => {
  for (const [celda, esperado] of [
    ['IMPORTANTE', 'IMPORTANTE'],
    ['Importante', 'IMPORTANTE'],
    ['importante', 'IMPORTANTE'],
    ['Crítico', 'CRITICO'],
    ['**CRÍTICO**', 'CRITICO'],
    ['menor', 'MENOR'],
    ['Alta', null],
    ['Major', null],
    ['', null],
  ] as const) {
    assert.equal(severidadDe(celda), esperado, celda);
  }
  const lectura = leerHallazgos('## Hallazgos\n\n| ID | Severidad | Estado |\n|---|---|---|\n| IMP-1 | Importante | abierto |\n');
  assert.equal(lectura.hallazgos[0]?.severidadReconocida, 'IMPORTANTE');
  assert.equal(lectura.hallazgos[0]?.severidad, 'Importante', 'la celda original no se toca (review la imprime)');
});

const tabla = (filas: string): string =>
  `- Veredicto: aprobada\n\n## Hallazgos\n\n| ID | Severidad | Estado | Fichero | Origen |\n|---|---|---|---|---|\n${filas}`;

function informe(fichero: string, texto: string): InformeLeido {
  const r = rondaYRevisorDeInforme(fichero);
  assert.ok(r, fichero);
  return { fichero, ...r, texto };
}

test('resumirHallazgos: un hallazgo repetido entre rondas cuenta una vez, con la severidad y el origen de la ultima', () => {
  const r = resumirHallazgos([
    informe('informe-revision-2.md', tabla('| IMP-1 | Menor | corregido | a.ts | plan |\n| MEN-2 | menor | abierto | b.ts | |\n')),
    informe('informe-revision-1.md', tabla('| IMP-1 | IMPORTANTE | abierto | a.ts | implementacion |\n| CRIT-1 | Crítico | abierto | c.ts | especificacion |\n')),
  ]);
  assert.equal(r.informes, 2);
  // IMP-1 (ronda 2 manda: MENOR, plan), CRIT-1, MEN-2.
  assert.deepEqual(r.porSeveridad, { CRITICO: 1, IMPORTANTE: 0, MENOR: 2, desconocida: 0 });
  assert.deepEqual(r.porOrigen, { implementacion: 0, plan: 1, especificacion: 1, 'sin clasificar': 1 });
});

test('resumirHallazgos: la clave es revisor + ID: el mismo ID de dos revisores son dos hallazgos', () => {
  const r = resumirHallazgos([
    informe('informe-revision-1-java-spring-reviewer.md', tabla('| MEN-1 | MENOR | abierto | a | |\n')),
    informe('informe-revision-1-code-quality-reviewer.md', tabla('| MEN-1 | MENOR | abierto | b | |\n')),
    informe('informe-revision-2-code-quality-reviewer.md', tabla('| men-1 | MENOR | corregido | b | |\n')),
  ]);
  assert.deepEqual(r.porSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 2, desconocida: 0 });
});

test('resumirHallazgos: sin informes = no medido; un informe sin tabla = sin dato (null), no cero', () => {
  const vacio = resumirHallazgos([]);
  assert.equal(vacio.informes, 0);
  assert.equal(vacio.porSeveridad, null);
  assert.equal(vacio.porOrigen, null);

  const r = resumirHallazgos([
    informe('informe-revision-1.md', '- Veredicto: cambios-solicitados\n\nTodo en prosa: falta un test.\n'),
    informe('informe-revision-2.md', tabla('| IMP-1 | IMPORTANTE | corregido | a | |\n')),
  ]);
  assert.equal(r.porSeveridad, null, 'contar solo la ronda 2 daria una cifra menor que la real');
  assert.deepEqual(r.informesSinTabla, ['informe-revision-1.md']);
});

test('resumirHallazgos: severidad fuera de vocabulario cuenta como desconocida y se lista con su fichero', () => {
  const r = resumirHallazgos([
    informe('informe-revision-1.md', tabla('| A-1 | Alta | abierto | a | |\n| B-1 |  | abierto | b | |\n| C-1 | menor | abierto | c | |\n')),
  ]);
  assert.deepEqual(r.porSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 1, desconocida: 2 });
  assert.deepEqual(r.severidadesDesconocidas, [
    { fichero: 'informe-revision-1.md', id: 'A-1', valor: 'Alta' },
    { fichero: 'informe-revision-1.md', id: 'B-1', valor: '' },
  ]);
});

test('rondaYRevisorDeInforme: ronda y sufijo; lo que no es informe, null', () => {
  assert.deepEqual(rondaYRevisorDeInforme('informe-revision-3.md'), { ronda: 3, revisor: '' });
  assert.deepEqual(rondaYRevisorDeInforme('informe-revision-2-java-spring-reviewer.md'), { ronda: 2, revisor: 'java-spring-reviewer' });
  assert.equal(rondaYRevisorDeInforme('peticion-revision-1.md'), null);
  assert.equal(rondaYRevisorDeInforme('informe-codex-1.md'), null);
});

// --- La fila y su salida -----------------------------------------------------

test('calcularFila: campos siempre presentes, con «—» donde no hay dato', () => {
  const f = calcularFila(entrada({ proyecto: 'demo' }));
  assert.equal(f.proyecto, 'demo');
  assert.equal(f.tipo, 'fix');
  assert.equal(f.coste.conTabla, false);
  assert.equal(f.hallazgos.informes, 0);
  assert.deepEqual(f.kbPeticionPorRonda, []);
  assert.equal(claveTarea('a', 'TASK-001') === claveTarea('b', 'TASK-001'), false, 'mismo id en dos proyectos no choca');
  const celdas = Object.fromEntries(COLUMNAS_METRICAS.map((c) => [c.cabecera, c.valor(f)]));
  assert.deepEqual([celdas.crit, celdas.imp, celdas.men, celdas.hall_origen], ['—', '—', '—', '—']);
  assert.deepEqual(COLUMNAS_DESGLOSE_TOKENS.map((c) => c.valor(f)), ['—', '—', '—']);
});

test('calcularFila: desglose, hallazgos, criterios y KB de peticion por ronda (sumando las partes de una ronda)', () => {
  const body = cuerpoConCoste([agente('diseno', 'agente:a1', 10, 20, 300, 40, 9), manual('implementacion', 1000)]);
  const f = calcularFila(
    entrada({
      task: tarea({ tokens_diseno: 370, tokens_implementacion: 1000, tokens_revision: null }),
      body,
      ronda: 2,
      informes: [informe('informe-revision-1.md', tabla('| IMP-1 | Importante | abierto | a | implementacion |\n'))],
      peticiones: [
        { ronda: 2, bytes: 2048 },
        { ronda: 1, bytes: 1024 },
        { ronda: 2, bytes: 1024 },
      ],
    })
  );
  assert.equal(f.criterios, 3);
  assert.deepEqual(f.kbPeticionPorRonda, [
    { ronda: 1, kb: 1 },
    { ronda: 2, kb: 3 },
  ]);
  assert.deepEqual(COLUMNAS_DESGLOSE_TOKENS.map((c) => c.valor(f)), ['70', '300', '1000']);
  const celdas = Object.fromEntries(COLUMNAS_METRICAS.map((c) => [c.cabecera, c.valor(f)]));
  assert.deepEqual([celdas.crit, celdas.imp, celdas.men, celdas.hall_origen], ['0', '1', '0', '1/0/0/0']);
});

test('avisosDeFila: negativa, total vacio con filas, repetidas y severidades desconocidas, con la tarea y el fichero', () => {
  const body = cuerpoConCoste([
    agente('diseno', 'agente:a1', 100, 0, 0, 0, null),
    agente('diseno', 'agente:a1', 100, 0, 0, 0, null),
    agente('revision', 'agente:r1', 5, 0, 0, 0, null),
  ]);
  const f = calcularFila(
    entrada({
      task: tarea({ tokens_diseno: 150 }),
      body,
      informes: [informe('informe-revision-1.md', tabla('| X-1 | Major | abierto | a | |\n'))],
    })
  );
  const avisos = avisosDeFila(f);
  assert.equal(avisos.length, 4, avisos.join('\n'));
  assert.match(avisos[0] as string, /^TASK-007: lo desglosado .* diseno \(200\) supera tokens_diseno \(150\): diferencia -50/);
  assert.match(avisos[1] as string, /^TASK-007: tokens_revision esta vacio pero "## Coste" tiene 1 fila/);
  assert.match(avisos[2] as string, /^TASK-007: en "## Coste", a1 aparece en 2 filas de diseno/);
  assert.match(avisos[3] as string, /^TASK-007 revision\/informe-revision-1\.md: severidad fuera de vocabulario .* X-1 \("Major"\)/);
  // La columna muestra el negativo sumado, sin recortar, y marcado (MEN-1 de la ronda 1).
  assert.equal(COLUMNAS_DESGLOSE_TOKENS[2]?.valor(f), '-55*');
});

test('notas: informes sin tabla, mediana de lecturas por fase y terminadas sin coste', () => {
  const conLecturas = (id: string, l: number, estado: Task['estado'] = 'terminada') =>
    calcularFila(
      entrada({
        task: tarea({ id, estado, tokens_diseno: 4, tokens_implementacion: 4, tokens_revision: 4 }),
        body: cuerpoConCoste([agente('diseno', 'agente:a', 1, 1, 1, 1, l)]),
      })
    );
  const sinTabla = calcularFila(
    entrada({
      task: tarea({ id: 'TASK-009', tokens_diseno: 5, tokens_implementacion: 0 }),
      informes: [informe('informe-revision-1.md', 'Sin tabla.\n')],
    })
  );
  const enCurso = calcularFila(entrada({ task: tarea({ id: 'TASK-010', estado: 'en-curso' }) }));
  const filas = [conLecturas('TASK-001', 4), conLecturas('TASK-002', 10), conLecturas('TASK-003', 7), conLecturas('TASK-004', 1), sinTabla, enCurso];

  assert.equal(mediana([]), null);
  assert.equal(mediana([3, 1, 2]), 2);
  assert.equal(mediana([4, 10, 7, 1]), 5.5);
  assert.deepEqual(medianaLecturas(filas).diseno, { mediana: 5.5, n: 4 });
  assert.deepEqual(medianaLecturas(filas).revision, { mediana: null, n: 0 });

  // tokens_implementacion a 0 cuenta como falta (registrar-coste no deja registrar 0).
  assert.deepEqual(tareasSinCoste(filas), [{ id: 'TASK-009', fases: ['implementacion', 'revision'] }]);

  const notas = notasFilaEnriquecida(filas).join('\n');
  assert.match(notas, /Informes sin tabla de hallazgos: 1 \(en 1 tareas\)/);
  assert.match(notas, /diseno 5\.5 \(n=4\), implementacion — \(n=0\), revision — \(n=0\)/);
  assert.match(notas, /Terminadas sin coste en alguna fase: 1 de 5: TASK-009 \(implementacion, revision\)\./);
  assert.match(avisoInformesSinTabla(filas) ?? '', /^1 informe\(s\) de revision sin tabla .* TASK-009\.$/);
  assert.equal(avisoInformesSinTabla([enCurso]), null);
});

// --- Ronda 1 de revision de TASK-064 ------------------------------------------

// IMP-1: la fila-marcador «sin hallazgos» no es un hallazgo.
test('resumirHallazgos: la fila «sin hallazgos» y sus variantes se descartan sin aviso', () => {
  for (const marcador of [
    '| (ninguno) | — | sin hallazgos | — | |\n',
    '| (Ninguno) | - | - | - | |\n',
    '| — | — | — | — | |\n',
    '| X | | Sin hallazgos | | |\n',
    '|  |  | abierto |  | |\n',
  ]) {
    const r = resumirHallazgos([informe('informe-revision-1.md', tabla(marcador))]);
    assert.deepEqual(r.porSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 0 }, marcador);
    assert.deepEqual(r.porOrigen, { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 0 }, marcador);
    assert.deepEqual(r.severidadesDesconocidas, [], marcador);
  }
});

// IMP-2 (a): la severidad se reconoce por su primera palabra.
test('severidadDe: por la primera palabra, con anotaciones detras', () => {
  for (const [celda, esperado] of [
    ['IMPORTANTE (no verificado por ejecucion)', 'IMPORTANTE'],
    ['MENOR (no verificado)', 'MENOR'],
    ['IMPORTANTE (ronda 1)', 'IMPORTANTE'],
    ['**Crítico** (ronda 2)', 'CRITICO'],
    ['menor, cosmetico', 'MENOR'],
    ['Alta (ronda 1)', null],
    ['IMPORTANTES', null],
    ['—', null],
  ] as const) {
    assert.equal(severidadDe(celda), esperado, celda);
  }
});

// IMP-2 (b): cada campo toma la ultima ronda en la que esta reconocido.
test('resumirHallazgos: severidad y origen de la ultima ronda que los reconoce, campo a campo', () => {
  const r = resumirHallazgos([
    informe('informe-revision-1.md', tabla('| IMP-1 | IMPORTANTE | abierto | a | plan |\n| MEN-1 | Alta | abierto | b | implementacion |\n')),
    informe('informe-revision-2.md', tabla('| IMP-1 | IMPORTANTE (ronda 1) | corregido | a | |\n| MEN-1 | menor | corregido | b | quien sabe |\n')),
    informe('informe-revision-3.md', tabla('| IMP-1 | ¿? | corregido | a | |\n')),
  ]);
  assert.deepEqual(r.porSeveridad, { CRITICO: 0, IMPORTANTE: 1, MENOR: 1, desconocida: 0 });
  assert.deepEqual(r.porOrigen, { implementacion: 1, plan: 1, especificacion: 0, 'sin clasificar': 0 });
  // Los avisos siguen saliendo por cada celda no reconocida, aunque otra ronda la reconozca.
  assert.deepEqual(
    r.severidadesDesconocidas.map((d) => [d.fichero, d.id]),
    [
      ['informe-revision-1.md', 'MEN-1'],
      ['informe-revision-3.md', 'IMP-1'],
    ]
  );
  // Si ninguna ronda la reconoce, queda desconocida / sin clasificar.
  const nunca = resumirHallazgos([
    informe('informe-revision-1.md', tabla('| X-1 | Alta | abierto | a | |\n')),
    informe('informe-revision-2.md', tabla('| X-1 | Major | abierto | a | ninguno |\n')),
  ]);
  assert.deepEqual(nunca.porSeveridad, { CRITICO: 0, IMPORTANTE: 0, MENOR: 0, desconocida: 1 });
  assert.deepEqual(nunca.porOrigen, { implementacion: 0, plan: 0, especificacion: 0, 'sin clasificar': 1 });
});

// MEN-1: un negativo en alguna fase marca la celda aunque la suma sea positiva.
test('tok_sin_desglose: con alguna fase negativa la celda lleva "*" aunque la suma sea positiva', () => {
  const body = cuerpoConCoste([manual('diseno', 1000), agente('revision', 'agente:r1', 10, 20, 300, 40, 3)]);
  const f = calcularFila(entrada({ task: tarea({ tokens_diseno: 1000, tokens_revision: 100 }), body }));
  assert.equal(COLUMNAS_DESGLOSE_TOKENS[2]?.valor(f), '730*');
  const sano = calcularFila(entrada({ task: tarea({ tokens_diseno: 1000 }), body: cuerpoConCoste([manual('diseno', 1000)]) }));
  assert.equal(COLUMNAS_DESGLOSE_TOKENS[2]?.valor(sano), '1000');
});

// MEN-2: solo filas manual = nada medido de nuevos ni de cache.
test('tok_nuevos y tok_cache_lect: «—» si ninguna fila de "## Coste" tiene desglose', () => {
  const f = calcularFila(
    entrada({ task: tarea({ tokens_diseno: 800 }), body: cuerpoConCoste([manual('diseno', 500), manual('diseno', 300)]) })
  );
  assert.deepEqual(COLUMNAS_DESGLOSE_TOKENS.map((c) => c.valor(f)), ['—', '—', '800']);
});

// MEN-6: los dos mutantes que sobrevivieron.
test('resumirCostes: un id repetido dentro de la misma fuente no es una fila repetida', () => {
  const r = resumirCostes([agente('diseno', 'agente:a1,a1', 1, 1, 1, 1, 1)], { diseno: 4, implementacion: null, revision: null });
  assert.deepEqual(r.repetidas, []);
});

test('resumirCostes: una fila a medias (salida «—») no cuenta como desglose', () => {
  const media: FilaCoste = { ...agente('diseno', 'agente:a1', 10, 20, 300, 40, 2), salida: null, total: 330 };
  const r = resumirCostes([media], { diseno: 330, implementacion: null, revision: null });
  assert.equal(r.fases.diseno.desglosado, 0);
  assert.equal(r.fases.diseno.nuevos, 0);
  assert.equal(r.fases.diseno.sinDesglose, 330);
});
