/**
 * `taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar`
 * — TASK-058.
 *
 * Bloqueo por arbol de trabajo mientras dura una cadena de fases
 * (semiautomatico y automatico). Dos sesiones sobre el mismo arbol harian
 * checkout y commits a la vez y el trabajo acabaria en la rama equivocada
 * (riesgo del plan de TASK-055). El bloqueo vive en el directorio de Git
 * (`git rev-parse --git-path`), fuera del arbol: no ensucia el workspace y
 * en un worktree enlazado es propio de ese worktree.
 *
 * Una sesion de Claude Code no tiene identidad que el CLI pueda ver, asi que
 * la identidad es un TESTIGO: `abrir` lo genera y lo imprime, las skills lo
 * pasan de una a la siguiente con `--cadena`, y solo quien lo tiene puede
 * comprobar o cerrar el bloqueo.
 *
 * El fichero se crea con la bandera `wx` (falla si existe): dos `abrir` a la
 * vez no pueden ganar los dos.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { runGit } from '../fs/git.js';
import { isEexist, isEnoent } from '../fs/task-store.js';
import { isValidTaskId } from '../core/task.js';

export class CadenaCommandError extends Error {}

/** Flags de `taskctl cadena`: solo --forzar (de `cerrar`). --cadena no va aqui: cli.ts lo quita antes de despachar. */
export const FLAGS_CADENA: readonly string[] = ['--forzar'];

export interface CadenaCommandDeps {
  repoCwd: string;
  /** Solo para tests: el instante actual. */
  ahora?: () => Date;
}

export interface Bloqueo {
  tarea: string;
  testigo: string;
  abierto: string;
}

export type CadenaCommandResult =
  | { accion: 'abrir'; bloqueo: Bloqueo; ruta: string }
  | { accion: 'comprobar'; bloqueo: Bloqueo }
  | { accion: 'cerrar'; ruta: string; existia: boolean };

/** Ruta absoluta del bloqueo, en el directorio de Git de este arbol. */
export function rutaBloqueo(repoCwd: string): string {
  return path.resolve(repoCwd, runGit(['rev-parse', '--git-path', 'taskcode/cadena.lock'], repoCwd));
}

/** Forma de un testigo valido: el que genera `abrir` (MEN-2: un vacio no puede casar con nada). */
const TESTIGO_RE = /^[0-9a-f]{16}$/;

function exigirTestigo(arg: string | undefined, uso: string): string {
  if (arg === undefined || !TESTIGO_RE.test(arg)) {
    throw new CadenaCommandError(`[ERROR] Testigo de cadena ausente o mal formado. Uso: ${uso}.`);
  }
  return arg;
}

async function leerBloqueo(ruta: string): Promise<Bloqueo | null> {
  let texto: string;
  try {
    texto = await readFile(ruta, 'utf8');
  } catch (e: unknown) {
    if (isEnoent(e)) return null;
    throw e;
  }
  try {
    const b = JSON.parse(texto) as Partial<Bloqueo>;
    if (typeof b.tarea === 'string' && typeof b.testigo === 'string' && typeof b.abierto === 'string') {
      return { tarea: b.tarea, testigo: b.testigo, abierto: b.abierto };
    }
  } catch {
    // Fichero roto: se trata como un bloqueo de origen desconocido.
  }
  return { tarea: '(desconocida)', testigo: '', abierto: '(desconocido)' };
}

function antiguedad(abierto: string, ahora: Date): string {
  const t = Date.parse(abierto);
  if (Number.isNaN(t)) return 'desde un momento desconocido';
  const min = Math.max(0, Math.round((ahora.getTime() - t) / 60000));
  return min < 60 ? `hace ${String(min)} min` : `hace ${String(Math.round(min / 60))} h`;
}

function mensajeOcupado(b: Bloqueo, ruta: string, ahora: Date): string {
  return (
    `[ERROR] Hay otra cadena de fases en marcha en este arbol de trabajo: ${b.tarea}, ` +
    `abierta ${antiguedad(b.abierto, ahora)} (${ruta}).\n` +
    '        Dos sesiones encadenando fases sobre el mismo arbol se pisan las ramas. Espera a ' +
    'que termine, o trabaja desde otro worktree.\n' +
    '        Si esa sesion ya no existe (se corto a medias): taskctl cadena cerrar --forzar'
  );
}

export async function runCadenaCommand(
  argv: readonly string[],
  deps: CadenaCommandDeps
): Promise<CadenaCommandResult> {
  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
  rechazarFlagsDesconocidos(argv, FLAGS_CADENA, 'cadena', (m) => new CadenaCommandError(m));
  const ahora = (deps.ahora ?? (() => new Date()))();
  const [accion, arg] = argv;
  const ruta = rutaBloqueo(deps.repoCwd);

  switch (accion) {
    case 'abrir': {
      if (arg === undefined || !isValidTaskId(arg)) {
        throw new CadenaCommandError('[ERROR] Uso: taskctl cadena abrir TASK-NNN.');
      }
      const bloqueo: Bloqueo = {
        tarea: arg,
        testigo: randomBytes(8).toString('hex'),
        abierto: ahora.toISOString(),
      };
      await mkdir(path.dirname(ruta), { recursive: true });
      try {
        await writeFile(ruta, `${JSON.stringify(bloqueo)}\n`, { encoding: 'utf8', flag: 'wx' });
      } catch (e: unknown) {
        if (!isEexist(e)) throw e;
        const otro = await leerBloqueo(ruta);
        // MEN-3: si se borro entre el EEXIST y la lectura, el arbol quedo libre
        // en ese instante; no se reintenta (otra sesion puede estar abriendo).
        if (otro === null) {
          throw new CadenaCommandError(
            '[ERROR] Otra sesion estaba abriendo o cerrando una cadena en este arbol justo ahora. ' +
              'Reintenta en un momento.'
          );
        }
        throw new CadenaCommandError(mensajeOcupado(otro, ruta, ahora));
      }
      return { accion: 'abrir', bloqueo, ruta };
    }
    case 'comprobar': {
      exigirTestigo(arg, 'taskctl cadena comprobar <testigo>');
      const b = await leerBloqueo(ruta);
      if (b === null) {
        throw new CadenaCommandError(
          '[ERROR] La cadena ya no esta abierta en este arbol (se cerro o se forzo su cierre). ' +
            'Para seguir, lanza la skill de la fase sin --cadena: abrira una nueva si hace falta.'
        );
      }
      if (b.testigo !== arg) throw new CadenaCommandError(mensajeOcupado(b, ruta, ahora));
      return { accion: 'comprobar', bloqueo: b };
    }
    case 'cerrar': {
      const b = await leerBloqueo(ruta);
      if (arg === '--forzar') {
        await rm(ruta, { force: true });
        return { accion: 'cerrar', ruta, existia: b !== null };
      }
      exigirTestigo(arg, 'taskctl cadena cerrar <testigo> | cerrar --forzar');
      if (b === null) return { accion: 'cerrar', ruta, existia: false };
      if (b.testigo !== arg) {
        throw new CadenaCommandError(
          `[ERROR] El testigo no es el de la cadena abierta (${b.tarea}): no se cierra la cadena ` +
            'de otra sesion. Si esa sesion ya no existe: taskctl cadena cerrar --forzar'
        );
      }
      await rm(ruta, { force: true });
      return { accion: 'cerrar', ruta, existia: true };
    }
    default:
      throw new CadenaCommandError(
        '[ERROR] Uso: taskctl cadena abrir TASK-NNN | comprobar <testigo> | cerrar <testigo> | cerrar --forzar.'
      );
  }
}

/**
 * Comandos que escriben en el repo o cambian de rama: con una cadena abierta
 * en el arbol solo se ejecutan con su testigo. Los de solo lectura (board,
 * siguiente, diagnose) y `cadena` quedan fuera. Exportada para que el test
 * recorra la lista entera (IMP-1 de la ronda 2 de la revision).
 */
export const GUARDADOS_POR_CADENA: ReadonlySet<string> = new Set([
  'new',
  'import',
  'plan',
  'approve',
  'start',
  'review',
  'codex-review',
  'veredicto',
  'finish',
  'pausa',
  'pause',
  'resume',
  'recover',
  'abort-merge',
]);

/**
 * IMP-1 de la revision: el bloqueo lo hace cumplir el CLI, no la buena
 * voluntad de las skills. Todo comando que escribe en el repo o cambia de
 * rama pasa por aqui antes de hacer nada:
 * - sin cadena abierta: sigue, salvo que traiga un testigo (esa cadena ya se
 *   cerro: seguir encadenando sobre ella seria trabajar sin bloqueo);
 * - con una cadena abierta: sigue solo con su testigo (`--cadena <testigo>`).
 * Asi una segunda sesion no puede hacer checkout ni commit mientras otra
 * encadena fases, aunque no pase por `cadena abrir`.
 */
export async function verificarCadena(repoCwd: string, testigo: string | undefined, ahora = new Date()): Promise<void> {
  if (testigo !== undefined) exigirTestigo(testigo, 'taskctl <comando> ... --cadena <testigo>');
  let ruta: string;
  try {
    ruta = rutaBloqueo(repoCwd);
  } catch {
    // MEN-1 (r2): fuera de un repo no hay bloqueo que hacer cumplir; el
    // comando dara su propio error, que dice que hacer.
    return;
  }
  const b = await leerBloqueo(ruta);
  if (b === null) {
    if (testigo === undefined) return;
    throw new CadenaCommandError(
      '[ERROR] La cadena de ese testigo ya no esta abierta en este arbol. No se ha tocado nada. ' +
        'Para seguir, lanza la fase sin --cadena.'
    );
  }
  if (testigo === b.testigo) return;
  throw new CadenaCommandError(
    mensajeOcupado(b, ruta, ahora) +
      (testigo === undefined
        ? '\n        Si esa cadena es de esta misma sesion, pasa su testigo con --cadena <testigo>.'
        : '')
  );
}

/** Saca `--cadena <testigo>` (o `--cadena=<testigo>`) de argv. Sin valor, testigo vacio (y falla al validar). */
export function extraerCadena(argv: readonly string[]): { testigo: string | undefined; resto: string[] } {
  const resto: string[] = [];
  let testigo: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a === '--cadena') {
      testigo = argv[i + 1] ?? '';
      i++;
    } else if (a.startsWith('--cadena=')) {
      testigo = a.slice('--cadena='.length);
    } else {
      resto.push(a);
    }
  }
  return { testigo, resto };
}
