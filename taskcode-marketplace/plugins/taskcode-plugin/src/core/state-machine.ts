/**
 * Maquina de estados de taskctl (seccion 8.1 de la metodologia): el
 * orden de los comandos no es opcional. Cada comando valida, antes
 * de tocar nada, si es legal ejecutarlo desde el estado actual de la
 * tarea. Este modulo es puro (no toca el sistema de archivos ni Git):
 * recibe el Task ya leido y, cuando hace falta, contexto adicional
 * que no vive en el frontmatter (p. ej. si ya existe un plan-final.md
 * o si la revision primaria esta aprobada).
 */
import type { Task, TaskComplexity } from './task.js';

export type TaskCommand =
  | 'import'
  | 'new'
  | 'plan'
  | 'approve'
  | 'start'
  | 'review'
  | 'codex-review'
  | 'finish';

export interface TransitionContext {
  /** Solo para "approve": ¿ya existe plan-final.md para esta tarea? */
  planFinalExiste?: boolean;
  /** Solo para "codex-review" y "finish": ¿la revision primaria esta aprobada? */
  revisionPrimariaAprobada?: boolean;
  /** Solo para "finish": si revision_codex es true, ¿esa revision esta aprobada? */
  revisionCodexAprobada?: boolean;
}

export class StateMachineError extends Error {
  constructor(
    public readonly taskId: string,
    public readonly command: TaskCommand,
    public readonly estadoActual: Task['estado'] | 'no-existe',
    /** Comando exacto que hay que ejecutar antes, si aplica. */
    public readonly comandoRequerido: string | null,
    message: string
  ) {
    super(message);
    this.name = 'StateMachineError';
  }
}

const TRIVIAL_SIN_APROBACION: readonly TaskComplexity[] = ['trivial', 'simple'];

function err(
  taskId: string,
  command: TaskCommand,
  estadoActual: Task['estado'] | 'no-existe',
  comandoRequerido: string | null,
  reason: string
): StateMachineError {
  const lines = [`[ERROR] ${taskId} ${reason}`];
  if (comandoRequerido) {
    lines.push(`        Ejecuta: ${comandoRequerido} ${taskId}`);
  }
  return new StateMachineError(taskId, command, estadoActual, comandoRequerido, lines.join('\n'));
}

/**
 * Valida si `command` puede ejecutarse sobre `task` en este momento.
 * Lanza StateMachineError si no; no devuelve nada si es valido.
 * `existe` distingue "import"/"new" (la tarea no debe existir aun)
 * del resto de comandos (la tarea debe existir).
 */
export function assertTransitionAllowed(
  command: TaskCommand,
  task: Task | null,
  ctx: TransitionContext = {}
): void {
  if (command === 'import' || command === 'new') {
    if (task !== null) {
      throw err(
        task.id,
        command,
        task.estado,
        null,
        `ya existe (estado actual: "${task.estado}"). taskctl ${command} no puede reutilizar un ID existente.`
      );
    }
    return;
  }

  if (task === null) {
    throw err(
      '(desconocida)',
      command,
      'no-existe',
      null,
      'no existe todavia. Usa taskctl import o taskctl new primero.'
    );
  }

  switch (command) {
    case 'plan': {
      const primeraVez = task.estado === 'planificada';
      const rePlanificar = task.estado === 'en-diseno' && task.plan_aprobado === false;
      if (!primeraVez && !rePlanificar) {
        if (task.estado === 'en-diseno' && task.plan_aprobado) {
          throw err(
            task.id,
            command,
            task.estado,
            'taskctl start',
            'ya tiene un plan aprobado. Usa taskctl start para arrancar la ejecucion.'
          );
        }
        throw err(
          task.id,
          command,
          task.estado,
          null,
          `esta en estado "${task.estado}", no en "planificada" ni en "en-diseno" pendiente de re-planificar.`
        );
      }
      return;
    }

    case 'approve': {
      if (task.estado !== 'en-diseno') {
        throw err(
          task.id,
          command,
          task.estado,
          'taskctl plan',
          `esta en estado "${task.estado}", no en "en-diseno". taskctl approve requiere haber ejecutado taskctl plan primero.`
        );
      }
      // Fail-closed a proposito (hallazgo de revision por pares,
      // Sprint 0): si el llamador no pasa planFinalExiste, no se
      // asume que existe. Antes solo se bloqueaba con `=== false`
      // explicito, lo que dejaba pasar approve sin haber comprobado
      // nada cuando el contexto venia vacio.
      if (ctx.planFinalExiste !== true) {
        throw err(
          task.id,
          command,
          task.estado,
          'taskctl plan',
          'todavia no tiene un plan-final.md que aprobar. Ejecuta taskctl plan primero.'
        );
      }
      return;
    }

    case 'start': {
      if (task.estado !== 'en-diseno') {
        throw err(
          task.id,
          command,
          task.estado,
          'taskctl plan',
          `esta en estado "${task.estado}", no en "en-diseno". taskctl start requiere haber ejecutado taskctl plan primero.`
        );
      }
      const exigeAprobacion = !TRIVIAL_SIN_APROBACION.includes(task.complejidad);
      if (exigeAprobacion && !task.plan_aprobado) {
        throw err(
          task.id,
          command,
          task.estado,
          'taskctl approve',
          'no ha pasado por taskctl approve (complejidad no trivial/simple exige aprobacion humana).'
        );
      }
      return;
    }

    case 'review': {
      if (task.estado !== 'en-curso') {
        throw err(
          task.id,
          command,
          task.estado,
          'taskctl start',
          `esta en estado "${task.estado}", no en "en-curso". taskctl review requiere haber ejecutado taskctl start primero.`
        );
      }
      return;
    }

    case 'codex-review': {
      if (task.estado !== 'en-revision') {
        throw err(
          task.id,
          command,
          task.estado,
          'taskctl review',
          `esta en estado "${task.estado}", no en "en-revision". taskctl codex-review requiere haber ejecutado taskctl review primero.`
        );
      }
      if (!task.revision_codex) {
        throw err(
          task.id,
          command,
          task.estado,
          null,
          'no tiene revision_codex activada en su tarea.md.'
        );
      }
      if (ctx.revisionPrimariaAprobada !== true) {
        throw err(
          task.id,
          command,
          task.estado,
          null,
          'todavia no tiene una revision primaria aprobada.'
        );
      }
      return;
    }

    case 'finish': {
      if (task.estado !== 'en-revision') {
        throw err(
          task.id,
          command,
          task.estado,
          'taskctl review',
          `esta en estado "${task.estado}", no en "en-revision". taskctl finish requiere que la tarea haya pasado por revision.`
        );
      }
      if (ctx.revisionPrimariaAprobada !== true) {
        throw err(
          task.id,
          command,
          task.estado,
          null,
          'no ha pasado revision todavia (revision primaria no aprobada).'
        );
      }
      if (task.revision_codex && ctx.revisionCodexAprobada !== true) {
        throw err(
          task.id,
          command,
          task.estado,
          'taskctl codex-review',
          'tiene revision_codex activada pero esa revision independiente no esta aprobada.'
        );
      }
      return;
    }
  }
}

/** Estado resultante esperado tras ejecutar `command` con exito. */
export function resultingState(command: TaskCommand, task: Task): Task['estado'] {
  switch (command) {
    case 'import':
    case 'new':
      return 'planificada';
    case 'plan':
    case 'approve':
      return 'en-diseno';
    case 'start':
      return 'en-curso';
    case 'review':
    case 'codex-review':
      return 'en-revision';
    case 'finish':
      return 'terminada';
    default:
      return task.estado;
  }
}
