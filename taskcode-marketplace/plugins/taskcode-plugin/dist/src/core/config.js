/**
 * `.taskcode/config.yml` — TASK-030, item C4 del checklist de
 * terminacion. Decision #9, resuelta el 2026-09-07: TRES claves, todas
 * opcionales, y ninguna mas.
 *
 * | clave                        | defecto           | quien la lee            |
 * |------------------------------|-------------------|-------------------------|
 * | rama_base                    | develop           | git.ts: start, review, finish |
 * | agente_revisor_por_defecto   | general-purpose   | new.ts, import.ts       |
 * | limite_wip                   | 1                 | wip.ts                  |
 * | comando_sincronizacion       | null (desactivada)| fs/sincronizacion.ts    |
 * | rutas_sincronizacion         | []                | fs/sincronizacion.ts    |
 * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
 * | excluir_de_revision          | dist, locks, tareas | commands/review.ts    |
 * | contexto_revision            | []                | commands/review.ts    |
 * | modo_flujo                   | manual            | core/flujo.ts, plan.ts, approve.ts |
 * | cierre_por_defecto           | merge             | siguiente.ts -> skill finish (modo automatico) |
 * | plataforma_remota            | null (por host)   | commands/finish-opciones.ts (--merge-request) |
 * | url_base_remoto              | null              | commands/finish-opciones.ts (--merge-request) |
 * | comando_verificacion         | null (sin freno)  | commands/doctor.ts (y los frenos, TASK-071/072) |
 * | timeout_verificacion         | 600 (segundos)    | los frenos (TASK-071/072)  |
 * | comando_verificacion_selectiva | null (sin selectiva) | hooks/freno-stop.ts, commands/review.ts (TASK-091) |
 * | timeout_verificacion_selectiva | 600 (segundos)  | hooks/freno-stop.ts, commands/review.ts (TASK-091) |
 * | comando_heldout              | null (sin held-out) | commands/finish-heldout.ts (TASK-073) |
 * | informe_cobertura            | null (sin freno)  | commands/review.ts, finish-cobertura.ts (TASK-074) |
 * | umbral_cobertura             | null (solo informa) | commands/finish-cobertura.ts (TASK-074) |
 * | rutas_documentacion          | [] (sin efecto)   | finish-verificacion.ts (TASK-100), hooks/guardia-merge.ts (TASK-101) |
 * | comando_verificacion_documentacion | null        | finish-verificacion.ts (TASK-100), guardia-merge.ts (TASK-101) |
 *
 * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
 * TASK-100: si todo lo que cambia la tarea frente a la base cae en esas rutas
 * (patrones `git :(glob)`, sin anclar: `*.md` es solo la raiz), `finish` no
 * corre `comando_verificacion`, solo la comprobacion de documentacion si se
 * declara. Las rutas se leen de la config de la RAMA BASE (la rama no puede
 * ampliarlas para eximirse). Exigen `comando_verificacion`: sin el no hay nada
 * que ahorrar.
 *
 * `comando_verificacion` y `timeout_verificacion` las anadio TASK-070: declaran
 * como se verifica el proyecto (el comando de tests del repo) para que los
 * frenos de verificacion ejecuten ESE comando y nunca uno inventado. Mismo
 * patron que la pareja de sincronizacion: el timeout solo con el comando. Sin
 * la clave no hay freno y todo se comporta como antes.
 *
 * `comando_verificacion_selectiva` y su timeout las anadio TASK-091: una
 * verificacion rapida, por impacto, que deciden el hook Stop y las rondas de
 * `review`; recibe la rama base en la variable RAMA_BASE. La completa
 * (`comando_verificacion`) sigue siendo la puerta de `finish` y del guardian
 * de merges, asi que la selectiva sin la completa ABORTA: dejaria el proyecto
 * sin puerta y sin que nadie lo viera.
 *
 * `excluir_de_revision` la anadio TASK-034: la peticion de revision
 * embebia el diff entero, y el JS compilado, los lockfiles y la propia
 * carpeta de tareas eran el 27 % de sus bytes. Sus patrones siguen la
 * semantica de `git :(glob)` (los interpreta Git, no `path.matchesGlob`
 * como `patrones_archivo` de los revisores).
 *
 * `plataforma_remota` y `url_base_remoto` las anadio TASK-061: declaran la
 * plataforma del remoto (`github` | `gitlab`) y, solo con gitlab, la URL base
 * de la instancia, para que `finish --merge-request` funcione con cualquier
 * GitLab (dominio propio o bajo una ruta). Se validan JUNTAS aqui (la url sin
 * plataforma, con github, con usuario o sin https aborta); que la base sea
 * prefijo de la URL de origin necesita Git y lo comprueba quien la usa
 * (core/plataforma-remota.ts). Sin ninguna de las dos rige la deteccion por
 * host de la 0.6.0.
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
 * 2. FALLO CERRADO en los VALORES. Un valor invalido ABORTA. Nunca caida
 *    al default en silencio: con default silencioso el repo dice 2, el
 *    plugin usa 1 y no se entera nadie. Misma doctrina que el flag 'wx'
 *    de plan.ts y que el parser de veredictos de finish.ts. Una clave
 *    DESCONOCIDA, en cambio, AVISA y se ignora (TASK-061): con el repo
 *    publico, una clave que anade una version nueva no puede dejar sin
 *    `taskctl` a quien tenga una anterior. El aviso se emite una vez por
 *    proceso (resolverConfig se llama muchas veces por comando) y nombra
 *    la clave parecida, que es lo que cubre la errata (`limite_wp`).
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
 * Antes de TASK-061 las claves desconocidas abortaban, apoyandose en que la
 * §7.3 de la metodologia garantiza la misma version del plugin en todo el
 * equipo. Con el plugin distribuido a proyectos ajenos esa garantia no
 * existe, y se pasa a avisar (decision de Carlos, 2026-10-08).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { parseBloqueClaveValor } from './frontmatter.js';
import { distanciaEdicion, masParecida } from './sugerencia.js';
import { normalizarBase } from './plataforma-remota.js';
import { STATE_FOLDER } from './task.js';
export class ConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigError';
    }
}
export const PLATAFORMAS_REMOTAS = ['github', 'gitlab'];
export const MODOS_FLUJO = ['manual', 'semiautomatico', 'automatico'];
export const CIERRES_POR_DEFECTO = ['merge', 'merge-request'];
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
    excluir_de_revision: Object.freeze([
        '**/dist/**',
        '**/*.lock',
        '**/*-lock.*',
        'tareas/**',
    ]),
    contexto_revision: Object.freeze([]),
    modo_flujo: 'manual',
    cierre_por_defecto: 'merge',
    plataforma_remota: null,
    url_base_remoto: null,
    comando_verificacion: null,
    timeout_verificacion: 600,
    comando_verificacion_selectiva: null,
    timeout_verificacion_selectiva: 600,
    comando_heldout: null,
    informe_cobertura: null,
    umbral_cobertura: null,
    rutas_documentacion: Object.freeze([]),
    comando_verificacion_documentacion: null,
});
/** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
export const CLAVES_CONFIG = [
    'rama_base',
    'agente_revisor_por_defecto',
    'limite_wip',
    'comando_sincronizacion',
    'rutas_sincronizacion',
    'timeout_sincronizacion',
    'excluir_de_revision',
    'contexto_revision',
    'modo_flujo',
    'cierre_por_defecto',
    'plataforma_remota',
    'url_base_remoto',
    'comando_verificacion',
    'timeout_verificacion',
    'comando_verificacion_selectiva',
    'timeout_verificacion_selectiva',
    'comando_heldout',
    'informe_cobertura',
    'umbral_cobertura',
    'rutas_documentacion',
    'comando_verificacion_documentacion',
];
/**
 * Carpetas raiz donde una ruta de sincronizacion no puede vivir: las
 * gestiona taskctl (tareas/, .taskcode/) o Git (.git/). Declarar algo
 * ahi haria que el comando del proyecto y el CLI escribieran lo mismo.
 *
 * Excepcion (TASK-092): un fichero suelto directamente en la raiz de
 * tareas/ (p. ej. tareas/ROADMAP.md). Fuera de las carpetas de estado
 * (tareas/0N-*) taskctl solo escribe un fichero, tareas/ROADMAP.md
 * (TASK-098), y solo si lleva su marca o nunca ha existido; si el
 * proyecto lo declara aqui, taskctl no lo toca (fs/roadmap.ts), asi que
 * tampoco hay choque posible.
 * La comparacion no distingue mayusculas: en Windows y macOS `Tareas/` y
 * `.GIT/` son las mismas carpetas.
 */
const RAICES_PROHIBIDAS_SINCRONIZACION = ['tareas', '.taskcode', '.git'];
/** Nombres de las carpetas de estado, en minusculas, para compararlos sin distinguir mayusculas. */
const CARPETAS_DE_ESTADO = Object.values(STATE_FOLDER).map((c) => c.toLowerCase());
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
    return resolverConfigInterno(cwd, emitirAvisos);
}
/**
 * Lo mismo que resolverConfig pero sin tocar stderr: los avisos (claves
 * desconocidas) se devuelven. Lo usa `taskctl doctor`, que los muestra en su
 * propia salida. Un solo validador: es el mismo codigo, no una copia.
 */
export function resolverConfigConAvisos(cwd) {
    const avisos = [];
    const config = resolverConfigInterno(cwd, (a) => avisos.push(...a));
    return { config, avisos };
}
function resolverConfigInterno(cwd, avisar) {
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
    const { config, avisos } = parsearConfigConAvisos(contenido, ruta);
    avisar(avisos);
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
 * Avisos ya emitidos en este proceso. resolverConfig corre varias veces por
 * comando (git-commit, wip, flujo...) y el mismo aviso diez veces es ruido;
 * se deduplica por texto, que ya incluye ruta y linea.
 */
const avisosEmitidos = new Set();
function emitirAvisos(avisos) {
    for (const aviso of avisos) {
        if (avisosEmitidos.has(aviso))
            continue;
        avisosEmitidos.add(aviso);
        process.stderr.write(`${aviso}\n`);
    }
}
/** Para los tests: olvida lo ya avisado y vuelve a emitirlo. */
export function reiniciarAvisosDeConfig() {
    avisosEmitidos.clear();
}
/**
 * Separada de resolverConfig para poder probar el parseo y la
 * validacion sin disco, y para que el mensaje de error siempre pueda
 * nombrar el fichero de donde salio el problema. Los avisos (claves
 * desconocidas) los descarta: quien los quiera usa parsearConfigConAvisos.
 */
export function parsearConfig(contenido, ruta) {
    return parsearConfigConAvisos(contenido, ruta).config;
}
/** La configuracion y los avisos no fatales (una clave desconocida por aviso). */
export function parsearConfigConAvisos(contenido, ruta) {
    const { pares } = parseBloqueClaveValor(contenido.split(/\r?\n/), 0, {
        etiqueta: 'config',
        crearError: (mensaje) => new ConfigError(`[ERROR] ${ruta}: ${mensaje}`),
        permitirComentariosDeLinea: true,
    });
    const config = { ...CONFIG_DEFAULTS };
    const vistas = new Set();
    const avisos = [];
    let dondeUrlBase = '';
    for (const par of pares) {
        const donde = `${ruta}:${par.numeroLinea}`;
        if (!CLAVES_CONFIG.includes(par.clave)) {
            avisos.push(mensajeClaveDesconocida(donde, par.clave));
            continue;
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
                config.comando_sincronizacion = validarComando(donde, par.clave, par.valor, 'comando_sincronizacion: "node scripts/sincronizar-plan.mjs"');
                break;
            case 'rutas_sincronizacion':
                config.rutas_sincronizacion = validarRutasSincronizacion(donde, par.valor);
                break;
            case 'timeout_sincronizacion':
                config.timeout_sincronizacion = validarEnteroPositivo(donde, par.clave, par.valor);
                break;
            case 'excluir_de_revision':
                config.excluir_de_revision = validarPatronesExclusion(donde, par.valor);
                break;
            case 'contexto_revision':
                config.contexto_revision = validarPatronesExclusion(donde, par.valor, 'contexto_revision', false);
                break;
            case 'modo_flujo':
                config.modo_flujo = validarModoFlujo(donde, par.valor);
                break;
            case 'cierre_por_defecto':
                config.cierre_por_defecto = validarCierrePorDefecto(donde, par.valor);
                break;
            case 'plataforma_remota':
                config.plataforma_remota = validarPlataformaRemota(donde, par.valor);
                break;
            case 'url_base_remoto':
                config.url_base_remoto = validarUrlBaseRemoto(donde, par.valor);
                dondeUrlBase = donde;
                break;
            case 'comando_verificacion':
                config.comando_verificacion = validarComando(donde, par.clave, par.valor, 'comando_verificacion: "npm test"');
                break;
            case 'timeout_verificacion':
                config.timeout_verificacion = validarEnteroPositivo(donde, par.clave, par.valor);
                break;
            case 'comando_verificacion_selectiva':
                config.comando_verificacion_selectiva = validarComando(donde, par.clave, par.valor, 'comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"');
                break;
            case 'timeout_verificacion_selectiva':
                config.timeout_verificacion_selectiva = validarEnteroPositivo(donde, par.clave, par.valor);
                break;
            case 'comando_heldout':
                config.comando_heldout = validarComando(donde, par.clave, par.valor, 'comando_heldout: "node --test $HELDOUT_DIR"');
                break;
            case 'informe_cobertura':
                config.informe_cobertura = validarInformeCobertura(donde, par.valor);
                break;
            case 'umbral_cobertura':
                config.umbral_cobertura = validarUmbralCobertura(donde, par.valor);
                break;
            case 'rutas_documentacion':
                config.rutas_documentacion = validarRutasDocumentacion(donde, par.valor);
                break;
            case 'comando_verificacion_documentacion':
                config.comando_verificacion_documentacion = validarComando(donde, par.clave, par.valor, 'comando_verificacion_documentacion: "node scripts/comprobar-docs.js"');
                break;
        }
    }
    validarSincronizacionCompleta(ruta, vistas);
    validarVerificacionCompleta(ruta, vistas);
    validarCoberturaCompleta(ruta, vistas);
    validarDocumentacionCompleta(ruta, vistas);
    validarRemotoCompleto(dondeUrlBase, config);
    return { config, avisos };
}
/**
 * Las dos claves del remoto se validan JUNTAS: una URL sin plataforma, o con
 * `github` (que no tiene instancias que apuntar), son configuraciones que
 * parecen hacer algo y no lo hacen. Que la base sea prefijo de origin no se
 * puede saber aqui (hace falta Git): lo comprueba quien resuelve el remoto.
 */
function validarRemotoCompleto(dondeUrlBase, config) {
    if (config.url_base_remoto === null)
        return;
    if (config.plataforma_remota === null) {
        throw new ConfigError(`[ERROR] ${dondeUrlBase}: "url_base_remoto" necesita tambien "plataforma_remota: gitlab".\n` +
            '        Una URL base sin plataforma no dice contra que CLI usarla. Anade ' +
            '"plataforma_remota: gitlab" o borra la URL.');
    }
    if (config.plataforma_remota === 'github') {
        throw new ConfigError(`[ERROR] ${dondeUrlBase}: "url_base_remoto" solo vale con "plataforma_remota: gitlab".\n` +
            '        Con github el CLI (gh) la ignoraria. Borra la URL, o cambia la plataforma a gitlab.');
    }
}
/** `github` | `gitlab`, con sugerencia ante una errata (misma doctrina que modo_flujo). */
function validarPlataformaRemota(donde, valor) {
    const plataforma = validarTextoNoVacio(donde, 'plataforma_remota', valor);
    if (PLATAFORMAS_REMOTAS.includes(plataforma))
        return plataforma;
    const parecido = PLATAFORMAS_REMOTAS.map((p) => ({ p, d: distanciaEdicion(plataforma.toLowerCase(), p) }))
        .sort((a, b) => a.d - b.d)[0];
    const sugerencia = parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.p}"?` : '';
    throw new ConfigError(`[ERROR] ${donde}: plataforma_remota "${plataforma}" no es valida.${sugerencia}\n` +
        `        Valores validos: ${PLATAFORMAS_REMOTAS.join(', ')} (sin la clave, se decide por el host de origin).`);
}
/**
 * URL base de la instancia GitLab: https, sin usuario ni contrasena (nada de
 * ello se repite en el mensaje: podria ser un token) y normalizada.
 */
function validarUrlBaseRemoto(donde, valor) {
    const texto = validarTextoNoVacio(donde, 'url_base_remoto', valor);
    const r = normalizarBase(texto);
    if (r.ok)
        return r.base;
    const ejemplo = 'Ejemplo: url_base_remoto: https://git.empresa.com (o https://servidor.example/ruta/gitlab).';
    switch (r.motivo) {
        case 'credenciales':
            throw new ConfigError(`[ERROR] ${donde}: "url_base_remoto" lleva un "@", es decir usuario o contrasena en la URL.\n` +
                '        No se admiten credenciales en la configuracion (se commitea): usa la sesion de ' +
                '"glab auth login" o la variable de entorno GITLAB_TOKEN.');
        case 'no-https':
            throw new ConfigError(`[ERROR] ${donde}: "url_base_remoto" debe empezar por https:// (y es ${describirValor(texto)}).\n` +
                `        glab solo habla https con la instancia. ${ejemplo}`);
        case 'malformada':
            throw new ConfigError(`[ERROR] ${donde}: "url_base_remoto" no es una URL base valida (${describirValor(texto)}).\n` +
                `        Lleva solo host, puerto y ruta, sin parametros ni espacios. ${ejemplo}`);
    }
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
/** TASK-070: el timeout de verificacion sin su comando no hace nada, como el de sincronizacion. */
function validarVerificacionCompleta(ruta, vistas) {
    // TASK-073: el timeout tambien es el de comando_heldout.
    if (vistas.has('timeout_verificacion') && !vistas.has('comando_verificacion') && !vistas.has('comando_heldout')) {
        throw new ConfigError(`[ERROR] ${ruta}: "timeout_verificacion" sin "comando_verificacion" ni "comando_heldout" no hace nada.
` +
            '        Borrala, o declara tambien el comando (por ejemplo comando_verificacion: "npm test").');
    }
    // TASK-091: la selectiva es para las rondas; la puerta de integracion es la
    // completa. Sin ella, finish y el guardian de merges no verificarian nada.
    if (vistas.has('comando_verificacion_selectiva') && !vistas.has('comando_verificacion')) {
        throw new ConfigError(`[ERROR] ${ruta}: "comando_verificacion_selectiva" necesita tambien "comando_verificacion".
` +
            '        La selectiva solo acelera las rondas; antes de integrar se exige la completa. Declara la ' +
            'completa (por ejemplo comando_verificacion: "npm test"), o borra la selectiva.');
    }
    if (vistas.has('timeout_verificacion_selectiva') && !vistas.has('comando_verificacion_selectiva')) {
        throw new ConfigError(`[ERROR] ${ruta}: "timeout_verificacion_selectiva" sin "comando_verificacion_selectiva" no hace nada.
` +
            '        Borrala, o declara tambien el comando de la verificacion selectiva.');
    }
}
/**
 * TASK-074: el umbral solo tiene sentido con el informe que mide y con el
 * comando que lo regenera en `finish`: sin comando, la puerta leeria un
 * informe viejo (o ninguno) y bloquearia siempre.
 */
function validarCoberturaCompleta(ruta, vistas) {
    if (!vistas.has('umbral_cobertura'))
        return;
    if (!vistas.has('informe_cobertura') || !vistas.has('comando_verificacion')) {
        throw new ConfigError(`[ERROR] ${ruta}: "umbral_cobertura" necesita tambien "informe_cobertura" y "comando_verificacion".
` +
            '        El umbral se mide sobre el informe lcov que regenera la verificacion antes de cerrar. ' +
            'Declara las dos (p. ej. informe_cobertura: coverage/lcov.info), o borra el umbral.');
    }
}
/**
 * TASK-100: patrones de documentacion, sin anclar. Un patron que casa con todo
 * (`*`, `**`, `**\/*`) convertiria cualquier cambio en «solo documentacion»:
 * se rechaza (MEN-4 de la revision).
 */
function validarRutasDocumentacion(donde, valor) {
    const patrones = validarPatronesExclusion(donde, valor, 'rutas_documentacion', false);
    const total = patrones.find((p) => /^(\*\*?\/)*\*\*?$/.test(p.replace(/\/+$/, '')));
    if (total !== undefined) {
        throw new ConfigError(
        // MEN-6 de la revision de TASK-100: `*` y `*/**` no casan con todo, pero
        // si con todos los ficheros de la raiz o de cualquier carpeta: demasiado.
        `[ERROR] ${donde}: el patron "${total}" de "rutas_documentacion" es demasiado amplio: casa con ` +
            'ficheros de cualquier tipo (todos los de la raiz, de cualquier carpeta o del repo entero), y una tarea ' +
            'con codigo podria cerrarse sin la verificacion completa.\n' +
            '        Declara carpetas o ficheros concretos de documentacion (p. ej. [docs/**, README.md]).');
    }
    return patrones;
}
/**
 * TASK-100: las rutas de documentacion ahorran `comando_verificacion`; sin el
 * no ahorran nada. El comando de documentacion sin rutas no lo lanzaria nadie.
 */
function validarDocumentacionCompleta(ruta, vistas) {
    if (vistas.has('rutas_documentacion') && !vistas.has('comando_verificacion')) {
        throw new ConfigError(`[ERROR] ${ruta}: "rutas_documentacion" necesita tambien "comando_verificacion".\n` +
            '        Las rutas de documentacion sirven para no correr la verificacion completa cuando la tarea ' +
            'solo cambia documentacion; sin ella no hay nada que ahorrar. Declara la completa o borra las rutas.');
    }
    if (vistas.has('comando_verificacion_documentacion') && !vistas.has('rutas_documentacion')) {
        throw new ConfigError(`[ERROR] ${ruta}: "comando_verificacion_documentacion" necesita tambien "rutas_documentacion".\n` +
            '        Solo se ejecuta cuando la tarea cambia unicamente esas rutas. Declaralas (p. ej. ' +
            'rutas_documentacion: [docs/**, README.md]) o borra el comando.');
    }
}
/** Ruta relativa a la raiz del repo, como las de sincronizacion (no absoluta, no carpeta, no fuera del repo). */
function validarInformeCobertura(donde, valor) {
    const texto = validarTextoNoVacio(donde, 'informe_cobertura', valor);
    const motivo = motivoRutaInvalida(texto);
    if (motivo !== null) {
        throw new ConfigError(`[ERROR] ${donde}: "informe_cobertura" "${texto}" no vale: ${motivo}.
` +
            '        Es la ruta del fichero lcov relativa a la raiz del repo, p. ej. informe_cobertura: coverage/lcov.info.');
    }
    return path.posix.normalize(texto.replace(/\\/g, '/'));
}
/** Numero de 0 a 100 (admite decimales). */
function validarUmbralCobertura(donde, valor) {
    // El parser de bloques solo convierte enteros: `87.5` llega como texto.
    const numero = typeof valor === 'string' && /^\d+(\.\d+)?$/.test(valor.trim()) ? parseFloat(valor) : valor;
    if (typeof numero !== 'number' || !Number.isFinite(numero) || numero < 0 || numero > 100) {
        throw new ConfigError(`[ERROR] ${donde}: "umbral_cobertura" debe ser un numero de 0 a 100, y es ${describirValor(valor)}.
` +
            '        Es el porcentaje minimo de lineas cambiadas cubiertas para que finish cierre (p. ej. umbral_cobertura: 80).');
    }
    return numero;
}
/**
 * Lista flow de patrones `git :(glob)`. A diferencia de
 * `rutas_sincronizacion`, una lista vacia es valida (no excluir nada) y
 * `tareas/` se puede nombrar: excluirla es justo el valor por defecto.
 * Un patron sin `/` se ancla en cualquier carpeta (`*.lock` →
 * `** /*.lock`), que es lo que una persona espera y no lo que hace
 * `:(glob)` a secas, donde `*` no cruza carpetas.
 */
function validarPatronesExclusion(donde, valor, clave = 'excluir_de_revision', anclar = true) {
    if (!Array.isArray(valor)) {
        throw new ConfigError(`[ERROR] ${donde}: "${clave}" debe ser una lista entre corchetes, ` +
            `y es ${describirValor(valor)}.\n` +
            (clave === 'rutas_documentacion'
                ? `        Ejemplo: ${clave}: [docs/**, README.md].`
                : `        Ejemplo: ${clave}: [**/dist/**, **/*.lock]. Para no excluir nada: ${clave}: [].`));
    }
    const patrones = [];
    for (const elemento of valor) {
        if (typeof elemento !== 'string' || elemento.trim() === '') {
            throw new ConfigError(`[ERROR] ${donde}: "${clave}" contiene un elemento vacio o que no es texto.`);
        }
        const conBarras = elemento.trim().replace(/\\/g, '/');
        const absoluto = conBarras.startsWith('/') || /^[A-Za-z]:/.test(conBarras);
        if (absoluto || conBarras.split('/').includes('..')) {
            throw new ConfigError(`[ERROR] ${donde}: el patron "${elemento.trim()}" de "${clave}" no vale: ` +
                `${absoluto ? 'es absoluto' : 'sale del repo con ".."'}.\n` +
                '        Los patrones son relativos a la raiz del repo y siguen la semantica de ' +
                'git :(glob) (por ejemplo **/dist/**).');
        }
        const anclado = !anclar || conBarras.includes('/') ? conBarras : `**/${conBarras}`;
        if (!patrones.includes(anclado))
            patrones.push(anclado);
    }
    return patrones;
}
/** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
function validarComando(donde, clave, valor, ejemplo) {
    if (typeof valor !== 'string' || valor.trim() === '') {
        throw new ConfigError(`[ERROR] ${donde}: "${clave}" debe ser un comando (texto no vacio), ` +
            `y es ${describirValor(valor)}.\n` +
            `        Ejemplo: ${ejemplo}. ` +
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
        const motivo = motivoRutaInvalida(original, { ficheroEnRaizDeTareas: true });
        if (motivo !== null) {
            throw new ConfigError(`[ERROR] ${donde}: la ruta de sincronizacion "${original}" no vale: ${motivo}.\n` +
                '        Solo ficheros, relativos a la raiz del repo, fuera de .taskcode/ y .git/; ' +
                'de tareas/ solo un fichero suelto en su raiz (p. ej. tareas/ROADMAP.md), ' +
                'nunca dentro de una carpeta de estado.');
        }
        const normalizada = path.posix.normalize(original.replace(/\\/g, '/'));
        if (!rutas.includes(normalizada))
            rutas.push(normalizada);
    }
    return rutas;
}
/**
 * Un segmento de ruta tal como lo resuelve el sistema de ficheros mas
 * permisivo: sin distinguir mayusculas y sin los puntos y espacios finales,
 * que Windows ignora (`tareas/01-en-diseno./x.md` es `tareas/01-en-diseno/x.md`).
 */
function nombreComparable(segmento) {
    return segmento.toLowerCase().replace(/[. ]+$/, '');
}
/**
 * null si la ruta es aceptable; si no, el motivo en palabras de persona.
 *
 * `ficheroEnRaizDeTareas` abre la excepcion de TASK-092 (un fichero suelto
 * en tareas/). Solo la pide rutas_sincronizacion: informe_cobertura sigue
 * rechazando todo lo que cuelga de tareas/.
 */
function motivoRutaInvalida(original, opciones = {}) {
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
    const segmentos = normalizada.split('/');
    const primera = segmentos[0];
    const primeraMin = nombreComparable(primera);
    if (!RAICES_PROHIBIDAS_SINCRONIZACION.includes(primeraMin))
        return null;
    if (primeraMin === 'tareas' && opciones.ficheroEnRaizDeTareas === true) {
        if (segmentos.length === 1)
            return `es la carpeta ${primera}/, no un fichero`;
        const segunda = segmentos[1];
        if (CARPETAS_DE_ESTADO.includes(nombreComparable(segunda))) {
            return (`${primera}/${segunda} es una carpeta de estado, y lo que hay en ella ` +
                'lo escribe taskctl');
        }
        if (segmentos.length === 2)
            return null;
        return (`esta en una subcarpeta de ${primera}/; de ${primera}/ solo se admite un fichero ` +
            'suelto en su raiz');
    }
    return `esta bajo ${primera}/, que no es del proyecto sino de la herramienta`;
}
/**
 * Aviso (TASK-061; antes error) de clave desconocida. Enumera SIEMPRE las
 * claves validas (criterio de la decision #9: el mensaje dice que esta mal y
 * cuales son las validas) y, si la escrita se parece mucho a una de ellas, la
 * propone. El caso motivador es literal: `limite_wp`.
 */
function mensajeClaveDesconocida(donde, clave) {
    const sugerida = masParecida(clave, CLAVES_CONFIG);
    const lineas = [`[AVISO] ${donde}: clave desconocida "${clave}"; se ignora.`];
    if (sugerida !== null)
        lineas.push(`        Quiza quisiste decir "${sugerida}".`);
    lineas.push(`        Claves validas: ${CLAVES_CONFIG.join(', ')}. Si es de una version mas nueva del plugin, ` +
        'actualizalo para que se lea.');
    return lineas.join('\n');
}
/** ` (por defecto: "x")`, o ` (sin la clave, no se declara)` si el defecto es null. */
function textoDefecto(clave) {
    const d = CONFIG_DEFAULTS[clave];
    return typeof d === 'string' ? ` (por defecto: "${d}")` : ' (sin la clave, no se declara)';
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
            `        O le das un valor, o borras la linea${textoDefecto(clave)}.`);
    }
    if (typeof valor !== 'string') {
        throw new ConfigError(`[ERROR] ${donde}: "${clave}" debe ser texto, y es ${describirValor(valor)}.`);
    }
    const recortado = valor.trim();
    if (recortado === '') {
        throw new ConfigError(`[ERROR] ${donde}: "${clave}" no puede estar vacia.\n` +
            `        O le das un valor, o borras la linea${textoDefecto(clave)}.`);
    }
    return recortado;
}
/** Entero >= 1. Un limite de 0 no es "sin limite": es "no se puede trabajar". */
function validarEnteroPositivo(donde, clave, valor) {
    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
        const consecuencia = clave === 'limite_wip'
            ? 'Un 0 o un negativo no significan "sin limite": impedirian arrancar cualquier tarea.'
            : clave === 'timeout_sincronizacion'
                ? 'Son segundos: un 0 o un negativo matarian el comando antes de empezar.'
                : 'Son segundos: un 0 o un negativo cortarian la verificacion antes de empezar.';
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
/**
 * TASK-056: `modo_flujo` es un enumerado. Un valor fuera de la lista aborta
 * nombrando los validos (y el mas parecido): caer a `manual` en silencio
 * haria creer a la persona que el flujo va a encadenarse cuando no.
 */
function validarModoFlujo(donde, valor) {
    const modo = validarTextoNoVacio(donde, 'modo_flujo', valor);
    if (MODOS_FLUJO.includes(modo))
        return modo;
    const parecido = MODOS_FLUJO.map((m) => ({ m, d: distanciaEdicion(modo.toLowerCase(), m) }))
        .sort((a, b) => a.d - b.d)[0];
    const sugerencia = parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.m}"?` : '';
    throw new ConfigError(`[ERROR] ${donde}: modo_flujo "${modo}" no es valido.${sugerencia}\n` +
        `        Valores validos: ${MODOS_FLUJO.join(', ')} (sin la clave, manual).`);
}
/**
 * TASK-060: `cierre_por_defecto` es un enumerado, con la misma doctrina que
 * `modo_flujo`: un valor mal escrito aborta nombrando los validos. Caer a
 * `merge` en silencio mergearia en local un cierre que el equipo quiere por
 * merge request.
 */
function validarCierrePorDefecto(donde, valor) {
    const cierre = validarTextoNoVacio(donde, 'cierre_por_defecto', valor);
    if (CIERRES_POR_DEFECTO.includes(cierre))
        return cierre;
    const parecido = CIERRES_POR_DEFECTO.map((c) => ({ c, d: distanciaEdicion(cierre.toLowerCase(), c) }))
        .sort((a, b) => a.d - b.d)[0];
    const sugerencia = parecido !== undefined && parecido.d <= 3 ? ` ¿Querias decir "${parecido.c}"?` : '';
    throw new ConfigError(`[ERROR] ${donde}: cierre_por_defecto "${cierre}" no es valido.${sugerencia}
` +
        `        Valores validos: ${CIERRES_POR_DEFECTO.join(', ')} (sin la clave, merge).`);
}
