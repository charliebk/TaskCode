# Peticion de revision — TASK-091 (ronda 1)

- Tarea: TASK-091 — Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar
- Rama revisada: feature/task-091-verificacion-selectiva-por-impacto-en-la
- Rama base: develop
- Commit revisado (HEAD): 859499e9ca48bd79e9f23dde616ff18f910b2748
- Fecha: 2026-11-09
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-091 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-091/tarea.md
- tareas/03-en-revision/TASK-091/planificacion/
- .claude-plugin/marketplace.json
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/package.json
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts

## Commits a revisar (git log develop..HEAD)

````
859499e docs(TASK-091): autorrevision
cc5adfa feat(TASK-091): verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar
d65518d chore(TASK-091): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.claude-plugin/marketplace.json b/.claude-plugin/marketplace.json
index 5544382..cf8e191 100644
--- a/.claude-plugin/marketplace.json
+++ b/.claude-plugin/marketplace.json
@@ -5,14 +5,14 @@
     "url": "https://github.com/charliebk"
   },
   "description": "Marketplace de TaskCode: metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
-  "version": "0.12.0",
+  "version": "0.13.0",
   "plugins": [
     {
       "name": "taskcode-plugin",
       "displayName": "TaskCode",
       "source": "./taskcode-marketplace/plugins/taskcode-plugin",
       "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista. Expone el CLI taskctl.",
-      "version": "0.12.0",
+      "version": "0.13.0",
       "author": {
         "name": "charlie.bk"
       },
diff --git a/CHANGELOG.md b/CHANGELOG.md
index d254c7e..3ef8582 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -1,5 +1,34 @@
 # Changelog
 
+## 0.13.0 — sin publicar
+
+Verificacion selectiva por impacto (TASK-091). Clave nueva opcional
+`comando_verificacion_selectiva` (con `timeout_verificacion_selectiva`, 600 s
+por defecto): una verificacion rapida que corre solo lo afectado por los
+cambios y recibe la rama base de la tarea en la variable `RAMA_BASE`. La usan el
+hook `Stop` (en vez de la completa) y `taskctl review`, que la corre antes de
+escribir nada: en rojo, o si deja el arbol sucio, aborta sin abrir ronda y la
+tarea sigue en curso; en verde, la peticion lleva la seccion «Verificacion de
+esta ronda» con el tipo, el comando, el resultado y su salida, y omite la de
+cobertura (el informe podria ser parcial). `comando_verificacion` sigue siendo
+la puerta de `finish` y del guardian de merges: la selectiva sin la completa
+aborta al leer la config, y su resultado se guarda aparte
+(`.git/freno-verificacion-selectiva.json`, con la base y su commit en la
+huella), asi que un verde de la selectiva nunca abre un merge aunque los dos
+comandos tengan el mismo texto. `taskctl doctor` gana la comprobacion
+`verificacion-selectiva`, que avisa si hay completa sin selectiva. Guia para
+los proyectos en la skill `task-workflow` (`verificacion-selectiva.md`): como
+escribir el clasificador, que incluya el arbol de trabajo y que cambios obligan
+a correr todo.
+
+Cambio de comportamiento con la clave: el `Stop` deja de escribir el memo de la
+completa, asi que un `git merge` manual ya no se apoya en el verde de un fin de
+turno; cierra con `taskctl finish`, que corre la completa. Sin la clave, nada
+cambia.
+
+Actualizar como en 0.9.0; despues, en cada proyecto con verificaciones largas,
+escribir el clasificador y declarar la clave (`taskctl doctor` lo recuerda).
+
 ## 0.12.0 — 2026-11-07
 
 Version del plugin en cada tarea (TASK-084). Cada fila de `## Transiciones`
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
index 65ee0b5..990e37d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
@@ -1,7 +1,7 @@
 {
   "name": "taskcode-plugin",
   "displayName": "TaskCode",
-  "version": "0.12.0",
+  "version": "0.13.0",
   "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
   "author": {
     "name": "charlie.bk"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 5219e0d..45edcf9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -321,11 +321,11 @@ ejecución aplicado:
 
 ```
 $ node bin/taskctl --help
-taskctl 0.12.0 — TaskCode
+taskctl 0.13.0 — TaskCode
 [...]
 
 $ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
-taskctl 0.12.0 — TaskCode
+taskctl 0.13.0 — TaskCode
 [...]                            # salida idéntica
 
 $ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
@@ -649,6 +649,9 @@ algún error (los avisos no cuentan). Comprueba:
   `GIT_OPTIONAL_LOCKS=0`, así que no toma `index.lock`; un fallo por bloqueo es aviso.
 - **Config**: `.taskcode/config.yml` con el mismo validador que el resto de comandos
   (un valor inválido es error con su mensaje; una clave desconocida, aviso).
+- **Verificación selectiva** (`verificacion-selectiva`): con `comando_verificacion`
+  y sin `comando_verificacion_selectiva`, `aviso` con el arreglo en la misma
+  línea; con las dos, `ok`. Sin completa no dice nada.
 - **Verificación**: si la config declara `comando_verificacion` (ver abajo), `ok`
   con el comando y su timeout. Sin él, depende de si el proyecto tiene tests en
   su raíz:
@@ -710,6 +713,40 @@ timeout_verificacion: 900          # opcional, en segundos (por defecto 600)
 - La ejecutan el **freno de fin de turno** (hook `Stop`), la **puerta de
   `finish`** y la consulta el **guardián de merges** (hook `PreToolUse`), abajo.
 
+#### Verificación selectiva por impacto: `comando_verificacion_selectiva`
+
+Cuando la completa tarda mucho, el proyecto puede declarar además una
+verificación **selectiva**, que corre solo lo afectado por los cambios. La usan
+el freno de fin de turno y las rondas de `taskctl review`; la completa sigue
+siendo la puerta de `finish` y del guardián de merges.
+
+```yaml
+comando_verificacion: "npm test"                                    # la completa
+comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
+timeout_verificacion_selectiva: 600                                 # opcional (por defecto 600)
+```
+
+- Recibe la rama base de la tarea en la variable de entorno `RAMA_BASE` (la de
+  integración, o la principal en un hotfix); no se añade nada al comando. El
+  mapa de capas es del proyecto: el script decide qué correr.
+- Exige `comando_verificacion`: la selectiva sin la completa aborta, porque
+  dejaría `finish` sin puerta. El timeout sin su comando también aborta.
+- **Hook `Stop`**: con la clave corre la selectiva en vez de la completa, con su
+  propio memo (`.git/freno-verificacion-selectiva.json`, con la base y su commit
+  en la huella). El guardián solo lee el memo de la completa: un verde de la
+  selectiva nunca deja pasar un merge, aunque los dos comandos sean iguales.
+- **`taskctl review`**: la corre antes de escribir nada. En rojo, o si deja el
+  árbol sucio, aborta: no abre ronda y la tarea sigue en curso. En verde, la
+  petición lleva la sección «Verificación de esta ronda» (tipo, comando,
+  resultado y final de la salida) y omite la de cobertura, porque el informe
+  podría ser parcial.
+- **`taskctl finish`**: ejecuta la completa como siempre; en rojo, el mensaje
+  recuerda que se exige aunque las rondas usaran la selectiva.
+- **Sin la clave**, todo funciona como antes: el `Stop` corre la completa y
+  `review` no verifica.
+- Cómo escribir el clasificador y qué cambios obligan a correr todo: guía
+  instalada con el plugin, `skills/task-workflow/verificacion-selectiva.md`.
+
 #### Freno de fin de turno (hook `Stop`)
 
 El plugin declara en `hooks/hooks.json` un hook `Stop` que Claude Code ejecuta
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package.json b/taskcode-marketplace/plugins/taskcode-plugin/package.json
index ad79e4c..711e5cf 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package.json
@@ -1,6 +1,6 @@
 {
   "name": "taskcode-plugin",
-  "version": "0.12.0",
+  "version": "0.13.0",
   "description": "TaskCode: metodologia de tareas/sprints + Git-Flow + revision por pares de agentes, como plugin de Claude Code.",
   "private": true,
   "engines": {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 1812fcf..6c8effe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -193,12 +193,13 @@ invalido de una clave conocida aborta todos los comandos, y una clave
 desconocida avisa y se ignora. La sincronizacion (y sus trampas: no usar un
 hook de pre-commit, codigo de salida 3) esta en [sincronizacion.md](sincronizacion.md).
 
-**Freno de fin de turno.** Con `comando_verificacion` declarado y una tarea en
-curso en la rama actual, el hook `Stop` del plugin ejecuta ese comando al
-terminar cada turno y, si no sale en verde, devuelve el turno con un informe
-(comando, codigo, duracion y final de la salida). Arregla la causa; no borres,
+**Freno de fin de turno.** Con `comando_verificacion` y una tarea en curso en
+la rama actual, el hook `Stop` lo ejecuta al terminar cada turno y, si no sale
+en verde, devuelve el turno con un informe. Arregla la causa; no borres,
 saltes ni debilites tests para pasarlo. Si el rojo no es de tu cambio, dilo
-explicitamente al terminar: el freno solo bloquea una vez por turno.
+al terminar: el freno solo bloquea una vez por turno. Con
+`comando_verificacion_selectiva`, el `Stop` y `review` corren esa, por
+impacto: [verificacion-selectiva.md](verificacion-selectiva.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
 `taskctl finish` (lanzado desde la rama de la tarea) ejecuta la verificacion
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
new file mode 100644
index 0000000..e839955
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -0,0 +1,86 @@
+# Verificacion selectiva por impacto
+
+Cuando la verificacion completa del proyecto tarda mucho (decenas de minutos),
+repetirla en cada fin de turno y en cada ronda de revision no compensa si la
+tarea no ha tocado esa parte. El proyecto puede declarar dos verificaciones:
+
+| Clave | Que corre | Quien la usa |
+|---|---|---|
+| `comando_verificacion` | **todo**, siempre | `finish` y el guardian de merges: la puerta de integracion |
+| `comando_verificacion_selectiva` | solo lo afectado por los cambios | el hook `Stop` (fin de turno) y `taskctl review` |
+
+La selectiva solo acelera las rondas. **Antes de integrar se exige siempre la
+completa** en verde sobre el commit que entra, aunque las rondas pasaran con la
+selectiva. Por eso la selectiva sin la completa es un error de configuracion.
+
+## Declarar las dos claves
+
+```yaml
+# .taskcode/config.yml
+comando_verificacion: "npm test"                                  # la completa
+comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
+timeout_verificacion_selectiva: 600                               # opcional, segundos
+```
+
+Sin `comando_verificacion_selectiva`, todo funciona como siempre: el `Stop`
+corre la completa y `review` no verifica nada.
+
+## Lo que recibe el comando
+
+- Se ejecuta en la raiz del repo, con el shell del sistema, tal cual.
+- La **rama base** de la tarea llega en la variable de entorno `RAMA_BASE`
+  (la de integracion, o la principal en un hotfix). No se anade nada al
+  comando.
+- Verde es salir con codigo 0. Cualquier otro codigo, o pasarse del timeout,
+  es rojo.
+
+## Como escribir el clasificador
+
+El mapa de capas es del proyecto: que carpetas son la capa de datos, cuales el
+frontend, que tests cubren cada una. El script hace tres cosas:
+
+1. **Listar lo cambiado respecto a la base, incluido el arbol de trabajo.**
+   `git diff --name-only $RAMA_BASE...HEAD` no ve lo que aun no se ha
+   commiteado, y el fin de turno corre con el arbol sucio. Suma
+   `git diff --name-only HEAD` y `git ls-files --others --exclude-standard`.
+2. **Traducir cada fichero a lo que hay que correr**, con una tabla propia
+   (por ejemplo `src/datos/**` -> tests de datos; `web/**` -> tests del
+   frontend).
+3. **Correr solo eso**, y salir con su codigo.
+
+## Que cambios fuerzan la completa (corre todo)
+
+El clasificador falla cerrado: ante la duda, corre todo. Como minimo:
+
+- no se puede calcular el diff (`RAMA_BASE` vacia, la base no existe en local,
+  clon superficial): corre todo, nunca salgas con 0 sin haber corrido nada;
+- un fichero que no cae en ninguna capa de la tabla;
+- dependencias y build: lockfiles, `package.json`, `Cargo.toml`, `pom.xml`,
+  ficheros de proyecto, configuracion de compilacion o de tests;
+- codigo compartido por varias capas, migraciones y esquemas;
+- el propio clasificador o su tabla.
+
+## Lo que no puede hacer
+
+- **La completa no se convierte en el clasificador.** `comando_verificacion`
+  no depende de argumentos ni de `RAMA_BASE`: corre todo, siempre. Si
+  reescribes tu verificador para que decida por impacto, que sea un comando
+  aparte.
+- **No escribir ficheros en el arbol** (informes, artefactos): ignoralos en
+  `.gitignore`. `review` aborta si la verificacion deja el arbol sucio.
+- **No regenerar el informe de cobertura** que mide la completa: en las
+  rondas con selectiva, la peticion de revision no muestra cobertura porque
+  el informe podria ser parcial.
+
+## Que pasa en cada sitio
+
+- **Fin de turno (`Stop`)**: con tarea en curso en la rama, corre la
+  selectiva; en rojo devuelve el turno con su salida. Guarda el resultado
+  aparte del de la completa: un verde de la selectiva nunca abre un merge.
+- **`taskctl review`**: corre la selectiva antes de escribir nada. En rojo
+  aborta: no abre ronda y la tarea sigue en curso. En verde, la peticion de
+  revision lleva una seccion con el tipo (selectiva), el comando, el
+  resultado y su salida.
+- **`taskctl finish`**: corre la completa; en rojo no integra y dice como
+  correrla.
+- **`taskctl doctor`**: avisa si hay completa y falta la selectiva.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 1b5d3e5..44771ff 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -436,6 +436,39 @@ export function comprobarVerificacion(
   return ok('verificacion', `comando_verificacion: "${una(cfg.comando_verificacion)}" (timeout ${cfg.timeout_verificacion} s)`);
 }
 
+/**
+ * TASK-091: la verificacion selectiva por impacto. Solo dice algo cuando hay
+ * completa (sin ella la comprobacion `verificacion` ya cuenta lo que falta,
+ * y la config no admite selectiva sin completa):
+ * - Completa sin selectiva: `aviso`, con el arreglo en la misma linea. Cada
+ *   fin de turno y cada ronda corren entonces la suite entera.
+ * - Las dos: `ok` con el comando y su timeout.
+ * Es una comprobacion aparte para que `verificacion` no cambie de nivel.
+ */
+export function comprobarVerificacionSelectiva(cfg: TaskcodeConfig | null): Comprobacion[] {
+  if (cfg === null || cfg.comando_verificacion === null) return [];
+  if (cfg.comando_verificacion_selectiva === null) {
+    const arreglo =
+      'declara en .taskcode/config.yml comando_verificacion_selectiva: "<script que corre solo lo afectado ' +
+      'respecto a $RAMA_BASE>" (guia: skill task-workflow, verificacion-selectiva.md)';
+    return [
+      aviso(
+        'verificacion-selectiva',
+        'sin comando_verificacion_selectiva: cada fin de turno corre la verificacion completa; para ' +
+          `acelerarlo, ${arreglo}`,
+        arreglo.charAt(0).toUpperCase() + arreglo.slice(1)
+      ),
+    ];
+  }
+  return [
+    ok(
+      'verificacion-selectiva',
+      `comando_verificacion_selectiva: "${una(cfg.comando_verificacion_selectiva)}" ` +
+        `(timeout ${cfg.timeout_verificacion_selectiva} s); la completa sigue siendo la puerta de finish`
+    ),
+  ];
+}
+
 // ---------------------------------------------------------------------
 // Tareas
 // ---------------------------------------------------------------------
@@ -697,6 +730,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
 
   cs.push(...csConfig);
   cs.push(...envolver('verificacion', () => comprobarVerificacion(cfg, () => detectarComandosTests(cwd))));
+  cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
   cs.push(
     ...envolver('plataforma', () =>
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index d80f747..cc9e7f9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -13,6 +13,10 @@
  * y el rastro sobrevive aunque el proceso muera despues del script. Escribirla
  * sin commitear ensuciaria el workspace y el script de Git-Flow abortaria.
  *
+ * TASK-091: la verificacion selectiva no cuenta aqui. Aunque las rondas de
+ * revision corrieran la selectiva, `finish` ejecuta la COMPLETA sobre el
+ * commit que va a integrar, y el guardian solo lee el memo de la completa.
+ *
  * Tras un verde se guarda el memo con la huella del arbol (limpio, igual que
  * `huellaDeCommit` del commit de la rama): es lo que consulta el guardian de
  * merges (hooks/guardia-merge) para no bloquear un merge ya verificado.
@@ -121,6 +125,12 @@ export async function puertaVerificacion(
     throw new FinishCommandError(
       `[ERROR] ${o.id}: no se mergea con la verificacion en rojo. No se ha tocado nada.\n` +
         `${formatearVerificacionRoja(r)}\n` +
+        // TASK-091: con selectiva, que quede claro por que se corre la completa aunque las rondas pasaran.
+        (config.comando_verificacion_selectiva === null
+          ? ''
+          : 'Es la verificacion completa (comando_verificacion): se exige en verde sobre el commit que se ' +
+            'integra aunque las rondas usaran la selectiva. Correla a mano con ese comando en la rama de la ' +
+            'tarea hasta que salga en verde, commitea los arreglos y reintenta.\n') +
         `Si la persona decide cerrar igualmente, taskctl finish ${o.id} ${FLAG_SIN_VERIFICACION} lo salta y ` +
         'lo deja anotado en la tarea.'
     );
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index 9278cd6..aeb29f7 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -32,6 +32,8 @@ import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
 import { STATE_FOLDER, type Task } from '../core/task.js';
 import { raizDelRepo, resolverConfig } from '../core/config.js';
 import { datosCoberturaRevision, seccionCoberturaRevision } from '../fs/cobertura.js';
+import { formatearVerificacionRoja, seccionVerificacionRevision } from '../core/informe-verificacion.js';
+import { verificarConMemo, type VerificacionConMemo } from '../fs/verificacion.js';
 import { registrarTransicion } from '../core/transiciones.js';
 import { instanteDelVolcado, volcarCosteAutomatico } from '../fs/coste-automatico.js';
 import { readTareaFile, moveTareaFile, isEexist } from '../fs/task-store.js';
@@ -257,7 +259,8 @@ export function peticionTemplate(
     `${diffBlock}\n` +
     `${fence}\n` +
     seccionExcluidos(desde, extras) +
-    (extras.seccionCobertura ?? '')
+    (extras.seccionCobertura ?? '') +
+    (extras.seccionVerificacion ?? '')
   );
 }
 
@@ -322,6 +325,8 @@ export interface ExtrasPeticion {
   seccionPrevia?: string;
   /** TASK-074: lineas cambiadas sin cubrir (solo si el proyecto declara `informe_cobertura`). */
   seccionCobertura?: string;
+  /** TASK-091: la verificacion selectiva de la ronda (solo si el proyecto declara `comando_verificacion_selectiva`). */
+  seccionVerificacion?: string;
   /** TASK-081: lo que el revisor puede leer sin justificarlo (ver core/contexto-revision.ts). */
   contextoPermitido?: readonly string[];
   /** TASK-081: modelo mas barato sugerido para esta ronda de verificacion. */
@@ -635,12 +640,18 @@ export async function runReviewCommand(
   }
   const commits = logOneline(desde, 'HEAD', deps.repoCwd);
   const diff = paraRevision.diff;
+  // TASK-091: con `comando_verificacion_selectiva`, la ronda la corre (con la
+  // base en RAMA_BASE) ANTES de escribir nada: un rojo aborta con la tarea en
+  // curso y sin ronda a medias (decision de Carlos). Sin la clave, nada.
+  const selectiva = verificacionSelectivaDeRonda(id, configRama, baseBranch, deps);
   // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
   // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
   // nadie arreglo sigue ahi). Una vez por ronda y antes de escribir nada;
-  // nunca lanza: un informe roto es un aviso en la peticion.
+  // nunca lanza: un informe roto es un aviso en la peticion. TASK-091: si
+  // corrio la selectiva no se muestra: su informe puede ser parcial
+  // (decision de Carlos; la completa la mide en el cierre).
   const datosCobertura =
-    configRama.informe_cobertura === null
+    configRama.informe_cobertura === null || selectiva !== null
       ? null
       : datosCoberturaRevision(
           raizDelRepo(deps.repoCwd),
@@ -789,6 +800,16 @@ export async function runReviewCommand(
                     plan.fragmentado ? (coberturaPorRevisor.get(escritura.revisor) ?? new Set<string>()) : undefined
                   ),
                 }),
+            ...(selectiva === null
+              ? {}
+              : {
+                  seccionVerificacion: seccionVerificacionRevision({
+                    resultado: selectiva.resultado,
+                    base: baseBranch,
+                    deMemo: selectiva.deMemo,
+                    conCobertura: configRama.informe_cobertura !== null,
+                  }),
+                }),
           }
         )
       );
@@ -859,3 +880,45 @@ export async function runReviewCommand(
     informes,
   };
 }
+
+/**
+ * TASK-091: la verificacion selectiva de la ronda, o null si el proyecto no
+ * la declara. Reutiliza el resultado del hook Stop si la huella coincide.
+ * Lanza ReviewCommandError (sin haber escrito nada) si no sale en verde o si
+ * deja el arbol sucio: el autocommit de la ronda se llevaria esos ficheros o
+ * el siguiente comando abortaria por workspace sucio.
+ */
+function verificacionSelectivaDeRonda(
+  id: string,
+  config: ReturnType<typeof resolverConfig>,
+  base: string,
+  deps: ReviewCommandDeps
+): VerificacionConMemo | null {
+  const comando = config.comando_verificacion_selectiva;
+  if (comando === null) return null;
+  const raiz = raizDelRepo(deps.repoCwd);
+  const v = verificarConMemo(
+    raiz,
+    { tipo: 'selectiva', comando, timeoutS: config.timeout_verificacion_selectiva, base },
+    deps.env === undefined ? {} : { env: deps.env }
+  );
+  if (v.resultado.estado !== 'verde') {
+    throw new ReviewCommandError(
+      `[ERROR] ${id}: la verificacion selectiva (por impacto respecto a "${base}", en RAMA_BASE) no esta en ` +
+        'verde, asi que no se abre ronda de revision: la tarea sigue en curso y no se ha escrito nada.\n' +
+        `${formatearVerificacionRoja(v.resultado)}\n` +
+        (v.deMemo
+          ? 'Es el resultado guardado: el arbol no ha cambiado desde la ultima ejecucion. Cambia algo o ejecuta el comando a mano.\n'
+          : '') +
+        `Para reproducirla: ejecuta "${comando}" con la variable de entorno RAMA_BASE=${base}.`
+    );
+  }
+  if (v.cambioElArbol) {
+    throw new ReviewCommandError(
+      `[ERROR] ${id}: la verificacion selectiva salio en verde, pero ha dejado cambios en el arbol de trabajo ` +
+        `("${comando}" escribe ficheros versionados o no ignorados: mira git status). Ignoralos en .gitignore, ` +
+        'o descartalos, y reintenta. No se ha abierto ronda.'
+    );
+  }
+  return v;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index c269164..9ae26d1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -19,6 +19,8 @@
  * | url_base_remoto              | null              | commands/finish-opciones.ts (--merge-request) |
  * | comando_verificacion         | null (sin freno)  | commands/doctor.ts (y los frenos, TASK-071/072) |
  * | timeout_verificacion         | 600 (segundos)    | los frenos (TASK-071/072)  |
+ * | comando_verificacion_selectiva | null (sin selectiva) | hooks/freno-stop.ts, commands/review.ts (TASK-091) |
+ * | timeout_verificacion_selectiva | 600 (segundos)  | hooks/freno-stop.ts, commands/review.ts (TASK-091) |
  * | comando_heldout              | null (sin held-out) | commands/finish-heldout.ts (TASK-073) |
  * | informe_cobertura            | null (sin freno)  | commands/review.ts, finish-cobertura.ts (TASK-074) |
  * | umbral_cobertura             | null (solo informa) | commands/finish-cobertura.ts (TASK-074) |
@@ -29,6 +31,13 @@
  * patron que la pareja de sincronizacion: el timeout solo con el comando. Sin
  * la clave no hay freno y todo se comporta como antes.
  *
+ * `comando_verificacion_selectiva` y su timeout las anadio TASK-091: una
+ * verificacion rapida, por impacto, que deciden el hook Stop y las rondas de
+ * `review`; recibe la rama base en la variable RAMA_BASE. La completa
+ * (`comando_verificacion`) sigue siendo la puerta de `finish` y del guardian
+ * de merges, asi que la selectiva sin la completa ABORTA: dejaria el proyecto
+ * sin puerta y sin que nadie lo viera.
+ *
  * `excluir_de_revision` la anadio TASK-034: la peticion de revision
  * embebia el diff entero, y el JS compilado, los lockfiles y la propia
  * carpeta de tareas eran el 27 % de sus bytes. Sus patrones siguen la
@@ -169,6 +178,15 @@ export interface TaskcodeConfig {
   comando_verificacion: string | null;
   /** TASK-070: segundos que se le dejan a la verificacion antes de cortarla. */
   timeout_verificacion: number;
+  /**
+   * TASK-091: comando de la verificacion selectiva (por impacto), que reciben
+   * el hook Stop y `review` con la rama base en la variable RAMA_BASE. null =
+   * sin selectiva: el Stop corre la completa y `review` no verifica (lo de
+   * siempre). Exige `comando_verificacion`, que sigue siendo la puerta.
+   */
+  comando_verificacion_selectiva: string | null;
+  /** TASK-091: segundos que se le dejan a la selectiva antes de cortarla. */
+  timeout_verificacion_selectiva: number;
   /**
    * TASK-073: comando que ejecuta los tests held-out de la tarea (carpeta
    * `aceptacion/`), con su ruta absoluta en la variable HELDOUT_DIR. null =
@@ -224,6 +242,8 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   url_base_remoto: null,
   comando_verificacion: null,
   timeout_verificacion: 600,
+  comando_verificacion_selectiva: null,
+  timeout_verificacion_selectiva: 600,
   comando_heldout: null,
   informe_cobertura: null,
   umbral_cobertura: null,
@@ -245,6 +265,8 @@ export const CLAVES_CONFIG = [
   'url_base_remoto',
   'comando_verificacion',
   'timeout_verificacion',
+  'comando_verificacion_selectiva',
+  'timeout_verificacion_selectiva',
   'comando_heldout',
   'informe_cobertura',
   'umbral_cobertura',
@@ -511,6 +533,17 @@ export function parsearConfigConAvisos(
       case 'timeout_verificacion':
         config.timeout_verificacion = validarEnteroPositivo(donde, par.clave, par.valor);
         break;
+      case 'comando_verificacion_selectiva':
+        config.comando_verificacion_selectiva = validarComando(
+          donde,
+          par.clave,
+          par.valor,
+          'comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"'
+        );
+        break;
+      case 'timeout_verificacion_selectiva':
+        config.timeout_verificacion_selectiva = validarEnteroPositivo(donde, par.clave, par.valor);
+        break;
       case 'comando_heldout':
         config.comando_heldout = validarComando(donde, par.clave, par.valor, 'comando_heldout: "node --test $HELDOUT_DIR"');
         break;
@@ -633,6 +666,23 @@ function validarVerificacionCompleta(ruta: string, vistas: ReadonlySet<string>):
         '        Borrala, o declara tambien el comando (por ejemplo comando_verificacion: "npm test").'
     );
   }
+  // TASK-091: la selectiva es para las rondas; la puerta de integracion es la
+  // completa. Sin ella, finish y el guardian de merges no verificarian nada.
+  if (vistas.has('comando_verificacion_selectiva') && !vistas.has('comando_verificacion')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "comando_verificacion_selectiva" necesita tambien "comando_verificacion".
+` +
+        '        La selectiva solo acelera las rondas; antes de integrar se exige la completa. Declara la ' +
+        'completa (por ejemplo comando_verificacion: "npm test"), o borra la selectiva.'
+    );
+  }
+  if (vistas.has('timeout_verificacion_selectiva') && !vistas.has('comando_verificacion_selectiva')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "timeout_verificacion_selectiva" sin "comando_verificacion_selectiva" no hace nada.
+` +
+        '        Borrala, o declara tambien el comando de la verificacion selectiva.'
+    );
+  }
 }
 
 /**
@@ -728,7 +778,7 @@ function validarPatronesExclusion(
 /** El comando, recortado. No se interpreta: lo ejecuta el shell del sistema tal cual. */
 function validarComando(
   donde: string,
-  clave: 'comando_sincronizacion' | 'comando_verificacion' | 'comando_heldout',
+  clave: 'comando_sincronizacion' | 'comando_verificacion' | 'comando_verificacion_selectiva' | 'comando_heldout',
   valor: unknown,
   ejemplo: string
 ): string {
@@ -858,7 +908,7 @@ function validarTextoNoVacio(donde: string, clave: string, valor: unknown): stri
 /** Entero >= 1. Un limite de 0 no es "sin limite": es "no se puede trabajar". */
 function validarEnteroPositivo(
   donde: string,
-  clave: 'limite_wip' | 'timeout_sincronizacion' | 'timeout_verificacion',
+  clave: 'limite_wip' | 'timeout_sincronizacion' | 'timeout_verificacion' | 'timeout_verificacion_selectiva',
   valor: unknown
 ): number {
   if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
index 1226980..fbcb321 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-verificacion.ts
@@ -9,6 +9,7 @@
  * ANSI (colores de los test runners), sin CRLF, sin credenciales en URLs, y
  * cortada sin partir caracteres UTF-8.
  */
+import { fenceFor } from './markdown.js';
 import { ocultarCredenciales } from './plataforma-remota.js';
 
 export type EstadoVerificacion = 'verde' | 'roja' | 'cortada' | 'no-lanzable';
@@ -115,3 +116,55 @@ export function formatearVerificacionRoja(
   );
   return lineas.join('\n');
 }
+
+export interface VerificacionDeRonda {
+  resultado: ResultadoVerificacion;
+  /** Rama base que recibio en RAMA_BASE. */
+  base: string;
+  /** true si es el resultado guardado de una ejecucion anterior con la misma huella. */
+  deMemo: boolean;
+  /** true si el proyecto declara un informe de cobertura (que esta ronda no muestra). */
+  conCobertura: boolean;
+}
+
+/**
+ * TASK-091: la seccion de la peticion de revision que dice que verificacion
+ * se corrio en la ronda (hoy solo la selectiva: sin ella `review` no verifica),
+ * con su resultado y su salida. Va al final, despues de la cabecera con el
+ * commit revisado, y la salida en una valla que no colisiona con ella.
+ */
+export function seccionVerificacionRevision(v: VerificacionDeRonda): string {
+  const r = v.resultado;
+  const { texto, recortada } = recortarCola(r.cola);
+  const truncada = recortada || r.bytesTotales > Buffer.byteLength(r.cola, 'utf8');
+  const lineas = [
+    '## Verificacion de esta ronda',
+    '',
+    `- Tipo: selectiva (por impacto respecto a \`${v.base}\`, que recibe en la variable RAMA_BASE). ` +
+      'No sustituye a la completa: el cierre la exige sobre el commit que se integra.',
+    `- Comando: \`${r.comando}\``,
+    `- Resultado: ${describirResultado(r)}${v.deMemo ? ' (resultado guardado: el arbol no ha cambiado desde la ultima ejecucion)' : ''}`,
+    `- Duracion: ${segundos(r.duracionMs)}`,
+  ];
+  if (v.conCobertura) {
+    lineas.push(
+      '- Cobertura: no se muestra en esta ronda. La selectiva solo corre parte de los tests y el informe ' +
+        'puede ser parcial; la completa la mide en el cierre.'
+    );
+  }
+  lineas.push('');
+  if (texto === '') {
+    lineas.push('Salida: (vacia)', '');
+  } else {
+    const fence = fenceFor(texto);
+    lineas.push(
+      truncada ? `Final de la salida (truncada: ${String(r.bytesTotales)} bytes en total):` : 'Salida:',
+      '',
+      fence,
+      texto,
+      fence,
+      ''
+    );
+  }
+  return `\n${lineas.join('\n')}`;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
index c28266e..2e64915 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/version.ts
@@ -12,7 +12,7 @@
  * una version se cierran con su numero y `taskctl metricas --por-version`
  * no las mezcla con la anterior.
  */
-export const VERSION_TASKCTL = '0.12.0';
+export const VERSION_TASKCTL = '0.13.0';
 
 /** Nombre del plugin en los marketplaces de Claude Code (`<nombre>@<marketplace>`). */
 export const NOMBRE_PLUGIN = 'taskcode-plugin';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index 2e5a560..7fe0a1b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -15,6 +15,15 @@
  * El memo vive bajo `.git/` (`git rev-parse --git-path`), nunca en el
  * workspace: alli ensuciaria el arbol y cambiaria su propia huella. Tampoco
  * bajo la carpeta del plugin, que cambia al actualizarlo.
+ *
+ * DOS TIPOS, DOS MEMOS (TASK-091): la verificacion completa
+ * (`comando_verificacion`) y la selectiva por impacto
+ * (`comando_verificacion_selectiva`) guardan su resultado en ficheros
+ * distintos. El guardian de merges solo lee el de la completa, asi que un
+ * verde de la selectiva nunca abre la puerta, ni aunque los dos comandos
+ * tengan el mismo texto; y la selectiva del Stop tampoco pisa el verde de la
+ * completa que dejo `finish`. La huella de la selectiva lleva ademas la rama
+ * base y su commit: su resultado depende de lo cambiado respecto a ella.
  */
 import { createHash } from 'node:crypto';
 import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
@@ -25,9 +34,23 @@ import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 
 /** Bytes del final de la salida que se leen (el informe muestra menos: ver informe-verificacion). */
 const BYTES_COLA_LEIDOS = 16 * 1024;
-const FICHERO_MEMO = 'freno-verificacion.json';
+/** TASK-091: la completa es la puerta de integracion; la selectiva, la de las rondas. */
+export type TipoVerificacion = 'completa' | 'selectiva';
+
+const FICHEROS_MEMO: Readonly<Record<TipoVerificacion, string>> = Object.freeze({
+  completa: 'freno-verificacion.json',
+  selectiva: 'freno-verificacion-selectiva.json',
+});
 const VERSION_MEMO = 1;
 
+/**
+ * Variable de entorno con la que la verificacion selectiva recibe la rama
+ * base (TASK-091). Por entorno y no como argumento: el comando es entero del
+ * proyecto y no se le interpola nada (ver ejecucion-acotada). Nombre neutro:
+ * la leen proyectos ajenos.
+ */
+export const VARIABLE_RAMA_BASE = 'RAMA_BASE';
+
 export interface OpcionesVerificacion {
   /** Solo para tests: sustituye al timeout en segundos (en ms). */
   timeoutMs?: number;
@@ -86,7 +109,12 @@ function git(args: readonly string[], cwd: string): string | null {
  * trackeados). null si no se puede calcular (sin commits, git roto): sin
  * huella no hay memo, y se ejecuta siempre.
  */
-export function huellaDelArbol(raiz: string, comando: string, timeoutS: number): string | null {
+export function huellaDelArbol(
+  raiz: string,
+  comando: string,
+  timeoutS: number,
+  contexto?: string
+): string | null {
   const head = git(['rev-parse', 'HEAD'], raiz);
   if (head === null) return null;
   let foto: Map<string, string>;
@@ -97,6 +125,8 @@ export function huellaDelArbol(raiz: string, comando: string, timeoutS: number):
   }
   const h = createHash('sha1');
   h.update(`v${String(VERSION_MEMO)}\0${head}\0${comando}\0${String(timeoutS)}\0`);
+  // TASK-091: solo la selectiva trae contexto; la formula de la completa no cambia.
+  if (contexto !== undefined) h.update(`ctx\0${contexto}\0`);
   for (const ruta of [...foto.keys()].sort()) h.update(`${ruta}\0${foto.get(ruta) as string}\0`);
   return h.digest('hex');
 }
@@ -124,15 +154,19 @@ export interface MemoVerificacion {
   fecha: string;
 }
 
-function rutaMemo(raiz: string): string | null {
-  const p = git(['rev-parse', '--git-path', FICHERO_MEMO], raiz);
+function rutaMemo(raiz: string, tipo: TipoVerificacion): string | null {
+  const p = git(['rev-parse', '--git-path', FICHEROS_MEMO[tipo]], raiz);
   if (p === null || p === '') return null;
   return path.resolve(raiz, p);
 }
 
 /** El resultado guardado para esa huella, o null. Un memo ilegible es como no tenerlo. */
-export function leerMemo(raiz: string, huella: string): ResultadoVerificacion | null {
-  const ruta = rutaMemo(raiz);
+export function leerMemo(
+  raiz: string,
+  huella: string,
+  tipo: TipoVerificacion = 'completa'
+): ResultadoVerificacion | null {
+  const ruta = rutaMemo(raiz, tipo);
   if (ruta === null) return null;
   try {
     const m = JSON.parse(readFileSync(ruta, 'utf8')) as Partial<MemoVerificacion>;
@@ -146,8 +180,13 @@ export function leerMemo(raiz: string, huella: string): ResultadoVerificacion |
 }
 
 /** Guarda el resultado de la ultima verificacion. Un fallo al guardar no es un fallo de la verificacion. */
-export function guardarMemo(raiz: string, huella: string, resultado: ResultadoVerificacion): void {
-  const ruta = rutaMemo(raiz);
+export function guardarMemo(
+  raiz: string,
+  huella: string,
+  resultado: ResultadoVerificacion,
+  tipo: TipoVerificacion = 'completa'
+): void {
+  const ruta = rutaMemo(raiz, tipo);
   if (ruta === null) return;
   const memo: MemoVerificacion = { version: VERSION_MEMO, huella, resultado, fecha: new Date().toISOString() };
   try {
@@ -157,3 +196,64 @@ export function guardarMemo(raiz: string, huella: string, resultado: ResultadoVe
     /* sin memo: la proxima vez se ejecuta */
   }
 }
+
+// ---------------------------------------------------------------------
+// Ejecucion con memo (TASK-091): la usan el hook Stop y `review`
+// ---------------------------------------------------------------------
+
+export interface PeticionVerificacion {
+  tipo: TipoVerificacion;
+  comando: string;
+  timeoutS: number;
+  /** Rama base. Obligatoria en la selectiva (va en RAMA_BASE y en su huella); ignorada en la completa. */
+  base?: string;
+}
+
+export interface VerificacionConMemo {
+  resultado: ResultadoVerificacion;
+  /** true si no se ha ejecutado: es el resultado guardado para la misma huella. */
+  deMemo: boolean;
+  /** true si la propia verificacion cambio ficheros del arbol de trabajo. */
+  cambioElArbol: boolean;
+}
+
+/**
+ * El contexto de la huella de la selectiva: la base por su nombre y por su
+ * commit (si la base avanza, lo cambiado respecto a ella tambien). Una base
+ * que no resuelve entra vacia: el script del proyecto decidira que hacer.
+ */
+function contextoSelectiva(raiz: string, base: string): string {
+  const sha = git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${base}^{commit}`], raiz) ?? '';
+  return `selectiva\0${base}\0${sha}`;
+}
+
+/**
+ * Ejecuta la verificacion pedida, salvo que la ultima con la misma huella
+ * este guardada: entonces devuelve esa. Guarda el resultado en el memo de su
+ * tipo. No lanza por el comando (ejecutarVerificacion no lanza).
+ */
+export function verificarConMemo(
+  raiz: string,
+  p: PeticionVerificacion,
+  opciones: OpcionesVerificacion = {}
+): VerificacionConMemo {
+  if (p.tipo === 'selectiva' && (p.base === undefined || p.base === '')) {
+    throw new Error('la verificacion selectiva necesita la rama base');
+  }
+  const contexto = p.tipo === 'selectiva' ? contextoSelectiva(raiz, p.base as string) : undefined;
+  const huella = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
+  const guardado = huella === null ? null : leerMemo(raiz, huella, p.tipo);
+  if (guardado !== null) return { resultado: guardado, deMemo: true, cambioElArbol: false };
+
+  const env =
+    p.tipo === 'selectiva'
+      ? { ...(opciones.env ?? process.env), [VARIABLE_RAMA_BASE]: p.base as string }
+      : opciones.env;
+  const resultado = ejecutarVerificacion(raiz, p.comando, p.timeoutS, {
+    ...(opciones.timeoutMs === undefined ? {} : { timeoutMs: opciones.timeoutMs }),
+    ...(env === undefined ? {} : { env }),
+  });
+  const despues = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
+  if (despues !== null) guardarMemo(raiz, despues, resultado, p.tipo);
+  return { resultado, deMemo: false, cambioElArbol: huella !== null && despues !== null && huella !== despues };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index a5d2816..e80df4d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -19,6 +19,11 @@
  *   8. Memo: misma huella del arbol que la ultima verificacion -> su resultado.
  *   9. Ejecutar. Verde -> 0. Cualquier otra cosa -> 2 con el informe.
  *
+ * Que verificacion (TASK-091): con `comando_verificacion_selectiva`, la
+ * selectiva, con la base de la tarea (la de su tipo: un hotfix va contra la
+ * principal) en RAMA_BASE y su propio memo; sin ella, la completa, como
+ * siempre. La puerta de integracion sigue siendo la completa de `finish`.
+ *
  * Contrato con Claude Code (spike TASK-069 y documentacion oficial): exit 0
  * deja parar; exit 2 bloquea y el stderr le llega al agente; exit 1 NO
  * bloquea, asi que nunca se sale con 1 por accidente: decidirStop no lanza.
@@ -29,8 +34,10 @@ import path from 'node:path';
 import { spawnSync } from 'node:child_process';
 import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
 import { formatearVerificacionRoja, type ResultadoVerificacion } from '../core/informe-verificacion.js';
+import type { Task } from '../core/task.js';
+import { resolveBaseBranchForTipo } from '../fs/git.js';
 import { listTareasEnEstados } from '../fs/task-store.js';
-import { ejecutarVerificacion, guardarMemo, huellaDelArbol, leerMemo } from '../fs/verificacion.js';
+import { verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
 
 /**
  * `timeout` del hook Stop en hooks/hooks.json, en segundos. Claude Code cancela
@@ -104,6 +111,7 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
   let config: TaskcodeConfig | null = null;
   let errorConfig: string | null = null;
   let rama: string | null;
+  let tipo: Task['tipo'] | null = null;
   try {
     // 3 y 4: stat y lectura de una carpeta.
     raiz = raizDelRepo(entrada.cwd);
@@ -137,7 +145,9 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
     // 6: el unico git hasta aqui.
     rama = ramaActual(raiz);
     if (rama === null || !ramas.has(rama)) return sinLeer;
-    ids = tareas.filter((t) => t.task.rama === rama).map((t) => t.task.id);
+    const deEstaRama = tareas.filter((t) => t.task.rama === rama);
+    ids = deEstaRama.map((t) => t.task.id);
+    tipo = deEstaRama[0]?.task.tipo ?? null;
   } catch {
     // Algo inesperado ANTES de saber si el freno aplica (tareas ilegibles,
     // permisos): no se puede afirmar que haya una tarea en curso aqui.
@@ -156,35 +166,44 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
           'Corrige .taskcode/config.yml y vuelve a verificar antes de dar la tarea por terminada.',
       };
     }
-    const comando = config.comando_verificacion as string;
-    const { timeoutS, recortado } = timeoutEfectivoS(config.timeout_verificacion);
+    const selectiva = config.comando_verificacion_selectiva;
+    const clave = selectiva === null ? 'timeout_verificacion' : 'timeout_verificacion_selectiva';
+    const pedido = selectiva === null ? config.timeout_verificacion : config.timeout_verificacion_selectiva;
+    const { timeoutS, recortado } = timeoutEfectivoS(pedido);
     const avisos: string[] = [];
     if (recortado) {
       avisos.push(
-        `timeout_verificacion pide ${String(config.timeout_verificacion)} s, pero este freno tiene un tope de ` +
+        `${clave} pide ${String(pedido)} s, pero este freno tiene un tope de ` +
           `${String(timeoutS)} s: se ha usado el tope.`
       );
     }
+    const peticion: PeticionVerificacion =
+      selectiva === null
+        ? { tipo: 'completa', comando: config.comando_verificacion as string, timeoutS }
+        : {
+            tipo: 'selectiva',
+            comando: selectiva,
+            timeoutS,
+            base: tipo === null ? config.rama_base : resolveBaseBranchForTipo(tipo, raiz),
+          };
 
-    // 8
-    const huella = huellaDelArbol(raiz, comando, timeoutS);
-    const guardado = huella === null ? null : leerMemo(raiz, huella);
-    if (guardado !== null) {
-      if (guardado.estado === 'verde') return DEJAR_PARAR;
+    // 8 y 9
+    const deOpciones = deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs };
+    const { resultado: r, deMemo, cambioElArbol } = verificarConMemo(raiz, peticion, deOpciones);
+    if (r.estado === 'verde') return DEJAR_PARAR;
+    if (peticion.tipo === 'selectiva') {
+      avisos.push(
+        `Es la verificacion selectiva (por impacto respecto a ${peticion.base as string}); antes de integrar ` +
+          'se exige ademas la completa.'
+      );
+    }
+    if (deMemo) {
       avisos.push(
         'Es el resultado guardado de la ultima verificacion: el arbol no ha cambiado desde entonces y no ' +
           'se ha vuelto a ejecutar. Si crees que el fallo es intermitente, cambia algo o ejecuta el comando a mano.'
       );
-      return bloquear(tarea, guardado, avisos);
     }
-
-    // 9
-    const deOpciones = deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs };
-    const r = ejecutarVerificacion(raiz, comando, timeoutS, deOpciones);
-    const despues = huellaDelArbol(raiz, comando, timeoutS);
-    if (despues !== null) guardarMemo(raiz, despues, r);
-    if (r.estado === 'verde') return DEJAR_PARAR;
-    if (huella !== null && despues !== null && huella !== despues) {
+    if (cambioElArbol) {
       avisos.push(
         'La propia verificacion ha cambiado ficheros del arbol de trabajo (git status): revisalos antes del ' +
           'siguiente comando, que puede abortar por workspace sucio.'
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
new file mode 100644
index 0000000..833c903
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
@@ -0,0 +1,470 @@
+/**
+ * Verificacion selectiva por impacto (TASK-091). Repos Git temporales de
+ * verdad y los scripts de Git-Flow tal cual. Los dos comandos (completa y
+ * selectiva) son scripts de node que viven FUERA del repo (no ensucian el
+ * workspace) y leen su desenlace de un fichero junto a ellos; cuentan sus
+ * ejecuciones y la selectiva apunta la RAMA_BASE que recibio.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { CONFIG_DEFAULTS, CLAVES_CONFIG, parsearConfig } from '../../src/core/config.js';
+import { comprobarVerificacionSelectiva } from '../../src/commands/doctor.js';
+import { runFinishCommand, FinishCommandError } from '../../src/commands/finish.js';
+import { runReviewCommand, ReviewCommandError } from '../../src/commands/review.js';
+import { decidirStop } from '../../src/hooks/freno-stop.js';
+import { decidirPreToolUse } from '../../src/hooks/guardia-merge.js';
+import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
+import { verificarConMemo } from '../../src/fs/verificacion.js';
+import { resolverConfig } from '../../src/core/config.js';
+import {
+  SCRIPTS_DIR as SCRIPTS_FINISH,
+  sampleTask as tareaFinish,
+  commitAll as commitFinish,
+  withTempRepo as repoFinish,
+  setupTaskEnRevision,
+} from '../helpers/finish-fixtures.js';
+import {
+  SCRIPTS_DIR as SCRIPTS_REVIEW,
+  sampleTask as tareaReview,
+  git,
+  commitAll as commitReview,
+  withTempRepo as repoReview,
+  setupTaskEnCurso,
+} from '../helpers/review-fixtures.js';
+
+const RUTA = '/repo/.taskcode/config.yml';
+
+// ---------------------------------------------------------------------
+// Scripts de verificacion, fuera del repo
+// ---------------------------------------------------------------------
+
+const SCRIPT = `
+const fs = require('node:fs');
+const dir = __dirname;
+const nombre = process.argv[2];
+fs.appendFileSync(dir + '/cuenta-' + nombre, 'x');
+fs.writeFileSync(dir + '/base-' + nombre, process.env.RAMA_BASE === undefined ? '(sin RAMA_BASE)' : process.env.RAMA_BASE);
+const d = fs.readFileSync(dir + '/desenlace-' + nombre, 'utf8').trim();
+if (d === 'ok') { console.log(nombre + ': todo en verde'); process.exit(0); }
+if (d === 'ensucia') { fs.writeFileSync('artefacto.txt', 'x'); process.exit(0); }
+console.error(nombre + ': ERROR, 2 tests fallan'); process.exit(3);
+`;
+
+type Desenlace = 'ok' | 'ko' | 'ensucia';
+
+interface Verifs {
+  dir: string;
+  comando(nombre: 'completa' | 'selectiva'): string;
+  desenlace(nombre: 'completa' | 'selectiva', d: Desenlace): Promise<void>;
+  ejecuciones(nombre: 'completa' | 'selectiva'): number;
+  base(nombre: 'completa' | 'selectiva'): string | null;
+}
+
+async function conScripts<T>(fn: (v: Verifs) => Promise<T>): Promise<T> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'verif-selectiva-'));
+  await writeFile(path.join(dir, 'verif.cjs'), SCRIPT, 'utf8');
+  for (const n of ['completa', 'selectiva']) await writeFile(path.join(dir, `desenlace-${n}`), 'ok', 'utf8');
+  const leer = (f: string): string | null => (existsSync(path.join(dir, f)) ? readFileSync(path.join(dir, f), 'utf8') : null);
+  const v: Verifs = {
+    dir,
+    comando: (n) => `node ${path.join(dir, 'verif.cjs').replace(/\\/g, '/')} ${n}`,
+    desenlace: (n, d) => writeFile(path.join(dir, `desenlace-${n}`), d, 'utf8'),
+    ejecuciones: (n) => (leer(`cuenta-${n}`) ?? '').length,
+    base: (n) => leer(`base-${n}`),
+  };
+  try {
+    return await fn(v);
+  } finally {
+    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
+  }
+}
+
+async function escribirConfig(repoRoot: string, contenido: string): Promise<void> {
+  await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+  await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), contenido, 'utf8');
+}
+
+const dosClaves = (v: Verifs): string =>
+  `comando_verificacion: "${v.comando('completa')}"\ncomando_verificacion_selectiva: "${v.comando('selectiva')}"\n`;
+
+// ---------------------------------------------------------------------
+// Config (criterio 1)
+// ---------------------------------------------------------------------
+
+test('config (TASK-091): sin la clave, selectiva null y timeout 600; las dos claves son conocidas', () => {
+  assert.equal(CONFIG_DEFAULTS.comando_verificacion_selectiva, null);
+  assert.equal(CONFIG_DEFAULTS.timeout_verificacion_selectiva, 600);
+  assert.ok((CLAVES_CONFIG as readonly string[]).includes('comando_verificacion_selectiva'));
+  assert.ok((CLAVES_CONFIG as readonly string[]).includes('timeout_verificacion_selectiva'));
+  const c = parsearConfig('comando_verificacion: "npm test"\n', RUTA);
+  assert.equal(c.comando_verificacion_selectiva, null);
+  assert.equal(c.timeout_verificacion_selectiva, 600);
+});
+
+test('config (TASK-091): con completa, la selectiva y su timeout se leen (recortada)', () => {
+  const c = parsearConfig(
+    'comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "  node scripts/sel.js  "\ntimeout_verificacion_selectiva: 120\n',
+    RUTA
+  );
+  assert.equal(c.comando_verificacion_selectiva, 'node scripts/sel.js');
+  assert.equal(c.timeout_verificacion_selectiva, 120);
+  assert.equal(c.timeout_verificacion, 600, 'el timeout de la completa no cambia');
+});
+
+test('config (TASK-091): fallo cerrado — selectiva sin completa, timeout sin su comando y valores invalidos abortan', () => {
+  assert.throws(
+    () => parsearConfig('comando_verificacion_selectiva: "node sel.js"\n', RUTA),
+    /"comando_verificacion_selectiva" necesita tambien "comando_verificacion"[\s\S]*antes de integrar se exige la completa/
+  );
+  assert.throws(
+    () => parsearConfig('comando_verificacion: "npm test"\ntimeout_verificacion_selectiva: 60\n', RUTA),
+    /"timeout_verificacion_selectiva" sin "comando_verificacion_selectiva" no hace nada/
+  );
+  assert.throws(
+    () => parsearConfig('comando_verificacion: "npm test"\ncomando_verificacion_selectiva: ""\n', RUTA),
+    /"comando_verificacion_selectiva" debe ser un comando/
+  );
+  for (const malo of ['0', '-5', '1.5', 'diez']) {
+    assert.throws(
+      () =>
+        parsearConfig(
+          `comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node sel.js"\ntimeout_verificacion_selectiva: ${malo}\n`,
+          RUTA
+        ),
+      /"timeout_verificacion_selectiva" debe ser un numero entero/,
+      malo
+    );
+  }
+});
+
+// ---------------------------------------------------------------------
+// Hook Stop (criterio 2) y guardian
+// ---------------------------------------------------------------------
+
+/** Repo con una tarea en curso en su rama, nacida de develop (o de main si es hotfix). */
+async function conTareaEnCurso(
+  config: string,
+  fn: (raiz: string) => Promise<void>,
+  tarea: { tipo?: 'feature' | 'hotfix'; rama?: string } = {}
+): Promise<void> {
+  await repoReview(async (repoRoot, tareasRoot) => {
+    // Un hotfix nace de la principal: la config tiene que estar alli.
+    if (tarea.tipo === 'hotfix') git(['checkout', '-q', 'main'], repoRoot);
+    await escribirConfig(repoRoot, config);
+    commitReview(repoRoot, 'config');
+    const task = tareaReview({
+      id: 'TASK-910',
+      tipo: tarea.tipo ?? 'feature',
+      rama: tarea.rama ?? 'feature/task-910-selectiva',
+    });
+    git(['checkout', '-q', '-b', task.rama], repoRoot);
+    await writeTareaFile(tareasRoot, task, '## Objetivo\nx\n');
+    commitReview(repoRoot, 'tarea en curso');
+    await fn(repoRoot);
+  });
+}
+
+const stop = (raiz: string) => decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: raiz });
+
+test('Stop (TASK-091): con la clave corre la selectiva (no la completa) con RAMA_BASE=develop', async () => {
+  await conScripts(async (v) => {
+    await conTareaEnCurso(dosClaves(v), async (raiz) => {
+      const d = await stop(raiz);
+      assert.equal(d.codigo, 0, d.stderr);
+      assert.equal(v.ejecuciones('selectiva'), 1);
+      assert.equal(v.ejecuciones('completa'), 0, 'la completa no se corre en el fin de turno');
+      assert.equal(v.base('selectiva'), 'develop');
+      // Misma huella: el siguiente fin de turno reutiliza el memo de la selectiva.
+      assert.equal((await stop(raiz)).codigo, 0);
+      assert.equal(v.ejecuciones('selectiva'), 1);
+    });
+  });
+});
+
+test('Stop (TASK-091): en un hotfix la base que recibe la selectiva es la principal', async () => {
+  await conScripts(async (v) => {
+    await conTareaEnCurso(
+      dosClaves(v),
+      async (raiz) => {
+        assert.equal((await stop(raiz)).codigo, 0);
+        assert.equal(v.base('selectiva'), 'main');
+      },
+      { tipo: 'hotfix', rama: 'hotfix/task-910-urgente' }
+    );
+  });
+});
+
+test('Stop (TASK-091): selectiva en rojo bloquea el turno y dice que fue la selectiva', async () => {
+  await conScripts(async (v) => {
+    await v.desenlace('selectiva', 'ko');
+    await conTareaEnCurso(dosClaves(v), async (raiz) => {
+      const d = await stop(raiz);
+      assert.equal(d.codigo, 2);
+      assert.match(d.stderr, /selectiva: ERROR, 2 tests fallan/);
+      assert.match(d.stderr, /Es la verificacion selectiva \(por impacto respecto a develop\)/);
+      assert.equal(v.ejecuciones('completa'), 0);
+    });
+  });
+});
+
+test('Stop (TASK-091): sin la clave corre la completa, sin RAMA_BASE, como antes', async () => {
+  await conScripts(async (v) => {
+    await conTareaEnCurso(`comando_verificacion: "${v.comando('completa')}"\n`, async (raiz) => {
+      assert.equal((await stop(raiz)).codigo, 0);
+      assert.equal(v.ejecuciones('completa'), 1);
+      assert.equal(v.ejecuciones('selectiva'), 0);
+      assert.equal(v.base('completa'), '(sin RAMA_BASE)');
+    });
+  });
+});
+
+test('guardian (TASK-091): un verde de la selectiva no abre la puerta aunque los dos comandos sean el mismo texto', async () => {
+  await conScripts(async (v) => {
+    const mismo = v.comando('completa');
+    const merge = 'git checkout develop && git merge --no-ff feature/task-910-selectiva';
+    // Con la selectiva declarada (mismo texto que la completa), el verde del Stop no cuenta.
+    await conTareaEnCurso(
+      `comando_verificacion: "${mismo}"\ncomando_verificacion_selectiva: "${mismo}"\n`,
+      async (raiz) => {
+        assert.equal((await stop(raiz)).codigo, 0);
+        assert.equal(v.ejecuciones('completa'), 1);
+        assert.equal(decidirPreToolUse({ cwd: raiz, tool_input: { command: merge } }).codigo, 2);
+      }
+    );
+    // Contraste: sin selectiva, ese mismo verde del Stop (arbol limpio) si deja pasar el merge.
+    await conTareaEnCurso(`comando_verificacion: "${mismo}"\n`, async (raiz) => {
+      assert.equal((await stop(raiz)).codigo, 0);
+      assert.equal(decidirPreToolUse({ cwd: raiz, tool_input: { command: merge } }).codigo, 0);
+    });
+  });
+});
+
+test('memo (TASK-091): la selectiva no pisa el verde de la completa, y su huella cambia si avanza la base', async () => {
+  await conScripts(async (v) => {
+    await conTareaEnCurso(dosClaves(v), async (raiz) => {
+      const completa = { tipo: 'completa' as const, comando: v.comando('completa'), timeoutS: 600 };
+      const selectiva = { tipo: 'selectiva' as const, comando: v.comando('selectiva'), timeoutS: 600, base: 'develop' };
+      assert.equal(verificarConMemo(raiz, completa).deMemo, false);
+      assert.equal(verificarConMemo(raiz, selectiva).deMemo, false);
+      assert.equal(verificarConMemo(raiz, completa).deMemo, true, 'el memo de la completa sigue ahi');
+      assert.equal(verificarConMemo(raiz, selectiva).deMemo, true);
+      // develop avanza: lo cambiado respecto a la base es otro, la selectiva se repite.
+      const rama = git(['branch', '--show-current'], raiz).trim();
+      git(['checkout', '-q', 'develop'], raiz);
+      await writeFile(path.join(raiz, 'otro.txt'), 'x\n', 'utf8');
+      commitReview(raiz, 'avanza develop');
+      git(['checkout', '-q', rama], raiz);
+      assert.equal(verificarConMemo(raiz, selectiva).deMemo, false);
+      assert.equal(verificarConMemo(raiz, completa).deMemo, true, 'la huella de la completa no mira la base');
+      assert.throws(() => verificarConMemo(raiz, { ...selectiva, base: '' }), /necesita la rama base/);
+    });
+  });
+});
+
+// ---------------------------------------------------------------------
+// review (criterio 2 y decisiones de Carlos)
+// ---------------------------------------------------------------------
+
+async function conTareaParaReview(
+  config: string,
+  fn: (repoRoot: string, tareasRoot: string) => Promise<void>
+): Promise<void> {
+  await repoReview(async (repoRoot, tareasRoot) => {
+    await escribirConfig(repoRoot, config);
+    commitReview(repoRoot, 'config');
+    await setupTaskEnCurso(repoRoot, tareasRoot, tareaReview());
+    await fn(repoRoot, tareasRoot);
+  });
+}
+
+const review = (repoRoot: string, tareasRoot: string) =>
+  runReviewCommand(tareasRoot, ['TASK-600'], '2026-11-09', { repoCwd: repoRoot, scriptsDir: SCRIPTS_REVIEW });
+
+test('review (TASK-091): con la clave corre la selectiva con la base y la peticion dice cual fue, con su salida', async () => {
+  await conScripts(async (v) => {
+    await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
+      const r = await review(repoRoot, tareasRoot);
+      assert.equal(v.ejecuciones('selectiva'), 1);
+      assert.equal(v.ejecuciones('completa'), 0, 'review no corre la completa');
+      assert.equal(v.base('selectiva'), 'develop');
+      const peticion = readFileSync((r.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
+      assert.match(peticion, /## Verificacion de esta ronda/);
+      assert.match(peticion, /- Tipo: selectiva \(por impacto respecto a `develop`/);
+      assert.match(peticion, /el cierre la exige/);
+      assert.match(peticion, /- Resultado: salio con codigo 0/);
+      assert.match(peticion, /selectiva: todo en verde/);
+      // La seccion va despues de la cabecera: el parser del commit revisado toma la primera coincidencia.
+      assert.ok(peticion.indexOf('Commit revisado') < peticion.indexOf('## Verificacion de esta ronda'));
+      assert.equal(git(['status', '--porcelain'], repoRoot), '');
+    });
+  });
+});
+
+test('review (TASK-091): selectiva en rojo aborta sin ronda; la tarea sigue en curso (decision de Carlos)', async () => {
+  await conScripts(async (v) => {
+    await v.desenlace('selectiva', 'ko');
+    await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
+      await assert.rejects(
+        () => review(repoRoot, tareasRoot),
+        (e: unknown) => {
+          assert.ok(e instanceof ReviewCommandError);
+          assert.match(e.message, /verificacion selectiva .* no esta en verde, asi que no se abre ronda/);
+          assert.match(e.message, /la tarea sigue en curso/);
+          assert.match(e.message, /selectiva: ERROR, 2 tests fallan/);
+          assert.match(e.message, /con la variable de entorno RAMA_BASE=develop/);
+          return true;
+        }
+      );
+      assert.equal((await readTareaFile(tareasRoot, 'TASK-600'))?.task.estado, 'en-curso');
+      const carpeta = path.join(tareasRoot, '02-en-curso', 'TASK-600');
+      const revision = path.join(carpeta, 'revision');
+      assert.ok(!existsSync(revision) || (await readdir(revision)).length === 0, 'no queda ninguna ronda a medias');
+      assert.equal(git(['status', '--porcelain'], repoRoot), '');
+    });
+  });
+});
+
+test('review (TASK-091): una selectiva que ensucia el arbol aborta sin ronda', async () => {
+  await conScripts(async (v) => {
+    await v.desenlace('selectiva', 'ensucia');
+    await conTareaParaReview(dosClaves(v), async (repoRoot, tareasRoot) => {
+      await assert.rejects(() => review(repoRoot, tareasRoot), /ha dejado cambios en el arbol de trabajo[\s\S]*No se ha abierto ronda/);
+      assert.equal((await readTareaFile(tareasRoot, 'TASK-600'))?.task.estado, 'en-curso');
+    });
+  });
+});
+
+test('review (TASK-091): con la selectiva, la seccion de cobertura se omite y la peticion dice por que', async () => {
+  await conScripts(async (v) => {
+    await conTareaParaReview(`${dosClaves(v)}informe_cobertura: coverage/lcov.info\n`, async (repoRoot, tareasRoot) => {
+      const r = await review(repoRoot, tareasRoot);
+      const peticion = readFileSync((r.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
+      assert.doesNotMatch(peticion, /## Cobertura/);
+      assert.match(peticion, /- Cobertura: no se muestra en esta ronda/);
+    });
+  });
+});
+
+test('review (TASK-091): sin la clave no corre nada y la peticion no lleva seccion de verificacion', async () => {
+  await conScripts(async (v) => {
+    await conTareaParaReview(`comando_verificacion: "${v.comando('completa')}"\n`, async (repoRoot, tareasRoot) => {
+      const r = await review(repoRoot, tareasRoot);
+      assert.equal(v.ejecuciones('completa'), 0);
+      assert.equal(v.ejecuciones('selectiva'), 0);
+      const peticion = readFileSync((r.informes[0] as { peticionPath: string }).peticionPath, 'utf8');
+      assert.doesNotMatch(peticion, /Verificacion de esta ronda/);
+    });
+  });
+});
+
+// ---------------------------------------------------------------------
+// finish (criterio 3)
+// ---------------------------------------------------------------------
+
+async function conTareaParaFinish(v: Verifs, fn: (repoRoot: string, tareasRoot: string) => Promise<void>): Promise<void> {
+  await repoFinish(async (repoRoot, tareasRoot) => {
+    await escribirConfig(repoRoot, dosClaves(v));
+    commitFinish(repoRoot, 'config');
+    await setupTaskEnRevision(repoRoot, tareasRoot, tareaFinish({ id: 'TASK-911' }));
+    await fn(repoRoot, tareasRoot);
+  });
+}
+
+const finish = (repoRoot: string, tareasRoot: string) =>
+  runFinishCommand(tareasRoot, ['TASK-911'], '2026-11-09', { repoCwd: repoRoot, scriptsDir: SCRIPTS_FINISH });
+
+test('finish (TASK-091): exige la completa aunque la selectiva este en verde y guardada', async () => {
+  await conScripts(async (v) => {
+    await conTareaParaFinish(v, async (repoRoot, tareasRoot) => {
+      const cfg = resolverConfig(repoRoot);
+      const sel = verificarConMemo(repoRoot, {
+        tipo: 'selectiva',
+        comando: cfg.comando_verificacion_selectiva as string,
+        timeoutS: cfg.timeout_verificacion_selectiva,
+        base: 'develop',
+      });
+      assert.equal(sel.resultado.estado, 'verde');
+      const r = await finish(repoRoot, tareasRoot);
+      assert.equal(r.cierre, 'terminada');
+      assert.equal(v.ejecuciones('completa'), 1, 'finish ejecuto la completa');
+      assert.equal(v.ejecuciones('selectiva'), 1, 'y no volvio a correr la selectiva');
+    });
+  });
+});
+
+test('finish (TASK-091): con la completa en rojo no integra y dice como correrla, aunque la selectiva este en verde', async () => {
+  await conScripts(async (v) => {
+    await v.desenlace('completa', 'ko');
+    await conTareaParaFinish(v, async (repoRoot, tareasRoot) => {
+      const developAntes = git(['rev-parse', 'develop'], repoRoot).trim();
+      await assert.rejects(
+        () => finish(repoRoot, tareasRoot),
+        (e: unknown) => {
+          assert.ok(e instanceof FinishCommandError);
+          assert.match(e.message, /no se mergea con la verificacion en rojo/);
+          assert.match(e.message, /completa: ERROR, 2 tests fallan/);
+          assert.match(e.message, /Es la verificacion completa \(comando_verificacion\)[\s\S]*aunque las rondas usaran la selectiva/);
+          assert.match(e.message, /Correla a mano/);
+          return true;
+        }
+      );
+      assert.equal(git(['rev-parse', 'develop'], repoRoot).trim(), developAntes);
+      assert.equal((await readTareaFile(tareasRoot, 'TASK-911'))?.task.estado, 'en-revision');
+    });
+  });
+});
+
+// ---------------------------------------------------------------------
+// doctor (criterio 4)
+// ---------------------------------------------------------------------
+
+test('doctor (TASK-091): completa sin selectiva avisa con el arreglo en la misma linea', () => {
+  const [c, ...resto] = comprobarVerificacionSelectiva(parsearConfig('comando_verificacion: "npm test"\n', RUTA));
+  assert.equal(resto.length, 0);
+  assert.equal(c?.id, 'verificacion-selectiva');
+  assert.equal(c?.nivel, 'aviso');
+  assert.match(c?.mensaje ?? '', /sin comando_verificacion_selectiva: cada fin de turno corre la verificacion completa; .*declara en \.taskcode\/config\.yml comando_verificacion_selectiva: /);
+  assert.doesNotMatch(c?.mensaje ?? '', /\n/);
+  assert.match(c?.arreglo ?? '', /^Declara en \.taskcode\/config\.yml comando_verificacion_selectiva:/);
+});
+
+test('doctor (TASK-091): con las dos, ok; sin completa o con config invalida, nada', () => {
+  const [c] = comprobarVerificacionSelectiva(
+    parsearConfig('comando_verificacion: "npm test"\ncomando_verificacion_selectiva: "node sel.js"\n', RUTA)
+  );
+  assert.equal(c?.nivel, 'ok');
+  assert.match(c?.mensaje ?? '', /comando_verificacion_selectiva: "node sel\.js" \(timeout 600 s\)/);
+  assert.deepEqual(comprobarVerificacionSelectiva(parsearConfig('', RUTA)), []);
+  assert.deepEqual(comprobarVerificacionSelectiva(null), []);
+});
+
+// ---------------------------------------------------------------------
+// Guia de migracion (criterio 6): instalable, enlazada y sin marcas de este repo
+// ---------------------------------------------------------------------
+
+test('guia (TASK-091): task-workflow enlaza verificacion-selectiva.md, que explica las dos claves, RAMA_BASE, el clasificador y cuando correr todo', () => {
+  const dir = path.join(import.meta.dirname, '..', '..', '..', 'skills', 'task-workflow');
+  const skill = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
+  assert.match(skill, /comando_verificacion_selectiva[\s\S]*\[verificacion-selectiva\.md\]\(verificacion-selectiva\.md\)/);
+  const guia = readFileSync(path.join(dir, 'verificacion-selectiva.md'), 'utf8');
+  for (const marca of [
+    /comando_verificacion_selectiva:/,
+    /comando_verificacion:/,
+    /timeout_verificacion_selectiva/,
+    /RAMA_BASE/,
+    /arbol de trabajo/,
+    /git ls-files --others --exclude-standard/,
+    /corre todo/,
+    /lockfiles/,
+    /La completa no se convierte en el clasificador/,
+    /Antes de integrar se exige siempre la\s+completa/,
+    /`taskctl doctor`/,
+  ]) {
+    assert.match(guia, marca);
+  }
+  assert.doesNotMatch(guia, /TaskCode/);
+});
````

## Excluido del diff (16 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-091/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-091/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-091/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-091/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-091/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-091/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-091/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                     | 26 ++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        | 10 ++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     | 54 +++++++++++++++++++++++++++++++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 32 ++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/informe-verificacion.js                           | 34 ++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/version.js                                        |  2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     | 73 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++--------
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                    | 56 +++++++++++++++++++++++++++++++++++---------------------
 taskcode-marketplace/plugins/taskcode-plugin/package-lock.json                                               |  4 ++--
 16 files changed, 262 insertions(+), 36 deletions(-)
````
