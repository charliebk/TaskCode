/**
 * Wrapper minimo sobre comandos Git puntuales que taskctl necesita
 * ejecutar el mismo (no via los scripts de Git-Flow): comprobar si el
 * workspace esta limpio y confirmar la rama activa. Deliberadamente
 * pequeno — la logica de Git-Flow en si (crear/mergear ramas) vive en
 * scripts/gitflow/, no aqui (ver seccion 7.1 de la metodologia: los
 * scripts .sh siguen siendo la unica fuente de verdad para eso).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Task } from '../core/task.js';
import { resolverConfig } from '../core/config.js';

export class GitCommandError extends Error {
  constructor(
    public readonly args: readonly string[],
    public readonly stderr: string
  ) {
    super(`git ${args.join(' ')} fallo: ${stderr.trim() || '(sin salida de error)'}`);
    this.name = 'GitCommandError';
  }
}

/**
 * "git" no se pudo ni siquiera lanzar (no esta en el PATH, etc.) —
 * distinto de GitCommandError (git se ejecuto pero devolvio un error).
 * Sin esto, un ENOENT de spawnSync se propagaba como Error generico y
 * terminaba en el catch-all de bin/taskctl con un mensaje enganoso
 * ("taskctl no pudo arrancar"), como si el propio CLI hubiera fallado
 * al arrancar en vez de faltarle una dependencia externa en tiempo de
 * ejecucion (hallazgo de revision por pares, TASK-009).
 */
export class GitLaunchError extends Error {
  constructor(public readonly originalError: Error) {
    super(`No se pudo ejecutar "git": ${originalError.message}`);
    this.name = 'GitLaunchError';
  }
}

// El default de spawnSync (1 MB) mata a git con ENOBUFS en cuanto un
// diff real supera ese tamano — lockfiles o codigo generado lo hacen
// sin esfuerzo (hallazgo IMPORTANTE de revision por pares, TASK-013:
// dejaba "taskctl review" inutilizable para esa tarea, con el merge de
// update ya consumado). 64 MB cubre cualquier diff razonable.
const GIT_MAX_BUFFER = 64 * 1024 * 1024;

/**
 * Exportada en TASK-030 (integracion): git-commit.ts la necesitaba y,
 * al no poder tocar este fichero durante el trabajo en paralelo, llevo
 * un clon de estas mismas diez lineas. Dos copias de la traduccion de
 * errores de Git a excepciones es justo lo que acaba divergiendo.
 */
export function runGit(args: readonly string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: GIT_MAX_BUFFER });
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  if (result.status !== 0) {
    throw new GitCommandError(args, result.stderr ?? '');
  }
  return (result.stdout ?? '').trim();
}

/** true si `git status --porcelain` no devuelve nada (workspace limpio). */
export function isWorkspaceClean(cwd: string): boolean {
  return runGit(['status', '--porcelain'], cwd) === '';
}

/**
 * true si `cwd` esta dentro del ARBOL DE TRABAJO de un repositorio
 * Git (TASK-026). No pasa por runGit a proposito, igual que
 * gitUserEmail: "esto no es un repo" es una respuesta valida, no un
 * error que deba propagarse como GitCommandError.
 *
 * Es `--is-inside-work-tree` y no `--git-dir` porque los cinco
 * wrappers de Git-Flow trabajan sobre ficheros del arbol: en un repo
 * bare, o con el cwd dentro de `.git/`, `--git-dir` habria dicho que
 * si y el comando habria muerto un proceso mas abajo con el "fatal"
 * crudo de Git, o peor, diagnose-repo.sh habria declarado limpio un
 * workspace que no existe (hallazgo MENOR de revision por pares).
 */
export function isInsideWorkTree(cwd: string): boolean {
  const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd,
    encoding: 'utf8',
  });
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  return result.status === 0 && (result.stdout ?? '').trim() === 'true';
}

export type OperacionGitEnCurso = 'merge' | 'rebase' | 'cherry-pick' | 'revert';

/**
 * Que operacion multi-paso hay a medias en el repo, si es que hay
 * alguna (TASK-026, ampliada en TASK-029). Mira exactamente los mismos
 * testigos que `abort-merge.sh` — y eso es deliberado: si taskctl
 * detectara mas que el script habria dos comportamientos distintos
 * segun haya terminal o no.
 *
 * Cada ruta se resuelve con `git rev-parse --git-path` en vez de
 * concatenar sobre --git-dir: asi sigue valiendo dentro de un
 * worktree enlazado, donde estos ficheros no viven en el .git
 * principal (comprobado: en un worktree enlazado con un cherry-pick a
 * medias, --git-path devuelve .git/worktrees/<nombre>/CHERRY_PICK_HEAD
 * y el fichero esta ahi).
 *
 * `--git-path` devuelve una ruta relativa al cwd de Git, no al
 * proceso: se resuelve contra `cwd` antes de mirar el disco.
 *
 * Sobre los dos testigos de TASK-029, medidos en git 2.55 y no
 * supuestos:
 *
 * - Un cherry-pick en conflicto deja `CHERRY_PICK_HEAD`; un revert en
 *   conflicto deja `REVERT_HEAD`. Ninguno de los dos deja `MERGE_HEAD`,
 *   ni siquiera al revertir un commit de merge con `-m 1`.
 * - Una secuencia multi-commit deja ademas `.git/sequencer/`, y puede
 *   quedar viva SIN ninguno de los dos ficheros anteriores: si se
 *   resuelve el conflicto y se hace `git commit` a mano en vez de
 *   `--continue`, Git borra CHERRY_PICK_HEAD pero deja el sequencer con
 *   los commits pendientes, y `--abort` sigue funcionando. Sin mirar el
 *   directorio, ese estado se reportaria como "normal", que es
 *   justamente el mensaje falso que TASK-029 viene a quitar.
 * - Un rebase (interactivo o no) NO deja CHERRY_PICK_HEAD ni sequencer:
 *   usa `rebase-merge` y `REBASE_HEAD`. No hay colision entre los dos
 *   grupos de testigos.
 * - `git cherry-pick -n` en conflicto no deja NINGUN testigo, y Git
 *   mismo responde "no cherry-pick or revert in progress" a `--abort`.
 *   No hay nada que abortar y aqui se devuelve null, igual que Git.
 */
export function operacionEnCurso(cwd: string): OperacionGitEnCurso | null {
  const gitPath = (nombre: string): string =>
    path.resolve(cwd, runGit(['rev-parse', '--git-path', nombre], cwd));
  if (existsSync(gitPath('MERGE_HEAD'))) return 'merge';
  if (existsSync(gitPath('rebase-merge')) || existsSync(gitPath('rebase-apply'))) return 'rebase';
  if (existsSync(gitPath('CHERRY_PICK_HEAD'))) return 'cherry-pick';
  if (existsSync(gitPath('REVERT_HEAD'))) return 'revert';
  const sequencer = gitPath('sequencer');
  if (existsSync(sequencer)) {
    // El "todo" distingue las dos: sus entradas son "pick <sha>" para
    // cherry-pick y "revert <sha>" para revert. Se mira el fichero
    // entero, no solo su primera linea: Git no mezcla los dos verbos en
    // una misma secuencia, asi que basta con encontrar uno. Si no se
    // puede leer se asume cherry-pick, que es inofensivo: `git revert
    // --abort` aborta un cherry-pick y viceversa (misma maquinaria).
    let todo = '';
    try {
      todo = readFileSync(path.join(sequencer, 'todo'), 'utf8');
    } catch {
      todo = '';
    }
    return /^revert /m.test(todo) ? 'revert' : 'cherry-pick';
  }
  return null;
}

/** Nombre de la rama activa (equivalente a `git branch --show-current`). */
export function currentBranch(cwd: string): string {
  return runGit(['branch', '--show-current'], cwd);
}

/**
 * true si `name` es un nombre de rama valido para Git (delega en
 * `git check-ref-format`, la misma comprobacion que ya hace
 * `assert_valid_branch_name` en _gitflow-common.sh). Defensa en
 * profundidad (hallazgo menor de revision por pares, TASK-009): sin
 * esto, un `task.rama` invalido solo se detecta varios procesos mas
 * abajo, dentro del script de Git-Flow.
 */
export function isValidBranchName(name: string, cwd: string): boolean {
  const result = spawnSync('git', ['check-ref-format', '--branch', name], {
    cwd,
    encoding: 'utf8',
  });
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  return result.status === 0;
}

/**
 * true si "git ls-remote --heads origin" responde sin error: hay un
 * remoto "origin" configurado y alcanzable. No distingue "no hay
 * origin" de "hay origin pero no hay red" — ninguno de los dos casos
 * cambia lo que taskctl debe hacer (seguir en modo local), igual que
 * ya asume _gitflow-common.sh.
 */
export function isRemoteAvailable(cwd: string): boolean {
  const result = spawnSync('git', ['ls-remote', '--heads', 'origin'], { cwd, encoding: 'utf8' });
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  return result.status === 0;
}

/**
 * Identidad Git de quien ejecuta el comando: el valor de
 * `git config user.email`, o null si no hay ninguno configurado
 * (TASK-024, item C7). Es lo que "plan" y "start" usan como
 * asignado_a por defecto.
 *
 * Unica funcion de este modulo que NO pasa por runGit, a proposito:
 * runGit convierte cualquier exit != 0 en GitCommandError, y
 * `git config <clave>` sale con codigo 1 exactamente cuando la clave
 * no existe. "Esta maquina no tiene identidad configurada" es un
 * estado legitimo — la tarea se queda sin asignar, como antes de
 * TASK-024 — y no un error que deba abortar el comando.
 *
 * Un fallo de lanzamiento de spawnSync SI se propaga como
 * GitLaunchError. Ojo con su mensaje, que es el generico del modulo y
 * culpa a Git: la causa habitual no es que falte el binario, sino que
 * el cwd no exista (hallazgo MENOR de revision por pares, TASK-024).
 */
export function gitUserEmail(cwd: string): string | null {
  const result = spawnSync('git', ['config', 'user.email'], { cwd, encoding: 'utf8' });
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  if (result.status !== 0) return null;
  const email = (result.stdout ?? '').trim();
  return email === '' ? null : email;
}

/**
 * Nombres de todas las ramas LOCALES (TASK-025). Solo locales a
 * proposito: mirar las remotas obligaria a un "fetch" — red, lentitud
 * y un modo de fallo nuevo en un comando que hoy funciona sin
 * conexion — y convertiria el limite de WIP, que es personal, en uno
 * de equipo que nadie ha decidido.
 */
export function localBranches(cwd: string): string[] {
  return runGit(['for-each-ref', '--format=%(refname:short)', 'refs/heads'], cwd)
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** SHA completo del commit en HEAD. */
export function headCommit(cwd: string): string {
  return runGit(['rev-parse', 'HEAD'], cwd);
}

/**
 * true si `ancestor` es antepasado de `descendant` (via
 * `git merge-base --is-ancestor`). Es la evidencia que usa
 * "taskctl review" (TASK-013) para confirmar que el update desde la
 * rama base ocurrio de verdad, en vez de fiarse del exit 0 del script
 * — mismo principio "evidencia, no suposicion" de TASK-007/009.
 */
export function isAncestor(ancestor: string, descendant: string, cwd: string): boolean {
  // --end-of-options: sin el, una rama llamada -x (Git la permite via
  // update-ref aunque git branch la rechace) se parsea como opcion y el
  // comando muere con un error enganoso que ademas culpa a tareasRoot
  // (hallazgo MENOR de revision por pares, TASK-025).
  const args = ['merge-base', '--is-ancestor', '--end-of-options', ancestor, descendant] as const;
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  if (result.status === 0) return true;
  // Codigo 1 = "no es antepasado" (respuesta valida). Cualquier otro
  // codigo es un error real (ref inexistente, repo corrupto...).
  if (result.status === 1) return false;
  throw new GitCommandError(args, result.stderr ?? '');
}

/** `git log --oneline <desde>..<hasta>` (vacio si no hay commits). */
export function logOneline(desde: string, hasta: string, cwd: string): string {
  return runGit(['log', '--oneline', `${desde}..${hasta}`], cwd);
}

/** `git diff <desde>..<hasta>` (vacio si no hay diferencias). */
export function diffRange(desde: string, hasta: string, cwd: string): string {
  return runGit(['diff', `${desde}..${hasta}`], cwd);
}

export interface DiffParaRevision {
  /** Ficheros cuyo diff se embebe en la peticion. */
  incluidos: string[];
  /** Ficheros que cambian pero casan con algun patron de exclusion. */
  excluidos: string[];
  /** `git diff desde..hasta` sin los excluidos. */
  diff: string;
  /** `git diff --stat` de solo los excluidos ('' si no hay ninguno). */
  stat: string;
}

/**
 * El diff que se embebe en una peticion de revision (TASK-034), sin los
 * ficheros que casan con `excluir` (patrones `git :(glob)`, ya
 * normalizados por config.ts).
 *
 * Git es la UNICA implementacion de los patrones: incluidos, excluidos,
 * diff y stat salen todos de pathspecs, nunca de `path.matchesGlob`. Dos
 * motores de glob para el mismo hecho divergen en `**`, en los
 * separadores de Windows y en las comillas (lo vio el rol de
 * arquitectura del brainstorm). Y como los argumentos son los patrones y
 * no la lista de ficheros, la linea de comandos no crece con el diff.
 */
export function diffParaRevision(
  desde: string,
  hasta: string,
  excluir: readonly string[],
  cwd: string
): DiffParaRevision {
  const rango = `${desde}..${hasta}`;
  const sinExcluidos = ['--', '.', ...excluir.map((p) => `:(exclude,glob)${p}`)];
  const nombres = (args: readonly string[]): string[] =>
    runGit(['diff', '--name-only', rango, ...args], cwd)
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '');

  const todos = nombres([]);
  const incluidos = excluir.length === 0 ? todos : nombres(sinExcluidos);
  const enIncluidos = new Set(incluidos);
  const excluidos = todos.filter((f) => !enIncluidos.has(f));
  return {
    incluidos,
    excluidos,
    diff: excluir.length === 0 ? runGit(['diff', rango], cwd) : runGit(['diff', rango, ...sinExcluidos], cwd),
    stat:
      excluidos.length === 0
        ? ''
        : runGit(['diff', '--stat', rango, '--', ...excluir.map((p) => `:(glob)${p}`)], cwd),
  };
}

/**
 * Rutas (con "/" de Git) que cambian entre `desde` y `hasta`, sin el
 * contenido del diff (TASK-018: es la entrada del clasificador por
 * dominio de "taskctl review" — clasificar necesita solo los nombres,
 * no el diff completo). Mismo estilo que lsTreeNames.
 */
export function diffNameOnly(desde: string, hasta: string, cwd: string): string[] {
  return runGit(['diff', '--name-only', `${desde}..${hasta}`], cwd)
    .split('\n')
    .filter((line) => line !== '');
}

/**
 * Resultado de intentar lanzar "codex review ..." (TASK-020). NUNCA
 * lanza una excepcion, a diferencia de runGit: ni por ENOENT (codex no
 * instalado) ni por un exit distinto de cero (fallo de auth, modelo,
 * red o cuota — evidencia real en esta maquina). Decision de Carlos:
 * los dos casos degradan EXACTAMENTE IGUAL en "taskctl codex-review"
 * (avisa, sale con codigo 0, no escribe informe), asi que el wrapper se
 * limita a informar que paso — no decide el mismo si eso cuenta como
 * fallo, para no duplicar esa politica aqui y en el comando.
 */
export interface CodexReviewInvocation {
  /** Argumentos para "codex" (sin el nombre del binario). */
  args: readonly string[];
  cwd: string;
}

export interface CodexReviewOutcome {
  /**
   * true si el proceso "codex" se pudo LANZAR, con independencia de si
   * termino en exit 0 o no. false solo cuando ni siquiera arranco
   * (ENOENT u otro fallo de spawn) — mismo campo "result.error" que
   * runGit inspecciona, pero devuelto en vez de lanzado como excepcion.
   */
  lanzado: boolean;
  /** Codigo de salida de "codex", o null si ni siquiera se pudo lanzar. */
  code: number | null;
  /** Salida estandar cruda ('' si no se lanzo). */
  stdout: string;
  /** Motivo por el que no se pudo lanzar, null si lanzado es true. */
  errorLanzamiento: Error | null;
}

/**
 * Escapado para `cmd.exe` (hallazgo IMPORTANTE de revision por pares,
 * ronda 1): con `shell: true` en Windows, `spawnSync` NO cita los
 * elementos del array de argumentos por su cuenta (a diferencia de la
 * shell POSIX, que si recibe cada elemento como una palabra propia).
 * Sin este escapado, un argumento con espacios (p. ej. el titulo de la
 * tarea) llega a `codex` partido en varias palabras. Envuelve en
 * comillas dobles si el argumento tiene espacio o algun caracter que
 * `cmd.exe` interpreta (comilla, `&`, `|`, `<`, `>`, `^`), doblando las
 * comillas internas — mismo criterio que usa Node internamente para
 * `.bat`/`.cmd` en versiones que sí lo resuelven solas.
 *
 * El `%` NO se soluciona envolviendo en comillas (hallazgo IMPORTANTE de
 * revision por pares, ronda 2, verificado empiricamente): `cmd.exe`
 * expande `%NOMBRE_DE_VARIABLE%` como parte del parseo de la linea de
 * comandos, con independencia de si el texto esta entre comillas. Con
 * `--title` alimentado por `task.titulo` (texto libre de una persona),
 * un titulo con la forma "... %USERNAME% ..." llegaria a Codex con el
 * valor real de esa variable de entorno de esta maquina sustituido en
 * su lugar — filtracion silenciosa de datos locales hacia una llamada
 * de red externa, sin que haga falta intencion adversaria. No hay forma
 * fiable de escapar `%` para una unica invocacion de `cmd.exe /c` desde
 * fuera de un script `.bat` (el truco de doblar `%%` es especifico del
 * cuerpo de un `.bat`, y no se comporta igual aqui — verificado). Se
 * elimina el caracter en vez de intentar escaparlo: mas seguro que
 * intentar una regla de escape fragil para el caracter mas dificil de
 * `cmd.exe`.
 *
 * Efecto secundario aceptado (revision por pares, ronda 3): un `%`
 * literal LEGITIMO en el argumento (p. ej. un titulo de tarea como
 * "mejora un 30% el rendimiento") tambien desaparece, sin distinguir
 * "abre una variable de entorno real" de "es solo texto" — no hay forma
 * de diferenciar los dos casos de forma fiable en esta capa. Se acepta:
 * es un efecto cosmetico en un argumento informativo de una llamada
 * externa best-effort (`codex review` ya puede degradarse o fallar por
 * completo), frente a la alternativa real, que era filtrar datos del
 * entorno del usuario.
 */
function cmdQuoteWindows(arg: string): string {
  const sinPorcentaje = arg.replace(/%/g, '');
  if (sinPorcentaje === '' || /["\s&|<>^]/.test(sinPorcentaje)) {
    return `"${sinPorcentaje.replace(/"/g, '""')}"`;
  }
  return sinPorcentaje;
}

/**
 * Lanza "codex <args>" (TASK-020). En Windows, un paquete npm global
 * instala `codex` como `codex.cmd`: `spawnSync` sin `shell: true` no
 * resuelve `.cmd`/`.bat` por su nombre sin extension (restriccion de
 * Node documentada, no un accidente de esta maquina) y devuelve
 * `ENOENT` SIEMPRE, aunque el binario funcione perfectamente desde una
 * shell — confirmado empiricamente en esta misma maquina (hallazgo
 * IMPORTANTE de revision por pares, ronda 1: `runCodexReview`
 * diagnosticaba "no instalado" cuando si lo estaba). `shell: true` solo
 * en Windows (en POSIX `codex` se lanza directo, sin ese problema, y
 * evitar la shell ahi evita el riesgo de inyeccion que no hace falta
 * correr); los argumentos se citan a mano para `cmd.exe` antes de
 * pasarlos, porque con `shell: true` Node NO cita el array de
 * argumentos en Windows (verificado: sin citar, un argumento con
 * espacios llega partido en varias palabras a `codex`).
 */
export function runCodexReview(invocation: CodexReviewInvocation): CodexReviewOutcome {
  const useShell = process.platform === 'win32';
  const args = useShell ? invocation.args.map(cmdQuoteWindows) : invocation.args;
  const result = spawnSync('codex', args, {
    cwd: invocation.cwd,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER,
    shell: useShell,
  });
  if (result.error) {
    return { lanzado: false, code: null, stdout: '', errorLanzamiento: result.error };
  }
  return { lanzado: true, code: result.status, stdout: result.stdout ?? '', errorLanzamiento: null };
}

/**
 * `git diff <desde>..<hasta> -- <paths>`, acotado a un subconjunto de
 * ficheros (TASK-018): el sub-diff que recibe cada revisor de dominio,
 * para que "cada revisor recibe solo el subconjunto del diff de su
 * dominio" (criterio de aceptacion 3) sea un `git diff` filtrado y no el
 * diff entero con una instruccion de "ignora lo que no sea tuyo". Vacio
 * si `paths` esta vacio, sin llamar a Git (una peticion sin ficheros no
 * tiene nada que pedirle).
 */
export function diffRangeForPaths(
  desde: string,
  hasta: string,
  paths: readonly string[],
  cwd: string
): string {
  if (paths.length === 0) return '';
  return runGit(['diff', `${desde}..${hasta}`, '--', ...paths], cwd);
}

/**
 * Rutas (con "/" de Git, no separador del SO) de los ficheros bajo
 * `prefix` en el arbol de `ref`, sin tocar el working tree. Lo usa
 * "taskctl finish" (TASK-014) para detectar colisiones de IDs contra
 * develop/main antes de mergear.
 */
export function lsTreeNames(ref: string, prefix: string, cwd: string): string[] {
  return runGit(['ls-tree', '-r', '--name-only', '--end-of-options', ref, '--', prefix], cwd)
    .split('\n')
    .filter((line) => line !== '');
}

/** Contenido de `filePath` (ruta con "/" de Git) en el arbol de `ref`. */
export function showFileAtRef(ref: string, filePath: string, cwd: string): string {
  return runGit(['show', `${ref}:${filePath}`], cwd);
}

/** SHA del ancestro comun de `a` y `b` (git merge-base). */
export function mergeBase(a: string, b: string, cwd: string): string {
  return runGit(['merge-base', a, b], cwd);
}

/** Cambia a una rama local existente (checkout -q). */
export function checkoutBranch(name: string, cwd: string): void {
  runGit(['checkout', '-q', name], cwd);
}

/** true si existe una referencia LOCAL para esa rama. */
export function localBranchExists(name: string, cwd: string): boolean {
  const result = spawnSync(
    'git',
    ['show-ref', '--verify', '--quiet', `refs/heads/${name}`],
    { cwd, encoding: 'utf8' }
  );
  if (result.error) {
    throw new GitLaunchError(result.error);
  }
  return result.status === 0;
}

/** true si esa rama existe en "origin". Asume que ya se llamo isRemoteAvailable. */
function remoteBranchExists(name: string, cwd: string): boolean {
  const output = runGit(['ls-remote', '--heads', 'origin', name], cwd);
  return output
    .split('\n')
    .some((line) => line.trim().endsWith(`refs/heads/${name}`));
}

/**
 * Reimplementacion en TypeScript de resolve_main_branch()
 * (_gitflow-common.sh): que rama usar como base "principal" cuando no
 * hay una preferencia explicita (orden: origin/main, origin/master,
 * main local, master local, "master" por defecto). No se invoca la
 * funcion Bash porque vive pensada para ser sourceada desde los
 * scripts create-*.sh, no como script independiente invocable — mismo
 * motivo por el que isValidBranchName (TASK-009) ya reimplemento
 * assert_valid_branch_name en vez de intentar invocar la funcion sola.
 */
export function resolveMainBranch(cwd: string): string {
  if (isRemoteAvailable(cwd)) {
    if (remoteBranchExists('main', cwd)) return 'main';
    if (remoteBranchExists('master', cwd)) return 'master';
  }
  if (localBranchExists('main', cwd)) return 'main';
  if (localBranchExists('master', cwd)) return 'master';
  return 'master';
}

const RAMA_BASE_ES_DEVELOP: Record<Task['tipo'], boolean> = {
  feature: true,
  fix: true,
  release: true,
  hotfix: false,
};

/**
 * Rama base esperada para un tipo de tarea (seccion 8.3): la rama base
 * configurada para feature/fix/release, resolveMainBranch() para
 * hotfix.
 *
 * Hasta TASK-030 (item C4) "develop" era un literal aqui — el unico
 * hardcode de los tres de la decision #9 que no se podia detectar
 * solo. Ahora sale de `.taskcode/config.yml` (clave `rama_base`), y
 * sin fichero resolverConfig devuelve exactamente "develop": el
 * comportamiento no cambia.
 *
 * El config se lee AQUI y no se pasa por parametro a proposito: este
 * es el unico punto por el que pasan los 8 comandos para saber su rama
 * base (via ensureBaseBranchReady, start y review), asi que cablearlo
 * aqui garantiza que ninguno se quede fuera. Un parametro opcional
 * dejaria que un comando futuro se olvidara de pasarlo y volviera al
 * default en silencio, que es justo lo que la regla 2 de C4 prohibe.
 *
 * Los hotfix NO usan `rama_base`: cuelgan de la rama principal, que
 * resolveMainBranch detecta sola. La decision #9 descarta
 * `rama_principal` como clave precisamente porque esa deteccion ya
 * funciona.
 */
export function resolveBaseBranchForTipo(tipo: Task['tipo'], cwd: string): string {
  if (!RAMA_BASE_ES_DEVELOP[tipo]) return resolveMainBranch(cwd);
  return resolverConfig(cwd).rama_base;
}

export class BaseBranchGuardError extends Error {}

export interface BaseBranchGuardResult {
  baseBranch: string;
  /** true si taskctl tuvo que cambiar de rama para llegar a baseBranch. */
  switched: boolean;
  /** Rama activa ANTES de la comprobacion (para el mensaje al usuario). */
  branchAntes: string;
}

/**
 * Precondicion de la seccion 8.3, pasos 1 a 3 (TASK-012): resuelve la
 * rama base esperada segun el tipo de tarea, aborta sin tocar nada si
 * el workspace tiene cambios sin commitear, y si esta limpio pero no
 * esta ya en la base, cambia automaticamente (creando tracking local a
 * origin/<base> si hace falta y hay remoto) y hace "pull --ff-only"
 * cuando hay remoto disponible. El paso 4 (logica propia de cada
 * comando) lo hace el caller despues de que esto no lance. El paso 5
 * (comitear y subir lo que el comando genere) queda fuera de alcance a
 * proposito — ver el Objetivo de TASK-012 en su tarea.md.
 */
export function ensureBaseBranchReady(tipo: Task['tipo'], cwd: string): BaseBranchGuardResult {
  const branchAntes = currentBranch(cwd);

  // Comprobacion sin red ANTES de resolver la rama base (que para
  // "hotfix" puede necesitar hasta 3 "git ls-remote"): el caso mas
  // comun de todos — workspace sucio — no deberia pagar ese coste
  // (hallazgo menor de revision por pares, TASK-012). El mensaje no
  // menciona la rama base esperada a proposito: es literalmente el
  // ejemplo de la seccion 8.3 de la metodologia, que tampoco la
  // menciona. Desde TASK-026 tambien nombra "taskctl pause", como el
  // ejemplo de la 8.3 — hasta entonces se omitia porque ese comando
  // no existia (hallazgo MENOR de revision por pares, TASK-026).
  if (!isWorkspaceClean(cwd)) {
    throw new BaseBranchGuardError(
      `[ERROR] Hay cambios sin guardar en "${branchAntes}". Guardalos ("taskctl pause") o ` +
        'comitealos antes de continuar.'
    );
  }

  const baseBranch = resolveBaseBranchForTipo(tipo, cwd);
  if (branchAntes === baseBranch) {
    return { baseBranch, switched: false, branchAntes };
  }

  const remoteAvailable = isRemoteAvailable(cwd);
  const existeLocal = localBranchExists(baseBranch, cwd);

  if (!existeLocal && !remoteAvailable) {
    throw new BaseBranchGuardError(
      `[ERROR] La rama base "${baseBranch}" no existe en local y no hay conexion con origin ` +
        'para crearla. Revisa el repo antes de continuar.'
    );
  }

  try {
    if (existeLocal) {
      runGit(['checkout', '-q', baseBranch], cwd);
    } else {
      runGit(['checkout', '-q', '-b', baseBranch, `origin/${baseBranch}`], cwd);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new BaseBranchGuardError(
      `[ERROR] No se pudo cambiar a la rama base "${baseBranch}": ${msg}`
    );
  }

  // El pull va en su propio try/catch (hallazgo importante de revision
  // por pares, TASK-012): si el checkout de arriba tuvo exito, la rama
  // activa YA cambio de verdad, aunque el pull falle despues (por
  // ejemplo, develop local diverge de origin/develop). Envolver ambos
  // en un unico catch daba un mensaje que sonaba a "no se cambio de
  // rama" cuando en realidad si se habia cambiado y se quedaba asi, sin
  // deshacerse — el mensaje de aqui deja claro que el cambio de rama
  // ya es un hecho consumado y hay que resolver el pull a mano.
  if (remoteAvailable) {
    try {
      runGit(['pull', '--ff-only', 'origin', baseBranch], cwd);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BaseBranchGuardError(
        `[ERROR] Se cambio a la rama base "${baseBranch}" pero no se pudo actualizar con ` +
          `"pull --ff-only": ${msg} La rama activa AHORA es "${baseBranch}" (el cambio de rama ` +
          'no se deshizo); resuelve el pull a mano antes de reintentar.'
      );
    }
  }

  // Evidencia, no suposicion (mismo principio que TASK-007/009): un
  // "git checkout" sin error no basta por si solo, se confirma la
  // rama activa real antes de dejar seguir al comando.
  const branchDespues = currentBranch(cwd);
  if (branchDespues !== baseBranch) {
    throw new BaseBranchGuardError(
      `[ERROR] Se intento cambiar a "${baseBranch}" pero la rama activa es "${branchDespues}". ` +
        'No se ha tocado ningun fichero de la tarea; revisa el repo a mano.'
    );
  }

  return { baseBranch, switched: true, branchAntes };
}
