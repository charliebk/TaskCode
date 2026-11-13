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
import { avisoCrecimiento, suitePorVersion } from '../core/crecimiento-suite.js';
import { versionDeCierre } from '../core/transiciones.js';
import { parseTareaFile } from '../core/tarea-file.js';
import { leerRegistroPuertas } from '../fs/registro-puertas.js';
import { resolverConfigConAvisos, CONFIG_DEFAULTS, presupuestoFreno, type TaskcodeConfig } from '../core/config.js';
import { comandoPropuesto, type ComandoTests } from '../core/comando-tests.js';
import { comandoParcial, documentacionDeclarada } from '../core/verificacion-proporcional.js';
import { detectarComandosTests } from '../fs/deteccion-tests.js';
import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plataforma-remota.js';
import { STATE_FOLDER, TASK_STATES, isValidTaskId } from '../core/task.js';
import { diaLocal, evaluarDocumentoEstado, type TareaTerminadaFecha } from '../core/documento-estado.js';
import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
import { urlsDeOrigin } from '../fs/git.js';
import { sondearCli } from '../fs/merge-request.js';
import { resolverRemotoDeOrigin } from './finish-opciones.js';
import { directorioConfigClaude } from '../fs/config-claude.js';
import { sondearHooksClaude } from '../fs/sondas-hooks-claude.js';
import { sondearVersionPlugin } from '../fs/sonda-version-plugin.js';
import { compararVersiones, NOMBRE_PLUGIN } from '../core/version.js';
import {
  COMANDO_STATUS_LINE,
  desinstalarStatusLine,
  instalarStatusLine,
  sondearStatusLine,
  type ResultadoAccion,
} from '../fs/status-line.js';

export class DoctorCommandError extends Error {}

/** Flags de `taskctl doctor`: --json y, desde TASK-110, los de la status line (los unicos que escriben). */
export const FLAG_INSTALAR_STATUS_LINE = '--instalar-status-line';
export const FLAG_REEMPLAZAR_STATUS_LINE = '--reemplazar-status-line';
export const FLAG_DESINSTALAR_STATUS_LINE = '--desinstalar-status-line';
/** La linea de uso, con todos los flags (la misma que la ayuda de cli.ts). */
export const USO_DOCTOR =
  `Uso: taskctl doctor [--json] [${FLAG_INSTALAR_STATUS_LINE} [${FLAG_REEMPLAZAR_STATUS_LINE}] | ${FLAG_DESINSTALAR_STATUS_LINE}].`;
export const FLAGS_DOCTOR: readonly string[] = [
  '--json',
  FLAG_INSTALAR_STATUS_LINE,
  FLAG_REEMPLAZAR_STATUS_LINE,
  FLAG_DESINSTALAR_STATUS_LINE,
];

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
  /** Timeout de `git status` (por defecto 15 s). Para los tests. */
  timeoutGitMs?: number;
  /** Directorio de configuracion de Claude Code (por defecto CLAUDE_CONFIG_DIR o ~/.claude). Para los tests. */
  configClaudeDir?: string;
  /** TASK-110: entorno donde se busca taskctl en el PATH (por defecto el del proceso). Para los tests. */
  env?: NodeJS.ProcessEnv;
  /**
   * TASK-110: instante de la copia de seguridad de settings.json (por defecto ahora).
   * TASK-124: tambien el "hoy" con que se mide la antiguedad de documento_estado. Para los tests.
   */
  ahora?: Date;
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
function git(args: readonly string[], cwd: string, env: NodeJS.ProcessEnv = {}, timeoutMs: number = TIMEOUT_GIT_MS): GitSalida {
  const r: SpawnSyncReturns<string> = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
    env: { ...process.env, ...env },
  });
  return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim(), error: r.error };
}

const una = (t: string): string => ocultarCredenciales(t).replace(/\s+/g, ' ').trim();

/** Como `una`, sin el `[ERROR]`/`[AVISO]` con que empiezan los mensajes de la config: doctor pone el suyo. */
const sinPrefijo = (t: string): string => una(t).replace(/^\[(?:ERROR|AVISO)\]\s*/, '');

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

function comprobarRamas(cwd: string, baseConfig: string | null, repo: EstadoRepo): Comprobacion[] {
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

function comprobarOrigin(cwd: string, repo: EstadoRepo, cfg: TaskcodeConfig | null): { c: Comprobacion; hay: boolean } {
  if (!repo.esRepo) return { c: omitida('origin', 'no hay repositorio (ver repo-git)'), hay: false };
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

function comprobarWorkspace(cwd: string, repo: EstadoRepo, timeoutMs: number): Comprobacion {
  if (!repo.esRepo) return omitida('workspace', 'no hay repositorio (ver repo-git)');
  const r = git(['status', '--porcelain'], cwd, { GIT_OPTIONAL_LOCKS: '0' }, timeoutMs);
  if ((r.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT') {
    return aviso(
      'workspace',
      `git status no termino en ${Math.round(timeoutMs / 1000)} s, asi que no se pudo comprobar el workspace (repo muy grande, disco lento o Git bloqueado)`,
      'Ejecuta git status a mano y repite taskctl doctor cuando responda.'
    );
  }
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

function comprobarConfig(cwd: string): { cs: Comprobacion[]; cfg: TaskcodeConfig | null } {
  try {
    const { config, avisos } = resolverConfigConAvisos(cwd);
    const cs: Comprobacion[] = [ok('config', '.taskcode/config.yml es valida (o no existe: valores por defecto)')];
    if (avisos.length === 0) cs.push(ok('config-claves', 'sin claves desconocidas'));
    else
      for (const a of avisos) {
        cs.push(aviso('config-claves', sinPrefijo(a), 'Corrige o borra esa clave en .taskcode/config.yml: se ignora y puede ser una errata.'));
      }
    return { cs, cfg: config };
  } catch (e: unknown) {
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
 *
 * TASK-116 (P-8): el aviso dice ademas cuantas tareas terminadas hay
 * (`contarTerminadas`, que solo se llama en ese camino). Son todas las de
 * `04-terminadas`: finish no deja rastro ni sin comando ni con la puerta en
 * verde, asi que no se puede separar una verificada de otra que no; sin la
 * clave hoy, ninguna paso por la puerta. Una clave que existio y se quito
 * sobrecuenta, y se acepta: el aviso no cambia el codigo de salida.
 */
export function comprobarVerificacion(
  cfg: TaskcodeConfig | null,
  detectar: () => readonly ComandoTests[] = () => [],
  contarTerminadas: () => number = () => 0
): Comprobacion {
  if (cfg === null) return omitida('verificacion', 'config invalida: no se sabe como se verifica el proyecto (ver config)');
  if (cfg.comando_verificacion === null) {
    const detectados = detectar();
    const propuesto = comandoPropuesto(detectados);
    if (propuesto !== null) {
      const terminadas = contarTerminadas();
      const cerradas =
        terminadas === 0
          ? ''
          : terminadas === 1
            ? '; 1 tarea terminada se cerro sin verificar'
            : `; ${terminadas} tareas terminadas se cerraron sin verificar`;
      return aviso(
        'verificacion',
        `sin comando_verificacion y el proyecto tiene tests (${detectados.map((d) => d.motivo).join(', ')}): ` +
          `los frenos de verificacion no actuan${cerradas}`,
        `Declara en .taskcode/config.yml: comando_verificacion: "${propuesto}"`
      );
    }
    return omitida(
      'verificacion',
      'sin comando_verificacion: los frenos de verificacion no actuan. Para activarlos, declara en ' +
        '.taskcode/config.yml: comando_verificacion: "<tu comando de tests>"'
    );
  }
  return ok('verificacion', `comando_verificacion: "${una(cfg.comando_verificacion)}" (timeout ${cfg.timeout_verificacion} s)`);
}

/**
 * TASK-116: cuantas tareas hay en `tareas/04-terminadas` (con el criterio de
 * ID de `comprobarTareas`). Una carpeta que falta o no se lee cuenta 0: de eso
 * ya informan `tareas-carpetas` y `tareas`.
 */
export function contarTerminadas(tareasRoot: string): number {
  try {
    return readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId).length;
  } catch {
    return 0;
  }
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
export function comprobarVerificacionSelectiva(cfg: TaskcodeConfig | null): Comprobacion[] {
  if (cfg === null || cfg.comando_verificacion === null) return [];
  if (cfg.comando_verificacion_selectiva === null) {
    const arreglo =
      'declara en .taskcode/config.yml comando_verificacion_selectiva: "<script que corre solo lo afectado ' +
      'respecto a $RAMA_BASE>" (guia: skill task-workflow, verificacion-selectiva.md)';
    return [
      aviso(
        'verificacion-selectiva',
        'sin comando_verificacion_selectiva: cada fin de turno corre la verificacion completa; para ' +
          `acelerarlo, ${arreglo}`,
        arreglo.charAt(0).toUpperCase() + arreglo.slice(1)
      ),
    ];
  }
  const selectiva =
    `comando_verificacion_selectiva: "${una(cfg.comando_verificacion_selectiva)}" ` +
    `(timeout ${cfg.timeout_verificacion_selectiva} s)`;
  if (comandoParcial(cfg) === null) {
    return [ok('verificacion-selectiva', `${selectiva}; la completa sigue siendo la puerta de finish`)];
  }
  // TASK-109: sin rutas de documentacion la decision proporcional no se calcula
  // y el nivel 2 nunca se activa: la clave pareceria hacer algo sin hacerlo.
  if (!documentacionDeclarada(cfg)) {
    const arreglo =
      'declara tambien rutas_documentacion en .taskcode/config.yml (p. ej. rutas_documentacion: [docs/**, README.md]) ' +
      'o borra rutas_verificacion_parcial';
    return [
      aviso(
        'verificacion-selectiva',
        `${selectiva}; rutas_verificacion_parcial no tiene efecto sin rutas_documentacion: ${arreglo}`,
        arreglo.charAt(0).toUpperCase() + arreglo.slice(1)
      ),
    ];
  }
  return [
    ok(
      'verificacion-selectiva',
      `${selectiva}; con rutas_verificacion_parcial, finish integra con ella si todo el codigo cae en esas ` +
        'rutas; un merge a mano sigue exigiendo la completa'
    ),
  ];
}

/**
 * TASK-125: que comando corre cada puerta de verificacion. Solo con
 * `comando_verificacion` (sin el no hay puertas: lo dice `verificacion`).
 * - freno (hook Stop): `comando_verificacion_freno`, si no la selectiva, si no
 *   la completa; y su presupuesto o «sin presupuesto».
 * - review: la selectiva, o «no verifica».
 * - finish: la completa (y la selectiva con codigo parcial).
 * Siempre `ok`: es informacion, no un fallo.
 */
export function comprobarPuertasVerificacion(cfg: TaskcodeConfig | null): Comprobacion[] {
  if (cfg === null || cfg.comando_verificacion === null) return [];
  const completa = `"${una(cfg.comando_verificacion)}"`;
  const selectiva = cfg.comando_verificacion_selectiva === null ? null : `"${una(cfg.comando_verificacion_selectiva)}"`;
  const comandoFreno =
    cfg.comando_verificacion_freno !== null
      ? `"${una(cfg.comando_verificacion_freno)}" (comando_verificacion_freno)`
      : (selectiva ?? completa);
  const presupuesto = presupuestoFreno(cfg);
  const freno = `freno ${comandoFreno}, ${presupuesto === null ? 'sin presupuesto' : `presupuesto ${String(presupuesto)} s`}`;
  const review = `review ${selectiva ?? 'no verifica'}`;
  const finish = `finish ${completa}${selectiva !== null && comandoParcial(cfg) !== null ? ` (o ${selectiva} con codigo parcial)` : ''}`;
  // TASK-126: que puerta corre los tests pesados.
  const pesados =
    cfg.comando_verificacion_pesada === null
      ? 'sin pesados'
      : `pesados "${una(cfg.comando_verificacion_pesada)}" solo en ${cfg.verificacion_pesada_en.join(' y ')}`;
  return [ok('puertas-verificacion', `${freno}; ${review}; ${finish}; ${pesados}`)];
}

/**
 * TASK-129: aviso de crecimiento de la suite. Por version de cierre de las
 * tareas terminadas, el numero de tests y la duracion de la completa (lineas
 * `suite` del registro de puertas); avisa si, entre las dos ultimas versiones
 * con dato, crecieron mas de `umbral_crecimiento_suite`. Sin datos, nada: ni
 * avisa ni falla.
 */
export function comprobarCrecimientoSuite(cwd: string, tareasRoot: string, cfg: TaskcodeConfig | null): Comprobacion[] {
  if (cfg === null || cfg.comando_verificacion === null) return [];
  let ids: string[];
  try {
    ids = readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId);
  } catch {
    return [];
  }
  const tareas = ids.map((id) => {
    try {
      return { id, version: versionDeCierre(readFileSync(path.join(tareasRoot, STATE_FOLDER.terminada, id, 'tarea.md'), 'utf8')) };
    } catch {
      return { id, version: null };
    }
  });
  const versiones = suitePorVersion(tareas, leerRegistroPuertas(cwd));
  if (versiones.length === 0) return [];
  const umbral = cfg.umbral_crecimiento_suite;
  const motivo = avisoCrecimiento(versiones, umbral);
  if (motivo === null) {
    return [ok('crecimiento-suite', `la suite no crecio mas del ${String(umbral)} % entre las dos ultimas versiones con dato`)];
  }
  const arreglo =
    'Poda los tests redundantes o marca como pesados los de rendimiento y escala (comando_verificacion_pesada); ' +
    'guia: skill task-workflow, tests-pesados.md';
  return [aviso('crecimiento-suite', motivo, arreglo)];
}

/** TASK-130: la etiqueta que marca una tarea de poda de tests. */
export const ETIQUETA_PODA = 'poda';
/** TASK-130: el comando con que doctor propone abrir la tarea de poda. */
export const COMANDO_NUEVA_PODA =
  'taskctl new --titulo "Poda de tests redundantes" --tipo feature --etiquetas poda,tests ' +
  '--objetivo "Fusionar o borrar tests redundantes sin bajar la cobertura de las lineas que cubrian ' +
  '(procedimiento: skill task-workflow, poda-tests.md)"';

/**
 * TASK-130: propone abrir una tarea de poda de tests cuando salta el aviso de
 * crecimiento de la suite (TASK-129) o han pasado mas de `tareas_entre_podas`
 * tareas terminadas desde la ultima poda (la terminada con la etiqueta `poda`
 * de mayor numero; sin ninguna, se cuentan todas). Sin tareas terminadas, nada.
 */
export function comprobarPodaTests(
  cwd: string,
  tareasRoot: string,
  cfg: TaskcodeConfig | null,
  crecimiento: readonly Comprobacion[] = comprobarCrecimientoSuite(cwd, tareasRoot, cfg)
): Comprobacion[] {
  if (cfg === null) return [];
  let ids: string[];
  try {
    ids = readdirSync(path.join(tareasRoot, STATE_FOLDER.terminada)).filter(isValidTaskId);
  } catch {
    return [];
  }
  if (ids.length === 0) return [];
  const numero = (id: string): number => Number(/^TASK-(\d+)/.exec(id)?.[1] ?? 0);
  let ultimaPoda = -1;
  for (const id of ids) {
    try {
      const t = parseTareaFile(readFileSync(path.join(tareasRoot, STATE_FOLDER.terminada, id, 'tarea.md'), 'utf8')).task;
      if (t.etiquetas.includes(ETIQUETA_PODA)) ultimaPoda = Math.max(ultimaPoda, numero(id));
    } catch {
      // ilegible: de eso avisa `tareas`
    }
  }
  const desde = ids.filter((id) => numero(id) > ultimaPoda).length;
  const n = cfg.tareas_entre_podas;
  const crece = crecimiento.some((c) => c.nivel === 'aviso');
  const motivos: string[] = [];
  if (crece) motivos.push('la suite crecio mas del umbral (ver crecimiento-suite)');
  if (desde > n) {
    motivos.push(
      `${String(desde)} tareas terminadas ${ultimaPoda === -1 ? 'sin ninguna poda' : 'desde la ultima poda'} ` +
        `(tareas_entre_podas: ${String(n)})`
    );
  }
  if (motivos.length === 0) {
    return [ok('poda-tests', `${String(desde)} de ${String(n)} tareas terminadas desde la ultima poda de tests`)];
  }
  return [aviso('poda-tests', `toca podar los tests redundantes: ${motivos.join('; ')}`, `Abre la tarea con: ${COMANDO_NUEVA_PODA}`)];
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
// Documento de estado (TASK-124)
// ---------------------------------------------------------------------

/** `id` y `actualizado` de las tareas de 04-terminadas; las que no se pueden leer se saltan (las cuenta `tareas`). */
function leerTerminadas(tareasRoot: string): TareaTerminadaFecha[] {
  const dir = path.join(tareasRoot, STATE_FOLDER.terminada);
  let entradas: string[];
  try {
    entradas = readdirSync(dir);
  } catch {
    return [];
  }
  const terminadas: TareaTerminadaFecha[] = [];
  for (const id of entradas) {
    if (!isValidTaskId(id)) continue;
    try {
      const task = parseTareaFile(readFileSync(path.join(dir, id, 'tarea.md'), 'utf8')).task;
      terminadas.push({ id, actualizado: task.actualizado });
    } catch {
      // Rota o ilegible: ya la senala la comprobacion `tareas`.
    }
  }
  return terminadas;
}

/**
 * La fecha del documento es la de su ultimo commit (`%cI`), no el mtime: el
 * mtime cambia al clonar o al cambiar de rama y no dice cuando se escribio.
 */
export function comprobarDocumentoEstado(
  cwd: string,
  cfg: TaskcodeConfig | null,
  repo: EstadoRepo,
  ahora: Date
): Comprobacion {
  if (cfg === null) return omitida('documento-estado', 'la config no se pudo leer (ver config)');
  const ruta = cfg.documento_estado;
  const existe = ruta !== null && existsSync(path.join(cwd, ruta));
  // La config valida la forma de la ruta, no lo que hay en disco: una carpeta
  // existente no es un documento y no tiene sentido fecharla (MEN-1).
  if (ruta !== null && existe && !statSync(path.join(cwd, ruta)).isFile()) {
    return aviso(
      'documento-estado',
      `${ruta}, declarado en documento_estado, no es un fichero (es una carpeta)`,
      `Apunta documento_estado al fichero del documento de estado (p. ej. ${ruta.replace(/\/+$/, '')}/ESTADO.md) en .taskcode/config.yml.`
    );
  }
  let fecha: string | null = null;
  if (ruta !== null && existe && repo.conCommits) {
    const r = git(['log', '-1', '--format=%cI', '--', ruta], cwd);
    if (r.error !== undefined || r.status !== 0) {
      throw new Error(`git log -- ${ruta} fallo: ${r.error?.message ?? r.stderr}`);
    }
    fecha = r.stdout === '' ? null : r.stdout;
  }
  return evaluarDocumentoEstado({
    ruta,
    existe,
    fechaUltimoCommit: fecha,
    hoy: diaLocal(ahora),
    terminadas: ruta !== null && existe && fecha !== null ? leerTerminadas(path.join(cwd, 'tareas')) : [],
  });
}

// ---------------------------------------------------------------------
// Plataforma (gh / glab)
// ---------------------------------------------------------------------

function comprobarPlataforma(cwd: string, cfg: TaskcodeConfig | null, hayOrigin: boolean, timeoutMs: number): Comprobacion {
  if (cfg === null) return omitida('plataforma', 'config invalida: no se sabe si hace falta gh o glab (ver config)');
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
// Hooks que alcanzan a los subagentes (TASK-076)
// ---------------------------------------------------------------------

const ARREGLO_HOOKS_SUBAGENTE =
  'Con el modo de permisos automatico, Claude Code puede denegar el lanzamiento de subagentes (Auto-Mode Bypass) si un hook ' +
  'PreToolUse reescribe el encargo. Salidas: quita Agent y Task del matcher de ese hook (si es de un plugin, con ' +
  'un hook propio de SessionStart que lo reescriba al arrancar), desactiva el plugin causante en enabledPlugins, ' +
  'o sal del modo de permisos automatico y aprueba a mano cada lanzamiento. Ver "Problemas conocidos" en docs/problemas-conocidos.md del plugin.';

/**
 * Siempre aviso como maximo: los ficheros son de terceros y el hook puede ser
 * inocuo. La sonda no lanza, asi que un fichero ajeno roto nunca acaba en el
 * `error` de `envolver`: se nombra en el mensaje y sigue.
 */
export function comprobarHooksSubagente(deps: DoctorCommandDeps): Comprobacion[] {
  const s = sondearHooksClaude(deps.configClaudeDir ?? directorioConfigClaude(), deps.repoCwd);
  const cs: Comprobacion[] = s.hallazgos.map((h) =>
    aviso(
      'hooks-subagente',
      una(`${h.origen} tiene un hook PreToolUse que alcanza a Agent/Task (matcher "${h.matcher}") en ${h.ruta}`),
      ARREGLO_HOOKS_SUBAGENTE
    )
  );
  if (s.hooksDesactivadosEn !== null) {
    return [ok('hooks-subagente', una(`los hooks estan desactivados (disableAllHooks en ${s.hooksDesactivadosEn})`))];
  }
  const nota = s.ilegibles.length === 0 ? '' : `; sin leer: ${s.ilegibles.join('; ')}`;
  if (cs.length === 0) {
    cs.push(ok('hooks-subagente', una(`ningun hook PreToolUse alcanza a Agent/Task (${s.leidos} ficheros leidos${nota})`)));
  } else if (nota !== '') {
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
export function comprobarVersionPlugin(deps: DoctorCommandDeps): Comprobacion {
  const id = 'version-plugin';
  try {
    const s = sondearVersionPlugin(deps.configClaudeDir ?? directorioConfigClaude(), deps.repoCwd);
    if (s.estado === 'no-comprobable') return omitida(id, una(`no se pudo comprobar: ${s.motivo}`));
    const copia = `la copia local del marketplace ${s.marketplace}` +
      (s.marketplaceActualizadoEn === null ? '' : ` (actualizada el ${s.marketplaceActualizadoEn})`);
    const d = compararVersiones(s.disponible, s.instalada);
    if (d > 0) {
      const clave = `${NOMBRE_PLUGIN}@${s.marketplace}`;
      return aviso(
        id,
        una(`plugin instalado ${s.instalada}, disponible ${s.disponible} en ${copia}`),
        `claude plugin marketplace update ${s.marketplace}\n` +
          `claude plugin update ${clave}\n` +
          'y reinicia Claude Code (dentro de una sesion: /plugin marketplace update y /plugin update).'
      );
    }
    if (d < 0) {
      return ok(id, una(`plugin instalado ${s.instalada}, mas nuevo que ${s.disponible} de ${copia}: esa copia esta desfasada`));
    }
    return ok(id, una(`plugin instalado ${s.instalada}, al dia con ${copia}`));
  } catch (e: unknown) {
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
export function comprobarStatusLine(deps: DoctorCommandDeps, accion: 'mirar' | 'instalar' | 'reemplazar' | 'desinstalar'): Comprobacion {
  const id = 'status-line';
  const configDir = deps.configClaudeDir ?? directorioConfigClaude();
  if (accion !== 'mirar') {
    const r: ResultadoAccion =
      accion === 'desinstalar'
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
      return omitida(
        id,
        'no instalada. Para ver en Claude Code en que va la tarea en curso (fase, paso, x/N, minutos) sin preguntar ' +
          `al agente: taskctl doctor ${FLAG_INSTALAR_STATUS_LINE} (una vez, para todos los proyectos)`
      );
    case 'ajena':
      return omitida(
        id,
        una(
          `${s.ruta} ya tiene otra status line ("${s.comando}"): no se toca. Para sustituirla por la de taskctl ` +
            `(con copia; desinstalar la devuelve): taskctl doctor ${FLAG_INSTALAR_STATUS_LINE} ${FLAG_REEMPLAZAR_STATUS_LINE}`
        )
      );
    case 'ilegible':
      return omitida(id, una(`no se pudo leer ${s.ruta}: ${s.motivo}`));
  }
}

// ---------------------------------------------------------------------
// Orquestacion
// ---------------------------------------------------------------------

export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDeps): DoctorCommandResult {
  rechazarFlagsDesconocidos(argv, FLAGS_DOCTOR, 'doctor', (m) => new DoctorCommandError(m));
  const sobra = argv.find((a) => !a.startsWith('-'));
  if (sobra !== undefined) {
    throw new DoctorCommandError(`[ERROR] taskctl doctor: no admite argumentos ("${sobra}"). ${USO_DOCTOR}`);
  }
  const instalar = argv.includes(FLAG_INSTALAR_STATUS_LINE);
  const reemplazar = argv.includes(FLAG_REEMPLAZAR_STATUS_LINE);
  const desinstalar = argv.includes(FLAG_DESINSTALAR_STATUS_LINE);
  if (reemplazar && !instalar) {
    throw new DoctorCommandError(
      `[ERROR] taskctl doctor: ${FLAG_REEMPLAZAR_STATUS_LINE} solo vale junto a ${FLAG_INSTALAR_STATUS_LINE}. No se ha tocado nada.`
    );
  }
  if (instalar && desinstalar) {
    throw new DoctorCommandError(
      `[ERROR] taskctl doctor: ${FLAG_INSTALAR_STATUS_LINE} y ${FLAG_DESINSTALAR_STATUS_LINE} se excluyen. No se ha tocado nada.`
    );
  }
  const accionStatusLine = desinstalar ? 'desinstalar' : reemplazar ? 'reemplazar' : instalar ? 'instalar' : 'mirar';
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
  let cfg: TaskcodeConfig | null = { ...CONFIG_DEFAULTS };
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
  cs.push(...envolver('rama-base', () => comprobarRamas(cwd, cfg === null ? null : cfg.rama_base, repo)));
  let hayOrigin = false;
  cs.push(
    ...envolver('origin', () => {
      const r = comprobarOrigin(cwd, repo, cfg);
      hayOrigin = r.hay;
      return r.c;
    })
  );
  cs.push(...envolver('workspace', () => comprobarWorkspace(cwd, repo, deps.timeoutGitMs ?? TIMEOUT_GIT_MS)));

  cs.push(...csConfig);
  cs.push(...envolver('verificacion', () => comprobarVerificacion(
        cfg,
        () => detectarComandosTests(cwd),
        () => contarTerminadas(tareasRoot)
      )
    )
  );
  cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
  cs.push(...envolver('puertas-verificacion', () => comprobarPuertasVerificacion(cfg)));
  const crecimientoSuite = envolver('crecimiento-suite', () => comprobarCrecimientoSuite(cwd, tareasRoot, cfg));
  cs.push(...crecimientoSuite);
  cs.push(...envolver('poda-tests', () => comprobarPodaTests(cwd, tareasRoot, cfg, crecimientoSuite)));
  cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
  cs.push(...envolver('documento-estado', () => comprobarDocumentoEstado(cwd, cfg, repo, deps.ahora ?? new Date())));
  cs.push(
    ...envolver('plataforma', () =>
      comprobarPlataforma(cwd, cfg, hayOrigin, deps.timeoutPlataformaMs ?? TIMEOUT_PLATAFORMA_MS)
    )
  );
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
