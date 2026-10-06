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
const TASK_ID_RE = /^TASK-\d{3,}$/;
/** Valida el formato de un ID de tarea sin construir un Task completo.
 *  Se usa como guarda de seguridad ANTES de construir rutas de archivo
 *  a partir de un ID que puede venir de fuera (CLI), para evitar path
 *  traversal (hallazgo de revision por pares, Sprint 0). */
export function isValidTaskId(id) {
    return TASK_ID_RE.test(id);
}
export class InvalidTaskIdError extends Error {
    id;
    constructor(id) {
        super(`"${id}" no es un ID de tarea valido (se espera el formato TASK-NNN).`);
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
        fail('id', `El campo "id" ("${id}") debe tener el formato TASK-NNN (al menos 3 digitos).`);
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
