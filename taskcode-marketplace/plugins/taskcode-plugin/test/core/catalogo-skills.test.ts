/**
 * Tests de `src/core/catalogo-skills.ts` (TASK-017).
 *
 * Mismo criterio que heuristica.test.ts: los casos de error de
 * `parsearCatalogoSkills` MUTAN el YML real del repo
 * (scripts/catalogo-skills.yml), nunca un YAML paralelo inventado — la
 * base de cada caso negativo es, por construccion, un fichero que
 * parsea. `seleccionarSkill()` en cambio se prueba con catalogos
 * sinteticos en memoria: la funcion no toca disco, y el catalogo real
 * de 5 entradas (todas "taskcode-plugin", sin dos que empaten en
 * solape Y prioridad a la vez) no cubre por si solo escenarios como el
 * empate hasta prioridad o un origen "externo".
 *
 * Misma disciplina que TASK-032 dejo escrita en heuristica.test.ts: no
 * se reimplementa la tabla del catalogo con valores a mano (las
 * aserciones contra el catalogo real comprueban una PRECONDICION
 * explicita antes de asumir una relacion entre dos entradas), y ningun
 * test se conforma con "no lanza".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  CatalogoSkillsError,
  FICHERO_CATALOGO_SKILLS,
  parsearCatalogoSkills,
  seleccionarSkill,
} from '../../src/core/catalogo-skills.js';
import type { CatalogoSkills, EntradaCatalogoSkill } from '../../src/core/catalogo-skills.js';
import type { Task } from '../../src/core/task.js';

/** dist/test/core/ -> raiz del paquete, igual que en heuristica.test.ts. */
const RAIZ_PAQUETE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const RUTA_YML = path.join(RAIZ_PAQUETE, 'scripts', FICHERO_CATALOGO_SKILLS);
const BASE = readFileSync(RUTA_YML, 'utf8');

/** El catalogo real del repo. Todo caso positivo se mide contra este. */
const CATALOGO: CatalogoSkills = parsearCatalogoSkills(BASE, RUTA_YML);

// --------------------------------------------------------------------
// Utilidades de construccion
// --------------------------------------------------------------------

function tarea(campos: Partial<Task> = {}): Task {
  return {
    id: 'TASK-999',
    titulo: 'tarea de prueba',
    tipo: 'feature',
    sprint: 1,
    etiquetas: [],
    complejidad: 'media',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-999-prueba',
    asignado_a: null,
    regla_seleccion_skill: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-09-08',
    actualizado: '2026-09-08',
    dependencias: [],
    ...campos,
  };
}

function entradaSkill(campos: Partial<EntradaCatalogoSkill> = {}): EntradaCatalogoSkill {
  return {
    id: 'skill-x',
    origen: 'taskcode-plugin',
    marketplace: null,
    rol: 'ejecucion',
    prioridad: 0,
    etiquetas: [],
    patrones_archivo: [],
    descripcion: 'skill de prueba',
    ...campos,
  };
}

function sinLineaDe(clave: string, contenido: string = BASE): string {
  return contenido
    .split(/\r?\n/)
    .filter((l) => !l.startsWith(`${clave}:`))
    .join('\n');
}

function conValor(clave: string, valor: string, contenido: string = BASE): string {
  return contenido
    .split(/\r?\n/)
    .map((l) => (l.startsWith(`${clave}:`) ? `${clave}: ${valor}` : l))
    .join('\n');
}

function conLineaExtra(linea: string, contenido: string = BASE): string {
  return `${contenido}\n${linea}\n`;
}

/**
 * CatalogoSkillsError cuyo mensaje coincide con `re`. Sin exigir una
 * segunda linea indentada con instruccion: a diferencia de
 * heuristica.ts, aqui varios validadores (texto no vacio, enum, lista
 * con entrada vacia o repetida) se quedan en una sola linea a
 * proposito porque el propio nombre de la clave ya senala donde
 * corregir.
 */
function errorCatalogo(re: RegExp): (e: unknown) => boolean {
  return (e: unknown) => {
    assert.ok(e instanceof CatalogoSkillsError, `esperaba CatalogoSkillsError y llego: ${String(e)}`);
    assert.match(e.message, re);
    return true;
  };
}

/** Igual que errorCatalogo, pero ademas exige la segunda linea indentada
 *  con la instruccion de que hacer -- para los mensajes que si la traen. */
function errorAccionable(re: RegExp): (e: unknown) => boolean {
  return (e: unknown) => {
    assert.ok(e instanceof CatalogoSkillsError, `esperaba CatalogoSkillsError y llego: ${String(e)}`);
    assert.match(e.message, re);
    assert.match(e.message, /\n {8}\S/, `mensaje sin instruccion accionable: ${e.message}`);
    return true;
  };
}

// --------------------------------------------------------------------
// parsearCatalogoSkills — contra el YML real, fallo cerrado
// --------------------------------------------------------------------

test('parsea el catalogo real del repo sin lanzar', () => {
  assert.equal(CATALOGO.length, 5);
  assert.deepEqual(
    CATALOGO.map((e) => e.id),
    [
      'task-workflow',
      'code-quality-reviewer',
      'angular-vue-reviewer',
      'csharp-autocad-ifc-reviewer',
      'java-spring-reviewer',
    ]
  );
});

test('total_skills ausente aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(sinLineaDe('total_skills'), RUTA_YML),
    errorAccionable(/falta la clave obligatoria "total_skills"/)
  );
});

test('total_skills repetido aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conLineaExtra('total_skills: 5'), RUTA_YML),
    errorAccionable(/la clave "total_skills" esta repetida/)
  );
});

test('total_skills no entero aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('total_skills', '5.5'), RUTA_YML),
    errorAccionable(/"total_skills" debe ser un numero entero mayor o igual que 0/)
  );
});

test('total_skills negativo aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('total_skills', '-1'), RUTA_YML),
    errorAccionable(/"total_skills" debe ser un numero entero mayor o igual que 0/)
  );
});

test('total_skills por encima del maximo admitido aborta con mensaje accionable, no un RangeError crudo', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('total_skills', '1001'), RUTA_YML),
    errorCatalogo(/"total_skills" es 1001, y el maximo admitido es 1000.*cifras de mas/)
  );
});

test('clave desconocida aborta y sugiere la clave real por distancia de edicion', () => {
  assert.throws(
    () => parsearCatalogoSkills(conLineaExtra('skill_1_orgen: taskcode-plugin'), RUTA_YML),
    (e: unknown) => {
      assert.ok(e instanceof CatalogoSkillsError);
      assert.match(e.message, /clave desconocida "skill_1_orgen"/);
      assert.match(e.message, /Quiza quisiste decir "skill_1_origen"/);
      return true;
    }
  );
});

test('clave repetida aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conLineaExtra('skill_1_id: otro-id'), RUTA_YML),
    errorAccionable(/la clave "skill_1_id" esta repetida/)
  );
});

for (const campo of [
  'id',
  'origen',
  'rol',
  'prioridad',
  'etiquetas',
  'patrones_archivo',
  'descripcion',
] as const) {
  test(`skill_1_${campo} ausente aborta`, () => {
    assert.throws(
      () => parsearCatalogoSkills(sinLineaDe(`skill_1_${campo}`), RUTA_YML),
      errorAccionable(new RegExp(`falta la clave obligatoria "skill_1_${campo}"`))
    );
  });
}

test('prioridad negativa aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_2_prioridad', '-1'), RUTA_YML),
    errorAccionable(/"skill_2_prioridad" debe ser un numero entero mayor o igual que 0/)
  );
});

test('prioridad no entera (texto) aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_1_prioridad', '"diez"'), RUTA_YML),
    errorAccionable(/"skill_1_prioridad" debe ser un numero entero mayor o igual que 0/)
  );
});

test('origen fuera del enum aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_1_origen', 'inventado'), RUTA_YML),
    errorCatalogo(
      /"skill_1_origen" tiene el valor el texto "inventado", pero debe ser uno de: taskcode-plugin, externo/
    )
  );
});

test('rol fuera del enum aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_1_rol', 'inventado'), RUTA_YML),
    errorCatalogo(
      /"skill_1_rol" tiene el valor el texto "inventado", pero debe ser uno de: revisor, ejecucion, ambos/
    )
  );
});

test('id vacio aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_1_id', '""'), RUTA_YML),
    errorCatalogo(/"skill_1_id" debe ser texto no vacio/)
  );
});

test('etiquetas sin elementos aborta (minimo 1)', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_1_etiquetas', '[]'), RUTA_YML),
    errorAccionable(/"skill_1_etiquetas" no puede estar vacia/)
  );
});

test('etiquetas con una entrada en blanco aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_1_etiquetas', '[taskctl, ]'), RUTA_YML),
    errorCatalogo(/"skill_1_etiquetas" tiene alguna entrada vacia/)
  );
});

test('etiquetas con una entrada repetida aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_1_etiquetas', '[taskctl, taskctl]'), RUTA_YML),
    errorCatalogo(/"skill_1_etiquetas" tiene la entrada "taskctl" repetida/)
  );
});

test('patrones_archivo vacio es valido (minimo 0, no exige elementos)', () => {
  const catalogo = parsearCatalogoSkills(conValor('skill_1_patrones_archivo', '[]'), RUTA_YML);
  const entrada = catalogo.find((e) => e.id === 'task-workflow');
  assert.ok(entrada);
  assert.deepEqual(entrada.patrones_archivo, []);
});

test('id repetido entre dos entradas aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_2_id', 'task-workflow'), RUTA_YML),
    errorAccionable(/el id "task-workflow" se repite en las entradas 1 y 2/)
  );
});

test('marketplace ausente en un origen externo aborta', () => {
  // El id se fija a una forma "plugin:skill" valida para que la validacion
  // de formato (IMP-9) no dispare antes de llegar a la de marketplace, que
  // es lo que este test quiere comprobar.
  const conId = conValor('skill_2_id', 'mi-plugin:code-quality-reviewer');
  assert.throws(
    () => parsearCatalogoSkills(conValor('skill_2_origen', 'externo', conId), RUTA_YML),
    errorAccionable(/falta la clave obligatoria "skill_2_marketplace"/)
  );
});

test('marketplace presente en un origen taskcode-plugin aborta', () => {
  assert.throws(
    () => parsearCatalogoSkills(conLineaExtra('skill_1_marketplace: algun-marketplace'), RUTA_YML),
    errorAccionable(/"skill_1_marketplace" no tiene sentido con "skill_1_origen: taskcode-plugin"/)
  );
});

test('un skill externo con marketplace declarado parsea y queda marcado', () => {
  // El id tiene que respetar "plugin:skill" (IMP-9, revision por pares
  // ronda 3, TASK-017): "code-quality-reviewer" a secas es valido para
  // origen "taskcode-plugin", pero no para "externo".
  const conId = conValor('skill_2_id', 'mi-plugin:code-quality-reviewer');
  const conMarketplace = conLineaExtra('skill_2_marketplace: mi-marketplace', conId);
  const conExterno = conValor('skill_2_origen', 'externo', conMarketplace);
  const catalogo = parsearCatalogoSkills(conExterno, RUTA_YML);
  const entrada = catalogo.find((e) => e.id === 'mi-plugin:code-quality-reviewer');
  assert.ok(entrada);
  assert.equal(entrada.origen, 'externo');
  assert.equal(entrada.marketplace, 'mi-marketplace');
});

// IMP-9 (revision por pares ronda 3, TASK-017): la convencion
// "plugin:skill" para un id de origen "externo" quedo escrita en el
// comentario de cabecera del YML (IMP-6, ronda 2) pero nada la
// exigia -- un id sin ":" parseaba igual y plan.ts emitia un "/plugin
// install" con el nombre de un skill donde debia ir el de un plugin,
// sin abortar ni avisar. Estos tests fijan el fallo cerrado.
test('id externo sin ":" aborta', () => {
  const conId = conValor('skill_2_id', 'code-quality-reviewer-sin-dos-puntos');
  const conMarketplace = conLineaExtra('skill_2_marketplace: mi-marketplace', conId);
  const conExterno = conValor('skill_2_origen', 'externo', conMarketplace);
  assert.throws(
    () => parsearCatalogoSkills(conExterno, RUTA_YML),
    errorAccionable(/"skill_2_id" invalido para "skill_2_origen: externo"/)
  );
});

test('id externo con dos ":" aborta', () => {
  const conId = conValor('skill_2_id', 'plugin:sub:skill');
  const conMarketplace = conLineaExtra('skill_2_marketplace: mi-marketplace', conId);
  const conExterno = conValor('skill_2_origen', 'externo', conMarketplace);
  assert.throws(
    () => parsearCatalogoSkills(conExterno, RUTA_YML),
    errorAccionable(/"skill_2_id" invalido para "skill_2_origen: externo"/)
  );
});

test('id externo con el tramo del plugin vacio (":skill") aborta', () => {
  const conId = conValor('skill_2_id', ':code-quality-reviewer');
  const conMarketplace = conLineaExtra('skill_2_marketplace: mi-marketplace', conId);
  const conExterno = conValor('skill_2_origen', 'externo', conMarketplace);
  assert.throws(
    () => parsearCatalogoSkills(conExterno, RUTA_YML),
    errorAccionable(/"skill_2_id" invalido para "skill_2_origen: externo"/)
  );
});

test('id externo con el tramo del skill vacio ("plugin:") aborta', () => {
  const conId = conValor('skill_2_id', 'mi-plugin:');
  const conMarketplace = conLineaExtra('skill_2_marketplace: mi-marketplace', conId);
  const conExterno = conValor('skill_2_origen', 'externo', conMarketplace);
  assert.throws(
    () => parsearCatalogoSkills(conExterno, RUTA_YML),
    errorAccionable(/"skill_2_id" invalido para "skill_2_origen: externo"/)
  );
});

test('id sin ":" en origen "taskcode-plugin" sigue siendo valido (la exigencia es solo para "externo")', () => {
  // Precondicion explicita: el catalogo real tiene 5 entradas
  // "taskcode-plugin" y ninguna trae ":" en su id.
  assert.ok(CATALOGO.every((e) => e.origen === 'taskcode-plugin' && !e.id.includes(':')));
});

// --------------------------------------------------------------------
// seleccionarSkill — catalogos sinteticos en memoria
// --------------------------------------------------------------------

test('seleccionarSkill: gana quien tiene mayor solape de etiquetas', () => {
  const catalogo: CatalogoSkills = [
    entradaSkill({ id: 'a', etiquetas: ['x', 'y'], prioridad: 1 }),
    entradaSkill({ id: 'b', etiquetas: ['x', 'y', 'z'], prioridad: 1 }),
  ];
  const resultado = seleccionarSkill(tarea({ etiquetas: ['x', 'y', 'z', 'w'] }), catalogo);
  assert.equal(resultado.ganador?.id, 'b');
  assert.equal(resultado.regla, 'solape');
  assert.deepEqual(resultado.candidatosEmpatados, []);
});

test('seleccionarSkill: empate en solape se rompe por mayor prioridad', () => {
  const catalogo: CatalogoSkills = [
    entradaSkill({ id: 'a', etiquetas: ['x'], prioridad: 1 }),
    entradaSkill({ id: 'b', etiquetas: ['x'], prioridad: 10 }),
  ];
  const resultado = seleccionarSkill(tarea({ etiquetas: ['x'] }), catalogo);
  assert.equal(resultado.ganador?.id, 'b');
  assert.equal(resultado.regla, 'prioridad');
  assert.deepEqual(resultado.candidatosEmpatados, []);
});

test('seleccionarSkill: empate en solape Y en prioridad devuelve candidatos sin decidir ganador', () => {
  const catalogo: CatalogoSkills = [
    entradaSkill({ id: 'a', etiquetas: ['x'], prioridad: 10 }),
    entradaSkill({ id: 'b', etiquetas: ['x'], prioridad: 10 }),
  ];
  const resultado = seleccionarSkill(tarea({ etiquetas: ['x'] }), catalogo);
  assert.equal(resultado.ganador, null);
  assert.equal(resultado.regla, null);
  assert.deepEqual(
    resultado.candidatosEmpatados.map((c) => c.id).sort(),
    ['a', 'b']
  );
});

test('seleccionarSkill: un tercer candidato con menor solape no entra en el empate', () => {
  const catalogo: CatalogoSkills = [
    entradaSkill({ id: 'a', etiquetas: ['x', 'y'], prioridad: 10 }),
    entradaSkill({ id: 'b', etiquetas: ['x', 'y'], prioridad: 10 }),
    entradaSkill({ id: 'c', etiquetas: ['x'], prioridad: 99 }),
  ];
  const resultado = seleccionarSkill(tarea({ etiquetas: ['x', 'y'] }), catalogo);
  assert.equal(resultado.ganador, null);
  assert.deepEqual(
    resultado.candidatosEmpatados.map((c) => c.id).sort(),
    ['a', 'b']
  );
});

test('seleccionarSkill: cero candidatos (ninguna etiqueta coincide) es un resultado valido, no lanza', () => {
  const catalogo: CatalogoSkills = [entradaSkill({ id: 'a', etiquetas: ['x'] })];
  const resultado = seleccionarSkill(tarea({ etiquetas: ['no-coincide'] }), catalogo);
  assert.deepEqual(resultado, { ganador: null, regla: null, candidatosEmpatados: [] });
});

test('seleccionarSkill: catalogo vacio nunca lanza', () => {
  const resultado = seleccionarSkill(tarea({ etiquetas: ['x'] }), []);
  assert.deepEqual(resultado, { ganador: null, regla: null, candidatosEmpatados: [] });
});

test('seleccionarSkill: tarea sin etiquetas nunca tiene candidatos', () => {
  const catalogo: CatalogoSkills = [entradaSkill({ id: 'a', etiquetas: ['x'] })];
  const resultado = seleccionarSkill(tarea({ etiquetas: [] }), catalogo);
  assert.deepEqual(resultado, { ganador: null, regla: null, candidatosEmpatados: [] });
});

test('seleccionarSkill: no filtra por rol -- un revisor puede ganar igual que uno de ejecucion', () => {
  const catalogo: CatalogoSkills = [entradaSkill({ id: 'rev', rol: 'revisor', etiquetas: ['x'], prioridad: 5 })];
  const resultado = seleccionarSkill(tarea({ etiquetas: ['x'] }), catalogo);
  assert.equal(resultado.ganador?.id, 'rev');
  assert.equal(resultado.regla, 'solape');
});

// --------------------------------------------------------------------
// seleccionarSkill contra el catalogo REAL — ancla el comportamiento
// distribuido, mismo criterio que heuristica.test.ts.
// --------------------------------------------------------------------

test('seleccionarSkill contra el catalogo real: task-workflow gana por sus etiquetas propias', () => {
  const resultado = seleccionarSkill(tarea({ etiquetas: ['taskctl', 'sprints'] }), CATALOGO);
  assert.equal(resultado.ganador?.id, 'task-workflow');
  assert.equal(resultado.regla, 'solape');
});

test('seleccionarSkill contra el catalogo real: cero candidatos si ninguna etiqueta coincide', () => {
  const resultado = seleccionarSkill(tarea({ etiquetas: ['etiqueta-inventada-sin-match'] }), CATALOGO);
  assert.deepEqual(resultado, { ganador: null, regla: null, candidatosEmpatados: [] });
});

test('seleccionarSkill contra el catalogo real: la prioridad rompe el empate entre code-quality-reviewer y un revisor de dominio', () => {
  const calidad = CATALOGO.find((e) => e.id === 'code-quality-reviewer');
  const angular = CATALOGO.find((e) => e.id === 'angular-vue-reviewer');
  assert.ok(calidad && angular, 'el catalogo real debe traer ambas entradas');
  assert.ok(
    calidad.prioridad < angular.prioridad,
    'precondicion del test: code-quality-reviewer debe llevar menor prioridad que un revisor de dominio'
  );
  const resultado = seleccionarSkill(tarea({ etiquetas: ['calidad', 'angular'] }), CATALOGO);
  assert.equal(resultado.ganador?.id, 'angular-vue-reviewer');
  assert.equal(resultado.regla, 'prioridad');
});
