/**
 * Tests held-out de una tarea — TASK-073. Los escribe la persona a partir de
 * los criterios, en la carpeta `aceptacion/` de la tarea, y los commitea en la
 * rama base durante el diseño, antes de `start`: la rama nace con ellos y no
 * aparecen en su diff. El agente que implementa no debe leerlos ni editarlos
 * (el hook que lo impide llega con TASK-078); `finish` los ejecuta con
 * `comando_heldout` y comprueba que la rama no los ha tocado.
 *
 * Puro: nombres, patrones y la busqueda de la carpeta en una lista de rutas.
 */

/** Nombre de la carpeta de held-out dentro de la carpeta de una tarea. */
export const CARPETA_HELDOUT = 'aceptacion';

/** Variable de entorno con la ruta absoluta de la carpeta, para `comando_heldout`. */
export const VARIABLE_HELDOUT = 'HELDOUT_DIR';

/**
 * Patron `git :(glob)` que la peticion de revision excluye SIEMPRE, aunque el
 * proyecto cambie `excluir_de_revision`: el diff no puede llevar los held-out.
 */
export const EXCLUIR_HELDOUT = `tareas/*/TASK-*/${CARPETA_HELDOUT}/**`;

/** El ID escapado para meterlo en una expresion regular. */
function escaparId(id: string): string {
  return id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Carpetas `tareas/<estado>/<id>/aceptacion` que aparecen en una lista de
 * rutas de fichero relativas a la raiz (las de `git ls-tree -r --name-only`),
 * sin repetir y en orden. Una tarea puede tener la suya en mas de un estado
 * si la rama base la recibio despues de que la rama moviera la tarea.
 */
export function carpetasHeldout(rutas: readonly string[], id: string): string[] {
  const prefijo = new RegExp(`^(tareas/[^/]+/${escaparId(id)}/${CARPETA_HELDOUT})/`);
  const vistas = new Set<string>();
  for (const r of rutas) {
    const m = prefijo.exec(r);
    if (m !== null) vistas.add(m[1] as string);
  }
  return [...vistas];
}

/**
 * Carpetas de la tarea cuyo nombre es `aceptacion` con OTRAS mayusculas
 * (`Aceptacion/`): no se tomarian por held-out, y en NTFS o macOS es un error
 * facil (MEN-3 de la revision). `finish` aborta si aparece alguna.
 */
export function variantesHeldout(rutas: readonly string[], id: string): string[] {
  const re = new RegExp(`^(tareas/[^/]+/${escaparId(id)}/([^/]+))/`);
  const vistas = new Set<string>();
  for (const r of rutas) {
    const m = re.exec(r);
    if (m !== null && m[2] !== CARPETA_HELDOUT && (m[2] as string).toLowerCase() === CARPETA_HELDOUT) vistas.add(m[1] as string);
  }
  return [...vistas];
}
