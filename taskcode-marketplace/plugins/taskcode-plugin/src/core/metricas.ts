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
 *
 * FILA ENRIQUECIDA (TASK-064): cada fila lleva ademas el desglose de
 * `## Coste` frente a `tokens_<fase>` (`coste`), los hallazgos de todos sus
 * informes de revision contados una vez por tarea (`hallazgos`), el tamano
 * de cada peticion de revision (`kbPeticionPorRonda`), el tipo y el numero
 * de criterios. Todos esos campos estan SIEMPRE presentes; lo que no se pudo
 * medir va como null o vacio con el significado documentado en cada tipo
 * (`ResumenCostes`, `ResumenHallazgos`), para que quien agregue no tenga que
 * adivinar si un 0 es un cero o una ausencia.
 */
import { leerTransiciones, instanteDe, precisionDeFecha, type PrecisionFecha } from './transiciones.js';
import { TASK_COMPLEXITIES, type Task, type TaskComplexity, type TaskState, type TaskType } from './task.js';
import { FASES_COSTE, leerCostes, resumirCostes, type FaseCoste, type ResumenCostes } from './coste-registro.js';
import { resumirHallazgos, type InformeLeido, type ResumenHallazgos } from './informe-revision.js';
import { extraerSecciones } from './tarea-body.js';

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

/** Tamano de la peticion de revision de una ronda (todas sus partes si se fragmento). */
export interface PeticionRonda {
  ronda: number;
  /** KiB con un decimal. */
  kb: number;
}

/**
 * Clave de una tarea en cualquier Map de metricas: (proyecto, id). Hoy hay
 * un solo proyecto por ejecucion, pero TASK-NNN se repite entre proyectos y
 * la fila ya lleva el suyo, para que juntar varios no cruce tareas.
 */
export function claveTarea(proyecto: string, id: string): string {
  return `${proyecto}\u0000${id}`;
}

/**
 * Como se nombra una tarea en avisos y listas (TASK-065): con un solo
 * proyecto, su ID a secas (la salida de siempre); con varios, `proyecto/ID`,
 * porque TASK-NNN se repite entre repos.
 */
export function etiquetaTarea(f: { proyecto: string; id: string }, varios: boolean): string {
  return varios ? `${f.proyecto}/${f.id}` : f.id;
}

export interface FilaMetricas {
  /** Nombre del proyecto (la carpeta del repo); '' si quien llama no lo da. */
  proyecto: string;
  id: string;
  tipo: TaskType;
  /** Criterios de aceptacion de la tarea (lineas de la seccion). */
  criterios: number;
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
  /** Desglose de `## Coste` frente a `tokens_<fase>`; `conTabla: false` = sin desglose. */
  coste: ResumenCostes;
  /** Hallazgos de todas las rondas, una vez por revisor + ID; ver los null en `ResumenHallazgos`. */
  hallazgos: ResumenHallazgos;
  /** Una entrada por ronda con peticion; vacio = sin peticiones de revision (no medido). */
  kbPeticionPorRonda: PeticionRonda[];
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
  /** Proyecto de la tarea; '' por defecto. */
  proyecto?: string;
  /** Informes de revision leidos de `revision/`; sin ellos, hallazgos no medidos. */
  informes?: readonly InformeLeido[];
  /** Bytes de cada `peticion-revision-N[-revisor].md`. */
  peticiones?: readonly { ronda: number; bytes: number }[];
}

function kbPorRonda(peticiones: readonly { ronda: number; bytes: number }[]): PeticionRonda[] {
  const bytes = new Map<number, number>();
  for (const p of peticiones) bytes.set(p.ronda, (bytes.get(p.ronda) ?? 0) + p.bytes);
  return [...bytes.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ronda, b]) => ({ ronda, kb: Math.round(b / 102.4) / 10 }));
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
    proyecto: e.proyecto ?? '',
    id: e.task.id,
    tipo: e.task.tipo,
    criterios: extraerSecciones(e.body).criterios.length,
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
    coste: resumirCostes(leerCostes(e.body), {
      diseno: e.task.tokens_diseno,
      implementacion: e.task.tokens_implementacion,
      revision: e.task.tokens_revision,
    }),
    hallazgos: resumirHallazgos(e.informes ?? []),
    kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
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

function celdaConteo(n: number | undefined): string {
  return n === undefined ? '—' : String(n);
}

export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
  { cabecera: 'id', valor: (f) => f.id },
  { cabecera: 'complejidad', valor: (f) => f.complejidad ?? '—' },
  { cabecera: 'diseno', valor: (f) => formatearDuracion(f.diseno) },
  { cabecera: 'curso', valor: (f) => formatearDuracion(f.curso) },
  { cabecera: 'revision', valor: (f) => formatearDuracion(f.revision) },
  { cabecera: 'rondas', valor: (f) => (f.rondas === null ? '—' : String(f.rondas)) },
  { cabecera: 'crit', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.CRITICO) },
  { cabecera: 'imp', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.IMPORTANTE) },
  { cabecera: 'men', valor: (f) => celdaConteo(f.hallazgos.porSeveridad?.MENOR) },
  {
    cabecera: 'hall_origen',
    valor: (f) => {
      const o = f.hallazgos.porOrigen;
      if (o === null) return '—';
      return [o.implementacion, o.plan, o.especificacion, o['sin clasificar']].map(String).join('/');
    },
  },
  { cabecera: 'cierre', valor: (f) => f.cierre ?? '—' },
  { cabecera: 'origen', valor: (f) => f.origen },
];

/** Primera columna con varios proyectos (`--repo` repetido): el ID solo no identifica la tarea. */
export const COLUMNA_PROYECTO: ColumnaMetricas = { cabecera: 'proyecto', valor: (f) => f.proyecto };

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

// --- Fila enriquecida: desglose, hallazgos, lecturas (TASK-064) --------------

/**
 * Suma de un campo de las tres fases del desglose; null si la tarea no tiene
 * tabla `## Coste`. `nuevos` y `cacheLectura` tambien son null si ninguna
 * fila tiene desglose (solo filas `manual`): no se midio nada, no es 0.
 */
function sumaDesglose(f: FilaMetricas, campo: 'nuevos' | 'cacheLectura' | 'sinDesglose'): number | null {
  if (!f.coste.conTabla) return null;
  if (campo !== 'sinDesglose' && FASES_COSTE.every((fase) => f.coste.fases[fase].desglosado === 0)) return null;
  return FASES_COSTE.reduce((a, fase) => a + (f.coste.fases[fase][campo] ?? 0), 0);
}

/** `tok_sin_desglose`: la suma, con `*` si alguna fase es negativa (la suma podria esconderlo). */
function celdaSinDesglose(f: FilaMetricas): string {
  const suma = sumaDesglose(f, 'sinDesglose');
  if (suma === null) return '—';
  const negativa = FASES_COSTE.some((fase) => (f.coste.fases[fase].sinDesglose ?? 0) < 0);
  return negativa ? `${String(suma)}*` : String(suma);
}

/** Las que anade `--tokens` a la tabla por pantalla (no al bloque de docs/METRICAS.md). */
export const COLUMNAS_DESGLOSE_TOKENS: readonly ColumnaMetricas[] = [
  { cabecera: 'tok_nuevos', valor: (f) => celdaTokens(sumaDesglose(f, 'nuevos')) },
  { cabecera: 'tok_cache_lect', valor: (f) => celdaTokens(sumaDesglose(f, 'cacheLectura')) },
  { cabecera: 'tok_sin_desglose', valor: celdaSinDesglose },
];

export const NOTA_DESGLOSE_TOKENS =
  'Desglose de "## Coste" (solo tareas con esa tabla; «—» = sin tabla, y en tok_nuevos y ' +
  'tok_cache_lect tambien si ninguna fila tiene desglose): tok_nuevos = entrada + ' +
  'escritura de cache + salida; tok_cache_lect = lectura de cache, aparte; tok_sin_desglose = ' +
  'tokens_<fase> menos lo desglosado (filas "manual" o coste anterior a la tabla), sumado por ' +
  'fases. Un negativo en una fase es una incoherencia (el desglose supera al total): no se ' +
  'recorta a 0, sale con aviso y la celda lleva "*" aunque la suma sea positiva. Un agente ' +
  'repetido en una fase suma tantas veces como filas tenga: se avisa, no se deduplica.';

export const NOTA_HALLAZGOS =
  'Hallazgos: cada uno cuenta una vez por tarea (revisor + ID) sumando todas las rondas, con la ' +
  'severidad y el origen de la ultima ronda que los reconoce. hall_origen = implementacion/plan/' +
  'especificacion/sin clasificar. «—» = sin dato: sin informes de revision, o algun informe sin ' +
  'tabla de hallazgos (no cuenta como cero).';

/** Avisos de una fila: incoherencias del desglose y severidades fuera de vocabulario. */
export function avisosDeFila(f: FilaMetricas, varios = false): string[] {
  const avisos: string[] = [];
  const et = etiquetaTarea(f, varios);
  for (const fase of FASES_COSTE) {
    const r = f.coste.fases[fase];
    if (r.registrado === null && r.filas > 0) {
      avisos.push(
        `${et}: tokens_${fase} esta vacio pero "## Coste" tiene ${String(r.filas)} fila(s) de ${fase}; ` +
          'el total de la fase deberia ser la suma de su desglose. Revisa el frontmatter.'
      );
    } else if (r.sinDesglose !== null && r.sinDesglose < 0) {
      avisos.push(
        `${et}: lo desglosado en "## Coste" para ${fase} (${String(r.desglosado)}) supera tokens_${fase} ` +
          `(${String(r.registrado)}): diferencia ${String(r.sinDesglose)}. Revisa el frontmatter o las filas.`
      );
    }
  }
  for (const rep of f.coste.repetidas) {
    avisos.push(
      `${et}: en "## Coste", ${rep.fuente} aparece en ${String(rep.filas)} filas de ${rep.fase}: ` +
        'su coste se suma otras tantas veces (no se deduplica). Si se registro dos veces por error, ' +
        `corrige tokens_${rep.fase} y quita la fila sobrante.`
    );
  }
  const porFichero = new Map<string, string[]>();
  for (const d of f.hallazgos.severidadesDesconocidas) {
    const lista = porFichero.get(d.fichero) ?? [];
    lista.push(d.valor === '' ? `${d.id} (vacia)` : `${d.id} ("${d.valor}")`);
    porFichero.set(d.fichero, lista);
  }
  for (const [fichero, lista] of porFichero) {
    avisos.push(
      `${et} revision/${fichero}: severidad fuera de vocabulario (CRITICO, IMPORTANTE o MENOR) en ` +
        `${lista.join(', ')}; no cuenta en crit/imp/men.`
    );
  }
  return avisos;
}

/** Un solo aviso con las tareas que tienen informes sin tabla de hallazgos; null si no hay. */
export function avisoInformesSinTabla(filas: readonly FilaMetricas[], varios = false): string | null {
  const con = filas.filter((f) => f.hallazgos.informesSinTabla.length > 0);
  if (con.length === 0) return null;
  const n = con.reduce((a, f) => a + f.hallazgos.informesSinTabla.length, 0);
  return (
    `${String(n)} informe(s) de revision sin tabla de hallazgos en ${String(con.length)} tarea(s); sus ` +
    `hallazgos salen como sin dato («—»), no como cero: ${con.map((f) => etiquetaTarea(f, varios)).join(', ')}.`
  );
}

/** Tareas terminadas sin coste (null o 0) en alguna fase, con esas fases. */
export function tareasSinCoste(
  filas: readonly FilaMetricas[]
): { proyecto: string; id: string; fases: FaseCoste[] }[] {
  return filas
    .filter((f) => f.estado === 'terminada')
    .map((f) => ({ proyecto: f.proyecto, id: f.id, fases: FASES_COSTE.filter((k) => !f.coste.fases[k].registrado) }))
    .filter((t) => t.fases.length > 0);
}

/** Mediana de una lista (media de los dos centrales si es par); null si esta vacia. */
export function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? (v[m] as number) : ((v[m - 1] as number) + (v[m] as number)) / 2;
}

/** Por fase, la mediana de lecturas de las tareas cuya tabla `## Coste` las mide, y cuantas son. */
export function medianaLecturas(
  filas: readonly FilaMetricas[]
): Record<FaseCoste, { mediana: number | null; n: number }> {
  const r = {} as Record<FaseCoste, { mediana: number | null; n: number }>;
  for (const fase of FASES_COSTE) {
    const valores = filas.map((f) => f.coste.fases[fase].lecturas).filter((v): v is number => v !== null);
    r[fase] = { mediana: mediana(valores), n: valores.length };
  }
  return r;
}

/** Lineas de texto bajo la tabla: hallazgos sin dato, lecturas y terminadas sin coste. */
export function notasFilaEnriquecida(filas: readonly FilaMetricas[], varios = false): string[] {
  const sinTabla = filas.filter((f) => f.hallazgos.informesSinTabla.length > 0);
  const nInformes = sinTabla.reduce((a, f) => a + f.hallazgos.informesSinTabla.length, 0);
  const lect = medianaLecturas(filas);
  const sinCoste = tareasSinCoste(filas);
  const terminadas = filas.filter((f) => f.estado === 'terminada').length;
  return [
    NOTA_HALLAZGOS +
      ` Informes sin tabla de hallazgos: ${String(nInformes)} (en ${String(sinTabla.length)} tareas).`,
    'Lecturas por fase (mediana de las tareas cuya tabla "## Coste" las mide): ' +
      FASES_COSTE.map((k) => `${k} ${lect[k].mediana === null ? '—' : String(lect[k].mediana)} (n=${String(lect[k].n)})`).join(
        ', '
      ) +
      '.',
    sinCoste.length === 0
      ? `Terminadas sin coste en alguna fase: 0 de ${String(terminadas)}.`
      : `Terminadas sin coste en alguna fase: ${String(sinCoste.length)} de ${String(terminadas)}: ` +
        sinCoste.map((t) => `${etiquetaTarea(t, varios)} (${t.fases.join(', ')})`).join(', ') +
        '.',
  ];
}
