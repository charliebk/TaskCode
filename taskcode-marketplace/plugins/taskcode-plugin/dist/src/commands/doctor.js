/**
 * `taskctl doctor [--json]` — TASK-062.
 *
 * Comprueba, de una vez, que el proyecto esta listo para trabajar con el flujo
 * de tareas: entorno (Node, git, bash para los scripts de Git-Flow),
 * repositorio (estructura de tareas/, ramas base, origin, workspace),
 * configuracion, coherencia de las tareas y, si la config lo pide, el CLI de la
 * plataforma (gh/glab) y su sesion. SOLO LEE: no escribe, no commitea, no
 * cambia de rama; lo unico que sale a la red es la comprobacion de sesion de
 * la plataforma, con timeout propio corto. La unica escritura (TASK-110): la
 * status line de Claude Code, y solo con su flag explicito.
 *
 * Decisiones (plan de TASK-062, Carlos 2026-10-08):
 *
 * - Cada comprobacion va envuelta (`envolver`): una excepcion es un resultado
 *   `error` de ESA comprobacion, nunca un throw hacia el catch-all del CLI, y
 *   el resto sigue. No imprime: devuelve la salida ya formateada.
 * - bash: se ejecuta de verdad un script minimo con el MISMO lanzamiento que
 *   los de Git-Flow (`sondearBash`); no vale mirar la ruta ni `--version`.
 * - tareas/: recorrido PROPIO. `listTareasEnEstados` salta los IDs repetidos y
 *   esconde los tarea.md rotos en `ilegibles` sin causa, justo lo que doctor
 *   tiene que decir.
 * - workspace: `git status` con GIT_OPTIONAL_LOCKS=0 (no toma index.lock); un
 *   fallo por lock es aviso.
 * - origin: aviso, y error solo con `cierre_por_defecto: merge-request`.
 * - Sesion de plataforma no verificable (timeout, red): aviso. Error solo lo
 *   confirmado: CLI no instalado o sesion rechazada.
 * - Config: el validador de siempre (`resolverConfigConAvisos`), sin copia.
 *   Un valor invalido es error; una clave desconocida, aviso.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { aviso, codigoSalida, error as fallo, formatearJson, formatearTexto, nodeSoportado, NODE_MINIMO, ok, omitida, } from '../core/doctor.js';
import { resolverConfigConAvisos, CONFIG_DEFAULTS } from '../core/config.js';
import { comandoPropuesto } from '../core/comando-tests.js';
import { comandoParcial, documentacionDeclarada } from '../core/verificacion-proporcional.js';
import { detectarComandosTests } from '../fs/deteccion-tests.js';
import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
import { urlsDeOrigin } from '../fs/git.js';
import { sondearCli } from '../fs/merge-request.js';
import { resolverRemotoDeOrigin } from './finish-opciones.js';
import { directorioConfigClaude } from '../fs/config-claude.js';
import { sondearHooksClaude } from '../fs/sondas-hooks-claude.js';
import { sondearVersionPlugin } from '../fs/sonda-version-plugin.js';
import { compararVersiones, NOMBRE_PLUGIN } from '../core/version.js';
import { COMANDO_STATUS_LINE, desinstalarStatusLine, instalarStatusLine, sondearStatusLine, } from '../fs/status-line.js';
export class DoctorCommandError extends Error {
}
/** Flags de `taskctl doctor`: --json y, desde TASK-110, los de la status line (los unicos que escriben). */
export const FLAG_INSTALAR_STATUS_LINE = '--instalar-status-line';
export const FLAG_REEMPLAZAR_STATUS_LINE = '--reemplazar-status-line';
export const FLAG_DESINSTALAR_STATUS_LINE = '--desinstalar-status-line';
export const FLAGS_DOCTOR = [
    '--json',
    FLAG_INSTALAR_STATUS_LINE,
    FLAG_REEMPLAZAR_STATUS_LINE,
    FLAG_DESINSTALAR_STATUS_LINE,
];
/** Espera maxima de la comprobacion de sesion de la plataforma (el unico acceso a la red). */
export const TIMEOUT_PLATAFORMA_MS = 10_000;
/** Espera maxima de cada `git` lanzado por doctor. */
const TIMEOUT_GIT_MS = 15_000;
// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
/** Una comprobacion (o varias) que nunca lanza: una excepcion se vuelve su resultado `error`. */
export function envolver(id, f) {
    try {
        const r = f();
        return Array.isArray(r) ? r : [r];
    }
    catch (e) {
        const msg = ocultarCredenciales(e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim();
        return [
            fallo(id, `la comprobacion fallo por una excepcion: ${msg}`, 'Es un fallo de la propia comprobacion, no necesariamente del proyecto: repite taskctl doctor y, ' +
                'si persiste, revisa que el directorio existe y se puede leer.'),
        ];
    }
}
/** `git` sin lanzar nunca: el resultado lleva el error de lanzamiento. */
function git(args, cwd, env = {}, timeoutMs = TIMEOUT_GIT_MS) {
    const r = spawnSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: timeoutMs,
        env: { ...process.env, ...env },
    });
    return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim(), error: r.error };
}
const una = (t) => ocultarCredenciales(t).replace(/\s+/g, ' ').trim();
/** Como `una`, sin el `[ERROR]`/`[AVISO]` con que empiezan los mensajes de la config: doctor pone el suyo. */
const sinPrefijo = (t) => una(t).replace(/^\[(?:ERROR|AVISO)\]\s*/, '');
function ramaLocal(nombre, cwd) {
    return git(['show-ref', '--verify', '--quiet', `refs/heads/${nombre}`], cwd).status === 0;
}
function ramaEnOrigin(nombre, cwd) {
    return git(['show-ref', '--verify', '--quiet', `refs/remotes/origin/${nombre}`], cwd).status === 0;
}
// ---------------------------------------------------------------------
// Entorno
// ---------------------------------------------------------------------
function comprobarNode() {
    const v = process.versions.node;
    return nodeSoportado(v)
        ? ok('node', `Node ${v} (minimo ${NODE_MINIMO})`)
        : fallo('node', `Node ${v} es anterior al minimo soportado (${NODE_MINIMO})`, `Instala Node ${NODE_MINIMO} o superior (https://nodejs.org) y abre una terminal nueva.`);
}
function comprobarGit(cwd) {
    const r = git(['--version'], cwd);
    if (r.error !== undefined || r.status !== 0) {
        return fallo('git', `no se pudo ejecutar "git" (${una(r.error?.message ?? r.stderr)})`, 'Instala Git (https://git-scm.com) y comprueba que "git" esta en el PATH: git --version.');
    }
    return ok('git', r.stdout);
}
function arregloBash() {
    return process.platform === 'win32'
        ? 'Instala Git for Windows (https://git-scm.com/download/win) y pon su carpeta usr\\bin al PRINCIPIO del PATH, ' +
            'antes de C:\\Windows\\System32 (ahi vive el bash de WSL, que no vale). En PowerShell, para esta terminal: ' +
            '$env:Path = "C:\\Program Files\\Git\\usr\\bin;" + $env:Path ; para siempre, editalo en las variables de ' +
            'entorno del sistema y abre una terminal nueva. Despues repite taskctl doctor.'
        : 'Instala bash y las herramientas basicas (coreutils, grep, sed) y comprueba que "bash" esta en el PATH: ' +
            'bash -c "mktemp -d". Despues repite taskctl doctor.';
}
function comprobarBash(deps) {
    const r = sondearBash({ scriptsDir: deps.scriptsDir ?? resolveGitflowScriptsDir(), cwd: deps.repoCwd });
    if (r.ok)
        return ok('bash', `bash ejecuta los scripts de Git-Flow${r.version === '' ? '' : ` (bash ${r.version})`}`);
    const que = r.causa === 'no-lanzable'
        ? `no se pudo lanzar "bash" (${una(r.detalle)})`
        : r.causa === 'timeout'
            ? 'bash no termino el script de prueba a tiempo'
            : `bash no pudo ejecutar el script de prueba de Git-Flow (${una(r.detalle)})`;
    return fallo('bash', que, arregloBash());
}
// ---------------------------------------------------------------------
// Repositorio
// ---------------------------------------------------------------------
const SUBCARPETAS_TAREAS = TASK_STATES.map((e) => STATE_FOLDER[e]);
function comprobarCarpetas(tareasRoot) {
    const faltan = SUBCARPETAS_TAREAS.filter((c) => {
        try {
            return !statSync(path.join(tareasRoot, c)).isDirectory();
        }
        catch {
            return true;
        }
    });
    if (faltan.length === 0)
        return ok('tareas-carpetas', `tareas/ tiene las cinco carpetas (${SUBCARPETAS_TAREAS[0]} .. ${SUBCARPETAS_TAREAS[4]})`);
    const hayRaiz = existsSync(tareasRoot);
    return fallo('tareas-carpetas', hayRaiz ? `a tareas/ le faltan: ${faltan.join(', ')}` : 'no existe la carpeta tareas/ (o no es un directorio)', `mkdir -p ${faltan.map((c) => `tareas/${c}`).join(' ')}`);
}
function comprobarRepo(cwd, gitOk) {
    if (!gitOk) {
        return {
            cs: [omitida('repo-git', 'sin git no se puede comprobar el repositorio (ver git)')],
            repo: { esRepo: false, conCommits: false },
        };
    }
    const dentro = git(['rev-parse', '--is-inside-work-tree'], cwd);
    if (dentro.status !== 0 || dentro.stdout !== 'true') {
        return {
            cs: [
                fallo('repo-git', 'este directorio no esta dentro de un repositorio Git', 'Ejecuta taskctl desde la raiz del proyecto, o crea el repo: git init -b main && ' +
                    'git commit --allow-empty -m "chore: commit inicial" && git branch develop'),
            ],
            repo: { esRepo: false, conCommits: false },
        };
    }
    let enlazado = false;
    try {
        enlazado = statSync(path.join(cwd, '.git')).isFile();
    }
    catch {
        enlazado = false;
    }
    const cs = [ok('repo-git', enlazado ? 'repositorio Git (worktree o submodulo: .git es un fichero)' : 'repositorio Git')];
    const head = git(['rev-parse', '--verify', '--quiet', 'HEAD'], cwd);
    if (head.status !== 0) {
        cs.push(fallo('repo-commits', 'el repositorio no tiene ningun commit todavia, asi que aun no existe ninguna rama (ni develop ni la principal)', 'Haz el primer commit: git add -A && git commit -m "chore: commit inicial" ; despues crea la rama de integracion: git branch develop'));
        return { cs, repo: { esRepo: true, conCommits: false } };
    }
    cs.push(ok('repo-commits', 'el repositorio tiene commits'));
    return { cs, repo: { esRepo: true, conCommits: true } };
}
/** `main` o `master`: la local, o (aviso) solo la de origin. */
function ramaPrincipal(cwd) {
    for (const n of ['main', 'master'])
        if (ramaLocal(n, cwd))
            return { nombre: n, soloOrigin: false };
    for (const n of ['main', 'master'])
        if (ramaEnOrigin(n, cwd))
            return { nombre: n, soloOrigin: true };
    return null;
}
function comprobarRamas(cwd, baseConfig, repo) {
    const base = baseConfig ?? CONFIG_DEFAULTS.rama_base;
    if (!repo.esRepo || !repo.conCommits || baseConfig === null) {
        const motivo = repo.esRepo ? 'el repo no tiene commits (ver repo-commits)' : 'no hay repositorio (ver repo-git)';
        if (repo.esRepo && repo.conCommits) {
            // Solo la rama base depende de la config; la principal se comprueba igual.
            return [omitida('rama-base', 'config invalida: no se sabe cual es la rama base (ver config)'), ...comprobarRamas(cwd, base, repo).slice(1)];
        }
        return [omitida('rama-base', `no se puede comprobar la rama "${base}": ${motivo}`), omitida('rama-principal', `no se puede comprobar: ${motivo}`)];
    }
    const principal = ramaPrincipal(cwd);
    const cs = [];
    if (ramaLocal(base, cwd)) {
        cs.push(ok('rama-base', `existe la rama "${base}"`));
    }
    else if (ramaEnOrigin(base, cwd)) {
        cs.push(aviso('rama-base', `"${base}" solo existe en origin, no en local`, `git branch ${base} origin/${base}`));
    }
    else {
        cs.push(fallo('rama-base', `no existe la rama "${base}" (de ella cuelgan las tareas feature, fix y release)`, `git branch ${base}${principal === null ? '' : ` ${principal.soloOrigin ? `origin/${principal.nombre}` : principal.nombre}`}`));
    }
    if (principal === null) {
        cs.push(fallo('rama-principal', 'no existe ni "main" ni "master" (de ella cuelgan los hotfix y reciben las releases)', 'Crea la rama principal desde el commit que quieras publicar: git branch main <commit>'));
    }
    else if (principal.soloOrigin) {
        cs.push(aviso('rama-principal', `"${principal.nombre}" solo existe en origin, no en local`, `git branch ${principal.nombre} origin/${principal.nombre}`));
    }
    else {
        cs.push(ok('rama-principal', `existe la rama principal "${principal.nombre}"`));
    }
    return cs;
}
function comprobarOrigin(cwd, repo, cfg) {
    if (!repo.esRepo)
        return { c: omitida('origin', 'no hay repositorio (ver repo-git)'), hay: false };
    const r = git(['remote', 'get-url', 'origin'], cwd);
    if (r.status === 0 && r.stdout !== '') {
        const host = urlsDeOrigin(cwd)
            .map((u) => hostDeRemoto(u))
            .find((h) => h !== null);
        return { c: ok('origin', host === undefined ? 'hay un remoto "origin"' : `hay un remoto "origin" (host ${host})`), hay: true };
    }
    const arreglo = 'git remote add origin <url-del-repositorio>';
    if (cfg === null) {
        return { c: omitida('origin', 'no hay remoto "origin" y, con la config invalida, no se sabe si hace falta (ver config)'), hay: false };
    }
    if (cfg.cierre_por_defecto === 'merge-request') {
        return {
            c: fallo('origin', 'no hay remoto "origin" y la config pide merge request por defecto (cierre_por_defecto: merge-request)', arreglo),
            hay: false,
        };
    }
    return {
        c: aviso('origin', 'no hay remoto "origin" (trabajo solo local: no se podra subir ni abrir un merge request)', arreglo),
        hay: false,
    };
}
function comprobarWorkspace(cwd, repo, timeoutMs) {
    if (!repo.esRepo)
        return omitida('workspace', 'no hay repositorio (ver repo-git)');
    const r = git(['status', '--porcelain'], cwd, { GIT_OPTIONAL_LOCKS: '0' }, timeoutMs);
    if (r.error?.code === 'ETIMEDOUT') {
        return aviso('workspace', `git status no termino en ${Math.round(timeoutMs / 1000)} s, asi que no se pudo comprobar el workspace (repo muy grande, disco lento o Git bloqueado)`, 'Ejecuta git status a mano y repite taskctl doctor cuando responda.');
    }
    if (r.error !== undefined || r.status !== 0) {
        const causa = una(r.error?.message ?? r.stderr);
        if (/lock/i.test(causa)) {
            return aviso('workspace', `no se pudo comprobar el workspace porque Git esta bloqueado (${causa})`, 'Espera a que termine la otra operacion de Git y repite taskctl doctor; si no hay ninguna, borra el .git/index.lock huerfano.');
        }
        return fallo('workspace', `git status fallo (${causa})`, 'Ejecuta git status en el proyecto y resuelve lo que diga.');
    }
    if (r.stdout === '')
        return ok('workspace', 'el workspace esta limpio');
    const n = r.stdout.split(/\r?\n/).length;
    return aviso('workspace', `el workspace tiene ${n} ${n === 1 ? 'cambio' : 'cambios'} sin commitear (los comandos que escriben exigen un arbol limpio)`, 'git status ; commitea o aparca lo pendiente (git stash -u) antes de taskctl start o finish.');
}
// ---------------------------------------------------------------------
// Configuracion
// ---------------------------------------------------------------------
function comprobarConfig(cwd) {
    try {
        const { config, avisos } = resolverConfigConAvisos(cwd);
        const cs = [ok('config', '.taskcode/config.yml es valida (o no existe: valores por defecto)')];
        if (avisos.length === 0)
            cs.push(ok('config-claves', 'sin claves desconocidas'));
        else
            for (const a of avisos) {
                cs.push(aviso('config-claves', sinPrefijo(a), 'Corrige o borra esa clave en .taskcode/config.yml: se ignora y puede ser una errata.'));
            }
        return { cs, cfg: config };
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
            cs: [
                fallo('config', sinPrefijo(msg), 'Corrige .taskcode/config.yml segun el mensaje (o borralo para usar los valores por defecto).'),
                omitida('config-claves', 'la config no se pudo leer (ver config)'),
            ],
            cfg: null,
        };
    }
}
/**
 * TASK-070: si el proyecto declara como se verifica. Solo informa: no ejecuta
 * el comando (eso es de los frenos).
 *
 * Sin la clave, depende de si el proyecto tiene tests (TASK-088, que matiza a
 * proposito la decision de TASK-070):
 * - Sin tests detectables en la raiz: `omitida`, como en TASK-070. Un proyecto
 *   sin tests no esta mal configurado, y un aviso permanente en cada repo que
 *   no los use dejaria de leerse. El arreglo va en el mensaje.
 * - Con tests detectables: `aviso` con el comando propuesto. Ahi si esta mal
 *   configurado: los frenos (hook Stop, puerta de finish, guardian de merges)
 *   no actuan aunque haya con que verificar.
 *
 * `detectar` solo se llama cuando falta la clave: la lectura de disco no se
 * paga en los proyectos ya configurados.
 */
export function comprobarVerificacion(cfg, detectar = () => []) {
    if (cfg === null)
        return omitida('verificacion', 'config invalida: no se sabe como se verifica el proyecto (ver config)');
    if (cfg.comando_verificacion === null) {
        const detectados = detectar();
        const propuesto = comandoPropuesto(detectados);
        if (propuesto !== null) {
            return aviso('verificacion', `sin comando_verificacion y el proyecto tiene tests (${detectados.map((d) => d.motivo).join(', ')}): ` +
                'los frenos de verificacion no actuan', `Declara en .taskcode/config.yml: comando_verificacion: "${propuesto}"`);
        }
        return omitida('verificacion', 'sin comando_verificacion: los frenos de verificacion no actuan. Para activarlos, declara en ' +
            '.taskcode/config.yml: comando_verificacion: "<tu comando de tests>"');
    }
    return ok('verificacion', `comando_verificacion: "${una(cfg.comando_verificacion)}" (timeout ${cfg.timeout_verificacion} s)`);
}
/**
 * TASK-091: la verificacion selectiva por impacto. Solo dice algo cuando hay
 * completa (sin ella la comprobacion `verificacion` ya cuenta lo que falta,
 * y la config no admite selectiva sin completa):
 * - Completa sin selectiva: `aviso`, con el arreglo en la misma linea. Cada
 *   fin de turno y cada ronda corren entonces la suite entera.
 * - Las dos: `ok` con el comando y su timeout.
 * Es una comprobacion aparte para que `verificacion` no cambie de nivel.
 */
export function comprobarVerificacionSelectiva(cfg) {
    if (cfg === null || cfg.comando_verificacion === null)
        return [];
    if (cfg.comando_verificacion_selectiva === null) {
        const arreglo = 'declara en .taskcode/config.yml comando_verificacion_selectiva: "<script que corre solo lo afectado ' +
            'respecto a $RAMA_BASE>" (guia: skill task-workflow, verificacion-selectiva.md)';
        return [
            aviso('verificacion-selectiva', 'sin comando_verificacion_selectiva: cada fin de turno corre la verificacion completa; para ' +
                `acelerarlo, ${arreglo}`, arreglo.charAt(0).toUpperCase() + arreglo.slice(1)),
        ];
    }
    const selectiva = `comando_verificacion_selectiva: "${una(cfg.comando_verificacion_selectiva)}" ` +
        `(timeout ${cfg.timeout_verificacion_selectiva} s)`;
    if (comandoParcial(cfg) === null) {
        return [ok('verificacion-selectiva', `${selectiva}; la completa sigue siendo la puerta de finish`)];
    }
    // TASK-109: sin rutas de documentacion la decision proporcional no se calcula
    // y el nivel 2 nunca se activa: la clave pareceria hacer algo sin hacerlo.
    if (!documentacionDeclarada(cfg)) {
        const arreglo = 'declara tambien rutas_documentacion en .taskcode/config.yml (p. ej. rutas_documentacion: [docs/**, README.md]) ' +
            'o borra rutas_verificacion_parcial';
        return [
            aviso('verificacion-selectiva', `${selectiva}; rutas_verificacion_parcial no tiene efecto sin rutas_documentacion: ${arreglo}`, arreglo.charAt(0).toUpperCase() + arreglo.slice(1)),
        ];
    }
    return [
        ok('verificacion-selectiva', `${selectiva}; con rutas_verificacion_parcial, finish integra con ella si todo el codigo cae en esas ` +
            'rutas; un merge a mano sigue exigiendo la completa'),
    ];
}
// ---------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------
function codigoDe(e) {
    return typeof e === 'object' && e !== null ? e.code : undefined;
}
/** Recorrido propio de tareas/ (ver cabecera): lo que `listTareasEnEstados` esconde, aqui se dice. */
function comprobarTareas(tareasRoot) {
    if (!existsSync(tareasRoot))
        return [omitida('tareas', 'no hay carpeta tareas/ (ver tareas-carpetas)')];
    const problemas = [];
    const carpetasDe = new Map();
    let total = 0;
    for (const estado of TASK_STATES) {
        const carpeta = STATE_FOLDER[estado];
        const dir = path.join(tareasRoot, carpeta);
        let entradas;
        try {
            entradas = readdirSync(dir).sort();
        }
        catch (e) {
            if (codigoDe(e) === 'ENOENT')
                continue;
            problemas.push(fallo(`tareas:${carpeta}`, `no se pudo leer tareas/${carpeta}/ (${una(e instanceof Error ? e.message : String(e))})`, `Revisa los permisos de tareas/${carpeta}.`));
            continue;
        }
        for (const id of entradas) {
            if (!isValidTaskId(id))
                continue;
            total++;
            carpetasDe.set(id, [...(carpetasDe.get(id) ?? []), carpeta]);
            const rel = `tareas/${carpeta}/${id}/tarea.md`;
            let contenido;
            try {
                contenido = readFileSync(path.join(dir, id, 'tarea.md'), 'utf8');
            }
            catch (e) {
                if (codigoDe(e) === 'ENOENT') {
                    problemas.push(fallo(`tarea:${id}:sin-tarea-md`, `${id}: la carpeta ${rel.replace('/tarea.md', '')} no tiene tarea.md`, `Restaura el fichero (git checkout -- ${rel}) o, si la carpeta sobra, borrala: rmdir tareas/${carpeta}/${id}`));
                }
                else {
                    problemas.push(fallo(`tarea:${id}:ilegible`, `${id}: no se pudo leer ${rel} (${una(e instanceof Error ? e.message : String(e))})`, `Revisa los permisos y que ${rel} es un fichero.`));
                }
                continue;
            }
            let task;
            try {
                task = parseTareaFile(contenido).task;
            }
            catch (e) {
                problemas.push(fallo(`tarea:${id}:ilegible`, `${id}: ${rel} no se puede leer ni validar (${una(e instanceof Error ? e.message : String(e))})`, `Corrige el frontmatter de ${rel} segun esa causa (o restaura la version buena: git checkout -- ${rel}).`));
                continue;
            }
            if (task.id !== id) {
                problemas.push(fallo(`tarea:${id}:id`, `${id}: ${rel} dice id "${task.id}", distinto del nombre de su carpeta`, `Pon "id: ${id}" en el frontmatter de ${rel}, o renombra la carpeta.`));
                continue;
            }
            if (task.estado !== estado) {
                problemas.push(fallo(`tarea:${id}:estado`, `${id}: esta en ${carpeta}/ pero su estado es "${task.estado}"`, `Si la carpeta es la correcta, pon "estado: ${estado}" en ${rel}; si lo es el estado, muevela: ` +
                    `git mv tareas/${carpeta}/${id} tareas/${STATE_FOLDER[task.estado]}/${id}`));
            }
        }
    }
    for (const [id, carpetas] of carpetasDe) {
        if (carpetas.length < 2)
            continue;
        problemas.push(fallo(`tarea:${id}:duplicado`, `${id} esta en ${carpetas.length} carpetas a la vez: ${carpetas.join(', ')}`, `Deja una sola copia: mira cual es la vigente (git log --oneline -- tareas/*/${id}) y borra la otra: git rm -r tareas/${carpetas[0]}/${id}`));
    }
    if (problemas.length > 0)
        return problemas;
    return [ok('tareas', total === 0 ? 'no hay tareas todavia' : `${total} ${total === 1 ? 'tarea' : 'tareas'}: todas legibles y en la carpeta de su estado`)];
}
// ---------------------------------------------------------------------
// Plataforma (gh / glab)
// ---------------------------------------------------------------------
function comprobarPlataforma(cwd, cfg, hayOrigin, timeoutMs) {
    if (cfg === null)
        return omitida('plataforma', 'config invalida: no se sabe si hace falta gh o glab (ver config)');
    const aplica = cfg.cierre_por_defecto === 'merge-request' || cfg.plataforma_remota !== null;
    if (!aplica) {
        return omitida('plataforma', 'no hay merge request por defecto ni plataforma declarada en la config: no hace falta gh ni glab');
    }
    if (!hayOrigin)
        return omitida('plataforma', 'sin remoto "origin" no hay plataforma que comprobar (ver origin)');
    const d = resolverRemotoDeOrigin(cwd, cfg);
    if (!d.ok) {
        return fallo('plataforma', una(d.mensaje), 'Apunta origin a github.com o a un host de GitLab, o declara la plataforma en .taskcode/config.yml ' +
            '("plataforma_remota: gitlab" y, si cuelga de una ruta, "url_base_remoto").');
    }
    const cli = CLI_PLATAFORMA[d.remoto.plataforma];
    const s = sondearCli(d.remoto, cwd, timeoutMs);
    if (s.ok)
        return ok('plataforma', `"${cli}" instalado y con sesion en ${d.remoto.host}`);
    if (s.noVerificable) {
        return aviso('plataforma', `no se pudo verificar la sesion de "${cli}" (sin respuesta a tiempo o sin red): ${una(s.problema)}`, `Comprueba la conexion (VPN, proxy) y repite taskctl doctor; o a mano: ${cli} auth status`);
    }
    return fallo('plataforma', una(s.problema), `${s.ayuda}.`);
}
// ---------------------------------------------------------------------
// Hooks que alcanzan a los subagentes (TASK-076)
// ---------------------------------------------------------------------
const ARREGLO_HOOKS_SUBAGENTE = 'Con el modo de permisos automatico, Claude Code puede denegar el lanzamiento de subagentes (Auto-Mode Bypass) si un hook ' +
    'PreToolUse reescribe el encargo. Salidas: quita Agent y Task del matcher de ese hook (si es de un plugin, con ' +
    'un hook propio de SessionStart que lo reescriba al arrancar), desactiva el plugin causante en enabledPlugins, ' +
    'o sal del modo de permisos automatico y aprueba a mano cada lanzamiento. Ver "Problemas conocidos" en el README del plugin.';
/**
 * Siempre aviso como maximo: los ficheros son de terceros y el hook puede ser
 * inocuo. La sonda no lanza, asi que un fichero ajeno roto nunca acaba en el
 * `error` de `envolver`: se nombra en el mensaje y sigue.
 */
export function comprobarHooksSubagente(deps) {
    const s = sondearHooksClaude(deps.configClaudeDir ?? directorioConfigClaude(), deps.repoCwd);
    const cs = s.hallazgos.map((h) => aviso('hooks-subagente', una(`${h.origen} tiene un hook PreToolUse que alcanza a Agent/Task (matcher "${h.matcher}") en ${h.ruta}`), ARREGLO_HOOKS_SUBAGENTE));
    if (s.hooksDesactivadosEn !== null) {
        return [ok('hooks-subagente', una(`los hooks estan desactivados (disableAllHooks en ${s.hooksDesactivadosEn})`))];
    }
    const nota = s.ilegibles.length === 0 ? '' : `; sin leer: ${s.ilegibles.join('; ')}`;
    if (cs.length === 0) {
        cs.push(ok('hooks-subagente', una(`ningun hook PreToolUse alcanza a Agent/Task (${s.leidos} ficheros leidos${nota})`)));
    }
    else if (nota !== '') {
        // Con avisos, los ilegibles se siguen nombrando (revision ronda 1, MEN-4); no son un aviso mas.
        cs.push(omitida('hooks-subagente', una(`ficheros sin leer al buscar hooks${nota.replace(/^;/, ':')}`)));
    }
    return cs;
}
// ---------------------------------------------------------------------
// Version del plugin instalado (TASK-087)
// ---------------------------------------------------------------------
/**
 * Aviso como maximo, nunca error: no cambia el codigo de salida. Lo que no se
 * puede comprobar (plugin no instalado por Claude Code, sin copia local del
 * marketplace, JSON roto, version no semver) es `omitida`. Sin red: compara
 * con la copia local del marketplace, y el mensaje dice de cuando es.
 */
export function comprobarVersionPlugin(deps) {
    const id = 'version-plugin';
    try {
        const s = sondearVersionPlugin(deps.configClaudeDir ?? directorioConfigClaude(), deps.repoCwd);
        if (s.estado === 'no-comprobable')
            return omitida(id, una(`no se pudo comprobar: ${s.motivo}`));
        const copia = `la copia local del marketplace ${s.marketplace}` +
            (s.marketplaceActualizadoEn === null ? '' : ` (actualizada el ${s.marketplaceActualizadoEn})`);
        const d = compararVersiones(s.disponible, s.instalada);
        if (d > 0) {
            const clave = `${NOMBRE_PLUGIN}@${s.marketplace}`;
            return aviso(id, una(`plugin instalado ${s.instalada}, disponible ${s.disponible} en ${copia}`), `claude plugin marketplace update ${s.marketplace}\n` +
                `claude plugin update ${clave}\n` +
                'y reinicia Claude Code (dentro de una sesion: /plugin marketplace update y /plugin update).');
        }
        if (d < 0) {
            return ok(id, una(`plugin instalado ${s.instalada}, mas nuevo que ${s.disponible} de ${copia}: esa copia esta desfasada`));
        }
        return ok(id, una(`plugin instalado ${s.instalada}, al dia con ${copia}`));
    }
    catch (e) {
        // Una excepcion en `envolver` seria `error` y cambiaria el codigo de salida.
        return omitida(id, una(`no se pudo comprobar: ${e instanceof Error ? e.message : String(e)}`));
    }
}
// ---------------------------------------------------------------------
// Status line de Claude Code (TASK-110)
// ---------------------------------------------------------------------
/**
 * Sin flags SOLO mira y nunca da aviso ni error (no cambia el codigo de salida
 * ni los avisos que cuentan los demas tests): `ok` si esta, `omitida` con la
 * oferta si no. Con --instalar-status-line o --desinstalar-status-line, el
 * resultado de la accion: `error` si se pidio y no se pudo.
 */
export function comprobarStatusLine(deps, accion) {
    const id = 'status-line';
    const configDir = deps.configClaudeDir ?? directorioConfigClaude();
    if (accion !== 'mirar') {
        const r = accion === 'desinstalar'
            ? desinstalarStatusLine(configDir, deps.ahora ?? new Date())
            : instalarStatusLine(configDir, {
                reemplazar: accion === 'reemplazar',
                env: deps.env ?? process.env,
                ahora: deps.ahora ?? new Date(),
            });
        return r.tipo === 'rechazado' ? fallo(id, una(r.mensaje), r.arreglo) : ok(id, una(r.mensaje));
    }
    const s = sondearStatusLine(configDir);
    switch (s.estado) {
        case 'nuestra':
            return ok(id, una(`instalada en ${s.ruta}: Claude Code muestra en que va la tarea (${COMANDO_STATUS_LINE})`));
        case 'ausente':
            return omitida(id, 'no instalada. Para ver en Claude Code en que va la tarea en curso (fase, paso, x/N, minutos) sin preguntar ' +
                `al agente: taskctl doctor ${FLAG_INSTALAR_STATUS_LINE} (una vez, para todos los proyectos)`);
        case 'ajena':
            return omitida(id, una(`${s.ruta} ya tiene otra status line ("${s.comando}"): no se toca. Para sustituirla por la de taskctl ` +
                `(con copia; desinstalar la devuelve): taskctl doctor ${FLAG_INSTALAR_STATUS_LINE} ${FLAG_REEMPLAZAR_STATUS_LINE}`));
        case 'ilegible':
            return omitida(id, una(`no se pudo leer ${s.ruta}: ${s.motivo}`));
    }
}
// ---------------------------------------------------------------------
// Orquestacion
// ---------------------------------------------------------------------
export function runDoctorCommand(argv, deps) {
    rechazarFlagsDesconocidos(argv, FLAGS_DOCTOR, 'doctor', (m) => new DoctorCommandError(m));
    const sobra = argv.find((a) => !a.startsWith('-'));
    if (sobra !== undefined) {
        throw new DoctorCommandError(`[ERROR] taskctl doctor: no admite argumentos ("${sobra}"). Uso: taskctl doctor [--json].`);
    }
    const instalar = argv.includes(FLAG_INSTALAR_STATUS_LINE);
    const reemplazar = argv.includes(FLAG_REEMPLAZAR_STATUS_LINE);
    const desinstalar = argv.includes(FLAG_DESINSTALAR_STATUS_LINE);
    if (reemplazar && !instalar) {
        throw new DoctorCommandError(`[ERROR] taskctl doctor: ${FLAG_REEMPLAZAR_STATUS_LINE} solo vale junto a ${FLAG_INSTALAR_STATUS_LINE}. No se ha tocado nada.`);
    }
    if (instalar && desinstalar) {
        throw new DoctorCommandError(`[ERROR] taskctl doctor: ${FLAG_INSTALAR_STATUS_LINE} y ${FLAG_DESINSTALAR_STATUS_LINE} se excluyen. No se ha tocado nada.`);
    }
    const accionStatusLine = desinstalar ? 'desinstalar' : reemplazar ? 'reemplazar' : instalar ? 'instalar' : 'mirar';
    const json = argv.includes('--json');
    const cwd = deps.repoCwd;
    const tareasRoot = path.join(cwd, 'tareas');
    const cs = [];
    // Entorno
    cs.push(...envolver('node', comprobarNode));
    const gitC = envolver('git', () => comprobarGit(cwd));
    cs.push(...gitC);
    cs.push(...envolver('bash', () => comprobarBash(deps)));
    // La config se lee primero (las ramas y origin dependen de ella) y se muestra despues.
    let cfg = { ...CONFIG_DEFAULTS };
    let csConfig = [];
    csConfig = envolver('config', () => {
        const r = comprobarConfig(cwd);
        cfg = r.cfg;
        return r.cs;
    });
    // Repositorio
    let repo = { esRepo: false, conCommits: false };
    cs.push(...envolver('repo-git', () => {
        const r = comprobarRepo(cwd, gitC[0]?.nivel === 'ok');
        repo = r.repo;
        return r.cs;
    }));
    cs.push(...envolver('tareas-carpetas', () => comprobarCarpetas(tareasRoot)));
    cs.push(...envolver('rama-base', () => comprobarRamas(cwd, cfg === null ? null : cfg.rama_base, repo)));
    let hayOrigin = false;
    cs.push(...envolver('origin', () => {
        const r = comprobarOrigin(cwd, repo, cfg);
        hayOrigin = r.hay;
        return r.c;
    }));
    cs.push(...envolver('workspace', () => comprobarWorkspace(cwd, repo, deps.timeoutGitMs ?? TIMEOUT_GIT_MS)));
    cs.push(...csConfig);
    cs.push(...envolver('verificacion', () => comprobarVerificacion(cfg, () => detectarComandosTests(cwd))));
    cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
    cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
    cs.push(...envolver('plataforma', () => comprobarPlataforma(cwd, cfg, hayOrigin, deps.timeoutPlataformaMs ?? TIMEOUT_PLATAFORMA_MS)));
    cs.push(...envolver('hooks-subagente', () => comprobarHooksSubagente(deps)));
    cs.push(...envolver('version-plugin', () => comprobarVersionPlugin(deps)));
    cs.push(...envolver('status-line', () => comprobarStatusLine(deps, accionStatusLine)));
    return {
        comprobaciones: cs,
        codigo: codigoSalida(cs),
        salida: json ? formatearJson(cs) : formatearTexto(cs),
        json,
    };
}
