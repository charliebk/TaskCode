/**
 * `taskctl roadmap [--comparar | --escribir]` (TASK-098).
 *
 * - Sin flags: genera el ROADMAP en seco y lo saca por stdout. No escribe.
 * - `--comparar`: genera en seco y lista lo que difiere del
 *   `tareas/ROADMAP.md` actual (tareas, hitos, dependencias, estado y zona
 *   manual). No escribe nada. Es la comprobacion previa a migrar un
 *   proyecto que ya tiene su propio ROADMAP.
 * - `--escribir`: la salida explicita. Escribe aunque el fichero no exista
 *   o tenga historia en git; sobre un ROADMAP sin la marca de taskctl solo
 *   lo sustituye si `--comparar` saldria limpio. Nunca toca uno declarado
 *   en `rutas_sincronizacion` ni uno con cambios sin commitear. No
 *   commitea: el fichero queda en el arbol para que la persona lo revise.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { resolverConfigConAvisos } from '../core/config.js';
import { compararRoadmaps } from '../core/roadmap-comparar.js';
import { llevaMarcaTaskctl, ROADMAP_RUTA } from '../core/roadmap.js';
import { generarDesdeDisco, prepararRoadmap, roadmapEnSincronizacion, type ResultadoRoadmap } from '../fs/roadmap.js';

export class RoadmapCommandError extends Error {}

const FLAGS_ROADMAP = ['--comparar', '--escribir'] as const;

export interface RoadmapCommandResult {
  modo: 'mostrar' | 'comparar' | 'escribir';
  /** Lo que se saca por stdout. */
  salida: string;
  avisos: string[];
  /** Codigo de salida: 0 bien; 1 si --comparar encontro diferencias o --escribir no escribio. */
  codigo: 0 | 1;
  /** Solo con --escribir. */
  resultado: ResultadoRoadmap | null;
}

export function runRoadmapCommand(repoCwd: string, argv: readonly string[]): RoadmapCommandResult {
  rechazarFlagsDesconocidos(argv, FLAGS_ROADMAP, 'roadmap', (m) => new RoadmapCommandError(m));
  const posicional = argv.find((a) => !a.startsWith('-'));
  if (posicional !== undefined) {
    throw new RoadmapCommandError(`[ERROR] taskctl roadmap no admite argumentos sueltos ("${posicional}").`);
  }
  const comparar = argv.includes('--comparar');
  const escribir = argv.includes('--escribir');
  if (comparar && escribir) {
    throw new RoadmapCommandError(
      '[ERROR] taskctl roadmap: --comparar y --escribir no van juntos. Compara primero y escribe despues.'
    );
  }

  const ruta = path.join(repoCwd, 'tareas', 'ROADMAP.md');

  if (escribir) {
    const r = prepararRoadmap(repoCwd, 'escribir');
    const lineas: string[] = [];
    if (r.estado === 'escrito') {
      lineas.push(`Regenerado ${ROADMAP_RUTA} (sin commitear: revisalo y commitealo).`);
    } else if (r.estado === 'sin-cambios') {
      lineas.push(`${ROADMAP_RUTA} ya esta al dia: no se ha tocado.`);
    } else {
      lineas.push(`No se ha escrito ${ROADMAP_RUTA}: ${r.motivo ?? 'motivo desconocido'}`);
      if (r.diferencias.length > 0) {
        lineas.push('', 'Diferencias con el que se generaria:', ...r.diferencias.map((d) => `  - ${d}`));
      }
    }
    return {
      modo: 'escribir',
      salida: `${lineas.join('\n')}\n`,
      // El motivo de un omitido ya va en la salida; no se repite como aviso.
      avisos: r.estado === 'omitido' ? r.avisos.filter((a) => a !== r.motivo) : r.avisos,
      codigo: r.estado === 'escrito' || r.estado === 'sin-cambios' ? 0 : 1,
      resultado: r,
    };
  }

  const actual = existsSync(ruta) ? readFileSync(ruta, 'utf8') : null;
  let generado: { texto: string; avisos: string[] };
  try {
    generado = generarDesdeDisco(repoCwd, actual);
  } catch (e: unknown) {
    throw new RoadmapCommandError(
      `[ERROR] taskctl roadmap: no se puede generar el ROADMAP: ${e instanceof Error ? e.message : String(e)}.`
    );
  }

  if (!comparar) {
    return { modo: 'mostrar', salida: generado.texto, avisos: generado.avisos, codigo: 0, resultado: null };
  }

  const lineas: string[] = [];
  if (actual === null) {
    lineas.push(
      `${ROADMAP_RUTA} no existe: no hay nada que comparar. "taskctl roadmap" muestra el que se generaria.`
    );
    return { modo: 'comparar', salida: `${lineas.join('\n')}\n`, avisos: generado.avisos, codigo: 0, resultado: null };
  }

  const { config } = resolverConfigConAvisos(repoCwd);
  if (roadmapEnSincronizacion(config)) {
    lineas.push(`${ROADMAP_RUTA} esta declarado en rutas_sincronizacion: las transiciones no lo tocan.`);
  } else if (llevaMarcaTaskctl(actual)) {
    lineas.push(`${ROADMAP_RUTA} lleva la marca de taskctl: las transiciones lo regeneran.`);
  } else {
    lineas.push(`${ROADMAP_RUTA} no lleva la marca de taskctl: las transiciones no lo tocan.`);
  }
  const diferencias = compararRoadmaps(actual, generado.texto);
  if (diferencias.length === 0) {
    lineas.push('Sin diferencias en tareas, hitos, dependencias, estado ni zona manual.');
  } else {
    lineas.push(`${diferencias.length} diferencia(s) con el que generaria taskctl:`, ...diferencias.map((d) => `  - ${d}`));
  }
  return {
    modo: 'comparar',
    salida: `${lineas.join('\n')}\n`,
    avisos: generado.avisos,
    codigo: diferencias.length === 0 ? 0 : 1,
    resultado: null,
  };
}
