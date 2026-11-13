/**
 * Puerta de verificacion de `taskctl finish` — TASK-072, capa 1.
 *
 * Con `comando_verificacion` declarado, `finish` lo ejecuta SIEMPRE antes de
 * mergear o de abrir el merge request (decision de Carlos: no reutiliza el
 * memo, que no ve los ficheros ignorados) y aborta con el informe si no sale
 * en verde. Solo corre en los caminos que van a integrar algo: no en el
 * segundo `finish --merge-request` (la plataforma ya mergeo). En el camino
 * idempotente (la rama ya integrada a mano, o tras cerrar un conflicto) corre
 * `puertaReintento` sobre el arbol de la rama de integracion (TASK-123).
 *
 * `--sin-verificacion` la salta y lo deja escrito en la tarea. La anotacion
 * se COMMITEA en la rama de la tarea ANTES del merge: asi viaja con el merge
 * y el rastro sobrevive aunque el proceso muera despues del script. Escribirla
 * sin commitear ensuciaria el workspace y el script de Git-Flow abortaria.
 *
 * TASK-091: sin `rutas_verificacion_parcial` en la base, la selectiva no
 * cuenta aqui: aunque las rondas la corrieran, `finish` ejecuta la COMPLETA.
 *
 * TASK-106 (nivel 2): si la base declara `rutas_verificacion_parcial` y todo
 * el codigo de la tarea cae en ellas, se ejecuta `comando_verificacion_selectiva`
 * (con RAMA_BASE y su timeout) en vez de la completa. Excepcion acotada a la
 * decision de TASK-072, de Carlos (2026-11-11): para la selectiva SI se
 * reutiliza el memo del Stop o de review, solo si casa la huella (arbol
 * limpio, mismo HEAD, misma base y su SHA) y estaba en verde; un rojo o un
 * corte se vuelven a ejecutar. La completa sigue sin memo. El verde selectivo
 * se guarda solo en el memo selectivo, nunca en el de la completa. Se anota en
 * la tarea DESPUES del verde (anotar antes cambiaria HEAD y el memo no casaria
 * nunca). Un hotfix nunca usa la selectiva (`permitirSelectiva`), pero
 * conserva su camino de solo documentacion; un release no recibe `ramaBase`.
 *
 * Tras un verde se guarda el memo con la huella del arbol (limpio, igual que
 * `huellaDeCommit` del commit de la rama): es lo que consulta el guardian de
 * merges (hooks/guardia-merge) para no bloquear un merge ya verificado.
 *
 * TASK-100: si la config de la rama base declara `rutas_documentacion` y todo
 * lo que cambia la tarea cae en ellas (core/verificacion-proporcional), no se
 * ejecuta `comando_verificacion`: solo `comando_verificacion_documentacion` si
 * existe, con su propio memo (nunca el de la completa). Queda anotado en la
 * tarea y commiteado antes del merge, como el salto con --sin-verificacion.
 * Ante cualquier duda (diff no calculable, vacio, mixto, config cambiada o de
 * la base invalida), la completa de siempre.
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolverConfig } from '../core/config.js';
import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
import { serializeTareaFile } from '../core/tarea-file.js';
import {
  anotarCompletaTrasParcial,
  anotarVerificacionDocumentacion,
  anotarVerificacionOmitida,
  anotarVerificacionParcial,
} from '../core/transiciones.js';
import { comandoParcial, type DecisionVerificacion } from '../core/verificacion-proporcional.js';
import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
import { currentBranch, isWorkspaceClean } from '../fs/git.js';
import { autoCommit, mensajeChore } from '../fs/git-commit.js';
import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
import { ejecutarVerificacion, guardarMemo, huellaDelArbol, verificarConMemo } from '../fs/verificacion.js';
import { PUERTA_FINISH } from '../core/registro-puertas.js';
import { anotarPuerta } from '../fs/registro-puertas.js';
import { FinishCommandError } from './finish-opciones.js';

export const FLAG_SIN_VERIFICACION = '--sin-verificacion';

/** Saca `--sin-verificacion` de argv. */
export function extraerSinVerificacion(argv: readonly string[]): { sinVerificacion: boolean; resto: string[] } {
  const resto = argv.filter((a) => a !== FLAG_SIN_VERIFICACION);
  return { sinVerificacion: resto.length !== argv.length, resto };
}

export interface PuertaVerificacionOpts {
  id: string;
  rama: string;
  tareasRoot: string;
  /**
   * TASK-119: se llama justo antes de escribir y commitear una anotacion en
   * tarea.md (devuelve lo pendiente de la tarea apartado, para que entre en
   * ese commit). `initial` ya lo incluye: se leyo antes de apartarlo.
   */
  antesDeAnotar?: () => void;
  initial: ReadTareaResult;
  sinVerificacion: boolean;
  cwd: string;
  /** Instante de la anotacion (`formatearInstante`) o el dia. */
  instante: string;
  onAviso?: (aviso: string) => void;
  /** Solo para tests: sustituye al timeout de la verificacion (en ms). */
  timeoutMs?: number;
  /**
   * TASK-100: rama contra la que se integra (la de la cobertura y los held-out).
   * Sin ella no se mira si la tarea es solo documentacion: la completa de siempre.
   */
  ramaBase?: string;
  /**
   * TASK-106: si una decision `selectiva` se ejecuta como tal. Falso (o sin
   * poner) la ejecuta como completa: un hotfix integra en la principal.
   */
  permitirSelectiva?: boolean;
  /**
   * TASK-110: el entorno del comando de verificacion (con TASKCTL_PROGRESO), que
   * se pide justo antes de lanzarlo. Sin el, el del proceso.
   */
  entornoVerificacion?: () => NodeJS.ProcessEnv;
}

/** Las opciones de ejecucion del comando: el timeout de los tests y el entorno con el contador. */
/**
 * TASK-128: cada verificacion de `finish` anota una linea de la puerta `finish`
 * en el registro de puertas (docs/registro-puertas.md), tambien en rojo.
 * `modo` = tipo de verificacion; `omitido` si salio del memo sin ejecutar.
 */
function anotarFinish(
  cwd: string,
  id: string,
  modo: string,
  inicioMs: number,
  estado: string,
  deMemo = false
): void {
  anotarPuerta(cwd, {
    puerta: PUERTA_FINISH,
    tarea: id,
    instante: new Date().toISOString(),
    modo,
    duracionS: (Date.now() - inicioMs) / 1000,
    resultado: deMemo ? 'omitido' : estado === 'verde' ? 'verde' : 'rojo',
  });
}

function opcionesEjecucion(o: PuertaVerificacionOpts): { timeoutMs?: number; env?: NodeJS.ProcessEnv } {
  return {
    ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
    ...(o.entornoVerificacion === undefined ? {} : { env: o.entornoVerificacion() }),
  };
}

export type ResultadoPuerta =
  | { tipo: 'sin-comando' }
  /** `inicioMs`: instante en que arranco la verificacion (TASK-074: un informe de cobertura anterior es viejo). */
  | { tipo: 'verde'; duracionMs: number; inicioMs: number }
  | { tipo: 'omitida'; commit: string | null }
  /** TASK-100: solo documentacion; `comando` es la comprobacion de documentacion que corrio, si la hay. */
  | { tipo: 'documentacion'; comando: string | null; motivo: string }
  /** TASK-106: la selectiva del nivel 2 en verde (ejecutada o, `deMemo`, reutilizada), no la completa. */
  | { tipo: 'selectiva'; comando: string; motivo: string; deMemo: boolean };

/**
 * TASK-100: la decision para esta tarea, con la config de la base, o null si
 * la base no declara rutas de documentacion (entonces ni se calcula el diff).
 * Una config de la base invalida no exime de nada: la completa. TASK-101: la
 * decision la toma `decidirVerificacionEntre`, la misma que usa el guardian.
 */
function decisionDocumentacion(
  o: PuertaVerificacionOpts,
  ramaBase: string
): { decision: DecisionVerificacion; timeoutS: number; timeoutSelectivaS: number } | null {
  const r = decidirVerificacionEntre(ramaBase, 'HEAD', o.cwd);
  if (r === null) return null;
  if (r.tipo === 'config-invalida') {
    o.onAviso?.(
      `${o.id}: la configuracion de "${ramaBase}" no es valida, asi que no se puede saber si la tarea es solo ` +
        `documentacion: se ejecuta la verificacion completa. Detalle: ${r.error.message.replace(/^\[ERROR\]\s*/, '')}`
    );
    return null;
  }
  return { decision: r.decision, timeoutS: r.timeoutS, timeoutSelectivaS: r.timeoutSelectivaS };
}

/**
 * Ejecuta la puerta. Devuelve la tarea releida (la anotacion del salto cambia
 * su cuerpo, y quien escriba despues tiene que partir de ella). Lanza
 * FinishCommandError si no se puede mergear; antes del commit del salto no
 * ha tocado nada.
 */
export async function puertaVerificacion(
  o: PuertaVerificacionOpts
): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
  const config = resolverConfig(o.cwd);
  const comando = config.comando_verificacion;
  if (comando === null) {
    if (o.sinVerificacion) {
      o.onAviso?.(
        `${o.id}: el proyecto no declara comando_verificacion, asi que no hay verificacion que saltar: ` +
          `${FLAG_SIN_VERIFICACION} no tiene efecto y no se anota nada.`
      );
    }
    return { resultado: { tipo: 'sin-comando' }, tarea: o.initial };
  }

  // La verificacion mira el arbol de trabajo: tiene que ser el de la tarea.
  const actual = currentBranch(o.cwd);
  if (actual !== o.rama) {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: la verificacion del proyecto se ejecuta sobre el arbol de la rama de la tarea, ` +
        `y la rama activa es "${actual === '' ? 'HEAD desacoplado' : actual}", no "${o.rama}". ` +
        `Cambiate a ella (git checkout ${o.rama}) y reintenta taskctl finish; no se ha tocado nada.`
    );
  }

  if (o.sinVerificacion) {
    const body = anotarVerificacionOmitida(o.initial.body, o.instante, comando);
    const { commit, tarea } = await anotarYCommitear(o, body, 'cierre sin verificacion', 'anotar el salto');
    o.onAviso?.(
      `${o.id}: cierre con ${FLAG_SIN_VERIFICACION}: no se ha ejecutado "${comando}". Queda anotado en ` +
        `tarea.md (seccion "Verificacion omitida")${commit === null ? '' : `, commit ${commit}`}.`
    );
    return { resultado: { tipo: 'omitida', commit }, tarea };
  }

  const docs = o.ramaBase === undefined ? null : decisionDocumentacion(o, o.ramaBase);
  if (docs !== null && docs.decision.tipo === 'documentacion') {
    return puertaSoloDocumentacion(o, comando, docs.decision, docs.timeoutS);
  }
  if (docs !== null && docs.decision.tipo === 'selectiva' && o.permitirSelectiva === true) {
    return puertaSelectiva(o, comando, docs.decision, docs.timeoutSelectivaS, o.ramaBase as string);
  }
  const motivoCompleta = docs === null ? null : motivoCompletaEnFinish(docs.decision);
  if (motivoCompleta !== null) {
    o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${motivoCompleta}.`);
  }
  // TASK-106: un intento anterior anoto la selectiva; se anota (y commitea) antes de correr, como la
  // via de documentacion, para que el memo de la completa case con el commit que se integra.
  let tarea = o.initial;
  let commitAnotacion: string | null = null;
  if (motivoCompleta !== null) {
    const body = anotarCompletaTrasParcial(o.initial.body, o.instante, comando, motivoCompleta);
    if (body !== o.initial.body) {
      const a = await anotarYCommitear(o, body, 'reintento con verificacion completa', 'anotar la verificacion');
      tarea = a.tarea;
      commitAnotacion = a.commit;
    }
  }

  const timeoutS = config.timeout_verificacion;
  const inicioMs = Date.now();
  const r = ejecutarVerificacion(o.cwd, comando, timeoutS, opcionesEjecucion(o));
  anotarFinish(o.cwd, o.id, 'completa', inicioMs, r.estado);
  // El memo solo con el arbol limpio: es la huella del commit que consulta el
  // guardian de merges; con el arbol sucio no la casaria nunca (MEN-3).
  const limpio = isWorkspaceClean(o.cwd);
  const huella = limpio ? huellaDelArbol(o.cwd, comando, timeoutS) : null;
  if (huella !== null) guardarMemo(o.cwd, huella, r);
  if (r.estado !== 'verde') {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: no se mergea con la verificacion en rojo. ` +
        // MEN-3 de la revision: el reintento tras una parcial ya commiteo su anotacion en la rama.
        (commitAnotacion === null
          ? 'No se ha tocado nada.\n'
          : `No se ha mergeado nada; solo se ha commiteado en la rama la anotacion del intento (${commitAnotacion}).\n`) +
        `${formatearVerificacionRoja(r)}\n` +
        textoDeLaCompleta(config, motivoCompleta) +
        `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
        'lo deja anotado en la tarea.'
    );
  }
  if (!limpio) {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: la verificacion salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
        `("${comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita el ` +
        'workspace limpio: ignora esos ficheros en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
    );
  }
  return { resultado: { tipo: 'verde', duracionMs: r.duracionMs, inicioMs }, tarea };
}

/**
 * TASK-100: la tarea solo cambia documentacion. Primero se anota y commitea
 * en la rama (asi el merge lleva el rastro y el memo casa con el commit que
 * se integra); despues corre la comprobacion de documentacion, si existe, y
 * su rojo bloquea igual que el de la completa.
 */
async function puertaSoloDocumentacion(
  o: PuertaVerificacionOpts,
  comando: string,
  decision: Extract<DecisionVerificacion, { tipo: 'documentacion' }>,
  timeoutS: number
): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
  const body = anotarVerificacionDocumentacion(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
  // Un reintento tras un rojo de la comprobacion ya la tiene anotada: ni se reescribe ni se commitea otra vez.
  const { commit, tarea: releida } = await anotarYCommitear(o, body, 'cierre solo documentacion', 'anotar la verificacion');
  const c = { commit };

  if (decision.comando !== null) {
    const inicioDoc = Date.now();
    const r = ejecutarVerificacion(o.cwd, decision.comando, timeoutS, opcionesEjecucion(o));
    anotarFinish(o.cwd, o.id, 'documentacion', inicioDoc, r.estado);
    const limpio = isWorkspaceClean(o.cwd);
    const huella = limpio ? huellaDelArbol(o.cwd, decision.comando, timeoutS) : null;
    if (huella !== null) guardarMemo(o.cwd, huella, r, 'documentacion');
    if (r.estado !== 'verde') {
      throw new FinishCommandError(
        `[ERROR] ${o.id}: la tarea solo cambia documentacion, pero su comprobacion ` +
          `(comando_verificacion_documentacion) no sale en verde. No se ha mergeado nada.\n` +
          `${formatearVerificacionRoja(r)}\n` +
          `Arregla la documentacion, commitea y reintenta. Si la persona decide cerrar igualmente, ` +
          `taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`
      );
    }
    if (!limpio) {
      throw new FinishCommandError(
        `[ERROR] ${o.id}: la comprobacion de documentacion salio en verde, pero ha dejado cambios en el arbol ` +
          `de trabajo ("${decision.comando}" escribe ficheros versionados o no ignorados: mira git status). ` +
          'Ignoralos en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
      );
    }
  }
  o.onAviso?.(
    `${o.id}: ${decision.motivo}: no se ejecuta la verificacion completa ("${comando}"); ` +
      (decision.comando === null
        ? 'no hay comprobacion de documentacion declarada.'
        : `la comprobacion de documentacion ("${decision.comando}") sale en verde.`) +
      ` Queda anotado en tarea.md (seccion "Verificacion de documentacion")` +
      `${c.commit === null ? '' : `, commit ${c.commit}`}.`
  );
  return { resultado: { tipo: 'documentacion', comando: decision.comando, motivo: decision.motivo }, tarea: releida };
}

/**
 * TASK-106: por que se ejecuta la completa en un proyecto que la decide (la
 * base declara `rutas_documentacion`). Una decision `selectiva` solo llega aqui
 * si la puerta no la permite: un hotfix. No es el texto del guardian de merges
 * (hooks/guardia-merge), que con codigo exige siempre la completa (TASK-108, D1).
 */
function motivoCompletaEnFinish(d: DecisionVerificacion): string {
  return d.tipo === 'selectiva' ? 'un hotfix integra en la principal y siempre se verifica con la completa' : d.motivo;
}

/**
 * TASK-091 y TASK-106: la explicacion que acompana al rojo de la completa.
 * Sin el nivel 2, la de la 0.14.0 (las rondas pudieron usar la selectiva). Con
 * el nivel 2 y una decision tomada, su motivo real, en vez de afirmar que la
 * selectiva no cuenta nunca.
 */
function textoDeLaCompleta(config: ReturnType<typeof resolverConfig>, motivo: string | null): string {
  if (config.comando_verificacion_selectiva === null) return '';
  const pasos =
    'Correla a mano con ese comando en la rama de la tarea hasta que salga en verde, commitea los arreglos y reintenta.\n';
  if (comandoParcial(config) !== null && motivo !== null) {
    return `Es la verificacion completa (comando_verificacion), no la selectiva, porque ${motivo}. ${pasos}`;
  }
  return (
    'Es la verificacion completa (comando_verificacion): se exige en verde sobre el commit que se ' +
    `integra aunque las rondas usaran la selectiva. ${pasos}`
  );
}

/**
 * Escribe el cuerpo nuevo de tarea.md, lo commitea en la rama y relee la
 * tarea. Si el cuerpo no cambia (un reintento ya lo tiene anotado), ni se
 * reescribe ni se commitea otra vez.
 */
async function anotarYCommitear(
  o: PuertaVerificacionOpts,
  body: string,
  mensaje: string,
  que: string
): Promise<{ commit: string | null; tarea: ReadTareaResult }> {
  let c: { commit: string | null; avisos: readonly string[] } = { commit: null, avisos: [] };
  if (body !== o.initial.body) {
    // TASK-119: lo pendiente de la tarea vuelve al arbol y entra en este commit.
    o.antesDeAnotar?.();
    await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
    c = autoCommit({
      fase: 'finish',
      cwd: o.cwd,
      rutas: [path.dirname(o.initial.filePath)],
      mensaje: mensajeChore(o.id, mensaje),
      push: false,
    });
  }
  for (const a of c.avisos) o.onAviso?.(a);
  const releida = await readTareaFile(o.tareasRoot, o.id);
  if (releida === null) {
    throw new FinishCommandError(`[ERROR] ${o.id}: tarea.md desaparecio tras ${que}; revisa el repo a mano.`);
  }
  return { commit: c.commit, tarea: releida };
}

/**
 * TASK-106: todo el codigo de la tarea cae en `rutas_verificacion_parcial` de
 * la base. Corre la selectiva sobre el HEAD de la tarea SIN anotar todavia,
 * para que case el memo del Stop o de review: solo uno verde se reutiliza, y
 * solo casa con el arbol limpio (la huella lleva los ficheros sucios, y el memo
 * selectivo solo se guarda con el arbol limpio). Su rojo bloquea como el de la
 * completa y no deja nada escrito. Con el verde, anota y commitea en la rama
 * antes del merge (`tareas/**` es documentacion: no cambia la decision de un
 * reintento).
 */
async function puertaSelectiva(
  o: PuertaVerificacionOpts,
  comando: string,
  decision: Extract<DecisionVerificacion, { tipo: 'selectiva' }>,
  timeoutS: number,
  ramaBase: string
): Promise<{ resultado: ResultadoPuerta; tarea: ReadTareaResult }> {
  const inicioSel = Date.now();
  const v = verificarConMemo(
    o.cwd,
    { tipo: 'selectiva', comando: decision.comando, timeoutS, base: ramaBase, memoSoloVerde: true },
    opcionesEjecucion(o)
  );
  anotarFinish(o.cwd, o.id, 'selectiva', inicioSel, v.resultado.estado, v.deMemo);
  if (v.resultado.estado !== 'verde') {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: no se mergea con la verificacion selectiva en rojo (comando_verificacion_selectiva: ` +
        `${decision.motivo}). No se ha tocado nada.\n` +
        `${formatearVerificacionRoja(v.resultado)}\n` +
        `Correla a mano en la rama de la tarea (con RAMA_BASE=${ramaBase}) hasta que salga en verde, commitea ` +
        `los arreglos y reintenta. Si la persona decide cerrar igualmente, taskctl finish ${o.id} ` +
        `${FLAG_SIN_VERIFICACION} lo salta y lo deja anotado en la tarea.`
    );
  }
  if (!isWorkspaceClean(o.cwd)) {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
        `("${decision.comando}" escribe ficheros versionados o no ignorados: mira git status). El merge necesita ` +
        'el workspace limpio: ignoralos en .gitignore, o descartalos, y reintenta. No se ha mergeado nada.'
    );
  }
  const body = anotarVerificacionParcial(o.initial.body, o.instante, comando, decision.motivo, decision.comando);
  const { commit, tarea } = await anotarYCommitear(o, body, 'cierre con verificacion parcial', 'anotar la verificacion');
  o.onAviso?.(
    `${o.id}: ${decision.motivo}: se ejecuta la verificacion selectiva ("${decision.comando}") en vez de la ` +
      `completa ("${comando}"), y sale en verde` +
      (v.deMemo ? ' (resultado en verde guardado para este mismo commit: no se vuelve a ejecutar)' : '') +
      `. Queda anotado en tarea.md (seccion "Verificacion parcial")${commit === null ? '' : `, commit ${commit}`}.`
  );
  return { resultado: { tipo: 'selectiva', comando: decision.comando, motivo: decision.motivo, deMemo: v.deMemo }, tarea };
}

// ---------------------------------------------------------------------
// TASK-123 (F-16): la via de reintento, con la rama ya integrada.
// ---------------------------------------------------------------------

export interface PuertaReintentoOpts {
  id: string;
  /** La rama de la tarea, ya integrada en la de integracion. */
  rama: string;
  /** La rama de integracion: tiene que ser la activa (se verifica su arbol). */
  ramaIntegracion: string;
  sinVerificacion: boolean;
  cwd: string;
  /** Falso en un hotfix (integra en la principal) y en un release (siempre la completa). */
  permitirSelectiva: boolean;
  /** Un release lleva a la principal todo lo acumulado: siempre la completa. */
  siempreCompleta: boolean;
  onAviso?: (aviso: string) => void;
  timeoutMs?: number;
  entornoVerificacion?: () => NodeJS.ProcessEnv;
}

export type ResultadoReintento =
  | { tipo: 'sin-comando' }
  | { tipo: 'omitida'; comando: string }
  | { tipo: 'verde'; que: 'completa' | 'selectiva' | 'documentacion'; deMemo: boolean };

function gitOut(args: readonly string[], cwd: string): string | null {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  if (r.error !== undefined || r.status !== 0) return null;
  return (r.stdout ?? '').trim();
}

/**
 * El commit de la rama de integracion justo antes de que entrara la tarea: el
 * primero de su historia de primeros padres que no desciende de la rama. Es la
 * base de la decision proporcional (lo que entro con la tarea, su resolucion y
 * lo que vino despues). null si no se puede saber (p. ej. un fast-forward, en el
 * que los commits de la tarea son la propia historia): entonces la completa.
 */
function baseAntesDeIntegrar(rama: string, cwd: string): string | null {
  const punta = gitOut(['rev-parse', '--verify', '--quiet', '--end-of-options', `${rama}^{commit}`], cwd);
  const primeros = gitOut(['rev-list', '--first-parent', 'HEAD'], cwd);
  const descendientes = gitOut(['rev-list', '--ancestry-path', `${rama}..HEAD`], cwd);
  if (punta === null || primeros === null || descendientes === null) return null;
  const nuevos = new Set(descendientes.split('\n').filter((l) => l !== ''));
  const base = primeros.split('\n').find((c) => c !== '' && !nuevos.has(c));
  return base === undefined || base === punta ? null : base;
}

/**
 * TASK-123: la rama de la tarea ya esta integrada (un merge a mano, o el que
 * cerro un conflicto de `finish`), asi que lo que se integro no paso por la
 * puerta. Con `comando_verificacion`, antes de cerrar se verifica el arbol de la
 * rama de integracion (donde ya esta el merge y su resolucion), con la misma
 * decision proporcional que la puerta normal y reutilizando un verde del mismo
 * arbol si consta en el memo. Lanza FinishCommandError en rojo, sin haber tocado
 * la tarea. Con `--sin-verificacion` no corre nada: quien llama lo anota en el
 * commit de cierre.
 */
export function puertaReintento(o: PuertaReintentoOpts): ResultadoReintento {
  const config = resolverConfig(o.cwd);
  const comando = config.comando_verificacion;
  if (comando === null) return { tipo: 'sin-comando' };
  if (o.sinVerificacion) {
    o.onAviso?.(
      `${o.id}: cierre con ${FLAG_SIN_VERIFICACION}: la rama ya estaba integrada en "${o.ramaIntegracion}" y no se ` +
        `ha ejecutado "${comando}" sobre ella. Queda anotado en tarea.md (seccion "Verificacion omitida").`
    );
    return { tipo: 'omitida', comando };
  }

  const opciones = {
    ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
    ...(o.entornoVerificacion === undefined ? {} : { env: o.entornoVerificacion() }),
  };
  const base = o.siempreCompleta ? null : baseAntesDeIntegrar(o.rama, o.cwd);
  const r = base === null ? null : decidirVerificacionEntre(base, 'HEAD', o.cwd);
  const d = r !== null && r.tipo === 'decision' ? r : null;
  let peticion: { tipo: 'completa' | 'selectiva' | 'documentacion'; comando: string; timeoutS: number; base?: string } | null = {
    tipo: 'completa',
    comando,
    timeoutS: config.timeout_verificacion,
  };
  if (d !== null && d.decision.tipo === 'documentacion') {
    peticion = d.decision.comando === null ? null : { tipo: 'documentacion', comando: d.decision.comando, timeoutS: d.timeoutS };
  } else if (d !== null && d.decision.tipo === 'selectiva' && o.permitirSelectiva) {
    peticion = { tipo: 'selectiva', comando: d.decision.comando, timeoutS: d.timeoutSelectivaS, base: base as string };
  }

  o.onAviso?.(
    `${o.id}: la rama ya esta integrada en "${o.ramaIntegracion}" (merge hecho fuera de finish o conflicto resuelto ` +
      'alli): se verifica el arbol de la rama de integracion antes de cerrar.'
  );
  if (peticion === null) return { tipo: 'verde', que: 'documentacion', deMemo: false };
  const inicioReintento = Date.now();
  const v = verificarConMemo(o.cwd, { ...peticion, memoSoloVerde: true }, opciones);
  anotarFinish(o.cwd, o.id, peticion.tipo, inicioReintento, v.resultado.estado, v.deMemo);
  if (v.resultado.estado !== 'verde') {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: la rama ya esta integrada en "${o.ramaIntegracion}", pero la verificacion de su arbol no sale ` +
        `en verde (${peticion.tipo === 'completa' ? 'comando_verificacion' : `la ${peticion.tipo}`}): no se cierra la ` +
        'tarea, que no se ha movido de carpeta.\n' +
        `${formatearVerificacionRoja(v.resultado)}\n` +
        `Arregla "${o.ramaIntegracion}": en la rama de la tarea, integra la base (git merge ${o.ramaIntegracion}), ` +
        `corrige alli hasta que la verificacion salga en verde, commitea y relanza taskctl finish ${o.id} desde ` +
        `ella. Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
        'lo deja anotado en la tarea.'
    );
  }
  if (!isWorkspaceClean(o.cwd)) {
    throw new FinishCommandError(
      `[ERROR] ${o.id}: la verificacion salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
        `("${peticion.comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en ` +
        '.gitignore, o descartalos, y reintenta. La tarea no se ha movido de carpeta.'
    );
  }
  return { tipo: 'verde', que: peticion.tipo, deMemo: v.deMemo };
}
