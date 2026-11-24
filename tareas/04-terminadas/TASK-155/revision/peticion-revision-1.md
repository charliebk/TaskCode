# Peticion de revision — TASK-155 (ronda 1)

- Tarea: TASK-155 — comprobarSkillInstalado verificable en Windows (claude.cmd)
- Rama revisada: fix/task-155-comprobarskillinstalado-verificable-en-w
- Rama base: develop
- Commit revisado (HEAD): 8817288513a00e69968b5158767466b4c1f8b31e
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-155 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-155/tarea.md
- tareas/03-en-revision/TASK-155/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts

## Commits a revisar (git log develop..HEAD)

````
8817288 update(fix): develop -> fix/task-155-comprobarskillinstalado-verificable-en-w
a405564 chore(TASK-155): autorrevision
6213377 fix(TASK-155): comprobarSkillInstalado localiza claude con PATHEXT y lanza el .cmd de Windows
7f51b8e chore(TASK-155): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
index 8bdd03d..3d26665 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/plugin-instalado.ts
@@ -8,8 +8,9 @@
  * aislarla evita que un fallo de "claude plugin list" se confunda con
  * un fallo de parseo del catalogo.
  *
- * Mismo patron de subproceso que runGit() en fs/git.ts (spawnSync +
- * comprobar result.error / result.status), pero con una semantica de
+ * Mismo patron de subproceso que runGit() en fs/git.ts (lanzar y
+ * comprobar error / status; desde TASK-155 via ejecutarHerramienta,
+ * para que un `claude.cmd` de Windows arranque), pero con una semantica de
  * error DISTINTA a proposito: runGit() LANZA porque un fallo de Git
  * debe abortar el comando que lo pidio. Aqui un fallo del subproceso
  * (binario ausente, timeout, JSON mal formado, forma inesperada) NUNCA
@@ -53,7 +54,7 @@
  * subproceso esta aislado aqui para que el resto de la seleccion de skill siga
  * siendo pura.
  */
-import { spawnSync } from 'node:child_process';
+import { ejecutarHerramienta, localizarHerramienta, pathDelProceso } from '../fs/herramientas-deploy.js';
 
 export type EstadoInstalacionSkill = 'instalado' | 'no-instalado' | 'no-verificable';
 
@@ -108,16 +109,24 @@ export function interpretarResultadoPluginList(
   return instalado ? 'instalado' : 'no-instalado';
 }
 
+/**
+ * TASK-155: en Windows `claude` es un `.cmd`, y `spawnSync('claude', ...)` sin
+ * shell no lo ejecuta (ENOENT), asi que el resultado era siempre
+ * 'no-verificable'. Se localiza en el PATH con PATHEXT y se lanza con
+ * `ejecutarHerramienta`, que pasa por el shell (ruta citada) solo si es un
+ * `.cmd`/`.bat` en Windows. Los argumentos son constantes, sin caracteres
+ * especiales del shell.
+ */
 export function comprobarSkillInstalado(pluginId: string): EstadoInstalacionSkill {
-  const result = spawnSync('claude', ['plugin', 'list', '--json'], {
-    encoding: 'utf8',
-    timeout: TIMEOUT_MS,
-  });
+  const pathEnv = pathDelProceso();
+  const ruta = localizarHerramienta('claude', pathEnv);
+  if (ruta === null) return 'no-verificable';
+  const e = ejecutarHerramienta(ruta, ['plugin', 'list', '--json'], process.cwd(), pathEnv, TIMEOUT_MS);
   return interpretarResultadoPluginList(
     {
-      error: result.error,
-      status: result.status,
-      stdout: typeof result.stdout === 'string' ? result.stdout : null,
+      error: e.error === null ? undefined : new Error(e.error),
+      status: e.status,
+      stdout: e.stdout,
     },
     pluginId
   );
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-155/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-155/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-155/tarea.md                                    |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/plugin-instalado.js            | 25 +++++++++++++++++--------
 4 files changed, 23 insertions(+), 9 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts | 50 +++++++++++++++++++++++++++++++++++++++++++++++---
 1 file changed, 47 insertions(+), 3 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 44.7 s
- Commit verificado: 8817288513a00e69968b5158767466b4c1f8b31e
- Huella: cd9f986af464e598eea2fac42e61f01775c4f47e
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 68704 bytes en total):

````
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.2824ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.1957ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (4.5041ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.8831ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (8.4087ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (2.1404ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (1.418ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (0.9369ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1782.6186ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1873.4428ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.5808ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.2771ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.983ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.693ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.8798ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.3802ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (3.7135ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.8549ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (3.4215ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.3386ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.9147ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.4975ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.5404ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8609ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4214ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4643ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3818ms)
✔ comprobarSkillInstalado: un plugin inventado nunca sale como instalado (10454.4726ms)
✔ comprobarSkillInstalado: sin el binario claude en el PATH es no-verificable, sin lanzar (2.8053ms)
✔ comprobarSkillInstalado: con un claude (.cmd en Windows) en el PATH que lista el plugin, instalado (110.209ms)
✔ comprobarSkillInstalado: con un claude (.cmd en Windows) en el PATH que no lo lista, no-instalado (141.7471ms)
ℹ tests 700
ℹ suites 0
ℹ pass 700
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 17497.6386
[verificar-impacto] node --test termino con 0 en 17.7 s.
````
