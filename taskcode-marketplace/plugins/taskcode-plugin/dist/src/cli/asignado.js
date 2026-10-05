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
 * bajo tambien aqui, porque parseArgs IGNORABA EN SILENCIO los flags
 * desconocidos, asi que un "taskctl plan TASK-001 --asignado_a carlos"
 * sin el alias salia con codigo 0 sin haber asignado a nadie. Desde
 * TASK-047 un flag desconocido aborta (rechazarFlagsDesconocidos), pero
 * el alias se conserva: quitarlo romperia a quien ya lo usa.
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
export const PISTA_VACIO_ESCRITURA = ' Omitir el flag NO desasigna: conserva a quien estuviera y, si no habia nadie, pone la ' +
    'identidad de "git config user.email" (TASK-024). Hoy no hay forma de dejar una tarea sin ' +
    'asignar desde el CLI: editar "asignado_a: null" a mano tampoco basta, porque el siguiente ' +
    'plan o start volveria a rellenarlo con tu identidad.';
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
/**
 * Reglas que debe cumplir CUALQUIER valor que acabe en el campo
 * "asignado_a", venga del flag o de la identidad Git. Devuelve el
 * motivo por el que no vale, o null si vale.
 *
 * Extraida de parseAsignadoAFlag por un hallazgo CRITICO de revision
 * por pares (TASK-024): la identidad Git entraba por otra puerta y no
 * pasaba por ninguna de estas comprobaciones. Un
 * "git config user.email" con un salto de linea dentro producia un
 * tarea.md con una clave INYECTADA que pisaba "estado", dejando la
 * tarea fisicamente en 01-en-diseno pero declarandose "terminada" — y
 * ladrillada, porque ningun comando aceptaba ya ese estado. Exit 0 y
 * sin un solo aviso.
 */
export function motivoValorInvalido(bruto) {
    const valor = bruto.trim();
    if (valor === '')
        return 'no puede estar vacio';
    if (valor.length > ASIGNADO_MAX_LONGITUD) {
        return (`no puede pasar de ${ASIGNADO_MAX_LONGITUD} caracteres (recibidos ${valor.length}): ` +
            'el valor se pinta como columna en "taskctl board" y acaba dentro de docs/BOARD.md, ' +
            'que es un fichero versionado');
    }
    // Un salto de linea romperia el frontmatter YAML al escribirlo (una
    // linea "asignado_a: a\nb" deja de ser un mapa valido) y, peor,
    // permite inyectar claves nuevas que pisan las de verdad.
    if (/[\r\n]/.test(valor)) {
        return 'no puede contener saltos de linea: romperia el frontmatter de tarea.md';
    }
    return null;
}
/**
 * Filtra la identidad Git antes de usarla como asignado_a (TASK-024).
 * A diferencia del flag, una identidad invalida NO aborta el comando:
 * quien ejecuta no ha pedido nada raro, es su configuracion de Git la
 * que no sirve para esto. Se ignora (la tarea queda como estuviera) y
 * se devuelve un aviso para que el CLI lo saque por stderr, en vez de
 * corromper el fichero o de plantarle un error en la cara por algo que
 * no ha hecho en este comando.
 */
export function identidadUsable(bruto) {
    if (bruto === null)
        return { identidad: null, aviso: null };
    const problema = motivoValorInvalido(bruto);
    if (problema === null)
        return { identidad: bruto.trim(), aviso: null };
    return {
        identidad: null,
        aviso: `tu "git config user.email" ${problema}, asi que no se usa para asignar la tarea. ` +
            `Corrigelo, o asigna a mano con --${ASIGNADO_FLAG}.`,
    };
}
export function parseAsignadoAFlag(argv, fail, 
/**
 * Coletilla opcional para el error de valor vacio. La usan "plan" y
 * "start", donde tiene sentido explicar como dejar una tarea sin
 * asignar; "board", que solo filtra, no la pasa.
 */
pistaVacio = '') {
    const { flags } = parseArgs(argv);
    const canonico = flags[ASIGNADO_FLAG];
    const alias = flags[ASIGNADO_FLAG_ALIAS];
    if (canonico !== undefined && alias !== undefined) {
        throw fail(`[ERROR] --${ASIGNADO_FLAG} y --${ASIGNADO_FLAG_ALIAS} son el mismo flag: pasa solo uno ` +
            `(el nombre canonico es --${ASIGNADO_FLAG}).`);
    }
    const raw = canonico !== undefined ? canonico : alias;
    if (raw === undefined)
        return undefined;
    // Un booleano significa "--asignado-a" suelto, sin valor detras. Sin
    // este rechazo, parseArgs lo devuelve como booleano y acabaria
    // escrito en el frontmatter como el string "true": una persona
    // llamada "true" asignada en silencio.
    if (typeof raw !== 'string') {
        throw fail(`[ERROR] --${ASIGNADO_FLAG} necesita un valor: --${ASIGNADO_FLAG} <persona> ` +
            `(o --${ASIGNADO_FLAG}=<persona> si el nombre empieza por "--").`);
    }
    const problema = motivoValorInvalido(raw);
    if (problema !== null) {
        // pistaVacio solo tiene sentido en el caso del valor vacio: en los
        // demas, "omite el flag" no es la salida.
        const pista = raw.trim() === '' ? pistaVacio : '';
        throw fail(`[ERROR] --${ASIGNADO_FLAG} ${problema}.${pista}`);
    }
    return raw.trim();
}
