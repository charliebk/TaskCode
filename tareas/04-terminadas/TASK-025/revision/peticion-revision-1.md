# Peticion de revision — TASK-025 (ronda 1)

- Tarea: TASK-025 — El limite de WIP mira las ramas de trabajo, no el arbol activo
- Rama revisada: fix/task-025-el-limite-de-wip-mira-las-ramas-de-traba
- Rama base: develop
- Commit revisado (HEAD): dd11d4afce4fe129000217f90c7cfccfb28b061e
- Fecha: 2026-09-06
- Agente revisor sugerido: general-purpose

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
dd11d4a fix(TASK-025): tolera que la rama principal no exista en local
189fc1b fix(TASK-025): el limite de WIP mira las ramas de trabajo, no el arbol
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/tareas/01-en-diseno/TASK-025/plan-final.md b/tareas/02-en-curso/TASK-025/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-025/plan-final.md
rename to tareas/02-en-curso/TASK-025/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-025/tarea.md b/tareas/02-en-curso/TASK-025/tarea.md
similarity index 99%
rename from tareas/01-en-diseno/TASK-025/tarea.md
rename to tareas/02-en-curso/TASK-025/tarea.md
index c69b4ce..f0e52d1 100644
--- a/tareas/01-en-diseno/TASK-025/tarea.md
+++ b/tareas/02-en-curso/TASK-025/tarea.md
@@ -6,7 +6,7 @@ sprint: 2
 etiquetas: [cli, wip, git]
 complejidad: media
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: fix/task-025-el-limite-de-wip-mira-las-ramas-de-traba
 asignado_a: charlie.bk@gmail.com
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index efd86d8..32e9c70 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -18,7 +18,8 @@ import {
   PISTA_VACIO_ESCRITURA,
 } from '../cli/asignado.js';
 import type { Task } from '../core/task.js';
-import { readTareaFile, moveTareaFile, listTareasEnEstados } from '../fs/task-store.js';
+import { readTareaFile, moveTareaFile } from '../fs/task-store.js';
+import { escanearWip } from '../fs/wip-scan.js';
 import {
   ESTADOS_QUE_OCUPAN_WIP,
   tareasQueBloquean,
@@ -28,7 +29,14 @@ import {
   personaDeTarea,
 } from '../core/wip.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
-import { isWorkspaceClean, currentBranch, isValidBranchName, gitUserEmail } from '../fs/git.js';
+import {
+  isWorkspaceClean,
+  currentBranch,
+  isValidBranchName,
+  gitUserEmail,
+  resolveBaseBranchForTipo,
+  resolveMainBranch,
+} from '../fs/git.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 
 export class StartCommandError extends Error {}
@@ -154,7 +162,18 @@ export async function runStartCommand(
   if (personaParaWip !== null) {
     let wip;
     try {
-      wip = await listTareasEnEstados(tareasRoot, ESTADOS_QUE_OCUPAN_WIP);
+      // escanearWip (TASK-025) mira el arbol activo Y las ramas de
+      // trabajo abiertas. Sin lo segundo el limite no protegia nada: el
+      // paso a 02-en-curso se commitea en la rama de la tarea, y start
+      // se ejecuta desde la rama base, donde ninguna tarea esta nunca
+      // en curso.
+      wip = await escanearWip(
+        tareasRoot,
+        deps.repoCwd,
+        resolveBaseBranchForTipo(task.tipo, deps.repoCwd),
+        resolveMainBranch(deps.repoCwd),
+        ESTADOS_QUE_OCUPAN_WIP
+      );
     } catch (e: unknown) {
       // Sin esto, un ENOTDIR/EACCES al escanear tareas/ escapaba como
       // Error crudo y el usuario lo veia como "taskctl no pudo
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 20ae8b0..45fabef 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -125,6 +125,20 @@ export function gitUserEmail(cwd: string): string | null {
   return email === '' ? null : email;
 }
 
+/**
+ * Nombres de todas las ramas LOCALES (TASK-025). Solo locales a
+ * proposito: mirar las remotas obligaria a un "fetch" — red, lentitud
+ * y un modo de fallo nuevo en un comando que hoy funciona sin
+ * conexion — y convertiria el limite de WIP, que es personal, en uno
+ * de equipo que nadie ha decidido.
+ */
+export function localBranches(cwd: string): string[] {
+  return runGit(['for-each-ref', '--format=%(refname:short)', 'refs/heads'], cwd)
+    .split('\n')
+    .map((s) => s.trim())
+    .filter((s) => s.length > 0);
+}
+
 /** SHA completo del commit en HEAD. */
 export function headCommit(cwd: string): string {
   return runGit(['rev-parse', 'HEAD'], cwd);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
new file mode 100644
index 0000000..c9512b7
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/wip-scan.ts
@@ -0,0 +1,149 @@
+/**
+ * Escaneo del trabajo en curso para el limite de WIP (TASK-025, item
+ * C8). Vive en un modulo propio porque cruza las dos capas — necesita
+ * Git y el parser de tareas —, y task-store.ts nunca ha importado
+ * git.ts.
+ *
+ * POR QUE EXISTE ESTE MODULO. B7 comprobaba el limite leyendo
+ * "tareas/02-en-curso" del working tree. Esa pregunta es la correcta
+ * pero el sitio es el equivocado: "taskctl start" mueve la tarea a
+ * 02-en-curso y ese movimiento se commitea EN LA RAMA DE LA TAREA,
+ * mientras que "plan"/"new"/"import" devuelven el repo a la rama base
+ * (ensureBaseBranchReady) y "create-<tipo>.sh" tambien parte de ahi.
+ * En develop NINGUNA tarea esta nunca en curso, asi que la
+ * comprobacion no encontraba nada y el limite no protegia nada.
+ *
+ * El smoke test de B7 no lo detecto porque encadenaba dos "start"
+ * seguidos: el unico orden en el que el limite si funcionaba.
+ *
+ * La pregunta que hace este modulo es la util y ademas la mas directa:
+ * "¿tiene esta persona alguna RAMA DE TRABAJO abierta?". Una rama de
+ * tarea que existe y no esta mergeada ES, literalmente, trabajo en
+ * curso — y, a diferencia del working tree, se ve desde cualquier
+ * sitio.
+ */
+import path from 'node:path';
+import { STATE_FOLDER, type TareaUbicada, type TaskState } from '../core/task.js';
+import { parseTareaFile } from '../core/tarea-file.js';
+import { listTareasEnEstados, type TareasEnEstadosResult } from './task-store.js';
+import {
+  isAncestor,
+  localBranchExists,
+  localBranches,
+  lsTreeNames,
+  showFileAtRef,
+} from './git.js';
+
+const TASK_ID_RE = /^TASK-\d{3,}$/;
+
+/**
+ * Ramas locales que cuentan como trabajo abierto: ni la base ni la
+ * principal, y no mergeadas en ninguna de las dos.
+ *
+ * El filtro de mergeadas no es cosmetico en este repo: la politica
+ * IECA dice que las ramas NO se borran tras el merge, asi que hay
+ * decenas vivas y casi todas cerradas. Sin el, cualquiera de ellas
+ * bloquearia a todo el mundo para siempre.
+ *
+ * Se comprueba contra la base Y la principal porque un hotfix mergeado
+ * a main esta cerrado aunque no haya llegado a develop (p. ej. si el
+ * backmerge fallo): bloquear por eso seria un falso positivo con una
+ * causa dificilisima de adivinar desde el mensaje de error.
+ */
+export function ramasDeTrabajoAbiertas(
+  repoCwd: string,
+  baseBranch: string,
+  mainBranch: string
+): string[] {
+  // Solo se compara contra las referencias que EXISTEN en local. En un
+  // clon recien hecho, "main" suele estar unicamente como origin/main
+  // hasta que alguien le hace checkout, y "git merge-base --is-ancestor
+  // <rama> main" revienta con "Not a valid object name" y tumbaba el
+  // comando entero (detectado por el smoke test de TASK-025, sobre un
+  // clon limpio; los repos de los tests si tenian las dos ramas).
+  const referencias = [baseBranch, mainBranch].filter(
+    (ref, i, todas) => todas.indexOf(ref) === i && localBranchExists(ref, repoCwd)
+  );
+
+  return localBranches(repoCwd).filter((rama) => {
+    if (referencias.includes(rama)) return false;
+    return !referencias.some((ref) => isAncestor(rama, ref, repoCwd));
+  });
+}
+
+/** Extrae el ID de tarea de una ruta "tareas/<carpeta>/TASK-NNN/tarea.md". */
+function idDesdeRuta(ruta: string): string | null {
+  const partes = ruta.split('/');
+  const id = partes[partes.length - 2];
+  return id !== undefined && TASK_ID_RE.test(id) ? id : null;
+}
+
+/**
+ * Tareas en `estados` que viven dentro de las ramas de trabajo
+ * abiertas, leidas de cada rama con "git show" (nunca del working
+ * tree).
+ *
+ * Las rutas ilegibles se devuelven como "rama:ruta" para que el
+ * mensaje de error diga DONDE mirar: sin la rama, la ruta sola manda a
+ * la persona a un fichero que en su checkout no existe.
+ */
+export function tareasEnRamasAbiertas(
+  repoCwd: string,
+  ramas: readonly string[],
+  estados: readonly TaskState[]
+): { tareas: TareaUbicada[]; ilegibles: string[] } {
+  const tareas: TareaUbicada[] = [];
+  const ilegibles: string[] = [];
+
+  for (const rama of ramas) {
+    for (const estado of estados) {
+      const prefijo = `tareas/${STATE_FOLDER[estado]}`;
+      for (const ruta of lsTreeNames(rama, prefijo, repoCwd)) {
+        if (path.basename(ruta) !== 'tarea.md') continue;
+        if (idDesdeRuta(ruta) === null) continue;
+        try {
+          tareas.push({ task: parseTareaFile(showFileAtRef(rama, ruta, repoCwd)).task, estadoCarpeta: estado });
+        } catch {
+          // Frontmatter roto o Task invalido dentro de esa rama. No se
+          // propaga: el llamador decide (fail-closed en start). Un
+          // fallo del propio Git si se propaga, con su mensaje.
+          ilegibles.push(`${rama}:${ruta}`);
+        }
+      }
+    }
+  }
+
+  return { tareas, ilegibles };
+}
+
+/**
+ * Lo que ve el limite de WIP: la union de las tareas del arbol activo
+ * y las de las ramas de trabajo abiertas, deduplicada por ID.
+ *
+ * Se conserva la lectura del arbol activo ADEMAS de la de las ramas, y
+ * no es redundante: cubre una tarea movida a 02-en-curso y commiteada
+ * en la propia rama base (lo que pasa con las tareas del
+ * bootstrapping), que ninguna rama de trabajo reflejaria.
+ */
+export async function escanearWip(
+  tareasRoot: string,
+  repoCwd: string,
+  baseBranch: string,
+  mainBranch: string,
+  estados: readonly TaskState[]
+): Promise<TareasEnEstadosResult> {
+  const enArbol = await listTareasEnEstados(tareasRoot, estados);
+  const ramas = ramasDeTrabajoAbiertas(repoCwd, baseBranch, mainBranch);
+  const enRamas = tareasEnRamasAbiertas(repoCwd, ramas, estados);
+
+  const porId = new Map<string, TareaUbicada>();
+  for (const t of [...enArbol.tareas, ...enRamas.tareas]) {
+    // Gana la primera vista: el arbol activo antes que las ramas. Da
+    // igual cual, porque solo se usa para saber de quien es y en que
+    // carpeta esta, y en ambas fuentes ocupa un unico hueco.
+    if (!porId.has(t.task.id)) porId.set(t.task.id, t);
+  }
+
+  const ilegibles = [...enArbol.ilegibles, ...enRamas.ilegibles].sort();
+  return { tareas: [...porId.values()], ilegibles };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
index 9c82f55..5c65515 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/start.test.ts
@@ -14,9 +14,10 @@ import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { spawnSync } from 'node:child_process';
-import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { writeTareaFile, readTareaFile, moveTareaFile } from '../../src/fs/task-store.js';
 import { serializeTareaFile } from '../../src/core/tarea-file.js';
 import { runStartCommand, StartCommandError } from '../../src/commands/start.js';
+import { TaskFolderConflictError } from '../../src/fs/task-store.js';
 import { StateMachineError } from '../../src/core/state-machine.js';
 import type { Task } from '../../src/core/task.js';
 
@@ -805,3 +806,152 @@ test('taskctl start --asignado-a: pasar el flag silencia el aviso de atribucion'
     assert.equal(result.avisoAtribucion, null);
   });
 });
+
+// --- TASK-025 (item C8): el limite ve las ramas de trabajo ---
+
+test('taskctl start: bloquea aunque la tarea en curso solo exista en SU rama (el fallo de B7)', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Este es el caso que B7 no cubria y que su smoke test no vio.
+    // Se reproduce el flujo REAL: se arranca la primera tarea, se
+    // commitea su movimiento EN SU RAMA, y se vuelve a develop — que
+    // es lo que hacen plan/new/import — antes de arrancar la segunda.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
+      ''
+    );
+    commitAll(repoRoot, 'dos tareas de carlos en diseno');
+
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'TASK-500 en curso, EN SU RAMA');
+    // De vuelta a la rama base: aqui TASK-500 sigue en 01-en-diseno.
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof StartCommandError &&
+        (err as Error).message.includes('TASK-500') &&
+        (err as Error).message.includes('feature/task-500-prueba-de-integracion')
+    );
+
+    // Y no se ha creado la rama de la segunda.
+    const ramas = spawnSync('git', ['branch', '--list', 'feature/task-501-segunda'], {
+      cwd: repoRoot,
+      encoding: 'utf8',
+    });
+    assert.equal(ramas.stdout.trim(), '');
+  });
+});
+
+test('taskctl start: una rama YA MERGEADA no bloquea, aunque siga viva', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // Politica IECA: las ramas no se borran tras el merge. Sin el
+    // filtro de mergeadas, cada tarea cerrada bloquearia para siempre.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-segunda' }),
+      ''
+    );
+    commitAll(repoRoot, 'dos tareas de carlos');
+
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'TASK-500 en curso');
+    // Se mergea la rama a develop, pero NO se borra.
+    git(['checkout', '-q', 'develop'], repoRoot);
+    git(['merge', '--no-ff', '-q', '-m', 'merge de TASK-500', 'feature/task-500-prueba-de-integracion'], repoRoot);
+
+    // Ahora TASK-500 SI esta en 02-en-curso en develop, asi que se
+    // mueve a terminadas para aislar lo que este test comprueba: que
+    // la RAMA mergeada no cuenta.
+    const enCurso = (await readTareaFile(tareasRoot, 'TASK-500'))!;
+    await moveTareaFile(tareasRoot, enCurso.filePath, { ...enCurso.task, estado: 'terminada' }, enCurso.body);
+    commitAll(repoRoot, 'TASK-500 terminada');
+
+    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-501');
+  });
+});
+
+test('taskctl start: la rama de OTRA persona no bloquea, aunque este abierta', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'ana@example.com' }), '');
+    await writeTareaFile(
+      tareasRoot,
+      sampleTask({ id: 'TASK-501', asignado_a: 'carlos@example.com', rama: 'feature/task-501-de-carlos' }),
+      ''
+    );
+    commitAll(repoRoot, 'una de ana y una de carlos');
+
+    // Ana abre su rama y la deja abierta.
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'la de ana en curso');
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    // Carlos arranca la suya: la rama abierta de Ana no le afecta.
+    const result = await runStartCommand(tareasRoot, ['TASK-501'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+
+    assert.equal(result.id, 'TASK-501');
+    assert.equal(result.asignadoA, 'carlos@example.com');
+  });
+});
+
+test('taskctl start: reintentar una tarea cuya rama ya existe no la bloquea contra si misma', async () => {
+  await withTempRepo(async (repoRoot, tareasRoot) => {
+    // La rama existe y no esta mergeada, y su arbol tiene la tarea en
+    // 02-en-curso: sin excluirla por ID, el reintento se bloquearia a
+    // si mismo y no habria forma de salir.
+    await writeTareaFile(tareasRoot, sampleTask({ asignado_a: 'carlos@example.com' }), '');
+    commitAll(repoRoot, 'tarea de carlos');
+    await runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    commitAll(repoRoot, 'en curso en su rama');
+
+    // Se simula el reintento: se vuelve a develop y se deja la tarea
+    // otra vez en 01-en-diseno, con la rama ya creada.
+    git(['checkout', '-q', 'develop'], repoRoot);
+    const enDiseno = (await readTareaFile(tareasRoot, 'TASK-500'))!;
+    assert.equal(enDiseno.task.estado, 'en-diseno');
+
+    // El limite NO se dispara: la tarea no se bloquea a si misma
+    // aunque su propia rama este abierta y tenga la tarea en curso.
+    // El reintento si muere, pero por otra cosa y preexistente: el
+    // checkout a la rama ya creada trae consigo la carpeta
+    // 02-en-curso/TASK-500, y moveTareaFile se niega a pisarla. Lo
+    // que este test fija es que el error NO es del limite de WIP.
+    await assert.rejects(
+      () =>
+        runStartCommand(tareasRoot, ['TASK-500'], '2026-09-06', {
+          repoCwd: repoRoot,
+          scriptsDir: SCRIPTS_DIR,
+        }),
+      (err: unknown) =>
+        err instanceof TaskFolderConflictError &&
+        !(err as Error).message.includes('sin cerrar')
+    );
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts
new file mode 100644
index 0000000..a7e6063
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fs/wip-scan.test.ts
@@ -0,0 +1,225 @@
+/**
+ * Tests de wip-scan (TASK-025, item C8) contra repos Git reales con
+ * varias ramas de verdad: una mergeada, otra no, y una sin tareas.
+ * Nada de esto se puede probar con mocks, que es justo lo que hizo que
+ * B7 pareciera correcto durante una tarea entera.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import {
+  ramasDeTrabajoAbiertas,
+  tareasEnRamasAbiertas,
+  escanearWip,
+} from '../../src/fs/wip-scan.js';
+import { ESTADOS_QUE_OCUPAN_WIP } from '../../src/core/wip.js';
+import type { Task } from '../../src/core/task.js';
+
+function git(args: string[], cwd: string): void {
+  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(result.status, 0, `git fallo: ${result.stderr}`);
+}
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
+    asignado_a: 'carlos@example.com',
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    creado: '2026-09-06',
+    actualizado: '2026-09-06',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+async function withRepo(
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  const repoRoot = await mkdtemp(path.join(tmpdir(), 'taskctl-wipscan-'));
+  try {
+    git(['init', '-q', '-b', 'main'], repoRoot);
+    git(['config', 'user.email', 'test@example.com'], repoRoot);
+    git(['config', 'user.name', 'Test'], repoRoot);
+    await writeFile(path.join(repoRoot, 'README.md'), '# repo', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'inicial'], repoRoot);
+    git(['checkout', '-q', '-b', 'develop'], repoRoot);
+    await fn(repoRoot, path.join(repoRoot, 'tareas'));
+  } finally {
+    await rm(repoRoot, { recursive: true, force: true });
+  }
+}
+
+/** Crea una rama con una tarea en curso dentro, y vuelve a develop. */
+async function ramaConTarea(
+  repoRoot: string,
+  tareasRoot: string,
+  rama: string,
+  task: Task
+): Promise<void> {
+  git(['checkout', '-q', '-b', rama], repoRoot);
+  await writeTareaFile(tareasRoot, task, '');
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', 'tarea en rama'], repoRoot);
+  git(['checkout', '-q', 'develop'], repoRoot);
+}
+
+test('ramasDeTrabajoAbiertas: excluye la base y la principal', async () => {
+  await withRepo(async (repoRoot) => {
+    assert.deepEqual(ramasDeTrabajoAbiertas(repoRoot, 'develop', 'main'), []);
+  });
+});
+
+test('ramasDeTrabajoAbiertas: una rama sin mergear cuenta; una mergeada no', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await ramaConTarea(repoRoot, tareasRoot, 'feature/abierta', tarea({ id: 'TASK-901' }));
+    await ramaConTarea(repoRoot, tareasRoot, 'feature/cerrada', tarea({ id: 'TASK-902' }));
+    git(['merge', '--no-ff', '-q', '-m', 'merge', 'feature/cerrada'], repoRoot);
+
+    // La mergeada sigue existiendo (politica IECA: las ramas no se
+    // borran), pero ya no es trabajo en curso.
+    assert.deepEqual(ramasDeTrabajoAbiertas(repoRoot, 'develop', 'main'), ['feature/abierta']);
+  });
+});
+
+test('ramasDeTrabajoAbiertas: una rama mergeada solo en main tampoco cuenta', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    // Un hotfix mergeado a main esta cerrado aunque el backmerge a
+    // develop no haya ocurrido: bloquear por eso seria un falso
+    // positivo imposible de adivinar desde el mensaje.
+    await ramaConTarea(repoRoot, tareasRoot, 'hotfix/urgente', tarea({ id: 'TASK-903' }));
+    git(['checkout', '-q', 'main'], repoRoot);
+    git(['merge', '--no-ff', '-q', '-m', 'merge a main', 'hotfix/urgente'], repoRoot);
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    assert.deepEqual(ramasDeTrabajoAbiertas(repoRoot, 'develop', 'main'), []);
+  });
+});
+
+test('tareasEnRamasAbiertas: lee la tarea DENTRO de la rama, no del working tree', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await ramaConTarea(
+      repoRoot,
+      tareasRoot,
+      'feature/abierta',
+      tarea({ id: 'TASK-901', asignado_a: 'carlos@example.com' })
+    );
+
+    // En develop no hay ni rastro de la tarea.
+    const r = tareasEnRamasAbiertas(repoRoot, ['feature/abierta'], ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.equal(r.tareas.length, 1);
+    assert.equal(r.tareas[0]?.task.id, 'TASK-901');
+    assert.equal(r.tareas[0]?.task.asignado_a, 'carlos@example.com');
+    assert.equal(r.tareas[0]?.estadoCarpeta, 'en-curso');
+  });
+});
+
+test('tareasEnRamasAbiertas: una rama sin tareas no aporta nada ni falla', async () => {
+  await withRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/sin-tareas'], repoRoot);
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    const r = tareasEnRamasAbiertas(repoRoot, ['feature/sin-tareas'], ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.deepEqual(r.tareas, []);
+    assert.deepEqual(r.ilegibles, []);
+  });
+});
+
+test('tareasEnRamasAbiertas: un tarea.md ilegible se reporta con SU rama delante', async () => {
+  await withRepo(async (repoRoot) => {
+    git(['checkout', '-q', '-b', 'feature/rota'], repoRoot);
+    const dir = path.join(repoRoot, 'tareas', '02-en-curso', 'TASK-904');
+    await mkdir(dir, { recursive: true });
+    await writeFile(path.join(dir, 'tarea.md'), 'esto no es frontmatter', 'utf8');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'tarea rota'], repoRoot);
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    const r = tareasEnRamasAbiertas(repoRoot, ['feature/rota'], ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.deepEqual(r.tareas, []);
+    assert.equal(r.ilegibles.length, 1);
+    // Sin la rama delante, la ruta manda a un fichero que en el
+    // checkout de quien lee el error no existe.
+    assert.ok(r.ilegibles[0]?.startsWith('feature/rota:'), r.ilegibles[0]);
+  });
+});
+
+test('escanearWip: une el arbol activo y las ramas, sin contar dos veces', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    // Una tarea vive en la rama...
+    await ramaConTarea(repoRoot, tareasRoot, 'feature/abierta', tarea({ id: 'TASK-901' }));
+    // ...y otra en el arbol de develop (el caso del bootstrapping).
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-902' }), '');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'una en curso en la propia base'], repoRoot);
+
+    const r = await escanearWip(tareasRoot, repoRoot, 'develop', 'main', ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.deepEqual(
+      r.tareas.map((t) => t.task.id).sort(),
+      ['TASK-901', 'TASK-902']
+    );
+  });
+});
+
+test('escanearWip: la misma tarea en el arbol y en su rama ocupa un solo hueco', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-901' }), '');
+    git(['add', '-A'], repoRoot);
+    git(['commit', '-q', '-m', 'en curso en develop'], repoRoot);
+    git(['checkout', '-q', '-b', 'feature/abierta'], repoRoot);
+    git(['commit', '-q', '--allow-empty', '-m', 'algo mas en la rama'], repoRoot);
+    git(['checkout', '-q', 'develop'], repoRoot);
+
+    const r = await escanearWip(tareasRoot, repoRoot, 'develop', 'main', ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.equal(r.tareas.length, 1);
+  });
+});
+
+test('ramasDeTrabajoAbiertas: tolera que la rama principal no exista en local', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    // En un clon recien hecho, main suele estar solo como origin-main
+    // hasta que alguien le hace checkout. Antes de esta guarda,
+    // merge-base --is-ancestor reventaba con 'Not a valid object name'
+    // y tumbaba el comando entero. Lo destapo el smoke test de
+    // TASK-025 sobre un clon limpio; los repos de estos tests si
+    // tenian las dos ramas, asi que no lo veian.
+    await ramaConTarea(repoRoot, tareasRoot, 'feature/abierta', tarea({ id: 'TASK-901' }));
+    git(['branch', '-D', 'main'], repoRoot);
+
+    const abiertas = ramasDeTrabajoAbiertas(repoRoot, 'develop', 'main');
+
+    assert.deepEqual(abiertas, ['feature/abierta']);
+  });
+});
+
+test('escanearWip: sigue funcionando sin la rama principal en local', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await ramaConTarea(repoRoot, tareasRoot, 'feature/abierta', tarea({ id: 'TASK-901' }));
+    git(['branch', '-D', 'main'], repoRoot);
+
+    const r = await escanearWip(tareasRoot, repoRoot, 'develop', 'main', ESTADOS_QUE_OCUPAN_WIP);
+
+    assert.deepEqual(r.tareas.map((t) => t.task.id), ['TASK-901']);
+  });
+});
````
