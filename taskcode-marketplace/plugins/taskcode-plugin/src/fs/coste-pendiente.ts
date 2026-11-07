/**
 * Libro de coste pendiente (TASK-085): que transcripciones han trabajado en
 * la rama de una tarea en curso, para que `review` (y, como red, `finish`)
 * sumen su coste de implementacion en el commit que ya hacen.
 *
 * Vive bajo `.git/` (`git rev-parse --git-path`), como el memo del freno de
 * verificacion (`fs/verificacion.ts`): en el workspace ensuciaria el arbol,
 * cambiaria la huella del freno y bloquearia el siguiente comando por
 * workspace sucio. Se pierde con el clon: aceptado en el plan.
 *
 * Solo guarda RUTAS, no cifras: lo que cuenta lo decide el volcado con las
 * ventanas de la tarea (`core/coste-automatico.ts`). Asi el hook que escribe
 * aqui no lee ninguna transcripcion y un disparo repetido no suma nada.
 *
 * Formato: una linea JSON por anotacion, solo se AÑADE. Varios hooks a la
 * vez (dos `SubagentStop`, el `Stop` del hilo principal) escriben cada uno
 * su linea con `appendFile`, sin leer ni reescribir: no hay actualizacion
 * perdida que evitar. Las repetidas se funden al leer. `olvidarPendientes`
 * es lo unico que reescribe (temporal + rename) y corre dentro de un
 * comando, no de un hook.
 */
import { appendFileSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { TipoFuente } from '../core/coste-automatico.js';

export const FICHERO_LIBRO = 'coste-pendiente.jsonl';
const VERSION_LIBRO = 1;

export interface EntradaPendiente {
  tarea: string;
  tipo: TipoFuente;
  /** session_id (sesion) o agent_id (agente). */
  id: string;
  /** Transcripcion: la de la sesion o la del subagente. */
  ruta: string;
}

/** Ruta absoluta del libro, o null fuera de un repo Git. */
export function rutaLibro(raiz: string): string | null {
  const r = spawnSync('git', ['rev-parse', '--git-path', FICHERO_LIBRO], { cwd: raiz, encoding: 'utf8', windowsHide: true });
  if (r.error !== undefined || r.status !== 0) return null;
  const p = (r.stdout ?? '').trim();
  return p === '' ? null : path.resolve(raiz, p);
}

/** Añade las entradas al libro. Lanza si no puede escribir: quien llama decide si eso importa. */
export function anotarPendientes(ruta: string, entradas: readonly EntradaPendiente[]): void {
  if (entradas.length === 0) return;
  mkdirSync(path.dirname(ruta), { recursive: true });
  const texto = entradas.map((e) => JSON.stringify({ v: VERSION_LIBRO, ...e })).join('\n') + '\n';
  appendFileSync(ruta, texto, 'utf8');
}

function esEntrada(v: unknown): v is EntradaPendiente & { v: number } {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    o['v'] === VERSION_LIBRO &&
    typeof o['tarea'] === 'string' &&
    (o['tipo'] === 'agente' || o['tipo'] === 'sesion') &&
    typeof o['id'] === 'string' &&
    o['id'] !== '' &&
    typeof o['ruta'] === 'string' &&
    o['ruta'] !== ''
  );
}

function lineas(ruta: string): string[] {
  try {
    return readFileSync(ruta, 'utf8').split(/\r?\n/);
  } catch {
    return [];
  }
}

function parsear(linea: string): unknown {
  try {
    return JSON.parse(linea);
  } catch {
    return null;
  }
}

/** Las entradas de una tarea, una por (tipo, id): la ultima ruta gana. Un libro ilegible es un libro vacio. */
export function leerPendientes(ruta: string, tarea: string): EntradaPendiente[] {
  const porClave = new Map<string, EntradaPendiente>();
  for (const l of lineas(ruta)) {
    if (l.trim() === '') continue;
    const v = parsear(l);
    if (!esEntrada(v) || v.tarea !== tarea) continue;
    porClave.set(`${v.tipo}:${v.id}`, { tarea: v.tarea, tipo: v.tipo, id: v.id, ruta: v.ruta });
  }
  return [...porClave.values()];
}

/** Quita del libro las entradas de una tarea (las demas se quedan). Nunca lanza. */
export function olvidarPendientes(ruta: string, tarea: string): void {
  try {
    // Se quedan solo las entradas validas de OTRAS tareas: las lineas rotas
    // (un corte a mitad de escritura) se van con la limpieza.
    const restantes = lineas(ruta).filter((l) => {
      const v = parsear(l);
      return esEntrada(v) && v.tarea !== tarea;
    });
    if (restantes.length === 0) {
      unlinkSync(ruta);
      return;
    }
    const temporal = `${ruta}.${String(process.pid)}.tmp`;
    writeFileSync(temporal, restantes.join('\n') + '\n', 'utf8');
    renameSync(temporal, ruta);
  } catch {
    /* un libro que no se pudo limpiar solo vuelve a medir: lo ya anotado no se suma dos veces */
  }
}
