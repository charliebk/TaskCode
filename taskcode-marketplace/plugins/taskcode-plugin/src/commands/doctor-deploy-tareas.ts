/**
 * `taskctl doctor-deploy --crear-tareas` (TASK-067): una tarea por cada punto
 * que FALLA, con ID del rango reservado (TASK-9999, 9998...) para no chocar con
 * la numeracion normal.
 *
 * Reutiliza las piezas de `new` (`crearTareaEn`, el guard de rama base y el
 * auto-commit), con UN solo `ensureBaseBranchReady` y UN solo `autoCommit` para
 * todas las tareas del pase: un corte a medias deja tareas escritas sin
 * commitear, y repetir el comando las reutiliza (la deduplicacion es por la
 * etiqueta `doctor-deploy:<id-punto>`), asi que relanzar repara.
 *
 * Efecto colateral aceptado, como en `new`: si la rama actual no es la base de
 * las tareas (develop), el guard cambia a ella cuando el arbol esta limpio. Se
 * dice en la salida.
 */
import path from 'node:path';
import type { InformeDeploy } from '../core/doctor-deploy.js';
import {
  componerTarea,
  detectarHuerfanas,
  puntoDeEtiquetas,
  type ResumenTareas,
  type TareaReferida,
} from '../core/doctor-deploy-tareas.js';
import { resolverConfig } from '../core/config.js';
import { nextReservedTaskId } from '../core/task-id.js';
import type { Task } from '../core/task.js';
import { autoCommit, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
import { ensureBaseBranchReady, localBranches, type BaseBranchGuardResult } from '../fs/git.js';
import { listExistingTaskIds, listTareasEnEstados, TaskAlreadyExistsError } from '../fs/task-store.js';
import { componerCuerpo, crearTareaEn } from './new.js';

export class DoctorDeployTareasError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DoctorDeployTareasError';
  }
}

export interface ResultadoCrearTareas {
  resumen: ResumenTareas;
  /** null si no hizo falta crear nada (no se toco la rama ni se commiteo). */
  baseBranchGuard: BaseBranchGuardResult | null;
  autoCommit: AutoCommitResult | null;
}

/** Tareas aun abiertas (no terminadas): las que cuentan para deduplicar. */
async function leerAbiertas(tareasRoot: string): Promise<Task[]> {
  const { tareas } = await listTareasEnEstados(tareasRoot, ['planificada', 'en-diseno', 'en-curso', 'en-revision']);
  return tareas
    .map((t) => t.task)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function porPunto(abiertas: readonly Task[]): Map<string, Task> {
  const m = new Map<string, Task>();
  for (const t of abiertas) {
    const punto = puntoDeEtiquetas(t.etiquetas);
    if (punto !== null && !m.has(punto)) m.set(punto, t);
  }
  return m;
}

export async function crearTareasDeFallas(informe: InformeDeploy, raiz: string, hoy: string): Promise<ResultadoCrearTareas> {
  const tareasRoot = path.join(raiz, 'tareas');
  // El config se resuelve ANTES de tocar nada (como `new`): uno roto aborta sin efectos.
  const config = resolverConfig(raiz);
  const fallas = informe.puntos.filter((p) => p.estado === 'falla');

  let abiertas = await leerAbiertas(tareasRoot);
  let existentes = porPunto(abiertas);
  let pendientes = fallas.filter((p) => !existentes.has(p.id));

  let baseBranchGuard: BaseBranchGuardResult | null = null;
  let resultadoCommit: AutoCommitResult | null = null;
  const creadas: TareaReferida[] = [];

  if (pendientes.length > 0) {
    // Un solo guard para todas. Aborta con el arbol sucio y puede cambiar a la rama base.
    baseBranchGuard = ensureBaseBranchReady('fix', raiz);
    if (baseBranchGuard.switched) {
      // En la rama base puede haber tareas distintas: se vuelve a mirar.
      abiertas = await leerAbiertas(tareasRoot);
      existentes = porPunto(abiertas);
      pendientes = fallas.filter((p) => !existentes.has(p.id));
    }
    const ids = await listExistingTaskIds(tareasRoot);
    const ramas = localBranches(raiz);
    const carpetas: string[] = [];
    for (const p of pendientes) {
      const id = nextReservedTaskId(ids, ramas);
      const t = componerTarea(p);
      try {
        const { filePath } = await crearTareaEn(
          tareasRoot,
          id,
          {
            titulo: t.titulo,
            tipo: 'fix',
            sprint: 0,
            etiquetas: t.etiquetas,
            complejidad: null,
            modeloSugerido: 'sonnet',
            agenteRevisor: config.agente_revisor_por_defecto,
          },
          componerCuerpo(t.objetivo, t.criterios),
          hoy
        );
        carpetas.push(path.dirname(filePath));
      } catch (e: unknown) {
        if (e instanceof TaskAlreadyExistsError) {
          throw new DoctorDeployTareasError(
            `[ERROR] taskctl doctor-deploy: ${id} ya existe (otra ejecucion de taskctl lo ha creado a la vez). ` +
              'Repite el comando: las tareas ya creadas se reutilizan.'
          );
        }
        throw e;
      }
      ids.push(id);
      creadas.push({ id, punto: p.id });
    }
    resultadoCommit = autoCommit({
      cwd: raiz,
      rutas: carpetas,
      mensaje: mensajeChore('taskctl', `doctor-deploy: ${creadas.length} tarea(s) creadas: ${creadas.map((c) => c.id).join(', ')}`),
      push: false,
    });
    // Las recien creadas ya cuentan como abiertas para los avisos.
    abiertas = await leerAbiertas(tareasRoot);
    existentes = porPunto(abiertas);
  }

  const reutilizadas: TareaReferida[] = fallas
    .filter((p) => !creadas.some((c) => c.punto === p.id))
    .map((p) => ({ id: (existentes.get(p.id) as Task).id, punto: p.id }));

  return {
    resumen: { creadas, reutilizadas, huerfanas: detectarHuerfanas(abiertas, informe.puntos) },
    baseBranchGuard,
    autoCommit: resultadoCommit,
  };
}
