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
  | 'finish'
  | 'terminada';

export type AccionFlujo = 'detener' | 'preguntar' | 'continuar';

export interface ContextoFlujo {
  /** en-diseno: ¿hay un plan-final.md redactado (no la plantilla)? */
  planRedactado: boolean;
  /** en-revision: veredicto de la ultima ronda. */
  veredicto: VeredictoInforme | null;
  /** en-revision con revision_codex: ¿la segunda opinion esta aprobada? */
  codexAprobada: boolean;
}

export interface SiguientePaso {
  fase: FaseSiguiente;
  /**
   * Comando de taskctl de esa fase, o null si lo que toca es trabajo de un
   * agente sin comando propio (redactar el plan) o la tarea esta terminada.
   */
  comando: string | null;
  accion: AccionFlujo;
  motivo: string;
}

/**
 * Fases que abren una fase NUEVA del ciclo: en semiautomatico se pregunta
 * antes de entrar. Las demas (veredicto, codex-review, otra ronda de
 * review) son pasos internos de la revision y siguen solas.
 */
function accionPara(
  fase: FaseSiguiente,
  modo: ModoFlujo,
  task: Task,
  abreFase: boolean
): AccionFlujo {
  if (fase === 'terminada' || modo === 'manual') return 'detener';
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
    comando: string | null = `taskctl ${fase} ${task.id}`
  ): SiguientePaso => ({
    fase,
    comando,
    accion: accionPara(fase, modo, task, abreFase),
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
          if (task.revision_codex && !ctx.codexAprobada) {
            return paso('codex-review', false, 'falta la segunda opinion (revision_codex: true)');
          }
          return paso('finish', true, 'la revision esta aprobada');
        default:
          return paso(
            'veredicto',
            false,
            'la ultima ronda no tiene veredicto: falta el revisor',
            `taskctl veredicto ${task.id} <aprobada|aprobada-con-correcciones|cambios-solicitados>`
          );
      }
    case 'terminada':
      return paso('terminada', false, 'la tarea ya esta terminada', null);
  }
}
