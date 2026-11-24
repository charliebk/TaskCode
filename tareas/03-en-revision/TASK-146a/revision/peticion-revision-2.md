# Peticion de revision — TASK-146a (ronda 2)

- Tarea: TASK-146a — import, roadmap y verificar-lote (parte a de TASK-146)
- Rama revisada: fix/task-146-regla-4d-duplicacion-en-new-import-roadm
- Rama base: develop
- Commit revisado (HEAD): c1509287d75d7f45bfef1bb6f54ec75df0b3c81d
- Fecha: 2026-11-24
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Modelo sugerido para esta ronda: haiku (verificacion de correcciones; la tarea usa sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-146a (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde 4c04dffb5346185a07a4aea031b358227dbe2246 (el commit revisado en la ronda anterior)
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

- tareas/03-en-revision/TASK-146a/tarea.md
- tareas/03-en-revision/TASK-146a/planificacion/
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts

## Hallazgos de la ronda 1 pendientes de verificar

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

Tus 2 hallazgo(s) MENOR de la ronda 1 no estan en la tabla: los comprueba quien coordina. No los revises de nuevo, ni el resto de la rama.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts:120 | informe-revision-1.md |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts:68 | informe-revision-1.md |

## Commits a revisar (git log 4c04dffb5346185a07a4aea031b358227dbe2246..HEAD)

````
c150928 chore(TASK-146a): autorrevision ronda 2
de2a5bd fix(TASK-146a): tests de las protecciones de verificar-lote, fallido de --comparar y orden numerico (IMP-1, IMP-2, MEN-1, MEN-3)
cbdab64 chore(TASK-146a): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff 4c04dffb5346185a07a4aea031b358227dbe2246..HEAD)

````diff
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
index 7b00a4f..d18f1be 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/roadmap.ts
@@ -99,8 +99,11 @@ export function runRoadmapCommand(repoCwd: string, argv: readonly string[]): Roa
   // (sincronizacion, mayusculas, cambios sin commitear, marca), no unas reglas
   // propias de --comparar que se quedaban cortas.
   const decision = prepararRoadmap(repoCwd, 'transicion', { escribir: false });
-  if (decision.estado === 'omitido' || decision.estado === 'fallido') {
+  if (decision.estado === 'omitido') {
     lineas.push(`Las transiciones no lo tocan: ${decision.motivo ?? 'motivo desconocido'}`);
+  } else if (decision.estado === 'fallido') {
+    // MEN-1 (revision TASK-146a): una transicion lo intentaria y fallaria; no es que no lo toque.
+    lineas.push(`Una transicion intentaria regenerarlo y fallaria: ${decision.motivo ?? 'motivo desconocido'}`);
   } else {
     lineas.push(`${ROADMAP_RUTA} lleva la marca de taskctl: las transiciones lo regeneran.`);
   }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
index 431555e..a918a3c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/verificar-lote.ts
@@ -46,6 +46,8 @@ export interface VerificarLoteDeps {
   timeoutMs?: number;
   /** Progreso visible (por defecto, bajo el .git del repo). MEN-3: el comando recibe el contador. */
   progreso?: Progreso;
+  /** Solo para tests (TASK-146a, IMP-1): sustituye a headCommit, para provocar un fallo de git. */
+  commitDeHead?: (cwd: string) => string;
 }
 
 export interface VerificarLoteResult {
@@ -118,7 +120,7 @@ export async function runVerificarLoteCommand(
   }
   const ids = pendientes.map((t) => t.task.id);
   // TASK-146a (CMD2-10): headCommit lanza si git falla (antes «lote en verde en » sin commit).
-  const commit = headCommit(cwd);
+  const commit = (deps.commitDeHead ?? headCommit)(cwd);
   const timeoutS = config.timeout_verificacion;
   const inicio = Date.now();
   // MEN-3 (revision TASK-115): como finish, el paso se ve y el comando recibe el contador (TASKCTL_PROGRESO).
````

## Excluido del diff (11 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff 4c04dffb5346185a07a4aea031b358227dbe2246..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-146a/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-146a/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-146a/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-146a/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-146a/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-146a/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-146a/revision/informe-revision-1.md                                                  |  64 ++++++++++
 tareas/03-en-revision/TASK-146a/revision/peticion-revision-1.md                                                 | 514 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-146a/tarea.md                                                       |  16 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/roadmap.js                                       |   6 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/verificar-lote.js                                |   2 +-
 11 files changed, 597 insertions(+), 5 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff 4c04dffb5346185a07a4aea031b358227dbe2246..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/commands/roadmap-ajenos.test.ts | 15 +++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificar-lote.test.ts | 44 ++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 59 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 122.3 s
- Commit verificado: c1509287d75d7f45bfef1bb6f54ec75df0b3c81d
- Huella: 968b7140ee7c37bd468be426079e1d1fabf2a2c1
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 121826 bytes en total):

````
✔ esSoloVago: solo palabras vagas y vacias; cualquier palabra concreta lo salva (0.3447ms)
✔ planEsEsqueleto: la plantilla (o solo cabeceras) es esqueleto; una linea propia lo salva (1.0074ms)
✔ casillasSinMarcar: cuenta solo las normales sin marcar; ignora "Tras el cierre" y otras secciones (2.6528ms)
✔ casillasSinMarcar (MEN-6 de su revision): un ### posterior a "Tras el cierre" vuelve a contar (1.3697ms)
✔ esSoloVago y tieneAncla (MEN-1 y MEN-2 de su revision): femeninos, conjugadas y barras sueltas (1.7491ms)
✔ TASK-153a: faltaReutilizacion usa el mismo contenido real que la autorrevision (2.1741ms)
✔ decidirVerificacion: solo documentacion unicamente cuando se puede afirmar (4.8481ms)
✔ patronesDocumentacion: tareas/ cuenta siempre; documentacionDeclarada solo con rutas (1.9783ms)
✔ config (TASK-100): claves nuevas, sin anclar, y van con comando_verificacion (5.6089ms)
✔ anotarVerificacionDocumentacion: crea la seccion y en un reintento anade la linea (1.9446ms)
✔ anotarVerificacionParcial (TASK-106): crea su seccion, no duplica un reintento igual y no toca la de documentacion (0.9643ms)
✔ anotarCompletaTrasParcial (TASK-106, MEN-1): sin seccion no anota; tras selectiva, completa y selectiva, la ultima linea es la selectiva (1.4543ms)
✔ rutasDeTarea: null si la base no existe; tildes y espacios salen tal cual (1816.7777ms)
✔ rutasDeTarea: desde una subcarpeta ve el codigo de fuera y los patrones son relativos a la raiz (1569.4568ms)
✔ config (TASK-100): un patron que casa con todo se rechaza (2.5144ms)
✔ anotarVerificacionDocumentacion: un reintento con lo mismo no duplica la linea (1.3069ms)
✔ decidirVerificacion (TASK-096): selectiva solo si todo el codigo cae en las rutas parciales (0.9244ms)
✔ decidirVerificacion (TASK-096): sin la clave, o sin selectiva, la decision es la de la 0.14.0 (0.6727ms)
✔ config (TASK-096): rutas_verificacion_parcial es conocida, va con la selectiva y rechaza lo que casa con todo (1.9871ms)
✔ config (TASK-109): el error de forma de cada clave de patrones lleva su propio ejemplo (1.1166ms)
✔ compararVersiones: por componentes numericos, y la pre-release antes de su release (4.0741ms)
✔ calcularPorVersion: agrupa las terminadas por version de cierre; sin version aparte; las no terminadas fuera (10.2659ms)
✔ resumirVersion sin tareas: n 0, cifras null y conteos a cero (nunca NaN) (0.8397ms)
✔ formatearPorVersion: tablas en orden semver, «sin version» al final solo si hay, y la nota (3.7332ms)
✔ por version (TASK-129, MEN-1): columnas tests (el mayor) y completa (mediana), con «—» sin dato (1.737ms)
✔ ESTADOS_QUE_OCUPAN_WIP: en-curso y en-revision, y solo esos (3.4826ms)
✔ tareasQueBloquean: quien bloquea, quien no, orden por ID y comparacion de persona recortada (1.5839ms)
✔ mensajeWipExcedido: nombra tarea, carpeta y rama; dice que hacer; lista todas las bloqueantes (0.8698ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.4007ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar; recorta los espacios de alrededor (0.5159ms)
✔ resolverAsignado: precedencia flag > previo > identidad Git > null, con recorte (0.5412ms)
ℹ tests 790
ℹ suites 0
ℹ pass 790
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 106373.1017
[verificar-impacto] node --test termino con 0 en 106.5 s.
````
