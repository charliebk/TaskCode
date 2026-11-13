/**
 * Lo pendiente de la carpeta de una tarea (TASK-119, P-11).
 *
 * `registrar-coste` y `veredicto` ya no commitean: lo que escriben se queda
 * sin commitear en la carpeta de la tarea y lo absorbe el commit del
 * siguiente comando de fase. Para eso, las guardas de esos comandos dejan
 * pasar los cambios bajo `tareas/<estado>/<ID>/` (cualquier estado: un
 * movimiento deja alta y baja) y siguen abortando con cualquier otro.
 *
 * Los scripts de Git-Flow y la verificacion necesitan el arbol limpio (el
 * script lo comprueba; la verificacion guarda su memo solo con el arbol
 * limpio). Mientras corren, lo pendiente se aparta en un stash con nombre
 * propio y se devuelve antes de escribir y commitear. Si el comando muere
 * con el stash puesto, el siguiente intento lo recupera al empezar
 * (`recuperarApartado`), antes de leer la tarea: el veredicto vive en lo
 * apartado.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { GitCommandError, runGit } from './git.js';

export class PendientesError extends Error {}

/** Pathspec (relativo a la raiz del repo) de todas las carpetas de estado de la tarea. */
function pathspecTarea(cwd: string, tareasRoot: string, id: string): string {
  const prefijo = runGit(['rev-parse', '--show-prefix'], cwd);
  const tareas = path.relative(cwd, tareasRoot).split(path.sep).join('/');
  return `${prefijo}${tareas}/*/${id}/**`;
}

/** Mensaje del stash: lo que permite reconocerlo en un intento posterior. */
export function mensajeApartado(id: string): string {
  return `taskctl ${id}: pendientes de la tarea`;
}

/** true si la carpeta de la tarea tiene cambios sin commitear. */
export function hayPendientesDeTarea(cwd: string, tareasRoot: string, id: string): boolean {
  const spec = pathspecTarea(cwd, tareasRoot, id);
  return runGit(['status', '--porcelain', '-uall', '--', `:(top,glob)${spec}`], cwd) !== '';
}

/** true si hay cambios sin commitear FUERA de la carpeta de la tarea. */
export function hayCambiosFueraDeTarea(cwd: string, tareasRoot: string, id: string): boolean {
  const spec = pathspecTarea(cwd, tareasRoot, id);
  return runGit(['status', '--porcelain', '--', ':(top)', `:(top,glob,exclude)${spec}`], cwd) !== '';
}

/** Referencia (`stash@{n}`) del stash de la tarea, o null si no hay. */
function refApartado(cwd: string, id: string): string | null {
  const sufijo = `: ${mensajeApartado(id)}`;
  const lineas = runGit(['stash', 'list', '--format=%gd%x09%gs'], cwd).split('\n');
  for (const linea of lineas) {
    const [ref, asunto] = linea.split('\t');
    if (ref !== undefined && asunto !== undefined && asunto.endsWith(sufijo)) return ref;
  }
  return null;
}

/** Como recuperar a mano un stash que no se pudo devolver. */
function comoRecuperar(id: string): string {
  return (
    `Lo pendiente de la tarea (coste, veredicto, informe) esta en el stash "${mensajeApartado(id)}": ` +
    'recuperalo con git stash list y git stash pop <ref> cuando el arbol este limpio.'
  );
}

function pop(cwd: string, id: string, ref: string): void {
  try {
    runGit(['stash', 'pop', '-q', ref], cwd);
  } catch (e: unknown) {
    const detalle = e instanceof GitCommandError ? e.stderr.trim() : String(e);
    throw new PendientesError(`[ERROR] ${id}: no se pudo devolver lo pendiente de la tarea (${detalle}). ${comoRecuperar(id)}`);
  }
}

/**
 * Recupera el stash de un intento anterior que murio con lo pendiente
 * apartado. Si ademas hay cambios nuevos en la carpeta, no mezcla: aborta.
 * Devuelve true si habia algo que recuperar.
 */
export function recuperarApartado(cwd: string, tareasRoot: string, id: string): boolean {
  const ref = refApartado(cwd, id);
  if (ref === null) return false;
  if (hayPendientesDeTarea(cwd, tareasRoot, id)) {
    throw new PendientesError(
      `[ERROR] ${id}: hay un stash de un intento anterior ("${mensajeApartado(id)}", ${ref}) y la carpeta de la ` +
        'tarea tiene cambios nuevos: no se mezclan solos. Commitea o descarta los nuevos, o aplica el stash a mano, ' +
        'y reintenta. No se ha tocado nada.'
    );
  }
  pop(cwd, id, ref);
  return true;
}

export interface Apartado {
  /** true mientras lo pendiente esta en el stash. */
  readonly activo: boolean;
  /** Lo devuelve al arbol. Sin efecto si no habia nada apartado o ya se devolvio. */
  devolver(): void;
  /**
   * Para los caminos de error: lo devuelve si se puede sin riesgo (sin merge a
   * medias); si no, devuelve el texto que dice como recuperarlo a mano.
   */
  devolverSiSePuede(): string | null;
}

/** Anade a un error el texto de como recuperar lo apartado, si lo hay. */
function conNota(e: unknown, nota: string | null): unknown {
  if (nota !== null && e instanceof Error) e.message = `${e.message}\n${nota}`;
  return e;
}

/**
 * Ejecuta `fn` (algo que necesita el arbol limpio: un script de Git-Flow, la
 * verificacion) con lo pendiente de la tarea apartado, y lo devuelve al
 * terminar. Si `fn` lanza, lo devuelve si se puede sin riesgo; si no, el error
 * dice como recuperarlo.
 */
export function conPendientesApartados<T>(cwd: string, tareasRoot: string, id: string, fn: () => T): T {
  const apartado = apartarPendientes(cwd, tareasRoot, id);
  let r: T;
  try {
    r = fn();
  } catch (e: unknown) {
    throw conNota(e, apartado.devolverSiSePuede());
  }
  apartado.devolver();
  return r;
}

/** Igual que conPendientesApartados, para una `fn` asincrona. */
export async function conPendientesApartadosAsync<T>(
  cwd: string,
  tareasRoot: string,
  id: string,
  fn: () => Promise<T>
): Promise<T> {
  const apartado = apartarPendientes(cwd, tareasRoot, id);
  let r: T;
  try {
    r = await fn();
  } catch (e: unknown) {
    throw conNota(e, apartado.devolverSiSePuede());
  }
  apartado.devolver();
  return r;
}

/** Aparta lo pendiente de la tarea en un stash con nombre propio (nada si no hay). */
export function apartarPendientes(cwd: string, tareasRoot: string, id: string): Apartado {
  let activo = false;
  if (hayPendientesDeTarea(cwd, tareasRoot, id)) {
    const spec = pathspecTarea(cwd, tareasRoot, id);
    runGit(['stash', 'push', '-q', '-u', '-m', mensajeApartado(id), '--', `:(top,glob)${spec}`], cwd);
    activo = true;
  }
  const devolver = (): void => {
    if (!activo) return;
    const ref = refApartado(cwd, id);
    activo = false;
    if (ref === null) throw new PendientesError(`[ERROR] ${id}: el stash de lo pendiente ha desaparecido. ${comoRecuperar(id)}`);
    pop(cwd, id, ref);
  };
  return {
    get activo() {
      return activo;
    },
    devolver,
    devolverSiSePuede(): string | null {
      if (!activo) return null;
      if (existsSync(path.resolve(cwd, runGit(['rev-parse', '--git-path', 'MERGE_HEAD'], cwd)))) {
        return comoRecuperar(id);
      }
      try {
        devolver();
        return null;
      } catch (e: unknown) {
        return e instanceof Error ? e.message : String(e);
      }
    },
  };
}
