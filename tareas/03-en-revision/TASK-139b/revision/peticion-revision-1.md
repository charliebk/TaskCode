# Peticion de revision — TASK-139b (ronda 1)

- Tarea: TASK-139b — la selectiva no recorta en silencio (parte b de TASK-139)
- Rama revisada: fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di
- Rama base: develop
- Commit revisado (HEAD): 99a5aa4e26d6e2474b3e60491d8206d8de59feab
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-139b (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-139b/tarea.md
- tareas/03-en-revision/TASK-139b/planificacion/
- .taskcode/config.yml
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-presupuesto.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Commits a revisar (git log develop..HEAD)

````
99a5aa4 chore(TASK-139b): autorrevision
b481b52 fix(TASK-139b): la selectiva de review y finish no recorta en silencio
a30e1fe chore(TASK-139b): tarea en curso
0651424 merge(TASK-139b): develop en fix/task-139-regla-4d-tests-que-no-protegen-lo-que-di para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.taskcode/config.yml b/.taskcode/config.yml
index a471062..8493818 100644
--- a/.taskcode/config.yml
+++ b/.taskcode/config.yml
@@ -6,6 +6,14 @@ modo_flujo: automatico
 comando_verificacion: "npm --prefix taskcode-marketplace/plugins/taskcode-plugin test"
 timeout_verificacion: 3600
 comando_verificacion_selectiva: "node scripts/verificar-impacto.mjs"
+# TASK-139b: review y finish corren la selectiva SIN tope (TASKCODE_VERIFICACION=
+# selectiva: todos los afectados, o la suite entera si no se sabe que afecta),
+# asi que su timeout es el de la completa. El freno de fin de turno corre el
+# mismo script como comando propio (tipo freno, memo aparte, con el tope de 10):
+# su verde recortado no lo reutilizan finish ni el guardian.
+timeout_verificacion_selectiva: 3600
+comando_verificacion_freno: "node scripts/verificar-impacto.mjs"
+presupuesto_freno_s: 600
 rutas_documentacion: [docs/**, "*.md"]
 rutas_verificacion_parcial: [taskcode-marketplace/plugins/taskcode-plugin/src/**, taskcode-marketplace/plugins/taskcode-plugin/test/**, taskcode-marketplace/plugins/taskcode-plugin/dist/src/**]
 
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index 3bc6284..4f7a3ca 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -41,6 +41,9 @@
  * luego los de una carpeta con el nombre de la suya (`test/gitflow/` para
  * `scripts/gitflow/*`) y despues el resto por orden alfabetico. La salida dice
  * cuantos se dejan fuera. Nunca queda en cero lo que cambia si tiene tests.
+ * Con TASKCODE_VERIFICACION=selectiva (rondas de review y finish, TASK-139b) no
+ * hay tope: todos los afectados, y la suite entera si no se sabe que afecta. El
+ * freno lo lanza como comando propio (tipo `freno`) y conserva el tope.
  *
  * Base inexistente (RAMA_BASE o `develop`): sale con 1 y lo dice; no hay
  * verificacion por impacto sin una base con la que comparar.
@@ -349,6 +352,16 @@ function leerTope(valor) {
   return valor !== undefined && valor.trim() !== '' && Number.isInteger(n) && n >= 0 ? n : TOPE_POR_DEFECTO;
 }
 
+/**
+ * TASK-139b: el tope que se aplica. Con TASKCODE_VERIFICACION=selectiva (la
+ * pasa el plugin en las rondas de review y en finish) no hay tope: se corren
+ * todos los afectados, porque un recorte ahi dejaba integrar rojos que nadie
+ * ejecuto. Con `freno` (comando_verificacion_freno) o a mano, el de siempre.
+ */
+export function topeEfectivo(env) {
+  return env.TASKCODE_VERIFICACION === 'selectiva' ? Infinity : leerTope(env.VERIFICAR_IMPACTO_TOPE);
+}
+
 function aDist(fichero) {
   return `dist/${fichero.replace(/\.ts$/, '.js')}`;
 }
@@ -376,25 +389,35 @@ function main(argv) {
     return 1;
   }
   const nodos = grafoDelPlugin(dirPlugin);
-  const seleccion = seleccionar(cambiadas, nodos, leerTope(process.env.VERIFICAR_IMPACTO_TOPE));
+  const tope = topeEfectivo(process.env);
+  const sinTope = tope === Infinity;
+  const seleccion = seleccionar(cambiadas, nodos, tope);
+  // TASK-139b: sin tope y sin saber que afecta, la suite entera (no los directos).
+  const suiteEntera = sinTope && seleccion.todo;
   const rapido = RAPIDO.filter((d) => existsSync(path.join(dirPlugin, d)));
   const fuera = seleccion.tests.filter((t) => !enRapido(t.fichero));
 
   if (listar) {
-    console.log(JSON.stringify({ base, cambiadas, ...seleccion, rapido }, null, 2));
+    console.log(JSON.stringify({ base, cambiadas, ...seleccion, rapido, sinTope, suiteEntera }, null, 2));
     return 0;
   }
 
   console.log(`[verificar-impacto] Base: ${base}. Ficheros cambiados: ${String(cambiadas.length)}.`);
-  console.log(`[verificar-impacto] Siempre: ${rapido.join(', ')} (lo de test:rapido).`);
+  if (sinTope) console.log('[verificar-impacto] Sin tope (TASKCODE_VERIFICACION=selectiva: ronda de review o finish): todos los afectados.');
   if (seleccion.enrutador !== undefined) console.log(`[verificar-impacto] Enrutador: ${seleccion.enrutador}.`);
-  if (seleccion.recorte !== undefined) {
-    console.log(`[verificar-impacto] Seleccion recortada: ${seleccion.recorte}. La suite completa queda para antes de publicar.`);
+  let objetivos;
+  if (suiteEntera) {
+    console.log(`[verificar-impacto] Suite entera: ${seleccion.motivo}.`);
+    objetivos = ['dist/test/**/*.test.js'];
+  } else {
+    console.log(`[verificar-impacto] Siempre: ${rapido.join(', ')} (lo de test:rapido).`);
+    if (seleccion.recorte !== undefined) {
+      console.log(`[verificar-impacto] Seleccion recortada: ${seleccion.recorte}. La suite completa queda para antes de publicar.`);
+    }
+    console.log(`[verificar-impacto] Por impacto: ${String(fuera.length)} fichero(s) de test.`);
+    for (const t of fuera) console.log(`  - ${t.fichero} (${t.motivo})`);
+    objetivos = [...rapido.map((d) => `dist/${d}/**/*.test.js`), ...fuera.map((t) => aDist(t.fichero))];
   }
-  console.log(`[verificar-impacto] Por impacto: ${String(fuera.length)} fichero(s) de test.`);
-  for (const t of fuera) console.log(`  - ${t.fichero} (${t.motivo})`);
-
-  const objetivos = [...rapido.map((d) => `dist/${d}/**/*.test.js`), ...fuera.map((t) => aDist(t.fichero))];
   if (objetivos.length === 0) {
     console.log('[verificar-impacto] No hay tests que correr.');
     return 0;
@@ -436,6 +459,8 @@ function main(argv) {
     // RAMA_BASE es para elegir la seleccion, no para los tests: un test que la herede
     // cambia de comportamiento (el freno Stop siempre la pasa a la selectiva).
     delete env.RAMA_BASE;
+    // TASK-139b: igual con el tipo de verificacion (lo leen los tests del freno).
+    delete env.TASKCODE_VERIFICACION;
     const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...objetivos], {
       cwd: dirPlugin,
       env,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index e656397..8a9b6d6 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -41,6 +41,13 @@ timeout_verificacion_selectiva: 600                                 # opcional (
 - Recibe la rama base de la tarea en la variable de entorno `RAMA_BASE` (la de
   integración, o la principal en un hotfix); no se añade nada al comando. El
   mapa de capas es del proyecto: el script decide qué correr.
+- Recibe también `TASKCODE_VERIFICACION` con quién la corre: `selectiva` en las
+  rondas de `review` y en `finish`, `freno` con `comando_verificacion_freno`
+  (y `completa` o `documentacion` en las demás). Así un script puede recortar en
+  el fin de turno y no en las puertas que integran: un recorte allí deja
+  integrar tests afectados que nadie ejecutó. Sin `comando_verificacion_freno`,
+  el freno corre la selectiva tal cual y comparte su memo, así que para
+  recortar solo en el freno se declara esa clave.
 - Exige `comando_verificacion`: la selectiva sin la completa aborta, porque
   dejaría `finish` sin puerta. El timeout sin su comando también aborta.
 - **Hook `Stop`**: con la clave corre la selectiva en vez de la completa, con su
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 6b0481d..08c2af2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -33,6 +33,9 @@ corre la completa y `review` no verifica nada.
 - La **rama base** de la tarea llega en la variable de entorno `RAMA_BASE`
   (la de integracion, o la principal en un hotfix). No se anade nada al
   comando.
+- `TASKCODE_VERIFICACION` dice quien la corre: `selectiva` en review y finish
+  (que no recorte: deja integrar tests sin correr), `freno` con
+  `comando_verificacion_freno` (ahi puede recortar).
 - Verde es salir con codigo 0. Cualquier otro codigo, o pasarse del timeout,
   es rojo.
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index 1e74d62..b99772a 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -58,6 +58,14 @@ const VERSION_MEMO = 1;
  */
 export const VARIABLE_RAMA_BASE = 'RAMA_BASE';
 
+/**
+ * TASK-139b: el tipo de verificacion que corre el comando (`selectiva` en
+ * review y finish, `freno` en el Stop, `completa`, `documentacion`). Asi un
+ * comando selectivo puede recortar en el freno, que corre en cada fin de
+ * turno, y no en finish, que integra. Informativa: quien la ignora no cambia.
+ */
+export const VARIABLE_TIPO_VERIFICACION = 'TASKCODE_VERIFICACION';
+
 export interface OpcionesVerificacion {
   /** Solo para tests: sustituye al timeout en segundos (en ms). */
   timeoutMs?: number;
@@ -309,9 +317,11 @@ export function verificarConMemo(
     return { resultado: guardado, deMemo: true, cambioElArbol: false, commit, huella };
   }
 
-  const env = conBase
-    ? { ...(opciones.env ?? process.env), [VARIABLE_RAMA_BASE]: p.base as string }
-    : opciones.env;
+  const env: NodeJS.ProcessEnv = {
+    ...(opciones.env ?? process.env),
+    [VARIABLE_TIPO_VERIFICACION]: p.tipo,
+    ...(conBase ? { [VARIABLE_RAMA_BASE]: p.base as string } : {}),
+  };
   const resultado = ejecutarVerificacion(raiz, p.comando, p.timeoutS, {
     ...(opciones.timeoutMs === undefined ? {} : { timeoutMs: opciones.timeoutMs }),
     ...(env === undefined ? {} : { env }),
````

## Excluido del diff (4 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-139b/planificacion/brainstorm/peticion-plan-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-139b/planificacion/plan-final.md                 |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-139b/tarea.md                                    | 10 ++++++++--
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                   | 15 ++++++++++++---
 4 files changed, 20 insertions(+), 5 deletions(-)
````

## Tests del diff (3 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-presupuesto.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-selectiva.test.ts | 11 +++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-presupuesto.test.ts         |  9 +++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts       | 32 +++++++++++++++++++++++++++++++-
 3 files changed, 51 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 422.8 s
- Commit verificado: 99a5aa4e26d6e2474b3e60491d8206d8de59feab
- Huella: 1dcc77ea21628f27bd8e5ed319019b2411e86c20
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 145132 bytes en total):

````

✔ guardian TASK-101: exencion de documentacion, release, config del destino y bloqueos de punta a punta (125818.3547ms)
✔ comandoSoloIntegra: solo un merge, cambiar de carpeta o de rama y consultar (3.4714ms)
✔ guardian TASK-105 y TASK-108: seleccion parcial, nivel 2 y mensajes de bloqueo (90160.8993ms)
✔ comando-merge: segmentacion, deteccion de merges, wrappers de shell y casos de TASK-103 (15.5024ms)
✔ guardia: decision de bloquear o dejar pasar un merge segun verde guardado, ramas y config (71518.5857ms)
✔ guardia: punto de entrada real por stdin y hooks.json (77721.5716ms)
✔ un test cambiado se corre solo el (11611.9191ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (8359.1955ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (39956.8341ms)
✔ un cambio sin commitear tambien cuenta (4992.8245ms)
✔ un helper de test elige los tests que lo importan (4562.3779ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (55242.6097ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (20325.6053ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (16335.6813ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (13785.7376ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (64954.7732ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) (28614.1539ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (10467.3288ms)
✔ TASK-139b: con TASKCODE_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (5502.3853ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (16183.5473ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (8762.9233ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (6916.1732ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (12131.167ms)
[ERROR] verificar-impacto: otra verificacion (pid 43720) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-MPkLoD\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-MPkLoD\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (4094.6362ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (24.6008ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (3081.3592ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (4083.6284ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (14494.6587ms)
ℹ tests 815
ℹ suites 0
ℹ pass 815
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 365065.1138
[verificar-impacto] node --test termino con 0 en 365.2 s.
````
