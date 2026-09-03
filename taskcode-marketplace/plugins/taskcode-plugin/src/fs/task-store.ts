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
import { readdir, readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { STATE_FOLDER, assertValidTaskId, type Task } from '../core/task.js';
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
  body: string
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
      await rename(oldDir, newDir);
    } catch (e: unknown) {
      if (!isEnoent(e)) throw e;
      // La carpeta vieja no existe en el working tree actual. Pasa de
      // verdad con hotfix/release (TASK-009): create-hotfix.sh y
      // create-release.sh cambian de rama a una creada desde main/develop
      // ANTES de que moveTareaFile se ejecute, y si esa base no incluye
      // este fichero (p. ej. un hotfix creado desde main cuando la tarea
      // solo estaba commiteada en develop) Git ya lo elimino del working
      // tree al hacer checkout. No hay nada que mover: se recrea la
      // carpeta y se escribe la tarea con el contenido ya leido en
      // memoria antes de invocar el script. La copia vieja sigue intacta
      // en el historial de la rama de origen (develop), no se pierde.
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

function isEnoent(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'ENOENT';
}

function isEexist(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === 'EEXIST';
}
