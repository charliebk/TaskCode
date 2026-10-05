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
 * y la revision primaria de mayor ronda ya aprobo — con la misma
 * funcion que la puerta de finish (`ultimaRondaAprobada` de
 * fs/rondas.ts, TASK-047; antes este comando la reimplementaba).
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
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { writeFile, mkdir } from 'node:fs/promises';
import type { Task } from '../core/task.js';
import { readTareaFile, isEexist } from '../fs/task-store.js';
import {
  INFORME_CODEX_RE,
  INFORME_REVISION_RE,
  siguienteRonda,
  ultimaRondaAprobada,
} from '../fs/rondas.js';
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
import { REVISION_DIRNAME } from './review.js';

export class CodexReviewCommandError extends Error {}

/** Flags de `taskctl codex-review`: solo extraerPushFlag. */
export const FLAGS_CODEX_REVIEW: readonly string[] = ['--push', '-p'];

/**
 * Regex de la ronda de Codex: vive en fs/rondas.ts desde TASK-047 y se
 * reexporta aqui para no romper a quien la importa de este modulo.
 */
export { INFORME_CODEX_RE } from '../fs/rondas.js';

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
  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
  rechazarFlagsDesconocidos(argv, FLAGS_CODEX_REVIEW, 'codex-review', (m) => new CodexReviewCommandError(m));
  const { push, resto } = extraerPushFlag(argv);
  const id = resto[0];
  if (id === undefined || id.trim() === '') {
    throw new CodexReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl codex-review TASK-NNN.');
  }

  const existing = await readTareaFile(tareasRoot, id);
  const revisionDir =
    existing === null ? null : path.join(path.dirname(existing.filePath), REVISION_DIRNAME);
  const revisionPrimariaAprobada =
    revisionDir === null ? false : await ultimaRondaAprobada(revisionDir, INFORME_REVISION_RE);
  assertTransitionAllowed('codex-review', existing ? existing.task : null, {
    revisionPrimariaAprobada,
  });
  const { task, filePath } = existing!;

  const baseBranch = resolveBaseBranchForTipo(task.tipo, deps.repoCwd);
  const commitRevisado = headCommit(deps.repoCwd);

  // Sin PROMPT posicional a proposito: "codex review" (codex-cli
  // 0.144.1) rechaza combinar "--base <rama>" con un PROMPT propio
  // ("error: the argument '--base <BRANCH>' cannot be used with
  // '[PROMPT]'" — clap, no un fallo de escapado), confirmado
  // empiricamente contra el binario real en esta maquina (hallazgo de
  // revision por pares, ronda 1, ampliado tras corregir el bug de
  // spawnSync: con el spawn ya arreglado, la combinacion original
  // fallaba de todas formas, con exit 2 en vez de ENOENT). "--title"
  // SI es compatible con "--base" y viaja con el id y el titulo de la
  // tarea; el analisis en si lo hace el propio "codex review" con su
  // comportamiento por defecto.
  const runCodex = deps.runCodex ?? runCodexReview;
  const outcome = runCodex({
    args: ['review', '--base', baseBranch, '--title', `${task.id}: ${task.titulo}`],
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
