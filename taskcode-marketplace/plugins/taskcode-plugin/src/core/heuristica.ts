/**
 * `scripts/heuristica-complejidad.yml` — lectura, validacion y las
 * cuatro operaciones que ese fichero habilita: puntuar una tarea,
 * traducir la puntuacion a un nivel, mirar en la tabla cuantos agentes
 * de brainstorm pide ese nivel, y resolver el numero final para una
 * tarea concreta.
 *
 * Hasta hoy el YML no lo leia nadie desde `src/`: existia con sus
 * tests pero sin consumidor. Este modulo es ese consumidor.
 *
 * MISMA DOCTRINA QUE src/core/config.ts, y por los mismos motivos:
 *
 * 1. FALLO CERRADO. Una clave desconocida, una clave obligatoria
 *    ausente, un valor del tipo equivocado o un numero negativo
 *    ABORTAN. Nunca hay caida al default en silencio. Aqui la regla
 *    aprieta MAS que en config.yml: alli las tres claves son
 *    opcionales porque un repo sin configuracion es normal; aqui NO
 *    hay defaults en codigo y las 22 claves son obligatorias, porque
 *    este fichero lo distribuye el propio plugin y una clave que falta
 *    no significa "usa lo de siempre", significa que el fichero esta
 *    roto o que alguien lo edito a medias.
 * 2. UN SOLO PARSER. El bucle `clave: valor` es el de frontmatter.ts,
 *    via parseBloqueClaveValor(). Aqui no hay ni una linea de parseo
 *    de YAML. Se le pasa `permitirComentariosDeLinea: true` porque el
 *    fichero empieza por un comentario: sin eso la lectura falla en su
 *    primera linea, y el propio YML lo avisa.
 * 3. UN SOLO PUNTO DE RESOLUCION. cargarHeuristica() devuelve la
 *    heuristica ya validada; ningun comando lee el fichero por su
 *    cuenta.
 *
 * ------------------------------------------------------------------
 * DIVERGENCIA DELIBERADA CON LA SECCION 5 DEL YML (aprobada por
 * Carlos, 2026-09-08).
 *
 * La seccion 5 del fichero dice que, cuando el nivel heuristico y el
 * declarado por la persona disten mas de `tolerancia_niveles`
 * escalones, se consulte a un modelo barato para desempatar. Este
 * modulo NO hace eso, porque el CLI no invoca modelos: `taskctl` hace
 * lo determinista y deja escrito lo que otro tiene que disparar (mismo
 * reparto que `taskctl review` establecio en TASK-013). Meter aqui una
 * llamada a un modelo cambiaria esa frontera entera.
 *
 * En su lugar, resolverNumeroAgentes() resuelve la discrepancia SIN
 * consultar a nadie: se queda con el MAYOR de los dos numeros de
 * agentes. Es la eleccion conservadora en la direccion que el propio
 * YML senala como la cara ("infraestimar deja la tarea con menos
 * revision de la que necesita"), y ademas nunca ignora lo que la
 * persona declaro: si declara mas de lo que la heuristica ve, manda lo
 * declarado. La discrepancia no se traga: sale en
 * `ResolucionAgentes.hayDiscrepancia` junto con los dos niveles y las
 * senales, para que quien orqueste pueda mostrarla o consultarla el.
 *
 * EFECTO MEDIDO DEL MAX, sobre las 32 tareas reales del repo el
 * 2026-09-08 (no es una estimacion: se ejecuto sobre ellas):
 *
 *   - Declarado y heuristico coinciden en 7 de 32.
 *   - CERO tareas disparan una sola palabra de alto riesgo. La senal
 *     mas cara del YML — la unica que mira el CONTENIDO del trabajo y
 *     no su forma — no se activa nunca, porque los objetivos estan
 *     escritos en vocabulario de metodologia y no de dominio tecnico.
 *     La puntuacion acaba gobernada por etiquetas, dependencias y
 *     numero de criterios, y por eso infraestima de forma sistematica.
 *   - NINGUNA tarea acaba con 0 roles. El reparto real es 14 tareas
 *     con 1 rol, 14 con 2 y 4 con 3.
 *
 * Ese ultimo punto merece leerse dos veces, porque es una consecuencia
 * que la decision no perseguia: el YML dice "0 en trivial (no se paga
 * un brainstorm para algo trivial)", y con el max ese 0 es
 * practicamente inalcanzable — basta que la tarea declare dos
 * dependencias, o cinco criterios de aceptacion, para que la
 * heuristica la suba a `simple` y el max le ponga un rol. La unica
 * tarea declarada `trivial` del repo (TASK-005) sale con 1.
 *
 * No se corrige por cuenta propia porque el max lo aprobo Carlos con
 * el caso delante, y respetar el suelo del declarado seria reabrir esa
 * decision. Queda escrito aqui y fijado en un test para que sea una
 * eleccion consciente y no un descubrimiento dentro de seis meses.
 *
 * CONSECUENCIA QUE HAY QUE DECIR EN VOZ ALTA: `tolerancia_niveles`,
 * `tolerancia_extra_si_heuristica_menor` y
 * `modelo_consulta_discrepancia` SE PARSEAN Y SE VALIDAN, PERO HOY NO
 * TIENEN NINGUN CONSUMIDOR. No las lee nadie para decidir nada. Se
 * siguen validando para que el fichero no pueda degradarse sin que
 * salte nada, y estan en la interfaz `Heuristica` para que quien
 * implemente la consulta a un modelo (fuera del CLI) las tenga. Pero
 * no se finge que se aplican: hoy el comportamiento seria identico si
 * el fichero dijera `tolerancia_niveles: 99`. Este proyecto ya se
 * quemo con `codex-review`, una clave documentada e inexistente; la
 * respuesta a eso es decirlo, no disimularlo.
 * ------------------------------------------------------------------
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBloqueClaveValor } from './frontmatter.js';
import { extraerSecciones, normalizarTexto } from './tarea-body.js';
import type { Task, TaskComplexity, TaskType } from './task.js';

export class HeuristicaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HeuristicaError';
  }
}

export interface Heuristica {
  peso_etiqueta_adicional: number;
  peso_palabra_alto_riesgo: number;
  peso_dependencia: number;
  peso_tipo_release: number;
  peso_tipo_hotfix_con_palabra_riesgo: number;
  peso_criterios_aceptacion: number;
  umbral_criterios_aceptacion: number;
  nivel_trivial_hasta: number;
  nivel_simple_hasta: number;
  nivel_media_hasta: number;
  nivel_alta_hasta: number;
  nivel_critica_desde: number;
  palabras_alto_riesgo: string[];
  agentes_brainstorm_trivial: number;
  agentes_brainstorm_simple: number;
  agentes_brainstorm_media: number;
  agentes_brainstorm_alta: number;
  agentes_brainstorm_critica: number;
  agentes_brainstorm_hotfix: number;
  tolerancia_niveles: number;
  tolerancia_extra_si_heuristica_menor: number;
  modelo_consulta_discrepancia: string;
}

/** Una senal encontrada al puntuar, para poder explicar el resultado. */
export interface Senal {
  clave: string;
  detalle: string;
  puntos: number;
}

export interface ResolucionAgentes {
  /** El numero FINAL de roles a lanzar. */
  agentes: number;
  nivelDeclarado: TaskComplexity;
  nivelHeuristico: TaskComplexity;
  puntos: number;
  senales: Senal[];
  /** Los dos niveles difieren. */
  hayDiscrepancia: boolean;
  /** El min() de hotfix recorto el numero. */
  topeHotfixAplicado: boolean;
}

/**
 * Las claves cuyo valor es un entero >= 0. El orden es el del fichero,
 * para que el mensaje de "clave desconocida" las enumere en el mismo
 * orden en que estan escritas y sea facil compararlos a ojo.
 */
const CLAVES_NUMERICAS = [
  'peso_etiqueta_adicional',
  'peso_palabra_alto_riesgo',
  'peso_dependencia',
  'peso_tipo_release',
  'peso_tipo_hotfix_con_palabra_riesgo',
  'peso_criterios_aceptacion',
  'umbral_criterios_aceptacion',
  'nivel_trivial_hasta',
  'nivel_simple_hasta',
  'nivel_media_hasta',
  'nivel_alta_hasta',
  'nivel_critica_desde',
  'agentes_brainstorm_trivial',
  'agentes_brainstorm_simple',
  'agentes_brainstorm_media',
  'agentes_brainstorm_alta',
  'agentes_brainstorm_critica',
  'agentes_brainstorm_hotfix',
  'tolerancia_niveles',
  'tolerancia_extra_si_heuristica_menor',
] as const;

const CLAVE_PALABRAS = 'palabras_alto_riesgo';
const CLAVE_MODELO = 'modelo_consulta_discrepancia';

/** Las unicas claves admitidas. Cualquier otra aborta (regla 1). */
export const CLAVES_HEURISTICA: readonly string[] = [
  ...CLAVES_NUMERICAS,
  CLAVE_PALABRAS,
  CLAVE_MODELO,
];

/** Nombre del fichero dentro de `scripts/`. */
export const FICHERO_HEURISTICA = 'heuristica-complejidad.yml';

/** Claves de `Senal.clave`. Son la unica forma de agrupar las senales. */
export const SENAL_ETIQUETAS = 'etiquetas_adicionales';
export const SENAL_PALABRA = 'palabra_alto_riesgo';
export const SENAL_DEPENDENCIA = 'dependencias';
export const SENAL_RELEASE = 'tipo_release';
export const SENAL_HOTFIX_RIESGO = 'tipo_hotfix_con_palabra_riesgo';
export const SENAL_CRITERIOS = 'criterios_aceptacion';

function packageRoot(): string {
  // dist/src/core/heuristica.js -> dist/src/core -> dist/src -> dist -> raiz
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.join(moduleDir, '..', '..', '..');
}

/**
 * Ruta del YML. Mismo patron que resolveGitflowScriptsDir(): respeta
 * CLAUDE_PLUGIN_ROOT (convencion documentada para cuando Claude Code
 * lanza taskctl como comando de plugin) si esta definida; si no,
 * calcula la ruta relativa al propio modulo compilado, necesario para
 * el dogfooding directo, donde esa variable no esta puesta.
 */
export function resolverRutaHeuristica(): string {
  const pluginRoot = process.env['CLAUDE_PLUGIN_ROOT'];
  if (pluginRoot !== undefined && pluginRoot.trim() !== '') {
    return path.join(pluginRoot, 'scripts', FICHERO_HEURISTICA);
  }
  return path.join(packageRoot(), 'scripts', FICHERO_HEURISTICA);
}

/**
 * EL punto de resolucion. Lee el fichero y lo valida, o lanza
 * HeuristicaError.
 *
 * No hay caso de "no hay fichero, usa los defaults": el YML lo
 * distribuye el plugin, asi que si falta es que la instalacion esta
 * rota, y seguir con unos pesos inventados en codigo daria numeros que
 * no se corresponden con ningun fichero que nadie pueda leer.
 *
 * No cachea, por el mismo motivo que resolverConfig: una cache seria
 * estado global compartido entre tests.
 */
export function cargarHeuristica(ruta?: string): Heuristica {
  const rutaFinal = ruta ?? resolverRutaHeuristica();
  let contenido: string;
  try {
    contenido = readFileSync(rutaFinal, 'utf8');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new HeuristicaError(
      `[ERROR] No se pudo leer la heuristica de complejidad "${rutaFinal}": ${msg}\n` +
        '        Ese fichero lo trae el plugin. Reinstalalo, o define CLAUDE_PLUGIN_ROOT\n' +
        '        apuntando a la raiz del plugin si lo ejecutas desde otro sitio.'
    );
  }
  return parsearHeuristica(contenido, rutaFinal);
}

/**
 * Separada de cargarHeuristica para poder probar el parseo y la
 * validacion sin disco, y para que el mensaje de error siempre pueda
 * nombrar el fichero de donde salio el problema.
 */
export function parsearHeuristica(contenido: string, ruta: string): Heuristica {
  const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
    etiqueta: 'heuristica de complejidad',
    crearError: (mensaje) => new HeuristicaError(`[ERROR] ${ruta}: ${mensaje}`),
    permitirComentariosDeLinea: true,
  });

  const numeros = new Map<string, number>();
  let palabras: string[] | undefined;
  let modelo: string | undefined;
  const vistas = new Set<string>();

  for (const par of pares) {
    const donde = `${ruta}:${par.numeroLinea}`;

    if (!CLAVES_HEURISTICA.includes(par.clave)) {
      throw new HeuristicaError(mensajeClaveDesconocida(donde, par.clave));
    }
    // Una clave repetida se pisaria en silencio (el ultimo gana) y el
    // fichero diria una cosa mientras el plugin usa otra: mismo dano
    // que un default silencioso, misma respuesta.
    if (vistas.has(par.clave)) {
      throw new HeuristicaError(
        `[ERROR] ${donde}: la clave "${par.clave}" esta repetida.\n` +
          '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.'
      );
    }
    vistas.add(par.clave);

    if (par.clave === CLAVE_PALABRAS) {
      palabras = validarListaDeTexto(donde, par.clave, par.valor);
    } else if (par.clave === CLAVE_MODELO) {
      modelo = validarTextoNoVacio(donde, par.clave, par.valor);
    } else {
      numeros.set(par.clave, validarEnteroNoNegativo(donde, par.clave, par.valor));
    }
  }

  const h: Heuristica = {
    peso_etiqueta_adicional: exigirNumero(numeros, 'peso_etiqueta_adicional', ruta),
    peso_palabra_alto_riesgo: exigirNumero(numeros, 'peso_palabra_alto_riesgo', ruta),
    peso_dependencia: exigirNumero(numeros, 'peso_dependencia', ruta),
    peso_tipo_release: exigirNumero(numeros, 'peso_tipo_release', ruta),
    peso_tipo_hotfix_con_palabra_riesgo: exigirNumero(
      numeros,
      'peso_tipo_hotfix_con_palabra_riesgo',
      ruta
    ),
    peso_criterios_aceptacion: exigirNumero(numeros, 'peso_criterios_aceptacion', ruta),
    umbral_criterios_aceptacion: exigirNumero(numeros, 'umbral_criterios_aceptacion', ruta),
    nivel_trivial_hasta: exigirNumero(numeros, 'nivel_trivial_hasta', ruta),
    nivel_simple_hasta: exigirNumero(numeros, 'nivel_simple_hasta', ruta),
    nivel_media_hasta: exigirNumero(numeros, 'nivel_media_hasta', ruta),
    nivel_alta_hasta: exigirNumero(numeros, 'nivel_alta_hasta', ruta),
    nivel_critica_desde: exigirNumero(numeros, 'nivel_critica_desde', ruta),
    palabras_alto_riesgo: exigirLista(palabras, CLAVE_PALABRAS, ruta),
    agentes_brainstorm_trivial: exigirNumero(numeros, 'agentes_brainstorm_trivial', ruta),
    agentes_brainstorm_simple: exigirNumero(numeros, 'agentes_brainstorm_simple', ruta),
    agentes_brainstorm_media: exigirNumero(numeros, 'agentes_brainstorm_media', ruta),
    agentes_brainstorm_alta: exigirNumero(numeros, 'agentes_brainstorm_alta', ruta),
    agentes_brainstorm_critica: exigirNumero(numeros, 'agentes_brainstorm_critica', ruta),
    agentes_brainstorm_hotfix: exigirNumero(numeros, 'agentes_brainstorm_hotfix', ruta),
    tolerancia_niveles: exigirNumero(numeros, 'tolerancia_niveles', ruta),
    tolerancia_extra_si_heuristica_menor: exigirNumero(
      numeros,
      'tolerancia_extra_si_heuristica_menor',
      ruta
    ),
    modelo_consulta_discrepancia: exigirTexto(modelo, CLAVE_MODELO, ruta),
  };

  validarEscalaDeNiveles(h, ruta);
  return h;
}

/**
 * La escala tiene que ser estrictamente creciente y no dejar huecos.
 *
 * No es celo: nivelHeuristico() es una cascada de "<=" y su ultimo
 * caso devuelve `critica` sin volver a mirar `nivel_critica_desde`.
 * Eso solo es correcto si `nivel_critica_desde` es exactamente
 * `nivel_alta_hasta + 1`. Con `alta_hasta: 7` y `critica_desde: 10`,
 * un 8 o un 9 no serian ni alta (el fichero dice que alta acaba en 7)
 * ni critica (dice que critica empieza en 10) — el fichero describiria
 * una escala con un agujero y el codigo devolveria `critica`
 * calladamente, contradiciendolo. Comprobarlo aqui es lo que permite
 * que la cascada no vuelva a leer esa clave: la redundancia es cierta
 * porque se exige, no porque se suponga.
 */
function validarEscalaDeNiveles(h: Heuristica, ruta: string): void {
  const escalones: readonly (readonly [string, number])[] = [
    ['nivel_trivial_hasta', h.nivel_trivial_hasta],
    ['nivel_simple_hasta', h.nivel_simple_hasta],
    ['nivel_media_hasta', h.nivel_media_hasta],
    ['nivel_alta_hasta', h.nivel_alta_hasta],
  ];
  for (let i = 1; i < escalones.length; i++) {
    const previo = escalones[i - 1] as readonly [string, number];
    const actual = escalones[i] as readonly [string, number];
    if (actual[1] <= previo[1]) {
      throw new HeuristicaError(
        `[ERROR] ${ruta}: "${actual[0]}" (${actual[1]}) tiene que ser mayor que ` +
          `"${previo[0]}" (${previo[1]}).\n` +
          '        Cada clave nivel_*_hasta es el ultimo valor que TODAVIA cae en ese\n' +
          '        nivel, asi que la escala tiene que ir siempre a mas. Sube la segunda\n' +
          '        o baja la primera.'
      );
    }
  }
  if (h.nivel_critica_desde !== h.nivel_alta_hasta + 1) {
    throw new HeuristicaError(
      `[ERROR] ${ruta}: "nivel_critica_desde" (${h.nivel_critica_desde}) tiene que ser ` +
        `exactamente "nivel_alta_hasta" + 1 (${h.nivel_alta_hasta + 1}).\n` +
        '        Con cualquier otro valor la escala deja un hueco (o un solape) y hay\n' +
        '        puntuaciones que no caen en ningun nivel. Ajusta una de las dos.'
    );
  }
}

/**
 * Enumera SIEMPRE las claves validas y, si la escrita se parece a una
 * de ellas, la propone. Mismo criterio que config.ts: el mensaje dice
 * que esta mal Y cuales son las validas.
 */
function mensajeClaveDesconocida(donde: string, clave: string): string {
  const sugerida = claveMasParecida(clave);
  const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
  if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
  lineas.push('        Borrala o corrigela: taskctl no usa una heuristica que no entiende.');
  lineas.push(`        Claves validas: ${CLAVES_HEURISTICA.join(', ')}.`);
  return lineas.join('\n');
}

/** Distancia de edicion (Levenshtein) a mano — cero dependencias. */
function distanciaEdicion(a: string, b: string): number {
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(
        (actual[j - 1] as number) + 1,
        (previa[j] as number) + 1,
        (previa[j - 1] as number) + coste
      );
    }
    previa = actual;
  }
  return previa[b.length] as number;
}

function claveMasParecida(clave: string): string | null {
  let mejor: string | null = null;
  let mejorDistancia = Number.POSITIVE_INFINITY;
  for (const valida of CLAVES_HEURISTICA) {
    const d = distanciaEdicion(clave.toLowerCase(), valida);
    if (d < mejorDistancia) {
      mejorDistancia = d;
      mejor = valida;
    }
  }
  // Umbral: hasta un tercio de la clave, como en config.ts. Sin el,
  // "foo" propondria una clave cualquiera y el consejo no valdria nada.
  return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
}

/**
 * Entero >= 0. El cero SI es legitimo aqui, a diferencia de
 * `limite_wip` en config.ts: `agentes_brainstorm_trivial: 0` es la
 * decision central del fichero (no se paga un brainstorm para algo
 * trivial) y `tolerancia_extra_si_heuristica_menor: 0` es su valor por
 * defecto declarado. Lo que no puede ser es negativo: un peso negativo
 * restaria complejidad por tener una senal mas, que es lo contrario de
 * lo que el fichero dice hacer.
 */
function validarEnteroNoNegativo(donde: string, clave: string, valor: unknown): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 0) {
    throw new HeuristicaError(
      `[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 0, ` +
        `y es ${describirValor(valor)}.\n` +
        '        Escribe el numero sin comillas y sin decimales. Un negativo restaria\n' +
        '        complejidad por tener una senal de mas, que es justo lo contrario de lo\n' +
        '        que hace esta heuristica.'
    );
  }
  return valor;
}

/**
 * Lista de textos no vacios. Una lista VACIA se acepta: un proyecto
 * que edite su copia del fichero para no tener vocabulario de riesgo
 * esta tomando una decision legitima, y el resto de senales sigue
 * funcionando. Lo que no se acepta es que no sea una lista: escrito
 * sin corchetes, el parser devuelve un texto y la comparacion por
 * subcadena buscaria la frase entera como si fuera una sola entrada.
 */
function validarListaDeTexto(donde: string, clave: string, valor: unknown): string[] {
  if (!Array.isArray(valor) || !valor.every((x) => typeof x === 'string')) {
    throw new HeuristicaError(
      `[ERROR] ${donde}: "${clave}" debe ser una lista de textos entre corchetes ` +
        `(p. ej. ["migracion", "seguridad"]), y es ${describirValor(valor)}.\n` +
        '        Sin corchetes se leeria como UNA sola entrada con todo el texto dentro.'
    );
  }
  const entradas = (valor as string[]).map((x) => x.trim());
  if (entradas.some((x) => x === '')) {
    throw new HeuristicaError(
      `[ERROR] ${donde}: "${clave}" tiene alguna entrada vacia.\n` +
        '        Quitala: una entrada vacia casaria como subcadena con CUALQUIER tarea\n' +
        '        y dispararia la senal siempre.'
    );
  }
  // La regla "una vez por entrada DISTINTA" se cumple porque se
  // recorre la lista, no el texto. Eso deja de ser cierto si la lista
  // trae la misma entrada dos veces: casaria en las dos vueltas y la
  // palabra puntuaria doble. Es exactamente el fallo silencioso que la
  // regla existe para evitar, asi que se rechaza aqui en vez de
  // deduplicar por detras (deduplicar callaria el error del fichero).
  const repetida = entradas.find((x, i) => entradas.indexOf(x) !== i);
  if (repetida !== undefined) {
    throw new HeuristicaError(
      `[ERROR] ${donde}: "${clave}" tiene la entrada "${repetida}" repetida.\n` +
        '        Deja solo una: la lista se recorre entera, asi que una entrada dos\n' +
        '        veces haria que esa palabra puntuara el doble que las demas.'
    );
  }
  return entradas;
}

function validarTextoNoVacio(donde: string, clave: string, valor: unknown): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new HeuristicaError(
      `[ERROR] ${donde}: "${clave}" debe ser texto no vacio, y es ${describirValor(valor)}.\n` +
        '        Ponle el nombre de un modelo (p. ej. haiku) o corrige la linea.'
    );
  }
  return valor.trim();
}

/** Como se nombra un valor rechazado en un mensaje de error. */
function describirValor(valor: unknown): string {
  if (valor === null) return 'un valor vacio';
  if (Array.isArray(valor)) return `una lista (${JSON.stringify(valor)})`;
  if (typeof valor === 'string') return `el texto "${valor}"`;
  return `${String(valor)} (${typeof valor})`;
}

function mensajeClaveAusente(ruta: string, clave: string): string {
  return (
    `[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
    '        Todas las claves de este fichero son obligatorias: no hay valores por\n' +
    '        defecto en el codigo a proposito, para que la heuristica sea siempre la\n' +
    `        que pone el fichero. Anade la linea "${clave}: <valor>" o restaura el\n` +
    '        fichero que trae el plugin.'
  );
}

function exigirNumero(numeros: Map<string, number>, clave: string, ruta: string): number {
  const valor = numeros.get(clave);
  if (valor === undefined) throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
  return valor;
}

function exigirLista(valor: string[] | undefined, clave: string, ruta: string): string[] {
  if (valor === undefined) throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
  return valor;
}

function exigirTexto(valor: string | undefined, clave: string, ruta: string): string {
  if (valor === undefined) throw new HeuristicaError(mensajeClaveAusente(ruta, clave));
  return valor;
}

/**
 * Puntua una tarea sumando las senales de la seccion 1 del YML. No hay
 * tope: una tarea con muchas senales debe poder salirse por arriba de
 * la escala.
 *
 * Se devuelve la lista de senales ademas de la suma porque el numero
 * solo no se puede discutir: quien vea "6 puntos" tiene que poder ver
 * de donde salieron sin releer la tarea.
 */
export function puntuarTarea(
  task: Task,
  body: string,
  h: Heuristica
): { puntos: number; senales: Senal[] } {
  const senales: Senal[] = [];
  const { objetivo, criterios } = extraerSecciones(body);

  // 1. Etiquetas MAS ALLA DE LA PRIMERA. La primera no puntua: toda
  //    tarea toca al menos un area y eso no la complica.
  const adicionales = Math.max(0, task.etiquetas.length - 1);
  if (adicionales > 0) {
    senales.push({
      clave: SENAL_ETIQUETAS,
      detalle: `${task.etiquetas.length} etiquetas (${adicionales} mas alla de la primera)`,
      puntos: adicionales * h.peso_etiqueta_adicional,
    });
  }

  // 2. Palabras de alto riesgo. UNA VEZ POR ENTRADA DISTINTA que
  //    aparezca en objetivo+criterios, sin importar cuantas veces
  //    aparece ni en que seccion (regla escrita en el YML). Por eso se
  //    normaliza el texto una vez y se recorre la LISTA, no el texto:
  //    recorrer el texto obligaria a deduplicar despues y es donde se
  //    cuela el conteo doble.
  const encontradas = palabrasDeRiesgoEncontradas(objetivo, criterios, h);
  for (const palabra of encontradas) {
    senales.push({
      clave: SENAL_PALABRA,
      detalle: palabra,
      puntos: h.peso_palabra_alto_riesgo,
    });
  }

  // 3. Cada dependencia declarada de otra tarea.
  if (task.dependencias.length > 0) {
    senales.push({
      clave: SENAL_DEPENDENCIA,
      detalle: `${task.dependencias.length} dependencias (${task.dependencias.join(', ')})`,
      puntos: task.dependencias.length * h.peso_dependencia,
    });
  }

  // 4. La tarea es de tipo release.
  if (task.tipo === 'release') {
    senales.push({ clave: SENAL_RELEASE, detalle: 'tipo release', puntos: h.peso_tipo_release });
  }

  // 5. Hotfix Y ADEMAS alguna palabra de riesgo. Un hotfix no puntua
  //    por serlo: urgencia no es complejidad. Lo que puntua es un
  //    hotfix que toca ademas terreno delicado.
  if (task.tipo === 'hotfix' && encontradas.length > 0) {
    senales.push({
      clave: SENAL_HOTFIX_RIESGO,
      detalle: `hotfix que toca ${encontradas.join(', ')}`,
      puntos: h.peso_tipo_hotfix_con_palabra_riesgo,
    });
  }

  // 6. Umbral de criterios. Se paga UNA sola vez, no por criterio.
  if (criterios.length >= h.umbral_criterios_aceptacion) {
    senales.push({
      clave: SENAL_CRITERIOS,
      detalle: `${criterios.length} criterios (umbral: ${h.umbral_criterios_aceptacion})`,
      puntos: h.peso_criterios_aceptacion,
    });
  }

  const puntos = senales.reduce((suma, s) => suma + s.puntos, 0);
  return { puntos, senales };
}

/**
 * Las entradas DISTINTAS de palabras_alto_riesgo que aparecen en el
 * texto, en el orden de la lista. Comparacion por subcadena (una
 * entrada corta cubre sus variantes: "migracion" cubre "migraciones"),
 * insensible a mayusculas y a acentos por ambos lados.
 *
 * AQUI ESTA LA REGLA DE CONTEO, y esta en la forma del bucle: se
 * recorre LA LISTA y se pregunta si cada entrada sale en el texto.
 * Recorrer el texto buscando coincidencias daria una por aparicion y
 * habria que deduplicar despues, que es donde se cuela el conteo
 * doble. Por eso el texto se junta antes en uno solo: que una entrada
 * salga en el objetivo Y en los criterios tampoco puede sumar dos
 * veces. La otra mitad de la garantia la pone validarListaDeTexto(),
 * que prohibe entradas repetidas en la propia lista.
 */
function palabrasDeRiesgoEncontradas(
  objetivo: string,
  criterios: readonly string[],
  h: Heuristica
): string[] {
  const texto = normalizarTexto([objetivo, ...criterios].join('\n'));
  const encontradas: string[] = [];
  for (const palabra of h.palabras_alto_riesgo) {
    if (texto.includes(normalizarTexto(palabra))) encontradas.push(palabra);
  }
  return encontradas;
}

/**
 * Traduce una puntuacion a un nivel de complejidad segun la seccion 2
 * del YML: cada `nivel_*_hasta` es el ultimo valor que TODAVIA cae en
 * ese nivel.
 *
 * `nivel_critica_desde` no aparece en la cascada porque
 * validarEscalaDeNiveles() exige que sea `nivel_alta_hasta + 1`, con
 * lo cual todo lo que pasa de alta es critica por construccion. Se
 * valida precisamente para que esa redundancia sea cierta: si algun
 * dia se quiere abrir un hueco entre alta y critica, esto habra que
 * reescribirlo, no tragarselo.
 */
export function nivelHeuristico(puntos: number, h: Heuristica): TaskComplexity {
  if (puntos <= h.nivel_trivial_hasta) return 'trivial';
  if (puntos <= h.nivel_simple_hasta) return 'simple';
  if (puntos <= h.nivel_media_hasta) return 'media';
  if (puntos <= h.nivel_alta_hasta) return 'alta';
  return 'critica';
}

/** El valor crudo de la tabla por nivel, sin la excepcion por tipo. */
function agentesPorNivel(nivel: TaskComplexity, h: Heuristica): number {
  switch (nivel) {
    case 'trivial':
      return h.agentes_brainstorm_trivial;
    case 'simple':
      return h.agentes_brainstorm_simple;
    case 'media':
      return h.agentes_brainstorm_media;
    case 'alta':
      return h.agentes_brainstorm_alta;
    case 'critica':
      return h.agentes_brainstorm_critica;
  }
}

/**
 * Cuantos agentes de brainstorm pide un (nivel, tipo).
 *
 * La excepcion de hotfix es un TOPE, NO UNA SUSTITUCION: el numero es
 * el MENOR entre lo que dice la tabla y `agentes_brainstorm_hotfix`.
 * La diferencia solo se ve en el extremo barato, y es justo donde
 * importa: un hotfix que puntua trivial se queda en 0 agentes, no sube
 * a 1. Seria absurdo que la clave que existe para ABREVIAR el
 * brainstorm acabase anadiendo un agente donde la tabla no pedia
 * ninguno.
 */
export function agentesBrainstorm(nivel: TaskComplexity, tipo: TaskType, h: Heuristica): number {
  const porNivel = agentesPorNivel(nivel, h);
  if (tipo === 'hotfix') return Math.min(porNivel, h.agentes_brainstorm_hotfix);
  return porNivel;
}

/**
 * El numero final de agentes para una tarea concreta, mas todo lo que
 * hace falta para explicarlo.
 *
 * Se toma el MAYOR entre lo que piden el nivel declarado y el
 * heuristico (ver la divergencia documentada en la cabecera del
 * modulo). El tope de hotfix va aplicado DENTRO de cada llamada a
 * agentesBrainstorm(), es decir ANTES del max — y el resultado sigue
 * topado, porque max(min(a,c), min(b,c)) === min(max(a,b), c): el
 * orden entre min y max no cambia el resultado. Se escribe asi, y no
 * al reves, porque cada uno de los dos numeros que se comparan tiene
 * que ser un numero de agentes valido POR SI MISMO; comparar dos
 * valores sin topar y topar al final funcionaria hoy por esa igualdad,
 * pero dejaria en el codigo dos numeros intermedios que no significan
 * nada.
 */
export function resolverNumeroAgentes(task: Task, body: string, h: Heuristica): ResolucionAgentes {
  const { puntos, senales } = puntuarTarea(task, body, h);
  const nivelDeclarado = task.complejidad;
  const nivelH = nivelHeuristico(puntos, h);

  const agentes = Math.max(
    agentesBrainstorm(nivelDeclarado, task.tipo, h),
    agentesBrainstorm(nivelH, task.tipo, h)
  );
  const sinTope = Math.max(agentesPorNivel(nivelDeclarado, h), agentesPorNivel(nivelH, h));

  return {
    agentes,
    nivelDeclarado,
    nivelHeuristico: nivelH,
    puntos,
    senales,
    hayDiscrepancia: nivelDeclarado !== nivelH,
    topeHotfixAplicado: agentes < sinTope,
  };
}
