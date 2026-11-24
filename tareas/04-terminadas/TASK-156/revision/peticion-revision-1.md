# Peticion de revision — TASK-156 (ronda 1)

- Tarea: TASK-156 — verificar-impacto elige los tests que leen los md de skills, agents y docs del plugin
- Rama revisada: fix/task-156-verificar-impacto-elige-los-tests-que-le
- Rama base: develop
- Commit revisado (HEAD): d4c51c4b7491e10b6e5691157b5647270a6cb391
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-156 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-156/tarea.md
- tareas/03-en-revision/TASK-156/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Commits a revisar (git log develop..HEAD)

````
d4c51c4 chore(TASK-156): autorrevision
1e158b1 fix(TASK-156): verificar-impacto elige los tests que leen skills, agents y docs del plugin
b38d707 chore(TASK-156): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index d77ab09..090c036 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -23,6 +23,12 @@
  *      `scripts/gitflow/**` (marcador `'scripts', 'gitflow'`); cualquier otro
  *      fichero que no es documentacion, por los tests que mencionan su nombre;
  *      si nadie lo menciona, la suite entera (ante la duda, todo);
+ *    - un fichero bajo `skills/`, `agents/` o `docs/` del plugin (los `.md`
+ *      que instala el plugin) NO es documentacion: hay tests que lo leen.
+ *      Ademas de los que mencionan su nombre, elige los que leen su carpeta
+ *      entera (`'skills'`, `'agents'`, `PLUGIN_ROOT, 'docs'`; ver
+ *      `CARPETAS_LEIDAS`), como `test/skills/task-workflow.test.ts`, que
+ *      vigila todas las skills sin nombrar ninguna (TASK-156);
  *    - `package.json`, `package-lock.json` y `tsconfig.json`: harian falta la
  *      suite entera; se corren los tests que los nombran (con el tope de abajo)
  *      y la completa queda para antes de publicar;
@@ -39,7 +45,8 @@
  * minimo 1) directos mas proximos: primero los tests cambiados, luego los que
  * se llaman como el modulo cambiado (`finish*` para `src/commands/finish.ts`),
  * luego los de una carpeta con el nombre de la suya (`test/gitflow/` para
- * `scripts/gitflow/*`) y despues el resto por orden alfabetico. La salida dice
+ * `scripts/gitflow/*`, `test/skills/` para `skills/<x>/*`) y despues el resto
+ * por orden alfabetico. La salida dice
  * cuantos se dejan fuera. Nunca queda en cero lo que cambia si tiene tests.
  * Con TIPO_VERIFICACION=selectiva (rondas de review y finish, TASK-139b) no
  * hay tope: todos los afectados, y la suite entera si no se sabe que afecta. El
@@ -81,6 +88,23 @@ const MARCADORES = [
 ];
 /** El enrutador de comandos (ver testsQueDependenDe); es lo que carga `bin/taskctl`. */
 export const ENRUTADOR = 'src/cli.ts';
+/**
+ * TASK-156: carpetas del plugin que los tests leen enteras (recorren la
+ * carpeta, o componen la ruta) sin nombrar cada fichero. Un fichero cambiado
+ * bajo ellas elige, ademas de los tests que mencionan su nombre, los que leen
+ * su carpeta. Sin esto, un `.md` de skill solo elegia a quien lo nombra y
+ * `test/skills/task-workflow.test.ts` (que vigila todas las skills) quedaba
+ * fuera: en TASK-139b un rojo suyo solo lo vio la suite completa de finish.
+ * `docs` va acotado a la carpeta del plugin (`PLUGIN_ROOT, 'docs'`): media
+ * suite usa `'docs'` para los repos temporales de sus pruebas.
+ */
+const CARPETAS_LEIDAS = [
+  { carpeta: 'skills', patron: /['"]skills['"]|['"/]skills\// },
+  { carpeta: 'agents', patron: /['"]agents['"]|['"/]agents\// },
+  { carpeta: 'docs', patron: /PLUGIN_ROOT\s*,\s*['"]docs['"]/ },
+];
+/** La carpeta de CARPETAS_LEIDAS bajo la que vive `rel` (relativa al plugin), o undefined. */
+const carpetaLeida = (rel) => CARPETAS_LEIDAS.find((c) => rel.startsWith(`${c.carpeta}/`));
 const LANZA_TASKCTL = MARCADORES[0].patron;
 const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
 
@@ -280,7 +304,11 @@ export function seleccionar(cambiadas, nodos, tope = TOPE_POR_DEFECTO) {
     // Ficheros que los tests usan sin importarlos.
     const marcados = [...nodos].filter(([, n]) => MARCADORES.some((m) => enPlugin && m.dependeDe(rel) && m.patron.test(n.texto)));
     const nombre = path.posix.basename(ruta);
-    const mencionan = marcados.length > 0 ? marcados : [...nodos].filter(([, n]) => n.texto.includes(nombre));
+    const porNombre = marcados.length > 0 ? marcados : [...nodos].filter(([, n]) => n.texto.includes(nombre));
+    // TASK-156: y los tests que leen la carpeta entera (skills/, agents/, docs/ del plugin).
+    const leida = enPlugin ? carpetaLeida(rel) : undefined;
+    const lectores = leida === undefined ? [] : [...nodos].filter(([f, n]) => esTest(f) && leida.patron.test(n.texto));
+    const mencionan = [...new Map([...porNombre, ...lectores]).entries()];
     if (mencionan.length === 0) {
       todo ??= `ningun test referencia ${ruta}: ante la duda, la suite entera (la completa queda para antes de publicar)`;
       continue;
@@ -340,8 +368,11 @@ function proximidad(fichero, directo) {
   for (const origen of directo.origenes) {
     const modulo = path.posix.basename(origen).replace(/\.[^.]+$/, '').replace(/^_+/, '');
     const carpeta = path.posix.basename(path.posix.dirname(origen));
+    // TASK-156: `skills/plan/SKILL.md` tambien esta cerca de `test/skills/`.
+    const leida = origen.startsWith(`${PLUGIN}/`) ? carpetaLeida(origen.slice(PLUGIN.length + 1))?.carpeta : undefined;
     if (modulo !== '' && base.startsWith(modulo)) p = Math.min(p, 1);
     else if (!['src', 'test', 'helpers', '.', ''].includes(carpeta) && carpetas.includes(carpeta)) p = Math.min(p, 2);
+    else if (leida !== undefined && carpetas.includes(leida)) p = Math.min(p, 2);
   }
   return p;
 }
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-156/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-156/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-156/tarea.md                                    | 9 +++++++--
 3 files changed, 7 insertions(+), 2 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 40 ++++++++++++++++++++++++++++++++++++++++
 1 file changed, 40 insertions(+)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

Sin candidatos: ninguna definicion nueva se parece a otra y ningun test nuevo promete algo que haya que mutar.


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 442.9 s
- Commit verificado: d4c51c4b7491e10b6e5691157b5647270a6cb391
- Huella: 3eab34012940f4050868b67e3b87ca6caab144db
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 71020 bytes en total):

````
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.8935ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (1.0283ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.5242ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5315ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.4006ms)
✔ un test cambiado se corre solo el (7669.2662ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (3415.6158ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (14279.952ms)
✔ un cambio sin commitear tambien cuenta (2589.8652ms)
✔ un helper de test elige los tests que lo importan (2941.5181ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (10940.4219ms)
✔ TASK-156: un .md de skills/, agents/ o docs/ del plugin elige los tests que leen su carpeta, ademas de los que lo nombran (14708.1336ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (9603.6632ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (4522.7676ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (9181.0576ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (42316.1513ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) ni TIPO_VERIFICACION (35356.6179ms)
✔ TASK-139b: con selectiva y un cambio sin test que lo nombre, corre la suite entera (28897.9034ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (19095.1909ms)
✔ TASK-139b: con TIPO_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (23799.6274ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (66287.5846ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (17977.2489ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (15174.2761ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (20204.3323ms)
[ERROR] verificar-impacto: otra verificacion (pid 24852) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-B4h8me\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-B4h8me\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (14159.0133ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (46.6211ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (9895.2783ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (11941.6234ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (21649.9784ms)
ℹ tests 720
ℹ suites 0
ℹ pass 720
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 415040.9757
[verificar-impacto] node --test termino con 0 en 415.4 s.
````
