# Peticion de revision — TASK-144a (ronda 1)

- Tarea: TASK-144a — cadena, Commit revisado y tarea en su rama (parte a de TASK-144)
- Rama revisada: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
- Rama base: develop
- Commit revisado (HEAD): b3ea93abc38ebb35db629549945080aa82896213
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-144a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-144a/tarea.md
- tareas/03-en-revision/TASK-144a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente-sincronizacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts

## Commits a revisar (git log develop..HEAD)

````
b3ea93a docs(TASK-144a): autorrevision
beef301 fix(TASK-144a): cadena derivada, Commit revisado y tarea en su rama en un solo sitio
20833d5 chore(TASK-144a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
index 6d9a407..873c302 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/cadena.ts
@@ -190,6 +190,12 @@ export const GUARDADOS_POR_CADENA: ReadonlySet<string> = new Set([
   'finish',
   'pausa',
   'registrar-coste',
+  // TASK-144a (CMD1-01): tambien escriben (autoCommit) o cambian de rama;
+  // el test de cadena deriva la lista del codigo y falla si falta alguno.
+  'trocear',
+  'verificar-menores',
+  'verificar-lote',
+  'doctor-deploy',
   'pause',
   'resume',
   'recover',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
index 2da80d0..1a020c3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
@@ -15,7 +15,7 @@ import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import { resolverConfig } from '../core/config.js';
 import { registrarTransicion } from '../core/transiciones.js';
-import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
+import { mensajeTareaEnOtraRama, runGit, tareaEnOtraRama } from '../fs/git.js';
 import {
   autoCommit,
   extraerPushFlag,
@@ -66,15 +66,8 @@ export async function runPausaCommand(
   if (task.estado === 'terminada') {
     throw new PausaCommandError(`[ERROR] ${id}: ya esta terminada; no hay fase que pausar.`);
   }
-  if (
-    currentBranch(deps.repoCwd) !== task.rama &&
-    localBranchExists(task.rama, deps.repoCwd) &&
-    !isAncestor(task.rama, 'HEAD', deps.repoCwd)
-  ) {
-    throw new PausaCommandError(
-      `[ERROR] ${id}: la copia al dia de la tarea esta en su rama, "${task.rama}". ` +
-        `Cambia a ella (git checkout ${task.rama}) y reintenta; no se ha tocado nada.`
-    );
+  if (tareaEnOtraRama(task.rama, deps.repoCwd)) {
+    throw new PausaCommandError(mensajeTareaEnOtraRama(id, task.rama));
   }
 
   // MEN-5 de la revision: el commit de la pausa es de la carpeta de la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index d9d250f..46c52c5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -66,7 +66,7 @@ import {
 } from '../core/coste-registro.js';
 import { formatearInstante } from '../core/transiciones.js';
 import { buscarTranscripciones, directorioConfigClaude, leerTranscripcion } from '../fs/transcripciones.js';
-import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
+import { mensajeTareaEnOtraRama, runGit, tareaEnOtraRama } from '../fs/git.js';
 import {
   autoCommit,
   extraerPushFlag,
@@ -458,15 +458,8 @@ export async function runRegistrarCosteCommand(
     );
   }
   const { task, body, filePath } = leida;
-  if (
-    currentBranch(deps.repoCwd) !== task.rama &&
-    localBranchExists(task.rama, deps.repoCwd) &&
-    !isAncestor(task.rama, 'HEAD', deps.repoCwd)
-  ) {
-    throw new RegistrarCosteCommandError(
-      `[ERROR] ${id}: la copia al dia de la tarea esta en su rama, "${task.rama}". ` +
-        `Cambia a ella (git checkout ${task.rama}) y reintenta; no se ha tocado nada.`
-    );
+  if (tareaEnOtraRama(task.rama, deps.repoCwd)) {
+    throw new RegistrarCosteCommandError(mensajeTareaEnOtraRama(id, task.rama));
   }
   // TASK-119: solo una tarea terminada se commitea aqui (no tiene fase
   // siguiente que lo absorba). Ese commit es de este fichero entero: con
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index f89f2e9..011c59a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -52,7 +52,7 @@ import { configDeRef } from '../fs/config-de-ref.js';
 import { rondaExtraDecidida } from '../core/rondas-extra.js';
 import {
   alcanceRondaSiguiente,
-  commitRevisadoDe,
+  commitRevisadoDeRonda,
   hallazgosNoCerrados,
   hallazgosPendientes,
   plantillaRegla4D,
@@ -475,13 +475,10 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
     informes.nombres.map(async (n) => ({ nombre: n, texto: await readFile(path.join(revisionDir, n), 'utf8') }))
   );
   const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
-  let commit: string | null = null;
-  let fueAcotada = false;
-  for (const n of peticiones.nombres) {
-    const texto = await readFile(path.join(revisionDir, n), 'utf8');
-    if (ALCANCE_ACOTADA_RE.test(texto)) fueAcotada = true;
-    commit ??= commitRevisadoDe(texto);
-  }
+  const textosPeticion = await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8')));
+  const fueAcotada = textosPeticion.some((t) => ALCANCE_ACOTADA_RE.test(t));
+  // TASK-144a (CMD2-04): la misma regla que siguiente, verificar-menores y finish.
+  const commit = commitRevisadoDeRonda({ ronda: peticiones.ronda, textos: textosPeticion }, informes.ronda);
 
   // TASK-095: pendiente = todo lo que no esta `aceptado` (tambien lo
   // `corregido`, que es justo lo que hay que verificar), agrupado por el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index 4c76a8d..dd0c394 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -22,7 +22,7 @@ import { resolverConfig, type CierrePorDefecto, type ModoFlujo } from '../core/c
 import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
 import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
 import {
-  commitRevisadoDe,
+  commitRevisadoDeRonda,
   informeRellenado,
   veredictoDeRonda,
   type VeredictoInforme,
@@ -37,17 +37,17 @@ import {
 import {
   currentBranch,
   isAncestor,
-  localBranchExists,
   lsTreeNames,
   mergeBase,
   resolveBaseBranchForTipo,
   runGit,
   showFileAtRef,
+  tareaEnOtraRama,
 } from '../fs/git.js';
 import { excluirDeRevision, revisoresDelRango } from '../fs/revisores-rango.js';
 import type { Task } from '../core/task.js';
 import { REVISION_DIRNAME } from './review.js';
-import { estadoCorreccionPosterior, type EstadoCorreccion } from './verificar-menores.js';
+import { codigoCambiado, estadoCorreccionPosterior, type EstadoCorreccion } from './verificar-menores.js';
 import { bloqueantesAbiertos, fueraDeAlcance, menoresAbiertos } from '../core/menores.js';
 import { duracionDelPlan, planRedactado } from './approve.js';
 import type { LecturaDuracion } from '../core/duracion-estimada.js';
@@ -97,24 +97,15 @@ export interface SiguienteCommandResult extends SiguientePaso {
  * que `veredicto` no commitea es lo normal, y lo absorbe el commit de
  * `finish`. Lo que se integra sigue siendo el codigo que vio el revisor.
  * Que el informe no sea la plantilla lo comprueba `informeRellenado`.
+ * TASK-144a (CMD2-01): «codigo cambiado» es el de `codigoCambiado`, el mismo
+ * que usan verificar-menores y finish: sin `tareas/`, sin lo que regenera
+ * `comando_sincronizacion` y sin lo excluido de la revision. Antes aqui solo
+ * se excluia `tareas/`, y con sincronizacion `siguiente` preguntaba aunque no
+ * hubiera cambiado nada revisado.
  */
-function informeEnCommitPropio(
-  ref: string,
-  nombres: readonly string[],
-  revisados: readonly (string | null)[],
-  cwd: string
-): boolean {
-  if (nombres.length === 0 || revisados.length === 0) return false;
-  const tareasDesdeLaRaiz = `${runGit(['rev-parse', '--show-prefix'], cwd)}tareas/`;
-  for (const revisado of revisados) {
-    if (revisado === null || !isAncestor(revisado, ref, cwd)) return false;
-    const cambios = runGit(
-      ['diff', '--name-only', revisado, ref, '--', ':(top)', `:(top,exclude)${tareasDesdeLaRaiz}`],
-      cwd
-    );
-    if (cambios !== '') return false;
-  }
-  return true;
+function informeEnCommitPropio(ref: string, nombres: readonly string[], revisado: string | null, cwd: string): boolean {
+  if (nombres.length === 0 || revisado === null || !isAncestor(revisado, ref, cwd)) return false;
+  return codigoCambiado(revisado, ref, cwd).length === 0;
 }
 
 /** Veredicto de una ronda a partir de sus informes; null si no hay ninguno. */
@@ -147,10 +138,7 @@ export async function runSiguienteCommand(
   }
 
   const rama = local.task.rama;
-  const enOtraRama =
-    currentBranch(deps.repoCwd) !== rama &&
-    localBranchExists(rama, deps.repoCwd) &&
-    !isAncestor(rama, 'HEAD', deps.repoCwd);
+  const enOtraRama = tareaEnOtraRama(rama, deps.repoCwd);
 
   let task: Task;
   let body: string;
@@ -166,7 +154,7 @@ export async function runSiguienteCommand(
   let rondaRevision: number;
   let nombresPrimarios: string[];
   let refInformes: string;
-  let revisados: (string | null)[];
+  let revisado: string | null;
   if (enOtraRama) {
     const enRama = lsTreeNames(rama, 'tareas', deps.repoCwd);
     const rutaTarea = enRama.find((n) => n.endsWith(`/${id}/tarea.md`));
@@ -187,7 +175,8 @@ export async function runSiguienteCommand(
     nombresPrimarios = ultima.nombres;
     refInformes = rama;
     primarios = ultima.nombres.map(leer);
-    revisados = nombresDeUltimaRonda(nombres, PETICION_REVISION_RE).nombres.map((n) => commitRevisadoDe(leer(n)));
+    const peticiones = nombresDeUltimaRonda(nombres, PETICION_REVISION_RE);
+    revisado = commitRevisadoDeRonda({ ronda: peticiones.ronda, textos: peticiones.nombres.map(leer) }, rondaRevision);
     codex = nombresDeUltimaRonda(nombres, INFORME_CODEX_RE).nombres.map(leer);
   } else {
     ({ task, body } = local);
@@ -199,9 +188,11 @@ export async function runSiguienteCommand(
     nombresPrimarios = ultima.nombres;
     refInformes = 'HEAD';
     primarios = await Promise.all(ultima.nombres.map(leer));
-    revisados = (
-      await Promise.all((await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE)).nombres.map(leer))
-    ).map((t) => commitRevisadoDe(t));
+    const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
+    revisado = commitRevisadoDeRonda(
+      { ronda: peticiones.ronda, textos: await Promise.all(peticiones.nombres.map(leer)) },
+      rondaRevision
+    );
     codex = await Promise.all(
       (await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE)).nombres.map(leer)
     );
@@ -217,7 +208,6 @@ export async function runSiguienteCommand(
   // TASK-099: con la ronda aprobada, que paso despues del Commit revisado.
   let correccion: EstadoCorreccion | null = null;
   if (task.estado === 'en-revision' && veredicto === 'aprobada') {
-    const revisado = revisados.find((c) => c !== null) ?? null;
     try {
       correccion = estadoCorreccionPosterior(body, rondaRevision, revisado, refInformes, deps.repoCwd);
     } catch {
@@ -227,12 +217,11 @@ export async function runSiguienteCommand(
   const alDia = correccion?.alDia === true;
   // Con una verificacion ligera al dia, lo que se cierra se compara con lo
   // verificado (que ya cubre lo revisado), no con el Commit revisado.
-  const referencias =
-    alDia && correccion?.verificacion != null ? [correccion.verificacion.commitVerificado] : revisados;
+  const referencia = alDia && correccion?.verificacion != null ? correccion.verificacion.commitVerificado : revisado;
   const enCommitPropio =
     task.estado === 'en-revision' &&
     rellenados &&
-    informeEnCommitPropio(refInformes, nombresPrimarios, referencias, deps.repoCwd);
+    informeEnCommitPropio(refInformes, nombresPrimarios, referencia, deps.repoCwd);
 
   const menores = menoresAbiertos(primarios);
   const ctx: ContextoFlujo = {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
index 9faeadd..0121ad5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
@@ -24,7 +24,7 @@ import { readFile, writeFile } from 'node:fs/promises';
 import path from 'node:path';
 import { rechazarFlagsDesconocidos } from '../cli/args.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
-import { commitRevisadoDe, informeRellenado, veredictoDeRonda } from '../core/informe-revision.js';
+import { commitRevisadoDeRonda, informeRellenado, veredictoDeRonda } from '../core/informe-revision.js';
 import {
   MENORES_PENDIENTES,
   SECCION_VERIFICACION_LIGERA,
@@ -218,14 +218,10 @@ export async function runVerificarMenoresCommand(
   }
 
   const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
-  const revisado =
-    peticiones.ronda !== ronda
-      ? null
-      : (
-          await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8')))
-        )
-          .map(commitRevisadoDe)
-          .find((c) => c !== null) ?? null;
+  const revisado = commitRevisadoDeRonda(
+    { ronda: peticiones.ronda, textos: await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8'))) },
+    ronda
+  );
   if (revisado === null) {
     throw error(
       `la peticion de la ronda ${String(ronda)} no dice que commit se reviso ("- Commit revisado"): ` +
@@ -316,11 +312,11 @@ export async function codigoSinVerificar(
   const revisionDir = path.join(taskDir, REVISION_DIRNAME);
   const informes = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
   const peticiones = await informesDeUltimaRonda(revisionDir, PETICION_REVISION_RE);
-  if (informes.nombres.length === 0 || peticiones.ronda !== informes.ronda) return null;
-  const revisado =
-    (await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8'))))
-      .map(commitRevisadoDe)
-      .find((c) => c !== null) ?? null;
+  if (informes.nombres.length === 0) return null;
+  const revisado = commitRevisadoDeRonda(
+    { ronda: peticiones.ronda, textos: await Promise.all(peticiones.nombres.map((n) => readFile(path.join(revisionDir, n), 'utf8'))) },
+    informes.ronda
+  );
   if (revisado === null) return null;
   // Con referencia pero sin poder comparar (SHA que Git no conoce, o rama
   // reescrita despues de revisar) no se deja pasar: fail-closed.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
index 0b3c981..7579828 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts
@@ -98,6 +98,21 @@ export function commitRevisadoDe(peticion: string): string | null {
   return m === null ? null : (m[1] as string);
 }
 
+/**
+ * TASK-144a (CMD2-04 de la auditoria 4D): «el Commit revisado de la ultima
+ * ronda», una sola regla para siguiente, verificar-menores, finish y review.
+ * Las peticiones tienen que ser de la MISMA ronda que los informes: si no,
+ * null (antes unos comandos lo exigian y otros tomaban el commit de otra
+ * ronda). Con varias peticiones (ronda fragmentada), el primero que haya.
+ */
+export function commitRevisadoDeRonda(
+  peticiones: { ronda: number; textos: readonly string[] },
+  rondaInformes: number
+): string | null {
+  if (peticiones.ronda !== rondaInformes) return null;
+  return peticiones.textos.map(commitRevisadoDe).find((c) => c !== null) ?? null;
+}
+
 /**
  * ¿Lo escribio un revisor? (IMP-1 y MEN-6 de la revision de TASK-059): una
  * linea `- Revisor:` rellenada (no la de la plantilla) y sin la fila de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index a285872..3564d17 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -783,6 +783,24 @@ export function localBranchExists(name: string, cwd: string): boolean {
   return result.status === 0;
 }
 
+/**
+ * TASK-144a (CMD2-03 de la auditoria 4D): «la copia al dia de la tarea vive
+ * en su rama». Una sola regla para siguiente (que la lee de ahi) y para pausa
+ * y registrar-coste (que no escriben en la copia vieja): no estamos en esa
+ * rama, existe en local y no esta integrada en HEAD.
+ */
+export function tareaEnOtraRama(rama: string, cwd: string): boolean {
+  return currentBranch(cwd) !== rama && localBranchExists(rama, cwd) && !isAncestor(rama, 'HEAD', cwd);
+}
+
+/** El error de pausa y registrar-coste cuando la tarea vive en otra rama (una sola redaccion). */
+export function mensajeTareaEnOtraRama(id: string, rama: string): string {
+  return (
+    `[ERROR] ${id}: la copia al dia de la tarea esta en su rama, "${rama}". ` +
+    `Cambia a ella (git checkout ${rama}) y reintenta; no se ha tocado nada.`
+  );
+}
+
 /** true si esa rama existe en "origin". Asume que ya se llamo isRemoteAvailable. */
 function remoteBranchExists(name: string, cwd: string): boolean {
   const output = runGit(['ls-remote', '--heads', 'origin', name], cwd);
````

## Excluido del diff (17 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-144a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144a/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144a/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144a/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144a/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-144a/tarea.md                                                       |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/cadena.js                                      |  6 ++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/pausa.js                                       |  9 +++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js                             |  9 +++------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                      | 14 +++++---------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                                   | 42 +++++++++++++++++++-----------------------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-menores.js                           | 14 ++++----------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-revision.js                                | 12 ++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                               | 14 ++++++++++++++
 17 files changed, 73 insertions(+), 55 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente-sincronizacion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/cadena.test.ts                   | 55 ++++++++++++++++++++++++++++++++++++-------------------
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente-sincronizacion.test.ts | 55 +++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/regla-4d.test.ts                     |  9 ++++++++-
 3 files changed, 99 insertions(+), 20 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 126.9 s
- Commit verificado: b3ea93abc38ebb35db629549945080aa82896213
- Huella: 62a4753f9de3cf8c0370428ab84fb5362a2df984
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 112399 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3944ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (0.8156ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (1.0954ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.2464ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.0226ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (1.9256ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (10.3112ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (3.8117ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (8.3693ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.1274ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.1326ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.7189ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (2087.5069ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1753.4337ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9431ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.263ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9036ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6857ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6732ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0126ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.2665ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (14.5929ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (1.5172ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.8516ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6733ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.5278ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (31.4358ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (2.9868ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4327ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4914ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4522ms)
ℹ tests 722
ℹ suites 0
ℹ pass 722
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 116964.1067
[verificar-impacto] node --test termino con 0 en 117.1 s.
````
