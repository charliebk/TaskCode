# Peticion de revision — TASK-110 (ronda 1)

- Tarea: TASK-110 — Progreso visible sin tokens: estado de cada fase en el terminal
- Rama revisada: feature/task-110-progreso-visible-sin-tokens-estado-de-ca
- Rama base: develop
- Commit revisado (HEAD): 4cb0f1a295713dc33b4d707670d7a2a209d7a8c5
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-110 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-110/tarea.md
- tareas/03-en-revision/TASK-110/planificacion/
- CHANGELOG.md
- CLAUDE.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
- taskcode-marketplace/plugins/taskcode-plugin/package.json
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/estado.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/estado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-status-line.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado-seguir.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/progreso-comandos.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/progreso-verificacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/reporter-progreso.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/progreso.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/reporter-progreso.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/helpers/progreso.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/reporter/progreso.ts

## Commits a revisar (git log develop..HEAD)

````
4cb0f1a update(feature): develop -> feature/task-110-progreso-visible-sin-tokens-estado-de-ca
2903cf8 docs(TASK-110): autorrevision
39b27f9 fix(TASK-110): doctor no instala la status line si el taskctl de la cache no entiende estado
b9168d1 feat(TASK-110): status line con el taskctl de la cache del plugin si no esta en el PATH
3290905 build(TASK-110): dist regenerado
fa4f301 docs(TASK-110): taskctl estado, la status line y TASKCTL_PROGRESO
88c9731 feat(TASK-110): taskctl estado --seguir (paso F)
66e3795 test(TASK-110): reporter de progreso [x/N] para npm test (paso E)
9047d3a feat(TASK-110): TASKCTL_PROGRESO para el comando de verificacion (paso C)
8b28b2f feat(TASK-110): review, finish y el freno Stop escriben su progreso (paso B2)
ce7e89f feat(TASK-110): plan, approve y start escriben su progreso (paso B1)
e61ff53 feat(TASK-110): doctor ofrece e instala la status line de Claude Code (paso D)
b3d3de8 feat(TASK-110): contrato del progreso y taskctl estado (paso A)
75eb3da docs(TASK-110): paso S, la status line se ve en la app de escritorio y por Remote Control
ecfd1ef chore(TASK-110): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 6e2f7fd..bc5ea7b 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -138,6 +138,27 @@ Cambio de comportamiento: las tareas ya cerradas no se migran; su fila
 cierre, asi que sus duraciones no cambian. La tabla de `metricas` gana una
 columna.
 
+Progreso visible sin tokens (TASK-110). `plan`, `approve`, `start`, `review`,
+`finish` y el freno Stop escriben en `.git/taskcode/progreso.json` la tarea, la
+fase, sus pasos declarados de antemano, el paso en marcha y el inicio, y lo
+marcan terminado al acabar (tambien al abortar). Escribirlo no anade ni una
+linea de salida a ningun comando ni hook y nunca hace fallar el comando. Comando
+nuevo `taskctl estado [--seguir] [--stdin]`: una linea como
+`TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min`, leyendo
+solo esos ficheros, sin lanzar git, por una via rapida de `bin/taskctl` que no
+carga el resto de comandos; sin nada en marcha lo dice, fuera de un repo con
+tareas no imprime nada, y sale siempre con 0. `--seguir` refresca cada segundo
+hasta que la fase termina (sin terminal, una linea y sale). `taskctl doctor`
+dice si esta la status line de Claude Code que lo muestra y la instala solo con
+`--instalar-status-line`, en el `settings.json` de usuario (una vez, para todos
+los proyectos), conservando el resto de claves y con copia, solo si `taskctl`
+esta en el PATH del sistema y sin pisar otra salvo con
+`--reemplazar-status-line`; `--desinstalar-status-line` la quita y devuelve la
+anterior. El comando de verificacion recibe `TASKCTL_PROGRESO` (un fichero bajo
+`.git/`): si escribe `x/N`, la linea lo muestra; nadie mas hereda la variable.
+`npm test` del propio plugin muestra `[x/N]` con un reporter sin dependencias
+junto al `spec`, con el total de la ejecucion anterior guardado bajo `.git/`.
+
 ## 0.14.0 — 2026-11-10
 
 ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
diff --git a/CLAUDE.md b/CLAUDE.md
index e6d3479..99f63ba 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -46,7 +46,7 @@ npm test             # compila y corre la suite completa (~1290 tests, ~10 min)
 npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar, no para cerrar
 ```
 
-El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | doctor [--json] | doctor-deploy [--json] [--escribir] | plan |
+El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | estado [--seguir] | doctor [--json] [--instalar-status-line] | doctor-deploy [--json] [--escribir] | plan |
 approve | start | review | finish [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push] | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
 recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
 cerradas.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 5c3cdfd..0ed2e9d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -807,10 +807,76 @@ algún error (los avisos no cuentan). Comprueba:
   no ve versiones más nuevas. Si no puede comprobarlo (plugin no instalado por
   Claude Code, sin copia del marketplace, un JSON roto), `omitida` con el motivo.
   Nunca es error: no cambia el código de salida.
+- **Status line** (`status-line`): si Claude Code tiene instalada la status line
+  que muestra `taskctl estado` (ver «Progreso visible» abajo). Instalada, `ok`; si
+  no, `omitida` con el comando que la instala. Sin flags nunca es aviso ni error.
 
 `--json` escribe en stdout **solo** una línea de JSON
 (`{ok, errores, avisos, comprobaciones: [{id, nivel, mensaje, arreglo}]}`), para que
-una skill la lea. `taskctl doctor` no escribe, no commitea ni cambia de rama.
+una skill la lea. `taskctl doctor` no commitea ni cambia de rama, y sin flags no
+escribe nada. La única escritura es la de la status line, con su flag:
+
+- `--instalar-status-line` la escribe en el `settings.json` **de usuario**
+  (`~/.claude/settings.json`, o el de `CLAUDE_CONFIG_DIR`): una vez, para todos
+  los proyectos. Conserva el resto de claves, deja una copia
+  (`settings.json.<fecha>.bak`) y escribe con fichero temporal y renombrado. Es
+  idempotente. El comando es `taskctl estado --stdin` si `taskctl` está en el
+  PATH del sistema. Si solo está en la carpeta del plugin (la que Claude Code
+  añade al PATH de su herramienta Bash), usa esa copia con `node` y su ruta
+  absoluta: como la ruta lleva la versión del plugin, tras actualizarlo hay que
+  repetir `--instalar-status-line`, que la reescribe con la ruta nueva (para no
+  depender de eso, pon `taskctl` en el PATH; ver «Usar `taskctl` fuera de
+  Claude Code»). Si ya hay otra status line, no la toca.
+- `--reemplazar-status-line` (junto al anterior) sustituye una status line
+  ajena; la anterior se guarda en `statusline-previa-taskctl.json`.
+- `--desinstalar-status-line` quita la de `taskctl` (una ajena no se toca) y
+  devuelve la que hubiera antes.
+
+Con cualquiera de ellos, si lo pedido no se puede hacer la comprobación sale como
+`error` y el código de salida es 1.
+
+#### Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`
+
+Mientras `plan`, `approve`, `start`, `review`, `finish` o el freno de fin de turno
+trabajan, cada uno deja en `.git/taskcode/progreso.json` (fuera del árbol de
+trabajo: no cambia la huella de la verificación) la tarea, la fase, sus pasos
+declarados de antemano, el paso en marcha y el instante de inicio, y lo marca
+terminado al acabar, también si aborta. Escribirlo no añade ninguna salida a
+ningún comando ni hook (lo que se imprime lo lee el agente y cuesta tokens) y
+nunca hace fallar el comando: si no se puede escribir, se pierde ese tic.
+
+`taskctl estado` lo muestra en una línea, leyendo solo esos ficheros, sin lanzar
+`git` ni leer `tareas/`:
+
+```
+TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min
+```
+
+La fase con su posición en el ciclo (plan, approve, start, review, finish), la
+ronda si es una revisión, el paso con su posición dentro de la fase, el `x/N`
+del comando de verificación si lo escribe, y los minutos desde que empezó la
+fase. Los pasos: `plan` guardas, brainstorm, commit; `approve` guardas, plan,
+commit; `start` guardas, rama, commit; `review` guardas, integracion,
+verificacion, peticiones, commit; `finish` puertas, verificacion, cobertura,
+held-out, merge, artefactos; el freno, `freno · verificacion`. Sin nada en
+marcha dice `Nada en marcha.` (o la última fase y si terminó o abortó); fuera de
+un repo con `tareas/` o `.taskcode/` no imprime nada. Sale siempre con 0.
+`--stdin` toma el directorio del JSON que Claude Code pasa a la status line.
+`--seguir` refresca cada segundo hasta que la fase termina; sin terminal imprime
+una sola línea y sale, para que un agente que lo lance no se quede esperando.
+
+La status line de Claude Code (`taskctl doctor --instalar-status-line`) ejecuta
+`taskctl estado` en cada refresco: el estado se ve sin preguntar al agente, y no
+entra en su contexto. Se ve también en la app de escritorio y por Remote Control.
+
+`TASKCTL_PROGRESO`: el comando de verificación (`comando_verificacion`, la
+selectiva y la de documentación, en `finish`, en las rondas de `review` y en el
+freno) recibe en esta variable la ruta de un fichero bajo `.git/`. Si escribe en
+él una línea `x/N` (la última con texto cuenta), `taskctl estado` la muestra en
+el paso de verificación. Es opcional: sin escribir nada, la línea muestra el
+paso sin `x/N`. Solo lo recibe ese comando: no lo heredan los scripts de
+Git-Flow ni el de held-out, y un `TASKCTL_PROGRESO` que ya estuviera en el
+entorno se sustituye. De lo que se escriba solo se muestran los números.
 
 #### Cómo se verifica el proyecto: `comando_verificacion`
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl b/taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
index 79d808e..831148b 100755
--- a/taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
+++ b/taskcode-marketplace/plugins/taskcode-plugin/bin/taskctl
@@ -1,7 +1,13 @@
 #!/usr/bin/env node
-import('../dist/src/cli.js')
-  .then(async (m) => {
-    const code = await m.main(process.argv.slice(2));
+// "taskctl estado" va por una via rapida: lo ejecuta la status line en cada
+// refresco y no debe cargar el grafo entero de comandos (dist/src/cli.js).
+const argv = process.argv.slice(2);
+const arranque =
+  argv[0] === 'estado'
+    ? import('../dist/src/commands/estado.js').then((m) => m.mainEstado(argv.slice(1)))
+    : import('../dist/src/cli.js').then((m) => m.main(argv));
+arranque
+  .then((code) => {
     process.exitCode = code;
   })
   .catch((e) => {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package.json b/taskcode-marketplace/plugins/taskcode-plugin/package.json
index 3b69abf..4df10c1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package.json
@@ -15,8 +15,8 @@
     "build": "tsc -p tsconfig.json",
     "lint": "tsc -p tsconfig.json --noEmit",
     "limpiar:test": "node -e \"require('node:fs').rmSync('dist/test',{recursive:true,force:true})\"",
-    "test": "npm run limpiar:test && npm run build && node --test --experimental-test-coverage \"dist/test/**/*.test.js\"",
-    "test:rapido": "npm run limpiar:test && npm run build && node --test \"dist/test/core/**/*.test.js\" \"dist/test/cli/**/*.test.js\""
+    "test": "npm run limpiar:test && npm run build && node --test --experimental-test-coverage --test-reporter=spec --test-reporter-destination=stdout --test-reporter=./dist/test/reporter/progreso.js --test-reporter-destination=stderr \"dist/test/**/*.test.js\"",
+    "test:rapido": "npm run limpiar:test && npm run build && node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=./dist/test/reporter/progreso.js --test-reporter-destination=stderr \"dist/test/core/**/*.test.js\" \"dist/test/cli/**/*.test.js\""
   },
   "devDependencies": {
     "typescript": "^5.6.0",
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 4e2d137..2025cfd 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -60,6 +60,8 @@ import {
 import { ConfigError } from './core/config.js';
 import { formatearInstante } from './core/transiciones.js';
 import { VERSION_TASKCTL } from './core/version.js';
+import { mainEstado } from './commands/estado.js';
+import { VARIABLE_PROGRESO } from './fs/progreso.js';
 
 const VERSION = VERSION_TASKCTL;
 
@@ -88,7 +90,8 @@ Uso:
                     [--informe <nombre>] [--push]
   taskctl finish TASK-NNN [--tag <nombre>] [--merge-request] [--sin-verificacion] [--push]
   taskctl siguiente TASK-NNN [--json]
-  taskctl doctor [--json]
+  taskctl estado [--seguir]
+  taskctl doctor [--json] [--instalar-status-line [--reemplazar-status-line] | --desinstalar-status-line]
   taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas]
   taskctl pausa TASK-NNN [--push]
   taskctl registrar-coste TASK-NNN --fase <diseno|implementacion|revision> \\
@@ -101,7 +104,12 @@ Uso:
   taskctl abort-merge
 
 Comandos: new, import, board, roadmap, metricas, start, plan, approve, review, codex-review, veredicto,
-finish, siguiente, doctor, doctor-deploy, pausa, registrar-coste, cadena.
+finish, siguiente, estado, doctor, doctor-deploy, pausa, registrar-coste, cadena.
+estado dice en que va la tarea en curso (fase dentro del ciclo, paso dentro de la fase, x/N si el
+comando de verificacion lo escribe, minutos), leyendo solo el progreso que dejan plan, approve, start,
+review, finish y el freno de fin de turno bajo .git/: sin lanzar git. Sin nada en marcha lo dice; fuera
+de un repo con tareas no imprime nada. Sale siempre con 0. --seguir refresca cada segundo hasta que la
+fase termina; sin terminal imprime una sola linea y sale.
 roadmap genera tareas/ROADMAP.md (hitos por sprint, orden por dependencias, complejidad, estado y
 lo que esta en marcha o listo para empezar). new, plan, approve y finish lo regeneran en su commit
 cuando cae en la rama de integracion, pero solo si lleva la marca de taskctl en su tercera linea o
@@ -149,7 +157,11 @@ config pide merge request o declara plataforma, gh/glab y su sesion), hooks que
 subagentes y si el plugin instalado esta por detras de la copia local de su marketplace (aviso, sin
 red). Una linea por comprobacion
 (ok, aviso, error u omitida) y, en cada aviso o error, el comando que lo arregla; sale con 1 si hay
-algun error. Solo lee. --json da lo mismo en una linea de JSON.
+algun error. Solo lee. --json da lo mismo en una linea de JSON. Tambien dice si esta la status line de
+Claude Code que muestra "taskctl estado"; --instalar-status-line la escribe en el settings.json de usuario
+(una vez, para todos los proyectos; conserva el resto de claves y deja copia), solo si taskctl esta en el
+PATH del sistema y sin pisar otra status line salvo con --reemplazar-status-line;
+--desinstalar-status-line la quita (y devuelve la que hubiera antes).
 doctor-deploy comprueba, antes de publicar, que la aplicacion no deja agujeros conocidos: detecta el tipo (Node,
 Rust, Python, Java, .NET, Go, PHP, Ruby, Docker, frontend) y recorre un catalogo de puntos. Cada punto sale OK
 (con evidencia), FALLA (con evidencia y arreglo), NO VERIFICADO (con lo que falta) o NO APLICA (con el motivo).
@@ -397,6 +409,10 @@ let sincronizacionPendiente = false;
  */
 export async function main(argv: readonly string[]): Promise<number> {
   sincronizacionPendiente = false;
+  // TASK-110: el contador de una verificacion de fuera no se hereda. taskctl da
+  // el suyo al comando de verificacion y a nadie mas (scripts de Git-Flow,
+  // held-out, tests que lanzan otros taskctl...).
+  delete process.env[VARIABLE_PROGRESO];
   const codigo = await mainComando(argv);
   return codigo === 0 && sincronizacionPendiente ? CODIGO_SINCRONIZACION_NO_APLICADA : codigo;
 }
@@ -414,6 +430,9 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     return 0;
   }
 
+  // TASK-110: normalmente llega por la via rapida de bin/taskctl, sin pasar por aqui.
+  if (cmd === 'estado') return mainEstado(argv.slice(1));
+
   if (GUARDADOS_POR_CADENA.has(cmd)) {
     let resto: string[];
     try {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index f75aeb1..e09aa30 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -47,6 +47,7 @@ import {
 } from '../core/roles-brainstorm.js';
 import { nombrePeticionRol } from '../core/plan-brainstorm.js';
 import { planEsEsqueleto } from '../core/validacion-tarea.js';
+import { conProgreso, crearProgreso, type Progreso } from '../fs/progreso.js';
 import { ensureBaseBranchReady, type BaseBranchGuardResult } from '../fs/git.js';
 import {
   autoCommit,
@@ -113,13 +114,30 @@ export interface ApproveCommandDeps {
   repoCwd: string;
   /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
   ahora?: string;
+  /** TASK-110: donde se escribe el progreso visible (por defecto, bajo el .git del repo). */
+  progreso?: Progreso;
 }
 
+/** TASK-110: los pasos de approve, declarados de antemano para que se sepa cuantos faltan. */
+export const PASOS_APPROVE: readonly string[] = ['guardas', 'plan', 'commit'];
+
 export async function runApproveCommand(
   tareasRoot: string,
   argv: readonly string[],
   today: string,
   deps: ApproveCommandDeps
+): Promise<ApproveCommandResult> {
+  // TASK-110: el progreso se marca terminado tambien si aborta.
+  const progreso = deps.progreso ?? crearProgreso(deps.repoCwd);
+  return conProgreso(progreso, () => runApprove(tareasRoot, argv, today, deps, progreso));
+}
+
+async function runApprove(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: ApproveCommandDeps,
+  progreso: Progreso
 ): Promise<ApproveCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_APPROVE, 'approve', (m) => new ApproveCommandError(m));
@@ -147,6 +165,8 @@ export async function runApproveCommand(
     planFinalExiste: planFinalExisteEn(ubicacionInicial),
   });
   assertPlanNoAmbiguo(id, ubicacionInicial!);
+  progreso.fase(initial!.task.id, 'approve', PASOS_APPROVE);
+  progreso.paso('guardas');
 
   // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
   // tiene cambios sin commitear, o si no puede cambiar de forma
@@ -169,6 +189,7 @@ export async function runApproveCommand(
   // la plantilla sin rellenar. Se compara con las plantillas posibles (los
   // roles se eligen en un orden fijo, asi que solo hay 0..N prefijos), no
   // con textos copiados, para que siga valiendo si la plantilla cambia.
+  progreso.paso('plan');
   const rutaPlan = ubicacion!.canonicaExiste ? ubicacion!.canonica : ubicacion!.legada;
   if (await planEsPlantilla(task, rutaPlan)) {
     throw new ApproveCommandError(
@@ -211,6 +232,7 @@ export async function runApproveCommand(
     );
   }
 
+  progreso.paso('commit');
   const updated: Task = { ...task, plan_aprobado: true, actualizado: today };
   // Reaprobar un plan ya aprobado no es una transicion: sin fila nueva, y
   // asi la segunda vez sigue sin crear commit (es idempotente).
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 7499616..cebb2a0 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -7,7 +7,8 @@
  * configuracion, coherencia de las tareas y, si la config lo pide, el CLI de la
  * plataforma (gh/glab) y su sesion. SOLO LEE: no escribe, no commitea, no
  * cambia de rama; lo unico que sale a la red es la comprobacion de sesion de
- * la plataforma, con timeout propio corto.
+ * la plataforma, con timeout propio corto. La unica escritura (TASK-110): la
+ * status line de Claude Code, y solo con su flag explicito.
  *
  * Decisiones (plan de TASK-062, Carlos 2026-10-08):
  *
@@ -58,11 +59,26 @@ import { directorioConfigClaude } from '../fs/config-claude.js';
 import { sondearHooksClaude } from '../fs/sondas-hooks-claude.js';
 import { sondearVersionPlugin } from '../fs/sonda-version-plugin.js';
 import { compararVersiones, NOMBRE_PLUGIN } from '../core/version.js';
+import {
+  COMANDO_STATUS_LINE,
+  desinstalarStatusLine,
+  instalarStatusLine,
+  sondearStatusLine,
+  type ResultadoAccion,
+} from '../fs/status-line.js';
 
 export class DoctorCommandError extends Error {}
 
-/** Flags de `taskctl doctor`: solo --json. */
-export const FLAGS_DOCTOR: readonly string[] = ['--json'];
+/** Flags de `taskctl doctor`: --json y, desde TASK-110, los de la status line (los unicos que escriben). */
+export const FLAG_INSTALAR_STATUS_LINE = '--instalar-status-line';
+export const FLAG_REEMPLAZAR_STATUS_LINE = '--reemplazar-status-line';
+export const FLAG_DESINSTALAR_STATUS_LINE = '--desinstalar-status-line';
+export const FLAGS_DOCTOR: readonly string[] = [
+  '--json',
+  FLAG_INSTALAR_STATUS_LINE,
+  FLAG_REEMPLAZAR_STATUS_LINE,
+  FLAG_DESINSTALAR_STATUS_LINE,
+];
 
 /** Espera maxima de la comprobacion de sesion de la plataforma (el unico acceso a la red). */
 export const TIMEOUT_PLATAFORMA_MS = 10_000;
@@ -79,6 +95,10 @@ export interface DoctorCommandDeps {
   timeoutGitMs?: number;
   /** Directorio de configuracion de Claude Code (por defecto CLAUDE_CONFIG_DIR o ~/.claude). Para los tests. */
   configClaudeDir?: string;
+  /** TASK-110: entorno donde se busca taskctl en el PATH (por defecto el del proceso). Para los tests. */
+  env?: NodeJS.ProcessEnv;
+  /** TASK-110: instante de la copia de seguridad de settings.json (por defecto ahora). Para los tests. */
+  ahora?: Date;
 }
 
 export interface DoctorCommandResult {
@@ -698,6 +718,53 @@ export function comprobarVersionPlugin(deps: DoctorCommandDeps): Comprobacion {
   }
 }
 
+// ---------------------------------------------------------------------
+// Status line de Claude Code (TASK-110)
+// ---------------------------------------------------------------------
+
+/**
+ * Sin flags SOLO mira y nunca da aviso ni error (no cambia el codigo de salida
+ * ni los avisos que cuentan los demas tests): `ok` si esta, `omitida` con la
+ * oferta si no. Con --instalar-status-line o --desinstalar-status-line, el
+ * resultado de la accion: `error` si se pidio y no se pudo.
+ */
+export function comprobarStatusLine(deps: DoctorCommandDeps, accion: 'mirar' | 'instalar' | 'reemplazar' | 'desinstalar'): Comprobacion {
+  const id = 'status-line';
+  const configDir = deps.configClaudeDir ?? directorioConfigClaude();
+  if (accion !== 'mirar') {
+    const r: ResultadoAccion =
+      accion === 'desinstalar'
+        ? desinstalarStatusLine(configDir, deps.ahora ?? new Date())
+        : instalarStatusLine(configDir, {
+            reemplazar: accion === 'reemplazar',
+            env: deps.env ?? process.env,
+            ahora: deps.ahora ?? new Date(),
+          });
+    return r.tipo === 'rechazado' ? fallo(id, una(r.mensaje), r.arreglo) : ok(id, una(r.mensaje));
+  }
+  const s = sondearStatusLine(configDir);
+  switch (s.estado) {
+    case 'nuestra':
+      return ok(id, una(`instalada en ${s.ruta}: Claude Code muestra en que va la tarea (${COMANDO_STATUS_LINE})`));
+    case 'ausente':
+      return omitida(
+        id,
+        'no instalada. Para ver en Claude Code en que va la tarea en curso (fase, paso, x/N, minutos) sin preguntar ' +
+          `al agente: taskctl doctor ${FLAG_INSTALAR_STATUS_LINE} (una vez, para todos los proyectos)`
+      );
+    case 'ajena':
+      return omitida(
+        id,
+        una(
+          `${s.ruta} ya tiene otra status line ("${s.comando}"): no se toca. Para sustituirla por la de taskctl ` +
+            `(con copia; desinstalar la devuelve): taskctl doctor ${FLAG_INSTALAR_STATUS_LINE} ${FLAG_REEMPLAZAR_STATUS_LINE}`
+        )
+      );
+    case 'ilegible':
+      return omitida(id, una(`no se pudo leer ${s.ruta}: ${s.motivo}`));
+  }
+}
+
 // ---------------------------------------------------------------------
 // Orquestacion
 // ---------------------------------------------------------------------
@@ -708,6 +775,20 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   if (sobra !== undefined) {
     throw new DoctorCommandError(`[ERROR] taskctl doctor: no admite argumentos ("${sobra}"). Uso: taskctl doctor [--json].`);
   }
+  const instalar = argv.includes(FLAG_INSTALAR_STATUS_LINE);
+  const reemplazar = argv.includes(FLAG_REEMPLAZAR_STATUS_LINE);
+  const desinstalar = argv.includes(FLAG_DESINSTALAR_STATUS_LINE);
+  if (reemplazar && !instalar) {
+    throw new DoctorCommandError(
+      `[ERROR] taskctl doctor: ${FLAG_REEMPLAZAR_STATUS_LINE} solo vale junto a ${FLAG_INSTALAR_STATUS_LINE}. No se ha tocado nada.`
+    );
+  }
+  if (instalar && desinstalar) {
+    throw new DoctorCommandError(
+      `[ERROR] taskctl doctor: ${FLAG_INSTALAR_STATUS_LINE} y ${FLAG_DESINSTALAR_STATUS_LINE} se excluyen. No se ha tocado nada.`
+    );
+  }
+  const accionStatusLine = desinstalar ? 'desinstalar' : reemplazar ? 'reemplazar' : instalar ? 'instalar' : 'mirar';
   const json = argv.includes('--json');
   const cwd = deps.repoCwd;
   const tareasRoot = path.join(cwd, 'tareas');
@@ -760,6 +841,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
   );
   cs.push(...envolver('hooks-subagente', () => comprobarHooksSubagente(deps)));
   cs.push(...envolver('version-plugin', () => comprobarVersionPlugin(deps)));
+  cs.push(...envolver('status-line', () => comprobarStatusLine(deps, accionStatusLine)));
 
   return {
     comprobaciones: cs,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/estado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/estado.ts
new file mode 100644
index 0000000..2e9952e
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/estado.ts
@@ -0,0 +1,150 @@
+/**
+ * `taskctl estado [--seguir] [--stdin]` — TASK-110. Dice en que va la tarea en
+ * curso (fase, paso, x/N, minutos) leyendo SOLO los ficheros de progreso bajo
+ * `.git/`: sin lanzar git, sin leer `tareas/`. Lo ejecuta la status line de
+ * Claude Code en cada refresco, asi que:
+ *
+ * - `bin/taskctl` lo carga por una via rapida, sin el grafo de `cli.ts`. Este
+ *   modulo NO puede importar nada que arrastre `fs/git.ts` ni otros comandos
+ *   (un test lo comprueba).
+ * - Fuera de un repo con tareas no imprime nada (la status line se instala
+ *   una vez, para todos los proyectos). Con tareas y sin nada en marcha, lo
+ *   dice. Sale siempre con 0, salvo un flag desconocido.
+ * - `--stdin`: lee el JSON que Claude Code pasa a la status line y usa su
+ *   directorio (`workspace.current_dir` o `cwd`). Con un tope de espera: un
+ *   stdin abierto que nunca se cierra no lo cuelga.
+ * - `--seguir`: refresca cada segundo hasta que la fase termina. SIN TERMINAL
+ *   imprime una sola linea y sale: lanzado por un agente, se quedaria colgado
+ *   minutos volcando lineas a su contexto, justo el gasto que esto evita.
+ */
+import { existsSync, statSync } from 'node:fs';
+import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { NADA_EN_MARCHA, enMarcha, formatearEstado } from '../core/progreso.js';
+import { leerContador, leerProgreso, ubicarGit } from '../fs/progreso.js';
+
+export const FLAGS_ESTADO: readonly string[] = ['--seguir', '--stdin'];
+
+/** Solo para tests: `--seguir` refresca aunque no haya terminal (un subproceso de test no la tiene). */
+export const VARIABLE_SEGUIR_SIN_TTY = 'TASKCTL_ESTADO_SEGUIR_SIN_TTY';
+const INTERVALO_MS = 1000;
+const ESPERA_STDIN_MS = 300;
+
+export interface Lectura {
+  linea: string;
+  /** true si hay una fase en marcha (la que `--seguir` espera a que termine). */
+  enMarcha: boolean;
+}
+
+function esDirectorio(ruta: string): boolean {
+  try {
+    return statSync(ruta).isDirectory();
+  } catch {
+    return false;
+  }
+}
+
+/** La linea de estado para el repo que contiene `cwd`. Vacia fuera de un repo con tareas. */
+export function leerEstado(cwd: string, ahoraMs: number = Date.now()): Lectura {
+  const g = ubicarGit(cwd);
+  if (g === null) return { linea: '', enMarcha: false };
+  const e = leerProgreso(cwd);
+  if (e !== null) {
+    const vivo = enMarcha(e);
+    return { linea: formatearEstado(e, ahoraMs, vivo && e.contador ? leerContador(cwd) : null), enMarcha: vivo };
+  }
+  const conTareas = esDirectorio(path.join(g.raiz, 'tareas')) || esDirectorio(path.join(g.raiz, '.taskcode'));
+  return { linea: conTareas ? NADA_EN_MARCHA : '', enMarcha: false };
+}
+
+/** El directorio que Claude Code pasa en el JSON de la status line, si existe. */
+export function directorioDeEntrada(texto: string): string | null {
+  try {
+    const j = JSON.parse(texto) as Record<string, unknown>;
+    const ws = j['workspace'];
+    const candidatos = [
+      typeof ws === 'object' && ws !== null ? (ws as Record<string, unknown>)['current_dir'] : undefined,
+      j['cwd'],
+    ];
+    for (const c of candidatos) if (typeof c === 'string' && c !== '' && existsSync(c)) return c;
+  } catch {
+    /* no es JSON: se usa el directorio actual */
+  }
+  return null;
+}
+
+function leerStdin(esperaMs: number): Promise<string> {
+  return new Promise((resolve) => {
+    const entrada = process.stdin;
+    let datos = '';
+    let hecho = false;
+    const fin = (): void => {
+      if (hecho) return;
+      hecho = true;
+      clearTimeout(t);
+      entrada.removeAllListeners('data');
+      entrada.removeAllListeners('end');
+      entrada.removeAllListeners('error');
+      entrada.destroy();
+      resolve(datos);
+    };
+    const t = setTimeout(fin, esperaMs);
+    entrada.setEncoding('utf8');
+    entrada.on('data', (d: string) => {
+      datos += d;
+      if (datos.length > 1_000_000) fin();
+    });
+    entrada.on('end', fin);
+    entrada.on('error', fin);
+  });
+}
+
+export interface OpcionesEstado {
+  cwd?: string;
+  salida?: NodeJS.WritableStream;
+  esTTY?: boolean;
+  env?: NodeJS.ProcessEnv;
+  intervaloMs?: number;
+}
+
+const dormir = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
+
+/** Punto de entrada (via rapida de bin/taskctl y respaldo de cli.ts). Devuelve el codigo de salida. */
+export async function mainEstado(argv: readonly string[], o: OpcionesEstado = {}): Promise<number> {
+  const salida = o.salida ?? process.stdout;
+  try {
+    rechazarFlagsDesconocidos(argv, FLAGS_ESTADO, 'estado', (m) => new Error(m));
+    const sobra = argv.find((a) => !a.startsWith('-'));
+    if (sobra !== undefined) throw new Error(`[ERROR] taskctl estado: no admite argumentos ("${sobra}"). Uso: taskctl estado [--seguir].`);
+  } catch (e: unknown) {
+    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
+    return 1;
+  }
+  let cwd = o.cwd ?? process.cwd();
+  if (argv.includes('--stdin') && process.stdin.isTTY !== true) {
+    cwd = directorioDeEntrada(await leerStdin(ESPERA_STDIN_MS)) ?? cwd;
+  }
+  const env = o.env ?? process.env;
+  const tty = o.esTTY ?? (process.stdout.isTTY === true);
+  const seguir = argv.includes('--seguir') && (tty || env[VARIABLE_SEGUIR_SIN_TTY] === '1');
+
+  let lectura = leerEstado(cwd);
+  if (!seguir || !lectura.enMarcha) {
+    if (lectura.linea !== '') salida.write(`${lectura.linea}\n`);
+    return 0;
+  }
+  // Con terminal se reescribe la misma linea; sin ella (solo tests), una por cambio.
+  const pintar = (linea: string): void => void salida.write(tty ? `\r\u001b[2K${linea}` : `${linea}\n`);
+  let ultima = lectura.linea;
+  pintar(ultima);
+  while (lectura.enMarcha) {
+    await dormir(o.intervaloMs ?? INTERVALO_MS);
+    lectura = leerEstado(cwd);
+    if (lectura.linea !== ultima) {
+      ultima = lectura.linea;
+      pintar(ultima);
+    }
+  }
+  if (tty) salida.write('\n');
+  return 0;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index 7f7c80e..fbabe9b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -89,6 +89,19 @@ export interface PuertaVerificacionOpts {
    * poner) la ejecuta como completa: un hotfix integra en la principal.
    */
   permitirSelectiva?: boolean;
+  /**
+   * TASK-110: el entorno del comando de verificacion (con TASKCTL_PROGRESO), que
+   * se pide justo antes de lanzarlo. Sin el, el del proceso.
+   */
+  entornoVerificacion?: () => NodeJS.ProcessEnv;
+}
+
+/** Las opciones de ejecucion del comando: el timeout de los tests y el entorno con el contador. */
+function opcionesEjecucion(o: PuertaVerificacionOpts): { timeoutMs?: number; env?: NodeJS.ProcessEnv } {
+  return {
+    ...(o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }),
+    ...(o.entornoVerificacion === undefined ? {} : { env: o.entornoVerificacion() }),
+  };
 }
 
 export type ResultadoPuerta =
@@ -190,7 +203,7 @@ export async function puertaVerificacion(
 
   const timeoutS = config.timeout_verificacion;
   const inicioMs = Date.now();
-  const r = ejecutarVerificacion(o.cwd, comando, timeoutS, o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs });
+  const r = ejecutarVerificacion(o.cwd, comando, timeoutS, opcionesEjecucion(o));
   // El memo solo con el arbol limpio: es la huella del commit que consulta el
   // guardian de merges; con el arbol sucio no la casaria nunca (MEN-3).
   const limpio = isWorkspaceClean(o.cwd);
@@ -237,12 +250,7 @@ async function puertaSoloDocumentacion(
   const c = { commit };
 
   if (decision.comando !== null) {
-    const r = ejecutarVerificacion(
-      o.cwd,
-      decision.comando,
-      timeoutS,
-      o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }
-    );
+    const r = ejecutarVerificacion(o.cwd, decision.comando, timeoutS, opcionesEjecucion(o));
     const limpio = isWorkspaceClean(o.cwd);
     const huella = limpio ? huellaDelArbol(o.cwd, decision.comando, timeoutS) : null;
     if (huella !== null) guardarMemo(o.cwd, huella, r, 'documentacion');
@@ -352,7 +360,7 @@ async function puertaSelectiva(
   const v = verificarConMemo(
     o.cwd,
     { tipo: 'selectiva', comando: decision.comando, timeoutS, base: ramaBase, memoSoloVerde: true },
-    o.timeoutMs === undefined ? {} : { timeoutMs: o.timeoutMs }
+    opcionesEjecucion(o)
   );
   if (v.resultado.estado !== 'verde') {
     throw new FinishCommandError(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index a23bbdd..7bf2f52 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -84,6 +84,7 @@ import {
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
+import { conProgreso, crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { extraerSinVerificacion, puertaVerificacion } from './finish-verificacion.js';
 import { puertaHeldout } from './finish-heldout.js';
@@ -279,8 +280,13 @@ export interface FinishCommandDeps {
   env?: NodeJS.ProcessEnv;
   /** TASK-085: directorio de configuracion de Claude Code (tests); por defecto CLAUDE_CONFIG_DIR o ~/.claude. */
   configDir?: string;
+  /** TASK-110: donde se escribe el progreso visible (por defecto, bajo el .git del repo). */
+  progreso?: Progreso;
 }
 
+/** TASK-110: los pasos de finish, declarados de antemano para que se sepa cuantos faltan. */
+export const PASOS_FINISH: readonly string[] = ['puertas', 'verificacion', 'cobertura', 'held-out', 'merge', 'artefactos'];
+
 export interface FinishCommandResult {
   id: string;
   rama: string;
@@ -320,6 +326,18 @@ export async function runFinishCommand(
   argv: readonly string[],
   today: string,
   deps: FinishCommandDeps
+): Promise<FinishCommandResult> {
+  // TASK-110: el progreso se marca terminado tambien si aborta.
+  const progreso = deps.progreso ?? crearProgreso(deps.repoCwd);
+  return conProgreso(progreso, () => runFinish(tareasRoot, argv, today, deps, progreso));
+}
+
+async function runFinish(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: FinishCommandDeps,
+  progreso: Progreso
 ): Promise<FinishCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_FINISH, 'finish', (m) => new FinishCommandError(m));
@@ -348,6 +366,8 @@ export async function runFinishCommand(
   }
   const ctxInicial = await buildTransitionContext(path.dirname(initial.filePath));
   assertTransitionAllowed('finish', initial.task, ctxInicial);
+  progreso.fase(initial.task.id, 'finish', PASOS_FINISH);
+  progreso.paso('puertas');
   // TASK-043 (D5 de la auditoria): avisar, sin bloquear, de criterios sin
   // marcar antes de mergear. No bloquea: hay criterios que se cumplen y no
   // se marcan, y el veredicto del revisor ya es la puerta dura.
@@ -463,6 +483,7 @@ export async function runFinishCommand(
   // en los caminos que van a integrar algo (abrir el MR o ejecutar el script).
   // TASK-073: y detras, la de los tests held-out (que --sin-verificacion no salta).
   const puerta = async () => {
+    progreso.paso('verificacion');
     const r = await puertaVerificacion({
       id,
       rama,
@@ -479,9 +500,12 @@ export async function runFinishCommand(
       ...(tipo === 'release' ? {} : { ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion }),
       // TASK-106: un hotfix integra en la principal: nunca la selectiva (si su camino de solo documentacion).
       permitirSelectiva: tipo !== 'hotfix',
+      // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
+      entornoVerificacion: () => entornoConContador(process.env, progreso.contador()),
     });
     // TASK-074: con el informe que la verificacion acaba de regenerar, y antes
     // de que el comando de held-out pueda reescribirlo.
+    progreso.paso('cobertura');
     puertaCobertura({
       id,
       ramaBase: tipo === 'hotfix' && mainBranch !== null ? mainBranch : ramaIntegracion,
@@ -489,6 +513,7 @@ export async function runFinishCommand(
       cwd: deps.repoCwd,
       ...(deps.onAviso === undefined ? {} : { onAviso: deps.onAviso }),
     });
+    progreso.paso('held-out');
     puertaHeldout({
       id,
       rama,
@@ -502,6 +527,7 @@ export async function runFinishCommand(
       cwd: deps.repoCwd,
       ...(deps.verificacionTimeoutMs === undefined ? {} : { timeoutMs: deps.verificacionTimeoutMs }),
     });
+    progreso.paso('merge');
     return r;
   };
 
@@ -533,6 +559,7 @@ export async function runFinishCommand(
   let commitParaTag: string | null = null;
   let tagLoPusoElScript = false;
 
+  if (integradaPorMergeRequest || (integradaEnDevelop && integradaEnMain)) progreso.paso('merge');
   if (integradaPorMergeRequest) {
     const integrado = (mrCtx as ContextoMergeRequest).estado as Extract<EstadoMergeRequest, { tipo: 'integrado' }>;
     commitParaTag = traerIntegracionDeLaPlataforma({
@@ -649,6 +676,7 @@ export async function runFinishCommand(
     }
   }
 
+  progreso.paso('artefactos');
   // Lectura FRESCA, ya en la rama de integracion con el merge consumado: la unica que
   // decide la escritura. El contexto de aprobacion se recalcula sobre
   // la carpeta que el merge dejo en ella.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index cbc428c..8e2899c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -35,6 +35,7 @@ import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../
 import { registrarTransicion } from '../core/transiciones.js';
 import { resolverConfig } from '../core/config.js';
 import { assertTransitionAllowed } from '../core/state-machine.js';
+import { conProgreso, crearProgreso, type Progreso } from '../fs/progreso.js';
 import { ensureBaseBranchReady, gitUserEmail, type BaseBranchGuardResult } from '../fs/git.js';
 import {
   autoCommit,
@@ -354,8 +355,13 @@ export interface PlanCommandDeps {
   dirParticion?: string;
   /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
   ahora?: string;
+  /** TASK-110: donde se escribe el progreso visible (por defecto, bajo el .git del repo). */
+  progreso?: Progreso;
 }
 
+/** TASK-110: los pasos de plan, declarados de antemano para que se sepa cuantos faltan. */
+export const PASOS_PLAN: readonly string[] = ['guardas', 'brainstorm', 'commit'];
+
 /**
  * TASK-044 (C3 de la auditoria): cuando la tarea es demasiado grande, la
  * particion propuesta (una tarea por frente, lista para `import`) o, si no
@@ -397,6 +403,18 @@ export async function runPlanCommand(
   argv: readonly string[],
   today: string,
   deps: PlanCommandDeps
+): Promise<PlanCommandResult> {
+  // TASK-110: el progreso se marca terminado tambien si aborta.
+  const progreso = deps.progreso ?? crearProgreso(deps.repoCwd);
+  return conProgreso(progreso, () => runPlan(tareasRoot, argv, today, deps, progreso));
+}
+
+async function runPlan(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: PlanCommandDeps,
+  progreso: Progreso
 ): Promise<PlanCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_PLAN, 'plan', (m) => new PlanCommandError(m));
@@ -437,6 +455,8 @@ export async function runPlanCommand(
   // vieja con la carpeta real de la rama base).
   const initial = await readTareaFile(tareasRoot, id);
   assertTransitionAllowed('plan', initial ? initial.task : null);
+  progreso.fase(initial!.task.id, 'plan', PASOS_PLAN);
+  progreso.paso('guardas');
 
   // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
   // tiene cambios sin commitear, o si no puede cambiar de forma
@@ -555,6 +575,7 @@ export async function runPlanCommand(
   // movido todavia y reintentar es posible, en vez de dejarla en
   // en-diseno sin plan. El rename de moveTareaFile se lleva despues
   // la subcarpeta entera.
+  progreso.paso('brainstorm');
   const taskDir = path.dirname(filePath);
   const ubicacion = await resolverPlanFinal(taskDir);
 
@@ -1028,6 +1049,7 @@ export async function runPlanCommand(
       )
     );
   }
+  progreso.paso('commit');
   // TASK-056: la fila de plan congela el modo de flujo del config en la tarea.
   const conRegistro = registrarTransicion(body, 'plan', deps.ahora ?? today, resolverConfig(deps.repoCwd).modo_flujo);
   const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
index fdd2fbb..a31b006 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts
@@ -76,6 +76,7 @@ import {
   mensajeChore,
   type AutoCommitResult,
 } from '../fs/git-commit.js';
+import { conProgreso, crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
 import { cargarCatalogoRevisores, clasificarPorDominio } from '../core/revisores.js';
 import { excluirDeRevision } from '../fs/revisores-rango.js';
@@ -129,8 +130,13 @@ export interface ReviewCommandDeps {
   env?: NodeJS.ProcessEnv;
   /** TASK-085: directorio de configuracion de Claude Code (tests); por defecto CLAUDE_CONFIG_DIR o ~/.claude. */
   configDir?: string;
+  /** TASK-110: donde se escribe el progreso visible (por defecto, bajo el .git del repo). */
+  progreso?: Progreso;
 }
 
+/** TASK-110: los pasos de review, declarados de antemano para que se sepa cuantos faltan. */
+export const PASOS_REVIEW: readonly string[] = ['guardas', 'integracion', 'verificacion', 'peticiones', 'commit'];
+
 /**
  * Un par peticion/informe de una ronda de revision, con el revisor al
  * que se le asigno (TASK-018). Con la ronda SIN fragmentar hay un unico
@@ -578,6 +584,18 @@ export async function runReviewCommand(
   argv: readonly string[],
   today: string,
   deps: ReviewCommandDeps
+): Promise<ReviewCommandResult> {
+  // TASK-110: el progreso se marca terminado tambien si aborta.
+  const progreso = deps.progreso ?? crearProgreso(deps.repoCwd);
+  return conProgreso(progreso, () => runReview(tareasRoot, argv, today, deps, progreso));
+}
+
+async function runReview(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: ReviewCommandDeps,
+  progreso: Progreso
 ): Promise<ReviewCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_REVIEW, 'review', (m) => new ReviewCommandError(m));
@@ -619,6 +637,8 @@ export async function runReviewCommand(
   }
   const tipo = initial!.task.tipo;
   const rama = initial!.task.rama;
+  progreso.fase(initial!.task.id, 'review', PASOS_REVIEW, previa === null ? {} : { ronda: previa.ronda + 1 });
+  progreso.paso('guardas');
 
   // Mismo motivo que en start: el prompt interactivo de Git-Flow con
   // stdin no interactivo cancela en silencio (EOF => "No" => exit 0).
@@ -630,6 +650,7 @@ export async function runReviewCommand(
     );
   }
 
+  progreso.paso('integracion');
   const scriptName = SCRIPT_BY_TYPE[tipo];
   // TASK-040: la ronda incremental no ejecuta el update (el merge de la
   // base entraria en el delta); exige estar ya en la rama de la tarea.
@@ -763,7 +784,11 @@ export async function runReviewCommand(
   // en curso y sin ronda a medias (decision de Carlos). En la primera ronda el
   // update de Git-Flow ya integro la base (y ese merge queda hecho); en una
   // incremental la rama no se actualiza (TASK-040). Sin la clave, nada.
-  const verificacion = verificacionDeRonda(id, configRama, baseBranch, tipo, incremental, deps, avisos);
+  progreso.paso('verificacion');
+  const verificacion = verificacionDeRonda(id, configRama, baseBranch, tipo, incremental, deps, avisos, () =>
+    // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
+    entornoConContador(deps.env ?? process.env, progreso.contador())
+  );
   // TASK-074: cobertura de las lineas cambiadas, desde la merge base SIEMPRE
   // (tambien en la ronda incremental: una linea sin cubrir de la ronda 1 que
   // nadie arreglo sigue ahi). Una vez por ronda y antes de escribir nada;
@@ -839,6 +864,7 @@ export async function runReviewCommand(
   const revisionDir = path.join(path.dirname(filePath), REVISION_DIRNAME);
   await mkdir(revisionDir, { recursive: true });
   const ronda = await siguienteRonda(revisionDir, RONDA_FILE_RE);
+  progreso.paso('peticiones', { ronda });
 
   // Un par de nombres (con o sin sufijo de dominio) por grupo del plan.
   // Sin fragmentar hay un unico grupo y se usa el nombre de siempre, sin
@@ -961,6 +987,7 @@ export async function runReviewCommand(
     );
   }
 
+  progreso.paso('commit');
   // TASK-085: el coste de implementacion que el hook fue anotando se suma
   // aqui, en el mismo fichero y commit que la transicion. Nunca aborta.
   const volcado = await volcarCosteAutomatico(updated, body, instanteDelVolcado(deps.ahora), {
@@ -1061,7 +1088,8 @@ function verificacionDeRonda(
   tipoTarea: Task['tipo'],
   incremental: boolean,
   deps: ReviewCommandDeps,
-  avisos: string[]
+  avisos: string[],
+  entornoVerificacion: () => NodeJS.ProcessEnv
 ): VerificacionRonda | null {
   const selectiva = config.comando_verificacion_selectiva;
   if (selectiva === null) return null;
@@ -1096,7 +1124,7 @@ function verificacionDeRonda(
     motivo !== null
       ? { tipo: 'documentacion', comando, timeoutS: plan.timeoutS }
       : { tipo: 'selectiva', comando, timeoutS: plan.timeoutS, base },
-    deps.env === undefined ? {} : { env: deps.env }
+    { env: entornoVerificacion() }
   );
   const nombre =
     motivo !== null
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index e08494a..d67e924 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -47,6 +47,7 @@ import {
   type AutoCommitResult,
 } from '../fs/git-commit.js';
 import { runGitflowScript } from '../fs/gitflow-runner.js';
+import { conProgreso, crearProgreso, type Progreso } from '../fs/progreso.js';
 
 export class StartCommandError extends Error {}
 
@@ -67,8 +68,13 @@ export interface StartCommandDeps {
   scriptsDir: string;
   /** TASK-052: instante UTC de la transicion para `## Transiciones` (`formatearInstante`). Sin el, la fila lleva solo `today`. */
   ahora?: string;
+  /** TASK-110: donde se escribe el progreso visible (por defecto, bajo el .git del repo). */
+  progreso?: Progreso;
 }
 
+/** TASK-110: los pasos de start, declarados de antemano para que se sepa cuantos faltan. */
+export const PASOS_START: readonly string[] = ['guardas', 'rama', 'commit'];
+
 export interface StartCommandResult {
   id: string;
   rama: string;
@@ -92,6 +98,18 @@ export async function runStartCommand(
   argv: readonly string[],
   today: string,
   deps: StartCommandDeps
+): Promise<StartCommandResult> {
+  // TASK-110: el progreso se marca terminado tambien si aborta.
+  const progreso = deps.progreso ?? crearProgreso(deps.repoCwd);
+  return conProgreso(progreso, () => runStart(tareasRoot, argv, today, deps, progreso));
+}
+
+async function runStart(
+  tareasRoot: string,
+  argv: readonly string[],
+  today: string,
+  deps: StartCommandDeps,
+  progreso: Progreso
 ): Promise<StartCommandResult> {
   // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
   rechazarFlagsDesconocidos(argv, FLAGS_START, 'start', (m) => new StartCommandError(m));
@@ -122,6 +140,8 @@ export async function runStartCommand(
   // nada.
   assertTransitionAllowed('start', existing ? existing.task : null);
   const { task, body, filePath } = existing as NonNullable<typeof existing>;
+  progreso.fase(task.id, 'start', PASOS_START);
+  progreso.paso('guardas');
 
   // Precondicion minima (ver cabecera del fichero): workspace limpio
   // ANTES de invocar el script, para no depender de su prompt
@@ -250,6 +270,7 @@ export async function runStartCommand(
     );
   }
 
+  progreso.paso('rama');
   const scriptName = SCRIPT_BY_TYPE[task.tipo];
   // La rama va primero: los scripts toman como nombre el primer no-flag.
   const scriptArgs = [task.rama, ...gitflowBaseArgs(task.tipo, deps.repoCwd)];
@@ -280,6 +301,7 @@ export async function runStartCommand(
   // las dos copias diverjan: se comprueba el limite de la MISMA
   // persona que se acaba escribiendo en el frontmatter.
   const asignadoCambiado = asignadoFinal !== task.asignado_a;
+  progreso.paso('commit');
 
   const updated: Task = {
     ...task,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
new file mode 100644
index 0000000..6dfab4a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/progreso.ts
@@ -0,0 +1,174 @@
+/**
+ * Progreso visible de la fase en curso (TASK-110). Contrato del fichero de
+ * progreso que escriben plan, approve, start, review, finish y el freno Stop, y
+ * la linea que lo muestra (`taskctl estado`, la status line de Claude Code).
+ * Puro: no toca disco ni lanza procesos.
+ *
+ * La linea dice lo que falta en dos niveles: la fase dentro del ciclo de la
+ * tarea y, dentro de la fase, el paso con su posicion; si el comando de
+ * verificacion escribe un contador, tambien su x/N. Por ejemplo:
+ *
+ *   TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min
+ *
+ * Es una interfaz publica (la status line de la persona la muestra tal cual):
+ * cambiar el separador o el formato de los minutos rompe en silencio, por eso
+ * el fichero lleva `version` y el formato tiene un unico test que lo fija.
+ *
+ * Lectura tolerante: el fichero vive bajo `.git/`, pero lo que se muestra
+ * acaba pintado en la barra de Claude Code, asi que todo texto pasa por
+ * `limpiarTexto` (sin secuencias ANSI ni caracteres de control, recortado).
+ */
+
+export const VERSION_PROGRESO = 1;
+
+/** Las fases del ciclo de una tarea, en orden: la linea dice en cual va (`review (4/5)`). */
+export const FASES_CICLO = ['plan', 'approve', 'start', 'review', 'finish'] as const;
+export type FaseCiclo = (typeof FASES_CICLO)[number];
+/** `freno`: el freno de fin de turno, que no es una fase del ciclo (va sin posicion). */
+export type FaseProgreso = FaseCiclo | 'freno';
+export type ResultadoFase = 'ok' | 'abortada';
+
+export interface EstadoProgreso {
+  version: number;
+  tarea: string;
+  fase: string;
+  /** Los pasos de la fase, declarados de antemano para que se sepa cuantos faltan. */
+  pasos: string[];
+  /** El paso en marcha (uno de `pasos`), o null antes del primero. */
+  paso: string | null;
+  ronda: number | null;
+  /** Instante de inicio de la fase, en ms desde epoch. */
+  inicio: number;
+  /** true si el paso en marcha tiene un contador x/N (el del comando de verificacion). */
+  contador: boolean;
+  terminado: boolean;
+  resultado: ResultadoFase | null;
+  /** Instante en que termino, en ms desde epoch. */
+  fin: number | null;
+}
+
+export interface Contador {
+  x: number;
+  n: number;
+}
+
+/** Lo que dice la linea cuando no hay nada en marcha en un proyecto con tareas. */
+export const NADA_EN_MARCHA = 'Nada en marcha.';
+
+const SEPARADOR = ' · ';
+const MAX_CAMPO = 40;
+const MAX_PASOS = 20;
+export const MAX_LINEA = 160;
+
+const ANSI_CSI = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;
+const ANSI_OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/g;
+// Control C0 y C1, separadores de linea y marcas de direccion (podrian reordenar la barra).
+const CONTROL = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g;
+
+/** Recorta a `max` caracteres (por puntos de codigo), con `…` si sobra. */
+export function recortar(texto: string, max: number): string {
+  const cps = Array.from(texto);
+  return cps.length <= max ? texto : `${cps.slice(0, Math.max(0, max - 1)).join('')}…`;
+}
+
+/** Texto apto para la barra: sin ANSI ni control, espacios colapsados, recortado. null si no es texto o queda vacio. */
+export function limpiarTexto(valor: unknown, max: number = MAX_CAMPO): string | null {
+  if (typeof valor !== 'string') return null;
+  const limpio = valor.replace(ANSI_CSI, '').replace(ANSI_OSC, '').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
+  return limpio === '' ? null : recortar(limpio, max);
+}
+
+const entero = (v: unknown): number | null =>
+  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null;
+
+/**
+ * El estado del fichero, o null si no es un progreso de esta version (ilegible,
+ * sin tarea, sin fase o sin inicio). Lo que sobra o viene mal se ignora.
+ */
+export function validarProgreso(json: unknown): EstadoProgreso | null {
+  if (typeof json !== 'object' || json === null || Array.isArray(json)) return null;
+  const o = json as Record<string, unknown>;
+  if (o['version'] !== VERSION_PROGRESO) return null;
+  const tarea = limpiarTexto(o['tarea'], 20);
+  const fase = limpiarTexto(o['fase'], 20);
+  const inicio = entero(o['inicio']);
+  if (tarea === null || fase === null || inicio === null) return null;
+  const pasos = Array.isArray(o['pasos'])
+    ? o['pasos']
+        .slice(0, MAX_PASOS)
+        .map((p) => limpiarTexto(p))
+        .filter((p): p is string => p !== null)
+    : [];
+  const resultado = o['resultado'] === 'ok' || o['resultado'] === 'abortada' ? o['resultado'] : null;
+  return {
+    version: VERSION_PROGRESO,
+    tarea,
+    fase,
+    pasos,
+    paso: limpiarTexto(o['paso']),
+    ronda: entero(o['ronda']),
+    inicio,
+    contador: o['contador'] === true,
+    terminado: o['terminado'] === true,
+    resultado,
+    fin: entero(o['fin']),
+  };
+}
+
+/**
+ * El x/N que el comando de verificacion dejo en su fichero: el ultimo `x/N` de
+ * la ultima linea con texto. Cualquier otra cosa (JSON, ANSI, texto) se ignora;
+ * solo se muestran los numeros, asi que nada ajeno llega a la barra.
+ */
+export function parsearContador(texto: string): Contador | null {
+  const lineas = texto.split(/\r?\n|\r/).filter((l) => l.trim() !== '');
+  const ultima = lineas[lineas.length - 1];
+  if (ultima === undefined) return null;
+  const todos = [...ultima.matchAll(/(\d{1,9})\s*\/\s*(\d{1,9})/g)];
+  const m = todos[todos.length - 1];
+  if (m === undefined) return null;
+  const x = Number(m[1]);
+  const n = Number(m[2]);
+  return n > 0 ? { x, n } : null;
+}
+
+/** Minutos enteros transcurridos (nunca negativos: un reloj que retrocede da 0). */
+export function minutosDesde(inicioMs: number, ahoraMs: number): number {
+  return Math.max(0, Math.floor((ahoraMs - inicioMs) / 60_000));
+}
+
+/** `review (4/5)` para una fase del ciclo; el nombre a secas para las demas. */
+export function etiquetaFase(fase: string): string {
+  const i = (FASES_CICLO as readonly string[]).indexOf(fase);
+  return i === -1 ? fase : `${fase} (${String(i + 1)}/${String(FASES_CICLO.length)})`;
+}
+
+/** true si la fase sigue en marcha (no ha marcado su final). */
+export function enMarcha(e: EstadoProgreso): boolean {
+  return !e.terminado;
+}
+
+/**
+ * La linea de estado. En marcha: `TASK-NNN · <fase> (i/5) [· ronda R] · <paso> (j/M) [x/N] · <mm> min`.
+ * Terminada: `Nada en marcha · ultima: TASK-NNN · <fase> (i/5) · terminada hace <mm> min`.
+ */
+export function formatearEstado(e: EstadoProgreso, ahoraMs: number, contador: Contador | null): string {
+  if (e.terminado) {
+    const como = e.resultado === 'abortada' ? 'abortada' : 'terminada';
+    const hace = minutosDesde(e.fin ?? e.inicio, ahoraMs);
+    return recortar(
+      ['Nada en marcha', `ultima: ${e.tarea}`, etiquetaFase(e.fase), `${como} hace ${String(hace)} min`].join(SEPARADOR),
+      MAX_LINEA
+    );
+  }
+  const partes = [e.tarea, etiquetaFase(e.fase)];
+  if (e.ronda !== null) partes.push(`ronda ${String(e.ronda)}`);
+  if (e.paso !== null) {
+    const i = e.pasos.indexOf(e.paso);
+    let paso = i === -1 ? e.paso : `${e.paso} (${String(i + 1)}/${String(e.pasos.length)})`;
+    if (e.contador && contador !== null) paso += ` ${String(contador.x)}/${String(contador.n)}`;
+    partes.push(paso);
+  }
+  partes.push(`${String(minutosDesde(e.inicio, ahoraMs))} min`);
+  return recortar(partes.join(SEPARADOR), MAX_LINEA);
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts
new file mode 100644
index 0000000..f82d226
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/progreso.ts
@@ -0,0 +1,247 @@
+/**
+ * Lectura y escritura del progreso visible (TASK-110). El fichero vive en
+ * `<git-dir>/taskcode/progreso.json`, FUERA del arbol de trabajo: dentro
+ * cambiaria la huella de la verificacion (`huellaDelArbol`) y `review`
+ * abortaria por `cambioElArbol`.
+ *
+ * SIN GIT: la ruta se resuelve subiendo desde el directorio hasta encontrar
+ * `.git`; si es un fichero (worktree enlazado, submodulo) se sigue su linea
+ * `gitdir:`. La usan quien escribe y quien lee: si uno resolviera con
+ * `git rev-parse` y el otro a mano, en un worktree acabarian en sitios
+ * distintos y `estado` diria "nada en marcha" con la verificacion corriendo.
+ * Coincide con `git rev-parse --git-path taskcode/...`, que es por worktree.
+ *
+ * NUNCA LANZA NI IMPRIME: escribir el progreso es cosmetico y va dentro del
+ * camino critico de finish, review y el freno Stop. Un EPERM/EBUSY del rename
+ * en Windows (la status line leyendo, un antivirus) pierde ese tic y nada
+ * mas: sin reintentos, sin excepcion, sin salida (lo que se imprime lo lee el
+ * agente y cuesta tokens).
+ */
+import { closeSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
+import path from 'node:path';
+import {
+  VERSION_PROGRESO,
+  parsearContador,
+  validarProgreso,
+  type Contador,
+  type EstadoProgreso,
+  type FaseProgreso,
+  type ResultadoFase,
+} from '../core/progreso.js';
+
+/** Variable de entorno con la ruta del contador que recibe el comando de verificacion. Nombre neutro: la leen proyectos ajenos. */
+export const VARIABLE_PROGRESO = 'TASKCTL_PROGRESO';
+
+const FICHERO_PROGRESO = 'progreso.json';
+const FICHERO_CONTADOR = 'progreso-contador';
+/** Lo que se lee, como mucho, del final del contador: lo escribe un script ajeno. */
+const BYTES_CONTADOR = 4096;
+
+export interface UbicacionGit {
+  /** Raiz del arbol de trabajo (donde esta `.git`). */
+  raiz: string;
+  /** Directorio de git de ese arbol (el de su worktree, si es uno enlazado). */
+  gitDir: string;
+}
+
+/** El `.git` mas cercano subiendo desde `desde`, sin lanzar git. null fuera de un repo. */
+export function ubicarGit(desde: string): UbicacionGit | null {
+  let dir = path.resolve(desde);
+  for (;;) {
+    const candidato = path.join(dir, '.git');
+    let esDir = false;
+    let esFichero = false;
+    try {
+      const st = statSync(candidato);
+      esDir = st.isDirectory();
+      esFichero = st.isFile();
+    } catch {
+      /* no esta aqui: se sube */
+    }
+    if (esDir) return { raiz: dir, gitDir: candidato };
+    if (esFichero) {
+      try {
+        const m = /^gitdir:\s*(.+?)\s*$/m.exec(readFileSync(candidato, 'utf8'));
+        return m?.[1] === undefined ? null : { raiz: dir, gitDir: path.resolve(dir, m[1]) };
+      } catch {
+        return null;
+      }
+    }
+    const padre = path.dirname(dir);
+    if (padre === dir) return null;
+    dir = padre;
+  }
+}
+
+/** `<git-dir>/taskcode`, o null fuera de un repo. */
+export function dirProgreso(desde: string): string | null {
+  const g = ubicarGit(desde);
+  return g === null ? null : path.join(g.gitDir, 'taskcode');
+}
+
+export function rutaProgreso(desde: string): string | null {
+  const d = dirProgreso(desde);
+  return d === null ? null : path.join(d, FICHERO_PROGRESO);
+}
+
+export function rutaContador(desde: string): string | null {
+  const d = dirProgreso(desde);
+  return d === null ? null : path.join(d, FICHERO_CONTADOR);
+}
+
+/** El progreso guardado, o null si no hay (o no es legible: se trata como ausente). */
+export function leerProgreso(desde: string): EstadoProgreso | null {
+  const ruta = rutaProgreso(desde);
+  if (ruta === null) return null;
+  try {
+    return validarProgreso(JSON.parse(readFileSync(ruta, 'utf8')) as unknown);
+  } catch {
+    return null;
+  }
+}
+
+/** El x/N del contador, leyendo como mucho sus ultimos 4 KB. null si no hay o no dice nada util. */
+export function leerContador(desde: string): Contador | null {
+  const ruta = rutaContador(desde);
+  if (ruta === null) return null;
+  let fd: number | null = null;
+  try {
+    fd = openSync(ruta, 'r');
+    const tam = fstatSync(fd).size;
+    const n = Math.min(tam, BYTES_CONTADOR);
+    const buf = Buffer.alloc(n);
+    readSync(fd, buf, 0, n, tam - n);
+    return parsearContador(buf.toString('utf8'));
+  } catch {
+    return null;
+  } finally {
+    if (fd !== null) {
+      try {
+        closeSync(fd);
+      } catch {
+        /* nada */
+      }
+    }
+  }
+}
+
+/** Escribe con tmp+rename. Nunca lanza: devuelve false si no pudo. */
+export function escribirAtomico(ruta: string, texto: string): boolean {
+  const tmp = `${ruta}.${String(process.pid)}.tmp`;
+  try {
+    mkdirSync(path.dirname(ruta), { recursive: true });
+    writeFileSync(tmp, texto, 'utf8');
+    renameSync(tmp, ruta);
+    return true;
+  } catch {
+    try {
+      unlinkSync(tmp);
+    } catch {
+      /* nada */
+    }
+    return false;
+  }
+}
+
+export interface Progreso {
+  /** Empieza una fase de una tarea, con sus pasos declarados de antemano. */
+  fase(tarea: string, fase: FaseProgreso, pasos: readonly string[], extra?: { ronda?: number }): void;
+  /** Pasa al paso `nombre` (uno de los declarados). */
+  paso(nombre: string, extra?: { ronda?: number }): void;
+  /**
+   * Prepara el contador del paso en marcha y devuelve su ruta (la que recibe
+   * el comando de verificacion en TASKCTL_PROGRESO), vacio. null si no hay
+   * fase empezada o no hay sitio donde escribirlo.
+   */
+  contador(): string | null;
+  /** Marca el final de la fase (tambien cuando aborta). Solo si se empezo. */
+  terminar(resultado: ResultadoFase): void;
+}
+
+/** El que no hace nada. */
+export const SIN_PROGRESO: Progreso = Object.freeze({
+  fase: () => undefined,
+  paso: () => undefined,
+  contador: () => null,
+  terminar: () => undefined,
+});
+
+export interface OpcionesProgreso {
+  /** Reloj en ms (por defecto Date.now). */
+  reloj?: () => number;
+}
+
+/** El escritor real, sobre el repo que contiene `desde`. Fuera de un repo, no hace nada. */
+export function crearProgreso(desde: string, opciones: OpcionesProgreso = {}): Progreso {
+  const ruta = rutaProgreso(desde);
+  const rutaCont = rutaContador(desde);
+  if (ruta === null || rutaCont === null) return SIN_PROGRESO;
+  const reloj = opciones.reloj ?? Date.now;
+  let estado: EstadoProgreso | null = null;
+  const guardar = (): void => {
+    if (estado !== null) escribirAtomico(ruta, `${JSON.stringify(estado)}\n`);
+  };
+  return {
+    fase(tarea, fase, pasos, extra = {}) {
+      estado = {
+        version: VERSION_PROGRESO,
+        tarea,
+        fase,
+        pasos: [...pasos],
+        paso: null,
+        ronda: extra.ronda ?? null,
+        inicio: reloj(),
+        contador: false,
+        terminado: false,
+        resultado: null,
+        fin: null,
+      };
+      guardar();
+    },
+    paso(nombre, extra = {}) {
+      if (estado === null) return;
+      estado = { ...estado, paso: nombre, contador: false, ...(extra.ronda === undefined ? {} : { ronda: extra.ronda }) };
+      guardar();
+    },
+    contador() {
+      if (estado === null) return null;
+      // Vacio antes de lanzar el comando: un x/N de la ejecucion anterior no se muestra.
+      if (!escribirAtomico(rutaCont, '')) return null;
+      estado = { ...estado, contador: true };
+      guardar();
+      return rutaCont;
+    },
+    terminar(resultado) {
+      if (estado === null || estado.terminado) return;
+      estado = { ...estado, contador: false, terminado: true, resultado, fin: reloj() };
+      guardar();
+    },
+  };
+}
+
+/**
+ * Ejecuta `fn` y marca el final de la fase pase lo que pase: `ok` si termina,
+ * `abortada` si lanza (y relanza). Lo que no cubre es la muerte del proceso.
+ */
+export async function conProgreso<T>(progreso: Progreso, fn: () => Promise<T>): Promise<T> {
+  try {
+    const r = await fn();
+    progreso.terminar('ok');
+    return r;
+  } catch (e: unknown) {
+    progreso.terminar('abortada');
+    throw e;
+  }
+}
+
+/**
+ * El entorno del comando de verificacion: el de `base` sin ningun
+ * TASKCTL_PROGRESO heredado y, si hay contador, con el suyo. Solo ese comando
+ * lo recibe.
+ */
+export function entornoConContador(base: NodeJS.ProcessEnv, rutaCont: string | null): NodeJS.ProcessEnv {
+  const env: NodeJS.ProcessEnv = { ...base };
+  delete env[VARIABLE_PROGRESO];
+  if (rutaCont !== null) env[VARIABLE_PROGRESO] = rutaCont;
+  return env;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts
new file mode 100644
index 0000000..90e42bb
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/status-line.ts
@@ -0,0 +1,309 @@
+/**
+ * La status line de Claude Code que muestra `taskctl estado` (TASK-110). Un
+ * plugin no puede declararla: solo se configura con la clave `statusLine` de
+ * un `settings.json`. Se instala UNA vez, en el de usuario
+ * (`<config>/settings.json`), y vale para todos los proyectos: fuera de uno
+ * con tareas, `taskctl estado` no imprime nada.
+ *
+ * Es la primera escritura de taskctl en un fichero de Claude Code, asi que:
+ *
+ * - Solo con un flag explicito de doctor; sin el, solo se mira.
+ * - Se conservan las demas claves (se lee, se cambia `statusLine` y nada mas).
+ * - Una `statusLine` ajena no se sustituye sin un flag aparte, y entonces su
+ *   valor se guarda para que desinstalar la devuelva.
+ * - Copia del fichero antes de tocarlo, y escritura con tmp+rename (Claude
+ *   Code puede estar reescribiendo el mismo fichero: la ventana es minima).
+ * - Idempotente: si ya esta, no se escribe.
+ * - El comando es `taskctl` por el PATH si esta en el PATH del sistema. Si
+ *   solo esta en la carpeta del plugin (la cache que Claude Code anade al
+ *   PATH de su herramienta Bash, que la status line no tiene por que ver),
+ *   decision de la persona (2026-11-12): se usa esa ruta, con `node` y la
+ *   ruta absoluta del script. Como lleva la version del plugin, volver a
+ *   pedir la instalacion tras actualizar la reescribe con la ruta nueva.
+ */
+import { spawnSync } from 'node:child_process';
+import { accessSync, constants, copyFileSync, existsSync, readFileSync, statSync, unlinkSync } from 'node:fs';
+import path from 'node:path';
+import { esObjeto, leerJson } from './json-claude.js';
+import { escribirAtomico } from './progreso.js';
+
+/** Lo que ejecuta la status line. `--stdin`: toma el directorio del JSON que le pasa Claude Code. */
+export const COMANDO_STATUS_LINE = 'taskctl estado --stdin';
+/** Donde se guarda la status line ajena que se sustituyo, para devolverla al desinstalar. */
+export const FICHERO_PREVIA = 'statusline-previa-taskctl.json';
+
+export type SondeoStatusLine =
+  | { estado: 'ausente'; ruta: string }
+  | { estado: 'nuestra'; ruta: string; comando: string }
+  | { estado: 'ajena'; ruta: string; comando: string }
+  | { estado: 'ilegible'; ruta: string; motivo: string };
+
+export function rutaSettingsUsuario(configDir: string): string {
+  return path.join(configDir, 'settings.json');
+}
+
+/** El comando con el script de la cache del plugin: `node "<ruta>" estado --stdin` (barras normales). */
+export function comandoDesdePlugin(script: string): string {
+  return `node "${script.replace(/\\/g, '/')}" estado --stdin`;
+}
+
+/**
+ * true si la `statusLine` es la que instala doctor: un `taskctl estado` por el
+ * PATH, o `node "<...>/taskctl" estado` con la ruta de la cache, con o sin flags.
+ */
+export function esNuestra(statusLine: unknown): boolean {
+  return (
+    esObjeto(statusLine) &&
+    statusLine['type'] === 'command' &&
+    typeof statusLine['command'] === 'string' &&
+    /^\s*(?:taskctl(?:\.cmd)?|node\s+"[^"]*[\\/]taskctl")\s+estado(?:\s|$)/.test(statusLine['command'])
+  );
+}
+
+/** true si `node <script> estado --stdin` sale con 0 (un taskctl anterior a `estado` sale con 1). */
+export function entiendeEstado(script: string): boolean {
+  const r = spawnSync(process.execPath, [script, 'estado', '--stdin'], {
+    input: '{}',
+    encoding: 'utf8',
+    timeout: 10_000,
+    windowsHide: true,
+  });
+  return r.status === 0;
+}
+
+function comandoActual(statusLine: unknown): string | null {
+  return esObjeto(statusLine) && typeof statusLine['command'] === 'string' ? statusLine['command'] : null;
+}
+
+function describir(statusLine: unknown): string {
+  if (esObjeto(statusLine) && typeof statusLine['command'] === 'string') return statusLine['command'];
+  return JSON.stringify(statusLine) ?? String(statusLine);
+}
+
+export function sondearStatusLine(configDir: string): SondeoStatusLine {
+  const ruta = rutaSettingsUsuario(configDir);
+  const l = leerJson(ruta);
+  if (l.estado === 'ausente') return { estado: 'ausente', ruta };
+  if (l.estado === 'ilegible') return { estado: 'ilegible', ruta, motivo: l.motivo };
+  if (!esObjeto(l.json)) return { estado: 'ilegible', ruta, motivo: 'no es un objeto JSON' };
+  const sl = l.json['statusLine'];
+  if (sl === undefined || sl === null) return { estado: 'ausente', ruta };
+  if (esNuestra(sl)) return { estado: 'nuestra', ruta, comando: comandoActual(sl) ?? COMANDO_STATUS_LINE };
+  return { estado: 'ajena', ruta, comando: describir(sl) };
+}
+
+/** Una variable del entorno sin distinguir mayusculas (en Windows es `Path`, `PATH`...). */
+function variable(env: NodeJS.ProcessEnv, nombre: string): string | undefined {
+  const clave = Object.keys(env).find((k) => k.toUpperCase() === nombre);
+  return clave === undefined ? undefined : env[clave];
+}
+
+function dentroDe(ruta: string, dir: string): boolean {
+  const rel = path.relative(path.resolve(dir), path.resolve(ruta));
+  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
+}
+
+export interface BusquedaTaskctl {
+  /** El primero que la status line encontraria, fuera de la cache del plugin. */
+  ruta: string | null;
+  /** true si solo aparece en la carpeta del plugin dentro de `<config>/plugins/`. */
+  soloEnPlugin: boolean;
+  /** El script `taskctl` (sin extension, se lanza con node) de la primera carpeta del plugin que lo tiene, o null. */
+  scriptPlugin: string | null;
+}
+
+/** Busca `taskctl` en el PATH de `env`, sin lanzar nada. */
+export function buscarTaskctl(env: NodeJS.ProcessEnv, configDir: string): BusquedaTaskctl {
+  const win = process.platform === 'win32';
+  const exts = win ? ['', ...(variable(env, 'PATHEXT') ?? '.COM;.EXE;.BAT;.CMD').split(';').filter((e) => e !== '')] : [''];
+  const plugins = path.join(configDir, 'plugins');
+  let soloEnPlugin = false;
+  let scriptPlugin: string | null = null;
+  for (const dir of (variable(env, 'PATH') ?? '').split(path.delimiter)) {
+    if (dir.trim() === '') continue;
+    for (const ext of exts) {
+      const candidato = path.join(dir, `taskctl${ext.toLowerCase()}`);
+      try {
+        if (!statSync(candidato).isFile()) continue;
+        if (!win) accessSync(candidato, constants.X_OK);
+      } catch {
+        continue;
+      }
+      if (dentroDe(candidato, plugins)) {
+        soloEnPlugin = true;
+        if (scriptPlugin === null) {
+          const script = path.join(dir, 'taskctl');
+          try {
+            if (statSync(script).isFile()) scriptPlugin = script;
+          } catch {
+            /* esa carpeta no trae el script de node: se sigue buscando */
+          }
+        }
+        continue;
+      }
+      return { ruta: candidato, soloEnPlugin: false, scriptPlugin: null };
+    }
+  }
+  return { ruta: null, soloEnPlugin, scriptPlugin };
+}
+
+export type ResultadoAccion =
+  | { tipo: 'hecho'; mensaje: string }
+  | { tipo: 'nada'; mensaje: string }
+  | { tipo: 'rechazado'; mensaje: string; arreglo: string };
+
+function sello(ahora: Date): string {
+  return ahora.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
+}
+
+/** Copia del settings.json antes de cambiarlo; devuelve su ruta (o null si no habia fichero). */
+function copiaDeSeguridad(ruta: string, ahora: Date): string | null {
+  if (!existsSync(ruta)) return null;
+  const copia = `${ruta}.${sello(ahora)}.bak`;
+  copyFileSync(ruta, copia);
+  return copia;
+}
+
+function leerObjeto(ruta: string): Record<string, unknown> {
+  if (!existsSync(ruta)) return {};
+  const json = JSON.parse(readFileSync(ruta, 'utf8').replace(/^\uFEFF/, '')) as unknown;
+  if (!esObjeto(json)) throw new Error('no es un objeto JSON');
+  return json;
+}
+
+function escribir(ruta: string, obj: Record<string, unknown>): boolean {
+  return escribirAtomico(ruta, `${JSON.stringify(obj, null, 2)}\n`);
+}
+
+export interface OpcionesInstalar {
+  reemplazar: boolean;
+  env: NodeJS.ProcessEnv;
+  ahora: Date;
+}
+
+const ARREGLO_PATH =
+  'Pon taskctl en el PATH de tu sistema (no la carpeta de la version del plugin, que cambia con cada ' +
+  'actualizacion: un envoltorio que elija la version instalada mas alta, como el de "Usar taskctl fuera ' +
+  'de Claude Code" en el README del plugin), abre una terminal nueva y repite con --instalar-status-line.';
+
+export function instalarStatusLine(configDir: string, o: OpcionesInstalar): ResultadoAccion {
+  const s = sondearStatusLine(configDir);
+  if (s.estado === 'ilegible') {
+    return {
+      tipo: 'rechazado',
+      mensaje: `no se instala: ${s.ruta} no se puede leer (${s.motivo})`,
+      arreglo: `Corrige ${s.ruta} (JSON valido) y repite; no se ha tocado.`,
+    };
+  }
+  if (s.estado === 'ajena' && !o.reemplazar) {
+    return {
+      tipo: 'rechazado',
+      mensaje: `no se instala: ${s.ruta} ya tiene otra status line ("${s.comando}") y no se sustituye sin pedirlo`,
+      arreglo:
+        'Para sustituirla (se guarda copia y desinstalar la devuelve): taskctl doctor --instalar-status-line ' +
+        '--reemplazar-status-line',
+    };
+  }
+  const t = buscarTaskctl(o.env, configDir);
+  const comando = t.ruta !== null ? COMANDO_STATUS_LINE : t.scriptPlugin !== null ? comandoDesdePlugin(t.scriptPlugin) : null;
+  if (comando === null) {
+    return {
+      tipo: 'rechazado',
+      mensaje: t.soloEnPlugin
+        ? 'no se instala: taskctl solo esta en la carpeta del plugin y alli no esta su script de node'
+        : 'no se instala: taskctl no esta en el PATH, y la status line lo ejecuta por su nombre',
+      arreglo: ARREGLO_PATH,
+    };
+  }
+  // La copia de la cache es la del plugin INSTALADO, que puede ser anterior a `estado`
+  // (pasa al instalar desde una copia de desarrollo): se prueba antes de escribir nada.
+  if (t.ruta === null && t.scriptPlugin !== null && !entiendeEstado(t.scriptPlugin)) {
+    return {
+      tipo: 'rechazado',
+      mensaje:
+        `no se instala: el taskctl del plugin instalado (${t.scriptPlugin}) no entiende "estado --stdin"; ` +
+        'la barra mostraria un error en cada refresco',
+      arreglo: 'Actualiza el plugin a una version con "taskctl estado" y repite --instalar-status-line.',
+    };
+  }
+  if (s.estado === 'nuestra' && s.comando === comando) {
+    return { tipo: 'nada', mensaje: `ya estaba instalada en ${s.ruta} (${comando})` };
+  }
+  const desdeCache =
+    t.ruta === null
+      ? '; usa la copia de la cache del plugin, que lleva su version: tras actualizar el plugin, repite ' +
+        '--instalar-status-line para que apunte a la nueva'
+      : '';
+  try {
+    const obj = leerObjeto(s.ruta);
+    const copia = copiaDeSeguridad(s.ruta, o.ahora);
+    if (s.estado === 'ajena') {
+      if (!escribirAtomico(path.join(configDir, FICHERO_PREVIA), `${JSON.stringify({ statusLine: obj['statusLine'] }, null, 2)}\n`)) {
+        throw new Error('no se pudo guardar la status line anterior');
+      }
+    }
+    obj['statusLine'] = { type: 'command', command: comando };
+    if (!escribir(s.ruta, obj)) throw new Error(`no se pudo escribir ${s.ruta}`);
+    return {
+      tipo: 'hecho',
+      mensaje:
+        (s.estado === 'nuestra' ? `actualizada en ${s.ruta} (${comando}; antes "${s.comando}"` : `instalada en ${s.ruta} (${comando}`) +
+        `; taskctl en ${t.ruta ?? t.scriptPlugin ?? ''})` +
+        desdeCache +
+        (copia === null ? '' : `; copia previa en ${copia}`) +
+        (s.estado === 'ajena' ? `; la anterior ("${s.comando}") vuelve al desinstalar` : '') +
+        '. Se ve en la proxima sesion de Claude Code',
+    };
+  } catch (e: unknown) {
+    return {
+      tipo: 'rechazado',
+      mensaje: `no se pudo instalar: ${e instanceof Error ? e.message : String(e)}`,
+      arreglo: `Revisa que ${s.ruta} se pueda leer y escribir, y repite.`,
+    };
+  }
+}
+
+export function desinstalarStatusLine(configDir: string, ahora: Date): ResultadoAccion {
+  const s = sondearStatusLine(configDir);
+  if (s.estado === 'ausente') return { tipo: 'nada', mensaje: `no habia ninguna status line en ${s.ruta}` };
+  if (s.estado === 'ajena') {
+    return { tipo: 'nada', mensaje: `la status line de ${s.ruta} no es la de taskctl ("${s.comando}"): no se toca` };
+  }
+  if (s.estado === 'ilegible') {
+    return {
+      tipo: 'rechazado',
+      mensaje: `no se desinstala: ${s.ruta} no se puede leer (${s.motivo})`,
+      arreglo: `Corrige ${s.ruta} (JSON valido) y repite; no se ha tocado.`,
+    };
+  }
+  try {
+    const obj = leerObjeto(s.ruta);
+    const rutaPrevia = path.join(configDir, FICHERO_PREVIA);
+    const previa = leerJson(rutaPrevia);
+    const devuelta = previa.estado === 'ok' && esObjeto(previa.json) ? previa.json['statusLine'] : undefined;
+    const copia = copiaDeSeguridad(s.ruta, ahora);
+    if (devuelta === undefined || devuelta === null) delete obj['statusLine'];
+    else obj['statusLine'] = devuelta;
+    if (!escribir(s.ruta, obj)) throw new Error(`no se pudo escribir ${s.ruta}`);
+    if (previa.estado !== 'ausente') {
+      try {
+        unlinkSync(rutaPrevia);
+      } catch {
+        /* se queda: la proxima instalacion la sobrescribe */
+      }
+    }
+    return {
+      tipo: 'hecho',
+      mensaje:
+        `desinstalada de ${s.ruta}` +
+        (devuelta === undefined || devuelta === null ? '' : `; vuelve la anterior ("${describir(devuelta)}")`) +
+        (copia === null ? '' : `; copia previa en ${copia}`),
+    };
+  } catch (e: unknown) {
+    return {
+      tipo: 'rechazado',
+      mensaje: `no se pudo desinstalar: ${e instanceof Error ? e.message : String(e)}`,
+      arreglo: `Revisa que ${s.ruta} se pueda leer y escribir, y repite.`,
+    };
+  }
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index c5214ec..dd1f49a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -49,6 +49,7 @@ import { peticionDeTrabajo } from '../fs/decision-documentacion.js';
 import { baseDeTipoSinRed, resolveBaseBranchForTipo } from '../fs/git.js';
 import { listTareasEnEstados } from '../fs/task-store.js';
 import { verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
+import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 
 /**
  * `timeout` del hook Stop en hooks/hooks.json, en segundos. Claude Code cancela
@@ -77,6 +78,12 @@ export interface DepsFreno {
   env?: NodeJS.ProcessEnv;
   /** Solo para tests: sustituye al timeout de la verificacion (en ms). */
   timeoutMs?: number;
+  /**
+   * TASK-110: donde se escribe el progreso visible (por defecto, bajo el .git
+   * del repo). Solo se escribe cuando de verdad se va a verificar: en los
+   * demas turnos, ni un fichero. Nunca imprime ni lanza.
+   */
+  progreso?: Progreso;
 }
 
 const DEJAR_PARAR: DecisionStop = Object.freeze({ codigo: 0, stderr: '' });
@@ -207,9 +214,26 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
         ? { tipo: 'selectiva', comando: plan.comando, timeoutS, base: plan.base }
         : { tipo: plan.tipo, comando: plan.comando as string, timeoutS };
 
-    // 8 y 9
-    const deOpciones = deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs };
-    const { resultado: r, deMemo, cambioElArbol } = verificarConMemo(raiz, peticion, deOpciones);
+    // 8 y 9. TASK-110: el paso se ve mientras corre; acaba "terminada" si sale
+    // en verde y "abortada" si bloquea el turno (o si algo lanza).
+    const progreso = deps.progreso ?? crearProgreso(raiz);
+    const paso = plan.tipo === 'completa' ? 'verificacion' : `verificacion ${plan.tipo}`;
+    progreso.fase(ids[0] ?? tarea, 'freno', [paso]);
+    progreso.paso(paso);
+    // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
+    const deOpciones = {
+      env: entornoConContador(process.env, progreso.contador()),
+      ...(deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs }),
+    };
+    let verificacion: ReturnType<typeof verificarConMemo>;
+    try {
+      verificacion = verificarConMemo(raiz, peticion, deOpciones);
+    } catch (e: unknown) {
+      progreso.terminar('abortada');
+      throw e;
+    }
+    progreso.terminar(verificacion.resultado.estado === 'verde' ? 'ok' : 'abortada');
+    const { resultado: r, deMemo, cambioElArbol } = verificacion;
     if (r.estado === 'verde') return dejarParar;
     if (plan.tipo === 'documentacion') {
       avisos.push(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/cli/estado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/estado.test.ts
new file mode 100644
index 0000000..bd90251
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/cli/estado.test.ts
@@ -0,0 +1,152 @@
+/**
+ * TASK-110: `taskctl estado` dentro del proceso, sin lanzar nada. El `.git`
+ * de estos repos es un directorio vacio a proposito: `estado` no puede
+ * necesitar git (los tests con git de verdad y como subproceso estan en
+ * test/commands/estado.test.ts).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { performance } from 'node:perf_hooks';
+import { Writable } from 'node:stream';
+import { leerEstado, mainEstado, directorioDeEntrada } from '../../src/commands/estado.js';
+import { crearProgreso, rutaProgreso, ubicarGit } from '../../src/fs/progreso.js';
+import { dejarProgreso } from '../helpers/progreso.js';
+
+async function conDir(fn: (dir: string) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'estado-'));
+  try {
+    await fn(dir);
+  } finally {
+    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
+  }
+}
+
+async function repoFalso(dir: string, conTareas = true): Promise<void> {
+  await mkdir(path.join(dir, '.git'), { recursive: true });
+  if (conTareas) await mkdir(path.join(dir, 'tareas'), { recursive: true });
+}
+
+test('estado: sin progreso y con tareas dice que no hay nada en marcha; sin tareas o fuera de un repo, nada', async () => {
+  await conDir(async (dir) => {
+    const repo = path.join(dir, 'repo');
+    await repoFalso(repo);
+    assert.deepEqual(leerEstado(repo), { linea: 'Nada en marcha.', enMarcha: false });
+    const sinTareas = path.join(dir, 'otro');
+    await repoFalso(sinTareas, false);
+    assert.deepEqual(leerEstado(sinTareas), { linea: '', enMarcha: false });
+    await mkdir(path.join(sinTareas, '.taskcode'));
+    assert.equal(leerEstado(sinTareas).linea, 'Nada en marcha.', '.taskcode/ tambien cuenta');
+    // Fuera de un repo: el tmp del sistema no esta dentro de ninguno (si lo estuviera, se salta).
+    if (ubicarGit(dir) === null) assert.deepEqual(leerEstado(dir), { linea: '', enMarcha: false });
+  });
+});
+
+test('estado: lee el progreso desde un subdirectorio y muestra el x/N del contador', async () => {
+  await conDir(async (repo) => {
+    await repoFalso(repo);
+    const ahora = Date.now();
+    const contador = dejarProgreso(repo, { paso: 'verificacion', haceMs: 125_000, contador: true, ahoraMs: ahora });
+    assert.ok(contador !== null);
+    const sub = path.join(repo, 'src', 'a');
+    await mkdir(sub, { recursive: true });
+    assert.deepEqual(leerEstado(sub, ahora), {
+      linea: 'TASK-110 · finish (5/5) · verificacion (2/6) · 2 min',
+      enMarcha: true,
+    });
+    await writeFile(contador, '1/10\n\u001b[31m3/10\u001b[0m\n', 'utf8');
+    assert.equal(leerEstado(sub, ahora).linea, 'TASK-110 · finish (5/5) · verificacion (2/6) 3/10 · 2 min');
+    // Un contador enorme: solo se leen sus ultimos bytes.
+    await writeFile(contador, `${'x'.repeat(200_000)}\n9/10\n`, 'utf8');
+    assert.equal(leerEstado(sub, ahora).linea, 'TASK-110 · finish (5/5) · verificacion (2/6) 9/10 · 2 min');
+  });
+});
+
+test('estado: el contador solo cuenta en el paso que lo pidio y mientras la fase sigue', async () => {
+  await conDir(async (repo) => {
+    await repoFalso(repo);
+    const p = crearProgreso(repo);
+    p.fase('TASK-110', 'finish', ['verificacion', 'merge']);
+    p.paso('verificacion');
+    const ruta = p.contador();
+    assert.ok(ruta !== null);
+    await writeFile(ruta, '4/4\n', 'utf8');
+    assert.match(leerEstado(repo).linea, /verificacion \(1\/2\) 4\/4/);
+    p.paso('merge');
+    assert.match(leerEstado(repo).linea, /merge \(2\/2\) · \d+ min$/);
+    p.terminar('ok');
+    assert.match(leerEstado(repo).linea, /^Nada en marcha · ultima: TASK-110 · finish \(5\/5\) · terminada hace 0 min$/);
+    assert.equal(leerEstado(repo).enMarcha, false);
+  });
+});
+
+test('estado: un progreso ilegible es como no tenerlo', async () => {
+  await conDir(async (repo) => {
+    await repoFalso(repo);
+    const ruta = rutaProgreso(repo) as string;
+    await mkdir(path.dirname(ruta), { recursive: true });
+    await writeFile(ruta, '{"version": 1, "tarea": "TASK-1"', 'utf8');
+    assert.equal(leerEstado(repo).linea, 'Nada en marcha.');
+  });
+});
+
+test('estado: en un worktree (".git" fichero con gitdir:) escritor y lector usan el mismo sitio', async () => {
+  await conDir(async (dir) => {
+    const principal = path.join(dir, 'principal');
+    await repoFalso(principal);
+    const wt = path.join(dir, 'wt');
+    await mkdir(path.join(wt, 'tareas'), { recursive: true });
+    const gitdir = path.join(principal, '.git', 'worktrees', 'wt');
+    await mkdir(gitdir, { recursive: true });
+    await writeFile(path.join(wt, '.git'), 'gitdir: ../principal/.git/worktrees/wt\n', 'utf8');
+    assert.equal(rutaProgreso(wt), path.join(gitdir, 'taskcode', 'progreso.json'));
+    dejarProgreso(wt, { paso: 'merge' });
+    assert.match(leerEstado(path.join(wt, 'tareas')).linea, /^TASK-110 · finish \(5\/5\) · merge/);
+    assert.equal(leerEstado(principal).linea, 'Nada en marcha.', 'el progreso del worktree no es el del principal');
+  });
+});
+
+test('estado: menos de 200 ms dentro del proceso (minimo de 5)', async () => {
+  await conDir(async (repo) => {
+    await repoFalso(repo);
+    dejarProgreso(repo, { paso: 'verificacion', contador: true });
+    const tiempos: number[] = [];
+    for (let i = 0; i < 5; i++) {
+      const t0 = performance.now();
+      leerEstado(repo);
+      tiempos.push(performance.now() - t0);
+    }
+    assert.ok(Math.min(...tiempos) < 200, `minimo ${Math.min(...tiempos).toFixed(1)} ms`);
+  });
+});
+
+test('estado: mainEstado escribe la linea y sale con 0; un flag desconocido sale con 1', async () => {
+  await conDir(async (repo) => {
+    await repoFalso(repo);
+    let texto = '';
+    const salida = new Writable({
+      write(chunk: Buffer, _enc, cb) {
+        texto += chunk.toString();
+        cb();
+      },
+    });
+    assert.equal(await mainEstado([], { cwd: repo, salida }), 0);
+    assert.equal(texto, 'Nada en marcha.\n');
+    const sinTareas = path.join(repo, 'no-es-repo-con-tareas');
+    await repoFalso(sinTareas, false);
+    texto = '';
+    assert.equal(await mainEstado([], { cwd: sinTareas, salida }), 0);
+    assert.equal(texto, '', 'sin tareas no imprime nada, ni un salto de linea');
+  });
+});
+
+test('estado: --stdin toma el directorio del JSON de la status line', async () => {
+  await conDir(async (dir) => {
+    assert.equal(directorioDeEntrada(JSON.stringify({ workspace: { current_dir: dir }, cwd: '/no/existe' })), dir);
+    assert.equal(directorioDeEntrada(JSON.stringify({ cwd: dir })), dir);
+    assert.equal(directorioDeEntrada(JSON.stringify({ cwd: path.join(dir, 'no-existe') })), null);
+    assert.equal(directorioDeEntrada('no es json'), null);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-status-line.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-status-line.test.ts
new file mode 100644
index 0000000..7a07846
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/doctor-status-line.test.ts
@@ -0,0 +1,283 @@
+/**
+ * TASK-110: doctor ofrece la status line de Claude Code y solo la instala con
+ * un flag explicito, en un settings.json de usuario TEMPORAL (`configClaudeDir`
+ * en proceso, CLAUDE_CONFIG_DIR por CLI). Nunca el de la maquina.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { createHash } from 'node:crypto';
+import { existsSync, readdirSync, readFileSync } from 'node:fs';
+import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { runDoctorCommand, DoctorCommandError } from '../../src/commands/doctor.js';
+import type { Comprobacion } from '../../src/core/doctor.js';
+import { FICHERO_PREVIA } from '../../src/fs/status-line.js';
+
+const TASKCTL = path.join(import.meta.dirname, '..', '..', '..', 'bin', 'taskctl');
+const AJENA = { type: 'command', command: 'echo mi barra' };
+const NUESTRA = { type: 'command', command: 'taskctl estado --stdin' };
+
+interface Entorno {
+  dir: string;
+  config: string;
+  settings: string;
+  /** Carpeta con un `taskctl` ejecutable, para el PATH. */
+  binSistema: string;
+}
+
+async function crearTaskctl(dir: string): Promise<void> {
+  await mkdir(dir, { recursive: true });
+  if (process.platform === 'win32') {
+    await writeFile(path.join(dir, 'taskctl.cmd'), '@echo off\r\n', 'utf8');
+  } else {
+    await writeFile(path.join(dir, 'taskctl'), '#!/bin/sh\n', 'utf8');
+    await chmod(path.join(dir, 'taskctl'), 0o755);
+  }
+}
+
+async function conEntorno(fn: (e: Entorno) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'doctor-status-line-'));
+  const e: Entorno = {
+    dir,
+    config: path.join(dir, 'claude'),
+    settings: path.join(dir, 'claude', 'settings.json'),
+    binSistema: path.join(dir, 'bin-sistema'),
+  };
+  await mkdir(e.config, { recursive: true });
+  await crearTaskctl(e.binSistema);
+  try {
+    await fn(e);
+  } finally {
+    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
+  }
+}
+
+function doctor(e: Entorno, args: string[], opts: { path?: string } = {}): Comprobacion {
+  const r = runDoctorCommand(args, {
+    repoCwd: e.dir,
+    configClaudeDir: e.config,
+    env: { PATH: opts.path ?? e.binSistema, PATHEXT: '.CMD;.EXE' },
+    ahora: new Date(Date.UTC(2026, 10, 12, 10, 0, 0)),
+  });
+  const c = r.comprobaciones.find((x) => x.id === 'status-line');
+  assert.ok(c, 'hay comprobacion status-line');
+  return c;
+}
+
+const hash = (ruta: string): string => createHash('sha1').update(readFileSync(ruta)).digest('hex');
+const leer = (ruta: string): Record<string, unknown> => JSON.parse(readFileSync(ruta, 'utf8')) as Record<string, unknown>;
+const copias = (e: Entorno): string[] => readdirSync(e.config).filter((f) => f.endsWith('.bak'));
+
+async function settingsConCentinela(e: Entorno, extra: Record<string, unknown> = {}): Promise<void> {
+  await writeFile(e.settings, JSON.stringify({ centinela: { a: [1, 2] }, permissions: { allow: ['Bash(ls)'] }, ...extra }, null, 4), 'utf8');
+}
+
+test('status line: sin flag la ofrece y no toca settings.json (ni lo crea); nunca es aviso', async () => {
+  await conEntorno(async (e) => {
+    const sinFichero = doctor(e, []);
+    assert.equal(sinFichero.nivel, 'omitida');
+    assert.match(sinFichero.mensaje, /no instalada[\s\S]*taskctl doctor --instalar-status-line/);
+    assert.equal(existsSync(e.settings), false, 'sin flag no crea el fichero');
+
+    await settingsConCentinela(e);
+    const antes = hash(e.settings);
+    assert.equal(doctor(e, []).nivel, 'omitida');
+    assert.equal(hash(e.settings), antes, 'sin flag no cambia ni un byte');
+
+    await settingsConCentinela(e, { statusLine: AJENA });
+    const ajena = doctor(e, ['--json']);
+    assert.equal(ajena.nivel, 'omitida');
+    assert.match(ajena.mensaje, /ya tiene otra status line \("echo mi barra"\): no se toca/);
+
+    await settingsConCentinela(e, { statusLine: NUESTRA });
+    assert.equal(doctor(e, []).nivel, 'ok');
+    assert.deepEqual(copias(e), []);
+  });
+});
+
+test('status line: con --instalar-status-line la anade, conserva las demas claves, deja copia y es idempotente', async () => {
+  await conEntorno(async (e) => {
+    await settingsConCentinela(e);
+    const c = doctor(e, ['--instalar-status-line']);
+    assert.equal(c.nivel, 'ok', c.mensaje);
+    assert.match(c.mensaje, /instalada en .*settings\.json \(taskctl estado --stdin; taskctl en .*bin-sistema/);
+    const s = leer(e.settings);
+    assert.deepEqual(s['statusLine'], NUESTRA);
+    assert.deepEqual(s['centinela'], { a: [1, 2] }, 'la clave centinela sigue');
+    assert.deepEqual(s['permissions'], { allow: ['Bash(ls)'] });
+    assert.deepEqual(copias(e), ['settings.json.20261112T100000Z.bak']);
+    assert.deepEqual(JSON.parse(readFileSync(path.join(e.config, 'settings.json.20261112T100000Z.bak'), 'utf8')), {
+      centinela: { a: [1, 2] },
+      permissions: { allow: ['Bash(ls)'] },
+    });
+    const despues = hash(e.settings);
+    const otra = doctor(e, ['--instalar-status-line']);
+    assert.equal(otra.nivel, 'ok');
+    assert.match(otra.mensaje, /ya estaba instalada/);
+    assert.equal(hash(e.settings), despues, 'la segunda vez no reescribe');
+    assert.equal(copias(e).length, 1, 'ni hace otra copia');
+  });
+});
+
+test('status line: sin settings.json lo crea solo con la status line', async () => {
+  await conEntorno(async (e) => {
+    assert.equal(doctor(e, ['--instalar-status-line']).nivel, 'ok');
+    assert.deepEqual(leer(e.settings), { statusLine: NUESTRA });
+    assert.deepEqual(copias(e), []);
+  });
+});
+
+test('status line: una ajena no se pisa sin --reemplazar-status-line; con el se guarda y desinstalar la devuelve', async () => {
+  await conEntorno(async (e) => {
+    await settingsConCentinela(e, { statusLine: AJENA });
+    const antes = hash(e.settings);
+    const rechazo = doctor(e, ['--instalar-status-line']);
+    assert.equal(rechazo.nivel, 'error');
+    assert.match(rechazo.arreglo ?? '', /--instalar-status-line --reemplazar-status-line/);
+    assert.equal(hash(e.settings), antes, 'rechazada: el fichero intacto');
+
+    const c = doctor(e, ['--instalar-status-line', '--reemplazar-status-line']);
+    assert.equal(c.nivel, 'ok', c.mensaje);
+    assert.match(c.mensaje, /la anterior \("echo mi barra"\) vuelve al desinstalar/);
+    assert.deepEqual(leer(e.settings)['statusLine'], NUESTRA);
+    assert.deepEqual(leer(path.join(e.config, FICHERO_PREVIA)), { statusLine: AJENA });
+    assert.equal(copias(e).length, 1);
+
+    const d = doctor(e, ['--desinstalar-status-line']);
+    assert.equal(d.nivel, 'ok', d.mensaje);
+    assert.match(d.mensaje, /vuelve la anterior \("echo mi barra"\)/);
+    const s = leer(e.settings);
+    assert.deepEqual(s['statusLine'], AJENA);
+    assert.deepEqual(s['centinela'], { a: [1, 2] });
+    assert.equal(existsSync(path.join(e.config, FICHERO_PREVIA)), false);
+  });
+});
+
+test('status line: desinstalar quita solo la suya; una ajena o ninguna no se tocan', async () => {
+  await conEntorno(async (e) => {
+    await settingsConCentinela(e, { statusLine: NUESTRA });
+    assert.equal(doctor(e, ['--desinstalar-status-line']).nivel, 'ok');
+    assert.deepEqual(leer(e.settings), { centinela: { a: [1, 2] }, permissions: { allow: ['Bash(ls)'] } });
+    const sinNada = hash(e.settings);
+    assert.match(doctor(e, ['--desinstalar-status-line']).mensaje, /no habia ninguna/);
+    assert.equal(hash(e.settings), sinNada);
+    await settingsConCentinela(e, { statusLine: AJENA });
+    const ajena = hash(e.settings);
+    const c = doctor(e, ['--desinstalar-status-line']);
+    assert.equal(c.nivel, 'ok');
+    assert.match(c.mensaje, /no es la de taskctl/);
+    assert.equal(hash(e.settings), ajena);
+  });
+});
+
+/** Carpeta `bin` de una version del plugin en la cache, como la real: el script de node y su lanzador. */
+async function crearBinPlugin(e: Entorno, version: string): Promise<string> {
+  const bin = path.join(e.config, 'plugins', 'cache', 'mk', 'taskcode-plugin', version, 'bin');
+  await crearTaskctl(bin);
+  await writeFile(path.join(bin, 'taskctl'), '#!/usr/bin/env node\n', 'utf8');
+  return bin;
+}
+
+const comandoDe = (e: Entorno): unknown =>
+  (JSON.parse(readFileSync(e.settings, 'utf8')) as { statusLine?: { command?: unknown } }).statusLine?.command;
+
+test('status line: sin taskctl en el PATH no se instala', async () => {
+  await conEntorno(async (e) => {
+    await settingsConCentinela(e);
+    const antes = hash(e.settings);
+    const vacio = path.join(e.dir, 'vacio');
+    await mkdir(vacio);
+    const c = doctor(e, ['--instalar-status-line'], { path: vacio });
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /taskctl no esta en el PATH/);
+    assert.match(c.arreglo ?? '', /PATH de tu sistema/);
+    assert.equal(hash(e.settings), antes, 'nada escrito');
+    assert.deepEqual(copias(e), []);
+  });
+});
+
+test('status line: si taskctl solo esta en la cache del plugin, se instala con node y su ruta; tras actualizar se reescribe; el del sistema gana', async () => {
+  await conEntorno(async (e) => {
+    await settingsConCentinela(e);
+    const vacio = path.join(e.dir, 'vacio');
+    await mkdir(vacio);
+    const bin14 = await crearBinPlugin(e, '0.14.0');
+    const soloPlugin = doctor(e, ['--instalar-status-line'], { path: [vacio, bin14].join(path.delimiter) });
+    assert.equal(soloPlugin.nivel, 'ok', soloPlugin.mensaje);
+    const esperado14 = `node "${path.join(bin14, 'taskctl').replace(/\\/g, '/')}" estado --stdin`;
+    assert.equal(comandoDe(e), esperado14);
+    assert.match(soloPlugin.mensaje, /cache del plugin/);
+    assert.match(soloPlugin.mensaje, /repite --instalar-status-line/);
+    // Idempotente con la misma ruta.
+    const otraVez = doctor(e, ['--instalar-status-line'], { path: [vacio, bin14].join(path.delimiter) });
+    assert.match(otraVez.mensaje, /ya estaba instalada/);
+    assert.equal(copias(e).length, 1, 'la segunda vez no escribe ni copia');
+    // Tras actualizar el plugin, se reescribe con la ruta nueva.
+    const bin15 = await crearBinPlugin(e, '0.15.0');
+    const nueva = doctor(e, ['--instalar-status-line'], { path: [vacio, bin15].join(path.delimiter) });
+    assert.equal(nueva.nivel, 'ok', nueva.mensaje);
+    assert.match(nueva.mensaje, /actualizada/);
+    assert.match(String(comandoDe(e)), /0\.15\.0\/bin\/taskctl" estado --stdin$/);
+    // Con el del sistema en el PATH, gana el comando por nombre aunque el del plugin vaya delante.
+    const ambos = doctor(e, ['--instalar-status-line'], { path: [bin15, e.binSistema].join(path.delimiter) });
+    assert.equal(ambos.nivel, 'ok', ambos.mensaje);
+    assert.equal(comandoDe(e), 'taskctl estado --stdin');
+    // Sigue siendo la nuestra: desinstalar la quita.
+    const fuera = doctor(e, ['--desinstalar-status-line'], { path: e.binSistema });
+    assert.equal(fuera.nivel, 'ok', fuera.mensaje);
+    assert.equal(comandoDe(e), undefined);
+  });
+});
+
+test('status line: si el taskctl de la cache no entiende "estado" (plugin anterior), no se instala y se dice', async () => {
+  await conEntorno(async (e) => {
+    await settingsConCentinela(e);
+    const antes = hash(e.settings);
+    const vacio = path.join(e.dir, 'vacio');
+    await mkdir(vacio);
+    const bin = await crearBinPlugin(e, '0.14.0');
+    // Como el taskctl 0.14.0 real: comando desconocido y salida 1.
+    await writeFile(path.join(bin, 'taskctl'), "console.error('[ERROR] Comando desconocido: \"estado\"'); process.exit(1);\n", 'utf8');
+    const c = doctor(e, ['--instalar-status-line'], { path: [vacio, bin].join(path.delimiter) });
+    assert.equal(c.nivel, 'error');
+    assert.match(c.mensaje, /no entiende "estado --stdin"/);
+    assert.match(c.arreglo ?? '', /Actualiza el plugin/);
+    assert.equal(hash(e.settings), antes, 'nada escrito');
+    assert.deepEqual(copias(e), []);
+  });
+});
+
+test('status line: un settings.json ilegible no se toca', async () => {
+  await conEntorno(async (e) => {
+    await writeFile(e.settings, '{ "roto": ', 'utf8');
+    assert.equal(doctor(e, []).nivel, 'omitida');
+    const c = doctor(e, ['--instalar-status-line']);
+    assert.equal(c.nivel, 'error');
+    assert.equal(readFileSync(e.settings, 'utf8'), '{ "roto": ');
+    assert.equal(doctor(e, ['--desinstalar-status-line']).nivel, 'error');
+    assert.equal(readFileSync(e.settings, 'utf8'), '{ "roto": ');
+  });
+});
+
+test('status line: --reemplazar sin --instalar, o instalar y desinstalar a la vez, abortan sin tocar nada', async () => {
+  await conEntorno(async (e) => {
+    const base = { repoCwd: e.dir, configClaudeDir: e.config, env: { PATH: e.binSistema } };
+    assert.throws(() => runDoctorCommand(['--reemplazar-status-line'], base), DoctorCommandError);
+    assert.throws(() => runDoctorCommand(['--instalar-status-line', '--desinstalar-status-line'], base), DoctorCommandError);
+    assert.equal(existsSync(e.settings), false);
+  });
+});
+
+test('status line: por CLI con CLAUDE_CONFIG_DIR temporal, instala y la linea lo dice', async () => {
+  await conEntorno(async (e) => {
+    await settingsConCentinela(e);
+    const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_CONFIG_DIR: e.config, PATH: [e.binSistema, process.env['PATH'] ?? ''].join(path.delimiter) };
+    for (const k of Object.keys(env)) if (k !== 'PATH' && k.toUpperCase() === 'PATH') delete env[k];
+    const r = spawnSync(process.execPath, [TASKCTL, 'doctor', '--instalar-status-line'], { cwd: e.dir, encoding: 'utf8', env });
+    assert.match(r.stdout, /^\[ok\] +status-line: instalada en /m, r.stdout + r.stderr);
+    assert.deepEqual(leer(e.settings)['statusLine'], NUESTRA);
+    assert.deepEqual(leer(e.settings)['centinela'], { a: [1, 2] });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado-seguir.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado-seguir.test.ts
new file mode 100644
index 0000000..46df113
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado-seguir.test.ts
@@ -0,0 +1,84 @@
+/**
+ * TASK-110: `taskctl estado --seguir` como subproceso, con un fichero de
+ * progreso que cambia mientras corre. Siempre con un tope de espera y kill:
+ * si no sale solo, el test se pone rojo en vez de quedarse colgado.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdir, mkdtemp, rm } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawn, spawnSync } from 'node:child_process';
+import { TASKCTL } from '../helpers/automatico-fixtures.js';
+import { crearProgreso } from '../../src/fs/progreso.js';
+
+const TOPE_MS = 10_000;
+
+async function conRepo(fn: (raiz: string) => Promise<void>): Promise<void> {
+  const raiz = await mkdtemp(path.join(tmpdir(), 'estado-seguir-'));
+  await mkdir(path.join(raiz, '.git'), { recursive: true });
+  await mkdir(path.join(raiz, 'tareas'), { recursive: true });
+  try {
+    await fn(raiz);
+  } finally {
+    await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
+  }
+}
+
+/** Lanza `taskctl estado --seguir` y devuelve su salida cuando sale, o lo mata al tope. */
+function seguir(raiz: string, env: NodeJS.ProcessEnv): { fin: Promise<{ codigo: number | null; salida: string; matado: boolean }> } {
+  const hijo = spawn(process.execPath, [TASKCTL, 'estado', '--seguir'], { cwd: raiz, env, stdio: ['ignore', 'pipe', 'pipe'] });
+  let salida = '';
+  hijo.stdout.setEncoding('utf8').on('data', (d: string) => (salida += d));
+  let matado = false;
+  const tope = setTimeout(() => {
+    matado = true;
+    hijo.kill();
+  }, TOPE_MS);
+  return {
+    fin: new Promise((resolve) => {
+      hijo.on('close', (codigo) => {
+        clearTimeout(tope);
+        resolve({ codigo, salida, matado });
+      });
+    }),
+  };
+}
+
+const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
+
+test('estado --seguir: refresca mientras la fase cambia de paso y sale solo cuando termina', async () => {
+  await conRepo(async (raiz) => {
+    const p = crearProgreso(raiz);
+    p.fase('TASK-110', 'finish', ['verificacion', 'merge']);
+    p.paso('verificacion');
+    const { fin } = seguir(raiz, { ...process.env, TASKCTL_ESTADO_SEGUIR_SIN_TTY: '1' });
+    await esperar(1500);
+    p.paso('merge');
+    await esperar(1500);
+    p.terminar('ok');
+    const r = await fin;
+    assert.equal(r.matado, false, `no salio solo al terminar la fase:\n${r.salida}`);
+    assert.equal(r.codigo, 0);
+    const lineas = r.salida.trimEnd().split('\n');
+    assert.match(lineas[0] ?? '', /^TASK-110 · finish \(5\/5\) · verificacion \(1\/2\) · 0 min$/);
+    assert.ok(lineas.some((l) => /· merge \(2\/2\) ·/.test(l)), `vio el segundo paso:\n${r.salida}`);
+    assert.match(lineas[lineas.length - 1] ?? '', /^Nada en marcha · ultima: TASK-110 · finish \(5\/5\) · terminada/);
+    assert.equal(new Set(lineas).size, lineas.length, 'solo escribe cuando la linea cambia');
+  });
+});
+
+test('estado --seguir: sin terminal imprime una sola linea y sale, aunque la fase siga en marcha', async () => {
+  await conRepo(async (raiz) => {
+    const p = crearProgreso(raiz);
+    p.fase('TASK-110', 'review', ['guardas']);
+    p.paso('guardas');
+    const env = { ...process.env };
+    delete env['TASKCTL_ESTADO_SEGUIR_SIN_TTY'];
+    const t0 = Date.now();
+    const r = spawnSync(process.execPath, [TASKCTL, 'estado', '--seguir'], { cwd: raiz, env, encoding: 'utf8', timeout: TOPE_MS });
+    assert.equal(r.status, 0, r.stderr);
+    assert.ok(Date.now() - t0 < TOPE_MS - 1000, 'no espero a que la fase terminara');
+    assert.match(r.stdout, /^TASK-110 · review \(4\/5\) · guardas \(1\/1\) · 0 min\n$/);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts
new file mode 100644
index 0000000..aa190ee
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/estado.test.ts
@@ -0,0 +1,133 @@
+/**
+ * TASK-110: `taskctl estado` como lo lanza la status line: subproceso de
+ * `bin/taskctl`, en repos Git de verdad.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { spawnSync } from 'node:child_process';
+import { TASKCTL, PLUGIN_ROOT, git } from '../helpers/automatico-fixtures.js';
+import { dejarProgreso } from '../helpers/progreso.js';
+import { ubicarGit } from '../../src/fs/progreso.js';
+
+function estado(cwd: string, env: NodeJS.ProcessEnv = process.env, args: string[] = []) {
+  const r = spawnSync(process.execPath, [TASKCTL, 'estado', ...args], { cwd, encoding: 'utf8', env });
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+async function conRepo(fn: (raiz: string, fuera: string) => Promise<void>): Promise<void> {
+  const fuera = await mkdtemp(path.join(tmpdir(), 'estado-cmd-'));
+  const raiz = path.join(fuera, 'repo');
+  await mkdir(path.join(raiz, 'tareas', '02-en-curso'), { recursive: true });
+  await mkdir(path.join(raiz, '.taskcode'), { recursive: true });
+  await writeFile(path.join(raiz, '.taskcode', 'config.yml'), 'limite_wip: 1\n', 'utf8');
+  await writeFile(path.join(raiz, 'tareas', '02-en-curso', '.gitkeep'), '', 'utf8');
+  git(['init', '-q', '-b', 'main'], raiz);
+  git(['config', 'user.email', 'test@example.com'], raiz);
+  git(['config', 'user.name', 'Test'], raiz);
+  git(['add', '-A'], raiz);
+  git(['commit', '-q', '-m', 'inicial'], raiz);
+  try {
+    await fn(raiz, fuera);
+  } finally {
+    await rm(fuera, { recursive: true, force: true, maxRetries: 5 });
+  }
+}
+
+test('estado: sin tarea en curso dice que no hay nada en marcha y sale con 0', async () => {
+  await conRepo(async (raiz) => {
+    const r = estado(raiz);
+    assert.deepEqual(r, { status: 0, stdout: 'Nada en marcha.\n', stderr: '' });
+  });
+});
+
+test('estado: lee solo el fichero de progreso, sin git: sin PATH y sin tareas/ ni .taskcode/ dice lo mismo', async () => {
+  await conRepo(async (raiz) => {
+    dejarProgreso(raiz, { paso: 'verificacion', haceMs: 125_000 });
+    const antes = estado(raiz);
+    assert.equal(antes.status, 0, antes.stderr);
+    assert.match(antes.stdout, /^TASK-110 · finish \(5\/5\) · verificacion \(2\/6\) · 2 min\n$/);
+    await rm(path.join(raiz, 'tareas'), { recursive: true, force: true });
+    await rm(path.join(raiz, '.taskcode'), { recursive: true, force: true });
+    // Sin PATH no hay git que lanzar: si `estado` lo necesitara, fallaria o diria otra cosa.
+    const sinGit = estado(path.join(raiz), { SYSTEMROOT: process.env['SYSTEMROOT'] ?? '', PATH: '' });
+    assert.equal(sinGit.status, 0, sinGit.stderr);
+    assert.equal(sinGit.stderr, '');
+    assert.equal(sinGit.stdout, antes.stdout);
+  });
+});
+
+test('estado: fuera de un repo con tareas no imprime nada y sale con 0', async () => {
+  const fuera = await mkdtemp(path.join(tmpdir(), 'estado-fuera-'));
+  try {
+    const repoSinTareas = path.join(fuera, 'ajeno');
+    await mkdir(repoSinTareas);
+    git(['init', '-q'], repoSinTareas);
+    assert.deepEqual(estado(repoSinTareas), { status: 0, stdout: '', stderr: '' });
+    if (ubicarGit(fuera) === null) assert.deepEqual(estado(fuera), { status: 0, stdout: '', stderr: '' });
+  } finally {
+    await rm(fuera, { recursive: true, force: true, maxRetries: 5 });
+  }
+});
+
+test('estado: un flag desconocido o repetido aborta con 1', async () => {
+  await conRepo(async (raiz) => {
+    const r = estado(raiz, process.env, ['--json']);
+    assert.equal(r.status, 1);
+    assert.match(r.stderr, /taskctl estado/);
+    const rep = estado(raiz, process.env, ['--stdin', '--stdin']);
+    assert.equal(rep.status, 1);
+    assert.match(rep.stderr, /"--stdin" esta repetido/);
+    const seguir = estado(raiz, process.env, ['--seguir', '--seguir']);
+    assert.equal(seguir.status, 1);
+    assert.match(seguir.stderr, /"--seguir" esta repetido/);
+  });
+});
+
+test('estado: --stdin usa el directorio del JSON de la status line y no se cuelga con stdin abierto', async () => {
+  await conRepo(async (raiz, fuera) => {
+    dejarProgreso(raiz, { paso: 'merge' });
+    const json = JSON.stringify({ workspace: { current_dir: raiz } });
+    const r = spawnSync(process.execPath, [TASKCTL, 'estado', '--stdin'], { cwd: fuera, input: json, encoding: 'utf8' });
+    assert.equal(r.status, 0, r.stderr);
+    assert.match(r.stdout, /^TASK-110 · finish \(5\/5\) · merge \(5\/6\)/);
+  });
+});
+
+test('estado: en un worktree enlazado de verdad, el progreso es el suyo', async () => {
+  await conRepo(async (raiz, fuera) => {
+    const wt = path.join(fuera, 'wt');
+    git(['worktree', 'add', '-q', '-b', 'otra', wt], raiz);
+    dejarProgreso(wt, { tarea: 'TASK-200', paso: 'merge' });
+    const enWt = estado(path.join(wt, 'tareas'));
+    assert.match(enWt.stdout, /^TASK-200 · finish/);
+    assert.equal(estado(raiz).stdout, 'Nada en marcha.\n');
+    // El mismo sitio que daria git: --git-path es por worktree.
+    const gitPath = path.resolve(wt, git(['rev-parse', '--git-path', 'taskcode/progreso.json'], wt).trim());
+    assert.doesNotThrow(() => readFileSync(gitPath, 'utf8'));
+  });
+});
+
+test('estado: la via rapida no carga el grafo de comandos ni nada que lance git', () => {
+  // Las importaciones de los modulos compilados que carga `taskctl estado`.
+  const dist = path.join(PLUGIN_ROOT, 'dist', 'src');
+  const visto = new Set<string>();
+  const pendientes = [path.join(dist, 'commands', 'estado.js')];
+  while (pendientes.length > 0) {
+    const f = pendientes.pop() as string;
+    if (visto.has(f)) continue;
+    visto.add(f);
+    for (const m of readFileSync(f, 'utf8').matchAll(/^import[^'"]*['"]([^'"]+)['"]/gm)) {
+      const spec = m[1] as string;
+      if (spec.startsWith('.')) pendientes.push(path.resolve(path.dirname(f), spec));
+      else assert.match(spec, /^node:/, `${path.relative(dist, f)} importa ${spec}`);
+    }
+  }
+  const relativos = [...visto].map((f) => path.relative(dist, f).split(path.sep).join('/')).sort();
+  assert.deepEqual(relativos, ['cli/args.js', 'commands/estado.js', 'core/progreso.js', 'core/sugerencia.js', 'fs/progreso.js']);
+  const bin = readFileSync(TASKCTL, 'utf8');
+  assert.match(bin, /argv\[0\] === 'estado'[\s\S]*commands\/estado\.js/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/progreso-comandos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/progreso-comandos.test.ts
new file mode 100644
index 0000000..a4004d3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/progreso-comandos.test.ts
@@ -0,0 +1,176 @@
+/**
+ * TASK-110: plan, approve, start, review y finish escriben el progreso visible bajo .git, lo
+ * marcan terminado al acabar (tambien al abortar) y NO anaden salida: cada
+ * comando se ejecuta en dos repos gemelos, uno donde el progreso no se puede
+ * escribir (progreso.json es un directorio), y su stdout, stderr y codigo de
+ * salida tienen que ser los mismos. El CLI real por spawn, repos Git reales;
+ * el progreso se lee con el lector de produccion, nunca se escribe a mano.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { mkdirSync } from 'node:fs';
+import { writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import {
+  ID,
+  CONFIG_AUTO,
+  cli,
+  cliOk,
+  commitAll,
+  git,
+  withRepo,
+  nueva,
+  planificar,
+  hastaCodigo,
+  rellenarInforme,
+  dirRevision,
+} from '../helpers/automatico-fixtures.js';
+import { leerProgreso, rutaProgreso } from '../../src/fs/progreso.js';
+import type { EstadoProgreso } from '../../src/core/progreso.js';
+
+/** Un repo donde escribir el progreso falla: progreso.json es un directorio. */
+function bloquearProgreso(repoRoot: string): void {
+  mkdirSync(rutaProgreso(repoRoot) as string, { recursive: true });
+}
+
+const normalizar = (texto: string, repoRoot: string): string =>
+  texto
+    .split(repoRoot)
+    .join('<REPO>')
+    .replace(/\b[0-9a-f]{7,40}\b/g, '<SHA>')
+    // Los scripts de Git-Flow sellan cada linea con la hora y dicen cuanto tardaron.
+    .replace(/\[\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\]/g, '[<HORA>]')
+    .replace(/DURACION {2}: \d+s/g, 'DURACION  : <N>s');
+
+/** El mismo comando en los dos gemelos: misma salida y mismo codigo. Devuelve la del repo con progreso. */
+function enGemelos(con: string, sin: string, args: string[]) {
+  const t0 = Date.now();
+  const a = cli(con, args);
+  const t1 = Date.now();
+  const b = cli(sin, args);
+  assert.equal(a.status, b.status, `${args.join(' ')}: mismo codigo con y sin progreso\n${a.stderr}\n${b.stderr}`);
+  assert.equal(normalizar(a.stdout, con), normalizar(b.stdout, sin), `${args.join(' ')}: mismo stdout`);
+  assert.equal(normalizar(a.stderr, con), normalizar(b.stderr, sin), `${args.join(' ')}: mismo stderr`);
+  return { ...a, t0, t1 };
+}
+
+function gemelos(fn: (con: string, sin: string, tareasCon: string, tareasSin: string) => Promise<void>): Promise<void> {
+  return withRepo(CONFIG_AUTO, (con, tareasCon) =>
+    withRepo(CONFIG_AUTO, async (sin, tareasSin) => {
+      bloquearProgreso(sin);
+      await fn(con, sin, tareasCon, tareasSin);
+    })
+  );
+}
+
+function progresoTerminado(repoRoot: string, fase: string, pasos: string[], t0: number, t1: number, resultado = 'ok'): EstadoProgreso {
+  const p = leerProgreso(repoRoot);
+  assert.ok(p !== null, `${fase}: hay progreso`);
+  assert.equal(p.tarea, ID);
+  assert.equal(p.fase, fase);
+  assert.deepEqual(p.pasos, pasos);
+  assert.equal(p.terminado, true, `${fase}: marcado como terminado`);
+  assert.equal(p.resultado, resultado);
+  assert.ok(p.inicio >= t0 - 1000 && p.inicio <= t1, `${fase}: inicio ${String(p.inicio)} entre ${String(t0)} y ${String(t1)}`);
+  assert.ok(p.fin !== null && p.fin >= p.inicio && p.fin <= t1);
+  const estado = cliOk(repoRoot, ['estado']).stdout;
+  assert.match(estado, new RegExp(`^Nada en marcha · ultima: ${ID} · ${fase} \\(\\d/5\\) · ${resultado === 'ok' ? 'terminada' : 'abortada'} hace \\d+ min\\n$`));
+  return p;
+}
+
+test('progreso: plan escribe su fase y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
+  await gemelos(async (con, sin) => {
+    // Aborta por el enunciado (ya con la fase empezada): no queda "en curso".
+    for (const r of [con, sin]) {
+      cliOk(r, ['new', '--titulo', 'Sin objetivo', '--tipo', 'feature', '--complejidad', 'simple']);
+      if (git(['status', '--porcelain'], r).trim() !== '') commitAll(r, 'docs: sin objetivo');
+    }
+    const fallo = enGemelos(con, sin, ['plan', ID]);
+    assert.equal(fallo.status, 1);
+    progresoTerminado(con, 'plan', ['guardas', 'brainstorm', 'commit'], fallo.t0, fallo.t1, 'abortada');
+  });
+  await gemelos(async (con, sin) => {
+    for (const r of [con, sin]) nueva(r, 'feature', 'Progreso de plan');
+    const r = enGemelos(con, sin, ['plan', ID]);
+    assert.equal(r.status, 0, r.stderr);
+    progresoTerminado(con, 'plan', ['guardas', 'brainstorm', 'commit'], r.t0, r.t1);
+  });
+});
+
+test('progreso: approve escribe su fase y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
+  await gemelos(async (con, sin, tareasCon, tareasSin) => {
+    for (const r of [con, sin]) {
+      nueva(r, 'feature', 'Progreso de approve');
+      cliOk(r, ['plan', ID]);
+    }
+    // Plan sin redactar: approve aborta tras empezar la fase.
+    const fallo = enGemelos(con, sin, ['approve', ID]);
+    assert.equal(fallo.status, 1);
+    progresoTerminado(con, 'approve', ['guardas', 'plan', 'commit'], fallo.t0, fallo.t1, 'abortada');
+    for (const [r, t] of [[con, tareasCon], [sin, tareasSin]] as const) {
+      await writeFile(path.join(t, '01-en-diseno', ID, 'planificacion', 'plan-final.md'), '# Plan\n\n## Enfoque propuesto\n\nX.\n', 'utf8');
+      commitAll(r, 'docs: plan');
+    }
+    const ok = enGemelos(con, sin, ['approve', ID]);
+    assert.equal(ok.status, 0, ok.stderr);
+    progresoTerminado(con, 'approve', ['guardas', 'plan', 'commit'], ok.t0, ok.t1);
+  });
+});
+
+test('progreso: start escribe su fase y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
+  await gemelos(async (con, sin, tareasCon, tareasSin) => {
+    for (const [r, t] of [[con, tareasCon], [sin, tareasSin]] as const) {
+      nueva(r, 'feature', 'Progreso de start');
+      await planificar(r, t);
+      cliOk(r, ['approve', ID]);
+      await writeFile(path.join(r, 'sucio.txt'), 'x\n', 'utf8');
+    }
+    // Workspace sucio: start aborta tras empezar la fase.
+    const fallo = enGemelos(con, sin, ['start', ID]);
+    assert.equal(fallo.status, 1);
+    progresoTerminado(con, 'start', ['guardas', 'rama', 'commit'], fallo.t0, fallo.t1, 'abortada');
+    for (const r of [con, sin]) commitAll(r, 'chore: limpio');
+    const ok = enGemelos(con, sin, ['start', ID]);
+    assert.equal(ok.status, 0, ok.stderr);
+    progresoTerminado(con, 'start', ['guardas', 'rama', 'commit'], ok.t0, ok.t1);
+  });
+});
+
+test('progreso: review escribe su fase con la ronda y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
+  await gemelos(async (con, sin, tareasCon, tareasSin) => {
+    for (const [r, t] of [[con, tareasCon], [sin, tareasSin]] as const) {
+      await hastaCodigo(r, t);
+      await writeFile(path.join(r, 'sucio.txt'), 'x\n', 'utf8');
+    }
+    const fallo = enGemelos(con, sin, ['review', ID]);
+    assert.equal(fallo.status, 1);
+    progresoTerminado(con, 'review', ['guardas', 'integracion', 'verificacion', 'peticiones', 'commit'], fallo.t0, fallo.t1, 'abortada');
+    for (const r of [con, sin]) commitAll(r, 'chore: limpio');
+    const ok = enGemelos(con, sin, ['review', ID]);
+    assert.equal(ok.status, 0, ok.stderr);
+    const p = progresoTerminado(con, 'review', ['guardas', 'integracion', 'verificacion', 'peticiones', 'commit'], ok.t0, ok.t1);
+    assert.equal(p.ronda, 1);
+    assert.equal(p.paso, 'commit', 'llego al ultimo paso');
+  });
+});
+
+test('progreso: finish escribe su fase y la marca terminada, sin cambiar su salida; si aborta, abortada', async () => {
+  await gemelos(async (con, sin, tareasCon, tareasSin) => {
+    for (const [r, t] of [[con, tareasCon], [sin, tareasSin]] as const) {
+      await hastaCodigo(r, t);
+      cliOk(r, ['review', ID]);
+      await rellenarInforme(r, path.join(dirRevision(t), 'informe-revision-1.md'));
+      cliOk(r, ['veredicto', ID, 'aprobada']);
+      await writeFile(path.join(r, 'sucio.txt'), 'x\n', 'utf8');
+    }
+    const pasos = ['puertas', 'verificacion', 'cobertura', 'held-out', 'merge', 'artefactos'];
+    const fallo = enGemelos(con, sin, ['finish', ID]);
+    assert.equal(fallo.status, 1);
+    progresoTerminado(con, 'finish', pasos, fallo.t0, fallo.t1, 'abortada');
+    for (const r of [con, sin]) commitAll(r, 'chore: limpio');
+    const ok = enGemelos(con, sin, ['finish', ID]);
+    assert.equal(ok.status, 0, ok.stderr);
+    const p = progresoTerminado(con, 'finish', pasos, ok.t0, ok.t1);
+    assert.equal(p.paso, 'artefactos', 'llego al ultimo paso');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/progreso-verificacion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/progreso-verificacion.test.ts
new file mode 100644
index 0000000..633c78a
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/progreso-verificacion.test.ts
@@ -0,0 +1,132 @@
+/**
+ * TASK-110: el progreso se ve A MITAD de la verificacion, con el x/N que el
+ * propio comando escriba en TASKCTL_PROGRESO, que es cuando la
+ * persona pregunta. El comando de verificacion es un script propio (fuera del
+ * repo) que ejecuta `taskctl estado` y guarda lo que ve en un fichero tambien
+ * fuera del repo: dentro del arbol, la guarda de "la verificacion ensucia"
+ * haria fallar el test por otra razon. Repos Git reales, scripts de Git-Flow
+ * tal cual.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { decidirStop } from '../../src/hooks/freno-stop.js';
+import { serializeTareaFile } from '../../src/core/tarea-file.js';
+import { SCRIPTS_DIR, sampleTask, git, commitAll, withTempRepo, setupTaskEnRevision } from '../helpers/finish-fixtures.js';
+import { TASKCTL, ID, cliOk, withRepo, hastaCodigo } from '../helpers/automatico-fixtures.js';
+import { leerProgreso, rutaContador } from '../../src/fs/progreso.js';
+
+/**
+ * Apunta el TASKCTL_PROGRESO que recibe, escribe en el x/N, ejecuta
+ * `taskctl estado`, guarda su salida y sale en verde.
+ */
+const SCRIPT = `
+const fs = require('node:fs');
+const { spawnSync } = require('node:child_process');
+const ruta = process.env.TASKCTL_PROGRESO;
+fs.appendFileSync(process.env.FOTO_SALIDA + '.ruta', String(ruta));
+if (ruta) fs.writeFileSync(ruta, '1/10' + String.fromCharCode(10) + '3/10' + String.fromCharCode(10));
+const r = spawnSync(process.execPath, [process.env.FOTO_TASKCTL, 'estado'], { encoding: 'utf8' });
+fs.appendFileSync(process.env.FOTO_SALIDA, r.stdout);
+process.exit(0);
+`;
+
+interface Foto {
+  comando: string;
+  salida: string;
+  leer(): string;
+  /** El TASKCTL_PROGRESO que vio el comando. */
+  ruta(): string;
+  /** Un TASKCTL_PROGRESO falso en el entorno de fuera: no puede heredarse ni escribirse. */
+  falso: string;
+}
+
+/** El script y su fichero de salida, fuera del repo; las variables van por el entorno del proceso (el comando lo hereda). */
+async function conFoto(fn: (f: Foto) => Promise<void>): Promise<void> {
+  const dir = await mkdtemp(path.join(tmpdir(), 'progreso-foto-'));
+  await writeFile(path.join(dir, 'foto.cjs'), SCRIPT, 'utf8');
+  const salida = path.join(dir, 'salida.txt');
+  const falso = path.join(dir, 'contador-falso');
+  const antes = { t: process.env['FOTO_TASKCTL'], s: process.env['FOTO_SALIDA'], p: process.env['TASKCTL_PROGRESO'] };
+  process.env['FOTO_TASKCTL'] = TASKCTL;
+  process.env['FOTO_SALIDA'] = salida;
+  process.env['TASKCTL_PROGRESO'] = falso;
+  try {
+    await fn({
+      comando: `node ${path.join(dir, 'foto.cjs').replace(/\\/g, '/')}`,
+      salida,
+      leer: () => (existsSync(salida) ? readFileSync(salida, 'utf8') : ''),
+      ruta: () => (existsSync(`${salida}.ruta`) ? readFileSync(`${salida}.ruta`, 'utf8') : ''),
+      falso,
+    });
+  } finally {
+    if (antes.t === undefined) delete process.env['FOTO_TASKCTL'];
+    else process.env['FOTO_TASKCTL'] = antes.t;
+    if (antes.s === undefined) delete process.env['FOTO_SALIDA'];
+    else process.env['FOTO_SALIDA'] = antes.s;
+    if (antes.p === undefined) delete process.env['TASKCTL_PROGRESO'];
+    else process.env['TASKCTL_PROGRESO'] = antes.p;
+    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
+  }
+}
+
+test('progreso: durante la verificacion de finish, taskctl estado dice tarea, fase y paso', async () => {
+  await conFoto((f) =>
+    withTempRepo(async (repoRoot, tareasRoot) => {
+      await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+      await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), `comando_verificacion: "${f.comando}"\n`, 'utf8');
+      commitAll(repoRoot, 'config');
+      await setupTaskEnRevision(repoRoot, tareasRoot, sampleTask({ id: 'TASK-730' }));
+      const r = await runFinishCommand(tareasRoot, ['TASK-730'], '2026-11-12', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+      assert.equal(r.cierre, 'terminada');
+      assert.equal(f.leer(), 'TASK-730 · finish (5/5) · verificacion (2/6) 3/10 · 0 min\n');
+      assert.equal(f.ruta(), rutaContador(repoRoot), 'el contador vive bajo .git, no el de fuera');
+      assert.equal(existsSync(f.falso), false, 'el TASKCTL_PROGRESO de fuera ni se hereda ni se escribe');
+    })
+  );
+});
+
+test('progreso: durante la verificacion del freno Stop, taskctl estado dice tarea y paso', async () => {
+  await conFoto(async (f) => {
+    const raiz = await mkdtemp(path.join(tmpdir(), 'progreso-freno-'));
+    try {
+      git(['init', '-q', '-b', 'main'], raiz);
+      git(['config', 'user.email', 'test@example.com'], raiz);
+      git(['config', 'user.name', 'Test'], raiz);
+      const rama = 'feature/task-071-freno';
+      const dir = path.join(raiz, 'tareas', '02-en-curso', 'TASK-071');
+      await mkdir(dir, { recursive: true });
+      await writeFile(path.join(dir, 'tarea.md'), serializeTareaFile(sampleTask({ id: 'TASK-071', estado: 'en-curso', rama }), '## Objetivo\nx\n'), 'utf8');
+      await mkdir(path.join(raiz, '.taskcode'));
+      await writeFile(path.join(raiz, '.taskcode', 'config.yml'), `comando_verificacion: "${f.comando}"\n`, 'utf8');
+      git(['add', '-A'], raiz);
+      git(['commit', '-q', '-m', 'inicial'], raiz);
+      git(['checkout', '-q', '-b', rama], raiz);
+      const d = await decidirStop({ hook_event_name: 'Stop', stop_hook_active: false, cwd: raiz });
+      assert.deepEqual(d, { codigo: 0, stderr: '' });
+      assert.equal(f.leer(), 'TASK-071 · freno · verificacion (1/1) 3/10 · 0 min\n');
+      assert.equal(f.ruta(), rutaContador(raiz));
+      assert.equal(existsSync(f.falso), false);
+    } finally {
+      await rm(raiz, { recursive: true, force: true, maxRetries: 5 });
+    }
+  });
+});
+
+test('progreso: la verificacion selectiva de review tambien recibe su contador', async () => {
+  await conFoto(async (f) => {
+    const config = `modo_flujo: automatico\ncomando_verificacion: "node -e 0"\ncomando_verificacion_selectiva: "${f.comando}"\n`;
+    await withRepo(config, async (repoRoot, tareasRoot) => {
+      await hastaCodigo(repoRoot, tareasRoot);
+      cliOk(repoRoot, ['review', ID]);
+      assert.equal(f.leer(), `${ID} · review (4/5) · verificacion (3/5) 3/10 · 0 min\n`);
+      assert.equal(f.ruta(), rutaContador(repoRoot));
+      assert.equal(existsSync(f.falso), false, 'el CLI no deja heredar el TASKCTL_PROGRESO de fuera');
+      assert.equal(leerProgreso(repoRoot)?.contador, false, 'al terminar, el contador ya no cuenta');
+    });
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/reporter-progreso.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/reporter-progreso.test.ts
new file mode 100644
index 0000000..a1686a3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/reporter-progreso.test.ts
@@ -0,0 +1,90 @@
+/**
+ * TASK-110: el reporter de progreso contra un `node --test` REAL, con los dos
+ * reporters como en `npm test` (spec por stdout, progreso por stderr), sobre
+ * ficheros minimos en un repo temporal (el total se guarda bajo su .git).
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { pathToFileURL } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { git } from '../helpers/finish-fixtures.js';
+
+const REPORTER = path.join(import.meta.dirname, '..', 'reporter', 'progreso.js');
+const PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
+
+const FICHEROS: Record<string, string> = {
+  'a.test.mjs': `import { test } from 'node:test';\ntest('suelto', () => {});\n`,
+  'b.test.mjs':
+    `import { test, describe, it } from 'node:test';\n` +
+    `describe('grupo', () => { it('uno', () => {}); it('dos', () => {}); });\n` +
+    `test('padre', async (t) => { await t.test('hijo 1', () => {}); await t.test('hijo 2', () => {}); });\n`,
+  'c.test.mjs': `import { test } from 'node:test';\ntest('el que falla', () => { throw new Error('roto a proposito'); });\n`,
+};
+const HOJAS = 6;
+
+function correr(dir: string, env: NodeJS.ProcessEnv = {}) {
+  const base: NodeJS.ProcessEnv = { ...process.env, ...env };
+  if (env['TASKCTL_PROGRESO'] === undefined) delete base['TASKCTL_PROGRESO'];
+  // Heredada del runner que ejecuta este test, haria que el node --test de dentro
+  // se comportara como un hijo suyo (sin reporters y saliendo con 0).
+  delete base['NODE_TEST_CONTEXT'];
+  const r = spawnSync(
+    process.execPath,
+    [
+      '--test',
+      '--test-reporter=spec',
+      '--test-reporter-destination=stdout',
+      `--test-reporter=${pathToFileURL(REPORTER).href}`,
+      '--test-reporter-destination=stderr',
+      ...Object.keys(FICHEROS),
+    ],
+    { cwd: dir, encoding: 'utf8', env: base }
+  );
+  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
+}
+
+const progresos = (stderr: string): string[] => [...stderr.matchAll(/^\[(\d+)\/(\d+|\?)\]$/gm)].map((m) => `${m[1] as string}/${m[2] as string}`);
+
+test('reporter: [x/N] con el total de la ejecucion anterior, sin pasarse, sin tapar el fallo ni cambiar el codigo', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'reporter-progreso-'));
+  try {
+    git(['init', '-q'], dir);
+    for (const [f, t] of Object.entries(FICHEROS)) await writeFile(path.join(dir, f), t, 'utf8');
+
+    const primera = correr(dir);
+    assert.notEqual(primera.status, 0, 'un test falla: el codigo no es 0');
+    assert.deepEqual(progresos(primera.stderr), ['1/?'], 'sin total anterior');
+    assert.match(primera.stderr, new RegExp(`^\\[progreso\\] ${String(HOJAS)} tests \\(sin total`, 'm'));
+    assert.match(primera.stdout, /el que falla/, 'el spec sigue nombrando el fallo');
+    assert.match(primera.stdout, /roto a proposito/);
+    assert.ok(existsSync(path.join(dir, '.git', 'taskcode', 'suite-total.json')), 'el total, bajo .git');
+
+    const segunda = correr(dir);
+    assert.notEqual(segunda.status, 0);
+    assert.deepEqual(progresos(segunda.stderr), ['1/6', '2/6', '3/6', '4/6', '5/6', '6/6']);
+    assert.match(segunda.stderr, /^\[progreso\] 6 tests \(la anterior: 6\)$/m);
+    assert.match(segunda.stdout, /el que falla/);
+
+    // Con TASKCTL_PROGRESO escribe ahi su x/N.
+    const contador = path.join(dir, '.git', 'taskcode', 'progreso-contador');
+    const tercera = correr(dir, { TASKCTL_PROGRESO: contador });
+    assert.notEqual(tercera.status, 0);
+    assert.equal(readFileSync(contador, 'utf8'), '6/6\n');
+  } finally {
+    await rm(dir, { recursive: true, force: true, maxRetries: 5 });
+  }
+});
+
+test('reporter: npm test y test:rapido lo usan junto al spec, con el glob entrecomillado', () => {
+  const pkg = JSON.parse(readFileSync(path.join(PLUGIN, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
+  for (const s of ['test', 'test:rapido']) {
+    const cmd = pkg.scripts[s] as string;
+    assert.match(cmd, /--test-reporter=spec --test-reporter-destination=stdout/, s);
+    assert.match(cmd, /--test-reporter=\.\/dist\/test\/reporter\/progreso\.js --test-reporter-destination=stderr/, s);
+    assert.match(cmd, /"dist\/test\/[^"]*\*\.test\.js"/, `${s}: el glob lo expande node, entre comillas`);
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/progreso.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/progreso.test.ts
new file mode 100644
index 0000000..4555790
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/progreso.test.ts
@@ -0,0 +1,128 @@
+/**
+ * TASK-110: el formato de la linea de estado es una interfaz publica (la
+ * status line de la persona la muestra tal cual). Este fichero es su unica
+ * fuente de verdad: si cambia el separador o los minutos, se pone rojo aqui.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import {
+  etiquetaFase,
+  formatearEstado,
+  limpiarTexto,
+  minutosDesde,
+  parsearContador,
+  validarProgreso,
+  MAX_LINEA,
+  VERSION_PROGRESO,
+  type EstadoProgreso,
+} from '../../src/core/progreso.js';
+
+const T0 = Date.UTC(2026, 10, 12, 10, 0, 0);
+
+function estado(extra: Partial<EstadoProgreso> = {}): EstadoProgreso {
+  return {
+    version: VERSION_PROGRESO,
+    tarea: 'TASK-110',
+    fase: 'review',
+    pasos: ['guardas', 'integracion', 'verificacion', 'peticiones', 'commit'],
+    paso: 'verificacion',
+    ronda: 2,
+    inicio: T0,
+    contador: true,
+    terminado: false,
+    resultado: null,
+    fin: null,
+    ...extra,
+  };
+}
+
+test('progreso: la linea dice fase en el ciclo, ronda, paso en la fase, x/N y minutos', () => {
+  assert.equal(
+    formatearEstado(estado(), T0 + 12 * 60_000 + 59_000, { x: 7, n: 22 }),
+    'TASK-110 · review (4/5) · ronda 2 · verificacion (3/5) 7/22 · 12 min'
+  );
+  // Sin contador, sin ronda: el paso con su posicion.
+  assert.equal(
+    formatearEstado(
+      estado({ fase: 'finish', ronda: null, contador: false, paso: 'merge', pasos: ['puertas', 'verificacion', 'cobertura', 'held-out', 'merge', 'artefactos'] }),
+      T0 + 125_000,
+      { x: 1, n: 2 }
+    ),
+    'TASK-110 · finish (5/5) · merge (5/6) · 2 min'
+  );
+  // Antes del primer paso, y fuera del ciclo (el freno).
+  assert.equal(formatearEstado(estado({ paso: null, ronda: null }), T0, null), 'TASK-110 · review (4/5) · 0 min');
+  assert.equal(
+    formatearEstado(estado({ fase: 'freno', pasos: ['verificacion'], ronda: null }), T0 + 60_000, { x: 3, n: 10 }),
+    'TASK-110 · freno · verificacion (1/1) 3/10 · 1 min'
+  );
+});
+
+test('progreso: terminada o abortada dice que no hay nada en marcha, con la ultima fase', () => {
+  assert.equal(
+    formatearEstado(estado({ terminado: true, resultado: 'ok', fin: T0 + 60_000 }), T0 + 4 * 60_000, null),
+    'Nada en marcha · ultima: TASK-110 · review (4/5) · terminada hace 3 min'
+  );
+  assert.equal(
+    formatearEstado(estado({ terminado: true, resultado: 'abortada', fin: T0 }), T0 + 30_000, { x: 1, n: 2 }),
+    'Nada en marcha · ultima: TASK-110 · review (4/5) · abortada hace 0 min'
+  );
+});
+
+test('progreso: minutos enteros hacia abajo y nunca negativos', () => {
+  assert.equal(minutosDesde(T0, T0 + 125_000), 2);
+  assert.equal(minutosDesde(T0, T0 + 59_999), 0);
+  assert.equal(minutosDesde(T0, T0 - 5_000), 0, 'un reloj que retrocede');
+  assert.equal(etiquetaFase('plan'), 'plan (1/5)');
+  assert.equal(etiquetaFase('otra'), 'otra');
+});
+
+test('progreso: validar exige version, tarea, fase e inicio; lo demas se tolera', () => {
+  assert.equal(validarProgreso(null), null);
+  assert.equal(validarProgreso([]), null);
+  assert.equal(validarProgreso({ version: 2, tarea: 'T', fase: 'f', inicio: 1 }), null);
+  assert.equal(validarProgreso({ version: 1, fase: 'f', inicio: 1 }), null);
+  assert.equal(validarProgreso({ version: 1, tarea: 'T', inicio: 1 }), null);
+  assert.equal(validarProgreso({ version: 1, tarea: 'T', fase: 'f', inicio: 'ayer' }), null);
+  const v = validarProgreso({ version: 1, tarea: 'TASK-1', fase: 'plan', inicio: 5, pasos: ['a', 3, null, 'b'], ronda: -1, resultado: 'raro' });
+  assert.deepEqual(v, {
+    version: 1,
+    tarea: 'TASK-1',
+    fase: 'plan',
+    pasos: ['a', 'b'],
+    paso: null,
+    ronda: null,
+    inicio: 5,
+    contador: false,
+    terminado: false,
+    resultado: null,
+    fin: null,
+  });
+});
+
+test('progreso: nada ajeno llega a la barra (ANSI, control, saltos de linea) y todo va recortado', () => {
+  assert.equal(limpiarTexto('\u001b[31mrojo\u001b[0m\r\nmal\u0007'), 'rojo mal');
+  assert.equal(limpiarTexto('\u001b]0;titulo\u0007paso'), 'paso');
+  assert.equal(limpiarTexto('a\u202eb'), 'a b', 'una marca de direccion no reordena la barra');
+  assert.equal(limpiarTexto(''), null);
+  assert.equal(limpiarTexto(42), null);
+  assert.equal(limpiarTexto('x'.repeat(100))?.length, 40);
+  const v = validarProgreso({ version: 1, tarea: 'TASK-1\u001b[2J', fase: 'review', inicio: T0, paso: 'ver\rificacion\n', pasos: ['ver ificacion'] });
+  assert.ok(v !== null);
+  const linea = formatearEstado(v, T0, null);
+  assert.equal(linea, 'TASK-1 · review (4/5) · ver ificacion (1/1) · 0 min');
+  const larga = formatearEstado(estado({ tarea: 'T'.repeat(20), paso: 'p'.repeat(40), pasos: [] }), T0 + 9_999 * 60_000, { x: 999_999_999, n: 999_999_999 });
+  assert.ok(Array.from(larga).length <= MAX_LINEA);
+});
+
+test('progreso: el contador solo da numeros, del ultimo x/N de la ultima linea con texto', () => {
+  assert.deepEqual(parsearContador('3/10'), { x: 3, n: 10 });
+  assert.deepEqual(parsearContador('1/10\n2/10\n\n'), { x: 2, n: 10 });
+  assert.deepEqual(parsearContador('\u001b[32m[ 5 / 9 ]\u001b[0m'), { x: 5, n: 9 });
+  assert.deepEqual(parsearContador('{"x":1}\nsuite 4/8 ok, 12/40 total'), { x: 12, n: 40 });
+  assert.deepEqual(parsearContador('a\r7/8'), { x: 7, n: 8 });
+  assert.equal(parsearContador(''), null);
+  assert.equal(parsearContador('sin numeros'), null);
+  assert.equal(parsearContador('3/0'), null);
+  assert.equal(parsearContador('{"x": 3, "n": 10'), null, 'JSON a medias: nada');
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/reporter-progreso.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/reporter-progreso.test.ts
new file mode 100644
index 0000000..9bd1cf3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/reporter-progreso.test.ts
@@ -0,0 +1,39 @@
+/**
+ * TASK-110: la parte pura del reporter de progreso de `npm test`. La prueba de
+ * verdad, con un `node --test` real, esta en test/commands/reporter-progreso.test.ts:
+ * estos eventos son como los entiende quien escribio el test.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { ContadorHojas, claveDeEjecucion, linea, tocaLinea } from '../reporter/progreso.js';
+
+const fin = (nesting: number, file = 'a.js', tipo?: string) => ({
+  type: 'test:pass',
+  data: { nesting, file, details: tipo === undefined ? {} : { type: tipo } },
+});
+
+test('reporter: cuenta solo hojas (ni suites ni tests con subtests), por fichero', () => {
+  const c = new ContadorHojas();
+  const hojas = [
+    c.terminado(fin(1)), // hijo de un describe
+    c.terminado(fin(1)),
+    c.terminado(fin(0, 'a.js', 'suite')), // el describe
+    c.terminado(fin(2, 'b.js')), // nieto
+    c.terminado(fin(1, 'b.js')), // padre del nieto: no es hoja
+    c.terminado(fin(0, 'b.js')), // abuelo: tampoco
+    c.terminado(fin(0, 'a.js')), // test suelto de a.js tras el describe: hoja
+  ];
+  assert.deepEqual(hojas, [true, true, false, true, false, false, true]);
+  assert.equal(c.hojas, 4);
+});
+
+test('reporter: una linea cada 5 %, la primera y la ultima; sin total, cada 50; nunca x > N', () => {
+  const con100 = Array.from({ length: 100 }, (_, i) => i + 1).filter((x) => tocaLinea(x, 100));
+  assert.deepEqual(con100, [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]);
+  assert.deepEqual([1, 2, 3, 4].filter((x) => tocaLinea(x, 4)), [1, 2, 3, 4]);
+  assert.deepEqual(Array.from({ length: 120 }, (_, i) => i + 1).filter((x) => tocaLinea(x, null)), [1, 50, 100]);
+  assert.equal(linea(3, 10), '[3/10]');
+  assert.equal(linea(11, 10), '[11/?]', 'esta vez hay mas tests que la anterior');
+  assert.equal(linea(1, null), '[1/?]');
+  assert.notEqual(claveDeEjecucion('/r', ['dist/test/**/*.test.js']), claveDeEjecucion('/r', ['dist/test/core/**/*.test.js']));
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/progreso.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/progreso.ts
new file mode 100644
index 0000000..0abf3eb
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/progreso.ts
@@ -0,0 +1,41 @@
+/**
+ * TASK-110: el UNICO sitio donde los tests dejan un progreso sin ejecutar un
+ * comando. Solo lo usan los tests de formato y de `estado` (plan de testing:
+ * si cada test de comando escribiera el JSON a mano, quien escribe y quien lee
+ * podrian separarse con la suite en verde). Y ni siquiera aqui se escribe el
+ * JSON a mano: va por el escritor real con un reloj fijo.
+ */
+import { crearProgreso } from '../../src/fs/progreso.js';
+import type { FaseProgreso, ResultadoFase } from '../../src/core/progreso.js';
+
+export interface ProgresoDePrueba {
+  tarea?: string;
+  fase?: FaseProgreso;
+  pasos?: readonly string[];
+  paso?: string;
+  ronda?: number;
+  /** Cuanto hace que empezo la fase (ms). */
+  haceMs?: number;
+  /** Prepara el contador del paso y devuelve su ruta. */
+  contador?: boolean;
+  terminado?: ResultadoFase;
+  ahoraMs?: number;
+}
+
+/** Deja el progreso en el repo de `cwd` y devuelve la ruta del contador si se pidio. */
+export function dejarProgreso(cwd: string, p: ProgresoDePrueba = {}): string | null {
+  const ahora = p.ahoraMs ?? Date.now();
+  let t = ahora - (p.haceMs ?? 0);
+  const progreso = crearProgreso(cwd, { reloj: () => t });
+  progreso.fase(
+    p.tarea ?? 'TASK-110',
+    p.fase ?? 'finish',
+    p.pasos ?? ['puertas', 'verificacion', 'cobertura', 'held-out', 'merge', 'artefactos'],
+    p.ronda === undefined ? {} : { ronda: p.ronda }
+  );
+  t = ahora;
+  if (p.paso !== undefined) progreso.paso(p.paso);
+  const ruta = p.contador === true ? progreso.contador() : null;
+  if (p.terminado !== undefined) progreso.terminar(p.terminado);
+  return ruta;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
index a549cf6..5ea6e8d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-stop.test.ts
@@ -20,6 +20,12 @@ import { decidirStop, MARGEN_HOOK_S, TECHO_HOOK_S, parsearEntrada, timeoutEfecti
 import { describirResultado, recortarCola, type ResultadoVerificacion } from '../../src/core/informe-verificacion.js';
 import { serializeTareaFile } from '../../src/core/tarea-file.js';
 import { git, sampleTask } from '../helpers/finish-fixtures.js';
+import { leerProgreso, rutaProgreso } from '../../src/fs/progreso.js';
+
+/** TASK-110: en los turnos en que el freno no verifica, ni un fichero de progreso. */
+function sinProgreso(raiz: string): void {
+  assert.equal(existsSync(rutaProgreso(raiz) as string), false, 'no se escribe progreso si no se verifica');
+}
 
 const RAIZ_PLUGIN = path.join(import.meta.dirname, '..', '..', '..');
 const ENTRADA_HOOK = path.join(RAIZ_PLUGIN, 'dist', 'src', 'hooks', 'stop-verificacion.js');
@@ -117,9 +123,18 @@ function conDesenlace<T>(r: Repo, fn: () => Promise<T>): Promise<T> {
 test('freno: verificacion en verde deja parar, en silencio', async () => {
   await conRepo((r) =>
     conDesenlace(r, async () => {
+      const t0 = Date.now();
       const d = await decidir(r);
       assert.deepEqual(d, { codigo: 0, stderr: '' });
       assert.equal(r.ejecuciones(), 1);
+      // TASK-110: el freno escribe su progreso y lo marca terminado.
+      const p = leerProgreso(r.raiz);
+      assert.ok(p !== null);
+      assert.deepEqual(
+        [p.tarea, p.fase, p.pasos, p.paso, p.terminado, p.resultado],
+        ['TASK-071', 'freno', ['verificacion'], 'verificacion', true, 'ok']
+      );
+      assert.ok(p.inicio >= t0 - 1000 && p.inicio <= Date.now());
     })
   );
 });
@@ -137,6 +152,8 @@ test('freno: verificacion en rojo bloquea con exit 2 y el comando, el codigo, la
       assert.match(d.stderr, /preparando[\s\S]*ERROR: 2 tests fallan/, 'stdout y stderr intercalados');
       assert.match(d.stderr, /No borres, saltes ni debilites tests/);
       assert.doesNotMatch(d.stderr, /taskcode/i, 'el texto lo leen proyectos ajenos');
+      // TASK-110: un turno bloqueado deja la fase como abortada, no "en curso".
+      assert.deepEqual([leerProgreso(r.raiz)?.terminado, leerProgreso(r.raiz)?.resultado], [true, 'abortada']);
     })
   );
 });
@@ -148,6 +165,7 @@ test('freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecut
         await writeFile(r.desenlace, 'ko', 'utf8');
         assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
         assert.equal(r.ejecuciones(), 0);
+        sinProgreso(r.raiz);
       }),
     { tarea: false }
   );
@@ -157,6 +175,7 @@ test('freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecut
         await writeFile(r.desenlace, 'ko', 'utf8');
         assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
         assert.equal(r.ejecuciones(), 0);
+        sinProgreso(r.raiz);
       }),
     { rama: 'feature/otra-cosa' }
   );
@@ -166,6 +185,7 @@ test('freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecut
         await writeFile(r.desenlace, 'ko', 'utf8');
         assert.deepEqual(await decidir(r), { codigo: 0, stderr: '' });
         assert.equal(r.ejecuciones(), 0);
+        sinProgreso(r.raiz);
       }),
     { config: 'limite_wip: 1\n' }
   );
@@ -191,6 +211,7 @@ test('freno: stop_hook_active e interruptor FRENO_VERIFICACION=0 dejan parar sin
       assert.deepEqual(await decidir(r, { stop_hook_active: true }), { codigo: 0, stderr: '' });
       assert.deepEqual(await decidir(r, {}, { env: { FRENO_VERIFICACION: '0' } }), { codigo: 0, stderr: '' });
       assert.equal(r.ejecuciones(), 0);
+      sinProgreso(r.raiz);
     })
   );
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/reporter/progreso.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/reporter/progreso.ts
new file mode 100644
index 0000000..6d8747b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/reporter/progreso.ts
@@ -0,0 +1,121 @@
+/**
+ * Reporter de progreso de `node --test` (TASK-110), sin dependencias: va
+ * JUNTO al `spec` (que sigue dando la salida de siempre y la tabla de
+ * cobertura), por su propio destino, y dice cuantos tests van:
+ *
+ *   [120/1290]
+ *
+ * - Cuenta solo tests hoja: ni las suites (`describe`) ni los tests que tienen
+ *   subtests. Un padre llega despues que sus hijos, asi que se reconoce porque
+ *   en su fichero acaban de terminar tests un nivel por debajo.
+ * - N es el total de la ejecucion ANTERIOR con los mismos ficheros, guardado
+ *   bajo `.git/` (`dist/test` lo borra `limpiar:test` en cada `npm test`).
+ *   Sin total anterior, `[x/?]`. Si esta vez hay mas, `[x/?]` tambien: nunca
+ *   `[x/N]` con x > N.
+ * - No reescribe la linea con `\r`: la salida acaba en logs y en la cola que lee
+ *   el informe de verificacion. Imprime una linea cada 5 % (y la primera y la
+ *   ultima); sin total, cada 50.
+ * - Con TASKCTL_PROGRESO (el contador que recibe el comando de verificacion),
+ *   escribe ahi su x/N, y la linea de estado lo muestra.
+ * - Nunca cambia el codigo de salida ni oculta un fallo: no lanza, y los
+ *   fallos los cuenta el `spec`.
+ */
+import { createHash } from 'node:crypto';
+import { readFileSync } from 'node:fs';
+import path from 'node:path';
+import { dirProgreso, escribirAtomico, VARIABLE_PROGRESO } from '../../src/fs/progreso.js';
+
+const FICHERO_TOTAL = 'suite-total.json';
+const VERSION_TOTAL = 1;
+const CADA_SIN_TOTAL = 50;
+const TRAMOS = 20;
+const MS_ENTRE_CONTADORES = 500;
+
+interface EventoTest {
+  type: string;
+  data?: { nesting?: number; file?: string; details?: { type?: string } };
+}
+
+/** La clave de esta ejecucion: el directorio y los patrones de ficheros (test y test:rapido no comparten total). */
+export function claveDeEjecucion(cwd: string, argv: readonly string[]): string {
+  return createHash('sha1').update([cwd, ...argv].join('\0')).digest('hex').slice(0, 16);
+}
+
+function rutaTotal(cwd: string): string | null {
+  const d = dirProgreso(cwd);
+  return d === null ? null : path.join(d, FICHERO_TOTAL);
+}
+
+function leerTotales(ruta: string | null): Record<string, number> {
+  if (ruta === null) return {};
+  try {
+    const j = JSON.parse(readFileSync(ruta, 'utf8')) as { version?: unknown; totales?: unknown };
+    if (j.version !== VERSION_TOTAL || typeof j.totales !== 'object' || j.totales === null) return {};
+    return j.totales as Record<string, number>;
+  } catch {
+    return {};
+  }
+}
+
+/** Cuenta tests hoja a partir de los eventos de fin (test:pass / test:fail). */
+export class ContadorHojas {
+  private readonly terminadosPorNivel = new Map<string, number[]>();
+  hojas = 0;
+
+  /** Devuelve true si el evento era una hoja (y la ha contado). */
+  terminado(e: EventoTest): boolean {
+    const nivel = e.data?.nesting ?? 0;
+    const fichero = e.data?.file ?? '';
+    const niveles = this.terminadosPorNivel.get(fichero) ?? [];
+    this.terminadosPorNivel.set(fichero, niveles);
+    const conHijos = (niveles[nivel + 1] ?? 0) > 0;
+    niveles[nivel + 1] = 0;
+    niveles[nivel] = (niveles[nivel] ?? 0) + 1;
+    if (conHijos || e.data?.details?.type === 'suite') return false;
+    this.hojas++;
+    return true;
+  }
+}
+
+/** Si toca imprimir la linea del test numero `x` de `n` (null: total desconocido). */
+export function tocaLinea(x: number, n: number | null): boolean {
+  if (x === 1) return true;
+  if (n === null || x > n) return x % CADA_SIN_TOTAL === 0;
+  return x === n || Math.floor((x * TRAMOS) / n) !== Math.floor(((x - 1) * TRAMOS) / n);
+}
+
+export function linea(x: number, n: number | null): string {
+  return n === null || x > n ? `[${String(x)}/?]` : `[${String(x)}/${String(n)}]`;
+}
+
+export default async function* progreso(fuente: AsyncIterable<EventoTest>): AsyncGenerator<string> {
+  const cwd = process.cwd();
+  const clave = claveDeEjecucion(cwd, process.argv.slice(1));
+  const ruta = rutaTotal(cwd);
+  const totales = leerTotales(ruta);
+  const anterior = typeof totales[clave] === 'number' && totales[clave] > 0 ? totales[clave] : null;
+  const contador = process.env[VARIABLE_PROGRESO];
+  const conteo = new ContadorHojas();
+  let ultimoContador = 0;
+  const escribirContador = (final: boolean): void => {
+    if (contador === undefined || contador === '' || anterior === null) return;
+    const ahora = Date.now();
+    if (!final && ahora - ultimoContador < MS_ENTRE_CONTADORES) return;
+    ultimoContador = ahora;
+    const n = Math.max(anterior, conteo.hojas);
+    escribirAtomico(contador, `${String(conteo.hojas)}/${String(final ? conteo.hojas : n)}\n`);
+  };
+  for await (const e of fuente) {
+    if (e.type !== 'test:pass' && e.type !== 'test:fail') continue;
+    if (!conteo.terminado(e)) continue;
+    if (tocaLinea(conteo.hojas, anterior)) yield `${linea(conteo.hojas, anterior)}\n`;
+    escribirContador(false);
+  }
+  escribirContador(true);
+  yield `[progreso] ${String(conteo.hojas)} tests` +
+    (anterior === null ? ' (sin total de una ejecucion anterior)' : ` (la anterior: ${String(anterior)})`) +
+    '\n';
+  if (ruta !== null && conteo.hojas > 0) {
+    escribirAtomico(ruta, `${JSON.stringify({ version: VERSION_TOTAL, totales: { ...totales, [clave]: conteo.hojas } })}\n`);
+  }
+}
````

## Excluido del diff (23 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-110/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-110/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-110/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-110/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-110/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-110/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-110/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-110/planificacion/plan-final.md                                    |   0
 tareas/02-en-curso/TASK-110/planificacion/spike-status-line.md                                               |  10 +++
 tareas/{01-en-diseno => 02-en-curso}/TASK-110/tarea.md                                                       |   7 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  25 +++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                    |  12 ++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                     |  63 ++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/estado.js                                     | 138 +++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                        |  13 +++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |  19 ++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       |  12 ++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/review.js                                     |  22 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                                      |  12 ++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/progreso.js                                       | 136 ++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/progreso.js                                         | 219 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/status-line.js                                      | 280 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                    |  25 +++++++-
 23 files changed, 977 insertions(+), 16 deletions(-)
````
