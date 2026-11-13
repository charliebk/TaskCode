# Peticion de revision — TASK-117 (ronda 1)

- Tarea: TASK-117 — P-9: new propone la complejidad a partir de tareas parecidas ya cerradas
- Rama revisada: feature/task-117-p-9-new-propone-la-complejidad-a-partir
- Rama base: develop
- Commit revisado (HEAD): 2973dd702046bf6189339065a8ef354421d0fcc7
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-117 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-117/tarea.md
- tareas/03-en-revision/TASK-117/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-complejidad.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/complejidad-similar.test.ts

## Commits a revisar (git log develop..HEAD)

````
2973dd7 feat(TASK-117): new propone la complejidad de las tareas terminadas mas parecidas
9935a67 chore(TASK-117): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
index 755cfa6..699834e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/new/SKILL.md
@@ -31,7 +31,9 @@ arrancar sin volver a preguntar.
    ```
 
    Opcionales si la persona los da: `--sprint N`, `--etiquetas a,b`,
-   `--complejidad trivial|simple|media|alta|critica`.
+   `--complejidad trivial|simple|media|alta|critica`. Sin `--complejidad`,
+   `new` propone la de las tareas terminadas con mas etiquetas en comun y dice
+   de cuales sale: transmitela a la persona por si no encaja.
 4. Si falla, muestra el error tal cual: dice que corregir.
 5. Con el ID que imprime, sigue la seccion de avance de la skill de flujo
    (`task-workflow/avance.md`): `taskctl siguiente TASK-NNN --json` y lo que
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 2e149dd..560cd62 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -473,7 +473,13 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
           (result.conContenido
             ? ''
             : 'Rellena "## Objetivo" y los criterios de aceptacion antes de "taskctl plan": el ' +
-              'brainstorm se lanza a partir de ese texto (o pasalos con --objetivo y --criterio).\n')
+              'brainstorm se lanza a partir de ese texto (o pasalos con --objetivo y --criterio).\n') +
+          // TASK-117: la complejidad que se escribio sin --complejidad, y de donde sale.
+          (result.complejidadPropuesta === null
+            ? ''
+            : `Complejidad propuesta: ${result.complejidadPropuesta.valor} (mediana de ` +
+              `${result.complejidadPropuesta.desde.join(', ')}, con ${result.complejidadPropuesta.enComun} ` +
+              'etiqueta(s) en comun). Cambiala en tarea.md si no encaja.\n')
       );
       printAutoCommit(result.autoCommit);
       return 0;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index 5c0748f..2950947 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -28,7 +28,8 @@ import {
   type TaskComplexity,
 } from '../core/task.js';
 import { nextTaskId } from '../core/task-id.js';
-import { listExistingTaskIds, writeTareaFile } from '../fs/task-store.js';
+import { listExistingTaskIds, listTareasEnEstados, writeTareaFile } from '../fs/task-store.js';
+import { proponerComplejidad, type ComplejidadPropuesta } from '../core/complejidad-similar.js';
 import { CONFIG_DEFAULTS, resolverConfig } from '../core/config.js';
 import { extraerSecciones } from '../core/tarea-body.js';
 
@@ -300,6 +301,8 @@ export async function crearTareaEn(
 export interface NewCommandResult {
   /** TASK-041: true si la tarea nacio con objetivo o criterios. */
   conContenido: boolean;
+  /** TASK-117: la complejidad propuesta por tareas parecidas, si se escribio. */
+  complejidadPropuesta: ComplejidadPropuesta | null;
   id: string;
   filePath: string;
   baseBranchGuard: BaseBranchGuardResult;
@@ -367,6 +370,17 @@ export async function runNewCommand(
   const baseBranchGuard = ensureBaseBranchReady(opts.tipo, deps.repoCwd);
   const existingIds = await listExistingTaskIds(tareasRoot);
   const id = nextTaskId(existingIds);
+  // TASK-117: sin --complejidad, la de las terminadas que mas etiquetas
+  // comparten (las ilegibles se ignoran: no abortan `new`).
+  let complejidadPropuesta: ComplejidadPropuesta | null = null;
+  if (opts.complejidad === null) {
+    const { tareas } = await listTareasEnEstados(tareasRoot, ['terminada']);
+    complejidadPropuesta = proponerComplejidad(
+      opts.etiquetas,
+      tareas.map((t) => t.task)
+    );
+    if (complejidadPropuesta !== null) opts.complejidad = complejidadPropuesta.valor;
+  }
   const { filePath } = await crearTareaEn(tareasRoot, id, opts, cuerpo, today);
   // Auto-commit (TASK-030, item C2): se commitea la CARPETA de la tarea
   // recien creada, no el arbol. La decision #14 fijo commitear si y
@@ -381,6 +395,7 @@ export async function runNewCommand(
   });
   return {
     conContenido: cuerpo !== DEFAULT_BODY,
+    complejidadPropuesta,
     id,
     filePath,
     baseBranchGuard,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts
new file mode 100644
index 0000000..d36b843
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/complejidad-similar.ts
@@ -0,0 +1,58 @@
+/**
+ * TASK-117: complejidad propuesta para una tarea nueva a partir de las tareas
+ * terminadas que mas se le parecen. Puro, sin disco: `new` le pasa las
+ * terminadas ya leidas.
+ *
+ * La complejidad declarada decide cuantos roles de diseno se lanzan, pero hay
+ * proyectos que no la declaran nunca y otros donde no predice el coste. Esto no
+ * la calcula de la nada: propone la que ya se uso en las tareas cerradas que
+ * comparten mas etiquetas con la nueva, y dice de cuales sale.
+ */
+import { TASK_COMPLEXITIES, type TaskComplexity } from './task.js';
+
+/** Lo minimo de una tarea terminada que hace falta para comparar. */
+export interface TareaComparable {
+  id: string;
+  etiquetas: readonly string[];
+  complejidad: TaskComplexity | null;
+}
+
+export interface ComplejidadPropuesta {
+  valor: TaskComplexity;
+  /** IDs de las tareas de las que sale, ordenados. */
+  desde: string[];
+  /** Cuantas etiquetas comparten con la nueva. */
+  enComun: number;
+}
+
+/**
+ * La mediana de las complejidades de las terminadas que comparten MAS
+ * etiquetas con la nueva (al menos una), en el orden trivial < simple < media
+ * < alta < critica. Con un numero par de parecidas, la inferior de las dos
+ * centrales: la mas barata (la heuristica del plan puede subirla). null sin
+ * etiquetas, sin terminadas con complejidad declarada o sin ninguna en comun.
+ */
+export function proponerComplejidad(
+  etiquetas: readonly string[],
+  terminadas: readonly TareaComparable[]
+): ComplejidadPropuesta | null {
+  const propias = new Set(etiquetas.map((e) => e.toLowerCase()));
+  if (propias.size === 0) return null;
+  let max = 0;
+  let parecidas: TareaComparable[] = [];
+  for (const t of terminadas) {
+    if (t.complejidad === null) continue;
+    const comunes = new Set(t.etiquetas.map((e) => e.toLowerCase()).filter((e) => propias.has(e))).size;
+    if (comunes === 0 || comunes < max) continue;
+    if (comunes > max) {
+      max = comunes;
+      parecidas = [];
+    }
+    parecidas.push(t);
+  }
+  if (parecidas.length === 0) return null;
+  const orden = (c: TaskComplexity): number => TASK_COMPLEXITIES.indexOf(c);
+  const valores = parecidas.map((t) => t.complejidad as TaskComplexity).sort((a, b) => orden(a) - orden(b));
+  const valor = valores[Math.floor((valores.length - 1) / 2)] as TaskComplexity;
+  return { valor, desde: parecidas.map((t) => t.id).sort(), enComun: max };
+}
````

## Excluido del diff (6 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-117/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-117/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-117/tarea.md                                    |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                              |  8 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                     | 13 ++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/complejidad-similar.js         | 43 +++++++++++++++++++++++++++++++++++++++++++
 6 files changed, 64 insertions(+), 3 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-complejidad.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/complejidad-similar.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-complejidad.test.ts | 115 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/complejidad-similar.test.ts |  52 +++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 167 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 63.3 s

Final de la salida (truncada: 107241 bytes en total):

````
✔ main: taskctl start sale con codigo 1 y mensaje util cuando el limite esta ocupado (9632.3334ms)
[2026-11-13 00:41:32] [WARN ] No hay conexion con origin (VPN/credenciales/red). Se continuara en modo local.
[2026-11-13 00:41:32] [INFO ] Ya estamos en develop.
[2026-11-13 00:41:32] [WARN ] Sincronizacion omitida: no hay conexion con origin.
[2026-11-13 00:41:32] [INFO ] La rama feature/task-001-enrutado-multi-dominio no existe. Creandola desde develop...
[2026-11-13 00:41:32] [OK   ] Rama feature/task-001-enrutado-multi-dominio creada desde develop
[2026-11-13 00:41:32] [OK   ] Rama activa final: feature/task-001-enrutado-multi-dominio

====================================================
  [OK]  OPERACION : create-feature (feature/task-001-enrutado-multi-dominio)
       RESULTADO : COMPLETADO
       DURACION  : 1s
       DETALLE   : rama feature/task-001-enrutado-multi-dominio creada desde develop
====================================================

[2026-11-13 00:41:34] [WARN ] No hay conexion con origin. Se intentara update en modo local.
[2026-11-13 00:41:34] [OK   ] Switched to branch develop
[2026-11-13 00:41:34] [WARN ] Sincronizacion omitida para develop por falta de conexion remota.
[2026-11-13 00:41:34] [OK   ] Switched to branch feature/task-001-enrutado-multi-dominio
[2026-11-13 00:41:34] [OK   ] Update completado: develop -> feature/task-001-enrutado-multi-dominio

====================================================
  [OK]  OPERACION : update-feature (feature/task-001-enrutado-multi-dominio desde develop)
       RESULTADO : COMPLETADO
       DURACION  : 1s
       DETALLE   : develop integrado en feature/task-001-enrutado-multi-dominio
====================================================

✔ main: "taskctl review" con un diff de 2 dominios imprime una linea de peticion por revisor (hallazgo IMPORTANTE-2 de revision, TASK-018) (9246.2029ms)
✔ main: taskctl plan con 1 rol anuncia la peticion de redaccion y que no hay unificador (3275.0943ms)
✔ main: taskctl plan sin complejidad declarada no imprime "null" en ningun sitio (2190.2577ms)
ℹ tests 908
ℹ suites 0
ℹ pass 908
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 50010.1551
[verificar-impacto] node --test termino con 0 en 50.1 s.
````
