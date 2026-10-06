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

function lanzar(cli: string, args: readonly string[], cwd: string): SpawnSyncReturns<string> {
  return spawnSync(cli, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_BUFFER,
    env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' },
  });
}

/** Lo que dijo el CLI por stderr (o stdout), limpio y de una linea para un mensaje. */
function detalle(r: SpawnSyncReturns<string>): string {
  const t = ocultarCredenciales(`${r.stderr ?? ''}${r.stdout ?? ''}`).trim();
  return t === '' ? '(sin salida)' : t.split(/\r?\n/).slice(0, 4).join(' | ');
}

function ayudaInstalacion(r: RemotoPlataforma): string {
  return r.plataforma === 'github'
    ? 'Instala GitHub CLI (https://cli.github.com) y ejecuta "gh auth login"'
    : `Instala GitLab CLI (https://gitlab.com/gitlab-org/cli) y ejecuta "glab auth login --hostname ${r.host}"`;
}

export type ResultadoPreflightCli =
  | { ok: true }
  | { ok: false; motivo: 'no-instalado' | 'sin-autenticar'; mensaje: string };

/**
 * El CLI de la plataforma, instalado y autenticado en el host de origin. No
 * hay `--version`: lanzar el CLI para `auth status` ya distingue "no existe"
 * (error de lanzamiento) de "no hay sesion" (sale con codigo != 0).
 */
export function comprobarCli(remoto: RemotoPlataforma, cwd: string): ResultadoPreflightCli {
  const cli = CLI_PLATAFORMA[remoto.plataforma];
  const r = lanzar(cli, ['auth', 'status', '--hostname', remoto.host], cwd);
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
      mensaje: `"${cli}" no esta autenticado en ${remoto.host} (${detalle(r)}). ${ayudaInstalacion(remoto)}.`,
    };
  }
  return { ok: true };
}

/**
 * Estado del PR/MR de una rama, preguntado a la plataforma por NOMBRE de rama
 * (no por la URL anotada en tarea.md, que es solo informativa). Nunca lanza:
 * un fallo es `desconocido`, y quien llama aborta sin tocar nada.
 */
export function estadoMergeRequest(remoto: RemotoPlataforma, rama: string, cwd: string): EstadoMergeRequest {
  const cli = CLI_PLATAFORMA[remoto.plataforma];
  const args =
    remoto.plataforma === 'github'
      ? [
          'pr',
          'list',
          `--head=${rama}`,
          '--state=all',
          '--limit=100',
          '--json=number,state,url,baseRefName,headRefName,mergeCommit',
        ]
      : ['mr', 'list', `--source-branch=${rama}`, '--all', '--per-page=100', '--output=json'];
  const r = lanzar(cli, args, cwd);
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

/** Abre el PR/MR y devuelve su URL. Lanza MergeRequestError si el CLI falla. */
export function abrirMergeRequest(
  remoto: RemotoPlataforma,
  peticion: PeticionMergeRequest,
  cwd: string
): string {
  const cli = CLI_PLATAFORMA[remoto.plataforma];
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
  const r = lanzar(cli, args, cwd);
  if (r.error) throw new MergeRequestError(`no se pudo ejecutar "${cli}": ${r.error.message}`);
  if (r.status !== 0) {
    throw new MergeRequestError(`"${cli}" no pudo crear el merge request (${detalle(r)})`);
  }
  const url = urlDeSalidaDeCreacion(r.stdout ?? '');
  if (url === null || !esUrlPublicable(url)) {
    throw new MergeRequestError(
      `"${cli}" termino bien pero no devolvio la URL del merge request (salida: ${detalle(r)})`
    );
  }
  return url;
}
