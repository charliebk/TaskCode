# Peticion de revision — TASK-082 (ronda 1)

- Tarea: TASK-082 — Autorrevision del implementador antes de pedir revision
- Rama revisada: feature/task-082-autorrevision-del-implementador-antes-de
- Rama base: develop
- Commit revisado (HEAD): 450590a7ad45ed71fd8deb03f8acab79ad9d7459
- Fecha: 2026-11-07
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-082 (criterios de aceptacion y plan)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
450590a docs(TASK-082): constancia de autorrevision
70f0c5d test(TASK-082): siguiente sin rama local omite revisores
7534fde feat(TASK-082): autorrevision del implementador antes de pedir revision
7f01234 chore(TASK-082): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
index 1de09c0..a696c87 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md
@@ -124,7 +124,7 @@ Reproducciones baratas que este dominio agradece:
 - **Modelo grande de verdad**: si el diff toca rendimiento, medir con un
   modelo del orden de magnitud real, no con tres elementos.
 
-## Que se revisa en este dominio
+## Que se revisa
 
 ### Interoperabilidad con la API de AutoCAD
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
index 492af6c..9762fa1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md
@@ -19,10 +19,27 @@ punto, no un formalismo.
    y haz SOLO lo que corresponde a su `fase`:
    - `review`: la implementacion (o las correcciones de la ronda anterior)
      tiene que estar commiteada y la suite en verde. Si no lo esta, para y
-     dilo. Si lo esta, ejecuta `taskctl review TASK-NNN` y sigue en el paso 3.
+     dilo. Si lo esta, haz la **autorrevision** (abajo), ejecuta
+     `taskctl review TASK-NNN` y sigue en el paso 3.
    - `veredicto`: ya hay peticion de revision; sigue en el paso 3.
    - `codex-review`: paso 5.
    - `veredicto-codex`: paso 6. **No ejecutes `codex-review`**.
+
+   **Autorrevision**, antes de cada `taskctl review` y sin lanzar ningun
+   agente: la haces tu, en tu contexto. El campo `revisores` del JSON de
+   `siguiente` dice que skills revisoras le tocan a la tarea (lo calcula el
+   mismo clasificador que reparte la revision: no lo deduzcas tu de los
+   patrones). De cada una lee **solo** su seccion `## Que se revisa`, en
+   `../<revisora>/SKILL.md`, sin copiarla a ningun sitio, y repasa con ella
+   tu diff; corrige lo evidente y commitea. Despues anota la constancia al
+   final de `tarea.md`, bajo `## Autorrevision` (creala si no existe), una
+   linea por revisora: `- <revisora> — <commit>`, con el commit corto que
+   repasaste, y nada mas. Sin juicios ni «sin hallazgos»: el revisor lee
+   `tarea.md` y no debe anclarse. Commitea antes de `taskctl review` (con el
+   workspace sucio aborta). En cada ronda siguiente, anade otra linea. Si el
+   JSON no trae `revisores`, usa las revisoras cuya `description` encaje
+   con los ficheros del diff, y `code-quality-reviewer` para el resto.
+   `taskctl review` avisa, sin bloquear, si falta la constancia.
 3. Por cada `revision/peticion-revision-N*.md` de la ronda que no tenga ya su
    informe con veredicto (una por dominio si esta fragmentada), lanza un
    agente revisor independiente, en paralelo y en un solo mensaje, con la
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index beae348..9db49f0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -64,7 +64,8 @@ import {
 } from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
-import { EXCLUIR_HELDOUT } from '../core/heldout.js';
+import { excluirDeRevision } from '../fs/revisores-rango.js';
+import { avisoAutorrevision } from '../core/autorrevision.js';
 import { contextoPermitido } from '../core/contexto-revision.js';
 import { modeloDeVerificacion } from '../core/modelo-revision.js';
 
@@ -530,6 +531,11 @@ export async function runReviewCommand(
   // revisado en la ronda N si sigue siendo antepasado de HEAD; si no (un
   // rebase, un amend, un gc) o no consta, el diff completo con un aviso.
   const avisos: string[] = [];
+  // TASK-082: aviso (sin bloquear) si falta la constancia de la
+  // autorrevision. Sobre la lectura fresca y antes de cualquier escritura;
+  // avisoAutorrevision es pura y nunca lanza.
+  const sinAutorrevision = avisoAutorrevision(body, id);
+  if (sinAutorrevision !== null) avisos.push(sinAutorrevision);
   let desde = baseBranch;
   if (incremental && previa !== null) {
     const valido = previa.commit !== null && esAntepasado(previa.commit, deps.repoCwd);
@@ -547,7 +553,7 @@ export async function runReviewCommand(
   // tareas no se embeben: eran el 27 % de los bytes de las peticiones.
   // TASK-073: los tests held-out nunca se embeben, se configure lo que se configure.
   const configRama = resolverConfig(deps.repoCwd);
-  const excluir = [...new Set([...configRama.excluir_de_revision, EXCLUIR_HELDOUT])];
+  const excluir = excluirDeRevision(configRama.excluir_de_revision);
   const paraRevision = diffParaRevision(desde, 'HEAD', excluir, deps.repoCwd);
   const diff = paraRevision.diff;
   // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
index 104fe7d..c153449 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/siguiente.ts
@@ -33,9 +33,12 @@ import {
   isAncestor,
   localBranchExists,
   lsTreeNames,
+  mergeBase,
+  resolveBaseBranchForTipo,
   runGit,
   showFileAtRef,
 } from '../fs/git.js';
+import { excluirDeRevision, revisoresDelRango } from '../fs/revisores-rango.js';
 import type { Task } from '../core/task.js';
 import { REVISION_DIRNAME } from './review.js';
 import { planRedactado } from './approve.js';
@@ -62,6 +65,14 @@ export interface SiguienteCommandResult extends SiguientePaso {
   leidaDe: 'working-tree' | 'rama';
   /** true si se pidio --json. */
   json: boolean;
+  /**
+   * TASK-082: solo con `fase: review`. Las skills revisoras que repartiria
+   * `review` para TODA la tarea (desde la merge base con su rama base), con
+   * el mismo clasificador: las listas `## Que se revisa` que pasa el
+   * implementador en su autorrevision. Ausente si no se puede calcular (la
+   * rama de la tarea no esta en local, o Git falla): no rompe `siguiente`.
+   */
+  revisores?: string[];
 }
 
 /**
@@ -214,13 +225,41 @@ export async function runSiguienteCommand(
   };
 
   const modo = modoDeTarea(body, modoConfig);
-  return {
+  const paso = siguienteFase(task, ctx, modo);
+  const resultado: SiguienteCommandResult = {
     id: task.id,
     estado: task.estado,
     modo,
     cierre: config.cierre_por_defecto,
     leidaDe: enOtraRama ? 'rama' : 'working-tree',
     json,
-    ...siguienteFase(task, ctx, modo),
+    ...paso,
   };
+  if (paso.fase === 'review') {
+    const ref = enOtraRama ? rama : currentBranch(deps.repoCwd) === rama ? 'HEAD' : null;
+    const revisores = ref === null ? null : revisoresDeLaTarea(task, ref, config.excluir_de_revision, deps.repoCwd);
+    if (revisores !== null) resultado.revisores = revisores;
+  }
+  return resultado;
+}
+
+/**
+ * TASK-082: revisoras de toda la tarea, desde la merge base con su rama base
+ * hasta `ref`. La merge base y no la punta de la base: antes de `review` la
+ * base aun no esta integrada y `base..ref` meteria lo que la base trajo
+ * despues. null si Git no puede calcularlo: `siguiente` decide el paso y no
+ * debe caerse por un dato auxiliar.
+ */
+function revisoresDeLaTarea(
+  task: Task,
+  ref: string,
+  excluirConfig: readonly string[],
+  cwd: string
+): string[] | null {
+  try {
+    const desde = mergeBase(resolveBaseBranchForTipo(task.tipo, cwd), ref, cwd);
+    return revisoresDelRango(desde, ref, excluirDeRevision(excluirConfig), cwd);
+  } catch {
+    return null;
+  }
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
new file mode 100644
index 0000000..127e5a1
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/autorrevision.ts
@@ -0,0 +1,44 @@
+/**
+ * TASK-082: la constancia de la autorrevision del implementador.
+ *
+ * Antes de `taskctl review`, quien implementa pasa la seccion
+ * `## Que se revisa` de cada revisora que le toca y lo anota en `tarea.md`
+ * bajo `## Autorrevision`, una linea `- <revisora> — <commit>` por revisora.
+ * `review` avisa (sin bloquear) si falta.
+ *
+ * Cuenta como constancia la seccion CON contenido: un encabezado vacio (por
+ * ejemplo, el que traeria una plantilla) no es una autorrevision hecha.
+ * Contenido = alguna linea no vacia que no sea solo un comentario HTML. Se
+ * exige una vez por tarea, no por ronda (decision de la persona en el plan).
+ *
+ * Pura y total: no toca disco ni Git y nunca lanza. `review` la llama antes
+ * de su primera escritura, y un fallo aqui no puede dejar una ronda a medias.
+ */
+import { rangoDeSeccion } from './transiciones.js';
+
+/** Titulo exacto de la seccion, sin tilde, como `## Transiciones` y `## Coste`. */
+export const SECCION_AUTORREVISION = '## Autorrevision';
+
+/** ¿Tiene `body` la seccion de autorrevision con al menos una linea de contenido? */
+export function tieneAutorrevision(body: string): boolean {
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_AUTORREVISION);
+  if (rango === null) return false;
+  const [inicio, fin] = rango;
+  const contenido = lineas
+    .slice(inicio + 1, fin)
+    .join('\n')
+    .replace(/<!--[\s\S]*?-->/g, '');
+  return contenido.trim() !== '';
+}
+
+/** El aviso de `review` si falta la constancia; null si esta. */
+export function avisoAutorrevision(body: string, id: string): string | null {
+  if (tieneAutorrevision(body)) return null;
+  return (
+    `${id}: tarea.md no tiene la constancia de la autorrevision (seccion "${SECCION_AUTORREVISION}" con contenido). ` +
+    'La revision sigue, pero antes de pedirla conviene pasar la seccion "## Que se revisa" de cada revisora ' +
+    'que da "taskctl siguiente --json" (campo "revisores"), corregir lo evidente y anotar en tarea.md ' +
+    `"${SECCION_AUTORREVISION}" con una linea "- <revisora> — <commit>" por revisora, commiteada.`
+  );
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 7b94e1d..81830f2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -308,13 +308,7 @@ export function diffParaRevision(
 ): DiffParaRevision {
   const rango = `${desde}..${hasta}`;
   const sinExcluidos = pathspecSinExcluidos(excluir);
-  const nombres = (args: readonly string[]): string[] =>
-    partirNul(runGit([...SIN_COMILLAS, 'diff', '--name-only', '-z', rango, ...args], cwd));
-
-  const todos = nombres([]);
-  const incluidos = excluir.length === 0 ? todos : nombres(sinExcluidos);
-  const enIncluidos = new Set(incluidos);
-  const excluidos = todos.filter((f) => !enIncluidos.has(f));
+  const { incluidos, excluidos } = ficherosParaRevision(desde, hasta, excluir, cwd);
   return {
     incluidos,
     excluidos,
@@ -334,6 +328,26 @@ export function diffParaRevision(
   };
 }
 
+/**
+ * Solo los nombres de `diffParaRevision` (incluidos y excluidos), sin el
+ * diff: lo que necesita quien solo quiere saber que revisoras tocan
+ * (TASK-082, `taskctl siguiente`), sin pagar el `git diff` entero.
+ */
+export function ficherosParaRevision(
+  desde: string,
+  hasta: string,
+  excluir: readonly string[],
+  cwd: string
+): Pick<DiffParaRevision, 'incluidos' | 'excluidos'> {
+  const rango = `${desde}..${hasta}`;
+  const nombres = (args: readonly string[]): string[] =>
+    partirNul(runGit([...SIN_COMILLAS, 'diff', '--name-only', '-z', rango, ...args], cwd));
+  const todos = nombres([]);
+  const incluidos = excluir.length === 0 ? todos : nombres(pathspecSinExcluidos(excluir));
+  const enIncluidos = new Set(incluidos);
+  return { incluidos, excluidos: todos.filter((f) => !enIncluidos.has(f)) };
+}
+
 /**
  * Pathspec «todo el repo menos los excluidos». Lo comparten el diff de la
  * peticion de revision y las lineas cambiadas de la cobertura (TASK-074):
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/revisores-rango.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/revisores-rango.ts
new file mode 100644
index 0000000..4c719f3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/revisores-rango.ts
@@ -0,0 +1,38 @@
+/**
+ * TASK-082: que revisoras tocan a un rango de commits, con el MISMO
+ * clasificador y las MISMAS exclusiones que usa `taskctl review` para
+ * repartir la revision. Lo comparten `review` (que ademas necesita los
+ * ficheros de cada grupo) y `siguiente --json` (que da los nombres, para que
+ * el implementador sepa que listas pasar en su autorrevision).
+ *
+ * Una sola fuente a proposito: si la skill le pidiera al modelo que aplicara
+ * los `patrones_archivo` a ojo, habria una segunda copia del clasificador, y
+ * las copias de esos patrones ya divergieron dos veces.
+ */
+import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
+import { EXCLUIR_HELDOUT } from '../core/heldout.js';
+import { ficherosParaRevision } from './git.js';
+
+/**
+ * Patrones que nunca entran en una revision: los de `excluir_de_revision`
+ * del config mas los tests held-out, que no se embeben se configure lo que
+ * se configure (TASK-073).
+ */
+export function excluirDeRevision(excluirConfig: readonly string[]): string[] {
+  return [...new Set([...excluirConfig, EXCLUIR_HELDOUT])];
+}
+
+/**
+ * Nombres de las skills revisoras que repartiria `review` para `desde..hasta`,
+ * en el orden de sus grupos. Sin ficheros incluidos, la generica (como haria
+ * `review`).
+ */
+export function revisoresDelRango(
+  desde: string,
+  hasta: string,
+  excluir: readonly string[],
+  cwd: string
+): string[] {
+  const { incluidos } = ficherosParaRevision(desde, hasta, excluir, cwd);
+  return clasificarPorDominio(incluidos, cargarCatalogoRevisores()).grupos.map((g) => g.revisor);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-autorrevision.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-autorrevision.test.ts
new file mode 100644
index 0000000..46b431c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-autorrevision.test.ts
@@ -0,0 +1,149 @@
+/**
+ * TASK-082: la autorrevision del implementador antes de `taskctl review`.
+ *
+ * Contra repos Git temporales de verdad (review-fixtures):
+ * - `review` avisa, sin bloquear, si tarea.md no tiene `## Autorrevision`
+ *   con contenido, y no avisa si la tiene;
+ * - `siguiente --json` da en la fase review las MISMAS revisoras que despues
+ *   reparte `review`, calculadas desde la merge base (lo que la base trajo
+ *   despues no cuenta).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runReviewCommand } from '../../src/commands/review.js';
+import { runSiguienteCommand } from '../../src/commands/siguiente.js';
+import {
+  HERE,
+  SCRIPTS_DIR,
+  sampleTask,
+  commitAll,
+  withTempRepo,
+  advanceDevelop,
+  escribirFichero,
+  setupTaskEnCursoSoloTarea,
+} from '../helpers/review-fixtures.js';
+
+const TASKCTL = path.join(HERE, '..', '..', '..', 'bin', 'taskctl');
+const AVISO = /no tiene la constancia de la autorrevision/;
+
+/** Rama de la tarea con un fichero Java y otro Angular, y develop avanzado. */
+async function tareaConDosDominios(
+  repoRoot: string,
+  tareasRoot: string,
+  id: string,
+  cuerpoExtra: string | null
+): Promise<void> {
+  const task = sampleTask({ id, rama: `feature/${id.toLowerCase()}-autorrevision` });
+  await setupTaskEnCursoSoloTarea(repoRoot, tareasRoot, task);
+  await escribirFichero(repoRoot, 'src/main/java/com/acme/UserService.java', 'class UserService {}\n');
+  await escribirFichero(
+    repoRoot,
+    'src/app/user-profile/user-profile.component.ts',
+    'export class UserProfileComponent {}\n'
+  );
+  if (cuerpoExtra !== null) {
+    const leida = await readTareaFile(tareasRoot, id);
+    await writeTareaFile(tareasRoot, leida!.task, `${leida!.body.trimEnd()}\n\n${cuerpoExtra}`);
+  }
+  commitAll(repoRoot, 'trabajo de la tarea');
+  // develop avanza con un fichero sin dominio: si `siguiente` midiera desde
+  // la punta de develop y no desde la merge base, entraria la generica.
+  await advanceDevelop(repoRoot, task.rama);
+}
+
+const deps = (repoRoot: string) => ({ repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+
+test('review sin "## Autorrevision" avisa y no bloquea: la ronda se crea y la tarea pasa a en-revision', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-820', null);
+    const result = await runReviewCommand(tareasRoot, ['TASK-820'], '2026-11-07', deps(repoRoot));
+    assert.equal(result.avisos.filter((a) => AVISO.test(a)).length, 1, result.avisos.join('\n'));
+    assert.equal(result.informes.length, 2);
+    const leida = await readTareaFile(tareasRoot, 'TASK-820');
+    assert.equal(leida!.task.estado, 'en-revision');
+  });
+});
+
+test('review con "## Autorrevision" con contenido no avisa', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await tareaConDosDominios(
+      repoRoot,
+      tareasRoot,
+      'TASK-821',
+      '## Autorrevision\n\n- java-spring-reviewer — abc1234\n- angular-vue-reviewer — abc1234\n'
+    );
+    const result = await runReviewCommand(tareasRoot, ['TASK-821'], '2026-11-07', deps(repoRoot));
+    assert.deepEqual(result.avisos.filter((a) => AVISO.test(a)), []);
+  });
+});
+
+test('review con el encabezado "## Autorrevision" vacio avisa: el encabezado solo no es constancia', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-822', '## Autorrevision\n\n<!-- una linea por revisora -->\n');
+    const result = await runReviewCommand(tareasRoot, ['TASK-822'], '2026-11-07', deps(repoRoot));
+    assert.equal(result.avisos.filter((a) => AVISO.test(a)).length, 1);
+  });
+});
+
+test('CLI: el aviso sale por stderr como [AVISO] y review termina con 0', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-823', null);
+    const r = spawnSync(process.execPath, [TASKCTL, 'review', 'TASK-823'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(r.status, 0, r.stderr + r.stdout);
+    assert.match(r.stderr, /\[AVISO\] TASK-823: tarea\.md no tiene la constancia de la autorrevision/);
+    assert.doesNotMatch(r.stdout, AVISO);
+  });
+});
+
+test('siguiente --json en fase review da las mismas revisoras que reparte review, desde la merge base', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-824', null);
+    const paso = await runSiguienteCommand(tareasRoot, ['TASK-824', '--json'], { repoCwd: repoRoot });
+    assert.equal(paso.fase, 'review');
+    assert.ok(paso.revisores !== undefined, 'siguiente no da revisores en la fase review');
+
+    const result = await runReviewCommand(tareasRoot, ['TASK-824'], '2026-11-07', deps(repoRoot));
+    assert.deepEqual(
+      [...paso.revisores].sort(),
+      result.informes.map((g) => g.revisor).sort(),
+      'siguiente y review no reparten las mismas revisoras'
+    );
+    assert.deepEqual([...paso.revisores].sort(), ['angular-vue-reviewer', 'java-spring-reviewer']);
+
+    // Fuera de la fase review no hay campo.
+    const despues = await runSiguienteCommand(tareasRoot, ['TASK-824', '--json'], { repoCwd: repoRoot });
+    assert.notEqual(despues.fase, 'review');
+    assert.equal(despues.revisores, undefined);
+  });
+});
+
+test('siguiente --json en fase review sin la rama de la tarea en local: sin campo revisores y sin error', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // En curso en develop y sin rama local (p. ej. solo en el remoto).
+    const task = sampleTask({ id: 'TASK-826', rama: 'feature/task-826-sin-rama-local' });
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el caso sin rama.\n');
+    commitAll(repoRoot, 'tarea sin rama local');
+    const paso = await runSiguienteCommand(tareasRoot, ['TASK-826', '--json'], { repoCwd: repoRoot });
+    assert.equal(paso.fase, 'review');
+    assert.equal('revisores' in paso, false);
+  });
+});
+
+test('siguiente --json desde develop lee las revisoras de la rama de la tarea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await tareaConDosDominios(repoRoot, tareasRoot, 'TASK-825', null);
+    spawnSync('git', ['checkout', '-q', 'develop'], { cwd: repoRoot });
+    // En develop la tarea no existe: se crea la copia de la rama base que
+    // dejaria start (planificada en develop, en-curso en su rama).
+    const task = sampleTask({ id: 'TASK-825', rama: 'feature/task-825-autorrevision' });
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nProbar el enrutado por dominio.\n');
+    commitAll(repoRoot, 'copia en develop');
+    const paso = await runSiguienteCommand(tareasRoot, ['TASK-825', '--json'], { repoCwd: repoRoot });
+    assert.equal(paso.leidaDe, 'rama');
+    assert.equal(paso.fase, 'review');
+    assert.deepEqual([...(paso.revisores ?? [])].sort(), ['angular-vue-reviewer', 'java-spring-reviewer']);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts
new file mode 100644
index 0000000..641e99d
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/autorrevision.test.ts
@@ -0,0 +1,61 @@
+/**
+ * TASK-082: que cuenta como constancia de la autorrevision en tarea.md.
+ * Funcion pura: cadenas de entrada, sin disco ni Git.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { avisoAutorrevision, tieneAutorrevision, SECCION_AUTORREVISION } from '../../src/core/autorrevision.js';
+
+const BASE = '## Objetivo\n\nAlgo.\n\n## Criterios de aceptacion\n- [ ] uno\n';
+
+test('sin la seccion no hay constancia, y el aviso nombra la tarea y dice que hacer', () => {
+  assert.equal(tieneAutorrevision(BASE), false);
+  const aviso = avisoAutorrevision(BASE, 'TASK-900');
+  assert.ok(aviso !== null);
+  assert.match(aviso, /^TASK-900: /);
+  assert.ok(aviso.includes(SECCION_AUTORREVISION));
+  assert.match(aviso, /## Que se revisa/);
+  assert.match(aviso, /revisores/);
+});
+
+test('con una linea debajo del encabezado hay constancia y no hay aviso', () => {
+  const body = `${BASE}\n${SECCION_AUTORREVISION}\n\n- code-quality-reviewer — abc1234\n`;
+  assert.equal(tieneAutorrevision(body), true);
+  assert.equal(avisoAutorrevision(body, 'TASK-900'), null);
+});
+
+test('CRLF tambien cuenta', () => {
+  const body = `${BASE}\n${SECCION_AUTORREVISION}\n\n- code-quality-reviewer — abc1234\n`.replace(/\n/g, '\r\n');
+  assert.equal(tieneAutorrevision(body), true);
+});
+
+test('el encabezado solo, en blanco o con un comentario, no es constancia', () => {
+  assert.equal(tieneAutorrevision(`${BASE}\n${SECCION_AUTORREVISION}\n\n`), false);
+  assert.equal(tieneAutorrevision(`${BASE}\n${SECCION_AUTORREVISION}\n\n<!-- una linea por revisora -->\n`), false);
+  assert.equal(
+    tieneAutorrevision(`${BASE}\n${SECCION_AUTORREVISION}\n\n<!--\nvarias\nlineas\n-->\n`),
+    false
+  );
+});
+
+test('una seccion vacia seguida de otra seccion con contenido no es constancia', () => {
+  const body = `${BASE}\n${SECCION_AUTORREVISION}\n\n## Resultado\n\nHecho.\n`;
+  assert.equal(tieneAutorrevision(body), false);
+});
+
+test('el encabezado dentro de un bloque de codigo no cuenta', () => {
+  const body = `${BASE}\n\`\`\`\n${SECCION_AUTORREVISION}\n- x — y\n\`\`\`\n`;
+  assert.equal(tieneAutorrevision(body), false);
+});
+
+test('el titulo es exacto: con tilde o con otro nivel no cuenta', () => {
+  assert.equal(tieneAutorrevision(`${BASE}\n## Autorrevisión\n\n- x — y\n`), false);
+  assert.equal(tieneAutorrevision(`${BASE}\n### Autorrevision\n\n- x — y\n`), false);
+});
+
+test('nunca lanza, ni con entradas raras', () => {
+  for (const body of ['', '\n', '##', `${SECCION_AUTORREVISION}`, '```\n', '<!--', '\r\n\r\n']) {
+    assert.doesNotThrow(() => avisoAutorrevision(body, 'TASK-900'));
+  }
+  assert.equal(tieneAutorrevision(`${SECCION_AUTORREVISION}\n- a — b`), true);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/autorrevision.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/autorrevision.test.ts
new file mode 100644
index 0000000..949494c
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/autorrevision.test.ts
@@ -0,0 +1,86 @@
+/**
+ * TASK-082: las listas de comprobacion de las revisoras viven en un solo
+ * sitio — la seccion `## Que se revisa` de cada skill revisora — y la leen
+ * tanto el revisor como la autorrevision de la skill `review`, que remite a
+ * ella sin copiarla.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFile, stat } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { cargarCatalogoRevisores } from '../../src/core/revisores.js';
+import { SECCION_AUTORREVISION } from '../../src/core/autorrevision.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SKILLS_DIR = path.join(HERE, '..', '..', '..', 'skills');
+const REVIEW_MD = path.join(SKILLS_DIR, 'review', 'SKILL.md');
+const SECCION = '## Que se revisa';
+
+/** Lineas de la seccion `## Que se revisa` (sin el encabezado), hasta el siguiente `## `. */
+function seccionQueSeRevisa(texto: string): string[] {
+  const lineas = texto.split(/\r?\n/);
+  const inicio = lineas.findIndex((l) => l.trimEnd() === SECCION);
+  if (inicio === -1) return [];
+  let fin = inicio + 1;
+  while (fin < lineas.length && !/^## /.test(lineas[fin] as string)) fin++;
+  return lineas.slice(inicio + 1, fin);
+}
+
+function nombresRevisoras(): string[] {
+  const catalogo = cargarCatalogoRevisores();
+  return [...catalogo.dominio.map((r) => r.nombre), catalogo.generico.nombre];
+}
+
+test('el catalogo sigue teniendo 4 revisoras de dominio y la generica (ninguna se cae al tocar sus SKILL.md)', () => {
+  const catalogo = cargarCatalogoRevisores();
+  assert.deepEqual(
+    catalogo.dominio.map((r) => r.nombre).sort(),
+    ['angular-vue-reviewer', 'csharp-autocad-ifc-reviewer', 'java-spring-reviewer', 'rust-wasm-reviewer']
+  );
+  assert.equal(catalogo.generico.nombre, 'code-quality-reviewer');
+});
+
+test('cada revisora tiene exactamente una seccion "## Que se revisa", con contenido', async () => {
+  for (const nombre of nombresRevisoras()) {
+    const texto = await readFile(path.join(SKILLS_DIR, nombre, 'SKILL.md'), 'utf8');
+    const encabezados = texto.split(/\r?\n/).filter((l) => l.trimEnd() === SECCION);
+    assert.equal(encabezados.length, 1, `${nombre}: ${encabezados.length} encabezados "${SECCION}" exactos`);
+    assert.ok(seccionQueSeRevisa(texto).join('').trim().length > 200, `${nombre}: la seccion esta casi vacia`);
+  }
+});
+
+test('la skill review manda la autorrevision: remite a "## Que se revisa", al campo revisores y a la constancia', async () => {
+  const texto = await readFile(REVIEW_MD, 'utf8');
+  assert.ok(texto.includes(`\`${SECCION}\``), 'no remite a la seccion de las revisoras');
+  assert.ok(texto.includes(`\`${SECCION_AUTORREVISION}\``), 'no dice donde dejar la constancia');
+  assert.match(texto, /`revisores`/, 'no dice de donde sale la lista de revisoras');
+  assert.match(texto, /`- <revisora> — <commit>`/, 'no fija el formato de la linea');
+  assert.match(texto, /\.\.\/<revisora>\/SKILL\.md/, 'no dice donde esta la skill de cada revisora');
+  // La autorrevision va en el paso 2, antes de lanzar a los revisores.
+  const autorrevision = texto.indexOf('**Autorrevision**');
+  assert.ok(autorrevision !== -1, 'no hay bloque de autorrevision');
+  assert.ok(autorrevision < texto.indexOf('3. Por cada'), 'la autorrevision no esta en el paso 2');
+});
+
+test('la ruta relativa que da la skill review llega a la SKILL.md de cada revisora', async () => {
+  for (const nombre of nombresRevisoras()) {
+    const ruta = path.join(path.dirname(REVIEW_MD), '..', nombre, 'SKILL.md');
+    assert.ok((await stat(ruta)).isFile(), `${ruta} no existe`);
+  }
+});
+
+test('la skill review no copia ninguna linea de las listas: viven solo en cada revisora', async () => {
+  const review = await readFile(REVIEW_MD, 'utf8');
+  let comprobadas = 0;
+  for (const nombre of nombresRevisoras()) {
+    const texto = await readFile(path.join(SKILLS_DIR, nombre, 'SKILL.md'), 'utf8');
+    for (const linea of seccionQueSeRevisa(texto)) {
+      const l = linea.trim();
+      if (l.length < 40) continue;
+      comprobadas++;
+      assert.ok(!review.includes(l), `review/SKILL.md copia de ${nombre}: "${l}"`);
+    }
+  }
+  assert.ok(comprobadas > 50, `solo ${comprobadas} lineas comprobadas: el test no mide nada`);
+});
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-082/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-082/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-082/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-082/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-082/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-082/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-082/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 11 +++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/siguiente.js                                  | 31 ++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/autorrevision.js                                  | 41 +++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                              | 19 ++++++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/revisores-rango.js                                  | 31 +++++++++++++++++++++++++++++++
 12 files changed, 129 insertions(+), 11 deletions(-)
````
