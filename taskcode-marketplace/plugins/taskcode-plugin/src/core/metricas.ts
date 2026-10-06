/**
 * Telemetria de fases (TASK-052): cuanto duro cada fase de una tarea,
 * cuantas rondas de revision necesito y, con `--heuristica`, que nivel le
 * habria dado la heuristica de complejidad vigente.
 *
 * Puro: recibe lo ya leido (la tarea, su cuerpo, los nombres de
 * `revision/`, los eventos de git) y devuelve filas y texto. La E/S vive en
 * `commands/metricas.ts`.
 *
 * DE DONDE SALE CADA MARCA, por orden:
 *  1. `registro`: la tabla `## Transiciones` del propio tarea.md. Desde
 *     TASK-052 cada fila lleva el instante (precision de segundo); las
 *     anteriores solo el dia (precision de dia).
 *  2. `git`: si la tarea no tiene ni una fila, las fechas de autor de los
 *     commits automaticos `chore(TASK-NNN): ...` que deja cada comando.
 *  3. `—`: ni lo uno ni lo otro. Nunca se inventa un 0.
 * El origen es por tarea, no por marca: mezclar dos fuentes en una misma
 * fila daria duraciones entre relojes distintos sin que nadie lo vea.
 *
 * QUE MIDE CADA COLUMNA (calendario, no trabajo):
 *  - diseno: del PRIMER `plan` al primer `start`. El primero y no el
 *    ultimo: un plan repetido es parte del diseno, no lo reinicia.
 *  - curso: del primer `start` al primer `review`.
 *  - revision: del primer `review` al ultimo `finish`.
 * `pausa` no se descuenta: no existe una transicion de «reanudar», asi que
 * no hay con que cerrar el hueco. La salida lo dice.
 *
 * Si alguna de las dos marcas es de dia, la duracion va en dias enteros: con
 * medianoche implicita, restar horas daria numeros que parecen precisos y
 * no lo son (o negativos).
 *
 * COSTE EN TOKENS (TASK-023, `--tokens`): las columnas y los resumenes por
 * sprint y por complejidad declarada salen de `tokens_diseno`,
 * `tokens_implementacion` y `tokens_revision` de la tarea. null es «nadie lo
 * registro» y nunca cuenta como 0: sale como «—», no entra en las medias y una
 * tarea sin ningun dato no entra en el resumen (que dice cuantas quedaron
 * fuera). Una tarea con dato solo en alguna fase si entra, y cada fase se
 * promedia sobre las tareas que la tienen.
 */
import { leerTransiciones, instanteDe, precisionDeFecha, type PrecisionFecha } from './transiciones.js';
import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState } from './task.js';

export type OrigenMetricas = 'registro' | 'git' | '—';

/** Fases que se miden. `pausa` solo se cuenta. */
export type FaseMedida = 'plan' | 'approve' | 'start' | 'review' | 'finish' | 'pausa';

export interface Marca {
  ms: number;
  precision: PrecisionFecha;
}

/** Un commit automatico reconocido: fase y fecha de autor (ms UTC). */
export interface EventoGit {
  id: string;
  fase: FaseMedida;
  ms: number;
}

export interface Duracion {
  /** Milisegundos (precision de segundo) o dias enteros (precision de dia). */
  valor: number;
  precision: PrecisionFecha;
}

export interface HeuristicaFila {
  puntos: number;
  nivel: TaskComplexity;
}

/** Coste en tokens por fase de una tarea; null = sin registrar. */
export interface TokensFila {
  diseno: number | null;
  implementacion: number | null;
  revision: number | null;
}

export interface FilaMetricas {
  id: string;
  sprint: number;
  tokens: TokensFila;
  estado: TaskState;
  complejidad: TaskComplexity | null;
  diseno: Duracion | null;
  curso: Duracion | null;
  revision: Duracion | null;
  /** Numero de la ultima ronda de revision; null sin carpeta `revision/` o sin informes. */
  rondas: number | null;
  /** Dia del cierre (`YYYY-MM-DD`), o null. */
  cierre: string | null;
  pausas: number;
  origen: OrigenMetricas;
  /** Solo con `--heuristica`. */
  heuristica?: HeuristicaFila;
}

export interface EntradaMetricas {
  task: Task;
  body: string;
  /** Ronda de revision ya calculada (`nombresDeUltimaRonda`); 0 = sin informes. */
  ronda: number;
  /** Eventos de git de ESTA tarea (vacio si no se consulto o no hay). */
  eventosGit: readonly EventoGit[];
}

/**
 * Asuntos de los commits automaticos que marcan cada fase (ver
 * `mensajeChore` en cada comando). Si un comando cambia su asunto, esto
 * deja de reconocer sus commits: hay un test que recorre el ciclo real.
 */
const ASUNTO_CHORE_RE =
  /^chore\((TASK-\d{3,})\): (tarea en diseno|plan aprobado|tarea en curso|peticion de revision ronda \d+|tarea terminada y artefactos de cierre|pausa registrada)$/;

function faseDeAsunto(resumen: string): FaseMedida {
  if (resumen === 'tarea en diseno') return 'plan';
  if (resumen === 'plan aprobado') return 'approve';
  if (resumen === 'tarea en curso') return 'start';
  if (resumen === 'pausa registrada') return 'pausa';
  if (resumen.startsWith('peticion de revision')) return 'review';
  return 'finish';
}

/**
 * Parsea la salida de `git log --format=%at%x09%s`: una linea por commit,
 * segundos de la fecha de autor, tabulador, asunto. Lo que no casa se
 * ignora (cualquier otro commit del repo).
 */
export function parsearLogGit(salida: string): EventoGit[] {
  const eventos: EventoGit[] = [];
  for (const linea of salida.split(/\r?\n/)) {
    const tab = linea.indexOf('\t');
    if (tab === -1) continue;
    const segundos = Number(linea.slice(0, tab));
    if (!Number.isInteger(segundos)) continue;
    const m = ASUNTO_CHORE_RE.exec(linea.slice(tab + 1).trim());
    if (m === null) continue;
    eventos.push({ id: m[1] as string, fase: faseDeAsunto(m[2] as string), ms: segundos * 1000 });
  }
  return eventos;
}

interface Marcas {
  plan: Marca | null;
  start: Marca | null;
  review: Marca | null;
  finish: Marca | null;
  pausas: number;
}

function marcasDe(eventos: readonly { fase: FaseMedida; marca: Marca }[]): Marcas {
  // Orden cronologico: el registro ya lo esta, git log va al reves.
  const orden = [...eventos].sort((a, b) => a.marca.ms - b.marca.ms);
  const primera = (fase: FaseMedida): Marca | null => orden.find((e) => e.fase === fase)?.marca ?? null;
  const finishes = orden.filter((e) => e.fase === 'finish');
  return {
    plan: primera('plan'),
    start: primera('start'),
    review: primera('review'),
    finish: finishes.length === 0 ? null : (finishes[finishes.length - 1] as { marca: Marca }).marca,
    pausas: orden.filter((e) => e.fase === 'pausa').length,
  };
}

/** Duracion entre dos marcas; null si falta una o la de fin es anterior. */
export function duracionEntre(desde: Marca | null, hasta: Marca | null): Duracion | null {
  if (desde === null || hasta === null) return null;
  if (desde.precision === 'dia' || hasta.precision === 'dia') {
    const dia = (ms: number): number => Math.floor(ms / 86_400_000);
    const dias = dia(hasta.ms) - dia(desde.ms);
    return dias < 0 ? null : { valor: dias, precision: 'dia' };
  }
  const ms = hasta.ms - desde.ms;
  return ms < 0 ? null : { valor: ms, precision: 'segundo' };
}

/** Una fila por tarea, sin la parte de heuristica. */
export function calcularFila(e: EntradaMetricas): FilaMetricas {
  const registro = leerTransiciones(e.body).map((f) => ({
    fase: f.fase as FaseMedida,
    marca: { ms: instanteDe(f.fecha), precision: precisionDeFecha(f.fecha) as PrecisionFecha },
  }));
  let origen: OrigenMetricas;
  let marcas: Marcas;
  if (registro.length > 0) {
    origen = 'registro';
    marcas = marcasDe(registro);
  } else if (e.eventosGit.length > 0) {
    origen = 'git';
    marcas = marcasDe(
      e.eventosGit.map((g) => ({ fase: g.fase, marca: { ms: g.ms, precision: 'segundo' as const } }))
    );
  } else {
    origen = '—';
    marcas = { plan: null, start: null, review: null, finish: null, pausas: 0 };
  }
  return {
    id: e.task.id,
    sprint: e.task.sprint,
    tokens: {
      diseno: e.task.tokens_diseno,
      implementacion: e.task.tokens_implementacion,
      revision: e.task.tokens_revision,
    },
    estado: e.task.estado,
    complejidad: e.task.complejidad,
    diseno: duracionEntre(marcas.plan, marcas.start),
    curso: duracionEntre(marcas.start, marcas.review),
    revision: duracionEntre(marcas.review, marcas.finish),
    rondas: e.ronda > 0 ? e.ronda : null,
    cierre: marcas.finish === null ? null : new Date(marcas.finish.ms).toISOString().slice(0, 10),
    pausas: marcas.pausas,
    origen,
  };
}

/** `—` para lo que no hay; dias como `N d`; segundos como `1d 03h`, `2h 05m`, `7m`, `40s`. */
export function formatearDuracion(d: Duracion | null): string {
  if (d === null) return '—';
  if (d.precision === 'dia') return `${String(d.valor)} d`;
  const s = Math.floor(d.valor / 1000);
  const dd = Math.floor(s / 86_400);
  const hh = Math.floor((s % 86_400) / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const dos = (n: number): string => String(n).padStart(2, '0');
  if (dd > 0) return `${String(dd)}d ${dos(hh)}h`;
  if (hh > 0) return `${String(hh)}h ${dos(mm)}m`;
  if (mm > 0) return `${String(mm)}m`;
  return `${String(s % 60)}s`;
}

/**
 * Columnas de la tabla, en orden. Una lista y no un formato cableado: las
 * columnas de coste (tokens) se anaden aqui sin tocar el resto.
 */
export interface ColumnaMetricas {
  cabecera: string;
  valor: (f: FilaMetricas) => string;
}

export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
  { cabecera: 'id', valor: (f) => f.id },
  { cabecera: 'complejidad', valor: (f) => f.complejidad ?? '—' },
  { cabecera: 'diseno', valor: (f) => formatearDuracion(f.diseno) },
  { cabecera: 'curso', valor: (f) => formatearDuracion(f.curso) },
  { cabecera: 'revision', valor: (f) => formatearDuracion(f.revision) },
  { cabecera: 'rondas', valor: (f) => (f.rondas === null ? '—' : String(f.rondas)) },
  { cabecera: 'cierre', valor: (f) => f.cierre ?? '—' },
  { cabecera: 'origen', valor: (f) => f.origen },
];

/** Las que anade `--heuristica`. */
export const COLUMNAS_HEURISTICA: readonly ColumnaMetricas[] = [
  { cabecera: 'puntos', valor: (f) => (f.heuristica === undefined ? '—' : String(f.heuristica.puntos)) },
  { cabecera: 'nivel_heuristico', valor: (f) => f.heuristica?.nivel ?? '—' },
];

/** Tabla de texto alineada (Markdown valido) a partir de cabeceras y celdas ya formateadas. */
export function tablaDeTexto(cabeceras: readonly string[], celdas: readonly (readonly string[])[]): string {
  const anchos = cabeceras.map((c, i) => Math.max(c.length, ...celdas.map((fila) => (fila[i] as string).length)));
  const linea = (valores: readonly string[]): string =>
    `| ${valores.map((v, i) => v.padEnd(anchos[i] as number)).join(' | ')} |`;
  return [
    linea(cabeceras),
    `|${anchos.map((a) => '-'.repeat(a + 2)).join('|')}|`,
    ...celdas.map(linea),
  ].join('\n');
}

/** Tabla de texto alineada (Markdown valido). */
export function formatearTabla(filas: readonly FilaMetricas[], columnas: readonly ColumnaMetricas[]): string {
  return tablaDeTexto(
    columnas.map((c) => c.cabecera),
    filas.map((f) => columnas.map((c) => c.valor(f)))
  );
}

/**
 * Regla de coste de la recalibracion: una tarea entra en la muestra si esta
 * terminada y tiene al menos un informe de revision. Sin `revision/` no es
 * «0 rondas»: es que no se midio (las tareas anteriores a `review`).
 */
export function enMuestraHeuristica(f: FilaMetricas): boolean {
  return f.estado === 'terminada' && f.rondas !== null;
}

export interface GrupoResumen {
  nivel: TaskComplexity | '—';
  n: number;
  rondasMedia: number;
}

/** n y rondas medias agrupando por un nivel (declarado o heuristico), en el orden del enum. */
export function resumirPorNivel(
  filas: readonly FilaMetricas[],
  nivelDe: (f: FilaMetricas) => TaskComplexity | null,
  orden: readonly TaskComplexity[]
): GrupoResumen[] {
  const grupos = new Map<TaskComplexity | '—', number[]>();
  for (const f of filas) {
    const nivel = nivelDe(f) ?? '—';
    const lista = grupos.get(nivel) ?? [];
    lista.push(f.rondas ?? 0);
    grupos.set(nivel, lista);
  }
  const claves: (TaskComplexity | '—')[] = [...orden, '—'];
  return claves
    .filter((k) => grupos.has(k))
    .map((k) => {
      const r = grupos.get(k) as number[];
      return { nivel: k, n: r.length, rondasMedia: r.reduce((a, b) => a + b, 0) / r.length };
    });
}

export function formatearResumen(titulo: string, grupos: readonly GrupoResumen[]): string {
  const filas = grupos.map((g) => `  ${g.nivel.padEnd(8)} n=${String(g.n).padStart(3)}  rondas medias=${g.rondasMedia.toFixed(2)}`);
  return [titulo, ...filas].join('\n');
}

// --- Coste en tokens (TASK-023) ---------------------------------------------

export type FaseTokens = keyof TokensFila;

/** Fases en el orden de la tabla; `curso` en las columnas es la implementacion. */
export const FASES_TOKENS: readonly FaseTokens[] = ['diseno', 'implementacion', 'revision'];

/** Suma de lo registrado; null si la tarea no tiene ni una fase con dato (nunca un 0 inventado). */
export function totalTokens(t: TokensFila): number | null {
  const datos = FASES_TOKENS.map((k) => t[k]).filter((v): v is number => v !== null);
  return datos.length === 0 ? null : datos.reduce((a, b) => a + b, 0);
}

function celdaTokens(v: number | null): string {
  return v === null ? '—' : String(v);
}

/** Las que anade `--tokens` a la tabla: «curso» es la implementacion, como en las duraciones. */
export const COLUMNAS_TOKENS: readonly ColumnaMetricas[] = [
  { cabecera: 'tok_diseno', valor: (f) => celdaTokens(f.tokens.diseno) },
  { cabecera: 'tok_curso', valor: (f) => celdaTokens(f.tokens.implementacion) },
  { cabecera: 'tok_revision', valor: (f) => celdaTokens(f.tokens.revision) },
  { cabecera: 'tok_total', valor: (f) => celdaTokens(totalTokens(f.tokens)) },
];

/** Columnas del bloque de docs/METRICAS.md: solo lo que no depende de git log ni del reloj. */
export const COLUMNAS_BLOQUE_TOKENS: readonly ColumnaMetricas[] = [
  { cabecera: 'id', valor: (f) => f.id },
  { cabecera: 'sprint', valor: (f) => String(f.sprint) },
  { cabecera: 'complejidad', valor: (f) => f.complejidad ?? '—' },
  ...COLUMNAS_TOKENS,
];

export interface ResumenFaseTokens {
  /** Suma de las tareas del grupo que tienen dato en esta fase. */
  suma: number;
  /** Cuantas tareas del grupo tienen dato en esta fase. */
  n: number;
  /** suma / n redondeada; null sin ninguna tarea con dato. */
  media: number | null;
  /** Porcentaje (0-100, un decimal) de esta fase sobre el total del grupo; null si el total es 0. */
  porcentaje: number | null;
}

export interface ResumenTokensGrupo {
  grupo: string;
  /** Tareas del grupo. */
  nTotal: number;
  /** Tareas con dato en alguna fase: las unicas que entran en el resumen. */
  nConDato: number;
  fases: Record<FaseTokens, ResumenFaseTokens>;
  total: number;
  mediaTotal: number | null;
}

/**
 * Agrega por grupo (sprint, complejidad...). Los grupos salen en `orden`, y
 * los que no esten en el, detras en orden alfabetico; un grupo con tareas
 * pero sin ningun dato sale igualmente (n 0/N), para que se vea que existe.
 * Las tareas sin ningun dato cuentan en `nTotal` y no en nada mas.
 */
export function resumirTokens(
  filas: readonly FilaMetricas[],
  grupoDe: (f: FilaMetricas) => string,
  orden: readonly string[] = []
): ResumenTokensGrupo[] {
  const grupos = new Map<string, FilaMetricas[]>();
  for (const f of filas) {
    const g = grupoDe(f);
    const lista = grupos.get(g) ?? [];
    lista.push(f);
    grupos.set(g, lista);
  }
  const claves = [
    ...orden.filter((k) => grupos.has(k)),
    ...[...grupos.keys()].filter((k) => !orden.includes(k)).sort(),
  ];
  return claves.map((grupo) => {
    const lista = grupos.get(grupo) as FilaMetricas[];
    const conDato = lista.filter((f) => totalTokens(f.tokens) !== null);
    const fases = {} as Record<FaseTokens, ResumenFaseTokens>;
    let total = 0;
    for (const k of FASES_TOKENS) {
      const valores = conDato.map((f) => f.tokens[k]).filter((v): v is number => v !== null);
      const suma = valores.reduce((a, b) => a + b, 0);
      total += suma;
      fases[k] = {
        suma,
        n: valores.length,
        media: valores.length === 0 ? null : Math.round(suma / valores.length),
        porcentaje: null,
      };
    }
    for (const k of FASES_TOKENS) {
      fases[k].porcentaje = total === 0 ? null : Math.round((fases[k].suma / total) * 1000) / 10;
    }
    return {
      grupo,
      nTotal: lista.length,
      nConDato: conDato.length,
      fases,
      total,
      mediaTotal: conDato.length === 0 ? null : Math.round(total / conDato.length),
    };
  });
}

function celdaFase(r: ResumenFaseTokens): string {
  if (r.n === 0) return '—';
  const pct = r.porcentaje === null ? '—' : `${r.porcentaje.toFixed(1)}%`;
  return `${String(r.suma)} (media ${String(r.media)}, ${pct})`;
}

/**
 * Tabla Markdown del resumen: por grupo, «n con dato / n total», la suma de
 * cada fase con su media y su % sobre el total del grupo, y el total.
 */
export function formatearResumenTokens(etiquetaGrupo: string, grupos: readonly ResumenTokensGrupo[]): string {
  return tablaDeTexto(
    [etiquetaGrupo, 'con dato/total', 'diseno', 'curso', 'revision', 'total (media)'],
    grupos.map((g) => [
      g.grupo,
      `${String(g.nConDato)}/${String(g.nTotal)}`,
      celdaFase(g.fases.diseno),
      celdaFase(g.fases.implementacion),
      celdaFase(g.fases.revision),
      g.nConDato === 0 ? '—' : `${String(g.total)} (media ${String(g.mediaTotal)})`,
    ])
  );
}

/** Nota que acompana a los resumenes: que entra y que no. */
export const NOTA_TOKENS =
  'Tokens procesados (entrada + cache + salida) por fase; «curso» es la implementacion. ' +
  '«—» = sin registrar (no es 0). Los resumenes solo cuentan tareas con algun dato ' +
  '(con dato/total): las demas salen en la tabla y no en el resumen. Cada media es sobre ' +
  'las tareas que tienen esa fase; el % es de la fase sobre el total del grupo.';

/** Los dos resumenes (por sprint y por complejidad declarada), en Markdown. */
export function resumenesTokens(filas: readonly FilaMetricas[]): { porSprint: string; porComplejidad: string } {
  const sprints = [...new Set(filas.map((f) => f.sprint))].sort((a, b) => a - b).map(String);
  return {
    porSprint: formatearResumenTokens(
      'sprint',
      resumirTokens(filas, (f) => String(f.sprint), sprints)
    ),
    porComplejidad: formatearResumenTokens(
      'complejidad',
      resumirTokens(filas, (f) => f.complejidad ?? '—', [...TASK_COMPLEXITIES, '—'])
    ),
  };
}

// --- Bloque regenerable de docs/METRICAS.md ----------------------------------

export const MARCADOR_INICIO_TOKENS = '<!-- taskctl metricas --tokens: inicio -->';
export const MARCADOR_FIN_TOKENS = '<!-- taskctl metricas --tokens: fin -->';

/**
 * El bloque entre marcadores (marcadores incluidos, saltos de linea LF).
 * Determinista: sin fecha ni nada del reloj, para que regenerarlo con los
 * mismos datos no ensucie el diff.
 */
export function renderBloqueTokens(filas: readonly FilaMetricas[]): string {
  const { porSprint, porComplejidad } = resumenesTokens(filas);
  return [
    MARCADOR_INICIO_TOKENS,
    '## Coste en tokens por tarea (generado)',
    '',
    '> Generado por `taskctl metricas --tokens --escribir`. No editar a mano: lo que haya entre',
    '> los marcadores se sobrescribe.',
    '',
    formatearTabla(filas, COLUMNAS_BLOQUE_TOKENS),
    '',
    '### Resumen por sprint',
    '',
    porSprint,
    '',
    '### Resumen por complejidad declarada',
    '',
    porComplejidad,
    '',
    NOTA_TOKENS,
    MARCADOR_FIN_TOKENS,
  ].join('\n');
}

export class BloqueTokensError extends Error {}

/**
 * Pone `bloque` en `contenido`: sustituye lo que hay entre los marcadores
 * (incluidos) o, si no existen, lo anade al final tras una linea en blanco.
 * Fuera del bloque el texto no se toca ni un byte; el bloque adopta el salto
 * de linea del fichero (CRLF si lo usa). Un marcador suelto, repetido o
 * desordenado es ambiguo y se rechaza en vez de adivinar que borrar.
 */
export function sustituirBloqueTokens(contenido: string, bloque: string): string {
  const eol = contenido.includes('\r\n') ? '\r\n' : '\n';
  const nuevo = bloque.split('\n').join(eol);
  const cuenta = (m: string): number => contenido.split(m).length - 1;
  const inicios = cuenta(MARCADOR_INICIO_TOKENS);
  const fines = cuenta(MARCADOR_FIN_TOKENS);
  if (inicios === 0 && fines === 0) {
    if (contenido === '') return nuevo + eol;
    const cierre = contenido.endsWith('\n') ? '' : eol;
    return `${contenido}${cierre}${eol}${nuevo}${eol}`;
  }
  const i = contenido.indexOf(MARCADOR_INICIO_TOKENS);
  const f = contenido.indexOf(MARCADOR_FIN_TOKENS);
  if (inicios !== 1 || fines !== 1 || f < i) {
    throw new BloqueTokensError(
      `[ERROR] docs/METRICAS.md tiene los marcadores del bloque de tokens mal puestos ` +
        `(${String(inicios)} de inicio, ${String(fines)} de fin, o el fin antes del inicio). ` +
        `Deja exactamente un par "${MARCADOR_INICIO_TOKENS}" ... "${MARCADOR_FIN_TOKENS}" ` +
        '(o borra los dos para que se anada al final) y reintenta; no se ha tocado nada.'
    );
  }
  return contenido.slice(0, i) + nuevo + contenido.slice(f + MARCADOR_FIN_TOKENS.length);
}
