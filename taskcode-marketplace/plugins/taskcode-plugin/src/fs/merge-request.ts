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
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  CLI_PLATAFORMA,
  esUrlPublicable,
  interpretarListado,
  ocultarCredenciales,
  urlDeSalidaDeCreacion,
  type EstadoMergeRequest,
  type RemotoPlataforma,
} from '../core/plataforma-remota.js';

export class MergeRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MergeRequestError';
  }
}

const TIMEOUT_MS = 120_000;
const MAX_BUFFER = 16 * 1024 * 1024;

/** Variables con las que glab elige instancia: ninguna se hereda cuando la base esta declarada. */
const VARIABLES_HOST_GLAB: readonly string[] = ['GITLAB_HOST', 'GL_HOST', 'GITLAB_URI', 'GITLAB_API_HOST'];

interface ContextoGlab {
  /** `-R <proyecto>` (vacio sin declaracion). */
  repo: readonly string[];
  /** Valor fijado de `GITLAB_HOST` (undefined sin declaracion: no se toca el entorno). */
  gitlabHost: string | undefined;
  /** Endpoint REST de los MR del proyecto (`projects/<ruta%2Fcodificada>/merge_requests`); undefined sin declaracion. */
  endpointMr: string | undefined;
}

/** El unico productor de `-R` y `GITLAB_HOST` (ver cabecera). */
function contextoGlab(remoto: RemotoPlataforma): ContextoGlab {
  const d = remoto.declarado;
  return d === undefined
    ? { repo: [], gitlabHost: undefined, endpointMr: undefined }
    : {
        repo: ['-R', d.proyecto],
        gitlabHost: d.base,
        endpointMr: `projects/${encodeURIComponent(d.proyecto)}/merge_requests`,
      };
}

function entornoDe(gitlabHost: string | undefined): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' };
  if (gitlabHost === undefined) return env;
  // Windows ignora las mayusculas en el entorno pero el objeto copiado no.
  for (const k of Object.keys(env)) {
    if (VARIABLES_HOST_GLAB.includes(k.toUpperCase())) delete env[k];
  }
  env['GITLAB_HOST'] = gitlabHost;
  return env;
}

function lanzar(
  cli: string,
  args: readonly string[],
  cwd: string,
  gitlabHost?: string,
  timeoutMs: number = TIMEOUT_MS
): SpawnSyncReturns<string> {
  return spawnSync(cli, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
    maxBuffer: MAX_BUFFER,
    env: entornoDe(gitlabHost),
  });
}

/** Lo que dijo el CLI por stderr (o stdout), limpio y de una linea para un mensaje. */
function detalle(r: SpawnSyncReturns<string>): string {
  const t = ocultarCredenciales(`${r.stderr ?? ''}${r.stdout ?? ''}`).trim();
  return t === '' ? '(sin salida)' : t.split(/\r?\n/).slice(0, 4).join(' | ');
}

/** Nombre de la instancia como lo entiende `glab auth login --hostname`: host y, si la hay, su ruta. */
function hostnameGlab(r: RemotoPlataforma): string {
  return r.declarado === undefined ? r.host : r.declarado.base.replace(/^https:\/\//, '');
}

function ayudaInstalacion(r: RemotoPlataforma): string {
  if (r.plataforma === 'github') return 'Instala GitHub CLI (https://cli.github.com) y ejecuta "gh auth login"';
  const login = `Instala GitLab CLI (https://gitlab.com/gitlab-org/cli) y ejecuta "glab auth login --hostname ${hostnameGlab(r)}"`;
  return r.declarado === undefined ? login : `${login} (o define la variable de entorno GITLAB_TOKEN)`;
}

export type ResultadoPreflightCli =
  | { ok: true }
  | { ok: false; motivo: 'no-instalado' | 'sin-autenticar'; mensaje: string };

/**
 * Lo que sabe la comprobacion de sesion, sin componer el mensaje (TASK-062:
 * `taskctl doctor` necesita el problema y la ayuda por separado, y saber si
 * el fallo es de red y no de sesion). `noVerificable`: el CLI no contesto a
 * tiempo o el fallo habla de red (DNS, conexion, TLS), asi que no se sabe si
 * la sesion es buena. `comprobarCli` no lo usa: para `finish` sigue siendo
 * un fallo, como en la 0.6.0.
 */
export type ResultadoSondaCli =
  | { ok: true }
  | {
      ok: false;
      motivo: 'no-instalado' | 'sin-autenticar';
      /** Que paso, sin la ayuda ni el punto final. */
      problema: string;
      /** Que instalar o ejecutar. */
      ayuda: string;
      noVerificable: boolean;
    };

/** Un texto de error de gh/glab que habla de red y no de credenciales. */
const FALLO_DE_RED_RE =
  /dial tcp|no such host|timed? ?out|timeout|connection (refused|reset)|network is unreachable|unreachable|ECONN|ENOTFOUND|EAI_AGAIN|could not resolve|temporary failure in name resolution|tls handshake|x509|proxyconnect/i;

/**
 * El CLI de la plataforma, instalado y autenticado en el host de origin. No
 * hay `--version`: lanzar el CLI para `auth status` ya distingue "no existe"
 * (error de lanzamiento) de "no hay sesion" (sale con codigo != 0).
 * `timeoutMs` acorta la espera (doctor usa unos 10 s; finish, los 120 s).
 */
export function sondearCli(remoto: RemotoPlataforma, cwd: string, timeoutMs: number = TIMEOUT_MS): ResultadoSondaCli {
  const cli = CLI_PLATAFORMA[remoto.plataforma];
  // Con la instancia declarada la sesion se comprueba con una llamada real,
  // `glab api user`: `auth status` ignora GITLAB_TOKEN y daria por rota una
  // sesion por token que funciona (evidencia-glab-subpath, pruebas 2 y 3). Su
  // salida (el usuario) no se lee ni se muestra.
  const r =
    remoto.declarado === undefined
      ? lanzar(cli, ['auth', 'status', '--hostname', remoto.host], cwd, undefined, timeoutMs)
      : lanzar(cli, ['api', 'user'], cwd, contextoGlab(remoto).gitlabHost, timeoutMs);
  const ayuda = ayudaInstalacion(remoto);
  if (r.error) {
    const agotado = (r.error as NodeJS.ErrnoException).code === 'ETIMEDOUT';
    return {
      ok: false,
      motivo: 'no-instalado',
      problema: `no se pudo ejecutar "${cli}" (${r.error.message})`,
      ayuda,
      noVerificable: agotado,
    };
  }
  if (r.status !== 0) {
    const texto = detalle(r);
    return {
      ok: false,
      motivo: 'sin-autenticar',
      problema:
        remoto.declarado === undefined
          ? `"${cli}" no esta autenticado en ${remoto.host} (${texto})`
          : `"${cli}" no tiene sesion valida en ${hostnameGlab(remoto)} o la instancia no responde (${texto})`,
      ayuda,
      noVerificable: FALLO_DE_RED_RE.test(texto),
    };
  }
  return { ok: true };
}

export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPreflightCli {
  const r = sondearCli(remoto, cwd);
  if (r.ok) return { ok: true };
  return { ok: false, motivo: r.motivo, mensaje: `${r.problema}. ${r.ayuda}.` };
}

/**
 * Estado del PR/MR de una rama, preguntado a la plataforma por NOMBRE de rama
 * (no por la URL anotada en tarea.md, que es solo informativa). Nunca lanza:
 * un fallo es `desconocido`, y quien llama aborta sin tocar nada.
 */
export function estadoMergeRequest(remoto: RemotoPlataforma, rama: string, cwd: string): EstadoMergeRequest {
  const cli = CLI_PLATAFORMA[remoto.plataforma];
  const ctx = contextoGlab(remoto);
  const args =
    remoto.plataforma === 'github'
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
  if (r.error) return { tipo: 'desconocido', motivo: `no se pudo ejecutar "${cli}": ${r.error.message}` };
  if (r.status !== 0) {
    return { tipo: 'desconocido', motivo: `"${cli}" fallo al listar (${detalle(r)})` };
  }
  return interpretarListado(remoto.plataforma, r.stdout ?? '', rama);
}

export interface PeticionMergeRequest {
  rama: string;
  base: string;
  titulo: string;
  cuerpo: string;
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
function argsCrearPorApi(endpoint: string, p: PeticionMergeRequest): string[] {
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
function webUrlDeRespuesta(stdout: string): string | null {
  try {
    const o = JSON.parse(stdout) as unknown;
    const url = typeof o === 'object' && o !== null ? (o as Record<string, unknown>)['web_url'] : null;
    return esUrlPublicable(url) ? url : null;
  } catch {
    return null;
  }
}

/** Abre el PR/MR y devuelve su URL. Lanza MergeRequestError si el CLI falla. */
export function abrirMergeRequest(
  remoto: RemotoPlataforma,
  peticion: PeticionMergeRequest,
  cwd: string
): string {
  const cli = CLI_PLATAFORMA[remoto.plataforma];
  const ctx = contextoGlab(remoto);
  const args =
    remoto.plataforma === 'github'
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
  if (r.error) throw new MergeRequestError(`no se pudo ejecutar "${cli}": ${r.error.message}`);
  if (r.status !== 0) {
    throw new MergeRequestError(`"${cli}" no pudo crear el merge request (${detalle(r)})`);
  }
  const url = ctx.endpointMr === undefined ? urlDeSalidaDeCreacion(r.stdout ?? '') : webUrlDeRespuesta(r.stdout ?? '');
  if (url === null || !esUrlPublicable(url)) {
    throw new MergeRequestError(
      `"${cli}" termino bien pero no devolvio la URL del merge request (salida: ${detalle(r)})`
    );
  }
  return url;
}
