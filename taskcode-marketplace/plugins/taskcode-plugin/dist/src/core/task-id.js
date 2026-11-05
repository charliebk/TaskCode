/**
 * Generacion determinista del siguiente ID de tarea (TASK-003 de
 * PLAN_SPRINTS.md): maximo ID existente + 1, sin colisiones, sin
 * tocar el sistema de archivos (eso lo hace src/fs/task-store.ts).
 *
 * Rango reservado (TASK-067): los IDs desde `ID_RESERVADO_MIN` hacia arriba
 * (TASK-9000..TASK-9999 y cualquier otro >= 9000) no los usa la numeracion
 * normal. Los reparte `nextReservedTaskId` hacia abajo desde TASK-9999, para
 * las tareas que crea `taskctl doctor-deploy --crear-tareas` sin chocar con
 * las que se crean a mano.
 */
const TASK_ID_RE = /^TASK-(\d{3,})$/;
/** `feature/task-9999-slug`, `fix/task-9998`: el numero de tarea dentro del nombre de una rama. */
const RAMA_TASK_RE = /(?:^|\/)task-(\d{3,})(?:-|$)/i;
/** Numero de la tarea en un nombre de rama (`feature/task-078-x` -> 78), o null. */
export function numeroDeRama(rama) {
    const m = RAMA_TASK_RE.exec(rama);
    return m === null ? null : parseInt(m[1], 10);
}
/** Primer numero del rango reservado. */
export const ID_RESERVADO_MIN = 9000;
/** Primer ID que reparte el rango reservado (y el mayor posible). */
export const ID_RESERVADO_MAX = 9999;
export class TaskIdError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TaskIdError';
    }
}
const formatear = (n) => `TASK-${String(n).padStart(3, '0')}`;
/** true si el ID cae en el rango reservado (TASK-9000 o mas). */
export function esIdReservado(id) {
    const m = TASK_ID_RE.exec(id);
    return m !== null && parseInt(m[1], 10) >= ID_RESERVADO_MIN;
}
/**
 * Siguiente ID de la numeracion normal. Ignora el rango reservado: con
 * TASK-065 y TASK-9999 devuelve TASK-066. Si la numeracion normal llegara al
 * rango reservado, aborta en vez de repartir un ID que ya le pertenece.
 */
export function nextTaskId(existingIds) {
    let max = 0;
    for (const id of existingIds) {
        const m = TASK_ID_RE.exec(id);
        if (!m)
            continue;
        const n = parseInt(m[1], 10);
        if (n >= ID_RESERVADO_MIN)
            continue;
        if (n > max)
            max = n;
    }
    const next = max + 1;
    if (next >= ID_RESERVADO_MIN) {
        throw new TaskIdError(`La numeracion normal de tareas llego a TASK-${String(max)} y el siguiente (TASK-${String(next)}) ` +
            `cae en el rango reservado (TASK-${String(ID_RESERVADO_MIN)} en adelante). Archiva o renumera tareas antes de crear mas.`);
    }
    return formatear(next);
}
/** Numeros del rango reservado que aparecen en IDs de tarea o en nombres de rama. */
function numerosReservados(ids, ramas) {
    const nums = [];
    for (const id of ids) {
        const m = TASK_ID_RE.exec(id);
        if (m)
            nums.push(parseInt(m[1], 10));
    }
    for (const rama of ramas) {
        const m = RAMA_TASK_RE.exec(rama);
        if (m)
            nums.push(parseInt(m[1], 10));
    }
    return nums.filter((n) => n >= ID_RESERVADO_MIN);
}
/**
 * Siguiente ID del rango reservado: baja desde TASK-9999. Mira las tareas Y
 * las ramas (`feature/task-9999-*`): las ramas no se borran tras el merge, asi
 * que un ID cuya carpeta se borro sigue ocupado. Aborta si el rango se agota (el
 * suelo es el primer ID reservado, que la numeracion normal tampoco reparte).
 */
export function nextReservedTaskId(existingIds, ramas = []) {
    const usados = numerosReservados(existingIds, ramas);
    // Un ID mayor que 9999 (p. ej. TASK-10000 de un plugin antiguo) no ocupa hueco de bajada.
    const dentro = usados.filter((n) => n <= ID_RESERVADO_MAX);
    const next = dentro.length === 0 ? ID_RESERVADO_MAX : Math.min(...dentro) - 1;
    if (next < ID_RESERVADO_MIN) {
        throw new TaskIdError(`El rango reservado (TASK-${String(ID_RESERVADO_MIN)}..TASK-${String(ID_RESERVADO_MAX)}) esta agotado. ` +
            'Cierra o archiva las tareas de doctor-deploy que ya no hagan falta.');
    }
    return formatear(next);
}
