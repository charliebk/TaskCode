# Peticion de revision — TASK-129 (ronda 3)

- Tarea: TASK-129 — Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento
- Rama revisada: feature/task-129-freno-al-crecimiento-de-la-suite-presupu
- Rama base: develop
- Commit revisado (HEAD): fc817709d4cc9c6332fdaad50b959cae0fab4d32
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-129 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 856f3a0e847f3580de54efa4057bc81bd2d439dd (el commit revisado en la ronda anterior)
- Alcance: verificacion acotada al diff de las correcciones (motivo: la ronda anterior pidio cambios (3 hallazgo(s)))

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
informe de esta ronda (informe-revision-3.md), sin borrar la peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-129/tarea.md
- tareas/03-en-revision/TASK-129/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts

## Hallazgos de la ronda 2 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts | informe-revision-2.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | informe-revision-2.md |
| IMP-3 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | informe-revision-2.md |

## Commits a revisar (git log 856f3a0e847f3580de54efa4057bc81bd2d439dd..HEAD)

````
fc81770 fix(TASK-129): Maven de un modulo conserva su cifra con salida recortada y test del cableado (IMP-3 ronda 2)
ec00b31 chore(TASK-129): peticion de revision ronda 2
````

## Diff desde la ronda anterior (git diff 856f3a0e847f3580de54efa4057bc81bd2d439dd..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index bbd51f2..a9c64aa 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -362,7 +362,8 @@ verificacion_pesada_en: [release, hotfix]               # opcional; por defecto
 Cada verificación completa (la de `finish` y la de `taskctl verificar-lote`)
 deja en el registro de puertas una línea `suite` con el número de tests que
 dice la salida (node --test, Jest, dotnet, Maven/Surefire, cargo, pytest; `-`
-si no se reconoce o si la salida se recortó en un runner que suma por módulos) y su duración. `taskctl metricas --por-version` muestra por
+si no se reconoce o si la salida se recortó en un runner que suma por módulos: cargo
+con varios crates o Maven multimódulo) y su duración. `taskctl metricas --por-version` muestra por
 versión el mayor número de tests y la mediana de la duración de la completa, y
 `taskctl doctor` avisa (`crecimiento-suite`) si cualquiera creció más de
 `umbral_crecimiento_suite` (porcentaje entero, 20 por defecto) entre las dos
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
index c1e2475..d03a155 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
@@ -37,7 +37,9 @@ function ultimo(texto: string, re: RegExp): number | null {
  * IMP-2 (revision TASK-129): con `recortada` (solo se tiene el final de la
  * salida), los runners que suman resumenes repartidos por la salida (cargo con
  * varios crates, Maven multimodulo) darian una cifra a la baja: null (sin
- * dato). Los que dejan el total al final (node, Jest, dotnet, pytest) valen.
+ * dato). Los que dejan el total al final (node, Jest, dotnet, pytest, y Maven
+ * de un solo modulo, cuyo ultimo `Tests run:` es el total) valen. IMP-3: el
+ * multimodulo se reconoce por su `Reactor Summary`, que va al final.
  */
 export function contarTests(salida: string, opciones: { recortada?: boolean } = {}): number | null {
   const t = salida.replace(/\x1b\[[0-9;]*m/g, '');
@@ -48,9 +50,9 @@ export function contarTests(salida: string, opciones: { recortada?: boolean } =
   const dotnet = ultimo(t, /Total tests:\s*(\d+)/g);
   if (dotnet !== null) return dotnet;
   const pytestFinal = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
-  if (opciones.recortada === true && pytestFinal === null) return null;
   const maven = ultimo(t, /Tests run:\s*(\d+)/g);
-  if (maven !== null) return maven;
+  if (maven !== null) return opciones.recortada === true && /Reactor Summary/.test(t) ? null : maven;
+  if (opciones.recortada === true && pytestFinal === null) return null;
   const cargo = sumar(t, /test result: \w+\.\s+(\d+) passed;\s+(\d+) failed/g);
   if (cargo !== null) return cargo;
   const pytest = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
````

## Excluido del diff (5 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 856f3a0e847f3580de54efa4057bc81bd2d439dd..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/03-en-revision/TASK-129/revision/informe-revision-1.md                   |  67 ++++++++++++++++++++++++++++---
 tareas/03-en-revision/TASK-129/revision/informe-revision-2.md                   |  21 ++++++++++
 tareas/03-en-revision/TASK-129/revision/peticion-revision-2.md                  | 246 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/03-en-revision/TASK-129/tarea.md                                         |   1 +
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/crecimiento-suite.js |  10 +++--
 5 files changed, 336 insertions(+), 9 deletions(-)
````

## Tests del diff (1 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 856f3a0e847f3580de54efa4057bc81bd2d439dd..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts | 26 +++++++++++++++++++++++++-
 1 file changed, 25 insertions(+), 1 deletion(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 100.7 s
- Commit verificado: fc817709d4cc9c6332fdaad50b959cae0fab4d32
- Huella: e32508fafd41c3612d8834e60d77eda40cee7ece
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 108808 bytes en total):

````
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (5.32ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (3.3069ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.4127ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.2957ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.5139ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.3453ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.6925ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (32.7977ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.3499ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (2.7174ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (3.0144ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4809ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.4467ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.3741ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.3834ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.5195ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2555ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2143ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2857ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.191ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1743ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1771ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.17ms)
✔ resolverAsignado: recorta los tres escalones (0.1664ms)
✔ topes: cada .md de skills/ y agents/ tiene tope en la tabla y cabe en el (103.58ms)
✔ topes: el total de skills/ + agents/ cabe en su tope (92.7489ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (5.273ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (0.9866ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.3816ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (0.4662ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.618ms)
ℹ tests 967
ℹ suites 0
ℹ pass 967
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 90707.7936
[verificar-impacto] node --test termino con 0 en 90.8 s.
````
