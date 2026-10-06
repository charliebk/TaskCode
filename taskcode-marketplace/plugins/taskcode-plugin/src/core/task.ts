/**
 * Modelo de datos de una tarea (`tarea.md`) y su validacion. Ver
 * seccion 4 de docs/PROPUESTA_METODOLOGIA.md para la plantilla de
 * referencia.
 */

export type TaskType = 'feature' | 'fix' | 'hotfix' | 'release';
export type TaskComplexity = 'trivial' | 'simple' | 'media' | 'alta' | 'critica';
export type TaskState =
  | 'planificada'
  | 'en-diseno'
  | 'en-curso'
  | 'en-revision'
  | 'terminada';
/**
 * Que regla decidio la skill ganadora en `skills_recomendados` (seccion
 * 6.6, TASK-017): "solape" si gano por interseccion de etiquetas sin
 * empate, "prioridad" si desempato la prioridad declarada en el
 * catalogo, "llm" si ni el solape ni la prioridad desempataron y una
 * consulta barata al modelo decidio entre el top-N. `null` cuando no
 * hubo seleccion (ningun candidato solapo etiquetas).
 */
export type ReglaSeleccionSkill = 'solape' | 'prioridad' | 'llm';
export const REGLAS_SELECCION_SKILL: readonly ReglaSeleccionSkill[] = [
  'solape',
  'prioridad',
  'llm',
];

export const TASK_TYPES: readonly TaskType[] = ['feature', 'fix', 'hotfix', 'release'];
export const TASK_COMPLEXITIES: readonly TaskComplexity[] = [
  'trivial',
  'simple',
  'media',
  'alta',
  'critica',
];
export const TASK_STATES: readonly TaskState[] = [
  'planificada',
  'en-diseno',
  'en-curso',
  'en-revision',
  'terminada',
];

/** Carpeta numerada del ciclo de vida (seccion 5 de la metodologia). */
export const STATE_FOLDER: Record<TaskState, string> = {
  planificada: '00-planificadas',
  'en-diseno': '01-en-diseno',
  'en-curso': '02-en-curso',
  'en-revision': '03-en-revision',
  terminada: '04-terminadas',
};

export interface Task {
  id: string;
  titulo: string;
  tipo: TaskType;
  sprint: number;
  etiquetas: string[];
  /**
   * null = no declarada (TASK-042, decision C4): decide la heuristica.
   * `new` e `import` la dejan asi cuando no se pasa --complejidad.
   */
  complejidad: TaskComplexity | null;
  modelo_sugerido: string;
  estado: TaskState;
  plan_aprobado: boolean;
  rama: string;
  asignado_a: string | null;
  agente_revisor: string;
  skills_recomendados: string[];
  regla_seleccion_skill: ReglaSeleccionSkill | null;
  ultimo_commit_revisado: string | null;
  revision_codex: boolean;
  /**
   * TASK-023: coste en tokens de cada fase: tokens procesados por sus
   * subagentes, sumados de sus transcripciones (`registrar-coste --agente`),
   * mas lo que se registre a mano con `--tokens` (la parte del orquestador). null = no registrado; en el fichero, ausente tambien es
   * null, asi las tareas anteriores siguen validando. Los suma
   * `taskctl registrar-coste`.
   */
  tokens_diseno: number | null;
  tokens_implementacion: number | null;
  tokens_revision: number | null;
  creado: string;
  actualizado: string;
  dependencias: string[];
}

/**
 * Una tarea junto con la CARPETA de estado en la que se encontro, que
 * puede no coincidir con task.estado si el repo esta en un estado
 * inconsistente (el mismo ID en dos carpetas, o un frontmatter que
 * declara un estado distinto al de su ubicacion). Lo devuelve
 * listTareasEnEstados y lo consume el limite de WIP: quien selecciona
 * por carpeta tiene que poder describir por carpeta (hallazgo MENOR de
 * revision por pares, TASK-015).
 */
export interface TareaUbicada {
  task: Task;
  estadoCarpeta: TaskState;
}

/** Orden de campos tal y como aparecen en la plantilla (seccion 4). */
export const TASK_FIELD_ORDER: readonly (keyof Task)[] = [
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
export function isValidTaskId(id: string): boolean {
  return TASK_ID_RE.test(id);
}

export class InvalidTaskIdError extends Error {
  constructor(public readonly id: string) {
    super(`"${id}" no es un ID de tarea valido (se espera el formato TASK-NNN).`);
    this.name = 'InvalidTaskIdError';
  }
}

/** Lanza InvalidTaskIdError si `id` no tiene el formato TASK-NNN.
 *  Debe llamarse ANTES de usar el id en cualquier ruta de archivo. */
export function assertValidTaskId(id: string): void {
  if (!isValidTaskId(id)) {
    throw new InvalidTaskIdError(id);
  }
}

export class TaskValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super(message);
    this.name = 'TaskValidationError';
  }
}

function fail(field: string, message: string): never {
  throw new TaskValidationError(field, message);
}

function requireString(data: Record<string, unknown>, field: string): string {
  const v = data[field];
  if (typeof v !== 'string' || v.trim() === '') {
    fail(field, `El campo "${field}" es obligatorio y debe ser una cadena no vacia.`);
  }
  return v as string;
}

function requireNullableString(data: Record<string, unknown>, field: string): string | null {
  const v = data[field];
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') {
    fail(field, `El campo "${field}" debe ser una cadena o null.`);
  }
  return v as string;
}

/**
 * Entero >= 0 o null (ausente = null). Rechaza cadenas, flotantes y
 * negativos: un coste de «12k» o de -5 es un dato mal escrito, no un cero.
 */
export function requireNullableNumber(data: Record<string, unknown>, field: string): number | null {
  const v = data[field];
  if (v === null || v === undefined) return null;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    fail(field, `El campo "${field}" debe ser un numero entero >= 0 o null.`);
  }
  return v as number;
}

function requireNumber(data: Record<string, unknown>, field: string): number {
  const v = data[field];
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    fail(field, `El campo "${field}" debe ser un numero entero.`);
  }
  return v as number;
}

function requireBoolean(data: Record<string, unknown>, field: string): boolean {
  const v = data[field];
  if (typeof v !== 'boolean') {
    fail(field, `El campo "${field}" debe ser true o false.`);
  }
  return v as boolean;
}

function requireStringArray(data: Record<string, unknown>, field: string): string[] {
  const v = data[field];
  if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) {
    fail(field, `El campo "${field}" debe ser una lista de cadenas (p. ej. [a, b]).`);
  }
  return v as string[];
}

function requireEnum<T extends string>(
  data: Record<string, unknown>,
  field: string,
  allowed: readonly T[]
): T {
  const v = requireString(data, field);
  if (!(allowed as readonly string[]).includes(v)) {
    fail(
      field,
      `El campo "${field}" tiene el valor "${v}", pero debe ser uno de: ${allowed.join(', ')}.`
    );
  }
  return v as T;
}

function requireNullableEnum<T extends string>(
  data: Record<string, unknown>,
  field: string,
  allowed: readonly T[]
): T | null {
  const v = data[field];
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
    fail(
      field,
      `El campo "${field}" debe ser null o uno de: ${allowed.join(', ')}.`
    );
  }
  return v as T;
}

/**
 * Valida y convierte un objeto generico (tal como lo devuelve
 * parseFrontmatter) en un Task tipado. Lanza TaskValidationError con
 * el primer campo invalido que encuentra.
 */
export function validateTask(data: Record<string, unknown>): Task {
  const id = requireString(data, 'id');
  if (!TASK_ID_RE.test(id)) {
    fail('id', `El campo "id" ("${id}") debe tener el formato TASK-NNN (al menos 3 digitos).`);
  }

  const task: Task = {
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
    regla_seleccion_skill: requireNullableEnum(
      data,
      'regla_seleccion_skill',
      REGLAS_SELECCION_SKILL
    ),
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
