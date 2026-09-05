/**
 * Parseo del flag --asignado-a, compartido por "plan" y "start"
 * (item B6 del checklist de terminacion). Vive aparte porque los dos
 * comandos lo necesitan identico y con los mismos mensajes de error, y
 * duplicarlo garantizaria que a la primera correccion divergieran.
 *
 * Por que un modulo y no un campo mas de parseNewTaskArgs: "new" y
 * "import" construyen una tarea NUEVA (asignado_a nace a null, seccion
 * 4 de la metodologia), mientras que aqui se MUTA una tarea existente
 * — y "no se paso el flag" tiene que poder distinguirse de "se paso
 * vacio", cosa que un valor por defecto no permite.
 *
 * DOS NOMBRES A PROPOSITO. El canonico es "--asignado-a", que es el
 * que usa la seccion 8.2 de la metodologia (congelada) al describir
 * este mismo flag sobre "plan". Pero "taskctl board" ya expone el
 * filtro equivalente como "--asignado_a", con guion bajo, porque asi
 * lo especifico el Objetivo de TASK-005 (igual al nombre del campo del
 * frontmatter). Esa inconsistencia es previa a B6 y no se puede
 * resolver sin romper una de las dos: se acepta el alias con guion
 * bajo tambien aqui, porque parseArgs IGNORA EN SILENCIO los flags
 * desconocidos (divergencia ya documentada en HALLAZGOS.md), asi que
 * un "taskctl plan TASK-001 --asignado_a carlos" sin el alias saldria
 * con codigo 0 sin haber asignado a nadie.
 */
import { parseArgs } from './args.js';

/** Nombre canonico del flag (seccion 8.2 de la metodologia). */
export const ASIGNADO_FLAG = 'asignado-a';
/** Alias aceptado, por coherencia con "taskctl board --asignado_a". */
export const ASIGNADO_FLAG_ALIAS = 'asignado_a';

/**
 * Coletilla para "plan" y "start" cuando el valor viene vacio: ahi el
 * flag ESCRIBE, asi que tiene sentido explicar como dejar una tarea sin
 * asignar. En "board", que solo filtra, sobraria.
 */
export const PISTA_VACIO_ESCRITURA =
  ' Para dejar la tarea sin asignar, omite el flag (se conserva el asignado_a actual) o ' +
  'edita "asignado_a: null" a mano en tarea.md.';

/**
 * Devuelve el valor de --asignado-a (o de su alias --asignado_a) ya
 * recortado, o undefined si no se paso ninguno de los dos — que NO es
 * lo mismo que asignarlo a null: sin flag, el comando conserva el
 * asignado_a que la tarea ya tuviera.
 *
 * `fail` construye el error a lanzar para que cada comando lance el
 * suyo (PlanCommandError / StartCommandError) y el despacho de errores
 * de cli.ts siga funcionando sin tocarlo.
 */
/**
 * Tope de longitud del valor. No es una regla de negocio sobre nombres
 * de persona: es que "asignado_a" se pinta como columna en el listado
 * de "taskctl board" y acaba dentro de docs/BOARD.md, que es un fichero
 * versionado. Un valor de 500 caracteres estira la fila a 500 columnas
 * y deja el tablero ilegible para todo el mundo (hallazgo MENOR de
 * revision por pares, B6). Antes de B6 hacia falta editar el
 * frontmatter a mano para conseguirlo; ahora seria un flag.
 */
export const ASIGNADO_MAX_LONGITUD = 64;

export function parseAsignadoAFlag(
  argv: readonly string[],
  fail: (message: string) => Error,
  /**
   * Coletilla opcional para el error de valor vacio. La usan "plan" y
   * "start", donde tiene sentido explicar como dejar una tarea sin
   * asignar; "board", que solo filtra, no la pasa.
   */
  pistaVacio = ''
): string | undefined {
  const { flags } = parseArgs(argv);
  const canonico = flags[ASIGNADO_FLAG];
  const alias = flags[ASIGNADO_FLAG_ALIAS];

  if (canonico !== undefined && alias !== undefined) {
    throw fail(
      `[ERROR] --${ASIGNADO_FLAG} y --${ASIGNADO_FLAG_ALIAS} son el mismo flag: pasa solo uno ` +
        `(el nombre canonico es --${ASIGNADO_FLAG}).`
    );
  }

  const raw = canonico !== undefined ? canonico : alias;
  if (raw === undefined) return undefined;

  // Un booleano significa "--asignado-a" suelto, sin valor detras. Sin
  // este rechazo, parseArgs lo devuelve como booleano y acabaria
  // escrito en el frontmatter como el string "true": una persona
  // llamada "true" asignada en silencio.
  if (typeof raw !== 'string') {
    throw fail(
      `[ERROR] --${ASIGNADO_FLAG} necesita un valor: --${ASIGNADO_FLAG} <persona> ` +
        `(o --${ASIGNADO_FLAG}=<persona> si el nombre empieza por "--").`
    );
  }

  const valor = raw.trim();
  if (valor === '') {
    throw fail(`[ERROR] --${ASIGNADO_FLAG} no puede estar vacio.${pistaVacio}`);
  }

  if (valor.length > ASIGNADO_MAX_LONGITUD) {
    throw fail(
      `[ERROR] --${ASIGNADO_FLAG} no puede pasar de ${ASIGNADO_MAX_LONGITUD} caracteres ` +
        `(recibidos ${valor.length}): el valor se pinta como columna en "taskctl board" y ` +
        'acaba dentro de docs/BOARD.md, que es un fichero versionado.'
    );
  }

  // Un salto de linea en el valor romperia el frontmatter YAML al
  // escribirlo (una linea "asignado_a: a\nb" deja de ser un mapa
  // valido y la tarea dejaria de poder leerse). Se rechaza en la
  // entrada en vez de producir un fichero corrupto.
  if (/[\r\n]/.test(valor)) {
    throw fail(
      `[ERROR] --${ASIGNADO_FLAG} no puede contener saltos de linea: romperia el frontmatter ` +
        'de tarea.md.'
    );
  }

  return valor;
}
