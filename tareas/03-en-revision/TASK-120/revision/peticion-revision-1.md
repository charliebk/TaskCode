# Peticion de revision — TASK-120 (ronda 1)

- Tarea: TASK-120 — P-12: sincronizacion con su duracion registrada y limitada a las fases que se declaren
- Rama revisada: feature/task-120-p-12-sincronizacion-con-su-duracion-regi
- Rama base: develop
- Commit revisado (HEAD): b2d13386d88d5a5e9741b9a29b4d47d1bef8bb9c
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-120 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

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

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-120/tarea.md
- tareas/03-en-revision/TASK-120/planificacion/
- CLAUDE.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/registro-puertas.test.ts

## Commits a revisar (git log develop..HEAD)

````
b2d1338 test(TASK-120): el test del symlink de approve se omite sin privilegio de symlink
6fe807b feat(TASK-120): duracion de la sincronizacion en el registro de puertas y fases_sincronizacion
8049a4a chore(TASK-120): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 0e15fb3..c568db2 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -87,12 +87,15 @@ que lo comprueban.
   `finish --merge-request` (ver el README del plugin).
 - El glob de `npm test` va entrecomillado a propósito: lo expande Node, no el
   shell. Sin comillas, la suite entera falla en `cmd.exe`.
-- En Windows nativo **fallan 3 tests y no son regresiones**: uno por el truco
-  del symlink (`EPERM`), uno porque `chmod` sobre directorios no hace nada en
-  NTFS, y uno por finales de línea (CRLF). En el CI de Linux pasan. Aquí
-  «suite en verde» significa que fallan solo esos tres. Ojo: bajo carga
+- En Windows nativo **fallan 2 tests y no son regresiones** (los dos de
+  `plan.test.ts`): uno porque `chmod` sobre directorios no hace nada en NTFS,
+  y uno por finales de línea (CRLF). El tercero de antes, el del truco del
+  symlink de `approve.test.ts`, se omite (`skipped`) cuando no hay privilegio
+  de symlink (TASK-120: bloqueaba la verificación por impacto de cualquier
+  tarea que tocara `approve.ts`). En el CI de Linux pasan los tres. Aquí
+  «suite en verde» significa que fallan solo esos dos. Ojo: bajo carga
   aparecen además rojos intermitentes de `EBUSY ... rmdir` al limpiar los
   repos temporales; fallan en el *teardown*, no en la aserción, y no son
-  tuyos. Cualquier otro cuarto rojo sí lo es.
+  tuyos. Cualquier otro tercer rojo sí lo es.
 
 El resto, en `docs/contexto/HALLAZGOS.md`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
index 3876617..4d6c111 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/comandos.md
@@ -181,7 +181,9 @@ sin revisión), `crit`, `imp`, `men` (hallazgos CRÍTICO, IMPORTANTE y MENOR de
 todos los informes `informe-revision-N[-<revisor>].md`, cada uno **una vez por
 tarea** con clave revisor + ID), `hall_origen` (implementación/plan/
 especificación/sin clasificar, de la columna `Origen`), `cierre` (día del último
-`finish`) y `origen` (`registro`, `git` o «—»). Un informe sin tabla de hallazgos
+`finish`), `origen` (`registro`, `git` o «—»), `estimada`, `finish`,
+`punta_a_punta` y `sinc` (lo que suma `comando_sincronizacion` en la tarea,
+del registro de puertas; «—» sin líneas). Un informe sin tabla de hallazgos
 deja `crit`/`imp`/`men`/`hall_origen` en «—»: sin dato, no cero. Con `--tokens`,
 además `tok_diseno`, `tok_curso`, `tok_revision`, `tok_total` y el desglose de
 `## Coste`: `tok_nuevos` (entrada + escritura de caché + salida),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index 26c8048..c205923 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -442,6 +442,23 @@ excepción un roadmap propio que vive ahí se quedaba atrasado tras cada transic
 siguen rechazando, sin distinguir mayúsculas. `informe_cobertura` no tiene esta
 excepción.
 
+**En qué fases corre: `fases_sincronizacion`** (opcional). Sin la clave, el
+comando corre en cada commit automático, como siempre (unas 8-10 veces por
+tarea). Con ella, solo en las fases listadas; las válidas son `new`, `import`,
+`plan`, `approve`, `start`, `review`, `veredicto`, `verificar-menores`,
+`finish`, `pausa`, `trocear`, `registrar-coste`, `codex-review` y
+`doctor-deploy`. Una fase desconocida o una lista vacía abortan como cualquier
+valor inválido:
+
+```yaml
+fases_sincronizacion: [plan, finish]
+```
+
+**Cuánto tarda.** Cada ejecución deja una línea en el registro de puertas
+(`.git/taskcode/puertas.log`, formato en
+[registro-puertas.md](registro-puertas.md)) con la tarea, la fase, la duración
+y el resultado; `taskctl metricas` lo suma por tarea en la columna `sinc`.
+
 ## ROADMAP de tareas (`tareas/ROADMAP.md`)
 
 `taskctl` mantiene en cada proyecto un `tareas/ROADMAP.md`: una tabla por hito
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
new file mode 100644
index 0000000..dfac567
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/registro-puertas.md
@@ -0,0 +1,43 @@
+# Registro de puertas de verificación
+
+Cada vez que corre una puerta que cuesta tiempo (la sincronización de ficheros
+derivados, y las que se añadan con el mismo formato: el freno de fin de turno,
+las verificaciones de `review` y de `finish`), `taskctl` añade una línea a un
+registro común. Sirve para saber cuánto se va en cada puerta por tarea;
+`taskctl metricas` lo lee.
+
+## Dónde está
+
+En el directorio de Git del repo, fuera del árbol de trabajo:
+`git rev-parse --git-path taskcode/puertas.log` (en un repo normal,
+`.git/taskcode/puertas.log`; en un worktree enlazado, el de ese worktree). No
+ensucia `git status` y no hace falta ignorarlo.
+
+## Formato
+
+Una línea por ejecución, seis campos separados por un tabulador:
+
+```
+puerta	tarea	instante	modo	duracion_s	resultado
+```
+
+| Campo | Contenido |
+|---|---|
+| `puerta` | Qué se ejecutó: `sincronizacion`, … |
+| `tarea` | El ID (`TASK-123`, `TASK-123a`), o `-` si no hay tarea |
+| `instante` | ISO 8601 en UTC del final de la ejecución |
+| `modo` | El contexto de la puerta; para `sincronizacion`, la fase de `taskctl` que commiteaba (`plan`, `finish`, …; `otra` si no se sabe) |
+| `duracion_s` | Segundos, con un decimal |
+| `resultado` | El desenlace; para `sincronizacion`, `aplicada`, `fallida`, `omitida-rutas-con-cambios` o `rutas-ajenas` |
+
+Ningún campo lleva tabuladores ni saltos de línea (se cambian por espacios) y
+un campo vacío se escribe `-`.
+
+## Reglas para quien lo lee o lo escribe
+
+- Quien lee ignora las líneas mal formadas y las de puertas que no conoce:
+  añadir una puerta nueva no rompe a los lectores existentes.
+- Escribir nunca tumba una transición: si el registro no se puede escribir, la
+  ejecución sigue sin línea.
+- `taskctl metricas` suma la puerta `sincronizacion` por tarea en la columna
+  `sinc`; sin líneas de la tarea, `—`.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
index 718307f..c44794d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md
@@ -24,6 +24,10 @@ un comando que reescribe esos ficheros y la lista de rutas que modifica.
 - **`timeout_sincronizacion`**: numero de segundos (entero ≥ 1) para esperar
   al comando. Opcional; por defecto, 60 segundos. Solo es valida si estan las
   otras dos claves.
+- **`fases_sincronizacion`**: lista de fases en las que corre el comando
+  (`[plan, finish]`). Opcional; sin ella corre en todas. Cada ejecucion deja su
+  duracion en el registro de puertas, dentro del directorio de Git (fuera del
+  arbol de trabajo), y `taskctl metricas` la suma por tarea (columna `sinc`).
 
 **Reglas de declaracion:**
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index e09aa30..e429321 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -246,6 +246,7 @@ async function runApprove(
   // se pasan las dos igualmente porque autoCommit deduplica y asi el
   // dia que approve mueva algo esto no se queda corto en silencio.
   const commitResult = autoCommit({
+    fase: 'approve',
     cwd: deps.repoCwd,
     rutas: [path.dirname(filePath), path.dirname(newFilePath)],
     mensaje: mensajeChore(task.id, 'plan aprobado'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
index 867329e..7b9a436 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/codex-review.ts
@@ -223,6 +223,7 @@ export async function runCodexReviewCommand(
   // Se llama SIEMPRE, tambien degradado: si no hubo nada nuevo que
   // escribir, autoCommit se limita a decir "nada que commitear".
   const commitResult = autoCommit({
+    fase: 'codex-review',
     cwd: deps.repoCwd,
     rutas: [path.dirname(filePath)],
     mensaje: mensajeChore(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts
index 254dde6..8ae30af 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor-deploy-tareas.ts
@@ -120,6 +120,7 @@ export async function crearTareasDeFallas(informe: InformeDeploy, raiz: string,
       creadas.push({ id, punto: p.id });
     }
     resultadoCommit = autoCommit({
+      fase: 'doctor-deploy',
       cwd: raiz,
       rutas: carpetas,
       mensaje: mensajeChore('taskctl', `doctor-deploy: ${creadas.length} tarea(s) creadas: ${creadas.map((c) => c.id).join(', ')}`),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index b9cfb2e..c0a1f77 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -328,6 +328,7 @@ async function anotarYCommitear(
   if (body !== o.initial.body) {
     await writeFile(o.initial.filePath, serializeTareaFile(o.initial.task, body), 'utf8');
     c = autoCommit({
+      fase: 'finish',
       cwd: o.cwd,
       rutas: [path.dirname(o.initial.filePath)],
       mensaje: mensajeChore(o.id, mensaje),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index 6d82465..5f13df2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -818,6 +818,7 @@ async function runFinish(
   // ensureBaseBranchReady, asi que el resto del arbol puede tener
   // trabajo de la persona.
   const commitResult = autoCommit({
+    fase: 'finish',
     cwd: deps.repoCwd,
     rutas: [
       path.dirname(filePath),
@@ -1022,6 +1023,7 @@ async function abrirMergeRequestYAnotar(o: AbrirMergeRequestOpts): Promise<Finis
   let commit: AutoCommitResult;
   try {
     commit = autoCommit({
+      fase: 'finish',
       cwd,
       rutas: [path.dirname(filePath)],
       mensaje: mensajeChore(task.id, 'merge request abierto'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
index 8547e7e..9287283 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/import.ts
@@ -335,6 +335,7 @@ export async function runImportCommand(
   // pasada; si no se creo ninguna (todo omitido o con error), no hay
   // nada que commitear y no se crea un commit vacio.
   const autoCommitResult = autoCommit({
+    fase: 'import',
     cwd: deps.repoCwd,
     rutas: creadas.map((c) => path.dirname(c.filePath)),
     mensaje: mensajeChore(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
index c7e657f..804f5af 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/metricas.ts
@@ -41,6 +41,8 @@
  * y los CRITICO/IMPORTANTE de su informe; `--json` lo lleva en `lecturasRevision`.
  * No entra en `--escribir`, y todo sale del repo: nunca se lee `~/.claude`.
  */
+import { sumarPorTarea } from '../core/registro-puertas.js';
+import { leerRegistroPuertas } from '../fs/registro-puertas.js';
 import path from 'node:path';
 import { readdir, readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
 import type { InformeLeido } from '../core/informe-revision.js';
@@ -498,8 +500,11 @@ export async function leerRepoMetricas(repo: RepoMetricas, varios: boolean): Pro
     }
   }
 
+  // TASK-120: la sincronizacion de cada tarea, del registro de puertas (una lectura por repo).
+  const sincPorTarea = sumarPorTarea(leerRegistroPuertas(repo.ruta), 'sincronizacion');
   const filas: FilaMetricas[] = leidas.map((l) =>
     calcularFila({
+      sincronizacionS: sincPorTarea.get(l.task.task.id) ?? null,
       task: l.task.task,
       body: l.task.body,
       ronda: l.ronda,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index 8c702b3..ee5020f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -391,6 +391,7 @@ export async function runNewCommand(
   // recien creada, no el arbol. La decision #14 fijo commitear si y
   // subir solo con --push.
   const autoCommitResult = autoCommit({
+    fase: 'new',
     cwd: deps.repoCwd,
     rutas: [path.dirname(filePath)],
     mensaje: mensajeChore(id, 'tarea creada'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
index cf714d0..2da80d0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/pausa.ts
@@ -90,6 +90,7 @@ export async function runPausaCommand(
   const conRegistro = registrarTransicion(body, 'pausa', deps.ahora ?? today, modoConfig, 'persona');
   const nuevo = await moveTareaFile(tareasRoot, filePath, task, conRegistro);
   const commit = autoCommit({
+    fase: 'pausa',
     cwd: deps.repoCwd,
     rutas: [path.dirname(nuevo)],
     mensaje: mensajeChore(id, 'pausa registrada'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 8e2899c..867362e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -1061,6 +1061,7 @@ async function runPlan(
   // huerfana. planificacion/plan-final.md ya cae dentro de la carpeta
   // de destino, no hace falta nombrarlo aparte.
   const commitResult = autoCommit({
+    fase: 'plan',
     cwd: deps.repoCwd,
     rutas: [path.dirname(filePath), path.dirname(newFilePath)],
     mensaje: mensajeChore(task.id, 'tarea en diseno'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
index 28cd1a3..4fa2f93 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/registrar-coste.ts
@@ -537,6 +537,7 @@ export async function runRegistrarCosteCommand(
 
   const detalle = nAgentes > 0 ? ` (${String(nAgentes)} agente${nAgentes === 1 ? '' : 's'})` : '';
   const commit = autoCommit({
+    fase: 'registrar-coste',
     cwd: deps.repoCwd,
     rutas: [filePath],
     mensaje: mensajeChore(id, `coste ${fase} +${String(tokens)} tokens${detalle}`),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index f60db50..7a21cbf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -1072,6 +1072,7 @@ async function runReview(
   // la de destino, que ya contiene revision/ con la peticion y el
   // scaffold del informe).
   const commitResult = autoCommit({
+    fase: 'review',
     cwd: deps.repoCwd,
     rutas: [path.dirname(filePath), path.dirname(newFilePath)],
     mensaje: mensajeChore(task.id, `peticion de revision ronda ${ronda}`),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index 91b24be..6ff7b07 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -342,6 +342,7 @@ async function runStart(
   // TASK-098: sin ROADMAP. Este commit cae siempre en la rama de la tarea
   // (comprobado arriba), y el ROADMAP solo se regenera en la de integracion.
   const commitResult = autoCommit({
+    fase: 'start',
     cwd: deps.repoCwd,
     rutas: [path.dirname(filePath), path.dirname(newFilePath)],
     mensaje: mensajeChore(task.id, 'tarea en curso'),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
index 63be8e8..3333cdc 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/trocear.ts
@@ -130,6 +130,7 @@ export async function runTrocearCommand(
   }
 
   const commitResult = autoCommit({
+    fase: 'trocear',
     cwd: deps.repoCwd,
     rutas: [taskDir, ...ficheros.map((f) => path.dirname(f))],
     mensaje: mensajeChore(id, `troceo en ${troceo.ids.join(', ')}`),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
index 619686c..c789b94 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts
@@ -187,6 +187,7 @@ export async function runVeredictoCommand(
   const avisos: string[] = [];
 
   const commitResult = autoCommit({
+    fase: 'veredicto',
     cwd: deps.repoCwd,
     rutas: [informePath],
     mensaje: mensajeChore(task.id, `veredicto ronda ${ronda} (${valor})`),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
index 42c7c74..9faeadd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
@@ -274,6 +274,7 @@ export async function runVerificarMenoresCommand(
   }
 
   const commitResult = autoCommit({
+    fase: 'verificar-menores',
     cwd,
     rutas: backlogPath === null ? [tareaPath] : [tareaPath, backlogPath],
     mensaje: mensajeChore(task.id, `verificacion ligera ronda ${String(ronda)}`),
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 7bfdb4b..a31e695 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -11,6 +11,7 @@
  * | comando_sincronizacion       | null (desactivada)| fs/sincronizacion.ts    |
  * | rutas_sincronizacion         | []                | fs/sincronizacion.ts    |
  * | timeout_sincronizacion       | 60 (segundos)     | fs/sincronizacion.ts    |
+ * | fases_sincronizacion         | null (todas)      | fs/git-commit.ts (TASK-120) |
  * | excluir_de_revision          | dist, locks, tareas | commands/review.ts    |
  * | contexto_revision            | []                | commands/review.ts    |
  * | modo_flujo                   | manual            | core/flujo.ts, plan.ts, approve.ts |
@@ -155,6 +156,11 @@ export interface TaskcodeConfig {
   rutas_sincronizacion: readonly string[];
   /** Segundos que se le dejan al comando antes de matarlo. */
   timeout_sincronizacion: number;
+  /**
+   * TASK-120: fases (transiciones de taskctl) en las que corre
+   * `comando_sincronizacion`. null = en todas, como antes.
+   */
+  fases_sincronizacion: readonly FaseSincronizacion[] | null;
   /**
    * Patrones (`git :(glob)`) cuyo diff no se embebe en la peticion de
    * revision: aparecen solo en un `--stat`. `[]` = no excluir nada.
@@ -273,6 +279,7 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   comando_sincronizacion: null,
   rutas_sincronizacion: Object.freeze([]) as readonly string[],
   timeout_sincronizacion: 60,
+  fases_sincronizacion: null,
   excluir_de_revision: Object.freeze([
     '**/dist/**',
     '**/*.lock',
@@ -310,6 +317,7 @@ export const CLAVES_CONFIG = [
   'comando_sincronizacion',
   'rutas_sincronizacion',
   'timeout_sincronizacion',
+  'fases_sincronizacion',
   'excluir_de_revision',
   'contexto_revision',
   'modo_flujo',
@@ -577,6 +585,9 @@ export function parsearConfigConAvisos(
       case 'timeout_sincronizacion':
         config.timeout_sincronizacion = validarEnteroPositivo(donde, par.clave, par.valor);
         break;
+      case 'fases_sincronizacion':
+        config.fases_sincronizacion = validarFasesSincronizacion(donde, par.valor);
+        break;
       case 'excluir_de_revision':
         config.excluir_de_revision = validarPatronesExclusion(donde, par.valor);
         break;
@@ -990,6 +1001,52 @@ function validarComando(
  * Que la ruta no sea una carpeta no se puede saber sin disco: lo
  * comprueba resolverConfig, que si lo tiene.
  */
+/**
+ * TASK-120: las fases de taskctl cuyos commits automaticos pueden ejecutar
+ * `comando_sincronizacion` (el `fase` que cada llamador pasa a autoCommit).
+ */
+export const FASES_SINCRONIZACION = [
+  'new',
+  'import',
+  'plan',
+  'approve',
+  'start',
+  'review',
+  'veredicto',
+  'verificar-menores',
+  'finish',
+  'pausa',
+  'trocear',
+  'registrar-coste',
+  'codex-review',
+  'doctor-deploy',
+] as const;
+export type FaseSincronizacion = (typeof FASES_SINCRONIZACION)[number];
+
+function validarFasesSincronizacion(donde: string, valor: unknown): readonly FaseSincronizacion[] {
+  if (!Array.isArray(valor) || valor.length === 0) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "fases_sincronizacion" debe ser una lista no vacia entre corchetes, ` +
+        `y es ${describirValor(valor)}.
+` +
+        '        Ejemplo: fases_sincronizacion: [plan, finish]. Sin la clave, la sincronizacion ' +
+        'corre en todas las fases.'
+    );
+  }
+  const fases: FaseSincronizacion[] = [];
+  for (const elemento of valor) {
+    const fase = typeof elemento === 'string' ? elemento.trim() : '';
+    if (!(FASES_SINCRONIZACION as readonly string[]).includes(fase)) {
+      throw new ConfigError(
+        `[ERROR] ${donde}: "fases_sincronizacion" contiene "${String(elemento)}", que no es una fase. ` +
+          `Validas: ${FASES_SINCRONIZACION.join(', ')}.`
+      );
+    }
+    if (!fases.includes(fase as FaseSincronizacion)) fases.push(fase as FaseSincronizacion);
+  }
+  return fases;
+}
+
 function validarRutasSincronizacion(donde: string, valor: unknown): readonly string[] {
   if (!Array.isArray(valor) || valor.length === 0) {
     throw new ConfigError(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
index d2ae464..0b4a0ff 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/metricas.ts
@@ -221,6 +221,8 @@ export interface FilaMetricas {
   puntaAPunta: Duracion | null;
   /** TASK-097: minutos estimados que finish anoto en `## Duracion`, o null. */
   estimadaMin: number | null;
+  /** TASK-120: suma de la puerta `sincronizacion` del registro de puertas; null sin lineas de la tarea. */
+  sincronizacion: Duracion | null;
 }
 
 export interface EntradaMetricas {
@@ -236,6 +238,8 @@ export interface EntradaMetricas {
   informes?: readonly InformeLeido[];
   /** Bytes de cada `peticion-revision-N[-revisor].md`. */
   peticiones?: readonly { ronda: number; bytes: number }[];
+  /** TASK-120: segundos de sincronizacion de la tarea en el registro de puertas; sin dato, null. */
+  sincronizacionS?: number | null;
 }
 
 function kbPorRonda(peticiones: readonly { ronda: number; bytes: number }[]): PeticionRonda[] {
@@ -443,6 +447,10 @@ export function calcularFila(e: EntradaMetricas): FilaMetricas {
     kbPeticionPorRonda: kbPorRonda(e.peticiones ?? []),
     total: duracionSinPausas(marcas.plan, marcas.finish, marcas.intervalosPausa),
     finish: finishDe(e.body),
+    sincronizacion:
+      e.sincronizacionS === undefined || e.sincronizacionS === null
+        ? null
+        : { valor: Math.round(e.sincronizacionS * 1000), precision: 'segundo' },
     puntaAPunta: duracionSinPausas(marcas.start, marcas.finish, marcas.intervalosPausa),
     estimadaMin: estimadaAnotada(e.body),
     enPausa: enPausaDe(marcas),
@@ -531,6 +539,8 @@ export const COLUMNAS_METRICAS: readonly ColumnaMetricas[] = [
   // P-1: lo que dura el propio finish; punta_a_punta ya lo incluye.
   { cabecera: 'finish', valor: (f) => formatearDuracion(f.finish) },
   { cabecera: 'punta_a_punta', valor: (f) => formatearDuracion(f.puntaAPunta) },
+  // TASK-120: lo que suma comando_sincronizacion en la tarea (registro de puertas).
+  { cabecera: 'sinc', valor: (f) => formatearDuracion(f.sincronizacion) },
 ];
 
 /** Primera columna con varios proyectos (`--repo` repetido): el ID solo no identifica la tarea. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
new file mode 100644
index 0000000..8b46605
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/registro-puertas.ts
@@ -0,0 +1,75 @@
+/**
+ * TASK-120: formato comun del registro de puertas de verificacion. Puro, sin
+ * disco. Una linea por ejecucion de una puerta (la sincronizacion, y despues el
+ * freno Stop de TASK-111 y las verificaciones de review y finish de TASK-128),
+ * con seis campos separados por un tabulador:
+ *
+ *   puerta  tarea  instante  modo  duracion_s  resultado
+ *
+ * - puerta: que se ejecuto (`sincronizacion`, ...). Quien lee ignora las que no
+ *   conoce.
+ * - tarea: el ID (`TASK-123`, `TASK-123a`) o `-` si no hay tarea.
+ * - instante: ISO 8601 en UTC del final de la ejecucion.
+ * - modo: el contexto de la puerta (para la sincronizacion, la fase de taskctl).
+ * - duracion_s: segundos, con un decimal.
+ * - resultado: el desenlace, en una palabra o con guiones.
+ *
+ * El formato y su sitio (`.git/taskcode/puertas.log`) estan en
+ * docs/registro-puertas.md.
+ */
+
+export interface LineaPuerta {
+  puerta: string;
+  tarea: string;
+  instante: string;
+  modo: string;
+  duracionS: number;
+  resultado: string;
+}
+
+/** Un campo no puede llevar tabuladores ni saltos de linea: se cambian por espacios. */
+function campo(v: string): string {
+  const limpio = v.replace(/[\t\r\n]+/g, ' ').trim();
+  return limpio === '' ? '-' : limpio;
+}
+
+export function formatearLineaPuerta(l: LineaPuerta): string {
+  const duracion = Number.isFinite(l.duracionS) && l.duracionS >= 0 ? l.duracionS.toFixed(1) : '0.0';
+  return [campo(l.puerta), campo(l.tarea), campo(l.instante), campo(l.modo), duracion, campo(l.resultado)].join('\t');
+}
+
+/** Las lineas bien formadas del registro; el resto (vacias, rotas, de otro formato) se ignoran. */
+export function parsearRegistroPuertas(texto: string): LineaPuerta[] {
+  const lineas: LineaPuerta[] = [];
+  for (const cruda of texto.split(/\r?\n/)) {
+    const c = cruda.split('\t');
+    if (c.length !== 6) continue;
+    const duracionS = Number(c[4]);
+    if (!/^\d+(\.\d+)?$/.test(c[4] as string) || !Number.isFinite(duracionS)) continue;
+    lineas.push({
+      puerta: c[0] as string,
+      tarea: c[1] as string,
+      instante: c[2] as string,
+      modo: c[3] as string,
+      duracionS,
+      resultado: c[5] as string,
+    });
+  }
+  return lineas;
+}
+
+/** Segundos totales de `puerta` por tarea (las lineas de otras puertas no cuentan). */
+export function sumarPorTarea(lineas: readonly LineaPuerta[], puerta: string): Map<string, number> {
+  const suma = new Map<string, number>();
+  for (const l of lineas) {
+    if (l.puerta !== puerta) continue;
+    suma.set(l.tarea, (suma.get(l.tarea) ?? 0) + l.duracionS);
+  }
+  return suma;
+}
+
+/** El ID de tarea de un mensaje de commit (`chore(TASK-123): ...`), o null. */
+export function tareaDeMensaje(mensaje: string): string | null {
+  const m = /\bTASK-\d+[a-z]?\b/.exec(mensaje);
+  return m === null ? null : m[0];
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
index a158e25..918137f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
@@ -46,7 +46,9 @@
  */
 import { existsSync } from 'node:fs';
 import path from 'node:path';
-import { resolverConfig, resolverConfigConAvisos } from '../core/config.js';
+import { resolverConfig, resolverConfigConAvisos, type FaseSincronizacion } from '../core/config.js';
+import { tareaDeMensaje } from '../core/registro-puertas.js';
+import { anotarPuerta } from './registro-puertas.js';
 import { ROADMAP_RUTA } from '../core/roadmap.js';
 import { GitCommandError, currentBranch, isRemoteAvailable, runGit } from './git.js';
 import { prepararRoadmap, restaurarRoadmap, type ResultadoRoadmap } from './roadmap.js';
@@ -89,6 +91,12 @@ export interface AutoCommitOptions {
   push?: boolean;
   /** Solo para tests: opciones de la sincronizacion (timeout corto). */
   sincronizacion?: OpcionesSincronizacion;
+  /**
+   * TASK-120: la fase de taskctl que commitea. Con `fases_sincronizacion`, la
+   * sincronizacion solo corre en las fases listadas; es tambien el `modo` de su
+   * linea en el registro de puertas. Sin fase, corre siempre (modo `otra`).
+   */
+  fase?: FaseSincronizacion;
   /**
    * TASK-098: regenerar `tareas/ROADMAP.md` dentro de este commit. Solo
    * surte efecto si el commit cae en la rama de integracion (`rama_base`):
@@ -374,7 +382,27 @@ function regenerarRoadmap(cwd: string, rama: string): ResultadoRoadmap | null {
  */
 function sincronizar(opts: AutoCommitOptions): ResultadoSincronizacion {
   try {
-    return ejecutarSincronizacion(opts.cwd, resolverConfig(opts.cwd), opts.sincronizacion);
+    const config = resolverConfig(opts.cwd);
+    if (config.comando_sincronizacion === null) return SIN_SINCRONIZACION;
+    // TASK-120: solo en las fases declaradas (sin la clave, en todas).
+    if (
+      config.fases_sincronizacion !== null &&
+      opts.fase !== undefined &&
+      !config.fases_sincronizacion.includes(opts.fase)
+    ) {
+      return SIN_SINCRONIZACION;
+    }
+    const inicio = Date.now();
+    const r = ejecutarSincronizacion(opts.cwd, config, opts.sincronizacion);
+    anotarPuerta(opts.cwd, {
+      puerta: 'sincronizacion',
+      tarea: tareaDeMensaje(opts.mensaje) ?? '-',
+      instante: new Date().toISOString(),
+      modo: opts.fase ?? 'otra',
+      duracionS: (Date.now() - inicio) / 1000,
+      resultado: r.estado,
+    });
+    return r;
   } catch (e: unknown) {
     return {
       estado: 'fallida',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
new file mode 100644
index 0000000..e458080
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/registro-puertas.ts
@@ -0,0 +1,44 @@
+/**
+ * TASK-120: el fichero del registro de puertas (formato en
+ * core/registro-puertas.ts y docs/registro-puertas.md). Vive dentro del
+ * directorio de Git (`git rev-parse --git-path taskcode/puertas.log`), fuera
+ * del arbol de trabajo, como el registro de Git-Flow, y vale en un worktree.
+ */
+import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { formatearLineaPuerta, parsearRegistroPuertas, type LineaPuerta } from '../core/registro-puertas.js';
+
+/** Ruta absoluta del registro, o null si `cwd` no esta en un repo. */
+export function rutaRegistroPuertas(cwd: string): string | null {
+  const r = spawnSync('git', ['rev-parse', '--git-path', 'taskcode/puertas.log'], {
+    cwd,
+    encoding: 'utf8',
+    windowsHide: true,
+  });
+  const salida = (r.stdout ?? '').trim();
+  if (r.error !== undefined || r.status !== 0 || salida === '') return null;
+  return path.resolve(cwd, salida);
+}
+
+/** Anade una linea. Nunca lanza: un registro que no se puede escribir no tumba una transicion. */
+export function anotarPuerta(cwd: string, linea: LineaPuerta): void {
+  try {
+    const ruta = rutaRegistroPuertas(cwd);
+    if (ruta === null) return;
+    mkdirSync(path.dirname(ruta), { recursive: true });
+    appendFileSync(ruta, `${formatearLineaPuerta(linea)}\n`, 'utf8');
+  } catch {
+    // sin registro: la transicion sigue
+  }
+}
+
+/** Las lineas del registro del repo de `cwd`; vacio si no hay registro o no se puede leer. */
+export function leerRegistroPuertas(cwd: string): LineaPuerta[] {
+  try {
+    const ruta = rutaRegistroPuertas(cwd);
+    return ruta === null ? [] : parsearRegistroPuertas(readFileSync(ruta, 'utf8'));
+  } catch {
+    return [];
+  }
+}
````

## Excluido del diff (24 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-120/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-120/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-120/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                 |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/codex-review.js            |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor-deploy-tareas.js    |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js     |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                  |  2 ++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/import.js                  |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/metricas.js                |  5 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                     |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/pausa.js                   |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                    |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/registrar-coste.js         |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                  |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                   |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/trocear.js                 |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/veredicto.js               |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-menores.js       |  1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                      | 46 ++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/metricas.js                    |  5 +++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/registro-puertas.js            | 64 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js                    | 23 ++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/registro-puertas.js              | 45 +++++++++++++++++++++++++++++++++++++++++++++
 24 files changed, 205 insertions(+), 2 deletions(-)
````

## Tests del diff (8 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/registro-puertas.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/approve.test.ts              |  16 ++++++++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/duracion-estimada.test.ts    |   4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts      |   4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas.test.ts             |   9 ++++++---
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-fases.test.ts | 102 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas-finish.test.ts          |   4 ++--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/metricas.test.ts                 |   6 +++---
 taskcode-marketplace/plugins/taskcode-plugin/test/core/registro-puertas.test.ts         |  74 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 8 files changed, 205 insertions(+), 14 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 94.1 s

Final de la salida (truncada: 134890 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.5489ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.4348ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.8778ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.9608ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.2234ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.9132ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.5156ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (6.2011ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.7504ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3576ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3038ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.4847ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3069ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.5057ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (35.8292ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.0967ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (1.0635ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.4828ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4983ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.1953ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1866ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.1938ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2008ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2805ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2084ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2663ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1818ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.171ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1735ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1587ms)
✔ resolverAsignado: recorta los tres escalones (0.1585ms)
ℹ tests 866
ℹ suites 0
ℹ pass 865
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 84302.7993
[verificar-impacto] node --test termino con 0 en 84.4 s.
````
