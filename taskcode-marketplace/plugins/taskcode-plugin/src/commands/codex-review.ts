/**
 * taskctl codex-review — TASK-020. Segunda opinion INDEPENDIENTE del
 * agente revisor generico: envuelve el CLI de Codex (`codex-cli`)
 * contra el diff completo de la rama (nunca fragmentado por
 * dominio: Codex es un unico agente, no un enrutado — nota ya escrita
 * en finish.ts sobre esto) y vuelca su salida cruda en
 * `informe-codex-<ronda>.md`, con el mismo scaffold de veredicto
 * PENDIENTE que usa `informeTemplate` de la revision primaria
 * (`review.ts`).
 *
 * Solo se ejecuta si la tarea esta en-revision, `revision_codex: true`
 * y la revision primaria de mayor ronda ya aprobo — se recalcula aqui
 * con el MISMO criterio que `buildTransitionContext` de finish.ts (que
 * no se toca ni se exporta, asi que este comando reimplementa esa
 * unica pieza que necesita, en vez de acoplarse a un modulo interno de
 * otro comando).
 *
 * Decision de Carlos (2026-09-12, plan-final.md): TODO fallo de
 * "codex" — ausente del PATH (ENOENT) o presente pero con exit
 * distinto de cero (auth/modelo/red/cuota, evidencia real en esta
 * maquina) — degrada IGUAL: avisa, `taskctl codex-review` sale con
 * codigo 0, sin escribir `informe-codex-N.md`. Este comando NUNCA
 * infiere el veredicto del exit code de Codex, que no es una senal
 * fiable (confirmado empiricamente): el veredicto lo escribe despues un
 * humano/agente, sustituyendo la unica linea "- Veredicto: PENDIENTE".
 *
 * Sin informe aprobado, `revision_codex: true` sigue bloqueando
 * "taskctl finish" fail-closed, sin excepcion (state-machine.ts y
 * finish.ts YA lo hacen, y no se tocan en esta tarea).
 */
import path from 'node:path';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import type { Task } from '../core/task.js';
import { readTareaFile, isEexist, isEnoent } from '../fs/task-store.js';
import { siguienteRonda } from '../fs/rondas.js';
import { fenceFor } from '../core/markdown.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import {
  headCommit,
  resolveBaseBranchForTipo,
  runCodexReview,
  type CodexReviewInvocation,
  type CodexReviewOutcome,
} from '../fs/git.js';
import {
  autoCommit,
  extraerPushFlag,
  mensajeChore,
  type AutoCommitResult,
} from '../fs/git-commit.js';
import { veredictoAprobado } from './finish.js';
import { REVISION_DIRNAME } from './review.js';

export class CodexReviewCommandError extends Error {}

/**
 * Mismo patron que INFORME_REVISION_RE de finish.ts (no exportada de
 * alli, asi que se redefine aqui: una unica linea de regex duplicada es
 * mas barato que acoplar codex-review.ts a un simbolo interno de otro
 * comando). Acepta el sufijo opcional de dominio de TASK-018.
 */
const INFORME_REVISION_RE = /^informe-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;

/**
 * Regex de la ronda de Codex. Codex lleva SU PROPIO contador de ronda,
 * independiente del de la revision primaria (no hay garantia de que
 * coincidan: una tarea puede reintentar codex-review sin que la
 * revision primaria haya tenido una ronda nueva).
 */
export const INFORME_CODEX_RE = /^informe-codex-(\d+)\.md$/;

export interface CodexReviewCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
  /**
   * Funcion que lanza "codex review ...". Por defecto, runCodexReview
   * de fs/git.ts (spawnSync real contra el binario "codex"). Inyectable
   * en tests para simular ENOENT o un exit distinto de cero sin
   * depender del binario real ni de red.
   */
  runCodex?: (invocation: CodexReviewInvocation) => CodexReviewOutcome;
}

export interface CodexReviewCommandResult {
  id: string;
  rama: string;
  baseBranch: string;
  /** SHA de HEAD en el momento de invocar a Codex. */
  commitRevisado: string;
  /** true si Codex no llego a producir un informe (ausente o exit != 0). */
  degradado: boolean;
  /** Motivo legible de la degradacion, null si no degrado. */
  motivoDegradacion: string | null;
  /** Ronda del informe de Codex escrito, null si degradado. */
  ronda: number | null;
  /** Ruta del informe escrito, null si degradado. */
  informePath: string | null;
  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
  autoCommit: AutoCommitResult;
}

/**
 * true si TODOS los informes de la ronda de MAYOR numero de la revision
 * primaria aprueban — mismo criterio fail-closed que
 * `buildTransitionContext` de finish.ts (informesDeLaRonda +
 * veredictoAprobado), reimplementado aqui porque esa funcion no esta
 * exportada. Un directorio de revision/ inexistente (tarea que nunca
 * paso por "taskctl review") da false, no un error.
 */
async function revisionPrimariaAprobadaDe(revisionDir: string): Promise<boolean> {
  let entries: string[];
  try {
    entries = await readdir(revisionDir);
  } catch (e: unknown) {
    if (isEnoent(e)) return false;
    throw e;
  }
  let max = 0;
  let nombres: string[] = [];
  for (const entry of entries) {
    const m = INFORME_REVISION_RE.exec(entry);
    if (m === null) continue;
    const n = Number(m[1]);
    if (n > max) {
      max = n;
      nombres = [entry];
    } else if (n === max) {
      nombres.push(entry);
    }
  }
  if (nombres.length === 0) return false;
  const contenidos = await Promise.all(
    nombres.map((nombre) => readFile(path.join(revisionDir, nombre), 'utf8'))
  );
  return contenidos.every((c) => veredictoAprobado(c));
}

/**
 * Instrucciones que se le pasan a Codex como PROMPT posicional (el CLI
 * ya calcula el diff el mismo con --base, no hace falta embeberlo).
 * Mismo espiritu que las instrucciones de peticionTemplate en
 * review.ts: revisor independiente, hallazgos clasificados.
 */
function codexPrompt(task: Task): string {
  return (
    `Eres una segunda opinion INDEPENDIENTE sobre ${task.id} (${task.titulo}), ya revisada por ` +
    'otro agente. Clasifica cada hallazgo como CRITICO (perdida de datos, corrupcion de estado, ' +
    'el codigo hace lo contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un ' +
    'caso real) o MENOR (todo lo demas). Un "sin hallazgos" explicito tambien vale.'
  );
}

/**
 * Scaffold del informe de Codex: mismo contrato que `informeTemplate`
 * de review.ts — taskctl finish exige que TODAS las lineas
 * "- Veredicto:" aprueben, asi que hay que SUSTITUIR esta unica linea,
 * no anadir otra. La salida cruda de Codex se vuelca tal cual, sin
 * parsear ni recortar: no trae flag --json (riesgo aceptado del plan),
 * asi que mezclarla con nuestro propio Markdown iria contra la propia
 * regla de "no inferir nada de esa salida".
 */
export function codexInformeTemplate(
  task: Task,
  commitRevisado: string,
  ronda: number,
  salidaCodex: string
): string {
  const bloque = salidaCodex.trim() === '' ? '(codex no escribio nada por stdout)' : salidaCodex;
  const fence = fenceFor(bloque);
  return (
    `# Informe de Codex (segunda opinion) — ${task.id} (ronda ${ronda})\n\n` +
    `- Commit revisado: ${commitRevisado}\n` +
    '- Revisor: codex-cli (segunda opinion independiente, TASK-020)\n' +
    '- Veredicto: PENDIENTE (sustituye esta unica linea por "aprobada" o "cambios-solicitados" ' +
    'tras leer la salida de abajo; taskctl NUNCA infiere el veredicto del exit code de codex)\n\n' +
    '## Salida cruda de "codex review"\n\n' +
    `${fence}\n` +
    `${bloque}\n` +
    `${fence}\n`
  );
}

/**
 * `today` se recibe por simetria con el resto de comandos del ciclo de
 * vida (mismo cableado desde cli.ts), pero NO se usa: a diferencia de
 * review/finish, "codex-review" no reescribe tarea.md ni le cambia el
 * estado (sigue en-revision) — solo anade un informe dentro de
 * revision/, asi que no hay ningun campo "actualizado" que tocar.
 */
export async function runCodexReviewCommand(
  tareasRoot: string,
  argv: readonly string[],
  _today: string,
  deps: CodexReviewCommandDeps
): Promise<CodexReviewCommandResult> {
  const { push, resto } = extraerPushFlag(argv);
  const id = resto[0];
  if (id === undefined || id.trim() === '') {
    throw new CodexReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl codex-review TASK-NNN.');
  }

  const existing = await readTareaFile(tareasRoot, id);
  const revisionDir =
    existing === null ? null : path.join(path.dirname(existing.filePath), REVISION_DIRNAME);
  const revisionPrimariaAprobada =
    revisionDir === null ? false : await revisionPrimariaAprobadaDe(revisionDir);
  assertTransitionAllowed('codex-review', existing ? existing.task : null, {
    revisionPrimariaAprobada,
  });
  const { task, filePath } = existing!;

  const baseBranch = resolveBaseBranchForTipo(task.tipo, deps.repoCwd);
  const commitRevisado = headCommit(deps.repoCwd);

  const runCodex = deps.runCodex ?? runCodexReview;
  const outcome = runCodex({
    args: ['review', '--base', baseBranch, '--title', `${task.id}: ${task.titulo}`, codexPrompt(task)],
    cwd: deps.repoCwd,
  });

  let degradado: boolean;
  let motivoDegradacion: string | null;
  let ronda: number | null = null;
  let informePath: string | null = null;

  if (!outcome.lanzado) {
    degradado = true;
    motivoDegradacion =
      `no se pudo ejecutar "codex" (${outcome.errorLanzamiento?.message ?? 'motivo desconocido'}). ` +
      'Probablemente no esta instalado o no esta en el PATH.';
  } else if (outcome.code !== 0) {
    degradado = true;
    motivoDegradacion =
      `"codex review" termino con codigo ${outcome.code}. Puede deberse a auth/modelo/red/cuota, ` +
      'no necesariamente a un problema del diff (evidencia real en esta misma maquina). Arregla ' +
      'o reinstala codex y reintenta.';
  } else {
    degradado = false;
    motivoDegradacion = null;
  }

  if (!degradado) {
    const revisionDirEscritura = path.join(path.dirname(filePath), REVISION_DIRNAME);
    await mkdir(revisionDirEscritura, { recursive: true });
    ronda = await siguienteRonda(revisionDirEscritura, INFORME_CODEX_RE);
    const nombreInforme = `informe-codex-${ronda}.md`;
    try {
      await writeFile(
        path.join(revisionDirEscritura, nombreInforme),
        codexInformeTemplate(task, commitRevisado, ronda, outcome.stdout),
        { encoding: 'utf8', flag: 'wx' }
      );
    } catch (e: unknown) {
      if (!isEexist(e)) throw e;
      throw new CodexReviewCommandError(
        `[ERROR] ${id}: ya existe ${nombreInforme} en ${revisionDirEscritura} (¿otra invocacion ` +
          'concurrente de "taskctl codex-review" calculo la misma ronda?). No se ha escrito nada ' +
          'nuevo; reintenta.'
      );
    }
    informePath = path.join(revisionDirEscritura, nombreInforme);
  }

  // Paso 5 de la 8.3 (TASK-030, item C2), mismo patron que review.ts.
  // Se llama SIEMPRE, tambien degradado: si no hubo nada nuevo que
  // escribir, autoCommit se limita a decir "nada que commitear".
  const commitResult = autoCommit({
    cwd: deps.repoCwd,
    rutas: [path.dirname(filePath)],
    mensaje: mensajeChore(
      task.id,
      degradado ? 'codex-review degradado (sin informe)' : `informe de codex ronda ${String(ronda)}`
    ),
    push,
  });

  return {
    id: task.id,
    rama: task.rama,
    baseBranch,
    commitRevisado,
    degradado,
    motivoDegradacion,
    ronda,
    informePath,
    autoCommit: commitResult,
  };
}
