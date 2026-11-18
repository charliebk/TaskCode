# Peticion de revision — TASK-136 (ronda 1)

- Tarea: TASK-136 — Cerrojo en verificar-impacto: dos ejecuciones solapadas borran dist/src
- Rama revisada: fix/task-136-cerrojo-en-verificar-impacto-dos-ejecuci
- Rama base: develop
- Commit revisado (HEAD): c28556de1354dddae973ac191a1e5148947d7b6a
- Fecha: 2026-11-18
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-136 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-136/tarea.md
- tareas/03-en-revision/TASK-136/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Commits a revisar (git log develop..HEAD)

````
c28556d fix(TASK-136): cerrojo en verificar-impacto, dos ejecuciones solapadas ya no borran dist/src
6822d54 chore(TASK-136): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index aba7f13..e2c2f23 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -52,6 +52,13 @@
  * la copia con su marcador, restaura `dist/src` y lo avisa. `dist/test` (no
  * versionado) puede quedar a medias hasta el siguiente build.
  *
+ * Cerrojo (TASK-136): la copia es una por plugin, asi que dos ejecuciones a la
+ * vez (una ronda de `review` y el freno Stop) se pisaban y dejaban `dist/src`
+ * borrado. Un fichero `<copia>.cerrojo` con el pid, creado de forma atomica,
+ * hace que la segunda espere (VERIFICAR_IMPACTO_ESPERA_S, 1800 por defecto;
+ * agotada, sale con 1). Un cerrojo con un pid que ya no existe es de una
+ * ejecucion cortada: se toma y se recupera la copia como arriba.
+ *
  * `--listar` solo imprime la seleccion en JSON (sin compilar ni ejecutar).
  * Cero dependencias: node >= 22.
  */
@@ -396,12 +403,25 @@ function main(argv) {
   // dist/src (versionado). Se guarda antes y se devuelve tal cual al acabar.
   const distSrc = path.join(dirPlugin, 'dist', 'src');
   const copia = dirCopia(dirPlugin);
-  restaurarHuerfana(copia, distSrc);
-  mkdirSync(copia, { recursive: true });
-  const habiaDist = existsSync(distSrc);
-  if (habiaDist) cpSync(distSrc, path.join(copia, 'src'), { recursive: true });
-  // El marcador va el ultimo: sin el, la copia esta a medias y no se restaura.
-  writeFileSync(path.join(copia, MARCADOR), JSON.stringify({ dirPlugin, habiaDist, pid: process.pid }));
+  // TASK-136: la copia es una por plugin. Sin cerrojo, una segunda ejecucion
+  // (review en segundo plano y el freno Stop a la vez) tomaba la copia viva de
+  // la primera por huerfana, la restauraba y la borraba; la primera acababa
+  // borrando dist/src sin nada que devolver. Con el cerrojo, quien llega
+  // segundo espera; y la copia solo se toca con el cerrojo en la mano.
+  const cerrojo = `${copia}.cerrojo`;
+  if (!tomarCerrojo(cerrojo, leerEspera(process.env.VERIFICAR_IMPACTO_ESPERA_S))) return 1;
+  let habiaDist = false;
+  try {
+    restaurarHuerfana(copia, distSrc);
+    mkdirSync(copia, { recursive: true });
+    habiaDist = existsSync(distSrc);
+    if (habiaDist) cpSync(distSrc, path.join(copia, 'src'), { recursive: true });
+    // El marcador va el ultimo: sin el, la copia esta a medias y no se restaura.
+    writeFileSync(path.join(copia, MARCADOR), JSON.stringify({ dirPlugin, habiaDist, pid: process.pid }));
+  } catch (e) {
+    soltarCerrojo(cerrojo);
+    throw e;
+  }
   try {
     if (existsSync(path.join(dirPlugin, 'package.json'))) {
       const scripts = JSON.parse(readFileSync(path.join(dirPlugin, 'package.json'), 'utf8')).scripts ?? {};
@@ -425,12 +445,103 @@ function main(argv) {
     console.log(`[verificar-impacto] node --test termino con ${String(r.status)} en ${((Date.now() - inicio) / 1000).toFixed(1)} s.`);
     return r.status ?? 1;
   } finally {
-    devolver(copia, distSrc, habiaDist);
+    try {
+      devolver(copia, distSrc, habiaDist);
+    } finally {
+      soltarCerrojo(cerrojo);
+    }
   }
 }
 
 const MARCADOR = 'marcador.json';
 
+/** TASK-136: espera maxima por el cerrojo, en segundos (VERIFICAR_IMPACTO_ESPERA_S; 30 min por defecto). */
+const ESPERA_POR_DEFECTO_S = 1800;
+const REINTENTO_MS = 500;
+
+function leerEspera(valor) {
+  const n = Number(valor);
+  return valor !== undefined && valor.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : ESPERA_POR_DEFECTO_S;
+}
+
+function dormir(ms) {
+  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
+}
+
+/** true si existe un proceso con ese pid (EPERM: existe, pero es de otro usuario). */
+function procesoVivo(pid) {
+  if (!Number.isInteger(pid) || pid <= 0) return false;
+  try {
+    process.kill(pid, 0);
+    return true;
+  } catch (e) {
+    return e.code === 'EPERM';
+  }
+}
+
+function pidDelCerrojo(cerrojo) {
+  try {
+    return JSON.parse(readFileSync(cerrojo, 'utf8')).pid;
+  } catch {
+    return null;
+  }
+}
+
+/**
+ * TASK-136: toma el cerrojo (fichero creado con `wx`, la unica operacion
+ * atomica de todo esto) o espera a quien lo tenga. Un cerrojo con el pid de
+ * un proceso que ya no existe, o ilegible, es de una ejecucion cortada: se
+ * borra y se vuelve a intentar (otra puede ganar la carrera; entonces se la
+ * espera). false si la espera se agota, con el motivo ya impreso.
+ */
+function tomarCerrojo(cerrojo, esperaS) {
+  const limite = Date.now() + esperaS * 1000;
+  let avisado = false;
+  let dudaIlegible = false;
+  for (;;) {
+    try {
+      writeFileSync(cerrojo, JSON.stringify({ pid: process.pid, desde: new Date().toISOString() }), { flag: 'wx' });
+      return true;
+    } catch (e) {
+      if (e.code !== 'EEXIST') throw e;
+    }
+    const pid = pidDelCerrojo(cerrojo);
+    if (!procesoVivo(pid)) {
+      // Ilegible puede ser un cerrojo a medio escribir: se le da un reintento antes de tomarlo por cortado.
+      if (pid === null && existsSync(cerrojo) && !dudaIlegible) {
+        dudaIlegible = true;
+        dormir(REINTENTO_MS);
+        if (pidDelCerrojo(cerrojo) !== null) continue;
+      }
+      console.log(
+        `[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid ${String(pid)}, ${cerrojo}). Lo tomo.`
+      );
+      rmSync(cerrojo, { force: true });
+      continue;
+    }
+    if (Date.now() >= limite) {
+      console.error(
+        `[ERROR] verificar-impacto: otra verificacion (pid ${String(pid)}) tiene el cerrojo ${cerrojo} y no ha terminado en ` +
+          `${String(esperaS)} s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. ` +
+          'No se ha tocado dist/src.'
+      );
+      return false;
+    }
+    if (!avisado) {
+      avisado = true;
+      console.log(
+        `[verificar-impacto] Otra verificacion esta en marcha sobre este plugin: espero a la ejecucion ${String(pid)} que tiene el cerrojo (${cerrojo}).`
+      );
+    }
+    dormir(REINTENTO_MS);
+  }
+}
+
+/** Suelta el cerrojo solo si sigue siendo de este proceso. */
+function soltarCerrojo(cerrojo) {
+  if (pidDelCerrojo(cerrojo) === process.pid) rmSync(cerrojo, { force: true });
+}
+
 /** Carpeta de la copia de dist/src: fija por plugin, para encontrarla si una ejecucion se corta. */
 export function dirCopia(dirPlugin) {
   const hash = createHash('sha256').update(path.resolve(dirPlugin).toLowerCase()).digest('hex').slice(0, 12);
@@ -438,6 +549,16 @@ export function dirCopia(dirPlugin) {
 }
 
 function devolver(copia, distSrc, habiaDist) {
+  // TASK-136: segunda barrera. Sin copia que devolver, borrar dist/src lo
+  // perderia entero (bin/taskctl dejaria de arrancar): se deja como esta.
+  if (habiaDist && !existsSync(path.join(copia, 'src'))) {
+    console.log(
+      `[verificar-impacto] AVISO: no encuentro la copia de dist/src en ${copia}; dejo dist/src como esta. ` +
+        'Si git status lo marca cambiado, "npm run build" lo regenera.'
+    );
+    rmSync(copia, { recursive: true, force: true });
+    return;
+  }
   rmSync(distSrc, { recursive: true, force: true });
   if (habiaDist) cpSync(path.join(copia, 'src'), distSrc, { recursive: true });
   rmSync(copia, { recursive: true, force: true });
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-136/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-136/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-136/tarea.md                                    | 3 ++-
 3 files changed, 2 insertions(+), 1 deletion(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 95 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++--
 1 file changed, 93 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0 (resultado guardado: el arbol no ha cambiado desde la ultima ejecucion)
- Duracion: 302.8 s
- Commit verificado: c28556de1354dddae973ac191a1e5148947d7b6a
- Huella: 6d91d06a50ce8c6da48b689621a5468b06949a22
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 63414 bytes en total):

````
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.5889ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (0.9624ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (11.7253ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (15.1256ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.7244ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (5.1174ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.901ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.4707ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (83.3881ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (4.1827ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (1.1418ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.6103ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.438ms)
✔ un test cambiado se corre solo el (4738.8268ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (3421.963ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (10869.0653ms)
✔ un cambio sin commitear tambien cuenta (2957.5236ms)
✔ un helper de test elige los tests que lo importan (2872.5861ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (7796.0625ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (4454.1209ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (2588.8548ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (4919.9955ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (17352.6226ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) (7065.0184ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (13382.5983ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (14199.4815ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (10089.7477ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (5790.6243ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (12793.0335ms)
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (5126.1211ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (6152.5555ms)
ℹ tests 653
ℹ suites 0
ℹ pass 653
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 142952.4943
[verificar-impacto] node --test termino con 0 en 143.2 s.
````
