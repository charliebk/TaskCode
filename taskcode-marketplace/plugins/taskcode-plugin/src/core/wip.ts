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
import { STATE_FOLDER, type TareaUbicada, type TaskState } from './task.js';
import { CONFIG_DEFAULTS } from './config.js';

/**
 * Estados cuya carpeta ocupa el hueco de ejecucion.
 */
export const ESTADOS_QUE_OCUPAN_WIP: readonly TaskState[] = ['en-curso', 'en-revision'];

/**
 * Cuantas tareas ocupadas admite una persona antes de que la siguiente
 * quede bloqueada. Desde TASK-030 (item C4) es configurable con
 * `limite_wip` en `.taskcode/config.yml`; el valor por defecto vive en
 * CONFIG_DEFAULTS y es 1, que es lo que este modulo hacia siempre.
 *
 * Este modulo SIGUE siendo puro: recibe el limite ya resuelto, no lee
 * el fichero. Solo importa la constante del default para no reescribir
 * el 1 aqui y que puedan divergir.
 */
export const LIMITE_WIP_POR_DEFECTO = CONFIG_DEFAULTS.limite_wip;

/**
 * Normaliza un "asignado_a" para COMPARAR (nunca para escribir): lo
 * recorta y trata la cadena vacia como "sin asignar".
 *
 * Dos hallazgos MENOR de revision por pares, TASK-015, salian de no
 * hacerlo:
 *
 * - El flag --asignado-a recorta su valor (B6), pero el frontmatter no:
 *   parseScalarOrArray solo recorta lo NO entrecomillado, asi que un
 *   `asignado_a: "carlos "` escrito a mano no era igual a `carlos` y
 *   dejaba abrir una segunda rama a la misma persona.
 * - `asignado_a: ""` pasaba la validacion como si fuera una persona, de
 *   modo que dos tareas "sin asignar en vacio" se bloqueaban entre si
 *   (y el mensaje salia sin nombre), mientras que dos con null no. Dos
 *   representaciones de lo mismo con semantica opuesta.
 *
 * No normaliza mayusculas: eso si seria inventar una equivalencia que
 * no existe en el resto del sistema (ver tareasQueBloquean).
 */
export function personaDeTarea(asignado: string | null): string | null {
  if (asignado === null) return null;
  const v = asignado.trim();
  return v === '' ? null : v;
}

/**
 * Decide quien queda asignado a una tarea (TASK-024, item C7). Un
 * unico sitio con la regla de precedencia, compartido por "plan" y
 * "start" para que no puedan divergir:
 *
 * 1. `flag` — lo que se paso en --asignado-a. Manda siempre: es la via
 *    para asignar a otra persona, y la salida que ofrece el error de
 *    WIP de B7 ("reasigna con --asignado-a").
 * 2. `previo` — el asignado_a que ya tuviera la tarea. Ejecutar un
 *    comando sobre la tarea de otra persona NO se la queda.
 * 3. `identidad` — git config user.email, la novedad de TASK-024.
 * 4. null.
 *
 * Que el paso 2 vaya antes que el 3 es lo que evita el robo
 * silencioso: si Ana planifico TASK-030 y Carlos ejecuta "start"
 * sin flag, la tarea sigue siendo de Ana — y el limite de WIP se
 * comprueba contra Ana, que es quien tiene la rama abierta. Para
 * quedarsela, Carlos tiene que decirlo.
 *
 * Los tres valores pasan por personaDeTarea, asi que un "  " o un ""
 * cuentan como ausentes en cualquiera de los escalones.
 */
export function resolverAsignado(
  flag: string | undefined,
  previo: string | null,
  identidad: string | null
): string | null {
  if (flag !== undefined) {
    const delFlag = personaDeTarea(flag);
    if (delFlag !== null) return delFlag;
  }
  const delPrevio = personaDeTarea(previo);
  if (delPrevio !== null) return delPrevio;
  return personaDeTarea(identidad);
}

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
 *
 * `limite` (TASK-030, item C4) es cuantas tareas ocupadas se toleran.
 * Devolver [] cuando todavia caben es lo que permite que el limite sea
 * configurable sin que el llamante cambie su forma de preguntar: sigue
 * siendo "si esta lista no esta vacia, no puedes arrancar". Con el
 * valor por defecto (1) el resultado es identico al de antes de C4:
 * cualquier otra tarea ocupada bloquea.
 */
export function tareasQueBloquean(
  tareas: readonly TareaUbicada[],
  persona: string,
  idQueArranca: string,
  limite: number = LIMITE_WIP_POR_DEFECTO
): TareaUbicada[] {
  const buscada = personaDeTarea(persona);
  if (buscada === null) return [];
  const ocupadas = tareas
    .filter((t) => t.task.id !== idQueArranca && personaDeTarea(t.task.asignado_a) === buscada)
    .sort((a, b) => a.task.id.localeCompare(b.task.id));
  // Se devuelven TODAS las ocupadas, no solo las que sobran: el
  // mensaje de error tiene que poder nombrar cual hay que cerrar, y
  // con un limite de 3 y 3 abiertas no hay ninguna "sobrante" — hay
  // tres candidatas.
  return ocupadas.length >= limite ? ocupadas : [];
}

/** Una linea por tarea bloqueante: ID, titulo, carpeta REAL y rama. */
function describirBloqueante(t: TareaUbicada): string {
  return (
    `          - ${t.task.id} "${t.task.titulo}" ` +
    `(${STATE_FOLDER[t.estadoCarpeta]}, rama ${t.task.rama})`
  );
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
  bloqueantes: readonly TareaUbicada[],
  limite: number = LIMITE_WIP_POR_DEFECTO
): string {
  const primera = bloqueantes[0] as TareaUbicada;
  const lineas: string[] = [];

  if (bloqueantes.length === 1) {
    lineas.push(
      `[ERROR] ${idQueArranca}: ${persona} ya tiene ${primera.task.id} sin cerrar ` +
        `(${STATE_FOLDER[primera.estadoCarpeta]}, rama ${primera.task.rama}).`
    );
  } else {
    // Con el limite por defecto (1), mas de una solo puede pasar si el
    // repo ya estaba en un estado inconsistente. Con un limite mayor es
    // el caso normal. En los dos se listan todas en vez de enganar
    // nombrando solo la primera.
    lineas.push(
      `[ERROR] ${idQueArranca}: ${persona} ya tiene ${bloqueantes.length} tareas sin cerrar:`
    );
    for (const t of bloqueantes) lineas.push(describirBloqueante(t));
  }

  // El texto para limite 1 se conserva literal: es el que prueban los
  // tests de B7 y el que la gente reconoce. Con un limite configurado
  // mayor, decir "una sola tarea por persona" seria sencillamente
  // mentira, asi que se dice el numero real y de donde sale.
  if (limite === 1) {
    lineas.push(
      '        Una sola tarea en curso por persona: esa rama sigue abierta y sin mergear,'
    );
  } else {
    lineas.push(
      `        El limite es de ${limite} tareas por persona (limite_wip en ` +
        '.taskcode/config.yml): esa rama sigue abierta y sin mergear,'
    );
  }
  lineas.push('        y ahi es donde se commitean las correcciones de su revision.');
  // El consejo NO dice "ejecuta taskctl finish" a secas (hallazgo MENOR
  // de revision por pares, TASK-015): si la bloqueante esta en
  // 02-en-curso, "finish" todavia falla porque le falta pasar por
  // "review", y si esta en 03-en-revision falla mientras el informe no
  // este aprobado — justo el caso mas doloroso, el de una revision que
  // se alarga. Prometer un comando que no funciona es peor que no
  // proponer ninguno.
  lineas.push(
    `        Para desbloquearte: termina ${primera.task.id} (su revision y despues ` +
      `"taskctl finish ${primera.task.id}"),`
  );
  lineas.push('        o reasigna con --asignado-a la tarea que quieras dejar para luego.');

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
