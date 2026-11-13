# Peticion de revision — TASK-115 (ronda 2)

- Tarea: TASK-115 — P-7: verificacion completa por lote de cierres en modo automatico
- Rama revisada: feature/task-115-p-7-verificacion-completa-por-lote-de-ci
- Rama base: develop
- Commit revisado (HEAD): 3026b9aa6a4609a4400d350785f0cd977e7be37f
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-115 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 1bd21284d4e6662a1aee15eaf266b27dee0fb24a (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

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

- tareas/03-en-revision/TASK-115/tarea.md
- tareas/03-en-revision/TASK-115/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/commands/finish-verificacion.ts:240 (`o.permitirSelectiva === true` de la condicion del lote) | informe-revision-1.md |

## Commits a revisar (git log 1bd21284d4e6662a1aee15eaf266b27dee0fb24a..HEAD)

````
3026b9a fix(TASK-115): tests de hotfix y release fuera del lote, pendiente sin duplicar ni perder y progreso del lote (IMP-1, MEN-1..3)
53f53a9 chore(TASK-115): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 1bd21284d4e6662a1aee15eaf266b27dee0fb24a..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
index fcdb834..60503ca 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
@@ -23,7 +23,8 @@ import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
 import { PUERTA_FINISH } from '../core/registro-puertas.js';
 import { serializeTareaFile } from '../core/tarea-file.js';
 import { isValidTaskId, STATE_FOLDER } from '../core/task.js';
-import { anotarLineaEnSeccion, pendienteDeLote, SECCION_VERIFICACION_LOTE } from '../core/transiciones.js';
+import { anotarLineaEnSeccion, MARCA_LOTE_VERDE, pendienteDeLote, SECCION_VERIFICACION_LOTE } from '../core/transiciones.js';
+import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { currentBranch, isWorkspaceClean, resolveIntegrationBranch } from '../fs/git.js';
 import { autoCommit, type AutoCommitResult } from '../fs/git-commit.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
@@ -44,6 +45,8 @@ export interface VerificarLoteDeps {
   ahora?: string;
   /** Solo para tests: sustituye al timeout de la verificacion (en ms). */
   timeoutMs?: number;
+  /** Progreso visible (por defecto, bajo el .git del repo). MEN-3: el comando recibe el contador. */
+  progreso?: Progreso;
 }
 
 export interface VerificarLoteResult {
@@ -115,7 +118,15 @@ export async function runVerificarLoteCommand(
   const commit = headDe(cwd);
   const timeoutS = config.timeout_verificacion;
   const inicio = Date.now();
-  const r = ejecutarVerificacion(cwd, comando, timeoutS, deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs });
+  // MEN-3 (revision TASK-115): como finish, el paso se ve y el comando recibe el contador (TASKCTL_PROGRESO).
+  const progreso = deps.progreso ?? crearProgreso(cwd);
+  progreso.fase(ids[0] as string, 'finish', ['verificacion lote']);
+  progreso.paso('verificacion lote');
+  const r = ejecutarVerificacion(cwd, comando, timeoutS, {
+    env: entornoConContador(process.env, progreso.contador()),
+    ...(deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs }),
+  });
+  progreso.terminar(r.estado === 'verde' ? 'ok' : 'en-rojo');
   anotarPuerta(cwd, {
     puerta: PUERTA_FINISH,
     tarea: '-',
@@ -149,7 +160,7 @@ export async function runVerificarLoteCommand(
     const body = anotarLineaEnSeccion(
       t.body,
       SECCION_VERIFICACION_LOTE,
-      `- ${instante}: lote en verde en ${commit.slice(0, 7)} (taskctl verificar-lote)`
+      `- ${instante}: ${MARCA_LOTE_VERDE} ${commit.slice(0, 7)} (taskctl verificar-lote)`
     );
     await writeFile(t.filePath, serializeTareaFile(t.task, body), 'utf8');
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
index 2b0fd30..5940194 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/transiciones.ts
@@ -355,24 +355,35 @@ export const SECCION_VERIFICACION_LOTE = '## Verificacion por lote';
 /** TASK-115: lo que marca una linea pendiente de lote (la ultima de la seccion manda). */
 export const MARCA_PENDIENTE_LOTE = 'pendiente de lote';
 
-/** TASK-115: anota en finish que la completa queda pendiente de lote. */
+/** TASK-115: lo que marca la linea con que verificar-lote resuelve las pendientes. */
+export const MARCA_LOTE_VERDE = 'lote en verde en';
+
+/**
+ * TASK-115: anota en finish que la completa queda pendiente de lote. Un
+ * reintento de finish con lo mismo no duplica la linea (MEN-1 de la revision).
+ */
 export function anotarPendienteLote(body: string, instante: string, comando: string): string {
-  const linea = `- ${instante}: ${MARCA_PENDIENTE_LOTE}; no se ejecuta \`${comando.replace(/`/g, "'")}\` (verificacion_por_lote)`;
-  return anotarLineaEnSeccion(body, SECCION_VERIFICACION_LOTE, linea);
+  const texto = `${MARCA_PENDIENTE_LOTE}; no se ejecuta \`${comando.replace(/`/g, "'")}\` (verificacion_por_lote)`;
+  return anotarLineaUnica(body, SECCION_VERIFICACION_LOTE, instante, texto);
 }
 
-/** TASK-115: true si la ultima linea de `## Verificacion por lote` esta pendiente. */
+/**
+ * TASK-115: true si `## Verificacion por lote` tiene una linea pendiente sin un
+ * «lote en verde» detras. Las demas lineas (notas a mano) no cuentan, y la
+ * seccion se busca como las demas, fuera de bloques de codigo (MEN-2).
+ */
 export function pendienteDeLote(body: string): boolean {
-  const lineas = body.replace(/\r/g, '').split('\n');
-  const i = lineas.findIndex((l) => l.trim() === SECCION_VERIFICACION_LOTE);
-  if (i === -1) return false;
-  let ultima = '';
-  for (let j = i + 1; j < lineas.length; j++) {
-    const l = (lineas[j] as string).trim();
-    if (l.startsWith('## ')) break;
-    if (l.startsWith('- ')) ultima = l;
+  const lineas = body.split(/\r?\n/);
+  const rango = rangoDeSeccion(lineas, SECCION_VERIFICACION_LOTE);
+  if (rango === null) return false;
+  let pendiente = false;
+  for (const l of lineas.slice(rango[0] + 1, rango[1])) {
+    const t = l.trim();
+    if (!t.startsWith('- ')) continue;
+    if (t.includes(MARCA_PENDIENTE_LOTE)) pendiente = true;
+    else if (t.includes(MARCA_LOTE_VERDE)) pendiente = false;
   }
-  return ultima.includes(MARCA_PENDIENTE_LOTE);
+  return pendiente;
 }
 
 /** TASK-100: seccion que deja `finish` cuando la tarea es solo documentacion y no corre la completa. */
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 1bd21284d4e6662a1aee15eaf266b27dee0fb24a..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-115/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-115/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-115/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-115/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-115/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-115/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-115/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-115/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-115/revision/informe-revision-1.md                                                  |  21 +++
 tareas/03-en-revision/TASK-115/revision/peticion-revision-1.md                                                 | 628 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-115/tarea.md                                                       |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-lote.js                               |  15 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/transiciones.js                                     |  41 ++++--
 13 files changed, 696 insertions(+), 20 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 1bd21284d4e6662a1aee15eaf266b27dee0fb24a..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts | 42 +++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 41 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 238.7 s
- Commit verificado: 3026b9aa6a4609a4400d350785f0cd977e7be37f
- Huella: 021a64a3f8878f3b3e7156374ee8112fd79b8e0c
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 107223 bytes en total):

````
✔ rama_base: cambia la rama que resolveBaseBranchForTipo devuelve para feature/fix/release (2987.8568ms)
✔ rama_base: NO afecta a hotfix, que sigue colgando de la rama principal detectada (3760.5204ms)
✔ rama_base: taskctl new CAMBIA de verdad a la rama configurada, no solo la calcula (5083.7146ms)
✔ agente_revisor_por_defecto: taskctl new lo escribe en el tarea.md (4336.0597ms)
✔ agente_revisor_por_defecto: --agente-revisor sigue mandando sobre el config (6508.7596ms)
✔ agente_revisor_por_defecto: taskctl import usa el MISMO valor que new (la duplicacion desaparecio) (8699.094ms)
✔ limite_wip: con limite 3, dos tareas abiertas ya no bloquean; con 1, si (57.2743ms)
✔ limite_wip: el mensaje de error dice el limite real, no "una sola tarea" (0.6992ms)
✔ invalido: limite_wip: dos (texto) aborta y dice que espera un entero (1.5553ms)
✔ invalido: limite_wip: 0 y limite_wip: -1 abortan (0 no significa "sin limite") (1.8056ms)
✔ invalido: limite_wip decimal o booleano tambien abortan (0.6524ms)
✔ invalido: rama_base vacia, en comillas o sin valor, aborta (0.7353ms)
✔ invalido: agente_revisor_por_defecto vacio aborta igual que rama_base (0.6556ms)
✔ clave desconocida: avisa (no aborta), sugiere la parecida, enumera las validas y se ignora (4.4038ms)
✔ una clave descartada por la decision #9 sigue siendo desconocida: avisa (TASK-061, antes abortaba) (6.5852ms)
✔ invalido: la misma clave dos veces aborta en vez de que gane la ultima en silencio (0.4823ms)
✔ invalido: linea sin ":" aborta hablando de CONFIG, no de frontmatter (0.3494ms)
✔ el mensaje de error nombra el fichero y la linea (0.3214ms)
✔ fallo cerrado real: resolveBaseBranchForTipo NO cae a "develop" con un config roto (2755.5135ms)
✔ fallo cerrado real: taskctl new aborta con un config roto y NO crea la tarea (2270.2765ms)
✔ fallo cerrado real: taskctl import aborta con un config roto (2744.7633ms)
✔ sintaxis: comentario inline tras el valor se descarta (0.5232ms)
✔ sintaxis: valores entrecomillados y con espacios de sobra se recortan (0.226ms)
✔ sintaxis: CRLF no rompe el parseo (0.2137ms)
✔ el parser compartido NO cambio el comportamiento del frontmatter (0.5368ms)
✔ ubicacion: se busca en la RAIZ del repo, tambien ejecutando desde un subdirectorio (2976.9517ms)
✔ ubicacion: la busqueda PARA en la raiz del repo (un config de mas arriba no manda) (496.9063ms)
✔ resolverConfig: un .taskcode que es un FICHERO aborta (no cae al default en silencio) (1244.2576ms)
✔ parsearConfig: modo_flujo acepta los tres valores (0.6075ms)
✔ parsearConfig: modo_flujo invalido aborta listando los tres validos y sugiriendo el parecido (0.7174ms)
✔ parsearConfig: modo_flujo repetido aborta (0.2423ms)
ℹ tests 922
ℹ suites 0
ℹ pass 922
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 210773.2696
[verificar-impacto] node --test termino con 0 en 211.0 s.
````
