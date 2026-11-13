# Peticion de revision — TASK-113 (ronda 2)

- Tarea: TASK-113 — P-5: peticion de revision mas ligera con los tests como --stat y ruta
- Rama revisada: feature/task-113-p-5-peticion-de-revision-mas-ligera-con
- Rama base: develop
- Commit revisado (HEAD): 63f06cadd3a999416ee01f41fbbc5328ee0e1cfa
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-113 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 1bb49b1d0ec8c1ff4f3321be6d5a0556de95203d (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (2 hallazgo(s)))

## Instrucciones para el agente revisor (verificacion acotada)

Eres un revisor INDEPENDIENTE del agente que implemento. La rama ya paso una
revision completa: esta ronda verifica las correcciones de la ronda anterior,
no vuelve a revisar la rama entera. Haz esto, y nada mas:

1. Comprueba, uno por uno, que cada hallazgo pendiente de tu tabla de abajo
   queda resuelto por el diff de esta ronda (los marcados `corregido` tambien:
   verificalo, no lo des por bueno). Para un CRITICO o IMPORTANTE, reproduce el
   fallo original y comprueba que ya no ocurre; puedes leer el repo entero si la
   causa no esta en el diff.
2. Ejecuta la suite (o el comando de verificacion del proyecto) sobre el commit
   revisado y di el resultado: verificar sin ejecutar no vale.
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

- tareas/03-en-revision/TASK-113/tarea.md
- tareas/03-en-revision/TASK-113/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:655 (`statDeFicheros`), tambien :346 y src/commands/review.ts:106 (`seccionTests`) | informe-revision-1.md |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts:310 (`PATRONES_TEST`) frente a src/core/menores.ts:76 (`esRutaDeTest`) | informe-revision-1.md |

## Commits a revisar (git log 1bb49b1d0ec8c1ff4f3321be6d5a0556de95203d..HEAD)

````
63f06ca chore(TASK-113): veredicto ronda 1 (cambios-solicitados)
050da90 fix(TASK-113): verificar-menores no cuenta como codigo sin revisar lo excluido de la revision
d89efdf chore(TASK-113): veredicto ronda 1 (aprobada-con-correcciones)
c6c4fd4 fix(TASK-113): stat de tests por lotes y orden por patrones con muchos tests (MEN-1, MEN-2)
0307fdf chore(TASK-113): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 1bb49b1d0ec8c1ff4f3321be6d5a0556de95203d..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 8b29358..f60db50 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -68,6 +68,7 @@ import {
   diffParaRevision,
   diffRangeForPaths,
   statDeFicheros,
+  PATRONES_TEST,
   hayMergesEntre,
   baseDeTipoSinRed,
 } from '../fs/git.js';
@@ -490,10 +491,21 @@ async function leerRondaPrevia(revisionDir: string): Promise<RondaPrevia> {
  * peticion): se listan con su `--stat` y su ruta, y con la orden que da su
  * diff. Sin tests, no hay seccion.
  */
+/** TASK-113: hasta cuantos tests la orden de la peticion los nombra uno a uno. */
+export const MAX_RUTAS_ORDEN_TESTS = 20;
+
 function seccionTests(desde: string, extras: ExtrasPeticion): string {
   const tests = extras.tests ?? [];
   if (tests.length === 0) return '';
-  const rutas = tests.map((t) => `":(literal)${t}"`).join(' ');
+  // Con muchos tests, la orden por rutas no cabria en una linea de comandos
+  // (MEN-1 de la revision): se pide por los patrones de test.
+  const rutas =
+    tests.length <= MAX_RUTAS_ORDEN_TESTS
+      ? tests.map((t) => `":(literal)${t}"`).join(' ')
+      : [
+          ...PATRONES_TEST.map((p) => `":(glob)${p}"`),
+          ...(extras.patrones ?? []).map((p) => `":(exclude,glob)${p}"`),
+        ].join(' ');
   const stat = (extras.statTests ?? '').replace(/\s+$/, '');
   const fence = fenceFor(stat);
   return (
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
index c0d936c..42c7c74 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-menores.ts
@@ -42,6 +42,7 @@ import { readTareaFile, writeTareaFile } from '../fs/task-store.js';
 import { INFORME_REVISION_RE, PETICION_REVISION_RE, informesDeUltimaRonda } from '../fs/rondas.js';
 import { isAncestor, runGit } from '../fs/git.js';
 import { resolverConfig } from '../core/config.js';
+import { excluirDeRevision } from '../fs/revisores-rango.js';
 import { autoCommit, extraerPushFlag, mensajeChore, type AutoCommitResult } from '../fs/git-commit.js';
 import { REVISION_DIRNAME } from './review.js';
 
@@ -71,14 +72,25 @@ export interface VerificarMenoresCommandResult {
 }
 
 /**
- * Pathspec de Git para «todo el repo menos `tareas/` y los ficheros que
- * regenera `comando_sincronizacion`», desde cualquier subdirectorio. Los
+ * Pathspec de Git para «todo el repo menos `tareas/`, los ficheros que
+ * regenera `comando_sincronizacion` y lo que `review` no embebe
+ * (`excluir_de_revision` y los held-out)», desde cualquier subdirectorio. Los
  * derivados viajan en los commits de cada transicion (tambien en los de
- * despues de revisar): no son codigo que nadie reviso.
+ * despues de revisar): no son codigo que nadie reviso. Lo excluido de la
+ * revision tampoco (TASK-113): el revisor nunca lo leyo, asi que un `dist/`
+ * recompilado tras corregir un MENOR no es codigo sin revisar.
  */
 function fueraDeTareas(cwd: string): string[] {
-  const derivados = resolverConfig(cwd).rutas_sincronizacion.map((r) => `:(top,literal,exclude)${r}`);
-  return ['--', ':(top)', `:(top,exclude)${runGit(['rev-parse', '--show-prefix'], cwd)}tareas/`, ...derivados];
+  const config = resolverConfig(cwd);
+  const derivados = config.rutas_sincronizacion.map((r) => `:(top,literal,exclude)${r}`);
+  const excluidos = excluirDeRevision(config.excluir_de_revision).map((p) => `:(top,glob,exclude)${p}`);
+  return [
+    '--',
+    ':(top)',
+    `:(top,exclude)${runGit(['rev-parse', '--show-prefix'], cwd)}tareas/`,
+    ...derivados,
+    ...excluidos,
+  ];
 }
 
 /** Ficheros (rutas desde la raiz del repo) que cambian fuera de `tareas/` entre dos commits. */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 7e09c45..77b6236 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -302,10 +302,13 @@ export interface DiffParaRevision {
 }
 
 /**
- * TASK-113: globs de Git que reproducen la heuristica de fichero de test de
- * `esRutaDeTest` (core/menores.ts): carpetas `test/`, `tests/` y
- * `__tests__/` a cualquier profundidad, y nombres `*.test.*` y `*.spec.*`.
- * Los calcula Git, como el resto de patrones de la peticion.
+ * TASK-113: globs de Git equivalentes, salvo en bordes, a la heuristica de
+ * fichero de test de `esRutaDeTest` (core/menores.ts): carpetas `test/`,
+ * `tests/` y `__tests__/` a cualquier profundidad, y nombres `*.test.*` y
+ * `*.spec.*`. Los calcula Git, como el resto de patrones de la peticion.
+ * Bordes conocidos (MEN-2 de la revision): una carpeta `x.test.y/` es test
+ * para `esRutaDeTest` y no para Git, y con `core.ignorecase` Git casa
+ * `Test/`. Lo peor es embeber de mas o listar de menos: nada se pierde.
  */
 export const PATRONES_TEST: readonly string[] = [
   '**/test/**',
@@ -653,13 +656,24 @@ export function diffRangeForPaths(
  * leer.
  */
 export function statDeFicheros(desde: string, hasta: string, paths: readonly string[], cwd: string): string {
-  if (paths.length === 0) return '';
-  return runGit(
-    [...SIN_COMILLAS, 'diff', '--stat=200', `${desde}..${hasta}`, '--', ...paths.map((p) => `:(literal)${p}`)],
-    cwd
-  );
+  // Por lotes (MEN-1 de la revision): con miles de rutas largas, una sola
+  // llamada pasa del limite de la linea de comandos de Windows (ENAMETOOLONG).
+  const salidas: string[] = [];
+  for (let i = 0; i < paths.length; i += LOTE_RUTAS_STAT) {
+    const lote = paths.slice(i, i + LOTE_RUTAS_STAT);
+    salidas.push(
+      runGit(
+        [...SIN_COMILLAS, 'diff', '--stat=200', `${desde}..${hasta}`, '--', ...lote.map((p) => `:(literal)${p}`)],
+        cwd
+      ).replace(/\s+$/, '')
+    );
+  }
+  return salidas.length === 0 ? '' : `${salidas.join('\n')}\n`;
 }
 
+/** Rutas por llamada a Git en `statDeFicheros`: lejos del limite de Windows (32 K caracteres). */
+export const LOTE_RUTAS_STAT = 100;
+
 /**
  * Rutas (con "/" de Git, no separador del SO) de los ficheros bajo
  * `prefix` en el arbol de `ref`, sin tocar el working tree. Lo usa
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 1bb49b1d0ec8c1ff4f3321be6d5a0556de95203d..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/02-en-curso/TASK-113/tarea.md                                                        |  40 -------------
 tareas/{02-en-curso => 03-en-revision}/TASK-113/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-113/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-113/revision/informe-revision-1.md                               |  46 ++++++++++++++
 tareas/03-en-revision/TASK-113/revision/peticion-revision-1.md                              | 326 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-113/tarea.md                                                     |  75 +++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                    |  13 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-menores.js         |  22 +++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                             |  24 +++++---
 9 files changed, 492 insertions(+), 54 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 1bb49b1d0ec8c1ff4f3321be6d5a0556de95203d..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts | 42 +++++++++++++++++++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-menores.test.ts | 17 +++++++++++++++++
 2 files changed, 58 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 132.1 s

Final de la salida (truncada: 135607 bytes en total):

````
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6972ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.8907ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9836ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (5.4573ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (9.0202ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.8978ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.1101ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (6.1237ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.8107ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.5734ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3308ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.5021ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3722ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.4857ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (44.4718ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.3246ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (1.606ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.8394ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4001ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2074ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.2408ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.3317ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2554ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2417ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2332ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2713ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.3043ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.2046ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.2075ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1998ms)
✔ resolverAsignado: recorta los tres escalones (0.1975ms)
ℹ tests 850
ℹ suites 0
ℹ pass 850
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 121154.0755
[verificar-impacto] node --test termino con 0 en 121.3 s.
````
