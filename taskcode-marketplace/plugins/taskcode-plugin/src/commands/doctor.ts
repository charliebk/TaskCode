/**
 * `taskctl doctor [--json]` — TASK-062.
 *
 * Comprueba, de una vez, que el proyecto esta listo para trabajar con el flujo
 * de tareas: entorno (Node, git, bash para los scripts de Git-Flow),
 * repositorio (estructura de tareas/, ramas base, origin, workspace),
 * configuracion, coherencia de las tareas y, si la config lo pide, el CLI de la
 * plataforma (gh/glab) y su sesion. SOLO LEE: no escribe, no commitea, no
 * cambia de rama; lo unico que sale a la red es la comprobacion de sesion de
 * la plataforma, con timeout propio corto.
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
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import {
  aviso,
  codigoSalida,
  error as fallo,
  formatearJson,
  formatearTexto,
  nodeSoportado,
  NODE_MINIMO,
  ok,
  omitida,
  type Comprobacion,
} from '../core/doctor.js';
import { resolverConfigConAvisos, CONFIG_DEFAULTS, type TaskcodeConfig } from '../core/config.js';
import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
import { urlsDeOrigin } from '../fs/git.js';
import { sondearCli } from '../fs/merge-request.js';
import { resolverRemotoDeOrigin } from './finish-opciones.js';

export class DoctorCommandError extends Error {}

/** Flags de `taskctl doctor`: solo --json. */
export const FLAGS_DOCTOR: readonly string[] = ['--json'];

/** Espera maxima de la comprobacion de sesion de la plataforma (el unico acceso a la red). */
export const TIMEOUT_PLATAFORMA_MS = 10_000;
/** Espera maxima de cada `git` lanzado por doctor. */
const TIMEOUT_GIT_MS = 15_000;

export interface DoctorCommandDeps {
  repoCwd: string;
  /** Carpeta de los scripts de Git-Flow (por defecto la del plugin). Para los tests. */
  scriptsDir?: string;
  /** Timeout de la sesion de plataforma (por defecto 10 s). Para los tests. */
  timeoutPlataformaMs?: number;
}

export interface DoctorCommandResult {
  comprobaciones: Comprobacion[];
  /** 0 sin errores, 1 con alguno. */
  codigo: 0 | 1;
  /** Lo que hay que escribir en stdout: el texto, o SOLO el JSON con --json. */
  salida: string;
  json: boolean;
}

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

/** Una comprobacion (o varias) que nunca lanza: una excepcion se vuelve su resultado `error`. */
export function envolver(id: string, f: () => Comprobacion | Comprobacion[]): Comprobacion[] {
  try {
    const r = f();
    return Array.isArray(r) ? r : [r];
  } catch (e: unknown) {
    const msg = ocultarCredenciales(e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim();
    return [
      fallo(
        id,
        `la comprobacion fallo por una excepcion: ${msg}`,
        'Es un fallo de la propia comprobacion, no necesariamente del proyecto: repite taskctl doctor y, ' +
          'si persiste, revisa que el directorio existe y se puede leer.'
      ),
    ];
  }
}

interface GitSalida {
  status: number | null;
  stdout: string;
  stderr: string;
  /** Error de lanzamiento (git no esta, directorio inexistente, timeout). */
  error: Error | undefined;
}

/** `git` sin lanzar nunca: el resultado lleva el error de lanzamiento. */
function git(args: readonly string[], cwd: string, env: NodeJS.ProcessEnv = {}): GitSalida {
  const r: SpawnSyncReturns<string> = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: TIMEOUT_GIT_MS,
    env: { ...process.env, ...env },
  });
  return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim(), error: r.error };
}

const una = (t: string): string => ocultarCredenciales(t).replace(/\s+/g, ' ').trim();

function ramaLocal(nombre: string, cwd: string): boolean {
  return git(['show-ref', '--verify', '--quiet', `refs/heads/${nombre}`], cwd).status === 0;
}

function ramaEnOrigin(nombre: string, cwd: string): boolean {
  return git(['show-ref', '--verify', '--quiet', `refs/remotes/origin/${nombre}`], cwd).status === 0;
}

// ---------------------------------------------------------------------
// Entorno
// ---------------------------------------------------------------------

function comprobarNode(): Comprobacion {
  const v = process.versions.node;
  return nodeSoportado(v)
    ? ok('node', `Node ${v} (minimo ${NODE_MINIMO})`)
    : fallo(
        'node',
        `Node ${v} es anterior al minimo soportado (${NODE_MINIMO})`,
        `Instala Node ${NODE_MINIMO} o superior (https://nodejs.org) y abre una terminal nueva.`
      );
}

function comprobarGit(cwd: string): Comprobacion {
  const r = git(['--version'], cwd);
  if (r.error !== undefined || r.status !== 0) {
    return fallo(
      'git',
      `no se pudo ejecutar "git" (${una(r.error?.message ?? r.stderr)})`,
      'Instala Git (https://git-scm.com) y comprueba que "git" esta en el PATH: git --version.'
    );
  }
  return ok('git', r.stdout);
}

function arregloBash(): string {
  return process.platform === 'win32'
    ? 'Instala Git for Windows (https://git-scm.com/download/win) y pon su carpeta usr\\bin al PRINCIPIO del PATH, ' +
        'antes de C:\\Windows\\System32 (ahi vive el bash de WSL, que no vale). En PowerShell, para esta terminal: ' +
        '$env:Path = "C:\\Program Files\\Git\\usr\\bin;" + $env:Path ; para siempre, editalo en las variables de ' +
        'entorno del sistema y abre una terminal nueva. Despues repite taskctl doctor.'
    : 'Instala bash y las herramientas basicas (coreutils, grep, sed) y comprueba que "bash" esta en el PATH: ' +
        'bash -c "mktemp -d". Despues repite taskctl doctor.';
}

function comprobarBash(deps: DoctorCommandDeps): Comprobacion {
  const r = sondearBash({ scriptsDir: deps.scriptsDir ?? resolveGitflowScriptsDir(), cwd: deps.repoCwd });
  if (r.ok) return ok('bash', `bash ejecuta los scripts de Git-Flow${r.version === '' ? '' : ` (bash ${r.version})`}`);
  const que =
    r.causa === 'no-lanzable'
      ? `no se pudo lanzar "bash" (${una(r.detalle)})`
      : r.causa === 'timeout'
        ? 'bash no termino el script de prueba a tiempo'
        : `bash no pudo ejecutar el script de prueba de Git-Flow (${una(r.detalle)})`;
  return fallo('bash', que, arregloBash());
}

// ---------------------------------------------------------------------
// Repositorio
// ---------------------------------------------------------------------

const SUBCARPETAS_TAREAS: readonly string[] = TASK_STATES.map((e) => STATE_FOLDER[e]);

function comprobarCarpetas(tareasRoot: string): Comprobacion {
  const faltan = SUBCARPETAS_TAREAS.filter((c) => {
    try {
      return !statSync(path.join(tareasRoot, c)).isDirectory();
    } catch {
      return true;
    }
  });
  if (faltan.length === 0) return ok('tareas-carpetas', `tareas/ tiene las cinco carpetas (${SUBCARPETAS_TAREAS[0]} .. ${SUBCARPETAS_TAREAS[4]})`);
  const hayRaiz = existsSync(tareasRoot);
  return fallo(
    'tareas-carpetas',
    hayRaiz ? `a tareas/ le faltan: ${faltan.join(', ')}` : 'no existe la carpeta tareas/ (o no es un directorio)',
    `mkdir -p ${faltan.map((c) => `tareas/${c}`).join(' ')}`
  );
}

interface EstadoRepo {
  esRepo: boolean;
  conCommits: boolean;
}

function comprobarRepo(cwd: string, gitOk: boolean): { cs: Comprobacion[]; repo: EstadoRepo } {
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
        fallo(
          'repo-git',
          'este directorio no esta dentro de un repositorio Git',
          'Ejecuta taskctl desde la raiz del proyecto, o crea el repo: git init -b main && ' +
            'git commit --allow-empty -m "chore: commit inicial" && git branch develop'
        ),
      ],
      repo: { esRepo: false, conCommits: false },
    };
  }
  let enlazado = false;
  try {
    enlazado = statSync(path.join(cwd, '.git')).isFile();
  } catch {
    enlazado = false;
  }
  const cs: Comprobacion[] = [ok('repo-git', enlazado ? 'repositorio Git (worktree o submodulo: .git es un fichero)' : 'repositorio Git')];
  const head = git(['rev-parse', '--verify', '--quiet', 'HEAD'], cwd);
  if (head.status !== 0) {
    cs.push(
      fallo(
        'repo-commits',
        'el repositorio no tiene ningun commit todavia, asi que aun no existe ninguna rama (ni develop ni la principal)',
        'Haz el primer commit: git add -A && git commit -m "chore: commit inicial" ; despues crea la rama de integracion: git branch develop'
      )
    );
    return { cs, repo: { esRepo: true, conCommits: false } };
  }
  cs.push(ok('repo-commits', 'el repositorio tiene commits'));
  return { cs, repo: { esRepo: true, conCommits: true } };
}

/** `main` o `master`: la local, o (aviso) solo la de origin. */
function ramaPrincipal(cwd: string): { nombre: string; soloOrigin: boolean } | null {
  for (const n of ['main', 'master']) if (ramaLocal(n, cwd)) return { nombre: n, soloOrigin: false };
  for (const n of ['main', 'master']) if (ramaEnOrigin(n, cwd)) return { nombre: n, soloOrigin: true };
  return null;
}

function comprobarRamas(cwd: string, base: string, repo: EstadoRepo): Comprobacion[] {
  if (!repo.esRepo || !repo.conCommits) {
    const motivo = repo.esRepo ? 'el repo no tiene commits (ver repo-commits)' : 'no hay repositorio (ver repo-git)';
    return [omitida('rama-base', `no se puede comprobar la rama "${base}": ${motivo}`), omitida('rama-principal', `no se puede comprobar: ${motivo}`)];
  }
  const principal = ramaPrincipal(cwd);
  const cs: Comprobacion[] = [];
  if (ramaLocal(base, cwd)) {
    cs.push(ok('rama-base', `existe la rama "${base}"`));
  } else if (ramaEnOrigin(base, cwd)) {
    cs.push(aviso('rama-base', `"${base}" solo existe en origin, no en local`, `git branch ${base} origin/${base}`));
  } else {
    cs.push(
      fallo(
        'rama-base',
        `no existe la rama "${base}" (de ella cuelgan las tareas feature, fix y release)`,
        `git branch ${base}${principal === null ? '' : ` ${principal.soloOrigin ? `origin/${principal.nombre}` : principal.nombre}`}`
      )
    );
  }
  if (principal === null) {
    cs.push(
      fallo(
        'rama-principal',
        'no existe ni "main" ni "master" (de ella cuelgan los hotfix y reciben las releases)',
        'Crea la rama principal desde el commit que quieras publicar: git branch main <commit>'
      )
    );
  } else if (principal.soloOrigin) {
    cs.push(
      aviso('rama-principal', `"${principal.nombre}" solo existe en origin, no en local`, `git branch ${principal.nombre} origin/${principal.nombre}`)
    );
  } else {
    cs.push(ok('rama-principal', `existe la rama principal "${principal.nombre}"`));
  }
  return cs;
}

function comprobarOrigin(cwd: string, repo: EstadoRepo, cfg: TaskcodeConfig): { c: Comprobacion; hay: boolean } {
  if (!repo.esRepo) return { c: omitida('origin', 'no hay repositorio (ver repo-git)'), hay: false };
  const r = git(['remote', 'get-url', 'origin'], cwd);
  if (r.status === 0 && r.stdout !== '') {
    const host = urlsDeOrigin(cwd)
      .map((u) => hostDeRemoto(u))
      .find((h) => h !== null);
    return { c: ok('origin', host === undefined ? 'hay un remoto "origin"' : `hay un remoto "origin" (host ${host})`), hay: true };
  }
  const arreglo = 'git remote add origin <url-del-repositorio>';
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

function comprobarWorkspace(cwd: string, repo: EstadoRepo): Comprobacion {
  if (!repo.esRepo) return omitida('workspace', 'no hay repositorio (ver repo-git)');
  const r = git(['status', '--porcelain'], cwd, { GIT_OPTIONAL_LOCKS: '0' });
  if (r.error !== undefined || r.status !== 0) {
    const causa = una(r.error?.message ?? r.stderr);
    if (/lock/i.test(causa)) {
      return aviso(
        'workspace',
        `no se pudo comprobar el workspace porque Git esta bloqueado (${causa})`,
        'Espera a que termine la otra operacion de Git y repite taskctl doctor; si no hay ninguna, borra el .git/index.lock huerfano.'
      );
    }
    return fallo('workspace', `git status fallo (${causa})`, 'Ejecuta git status en el proyecto y resuelve lo que diga.');
  }
  if (r.stdout === '') return ok('workspace', 'el workspace esta limpio');
  const n = r.stdout.split(/\r?\n/).length;
  return aviso(
    'workspace',
    `el workspace tiene ${n} ${n === 1 ? 'cambio' : 'cambios'} sin commitear (los comandos que escriben exigen un arbol limpio)`,
    'git status ; commitea o aparca lo pendiente (git stash -u) antes de taskctl start o finish.'
  );
}

// ---------------------------------------------------------------------
// Configuracion
// ---------------------------------------------------------------------

function comprobarConfig(cwd: string): { cs: Comprobacion[]; cfg: TaskcodeConfig } {
  try {
    const { config, avisos } = resolverConfigConAvisos(cwd);
    const cs: Comprobacion[] = [ok('config', '.taskcode/config.yml es valida (o no existe: valores por defecto)')];
    if (avisos.length === 0) cs.push(ok('config-claves', 'sin claves desconocidas'));
    else
      for (const a of avisos) {
        cs.push(aviso('config-claves', una(a), 'Corrige o borra esa clave en .taskcode/config.yml: se ignora y puede ser una errata.'));
      }
    return { cs, cfg: config };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      cs: [
        fallo('config', una(msg), 'Corrige .taskcode/config.yml segun el mensaje (o borralo para usar los valores por defecto).'),
        omitida('config-claves', 'la config no se pudo leer (ver config)'),
      ],
      cfg: { ...CONFIG_DEFAULTS },
    };
  }
}

// ---------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------

function codigoDe(e: unknown): string | undefined {
  return typeof e === 'object' && e !== null ? (e as { code?: string }).code : undefined;
}

/** Recorrido propio de tareas/ (ver cabecera): lo que `listTareasEnEstados` esconde, aqui se dice. */
function comprobarTareas(tareasRoot: string): Comprobacion[] {
  if (!existsSync(tareasRoot)) return [omitida('tareas', 'no hay carpeta tareas/ (ver tareas-carpetas)')];
  const problemas: Comprobacion[] = [];
  const carpetasDe = new Map<string, string[]>();
  let total = 0;
  for (const estado of TASK_STATES) {
    const carpeta = STATE_FOLDER[estado];
    const dir = path.join(tareasRoot, carpeta);
    let entradas: string[];
    try {
      entradas = readdirSync(dir).sort();
    } catch (e: unknown) {
      if (codigoDe(e) === 'ENOENT') continue;
      problemas.push(
        fallo(`tareas:${carpeta}`, `no se pudo leer tareas/${carpeta}/ (${una(e instanceof Error ? e.message : String(e))})`, `Revisa los permisos de tareas/${carpeta}.`)
      );
      continue;
    }
    for (const id of entradas) {
      if (!isValidTaskId(id)) continue;
      total++;
      carpetasDe.set(id, [...(carpetasDe.get(id) ?? []), carpeta]);
      const rel = `tareas/${carpeta}/${id}/tarea.md`;
      let contenido: string;
      try {
        contenido = readFileSync(path.join(dir, id, 'tarea.md'), 'utf8');
      } catch (e: unknown) {
        if (codigoDe(e) === 'ENOENT') {
          problemas.push(
            fallo(
              `tarea:${id}:sin-tarea-md`,
              `${id}: la carpeta ${rel.replace('/tarea.md', '')} no tiene tarea.md`,
              `Restaura el fichero (git checkout -- ${rel}) o, si la carpeta sobra, borrala: rmdir tareas/${carpeta}/${id}`
            )
          );
        } else {
          problemas.push(
            fallo(`tarea:${id}:ilegible`, `${id}: no se pudo leer ${rel} (${una(e instanceof Error ? e.message : String(e))})`, `Revisa los permisos y que ${rel} es un fichero.`)
          );
        }
        continue;
      }
      let task;
      try {
        task = parseTareaFile(contenido).task;
      } catch (e: unknown) {
        problemas.push(
          fallo(
            `tarea:${id}:ilegible`,
            `${id}: ${rel} no se puede leer ni validar (${una(e instanceof Error ? e.message : String(e))})`,
            `Corrige el frontmatter de ${rel} segun esa causa (o restaura la version buena: git checkout -- ${rel}).`
          )
        );
        continue;
      }
      if (task.id !== id) {
        problemas.push(
          fallo(
            `tarea:${id}:id`,
            `${id}: ${rel} dice id "${task.id}", distinto del nombre de su carpeta`,
            `Pon "id: ${id}" en el frontmatter de ${rel}, o renombra la carpeta.`
          )
        );
        continue;
      }
      if (task.estado !== estado) {
        problemas.push(
          fallo(
            `tarea:${id}:estado`,
            `${id}: esta en ${carpeta}/ pero su estado es "${task.estado}"`,
            `Si la carpeta es la correcta, pon "estado: ${estado}" en ${rel}; si lo es el estado, muevela: ` +
              `git mv tareas/${carpeta}/${id} tareas/${STATE_FOLDER[task.estado]}/${id}`
          )
        );
      }
    }
  }
  for (const [id, carpetas] of carpetasDe) {
    if (carpetas.length < 2) continue;
    problemas.push(
      fallo(
        `tarea:${id}:duplicado`,
        `${id} esta en ${carpetas.length} carpetas a la vez: ${carpetas.join(', ')}`,
        `Deja una sola copia: mira cual es la vigente (git log --oneline -- tareas/*/${id}) y borra la otra: git rm -r tareas/${carpetas[0]}/${id}`
      )
    );
  }
  if (problemas.length > 0) return problemas;
  return [ok('tareas', total === 0 ? 'no hay tareas todavia' : `${total} ${total === 1 ? 'tarea' : 'tareas'}: todas legibles y en la carpeta de su estado`)];
}

// ---------------------------------------------------------------------
// Plataforma (gh / glab)
// ---------------------------------------------------------------------

function comprobarPlataforma(cwd: string, cfg: TaskcodeConfig, hayOrigin: boolean, timeoutMs: number): Comprobacion {
  const aplica = cfg.cierre_por_defecto === 'merge-request' || cfg.plataforma_remota !== null;
  if (!aplica) {
    return omitida('plataforma', 'no hay merge request por defecto ni plataforma declarada en la config: no hace falta gh ni glab');
  }
  if (!hayOrigin) return omitida('plataforma', 'sin remoto "origin" no hay plataforma que comprobar (ver origin)');
  const d = resolverRemotoDeOrigin(cwd, cfg);
  if (!d.ok) {
    return fallo(
      'plataforma',
      una(d.mensaje),
      'Apunta origin a github.com o a un host de GitLab, o declara la plataforma en .taskcode/config.yml ' +
        '("plataforma_remota: gitlab" y, si cuelga de una ruta, "url_base_remoto").'
    );
  }
  const cli = CLI_PLATAFORMA[d.remoto.plataforma];
  const s = sondearCli(d.remoto, cwd, timeoutMs);
  if (s.ok) return ok('plataforma', `"${cli}" instalado y con sesion en ${d.remoto.host}`);
  if (s.noVerificable) {
    return aviso(
      'plataforma',
      `no se pudo verificar la sesion de "${cli}" (sin respuesta a tiempo o sin red): ${una(s.problema)}`,
      `Comprueba la conexion (VPN, proxy) y repite taskctl doctor; o a mano: ${cli} auth status`
    );
  }
  return fallo('plataforma', una(s.problema), `${s.ayuda}.`);
}

// ---------------------------------------------------------------------
// Orquestacion
// ---------------------------------------------------------------------

export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDeps): DoctorCommandResult {
  rechazarFlagsDesconocidos(argv, FLAGS_DOCTOR, 'doctor', (m) => new DoctorCommandError(m));
  const sobra = argv.find((a) => !a.startsWith('-'));
  if (sobra !== undefined) {
    throw new DoctorCommandError(`[ERROR] taskctl doctor: no admite argumentos ("${sobra}"). Uso: taskctl doctor [--json].`);
  }
  const json = argv.includes('--json');
  const cwd = deps.repoCwd;
  const tareasRoot = path.join(cwd, 'tareas');
  const cs: Comprobacion[] = [];

  // Entorno
  cs.push(...envolver('node', comprobarNode));
  const gitC = envolver('git', () => comprobarGit(cwd));
  cs.push(...gitC);
  cs.push(...envolver('bash', () => comprobarBash(deps)));

  // La config se lee primero (las ramas y origin dependen de ella) y se muestra despues.
  let cfg: TaskcodeConfig = { ...CONFIG_DEFAULTS };
  let csConfig: Comprobacion[] = [];
  csConfig = envolver('config', () => {
    const r = comprobarConfig(cwd);
    cfg = r.cfg;
    return r.cs;
  });

  // Repositorio
  let repo: EstadoRepo = { esRepo: false, conCommits: false };
  cs.push(
    ...envolver('repo-git', () => {
      const r = comprobarRepo(cwd, gitC[0]?.nivel === 'ok');
      repo = r.repo;
      return r.cs;
    })
  );
  cs.push(...envolver('tareas-carpetas', () => comprobarCarpetas(tareasRoot)));
  cs.push(...envolver('rama-base', () => comprobarRamas(cwd, cfg.rama_base, repo)));
  let hayOrigin = false;
  cs.push(
    ...envolver('origin', () => {
      const r = comprobarOrigin(cwd, repo, cfg);
      hayOrigin = r.hay;
      return r.c;
    })
  );
  cs.push(...envolver('workspace', () => comprobarWorkspace(cwd, repo)));

  cs.push(...csConfig);
  cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
  cs.push(
    ...envolver('plataforma', () =>
      comprobarPlataforma(cwd, cfg, hayOrigin, deps.timeoutPlataformaMs ?? TIMEOUT_PLATAFORMA_MS)
    )
  );

  return {
    comprobaciones: cs,
    codigo: codigoSalida(cs),
    salida: json ? formatearJson(cs) : formatearTexto(cs),
    json,
  };
}
