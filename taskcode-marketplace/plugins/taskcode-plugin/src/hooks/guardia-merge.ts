/**
 * Guardian de merges — TASK-072, capa 2. Lo ejecuta el hook `PreToolUse` de
 * Claude Code (hooks/hooks.json -> dist/src/hooks/pre-tool-merge.js) ANTES de
 * cada comando Bash o PowerShell del agente, en todos los proyectos con el
 * plugin. Sin filtro `if` (decision de Carlos: el `if` de prefijo no ve
 * `cd x && git merge` ni `git checkout develop && git merge x`), asi que las
 * guardas van de la mas barata a la mas cara:
 *
 *   1. El texto no contiene `merge`: deja pasar (lo decide el punto de
 *      entrada, antes incluso de cargar este modulo).
 *   2. `analizarComando` no encuentra un merge ni un script de cierre.
 *   3. No es un repo, no hay config o no declara `comando_verificacion`: deja
 *      pasar (la puerta de `finish` sigue ahi). TASK-103: si la config existe
 *      pero no se puede leer, un merge hacia develop, main o master (lista
 *      fija: sin config no se sabe `rama_base`) BLOQUEA siempre, con el error
 *      y como arreglarlo: una config mal escrita no desactiva el guardian.
 *   4. El destino no es la rama de integracion (`rama_base`) ni la principal.
 *   5. La fuente ya esta integrada: es ancestro del destino, de la principal
 *      (el backmerge de recuperacion que pide `finish`) o de origin/<destino>.
 *   6. Hay un VERDE guardado para el commit fuente (huella de commit, la que
 *      deja `finish` o el freno Stop con el arbol limpio): deja pasar.
 *   6b. TASK-101: el destino declara `rutas_documentacion` y lo que entra es
 *      solo documentacion (la misma decision que `finish`, con la config del
 *      DESTINO): deja pasar sin comprobacion de documentacion declarada, o con
 *      su verde guardado. Nunca si el comando puede crear o mover commits antes
 *      del merge, en un release, con un held-out cambiado, o pasado el
 *      presupuesto de tiempo. Solo se calcula si el paso 6 no dejo pasar.
 *      TASK-108 (D1, 2026-11-11): con `rutas_verificacion_parcial`, si entra
 *      codigo se exige SIEMPRE la completa del paso 6, aunque `finish` integre
 *      con la selectiva; el memo `selectiva` no se lee nunca. Solo la DECISION
 *      sale de la config del destino: los pasos 3 y 6 usan la del arbol, igual
 *      que `finish` al guardar la huella (si no, dejarian de casar).
 *   7. Cualquier otra cosa BLOQUEA (exit 2): «sin verde» cuenta como no verde
 *      (decision de Carlos) y remite a `taskctl finish`, que si verifica.
 *
 * Nunca ejecuta la verificacion (su timeout es de 30 s). Un fallo inesperado
 * antes de saber que el comando integra en develop/main deja pasar; despues,
 * bloquea. Nada de lo que escribe nombra el producto.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { analizarComando, cierresDeMerge, type OperacionMerge } from '../core/comando-merge.js';
import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
import { huellaDeCommit, huellaDelArbol, leerMemo } from '../fs/verificacion.js';
import { comandoSoloIntegra } from '../core/comando-merge.js';
import { decidirVerificacionEntre } from '../fs/decision-documentacion.js';
import { timeoutEfectivoS } from './freno-stop.js';

import { PASAR, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';

export { parsearEntradaPreToolUse, type DecisionPreToolUse, type EntradaPreToolUse } from './entrada-pretooluse.js';

/** Guarda 1, sin I/O: el comando de la entrada, si puede contener un merge. */
export function comandoCandidato(entrada: EntradaPreToolUse): string | null {
  const ti = entrada.tool_input;
  if (typeof ti !== 'object' || ti === null) return null;
  const cmd = (ti as { command?: unknown }).command;
  // TASK-123: tambien `commit`, que con un merge en curso lo cierra.
  if (typeof cmd !== 'string' || !/merge|commit/i.test(cmd)) return null;
  // TASK-114: sin `git` ni un script de cierre, no integra nada (`grep merge x`,
  // `npm run commit-lint`): sale sin lanzar git.
  if (!INVOCA_GIT_O_CIERRE.test(cmd)) return null;
  return cmd;
}

/**
 * TASK-114: la palabra `git` (tambien `git.exe`, `/usr/bin/git`) o el nombre de
 * un script de cierre (`merge-<tipo>-to-<destino>.sh`, como en comando-merge.ts).
 * El punto de entrada (pre-tool-merge.ts) aplica un prefiltro mas laxo.
 * Se acepta (MEN-2 de la revision) que la ofuscacion con comillas partidas
 * (`g''it merge x`) la esquive: el guardian es un freno contra despistes, y la
 * puerta de `finish` sigue verificando.
 */
export const INVOCA_GIT_O_CIERRE = /\bgit\b|merge-[a-z]+-to-[a-z]+\.sh/i;

function git(args: readonly string[], cwd: string): { ok: boolean; out: string } {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
  return { ok: r.error === undefined && r.status === 0, out: (r.stdout ?? '').trim() };
}

function existeRef(ref: string, cwd: string): boolean {
  return git(['rev-parse', '--verify', '--quiet', ref], cwd).ok;
}

/** La principal sin red: main o master en local (resolveMainBranch consulta origin). */
function ramaPrincipal(cwd: string): string | null {
  if (existeRef('refs/heads/main', cwd)) return 'main';
  if (existeRef('refs/heads/master', cwd)) return 'master';
  return null;
}

function esAncestro(a: string, b: string, cwd: string): boolean {
  return git(['merge-base', '--is-ancestor', '--end-of-options', a, b], cwd).ok;
}

interface Integracion {
  fuente: string;
  destino: string;
  raiz: string;
  /** TASK-101: un release lleva a la principal todo lo acumulado: siempre la completa. */
  release: boolean;
}

/** TASK-101: lo que el paso 6b necesita saber del comando entero. */
interface ContextoComando {
  soloIntegra: boolean;
  inicioMs: number;
}

/**
 * TASK-101: margen del paso 6b dentro de los 30 s del hook. Pasado, no se
 * calcula la exencion: se bloquea como siempre (un hook que muere por tiempo
 * podria dejar pasar el merge).
 */
export const PRESUPUESTO_EXENCION_MS = 20_000;

/** TASK-103: lo que se protege cuando la config no se puede leer (sin ella no se sabe `rama_base`). */
const PROTEGIDAS_SIN_CONFIG: ReadonlySet<string> = new Set(['develop', 'main', 'master']);

/** Lo que queda por decidir en los pasos 5 a 7. */
type Pendiente =
  | { tipo: 'verificar'; integ: Integracion; config: TaskcodeConfig }
  | { tipo: 'config-invalida'; destino: string; error: ConfigError };

export function decidirPreToolUse(entrada: EntradaPreToolUse): DecisionPreToolUse {
  const comando = comandoCandidato(entrada);
  if (comando === null) return PASAR;
  if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd)) return PASAR;
  const cwd = entrada.cwd;
  // TASK-123 (F-16): el commit que cierra un merge en curso en una rama protegida.
  const cierre = decidirCierreDeMerge(comando, cwd);
  if (cierre.codigo === 2) return cierre;
  if (!/merge/i.test(comando)) return PASAR;
  // TASK-103: `git checkout README.md` no cambia HEAD; una rama (tambien la que
  // solo esta en origin: el DWIM de checkout), un tag o un commit, si.
  const esRevision = (n: string): boolean => {
    // `HEAD` y `@` resuelven a un commit pero te dejan en la misma rama (NUE-1 de
    // la ronda 2): no cambian el destino. Sin distinguir mayusculas, por Windows.
    if (/^(?:head|@)$/i.test(n)) return false;
    return (
      existeRef(`refs/heads/${n}`, cwd) ||
      existeRef(`refs/remotes/origin/${n}`, cwd) ||
      git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${n}^{commit}`], cwd).ok
    );
  };
  const ops = analizarComando(comando, esRevision);
  if (ops.length === 0) return PASAR;
  const contexto: ContextoComando = { soloIntegra: comandoSoloIntegra(comando), inicioMs: Date.now() };

  // 3 y 4: hasta saber que algo entra en develop/main, cualquier fallo deja pasar.
  const pendientes: Pendiente[] = [];
  try {
    for (const op of ops) {
      const dirOp = op.tipo === 'merge' && op.dir !== null ? path.resolve(cwd, op.dir) : cwd;
      let raiz: string;
      let config: TaskcodeConfig;
      try {
        raiz = raizDelRepo(dirOp);
      } catch {
        continue;
      }
      try {
        config = resolverConfigConAvisos(raiz).config;
      } catch (e: unknown) {
        if (e instanceof ConfigError) pendientes.push(...configInvalida(op, raiz, e));
        continue;
      }
      if (config.comando_verificacion === null) continue;
      const principal = ramaPrincipal(raiz);
      const protegidas = new Set([config.rama_base, ...(principal === null ? [] : [principal])]);
      for (const integ of integraciones(op, raiz, config.rama_base, principal)) {
        if (protegidas.has(integ.destino)) pendientes.push({ tipo: 'verificar', integ, config });
      }
    }
  } catch {
    return PASAR;
  }
  if (pendientes.length === 0) return PASAR;

  // 5 a 7: ya se sabe que el comando integra en una rama protegida.
  try {
    for (const p of pendientes) {
      if (p.tipo === 'config-invalida') return { codigo: 2, stderr: mensajeConfigInvalida(p.destino, p.error) };
      const motivo = motivoDeBloqueo(p.integ, p.config, contexto);
      if (motivo !== null) return { codigo: 2, stderr: motivo };
    }
    return PASAR;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      codigo: 2,
      stderr:
        `No se pudo comprobar la verificacion antes de este merge hacia una rama protegida: ${msg}\n` +
        'Cierra la tarea con taskctl finish TASK-NNN, que verifica antes de mergear.',
    };
  }
}

/**
 * TASK-103: con la config ilegible, los destinos de la operacion que estan en
 * la lista fija. Se calculan con los valores por defecto (`develop`, y la
 * principal local o `main`). Se bloquea siempre, sin mirar ancestros ni verdes.
 */
function configInvalida(op: OperacionMerge, raiz: string, error: ConfigError): Pendiente[] {
  const principal = ramaPrincipal(raiz) ?? 'main';
  return integraciones(op, raiz, 'develop', principal)
    .filter((integ) => PROTEGIDAS_SIN_CONFIG.has(integ.destino))
    .map((integ) => ({ tipo: 'config-invalida', destino: integ.destino, error }));
}

/** El texto de un ConfigError sin su prefijo `[ERROR]`. */
function textoDeConfigError(e: Error): string {
  return e.message.replace(/^\[ERROR\]\s*/, '');
}

/** Pares fuente -> destino de una operacion. Para un merge sin destino explicito, la rama actual. */
function integraciones(op: OperacionMerge, raiz: string, integracion: string, principal: string | null): Integracion[] {
  if (op.tipo === 'script') {
    if (op.fuente === null) return [];
    const destinos = op.destinos.map((d) => (d === 'main' ? principal : integracion)).filter((d): d is string => d !== null);
    const release = op.script.includes('release') || /^release\//.test(op.fuente);
    return destinos.map((destino) => ({ fuente: op.fuente as string, destino, raiz, release }));
  }
  const destino = op.destino ?? git(['branch', '--show-current'], raiz).out;
  if (destino === '') return [];
  const fuentes = op.fuentes.length > 0 ? op.fuentes : [`${destino}@{upstream}`];
  return fuentes.map((fuente) => ({ fuente, destino, raiz, release: /^(?:refs\/heads\/)?release\//.test(fuente) }));
}

/** null si el merge puede pasar; si no, el texto para el agente. */
function motivoDeBloqueo(integ: Integracion, config: TaskcodeConfig, contexto: ContextoComando): string | null {
  const { fuente, destino, raiz } = integ;
  const comando = config.comando_verificacion as string;
  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${fuente}^{commit}`], raiz);
  if (!sha.ok || sha.out === '') {
    return mensaje(fuente, null, destino, comando, `no se puede resolver "${fuente}" a un commit`);
  }
  // 5: nada nuevo entra en el destino.
  const principal = ramaPrincipal(raiz);
  if (esAncestro(sha.out, destino, raiz)) return null;
  if (principal !== null && esAncestro(sha.out, principal, raiz)) return null;
  const remota = `refs/remotes/origin/${destino}`;
  if (existeRef(remota, raiz) && esAncestro(sha.out, remota, raiz)) return null;

  // 6: un verde guardado para ese commit, con el timeout de finish o el del freno.
  const timeouts = new Set([config.timeout_verificacion, timeoutEfectivoS(config.timeout_verificacion).timeoutS]);
  let rojo = false;
  for (const t of timeouts) {
    const huella = huellaDeCommit(raiz, sha.out, comando, t);
    const r = huella === null ? null : leerMemo(raiz, huella);
    if (r?.estado === 'verde') return motivoPesada(integ, sha.out, config);
    if (r !== null) rojo = true;
  }

  // 6b (TASK-101): solo documentacion, con la misma decision que finish.
  const exencion = exencionDocumentacion(integ, sha.out, contexto);
  if (exencion.pasa) return null;
  return mensaje(
    fuente,
    sha.out,
    destino,
    comando,
    rojo ? 'la ultima verificacion de ese commit NO salio en verde' : 'no consta una verificacion en verde de ese commit',
    exencion.detalle
  );
}

/**
 * TASK-126: con la completa en verde, una release (o un hotfix, si
 * `verificacion_pesada_en` lo lista) exige ademas el verde de los tests
 * pesados del mismo commit (memo `pesada`, que deja `finish`). null si pasa.
 * Feature y fix nunca los piden.
 */
function motivoPesada(integ: Integracion, sha: string, config: TaskcodeConfig): string | null {
  const comando = config.comando_verificacion_pesada;
  if (comando === null) return null;
  const tipo = integ.release ? 'release' : /^(?:refs\/heads\/)?hotfix\//.test(integ.fuente) ? 'hotfix' : null;
  if (tipo === null || !(config.verificacion_pesada_en as readonly string[]).includes(tipo)) return null;
  const huella = huellaDeCommit(integ.raiz, sha, comando, config.timeout_verificacion);
  const r = huella === null ? null : leerMemo(integ.raiz, huella, 'pesada');
  if (r?.estado === 'verde') return null;
  return mensaje(
    integ.fuente,
    sha,
    integ.destino,
    comando,
    `una rama ${tipo} exige tambien los tests pesados (comando_verificacion_pesada) y ` +
      (r === null ? 'no consta que hayan salido en verde para ese commit' : 'su ultima ejecucion NO salio en verde')
  );
}

/**
 * TASK-108: lo que se anade al bloqueo cuando el destino declara
 * `rutas_verificacion_parcial` y entra codigo. No manda a «correr la completa y
 * repetir»: con el nivel 2 ningun camino guarda la completa de ese commit donde
 * el guardian la busca, y eso solo acabaria en un bucle. Tampoco nombra la causa
 * (develop avanzo, la huella no casa): el guardian no la comprueba.
 */
const LINEA_SELECTIVA =
  'Con codigo, un merge a mano exige la verificacion completa en verde de ese commit aunque taskctl finish ' +
  'acepte la de lo afectado (rutas_verificacion_parcial), y un merge a mano no la obtiene. Integra con taskctl ' +
  'finish TASK-NNN desde la rama de la tarea, que verifica y mergea por su cuenta. Si finish choco en un conflicto, ' +
  'no lo cierres en el destino: abortalo con taskctl abort-merge, integra la base en la rama de la tarea, ' +
  'resuelvelo alli y vuelve a lanzar taskctl finish TASK-NNN desde ella.';

/**
 * TASK-101: si lo que entra es solo documentacion segun la config del destino.
 * `detalle` explica por que no se aplica cuando el destino si la declara; null
 * cuando no la declara (el mensaje queda como en la 0.14.0).
 */
function exencionDocumentacion(
  integ: Integracion,
  sha: string,
  contexto: ContextoComando
): { pasa: boolean; detalle: string | null } {
  const { destino, raiz } = integ;
  if (Date.now() - contexto.inicioMs > PRESUPUESTO_EXENCION_MS) return { pasa: false, detalle: null };
  const r = decidirVerificacionEntre(destino, sha, raiz, { heldoutComoCodigo: true });
  if (r === null) return { pasa: false, detalle: null };
  if (r.tipo === 'config-invalida') {
    return {
      pasa: false,
      detalle: `La configuracion de "${destino}" no es valida, asi que no se aplica la exencion de solo documentacion: ${textoDeConfigError(r.error)}`,
    };
  }
  const d = r.decision;
  // TASK-105/108 (D1, decision de Carlos del 2026-11-11): con codigo el guardian
  // exige SIEMPRE la completa, aunque finish integre con la selectiva. Nunca se
  // lee el memo `selectiva`. Su motivo propio («basta la verificacion de lo
  // afectado») contradiria el bloqueo, asi que se ensena uno neutro y una linea
  // que dice que hace falta y como integrar.
  // MEN-1 de la revision de TASK-108: un release va antes que la selectiva, o
  // recibiria una linea que habla de la tarea y de finish TASK-NNN.
  if (integ.release && d.tipo !== 'completa') {
    return { pasa: false, detalle: 'Un release lleva a la principal todo lo acumulado: siempre exige la verificacion completa.' };
  }
  if (d.tipo === 'selectiva') {
    // Hacia la principal (un hotfix) finish tampoco acepta la selectiva: la
    // linea mentiria, asi que queda solo el motivo neutro.
    const neutro = 'No es solo documentacion: la tarea cambia rutas que no son documentacion.';
    return { pasa: false, detalle: destino === ramaPrincipal(raiz) ? neutro : `${neutro}\n${LINEA_SELECTIVA}` };
  }
  if (d.tipo !== 'documentacion') return { pasa: false, detalle: `No es solo documentacion: ${d.motivo}.` };
  if (!contexto.soloIntegra) {
    return {
      pasa: false,
      detalle:
        `${d.motivo}, pero este comando puede crear o mover commits antes del merge (commit, reset, rebase, pull, ` +
        'un script...): lo comprobado no seria lo que entra. Haz el commit en un comando y el merge en otro.',
    };
  }
  if (d.comando === null) return { pasa: true, detalle: null };
  const huella = huellaDeCommit(raiz, sha, d.comando, r.timeoutS);
  const memo = huella === null ? null : leerMemo(raiz, huella, 'documentacion');
  if (memo?.estado === 'verde') return { pasa: true, detalle: null };
  return {
    pasa: false,
    detalle:
      `${d.motivo}, pero no consta en verde su comprobacion de documentacion (${d.comando}) para ese commit: ` +
      'taskctl finish la ejecuta.',
  };
}

/** TASK-103: el texto para el agente cuando la config no se puede leer. */
function mensajeConfigInvalida(destino: string, error: ConfigError): string {
  return [
    `Merge bloqueado: entraria en "${destino}" y la configuracion del repositorio no se puede leer: ${textoDeConfigError(error)}`,
    'Sin una configuracion valida no se sabe que verificacion exigir, asi que no se integra en develop, main ni master.',
    'Corrige el fichero que nombra el error (taskctl doctor lo valida y dice como arreglarlo) y repite el merge,',
    'o cierra la tarea con taskctl finish TASK-NNN. No integres por otra via para saltarte esta comprobacion.',
  ].join('\n');
}

function mensaje(
  fuente: string,
  sha: string | null,
  destino: string,
  comando: string,
  motivo: string,
  detalle: string | null = null
): string {
  const quien = sha === null ? `"${fuente}"` : `"${fuente}" (${sha.slice(0, 10)})`;
  return [
    `Merge bloqueado: ${quien} entraria en "${destino}" y ${motivo} (comando de verificacion: ${comando}).`,
    ...(detalle === null ? [] : [detalle]),
    'Cierra la tarea con taskctl finish TASK-NNN: ejecuta la verificacion y mergea con el flujo de la tarea.',
    'Si la persona decide integrar sin verificar, es taskctl finish TASK-NNN --sin-verificacion, que lo deja',
    'anotado en la tarea. No integres por otra via para saltarte esta comprobacion.',
  ].join('\n');
}

/**
 * TASK-123 (F-16): `git commit` (o `git merge --continue`) con `MERGE_HEAD`
 * presente en la rama de integracion o la principal cierra un merge hacia ella:
 * lo que se commitea es la resolucion, no el commit que se verifico. Se exige un
 * verde del arbol que se va a commitear (huella del arbol de trabajo, la que
 * guarda el freno Stop), salvo que lo que entra ya este integrado. Sin
 * `MERGE_HEAD`, o en otra rama, no se toca. Sin `git commit` ni `merge
 * --continue` en el texto no lanza ningun proceso. Hasta saber que cierra un
 * merge en una rama protegida, cualquier fallo deja pasar; despues, bloquea.
 */
function decidirCierreDeMerge(comando: string, cwd: string): DecisionPreToolUse {
  const dirs = cierresDeMerge(comando);
  for (const dir of dirs) {
    let raiz: string;
    let rama: string;
    let sha: string;
    let config: TaskcodeConfig;
    try {
      raiz = raizDelRepo(dir === null ? cwd : path.resolve(cwd, dir));
      const mh = git(['rev-parse', '--verify', '--quiet', 'MERGE_HEAD'], raiz);
      if (!mh.ok || mh.out === '') continue;
      sha = mh.out;
      rama = git(['branch', '--show-current'], raiz).out;
      if (rama === '') continue;
      try {
        config = resolverConfigConAvisos(raiz).config;
      } catch (e: unknown) {
        if (e instanceof ConfigError && PROTEGIDAS_SIN_CONFIG.has(rama)) {
          return { codigo: 2, stderr: mensajeConfigInvalida(rama, e) };
        }
        continue;
      }
      if (config.comando_verificacion === null) continue;
      const principal = ramaPrincipal(raiz);
      if (rama !== config.rama_base && rama !== principal) continue;
    } catch {
      continue;
    }
    try {
      const motivo = motivoDeCierre(sha, rama, raiz, config);
      if (motivo !== null) return { codigo: 2, stderr: motivo };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { codigo: 2, stderr: `No se pudo comprobar la verificacion antes de cerrar un merge en "${rama}": ${msg}\n${REMEDIO_CIERRE}` };
    }
  }
  return PASAR;
}

const REMEDIO_CIERRE =
  'No lo cierres aqui: abortalo con taskctl abort-merge, integra la base en la rama de la tarea ' +
  '(git checkout <rama-de-la-tarea> && git merge <esta-rama>), resuelvelo y commitea alli, y vuelve a lanzar ' +
  'taskctl finish TASK-NNN desde ella, que verifica antes de mergear. Si la persona decide integrar sin ' +
  'verificar, es taskctl finish TASK-NNN --sin-verificacion, que lo deja anotado en la tarea. No integres por ' +
  'otra via para saltarte esta comprobacion.';

function motivoDeCierre(sha: string, rama: string, raiz: string, config: TaskcodeConfig): string | null {
  // Lo que entra ya esta integrado (misma exencion que motivoDeBloqueo): en HEAD, en la
  // principal o en origin/<rama> (sincronizar con el remoto con conflicto, git pull).
  if (esAncestro(sha, 'HEAD', raiz)) return null;
  const principal = ramaPrincipal(raiz);
  if (principal !== null && esAncestro(sha, principal, raiz)) return null;
  const remota = `refs/remotes/origin/${rama}`;
  if (existeRef(remota, raiz) && esAncestro(sha, remota, raiz)) return null;
  const comando = config.comando_verificacion as string;
  const timeouts = new Set([config.timeout_verificacion, timeoutEfectivoS(config.timeout_verificacion).timeoutS]);
  for (const t of timeouts) {
    const huella = huellaDelArbol(raiz, comando, t);
    if (huella !== null && leerMemo(raiz, huella)?.estado === 'verde') return null;
  }
  return [
    `Commit bloqueado: cerraria en "${rama}" el merge en curso de ${sha.slice(0, 10)} y no consta una verificacion ` +
      `en verde de ese resultado (comando de verificacion: ${comando}). Lo que se commitea es la resolucion, no ` +
      'lo que se verifico en la rama de la tarea.',
    REMEDIO_CIERRE,
  ].join('\n');
}
