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
  /**
   * TASK-061. Solo con `plataforma_remota: gitlab` declarada en config:
   * `base` es la URL de la instancia (va en `GITLAB_HOST`, con su subruta si
   * la tiene) y `proyecto` la ruta del proyecto RELATIVA a esa base
   * (`grupo/subgrupo/repo`, va en `-R`). Sin declaracion no existe y rige la
   * deteccion por host de la 0.6.0, sin `GITLAB_HOST` ni `-R`.
   */
  declarado?: { base: string; proyecto: string };
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

// ---------------------------------------------------------------------
// TASK-061: instancia declarada en `.taskcode/config.yml`.
//
// Todo puro. Regla que atraviesa el bloque: NINGUNA funcion devuelve ni
// imprime la URL de origin entera ni su usuario/contrasena; lo mas que sale
// es `host/ruta` ya sin credenciales, y el proyecto relativo a la base.
// ---------------------------------------------------------------------

const HOST_VALIDO = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
const SEGMENTO_BASE = /^[A-Za-z0-9._~-]+$/;
const SEGMENTO_PROYECTO = /^[A-Za-z0-9_.][A-Za-z0-9_.-]*$/;

/** `host[:puerto]` (con o sin `usuario@` delante: manda el ULTIMO "@"). Puerto sin ceros a la izquierda. */
function partirAutoridad(autoridad: string): { host: string; puerto: string | null } | null {
  const m = /^([^:]+)(?::(\d*))?$/.exec(autoridad.slice(autoridad.lastIndexOf('@') + 1));
  if (m === null) return null;
  const host = (m[1] as string).toLowerCase();
  if (!HOST_VALIDO.test(host)) return null;
  const crudo = m[2] ?? '';
  if (crudo === '') return { host, puerto: null };
  const n = Number(crudo);
  if (n < 1 || n > 65535) return null;
  return { host, puerto: String(n) };
}

/** Segmentos no vacios de una ruta; null si trae `.` o `..`. */
function segmentosDeRuta(ruta: string): string[] | null {
  const segs = ruta.split('/').filter((s) => s !== '');
  return segs.some((s) => s === '.' || s === '..') ? null : segs;
}

export interface BaseNormalizada {
  /** `https://host[:puerto][/ruta]`: host en minusculas, sin puerto 443 ni barra final. */
  base: string;
  host: string;
  puerto: string | null;
  segmentos: string[];
}

export type ResultadoBase =
  | ({ ok: true } & BaseNormalizada)
  | { ok: false; motivo: 'credenciales' | 'no-https' | 'malformada' };

/**
 * Valida y normaliza una URL base de instancia GitLab. Rechaza lo que pueda
 * llevar credenciales (cualquier `@`), lo que no sea https, y lo que no sea
 * una URL limpia (sin consulta, fragmento, espacios ni segmentos raros).
 * Normaliza esquema y host a minusculas, quita el puerto 443 y las barras
 * finales o repetidas; la ruta conserva sus mayusculas.
 */
export function normalizarBase(texto: string): ResultadoBase {
  const t = texto.trim();
  if (t.includes('@')) return { ok: false, motivo: 'credenciales' };
  const m = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#\s]*)([^?#\s]*)$/.exec(t);
  if (m === null) return { ok: false, motivo: /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(t) ? 'malformada' : 'no-https' };
  if ((m[1] as string).toLowerCase() !== 'https') return { ok: false, motivo: 'no-https' };
  const aut = partirAutoridad(m[2] as string);
  const segs = segmentosDeRuta(m[3] as string);
  if (aut === null || segs === null || !segs.every((s) => SEGMENTO_BASE.test(s))) {
    return { ok: false, motivo: 'malformada' };
  }
  const puerto = aut.puerto === '443' ? null : aut.puerto;
  const base = `https://${aut.host}${puerto === null ? '' : `:${puerto}`}${segs.length === 0 ? '' : `/${segs.join('/')}`}`;
  return { ok: true, base, host: aut.host, puerto, segmentos: segs };
}

export interface PartesOrigin {
  /**
   * `https` compara puerto con la base. `http` compara la ruta pero no el puerto. `ssh` (ssh://,
   * git:// y scp) ni puerto ni ruta completa: su puerto no es el web y GitLab sirve ssh sin la
   * ruta de la instancia (ver proyectoDeRemoto).
   */
  esquema: 'https' | 'http' | 'ssh';
  host: string;
  /** Solo con esquema https (443 = null). */
  puerto: string | null;
  /** Ruta sin `.git` final, sin barras y troceada. */
  segmentos: string[];
}

/**
 * Host y ruta de una URL de origin: https/http/ssh/git con usuario, contrasena
 * y puerto, y la forma scp (`git@host:grupo/repo.git`). null si no es una URL
 * de red. Las credenciales se descartan aqui y no salen de la funcion.
 */
export function partesDeOrigin(url: string): PartesOrigin | null {
  const texto = url.trim();
  const conEsquema = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)/.exec(texto);
  let aut: { host: string; puerto: string | null } | null;
  let ruta: string;
  let esquema: PartesOrigin['esquema'];
  if (conEsquema !== null) {
    aut = partirAutoridad(conEsquema[2] as string);
    ruta = conEsquema[3] as string;
    const e = (conEsquema[1] as string).toLowerCase();
    esquema = e === 'https' ? 'https' : e === 'http' ? 'http' : 'ssh';
  } else {
    const scp = /^(?:[^@/\\:\s]+@)?([^@/\\:\s]+):(?!\/\/)(.*)$/s.exec(texto);
    if (scp === null || (scp[1] as string).length === 1) return null;
    aut = partirAutoridad(scp[1] as string);
    ruta = scp[2] as string;
    esquema = 'ssh';
  }
  if (aut === null) return null;
  const segs = segmentosDeRuta(ruta);
  if (segs === null) return null;
  const ultimo = segs.length - 1;
  if (ultimo >= 0) {
    const sinGit = (segs[ultimo] as string).replace(/\.git$/i, '');
    if (sinGit === '') segs.pop();
    else segs[ultimo] = sinGit;
  }
  const puerto = esquema === 'https' && aut.puerto !== '443' ? aut.puerto : null;
  return { esquema, host: aut.host, puerto, segmentos: segs };
}

export type ResultadoProyecto =
  | { ok: true; proyecto: string }
  | {
      ok: false;
      motivo: 'url-sin-red' | 'base-invalida' | 'host' | 'puerto' | 'ruta' | 'proyecto-corto' | 'proyecto-invalido';
    };

/**
 * El proyecto (`grupo/subgrupo/repo`, sin `.git`) de una URL de origin
 * relativo a la base de la instancia: la base tiene que ser PREFIJO EXACTO de
 * host + ruta (esquema, mayusculas del host, puerto y barra final ya
 * normalizados; los segmentos de la ruta se comparan tal cual).
 *
 * EXCEPCION ssh/scp: GitLab con `relative_url_root` sirve la web y la API bajo
 * `/ruta/gitlab` pero el clonado ssh va SIN esa ruta (`git@host:grupo/repo.git`).
 * Con ssh solo se exige el mismo host (el puerto no se compara); si la ruta de
 * origin empieza por la de la base se quita (`git@host:ruta/gitlab/grupo/repo`
 * -> `grupo/repo`) y si no, la ruta entera es el proyecto. Ambiguedad asumida:
 * un grupo de primer nivel llamado igual que la ruta de la base (`ruta/gitlab/...`
 * en un ssh sin ruta) se interpreta como ruta de la instancia y se quita.
 *
 * Lo que queda detras de la base tiene que ser un proyecto de verdad (>= 2 segmentos, con
 * caracteres de ruta de GitLab y sin "-" inicial: va en argv de glab). Nunca
 * devuelve ni imprime credenciales.
 */
export function proyectoDeRemoto(urlOrigen: string, urlBase: string): ResultadoProyecto {
  const base = normalizarBase(urlBase);
  if (!base.ok) return { ok: false, motivo: 'base-invalida' };
  const o = partesDeOrigin(urlOrigen);
  if (o === null) return { ok: false, motivo: 'url-sin-red' };
  if (o.host !== base.host) return { ok: false, motivo: 'host' };
  if (o.esquema === 'https' && o.puerto !== base.puerto) return { ok: false, motivo: 'puerto' };
  const empiezaPorBase = base.segmentos.every((s, i) => o.segmentos[i] === s);
  if (!empiezaPorBase && o.esquema !== 'ssh') return { ok: false, motivo: 'ruta' };
  const resto = empiezaPorBase ? o.segmentos.slice(base.segmentos.length) : o.segmentos;
  if (resto.length < 2) return { ok: false, motivo: 'proyecto-corto' };
  if (!resto.every((s) => SEGMENTO_PROYECTO.test(s) && s !== '.' && s !== '..')) {
    return { ok: false, motivo: 'proyecto-invalido' };
  }
  return { ok: true, proyecto: resto.join('/') };
}

export interface RemotoDeclarado {
  plataforma: Plataforma;
  /** `url_base_remoto` ya validada por config (null = solo `plataforma_remota`). */
  urlBase: string | null;
}

export type ResolucionDeclarada =
  | { ok: true; remoto: RemotoPlataforma }
  | {
      ok: false;
      motivo: 'sin-host' | 'base-invalida' | 'no-encaja';
      /** `host/ruta` de la primera URL de red de origin, sin credenciales; null si no hay ninguna. */
      origen: string | null;
      /** Por que no encaja (motivo de `proyectoDeRemoto`). */
      causa: Extract<ResultadoProyecto, { ok: false }>['motivo'] | null;
    };

/**
 * Remoto de una plataforma DECLARADA en config, sobre las URLs de origin
 * (la efectiva y la escrita, que pueden diferir por `insteadOf`). Con github
 * basta el host. Con gitlab, la base es la declarada o `https://<host de
 * origin>` (con su puerto si origin es https con puerto); se toma la primera
 * URL que encaja, y si ninguna encaja no se supone nada.
 */
export function resolverRemotoDeclarado(urls: readonly string[], declarado: RemotoDeclarado): ResolucionDeclarada {
  const red = urls.map((u) => ({ u, p: partesDeOrigin(u) })).filter((x) => x.p !== null);
  const primera = red[0]?.p ?? null;
  const origen = primera === null ? null : `${primera.host}${primera.segmentos.length === 0 ? '' : `/${primera.segmentos.join('/')}`}`;
  if (primera === null) return { ok: false, motivo: 'sin-host', origen: null, causa: null };
  if (declarado.plataforma === 'github') {
    return { ok: true, remoto: { plataforma: 'github', host: primera.host } };
  }
  const declaradaNormal = declarado.urlBase === null ? null : normalizarBase(declarado.urlBase);
  if (declaradaNormal !== null && !declaradaNormal.ok) {
    return { ok: false, motivo: 'base-invalida', origen, causa: null };
  }
  let causa: Extract<ResultadoProyecto, { ok: false }>['motivo'] | null = null;
  for (const { u, p } of red) {
    const parte = p as PartesOrigin;
    const base =
      declaradaNormal !== null && declaradaNormal.ok
        ? declaradaNormal.base
        : `https://${parte.host}${parte.puerto === null ? '' : `:${parte.puerto}`}`;
    const r = proyectoDeRemoto(u, base);
    if (r.ok) {
      return { ok: true, remoto: { plataforma: 'gitlab', host: parte.host, declarado: { base, proyecto: r.proyecto } } };
    }
    causa ??= r.motivo;
  }
  return { ok: false, motivo: 'no-encaja', origen, causa };
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
