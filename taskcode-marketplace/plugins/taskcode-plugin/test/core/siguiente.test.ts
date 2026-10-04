/**
 * siguienteFase (TASK-056): la tabla entera, escrita a mano y comparada con
 * deepEqual. Duplica a proposito la logica de produccion: cada estado o modo
 * nuevo obliga a tocar las dos, y ese es el valor del test.
 *
 * Ademas, cada fase propuesta se cruza con assertTransitionAllowed: el
 * siguiente paso nunca puede ser una transicion ilegal.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../../src/core/flujo.js';
import { assertTransitionAllowed, type TaskCommand } from '../../src/core/state-machine.js';
import type { ModoFlujo } from '../../src/core/config.js';
import type { Task } from '../../src/core/task.js';
import type { VeredictoInforme } from '../../src/core/informe-revision.js';

function tarea(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-100',
    titulo: 'Tarea de prueba',
    tipo: 'feature',
    sprint: 0,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'planificada',
    plan_aprobado: false,
    rama: 'feature/task-100-prueba',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    creado: '2026-10-04',
    actualizado: '2026-10-04',
    dependencias: [],
    ...overrides,
  };
}

const CTX: ContextoFlujo = { planRedactado: false, veredicto: null, codexAprobada: false };

interface Caso {
  nombre: string;
  task: Partial<Task>;
  ctx?: Partial<ContextoFlujo>;
  /** fase y comando no dependen del modo; la accion si: [manual, semi, auto]. */
  fase: SiguientePaso['fase'];
  comando: string | null;
  acciones: [SiguientePaso['accion'], SiguientePaso['accion'], SiguientePaso['accion']];
}

const VEREDICTO_PENDIENTE = 'taskctl veredicto TASK-100 <aprobada|aprobada-con-correcciones|cambios-solicitados>';

const TABLA: Caso[] = [
  { nombre: 'planificada', task: { estado: 'planificada' }, fase: 'plan', comando: 'taskctl plan TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'en diseno sin plan redactado', task: { estado: 'en-diseno' }, fase: 'plan', comando: null, acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'en diseno con plan redactado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'en diseno aprobada', task: { estado: 'en-diseno', plan_aprobado: true }, ctx: { planRedactado: true }, fase: 'start', comando: 'taskctl start TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'en curso', task: { estado: 'en-curso', plan_aprobado: true }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'en revision sin informe', task: { estado: 'en-revision', plan_aprobado: true }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'en revision pendiente', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'pendiente' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'en revision veredicto desconocido', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'desconocido' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'en revision cambios solicitados', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados' }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'en revision aprobada (feature)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'en revision aprobada (fix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'fix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  // Decision de Carlos: hotfix y release preguntan antes de finish en cualquier modo que encadene.
  { nombre: 'en revision aprobada (hotfix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'hotfix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
  { nombre: 'en revision aprobada (release)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'release' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
  { nombre: 'aprobada con codex pendiente', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', codexAprobada: true }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
];

const MODOS: ModoFlujo[] = ['manual', 'semiautomatico', 'automatico'];

test('siguienteFase: la tabla entera, por estado, contexto, tipo y modo', () => {
  for (const caso of TABLA) {
    MODOS.forEach((modo, i) => {
      const r = siguienteFase(tarea(caso.task), { ...CTX, ...caso.ctx }, modo);
      assert.deepEqual(
        { fase: r.fase, comando: r.comando, accion: r.accion },
        { fase: caso.fase, comando: caso.comando, accion: caso.acciones[i] },
        `${caso.nombre}, modo ${modo}`
      );
      assert.ok(r.motivo.length > 0, `${caso.nombre}: sin motivo`);
    });
  }
});

test('siguienteFase: ninguna fase propuesta es una transicion ilegal para la maquina de estados', () => {
  const veredictoACtx = (v: VeredictoInforme | null) => ({
    veredictoRondaAnterior: v ?? 'sin-linea',
    revisionPrimariaAprobada: v === 'aprobada',
  });
  for (const caso of TABLA) {
    const t = tarea(caso.task);
    const ctx = { ...CTX, ...caso.ctx };
    const r = siguienteFase(t, ctx, 'automatico');
    // terminada no propone nada; "plan" sin comando es redactar, no una transicion.
    if (r.comando === null) continue;
    const comando = r.fase as TaskCommand;
    assert.doesNotThrow(
      () =>
        assertTransitionAllowed(comando, t, {
          planFinalExiste: ctx.planRedactado,
          revisionCodexAprobada: ctx.codexAprobada,
          ...veredictoACtx(ctx.veredicto),
        }),
      `${caso.nombre}: propone "${r.fase}", que la maquina de estados rechaza`
    );
  }
});

test('siguienteFase: en manual nunca encadena nada, en ningun estado', () => {
  for (const caso of TABLA) {
    const r = siguienteFase(tarea(caso.task), { ...CTX, ...caso.ctx }, 'manual');
    assert.equal(r.accion, 'detener', caso.nombre);
  }
});
