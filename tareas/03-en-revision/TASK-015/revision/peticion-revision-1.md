# Peticion de revision — TASK-015 (ronda 1)

- Tarea: TASK-015 — Límite de trabajo en curso por persona
- Rama revisada: feature/task-015-limite-de-trabajo-en-curso-por-persona
- Rama base: develop
- Commit revisado (HEAD): 809d9183b75b76e0a0dd30082a9a2ceb2018db1b
- Fecha: 2026-09-05
- Agente revisor sugerido: typescript-reviewer

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
809d918 feat(TASK-015): limite de trabajo en curso por persona
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-015/plan-final.md b/tareas/02-en-curso/TASK-015/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-015/plan-final.md
rename to tareas/02-en-curso/TASK-015/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-015/tarea.md b/tareas/02-en-curso/TASK-015/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-015/tarea.md
rename to tareas/02-en-curso/TASK-015/tarea.md
index e320cd6..ad71259 100644
--- a/tareas/01-en-diseno/TASK-015/tarea.md
+++ b/tareas/02-en-curso/TASK-015/tarea.md
@@ -6,7 +6,7 @@ sprint: 2
 etiquetas: []
 complejidad: simple
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-015-limite-de-trabajo-en-curso-por-persona
 asignado_a: carlos
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index 6bdad97..c42bc96 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -14,7 +14,13 @@
 import { parseArgs } from '../cli/args.js';
 import { parseAsignadoAFlag, PISTA_VACIO_ESCRITURA } from '../cli/asignado.js';
 import type { Task } from '../core/task.js';
-import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
+import { readTareaFile, moveTareaFile, listTareasEnEstados } from '../fs/task-store.js';
+import {
+  ESTADOS_QUE_OCUPAN_WIP,
+  tareasQueBloquean,
+  mensajeWipExcedido,
+  mensajeWipIndeterminado,
+} from '../core/wip.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
 import { isWorkspaceClean, currentBranch, isValidBranchName } from '../fs/git.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
@@ -89,6 +95,36 @@ export async function runStartCommand(
     );
   }
 
+  // Limite de trabajo en curso (TASK-015, item B7). Va aqui, ANTES de
+  // tocar Git, por lo mismo que el resto de guardas de este comando:
+  // rechazar sin haber creado una rama que luego habria que borrar a
+  // mano.
+  //
+  // asignadoFinal se resuelve una sola vez y se usa para dos cosas: la
+  // comprobacion de aqui y el frontmatter que se escribe al final. Sin
+  // esto, un start --asignado-a otra-persona comprobaria el limite
+  // contra quien la tenia asignada antes y luego escribiria a otra: se
+  // comprobaria a la persona equivocada.
+  const asignadoFinal = asignadoA !== undefined ? asignadoA : task.asignado_a;
+
+  // Una tarea sin asignar no tiene a quien aplicarle un limite. Es el
+  // caso de todo lo anterior a B6 (asignado_a nace a null), asi que
+  // bloquearlo aqui romperia el flujo de quien no use el flag.
+  if (asignadoFinal !== null) {
+    const { tareas, ilegibles } = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+    // Fail-closed acotado: un tarea.md ilegible en las carpetas de
+    // ejecucion podria ser justo el que bloquea, y no hay forma de
+    // saberlo. Solo esas dos carpetas: una tarea rota en
+    // 00-planificadas no ocupa hueco, asi que no debe bloquear a nadie.
+    if (ilegibles.length > 0) {
+      throw new StartCommandError(mensajeWipIndeterminado(task.id, ilegibles));
+    }
+    const bloqueantes = tareasQueBloquean(tareas, asignadoFinal, task.id);
+    if (bloqueantes.length > 0) {
+      throw new StartCommandError(mensajeWipExcedido(task.id, asignadoFinal, bloqueantes));
+    }
+  }
+
   // Defensa en profundidad (hallazgo menor de revision por pares): sin
   // esto, un task.rama invalido solo se detecta varios procesos mas
   // abajo, dentro del propio script de Git-Flow.
@@ -122,13 +158,10 @@ export async function runStartCommand(
     );
   }
 
-  // Sin flag se conserva el asignado_a que "plan" dejara puesto (la
-  // seccion 8.2 describe start comprobando "la persona asignada", en
-  // pasado). Con flag, start reasigna: es el punto donde nace la rama,
-  // y quien la abre puede no ser quien diseno la tarea — o puede que
-  // nadie asignara nada en plan, en cuyo caso B7 no tendria sobre quien
-  // comprobar el limite de WIP.
-  const asignadoFinal = asignadoA !== undefined ? asignadoA : task.asignado_a;
+  // asignadoFinal ya se resolvio arriba, junto a la comprobacion del
+  // limite de WIP, para no calcularlo dos veces ni arriesgarse a que
+  // las dos copias diverjan: se comprueba el limite de la MISMA
+  // persona que se acaba escribiendo en el frontmatter.
   const asignadoCambiado = asignadoFinal !== task.asignado_a;
 
   const updated: Task = {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
new file mode 100644
index 0000000..1f44377
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/wip.ts
@@ -0,0 +1,129 @@
+/**
+ * Limite de trabajo en curso (WIP) por persona — TASK-015, item B7 del
+ * checklist de terminacion. Modulo puro: recibe las tareas ya leidas y
+ * decide; no toca disco ni Git.
+ *
+ * ALCANCE, que lo fija la decision #13 y NO coincide con la seccion
+ * 8.2 de la metodologia: un UNICO limite, y solo sobre la ejecucion.
+ *
+ * - "taskctl plan" no comprueba nada. En diseno no hay tope: se pueden
+ *   tener varias tareas en 01-en-diseno a la vez.
+ * - "taskctl start" aborta si la persona asignada ya tiene otra tarea
+ *   en 02-en-curso o en 03-en-revision.
+ *
+ * La 8.2 describe dos limites independientes, uno de ellos sobre el
+ * diseno ("carlos ya tiene TASK-009 en diseno"). La metodologia esta
+ * congelada, asi que la divergencia se documenta en HALLAZGOS.md en
+ * vez de reescribirla.
+ *
+ * Por que 03-en-revision ocupa hueco: la rama de una tarea en revision
+ * sigue viva y sin mergear hasta "taskctl finish", y es ahi donde se
+ * commitean las correcciones de los hallazgos. Si el hueco se liberara
+ * al pasar a revision, quedarian dos ramas abiertas y los commits de
+ * correccion de la primera acabarian en la segunda — exactamente el
+ * fallo que este limite existe para evitar ("evitar que se programe
+ * codigo de una tarea en la rama Git de otra tarea", Carlos, #13).
+ */
+import { STATE_FOLDER, type Task, type TaskState } from './task.js';
+
+/**
+ * Estados cuya carpeta ocupa el hueco de ejecucion. Un unico sitio
+ * donde esta escrita la regla: el dia que exista .taskcode/config.yml
+ * (item C4) y se quiera un limite configurable, se toca aqui.
+ */
+export const ESTADOS_QUE_OCUPAN_WIP: readonly TaskState[] = ['en-curso', 'en-revision'];
+
+/**
+ * Tareas de `persona` que ocupan el hueco, excluida la que se intenta
+ * arrancar. Devuelve la lista ordenada por ID para que el mensaje de
+ * error sea reproducible: las tareas llegan aqui en el orden en que el
+ * disco las entrego, que no es estable.
+ *
+ * `tareas` deben venir ya filtradas a ESTADOS_QUE_OCUPAN_WIP (es lo
+ * que hace listTareasEnEstados); esta funcion no vuelve a mirar el
+ * estado, solo la persona.
+ *
+ * La comparacion de persona es EXACTA y sensible a mayusculas, sobre
+ * el valor ya recortado que escribe parseAsignadoAFlag (B6).
+ * "asignado_a" es texto libre y ningun otro punto del sistema trata
+ * "Carlos" y "carlos" como la misma persona — inventar aqui una
+ * equivalencia que "taskctl board" no tiene crearia una incoherencia
+ * nueva.
+ */
+export function tareasQueBloquean(
+  tareas: readonly Task[],
+  persona: string,
+  idQueArranca: string
+): Task[] {
+  return tareas
+    .filter((t) => t.id !== idQueArranca && t.asignado_a === persona)
+    .sort((a, b) => a.id.localeCompare(b.id));
+}
+
+/** Una linea por tarea bloqueante: ID, titulo, carpeta y rama. */
+function describirBloqueante(t: Task): string {
+  return `          - ${t.id} "${t.titulo}" (${STATE_FOLDER[t.estado]}, rama ${t.rama})`;
+}
+
+/**
+ * Mensaje de "no puedes arrancar esta". Nombra explicitamente la tarea
+ * que bloquea (criterio de aceptacion de TASK-015) y dice QUE HACER,
+ * no solo que ha fallado — mismo estilo que log_error de los scripts
+ * de Git-Flow y que el resto de errores de taskctl.
+ */
+export function mensajeWipExcedido(
+  idQueArranca: string,
+  persona: string,
+  bloqueantes: readonly Task[]
+): string {
+  const primera = bloqueantes[0] as Task;
+  const lineas: string[] = [];
+
+  if (bloqueantes.length === 1) {
+    lineas.push(
+      `[ERROR] ${idQueArranca}: ${persona} ya tiene ${primera.id} sin cerrar ` +
+        `(${STATE_FOLDER[primera.estado]}, rama ${primera.rama}).`
+    );
+  } else {
+    // Mas de una solo puede pasar si el repo ya estaba en un estado
+    // inconsistente (el limite es de una): se listan todas en vez de
+    // enganar nombrando solo la primera.
+    lineas.push(
+      `[ERROR] ${idQueArranca}: ${persona} ya tiene ${bloqueantes.length} tareas sin cerrar:`
+    );
+    for (const t of bloqueantes) lineas.push(describirBloqueante(t));
+  }
+
+  lineas.push(
+    '        Una sola tarea en curso por persona: esa rama sigue abierta y sin mergear,'
+  );
+  lineas.push(
+    '        y ahi es donde se commitean las correcciones de su revision.'
+  );
+  lineas.push(
+    `        Cierra ${primera.id} con "taskctl finish ${primera.id}", o reasigna una de las ` +
+      'dos con --asignado-a.'
+  );
+
+  return lineas.join('\n');
+}
+
+/**
+ * Mensaje de "no puedo saberlo": hay un tarea.md ilegible en una de
+ * las carpetas que ocupan hueco, asi que no se puede descartar que sea
+ * de esta persona. Fail-closed a proposito — la duda aqui autorizaria
+ * abrir una segunda rama.
+ */
+export function mensajeWipIndeterminado(idQueArranca: string, ilegibles: readonly string[]): string {
+  const lineas = [
+    `[ERROR] ${idQueArranca}: no se puede comprobar el limite de trabajo en curso porque ` +
+      `${ilegibles.length === 1 ? 'hay una tarea ilegible' : 'hay tareas ilegibles'} en las ` +
+      'carpetas de ejecucion:',
+  ];
+  for (const ruta of ilegibles) lineas.push(`          - ${ruta}`);
+  lineas.push(
+    '        No se sabe de quien son, asi que podrian ser justo las que bloquean.'
+  );
+  lineas.push('        Arregla su frontmatter y reintenta.');
+  return lineas.join('\n');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
index 7b38fb6..4c99eb5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts
@@ -13,7 +13,7 @@
  */
 import { readdir, readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
 import path from 'node:path';
-import { STATE_FOLDER, assertValidTaskId, type Task } from '../core/task.js';
+import { STATE_FOLDER, assertValidTaskId, type Task, type TaskState } from '../core/task.js';
 import { parseTareaFile, serializeTareaFile } from '../core/tarea-file.js';
 
 const ALL_STATE_FOLDERS: readonly string[] = Object.values(STATE_FOLDER);
@@ -37,6 +37,81 @@ export async function listExistingTaskIds(tareasRoot: string): Promise<string[]>
   return ids;
 }
 
+export interface TareasEnEstadosResult {
+  /** Tareas leidas y validadas, deduplicadas por ID. */
+  tareas: Task[];
+  /**
+   * Rutas de tarea.md que existen pero no se pudieron parsear ni
+   * validar. Se devuelven en vez de lanzar para que el llamador decida
+   * qué hacer: "taskctl start" (TASK-015) aborta si aparece alguna,
+   * porque no sabe de quién es y podria ser la que bloquea el limite.
+   */
+  ilegibles: string[];
+}
+
+/**
+ * Lee las tareas que viven en las carpetas de `estados`, y solo esas
+ * (TASK-015). A diferencia de listExistingTaskIds + readTareaFile, no
+ * recorre el ciclo de vida entero: el limite de WIP solo mira dos
+ * carpetas, y readTareaFile busca por ID en todas, asi que usarlo aqui
+ * leeria de mas y ademas no diria en qué carpeta encontro cada tarea.
+ *
+ * Deduplica por ID: si el mismo ID aparece en dos carpetas de estado a
+ * la vez (inconsistencia de datos que "taskctl board" ya reporta como
+ * advertencia), ocupa un hueco, no dos. Gana la primera segun el orden
+ * de `estados`.
+ *
+ * Las rutas se construyen solo con nombres de directorio que ya
+ * pasaron TASK_ID_RE, asi que no hay ID de fuera que llegue a
+ * componer una ruta (misma precaucion que assertValidTaskId en el
+ * resto del modulo).
+ */
+export async function listTareasEnEstados(
+  tareasRoot: string,
+  estados: readonly TaskState[]
+): Promise<TareasEnEstadosResult> {
+  const porId = new Map<string, Task>();
+  const ilegibles: string[] = [];
+
+  for (const estado of estados) {
+    const dir = path.join(tareasRoot, STATE_FOLDER[estado]);
+    let entries: string[];
+    try {
+      entries = await readdir(dir);
+    } catch (e: unknown) {
+      if (isEnoent(e)) continue;
+      throw e;
+    }
+    for (const entry of entries) {
+      if (!TASK_ID_RE.test(entry)) continue;
+      if (porId.has(entry)) continue;
+      const filePath = path.join(dir, entry, 'tarea.md');
+      let content: string;
+      try {
+        content = await readFile(filePath, 'utf8');
+      } catch (e: unknown) {
+        // Una carpeta de tarea sin tarea.md dentro no es una tarea:
+        // no ocupa hueco ni impide comprobarlo.
+        if (isEnoent(e)) continue;
+        throw e;
+      }
+      try {
+        porId.set(entry, parseTareaFile(content).task);
+      } catch {
+        // Frontmatter roto o Task invalido. No se propaga: el llamador
+        // decide (ver TareasEnEstadosResult.ilegibles). Cualquier otro
+        // error de I/O si se propaga, arriba.
+        ilegibles.push(filePath);
+      }
+    }
+  }
+
+  // Orden estable: el orden de readdir depende del filesystem, y estas
+  // tareas acaban en un mensaje de error que los tests aseveran.
+  ilegibles.sort();
+  return { tareas: [...porId.values()], ilegibles };
+}
+
 export class TaskAlreadyExistsError extends Error {
   constructor(public readonly id: string, public readonly filePath: string) {
     super(`Ya existe un tarea.md para ${id} en ${filePath}.`);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
index 3b8ff21..6062858 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts
@@ -26,6 +26,12 @@ async function withTempRepoCwd(fn: (repoRoot: string) => Promise<void>): Promise
     git(['init', '-q', '-b', 'main'], repoRoot);
     git(['config', 'user.email', 'test@example.com'], repoRoot);
     git(['config', 'user.name', 'Test'], repoRoot);
+    // logs/ en .gitignore ANTES del primer commit: los scripts de
+    // Git-Flow escriben ahi, y si no esta ignorado el workspace queda
+    // sucio y el propio script cancela en silencio con exit 0 (hallazgo
+    // 2 de TASK-007). Hace falta desde que un test de aqui invoca
+    // taskctl start (TASK-015); mismo patron que start.test.ts.
+    await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
     await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
     git(['add', '-A'], repoRoot);
     git(['commit', '-q', '-m', 'inicial'], repoRoot);
@@ -158,3 +164,49 @@ test('main: un --asignado-a sin valor sale con codigo 1 y mensaje util, no con u
     assert.equal(stderr.indexOf('[ERROR]'), stderr.lastIndexOf('[ERROR]'));
   });
 });
+
+// --- TASK-015 (item B7): el limite visto desde el CLI ---
+
+test('main: taskctl start sale con codigo 1 y mensaje util cuando el limite esta ocupado', async () => {
+  await withTempRepoCwd(async (repoRoot) => {
+    // Un commit entre los dos "new" y entre los dos "plan": el guard
+    // de la seccion 8.3 exige workspace limpio, asi que dos altas
+    // seguidas sin commitear en medio abortan (limitacion ya
+    // documentada en HALLAZGOS.md para taskctl import).
+    const uno = await captureOutput(() => main(['new', '--titulo', 'Primera de carlos', '--tipo', 'feature', '--complejidad', 'simple']));
+    assert.equal(uno.code, 0, uno.stderr);
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'primera tarea'], repoRoot);
+
+    const dos = await captureOutput(() => main(['new', '--titulo', 'Segunda de carlos', '--tipo', 'feature', '--complejidad', 'simple']));
+    assert.equal(dos.code, 0, dos.stderr);
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'segunda tarea'], repoRoot);
+
+    const p1 = await captureOutput(() => main(['plan', 'TASK-001', '--asignado-a', 'carlos']));
+    assert.equal(p1.code, 0, p1.stderr);
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'primera en diseno'], repoRoot);
+
+    const p2 = await captureOutput(() => main(['plan', 'TASK-002', '--asignado-a', 'carlos']));
+    // Esta es la otra mitad de la decision #13: dos tareas en diseno
+    // de la misma persona a la vez son legales.
+    assert.equal(p2.code, 0, p2.stderr);
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'segunda en diseno'], repoRoot);
+
+    const primera = await captureOutput(() => main(['start', 'TASK-001']));
+    assert.equal(primera.code, 0, primera.stderr);
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'primera en curso'], repoRoot);
+
+    const segunda = await captureOutput(() => main(['start', 'TASK-002']));
+
+    assert.equal(segunda.code, 1);
+    assert.ok(segunda.stderr.includes('TASK-001'), segunda.stderr);
+    assert.ok(segunda.stderr.includes('carlos'), segunda.stderr);
+    assert.ok(segunda.stderr.includes('taskctl finish TASK-001'), segunda.stderr);
+    // Un solo prefijo [ERROR], no uno por linea (printCliError).
+    assert.equal(segunda.stderr.indexOf('[ERROR]'), segunda.stderr.lastIndexOf('[ERROR]'));
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
index 57800cb..91658e2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/plan.test.ts
@@ -438,3 +438,29 @@ test('taskctl plan --asignado-a invalido: falla ANTES de mover la tarea ni cambi
     assert.equal(read?.task.asignado_a, null);
   });
 });
+
+// --- TASK-015 (item B7): en diseno NO hay limite ---
+
+test('taskctl plan: NO comprueba el limite de WIP, aunque la persona tenga una tarea en curso', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // La decision #13 es explicita: el limite es unico y solo de
+    // ejecucion. Disenar no consume el recurso escaso (la rama), asi
+    // que se pueden tener varias tareas en diseno a la vez.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-701', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-701-ya-abierta' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-700' }), '');
+    commitAll(repoRoot, 'carlos con una tarea ya en curso');
+
+    const result = await runPlanCommand(tareasRoot, ['TASK-700', '--asignado-a', 'carlos'], '2026-09-05', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(result.asignadoA, 'carlos');
+    const read = await readTareaFile(tareasRoot, 'TASK-700');
+    assert.equal(read?.task.estado, 'en-diseno');
+    assert.equal(read?.task.asignado_a, 'carlos');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
index db1c2c7..f14e676 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
@@ -9,7 +9,7 @@
  */
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { mkdtemp, rm, writeFile, stat } from 'node:fs/promises';
+import { mkdtemp, rm, writeFile, stat, mkdir } from 'node:fs/promises';
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
@@ -392,3 +392,202 @@ test('taskctl start --asignado-a invalido: falla ANTES de crear la rama', async
     assert.equal(read?.task.asignado_a, null);
   });
 });
+
+// --- TASK-015 (item B7): limite de trabajo en curso ---
+
+test('taskctl start: bloquea si la persona ya tiene otra tarea en curso, y NO crea la rama', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Una tarea de carlos ya en curso, con su rama abierta.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-501-ya-abierta', titulo: 'La que bloquea' }),
+      ''
+    );
+    // Y la que carlos intenta arrancar ahora.
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-502', asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'tareas de carlos');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-502'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) =>
+        e instanceof StartCommandError &&
+        (e as Error).message.includes('TASK-501') &&
+        (e as Error).message.includes('carlos')
+    );
+
+    // Lo que de verdad importa: no queda una rama huerfana ni la
+    // tarea movida a medias.
+    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-500-prueba-de-integracion'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.equal(ramas.stdout.trim(), '');
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'develop');
+    const read = await readTareaFile(tareasRoot, 'TASK-502');
+    assert.equal(read?.task.estado, 'en-diseno');
+  });
+});
+
+test('taskctl start: una tarea en revision tambien bloquea (la rama sigue abierta)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-revision', asignado_a: 'carlos', rama: 'feature/task-501-en-revision' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ id: 'TASK-502', asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'carlos con una en revision');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-502'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) =>
+        e instanceof StartCommandError && (e as Error).message.includes('03-en-revision')
+    );
+  });
+});
+
+test('taskctl start: la tarea en curso de OTRA persona no bloquea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'ana', rama: 'feature/task-501-de-ana' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'tareas de dos personas');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'carlos');
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
+  });
+});
+
+test('taskctl start: una tarea sin asignar no comprueba limite y arranca', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Comportamiento de todo lo anterior a B6: asignado_a nace a
+    // null. Aunque haya otra tarea en curso, tambien sin asignar.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: null, rama: 'feature/task-501-sin-duenno' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: null }), '');
+    commitAll(repoRoot, 'tareas sin asignar');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, null);
+    const branch = spawnSync('git', ['branch', '--show-current'], { cwd: repoRoot, encoding: 'utf8' });
+    assert.equal(branch.stdout.trim(), 'feature/task-500-prueba-de-integracion');
+  });
+});
+
+test('taskctl start --asignado-a: el limite se comprueba a la persona NUEVA, no a la anterior', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // ana tiene una en curso; la tarea que arranca esta asignada a
+    // carlos, pero se reasigna a ana en el propio start. Si el
+    // limite se comprobara con el asignado ANTERIOR (carlos), esto
+    // pasaria y dejaria a ana con dos ramas abiertas.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'ana', rama: 'feature/task-501-de-ana' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'ana ocupada, tarea de carlos');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (e: unknown) =>
+        e instanceof StartCommandError &&
+        (e as Error).message.includes('ana') &&
+        (e as Error).message.includes('TASK-501')
+    );
+  });
+});
+
+test('taskctl start --asignado-a: reasignar a alguien libre desbloquea', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // La salida que ofrece el mensaje de error: reasignar. Si no
+    // funcionara, el consejo del mensaje seria mentira.
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', estado: 'en-curso', asignado_a: 'carlos', rama: 'feature/task-501-de-carlos' }),
+      ''
+    );
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'carlos ocupado');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500', '--asignado-a', 'ana'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.asignadoA, 'ana');
+    assert.equal(result.asignadoCambiado, true);
+    const read = await readTareaFile(tareasRoot, 'TASK-500');
+    assert.equal(read?.task.asignado_a, 'ana');
+  });
+});
+
+test('taskctl start: un tarea.md ilegible en las carpetas de ejecucion aborta (fail-closed)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // No se sabe de quien es esa tarea: podria ser justo la que
+    // bloquea. Dejar pasar aqui abriria una segunda rama.
+    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-599');
+    await mkdir(rota, { recursive: true });
+    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'una tarea rota en curso');
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof StartCommandError && (err as Error).message.includes('TASK-599')
+    );
+  });
+});
+
+test('taskctl start: una tarea rota en 00-planificadas NO bloquea a nadie', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // El fail-closed se acota a las carpetas que ocupan hueco: una
+    // tarea rota en planificadas no puede tener una rama abierta.
+    const rota = path.join(tareasRoot, '00-planificadas', 'TASK-599');
+    await mkdir(rota, { recursive: true });
+    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos' }), '');
+    commitAll(repoRoot, 'una tarea rota en planificadas');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-05', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-500');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
new file mode 100644
index 0000000..2daaf04
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/wip.test.ts
@@ -0,0 +1,142 @@
+/**
+ * Tests de la regla del limite de WIP (TASK-015, item B7). Modulo
+ * puro: no toca disco ni Git. Los tests de punta a punta contra repos
+ * Git reales viven en start.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  ESTADOS_QUE_OCUPAN_WIP,
+  tareasQueBloquean,
+  mensajeWipExcedido,
+  mensajeWipIndeterminado,
+} from '../../src/core/wip.js';
+import type { Task } from '../../src/core/task.js';
+
+function tarea(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-900',
+    titulo: 'Tarea de prueba',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-curso',
+    plan_aprobado: true,
+    rama: 'feature/task-900-prueba',
+    asignado_a: 'carlos',
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-05',
+    actualizado: '2026-09-05',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+test('ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos', () => {
+  // La decision #13 es explicita: en diseno NO hay tope, y el hueco no
+  // se libera al pasar a revision porque la rama sigue viva.
+  assert.deepEqual([...ESTADOS_QUE_OCUPAN_WIP], ['en-curso', 'en-revision']);
+});
+
+test('tareasQueBloquean: una tarea en curso de la misma persona bloquea', () => {
+  const otras = [tarea({ id: 'TASK-901', asignado_a: 'carlos' })];
+  const bloqueantes = tareasQueBloquean(otras, 'carlos', 'TASK-900');
+  assert.equal(bloqueantes.length, 1);
+  assert.equal(bloqueantes[0]?.id, 'TASK-901');
+});
+
+test('tareasQueBloquean: las tareas de otra persona no bloquean', () => {
+  const otras = [
+    tarea({ id: 'TASK-901', asignado_a: 'ana' }),
+    tarea({ id: 'TASK-902', asignado_a: 'beto', estado: 'en-revision' }),
+  ];
+  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
+});
+
+test('tareasQueBloquean: una tarea sin asignar no bloquea a nadie', () => {
+  const otras = [tarea({ id: 'TASK-901', asignado_a: null })];
+  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
+});
+
+test('tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma', () => {
+  // Hoy no puede darse (la maquina de estados exige en-diseno para
+  // start), pero depender de eso haria que el dia que se relaje la
+  // maquina de estados esta comprobacion se bloqueara sola.
+  const otras = [tarea({ id: 'TASK-900', asignado_a: 'carlos' })];
+  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
+});
+
+test('tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta)', () => {
+  const otras = [tarea({ id: 'TASK-901', estado: 'en-revision', asignado_a: 'carlos' })];
+  const bloqueantes = tareasQueBloquean(otras, 'carlos', 'TASK-900');
+  assert.equal(bloqueantes.length, 1);
+  assert.equal(bloqueantes[0]?.estado, 'en-revision');
+});
+
+test('tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas', () => {
+  // No se inventa una equivalencia que "taskctl board" no tiene.
+  const otras = [tarea({ id: 'TASK-901', asignado_a: 'Carlos' })];
+  assert.deepEqual(tareasQueBloquean(otras, 'carlos', 'TASK-900'), []);
+});
+
+test('tareasQueBloquean: devuelve las bloqueantes ordenadas por ID', () => {
+  // El orden en que llegan depende del filesystem; el mensaje de error
+  // que se construye con ellas no puede depender de eso.
+  const otras = [
+    tarea({ id: 'TASK-903' }),
+    tarea({ id: 'TASK-901' }),
+    tarea({ id: 'TASK-902' }),
+  ];
+  assert.deepEqual(
+    tareasQueBloquean(otras, 'carlos', 'TASK-900').map((t) => t.id),
+    ['TASK-901', 'TASK-902', 'TASK-903']
+  );
+});
+
+test('mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama', () => {
+  // Criterio de aceptacion de TASK-015: "el mensaje de error nombra
+  // explicitamente la tarea que esta bloqueando".
+  const msg = mensajeWipExcedido('TASK-900', 'carlos', [
+    tarea({ id: 'TASK-901', titulo: 'La que bloquea', rama: 'feature/task-901-bloquea' }),
+  ]);
+  assert.ok(msg.startsWith('[ERROR] TASK-900:'), msg);
+  assert.ok(msg.includes('carlos'), msg);
+  assert.ok(msg.includes('TASK-901'), msg);
+  assert.ok(msg.includes('02-en-curso'), msg);
+  assert.ok(msg.includes('feature/task-901-bloquea'), msg);
+});
+
+test('mensajeWipExcedido: dice QUE HACER, no solo que ha fallado', () => {
+  const msg = mensajeWipExcedido('TASK-900', 'carlos', [tarea({ id: 'TASK-901' })]);
+  assert.ok(msg.includes('taskctl finish TASK-901'), msg);
+  assert.ok(msg.includes('--asignado-a'), msg);
+});
+
+test('mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera', () => {
+  // Solo puede pasar si el repo ya estaba inconsistente; nombrar una
+  // sola haria creer que cerrando esa se desbloquea.
+  const msg = mensajeWipExcedido('TASK-900', 'carlos', [
+    tarea({ id: 'TASK-901' }),
+    tarea({ id: 'TASK-902', estado: 'en-revision' }),
+  ]);
+  assert.ok(msg.includes('TASK-901'), msg);
+  assert.ok(msg.includes('TASK-902'), msg);
+  assert.ok(msg.includes('2 tareas'), msg);
+  assert.ok(msg.includes('03-en-revision'), msg);
+});
+
+test('mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos', () => {
+  const msg = mensajeWipIndeterminado('TASK-900', [
+    'tareas/02-en-curso/TASK-901/tarea.md',
+    'tareas/03-en-revision/TASK-902/tarea.md',
+  ]);
+  assert.ok(msg.startsWith('[ERROR] TASK-900:'), msg);
+  assert.ok(msg.includes('TASK-901'), msg);
+  assert.ok(msg.includes('TASK-902'), msg);
+  assert.ok(msg.includes('frontmatter'), msg);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
new file mode 100644
index 0000000..2e8ec66
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-wip.test.ts
@@ -0,0 +1,159 @@
+/**
+ * Tests de listTareasEnEstados (TASK-015, item B7), la lectura acotada
+ * que usa el limite de WIP. Contra directorios temporales reales, como
+ * el resto de task-store.test.ts; aqui no hace falta Git porque esta
+ * funcion solo lee ficheros.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { writeTareaFile, listTareasEnEstados } from '../../src/fs/task-store.js';
+import { ESTADOS_QUE_OCUPAN_WIP } from '../../src/core/wip.js';
+import type { Task } from '../../src/core/task.js';
+
+function tarea(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-900',
+    titulo: 'Tarea de prueba',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: [],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'en-curso',
+    plan_aprobado: true,
+    rama: 'feature/task-900-prueba',
+    asignado_a: 'carlos',
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-05',
+    actualizado: '2026-09-05',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+async function withTareasRoot(fn: (tareasRoot: string) => Promise<void>): Promise<void> {
+  const root = await mkdtemp(path.join(tmpdir(), 'taskctl-wip-'));
+  try {
+    await fn(path.join(root, 'tareas'));
+  } finally {
+    await rm(root, { recursive: true, force: true });
+  }
+}
+
+test('listTareasEnEstados: tareasRoot inexistente devuelve vacio, no lanza', async () => {
+  await withTareasRoot(async (tareasRoot) => {
+    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+    assert.deepEqual(r.tareas, []);
+    assert.deepEqual(r.ilegibles, []);
+  });
+});
+
+test('listTareasEnEstados: lee solo las carpetas pedidas, ignorando el resto', async () => {
+  await withTareasRoot(async (tareasRoot) => {
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-901', estado: 'planificada' }), '');
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-902', estado: 'en-diseno' }), '');
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-904', estado: 'en-revision' }), '');
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-905', estado: 'terminada' }), '');
+
+    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+
+    // Ni planificada ni en-diseno ni terminada ocupan hueco.
+    assert.deepEqual(
+      r.tareas.map((t) => t.id).sort(),
+      ['TASK-903', 'TASK-904']
+    );
+  });
+});
+
+test('listTareasEnEstados: un tarea.md ilegible va a "ilegibles", no rompe la lectura', async () => {
+  await withTareasRoot(async (tareasRoot) => {
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');
+    // Frontmatter roto en una carpeta que SI cuenta.
+    const rota = path.join(tareasRoot, '02-en-curso', 'TASK-904');
+    await mkdir(rota, { recursive: true });
+    await writeFile(path.join(rota, 'tarea.md'), 'esto no es frontmatter\n', 'utf8');
+
+    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+
+    // La legible se sigue leyendo...
+    assert.deepEqual(r.tareas.map((t) => t.id), ['TASK-903']);
+    // ...y la rota se reporta con su ruta, para poder nombrarla.
+    assert.equal(r.ilegibles.length, 1);
+    assert.ok(r.ilegibles[0]?.includes('TASK-904'), r.ilegibles[0]);
+  });
+});
+
+test('listTareasEnEstados: una carpeta de tarea SIN tarea.md dentro se ignora', async () => {
+  await withTareasRoot(async (tareasRoot) => {
+    // No es una tarea: no ocupa hueco ni impide comprobarlo.
+    await mkdir(path.join(tareasRoot, '02-en-curso', 'TASK-904'), { recursive: true });
+    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+    assert.deepEqual(r.tareas, []);
+    assert.deepEqual(r.ilegibles, []);
+  });
+});
+
+test('listTareasEnEstados: ignora entradas que no son un ID de tarea', async () => {
+  await withTareasRoot(async (tareasRoot) => {
+    await mkdir(path.join(tareasRoot, '02-en-curso', 'notas-sueltas'), { recursive: true });
+    await writeFile(path.join(tareasRoot, '02-en-curso', 'LEEME.md'), 'hola\n', 'utf8');
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');
+
+    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.deepEqual(r.tareas.map((t) => t.id), ['TASK-903']);
+    assert.deepEqual(r.ilegibles, []);
+  });
+});
+
+test('listTareasEnEstados: el mismo ID en dos carpetas ocupa un hueco, no dos', async () => {
+  await withTareasRoot(async (tareasRoot) => {
+    // Inconsistencia de datos que "taskctl board" ya reporta como
+    // advertencia: aqui no debe contar doble.
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-revision' }), '');
+
+    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.equal(r.tareas.length, 1);
+    // Gana la primera segun el orden de `estados`, que es el del ciclo.
+    assert.equal(r.tareas[0]?.estado, 'en-curso');
+  });
+});
+
+test('listTareasEnEstados: las rutas ilegibles vienen ordenadas (mensaje reproducible)', async () => {
+  await withTareasRoot(async (tareasRoot) => {
+    for (const [carpeta, id] of [
+      ['03-en-revision', 'TASK-908'],
+      ['02-en-curso', 'TASK-907'],
+      ['02-en-curso', 'TASK-906'],
+    ] as const) {
+      const dir = path.join(tareasRoot, carpeta, id);
+      await mkdir(dir, { recursive: true });
+      await writeFile(path.join(dir, 'tarea.md'), 'roto\n', 'utf8');
+    }
+
+    const r = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.equal(r.ilegibles.length, 3);
+    assert.deepEqual(r.ilegibles, [...r.ilegibles].sort());
+  });
+});
+
+test('listTareasEnEstados: acepta cualquier subconjunto de estados, no solo el del WIP', async () => {
+  await withTareasRoot(async (tareasRoot) => {
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-901', estado: 'planificada' }), '');
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-903', estado: 'en-curso' }), '');
+
+    const r = await listTareasEnEstados(tareasRoot, ['planificada']);
+
+    assert.deepEqual(r.tareas.map((t) => t.id), ['TASK-901']);
+  });
+});
````
