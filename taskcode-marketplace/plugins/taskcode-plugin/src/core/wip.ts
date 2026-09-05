/**
 * Limite de trabajo en curso (WIP) por persona — TASK-015, item B7 del
 * checklist de terminacion. Modulo puro: recibe las tareas ya leidas y
 * decide; no toca disco ni Git.
 *
 * ALCANCE, que lo fija la decision #13 y NO coincide con la seccion
 * 8.2 de la metodologia: un UNICO limite, y solo sobre la ejecucion.
 *
 * - "taskctl plan" no comprueba nada. En diseno no hay tope: se pueden
 *   tener varias tareas en 01-en-diseno a la vez.
 * - "taskctl start" aborta si la persona asignada ya tiene otra tarea
 *   en 02-en-curso o en 03-en-revision.
 *
 * La 8.2 describe dos limites independientes, uno de ellos sobre el
 * diseno ("carlos ya tiene TASK-009 en diseno"). La metodologia esta
 * congelada, asi que la divergencia se documenta en HALLAZGOS.md en
 * vez de reescribirla.
 *
 * Por que 03-en-revision ocupa hueco: la rama de una tarea en revision
 * sigue viva y sin mergear hasta "taskctl finish", y es ahi donde se
 * commitean las correcciones de los hallazgos. Si el hueco se liberara
 * al pasar a revision, quedarian dos ramas abiertas y los commits de
 * correccion de la primera acabarian en la segunda — exactamente el
 * fallo que este limite existe para evitar ("evitar que se programe
 * codigo de una tarea en la rama Git de otra tarea", Carlos, #13).
 */
import { STATE_FOLDER, type Task, type TaskState } from './task.js';

/**
 * Estados cuya carpeta ocupa el hueco de ejecucion. Un unico sitio
 * donde esta escrita la regla: el dia que exista .taskcode/config.yml
 * (item C4) y se quiera un limite configurable, se toca aqui.
 */
export const ESTADOS_QUE_OCUPAN_WIP: readonly TaskState[] = ['en-curso', 'en-revision'];

/**
 * Tareas de `persona` que ocupan el hueco, excluida la que se intenta
 * arrancar. Devuelve la lista ordenada por ID para que el mensaje de
 * error sea reproducible: las tareas llegan aqui en el orden en que el
 * disco las entrego, que no es estable.
 *
 * `tareas` deben venir ya filtradas a ESTADOS_QUE_OCUPAN_WIP (es lo
 * que hace listTareasEnEstados); esta funcion no vuelve a mirar el
 * estado, solo la persona.
 *
 * La comparacion de persona es EXACTA y sensible a mayusculas, sobre
 * el valor ya recortado que escribe parseAsignadoAFlag (B6).
 * "asignado_a" es texto libre y ningun otro punto del sistema trata
 * "Carlos" y "carlos" como la misma persona — inventar aqui una
 * equivalencia que "taskctl board" no tiene crearia una incoherencia
 * nueva.
 */
export function tareasQueBloquean(
  tareas: readonly Task[],
  persona: string,
  idQueArranca: string
): Task[] {
  return tareas
    .filter((t) => t.id !== idQueArranca && t.asignado_a === persona)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Una linea por tarea bloqueante: ID, titulo, carpeta y rama. */
function describirBloqueante(t: Task): string {
  return `          - ${t.id} "${t.titulo}" (${STATE_FOLDER[t.estado]}, rama ${t.rama})`;
}

/**
 * Mensaje de "no puedes arrancar esta". Nombra explicitamente la tarea
 * que bloquea (criterio de aceptacion de TASK-015) y dice QUE HACER,
 * no solo que ha fallado — mismo estilo que log_error de los scripts
 * de Git-Flow y que el resto de errores de taskctl.
 */
export function mensajeWipExcedido(
  idQueArranca: string,
  persona: string,
  bloqueantes: readonly Task[]
): string {
  const primera = bloqueantes[0] as Task;
  const lineas: string[] = [];

  if (bloqueantes.length === 1) {
    lineas.push(
      `[ERROR] ${idQueArranca}: ${persona} ya tiene ${primera.id} sin cerrar ` +
        `(${STATE_FOLDER[primera.estado]}, rama ${primera.rama}).`
    );
  } else {
    // Mas de una solo puede pasar si el repo ya estaba en un estado
    // inconsistente (el limite es de una): se listan todas en vez de
    // enganar nombrando solo la primera.
    lineas.push(
      `[ERROR] ${idQueArranca}: ${persona} ya tiene ${bloqueantes.length} tareas sin cerrar:`
    );
    for (const t of bloqueantes) lineas.push(describirBloqueante(t));
  }

  lineas.push(
    '        Una sola tarea en curso por persona: esa rama sigue abierta y sin mergear,'
  );
  lineas.push(
    '        y ahi es donde se commitean las correcciones de su revision.'
  );
  lineas.push(
    `        Cierra ${primera.id} con "taskctl finish ${primera.id}", o reasigna una de las ` +
      'dos con --asignado-a.'
  );

  return lineas.join('\n');
}

/**
 * Mensaje de "no puedo saberlo": hay un tarea.md ilegible en una de
 * las carpetas que ocupan hueco, asi que no se puede descartar que sea
 * de esta persona. Fail-closed a proposito — la duda aqui autorizaria
 * abrir una segunda rama.
 */
export function mensajeWipIndeterminado(idQueArranca: string, ilegibles: readonly string[]): string {
  const lineas = [
    `[ERROR] ${idQueArranca}: no se puede comprobar el limite de trabajo en curso porque ` +
      `${ilegibles.length === 1 ? 'hay una tarea ilegible' : 'hay tareas ilegibles'} en las ` +
      'carpetas de ejecucion:',
  ];
  for (const ruta of ilegibles) lineas.push(`          - ${ruta}`);
  lineas.push(
    '        No se sabe de quien son, asi que podrian ser justo las que bloquean.'
  );
  lineas.push('        Arregla su frontmatter y reintenta.');
  return lineas.join('\n');
}
