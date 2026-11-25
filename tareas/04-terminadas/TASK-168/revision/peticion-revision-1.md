# Peticion de revision — TASK-168 (ronda 1)

- Tarea: TASK-168 — Agilidad: un cambio solo en md de skills o agentes se verifica con sus tests
- Rama revisada: fix/task-168-agilidad-un-cambio-solo-en-md-de-skills
- Rama base: develop
- Commit revisado (HEAD): 27e0f1c422216587f88a799b2182beaab3331122
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-168 (criterios de aceptacion y plan)
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

- tareas/03-en-revision/TASK-168/tarea.md
- tareas/03-en-revision/TASK-168/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Commits a revisar (git log develop..HEAD)

````
27e0f1c docs(TASK-168): autorrevision
9ab29dd fix(TASK-168): un md de skill o agente elige solo los tests que lo leen
c2d80a7 chore(TASK-168): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index 64bc3e9..2b7b230 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -99,9 +99,12 @@ export const ENRUTADOR = 'src/cli.ts';
  * `docs` va acotado a la carpeta del plugin (`PLUGIN_ROOT, 'docs'`): media
  * suite usa `'docs'` para los repos temporales de sus pruebas.
  */
+// TASK-168: solo la cadena entre comillas (`'skills'`, `"skills/..."`). Antes
+// valia cualquier `/skills/`, y un comentario que citaba `test/skills/x.test.ts`
+// elegia a su fichero y a todo lo que lo importa (~1800 tests por un .md).
 const CARPETAS_LEIDAS = [
-  { carpeta: 'skills', patron: /['"]skills['"]|['"/]skills\// },
-  { carpeta: 'agents', patron: /['"]agents['"]|['"/]agents\// },
+  { carpeta: 'skills', patron: /['"]skills['"/]/ },
+  { carpeta: 'agents', patron: /['"]agents['"/]/ },
   { carpeta: 'docs', patron: /PLUGIN_ROOT\s*,\s*['"]docs['"]/ },
 ];
 /** La carpeta de CARPETAS_LEIDAS bajo la que vive `rel` (relativa al plugin), o undefined. */
@@ -310,7 +313,13 @@ export function seleccionar(cambiadas, nodos, tope = TOPE_POR_DEFECTO) {
     // Ficheros que los tests usan sin importarlos.
     const marcados = [...nodos].filter(([, n]) => MARCADORES.some((m) => enPlugin && m.dependeDe(rel) && m.patron.test(n.texto)));
     const nombre = path.posix.basename(ruta);
-    const porNombre = marcados.length > 0 ? marcados : [...nodos].filter(([, n]) => n.texto.includes(nombre));
+    // TASK-168: un nombre generico (`SKILL.md`, el de cada skill) no basta:
+    // tiene que aparecer tambien la carpeta de esa skill (`'plan'` o `plan/SKILL.md`).
+    const carpetaSkill = enPlugin && nombre === 'SKILL.md' ? path.posix.basename(path.posix.dirname(rel)) : null;
+    const loNombra = (texto) =>
+      texto.includes(nombre) &&
+      (carpetaSkill === null || texto.includes(`${carpetaSkill}/${nombre}`) || new RegExp(`['"]${carpetaSkill}['"]`).test(texto));
+    const porNombre = marcados.length > 0 ? marcados : [...nodos].filter(([, n]) => loNombra(n.texto));
     // TASK-156: y los tests que leen la carpeta entera (skills/, agents/, docs/ del plugin).
     const leida = enPlugin ? carpetaLeida(rel) : undefined;
     const lectores = leida === undefined ? [] : [...nodos].filter(([f, n]) => esTest(f) && leida.patron.test(n.texto));
````

## Excluido del diff (3 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-168/planificacion/brainstorm/peticion-plan-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-168/planificacion/plan-final.md                 | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-168/tarea.md                                    | 8 +++++++-
 3 files changed, 7 insertions(+), 1 deletion(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 28 +++++++++++++++++++++++++---
 1 file changed, 25 insertions(+), 3 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Tests a mutar

Tests nuevos cuyo nombre promete algo comprobable. Rompe a proposito lo que prometen y mira que se ponen rojos (patrones en `disfraz-tests.md`; disfraz real = IMPORTANTE).

- «TASK-168: un .md de skill o agente no elige a quien solo cita test/skills/ en un comentario ni a quien nombra el SKILL.md de otra skill» (taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts:223)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 137.6 s
- Commit verificado: 27e0f1c422216587f88a799b2182beaab3331122
- Huella: 46ff43d4781ced981daca45e3a6a968fed26b633
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 72349 bytes en total):

````
✔ un test cambiado se corre solo el (3468.124ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (1422.3551ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (5722.4365ms)
✔ un cambio sin commitear tambien cuenta (1325.0942ms)
✔ un helper de test elige los tests que lo importan (1943.9244ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (4319.1149ms)
✔ TASK-156: un .md de skills/, agents/ o docs/ del plugin elige los tests que leen su carpeta, ademas de los que lo nombran (8628.7427ms)
✔ TASK-168: un .md de skill o agente no elige a quien solo cita test/skills/ en un comentario ni a quien nombra el SKILL.md de otra skill (3587.8445ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (2986.0993ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (1555.923ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (2354.3993ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (6608.4968ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) ni TIPO_VERIFICACION (3542.0915ms)
✔ TASK-139b: con selectiva y un cambio sin test que lo nombre, corre la suite entera (3861.909ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (2603.0823ms)
✔ TASK-139b: con TIPO_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (4870.8679ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (5748.9156ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (4798.0638ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (3394.4708ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (14001.7045ms)
[ERROR] verificar-impacto: otra verificacion (pid 59536) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-8LdUJ8\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-8LdUJ8\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (6836.1204ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (25.9058ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (4033.3527ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (2872.4963ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (13716.738ms)
✔ conDistProtegido (TASK-143c, HAL-2 y HAL-3): devuelve dist/src y suelta el cerrojo aunque fn lance, rechace o sea un thenable sin finally (376.0539ms)
✔ TASK-158c: si HEAD cambia durante la ejecucion, no devuelve la copia de dist/src (es de otro commit) y deja el arbol limpio (1632.6116ms)
✔ TASK-158c: una copia huerfana de otro commit tampoco se devuelve (1541.0303ms)
✔ TASK-158c (MEN-1 de su revision): con dist/src sin versionar, un cambio de HEAD no lo borra ni dice que salio de Git (973.6978ms)
ℹ tests 732
ℹ suites 0
ℹ pass 732
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 124322.6214
[verificar-impacto] node --test termino con 0 en 124.4 s.
````
