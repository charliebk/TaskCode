/**
 * taskctl review — TASK-013 de PLAN_SPRINTS.md. Cierra la fase de
 * ejecucion y abre la de revision: trae los cambios de la rama base
 * con el script Git-Flow del tipo, verifica con evidencia Git que el
 * merge ocurrio (no lo supone), mueve la tarea a 03-en-revision/ y
 * deja en revision/ la peticion para el agente revisor generico (con
 * el diff real embebido) mas el scaffold de su informe.
 *
 * El CLI hace SOLO lo determinista: no invoca ningun LLM (decision
 * con Carlos, 2026-09-05 — mismo patron que el plan minimo de
 * TASK-010, donde el contenido lo redacta el agente que orquesta
 * Claude Code). La fragmentacion de revisores por dominio es TASK-018
 * y la puerta determinista build/lint/tests de la seccion 16
 * (correccion 5) queda para TASK-018/019.
 *
 * `ultimo_commit_revisado` NO se actualiza aqui a proposito: segun la
 * seccion 16.3 se actualiza cuando una revision TERMINA (informe
 * aprobado), no cuando se genera la peticion.
 *
 * TASK-040: con la tarea ya en `en-revision` y la ultima ronda en
 * `cambios-solicitados`, `review` genera la ronda N+1 en modo
 * INCREMENTAL: el diff va desde el commit revisado en la ronda N (la
 * linea `- Commit revisado (HEAD):` de su peticion, que solo escribe el
 * CLI) y la peticion lista los hallazgos de la ronda N que siguen
 * abiertos. No se ejecuta el update de Git-Flow: el merge de la base
 * entraria en el delta como si fuera una correccion; la base la integra
 * `finish` al cerrar.
 */
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { STATE_FOLDER, type Task } from '../core/task.js';
import { raizDelRepo, resolverConfig } from '../core/config.js';
import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertura.js';
import { formatearVerificacionRoja, seccionVerificacionRevision } from '../core/informe-verificacion.js';
import { verificarConMemo, type VerificacionConMemo } from '../fs/verificacion.js';
import { PUERTA_REVIEW } from '../core/registro-puertas.js';
import { anotarPuerta } from '../fs/registro-puertas.js';
import { peticionDeTrabajo, type PlanVerificacion } from '../fs/decision-documentacion.js';
import { anotarLineaEnSeccion, registrarTransicion } from '../core/transiciones.js';
import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
import {
  INFORME_REVISION_RE,
  PETICION_REVISION_RE,
  informesDeUltimaRonda,
  rondaYRevisorDeInforme,
  siguienteRonda,
} from '../fs/rondas.js';
import { SECCION_RONDAS_EXTRA, lineaRondaExtra } from '../core/flujo.js';
import { configDeRef } from '../fs/config-de-ref.js';
import { rondaExtraDecidida } from '../core/rondas-extra.js';
import {
  alcanceRondaSiguiente,
  commitRevisadoDe,
  hallazgosNoCerrados,
  hallazgosPendientes,
  severidadDe,
  veredictoDeRonda,
  type AlcanceRonda,
  type VeredictoInforme,
} from '../core/informe-revision.js';
import { fenceFor } from '../core/markdown.js';
import { assertTransitionAllowed, type TransitionContext } from '../core/state-machine.js';
import {
  currentBranch,
  resolveBaseBranchForTipo,
  gitflowBaseArgs,
  isAncestor,
  headCommit,
  logOneline,
  diffParaRevision,
  diffRangeForPaths,
  statDeFicheros,
  PATRONES_TEST,
  hayMergesEntre,
  baseDeTipoSinRed,
} from '../fs/git.js';
import {
  autoCommit,
  extraerPushFlag,
  mensajeChore,
  type AutoCommitResult,
} from '../fs/git-commit.js';
import { conProgreso, crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
import { runGitflowScript } from '../fs/gitflow-runner.js';
import { conPendientesApartados, hayCambiosFueraDeTarea, recuperarApartado } from '../fs/pendientes.js';
import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
import { excluirDeRevision } from '../fs/revisores-rango.js';
import { avisoAutorrevision } from '../core/autorrevision.js';
import { contextoPermitido } from '../core/contexto-revision.js';
import { modeloDeVerificacion } from '../core/modelo-revision.js';

export class ReviewCommandError extends Error {}

/**
 * Flags de `taskctl review`: los de extraerPushFlag, `--completa` (TASK-083) y
 * `--ronda-extra` (TASK-095: abrir una ronda pasado el tope, solo si lo decide
 * una persona).
 */
export const FLAGS_REVIEW: readonly string[] = ['--push', '-p', '--completa', '--ronda-extra'];

/** TASK-083: la cabecera que marca una peticion de verificacion acotada (la lee la ronda siguiente). */
const ALCANCE_ACOTADA = 'verificacion acotada al diff de las correcciones';
const ALCANCE_ACOTADA_RE = /^- Alcance: verificacion acotada\b/im;

const SCRIPT_BY_TYPE: Record<Task['tipo'], string> = {
  feature: 'update-feature.sh',
  fix: 'update-fix.sh',
  hotfix: 'update-hotfix.sh',
  release: 'update-release.sh',
};

export const REVISION_DIRNAME = 'revision';

/**
 * Nombre de fichero de una ronda de revision, CON o SIN sufijo de
 * dominio (TASK-018). El sufijo es el nombre de la skill revisora
 * (`java-spring-reviewer`, etc.) y solo aparece cuando la ronda se
 * fragmento por dominio — mismo precedente que
 * `peticion-brainstorm-<rol>-<ronda>.md` (TASK-016, plan.ts). Una ronda
 * SIN fragmentar (0 dominios detectados, o mas del umbral) sigue dejando
 * el nombre de siempre, sin sufijo: es lo que ya prueban 8 de los tests
 * de review.test.ts y lo que finish.ts ya sabia leer antes de esta
 * tarea.
 */
const RONDA_FILE_RE = /^(?:peticion|informe)-revision-(\d+)(?:-[a-z0-9-]+)?\.md$/;

export interface ReviewCommandDeps {
  /** Directorio de trabajo del repo Git del usuario (normalmente process.cwd()). */
  repoCwd: string;
  /** Directorio scripts/gitflow/ a usar (ver resolveGitflowScriptsDir). */
  scriptsDir: string;
  /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
  ahora?: string;
  /** TASK-085: entorno del volcado de coste automatico (tests); por defecto el del proceso. */
  env?: NodeJS.ProcessEnv;
  /** TASK-085: directorio de configuracion de Claude Code (tests); por defecto CLAUDE_CONFIG_DIR o ~/.claude. */
  configDir?: string;
  /** TASK-110: donde se escribe el progreso visible (por defecto, bajo el .git del repo). */
  progreso?: Progreso;
}

/** TASK-110: los pasos de review, declarados de antemano para que se sepa cuantos faltan. */
export const PASOS_REVIEW: readonly string[] = ['guardas', 'integracion', 'verificacion', 'peticiones', 'commit'];

/**
 * Un par peticion/informe de una ronda de revision, con el revisor al
 * que se le asigno (TASK-018). Con la ronda SIN fragmentar hay un unico
 * elemento con `revisor` igual al nombre del revisor generico.
 */
export interface RevisionGrupo {
  /** Nombre de la skill revisora (de dominio, o el generico). */
  revisor: string;
  /** Ficheros del diff que le tocan a este grupo. */
  ficheros: readonly string[];
  peticionPath: string;
  informePath: string;
}

export interface ReviewCommandResult {
  /** TASK-040: true si es una ronda N+1 generada desde en-revision. */
  incremental: boolean;
  /** Inicio del rango del diff: la rama base, o el commit de la ronda anterior. */
  desde: string;
  /** Avisos no fatales (p. ej. el commit de la ronda anterior ya no es antepasado). */
  avisos: string[];
  /** TASK-085: lo que el volcado automatico sumo a `tokens_implementacion` (0 filas = nada). */
  costeImplementacion: { sumado: number; filas: number };
  id: string;
  rama: string;
  baseBranch: string;
  /** SHA de HEAD en el momento de generar la peticion. */
  commitRevisado: string;
  ronda: number;
  filePath: string;
  /**
   * Agente que se lanza para revisar (`agente_revisor` de la tarea) y el
   * modelo con que se lanza (`modelo_sugerido`: por la seccion 16.6 de la
   * metodologia, enmendada en TASK-081, el revisor usa el mismo modelo que la
   * tarea, salvo en la ronda de verificacion: ver `modeloRonda`). TASK-047: la
   * skill revisora de cada grupo es otra cosa y va en `informes[].revisor`.
   */
  agente: string;
  modelo: string;
  /**
   * TASK-081: modelo mas barato que la peticion sugiere para ESTA ronda, solo
   * si es una ronda de verificacion y la anterior cumple la regla estricta
   * (ver `modeloBaratoPermitido`). Ausente: se mantiene `modelo`.
   */
  modeloRonda?: string;
  /**
   * TASK-083/095: `acotada` si esta ronda es una verificacion acotada al diff
   * de las correcciones (cada revisor con pendientes, mas los dominios que
   * toca la correccion, con instrucciones de verificacion); `completa` en
   * cualquier otro caso. Va escrito, con su motivo, en la linea `- Alcance:`.
   */
  alcance: 'completa' | 'acotada';
  motivoAlcance: string;
  /**
   * Un elemento por revisor que interviene en esta ronda (TASK-018): uno
   * solo, con el generico, si el diff no se fragmento por dominio; uno
   * por dominio detectado (mas el generico, si sobran ficheros sin
   * dominio) si si se fragmento.
   */
  informes: readonly RevisionGrupo[];
  /** Commit automatico del paso 5 de la 8.3 (TASK-030, item C2). */
  autoCommit: AutoCommitResult;
}

/**
 * fenceFor se mudo a core/markdown.ts en TASK-016, cuando "plan"
 * empezo a embeber tambien texto de la persona en sus peticiones. Se
 * re-exporta desde aqui para no romper a quien la importe de este
 * modulo, que es donde nacio.
 */
export { fenceFor } from '../core/markdown.js';

/**
 * `skillRevisora` y `nombreInforme` (TASK-018) los decide el
 * clasificador por dominio en runReviewCommand, NO `task.agente_revisor`
 * del frontmatter. Desde TASK-047 la peticion separa la skill que el
 * revisor carga (la del dominio) del agente que se lanza y su modelo
 * (`task.agente_revisor` y `task.modelo_sugerido`). `alcanceDiff` es el titulo de la seccion del
 * diff embebido: "Diff completo" cuando la ronda no se fragmento,
 * "Diff de tu dominio" (con el recuento de ficheros) cuando si.
 */
export function peticionTemplate(
  task: Task,
  baseBranch: string,
  commitRevisado: string,
  ronda: number,
  fecha: string,
  commits: string,
  diff: string,
  skillRevisora: string,
  nombreInforme: string,
  alcanceDiff: string,
  extras: ExtrasPeticion = {}
): string {
  // TASK-040: en una ronda incremental el rango empieza en el commit
  // revisado en la ronda anterior, no en la rama base.
  const desde = extras.desde ?? baseBranch;
  const commitsBlock = commits === '' ? '(sin commits nuevos respecto a la base)' : commits;
  // MENOR-1 de la revision de TASK-034: si TODO quedo excluido, decir
  // "sin diferencias" seria falso.
  const diffBlock =
    diff !== ''
      ? diff
      : (extras.tests ?? []).length > 0
        ? '(solo cambian tests: ver "Tests del diff" mas abajo)'
        : (extras.excluidos ?? []).length > 0
          ? '(todo el diff quedo excluido: ver "Excluido del diff" mas abajo)'
          : '(sin diferencias respecto a la base)';
  const fence = fenceFor(commitsBlock, diffBlock);
  return (
    `# Peticion de revision — ${task.id} (ronda ${ronda})\n\n` +
    `- Tarea: ${task.id} — ${task.titulo}\n` +
    `- Rama revisada: ${task.rama}\n` +
    `- Rama base: ${baseBranch}\n` +
    `- Commit revisado (HEAD): ${commitRevisado}\n` +
    `- Fecha: ${fecha}\n` +
    `- Agente a lanzar: ${task.agente_revisor} (modelo sugerido: ${task.modelo_sugerido})\n` +
    (extras.modeloRonda === undefined
      ? ''
      : `- Modelo sugerido para esta ronda: ${extras.modeloRonda} (verificacion de correcciones; la tarea usa ${task.modelo_sugerido})\n`) +
    `- Skill revisora a cargar: ${skillRevisora}\n` +
    (extras.carpetaTarea === undefined
      ? ''
      : `- Carpeta de la tarea: ${extras.carpetaTarea} (criterios de aceptacion y plan)\n`) +
    (extras.desde === undefined
      ? ''
      : `- Revision incremental: solo los cambios desde ${extras.desde} (el commit revisado en la ronda anterior)\n`) +
    (extras.alcance === undefined
      ? ''
      : `- Alcance: ${extras.alcance.acotada ? ALCANCE_ACOTADA : 'completa'} (motivo: ${extras.alcance.motivo})\n`) +
    '\n' +
    (extras.alcance?.acotada === true ? instruccionesAcotadas(nombreInforme) : instruccionesCompletas(nombreInforme)) +
    seccionContextoPermitido(extras.contextoPermitido) +
    (extras.seccionPrevia ?? '') +
    `## Commits a revisar (git log ${desde}..HEAD)\n\n` +
    `${fence}\n` +
    `${commitsBlock}\n` +
    `${fence}\n\n` +
    `## ${alcanceDiff}\n\n` +
    `${fence}diff\n` +
    `${diffBlock}\n` +
    `${fence}\n` +
    seccionExcluidos(desde, extras) +
    seccionTests(desde, extras) +
    (extras.seccionCobertura ?? '') +
    (extras.seccionVerificacion ?? '')
  );
}

const CLASIFICACION =
  'Clasifica cada hallazgo como\n' +
  'CRITICO (perdida de datos, corrupcion de estado, el comando hace lo\n' +
  'contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un\n' +
  'caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"\n' +
  'explicito tambien vale; inventar hallazgos, no.';

function instruccionesCompletas(nombreInforme: string): string {
  return (
    '## Instrucciones para el agente revisor\n\n' +
    'Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es\n' +
    'reproducir empiricamente, no leer el diff y opinar: clona el repo a un\n' +
    'directorio temporal, corre la suite tu mismo (salvo que esta\n' +
    'peticion ya traiga la verificacion de la ronda en verde para el commit revisado;\n' +
    'entonces vale ese resultado) y construye el caso que\n' +
    `rompe el codigo antes de reportarlo. ${CLASIFICACION} Vuelca tu salida en el\n` +
    `informe de esta ronda (${nombreInforme}), sin borrar la\n` +
    'peticion.\n\n'
  );
}

/**
 * TASK-095: frase que limita los hallazgos nuevos de una verificacion acotada.
 * Exportada para que los tests comprueben su presencia sin copiar el texto.
 */
export const REGLA_HALLAZGOS_NUEVOS =
  'Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion\n' +
  '(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como\n' +
  'nota al final del informe, no en la tabla: no abre otra ronda.';

/**
 * TASK-095: desde la ronda 2 la ronda verifica las correcciones, tambien si la
 * anterior dejo CRITICOS o IMPORTANTES (antes, TASK-083, solo con MENORES). No
 * basta con tachar la lista: la correccion puede abrir un fallo nuevo, asi que
 * se siguen exigiendo los tests y la busqueda de fallos en el delta.
 */
function instruccionesAcotadas(nombreInforme: string): string {
  return (
    '## Instrucciones para el agente revisor (verificacion acotada)\n\n' +
    'Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una\n' +
    'revision completa: esta ronda verifica las correcciones de la ronda anterior,\n' +
    'no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu\n' +
    'tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:\n\n' +
    '1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo\n' +
    '   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:\n' +
    '   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el\n' +
    '   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la\n' +
    '   causa no esta en el diff.\n' +
    '2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit\n' +
    '   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion\n' +
    '   ya trae la verificacion de la ronda en verde para ese mismo commit, no la\n' +
    '   repitas: cita ese resultado y corre solo los tests de lo que verificas.\n' +
    '3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo\n' +
    '   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que\n' +
    '   lo rompe antes de reportarlo.\n\n' +
    `${REGLA_HALLAZGOS_NUEVOS}\n\n` +
    `${CLASIFICACION} En la tabla, cada hallazgo pendiente que ya este\n` +
    'resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el\n' +
    `informe de esta ronda (${nombreInforme}), sin borrar la peticion.\n\n`
  );
}

/** Datos de la peticion que anadio TASK-034; opcionales para no romper la firma. */
export interface ExtrasPeticion {
  /** Carpeta de la tarea YA en su estado destino, relativa a la raiz del repo. */
  carpetaTarea?: string;
  /** Ficheros que cambian pero cuyo diff no se embebe. */
  excluidos?: readonly string[];
  /** `git diff --stat` de los excluidos. */
  stat?: string;
  /** TASK-113: ficheros de test de esta peticion; su diff no se embebe. */
  tests?: readonly string[];
  /** TASK-113: `git diff --stat` de `tests`. */
  statTests?: string;
  /** Patrones de exclusion aplicados, para la orden que recupera su diff. */
  patrones?: readonly string[];
  /** TASK-040: inicio del rango en una ronda incremental. */
  desde?: string;
  /** TASK-040: seccion con los hallazgos abiertos de la ronda anterior. */
  seccionPrevia?: string;
  /** TASK-074: lineas cambiadas sin cubrir (solo si el proyecto declara `informe_cobertura`). */
  seccionCobertura?: string;
  /** TASK-091: la verificacion selectiva de la ronda (solo si el proyecto declara `comando_verificacion_selectiva`). */
  seccionVerificacion?: string;
  /** TASK-081: lo que el revisor puede leer sin justificarlo (ver core/contexto-revision.ts). */
  contextoPermitido?: readonly string[];
  /** TASK-081: modelo mas barato sugerido para esta ronda de verificacion. */
  modeloRonda?: string;
  /** TASK-083: alcance de la ronda y su motivo; sin el, ni linea `- Alcance:` ni instrucciones acotadas. */
  alcance?: { acotada: boolean; motivo: string };
}

/** TASK-081: la lista orienta, no prohibe; lo de fuera se justifica en el informe. */
function seccionContextoPermitido(rutas: readonly string[] | undefined): string {
  if (rutas === undefined) return '';
  return (
    '## Contexto permitido\n\n' +
    'Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.\n' +
    'Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del\n' +
    'contexto permitido` de tu informe.\n\n' +
    rutas.map((r) => `- ${r}`).join('\n') +
    '\n\n'
  );
}

/** Lo que hace falta saber de la ronda N para generar la N+1 (TASK-040). */
interface RondaPrevia {
  ronda: number;
  veredicto: VeredictoInforme;
  /** Commit revisado en la ronda N, o null si ninguna peticion lo dice. */
  commit: string | null;
  /** Seccion de la peticion con todos los hallazgos pendientes (ronda completa). */
  seccion: string;
  /**
   * TASK-095: seccion por revisor ('' = el generico, sin sufijo) con SUS
   * hallazgos pendientes, para la ronda acotada.
   */
  seccionesPorRevisor: Map<string, string>;
  /**
   * TASK-112: revisores ('' = el generico) cuyos unicos pendientes son MENORES:
   * no estan en `seccionesPorRevisor` y solo vuelven si la correccion toca su dominio.
   */
  soloMenores: string[];
  /** TASK-112: cuantos MENORES pendientes tiene cada revisor ('' = el generico). */
  menoresPorRevisor: Map<string, number>;
  /** TASK-095: hallazgos de la ronda N que no estan `corregido` ni `aceptado`. */
  sinMarcar: string[];
  /** TASK-081 y TASK-083: lo que los informes de la ronda N permiten para la N+1. */
  alcance: AlcanceRonda;
  /** TASK-083: la ronda N fue una verificacion acotada (su peticion lo dice). */
  fueAcotada: boolean;
}

/** Vive en core/informe-revision.ts desde TASK-083; se reexporta para quien la importe de aqui. */
export { modeloBaratoPermitido } from '../core/informe-revision.js';

/** Tabla de pendientes de una ronda, con la nota de los informes ilegibles. */
function seccionPendientes(
  ronda: number,
  filas: readonly string[],
  sinTabla: readonly string[],
  menoresOmitidos = 0
): string {
  let seccion =
    `## Hallazgos de la ronda ${String(ronda)} pendientes de verificar\n\n` +
    'Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la\n' +
    'correccion no abre otro fallo: es justo donde se cuelan.\n\n';
  // TASK-112: en la ronda acotada solo van los CRITICOS e IMPORTANTES.
  if (menoresOmitidos > 0) {
    seccion +=
      `Tus ${String(menoresOmitidos)} hallazgo(s) MENOR de la ronda ${String(ronda)} no estan en la tabla: ` +
      'los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.\n\n';
  }
  if (filas.length > 0) {
    seccion += '| ID | Severidad | Estado | Fichero | Informe |\n|---|---|---|---|---|\n' + filas.join('\n') + '\n';
  } else if (sinTabla.length === 0) {
    seccion += `0 hallazgos pendientes en la tabla de la ronda ${String(ronda)}.\n`;
  }
  if (sinTabla.length > 0) {
    // Una tabla ausente NO es "0 abiertos": los informes anteriores a la
    // tabla, o escritos a mano, hay que leerlos enteros.
    seccion +=
      `\nTabla de hallazgos ausente o ilegible en: ${sinTabla.join(', ')}. ` +
      'Lee esos informes enteros.\n';
  }
  return seccion + '\n';
}

async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
  const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
  const textos = await Promise.all(
    informes.nombres.map(async (n) => ({ nombre: n, texto: await readFile(path.join(revisionDir, n), 'utf8') }))
  );
  const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
  let commit: string | null = null;
  let fueAcotada = false;
  for (const n of peticiones.nombres) {
    const texto = await readFile(path.join(revisionDir, n), 'utf8');
    if (ALCANCE_ACOTADA_RE.test(texto)) fueAcotada = true;
    commit ??= commitRevisadoDe(texto);
  }

  // TASK-095: pendiente = todo lo que no esta `aceptado` (tambien lo
  // `corregido`, que es justo lo que hay que verificar), agrupado por el
  // revisor que lo encontro (el sufijo del informe; '' sin fragmentar).
  const filas: string[] = [];
  const sinTabla: string[] = [];
  const sinMarcar: string[] = [];
  const porRevisor = new Map<string, string[]>();
  const menoresPorRevisor = new Map<string, number>();
  for (const { nombre, texto } of textos) {
    const revisor = rondaYRevisorDeInforme(nombre)?.revisor ?? '';
    const lectura = hallazgosPendientes(texto);
    if (!lectura.tabla) {
      sinTabla.push(nombre);
      continue;
    }
    for (const h of hallazgosNoCerrados(texto).abiertos) sinMarcar.push(`${h.id} (${nombre})`);
    const propias = porRevisor.get(revisor) ?? [];
    for (const h of lectura.abiertos) {
      const fila = `| ${h.id} | ${h.severidad} | ${h.estado} | ${h.fichero} | ${nombre} |`;
      filas.push(fila);
      // TASK-112: la ronda acotada solo reverifica CRITICOS e IMPORTANTES (y
      // lo que no tiene severidad reconocida, que no se descarta a ciegas);
      // los MENORES los comprueba quien coordina.
      if (severidadDe(h.severidad) === 'MENOR') menoresPorRevisor.set(revisor, (menoresPorRevisor.get(revisor) ?? 0) + 1);
      else propias.push(fila);
    }
    porRevisor.set(revisor, propias);
  }
  const seccionesPorRevisor = new Map<string, string>();
  const soloMenores: string[] = [];
  for (const [revisor, propias] of porRevisor) {
    const menores = menoresPorRevisor.get(revisor) ?? 0;
    if (propias.length > 0) seccionesPorRevisor.set(revisor, seccionPendientes(informes.ronda, propias, [], menores));
    else if (menores > 0) soloMenores.push(revisor);
  }
  return {
    ronda: informes.ronda,
    veredicto: veredictoDeRonda(textos.map((t) => t.texto)),
    commit,
    seccion: seccionPendientes(informes.ronda, filas, sinTabla),
    seccionesPorRevisor,
    soloMenores,
    menoresPorRevisor,
    sinMarcar,
    alcance: alcanceRondaSiguiente(textos.map((t) => t.texto)),
    fueAcotada,
  };
}

/**
 * TASK-113: los tests no se embeben (eran la mayor parte de los bytes de la
 * peticion): se listan con su `--stat` y su ruta, y con la orden que da su
 * diff. Sin tests, no hay seccion.
 */
/** TASK-113: hasta cuantos tests la orden de la peticion los nombra uno a uno. */
export const MAX_RUTAS_ORDEN_TESTS = 20;

function seccionTests(desde: string, extras: ExtrasPeticion): string {
  const tests = extras.tests ?? [];
  if (tests.length === 0) return '';
  // Con muchos tests, la orden por rutas no cabria en una linea de comandos
  // (MEN-1 de la revision): se pide por los patrones de test.
  const rutas =
    tests.length <= MAX_RUTAS_ORDEN_TESTS
      ? tests.map((t) => `":(literal)${t}"`).join(' ')
      : [
          ...PATRONES_TEST.map((p) => `":(glob)${p}"`),
          ...(extras.patrones ?? []).map((p) => `":(exclude,glob)${p}"`),
        ].join(' ');
  const stat = (extras.statTests ?? '').replace(/\s+$/, '');
  const fence = fenceFor(stat);
  return (
    `\n## Tests del diff (${tests.length} fichero(s))\n\n` +
    'Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su\n' +
    'diff con:\n\n' +
    `${fence}\n` +
    `git diff ${desde}..HEAD -- ${rutas}\n` +
    `${fence}\n\n` +
    `${fence}\n` +
    `${stat}\n` +
    `${fence}\n`
  );
}

/**
 * Lo excluido del diff no desaparece: se dice que es, cuanto pesa y con
 * que orden se pide (TASK-034). Sin excluidos, no hay seccion.
 */
function seccionExcluidos(baseBranch: string, extras: ExtrasPeticion): string {
  const excluidos = extras.excluidos ?? [];
  if (excluidos.length === 0) return '';
  // Comillas dobles: agrupan en bash y tambien en cmd.exe, donde las
  // simples no (MENOR-4 de la revision de TASK-034).
  const patrones = (extras.patrones ?? []).map((p) => `":(glob)${p}"`).join(' ');
  // Sin trim() al principio: se comeria la sangria de la primera linea
  // del --stat (MENOR-3).
  const stat = (extras.stat ?? '').replace(/\s+$/, '');
  const fence = fenceFor(stat);
  return (
    `\n## Excluido del diff (${excluidos.length} fichero(s))\n\n` +
    'Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de\n' +
    'tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo\n' +
    'necesitas, pidelo con:\n\n' +
    `${fence}\n` +
    `git diff ${baseBranch}..HEAD -- ${patrones}\n` +
    `${fence}\n\n` +
    `${fence}\n` +
    `${stat}\n` +
    `${fence}\n`
  );
}

export function informeTemplate(task: Task, commitRevisado: string, ronda: number): string {
  return (
    `# Informe de revision — ${task.id} (ronda ${ronda})\n\n` +
    `- Commit revisado: ${commitRevisado}\n` +
    '- Revisor: (rellenar por el agente)\n' +
    // taskctl finish exige que TODAS las lineas "- Veredicto:" del
    // informe aprueben: hay que SUSTITUIR esta linea, no anadir otra.
    // TASK-036: el veredicto lo escribe `taskctl veredicto`, que deja la
    // linea canonica y la commitea; escribirla a mano en otro vocabulario
    // obligaba a commits de normalizacion.
    '- Veredicto: PENDIENTE (escribelo con: taskctl veredicto ' +
    `${task.id} aprobada | aprobada-con-correcciones | cambios-solicitados)\n\n` +
    '## Hallazgos\n\n' +
    // La tabla es para que una maquina la lea (la ronda incremental,
    // TASK-040); la reproduccion de cada hallazgo va debajo, en prosa.
    // TASK-063: `Origen` por hallazgo, para medir cuantos fallos vienen del
    // plan o del enunciado y no del codigo (lo lee `leerHallazgos`).
    '| ID | Severidad | Estado | Fichero | Origen |\n' +
    '|---|---|---|---|---|\n' +
    '| (ej. IMP-1) | (CRITICO / IMPORTANTE / MENOR) | (abierto / corregido / aceptado) | (ruta:linea) | ' +
    '(implementacion / plan / especificacion) |\n\n' +
    'Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el\n' +
    'plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el\n' +
    'enunciado o en los criterios de aceptacion de la tarea.\n\n' +
    'Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.\n\n' +
    // TASK-081: lo leido fuera de la lista de la peticion, con su motivo.
    '## Lecturas fuera del contexto permitido\n\n' +
    'ninguna\n'
  );
}

/**
 * TASK-095: grupos de una verificacion acotada. Un grupo por revisor con
 * hallazgos pendientes (el sufijo '' es el generico) y por cada dominio cuyos
 * ficheros toca el delta; todos reciben el delta entero (no filtrado: la
 * correccion de un hallazgo de dominio puede tocar un llamante de otro).
 */
function planDeVerificacion(
  previa: RondaPrevia,
  delta: readonly string[],
  catalogo: ReturnType<typeof cargarCatalogoRevisores>,
  generico: string
): { fragmentado: boolean; grupos: { revisor: string; ficheros: readonly string[] }[] } {
  const revisores: string[] = [];
  const anadir = (r: string): void => {
    if (!revisores.includes(r)) revisores.push(r);
  };
  for (const r of previa.seccionesPorRevisor.keys()) anadir(r === '' ? generico : r);
  const tocados = new Set(clasificarPorDominio(delta, catalogo).grupos.map((g) => g.revisor));
  for (const r of tocados) {
    if (r !== generico) anadir(r);
  }
  // TASK-112: quien solo tenia MENORES vuelve si la correccion toca sus
  // ficheros (tambien el generico: los suyos son los que no son de ningun dominio).
  for (const r of previa.soloMenores.map((x) => (x === '' ? generico : x))) {
    if (tocados.has(r)) anadir(r);
  }
  if (revisores.length === 0) anadir(generico);
  return { fragmentado: false, grupos: revisores.map((revisor) => ({ revisor, ficheros: delta })) };
}

/** TASK-112: seccion de tarea.md con los revisores que la ronda acotada no relanzo. */
export const SECCION_NO_RELANZADOS = '## Revisores no relanzados';

/** TASK-095: seccion de un revisor sin pendientes propios en la ronda acotada. */
function seccionSinPendientes(ronda: number, menores = 0): string {
  // TASK-112 (MEN-3 de su revision): quien vuelve con solo MENORES si los tiene;
  // no van en la tabla a proposito.
  const inicio =
    menores > 0
      ? `Tus ${String(menores)} hallazgo(s) MENOR de la ronda ${String(ronda)} no se reverifican (los comprueba\n` +
        'quien coordina): recibes esta ronda porque la correccion'
      : 'No tienes hallazgos pendientes propios: recibes esta ronda porque la correccion';
  return (
    `## Hallazgos de la ronda ${String(ronda)} pendientes de verificar\n\n` +
    `${inicio}\n` +
    'toca ficheros de tu dominio. Revisa en el diff de esta ronda lo que la correccion\n' +
    'cambia en tu terreno y si abre un fallo.\n\n'
  );
}

/** isAncestor sin lanzar: un SHA que ya no existe (gc) no es antepasado. */
function esAntepasado(sha: string, cwd: string): boolean {
  try {
    return isAncestor(sha, 'HEAD', cwd);
  } catch {
    return false;
  }
}

export async function runReviewCommand(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: ReviewCommandDeps
): Promise<ReviewCommandResult> {
  // TASK-110: el progreso se marca terminado tambien si aborta.
  const progreso = deps.progreso ?? crearProgreso(deps.repoCwd);
  return conProgreso(progreso, () => runReview(tareasRoot, argv, today, deps, progreso));
}

async function runReview(
  tareasRoot: string,
  argv: readonly string[],
  today: string,
  deps: ReviewCommandDeps,
  progreso: Progreso
): Promise<ReviewCommandResult> {
  // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
  rechazarFlagsDesconocidos(argv, FLAGS_REVIEW, 'review', (m) => new ReviewCommandError(m));
  const { push, resto: sinPush } = extraerPushFlag(argv);
  const completaPedida = sinPush.includes('--completa');
  const rondaExtra = sinPush.includes('--ronda-extra');
  const resto = sinPush.filter((a) => a !== '--completa' && a !== '--ronda-extra');
  const id = resto[0];
  if (id === undefined || id.trim() === '') {
    throw new ReviewCommandError('[ERROR] Falta el ID de la tarea: taskctl review TASK-NNN.');
  }

  // TASK-119: un intento anterior que murio con lo pendiente de la tarea
  // apartado lo recupera ahora, antes de leer nada (el veredicto vive ahi).
  recuperarApartado(deps.repoCwd, tareasRoot, id);

  // Lectura PRELIMINAR (regla de la doble lectura, TASK-012): sirve
  // para rechazo rapido sin tocar Git y para extraer tipo/rama —
  // metadata estable que ningun comando reescribe. La lectura que
  // decide la escritura va DESPUES del script, que cambia de rama.
  const initial = await readTareaFile(tareasRoot, id);
  // TASK-040: con la tarea en en-revision, la guarda decide con el
  // veredicto de la ultima ronda, leido de revision/.
  const incremental = initial !== null && initial.task.estado === 'en-revision';
  let previa: RondaPrevia | null = null;
  const ctx: TransitionContext = {};
  if (incremental) {
    previa = await leerRondaPrevia(path.join(path.dirname(initial.filePath), REVISION_DIRNAME));
    ctx.veredictoRondaAnterior = previa.veredicto;
  }
  assertTransitionAllowed('review', initial ? initial.task : null, ctx);
  // TASK-095: el tope de rondas lo aplica tambien review, no solo siguiente:
  // llamar a review sin pasar por siguiente abria rondas sin limite (una tarea
  // llego a 14). Pasado el tope, otra ronda solo con --ronda-extra, que la
  // skill pasa unicamente cuando una persona lo decide. Antes de tocar nada.
  // TASK-127: el tope sale de `tope_rondas` en la config de la rama base (la
  // rama de la tarea no puede subirselo), y cada ronda extra exige que conste
  // en tarea.md la decision de una persona: el flag solo ya no basta.
  if (previa !== null) {
    const tope = configDeRef(resolverConfig(deps.repoCwd).rama_base, deps.repoCwd).tope_rondas;
    if (previa.ronda >= tope) {
      const nueva = previa.ronda + 1;
      if (!rondaExtra) {
        throw new ReviewCommandError(
          `[ERROR] ${id}: la ronda ${String(previa.ronda)} ya llego al tope de rondas (${String(tope)}). ` +
            'Lo decide una persona: cerrar con lo que hay (lo abierto, aceptado con sus IDs y el motivo en el ' +
            'Resultado), volver a diseno (lo abierto, en una tarea nueva) o una ronda mas: anotar en tarea.md, ' +
            `seccion "${SECCION_RONDAS_EXTRA}", la linea "${lineaRondaExtra(nueva)}" y ejecutar ` +
            `"taskctl review ${id} --ronda-extra".`
        );
      }
      if (!rondaExtraDecidida(initial!.body, nueva)) {
        throw new ReviewCommandError(
          `[ERROR] ${id}: --ronda-extra pasado el tope de rondas (${String(tope)}) exige que conste la decision ` +
            `de una persona en tarea.md: seccion "${SECCION_RONDAS_EXTRA}" con la linea ` +
            `"${lineaRondaExtra(nueva)}". No se ha tocado nada.`
        );
      }
    }
  }
  const tipo = initial!.task.tipo;
  const rama = initial!.task.rama;
  progreso.fase(initial!.task.id, 'review', PASOS_REVIEW, previa === null ? {} : { ronda: previa.ronda + 1 });
  progreso.paso('guardas');

  // Mismo motivo que en start: el prompt interactivo de Git-Flow con
  // stdin no interactivo cancela en silencio (EOF => "No" => exit 0).
  // TASK-119: lo pendiente de la propia tarea (coste, veredicto, informe) no
  // cuenta: se aparta mientras corren el script y la verificacion, y entra en
  // el commit de la ronda.
  if (hayCambiosFueraDeTarea(deps.repoCwd, tareasRoot, initial!.task.id)) {
    throw new ReviewCommandError(
      `[ERROR] ${id}: el workspace tiene cambios sin commitear. ` +
        'Haz commit o stash antes de "taskctl review" — el update de Git-Flow necesita el ' +
        'workspace limpio y su prompt interactivo cancela en silencio sin terminal.'
    );
  }

  progreso.paso('integracion');
  const scriptName = SCRIPT_BY_TYPE[tipo];
  // TASK-040: la ronda incremental no ejecuta el update (el merge de la
  // base entraria en el delta); exige estar ya en la rama de la tarea.
  // MEN-1 de la revision: el fallo del script lanza DENTRO de la ventana, para
  // que lo apartado no se devuelva encima de un merge a medias y el error que
  // se ve sea el del script (con la nota de como se recupera lo apartado).
  if (!incremental) {
    conPendientesApartados(deps.repoCwd, tareasRoot, initial!.task.id, () => {
      const { code, signal } = runGitflowScript(scriptName, [rama, ...gitflowBaseArgs(tipo, deps.repoCwd)], {
        scriptsDir: deps.scriptsDir,
        cwd: deps.repoCwd,
      });
      if (code !== 0) {
        const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
        throw new ReviewCommandError(
          `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
            'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo y haz commit ' +
            'antes de reintentar); la tarea no se ha movido de carpeta.'
        );
      }
    });
  }

  // Evidencia, no suposicion (TASK-007/009): rama activa correcta y
  // merge de la base ocurrido de verdad (la base es antepasada de
  // HEAD), no solo un exit 0 del script.
  const branchNow = currentBranch(deps.repoCwd);
  if (incremental && branchNow !== rama) {
    throw new ReviewCommandError(
      `[ERROR] ${id}: la ronda incremental se genera desde la rama de la tarea, "${rama}", ` +
        `y la activa es "${branchNow}". Cambia a "${rama}" (git checkout ${rama}) y reintenta.`
    );
  }
  if (branchNow !== rama) {
    throw new ReviewCommandError(
      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero la rama activa es ` +
        `"${branchNow}", no "${rama}". No se actualiza la tarea; revisa el repo a mano.`
    );
  }
  const baseBranch = resolveBaseBranchForTipo(tipo, deps.repoCwd);
  if (!incremental && !isAncestor(baseBranch, 'HEAD', deps.repoCwd)) {
    throw new ReviewCommandError(
      `[ERROR] ${id}: ${scriptName} termino con codigo 0 pero "${baseBranch}" NO esta ` +
        `integrada en "${rama}" (merge-base --is-ancestor lo niega). No se actualiza la ` +
        'tarea; revisa el repo a mano.'
    );
  }

  // Lectura FRESCA, ya con la rama de la tarea activa: la unica que
  // decide si se muta algo y con que contenido (regla de la doble
  // lectura — el update pudo traer de la base un tarea.md mas nuevo).
  const existing = await readTareaFile(tareasRoot, id);
  assertTransitionAllowed('review', existing ? existing.task : null, ctx);
  const { task, body, filePath } = existing as NonNullable<typeof existing>;

  const commitRevisado = headCommit(deps.repoCwd);
  // TASK-040: inicio del rango. En la ronda incremental, el commit
  // revisado en la ronda N si sigue siendo antepasado de HEAD; si no (un
  // rebase, un amend, un gc) o no consta, el diff completo con un aviso.
  const avisos: string[] = [];
  // TASK-082: aviso (sin bloquear) si falta la constancia de la
  // autorrevision. Sobre la lectura fresca y antes de cualquier escritura;
  // avisoAutorrevision es pura y nunca lanza.
  const sinAutorrevision = avisoAutorrevision(body, id);
  if (sinAutorrevision !== null) avisos.push(sinAutorrevision);
  // TASK-095: entre ronda y ronda se corrige TODO lo de la ronda anterior; lo
  // que no compense (un MENOR) se marca `aceptado` con su motivo o pasa a una
  // tarea nueva. Dejarlo para la ronda siguiente es lo que alargaba el ciclo.
  // Aviso, sin bloquear: la ronda la puede abrir igual.
  if (previa !== null && previa.sinMarcar.length > 0) {
    const lista = previa.sinMarcar.slice(0, 8).join(', ');
    const resto = previa.sinMarcar.length > 8 ? ` (y ${String(previa.sinMarcar.length - 8)} mas)` : '';
    avisos.push(
      `${id}: la ronda ${String(previa.ronda)} tiene hallazgos sin marcar como corregido ni aceptado: ${lista}${resto}. ` +
        'Corrigelos todos antes de abrir la ronda; el MENOR que no compense, marcalo aceptado con su ' +
        'motivo en su informe o pasalo a una tarea nueva.'
    );
  }
  let desde = baseBranch;
  if (incremental && previa !== null) {
    const valido = previa.commit !== null && esAntepasado(previa.commit, deps.repoCwd);
    if (valido) {
      desde = previa.commit as string;
    } else {
      avisos.push(
        `${id}: ${previa.commit === null ? 'ninguna peticion de la ronda ' + String(previa.ronda) + ' dice que commit se reviso' : `el commit revisado en la ronda ${previa.ronda} (${previa.commit}) ya no es antepasado de HEAD (¿rebase o amend?)`}. ` +
          `La ronda ${String(previa.ronda + 1)} lleva el diff completo desde "${baseBranch}".`
      );
    }
  }
  // TASK-034: lo generado (dist/, lockfiles) y la propia carpeta de
  // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
  // TASK-073: los tests held-out nunca se embeben, se configure lo que se configure.
  const configRama = resolverConfig(deps.repoCwd);
  const excluir = excluirDeRevision(configRama.excluir_de_revision);
  let paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);

  // TASK-095: alcance de la ronda. Desde la ronda 2 es una verificacion
  // acotada, tambien con CRITICOS o IMPORTANTES en la anterior (antes, TASK-083,
  // solo con MENORES: no se cumplia nunca). Completa solo si: se pide
  // --completa (siempre desde la base), los informes no lo permiten (las guardas
  // fail-closed de alcanceRondaSiguiente) o no hay commit revisado fiable (el
  // diff ya va desde la base). Un merge entre rondas no la hace completa: se
  // nombra (decision de la persona). Antes de escribir nada.
  let acotada = false;
  let motivoAlcance = 'primera ronda de revision';
  if (incremental && previa !== null) {
    if (completaPedida) {
      motivoAlcance = 'pedida con --completa';
      if (desde !== baseBranch) {
        motivoAlcance += `; el diff va desde "${baseBranch}"`;
        desde = baseBranch;
        paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
      }
    } else if (!previa.alcance.acotada) motivoAlcance = previa.alcance.motivo;
    else if (desde === baseBranch) motivoAlcance = 'no hay commit revisado fiable: el diff va desde la rama base';
    else {
      acotada = true;
      motivoAlcance = previa.alcance.motivo;
      if (hayMergesEntre(desde, 'HEAD', deps.repoCwd)) {
        motivoAlcance += `; hay commits de merge entre ${desde} y HEAD: lo que entra con ellos va en el diff y tambien se revisa`;
      }
    }
    // Una ronda completa tras una acotada revisa desde la base: el delta de
    // la acotada nunca tuvo revision completa (punto 3 del plan de TASK-083).
    if (!acotada && previa.fueAcotada && desde !== baseBranch) {
      motivoAlcance += `; la ronda ${previa.ronda} fue acotada, asi que el diff va desde "${baseBranch}"`;
      desde = baseBranch;
      paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
    }
  }
  const commits = logOneline(desde, 'HEAD', deps.repoCwd);
  const diff = paraRevision.diff;
  // TASK-091: con `comando_verificacion_selectiva`, la ronda la corre (con la
  // base en RAMA_BASE) ANTES de escribir la ronda: un rojo aborta con la tarea
  // en curso y sin ronda a medias (decision de Carlos). En la primera ronda el
  // update de Git-Flow ya integro la base (y ese merge queda hecho); en una
  // incremental la rama no se actualiza (TASK-040). Sin la clave, nada.
  progreso.paso('verificacion');
  // TASK-119: con lo pendiente apartado, el arbol queda limpio y la huella de
  // la verificacion casa con la del hook Stop (y se guarda su memo).
  const verificacion = conPendientesApartados(deps.repoCwd, tareasRoot, task.id, () =>
    verificacionDeRonda(id, configRama, baseBranch, tipo, incremental, deps, avisos, () =>
      // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
      entornoConContador(deps.env ?? process.env, progreso.contador())
    )
  );
  // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
  // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
  // nadie arreglo sigue ahi). Una vez por ronda y antes de escribir nada;
  // nunca lanza: un informe roto es un aviso en la peticion. TASK-091: si
  // corrio la selectiva no se muestra: su informe puede ser parcial
  // (decision de Carlos; la completa la mide en el cierre).
  const datosCobertura =
    configRama.informe_cobertura === null || verificacion !== null
      ? null
      : datosCoberturaRevision(
          raizDelRepo(deps.repoCwd),
          baseBranch,
          configRama.informe_cobertura,
          excluir,
          configRama.umbral_cobertura,
          configRama.comando_verificacion
        );

  // Clasificacion por dominio (TASK-018, criterios de aceptacion 1 y 2):
  // el diff real de la rama, no `task.agente_revisor` del frontmatter,
  // decide quien revisa. El catalogo se relee de skills/*/SKILL.md en
  // CADA ejecucion (sin cache: HALLAZGOS.md documenta que una copia
  // congelada de patrones_archivo ya diverguio dos veces).
  // Solo los INCLUIDOS se clasifican: un dist/*.js no debe activar un
  // dominio ni fragmentar la revision por ficheros que nadie va a leer
  // (correccion del rol de arquitectura, TASK-034).
  const ficherosTocados = paraRevision.incluidos;
  const catalogoRevisores = cargarCatalogoRevisores();
  // TASK-095: en la verificacion acotada revisa cada revisor que tiene algo
  // pendiente (el de dominio verifica lo suyo, no el generico en su lugar) y
  // cada dominio cuyo terreno toca la correccion; todos con el delta entero.
  // Sin nadie, el generico. El coste crece con la correccion, no con el repo.
  const generico = catalogoRevisores.generico.nombre;
  const plan = acotada
    ? planDeVerificacion(previa!, ficherosTocados, catalogoRevisores, generico)
    : clasificarPorDominio(ficherosTocados, catalogoRevisores);
  // TASK-112: quien solo tenia MENORES pendientes y no ve tocado su dominio no
  // vuelve en la ronda acotada; consta en tarea.md (mas abajo, con el commit).
  const noRelanzados = acotada
    ? previa!.soloMenores
        .map((r) => (r === '' ? generico : r))
        .filter((r) => !plan.grupos.some((g) => g.revisor === r))
    : [];
  // Con sufijo si hay mas de un grupo o el unico no es el generico: las
  // metricas sacan el revisor del nombre del informe.
  const conSufijo = plan.fragmentado || plan.grupos.length > 1 || plan.grupos[0]?.revisor !== generico;
  // TASK-074 (MEN-4 de la revision): en una peticion fragmentada, la seccion
  // de cobertura de cada dominio lleva SUS ficheros cambiados desde la merge
  // base, no solo los del delta de la ronda: una linea sin cubrir de la ronda
  // 1 sigue en la 2 aunque su fichero no haya vuelto a cambiar. Y si el
  // dominio de un fichero no tiene peticion en esta ronda (el delta solo toca
  // otros dominios), sus lineas van a la primera peticion: no se pierden
  // (MEN-5 de la ronda 2).
  const coberturaPorRevisor = new Map<string, Set<string>>();
  if (plan.fragmentado && datosCobertura?.tipo === 'ok' && datosCobertura.cobertura.cruce !== null) {
    const cruce = datosCobertura.cobertura.cruce;
    const cambiados = [...cruce.ficheros.map((f) => f.ruta), ...cruce.sinInstrumentar];
    const conPeticion = new Set(plan.grupos.map((g) => g.revisor));
    const primera = (plan.grupos[0] as { revisor: string }).revisor;
    for (const g of clasificarPorDominio(cambiados, catalogoRevisores).grupos) {
      const destino = conPeticion.has(g.revisor) ? g.revisor : primera;
      const set = coberturaPorRevisor.get(destino) ?? new Set<string>();
      for (const f of g.ficheros) set.add(f);
      coberturaPorRevisor.set(destino, set);
    }
  }

  const updated: Task = { ...task, estado: 'en-revision', actualizado: today };

  // Peticion + scaffold de informe ANTES de mover la tarea (hallazgo
  // IMPORTANTE de revision por pares, TASK-013): si una escritura
  // falla (EEXIST por colision case-insensitive en NTFS, permisos,
  // disco), la tarea sigue en-curso y reintentar es posible — el orden
  // inverso dejaba estado en-revision sin peticion ni salida, un
  // callejon de la maquina de estados. Se escriben en la carpeta
  // ACTUAL: el rename de moveTareaFile se lleva revision/ entera.
  // Flag 'wx' en ambos: la numeracion garantiza un hueco libre, y si
  // aun asi el fichero existiera, fallar ruidosamente es mejor que
  // pisar una revision anterior — mismo principio que plan-final.md.
  const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
  await mkdir(revisionDir, { recursive: true });
  const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);
  progreso.paso('peticiones', { ronda });

  // Un par de nombres (con o sin sufijo de dominio) por grupo del plan.
  // Sin fragmentar hay un unico grupo y se usa el nombre de siempre, sin
  // sufijo: ninguna tarea que solo cae al generico cambia de convencion.
  // TASK-081: todo lo que va a la peticion se calcula ANTES del primer
  // writeFile: si algo falla aqui no queda nada a medias en revision/.
  const carpetaTarea = `tareas/${STATE_FOLDER[updated.estado]}/${updated.id}`;
  const modeloRonda =
    incremental && previa !== null && previa.alcance.modeloBarato
      ? modeloDeVerificacion(updated.modelo_sugerido)
      : null;
  const escrituras = plan.grupos.map((grupo) => {
    const sufijo = conSufijo ? `-${grupo.revisor}` : '';
    return {
      revisor: grupo.revisor,
      ficheros: grupo.ficheros,
      nombrePeticion: `peticion-revision-${ronda}${sufijo}.md`,
      nombreInforme: `informe-revision-${ronda}${sufijo}.md`,
      contexto: contextoPermitido({
        carpetaTarea,
        ficherosDelGrupo: grupo.ficheros,
        extra: configRama.contexto_revision,
        excluir,
      }),
    };
  });

  // TASK-040 (riesgo 1 del brainstorm): si una escritura falla a mitad,
  // se borran las de esta invocacion. Sin esto, una ronda N+1 a medias
  // dejaba la tarea sin salida: finish bloquea por el PENDIENTE y review
  // rechaza otra ronda por lo mismo. Son ficheros nuevos ('wx'): no se
  // borra nada que no se acabe de crear.
  const escritos: string[] = [];
  const escribir = async (ruta: string, contenido: string): Promise<void> => {
    await writeFile(ruta, contenido, { encoding: 'utf8', flag: 'wx' });
    escritos.push(ruta);
  };
  try {
    for (const escritura of escrituras) {
      // Cada revisor recibe SOLO el subconjunto de su dominio (criterio
      // de aceptacion 3): un `git diff` filtrado por pathspec, no el
      // diff entero. Sin fragmentar, el unico grupo ya es "todos los
      // ficheros" y se reusa el diff completo ya calculado arriba, para
      // no repetir la misma llamada a Git dos veces.
      // TASK-113: los tests del grupo no se embeben; van con su --stat y su ruta.
      const esTest = new Set(paraRevision.tests);
      const testsDelGrupo = plan.fragmentado
        ? escritura.ficheros.filter((f) => esTest.has(f))
        : paraRevision.tests;
      const diffDelGrupo = plan.fragmentado
        ? diffRangeForPaths(
            desde,
            'HEAD',
            escritura.ficheros.filter((f) => !esTest.has(f)),
            deps.repoCwd
          )
        : diff;
      const statTestsDelGrupo = plan.fragmentado
        ? statDeFicheros(desde, 'HEAD', testsDelGrupo, deps.repoCwd)
        : paraRevision.statTests;
      const alcanceDiff = plan.fragmentado
        ? `Diff de tu dominio (${escritura.ficheros.length} fichero(s) de ` +
          `${ficherosTocados.length}; git diff ${desde}..HEAD -- <tus ficheros>)`
        : desde === baseBranch
          ? `Diff completo (git diff ${baseBranch}..HEAD)`
          : `Diff desde la ronda anterior (git diff ${desde}..HEAD)`;

      await escribir(
        path.join(revisionDir, escritura.nombrePeticion),
        peticionTemplate(
          updated,
          baseBranch,
          commitRevisado,
          ronda,
          today,
          commits,
          diffDelGrupo,
          escritura.revisor,
          escritura.nombreInforme,
          alcanceDiff,
          {
            // La peticion se escribe ANTES de mover la tarea: la carpeta
            // sale del estado destino, no de filePath.
            carpetaTarea,
            contextoPermitido: escritura.contexto,
            alcance: { acotada, motivo: motivoAlcance },
            ...(modeloRonda === null ? {} : { modeloRonda }),
            excluidos: paraRevision.excluidos,
            stat: paraRevision.stat,
            tests: testsDelGrupo,
            statTests: statTestsDelGrupo,
            patrones: excluir,
            ...(incremental && desde !== baseBranch ? { desde } : {}),
            ...(previa !== null
              ? {
                  seccionPrevia: acotada
                    ? (previa.seccionesPorRevisor.get(escritura.revisor === generico ? '' : escritura.revisor) ??
                      previa.seccionesPorRevisor.get(escritura.revisor) ??
                      seccionSinPendientes(
                        previa.ronda,
                        previa.menoresPorRevisor.get(escritura.revisor === generico ? '' : escritura.revisor) ?? 0
                      ))
                    : previa.seccion,
                }
              : {}),
            ...(datosCobertura === null
              ? {}
              : {
                  seccionCobertura: seccionCoberturaRevision(
                    datosCobertura,
                    plan.fragmentado ? (coberturaPorRevisor.get(escritura.revisor) ?? new Set<string>()) : undefined
                  ),
                }),
            ...(verificacion === null
              ? {}
              : {
                  seccionVerificacion: seccionDeVerificacion(
                    verificacion,
                    baseBranch,
                    configRama.informe_cobertura !== null
                  ),
                }),
          }
        )
      );
      await escribir(
        path.join(revisionDir, escritura.nombreInforme),
        informeTemplate(updated, commitRevisado, ronda)
      );
    }
  } catch (e: unknown) {
    await Promise.all(escritos.map((r) => unlink(r).catch(() => undefined)));
    if (!isEexist(e)) throw e;
    throw new ReviewCommandError(
      `[ERROR] ${id}: ya existe un fichero de la ronda ${ronda} en ${revisionDir} ` +
        '(¿restos con otro case en un filesystem case-insensitive?). La tarea NO se ha ' +
        'movido; limpia o renombra esos ficheros y reintenta.'
    );
  }

  progreso.paso('commit');
  // TASK-085: el coste de implementacion que el hook fue anotando se suma
  // aqui, en el mismo fichero y commit que la transicion. Nunca aborta.
  const volcado = await volcarCosteAutomatico(updated, body, instanteDelVolcado(deps.ahora), {
    raiz: deps.repoCwd,
    ...(deps.env === undefined ? {} : { env: deps.env }),
    ...(deps.configDir === undefined ? {} : { configDir: deps.configDir }),
  });
  avisos.push(...volcado.avisos);
  const conRegistro = registrarTransicion(volcado.body, 'review', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
  let cuerpoFinal = conRegistro;
  for (const r of noRelanzados) {
    cuerpoFinal = anotarLineaEnSeccion(
      cuerpoFinal,
      SECCION_NO_RELANZADOS,
      `- ronda ${String(ronda)}: ${r} - solo tenia hallazgos MENOR pendientes y la correccion no toca sus ficheros`
    );
  }
  const newFilePath = await moveTareaFile(tareasRoot, filePath, volcado.task, cuerpoFinal);
  const newRevisionDir = path.join(path.dirname(newFilePath), REVISION_DIRNAME);
  const informes: RevisionGrupo[] = escrituras.map((escritura) => ({
    revisor: escritura.revisor,
    ficheros: escritura.ficheros,
    peticionPath: path.join(newRevisionDir, escritura.nombrePeticion),
    informePath: path.join(newRevisionDir, escritura.nombreInforme),
  }));

  // Paso 5 de la 8.3 (TASK-030, item C2). "review" NO aplica
  // ensureBaseBranchReady, asi que en el arbol puede haber trabajo de
  // la persona junto al de taskctl: solo entran las dos carpetas de la
  // tarea (la de origen para que el movimiento se registre como tal, y
  // la de destino, que ya contiene revision/ con la peticion y el
  // scaffold del informe).
  const commitResult = autoCommit({
    fase: 'review',
    cwd: deps.repoCwd,
    rutas: [path.dirname(filePath), path.dirname(newFilePath)],
    mensaje: mensajeChore(task.id, `peticion de revision ronda ${ronda}`),
    push,
  });
  if (commitResult.commiteado) volcado.olvidar();

  return {
    autoCommit: commitResult,
    incremental,
    desde,
    avisos,
    costeImplementacion: { sumado: volcado.sumado, filas: volcado.filas },
    id: task.id,
    rama,
    baseBranch,
    commitRevisado,
    ronda,
    filePath: newFilePath,
    agente: updated.agente_revisor,
    modelo: updated.modelo_sugerido,
    ...(modeloRonda === null ? {} : { modeloRonda }),
    alcance: acotada ? 'acotada' : 'completa',
    motivoAlcance,
    informes,
  };
}

/** La seccion «Verificacion de esta ronda» de la peticion. */
function seccionDeVerificacion(r: VerificacionRonda, base: string, conCobertura: boolean): string {
  if (r.tipo === 'documentacion-sin-comando') {
    return seccionVerificacionRevision({ tipo: r.tipo, motivo: r.motivo, conCobertura });
  }
  if (r.tipo === 'documentacion') {
    return seccionVerificacionRevision({
      tipo: 'documentacion',
      resultado: r.v.resultado,
      motivo: r.motivo,
      deMemo: r.v.deMemo,
      conCobertura,
      commit: r.v.commit,
      huella: r.v.huella,
    });
  }
  return seccionVerificacionRevision({
    tipo: 'selectiva',
    resultado: r.v.resultado,
    base,
    deMemo: r.v.deMemo,
    conCobertura,
    commit: r.v.commit,
    huella: r.v.huella,
  });
}

/** Lo que verifico la ronda (para la seccion de la peticion y la cobertura). */
type VerificacionRonda =
  | { tipo: 'selectiva'; v: VerificacionConMemo }
  | { tipo: 'documentacion'; v: VerificacionConMemo; motivo: string }
  | { tipo: 'documentacion-sin-comando'; motivo: string };

/**
 * TASK-091: la verificacion de la ronda, o null si el proyecto no declara
 * `comando_verificacion_selectiva` (entonces no se decide nada ni se lanza
 * ningun git: como en la 0.14.0; y sin selectiva no corre nada aunque haya
 * comando de documentacion, decision de Carlos en TASK-102).
 *
 * TASK-104: decide con `peticionDeTrabajo`, la misma funcion y la misma
 * `baseFiable` que el freno Stop, sobre base...HEAD mas el arbol (nunca el
 * delta de la ronda): con solo documentacion corre la comprobacion de
 * documentacion de la base, o nada si no se declara. Un fallo de la decision
 * no aborta: la selectiva, con un aviso.
 *
 * Reutiliza el resultado del hook Stop si la huella coincide. Lanza
 * ReviewCommandError (sin haber escrito nada) si no sale en verde o si deja el
 * arbol sucio: el autocommit de la ronda se llevaria esos ficheros o el
 * siguiente comando abortaria por workspace sucio.
 */
function verificacionDeRonda(
  id: string,
  config: ReturnType<typeof resolverConfig>,
  base: string,
  tipoTarea: Task['tipo'],
  incremental: boolean,
  deps: ReviewCommandDeps,
  avisos: string[],
  entornoVerificacion: () => NodeJS.ProcessEnv
): VerificacionRonda | null {
  const selectiva = config.comando_verificacion_selectiva;
  if (selectiva === null) return null;
  const raiz = raizDelRepo(deps.repoCwd);
  let plan: PlanVerificacion;
  try {
    const decision = peticionDeTrabajo({
      config,
      raiz,
      base: () => base,
      baseFiable: baseDeTipoSinRed(tipoTarea),
      sinSelectiva: 'nada',
    });
    plan = decision.plan;
    avisos.push(...decision.avisos.map((a) => `${id}: ${a}`));
  } catch (e: unknown) {
    plan = { tipo: 'selectiva', comando: selectiva, timeoutS: config.timeout_verificacion_selectiva, base };
    avisos.push(
      `${id}: no se pudo decidir si la tarea solo cambia documentacion, asi que se corre la verificacion ` +
        `selectiva. Detalle: ${e instanceof Error ? e.message : String(e)}`
    );
  }
  if (plan.tipo === 'documentacion' && plan.comando === null) {
    return { tipo: 'documentacion-sin-comando', motivo: plan.motivo };
  }
  // Con la selectiva declarada, `peticionDeTrabajo` nunca da 'completa' ni 'nada'.
  if (plan.tipo !== 'selectiva' && plan.tipo !== 'documentacion') return null;
  const comando = plan.comando as string;
  const motivo = plan.tipo === 'documentacion' ? plan.motivo : null;
  const inicioVerificacion = Date.now();
  const v = verificarConMemo(
    raiz,
    motivo !== null
      ? { tipo: 'documentacion', comando, timeoutS: plan.timeoutS }
      : { tipo: 'selectiva', comando, timeoutS: plan.timeoutS, base },
    { env: entornoVerificacion() }
  );
  // TASK-128: la verificacion de la ronda queda en el registro de puertas, tambien en rojo.
  anotarPuerta(raiz, {
    puerta: PUERTA_REVIEW,
    tarea: id,
    instante: new Date().toISOString(),
    modo: motivo !== null ? 'documentacion' : 'selectiva',
    duracionS: (Date.now() - inicioVerificacion) / 1000,
    resultado: v.deMemo ? 'omitido' : v.resultado.estado === 'verde' ? 'verde' : 'rojo',
  });
  const nombre =
    motivo !== null
      ? 'la comprobacion de documentacion (comando_verificacion_documentacion: solo cambia documentacion)'
      : `la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE)`;
  // Lo que ya paso con la base antes de verificar: solo la primera ronda la integra.
  const estadoBase = incremental
    ? `en una ronda incremental la rama no se actualiza con "${base}"`
    : `la rama ya incluye "${base}" tal como estaba al empezar este review; si "${base}" avanza, el ` +
      'siguiente review lo integra';
  if (v.resultado.estado !== 'verde') {
    throw new ReviewCommandError(
      `[ERROR] ${id}: ${nombre} no esta en ` +
        'verde, asi que no se abre ronda de revision: la tarea sigue en curso y no se ha escrito peticion ni ' +
        `informe (${estadoBase}).\n` +
        `${formatearVerificacionRoja(v.resultado)}\n` +
        (v.deMemo
          ? 'Es el resultado guardado: el arbol no ha cambiado desde la ultima ejecucion. Cambia algo o ejecuta el comando a mano.\n'
          : '') +
        (motivo !== null
          ? `Para reproducirla: ejecuta "${comando}".`
          : `Para reproducirla: ejecuta "${comando}" con la variable de entorno RAMA_BASE=${base}.`)
    );
  }
  if (v.cambioElArbol) {
    throw new ReviewCommandError(
      `[ERROR] ${id}: ${motivo !== null ? 'la comprobacion de documentacion' : 'la verificacion selectiva'} salio en ` +
        'verde, pero ha dejado cambios en el arbol de trabajo ' +
        `("${comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en .gitignore, ` +
        `o descartalos, y reintenta. No se ha abierto ronda (${estadoBase}).`
    );
  }
  return motivo !== null ? { tipo: 'documentacion', v, motivo } : { tipo: 'selectiva', v };
}
