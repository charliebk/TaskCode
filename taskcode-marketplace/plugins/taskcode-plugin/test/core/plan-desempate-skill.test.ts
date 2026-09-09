/**
 * Tests de `src/core/plan-desempate-skill.ts` (TASK-017).
 *
 * `peticionDesempateSkillTemplate` y `salidaDesempateSkillTemplate` son
 * texto libre: se comprueba que el contenido relevante (ids, etiquetas,
 * descripcion, fecha, nombre del fichero de salida) aparece, sin fijar
 * el texto completo linea a linea. `leerGanadorDesempate` es la pieza
 * con logica real (fail-closed: una salida ambigua nunca elige un
 * candidato al azar) y se prueba exhaustivamente.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PETICION_DESEMPATE_SKILL_FILENAME,
  SALIDA_DESEMPATE_SKILL_FILENAME,
  peticionDesempateSkillTemplate,
  salidaDesempateSkillTemplate,
  leerGanadorDesempate,
} from '../../src/core/plan-desempate-skill.js';
import type { EntradaCatalogoSkill } from '../../src/core/catalogo-skills.js';
import type { Task } from '../../src/core/task.js';

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

const CANDIDATOS: readonly EntradaCatalogoSkill[] = [
  entradaSkill({ id: 'a', prioridad: 10, rol: 'revisor', etiquetas: ['x', 'y'], descripcion: 'candidato a' }),
  entradaSkill({ id: 'b', prioridad: 10, rol: 'ejecucion', etiquetas: ['x'], descripcion: 'candidato b' }),
];

// --------------------------------------------------------------------
// peticionDesempateSkillTemplate
// --------------------------------------------------------------------

test('peticionDesempateSkillTemplate incluye cada candidato con su id, prioridad, rol, descripcion y etiquetas', () => {
  const texto = peticionDesempateSkillTemplate(tarea({ id: 'TASK-042', etiquetas: ['x'] }), CANDIDATOS, '2026-09-09');
  for (const c of CANDIDATOS) {
    assert.match(texto, new RegExp(`\`${c.id}\``));
    assert.match(texto, new RegExp(`prioridad ${c.prioridad}`));
    assert.match(texto, new RegExp(`rol ${c.rol}`));
    assert.ok(texto.includes(c.descripcion));
    assert.ok(texto.includes(c.etiquetas.join(', ')));
  }
});

test('peticionDesempateSkillTemplate incluye la tarea, la fecha y el nombre del fichero de salida', () => {
  const texto = peticionDesempateSkillTemplate(tarea({ id: 'TASK-042', titulo: 'mi tarea' }), CANDIDATOS, '2026-09-09');
  assert.ok(texto.includes('TASK-042'));
  assert.ok(texto.includes('mi tarea'));
  assert.ok(texto.includes('2026-09-09'));
  assert.ok(texto.includes(SALIDA_DESEMPATE_SKILL_FILENAME));
});

test('peticionDesempateSkillTemplate marca explicitamente cuando la tarea no tiene etiquetas', () => {
  const texto = peticionDesempateSkillTemplate(tarea({ etiquetas: [] }), CANDIDATOS, '2026-09-09');
  assert.ok(texto.includes('(sin etiquetas)'));
});

test('PETICION_DESEMPATE_SKILL_FILENAME y SALIDA_DESEMPATE_SKILL_FILENAME son nombres fijos sin numeracion de ronda', () => {
  assert.equal(PETICION_DESEMPATE_SKILL_FILENAME, 'peticion-desempate-skill-1.md');
  assert.equal(SALIDA_DESEMPATE_SKILL_FILENAME, 'salida-desempate-skill-1.md');
});

// --------------------------------------------------------------------
// salidaDesempateSkillTemplate
// --------------------------------------------------------------------

test('salidaDesempateSkillTemplate es un scaffold vacio con el id de la tarea', () => {
  const texto = salidaDesempateSkillTemplate(tarea({ id: 'TASK-042' }));
  assert.ok(texto.includes('TASK-042'));
  assert.equal(leerGanadorDesempate(texto, CANDIDATOS), null);
});

// --------------------------------------------------------------------
// leerGanadorDesempate — fail-closed
// --------------------------------------------------------------------

test('leerGanadorDesempate devuelve el candidato cuya primera linea no vacia coincide EXACTAMENTE con su id', () => {
  const ganador = leerGanadorDesempate('b\n', CANDIDATOS);
  assert.equal(ganador?.id, 'b');
});

test('leerGanadorDesempate ignora lineas siguientes a la primera no vacia', () => {
  const ganador = leerGanadorDesempate('a\nrazonamiento largo que menciona a b\n', CANDIDATOS);
  assert.equal(ganador?.id, 'a');
});

test('leerGanadorDesempate salta lineas en blanco iniciales antes de la primera con contenido', () => {
  const ganador = leerGanadorDesempate('\n\n   \nb\n', CANDIDATOS);
  assert.equal(ganador?.id, 'b');
});

test('leerGanadorDesempate hace trim de espacios alrededor del id', () => {
  const ganador = leerGanadorDesempate('   a   \n', CANDIDATOS);
  assert.equal(ganador?.id, 'a');
});

test('leerGanadorDesempate funciona igual con finales de linea CRLF', () => {
  const ganador = leerGanadorDesempate('b\r\nresto\r\n', CANDIDATOS);
  assert.equal(ganador?.id, 'b');
});

test('leerGanadorDesempate devuelve null si el contenido esta vacio', () => {
  assert.equal(leerGanadorDesempate('', CANDIDATOS), null);
});

test('leerGanadorDesempate devuelve null si el contenido son solo lineas en blanco', () => {
  assert.equal(leerGanadorDesempate('\n \n\t\n', CANDIDATOS), null);
});

test('leerGanadorDesempate devuelve null si la primera linea no coincide con ningun candidato vigente', () => {
  assert.equal(leerGanadorDesempate('candidato-inventado\n', CANDIDATOS), null);
});

test('leerGanadorDesempate devuelve null ante una coincidencia parcial (no es igualdad exacta)', () => {
  assert.equal(leerGanadorDesempate('a-extra\n', CANDIDATOS), null);
});

test('leerGanadorDesempate devuelve null si la lista de candidatos vigentes esta vacia', () => {
  assert.equal(leerGanadorDesempate('a\n', []), null);
});

test('leerGanadorDesempate salta el encabezado Markdown del scaffold y lee el id de la linea siguiente con contenido', () => {
  const ganador = leerGanadorDesempate('# Salida del desempate de skill — TASK-042\n\nb\n', CANDIDATOS);
  assert.equal(ganador?.id, 'b');
});

test('leerGanadorDesempate deja el scaffold intacto pero responde debajo, con texto adicional despues del id', () => {
  const salida = salidaDesempateSkillTemplate(tarea({ id: 'TASK-042' })).replace(
    '(pendiente de completar)',
    'java-spring-reviewer\n\nPorque el nucleo es backend.'
  );
  const candidatos = [
    ...CANDIDATOS,
    entradaSkill({ id: 'java-spring-reviewer', prioridad: 10, rol: 'revisor', etiquetas: ['java'] }),
  ];
  const ganador = leerGanadorDesempate(salida, candidatos);
  assert.equal(ganador?.id, 'java-spring-reviewer');
});

test('leerGanadorDesempate sigue devolviendo null si tras el encabezado solo hay mas encabezados', () => {
  assert.equal(leerGanadorDesempate('# titulo\n## subtitulo\n', CANDIDATOS), null);
});
