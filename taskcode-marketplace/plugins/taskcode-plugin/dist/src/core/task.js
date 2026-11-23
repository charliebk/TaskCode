/**
 * Modelo de datos de una tarea (`tarea.md`) y su validacion. Ver
 * seccion 4 de docs/PROPUESTA_METODOLOGIA.md para la plantilla de
 * referencia.
 */
export const REGLAS_SELECCION_SKILL = [
    'solape',
    'prioridad',
    'llm',
];
export const TASK_TYPES = ['feature', 'fix', 'hotfix', 'release'];
export const TASK_COMPLEXITIES = [
    'trivial',
    'simple',
    'media',
    'alta',
    'critica',
];
export const TASK_STATES = [
    'planificada',
    'en-diseno',
    'en-curso',
    'en-revision',
    'terminada',
];
/** Carpeta numerada del ciclo de vida (seccion 5 de la metodologia). */
export const STATE_FOLDER = {
    planificada: '00-planificadas',
    'en-diseno': '01-en-diseno',
    'en-curso': '02-en-curso',
    'en-revision': '03-en-revision',
    terminada: '04-terminadas',
};
/** Orden de campos tal y como aparecen en la plantilla (seccion 4). */
export const TASK_FIELD_ORDER = [
    'id',
    'titulo',
    'tipo',
    'sprint',
    'etiquetas',
    'complejidad',
    'modelo_sugerido',
    'estado',
    'plan_aprobado',
    'rama',
    'asignado_a',
    'agente_revisor',
    'skills_recomendados',
    'regla_seleccion_skill',
    'ultimo_commit_revisado',
    'revision_codex',
    'tokens_diseno',
    'tokens_implementacion',
    'tokens_revision',
    'creado',
    'actualizado',
    'dependencias',
];
/**
 * TASK-147b (CORE2-01, FS-04, CMD2-08): la unica regex del ID de tarea.
 * Grupo 1, el numero (3 cifras o mas); grupo 2, la letra de una parte de un
 * troceo (`TASK-121a`) o ''.
 */
export const TASK_ID_RE = /^TASK-(\d{3,})([a-z]?)$/;
/** Valida el formato de un ID de tarea sin construir un Task completo.
 *  Se usa como guarda de seguridad ANTES de construir rutas de archivo
 *  a partir de un ID que puede venir de fuera (CLI), para evitar path
 *  traversal (hallazgo de revision por pares, Sprint 0). */
export function isValidTaskId(id) {
    return TASK_ID_RE.test(id);
}
/** `TASK-121` -> true; `TASK-121a` -> false (una parte no se vuelve a trocear). CORE2-14. */
export function esIdTroceable(id) {
    const m = TASK_ID_RE.exec(id);
    return m !== null && m[2] === '';
}
// Para ORDENAR se acepta cualquier numero de cifras (`TASK-0099`, `TASK-12`): es
// TASK_ID_RE sin el minimo de tres. Ordenar no abre rutas, y metricas de otros
// proyectos o un ROADMAP editado a mano pueden traer IDs que no se validarian.
const ID_PARA_ORDENAR_RE = new RegExp(TASK_ID_RE.source.replace('{3,}', '+'));
/**
 * TASK-147b (CORE2-01): el orden de los IDs de tarea, el mismo en board,
 * wip, roadmap y evolucion. Por numero (TASK-999 antes que TASK-1000), y
 * dentro del numero la tarea entera antes que sus partes (TASK-121,
 * TASK-121a, TASK-121b, TASK-122). Lo que no es un ID va al final, por cadena.
 */
export function compararIds(a, b) {
    const ma = ID_PARA_ORDENAR_RE.exec(a);
    const mb = ID_PARA_ORDENAR_RE.exec(b);
    if (ma === null || mb === null) {
        if (ma !== mb)
            return ma === null ? 1 : -1;
        return a < b ? -1 : a > b ? 1 : 0;
    }
    const d = Number(ma[1]) - Number(mb[1]);
    if (d !== 0)
        return d;
    const la = ma[2];
    const lb = mb[2];
    if (la !== lb)
        return la < lb ? -1 : 1;
    // MEN-2 de la revision: mismo numero con distinto relleno (TASK-099 y
    // TASK-0099): por cadena, para no depender del orden de readdir.
    return a < b ? -1 : a > b ? 1 : 0;
}
export class InvalidTaskIdError extends Error {
    id;
    constructor(id) {
        super(`"${id}" no es un ID de tarea valido (se espera el formato TASK-NNN, o TASK-NNNa si es una parte de un troceo).`);
        this.id = id;
        this.name = 'InvalidTaskIdError';
    }
}
/** Lanza InvalidTaskIdError si `id` no tiene el formato TASK-NNN.
 *  Debe llamarse ANTES de usar el id en cualquier ruta de archivo. */
export function assertValidTaskId(id) {
    if (!isValidTaskId(id)) {
        throw new InvalidTaskIdError(id);
    }
}
export class TaskValidationError extends Error {
    field;
    constructor(field, message) {
        super(message);
        this.field = field;
        this.name = 'TaskValidationError';
    }
}
function fail(field, message) {
    throw new TaskValidationError(field, message);
}
function requireString(data, field) {
    const v = data[field];
    if (typeof v !== 'string' || v.trim() === '') {
        fail(field, `El campo "${field}" es obligatorio y debe ser una cadena no vacia.`);
    }
    return v;
}
function requireNullableString(data, field) {
    const v = data[field];
    if (v === null || v === undefined)
        return null;
    if (typeof v !== 'string') {
        fail(field, `El campo "${field}" debe ser una cadena o null.`);
    }
    return v;
}
/**
 * Entero >= 0 o null (ausente = null). Rechaza cadenas, flotantes y
 * negativos: un coste de «12k» o de -5 es un dato mal escrito, no un cero.
 */
export function requireNullableNumber(data, field) {
    const v = data[field];
    if (v === null || v === undefined)
        return null;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
        fail(field, `El campo "${field}" debe ser un numero entero >= 0 o null.`);
    }
    return v;
}
function requireNumber(data, field) {
    const v = data[field];
    if (typeof v !== 'number' || !Number.isInteger(v)) {
        fail(field, `El campo "${field}" debe ser un numero entero.`);
    }
    return v;
}
function requireBoolean(data, field) {
    const v = data[field];
    if (typeof v !== 'boolean') {
        fail(field, `El campo "${field}" debe ser true o false.`);
    }
    return v;
}
function requireStringArray(data, field) {
    const v = data[field];
    if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
        fail(field, `El campo "${field}" debe ser una lista de cadenas (p. ej. [a, b]).`);
    }
    return v;
}
function requireEnum(data, field, allowed) {
    const v = requireString(data, field);
    if (!allowed.includes(v)) {
        fail(field, `El campo "${field}" tiene el valor "${v}", pero debe ser uno de: ${allowed.join(', ')}.`);
    }
    return v;
}
function requireNullableEnum(data, field, allowed) {
    const v = data[field];
    if (v === null || v === undefined)
        return null;
    if (typeof v !== 'string' || !allowed.includes(v)) {
        fail(field, `El campo "${field}" debe ser null o uno de: ${allowed.join(', ')}.`);
    }
    return v;
}
/**
 * Valida y convierte un objeto generico (tal como lo devuelve
 * parseFrontmatter) en un Task tipado. Lanza TaskValidationError con
 * el primer campo invalido que encuentra.
 */
export function validateTask(data) {
    const id = requireString(data, 'id');
    if (!TASK_ID_RE.test(id)) {
        fail('id', `El campo "id" ("${id}") debe tener el formato TASK-NNN (al menos 3 digitos) o TASK-NNNa (una parte de un troceo).`);
    }
    const task = {
        id,
        titulo: requireString(data, 'titulo'),
        tipo: requireEnum(data, 'tipo', TASK_TYPES),
        sprint: requireNumber(data, 'sprint'),
        etiquetas: requireStringArray(data, 'etiquetas'),
        complejidad: requireNullableEnum(data, 'complejidad', TASK_COMPLEXITIES),
        modelo_sugerido: requireString(data, 'modelo_sugerido'),
        estado: requireEnum(data, 'estado', TASK_STATES),
        plan_aprobado: requireBoolean(data, 'plan_aprobado'),
        rama: requireString(data, 'rama'),
        asignado_a: requireNullableString(data, 'asignado_a'),
        agente_revisor: requireString(data, 'agente_revisor'),
        skills_recomendados: requireStringArray(data, 'skills_recomendados'),
        regla_seleccion_skill: requireNullableEnum(data, 'regla_seleccion_skill', REGLAS_SELECCION_SKILL),
        ultimo_commit_revisado: requireNullableString(data, 'ultimo_commit_revisado'),
        revision_codex: requireBoolean(data, 'revision_codex'),
        tokens_diseno: requireNullableNumber(data, 'tokens_diseno'),
        tokens_implementacion: requireNullableNumber(data, 'tokens_implementacion'),
        tokens_revision: requireNullableNumber(data, 'tokens_revision'),
        creado: requireString(data, 'creado'),
        actualizado: requireString(data, 'actualizado'),
        dependencias: requireStringArray(data, 'dependencias'),
    };
    if (task.sprint < 0) {
        fail('sprint', 'El campo "sprint" no puede ser negativo.');
    }
    return task;
}
