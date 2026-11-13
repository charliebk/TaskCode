# Peticion de revision — TASK-119 (ronda 2)

- Tarea: TASK-119 — P-11: menos commits de proceso por tarea
- Rama revisada: feature/task-119-p-11-menos-commits-de-proceso-por-tarea
- Rama base: develop
- Commit revisado (HEAD): 1e7d2246e42c81c21bc646c6731299278439ef24
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-119 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde e9d49dcdee5fe1e024825e90d0717035ed01d936 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (5 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera ni los MENORES de la ronda anterior (tu
tabla solo trae CRITICOS e IMPORTANTES). Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale. Si esta peticion
   ya trae la verificacion de la ronda en verde para ese mismo commit, no la
   repitas: cita ese resultado y corre solo los tests de lo que verificas.
3. Busca en el diff de esta ronda el fallo que la correccion abre: es justo
   donde se cuelan los fallos nuevos. Si encuentras uno, construye el caso que
   lo rompe antes de reportarlo.

Solo abre un hallazgo NUEVO si es CRITICO o si lo introduce la propia correccion
(algo que el diff de esta ronda rompe). Lo demas que veas fuera de eso va como
nota al final del informe, no en la tabla: no abre otra ronda.

Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. En la tabla, cada hallazgo pendiente que ya este
resuelto va como `corregido`; el que no, `abierto`. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-119/tarea.md
- tareas/03-en-revision/TASK-119/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | test/commands/pendientes-fase.test.ts | informe-revision-1.md |

## Commits a revisar (git log e9d49dcdee5fe1e024825e90d0717035ed01d936..HEAD)

````
1e7d224 fix(TASK-119): lo apartado no vuelve encima de un merge a medias ni en otra rama; tests de los caminos de error (MEN-1, MEN-2, MEN-4, IMP-1)
a9229e5 chore(TASK-119): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff e9d49dcdee5fe1e024825e90d0717035ed01d936..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index f0a7c89..14cac33 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -18,6 +18,7 @@ import { runApproveCommand, ApproveCommandError } from './commands/approve.js';
 import { runReviewCommand, ReviewCommandError } from './commands/review.js';
 import { runCodexReviewCommand, CodexReviewCommandError } from './commands/codex-review.js';
 import { runVeredictoCommand, VeredictoCommandError } from './commands/veredicto.js';
+import { PendientesError } from './fs/pendientes.js';
 import { runVerificarMenoresCommand, VerificarMenoresCommandError } from './commands/verificar-menores.js';
 import { runFinishCommand, FinishCommandError } from './commands/finish.js';
 import { runSiguienteCommand, SiguienteCommandError } from './commands/siguiente.js';
@@ -835,6 +836,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         e instanceof AutoCommitError ||
         e instanceof ConfigError ||
         e instanceof ReviewCommandError ||
+        e instanceof PendientesError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
         e instanceof GitLaunchError ||
@@ -1197,6 +1199,7 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
         e instanceof AutoCommitError ||
         e instanceof ConfigError ||
         e instanceof FinishCommandError ||
+        e instanceof PendientesError ||
         e instanceof StateMachineError ||
         e instanceof TaskFolderConflictError ||
         e instanceof GitLaunchError ||
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index b931362..4f976f3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -755,21 +755,24 @@ async function runReview(
   const scriptName = SCRIPT_BY_TYPE[tipo];
   // TASK-040: la ronda incremental no ejecuta el update (el merge de la
   // base entraria en el delta); exige estar ya en la rama de la tarea.
-  const { code, signal } = incremental
-    ? { code: 0, signal: null }
-    : conPendientesApartados(deps.repoCwd, tareasRoot, initial!.task.id, () =>
-        runGitflowScript(scriptName, [rama, ...gitflowBaseArgs(tipo, deps.repoCwd)], {
-          scriptsDir: deps.scriptsDir,
-          cwd: deps.repoCwd,
-        })
-      );
-  if (code !== 0) {
-    const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
-    throw new ReviewCommandError(
-      `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
-        'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo y haz commit ' +
-        'antes de reintentar); la tarea no se ha movido de carpeta.'
-    );
+  // MEN-1 de la revision: el fallo del script lanza DENTRO de la ventana, para
+  // que lo apartado no se devuelva encima de un merge a medias y el error que
+  // se ve sea el del script (con la nota de como se recupera lo apartado).
+  if (!incremental) {
+    conPendientesApartados(deps.repoCwd, tareasRoot, initial!.task.id, () => {
+      const { code, signal } = runGitflowScript(scriptName, [rama, ...gitflowBaseArgs(tipo, deps.repoCwd)], {
+        scriptsDir: deps.scriptsDir,
+        cwd: deps.repoCwd,
+      });
+      if (code !== 0) {
+        const signalInfo = signal ? ` (terminado por senal ${signal})` : '';
+        throw new ReviewCommandError(
+          `[ERROR] ${id}: ${scriptName} termino con codigo ${code}${signalInfo}. ` +
+            'Revisa la salida de arriba (si hay un conflicto de merge, resuelvelo y haz commit ' +
+            'antes de reintentar); la tarea no se ha movido de carpeta.'
+        );
+      }
+    });
   }
 
   // Evidencia, no suposicion (TASK-007/009): rama activa correcta y
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
index c42f0bc..d7ef61b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts
@@ -17,7 +17,7 @@
  */
 import { existsSync } from 'node:fs';
 import path from 'node:path';
-import { GitCommandError, runGit } from './git.js';
+import { GitCommandError, currentBranch, runGit } from './git.js';
 
 export class PendientesError extends Error {}
 
@@ -45,22 +45,29 @@ export function hayCambiosFueraDeTarea(cwd: string, tareasRoot: string, id: stri
   return runGit(['status', '--porcelain', '--', ':(top)', `:(top,glob,exclude)${spec}`], cwd) !== '';
 }
 
-/** Referencia (`stash@{n}`) del stash de la tarea, o null si no hay. */
-function refApartado(cwd: string, id: string): string | null {
+/**
+ * El stash de la tarea (`stash@{n}`) y la rama en la que se hizo (el asunto de
+ * un `stash push -m` es `On <rama>: <mensaje>`), o null si no hay.
+ */
+function refApartado(cwd: string, id: string): { ref: string; rama: string | null } | null {
   const sufijo = `: ${mensajeApartado(id)}`;
   const lineas = runGit(['stash', 'list', '--format=%gd%x09%gs'], cwd).split('\n');
   for (const linea of lineas) {
     const [ref, asunto] = linea.split('\t');
-    if (ref !== undefined && asunto !== undefined && asunto.endsWith(sufijo)) return ref;
+    if (ref !== undefined && asunto !== undefined && asunto.endsWith(sufijo)) {
+      const rama = asunto.startsWith('On ') ? asunto.slice(3, asunto.length - sufijo.length) : null;
+      return { ref, rama };
+    }
   }
   return null;
 }
 
-/** Como recuperar a mano un stash que no se pudo devolver. */
-function comoRecuperar(id: string): string {
+/** Como recuperar un stash que no se pudo devolver. */
+function comoRecuperar(id: string, rama: string | null = null): string {
   return (
-    `Lo pendiente de la tarea (coste, veredicto, informe) esta en el stash "${mensajeApartado(id)}": ` +
-    'recuperalo con git stash list y git stash pop <ref> cuando el arbol este limpio.'
+    `Lo pendiente de la tarea (coste, veredicto, informe) esta en el stash "${mensajeApartado(id)}"` +
+    `${rama === null || rama === '' ? '' : `, hecho en "${rama}"`}: lo recupera el siguiente taskctl review o ` +
+    'finish lanzado desde esa rama con el arbol limpio (o git stash pop <ref> a mano).'
   );
 }
 
@@ -79,8 +86,18 @@ function pop(cwd: string, id: string, ref: string): void {
  * Devuelve true si habia algo que recuperar.
  */
 export function recuperarApartado(cwd: string, tareasRoot: string, id: string): boolean {
-  const ref = refApartado(cwd, id);
-  if (ref === null) return false;
+  const encontrado = refApartado(cwd, id);
+  if (encontrado === null) return false;
+  const { ref, rama } = encontrado;
+  // MEN-4 de la revision: se devuelve solo en la rama donde se aparto.
+  const actual = currentBranch(cwd);
+  if (rama !== null && rama !== actual) {
+    throw new PendientesError(
+      `[ERROR] ${id}: hay un stash de un intento anterior ("${mensajeApartado(id)}", ${ref}) hecho en "${rama}", ` +
+        `y la rama activa es "${actual === '' ? 'HEAD desacoplado' : actual}". Cambiate a "${rama}" ` +
+        `(git checkout ${rama}) y reintenta: lo recupera solo. No se ha tocado nada.`
+    );
+  }
   if (hayPendientesDeTarea(cwd, tareasRoot, id)) {
     throw new PendientesError(
       `[ERROR] ${id}: hay un stash de un intento anterior ("${mensajeApartado(id)}", ${ref}) y la carpeta de la ` +
@@ -99,7 +116,8 @@ export interface Apartado {
   devolver(): void;
   /**
    * Para los caminos de error: lo devuelve si se puede sin riesgo (sin merge a
-   * medias); si no, devuelve el texto que dice como recuperarlo a mano.
+   * medias y en la rama donde se aparto); si no, devuelve el texto que dice
+   * como recuperarlo.
    */
   devolverSiSePuede(): string | null;
 }
@@ -128,27 +146,10 @@ export function conPendientesApartados<T>(cwd: string, tareasRoot: string, id: s
   return r;
 }
 
-/** Igual que conPendientesApartados, para una `fn` asincrona. */
-export async function conPendientesApartadosAsync<T>(
-  cwd: string,
-  tareasRoot: string,
-  id: string,
-  fn: () => Promise<T>
-): Promise<T> {
-  const apartado = apartarPendientes(cwd, tareasRoot, id);
-  let r: T;
-  try {
-    r = await fn();
-  } catch (e: unknown) {
-    throw conNota(e, apartado.devolverSiSePuede());
-  }
-  apartado.devolver();
-  return r;
-}
-
 /** Aparta lo pendiente de la tarea en un stash con nombre propio (nada si no hay). */
 export function apartarPendientes(cwd: string, tareasRoot: string, id: string): Apartado {
   let activo = false;
+  const rama = currentBranch(cwd);
   if (hayPendientesDeTarea(cwd, tareasRoot, id)) {
     const spec = pathspecTarea(cwd, tareasRoot, id);
     runGit(['stash', 'push', '-q', '-u', '-m', mensajeApartado(id), '--', `:(top,glob)${spec}`], cwd);
@@ -156,10 +157,12 @@ export function apartarPendientes(cwd: string, tareasRoot: string, id: string):
   }
   const devolver = (): void => {
     if (!activo) return;
-    const ref = refApartado(cwd, id);
+    const encontrado = refApartado(cwd, id);
     activo = false;
-    if (ref === null) throw new PendientesError(`[ERROR] ${id}: el stash de lo pendiente ha desaparecido. ${comoRecuperar(id)}`);
-    pop(cwd, id, ref);
+    if (encontrado === null) {
+      throw new PendientesError(`[ERROR] ${id}: el stash de lo pendiente ha desaparecido. ${comoRecuperar(id, rama)}`);
+    }
+    pop(cwd, id, encontrado.ref);
   };
   return {
     get activo() {
@@ -168,9 +171,12 @@ export function apartarPendientes(cwd: string, tareasRoot: string, id: string):
     devolver,
     devolverSiSePuede(): string | null {
       if (!activo) return null;
+      // Ni con un merge a medias ni en otra rama (MEN-2 de la revision): ahi
+      // lo pendiente quedaria sucio donde no toca y un commit a mano lo barreria.
       if (existsSync(path.resolve(cwd, runGit(['rev-parse', '--git-path', 'MERGE_HEAD'], cwd)))) {
-        return comoRecuperar(id);
+        return comoRecuperar(id, rama);
       }
+      if (currentBranch(cwd) !== rama) return comoRecuperar(id, rama);
       try {
         devolver();
         return null;
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff e9d49dcdee5fe1e024825e90d0717035ed01d936..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-119/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-119/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-119/planificacion/brainstorm/peticion-unificador-1.md              |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-119/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-119/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |    0
 tareas/{02-en-curso => 03-en-revision}/TASK-119/planificacion/plan-final.md                                    |    0
 tareas/03-en-revision/TASK-119/revision/informe-revision-1.md                                                  |   21 ++
 tareas/03-en-revision/TASK-119/revision/peticion-revision-1.md                                                 | 1084 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-119/tarea.md                                                       |   11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                   |    3 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                       |   27 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/pendientes.js                                         |   63 ++---
 12 files changed, 1168 insertions(+), 41 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff e9d49dcdee5fe1e024825e90d0717035ed01d936..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/pendientes-fase.test.ts | 74 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 73 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 423.1 s
- Commit verificado: 1e7d2246e42c81c21bc646c6731299278439ef24
- Huella: f157b712b617aecc4c73ef2af655a5b6734c89e8
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 146331 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6748ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.7309ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0768ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.6937ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (16.6292ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.6383ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.1117ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (34.0199ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.8127ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3505ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.2988ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.5054ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.318ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.4996ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (36.3202ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.1846ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (1.5881ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.6079ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4682ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.265ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.7089ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.6412ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.6394ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.6233ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.5276ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.4997ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.191ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.3709ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.2345ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1783ms)
✔ resolverAsignado: recorta los tres escalones (0.2132ms)
ℹ tests 889
ℹ suites 0
ℹ pass 888
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 396223.1908
[verificar-impacto] node --test termino con 0 en 396.5 s.
````
