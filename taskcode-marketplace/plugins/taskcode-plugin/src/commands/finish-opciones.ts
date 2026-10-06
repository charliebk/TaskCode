/**
 * Opciones de cierre de `taskctl finish` (TASK-060): `--tag <nombre>`,
 * `--merge-request` y lo que cuelga de ellas. Vive aparte de finish.ts para
 * que ese fichero siga siendo el orquestador de siempre; aqui estan las
 * piezas, y las decisiones del plan que las gobiernan:
 *
 * - El tag es ANOTADO (mensaje = titulo de la tarea) y va sobre un commit
 *   calculado de forma explicita (`commitDeIntegracion`), nunca sobre HEAD.
 * - Un tag que ya existe BLOQUEA antes de mergear; pero en un reintento (el
 *   merge ya esta hecho) un tag que apunta al merge de ESTA tarea se salta y
 *   uno que apunta a otro sitio aborta.
 * - El tag solo se sube con `--push` y solo cuando la rama destino ya esta en
 *   origin con ese commit.
 * - `--merge-request`: el preflight (origin, plataforma, CLI, sesion) corre
 *   ANTES de subir nada, y nada de aqui imprime la URL de origin.
 */
import {
  hasOrigin,
  isValidTagName,
  tagCommit,
  tagRemoto,
  crearTagAnotado,
  pushTag,
  ramaRemotaContiene,
  urlsDeOrigin,
} from '../fs/git.js';
import { GitCommandError } from '../fs/git.js';
import { comprobarCli } from '../fs/merge-request.js';
import {
  detectarPlataforma,
  ocultarCredenciales,
  type RemotoPlataforma,
} from '../core/plataforma-remota.js';

export class FinishCommandError extends Error {}

/** Flags de `taskctl finish`: --push mas las dos opciones de cierre de TASK-060. */
export const FLAGS_FINISH: readonly string[] = ['--push', '-p', '--tag', '--merge-request'];

export interface FlagsCierre {
  tag: string | null;
  mergeRequest: boolean;
  /** argv sin `--tag <n>` ni `--merge-request`. */
  resto: string[];
}

/**
 * Saca `--tag <nombre>` / `--tag=<nombre>` y `--merge-request` de argv. Se
 * hace a mano (como `extraerPushFlag`) porque `--merge-request` es booleano
 * y `parseArgs` lo leeria como `--merge-request TASK-NNN`. Un `--tag` sin
 * nombre, o repetido, aborta: ignorarlo dejaria cerrar sin el tag pedido.
 */
export function extraerFlagsCierre(argv: readonly string[]): FlagsCierre {
  const resto: string[] = [];
  let tag: string | null = null;
  let mergeRequest = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (arg === '--merge-request') {
      mergeRequest = true;
      continue;
    }
    if (arg === '--tag' || arg.startsWith('--tag=')) {
      if (tag !== null) {
        throw new FinishCommandError('[ERROR] taskctl finish: "--tag" esta repetido; un cierre lleva un solo tag.');
      }
      let valor: string | undefined;
      if (arg === '--tag') {
        valor = argv[i + 1];
        i++;
      } else {
        valor = arg.slice('--tag='.length);
      }
      if (valor === undefined || valor.trim() === '' || (arg === '--tag' && valor.startsWith('--'))) {
        throw new FinishCommandError(
          '[ERROR] taskctl finish: "--tag" necesita un nombre: taskctl finish TASK-NNN --tag v1.2.0.'
        );
      }
      tag = valor;
      continue;
    }
    resto.push(arg);
  }
  return { tag, mergeRequest, resto };
}

// ---------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------

/** Que paso con la subida del tag (solo se intenta con `--push`). */
export type SubidaTag =
  | 'no-solicitada'
  | 'subido'
  | 'ya-en-remoto'
  | 'sin-remoto'
  | 'rama-no-publicada'
  | 'fallida';

export interface TagResultado {
  nombre: string;
  /** Commit sobre el que va el tag (SHA completo). */
  commit: string;
  /** true si ESTA invocacion lo creo (false: ya existia sobre ese commit). */
  creado: boolean;
  subida: SubidaTag;
  /** Rama que debia estar en origin para poder subirlo. */
  rama: string;
  /** Detalle legible de la subida cuando no fue `subido`/`no-solicitada`. */
  detalle: string | null;
}

/** El nombre vale para Git. Aborta sin tocar nada si no. */
export function validarNombreTag(nombre: string, id: string, cwd: string): void {
  if (!isValidTagName(nombre, cwd)) {
    throw new FinishCommandError(
      `[ERROR] ${id}: "${nombre}" no es un nombre de tag valido (git check-ref-format "refs/tags/<nombre>", ` +
        'y sin "-" inicial: se leeria como una opcion). Elige otro con --tag; no se ha tocado nada.'
    );
  }
}

/**
 * ANTES de mergear: el tag no puede existir ni en local ni en origin. Si hay
 * origin pero no responde, con `--push` se aborta (no se puede garantizar que
 * el nombre este libre justo antes de publicarlo) y sin el se avisa: el tag
 * se queda en local y la comprobacion remota se repetira al subirlo.
 */
export function comprobarTagLibre(
  nombre: string,
  id: string,
  push: boolean,
  cwd: string,
  onAviso: ((aviso: string) => void) | undefined
): void {
  if (tagCommit(nombre, cwd) !== null) {
    throw new FinishCommandError(
      `[ERROR] ${id}: el tag "${nombre}" ya existe en local. Elige otro nombre con --tag ` +
        '(o borra ese tag si es tuyo: git tag -d ' +
        `${nombre}); no se ha tocado nada.`
    );
  }
  const remoto = tagRemoto(nombre, cwd);
  if (remoto.estado === 'presente') {
    throw new FinishCommandError(
      `[ERROR] ${id}: el tag "${nombre}" ya existe en origin. Elige otro nombre con --tag; ` +
        'no se ha tocado nada.'
    );
  }
  if (remoto.estado === 'inalcanzable') {
    if (push) {
      throw new FinishCommandError(
        `[ERROR] ${id}: origin no responde y con --push no se puede comprobar que el tag "${nombre}" ` +
          'este libre en el remoto. Reintenta con red, o cierra sin --push; no se ha tocado nada.'
      );
    }
    onAviso?.(
      `${id}: origin no responde; el nombre del tag "${nombre}" solo se ha comprobado en local ` +
        '(se volvera a comprobar si lo subes).'
    );
  }
}

export type AccionTag = 'crear' | 'existe-local' | 'existe-remoto';

/**
 * Que hacer con el tag ya con el commit objetivo conocido (merge hecho). Un
 * tag que apunta a `commit` es el de esta tarea (reintento): se salta. Uno
 * que apunta a otro commit es ajeno y aborta. Lanza sin crear nada.
 */
export function planificarTag(nombre: string, commit: string, id: string, cwd: string): AccionTag {
  const local = tagCommit(nombre, cwd);
  if (local !== null) {
    if (local === commit) return 'existe-local';
    throw tagAjeno(nombre, id, 'en local');
  }
  const remoto = tagRemoto(nombre, cwd);
  if (remoto.estado === 'presente') {
    if (remoto.commit === commit) return 'existe-remoto';
    throw tagAjeno(nombre, id, 'en origin');
  }
  return 'crear';
}

function tagAjeno(nombre: string, id: string, donde: string): FinishCommandError {
  return new FinishCommandError(
    `[ERROR] ${id}: el tag "${nombre}" ya existe ${donde} y NO apunta al merge de esta tarea (es de otra ` +
      'cosa). No se toca. Elige otro nombre con --tag y reintenta taskctl finish: el merge ya hecho se reconoce ' +
      'y solo se pone el tag.'
  );
}

/** Crea el tag anotado si hace falta (segun `planificarTag`). */
export function ponerTag(
  nombre: string,
  commit: string,
  titulo: string,
  id: string,
  rama: string,
  cwd: string
): TagResultado {
  const accion = planificarTag(nombre, commit, id, cwd);
  if (accion === 'crear') crearTagAnotado(nombre, commit, titulo, cwd);
  return { nombre, commit, creado: accion === 'crear', subida: 'no-solicitada', rama, detalle: null };
}

/**
 * Sube el tag si hay `--push`, y solo si la rama destino YA esta en origin
 * con el commit del tag: publicar un tag sobre un commit que el remoto no
 * tiene en su rama es la forma de dejar un tag huerfano. Nunca lanza: un
 * fallo de subida llega al CLI como `fallida` (el cierre ya esta hecho).
 */
export function subirTag(tag: TagResultado, push: boolean, cwd: string): TagResultado {
  if (!push) return tag;
  const nombre = tag.nombre;
  try {
    const remoto = tagRemoto(nombre, cwd);
    if (remoto.estado === 'sin-origin' || remoto.estado === 'inalcanzable') {
      return {
        ...tag,
        subida: 'sin-remoto',
        detalle: 'no hay conexion con origin (sin remoto configurado, o red caida)',
      };
    }
    if (remoto.estado === 'presente') {
      if (remoto.commit === tag.commit) return { ...tag, subida: 'ya-en-remoto' };
      return {
        ...tag,
        subida: 'fallida',
        detalle: `el tag ya existe en origin sobre otro commit; no se sobrescribe`,
      };
    }
    if (!ramaRemotaContiene(tag.rama, tag.commit, cwd)) {
      return {
        ...tag,
        subida: 'rama-no-publicada',
        detalle: `"${tag.rama}" no esta en origin con ese commit`,
      };
    }
    pushTag(nombre, cwd);
    return { ...tag, subida: 'subido' };
  } catch (e: unknown) {
    const msg = e instanceof GitCommandError ? e.stderr.trim() || e.message : String(e);
    return { ...tag, subida: 'fallida', detalle: ocultarCredenciales(msg) };
  }
}

// ---------------------------------------------------------------------
// Merge request
// ---------------------------------------------------------------------

/**
 * Preflight de `--merge-request`, ANTES de subir nada: hay origin, su host es
 * de una plataforma conocida y el CLI de esa plataforma esta instalado y con
 * sesion. Cada fallo dice que instalar o configurar. Ningun mensaje lleva la
 * URL de origin, solo (como mucho) su host.
 */
export function preflightMergeRequest(id: string, cwd: string): RemotoPlataforma {
  if (!hasOrigin(cwd)) {
    throw new FinishCommandError(
      `[ERROR] ${id}: --merge-request necesita un remoto "origin" y este repo no tiene ninguno. ` +
        'Configuralo (git remote add origin <url>) o cierra con merge normal; no se ha subido nada.'
    );
  }
  let hostDesconocido: string | null = null;
  for (const url of urlsDeOrigin(cwd)) {
    const d = detectarPlataforma(url);
    if (d.ok) {
      const cli = comprobarCli(d.remoto, cwd);
      if (!cli.ok) {
        throw new FinishCommandError(`[ERROR] ${id}: --merge-request: ${cli.mensaje} No se ha subido nada.`);
      }
      return d.remoto;
    }
    if (d.host !== null && hostDesconocido === null) hostDesconocido = d.host;
  }
  throw new FinishCommandError(
    hostDesconocido === null
      ? `[ERROR] ${id}: --merge-request: "origin" no apunta a una URL de red (https o ssh) de GitHub ` +
          'ni de GitLab, asi que no se sabe que CLI usar. Apunta origin a github.com (gh) o a un host de ' +
          'GitLab (glab), o cierra con merge normal; no se ha subido nada.'
      : `[ERROR] ${id}: --merge-request: el host de origin ("${hostDesconocido}") no es github.com ni un host ` +
          'de GitLab (su nombre debe contener "gitlab"), asi que no se sabe que CLI usar. No se supone ' +
          'GitLab. Usa un origin de github.com (gh) o de un host de GitLab (glab), o cierra con merge ' +
          'normal; no se ha subido nada.'
  );
}
