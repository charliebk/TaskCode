# Peticion de revision — TASK-115 (ronda 1)

- Tarea: TASK-115 — P-7: verificacion completa por lote de cierres en modo automatico
- Rama revisada: feature/task-115-p-7-verificacion-completa-por-lote-de-ci
- Rama base: develop
- Commit revisado (HEAD): 1bd21284d4e6662a1aee15eaf266b27dee0fb24a
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-115 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-115/tarea.md
- tareas/03-en-revision/TASK-115/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts

## Commits a revisar (git log develop..HEAD)

````
1bd2128 feat(TASK-115): verificacion completa por lote con verificacion_por_lote y taskctl verificar-lote
33f2b7d chore(TASK-115): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index d596ef2..22b8fc5 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,6 +1,7 @@
 # Changelog
 
 ## Sin publicar
+- Cambio de comportamiento (TASK-115): clave `verificacion_por_lote` (de la config de la rama base). Con ella, `finish` de una feature o fix que iria a la completa integra sin ella y la deja pendiente de lote en `tarea.md`; `taskctl verificar-lote` corre la completa una vez sobre la rama de integracion, anota en verde todas las pendientes y en rojo dice que tareas entraron desde la ultima completa en verde. Sin la clave, todo como antes.
 - TASK-128 (feature) — Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores (2026-11-13)
 - Cambio de comportamiento (TASK-128): `review` y `finish` anotan cada verificacion en el registro de puertas (puertas `review` y `finish`). `taskctl metricas` anade las columnas `review_n`, `review_v`, `finish_n`, `finish_v` y `rondas_men` (rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE) y, debajo de la tabla, la fila de totales de las puertas de verificacion. Las columnas anteriores no cambian.
 - TASK-125 (feature) — Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea (2026-11-13)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index f7b83e3..ec01d48 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -203,6 +203,7 @@ tiempo que no, y era falso.
 | `start` | Abrir la rama de la tarea con el plan aprobado. |
 | `review`, `codex-review`, `veredicto` | Revisión por pares por rondas y su veredicto. |
 | `verificar-menores` | Tras aprobar con correcciones: registra la corrección de los MENORES sin abrir otra ronda (solo los ficheros que cita cada MENOR, o tests) y deja los no corregidos en `revision/menores-pendientes.md`. |
+| `verificar-lote` | Con `verificacion_por_lote`: corre la completa una vez sobre la rama de integración para todas las tareas cerradas pendientes de lote; en rojo dice qué tareas entraron desde la última en verde. |
 | `finish` | Cierre: verificación, merge `--no-ff` o merge request, tag opcional. No integra código posterior al commit revisado sin `verificar-menores` o `--aceptar-sin-revisar` (decisión de una persona). |
 | `siguiente`, `pausa`, `cadena` | Qué fase toca y si preguntar (según `modo_flujo`); pausar el paso a la siguiente fase; bloquear el árbol mientras las fases se encadenan. |
 | `estado`, `board`, `roadmap` | En qué va la fase en curso (también en la status line), tablero y `tareas/ROADMAP.md`. |
@@ -238,6 +239,7 @@ La referencia detallada vive en `docs/`, un fichero por tema:
     - [Comando y presupuesto propios del freno: `comando_verificacion_freno`](docs/configuracion.md#comando-y-presupuesto-propios-del-freno-comando_verificacion_freno)
     - [Coste de implementación automático (hooks `Stop` y `SubagentStop`)](docs/configuracion.md#coste-de-implementación-automático-hooks-stop-y-subagentstop)
     - [Puerta de verificación en `finish`](docs/configuracion.md#puerta-de-verificación-en-finish)
+    - [Verificación completa por lote: `verificacion_por_lote`](docs/configuracion.md#verificación-completa-por-lote-verificacion_por_lote)
     - [Tests held-out (`aceptacion/`)](docs/configuracion.md#tests-held-out-aceptacion)
     - [Cobertura de las líneas cambiadas](docs/configuracion.md#cobertura-de-las-líneas-cambiadas)
     - [Guardián de merges (hook `PreToolUse`)](docs/configuracion.md#guardián-de-merges-hook-pretooluse)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index 1d74d36..715afb4 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -301,6 +301,35 @@ reutiliza un verde guardado, porque la huella no ve los ficheros ignorados.
 - `finish` tarda lo que tarde la suite: si lo lanza un agente, que su
   herramienta de shell no lo corte antes.
 
+#### Verificación completa por lote: `verificacion_por_lote`
+
+Cuando se cierran varias tareas seguidas (modo automático) y la completa tarda
+mucho, el proyecto puede correrla **una vez por lote** en vez de una por tarea:
+
+```yaml
+comando_verificacion: "npm test"
+verificacion_por_lote: true      # en la config de la rama de integración
+```
+
+- Con la clave en la config de la **rama base** (la de la rama de la tarea no
+  cuenta: una tarea no puede activársela para saltarse la completa), `finish`
+  de una feature o fix que iría a la completa **integra sin ella** y anota en
+  `tarea.md`, sección `## Verificacion por lote`, la línea «pendiente de lote»,
+  commiteada en la rama antes del merge.
+- No cambia nada más: una tarea de solo documentación, la selectiva del nivel 2
+  (`rutas_verificacion_parcial`) y los release y hotfix (van a la principal)
+  verifican como siempre. El guardián de merges tampoco cambia.
+- `taskctl verificar-lote [--push]`, desde la rama de integración con el árbol
+  limpio, busca las tareas terminadas pendientes de lote y, si hay alguna, corre
+  la completa **una vez** sobre `HEAD`:
+  - **verde**: añade a cada una «lote en verde en `<commit>`» y lo commitea;
+  - **rojo**: no anota nada y aborta diciendo qué tareas entraron desde la
+    última completa en verde (las sospechosas) con la salida de la
+    verificación. Revertir un merge o abrir una tarea de arreglo lo decide una
+    persona.
+- Cada lote deja una línea en el registro de puertas (puerta `finish`, modo
+  `lote`).
+
 #### Tests held-out (`aceptacion/`)
 
 Tests de aceptación que escribe la **persona** a partir de los criterios y que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 14cac33..866b6e7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -20,6 +20,7 @@ import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex
 import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto.js';
 import { PendientesError } from './fs/pendientes.js';
 import { runVerificarMenoresCommand, VerificarMenoresCommandError } from './commands/verificar-menores.js';
+import { runVerificarLoteCommand, VerificarLoteCommandError } from './commands/verificar-lote.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
 import { runTrocearCommand, TrocearCommandError } from './commands/trocear.js';
@@ -93,6 +94,7 @@ Uso:
   taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados>
                     [--informe <nombre>] [--push]
   taskctl verificar-menores TASK-NNN [--motivo "<texto>"] [--push]
+  taskctl verificar-lote [--push]
   taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--aceptar-sin-revisar] [--push]
   taskctl siguiente TASK-NNN [--json]
   taskctl estado [--seguir] [--stdin]
@@ -109,7 +111,7 @@ Uso:
   taskctl abort-merge
 
 Comandos: new, import, board, roadmap, metricas, start, plan, approve, trocear, review, codex-review, veredicto,
-verificar-menores, finish, siguiente, estado, doctor, doctor-deploy, pausa, registrar-coste, cadena.
+verificar-menores, verificar-lote, finish, siguiente, estado, doctor, doctor-deploy, pausa, registrar-coste, cadena.
 estado dice en que va la tarea en curso (fase dentro del ciclo, paso dentro de la fase, x/N si el
 comando de verificacion lo escribe, minutos), leyendo solo el progreso que dejan plan, approve, start,
 review, finish y el freno de fin de turno bajo .git/: sin lanzar git. Sin nada en marcha lo dice; fuera
@@ -1047,6 +1049,36 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'verificar-lote') {
+    const repoCwd = process.cwd();
+    const tareasRoot = path.join(repoCwd, 'tareas');
+    try {
+      const r = await runVerificarLoteCommand(tareasRoot, argv.slice(1), { repoCwd });
+      if (r.commitVerificado === null) {
+        process.stdout.write('Sin tareas pendientes de lote: no se ha ejecutado la verificacion completa.\n');
+        return 0;
+      }
+      process.stdout.write(
+        `Lote en verde en ${r.commitVerificado.slice(0, 7)} (${String(Math.round((r.duracionMs ?? 0) / 1000))} s): ` +
+          `${String(r.pendientes.length)} tarea(s) anotadas: ${r.pendientes.join(', ')}.\n`
+      );
+      if (r.autoCommit !== null) printAutoCommit(r.autoCommit);
+      return 0;
+    } catch (e) {
+      if (
+        e instanceof VerificarLoteCommandError ||
+        e instanceof AutoCommitError ||
+        e instanceof ConfigError ||
+        e instanceof GitLaunchError ||
+        e instanceof GitCommandError
+      ) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'veredicto') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 6a70dda..4f8ddb0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -49,6 +49,7 @@ import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
 import {
   anotarCompletaTrasParcial,
+  anotarPendienteLote,
   anotarVerificacionDocumentacion,
   anotarVerificacionOmitida,
   anotarVerificacionParcial,
@@ -60,6 +61,7 @@ import { autoCommit, mensajeChore } from '../fs/git-commit.js';
 import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
 import { ejecutarVerificacion, guardarMemo, huellaDelArbol, verificarConMemo } from '../fs/verificacion.js';
 import { PUERTA_FINISH } from '../core/registro-puertas.js';
+import { configDeRef } from '../fs/config-de-ref.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
 import { FinishCommandError } from './finish-opciones.js';
 
@@ -130,6 +132,19 @@ function anotarFinish(
   });
 }
 
+/**
+ * TASK-115: `verificacion_por_lote` de la config de la RAMA BASE (la rama de
+ * la tarea no puede activarsela). Una config de la base invalida no exime de
+ * nada: false, y la completa.
+ */
+function porLoteEnBase(o: PuertaVerificacionOpts, ramaBase: string): boolean {
+  try {
+    return configDeRef(ramaBase, o.cwd).verificacion_por_lote;
+  } catch {
+    return false;
+  }
+}
+
 function opcionesEjecucion(o: PuertaVerificacionOpts): { timeoutMs?: number; env?: NodeJS.ProcessEnv } {
   return {
     ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
@@ -217,6 +232,18 @@ export async function puertaVerificacion(
   if (docs !== null && docs.decision.tipo === 'selectiva' && o.permitirSelectiva === true) {
     return puertaSelectiva(o, comando, docs.decision, docs.timeoutSelectivaS, o.ramaBase as string);
   }
+  // TASK-115: con verificacion_por_lote en la base, una feature o fix (no release ni hotfix: van a la
+  // principal) que iria a la completa integra sin ella y queda pendiente de `taskctl verificar-lote`.
+  if (o.ramaBase !== undefined && o.permitirSelectiva === true && porLoteEnBase(o, o.ramaBase)) {
+    const body = anotarPendienteLote(o.initial.body, o.instante, comando);
+    const { commit, tarea } = await anotarYCommitear(o, body, 'cierre pendiente de lote', 'anotar el lote');
+    o.onAviso?.(
+      `${o.id}: verificacion_por_lote: no se ejecuta "${comando}" ahora; la tarea queda pendiente de lote ` +
+        `(seccion "Verificacion por lote")${commit === null ? '' : `, commit ${commit}`}. Corre ` +
+        `"taskctl verificar-lote" en "${o.ramaBase}" para verificar el lote.`
+    );
+    return { resultado: { tipo: 'omitida', commit }, tarea };
+  }
   const motivoCompleta = docs === null ? null : motivoCompletaEnFinish(docs.decision);
   if (motivoCompleta !== null) {
     o.onAviso?.(`${o.id}: se ejecuta la verificacion completa: ${motivoCompleta}.`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
new file mode 100644
index 0000000..fcdb834
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
@@ -0,0 +1,163 @@
+/**
+ * `taskctl verificar-lote [--push]` — TASK-115 (P-7 de la auditoria del
+ * 2026-11-12): la verificacion completa por lote.
+ *
+ * Con `verificacion_por_lote: true` en la rama base, `finish` de una feature o
+ * fix con codigo integra sin la completa y deja en `tarea.md` una linea
+ * «pendiente de lote» bajo `## Verificacion por lote`. Este comando, desde la
+ * rama de integracion con el arbol limpio:
+ * - busca las tareas terminadas cuya ultima linea de esa seccion esta
+ *   pendiente (las que entraron desde la ultima completa en verde);
+ * - sin pendientes, lo dice y no ejecuta nada;
+ * - ejecuta `comando_verificacion` sobre HEAD una sola vez (guarda el memo de
+ *   la completa, como finish, y anota la puerta `finish` con modo `lote`);
+ * - en verde, anade a cada pendiente «lote en verde en <commit>» y lo commitea;
+ * - en rojo, no anota nada y aborta listando esas tareas: son las sospechosas.
+ *   La vuelta atras (revertir un merge, abrir un fix) la decide una persona.
+ */
+import { readdir, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { resolverConfig } from '../core/config.js';
+import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
+import { PUERTA_FINISH } from '../core/registro-puertas.js';
+import { serializeTareaFile } from '../core/tarea-file.js';
+import { isValidTaskId, STATE_FOLDER } from '../core/task.js';
+import { anotarLineaEnSeccion, pendienteDeLote, SECCION_VERIFICACION_LOTE } from '../core/transiciones.js';
+import { currentBranch, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
+import { autoCommit, type AutoCommitResult } from '../fs/git-commit.js';
+import { anotarPuerta } from '../fs/registro-puertas.js';
+import { readTareaFile, type ReadTareaResult } from '../fs/task-store.js';
+import { ejecutarVerificacion, guardarMemo, huellaDelArbol } from '../fs/verificacion.js';
+import { spawnSync } from 'node:child_process';
+
+export class VerificarLoteCommandError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'VerificarLoteCommandError';
+  }
+}
+
+export interface VerificarLoteDeps {
+  repoCwd: string;
+  /** Instante de las anotaciones (ISO); por defecto, ahora. */
+  ahora?: string;
+  /** Solo para tests: sustituye al timeout de la verificacion (en ms). */
+  timeoutMs?: number;
+}
+
+export interface VerificarLoteResult {
+  /** Tareas pendientes de lote encontradas (en orden de cierre). */
+  pendientes: string[];
+  /** null si no habia pendientes y no se ejecuto nada. */
+  commitVerificado: string | null;
+  duracionMs: number | null;
+  autoCommit: AutoCommitResult | null;
+}
+
+function headDe(cwd: string): string {
+  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', windowsHide: true });
+  return (r.stdout ?? '').trim();
+}
+
+/** Las tareas terminadas pendientes de lote, en orden de su ultima anotacion. */
+async function pendientesDeLote(tareasRoot: string): Promise<ReadTareaResult[]> {
+  let entradas: string[];
+  try {
+    entradas = await readdir(path.join(tareasRoot, STATE_FOLDER.terminada));
+  } catch {
+    return [];
+  }
+  const pendientes: ReadTareaResult[] = [];
+  for (const id of entradas.filter((e) => isValidTaskId(e)).sort()) {
+    const t = await readTareaFile(tareasRoot, id);
+    if (t !== null && pendienteDeLote(t.body)) pendientes.push(t);
+  }
+  return pendientes;
+}
+
+export async function runVerificarLoteCommand(
+  tareasRoot: string,
+  argv: readonly string[],
+  deps: VerificarLoteDeps
+): Promise<VerificarLoteResult> {
+  rechazarFlagsDesconocidos(argv, ['--push'], 'taskctl verificar-lote', (m) => new VerificarLoteCommandError(m));
+  const push = argv.includes('--push');
+  const cwd = deps.repoCwd;
+  const config = resolverConfig(cwd);
+  const comando = config.comando_verificacion;
+  if (comando === null) {
+    throw new VerificarLoteCommandError(
+      '[ERROR] taskctl verificar-lote: el proyecto no declara comando_verificacion, asi que no hay completa que ' +
+        'correr por lote.'
+    );
+  }
+  const integracion = resolveIntegrationBranch(cwd);
+  const rama = currentBranch(cwd);
+  if (rama !== integracion) {
+    throw new VerificarLoteCommandError(
+      `[ERROR] taskctl verificar-lote: el lote se verifica sobre la rama de integracion "${integracion}", y la ` +
+        `rama activa es "${rama === '' ? 'HEAD desacoplado' : rama}". Cambiate (git checkout ${integracion}) y reintenta.`
+    );
+  }
+  if (!isWorkspaceClean(cwd)) {
+    throw new VerificarLoteCommandError(
+      '[ERROR] taskctl verificar-lote: el arbol de trabajo tiene cambios sin commitear: el lote se verifica sobre ' +
+        'lo integrado, no sobre lo que hay a medias. Commitealos o apartalos y reintenta.'
+    );
+  }
+
+  const pendientes = await pendientesDeLote(tareasRoot);
+  if (pendientes.length === 0) {
+    return { pendientes: [], commitVerificado: null, duracionMs: null, autoCommit: null };
+  }
+  const ids = pendientes.map((t) => t.task.id);
+  const commit = headDe(cwd);
+  const timeoutS = config.timeout_verificacion;
+  const inicio = Date.now();
+  const r = ejecutarVerificacion(cwd, comando, timeoutS, deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs });
+  anotarPuerta(cwd, {
+    puerta: PUERTA_FINISH,
+    tarea: '-',
+    instante: new Date().toISOString(),
+    modo: 'lote',
+    duracionS: (Date.now() - inicio) / 1000,
+    resultado: r.estado === 'verde' ? 'verde' : 'rojo',
+  });
+  // Como finish: el memo de la completa solo con el arbol limpio (la huella del commit).
+  const limpio = isWorkspaceClean(cwd);
+  const huella = limpio ? huellaDelArbol(cwd, comando, timeoutS) : null;
+  if (huella !== null) guardarMemo(cwd, huella, r);
+  if (r.estado !== 'verde') {
+    throw new VerificarLoteCommandError(
+      `[ERROR] taskctl verificar-lote: la verificacion completa del lote no sale en verde en "${integracion}" ` +
+        `(${commit.slice(0, 7)}). No se ha anotado nada: las tareas siguen pendientes de lote.\n` +
+        `Entraron desde la ultima completa en verde (${String(ids.length)}): ${ids.join(', ')}.\n` +
+        `${formatearVerificacionRoja(r)}\n` +
+        'Busca la causa en esas tareas; revertir un merge o abrir una tarea de arreglo lo decide una persona.'
+    );
+  }
+  if (!limpio) {
+    throw new VerificarLoteCommandError(
+      `[ERROR] taskctl verificar-lote: la verificacion salio en verde, pero ha dejado cambios en el arbol ("${comando}" ` +
+        'escribe ficheros versionados o no ignorados: mira git status). No se ha anotado nada.'
+    );
+  }
+
+  const instante = deps.ahora ?? new Date().toISOString();
+  for (const t of pendientes) {
+    const body = anotarLineaEnSeccion(
+      t.body,
+      SECCION_VERIFICACION_LOTE,
+      `- ${instante}: lote en verde en ${commit.slice(0, 7)} (taskctl verificar-lote)`
+    );
+    await writeFile(t.filePath, serializeTareaFile(t.task, body), 'utf8');
+  }
+  const commitResult = autoCommit({
+    cwd,
+    rutas: pendientes.map((t) => t.filePath),
+    mensaje: `chore(lote): verificacion completa en verde para ${ids.join(', ')}`,
+    push,
+  });
+  return { pendientes: ids, commitVerificado: commit, duracionMs: r.duracionMs, autoCommit: commitResult };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 75c0a3b..cd4ac0b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -31,6 +31,7 @@
  * | tope_rondas                  | 2                 | core/flujo.ts (siguiente), commands/review.ts (TASK-127) |
  * | comando_verificacion_freno   | null (el freno usa la de siempre) | hooks/freno-stop.ts, commands/doctor.ts (TASK-125) |
  * | presupuesto_freno_s          | null (180 con comando_verificacion_freno) | hooks/freno-stop.ts (TASK-125) |
+ * | verificacion_por_lote        | false             | commands/finish-verificacion.ts (de la base), verificar-lote.ts (TASK-115) |
  * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096); la decision la aplican fs/decision-documentacion.ts, finish-verificacion.ts, freno-stop.ts, review.ts y guardia-merge.ts (TASK-105..108); doctor.ts avisa (TASK-109) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
@@ -278,6 +279,13 @@ export interface TaskcodeConfig {
    * `presupuestoFreno`). No mas que `TECHO_HOOK_STOP_S`.
    */
   presupuesto_freno_s: number | null;
+  /**
+   * TASK-115: `finish` de una feature o fix con codigo integra sin la
+   * completa y deja la verificacion pendiente de lote; `taskctl
+   * verificar-lote` la corre despues sobre la rama de integracion. Se lee de
+   * la config de la RAMA BASE. Exige `comando_verificacion`.
+   */
+  verificacion_por_lote: boolean;
 }
 
 /**
@@ -346,6 +354,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   tope_rondas: 2,
   comando_verificacion_freno: null,
   presupuesto_freno_s: null,
+  verificacion_por_lote: false,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -377,6 +386,7 @@ export const CLAVES_CONFIG = [
   'tope_rondas',
   'comando_verificacion_freno',
   'presupuesto_freno_s',
+  'verificacion_por_lote',
 ] as const;
 
 /**
@@ -689,6 +699,16 @@ export function parsearConfigConAvisos(
       case 'presupuesto_freno_s':
         config.presupuesto_freno_s = validarPresupuestoFreno(donde, par.valor);
         break;
+      case 'verificacion_por_lote':
+        if (typeof par.valor !== 'boolean') {
+          throw new ConfigError(
+            `[ERROR] ${donde}: "verificacion_por_lote" debe ser true o false, y es ${describirValor(par.valor)}.\n` +
+              '        Con true, finish de una feature o fix con codigo integra sin la completa y la deja ' +
+              'pendiente de "taskctl verificar-lote".'
+          );
+        }
+        config.verificacion_por_lote = par.valor;
+        break;
       case 'umbral_cobertura':
         config.umbral_cobertura = validarUmbralCobertura(donde, par.valor);
         break;
@@ -831,6 +851,14 @@ function validarVerificacionCompleta(ruta: string, vistas: ReadonlySet<string>):
         'completa (por ejemplo comando_verificacion: "npm test"), o borra la selectiva.'
     );
   }
+  // TASK-115: sin completa no hay nada que dejar pendiente de lote.
+  if (vistas.has('verificacion_por_lote') && !vistas.has('comando_verificacion')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "verificacion_por_lote" necesita tambien "comando_verificacion".\n` +
+        '        El lote corre la completa sobre la rama de integracion. Declarala (por ejemplo ' +
+        'comando_verificacion: "npm test"), o borra la clave.'
+    );
+  }
   // TASK-125: el comando rapido del freno no sustituye a la puerta de finish.
   if (vistas.has('comando_verificacion_freno') && !vistas.has('comando_verificacion')) {
     throw new ConfigError(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index bdb387a..2b0fd30 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -350,6 +350,31 @@ export function anotarVerificacionOmitida(body: string, instante: string, comand
   return anotarLineaEnSeccion(body, SECCION_VERIFICACION_OMITIDA, linea);
 }
 
+/** TASK-115: seccion de la verificacion por lote (pendiente en finish, resuelta por verificar-lote). */
+export const SECCION_VERIFICACION_LOTE = '## Verificacion por lote';
+/** TASK-115: lo que marca una linea pendiente de lote (la ultima de la seccion manda). */
+export const MARCA_PENDIENTE_LOTE = 'pendiente de lote';
+
+/** TASK-115: anota en finish que la completa queda pendiente de lote. */
+export function anotarPendienteLote(body: string, instante: string, comando: string): string {
+  const linea = `- ${instante}: ${MARCA_PENDIENTE_LOTE}; no se ejecuta \`${comando.replace(/`/g, "'")}\` (verificacion_por_lote)`;
+  return anotarLineaEnSeccion(body, SECCION_VERIFICACION_LOTE, linea);
+}
+
+/** TASK-115: true si la ultima linea de `## Verificacion por lote` esta pendiente. */
+export function pendienteDeLote(body: string): boolean {
+  const lineas = body.replace(/\r/g, '').split('\n');
+  const i = lineas.findIndex((l) => l.trim() === SECCION_VERIFICACION_LOTE);
+  if (i === -1) return false;
+  let ultima = '';
+  for (let j = i + 1; j < lineas.length; j++) {
+    const l = (lineas[j] as string).trim();
+    if (l.startsWith('## ')) break;
+    if (l.startsWith('- ')) ultima = l;
+  }
+  return ultima.includes(MARCA_PENDIENTE_LOTE);
+}
+
 /** TASK-100: seccion que deja `finish` cuando la tarea es solo documentacion y no corre la completa. */
 export const SECCION_VERIFICACION_DOCUMENTACION = '## Verificacion de documentacion';
````

## Excluido del diff (14 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-115/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-115/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-115/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-115/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-115/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-115/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-115/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-115/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-115/tarea.md                                                       |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  31 ++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        |  26 +++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-lote.js                             | 125 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         |  17 ++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                   |  25 +++++++++++++++++
 14 files changed, 224 insertions(+), 3 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts | 190 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 190 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 238.2 s
- Commit verificado: 1bd21284d4e6662a1aee15eaf266b27dee0fb24a
- Huella: 4d4f9e84011be07b0f02798d7b0726c204b733b5
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 102488 bytes en total):

````
✔ rama_base: cambia la rama que resolveBaseBranchForTipo devuelve para feature/fix/release (3504.206ms)
✔ rama_base: NO afecta a hotfix, que sigue colgando de la rama principal detectada (3566.0565ms)
✔ rama_base: taskctl new CAMBIA de verdad a la rama configurada, no solo la calcula (5350.3572ms)
✔ agente_revisor_por_defecto: taskctl new lo escribe en el tarea.md (5073.5182ms)
✔ agente_revisor_por_defecto: --agente-revisor sigue mandando sobre el config (6368.5915ms)
✔ agente_revisor_por_defecto: taskctl import usa el MISMO valor que new (la duplicacion desaparecio) (7299.4813ms)
✔ limite_wip: con limite 3, dos tareas abiertas ya no bloquean; con 1, si (28.6043ms)
✔ limite_wip: el mensaje de error dice el limite real, no "una sola tarea" (0.697ms)
✔ invalido: limite_wip: dos (texto) aborta y dice que espera un entero (1.2396ms)
✔ invalido: limite_wip: 0 y limite_wip: -1 abortan (0 no significa "sin limite") (0.4514ms)
✔ invalido: limite_wip decimal o booleano tambien abortan (0.3378ms)
✔ invalido: rama_base vacia, en comillas o sin valor, aborta (0.6434ms)
✔ invalido: agente_revisor_por_defecto vacio aborta igual que rama_base (0.5821ms)
✔ clave desconocida: avisa (no aborta), sugiere la parecida, enumera las validas y se ignora (3.8129ms)
✔ una clave descartada por la decision #9 sigue siendo desconocida: avisa (TASK-061, antes abortaba) (6.2038ms)
✔ invalido: la misma clave dos veces aborta en vez de que gane la ultima en silencio (0.4763ms)
✔ invalido: linea sin ":" aborta hablando de CONFIG, no de frontmatter (0.355ms)
✔ el mensaje de error nombra el fichero y la linea (0.3198ms)
✔ fallo cerrado real: resolveBaseBranchForTipo NO cae a "develop" con un config roto (2653.5249ms)
✔ fallo cerrado real: taskctl new aborta con un config roto y NO crea la tarea (2874.2433ms)
✔ fallo cerrado real: taskctl import aborta con un config roto (2228.4933ms)
✔ sintaxis: comentario inline tras el valor se descarta (0.6578ms)
✔ sintaxis: valores entrecomillados y con espacios de sobra se recortan (0.3217ms)
✔ sintaxis: CRLF no rompe el parseo (0.3253ms)
✔ el parser compartido NO cambio el comportamiento del frontmatter (0.5887ms)
✔ ubicacion: se busca en la RAIZ del repo, tambien ejecutando desde un subdirectorio (3061.0685ms)
✔ ubicacion: la busqueda PARA en la raiz del repo (un config de mas arriba no manda) (496.1867ms)
✔ resolverConfig: un .taskcode que es un FICHERO aborta (no cae al default en silencio) (1756.9528ms)
✔ parsearConfig: modo_flujo acepta los tres valores (0.5845ms)
✔ parsearConfig: modo_flujo invalido aborta listando los tres validos y sugiriendo el parecido (0.6751ms)
✔ parsearConfig: modo_flujo repetido aborta (0.2702ms)
ℹ tests 919
ℹ suites 0
ℹ pass 919
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 222103.1141
[verificar-impacto] node --test termino con 0 en 222.3 s.
````
