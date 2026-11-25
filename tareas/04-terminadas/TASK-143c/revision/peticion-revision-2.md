# Peticion de revision — TASK-143c (ronda 2)

- Tarea: TASK-143c — paridad bash y TS, ls-remote y perfil-tests (parte c de TASK-143)
- Rama revisada: fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y
- Rama base: develop
- Commit revisado (HEAD): e8650f72eb51ca08d2194e5f59770d4004d391f8
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-143c (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 99767cb42a96391e2064f866bc3a596eb4ef1971 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (5 hallazgo(s)))

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

- tareas/03-en-revision/TASK-143c/tarea.md
- tareas/03-en-revision/TASK-143c/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/paridad-operacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 4 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| HAL-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts:747 | informe-revision-1.md |

## Commits a revisar (git log 99767cb42a96391e2064f866bc3a596eb4ef1971..HEAD)

````
e8650f7 fix(TASK-143c): ronda 1 (test de --main en finish, conDistProtegido con fallos y thenables, resolveMainBranch con una consulta, prioridad de operaciones)
d941f10 chore(TASK-143c): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 99767cb42a96391e2064f866bc3a596eb4ef1971..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index 54c27b0..c3ca6b0 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -548,7 +548,8 @@ export function conDistProtegido(dirPlugin, fn) {
     throw e;
   }
   if (resultado !== null && typeof resultado === 'object' && typeof resultado.then === 'function') {
-    return resultado.finally(cerrar);
+    // HAL-3 de su revision: un "thenable" sin finally tambien suelta el cerrojo.
+    return Promise.resolve(resultado).finally(cerrar);
   }
   cerrar();
   return resultado;
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
index 00bd1ca..c44ddc9 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts
@@ -838,15 +838,6 @@ export function mensajeTareaEnOtraRama(id: string, rama: string): string {
   );
 }
 
-/** true si esa rama existe en "origin". Asume que ya se llamo isRemoteAvailable. */
-function remoteBranchExists(name: string, cwd: string): boolean {
-  const ls = lsRemoto(['--heads', 'origin', name], cwd);
-  if (!ls.ok) throw new GitCommandError(['ls-remote', '--heads', 'origin', name], ocultarCredenciales(ls.stderr));
-  return ls.salida
-    .split('\n')
-    .some((line) => line.trim().endsWith(`refs/heads/${name}`));
-}
-
 /**
  * Reimplementacion en TypeScript de resolve_main_branch()
  * (_gitflow-common.sh): que rama usar como base "principal" cuando no
@@ -856,11 +847,19 @@ function remoteBranchExists(name: string, cwd: string): boolean {
  * scripts create-*.sh, no como script independiente invocable — mismo
  * motivo por el que isValidBranchName (TASK-009) ya reimplemento
  * assert_valid_branch_name en vez de intentar invocar la funcion sola.
+ *
+ * TASK-143c (HAL-4 de su revision): como resolve_main_branch, una sola
+ * consulta para main y master, y si origin no esta, no responde o agota el
+ * limite, se cae a las ramas locales sin error. Antes eran tres ls-remote
+ * (disponibilidad, main y master), y con el limite nuevo el segundo podia
+ * agotarse tras responder el primero y lanzar.
  */
 export function resolveMainBranch(cwd: string): string {
-  if (isRemoteAvailable(cwd)) {
-    if (remoteBranchExists('main', cwd)) return 'main';
-    if (remoteBranchExists('master', cwd)) return 'master';
+  const ls = lsRemoto(['--heads', 'origin', 'main', 'master'], cwd);
+  if (ls.ok) {
+    const remotas = ls.salida.split('\n').map((l) => l.trim());
+    if (remotas.some((l) => l.endsWith('refs/heads/main'))) return 'main';
+    if (remotas.some((l) => l.endsWith('refs/heads/master'))) return 'master';
   }
   if (localBranchExists('main', cwd)) return 'main';
   if (localBranchExists('master', cwd)) return 'master';
````

## Excluido del diff (12 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 99767cb42a96391e2064f866bc3a596eb4ef1971..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-143c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143c/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143c/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-143c/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-143c/revision/informe-revision-1.md                                                  |  21 +++
 tareas/03-en-revision/TASK-143c/revision/peticion-revision-1.md                                                 | 554 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-143c/tarea.md                                                       |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/git.js                                                 |  23 ++--
 12 files changed, 595 insertions(+), 14 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 99767cb42a96391e2064f866bc3a596eb4ef1971..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/paridad-operacion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge.test.ts     | 28 +++++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/paridad-operacion.test.ts | 42 +++++++++++++++++++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 41 +++++++++++++++++++++++++++++++++++++++++
 3 files changed, 109 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 230.7 s
- Commit verificado: e8650f72eb51ca08d2194e5f59770d4004d391f8
- Huella: e02c1d8fa5c1ad88adbc2485d4308829fbe8acf4
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 162516 bytes en total):

````
✔ timeoutRemotoMs (TASK-143c, SCR-08): GF_TIMEOUT_REMOTO en segundos, 5 por defecto o si no es un entero mayor que 0 (0.9438ms)
✔ argumentosScriptMerge (TASK-143c, SCR-08): hotfix y release llevan --main con la principal ya resuelta (1.8917ms)
✔ cuenta por fichero los tests y los procesos git (desde node y desde bash), y la duracion (15566.0193ms)
✔ perfil-tests (TASK-143c, SCR-13): compila con dist/src protegido y lo devuelve tal cual (6131.1736ms)
✔ un test cambiado se corre solo el (12746.5098ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (8720.5239ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (18755.2859ms)
✔ un cambio sin commitear tambien cuenta (2763.9299ms)
✔ un helper de test elige los tests que lo importan (2823.3663ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (7943.456ms)
✔ TASK-156: un .md de skills/, agents/ o docs/ del plugin elige los tests que leen su carpeta, ademas de los que lo nombran (12225.0359ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (4864.7666ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (2649.9059ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (4318.6716ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (11196.6368ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) ni TIPO_VERIFICACION (13200.9589ms)
✔ TASK-139b: con selectiva y un cambio sin test que lo nombre, corre la suite entera (11607.7964ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (4392.7578ms)
✔ TASK-139b: con TIPO_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (6466.6945ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (6831.6201ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (6524.5845ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (3653.734ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (10481.7775ms)
[ERROR] verificar-impacto: otra verificacion (pid 54656) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-vgokkb\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-vgokkb\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (3439.1597ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (18.1883ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (3233.3331ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (3528.4326ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (13896.1946ms)
✔ conDistProtegido (TASK-143c, HAL-2 y HAL-3): devuelve dist/src y suelta el cerrojo aunque fn lance, rechace o sea un thenable sin finally (189.7168ms)
ℹ tests 806
ℹ suites 0
ℹ pass 806
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 207336.8001
[verificar-impacto] node --test termino con 0 en 207.6 s.
````
