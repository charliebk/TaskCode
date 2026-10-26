/** TASK-065: una tarea terminada valida para los tests puros de metricas. */
import type { Task } from '../../src/core/task.js';

export function tarea(o: Partial<Task> = {}): Task {
  return {
    id: 'TASK-007',
    titulo: 'Medir',
    tipo: 'fix',
    sprint: 1,
    etiquetas: [],
    complejidad: 'simple',
    modelo_sugerido: 'sonnet',
    estado: 'terminada',
    plan_aprobado: true,
    rama: 'fix/x',
    asignado_a: null,
    agente_revisor: 'general-purpose',
    skills_recomendados: [],
    regla_seleccion_skill: null,
    ultimo_commit_revisado: null,
    revision_codex: false,
    tokens_diseno: null,
    tokens_implementacion: null,
    tokens_revision: null,
    creado: '2026-10-01',
    actualizado: '2026-10-05',
    dependencias: [],
    ...o,
  } as Task;
}

