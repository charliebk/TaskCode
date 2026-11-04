/**
 * Deteccion del tipo de aplicacion para `taskctl doctor-deploy` (TASK-066).
 *
 * Los tipos y sus marcadores son DATOS del catalogo (`tipo_N_*` en
 * scripts/doctor-deploy.yml): anadir uno no toca este fichero. Se detectan
 * sobre la lista de ficheros del proyecto que da Git (versionados y sin
 * versionar que no estan ignorados), hasta una profundidad fija, sin mirar
 * dentro de las carpetas de dependencias ni de build.
 */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { AplicacionCatalogo, TipoApp } from '../core/doctor-deploy-catalogo.js';
import type { AplicacionDetectada, MarcadorAplicacion, TipoDetectado } from '../core/doctor-deploy.js';
import { gitTexto } from './git-crudo.js';

/** Carpetas que ni se detectan ni se escanean: dependencias y build. */
export const DIRS_EXCLUIDOS: readonly string[] = ['node_modules', 'vendor', 'target', 'dist', 'build', '.git'];

/** Profundidad maxima (carpetas) a la que se buscan marcadores: `a/b/c/package.json` si; un nivel mas, no. */
export const PROFUNDIDAD_MARCADORES = 3;

export function estaExcluido(ruta: string): boolean {
  return ruta.split('/').some((seg, i, partes) => i < partes.length - 1 && DIRS_EXCLUIDOS.includes(seg));
}

function listaZ(args: readonly string[], cwd: string): string[] | null {
  const t = gitTexto(args, cwd, { maxBuffer: 256 * 1024 * 1024 });
  if (t === null) return null;
  return t.split('\0').filter((r) => r !== '');
}

export interface ArchivosProyecto {
  /** Versionados mas sin versionar que no estan ignorados; sin carpetas excluidas. */
  presentes: string[];
  /** Solo los versionados; sin carpetas excluidas. */
  versionados: string[];
  /** TODOS los versionados (git ls-files completo), tambien los de build, dist, vendor, target y node_modules. */
  versionadosTodos: string[];
  /**
   * Lo que se escanea en busca de claves: todo lo versionado (aunque este en una
   * carpeta de dependencias o build: si esta en el repo, se publica) mas lo sin
   * versionar que no esta ignorado fuera de esas carpetas.
   */
  paraEscanear: string[];
}

/** null si no se pudo listar (no es un repo Git, o git no esta). */
export function listarArchivos(cwd: string): ArchivosProyecto | null {
  const versionados = listaZ(['ls-files', '-z', '--cached'], cwd);
  const otros = listaZ(['ls-files', '-z', '--others', '--exclude-standard'], cwd);
  if (versionados === null || otros === null) return null;
  const sinExcluidos = (xs: string[]): string[] => xs.filter((r) => !estaExcluido(r));
  const v = sinExcluidos(versionados);
  const presentes = [...new Set([...v, ...sinExcluidos(otros)])];
  const paraEscanear = [...new Set([...versionados, ...sinExcluidos(otros)])];
  return { presentes, versionados: v, versionadosTodos: versionados, paraEscanear };
}

function coincideMarcador(ruta: string, marcador: string): boolean {
  const base = ruta.slice(ruta.lastIndexOf('/') + 1);
  if (marcador.includes('/')) return ruta === marcador || ruta.endsWith(`/${marcador}`);
  if (marcador.startsWith('*.')) return base.length > marcador.length - 1 && base.toLowerCase().endsWith(marcador.slice(1).toLowerCase());
  return base === marcador;
}

/** Carpeta (con `/`, `.` si es la raiz) de una ruta. */
export function carpetaDe(ruta: string): string {
  const i = ruta.lastIndexOf('/');
  return i === -1 ? '.' : ruta.slice(0, i);
}

function profundidad(ruta: string): number {
  return ruta.split('/').length - 1;
}

export function detectarTipos(archivos: readonly string[], tipos: readonly TipoApp[]): TipoDetectado[] {
  const candidatos = archivos.filter((r) => profundidad(r) <= PROFUNDIDAD_MARCADORES);
  const detectados: TipoDetectado[] = [];
  for (const t of tipos) {
    const rutas = new Set<string>();
    for (const r of candidatos) {
      if (t.marcadores.some((m) => coincideMarcador(r, m))) rutas.add(carpetaDe(r));
    }
    if (rutas.size > 0) detectados.push({ id: t.id, nombre: t.nombre, rutas: [...rutas].sort() });
  }
  return detectados;
}

// ---------------------------------------------------------------------
// Tipo de aplicacion (TASK-068): el segundo eje
// ---------------------------------------------------------------------

/** Un fichero marcador mayor que esto no se lee para buscar `contiene` (y no cuenta). */
export const MAX_BYTES_MARCADOR_APLICACION = 1024 * 1024;

/** Marcadores que se guardan por tipo de aplicacion detectado (para el informe). */
const MAX_MARCADORES_POR_APLICACION = 5;

/**
 * Detecta los tipos de aplicacion (web, api, cli...) con los mismos marcadores
 * y la misma profundidad que `detectarTipos`. Si el tipo declara `contiene`,
 * el fichero marcador solo cuenta si su contenido incluye alguno de esos
 * textos (sin distinguir mayusculas); solo entonces se lee, y solo los
 * ficheros marcador. Un fichero ilegible o mayor que el tope no cuenta: sin
 * deteccion, los puntos que dependen del tipo de aplicacion siguen aplicando
 * (fallo en abierto).
 *
 * Por que no hace falta mas profundidad para React Native o Flutter: su
 * `AndroidManifest.xml` esta en android/app/src/main/ (4 carpetas), pero se
 * detectan por su manifiesto de raiz (`package.json` con `react-native`,
 * `pubspec.yaml` con `sdk: flutter`), y Android por `android/app/build.gradle`
 * con `com.android.application`.
 */
export function detectarAplicaciones(
  cwd: string,
  archivos: readonly string[],
  aplicaciones: readonly AplicacionCatalogo[]
): AplicacionDetectada[] {
  const candidatos = archivos.filter((r) => profundidad(r) <= PROFUNDIDAD_MARCADORES);
  const contenidos = new Map<string, string | null>();
  const leer = (ruta: string): string | null => {
    if (contenidos.has(ruta)) return contenidos.get(ruta) as string | null;
    let t: string | null = null;
    try {
      const abs = path.join(cwd, ...ruta.split('/'));
      const st = statSync(abs);
      if (st.isFile() && st.size <= MAX_BYTES_MARCADOR_APLICACION) t = readFileSync(abs, 'utf8').toLowerCase();
    } catch {
      t = null;
    }
    contenidos.set(ruta, t);
    return t;
  };

  const detectadas: AplicacionDetectada[] = [];
  for (const a of aplicaciones) {
    const marcadores: MarcadorAplicacion[] = [];
    for (const r of candidatos) {
      if (!a.marcadores.some((m) => coincideMarcador(r, m))) continue;
      if (a.contiene === null) {
        marcadores.push({ fichero: r, contiene: null });
        continue;
      }
      const t = leer(r);
      if (t === null) continue;
      const texto = a.contiene.find((c) => t.includes(c.toLowerCase()));
      if (texto !== undefined) marcadores.push({ fichero: r, contiene: texto });
    }
    if (marcadores.length === 0) continue;
    marcadores.sort((x, y) => (x.fichero < y.fichero ? -1 : x.fichero > y.fichero ? 1 : 0));
    const rutas = [...new Set(marcadores.map((m) => carpetaDe(m.fichero)))].sort();
    detectadas.push({ id: a.id, nombre: a.nombre, rutas, marcadores: marcadores.slice(0, MAX_MARCADORES_POR_APLICACION) });
  }
  return detectadas;
}
