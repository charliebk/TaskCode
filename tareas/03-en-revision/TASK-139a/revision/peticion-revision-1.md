# Peticion de revision — TASK-139a (ronda 1)

- Tarea: TASK-139a — disfraces B1-B5 (parte a de TASK-139)
- Rama revisada: fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di
- Rama base: develop
- Commit revisado (HEAD): 206299494ed2bd8b59fad3b04589fa9c9cdb8fc4
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-139a (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-139a/tarea.md
- tareas/03-en-revision/TASK-139a/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/poda-tests.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/resolver-bash.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Commits a revisar (git log develop..HEAD)

````
2062994 chore(TASK-139a): autorrevision
c229ae2 fix(TASK-139a): tests que protegen lo que dicen (B1-B5)
a2586b8 chore(TASK-139a): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index d34efae..3bc6284 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -464,7 +464,7 @@ function leerEspera(valor) {
   return valor !== undefined && valor.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : ESPERA_POR_DEFECTO_S;
 }
 
-function dormir(ms) {
+function esperar(ms) {
   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
 }
 
@@ -493,8 +493,10 @@ function pidDelCerrojo(cerrojo) {
  * un proceso que ya no existe, o ilegible, es de una ejecucion cortada: se
  * borra y se vuelve a intentar (otra puede ganar la carrera; entonces se la
  * espera). false si la espera se agota, con el motivo ya impreso.
+ * Exportada, con `dormir` sustituible, para probar la rama del cerrojo
+ * ilegible sin depender de tiempos (TASK-139a).
  */
-function tomarCerrojo(cerrojo, esperaS) {
+export function tomarCerrojo(cerrojo, esperaS, { dormir = esperar } = {}) {
   const limite = Date.now() + esperaS * 1000;
   let avisado = false;
   let dudaIlegible = false;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 7bc4dcf..0a81a26 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -56,6 +56,7 @@ import { hostDeRemoto, ocultarCredenciales, CLI_PLATAFORMA } from '../core/plata
 import { STATE_FOLDER, TASK_ID_RE, TASK_STATES, isValidTaskId } from '../core/task.js';
 import { diaLocal, evaluarDocumentoEstado, type TareaTerminadaFecha } from '../core/documento-estado.js';
 import { resolveGitflowScriptsDir, sondearBash } from '../fs/gitflow-runner.js';
+import { textoBashUsado } from '../core/resolver-bash.js';
 import { urlsDeOrigin } from '../fs/git.js';
 import { sondearCli } from '../fs/merge-request.js';
 import { resolverRemotoDeOrigin } from './finish-opciones.js';
@@ -216,12 +217,7 @@ function arregloBash(): string {
 function comprobarBash(deps: DoctorCommandDeps): Comprobacion {
   const r = sondearBash({ scriptsDir: deps.scriptsDir ?? resolveGitflowScriptsDir(), cwd: deps.repoCwd });
   // TASK-134: en Windows se dice que bash se usa, y si no aparecio el de Git junto a git.exe.
-  const cual =
-    r.bash.origen === 'git'
-      ? `; bash de Git: ${r.bash.comando}`
-      : process.platform === 'win32'
-        ? '; no se encontro el bash de Git junto a git.exe: se usa el "bash" del PATH'
-        : '';
+  const cual = textoBashUsado(r.bash, process.platform);
   if (r.ok) return ok('bash', `bash ejecuta los scripts de Git-Flow${r.version === '' ? '' : ` (bash ${r.version})`}${cual}`);
   const que =
     r.causa === 'no-lanzable'
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
index c8938c0..95ea65f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/resolver-bash.ts
@@ -70,3 +70,13 @@ export function entornoParaBash(
   const actual = entorno[clave] ?? '';
   return { ...entorno, [clave]: actual === '' ? bash.herramientas : `${bash.herramientas};${actual}` };
 }
+
+/**
+ * TASK-139a (B4): la coletilla del mensaje de `taskctl doctor` sobre que bash
+ * se usa. Pura para probarla en cualquier sistema: en el CI de Linux las
+ * aserciones del doctor real solo veian la rama de Linux.
+ */
+export function textoBashUsado(bash: BashResuelto, plataforma: NodeJS.Platform): string {
+  if (bash.origen === 'git') return `; bash de Git: ${bash.comando}`;
+  return plataforma === 'win32' ? '; no se encontro el bash de Git junto a git.exe: se usa el "bash" del PATH' : '';
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
tareas/{01-en-diseno => 02-en-curso}/TASK-139a/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-139a/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-139a/tarea.md                                    | 10 ++++++++--
 tareas/04-terminadas/TASK-133/tarea.md                                                     |  8 ++++----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                   |  7 ++-----
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/resolver-bash.js                | 10 ++++++++++
 6 files changed, 24 insertions(+), 11 deletions(-)
````

## Tests del diff (4 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/poda-tests.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/resolver-bash.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-tests-stat.test.ts |  9 +++++++--
 taskcode-marketplace/plugins/taskcode-plugin/test/core/poda-tests.test.ts            |  2 ++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/resolver-bash.test.ts         | 13 ++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts  | 33 ++++++++++++++++++++++++++++++++-
 4 files changed, 53 insertions(+), 4 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 299.1 s
- Commit verificado: 206299494ed2bd8b59fad3b04589fa9c9cdb8fc4
- Huella: b6d4398e2af07465f8604144576ae4a587181c66
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 110641 bytes en total):

````
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.0131ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.6981ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.488ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.8779ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.806ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.3541ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4457ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3449ms)
✔ un test cambiado se corre solo el (9744.7837ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (17914.7802ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (23480.5889ms)
✔ un cambio sin commitear tambien cuenta (2011.8222ms)
✔ un helper de test elige los tests que lo importan (2611.5233ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (8192.548ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (4911.9199ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (3888.6419ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (10920.8727ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (31363.3541ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) (9741.4558ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (5275.5324ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (11430.3105ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (33292.6928ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (17543.6837ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (15998.0994ms)
[ERROR] verificar-impacto: otra verificacion (pid 39592) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-VKqO4V\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-VKqO4V\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (5284.211ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (22.4258ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (3749.9982ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (4858.4395ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (15032.8943ms)
ℹ tests 834
ℹ suites 0
ℹ pass 834
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 275556.1448
[verificar-impacto] node --test termino con 0 en 275.8 s.
````
