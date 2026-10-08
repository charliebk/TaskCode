/**
 * Lanzamiento de `gh` / `glab` (TASK-060): comprobar que estan instalados y
 * autenticados, listar el PR/MR de una rama y abrir uno. La logica de
 * decidir (que plataforma, que significa cada estado) vive en
 * core/plataforma-remota.ts; aqui solo se ejecuta.
 *
 * Como se lanzan, y por que:
 *
 * - `spawnSync` con ARRAY de argumentos y SIN shell, nunca `shell: true`:
 *   titulo de la tarea, rama y host salen de ficheros y de la persona, y con
 *   shell serian una puerta a la inyeccion de comandos. El texto libre va en
 *   la forma `--flag=valor` (un valor que empieza por "-" no se confunde con
 *   un flag) y la rama y la base, ya validadas por Git, van como valor de su
 *   flag.
 * - Esto funciona en Windows nativo porque `gh` y `glab` se instalan como
 *   `.exe` (a diferencia de `codex`, un paquete npm que llega como
 *   `codex.cmd` y obligo a `shell: true`, ver runCodexReview en git.ts).
 *   Quien tenga un shim `.cmd` en su lugar recibira "no instalado": asi se
 *   prefiere a abrir una shell con argumentos de entrada.
 * - stdin ignorado y `GH_PROMPT_DISABLED`: nada de preguntas interactivas.
 * - Todo lo que sale de estos programas se pasa por `ocultarCredenciales`
 *   antes de llegar a un mensaje: a veces repiten la URL del remoto.
 * - TASK-061, GitLab declarado en config: `contextoGlab` es el UNICO sitio
 *   que produce `-R <proyecto>` y `GITLAB_HOST=<base>`, y lo usan por igual
 *   la comprobacion de sesion, el estado y la creacion: si cada una lo
 *   compusiera por su cuenta, un proyecto mal deducido abriria un MR y
 *   consultaria otro. `GITLAB_HOST` se fija en CADA llamada y el que traiga
 *   el entorno (y sus alias) se descarta, porque un host heredado abriria el
 *   MR en otro servidor; `GITLAB_TOKEN` si se hereda y nunca se imprime.
 *   Sin declaracion no se anade nada: lo de la 0.6.0.
 */
import { spawnSync } from 'node:child_process';
import { CLI_PLATAFORMA, esUrlPublicable, interpretarListado, ocultarCredenciales, urlDeSalidaDeCreacion, } from '../core/plataforma-remota.js';
export class MergeRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MergeRequestError';
    }
}
const TIMEOUT_MS = 120_000;
const MAX_BUFFER = 16 * 1024 * 1024;
/** Variables con las que glab elige instancia: ninguna se hereda cuando la base esta declarada. */
const VARIABLES_HOST_GLAB = ['GITLAB_HOST', 'GL_HOST', 'GITLAB_URI', 'GITLAB_API_HOST'];
/** El unico productor de `-R` y `GITLAB_HOST` (ver cabecera). */
function contextoGlab(remoto) {
    const d = remoto.declarado;
    return d === undefined
        ? { repo: [], gitlabHost: undefined, endpointMr: undefined }
        : {
            repo: ['-R', d.proyecto],
            gitlabHost: d.base,
            endpointMr: `projects/${encodeURIComponent(d.proyecto)}/merge_requests`,
        };
}
function entornoDe(gitlabHost) {
    const env = { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' };
    if (gitlabHost === undefined)
        return env;
    // Windows ignora las mayusculas en el entorno pero el objeto copiado no.
    for (const k of Object.keys(env)) {
        if (VARIABLES_HOST_GLAB.includes(k.toUpperCase()))
            delete env[k];
    }
    env['GITLAB_HOST'] = gitlabHost;
    return env;
}
function lanzar(cli, args, cwd, gitlabHost) {
    return spawnSync(cli, args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
        env: entornoDe(gitlabHost),
    });
}
/** Lo que dijo el CLI por stderr (o stdout), limpio y de una linea para un mensaje. */
function detalle(r) {
    const t = ocultarCredenciales(`${r.stderr ?? ''}${r.stdout ?? ''}`).trim();
    return t === '' ? '(sin salida)' : t.split(/\r?\n/).slice(0, 4).join(' | ');
}
/** Nombre de la instancia como lo entiende `glab auth login --hostname`: host y, si la hay, su ruta. */
function hostnameGlab(r) {
    return r.declarado === undefined ? r.host : r.declarado.base.replace(/^https:\/\//, '');
}
function ayudaInstalacion(r) {
    if (r.plataforma === 'github')
        return 'Instala GitHub CLI (https://cli.github.com) y ejecuta "gh auth login"';
    const login = `Instala GitLab CLI (https://gitlab.com/gitlab-org/cli) y ejecuta "glab auth login --hostname ${hostnameGlab(r)}"`;
    return r.declarado === undefined ? login : `${login} (o define la variable de entorno GITLAB_TOKEN)`;
}
/**
 * El CLI de la plataforma, instalado y autenticado en el host de origin. No
 * hay `--version`: lanzar el CLI para `auth status` ya distingue "no existe"
 * (error de lanzamiento) de "no hay sesion" (sale con codigo != 0).
 */
export function comprobarCli(remoto, cwd) {
    const cli = CLI_PLATAFORMA[remoto.plataforma];
    // Con la instancia declarada la sesion se comprueba con una llamada real,
    // `glab api user`: `auth status` ignora GITLAB_TOKEN y daria por rota una
    // sesion por token que funciona (evidencia-glab-subpath, pruebas 2 y 3). Su
    // salida (el usuario) no se lee ni se muestra.
    const r = remoto.declarado === undefined
        ? lanzar(cli, ['auth', 'status', '--hostname', remoto.host], cwd)
        : lanzar(cli, ['api', 'user'], cwd, contextoGlab(remoto).gitlabHost);
    if (r.error) {
        return {
            ok: false,
            motivo: 'no-instalado',
            mensaje: `no se pudo ejecutar "${cli}" (${r.error.message}). ${ayudaInstalacion(remoto)}.`,
        };
    }
    if (r.status !== 0) {
        return {
            ok: false,
            motivo: 'sin-autenticar',
            mensaje: remoto.declarado === undefined
                ? `"${cli}" no esta autenticado en ${remoto.host} (${detalle(r)}). ${ayudaInstalacion(remoto)}.`
                : `"${cli}" no tiene sesion valida en ${hostnameGlab(remoto)} o la instancia no responde ` +
                    `(${detalle(r)}). ${ayudaInstalacion(remoto)}.`,
        };
    }
    return { ok: true };
}
/**
 * Estado del PR/MR de una rama, preguntado a la plataforma por NOMBRE de rama
 * (no por la URL anotada en tarea.md, que es solo informativa). Nunca lanza:
 * un fallo es `desconocido`, y quien llama aborta sin tocar nada.
 */
export function estadoMergeRequest(remoto, rama, cwd) {
    const cli = CLI_PLATAFORMA[remoto.plataforma];
    const ctx = contextoGlab(remoto);
    const args = remoto.plataforma === 'github'
        ? [
            'pr',
            'list',
            `--head=${rama}`,
            '--state=all',
            '--limit=100',
            '--json=number,state,url,baseRefName,headRefName,headRefOid,mergeCommit',
        ]
        : ['mr', 'list', ...ctx.repo, `--source-branch=${rama}`, '--all', '--per-page=100', '--output=json'];
    const r = lanzar(cli, args, cwd, ctx.gitlabHost);
    if (r.error)
        return { tipo: 'desconocido', motivo: `no se pudo ejecutar "${cli}": ${r.error.message}` };
    if (r.status !== 0) {
        return { tipo: 'desconocido', motivo: `"${cli}" fallo al listar (${detalle(r)})` };
    }
    return interpretarListado(remoto.plataforma, r.stdout ?? '', rama);
}
/**
 * Con GitLab declarado el MR se crea por la API REST (`glab api ... --method=POST`) y no
 * con `glab mr create`: este ultimo exige que algun remoto de Git "corresponda" a
 * `GITLAB_HOST` y compara solo el host, asi que con una instancia bajo una ruta
 * (`GITLAB_HOST=https://host/ruta/gitlab`) aborta siempre, aunque se pase `-R`
 * (glab 1.102.0 real). `glab api` no mira los remotos y respeta la ruta. Un solo camino
 * para instancia con o sin ruta. Cada campo va como `--raw-field=clave=valor` (un solo
 * argv, sin shell): un titulo que empiece por "-" o lleve comillas no se lee como flag.
 */
function argsCrearPorApi(endpoint, p) {
    return [
        'api',
        endpoint,
        '--method=POST',
        `--raw-field=source_branch=${p.rama}`,
        `--raw-field=target_branch=${p.base}`,
        `--raw-field=title=${p.titulo}`,
        `--raw-field=description=${p.cuerpo}`,
    ];
}
/** `web_url` del JSON que devuelve la creacion por API, o null si no es una URL publicable. */
function webUrlDeRespuesta(stdout) {
    try {
        const o = JSON.parse(stdout);
        const url = typeof o === 'object' && o !== null ? o['web_url'] : null;
        return esUrlPublicable(url) ? url : null;
    }
    catch {
        return null;
    }
}
/** Abre el PR/MR y devuelve su URL. Lanza MergeRequestError si el CLI falla. */
export function abrirMergeRequest(remoto, peticion, cwd) {
    const cli = CLI_PLATAFORMA[remoto.plataforma];
    const ctx = contextoGlab(remoto);
    const args = remoto.plataforma === 'github'
        ? [
            'pr',
            'create',
            `--base=${peticion.base}`,
            `--head=${peticion.rama}`,
            `--title=${peticion.titulo}`,
            `--body=${peticion.cuerpo}`,
        ]
        : [
            'mr',
            'create',
            `--target-branch=${peticion.base}`,
            `--source-branch=${peticion.rama}`,
            `--title=${peticion.titulo}`,
            `--description=${peticion.cuerpo}`,
            '--yes',
        ];
    const r = lanzar(cli, ctx.endpointMr === undefined ? args : argsCrearPorApi(ctx.endpointMr, peticion), cwd, ctx.gitlabHost);
    if (r.error)
        throw new MergeRequestError(`no se pudo ejecutar "${cli}": ${r.error.message}`);
    if (r.status !== 0) {
        throw new MergeRequestError(`"${cli}" no pudo crear el merge request (${detalle(r)})`);
    }
    const url = ctx.endpointMr === undefined ? urlDeSalidaDeCreacion(r.stdout ?? '') : webUrlDeRespuesta(r.stdout ?? '');
    if (url === null || !esUrlPublicable(url)) {
        throw new MergeRequestError(`"${cli}" termino bien pero no devolvio la URL del merge request (salida: ${detalle(r)})`);
    }
    return url;
}
