/**
 * TASK-110: el UNICO sitio donde los tests dejan un progreso sin ejecutar un
 * comando. Solo lo usan los tests de formato y de `estado` (plan de testing:
 * si cada test de comando escribiera el JSON a mano, quien escribe y quien lee
 * podrian separarse con la suite en verde). Y ni siquiera aqui se escribe el
 * JSON a mano: va por el escritor real con un reloj fijo.
 */
import { crearProgreso } from '../../src/fs/progreso.js';
import type { FaseProgreso, ResultadoFase } from '../../src/core/progreso.js';

export interface ProgresoDePrueba {
  tarea?: string;
  fase?: FaseProgreso;
  pasos?: readonly string[];
  paso?: string;
  ronda?: number;
  /** Cuanto hace que empezo la fase (ms). */
  haceMs?: number;
  /** Prepara el contador del paso y devuelve su ruta. */
  contador?: boolean;
  terminado?: ResultadoFase;
  ahoraMs?: number;
}

/** Deja el progreso en el repo de `cwd` y devuelve la ruta del contador si se pidio. */
export function dejarProgreso(cwd: string, p: ProgresoDePrueba = {}): string | null {
  const ahora = p.ahoraMs ?? Date.now();
  let t = ahora - (p.haceMs ?? 0);
  const progreso = crearProgreso(cwd, { reloj: () => t });
  progreso.fase(
    p.tarea ?? 'TASK-110',
    p.fase ?? 'finish',
    p.pasos ?? ['puertas', 'verificacion', 'cobertura', 'held-out', 'merge', 'artefactos'],
    p.ronda === undefined ? {} : { ronda: p.ronda }
  );
  t = ahora;
  if (p.paso !== undefined) progreso.paso(p.paso);
  const ruta = p.contador === true ? progreso.contador() : null;
  if (p.terminado !== undefined) progreso.terminar(p.terminado);
  return ruta;
}
