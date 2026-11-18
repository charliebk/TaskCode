# Peticion de revision — TASK-135 (ronda 1)

- Tarea: TASK-135 — diffRangeForPaths por lotes: ENAMETOOLONG en la revision fragmentada
- Rama revisada: fix/task-135-diffrangeforpaths-por-lotes-enametoolong
- Rama base: develop
- Commit revisado (HEAD): 14df38e3bda002b764c37beaad4e87aa31fd39c7
- Fecha: 2026-11-18
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-135 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-135/tarea.md
- tareas/03-en-revision/TASK-135/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/lotes-rutas.test.ts

## Commits a revisar (git log develop..HEAD)

````
14df38e fix(TASK-135): diffRangeForPaths y statDeFicheros por lotes de rutas y de caracteres
e054dc2 chore(TASK-135): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index dffb8aa..c37936a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -639,14 +639,20 @@ export function diffRangeForPaths(
   paths: readonly string[],
   cwd: string
 ): string {
-  if (paths.length === 0) return '';
   // `:(literal)` (TASK-054): son rutas reales, no patrones. Sin el,
   // `pages/[id].vue` se leeria como glob y el diff del grupo saldria vacio
   // o con otros ficheros.
-  return runGit(
-    [...SIN_COMILLAS, 'diff', `${desde}..${hasta}`, '--', ...paths.map((p) => `:(literal)${p}`)],
-    cwd
-  );
+  // TASK-135: por lotes. Un grupo de dominio con miles de ficheros (un
+  // volcado) pasaba del limite de la linea de comandos de Windows y Git no
+  // llegaba a lanzarse (ENAMETOOLONG). Cada lote da el diff completo de sus
+  // ficheros; runGit recorta la salida, asi que unirlos con '\n' da lo mismo
+  // que una sola llamada. Lista vacia: '' sin llamar a Git.
+  return lotesDeRutas(paths)
+    .map((lote) =>
+      runGit([...SIN_COMILLAS, 'diff', `${desde}..${hasta}`, '--', ...lote.map((p) => `${LITERAL}${p}`)], cwd)
+    )
+    .filter((salida) => salida !== '')
+    .join('\n');
 }
 
 /**
@@ -658,12 +664,12 @@ export function diffRangeForPaths(
 export function statDeFicheros(desde: string, hasta: string, paths: readonly string[], cwd: string): string {
   // Por lotes (MEN-1 de la revision): con miles de rutas largas, una sola
   // llamada pasa del limite de la linea de comandos de Windows (ENAMETOOLONG).
+  // TASK-135: el lote se corta tambien por caracteres (lotesDeRutas).
   const salidas: string[] = [];
-  for (let i = 0; i < paths.length; i += LOTE_RUTAS_STAT) {
-    const lote = paths.slice(i, i + LOTE_RUTAS_STAT);
+  for (const lote of lotesDeRutas(paths)) {
     salidas.push(
       runGit(
-        [...SIN_COMILLAS, 'diff', '--stat=200', `${desde}..${hasta}`, '--', ...lote.map((p) => `:(literal)${p}`)],
+        [...SIN_COMILLAS, 'diff', '--stat=200', `${desde}..${hasta}`, '--', ...lote.map((p) => `${LITERAL}${p}`)],
         cwd
       ).replace(/\s+$/, '')
     );
@@ -671,9 +677,49 @@ export function statDeFicheros(desde: string, hasta: string, paths: readonly str
   return salidas.length === 0 ? '' : `${salidas.join('\n')}\n`;
 }
 
-/** Rutas por llamada a Git en `statDeFicheros`: lejos del limite de Windows (32 K caracteres). */
+/** Rutas por llamada a Git en `statDeFicheros` y `diffRangeForPaths`: lejos del limite de Windows. */
 export const LOTE_RUTAS_STAT = 100;
 
+/**
+ * TASK-135: caracteres de pathspec por llamada a Git. El limite de Windows es
+ * de 32 767 caracteres para la linea ENTERA (programa, resto de argumentos,
+ * comillas que anade la conversion); 8000 deja margen de sobra. Con 100 rutas
+ * de 300 caracteres, el corte por numero solo no bastaba (MENOR de TASK-113).
+ */
+export const LOTE_CARACTERES_PATHSPEC = 8000;
+
+const LITERAL = ':(literal)';
+
+/**
+ * TASK-135: parte `rutas` en lotes consecutivos, sin reordenar, para pasarlas
+ * como `:(literal)<ruta>` a Git. Un lote se cierra al llegar a `maxRutas`
+ * rutas o cuando la siguiente haria pasar de `maxCaracteres` el pathspec
+ * acumulado (prefijo, ruta y el espacio que las separa). Una ruta que sola ya
+ * pasa del tope va sola en su lote: no se pierde, y si de verdad no cabe, Git
+ * dara su propio error. Lista vacia: ningun lote.
+ */
+export function lotesDeRutas(
+  rutas: readonly string[],
+  maxRutas: number = LOTE_RUTAS_STAT,
+  maxCaracteres: number = LOTE_CARACTERES_PATHSPEC
+): string[][] {
+  const lotes: string[][] = [];
+  let lote: string[] = [];
+  let caracteres = 0;
+  for (const ruta of rutas) {
+    const coste = LITERAL.length + ruta.length + 1;
+    if (lote.length > 0 && (lote.length >= maxRutas || caracteres + coste > maxCaracteres)) {
+      lotes.push(lote);
+      lote = [];
+      caracteres = 0;
+    }
+    lote.push(ruta);
+    caracteres += coste;
+  }
+  if (lote.length > 0) lotes.push(lote);
+  return lotes;
+}
+
 /**
  * Rutas (con "/" de Git, no separador del SO) de los ficheros bajo
  * `prefix` en el arbol de `ref`, sin tocar el working tree. Lo usa
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-135/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-135/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-135/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                           | 54 +++++++++++++++++++++++++++++++++++++++++++++++-------
 4 files changed, 49 insertions(+), 8 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/lotes-rutas.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts | 61 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/core/lotes-rutas.test.ts           | 46 ++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 106 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 353.4 s
- Commit verificado: 14df38e3bda002b764c37beaad4e87aa31fd39c7
- Huella: d1767303ddd65a39308adc6746b2a99e567d5d89
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 96976 bytes en total):

````
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.7197ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.0518ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.6499ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (4676.3551ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (3974.8576ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.8747ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2112ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9828ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6955ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6608ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1101ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.9196ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (15.8675ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (2.2929ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (8.5876ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.8322ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.6211ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (32.3143ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.9042ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4633ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4842ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3437ms)
✔ gitUserEmail: devuelve el user.email configurado en el repo (1103.4029ms)
✔ gitUserEmail: un user.email vacio cuenta como sin identidad (870.198ms)
✔ gitUserEmail: recorta el valor (876.33ms)
✔ git basico: workspace limpio, rama actual, nombre de rama valido y errores de Git con su mensaje (4965.501ms)
✔ git remoto y ramas: isRemoteAvailable, localBranchExists, resolveMainBranch y resolveBaseBranchForTipo (34092.5162ms)
✔ ensureBaseBranchReady: caminos felices, rechazos y pull --ff-only fallido (56432.067ms)
✔ isInsideWorkTree y operacionEnCurso contra repos reales (merge, cherry-pick, revert y sequencer) (38810.2027ms)
✔ runCodexReview: encuentra y lanza un "codex" real del PATH (no inyectado), y un argumento con espacios llega intacto (242.6868ms)
✔ runCodexReview: un argumento con forma "%VARIABLE%" no se expande con el valor real de esa variable de entorno (hallazgo IMPORTANTE de revision, ronda 2) (321.9384ms)
ℹ tests 745
ℹ suites 0
ℹ pass 744
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 325810.8486
[verificar-impacto] node --test termino con 0 en 326.2 s.
````
