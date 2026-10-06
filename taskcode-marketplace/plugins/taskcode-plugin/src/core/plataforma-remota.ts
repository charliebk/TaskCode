/**
 * Plataforma del remoto `origin` y lectura de lo que contestan `gh` y
 * `glab` (TASK-060). Puro: no lanza procesos ni toca disco; quien los
 * lanza es fs/merge-request.ts.
 *
 * Reglas que salen del plan de TASK-060 y que no se negocian aqui:
 *
 * - La plataforma se decide por el HOST de la URL: `github.com` -> gh; un
 *   host que contenga "gitlab" -> glab (gitlab.com y los autoalojados tipo
 *   gitlab.empresa.es). Cualquier otro host es DESCONOCIDO y se aborta
 *   nombrando que configurar: no se supone GitLab (decision de Carlos).
 * - La URL de origin puede llevar credenciales (`https://usuario:token@...`).
 *   Nada de este modulo la devuelve entera: solo el host, ya sin usuario, y
 *   `ocultarCredenciales` limpia cualquier texto ajeno antes de mostrarlo.
 */

export type Plataforma = 'github' | 'gitlab';

/** Ejecutable que gestiona cada plataforma. */
export const CLI_PLATAFORMA: Readonly<Record<Plataforma, string>> = {
  github: 'gh',
  gitlab: 'glab',
};

export interface RemotoPlataforma {
  plataforma: Plataforma;
  /** Solo el host, en minusculas y sin usuario ni puerto. */
  host: string;
}

/**
 * Host de una URL de remoto Git, o null si no es una URL de red (un
 * directorio local, una ruta de Windows, texto roto). Admite las formas
 * https/http/ssh/git con usuario, contrasena y puerto opcionales y la forma
 * scp (`git@host:grupo/repo.git`).
 */
export function hostDeRemoto(url: string): string | null {
  const texto = url.trim();
  const conEsquema = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/([^/?#]*)/.exec(texto);
  let host: string;
  if (conEsquema !== null) {
    // Autoridad = usuario[:contrasena]@host[:puerto]. El usuario puede
    // llevar un "@" sin codificar: manda el ULTIMO.
    const autoridad = conEsquema[1] as string;
    host = autoridad.slice(autoridad.lastIndexOf('@') + 1).replace(/:\d*$/, '');
  } else {
    // scp: [usuario@]host:ruta. Una letra de unidad (`C:\x`) o una ruta
    // local no son hosts.
    const scp = /^(?:[^@/\\:\s]+@)?([^@/\\:\s]+):(?!\/\/)/.exec(texto);
    if (scp === null || (scp[1] as string).length === 1) return null;
    host = scp[1] as string;
  }
  host = host.toLowerCase();
  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(host) ? host : null;
}

export type DeteccionPlataforma =
  | { ok: true; remoto: RemotoPlataforma }
  | { ok: false; motivo: 'sin-host' | 'host-desconocido'; host: string | null };

export function detectarPlataforma(url: string): DeteccionPlataforma {
  const host = hostDeRemoto(url);
  if (host === null) return { ok: false, motivo: 'sin-host', host: null };
  if (host === 'github.com') return { ok: true, remoto: { plataforma: 'github', host } };
  if (host.includes('gitlab')) return { ok: true, remoto: { plataforma: 'gitlab', host } };
  return { ok: false, motivo: 'host-desconocido', host };
}

/**
 * Sustituye `usuario:contrasena@` (o `token@`) de cualquier URL que aparezca
 * en un texto. Se aplica a TODO lo que viene de git, gh y glab antes de
 * mostrarlo: sus errores a veces repiten la URL del remoto.
 */
export function ocultarCredenciales(texto: string): string {
  return texto.replace(/([A-Za-z][A-Za-z0-9+.-]*:\/\/)[^/\s@]*@/g, '$1***@');
}

/** Una URL web de PR/MR que se puede mostrar y guardar: http(s), sin espacios ni usuario. */
export function esUrlPublicable(url: unknown): url is string {
  return typeof url === 'string' && /^https?:\/\/[^\s@]+$/.test(url);
}

/**
 * La URL que imprime `gh pr create` / `glab mr create`: la ULTIMA linea de
 * stdout que sea una URL publicable. null si no hay ninguna.
 */
export function urlDeSalidaDeCreacion(stdout: string): string | null {
  const lineas = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '');
  for (let i = lineas.length - 1; i >= 0; i--) {
    const m = /https?:\/\/\S+/.exec(lineas[i] as string);
    if (m !== null && esUrlPublicable(m[0])) return m[0];
  }
  return null;
}

export type EstadoMergeRequest =
  /** La plataforma no conoce ningun PR/MR de esa rama. */
  | { tipo: 'ninguno' }
  | { tipo: 'abierto'; url: string }
  /**
   * Mergeado, sea con merge, squash o rebase. `commit` es el que la
   * plataforma da como resultado (el de merge, o el squash); null si no lo
   * informa (glab con fast-forward). `headCommit` es la punta de la rama que la
   * plataforma integro (lo unico que discrimina con squash/rebase).
   */
  | { tipo: 'integrado'; url: string; base: string; commit: string | null; headCommit: string | null }
  | { tipo: 'cerrado'; url: string }
  /** No se pudo saber (red, error del CLI, salida que no se entiende). */
  | { tipo: 'desconocido'; motivo: string };

interface Candidato {
  estado: 'abierto' | 'integrado' | 'cerrado';
  url: string;
  base: string;
  commit: string | null;
  head: string | null;
}

const SHA = /^[0-9a-f]{7,64}$/i;

function texto(v: unknown): string | null {
  return typeof v === 'string' && v !== '' ? v : null;
}

function candidatosGithub(lista: readonly unknown[], rama: string): Candidato[] | string {
  const salida: Candidato[] = [];
  for (const e of lista) {
    if (typeof e !== 'object' || e === null) return 'una entrada del listado no es un objeto';
    const o = e as Record<string, unknown>;
    // --head filtra por nombre de rama a secas; se vuelve a comprobar por si
    // la plataforma devolviera de mas.
    if (texto(o['headRefName']) !== rama) continue;
    const estado = o['state'];
    const url = o['url'];
    const base = texto(o['baseRefName']);
    if (!esUrlPublicable(url) || base === null) return 'una entrada del listado no trae url o rama base';
    const merge = o['mergeCommit'];
    const oid =
      typeof merge === 'object' && merge !== null ? texto((merge as Record<string, unknown>)['oid']) : null;
    if (estado === 'OPEN') salida.push({ estado: 'abierto', url, base, commit: null, head: null });
    else if (estado === 'MERGED') {
      if (oid !== null && !SHA.test(oid)) return 'mergeCommit.oid no es un SHA';
      const head = texto(o['headRefOid']);
      if (head !== null && !SHA.test(head)) return 'headRefOid no es un SHA';
      salida.push({ estado: 'integrado', url, base, commit: oid, head });
    } else if (estado === 'CLOSED') salida.push({ estado: 'cerrado', url, base, commit: null, head: null });
    else return `estado de PR desconocido (${String(estado)})`;
  }
  return salida;
}

function candidatosGitlab(lista: readonly unknown[], rama: string): Candidato[] | string {
  const salida: Candidato[] = [];
  for (const e of lista) {
    if (typeof e !== 'object' || e === null) return 'una entrada del listado no es un objeto';
    const o = e as Record<string, unknown>;
    if (texto(o['source_branch']) !== rama) continue;
    const estado = o['state'];
    const url = o['web_url'];
    const base = texto(o['target_branch']);
    if (!esUrlPublicable(url) || base === null) return 'una entrada del listado no trae web_url o target_branch';
    if (estado === 'opened' || estado === 'locked') salida.push({ estado: 'abierto', url, base, commit: null, head: null });
    else if (estado === 'merged') {
      const oid = texto(o['merge_commit_sha']) ?? texto(o['squash_commit_sha']);
      if (oid !== null && !SHA.test(oid)) return 'merge_commit_sha no es un SHA';
      const head = texto(o['sha']);
      if (head !== null && !SHA.test(head)) return 'sha no es un SHA';
      salida.push({ estado: 'integrado', url, base, commit: oid, head });
    } else if (estado === 'closed') salida.push({ estado: 'cerrado', url, base, commit: null, head: null });
    else return `estado de MR desconocido (${String(estado)})`;
  }
  return salida;
}

/**
 * Lee el listado JSON de PR/MR de una rama (`gh pr list --state all --json
 * ...` / `glab mr list --all --output json`) y decide: abierto gana a
 * mergeado y mergeado a cerrado (una rama puede tener un PR cerrado de un
 * intento anterior y otro abierto). Cualquier cosa que no se entienda es
 * `desconocido`: nunca se supone "ninguno" ante una salida rara, porque
 * "ninguno" lleva a crear un PR.
 */
export function interpretarListado(plataforma: Plataforma, stdout: string, rama: string): EstadoMergeRequest {
  let datos: unknown;
  try {
    datos = JSON.parse(stdout.trim() === '' ? 'null' : stdout);
  } catch {
    return { tipo: 'desconocido', motivo: 'la salida del CLI no es JSON' };
  }
  // glab imprime "null" (no "[]") cuando no hay resultados en algunas versiones.
  if (datos === null) return { tipo: 'ninguno' };
  if (!Array.isArray(datos)) return { tipo: 'desconocido', motivo: 'la salida del CLI no es una lista' };
  const candidatos = plataforma === 'github' ? candidatosGithub(datos, rama) : candidatosGitlab(datos, rama);
  if (typeof candidatos === 'string') return { tipo: 'desconocido', motivo: candidatos };
  const abierto = candidatos.find((c) => c.estado === 'abierto');
  if (abierto !== undefined) return { tipo: 'abierto', url: abierto.url };
  const integrado = candidatos.find((c) => c.estado === 'integrado');
  if (integrado !== undefined) {
    return {
      tipo: 'integrado',
      url: integrado.url,
      base: integrado.base,
      commit: integrado.commit,
      headCommit: integrado.head,
    };
  }
  const cerrado = candidatos.find((c) => c.estado === 'cerrado');
  if (cerrado !== undefined) return { tipo: 'cerrado', url: cerrado.url };
  return { tipo: 'ninguno' };
}

/**
 * Seccion de `tarea.md` donde se anota el MR abierto. Es informativa y, a la
 * vez, la marca con la que un segundo `finish` sabe que debe consultar a la
 * plataforma en lugar de mergear en local; el ESTADO siempre lo da la
 * plataforma, nunca esta seccion.
 */
export const SECCION_MERGE_REQUEST = '## Merge request';

export function anotarMergeRequest(body: string, url: string, plataforma: Plataforma): string {
  const eol = body.includes('\r\n') ? '\r\n' : '\n';
  const base = body.replace(/(\r?\n)*$/, '');
  const bloque = [
    SECCION_MERGE_REQUEST,
    '',
    `- URL del merge request: ${url}`,
    `- Plataforma: ${plataforma}`,
  ].join(eol);
  return `${base}${base === '' ? '' : eol + eol}${bloque}${eol}`;
}

/** La URL anotada por `anotarMergeRequest`, o null si la tarea no tiene la seccion. */
export function urlMergeRequestAnotada(body: string): string | null {
  const lineas = body.split(/\r?\n/);
  let dentro = false;
  let enBloque = false;
  for (const l of lineas) {
    if (/^\s*(```|~~~)/.test(l)) enBloque = !enBloque;
    if (enBloque) continue;
    if (/^##?\s/.test(l)) dentro = l.trimEnd() === SECCION_MERGE_REQUEST;
    else if (dentro) {
      const m = /^- URL del merge request: (\S+)\s*$/.exec(l);
      if (m !== null && esUrlPublicable(m[1])) return m[1];
    }
  }
  return null;
}
