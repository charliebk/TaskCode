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
import { STATE_FOLDER, assertValidTaskId, } from '../core/task.js';
import { parseTareaFile, serializeTareaFile } from '../core/tarea-file.js';
const ALL_STATE_FOLDERS = Object.values(STATE_FOLDER);
const TASK_ID_RE = /^TASK-\d{3,}$/;
export async function listExistingTaskIds(tareasRoot) {
    const ids = [];
    for (const folder of ALL_STATE_FOLDERS) {
        const dir = path.join(tareasRoot, folder);
        let entries;
        try {
            entries = await readdir(dir);
        }
        catch (e) {
            if (isEnoent(e))
                continue;
            throw e;
        }
        for (const entry of entries) {
            if (TASK_ID_RE.test(entry))
                ids.push(entry);
        }
    }
    return ids;
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
export async function listTareasEnEstados(tareasRoot, estados) {
    const porId = new Map();
    const ilegibles = [];
    for (const estado of estados) {
        const dir = path.join(tareasRoot, STATE_FOLDER[estado]);
        let entries;
        try {
            entries = await readdir(dir);
        }
        catch (e) {
            if (isEnoent(e))
                continue;
            throw e;
        }
        for (const entry of entries) {
            if (!TASK_ID_RE.test(entry))
                continue;
            if (porId.has(entry))
                continue;
            const filePath = path.join(dir, entry, 'tarea.md');
            let content;
            try {
                content = await readFile(filePath, 'utf8');
            }
            catch (e) {
                // Una carpeta de tarea sin tarea.md dentro no es una tarea:
                // no ocupa hueco ni impide comprobarlo.
                if (isEnoent(e))
                    continue;
                throw e;
            }
            try {
                porId.set(entry, { task: parseTareaFile(content).task, estadoCarpeta: estado });
            }
            catch {
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
    id;
    filePath;
    constructor(id, filePath) {
        super(`Ya existe un tarea.md para ${id} en ${filePath}.`);
        this.id = id;
        this.filePath = filePath;
        this.name = 'TaskAlreadyExistsError';
    }
}
export async function writeTareaFile(tareasRoot, task, body, options = {}) {
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
    }
    catch (e) {
        if (options.failIfExists && isEexist(e)) {
            throw new TaskAlreadyExistsError(task.id, filePath);
        }
        throw e;
    }
    return filePath;
}
export class TaskFolderConflictError extends Error {
    id;
    targetDir;
    constructor(id, targetDir) {
        super(`No se puede mover ${id} a ${targetDir}: la carpeta de destino ya existe. Revisalo a mano.`);
        this.id = id;
        this.targetDir = targetDir;
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
export async function moveTareaFile(tareasRoot, previousFilePath, task, body, options = {}) {
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
        }
        catch (e) {
            if (!isEnoent(e))
                throw e;
        }
        if (destinoOcupado) {
            throw new TaskFolderConflictError(task.id, newDir);
        }
        await mkdir(path.dirname(newDir), { recursive: true });
        try {
            await rename(oldDir, newDir);
        }
        catch (e) {
            if (!isEnoent(e) || !options.tolerateMissingSource)
                throw e;
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
export async function readTareaFile(tareasRoot, id) {
    assertValidTaskId(id);
    for (const folder of ALL_STATE_FOLDERS) {
        const filePath = path.join(tareasRoot, folder, id, 'tarea.md');
        try {
            const content = await readFile(filePath, 'utf8');
            const { task, body } = parseTareaFile(content);
            return { task, body, filePath };
        }
        catch (e) {
            if (isEnoent(e))
                continue;
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
export function isEnoent(e) {
    return typeof e === 'object' && e !== null && e.code === 'ENOENT';
}
export function isEexist(e) {
    return typeof e === 'object' && e !== null && e.code === 'EEXIST';
}
/**
 * ENOTDIR: un componente intermedio de la ruta existe pero no es un
 * directorio (p. ej. stat("planificacion/plan-final.md") cuando
 * "planificacion" es un fichero). POSIX lo devuelve aqui; Windows
 * contesta ENOENT al mismo caso. Quien pregunte "existe este fichero?"
 * tiene que tratar los dos igual si quiere comportarse igual en las dos
 * plataformas (hallazgo IMPORTANTE de revision por pares, TASK-027).
 */
export function isEnotdir(e) {
    return typeof e === 'object' && e !== null && e.code === 'ENOTDIR';
}
