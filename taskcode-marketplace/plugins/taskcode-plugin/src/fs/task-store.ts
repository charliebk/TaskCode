/**
 * Unica capa que toca el sistema de archivos para leer/escribir
 * tareas. Deliberadamente delgada: toda la logica de negocio
 * (validacion, maquina de estados, generacion de ID) vive en
 * src/core/, que es puro y se prueba sin tocar disco. Aqui solo se
 * prueba el cableado (con directorios temporales).
 *
 * Seguridad (hallazgo de revision por pares, Sprint 0): todo ID que
 * llega aqui se valida con assertValidTaskId ANTES de construir
 * cualquier ruta, porque en cuanto existan comandos que reciban el ID
 * como argumento de CLI (plan, approve, start...) un id sin sanear
 * como "../../etc" podria escapar de tareasRoot.
 */
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  STATE_FOLDER,
  assertValidTaskId,
  type Task,
  type TareaUbicada,
  type TaskState,
} from '../core/task.js';
import { parseTareaFile, serializeTareaFile } from '../core/tarea-file.js';

const ALL_STATE_FOLDERS: readonly string[] = Object.values(STATE_FOLDER);
const TASK_ID_RE = /^TASK-\d{3,}$/;

export async function listExistingTaskIds(tareasRoot: string): Promise<string[]> {
  const ids: string[] = [];
  for (const folder of ALL_STATE_FOLDERS) {
    const dir = path.join(tareasRoot, folder);
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch (e: unknown) {
      if (isEnoent(e)) continue;
      throw e;
    }
    for (const entry of entries) {
      if (TASK_ID_RE.test(entry)) ids.push(entry);
    }
  }
  return ids;
}

export interface TareasEnEstadosResult {
  /** Tareas leidas y validadas, deduplicadas por ID. */
  tareas: TareaUbicada[];
  /**
   * Rutas de tarea.md que existen pero no se pudieron parsear ni
   * validar. Se devuelven en vez de lanzar para que el llamador decida
   * qué hacer: "taskctl start" (TASK-015) aborta si aparece alguna,
   * porque no sabe de quién es y podria ser la que bloquea el limite.
   */
  ilegibles: string[];
}

/**
 * Lee las tareas que viven en las carpetas de `estados`, y solo esas
 * (TASK-015). A diferencia de listExistingTaskIds + readTareaFile, no
 * recorre el ciclo de vida entero: el limite de WIP solo mira dos
 * carpetas, y readTareaFile busca por ID en todas, asi que usarlo aqui
 * leeria de mas y ademas no diria en qué carpeta encontro cada tarea.
 *
 * Deduplica por ID: si el mismo ID aparece en dos carpetas de estado a
 * la vez (inconsistencia de datos que "taskctl board" ya reporta como
 * advertencia), ocupa un hueco, no dos. Gana la primera segun el orden
 * de `estados`.
 *
 * Las rutas se construyen solo con nombres de directorio que ya
 * pasaron TASK_ID_RE, asi que no hay ID de fuera que llegue a
 * componer una ruta (misma precaucion que assertValidTaskId en el
 * resto del modulo).
 */
export async function listTareasEnEstados(
  tareasRoot: string,
  estados: readonly TaskState[]
): Promise<TareasEnEstadosResult> {
  const porId = new Map<string, TareaUbicada>();
  const ilegibles: string[] = [];

  for (const estado of estados) {
    const dir = path.join(tareasRoot, STATE_FOLDER[estado]);
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch (e: unknown) {
      if (isEnoent(e)) continue;
      throw e;
    }
    for (const entry of entries) {
      if (!TASK_ID_RE.test(entry)) continue;
      if (porId.has(entry)) continue;
      const filePath = path.join(dir, entry, 'tarea.md');
      let content: string;
      try {
        content = await readFile(filePath, 'utf8');
      } catch (e: unknown) {
        // Una carpeta de tarea sin tarea.md dentro no es una tarea:
        // no ocupa hueco ni impide comprobarlo.
        if (isEnoent(e)) continue;
        throw e;
      }
      try {
        porId.set(entry, { task: parseTareaFile(content).task, estadoCarpeta: estado });
      } catch {
        // Frontmatter roto o Task invalido. No se propaga: el llamador
        // decide (ver TareasEnEstadosResult.ilegibles). Cualquier otro
        // error de I/O si se propaga, arriba.
        ilegibles.push(filePath);
      }
    }
  }

  // Orden estable: el orden de readdir depende del filesystem, y estas
  // tareas acaban en un mensaje de error que los tests aseveran.
  ilegibles.sort();
  return { tareas: [...porId.values()], ilegibles };
}

export class TaskAlreadyExistsError extends Error {
  constructor(public readonly id: string, public readonly filePath: string) {
    super(`Ya existe un tarea.md para ${id} en ${filePath}.`);
    this.name = 'TaskAlreadyExistsError';
  }
}

export interface WriteTareaFileOptions {
  /**
   * Si es true, falla (TaskAlreadyExistsError) en vez de sobreescribir
   * cuando el fichero ya existe. Uso obligatorio para "taskctl new":
   * dos invocaciones concurrentes calculando el mismo siguiente ID no
   * deben pisarse el resultado en silencio (hallazgo de revision por
   * pares, Sprint 0). Los comandos que SI deben poder actualizar una
   * tarea existente (plan, approve, start...) usan el valor por
   * defecto (false).
   */
  failIfExists?: boolean;
}

export async function writeTareaFile(
  tareasRoot: string,
  task: Task,
  body: string,
  options: WriteTareaFileOptions = {}
): Promise<string> {
  assertValidTaskId(task.id);
  // Serializa (y por tanto revalida el Task completo con validateTask)
  // ANTES de tocar el filesystem, para no dejar directorios a medio
  // crear si el Task es invalido por otro motivo.
  const content = serializeTareaFile(task, body);

  const folder = STATE_FOLDER[task.estado];
  const dir = path.join(tareasRoot, folder, task.id);
  const filePath = path.join(dir, 'tarea.md');

  await mkdir(dir, { recursive: true });
  try {
    await writeFile(filePath, content, { encoding: 'utf8', flag: options.failIfExists ? 'wx' : 'w' });
  } catch (e: unknown) {
    if (options.failIfExists && isEexist(e)) {
      throw new TaskAlreadyExistsError(task.id, filePath);
    }
    throw e;
  }
  return filePath;
}

export class TaskFolderConflictError extends Error {
  constructor(public readonly id: string, public readonly targetDir: string) {
    super(
      `No se puede mover ${id} a ${targetDir}: la carpeta de destino ya existe. Revisalo a mano.`
    );
    this.name = 'TaskFolderConflictError';
  }
}

export interface MoveTareaFileOptions {
  /**
   * Si es true, tolera que la carpeta vieja ya no exista al mover
   * (ENOENT en el rename): en vez de fallar, recrea la carpeta nueva
   * con el contenido ya recibido en memoria. Pensado EXCLUSIVAMENTE
   * para el caso real que TASK-009 encontro: un script de Git-Flow
   * (create-hotfix.sh/create-release.sh) cambia de rama ANTES de que
   * el caller mueva la tarea, y si la rama nueva se creo desde una
   * base (main) que no incluye el historial de tareas/, Git ya borro
   * el fichero del working tree al hacer checkout. Por defecto es
   * false ("fail closed", hallazgo de revision por pares de TASK-009):
   * un caller que no espera perder la carpeta vieja (p. ej. un futuro
   * "taskctl approve" moviendo 00-planificadas -> 01-en-diseno sin
   * checkout de por medio) debe seguir fallando ruidosamente si eso
   * pasa, en vez de "arreglarlo" en silencio.
   */
  tolerateMissingSource?: boolean;
  /** Solo para tests (TASK-053): sustituye a `fs.rename`. */
  renombrar?: (desde: string, hasta: string) => Promise<void>;
  /** Solo para tests (TASK-053): esperas entre reintentos, en ms. */
  esperasReintento?: readonly number[];
}

/** Esperas entre reintentos del rename: ~3 s en total. */
const ESPERAS_RENAME_MS = [100, 200, 400, 800, 1600] as const;

/**
 * `rename` que reintenta ante EPERM o EBUSY (TASK-053). En Windows, un
 * antivirus o el indexador pueden tener abierto un instante un fichero de
 * la carpeta, y el rename falla aunque nada lo impida de verdad. Paso dos
 * veces seguidas en `finish` (TASK-037 y TASK-040), con el merge ya hecho:
 * la tarea quedaba a medias y habia que reintentar a mano. Cualquier otro
 * error, o agotar los reintentos, se propaga igual que antes.
 */
async function renombrarConReintentos(
  desde: string,
  hasta: string,
  renombrar: (a: string, b: string) => Promise<void>,
  esperas: readonly number[]
): Promise<void> {
  for (let intento = 0; ; intento++) {
    try {
      await renombrar(desde, hasta);
      return;
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      // MEN-1 de la revision: en Windows un rename puede MOVER la carpeta
      // y aun asi devolver EPERM. Si al reintentar el origen ya no esta y
      // el destino si, el movimiento ocurrio: no es un error.
      if (intento > 0 && code === 'ENOENT' && existsSync(hasta) && !existsSync(desde)) return;
      const transitorio = code === 'EPERM' || code === 'EBUSY';
      if (!transitorio || intento >= esperas.length) throw e;
      await new Promise((ok) => setTimeout(ok, esperas[intento]));
    }
  }
}

/**
 * Actualiza una tarea que puede haber cambiado de estado (y por tanto
 * de carpeta): mueve el directorio completo de la tarea (no solo
 * tarea.md, por si en el futuro guarda mas ficheros) con un unico
 * rename atomico si la carpeta de destino difiere, y despues
 * reescribe tarea.md con el frontmatter/cuerpo actualizados. Si la
 * carpeta de destino ya existiera (no deberia pasar nunca en uso
 * normal), falla en vez de arriesgarse a mezclar dos tareas — mismo
 * principio "fail closed" que TaskAlreadyExistsError en writeTareaFile.
 */
export async function moveTareaFile(
  tareasRoot: string,
  previousFilePath: string,
  task: Task,
  body: string,
  options: MoveTareaFileOptions = {}
): Promise<string> {
  assertValidTaskId(task.id);
  // Revalida (via serializeTareaFile) ANTES de tocar el filesystem.
  const content = serializeTareaFile(task, body);

  const newDir = path.join(tareasRoot, STATE_FOLDER[task.estado], task.id);
  const oldDir = path.dirname(previousFilePath);

  if (path.resolve(oldDir) !== path.resolve(newDir)) {
    let destinoOcupado = false;
    try {
      await stat(newDir);
      destinoOcupado = true;
    } catch (e: unknown) {
      if (!isEnoent(e)) throw e;
    }
    if (destinoOcupado) {
      throw new TaskFolderConflictError(task.id, newDir);
    }
    await mkdir(path.dirname(newDir), { recursive: true });
    try {
      await renombrarConReintentos(
        oldDir,
        newDir,
        options.renombrar ?? rename,
        options.esperasReintento ?? ESPERAS_RENAME_MS
      );
    } catch (e: unknown) {
      if (!isEnoent(e) || !options.tolerateMissingSource) throw e;
      // La carpeta vieja no existe en el working tree actual y el
      // caller declaro explicitamente (tolerateMissingSource) que ese
      // escenario es esperado. No hay nada que mover: se recrea la
      // carpeta y se escribe la tarea con el contenido ya leido en
      // memoria antes de invocar el script. La copia vieja sigue intacta
      // en el historial de la rama de origen, no se pierde.
      await mkdir(newDir, { recursive: true });
    }
  }

  const filePath = path.join(newDir, 'tarea.md');
  await writeFile(filePath, content, 'utf8');
  return filePath;
}

export interface ReadTareaResult {
  task: Task;
  body: string;
  filePath: string;
}

export async function readTareaFile(
  tareasRoot: string,
  id: string
): Promise<ReadTareaResult | null> {
  assertValidTaskId(id);
  for (const folder of ALL_STATE_FOLDERS) {
    const filePath = path.join(tareasRoot, folder, id, 'tarea.md');
    try {
      const content = await readFile(filePath, 'utf8');
      const { task, body } = parseTareaFile(content);
      return { task, body, filePath };
    } catch (e: unknown) {
      if (isEnoent(e)) continue;
      throw e;
    }
  }
  return null;
}

/**
 * Exportadas (hallazgo de revision por pares, TASK-010): otros modulos
 * que escriben ficheros auxiliares de una tarea (p. ej. plan.ts con
 * plan-final.md) necesitan la misma comprobacion de codigo de error
 * que esta capa ya resolvia solo para uso interno.
 */
export function isEnoent(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'ENOENT';
}

export function isEexist(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'EEXIST';
}

/**
 * ENOTDIR: un componente intermedio de la ruta existe pero no es un
 * directorio (p. ej. stat("planificacion/plan-final.md") cuando
 * "planificacion" es un fichero). POSIX lo devuelve aqui; Windows
 * contesta ENOENT al mismo caso. Quien pregunte "existe este fichero?"
 * tiene que tratar los dos igual si quiere comportarse igual en las dos
 * plataformas (hallazgo IMPORTANTE de revision por pares, TASK-027).
 */
export function isEnotdir(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'ENOTDIR';
}
