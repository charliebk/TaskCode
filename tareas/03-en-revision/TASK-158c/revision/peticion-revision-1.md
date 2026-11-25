# Peticion de revision — TASK-158c (ronda 1)

- Tarea: TASK-158c — verificar-impacto no devuelve dist/src si HEAD cambio (parte c de TASK-158)
- Rama revisada: feature/task-158-regla-4d-preventiva-en-todos-los-proceso
- Rama base: develop
- Commit revisado (HEAD): 9369bf40f67cc106caebd939ba3cd5d755bb219a
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-158c (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-158c/tarea.md
- tareas/03-en-revision/TASK-158c/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Commits a revisar (git log develop..HEAD)

````
9369bf4 docs(TASK-158c): autorrevision
cbdf37f fix(TASK-158c): verificar-impacto no devuelve dist/src si HEAD cambio durante la ejecucion
193f4c7 chore(TASK-158c): tarea en curso
43e7b12 merge(TASK-158c): develop en feature/task-158-regla-4d-preventiva-en-todos-los-proceso para seguir con la parte
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index c3ca6b0..fb1631a 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -522,20 +522,23 @@ export function conDistProtegido(dirPlugin, fn) {
   const cerrojo = `${copia}.cerrojo`;
   if (!tomarCerrojo(cerrojo, leerEspera(process.env.VERIFICAR_IMPACTO_ESPERA_S))) return 1;
   let habiaDist = false;
+  // TASK-158c: el commit del que es la copia; si cambia antes de devolverla, no se devuelve.
+  let head = null;
   try {
     restaurarHuerfana(copia, distSrc);
     mkdirSync(copia, { recursive: true });
     habiaDist = existsSync(distSrc);
+    head = headDe(dirPlugin);
     if (habiaDist) cpSync(distSrc, path.join(copia, 'src'), { recursive: true });
     // El marcador va el ultimo: sin el, la copia esta a medias y no se restaura.
-    writeFileSync(path.join(copia, MARCADOR), JSON.stringify({ dirPlugin, habiaDist, pid: process.pid }));
+    writeFileSync(path.join(copia, MARCADOR), JSON.stringify({ dirPlugin, habiaDist, head, pid: process.pid }));
   } catch (e) {
     soltarCerrojo(cerrojo);
     throw e;
   }
   const cerrar = () => {
     try {
-      devolver(copia, distSrc, habiaDist);
+      devolver(copia, distSrc, habiaDist, head);
     } finally {
       soltarCerrojo(cerrojo);
     }
@@ -692,7 +695,34 @@ export function dirCopia(dirPlugin) {
   return path.join(tmpdir(), `verificar-impacto-${hash}`);
 }
 
-function devolver(copia, distSrc, habiaDist) {
+/** HEAD del repo que contiene `dir`; null fuera de Git. */
+function headDe(dir) {
+  const h = git(['rev-parse', 'HEAD'], dir);
+  return h === null ? null : h.trim();
+}
+
+/**
+ * TASK-158c: devuelve la copia de dist/src, salvo que sea de otro commit.
+ * `head` es el HEAD de cuando se tomo la copia (null fuera de Git o en una
+ * copia vieja sin el dato: se devuelve como antes). Si HEAD cambio entretanto
+ * (el freno `Stop` corriendo mientras `update-fix` tenia otra rama activa,
+ * TASK-145b), la copia es de otra rama: devolverla dejaria dist/src con su
+ * contenido y el arbol sucio. Se deja dist/src como esta en el HEAD de ahora
+ * (dist/src es salida de compilacion versionada) y se avisa.
+ */
+function devolver(copia, distSrc, habiaDist, head = null) {
+  const dirPlugin = path.dirname(path.dirname(distSrc));
+  const ahora = head === null ? null : headDe(dirPlugin);
+  if (ahora !== null && ahora !== head) {
+    git(['checkout', 'HEAD', '--', 'dist/src'], dirPlugin);
+    git(['clean', '-fdq', '--', 'dist/src'], dirPlugin);
+    console.log(
+      `[verificar-impacto] AVISO: HEAD cambio durante la ejecucion (${head.slice(0, 7)} -> ${ahora.slice(0, 7)}): ` +
+        'no devuelvo la copia de dist/src, que es de otro commit; lo dejo como esta en el HEAD actual.'
+    );
+    rmSync(copia, { recursive: true, force: true });
+    return;
+  }
   // TASK-136: segunda barrera. Sin copia que devolver, borrar dist/src lo
   // perderia entero (bin/taskctl dejaria de arrancar): se deja como esta.
   if (habiaDist && !existsSync(path.join(copia, 'src'))) {
@@ -717,8 +747,11 @@ function restaurarHuerfana(copia, distSrc) {
     return;
   }
   let habiaDist = true;
+  let head = null;
   try {
-    habiaDist = JSON.parse(readFileSync(marcador, 'utf8')).habiaDist !== false;
+    const datos = JSON.parse(readFileSync(marcador, 'utf8'));
+    habiaDist = datos.habiaDist !== false;
+    head = typeof datos.head === 'string' ? datos.head : null;
   } catch {
     // marcador ilegible: se asume que habia dist/src
   }
@@ -726,7 +759,7 @@ function restaurarHuerfana(copia, distSrc) {
     `[verificar-impacto] AVISO: una ejecucion anterior se corto a mitad (queda su copia en ${copia}). ` +
       'Restauro dist/src a como estaba antes de ella.'
   );
-  devolver(copia, distSrc, habiaDist);
+  devolver(copia, distSrc, habiaDist, head);
 }
 
 const invocadoDirecto = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-158c/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158c/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158c/planificacion/brainstorm/peticion-brainstorm-testing-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158c/planificacion/brainstorm/peticion-unificador-1.md              | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158c/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158c/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158c/planificacion/brainstorm/salida-brainstorm-testing-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158c/planificacion/plan-final.md                                    | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-158c/tarea.md                                                       | 8 +++++++-
 9 files changed, 7 insertions(+), 1 deletion(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 83 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-
 1 file changed, 82 insertions(+), 1 deletion(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Posible duplicacion con lo que ya existia

Definiciones nuevas con nombre igual o parecido a otra de la rama base. Mira si hacen lo mismo con pequenas diferencias (duplicacion real = IMPORTANTE).

- `devolver` (scripts/verificar-impacto.mjs:713) ~ `devolver` (taskcode-marketplace/plugins/taskcode-plugin/src/fs/pendientes.ts:168)

### Tests a mutar

Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).

- «TASK-158c: si HEAD cambia durante la ejecucion, no devuelve la copia de dist/src (es de otro commit) y deja el arbol limpio» (taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts:681)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 161.2 s
- Commit verificado: 9369bf40f67cc106caebd939ba3cd5d755bb219a
- Huella: 0585d5609de9c8a2fbe4fd367b14ffb543f978d1
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 72065 bytes en total):

````
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.4339ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.3448ms)
✔ un test cambiado se corre solo el (2891.7372ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (1471.2594ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (5404.861ms)
✔ un cambio sin commitear tambien cuenta (1182.1328ms)
✔ un helper de test elige los tests que lo importan (1494.4191ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (4434.7961ms)
✔ TASK-156: un .md de skills/, agents/ o docs/ del plugin elige los tests que leen su carpeta, ademas de los que lo nombran (7182.6413ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (2931.8462ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (1487.5333ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (2408.4136ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (7084.8688ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) ni TIPO_VERIFICACION (3557.3008ms)
✔ TASK-139b: con selectiva y un cambio sin test que lo nombre, corre la suite entera (3539.2299ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (2622.6402ms)
✔ TASK-139b: con TIPO_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (4423.3711ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (6578.225ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (7331.7294ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (15343.8847ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (17307.4457ms)
[ERROR] verificar-impacto: otra verificacion (pid 37740) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-aIoJBh\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-aIoJBh\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (3943.077ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (17.8093ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (3184.4408ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (3628.5761ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (15102.9753ms)
✔ conDistProtegido (TASK-143c, HAL-2 y HAL-3): devuelve dist/src y suelta el cerrojo aunque fn lance, rechace o sea un thenable sin finally (597.7085ms)
✔ TASK-158c: si HEAD cambia durante la ejecucion, no devuelve la copia de dist/src (es de otro commit) y deja el arbol limpio (2624.7115ms)
✔ TASK-158c: una copia huerfana de otro commit tampoco se devuelve (2392.9605ms)
ℹ tests 730
ℹ suites 0
ℹ pass 730
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 135102.6697
[verificar-impacto] node --test termino con 0 en 135.2 s.
````
