/**
 * Auto-commit de taskctl — paso 5 de la seccion 8.3 (TASK-030, item
 * C2, decision #14: "commitea si, sube solo con --push").
 *
 * Existe porque hoy `taskctl` escribe ficheros que luego nadie
 * commitea: de los 9 commits que costo TASK-029, 4 existian solo para
 * registrar lo que el propio CLI acababa de escribir. Ademas, dejar el
 * workspace sucio es lo que hace que `taskctl import` no se pueda
 * ejecutar dos veces seguidas (el guard de la 8.3 aborta la segunda),
 * un fallo documentado en HALLAZGOS.md.
 *
 * Las cuatro reglas de diseno, por orden de importancia:
 *
 * 1. **Se commitean SOLO las rutas que taskctl acaba de escribir.**
 *    Nunca un `git add -A` a secas. El guard de la 8.3
 *    (`ensureBaseBranchReady`) exige workspace limpio, pero solo lo
 *    aplican 4 de los 8 comandos: en `start`, `review` y `finish`
 *    puede haber trabajo de la persona en el arbol, y barrerlo dentro
 *    de un commit automatico seria exactamente el dano que esta
 *    herramienta existe para evitar. Dos mecanismos independientes lo
 *    garantizan aqui:
 *      - cada ruta se prepara con su propio `git add -A -- <ruta>`
 *        (el `-A` va ACOTADO por el pathspec: prepara altas, bajas y
 *        modificaciones bajo esa ruta y nada mas — hace falta para que
 *        el borrado de la carpeta de origen de un `moveTareaFile`
 *        entre en el mismo commit que el alta de la de destino, si no
 *        el commit registraria una copia y no un movimiento);
 *      - el commit se hace con `git commit -m <msg> -- <rutas>`, que
 *        es pathspec-limitado (modo `--only`): aunque la persona
 *        tuviera OTROS ficheros ya preparados con `git add`, no entran
 *        en el commit y siguen preparados despues. Comprobado, no
 *        supuesto: con `src/algo.ts` en estado `MM` antes del commit,
 *        sigue en `MM` despues y el commit solo contiene las rutas de
 *        taskctl.
 * 2. **Nada que commitear, ningun commit.** Si tras preparar las rutas
 *    el indice no difiere de HEAD, no se crea un commit vacio.
 * 3. **Si el commit falla, se falla ruidosamente.** Un hook de
 *    pre-commit, una firma GPG rechazada o una identidad de Git sin
 *    configurar no se tragan: el mensaje dice que la tarea esta
 *    ESCRITA pero NO registrada, y en que estado queda el arbol.
 * 4. **`--push` empuja la rama actual**, y sin remoto avisa y sigue —
 *    misma doctrina que `detect_origin_available` en
 *    `_gitflow-common.sh` y que el `--push` que `taskctl pause` ya
 *    tiene (que hace literalmente `git push origin <rama actual>`).
 *    No se inventa vocabulario nuevo.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { resolverConfig } from '../core/config.js';
import { GitCommandError, currentBranch, isRemoteAvailable, runGit } from './git.js';
import { ejecutarSincronizacion, SIN_SINCRONIZACION, } from './sincronizacion.js';
export class AutoCommitError extends Error {
}
/**
 * Los scripts de Git-Flow procesan los mensajes de commit, asi que
 * este repo los escribe sin tildes (CLAUDE.md). Aqui se comprueba
 * mecanicamente en vez de confiar en que cada generador se acuerde: es
 * la clase de regla que se cumple durante tres meses y luego no.
 *
 * Ojo al cablear comandos nuevos: por eso ninguno de los mensajes
 * incluye el TITULO de la tarea, que es texto libre de la persona y
 * puede llevar tildes con todo el derecho.
 */
function assertMensajeAscii(mensaje) {
    if (mensaje.trim() === '') {
        throw new AutoCommitError('[ERROR] El mensaje de commit automatico no puede estar vacio.');
    }
    const malo = /[^\x20-\x7E\n]/.exec(mensaje);
    if (malo !== null) {
        throw new AutoCommitError(`[ERROR] El mensaje de commit automatico contiene un caracter no ASCII ` +
            `(${JSON.stringify(malo[0])}): "${mensaje}". Los scripts de Git-Flow procesan estos ` +
            'mensajes y este repo los escribe sin tildes.');
    }
}
/**
 * Mensaje de commit determinista en el estilo del repo:
 * `chore(TASK-030): tarea en curso`. Un solo sitio donde vive el
 * formato, y de paso donde se valida que no lleve tildes.
 */
export function mensajeChore(scope, resumen) {
    // Comprobados por separado: `chore(TASK-030): ` con el resumen vacio
    // no es una cadena vacia, asi que la comprobacion del mensaje
    // completo no lo veria pasar — y un commit sin asunto es
    // exactamente lo que un `${}` mal cableado produce.
    if (scope.trim() === '' || resumen.trim() === '') {
        throw new AutoCommitError(`[ERROR] Mensaje de commit automatico incompleto: scope="${scope}", resumen="${resumen}".`);
    }
    const mensaje = `chore(${scope}): ${resumen}`;
    assertMensajeAscii(mensaje);
    return mensaje;
}
/**
 * Pasa una ruta a pathspec relativo al cwd de Git, con separadores
 * POSIX (Git los acepta en las dos plataformas; los `\` de Windows,
 * no siempre).
 *
 * Rechaza cualquier cosa que se salga de `cwd`, incluida la propia
 * raiz: un pathspec vacio o "." convertiria `git add -A -- <ruta>` en
 * el `git add -A` global que la regla 1 prohibe, y seria un fallo
 * silencioso — el commit saldria bien y se llevaria por delante el
 * trabajo de la persona.
 */
function normalizarRuta(cwd, ruta) {
    const rel = path.relative(cwd, path.resolve(cwd, ruta));
    if (rel === '' || rel === '.' || rel.startsWith('..') || path.isAbsolute(rel)) {
        throw new AutoCommitError(`[ERROR] Ruta invalida para el commit automatico: "${ruta}" no esta dentro de ` +
            `"${cwd}". taskctl solo commitea lo que el mismo acaba de escribir.`);
    }
    return rel.split(path.sep).join('/');
}
/**
 * true si esa ruta tiene algo que Git pueda preparar: existe en disco
 * (alta o modificacion) o tiene entradas en el indice (baja, p. ej. la
 * carpeta de origen de un movimiento de tarea). Sin esta comprobacion,
 * `git add` muere con `fatal: pathspec ... did not match any files`
 * (exit 128) y tumbaria el comando por una ruta que sencillamente no
 * tiene nada que aportar.
 */
function tieneAlgoQuePreparar(cwd, rutaRel) {
    if (existsSync(path.resolve(cwd, rutaRel)))
        return true;
    return runGit(['ls-files', '--', rutaRel], cwd) !== '';
}
/**
 * Commitea (y opcionalmente sube) EXCLUSIVAMENTE las rutas indicadas.
 * Ver la cabecera del fichero para las cuatro reglas que cumple.
 */
export function autoCommit(opts) {
    assertMensajeAscii(opts.mensaje);
    const { cwd } = opts;
    const avisos = [];
    const rama = currentBranch(cwd);
    // Las rutas del propio comando se validan ANTES de sincronizar: un
    // error de programacion aqui no debe llegar a ejecutar nada.
    const rutasComando = opts.rutas.map((r) => normalizarRuta(cwd, r));
    // TASK-033: el comando de sincronizacion del proyecto corre aqui, con
    // los ficheros de la tarea ya escritos y antes del primer `git add`,
    // para que sus rutas entren en ESTE commit y el indice real quede
    // limpio. Nunca aborta la transicion (ver sincronizacion.ts). Si el
    // comando no escribio nada de la tarea, no hay estado nuevo que
    // sincronizar y no se lanza.
    const sincronizacion = rutasComando.length === 0 ? SIN_SINCRONIZACION : sincronizar(opts);
    avisos.push(...sincronizacion.avisos);
    // Deduplicadas y ordenadas para que el commando de Git sea
    // determinista (y los tests puedan aseverar sobre el).
    const rutasRel = [
        ...new Set([...rutasComando, ...sincronizacion.rutas.map((r) => normalizarRuta(cwd, r))]),
    ].sort();
    const presentes = rutasRel.filter((r) => tieneAlgoQuePreparar(cwd, r));
    let commiteado = false;
    let commit = null;
    let ficheros = [];
    if (presentes.length > 0) {
        // Una a una, a proposito: un pathspec por invocacion deja claro en
        // el log de Git (y en un strace, si hiciera falta) que no hay
        // ningun `git add` sin acotar por ahi.
        for (const rutaRel of presentes) {
            try {
                runGit(['add', '-A', '--', rutaRel], cwd);
            }
            catch (e) {
                throw new AutoCommitError(`[ERROR] taskctl escribio los ficheros de la tarea pero no pudo preparar ` +
                    `"${rutaRel}" para el commit: ${detalleDeError(e)}. Los cambios estan en el ` +
                    'arbol de trabajo; revisa el motivo y commitealos a mano.');
            }
        }
        // Regla 2: si el indice no difiere de HEAD bajo estas rutas, no
        // hay commit que hacer (p. ej. "taskctl approve" sobre una tarea
        // que ya estaba aprobada y con la misma fecha).
        ficheros = runGit(['diff', '--cached', '--name-only', '--', ...presentes], cwd)
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l !== '');
        if (ficheros.length > 0) {
            try {
                runGit(['commit', '-m', opts.mensaje, '--', ...presentes], cwd);
            }
            catch (e) {
                throw new AutoCommitError(`[ERROR] taskctl escribio los ficheros de la tarea pero NO pudo commitearlos: ` +
                    `${detalleDeError(e)}. Estan preparados (git add) en la rama "${rama}": revisa el ` +
                    'motivo (un hook de pre-commit, una firma GPG, o "git config user.email" sin ' +
                    'configurar) y haz el commit a mano. La tarea esta escrita pero no registrada.');
            }
            commiteado = true;
            commit = runGit(['rev-parse', '--short', 'HEAD'], cwd);
            // Hallazgo IMPORTANTE de la revision por pares (TASK-030): la
            // lista de arriba es lo que taskctl PIDIO commitear, no lo que
            // Git registro. Un hook de pre-commit que haga "git add" por su
            // cuenta (lint-staged, prettier) mete ficheros ajenos en el
            // commit — eso es semantica de Git en modo --only y se reproduce
            // con "git commit -- ruta" a pelo, sin taskctl de por medio. Lo
            // que si era nuestro es que el CLI dijera "1 fichero" cuando Git
            // habia registrado 2: en el unico escenario donde la regla se
            // rompe, la herramienta afirmaba lo contrario. Asi que la lista
            // se relee del commit y, si no coincide, se avisa.
            const pedidos = ficheros;
            ficheros = runGit(['show', '--name-only', '--format=', 'HEAD'], cwd)
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => l !== '');
            const intrusos = ficheros.filter((f) => !pedidos.includes(f));
            if (intrusos.length > 0) {
                avisos.push(`El commit ${commit} incluye ${intrusos.length} fichero(s) que taskctl no pidio ` +
                    `commitear: ${intrusos.join(', ')}. Casi seguro los ha anadido un hook de ` +
                    'pre-commit de este repo (lint-staged, prettier o similar). Revisa el commit: ' +
                    'taskctl solo pidio registrar lo que escribio el mismo.');
            }
        }
    }
    return {
        commiteado,
        commit,
        ficheros,
        rama,
        push: empujar(opts, rama, avisos),
        sincronizacion,
        avisos,
    };
}
/**
 * Cualquier excepcion de la sincronizacion (config ilegible a estas
 * alturas, un `git status` que falla) se convierte en 'fallida': para
 * cuando se llega aqui la tarea ya esta escrita, y en `finish` el merge
 * ya esta hecho. Abortar dejaria el estado a medias sin reintento.
 */
function sincronizar(opts) {
    try {
        return ejecutarSincronizacion(opts.cwd, resolverConfig(opts.cwd), opts.sincronizacion);
    }
    catch (e) {
        return {
            estado: 'fallida',
            rutas: [],
            avisos: [
                `No se pudo ejecutar la sincronizacion configurada: ${detalleDeError(e)}. La ` +
                    'tarea se ha commiteado sin ella; revisa .taskcode/config.yml y sincroniza a mano.',
            ],
        };
    }
}
/**
 * `--push` empuja la RAMA ACTUAL, se haya commiteado algo en esta
 * invocacion o no — exactamente lo que hace `pause-work.sh --push`,
 * que tambien empuja cuando el workspace ya estaba limpio. Sin origin
 * alcanzable avisa y sigue (exit 0); si el push se intenta y falla, se
 * falla ruidosamente diciendo que el commit SI se creo.
 */
function empujar(opts, rama, avisos) {
    if (opts.push !== true)
        return 'no-solicitado';
    if (rama === '') {
        avisos.push('Se pidio --push pero HEAD esta desacoplado (no hay rama activa): no se ha subido nada.');
        return 'sin-rama';
    }
    if (!isRemoteAvailable(opts.cwd)) {
        avisos.push(`Se pidio --push pero no hay conexion con origin (sin remoto configurado, o VPN/red ` +
            `caida): "${rama}" no se ha subido. Se continua en modo local.`);
        return 'sin-remoto';
    }
    try {
        runGit(['push', 'origin', rama], opts.cwd);
    }
    catch (e) {
        throw new AutoCommitError(`[ERROR] El trabajo quedo commiteado en "${rama}", pero el push a origin fallo: ` +
            `${detalleDeError(e)}. Sube la rama a mano ("git push origin ${rama}") cuando ` +
            'resuelvas el motivo.');
    }
    return 'empujado';
}
function detalleDeError(e) {
    if (e instanceof GitCommandError) {
        return e.stderr.trim() === '' ? e.message : e.stderr.trim();
    }
    return e instanceof Error ? e.message : String(e);
}
/**
 * Saca `--push` / `-p` de argv y devuelve el resto.
 *
 * No se delega en `parseArgs` a proposito: ese parser trata
 * `--flag valor` como par, asi que `taskctl plan --push TASK-030` se
 * habria leido como `push="TASK-030"` y la tarea habria desaparecido
 * de los posicionales. Como `--push` es booleano puro, quitarlo antes
 * de parsear es mas simple que ensenarle al parser que hay flags sin
 * valor.
 *
 * `-p` se acepta ademas de `--push` porque `pause-work.sh` ya acepta
 * las dos formas: mismo flag, mismo significado, mismo vocabulario.
 */
export function extraerPushFlag(argv) {
    const resto = [];
    let push = false;
    for (const arg of argv) {
        if (arg === '--push' || arg === '-p') {
            push = true;
            continue;
        }
        resto.push(arg);
    }
    return { push, resto };
}
