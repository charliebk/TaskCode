# Peticion de revision — TASK-056 (ronda 2)

- Tarea: TASK-056 — Flujo B: nucleo determinista del siguiente paso y registro de transiciones
- Rama revisada: feature/task-056-flujo-b-nucleo-determinista-del-siguient
- Rama base: develop
- Commit revisado (HEAD): 4cada029547c05cae4b2cf2c2d17eee2b21f5f5a
- Fecha: 2026-10-04
- Agente revisor sugerido: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-056 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 66d4565af7cc266443c014a347b1885b6d5f0eab (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la
peticion.

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/core/flujo.ts:104-106 | informe-revision-1.md |
| IMP-2 | IMPORTANTE | abierto | src/core/transiciones.ts:50-53 | informe-revision-1.md |
| IMP-3 | IMPORTANTE | abierto | src/commands/siguiente.ts:120-131 (test/commands/siguiente.test.ts) | informe-revision-1.md |
| MEN-1 | MENOR | abierto | src/core/transiciones.ts:53 (test/core/transiciones.test.ts) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | src/commands/approve.ts:207-208 | informe-revision-1.md |
| MEN-3 | MENOR | abierto | src/core/transiciones.ts:146 / src/commands/plan.ts:1002 | informe-revision-1.md |
| MEN-4 | MENOR | abierto | src/core/transiciones.ts:132 / src/core/flujo.ts / src/commands/approve.ts:162-168 | informe-revision-1.md |
| MEN-5 | MENOR | abierto | src/commands/pausa.ts:55-78 | informe-revision-1.md |
| MEN-6 | MENOR | abierto | src/core/flujo.ts:109-113 | informe-revision-1.md |
| MEN-7 | MENOR | abierto | src/commands/siguiente.ts:103-106 | informe-revision-1.md |

## Commits a revisar (git log 66d4565af7cc266443c014a347b1885b6d5f0eab..HEAD)

````
4cada02 fix(TASK-056): correcciones de la ronda 1 (IMP-1, IMP-2, IMP-3, MEN-1, MEN-2, MEN-4, MEN-5, MEN-6)
dec2eab chore(TASK-056): veredicto ronda 1 (cambios-solicitados)
b19af91 docs(TASK-056): informe de revision ronda 1
fbba9ca chore(TASK-056): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 66d4565af7cc266443c014a347b1885b6d5f0eab..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
index d76505b..3a281c6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
@@ -14,7 +14,7 @@ import path from 'node:path';
 import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
 import { resolverConfig } from '../core/config.js';
 import { registrarTransicion } from '../core/transiciones.js';
-import { currentBranch, isAncestor, localBranchExists } from '../fs/git.js';
+import { currentBranch, isAncestor, localBranchExists, runGit } from '../fs/git.js';
 import {
   autoCommit,
   extraerPushFlag,
@@ -69,6 +69,16 @@ export async function runPausaCommand(
     );
   }
 
+  // MEN-5 de la revision: el commit de la pausa es de la carpeta de la
+  // tarea entera; con ediciones a medias en ella, se las llevaria.
+  const pendientes = runGit(['status', '--porcelain', '--', path.dirname(filePath)], deps.repoCwd);
+  if (pendientes !== '') {
+    throw new PausaCommandError(
+      `[ERROR] ${id}: la carpeta de la tarea tiene cambios sin commitear. Commitealos o ` +
+        'descartalos antes de "taskctl pausa": su commit se los llevaria. No se ha tocado nada.'
+    );
+  }
+
   const conRegistro = registrarTransicion(body, 'pausa', today, modoConfig, 'persona');
   const nuevo = await moveTareaFile(tareasRoot, filePath, task, conRegistro);
   const commit = autoCommit({
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index a93595d..098aa76 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -17,10 +17,14 @@ import { readFile } from 'node:fs/promises';
 import { readTareaFile } from '../fs/task-store.js';
 import { parseTareaFile } from '../core/tarea-file.js';
 import { resolverConfig, type ModoFlujo } from '../core/config.js';
-import { modoDeTarea } from '../core/transiciones.js';
+import { modoDeTarea, modoCongelado } from '../core/transiciones.js';
 import { siguienteFase, type ContextoFlujo, type SiguientePaso } from '../core/flujo.js';
-import { veredictoAprobado, veredictoDeRonda } from '../core/informe-revision.js';
-import { INFORME_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
+import { veredictoDeRonda, type VeredictoInforme } from '../core/informe-revision.js';
+import {
+  INFORME_REVISION_RE,
+  informesDeUltimaRonda,
+  nombresDeUltimaRonda,
+} from '../fs/rondas.js';
 import {
   currentBranch,
   isAncestor,
@@ -49,33 +53,9 @@ export interface SiguienteCommandResult extends SiguientePaso {
   json: boolean;
 }
 
-/** Textos de los informes de la ultima ronda que casan con `re`, dados sus nombres y un lector. */
-async function ultimaRonda(
-  nombres: readonly string[],
-  re: RegExp,
-  leer: (nombre: string) => Promise<string>
-): Promise<string[]> {
-  let ronda = 0;
-  let deLaRonda: string[] = [];
-  for (const n of [...nombres].sort()) {
-    const m = re.exec(n);
-    if (m === null || m[1] === undefined) continue;
-    const r = Number(m[1]);
-    if (r > ronda) {
-      ronda = r;
-      deLaRonda = [n];
-    } else if (r === ronda) {
-      deLaRonda.push(n);
-    }
-  }
-  return Promise.all(deLaRonda.map(leer));
-}
-
-function contextoDeRevision(informes: string[], informesCodex: string[]): Omit<ContextoFlujo, 'planRedactado'> {
-  return {
-    veredicto: informes.length === 0 ? null : veredictoDeRonda(informes),
-    codexAprobada: informesCodex.length > 0 && informesCodex.every((i) => veredictoAprobado(i)),
-  };
+/** Veredicto de una ronda a partir de sus informes; null si no hay ninguno. */
+function veredictoDe(informes: readonly string[]): VeredictoInforme | null {
+  return informes.length === 0 ? null : veredictoDeRonda(informes);
 }
 
 export async function runSiguienteCommand(
@@ -107,7 +87,12 @@ export async function runSiguienteCommand(
 
   let task: Task;
   let body: string;
-  let ctx: ContextoFlujo;
+  let planEstaRedactado = true;
+  // Informes de la ultima ronda (primaria y de Codex), con el MISMO criterio
+  // de ronda en los dos caminos (nombresDeUltimaRonda), leidos de la rama o
+  // del disco.
+  let primarios: string[];
+  let codex: string[];
   if (enOtraRama) {
     const enRama = lsTreeNames(rama, 'tareas', deps.repoCwd);
     const rutaTarea = enRama.find((n) => n.endsWith(`/${id}/tarea.md`));
@@ -121,31 +106,31 @@ export async function runSiguienteCommand(
     const nombres = enRama
       .filter((n) => n.startsWith(dirRevision))
       .map((n) => n.slice(dirRevision.length));
-    const leer = async (n: string) => showFileAtRef(rama, dirRevision + n, deps.repoCwd);
-    ctx = {
-      // En la rama la tarea ya paso por start: el plan dejo de importar.
-      planRedactado: true,
-      ...contextoDeRevision(
-        await ultimaRonda(nombres, INFORME_REVISION_RE, leer),
-        await ultimaRonda(nombres, INFORME_CODEX_RE, leer)
-      ),
-    };
+    const leer = (n: string) => showFileAtRef(rama, dirRevision + n, deps.repoCwd);
+    // En la rama la tarea ya paso por start: el plan dejo de importar.
+    primarios = nombresDeUltimaRonda(nombres, INFORME_REVISION_RE).nombres.map(leer);
+    codex = nombresDeUltimaRonda(nombres, INFORME_CODEX_RE).nombres.map(leer);
   } else {
     ({ task, body } = local);
     const taskDir = path.dirname(local.filePath);
     const revisionDir = path.join(taskDir, REVISION_DIRNAME);
-    const leer = (dir: string) => async (n: string) => readFile(path.join(dir, n), 'utf8');
-    const primarios = await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE);
-    const codex = await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE);
-    ctx = {
-      planRedactado: task.estado === 'en-diseno' ? await planRedactado(task, taskDir) : true,
-      ...contextoDeRevision(
-        await Promise.all(primarios.nombres.map(leer(revisionDir))),
-        await Promise.all(codex.nombres.map(leer(revisionDir)))
-      ),
-    };
+    const leer = (n: string) => readFile(path.join(revisionDir, n), 'utf8');
+    primarios = await Promise.all(
+      (await informesDeUltimaRonda(revisionDir, INFORME_REVISION_RE)).nombres.map(leer)
+    );
+    codex = await Promise.all(
+      (await informesDeUltimaRonda(revisionDir, INFORME_CODEX_RE)).nombres.map(leer)
+    );
+    if (task.estado === 'en-diseno') planEstaRedactado = await planRedactado(task, taskDir);
   }
 
+  const ctx: ContextoFlujo = {
+    planRedactado: planEstaRedactado,
+    veredicto: veredictoDe(primarios),
+    veredictoCodex: veredictoDe(codex),
+    modoCongelado: modoCongelado(body) !== null,
+  };
+
   const modo = modoDeTarea(body, modoConfig);
   return {
     id: task.id,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
index 7b60b35..3a97b78 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts
@@ -23,6 +23,7 @@ export type FaseSiguiente =
   | 'review'
   | 'veredicto'
   | 'codex-review'
+  | 'veredicto-codex'
   | 'finish'
   | 'terminada';
 
@@ -33,8 +34,19 @@ export interface ContextoFlujo {
   planRedactado: boolean;
   /** en-revision: veredicto de la ultima ronda. */
   veredicto: VeredictoInforme | null;
-  /** en-revision con revision_codex: ¿la segunda opinion esta aprobada? */
-  codexAprobada: boolean;
+  /**
+   * en-revision con revision_codex: veredicto de la ultima ronda de Codex,
+   * o null si todavia no hay ninguna (IMP-1 de la revision: un booleano no
+   * distinguia "sin informe" de "pendiente" ni de "pidio cambios", y
+   * siguiente pedia otra ronda de Codex sin fin).
+   */
+  veredictoCodex: VeredictoInforme | null;
+  /**
+   * ¿La tarea tiene modo congelado (fila plan en su registro)? Sin el, la
+   * aprobacion automatica esta vetada (MEN-4): en automatico no se puede
+   * proponer seguir solo hacia un approve que el CLI rechazara.
+   */
+  modoCongelado: boolean;
 }
 
 export interface SiguientePaso {
@@ -57,9 +69,12 @@ function accionPara(
   fase: FaseSiguiente,
   modo: ModoFlujo,
   task: Task,
-  abreFase: boolean
+  abreFase: boolean,
+  exigePersona: boolean
 ): AccionFlujo {
   if (fase === 'terminada' || modo === 'manual') return 'detener';
+  // Pasos que solo puede decidir una persona aunque el modo encadene.
+  if (exigePersona) return 'preguntar';
   // Decision de Carlos (2026-10-04): hotfix y release mergean a main con
   // tag; en ningun modo se cierran sin preguntar.
   if (fase === 'finish' && (task.tipo === 'hotfix' || task.tipo === 'release')) return 'preguntar';
@@ -72,11 +87,12 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
     fase: FaseSiguiente,
     abreFase: boolean,
     motivo: string,
-    comando: string | null = `taskctl ${fase} ${task.id}`
+    comando: string | null = `taskctl ${fase} ${task.id}`,
+    exigePersona = false
   ): SiguientePaso => ({
     fase,
     comando,
-    accion: accionPara(fase, modo, task, abreFase),
+    accion: accionPara(fase, modo, task, abreFase, exigePersona),
     motivo,
   });
 
@@ -90,6 +106,17 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
         // trabajo de agente (roles, unificador) sobre la ronda ya abierta.
         return paso('plan', false, 'falta redactar planificacion/plan-final.md', null);
       }
+      if (!ctx.modoCongelado) {
+        // Tarea sin fila plan (anterior al registro): approve
+        // --decidido-por automatico se rechaza, asi que la aprueba una persona.
+        return paso(
+          'approve',
+          true,
+          'el plan esta redactado y sin aprobar; la tarea no tiene modo congelado, asi que la aprueba una persona',
+          `taskctl approve ${task.id}`,
+          true
+        );
+      }
       return paso('approve', true, 'el plan esta redactado y sin aprobar');
     case 'en-curso':
       return paso(
@@ -102,15 +129,43 @@ export function siguienteFase(task: Task, ctx: ContextoFlujo, modo: ModoFlujo):
         case 'cambios-solicitados':
           return paso('review', false, 'la ultima ronda pidio cambios: corregir y pedir otra ronda');
         case 'aprobada':
-          if (task.revision_codex && !ctx.codexAprobada) {
-            return paso('codex-review', false, 'falta la segunda opinion (revision_codex: true)');
+          if (task.revision_codex) {
+            switch (ctx.veredictoCodex) {
+              case null:
+                return paso('codex-review', false, 'falta la segunda opinion (revision_codex: true)');
+              case 'aprobada':
+                break;
+              case 'cambios-solicitados':
+                // Otra ronda de Codex solo tras corregir: lo decide una persona,
+                // o se pediria una segunda opinion sobre el mismo codigo.
+                return paso(
+                  'codex-review',
+                  false,
+                  'la segunda opinion pidio cambios: corregir y pedir otra ronda de codex-review',
+                  `taskctl codex-review ${task.id}`,
+                  true
+                );
+              default:
+                // No hay comando que escriba el veredicto de Codex, y que lo
+                // escriba el mismo agente que encadena el flujo es el agujero
+                // del veredicto autoescrito: lo decide una persona.
+                return paso(
+                  'veredicto-codex',
+                  false,
+                  'el informe de la segunda opinion no tiene veredicto: una persona lo lee y escribe su linea "- Veredicto:"',
+                  null,
+                  true
+                );
+            }
           }
           return paso('finish', true, 'la revision esta aprobada');
         default:
           return paso(
             'veredicto',
             false,
-            'la ultima ronda no tiene veredicto: falta el revisor',
+            ctx.veredicto === 'desconocido'
+              ? 'el veredicto de la ultima ronda no se reconoce: reescribelo con taskctl veredicto'
+              : 'la ultima ronda no tiene veredicto: falta el revisor',
             `taskctl veredicto ${task.id} <aprobada|aprobada-con-correcciones|cambios-solicitados>`
           );
       }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 318b0c8..7f982e0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -45,12 +45,37 @@ function filaATexto(f: FilaTransicion): string {
   return `| ${f.fecha} | ${f.fase} | ${f.modo} | ${f.decidido_por} |`;
 }
 
-/** [inicio, fin) de las lineas de la seccion, o null si no existe. */
+/** Para cada linea, si esta dentro de un bloque de codigo (``` o ~~~). */
+function dentroDeBloque(lineas: readonly string[]): boolean[] {
+  let abierto: string | null = null;
+  return lineas.map((l) => {
+    const valla = /^\s*(`{3,}|~{3,})/.exec(l);
+    if (valla === null) return abierto !== null;
+    const marca = (valla[1] as string)[0] as string;
+    if (abierto === null) {
+      abierto = marca;
+      return true;
+    }
+    if (marca === abierto) abierto = null;
+    return true;
+  });
+}
+
+/**
+ * [inicio, fin) de las lineas de la seccion, o null si no existe. Se buscan
+ * los encabezados FUERA de bloques de codigo y se toma el ULTIMO (IMP-2 de
+ * la revision): un enunciado que traiga la tabla de ejemplo dentro de un
+ * bloque no es el registro, y la seccion real siempre se crea al final.
+ */
 function rangoSeccion(lineas: readonly string[]): [number, number] | null {
-  const inicio = lineas.findIndex((l) => l.trimEnd() === SECCION_TRANSICIONES);
+  const enBloque = dentroDeBloque(lineas);
+  let inicio = -1;
+  lineas.forEach((l, i) => {
+    if (!enBloque[i] && l.trimEnd() === SECCION_TRANSICIONES) inicio = i;
+  });
   if (inicio === -1) return null;
   let fin = inicio + 1;
-  while (fin < lineas.length && !/^##?\s/.test(lineas[fin] as string)) fin++;
+  while (fin < lineas.length && (enBloque[fin] || !/^##?\s/.test(lineas[fin] as string))) fin++;
   return [inicio, fin];
 }
 
@@ -70,9 +95,10 @@ export function anadirTransicion(body: string, fila: FilaTransicion): string {
   }
 
   const [inicio, fin] = rango;
+  const enBloque = dentroDeBloque(lineas);
   let ultimaTabla = -1;
   for (let i = inicio + 1; i < fin; i++) {
-    if ((lineas[i] as string).trimStart().startsWith('|')) ultimaTabla = i;
+    if (!enBloque[i] && (lineas[i] as string).trimStart().startsWith('|')) ultimaTabla = i;
   }
   const nuevas =
     ultimaTabla === -1
@@ -93,8 +119,10 @@ export function leerTransiciones(body: string): FilaTransicion[] {
   const lineas = body.split(/\r?\n/);
   const rango = rangoSeccion(lineas);
   if (rango === null) return [];
+  const enBloque = dentroDeBloque(lineas);
   const filas: FilaTransicion[] = [];
   for (let i = rango[0] + 1; i < rango[1]; i++) {
+    if (enBloque[i]) continue;
     const celdas = (lineas[i] as string)
       .trim()
       .replace(/^\|/, '')
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
index 3e5ca36..a0f518f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/rondas.ts
@@ -96,6 +96,19 @@ export async function informesDeUltimaRonda(
     if (isEnoent(e) || isEnotdir(e)) return { ronda: 0, nombres: [] };
     throw e;
   }
+  return nombresDeUltimaRonda(entries, patron);
+}
+
+/**
+ * El criterio de "ultima ronda" sobre una lista de nombres, sin tocar el
+ * disco. Lo usan informesDeUltimaRonda (readdir) y `taskctl siguiente`
+ * cuando lee revision/ de la rama de la tarea con git (TASK-056, IMP-3):
+ * un solo criterio, o develop y la rama responderian distinto.
+ */
+export function nombresDeUltimaRonda(
+  entries: readonly string[],
+  patron: RegExp
+): { ronda: number; nombres: string[] } {
   let ronda = 0;
   let nombres: string[] = [];
   for (const entry of [...entries].sort()) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
index 3333421..ebe1666 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/siguiente.test.ts
@@ -5,7 +5,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
+import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
@@ -251,6 +251,12 @@ test('approve --decidido-por automatico con la tarea planificada en manual: rech
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
     assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, false);
 
+    // La forma --decidido-por=valor pasa por la misma guarda (MEN-2 de la revision).
+    const conIgual = cli(repoRoot, ['approve', id, '--decidido-por=automatico']);
+    assert.notEqual(conIgual.status, 0);
+    assert.match(conIgual.stderr, /no se puede aprobar como automatico/);
+    assert.equal((await readTareaFile(tareasRoot, id))?.task.plan_aprobado, false);
+
     // Sin valor: tambien falla y no aprueba.
     const sinValor = cli(repoRoot, ['approve', id, '--decidido-por']);
     assert.notEqual(sinValor.status, 0);
@@ -300,6 +306,88 @@ test('pausa en en-diseno: fila pausa de persona, commit propio y estado intacto'
   });
 });
 
+test('pausa con ediciones sin commitear en la carpeta de la tarea: aborta sin llevarselas (MEN-5)', async () => {
+  await withRepo(null, async (repoRoot, tareasRoot) => {
+    const id = await nuevaTarea(repoRoot, tareasRoot);
+    await planificar(repoRoot, tareasRoot, id);
+    const tareaPath = path.join(tareasRoot, '01-en-diseno', id, 'tarea.md');
+    await writeFile(tareaPath, (await readFile(tareaPath, 'utf8')) + '\nnota a medias\n', 'utf8');
+    const antes = git(['rev-parse', 'HEAD'], repoRoot);
+
+    const r = cli(repoRoot, ['pausa', id]);
+    assert.notEqual(r.status, 0);
+    assert.match(r.stderr, /cambios sin commitear/);
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), antes, 'no hay commit de pausa');
+    assert.match(await readFile(tareaPath, 'utf8'), /nota a medias/, 'la edicion sigue ahi');
+  });
+});
+
+/**
+ * Tarea en revision en su rama, con la ronda 1 fragmentada por dominio
+ * (informe-revision-1-dom1.md y -dom2.md, sin el de la ronda entera) y,
+ * opcionalmente, revision_codex. Deja el repo en la rama de la tarea.
+ */
+async function enRevisionFragmentada(repoRoot: string, tareasRoot: string): Promise<{ id: string; rama: string }> {
+  const id = await nuevaTarea(repoRoot, tareasRoot);
+  await planificar(repoRoot, tareasRoot, id);
+  cliOk(repoRoot, ['approve', id]);
+  await runStartCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+  await writeFile(path.join(repoRoot, 'app.txt'), 'cambiado\n', 'utf8');
+  commitAll(repoRoot, `feat(${id}): trabajo`);
+  await runReviewCommand(tareasRoot, [id], HOY, { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+  const rama = git(['branch', '--show-current'], repoRoot).trim();
+  const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
+  git(['rm', '-q', path.join(revisionDir, 'informe-revision-1.md')], repoRoot);
+  commitAll(repoRoot, `chore(${id}): ronda fragmentada`);
+  return { id, rama };
+}
+
+test('siguiente desde develop con la tarea en revision en su rama: ronda fragmentada y segunda opinion leidas de la rama (IMP-3)', async () => {
+  await withRepo('modo_flujo: semiautomatico\n', async (repoRoot, tareasRoot) => {
+    const { id, rama } = await enRevisionFragmentada(repoRoot, tareasRoot);
+    const revisionDir = path.join(tareasRoot, '03-en-revision', id, 'revision');
+
+    /** Escribe en la rama, commitea y pregunta a siguiente DESDE develop. */
+    const desdeDevelop = async (ficheros: Record<string, string>): Promise<Record<string, unknown>> => {
+      git(['checkout', '-q', rama], repoRoot);
+      for (const [nombre, contenido] of Object.entries(ficheros)) {
+        await writeFile(path.join(revisionDir, nombre), contenido, 'utf8');
+      }
+      commitAll(repoRoot, 'informes');
+      git(['checkout', '-q', 'develop'], repoRoot);
+      const s = siguiente(repoRoot, id);
+      assert.equal(s.leidaDe, 'rama');
+      return s;
+    };
+
+    // Un dominio aprobado y otro pendiente: falta un revisor (no basta el primero).
+    let s = await desdeDevelop({
+      'informe-revision-1-dom1.md': '- Veredicto: aprobada\n',
+      'informe-revision-1-dom2.md': '- Veredicto: PENDIENTE\n',
+    });
+    assert.equal(s.fase, 'veredicto');
+    // El segundo pide cambios: otra ronda.
+    s = await desdeDevelop({ 'informe-revision-1-dom2.md': '- Veredicto: cambios-solicitados\n' });
+    assert.equal(s.fase, 'review');
+    // Los dos aprobados: finish.
+    s = await desdeDevelop({ 'informe-revision-1-dom2.md': '- Veredicto: aprobada\n' });
+    assert.equal(s.fase, 'finish');
+
+    // Con revision_codex: sin informe de Codex, codex-review; pendiente, lo decide una persona; aprobado, finish.
+    git(['checkout', '-q', rama], repoRoot);
+    const t = await readTareaFile(tareasRoot, id);
+    assert.ok(t);
+    await writeTareaFile(tareasRoot, { ...t.task, revision_codex: true }, t.body, { failIfExists: false });
+    commitAll(repoRoot, 'revision_codex');
+    git(['checkout', '-q', 'develop'], repoRoot);
+    assert.equal(siguiente(repoRoot, id).fase, 'codex-review');
+    s = await desdeDevelop({ 'informe-codex-1.md': '- Veredicto: PENDIENTE\n' });
+    assert.deepEqual([s.fase, s.accion, s.comando], ['veredicto-codex', 'preguntar', null]);
+    s = await desdeDevelop({ 'informe-codex-1.md': '- Veredicto: aprobada\n' });
+    assert.equal(s.fase, 'finish');
+  });
+});
+
 test('pausa desde develop con la tarea en su rama: aborta diciendo a que rama cambiar', async () => {
   await withRepo(null, async (repoRoot, tareasRoot) => {
     const id = await nuevaTarea(repoRoot, tareasRoot);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
index 8255bb4..f4ae808 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/siguiente.test.ts
@@ -39,7 +39,12 @@ function tarea(overrides: Partial<Task> = {}): Task {
   };
 }
 
-const CTX: ContextoFlujo = { planRedactado: false, veredicto: null, codexAprobada: false };
+const CTX: ContextoFlujo = {
+  planRedactado: false,
+  veredicto: null,
+  veredictoCodex: null,
+  modoCongelado: true,
+};
 
 interface Caso {
   nombre: string;
@@ -57,6 +62,8 @@ const TABLA: Caso[] = [
   { nombre: 'planificada', task: { estado: 'planificada' }, fase: 'plan', comando: 'taskctl plan TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
   { nombre: 'en diseno sin plan redactado', task: { estado: 'en-diseno' }, fase: 'plan', comando: null, acciones: ['detener', 'continuar', 'continuar'] },
   { nombre: 'en diseno con plan redactado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  // MEN-4: sin modo congelado (tarea anterior al registro) la aprobacion automatica esta vetada.
+  { nombre: 'en diseno con plan, sin modo congelado', task: { estado: 'en-diseno' }, ctx: { planRedactado: true, modoCongelado: false }, fase: 'approve', comando: 'taskctl approve TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'en diseno aprobada', task: { estado: 'en-diseno', plan_aprobado: true }, ctx: { planRedactado: true }, fase: 'start', comando: 'taskctl start TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
   { nombre: 'en curso', task: { estado: 'en-curso', plan_aprobado: true }, fase: 'review', comando: 'taskctl review TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
   { nombre: 'en revision sin informe', task: { estado: 'en-revision', plan_aprobado: true }, fase: 'veredicto', comando: VEREDICTO_PENDIENTE, acciones: ['detener', 'continuar', 'continuar'] },
@@ -68,8 +75,13 @@ const TABLA: Caso[] = [
   // Decision de Carlos: hotfix y release preguntan antes de finish en cualquier modo que encadene.
   { nombre: 'en revision aprobada (hotfix)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'hotfix' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
   { nombre: 'en revision aprobada (release)', task: { estado: 'en-revision', plan_aprobado: true, tipo: 'release' }, ctx: { veredicto: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
-  { nombre: 'aprobada con codex pendiente', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'continuar', 'continuar'] },
-  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', codexAprobada: true }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  // IMP-1: la segunda opinion tiene su propio veredicto; sin el, siguiente pedia codex-review sin fin.
+  { nombre: 'aprobada sin informe de codex', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'continuar', 'continuar'] },
+  { nombre: 'aprobada con codex pendiente', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'veredicto-codex', comando: null, acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'aprobada con codex sin linea', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'sin-linea' }, fase: 'veredicto-codex', comando: null, acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'aprobada con codex cambios', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'cambios-solicitados' }, fase: 'codex-review', comando: 'taskctl codex-review TASK-100', acciones: ['detener', 'preguntar', 'preguntar'] },
+  { nombre: 'aprobada con codex aprobada', task: { estado: 'en-revision', plan_aprobado: true, revision_codex: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'aprobada' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
+  { nombre: 'codex aprobada sin revision_codex no cuenta', task: { estado: 'en-revision', plan_aprobado: true }, ctx: { veredicto: 'aprobada', veredictoCodex: 'pendiente' }, fase: 'finish', comando: 'taskctl finish TASK-100', acciones: ['detener', 'preguntar', 'continuar'] },
   { nombre: 'terminada', task: { estado: 'terminada', plan_aprobado: true }, fase: 'terminada', comando: null, acciones: ['detener', 'detener', 'detener'] },
 ];
 
@@ -105,7 +117,7 @@ test('siguienteFase: ninguna fase propuesta es una transicion ilegal para la maq
       () =>
         assertTransitionAllowed(comando, t, {
           planFinalExiste: ctx.planRedactado,
-          revisionCodexAprobada: ctx.codexAprobada,
+          revisionCodexAprobada: ctx.veredictoCodex === 'aprobada',
           ...veredictoACtx(ctx.veredicto),
         }),
       `${caso.nombre}: propone "${r.fase}", que la maquina de estados rechaza`
@@ -119,3 +131,9 @@ test('siguienteFase: en manual nunca encadena nada, en ningun estado', () => {
     assert.equal(r.accion, 'detener', caso.nombre);
   }
 });
+
+test('siguienteFase: un veredicto que no se reconoce no se presenta como "falta el revisor" (MEN-6)', () => {
+  const t = tarea({ estado: 'en-revision', plan_aprobado: true });
+  assert.match(siguienteFase(t, { ...CTX, veredicto: 'desconocido' }, 'manual').motivo, /no se reconoce/);
+  assert.match(siguienteFase(t, { ...CTX, veredicto: 'pendiente' }, 'manual').motivo, /falta el revisor/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
index 27dba04..c2eca99 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/transiciones.test.ts
@@ -38,14 +38,15 @@ test('anadirTransicion: sin seccion, la crea al final y deja el cuerpo intacto p
 
 test('anadirTransicion: con seccion, la fila va detras de la ultima de la tabla, aunque despues haya otra seccion', () => {
   let r = anadirTransicion(CUERPO, fila());
-  r += '\n## Resultado\n\nTexto del resultado.\n';
+  // Con una tabla propia en la seccion siguiente (MEN-1): la fila no puede ir detras de ella.
+  r += '\n## Resultado\n\nTexto del resultado.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n';
   r = anadirTransicion(r, fila({ fase: 'approve', decidido_por: 'automatico' }));
   assert.deepEqual(
     leerTransiciones(r).map((f) => f.fase),
     ['plan', 'approve']
   );
   // El Resultado sigue intacto y detras.
-  assert.ok(r.endsWith('## Resultado\n\nTexto del resultado.\n'), r);
+  assert.ok(r.endsWith('## Resultado\n\nTexto del resultado.\n\n| a | b |\n|---|---|\n| 1 | 2 |\n'), r);
   const antesDeResultado = r.slice(0, r.indexOf('## Resultado'));
   assert.match(antesDeResultado, /\| 2026-10-04 \| approve \| manual \| automatico \|\n/);
 });
@@ -79,6 +80,33 @@ test('modoCongelado: el de la ULTIMA fila plan (una re-planificacion lo vuelve a
   assert.equal(modoCongelado(r), 'semiautomatico');
 });
 
+test('un "## Transiciones" de ejemplo dentro de un bloque de codigo del enunciado no es el registro (IMP-2)', () => {
+  const ejemplo =
+    '## Objetivo\n\nDocumentar el registro, con este ejemplo:\n\n```md\n## Transiciones\n\n' +
+    '| fecha | fase | modo | decidido_por |\n|---|---|---|---|\n| 2026-01-01 | plan | automatico | persona |\n' +
+    '```\n\n## Criterios de aceptacion\n- [ ] Que funcione\n';
+  // Antes de plan: no hay registro ni modo congelado, digan lo que digan los ejemplos.
+  assert.deepEqual(leerTransiciones(ejemplo), []);
+  assert.equal(modoCongelado(ejemplo), null);
+  // plan crea la seccion REAL al final y deja el ejemplo intacto.
+  const r = anadirTransicion(ejemplo, fila());
+  assert.ok(r.startsWith(ejemplo.trimEnd()), 'el enunciado, incluido el ejemplo, no cambia');
+  assert.deepEqual(leerTransiciones(r), [fila()]);
+  assert.equal(modoCongelado(r), 'manual');
+  // Y la siguiente fila va a la seccion real, no al ejemplo.
+  const r2 = anadirTransicion(r, fila({ fase: 'approve' }));
+  assert.ok(r2.startsWith(ejemplo.trimEnd()));
+  assert.deepEqual(
+    leerTransiciones(r2).map((f) => f.fase),
+    ['plan', 'approve']
+  );
+});
+
+test('filas de tabla dentro de un bloque de codigo en la propia seccion se ignoran', () => {
+  const cuerpo = anadirTransicion(CUERPO, fila()) + '\n```\n| 2026-01-01 | approve | manual | persona |\n```\n';
+  assert.deepEqual(leerTransiciones(cuerpo), [fila()]);
+});
+
 test('registrarTransicion: plan toma el modo del config; el resto, el congelado aunque el config cambie', () => {
   const tras = registrarTransicion(CUERPO, 'plan', '2026-10-04', 'automatico');
   const aprobada = registrarTransicion(tras, 'approve', '2026-10-05', 'manual', 'automatico');
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 66d4565af7cc266443c014a347b1885b6d5f0eab..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-056/planificacion/brainstorm/peticion-unificador-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-056/planificacion/plan-final.md                       |    0
 tareas/03-en-revision/TASK-056/revision/informe-revision-1.md                                     |  107 ++++++
 tareas/03-en-revision/TASK-056/revision/peticion-revision-1.md                                    | 1643 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-056/tarea.md                                          |   47 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/pausa.js                           |    9 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                       |   68 ++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/flujo.js                               |   36 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                        |   39 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/rondas.js                                |    9 +
 10 files changed, 1905 insertions(+), 53 deletions(-)
````
