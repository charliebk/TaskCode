/**
 * La verificacion ligera de MENORES (TASK-099, P-2 de la auditoria del
 * 2026-11-12). Modulo puro: recibe texto y listas, no toca disco ni Git.
 *
 * Tras una ronda aprobada (`aprobada` o `aprobada con correcciones`) solo
 * pueden quedar MENORES. Corregirlos no abre otra ronda: `taskctl
 * verificar-menores` comprueba que lo cambiado despues del `Commit revisado`
 * se limita a los ficheros de esos MENORES (o a tests), lo deja registrado en
 * `tarea.md` y pasa los que no se corrigieron a un backlog de la tarea. Un
 * CRITICO o IMPORTANTE abierto sigue exigiendo cambios-solicitados y otra
 * ronda: aqui no se rebaja nada.
 *
 * Medido antes de hacerlo (docs de la auditoria, paso 7): 71 rondas abiertas
 * solo por MENORES encontraron 2 CRITICO/IMPORTANTE nuevos en 70,2 M tokens.
 */
import { hallazgosNoCerrados, severidadDe, type Hallazgo } from './informe-revision.js';

/** Seccion de `tarea.md` donde `verificar-menores` deja cada verificacion. */
export const SECCION_VERIFICACION_LIGERA = '## Verificacion ligera';

/** Seccion de `tarea.md` que deja `finish --aceptar-sin-revisar`. */
export const SECCION_CODIGO_SIN_REVISAR = '## Codigo integrado sin revisar';

/** Nombre del backlog de MENORES dentro de `revision/`. */
export const MENORES_PENDIENTES = 'menores-pendientes.md';

/** Lo que bloquea: CRITICO, IMPORTANTE o una severidad que no se reconoce (fail-closed). */
export function bloqueantesAbiertos(informes: readonly string[]): Hallazgo[] {
  return abiertos(informes).filter((h) => severidadDe(h.severidad) !== 'MENOR');
}

/** MENORES no cerrados (Estado distinto de `corregido` y `aceptado`). */
export function menoresAbiertos(informes: readonly string[]): Hallazgo[] {
  return abiertos(informes).filter((h) => severidadDe(h.severidad) === 'MENOR');
}

function abiertos(informes: readonly string[]): Hallazgo[] {
  return informes.flatMap((t) => hallazgosNoCerrados(t).abiertos);
}

/**
 * Rutas que cita una celda `Fichero`: `src/a.ts:42`, `` `src/a.ts` L10-20 ``,
 * `src/a.ts, test/a.test.ts`, `./src/a.ts#L3`, `src/a.ts:L42`, `a.ts(12)`. Se
 * queda con los trozos que parecen una ruta (tienen `/` o `.`), sin numero de
 * linea ni ancla. Una ruta con espacios no se reconoce: falla cerrado (el
 * comando aborta y lo decide una persona).
 */
export function rutasDeCelda(celda: string): string[] {
  return celda
    .replace(/[`*]/g, '')
    .split(/[\s,;]+/)
    .map((t) =>
      t
        .replace(/#L?\d.*$/i, '')
        .replace(/\(\d+(?:[-:,]\d+)*\)$/, '')
        .replace(/:L?\d+(?:[-:]L?\d+)*$/i, '')
        .replace(/^\.\//, '')
        .replace(/\\/g, '/')
    )
    .map((t) => t.replace(/[().]+$/, '').replace(/^\(+/, ''))
    .filter((t) => t !== '' && /[/.]/.test(t) && !/^L?\d/.test(t));
}

/**
 * ¿La ruta del diff (relativa a la raiz del repo) es la que cita el hallazgo?
 * El revisor suele escribirla relativa al paquete (`src/a.ts`) y Git la da
 * desde la raiz (`plugins/x/src/a.ts`): vale la igualdad o el sufijo tras `/`.
 */
export function mismaRuta(rutaDiff: string, citada: string): boolean {
  // MEN-1 de la revision: un nombre sin carpeta (`index.ts`) solo vale tal
  // cual; por sufijo dejaria pasar cualquier `.../index.ts` del repo.
  return rutaDiff === citada || (citada.includes('/') && rutaDiff.endsWith(`/${citada}`));
}

/** Heuristica de fichero de test por ruta: `test/`, `tests/`, `__tests__/`, `.test.`, `.spec.`. */
export function esRutaDeTest(ruta: string): boolean {
  return /(^|\/)(test|tests|__tests__)\//.test(ruta) || /\.(test|spec)\./.test(ruta);
}

/** Ficheros cambiados que no son de ningun MENOR abierto ni tests: lo que nadie reviso. */
export function fueraDeAlcance(cambiados: readonly string[], menores: readonly Hallazgo[]): string[] {
  const citadas = menores.flatMap((h) => rutasDeCelda(h.fichero));
  return cambiados.filter((f) => !esRutaDeTest(f) && !citadas.some((c) => mismaRuta(f, c)));
}

/** Reparto: corregido = algun fichero que cita cambio; pendiente = ninguno cambio (o no cita ninguno). */
export function repartirMenores(
  menores: readonly Hallazgo[],
  cambiados: readonly string[]
): { corregidos: Hallazgo[]; pendientes: Hallazgo[] } {
  const corregidos: Hallazgo[] = [];
  const pendientes: Hallazgo[] = [];
  for (const h of menores) {
    const tocado = rutasDeCelda(h.fichero).some((c) => cambiados.some((f) => mismaRuta(f, c)));
    (tocado ? corregidos : pendientes).push(h);
  }
  return { corregidos, pendientes };
}

export interface EntradaVerificacionLigera {
  instante: string;
  ronda: number;
  commitRevisado: string;
  commitVerificado: string;
  ficheros: readonly string[];
  corregidos: readonly string[];
  pendientes: readonly string[];
}

const lista = (xs: readonly string[]): string => (xs.length === 0 ? 'ninguno' : xs.join(', '));

/** Linea de la seccion `## Verificacion ligera`. `leerVerificacionesLigeras` la vuelve a leer. */
export function lineaVerificacionLigera(e: EntradaVerificacionLigera): string {
  return (
    `- ${e.instante}: ronda ${String(e.ronda)}; commit revisado ${e.commitRevisado}; ` +
    `commit verificado ${e.commitVerificado}; ficheros: ${lista(e.ficheros)}; ` +
    `corregidos: ${lista(e.corregidos)}; pendientes: ${lista(e.pendientes)}`
  );
}

export interface VerificacionLigeraLeida {
  ronda: number;
  commitRevisado: string;
  commitVerificado: string;
}

/** Las entradas de la seccion `## Verificacion ligera` de un `tarea.md`, en orden. */
export function leerVerificacionesLigeras(body: string): VerificacionLigeraLeida[] {
  const lineas = body.replace(/\r/g, '').split('\n');
  const inicio = lineas.findIndex((l) => l.trim() === SECCION_VERIFICACION_LIGERA);
  if (inicio === -1) return [];
  const leidas: VerificacionLigeraLeida[] = [];
  for (let i = inicio + 1; i < lineas.length; i++) {
    const l = lineas[i] as string;
    if (/^##\s/.test(l)) break;
    const m = /ronda (\d+); commit revisado ([0-9a-f]{7,40}); commit verificado ([0-9a-f]{7,40})\b/.exec(l);
    if (m !== null) {
      leidas.push({ ronda: Number(m[1]), commitRevisado: m[2] as string, commitVerificado: m[3] as string });
    }
  }
  return leidas;
}

/**
 * La ultima verificacion ligera de esa ronda y ese commit revisado, o null.
 * Los SHA se comparan por prefijo: la peticion puede llevar el corto.
 */
export function verificacionDeRonda(
  body: string,
  ronda: number,
  commitRevisado: string
): VerificacionLigeraLeida | null {
  const mismoSha = (a: string, b: string): boolean => a.startsWith(b) || b.startsWith(a);
  const deRonda = leerVerificacionesLigeras(body).filter(
    (v) => v.ronda === ronda && mismoSha(v.commitRevisado, commitRevisado)
  );
  return deRonda.at(-1) ?? null;
}

const celda = (s: string): string => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();

/** Contenido de `revision/menores-pendientes.md`: backlog que ni abre ronda ni bloquea finish. */
export function backlogMenores(
  id: string,
  ronda: number,
  pendientes: readonly Hallazgo[],
  motivo: string
): string {
  const filas = pendientes.map((h) => `| ${celda(h.id)} | ${celda(h.fichero) || '—'} | ${celda(motivo)} |`);
  return (
    `# MENORES pendientes — ${id}\n\n` +
    `MENORES abiertos de la ronda ${String(ronda)} que no se corrigieron en la verificacion ligera ` +
    '(`taskctl verificar-menores`). Son backlog de la tarea: no abren otra ronda ni impiden `finish`.\n\n' +
    '| ID | Fichero | Motivo |\n|---|---|---|\n' +
    filas.join('\n') +
    '\n'
  );
}
