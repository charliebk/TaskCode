# Peticion de revision — TASK-149b (ronda 2)

- Tarea: TASK-149b — errores y flags del CLI (parte b de TASK-149)
- Rama revisada: fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli
- Rama base: develop
- Commit revisado (HEAD): 2baa0fbcbf9b9f9cb62848fe589070650ac8d7a7
- Fecha: 2026-11-23
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-149b (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde d85d2ab46005ae66a9cccee7d13c5b803734921b (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (2 hallazgo(s)))

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

- tareas/03-en-revision/TASK-149b/tarea.md
- tareas/03-en-revision/TASK-149b/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 1 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/cli.ts (ERRORES_COMUNES_CLI), test/cli/errores-comunes.test.ts | informe-revision-1.md |

## Commits a revisar (git log d85d2ab46005ae66a9cccee7d13c5b803734921b..HEAD)

````
2baa0fb chore(TASK-149b): autorrevision ronda 2
2735c6e fix(TASK-149b): esErrorComunCli con test de las 9 clases comunes (IMP-1)
208fe1f chore(TASK-149b): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff d85d2ab46005ae66a9cccee7d13c5b803734921b..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index 2cbe3c3..2ac5f34 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -56,7 +56,7 @@ import {
   CODIGO_SINCRONIZACION_NO_APLICADA,
   sincronizacionNoAplicada,
 } from './fs/sincronizacion.js';
-// ConfigError se captura en los mismos catch que AutoCommitError
+// ConfigError es un error comun del CLI (ERRORES_COMUNES_CLI, TASK-149b)
 // (integracion TASK-030): sin esto cae al catch-all de bin/taskctl y
 // sale como "[ERROR] taskctl no pudo arrancar: ...", que miente —
 // taskctl arranco bien, lo que esta mal es el .taskcode/config.yml
@@ -444,8 +444,8 @@ export async function main(argv: readonly string[]): Promise<number> {
     // TASK-149b (FS-03): los errores comunes se traducen igual en todos los
     // comandos; cada catch de comando conserva solo los suyos. Sin esto, un
     // GitCommandError en new, plan, approve... salia como «taskctl no pudo arrancar».
-    if (ERRORES_COMUNES_CLI.some((C) => e instanceof C)) {
-      printCliError(e as Error);
+    if (esErrorComunCli(e)) {
+      printCliError(e);
       return 1;
     }
     throw e;
@@ -454,7 +454,7 @@ export async function main(argv: readonly string[]): Promise<number> {
 }
 
 /** TASK-149b (FS-03): errores que cualquier comando puede lanzar y que el CLI traduce a «[ERROR] ...» con codigo 1. */
-const ERRORES_COMUNES_CLI: readonly (abstract new (...args: never[]) => Error)[] = [
+export const ERRORES_COMUNES_CLI: readonly (abstract new (...args: never[]) => Error)[] = [
   AutoCommitError,
   ConfigError,
   GitLaunchError,
@@ -466,6 +466,11 @@ const ERRORES_COMUNES_CLI: readonly (abstract new (...args: never[]) => Error)[]
   TaskFolderConflictError,
 ];
 
+/** TASK-149b (IMP-1 de su revision): true si `main` traduce `e` a «[ERROR] ...» con codigo 1. */
+export function esErrorComunCli(e: unknown): e is Error {
+  return ERRORES_COMUNES_CLI.some((C) => e instanceof C);
+}
+
 async function mainComando(argvEntrada: readonly string[]): Promise<number> {
   let argv = argvEntrada;
   const cmd = argv[0];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
index 2a6504e..7dd80ce 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli/args.ts
@@ -234,4 +234,3 @@ export function extraerPushFlag(argv: readonly string[]): { push: boolean; resto
   }
   return { push, resto };
 }
-
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
index 64b8cb2..780ab5c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git-commit.ts
@@ -456,4 +456,3 @@ function detalleDeError(e: unknown): string {
   }
   return e instanceof Error ? e.message : String(e);
 }
-
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff d85d2ab46005ae66a9cccee7d13c5b803734921b..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-149b/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149b/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149b/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149b/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149b/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149b/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149b/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-149b/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-149b/revision/informe-revision-1.md                                                  |  21 ++
 tareas/03-en-revision/TASK-149b/revision/peticion-revision-1.md                                                 | 946 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-149b/tarea.md                                                       |  16 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                    |  10 +-
 12 files changed, 987 insertions(+), 6 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff d85d2ab46005ae66a9cccee7d13c5b803734921b..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/cli/errores-comunes.test.ts | 29 +++++++++++++++++++++++++++++
 1 file changed, 29 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 125.3 s
- Commit verificado: 2baa0fbcbf9b9f9cb62848fe589070650ac8d7a7
- Huella: e83f4a0495e98efee1c204a5e0c4a46218fb0678
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 146623 bytes en total):

````
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (2456.2747ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (2688.7322ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (1.9576ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.3392ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9119ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6974ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.6507ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.0394ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.9326ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.019ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (1.6392ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (4.6675ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (2.5424ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.0698ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.7431ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.9855ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4151ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.7209ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3869ms)
✔ autoCommit NO se lleva el trabajo de la persona: su fichero sucio no entra en el commit y sigue sucio (3177.9894ms)
✔ autoCommit respeta lo que la persona ya tenia PREPARADO con git add (modo --only) (2604.0735ms)
✔ autoCommit registra el MOVIMIENTO de carpeta (origen borrado + destino) en un solo commit (2311.2551ms)
✔ autoCommit no crea commits vacios cuando el fichero ya estaba identico (1820.0402ms)
✔ autoCommit ignora rutas que no existen ni en disco ni en el indice (carpeta de origen no versionada) (2402.4651ms)
✔ autoCommit falla RUIDOSAMENTE si un hook de pre-commit rechaza, diciendo que esta escrito pero no registrado (2074.3399ms)
✔ autoCommit rechaza la raiz del repo y cualquier ruta de fuera (no hay git add -A por la puerta de atras) (1204.3282ms)
✔ autoCommit --push: con un origin bare real, la rama llega al remoto (3605.8944ms)
✔ autoCommit --push sin remoto: avisa y sigue (no lanza), y el commit local se hace igual (2171.4456ms)
✔ autoCommit --push con HEAD desacoplado: avisa y no intenta subir nada (2511.7386ms)
✔ autoCommit --push que falla de verdad: lanza diciendo que el commit SI se creo (4016.2569ms)
✔ mensajeChore: formato del repo y rechazo de tildes (los scripts de Git-Flow los procesan) (0.6232ms)
ℹ tests 788
ℹ suites 0
ℹ pass 787
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 110922.1721
[verificar-impacto] node --test termino con 0 en 111.1 s.
````
