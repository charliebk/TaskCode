# Peticion de revision — TASK-129 (ronda 2)

- Tarea: TASK-129 — Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento
- Rama revisada: feature/task-129-freno-al-crecimiento-de-la-suite-presupu
- Rama base: develop
- Commit revisado (HEAD): 856f3a0e847f3580de54efa4057bc81bd2d439dd
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-129 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 4b82c76b8db6f76a0499506279d6541650117a6e (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-129/tarea.md
- tareas/03-en-revision/TASK-129/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/versiones-metricas.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 3 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts | informe-revision-1.md |

## Commits a revisar (git log 4b82c76b8db6f76a0499506279d6541650117a6e..HEAD)

````
856f3a0 fix(TASK-129): tests de la linea suite, sin cifra con salida recortada en runners que suman y MENORES (IMP-1, IMP-2, MEN-1..3)
4db0c03 chore(TASK-129): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 4b82c76b8db6f76a0499506279d6541650117a6e..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index 6182487..bbd51f2 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -361,8 +361,8 @@ verificacion_pesada_en: [release, hotfix]               # opcional; por defecto
 
 Cada verificación completa (la de `finish` y la de `taskctl verificar-lote`)
 deja en el registro de puertas una línea `suite` con el número de tests que
-dice la salida (node --test, Jest, dotnet, Maven/Gradle, cargo, pytest; `-` si
-no se reconoce) y su duración. `taskctl metricas --por-version` muestra por
+dice la salida (node --test, Jest, dotnet, Maven/Surefire, cargo, pytest; `-`
+si no se reconoce o si la salida se recortó en un runner que suma por módulos) y su duración. `taskctl metricas --por-version` muestra por
 versión el mayor número de tests y la mediana de la duración de la completa, y
 `taskctl doctor` avisa (`crecimiento-suite`) si cualquiera creció más de
 `umbral_crecimiento_suite` (porcentaje entero, 20 por defecto) entre las dos
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
index a1f80b8..0f90232 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts
@@ -219,7 +219,8 @@ function porLoteEnBase(o: PuertaVerificacionOpts, ramaBase: string): boolean {
  * `suite`, modo = numero de tests o `-`), para el aviso de crecimiento.
  */
 export function anotarSuite(cwd: string, id: string, inicioMs: number, r: ResultadoVerificacion): void {
-  const n = contarTests(r.cola);
+  // IMP-2: la cola son los ultimos bytes; si la salida era mayor, se dice.
+  const n = contarTests(r.cola, { recortada: r.bytesTotales > Buffer.byteLength(r.cola, 'utf8') });
   anotarPuerta(cwd, {
     puerta: PUERTA_SUITE,
     tarea: id,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
index 050b21b..c1e2475 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/crecimiento-suite.ts
@@ -31,10 +31,15 @@ function ultimo(texto: string, re: RegExp): number | null {
 /**
  * Numero de tests de la salida de un runner. Reconoce, por este orden:
  * node --test (`ℹ tests N` / `# tests N`), Jest/Vitest (`Tests: … N total`),
- * dotnet (`Total tests: N`), Maven/Gradle (ultimo `Tests run: N`), cargo
+ * dotnet (`Total tests: N`), Maven/Surefire (ultimo `Tests run: N`), cargo
  * (suma de `test result: … N passed; M failed`) y pytest (`N passed, M failed`).
+ *
+ * IMP-2 (revision TASK-129): con `recortada` (solo se tiene el final de la
+ * salida), los runners que suman resumenes repartidos por la salida (cargo con
+ * varios crates, Maven multimodulo) darian una cifra a la baja: null (sin
+ * dato). Los que dejan el total al final (node, Jest, dotnet, pytest) valen.
  */
-export function contarTests(salida: string): number | null {
+export function contarTests(salida: string, opciones: { recortada?: boolean } = {}): number | null {
   const t = salida.replace(/\x1b\[[0-9;]*m/g, '');
   const node = ultimo(t, /^\s*(?:ℹ|#)\s+tests\s+(\d+)\s*$/gm);
   if (node !== null) return node;
@@ -42,6 +47,8 @@ export function contarTests(salida: string): number | null {
   if (jest !== null) return jest;
   const dotnet = ultimo(t, /Total tests:\s*(\d+)/g);
   if (dotnet !== null) return dotnet;
+  const pytestFinal = /=+\s*(?:(\d+) failed,\s*)?(\d+) passed/.exec(t);
+  if (opciones.recortada === true && pytestFinal === null) return null;
   const maven = ultimo(t, /Tests run:\s*(\d+)/g);
   if (maven !== null) return maven;
   const cargo = sumar(t, /test result: \w+\.\s+(\d+) passed;\s+(\d+) failed/g);
````

## Excluido del diff (15 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 4b82c76b8db6f76a0499506279d6541650117a6e..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/peticion-brainstorm-dominio-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/salida-brainstorm-dominio-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/brainstorm/salida-brainstorm-testing-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-129/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-129/revision/informe-revision-1.md                                                  |  21 +++
 tareas/03-en-revision/TASK-129/revision/peticion-revision-1.md                                                 | 795 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-129/tarea.md                                                       |  11 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/finish-verificacion.js                          |   3 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/crecimiento-suite.js                                |  12 +-
 15 files changed, 837 insertions(+), 5 deletions(-)
````

## Tests del diff (4 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 4b82c76b8db6f76a0499506279d6541650117a6e..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/versiones-metricas.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-verificacion.test.ts | 12 +++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts      |  9 ++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/test/core/crecimiento-suite.test.ts       | 18 ++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/core/versiones-metricas.test.ts      | 12 ++++++++++++
 4 files changed, 49 insertions(+), 2 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 106.8 s
- Commit verificado: 856f3a0e847f3580de54efa4057bc81bd2d439dd
- Huella: e620c9c7806576d46089bad0be1c363e37f97489
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 108672 bytes en total):

````
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (4.667ms)
✔ tareasQueBloquean: una tarea en curso de la misma persona bloquea (0.8357ms)
✔ tareasQueBloquean: las tareas de otra persona no bloquean (0.3979ms)
✔ tareasQueBloquean: una tarea sin asignar no bloquea a nadie (0.3713ms)
✔ tareasQueBloquean: la propia tarea que arranca nunca se bloquea a si misma (0.475ms)
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.2903ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.3608ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (52.0553ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (12.987ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (18.9205ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.8912ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.8844ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2465ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.3097ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.3106ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2332ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2266ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.4885ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2898ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.2211ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1952ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.2005ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1871ms)
✔ resolverAsignado: recorta los tres escalones (0.1992ms)
✔ topes: cada .md de skills/ y agents/ tiene tope en la tabla y cabe en el (113.6587ms)
✔ topes: el total de skills/ + agents/ cabe en su tope (25.8653ms)
✔ topes: CLAUDE.md y los documentos de estado del repo caben en el suyo (25.0181ms)
✔ comprobarTopes: un fichero por encima de su tope falla con fichero, bytes, tope y el consejo (1.23ms)
✔ comprobarTopes: justo en el tope pasa; un byte mas, no (0.8598ms)
✔ comprobarTopes: un .md nuevo sin entrada en la tabla falla (1.2404ms)
✔ comprobarTopes: una entrada sin fichero, o un fichero que no existe, falla (0.8479ms)
ℹ tests 966
ℹ suites 0
ℹ pass 966
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 95806.5424
[verificar-impacto] node --test termino con 0 en 95.9 s.
````
