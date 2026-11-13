# Peticion de revision — TASK-113 (ronda 1)

- Tarea: TASK-113 — P-5: peticion de revision mas ligera con los tests como --stat y ruta
- Rama revisada: feature/task-113-p-5-peticion-de-revision-mas-ligera-con
- Rama base: develop
- Commit revisado (HEAD): 1bb49b1d0ec8c1ff4f3321be6d5a0556de95203d
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-113 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-113/tarea.md
- tareas/03-en-revision/TASK-113/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts

## Commits a revisar (git log develop..HEAD)

````
1bb49b1 feat(TASK-113): la peticion de revision lista los tests con --stat y ruta, sin su diff
b3beff8 chore(TASK-113): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index a31b006..8b29358 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -67,6 +67,7 @@ import {
   logOneline,
   diffParaRevision,
   diffRangeForPaths,
+  statDeFicheros,
   hayMergesEntre,
   baseDeTipoSinRed,
 } from '../fs/git.js';
@@ -240,9 +241,11 @@ export function peticionTemplate(
   const diffBlock =
     diff !== ''
       ? diff
-      : (extras.excluidos ?? []).length > 0
-        ? '(todo el diff quedo excluido: ver "Excluido del diff" mas abajo)'
-        : '(sin diferencias respecto a la base)';
+      : (extras.tests ?? []).length > 0
+        ? '(solo cambian tests: ver "Tests del diff" mas abajo)'
+        : (extras.excluidos ?? []).length > 0
+          ? '(todo el diff quedo excluido: ver "Excluido del diff" mas abajo)'
+          : '(sin diferencias respecto a la base)';
   const fence = fenceFor(commitsBlock, diffBlock);
   return (
     `# Peticion de revision — ${task.id} (ronda ${ronda})\n\n` +
@@ -278,6 +281,7 @@ export function peticionTemplate(
     `${diffBlock}\n` +
     `${fence}\n` +
     seccionExcluidos(desde, extras) +
+    seccionTests(desde, extras) +
     (extras.seccionCobertura ?? '') +
     (extras.seccionVerificacion ?? '')
   );
@@ -348,6 +352,10 @@ export interface ExtrasPeticion {
   excluidos?: readonly string[];
   /** `git diff --stat` de los excluidos. */
   stat?: string;
+  /** TASK-113: ficheros de test de esta peticion; su diff no se embebe. */
+  tests?: readonly string[];
+  /** TASK-113: `git diff --stat` de `tests`. */
+  statTests?: string;
   /** Patrones de exclusion aplicados, para la orden que recupera su diff. */
   patrones?: readonly string[];
   /** TASK-040: inicio del rango en una ronda incremental. */
@@ -477,6 +485,30 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
   };
 }
 
+/**
+ * TASK-113: los tests no se embeben (eran la mayor parte de los bytes de la
+ * peticion): se listan con su `--stat` y su ruta, y con la orden que da su
+ * diff. Sin tests, no hay seccion.
+ */
+function seccionTests(desde: string, extras: ExtrasPeticion): string {
+  const tests = extras.tests ?? [];
+  if (tests.length === 0) return '';
+  const rutas = tests.map((t) => `":(literal)${t}"`).join(' ');
+  const stat = (extras.statTests ?? '').replace(/\s+$/, '');
+  const fence = fenceFor(stat);
+  return (
+    `\n## Tests del diff (${tests.length} fichero(s))\n\n` +
+    'Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su\n' +
+    'diff con:\n\n' +
+    `${fence}\n` +
+    `git diff ${desde}..HEAD -- ${rutas}\n` +
+    `${fence}\n\n` +
+    `${fence}\n` +
+    `${stat}\n` +
+    `${fence}\n`
+  );
+}
+
 /**
  * Lo excluido del diff no desaparece: se dice que es, cuanto pesa y con
  * que orden se pide (TASK-034). Sin excluidos, no hay seccion.
@@ -909,9 +941,22 @@ async function runReview(
       // diff entero. Sin fragmentar, el unico grupo ya es "todos los
       // ficheros" y se reusa el diff completo ya calculado arriba, para
       // no repetir la misma llamada a Git dos veces.
+      // TASK-113: los tests del grupo no se embeben; van con su --stat y su ruta.
+      const esTest = new Set(paraRevision.tests);
+      const testsDelGrupo = plan.fragmentado
+        ? escritura.ficheros.filter((f) => esTest.has(f))
+        : paraRevision.tests;
       const diffDelGrupo = plan.fragmentado
-        ? diffRangeForPaths(desde, 'HEAD', escritura.ficheros, deps.repoCwd)
+        ? diffRangeForPaths(
+            desde,
+            'HEAD',
+            escritura.ficheros.filter((f) => !esTest.has(f)),
+            deps.repoCwd
+          )
         : diff;
+      const statTestsDelGrupo = plan.fragmentado
+        ? statDeFicheros(desde, 'HEAD', testsDelGrupo, deps.repoCwd)
+        : paraRevision.statTests;
       const alcanceDiff = plan.fragmentado
         ? `Diff de tu dominio (${escritura.ficheros.length} fichero(s) de ` +
           `${ficherosTocados.length}; git diff ${desde}..HEAD -- <tus ficheros>)`
@@ -941,6 +986,8 @@ async function runReview(
             ...(modeloRonda === null ? {} : { modeloRonda }),
             excluidos: paraRevision.excluidos,
             stat: paraRevision.stat,
+            tests: testsDelGrupo,
+            statTests: statTestsDelGrupo,
             patrones: excluir,
             ...(incremental && desde !== baseBranch ? { desde } : {}),
             ...(previa !== null
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 5b168f9..7e09c45 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -287,12 +287,34 @@ export interface DiffParaRevision {
   incluidos: string[];
   /** Ficheros que cambian pero casan con algun patron de exclusion. */
   excluidos: string[];
-  /** `git diff desde..hasta` sin los excluidos. */
+  /** `git diff desde..hasta` sin los excluidos ni los tests (TASK-113). */
   diff: string;
   /** `git diff --stat` de solo los excluidos ('' si no hay ninguno). */
   stat: string;
+  /**
+   * TASK-113: los incluidos que son tests (casan con `PATRONES_TEST`). Siguen
+   * en `incluidos` (cuentan para repartir revisoras), pero su diff no va en
+   * `diff`: la peticion los lista con su `--stat` y su ruta.
+   */
+  tests: string[];
+  /** `git diff --stat` de solo `tests` ('' si no hay ninguno). */
+  statTests: string;
 }
 
+/**
+ * TASK-113: globs de Git que reproducen la heuristica de fichero de test de
+ * `esRutaDeTest` (core/menores.ts): carpetas `test/`, `tests/` y
+ * `__tests__/` a cualquier profundidad, y nombres `*.test.*` y `*.spec.*`.
+ * Los calcula Git, como el resto de patrones de la peticion.
+ */
+export const PATRONES_TEST: readonly string[] = [
+  '**/test/**',
+  '**/tests/**',
+  '**/__tests__/**',
+  '**/*.test.*',
+  '**/*.spec.*',
+];
+
 /**
  * El diff que se embebe en una peticion de revision (TASK-034), sin los
  * ficheros que casan con `excluir` (patrones `git :(glob)`, ya
@@ -312,15 +334,16 @@ export function diffParaRevision(
   cwd: string
 ): DiffParaRevision {
   const rango = `${desde}..${hasta}`;
-  const sinExcluidos = pathspecSinExcluidos(excluir);
   const { incluidos, excluidos } = ficherosParaRevision(desde, hasta, excluir, cwd);
+  // Los tests son los incluidos que desaparecen al excluir tambien PATRONES_TEST.
+  const sinTests = new Set(ficherosParaRevision(desde, hasta, [...excluir, ...PATRONES_TEST], cwd).incluidos);
+  const tests = incluidos.filter((f) => !sinTests.has(f));
   return {
     incluidos,
     excluidos,
-    diff:
-      excluir.length === 0
-        ? runGit([...SIN_COMILLAS, 'diff', rango], cwd)
-        : runGit([...SIN_COMILLAS, 'diff', rango, ...sinExcluidos], cwd),
+    tests,
+    statTests: statDeFicheros(desde, hasta, tests, cwd),
+    diff: runGit([...SIN_COMILLAS, 'diff', rango, ...pathspecSinExcluidos([...excluir, ...PATRONES_TEST])], cwd),
     stat:
       excluidos.length === 0
         ? ''
@@ -623,6 +646,20 @@ export function diffRangeForPaths(
   );
 }
 
+/**
+ * TASK-113: `git diff --stat=200 <desde>..<hasta> -- <paths>` de rutas reales
+ * (`:(literal)`). Vacio si `paths` esta vacio, sin llamar a Git. `--stat=200`:
+ * a 80 columnas Git abrevia las rutas con ".../" y el revisor no sabria cual
+ * leer.
+ */
+export function statDeFicheros(desde: string, hasta: string, paths: readonly string[], cwd: string): string {
+  if (paths.length === 0) return '';
+  return runGit(
+    [...SIN_COMILLAS, 'diff', '--stat=200', `${desde}..${hasta}`, '--', ...paths.map((p) => `:(literal)${p}`)],
+    cwd
+  );
+}
+
 /**
  * Rutas (con "/" de Git, no separador del SO) de los ficheros bajo
  * `prefix` en el arbol de `ref`, sin tocar el working tree. Lo usa
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-113/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-113/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-113/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                  | 45 ++++++++++++++++++++++++++++++++++++++++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                           | 34 ++++++++++++++++++++++++++++++----
 5 files changed, 72 insertions(+), 10 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts | 186 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 186 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 156.4 s

Final de la salida (truncada: 132951 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.7636ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.8689ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1902ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.7667ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.767ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.8059ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.449ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (7.566ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.6923ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3525ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3028ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.4722ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.307ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.4493ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (37.4782ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (2.7674ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.9314ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.4682ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.307ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2267ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1844ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.201ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2045ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2201ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.1974ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.216ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.1611ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1767ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1655ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1584ms)
✔ resolverAsignado: recorta los tres escalones (0.1615ms)
ℹ tests 848
ℹ suites 0
ℹ pass 848
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 143940.3022
[verificar-impacto] node --test termino con 0 en 144.1 s.
````
