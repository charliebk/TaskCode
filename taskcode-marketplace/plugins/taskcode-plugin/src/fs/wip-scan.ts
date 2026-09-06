/**
 * Escaneo del trabajo en curso para el limite de WIP (TASK-025, item
 * C8). Vive en un modulo propio porque cruza las dos capas — necesita
 * Git y el parser de tareas —, y task-store.ts nunca ha importado
 * git.ts.
 *
 * POR QUE EXISTE ESTE MODULO. B7 comprobaba el limite leyendo
 * "tareas/02-en-curso" del working tree. Esa pregunta es la correcta
 * pero el sitio es el equivocado: "taskctl start" mueve la tarea a
 * 02-en-curso y ese movimiento se commitea EN LA RAMA DE LA TAREA,
 * mientras que "plan"/"new"/"import" devuelven el repo a la rama base
 * (ensureBaseBranchReady) y "create-<tipo>.sh" tambien parte de ahi.
 * En develop NINGUNA tarea esta nunca en curso, asi que la
 * comprobacion no encontraba nada y el limite no protegia nada.
 *
 * El smoke test de B7 no lo detecto porque encadenaba dos "start"
 * seguidos: el unico orden en el que el limite si funcionaba.
 *
 * La pregunta que hace este modulo es la util y ademas la mas directa:
 * "¿tiene esta persona alguna RAMA DE TRABAJO abierta?". Una rama de
 * tarea que existe y no esta mergeada ES, literalmente, trabajo en
 * curso — y, a diferencia del working tree, se ve desde cualquier
 * sitio.
 */
import path from 'node:path';
import { STATE_FOLDER, type TareaUbicada, type TaskState } from '../core/task.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { listTareasEnEstados, type TareasEnEstadosResult } from './task-store.js';
import { isAncestor, localBranches, lsTreeNames, showFileAtRef } from './git.js';

const TASK_ID_RE = /^TASK-\d{3,}$/;

/**
 * Ramas locales que cuentan como trabajo abierto: ni la base ni la
 * principal, y no mergeadas en ninguna de las dos.
 *
 * El filtro de mergeadas no es cosmetico en este repo: la politica
 * IECA dice que las ramas NO se borran tras el merge, asi que hay
 * decenas vivas y casi todas cerradas. Sin el, cualquiera de ellas
 * bloquearia a todo el mundo para siempre.
 *
 * Se comprueba contra la base Y la principal porque un hotfix mergeado
 * a main esta cerrado aunque no haya llegado a develop (p. ej. si el
 * backmerge fallo): bloquear por eso seria un falso positivo con una
 * causa dificilisima de adivinar desde el mensaje de error.
 */
export function ramasDeTrabajoAbiertas(
  repoCwd: string,
  baseBranch: string,
  mainBranch: string
): string[] {
  return localBranches(repoCwd).filter((rama) => {
    if (rama === baseBranch || rama === mainBranch) return false;
    if (isAncestor(rama, baseBranch, repoCwd)) return false;
    if (mainBranch !== baseBranch && isAncestor(rama, mainBranch, repoCwd)) return false;
    return true;
  });
}

/** Extrae el ID de tarea de una ruta "tareas/<carpeta>/TASK-NNN/tarea.md". */
function idDesdeRuta(ruta: string): string | null {
  const partes = ruta.split('/');
  const id = partes[partes.length - 2];
  return id !== undefined && TASK_ID_RE.test(id) ? id : null;
}

/**
 * Tareas en `estados` que viven dentro de las ramas de trabajo
 * abiertas, leidas de cada rama con "git show" (nunca del working
 * tree).
 *
 * Las rutas ilegibles se devuelven como "rama:ruta" para que el
 * mensaje de error diga DONDE mirar: sin la rama, la ruta sola manda a
 * la persona a un fichero que en su checkout no existe.
 */
export function tareasEnRamasAbiertas(
  repoCwd: string,
  ramas: readonly string[],
  estados: readonly TaskState[]
): { tareas: TareaUbicada[]; ilegibles: string[] } {
  const tareas: TareaUbicada[] = [];
  const ilegibles: string[] = [];

  for (const rama of ramas) {
    for (const estado of estados) {
      const prefijo = `tareas/${STATE_FOLDER[estado]}`;
      for (const ruta of lsTreeNames(rama, prefijo, repoCwd)) {
        if (path.basename(ruta) !== 'tarea.md') continue;
        if (idDesdeRuta(ruta) === null) continue;
        try {
          tareas.push({ task: parseTareaFile(showFileAtRef(rama, ruta, repoCwd)).task, estadoCarpeta: estado });
        } catch {
          // Frontmatter roto o Task invalido dentro de esa rama. No se
          // propaga: el llamador decide (fail-closed en start). Un
          // fallo del propio Git si se propaga, con su mensaje.
          ilegibles.push(`${rama}:${ruta}`);
        }
      }
    }
  }

  return { tareas, ilegibles };
}

/**
 * Lo que ve el limite de WIP: la union de las tareas del arbol activo
 * y las de las ramas de trabajo abiertas, deduplicada por ID.
 *
 * Se conserva la lectura del arbol activo ADEMAS de la de las ramas, y
 * no es redundante: cubre una tarea movida a 02-en-curso y commiteada
 * en la propia rama base (lo que pasa con las tareas del
 * bootstrapping), que ninguna rama de trabajo reflejaria.
 */
export async function escanearWip(
  tareasRoot: string,
  repoCwd: string,
  baseBranch: string,
  mainBranch: string,
  estados: readonly TaskState[]
): Promise<TareasEnEstadosResult> {
  const enArbol = await listTareasEnEstados(tareasRoot, estados);
  const ramas = ramasDeTrabajoAbiertas(repoCwd, baseBranch, mainBranch);
  const enRamas = tareasEnRamasAbiertas(repoCwd, ramas, estados);

  const porId = new Map<string, TareaUbicada>();
  for (const t of [...enArbol.tareas, ...enRamas.tareas]) {
    // Gana la primera vista: el arbol activo antes que las ramas. Da
    // igual cual, porque solo se usa para saber de quien es y en que
    // carpeta esta, y en ambas fuentes ocupa un unico hueco.
    if (!porId.has(t.task.id)) porId.set(t.task.id, t);
  }

  const ilegibles = [...enArbol.ilegibles, ...enRamas.ilegibles].sort();
  return { tareas: [...porId.values()], ilegibles };
}
