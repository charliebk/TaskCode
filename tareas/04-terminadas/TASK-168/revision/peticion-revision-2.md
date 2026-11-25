# Peticion de revision — TASK-168 (ronda 2)

- Tarea: TASK-168 — Agilidad: un cambio solo en md de skills o agentes se verifica con sus tests
- Rama revisada: fix/task-168-agilidad-un-cambio-solo-en-md-de-skills
- Rama base: develop
- Commit revisado (HEAD): c879a368c2e0b4c30a383aaeceeb2ebc3ddee689
- Fecha: 2026-11-25
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-168 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 27e0f1c422216587f88a799b2182beaab3331122 (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (4 hallazgo(s)))

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

- tareas/03-en-revision/TASK-168/tarea.md
- tareas/03-en-revision/TASK-168/planificacion/
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:318 | informe-revision-1.md |

## Commits a revisar (git log 27e0f1c422216587f88a799b2182beaab3331122..HEAD)

````
c879a36 docs(TASK-168): autorrevision de la ronda 1
811ca47 fix(TASK-168): ronda 1, SKILL.md nombrado fuera de comentarios y forma de ruta con test
b78faac chore(TASK-168): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 27e0f1c422216587f88a799b2182beaab3331122..HEAD)

````diff
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
index 2b7b230..eb6e9a6 100644
--- a/scripts/verificar-impacto.mjs
+++ b/scripts/verificar-impacto.mjs
@@ -98,10 +98,11 @@ export const ENRUTADOR = 'src/cli.ts';
  * fuera: en TASK-139b un rojo suyo solo lo vio la suite completa de finish.
  * `docs` va acotado a la carpeta del plugin (`PLUGIN_ROOT, 'docs'`): media
  * suite usa `'docs'` para los repos temporales de sus pruebas.
+ *
+ * TASK-168: `skills` y `agents` solo entre comillas (`'skills'`, `"skills/..."`).
+ * Antes valia cualquier `/skills/`, y un comentario que citaba
+ * `test/skills/x.test.ts` elegia a su fichero y a todo lo que lo importa.
  */
-// TASK-168: solo la cadena entre comillas (`'skills'`, `"skills/..."`). Antes
-// valia cualquier `/skills/`, y un comentario que citaba `test/skills/x.test.ts`
-// elegia a su fichero y a todo lo que lo importa (~1800 tests por un .md).
 const CARPETAS_LEIDAS = [
   { carpeta: 'skills', patron: /['"]skills['"/]/ },
   { carpeta: 'agents', patron: /['"]agents['"/]/ },
@@ -109,6 +110,15 @@ const CARPETAS_LEIDAS = [
 ];
 /** La carpeta de CARPETAS_LEIDAS bajo la que vive `rel` (relativa al plugin), o undefined. */
 const carpetaLeida = (rel) => CARPETAS_LEIDAS.find((c) => rel.startsWith(`${c.carpeta}/`));
+/**
+ * TASK-168: el texto sin comentarios de bloque ni de linea (`//` y `#` al
+ * principio de linea). Aproximado a proposito: basta para que una mencion en
+ * un comentario no cuente como uso; un `//` dentro de una cadena recorta de
+ * mas, que solo puede hacer que se elija algo de menos en ese fichero.
+ */
+function sinComentarios(texto) {
+  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1').replace(/^\s*#.*$/gm, '');
+}
 const LANZA_TASKCTL = MARCADORES[0].patron;
 const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
 
@@ -314,11 +324,17 @@ export function seleccionar(cambiadas, nodos, tope = TOPE_POR_DEFECTO) {
     const marcados = [...nodos].filter(([, n]) => MARCADORES.some((m) => enPlugin && m.dependeDe(rel) && m.patron.test(n.texto)));
     const nombre = path.posix.basename(ruta);
     // TASK-168: un nombre generico (`SKILL.md`, el de cada skill) no basta:
-    // tiene que aparecer tambien la carpeta de esa skill (`'plan'` o `plan/SKILL.md`).
+    // tiene que aparecer tambien la carpeta de esa skill (`'plan'` o `plan/SKILL.md`),
+    // y fuera de los comentarios (IMP-1 de su revision: src/commands/review.ts cita
+    // SKILL.md y 'plan' en comentarios y arrastraba a sus ~100 importadores).
     const carpetaSkill = enPlugin && nombre === 'SKILL.md' ? path.posix.basename(path.posix.dirname(rel)) : null;
-    const loNombra = (texto) =>
-      texto.includes(nombre) &&
-      (carpetaSkill === null || texto.includes(`${carpetaSkill}/${nombre}`) || new RegExp(`['"]${carpetaSkill}['"]`).test(texto));
+    const carpetaEntreComillas =
+      carpetaSkill === null ? null : new RegExp(`['"]${carpetaSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
+    const loNombra = (texto) => {
+      if (carpetaSkill === null) return texto.includes(nombre);
+      const codigo = sinComentarios(texto);
+      return codigo.includes(nombre) && (codigo.includes(`${carpetaSkill}/${nombre}`) || carpetaEntreComillas.test(codigo));
+    };
     const porNombre = marcados.length > 0 ? marcados : [...nodos].filter(([, n]) => loNombra(n.texto));
     // TASK-156: y los tests que leen la carpeta entera (skills/, agents/, docs/ del plugin).
     const leida = enPlugin ? carpetaLeida(rel) : undefined;
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 27e0f1c422216587f88a799b2182beaab3331122..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-168/planificacion/brainstorm/peticion-plan-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-168/planificacion/plan-final.md                 |   0
 tareas/03-en-revision/TASK-168/revision/informe-revision-1.md                               |  28 ++++++++++++++++
 tareas/03-en-revision/TASK-168/revision/peticion-revision-1.md                              | 180 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-168/tarea.md                                    |  16 +++++++--
 5 files changed, 221 insertions(+), 3 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 27e0f1c422216587f88a799b2182beaab3331122..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts | 13 ++++++++++---
 1 file changed, 10 insertions(+), 3 deletions(-)
````
## Candidatos 4D

Pistas generadas desde el diff, no hallazgos: comprueba cada una (Regla 4D de `revision.md`).

### Posible duplicacion con lo que ya existia

Definiciones nuevas con nombre igual o parecido a otra de la rama base. Mira si hacen lo mismo con pequenas diferencias (duplicacion real = IMPORTANTE).

- `sinComentarios` (scripts/verificar-impacto.mjs:119) ~ `sinComentariosC` (taskcode-marketplace/plugins/taskcode-plugin/src/core/doctor-deploy-reglas.ts:85)


## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 206.2 s
- Commit verificado: c879a368c2e0b4c30a383aaeceeb2ebc3ddee689
- Huella: 1e38fba221410b87e025f8101ebaf487b0a8df98
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 72376 bytes en total):

````
✔ un test cambiado se corre solo el (4549.9516ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (2335.4348ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (8439.5117ms)
✔ un cambio sin commitear tambien cuenta (1646.5133ms)
✔ un helper de test elige los tests que lo importan (2105.0339ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (5996.8075ms)
✔ TASK-156: un .md de skills/, agents/ o docs/ del plugin elige los tests que leen su carpeta, ademas de los que lo nombran (16975.7434ms)
✔ TASK-168: un .md de skill o agente no elige a quien solo cita test/skills/ en un comentario ni a quien nombra el SKILL.md de otra skill (5019.3764ms)
✔ ante la duda, la suite entera: transversales y ficheros sin test (26205.2512ms)
✔ base inexistente: sale con 1 y dice que la rama base no existe y como arreglarlo (5714.8483ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (4504.1099ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (11631.5059ms)
✔ los tests que lanza no heredan RAMA_BASE (el freno siempre la pasa) ni TIPO_VERIFICACION (8100.5689ms)
✔ TASK-139b: con selectiva y un cambio sin test que lo nombre, corre la suite entera (4314.2432ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (3431.6845ms)
✔ TASK-139b: con TIPO_VERIFICACION=selectiva no hay tope; con freno o sin la variable, si (4939.7069ms)
✔ tope: si ni los directos caben, los N mas proximos al modulo cambiado, nunca cero (6709.9135ms)
✔ una ejecucion cortada a mitad: la siguiente restaura dist/src y lo avisa (4539.007ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (2950.8413ms)
✔ TASK-136: dos ejecuciones solapadas terminan las dos y dejan dist/src como estaba; la segunda espera (10449.3381ms)
[ERROR] verificar-impacto: otra verificacion (pid 56068) tiene el cerrojo C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-gxTj0F\x.cerrojo y no ha terminado en 0 s. Espera a que acabe o, si sabes que ese proceso ya no es una verificacion, borra el cerrojo. No se ha tocado dist/src.
[verificar-impacto] AVISO: habia un cerrojo de una ejecucion que ya no existe (pid null, C:\Users\NULLCA~1\AppData\Local\Temp\cerrojo-ilegible-gxTj0F\x.cerrojo). Lo tomo.
✔ TASK-136: un cerrojo con el pid de un proceso muerto no bloquea: se toma, se avisa y el arbol queda limpio (2900.7411ms)
✔ TASK-139a: un cerrojo ilegible se reintenta antes de tomarlo; si en el reintento ya es de un vivo, se le espera (12.0085ms)
✔ TASK-136: con el cerrojo en manos de un proceso vivo y la espera agotada, sale con 1, lo explica y no toca dist/src (2597.8586ms)
✔ TASK-136 (MEN-2): si la copia desaparece a mitad, devolver avisa y no borra dist/src (2844.7107ms)
✔ TASK-136 (MEN-1): un cerrojo muerto solo lo retira quien tiene el .robo; un .robo caducado no bloquea (13312.2869ms)
✔ conDistProtegido (TASK-143c, HAL-2 y HAL-3): devuelve dist/src y suelta el cerrojo aunque fn lance, rechace o sea un thenable sin finally (305.9686ms)
✔ TASK-158c: si HEAD cambia durante la ejecucion, no devuelve la copia de dist/src (es de otro commit) y deja el arbol limpio (1336.9132ms)
✔ TASK-158c: una copia huerfana de otro commit tampoco se devuelve (1354.7138ms)
✔ TASK-158c (MEN-1 de su revision): con dist/src sin versionar, un cambio de HEAD no lo borra ni dice que salio de Git (638.5428ms)
ℹ tests 732
ℹ suites 0
ℹ pass 732
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 172153.5697
[verificar-impacto] node --test termino con 0 en 172.3 s.
````
