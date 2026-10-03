/**
 * `.taskcode/config.yml` — TASK-030, item C4 del checklist de
 * terminacion. Decision #9, resuelta el 2026-09-07: TRES claves, todas
 * opcionales, y ninguna mas.
 *
 * | clave                        | defecto           | quien la lee            |
 * |------------------------------|-------------------|-------------------------|
 * | rama_base                    | develop           | git.ts (feature/fix/release) |
 * | agente_revisor_por_defecto   | general-purpose   | new.ts, import.ts       |
 * | limite_wip                   | 1                 | wip.ts                  |
 * | comando_sincronizacion       | null (desactivada)| fs/sincronizacion.ts    |
 * | rutas_sincronizacion         | []                | fs/sincronizacion.ts    |
 * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
 *
 * Las tres de sincronizacion las anadio TASK-033 (version 0.1.1): un
 * proyecto que genera ficheros a partir del estado de las tareas (un
 * plan, un tablero) los tenia desincronizados tras cada transicion, y
 * el arreglo obvio —un hook de pre-commit— deja el indice sucio porque
 * autoCommit commitea en modo `--only`. Van juntas: comando y rutas, o
 * ninguna; el timeout solo con las otras dos.
 *
 * Lo que importa aqui no es el fichero, es la forma del mecanismo —
 * es lo que decide si anadir la cuarta clave cuesta una linea o una
 * arqueologia:
 *
 * 1. SIN FICHERO, COMPORTAMIENTO IDENTICO AL DE HOY. CONFIG_DEFAULTS
 *    es literalmente lo que el codigo hacia antes de C4, asi que el
 *    cambio es no-breaking y los tests que ya existian siguen valiendo
 *    de red de regresion sin tocar ninguno.
 * 2. FALLO CERRADO. Un valor invalido o una clave desconocida ABORTAN.
 *    Nunca caida al default en silencio: con default silencioso el
 *    repo dice 2, el plugin usa 1 y no se entera nadie. Misma doctrina
 *    que el flag 'wx' de plan.ts y que el parser de veredictos de
 *    finish.ts.
 * 3. UN SOLO PARSER. El bucle `clave: valor` es el de frontmatter.ts,
 *    extraido a parseBloqueClaveValor(). Aqui no hay ni una linea de
 *    parseo de YAML.
 * 4. UN SOLO PUNTO DE RESOLUCION. resolverConfig(cwd) devuelve el
 *    objeto con los defaults ya aplicados. Ningun comando lee el
 *    fichero por su cuenta.
 * 5. NINGUNA CLAVE QUE NADIE LEA. `remoto`, `rama_principal`,
 *    `politica_no_borrar_ramas` y las palabras clave de la heuristica
 *    de complejidad estan DESCARTADAS en la decision #9 y no se
 *    declaran. Una clave escribible que no hace nada es peor que no
 *    tenerla: este proyecto ya se quemo con `codex-review`,
 *    documentado en la maquina de estados e inexistente.
 *
 * La estrictez con las claves desconocidas es segura porque la §7.3 de
 * la metodologia garantiza que todo el equipo corre la misma version
 * del plugin: no hay un escenario de "clave nueva leida por un plugin
 * viejo" que justifique tragarsela.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseBloqueClaveValor } from './frontmatter.js';
export class ConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigError';
    }
}
/**
 * El comportamiento de hoy, escrito una sola vez. Antes de C4 estos
 * tres valores vivian: 'develop' literal en git.ts, 'general-purpose'
 * DUPLICADO en new.ts e import.ts, y el 1 implicito en el
 * `bloqueantes.length > 0` de start.ts. Ahora esta es su unica fuente.
 */
export const CONFIG_DEFAULTS = Object.freeze({
    rama_base: 'develop',
    agente_revisor_por_defecto: 'general-purpose',
    limite_wip: 1,
    comando_sincronizacion: null,
    rutas_sincronizacion: Object.freeze([]),
    timeout_sincronizacion: 60,
});
/** Las unicas claves admitidas. Cualquier otra aborta (regla 2). */
export const CLAVES_CONFIG = [
    'rama_base',
    'agente_revisor_por_defecto',
    'limite_wip',
    'comando_sincronizacion',
    'rutas_sincronizacion',
    'timeout_sincronizacion',
];
/**
 * Carpetas raiz donde una ruta de sincronizacion no puede vivir: las
 * gestiona taskctl (tareas/, .taskcode/) o Git (.git/). Declarar algo
 * ahi haria que el comando del proyecto y el CLI escribieran lo mismo.
 */
const RAICES_PROHIBIDAS_SINCRONIZACION = ['tareas', '.taskcode', '.git'];
export const CONFIG_DIR = '.taskcode';
export const CONFIG_FILE = 'config.yml';
/**
 * Raiz del repo: se sube desde `cwd` hasta encontrar un `.git`
 * (directorio en un clon normal, fichero en un worktree o submodulo).
 * Si no hay ninguno, se usa `cwd` tal cual.
 *
 * Por que la raiz y no el cwd a secas: la configuracion es DEL REPO, y
 * "taskctl board" ejecutado desde `docs/` tiene que ver la misma que
 * ejecutado desde la raiz. Lo contrario haria que el limite de WIP o
 * la rama base cambiaran segun desde donde escribes, que es justo la
 * clase de comportamiento que nadie diagnostica.
 *
 * Por que se PARA en el `.git` y no se sigue subiendo: si se siguiera,
 * un `.taskcode/config.yml` olvidado en el home configuraria en
 * silencio todos los repos de la maquina. Una sola ubicacion canonica
 * por repo, o ninguna.
 *
 * No se usa `git rev-parse --show-toplevel` a proposito: obligaria a
 * config.ts a importar fs/git.ts, que a su vez importa este modulo
 * (ciclo), y a pagar un spawn de git por resolucion.
 */
export function raizDelRepo(cwd) {
    let dir = path.resolve(cwd);
    for (;;) {
        if (existsSync(path.join(dir, '.git')))
            return dir;
        const padre = path.dirname(dir);
        if (padre === dir)
            return path.resolve(cwd);
        dir = padre;
    }
}
/** Ruta canonica del fichero de configuracion para ese cwd. */
export function rutaConfig(cwd) {
    return path.join(raizDelRepo(cwd), CONFIG_DIR, CONFIG_FILE);
}
/**
 * EL punto de resolucion (regla 4). Devuelve la configuracion con los
 * defaults ya aplicados, o lanza ConfigError.
 *
 * Casos de "no hay configuracion", que devuelven los defaults sin
 * quejarse: no existe `.taskcode/`, existe `.taskcode/` pero sin
 * `config.yml` (ENOENT en ambos), y `config.yml` vacio o con solo
 * comentarios (ninguna clave = todas por defecto). Un fichero vacio es
 * una forma legitima de decir "todo por defecto"; tratarlo como error
 * castigaria a quien deja el fichero preparado para llenarlo luego.
 *
 * CUALQUIER otro fallo de lectura (permisos, `.taskcode` que resulta
 * ser un fichero, `config.yml` que resulta ser un directorio) SI
 * aborta: son configuraciones rotas, no configuraciones ausentes, y
 * tragarselas seria exactamente la caida al default en silencio que la
 * regla 2 prohibe.
 *
 * Es sincrona porque resolveBaseBranchForTipo lo es, y ese es su
 * consumidor principal. No cachea: el coste es un readFileSync por
 * comando y una cache introduciria estado global compartido entre
 * tests.
 */
export function resolverConfig(cwd) {
    const ruta = rutaConfig(cwd);
    let contenido;
    try {
        contenido = readFileSync(ruta, 'utf8');
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            // ENOENT no basta para concluir "no hay configuracion": si
            // `.taskcode` resulta ser un FICHERO, leer `.taskcode/config.yml`
            // falla con ENOTDIR en POSIX pero con ENOENT en Windows, y ahi
            // caiamos al default en silencio contradiciendo lo que dice el
            // comentario de arriba (hallazgo MENOR de la revision por pares,
            // TASK-030). Es la misma trampa que costo una ronda entera en
            // TASK-027: un fix de errno validado en una sola plataforma no
            // esta validado. Por eso se le pregunta al sistema de ficheros,
            // que contesta igual en las dos.
            const dir = path.dirname(ruta);
            let esDirectorio;
            try {
                esDirectorio = statSync(dir).isDirectory();
            }
            catch {
                // `.taskcode` no existe: no hay configuracion, que es legitimo.
                return { ...CONFIG_DEFAULTS };
            }
            if (!esDirectorio) {
                throw new ConfigError(`[ERROR] "${dir}" existe pero no es una carpeta, asi que ahi no puede haber ` +
                    'ninguna configuracion.\n' +
                    '        Renombralo o borralo: taskctl no sigue con una configuracion que no ' +
                    'puede leer.');
            }
            // `.taskcode/` existe y no tiene config.yml: todo por defecto.
            return { ...CONFIG_DEFAULTS };
        }
        const msg = e instanceof Error ? e.message : String(e);
        throw new ConfigError(`[ERROR] No se pudo leer la configuracion "${ruta}": ${msg}\n` +
            '        Borrala o arregla sus permisos: taskctl no sigue sin saber que dice.');
    }
    const config = parsearConfig(contenido, ruta);
    // Lo unico de las rutas de sincronizacion que necesita disco: que
    // ninguna sea una carpeta existente. Con una carpeta, el
    // `git add -A -- <ruta>` acotado se convierte en un barrido de todo
    // lo que haya debajo, incluido trabajo de la persona.
    const raiz = raizDelRepo(cwd);
    for (const r of config.rutas_sincronizacion) {
        let esCarpeta = false;
        try {
            esCarpeta = statSync(path.join(raiz, r)).isDirectory();
        }
        catch {
            // No existe (todavia): legitimo, la creara el comando.
        }
        if (esCarpeta) {
            throw new ConfigError(`[ERROR] ${ruta}: la ruta de sincronizacion "${r}" es una carpeta.\n` +
                '        Declara los ficheros concretos que regenera el comando: con una carpeta, ' +
                'el commit automatico se llevaria todo lo que hay dentro.');
        }
    }
    return config;
}
/**
 * Separada de resolverConfig para poder probar el parseo y la
 * validacion sin disco, y para que el mensaje de error siempre pueda
 * nombrar el fichero de donde salio el problema.
 */
export function parsearConfig(contenido, ruta) {
    const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
        etiqueta: 'config',
        crearError: (mensaje) => new ConfigError(`[ERROR] ${ruta}: ${mensaje}`),
        permitirComentariosDeLinea: true,
    });
    const config = { ...CONFIG_DEFAULTS };
    const vistas = new Set();
    for (const par of pares) {
        const donde = `${ruta}:${par.numeroLinea}`;
        if (!CLAVES_CONFIG.includes(par.clave)) {
            throw new ConfigError(mensajeClaveDesconocida(donde, par.clave));
        }
        // Una clave repetida se pisaria en silencio (el ultimo gana) y el
        // fichero diria una cosa mientras el plugin usa otra: mismo dano
        // que un default silencioso, misma respuesta.
        if (vistas.has(par.clave)) {
            throw new ConfigError(`[ERROR] ${donde}: la clave "${par.clave}" esta repetida.\n` +
                '        Deja solo una: con dos, el fichero dice una cosa y taskctl usaria otra.');
        }
        vistas.add(par.clave);
        switch (par.clave) {
            case 'rama_base':
                config.rama_base = validarTextoNoVacio(donde, par.clave, par.valor);
                break;
            case 'agente_revisor_por_defecto':
                config.agente_revisor_por_defecto = validarTextoNoVacio(donde, par.clave, par.valor);
                break;
            case 'limite_wip':
                config.limite_wip = validarEnteroPositivo(donde, par.clave, par.valor);
                break;
            case 'comando_sincronizacion':
                config.comando_sincronizacion = validarComando(donde, par.valor);
                break;
            case 'rutas_sincronizacion':
                config.rutas_sincronizacion = validarRutasSincronizacion(donde, par.valor);
                break;
            case 'timeout_sincronizacion':
                config.timeout_sincronizacion = validarEnteroPositivo(donde, par.clave, par.valor);
                break;
        }
    }
    validarSincronizacionCompleta(ruta, vistas);
    return config;
}
/**
 * Las claves de sincronizacion van juntas. Un comando sin rutas
 * declaradas no puede commitear nada (todo lo que tocara serian rutas
 * ajenas), y unas rutas sin comando no las regenera nadie: las dos
 * mitades sueltas son configuraciones que parecen hacer algo y no lo
 * hacen. El timeout solo sin comando, igual.
 */
function validarSincronizacionCompleta(ruta, vistas) {
    const comando = vistas.has('comando_sincronizacion');
    const rutas = vistas.has('rutas_sincronizacion');
    if (comando !== rutas) {
        const presente = comando ? 'comando_sincronizacion' : 'rutas_sincronizacion';
        const falta = comando ? 'rutas_sincronizacion' : 'comando_sincronizacion';
        throw new ConfigError(`[ERROR] ${ruta}: "${presente}" necesita tambien "${falta}".\n` +
            '        Van juntas: el comando que regenera los ficheros y la lista de ficheros que ' +
            'regenera. Anade la que falta o borra las dos.');
    }
    if (vistas.has('timeout_sincronizacion') && !comando) {
        throw new ConfigError(`[ERROR] ${ruta}: "timeout_sincronizacion" sin "comando_sincronizacion" no hace nada.\n` +
            '        Borrala, o configura tambien el comando y sus rutas.');
    }
}
/** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
function validarComando(donde, valor) {
    if (typeof valor !== 'string' || valor.trim() === '') {
        throw new ConfigError(`[ERROR] ${donde}: "comando_sincronizacion" debe ser un comando (texto no vacio), ` +
            `y es ${describirValor(valor)}.\n` +
            '        Ejemplo: comando_sincronizacion: "node scripts/sincronizar-plan.mjs". ' +
            'Si lleva "#", entrecomillalo entero.');
    }
    return valor.trim();
}
/**
 * Lista flow de FICHEROS relativos a la raiz del repo. Se valida aqui,
 * al cargar, y no al commitear: para entonces la tarea ya se ha movido
 * y el comando ya se ha ejecutado, y un error tardio deja el workspace
 * a medias (hallazgo del rol de riesgos en el brainstorm de TASK-033).
 * normalizarRuta() en git-commit.ts sigue siendo la segunda barrera.
 *
 * Que la ruta no sea una carpeta no se puede saber sin disco: lo
 * comprueba resolverConfig, que si lo tiene.
 */
function validarRutasSincronizacion(donde, valor) {
    if (!Array.isArray(valor) || valor.length === 0) {
        throw new ConfigError(`[ERROR] ${donde}: "rutas_sincronizacion" debe ser una lista no vacia entre corchetes, ` +
            `y es ${describirValor(valor)}.\n` +
            '        Ejemplo: rutas_sincronizacion: [docs/PLAN.md]. Las listas en bloque ' +
            '("- ruta") no se admiten.');
    }
    const rutas = [];
    for (const elemento of valor) {
        if (typeof elemento !== 'string' || elemento.trim() === '') {
            throw new ConfigError(`[ERROR] ${donde}: "rutas_sincronizacion" contiene un elemento vacio o que no es texto.`);
        }
        const original = elemento.trim();
        const motivo = motivoRutaInvalida(original);
        if (motivo !== null) {
            throw new ConfigError(`[ERROR] ${donde}: la ruta de sincronizacion "${original}" no vale: ${motivo}.\n` +
                '        Solo ficheros, relativos a la raiz del repo, fuera de tareas/, .taskcode/ ' +
                'y .git/.');
        }
        const normalizada = path.posix.normalize(original.replace(/\\/g, '/'));
        if (!rutas.includes(normalizada))
            rutas.push(normalizada);
    }
    return rutas;
}
/** null si la ruta es aceptable; si no, el motivo en palabras de persona. */
function motivoRutaInvalida(original) {
    const conBarras = original.replace(/\\/g, '/');
    if (conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras))
        return 'es absoluta';
    if (conBarras.endsWith('/'))
        return 'es una carpeta';
    const normalizada = path.posix.normalize(conBarras);
    if (normalizada === '.' || normalizada === '')
        return 'es la raiz del repo';
    if (normalizada === '..' || normalizada.startsWith('../'))
        return 'se sale del repo';
    const primera = normalizada.split('/')[0];
    if (RAICES_PROHIBIDAS_SINCRONIZACION.includes(primera)) {
        return `esta bajo ${primera}/, que no es del proyecto sino de la herramienta`;
    }
    return null;
}
/**
 * Enumera SIEMPRE las claves validas (criterio de la decision #9: el
 * mensaje dice que esta mal y cuales son las validas) y, si la escrita
 * se parece mucho a una de ellas, la propone. El caso motivador es
 * literal: `limite_wp`.
 */
function mensajeClaveDesconocida(donde, clave) {
    const sugerida = claveMasParecida(clave);
    const lineas = [`[ERROR] ${donde}: clave desconocida "${clave}".`];
    if (sugerida !== null)
        lineas.push(`        Quiza quisiste decir "${sugerida}".`);
    lineas.push(`        Claves validas: ${CLAVES_CONFIG.join(', ')}.`);
    return lineas.join('\n');
}
/** Distancia de edicion (Levenshtein) a mano — cero dependencias, como el resto. */
function distanciaEdicion(a, b) {
    let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        const actual = [i];
        for (let j = 1; j <= b.length; j++) {
            const coste = a[i - 1] === b[j - 1] ? 0 : 1;
            actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
        }
        previa = actual;
    }
    return previa[b.length];
}
/** La clave valida mas cercana, si esta lo bastante cerca como para ser una errata. */
function claveMasParecida(clave) {
    let mejor = null;
    let mejorDistancia = Number.POSITIVE_INFINITY;
    for (const valida of CLAVES_CONFIG) {
        const d = distanciaEdicion(clave.toLowerCase(), valida);
        if (d < mejorDistancia) {
            mejorDistancia = d;
            mejor = valida;
        }
    }
    // Umbral: hasta un tercio de la clave. Sin el, "foo" propondria
    // "rama_base" y el consejo dejaria de valer nada.
    return mejorDistancia <= Math.max(1, Math.floor(clave.length / 3)) ? mejor : null;
}
/**
 * Texto no vacio. Se guarda RECORTADO: `rama_base: " develop "` es
 * develop, no " develop " — misma doctrina que personaDeTarea en
 * wip.ts, donde un valor entrecomillado con espacios ya provoco un
 * hallazgo de revision por pares.
 *
 * No se valida que `rama_base` sea un nombre de rama legal: esa regla
 * la tiene Git (y isValidBranchName la consulta preguntandoselo a el).
 * Reimplementarla aqui crearia una segunda fuente de verdad que
 * podria rechazar ramas que Git acepta.
 */
function validarTextoNoVacio(donde, clave, valor) {
    if (valor === null) {
        throw new ConfigError(`[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
            `        O le das un valor, o borras la linea (por defecto: ` +
            `"${CONFIG_DEFAULTS[clave]}").`);
    }
    if (typeof valor !== 'string') {
        throw new ConfigError(`[ERROR] ${donde}: "${clave}" debe ser texto, y es ${describirValor(valor)}.`);
    }
    const recortado = valor.trim();
    if (recortado === '') {
        throw new ConfigError(`[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
            `        O le das un valor, o borras la linea (por defecto: ` +
            `"${CONFIG_DEFAULTS[clave]}").`);
    }
    return recortado;
}
/** Entero >= 1. Un limite de 0 no es "sin limite": es "no se puede trabajar". */
function validarEnteroPositivo(donde, clave, valor) {
    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
        const consecuencia = clave === 'limite_wip'
            ? 'Un 0 o un negativo no significan "sin limite": impedirian arrancar cualquier tarea.'
            : 'Son segundos: un 0 o un negativo matarian el comando antes de empezar.';
        throw new ConfigError(`[ERROR] ${donde}: "${clave}" debe ser un numero entero mayor o igual que 1, ` +
            `y es ${describirValor(valor)}.\n` +
            `        Por defecto es ${CONFIG_DEFAULTS[clave]}. ${consecuencia}`);
    }
    return valor;
}
/** Como se nombra un valor rechazado en un mensaje de error. */
function describirValor(valor) {
    if (valor === null)
        return 'un valor vacio';
    if (Array.isArray(valor))
        return `una lista (${JSON.stringify(valor)})`;
    if (typeof valor === 'string')
        return `el texto "${valor}"`;
    return `${String(valor)} (${typeof valor})`;
}
