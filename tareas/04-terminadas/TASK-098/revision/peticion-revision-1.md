# Peticion de revision — TASK-098 (ronda 1)

- Tarea: TASK-098 — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes
- Rama revisada: feature/task-098-roadmap-de-tareas-generado-por-taskctl-e
- Rama base: develop
- Commit revisado (HEAD): eb332ddb581190e3e4b8f0810c56a14de5d7c9a7
- Fecha: 2026-11-10
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-098 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-098/tarea.md
- tareas/03-en-revision/TASK-098/planificacion/
- CHANGELOG.md
- taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-transiciones.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-ciclo.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/fixtures/roadmap/opendocktrading.md
- taskcode-marketplace/plugins/taskcode-plugin/test/fixtures/roadmap/toolsaweb.md
- taskcode-marketplace/plugins/taskcode-plugin/test/helpers/roadmap-fixtures.ts

## Commits a revisar (git log develop..HEAD)

````
eb332dd docs(TASK-098): autorrevision
3da7011 docs(TASK-098): ROADMAP en la skill task-workflow, README y CHANGELOG
5e17def feat(TASK-098): ROADMAP de tareas generado por taskctl sin pisar los ajenos
c52ed8a chore(TASK-098): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 2571d26..d2acd8e 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -8,6 +8,35 @@
 
 ## 0.14.0 — sin publicar
 
+ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
+`new`, `plan`, `approve` y `finish` (tras el merge) regeneran
+`tareas/ROADMAP.md` dentro de su propio commit cuando este cae en la rama de
+integracion: una tabla por hito (`sprint`) en orden de dependencias, con
+complejidad y estado, y un resumen de lo que esta en marcha y lo listo para
+empezar. En la rama de una tarea no se toca, asi que dos ramas en paralelo no
+chocan en el. Sin fecha (regenerar sin cambios no da diff). Regla numero uno:
+no pisa un ROADMAP ajeno. Solo escribe el fichero si lleva la marca de taskctl
+en su tercera linea (`<!-- generado por taskctl; formato 1; no editar fuera de
+la zona manual -->`, comparada entera) o si nunca ha existido en git; nunca si
+esta en `rutas_sincronizacion`, si tiene cambios sin commitear (avisa) o si en
+disco se llama con otras mayusculas. La zona manual (entre `<!--
+manual:inicio ... -->` y `<!-- manual:fin -->`) se conserva byte a byte y sus
+`### Hn — titulo` dan el titulo y el orden de los hitos. Generacion tolerante:
+un ciclo de dependencias sale en su propia seccion y como aviso, y una
+`tarea.md` ilegible deja el fichero como estaba; nada tumba una transicion.
+Comando nuevo `taskctl roadmap [--comparar | --escribir]`: sin flags lo
+muestra; `--comparar` lista sin escribir lo que difiere del actual (tareas,
+hitos, dependencias, estado, zona manual) y sale con 1 si hay diferencias, que
+es la comprobacion previa a migrar un proyecto con ROADMAP propio;
+`--escribir` lo regenera sin commitear y sobre uno ajeno solo si `--comparar`
+saldria limpio. Guia en la skill `task-workflow` (`roadmap.md`) y en el
+README.
+
+Cambio de comportamiento: en un proyecto sin `tareas/ROADMAP.md` (ni historia
+de el), el primer commit de `new`, `plan`, `approve` o `finish` en la rama de
+integracion lo crea, y desde entonces entra en los commits de esas
+transiciones cuando cambia.
+
 Regla de una hora (TASK-097). Una tarea prevista de mas de una hora de punta a
 punta (de la rama abierta al cierre con merge) se trocea. La plantilla de
 `plan-final.md` gana la linea `Duracion estimada: N min` con sus senales
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes b/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
index fb8c372..f6fddb6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.gitattributes
@@ -24,3 +24,7 @@ bin/*.cmd text eol=crlf
 # falla con "$'\r': command not found" (visto en TASK-069 al lanzar
 # create-feature.sh desde la VM del bridge sobre el checkout de Windows).
 *.sh text eol=lf
+
+# Copias byte a byte de ROADMAP reales de otros proyectos (TASK-098): los tests
+# comprueban que taskctl no les cambia ni un byte, asi que Git tampoco puede.
+test/fixtures/roadmap/** -text
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 4039085..ea086a1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -611,14 +611,64 @@ comando_sincronizacion: "node scripts/roadmap.mjs"
 rutas_sincronizacion: [tareas/ROADMAP.md, docs/PLAN.md]
 ```
 
-El motivo: `taskctl` solo escribe dentro de las carpetas de estado
-(`tareas/00-planificadas/` … `tareas/04-terminadas/`), así que un fichero suelto
+El motivo: fuera de las carpetas de estado (`tareas/00-planificadas/` …
+`tareas/04-terminadas/`) `taskctl` solo escribe `tareas/ROADMAP.md`, y nunca si
+está declarado aquí (ver «ROADMAP de tareas» abajo), así que un fichero suelto
 en la raíz de `tareas/` no choca con lo que escribe la herramienta, y sin esa
-excepción un roadmap que vive ahí se quedaba atrasado tras cada transición.
+excepción un roadmap propio que vive ahí se quedaba atrasado tras cada transición.
 `tareas/01-en-diseno/x.md`, `tareas/otra/x.md` y `tareas` (la carpeta) se
 siguen rechazando, sin distinguir mayúsculas. `informe_cobertura` no tiene esta
 excepción.
 
+## ROADMAP de tareas (`tareas/ROADMAP.md`)
+
+`taskctl` mantiene en cada proyecto un `tareas/ROADMAP.md`: una tabla por hito
+(el campo `sprint`), con las columnas Paso, Tarea, Título, Complejidad, Depende
+de y Estado, en orden de dependencias (ninguna tarea antes que sus predecesoras;
+a igualdad, la del hito anterior y luego la de número menor), y un resumen de
+lo que está en marcha y lo que está listo para empezar. Un ciclo de
+dependencias no aborta nada: sale en una sección «Dependencias circulares» y
+como aviso. No lleva fecha, así que una transición que no cambia nada no lo
+toca.
+
+**Cuándo.** `new`, `plan`, `approve` y `finish` (tras el merge) lo regeneran
+dentro de su propio commit, solo cuando ese commit cae en la rama de
+integración (`rama_base`). `start`, `review` y el resto commitean en la rama de
+la tarea y no lo tocan: por eso dos ramas en paralelo nunca chocan en él. Si
+añadirlo al commit falla, se avisa y la transición sigue sin él.
+
+**La marca.** Su tercera línea es exactamente
+`<!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->`
+(se compara la línea entera, ignorando CRLF; nunca por subcadena).
+
+**La regla de no pisar.** Las transiciones solo escriben el fichero si lleva
+la marca o si no existe y nunca ha existido (`git log --all` no sabe nada de
+él). Nunca si no lleva la marca (es del proyecto, aunque lo genere otro
+script), si está en `rutas_sincronizacion`, si tiene cambios sin commitear
+(avisan), ni si en disco se llama con otras mayúsculas. Cualquier fallo al
+generarlo (una `tarea.md` ilegible, una zona manual sin cerrar) deja el
+fichero como estaba y solo avisa.
+
+**La zona manual.** Lo que va entre una línea que empieza por
+`<!-- manual:inicio` y la línea `<!-- manual:fin -->` se conserva byte a byte.
+Ahí van el motivo de cada hito y un `### Hn — título` por hito, que da el
+título y el orden de su tabla.
+
+**Comando.** `taskctl roadmap` muestra el que se generaría, sin escribir.
+`taskctl roadmap --comparar` lista, sin escribir nada, lo que difiere del
+actual (tareas, hitos, dependencias, estado y zona manual) y sale con 1 si hay
+diferencias. `taskctl roadmap --escribir` lo regenera sin commitear, aunque no
+exista o tenga historia; sobre uno sin la marca, solo si `--comparar` saldría
+limpio.
+
+**Migrar un proyecto que ya tiene el suyo.** Mientras no lleve la marca,
+`taskctl` lo deja en paz. Para pasarlo: `taskctl roadmap --comparar`, corregir
+lo que salga (normalmente, llevar a una zona manual los textos y los títulos
+de los hitos), repetir hasta que salga limpio, `taskctl roadmap --escribir`,
+revisar el diff, commitear y retirar el script propio. La guía está en la skill
+`task-workflow`, en `roadmap.md`. Con una versión vieja del plugin, un ROADMAP
+con la marca se queda desactualizado sin aviso.
+
 ## Problemas conocidos
 
 ### Un subagente se deniega con «Auto-Mode Bypass»
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index b2e70e6..b73cfeb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -186,12 +186,12 @@ que ha dejado de ser cierto es peor que no tenerlo.
 Claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`,
 `modo_flujo`, `excluir_de_revision`, `cierre_por_defecto`, las dos del remoto
 (`plataforma_remota`, `url_base_remoto`), las dos de verificacion
-(`comando_verificacion`, el comando de tests del proyecto que ejecutan los
-frenos, y `timeout_verificacion`) y las tres de sincronizacion de ficheros
-derivados tras cada transicion. Sin fichero, todo por defecto; un valor
-invalido de una clave conocida aborta todos los comandos, y una clave
-desconocida avisa y se ignora. La sincronizacion (y sus trampas: no usar un
-hook de pre-commit, codigo de salida 3) esta en [sincronizacion.md](sincronizacion.md).
+(`comando_verificacion`, los tests que ejecutan los frenos, y
+`timeout_verificacion`) y las tres de sincronizacion de ficheros derivados
+tras cada transicion. Sin fichero, todo por defecto; un valor invalido de una
+clave conocida aborta todos los comandos, y una clave desconocida avisa y se
+ignora. La sincronizacion y sus trampas, en [sincronizacion.md](sincronizacion.md).
+`tareas/ROADMAP.md` y su zona manual, en [roadmap.md](roadmap.md).
 
 **Freno de fin de turno.** Con `comando_verificacion` y una tarea en curso en
 la rama actual, el hook `Stop` lo ejecuta al terminar cada turno y, si no sale
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md
new file mode 100644
index 0000000..4adaba3
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/roadmap.md
@@ -0,0 +1,71 @@
+# ROADMAP de tareas (`tareas/ROADMAP.md`)
+
+Lee esto antes de editar `tareas/ROADMAP.md` a mano, si el proyecto ya tiene
+un ROADMAP propio o si un aviso de una transicion habla de el.
+
+## Que es
+
+Una tabla por hito (el campo `sprint` de cada tarea) con las columnas Paso,
+Tarea, Titulo, Complejidad, Depende de y Estado, mas un resumen de lo que
+esta **en marcha** y lo que esta **listo para empezar**. El orden sale de las
+dependencias: ninguna tarea va antes que aquellas de las que depende y, a
+igualdad, va primero la del hito anterior y luego la de numero menor. Las
+terminadas salen sin numero de paso. Un ciclo de dependencias no aborta
+nada: sale en una seccion "Dependencias circulares" y como aviso.
+
+## Cuando se regenera
+
+`new`, `plan`, `approve` y `finish` (tras el merge) lo regeneran dentro de su
+propio commit, pero solo cuando ese commit cae en la rama de integracion
+(`rama_base`). En la rama de una tarea no se toca nunca: por eso dos ramas en
+paralelo no chocan en el al cerrar. No lleva fecha: si nada cambia, no entra
+en el commit. A mano: `taskctl roadmap` lo muestra sin escribir y
+`taskctl roadmap --escribir` lo regenera (sin commitear).
+
+## La marca y la regla de no pisar
+
+La tercera linea de un ROADMAP generado es exactamente:
+
+    <!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->
+
+Se compara la linea entera, no un trozo. Las transiciones solo escriben el
+fichero si lleva esa marca o si no existe y nunca ha existido en git. No lo
+tocan nunca si:
+
+- no lleva la marca (es del proyecto, aunque lo genere otro script);
+- esta declarado en `rutas_sincronizacion` (lo regenera el comando del
+  proyecto);
+- tiene cambios sin commitear (avisan; commitealos o descartalos y regenera);
+- existio y se borro (avisan; `roadmap --escribir` lo recrea);
+- en disco se llama con otras mayusculas, p. ej. `Roadmap.md`.
+
+Si algo falla al generarlo (una `tarea.md` ilegible, una zona manual sin
+cerrar), el fichero se queda como estaba, la transicion sigue y se avisa.
+
+## La zona manual
+
+Todo lo que va entre una linea que empieza por `<!-- manual:inicio` (y acaba
+en `-->`) y la linea `<!-- manual:fin -->` se conserva byte a byte. Ahi van
+el motivo de cada hito y lo que quieras escribir a mano. Un `### Hn — titulo`
+por hito dentro de la zona da el titulo de la tabla de ese hito y su orden:
+los hitos salen en el orden de esos titulos, y los que no tienen, al final
+por numero. Fuera de la zona, cualquier edicion se pierde en la siguiente
+regeneracion.
+
+## Migrar un proyecto que ya tiene su ROADMAP
+
+Mientras el ROADMAP propio no lleve la marca, taskctl lo deja en paz. Para
+pasarlo al de taskctl:
+
+1. `taskctl roadmap --comparar`: genera en seco y lista, sin escribir nada,
+   lo que difiere del actual (tareas, hitos, dependencias, estado y zona
+   manual). Sale con 1 si hay diferencias.
+2. Corrige lo que salga: normalmente, mover a una zona manual los textos y
+   los `### Hn — titulo` de los hitos, o arreglar dependencias y estados que
+   el script propio calculaba distinto.
+3. Cuando `--comparar` salga limpio, `taskctl roadmap --escribir` lo
+   sustituye (con la marca y conservando la zona manual). Sin comparacion
+   limpia se niega. Revisa el diff, commitealo y retira el script propio.
+
+Con una version vieja del plugin, un ROADMAP con la marca se queda
+desactualizado sin aviso: actualiza el plugin en todas las maquinas.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 4a49fb5..692836b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -7,6 +7,7 @@ import { runNewCommand, NewTaskArgError } from './commands/new.js';
 import { TaskIdError } from './core/task-id.js';
 import { runImportCommand, ImportCommandError } from './commands/import.js';
 import { runBoardCommand, BoardCommandError } from './commands/board.js';
+import { runRoadmapCommand, RoadmapCommandError } from './commands/roadmap.js';
 import { runMetricasCommand, MetricasCommandError } from './commands/metricas.js';
 import { runStartCommand, StartCommandError } from './commands/start.js';
 import { runPlanCommand, PlanCommandError, type PlanCommandResult } from './commands/plan.js';
@@ -75,6 +76,7 @@ Uso:
                  [--sprint N] [--complejidad ...] [--modelo-sugerido ...] \\
                  [--agente-revisor ...]
   taskctl board [--sprint N] [--asignado-a <persona>] [--escribir]
+  taskctl roadmap [--comparar | --escribir]
   taskctl metricas [--heuristica] [--tokens [--escribir]] [--repo <ruta>]...
   taskctl metricas [--evolucion [--tramo N]] [--grupos] [--por-version] [--json] [--repo <ruta>]...
   taskctl start TASK-NNN [--asignado-a <persona>] [--push]
@@ -98,8 +100,16 @@ Uso:
   taskctl recover [<rama>]
   taskctl abort-merge
 
-Comandos: new, import, board, metricas, start, plan, approve, review, codex-review, veredicto,
+Comandos: new, import, board, roadmap, metricas, start, plan, approve, review, codex-review, veredicto,
 finish, siguiente, doctor, doctor-deploy, pausa, registrar-coste, cadena.
+roadmap genera tareas/ROADMAP.md (hitos por sprint, orden por dependencias, complejidad, estado y
+lo que esta en marcha o listo para empezar). new, plan, approve y finish lo regeneran en su commit
+cuando cae en la rama de integracion, pero solo si lleva la marca de taskctl en su tercera linea o
+si nunca ha existido; uno ajeno, con cambios sin commitear o declarado en rutas_sincronizacion no se
+toca. La zona manual (entre <!-- manual:inicio ... --> y <!-- manual:fin -->) se conserva tal cual.
+Sin flags lo muestra sin escribir; --comparar lista sin escribir lo que difiere del actual (tareas,
+hitos, dependencias, estado, zona manual) y sale con 1 si hay diferencias; --escribir lo regenera
+(sin commitear), y sobre uno sin la marca solo si --comparar saldria limpio.
 metricas saca, por tarea, cuanto duro cada fase (diseno, curso, revision) y
 cuantas rondas de revision hubo, con sus hallazgos CRITICO/IMPORTANTE/MENOR y su
 origen (cada uno una vez por tarea: revisor + ID; un informe sin tabla es sin dato,
@@ -501,6 +511,21 @@ async function mainComando(argvEntrada: readonly string[]): Promise<number> {
     }
   }
 
+  if (cmd === 'roadmap') {
+    try {
+      const result = runRoadmapCommand(process.cwd(), argv.slice(1));
+      printAvisos(...result.avisos);
+      process.stdout.write(result.salida);
+      return result.codigo;
+    } catch (e) {
+      if (e instanceof RoadmapCommandError || e instanceof ConfigError) {
+        printCliError(e);
+        return 1;
+      }
+      throw e;
+    }
+  }
+
   if (cmd === 'board') {
     const repoCwd = process.cwd();
     const tareasRoot = path.join(repoCwd, 'tareas');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index 249bd04..381a01b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -112,6 +112,7 @@ const FLAGS_SIN_VALOR: readonly string[] = [
   '--json',
   '--forzar',
   '--escribir',
+  '--comparar',
   '--crear-tareas',
   '--heuristica',
   '--merge-request',
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
index e6e0fff..f75aeb1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts
@@ -228,6 +228,8 @@ export async function runApproveCommand(
     rutas: [path.dirname(filePath), path.dirname(newFilePath)],
     mensaje: mensajeChore(task.id, 'plan aprobado'),
     push,
+    // TASK-098: solo surte efecto si el commit cae en la rama de integracion.
+    roadmap: true,
   });
 
   return { id: task.id, filePath: newFilePath, baseBranchGuard, autoCommit: commitResult, avisos };
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
index a59f7f4..7baad7c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts
@@ -709,6 +709,9 @@ export async function runFinishCommand(
     ],
     mensaje: mensajeChore(task.id, 'tarea terminada y artefactos de cierre'),
     push,
+    // TASK-098: tras el merge, en la rama de integracion. En la rama de la
+    // tarea el ROADMAP no se toca nunca: por eso dos ramas no chocan en el.
+    roadmap: true,
   });
   if (commitResult.commiteado) volcado.olvidar();
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
index c6ee094..5c0748f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts
@@ -376,6 +376,8 @@ export async function runNewCommand(
     rutas: [path.dirname(filePath)],
     mensaje: mensajeChore(id, 'tarea creada'),
     push,
+    // TASK-098: solo surte efecto si el commit cae en la rama de integracion.
+    roadmap: true,
   });
   return {
     conContenido: cuerpo !== DEFAULT_BODY,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
index 25f1cd3..cbc428c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts
@@ -1043,6 +1043,8 @@ export async function runPlanCommand(
     rutas: [path.dirname(filePath), path.dirname(newFilePath)],
     mensaje: mensajeChore(task.id, 'tarea en diseno'),
     push,
+    // TASK-098: solo surte efecto si el commit cae en la rama de integracion.
+    roadmap: true,
   });
 
   // Las rutas del brainstorm se recalculan contra la carpeta de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
new file mode 100644
index 0000000..3c2864f
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
@@ -0,0 +1,120 @@
+/**
+ * `taskctl roadmap [--comparar | --escribir]` (TASK-098).
+ *
+ * - Sin flags: genera el ROADMAP en seco y lo saca por stdout. No escribe.
+ * - `--comparar`: genera en seco y lista lo que difiere del
+ *   `tareas/ROADMAP.md` actual (tareas, hitos, dependencias, estado y zona
+ *   manual). No escribe nada. Es la comprobacion previa a migrar un
+ *   proyecto que ya tiene su propio ROADMAP.
+ * - `--escribir`: la salida explicita. Escribe aunque el fichero no exista
+ *   o tenga historia en git; sobre un ROADMAP sin la marca de taskctl solo
+ *   lo sustituye si `--comparar` saldria limpio. Nunca toca uno declarado
+ *   en `rutas_sincronizacion` ni uno con cambios sin commitear. No
+ *   commitea: el fichero queda en el arbol para que la persona lo revise.
+ */
+import { existsSync, readFileSync } from 'node:fs';
+import path from 'node:path';
+import { rechazarFlagsDesconocidos } from '../cli/args.js';
+import { resolverConfigConAvisos } from '../core/config.js';
+import { compararRoadmaps } from '../core/roadmap-comparar.js';
+import { llevaMarcaTaskctl, ROADMAP_RUTA } from '../core/roadmap.js';
+import { generarDesdeDisco, prepararRoadmap, roadmapEnSincronizacion, type ResultadoRoadmap } from '../fs/roadmap.js';
+
+export class RoadmapCommandError extends Error {}
+
+const FLAGS_ROADMAP = ['--comparar', '--escribir'] as const;
+
+export interface RoadmapCommandResult {
+  modo: 'mostrar' | 'comparar' | 'escribir';
+  /** Lo que se saca por stdout. */
+  salida: string;
+  avisos: string[];
+  /** Codigo de salida: 0 bien; 1 si --comparar encontro diferencias o --escribir no escribio. */
+  codigo: 0 | 1;
+  /** Solo con --escribir. */
+  resultado: ResultadoRoadmap | null;
+}
+
+export function runRoadmapCommand(repoCwd: string, argv: readonly string[]): RoadmapCommandResult {
+  rechazarFlagsDesconocidos(argv, FLAGS_ROADMAP, 'roadmap', (m) => new RoadmapCommandError(m));
+  const posicional = argv.find((a) => !a.startsWith('-'));
+  if (posicional !== undefined) {
+    throw new RoadmapCommandError(`[ERROR] taskctl roadmap no admite argumentos sueltos ("${posicional}").`);
+  }
+  const comparar = argv.includes('--comparar');
+  const escribir = argv.includes('--escribir');
+  if (comparar && escribir) {
+    throw new RoadmapCommandError(
+      '[ERROR] taskctl roadmap: --comparar y --escribir no van juntos. Compara primero y escribe despues.'
+    );
+  }
+
+  const ruta = path.join(repoCwd, 'tareas', 'ROADMAP.md');
+
+  if (escribir) {
+    const r = prepararRoadmap(repoCwd, 'escribir');
+    const lineas: string[] = [];
+    if (r.estado === 'escrito') {
+      lineas.push(`Regenerado ${ROADMAP_RUTA} (sin commitear: revisalo y commitealo).`);
+    } else if (r.estado === 'sin-cambios') {
+      lineas.push(`${ROADMAP_RUTA} ya esta al dia: no se ha tocado.`);
+    } else {
+      lineas.push(`No se ha escrito ${ROADMAP_RUTA}: ${r.motivo ?? 'motivo desconocido'}`);
+      if (r.diferencias.length > 0) {
+        lineas.push('', 'Diferencias con el que se generaria:', ...r.diferencias.map((d) => `  - ${d}`));
+      }
+    }
+    return {
+      modo: 'escribir',
+      salida: `${lineas.join('\n')}\n`,
+      // El motivo de un omitido ya va en la salida; no se repite como aviso.
+      avisos: r.estado === 'omitido' ? r.avisos.filter((a) => a !== r.motivo) : r.avisos,
+      codigo: r.estado === 'escrito' || r.estado === 'sin-cambios' ? 0 : 1,
+      resultado: r,
+    };
+  }
+
+  const actual = existsSync(ruta) ? readFileSync(ruta, 'utf8') : null;
+  let generado: { texto: string; avisos: string[] };
+  try {
+    generado = generarDesdeDisco(repoCwd, actual);
+  } catch (e: unknown) {
+    throw new RoadmapCommandError(
+      `[ERROR] taskctl roadmap: no se puede generar el ROADMAP: ${e instanceof Error ? e.message : String(e)}.`
+    );
+  }
+
+  if (!comparar) {
+    return { modo: 'mostrar', salida: generado.texto, avisos: generado.avisos, codigo: 0, resultado: null };
+  }
+
+  const lineas: string[] = [];
+  if (actual === null) {
+    lineas.push(
+      `${ROADMAP_RUTA} no existe: no hay nada que comparar. "taskctl roadmap" muestra el que se generaria.`
+    );
+    return { modo: 'comparar', salida: `${lineas.join('\n')}\n`, avisos: generado.avisos, codigo: 0, resultado: null };
+  }
+
+  const { config } = resolverConfigConAvisos(repoCwd);
+  if (roadmapEnSincronizacion(config)) {
+    lineas.push(`${ROADMAP_RUTA} esta declarado en rutas_sincronizacion: las transiciones no lo tocan.`);
+  } else if (llevaMarcaTaskctl(actual)) {
+    lineas.push(`${ROADMAP_RUTA} lleva la marca de taskctl: las transiciones lo regeneran.`);
+  } else {
+    lineas.push(`${ROADMAP_RUTA} no lleva la marca de taskctl: las transiciones no lo tocan.`);
+  }
+  const diferencias = compararRoadmaps(actual, generado.texto);
+  if (diferencias.length === 0) {
+    lineas.push('Sin diferencias en tareas, hitos, dependencias, estado ni zona manual.');
+  } else {
+    lineas.push(`${diferencias.length} diferencia(s) con el que generaria taskctl:`, ...diferencias.map((d) => `  - ${d}`));
+  }
+  return {
+    modo: 'comparar',
+    salida: `${lineas.join('\n')}\n`,
+    avisos: generado.avisos,
+    codigo: diferencias.length === 0 ? 0 : 1,
+    resultado: null,
+  };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
index ad306a3..e08494a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/start.ts
@@ -303,6 +303,8 @@ export async function runStartCommand(
   // confirmada arriba. "start" NO aplica ensureBaseBranchReady: aqui
   // puede haber trabajo de la persona en el arbol, y por eso el commit
   // se limita a las dos carpetas de la tarea y a nada mas.
+  // TASK-098: sin ROADMAP. Este commit cae siempre en la rama de la tarea
+  // (comprobado arriba), y el ROADMAP solo se regenera en la de integracion.
   const commitResult = autoCommit({
     cwd: deps.repoCwd,
     rutas: [path.dirname(filePath), path.dirname(newFilePath)],
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 4c4ee82..5ee5e3b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -279,8 +279,11 @@ export const CLAVES_CONFIG = [
  * ahi haria que el comando del proyecto y el CLI escribieran lo mismo.
  *
  * Excepcion (TASK-092): un fichero suelto directamente en la raiz de
- * tareas/ (p. ej. tareas/ROADMAP.md). taskctl solo escribe dentro de las
- * carpetas de estado (tareas/0N-*), asi que ahi no hay choque posible.
+ * tareas/ (p. ej. tareas/ROADMAP.md). Fuera de las carpetas de estado
+ * (tareas/0N-*) taskctl solo escribe un fichero, tareas/ROADMAP.md
+ * (TASK-098), y solo si lleva su marca o nunca ha existido; si el
+ * proyecto lo declara aqui, taskctl no lo toca (fs/roadmap.ts), asi que
+ * tampoco hay choque posible.
  * La comparacion no distingue mayusculas: en Windows y macOS `Tareas/` y
  * `.GIT/` son las mismas carpetas.
  */
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
new file mode 100644
index 0000000..40835ba
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap-comparar.ts
@@ -0,0 +1,161 @@
+/**
+ * Comparacion estructural de dos ROADMAP (TASK-098), pura.
+ *
+ * Es la comprobacion previa a migrar un proyecto que ya tiene su propio
+ * ROADMAP: no compara bytes (la cabecera y los textos de cada generador
+ * difieren a proposito) sino lo que importa — que tareas salen, en que
+ * hito, de que dependen, en que estado, los titulos de los hitos y la
+ * zona manual.
+ *
+ * El extractor es tolerante: lee las filas `| Paso | TASK-NNN | ... |`
+ * bajo un `## Hn` fuera de la zona manual. Lo que parece una fila de
+ * tarea y no casa con ese formato se declara "no comparable" en vez de
+ * ignorarlo en silencio.
+ */
+import { extraerZonaManual, normalizarFinales } from './roadmap.js';
+
+export interface FilaRoadmap {
+  hito: number;
+  titulo: string;
+  dependencias: string[];
+  estado: string;
+}
+
+export interface EstructuraRoadmap {
+  tareas: Map<string, FilaRoadmap>;
+  /** Numero de hito -> titulo de su `## Hn — titulo`. */
+  hitos: Map<number, string>;
+  zonaManual: string | null;
+  /** Lineas que parecen filas de tarea pero no se han podido leer. */
+  noComparables: string[];
+}
+
+/** Separa las celdas de una fila de tabla Markdown respetando los `\|` escapados. */
+function celdas(linea: string): string[] {
+  const cuerpo = linea.trim().replace(/^\|/, '').replace(/\|$/, '');
+  const out: string[] = [];
+  let actual = '';
+  for (let i = 0; i < cuerpo.length; i++) {
+    const c = cuerpo[i];
+    if (c === '\\' && cuerpo[i + 1] === '|') {
+      actual += '|';
+      i++;
+    } else if (c === '|') {
+      out.push(actual.trim());
+      actual = '';
+    } else {
+      actual += c;
+    }
+  }
+  out.push(actual.trim());
+  return out;
+}
+
+function listaDeps(celda: string): string[] {
+  return celda
+    .split(',')
+    .map((d) => d.trim())
+    .filter((d) => d !== '' && d !== '—' && d !== '-');
+}
+
+/** Extrae la estructura de un ROADMAP. Lanza solo si la zona manual esta rota. */
+export function extraerEstructura(texto: string): EstructuraRoadmap {
+  const lf = normalizarFinales(texto);
+  const zonaManual = extraerZonaManual(lf);
+  const fuera = zonaManual === null ? lf : lf.replace(zonaManual, '');
+  const tareas = new Map<string, FilaRoadmap>();
+  const hitos = new Map<number, string>();
+  const noComparables: string[] = [];
+  let hito: number | null = null;
+  for (const linea of fuera.split('\n')) {
+    const h = /^## H(\d+)(?:\s+—\s+(.*))?\s*$/.exec(linea);
+    if (h !== null) {
+      hito = Number(h[1]);
+      hitos.set(hito, (h[2] ?? '').trim());
+      continue;
+    }
+    if (/^#{1,2} /.test(linea)) {
+      hito = null;
+      continue;
+    }
+    if (!linea.trimStart().startsWith('|') || !/TASK-\d+/.test(linea)) continue;
+    const cs = celdas(linea);
+    const id = cs[1] ?? '';
+    if (hito === null || cs.length !== 6 || !/^TASK-\d+$/.test(id)) {
+      noComparables.push(linea);
+      continue;
+    }
+    tareas.set(id, {
+      hito,
+      titulo: cs[2] ?? '',
+      dependencias: listaDeps(cs[4] ?? ''),
+      estado: cs[5] ?? '',
+    });
+  }
+  return { tareas, hitos, zonaManual, noComparables };
+}
+
+function numero(id: string): number {
+  return Number(/(\d+)$/.exec(id)?.[1] ?? Number.MAX_SAFE_INTEGER);
+}
+
+function mismaLista(a: readonly string[], b: readonly string[]): boolean {
+  const x = [...new Set(a)].sort();
+  const y = [...new Set(b)].sort();
+  return x.length === y.length && x.every((v, i) => v === y[i]);
+}
+
+/**
+ * Diferencias entre el ROADMAP actual y el que generaria taskctl, una
+ * por linea y en orden estable. Vacio = nada que perder al migrar.
+ */
+export function compararRoadmaps(actual: string, generado: string): string[] {
+  const a = extraerEstructura(actual);
+  const g = extraerEstructura(generado);
+  const difs: string[] = [];
+
+  if (a.zonaManual === null && g.zonaManual !== null) {
+    difs.push(
+      'zona manual: el ROADMAP actual no tiene (falta "<!-- manual:inicio ... -->" ... "<!-- manual:fin -->"); ' +
+        'el generado anade una por defecto. Pon en ella un "### Hn — titulo" por hito antes de migrar.'
+    );
+  } else if (a.zonaManual !== null && a.zonaManual !== g.zonaManual) {
+    difs.push('zona manual: el texto entre las marcas no coincide con el que se conservaria.');
+  }
+
+  const hitos = [...new Set([...a.hitos.keys(), ...g.hitos.keys()])].sort((x, y) => x - y);
+  for (const h of hitos) {
+    const ta = a.hitos.get(h);
+    const tg = g.hitos.get(h);
+    if (ta === undefined) difs.push(`hito H${h}: solo en el generado ("${tg}").`);
+    else if (tg === undefined) difs.push(`hito H${h}: solo en el actual ("${ta}").`);
+    else if (ta !== tg) difs.push(`hito H${h}: titulo "${ta}" en el actual y "${tg}" en el generado.`);
+  }
+
+  const ids = [...new Set([...a.tareas.keys(), ...g.tareas.keys()])].sort((x, y) => numero(x) - numero(y));
+  for (const id of ids) {
+    const fa = a.tareas.get(id);
+    const fg = g.tareas.get(id);
+    if (fa === undefined) {
+      difs.push(`${id}: solo en el generado (H${fg!.hito}).`);
+      continue;
+    }
+    if (fg === undefined) {
+      difs.push(`${id}: solo en el actual (H${fa.hito}).`);
+      continue;
+    }
+    if (fa.hito !== fg.hito) difs.push(`${id}: hito H${fa.hito} en el actual y H${fg.hito} en el generado.`);
+    if (!mismaLista(fa.dependencias, fg.dependencias)) {
+      const fmt = (l: readonly string[]): string => (l.length === 0 ? '—' : l.join(', '));
+      difs.push(
+        `${id}: depende de ${fmt(fa.dependencias)} en el actual y de ${fmt(fg.dependencias)} en el generado.`
+      );
+    }
+    if (fa.estado !== fg.estado) {
+      difs.push(`${id}: estado "${fa.estado}" en el actual y "${fg.estado}" en el generado.`);
+    }
+  }
+
+  for (const l of a.noComparables) difs.push(`fila no comparable en el actual: ${l.trim()}`);
+  return difs;
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts
new file mode 100644
index 0000000..d1b18b9
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/roadmap.ts
@@ -0,0 +1,342 @@
+/**
+ * ROADMAP de tareas (TASK-098): generacion pura, sin I/O.
+ *
+ * `tareas/ROADMAP.md` ordena las tareas por hito (campo `sprint`) y por
+ * dependencias: ninguna tarea va antes que aquellas de las que depende y,
+ * a igualdad, va primero la del hito anterior y luego la de numero menor.
+ * Lo que decide si el fichero se escribe vive en `fs/roadmap.ts`; aqui
+ * solo se calcula el texto.
+ *
+ * Tres invariantes que fijan los tests:
+ *
+ * 1. **La salida no lleva fecha ni hora.** Regenerar con las mismas
+ *    tareas da exactamente los mismos bytes, asi que una transicion que
+ *    no cambia nada del ROADMAP no lo mete en su commit.
+ * 2. **La marca de taskctl es una linea exacta en una posicion fija**
+ *    (la tercera). Se compara la linea entera, nunca por subcadena: un
+ *    ROADMAP de otro generador que mencione "taskctl" o "generado por"
+ *    en el cuerpo no se confunde con uno nuestro.
+ * 3. **La zona manual se conserva byte a byte**: lo que hay entre la
+ *    linea que empieza por `<!-- manual:inicio` y `<!-- manual:fin -->`,
+ *    ambas incluidas. De ahi salen tambien los titulos y el orden de los
+ *    hitos (`### Hn — titulo`).
+ */
+import type { TaskComplexity, TaskState } from './task.js';
+
+/** Ruta del ROADMAP relativa a la raiz del repo, con separadores POSIX. */
+export const ROADMAP_RUTA = 'tareas/ROADMAP.md';
+
+/** Linea exacta que marca un ROADMAP como generado por taskctl. La version del formato va dentro. */
+export const MARCA_TASKCTL =
+  '<!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->';
+
+/** Indice (base 0) de la linea donde tiene que estar la marca: la tercera. */
+export const LINEA_MARCA = 2;
+
+export const PREFIJO_MANUAL_INICIO = '<!-- manual:inicio';
+export const MANUAL_FIN = '<!-- manual:fin -->';
+
+/** Zona manual de un ROADMAP recien creado. */
+export const ZONA_MANUAL_POR_DEFECTO = [
+  '<!-- manual:inicio (se edita a mano; taskctl la conserva) -->',
+  '## Hitos',
+  '',
+  'Un `### Hn — título` por hito (n es el campo `sprint` de sus tareas), en el orden en que se hacen y con su ' +
+    'motivo debajo. taskctl conserva esta zona tal cual y toma de aquí los títulos y el orden de los hitos.',
+  MANUAL_FIN,
+].join('\n');
+
+export class RoadmapError extends Error {}
+
+/** Lo que el ROADMAP necesita de cada tarea. */
+export interface TareaRoadmap {
+  id: string;
+  titulo: string;
+  sprint: number;
+  complejidad: TaskComplexity | null;
+  estado: TaskState;
+  dependencias: readonly string[];
+}
+
+export interface RoadmapGenerado {
+  /** Texto completo, con finales de linea LF y un salto final. */
+  texto: string;
+  /** Ciclos de dependencias encontrados, cada uno como camino cerrado (A, B, A). */
+  ciclos: string[][];
+  /** Avisos no fatales (dependencias a tareas que no existen, ciclos). */
+  avisos: string[];
+}
+
+const ESTADOS_LEGIBLES: Partial<Record<TaskState, string>> = {
+  terminada: '✅ terminada',
+  'en-diseno': '▶ en diseño',
+  'en-curso': '▶ en curso',
+  'en-revision': '▶ en revisión',
+};
+
+const EN_MARCHA: readonly TaskState[] = ['en-diseno', 'en-curso', 'en-revision'];
+
+/** Quita el `\r` final de cada linea: las marcas se comparan ignorando CRLF. */
+export function normalizarFinales(texto: string): string {
+  return texto.replace(/\r\n/g, '\n');
+}
+
+/** true si la tercera linea es exactamente la marca de taskctl (ignorando CRLF). */
+export function llevaMarcaTaskctl(texto: string): boolean {
+  const lineas = normalizarFinales(texto).split('\n');
+  return lineas[LINEA_MARCA] === MARCA_TASKCTL;
+}
+
+/**
+ * La zona manual con sus dos marcas, tal cual esta en `texto` (ya
+ * normalizado a LF), o null si no tiene. Una marca de inicio sin la de
+ * fin, o una de fin suelta, es un ROADMAP roto: se lanza en vez de
+ * adivinar donde acaba, porque adivinar mal perderia texto de la persona.
+ */
+export function extraerZonaManual(texto: string): string | null {
+  const lf = normalizarFinales(texto);
+  const lineas = lf.split('\n');
+  const inicio = lineas.findIndex((l) => l.startsWith(PREFIJO_MANUAL_INICIO) && l.trimEnd().endsWith('-->'));
+  const finSuelto = lineas.indexOf(MANUAL_FIN);
+  if (inicio < 0) {
+    if (finSuelto >= 0) {
+      throw new RoadmapError(
+        `el ROADMAP tiene "${MANUAL_FIN}" sin la marca de inicio de la zona manual.`
+      );
+    }
+    return null;
+  }
+  const fin = lineas.indexOf(MANUAL_FIN, inicio + 1);
+  if (fin < 0) {
+    throw new RoadmapError(
+      `el ROADMAP abre la zona manual (linea ${inicio + 1}) y no la cierra con "${MANUAL_FIN}".`
+    );
+  }
+  return lineas.slice(inicio, fin + 1).join('\n');
+}
+
+/** Numero de hito -> titulo, en el orden de los `### Hn — titulo` de la zona manual (gana el primero). */
+export function titulosDeHitos(zonaManual: string | null): Map<number, string> {
+  const titulos = new Map<number, string>();
+  if (zonaManual === null) return titulos;
+  for (const m of normalizarFinales(zonaManual).matchAll(/^### H(\d+) — (.+)$/gm)) {
+    const n = Number(m[1]);
+    if (!titulos.has(n)) titulos.set(n, (m[2] ?? '').trim());
+  }
+  return titulos;
+}
+
+function numeroDe(id: string): number {
+  const m = /(\d+)$/.exec(id);
+  return m === null ? Number.MAX_SAFE_INTEGER : Number(m[1]);
+}
+
+function comparar(a: readonly number[], b: readonly number[]): number {
+  for (let i = 0; i < a.length; i++) {
+    const d = (a[i] ?? 0) - (b[i] ?? 0);
+    if (d !== 0) return d;
+  }
+  return 0;
+}
+
+/**
+ * Orden topologico estable (Kahn con prioridad): de las tareas sin
+ * predecesoras pendientes sale primero la de clave menor (rango del hito,
+ * hito, numero). Las que quedan dentro de un ciclo no salen nunca por
+ * Kahn: se devuelven aparte, en orden de clave.
+ */
+function ordenar(
+  tareas: ReadonlyMap<string, TareaRoadmap>,
+  rango: ReadonlyMap<number, number>
+): { orden: string[]; atascadas: string[] } {
+  const clave = (id: string): number[] => {
+    const t = tareas.get(id)!;
+    return [rango.get(t.sprint) ?? Number.MAX_SAFE_INTEGER, t.sprint, numeroDe(id)];
+  };
+  const pendientes = new Map<string, Set<string>>();
+  const dependientes = new Map<string, string[]>();
+  for (const id of tareas.keys()) dependientes.set(id, []);
+  for (const [id, t] of tareas) {
+    const ds = new Set(t.dependencias.filter((d) => d !== id && tareas.has(d)));
+    pendientes.set(id, ds);
+    for (const d of ds) dependientes.get(d)!.push(id);
+  }
+  // Las tareas de un repo son decenas o pocos cientos: una lista ordenada
+  // en cada paso basta y se lee mejor que un monticulo.
+  const listas = [...tareas.keys()].filter((id) => pendientes.get(id)!.size === 0);
+  const orden: string[] = [];
+  while (listas.length > 0) {
+    listas.sort((a, b) => comparar(clave(a), clave(b)));
+    const id = listas.shift()!;
+    orden.push(id);
+    for (const s of dependientes.get(id)!) {
+      const ps = pendientes.get(s)!;
+      ps.delete(id);
+      if (ps.size === 0) listas.push(s);
+    }
+  }
+  const vistos = new Set(orden);
+  const atascadas = [...tareas.keys()]
+    .filter((id) => !vistos.has(id))
+    .sort((a, b) => comparar(clave(a), clave(b)));
+  return { orden, atascadas };
+}
+
+/** Ciclos entre las tareas atascadas, cada uno como camino cerrado. Deduplicados por sus miembros. */
+function buscarCiclos(tareas: ReadonlyMap<string, TareaRoadmap>, atascadas: readonly string[]): string[][] {
+  const dentro = new Set(atascadas);
+  const color = new Map<string, 1 | 2>();
+  const pila: string[] = [];
+  const ciclos: string[][] = [];
+  const firmas = new Set<string>();
+  const visitar = (u: string): void => {
+    color.set(u, 1);
+    pila.push(u);
+    const ds = [...new Set(tareas.get(u)!.dependencias)].filter((d) => dentro.has(d)).sort();
+    for (const v of ds) {
+      const c = color.get(v);
+      if (c === 1) {
+        const ciclo = [...pila.slice(pila.indexOf(v)), v];
+        const firma = [...new Set(ciclo)].sort().join(',');
+        if (!firmas.has(firma)) {
+          firmas.add(firma);
+          ciclos.push(ciclo);
+        }
+      } else if (c === undefined) {
+        visitar(v);
+      }
+    }
+    color.set(u, 2);
+    pila.pop();
+  };
+  for (const u of [...atascadas].sort()) if (!color.has(u)) visitar(u);
+  return ciclos;
+}
+
+function celda(texto: string): string {
+  return texto.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
+}
+
+/**
+ * Genera el ROADMAP completo. `zonaManual` es la del fichero actual (que
+ * se conserva tal cual) o null para usar la de por defecto. Nunca lanza
+ * por los datos: un ciclo o una dependencia a una tarea inexistente se
+ * informan y la generacion sigue.
+ */
+export function generarRoadmap(
+  lista: readonly TareaRoadmap[],
+  zonaManual: string | null
+): RoadmapGenerado {
+  const manual = zonaManual === null ? ZONA_MANUAL_POR_DEFECTO : normalizarFinales(zonaManual);
+  const titulos = titulosDeHitos(manual);
+  const rango = new Map<number, number>([...titulos.keys()].map((h, i) => [h, i]));
+
+  const tareas = new Map<string, TareaRoadmap>();
+  for (const t of [...lista].sort((a, b) => numeroDe(a.id) - numeroDe(b.id) || a.id.localeCompare(b.id))) {
+    if (!tareas.has(t.id)) tareas.set(t.id, t);
+  }
+
+  const avisos: string[] = [];
+  for (const t of tareas.values()) {
+    for (const d of t.dependencias) {
+      if (!tareas.has(d)) avisos.push(`${t.id} depende de ${d}, que no existe en tareas/.`);
+    }
+  }
+
+  const { orden, atascadas } = ordenar(tareas, rango);
+  const ciclos = buscarCiclos(tareas, atascadas);
+  for (const c of ciclos) avisos.push(`dependencia circular: ${c.join(' -> ')}.`);
+  if (ciclos.length === 0 && atascadas.length > 0) {
+    // Imposible por construccion (lo que Kahn no saca depende de un ciclo),
+    // pero si pasa se dice en vez de callarlo.
+    avisos.push(`tareas que dependen de un ciclo: ${atascadas.join(', ')}.`);
+  }
+  const todas = [...orden, ...atascadas];
+
+  const estado = (id: string): TaskState => tareas.get(id)!.estado;
+  const espera = (id: string): string[] =>
+    tareas.get(id)!.dependencias.filter((d) => tareas.has(d) && estado(d) !== 'terminada');
+  const legible = (id: string): string => {
+    const fijo = ESTADOS_LEGIBLES[estado(id)];
+    if (fijo !== undefined) return fijo;
+    const e = espera(id);
+    return e.length > 0 ? `espera a ${e.join(', ')}` : 'lista para empezar';
+  };
+
+  const enMarcha = todas.filter((id) => EN_MARCHA.includes(estado(id)));
+  const listas = todas.filter((id) => estado(id) === 'planificada' && espera(id).length === 0);
+
+  const lineas: string[] = [
+    '# Roadmap de tareas',
+    '',
+    MARCA_TASKCTL,
+    '',
+    manual,
+    '',
+    '## Estado del trabajo',
+    '',
+    'Orden en que se hacen las tareas, agrupadas por hito (campo `sprint` de cada tarea). Sale de las ' +
+      'dependencias: ninguna tarea va antes que aquellas de las que depende y, a igualdad, va primero la del ' +
+      'hito anterior (en el orden de los `### Hn — título` de la zona manual) y luego la de número menor. ' +
+      'taskctl lo regenera en cada transición que cae en la rama de integración; solo la zona manual se edita a mano.',
+    '',
+    '- **En marcha:** ' +
+      (enMarcha.length === 0
+        ? 'ninguna'
+        : enMarcha.map((id) => `${id} (${(ESTADOS_LEGIBLES[estado(id)] ?? '').slice(2)})`).join(', ')),
+    '- **Listas para empezar:** ' + (listas.length === 0 ? 'ninguna' : listas.join(', ')),
+    '',
+  ];
+
+  const porHito = new Map<number, string[]>();
+  for (const id of todas) {
+    const h = tareas.get(id)!.sprint;
+    if (!porHito.has(h)) porHito.set(h, []);
+    porHito.get(h)!.push(id);
+  }
+  const hitos = [...porHito.keys()].sort(
+    (a, b) => (rango.get(a) ?? Number.MAX_SAFE_INTEGER) - (rango.get(b) ?? Number.MAX_SAFE_INTEGER) || a - b
+  );
+
+  // El paso es la posicion en el orden global (sin las terminadas), no en el
+  // de las tablas: una tarea de un hito anterior que depende de otra de uno
+  // posterior sale en su tabla, pero con el paso que le toca.
+  const pasos = new Map<string, number>();
+  for (const id of todas) if (estado(id) !== 'terminada') pasos.set(id, pasos.size + 1);
+
+  for (const h of hitos) {
+    const ids = porHito.get(h)!;
+    const hechas = ids.filter((id) => estado(id) === 'terminada').length;
+    lineas.push(
+      `## H${h} — ${titulos.get(h) ?? `H${h}`}`,
+      '',
+      `${hechas} de ${ids.length} terminadas.`,
+      '',
+      '| Paso | Tarea | Título | Complejidad | Depende de | Estado |',
+      '|---|---|---|---|---|---|'
+    );
+    for (const id of ids) {
+      const t = tareas.get(id)!;
+      const n = pasos.has(id) ? String(pasos.get(id)) : '—';
+      const deps = t.dependencias.length === 0 ? '—' : t.dependencias.join(', ');
+      lineas.push(
+        `| ${n} | ${id} | ${celda(t.titulo)} | ${t.complejidad ?? '—'} | ${deps} | ${legible(id)} |`
+      );
+    }
+    lineas.push('');
+  }
+
+  if (ciclos.length > 0) {
+    lineas.push(
+      '## Dependencias circulares',
+      '',
+      'Estas tareas dependen unas de otras en círculo y ninguna puede empezar hasta que se rompa el ciclo ' +
+        '(quita una de las dependencias del campo `dependencias`). Van al final de su hito.',
+      '',
+      ...ciclos.map((c) => `- ${c.join(' → ')}`),
+      ''
+    );
+  }
+
+  return { texto: lineas.join('\n'), ciclos, avisos };
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
index 5fcf2c2..a158e25 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
@@ -46,8 +46,10 @@
  */
 import { existsSync } from 'node:fs';
 import path from 'node:path';
-import { resolverConfig } from '../core/config.js';
+import { resolverConfig, resolverConfigConAvisos } from '../core/config.js';
+import { ROADMAP_RUTA } from '../core/roadmap.js';
 import { GitCommandError, currentBranch, isRemoteAvailable, runGit } from './git.js';
+import { prepararRoadmap, restaurarRoadmap, type ResultadoRoadmap } from './roadmap.js';
 import {
   ejecutarSincronizacion,
   sincronizacionFallidaAlPreparar,
@@ -87,6 +89,13 @@ export interface AutoCommitOptions {
   push?: boolean;
   /** Solo para tests: opciones de la sincronizacion (timeout corto). */
   sincronizacion?: OpcionesSincronizacion;
+  /**
+   * TASK-098: regenerar `tareas/ROADMAP.md` dentro de este commit. Solo
+   * surte efecto si el commit cae en la rama de integracion (`rama_base`):
+   * en la rama de una tarea no se toca, y asi dos ramas en paralelo nunca
+   * chocan en el. Las reglas de si se escribe viven en fs/roadmap.ts.
+   */
+  roadmap?: boolean;
 }
 
 export interface AutoCommitResult {
@@ -103,6 +112,8 @@ export interface AutoCommitResult {
   sincronizacion: ResultadoSincronizacion;
   /** Avisos no fatales, para que el CLI los saque por stderr. */
   avisos: readonly string[];
+  /** TASK-098: que paso con el ROADMAP, o null si no se pidio o no tocaba en esta rama. */
+  roadmap: ResultadoRoadmap | null;
 }
 
 /**
@@ -227,9 +238,34 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
   }
   avisos.push(...sincronizacion.avisos);
 
+  // TASK-098: el ROADMAP se prepara aparte, como las rutas de
+  // sincronizacion: si su `git add` falla, se restaura el fichero, se
+  // avisa y el commit de la tarea sigue adelante sin el.
+  const roadmap = opts.roadmap === true && rutasComando.length > 0 ? regenerarRoadmap(cwd, rama) : null;
+  const rutasRoadmap: string[] = [];
+  if (roadmap !== null) {
+    avisos.push(...roadmap.avisos);
+    if (roadmap.estado === 'escrito') {
+      try {
+        runGit(['add', '--', ROADMAP_RUTA], cwd);
+        rutasRoadmap.push(ROADMAP_RUTA);
+      } catch (e: unknown) {
+        try {
+          restaurarRoadmap(roadmap);
+        } catch {
+          // Si ni siquiera se puede restaurar, el aviso de abajo lo cuenta.
+        }
+        avisos.push(
+          `${ROADMAP_RUTA} se regenero pero no se pudo preparar para el commit (${detalleDeError(e)}): ` +
+            'se ha dejado como estaba y la transicion sigue sin el. Regeneralo con "taskctl roadmap --escribir".'
+        );
+      }
+    }
+  }
+
   // Deduplicadas y ordenadas para que el commando de Git sea
   // determinista (y los tests puedan aseverar sobre el).
-  const rutasRel = [...new Set([...rutasComando, ...rutasSync])].sort();
+  const rutasRel = [...new Set([...rutasComando, ...rutasSync, ...rutasRoadmap])].sort();
   const presentes = rutasRel.filter((r) => tieneAlgoQuePreparar(cwd, r));
 
   let commiteado = false;
@@ -312,9 +348,24 @@ export function autoCommit(opts: AutoCommitOptions): AutoCommitResult {
     push: empujar(opts, rama, avisos),
     sincronizacion,
     avisos,
+    roadmap,
   };
 }
 
+/**
+ * Solo en la rama de integracion. Cualquier excepcion (config ilegible a
+ * estas alturas) se traga como "no tocaba": un ROADMAP no tumba nunca una
+ * transicion. prepararRoadmap ya no lanza; esto cubre lo de antes.
+ */
+function regenerarRoadmap(cwd: string, rama: string): ResultadoRoadmap | null {
+  try {
+    if (rama === '' || rama !== resolverConfigConAvisos(cwd).config.rama_base) return null;
+  } catch {
+    return null;
+  }
+  return prepararRoadmap(cwd, 'transicion');
+}
+
 /**
  * Cualquier excepcion de la sincronizacion (config ilegible a estas
  * alturas, un `git status` que falla) se convierte en 'fallida': para
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
new file mode 100644
index 0000000..b70576b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/roadmap.ts
@@ -0,0 +1,242 @@
+/**
+ * ROADMAP de tareas en disco (TASK-098): el UNICO sitio que decide si
+ * `tareas/ROADMAP.md` se escribe.
+ *
+ * Regla numero uno: taskctl no pisa un ROADMAP ajeno. Las transiciones
+ * solo escriben el fichero si:
+ *   - lleva la marca de taskctl en su linea fija, o
+ *   - no existe y nunca ha existido (`git log --all` no sabe nada de el).
+ * Y nunca si:
+ *   - esta declarado en `rutas_sincronizacion` (lo regenera el proyecto);
+ *   - tiene cambios sin commitear (se avisa: pisarlos seria perderlos);
+ *   - en disco se llama distinto (p. ej. `Roadmap.md`): en Windows y macOS
+ *     escribir `ROADMAP.md` lo sobrescribiria.
+ *
+ * Generacion tolerante: una tarea.md ilegible, una zona manual rota o
+ * cualquier fallo dejan el fichero como estaba y solo avisan. Para cuando
+ * se llega aqui la transicion ya esta hecha (en `finish`, el merge
+ * tambien), y un ROADMAP no puede tumbarla. Los ciclos y las dependencias
+ * a tareas inexistentes no son fallos: se informan y se escribe.
+ *
+ * E/S sincrona a proposito: se llama desde `autoCommit`, que es sincrono.
+ */
+import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
+import path from 'node:path';
+import { resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
+import { compararRoadmaps } from '../core/roadmap-comparar.js';
+import {
+  extraerZonaManual,
+  generarRoadmap,
+  llevaMarcaTaskctl,
+  ROADMAP_RUTA,
+  type TareaRoadmap,
+} from '../core/roadmap.js';
+import { STATE_FOLDER, TASK_STATES } from '../core/task.js';
+import { parseTareaFile } from '../core/tarea-file.js';
+import { runGit } from './git.js';
+
+const NOMBRE = 'ROADMAP.md';
+const TASK_DIR_RE = /^TASK-\d{3,}$/;
+
+/** Para que se prepara: una transicion (reglas estrictas) o `taskctl roadmap --escribir` (explicito). */
+export type ModoRoadmap = 'transicion' | 'escribir';
+
+export interface ResultadoRoadmap {
+  /**
+   * - escrito: el fichero cambio en disco (ruta y anterior rellenos);
+   * - sin-cambios: se genero y coincide byte a byte con el actual;
+   * - omitido: las reglas dicen que no se toca (motivo en `motivo`);
+   * - fallido: algo fallo al generar; el fichero queda como estaba.
+   */
+  estado: 'escrito' | 'sin-cambios' | 'omitido' | 'fallido';
+  /** Ruta absoluta del ROADMAP (aunque no se haya escrito). */
+  ruta: string;
+  /** Contenido previo, o null si no existia. Para restaurarlo si su `git add` falla. */
+  anterior: string | null;
+  motivo: string | null;
+  avisos: string[];
+  /** Diferencias que impidieron migrar un ROADMAP ajeno con `--escribir`. */
+  diferencias: string[];
+}
+
+export interface TareasLeidas {
+  tareas: TareaRoadmap[];
+  ilegibles: string[];
+}
+
+/** Lee el frontmatter de todas las tareas de las carpetas de estado. */
+export function leerTareasRoadmap(raiz: string): TareasLeidas {
+  const tareasRoot = path.join(raiz, 'tareas');
+  const tareas: TareaRoadmap[] = [];
+  const ilegibles: string[] = [];
+  const vistos = new Set<string>();
+  for (const estado of TASK_STATES) {
+    const dir = path.join(tareasRoot, STATE_FOLDER[estado]);
+    let entradas: string[];
+    try {
+      entradas = readdirSync(dir).sort();
+    } catch {
+      continue;
+    }
+    for (const entrada of entradas) {
+      if (!TASK_DIR_RE.test(entrada) || vistos.has(entrada)) continue;
+      const fichero = path.join(dir, entrada, 'tarea.md');
+      if (!existsSync(fichero)) continue;
+      try {
+        const { task } = parseTareaFile(readFileSync(fichero, 'utf8'));
+        vistos.add(entrada);
+        tareas.push({
+          id: task.id,
+          titulo: task.titulo,
+          sprint: task.sprint,
+          complejidad: task.complejidad,
+          estado: task.estado,
+          dependencias: task.dependencias,
+        });
+      } catch {
+        ilegibles.push(path.relative(raiz, fichero).split(path.sep).join('/'));
+      }
+    }
+  }
+  return { tareas, ilegibles };
+}
+
+/** true si `tareas/ROADMAP.md` esta declarado en `rutas_sincronizacion` (sin distinguir mayusculas). */
+export function roadmapEnSincronizacion(config: TaskcodeConfig): boolean {
+  return config.rutas_sincronizacion.some(
+    (r) => r.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase() === ROADMAP_RUTA.toLowerCase()
+  );
+}
+
+/** Nombre real en disco del fichero que casa con ROADMAP.md sin distinguir mayusculas, o null. */
+function nombreEnDisco(raiz: string): string | null {
+  try {
+    return readdirSync(path.join(raiz, 'tareas')).find((e) => e.toLowerCase() === NOMBRE.toLowerCase()) ?? null;
+  } catch {
+    return null;
+  }
+}
+
+function tieneCambiosSinCommitear(raiz: string): boolean {
+  return runGit(['status', '--porcelain', '--untracked-files=all', '--', ROADMAP_RUTA], raiz) !== '';
+}
+
+function tieneHistoria(raiz: string): boolean {
+  return runGit(['log', '--all', '-1', '--format=%H', '--', ROADMAP_RUTA], raiz) !== '';
+}
+
+function detalle(e: unknown): string {
+  return e instanceof Error ? e.message : String(e);
+}
+
+/**
+ * Genera en memoria el ROADMAP que escribiria taskctl a partir del
+ * actual (del que solo toma la zona manual). Lanza si algo impide
+ * generarlo: tareas ilegibles o zona manual rota.
+ */
+export function generarDesdeDisco(raiz: string, actual: string | null): { texto: string; avisos: string[] } {
+  const { tareas, ilegibles } = leerTareasRoadmap(raiz);
+  if (ilegibles.length > 0) {
+    throw new Error(`hay tareas que no se pueden leer (${ilegibles.join(', ')})`);
+  }
+  const zona = actual === null ? null : extraerZonaManual(actual);
+  const g = generarRoadmap(tareas, zona);
+  const texto = actual !== null && actual.includes('\r\n') ? g.texto.replace(/\n/g, '\r\n') : g.texto;
+  return { texto, avisos: g.avisos };
+}
+
+/**
+ * Decide, genera y (si toca) escribe `tareas/ROADMAP.md`. Nunca lanza:
+ * todo lo que va mal se devuelve como 'fallido' u 'omitido' con su aviso.
+ */
+export function prepararRoadmap(raiz: string, modo: ModoRoadmap): ResultadoRoadmap {
+  const ruta = path.join(raiz, 'tareas', NOMBRE);
+  const r = (estado: ResultadoRoadmap['estado'], motivo: string | null, extra: Partial<ResultadoRoadmap> = {}): ResultadoRoadmap => ({
+    estado,
+    ruta,
+    anterior: null,
+    motivo,
+    avisos: [],
+    diferencias: [],
+    ...extra,
+  });
+  const avisoFallo = (m: string): string =>
+    `${ROADMAP_RUTA} no se ha regenerado: ${m}. Se queda como estaba; ` +
+    'corrigelo y regeneralo con "taskctl roadmap --escribir".';
+
+  try {
+    const { config } = resolverConfigConAvisos(raiz);
+    if (roadmapEnSincronizacion(config)) {
+      return r('omitido', `${ROADMAP_RUTA} esta declarado en rutas_sincronizacion: lo regenera el comando del proyecto.`);
+    }
+
+    const real = nombreEnDisco(raiz);
+    if (real !== null && real !== NOMBRE) {
+      const m = `en tareas/ hay "${real}", no "${NOMBRE}": taskctl no lo toca.`;
+      return r('omitido', m, { avisos: [m] });
+    }
+
+    if (tieneCambiosSinCommitear(raiz)) {
+      const m =
+        `${ROADMAP_RUTA} tiene cambios sin commitear: no se regenera para no pisarlos. ` +
+        'Commitealos o descartalos y vuelve a generarlo con "taskctl roadmap --escribir".';
+      return r('omitido', m, { avisos: [m] });
+    }
+
+    const actual = real === null ? null : readFileSync(ruta, 'utf8');
+    let diferencias: string[] = [];
+
+    if (actual === null) {
+      if (modo === 'transicion' && tieneHistoria(raiz)) {
+        const m =
+          `${ROADMAP_RUTA} no existe pero tiene historia en git: taskctl no lo recrea por su cuenta. ` +
+          'Si quieres que lo genere, usa "taskctl roadmap --escribir".';
+        return r('omitido', m, { avisos: [m] });
+      }
+    } else if (!llevaMarcaTaskctl(actual)) {
+      if (modo === 'transicion') {
+        return r('omitido', `${ROADMAP_RUTA} no lleva la marca de taskctl: es del proyecto y no se toca.`);
+      }
+      // Migracion explicita: solo si no se pierde nada de lo que el
+      // ROADMAP actual dice (la misma comprobacion que `--comparar`).
+      let generado: string;
+      try {
+        generado = generarDesdeDisco(raiz, actual).texto;
+      } catch (e: unknown) {
+        const m = avisoFallo(detalle(e));
+        return r('fallido', m, { avisos: [m] });
+      }
+      diferencias = compararRoadmaps(actual, generado);
+      if (diferencias.length > 0) {
+        return r(
+          'omitido',
+          `${ROADMAP_RUTA} no lleva la marca de taskctl y difiere del que se generaria: no se sustituye.`,
+          { diferencias }
+        );
+      }
+    }
+
+    let generado: { texto: string; avisos: string[] };
+    try {
+      generado = generarDesdeDisco(raiz, actual);
+    } catch (e: unknown) {
+      const m = avisoFallo(detalle(e));
+      return r('fallido', m, { avisos: [m] });
+    }
+    const avisos = generado.avisos.map((a) => `${ROADMAP_RUTA}: ${a}`);
+    if (actual === generado.texto) return r('sin-cambios', null, { anterior: actual, avisos });
+
+    writeFileSync(ruta, generado.texto, 'utf8');
+    return r('escrito', null, { anterior: actual, avisos, diferencias });
+  } catch (e: unknown) {
+    const m = avisoFallo(detalle(e));
+    return r('fallido', m, { avisos: [m] });
+  }
+}
+
+/** Deja el ROADMAP como estaba antes de `prepararRoadmap` (si su `git add` fallo). */
+export function restaurarRoadmap(res: ResultadoRoadmap): void {
+  if (res.estado !== 'escrito') return;
+  if (res.anterior === null) unlinkSync(res.ruta);
+  else writeFileSync(res.ruta, res.anterior, 'utf8');
+}
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
index 4b227a2..2ad3c69 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/auto-commit.test.ts
@@ -185,7 +185,13 @@ test('taskctl approve: commitea el tarea.md aprobado con el mensaje del repo', a
     });
 
     assert.equal(r.autoCommit.commiteado, true);
-    assert.deepEqual(r.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-910/tarea.md']);
+    // TASK-098: approve commitea en develop (la rama de integracion) y el
+    // repo no tenia ROADMAP ni historia de el, asi que lo crea en este
+    // mismo commit. Sigue sin entrar nada que taskctl no haya escrito.
+    assert.deepEqual(r.autoCommit.ficheros, [
+      'tareas/01-en-diseno/TASK-910/tarea.md',
+      'tareas/ROADMAP.md',
+    ]);
     assert.equal(git(['log', '--format=%s', '-1'], repoRoot).trim(), 'chore(TASK-910): plan aprobado');
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
   });
@@ -309,8 +315,12 @@ test('taskctl finish: commitea sobre DEVELOP la tarea y los tres artefactos de c
       git(['log', '--format=%s', '-1', 'develop'], repoRoot).trim(),
       'chore(TASK-910): tarea terminada y artefactos de cierre'
     );
-    const stat = git(['show', '--stat', '--format=', 'HEAD'], repoRoot);
-    for (const esperado of [/CHANGELOG\.md/, /INDEX\.md/, /BOARD\.md/, /04-terminadas/]) {
+    // --name-only y no --stat: desde TASK-098 el commit trae tambien
+    // tareas/ROADMAP.md, y --stat abrevia las rutas largas con ".../" en
+    // cuanto cambia el ancho de su grafico (el rojo hablaria del ancho de la
+    // columna, no del comportamiento; mismo motivo que en el test de plan).
+    const stat = git(['show', '--name-only', '--format=', 'HEAD'], repoRoot);
+    for (const esperado of [/CHANGELOG\.md/, /INDEX\.md/, /BOARD\.md/, /04-terminadas/, /tareas\/ROADMAP\.md/]) {
       assert.match(stat, esperado);
     }
     assert.equal(git(['status', '--porcelain'], repoRoot).trim(), '');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
new file mode 100644
index 0000000..9548945
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
@@ -0,0 +1,282 @@
+/**
+ * TASK-098, regla numero uno: taskctl no pisa un ROADMAP ajeno.
+ *
+ * - Las copias de los ROADMAP reales de ToolsaWeb y OpenDockTrading (en
+ *   test/fixtures/roadmap, recortadas) quedan byte a byte iguales tras cada
+ *   transicion, igual que uno declarado en rutas_sincronizacion.
+ * - La zona manual de uno con la marca se conserva y un ciclo se informa sin
+ *   abortar; una tarea ilegible deja el ROADMAP como estaba.
+ * - Ni cambios sin commitear, ni un fichero borrado con historia, ni un
+ *   nombre con otras mayusculas se tocan.
+ * - `roadmap --comparar` no escribe nada.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { existsSync, readFileSync } from 'node:fs';
+import { mkdir, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { writeTareaFile } from '../../src/fs/task-store.js';
+import { runNewCommand } from '../../src/commands/new.js';
+import { runPlanCommand } from '../../src/commands/plan.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { runRoadmapCommand } from '../../src/commands/roadmap.js';
+import { autoCommit, mensajeChore } from '../../src/fs/git-commit.js';
+import { extraerZonaManual, generarRoadmap, llevaMarcaTaskctl, MARCA_TASKCTL } from '../../src/core/roadmap.js';
+import {
+  CUERPO_PLANIFICABLE,
+  FIXTURES_ROADMAP,
+  SCRIPTS_DIR,
+  aRevision,
+  bytes,
+  commitAll,
+  ficherosDeHead,
+  git,
+  porcelain,
+  ponerRoadmap,
+  rutaRoadmap,
+  tarea,
+  withRepo,
+} from '../helpers/roadmap-fixtures.js';
+
+const ROADMAP = 'tareas/ROADMAP.md';
+
+/**
+ * Recorre new, plan, approve, start y finish de una tarea y comprueba tras
+ * cada paso que el ROADMAP tiene exactamente los bytes de `esperado`.
+ */
+async function cicloSinTocar(repoRoot: string, tareasRoot: string, esperado: Buffer): Promise<void> {
+  const igual = (paso: string): void => {
+    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(esperado), `${paso} cambio el ROADMAP ajeno`);
+    assert.ok(!ficherosDeHead(repoRoot).includes(ROADMAP), `${paso} metio el ROADMAP en su commit`);
+  };
+  await runNewCommand(
+    tareasRoot,
+    ['--titulo', 'Ajena', '--tipo', 'feature', '--objetivo', 'Probar.', '--criterio', 'No pisa.'],
+    '2026-11-10',
+    { repoCwd: repoRoot }
+  );
+  igual('new');
+  await runPlanCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot });
+  igual('plan');
+  await writeFile(
+    path.join(tareasRoot, '01-en-diseno', 'TASK-001', 'planificacion', 'plan-final.md'),
+    '# Plan\n\nEnfoque: no pisar.\n',
+    'utf8'
+  );
+  commitAll(repoRoot, 'docs: plan');
+  await runApproveCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot });
+  igual('approve');
+  await runStartCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+  igual('start');
+  await aRevision(repoRoot, tareasRoot, 'TASK-001');
+  await runFinishCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+  igual('finish');
+  assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+  assert.equal(porcelain(repoRoot), '');
+}
+
+for (const fichero of ['toolsaweb.md', 'opendocktrading.md']) {
+  test(`el ROADMAP real de ${fichero} queda byte a byte igual tras new, plan, approve, start y finish`, async () => {
+    await withRepo(async (repoRoot, tareasRoot) => {
+      const original = readFileSync(path.join(FIXTURES_ROADMAP, fichero));
+      assert.equal(llevaMarcaTaskctl(original.toString('utf8')), false);
+      await ponerRoadmap(repoRoot, original);
+      await cicloSinTocar(repoRoot, tareasRoot, original);
+    });
+  });
+}
+
+test('un ROADMAP declarado en rutas_sincronizacion no se toca aunque lleve la marca de taskctl', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    // Con la marca y desfasado a proposito (sin tareas): si taskctl lo
+    // regenerara, cambiaria. El comando del proyecto no hace nada.
+    const conMarca = Buffer.from(generarRoadmap([], null).texto, 'utf8');
+    await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+    await writeFile(
+      path.join(repoRoot, '.taskcode', 'config.yml'),
+      'comando_sincronizacion: "node -e 0"\nrutas_sincronizacion: [tareas/ROADMAP.md]\n',
+      'utf8'
+    );
+    await ponerRoadmap(repoRoot, conMarca);
+    await cicloSinTocar(repoRoot, tareasRoot, conMarca);
+    const c = runRoadmapCommand(repoRoot, ['--escribir']);
+    assert.equal(c.codigo, 1);
+    assert.match(c.salida, /rutas_sincronizacion/);
+    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(conMarca));
+  });
+});
+
+const MANUAL = [
+  '<!-- manual:inicio (notas de la persona) -->',
+  '## Hitos',
+  '',
+  '### H1 — Lo primero',
+  '',
+  'Motivo con *énfasis*, tildes y | barras que no se tocan.  ',
+  '<!-- manual:fin -->',
+].join('\n');
+
+test('la zona manual se conserva al regenerar y un ciclo se informa en el ROADMAP sin abortar la transicion', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await ponerRoadmap(repoRoot, generarRoadmap([], MANUAL).texto);
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-001', dependencias: ['TASK-002'] }), CUERPO_PLANIFICABLE);
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-002', dependencias: ['TASK-001'] }), CUERPO_PLANIFICABLE);
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-003', estado: 'en-diseno' }), CUERPO_PLANIFICABLE);
+    const planDir = path.join(tareasRoot, '01-en-diseno', 'TASK-003', 'planificacion');
+    await mkdir(planDir, { recursive: true });
+    await writeFile(path.join(planDir, 'plan-final.md'), '# Plan\n\nEnfoque: ciclo.\n', 'utf8');
+    commitAll(repoRoot, 'docs: tareas con ciclo');
+
+    const a = await runApproveCommand(tareasRoot, ['TASK-003'], '2026-11-10', { repoCwd: repoRoot });
+
+    assert.equal(a.autoCommit.commiteado, true);
+    assert.ok(a.autoCommit.ficheros.includes(ROADMAP));
+    const texto = readFileSync(rutaRoadmap(repoRoot), 'utf8');
+    assert.equal(texto.split('\n')[2], MARCA_TASKCTL);
+    assert.equal(extraerZonaManual(texto), MANUAL);
+    assert.ok(texto.includes(`\n${MANUAL}\n`));
+    assert.match(texto, /^## H1 — Lo primero$/m);
+    assert.match(texto, /^## Dependencias circulares$/m);
+    assert.match(texto, /^- TASK-001 → TASK-002 → TASK-001$/m);
+    assert.ok(a.autoCommit.avisos.some((m) => m.includes('dependencia circular')), a.autoCommit.avisos.join('\n'));
+    assert.equal(porcelain(repoRoot), '');
+  });
+});
+
+test('una tarea ilegible deja el ROADMAP como estaba, avisa y la transicion sigue', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    const previo = generarRoadmap([], MANUAL).texto;
+    await ponerRoadmap(repoRoot, previo);
+    await mkdir(path.join(tareasRoot, '00-planificadas', 'TASK-009'), { recursive: true });
+    await writeFile(path.join(tareasRoot, '00-planificadas', 'TASK-009', 'tarea.md'), 'sin frontmatter\n', 'utf8');
+    commitAll(repoRoot, 'docs: tarea rota');
+
+    const n = await runNewCommand(tareasRoot, ['--titulo', 'Nueva', '--tipo', 'feature'], '2026-11-10', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(n.autoCommit.commiteado, true);
+    assert.equal(readFileSync(rutaRoadmap(repoRoot), 'utf8'), previo);
+    assert.ok(!n.autoCommit.ficheros.includes(ROADMAP));
+    assert.ok(n.autoCommit.avisos.some((m) => m.includes('no se ha regenerado') && m.includes('TASK-009')));
+  });
+});
+
+test('con cambios sin commitear en el ROADMAP no se regenera: se avisa y los cambios siguen ahi', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await ponerRoadmap(repoRoot, generarRoadmap([], null).texto);
+    const editado = `${readFileSync(rutaRoadmap(repoRoot), 'utf8')}\nnota a medias de la persona\n`;
+    await writeFile(rutaRoadmap(repoRoot), editado, 'utf8');
+    // Lo que haria una transicion: escribir su tarea y commitearla.
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-001' }), CUERPO_PLANIFICABLE);
+
+    const r = autoCommit({
+      cwd: repoRoot,
+      rutas: [path.join(tareasRoot, '00-planificadas', 'TASK-001')],
+      mensaje: mensajeChore('TASK-001', 'tarea creada'),
+      roadmap: true,
+    });
+
+    assert.equal(r.commiteado, true);
+    assert.equal(r.roadmap?.estado, 'omitido');
+    assert.ok(r.avisos.some((m) => m.includes('cambios sin commitear')), r.avisos.join('\n'));
+    assert.deepEqual(r.ficheros, ['tareas/00-planificadas/TASK-001/tarea.md']);
+    assert.equal(readFileSync(rutaRoadmap(repoRoot), 'utf8'), editado);
+    assert.equal(porcelain(repoRoot), `M ${ROADMAP}`);
+
+    const e = runRoadmapCommand(repoRoot, ['--escribir']);
+    assert.equal(e.codigo, 1);
+    assert.equal(readFileSync(rutaRoadmap(repoRoot), 'utf8'), editado);
+  });
+});
+
+test('un ROADMAP borrado con historia en git no se recrea solo; roadmap --escribir si lo crea', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await runNewCommand(tareasRoot, ['--titulo', 'Una', '--tipo', 'feature'], '2026-11-10', { repoCwd: repoRoot });
+    assert.ok(existsSync(rutaRoadmap(repoRoot)));
+    git(['rm', '-q', ROADMAP], repoRoot);
+    git(['commit', '-q', '-m', 'docs: fuera el roadmap'], repoRoot);
+
+    const n = await runNewCommand(tareasRoot, ['--titulo', 'Otra', '--tipo', 'feature'], '2026-11-10', {
+      repoCwd: repoRoot,
+    });
+    assert.equal(existsSync(rutaRoadmap(repoRoot)), false);
+    assert.ok(n.autoCommit.avisos.some((m) => m.includes('tiene historia en git')));
+
+    const e = runRoadmapCommand(repoRoot, ['--escribir']);
+    assert.equal(e.codigo, 0);
+    assert.match(e.salida, /Regenerado tareas\/ROADMAP\.md/);
+    assert.match(readFileSync(rutaRoadmap(repoRoot), 'utf8'), /TASK-002/);
+  });
+});
+
+test('un fichero con otras mayusculas (tareas/Roadmap.md) no se toca ni se crea otro al lado', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await mkdir(tareasRoot, { recursive: true });
+    await writeFile(path.join(tareasRoot, 'Roadmap.md'), '# Mio\n', 'utf8');
+    commitAll(repoRoot, 'docs: roadmap propio');
+
+    const n = await runNewCommand(tareasRoot, ['--titulo', 'Una', '--tipo', 'feature'], '2026-11-10', {
+      repoCwd: repoRoot,
+    });
+
+    assert.equal(readFileSync(path.join(tareasRoot, 'Roadmap.md'), 'utf8'), '# Mio\n');
+    assert.ok(!n.autoCommit.ficheros.some((f) => f.toLowerCase() === ROADMAP.toLowerCase()));
+    assert.ok(n.autoCommit.avisos.some((m) => m.includes('"Roadmap.md"')));
+  });
+});
+
+test('roadmap --comparar no escribe nada y lista lo que difiere de un ROADMAP ajeno; --escribir no lo sustituye', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    const original = readFileSync(path.join(FIXTURES_ROADMAP, 'opendocktrading.md'));
+    await ponerRoadmap(repoRoot, original);
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-009', sprint: 0, estado: 'terminada' }), CUERPO_PLANIFICABLE);
+    commitAll(repoRoot, 'docs: una tarea');
+    const head = git(['rev-parse', 'HEAD'], repoRoot);
+
+    const c = runRoadmapCommand(repoRoot, ['--comparar']);
+
+    assert.equal(c.codigo, 1);
+    assert.match(c.salida, /no lleva la marca de taskctl/);
+    assert.match(c.salida, /TASK-009: estado "▶ en revisión" en el actual y "✅ terminada" en el generado\./);
+    assert.match(c.salida, /TASK-001: solo en el actual \(H0\)\./);
+    assert.doesNotMatch(c.salida, /zona manual/);
+    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(original));
+    assert.equal(porcelain(repoRoot), '');
+    assert.equal(git(['rev-parse', 'HEAD'], repoRoot), head);
+
+    const e = runRoadmapCommand(repoRoot, ['--escribir']);
+    assert.equal(e.codigo, 1);
+    assert.match(e.salida, /no lleva la marca de taskctl y difiere/);
+    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(original));
+
+    // Sin flags tampoco escribe: saca por stdout el que se generaria.
+    const m = runRoadmapCommand(repoRoot, []);
+    assert.equal(m.codigo, 0);
+    assert.equal(m.salida.split('\n')[2], MARCA_TASKCTL);
+    assert.ok(m.salida.includes(extraerZonaManual(original.toString('utf8'))!));
+    assert.ok(bytes(rutaRoadmap(repoRoot)).equals(original));
+  });
+});
+
+test('roadmap --escribir migra un ROADMAP ajeno solo si --comparar sale limpio, y conserva su zona manual', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-001' }), CUERPO_PLANIFICABLE);
+    // Mismo contenido estructural que el de taskctl, con la marca de otro generador.
+    const propio = generarRoadmap([{ id: 'TASK-001', titulo: 'Tarea de prueba del roadmap', sprint: 1, complejidad: 'simple', estado: 'planificada', dependencias: [] }], MANUAL)
+      .texto.replace(MARCA_TASKCTL, '<!-- generado por scripts/otro.py; no editar a mano -->');
+    await ponerRoadmap(repoRoot, propio);
+
+    const c = runRoadmapCommand(repoRoot, ['--comparar']);
+    assert.equal(c.codigo, 0, c.salida);
+    assert.match(c.salida, /Sin diferencias/);
+
+    const e = runRoadmapCommand(repoRoot, ['--escribir']);
+    assert.equal(e.codigo, 0, e.salida);
+    const texto = readFileSync(rutaRoadmap(repoRoot), 'utf8');
+    assert.ok(llevaMarcaTaskctl(texto));
+    assert.equal(extraerZonaManual(texto), MANUAL);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-transiciones.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-transiciones.test.ts
new file mode 100644
index 0000000..16a8f73
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-transiciones.test.ts
@@ -0,0 +1,153 @@
+/**
+ * TASK-098: las transiciones que commitean en la rama de integracion (new,
+ * plan, approve y finish tras el merge) crean o regeneran tareas/ROADMAP.md
+ * dentro de su mismo commit; start, que commitea en la rama de la tarea, no
+ * lo toca, y por eso dos ramas en paralelo cierran sin conflicto en el.
+ * Repos Git temporales reales y los scripts de Git-Flow tal cual.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import { readFile, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { writeTareaFile, readTareaFile } from '../../src/fs/task-store.js';
+import { runNewCommand } from '../../src/commands/new.js';
+import { runPlanCommand } from '../../src/commands/plan.js';
+import { runApproveCommand } from '../../src/commands/approve.js';
+import { runStartCommand } from '../../src/commands/start.js';
+import { runFinishCommand } from '../../src/commands/finish.js';
+import { MARCA_TASKCTL } from '../../src/core/roadmap.js';
+import {
+  CUERPO_PLANIFICABLE,
+  SCRIPTS_DIR,
+  aRevision,
+  commitAll,
+  ficherosDeHead,
+  git,
+  porcelain,
+  rutaRoadmap,
+  tarea,
+  withRepo,
+} from '../helpers/roadmap-fixtures.js';
+
+const ROADMAP = 'tareas/ROADMAP.md';
+
+function roadmap(repoRoot: string): string {
+  return readFileSync(rutaRoadmap(repoRoot), 'utf8');
+}
+
+/** Fila de una tarea en el ROADMAP, o null. */
+function fila(repoRoot: string, id: string): string | null {
+  // La segunda columna, no cualquiera: el id tambien sale en "Depende de".
+  return roadmap(repoRoot).split('\n').find((l) => l.split(' | ')[1] === id) ?? null;
+}
+
+test('new, plan, approve y finish crean o regeneran el ROADMAP con la marca en su mismo commit; start no lo toca', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    // new: no habia ROADMAP ni historia de el -> lo crea en el commit de la tarea.
+    const n = await runNewCommand(
+      tareasRoot,
+      ['--titulo', 'Primera', '--tipo', 'feature', '--sprint', '1', '--complejidad', 'media',
+        '--objetivo', 'Probar el roadmap.', '--criterio', 'Se regenera.'],
+      '2026-11-10',
+      { repoCwd: repoRoot }
+    );
+    assert.equal(n.id, 'TASK-001');
+    assert.ok(ficherosDeHead(repoRoot).includes(ROADMAP), ficherosDeHead(repoRoot).join(', '));
+    assert.equal(roadmap(repoRoot).split('\n')[2], MARCA_TASKCTL);
+    assert.match(fila(repoRoot, 'TASK-001')!, /\| 1 \| TASK-001 \| Primera \| media \| — \| lista para empezar \|/);
+    assert.match(roadmap(repoRoot), /^## H1 — H1$/m);
+    assert.match(roadmap(repoRoot), /^- \*\*Listas para empezar:\*\* TASK-001$/m);
+    assert.equal(porcelain(repoRoot), '');
+
+    // Una tarea que depende de TASK-001, anadida a mano: el ROADMAP queda
+    // desfasado hasta la siguiente transicion, que lo pone al dia entero.
+    await writeTareaFile(
+      tareasRoot,
+      tarea({ id: 'TASK-002', titulo: 'Segunda', sprint: 0, complejidad: 'alta', dependencias: ['TASK-001'] }),
+      CUERPO_PLANIFICABLE
+    );
+    commitAll(repoRoot, 'docs: segunda tarea');
+
+    await runPlanCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot });
+    assert.ok(ficherosDeHead(repoRoot).includes(ROADMAP));
+    assert.match(fila(repoRoot, 'TASK-001')!, /▶ en diseño \|$/);
+    // TASK-002 es de H0 pero depende de TASK-001 (H1): va despues de ella.
+    assert.match(fila(repoRoot, 'TASK-002')!, /\| 2 \| TASK-002 \| Segunda \| alta \| TASK-001 \| espera a TASK-001 \|/);
+    assert.match(roadmap(repoRoot), /^- \*\*En marcha:\*\* TASK-001 \(en diseño\)$/m);
+    assert.equal(porcelain(repoRoot), '');
+
+    // approve: otra tarea anadida a mano entra en el ROADMAP con el commit de approve.
+    const plan = path.join(tareasRoot, '01-en-diseno', 'TASK-001', 'planificacion', 'plan-final.md');
+    await writeFile(plan, '# Plan\n\nEnfoque: probar el roadmap.\n', 'utf8');
+    await writeTareaFile(tareasRoot, tarea({ id: 'TASK-003', titulo: 'Tercera', sprint: 1 }), CUERPO_PLANIFICABLE);
+    commitAll(repoRoot, 'docs: plan y tercera tarea');
+    const a = await runApproveCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot });
+    assert.ok(a.autoCommit.ficheros.includes(ROADMAP));
+    assert.ok(ficherosDeHead(repoRoot).includes(ROADMAP));
+    assert.match(fila(repoRoot, 'TASK-003')!, /lista para empezar \|$/);
+    assert.equal(porcelain(repoRoot), '');
+
+    // start: commitea en la rama de la tarea y el ROADMAP no se toca.
+    const antes = roadmap(repoRoot);
+    const s = await runStartCommand(tareasRoot, ['TASK-001'], '2026-11-10', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), s.rama);
+    assert.equal(s.autoCommit.roadmap, null);
+    assert.ok(!ficherosDeHead(repoRoot).includes(ROADMAP));
+    assert.equal(roadmap(repoRoot), antes);
+
+    // finish: tras el merge, en develop, con la tarea ya terminada.
+    await aRevision(repoRoot, tareasRoot, 'TASK-001');
+    const f = await runFinishCommand(tareasRoot, ['TASK-001'], '2026-11-10', {
+      repoCwd: repoRoot,
+      scriptsDir: SCRIPTS_DIR,
+    });
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    assert.ok(f.autoCommit.ficheros.includes(ROADMAP), f.autoCommit.ficheros.join(', '));
+    assert.match(fila(repoRoot, 'TASK-001')!, /\| — \| TASK-001 \| Primera \| media \| — \| ✅ terminada \|/);
+    assert.match(fila(repoRoot, 'TASK-002')!, /lista para empezar \|$/);
+    assert.match(roadmap(repoRoot), /^1 de 2 terminadas\.$/m);
+    assert.equal(porcelain(repoRoot), '');
+    // Ninguna fecha: regenerar sin cambios no da diff.
+    assert.doesNotMatch(roadmap(repoRoot), /2026-11-10/);
+  });
+});
+
+test('dos ramas de tarea en paralelo cierran con finish sin conflicto en el ROADMAP', async () => {
+  await withRepo(async (repoRoot, tareasRoot) => {
+    for (const titulo of ['Rama A', 'Rama B']) {
+      await runNewCommand(tareasRoot, ['--titulo', titulo, '--tipo', 'feature'], '2026-11-10', { repoCwd: repoRoot });
+    }
+    const roadmapInicial = roadmap(repoRoot);
+    assert.match(roadmapInicial, /TASK-001.*TASK-002/s);
+
+    // Las dos ramas nacen del mismo develop y avanzan cada una por su lado.
+    const ramas: string[] = [];
+    for (const id of ['TASK-001', 'TASK-002']) {
+      git(['checkout', '-q', 'develop'], repoRoot);
+      const { task } = (await readTareaFile(tareasRoot, id))!;
+      ramas.push(task.rama);
+      git(['checkout', '-q', '-b', task.rama], repoRoot);
+      await aRevision(repoRoot, tareasRoot, id);
+      // En la rama de la tarea el ROADMAP sigue siendo el de develop.
+      assert.equal(roadmap(repoRoot), roadmapInicial);
+    }
+
+    git(['checkout', '-q', ramas[0]!], repoRoot);
+    await runFinishCommand(tareasRoot, ['TASK-001'], '2026-11-10', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+    git(['checkout', '-q', ramas[1]!], repoRoot);
+    const f2 = await runFinishCommand(tareasRoot, ['TASK-002'], '2026-11-10', { repoCwd: repoRoot, scriptsDir: SCRIPTS_DIR });
+
+    assert.equal(git(['branch', '--show-current'], repoRoot).trim(), 'develop');
+    assert.ok(f2.autoCommit.ficheros.includes(ROADMAP));
+    const final = await readFile(rutaRoadmap(repoRoot), 'utf8');
+    assert.doesNotMatch(final, /^(<<<<<<<|=======|>>>>>>>)/m);
+    assert.match(fila(repoRoot, 'TASK-001')!, /✅ terminada \|$/);
+    assert.match(fila(repoRoot, 'TASK-002')!, /✅ terminada \|$/);
+    assert.match(final, /^2 de 2 terminadas\.$/m);
+    assert.equal(porcelain(repoRoot), '');
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-ciclo.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-ciclo.test.ts
index 1bbc923..5aa4d04 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-ciclo.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/sincronizacion-ciclo.test.ts
@@ -105,7 +105,10 @@ test('sincronizacion: sin las claves, ni se ejecuta el script ni cambia el commi
       repoCwd: repoRoot,
     });
     assert.equal(a.autoCommit.sincronizacion.estado, 'no-configurada');
-    assert.deepEqual(a.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-920/tarea.md']);
+    // TASK-098: lo unico que cambia respecto a 0.1.0 es el ROADMAP de taskctl,
+    // que approve crea en develop porque el repo no tenia ninguno. No es la
+    // sincronizacion: sigue 'no-configurada' y docs/PLAN.md no se toca.
+    assert.deepEqual(a.autoCommit.ficheros, ['tareas/01-en-diseno/TASK-920/tarea.md', 'tareas/ROADMAP.md']);
     assert.equal(await planEnDisco(repoRoot), antes, 'el script no deberia haberse ejecutado');
   });
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts
new file mode 100644
index 0000000..49e9315
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/roadmap.test.ts
@@ -0,0 +1,182 @@
+/**
+ * TASK-098: generacion y comparacion del ROADMAP, puras (sin disco ni Git).
+ * Lo que toca Git y las transiciones esta en test/commands/roadmap*.test.ts.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import {
+  extraerZonaManual,
+  generarRoadmap,
+  llevaMarcaTaskctl,
+  MARCA_TASKCTL,
+  RoadmapError,
+  titulosDeHitos,
+  ZONA_MANUAL_POR_DEFECTO,
+  type TareaRoadmap,
+} from '../../src/core/roadmap.js';
+import { compararRoadmaps, extraerEstructura } from '../../src/core/roadmap-comparar.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/core -> raiz del paquete -> test/fixtures/roadmap
+const FIXTURES = path.join(HERE, '..', '..', '..', 'test', 'fixtures', 'roadmap');
+
+function t(id: string, extra: Partial<TareaRoadmap> = {}): TareaRoadmap {
+  return { id, titulo: `Titulo ${id}`, sprint: 0, complejidad: 'media', estado: 'planificada', dependencias: [], ...extra };
+}
+
+const MANUAL = [
+  '<!-- manual:inicio (se edita a mano) -->',
+  'Texto libre de la persona, con | barras y `codigo`.',
+  '',
+  '### H2 — Segundo en el tiempo',
+  '',
+  '### H1 — Primero en el tiempo',
+  '<!-- manual:fin -->',
+].join('\n');
+
+/** Filas de tarea en el orden en que salen, como "Paso TASK". */
+function filas(texto: string): string[] {
+  return [...texto.matchAll(/^\| (\S+) \| (TASK-\d+) \|/gm)].map((m) => `${m[1]} ${m[2]}`);
+}
+
+test('generarRoadmap: la marca va exacta en la tercera linea y la zona manual se conserva byte a byte', () => {
+  const g = generarRoadmap([t('TASK-001')], MANUAL);
+  const lineas = g.texto.split('\n');
+  assert.equal(lineas[0], '# Roadmap de tareas');
+  assert.equal(lineas[2], MARCA_TASKCTL);
+  assert.ok(llevaMarcaTaskctl(g.texto));
+  assert.equal(extraerZonaManual(g.texto), MANUAL);
+  // Regenerar desde lo generado no cambia nada: ni fecha ni hora en la salida.
+  assert.equal(generarRoadmap([t('TASK-001')], extraerZonaManual(g.texto)).texto, g.texto);
+  assert.ok(g.texto.endsWith('|\n'));
+  assert.doesNotMatch(g.texto, /\d{4}-\d{2}-\d{2}/);
+});
+
+test('generarRoadmap: sin zona manual usa la de por defecto, que se reconoce al releerla', () => {
+  const g = generarRoadmap([], null);
+  assert.equal(extraerZonaManual(g.texto), ZONA_MANUAL_POR_DEFECTO);
+  assert.match(g.texto, /\*\*En marcha:\*\* ninguna/);
+  assert.match(g.texto, /\*\*Listas para empezar:\*\* ninguna/);
+});
+
+test('generarRoadmap: orden topologico; a igualdad, el hito anterior (orden de la zona manual) y el numero menor', () => {
+  const tareas = [
+    t('TASK-005', { sprint: 1 }),
+    t('TASK-001', { sprint: 2, dependencias: ['TASK-006'] }),
+    t('TASK-006', { sprint: 2 }),
+    t('TASK-003', { sprint: 1, dependencias: ['TASK-001'] }),
+    t('TASK-002', { sprint: 1, estado: 'terminada' }),
+    t('TASK-009', { sprint: 7 }),
+  ];
+  const g = generarRoadmap(tareas, MANUAL);
+  // H2 va antes que H1 porque asi lo ordena la zona manual; H7, sin titulo, al final.
+  const hitos = [...g.texto.matchAll(/^## (H\d+ — .*)$/gm)].map((m) => m[1]);
+  assert.deepEqual(hitos, ['H2 — Segundo en el tiempo', 'H1 — Primero en el tiempo', 'H7 — H7']);
+  // TASK-006 antes que TASK-001 (dependencia) aunque tenga numero mayor;
+  // TASK-003 depende de una de H2 que ya ha salido, asi que dentro de H1 va
+  // por numero (antes que TASK-005); las terminadas no llevan paso.
+  assert.deepEqual(filas(g.texto), ['1 TASK-006', '2 TASK-001', '— TASK-002', '3 TASK-003', '4 TASK-005', '5 TASK-009']);
+  assert.match(g.texto, /^\| 3 \| TASK-003 \| Titulo TASK-003 \| media \| TASK-001 \| espera a TASK-001 \|$/m);
+  assert.match(g.texto, /^\| — \| TASK-002 \| Titulo TASK-002 \| media \| — \| ✅ terminada \|$/m);
+  assert.match(g.texto, /^1 de 3 terminadas\.$/m);
+  assert.deepEqual(g.ciclos, []);
+});
+
+test('generarRoadmap: resumen de en marcha y listas para empezar, complejidad nula y | escapado en el titulo', () => {
+  const g = generarRoadmap(
+    [
+      t('TASK-001', { estado: 'en-curso' }),
+      t('TASK-002', { estado: 'en-revision', complejidad: null }),
+      t('TASK-003', { estado: 'en-diseno' }),
+      t('TASK-004', { titulo: 'a | b' }),
+      t('TASK-005', { dependencias: ['TASK-001'] }),
+    ],
+    null
+  );
+  assert.match(g.texto, /^- \*\*En marcha:\*\* TASK-001 \(en curso\), TASK-002 \(en revisión\), TASK-003 \(en diseño\)$/m);
+  assert.match(g.texto, /^- \*\*Listas para empezar:\*\* TASK-004$/m);
+  assert.match(g.texto, /\| TASK-002 \| Titulo TASK-002 \| — \| — \| ▶ en revisión \|/);
+  assert.match(g.texto, /\| TASK-004 \| a \\\| b \|/);
+  assert.equal(extraerEstructura(g.texto).tareas.get('TASK-004')?.titulo, 'a | b');
+});
+
+test('generarRoadmap: un ciclo se informa en su seccion y en los avisos, sin lanzar y sin perder tareas', () => {
+  const g = generarRoadmap(
+    [
+      t('TASK-001', { dependencias: ['TASK-002'] }),
+      t('TASK-002', { dependencias: ['TASK-001'] }),
+      t('TASK-003', { dependencias: ['TASK-002'] }),
+      t('TASK-004'),
+      t('TASK-005', { dependencias: ['TASK-999'] }),
+    ],
+    null
+  );
+  assert.deepEqual(g.ciclos, [['TASK-001', 'TASK-002', 'TASK-001']]);
+  assert.match(g.texto, /^## Dependencias circulares$/m);
+  assert.match(g.texto, /^- TASK-001 → TASK-002 → TASK-001$/m);
+  assert.ok(g.avisos.some((a) => a.includes('dependencia circular: TASK-001 -> TASK-002 -> TASK-001')));
+  assert.ok(g.avisos.some((a) => a.includes('TASK-005 depende de TASK-999, que no existe')));
+  // Las cinco salen; las del ciclo y la que depende de el, al final.
+  assert.deepEqual(filas(g.texto).map((f) => f.split(' ')[1]), ['TASK-004', 'TASK-005', 'TASK-001', 'TASK-002', 'TASK-003']);
+});
+
+test('llevaMarcaTaskctl: linea exacta en la tercera posicion, ignorando CRLF, nunca por subcadena', () => {
+  assert.ok(llevaMarcaTaskctl(`# R\r\n\r\n${MARCA_TASKCTL}\r\n`));
+  assert.equal(llevaMarcaTaskctl(`# R\n\n\n${MARCA_TASKCTL}\n`), false, 'en otra linea no vale');
+  assert.equal(llevaMarcaTaskctl(`# R\n\n${MARCA_TASKCTL} \n`), false, 'con un espacio de mas no vale');
+  assert.equal(llevaMarcaTaskctl(`# R\n\n<!-- generado por taskctl; formato 2; no editar fuera de la zona manual -->\n`), false);
+  // Los dos ROADMAP reales mencionan "generado por" y "no editar a mano": no son nuestros.
+  for (const f of ['toolsaweb.md', 'opendocktrading.md']) {
+    assert.equal(llevaMarcaTaskctl(readFileSync(path.join(FIXTURES, f), 'utf8')), false, f);
+  }
+});
+
+test('extraerZonaManual: reconoce la de OpenDockTrading por prefijo y rechaza una zona sin cerrar', () => {
+  const odt = readFileSync(path.join(FIXTURES, 'opendocktrading.md'), 'utf8');
+  const zona = extraerZonaManual(odt);
+  assert.ok(zona !== null && zona.startsWith('<!-- manual:inicio (se edita a mano; scripts/grafo-tareas.py lo conserva) -->'));
+  assert.ok(odt.includes(zona!));
+  assert.equal(titulosDeHitos(zona).get(0), 'Diagnóstico y decisiones');
+  assert.deepEqual([...titulosDeHitos(zona).keys()].slice(-2), [8, 7]);
+  assert.equal(extraerZonaManual(readFileSync(path.join(FIXTURES, 'toolsaweb.md'), 'utf8')), null);
+  assert.throws(() => extraerZonaManual('<!-- manual:inicio -->\nsin cierre\n'), RoadmapError);
+  assert.throws(() => extraerZonaManual('texto\n<!-- manual:fin -->\n'), RoadmapError);
+});
+
+test('compararRoadmaps: identicos no dan diferencias; lista tareas, hitos, dependencias, estado y zona manual', () => {
+  const base = [t('TASK-001', { sprint: 1 }), t('TASK-002', { sprint: 1, dependencias: ['TASK-001'] })];
+  const a = generarRoadmap(base, MANUAL).texto;
+  assert.deepEqual(compararRoadmaps(a, a), []);
+
+  const b = generarRoadmap(
+    [t('TASK-001', { sprint: 2, estado: 'terminada' }), t('TASK-002', { sprint: 1 }), t('TASK-003', { sprint: 1 })],
+    MANUAL
+  ).texto;
+  const difs = compararRoadmaps(a, b);
+  assert.ok(difs.includes('TASK-001: hito H1 en el actual y H2 en el generado.'), difs.join('\n'));
+  assert.ok(difs.includes('TASK-001: estado "lista para empezar" en el actual y "✅ terminada" en el generado.'));
+  assert.ok(difs.includes('TASK-002: depende de TASK-001 en el actual y de — en el generado.'));
+  assert.ok(difs.includes('TASK-003: solo en el generado (H1).'));
+  assert.ok(difs.includes('hito H2: solo en el generado ("Segundo en el tiempo").'));
+
+  const sinManual = a.replace(MANUAL, '');
+  assert.ok(compararRoadmaps(sinManual, a).some((d) => d.startsWith('zona manual: el ROADMAP actual no tiene')));
+});
+
+test('compararRoadmaps: lee los ROADMAP reales y declara no comparable lo que no casa', () => {
+  const odt = readFileSync(path.join(FIXTURES, 'opendocktrading.md'), 'utf8');
+  const e = extraerEstructura(odt);
+  assert.equal(e.tareas.get('TASK-009')?.estado, '▶ en revisión');
+  assert.deepEqual(e.tareas.get('TASK-009')?.dependencias, ['TASK-003', 'TASK-005', 'TASK-062']);
+  assert.equal(e.hitos.get(0), 'Diagnóstico y decisiones');
+  assert.deepEqual(e.noComparables, []);
+  const tw = extraerEstructura(readFileSync(path.join(FIXTURES, 'toolsaweb.md'), 'utf8'));
+  assert.ok(tw.tareas.size > 10);
+  assert.equal(tw.zonaManual, null);
+
+  const raro = `# R\n\n## H0 — x\n\n| 1 | TASK-001 | solo cuatro | celdas |\n`;
+  assert.deepEqual(compararRoadmaps(raro, raro), ['fila no comparable en el actual: | 1 | TASK-001 | solo cuatro | celdas |']);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fixtures/roadmap/opendocktrading.md b/taskcode-marketplace/plugins/taskcode-plugin/test/fixtures/roadmap/opendocktrading.md
new file mode 100644
index 0000000..c9ddd88
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fixtures/roadmap/opendocktrading.md
@@ -0,0 +1,93 @@
+# Roadmap de tareas
+
+Único documento de planificación de OpenDockTrading. La cabecera (leyes, modelo de negocio y motivo de cada hito) se edita a mano; el resto lo genera `python -I scripts/grafo-tareas.py --escribir` a partir del frontmatter de cada `tarea.md` y no se edita a mano.
+
+<!-- manual:inicio (se edita a mano; scripts/grafo-tareas.py lo conserva) -->
+**Origen:** planificación del 2026-11-09 a partir de [diagnostico-opentrading.md](../docs/planificacion/diagnostico-opentrading.md), con los cambios de la persona del mismo día. Esta cabecera sustituye al antiguo documento de hitos, que quedó obsoleto y se borró.
+
+## Hitos
+
+### H0 — Diagnóstico y decisiones
+
+Estudio y ADR, sin código de producto. Empieza por el **catálogo de fallos de OpenTrading** (TASK-062) y el
+
+### H1 — Esqueleto andante con interfaz
+
+Workspace Rust con axum sirviendo la web Vue compilada, el registro de servicios, el arnés de arquitectura,
+
+### H2 — Base de datos optimizada, aditiva e insensible al escalado
+
+La primera ley hecha código: el proyecto `.odtp` y sus cachés, el límite de 3+3 carteras, el migrador solo aditivo, los esquemas de hechos y de órdenes y
+
+### H3 — Frontera con Kraken
+
+Cliente REST firmado, limitador por coste con prioridad para órdenes, WebSocket v2 público y privado, colocación
+
+### H4 — Motor de dominio
+
+Decimal exacto con los incrementos del par, libro de lotes FIFO incremental, conciliación, actor de cuenta como
+
+### H5 — Estrategias, simulación y medida
+
+Estrategias de compra versionadas, venta con protección en el exchange, universo con filtros de calidad y tope de
+
+### H6 — Disposiciones y varios monitores
+
+Disposiciones con nombre y grupos en ventanas propias del navegador para repartir paneles entre monitores. El
+
+### H8 — Cuentas y suscripción
+
+El modelo de negocio hecho código, antes de la puesta en marcha: crate de derechos compartido por el programa y el
+
+### H7 — Migración y puesta en marcha
+
+Importación del historial de OpenTrading sin copiar credenciales, ensayo en papel de 7 días en paralelo, avisos
+<!-- manual:fin -->
+
+## Estado del trabajo
+
+<!-- generado por scripts/grafo-tareas.py --escribir; no editar a mano desde aquí -->
+
+Orden en que se hacen las tareas, agrupadas por hito (`sprint` del frontmatter). Sale de las dependencias: ninguna tarea va antes que aquellas de las que depende y, a igualdad, va primero la del hito menor, luego la de interfaz (segunda ley) y luego la de número menor. Las tareas descartadas (en `tareas/05-archivadas/`) no salen.
+
+- **En marcha:** TASK-009 (en revisión)
+- **Listas para empezar:** TASK-067, TASK-077, TASK-078, TASK-081, TASK-082, TASK-083, TASK-011, TASK-068, TASK-069
+
+## H0 — Diagnóstico y decisiones
+
+10 de 19 terminadas.
+
+| Paso | Tarea | Título | Complejidad | Depende de | Estado |
+|---|---|---|---|---|---|
+| — | TASK-001 | Inventario de datos de OpenTrading: hechos, derivados y telemetría | — | — | ✅ terminada |
+| — | TASK-006 | ADR-001 Stack tecnológico y límites de módulos | — | — | ✅ terminada |
+| — | TASK-061 | Corpus de Kraken de OpenTrading: documentación, grabaciones e histórico | — | — | ✅ terminada |
+| — | TASK-062 | Catálogo de fallos de OpenTrading y su antídoto | — | — | ✅ terminada |
+| — | TASK-003 | Censo de parámetros de configuración y propuesta de perfiles | — | TASK-062 | ✅ terminada |
+| — | TASK-004 | Estudio de la API de Kraken para órdenes idempotentes y protección en el exchange | — | TASK-061, TASK-062 | ✅ terminada |
+| — | TASK-076 | Autopsia del rendimiento real de OpenTrading: dónde se ganó y dónde se perdió el dinero | — | — | ✅ terminada |
+| — | TASK-002 | Catálogo de reglas de negocio de compra, venta, riesgo y caja | — | TASK-062, TASK-076 | ✅ terminada |
+| — | TASK-005 | Visión de negocio y KPIs: cómo se sabe si el bot gana dinero | — | TASK-076 | ✅ terminada |
+| — | TASK-008 | ADR-003 Máquina de estados de órdenes y lotes e idempotencia contra Kraken | — | TASK-002, TASK-004, TASK-062 | ✅ terminada |
+| 1 | TASK-009 | ADR-004 Sistema de interfaz: armazón dockview con el tema de ToolsaWeb | — | TASK-003, TASK-005, TASK-062 | ▶ en revisión |
+| 2 | TASK-067 | ADR-005 Modelo de negocio: suscripción, proyecto .odtp en el PC del cliente y límite de carteras | — | TASK-005 | lista para empezar |
+| 3 | TASK-007 | ADR-002 Modelo de datos: proyecto .odtp y cachés, evolución solo aditiva e insensible al escalado | — | TASK-001, TASK-062, TASK-067 | espera a TASK-067 |
+| 4 | TASK-077 | Criterios de calidad del universo de monedas: qué entra, qué sale y cuánto capital por moneda | — | TASK-061, TASK-076 | lista para empezar |
+| 5 | TASK-078 | Política de salida para no dejar capital parado: stop real, tiempo máximo y coste de oportunidad | — | TASK-061, TASK-076 | lista para empezar |
+| 6 | TASK-081 | Mapa de todas las vías de ganancia: Earn, comisiones, estrategias y régimen de mercado, medidas con datos | — | TASK-004, TASK-076 | lista para empezar |
+| 7 | TASK-082 | Glosario del negocio: definición exacta y fórmula de cada dato antes del modelo | — | TASK-001, TASK-005, TASK-062 | lista para empezar |
+| 8 | TASK-010 | Modelo relacional completo de OpenDockTrading | — | TASK-007, TASK-008, TASK-082 | espera a TASK-007, TASK-082 |
+| 9 | TASK-083 | Oscilaciones de pocos segundos: cuántas hay, cuánto duran y si dejan ganancia neta tras comisiones | — | TASK-061, TASK-076 | lista para empezar |
+
+## H7 — Migración y puesta en marcha
+
+0 de 5 terminadas.
+
+| Paso | Tarea | Título | Complejidad | Depende de | Estado |
+|---|---|---|---|---|---|
+| 72 | TASK-054 | Importador del historial de OpenTrading sin copiar credenciales | — | TASK-019, TASK-032, TASK-059 | espera a TASK-019, TASK-032, TASK-059 |
+| 73 | TASK-055 | Ensayo en papel en paralelo con OpenTrading durante 7 días | — | TASK-044, TASK-050, TASK-054 | espera a TASK-044, TASK-050, TASK-054 |
+| 74 | TASK-056 | Avisos remotos por ntfy y vigía externo | — | TASK-039, TASK-050 | espera a TASK-039, TASK-050 |
+| 75 | TASK-057 | Runbook de operación y checklist de seguridad de claves | — | TASK-040, TASK-056 | espera a TASK-040, TASK-056 |
+| 76 | TASK-058 | Paso a real con capital mínimo y retirada de OpenTrading | — | TASK-055, TASK-057, TASK-074, TASK-079, TASK-080 | espera a TASK-055, TASK-057, TASK-074, TASK-079, TASK-080 |
+
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/fixtures/roadmap/toolsaweb.md b/taskcode-marketplace/plugins/taskcode-plugin/test/fixtures/roadmap/toolsaweb.md
new file mode 100644
index 0000000..98c5484
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/fixtures/roadmap/toolsaweb.md
@@ -0,0 +1,46 @@
+# Roadmap de tareas
+
+<!-- generado por scripts/grafo-tareas.py --escribir; no editar a mano -->
+
+Orden en que se hacen las tareas, agrupadas por hito (`sprint` del frontmatter). Sale de las dependencias: ninguna tarea va antes que aquellas de las que depende y, a igualdad, va primero la del hito y el número menores. El motivo de cada hito está en `docs/planificacion/hitos.md` §1. Las tareas descartadas (en `tareas/05-archivadas/`) no salen.
+
+- **En marcha:** TASK-298 (en curso)
+- **Listas para empezar:** TASK-211, TASK-194, TASK-234, TASK-257, TASK-117, TASK-198, TASK-217, TASK-228, TASK-158, TASK-159, TASK-160, TASK-161, TASK-163, TASK-164, TASK-165, TASK-166, TASK-193, TASK-169, TASK-183, TASK-184, TASK-185, TASK-199, TASK-201, TASK-219, TASK-236, TASK-024, TASK-039, TASK-040, TASK-041, TASK-151, TASK-046, TASK-235, TASK-011, TASK-111, TASK-048, TASK-043, TASK-044, TASK-052, TASK-100, TASK-119, TASK-248, TASK-249, TASK-250, TASK-252, TASK-253, TASK-254, TASK-255, TASK-256, TASK-279, TASK-296, TASK-283, TASK-293, TASK-276, TASK-286, TASK-291, TASK-292
+
+## H0 — Relaciones y modelo de datos
+
+44 de 45 terminadas.
+
+| Paso | Tarea | Título | Complejidad | Depende de | Estado |
+|---|---|---|---|---|---|
+| — | TASK-001 | Límites de módulos: cuestionar la división clásica antes de fijarla | alta | — | ✅ terminada |
+| — | TASK-002 | Arnés de evidencias: galería con estado y diferencias respecto a lo aprobado | media | — | ✅ terminada |
+| — | TASK-003 | Registro único de servicios para start-all y stop-all | simple | — | ✅ terminada |
+| — | TASK-004 | Arnés de arquitectura funcional extremo a extremo (walking skeleton) | alta | — | ✅ terminada |
+| — | TASK-008 | Inventario de la instalación de Clip: catálogos, aparatos de vía, normativa y plantillas | alta | — | ✅ terminada |
+| — | TASK-012 | Replanificación en hitos y tareas pequeñas a partir del estudio de Clip | media | TASK-008 | ✅ terminada |
+
+## H14 — Motor de CivilBoot (núcleo de SOLIDOS)
+
+7 de 8 terminadas.
+
+| Paso | Tarea | Título | Complejidad | Depende de | Estado |
+|---|---|---|---|---|---|
+| — | TASK-112 | Definiciones de CivilBoot versionadas con huella, origen, firma y aceptación por versión | media | TASK-101, TASK-224 | ✅ terminada |
+| — | TASK-113 | tw-expresion: lenguaje del motor de CivilBoot con unidades, sin nada de fuera y determinista | media | TASK-112, TASK-224 | ✅ terminada |
+| — | TASK-114 | Receta de CivilBoot como texto y nodos, con su validador y el orden deducido o forzado | alta | TASK-112, TASK-113, TASK-224 | ✅ terminada |
+| — | TASK-115 | Núcleo de sólidos: extrusión, barrido por eje, corte y booleanas con origen local | alta | TASK-114 | ✅ terminada |
+| — | TASK-238 | Ejecutor del motor de CivilBoot (tw-civilboot): contrato único, pila interna, intentar/capturar, presupuesto y tabla de errores | media | TASK-113, TASK-114 | ✅ terminada |
+| — | TASK-239 | Repetición y agrupación en el motor de CivilBoot | media | TASK-238 | ✅ terminada |
+| — | TASK-116 | Anclaje de piezas a eje, rasante y terreno | alta | TASK-114, TASK-074, TASK-083, TASK-033 | ✅ terminada |
+| 2 | TASK-117 | Recálculo incremental de piezas por nodo con niveles de invalidación | alta | TASK-115, TASK-116 | lista para empezar |
+
+## H17 — Publicidad, redes sociales y programa de partners (último hito)
+
+0 de 3 terminadas.
+
+| Paso | Tarea | Título | Complejidad | Depende de | Estado |
+|---|---|---|---|---|---|
+| 150 | TASK-288 | Publicidad y redes sociales: estudio completo con su tributación | media | TASK-286, TASK-291, TASK-292 | espera a TASK-286, TASK-291, TASK-292 |
+| 151 | TASK-289 | Programa de partners bronce, plata y oro y afiliados: estudio completo con su tributación | media | TASK-285, TASK-286, TASK-291 | espera a TASK-285, TASK-286, TASK-291 |
+| 152 | TASK-290 | Publicidad y partners: features de los estudios y partición del hito H17 en tareas | media | TASK-288, TASK-289 | espera a TASK-288, TASK-289 |
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/roadmap-fixtures.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/roadmap-fixtures.ts
new file mode 100644
index 0000000..bc08e23
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/roadmap-fixtures.ts
@@ -0,0 +1,118 @@
+// Fixtures de los tests del ROADMAP (TASK-098): repos Git temporales reales.
+
+import assert from 'node:assert/strict';
+import { readFileSync } from 'node:fs';
+import { mkdir, rm, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { spawnSync } from 'node:child_process';
+import { plantillaRepo, type ConRepo } from './repo-plantilla.js';
+import { readTareaFile, writeTareaFile } from '../../src/fs/task-store.js';
+import { STATE_FOLDER, type Task } from '../../src/core/task.js';
+
+export const HERE = path.dirname(fileURLToPath(import.meta.url));
+// dist/test/helpers -> raiz del paquete
+export const PAQUETE = path.join(HERE, '..', '..', '..');
+export const SCRIPTS_DIR = path.join(PAQUETE, 'scripts', 'gitflow');
+export const FIXTURES_ROADMAP = path.join(PAQUETE, 'test', 'fixtures', 'roadmap');
+
+export function git(args: string[], cwd: string): string {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')} fallo: ${r.stderr}`);
+  return r.stdout;
+}
+
+export function commitAll(repoRoot: string, mensaje: string): void {
+  git(['add', '-A'], repoRoot);
+  if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: repoRoot }).status === 0) return;
+  git(['commit', '-q', '-m', mensaje], repoRoot);
+}
+
+export function ficherosDeHead(repoRoot: string): string[] {
+  return git(['show', '--name-only', '--format=', 'HEAD'], repoRoot)
+    .split('\n')
+    .map((l) => l.trim())
+    .filter((l) => l !== '');
+}
+
+export function porcelain(repoRoot: string): string {
+  return git(['status', '--porcelain', '--untracked-files=all'], repoRoot).trim();
+}
+
+/** Bytes exactos de un fichero (Buffer), para comparar sin normalizar nada. */
+export function bytes(ruta: string): Buffer {
+  return readFileSync(ruta);
+}
+
+export function rutaRoadmap(repoRoot: string): string {
+  return path.join(repoRoot, 'tareas', 'ROADMAP.md');
+}
+
+export function tarea(overrides: Partial<Task> = {}): Task {
+  return {
+    id: 'TASK-930',
+    titulo: 'Tarea de prueba del roadmap',
+    tipo: 'feature',
+    sprint: 1,
+    etiquetas: ['cli'],
+    complejidad: 'simple',
+    modelo_sugerido: 'sonnet',
+    estado: 'planificada',
+    plan_aprobado: false,
+    rama: 'feature/task-930-roadmap',
+    asignado_a: null,
+    agente_revisor: 'general-purpose',
+    skills_recomendados: [],
+    regla_seleccion_skill: null,
+    ultimo_commit_revisado: null,
+    revision_codex: false,
+    tokens_diseno: null,
+    tokens_implementacion: null,
+    tokens_revision: null,
+    creado: '2026-11-10',
+    actualizado: '2026-11-10',
+    dependencias: [],
+    ...overrides,
+  };
+}
+
+/** Cuerpo que `plan` acepta (TASK-043: objetivo y al menos un criterio). */
+export const CUERPO_PLANIFICABLE =
+  '## Objetivo\nProbar el roadmap.\n\n## Criterios de aceptacion\n- [ ] Se regenera.\n';
+
+/** Repo con main y develop, sin tareas ni ROADMAP. core.autocrlf=false: los bytes son los bytes. */
+export const withRepo: ConRepo = plantillaRepo('taskctl-roadmap-', async (repoRoot) => {
+  git(['init', '-q', '-b', 'main'], repoRoot);
+  git(['config', 'user.email', 'test@example.com'], repoRoot);
+  git(['config', 'user.name', 'Test'], repoRoot);
+  git(['config', 'core.autocrlf', 'false'], repoRoot);
+  await writeFile(path.join(repoRoot, '.gitignore'), 'logs/\n', 'utf8');
+  await writeFile(path.join(repoRoot, 'README.md'), '# repo de prueba\n', 'utf8');
+  git(['add', '-A'], repoRoot);
+  git(['commit', '-q', '-m', 'inicial'], repoRoot);
+  git(['checkout', '-q', '-b', 'develop'], repoRoot);
+});
+
+/** Copia un ROADMAP de fixtures (byte a byte) a tareas/ROADMAP.md y lo commitea. */
+export async function ponerRoadmap(repoRoot: string, contenido: Buffer | string): Promise<void> {
+  await mkdir(path.join(repoRoot, 'tareas'), { recursive: true });
+  await writeFile(rutaRoadmap(repoRoot), contenido);
+  commitAll(repoRoot, 'docs: roadmap del proyecto');
+}
+
+/**
+ * Lo que dejarian review y el revisor en la rama de la tarea: la tarea en
+ * 03-en-revision con su informe aprobado, todo commiteado.
+ */
+export async function aRevision(repoRoot: string, tareasRoot: string, id: string): Promise<void> {
+  const { task, body } = (await readTareaFile(tareasRoot, id))!;
+  for (const carpeta of Object.values(STATE_FOLDER)) {
+    await rm(path.join(tareasRoot, carpeta, id), { recursive: true, force: true });
+  }
+  await writeTareaFile(tareasRoot, { ...task, estado: 'en-revision', plan_aprobado: true }, body);
+  const dir = path.join(tareasRoot, '03-en-revision', id, 'revision');
+  await mkdir(dir, { recursive: true });
+  await writeFile(path.join(dir, 'informe-revision-1.md'), `# Informe ${id}\n\n- Veredicto: aprobada\n`, 'utf8');
+  await writeFile(path.join(repoRoot, `trabajo-${id}.txt`), `trabajo de ${id}\n`, 'utf8');
+  commitAll(repoRoot, `feat(${id}): trabajo revisado`);
+}
````

## Excluido del diff (20 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-098/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-098/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-098/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-098/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-098/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-098/planificacion/plan-final.md                                    |   0
 tareas/{01-en-diseno => 02-en-curso}/TASK-098/tarea.md                                                       |   7 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 |  27 ++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli/args.js                                            |   1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/approve.js                                    |   2 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish.js                                     |   3 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/new.js                                        |   2 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/plan.js                                       |   2 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/roadmap.js                                    | 101 +++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/start.js                                      |   2 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         |   7 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roadmap-comparar.js                               | 140 +++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/roadmap.js                                        | 257 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git-commit.js                                       |  46 ++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/roadmap.js                                          | 197 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 20 files changed, 788 insertions(+), 6 deletions(-)
````
