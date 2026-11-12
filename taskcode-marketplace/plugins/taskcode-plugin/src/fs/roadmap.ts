/**
 * ROADMAP de tareas en disco (TASK-098): el UNICO sitio que decide si
 * `tareas/ROADMAP.md` se escribe.
 *
 * Regla numero uno: taskctl no pisa un ROADMAP ajeno. Las transiciones
 * solo escriben el fichero si:
 *   - lleva la marca de taskctl en su linea fija, o
 *   - no existe y nunca ha existido (`git log --all` no sabe nada de el).
 * Y nunca si:
 *   - esta declarado en `rutas_sincronizacion` (lo regenera el proyecto);
 *   - tiene cambios sin commitear (se avisa: pisarlos seria perderlos);
 *   - en disco se llama distinto (p. ej. `Roadmap.md`): en Windows y macOS
 *     escribir `ROADMAP.md` lo sobrescribiria.
 *
 * Generacion tolerante: una tarea.md ilegible, una zona manual rota o
 * cualquier fallo dejan el fichero como estaba y solo avisan. Para cuando
 * se llega aqui la transicion ya esta hecha (en `finish`, el merge
 * tambien), y un ROADMAP no puede tumbarla. Los ciclos y las dependencias
 * a tareas inexistentes no son fallos: se informan y se escribe.
 *
 * E/S sincrona a proposito: se llama desde `autoCommit`, que es sincrono.
 */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
import { compararRoadmaps } from '../core/roadmap-comparar.js';
import {
  extraerZonaManual,
  generarRoadmap,
  llevaMarcaTaskctl,
  ROADMAP_RUTA,
  type TareaRoadmap,
} from '../core/roadmap.js';
import { STATE_FOLDER, TASK_STATES } from '../core/task.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { runGit } from './git.js';

const NOMBRE = 'ROADMAP.md';
const TASK_DIR_RE = /^TASK-\d{3,}[a-z]?$/;

/** Para que se prepara: una transicion (reglas estrictas) o `taskctl roadmap --escribir` (explicito). */
export type ModoRoadmap = 'transicion' | 'escribir';

export interface ResultadoRoadmap {
  /**
   * - escrito: el fichero cambio en disco (ruta y anterior rellenos);
   * - sin-cambios: se genero y coincide byte a byte con el actual;
   * - omitido: las reglas dicen que no se toca (motivo en `motivo`);
   * - fallido: algo fallo al generar; el fichero queda como estaba.
   */
  estado: 'escrito' | 'sin-cambios' | 'omitido' | 'fallido';
  /** Ruta absoluta del ROADMAP (aunque no se haya escrito). */
  ruta: string;
  /** Contenido previo, o null si no existia. Para restaurarlo si su `git add` falla. */
  anterior: string | null;
  motivo: string | null;
  avisos: string[];
  /** Diferencias que impidieron migrar un ROADMAP ajeno con `--escribir`. */
  diferencias: string[];
}

export interface TareasLeidas {
  tareas: TareaRoadmap[];
  ilegibles: string[];
}

/** Lee el frontmatter de todas las tareas de las carpetas de estado. */
export function leerTareasRoadmap(raiz: string): TareasLeidas {
  const tareasRoot = path.join(raiz, 'tareas');
  const tareas: TareaRoadmap[] = [];
  const ilegibles: string[] = [];
  const vistos = new Set<string>();
  for (const estado of TASK_STATES) {
    const dir = path.join(tareasRoot, STATE_FOLDER[estado]);
    let entradas: string[];
    try {
      entradas = readdirSync(dir).sort();
    } catch {
      continue;
    }
    for (const entrada of entradas) {
      if (!TASK_DIR_RE.test(entrada) || vistos.has(entrada)) continue;
      const fichero = path.join(dir, entrada, 'tarea.md');
      if (!existsSync(fichero)) continue;
      try {
        const { task } = parseTareaFile(readFileSync(fichero, 'utf8'));
        vistos.add(entrada);
        tareas.push({
          id: task.id,
          titulo: task.titulo,
          sprint: task.sprint,
          complejidad: task.complejidad,
          estado: task.estado,
          dependencias: task.dependencias,
        });
      } catch {
        ilegibles.push(path.relative(raiz, fichero).split(path.sep).join('/'));
      }
    }
  }
  return { tareas, ilegibles };
}

/** true si `tareas/ROADMAP.md` esta declarado en `rutas_sincronizacion` (sin distinguir mayusculas). */
export function roadmapEnSincronizacion(config: TaskcodeConfig): boolean {
  return config.rutas_sincronizacion.some(
    (r) => r.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase() === ROADMAP_RUTA.toLowerCase()
  );
}

/** Nombre real en disco del fichero que casa con ROADMAP.md sin distinguir mayusculas, o null. */
function nombreEnDisco(raiz: string): string | null {
  try {
    return readdirSync(path.join(raiz, 'tareas')).find((e) => e.toLowerCase() === NOMBRE.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

function tieneCambiosSinCommitear(raiz: string): boolean {
  return runGit(['status', '--porcelain', '--untracked-files=all', '--', ROADMAP_RUTA], raiz) !== '';
}

function tieneHistoria(raiz: string): boolean {
  return runGit(['log', '--all', '-1', '--format=%H', '--', ROADMAP_RUTA], raiz) !== '';
}

function detalle(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Genera en memoria el ROADMAP que escribiria taskctl a partir del
 * actual (del que solo toma la zona manual). Lanza si algo impide
 * generarlo: tareas ilegibles o zona manual rota.
 */
export function generarDesdeDisco(raiz: string, actual: string | null): { texto: string; avisos: string[] } {
  const { tareas, ilegibles } = leerTareasRoadmap(raiz);
  if (ilegibles.length > 0) {
    throw new Error(`hay tareas que no se pueden leer (${ilegibles.join(', ')})`);
  }
  const zona = actual === null ? null : extraerZonaManual(actual);
  const g = generarRoadmap(tareas, zona);
  const texto = actual !== null && actual.includes('\r\n') ? g.texto.replace(/\n/g, '\r\n') : g.texto;
  return { texto, avisos: g.avisos };
}

/**
 * Decide, genera y (si toca) escribe `tareas/ROADMAP.md`. Nunca lanza:
 * todo lo que va mal se devuelve como 'fallido' u 'omitido' con su aviso.
 */
export function prepararRoadmap(raiz: string, modo: ModoRoadmap): ResultadoRoadmap {
  const ruta = path.join(raiz, 'tareas', NOMBRE);
  const r = (estado: ResultadoRoadmap['estado'], motivo: string | null, extra: Partial<ResultadoRoadmap> = {}): ResultadoRoadmap => ({
    estado,
    ruta,
    anterior: null,
    motivo,
    avisos: [],
    diferencias: [],
    ...extra,
  });
  const avisoFallo = (m: string): string =>
    `${ROADMAP_RUTA} no se ha regenerado: ${m}. Se queda como estaba; ` +
    'corrigelo y regeneralo con "taskctl roadmap --escribir".';

  try {
    const { config } = resolverConfigConAvisos(raiz);
    if (roadmapEnSincronizacion(config)) {
      return r('omitido', `${ROADMAP_RUTA} esta declarado en rutas_sincronizacion: lo regenera el comando del proyecto.`);
    }

    const real = nombreEnDisco(raiz);
    if (real !== null && real !== NOMBRE) {
      const m = `en tareas/ hay "${real}", no "${NOMBRE}": taskctl no lo toca.`;
      return r('omitido', m, { avisos: [m] });
    }

    if (tieneCambiosSinCommitear(raiz)) {
      const m =
        `${ROADMAP_RUTA} tiene cambios sin commitear: no se regenera para no pisarlos. ` +
        'Commitealos o descartalos y vuelve a generarlo con "taskctl roadmap --escribir".';
      return r('omitido', m, { avisos: [m] });
    }

    const actual = real === null ? null : readFileSync(ruta, 'utf8');
    let diferencias: string[] = [];

    if (actual === null) {
      if (modo === 'transicion' && tieneHistoria(raiz)) {
        const m =
          `${ROADMAP_RUTA} no existe pero tiene historia en git: taskctl no lo recrea por su cuenta. ` +
          'Si quieres que lo genere, usa "taskctl roadmap --escribir".';
        return r('omitido', m, { avisos: [m] });
      }
    } else if (!llevaMarcaTaskctl(actual)) {
      if (modo === 'transicion') {
        return r('omitido', `${ROADMAP_RUTA} no lleva la marca de taskctl: es del proyecto y no se toca.`);
      }
      // Migracion explicita: solo si no se pierde nada de lo que el
      // ROADMAP actual dice (la misma comprobacion que `--comparar`).
      let generado: string;
      try {
        generado = generarDesdeDisco(raiz, actual).texto;
      } catch (e: unknown) {
        const m = avisoFallo(detalle(e));
        return r('fallido', m, { avisos: [m] });
      }
      diferencias = compararRoadmaps(actual, generado);
      if (diferencias.length > 0) {
        return r(
          'omitido',
          `${ROADMAP_RUTA} no lleva la marca de taskctl y difiere del que se generaria: no se sustituye.`,
          { diferencias }
        );
      }
    }

    let generado: { texto: string; avisos: string[] };
    try {
      generado = generarDesdeDisco(raiz, actual);
    } catch (e: unknown) {
      const m = avisoFallo(detalle(e));
      return r('fallido', m, { avisos: [m] });
    }
    const avisos = generado.avisos.map((a) => `${ROADMAP_RUTA}: ${a}`);
    if (actual === generado.texto) return r('sin-cambios', null, { anterior: actual, avisos });

    writeFileSync(ruta, generado.texto, 'utf8');
    return r('escrito', null, { anterior: actual, avisos, diferencias });
  } catch (e: unknown) {
    const m = avisoFallo(detalle(e));
    return r('fallido', m, { avisos: [m] });
  }
}

/** Deja el ROADMAP como estaba antes de `prepararRoadmap` (si su `git add` fallo). */
export function restaurarRoadmap(res: ResultadoRoadmap): void {
  if (res.estado !== 'escrito') return;
  if (res.anterior === null) unlinkSync(res.ruta);
  else writeFileSync(res.ruta, res.anterior, 'utf8');
}
