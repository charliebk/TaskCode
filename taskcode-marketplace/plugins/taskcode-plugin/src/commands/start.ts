/**
 * taskctl start — TASK-009 de PLAN_SPRINTS.md. Primer comando que
 * toca Git de verdad: crea la rama de la tarea invocando el script
 * de Git-Flow correspondiente a su tipo y mueve la carpeta de la
 * tarea a 02-en-curso/.
 *
 * Deliberadamente NO implementa aqui la precondicion completa de la
 * seccion 8.3 (auto-switch a la rama base correcta si el workspace
 * esta limpio) — eso es TASK-012. Este comando solo anade la guarda
 * minima necesaria para invocar el script de forma segura y
 * deterministica: comprobar que el workspace esta limpio ANTES de
 * llamar al script, en vez de delegar en su prompt interactivo.
 */
import { parseArgs } from '../cli/args.js';
import { parseAsignadoAFlag, PISTA_VACIO_ESCRITURA } from '../cli/asignado.js';
import type { Task } from '../core/task.js';
import { readTareaFile, moveTareaFile, listTareasEnEstados } from '../fs/task-store.js';
import {
  ESTADOS_QUE_OCUPAN_WIP,
  tareasQueBloquean,
  mensajeWipExcedido,
  mensajeWipIndeterminado,
} from '../core/wip.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { isWorkspaceClean, currentBranch, isValidBranchName } from '../fs/git.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';

export class StartCommandError extends Error {}

const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
  feature: 'create-feature.sh',
  fix: 'create-fix.sh',
  hotfix: 'create-hotfix.sh',
  release: 'create-release.sh',
};

export interface StartCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
  /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
  scriptsDir: string;
}

export interface StartCommandResult {
  id: string;
  rama: string;
  filePath: string;
  /** asignado_a resultante en el frontmatter (null si sigue sin asignar). */
  asignadoA: string | null;
  /** true si esta invocacion cambio asignado_a (se paso --asignado-a con otro valor). */
  asignadoCambiado: boolean;
}

export async function runStartCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: StartCommandDeps
): Promise<StartCommandResult> {
  // El ID sale de los POSICIONALES, no de argv[0] a secas (item B6):
  // ver el comentario equivalente en plan.ts.
  const { positional } = parseArgs(argv);
  const id = positional[0];
  if (id === undefined || id.trim() === '') {
    throw new StartCommandError('[ERROR] Falta el ID de la tarea: taskctl start TASK-NNN.');
  }

  // Se parsea antes de leer nada y, sobre todo, antes de invocar el
  // script de Git-Flow: un --asignado-a mal escrito no debe dejar una
  // rama creada a medias.
  const asignadoA = parseAsignadoAFlag(
    argv,
    (m) => new StartCommandError(m),
    PISTA_VACIO_ESCRITURA
  );

  const existing = await readTareaFile(tareasRoot, id);
  // assertTransitionAllowed lanza StateMachineError si existing es null
  // (tarea no encontrada) o si el estado/campos actuales no permiten
  // "start" todavia — en ambos casos no se llega a tocar Git ni mover
  // nada.
  assertTransitionAllowed('start', existing ? existing.task : null);
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  // Precondicion minima (ver cabecera del fichero): workspace limpio
  // ANTES de invocar el script, para no depender de su prompt
  // interactivo (TASK-007, hallazgo 3: EOF => "No" => exit 0, lo que
  // desde un caller programatico es indistinguible de un exito real
  // si no se comprueba antes).
  if (!isWorkspaceClean(deps.repoCwd)) {
    throw new StartCommandError(
      `[ERROR] ${task.id}: el workspace tiene cambios sin commitear. ` +
        'Haz commit o stash antes de "taskctl start" — esta comprobacion evita depender ' +
        'del prompt interactivo de Git-Flow, que con stdin no interactivo cancela en silencio.'
    );
  }

  // Limite de trabajo en curso (TASK-015, item B7). Va aqui, ANTES de
  // tocar Git, por lo mismo que el resto de guardas de este comando:
  // rechazar sin haber creado una rama que luego habria que borrar a
  // mano.
  //
  // asignadoFinal se resuelve una sola vez y se usa para dos cosas: la
  // comprobacion de aqui y el frontmatter que se escribe al final. Sin
  // esto, un start --asignado-a otra-persona comprobaria el limite
  // contra quien la tenia asignada antes y luego escribiria a otra: se
  // comprobaria a la persona equivocada.
  const asignadoFinal = asignadoA !== undefined ? asignadoA : task.asignado_a;

  // Una tarea sin asignar no tiene a quien aplicarle un limite. Es el
  // caso de todo lo anterior a B6 (asignado_a nace a null), asi que
  // bloquearlo aqui romperia el flujo de quien no use el flag.
  if (asignadoFinal !== null) {
    const { tareas, ilegibles } = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
    // Fail-closed acotado: un tarea.md ilegible en las carpetas de
    // ejecucion podria ser justo el que bloquea, y no hay forma de
    // saberlo. Solo esas dos carpetas: una tarea rota en
    // 00-planificadas no ocupa hueco, asi que no debe bloquear a nadie.
    if (ilegibles.length > 0) {
      throw new StartCommandError(mensajeWipIndeterminado(task.id, ilegibles));
    }
    const bloqueantes = tareasQueBloquean(tareas, asignadoFinal, task.id);
    if (bloqueantes.length > 0) {
      throw new StartCommandError(mensajeWipExcedido(task.id, asignadoFinal, bloqueantes));
    }
  }

  // Defensa en profundidad (hallazgo menor de revision por pares): sin
  // esto, un task.rama invalido solo se detecta varios procesos mas
  // abajo, dentro del propio script de Git-Flow.
  if (!isValidBranchName(task.rama, deps.repoCwd)) {
    throw new StartCommandError(
      `[ERROR] ${task.id}: "${task.rama}" no es un nombre de rama valido para Git. ` +
        'Corrige el campo "rama" en tarea.md antes de reintentar.'
    );
  }

  const scriptName = SCRIPT_BY_TYPE[task.tipo];
  const { code, signal } = runGitflowScript(scriptName, [task.rama], {
    scriptsDir: deps.scriptsDir,
    cwd: deps.repoCwd,
  });
  if (code !== 0) {
    const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
    throw new StartCommandError(
      `[ERROR] ${task.id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
        'Revisa la salida de arriba; la tarea no se ha movido de carpeta.'
    );
  }

  // Evidencia, no suposicion (principio de TASK-007): un exit code 0
  // del script no basta por si solo, se confirma la rama activa real.
  const branchNow = currentBranch(deps.repoCwd);
  if (branchNow !== task.rama) {
    throw new StartCommandError(
      `[ERROR] ${task.id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
        `"${branchNow}", no "${task.rama}". No se actualiza la tarea; revisa el repo a mano.`
    );
  }

  // asignadoFinal ya se resolvio arriba, junto a la comprobacion del
  // limite de WIP, para no calcularlo dos veces ni arriesgarse a que
  // las dos copias diverjan: se comprueba el limite de la MISMA
  // persona que se acaba escribiendo en el frontmatter.
  const asignadoCambiado = asignadoFinal !== task.asignado_a;

  const updated: Task = {
    ...task,
    estado: 'en-curso',
    asignado_a: asignadoFinal,
    actualizado: today,
  };
  // tolerateMissingSource: un hotfix/release creado desde una base
  // (main) que no incluye tareas/ hace que Git borre la carpeta vieja
  // del working tree al hacer checkout, ANTES de que lleguemos aqui —
  // ver comentario de MoveTareaFileOptions en task-store.ts. task/body
  // ya se leyeron en memoria antes de invocar el script, asi que no se
  // pierde nada.
  const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body, {
    tolerateMissingSource: true,
  });

  return {
    id: task.id,
    rama: task.rama,
    filePath: newFilePath,
    asignadoA: asignadoFinal,
    asignadoCambiado,
  };
}
