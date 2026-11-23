/**
 * `scripts/heuristica-complejidad.yml` — lectura, validacion y las
 * cuatro operaciones que ese fichero habilita: puntuar una tarea,
 * traducir la puntuacion a un nivel, mirar en la tabla cuantos agentes
 * de brainstorm pide ese nivel, y resolver el numero final para una
 * tarea concreta.
 *
 * Doctrina (la misma que config.ts):
 *
 * 1. FALLO CERRADO. Una clave desconocida, ausente, de tipo equivocado o un
 *    numero negativo ABORTAN; no hay defaults en codigo. El fichero lo
 *    distribuye el plugin: una clave que falta es un fichero roto o de otra
 *    version, no «usa lo de siempre».
 * 2. UN SOLO PARSER: parseBloqueClaveValor() de frontmatter.ts, con
 *    comentarios de linea (el fichero empieza por uno).
 * 3. UN SOLO PUNTO DE RESOLUCION: cargarHeuristica() devuelve la heuristica
 *    ya validada; ningun comando lee el fichero por su cuenta.
 *
 * La discrepancia entre el nivel heuristico y el declarado se resuelve sin
 * consultar a nadie (aprobado por Carlos el 2026-09-08): resolverNumeroAgentes()
 * se queda con el MAYOR de los dos numeros de agentes, la eleccion
 * conservadora, y la discrepancia sale en `ResolucionAgentes.hayDiscrepancia`
 * para quien orqueste. Consecuencia aceptada y fijada en un test: con
 * `nivel_trivial_hasta: 0` basta una senal para salir de `trivial`, asi que el
 * 0 roles de trivial es casi inalcanzable. La historia (las claves que quito
 * TASK-052, las mediciones sobre las tareas del repo) esta en git y en las
 * tareas, no aqui.
 *
 * E/S (TASK-148d, CORE2-21): core es puro salvo cargarHeuristica(), que lee el
 * YML del plugin. Esta aqui porque es el unico punto de resolucion (regla 3) y
 * todo lo demas del modulo (parsear, puntuar, resolver) es puro y se prueba sin
 * disco con parsearHeuristica().
 */
import { readFileSync } from 'node:fs';
import { parseBloqueClaveValor } from './frontmatter.js';
import { masParecida } from './sugerencia.js';
import { extraerSecciones, normalizarTexto } from './tarea-body.js';
import type { Task, TaskComplexity, TaskType } from './task.js';
import { rutaEnPlugin } from './raiz-plugin.js';
import { validarEnteroNoNegativo, validarListaDeTexto, type CrearError } from './campos-catalogo.js';

export class HeuristicaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HeuristicaError';
  }
}

/**
 * TASK-148d (CORE2-18): el tipo sale de CLAVES_NUMERICAS (antes cada clave se
 * escribia tres veces: aqui, en la lista y al construir el objeto).
 */
export type Heuristica = Record<ClaveNumerica, number> & { palabras_alto_riesgo: string[] };

/** Una senal encontrada al puntuar, para poder explicar el resultado. */
export interface Senal {
  clave: string;
  detalle: string;
  puntos: number;
}

export interface ResolucionAgentes {
  /** El numero FINAL de roles a lanzar. */
  agentes: number;
  /** null si la tarea no declara complejidad: entonces decide solo la heuristica. */
  nivelDeclarado: TaskComplexity | null;
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
] as const;
type ClaveNumerica = (typeof CLAVES_NUMERICAS)[number];

const CLAVE_PALABRAS = 'palabras_alto_riesgo';

/** Las unicas claves admitidas. Cualquier otra aborta (regla 1). */
export const CLAVES_HEURISTICA: readonly string[] = [...CLAVES_NUMERICAS, CLAVE_PALABRAS];

/**
 * Lo que se dice cuando el fichero no tiene las claves que este codigo
 * espera: casi siempre es que el YML y el codigo son de versiones
 * distintas del plugin (TASK-052 quito tres claves), no una errata.
 */
const AVISO_REINSTALAR =
  '        Si no lo has editado a mano, el fichero y taskctl son de versiones distintas\n' +
  '        del plugin: reinstala el plugin para que vuelvan a coincidir.';

/** Nombre del fichero dentro de `scripts/`. */
export const FICHERO_HEURISTICA = 'heuristica-complejidad.yml';

/** Claves de `Senal.clave`. Son la unica forma de agrupar las senales. */
export const SENAL_ETIQUETAS = 'etiquetas_adicionales';
export const SENAL_PALABRA = 'palabra_alto_riesgo';
export const SENAL_DEPENDENCIA = 'dependencias';
export const SENAL_RELEASE = 'tipo_release';
export const SENAL_HOTFIX_RIESGO = 'tipo_hotfix_con_palabra_riesgo';
export const SENAL_CRITERIOS = 'criterios_aceptacion';

/** Ruta dentro del plugin con rutaEnPlugin (core/raiz-plugin.ts: respeta CLAUDE_PLUGIN_ROOT). */
const errorHeuristica: CrearError = (m) => new HeuristicaError(m);

export function resolverRutaHeuristica(): string {
  return rutaEnPlugin('scripts', FICHERO_HEURISTICA);
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
      // Una lista VACIA se acepta (minimo 0): un proyecto puede no querer vocabulario de riesgo.
      palabras = validarListaDeTexto(donde, par.clave, par.valor, errorHeuristica, {
        detalle: 'Sin corchetes se leeria como UNA sola entrada con todo el texto dentro.',
      });
    } else {
      numeros.set(
        par.clave,
        validarEnteroNoNegativo(
          donde,
          par.clave,
          par.valor,
          errorHeuristica,
          'Un negativo restaria complejidad por tener una senal de mas, que es justo lo\ncontrario de lo que hace esta heuristica.'
        )
      );
    }
  }

  const h: Heuristica = {
    ...(Object.fromEntries(CLAVES_NUMERICAS.map((c) => [c, exigirNumero(numeros, c, ruta)])) as Record<ClaveNumerica, number>),
    palabras_alto_riesgo: exigirLista(palabras, CLAVE_PALABRAS, ruta),
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
  const sugerida = masParecida(clave, CLAVES_HEURISTICA);
  const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
  if (sugerida !== null) lineas.push(`        Quiza quisiste decir "${sugerida}".`);
  lineas.push('        Borrala o corrigela: taskctl no usa una heuristica que no entiende.');
  lineas.push(`        Claves validas: ${CLAVES_HEURISTICA.join(', ')}.`);
  lineas.push(AVISO_REINSTALAR);
  return lineas.join('\n');
}

function mensajeClaveAusente(ruta: string, clave: string): string {
  return (
    `[ERROR] ${ruta}: falta la clave obligatoria "${clave}".\n` +
    '        Todas las claves de este fichero son obligatorias: no hay valores por\n' +
    '        defecto en el codigo a proposito, para que la heuristica sea siempre la\n' +
    `        que pone el fichero. Anade la linea "${clave}: <valor>" o restaura el\n` +
    '        fichero que trae el plugin.\n' +
    AVISO_REINSTALAR
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

  // TASK-042 (decision C4): sin complejidad declarada decide SOLO la
  // heuristica. Antes `new` escribia `media` por defecto y ese valor
  // ganaba el maximo casi siempre: 2 roles + unificador para tareas que la
  // heuristica veia simples.
  const niveles = nivelDeclarado === null ? [nivelH] : [nivelDeclarado, nivelH];
  const agentes = Math.max(...niveles.map((n) => agentesBrainstorm(n, task.tipo, h)));
  const sinTope = Math.max(...niveles.map((n) => agentesPorNivel(n, h)));

  return {
    agentes,
    nivelDeclarado,
    nivelHeuristico: nivelH,
    puntos,
    senales,
    hayDiscrepancia: nivelDeclarado !== null && nivelDeclarado !== nivelH,
    topeHotfixAplicado: agentes < sinTope,
  };
}
