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
import {
  isAncestor,
  localBranchExists,
  localBranches,
  lsTreeNames,
  showFileAtRef,
} from './git.js';

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
/**
 * Ramas que, si contienen una rama de trabajo, significan que esa rama
 * ya esta cerrada. Es SIEMPRE el mismo conjunto, no depende del tipo de
 * la tarea que arranca.
 *
 * Que dependiera del tipo era un hallazgo CRITICO de revision por
 * pares: para un hotfix la base es "main" y la principal tambien, asi
 * que develop desaparecia del conjunto. Como entre release y release
 * ninguna rama de tarea es antepasado de main, TODAS pasaban por
 * abiertas: en el repo real eran 18, y "taskctl start" de un hotfix
 * quedaba bloqueado acusando a tareas ya terminadas de seguir en curso,
 * con un remedio ("taskctl finish") que respondia "ya esta terminada".
 * El camino urgente, inutilizable.
 *
 * Solo refs LOCALES, y sin preguntar al remoto: resolveMainBranch hace
 * hasta dos "git ls-remote", ~2,3 s por invocacion (medido en la
 * revision), para un valor que ademas se descartaba si main no era
 * local. Y contradecia la razon por la que este modulo no mira ramas
 * remotas: no meter la red en un comando que funciona sin conexion.
 */
export function referenciasDeCierre(repoCwd: string, baseBranch: string): string[] {
  return [baseBranch, 'develop', 'main', 'master'].filter(
    (ref, i, todas) => todas.indexOf(ref) === i && localBranchExists(ref, repoCwd)
  );
}

export function ramasDeTrabajoAbiertas(repoCwd: string, baseBranch: string): string[] {
  const referencias = referenciasDeCierre(repoCwd, baseBranch);

  // Sin ninguna referencia local no se puede saber que esta mergeado, y
  // entonces TODA rama pareceria abierta: en vez de bloquear a todo el
  // mundo por no poder mirar, no se escanea ninguna. Es un falso
  // negativo en un caso rarisimo (un checkout sin develop, main ni
  // master en local), preferible a falsos positivos en masa que ademas
  // no se podrian arreglar cerrando nada.
  if (referencias.length === 0) return [];

  return localBranches(repoCwd).filter((rama) => {
    if (referencias.includes(rama)) return false;
    return !referencias.some((ref) => isAncestor(rama, ref, repoCwd));
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
        // El "show" va FUERA del try de parseo: si falla Git (una ref
        // corrupta, un fichero que revienta el maxBuffer) eso no es una
        // tarea dudosa, es un problema de Git, y su error debe salir
        // con su mensaje en vez de disfrazarse de "arregla el
        // frontmatter" (hallazgo MENOR de revision por pares).
        const contenido = showFileAtRef(rama, ruta, repoCwd);
        try {
          tareas.push({ task: parseTareaFile(contenido).task, estadoCarpeta: estado });
        } catch {
          // Frontmatter roto o Task invalido dentro de esa rama. No se
          // propaga: el llamador decide.
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
export interface EscaneoWip {
  tareas: TareaUbicada[];
  /**
   * Ilegibles del ARBOL ACTIVO. Bloquean (fail-closed): estan delante
   * de quien ejecuta y se arreglan editando el fichero.
   */
  ilegibles: string[];
  /**
   * Ilegibles dentro de OTRAS RAMAS. Solo avisan.
   *
   * Hallazgo IMPORTANTE de revision por pares: al pasar a escanear
   * ramas, el fail-closed de B7 dejo de cubrir el working tree para
   * cubrir el historial de todas las ramas locales sin mergear — 18 en
   * este repo, muchas de auditoria que nadie va a tocar por politica.
   * Un solo tarea.md corrupto en cualquiera de ellas dejaba a TODO el
   * mundo sin poder arrancar nada, y "arregla su frontmatter" era
   * inaplicable: hay que hacer checkout de esa rama, corregir y
   * commitear alli. El coste de la duda lo pagaba quien no la creo.
   */
  avisos: string[];
}

export async function escanearWip(
  tareasRoot: string,
  repoCwd: string,
  baseBranch: string,
  estados: readonly TaskState[]
): Promise<EscaneoWip> {
  const enArbol = await listTareasEnEstados(tareasRoot, estados);
  const ramas = ramasDeTrabajoAbiertas(repoCwd, baseBranch);
  const enRamas = tareasEnRamasAbiertas(repoCwd, ramas, estados);

  const porId = new Map<string, TareaUbicada>();
  // Las ramas van PRIMERO y ganan: su copia es la fresca. La del arbol
  // de la rama base puede estar desactualizada, y decide de QUIEN es la
  // tarea — hallazgo MENOR de revision por pares, que reprodujo una
  // tarea reasignada dentro de su rama y bloqueando a la persona
  // equivocada.
  for (const t of [...enRamas.tareas, ...enArbol.tareas]) {
    if (!porId.has(t.task.id)) porId.set(t.task.id, t);
  }

  return {
    tareas: [...porId.values()],
    ilegibles: [...enArbol.ilegibles].sort(),
    avisos: [...enRamas.ilegibles].sort(),
  };
}
