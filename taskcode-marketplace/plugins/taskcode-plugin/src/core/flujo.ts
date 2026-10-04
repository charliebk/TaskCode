/**
 * El siguiente paso de una tarea (TASK-056). Puro: recibe la tarea, lo que
 * hay en su carpeta (plan redactado, veredicto de la ultima ronda) y el modo
 * de flujo, y dice que fase toca y que hacer con ella:
 *
 * - `detener`: no se encadena nada; se nombra el comando siguiente.
 * - `preguntar`: se pregunta a la persona si seguir.
 * - `continuar`: se sigue sin preguntar.
 *
 * Es lo que leen las fases guiadas para decidir: ellas solo ejecutan lo que
 * esto devuelve. Las condiciones de LEGALIDAD no se copian aqui, viven en
 * state-machine.ts; el test cruza cada fase propuesta con
 * assertTransitionAllowed para que nunca se proponga una ilegal.
 */
import type { Task } from './task.js';
import type { ModoFlujo } from './config.js';
import type { VeredictoInforme } from './informe-revision.js';

export type FaseSiguiente =
  | 'plan'
  | 'approve'
  | 'start'
  | 'review'
  | 'veredicto'
  | 'codex-review'
  | 'veredicto-codex'
  | 'finish'
  | 'terminada';

export type AccionFlujo = 'detener' | 'preguntar' | 'continuar';

export interface ContextoFlujo {
  /** en-diseno: ¿hay un plan-final.md redactado (no la plantilla)? */
  planRedactado: boolean;
  /** en-revision: veredicto de la ultima ronda. */
  veredicto: VeredictoInforme | null;
  /**
   * en-revision con revision_codex: veredicto de la ultima ronda de Codex,
   * o null si todavia no hay ninguna (IMP-1 de la revision: un booleano no
   * distinguia "sin informe" de "pendiente" ni de "pidio cambios", y
   * siguiente pedia otra ronda de Codex sin fin).
   */
  veredictoCodex: VeredictoInforme | null;
  /**
   * ¿La tarea tiene modo congelado (fila plan en su registro)? Sin el, la
   * aprobacion automatica esta vetada (MEN-4): en automatico no se puede
   * proponer seguir solo hacia un approve que el CLI rechazara.
   */
  modoCongelado: boolean;
}

export interface SiguientePaso {
  fase: FaseSiguiente;
  /**
   * Comando de taskctl de esa fase, o null si no hay comando que la haga:
   * redactar el plan (trabajo de agente), escribir el veredicto de la segunda
   * opinion (`veredicto-codex`, lo escribe una persona a mano) o la tarea
   * terminada.
   */
  comando: string | null;
  accion: AccionFlujo;
  motivo: string;
}

/**
 * Fases que abren una fase NUEVA del ciclo: en semiautomatico se pregunta
 * antes de entrar. Las demas (veredicto, la primera codex-review, otra ronda
 * de review) son pasos internos de la revision y siguen solas, salvo las que
 * marcan `exigePersona`: el veredicto de la segunda opinion y otra
 * codex-review tras pedir cambios preguntan en cualquier modo que encadene.
 */
function accionPara(
  fase: FaseSiguiente,
  modo: ModoFlujo,
  task: Task,
  abreFase: boolean,
  exigePersona: boolean
): AccionFlujo {
  if (fase === 'terminada' || modo === 'manual') return 'detener';
  // Pasos que solo puede decidir una persona aunque el modo encadene.
  if (exigePersona) return 'preguntar';
  // Decision de Carlos (2026-10-04): hotfix y release mergean a main con
  // tag; en ningun modo se cierran sin preguntar.
  if (fase === 'finish' && (task.tipo === 'hotfix' || task.tipo === 'release')) return 'preguntar';
  if (modo === 'automatico') return 'continuar';
  return abreFase ? 'preguntar' : 'continuar';
}

export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo): SiguientePaso {
  const paso = (
    fase: FaseSiguiente,
    abreFase: boolean,
    motivo: string,
    comando: string | null = `taskctl ${fase} ${task.id}`,
    exigePersona = false
  ): SiguientePaso => ({
    fase,
    comando,
    accion: accionPara(fase, modo, task, abreFase, exigePersona),
    motivo,
  });

  switch (task.estado) {
    case 'planificada':
      return paso('plan', true, 'la tarea esta planificada: toca disenarla');
    case 'en-diseno':
      if (task.plan_aprobado) return paso('start', true, 'el plan esta aprobado: toca abrir la rama');
      if (!ctx.planRedactado) {
        // No `taskctl plan`: abriria otra ronda de diseno. Lo que falta es
        // trabajo de agente (roles, unificador) sobre la ronda ya abierta.
        return paso('plan', false, 'falta redactar planificacion/plan-final.md', null);
      }
      if (!ctx.modoCongelado) {
        // Tarea sin fila plan (anterior al registro): approve
        // --decidido-por automatico se rechaza, asi que la aprueba una persona.
        return paso(
          'approve',
          true,
          'el plan esta redactado y sin aprobar; la tarea no tiene modo congelado, asi que la aprueba una persona',
          `taskctl approve ${task.id}`,
          true
        );
      }
      return paso('approve', true, 'el plan esta redactado y sin aprobar');
    case 'en-curso':
      return paso(
        'review',
        true,
        'cuando la implementacion este commiteada y la suite en verde, toca la revision'
      );
    case 'en-revision':
      switch (ctx.veredicto) {
        case 'cambios-solicitados':
          return paso('review', false, 'la ultima ronda pidio cambios: corregir y pedir otra ronda');
        case 'aprobada':
          if (task.revision_codex) {
            switch (ctx.veredictoCodex) {
              case null:
                return paso('codex-review', false, 'falta la segunda opinion (revision_codex: true)');
              case 'aprobada':
                break;
              case 'cambios-solicitados':
                // Otra ronda de Codex solo tras corregir: lo decide una persona,
                // o se pediria una segunda opinion sobre el mismo codigo.
                return paso(
                  'codex-review',
                  false,
                  'la segunda opinion pidio cambios: corregir y pedir otra ronda de codex-review',
                  `taskctl codex-review ${task.id}`,
                  true
                );
              default:
                // No hay comando que escriba el veredicto de Codex, y que lo
                // escriba el mismo agente que encadena el flujo es el agujero
                // del veredicto autoescrito: lo decide una persona.
                return paso(
                  'veredicto-codex',
                  false,
                  ctx.veredictoCodex === 'desconocido'
                    ? 'el veredicto de la segunda opinion no se reconoce: una persona lo lee y reescribe su linea "- Veredicto:"'
                    : 'el informe de la segunda opinion no tiene veredicto: una persona lo lee y escribe su linea "- Veredicto:"',
                  null,
                  true
                );
            }
          }
          return paso('finish', true, 'la revision esta aprobada');
        default:
          return paso(
            'veredicto',
            false,
            ctx.veredicto === 'desconocido'
              ? 'el veredicto de la ultima ronda no se reconoce: reescribelo con taskctl veredicto'
              : 'la ultima ronda no tiene veredicto: falta el revisor',
            `taskctl veredicto ${task.id} <aprobada|aprobada-con-correcciones|cambios-solicitados>`
          );
      }
    case 'terminada':
      return paso('terminada', false, 'la tarea ya esta terminada', null);
  }
}
