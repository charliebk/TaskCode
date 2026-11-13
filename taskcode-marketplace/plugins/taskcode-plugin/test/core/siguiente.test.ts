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
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: '2026-10-04',
    actualizado: '2026-10-04',
    dependencias: [],
    ...overrides,
  };
}

const CTX: ContextoFlujo = {
  planRedactado: false,
  veredicto: null,
  veredictoCodex: null,
  modoCongelado: true,
  rondaRevision: 1,
  informeEnCommitPropio: true,
};

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
  // MEN-4: sin modo congelado (tarea anterior al registro) la aprobacion automatica esta vetada.
  { nombre: 'en diseno con plan, sin modo congelado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true, modoCongelado: false }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
  { nombre: 'en diseno aprobada', task: { estado: 'en-diseno', plan_aprobado: true }, ctx: { planRedactado: true }, fase: 'start', comando: 'taskctl start TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'en curso', task: { estado: 'en-curso', plan_aprobado: true }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
  { nombre: 'en revision sin informe', task: { estado: 'en-revision', plan_aprobado: true }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'en revision pendiente', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'pendiente' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'en revision veredicto desconocido', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'desconocido' }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'en revision cambios solicitados', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados' }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
  { nombre: 'en revision aprobada (feature)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'en revision aprobada (fix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'fix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  // Decision de Carlos: hotfix y release preguntan antes de finish en cualquier modo que encadene.
  { nombre: 'en revision aprobada (hotfix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'hotfix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
  { nombre: 'en revision aprobada (release)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'release' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
  // IMP-1: la segunda opinion tiene su propio veredicto; sin el, siguiente pedia codex-review sin fin.
  { nombre: 'aprobada sin informe de codex', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'continuar', 'continuar'] },
  { nombre: 'aprobada con codex pendiente', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'veredicto-codex', comando: null, acciones: ['detener', 'preguntar', 'preguntar'] },
  { nombre: 'aprobada con codex sin linea', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'sin-linea' }, fase: 'veredicto-codex', comando: null, acciones: ['detener', 'preguntar', 'preguntar'] },
  { nombre: 'aprobada con codex cambios', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'cambios-solicitados' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'codex aprobada sin revision_codex no cuenta', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  // TASK-059: guardas del automatico.
  { nombre: 'aprobada sin informe en commit propio', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
  // TASK-099: tras una ronda aprobada los MENORES nunca abren otra ronda, en ningun modo.
  { nombre: 'aprobada con MENORES abiertos sin verificacion', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', menoresAbiertos: 2, bloqueantesAbiertos: 0, verificacionLigeraAlDia: false, correccionSinVerificar: false }, fase: 'verificar-menores', comando: 'taskctl verificar-menores TASK-100', acciones: ['detener', 'detener', 'continuar'] },
  { nombre: 'aprobada con MENORES y verificacion al dia', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', menoresAbiertos: 2, bloqueantesAbiertos: 0, verificacionLigeraAlDia: true, correccionSinVerificar: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  { nombre: 'aprobada con correcciones commiteadas sin verificar', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false, menoresAbiertos: 1, bloqueantesAbiertos: 0, verificacionLigeraAlDia: false, correccionSinVerificar: true }, fase: 'verificar-menores', comando: 'taskctl verificar-menores TASK-100', acciones: ['detener', 'detener', 'continuar'] },
  { nombre: 'aprobada sin MENORES ni correcciones', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', menoresAbiertos: 0, bloqueantesAbiertos: 0, verificacionLigeraAlDia: false, correccionSinVerificar: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
  // Un bloqueante abierto con la ronda aprobada: cambios-solicitados, decidido por una persona.
  { nombre: 'aprobada con un IMPORTANTE abierto', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', menoresAbiertos: 3, bloqueantesAbiertos: 1, correccionSinVerificar: true }, fase: 'veredicto', comando: 'taskctl veredicto TASK-100 cambios-solicitados', acciones: ['detener', 'preguntar', 'preguntar'] },
  // Codigo posterior que no se puede atribuir a correcciones (informe sin commitear, sin referencia): como antes.
  { nombre: 'aprobada, no coincide y no es correccion', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', informeEnCommitPropio: false, menoresAbiertos: 1, bloqueantesAbiertos: 0, verificacionLigeraAlDia: false, correccionSinVerificar: false }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
  // TASK-127: regresion, con tope_rondas: 3 como hasta la 0.15.
  { nombre: 'cambios en la ronda 2 (bajo el tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 2, topeRondas: 3 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
  // TASK-095: en el tope se pregunta en TODOS los modos (antes manual y semi
  // se detenian sin decir que decidir: IMP-3 de TASK-058, IMP-2 de TASK-059),
  // y el comando NO lleva --ronda-extra (va en el motivo): ejecutarlo sin
  // preguntar choca con review, que exige el flag pasado el tope (MEN-6).
  { nombre: 'cambios en la ronda 3 (tope)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3, topeRondas: 3 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['preguntar', 'preguntar', 'preguntar'] },
  // TASK-127: sin topeRondas rige el defecto, 2. La 1 sigue como antes; la 2
  // pregunta en todos los modos, y cada ronda extra vuelve a preguntar.
  { nombre: 'cambios en la ronda 1 (tope por defecto)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 1 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'detener', 'continuar'] },
  { nombre: 'cambios en la ronda 2 (tope por defecto)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 2 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['preguntar', 'preguntar', 'preguntar'] },
  { nombre: 'cambios en la ronda 3 (extra, tope por defecto)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 3 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['preguntar', 'preguntar', 'preguntar'] },
  { nombre: 'cambios en la ronda 1 (tope_rondas: 1)', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'cambios-solicitados', rondaRevision: 1, topeRondas: 1 }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['preguntar', 'preguntar', 'preguntar'] },
  { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
];

const MODOS: ModoFlujo[] = ['manual', 'semiautomatico', 'automatico'];

/** Filas de la tabla en el tope de rondas: las unicas que preguntan en manual. */
const EN_EL_TOPE = new Set([
  'cambios en la ronda 3 (tope)',
  'cambios en la ronda 2 (tope por defecto)',
  'cambios en la ronda 3 (extra, tope por defecto)',
  'cambios en la ronda 1 (tope_rondas: 1)',
]);

test('siguienteFase (TASK-127): en el tope, tres salidas (cerrar, ronda extra, volver a diseno) en todos los modos', () => {
  const t = tarea({ estado: 'en-revision', plan_aprobado: true });
  for (const modo of MODOS) {
    const r = siguienteFase(t, { ...CTX, veredicto: 'cambios-solicitados', rondaRevision: 2 }, modo);
    assert.equal(r.accion, 'preguntar', modo);
    assert.deepEqual(
      r.salidas?.map((x) => [x.opcion, x.comando]),
      [
        ['cerrar', 'taskctl veredicto TASK-100 aprobada-con-correcciones'],
        ['ronda-extra', 'taskctl review TASK-100 --ronda-extra'],
        ['volver-a-diseno', 'taskctl new'],
      ],
      modo
    );
    assert.ok(r.motivo.includes('tope de rondas (2)'), r.motivo);
    // La ronda extra nombra la linea que review exigira: la de la ronda 3.
    const desc = r.salidas?.[1]?.descripcion ?? '';
    assert.ok(desc.includes('## Rondas extra') && desc.includes('- Ronda 3: '), desc);
    // El comando del paso sigue sin el flag (MEN-6 de TASK-095).
    assert.equal(r.comando, 'taskctl review TASK-100');
  }
  // Bajo el tope no hay salidas.
  assert.equal(siguienteFase(t, { ...CTX, veredicto: 'cambios-solicitados', rondaRevision: 1 }, 'automatico').salidas, undefined);
});

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
          revisionCodexAprobada: ctx.veredictoCodex === 'aprobada',
          ...veredictoACtx(ctx.veredicto),
        }),
      `${caso.nombre}: propone "${r.fase}", que la maquina de estados rechaza`
    );
  }
});

test('siguienteFase: en manual nunca encadena nada, en ningun estado', () => {
  for (const caso of TABLA) {
    const r = siguienteFase(tarea(caso.task), { ...CTX, ...caso.ctx }, 'manual');
    // TASK-095: el tope de rondas pregunta tambien en manual (nombra las
    // salidas); preguntar no encadena. Todo lo demas se detiene.
    const esperada = EN_EL_TOPE.has(caso.nombre) ? 'preguntar' : 'detener';
    assert.equal(r.accion, esperada, caso.nombre);
    assert.notEqual(r.accion, 'continuar', caso.nombre);
  }
});

test('siguienteFase: un veredicto que no se reconoce no se presenta como "falta el revisor" (MEN-6)', () => {
  const t = tarea({ estado: 'en-revision', plan_aprobado: true });
  assert.match(siguienteFase(t, { ...CTX, veredicto: 'desconocido' }, 'manual').motivo, /no se reconoce/);
  assert.match(siguienteFase(t, { ...CTX, veredicto: 'pendiente' }, 'manual').motivo, /falta el revisor/);
  // Lo mismo en la segunda opinion (MEN-10).
  const conCodex = tarea({ estado: 'en-revision', plan_aprobado: true, revision_codex: true });
  const ctxCodex = { ...CTX, veredicto: 'aprobada' as const };
  assert.match(
    siguienteFase(conCodex, { ...ctxCodex, veredictoCodex: 'desconocido' }, 'manual').motivo,
    /no se reconoce/
  );
  assert.match(
    siguienteFase(conCodex, { ...ctxCodex, veredictoCodex: 'pendiente' }, 'manual').motivo,
    /no tiene veredicto/
  );
});
